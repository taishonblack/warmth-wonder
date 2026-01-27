import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Clock, Navigation, Star, Heart, 
  CheckCircle2, Users, MessageSquare, Bell, BellOff, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMarketReviews } from "@/hooks/useMarketReviews";
import { useMarketVerifications } from "@/hooks/useMarketVerifications";
import { useFavoriteMarket } from "@/hooks/useFavoriteMarket";
import { FindGridItem } from "@/components/FindGridItem";
import { FindDetailPopup } from "@/components/FindDetailPopup";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewCard } from "@/components/ReviewCard";
import { VerificationHistory } from "@/components/VerificationHistory";
import { MarketPhotoCarousel } from "@/components/MarketPhotoCarousel";
import { cn } from "@/lib/utils";

import market1 from "@/assets/market-1.jpg";
import market2 from "@/assets/market-2.jpg";
import market3 from "@/assets/market-3.jpg";

interface Market {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  hours: string | null;
  is_open: boolean;
  organic: boolean | null;
  vegan_friendly: boolean | null;
  gluten_free: boolean | null;
  verification_count: number | null;
  lat: number;
  lng: number;
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

export default function MarketDetail() {
  const { marketId } = useParams<{ marketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [market, setMarket] = useState<Market | null>(null);
  const [finds, setFinds] = useState<Find[]>([]);
  const [marketPhotos, setMarketPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFind, setSelectedFind] = useState<Find | null>(null);
  const [activeTab, setActiveTab] = useState<"finds" | "reviews" | "verifications">("finds");
  
  const { reviews, loading: reviewsLoading, addReview, averageRating, reviewCount } = useMarketReviews(marketId || "");
  const { verifications, loading: verificationsLoading } = useMarketVerifications(marketId || "");
  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavoriteMarket(marketId || "", market?.name || "");

  useEffect(() => {
    if (!marketId) return;

    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // Fetch market details
        const { data: marketData, error: marketError } = await supabase
          .from("markets")
          .select("*")
          .eq("id", marketId)
          .maybeSingle();

        if (marketError) throw marketError;
        if (!marketData) {
          navigate("/");
          return;
        }

        setMarket(marketData);

        // Fetch finds for this market
        const { data: findsData, error: findsError } = await supabase
          .from("finds")
          .select("id, user_id, caption, market_name, images, created_at")
          .eq("market_name", marketData.name)
          .order("created_at", { ascending: false });

        if (findsError) throw findsError;

        if (findsData && findsData.length > 0) {
          // Get user profiles
          const userIds = [...new Set(findsData.map(f => f.user_id))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);

          const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

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
            const profile = profilesMap.get(find.user_id);
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
              image: find.images?.[0] || market1,
              posterName: profile?.display_name || "Anonymous",
              posterAvatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${find.user_id}`,
              caption: find.caption,
              marketName: find.market_name,
              thanksCount: thanksCountMap.get(find.id) || 0,
              timestamp,
            };
          });

          setFinds(formattedFinds);
          
          // Collect photos for carousel (from finds + default market images)
          const findPhotos = findsData
            .flatMap(f => f.images || [])
            .filter((img): img is string => !!img)
            .slice(0, 6);
          
          setMarketPhotos(
            findPhotos.length > 0 
              ? findPhotos 
              : [market1, market2, market3]
          );
        } else {
          // No finds - use default market photos
          setMarketPhotos([market1, market2, market3]);
        }
      } catch (error: any) {
        console.error("Error fetching market data:", error);
        toast({
          title: "Error loading market",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [marketId, navigate, toast]);

  const handleNavigate = () => {
    if (market) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${market.lat},${market.lng}`,
        "_blank"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Market not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section with Photo Carousel */}
      <div className="relative">
        {/* Back button - absolute positioned over carousel */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          disabled={favoriteLoading || !user}
          className={cn(
            "absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-sm transition-colors",
            isFavorite 
              ? "bg-primary text-primary-foreground" 
              : "bg-background/80 text-foreground hover:bg-background"
          )}
        >
          {isFavorite ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </button>

        <MarketPhotoCarousel 
          photos={marketPhotos} 
          marketName={market.name} 
        />
      </div>

      {/* Market Info */}
      <div className="px-4 md:px-6 -mt-16 relative z-10">
        <div className="bg-card rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{market.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {market.address}, {market.city}
              </p>
            </div>
            <span
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-full",
                market.is_open
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {market.is_open ? "Open" : "Closed"}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              <span>{market.verification_count || 0} verifications</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>{finds.length} finds</span>
            </div>
          </div>

          {/* Dietary badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {market.organic && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Organic
              </span>
            )}
            {market.vegan_friendly && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Vegan-Friendly
              </span>
            )}
            {market.gluten_free && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Gluten-Free
              </span>
            )}
          </div>

          {market.hours && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              {market.hours}
            </p>
          )}

          {market.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {market.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </button>
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading || !user}
              className={cn(
                "px-4 py-3 rounded-xl font-medium transition-colors",
                isFavorite 
                  ? "bg-accent text-accent-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 mt-6">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["finds", "reviews", "verifications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors capitalize",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-6 mt-4">
        {activeTab === "finds" && (
          <div className="space-y-4">
            {finds.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {finds.map((find) => (
                  <FindGridItem
                    key={find.id}
                    image={find.image}
                    posterName={find.posterName}
                    posterAvatar={find.posterAvatar}
                    caption={find.caption}
                    marketName={find.marketName}
                    thanksCount={find.thanksCount}
                    aspectRatio="square"
                    onClick={() => setSelectedFind(find)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No finds yet</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to share a find from this market!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {user && <ReviewForm marketId={marketId!} onSubmit={addReview} />}
            
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">
                  {user ? "Be the first to review this market!" : "Sign in to leave a review"}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "verifications" && (
          <VerificationHistory 
            verifications={verifications} 
            loading={verificationsLoading} 
          />
        )}
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
