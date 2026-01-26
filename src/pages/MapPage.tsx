import { useState } from "react";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapLegend } from "@/components/MapLegend";
import { MapView } from "@/components/MapView";
import { useGeolocation } from "@/hooks/useGeolocation";

const mockMarkets = [
  { id: "1", name: "Union Square Greenmarket", distance: "0.3 mi", isOpen: true, type: "farmers", lat: 40.7359, lng: -73.9911 },
  { id: "2", name: "Grand Army Plaza Market", distance: "1.2 mi", isOpen: true, type: "farmers", lat: 40.6743, lng: -73.9712 },
  { id: "3", name: "Prospect Park Market", distance: "2.1 mi", isOpen: false, type: "farmers", lat: 40.6602, lng: -73.9690 },
  { id: "4", name: "Chelsea Market", distance: "0.8 mi", isOpen: true, type: "artisan", lat: 40.7424, lng: -74.0060 },
  { id: "5", name: "Smorgasburg", distance: "1.5 mi", isOpen: true, type: "flea", lat: 40.7215, lng: -73.9577 },
  { id: "6", name: "Essex Market", distance: "0.9 mi", isOpen: true, type: "artisan", lat: 40.7187, lng: -73.9872 },
];

export default function MapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const { latitude, longitude, loading: geoLoading } = useGeolocation();

  const userLocation = latitude && longitude ? { lat: latitude, lng: longitude } : null;

  const handleMarketSelect = (id: string) => {
    setSelectedMarket(id);
  };

  return (
    <div className="h-screen bg-muted relative overflow-hidden">
      {/* Mapbox Map */}
      <MapView
        markets={mockMarkets}
        selectedMarket={selectedMarket}
        onMarketSelect={handleMarketSelect}
        userLocation={userLocation}
      />

      {/* Legend */}
      <MapLegend />

      {/* Bottom Sheet */}
      <MapBottomSheet
        markets={mockMarkets}
        onMarketSelect={handleMarketSelect}
      />
    </div>
  );
}
