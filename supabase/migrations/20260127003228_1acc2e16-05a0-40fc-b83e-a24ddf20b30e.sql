-- Create cache table for Overpass API responses
CREATE TABLE IF NOT EXISTS public.osm_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL,
  response_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS - cache is only used by edge function with service role
ALTER TABLE public.osm_cache ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can read/write
CREATE POLICY "Service role only"
  ON public.osm_cache
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Index for fast cache lookups
CREATE INDEX idx_osm_cache_key ON public.osm_cache (cache_key);
CREATE INDEX idx_osm_cache_created ON public.osm_cache (created_at);