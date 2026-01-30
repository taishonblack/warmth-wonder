import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MapPin, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteMarket {
  id: string;
  market_id: string | null;
  market_name: string;
  created_at: string;
}

interface FollowedUser {
  id: string;
  following_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favoriteMarkets, setFavoriteMarkets] = useState<FavoriteMarket[]>([]);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      return;
    }

    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch favorite markets
      const { data: markets, error: marketsError } = await supabase
        .from("preferred_markets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (marketsError) throw marketsError;
      setFavoriteMarkets(markets || []);

      // Fetch followed users with their profiles
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("id, following_id, created_at")
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false });

      if (followsError) throw followsError;

      // Fetch profiles for followed users
      if (follows && follows.length > 0) {
        const userIds = follows.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const followsWithProfiles = follows.map(follow => ({
          ...follow,
          profile: profiles?.find(p => p.user_id === follow.following_id)
        }));
        setFollowedUsers(followsWithProfiles);
      } else {
        setFollowedUsers([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
          Save your favorites
        </h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Sign in to save your favorite markets and follow creators who share great finds.
        </p>
        <Button onClick={() => navigate("/auth")} className="min-w-32">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-serif font-bold text-foreground mb-6">
        Favorites
      </h1>

      <Tabs defaultValue="markets" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="markets" className="flex-1">
            <MapPin className="w-4 h-4 mr-2" />
            Markets
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1">
            <User className="w-4 h-4 mr-2" />
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : favoriteMarkets.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No favorite markets yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tap the heart on any market to save it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favoriteMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => market.market_id && navigate(`/market/${market.market_id}`)}
                  className="w-full p-4 bg-card rounded-xl border border-border text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{market.market_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Saved {new Date(market.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : followedUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Not following anyone yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Follow creators to see their finds here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followedUsers.map((follow) => (
                <button
                  key={follow.id}
                  onClick={() => navigate(`/u/${follow.following_id}`)}
                  className="w-full p-4 bg-card rounded-xl border border-border text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {follow.profile?.avatar_url ? (
                      <img
                        src={follow.profile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-secondary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">
                        {follow.profile?.display_name || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Following since {new Date(follow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
