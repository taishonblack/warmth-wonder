import { cn } from "@/lib/utils";

export interface TrustBadgeData {
  id: string;
  emoji: string;
  label: string;
  description: string;
  earned: boolean;
}

interface TrustBadgeProps {
  badge: TrustBadgeData;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}

export function TrustBadge({ 
  badge, 
  size = "md", 
  showDescription = true,
  className 
}: TrustBadgeProps) {
  const sizeClasses = {
    sm: "w-20 p-2",
    md: "w-28 p-3",
    lg: "w-32 p-4",
  };

  const emojiSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 bg-card rounded-xl shadow-soft-sm text-center transition-all",
        !badge.earned && "opacity-50 grayscale",
        sizeClasses[size],
        className
      )}
    >
      <span className={emojiSizes[size]}>{badge.emoji}</span>
      <p className={cn(
        "font-medium text-foreground mt-1",
        size === "sm" ? "text-xs" : "text-sm"
      )}>
        {badge.label}
      </p>
      {showDescription && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {badge.description}
        </p>
      )}
    </div>
  );
}

// Helper function to compute badges based on activity
export function computeTrustBadges(stats: {
  marketCount?: number;
  findCount?: number;
  thanksReceived?: number;
  recentFinds?: number; // finds in last 90 days
}): TrustBadgeData[] {
  const { marketCount = 0, findCount = 0, thanksReceived = 0, recentFinds = 0 } = stats;

  return [
    {
      id: "local-regular",
      emoji: "🌱",
      label: "Local Regular",
      description: "Visited 10+ markets",
      earned: marketCount >= 10,
    },
    {
      id: "seasonal-spotter",
      emoji: "🍂",
      label: "Seasonal Spotter",
      description: "5+ finds in last 90 days",
      earned: recentFinds >= 5,
    },
    {
      id: "community-favorite",
      emoji: "✨",
      label: "Community Favorite",
      description: "100+ thanks received",
      earned: thanksReceived >= 100,
    },
    {
      id: "first-find",
      emoji: "🎉",
      label: "First Find",
      description: "Shared your first find",
      earned: findCount >= 1,
    },
  ];
}
