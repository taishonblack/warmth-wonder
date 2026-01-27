import { useQuery } from "@tanstack/react-query";
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
  // Optional fields for OSM data
  source?: "db" | "osm";
  confidence?: number;
  category?: string;
}

export interface DietFilters {
  organic: boolean;
  veganFriendly: boolean;
  glutenFree: boolean;
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

interface NearbyMarketsResponse {
  center: { lat: number; lng: number };
  radius: number;
  markets: OSMMarket[];
  fetched_at: string;
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
export function useNearbyMarkets(lat: number | null, lng: number | null, radius: number = 8000) {
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

// Combined hook that merges DB markets with OSM markets
export function useCombinedMarkets(
  lat: number | null,
  lng: number | null,
  searchQuery?: string,
  radius: number = 8000,
  dietFilters?: DietFilters
) {
  const dbMarkets = useMarkets(searchQuery, dietFilters);
  const osmMarkets = useNearbyMarkets(lat, lng, radius);

  const isLoading = dbMarkets.isLoading || osmMarkets.isLoading;
  const error = dbMarkets.error || osmMarkets.error;

  // Apply diet filters to OSM markets client-side
  let filteredOsmMarkets = osmMarkets.data || [];
  if (dietFilters) {
    filteredOsmMarkets = filteredOsmMarkets.filter((m) => {
      if (dietFilters.organic && !m.organic) return false;
      if (dietFilters.veganFriendly && !m.vegan_friendly) return false;
      if (dietFilters.glutenFree && !m.gluten_free) return false;
      return true;
    });
  }

  // Merge and deduplicate by proximity
  const markets = mergeMarkets(dbMarkets.data || [], filteredOsmMarkets);

  return {
    data: markets,
    isLoading,
    error,
    refetch: async () => {
      await Promise.all([dbMarkets.refetch(), osmMarkets.refetch()]);
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
