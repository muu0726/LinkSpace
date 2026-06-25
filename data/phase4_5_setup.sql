-- ==========================================
-- LinkSpace Phase 4.5: Avatars Bucket
-- ==========================================

-- 1. Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Setup RLS for the avatars bucket
-- Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Anyone can upload an avatar." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own avatars
CREATE POLICY "Anyone can update their own avatar." 
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );
