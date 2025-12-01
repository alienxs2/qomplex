# Requirements Document: Qomplex MVP

## Introduction

**Qomplex** is a web interface for Claude Code CLI that enables users to chat with AI agents from any device. The system provides a mobile-first, responsive UI where users can manage projects, interact with specialized AI agents, and view project documentation.

**Key Value Proposition:**
- Access Claude Code CLI from any device (desktop, mobile, tablet)
- Multiple specialized AI agents per project
- Real-time streaming responses via WebSocket
- Client-server architecture for VPS deployment
- No API key required — uses existing Claude Code CLI with MAX subscription

**Repository:** https://github.com/alienxs2/qomplex

---

## Core Concepts

### Entity Hierarchy

```
User
 └── Projects (= Working Directories)
      └── Agents (CLI sessions with specific behavior)
           ├── Chat Sessions (--resume support)
           └── MD Files (manually linked)
```

### Agent Definition

An **Agent** is a Claude Code CLI session with:
- **Name** (e.g., "BackDev", "PM")
- **System Prompt** (agent-specific instructions, stored in DB)
- **Linked MD Files** (manually configured paths)
- **Session ID** (for --resume continuity)

---

## Requirements

### REQ-1: User Authentication

**User Story:** As a user, I want to register and login, so that my projects and agents are private and accessible from any device.

#### Acceptance Criteria

1. WHEN user visits the app without authentication THEN system SHALL display login/register page
2. WHEN user submits registration form with email and password THEN system SHALL create account and login automatically
3. WHEN user submits login form with valid credentials THEN system SHALL authenticate and redirect to main app
4. WHEN user clicks logout THEN system SHALL clear session and redirect to login page
5. IF user token is expired THEN system SHALL redirect to login page with message

**Technical Notes:**
- JWT-based authentication
- Email + password (no OAuth for MVP)
- No email verification for MVP
- Tokens stored in localStorage

---

### REQ-2: Project Management

**User Story:** As a user, I want to create and manage projects, so that I can organize my work by working directories.

#### Acceptance Criteria

1. WHEN user clicks "New Project" THEN system SHALL open DirectoryBrowser modal
2. WHEN user navigates directories in DirectoryBrowser THEN system SHALL show subdirectories with breadcrumb navigation
3. WHEN user selects a directory THEN system SHALL create project with that path as working directory
4. WHEN user has projects THEN system SHALL show project selector dropdown in sidebar
5. WHEN user selects a project THEN system SHALL load that project's agents and context
6. IF directory belongs to another user's project THEN system SHALL prevent selection with warning

**Technical Notes:**
- DirectoryBrowser pattern from clipendra-repo
- Project = { id, name, working_directory, user_id, created_at }
- Projects isolated per user
- Store current project in localStorage

---

### REQ-3: Agent Management

**User Story:** As a user, I want to create and configure AI agents, so that I can have specialized assistants for different tasks.

#### Acceptance Criteria

1. WHEN user creates a project THEN system SHALL create 7 pre-configured agents: PM, Research, BackDev, FrontDev, DevOps, CI/CD, Docs
2. WHEN user views agent list THEN system SHALL display all agents for current project
3. WHEN user clicks agent settings THEN system SHALL show configuration panel with:
   - Agent name (editable)
   - System prompt (editable, max 10000 chars)
   - Linked MD files (list with add/remove)
4. WHEN user creates custom agent THEN system SHALL allow setting name and system prompt
5. WHEN user deletes agent THEN system SHALL remove agent and its sessions (with confirmation)

**Pre-configured Agent Default Prompts:**

| Agent | Default System Prompt |
|-------|----------------------|
| PM | "You are a Project Manager. Coordinate tasks, review progress, make architectural decisions. Focus on planning and delegation." |
| Research | "You are a Research agent. Study documentation, analyze codebases, find solutions. Provide detailed findings with sources." |
| BackDev | "You are a Backend Developer. Write Node.js/TypeScript code, implement APIs, handle database operations. Follow best practices." |
| FrontDev | "You are a Frontend Developer. Build React components with TypeScript and TailwindCSS. Focus on responsive, accessible UI." |
| DevOps | "You are a DevOps engineer. Manage Docker, containers, deployment configurations. Optimize infrastructure." |
| CI/CD | "You are a CI/CD specialist. Configure GitHub Actions, pipelines, automated testing and deployment workflows." |
| Docs | "You are a Documentation specialist. Write clear, comprehensive documentation in Markdown. Keep docs in sync with code." |

---

### REQ-4: Chat Interface

**User Story:** As a user, I want to chat with agents in real-time, so that I can get AI assistance for my development tasks.

#### Acceptance Criteria

1. WHEN user opens agent chat THEN system SHALL display chat interface with message history
2. WHEN user sends message THEN system SHALL:
   - Show loading indicator
   - Stream response in real-time via WebSocket
   - Display token usage after response completes
3. WHEN agent uses tools (Read, Write, Bash, etc.) THEN system SHALL show tool usage in chat
4. WHEN user returns to previous chat THEN system SHALL restore conversation using --resume flag
5. WHEN context reaches 120,000 tokens THEN system SHALL show warning to end session
6. IF WebSocket disconnects THEN system SHALL attempt reconnection with exponential backoff

**Technical Notes:**
- CLI command: `claude --append-system-prompt "<agent_prompt>" -p "<user_message>" --output-format stream-json --resume <session_id>`
- Parse NDJSON events: system, assistant, tool_use, tool_result, result
- Extract session_id from first system event, store in DB
- Token usage from result event: { input_tokens, output_tokens, cost_usd }

---

### REQ-5: Markdown Document Viewer

**User Story:** As a user, I want to view project documentation, so that I can understand project context and agent responsibilities.

#### Acceptance Criteria

1. WHEN user selects agent THEN system SHALL show list of linked MD files
2. WHEN user clicks MD file THEN system SHALL open document in viewer tab
3. WHEN viewing MD file THEN system SHALL render with:
   - GitHub-flavored Markdown
   - Syntax highlighting for code blocks
   - Proper heading hierarchy
4. WHEN project has CLAUDE.md THEN system SHALL show it in a special section (read-only view)
5. WHEN user opens multiple docs THEN system SHALL display in tabs (swipeable on mobile)

**Technical Notes:**
- Use react-markdown with remark-gfm, rehype-highlight
- MD files read via backend API (not direct file access)
- Flat list of files (no tree navigation for MVP)

---

### REQ-6: Mobile-First Responsive UI

**User Story:** As a user, I want to use the app on my phone, so that I can work from anywhere.

#### Acceptance Criteria

1. WHEN screen width < 1024px THEN system SHALL show mobile layout:
   - Full-screen views (not split)
   - Bottom navigation or swipe gestures
   - Mobile header with back button
2. WHEN screen width >= 1024px THEN system SHALL show desktop layout:
   - Sidebar + Main area
   - Tab bar for open chats/docs
3. WHEN user swipes left/right on mobile THEN system SHALL switch between open tabs
4. WHEN user installs as PWA THEN system SHALL work as standalone app

**Technical Notes:**
- Telegram-style UI from clipendra-repo
- UX structure (2 screens) from bolt_ai_front
- PWA with manifest.json and service worker

---

### REQ-7: Token Usage Monitoring

**User Story:** As a user, I want to track token usage, so that I can manage my context budget.

#### Acceptance Criteria

1. WHEN agent responds THEN system SHALL show token usage for that message:
   - Input tokens
   - Output tokens
   - Cost (if available)
2. WHEN viewing chat THEN system SHALL show total session token usage
3. WHEN session reaches 120,000 tokens THEN system SHALL display warning banner
4. WHEN user hovers/taps usage indicator THEN system SHALL show detailed breakdown

---

### REQ-8: Session Persistence

**User Story:** As a user, I want my conversations to persist, so that I can continue work across sessions.

#### Acceptance Criteria

1. WHEN user sends first message to agent THEN system SHALL:
   - Capture CLI session_id from system event
   - Store in database for future --resume
2. WHEN user returns to agent chat THEN system SHALL:
   - Load message history from CLI transcript files
   - Resume with --resume <session_id>
3. WHEN user starts new session THEN system SHALL clear previous session_id

**Technical Notes:**
- CLI stores transcripts in `~/.claude/projects/<hash>/sessions/*.jsonl`
- Can read history from these files instead of duplicating in DB
- Store only session metadata in PostgreSQL

---

## Non-Functional Requirements

### Code Architecture and Modularity

- **Monorepo Structure:** `/frontend`, `/backend`, `/shared`
- **TypeScript Everywhere:** Strict mode, ES modules
- **Single Responsibility:** Each file has one purpose
- **Shared Types:** Common types in `/shared` package
- **Clean Interfaces:** Zod schemas for validation

### Performance

- WebSocket streaming for real-time responses (< 100ms latency)
- Lazy loading of chat history (paginated)
- Efficient re-renders (React.memo, useMemo where needed)
- Target: First Contentful Paint < 2s

### Security

- JWT tokens with expiration (24h)
- Password hashing with bcrypt
- CORS configured for allowed origins
- Input sanitization (XSS prevention)
- No secrets in frontend code

### Reliability

- WebSocket reconnection with exponential backoff (max 30s)
- Graceful degradation if DB unavailable
- Error boundaries in React
- Structured logging (Pino)

### Usability

- Mobile-first design
- Touch targets >= 44px
- Loading states for all async operations
- Clear error messages
- Keyboard navigation support

### Deployment

- Docker Compose with 3 containers:
  - `qomplex-app` (frontend + backend)
  - `qomplex-postgres` (PostgreSQL 16)
  - `qomplex-redis` (optional, for sessions)
- Health check endpoints
- Environment-based configuration

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | Node.js 20+, Express, TypeScript, WebSocket (ws) |
| Database | PostgreSQL 16 |
| CLI Integration | child_process.spawn(), NDJSON parsing |
| Auth | JWT (jsonwebtoken), bcrypt |
| Validation | Zod |
| Testing | Vitest |
| Deployment | Docker, Docker Compose |

---

## Out of Scope for MVP

- OAuth (Google, GitHub login)
- Email verification
- MD file editing (view only)
- File tree navigation (flat list only)
- Multiple CLI instances per agent
- Agent-to-agent communication
- Voice input
- Offline mode

---

## Success Metrics

1. User can register, create project, and chat with agent
2. Responses stream in real-time
3. Session resumes correctly after page reload
4. App works on mobile (responsive)
5. Token usage is displayed accurately
6. Docker deployment works on VPS

---

*Last updated: December 2025*
