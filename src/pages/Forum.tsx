import { useState } from "react";
import { MessageCircle, Plus, ThumbsUp, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

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

const mockQuestions: Question[] = [
  {
    id: "1",
    author: "Sarah Chen",
    avatar: "https://i.pravatar.cc/150?img=1",
    title: "Best time to visit Union Square Greenmarket?",
    content: "I'm new to the area and wondering when's the best time to go for the freshest produce. Early morning or later in the day?",
    timestamp: "2 hours ago",
    replies: 8,
    likes: 12,
    tags: ["Union Square", "Tips"],
  },
  {
    id: "2",
    author: "Marcus Rivera",
    avatar: "https://i.pravatar.cc/150?img=3",
    title: "Where to find locally sourced honey?",
    content: "Looking for raw, unfiltered honey from local beekeepers. Any recommendations for markets that have good vendors?",
    timestamp: "5 hours ago",
    replies: 15,
    likes: 24,
    tags: ["Honey", "Local"],
  },
  {
    id: "3",
    author: "Emily Watson",
    avatar: "https://i.pravatar.cc/150?img=5",
    title: "Organic certification - how to verify?",
    content: "How do you know if a vendor is truly organic? Are there signs or certifications I should look for at farmers markets?",
    timestamp: "1 day ago",
    replies: 22,
    likes: 45,
    tags: ["Organic", "Tips"],
  },
  {
    id: "4",
    author: "James Kim",
    avatar: "https://i.pravatar.cc/150?img=8",
    title: "Best markets for artisan bread?",
    content: "I'm a bread lover! Which markets have the best sourdough and artisan bread vendors?",
    timestamp: "2 days ago",
    replies: 19,
    likes: 38,
    tags: ["Bread", "Artisan"],
  },
];

export default function Forum() {
  const [questions] = useState<Question[]>(mockQuestions);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = [...new Set(mockQuestions.flatMap((q) => q.tags))];

  const filteredQuestions = activeTag
    ? questions.filter((q) => q.tags.includes(activeTag))
    : questions;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-4 pb-3 px-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-serif text-2xl font-bold text-primary">Forum</h1>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            Ask
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask questions and share knowledge with the community
        </p>
      </header>

      {/* Tags filter */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              !activeTag
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="px-4 py-4 space-y-3">
        {filteredQuestions.map((question) => (
          <button
            key={question.id}
            className="w-full text-left p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors"
          >
            {/* Author */}
            <div className="flex items-center gap-2 mb-2">
              <img
                src={question.avatar}
                alt={question.author}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {question.author}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {question.timestamp}
                </p>
              </div>
            </div>

            {/* Title & Content */}
            <h3 className="font-medium text-foreground mb-1">
              {question.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {question.content}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {question.replies} replies
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {question.likes}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
