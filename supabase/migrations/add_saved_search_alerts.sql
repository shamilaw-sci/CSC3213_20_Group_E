-- Adds the ability for a user to turn email match-alerts on/off per saved search.
-- Required by the "Saved Search Alerts" feature (backend-node/controllers/savedSearchController.js).
ALTER TABLE public.saved_searches
ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN NOT NULL DEFAULT true;

-- Speeds up the matching job's "give me every search with alerts on" query,
-- which runs every time a listing is approved.
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts_enabled
ON public.saved_searches (email_alerts_enabled)
WHERE email_alerts_enabled = true;
