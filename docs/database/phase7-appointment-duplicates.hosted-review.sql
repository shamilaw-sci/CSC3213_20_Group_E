-- OWNER-RUN REVIEW SCRIPT ONLY. Confirm the selected Supabase project first.
-- Apply ownership and backend-only lead ACL adoption first. Pause booking writes during rollout.
-- Run the readonly preflight first; resolve reported IDs explicitly, never auto-delete.
-- Transactional: any failure rolls back columns, type widening, backfill and indexes.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.leads IN ACCESS EXCLUSIVE MODE;
DO $guard$
BEGIN
    IF current_user <> 'postgres' OR current_database() <> 'postgres'
       OR current_setting('server_version_num')::integer < 160000 THEN
        RAISE EXCEPTION 'Expected postgres dashboard connection, PostgreSQL 16+';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.leads'::regclass
        AND relkind='r' AND relrowsecurity AND pg_get_userbyid(relowner)='postgres') THEN
        RAISE EXCEPTION 'Unexpected leads table identity/RLS';
    END IF;
    IF EXISTS (
        SELECT 1 FROM (VALUES ('lead_id'), ('buyer_id'), ('property_id'), ('assigned_agent_id')) required(name)
        WHERE NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.leads'::regclass
            AND attname=required.name AND atttypid='uuid'::regtype AND NOT attisdropped)
    ) OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.leads'::regclass
        AND contype='f' AND confrelid='public.users'::regclass
        AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.leads'::regclass
                         AND attname='buyer_id')]::smallint[] AND confdeltype='n') THEN
        RAISE EXCEPTION 'Expected UUID identity columns and buyer ownership FK ON DELETE SET NULL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.leads'::regclass
                   AND attname='lead_source' AND NOT attisdropped
                   AND atttypid IN ('text'::regtype,'varchar'::regtype)) THEN
        RAISE EXCEPTION 'Unexpected lead_source storage type';
    END IF;
    IF has_any_column_privilege('anon','public.leads','INSERT,UPDATE')
       OR has_any_column_privilege('authenticated','public.leads','INSERT,UPDATE')
       OR has_table_privilege('anon','public.leads','DELETE,TRUNCATE')
       OR has_table_privilege('authenticated','public.leads','DELETE,TRUNCATE') THEN
        RAISE EXCEPTION 'Backend-only lead writes required; review grants before adoption';
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) p
               WHERE NOT has_table_privilege('service_role','public.leads',p)) THEN
        RAISE EXCEPTION 'Expected backend service_role lead privileges';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.leads'::regclass
               AND attname IN ('booking_date','booking_time_window') AND NOT attisdropped)
       OR to_regclass('public.leads_buyer_property_slot_uidx') IS NOT NULL
       OR to_regclass('public.leads_buyer_consultation_slot_uidx') IS NOT NULL THEN
        RAISE EXCEPTION 'Appointment slot schema already exists; review drift instead of reapplying';
    END IF;
END;
$guard$;

CREATE TEMP TABLE appointment_slot_backfill ON COMMIT DROP AS
WITH matched AS (
    SELECT lead_id, buyer_id, property_id, assigned_agent_id,
           regexp_match(lead_source,
             '^Booking \(([^()\r\n]+)\): ([0-9]{4}-[0-9]{2}-[0-9]{2}) (Morning \(9:00 AM - 12:00 PM\)|Afternoon \(12:00 PM - 4:00 PM\)|Evening \(4:00 PM - 7:00 PM\))( (•|â€¢) Note: "[\s\S]*")?$') AS parts
    FROM public.leads
    WHERE buyer_id IS NOT NULL
      AND (lead_source LIKE 'Booking%' OR lead_source LIKE 'Direct Profile Booking%')
), parsed AS (
    SELECT lead_id, buyer_id, property_id, assigned_agent_id,
           CASE WHEN parts IS NOT NULL AND pg_input_is_valid(parts[2], 'date')
                     AND parts[2] !~ '^0000' THEN parts[2]::date END AS slot_date,
           parts[3] AS slot_window
    FROM matched
)
SELECT * FROM parsed;

DO $validate$
DECLARE invalid_ids uuid[];
BEGIN
    SELECT array_agg(lead_id ORDER BY lead_id) INTO invalid_ids FROM appointment_slot_backfill
    WHERE slot_date IS NULL OR slot_window IS NULL
       OR (property_id IS NULL AND assigned_agent_id IS NULL);
    IF invalid_ids IS NOT NULL THEN
        RAISE EXCEPTION 'Unparseable/incomplete account-bound booking IDs: %', invalid_ids;
    END IF;
    IF EXISTS (SELECT 1 FROM appointment_slot_backfill WHERE property_id IS NOT NULL
        GROUP BY buyer_id, property_id, slot_date, slot_window HAVING count(*) > 1)
       OR EXISTS (SELECT 1 FROM appointment_slot_backfill WHERE property_id IS NULL
        GROUP BY buyer_id, assigned_agent_id, slot_date, slot_window HAVING count(*) > 1) THEN
        RAISE EXCEPTION 'Existing duplicate appointment groups; run readonly preflight and resolve IDs before adoption';
    END IF;
END;
$validate$;

ALTER TABLE public.leads
    ALTER COLUMN lead_source TYPE text,
    ADD COLUMN booking_date date,
    ADD COLUMN booking_time_window text,
    ADD CONSTRAINT leads_booking_slot_check CHECK (
      (booking_date IS NULL AND booking_time_window IS NULL)
      OR (booking_date IS NOT NULL AND booking_time_window IS NOT NULL
          AND booking_time_window IN ('Morning (9:00 AM - 12:00 PM)',
              'Afternoon (12:00 PM - 4:00 PM)', 'Evening (4:00 PM - 7:00 PM)'))
    );
-- Preserve source, guests and non-booking CRM data verbatim. Never infer ownership by email.
UPDATE public.leads l SET booking_date=b.slot_date, booking_time_window=b.slot_window
FROM appointment_slot_backfill b WHERE l.lead_id=b.lead_id;

ALTER TABLE public.leads ADD CONSTRAINT leads_bound_booking_slot_check CHECK (
    buyer_id IS NULL
    OR NOT (coalesce(lead_source, '') LIKE 'Booking%' OR coalesce(lead_source, '') LIKE 'Direct Profile Booking%')
    OR (booking_date IS NOT NULL AND booking_time_window IS NOT NULL
        AND (property_id IS NOT NULL OR assigned_agent_id IS NOT NULL))
);

CREATE UNIQUE INDEX leads_buyer_property_slot_uidx
ON public.leads (buyer_id, property_id, booking_date, booking_time_window)
WHERE buyer_id IS NOT NULL AND property_id IS NOT NULL
  AND booking_date IS NOT NULL AND booking_time_window IS NOT NULL;
CREATE UNIQUE INDEX leads_buyer_consultation_slot_uidx
ON public.leads (buyer_id, assigned_agent_id, booking_date, booking_time_window)
WHERE buyer_id IS NOT NULL AND property_id IS NULL AND assigned_agent_id IS NOT NULL
  AND booking_date IS NOT NULL AND booking_time_window IS NOT NULL;
NOTIFY pgrst, 'reload schema';
COMMIT;
