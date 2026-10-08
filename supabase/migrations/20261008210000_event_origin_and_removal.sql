BEGIN;
ALTER TABLE public.events ADD COLUMN publication_origin text NOT NULL DEFAULT 'collector' CHECK(publication_origin IN ('organizer','collector'));
ALTER TABLE public.events ADD COLUMN deleted_at timestamptz;
UPDATE public.events e SET publication_origin='organizer' WHERE EXISTS(SELECT 1 FROM public.atx_event_drafts d WHERE d.event_id=e.id AND d.status='published') OR (e.image_url IS NOT NULL AND e.simgrid_url IS NOT NULL);
CREATE FUNCTION public.atx_mark_organizer_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.status='published' AND NEW.event_id IS NOT NULL THEN UPDATE public.events SET publication_origin='organizer' WHERE id=NEW.event_id; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER atx_mark_organizer_event AFTER INSERT OR UPDATE OF event_id,status ON public.atx_event_drafts FOR EACH ROW EXECUTE FUNCTION public.atx_mark_organizer_event();
REVOKE ALL ON FUNCTION public.atx_mark_organizer_event() FROM public,anon,authenticated;
CREATE FUNCTION public.atx_remove_event(p_actor uuid,p_event uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; d record; owed integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.driver_roles WHERE driver_id=p_actor AND role='admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND OR e.publication_origin<>'organizer' THEN RAISE EXCEPTION 'event_not_found'; END IF;
 IF e.deleted_at IS NOT NULL THEN RETURN jsonb_build_object('deleted',true); END IF;
 IF e.result_publication_state='official' AND EXISTS(SELECT 1 FROM public.results WHERE event_id=p_event) THEN RAISE EXCEPTION 'results_locked'; END IF;
 FOR d IN SELECT DISTINCT driver_id FROM public.atx_coin_ledger WHERE event_id=p_event ORDER BY driver_id LOOP
  PERFORM 1 FROM public.drivers WHERE id=d.driver_id FOR UPDATE;
  SELECT greatest(0,-coalesce(sum(amount),0))::integer INTO owed FROM public.atx_coin_ledger WHERE event_id=p_event AND driver_id=d.driver_id AND kind IN ('entry','withdrawal','finish');
  IF owed>0 THEN INSERT INTO public.atx_coin_ledger(driver_id,event_id,amount,kind,operation_key) VALUES(d.driver_id,p_event,owed,'withdrawal','event-removal:'||p_event||':'||d.driver_id) ON CONFLICT(operation_key) DO NOTHING; END IF;
 END LOOP;
 DELETE FROM public.atx_waitlist WHERE event_id=p_event;
 DELETE FROM public.atx_race_entries WHERE event_id=p_event;
 DELETE FROM public.registrations WHERE event_id=p_event;
 UPDATE public.events SET status='cancelled',deleted_at=now(),site_registration_enabled=false,registered_snapshot=0,updated_at=now() WHERE id=p_event;
 -- Keep the event record and its ACC sessions so circuit/profile lap times survive.
 RETURN jsonb_build_object('deleted',true);
END $$;
REVOKE ALL ON FUNCTION public.atx_remove_event(uuid,uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_remove_event(uuid,uuid) TO service_role;
COMMIT;
