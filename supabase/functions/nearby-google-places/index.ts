import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 12-hour cache TTL
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
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface GooglePlace {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
  vicinity?: string;
  formatted_address?: string;
  opening_hours?: { open_now?: boolean };
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
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

// Search with specific keyword
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
    const data = await res.json();
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

// Keywords for comprehensive coverage (run in parallel)
const SEARCH_KEYWORDS = [
  "farmers market",
  "farm stand produce",
  "organic grocery",
  "local bakery",
  "health food store",
];

// Fetch all keywords in parallel and dedupe
async function fetchAllPlaces(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number
): Promise<GooglePlace[]> {
  const startTime = Date.now();
  
  // Run all keyword searches in parallel
  const results = await Promise.all(
    SEARCH_KEYWORDS.map((kw) => searchNearby(apiKey, lat, lng, radius, kw))
  );
  
  console.log(`[nearby-google-places] ${SEARCH_KEYWORDS.length} API calls completed in ${Date.now() - startTime}ms`);
  
  // Dedupe by place_id
  const seen = new Set<string>();
  const allPlaces: GooglePlace[] = [];
  
  for (const places of results) {
    for (const place of places) {
      if (!seen.has(place.place_id)) {
        seen.add(place.place_id);
        allPlaces.push(place);
      }
    }
  }
  
  return allPlaces;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("POST only", { status: 405, headers: corsHeaders });
  }

  try {
    const { lat, lng, radius = 24140, force_refresh = false } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const latKey = lat.toFixed(2);
    const lngKey = lng.toFixed(2);
    const cache_key = `google:${latKey}:${lngKey}:${radius}`;

    console.log(`[nearby-google-places] Request for ${lat},${lng} radius=${radius}m`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Skip cache if force_refresh is true
    if (!force_refresh) {
      // Cache lookup
      const { data: cached } = await sb
        .from("osm_cache")
        .select("response_json, created_at")
        .eq("cache_key", cache_key)
        .maybeSingle();

      const hasCachedData = cached?.response_json;
      const ageMs = hasCachedData ? Date.now() - new Date(cached.created_at).getTime() : Infinity;
      const ttlMs = TTL_HOURS * 60 * 60 * 1000;
      const isStale = ageMs >= ttlMs;

      // If cache is fresh, return immediately
      if (hasCachedData && !isStale) {
        console.log(`[nearby-google-places] Cache HIT, age=${Math.round(ageMs / 1000 / 60)}min`);
        return new Response(JSON.stringify(cached.response_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If cache is stale but exists, return it immediately and refresh in background
      if (hasCachedData && isStale) {
        console.log(`[nearby-google-places] Returning stale cache, refreshing in background`);
        
        // Trigger background refresh (fire and forget)
        (async () => {
          try {
            const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
            if (!apiKey) return;
            
            const places = await fetchAllPlaces(apiKey, lat, lng, radius);
            const markets = processPlaces(places, lat, lng, radius);
            const response = { center: { lat, lng }, radius, markets, fetched_at: new Date().toISOString() };
            
            await sb.from("osm_cache").upsert(
              { cache_key, center_lat: lat, center_lng: lng, radius_m: radius, response_json: response },
              { onConflict: "cache_key" }
            );
            console.log(`[nearby-google-places] Background refresh complete with ${markets.length} markets`);
          } catch (e) {
            console.error(`[nearby-google-places] Background refresh failed:`, e);
          }
        })();
        
        return new Response(JSON.stringify(cached.response_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No cache or force_refresh - fetch fresh
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("[nearby-google-places] Missing GOOGLE_PLACES_API_KEY");
      return new Response(
        JSON.stringify({ error: "Google Places API not configured", markets: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const places = await fetchAllPlaces(apiKey, lat, lng, radius);
    const markets = processPlaces(places, lat, lng, radius);
    console.log(`[nearby-google-places] Returning ${markets.length} indie markets`);

    const response = { center: { lat, lng }, radius, markets, fetched_at: new Date().toISOString() };

    // Cache the result
    await sb.from("osm_cache").upsert(
      { cache_key, center_lat: lat, center_lng: lng, radius_m: radius, response_json: response },
      { onConflict: "cache_key" }
    );

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[nearby-google-places] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", markets: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function processPlaces(places: GooglePlace[], lat: number, lng: number, radius: number): NormalizedMarket[] {
  const MAX_DISTANCE = radius * 1.05;
  
  return places
    .filter((p) => !isChain(p.name))
    .map((p): NormalizedMarket => {
      const mLat = p.geometry.location.lat;
      const mLng = p.geometry.location.lng;
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
        distance_m: haversineMeters(lat, lng, mLat, mLng),
      };
    })
    .filter((m) => m.distance_m <= MAX_DISTANCE)
    .sort((a, b) => a.distance_m - b.distance_m);
}