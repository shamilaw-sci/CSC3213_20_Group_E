-- Run this script in your Supabase SQL Editor to add the missing columns

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_type TEXT,
ADD COLUMN IF NOT EXISTS price_period TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS house_size NUMERIC;
