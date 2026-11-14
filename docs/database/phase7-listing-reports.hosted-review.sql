-- Additive hosted review only. Apply AFTER phase7-property-soft-delete.
-- Application backend uses service_role; browser roles cannot inspect complaints.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS public.listing_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 property_id uuid NOT NULL REFERENCES public.properties(id),
 reporter_id uuid NOT NULL REFERENCES public.users(id),
 category text NOT NULL CHECK(category IN ('misleading','fraud','duplicate','unavailable','inappropriate','other')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 2000),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','dismissed','actioned')),
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz, resolved_by uuid REFERENCES public.users(id), resolution_note text,
 CHECK ((status='open' AND resolved_at IS NULL AND resolved_by IS NULL AND resolution_note IS NULL)
 OR (status<>'open' AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL AND resolution_note IS NOT NULL AND length(btrim(resolution_note)) BETWEEN 10 AND 2000))
);
CREATE UNIQUE INDEX IF NOT EXISTS listing_reports_one_open_idx ON public.listing_reports(reporter_id,property_id) WHERE status='open';
CREATE INDEX IF NOT EXISTS listing_reports_status_date_idx ON public.listing_reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS listing_reports_property_idx ON public.listing_reports(property_id);
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.listing_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.listing_reports TO service_role;

CREATE OR REPLACE FUNCTION public.submit_listing_report(p_property_id uuid,p_reporter_id uuid,p_category text,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE listing public.properties%ROWTYPE; result public.listing_reports%ROWTYPE;
BEGIN
 IF p_category IS NULL OR p_category NOT IN ('misleading','fraud','duplicate','unavailable','inappropriate','other')
 OR p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 10 AND 2000 THEN
 RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid report category or reason'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_reporter_id AND role<>'BANNED') THEN
 RAISE EXCEPTION USING ERRCODE='PZ003',MESSAGE='Reporting account unavailable'; END IF;
 SELECT * INTO listing FROM public.properties WHERE id=p_property_id FOR UPDATE;
 IF NOT FOUND OR listing.deleted_at IS NOT NULL OR listing.status<>'approved' OR listing.payment_status<>'Paid' THEN
 RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='Listing is unavailable'; END IF;
 INSERT INTO public.listing_reports(property_id,reporter_id,category,reason) VALUES(p_property_id,p_reporter_id,p_category,btrim(p_reason)) RETURNING * INTO result;
 RETURN jsonb_build_object('id',result.id,'status',result.status,'created_at',result.created_at);
END $$;

CREATE OR REPLACE FUNCTION public.resolve_listing_report(p_report_id uuid,p_actor_id uuid,p_action text,p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE complaint public.listing_reports%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor_id AND role='ADMIN') THEN
 RAISE EXCEPTION USING ERRCODE='PZ003',MESSAGE='Admin access required'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('dismiss','archive_listing') OR p_note IS NULL OR length(btrim(p_note)) NOT BETWEEN 10 AND 2000 THEN
 RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid decision or resolution note'; END IF;
 SELECT * INTO complaint FROM public.listing_reports WHERE id=p_report_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='Report not found'; END IF;
 IF complaint.status<>'open' THEN RAISE EXCEPTION USING ERRCODE='PZ002',MESSAGE='Report already resolved; refresh to view the saved decision'; END IF;
 IF p_action='archive_listing' THEN
  -- Same soft-delete marker as existing Admin archive; no historical rows are removed.
  PERFORM id FROM public.properties WHERE id=complaint.property_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='PZ001',MESSAGE='Listing not found'; END IF;
  UPDATE public.properties SET deleted_at=now() WHERE id=complaint.property_id AND deleted_at IS NULL;
 END IF;
 UPDATE public.listing_reports SET status=CASE WHEN p_action='dismiss' THEN 'dismissed' ELSE 'actioned' END,
 resolved_at=now(),resolved_by=p_actor_id,resolution_note=btrim(p_note) WHERE id=p_report_id RETURNING * INTO complaint;
 RETURN to_jsonb(complaint);
END $$;
REVOKE ALL ON FUNCTION public.submit_listing_report(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.resolve_listing_report(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_listing_report(uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_listing_report(uuid,uuid,text,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
