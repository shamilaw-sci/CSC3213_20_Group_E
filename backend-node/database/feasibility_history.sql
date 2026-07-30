-- Create the feasibility_history table
-- Stores every "Feasibility Calculator" result a logged-in user chooses to save,
-- so they can revisit or compare past affordability calculations later.
CREATE TABLE IF NOT EXISTS public.feasibility_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    salary NUMERIC NOT NULL,
    savings NUMERIC NOT NULL,
    loan_deductions NUMERIC NOT NULL,
    tenure_years INTEGER NOT NULL,
    max_buying_power NUMERIC NOT NULL,
    loan_capacity NUMERIC NOT NULL,
    monthly_installment NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.feasibility_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own saved calculations
CREATE POLICY "Users can view their own feasibility history"
ON public.feasibility_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved calculations
CREATE POLICY "Users can insert their own feasibility history"
ON public.feasibility_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved calculations
CREATE POLICY "Users can delete their own feasibility history"
ON public.feasibility_history
FOR DELETE
USING (auth.uid() = user_id);

-- Helpful index for fetching a user's history ordered by most recent
CREATE INDEX IF NOT EXISTS idx_feasibility_history_user_created
ON public.feasibility_history (user_id, created_at DESC);
