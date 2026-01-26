import { Bell, Plus, MapPin, Loader2, ChevronDown, Settings, LogOut, User, Heart, UserPlus } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShareFindModal } from "@/components/ShareFindModal";

export function DesktopHeader() {
  const { loading: geoLoading, error: geoError } = useGeolocation();
  const { radius } = useProximitySettings();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_find":
        return <Bell className="w-4 h-4 text-secondary" />;
      case "new_follower":
        return <UserPlus className="w-4 h-4 text-primary" />;
      case "thanks":
        return <Heart className="w-4 h-4 text-accent" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case "new_find":
        return {
          title: `${notification.actorName} shared a find`,
          subtitle: notification.findCaption?.substring(0, 50) + "..." || "Check it out!",
        };
      case "new_follower":
        return {
          title: `${notification.actorName} started following you`,
          subtitle: "You have a new follower!",
        };
      case "thanks":
        return {
          title: `${notification.actorName} thanked your find`,
          subtitle: notification.findCaption?.substring(0, 50) + "..." || "Your find is getting love!",
        };
      default:
        return { title: "New notification", subtitle: "" };
    }
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
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
          {user ? (
            <Button size="sm" className="gap-2" onClick={() => setShowShareModal(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Share Find</span>
            </Button>
          ) : (
            <Button size="sm" className="gap-2" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}

          {/* Notifications */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-card border border-border shadow-lg z-50">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => {
                      const message = getNotificationMessage(notification);
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer ${
                            !notification.read ? "bg-blush/30" : ""
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {message.subtitle} • {notification.timestamp}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full text-primary">
                      View all notifications
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User profile dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium">{displayName}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <p className="font-semibold text-sm">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/finds")}>
                  <Bell className="w-4 h-4 mr-2" />
                  My Finds
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-accent" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      <ShareFindModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        isSubscribed={true}
      />
    </>
  );
}
