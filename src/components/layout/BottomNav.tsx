import { Home, Binoculars, Map, MessageCircle, User, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ShareFindModal } from "@/components/ShareFindModal";
import { useAuth } from "@/hooks/useAuth";

// Keep Profile in mobile nav since there's no dropdown
const navItems = [
  { icon: Home, path: "/explore", label: "Explore" },
  { icon: Binoculars, path: "/finds", label: "Finds" },
  { icon: null, path: null, label: "Share", isShareButton: true },
  { icon: Map, path: "/map", label: "Map" },
  { icon: User, path: "/profile", label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShareClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowShareModal(true);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-soft-lg">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item, index) => {
            if (item.isShareButton) {
              return (
                <button
                  key="share"
                  onClick={handleShareClick}
                  className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary text-primary-foreground shadow-soft-lg hover:bg-primary/90 transition-colors"
                  aria-label="Share Find"
                >
                  <Plus className="w-6 h-6" />
                </button>
              );
            }

            const { icon: Icon, path, label } = item;
            if (!Icon || !path) return null;
            
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-secondary"
                )}
                aria-label={label}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <span className="w-1 h-1 mt-1 rounded-full bg-primary animate-scale-in" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <ShareFindModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        isSubscribed={true}
      />
    </>
  );
}
