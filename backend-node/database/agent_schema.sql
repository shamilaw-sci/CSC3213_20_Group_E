-- ==============================================================================
-- Real Estate Agent Feature Schema (Supabase PostgreSQL)
-- ==============================================================================

-- 1. agent_profiles table
CREATE TABLE IF NOT EXISTS public.agent_profiles (
    agent_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    bio TEXT,
    languages VARCHAR(255),
    youtube_video_url VARCHAR(500),
    total_sales INT DEFAULT 0,
    total_rentals INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Row Level Security (RLS) for agent_profiles
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent profiles are viewable by everyone" 
ON public.agent_profiles FOR SELECT USING (true);

CREATE POLICY "Agents can update their own profile" 
ON public.agent_profiles FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own profile" 
ON public.agent_profiles FOR INSERT WITH CHECK (auth.uid() = agent_id);


-- 2. leads table
DO $$ BEGIN
    CREATE TYPE lead_timeframe AS ENUM ('ASAP', '1-3 Months', '6+ Months', 'Browsing');
    CREATE TYPE lead_lifecycle AS ENUM ('New', 'Attempted Contact', 'Active', 'Closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    lead_source VARCHAR(100) DEFAULT 'Direct',
    pre_approval_status BOOLEAN DEFAULT false,
    timeframe_to_move lead_timeframe DEFAULT 'Browsing',
    lifecycle_status lead_lifecycle DEFAULT 'New',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own leads" 
ON public.leads FOR SELECT USING (auth.uid() = assigned_agent_id);

CREATE POLICY "Agents can update their own leads" 
ON public.leads FOR UPDATE USING (auth.uid() = assigned_agent_id);

CREATE POLICY "Anyone can insert a lead" 
ON public.leads FOR INSERT WITH CHECK (true);


-- 3. agent_reviews table
CREATE TABLE IF NOT EXISTS public.agent_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for reviews
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" 
ON public.agent_reviews FOR SELECT USING (true);

CREATE POLICY "Logged in users can insert reviews" 
ON public.agent_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 4. Enable Realtime on leads (for the < 2s latency notification requirement)
-- alter publication supabase_realtime add table public.leads;
