import { FindCard } from "@/components/FindCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFinds } from "@/hooks/useFinds";
import { Loader2 } from "lucide-react";

// Import images for fallback/mock data
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";
import find5 from "@/assets/find-5.jpg";
import find6 from "@/assets/find-6.jpg";

const mockFinds = [
  {
    id: "mock-1",
    author: {
      name: "Sarah Chen",
      avatar: "https://i.pravatar.cc/150?img=1",
      userId: "mock-user-1",
    },
    images: [find1],
    caption: "Found the most beautiful farm-fresh eggs at Union Square today! The yolks are so vibrant and orange. Perfect for weekend breakfast 🍳",
    marketName: "Union Square Greenmarket",
    thanksCount: 24,
    timestamp: "2 hours ago",
    userHasThanked: false,
  },
  {
    id: "mock-2",
    author: {
      name: "Marcus Rivera",
      avatar: "https://i.pravatar.cc/150?img=3",
      userId: "mock-user-2",
    },
    images: [find2, find6],
    caption: "These sunflowers just made my whole day! The flower vendor at Grand Army is always so lovely. Got fresh herbs too!",
    marketName: "Grand Army Plaza Market",
    thanksCount: 56,
    timestamp: "5 hours ago",
    userHasThanked: false,
  },
  {
    id: "mock-3",
    author: {
      name: "Emma Thompson",
      avatar: "https://i.pravatar.cc/150?img=5",
      userId: "mock-user-3",
    },
    images: [find3],
    caption: "Artisan cheese heaven 🧀 This aged gouda from the local dairy is incredible. They've been making it for three generations!",
    marketName: "Chelsea Market",
    thanksCount: 89,
    timestamp: "1 day ago",
    userHasThanked: false,
  },
  {
    id: "mock-4",
    author: {
      name: "David Kim",
      avatar: "https://i.pravatar.cc/150?img=8",
      userId: "mock-user-4",
    },
    images: [find4, find5],
    caption: "Peak strawberry season has arrived! These are so sweet you don't even need to add sugar. Also grabbed some homemade preserves.",
    marketName: "Smorgasburg",
    thanksCount: 112,
    timestamp: "2 days ago",
    userHasThanked: false,
  },
];

export default function Finds() {
  const isMobile = useIsMobile();
  const { finds, loading, toggleThanks } = useFinds();

  // Use real finds if available, otherwise show mock data
  const displayFinds = finds.length > 0 ? finds : mockFinds;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - only show on mobile, desktop uses top nav */}
      {isMobile && (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 px-4 border-b border-border">
          <h1 className="font-serif text-2xl font-bold text-primary">Finds</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover what your community is finding
          </p>
        </header>
      )}

      {/* Desktop header */}
      {!isMobile && (
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-primary">Finds</h1>
          <p className="text-muted-foreground mt-1">
            Discover what your community is finding
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Feed */}
      {!loading && (
        <div className={isMobile 
          ? "px-4 py-4 space-y-4" 
          : "grid grid-cols-4 gap-4"
        }>
          {displayFinds.map((find) => (
            <FindCard
              key={find.id}
              id={find.id}
              author={find.author}
              images={find.images}
              caption={find.caption}
              marketName={find.marketName}
              thanksCount={find.thanksCount}
              timestamp={find.timestamp}
              userHasThanked={find.userHasThanked}
              onToggleThanks={toggleThanks}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && finds.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Showing sample finds. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
