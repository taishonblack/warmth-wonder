import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaceSearchResult {
  candidates: Array<{
    place_id: string;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketId, name, address, lat, lng } = await req.json();

    if (!marketId || !name) {
      return new Response(
        JSON.stringify({ error: "marketId and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Google Places API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if market already has a photo
    const { data: existingMarket } = await supabase
      .from("markets")
      .select("photo_url, photo_reference")
      .eq("id", marketId)
      .maybeSingle();

    if (existingMarket?.photo_url) {
      console.log(`[market-photo] Cache hit for ${marketId}`);
      return new Response(
        JSON.stringify({ photoUrl: existingMarket.photo_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search for the place using name and location
    const searchQuery = encodeURIComponent(`${name} ${address || ""}`);
    const locationBias = lat && lng ? `&locationbias=point:${lat},${lng}` : "";
    
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${searchQuery}&inputtype=textquery&fields=place_id,photos${locationBias}&key=${apiKey}`;
    
    console.log(`[market-photo] Searching for: ${name}`);
    
    const placeResponse = await fetch(findPlaceUrl);
    const placeData: PlaceSearchResult = await placeResponse.json();

    if (!placeData.candidates?.[0]?.photos?.[0]) {
      console.log(`[market-photo] No photos found for ${name}`);
      return new Response(
        JSON.stringify({ photoUrl: null, message: "No photos found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const photoReference = placeData.candidates[0].photos[0].photo_reference;
    
    // Get the actual photo URL
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`;

    // Cache the photo URL in the database
    const { error: updateError } = await supabase
      .from("markets")
      .update({ 
        photo_url: photoUrl,
        photo_reference: photoReference,
      })
      .eq("id", marketId);

    if (updateError) {
      console.error(`[market-photo] Failed to cache photo:`, updateError);
    } else {
      console.log(`[market-photo] Cached photo for ${name}`);
    }

    return new Response(
      JSON.stringify({ photoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[market-photo] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
