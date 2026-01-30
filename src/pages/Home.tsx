import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MarketCarousel } from "@/components/MarketCarousel";
import { MasonryGrid } from "@/components/MasonryGrid";
import { MasonryFindItem } from "@/components/MasonryFindItem";
import { SectionHeader } from "@/components/SectionHeader";
import { FindDetailPopup } from "@/components/FindDetailPopup";
import { MarketDetailPopup } from "@/components/MarketDetailPopup";
import { DietFilterBar } from "@/components/DietFilterBar";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { ClaimMarketModal } from "@/components/ClaimMarketModal";
import { LocationControl } from "@/components/LocationControl";
import { useMarketContext, DisplayMarket } from "@/contexts/MarketContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Market } from "@/hooks/useMarkets";
import { useFinds } from "@/hooks/useFinds";
import { useMarketPhotos } from "@/hooks/useMarketPhoto";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

// Import images
import nearishLogo from "@/assets/nearish-logo.png";
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

export default function Home() {
  const navigate = useNavigate();
  const [selectedFind, setSelectedFind] = useState<typeof mockFinds[0] & { posterId?: string } | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<DisplayMarket | null>(null);
  const [claimingMarket, setClaimingMarket] = useState<Market | null>(null);
  
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  // Use shared market context
  const {
    latitude,
    longitude,
    geoLoading,
    geoError,
    locationSource,
    activeZipCode,
    setManualLocation,
    refreshLocation,
    canonicalMarkets,
    nearbyMarkets,
    furtherMarkets,
    isLoading,
    dietFilters,
    setDietFilters,
    categoryFilters,
    setCategoryFilters,
    setPhotoMap,
  } = useMarketContext();
  
  const isMobile = useIsMobile();
  const { location: locationInfo, isLoading: locationLoading } = useReverseGeocode(latitude, longitude);

  // Load saved zip code location on mount
  useEffect(() => {
    const loadSavedZipLocation = async () => {
      if (profile?.zip_code && !latitude && !longitude) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode?type=forward&postalcode=${profile.zip_code}&country=US`,
            {
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );
          if (!response.ok) throw new Error('Geocoding failed');
          const data = await response.json();
          if (data?.[0]) {
            setManualLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), "zip");
          }
        } catch (err) {
          console.error("Failed to geocode saved zip:", err);
        }
      }
    };
    
    loadSavedZipLocation();
  }, [profile?.zip_code]);

  const handleLocationChange = (lat: number, lng: number, source: "zip" | "gps", zipCode?: string) => {
    setManualLocation(lat, lng, source, zipCode);
  };

  const handleSaveZipCode = async (zipCode: string) => {
    if (user) {
      await updateProfile({ zip_code: zipCode });
    }
  };

  const handleUseGps = () => {
    refreshLocation();
  };
  
  // Fetch real finds
  const { finds } = useFinds();
  
  // Fetch real photos for markets (including photo_reference for Google markets)
  const photoMap = useMarketPhotos(
    canonicalMarkets.map((m) => ({
      id: m.id,
      name: m.name,
      address: m.address,
      lat: m.lat,
      lng: m.lng,
      photo_url: m.photo_url,
      photo_reference: m.photo_reference,
    }))
  );
  
  // Sync photo map to context so Map page can use same images
  useEffect(() => {
    if (photoMap.size > 0) {
      setPhotoMap(photoMap);
    }
  }, [photoMap, setPhotoMap]);
  
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

  const handleMarketClick = (market: DisplayMarket) => {
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
              {geoLoading || locationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Locating...</span>
                </>
              ) : geoError ? (
                <>
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-xs">{geoError}</span>
                </>
              ) : locationInfo ? (
                <>
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {locationInfo.displayName}
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span className="text-xs">Your area</span>
                </>
              )}
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

        {/* Loading State - show during initial load OR when location changes */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Finding markets near you...</span>
          </div>
        )}

        {/* Near You Section - only show when data is ready and matches current location */}
        {!isLoading && (
          <section>
            <SectionHeader
              title="Near you"
              action={{ label: "See all", onClick: () => navigate("/map?filter=nearby") }}
              extra={
                <div className="flex items-center gap-2">
                  {/* Location indicator */}
                  {locationSource && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {locationSource === "zip" && activeZipCode
                        ? `📍 ${activeZipCode}`
                        : locationSource === "gps"
                        ? "📍 GPS"
                        : "📍 Manual"}
                    </span>
                  )}
                  <LocationControl
                    onLocationChange={handleLocationChange}
                    onUseGps={handleUseGps}
                    onSaveZipCode={user ? handleSaveZipCode : undefined}
                    isLoading={geoLoading}
                    currentSource={locationSource === "default" ? null : locationSource}
                    savedZipCode={profile?.zip_code}
                    currentZipCode={activeZipCode ?? undefined}
                  />
                </div>
              }
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
                No markets found within 5 miles. Check the "Further" section below or adjust your location.
              </p>
            )}
          </section>
        )}

        {/* Further Out Section - only show when data is ready */}
        {!isLoading && furtherMarkets.length > 0 && (
          <section>
            <SectionHeader
              title={`Further out (5+ mi)`}
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

      {/* Market Detail Popup - Enhanced with claim option */}
      <MarketDetailPopup
        isOpen={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
        market={selectedMarket ? {
          id: selectedMarket.id,
          name: selectedMarket.name,
          image: selectedMarket.image,
          distance: selectedMarket.distanceMiles ? `${selectedMarket.distanceMiles.toFixed(1)} mi` : undefined,
          isOpen: selectedMarket.is_open,
          address: `${selectedMarket.address}, ${selectedMarket.city}`,
          hours: selectedMarket.hours ?? undefined,
          description: selectedMarket.description ?? undefined,
        } : null}
        onNavigate={selectedMarket ? () => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedMarket.lat},${selectedMarket.lng}`, '_blank');
        } : undefined}
      />

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
