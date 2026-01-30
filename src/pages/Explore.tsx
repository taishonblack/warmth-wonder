import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, Map } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MarketCarousel } from "@/components/MarketCarousel";
import { MasonryGrid } from "@/components/MasonryGrid";
import { MasonryFindItem } from "@/components/MasonryFindItem";
import { SectionHeader } from "@/components/SectionHeader";
import { FindDetailPopup } from "@/components/FindDetailPopup";
import { MarketDetailPopup } from "@/components/MarketDetailPopup";
import { DietFilterBar, DietFilters } from "@/components/DietFilterBar";
import { CategoryFilterBar, CategoryFilters } from "@/components/CategoryFilterBar";
import { ClaimMarketModal } from "@/components/ClaimMarketModal";
import { LocationControl } from "@/components/LocationControl";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCombinedMarkets, calculateDistance, Market } from "@/hooks/useMarkets";
import { useFinds } from "@/hooks/useFinds";
import { useMarketPhotos } from "@/hooks/useMarketPhoto";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

// Import images
import nearishLogo from "@/assets/nearish-logo.png";
import market1 from "@/assets/market-1.jpg";
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";
import find5 from "@/assets/find-5.jpg";
import find6 from "@/assets/find-6.jpg";

// Near = 0-5 miles, Further = 5+ miles (hard-coded)
const NEAR_RADIUS_MILES = 5;
const FURTHER_RADIUS_MILES = 20;
const FURTHER_RADIUS_METERS = FURTHER_RADIUS_MILES * 1609;

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
  distanceMiles?: number;
}

export default function Explore() {
  const navigate = useNavigate();
  const { status, anchor, setAnchor, requestGps } = useLocation();
  const [selectedFind, setSelectedFind] = useState<typeof mockFinds[0] & { posterId?: string } | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<HomeMarket | null>(null);
  const [claimingMarket, setClaimingMarket] = useState<Market | null>(null);
  const [dietFilters, setDietFilters] = useState<DietFilters>({
    organic: false,
    veganFriendly: false,
    glutenFree: false,
  });
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>({
    farmers_market: false,
    farm_stand: false,
    bakery: false,
    organic_grocery: false,
  });
  
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const isMobile = useIsMobile();
  const { location: locationInfo, isLoading: locationLoading } = useReverseGeocode(
    anchor?.lat ?? null, 
    anchor?.lng ?? null
  );

  // Redirect to landing if no location anchor
  useEffect(() => {
    if (status === "unknown") {
      navigate("/");
    }
  }, [status, navigate]);

  // Fetch real market data with 20mi radius (we'll split into Near/Further client-side)
  const { data: markets = [], isLoading: marketsLoading } = useCombinedMarkets(
    anchor?.lat ?? null,
    anchor?.lng ?? null,
    undefined,
    FURTHER_RADIUS_METERS,
    dietFilters,
    categoryFilters
  );
  
  // Fetch real finds
  const { finds } = useFinds();
  
  // Fetch real photos for markets
  const photoMap = useMarketPhotos(
    markets.map((m) => ({
      id: m.id,
      name: m.name,
      address: m.address,
      lat: m.lat,
      lng: m.lng,
      photo_url: m.photo_url,
      photo_reference: m.photo_reference,
    }))
  );
  
  // Split markets into Near (≤5mi) and Further (>5mi)
  const { nearMarkets, furtherMarkets } = useMemo(() => {
    if (!anchor) {
      return { nearMarkets: [], furtherMarkets: [] };
    }
    
    const marketsWithDistance = markets.map((m) => ({
      ...m,
      distanceMiles: calculateDistance(anchor.lat, anchor.lng, m.lat, m.lng),
      image: photoMap.get(m.id) || m.photo_url || market1,
    }));
    
    const sorted = marketsWithDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);
    
    return {
      nearMarkets: sorted.filter((m) => m.distanceMiles <= NEAR_RADIUS_MILES).slice(0, 15),
      furtherMarkets: sorted.filter((m) => m.distanceMiles > NEAR_RADIUS_MILES).slice(0, 15),
    };
  }, [markets, anchor, photoMap]);
  
  // Use real finds or fallback to mocks
  const displayFinds = finds.length > 0 
    ? finds.slice(0, 6).map((f) => ({
        id: f.id,
        image: f.images[0] || find1,
        posterName: f.author.name,
        posterAvatar: f.author.avatar,
        posterId: f.author.userId,
        caption: f.caption,
        marketName: f.marketName,
        thanksCount: f.thanksCount,
        timestamp: f.timestamp,
      }))
    : mockFinds.map(f => ({ ...f, posterId: undefined }));

  const handleLocationChange = (lat: number, lng: number, source: "zip" | "gps", zipCode?: string) => {
    setAnchor(lat, lng, source, zipCode);
    if (user && zipCode) {
      updateProfile({ zip_code: zipCode });
    }
  };

  const handleUseGps = () => {
    requestGps();
  };

  const handleMarketClick = (market: HomeMarket) => {
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

  const handleFindClick = (find: typeof displayFinds[0]) => {
    setSelectedFind({
      ...find,
      posterId: find.posterId,
    });
  };

  const handlePosterClick = (userId?: string) => {
    if (userId) {
      navigate(`/u/${userId}`);
    }
  };

  const masonryColumns = isMobile ? 2 : 4;

  // Show loading while waiting for location
  if (status === "resolving") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Finding your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - only show on mobile */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-4 pb-2 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={nearishLogo} alt="Nearish logo" className="w-8 h-8 object-contain" />
              <h1 className="font-serif text-2xl font-bold text-primary">nearish</h1>
            </div>
            {/* Location indicator */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {locationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Locating...</span>
                </>
              ) : anchor ? (
                <>
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {anchor.source === "zip" && anchor.zipCode
                      ? anchor.zipCode
                      : locationInfo?.displayName || "GPS"}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <SearchBar />
        </header>
      )}

      {/* Content */}
      <div className={isMobile ? "px-4 py-4 space-y-6" : "space-y-6"}>
        {/* All Filters - Single Row */}
        <section className={isMobile ? "-mx-4 px-4" : ""}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <CategoryFilterBar filters={categoryFilters} onChange={setCategoryFilters} />
            <div className="w-px bg-border shrink-0" />
            <DietFilterBar filters={dietFilters} onChange={setDietFilters} />
          </div>
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
            extra={
              <div className="flex items-center gap-2">
                {/* Location badge */}
                {anchor && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {anchor.source === "zip" && anchor.zipCode
                      ? `📍 ${anchor.zipCode}`
                      : "📍 GPS"}
                  </span>
                )}
                <LocationControl
                  onLocationChange={handleLocationChange}
                  onUseGps={handleUseGps}
                  onSaveZipCode={user ? (zipCode) => updateProfile({ zip_code: zipCode }) : undefined}
                  isLoading={false}
                  currentSource={anchor?.source ?? null}
                  savedZipCode={profile?.zip_code}
                />
              </div>
            }
            className="mb-3"
          />
          {nearMarkets.length > 0 ? (
            <MarketCarousel
              markets={nearMarkets}
              onMarketClick={handleMarketClick}
              showAllLink="/map?filter=nearby"
            />
          ) : marketsLoading ? null : (
            <div className="bg-card/50 rounded-xl p-6 border border-border/50 text-center space-y-3">
              <p className="text-muted-foreground">
                No markets within 5 miles.
              </p>
              <Button
                variant="secondary"
                onClick={() => navigate("/map")}
                className="gap-2"
              >
                <Map className="w-4 h-4" />
                Open Map to explore further
              </Button>
            </div>
          )}
        </section>

        {/* Further Section */}
        {furtherMarkets.length > 0 && (
          <section>
            <SectionHeader
              title="Further (5+ mi)"
              action={{ label: "See all", onClick: () => navigate("/map?filter=further") }}
              className="mb-3"
            />
            <MarketCarousel
              markets={furtherMarkets}
              onMarketClick={handleMarketClick}
              showAllLink="/map?filter=further"
            />
          </section>
        )}

        {/* Fresh Finds - Masonry Grid */}
        <section>
          <SectionHeader
            title="Fresh Finds"
            action={{ label: "See all", onClick: () => navigate("/finds") }}
            className="mb-3"
          />
          <MasonryGrid columns={masonryColumns} gap={12}>
            {displayFinds.map((find) => (
              <MasonryFindItem
                key={find.id}
                id={find.id}
                image={find.image}
                posterName={find.posterName}
                posterAvatar={find.posterAvatar}
                posterUserId={find.posterId}
                caption={find.caption}
                marketName={find.marketName}
                thanksCount={find.thanksCount}
                onClick={() => handleFindClick(find)}
                onPosterClick={() => handlePosterClick(find.posterId)}
              />
            ))}
          </MasonryGrid>
        </section>
      </div>

      {/* Find Detail Popup */}
      <FindDetailPopup
        isOpen={!!selectedFind}
        onClose={() => setSelectedFind(null)}
        find={selectedFind}
      />

      {/* Market Detail Popup */}
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

            <div className="p-5 space-y-4 overflow-y-auto max-h-[50vh]">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedMarket.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedMarket.address}, {selectedMarket.city}
                </p>
                {selectedMarket.distanceMiles && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMarket.distanceMiles.toFixed(1)} miles away
                  </p>
                )}
              </div>

              {/* Diet badges */}
              <div className="flex flex-wrap gap-2">
                {selectedMarket.organic && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    Organic
                  </span>
                )}
                {selectedMarket.vegan_friendly && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary/20 text-secondary-foreground">
                    Vegan-friendly
                  </span>
                )}
                {selectedMarket.gluten_free && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent/20 text-accent-foreground">
                    Gluten-free
                  </span>
                )}
              </div>

              {selectedMarket.hours && (
                <div>
                  <p className="text-sm font-medium text-foreground">Hours</p>
                  <p className="text-sm text-muted-foreground">{selectedMarket.hours}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedMarket.lat},${selectedMarket.lng}`;
                    window.open(url, "_blank");
                  }}
                >
                  Get Directions
                </Button>
                <Button className="flex-1" onClick={handleClaimMarket}>
                  Claim This Market
                </Button>
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
        onClaimed={() => setClaimingMarket(null)}
      />
    </div>
  );
}
