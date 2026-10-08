BEGIN;
CREATE OR REPLACE FUNCTION public.atx_review_results(p_actor uuid,p_event uuid,p_action text,p_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; r public.results%rowtype; before_json jsonb; publication text; reason_fr text; reason_en text; target uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.driver_roles WHERE driver_id=p_actor AND role IN ('admin','steward')) THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND OR NOT e.is_public THEN RAISE EXCEPTION 'event_not_found'; END IF;
 IF e.result_publication_state='official' THEN RAISE EXCEPTION 'results_locked'; END IF;
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
  IF publication='official' AND e.results_import_in_progress THEN RAISE EXCEPTION 'results_import_in_progress'; END IF;
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
CREATE OR REPLACE FUNCTION public.atx_import_requires_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE eid uuid; publication text;
BEGIN
 eid:=CASE WHEN TG_OP='DELETE' THEN OLD.event_id ELSE NEW.event_id END;
 SELECT result_publication_state INTO publication FROM public.events WHERE id=eid FOR UPDATE;
 IF publication='official' THEN RAISE EXCEPTION 'results_locked'; END IF;
 IF TG_OP='UPDATE' AND NEW.event_id IS DISTINCT FROM OLD.event_id THEN
  SELECT result_publication_state INTO publication FROM public.events WHERE id=OLD.event_id FOR UPDATE;
  IF publication='official' THEN RAISE EXCEPTION 'results_locked'; END IF;
 END IF;
 IF TG_OP='UPDATE' AND NEW.imported_at IS NOT DISTINCT FROM OLD.imported_at THEN RETURN NEW; END IF;
 UPDATE public.events SET result_publication_state='provisional',results_validated_at=NULL WHERE id=eid AND result_publication_state<>'provisional';
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER atx_result_import_review ON public.results;
CREATE TRIGGER atx_result_import_review BEFORE INSERT OR DELETE OR UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.atx_import_requires_review();

COMMIT;
