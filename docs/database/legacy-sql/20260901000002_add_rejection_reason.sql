-- Adds the rejection_reason column to agent_profiles for the Agent Approval flow
ALTER TABLE public.agent_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
