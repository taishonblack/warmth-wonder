import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Search markets or items… eggs, honey, bread",
  onSearch,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-all duration-200",
          isFocused
            ? "border-primary/30 shadow-soft-md"
            : "border-border shadow-soft-sm"
        )}
      >
        <Search className="w-5 h-5 text-secondary flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />
      </div>
    </form>
  );
}
