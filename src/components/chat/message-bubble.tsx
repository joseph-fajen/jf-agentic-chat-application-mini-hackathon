"use client";

import { Bot, GitBranch, Lightbulb, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { parseAIResponse } from "@/lib/story-parser";
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

  // Parse AI responses into structured sections
  const sections = isUser ? null : parseAIResponse(content);

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

      {isUser ? (
        /* User Direction - Blue bubble */
        <div className="relative max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-md shadow-primary/20">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide opacity-70">
              Direction
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{content}</p>
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
      ) : (
        /* AI Response - Narrative and Prompt sections */
        <div className="relative max-w-[80%] space-y-3">
          {sections?.map((section) => {
            if (section.type === "narrative") {
              return (
                <div
                  key={section.type}
                  className="rounded-2xl bg-muted px-4 py-2.5 text-foreground"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Narrative
                    </span>
                  </div>
                  <MarkdownContent content={section.content} />
                </div>
              );
            }

            if (section.type === "prompt") {
              return (
                <div
                  key={section.type}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-foreground dark:border-amber-400/30 dark:bg-amber-400/10"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <Lightbulb className="size-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Prompt
                    </span>
                  </div>
                  <MarkdownContent content={section.content} />
                </div>
              );
            }

            // Raw/legacy content (no markers)
            return (
              <div key={section.type} className="rounded-2xl bg-muted px-4 py-2.5 text-foreground">
                <MarkdownContent content={section.content} />
              </div>
            );
          })}

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
      )}

      {isUser && (
        <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full">
          <User className="text-primary-foreground size-4" />
        </div>
      )}
    </div>
  );
}
