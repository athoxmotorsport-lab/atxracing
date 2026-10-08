BEGIN;
-- Older Collector imports used special_event even for named Daily Races.
-- Restore confirmed historical races without changing results or lap sessions.
-- The separate afternoon Watkins Glen session remains pending identification.
UPDATE public.events SET competition_code='DR',event_type='daily_race',
 result_publication_state='official',results_validated_at=coalesce(results_validated_at,now())
WHERE id IN (
 'bf9d32bc-813d-42f7-a818-dafb6cc31605', -- Monza, 9 September
 '3702869c-1f5a-45fd-b1f5-474d9b01a096', -- Nurburgring GP, 11 September
 '3b32450a-5441-4ebe-9c31-c7fda8d8a78c', -- Barcelona, 13 September
 'b88d5334-aa2a-4210-832f-3e0a73ef07ff', -- Kyalami, 20 September
 '1cfc9ff1-291a-49b4-996c-a05d341f556f', -- Watkins Glen evening
 '3dbae447-644d-409e-aaa7-4ed5254549ee', -- Valencia
 '106c07d3-d040-4428-8d3f-6d3c73c73a14', -- Laguna Seca
 '446576f0-e524-42f3-b2d5-c0a9327e12a6'  -- Nurburgring 24h
) AND EXISTS(SELECT 1 FROM public.results r WHERE r.event_id=events.id)
 AND EXISTS(SELECT 1 FROM public.acc_sessions s WHERE s.event_id=events.id AND s.session_type='R');
DO $$ DECLARE e record; BEGIN
 FOR e IN SELECT id FROM public.events WHERE competition_code='DR' AND result_publication_state='official'
 LOOP PERFORM public.atx_reconcile_race_coins(e.id); END LOOP;
END $$;
COMMIT;
