import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Market, calculateDistance } from "@/hooks/useMarkets";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapSearchBar } from "@/components/MapSearchBar";

interface MapSidePanelProps {
  markets: Market[];
  selectedMarket: string | null;
  onMarketSelect: (id: string) => void;
  userLocation: { lat: number; lng: number } | null;
  onGetDirections: (marketId: string) => void;
  onClaimMarket: (market: Market) => void;
}

export function MapSidePanel({
  markets,
  selectedMarket,
  onMarketSelect,
  userLocation,
  onGetDirections,
  onClaimMarket,
}: MapSidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getDistance = (market: Market) => {
    if (!userLocation) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      market.lat,
      market.lng
    );
  };

  const sortedMarkets = [...markets].sort((a, b) => {
    const distA = getDistance(a);
    const distB = getDistance(b);
    if (distA === null) return 1;
    if (distB === null) return -1;
    return distA - distB;
  });

  return (
    <div
      className={cn(
        "absolute left-0 top-0 bottom-0 z-10 bg-card shadow-lg transition-all duration-300 flex",
        isCollapsed ? "w-0" : "w-80 lg:w-96"
      )}
    >
      {/* Panel Content */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-opacity duration-200",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {/* Search Bar */}
        <div className="p-4 border-b bg-card">
          <MapSearchBar
            markets={markets}
            onMarketSelect={onMarketSelect}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {markets.length} markets nearby
          </p>
        </div>

        {/* Market List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {sortedMarkets.map((market) => {
              const distance = getDistance(market);
              const isSelected = selectedMarket === market.id;

              return (
                <button
                  key={market.id}
                  onClick={() => onMarketSelect(market.id)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all",
                    isSelected
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {market.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {market.address}, {market.city}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {market.organic && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary">
                            🌿 Organic
                          </span>
                        )}
                        {market.vegan_friendly && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary">
                            💚 Vegan
                          </span>
                        )}
                        {market.source === "osm" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-secondary/50 text-secondary-foreground">
                            Community
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side info */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {market.is_open !== undefined && (
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-medium rounded-full",
                            market.is_open
                              ? "bg-primary/90 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {market.is_open ? "Open" : "Closed"}
                        </span>
                      )}
                      {distance !== null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Actions */}
                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGetDirections(market.id);
                        }}
                      >
                        Get Directions
                      </Button>
                      {market.source === "osm" && !market.claimed_by && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClaimMarket(market);
                          }}
                        >
                          Claim & Verify
                        </Button>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-6 h-16 bg-card border border-border rounded-r-lg shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
          isCollapsed ? "left-0" : "left-full -ml-px"
        )}
        aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
