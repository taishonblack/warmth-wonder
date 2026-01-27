import { useState } from "react";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapLegend } from "@/components/MapLegend";
import { MapView } from "@/components/MapView";
import { MapSearchBar } from "@/components/MapSearchBar";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useCombinedMarkets } from "@/hooks/useMarkets";
import { Loader2, MapPin } from "lucide-react";

export default function MapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();
  
  const { 
    data: markets = [], 
    isLoading: marketsLoading 
  } = useCombinedMarkets(latitude, longitude, searchQuery);

  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null;

  const handleMarketSelect = (id: string) => {
    setSelectedMarket(id);
    setShowDirections(false);
  };

  const handleGetDirections = (marketId: string) => {
    setSelectedMarket(marketId);
    setShowDirections(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <MapSearchBar
          markets={markets}
          onMarketSelect={handleMarketSelect}
        />
      </div>

      {/* Location Error Banner */}
      {geoError && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4" />
          <span>Location unavailable. Showing NYC markets.</span>
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

      {/* Bottom Sheet */}
      <MapBottomSheet
        markets={markets}
        selectedMarket={selectedMarket}
        onMarketSelect={handleMarketSelect}
        userLocation={userLocation}
        onGetDirections={handleGetDirections}
      />
    </div>
  );
}
