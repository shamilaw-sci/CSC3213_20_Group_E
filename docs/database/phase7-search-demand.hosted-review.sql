-- Reviewed additive schema. Apply manually; no historical search backfill.
begin;
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
commit;
