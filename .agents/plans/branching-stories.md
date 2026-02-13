# Feature: Branching Stories

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Transform the AI chat application into a collaborative storytelling tool with branching narratives. Users can fork any conversation at any message point to explore alternate storylines, creating a tree of possibilities rather than a single linear conversation. The experience is story-focused with appropriate UI copy and a storytelling-oriented system prompt.

## User Story

As a creative writer
I want to fork my story at any message
So that I can explore alternate narrative directions without losing my current storyline

## Problem Statement

Writers using AI for collaborative storytelling often wonder "what if the story went differently?" Currently, exploring alternate paths means losing the original storyline or manually copying content.

## Solution Statement

Add conversation forking that copies all messages up to a fork point into a new conversation branch. The sidebar shows branch relationships, and the entire experience uses story-focused language to guide users toward narrative creation.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Database schema, chat feature (repository, service, schemas, errors), chat UI components, API routes, useChat hook
**Dependencies**: None (uses existing stack)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ THESE BEFORE IMPLEMENTING!

**Database Layer:**
- `src/core/database/schema.ts` (lines 66-74) - Current `chatConversations` table definition, add branch fields here
- `scripts/setup-db.ts` (lines 65-73) - SQL setup for chat_conversations, add branch columns here

**Feature Layer (chat):**
- `src/features/chat/models.ts` - Re-exports tables and types, types auto-update from schema
- `src/features/chat/repository.ts` - Database queries pattern, add fork functions here
- `src/features/chat/service.ts` - Business logic pattern, add forkConversation here
- `src/features/chat/schemas.ts` - Zod validation pattern, add ForkConversationSchema
- `src/features/chat/errors.ts` - Error class pattern, add MessageNotFoundError
- `src/features/chat/index.ts` - Public exports, add new exports here
- `src/features/chat/constants.ts` - SYSTEM_PROMPT to replace with storytelling version

**API Layer:**
- `src/app/api/chat/conversations/[id]/route.ts` - API route pattern to follow exactly

**UI Layer:**
- `src/components/chat/message-bubble.tsx` - Add fork button here
- `src/components/chat/message-list.tsx` (line 48-49) - Renders MessageBubble, pass onFork prop
- `src/components/chat/chat-layout.tsx` (lines 15-27, 79-83) - Main layout, destructure forkConversation and pass to MessageList
- `src/components/chat/chat-sidebar.tsx` (line 49) - "New Chat" button, change to "New Story"
- `src/components/chat/conversation-item.tsx` - Dropdown menu pattern, may add branch icon

**Hook:**
- `src/hooks/use-chat.ts` - Add forkConversation action

### New Files to Create

- `src/app/api/chat/conversations/[id]/fork/route.ts` - Fork API endpoint

### Patterns to Follow

**API Route Pattern** (from `src/app/api/chat/conversations/[id]/route.ts`):
```typescript
import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = SomeSchema.parse(body);

    logger.info({ id }, "action_started");
    const result = await serviceFunction(id, validated);
    logger.info({ id }, "action_completed");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Service Pattern** (from `src/features/chat/service.ts`):
```typescript
const logger = getLogger("chat.service");

export async function someFunction(input: Input): Promise<Output> {
  logger.info({ ...context }, "action_started");

  // Validate, call repository, apply business logic
  const result = await repository.someQuery(data);

  if (!result) {
    throw new SomeNotFoundError(id);
  }

  logger.info({ ...context }, "action_completed");
  return result;
}
```

**Repository Pattern** (from `src/features/chat/repository.ts`):
```typescript
export async function someQuery(data: Input): Promise<Output | undefined> {
  const results = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return results[0];
}
```

**Error Pattern** (from `src/features/chat/errors.ts`):
```typescript
export class SomeNotFoundError extends ChatError {
  constructor(id: string) {
    super(`Resource not found: ${id}`, "RESOURCE_NOT_FOUND", 404);
  }
}
```

**Schema Pattern** (from `src/features/chat/schemas.ts`):
```typescript
import { z } from "zod/v4";

export const SomeSchema = z.object({
  field: z.string().uuid(),
});

export type SomeInput = z.infer<typeof SomeSchema>;
```

**Naming Conventions:**
- Tables: snake_case in SQL, camelCase in TypeScript (`chat_conversations` → `chatConversations`)
- Files: kebab-case (`message-bubble.tsx`)
- Functions: camelCase (`forkConversation`)
- Types: PascalCase (`Conversation`, `NewConversation`)
- Error classes: PascalCase with Error suffix (`MessageNotFoundError`)

**Import Conventions:**
- Use path aliases: `@/core/`, `@/features/`, `@/components/`
- Import Zod from `zod/v4`
- Use `type` keyword for type-only imports

---

## IMPLEMENTATION PLAN

### Phase 1: Database & Schema (Foundation)

Add branch tracking columns to the conversations table and update the setup script.

**Tasks:**
- Add `parentConversationId` and `branchFromMessageId` columns to schema
- Update setup-db.ts with new columns
- Add new error class for message not found
- Add ForkConversationSchema for validation

### Phase 2: Repository & Service (Core Logic)

Implement the fork operation at the data and business logic layers.

**Tasks:**
- Add repository functions for fork operation
- Add forkConversation service function
- Export new functions from index.ts

### Phase 3: API Endpoint

Create the fork API endpoint.

**Tasks:**
- Create fork route handler
- Follow existing API patterns exactly

### Phase 4: Story-Focused Experience

Update system prompt and UI copy for storytelling emphasis.

**Tasks:**
- Replace SYSTEM_PROMPT with storytelling version
- Update UI copy throughout

### Phase 5: UI Components

Add fork button and branch visualization.

**Tasks:**
- Add fork button to message bubble
- Update sidebar for branch display
- Add forkConversation to useChat hook

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Phase 1: Database & Schema

---

### UPDATE `src/core/database/schema.ts`

- **IMPLEMENT**: Add `parentConversationId` and `branchFromMessageId` columns to `chatConversations` table
- **PATTERN**: Follow existing column patterns in same file (lines 70-73)
- **DETAILS**:
  - `parentConversationId`: uuid, nullable, self-references chatConversations.id
  - `branchFromMessageId`: uuid, nullable, references chatMessages.id
  - Both nullable because root conversations have no parent
- **GOTCHA**: Self-reference requires function syntax: `.references(() => chatConversations.id)`
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add after line 73 (before ...timestamps):
parentConversationId: uuid("parent_conversation_id").references(() => chatConversations.id, {
  onDelete: "set null",
}),
branchFromMessageId: uuid("branch_from_message_id").references(() => chatMessages.id, {
  onDelete: "set null",
}),
```

---

### UPDATE `scripts/setup-db.ts`

- **IMPLEMENT**: Add branch columns to chat_conversations CREATE TABLE
- **PATTERN**: Follow existing column patterns (lines 65-73)
- **DETAILS**: Add after "title" column, before timestamps
- **GOTCHA**: Use `"${p("chat_conversations")}"` for self-reference, `"${p("chat_messages")}"` for message reference
- **VALIDATE**: `bun run db:setup` (will show table creation)

```sql
"parent_conversation_id" uuid REFERENCES "${p("chat_conversations")}"("id") ON DELETE SET NULL,
"branch_from_message_id" uuid REFERENCES "${p("chat_messages")}"("id") ON DELETE SET NULL,
```

---

### UPDATE `src/features/chat/errors.ts`

- **IMPLEMENT**: Add `MessageNotFoundError` class and update `ChatErrorCode` type
- **PATTERN**: Follow `ConversationNotFoundError` pattern (lines 21-25)
- **IMPORTS**: None needed, uses existing imports
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add to ChatErrorCode type:
| "MESSAGE_NOT_FOUND"
| "MESSAGE_NOT_IN_CONVERSATION"

// Add new error classes:
export class MessageNotFoundError extends ChatError {
  constructor(id: string) {
    super(`Message not found: ${id}`, "MESSAGE_NOT_FOUND", 404);
  }
}

export class MessageNotInConversationError extends ChatError {
  constructor(messageId: string, conversationId: string) {
    super(
      `Message ${messageId} does not belong to conversation ${conversationId}`,
      "MESSAGE_NOT_IN_CONVERSATION",
      400,
    );
  }
}
```

---

### UPDATE `src/features/chat/schemas.ts`

- **IMPLEMENT**: Add `ForkConversationSchema` for validating fork requests
- **PATTERN**: Follow existing schema patterns (lines 3-11)
- **IMPORTS**: Already has `z` from `zod/v4`
- **VALIDATE**: `npx tsc --noEmit`

```typescript
export const ForkConversationSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
});

export type ForkConversationInput = z.infer<typeof ForkConversationSchema>;
```

---

### Phase 2: Repository & Service

---

### UPDATE `src/features/chat/repository.ts`

- **IMPLEMENT**: Add `findMessageById`, `findMessagesUpToId`, and `createConversationWithMessages` functions
- **PATTERN**: Follow existing query patterns (lines 8-63)
- **IMPORTS**: Add `lte` from `drizzle-orm` for less-than-or-equal comparison
- **DETAILS**:
  - `findMessageById`: Simple lookup by ID
  - `findMessagesUpToId`: Get messages up to and including a specific message (by createdAt)
  - `createConversationWithMessages`: Create conversation and bulk insert messages atomically
- **GOTCHA**: Use `lte` for `createdAt` comparison to get messages up to fork point
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add to imports:
import { asc, eq, and, lte } from "drizzle-orm";

// Add functions:
export async function findMessageById(id: string): Promise<Message | undefined> {
  const results = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return results[0];
}

export async function findMessagesUpToId(
  conversationId: string,
  messageId: string,
  messageCreatedAt: Date,
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        lte(messages.createdAt, messageCreatedAt),
      ),
    )
    .orderBy(asc(messages.createdAt));
}

export async function createConversationWithMessages(
  conversationData: NewConversation & {
    parentConversationId?: string;
    branchFromMessageId?: string;
  },
  messagesToCopy: Array<{ role: string; content: string }>,
): Promise<Conversation> {
  const conversationResults = await db
    .insert(conversations)
    .values(conversationData)
    .returning();
  const conversation = conversationResults[0];

  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  if (messagesToCopy.length > 0) {
    await db.insert(messages).values(
      messagesToCopy.map((m) => ({
        conversationId: conversation.id,
        role: m.role,
        content: m.content,
      })),
    );
  }

  return conversation;
}
```

---

### UPDATE `src/features/chat/service.ts`

- **IMPLEMENT**: Add `forkConversation` function
- **PATTERN**: Follow existing service patterns (lines 9-87)
- **IMPORTS**: Add new error classes and repository functions
- **DETAILS**:
  1. Get source conversation (verify exists)
  2. Get fork message (verify exists and belongs to conversation)
  3. Get all messages up to fork point
  4. Create new conversation with branch metadata and copied messages
  5. Return new conversation
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add to imports from ./errors:
import {
  ConversationNotFoundError,
  MessageNotFoundError,
  MessageNotInConversationError,
} from "./errors";

// Add function:
export async function forkConversation(
  conversationId: string,
  messageId: string,
): Promise<Conversation> {
  logger.info({ conversationId, messageId }, "conversation.fork_started");

  // Verify source conversation exists
  const sourceConversation = await repository.findConversationById(conversationId);
  if (!sourceConversation) {
    logger.warn({ conversationId }, "conversation.fork_failed_not_found");
    throw new ConversationNotFoundError(conversationId);
  }

  // Verify message exists
  const forkMessage = await repository.findMessageById(messageId);
  if (!forkMessage) {
    logger.warn({ messageId }, "conversation.fork_failed_message_not_found");
    throw new MessageNotFoundError(messageId);
  }

  // Verify message belongs to conversation
  if (forkMessage.conversationId !== conversationId) {
    logger.warn({ messageId, conversationId }, "conversation.fork_failed_message_mismatch");
    throw new MessageNotInConversationError(messageId, conversationId);
  }

  // Get messages up to fork point
  const messagesToCopy = await repository.findMessagesUpToId(
    conversationId,
    messageId,
    forkMessage.createdAt,
  );

  // Create branch title
  const branchTitle = sourceConversation.title.includes("(branch)")
    ? sourceConversation.title
    : `${sourceConversation.title} (branch)`;

  // Create new conversation with copied messages
  const newConversation = await repository.createConversationWithMessages(
    {
      title: branchTitle,
      parentConversationId: conversationId,
      branchFromMessageId: messageId,
    },
    messagesToCopy.map((m) => ({ role: m.role, content: m.content })),
  );

  logger.info(
    {
      conversationId,
      newConversationId: newConversation.id,
      messagesCopied: messagesToCopy.length,
    },
    "conversation.fork_completed",
  );

  return newConversation;
}
```

---

### UPDATE `src/features/chat/index.ts`

- **IMPLEMENT**: Export new schemas, errors, and service function
- **PATTERN**: Follow existing export groupings
- **VALIDATE**: `npx tsc --noEmit`

```typescript
// Add to error exports:
export {
  ChatError,
  ConversationNotFoundError,
  MessageNotFoundError,
  MessageNotInConversationError,
  OpenRouterError,
  StreamError,
} from "./errors";

// Add to schema exports:
export {
  CreateConversationSchema,
  ForkConversationSchema,
  SendMessageSchema,
  UpdateConversationSchema,
} from "./schemas";

// Add to type exports:
export type {
  CreateConversationInput,
  ForkConversationInput,
  SendMessageInput,
  UpdateConversationInput,
} from "./schemas";

// Add to service exports:
export {
  addMessage,
  createConversation,
  deleteConversation,
  forkConversation,
  generateTitleFromMessage,
  getConversation,
  getMessages,
  updateConversation,
} from "./service";
```

---

### Phase 3: API Endpoint

---

### CREATE `src/app/api/chat/conversations/[id]/fork/route.ts`

- **IMPLEMENT**: POST endpoint for forking conversations
- **PATTERN**: Mirror `src/app/api/chat/conversations/[id]/route.ts` exactly
- **IMPORTS**: Use `@/features/chat` for schema and service
- **VALIDATE**: `npx tsc --noEmit`

```typescript
import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { ForkConversationSchema, forkConversation } from "@/features/chat";

const logger = getLogger("api.chat.conversations.fork");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/chat/conversations/[id]/fork
 * Fork a conversation at a specific message, creating a new branch.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { messageId } = ForkConversationSchema.parse(body);

    logger.info({ conversationId: id, messageId }, "fork.request_started");

    const newConversation = await forkConversation(id, messageId);

    logger.info(
      { conversationId: id, newConversationId: newConversation.id },
      "fork.request_completed",
    );

    return NextResponse.json({ conversation: newConversation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### Phase 4: Story-Focused Experience

---

### UPDATE `src/features/chat/constants.ts`

- **IMPLEMENT**: Replace generic SYSTEM_PROMPT with storytelling-focused version
- **DETAILS**: Guide AI toward collaborative storytelling while remaining flexible
- **VALIDATE**: `npx tsc --noEmit`

```typescript
export const SYSTEM_PROMPT = `You are a collaborative storytelling partner. Help the user craft engaging narratives by:

- Building on their ideas and expanding the story naturally
- Creating vivid descriptions, dialogue, and scene details
- Suggesting plot developments while respecting their creative direction
- Maintaining consistency with established characters and settings
- Asking clarifying questions when the story direction is unclear

Write in a style that matches the tone they establish. Be creative but let them lead.`;

export const MAX_CONTEXT_MESSAGES = 50;
```

---

### UPDATE `src/components/chat/chat-sidebar.tsx`

- **IMPLEMENT**: Change "New Chat" to "New Story" and update empty state message
- **PATTERN**: Simple text changes
- **VALIDATE**: `bun run lint && npx tsc --noEmit`

```typescript
// Line 49: Change button text
<Plus className="size-4" />
New Story

// Lines 54-56: Change empty state
<MessageSquare className="size-8 opacity-50" />
<p>No stories yet</p>
```

---

### Phase 5: UI Components

---

### UPDATE `src/components/chat/message-bubble.tsx`

- **IMPLEMENT**: Add fork button that appears on hover
- **IMPORTS**: Add `GitBranch` from lucide-react, add `Button` from ui
- **PATTERN**: Similar to dropdown trigger in `conversation-item.tsx`
- **DETAILS**:
  - Fork button appears on hover (group-hover pattern)
  - Position at top-right of message
  - Calls onFork callback with message ID
- **GOTCHA**: Need to add `id` prop and `onFork` callback to interface
- **VALIDATE**: `bun run lint && npx tsc --noEmit`

```typescript
"use client";

import { Bot, GitBranch, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MarkdownContent } from "./markdown-content";

interface MessageBubbleProps {
  id: string;
  role: string;
  content: string;
  onFork?: (messageId: string) => void;
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
            size="icon-sm"
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
```

---

### UPDATE `src/hooks/use-chat.ts`

- **IMPLEMENT**: Add `forkConversation` function to the hook
- **PATTERN**: Follow `renameConversation` pattern (lines 209-225)
- **DETAILS**:
  1. Call fork API
  2. Add new conversation to local storage
  3. Switch to new conversation
  4. Set messages from response (need to fetch them)
- **VALIDATE**: `bun run lint && npx tsc --noEmit`

```typescript
// Add this function inside useChat, before the return statement:

const forkConversation = useCallback(
  async (conversationId: string, messageId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (!res.ok) {
        throw new Error("Failed to fork story");
      }

      const data = (await res.json()) as {
        conversation: { id: string; title: string; updatedAt: string };
      };

      // Add new conversation to list
      addItem({
        id: data.conversation.id,
        title: data.conversation.title,
        updatedAt: data.conversation.updatedAt,
      });

      // Switch to new conversation (will trigger message fetch)
      setActiveConversationId(data.conversation.id);

      toast.success("Story forked successfully");
    } catch {
      toast.error("Failed to fork story");
    }
  },
  [addItem],
);

// Add to return object:
return {
  conversations,
  activeConversationId,
  messages,
  isStreaming,
  isLoadingMessages,
  streamingContent,
  sendMessage,
  selectConversation,
  createNewChat,
  renameConversation,
  deleteConversation,
  forkConversation,
};
```

---

### UPDATE `src/components/chat/message-list.tsx`

- **IMPLEMENT**: Add `onFork` prop and pass it through to MessageBubble
- **PATTERN**: Follow existing prop passing pattern
- **DETAILS**: Accept `onFork?: (messageId: string) => void` and pass to each MessageBubble
- **VALIDATE**: `bun run lint && npx tsc --noEmit`

```typescript
// Update interface (around line 16):
interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  onFork?: (messageId: string) => void;
}

// Update function signature:
export function MessageList({ messages, streamingContent, isStreaming, onFork }: MessageListProps) {

// Update MessageBubble rendering (around line 48-49):
{messages.map((message) => (
  <MessageBubble
    key={message.id}
    id={message.id}
    role={message.role}
    content={message.content}
    onFork={onFork}
  />
))}
```

---

### UPDATE `src/components/chat/chat-layout.tsx`

- **IMPLEMENT**: Destructure `forkConversation` from useChat and pass to MessageList
- **PATTERN**: Follow existing prop passing pattern
- **DETAILS**: Create handler that passes both conversationId and messageId
- **VALIDATE**: `bun run lint && npx tsc --noEmit`

```typescript
// Update useChat destructuring (around line 15-27):
const {
  conversations,
  activeConversationId,
  messages,
  isStreaming,
  isLoadingMessages,
  streamingContent,
  sendMessage,
  selectConversation,
  createNewChat,
  renameConversation,
  deleteConversation,
  forkConversation,
} = useChat();

// Create fork handler:
const handleFork = useCallback(
  (messageId: string) => {
    if (activeConversationId) {
      void forkConversation(activeConversationId, messageId);
    }
  },
  [activeConversationId, forkConversation],
);

// Update MessageList component (around line 79-83):
<MessageList
  messages={messages}
  streamingContent={streamingContent}
  isStreaming={isStreaming}
  onFork={handleFork}
/>

// Also update empty state message for story focus (around line 89-92):
<h2 className="text-xl font-semibold">What story shall we tell?</h2>
<p className="text-muted-foreground mt-1 text-sm">
  Start your story by typing a message below.
</p>
```

---

### UPDATE `src/components/chat/conversation-item.tsx` (Optional Enhancement)

- **IMPLEMENT**: Add branch icon indicator for conversations that are branches
- **PATTERN**: Conditionally render icon based on prop
- **DETAILS**: Add `isBranch` prop, show GitBranch icon if true
- **NOTE**: This requires passing branch info from parent, may defer to polish phase
- **VALIDATE**: `bun run lint && npx tsc --noEmit`

---

## TESTING STRATEGY

### Unit Tests

Follow existing test patterns in `src/app/api/chat/conversations/[id]/route.test.ts`.

**Service tests** (`src/features/chat/tests/service.test.ts` if exists, or create):
- `forkConversation` creates new conversation with correct metadata
- `forkConversation` copies messages up to fork point
- `forkConversation` throws `ConversationNotFoundError` for invalid conversation
- `forkConversation` throws `MessageNotFoundError` for invalid message
- `forkConversation` throws `MessageNotInConversationError` for mismatched message

**Schema tests**:
- `ForkConversationSchema` accepts valid UUID
- `ForkConversationSchema` rejects invalid messageId

### Integration Tests

**API route tests** (`src/app/api/chat/conversations/[id]/fork/route.test.ts`):
- POST returns 201 with new conversation
- POST returns 404 for non-existent conversation
- POST returns 400 for invalid messageId format
- POST returns 404 for non-existent message

### Manual Validation

1. Start dev server: `bun run dev`
2. Create a new story and send a few messages
3. Hover over a message - fork button should appear
4. Click fork button - new conversation should be created
5. Verify sidebar shows new conversation with "(branch)" suffix
6. Verify messages are copied up to fork point
7. Continue writing in branch - should work independently

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
bun run lint
```

### Level 2: Type Checking

```bash
npx tsc --noEmit
```

### Level 3: Unit Tests

```bash
bun test
```

### Level 4: Build

```bash
bun run build
```

### Level 5: Database Setup (if needed)

```bash
bun run db:setup
```

### Level 6: Manual Testing

```bash
bun run dev
# Then test fork flow in browser at http://localhost:3000
```

---

## ACCEPTANCE CRITERIA

- [ ] Fork button appears on hover for all messages
- [ ] Clicking fork creates new conversation with "(branch)" suffix
- [ ] New conversation contains messages up to and including fork point
- [ ] Sidebar updates to show new conversation
- [ ] User is switched to new conversation after fork
- [ ] Original conversation remains unchanged
- [ ] System prompt guides toward storytelling
- [ ] UI uses story-focused language ("New Story", "Fork story")
- [ ] All validation commands pass with zero errors

---

## COMPLETION CHECKLIST

- [ ] Phase 1: Database schema and setup script updated
- [ ] Phase 2: Repository and service functions implemented
- [ ] Phase 3: Fork API endpoint created
- [ ] Phase 4: Story-focused constants and UI copy updated
- [ ] Phase 5: Fork button and hook integration complete
- [ ] All validation commands pass
- [ ] Manual testing confirms feature works end-to-end

---

## NOTES

### Design Decisions

1. **Eager copy vs reference**: Messages are copied at fork time (not referenced). This ensures branches are fully independent and original can be deleted without affecting branches.

2. **Branch title format**: Uses "(branch)" suffix for simplicity. Future enhancement could add numbering or allow custom names.

3. **Self-referencing foreign key**: `parentConversationId` references same table. Using `SET NULL` on delete so branches survive if parent is deleted.

4. **Message ordering**: Using `createdAt` for ordering ensures correct sequence even with concurrent message creation.

### Future Enhancements (Out of Scope)

- Tree visualization of branches
- Side-by-side branch comparison
- Branch merging
- Custom branch naming UI
- Nested branch indicators in sidebar

### Risks

1. **Large conversations**: Forking a conversation with many messages may be slow. Consider pagination if this becomes an issue.

2. **Concurrent forks**: Multiple users forking same conversation simultaneously should work but hasn't been stress-tested.
