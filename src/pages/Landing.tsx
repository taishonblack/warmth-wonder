import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Loader2, ChevronRight, Leaf, Store, Wheat, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/contexts/LocationContext";
import nearishLogo from "@/assets/nearish-logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const { status, setAnchor, requestGps } = useLocation();
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isRequestingGps, setIsRequestingGps] = useState(false);

  // Navigate to explore once location is ready
  useEffect(() => {
    if (status === "ready") {
      navigate("/explore");
    }
  }, [status, navigate]);

  const handleUseLocation = async () => {
    setIsRequestingGps(true);
    await requestGps();
    setIsRequestingGps(false);
    // Navigation happens via useEffect when status becomes "ready"
  };

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setZipError(null);

    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!zipPattern.test(zipCode.trim())) {
      setZipError("Enter a valid 5-digit zip code");
      return;
    }

    setIsGeocoding(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode?type=forward&postalcode=${zipCode.trim()}&country=US`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();

      if (data?.[0]) {
        setAnchor(parseFloat(data[0].lat), parseFloat(data[0].lon), "zip", zipCode.trim());
        // Navigation happens via useEffect when status becomes "ready"
      } else {
        setZipError("Zip code not found");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setZipError("Failed to look up zip code");
    } finally {
      setIsGeocoding(false);
    }
  };

  const isLoading = isGeocoding || isRequestingGps || status === "resolving";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Logo & Brand */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <img src={nearishLogo} alt="Nearish" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary">
              nearish
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A community platform for health-conscious shoppers
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <p className="text-foreground/90 leading-relaxed">
              Discover <span className="font-medium text-primary">farmers markets</span>, 
              <span className="font-medium text-primary"> farm stands</span>, 
              <span className="font-medium text-primary"> bakeries</span>, and 
              <span className="font-medium text-primary"> organic mom-and-pop shops</span> — near you.
            </p>
            <p className="text-sm text-muted-foreground italic">
              "Watching out for the little guy in a big world."
            </p>
          </div>

          {/* Feature Icons */}
          <div className="flex justify-center gap-6 py-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Markets</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Farm Stands</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Wheat className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Bakeries</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Organic</span>
            </div>
          </div>

          {/* Location Input Section */}
          <div className="space-y-4 pt-4">
            <p className="text-sm font-medium text-foreground">
              Where should we look?
            </p>

            {/* Use My Location Button */}
            <Button
              size="lg"
              className="w-full h-14 text-base font-medium gap-2"
              onClick={handleUseLocation}
              disabled={isLoading}
            >
              {isRequestingGps || status === "resolving" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding your location...
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Use my current location
                </>
              )}
            </Button>

            {status === "denied" && (
              <p className="text-sm text-destructive">
                Location access was denied. Please enter your zip code instead.
              </p>
            )}

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or</span>
              </div>
            </div>

            {/* ZIP Code Input */}
            <form onSubmit={handleZipSubmit} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter zip code"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value);
                    setZipError(null);
                  }}
                  maxLength={10}
                  className="h-12 text-base"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  className="h-12 px-6"
                  disabled={!zipCode.trim() || isLoading}
                >
                  {isGeocoding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </Button>
              </div>
              {zipError && (
                <p className="text-sm text-destructive text-left">{zipError}</p>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Supporting local farmers and small businesses
        </p>
      </footer>
    </div>
  );
}
