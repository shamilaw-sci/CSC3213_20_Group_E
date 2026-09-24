-- Create property_sales_history table for AI price analytics
CREATE TABLE IF NOT EXISTS public.property_sales_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    assessment_number VARCHAR(255),
    coordinates geometry(Point, 4326),
    sale_price NUMERIC(15, 2) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.property_sales_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Anyone can view property sales history" ON public.property_sales_history
    FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert sales history" ON public.property_sales_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
-- Create an index for faster geospatial and assessment searches
CREATE INDEX IF NOT EXISTS idx_sales_history_coordinates ON public.property_sales_history USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_sales_history_assessment ON public.property_sales_history (assessment_number);
