import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  findCount: number;
  thanksReceived: number;
  followerCount: number;
  followingCount: number;
  marketCount: number;
  recentFinds: number; // finds in last 90 days
}

export function useUserStats(userId?: string) {
  const [stats, setStats] = useState<UserStats>({
    findCount: 0,
    thanksReceived: 0,
    followerCount: 0,
    followingCount: 0,
    marketCount: 0,
    recentFinds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch find count
        const { count: findCount } = await supabase
          .from("finds")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Fetch thanks received (thanks on user's finds)
        const { data: userFinds } = await supabase
          .from("finds")
          .select("id")
          .eq("user_id", userId);

        let thanksReceived = 0;
        if (userFinds && userFinds.length > 0) {
          const findIds = userFinds.map(f => f.id);
          const { count: thanksCount } = await supabase
            .from("thanks")
            .select("*", { count: "exact", head: true })
            .in("find_id", findIds);
          thanksReceived = thanksCount || 0;
        }

        // Fetch follower count
        const { count: followerCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId);

        // Fetch following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId);

        // Fetch unique market count from finds
        const { data: findsWithMarkets } = await supabase
          .from("finds")
          .select("market_name")
          .eq("user_id", userId);

        const uniqueMarkets = new Set(findsWithMarkets?.map(f => f.market_name) || []);
        const marketCount = uniqueMarkets.size;

        // Fetch recent finds (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const { count: recentFinds } = await supabase
          .from("finds")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", ninetyDaysAgo.toISOString());

        setStats({
          findCount: findCount || 0,
          thanksReceived,
          followerCount: followerCount || 0,
          followingCount: followingCount || 0,
          marketCount,
          recentFinds: recentFinds || 0,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
}
