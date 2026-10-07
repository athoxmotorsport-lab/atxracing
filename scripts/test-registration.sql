-- Synthetic records only; every change is rolled back by the caller.
DO $$
DECLARE d1 uuid:=gen_random_uuid(); d2 uuid:=gen_random_uuid(); d3 uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); w uuid:=gen_random_uuid(); code uuid; payload jsonb; draft_id uuid; published jsonb;
BEGIN
 INSERT INTO public.drivers(id,display_name) VALUES(d1,'Registration test A'),(d2,'Registration test B'),(d3,'Registration test C');
 INSERT INTO public.driver_identities(driver_id,steam_id64,last_login_at) VALUES(d1,'70000000000000001',now()),(d2,'70000000000000002',now()),(d3,'70000000000000003',now());
 INSERT INTO public.driver_profile_preferences(driver_id,nickname,profile_confirmed_at) VALUES(d1,'Test A',now()),(d2,'Test B',now()),(d3,'Test C',now());
 INSERT INTO public.atx_acc_cars(car_model_id,name) VALUES(998,'Synthetic test car');
 INSERT INTO public.events(id,slug,event_type,status,title_fr,title_en,circuit_name,circuit_key,starts_at,duration_minutes,max_drivers,is_public,competition_code,format_code,site_registration_enabled)
 VALUES(e,'registration-test-'||e,'daily_race','registration_open','Test','Test','Test','test',now()+interval '1 day',45,1,true,'ATXS','ATXS',true),
 (w,'registration-test-'||w,'sprint','registration_open','Test','Test','Test','test',now()+interval '1 day',60,1,true,'WGT','WGT_SPRINT',true);
 payload:='{"firstName":"Test","lastName":"Driver","shortName":"TST","raceNumber":37,"carModelId":998,"teamName":"Test crew"}'::jsonb;
 PERFORM public.atx_register_entry(d1,e,'register',payload);
 BEGIN PERFORM public.atx_register_entry(d1,e,'register',payload); RAISE EXCEPTION 'duplicate not rejected'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'already_registered' THEN RAISE; END IF; END;
 BEGIN PERFORM public.atx_register_entry(d2,e,'register',payload); RAISE EXCEPTION 'capacity not enforced'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'event_full' THEN RAISE; END IF; END;
 PERFORM public.atx_register_entry(d1,e,'withdraw');
 PERFORM public.atx_register_entry(d2,e,'register',payload);
 IF (SELECT count(*) FROM public.atx_race_entries WHERE event_id=e)<>1 THEN RAISE EXCEPTION 'withdrawal did not release capacity'; END IF;
 PERFORM public.atx_register_entry(d1,w,'register',payload);
 SELECT join_code INTO code FROM public.atx_race_entries WHERE event_id=w;
 PERFORM public.atx_register_entry(d2,w,'register',payload||jsonb_build_object('joinCode',code));
 BEGIN PERFORM public.atx_register_entry(d3,w,'register',payload||jsonb_build_object('joinCode',code)); RAISE EXCEPTION 'crew limit not enforced'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'crew_full' THEN RAISE; END IF; END;
 BEGIN PERFORM public.atx_register_entry(d1,w,'withdraw'); RAISE EXCEPTION 'captain removed crew'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'captain_has_members' THEN RAISE; END IF; END;
 PERFORM public.atx_register_entry(d2,w,'withdraw'); PERFORM public.atx_register_entry(d1,w,'withdraw');
 UPDATE public.events SET starts_at=now()-interval '1 minute' WHERE id=w;
 BEGIN PERFORM public.atx_register_entry(d1,w,'register',payload); RAISE EXCEPTION 'late registration accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'registration_closed' THEN RAISE; END IF; END;
 INSERT INTO public.atx_event_drafts(created_by,draft) VALUES(d1,jsonb_build_object('competition','ATXS','format','ATXS','titleFr','Test','titleEn','Test','descriptionFr','Test','descriptionEn','Test','circuit','Test','circuitKey','test','startsAt',now()+interval '1 day','imageUrl','https://example.test/test.webp','practiceMinutes',2,'qualifyingMinutes',15,'raceMinutes',45,'maxDrivers',28)) RETURNING id INTO draft_id;
 published:=public.publish_atx_event_draft(draft_id);
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=(published->>'id')::uuid AND site_registration_enabled AND simgrid_url IS NULL AND duration_minutes=45) THEN RAISE EXCEPTION 'ATXS publication invalid'; END IF;
 INSERT INTO public.atx_event_drafts(created_by,draft) VALUES(d1,jsonb_build_object('competition','DR','format','DR_90','titleFr','Test','titleEn','Test','descriptionFr','Test','descriptionEn','Test','circuit','Test','circuitKey','test','startsAt',now()+interval '1 day','imageUrl','https://example.test/test.webp','simgridUrl','https://www.thesimgrid.com/championships/1','practiceMinutes',60,'qualifyingMinutes',15,'raceMinutes',90,'maxDrivers',28)) RETURNING id INTO draft_id;
 published:=public.publish_atx_event_draft(draft_id);
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=(published->>'id')::uuid AND competition_code='DR' AND mandatory_stop_count=2 AND NOT mandatory_tyre_change AND NOT mandatory_refuelling) THEN RAISE EXCEPTION 'Daily Race 90 rules invalid'; END IF;
END $$;
