import { cn } from "@/lib/utils";

interface FindGridItemProps {
  image: string;
  alt?: string;
  aspectRatio?: "square" | "portrait" | "landscape";
  onClick?: () => void;
  className?: string;
}

export function FindGridItem({
  image,
  alt = "Find",
  aspectRatio = "square",
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
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}
