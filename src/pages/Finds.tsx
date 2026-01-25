import { FindCard } from "@/components/FindCard";
import { SectionHeader } from "@/components/SectionHeader";

// Import images
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";
import find5 from "@/assets/find-5.jpg";
import find6 from "@/assets/find-6.jpg";

const finds = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    images: [find1],
    caption: "Found the most beautiful farm-fresh eggs at Union Square today! The yolks are so vibrant and orange. Perfect for weekend breakfast 🍳",
    marketName: "Union Square Greenmarket",
    thanksCount: 24,
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    author: {
      name: "Marcus Rivera",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    images: [find2, find6],
    caption: "These sunflowers just made my whole day! The flower vendor at Grand Army is always so lovely. Got fresh herbs too!",
    marketName: "Grand Army Plaza Market",
    thanksCount: 56,
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    author: {
      name: "Emma Thompson",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    images: [find3],
    caption: "Artisan cheese heaven 🧀 This aged gouda from the local dairy is incredible. They've been making it for three generations!",
    marketName: "Chelsea Market",
    thanksCount: 89,
    timestamp: "1 day ago",
  },
  {
    id: "4",
    author: {
      name: "David Kim",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    images: [find4, find5],
    caption: "Peak strawberry season has arrived! These are so sweet you don't even need to add sugar. Also grabbed some homemade preserves.",
    marketName: "Smorgasburg",
    thanksCount: 112,
    timestamp: "2 days ago",
  },
];

export default function Finds() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 px-4 border-b border-border">
        <h1 className="font-serif text-2xl font-bold text-primary">Finds</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Discover what your community is finding
        </p>
      </header>

      {/* Feed */}
      <div className="px-4 py-4 space-y-4">
        {finds.map((find) => (
          <FindCard
            key={find.id}
            author={find.author}
            images={find.images}
            caption={find.caption}
            marketName={find.marketName}
            thanksCount={find.thanksCount}
            timestamp={find.timestamp}
          />
        ))}
      </div>
    </div>
  );
}
