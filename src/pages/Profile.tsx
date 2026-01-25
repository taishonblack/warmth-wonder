import { Settings, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProximitySettings, ProximityRadius } from "@/hooks/useProximitySettings";

// Import images
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";

const userFinds = [
  { id: "1", image: find1 },
  { id: "2", image: find2 },
  { id: "3", image: find3 },
  { id: "4", image: find4 },
];

const badges = [
  { id: "1", emoji: "🌱", label: "Local Regular", description: "Visited 10+ markets" },
  { id: "2", emoji: "🍂", label: "Seasonal Spotter", description: "Shared 5+ seasonal finds" },
  { id: "3", emoji: "✨", label: "Community Favorite", description: "100+ thanks received" },
];

const radiusOptions: ProximityRadius[] = [10, 20, 30];

export default function Profile() {
  const { radius, setRadius } = useProximitySettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 px-4 flex items-center justify-between border-b border-border">
        <h1 className="font-serif text-2xl font-bold text-primary">Profile</h1>
        <button className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-blush"
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
              ✓
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Jamie Wilson
            </h2>
            <p className="text-sm text-muted-foreground">@jamiewilson</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-foreground">
                <strong>23</strong>{" "}
                <span className="text-muted-foreground">finds</span>
              </span>
              <span className="text-foreground">
                <strong>156</strong>{" "}
                <span className="text-muted-foreground">thanks</span>
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-foreground leading-relaxed">
          Weekend market explorer 🌿 Finding the best local produce and artisan
          goods in the city. Always on the hunt for the perfect loaf of bread.
        </p>

        <button className="mt-4 w-full py-2.5 px-4 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Proximity Settings */}
      <section className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-secondary" />
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Discovery Radius
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Set how far to look for "Further out" markets
        </p>
        <div className="flex gap-2">
          {radiusOptions.map((option) => (
            <button
              key={option}
              onClick={() => setRadius(option)}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                radius === option
                  ? "bg-primary text-primary-foreground shadow-soft-md"
                  : "bg-card text-foreground border border-border hover:bg-muted"
              )}
            >
              {option} mi
            </button>
          ))}
        </div>
      </section>

      {/* Badges */}
      <section className="px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Trust Badges
          </h3>
          <button className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-0.5">
            All badges
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex-shrink-0 w-32 p-3 bg-card rounded-xl shadow-soft-sm text-center"
            >
              <span className="text-2xl">{badge.emoji}</span>
              <p className="font-medium text-sm text-foreground mt-1">
                {badge.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* User's Finds Grid */}
      <section className="px-4 py-4 border-t border-border">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
          My Finds
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {userFinds.map((find) => (
            <button
              key={find.id}
              className="aspect-square rounded-lg overflow-hidden shadow-soft-sm group"
            >
              <img
                src={find.image}
                alt="Find"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Membership CTA */}
      <section className="mx-4 my-6 p-4 bg-gradient-to-br from-primary/10 to-blush rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-xl">
            ✨
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Nearish Member</h4>
            <p className="text-sm text-muted-foreground">
              Share unlimited finds with the community
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </section>
    </div>
  );
}
