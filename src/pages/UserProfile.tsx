import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useUserStats } from "@/hooks/useUserStats";
import { TrustBadge, computeTrustBadges } from "@/components/TrustBadge";
import { FindGridItem } from "@/components/FindGridItem";
import { FindDetailPopup } from "@/components/FindDetailPopup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import find1 from "@/assets/find-1.jpg";

interface UserProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Find {
  id: string;
  image: string;
  posterName: string;
  posterAvatar: string;
  caption: string;
  marketName: string;
  thanksCount: number;
  timestamp: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const { stats, loading: statsLoading } = useUserStats(userId);
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [finds, setFinds] = useState<Find[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFind, setSelectedFind] = useState<Find | null>(null);

  const isOwnProfile = currentUser?.id === userId;
  const following = userId ? isFollowing(userId) : false;

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Fetch profile (needs to be accessible - check if RLS allows)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .eq("user_id", userId)
          .maybeSingle();

        // If profile query fails due to RLS, create a basic profile from the userId
        if (profileError || !profileData) {
          setProfile({
            user_id: userId,
            display_name: null,
            avatar_url: null,
          });
        } else {
          setProfile(profileData);
        }

        // Fetch user's finds (public)
        const { data: findsData, error: findsError } = await supabase
          .from("finds")
          .select("id, user_id, caption, market_name, images, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!findsError && findsData) {
          // Get thanks counts
          const findIds = findsData.map(f => f.id);
          const { data: thanksData } = await supabase
            .from("thanks")
            .select("find_id")
            .in("find_id", findIds);

          const thanksCountMap = new Map<string, number>();
          thanksData?.forEach(t => {
            thanksCountMap.set(t.find_id, (thanksCountMap.get(t.find_id) || 0) + 1);
          });

          const formattedFinds: Find[] = findsData.map(find => {
            const createdAt = new Date(find.created_at);
            const now = new Date();
            const diffMs = now.getTime() - createdAt.getTime();
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            let timestamp = "Just now";
            if (diffHours >= 24) timestamp = `${diffDays}d ago`;
            else if (diffHours >= 1) timestamp = `${diffHours}h ago`;

            return {
              id: find.id,
              image: find.images?.[0] || find1,
              posterName: profileData?.display_name || "User",
              posterAvatar: profileData?.avatar_url || `https://i.pravatar.cc/150?u=${userId}`,
              caption: find.caption,
              marketName: find.market_name,
              thanksCount: thanksCountMap.get(find.id) || 0,
              timestamp,
            };
          });

          setFinds(formattedFinds);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const badges = computeTrustBadges({
    marketCount: stats.marketCount,
    findCount: stats.findCount,
    thanksReceived: stats.thanksReceived,
    recentFinds: stats.recentFinds,
  });

  const earnedBadges = badges.filter(b => b.earned);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-4 px-4 flex items-center gap-4 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-xl font-bold text-foreground truncate">
          {profile?.display_name || "User Profile"}
        </h1>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Profile Info */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-4">
            <img
              src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${userId}`}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-blush"
            />
            <div className="flex-1">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                {profile?.display_name || "Anonymous User"}
              </h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-foreground">
                  <strong>{stats.findCount}</strong>{" "}
                  <span className="text-muted-foreground">finds</span>
                </span>
                <span className="text-foreground">
                  <strong>{stats.thanksReceived}</strong>{" "}
                  <span className="text-muted-foreground">thanks</span>
                </span>
                <span className="text-foreground">
                  <strong>{stats.followerCount}</strong>{" "}
                  <span className="text-muted-foreground">followers</span>
                </span>
              </div>
            </div>
          </div>

          {/* Follow button - only show for other users */}
          {!isOwnProfile && currentUser && (
            <Button
              variant={following ? "secondary" : "default"}
              className="mt-4 w-full"
              onClick={() => userId && toggleFollow(userId)}
              disabled={followLoading}
            >
              {following ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          )}

          {isOwnProfile && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigate("/profile")}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Trust Badges */}
        {earnedBadges.length > 0 && (
          <section className="px-4 py-4 border-t border-border">
            <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
              Trust Badges
            </h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {earnedBadges.map((badge) => (
                <TrustBadge key={badge.id} badge={badge} />
              ))}
            </div>
          </section>
        )}

        {/* User's Finds Grid */}
        <section className="px-4 py-4 border-t border-border">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-3">
            Finds
          </h3>
          {finds.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {finds.map((find) => (
                <FindGridItem
                  key={find.id}
                  image={find.image}
                  aspectRatio="square"
                  onClick={() => setSelectedFind(find)}
                  className="aspect-square"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No finds yet</p>
            </div>
          )}
        </section>
      </div>

      {/* Find Detail Popup */}
      <FindDetailPopup
        isOpen={!!selectedFind}
        onClose={() => setSelectedFind(null)}
        find={selectedFind}
      />
    </div>
  );
}
