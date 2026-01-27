import { useState } from "react";
import { ChevronUp, ChevronDown, MapPin, Clock, Navigation, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Market, calculateDistance } from "@/hooks/useMarkets";

interface MapBottomSheetProps {
  markets: Market[];
  selectedMarket: string | null;
  onMarketSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  onGetDirections?: (marketId: string) => void;
}

export function MapBottomSheet({ 
  markets, 
  selectedMarket,
  onMarketSelect,
  userLocation,
  onGetDirections 
}: MapBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "farmers", label: "Farmers" },
    { id: "artisan", label: "Artisan" },
    { id: "flea", label: "Flea" },
    { id: "open", label: "Open Now" },
  ];

  const filteredMarkets = markets
    .filter((market) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "open") return market.is_open;
      return market.type === activeFilter;
    })
    .map((market) => ({
      ...market,
      distance: userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            market.lat,
            market.lng
          )
        : null,
    }))
    .sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      return 0;
    });

  const selectedMarketData = markets.find((m) => m.id === selectedMarket);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-lg transition-all duration-300 z-10",
        isExpanded ? "h-[60vh]" : selectedMarketData ? "h-auto" : "h-48"
      )}
    >
      {/* Handle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-center py-3"
      >
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
      </button>

      {/* Selected Market Detail */}
      {selectedMarketData && !isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">
                {selectedMarketData.name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {selectedMarketData.address}, {selectedMarketData.city}
              </p>
              {selectedMarketData.hours && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  {selectedMarketData.hours}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-xs",
                    selectedMarketData.is_open
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {selectedMarketData.is_open ? "Open" : "Closed"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {selectedMarketData.type} market
                </span>
              </div>
            </div>
            {onGetDirections && (
              <button
                onClick={() => onGetDirections(selectedMarketData.id)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>
            )}
          </div>
          {selectedMarketData.description && (
            <p className="text-sm text-muted-foreground mt-3">
              {selectedMarketData.description}
            </p>
          )}
        </div>
      )}

      {/* Expanded Content */}
      {(isExpanded || !selectedMarketData) && (
        <div className="px-4 pb-4 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-foreground">
              Nearby Markets
            </h2>
            <button onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Market List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => onMarketSelect(market.id)}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-colors",
                  selectedMarket === market.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {market.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {market.address}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs",
                          market.is_open
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {market.is_open ? "Open" : "Closed"}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {market.type}
                      </span>
                    </div>
                  </div>
                  {market.distance !== null && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {market.distance.toFixed(1)} mi
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
