# Branching Stories

A collaborative AI storytelling application where you direct the narrative and the AI writes vivid prose. Fork your story at any point to explore alternate paths — like version control for creative writing.

## Core Concept

**You direct, the AI writes.** Describe a scene, introduce a character, or set the stage — the AI expands your ideas into narrative prose and prompts you for the next beat. Wonder "what if?" Click **Fork** to branch your story and explore alternate directions without losing your original path.

## Features

### Storytelling
- **Collaborative writing** — You steer, AI generates prose
- **Story layers** — Visual distinction between Direction (your input), Narrative (story prose), and Prompt (AI's guiding questions)
- **Streaming responses** via Server-Sent Events (SSE)
- **Markdown rendering** with syntax highlighting

### Branching
- **Fork any message** — Create alternate storylines from any point
- **Non-destructive** — Original story remains unchanged
- **Branch tracking** — "(branch)" suffix identifies forked stories
- **Instant switching** — Navigate between branches via sidebar

### Export
- **Download stories** as Markdown (.md) or Plain Text (.txt)
- **Content options** — Include your directions or export AI prose only
- **Layer headers** — Exported files show Direction/Narrative/Prompt structure

### Interface
- **Dark/light theme** with blue accent colors
- **Responsive mobile layout** with collapsible sidebar
- **Conversation management** — create, rename, delete
- **Keyboard shortcuts** — Enter to send, Shift+Enter for new line

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Database | Supabase Postgres + Drizzle ORM |
| Auth | Supabase Auth |
| AI | OpenRouter (configurable model) |
| Linting | Biome |
| Testing | Bun test + React Testing Library |
| Logging | Structured JSON (console-based) |

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Create database tables
bun run db:setup

# Start development server
bun run dev
```

## Environment Variables

```bash
# Table prefix (optional — for shared database workshops)
TABLE_PREFIX=yourname           # Creates yourname_projects, yourname_chat_conversations, etc.

# OpenRouter (required for AI responses)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-haiku-4.5    # or any OpenRouter model

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (use transaction pooler port 6543 for serverless)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Commands

```bash
bun run dev          # Start development server
bun run build        # Production build (includes type checking)
bun run lint         # Check for lint/format errors
bun run lint:fix     # Auto-fix lint/format issues
bun test             # Run tests with coverage
bun run db:setup     # Create tables (supports TABLE_PREFIX)
bun run db:migrate   # Run pending database migrations
bun run db:studio    # Open Drizzle Studio GUI
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login & register pages
│   ├── (dashboard)/       # Protected chat interface
│   └── api/               # API routes (chat, health, projects)
│       └── chat/          # SSE streaming endpoint
├── core/                   # Shared infrastructure
│   ├── config/            # Environment validation (Zod)
│   ├── database/          # Drizzle client & schema
│   ├── logging/           # Structured JSON logging
│   └── supabase/          # Server & client Supabase clients
├── features/              # Vertical slices (self-contained)
│   ├── auth/              # Auth actions & hooks
│   ├── chat/              # Conversations, messages, AI streaming
│   └── projects/          # Example CRUD feature
├── hooks/                 # React hooks (useChat, useAutoScroll)
├── shared/                # Cross-feature utilities
└── components/            # UI components
    ├── chat/              # Chat UI (layout, input, messages, sidebar)
    └── ui/                # shadcn/ui primitives
```

Features follow the **vertical slice pattern** — each feature owns its models, schemas, repository, service, errors, and tests:

```
src/features/chat/
├── models.ts      # Drizzle types
├── schemas.ts     # Zod validation
├── repository.ts  # Database queries (including fork operations)
├── service.ts     # Business logic (conversations, messages, forking)
├── stream.ts      # OpenRouter SSE streaming
├── constants.ts   # System prompt, context limits
├── errors.ts      # Custom error classes
├── index.ts       # Public API
└── tests/         # Feature tests
```

### Key Components

```
src/components/chat/
├── chat-layout.tsx         # Main layout with empty state onboarding
├── message-bubble.tsx      # Renders Direction/Narrative/Prompt layers
├── message-list.tsx        # Scrollable message container
├── chat-sidebar.tsx        # Conversation list with branch indicators
├── chat-input.tsx          # Message input with keyboard shortcuts
├── export-story-button.tsx # Download stories as .md or .txt
└── markdown-content.tsx    # Renders AI prose with syntax highlighting
```

### Utilities

```
src/lib/
├── utils.ts          # Tailwind class merging (cn)
└── story-parser.ts   # Extracts [NARRATIVE] and [PROMPT] sections from AI responses
```

## Documentation

- `PRD.md` — Product requirements and feature specifications
- `FUTURE-IMPROVEMENTS.md` — Technical roadmap for enhancements
- `CLAUDE.md` — Development guidelines and patterns
- `CODEBASE-GUIDE.md` — Architecture deep-dive

## License

MIT
