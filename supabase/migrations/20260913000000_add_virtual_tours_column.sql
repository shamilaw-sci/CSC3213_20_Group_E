-- Add virtual_tours JSONB column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tours JSONB DEFAULT '[]'::jsonb;

-- Reload schema cache so PostgREST picks up the new column
NOTIFY pgrst, 'reload schema';
