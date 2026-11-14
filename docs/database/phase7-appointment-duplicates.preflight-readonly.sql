-- Readonly pre-adoption inspection. Outputs schema/ACL metadata and booking IDs/groups only.
-- No contact details, notes or raw lead_source values. Keep results private.
-- Requires PostgreSQL 16+, existing appointment ownership schema; run before hosted-review.sql.
BEGIN READ ONLY;
SELECT current_database(), current_user, current_setting('server_version') AS server_version;
SELECT attname, format_type(atttypid, atttypmod) AS type, attnotnull
FROM pg_attribute WHERE attrelid='public.leads'::regclass AND attnum>0 AND NOT attisdropped
ORDER BY attnum;
SELECT relrowsecurity, pg_get_userbyid(relowner) AS owner FROM pg_class WHERE oid='public.leads'::regclass;
SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.leads'::regclass;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='leads';
SELECT role_name,
       has_any_column_privilege(role_name,'public.leads','INSERT,UPDATE') AS can_insert_or_update,
       has_table_privilege(role_name,'public.leads','DELETE,TRUNCATE') AS can_delete_or_truncate
FROM unnest(ARRAY['anon','authenticated','service_role']) role_name;
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
SELECT 'unparseable_or_incomplete' AS issue, array_agg(lead_id ORDER BY lead_id) AS lead_ids,
       buyer_id, property_id, assigned_agent_id, slot_date, slot_window
FROM parsed WHERE slot_date IS NULL OR slot_window IS NULL
   OR (property_id IS NULL AND assigned_agent_id IS NULL)
GROUP BY buyer_id, property_id, assigned_agent_id, slot_date, slot_window;
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
SELECT 'property_duplicate' AS issue, array_agg(lead_id ORDER BY lead_id) AS lead_ids,
       buyer_id, property_id AS target_id, slot_date, slot_window
FROM parsed WHERE property_id IS NOT NULL AND slot_date IS NOT NULL
GROUP BY buyer_id, property_id, slot_date, slot_window HAVING count(*)>1
UNION ALL
SELECT 'consultation_duplicate', array_agg(lead_id ORDER BY lead_id),
       buyer_id, assigned_agent_id, slot_date, slot_window
FROM parsed WHERE property_id IS NULL AND assigned_agent_id IS NOT NULL AND slot_date IS NOT NULL
GROUP BY buyer_id, assigned_agent_id, slot_date, slot_window HAVING count(*)>1;
COMMIT;
