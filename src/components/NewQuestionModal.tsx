import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: { title: string; content: string; tags: string[] }) => void;
}

const availableTags = [
  "Union Square",
  "Tips",
  "Honey",
  "Local",
  "Organic",
  "Bread",
  "Artisan",
  "Produce",
  "Dairy",
  "Meat",
];

export function NewQuestionModal({ isOpen, onClose, onSubmit }: NewQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
    });

    // Reset form
    setTitle("");
    setContent("");
    setSelectedTags([]);
    onClose();
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Ask a Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="question-title">Title</Label>
            <Input
              id="question-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="question-content">Details</Label>
            <Textarea
              id="question-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your question..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
              Post Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
