import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// Database market type
export interface Market {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  lat: number;
  lng: number;
  type: string;
  is_open: boolean;
  hours: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  // Diet filters
  organic?: boolean;
  vegan_friendly?: boolean;
  gluten_free?: boolean;
  // Claim info
  claimed_by?: string | null;
  claimed_at?: string | null;
  osm_source_id?: string | null;
  verification_count?: number;
  // Photo fields
  photo_url?: string | null;
  photo_reference?: string | null;
  // Optional fields for OSM data
  source?: "db" | "osm";
  confidence?: number;
  category?: string;
  // Computed distance for "Near you" sorting
  distance_m?: number;
}

export interface DietFilters {
  organic: boolean;
  veganFriendly: boolean;
  glutenFree: boolean;
}

export type MarketCategory = "farmers_market" | "farm_stand" | "bakery" | "organic_grocery";

export interface CategoryFilters {
  farmers_market: boolean;
  farm_stand: boolean;
  bakery: boolean;
  organic_grocery: boolean;
}

// OSM market type from edge function
interface OSMMarket {
  source: "osm";
  source_id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
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

// Google Places market type from edge function
interface GoogleMarket {
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

interface NearbyMarketsResponse {
  center: { lat: number; lng: number };
  radius: number;
  markets: OSMMarket[];
  fetched_at: string;
}

interface GooglePlacesResponse {
  center: { lat: number; lng: number };
  radius: number;
  markets: GoogleMarket[];
  fetched_at: string;
}

// Default radius: ~15 miles for better suburban coverage
const DEFAULT_RADIUS_METERS = 24140;

// Haversine distance calculation
function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Fetch markets from database
export function useMarkets(searchQuery?: string, dietFilters?: DietFilters) {
  return useQuery({
    queryKey: ["markets", searchQuery, dietFilters],
    queryFn: async () => {
      let query = supabase.from("markets").select("*");

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        );
      }

      // Apply diet filters
      if (dietFilters?.organic) {
        query = query.eq("organic", true);
      }
      if (dietFilters?.veganFriendly) {
        query = query.eq("vegan_friendly", true);
      }
      if (dietFilters?.glutenFree) {
        query = query.eq("gluten_free", true);
      }

      const { data, error } = await query.order("name");

      if (error) {
        console.error("Error fetching markets:", error);
        throw error;
      }

      return (data as Market[]).map(m => ({ ...m, source: "db" as const }));
    },
  });
}

// Fetch nearby markets from OSM via edge function
export function useNearbyMarkets(lat: number | null, lng: number | null, radius: number = DEFAULT_RADIUS_METERS) {
  return useQuery({
    queryKey: ["nearby-markets", lat?.toFixed(2), lng?.toFixed(2), radius],
    queryFn: async (): Promise<Market[]> => {
      if (!lat || !lng) return [];

      const { data, error } = await supabase.functions.invoke<NearbyMarketsResponse>(
        "nearby-markets",
        {
          body: { lat, lng, radius },
        }
      );

      if (error) {
        console.error("Error fetching nearby markets:", error);
        throw error;
      }

      if (!data?.markets) return [];

      // Convert OSM markets to our Market type
      return data.markets.map((m): Market => ({
        id: m.source_id,
        name: m.name,
        description: null,
        address: m.address?.street || "Address unknown",
        city: m.address?.city || "",
        state: m.address?.state || "",
        zip_code: m.address?.zip || null,
        lat: m.lat,
        lng: m.lng,
        type: mapCategoryToType(m.category),
        is_open: true, // We can't know this reliably from OSM
        hours: m.opening_hours || null,
        website: m.contact?.website || null,
        phone: m.contact?.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: "osm",
        confidence: m.confidence,
        category: m.category,
        // Check OSM tags for diet info
        organic: m.tags?.organic === "yes" || m.tags?.organic === "only" || m.category === "organic",
        vegan_friendly: m.tags?.["diet:vegan"] === "yes" || m.tags?.["diet:vegetarian"] === "yes",
        gluten_free: m.tags?.["diet:gluten_free"] === "yes",
      }));
    },
    enabled: lat !== null && lng !== null,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Helper function to fetch Google Places markets (not a hook)
async function fetchGooglePlacesMarkets(lat: number, lng: number, radius: number): Promise<Market[]> {
  const { data, error } = await supabase.functions.invoke<GooglePlacesResponse>(
    "nearby-google-places",
    {
      body: { lat, lng, radius },
    }
  );

  if (error) {
    console.error("Error fetching Google Places markets:", error);
    return [];
  }

  if (!data?.markets) return [];

  return data.markets.map((m): Market => ({
    id: m.place_id,
    name: m.name,
    description: null,
    address: m.address,
    city: "",
    state: "",
    zip_code: null,
    lat: m.lat,
    lng: m.lng,
    type: mapGoogleTypesToType(m.types),
    is_open: m.open_now ?? true,
    hours: null,
    website: null,
    phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: "osm",
    photo_reference: m.photo_ref,
  }));
}

// Map OSM category to our market types
function mapCategoryToType(category: string): string {
  switch (category) {
    case "farmers_market":
      return "farmers";
    case "farm_shop":
    case "produce":
      return "farmers";
    case "bakery":
      return "artisan";
    case "organic":
    case "health_food":
      return "artisan";
    default:
      return "farmers";
  }
}

// Map Google Places types to our market types
function mapGoogleTypesToType(types: string[]): string {
  if (types.includes("bakery")) return "artisan";
  if (types.includes("health")) return "artisan";
  return "farmers";
}

// Map internal types to category filters
function matchesCategory(market: Market, categoryFilters?: CategoryFilters): boolean {
  if (!categoryFilters) return true;
  
  const activeFilters = Object.entries(categoryFilters).filter(([_, active]) => active);
  if (activeFilters.length === 0) return true;
  
  const type = market.type?.toLowerCase() || "";
  const category = market.category?.toLowerCase() || "";
  const name = market.name?.toLowerCase() || "";
  
  for (const [filterKey] of activeFilters) {
    switch (filterKey) {
      case "farmers_market":
        if (type === "farmers" || category === "farmers_market" || 
            name.includes("farmer") || name.includes("greenmarket")) {
          return true;
        }
        break;
      case "farm_stand":
        if (category === "farm_shop" || category === "produce" ||
            name.includes("farm stand") || name.includes("farmstand") ||
            name.includes("produce")) {
          return true;
        }
        break;
      case "bakery":
        if (type === "artisan" || category === "bakery" || 
            name.includes("bakery") || name.includes("bread")) {
          return true;
        }
        break;
      case "organic_grocery":
        if (category === "organic" || category === "health_food" ||
            name.includes("organic") || name.includes("health food") ||
            name.includes("co-op") || name.includes("coop")) {
          return true;
        }
        break;
    }
  }
  
  return false;
}

// Combined hook that merges DB markets with OSM + Google in PARALLEL
export function useCombinedMarkets(
  lat: number | null,
  lng: number | null,
  searchQuery?: string,
  radius: number = DEFAULT_RADIUS_METERS,
  dietFilters?: DietFilters,
  categoryFilters?: CategoryFilters
) {
  const dbMarkets = useMarkets(searchQuery, dietFilters);
  
  // Single query that fetches OSM + Google in PARALLEL for speed
  const nearbyMarkets = useQuery({
    queryKey: ["nearby-markets-combined", lat?.toFixed(2), lng?.toFixed(2), radius],
    queryFn: async (): Promise<Market[]> => {
      if (!lat || !lng) return [];
      
      console.log(`[useCombinedMarkets] Fetching markets in parallel for ${lat.toFixed(4)},${lng.toFixed(4)}`);
      const startTime = Date.now();
      
      // Fetch OSM and Google Places in PARALLEL
      const [osmResult, googleResult] = await Promise.allSettled([
        supabase.functions.invoke<{
          center: { lat: number; lng: number };
          radius: number;
          markets: Array<{
            source: "osm";
            source_id: string;
            name: string;
            lat: number;
            lng: number;
            category: string;
            tags: Record<string, string>;
            address?: { street?: string; city?: string; state?: string; zip?: string };
            contact?: { phone?: string; website?: string };
            opening_hours?: string;
            confidence: number;
            is_chain_suspected: boolean;
          }>;
        }>("nearby-markets", { body: { lat, lng, radius } }),
        fetchGooglePlacesMarkets(lat, lng, radius),
      ]);

      // Process OSM results
      let osmMarkets: Market[] = [];
      if (osmResult.status === "fulfilled" && !osmResult.value.error && osmResult.value.data?.markets) {
        osmMarkets = osmResult.value.data.markets.map((m) => ({
          id: m.source_id,
          name: m.name,
          description: null,
          address: m.address?.street || "Address unknown",
          city: m.address?.city || "",
          state: m.address?.state || "",
          zip_code: m.address?.zip || null,
          lat: m.lat,
          lng: m.lng,
          type: mapCategoryToType(m.category),
          is_open: true,
          hours: m.opening_hours || null,
          website: m.contact?.website || null,
          phone: m.contact?.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: "osm" as const,
          confidence: m.confidence,
          category: m.category,
          organic: m.tags?.organic === "yes" || m.tags?.organic === "only" || m.category === "organic",
          vegan_friendly: m.tags?.["diet:vegan"] === "yes" || m.tags?.["diet:vegetarian"] === "yes",
          gluten_free: m.tags?.["diet:gluten_free"] === "yes",
        }));
      }

      // Process Google results
      let googleMarkets: Market[] = [];
      if (googleResult.status === "fulfilled") {
        googleMarkets = googleResult.value;
      }

      console.log(`[useCombinedMarkets] Got ${osmMarkets.length} OSM + ${googleMarkets.length} Google in ${Date.now() - startTime}ms`);

      // Merge both sources (OSM takes precedence for duplicates)
      const allMarkets = mergeMarkets(osmMarkets, googleMarkets);

      // Compute distances + sort by nearest
      const MAX_DISTANCE = radius * 1.05;
      const withDistance = allMarkets.map((m) => ({
        ...m,
        distance_m: haversineMeters(lat, lng, m.lat, m.lng),
      }));

      // Hard filter + sort by distance
      return withDistance
        .filter((m) => (m.distance_m ?? 0) <= MAX_DISTANCE)
        .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
    },
    enabled: lat !== null && lng !== null,
    staleTime: 1000 * 60 * 30, // 30 minutes - rely on backend cache
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection
  });

  const isLoading = dbMarkets.isLoading || nearbyMarkets.isLoading;
  const isFetching = dbMarkets.isFetching || nearbyMarkets.isFetching;
  const error = dbMarkets.error || nearbyMarkets.error;

  // Apply diet and category filters to nearby markets client-side
  const filteredNearbyMarkets = useMemo(() => {
    let markets = nearbyMarkets.data || [];
    
    // Apply diet filters
    if (dietFilters) {
      markets = markets.filter((m) => {
        if (dietFilters.organic && !m.organic) return false;
        if (dietFilters.veganFriendly && !m.vegan_friendly) return false;
        if (dietFilters.glutenFree && !m.gluten_free) return false;
        return true;
      });
    }
    
    // Apply category filters
    markets = markets.filter((m) => matchesCategory(m, categoryFilters));
    
    return markets;
  }, [nearbyMarkets.data, dietFilters, categoryFilters]);

  // Merge DB markets with nearby results
  const markets = useMemo(() => 
    mergeMarkets(dbMarkets.data || [], filteredNearbyMarkets),
    [dbMarkets.data, filteredNearbyMarkets]
  );

  return {
    data: markets,
    isLoading,
    isFetching,
    error,
    refetch: async () => {
      await Promise.all([dbMarkets.refetch(), nearbyMarkets.refetch()]);
    },
  };
}

// Merge markets, preferring DB entries over OSM for duplicates
function mergeMarkets(dbMarkets: Market[], osmMarkets: Market[]): Market[] {
  const result: Market[] = [...dbMarkets.map(m => ({ ...m, source: "db" as const }))];
  
  for (const osmMarket of osmMarkets) {
    // Check if there's a nearby DB market (within ~100m)
    const isDuplicate = dbMarkets.some((dbm) => {
      const distance = calculateDistance(dbm.lat, dbm.lng, osmMarket.lat, osmMarket.lng);
      return distance < 0.1; // 0.1 miles ~ 160 meters
    });

    if (!isDuplicate) {
      result.push(osmMarket);
    }
  }

  return result;
}

export function useMarketById(id: string | null) {
  return useQuery({
    queryKey: ["market", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching market:", error);
        throw error;
      }

      return data as Market | null;
    },
    enabled: !!id,
  });
}

// Calculate distance between two coordinates in miles
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
