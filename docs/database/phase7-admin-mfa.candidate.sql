BEGIN;
CREATE SCHEMA IF NOT EXISTS auth_private;
REVOKE ALL ON SCHEMA auth_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS auth_private.admin_mfa (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    setup_digest text,
    setup_expires timestamptz,
    encrypted_secret text,
    last_step bigint,
    recovery_digests text[] NOT NULL DEFAULT '{}',
    CHECK ((setup_digest IS NULL) = (setup_expires IS NULL))
);
REVOKE ALL ON auth_private.admin_mfa FROM PUBLIC, anon, authenticated;
ALTER TABLE auth_private.admin_mfa ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_mfa_finish_setup(p_id uuid, p_secret text, p_step bigint, p_recovery text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    WITH inserted AS (
        INSERT INTO auth_private.admin_mfa(user_id, encrypted_secret, last_step, recovery_digests)
        SELECT p_id, p_secret, p_step, p_recovery
        WHERE EXISTS (SELECT 1 FROM public.users WHERE id = p_id AND role = 'ADMIN')
        ON CONFLICT (user_id) DO NOTHING RETURNING 1
    ) SELECT EXISTS (SELECT 1 FROM inserted);
$$;
REVOKE ALL ON FUNCTION public.admin_mfa_finish_setup(uuid,text,bigint,text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mfa_finish_setup(uuid,text,bigint,text[]) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_mfa_state(p_id uuid)
RETURNS TABLE (setup_digest text, setup_expires timestamptz, encrypted_secret text)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT m.setup_digest, m.setup_expires, m.encrypted_secret
    FROM auth_private.admin_mfa m JOIN public.users u ON u.id = m.user_id
    WHERE m.user_id = p_id AND u.role = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION public.admin_mfa_enroll(
    p_id uuid, p_setup_digest text, p_secret text, p_step bigint, p_recovery text[]
)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    WITH changed AS (
        UPDATE auth_private.admin_mfa m
        SET encrypted_secret = p_secret, last_step = p_step, recovery_digests = p_recovery,
            setup_digest = NULL, setup_expires = NULL
        WHERE m.user_id = p_id AND m.setup_digest = p_setup_digest
          AND m.setup_expires > pg_catalog.clock_timestamp() AND m.encrypted_secret IS NULL
          AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_id AND u.role = 'ADMIN')
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM changed);
$$;

CREATE OR REPLACE FUNCTION public.admin_mfa_consume(p_id uuid, p_secret text, p_step bigint, p_recovery text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    WITH changed AS (
        UPDATE auth_private.admin_mfa m
        SET last_step = COALESCE(p_step, m.last_step),
            recovery_digests = CASE WHEN p_recovery IS NULL THEN m.recovery_digests
                ELSE pg_catalog.array_remove(m.recovery_digests, p_recovery) END
        WHERE m.user_id = p_id AND m.encrypted_secret = p_secret
          AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_id AND u.role = 'ADMIN')
          AND ((p_step IS NOT NULL AND p_recovery IS NULL AND p_step > m.last_step)
            OR (p_step IS NULL AND p_recovery = ANY(m.recovery_digests)))
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM changed);
$$;

REVOKE ALL ON FUNCTION public.admin_mfa_state(uuid), public.admin_mfa_enroll(uuid,text,text,bigint,text[]),
    public.admin_mfa_consume(uuid,text,bigint,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mfa_state(uuid), public.admin_mfa_enroll(uuid,text,text,bigint,text[]),
    public.admin_mfa_consume(uuid,text,bigint,text) TO service_role;
COMMIT;
