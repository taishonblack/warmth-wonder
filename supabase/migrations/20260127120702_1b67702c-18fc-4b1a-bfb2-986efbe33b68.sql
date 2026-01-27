-- Add photo_url column to markets table for caching Google Places photos
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS photo_url text;

-- Add photo_reference column to store Google's photo reference for refresh
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS photo_reference text;