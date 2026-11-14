-- Add support_requested column to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS support_requested BOOLEAN DEFAULT false;

-- NOTE: If you are relying on Row Level Security (RLS) for chat privacy, 
-- ensure you update the policies so ADMIN role can only view conversations 
-- where support_requested = true, EXCEPT if they are a participant.
-- Example:
-- CREATE POLICY "Admins can view if support requested"
-- ON public.conversations FOR SELECT
-- USING ( auth.role() = 'admin' AND support_requested = true );
