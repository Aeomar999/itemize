-- Run this in your Supabase SQL Editor

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  fields JSONB NOT NULL,
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "duplicateFlag" TEXT NOT NULL DEFAULT 'none',
  "duplicateOf" UUID,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create the Storage Bucket for media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies to allow public uploads and reads
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Public Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Public Deletes" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media');

-- 4. Disable RLS on products table for development (allows anonymous reads/writes)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
