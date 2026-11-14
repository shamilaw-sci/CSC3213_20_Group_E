BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_before_ban text;
CREATE OR REPLACE FUNCTION public.capture_role_before_ban()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
 IF NEW.role = 'BANNED' AND OLD.role IS DISTINCT FROM 'BANNED' THEN
  NEW.role_before_ban := OLD.role;
 ELSIF NEW.role IS DISTINCT FROM 'BANNED' THEN
  NEW.role_before_ban := NULL;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS users_capture_role_before_ban ON public.users;
CREATE TRIGGER users_capture_role_before_ban BEFORE UPDATE OF role ON public.users
 FOR EACH ROW EXECUTE FUNCTION public.capture_role_before_ban();
CREATE OR REPLACE FUNCTION public.restore_banned_user_role(target_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE target public.users%ROWTYPE;
BEGIN
 SELECT * INTO target FROM public.users WHERE id = target_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
 IF target.role <> 'BANNED' THEN
  RETURN jsonb_build_object('id', target.id, 'role', target.role);
 END IF;
 IF target.role_before_ban IS NULL OR target.role_before_ban NOT IN
  ('BUYER','SELLER','AGENT','PENDING_AGENT','REJECTED_AGENT','ADMIN') THEN
  RAISE EXCEPTION USING ERRCODE = 'PZ002', MESSAGE = 'Previous role unavailable; administrator review required';
 END IF;
 UPDATE public.users SET role = target.role_before_ban::public.user_role WHERE id = target_id;
 RETURN jsonb_build_object('id', target.id, 'role', target.role_before_ban);
END $$;
REVOKE ALL ON FUNCTION public.capture_role_before_ban() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_banned_user_role(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_role_before_ban() TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_banned_user_role(uuid) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
