-- Review candidate for the verified ThirasaraDB schema.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

LOCK TABLE public.conversations IN ACCESS EXCLUSIVE MODE;

DO $guard$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.conversations'::regclass
          AND conname = 'conversations_type_check'
          AND contype = 'c'
          AND convalidated
          AND pg_get_constraintdef(oid) =
              'CHECK ((type = ANY (ARRAY[''property''::text, ''support''::text])))'
    ) THEN
        RAISE EXCEPTION 'Expected validated property/support conversation constraint';
    END IF;
END
$guard$;

ALTER TABLE public.conversations
    DROP CONSTRAINT conversations_type_check,
    ADD CONSTRAINT conversations_type_check CHECK (type IN ('property', 'support', 'agent'));

COMMIT;
