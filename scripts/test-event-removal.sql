-- Synthetic fixtures; execute in BEGIN / ROLLBACK.
DO $$ DECLARE car integer; a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); entry uuid:=gen_random_uuid(); sess uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.drivers(id,display_name) VALUES(a,'Synthetic organizer'),(b,'Synthetic participant');
 INSERT INTO public.driver_roles(driver_id,role) VALUES(a,'admin');
 INSERT INTO public.events(id,slug,event_type,status,title_fr,title_en,circuit_name,circuit_key,starts_at,duration_minutes,max_drivers,is_public,is_official,publication_origin,site_registration_enabled,competition_code) VALUES(e,'synthetic-removal-'||e,'daily_race','registration_open','Synthetic race','Synthetic race','Monza','monza',now()+interval '1 day',45,20,true,true,'organizer',true,'ATXS');
 SELECT car_model_id INTO car FROM public.atx_acc_cars LIMIT 1;
 INSERT INTO public.atx_race_entries(id,event_id,owner_driver_id,car_model_id,race_number,team_name) VALUES(entry,e,b,car,37,'Synthetic team');
 INSERT INTO public.atx_entry_members(entry_id,event_id,driver_id,first_name,last_name,short_name) VALUES(entry,e,b,'Test','Driver','TST');
 INSERT INTO public.atx_coin_ledger(driver_id,event_id,amount,kind,operation_key) VALUES(b,e,-1,'entry','synthetic-entry:'||e);
 INSERT INTO public.acc_sessions(id,event_id,payload_checksum,source_file,session_type) VALUES(sess,e,repeat('b',64),'synthetic-FP.json','FP');
 INSERT INTO public.acc_session_results(session_id,driver_id,best_lap_ms) VALUES(sess,b,100000);
 BEGIN PERFORM public.atx_remove_event(b,e);RAISE EXCEPTION 'Non-admin deleted event';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'forbidden' THEN RAISE;END IF;END;
 PERFORM public.atx_remove_event(a,e);PERFORM public.atx_remove_event(a,e);
 IF EXISTS(SELECT 1 FROM public.atx_entry_members WHERE event_id=e) OR EXISTS(SELECT 1 FROM public.atx_race_entries WHERE event_id=e) THEN RAISE EXCEPTION 'Registrations remain';END IF;
 IF (SELECT sum(amount) FROM public.atx_coin_ledger WHERE event_id=e)<>0 THEN RAISE EXCEPTION 'Missing or duplicate refund';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.events WHERE id=e AND deleted_at IS NOT NULL AND status='cancelled' AND is_public) THEN RAISE EXCEPTION 'Event deletion state incorrect';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.acc_session_results WHERE session_id=sess AND best_lap_ms=100000) THEN RAISE EXCEPTION 'Practice lap lost';END IF;
 INSERT INTO public.results(event_id,driver_id,status,finish_position,laps_completed,best_lap_ms,points) VALUES(e,b,'classified',1,1,100000,25);
 UPDATE public.events SET deleted_at=NULL,result_publication_state='official' WHERE id=e;
 BEGIN PERFORM public.atx_remove_event(a,e);RAISE EXCEPTION 'Official results deleted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'results_locked' THEN RAISE;END IF;END;
 UPDATE public.events SET publication_origin='collector' WHERE id=e;
 BEGIN PERFORM public.atx_remove_event(a,e);RAISE EXCEPTION 'Collector session deleted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'event_not_found' THEN RAISE;END IF;END;
END $$;
