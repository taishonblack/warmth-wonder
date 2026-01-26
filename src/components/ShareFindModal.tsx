import { X, Camera, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useFinds } from "@/hooks/useFinds";

interface ShareFindModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed?: boolean;
}

const MARKETS = [
  "Union Square Greenmarket",
  "Grand Army Plaza Market",
  "Chelsea Market",
  "Smorgasburg",
  "Brooklyn Flea",
  "Essex Market",
  "Prospect Park Market",
];

export function ShareFindModal({
  isOpen,
  onClose,
  isSubscribed = true,
}: ShareFindModalProps) {
  const [caption, setCaption] = useState("");
  const [marketName, setMarketName] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createFind } = useFinds();

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 4 images
    const newFiles = files.slice(0, 4 - selectedImages.length);
    setSelectedImages(prev => [...prev, ...newFiles]);

    // Create preview URLs
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!caption.trim() || !marketName || selectedImages.length === 0) return;

    setIsSubmitting(true);
    const success = await createFind({
      caption: caption.trim(),
      marketName,
      images: selectedImages,
    });

    if (success) {
      // Reset form
      setCaption("");
      setMarketName("");
      setSelectedImages([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    // Cleanup preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setSelectedImages([]);
    setCaption("");
    setMarketName("");
    onClose();
  };

  const isValid = caption.trim() && marketName && selectedImages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl shadow-soft-lg animate-slide-up sm:animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Share a Find
          </h2>
          <button
            onClick={handleClose}
            className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Form */}
        <div className="p-4 space-y-4">
          {/* Photo Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {previewUrls.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video bg-muted rounded-xl border-2 border-dashed border-border hover:border-secondary flex flex-col items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-8 h-8 text-secondary" />
              <span className="text-sm text-muted-foreground">
                Add photos (up to 4)
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-foreground/50 rounded-full text-background hover:bg-foreground/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {previewUrls.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-muted rounded-xl border-2 border-dashed border-border hover:border-secondary flex items-center justify-center transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What did you find? Tell us about it..."
            className="w-full p-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
          />

          {/* Market Select */}
          <select
            value={marketName}
            onChange={(e) => setMarketName(e.target.value)}
            className="w-full p-3 bg-muted rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          >
            <option value="">Select a market...</option>
            {MARKETS.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
              isValid && !isSubmitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sharing...
              </>
            ) : (
              "Share Find"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
