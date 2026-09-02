-- Run this SQL in your Supabase SQL Editor

-- 1. Add attachment columns to the messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS attachment_name text,
ADD COLUMN IF NOT EXISTS attachment_type text;

-- 2. Create the Storage Bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for chat_attachments
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'chat-attachments' );

-- Allow public access to view attachments
CREATE POLICY "Allow public read access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'chat-attachments' );

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'chat-attachments' AND (auth.uid() = owner) );
