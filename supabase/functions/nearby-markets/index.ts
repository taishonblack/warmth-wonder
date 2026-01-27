import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const TTL_HOURS = 12;

// Chain stores to filter out
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
  const hay = normalizeStr(
    [tags["name"], tags["operator"], tags["brand"]].filter(Boolean).join(" ")
  );
  return CHAIN_BLACKLIST.some((c) => hay.includes(c));
}

type MarketCategory = 
  | "farmers_market" 
  | "farm_shop" 
  | "produce" 
  | "bakery" 
  | "organic" 
  | "health_food" 
  | "unknown";

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
  
  // High confidence markers
  if (tags["amenity"] === "marketplace") s += 3;
  if (["farm", "greengrocer", "produce", "bakery", "organic", "health_food"].includes(tags["shop"] ?? "")) s += 2;
  
  // Quality signals
  if (tags["opening_hours"]) s += 1;
  if (tags["phone"] || tags["contact:phone"]) s += 1;
  if (tags["website"] || tags["contact:website"]) s += 1;
  if (tags["addr:street"]) s += 1;
  
  // Local/indie signals
  if (tags["local_produce"] === "yes") s += 1;
  if (tags["organic"] === "yes" || tags["organic"] === "only") s += 1;
  
  // Chain penalty
  if (chain) s -= 4;
  
  return s;
}

function overpassQuery(lat: number, lng: number, radius: number): string {
  return `
[out:json][timeout:25];
(
  // Farmers markets / marketplaces
  nwr["amenity"="marketplace"](around:${radius},${lat},${lng});
  
  // Produce / greengrocer / farm shop
  nwr["shop"="greengrocer"](around:${radius},${lat},${lng});
  nwr["shop"="farm"](around:${radius},${lat},${lng});
  nwr["shop"="produce"](around:${radius},${lat},${lng});
  
  // Bakeries
  nwr["shop"="bakery"](around:${radius},${lat},${lng});
  
  // Organic / health food
  nwr["shop"="organic"](around:${radius},${lat},${lng});
  nwr["shop"="health_food"](around:${radius},${lat},${lng});
  
  // Co-ops (best-effort)
  nwr["shop"="supermarket"]["operator"~"co[- ]?op|cooperative",i](around:${radius},${lat},${lng});
  nwr["name"~"co[- ]?op|cooperative",i](around:${radius},${lat},${lng});
);
out center tags;
`;
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
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  contact?: {
    phone?: string;
    website?: string;
  };
  opening_hours?: string;
  confidence: number;
  is_chain_suspected: boolean;
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
    const { lat, lng, radius = 8000 } = await req.json();
    
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing lat/lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create cache key by rounding to ~1km grid
    const latKey = lat.toFixed(2);
    const lngKey = lng.toFixed(2);
    const cache_key = `osm:${latKey}:${lngKey}:${radius}`;

    console.log(`[nearby-markets] Request for ${lat},${lng} radius=${radius}m, cache_key=${cache_key}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // 1) Cache lookup
    const { data: cached, error: cacheError } = await sb
      .from("osm_cache")
      .select("response_json, created_at")
      .eq("cache_key", cache_key)
      .maybeSingle();

    if (cacheError) {
      console.error("[nearby-markets] Cache lookup error:", cacheError);
    }

    if (cached?.response_json && cached?.created_at) {
      const ageMs = Date.now() - new Date(cached.created_at).getTime();
      const ttlMs = TTL_HOURS * 60 * 60 * 1000;
      
      if (ageMs < ttlMs) {
        console.log(`[nearby-markets] Cache hit, age=${Math.round(ageMs / 1000 / 60)}min`);
        return new Response(JSON.stringify(cached.response_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`[nearby-markets] Cache expired, age=${Math.round(ageMs / 1000 / 60)}min`);
    }

    // 2) Fetch from Overpass API
    console.log("[nearby-markets] Fetching from Overpass API...");
    const query = overpassQuery(lat, lng, radius);
    
    const overpassRes = await fetch(OVERPASS_URL, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!overpassRes.ok) {
      console.error("[nearby-markets] Overpass error:", overpassRes.status);
      return new Response(
        JSON.stringify({ error: "Overpass API error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = await overpassRes.json();
    console.log(`[nearby-markets] Overpass returned ${raw?.elements?.length || 0} elements`);

    // 3) Normalize + filter
    const elements: OSMElement[] = raw?.elements ?? [];
    const markets: NearishMarket[] = elements
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
      .filter((m): m is NearishMarket => m !== null)
      .filter((m) => m.confidence >= 2)
      .sort((a, b) => b.confidence - a.confidence);

    console.log(`[nearby-markets] After filtering: ${markets.length} indie markets`);

    const response_json = { 
      center: { lat, lng }, 
      radius, 
      markets,
      fetched_at: new Date().toISOString(),
    };

    // 4) Upsert cache
    const { error: upsertError } = await sb.from("osm_cache").upsert(
      {
        cache_key,
        center_lat: lat,
        center_lng: lng,
        radius_m: radius,
        response_json,
      },
      { onConflict: "cache_key" }
    );

    if (upsertError) {
      console.error("[nearby-markets] Cache upsert error:", upsertError);
    } else {
      console.log("[nearby-markets] Cache updated");
    }

    return new Response(JSON.stringify(response_json), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[nearby-markets] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
