import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FindAuthor {
  name: string;
  avatar: string;
  userId: string;
}

interface Find {
  id: string;
  author: FindAuthor;
  images: string[];
  caption: string;
  marketName: string;
  thanksCount: number;
  timestamp: string;
  createdAt: Date;
  userHasThanked: boolean;
}

interface UseFindsReturn {
  finds: Find[];
  loading: boolean;
  createFind: (data: {
    caption: string;
    marketName: string;
    images: File[];
  }) => Promise<boolean>;
  toggleThanks: (findId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFinds(): UseFindsReturn {
  const [finds, setFinds] = useState<Find[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFinds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Fetch finds with author profiles and thanks counts
      const { data: findsData, error: findsError } = await supabase
        .from("finds")
        .select(`
          id,
          user_id,
          caption,
          market_name,
          images,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (findsError) throw findsError;

      if (!findsData || findsData.length === 0) {
        setFinds([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(findsData.map(f => f.user_id))];
      
      // Fetch profiles for all authors
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      // Fetch thanks counts for all finds
      const findIds = findsData.map(f => f.id);
      const { data: thanksData } = await supabase
        .from("thanks")
        .select("find_id, user_id")
        .in("find_id", findIds);

      // Count thanks per find and check if current user thanked
      const thanksCountMap = new Map<string, number>();
      const userThankedMap = new Map<string, boolean>();
      
      thanksData?.forEach(t => {
        thanksCountMap.set(t.find_id, (thanksCountMap.get(t.find_id) || 0) + 1);
        if (t.user_id === currentUserId) {
          userThankedMap.set(t.find_id, true);
        }
      });

      // Format finds
      const formattedFinds: Find[] = findsData.map(find => {
        const profile = profilesMap.get(find.user_id);
        const createdAt = new Date(find.created_at);
        
        return {
          id: find.id,
          author: {
            name: profile?.display_name || "Anonymous",
            avatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${find.user_id}`,
            userId: find.user_id,
          },
          images: find.images || [],
          caption: find.caption,
          marketName: find.market_name,
          thanksCount: thanksCountMap.get(find.id) || 0,
          timestamp: formatTimestamp(createdAt),
          createdAt,
          userHasThanked: userThankedMap.get(find.id) || false,
        };
      });

      setFinds(formattedFinds);
    } catch (error: any) {
      console.error("Error fetching finds:", error);
      toast({
        title: "Error loading finds",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFind = async (data: {
    caption: string;
    marketName: string;
    images: File[];
  }): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload images
      const imageUrls: string[] = [];
      for (const file of data.images) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("find-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("find-images")
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }

      // Create find
      const { data: newFind, error: findError } = await supabase
        .from("finds")
        .insert({
          user_id: user.id,
          caption: data.caption,
          market_name: data.marketName,
          images: imageUrls,
        })
        .select()
        .single();

      if (findError) throw findError;

      // Create notifications for followers
      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);

      if (followers && followers.length > 0) {
        const notifications = followers.map(f => ({
          user_id: f.follower_id,
          type: "new_find" as const,
          actor_id: user.id,
          find_id: newFind.id,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Get user profile for push notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // Trigger push notifications for users who favorited this market
      const { data: marketData } = await supabase
        .from("markets")
        .select("id")
        .eq("name", data.marketName)
        .maybeSingle();

      if (marketData) {
        // Call push notification edge function
        supabase.functions.invoke("send-push-notification", {
          body: {
            marketId: marketData.id,
            marketName: data.marketName,
            findId: newFind.id,
            findCaption: data.caption,
            posterName: profile?.display_name || "Someone",
          },
        }).catch(err => console.error("Push notification error:", err));

      }

      toast({
        title: "Find shared!",
        description: "Your find has been posted.",
      });

      await fetchFinds();
      return true;

      await fetchFinds();
      return true;
    } catch (error: any) {
      console.error("Error creating find:", error);
      toast({
        title: "Error sharing find",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleThanks = async (findId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to give thanks.",
          variant: "destructive",
        });
        return;
      }

      const find = finds.find(f => f.id === findId);
      if (!find) return;

      if (find.userHasThanked) {
        // Remove thanks
        await supabase
          .from("thanks")
          .delete()
          .eq("user_id", user.id)
          .eq("find_id", findId);

        setFinds(prev =>
          prev.map(f =>
            f.id === findId
              ? { ...f, thanksCount: f.thanksCount - 1, userHasThanked: false }
              : f
          )
        );
      } else {
        // Add thanks
        await supabase
          .from("thanks")
          .insert({ user_id: user.id, find_id: findId });

        // Create notification for find author
        if (find.author.userId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: find.author.userId,
            type: "thanks",
            actor_id: user.id,
            find_id: findId,
          });
        }

        setFinds(prev =>
          prev.map(f =>
            f.id === findId
              ? { ...f, thanksCount: f.thanksCount + 1, userHasThanked: true }
              : f
          )
        );
      }
    } catch (error: any) {
      console.error("Error toggling thanks:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFinds();
  }, []);

  return {
    finds,
    loading,
    createFind,
    toggleThanks,
    refetch: fetchFinds,
  };
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
