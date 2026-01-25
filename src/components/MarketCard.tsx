import { Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MarketCardProps {
  name: string;
  image: string;
  distance?: string;
  isOpen?: boolean;
  rating?: number;
  reviewCount?: number;
  featuredProducts?: string[];
  className?: string;
  onClick?: () => void;
}

export function MarketCard({
  name,
  image,
  distance,
  isOpen,
  rating = 4.5,
  reviewCount = 128,
  featuredProducts = ["Fresh Produce", "Artisan Bread", "Local Honey"],
  className,
  onClick,
}: MarketCardProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex-shrink-0 w-36 group cursor-pointer text-left",
          className
        )}
      >
        <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-2 shadow-soft-sm">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOpen !== undefined && (
            <span
              className={cn(
                "absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full",
                isOpen
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-muted/90 text-muted-foreground"
              )}
            >
              {isOpen ? "Open" : "Closed"}
            </span>
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
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
        {isOpen !== undefined && (
          <span
            className={cn(
              "absolute top-2 right-2 px-2.5 py-1 text-xs font-medium rounded-full transition-transform duration-300 group-hover:scale-105",
              isOpen
                ? "bg-primary/90 text-primary-foreground"
                : "bg-muted/90 text-muted-foreground"
            )}
          >
            {isOpen ? "Open Now" : "Closed"}
          </span>
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
