import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface FollowUser {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

interface FollowListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

export function FollowListSheet({ isOpen, onClose, userId, type }: FollowListSheetProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Get the list of user IDs based on type
        let userIds: string[] = [];

        if (type === "followers") {
          const { data } = await supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", userId);
          userIds = data?.map(f => f.follower_id) || [];
        } else {
          const { data } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", userId);
          userIds = data?.map(f => f.following_id) || [];
        }

        if (userIds.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // Fetch profiles for these users
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const fetchedUsers: FollowUser[] = userIds.map(id => {
          const profile = profiles?.find(p => p.user_id === id);
          return {
            id,
            name: profile?.display_name || "User",
            avatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${id}`,
          };
        });

        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching follow list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  const handleUserClick = (targetUserId: string) => {
    onClose();
    navigate(`/u/${targetUserId}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-serif text-xl">
            {type === "followers" ? "Followers" : "Following"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{type === "followers" ? "No followers yet" : "Not following anyone yet"}</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[calc(70vh-100px)]">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{user.name}</p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
