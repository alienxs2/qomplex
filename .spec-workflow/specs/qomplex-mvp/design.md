# Design Document: Qomplex MVP

## Overview

Qomplex is a web interface for Claude Code CLI that enables users to interact with AI agents from any device. The system provides a mobile-first, responsive UI for managing projects, chatting with specialized AI agents, and viewing project documentation. The architecture follows a client-server model with WebSocket for real-time communication and direct CLI integration via child_process.spawn().

**Key differentiators from existing solutions:**
- No API key required - uses existing Claude Code CLI with MAX subscription
- 7 pre-configured agents per project for specialized tasks
- Session persistence via CLI transcript files
- Mobile-first design with Telegram-style UI

## Steering Document Alignment

### Technical Standards (tech.md)
*Note: Steering documents not yet created for this project. The following standards are established:*

- **TypeScript Strict Mode:** All code uses TypeScript with strict compilation
- **ES Modules:** Using ESM throughout the monorepo
- **Shared Types:** Common types in `/shared` package for consistency
- **Validation:** Zod schemas for runtime validation on API boundaries
- **Logging:** Pino for structured JSON logging
- **Testing:** Vitest for unit and integration tests

### Project Structure (structure.md)
*Reference structure based on requirements:*

```
qomplex/
  frontend/           # React 18 + Vite + TailwindCSS
    src/
      components/     # UI components
      hooks/          # Custom React hooks
      store/          # Zustand state stores
      pages/          # Page components
      lib/            # Utilities
      types/          # TypeScript types
  backend/            # Node.js + Express + WebSocket
    src/
      services/       # Business logic
      routes/         # Express routes
      websocket/      # WebSocket handlers
      types/          # TypeScript types
  shared/             # Shared types and utilities
    src/
      schemas/        # Zod schemas
      types/          # Shared TypeScript types
```

## Code Reuse Analysis

### Existing Components to Leverage

From **clipendra-repo**:

- **DirectoryBrowser** (`/home/dev/clipendra-repo/app/frontend/src/components/DirectoryBrowser.tsx`):
  Fully reusable modal for browsing server filesystem. Provides breadcrumb navigation, path ownership checking, and touch-friendly interface. Adaptation: Replace `useUserStore` with Qomplex auth context.

- **TelegramLayout** (`/home/dev/clipendra-repo/app/frontend/src/components/TelegramLayout.tsx`):
  Reference for mobile-first responsive layout with 3-panel desktop view and single-panel mobile view. Pattern: Desktop header + 3 panels (ChatList, Chat, Info).

- **ClaudeCliService** (`/home/dev/clipendra-repo/app/backend/src/services/claude-cli.service.ts`):
  Core service for spawning Claude CLI processes. Provides streaming output, session ID extraction, timeout handling, and error mapping. Direct reuse with minimal adaptation.

- **WebSocket Handler** (`/home/dev/clipendra-repo/app/backend/src/websocket/handler.ts`):
  Pattern for WebSocket message routing, agent settings loading, and CLI process management. Adaptation: Add JWT authentication, agent system prompts from DB.

- **useWebSocket Hook** (`/home/dev/clipendra-repo/app/frontend/src/hooks/useWebSocket.ts`):
  React hook for WebSocket connection with reconnection logic, message queue, and context usage tracking. Direct reuse.

- **MessageBubble** (`/home/dev/clipendra-repo/app/frontend/src/components/MessageBubble.tsx`):
  Telegram-style message bubble with markdown rendering and syntax highlighting. Direct reuse.

- **userStore** (`/home/dev/clipendra-repo/app/frontend/src/store/userStore.ts`):
  Pattern for Zustand store with persist middleware. Adaptation: Replace user list with JWT auth.

From **bolt_ai_front_clone**:

- **Layout Pattern** (`/home/dev/bolt_ai_front_clone/src/App.tsx`):
  Mobile view state management (`MobileView` type), tab management, and swipe navigation. Pattern for agent/doc tab handling.

- **MobileTabSwitcher** (`/home/dev/bolt_ai_front_clone/src/components/MobileTabSwitcher.tsx`):
  Bottom sheet for mobile tab selection. Direct reuse with styling adaptation.

### Integration Points

- **CLI Integration:** `child_process.spawn()` with `--output-format stream-json` for NDJSON streaming
- **Session Resume:** `--resume <session_id>` or `--continue` for session continuity
- **Agent System Prompts:** `--append-system-prompt` for per-agent instructions
- **Transcript Files:** Read from `~/.claude/projects/<hash>/sessions/*.jsonl` for history

## Architecture

The system follows a client-server architecture with three main layers:

1. **Frontend (React SPA):** Mobile-first UI with responsive desktop layout
2. **Backend (Express + WebSocket):** API gateway and CLI process manager
3. **Database (PostgreSQL):** User data, projects, agents, and session metadata

### High-Level Architecture

```mermaid
graph TD
    subgraph Client["Frontend (Browser)"]
        UI[React UI]
        WS_CLIENT[WebSocket Client]
        ZUSTAND[Zustand Stores]
    end

    subgraph Server["Backend (Node.js)"]
        EXPRESS[Express Server]
        WS_SERVER[WebSocket Server]
        CLI_SERVICE[ClaudeCliService]
        AUTH[Auth Middleware]
    end

    subgraph External["External"]
        CLI[Claude CLI]
        TRANSCRIPTS[~/.claude/transcripts]
        PG[(PostgreSQL)]
    end

    UI --> ZUSTAND
    UI <--> WS_CLIENT
    WS_CLIENT <--> WS_SERVER
    UI --> EXPRESS
    EXPRESS --> AUTH
    AUTH --> PG
    WS_SERVER --> CLI_SERVICE
    CLI_SERVICE --> CLI
    CLI_SERVICE --> TRANSCRIPTS
    EXPRESS --> PG
```

### Request Flow: Chat Message

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant WS as WebSocket
    participant BE as Backend
    participant CLI as Claude CLI
    participant DB as PostgreSQL

    U->>F: Send message
    F->>WS: query { prompt, agentId, projectId }
    WS->>BE: Validate JWT
    BE->>DB: Get agent system prompt
    BE->>CLI: spawn claude -p "prompt" --append-system-prompt
    CLI-->>BE: NDJSON stream (system, assistant, result)
    BE-->>WS: stream { content }
    WS-->>F: Update UI
    BE->>DB: Save session metadata
    CLI-->>BE: result event
    BE-->>WS: complete { usage, cost }
```

### Modular Design Principles

- **Single File Responsibility:** Each component/service handles one concern
- **Component Isolation:** Small, focused components (avg 100-200 lines)
- **Service Layer Separation:** ClaudeCliService, AuthService, AgentService
- **Utility Modularity:** Separate utils for parsing, validation, formatting

## Components and Interfaces

### Frontend Components

#### 1. AuthProvider
- **Purpose:** JWT authentication context and protected routes
- **Interfaces:**
  ```typescript
  interface AuthContext {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
  }
  ```
- **Dependencies:** None (root provider)
- **Reuses:** Pattern from clipendra userStore for state management

#### 2. MainLayout
- **Purpose:** Responsive layout with mobile/desktop switching
- **Interfaces:**
  ```typescript
  interface MainLayoutProps {
    children: React.ReactNode;
  }
  ```
- **Dependencies:** AuthProvider, Zustand stores
- **Reuses:** TelegramLayout pattern from clipendra

#### 3. ProjectSelector
- **Purpose:** Dropdown for selecting active project
- **Interfaces:**
  ```typescript
  interface ProjectSelectorProps {
    projects: Project[];
    currentProject: Project | null;
    onSelect: (project: Project) => void;
    onAddNew: () => void;
  }
  ```
- **Dependencies:** useProjectStore
- **Reuses:** Project selector pattern from TelegramLayout

#### 4. DirectoryBrowser
- **Purpose:** Modal for browsing server filesystem
- **Interfaces:**
  ```typescript
  interface DirectoryBrowserProps {
    open: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
  }
  ```
- **Dependencies:** Backend /api/browse endpoint
- **Reuses:** DirectoryBrowser from clipendra (direct adaptation)

#### 5. AgentList
- **Purpose:** List of agents for current project
- **Interfaces:**
  ```typescript
  interface AgentListProps {
    agents: Agent[];
    currentAgentId: string | null;
    onSelectAgent: (agent: Agent) => void;
    onSettings: (agent: Agent) => void;
  }
  ```
- **Dependencies:** useAgentStore
- **Reuses:** ChatListPanel pattern from clipendra

#### 6. AgentSettingsPanel
- **Purpose:** Edit agent name, system prompt, linked MD files
- **Interfaces:**
  ```typescript
  interface AgentSettingsPanelProps {
    agent: Agent;
    onSave: (updates: Partial<Agent>) => void;
    onClose: () => void;
  }
  ```
- **Dependencies:** useAgentStore, Backend /api/agents/:id
- **Reuses:** Pattern from clipendra AgentSettingsPanel

#### 7. ChatPanel
- **Purpose:** Chat interface with message list and input
- **Interfaces:**
  ```typescript
  interface ChatPanelProps {
    agentId: string;
    showHeader?: boolean;
  }
  ```
- **Dependencies:** useWebSocket hook, useMessageStore
- **Reuses:** ChatPanel + MessageBubble from clipendra

#### 8. DocViewer
- **Purpose:** Render markdown documents with syntax highlighting
- **Interfaces:**
  ```typescript
  interface DocViewerProps {
    content: string;
    filename: string;
  }
  ```
- **Dependencies:** react-markdown, rehype-highlight
- **Reuses:** DocViewer pattern from bolt_ai_front

#### 9. TokenUsageIndicator
- **Purpose:** Display token usage with warning at 120K
- **Interfaces:**
  ```typescript
  interface TokenUsageProps {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    warningThreshold?: number; // default 120000
  }
  ```
- **Dependencies:** None
- **Reuses:** Usage display pattern from clipendra Header

#### 10. MobileTabSwitcher
- **Purpose:** Bottom sheet for tab selection on mobile
- **Interfaces:**
  ```typescript
  interface MobileTabSwitcherProps {
    tabs: TabData[];
    activeTabId: string;
    onSelectTab: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- **Dependencies:** Tab state
- **Reuses:** MobileTabSwitcher from bolt_ai_front (direct)

### Backend Services

#### 1. ClaudeCliService
- **Purpose:** Spawn and manage Claude CLI processes
- **Interfaces:**
  ```typescript
  class ClaudeCliService {
    spawnClaude(prompt: string, options: ClaudeCliOptions): Promise<{
      process: ChildProcess;
      sessionId: string | null;
    }>;

    streamOutput(
      process: ChildProcess,
      ws: WebSocket,
      sessionId: string,
      db: DatabaseService
    ): void;

    cleanup(sessionId: string): void;
    cleanupAll(): void;
  }
  ```
- **Dependencies:** child_process, ws
- **Reuses:** ClaudeCliService from clipendra (direct)

#### 2. AuthService
- **Purpose:** JWT authentication and password hashing
- **Interfaces:**
  ```typescript
  class AuthService {
    register(email: string, password: string): Promise<{ user: User; token: string }>;
    login(email: string, password: string): Promise<{ user: User; token: string }>;
    verifyToken(token: string): Promise<User | null>;
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
  }
  ```
- **Dependencies:** bcrypt, jsonwebtoken
- **Reuses:** New service, pattern from standard JWT auth

#### 3. ProjectService
- **Purpose:** CRUD operations for projects
- **Interfaces:**
  ```typescript
  class ProjectService {
    create(userId: string, workingDirectory: string): Promise<Project>;
    getByUser(userId: string): Promise<Project[]>;
    getById(id: string): Promise<Project | null>;
    delete(id: string): Promise<void>;
  }
  ```
- **Dependencies:** DatabaseService
- **Reuses:** Pattern from clipendra project handling

#### 4. AgentService
- **Purpose:** CRUD operations for agents
- **Interfaces:**
  ```typescript
  class AgentService {
    createDefaultAgents(projectId: string): Promise<Agent[]>;
    getByProject(projectId: string): Promise<Agent[]>;
    getById(id: string): Promise<Agent | null>;
    update(id: string, data: Partial<Agent>): Promise<Agent>;
    delete(id: string): Promise<void>;
  }
  ```
- **Dependencies:** DatabaseService
- **Reuses:** New service with default agent creation

#### 5. TranscriptService
- **Purpose:** Read chat history from CLI transcript files
- **Interfaces:**
  ```typescript
  class TranscriptService {
    getSessionMessages(sessionId: string): Promise<Message[]>;
    findProjectPath(workingDirectory: string): Promise<string | null>;
  }
  ```
- **Dependencies:** fs/promises
- **Reuses:** New service for CLI transcript parsing

#### 6. WebSocketHandler
- **Purpose:** WebSocket message routing and connection management
- **Interfaces:**
  ```typescript
  function setupWebSocket(server: Server, db: DatabaseService): WebSocketServer;
  ```
- **Dependencies:** ws, ClaudeCliService, AuthService
- **Reuses:** WebSocket handler pattern from clipendra

### Zustand Stores

#### 1. useAuthStore
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

#### 2. useProjectStore
```typescript
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (workingDirectory: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}
```

#### 3. useAgentStore
```typescript
interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  fetchAgents: (projectId: string) => Promise<void>;
  setCurrentAgent: (agent: Agent | null) => void;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<void>;
  createAgent: (data: CreateAgentDto) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
}
```

#### 4. useMessageStore
```typescript
interface MessageState {
  messages: Message[];
  isLoading: boolean;
  contextUsage: ContextUsage;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  setContextUsage: (usage: ContextUsage) => void;
}
```

#### 5. useTabStore
```typescript
interface TabState {
  tabs: TabData[];
  activeTabId: string | null;
  openTab: (tab: TabData) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}
```

## Data Models

### User
```typescript
interface User {
  id: string;              // UUID
  email: string;           // Unique
  password_hash: string;   // bcrypt
  created_at: Date;
  updated_at: Date;
}
```

### Project
```typescript
interface Project {
  id: string;              // UUID
  user_id: string;         // FK to users
  name: string;            // Display name (derived from path)
  working_directory: string; // Absolute path
  created_at: Date;
  updated_at: Date;
}
```

### Agent
```typescript
interface Agent {
  id: string;              // UUID
  project_id: string;      // FK to projects
  name: string;            // e.g., "BackDev", "PM"
  system_prompt: string;   // Max 10000 chars
  session_id: string | null; // CLI session ID for --resume
  linked_md_files: string[]; // Array of file paths
  created_at: Date;
  updated_at: Date;
}
```

### AgentSession
```typescript
interface AgentSession {
  id: string;              // UUID
  agent_id: string;        // FK to agents
  cli_session_id: string;  // From Claude CLI system event
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  created_at: Date;
  ended_at: Date | null;
}
```

### Default Agent Templates
```typescript
const DEFAULT_AGENTS: Omit<Agent, 'id' | 'project_id' | 'session_id' | 'linked_md_files' | 'created_at' | 'updated_at'>[] = [
  { name: 'PM', system_prompt: 'You are a Project Manager. Coordinate tasks, review progress, make architectural decisions. Focus on planning and delegation.' },
  { name: 'Research', system_prompt: 'You are a Research agent. Study documentation, analyze codebases, find solutions. Provide detailed findings with sources.' },
  { name: 'BackDev', system_prompt: 'You are a Backend Developer. Write Node.js/TypeScript code, implement APIs, handle database operations. Follow best practices.' },
  { name: 'FrontDev', system_prompt: 'You are a Frontend Developer. Build React components with TypeScript and TailwindCSS. Focus on responsive, accessible UI.' },
  { name: 'DevOps', system_prompt: 'You are a DevOps engineer. Manage Docker, containers, deployment configurations. Optimize infrastructure.' },
  { name: 'CI/CD', system_prompt: 'You are a CI/CD specialist. Configure GitHub Actions, pipelines, automated testing and deployment workflows.' },
  { name: 'Docs', system_prompt: 'You are a Documentation specialist. Write clear, comprehensive documentation in Markdown. Keep docs in sync with code.' }
];
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  working_directory VARCHAR(1024) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, working_directory)
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  system_prompt TEXT CHECK (char_length(system_prompt) <= 10000),
  session_id VARCHAR(255),
  linked_md_files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent sessions table (for token tracking)
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cli_session_id VARCHAR(255) NOT NULL,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_agents_project_id ON agents(project_id);
CREATE INDEX idx_agent_sessions_agent_id ON agent_sessions(agent_id);
```

## API Endpoints

### Authentication
```
POST /api/auth/register
  Body: { email: string, password: string }
  Response: { user: User, token: string }

POST /api/auth/login
  Body: { email: string, password: string }
  Response: { user: User, token: string }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { user: User }
```

### Projects
```
GET /api/projects
  Headers: Authorization: Bearer <token>
  Response: { projects: Project[] }

POST /api/projects
  Headers: Authorization: Bearer <token>
  Body: { working_directory: string }
  Response: { project: Project }

DELETE /api/projects/:id
  Headers: Authorization: Bearer <token>
  Response: { success: boolean }
```

### Agents
```
GET /api/projects/:projectId/agents
  Headers: Authorization: Bearer <token>
  Response: { agents: Agent[] }

GET /api/agents/:id
  Headers: Authorization: Bearer <token>
  Response: { agent: Agent }

PUT /api/agents/:id
  Headers: Authorization: Bearer <token>
  Body: { name?: string, system_prompt?: string, linked_md_files?: string[] }
  Response: { agent: Agent }

POST /api/projects/:projectId/agents
  Headers: Authorization: Bearer <token>
  Body: { name: string, system_prompt: string }
  Response: { agent: Agent }

DELETE /api/agents/:id
  Headers: Authorization: Bearer <token>
  Response: { success: boolean }
```

### Files
```
GET /api/browse
  Headers: Authorization: Bearer <token>
  Query: { path?: string }
  Response: { currentPath: string, parentPath: string | null, items: DirectoryItem[] }

GET /api/files/read
  Headers: Authorization: Bearer <token>
  Query: { path: string }
  Response: { content: string }
```

### WebSocket Protocol
```typescript
// Client -> Server
interface QueryMessage {
  type: 'query';
  prompt: string;
  sessionId: string;  // UI session ID
  agentId: string;
  projectId: string;
}

// Server -> Client
interface ConnectedMessage {
  type: 'connected';
  sessionId: string;
  model: string;
  cwd: string;
  claudeSessionId: string;
}

interface StreamMessage {
  type: 'stream';
  content: {
    type: 'assistant';
    message: {
      content: string;
      id: string;
      usage?: TokenUsage;
    };
  };
  sessionId: string;
}

interface CompleteMessage {
  type: 'complete';
  result: any;
  usage: TokenUsage;
  cost: number;
  duration: number;
  numTurns: number;
  isError: boolean;
  sessionId: string;
}

interface ErrorMessage {
  type: 'error';
  error: string;
  code: string;
  sessionId: string;
}
```

## Error Handling

### Error Scenarios

1. **CLI Not Authenticated**
   - **Detection:** stderr contains "claude login"
   - **Handling:** Return specific error code `CLAUDE_LOGIN_REQUIRED`
   - **User Impact:** Show modal: "Claude CLI is not authenticated. Run `claude login` in terminal."

2. **Terms Update Required**
   - **Detection:** stderr contains "consumer terms"
   - **Handling:** Return error code `CLAUDE_TERMS_REQUIRED`
   - **User Impact:** Show modal: "Anthropic requires you to accept updated terms. Run `claude` in terminal."

3. **WebSocket Disconnect**
   - **Detection:** onclose event with wasClean=false
   - **Handling:** Exponential backoff reconnection (1s, 2s, 4s... max 30s)
   - **User Impact:** Show reconnecting indicator, queue messages

4. **CLI Process Timeout**
   - **Detection:** No result event within timeout (10 minutes default)
   - **Handling:** Kill process, send timeout error
   - **User Impact:** Show error: "Request timed out. Try a shorter message."

5. **Token Limit Warning**
   - **Detection:** totalTokens >= 120,000
   - **Handling:** Emit warning event
   - **User Impact:** Show yellow banner: "Context limit approaching. Consider starting new session."

6. **Invalid JWT**
   - **Detection:** Token verification fails
   - **Handling:** Return 401, clear client token
   - **User Impact:** Redirect to login page

7. **Project Path Conflict**
   - **Detection:** working_directory already exists for user
   - **Handling:** Return 409 Conflict
   - **User Impact:** Show error: "This directory is already registered as a project."

## Testing Strategy

### Unit Testing

**Frontend (Vitest + React Testing Library):**
- Zustand stores: Test state transitions and async actions
- Components: Test rendering and user interactions
- Hooks: Test useWebSocket connection states and message handling
- Utils: Test markdown parsing, path utilities

**Backend (Vitest):**
- ClaudeCliService: Mock spawn, test argument building and event parsing
- AuthService: Test password hashing, JWT generation
- Services: Test CRUD operations with mocked database

**Coverage Target:** 70% for services, 50% for components

### Integration Testing

**API Routes:**
- Auth flow: register -> login -> access protected route -> logout
- Project flow: create project -> add agents -> update agent -> delete
- File browsing: navigate directories, verify path security

**WebSocket:**
- Connection lifecycle: connect -> authenticate -> query -> stream -> complete
- Reconnection: disconnect -> reconnect -> resume session
- Error handling: invalid messages, timeout scenarios

### End-to-End Testing

**Critical User Flows (Playwright):**
1. **New User Onboarding:**
   - Register -> Create first project -> Chat with default agent -> View token usage

2. **Returning User:**
   - Login -> Select project -> Resume previous conversation -> Continue chatting

3. **Mobile Experience:**
   - Navigate between agents (swipe) -> Chat -> View linked doc -> Switch tabs

4. **Agent Configuration:**
   - Open settings -> Edit system prompt -> Add linked MD file -> Save -> Verify in chat

**Environments:**
- Local: Docker Compose with PostgreSQL
- CI: GitHub Actions with containerized services

## Security Considerations

1. **Authentication:**
   - JWT tokens with 24-hour expiration
   - Password hashing with bcrypt (cost factor 10)
   - Secure token storage in localStorage (MVP) -> httpOnly cookies (future)

2. **Input Validation:**
   - Zod schemas on all API inputs
   - Path traversal prevention in file browser
   - XSS prevention via React's default escaping

3. **Authorization:**
   - User can only access own projects/agents
   - WebSocket connections require valid JWT
   - Path ownership verification in DirectoryBrowser

4. **CLI Security:**
   - Use `--dangerously-skip-permissions` only when explicitly enabled
   - Default to `--permission-mode=acceptEdits`
   - No secrets passed via CLI arguments

## Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'
services:
  qomplex-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://qomplex:password@qomplex-postgres:5432/qomplex
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    volumes:
      - /home/dev:/home/dev:ro  # Read-only access to projects
      - ~/.claude:/.claude:ro    # Read-only access to CLI transcripts
    depends_on:
      - qomplex-postgres

  qomplex-postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=qomplex
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=qomplex

volumes:
  postgres_data:
```

**Health Checks:**
- `GET /health` - Basic liveness check
- `GET /health/ready` - Database connection check

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (32+ chars)
- `CLAUDE_CLI_TIMEOUT_MS` - CLI timeout (default 600000)
- `PORT` - Server port (default 3000)
- `NODE_ENV` - Environment (development/production)

---

*Last updated: December 2025*
