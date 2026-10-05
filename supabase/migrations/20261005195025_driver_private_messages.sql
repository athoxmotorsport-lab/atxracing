-- One-to-one messages for verified Steam drivers. Only the Edge Function may read or write.
CREATE TABLE IF NOT EXISTS public.driver_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 CONSTRAINT driver_messages_not_self CHECK (sender_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS driver_messages_sender_latest ON public.driver_messages(sender_id,created_at DESC);
CREATE INDEX IF NOT EXISTS driver_messages_recipient_latest ON public.driver_messages(recipient_id,created_at DESC);
ALTER TABLE public.driver_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.driver_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_messages TO service_role;

CREATE TABLE IF NOT EXISTS public.driver_message_blocks (
 blocker_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
 blocked_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(blocker_id,blocked_id),
 CONSTRAINT driver_message_blocks_not_self CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.driver_message_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.driver_message_blocks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.driver_message_blocks TO service_role;
