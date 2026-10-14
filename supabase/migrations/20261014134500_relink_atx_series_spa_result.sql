BEGIN;

-- The Collector key for 261014_141230_R.json was still attached to a
-- soft-deleted duplicate. Move it to the published ATX Series Spa event.
UPDATE public.events
SET source_event_key=NULL
WHERE id='15caef1d-2cb3-494b-9d06-f591e2f7488e'
  AND deleted_at IS NOT NULL
  AND source_event_key='acc_20261014_spa_francorchamps_141230_b281e6ee';

UPDATE public.events
SET source_event_key='acc_20261014_spa_francorchamps_141230_b281e6ee'
WHERE id='f6acccc9-f696-4d35-af04-797b699a0674'
  AND deleted_at IS NULL
  AND competition_code='ATXS'
  AND circuit_key='spa';

COMMIT;
