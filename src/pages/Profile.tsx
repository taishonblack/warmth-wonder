import { Settings, ChevronRight, MapPin, Calendar, Heart, ArrowLeft, Loader2, ImageOff } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { useFollows } from "@/hooks/useFollows";
import { TrustBadge, computeTrustBadges } from "@/components/TrustBadge";
import { FollowListSheet } from "@/components/FollowListSheet";
import { supabase } from "@/integrations/supabase/client";

interface UserFind {
  id: string;
  images: string[];
  created_at: string;
  caption: string;
  market_name: string;
}

interface FollowedUser {
  id: string;
  name: string;
  avatar: string;
}

// Available markets to choose from
const allMarkets = [
  "Union Square Greenmarket",
  "Grand Army Plaza Market",
  "Brooklyn Flea",
  "Smorgasburg",
  "Essex Market",
  "Chelsea Market",
  "Prospect Park Market",
];

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { profile, preferredMarkets, loading: profileLoading, saving, updateProfile, togglePreferredMarket } = useProfile();
  const { stats, loading: statsLoading } = useUserStats(user?.id);
  const { following } = useFollows();
  
  const [isEditing, setIsEditing] = useState(false);
  const [localBirthday, setLocalBirthday] = useState("");
  const [localZipCode, setLocalZipCode] = useState("");
  const [localRadius, setLocalRadius] = useState([25]);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [userFinds, setUserFinds] = useState<UserFind[]>([]);
  const [findsLoading, setFindsLoading] = useState(true);
  const [followSheetType, setFollowSheetType] = useState<"followers" | "following" | null>(null);

  // Compute trust badges based on real stats
  const badges = computeTrustBadges({
    marketCount: stats.marketCount,
    findCount: stats.findCount,
    thanksReceived: stats.thanksReceived,
    recentFinds: stats.recentFinds,
  });

  // Fetch followed users' profiles
  useEffect(() => {
    const fetchFollowedProfiles = async () => {
      if (following.length === 0) return;
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", following);
      
      if (profiles) {
        setFollowedUsers(profiles.map(p => ({
          id: p.user_id,
          name: p.display_name || "User",
          avatar: p.avatar_url || `https://i.pravatar.cc/150?u=${p.user_id}`,
        })));
      }
    };

    fetchFollowedProfiles();
  }, [following]);

  // Fetch user's real finds
  useEffect(() => {
    const fetchUserFinds = async () => {
      if (!user?.id) {
        setFindsLoading(false);
        return;
      }
      
      setFindsLoading(true);
      const { data, error } = await supabase
        .from("finds")
        .select("id, images, created_at, caption, market_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data && !error) {
        setUserFinds(data);
      }
      setFindsLoading(false);
    };

    fetchUserFinds();
  }, [user?.id]);

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setLocalBirthday(profile.birthday || "");
      setLocalZipCode(profile.zip_code || "");
      setLocalRadius([profile.radius_miles || 25]);
    }
  }, [profile]);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveProfile = async () => {
    await updateProfile({
      birthday: localBirthday || null,
      zip_code: localZipCode || null,
      radius_miles: localRadius[0],
    });
    setIsEditing(false);
  };

  const handleRadiusChange = async (value: number[]) => {
    setLocalRadius(value);
    // Auto-save radius changes
    await updateProfile({ radius_miles: value[0] });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-blush"
              />
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                ✓
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {profile?.display_name || user?.email?.split("@")[0] || "User"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-4 mt-2 text-sm flex-wrap">
                <span className="text-foreground">
                  <strong>{stats.findCount}</strong>{" "}
                  <span className="text-muted-foreground">finds</span>
                </span>
                <span className="text-foreground">
                  <strong>{stats.thanksReceived}</strong>{" "}
                  <span className="text-muted-foreground">thanks</span>
                </span>
                <button 
                  onClick={() => setFollowSheetType("followers")}
                  className="text-foreground hover:underline"
                >
                  <strong>{stats.followerCount}</strong>{" "}
                  <span className="text-muted-foreground">followers</span>
                </button>
                <button 
                  onClick={() => setFollowSheetType("following")}
                  className="text-foreground hover:underline"
                >
                  <strong>{stats.followingCount}</strong>{" "}
                  <span className="text-muted-foreground">following</span>
                </button>
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
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Profile"
            ) : (
              "Edit Profile"
            )}
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
                    value={localBirthday}
                    onChange={(e) => setLocalBirthday(e.target.value)}
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
                    value={localZipCode}
                    onChange={(e) => setLocalZipCode(e.target.value)}
                    placeholder="Enter your zip code"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Discovery Radius - 0-100 */}
        <section className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-secondary" />
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Discovery Radius
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            How far to look for markets and finds: <strong>{localRadius[0]} miles</strong>
          </p>
          <Slider
            value={localRadius}
            onValueChange={handleRadiusChange}
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
                onClick={() => togglePreferredMarket(market)}
              >
                {market}
              </Badge>
            ))}
          </div>
        </section>

        {/* Badges - show earned ones */}
        <section className="px-4 py-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Trust Badges
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {badges.map((badge) => (
              <TrustBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </section>

        {/* Users Following */}
        {followedUsers.length > 0 && (
          <section className="px-4 py-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent" />
                Following
              </h3>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {followedUsers.map((followedUser) => (
                <Link
                  key={followedUser.id}
                  to={`/u/${followedUser.id}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-card rounded-xl shadow-soft-sm hover:shadow-soft-md transition-shadow"
                >
                  <img
                    src={followedUser.avatar}
                    alt={followedUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-foreground text-center max-w-20 truncate">
                    {followedUser.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* User's Finds Grid - 4 per row, smaller, organized by date */}
        <section className="px-4 py-4 border-t border-border">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
            My Finds
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Organized by most recent
          </p>
          {findsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : userFinds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ImageOff className="w-10 h-10 mb-2" />
              <p className="text-sm">No finds yet</p>
              <p className="text-xs">Share your first discovery!</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {userFinds.map((find) => (
                <button
                  key={find.id}
                  className="aspect-square rounded-lg overflow-hidden shadow-soft-sm group"
                >
                  <img
                    src={find.images[0] || "/placeholder.svg"}
                    alt={find.caption || "Find"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
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

      {/* Follow List Sheet */}
      {user && (
        <FollowListSheet
          isOpen={!!followSheetType}
          onClose={() => setFollowSheetType(null)}
          userId={user.id}
          type={followSheetType || "followers"}
        />
      )}
    </div>
  );
}
