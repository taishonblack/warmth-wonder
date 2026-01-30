import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";
import nearishLogo from "@/assets/nearish-logo.png";

// Hero images
import hero1 from "@/assets/hero-shopping-1.jpg";
import hero2 from "@/assets/hero-shopping-2.jpg";
import hero3 from "@/assets/hero-shopping-3.jpg";
import hero4 from "@/assets/hero-shopping-4.jpg";
import hero5 from "@/assets/hero-shopping-5.jpg";
import hero6 from "@/assets/hero-shopping-6.jpg";
import hero7 from "@/assets/hero-shopping-7.jpg";

const heroImages = [hero1, hero2, hero3, hero4, hero5, hero6, hero7];

export default function Landing() {
  const navigate = useNavigate();
  const { status, setAnchor, requestGps } = useLocation();
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isRequestingGps, setIsRequestingGps] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left - Hero Image Gallery */}
        <div className="w-1/2 xl:w-3/5 relative overflow-hidden">
          {/* Main rotating image */}
          {heroImages.map((img, i) => (
            <div
              key={i}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                activeImage === i ? "opacity-100" : "opacity-0"
              )}
            >
              <img
                src={img}
                alt={`People shopping at farmers market ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          
          {/* Thumbnail strip */}
          <div className="absolute bottom-8 left-8 right-8 flex gap-2">
            {heroImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "h-16 flex-1 rounded-lg overflow-hidden transition-all duration-300",
                  activeImage === i 
                    ? "ring-2 ring-primary scale-105 shadow-lg" 
                    : "opacity-60 hover:opacity-90"
                )}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          
          {/* Quote overlay */}
          <div className="absolute bottom-32 left-8 right-8 max-w-lg">
            <p className="text-2xl font-serif text-white drop-shadow-lg leading-relaxed">
              "Watching out for the little guy in a big world."
            </p>
          </div>
        </div>

        {/* Right - Content */}
        <div className="w-1/2 xl:w-2/5 flex flex-col justify-center px-12 xl:px-20 py-12">
          <div className="max-w-md mx-auto w-full space-y-8">
            {/* Logo & Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={nearishLogo} alt="Nearish" className="w-14 h-14 object-contain" />
                <h1 className="font-serif text-4xl font-bold text-primary">nearish</h1>
              </div>
              <p className="text-xl text-foreground/80 leading-relaxed">
                Discover farmers markets, farm stands, bakeries, and organic mom-and-pop shops near you.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                <span className="text-2xl">🥬</span>
                <p className="text-sm font-medium text-foreground mt-2">Farm Fresh</p>
                <p className="text-xs text-muted-foreground">Direct from local farmers</p>
              </div>
              <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                <span className="text-2xl">🥖</span>
                <p className="text-sm font-medium text-foreground mt-2">Artisan Baked</p>
                <p className="text-xs text-muted-foreground">Small-batch bakeries</p>
              </div>
              <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                <span className="text-2xl">🌱</span>
                <p className="text-sm font-medium text-foreground mt-2">Organic Options</p>
                <p className="text-xs text-muted-foreground">Health-conscious choices</p>
              </div>
              <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                <span className="text-2xl">❤️</span>
                <p className="text-sm font-medium text-foreground mt-2">Community First</p>
                <p className="text-xs text-muted-foreground">Support local businesses</p>
              </div>
            </div>

            {/* Location Input Section */}
            <div className="space-y-4 pt-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Where should we look?
              </p>

              {/* Use My Location Button */}
              <Button
                size="lg"
                className="w-full h-14 text-base font-medium gap-3 shadow-lg"
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
                    <ArrowRight className="w-4 h-4 ml-auto" />
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
                  <span className="bg-background px-3 text-muted-foreground">or enter zip code</span>
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
                  <p className="text-sm text-destructive">{zipError}</p>
                )}
              </form>
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center pt-4">
              Supporting local farmers and small businesses since 2024
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Hero image with overlay */}
        <div className="relative h-[45vh] min-h-[320px]">
          {heroImages.map((img, i) => (
            <div
              key={i}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                activeImage === i ? "opacity-100" : "opacity-0"
              )}
            >
              <img
                src={img}
                alt={`People shopping at farmers market ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          {/* Logo overlay */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <img src={nearishLogo} alt="Nearish" className="w-10 h-10 object-contain drop-shadow-lg" />
            <h1 className="font-serif text-2xl font-bold text-white drop-shadow-lg">nearish</h1>
          </div>
          
          {/* Image indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  activeImage === i 
                    ? "bg-white w-6" 
                    : "bg-white/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-foreground leading-tight">
              Find fresh, local food near you
            </h2>
            <p className="text-muted-foreground">
              Farmers markets, farm stands, bakeries & organic shops
            </p>
          </div>

          {/* Quick feature pills */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full">🥬 Farm Fresh</span>
            <span className="px-3 py-1.5 bg-secondary/20 text-secondary-foreground text-sm rounded-full">🥖 Bakeries</span>
            <span className="px-3 py-1.5 bg-accent/20 text-accent-foreground text-sm rounded-full">🌱 Organic</span>
            <span className="px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded-full">❤️ Local</span>
          </div>

          {/* Location Actions */}
          <div className="space-y-4 pt-2">
            {/* Use My Location Button */}
            <Button
              size="lg"
              className="w-full h-14 text-base font-medium gap-3 shadow-lg"
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
              <p className="text-sm text-destructive text-center">
                Location access was denied. Enter your zip code below.
              </p>
            )}

            {/* Divider */}
            <div className="relative">
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
                  className="h-12 text-base flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  className="h-12 px-5"
                  disabled={!zipCode.trim() || isLoading}
                >
                  {isGeocoding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Go"
                  )}
                </Button>
              </div>
              {zipError && (
                <p className="text-sm text-destructive">{zipError}</p>
              )}
            </form>
          </div>

          {/* Quote */}
          <p className="text-center text-sm text-muted-foreground italic pt-2">
            "Watching out for the little guy in a big world."
          </p>
        </div>
      </div>
    </div>
  );
}
