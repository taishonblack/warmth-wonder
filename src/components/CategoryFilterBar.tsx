import { Store, Tractor, Croissant, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

export type MarketCategory = "farmers_market" | "farm_stand" | "bakery" | "organic_grocery";

export interface CategoryFilters {
  farmers_market: boolean;
  farm_stand: boolean;
  bakery: boolean;
  organic_grocery: boolean;
}

export const CATEGORY_OPTIONS: { key: MarketCategory; label: string; icon: React.ElementType }[] = [
  { key: "farmers_market", label: "Farmers Market", icon: Store },
  { key: "farm_stand", label: "Farm Stand", icon: Tractor },
  { key: "bakery", label: "Bakery", icon: Croissant },
  { key: "organic_grocery", label: "Organic Grocery", icon: Apple },
];

interface CategoryFilterBarProps {
  filters: CategoryFilters;
  onChange: (filters: CategoryFilters) => void;
  className?: string;
}

export function CategoryFilterBar({ filters, onChange, className }: CategoryFilterBarProps) {
  const toggleFilter = (key: MarketCategory) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", className)}>
      {CATEGORY_OPTIONS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => toggleFilter(key)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            filters[key]
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
      {activeCount > 0 && (
        <button
          onClick={() => onChange({
            farmers_market: false,
            farm_stand: false,
            bakery: false,
            organic_grocery: false,
          })}
          className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
