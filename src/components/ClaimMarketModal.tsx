import { useState } from "react";
import { X, Upload, Leaf, Wheat, Heart, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Market } from "@/hooks/useMarkets";

interface ClaimMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  onClaimed?: (marketId: string) => void;
}

export function ClaimMarketModal({
  isOpen,
  onClose,
  market,
  onClaimed,
}: ClaimMarketModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hours, setHours] = useState(market?.hours || "");
  const [description, setDescription] = useState(market?.description || "");
  const [organic, setOrganic] = useState(false);
  const [veganFriendly, setVeganFriendly] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  if (!isOpen || !market) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      toast({
        title: "Too many images",
        description: "You can upload up to 4 images",
        variant: "destructive",
      });
      return;
    }
    
    setImages([...images, ...files]);
    
    // Create preview URLs
    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImageUrls([...imageUrls, ...newUrls]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to claim a market",
          variant: "destructive",
        });
        return;
      }

      // If this is an OSM market (source === "osm"), we need to insert it first
      let marketId = market.id;
      
      if (market.source === "osm") {
        // Insert OSM market into database
        const { data: newMarket, error: insertError } = await supabase
          .from("markets")
          .insert({
            name: market.name,
            address: market.address,
            city: market.city,
            state: market.state,
            zip_code: market.zip_code,
            lat: market.lat,
            lng: market.lng,
            type: market.type,
            is_open: market.is_open,
            hours: hours || market.hours,
            description: description || null,
            organic,
            vegan_friendly: veganFriendly,
            gluten_free: glutenFree,
            claimed_by: user.id,
            claimed_at: new Date().toISOString(),
            osm_source_id: market.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        marketId = newMarket.id;
      } else {
        // Update existing market
        const { error: updateError } = await supabase
          .from("markets")
          .update({
            hours: hours || market.hours,
            description: description || market.description,
            organic,
            vegan_friendly: veganFriendly,
            gluten_free: glutenFree,
            claimed_by: user.id,
            claimed_at: new Date().toISOString(),
          })
          .eq("id", market.id);

        if (updateError) throw updateError;
      }

      // Upload images if any
      if (images.length > 0) {
        for (const file of images) {
          const fileName = `${marketId}/${Date.now()}-${file.name}`;
          await supabase.storage
            .from("find-images") // Reuse existing bucket
            .upload(fileName, file);
        }
      }

      toast({
        title: "Market claimed!",
        description: "Thank you for verifying this market",
      });

      onClaimed?.(marketId);
      onClose();
    } catch (error) {
      console.error("Error claiming market:", error);
      toast({
        title: "Error",
        description: "Failed to claim market. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            Claim & Verify Market
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Market Info */}
          <div className="bg-muted/50 rounded-xl p-3">
            <h3 className="font-medium text-foreground">{market.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {market.address}, {market.city}
            </p>
          </div>

          {/* Hours */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Opening Hours
            </label>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g., Mon-Sat 8am-6pm"
              className="w-full px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others about this market..."
              rows={3}
              className="w-full px-4 py-3 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Diet/Specialty Filters */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Specialties
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOrganic(!organic)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  organic
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Leaf className="w-4 h-4" />
                Organic
                {organic && <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setVeganFriendly(!veganFriendly)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  veganFriendly
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Heart className="w-4 h-4" />
                Vegan-Friendly
                {veganFriendly && <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setGlutenFree(!glutenFree)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  glutenFree
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Wheat className="w-4 h-4" />
                Gluten-Free
                {glutenFree && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Photos (optional)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-card p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Claim Market
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
