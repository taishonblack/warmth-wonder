import { useState, useEffect } from "react";
import { Locate, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LocationControlProps {
  onLocationChange: (lat: number, lng: number, source: "zip" | "gps", zipCode?: string) => void;
  onUseGps: () => void;
  onSaveZipCode?: (zipCode: string) => Promise<void>;
  isLoading?: boolean;
  currentSource?: "gps" | "zip" | "manual" | null;
  savedZipCode?: string | null;
  className?: string;
}

export function LocationControl({
  onLocationChange,
  onUseGps,
  onSaveZipCode,
  isLoading = false,
  currentSource,
  savedZipCode,
  className,
}: LocationControlProps) {
  const [zipCode, setZipCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with saved zip code if available
  useEffect(() => {
    if (savedZipCode && !zipCode) {
      setZipCode(savedZipCode);
    }
  }, [savedZipCode]);

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate zip code format (US)
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!zipPattern.test(zipCode.trim())) {
      setError("Enter a valid 5-digit zip code");
      return;
    }

    setIsGeocoding(true);

    try {
      // Use edge function to proxy geocoding requests (avoids CORS)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode?type=forward&postalcode=${zipCode.trim()}&country=US`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const trimmedZip = zipCode.trim();
        onLocationChange(parseFloat(lat), parseFloat(lon), "zip", trimmedZip);
        // Save to profile if handler provided
        if (onSaveZipCode) {
          await onSaveZipCode(trimmedZip);
        }
        
        setIsOpen(false);
      } else {
        setError("Zip code not found");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Failed to look up zip code");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseGps = () => {
    // Trigger browser geolocation permission prompt
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange(position.coords.latitude, position.coords.longitude, "gps");
          setIsOpen(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError(
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied. Please enable in browser settings."
              : "Unable to get your location. Please try again."
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-muted-foreground hover:text-primary transition-colors",
            currentSource === "zip" && "text-primary",
            className
          )}
          aria-label="Change location"
        >
          <Locate className={cn("w-4 h-4", isLoading && "animate-pulse")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3 bg-card border border-border shadow-lg z-50"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Set Location</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Zip Code Input */}
          <form onSubmit={handleZipSubmit} className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => {
                  setZipCode(e.target.value);
                  setError(null);
                }}
                maxLength={10}
                className="h-9 text-sm"
                disabled={isGeocoding}
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3"
                disabled={!zipCode.trim() || isGeocoding}
              >
                {isGeocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Use GPS Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-sm"
            onClick={handleUseGps}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Locate className="w-4 h-4 mr-2" />
            )}
            Use my current location
          </Button>

          {currentSource === "zip" && (
            <p className="text-xs text-muted-foreground text-center">
              Currently showing results for zip code
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
