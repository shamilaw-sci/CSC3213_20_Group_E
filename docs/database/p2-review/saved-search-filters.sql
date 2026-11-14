-- Applied manually by the user on 2026-10-27; column verified by a zero-row API read. Do not rerun against that database.
BEGIN;
ALTER TABLE public.saved_searches ADD COLUMN filters jsonb;
ALTER TABLE public.saved_searches ADD CONSTRAINT saved_search_filters_object
    CHECK (filters IS NULL OR jsonb_typeof(filters) = 'object');
NOTIFY pgrst, 'reload schema';
COMMIT;
