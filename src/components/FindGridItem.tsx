import { cn } from "@/lib/utils";

interface FindGridItemProps {
  image: string;
  alt?: string;
  aspectRatio?: "square" | "portrait" | "landscape";
  posterName?: string;
  posterAvatar?: string;
  onClick?: () => void;
  className?: string;
}

export function FindGridItem({
  image,
  alt = "Find",
  aspectRatio = "square",
  posterName,
  posterAvatar,
  onClick,
  className,
}: FindGridItemProps) {
  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-lg group cursor-pointer shadow-soft-sm",
        aspectClasses[aspectRatio],
        className
      )}
    >
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
      
      {/* Poster info */}
      {posterName && (
        <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2">
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
    </button>
  );
}
