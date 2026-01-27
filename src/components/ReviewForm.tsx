import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  marketId: string;
  onSubmit: (rating: number, content: string) => Promise<boolean>;
}

export function ReviewForm({ marketId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    const success = await onSubmit(rating, content);
    if (success) {
      setRating(0);
      setContent("");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 space-y-4">
      <h3 className="font-medium text-foreground">Write a Review</h3>
      
      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5 focus:outline-none"
          >
            <Star
              className={cn(
                "w-7 h-7 transition-colors",
                (hoveredRating || rating) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Select rating"}
        </span>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your experience at this market..."
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        rows={3}
        maxLength={500}
      />

      {/* Submit */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {content.length}/500 characters
        </span>
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Review
        </button>
      </div>
    </form>
  );
}
