-- Migration: Task Images Storage Policies
-- Description: Set up RLS policies for task-images storage bucket
-- Note: Using DROP IF EXISTS + CREATE to handle re-runs

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for task images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update task images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete task images" ON storage.objects;

-- Allow public read access to task images
CREATE POLICY "Public read access for task images"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-images');

-- Allow authenticated users to upload task images
CREATE POLICY "Authenticated users can upload task images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update task images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'task-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete task images
CREATE POLICY "Authenticated users can delete task images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-images'
  AND auth.role() = 'authenticated'
);
