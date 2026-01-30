import { Home, Binoculars, Map, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "Explore" },
  { icon: Binoculars, path: "/finds", label: "Finds" },
  { icon: Map, path: "/map", label: "Map" },
  { icon: Heart, path: "/favorites", label: "Favorites" },
  { icon: User, path: "/profile", label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-soft-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, path, label }) => {
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
  );
}
