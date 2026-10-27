-- Applied manually by the user on 2026-10-27; retained as the reviewed reference.
-- Do not rerun against an existing contact_inquiries table.
BEGIN;
CREATE TABLE public.contact_inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL CHECK (char_length(btrim(first_name)) BETWEEN 1 AND 100),
    last_name text NOT NULL CHECK (char_length(btrim(last_name)) BETWEEN 1 AND 100),
    email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
    message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 5000),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_inquiries_created_at_id_idx ON public.contact_inquiries (created_at DESC, id DESC);
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_inquiries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.contact_inquiries TO service_role;
COMMIT;
