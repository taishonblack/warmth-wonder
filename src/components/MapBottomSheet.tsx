import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Market {
  id: string;
  name: string;
  distance: string;
  isOpen: boolean;
  type: string;
}

interface MapBottomSheetProps {
  markets: Market[];
  onMarketSelect: (id: string) => void;
  className?: string;
}

export function MapBottomSheet({
  markets,
  onMarketSelect,
  className,
}: MapBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    openNow: false,
    organic: false,
    type: "",
    radius: "5",
  });

  const filteredMarkets = markets.filter((market) => {
    if (filters.openNow && !market.isOpen) return false;
    if (filters.type && market.type !== filters.type) return false;
    return true;
  });

  return (
    <div
      className={cn(
        "fixed bottom-16 left-0 right-0 z-40 bg-card rounded-t-3xl shadow-soft-lg transition-all duration-300",
        isExpanded ? "h-[50vh]" : "h-28",
        className
      )}
    >
      {/* Handle */}
      <div className="flex justify-center pt-2 pb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-1 bg-border rounded-full"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 -m-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
          <h3 className="font-medium text-foreground">
            {filteredMarkets.length} Markets
          </h3>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
            showFilters
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-y border-border bg-muted/30 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, openNow: !f.openNow }))
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filters.openNow
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              )}
            >
              Open now
            </button>
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, organic: !f.organic }))
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filters.organic
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              )}
            >
              Organic
            </button>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value }))
              }
              className="px-3 py-1.5 rounded-full text-sm bg-card text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All types</option>
              <option value="farmers">Farmers Market</option>
              <option value="flea">Flea Market</option>
              <option value="artisan">Artisan Market</option>
            </select>
            <select
              value={filters.radius}
              onChange={(e) =>
                setFilters((f) => ({ ...f, radius: e.target.value }))
              }
              className="px-3 py-1.5 rounded-full text-sm bg-card text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="1">1 mile</option>
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
            </select>
          </div>
        </div>
      )}

      {/* Market List */}
      {isExpanded && (
        <div className="overflow-y-auto h-[calc(100%-4rem)] px-4 py-2 scrollbar-hide">
          <div className="space-y-2">
            {filteredMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => onMarketSelect(market.id)}
                className="w-full flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-xl transition-colors text-left"
              >
                <div className="w-12 h-12 bg-blush rounded-lg flex items-center justify-center text-xl">
                  🏪
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {market.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {market.distance}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    market.isOpen
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {market.isOpen ? "Open" : "Closed"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
