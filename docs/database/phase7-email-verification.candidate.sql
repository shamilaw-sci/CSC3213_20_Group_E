-- Candidate migration. Apply only after coordinated staging acceptance.
BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
    ADD COLUMN IF NOT EXISTS email_verification_required boolean NOT NULL DEFAULT false;

CREATE SCHEMA IF NOT EXISTS auth_private;
REVOKE ALL ON SCHEMA auth_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS auth_private.email_challenges (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    purpose text NOT NULL CHECK (purpose IN ('signup', 'email_change')),
    target_email text NOT NULL,
    current_email text NOT NULL,
    token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
    issued_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, purpose)
);

REVOKE ALL ON TABLE auth_private.email_challenges FROM PUBLIC, anon, authenticated;
ALTER TABLE auth_private.email_challenges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.issue_email_challenge(
    p_user_id uuid, p_purpose text, p_current_email text,
    p_target_email text, p_token_digest bytea
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    issued timestamptz := pg_catalog.clock_timestamp();
BEGIN
    INSERT INTO auth_private.email_challenges
        (user_id, purpose, current_email, target_email, token_digest, issued_at, expires_at)
    SELECT id, p_purpose, email, p_target_email, p_token_digest, issued, issued + interval '30 minutes'
    FROM public.users
    WHERE id = p_user_id AND email = p_current_email
      AND role NOT IN ('BANNED', 'ADMIN')
      AND (
          (p_purpose = 'signup' AND p_target_email = email AND email_verified_at IS NULL)
          OR (p_purpose = 'email_change' AND p_target_email <> email)
      )
    ON CONFLICT (user_id, purpose) DO UPDATE
    SET current_email = EXCLUDED.current_email, target_email = EXCLUDED.target_email,
        token_digest = EXCLUDED.token_digest, issued_at = EXCLUDED.issued_at,
        expires_at = EXCLUDED.expires_at
    WHERE email_challenges.issued_at <= EXCLUDED.issued_at - interval '1 minute';

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_email_challenge(uuid, text, text, text, bytea) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_email_challenge(uuid, text, text, text, bytea) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_email_challenge(p_token_digest bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    challenge auth_private.email_challenges%ROWTYPE;
BEGIN
    DELETE FROM auth_private.email_challenges
    WHERE token_digest = p_token_digest
      AND expires_at > pg_catalog.clock_timestamp()
    RETURNING * INTO challenge;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    UPDATE public.users
    SET email = challenge.target_email,
        email_verified_at = pg_catalog.clock_timestamp()
    WHERE id = challenge.user_id
      AND email = challenge.current_email
      AND role NOT IN ('BANNED', 'ADMIN')
      AND (challenge.purpose = 'email_change' OR email = challenge.target_email);

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    RETURN CASE WHEN challenge.purpose = 'email_change' THEN challenge.current_email ELSE '' END;
EXCEPTION WHEN unique_violation THEN
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_email_challenge(bytea) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_email_challenge(bytea) TO service_role;

COMMIT;
