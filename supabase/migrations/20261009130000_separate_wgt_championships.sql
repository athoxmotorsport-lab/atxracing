BEGIN;
-- The Collector still sends WGT. Championship identity belongs to the event,
-- independently of the race format, so American Dream never joins Endurance.
ALTER TABLE public.events ADD COLUMN championship_code text;
ALTER TABLE public.events ADD CONSTRAINT events_championship_code_check CHECK (
 championship_code IS NULL OR championship_code IN ('WGT_SPRINT','WGT_ENDURANCE','WGT_AMERICAN_DREAM')
);
CREATE FUNCTION public.atx_wgt_championship(e jsonb) RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE
 WHEN e->>'championship_code' IN ('WGT_SPRINT','WGT_ENDURANCE','WGT_AMERICAN_DREAM') THEN e->>'championship_code'
 WHEN coalesce(e->>'competition_code','') NOT IN ('','WGT') THEN NULL
 WHEN coalesce(e->>'competition_code','')<>'WGT' AND concat_ws(' ',e->>'title_fr',e->>'title_en',e->>'server_name') !~* '(^|[^a-z0-9])(WGT|SPRINT|ENDU)([^a-z0-9]|$)|WORLD\s*GT' THEN NULL
 WHEN concat_ws(' ',e->>'title_fr',e->>'title_en',e->>'server_name') ~* 'AMERICAN[ _-]+DREAM' THEN 'WGT_AMERICAN_DREAM'
 WHEN e->>'format_code'='WGT_ENDURANCE' OR e->>'event_type'='endurance' OR concat_ws(' ',e->>'title_fr',e->>'title_en',e->>'server_name') ~* '\mENDU(RANCE)?\M' THEN 'WGT_ENDURANCE'
 WHEN e->>'format_code'='WGT_SPRINT' OR e->>'event_type'='sprint' OR concat_ws(' ',e->>'title_fr',e->>'title_en',e->>'server_name') ~* '\mSPRINT\M' THEN 'WGT_SPRINT'
 ELSE NULL END;
$$;
UPDATE public.events e SET championship_code=public.atx_wgt_championship(to_jsonb(e)) WHERE public.atx_wgt_championship(to_jsonb(e)) IS NOT NULL;
CREATE FUNCTION public.atx_assign_wgt_championship() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.championship_code IS NULL THEN NEW.championship_code:=public.atx_wgt_championship(to_jsonb(NEW)); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER assign_wgt_championship BEFORE INSERT OR UPDATE OF competition_code,format_code,event_type,title_fr,title_en,server_name,championship_code ON public.events FOR EACH ROW EXECUTE FUNCTION public.atx_assign_wgt_championship();
-- Publication links the draft to its event in the same transaction.
CREATE FUNCTION public.atx_link_draft_championship() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.event_id IS NOT NULL AND NEW.draft->>'competition'='WGT' AND NEW.draft->>'championshipCode' IN ('WGT_SPRINT','WGT_ENDURANCE','WGT_AMERICAN_DREAM') THEN
  UPDATE public.events SET championship_code=NEW.draft->>'championshipCode' WHERE id=NEW.event_id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER link_draft_championship AFTER UPDATE OF event_id ON public.atx_event_drafts FOR EACH ROW EXECUTE FUNCTION public.atx_link_draft_championship();
COMMIT;
