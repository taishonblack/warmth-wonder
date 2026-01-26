import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseFollowsReturn {
  following: string[];
  followers: string[];
  loading: boolean;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<void>;
  getFollowerCount: (userId: string) => Promise<number>;
  getFollowingCount: (userId: string) => Promise<number>;
  refetch: () => Promise<void>;
}

export function useFollows(): UseFollowsReturn {
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFollows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch who the current user is following
      const { data: followingData, error: followingError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingError) throw followingError;
      setFollowing(followingData?.map(f => f.following_id) || []);

      // Fetch who is following the current user
      const { data: followersData, error: followersError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);

      if (followersError) throw followersError;
      setFollowers(followersData?.map(f => f.follower_id) || []);
    } catch (error: any) {
      console.error("Error fetching follows:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = (userId: string): boolean => {
    return following.includes(userId);
  };

  const toggleFollow = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to follow users.",
          variant: "destructive",
        });
        return;
      }

      if (user.id === userId) {
        toast({
          title: "Cannot follow yourself",
          variant: "destructive",
        });
        return;
      }

      if (isFollowing(userId)) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);

        if (error) throw error;
        setFollowing(prev => prev.filter(id => id !== userId));

        toast({
          title: "Unfollowed",
          description: "You will no longer see their finds in notifications.",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: userId });

        if (error) throw error;
        setFollowing(prev => [...prev, userId]);

        // Create notification for the user being followed
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "new_follower",
          actor_id: user.id,
        });

        toast({
          title: "Following!",
          description: "You'll be notified when they share new finds.",
        });
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFollowerCount = async (userId: string): Promise<number> => {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);
    return count || 0;
  };

  const getFollowingCount = async (userId: string): Promise<number> => {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);
    return count || 0;
  };

  useEffect(() => {
    fetchFollows();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchFollows();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    following,
    followers,
    loading,
    isFollowing,
    toggleFollow,
    getFollowerCount,
    getFollowingCount,
    refetch: fetchFollows,
  };
}
