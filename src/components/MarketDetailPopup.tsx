import { X, MapPin, Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface Market {
  id: string;
  name: string;
  image: string;
  distance?: string;
  isOpen?: boolean;
  address?: string;
  hours?: string;
  description?: string;
}

interface MarketDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  onNavigate?: () => void;
}

export function MarketDetailPopup({
  isOpen,
  onClose,
  market,
  onNavigate,
}: MarketDetailPopupProps) {
  if (!isOpen || !market) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl animate-slide-up overflow-hidden max-h-[85vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="relative aspect-video">
          <img
            src={market.image}
            alt={market.name}
            className="w-full h-full object-cover"
          />
          {market.isOpen !== undefined && (
            <span
              className={cn(
                "absolute top-4 left-4 px-3 py-1 text-sm font-medium rounded-full",
                market.isOpen
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {market.isOpen ? "Open Now" : "Closed"}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {market.name}
            </h2>
            {market.distance && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {market.distance} away
              </p>
            )}
          </div>

          {market.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{market.address}</span>
            </div>
          )}

          {market.hours && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{market.hours}</span>
            </div>
          )}

          {market.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {market.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onNavigate}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
