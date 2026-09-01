-- increment_views_rpc.sql
-- Creates an atomic RPC function to prevent race conditions when updating views_count

CREATE OR REPLACE FUNCTION increment_property_views(property_id UUID)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    new_views integer;
BEGIN
    UPDATE properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = property_id
    RETURNING views_count INTO new_views;
    
    RETURN new_views;
END;
$$;
