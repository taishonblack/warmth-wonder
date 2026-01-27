import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Market } from "@/hooks/useMarkets";

interface MapSearchBarProps {
  markets: Market[];
  onMarketSelect: (id: string) => void;
  className?: string;
}

export function MapSearchBar({
  markets,
  onMarketSelect,
  className,
}: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = markets.filter(
        (market) =>
          market.name.toLowerCase().includes(query.toLowerCase()) ||
          market.address.toLowerCase().includes(query.toLowerCase()) ||
          market.city.toLowerCase().includes(query.toLowerCase()) ||
          market.type.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMarkets(filtered.slice(0, 5));
    } else {
      setFilteredMarkets([]);
    }
  }, [query, markets]);

  const handleSelect = (id: string) => {
    onMarketSelect(id);
    setQuery("");
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery("");
    setFilteredMarkets([]);
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-all duration-200",
          isFocused
            ? "border-primary/30 shadow-lg"
            : "border-border shadow-md"
        )}
      >
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search markets..."
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />
        {query && (
          <button onClick={handleClear} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isFocused && filteredMarkets.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border shadow-lg overflow-hidden z-50">
          {filteredMarkets.map((market) => (
            <button
              key={market.id}
              onClick={() => handleSelect(market.id)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
            >
              <div className="font-medium text-sm text-foreground">
                {market.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {market.address}, {market.city}
              </div>
              <div className="flex items-center gap-2 mt-1">
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
            </button>
          ))}
        </div>
      )}

      {isFocused && query.trim().length > 0 && filteredMarkets.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border shadow-lg p-4 z-50">
          <p className="text-sm text-muted-foreground text-center">
            No markets found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
