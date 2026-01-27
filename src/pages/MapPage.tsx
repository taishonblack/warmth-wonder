import { useState } from "react";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapLegend } from "@/components/MapLegend";
import { MapView } from "@/components/MapView";
import { MapSearchBar } from "@/components/MapSearchBar";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMarkets } from "@/hooks/useMarkets";
import { Loader2 } from "lucide-react";

export default function MapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { data: markets = [], isLoading: marketsLoading } = useMarkets();

  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null;

  const handleMarketSelect = (id: string) => {
    setSelectedMarket(id);
    setShowDirections(false);
  };

  const handleGetDirections = (marketId: string) => {
    setSelectedMarket(marketId);
    setShowDirections(true);
  };

  if (marketsLoading) {
    return (
      <div className="h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading markets...</p>
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
