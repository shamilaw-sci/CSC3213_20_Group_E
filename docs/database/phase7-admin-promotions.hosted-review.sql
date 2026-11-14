-- REVIEW ONLY: user applies after confirming properties.deleted_at and service-role backend credentials.
-- No payment, ownership or listing history is changed. Admin routes provide authorization;
-- these invoker functions and the table are restricted to the backend service role.
begin;
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
commit;
