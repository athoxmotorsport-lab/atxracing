BEGIN;
-- Canonical sporting profiles for historical Collector identities.
-- Login identities and sessions remain attached to their original Steam accounts.
CREATE TABLE public.driver_import_merges (
 source_driver_id uuid PRIMARY KEY REFERENCES public.drivers(id),
 target_driver_id uuid NOT NULL REFERENCES public.drivers(id),
 merged_at timestamptz NOT NULL DEFAULT now(),
 source_snapshot jsonb NOT NULL,
 CHECK(source_driver_id<>target_driver_id)
);
ALTER TABLE public.driver_import_merges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.driver_import_merges FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.driver_import_merges TO service_role;
COMMIT;
