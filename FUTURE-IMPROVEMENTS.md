# Future Improvements: Branching Stories

This document captures potential improvements, technical considerations, and enhancement ideas for the Branching Stories collaborative writing application.

---

## Current Architecture Overview

### Data Flow
```
User Input → React State → POST /api/chat/send → Postgres (Supabase)
                                    ↓
                              OpenRouter API
                                    ↓
                          SSE Stream → UI Update → Save to Postgres
```

### Storage Layers

| Layer | Purpose | Current Implementation |
|-------|---------|----------------------|
| **Postgres** | Persistent storage for all messages and conversations | `jf_chat_conversations`, `jf_chat_messages` tables |
| **LocalStorage** | Conversation list cache (ID, title, updatedAt) | `useLocalStorage` hook |
| **React State** | Active conversation messages | `useChat` hook |
| **AI Context** | Messages sent to model | Last 50 messages (`MAX_CONTEXT_MESSAGES`) |

### Key Files
- `src/features/chat/constants.ts` - AI context limits, system prompt
- `src/features/chat/service.ts` - Business logic for conversations/messages
- `src/features/chat/repository.ts` - Database operations
- `src/hooks/use-chat.ts` - Client-side state management
- `src/lib/story-parser.ts` - Layer extraction from AI responses

---

## Known Limitations

### 1. AI Context Window (Priority: High)

**Current Behavior**: Only the last 50 messages are sent to the AI model.

**Impact**: After ~25 back-and-forth exchanges, the AI loses awareness of:
- Characters introduced early in the story
- Plot points and foreshadowing
- Established tone, setting, world-building rules
- User's stylistic preferences

**Location**: `src/features/chat/constants.ts`
```typescript
export const MAX_CONTEXT_MESSAGES = 50;
```

### 2. Browser Performance with Long Conversations

**Current Behavior**: All messages for the active conversation are loaded into React state at once.

**Impact**: Conversations with 500+ messages may experience:
- Slow initial render
- Sluggish scrolling
- High memory usage (problematic on mobile)

**Location**: `src/hooks/use-chat.ts` - `fetchMessages` loads all messages

### 3. No Conversation Cleanup/Archival

**Current Behavior**: All conversations persist indefinitely.

**Impact**:
- Database storage grows unbounded
- Sidebar becomes cluttered over time
- No way to "finish" or archive a completed story

### 4. LocalStorage Sync

**Current Behavior**: Conversation list is cached in LocalStorage but fetched from database.

**Impact**: If LocalStorage is cleared, sidebar appears empty until conversations are re-fetched or created.

**Location**: `src/hooks/use-local-storage.ts`

---

## Proposed Improvements

### Phase 1: Visibility & Awareness (Low Effort)

#### 1.1 Message Counter
Display current message count and context window status in the UI.

**Implementation**:
```typescript
// In chat-header.tsx or new component
interface ContextIndicatorProps {
  messageCount: number;
  maxContext: number; // 50
}

function ContextIndicator({ messageCount, maxContext }: ContextIndicatorProps) {
  const inContext = Math.min(messageCount, maxContext);
  const lostContext = Math.max(0, messageCount - maxContext);

  return (
    <div className="text-xs text-muted-foreground">
      {messageCount} messages ({lostContext > 0 ? `${lostContext} beyond AI memory` : 'all in context'})
    </div>
  );
}
```

**Files to modify**:
- `src/components/chat/chat-header.tsx`
- `src/components/chat/chat-layout.tsx` (pass message count)

#### 1.2 Story Statistics
Show word count, estimated reading time, and layer breakdown.

**Implementation**:
```typescript
interface StoryStats {
  totalWords: number;
  narrativeWords: number;
  directionWords: number;
  estimatedReadingMinutes: number;
  messageCount: number;
  forkCount: number;
}

function calculateStoryStats(messages: Message[]): StoryStats {
  // Parse messages, count words per layer, calculate reading time
}
```

### Phase 2: Context Management (Medium Effort)

#### 2.1 Rolling Summary

Periodically summarize older content to maintain story continuity without sending all messages.

**Approach**:
1. When message count exceeds threshold (e.g., 40), generate summary of oldest messages
2. Store summary as special message type or conversation metadata
3. Include summary + recent messages in AI context

**Schema Change**:
```sql
ALTER TABLE jf_chat_conversations
ADD COLUMN story_summary TEXT,
ADD COLUMN summary_up_to_message_id UUID;
```

**New Service Function**:
```typescript
// src/features/chat/service.ts
export async function generateStorySummary(conversationId: string): Promise<string> {
  const messages = await repository.findMessagesByConversationId(conversationId);
  const oldMessages = messages.slice(0, -20); // Keep last 20 for context

  // Call AI to summarize oldMessages
  const summary = await summarizeWithAI(oldMessages);

  await repository.updateConversation(conversationId, {
    storySummary: summary,
    summaryUpToMessageId: oldMessages[oldMessages.length - 1].id
  });

  return summary;
}
```

**Modified Context Building**:
```typescript
// src/features/chat/stream.ts
export function buildMessages(history: Message[], summary?: string): ChatMessage[] {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (summary) {
    messages.push({
      role: "system",
      content: `Story so far (summary): ${summary}`
    });
  }

  // Add recent messages
  const recentHistory = history.slice(-MAX_CONTEXT_MESSAGES);
  messages.push(...recentHistory.map(m => ({ role: m.role, content: m.content })));

  return messages;
}
```

#### 2.2 Key Facts Extraction

Extract and persist important story elements (characters, locations, plot points).

**Schema**:
```sql
CREATE TABLE jf_story_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES jf_chat_conversations(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL, -- 'character', 'location', 'plot_point', 'theme'
  name TEXT NOT NULL,
  description TEXT,
  first_mentioned_message_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Usage**: Include relevant story elements in system prompt for consistency.

### Phase 3: Performance Optimization (Medium Effort)

#### 3.1 Message Pagination / Virtualization

Load messages in chunks rather than all at once.

**Approach A - Pagination**:
```typescript
// src/features/chat/repository.ts
export async function findMessagesByConversationId(
  conversationId: string,
  options?: { limit?: number; offset?: number; before?: Date }
): Promise<Message[]> {
  let query = db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt));

  if (options?.before) {
    query = query.where(lt(messages.createdAt, options.before));
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  return query;
}
```

**Approach B - Virtualized List**:
Use `@tanstack/react-virtual` or similar for rendering only visible messages.

```typescript
// src/components/chat/message-list.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated message height
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <MessageBubble
            key={messages[virtualItem.index].id}
            {...messages[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 Optimistic Updates

Show user messages immediately without waiting for database confirmation.

**Current**: Message appears after API call completes.
**Improved**: Message appears instantly, syncs in background.

Already partially implemented in `use-chat.ts` with `makeTempMessage`.

### Phase 4: Story Management (Medium Effort)

#### 4.1 Conversation States

Add lifecycle states to conversations.

**Schema Change**:
```sql
ALTER TABLE jf_chat_conversations
ADD COLUMN status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'completed', 'archived'));
```

**UI Changes**:
- Filter sidebar by status
- "Complete Story" action that marks as completed
- "Archive" moves to archived state
- Archived stories hidden by default

#### 4.2 Branch Tree Visualization

Visual representation of story branches.

**Data Structure**:
```typescript
interface BranchNode {
  conversationId: string;
  title: string;
  messageCount: number;
  children: BranchNode[];
  forkPoint?: {
    messageId: string;
    messagePreview: string;
  };
}

async function buildBranchTree(rootConversationId: string): Promise<BranchNode> {
  const conversation = await getConversation(rootConversationId);
  const children = await repository.findChildConversations(rootConversationId);

  return {
    conversationId: conversation.id,
    title: conversation.title,
    messageCount: await repository.countMessages(conversation.id),
    children: await Promise.all(children.map(c => buildBranchTree(c.id))),
    forkPoint: conversation.branchFromMessageId ? {
      messageId: conversation.branchFromMessageId,
      messagePreview: await getMessagePreview(conversation.branchFromMessageId)
    } : undefined
  };
}
```

**UI Component**: Tree view using `react-arborist` or custom SVG visualization.

#### 4.3 Story Merging

Combine content from multiple branches.

**Complexity**: High - requires conflict resolution strategy.

**Simpler Alternative**: "Copy from branch" - import selected messages from another branch into current story.

### Phase 5: Export Enhancements (Low-Medium Effort)

#### 5.1 Additional Export Formats

- **PDF**: Using `@react-pdf/renderer` or server-side generation
- **EPUB**: For e-readers
- **HTML**: Styled, self-contained document
- **JSON**: Full data export for backup/migration

#### 5.2 Export Options

```typescript
interface ExportOptions {
  format: 'txt' | 'md' | 'pdf' | 'epub' | 'html' | 'json';
  content: 'full' | 'narrative-only' | 'ai-only';
  includeLayers: boolean;      // Show Direction/Narrative/Prompt headers
  includeMetadata: boolean;    // Title, date, word count
  includeBranches: boolean;    // Export entire branch tree
  styling: 'minimal' | 'styled';
}
```

#### 5.3 Selective Export

Allow users to select specific message ranges or highlight "favorite" passages for export.

### Phase 6: Collaboration Features (High Effort)

#### 6.1 Shareable Story Links

Generate public links to read-only story views.

**Schema**:
```sql
ALTER TABLE jf_chat_conversations
ADD COLUMN share_token TEXT UNIQUE,
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
```

**New Route**: `/story/[shareToken]` - Public read-only view.

#### 6.2 Multi-Author Collaboration

Real-time collaboration on stories.

**Technical Requirements**:
- WebSocket or Server-Sent Events for real-time sync
- Operational transformation or CRDT for conflict resolution
- User presence indicators
- Turn-taking or free-form modes

**Recommendation**: Consider this a v2.0 feature requiring significant architecture changes.

---

## Technical Debt & Cleanup

### Code Complexity Warnings

Current Biome warnings for excessive complexity:
- `src/hooks/use-chat.ts:readSSEStream` (complexity: 24, max: 15)
- `src/hooks/use-chat.ts:sendMessage` (complexity: 31, max: 15)
- `src/components/chat/export-story-button.tsx:formatMessagesAsText` (complexity: 20, max: 15)
- `src/components/chat/export-story-button.tsx:formatMessagesAsMarkdown` (complexity: 20, max: 15)

**Recommendation**: Refactor these functions by extracting smaller helper functions.

### Test Coverage

Current areas lacking test coverage:
- `src/lib/story-parser.ts` - Add unit tests for edge cases
- `src/components/chat/export-story-button.tsx` - Test export formatting
- `src/components/chat/message-bubble.tsx` - Test layer rendering

### TypeScript Improvements

- Consider extracting shared `Message` interface to avoid duplication
- Add stricter typing for AI response parsing

---

## Implementation Priority Matrix

| Improvement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Message counter | Low | Medium | P1 |
| Story statistics | Low | Medium | P1 |
| Rolling summary | Medium | High | P1 |
| Message virtualization | Medium | Medium | P2 |
| Conversation states | Low | Medium | P2 |
| Key facts extraction | Medium | High | P2 |
| Branch tree visualization | Medium | Medium | P3 |
| Additional export formats | Medium | Low | P3 |
| Shareable links | Medium | Medium | P3 |
| Multi-author collaboration | High | High | P4 (v2.0) |

---

## Environment & Deployment Notes

### Current Setup
- **Database**: Supabase Postgres with `TABLE_PREFIX=jf_`
- **AI Provider**: OpenRouter (configurable model via `OPENROUTER_MODEL`)
- **Hosting**: Vercel
- **Auth**: Supabase Auth (optional - chat works without login)

### Scaling Considerations
- Database connection pooling already configured (`prepare: false`)
- Consider edge functions for lower latency
- Monitor OpenRouter usage/costs as user base grows

---

## Appendix: Related PRD Goals

From `PRD.md`, features marked as "Out of Scope (Future)":
- ❌ Tree visualization of all branches → See Phase 4.2
- ❌ Side-by-side branch comparison view
- ❌ Merging branches back together → See Phase 4.3
- ❌ Branch renaming UI
- ❌ Sharing/exporting branch trees → See Phase 5, 6.1
- ❌ Branch search/filtering

---

*Last updated: 2024-02-13*
*Document maintainer: Development Team*
