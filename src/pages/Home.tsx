import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MarketCarousel } from "@/components/MarketCarousel";
import { FindGridItem } from "@/components/FindGridItem";
import { SectionHeader } from "@/components/SectionHeader";
import { FindDetailPopup } from "@/components/FindDetailPopup";
import { MarketDetailPopup } from "@/components/MarketDetailPopup";
import { DietFilterBar, DietFilters } from "@/components/DietFilterBar";
import { ClaimMarketModal } from "@/components/ClaimMarketModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProximitySettings } from "@/hooks/useProximitySettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCombinedMarkets, calculateDistance, Market } from "@/hooks/useMarkets";
import { useFinds } from "@/hooks/useFinds";

// Import images
import nearishLogo from "@/assets/nearish-logo.png";
import market1 from "@/assets/market-1.jpg";
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";
import find5 from "@/assets/find-5.jpg";
import find6 from "@/assets/find-6.jpg";

// Fallback mock finds for empty states
const mockFinds = [
  { 
    id: "mock-1", 
    image: find1, 
    posterName: "Sarah Chen",
    posterAvatar: "https://i.pravatar.cc/150?img=1",
    caption: "Just found the most amazing heirloom tomatoes! The colors are incredible.",
    marketName: "Union Square Greenmarket",
    thanksCount: 24,
    timestamp: "2 hours ago"
  },
  { 
    id: "mock-2", 
    image: find2, 
    posterName: "Marcus Rivera",
    posterAvatar: "https://i.pravatar.cc/150?img=3",
    caption: "Fresh sourdough loaves just out of the oven. Get here early!",
    marketName: "Grand Army Plaza Market",
    thanksCount: 18,
    timestamp: "3 hours ago"
  },
  { 
    id: "mock-3", 
    image: find3, 
    posterName: "Emily Watson",
    posterAvatar: "https://i.pravatar.cc/150?img=5",
    caption: "Local wildflower honey - the beekeeper is so passionate about their craft.",
    marketName: "Prospect Park Market",
    thanksCount: 31,
    timestamp: "4 hours ago"
  },
  { 
    id: "mock-4", 
    image: find4, 
    posterName: "James Kim",
    posterAvatar: "https://i.pravatar.cc/150?img=8",
    caption: "These organic strawberries are perfect for the weekend brunch!",
    marketName: "Chelsea Market",
    thanksCount: 42,
    timestamp: "5 hours ago"
  },
  { 
    id: "mock-5", 
    image: find5, 
    posterName: "Olivia Brown",
    posterAvatar: "https://i.pravatar.cc/150?img=9",
    caption: "Beautiful artisan cheese selection today. Had to share!",
    marketName: "Smorgasburg",
    thanksCount: 27,
    timestamp: "6 hours ago"
  },
  { 
    id: "mock-6", 
    image: find6, 
    posterName: "David Park",
    posterAvatar: "https://i.pravatar.cc/150?img=11",
    caption: "Fresh herbs galore - rosemary, thyme, and lavender bundles.",
    marketName: "Essex Market",
    thanksCount: 19,
    timestamp: "7 hours ago"
  },
];

interface HomeMarket extends Market {
  image: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [selectedFind, setSelectedFind] = useState<typeof mockFinds[0] | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<HomeMarket | null>(null);
  const [claimingMarket, setClaimingMarket] = useState<Market | null>(null);
  const [dietFilters, setDietFilters] = useState<DietFilters>({
    organic: false,
    veganFriendly: false,
    glutenFree: false,
  });
  
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();
  const { radius } = useProximitySettings();
  const isMobile = useIsMobile();
  
  // Fetch real market data
  const { data: markets = [], isLoading: marketsLoading } = useCombinedMarkets(
    latitude,
    longitude,
    undefined,
    radius * 1609, // Convert miles to meters
    dietFilters
  );
  
  // Fetch real finds
  const { finds } = useFinds();
  
  // Split markets into nearby and further out
  const { nearbyMarkets, furtherOutMarkets } = useMemo(() => {
    if (!latitude || !longitude) {
      return { nearbyMarkets: markets.slice(0, 6), furtherOutMarkets: [] };
    }
    
    const marketsWithDistance = markets.map((m) => ({
      ...m,
      distanceMiles: calculateDistance(latitude, longitude, m.lat, m.lng),
      image: market1, // Default image for now
    }));
    
    const sorted = marketsWithDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);
    
    return {
      nearbyMarkets: sorted.filter((m) => m.distanceMiles <= 5).slice(0, 15),
      furtherOutMarkets: sorted.filter((m) => m.distanceMiles > 5 && m.distanceMiles <= radius).slice(0, 15),
    };
  }, [markets, latitude, longitude, radius]);
  
  // Use real finds or fallback to mocks
  const displayFinds = finds.length > 0 
    ? finds.slice(0, 6).map((f) => ({
        id: f.id,
        image: f.images[0] || find1,
        posterName: f.author.name,
        posterAvatar: f.author.avatar,
        caption: f.caption,
        marketName: f.marketName,
        thanksCount: f.thanksCount,
        timestamp: f.timestamp,
      }))
    : mockFinds;

  const handleMarketClick = (market: HomeMarket) => {
    // Navigate to market detail page if it's a DB market, otherwise show popup
    if (market.source === "db") {
      navigate(`/market/${market.id}`);
    } else {
      setSelectedMarket(market);
    }
  };

  const handleClaimMarket = () => {
    if (selectedMarket) {
      setClaimingMarket(selectedMarket);
      setSelectedMarket(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - only show on mobile, desktop uses sidebar */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-4 pb-2 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={nearishLogo} alt="Nearish logo" className="w-8 h-8 object-contain" />
              <h1 className="font-serif text-2xl font-bold text-primary">nearish</h1>
            </div>
            {/* Geolocation indicator */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {geoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : geoError ? (
                <>
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-xs">{geoError}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span className="text-xs">Within {radius} mi</span>
                </>
              )}
            </div>
          </div>
          <SearchBar />
        </header>
      )}

      {/* Content */}
      <div className={isMobile ? "px-4 py-4 space-y-6" : "space-y-6"}>
        {/* Diet Filters */}
        <section className={isMobile ? "-mx-4 px-4" : ""}>
          <DietFilterBar filters={dietFilters} onChange={setDietFilters} />
        </section>

        {/* Loading State */}
        {marketsLoading && markets.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Finding markets near you...</span>
          </div>
        )}

        {/* Near You Section */}
        <section>
          <SectionHeader
            title="Near you"
            action={{ label: "See all", onClick: () => navigate("/map?filter=nearby") }}
            className="mb-3"
          />
          {nearbyMarkets.length > 0 ? (
            <MarketCarousel
              markets={nearbyMarkets}
              onMarketClick={handleMarketClick}
              showAllLink="/map?filter=nearby"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              No markets found nearby. Try expanding your search radius in settings.
            </p>
          )}
        </section>

        {/* Further Out Section */}
        {furtherOutMarkets.length > 0 && (
          <section>
            <SectionHeader
              title={`Further out (5+ mi)`}
              action={{ label: "See all", onClick: () => navigate("/map?filter=further") }}
              className="mb-3"
            />
            <MarketCarousel
              markets={furtherOutMarkets}
              onMarketClick={handleMarketClick}
              showAllLink="/map?filter=further"
            />
          </section>
        )}

        {/* Fresh Finds Grid */}
        <section>
          <SectionHeader
            title="Fresh Finds"
            action={{ label: "See all", onClick: () => {} }}
            className="mb-3"
          />
          <div className={isMobile 
            ? "grid grid-cols-2 gap-3"
            : "grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          }>
            {displayFinds.map((find) => (
              <FindGridItem
                key={find.id}
                image={find.image}
                posterName={find.posterName}
                posterAvatar={find.posterAvatar}
                caption={find.caption}
                marketName={find.marketName}
                thanksCount={find.thanksCount}
                aspectRatio="square"
                onClick={() => setSelectedFind(find)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Find Detail Popup */}
      <FindDetailPopup
        isOpen={!!selectedFind}
        onClose={() => setSelectedFind(null)}
        find={selectedFind}
      />

      {/* Market Detail Popup - Enhanced with claim option */}
      {selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedMarket(null)}
          />
          <div className="relative w-full max-w-lg bg-card rounded-t-3xl animate-slide-up overflow-hidden max-h-[85vh]">
            <button
              onClick={() => setSelectedMarket(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>

            <div className="relative aspect-video">
              <img
                src={selectedMarket.image}
                alt={selectedMarket.name}
                className="w-full h-full object-cover"
              />
              {selectedMarket.source === "osm" && (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                  Community Verified
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedMarket.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedMarket.address}, {selectedMarket.city}
                </p>
              </div>

              {/* Diet badges */}
              <div className="flex flex-wrap gap-2">
                {selectedMarket.organic && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    🌿 Organic
                  </span>
                )}
                {selectedMarket.vegan_friendly && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    💚 Vegan-Friendly
                  </span>
                )}
                {selectedMarket.gluten_free && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    🌾 Gluten-Free
                  </span>
                )}
              </div>

              {selectedMarket.hours && (
                <p className="text-sm text-muted-foreground">
                  🕐 {selectedMarket.hours}
                </p>
              )}

              {selectedMarket.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedMarket.description}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                {selectedMarket.source === "osm" && !selectedMarket.claimed_by && (
                  <button
                    onClick={handleClaimMarket}
                    className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/90 transition-colors"
                  >
                    Claim & Verify
                  </button>
                )}
                <button
                  onClick={() => {
                    if (selectedMarket.source === "db") {
                      navigate(`/market/${selectedMarket.id}`);
                    } else {
                      navigate(`/map?market=${selectedMarket.id}`);
                    }
                    setSelectedMarket(null);
                  }}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  {selectedMarket.source === "db" ? "View Details" : "View on Map"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Market Modal */}
      <ClaimMarketModal
        isOpen={!!claimingMarket}
        onClose={() => setClaimingMarket(null)}
        market={claimingMarket}
        onClaimed={() => {
          setClaimingMarket(null);
        }}
      />
    </div>
  );
}
