BEGIN;
-- ACC source 261010_162252_R.json: the same Steam pilot is listed as a
-- participant in car 223 and an unused driver in car 224. Keep the raced car.
-- The temporary state is contained in this transaction; publication remains official.
DO $$
DECLARE target uuid:='06df6a2b-be6f-41d7-a6a6-36c67ed206aa'; state text;
BEGIN
 SELECT result_publication_state INTO state FROM public.events WHERE id=target FOR UPDATE;
 IF state IS NULL THEN RETURN; END IF;
 IF state<>'official' THEN RAISE EXCEPTION 'monza_official_result_expected'; END IF;
 UPDATE public.events SET result_publication_state='provisional' WHERE id=target;
 UPDATE public.results SET status='classified',finish_position=14,laps_completed=38,best_lap_ms=107887,total_time_ms=4855683,car_model_id=32,car_model_name='Ferrari 296 GT3',race_number=223,best_split_1_ms=34807,best_split_2_ms=37647,best_split_3_ms=35087 WHERE event_id=target AND driver_id='a18aefae-f98d-4903-9e04-9b4df5267daf' AND race_number=224;
 UPDATE public.registrations SET team_name='#223 · Matvey Erin / Maxim Timashev',race_number=223,car_model='Ferrari 296 GT3' WHERE event_id=target AND driver_id='a18aefae-f98d-4903-9e04-9b4df5267daf';
 UPDATE public.acc_session_results r SET status='classified',position=14,laps_completed=38,total_time_ms=4855683,car_model_id=32,car_model_name='Ferrari 296 GT3',race_number=223 FROM public.acc_sessions s WHERE r.session_id=s.id AND s.event_id=target AND s.session_type='R' AND r.driver_id='a18aefae-f98d-4903-9e04-9b4df5267daf' AND r.race_number=224;
 UPDATE public.results SET car_model_name=CASE car_model_id WHEN 15 THEN 'Lexus RC F GT3' WHEN 23 THEN 'Porsche 911 II GT3 Cup' END WHERE event_id=target AND car_model_name IS NULL AND car_model_id IN (15,23);
 UPDATE public.acc_session_results r SET car_model_name=CASE r.car_model_id WHEN 15 THEN 'Lexus RC F GT3' WHEN 23 THEN 'Porsche 911 II GT3 Cup' END FROM public.acc_sessions s WHERE r.session_id=s.id AND s.event_id=target AND r.car_model_name IS NULL AND r.car_model_id IN (15,23);
 UPDATE public.registrations SET team_name='#67' WHERE event_id=target AND trim(team_name)='#67 ·';
 PERFORM public.atx_finalize_import(target);
END $$;
COMMIT;
