-- Additive audit storage; apply before restarting updated backend.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS public.admin_audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL,
 actor text NOT NULL,
 action text NOT NULL,
 target text NOT NULL,
 ip text NOT NULL DEFAULT '',
 severity text NOT NULL CHECK (severity IN ('info','success','warning','danger')),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.admin_audit_events FROM service_role;
GRANT SELECT, INSERT ON public.admin_audit_events TO service_role;
CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx ON public.admin_audit_events(created_at DESC);
NOTIFY pgrst, 'reload schema';
COMMIT;
