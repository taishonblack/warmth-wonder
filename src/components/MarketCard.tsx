import { cn } from "@/lib/utils";

interface MarketCardProps {
  name: string;
  image: string;
  distance?: string;
  isOpen?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MarketCard({
  name,
  image,
  distance,
  isOpen,
  className,
  onClick,
}: MarketCardProps) {
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
