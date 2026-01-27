import { Heart, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MasonryFindItemProps {
  id: string;
  image: string;
  alt?: string;
  posterName?: string;
  posterAvatar?: string;
  posterUserId?: string;
  caption?: string;
  marketName?: string;
  thanksCount?: number;
  onClick?: () => void;
  onPosterClick?: () => void;
  className?: string;
}

export function MasonryFindItem({
  id,
  image,
  alt = "Find",
  posterName,
  posterAvatar,
  posterUserId,
  caption,
  marketName,
  thanksCount = 0,
  onClick,
  onPosterClick,
  className,
}: MasonryFindItemProps) {
  const isMobile = useIsMobile();

  const handlePosterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPosterClick?.();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl group cursor-pointer shadow-soft-sm transition-all duration-300 hover:shadow-soft-lg w-full text-left",
        className
      )}
    >
      <img
        src={image}
        alt={alt}
        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
      
      {/* Hover overlay with more info */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/60 to-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        {/* Caption preview */}
        {caption && (
          <p className="text-xs text-primary-foreground/90 line-clamp-3 mb-2">
            {caption}
          </p>
        )}
        
        {/* Market name */}
        {marketName && (
          <p className="text-[10px] text-primary-foreground/70 mb-2 truncate">
            📍 {marketName}
          </p>
        )}
        
        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-primary-foreground/90">
              <Heart className="w-4 h-4" />
              <span className="text-xs">{thanksCount}</span>
            </div>
            <MessageCircle className="w-4 h-4 text-primary-foreground/90" />
            <Share2 className="w-4 h-4 text-primary-foreground/90" />
          </div>
        </div>
      </div>
      
      {/* Default poster info (visible when not hovered) */}
      {posterName && (
        <div 
          className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2 group-hover:opacity-0 transition-opacity duration-300"
          onClick={handlePosterClick}
        >
          {posterAvatar && (
            <img
              src={posterAvatar}
              alt={posterName}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-primary-foreground/50"
            />
          )}
          <span className="text-xs font-medium text-primary-foreground truncate">
            {posterName}
          </span>
        </div>
      )}
      
      {/* Poster info on hover (positioned at top) */}
      {posterName && (
        <div 
          className="absolute top-0 left-0 right-0 p-2.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={handlePosterClick}
        >
          {posterAvatar && (
            <img
              src={posterAvatar}
              alt={posterName}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-primary-foreground/70"
            />
          )}
          <span className="text-xs font-semibold text-primary-foreground">
            {posterName}
          </span>
        </div>
      )}
    </button>
  );
}
