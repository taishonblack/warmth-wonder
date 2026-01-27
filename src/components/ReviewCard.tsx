import { Star } from "lucide-react";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string | null;
  timestamp: string;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src={review.userAvatar}
          alt={review.userName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{review.userName}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{review.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {review.content && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.content}
        </p>
      )}
    </div>
  );
}
