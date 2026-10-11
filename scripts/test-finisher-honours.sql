-- Execute inside BEGIN/ROLLBACK with the finisher-only view installed.
DO $$
DECLARE event_id_test uuid:=gen_random_uuid(); pilots uuid[]; n integer;
BEGIN
 SELECT array_agg(id) INTO pilots FROM (SELECT id FROM public.drivers ORDER BY id LIMIT 4) d;
 IF array_length(pilots,1)<>4 THEN RAISE EXCEPTION 'four_test_pilots_required'; END IF;
 INSERT INTO public.events(id,slug,title_fr,title_en,starts_at,event_type,status,competition_code,game,circuit_name,circuit_key,duration_minutes,max_drivers,is_public,is_official)
 VALUES(event_id_test,'honours-test-'||event_id_test,'Daily Race test','Daily Race test',now()-interval '1 day','daily_race','completed','DR','Assetto Corsa Competizione','Monza','monza',60,22,true,true);
 INSERT INTO public.results(event_id,driver_id,status,finish_position,laps_completed,best_lap_ms) VALUES
 (event_id_test,pilots[1],'classified',1,50,100000),(event_id_test,pilots[2],'dnf',2,10,90000),(event_id_test,pilots[3],'dns',3,0,80000),(event_id_test,pilots[4],'dsq',4,50,70000);
 INSERT INTO public.safety_stats(event_id,driver_id,valid_laps) VALUES(event_id_test,pilots[1],40),(event_id_test,pilots[2],100),(event_id_test,pilots[3],200),(event_id_test,pilots[4],300);
 UPDATE public.events SET result_publication_state='official' WHERE id=event_id_test;
 SELECT count(*) INTO n FROM public.event_honours WHERE event_id=event_id_test AND driver_id=pilots[1];
 IF n<>2 OR EXISTS(SELECT 1 FROM public.event_honours WHERE event_id=event_id_test AND driver_id<>pilots[1]) THEN RAISE EXCEPTION 'only_finisher_can_win_either_award'; END IF;
 UPDATE public.events SET result_publication_state='provisional' WHERE id=event_id_test;
 UPDATE public.results SET status='dnf' WHERE event_id=event_id_test AND driver_id=pilots[1];
 UPDATE public.events SET result_publication_state='official' WHERE id=event_id_test;
 IF EXISTS(SELECT 1 FROM public.event_honours WHERE event_id=event_id_test) THEN RAISE EXCEPTION 'no_finisher_no_award'; END IF;
END $$;
SELECT 'PASS: DNF, DNS and DSQ excluded from both awards; no finisher means no award' AS test;
