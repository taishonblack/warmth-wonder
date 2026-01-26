import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "new_find" | "new_follower" | "thanks";
  actorId: string | null;
  actorName: string;
  actorAvatar: string;
  findId: string | null;
  findCaption: string | null;
  read: boolean;
  createdAt: Date;
  timestamp: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!notificationsData || notificationsData.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get actor profiles
      const actorIds = [...new Set(notificationsData.map(n => n.actor_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", actorIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      // Get find captions
      const findIds = [...new Set(notificationsData.map(n => n.find_id).filter(Boolean))];
      const { data: findsData } = await supabase
        .from("finds")
        .select("id, caption")
        .in("id", findIds);

      const findsMap = new Map(
        findsData?.map(f => [f.id, f.caption]) || []
      );

      const formattedNotifications: Notification[] = notificationsData.map(n => {
        const profile = n.actor_id ? profilesMap.get(n.actor_id) : null;
        const createdAt = new Date(n.created_at);

        return {
          id: n.id,
          type: n.type as Notification["type"],
          actorId: n.actor_id,
          actorName: profile?.display_name || "Someone",
          actorAvatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${n.actor_id}`,
          findId: n.find_id,
          findCaption: n.find_id ? findsMap.get(n.find_id) || null : null,
          read: n.read,
          createdAt,
          timestamp: formatTimestamp(createdAt),
        };
      });

      setNotifications(formattedNotifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error: any) {
      console.error("Error marking all as read:", error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchNotifications();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      fetchNotifications();
    });

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (payload.new && (payload.new as any).user_id === user?.id) {
            // Fetch the full notification with actor info
            await fetchNotifications();
            
            toast({
              title: "New notification",
              description: getNotificationMessage(payload.new as any),
            });
          }
        }
      )
      .subscribe();

    return () => {
      authSubscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationMessage(notification: any): string {
  switch (notification.type) {
    case "new_find":
      return "Someone you follow shared a new find!";
    case "new_follower":
      return "You have a new follower!";
    case "thanks":
      return "Someone thanked your find!";
    default:
      return "You have a new notification";
  }
}
