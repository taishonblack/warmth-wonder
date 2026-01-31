import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const TTL_HOURS = 12;

const CHAIN_BLACKLIST = [
  "whole foods", "trader joe", "walmart", "target", "costco", "bj's",
  "kroger", "safeway", "albertsons", "publix", "stop & shop", "shoprite",
  "wegmans", "aldi", "lidl", "cvs", "walgreens", "7-eleven", "amazon",
  "sprouts", "harris teeter", "giant", "food lion", "wawa", "sheetz"
];

function normalizeStr(s: string): string {
  return (s || "").toLowerCase().trim();
}

function isChain(tags: Record<string, string>): boolean {
  const hay = normalizeStr([tags["name"], tags["operator"], tags["brand"]].filter(Boolean).join(" "));
  return CHAIN_BLACKLIST.some((c) => hay.includes(c));
}

type MarketCategory = "farmers_market" | "farm_shop" | "produce" | "bakery" | "organic" | "health_food" | "unknown";

function categoryFrom(tags: Record<string, string>): MarketCategory {
  if (tags["amenity"] === "marketplace") return "farmers_market";
  const shop = tags["shop"];
  if (shop === "farm") return "farm_shop";
  if (shop === "greengrocer" || shop === "produce") return "produce";
  if (shop === "bakery") return "bakery";
  if (shop === "organic") return "organic";
  if (shop === "health_food") return "health_food";
  return "unknown";
}

function computeScore(tags: Record<string, string>, chain: boolean): number {
  let s = 0;
  if (tags["amenity"] === "marketplace") s += 3;
  if (["farm", "greengrocer", "produce", "bakery", "organic", "health_food"].includes(tags["shop"] ?? "")) s += 2;
  if (tags["opening_hours"]) s += 1;
  if (tags["phone"] || tags["contact:phone"]) s += 1;
  if (tags["website"] || tags["contact:website"]) s += 1;
  if (tags["addr:street"]) s += 1;
  if (tags["local_produce"] === "yes") s += 1;
  if (tags["organic"] === "yes" || tags["organic"] === "only") s += 1;
  if (chain) s -= 4;
  return s;
}

// Simplified query for faster response
function overpassQuery(lat: number, lng: number, radius: number): string {
  return `[out:json][timeout:10];
(
  nwr["amenity"="marketplace"](around:${radius},${lat},${lng});
  nwr["shop"="greengrocer"](around:${radius},${lat},${lng});
  nwr["shop"="farm"](around:${radius},${lat},${lng});
  nwr["shop"="bakery"](around:${radius},${lat},${lng});
  nwr["shop"="organic"](around:${radius},${lat},${lng});
);
out center tags;`;
}

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface NearishMarket {
  source: "osm";
  source_id: string;
  name: string;
  lat: number;
  lng: number;
  category: MarketCategory;
  tags: Record<string, string>;
  address?: { street?: string; city?: string; state?: string; zip?: string };
  contact?: { phone?: string; website?: string };
  opening_hours?: string;
  confidence: number;
  is_chain_suspected: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("POST only", { status: 405, headers: corsHeaders });
  }

  try {
    const { lat, lng, radius = 8000 } = await req.json();
    
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const latKey = lat.toFixed(2);
    const lngKey = lng.toFixed(2);
    const cache_key = `osm:${latKey}:${lngKey}:${radius}`;

    console.log(`[nearby-markets] Request for ${lat},${lng} radius=${radius}m`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Cache lookup with stale-while-revalidate
    const { data: cached } = await sb
      .from("osm_cache")
      .select("response_json, created_at")
      .eq("cache_key", cache_key)
      .maybeSingle();

    const hasCachedData = cached?.response_json;
    const ageMs = hasCachedData ? Date.now() - new Date(cached.created_at).getTime() : Infinity;
    const ttlMs = TTL_HOURS * 60 * 60 * 1000;
    const isStale = ageMs >= ttlMs;

    // Return fresh cache immediately
    if (hasCachedData && !isStale) {
      console.log(`[nearby-markets] Cache hit, age=${Math.round(ageMs / 1000 / 60)}min`);
      return new Response(JSON.stringify(cached.response_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return stale cache immediately, refresh in background
    if (hasCachedData && isStale) {
      console.log(`[nearby-markets] Returning stale cache, refreshing in background`);
      
      (async () => {
        try {
          const query = overpassQuery(lat, lng, radius);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const overpassRes = await fetch(OVERPASS_URL, {
            method: "POST",
            body: query,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (overpassRes.ok) {
            const raw = await overpassRes.json();
            const markets = processOSMElements(raw?.elements ?? []);
            const response_json = { center: { lat, lng }, radius, markets, fetched_at: new Date().toISOString() };
            await sb.from("osm_cache").upsert(
              { cache_key, center_lat: lat, center_lng: lng, radius_m: radius, response_json },
              { onConflict: "cache_key" }
            );
            console.log(`[nearby-markets] Background refresh complete`);
          }
        } catch (e) {
          console.error(`[nearby-markets] Background refresh failed:`, e);
        }
      })();
      
      return new Response(JSON.stringify(cached.response_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No cache - fetch fresh with timeout
    console.log("[nearby-markets] Fetching from Overpass API...");
    const query = overpassQuery(lat, lng, radius);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    let markets: NearishMarket[] = [];
    try {
      const overpassRes = await fetch(OVERPASS_URL, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (overpassRes.ok) {
        const raw = await overpassRes.json();
        console.log(`[nearby-markets] Overpass returned ${raw?.elements?.length || 0} elements`);
        markets = processOSMElements(raw?.elements ?? []);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("[nearby-markets] Overpass timeout or error:", err);
      // Return empty array but don't fail
    }

    console.log(`[nearby-markets] After filtering: ${markets.length} indie markets`);

    const response_json = { center: { lat, lng }, radius, markets, fetched_at: new Date().toISOString() };

    // Cache the result
    await sb.from("osm_cache").upsert(
      { cache_key, center_lat: lat, center_lng: lng, radius_m: radius, response_json },
      { onConflict: "cache_key" }
    );

    return new Response(JSON.stringify(response_json), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[nearby-markets] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", markets: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function processOSMElements(elements: OSMElement[]): NearishMarket[] {
  return elements
    .map((el): NearishMarket | null => {
      const tags = el.tags ?? {};
      const name = tags.name || "Unnamed";
      const centerLat = el.lat ?? el.center?.lat;
      const centerLng = el.lon ?? el.center?.lon;
      
      if (centerLat == null || centerLng == null) return null;

      const chain = isChain(tags);
      const conf = computeScore(tags, chain);
      const category = categoryFrom(tags);

      return {
        source: "osm",
        source_id: `${el.type}/${el.id}`,
        name,
        lat: centerLat,
        lng: centerLng,
        category,
        tags,
        address: {
          street: tags["addr:street"],
          city: tags["addr:city"],
          state: tags["addr:state"],
          zip: tags["addr:postcode"],
        },
        contact: {
          phone: tags["phone"] || tags["contact:phone"],
          website: tags["website"] || tags["contact:website"],
        },
        opening_hours: tags["opening_hours"],
        confidence: conf,
        is_chain_suspected: chain,
      };
    })
    .filter((m): m is NearishMarket => m !== null && m.confidence >= 2)
    .sort((a, b) => b.confidence - a.confidence);
}