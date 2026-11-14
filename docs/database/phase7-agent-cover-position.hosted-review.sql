-- Additive Agent cover positioning upgrade. Apply before restarting updated backend.
-- Existing banners remain centered. No image/user/role data is removed.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS cover_position_x integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cover_position_y integer NOT NULL DEFAULT 50;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.agent_profiles'::regclass
      AND conname = 'agent_profiles_cover_position_x_range'
  ) THEN
    ALTER TABLE public.agent_profiles
      ADD CONSTRAINT agent_profiles_cover_position_x_range
      CHECK (cover_position_x BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.agent_profiles'::regclass
      AND conname = 'agent_profiles_cover_position_y_range'
  ) THEN
    ALTER TABLE public.agent_profiles
      ADD CONSTRAINT agent_profiles_cover_position_y_range
      CHECK (cover_position_y BETWEEN 0 AND 100);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'agent_profiles'
  AND column_name IN ('cover_position_x', 'cover_position_y')
ORDER BY column_name;
