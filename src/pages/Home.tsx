import { useState } from "react";
import { Plus } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MarketCard } from "@/components/MarketCard";
import { FindGridItem } from "@/components/FindGridItem";
import { SectionHeader } from "@/components/SectionHeader";
import { ShareFindModal } from "@/components/ShareFindModal";

// Import images
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
  { id: "1", name: "Union Square Greenmarket", image: market1, distance: "0.3 mi", isOpen: true },
  { id: "2", name: "Grand Army Plaza Market", image: market2, distance: "1.2 mi", isOpen: true },
  { id: "3", name: "Prospect Park Market", image: market3, distance: "2.1 mi", isOpen: false },
];

const openNowMarkets = [
  { id: "4", name: "Chelsea Market", image: market2, distance: "0.8 mi", isOpen: true },
  { id: "5", name: "Smorgasburg", image: market1, distance: "1.5 mi", isOpen: true },
  { id: "6", name: "Essex Market", image: market3, distance: "0.9 mi", isOpen: true },
];

const freshFinds = [
  { id: "1", image: find1, aspectRatio: "square" as const },
  { id: "2", image: find2, aspectRatio: "square" as const },
  { id: "3", image: find3, aspectRatio: "square" as const },
  { id: "4", image: find4, aspectRatio: "portrait" as const },
  { id: "5", image: find5, aspectRatio: "square" as const },
  { id: "6", image: find6, aspectRatio: "portrait" as const },
];

export default function Home() {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-4 pb-2 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-serif text-2xl font-bold text-primary">nearish</h1>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Share
          </button>
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
              />
            ))}
          </div>
        </section>

        {/* Open Now Section */}
        <section>
          <SectionHeader
            title="Open now"
            action={{ label: "See all", onClick: () => {} }}
            className="mb-3"
          />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {openNowMarkets.map((market) => (
              <MarketCard
                key={market.id}
                name={market.name}
                image={market.image}
                distance={market.distance}
                isOpen={market.isOpen}
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
            {freshFinds.map((find, index) => (
              <FindGridItem
                key={find.id}
                image={find.image}
                aspectRatio={index % 3 === 0 ? "portrait" : "square"}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Share Find Modal */}
      <ShareFindModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        isSubscribed={false}
      />
    </div>
  );
}
