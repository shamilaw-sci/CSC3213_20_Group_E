BEGIN;
CREATE OR REPLACE FUNCTION public.admin_mfa_rotate_recovery(
    p_id uuid, p_secret text, p_step bigint, p_recovery text[]
) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    WITH changed AS (
        UPDATE auth_private.admin_mfa m
        SET last_step = p_step, recovery_digests = p_recovery
        WHERE m.user_id = p_id AND m.encrypted_secret = p_secret
          AND p_step > m.last_step
          AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_id AND u.role = 'ADMIN')
        RETURNING 1
    ) SELECT EXISTS (SELECT 1 FROM changed);
$$;
REVOKE ALL ON FUNCTION public.admin_mfa_rotate_recovery(uuid,text,bigint,text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mfa_rotate_recovery(uuid,text,bigint,text[]) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
