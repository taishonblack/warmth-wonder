import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MarketCard } from "@/components/MarketCard";
import { FindGridItem } from "@/components/FindGridItem";
import { SectionHeader } from "@/components/SectionHeader";
import { FindDetailPopup } from "@/components/FindDetailPopup";
import { MarketDetailPopup } from "@/components/MarketDetailPopup";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProximitySettings } from "@/hooks/useProximitySettings";

// Import images
import nearishLogo from "@/assets/nearish-logo.png";
import market1 from "@/assets/market-1.jpg";
import market2 from "@/assets/market-2.jpg";
import market3 from "@/assets/market-3.jpg";
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";
import find5 from "@/assets/find-5.jpg";
import find6 from "@/assets/find-6.jpg";

const nearbyMarkets = [
  { id: "1", name: "Union Square Greenmarket", image: market1, distance: "0.3 mi", isOpen: true, address: "E 17th St & Union Square W, New York, NY", hours: "Mon, Wed, Fri, Sat: 8am - 6pm", description: "NYC's largest farmers market featuring over 140 regional farmers and fishermen." },
  { id: "2", name: "Grand Army Plaza Market", image: market2, distance: "1.2 mi", isOpen: true, address: "Grand Army Plaza, Brooklyn, NY", hours: "Saturdays: 8am - 4pm", description: "Brooklyn's premier greenmarket with organic produce and artisan goods." },
  { id: "3", name: "Prospect Park Market", image: market3, distance: "2.1 mi", isOpen: false, address: "Prospect Park West, Brooklyn, NY", hours: "Sundays: 9am - 4pm", description: "Family-friendly market with local farms, live music, and prepared foods." },
];

const furtherOutMarkets = [
  { id: "4", name: "Westchester Farm Market", image: market2, distance: "22 mi", isOpen: true, address: "123 Farm Road, Westchester, NY", hours: "Sat & Sun: 9am - 5pm", description: "Hudson Valley farms bringing fresh seasonal produce and dairy." },
  { id: "5", name: "Hudson Valley Harvest", image: market1, distance: "25 mi", isOpen: true, address: "456 Valley Lane, Hudson, NY", hours: "Saturdays: 8am - 3pm", description: "Specializing in heirloom vegetables, pasture-raised meats, and artisan cheeses." },
  { id: "6", name: "Long Island Organic Market", image: market3, distance: "28 mi", isOpen: true, address: "789 Organic Way, Long Island, NY", hours: "Sundays: 10am - 4pm", description: "100% certified organic produce from Long Island family farms." },
];

const freshFinds = [
  { 
    id: "1", 
    image: find1, 
    posterName: "Sarah Chen",
    posterAvatar: "https://i.pravatar.cc/150?img=1",
    caption: "Just found the most amazing heirloom tomatoes! The colors are incredible.",
    marketName: "Union Square Greenmarket",
    thanksCount: 24,
    timestamp: "2 hours ago"
  },
  { 
    id: "2", 
    image: find2, 
    posterName: "Marcus Rivera",
    posterAvatar: "https://i.pravatar.cc/150?img=3",
    caption: "Fresh sourdough loaves just out of the oven. Get here early!",
    marketName: "Grand Army Plaza Market",
    thanksCount: 18,
    timestamp: "3 hours ago"
  },
  { 
    id: "3", 
    image: find3, 
    posterName: "Emily Watson",
    posterAvatar: "https://i.pravatar.cc/150?img=5",
    caption: "Local wildflower honey - the beekeeper is so passionate about their craft.",
    marketName: "Prospect Park Market",
    thanksCount: 31,
    timestamp: "4 hours ago"
  },
  { 
    id: "4", 
    image: find4, 
    posterName: "James Kim",
    posterAvatar: "https://i.pravatar.cc/150?img=8",
    caption: "These organic strawberries are perfect for the weekend brunch!",
    marketName: "Chelsea Market",
    thanksCount: 42,
    timestamp: "5 hours ago"
  },
  { 
    id: "5", 
    image: find5, 
    posterName: "Olivia Brown",
    posterAvatar: "https://i.pravatar.cc/150?img=9",
    caption: "Beautiful artisan cheese selection today. Had to share!",
    marketName: "Smorgasburg",
    thanksCount: 27,
    timestamp: "6 hours ago"
  },
  { 
    id: "6", 
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
  const [selectedFind, setSelectedFind] = useState<typeof freshFinds[0] | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<typeof nearbyMarkets[0] | null>(null);
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();
  const { radius } = useProximitySettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* Near You Section */}
        <section>
          <SectionHeader
            title="Near you"
            action={{ label: "See all", onClick: () => {} }}
            className="mb-3"
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {nearbyMarkets.map((market) => (
              <MarketCard
                key={market.id}
                name={market.name}
                image={market.image}
                distance={market.distance}
                isOpen={market.isOpen}
                onClick={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        </section>

        {/* Further Out Section */}
        <section>
          <SectionHeader
            title={`Further out (${radius}+ mi)`}
            action={{ label: "See all", onClick: () => {} }}
            className="mb-3"
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {furtherOutMarkets.map((market) => (
              <MarketCard
                key={market.id}
                name={market.name}
                image={market.image}
                distance={market.distance}
                isOpen={market.isOpen}
                onClick={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        </section>

        {/* Fresh Finds Grid */}
        <section>
          <SectionHeader
            title="Fresh Finds"
            action={{ label: "See all", onClick: () => {} }}
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-3">
            {freshFinds.map((find) => (
              <FindGridItem
                key={find.id}
                image={find.image}
                posterName={find.posterName}
                posterAvatar={find.posterAvatar}
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

      {/* Market Detail Popup */}
      <MarketDetailPopup
        isOpen={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
        market={selectedMarket}
      />
    </div>
  );
}
