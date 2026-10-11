BEGIN;
-- Re-evaluate archived Collector R files using the same finish-crossing rule.
-- Preserve participation, personal laps and explicit DNS/DSQ/steward decisions.
CREATE TEMP TABLE atx_finish_repair(event_id uuid,race_number integer,status text) ON COMMIT DROP;
INSERT INTO atx_finish_repair VALUES
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,67,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,999,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,223,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,37,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,300,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,224,'dns'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,702,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,152,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,296,'dnf'),
('06df6a2b-be6f-41d7-a6a6-36c67ed206aa'::uuid,124,'dnf'),
('a5e5902c-92ca-426b-9595-b87872942cd8'::uuid,999,'dns'),
('3b32450a-5441-4ebe-9c31-c7fda8d8a78c'::uuid,1,'dnf'),
('106c07d3-d040-4428-8d3f-6d3c73c73a14'::uuid,111,'dnf'),
('106c07d3-d040-4428-8d3f-6d3c73c73a14'::uuid,99,'dnf'),
('106c07d3-d040-4428-8d3f-6d3c73c73a14'::uuid,69,'dnf'),
('106c07d3-d040-4428-8d3f-6d3c73c73a14'::uuid,83,'dnf'),
('3dbae447-644d-409e-aaa7-4ed5254549ee'::uuid,24,'dns'),
('3dbae447-644d-409e-aaa7-4ed5254549ee'::uuid,101,'dnf'),
('446576f0-e524-42f3-b2d5-c0a9327e12a6'::uuid,808,'dnf'),
('446576f0-e524-42f3-b2d5-c0a9327e12a6'::uuid,7,'dnf'),
('446576f0-e524-42f3-b2d5-c0a9327e12a6'::uuid,911,'dnf'),
('446576f0-e524-42f3-b2d5-c0a9327e12a6'::uuid,999,'dnf'),
('1cfc9ff1-291a-49b4-996c-a05d341f556f'::uuid,61,'dnf'),
('b88d5334-aa2a-4210-832f-3e0a73ef07ff'::uuid,7,'dnf'),
('b88d5334-aa2a-4210-832f-3e0a73ef07ff'::uuid,33,'dnf'),
('b88d5334-aa2a-4210-832f-3e0a73ef07ff'::uuid,64,'dnf'),
('b88d5334-aa2a-4210-832f-3e0a73ef07ff'::uuid,21,'dnf'),
('b88d5334-aa2a-4210-832f-3e0a73ef07ff'::uuid,37,'dns'),
('b88d5334-aa2a-4210-832f-3e0a73ef07ff'::uuid,61,'dnf'),
('bf9d32bc-813d-42f7-a818-dafb6cc31605'::uuid,6,'dnf'),
('bf9d32bc-813d-42f7-a818-dafb6cc31605'::uuid,25,'dnf'),
('bf9d32bc-813d-42f7-a818-dafb6cc31605'::uuid,34,'dnf');
DO $$
DECLARE e record; prior_state text; fastest_driver uuid;
BEGIN
 FOR e IN SELECT DISTINCT ev.id,ev.competition_code,ev.championship_code,ev.result_publication_state FROM public.events ev JOIN public.results r ON r.event_id=ev.id JOIN atx_finish_repair s ON s.event_id=r.event_id AND s.race_number=r.race_number WHERE r.status='classified' LOOP
  PERFORM 1 FROM public.events WHERE id=e.id FOR UPDATE;
  prior_state:=e.result_publication_state;
  UPDATE public.events SET result_publication_state='provisional' WHERE id=e.id;
  UPDATE public.results r SET status=s.status::public.result_status,points=0 FROM atx_finish_repair s WHERE r.event_id=e.id AND s.event_id=r.event_id AND s.race_number=r.race_number AND r.status='classified';
  UPDATE public.acc_session_results r SET status=s.status::public.result_status FROM public.acc_sessions a,atx_finish_repair s WHERE r.session_id=a.id AND a.event_id=e.id AND a.session_type='R' AND s.event_id=a.event_id AND s.race_number=r.race_number AND r.status='classified';
  IF e.competition_code<>'WGT' OR e.championship_code='WGT_AMERICAN_DREAM' THEN
   SELECT driver_id INTO fastest_driver FROM public.results WHERE event_id=e.id AND status='classified' AND laps_completed>0 AND best_lap_ms>0 ORDER BY best_lap_ms,finish_position,driver_id LIMIT 1;
   UPDATE public.results SET points=CASE WHEN status='classified' THEN coalesce((ARRAY[25,18,15,12,10,8,6,4,2,1])[finish_position],0)+CASE WHEN driver_id=fastest_driver THEN 2 ELSE 0 END ELSE 0 END WHERE event_id=e.id;
  END IF;
  IF prior_state='official' THEN PERFORM public.atx_finalize_import(e.id); ELSE UPDATE public.events SET result_publication_state=prior_state WHERE id=e.id; END IF;
 END LOOP;
END $$;
COMMIT;
