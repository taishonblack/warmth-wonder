-- Create storage bucket for find images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('find-images', 'find-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload find images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'find-images' 
  AND auth.uid() IS NOT NULL
);

-- Anyone can view find images (public bucket)
CREATE POLICY "Anyone can view find images"
ON storage.objects FOR SELECT
USING (bucket_id = 'find-images');

-- Users can delete their own uploaded images
CREATE POLICY "Users can delete their own find images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'find-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);