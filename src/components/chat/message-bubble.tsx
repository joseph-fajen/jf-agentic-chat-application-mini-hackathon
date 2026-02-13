"use client";

import { Bot, GitBranch, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MarkdownContent } from "./markdown-content";

interface MessageBubbleProps {
  id: string;
  role: string;
  content: string;
  onFork?: ((messageId: string) => void) | undefined;
}

export function MessageBubble({ id, role, content, onFork }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="bg-muted ring-primary/20 flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
          <Bot className="text-muted-foreground size-4" />
        </div>
      )}
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
            : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <MarkdownContent content={content} />
        )}
        {onFork && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "absolute -bottom-3 right-2 h-7 gap-1.5 px-2.5",
              "bg-background text-muted-foreground hover:text-primary hover:border-primary",
              "opacity-60 transition-all group-hover:opacity-100",
            )}
            onClick={() => onFork(id)}
          >
            <GitBranch className="size-3.5" />
            <span className="text-xs font-medium">Fork</span>
          </Button>
        )}
      </div>
      {isUser && (
        <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full">
          <User className="text-primary-foreground size-4" />
        </div>
      )}
    </div>
  );
}
