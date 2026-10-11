BEGIN;
-- Complete Collector race imports become official in one step. FP/Q stay lap sources.
CREATE FUNCTION public.atx_finalize_import(p_event uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e public.events%rowtype; fastest bigint;
BEGIN
 SELECT * INTO e FROM public.events WHERE id=p_event FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found'; END IF;
 IF e.result_publication_state='official' THEN RETURN; END IF;
 IF e.results_import_in_progress THEN RAISE EXCEPTION 'results_import_in_progress'; END IF;
 IF NOT e.is_official OR e.status<>'completed' OR NOT e.is_public OR e.deleted_at IS NOT NULL OR e.competition_code NOT IN ('DR','WGT','ATXS') OR concat_ws(' ',e.title_fr,e.title_en,e.server_name) ~* 'open[ _-]*lobby|hotlap|entra[iî]nement|practice|discord' THEN RAISE EXCEPTION 'competitive_race_required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.results WHERE event_id=p_event) THEN RAISE EXCEPTION 'results_required'; END IF;
 IF e.competition_code='WGT' AND e.championship_code IS DISTINCT FROM 'WGT_AMERICAN_DREAM' THEN
  IF e.championship_code NOT IN ('WGT_SPRINT','WGT_ENDURANCE') OR e.championship_code IS NULL THEN RAISE EXCEPTION 'championship_required'; END IF;
  IF EXISTS(SELECT 1 FROM public.results r LEFT JOIN public.registrations g ON g.event_id=r.event_id AND g.driver_id=r.driver_id WHERE r.event_id=p_event AND r.status NOT IN ('dns','dsq') AND nullif(trim(g.team_name),'') IS NULL) THEN RAISE EXCEPTION 'teams_required'; END IF;
  SELECT min(best_lap_ms) INTO fastest FROM public.results WHERE event_id=p_event AND status='classified';
  WITH crews AS (
   SELECT lower(trim(g.team_name)) crew,min(r.finish_position) FILTER(WHERE r.status='classified') pos,min(r.best_lap_ms) lap
   FROM public.results r JOIN public.registrations g ON g.event_id=r.event_id AND g.driver_id=r.driver_id
   WHERE r.event_id=p_event AND r.status NOT IN ('dns','dsq') GROUP BY lower(trim(g.team_name))
  ), awards AS (
   SELECT crew,coalesce((CASE WHEN e.championship_code='WGT_ENDURANCE' THEN ARRAY[50,36,30,24,20,16,12,8,4,2] ELSE ARRAY[25,18,15,12,10,8,6,4,2,1] END)[pos],0)+CASE WHEN pos IS NOT NULL AND lap=fastest THEN 2 ELSE 0 END points FROM crews
  ) UPDATE public.results r SET points=CASE WHEN r.status IN ('dns','dsq') THEN 0 ELSE a.points END
    FROM public.registrations g JOIN awards a ON a.crew=lower(trim(g.team_name)) WHERE r.event_id=p_event AND g.event_id=r.event_id AND g.driver_id=r.driver_id;
 ELSE
  IF EXISTS(SELECT finish_position FROM public.results WHERE event_id=p_event AND status='classified' GROUP BY finish_position HAVING finish_position IS NULL OR count(*)>1) THEN RAISE EXCEPTION 'positions_conflict'; END IF;
 END IF;
 UPDATE public.events SET result_publication_state='official',results_validated_at=now() WHERE id=p_event;
 PERFORM public.atx_reconcile_race_coins(p_event);
END $$;
REVOKE ALL ON FUNCTION public.atx_finalize_import(uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.atx_finalize_import(uuid) TO service_role;
-- Correct generic Collector names using ACC's numeric model catalog.
UPDATE public.results r SET car_model_name=c.name FROM public.atx_acc_cars c, public.events e WHERE e.id=r.event_id AND e.result_publication_state<>'official' AND r.car_model_id=c.car_model_id AND r.car_model_name ~* '^(mod[eè]le acc|acc model)';
UPDATE public.acc_session_results r SET car_model_name=c.name FROM public.atx_acc_cars c WHERE r.car_model_id=c.car_model_id AND r.car_model_name ~* '^(mod[eè]le acc|acc model)';
COMMIT;
