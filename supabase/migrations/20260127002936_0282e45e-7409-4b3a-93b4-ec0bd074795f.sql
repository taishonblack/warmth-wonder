-- Create markets table
CREATE TABLE public.markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NY',
  zip_code TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL DEFAULT 'farmers',
  is_open BOOLEAN NOT NULL DEFAULT true,
  hours TEXT,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Anyone can view markets (public data)
CREATE POLICY "Anyone can view markets"
  ON public.markets FOR SELECT
  USING (true);

-- Only authenticated users can suggest/add markets (for future moderation)
CREATE POLICY "Authenticated users can insert markets"
  ON public.markets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for geospatial queries
CREATE INDEX idx_markets_location ON public.markets (lat, lng);
CREATE INDEX idx_markets_type ON public.markets (type);
CREATE INDEX idx_markets_name ON public.markets USING gin(to_tsvector('english', name));

-- Trigger for updated_at
CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample market data for NYC area
INSERT INTO public.markets (name, description, address, city, state, zip_code, lat, lng, type, is_open, hours) VALUES
  ('Union Square Greenmarket', 'New York''s flagship farmers market featuring over 140 regional farmers, fishers, and bakers.', 'E 17th St & Union Square W', 'New York', 'NY', '10003', 40.7359, -73.9911, 'farmers', true, 'Mon, Wed, Fri, Sat 8am-6pm'),
  ('Grand Army Plaza Greenmarket', 'Brooklyn''s largest farmers market at the entrance to Prospect Park.', 'Prospect Park West & Flatbush Ave', 'Brooklyn', 'NY', '11238', 40.6743, -73.9712, 'farmers', true, 'Sat 8am-4pm'),
  ('Prospect Park Farmers Market', 'Seasonal farmers market inside Prospect Park.', 'Prospect Park', 'Brooklyn', 'NY', '11215', 40.6602, -73.9690, 'farmers', false, 'Sun 9am-4pm (Seasonal)'),
  ('Chelsea Market', 'Indoor food hall and marketplace in a historic factory building.', '75 9th Ave', 'New York', 'NY', '10011', 40.7424, -74.0060, 'artisan', true, 'Daily 7am-9pm'),
  ('Smorgasburg', 'Brooklyn''s premier open-air food market with 100+ local vendors.', 'Kent Ave & N 6th St', 'Brooklyn', 'NY', '11249', 40.7215, -73.9577, 'flea', true, 'Sat-Sun 11am-6pm'),
  ('Essex Market', 'Historic indoor marketplace with diverse food vendors and artisans.', '88 Essex St', 'New York', 'NY', '10002', 40.7187, -73.9872, 'artisan', true, 'Daily 8am-8pm'),
  ('Brooklyn Flea', 'Vintage and antique market with local crafts and food.', '80 Pearl St', 'Brooklyn', 'NY', '11201', 40.7025, -73.9866, 'flea', true, 'Sat-Sun 10am-6pm'),
  ('Hester Street Fair', 'Curated open-air market featuring local designers, artists, and food vendors.', 'Hester St & Essex St', 'New York', 'NY', '10002', 40.7148, -73.9889, 'flea', true, 'Sat 11am-6pm'),
  ('Astoria Greenmarket', 'Queens farmers market with fresh produce and local goods.', '14th St & 31st Ave', 'Astoria', 'NY', '11102', 40.7680, -73.9350, 'farmers', true, 'Wed 8am-3pm'),
  ('Inwood Greenmarket', 'Upper Manhattan farmers market with organic produce.', 'Isham St & Seaman Ave', 'New York', 'NY', '10034', 40.8680, -73.9220, 'farmers', true, 'Sat 8am-3pm');