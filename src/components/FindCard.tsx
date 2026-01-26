import { Heart, MessageCircle, UserPlus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";

interface FindCardProps {
  id: string;
  author: {
    name: string;
    avatar: string;
    userId: string;
  };
  images: string[];
  caption: string;
  marketName: string;
  thanksCount: number;
  timestamp: string;
  userHasThanked?: boolean;
  onToggleThanks?: (findId: string) => void;
  className?: string;
}

export function FindCard({
  id,
  author,
  images,
  caption,
  marketName,
  thanksCount,
  timestamp,
  userHasThanked = false,
  onToggleThanks,
  className,
}: FindCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const { isFollowing, toggleFollow } = useFollows();
  const { user } = useAuth();
  const isOwnPost = user?.id === author.userId;
  const following = isFollowing(author.userId);

  return (
    <article
      className={cn(
        "bg-card rounded-2xl overflow-hidden shadow-soft-md animate-fade-in",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-blush"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {author.name}
          </p>
          <p className="text-xs text-muted-foreground">{timestamp}</p>
        </div>
        {!isOwnPost && user && (
          <button
            onClick={() => toggleFollow(author.userId)}
            className={cn(
              "p-2 rounded-full transition-colors",
              following
                ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                : "bg-muted text-muted-foreground hover:bg-secondary/10 hover:text-secondary"
            )}
            title={following ? "Unfollow" : "Follow"}
          >
            {following ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Image Carousel */}
      <div className="relative aspect-square bg-muted">
        {images.length > 0 ? (
          <img
            src={images[currentImage]}
            alt="Find"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  idx === currentImage
                    ? "bg-primary-foreground w-3"
                    : "bg-primary-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggleThanks?.(id)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              userHasThanked ? "text-accent" : "text-muted-foreground hover:text-accent"
            )}
          >
            <Heart
              className="w-5 h-5"
              fill={userHasThanked ? "currentColor" : "none"}
            />
            <span>{thanksCount} thanks</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Caption */}
        <p className="text-sm text-foreground leading-relaxed">{caption}</p>

        {/* Market Tag */}
        <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blush/50 hover:bg-blush rounded-full text-xs font-medium text-primary transition-colors">
          📍 {marketName}
        </button>
      </div>
    </article>
  );
}
