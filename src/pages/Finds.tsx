import { FindCard } from "@/components/FindCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useIsMobile } from "@/hooks/use-mobile";

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
  {
    id: "5",
    author: {
      name: "Olivia Martinez",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    images: [find5],
    caption: "Fresh lavender bundles from the herb stand! My apartment smells amazing now 💜 Also picked up some dried chamomile for tea.",
    marketName: "Brooklyn Flea",
    thanksCount: 45,
    timestamp: "3 days ago",
  },
  {
    id: "6",
    author: {
      name: "James Wilson",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    images: [find6, find1],
    caption: "Best sourdough in the city, hands down. The crust is perfectly crispy and the inside is so soft. Worth the early morning trip!",
    marketName: "Union Square Greenmarket",
    thanksCount: 78,
    timestamp: "3 days ago",
  },
  {
    id: "7",
    author: {
      name: "Aisha Patel",
      avatar: "https://i.pravatar.cc/150?img=16",
    },
    images: [find2],
    caption: "Local honey with honeycomb! The beekeeper explained how they harvest it sustainably. Supporting small apiaries feels so good 🐝",
    marketName: "Prospect Park Market",
    thanksCount: 93,
    timestamp: "4 days ago",
  },
  {
    id: "8",
    author: {
      name: "Tyler Brooks",
      avatar: "https://i.pravatar.cc/150?img=18",
    },
    images: [find3, find4],
    caption: "Rainbow carrots! Purple, orange, yellow, and white. The kids are actually excited to eat vegetables now 🥕",
    marketName: "Grand Army Plaza Market",
    thanksCount: 67,
    timestamp: "4 days ago",
  },
  {
    id: "9",
    author: {
      name: "Nina Kowalski",
      avatar: "https://i.pravatar.cc/150?img=20",
    },
    images: [find4],
    caption: "Found an incredible apple cider vendor! They press it fresh right there. Got a gallon for the week and some apple butter too 🍎",
    marketName: "Essex Market",
    thanksCount: 52,
    timestamp: "5 days ago",
  },
  {
    id: "10",
    author: {
      name: "Carlos Mendez",
      avatar: "https://i.pravatar.cc/150?img=22",
    },
    images: [find1, find5],
    caption: "Homemade tamales from the new vendor! Authentic family recipe passed down for generations. The verde sauce is 🔥",
    marketName: "Smorgasburg",
    thanksCount: 134,
    timestamp: "5 days ago",
  },
  {
    id: "11",
    author: {
      name: "Rachel Green",
      avatar: "https://i.pravatar.cc/150?img=25",
    },
    images: [find6],
    caption: "Fresh pasta made to order! Watched them roll it out and cut it right in front of me. Tonight's dinner is going to be special ✨",
    marketName: "Chelsea Market",
    thanksCount: 88,
    timestamp: "6 days ago",
  },
];

export default function Finds() {
  const isMobile = useIsMobile();

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

      {/* Feed */}
      <div className={isMobile 
        ? "px-4 py-4 space-y-4" 
        : "grid grid-cols-4 gap-4"
      }>
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
