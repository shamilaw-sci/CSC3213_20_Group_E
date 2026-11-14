-- Additive weekly activity tracking for Seller dashboards.
-- Apply to the existing hosted database after phase7-property-soft-delete.hosted-review.sql.
-- No historical daily views are inferred from cumulative counters.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS public.property_activity_tracking (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 started_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO public.property_activity_tracking(id) VALUES(true) ON CONFLICT(id) DO NOTHING;
ALTER TABLE public.property_activity_tracking ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.property_activity_tracking FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.property_activity_tracking TO service_role;

CREATE TABLE IF NOT EXISTS public.property_view_days (
 property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
 view_date date NOT NULL,
 views bigint NOT NULL DEFAULT 0 CHECK (views >= 0),
 PRIMARY KEY(property_id,view_date)
);
ALTER TABLE public.property_view_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.property_view_days FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.property_view_days TO service_role;

CREATE INDEX IF NOT EXISTS conversations_seller_activity_idx
 ON public.conversations(seller_id,created_at,id) WHERE type='property';

-- Both the cumulative count and daily bucket commit in the same transaction.
-- Updating the property row serializes with archival and concurrent page views.
CREATE OR REPLACE FUNCTION public.increment_property_views(property_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE new_views integer; day_in_sri_lanka date;
BEGIN
 UPDATE public.properties SET views_count=coalesce(views_count,0)+1
 WHERE id=$1 AND deleted_at IS NULL AND status='approved'
 RETURNING views_count INTO new_views;
 IF NOT FOUND THEN RETURN NULL; END IF;
 day_in_sri_lanka := (clock_timestamp() AT TIME ZONE 'Asia/Colombo')::date;
 INSERT INTO public.property_view_days AS daily(property_id,view_date,views)
 VALUES($1,day_in_sri_lanka,1)
 ON CONFLICT ON CONSTRAINT property_view_days_pkey
 DO UPDATE SET views=daily.views+1;
 RETURN new_views;
END $$;
-- The Node view endpoint invokes this with its server-side service role.
REVOKE ALL ON FUNCTION public.increment_property_views(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_views(uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;

SELECT started_at AS view_tracking_started_at FROM public.property_activity_tracking WHERE id=true;
SELECT has_function_privilege('service_role','public.increment_property_views(uuid)','EXECUTE') AS service_execute,
 has_function_privilege('anon','public.increment_property_views(uuid)','EXECUTE') AS anon_execute,
 has_function_privilege('authenticated','public.increment_property_views(uuid)','EXECUTE') AS authenticated_execute;
-- Expected service_execute=true, anon_execute=false, authenticated_execute=false.
