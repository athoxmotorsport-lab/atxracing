BEGIN;
ALTER TABLE public.driver_profile_preferences ADD COLUMN preferred_race_formats text[] NOT NULL DEFAULT '{}';
UPDATE public.driver_profile_preferences SET preferred_race_formats=ARRAY[preferred_race_format] WHERE preferred_race_format IS NOT NULL;
ALTER TABLE public.driver_profile_preferences ADD CONSTRAINT preferred_race_formats_valid CHECK (preferred_race_formats <@ ARRAY['sprint_60','sprint_90','endurance']::text[] AND cardinality(preferred_race_formats)<=3);
ALTER FUNCTION public.save_driver_profile(uuid,jsonb) RENAME TO save_driver_profile_single_format;
CREATE FUNCTION public.save_driver_profile(p_driver_id uuid,p_profile jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; formats text[];
BEGIN
 formats:=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_profile->'preferred_race_formats',CASE WHEN nullif(p_profile->>'preferred_race_format','') IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(p_profile->>'preferred_race_format') END)));
 IF NOT formats <@ ARRAY['sprint_60','sprint_90','endurance']::text[] OR cardinality(formats)>3 OR cardinality(formats)<>(SELECT count(DISTINCT f) FROM unnest(formats) f) THEN RAISE EXCEPTION 'invalid_preferred_race_formats'; END IF;
 result:=public.save_driver_profile_single_format(p_driver_id,p_profile||jsonb_build_object('preferred_race_format',formats[1]));
 UPDATE public.driver_profile_preferences SET preferred_race_formats=formats WHERE driver_id=p_driver_id;
 RETURN result||jsonb_build_object('preferred_race_formats',formats);
END $$;
REVOKE ALL ON FUNCTION public.save_driver_profile(uuid,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_driver_profile(uuid,jsonb) TO service_role;
COMMIT;
