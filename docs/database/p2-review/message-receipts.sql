-- Apply manually before restarting the backend with recipient receipt code.
-- Existing messages retain their historical read_at baseline. New messages use receipts.
BEGIN;
ALTER TABLE public.messages ADD COLUMN recipient_receipts boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ALTER COLUMN recipient_receipts SET DEFAULT true;
CREATE TABLE public.message_receipts AS
    SELECT m.id AS message_id, u.id AS user_id, now() AS read_at
    FROM public.messages m CROSS JOIN public.users u WITH NO DATA;
ALTER TABLE public.message_receipts
    ALTER COLUMN message_id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN read_at SET NOT NULL,
    ALTER COLUMN read_at SET DEFAULT now(),
    ADD PRIMARY KEY (message_id, user_id),
    ADD FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
    ADD FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
CREATE INDEX message_receipts_user_idx ON public.message_receipts (user_id, message_id);
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.message_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.message_receipts TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
