import { useState } from "react";
import { X, ThumbsUp, Send, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface Question {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  timestamp: string;
  replies: number;
  likes: number;
  tags: string[];
}

interface QuestionDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
}

// Mock replies data
const mockReplies: Record<string, Reply[]> = {
  "1": [
    { id: "r1", author: "Mike Johnson", avatar: "https://i.pravatar.cc/150?img=12", content: "I'd recommend going early around 8-9am for the best selection. The popular vendors sell out fast!", timestamp: "1 hour ago", likes: 8 },
    { id: "r2", author: "Lisa Chen", avatar: "https://i.pravatar.cc/150?img=25", content: "Definitely early morning! But if you want deals, go closer to closing time - some vendors offer discounts.", timestamp: "45 mins ago", likes: 5 },
  ],
  "2": [
    { id: "r3", author: "Tom Wilson", avatar: "https://i.pravatar.cc/150?img=15", content: "Check out Bee Haven at Union Square - they have amazing raw honey from upstate NY!", timestamp: "3 hours ago", likes: 12 },
    { id: "r4", author: "Anna Park", avatar: "https://i.pravatar.cc/150?img=20", content: "Grand Army Plaza has a great beekeeper on Saturdays. Look for the yellow tent!", timestamp: "2 hours ago", likes: 7 },
  ],
  "3": [
    { id: "r5", author: "David Kim", avatar: "https://i.pravatar.cc/150?img=33", content: "Look for the USDA Organic seal or ask vendors directly about their certification.", timestamp: "12 hours ago", likes: 15 },
  ],
  "4": [
    { id: "r6", author: "Rachel Green", avatar: "https://i.pravatar.cc/150?img=44", content: "Bread Alone at Union Square is incredible! Their whole wheat sourdough is my favorite.", timestamp: "1 day ago", likes: 20 },
  ],
};

export function QuestionDetailSheet({ isOpen, onClose, question }: QuestionDetailSheetProps) {
  const [newReply, setNewReply] = useState("");
  const [replies, setReplies] = useState<Reply[]>([]);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  // Load replies when question changes
  useState(() => {
    if (question) {
      setReplies(mockReplies[question.id] || []);
    }
  });

  const handleSubmitReply = () => {
    if (!newReply.trim() || !question) return;
    
    const reply: Reply = {
      id: `new-${Date.now()}`,
      author: "You",
      avatar: "https://i.pravatar.cc/150?img=68",
      content: newReply,
      timestamp: "Just now",
      likes: 0,
    };
    
    setReplies([...replies, reply]);
    setNewReply("");
  };

  const handleLikeReply = (replyId: string) => {
    setLikedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });
  };

  if (!question) return null;

  const questionReplies = mockReplies[question.id] || [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Question</SheetTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Question */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <img
                src={question.avatar}
                alt={question.author}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-foreground">{question.author}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {question.timestamp}
                </p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">{question.title}</h2>
            <p className="text-muted-foreground mb-3">{question.content}</p>
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Replies */}
          <div className="p-4">
            <h3 className="font-medium text-foreground mb-4">
              {questionReplies.length} {questionReplies.length === 1 ? 'Reply' : 'Replies'}
            </h3>
            <div className="space-y-4">
              {questionReplies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <img
                    src={reply.avatar}
                    alt={reply.author}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{reply.author}</p>
                      <p className="text-xs text-muted-foreground">{reply.timestamp}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{reply.content}</p>
                    <button
                      onClick={() => handleLikeReply(reply.id)}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        likedReplies.has(reply.id) 
                          ? "text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {reply.likes + (likedReplies.has(reply.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reply Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[44px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSubmitReply}
              disabled={!newReply.trim()}
              size="icon"
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
