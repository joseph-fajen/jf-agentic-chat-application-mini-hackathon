"use client";

import { Download } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseAIResponse } from "@/lib/story-parser";

interface Message {
  id: string;
  role: string;
  content: string;
}

interface ExportStoryButtonProps {
  messages: Message[];
  title: string | null;
}

type ExportFormat = "txt" | "md";
type ContentOption = "full" | "ai-only";

function formatMessagesAsText(
  messages: Message[],
  contentOption: ContentOption,
  title: string | null,
): string {
  const storyTitle = title ?? "Untitled Story";
  const lines: string[] = [storyTitle, "=".repeat(storyTitle.length), ""];

  for (const message of messages) {
    if (contentOption === "ai-only" && message.role === "user") {
      continue;
    }

    if (message.role === "user") {
      lines.push("--- DIRECTION ---", "", message.content, "");
    } else {
      const sections = parseAIResponse(message.content);
      for (const section of sections) {
        if (section.type === "narrative") {
          lines.push("--- NARRATIVE ---", "", section.content, "");
        } else if (section.type === "prompt") {
          lines.push("--- PROMPT ---", "", section.content, "");
        } else {
          // Raw/legacy content
          lines.push(section.content, "");
        }
      }
    }
  }

  return lines.join("\n");
}

function formatMessagesAsMarkdown(
  messages: Message[],
  contentOption: ContentOption,
  title: string | null,
): string {
  const storyTitle = title ?? "Untitled Story";
  const lines: string[] = [`# ${storyTitle}`, ""];

  for (const message of messages) {
    if (contentOption === "ai-only" && message.role === "user") {
      continue;
    }

    if (message.role === "user") {
      lines.push("### 📝 Direction", "", `> ${message.content}`, "");
    } else {
      const sections = parseAIResponse(message.content);
      for (const section of sections) {
        if (section.type === "narrative") {
          lines.push("### 📖 Narrative", "", section.content, "");
        } else if (section.type === "prompt") {
          lines.push("### 💭 Prompt", "", `*${section.content}*`, "");
        } else {
          // Raw/legacy content
          lines.push(section.content, "");
        }
      }
    }
  }

  return lines.join("\n");
}

function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(title: string | null): string {
  const base = title ?? "untitled-story";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function ExportStoryButton({ messages, title }: ExportStoryButtonProps) {
  const [format, setFormat] = useState<ExportFormat>("md");
  const [contentOption, setContentOption] = useState<ContentOption>("full");

  const handleExport = useCallback(() => {
    const filename = `${sanitizeFilename(title)}.${format}`;
    const content =
      format === "md"
        ? formatMessagesAsMarkdown(messages, contentOption, title)
        : formatMessagesAsText(messages, contentOption, title);

    downloadFile(content, filename);
  }, [messages, title, format, contentOption]);

  const hasContent = messages.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={!hasContent} title="Export story">
          <Download className="size-4" />
          <span className="sr-only">Export story</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
          <DropdownMenuRadioItem value="md">Markdown (.md)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="txt">Plain Text (.txt)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Content</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={contentOption}
          onValueChange={(v) => setContentOption(v as ContentOption)}
        >
          <DropdownMenuRadioItem value="full">Include my prompts</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ai-only">AI responses only</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button onClick={handleExport} className="w-full" size="sm">
            <Download className="mr-2 size-4" />
            Download
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
