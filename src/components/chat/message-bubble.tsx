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
            variant="ghost"
            size="icon"
            className={cn(
              "absolute -top-2 -right-2 size-6 opacity-0 transition-opacity group-hover:opacity-100",
              "bg-background border shadow-sm hover:bg-accent",
            )}
            onClick={() => onFork(id)}
            title="Fork story from here"
          >
            <GitBranch className="size-3" />
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
