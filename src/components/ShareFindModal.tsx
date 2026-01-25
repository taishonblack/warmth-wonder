import { X, Camera, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareFindModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed?: boolean;
}

export function ShareFindModal({
  isOpen,
  onClose,
  isSubscribed = false,
}: ShareFindModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl shadow-soft-lg animate-slide-up sm:animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Share a Find
          </h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSubscribed ? (
          /* Paywall Content */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blush rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Become a Nearish Member
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Posting Finds helps our community discover local treasures. Membership keeps Nearish human and spam-free.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Join for $4.99/month
              </button>
              <p className="text-xs text-muted-foreground">
                Support local communities • Ad-free forever
              </p>
            </div>
          </div>
        ) : (
          /* Post Form */
          <div className="p-4 space-y-4">
            {/* Photo Upload */}
            <button className="w-full aspect-video bg-muted rounded-xl border-2 border-dashed border-border hover:border-secondary flex flex-col items-center justify-center gap-2 transition-colors">
              <Camera className="w-8 h-8 text-secondary" />
              <span className="text-sm text-muted-foreground">
                Add photos
              </span>
            </button>

            {/* Caption */}
            <textarea
              placeholder="What did you find? Tell us about it..."
              className="w-full p-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
            />

            {/* Market Select */}
            <select className="w-full p-3 bg-muted rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
              <option value="">Select a market...</option>
              <option value="1">Union Square Greenmarket</option>
              <option value="2">Santa Monica Farmers Market</option>
              <option value="3">Pike Place Market</option>
            </select>

            {/* Submit */}
            <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Share Find
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
