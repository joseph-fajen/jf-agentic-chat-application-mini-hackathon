# PRD: Branching Stories

## Executive Summary

**Branching Stories** is a feature that transforms the existing AI chat application into a collaborative storytelling tool with branching narratives. Users can fork any conversation at any message point to explore alternate storylines, creating a tree of possibilities rather than a single linear conversation.

The core insight is simple: when co-writing a story with AI, you often wonder "what if the character had done something different?" Instead of losing your current narrative thread, you fork it and explore both paths. This creates a "choose your own adventure" authoring experience where multiple storylines can be developed simultaneously.

**MVP Goal**: Enable users to fork a conversation from any message, creating a new conversation branch that preserves all messages up to the fork point. Users can then develop multiple narrative branches independently and switch between them easily.

## Mission

**Mission Statement**: Empower creative writers to explore infinite narrative possibilities by making it effortless to branch, explore, and manage multiple storylines within a single AI-assisted writing session.

**Core Principles**:
1. **Non-destructive exploration** — Forking never loses or modifies the original conversation
2. **Minimal friction** — One click to fork, immediate editing in the new branch
3. **Clear lineage** — Always know where a branch came from
4. **Familiar UX** — Build on existing chat patterns, don't reinvent them

## Target Users

**Primary Persona: Creative Writer**
- Uses AI as a collaborative writing partner
- Writes interactive fiction, short stories, or explores narrative ideas
- Comfortable with chat-based AI interfaces
- Wants to explore "what if" scenarios without losing work

**Key Needs**:
- Explore multiple story directions without commitment
- Keep track of different narrative branches
- Easily switch between storylines
- Understand the relationship between branches

## MVP Scope

### In Scope (Core Functionality)
- ✅ Fork button on each message in a conversation
- ✅ Create new conversation containing messages up to fork point
- ✅ New conversation titled with branch indicator (e.g., "Story (branch)")
- ✅ Visual indicator in sidebar showing branched conversations
- ✅ Branch metadata stored (parent conversation ID, fork message ID)

### In Scope (Technical)
- ✅ Database schema updates for branch tracking
- ✅ New fork API endpoint
- ✅ Service layer function for forking logic
- ✅ UI components for fork action

### Post-MVP (Implemented)
- ✅ Story export to .txt and .md formats
- ✅ Export options (include prompts or AI-only)
- ✅ Story layers with distinct visual styles (Direction/Narrative/Prompt)
- ✅ Onboarding copy explaining interaction model ("You direct, the AI writes")
- ✅ Branching Stories feature explanation in empty state

### Out of Scope (Future)
- ❌ Tree visualization of all branches
- ❌ Side-by-side branch comparison view
- ❌ Merging branches back together
- ❌ Branch renaming UI
- ❌ Nested branching (branches of branches) — technically works, but no special UI
- ❌ Sharing/exporting branch trees
- ❌ Branch search/filtering

See `FUTURE-IMPROVEMENTS.md` for detailed technical specifications on future enhancements.

## User Stories

**1. Fork a Story Branch**
> As a writer, I want to fork my story at any message, so that I can explore an alternate direction without losing my current storyline.

*Example*: I'm writing a mystery. The detective finds a clue. I fork here — in one branch she follows the clue, in another she ignores it. Both stories continue independently.

**2. See Branch Origin**
> As a writer, I want to see that a conversation is a branch and where it came from, so that I understand its context.

*Example*: In the sidebar, I see "Mystery Story" and indented below it "Mystery Story (branch)". I know the branch relates to the original.

**3. Continue Writing in Branch**
> As a writer, I want to immediately continue writing in a new branch after forking, so that my creative flow isn't interrupted.

*Example*: I click fork, a new conversation opens with all prior messages, my cursor is ready in the input field.

**4. Switch Between Branches**
> As a writer, I want to easily switch between my story branches, so that I can develop multiple storylines in one session.

*Example*: I click between "Mystery Story" and its branch in the sidebar, each shows its own message history.

**5. Identify Fork Points**
> As a writer, I want to know which message I forked from, so that I remember why I created this branch.

*Example*: The branch shows a subtle indicator or the forked-from message is highlighted.

## Core Architecture & Patterns

### Approach
Extend the existing vertical slice architecture. Add branch tracking to the database schema and create a new `forkConversation` service function that:
1. Creates a new conversation with parent reference
2. Copies all messages up to and including the fork point
3. Returns the new conversation for immediate use

### Key Files to Modify
```
src/
├── core/database/schema.ts          # Add branch fields to conversations
├── features/chat/
│   ├── repository.ts                # Add fork query functions
│   ├── service.ts                   # Add forkConversation function
│   └── schemas.ts                   # Add ForkConversationSchema
├── components/chat/
│   ├── message-bubble.tsx           # Add fork button
│   ├── chat-sidebar.tsx             # Show branch indicators
│   └── conversation-item.tsx        # Display branch relationship
├── app/api/chat/conversations/
│   └── [id]/fork/route.ts           # New fork endpoint
└── hooks/use-chat.ts                # Add forkConversation action
```

### Design Patterns
- **Vertical Slice**: Fork feature follows existing chat feature patterns
- **Immutable Forking**: Original conversation is never modified
- **Eager Copy**: Messages are copied at fork time (not referenced)

## Features

### Fork Button
- **Location**: Each message bubble, visible on hover
- **Icon**: Git branch icon or similar (🔀)
- **Action**: Calls fork API, switches to new conversation

### Branch Indicator (Sidebar)
- **Visual**: Indentation or icon showing conversation is a branch
- **Grouping**: Branches appear near their parent conversation
- **Label**: Title includes "(branch)" suffix by default

### Fork API
- **Endpoint**: `POST /api/chat/conversations/[id]/fork`
- **Input**: `{ messageId: string }` — the message to fork from
- **Output**: `{ conversation: Conversation }` — the new branch
- **Logic**: Create conversation with parent ref, copy messages, return new conversation

## Technology Stack

**Existing Stack (No Changes)**:
- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- Supabase Postgres + Drizzle ORM
- Bun runtime

**New Dependencies**: None required

## Security & Configuration

**Authentication**: Uses existing Supabase Auth — no changes needed

**Authorization**: Fork operation requires no special permissions; users fork their own conversations

**Database**: Uses existing `TABLE_PREFIX` pattern for workshop isolation (`jf_` prefix)

## API Specification

### Fork Conversation

**Endpoint**: `POST /api/chat/conversations/[id]/fork`

**Request**:
```json
{
  "messageId": "uuid-of-message-to-fork-from"
}
```

**Response** (201 Created):
```json
{
  "conversation": {
    "id": "new-conversation-uuid",
    "title": "Original Title (branch)",
    "parentConversationId": "original-conversation-uuid",
    "branchFromMessageId": "uuid-of-message-to-fork-from",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errors**:
- `404`: Conversation or message not found
- `400`: Message doesn't belong to conversation

## Success Criteria

### MVP Success Definition
A user can fork any conversation at any message point, continue the story in a different direction, and easily navigate between branches.

### Functional Requirements
- ✅ Fork button appears on all messages
- ✅ Clicking fork creates new conversation with copied messages
- ✅ New conversation opens immediately for editing
- ✅ Sidebar shows branch relationship visually
- ✅ Original conversation remains unchanged

### Quality Indicators
- Fork operation completes in under 1 second
- No data loss during fork
- Branch relationship is persisted and survives page refresh

### User Experience Goals
- Forking feels instant and effortless
- Branch lineage is immediately clear
- Switching between branches is seamless

## Implementation Phases

### Phase 1: Database & Backend (15-20 min)
**Goal**: Enable branch tracking and fork operation

**Deliverables**:
- ✅ Add `parentConversationId` and `branchFromMessageId` columns to conversations table
- ✅ Create `forkConversation` service function
- ✅ Create fork API endpoint
- ✅ Test fork operation via API

**Validation**: Can create a fork via API call and see copied messages

### Phase 2: Fork UI (15-20 min)
**Goal**: Users can fork from the chat interface

**Deliverables**:
- ✅ Add fork button to message bubble component
- ✅ Connect button to fork API via use-chat hook
- ✅ Switch to new conversation after fork

**Validation**: Can click fork button and land in new branch with messages

### Phase 3: Branch Visualization (10-15 min)
**Goal**: Users can see and understand branch relationships

**Deliverables**:
- ✅ Update sidebar to show branch indicator
- ✅ Group or indent branches under parent
- ✅ Show "(branch)" in conversation title

**Validation**: Sidebar clearly shows which conversations are branches

### Phase 4: Polish & Deploy (10-15 min)
**Goal**: Ship it

**Deliverables**:
- ✅ Test full flow end-to-end
- ✅ Fix any visual issues
- ✅ Push to GitHub
- ✅ Deploy to Vercel

**Validation**: Live URL works, can demo the feature

## Future Considerations

**Post-MVP Enhancements**:
- Tree visualization showing full branch structure
- Side-by-side comparison of branches
- Custom branch naming
- Branch search and filtering
- "Story mode" UI optimized for narrative writing

**Advanced Features**:
- Merge branches (combine storylines)
- Export story tree to structured format
- Share public story trees
- Collaborative branching (multiple authors)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database migration complexity | Could block progress | Use direct SQL in setup script, matching existing pattern |
| Fork operation slow with many messages | Poor UX | Keep MVP scope small; optimize later if needed |
| Time overrun | Incomplete feature | Focus on core fork flow first; branch visualization is optional polish |
| UI complexity | Confusing for users | Start with minimal UI (just a fork button + title suffix) |

## Post-MVP Features (Implemented)

### Story Layers

The writing experience is now structured into three distinct layers, each with unique visual styling:

| Layer | Creator | Purpose | Visual Style |
|-------|---------|---------|--------------|
| **Direction** | User | Steering input that guides the narrative | Blue bubble with "DIRECTION" label |
| **Narrative** | AI | Story prose — the actual creative content | Muted gray with "NARRATIVE" label |
| **Prompt** | AI | Question guiding user to next story beat | Amber/gold with lightbulb icon |

**Implementation**:
- System prompt instructs AI to use `[NARRATIVE]...[/NARRATIVE]` and `[PROMPT]...[/PROMPT]` markers
- `src/lib/story-parser.ts` extracts sections from AI responses
- `src/components/chat/message-bubble.tsx` renders each layer with distinct styling
- Legacy messages (without markers) display unchanged

### Export Functionality

Users can download their stories in multiple formats:

- **Formats**: Markdown (.md) or Plain Text (.txt)
- **Content options**: Include user directions or AI responses only
- **Layer headers**: Exported files include section markers (📝 Direction, 📖 Narrative, 💭 Prompt)

**Location**: Download button in header, next to theme toggle

### Onboarding & Empty State

The empty state now explains:
1. **Interaction model**: "You direct, the AI writes"
2. **What to expect**: AI expands ideas into vivid prose
3. **Example prompt**: Concrete starter to inspire users
4. **Branching feature**: Callout explaining fork capability

## Appendix

**Repository**: `joseph-fajen/jf-agentic-chat-application-mini-hackathon`

**Branch**: `main`

**Key Files**:
- `src/core/database/schema.ts` — Database schema definitions
- `src/features/chat/service.ts` — Chat business logic
- `src/features/chat/constants.ts` — System prompt and AI configuration
- `src/components/chat/message-bubble.tsx` — Message display with layer rendering
- `src/components/chat/chat-sidebar.tsx` — Conversation list
- `src/components/chat/export-story-button.tsx` — Export functionality
- `src/lib/story-parser.ts` — Layer extraction from AI responses
- `scripts/setup-db.ts` — Database setup script
- `FUTURE-IMPROVEMENTS.md` — Technical roadmap for future development
