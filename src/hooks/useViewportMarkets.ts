import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Market, DietFilters, CategoryFilters } from "./useMarkets";
import { MapBounds } from "@/components/MapView";

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

// Map category to type
function mapCategoryToType(category: string): string {
  switch (category) {
    case "farmers_market": return "farmers";
    case "farm_shop":
    case "produce": return "farmers";
    case "bakery": return "artisan";
    case "organic":
    case "health_food": return "artisan";
    default: return "farmers";
  }
}

function mapGoogleTypesToType(types: string[]): string {
  if (types.includes("bakery")) return "artisan";
  if (types.includes("health")) return "artisan";
  return "farmers";
}

function matchesCategory(market: Market, categoryFilters?: CategoryFilters): boolean {
  if (!categoryFilters) return true;
  const activeFilters = Object.entries(categoryFilters).filter(([_, active]) => active);
  if (activeFilters.length === 0) return true;
  
  const type = market.type?.toLowerCase() || "";
  const category = (market as any).category?.toLowerCase() || "";
  const name = market.name?.toLowerCase() || "";
  
  for (const [filterKey] of activeFilters) {
    switch (filterKey) {
      case "farmers_market":
        if (type === "farmers" || category === "farmers_market" || name.includes("farmer") || name.includes("greenmarket")) return true;
        break;
      case "farm_stand":
        if (category === "farm_shop" || category === "produce" || name.includes("farm stand") || name.includes("farmstand") || name.includes("produce")) return true;
        break;
      case "bakery":
        if (type === "artisan" || category === "bakery" || name.includes("bakery") || name.includes("bread")) return true;
        break;
      case "organic_grocery":
        if (category === "organic" || category === "health_food" || name.includes("organic") || name.includes("health food") || name.includes("co-op") || name.includes("coop")) return true;
        break;
    }
  }
  return false;
}

export function useViewportMarkets(
  bounds: MapBounds | null,
  dietFilters?: DietFilters,
  categoryFilters?: CategoryFilters,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      "viewport-markets",
      bounds?.center.lat.toFixed(2),
      bounds?.center.lng.toFixed(2),
      bounds?.north.toFixed(2),
      bounds?.south.toFixed(2),
    ],
    queryFn: async (): Promise<Market[]> => {
      if (!bounds) return [];

      const { center } = bounds;
      // Calculate radius from bounds (diagonal distance / 2)
      const diagonalDist = haversineMeters(bounds.south, bounds.west, bounds.north, bounds.east);
      const radius = Math.min(diagonalDist / 2, 50000); // Cap at 50km

      console.log(`[useViewportMarkets] Fetching for center ${center.lat.toFixed(4)},${center.lng.toFixed(4)}, radius=${Math.round(radius)}m`);

      // Fetch OSM and Google in parallel
      const [osmResult, googleResult] = await Promise.allSettled([
        supabase.functions.invoke("nearby-markets", {
          body: { lat: center.lat, lng: center.lng, radius },
        }),
        supabase.functions.invoke("nearby-google-places", {
          body: { lat: center.lat, lng: center.lng, radius },
        }),
      ]);

      let allMarkets: Market[] = [];

      // Process OSM
      if (osmResult.status === "fulfilled" && !osmResult.value.error && osmResult.value.data?.markets) {
        const osmMarkets = osmResult.value.data.markets.map((m: any): Market => ({
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
          organic: m.tags?.organic === "yes" || m.tags?.organic === "only" || m.category === "organic",
          vegan_friendly: m.tags?.["diet:vegan"] === "yes" || m.tags?.["diet:vegetarian"] === "yes",
          gluten_free: m.tags?.["diet:gluten_free"] === "yes",
        }));
        allMarkets.push(...osmMarkets);
      }

      // Process Google
      if (googleResult.status === "fulfilled" && !googleResult.value.error && googleResult.value.data?.markets) {
        const googleMarkets = googleResult.value.data.markets.map((m: any): Market => ({
          id: m.place_id,
          name: m.name,
          description: null,
          address: m.address,
          city: "",
          state: "",
          zip_code: null,
          lat: m.lat,
          lng: m.lng,
          type: mapGoogleTypesToType(m.types || []),
          is_open: m.open_now ?? true,
          hours: null,
          website: null,
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source: "osm" as const,
          photo_reference: m.photo_ref,
        }));
        
        // Dedupe by checking distance to existing markets
        for (const gm of googleMarkets) {
          const isDupe = allMarkets.some((m) => {
            const dist = haversineMeters(m.lat, m.lng, gm.lat, gm.lng);
            return dist < 100; // Within 100m
          });
          if (!isDupe) allMarkets.push(gm);
        }
      }

      // Filter to only markets within viewport bounds
      allMarkets = allMarkets.filter((m) =>
        m.lat >= bounds.south &&
        m.lat <= bounds.north &&
        m.lng >= bounds.west &&
        m.lng <= bounds.east
      );

      // Apply diet filters
      if (dietFilters) {
        allMarkets = allMarkets.filter((m) => {
          if (dietFilters.organic && !m.organic) return false;
          if (dietFilters.veganFriendly && !m.vegan_friendly) return false;
          if (dietFilters.glutenFree && !m.gluten_free) return false;
          return true;
        });
      }

      // Apply category filters
      allMarkets = allMarkets.filter((m) => matchesCategory(m, categoryFilters));

      // Sort by distance from center
      allMarkets.sort((a, b) => {
        const distA = haversineMeters(center.lat, center.lng, a.lat, a.lng);
        const distB = haversineMeters(center.lat, center.lng, b.lat, b.lng);
        return distA - distB;
      });

      // Cap at 150 results
      return allMarkets.slice(0, 150);
    },
    enabled: enabled && bounds !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
