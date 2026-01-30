import { useState, useCallback } from "react";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapSidePanel } from "@/components/MapSidePanel";
import { MapLegend } from "@/components/MapLegend";
import { MapView } from "@/components/MapView";
import { MapSearchBar } from "@/components/MapSearchBar";
import { DietFilterBar, DietFilters } from "@/components/DietFilterBar";
import { CategoryFilterBar, CategoryFilters } from "@/components/CategoryFilterBar";
import { ClaimMarketModal } from "@/components/ClaimMarketModal";
import { LocationControl } from "@/components/LocationControl";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMapViewportMarkets, MapBounds } from "@/hooks/useMapViewportMarkets";
import { Market } from "@/hooks/useMarkets";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, MapPin } from "lucide-react";

export default function MapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [claimingMarket, setClaimingMarket] = useState<Market | null>(null);
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
  const isMobile = useIsMobile();
  
  // Use viewport-driven market fetching
  const { 
    markets, 
    isLoading: marketsLoading,
    isSearching,
    updateBounds,
    refetch,
  } = useMapViewportMarkets(null, dietFilters, categoryFilters);

  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null;

  // Handle bounds change from map pan/zoom
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    updateBounds(bounds);
  }, [updateBounds]);

  const handleMarketSelect = (id: string) => {
    setSelectedMarket(id);
    setShowDirections(false);
  };

  const handleGetDirections = (marketId: string) => {
    setSelectedMarket(marketId);
    setShowDirections(true);
  };

  const handleClaimMarket = (market: Market) => {
    setClaimingMarket(market);
  };

  const handleMarketClaimed = () => {
    setClaimingMarket(null);
    refetch();
  };

  const handleLocationChange = (lat: number, lng: number, source: "zip" | "gps", zipCode?: string) => {
    setManualLocation(lat, lng, source, zipCode);
  };

  const handleUseGps = () => {
    refreshLocation();
  };

  // Show loading only on initial load when we have no markets yet
  if (marketsLoading && markets.length === 0 && !userLocation) {
    return (
      <div className="h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Finding nearby markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-muted relative overflow-hidden">
      {/* Desktop Side Panel */}
      {!isMobile && (
        <MapSidePanel
          markets={markets}
          selectedMarket={selectedMarket}
          onMarketSelect={handleMarketSelect}
          userLocation={userLocation}
          onGetDirections={handleGetDirections}
          onClaimMarket={handleClaimMarket}
        />
      )}

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 space-y-2 md:left-auto md:right-4 md:w-80 lg:w-96">
        <MapSearchBar
          markets={markets}
          onMarketSelect={handleMarketSelect}
        />
        {/* All Filters - Single Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 bg-card/90 backdrop-blur-sm rounded-xl p-2">
              <CategoryFilterBar filters={categoryFilters} onChange={setCategoryFilters} />
              <div className="w-px bg-border shrink-0" />
              <DietFilterBar filters={dietFilters} onChange={setDietFilters} />
            </div>
          </div>
          <div className="bg-card/90 backdrop-blur-sm rounded-xl p-1 shrink-0">
            <LocationControl
              onLocationChange={handleLocationChange}
              onUseGps={handleUseGps}
              isLoading={geoLoading}
              currentSource={locationSource}
              savedZipCode={activeZipCode}
            />
          </div>
        </div>
      </div>

      {/* Location Error Banner */}
      {geoError && (
        <div className="absolute top-32 left-4 right-4 z-20 bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-xl flex items-center gap-2 text-sm md:left-auto md:right-4 md:w-80 lg:w-96">
          <MapPin className="w-4 h-4" />
          <span>Using default location (07016). Tap the location icon to change.</span>
        </div>
      )}

      {/* Mapbox Map */}
      <MapView
        markets={markets}
        selectedMarket={selectedMarket}
        onMarketSelect={handleMarketSelect}
        userLocation={userLocation}
        showDirections={showDirections}
        onBoundsChange={handleBoundsChange}
        isSearching={isSearching}
      />

      {/* Legend */}
      <MapLegend />

      {/* Bottom Sheet - Mobile Only */}
      {isMobile && (
        <MapBottomSheet
          markets={markets}
          selectedMarket={selectedMarket}
          onMarketSelect={handleMarketSelect}
          userLocation={userLocation}
          onGetDirections={handleGetDirections}
          onClaimMarket={handleClaimMarket}
        />
      )}

      {/* Claim Market Modal */}
      <ClaimMarketModal
        isOpen={!!claimingMarket}
        onClose={() => setClaimingMarket(null)}
        market={claimingMarket}
        onClaimed={handleMarketClaimed}
      />
    </div>
  );
}
