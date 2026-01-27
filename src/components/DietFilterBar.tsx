import { Leaf, Heart, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DietFilters {
  organic: boolean;
  veganFriendly: boolean;
  glutenFree: boolean;
}

interface DietFilterBarProps {
  filters: DietFilters;
  onChange: (filters: DietFilters) => void;
  className?: string;
}

export function DietFilterBar({ filters, onChange, className }: DietFilterBarProps) {
  const toggleFilter = (key: keyof DietFilters) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", className)}>
      <button
        onClick={() => toggleFilter("organic")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
          filters.organic
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <Leaf className="w-4 h-4" />
        Organic
      </button>
      <button
        onClick={() => toggleFilter("veganFriendly")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
          filters.veganFriendly
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <Heart className="w-4 h-4" />
        Vegan-Friendly
      </button>
      <button
        onClick={() => toggleFilter("glutenFree")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
          filters.glutenFree
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <Wheat className="w-4 h-4" />
        Gluten-Free
      </button>
    </div>
  );
}
