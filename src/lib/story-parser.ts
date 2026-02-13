/**
 * Story content parser - extracts structured layers from AI responses.
 *
 * Layers:
 * - Direction: User's input that steers the narrative
 * - Narrative: AI-generated story prose
 * - Prompt: AI's question guiding the user to the next beat
 */

export interface StorySection {
  type: "narrative" | "prompt" | "raw";
  content: string;
}

/**
 * Parse an AI response into structured sections.
 * Handles responses with [NARRATIVE] and [PROMPT] markers.
 * Falls back to treating entire content as "raw" if no markers found.
 */
export function parseAIResponse(content: string): StorySection[] {
  const sections: StorySection[] = [];

  // Try to extract [NARRATIVE] content
  const narrativeMatch = content.match(/\[NARRATIVE\]([\s\S]*?)\[\/NARRATIVE\]/i);
  // Try to extract [PROMPT] content
  const promptMatch = content.match(/\[PROMPT\]([\s\S]*?)\[\/PROMPT\]/i);

  // If we found structured markers, use them
  if (narrativeMatch || promptMatch) {
    if (narrativeMatch) {
      const narrativeContent = narrativeMatch[1]?.trim();
      if (narrativeContent) {
        sections.push({ type: "narrative", content: narrativeContent });
      }
    }

    if (promptMatch) {
      const promptContent = promptMatch[1]?.trim();
      if (promptContent) {
        sections.push({ type: "prompt", content: promptContent });
      }
    }

    return sections;
  }

  // No markers found - return as raw content (legacy messages)
  return [{ type: "raw", content: content.trim() }];
}

/**
 * Check if content has structured markers
 */
export function hasStructuredMarkers(content: string): boolean {
  return /\[NARRATIVE\]/i.test(content) || /\[PROMPT\]/i.test(content);
}
