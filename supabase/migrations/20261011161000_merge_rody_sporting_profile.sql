BEGIN;
DO $$
DECLARE source uuid:='a1865312-7682-4920-9bd5-e2728a010a66'; target uuid:='298cc835-2efe-484d-882d-87eb441b1490'; item record; ref record; n bigint; races_before bigint; laps_before bigint; points_before numeric;
BEGIN
 IF EXISTS(SELECT 1 FROM public.driver_import_merges WHERE source_driver_id=source AND target_driver_id=target) THEN RETURN; END IF;
 PERFORM 1 FROM public.drivers WHERE id IN (source,target) ORDER BY id FOR UPDATE;
 IF (SELECT count(*) FROM public.drivers WHERE id IN (source,target))<>2 THEN RAISE EXCEPTION 'both_profiles_required'; END IF;
 IF EXISTS(SELECT 1 FROM public.driver_identities WHERE driver_id=source AND last_login_at IS NOT NULL) THEN RAISE EXCEPTION 'collector_only_source_expected'; END IF;
 -- Abort rather than discard any unexpected private or overlapping history.
 FOR ref IN SELECT tc.table_name,kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu USING(constraint_name,constraint_schema) JOIN information_schema.constraint_column_usage ccu USING(constraint_name,constraint_schema) WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_schema='public' AND ccu.table_name='drivers' AND tc.table_name NOT IN ('driver_import_merges','driver_identities','driver_roles','driver_ratings','results','registrations','safety_stats','acc_session_results','acc_laps','acc_game_penalties') LOOP
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I=$1',ref.table_name,ref.column_name) INTO n USING source;
  IF n>0 THEN RAISE EXCEPTION 'unexpected_source_data: %',ref.table_name; END IF;
 END LOOP;
 SELECT count(*),sum(points) INTO races_before,points_before FROM public.results WHERE driver_id IN (source,target);
 SELECT count(*) INTO laps_before FROM public.acc_laps WHERE driver_id IN (source,target);
 INSERT INTO public.driver_import_merges(source_driver_id,target_driver_id,source_snapshot)
 SELECT source,target,jsonb_build_object('driver',to_jsonb(d),'ratings',(SELECT jsonb_agg(to_jsonb(r)) FROM public.driver_ratings r WHERE driver_id IN (source,target))) FROM public.drivers d WHERE id=source;
 CREATE TEMP TABLE rody_merge_events ON COMMIT DROP AS SELECT DISTINCT e.id,e.result_publication_state,e.results_validated_at FROM public.events e JOIN public.results r ON r.event_id=e.id WHERE r.driver_id=source;
 PERFORM 1 FROM public.events WHERE id IN (SELECT id FROM rody_merge_events) ORDER BY id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.events WHERE id IN (SELECT id FROM rody_merge_events) AND results_import_in_progress) THEN RAISE EXCEPTION 'race_import_in_progress'; END IF;
 -- State changes are transaction-local: official points are preserved throughout.
 UPDATE public.events SET result_publication_state='provisional' WHERE id IN (SELECT id FROM rody_merge_events);
 UPDATE public.results SET driver_id=target WHERE driver_id=source;
 UPDATE public.registrations SET driver_id=target WHERE driver_id=source;
 UPDATE public.safety_stats SET driver_id=target WHERE driver_id=source;
 UPDATE public.acc_session_results SET driver_id=target WHERE driver_id=source;
 UPDATE public.acc_laps SET driver_id=target WHERE driver_id=source;
 UPDATE public.acc_game_penalties SET driver_id=target WHERE driver_id=source;
 -- Keep every circuit; take the newer calculation when a circuit already exists.
 INSERT INTO public.driver_ratings(driver_id,circuit_key,performance_class,performance_score,safety_class,safety_score,algorithm_version,calculated_at)
 SELECT target,circuit_key,performance_class,performance_score,safety_class,safety_score,algorithm_version,calculated_at FROM public.driver_ratings WHERE driver_id=source
 ON CONFLICT(driver_id,circuit_key) DO UPDATE SET performance_class=EXCLUDED.performance_class,performance_score=EXCLUDED.performance_score,safety_class=EXCLUDED.safety_class,safety_score=EXCLUDED.safety_score,algorithm_version=EXCLUDED.algorithm_version,calculated_at=EXCLUDED.calculated_at WHERE EXCLUDED.calculated_at>public.driver_ratings.calculated_at;
 DELETE FROM public.driver_ratings WHERE driver_id=source;
 UPDATE public.events e SET result_publication_state=s.result_publication_state,results_validated_at=s.results_validated_at FROM rody_merge_events s WHERE e.id=s.id;
 UPDATE public.drivers SET is_profile_public=false WHERE id=source;
 IF (SELECT count(*) FROM public.results WHERE driver_id=target)<>races_before OR (SELECT sum(points) FROM public.results WHERE driver_id=target) IS DISTINCT FROM points_before OR (SELECT count(*) FROM public.acc_laps WHERE driver_id=target)<>laps_before THEN RAISE EXCEPTION 'sporting_history_must_be_preserved'; END IF;
 FOR item IN SELECT id FROM rody_merge_events LOOP PERFORM public.atx_reconcile_race_coins(item.id,target); END LOOP;
END $$;
COMMIT;
