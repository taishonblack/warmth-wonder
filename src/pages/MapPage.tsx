import { useState } from "react";
import { MapBottomSheet } from "@/components/MapBottomSheet";
import { MapLegend } from "@/components/MapLegend";

const mockMarkets = [
  { id: "1", name: "Union Square Greenmarket", distance: "0.3 mi", isOpen: true, type: "farmers", lat: 40.7359, lng: -73.9911 },
  { id: "2", name: "Grand Army Plaza Market", distance: "1.2 mi", isOpen: true, type: "farmers", lat: 40.6743, lng: -73.9712 },
  { id: "3", name: "Prospect Park Market", distance: "2.1 mi", isOpen: false, type: "farmers", lat: 40.6602, lng: -73.9690 },
  { id: "4", name: "Chelsea Market", distance: "0.8 mi", isOpen: true, type: "artisan", lat: 40.7424, lng: -74.0060 },
  { id: "5", name: "Smorgasburg", distance: "1.5 mi", isOpen: true, type: "flea", lat: 40.7215, lng: -73.9577 },
  { id: "6", name: "Essex Market", distance: "0.9 mi", isOpen: true, type: "artisan", lat: 40.7187, lng: -73.9872 },
];

const mapPins = [
  { id: "1", x: 45, y: 30, type: "farmers" },
  { id: "2", x: 35, y: 55, type: "farmers" },
  { id: "3", x: 28, y: 65, type: "farmers" },
  { id: "4", x: 20, y: 35, type: "artisan" },
  { id: "5", x: 65, y: 45, type: "flea" },
  { id: "6", x: 55, y: 50, type: "artisan" },
];

const pinColors: Record<string, string> = {
  farmers: "bg-primary",
  flea: "bg-secondary",
  artisan: "bg-clay",
};

export default function MapPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  const handleMarketSelect = (id: string) => {
    setSelectedMarket(id);
  };

  return (
    <div className="h-screen bg-muted relative overflow-hidden">
      {/* Map Canvas - Styled placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-blush/30 to-muted">
        {/* Decorative map elements */}
        <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Streets */}
          <path d="M0 30 L100 30" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" />
          <path d="M0 50 L100 50" stroke="hsl(var(--border))" strokeWidth="0.3" fill="none" />
          <path d="M0 70 L100 70" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" />
          <path d="M30 0 L30 100" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" />
          <path d="M50 0 L50 100" stroke="hsl(var(--border))" strokeWidth="0.3" fill="none" />
          <path d="M70 0 L70 100" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" />
          {/* Park areas */}
          <rect x="25" y="55" width="15" height="20" fill="hsl(var(--primary) / 0.1)" rx="2" />
          <rect x="55" y="20" width="20" height="15" fill="hsl(var(--primary) / 0.1)" rx="2" />
        </svg>

        {/* Map Pins */}
        {mapPins.map((pin) => (
          <button
            key={pin.id}
            onClick={() => handleMarketSelect(pin.id)}
            className={`absolute w-6 h-6 rounded-full ${pinColors[pin.type]} shadow-soft-md transition-transform hover:scale-125 flex items-center justify-center ${selectedMarket === pin.id ? "scale-125 ring-2 ring-primary-foreground" : ""}`}
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="text-xs">🏪</span>
          </button>
        ))}

        {/* User location */}
        <div
          className="absolute w-4 h-4 bg-accent rounded-full shadow-soft-md animate-pulse"
          style={{ left: "50%", top: "40%", transform: "translate(-50%, -50%)" }}
        >
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-50" />
        </div>
      </div>

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
