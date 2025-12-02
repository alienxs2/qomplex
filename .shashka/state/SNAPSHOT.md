# Project Snapshot
**Last Updated:** 2025-12-02

## Overview

| Field | Value |
|-------|-------|
| **Project** | Qomplex |
| **Type** | Web interface for Claude Code CLI |
| **Status** | Phase 5 completed, Phase 6 pending |
| **Repository** | https://github.com/alienxs2/qomplex |
| **Progress** | 36/49 tasks (73%) |

## Architecture

```
User -> Projects -> Agents -> Claude Code CLI
         |
   Working Directory
```

**Stack:**
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Zustand
- Backend: Node.js, Express, TypeScript, WebSocket
- Database: PostgreSQL 16
- Deployment: Docker Compose
- CLI: child_process.spawn() with --output-format stream-json

## Current State

### Completed Phases

#### Phase 1: Project Setup (5/5 tasks)
- [x] 1.1 Monorepo structure with npm workspaces
- [x] 1.2 TypeScript with strict mode across workspaces
- [x] 1.3 Docker and docker-compose for development
- [x] 1.4 Shared types and Zod schemas
- [x] 1.5 TailwindCSS and base styles for frontend

#### Phase 2: Backend Core (8/8 tasks)
- [x] 2.1 Express server with middleware
- [x] 2.2 PostgreSQL connection with connection pool
- [x] 2.3 AuthService with JWT
- [x] 2.4 Auth routes (/api/auth/*)
- [x] 2.5 ProjectService with CRUD operations
- [x] 2.6 AgentService with default agent creation
- [x] 2.7 Project and agent routes
- [x] 2.8 File browsing endpoint

#### Phase 3: CLI Integration (5/5 tasks)
- [x] 3.1 ClaudeCliService core
- [x] 3.2 TranscriptService for history loading
- [x] 3.3 WebSocket server with authentication
- [x] 3.4 WebSocket message handler for chat
- [x] 3.5 WebSocket reconnection and error handling

#### Phase 4: Frontend Core (6/6 tasks)
- [x] 4.1 Create React app entry point and router
- [x] 4.2 Implement useAuthStore with Zustand
- [x] 4.3 Implement useProjectStore and useAgentStore
- [x] 4.4 Implement useMessageStore and useTabStore
- [x] 4.5 Implement useWebSocket hook
- [x] 4.6 Create API utility functions

#### Phase 5: UI Components (12/12 tasks)
- [x] 5.1 Create LoginPage and RegisterPage
- [x] 5.2 Create MainLayout with responsive design
- [x] 5.3 Create ProjectSelector component
- [x] 5.4 Create DirectoryBrowser modal
- [x] 5.5 Create AgentList component
- [x] 5.6 Create AgentSettingsPanel component
- [x] 5.7 Create ChatPanel and MessageBubble
- [x] 5.8 Create ToolUsageDisplay
- [x] 5.9 Create TokenUsageIndicator
- [x] 5.10 Create DocViewer
- [x] 5.11 Create MobileTabSwitcher
- [x] 5.12 Create MobileHeader

### Next Steps

#### Phase 6: Integration (0/6 tasks)
- [ ] 6.1 Connect ChatPanel to WebSocket for streaming
- [ ] 6.2 Integrate DirectoryBrowser with project creation
- [ ] 6.3 Integrate AgentSettings with backend updates
- [ ] 6.4 Integrate DocViewer with linked MD files
- [ ] 6.5 Integrate session resume with chat history
- [ ] 6.6 Implement mobile navigation flow

### Remaining Phases
- Phase 7: Testing & Polish (0/7 tasks)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CLI vs SDK | CLI only | User has MAX subscription, no API key |
| System Prompt Storage | Hybrid (DB + --append-system-prompt) | Per-agent customization |
| Frontend Base | clipendra-repo UI + bolt_ai_front UX | Best of both |
| Auth | JWT + email/password | Simple for MVP |
| Session History | Read from CLI transcript files | No duplication |
| Token Warning | 120,000 tokens | Before context limit |

## Pre-configured Agents

| Agent | Purpose |
|-------|---------|
| PM | Project management, coordination |
| Research | Documentation study, analysis |
| BackDev | Node.js/TypeScript backend |
| FrontDev | React + TailwindCSS frontend |
| DevOps | Docker, infrastructure |
| CI/CD | GitHub Actions, pipelines |
| Docs | Documentation in Markdown |

## Project Structure

```
qomplex/
├── package.json              # Root monorepo config
├── docker-compose.yml        # Docker services
├── Dockerfile               # Production build
├── Dockerfile.dev           # Development build
├── tsconfig.json            # Root TypeScript config
├── frontend/                # React + Vite frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
├── backend/                 # Express backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── db/
│       ├── services/
│       ├── routes/
│       ├── middleware/
│       └── websocket/
└── shared/                  # Shared types & schemas
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── types/
        ├── schemas/
        └── index.ts
```

## Reference Repositories

| Repo | What to take |
|------|--------------|
| clipendra-repo | WebSocket hook, DirectoryBrowser, Telegram UI, auth |
| vqp | CLI integration (child_process), --resume, NDJSON parsing |
| bolt_ai_front | 2-screen UX, mobile layout, react-markdown |
