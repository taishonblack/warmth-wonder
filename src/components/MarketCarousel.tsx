import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { MarketCard } from "@/components/MarketCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Default fallback image
import market1 from "@/assets/market-1.jpg";

interface MarketWithImage {
  id: string;
  name: string;
  image?: string;
  distanceMiles?: number;
  is_open?: boolean;
  hours?: string | null;
  source?: string;
}

interface MarketCarouselProps {
  markets: MarketWithImage[];
  onMarketClick: (market: MarketWithImage) => void;
  showAllLink: string;
  className?: string;
}

export function MarketCarousel({
  markets,
  onMarketClick,
  showAllLink,
  className,
}: MarketCarouselProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Calculate visible dots (show max 7 dots with ellipsis effect)
  const getVisibleDots = useCallback(() => {
    if (count <= 7) {
      return Array.from({ length: count }, (_, i) => i);
    }
    
    const dots: number[] = [];
    if (current <= 3) {
      // Show first 5, then last
      for (let i = 0; i < 5; i++) dots.push(i);
      dots.push(-1); // ellipsis indicator
      dots.push(count - 1);
    } else if (current >= count - 4) {
      // Show first, then last 5
      dots.push(0);
      dots.push(-1);
      for (let i = count - 5; i < count; i++) dots.push(i);
    } else {
      // Show first, current-1, current, current+1, last
      dots.push(0);
      dots.push(-1);
      dots.push(current - 1);
      dots.push(current);
      dots.push(current + 1);
      dots.push(-1);
      dots.push(count - 1);
    }
    return dots;
  }, [current, count]);

  const visibleDots = getVisibleDots();

  return (
    <div className={cn("space-y-3", className)}>
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-3">
          {markets.map((market) => (
            <CarouselItem
              key={market.id}
              className="pl-2 md:pl-3 basis-[140px] md:basis-[180px] lg:basis-[200px]"
            >
              <MarketCard
                name={market.name}
                image={market.image || market1}
                distance={
                  market.distanceMiles != null
                    ? `${market.distanceMiles.toFixed(1)} mi`
                    : undefined
                }
                isOpen={market.is_open}
                hours={market.hours}
                onClick={() => onMarketClick(market)}
                className="w-full"
              />
            </CarouselItem>
          ))}
          {/* Show All Card */}
          <CarouselItem className="pl-2 md:pl-3 basis-[140px] md:basis-[180px] lg:basis-[200px]">
            <button
              onClick={() => navigate(showAllLink)}
              className="w-full h-full min-h-[160px] md:min-h-[180px] rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            >
              <ChevronRight className="w-8 h-8" />
              <span className="text-sm font-medium">Show all</span>
            </button>
          </CarouselItem>
        </CarouselContent>
        {!isMobile && (
          <>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </>
        )}
      </Carousel>

      {/* Dot Pagination - Mobile Only */}
      {isMobile && count > 1 && (
        <div className="flex justify-center items-center gap-1.5">
          {visibleDots.map((dotIndex, i) => {
            if (dotIndex === -1) {
              return (
                <span
                  key={`ellipsis-${i}`}
                  className="w-1 h-1 rounded-full bg-muted-foreground/40"
                />
              );
            }
            return (
              <button
                key={dotIndex}
                onClick={() => api?.scrollTo(dotIndex)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  current === dotIndex
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                )}
                aria-label={`Go to slide ${dotIndex + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
