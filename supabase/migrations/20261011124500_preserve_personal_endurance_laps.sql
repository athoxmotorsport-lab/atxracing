BEGIN;
-- A crew earns shared race points, but a driver's personal record must come
-- from that driver's valid laps rather than their teammate's fastest lap.
DO $$
DECLARE target uuid:='06df6a2b-be6f-41d7-a6a6-36c67ed206aa'; previous_points numeric; restored_points numeric; state text;
BEGIN
 SELECT result_publication_state INTO state FROM public.events WHERE id=target FOR UPDATE;
 IF state IS NULL THEN RETURN; END IF;
 IF state<>'official' THEN RAISE EXCEPTION 'monza_official_result_expected'; END IF;
 SELECT sum(points) INTO previous_points FROM public.results WHERE event_id=target;
 UPDATE public.events SET result_publication_state='provisional' WHERE id=target;
 UPDATE public.results r SET best_lap_ms=s.best_lap_ms,best_split_1_ms=s.best_split_1_ms,best_split_2_ms=s.best_split_2_ms,best_split_3_ms=s.best_split_3_ms
 FROM public.acc_session_results s JOIN public.acc_sessions a ON a.id=s.session_id
 WHERE r.event_id=target AND a.event_id=target AND a.session_type='R' AND s.driver_id=r.driver_id;
 PERFORM public.atx_finalize_import(target);
 SELECT sum(points) INTO restored_points FROM public.results WHERE event_id=target;
 IF restored_points IS DISTINCT FROM previous_points THEN RAISE EXCEPTION 'crew_points_must_remain_identical'; END IF;
END $$;
COMMIT;
