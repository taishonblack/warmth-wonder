import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'reverse' or 'forward'
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const postalcode = url.searchParams.get('postalcode');
    const country = url.searchParams.get('country') || 'US';

    let nominatimUrl: string;

    if (type === 'reverse' && lat && lon) {
      // Reverse geocoding: lat/lng -> address
      nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    } else if (type === 'forward' && postalcode) {
      // Forward geocoding: zip code -> lat/lng
      nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${postalcode}&country=${country}&format=json&limit=1`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters. Use type=reverse with lat/lon or type=forward with postalcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Geocode request: ${type}, URL: ${nominatimUrl}`);

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Nearish App (contact@nearish.app)',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Geocoding service error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Geocode response received for ${type}`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Geocode error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
