import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string | null;
  createdAt: Date;
  timestamp: string;
}

interface UseMarketReviewsReturn {
  reviews: Review[];
  loading: boolean;
  addReview: (rating: number, content: string) => Promise<boolean>;
  averageRating: number;
  reviewCount: number;
  refetch: () => Promise<void>;
}

export function useMarketReviews(marketId: string): UseMarketReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!marketId) {
      setLoading(false);
      return;
    }

    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // Get user profiles
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      const formattedReviews: Review[] = reviewsData.map(review => {
        const profile = profilesMap.get(review.user_id);
        const createdAt = new Date(review.created_at);

        return {
          id: review.id,
          userId: review.user_id,
          userName: profile?.display_name || "Anonymous",
          userAvatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${review.user_id}`,
          rating: review.rating,
          content: review.content,
          createdAt,
          timestamp: formatTimestamp(createdAt),
        };
      });

      setReviews(formattedReviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  const addReview = async (rating: number, content: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to leave a review.",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from("reviews")
        .upsert({
          market_id: marketId,
          user_id: user.id,
          rating,
          content: content.trim() || null,
        }, {
          onConflict: "market_id,user_id",
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      await fetchReviews();
      return true;
    } catch (error: any) {
      console.error("Error adding review:", error);
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    reviews,
    loading,
    addReview,
    averageRating,
    reviewCount: reviews.length,
    refetch: fetchReviews,
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
