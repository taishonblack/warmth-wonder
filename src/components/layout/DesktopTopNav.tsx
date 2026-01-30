import { Home, Binoculars, Map, MessageCircle, Bell, Plus, ChevronDown, Settings, LogOut, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import nearishLogo from "@/assets/nearish-logo.png";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Remove Profile from nav - it's in the user dropdown now
const navItems = [
  { icon: Home, path: "/explore", label: "Explore" },
  { icon: Binoculars, path: "/finds", label: "Finds" },
  { icon: Map, path: "/map", label: "Map" },
  { icon: MessageCircle, path: "/forum", label: "Forum" },
];

// Mock auth state - will be replaced with real auth
const isLoggedIn = false;
const mockUser = {
  name: "Jane Doe",
  email: "jane@example.com",
  avatar: "https://i.pravatar.cc/150?img=12",
  initials: "JD",
};

export function DesktopTopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo - Left */}
        <Link to="/explore" className="flex items-center gap-2 shrink-0">
          <img src={nearishLogo} alt="Nearish logo" className="w-8 h-8 object-contain" />
          <h1 className="font-serif text-xl font-bold text-primary">nearish</h1>
        </Link>

        {/* Center section - Nav + Search */}
        <div className="flex-1 flex items-center justify-center gap-6">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ icon: Icon, path, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search bar */}
          <SearchBar className="max-w-md w-full hidden lg:flex" />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Quick add button */}
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden xl:inline">Share Find</span>
              </Button>

              {/* Notifications - shows new posts from followed users */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card border border-border shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <h3 className="font-semibold text-sm">From People You Follow</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <span className="text-sm font-medium">Sarah Chen shared a find</span>
                      <span className="text-xs text-muted-foreground">Fresh tomatoes at Union Square • 2h ago</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <span className="text-sm font-medium">Marcus Lee posted</span>
                      <span className="text-xs text-muted-foreground">Artisan bread at Grand Army Plaza • 4h ago</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <span className="text-sm font-medium">Emma Wilson shared a find</span>
                      <span className="text-xs text-muted-foreground">Local honey at Brooklyn Flea • 6h ago</span>
                    </DropdownMenuItem>
                  </div>
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full text-primary">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={mockUser.avatar} alt="User" />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{mockUser.initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden xl:inline text-sm font-medium">{mockUser.name}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold text-sm">{mockUser.name}</p>
                    <p className="text-xs text-muted-foreground">{mockUser.email}</p>
                  </div>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                    <Bell className="w-4 h-4 mr-2" />
                    My Finds
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-accent">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Not logged in - show Sign In button */
            <Button onClick={() => navigate("/auth")} className="gap-2">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
