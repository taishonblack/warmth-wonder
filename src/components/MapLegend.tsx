import { useState } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const legendItems = [
  { color: "#7C9A5E", label: "Farmers Market" },
  { color: "#D4A574", label: "Flea Market" },
  { color: "#C4A77D", label: "Artisan Market" },
  { color: "#B8860B", label: "Specialty Market" },
];

export function MapLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-card/95 backdrop-blur-sm rounded-full shadow-soft-md text-sm font-medium text-foreground hover:bg-card transition-colors"
        >
          <Info className="w-4 h-4" />
          Key
        </button>
      ) : (
        <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-soft-lg p-3 animate-scale-in min-w-[140px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Legend
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
