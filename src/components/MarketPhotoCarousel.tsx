import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketPhotoCarouselProps {
  photos: string[];
  marketName: string;
  className?: string;
}

export function MarketPhotoCarousel({ photos, marketName, className }: MarketPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden">
        <img
          src={photos[currentIndex]}
          alt={`${marketName} photo ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Navigation arrows - only show if multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors shadow-lg"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors shadow-lg"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentIndex
                    ? "bg-primary-foreground w-4"
                    : "bg-primary-foreground/50 hover:bg-primary-foreground/70"
                )}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide -mt-16 relative z-10">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all",
                idx === currentIndex
                  ? "ring-2 ring-primary scale-105"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={photo}
                alt={`${marketName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
