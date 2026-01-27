import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Verification {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  fieldName: string;
  fieldValue: string;
  createdAt: Date;
  timestamp: string;
}

interface UseMarketVerificationsReturn {
  verifications: Verification[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useMarketVerifications(marketId: string): UseMarketVerificationsReturn {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVerifications = useCallback(async () => {
    if (!marketId) {
      setLoading(false);
      return;
    }

    try {
      const { data: verificationsData, error } = await supabase
        .from("market_verifications")
        .select("*")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!verificationsData || verificationsData.length === 0) {
        setVerifications([]);
        setLoading(false);
        return;
      }

      // Get user profiles
      const userIds = [...new Set(verificationsData.map(v => v.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      const formattedVerifications: Verification[] = verificationsData.map(verification => {
        const profile = profilesMap.get(verification.user_id);
        const createdAt = new Date(verification.created_at);

        return {
          id: verification.id,
          userId: verification.user_id,
          userName: profile?.display_name || "Anonymous",
          userAvatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${verification.user_id}`,
          fieldName: verification.field_name,
          fieldValue: verification.field_value,
          createdAt,
          timestamp: formatTimestamp(createdAt),
        };
      });

      setVerifications(formattedVerifications);
    } catch (error: any) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  return {
    verifications,
    loading,
    refetch: fetchVerifications,
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
