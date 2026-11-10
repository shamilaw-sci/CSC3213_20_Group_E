-- Run only using the Go service's existing connection identity; never paste its URL into logs/chat.
-- Read-only compatibility diagnostic, not a permission fix or proof of visible approved rows.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL lock_timeout = '2s';

SELECT current_user AS connection_role,
       current_setting('search_path') AS search_path,
       to_regclass('properties') = to_regclass('public.properties') AS expected_relation,
       has_schema_privilege(current_user, 'public', 'USAGE') AS public_usage,
       has_schema_privilege(current_user, 'extensions', 'USAGE') AS extensions_usage,
       has_table_privilege(current_user, 'public.properties', 'SELECT') AS table_select,
       row_security_active('public.properties') AS rls_applies,
       pg_has_role(current_user, 'anon', 'USAGE') AS inherits_anon,
       pg_has_role(current_user, 'authenticated', 'USAGE') AS inherits_authenticated;

SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles WHERE rolname = current_user;

SELECT a.attname,
       has_column_privilege(current_user, a.attrelid, a.attnum, 'SELECT') AS can_read
FROM pg_attribute a
WHERE a.attrelid = 'public.properties'::regclass AND a.attnum > 0 AND NOT a.attisdropped
  AND a.attname = ANY(ARRAY['id','title','description','price','latitude','longitude','images',
      'bedrooms','bathrooms','land_size','type','city','listing_type','virtual_tours',
      'status','boundary'])
ORDER BY a.attname;

-- Plan only, never ANALYZE: verifies name/function/type/permission resolution without row output.
-- Mirrors the map's base spatial query; filter variants remain covered by its Go query tests.
EXPLAIN (FORMAT JSON)
SELECT p.id, p.title, p.description, p.price, p.latitude, p.longitude, p.images,
       p.bedrooms, p.bathrooms, p.land_size, p.type, p.city, p.listing_type, p.virtual_tours
FROM properties p
WHERE p.status = 'approved' AND (
    (p.boundary IS NOT NULL AND
     p.boundary::geometry && ST_GeomFromText('POLYGON((79 5,82 5,82 10,79 10,79 5))',4326)
     AND ST_Intersects(p.boundary::geometry,
         ST_GeomFromText('POLYGON((79 5,82 5,82 10,79 10,79 5))',4326)))
    OR (p.boundary IS NULL AND p.longitude IS NOT NULL AND p.latitude IS NOT NULL
        AND ST_Intersects(ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326),
            ST_GeomFromText('POLYGON((79 5,82 5,82 10,79 10,79 5))',4326)))
)
ORDER BY p.id LIMIT 100;
ROLLBACK;
