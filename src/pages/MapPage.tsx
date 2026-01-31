import { useState, useCallback } from "react";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapSidePanel } from "@/components/MapSidePanel";
import { MapLegend } from "@/components/MapLegend";
import { MapView, MapBounds } from "@/components/MapView";
import { ClaimMarketModal } from "@/components/ClaimMarketModal";
import { LocationControl } from "@/components/LocationControl";
import { MapSearchBar } from "@/components/MapSearchBar";
import { useMarketContext } from "@/contexts/MarketContext";
import { Market } from "@/hooks/useMarkets";
import { useViewportMarkets } from "@/hooks/useViewportMarkets";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DietFilterBar } from "@/components/DietFilterBar";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";

export default function MapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [claimingMarket, setClaimingMarket] = useState<Market | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [hasUserPanned, setHasUserPanned] = useState(false);
  
  // Use shared context for initial location and filters
  const {
    latitude,
    longitude,
    geoLoading,
    geoError,
    locationSource,
    activeZipCode,
    setManualLocation,
    refreshLocation,
    canonicalMarkets,
    dietFilters,
    setDietFilters,
    categoryFilters,
    setCategoryFilters,
    isLoading: contextLoading,
    refetch,
  } = useMarketContext();
  
  // Viewport-based market fetching (only after user pans/zooms)
  const { data: viewportMarkets, isLoading: viewportLoading } = useViewportMarkets(
    mapBounds,
    dietFilters,
    categoryFilters,
    hasUserPanned // Only fetch when user has moved the map
  );
  
  const isMobile = useIsMobile();

  // Use viewport markets if user has panned, otherwise use canonical markets from Explore
  const markets = hasUserPanned && viewportMarkets ? viewportMarkets : canonicalMarkets;
  const isLoading = hasUserPanned ? viewportLoading : contextLoading;
  
  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null;

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
    setHasUserPanned(false); // Reset to canonical when location changes
  };

  const handleUseGps = () => {
    refreshLocation();
    setHasUserPanned(false);
  };

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    // Check if this is a significant move from the user's location
    if (userLocation) {
      const centerDist = Math.sqrt(
        Math.pow(bounds.center.lat - userLocation.lat, 2) +
        Math.pow(bounds.center.lng - userLocation.lng, 2)
      );
      // If moved more than ~0.02 degrees (~2km), consider it a user pan
      if (centerDist > 0.02) {
        setHasUserPanned(true);
      }
    }
    setMapBounds(bounds);
  }, [userLocation]);

  // Count active filters for badge
  const activeFilterCount = 
    Object.values(dietFilters).filter(Boolean).length + 
    Object.values(categoryFilters).filter(Boolean).length;

  if (contextLoading && canonicalMarkets.length === 0) {
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

      {/* Mobile: Search Bar + Location + Filter */}
      {isMobile && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="flex-1">
              <MapSearchBar
                markets={markets}
                onMarketSelect={handleMarketSelect}
              />
            </div>
            
            {/* Set Location Button */}
            <div className="bg-card rounded-xl shadow-md shrink-0">
              <LocationControl
                onLocationChange={handleLocationChange}
                onUseGps={handleUseGps}
                isLoading={geoLoading}
                currentSource={locationSource === "default" ? null : locationSource}
                savedZipCode={activeZipCode ?? undefined}
              />
            </div>
            
            {/* Filter Button */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="relative bg-card shadow-md shrink-0 h-11 w-11 rounded-xl"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-foreground">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      <CategoryFilterBar filters={categoryFilters} onChange={setCategoryFilters} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-foreground">Dietary Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      <DietFilterBar filters={dietFilters} onChange={setDietFilters} />
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setDietFilters({ organic: false, veganFriendly: false, glutenFree: false });
                        setCategoryFilters({ farmers_market: false, farm_stand: false, bakery: false, organic_grocery: false });
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Location Error Banner */}
      {geoError && (
        <div className="absolute top-24 left-4 right-4 z-20 bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-xl flex items-center gap-2 text-sm md:left-auto md:right-4 md:w-80 lg:w-96">
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
      />
      
      {/* Loading indicator for viewport fetch */}
      {hasUserPanned && viewportLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading markets...</span>
        </div>
      )}

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
