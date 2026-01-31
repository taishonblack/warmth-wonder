import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 12-hour cache TTL (same as OSM)
const TTL_HOURS = 12;

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

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
  distance_m: number;
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

    // Create cache key by rounding to ~1km grid (same as OSM)
    const latKey = lat.toFixed(2);
    const lngKey = lng.toFixed(2);
    const cache_key = `google:${latKey}:${lngKey}:${radius}`;

    console.log(`[nearby-google-places] Request for ${lat},${lng} radius=${radius}m, cache_key=${cache_key}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // 1) Cache lookup in osm_cache (reusing the same table)
    const { data: cached, error: cacheError } = await sb
      .from("osm_cache")
      .select("response_json, created_at")
      .eq("cache_key", cache_key)
      .maybeSingle();

    if (cacheError) {
      console.error("[nearby-google-places] Cache lookup error:", cacheError);
    }

    if (cached?.response_json && cached?.created_at) {
      const ageMs = Date.now() - new Date(cached.created_at).getTime();
      const ttlMs = TTL_HOURS * 60 * 60 * 1000;
      
      if (ageMs < ttlMs) {
        console.log(`[nearby-google-places] Cache HIT, age=${Math.round(ageMs / 1000 / 60)}min`);
        return new Response(JSON.stringify(cached.response_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`[nearby-google-places] Cache expired, age=${Math.round(ageMs / 1000 / 60)}min`);
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("[nearby-google-places] Missing GOOGLE_PLACES_API_KEY");
      return new Response(
        JSON.stringify({ error: "Google Places API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Consolidated keywords - fewer API calls, broader coverage
    const keywords = [
      "farmers market",
      "farm stand produce",
      "organic grocery health food",
      "local bakery artisan",
      "farm store co-op",
    ];

    // Run all keyword searches in parallel
    const startTime = Date.now();
    const keywordResults = await Promise.all(
      keywords.map((kw) => searchNearby(apiKey, lat, lng, radius, kw))
    );
    console.log(`[nearby-google-places] API calls completed in ${Date.now() - startTime}ms`);

    // Flatten and dedupe by place_id
    const seenIds = new Set<string>();
    const allPlaces: GooglePlace[] = [];

    for (const results of keywordResults) {
      for (const place of results) {
        if (!seenIds.has(place.place_id)) {
          seenIds.add(place.place_id);
          allPlaces.push(place);
        }
      }
    }

    console.log(`[nearby-google-places] Found ${allPlaces.length} unique places before filtering`);

    // Filter out chains, normalize, compute distance
    const MAX_DISTANCE = radius * 1.05;
    
    const markets: NormalizedMarket[] = allPlaces
      .filter((p) => !isChain(p.name))
      .map((p): NormalizedMarket => {
        const mLat = p.geometry.location.lat;
        const mLng = p.geometry.location.lng;
        const distance_m = haversineMeters(lat, lng, mLat, mLng);
        
        return {
          source: "google",
          place_id: p.place_id,
          name: p.name,
          lat: mLat,
          lng: mLng,
          address: p.vicinity || p.formatted_address || "Address unknown",
          open_now: p.opening_hours?.open_now ?? null,
          photo_ref: p.photos?.[0]?.photo_reference || null,
          types: p.types || [],
          distance_m,
        };
      })
      .filter((m) => m.distance_m <= MAX_DISTANCE)
      .sort((a, b) => a.distance_m - b.distance_m);

    console.log(`[nearby-google-places] Returning ${markets.length} indie markets`);

    const response = {
      center: { lat, lng },
      radius,
      markets,
      fetched_at: new Date().toISOString(),
    };

    // 2) Upsert cache
    const { error: upsertError } = await sb.from("osm_cache").upsert(
      {
        cache_key,
        center_lat: lat,
        center_lng: lng,
        radius_m: radius,
        response_json: response,
      },
      { onConflict: "cache_key" }
    );

    if (upsertError) {
      console.error("[nearby-google-places] Cache upsert error:", upsertError);
    } else {
      console.log("[nearby-google-places] Cache updated");
    }

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
