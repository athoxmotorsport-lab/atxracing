-- Run inside BEGIN/ROLLBACK after installing the migration; uses existing pilots without retaining any data.
DO $$
DECLARE test_event_id uuid:=gen_random_uuid(); pilots uuid[]; caught boolean:=false;
BEGIN
 SELECT array_agg(id) INTO pilots FROM (SELECT id FROM public.drivers ORDER BY id LIMIT 3) d;
 IF array_length(pilots,1)<>3 THEN RAISE EXCEPTION 'three_test_pilots_required'; END IF;
 INSERT INTO public.events(id,slug,title_fr,title_en,starts_at,event_type,status,competition_code,championship_code,game,circuit_name,circuit_key,duration_minutes,max_drivers,is_public,is_official,results_import_in_progress)
 VALUES(test_event_id,'automatic-test-'||test_event_id,'WGT Endurance test','WGT Endurance test',now()-interval '1 day','endurance','completed','WGT','WGT_ENDURANCE','Assetto Corsa Competizione','Monza','monza',60,22,true,true,false);
 INSERT INTO public.results(event_id,driver_id,status,finish_position,best_lap_ms,points) VALUES
 (test_event_id,pilots[1],'classified',1,108000,25),(test_event_id,pilots[2],'classified',1,108000,25),(test_event_id,pilots[3],'classified',2,107000,18);
 INSERT INTO public.registrations(event_id,driver_id,team_name,race_number) VALUES(test_event_id,pilots[1],'Winning crew',69),(test_event_id,pilots[2],'Winning crew',69),(test_event_id,pilots[3],'Second crew',83);
 PERFORM public.atx_finalize_import(test_event_id);
 IF (SELECT count(*) FROM public.results WHERE results.event_id=test_event_id AND points=50)<>2 THEN RAISE EXCEPTION 'both_winners_require_50_points'; END IF;
 IF (SELECT points FROM public.results WHERE results.event_id=test_event_id AND driver_id=pilots[3])<>38 THEN RAISE EXCEPTION 'second_crew_points_and_fastest_bonus'; END IF;
 IF (SELECT result_publication_state FROM public.events WHERE id=test_event_id)<>'official' THEN RAISE EXCEPTION 'automatic_official_publication'; END IF;
 PERFORM public.atx_finalize_import(test_event_id);
 BEGIN UPDATE public.results SET points=0 WHERE results.event_id=test_event_id; EXCEPTION WHEN OTHERS THEN IF SQLERRM='results_locked' THEN caught:=true; ELSE RAISE; END IF; END;
 IF NOT caught THEN RAISE EXCEPTION 'official_results_must_remain_locked'; END IF;
END $$;
SELECT 'PASS: same crew points for each driver, automatic official publication, idempotence and official lock' AS test;
