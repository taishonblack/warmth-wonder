import { Bell, Plus, MapPin, Loader2, ChevronDown, Settings, LogOut, User } from "lucide-react";
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
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProximitySettings } from "@/hooks/useProximitySettings";

export function DesktopHeader() {
  const { loading: geoLoading, error: geoError } = useGeolocation();
  const { radius } = useProximitySettings();

  return (
    <header className="mb-6 flex items-center justify-between gap-6 pb-4 border-b border-border">
      {/* Location indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-fit">
        {geoLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Locating...</span>
          </>
        ) : geoError ? (
          <>
            <MapPin className="w-4 h-4 text-accent" />
            <span>{geoError}</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-secondary" />
            <span>Within {radius} mi</span>
          </>
        )}
      </div>

      {/* Search bar - centered */}
      <SearchBar className="max-w-lg flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Quick add button */}
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Share Find</span>
        </Button>

        {/* Notifications */}
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
              <h3 className="font-semibold text-sm">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm font-medium">New find at Union Square!</span>
                <span className="text-xs text-muted-foreground">Sarah Chen shared fresh tomatoes • 2h ago</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm font-medium">Your saved market is open</span>
                <span className="text-xs text-muted-foreground">Grand Army Plaza Market • Just now</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <span className="text-sm font-medium">3 thanks on your find!</span>
                <span className="text-xs text-muted-foreground">Your honey find is popular • 1h ago</span>
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
                <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">JD</AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm font-medium">Jane Doe</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50">
            <div className="p-3 border-b border-border">
              <p className="font-semibold text-sm">Jane Doe</p>
              <p className="text-xs text-muted-foreground">jane@example.com</p>
            </div>
            <DropdownMenuItem className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Bell className="w-4 h-4 mr-2" />
              My Finds
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
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
      </div>
    </header>
  );
}
