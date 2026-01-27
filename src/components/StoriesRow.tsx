import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StoryUser {
  userId: string;
  name: string;
  avatar: string;
  hasNewContent?: boolean;
}

interface StoriesRowProps {
  users: StoryUser[];
  className?: string;
}

export function StoriesRow({ users, className }: StoriesRowProps) {
  const navigate = useNavigate();

  if (users.length === 0) return null;

  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-3 px-4 py-3">
        {users.map((user) => (
          <button
            key={user.userId}
            onClick={() => navigate(`/u/${user.userId}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full p-[2px]",
                user.hasNewContent
                  ? "bg-gradient-to-tr from-primary via-accent to-secondary"
                  : "bg-border"
              )}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover border-2 border-background"
              />
            </div>
            <span className="text-xs text-foreground max-w-16 truncate">
              {user.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
