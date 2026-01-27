-- Add diet/specialty fields to markets table
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS organic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vegan_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gluten_free BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS osm_source_id TEXT,
ADD COLUMN IF NOT EXISTS verification_count INTEGER DEFAULT 0;

-- Create market verifications table for community verification
CREATE TABLE IF NOT EXISTS public.market_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- 'hours', 'organic', 'vegan_friendly', 'gluten_free', 'is_open'
  field_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(market_id, user_id, field_name)
);

-- Enable RLS
ALTER TABLE public.market_verifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view verifications
CREATE POLICY "Anyone can view verifications"
  ON public.market_verifications FOR SELECT
  USING (true);

-- Authenticated users can add verifications
CREATE POLICY "Authenticated users can verify"
  ON public.market_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update own verifications"
  ON public.market_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own verifications
CREATE POLICY "Users can delete own verifications"
  ON public.market_verifications FOR DELETE
  USING (auth.uid() = user_id);

-- Add update policy for markets (for claiming)
CREATE POLICY "Authenticated users can claim unclaimed markets"
  ON public.markets FOR UPDATE
  USING (claimed_by IS NULL AND auth.uid() IS NOT NULL);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_markets_diet ON public.markets (organic, vegan_friendly, gluten_free);
CREATE INDEX IF NOT EXISTS idx_markets_osm_source ON public.markets (osm_source_id);
CREATE INDEX IF NOT EXISTS idx_verifications_market ON public.market_verifications (market_id);