import { createContext, useContext, useState, useMemo, useEffect, ReactNode, useCallback } from "react";
import { useCombinedMarkets, Market, DietFilters, CategoryFilters, calculateDistance } from "@/hooks/useMarkets";
import { useGeolocation } from "@/hooks/useGeolocation";
import market1 from "@/assets/market-1.jpg";

// Market with computed fields for display
export interface DisplayMarket extends Market {
  image: string;
  distanceMiles?: number;
}

interface MarketContextValue {
  // Location
  latitude: number | null;
  longitude: number | null;
  locationSource: "gps" | "zip" | "default" | "manual" | null;
  activeZipCode: string | null;
  geoLoading: boolean;
  geoError: string | null;
  setManualLocation: (lat: number, lng: number, source: "zip" | "gps", zipCode?: string) => void;
  refreshLocation: () => void;
  
  // Filters
  dietFilters: DietFilters;
  setDietFilters: (filters: DietFilters) => void;
  categoryFilters: CategoryFilters;
  setCategoryFilters: (filters: CategoryFilters) => void;
  
  // Canonical markets (same for both Explore and Map initial load)
  canonicalMarkets: Market[];
  nearbyMarkets: DisplayMarket[]; // ≤5 miles
  furtherMarkets: DisplayMarket[]; // >5 miles
  isLoading: boolean;
  isFetching: boolean;
  
  // Photo map for market images
  setPhotoMap: (map: Map<string, string>) => void;
  
  // Refetch
  refetch: () => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

const FETCH_RADIUS_METERS = 25 * 1609; // 25 miles

export function MarketProvider({ children }: { children: ReactNode }) {
  const {
    latitude,
    longitude,
    loading: geoLoading,
    error: geoError,
    source: locationSource,
    zipCode: activeZipCode,
    setManualLocation,
    refreshLocation,
  } = useGeolocation();

  const [dietFilters, setDietFilters] = useState<DietFilters>({
    organic: false,
    veganFriendly: false,
    glutenFree: false,
  });

  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>({
    farmers_market: false,
    farm_stand: false,
    bakery: false,
    organic_grocery: false,
  });

  const [photoMap, setPhotoMap] = useState<Map<string, string>>(new Map());

  // Track last fetched location to prevent stale data
  const [lastFetchedLocation, setLastFetchedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const {
    data: markets = [],
    isLoading: marketsLoading,
    isFetching: marketsFetching,
    refetch,
  } = useCombinedMarkets(latitude, longitude, undefined, FETCH_RADIUS_METERS, dietFilters, categoryFilters);

  // Update last fetched location when markets finish loading
  useEffect(() => {
    if (!marketsLoading && !marketsFetching && latitude && longitude && markets.length > 0) {
      setLastFetchedLocation({ lat: latitude, lng: longitude });
    }
  }, [marketsLoading, marketsFetching, latitude, longitude, markets.length]);

  // Check if current location matches fetched data
  const locationMatchesFetchedData = useMemo(() => {
    if (!lastFetchedLocation || !latitude || !longitude) return false;
    return (
      Math.abs(lastFetchedLocation.lat - latitude) < 0.001 &&
      Math.abs(lastFetchedLocation.lng - longitude) < 0.001
    );
  }, [lastFetchedLocation, latitude, longitude]);

  const isLoading = geoLoading || marketsLoading || marketsFetching || (markets.length > 0 && !locationMatchesFetchedData);

  // Split markets into near (≤5 mi) and further (>5 mi)
  const { nearbyMarkets, furtherMarkets } = useMemo(() => {
    if (!latitude || !longitude) {
      return {
        nearbyMarkets: markets.slice(0, 15).map((m) => ({
          ...m,
          image: photoMap.get(m.id) || m.photo_url || market1,
        })) as DisplayMarket[],
        furtherMarkets: [] as DisplayMarket[],
      };
    }

    const marketsWithDistance = markets.map((m) => ({
      ...m,
      distanceMiles: calculateDistance(latitude, longitude, m.lat, m.lng),
      image: photoMap.get(m.id) || m.photo_url || market1,
    }));

    const sorted = marketsWithDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);

    return {
      nearbyMarkets: sorted.filter((m) => m.distanceMiles <= 5).slice(0, 15) as DisplayMarket[],
      furtherMarkets: sorted.filter((m) => m.distanceMiles > 5).slice(0, 15) as DisplayMarket[],
    };
  }, [markets, latitude, longitude, photoMap]);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value: MarketContextValue = {
    latitude,
    longitude,
    locationSource,
    activeZipCode,
    geoLoading,
    geoError,
    setManualLocation,
    refreshLocation,
    dietFilters,
    setDietFilters,
    categoryFilters,
    setCategoryFilters,
    canonicalMarkets: markets,
    nearbyMarkets,
    furtherMarkets,
    isLoading,
    isFetching: marketsFetching,
    setPhotoMap,
    refetch: handleRefetch,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarketContext() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarketContext must be used within a MarketProvider");
  }
  return context;
}
