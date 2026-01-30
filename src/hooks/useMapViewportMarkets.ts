import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Market, DietFilters, CategoryFilters } from "./useMarkets";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface OSMMarket {
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
}

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

// Debounce delay in ms
const DEBOUNCE_MS = 400;

// Cache for recent viewport queries (stores query keys)
const viewportCache = new Map<string, number>();
const MAX_CACHE_SIZE = 5;

// Haversine distance calculation
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

// Calculate center and radius from bounds
function boundsToCenter(bounds: MapBounds) {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;
  
  // Calculate radius as half of the diagonal distance
  const cornerDistance = haversineMeters(
    bounds.south, bounds.west,
    bounds.north, bounds.east
  );
  const radius = Math.ceil(cornerDistance / 2);
  
  return { lat: centerLat, lng: centerLng, radius };
}

// Create a cache key from bounds (rounded for similarity matching)
function createBoundsKey(bounds: MapBounds): string {
  return `${bounds.north.toFixed(3)},${bounds.south.toFixed(3)},${bounds.east.toFixed(3)},${bounds.west.toFixed(3)}`;
}

// Check if new bounds are significantly different from cached
function boundsChanged(oldBounds: MapBounds | null, newBounds: MapBounds): boolean {
  if (!oldBounds) return true;
  
  const threshold = 0.005; // ~500m change
  return (
    Math.abs(oldBounds.north - newBounds.north) > threshold ||
    Math.abs(oldBounds.south - newBounds.south) > threshold ||
    Math.abs(oldBounds.east - newBounds.east) > threshold ||
    Math.abs(oldBounds.west - newBounds.west) > threshold
  );
}

// Map OSM category to our market types
function mapCategoryToType(category: string): string {
  switch (category) {
    case "farmers_market":
    case "farm_shop":
    case "produce":
      return "farmers";
    case "bakery":
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

// Match category filters
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

// Fetch Google Places markets
async function fetchGooglePlacesMarkets(lat: number, lng: number, radius: number): Promise<Market[]> {
  const { data, error } = await supabase.functions.invoke<GooglePlacesResponse>(
    "nearby-google-places",
    { body: { lat, lng, radius } }
  );

  if (error || !data?.markets) return [];

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

export function useMapViewportMarkets(
  initialBounds: MapBounds | null,
  dietFilters?: DietFilters,
  categoryFilters?: CategoryFilters
) {
  const queryClient = useQueryClient();
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(initialBounds);
  const [isSearching, setIsSearching] = useState(false);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced bounds update
  const updateBounds = useCallback((newBounds: MapBounds) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only update if bounds changed meaningfully
    if (!boundsChanged(lastBoundsRef.current, newBounds)) {
      return;
    }

    setIsSearching(true);

    // Check cache
    const cacheKey = createBoundsKey(newBounds);
    if (viewportCache.has(cacheKey)) {
      // Already have this viewport cached, use it directly
      setCurrentBounds(newBounds);
      lastBoundsRef.current = newBounds;
      setIsSearching(false);
      return;
    }

    // Debounce the fetch
    debounceTimerRef.current = setTimeout(() => {
      console.log("[MapViewport] Fetching for new bounds:", newBounds);
      
      // Manage cache size
      if (viewportCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = viewportCache.keys().next().value;
        if (oldestKey) viewportCache.delete(oldestKey);
      }
      
      viewportCache.set(cacheKey, Date.now());
      setCurrentBounds(newBounds);
      lastBoundsRef.current = newBounds;
    }, DEBOUNCE_MS);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Query for markets based on current bounds
  const { lat, lng, radius } = currentBounds 
    ? boundsToCenter(currentBounds) 
    : { lat: 0, lng: 0, radius: 0 };

  const query = useQuery({
    queryKey: ["map-viewport-markets", lat.toFixed(2), lng.toFixed(2), radius],
    queryFn: async (): Promise<Market[]> => {
      if (!currentBounds) return [];

      const { lat, lng, radius } = boundsToCenter(currentBounds);
      console.log(`[MapViewport] Fetching markets at center (${lat.toFixed(4)}, ${lng.toFixed(4)}) radius ${radius}m`);

      // Fetch from OSM
      const { data: osmData, error: osmError } = await supabase.functions.invoke<NearbyMarketsResponse>(
        "nearby-markets",
        { body: { lat, lng, radius: Math.min(radius, 50000) } } // Cap at 50km
      );

      if (osmError) {
        console.error("[MapViewport] OSM error:", osmError);
      }

      const osmMarkets: Market[] = (osmData?.markets || []).map((m) => ({
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

      // If few results, try Google Places
      let allMarkets: Market[];
      if (osmMarkets.length < 6) {
        console.log(`[MapViewport] OSM returned ${osmMarkets.length}, fetching Google Places`);
        const googleMarkets = await fetchGooglePlacesMarkets(lat, lng, Math.min(radius, 50000));
        
        // Merge, avoiding duplicates
        const seen = new Set(osmMarkets.map(m => `${m.lat.toFixed(4)},${m.lng.toFixed(4)}`));
        allMarkets = [
          ...osmMarkets,
          ...googleMarkets.filter(g => !seen.has(`${g.lat.toFixed(4)},${g.lng.toFixed(4)}`))
        ];
      } else {
        allMarkets = osmMarkets;
      }

      // If still very few results, try expanding by 25%
      if (allMarkets.length < 3 && radius < 50000) {
        console.log("[MapViewport] Few results, expanding search by 25%");
        const expandedRadius = Math.ceil(radius * 1.25);
        const { data: expandedOsm } = await supabase.functions.invoke<NearbyMarketsResponse>(
          "nearby-markets",
          { body: { lat, lng, radius: expandedRadius } }
        );
        
        if (expandedOsm?.markets) {
          const seen = new Set(allMarkets.map(m => m.id));
          const newMarkets = expandedOsm.markets
            .filter(m => !seen.has(m.source_id))
            .map((m): Market => ({
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
              organic: m.tags?.organic === "yes" || m.category === "organic",
              vegan_friendly: m.tags?.["diet:vegan"] === "yes",
              gluten_free: m.tags?.["diet:gluten_free"] === "yes",
            }));
          allMarkets = [...allMarkets, ...newMarkets];
        }
      }

      console.log(`[MapViewport] Total markets: ${allMarkets.length}`);
      return allMarkets;
    },
    enabled: currentBounds !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mark searching as done when query finishes
  useEffect(() => {
    if (!query.isFetching) {
      setIsSearching(false);
    }
  }, [query.isFetching]);

  // Apply filters client-side
  const filteredMarkets = useMemo(() => {
    let markets = query.data || [];
    
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
  }, [query.data, dietFilters, categoryFilters]);

  return {
    markets: filteredMarkets,
    isLoading: query.isLoading,
    isFetching: query.isFetching || isSearching,
    isSearching,
    updateBounds,
    refetch: query.refetch,
  };
}
