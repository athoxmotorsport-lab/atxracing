BEGIN;
ALTER TABLE public.events ADD COLUMN result_publication_state text NOT NULL DEFAULT 'provisional' CHECK(result_publication_state IN ('provisional','under_review','official'));
ALTER TABLE public.events ADD COLUMN results_validated_at timestamptz;
-- Existing Daily Race race results retain their prior official status; practice/open lobbies do not.
UPDATE public.events SET result_publication_state='official',results_validated_at=now() WHERE starts_at<now() AND is_public AND EXISTS(SELECT 1 FROM public.results r WHERE r.event_id=events.id) AND (competition_code='DR' OR (competition_code IS NULL AND event_type='daily_race')) AND concat_ws(' ',title_fr,title_en,server_name) !~* '(open[ _-]*lobby|hotlap|entra[iî]nement|practice|discord)';
CREATE TABLE public.atx_result_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES public.events(id),driver_id uuid REFERENCES public.drivers(id),
 actor_id uuid NOT NULL REFERENCES public.drivers(id),reason_fr text NOT NULL CHECK(length(trim(reason_fr)) BETWEEN 1 AND 2000),reason_en text NOT NULL CHECK(length(trim(reason_en)) BETWEEN 1 AND 2000),
 before_value jsonb,after_value jsonb,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.atx_coin_ledger (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),driver_id uuid NOT NULL REFERENCES public.drivers(id),event_id uuid REFERENCES public.events(id),
 amount integer NOT NULL CHECK(amount<>0),kind text NOT NULL CHECK(kind IN ('welcome','entry','withdrawal','finish','position','fastest','adjustment')),
 operation_key text NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.atx_coin_ledger(driver_id,created_at DESC);
CREATE TABLE public.atx_waitlist (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,driver_id uuid NOT NULL REFERENCES public.drivers(id),
 state text NOT NULL DEFAULT 'waiting' CHECK(state IN ('waiting','offered','expired','withdrawn','confirmed')),
 created_at timestamptz NOT NULL DEFAULT now(),offered_until timestamptz,UNIQUE(event_id,driver_id)
);
CREATE INDEX ON public.atx_waitlist(event_id,state,created_at,id);
ALTER TABLE public.atx_result_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atx_coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atx_waitlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.atx_result_decisions,public.atx_coin_ledger,public.atx_waitlist FROM public,anon,authenticated;
GRANT ALL ON public.atx_result_decisions,public.atx_coin_ledger,public.atx_waitlist TO service_role;

CREATE FUNCTION public.atx_welcome_coins(p_actor uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.driver_identities WHERE driver_id=p_actor AND last_login_at IS NOT NULL) THEN
  INSERT INTO public.atx_coin_ledger(driver_id,amount,kind,operation_key) VALUES(p_actor,10,'welcome','welcome:'||p_actor) ON CONFLICT(operation_key) DO NOTHING;
 END IF;
END $$;
CREATE FUNCTION public.atx_welcome_coins_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM public.atx_welcome_coins(NEW.driver_id); RETURN NEW; END $$;
CREATE TRIGGER atx_welcome_coins AFTER INSERT OR UPDATE OF last_login_at ON public.driver_identities FOR EACH ROW EXECUTE FUNCTION public.atx_welcome_coins_trigger();
INSERT INTO public.atx_coin_ledger(driver_id,amount,kind,operation_key) SELECT driver_id,10,'welcome','welcome:'||driver_id FROM public.driver_identities WHERE last_login_at IS NOT NULL ON CONFLICT(operation_key) DO NOTHING;

CREATE FUNCTION public.atx_driver_wallet(p_actor uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('coins',coalesce((SELECT sum(amount) FROM public.atx_coin_ledger WHERE driver_id=p_actor),0),'ledger',coalesce((SELECT jsonb_agg(row) FROM (SELECT l.id,l.amount,l.kind,l.created_at,CASE WHEN e.is_public AND e.status<>'draft' THEN jsonb_build_object('slug',e.slug,'title_fr',e.title_fr,'title_en',e.title_en) ELSE NULL END AS event FROM public.atx_coin_ledger l LEFT JOIN public.events e ON e.id=l.event_id WHERE l.driver_id=p_actor ORDER BY l.created_at DESC,l.id LIMIT 100) row),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.atx_driver_wallet(uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_driver_wallet(uuid) TO service_role;

CREATE FUNCTION public.atx_refresh_waitlist(p_event uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; slots integer; w record;
BEGIN
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 UPDATE public.atx_waitlist SET state='expired' WHERE event_id=p_event AND state='offered' AND offered_until<=now();
 IF e.starts_at<=now() OR e.status<>'registration_open' OR NOT e.site_registration_enabled OR e.simgrid_url IS NOT NULL THEN RETURN; END IF;
 slots:=e.max_drivers-(SELECT count(*) FROM public.atx_race_entries WHERE event_id=p_event)-(SELECT count(*) FROM public.atx_waitlist WHERE event_id=p_event AND state='offered');
 FOR w IN SELECT id FROM public.atx_waitlist WHERE event_id=p_event AND state='waiting' ORDER BY created_at,id LIMIT greatest(slots,0) FOR UPDATE LOOP
  UPDATE public.atx_waitlist SET state='offered',offered_until=least(now()+interval '30 minutes',e.starts_at) WHERE id=w.id;
 END LOOP;
END $$;

ALTER FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb) RENAME TO atx_register_entry_without_waitlist_coins;
CREATE FUNCTION public.atx_register_entry(p_actor uuid,p_event uuid,p_action text,p_data jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; w public.atx_waitlist%rowtype; response jsonb; balance integer; cycle text; profile public.driver_profile_preferences%rowtype; number text; reserved integer; entry_count integer;
BEGIN
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND OR NOT e.is_public OR e.simgrid_url IS NOT NULL THEN RAISE EXCEPTION 'registration_unavailable'; END IF;
 IF e.starts_at<=now() OR e.status IN ('draft','cancelled','completed') THEN RAISE EXCEPTION 'registration_closed'; END IF;
 PERFORM 1 FROM public.drivers WHERE id=p_actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'confirmed_profile_required'; END IF;
 IF p_action='withdraw' THEN
  -- Withdrawal remains possible after the organiser closes new registrations.
  IF EXISTS(SELECT 1 FROM public.atx_entry_members WHERE event_id=p_event AND driver_id=p_actor) THEN
   IF EXISTS(SELECT 1 FROM public.atx_race_entries x WHERE x.event_id=p_event AND x.owner_driver_id=p_actor AND (SELECT count(*) FROM public.atx_entry_members WHERE entry_id=x.id)>1) THEN RAISE EXCEPTION 'captain_has_members'; END IF;
   DELETE FROM public.atx_entry_members WHERE event_id=p_event AND driver_id=p_actor;
   DELETE FROM public.atx_race_entries x WHERE event_id=p_event AND NOT EXISTS(SELECT 1 FROM public.atx_entry_members WHERE entry_id=x.id);
   UPDATE public.registrations SET status='withdrawn',updated_at=now() WHERE event_id=p_event AND driver_id=p_actor AND external_source='atx-site';
   IF coalesce((SELECT sum(amount) FROM public.atx_coin_ledger WHERE driver_id=p_actor AND event_id=p_event AND kind IN ('entry','withdrawal')),0)<0 THEN
    INSERT INTO public.atx_coin_ledger(driver_id,event_id,amount,kind,operation_key) VALUES(p_actor,p_event,1,'withdrawal','withdrawal:'||gen_random_uuid());
   END IF;
  END IF;
  UPDATE public.atx_waitlist SET state='withdrawn',offered_until=NULL WHERE driver_id=p_actor AND event_id=p_event AND state IN ('waiting','offered');
  PERFORM public.atx_refresh_waitlist(p_event);RETURN jsonb_build_object('withdrawn',true);
 END IF;
 IF p_action NOT IN ('register','waitlist') THEN RAISE EXCEPTION 'invalid_action'; END IF;
 IF NOT e.site_registration_enabled OR e.status<>'registration_open' THEN RAISE EXCEPTION 'registration_closed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.driver_identities WHERE driver_id=p_actor AND last_login_at IS NOT NULL) THEN RAISE EXCEPTION 'confirmed_profile_required'; END IF;
 SELECT * INTO profile FROM public.driver_profile_preferences WHERE driver_id=p_actor;
 SELECT car_number INTO number FROM public.drivers WHERE id=p_actor;
 IF profile.profile_confirmed_at IS NULL OR profile.acc_first_name IS NULL OR profile.acc_last_name IS NULL OR profile.acc_short_name IS NULL OR number IS NULL OR number !~ '^[0-9]{1,3}$' THEN RAISE EXCEPTION 'acc_profile_required'; END IF;
 IF EXISTS(SELECT 1 FROM public.atx_entry_members WHERE event_id=p_event AND driver_id=p_actor) THEN RAISE EXCEPTION 'already_registered'; END IF;
 PERFORM public.atx_refresh_waitlist(p_event);
 SELECT * INTO w FROM public.atx_waitlist WHERE event_id=p_event AND driver_id=p_actor;
 IF nullif(p_data->>'joinCode','') IS NULL THEN
  IF e.competition_code='WGT' THEN
   IF nullif(trim(p_data->>'teamName'),'') IS NULL THEN RAISE EXCEPTION 'team_name_required'; END IF;
   IF EXISTS(SELECT 1 FROM public.atx_race_entries x WHERE x.event_id=p_event AND lower(trim(x.team_name))=lower(trim(p_data->>'teamName'))) THEN RAISE EXCEPTION 'team_name_taken'; END IF;
  END IF;
  SELECT count(*) INTO entry_count FROM public.atx_race_entries WHERE event_id=p_event;
  SELECT count(*) INTO reserved FROM public.atx_waitlist WHERE event_id=p_event AND state='offered' AND driver_id<>p_actor;
  IF entry_count+reserved>=e.max_drivers THEN
   INSERT INTO public.atx_waitlist(event_id,driver_id) VALUES(p_event,p_actor) ON CONFLICT(event_id,driver_id) DO UPDATE SET state='waiting',created_at=CASE WHEN public.atx_waitlist.state='waiting' THEN public.atx_waitlist.created_at ELSE now() END,offered_until=NULL;
   RETURN jsonb_build_object('waitlisted',true);
  END IF;
 ELSIF p_action='waitlist' THEN RAISE EXCEPTION 'invalid_invitation'; END IF;
 PERFORM public.atx_welcome_coins(p_actor);
 SELECT coalesce(sum(amount),0) INTO balance FROM public.atx_coin_ledger WHERE driver_id=p_actor;
 IF balance<1 THEN RAISE EXCEPTION 'insufficient_coins'; END IF;
 response:=public.atx_register_entry_without_waitlist_coins(p_actor,p_event,'register',p_data);
 UPDATE public.atx_waitlist SET state='confirmed',offered_until=NULL WHERE event_id=p_event AND driver_id=p_actor;
 cycle:=gen_random_uuid()::text;
 INSERT INTO public.atx_coin_ledger(driver_id,event_id,amount,kind,operation_key) VALUES(p_actor,p_event,-1,'entry','entry:'||cycle);
 RETURN response||jsonb_build_object('coinsDebited',1);
END $$;

CREATE FUNCTION public.atx_public_entry_counts(p_events uuid[]) RETURNS TABLE(event_id uuid,entries bigint,reserved bigint) LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT e.id,(SELECT count(*) FROM public.atx_race_entries x WHERE x.event_id=e.id),(SELECT count(*) FROM public.atx_waitlist w WHERE w.event_id=e.id AND w.state='offered' AND w.offered_until>now()) FROM public.events e WHERE e.id=ANY(p_events) AND e.is_public AND e.status<>'draft' AND e.simgrid_url IS NULL ;
$$;
REVOKE ALL ON FUNCTION public.atx_public_entry_counts(uuid[]) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_public_entry_counts(uuid[]) TO service_role;

-- Reconcile rewards against the official outcome. Corrections append deltas; repeat publication never pays twice.
CREATE FUNCTION public.atx_reconcile_race_coins(p_event uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; d record; r public.results%rowtype; desired integer; credited integer; k text; fastest integer;
BEGIN
 SELECT * INTO e FROM public.events WHERE id=p_event;
 SELECT min(best_lap_ms) INTO fastest FROM public.results WHERE event_id=p_event AND status='classified' AND finish_position IS NOT NULL;
 FOR d IN SELECT DISTINCT driver_id FROM public.results WHERE event_id=p_event UNION SELECT DISTINCT driver_id FROM public.atx_coin_ledger WHERE event_id=p_event AND kind IN ('finish','position','fastest') ORDER BY driver_id LOOP
  PERFORM 1 FROM public.drivers WHERE id=d.driver_id FOR UPDATE;
  SELECT * INTO r FROM public.results WHERE event_id=p_event AND driver_id=d.driver_id;
  FOREACH k IN ARRAY ARRAY['finish','position','fastest'] LOOP
   desired:=0;
   IF e.result_publication_state='official' AND e.is_public AND e.status<>'cancelled' AND (e.competition_code IN ('DR','WGT','ATXS') OR e.event_type IN ('daily_race','sprint','endurance','championship')) AND concat_ws(' ',e.title_fr,e.title_en,e.server_name) !~* '(open[ _-]*lobby|hotlap|entra[iî]nement|practice|discord)' AND r.status='classified' AND r.finish_position IS NOT NULL AND EXISTS(SELECT 1 FROM public.driver_identities WHERE driver_id=d.driver_id AND last_login_at IS NOT NULL) THEN
    desired:=CASE k WHEN 'finish' THEN CASE WHEN r.laps_completed>0 AND coalesce((SELECT sum(amount) FROM public.atx_coin_ledger WHERE driver_id=d.driver_id AND event_id=p_event AND kind IN ('entry','withdrawal')),0)<0 THEN 1 ELSE 0 END WHEN 'position' THEN greatest(11-r.finish_position,0) WHEN 'fastest' THEN CASE WHEN r.best_lap_ms=fastest THEN 1 ELSE 0 END END;
   END IF;
   SELECT coalesce(sum(amount),0) INTO credited FROM public.atx_coin_ledger WHERE driver_id=d.driver_id AND event_id=p_event AND kind=k;
   IF desired<>credited THEN INSERT INTO public.atx_coin_ledger(driver_id,event_id,amount,kind,operation_key) VALUES(d.driver_id,p_event,desired-credited,k,'award:'||gen_random_uuid()); END IF;
  END LOOP;
 END LOOP;
END $$;

CREATE FUNCTION public.atx_review_results(p_actor uuid,p_event uuid,p_action text,p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; r public.results%rowtype; before_json jsonb; publication text; reason_fr text; reason_en text; target uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.driver_roles WHERE driver_id=p_actor AND role IN ('admin','steward')) THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND OR NOT e.is_public THEN RAISE EXCEPTION 'event_not_found'; END IF;
 reason_fr:=trim(p_data->>'reasonFr');reason_en:=trim(p_data->>'reasonEn');
 IF coalesce(length(reason_fr),0) NOT BETWEEN 1 AND 2000 OR coalesce(length(reason_en),0) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'reason_required'; END IF;
 IF p_action='correct' THEN
  target:=(p_data->>'driverId')::uuid;
  SELECT * INTO r FROM public.results WHERE event_id=p_event AND driver_id=target FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'result_not_found'; END IF;
  before_json:=jsonb_build_object('position',r.finish_position,'status',r.status,'points',r.points);
  IF p_data->>'status' NOT IN ('classified','dnf','dns','dsq') OR p_data->>'status' IS NULL OR p_data->>'points' IS NULL OR (p_data->>'points')::numeric<0 OR (p_data->>'points')::numeric>1000 THEN RAISE EXCEPTION 'invalid_result'; END IF;
  UPDATE public.results SET finish_position=nullif(p_data->>'position','')::integer,status=(p_data->>'status')::public.result_status,points=(p_data->>'points')::numeric,updated_at=now() WHERE id=r.id;
  UPDATE public.events SET result_publication_state='under_review',results_validated_at=NULL WHERE id=p_event;
  INSERT INTO public.atx_result_decisions(event_id,driver_id,actor_id,reason_fr,reason_en,before_value,after_value) VALUES(p_event,target,p_actor,reason_fr,reason_en,before_json,jsonb_build_object('position',nullif(p_data->>'position','')::integer,'status',p_data->>'status','points',(p_data->>'points')::numeric));
 ELSIF p_action='publication' THEN
  publication:=p_data->>'state';IF publication NOT IN ('provisional','under_review','official') OR publication IS NULL THEN RAISE EXCEPTION 'invalid_state'; END IF;
  IF publication='official' AND NOT EXISTS(SELECT 1 FROM public.results WHERE event_id=p_event) THEN RAISE EXCEPTION 'results_required'; END IF;
  IF publication='official' AND e.starts_at+make_interval(mins=>e.duration_minutes)>now() THEN RAISE EXCEPTION 'race_not_finished'; END IF;
  IF publication='official' AND e.competition_code='WGT' AND EXISTS(SELECT 1 FROM public.results rr LEFT JOIN public.registrations g ON g.event_id=rr.event_id AND g.driver_id=rr.driver_id WHERE rr.event_id=p_event AND rr.status NOT IN ('dns','dsq') AND nullif(trim(g.team_name),'') IS NULL) THEN RAISE EXCEPTION 'teams_required'; END IF;
  IF publication='official' AND EXISTS(SELECT finish_position FROM public.results WHERE event_id=p_event AND status='classified' GROUP BY finish_position HAVING finish_position IS NULL OR count(*)>1) AND coalesce(e.competition_code,'')<>'WGT' THEN RAISE EXCEPTION 'positions_conflict'; END IF;
  IF e.result_publication_state<>publication THEN
   UPDATE public.events SET result_publication_state=publication,results_validated_at=CASE WHEN publication='official' THEN now() ELSE NULL END WHERE id=p_event;
   INSERT INTO public.atx_result_decisions(event_id,actor_id,reason_fr,reason_en,before_value,after_value) VALUES(p_event,p_actor,reason_fr,reason_en,jsonb_build_object('state',e.result_publication_state),jsonb_build_object('state',publication));
  END IF;
 ELSE RAISE EXCEPTION 'invalid_action'; END IF;
 PERFORM public.atx_reconcile_race_coins(p_event);
 RETURN jsonb_build_object('saved',true);
END $$;

-- A later Collector import invalidates previous approval rather than silently replacing official results.
CREATE FUNCTION public.atx_import_requires_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE eid uuid;
BEGIN
 IF TG_OP='UPDATE' AND NEW.imported_at IS NOT DISTINCT FROM OLD.imported_at THEN RETURN NEW; END IF;
 eid:=CASE WHEN TG_OP='DELETE' THEN OLD.event_id ELSE NEW.event_id END;
 UPDATE public.events SET result_publication_state='provisional',results_validated_at=NULL WHERE id=eid AND result_publication_state<>'provisional';
 IF FOUND THEN PERFORM public.atx_reconcile_race_coins(eid); END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER atx_result_import_review BEFORE INSERT OR DELETE OR UPDATE OF imported_at ON public.results FOR EACH ROW EXECUTE FUNCTION public.atx_import_requires_review();

DO $$ DECLARE e record; BEGIN FOR e IN SELECT id FROM public.events WHERE result_publication_state='official' ORDER BY id LOOP PERFORM public.atx_reconcile_race_coins(e.id); END LOOP; END $$;

REVOKE ALL ON FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb),public.atx_welcome_coins(uuid),public.atx_refresh_waitlist(uuid),public.atx_review_results(uuid,uuid,text,jsonb),public.atx_reconcile_race_coins(uuid),public.atx_welcome_coins_trigger(),public.atx_import_requires_review() FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_register_entry(uuid,uuid,text,jsonb),public.atx_welcome_coins(uuid),public.atx_refresh_waitlist(uuid),public.atx_review_results(uuid,uuid,text,jsonb),public.atx_reconcile_race_coins(uuid) TO service_role;
COMMIT;
