import { Heart, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FindDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  find: {
    id: string;
    image: string;
    posterName: string;
    posterAvatar: string;
    caption: string;
    marketName: string;
    thanksCount: number;
    timestamp: string;
  } | null;
}

export function FindDetailPopup({ isOpen, onClose, find }: FindDetailPopupProps) {
  const navigate = useNavigate();
  const [hasThanked, setHasThanked] = useState(false);

  if (!find) return null;

  const handleMoreClick = () => {
    onClose();
    navigate("/finds");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        {/* Image */}
        <div className="relative aspect-square">
          <img
            src={find.image}
            alt="Find"
            className="w-full h-full object-cover"
          />
          <DialogClose className="absolute top-3 right-3 w-8 h-8 rounded-full bg-foreground/50 backdrop-blur-sm flex items-center justify-center text-primary-foreground hover:bg-foreground/70 transition-colors">
            <X className="w-4 h-4" />
          </DialogClose>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Poster info */}
          <div className="flex items-center gap-3">
            <img
              src={find.posterAvatar}
              alt={find.posterName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blush"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {find.posterName}
              </p>
              <p className="text-xs text-muted-foreground">{find.timestamp}</p>
            </div>
          </div>

          {/* Caption */}
          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
            {find.caption}
          </p>

          {/* Market Tag */}
          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-blush/50 rounded-full text-xs font-medium text-primary">
            📍 {find.marketName}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={() => setHasThanked(!hasThanked)}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                hasThanked ? "text-accent" : "text-muted-foreground hover:text-accent"
              )}
            >
              <Heart
                className="w-5 h-5"
                fill={hasThanked ? "currentColor" : "none"}
              />
              <span>{hasThanked ? find.thanksCount + 1 : find.thanksCount} thanks</span>
            </button>

            <button
              onClick={handleMoreClick}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              More
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
