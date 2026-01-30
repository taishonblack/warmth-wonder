import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chain stores to filter out
const CHAIN_BLACKLIST = [
  "whole foods", "trader joe", "walmart", "target", "costco", "bj's",
  "kroger", "safeway", "albertsons", "publix", "stop & shop", "shoprite",
  "wegmans", "aldi", "lidl", "cvs", "walgreens", "7-eleven", "amazon",
  "sprouts", "harris teeter", "giant", "food lion", "wawa", "sheetz",
  "acme", "pathmark", "a&p", "food emporium", "key food", "c-town",
  "fairway", "gristedes", "d'agostino", "morton williams"
];

function isChain(name: string): boolean {
  const normalized = (name || "").toLowerCase().trim();
  return CHAIN_BLACKLIST.some((c) => normalized.includes(c));
}

interface GooglePlace {
  place_id: string;
  name: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  vicinity?: string;
  formatted_address?: string;
  opening_hours?: { open_now?: boolean };
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  error_message?: string;
}

interface NormalizedMarket {
  source: "google";
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  open_now: boolean | null;
  photo_ref: string | null;
  types: string[];
}

async function searchNearby(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string
): Promise<GooglePlace[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", radius.toString());
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[nearby-google-places] API error for "${keyword}":`, res.status);
      return [];
    }
    const data: GooglePlacesResponse = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`[nearby-google-places] Status for "${keyword}":`, data.status, data.error_message);
      return [];
    }
    return data.results || [];
  } catch (err) {
    console.error(`[nearby-google-places] Fetch error for "${keyword}":`, err);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("POST only", { status: 405, headers: corsHeaders });
  }

  try {
    const { lat, lng, radius = 24140 } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("[nearby-google-places] Missing GOOGLE_PLACES_API_KEY");
      return new Response(
        JSON.stringify({ error: "Google Places API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[nearby-google-places] Request for ${lat},${lng} radius=${radius}m`);

    // Keywords to search - optimized for indie/local markets
    const keywords = [
      "farmers market",
      "farm stand",
      "produce market",
      "organic grocery",
      "health food store",
      "co-op grocery",
      "greengrocer",
      "bakery local",
    ];

    // Run all searches in parallel
    const allResults = await Promise.all(
      keywords.map((kw) => searchNearby(apiKey, lat, lng, radius, kw))
    );

    // Flatten and dedupe by place_id
    const seenIds = new Set<string>();
    const allPlaces: GooglePlace[] = [];

    for (const results of allResults) {
      for (const place of results) {
        if (!seenIds.has(place.place_id)) {
          seenIds.add(place.place_id);
          allPlaces.push(place);
        }
      }
    }

    console.log(`[nearby-google-places] Found ${allPlaces.length} unique places before filtering`);

    // Filter out chains and normalize
    const markets: NormalizedMarket[] = allPlaces
      .filter((p) => !isChain(p.name))
      .map((p): NormalizedMarket => ({
        source: "google",
        place_id: p.place_id,
        name: p.name,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        address: p.vicinity || p.formatted_address || "Address unknown",
        open_now: p.opening_hours?.open_now ?? null,
        photo_ref: p.photos?.[0]?.photo_reference || null,
        types: p.types || [],
      }));

    console.log(`[nearby-google-places] Returning ${markets.length} indie markets`);

    const response = {
      center: { lat, lng },
      radius,
      markets,
      fetched_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[nearby-google-places] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
