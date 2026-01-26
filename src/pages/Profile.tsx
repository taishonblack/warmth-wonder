import { Settings, ChevronRight, MapPin, Calendar, Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import images
import find1 from "@/assets/find-1.jpg";
import find2 from "@/assets/find-2.jpg";
import find3 from "@/assets/find-3.jpg";
import find4 from "@/assets/find-4.jpg";
import find5 from "@/assets/find-5.jpg";
import find6 from "@/assets/find-6.jpg";

// Mock user finds organized by date
const userFinds = [
  { id: "1", image: find1, date: "2024-01-25" },
  { id: "2", image: find2, date: "2024-01-24" },
  { id: "3", image: find3, date: "2024-01-23" },
  { id: "4", image: find4, date: "2024-01-22" },
  { id: "5", image: find5, date: "2024-01-21" },
  { id: "6", image: find6, date: "2024-01-20" },
  { id: "7", image: find1, date: "2024-01-19" },
  { id: "8", image: find2, date: "2024-01-18" },
];

// Mock followed users
const followedUsers = [
  { id: "1", name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?img=5", followedAt: "2024-01-10" },
  { id: "2", name: "Marcus Lee", avatar: "https://i.pravatar.cc/150?img=8", followedAt: "2024-01-05" },
  { id: "3", name: "Emma Wilson", avatar: "https://i.pravatar.cc/150?img=9", followedAt: "2023-12-28" },
  { id: "4", name: "James Park", avatar: "https://i.pravatar.cc/150?img=11", followedAt: "2023-12-20" },
];

// Mock preferred markets
const allMarkets = [
  "Union Square Greenmarket",
  "Grand Army Plaza Market",
  "Brooklyn Flea",
  "Smorgasburg",
  "Essex Market",
  "Chelsea Market",
  "Prospect Park Market",
];

const badges = [
  { id: "1", emoji: "🌱", label: "Local Regular", description: "Visited 10+ markets" },
  { id: "2", emoji: "🍂", label: "Seasonal Spotter", description: "Shared 5+ seasonal finds" },
  { id: "3", emoji: "✨", label: "Community Favorite", description: "100+ thanks received" },
];

export default function Profile() {
  const [zipCode, setZipCode] = useState("11201");
  const [radius, setRadius] = useState([20]);
  const [birthday, setBirthday] = useState("1990-05-15");
  const [preferredMarkets, setPreferredMarkets] = useState<string[]>([
    "Union Square Greenmarket",
    "Brooklyn Flea",
  ]);
  const [isEditing, setIsEditing] = useState(false);

  const toggleMarket = (market: string) => {
    setPreferredMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-2xl font-bold text-primary">Profile</h1>
        </div>
        <Link
          to="/settings"
          className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      <div className="max-w-4xl mx-auto">
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
                <span className="text-foreground">
                  <strong>{followedUsers.length}</strong>{" "}
                  <span className="text-muted-foreground">following</span>
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-foreground leading-relaxed">
            Weekend market explorer 🌿 Finding the best local produce and artisan
            goods in the city. Always on the hunt for the perfect loaf of bread.
          </p>

          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Save Profile" : "Edit Profile"}
          </Button>
        </div>

        {/* Account Information (editable) */}
        {isEditing && (
          <section className="px-4 py-4 border-t border-border">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
              Account Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary" />
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary" />
                    Zip Code
                  </Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter your zip code"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Discovery Radius - now 0-100 */}
        <section className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-secondary" />
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Discovery Radius
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            How far to look for markets and finds: <strong>{radius[0]} miles</strong>
          </p>
          <Slider
            value={radius}
            onValueChange={setRadius}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0 mi</span>
            <span>50 mi</span>
            <span>100 mi</span>
          </div>
        </section>

        {/* Preferred Markets */}
        <section className="px-4 py-4 border-t border-border">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
            Preferred Markets
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Select your favorite markets to get personalized recommendations
          </p>
          <div className="flex flex-wrap gap-2">
            {allMarkets.map((market) => (
              <Badge
                key={market}
                variant={preferredMarkets.includes(market) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  preferredMarkets.includes(market)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => toggleMarket(market)}
              >
                {market}
              </Badge>
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

        {/* Users Following */}
        <section className="px-4 py-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Following
            </h3>
            <button className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-0.5">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {followedUsers.map((user) => (
              <button
                key={user.id}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-card rounded-xl shadow-soft-sm hover:shadow-soft-md transition-shadow"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-foreground text-center max-w-20 truncate">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* User's Finds Grid - 4 per row, smaller, organized by date */}
        <section className="px-4 py-4 border-t border-border">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
            My Finds
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Organized by most recent
          </p>
          <div className="grid grid-cols-4 gap-2">
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
    </div>
  );
}
