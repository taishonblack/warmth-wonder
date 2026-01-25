import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="font-serif text-lg font-semibold text-foreground">
        {title}
      </h2>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-0.5 text-sm text-secondary hover:text-primary transition-colors"
        >
          {action.label}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
