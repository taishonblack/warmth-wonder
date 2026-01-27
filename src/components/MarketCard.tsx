import { useState, useMemo } from "react";
import { Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { isMarketOpen, getNextOpenTime } from "@/utils/marketHours";

interface MarketCardProps {
  name: string;
  image: string;
  distance?: string;
  isOpen?: boolean;
  hours?: string | null;
  rating?: number;
  reviewCount?: number;
  featuredProducts?: string[];
  className?: string;
  onClick?: () => void;
  isLoadingPhoto?: boolean;
}

export function MarketCard({
  name,
  image,
  distance,
  isOpen,
  hours,
  rating = 4.5,
  reviewCount = 128,
  featuredProducts = ["Fresh Produce", "Artisan Bread", "Local Honey"],
  className,
  onClick,
  isLoadingPhoto = false,
}: MarketCardProps) {
  const isMobile = useIsMobile();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculate real-time open status from hours if available
  const computedIsOpen = useMemo(() => {
    if (hours) {
      const realTimeStatus = isMarketOpen(hours);
      if (realTimeStatus !== null) return realTimeStatus;
    }
    return isOpen;
  }, [hours, isOpen]);

  // Get next open time for closed markets
  const nextOpenTime = useMemo(() => {
    if (computedIsOpen === false && hours) {
      return getNextOpenTime(hours);
    }
    return null;
  }, [computedIsOpen, hours]);

  const showSkeleton = isLoadingPhoto || (!imageLoaded && !imageError);

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex-shrink-0 w-36 group cursor-pointer text-left",
          className
        )}
      >
        <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-2 shadow-soft-sm bg-muted">
          {/* Skeleton shimmer */}
          {showSkeleton && (
            <div className="absolute inset-0 bg-muted overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer" />
            </div>
          )}
          <img
            src={image}
            alt={name}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              showSkeleton ? "opacity-0" : "opacity-100 group-hover:scale-105"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {computedIsOpen !== undefined && (
            <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5">
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  computedIsOpen
                    ? "bg-primary/90 text-primary-foreground"
                    : "bg-muted/90 text-muted-foreground"
                )}
              >
                {computedIsOpen ? "Open" : "Closed"}
              </span>
              {nextOpenTime && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-background/90 text-foreground">
                  {nextOpenTime}
                </span>
              )}
            </div>
          )}
        </div>
        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </h3>
        {distance && (
          <p className="text-xs text-muted-foreground mt-0.5">{distance}</p>
        )}
      </button>
    );
  }

  // Desktop enhanced card
  return (
    <button
      onClick={onClick}
      className={cn(
        "group cursor-pointer text-left bg-card rounded-xl overflow-hidden shadow-soft-sm transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1",
        className
      )}
    >
      {/* Image with hover overlay */}
      <div className="relative overflow-hidden aspect-[16/10] bg-muted">
        {/* Skeleton shimmer */}
        {showSkeleton && (
          <div className="absolute inset-0 bg-muted overflow-hidden z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer" />
          </div>
        )}
        <img
          src={image}
          alt={name}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            showSkeleton ? "opacity-0" : "opacity-100 group-hover:scale-110"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        {/* Hover overlay with quick info */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex flex-wrap gap-1.5">
              {featuredProducts.slice(0, 3).map((product, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-medium bg-primary-foreground/90 text-foreground rounded-full"
                >
                  {product}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Status badge */}
        {computedIsOpen !== undefined && (
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1 transition-transform duration-300 group-hover:scale-105">
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full",
                computedIsOpen
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-muted/90 text-muted-foreground"
              )}
            >
              {computedIsOpen ? "Open Now" : "Closed"}
            </span>
            {nextOpenTime && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-background/90 text-foreground shadow-sm">
                {nextOpenTime}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {name}
        </h3>
        
        {/* Rating and distance row */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
          {distance && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{distance}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
