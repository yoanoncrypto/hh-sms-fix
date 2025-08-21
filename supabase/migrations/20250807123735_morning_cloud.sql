/*
  # Create Campaign Images Storage Bucket

  1. Storage Setup
    - Create 'campaign_images' bucket for storing campaign images
    - Set bucket to public for easy access
    - Add RLS policy for public read access

  2. Security
    - Allow public read access to campaign images
    - Files are stored with unique names to prevent conflicts
*/

-- Create the campaign_images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign_images',
  'campaign_images',
  true,
  3145728, -- 3MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for public read access
CREATE POLICY "Allow public read access to campaign images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'campaign_images');

-- Create RLS policy for authenticated users to upload
CREATE POLICY "Allow authenticated users to upload campaign images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign_images');

-- Create RLS policy for authenticated users to update their uploads
CREATE POLICY "Allow authenticated users to update campaign images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign_images');

-- Create RLS policy for authenticated users to delete their uploads
CREATE POLICY "Allow authenticated users to delete campaign images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign_images');