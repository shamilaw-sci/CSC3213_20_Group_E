-- Reviewed combined rollout. Existing properties soft-delete schema required.
-- Applies all three features atomically; no fabricated historical backfill.
BEGIN;
SET LOCAL lock_timeout = '5s';
-- FEATURE SOURCE: phase7-search-demand.hosted-review.sql
-- Reviewed additive schema. Apply manually; no historical search backfill.

create table if not exists public.district_search_daily (
    day date not null,
    district text not null check (district = any(array['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'])),
    search_count bigint not null default 0 check (search_count >= 0),
    primary key (day, district)
);
-- Opaque, random submission IDs only. No query text, user ID, IP or coordinates.
-- Keep IDs to prevent replay across dates/services; capacity/retention needs operator review.
create table if not exists public.district_search_events (
    event_id uuid primary key,
    recorded_at timestamptz not null default now()
);
create table if not exists public.district_search_tracking (
    singleton boolean primary key default true check (singleton),
    started_at timestamptz not null default now()
);
insert into public.district_search_tracking(singleton) values (true) on conflict do nothing;
alter table public.district_search_daily enable row level security;
alter table public.district_search_events enable row level security;
alter table public.district_search_tracking enable row level security;
revoke all on public.district_search_daily, public.district_search_events, public.district_search_tracking from public, anon, authenticated;
grant select, insert, update on public.district_search_daily to service_role;
grant select, insert on public.district_search_events to service_role;
grant select on public.district_search_tracking to service_role;

create or replace function public.record_district_search(p_event_id uuid, p_district text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare accepted integer;
begin
    if p_event_id is null or p_district is null or not (p_district = any(array['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha','Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'])) then
        raise exception 'Unsupported district';
    end if;
    insert into public.district_search_events(event_id) values (p_event_id) on conflict do nothing;
    get diagnostics accepted = row_count;
    if accepted = 0 then return false; end if;
    insert into public.district_search_daily(day, district, search_count)
    values ((now() at time zone 'Asia/Colombo')::date, p_district, 1)
    on conflict(day, district) do update set search_count = public.district_search_daily.search_count + 1;
    return true;
end;
$$;

create or replace function public.get_district_search_demand(p_from date, p_to date)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
    if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 365 or p_to > (now() at time zone 'Asia/Colombo')::date then
        raise exception 'Invalid date window';
    end if;
    return jsonb_build_object(
        'tracking_started_at', (select started_at from public.district_search_tracking where singleton),
        'districts', coalesce((select jsonb_agg(jsonb_build_object('district', district, 'count', count) order by count desc, district)
            from (select district, sum(search_count) as count from public.district_search_daily where day between p_from and p_to group by district) counts), '[]'::jsonb)
    );
end;
$$;
revoke all on function public.record_district_search(uuid, text), public.get_district_search_demand(date, date) from public, anon, authenticated;
grant execute on function public.record_district_search(uuid, text), public.get_district_search_demand(date, date) to service_role;
-- Go's DATABASE_URL must use a trusted server database role with the table/function
-- privileges above (the existing postgres connection is sufficient). Never grant
-- recording/aggregate access to anon or authenticated browser roles.


-- FEATURE SOURCE: phase7-admin-promotions.hosted-review.sql
-- REVIEW ONLY: user applies after confirming properties.deleted_at and service-role backend credentials.
-- No payment, ownership or listing history is changed. Admin routes provide authorization;
-- these invoker functions and the table are restricted to the backend service role.

create table if not exists public.property_promotions (
    property_id uuid primary key references public.properties(id) on delete cascade,
    enabled boolean not null default false,
    changed_by uuid references public.users(id) on delete set null,
    changed_at timestamptz not null default now()
);
alter table public.property_promotions enable row level security;
revoke all on public.property_promotions from public, anon, authenticated;
grant select, insert, update on public.property_promotions to service_role;
create index if not exists property_promotions_enabled_idx on public.property_promotions(changed_at desc) where enabled;

create or replace function public.admin_set_promotion(p_property_id uuid, p_enabled boolean, p_actor_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare listing public.properties%rowtype; saved public.property_promotions%rowtype;
begin
    if p_enabled is null or p_actor_id is null then raise exception 'Invalid promotion input' using errcode = '22023'; end if;
    -- Recheck the persisted actor role at the mutation boundary. The supplied actor
    -- comes from authenticated middleware, never from a client-controlled body.
    perform id from public.users where id = p_actor_id and role = 'ADMIN' for share;
    if not found then raise exception 'Administrator role required' using errcode = '42501'; end if;
    -- Serialize with listing moderation/archive and all other promotion updates.
    select * into listing from public.properties where id = p_property_id for update;
    if not found then raise exception 'Listing not found' using errcode = 'PZ404'; end if;
    if listing.deleted_at is not null or listing.status is distinct from 'approved' or listing.payment_status is distinct from 'Paid' then
        raise exception 'Listing is ineligible' using errcode = 'PZ409';
    end if;
    insert into public.property_promotions(property_id, enabled, changed_by)
    values(p_property_id, p_enabled, p_actor_id)
    on conflict(property_id) do update set enabled = excluded.enabled, changed_by = excluded.changed_by, changed_at = now()
    where public.property_promotions.enabled is distinct from excluded.enabled;
    select * into strict saved from public.property_promotions where property_id = p_property_id;
    return to_jsonb(saved);
end $$;

create or replace function public.admin_list_promotions(p_page integer default 1, p_limit integer default 20, p_search text default '', p_enabled boolean default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
with eligible as (
    select p.id, p.title, p.city, p.district, p.status, p.payment_status,
        true as eligible, coalesce(b.enabled, false) as enabled, b.changed_at, b.changed_by, p.created_at
    from public.properties p left join public.property_promotions b on b.property_id = p.id
    where p.deleted_at is null and p.status = 'approved' and p.payment_status = 'Paid'
      and (coalesce(p_search, '') = '' or strpos(lower(coalesce(p.title, '') || ' ' || coalesce(p.city, '') || ' ' || coalesce(p.district, '')), lower(left(p_search, 120))) > 0)
      and (p_enabled is null or coalesce(b.enabled, false) = p_enabled)
), paged as (
    select * from eligible order by enabled desc, created_at desc, id
    limit greatest(1, least(p_limit, 100)) offset (greatest(1, least(p_page, 100000)) - 1) * greatest(1, least(p_limit, 100))
)
select jsonb_build_object('boosts', coalesce((select jsonb_agg(to_jsonb(paged) - 'created_at' order by enabled desc, created_at desc, id) from paged), '[]'::jsonb),
    'total', (select count(*) from eligible), 'page', p_page, 'limit', p_limit);
$$;

-- Narrow public projection; historical enabled rows never bypass current eligibility.
-- Exposed only by the Node public endpoint; does not alter filtered search ordering.
create or replace function public.public_featured_properties(p_limit integer default 3)
returns jsonb language sql stable security invoker set search_path = '' as $$
select coalesce(jsonb_agg(to_jsonb(featured) - 'created_at' - 'priority' order by priority desc, created_at desc, id), '[]'::jsonb) from (
    select p.id, p.title, p.type, p.listing_type, p.price, p.city, p.district, p.address,
        p.bedrooms, p.bathrooms, p.house_size, p.images, p.created_at, coalesce(b.enabled, false) as priority
    from public.properties p left join public.property_promotions b on b.property_id = p.id
    where p.deleted_at is null and p.status = 'approved' and p.payment_status = 'Paid'
    order by coalesce(b.enabled, false) desc, p.created_at desc, p.id
    limit greatest(1, least(p_limit, 12))
) featured;
$$;
revoke all on function public.admin_set_promotion(uuid, boolean, uuid) from public, anon, authenticated;
revoke all on function public.admin_list_promotions(integer, integer, text, boolean) from public, anon, authenticated;
revoke all on function public.public_featured_properties(integer) from public, anon, authenticated;
grant execute on function public.admin_set_promotion(uuid, boolean, uuid) to service_role;
grant execute on function public.admin_list_promotions(integer, integer, text, boolean) to service_role;
grant execute on function public.public_featured_properties(integer) to service_role;
notify pgrst, 'reload schema';


-- FEATURE SOURCE: phase7-listing-reports.hosted-review.sql
-- Additive hosted review only. Apply AFTER phase7-property-soft-delete.
-- Application backend uses service_role; browser roles cannot inspect complaints.

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

NOTIFY pgrst, 'reload schema';
COMMIT;
