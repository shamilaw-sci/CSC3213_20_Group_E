-- User confirmed manual application on 2026-10-27; enum filter verified with HTTP 200.
-- Apply manually in Supabase SQL Editor before testing direct-lead Offer writes.
-- Adds one enum label only; existing lead rows are not rewritten.
-- Run and commit this statement before any subsequent Offer writes.
ALTER TYPE public.lead_lifecycle ADD VALUE IF NOT EXISTS 'Offer';
