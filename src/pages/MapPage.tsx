import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapSidePanel } from "@/components/MapSidePanel";
import { MapLegend } from "@/components/MapLegend";
import { MapView } from "@/components/MapView";
import { MapSearchBar } from "@/components/MapSearchBar";
import { DietFilterBar, DietFilters } from "@/components/DietFilterBar";
import { CategoryFilterBar, CategoryFilters } from "@/components/CategoryFilterBar";
import { ClaimMarketModal } from "@/components/ClaimMarketModal";
import { RadiusSelector } from "@/components/RadiusSelector";
import { useLocation } from "@/contexts/LocationContext";
import { useProximitySettings, ProximityRadius } from "@/hooks/useProximitySettings";
import { useCombinedMarkets, Market } from "@/hooks/useMarkets";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, MapPin } from "lucide-react";

export default function MapPage() {
  const navigate = useNavigate();
  const { status, anchor } = useLocation();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  
  const { radius, setRadius } = useProximitySettings();
  const isMobile = useIsMobile();

  // Redirect to landing if no location
  useEffect(() => {
    if (status === "unknown") {
      navigate("/");
    }
  }, [status, navigate]);
  
  const { 
    data: markets = [], 
    isLoading: marketsLoading,
    refetch,
  } = useCombinedMarkets(
    anchor?.lat ?? null, 
    anchor?.lng ?? null, 
    searchQuery, 
    radius * 1609, 
    dietFilters, 
    categoryFilters
  );

  const userLocation = anchor ? { lat: anchor.lat, lng: anchor.lng } : null;

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

  if (status === "unknown" || status === "resolving") {
    return (
      <div className="h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Finding your location...</p>
        </div>
      </div>
    );
  }

  if (marketsLoading && markets.length === 0) {
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
            <RadiusSelector
              value={radius}
              onChange={(r: ProximityRadius) => setRadius(r)}
            />
          </div>
        </div>
      </div>

      {/* Location indicator */}
      {anchor && (
        <div className="absolute top-32 left-4 z-20 bg-card/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm md:left-auto md:right-4">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium">
            {anchor.source === "zip" && anchor.zipCode
              ? anchor.zipCode
              : "Current location"}
          </span>
        </div>
      )}

      {/* Mapbox Map */}
      <MapView
        markets={markets}
        selectedMarket={selectedMarket}
        onMarketSelect={handleMarketSelect}
        userLocation={userLocation}
        showDirections={showDirections}
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
