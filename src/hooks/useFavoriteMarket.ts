import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface UseFavoriteMarketReturn {
  isFavorite: boolean;
  loading: boolean;
  toggleFavorite: () => Promise<void>;
}

export function useFavoriteMarket(marketId: string, marketName: string): UseFavoriteMarketReturn {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { requestPermission, isSubscribed } = usePushNotifications();

  const checkFavorite = useCallback(async () => {
    if (!marketId) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("preferred_markets")
        .select("id")
        .eq("user_id", user.id)
        .eq("market_id", marketId)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error: any) {
      console.error("Error checking favorite status:", error);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save favorite markets.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("preferred_markets")
          .delete()
          .eq("user_id", user.id)
          .eq("market_id", marketId);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: `You won't receive notifications for ${marketName}`,
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("preferred_markets")
          .insert({
            user_id: user.id,
            market_id: marketId,
            market_name: marketName,
          });

        if (error) throw error;

        setIsFavorite(true);

        // Request push notification permission if not already subscribed
        if (!isSubscribed) {
          const permissionGranted = await requestPermission();
          if (permissionGranted) {
            toast({
              title: "Added to favorites!",
              description: `You'll be notified when new finds are posted at ${marketName}`,
            });
          } else {
            toast({
              title: "Added to favorites",
              description: "Enable notifications to get alerts for new finds.",
            });
          }
        } else {
          toast({
            title: "Added to favorites!",
            description: `You'll be notified when new finds are posted at ${marketName}`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  return {
    isFavorite,
    loading,
    toggleFavorite,
  };
}
