# Tasks Document: Qomplex MVP

## Phase 1: Project Setup

- [x] 1.1 Initialize monorepo structure with npm workspaces
  - Files: `package.json`, `frontend/package.json`, `backend/package.json`, `shared/package.json`
  - Create root package.json with workspaces configuration
  - Initialize frontend with Vite + React 18 + TypeScript
  - Initialize backend with Express + TypeScript
  - Initialize shared package for common types
  - Purpose: Establish monorepo foundation with proper dependency management
  - _Leverage: clipendra-repo project structure patterns_
  - _Requirements: Non-functional (Code Architecture)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: DevOps Engineer specializing in Node.js monorepo architecture | Task: Initialize monorepo structure following the architecture defined in design.md - create root package.json with npm workspaces, frontend package with Vite+React+TypeScript, backend package with Express+TypeScript, and shared package for common types. Reference design.md "Project Structure" section for directory layout | Restrictions: Do not install unnecessary dependencies, use npm workspaces (not yarn/pnpm), do not create any source files yet - only package.json files | _Leverage: clipendra-repo package.json structure for reference | _Requirements: Non-functional (Code Architecture and Modularity) | Success: Running `npm install` from root installs all workspaces, TypeScript compiles in all packages, workspace cross-references work correctly | Instructions: 1) Run spec-workflow-guide first 2) Mark task as in-progress in tasks.md (change [ ] to [-]) 3) Create package.json files for root, frontend, backend, shared 4) Log implementation with log-implementation tool 5) Mark task complete in tasks.md (change [-] to [x])_

- [x] 1.2 Configure TypeScript with strict mode across workspaces
  - Files: `tsconfig.json`, `frontend/tsconfig.json`, `backend/tsconfig.json`, `shared/tsconfig.json`
  - Create base tsconfig with strict settings
  - Extend base config in each workspace
  - Configure path aliases for workspace imports
  - Purpose: Enable type safety and consistent compilation across monorepo
  - _Leverage: clipendra-repo tsconfig patterns_
  - _Requirements: Non-functional (TypeScript Everywhere)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer specializing in monorepo configuration | Task: Create TypeScript configuration files with strict mode enabled for all workspaces. Create base tsconfig.json in root with strict settings, extend it in frontend/backend/shared. Configure ES modules, path aliases for @shared imports | Restrictions: Must use ES modules (not CommonJS), do not disable any strict mode settings, ensure frontend tsconfig works with Vite | _Leverage: clipendra-repo tsconfig.json for strict settings reference | _Requirements: Non-functional (TypeScript Everywhere) | Success: `tsc --noEmit` passes in all workspaces, @shared imports resolve correctly, no TypeScript errors in empty projects | Instructions: 1) Run spec-workflow-guide first 2) Mark task as in-progress in tasks.md 3) Create tsconfig files 4) Log implementation with log-implementation tool 5) Mark task complete_

- [x] 1.3 Setup Docker and docker-compose for development
  - Files: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`
  - Create multi-stage Dockerfile for frontend + backend
  - Configure docker-compose with PostgreSQL 16 container
  - Add health checks for database
  - Create .env.example with required variables
  - Purpose: Enable containerized development and deployment
  - _Leverage: design.md deployment architecture section_
  - _Requirements: Non-functional (Deployment)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: DevOps Engineer specializing in Docker containerization | Task: Create Docker configuration following design.md deployment architecture. Build multi-stage Dockerfile for production build, docker-compose.yml with qomplex-app and qomplex-postgres services, volume mounts for /home/dev (read-only) and ~/.claude (read-only) | Restrictions: Do not expose database port externally, use postgres:16 image exactly, do not hardcode secrets in docker-compose.yml | _Leverage: design.md "Deployment Architecture" section for exact configuration | _Requirements: Non-functional (Deployment) | Success: `docker-compose up` starts all services, PostgreSQL is accessible from app container, health checks pass | Instructions: 1) Run spec-workflow-guide first 2) Mark task as in-progress 3) Create Docker files 4) Log implementation 5) Mark complete_

- [x] 1.4 Create shared types and Zod schemas
  - Files: `shared/src/types/index.ts`, `shared/src/schemas/index.ts`, `shared/src/index.ts`
  - Define User, Project, Agent, AgentSession interfaces
  - Create Zod schemas for validation
  - Export all types and schemas from shared package
  - Purpose: Establish shared type system for frontend and backend
  - _Leverage: design.md Data Models section_
  - _Requirements: Non-functional (Shared Types, Clean Interfaces)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer specializing in type systems and validation | Task: Create shared types following design.md Data Models section exactly. Define User, Project, Agent, AgentSession, TokenUsage, ContextUsage interfaces. Create corresponding Zod schemas for runtime validation. Include DEFAULT_AGENTS constant from design.md | Restrictions: Do not add fields not specified in design.md, system_prompt must have max 10000 char validation, use UUID type for all IDs | _Leverage: design.md "Data Models" section for exact interface definitions | _Requirements: Non-functional (Shared Types, Clean Interfaces) | Success: All types compile without errors, Zod schemas validate correctly, DEFAULT_AGENTS constant matches design.md | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement types and schemas 4) Log implementation 5) Mark complete_

- [x] 1.5 Configure TailwindCSS and base styles for frontend
  - Files: `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/index.css`
  - Setup TailwindCSS with Vite
  - Configure responsive breakpoints (mobile-first)
  - Add base styles and CSS reset
  - Purpose: Enable utility-first CSS styling with mobile-first approach
  - _Leverage: bolt_ai_front tailwind configuration for mobile patterns_
  - _Requirements: REQ-6 (Mobile-First Responsive UI)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in TailwindCSS and responsive design | Task: Configure TailwindCSS for mobile-first design following REQ-6. Set breakpoint at 1024px for desktop layout. Add base styles with touch-friendly sizing (44px minimum touch targets). Configure dark mode support | Restrictions: Do not add custom colors yet (use Tailwind defaults), ensure breakpoint matches REQ-6 specification (< 1024px = mobile), do not install additional CSS frameworks | _Leverage: bolt_ai_front tailwind.config.js for mobile-first breakpoint patterns | _Requirements: REQ-6 (Mobile-First Responsive UI) | Success: TailwindCSS builds correctly, responsive utilities work, base styles applied | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Configure Tailwind 4) Log implementation 5) Mark complete_

## Phase 2: Backend Core

- [x] 2.1 Setup Express server with middleware
  - Files: `backend/src/index.ts`, `backend/src/app.ts`, `backend/src/middleware/errorHandler.ts`
  - Create Express application with JSON parsing
  - Add CORS middleware with configurable origins
  - Implement global error handler middleware
  - Add health check endpoints (/health, /health/ready)
  - Purpose: Establish backend HTTP foundation
  - _Leverage: clipendra-repo Express setup patterns_
  - _Requirements: Non-functional (Reliability, Deployment)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in Express.js architecture | Task: Create Express server with proper middleware stack. Include JSON body parser, CORS (configurable origins), request logging (Pino), global error handler with structured responses. Add /health and /health/ready endpoints as specified in design.md | Restrictions: Do not add authentication middleware yet, do not connect to database yet, use Pino for logging only | _Leverage: clipendra-repo backend/src/index.ts for Express setup patterns | _Requirements: Non-functional (Reliability, Deployment) | Success: Server starts on configurable port, health endpoints return 200, error handler catches and formats errors | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement Express server 4) Log implementation 5) Mark complete_

- [x] 2.2 Setup PostgreSQL connection with connection pool
  - Files: `backend/src/db/index.ts`, `backend/src/db/migrations/001_initial.sql`
  - Create database connection with pg Pool
  - Implement migration runner
  - Create initial migration with all tables from design.md
  - Purpose: Establish database layer with schema
  - _Leverage: design.md Database Schema section_
  - _Requirements: Non-functional (Security, Reliability)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in PostgreSQL and database architecture | Task: Create database connection layer using pg Pool with connection pooling. Implement simple migration runner that executes SQL files in order. Create initial migration with all tables from design.md Database Schema section exactly (users, projects, agents, agent_sessions with all indexes) | Restrictions: Do not use ORM (use raw SQL), do not create additional tables not in design.md, use transactions for migrations | _Leverage: design.md "Database Schema" section for exact SQL | _Requirements: Non-functional (Security, Reliability) | Success: Database connects, migrations run on startup, all tables and indexes created | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement database layer 4) Log implementation 5) Mark complete_

- [x] 2.3 Implement AuthService with JWT
  - Files: `backend/src/services/auth.service.ts`, `backend/src/middleware/auth.ts`
  - Implement register, login, verifyToken methods
  - Use bcrypt for password hashing (cost factor 10)
  - Generate JWT with 24h expiration
  - Create auth middleware for protected routes
  - Purpose: Enable user authentication
  - _Leverage: design.md AuthService interface_
  - _Requirements: REQ-1 (User Authentication)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in authentication and security | Task: Implement AuthService following design.md interface exactly. Use bcrypt with cost factor 10 for password hashing. Generate JWT with 24h expiration containing user id and email. Create auth middleware that verifies JWT and attaches user to request | Restrictions: Do not implement OAuth, do not implement email verification (MVP), do not store tokens in database, use jsonwebtoken library | _Leverage: design.md "AuthService" interface for exact method signatures | _Requirements: REQ-1 (User Authentication) | Success: register creates user with hashed password, login returns valid JWT, middleware rejects invalid tokens | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement auth service 4) Log implementation 5) Mark complete_

- [x] 2.4 Create auth routes (/api/auth/*)
  - Files: `backend/src/routes/auth.routes.ts`
  - Implement POST /api/auth/register
  - Implement POST /api/auth/login
  - Implement GET /api/auth/me (protected)
  - Add Zod validation for request bodies
  - Purpose: Expose authentication endpoints
  - _Leverage: design.md API Endpoints - Authentication_
  - _Requirements: REQ-1 (User Authentication)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in REST API design | Task: Create auth routes following design.md API Endpoints Authentication section. Implement POST /register, POST /login, GET /me. Use Zod schemas from shared package for input validation. Return proper HTTP status codes (201 for register, 200 for login/me, 401 for unauthorized) | Restrictions: Do not add routes not in design.md, validate email format, minimum password length 8 chars | _Leverage: design.md "API Endpoints - Authentication" for exact request/response format | _Requirements: REQ-1 (User Authentication) | Success: All auth endpoints work as specified, validation rejects invalid input, proper error responses | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement routes 4) Log implementation 5) Mark complete_

- [x] 2.5 Implement ProjectService with CRUD operations
  - Files: `backend/src/services/project.service.ts`
  - Implement create, getByUser, getById, delete methods
  - Auto-generate project name from working_directory path
  - Check for duplicate working_directory per user
  - Purpose: Manage project data operations
  - _Leverage: design.md ProjectService interface_
  - _Requirements: REQ-2 (Project Management)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in service layer architecture | Task: Implement ProjectService following design.md interface. Create method should auto-generate project name from last directory segment of path. Implement unique constraint check on (user_id, working_directory). Use transactions for create+default agents | Restrictions: Do not implement agent creation here (separate service), validate working_directory is absolute path, do not allow path traversal | _Leverage: design.md "ProjectService" interface for method signatures | _Requirements: REQ-2 (Project Management) | Success: CRUD operations work correctly, duplicate paths rejected with 409, project names generated correctly | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement service 4) Log implementation 5) Mark complete_

- [x] 2.6 Implement AgentService with default agent creation
  - Files: `backend/src/services/agent.service.ts`
  - Implement createDefaultAgents, getByProject, getById, update, delete methods
  - Use DEFAULT_AGENTS from shared types
  - Handle linked_md_files as JSON array
  - Purpose: Manage agent data operations
  - _Leverage: design.md AgentService interface, DEFAULT_AGENTS constant_
  - _Requirements: REQ-3 (Agent Management)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in service layer architecture | Task: Implement AgentService following design.md interface. createDefaultAgents should create all 7 agents from DEFAULT_AGENTS constant. Update should handle partial updates including linked_md_files JSONB field. Validate system_prompt max 10000 chars | Restrictions: Do not delete agents with active sessions, validate agent belongs to user's project before update, do not allow duplicate agent names per project | _Leverage: design.md "AgentService" interface and "Default Agent Templates" | _Requirements: REQ-3 (Agent Management) | Success: Default agents created with project, CRUD operations work, validation enforced | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement service 4) Log implementation 5) Mark complete_

- [x] 2.7 Create project and agent routes
  - Files: `backend/src/routes/project.routes.ts`, `backend/src/routes/agent.routes.ts`
  - Implement all project endpoints from design.md
  - Implement all agent endpoints from design.md
  - Add auth middleware to all routes
  - Purpose: Expose project and agent management APIs
  - _Leverage: design.md API Endpoints - Projects and Agents_
  - _Requirements: REQ-2, REQ-3_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in REST API design | Task: Create routes for projects and agents following design.md API Endpoints sections. All routes require auth middleware. POST /projects should trigger createDefaultAgents via AgentService. Include Zod validation for request bodies | Restrictions: Do not expose routes not in design.md, verify project/agent ownership before operations, return 404 for non-existent resources | _Leverage: design.md "API Endpoints - Projects" and "API Endpoints - Agents" | _Requirements: REQ-2 (Project Management), REQ-3 (Agent Management) | Success: All endpoints work as documented, authorization enforced, proper status codes | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement routes 4) Log implementation 5) Mark complete_

- [x] 2.8 Implement file browsing endpoint
  - Files: `backend/src/routes/file.routes.ts`, `backend/src/services/file.service.ts`
  - Implement GET /api/browse for directory listing
  - Implement GET /api/files/read for file content
  - Add path security validation
  - Purpose: Enable directory browsing and file reading
  - _Leverage: clipendra-repo DirectoryBrowser backend, design.md API Endpoints - Files_
  - _Requirements: REQ-2 (DirectoryBrowser), REQ-5 (MD file viewing)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in file system operations and security | Task: Create file browsing endpoints following design.md. GET /api/browse returns directory contents with breadcrumb info. GET /api/files/read returns file content (for MD files). Implement path traversal prevention and ownership checking | Restrictions: Only allow browsing under /home, reject paths with .., do not follow symlinks outside allowed paths, limit file read to reasonable size (1MB) | _Leverage: clipendra-repo file browsing implementation for security patterns | _Requirements: REQ-2 (DirectoryBrowser modal), REQ-5 (MD file viewing) | Success: Directory listing works, file reading works, path traversal attacks blocked | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement file endpoints 4) Log implementation 5) Mark complete_

## Phase 3: CLI Integration

- [x] 3.1 Implement ClaudeCliService core
  - Files: `backend/src/services/claude-cli.service.ts`
  - Create spawnClaude method with proper argument building
  - Parse NDJSON stream events (system, assistant, tool_use, tool_result, result)
  - Extract session_id from first system event
  - Handle CLI errors (not authenticated, terms required)
  - Purpose: Core CLI integration for chat
  - _Leverage: clipendra-repo ClaudeCliService_
  - _Requirements: REQ-4 (Chat Interface), REQ-8 (Session Persistence)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in process management and streaming | Task: Implement ClaudeCliService following design.md interface. Use child_process.spawn with --output-format stream-json. Parse NDJSON events, extract session_id from system event, handle --append-system-prompt for agent prompts, --resume for session continuity. Handle CLI-specific errors per design.md Error Handling section | Restrictions: Do not use exec (use spawn for streaming), timeout after 10 minutes, do not pass secrets via CLI arguments, use --dangerously-skip-permissions only when configured | _Leverage: clipendra-repo ClaudeCliService implementation | _Requirements: REQ-4 (Chat Interface), REQ-8 (Session Persistence) | Success: CLI spawns correctly, NDJSON parsed, session_id extracted, errors mapped correctly | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement CLI service 4) Log implementation 5) Mark complete_

- [x] 3.2 Implement TranscriptService for history loading
  - Files: `backend/src/services/transcript.service.ts`
  - Find transcript files in ~/.claude/projects/
  - Parse JSONL transcript files
  - Extract messages for display
  - Purpose: Load chat history from CLI transcripts
  - _Leverage: design.md Technical Notes about transcript files_
  - _Requirements: REQ-4 (message history), REQ-8 (Session Persistence)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in file parsing and data extraction | Task: Implement TranscriptService following design.md interface. Find project transcript directory using hash of working_directory. Parse JSONL session files to extract messages for display. Handle missing transcripts gracefully | Restrictions: Do not modify transcript files, handle large files efficiently (stream parsing), gracefully handle corrupted JSONL | _Leverage: design.md Technical Notes about ~/.claude/projects/<hash>/sessions/*.jsonl | _Requirements: REQ-4 (message history display), REQ-8 (Session Persistence) | Success: Transcript files found, messages parsed correctly, history loadable for existing sessions | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement transcript service 4) Log implementation 5) Mark complete_

- [x] 3.3 Setup WebSocket server with authentication
  - Files: `backend/src/websocket/index.ts`, `backend/src/websocket/types.ts`
  - Create WebSocket server attached to HTTP server
  - Implement JWT authentication on connection
  - Define message types from design.md
  - Handle connection/disconnection events
  - Purpose: Enable real-time communication
  - _Leverage: clipendra-repo WebSocket setup, design.md WebSocket Protocol_
  - _Requirements: REQ-4 (real-time streaming)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in WebSocket and real-time systems | Task: Setup WebSocket server using 'ws' library. Authenticate connections using JWT from query string or first message. Define all message types from design.md WebSocket Protocol section. Track connected clients with user context | Restrictions: Reject connections without valid JWT, do not use Socket.io (use 'ws'), implement ping/pong for connection health | _Leverage: clipendra-repo websocket/index.ts setup, design.md "WebSocket Protocol" section | _Requirements: REQ-4 (real-time streaming) | Success: WebSocket server starts, JWT auth works, connection state tracked, message types defined | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement WebSocket server 4) Log implementation 5) Mark complete_

- [x] 3.4 Implement WebSocket message handler for chat
  - Files: `backend/src/websocket/handler.ts`
  - Handle 'query' messages from clients
  - Integrate with ClaudeCliService for CLI spawning
  - Stream CLI output to WebSocket client
  - Send completion messages with token usage
  - Purpose: Connect WebSocket to CLI for real-time chat
  - _Leverage: clipendra-repo WebSocket handler_
  - _Requirements: REQ-4, REQ-7 (Token Usage)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in real-time messaging and process integration | Task: Implement WebSocket message handler for 'query' messages. Load agent system prompt from database, spawn CLI with ClaudeCliService, stream output events to client, send 'complete' message with usage stats. Update agent session_id in database | Restrictions: One CLI process per WebSocket connection at a time, cleanup process on disconnect, timeout long-running processes | _Leverage: clipendra-repo websocket/handler.ts for message routing pattern | _Requirements: REQ-4 (Chat Interface), REQ-7 (Token Usage Monitoring) | Success: Query triggers CLI spawn, responses stream to client, completion includes usage, session_id saved | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement handler 4) Log implementation 5) Mark complete_

- [x] 3.5 Add WebSocket reconnection and error handling
  - Files: `backend/src/websocket/handler.ts` (extend)
  - Implement reconnection handling on server side
  - Map CLI errors to WebSocket error messages
  - Handle process cleanup on disconnect
  - Purpose: Robust WebSocket error handling
  - _Leverage: design.md Error Handling section_
  - _Requirements: REQ-4 (reconnection), Non-functional (Reliability)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in error handling and reliability | Task: Extend WebSocket handler with error scenarios from design.md Error Handling section. Map CLI errors (not authenticated, terms required, timeout) to specific error codes. Cleanup CLI processes on WebSocket disconnect. Handle token limit warning at 120K tokens | Restrictions: Do not crash server on client errors, always cleanup resources, send structured error messages | _Leverage: design.md "Error Handling" section for all error scenarios | _Requirements: REQ-4 (reconnection with backoff), Non-functional (Reliability) | Success: All error scenarios handled, processes cleaned up, error messages structured | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Extend handler 4) Log implementation 5) Mark complete_

## Phase 4: Frontend Core

- [x] 4.1 Create React app entry point and router
  - Files: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/router.tsx`
  - Setup React 18 with StrictMode
  - Configure React Router with routes for login, register, main app
  - Create route guards for authenticated routes
  - Purpose: Frontend application foundation
  - _Leverage: bolt_ai_front App.tsx structure_
  - _Requirements: REQ-1 (auth flow routing)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in React architecture | Task: Create React app entry point with React 18 StrictMode. Setup React Router with routes: /login, /register, / (main app). Create ProtectedRoute component that redirects to /login if not authenticated. Use lazy loading for main app route | Restrictions: Do not add routes not needed for MVP, use React Router v6 patterns, do not implement auth logic yet (just route structure) | _Leverage: bolt_ai_front App.tsx for route structure pattern | _Requirements: REQ-1 (auth flow routing) | Success: App renders, routes work, protected routes redirect when not authenticated | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create app and router 4) Log implementation 5) Mark complete_

- [x] 4.2 Implement useAuthStore with Zustand
  - Files: `frontend/src/store/authStore.ts`
  - Create auth store with persist middleware
  - Implement login, register, logout, checkAuth actions
  - Store token in localStorage
  - Purpose: Manage authentication state
  - _Leverage: design.md useAuthStore interface, clipendra userStore pattern_
  - _Requirements: REQ-1 (User Authentication)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in state management | Task: Create useAuthStore following design.md interface exactly. Use Zustand with persist middleware to store token in localStorage. Implement login/register that call backend APIs, logout that clears state, checkAuth that validates stored token | Restrictions: Do not store password in state, clear token on 401 responses, use persist middleware for token only | _Leverage: design.md "useAuthStore" interface, clipendra-repo userStore.ts pattern | _Requirements: REQ-1 (User Authentication) | Success: Auth actions work, token persisted, state updates correctly | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement store 4) Log implementation 5) Mark complete_

- [x] 4.3 Implement useProjectStore and useAgentStore
  - Files: `frontend/src/store/projectStore.ts`, `frontend/src/store/agentStore.ts`
  - Create project store with CRUD actions
  - Create agent store with project-scoped loading
  - Persist current project selection
  - Purpose: Manage project and agent state
  - _Leverage: design.md store interfaces_
  - _Requirements: REQ-2, REQ-3_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in state management | Task: Create useProjectStore and useAgentStore following design.md interfaces. Project store should persist currentProject selection. Agent store should fetch agents when project changes. Both stores call backend APIs for CRUD operations | Restrictions: Clear agents when project changes, handle loading states, do not duplicate API logic | _Leverage: design.md "useProjectStore" and "useAgentStore" interfaces | _Requirements: REQ-2 (Project Management), REQ-3 (Agent Management) | Success: Projects load and persist, agents load per project, CRUD operations work | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement stores 4) Log implementation 5) Mark complete_

- [x] 4.4 Implement useMessageStore and useTabStore
  - Files: `frontend/src/store/messageStore.ts`, `frontend/src/store/tabStore.ts`
  - Create message store for chat messages
  - Create tab store for open chat/doc tabs
  - Handle message streaming updates
  - Purpose: Manage chat and navigation state
  - _Leverage: design.md store interfaces_
  - _Requirements: REQ-4, REQ-5_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in state management | Task: Create useMessageStore and useTabStore following design.md interfaces. Message store should handle addMessage, updateLastMessage for streaming, setContextUsage for token tracking. Tab store manages open agent chats and document tabs | Restrictions: Do not persist messages (loaded from backend), limit open tabs to reasonable number, handle streaming message updates efficiently | _Leverage: design.md "useMessageStore" and "useTabStore" interfaces | _Requirements: REQ-4 (Chat Interface), REQ-5 (Document Viewer tabs) | Success: Messages can be added/updated, tabs open/close, streaming updates work | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement stores 4) Log implementation 5) Mark complete_

- [x] 4.5 Implement useWebSocket hook
  - Files: `frontend/src/hooks/useWebSocket.ts`
  - Create WebSocket connection with auth token
  - Implement reconnection with exponential backoff
  - Handle message sending and receiving
  - Queue messages during reconnection
  - Purpose: WebSocket communication abstraction
  - _Leverage: clipendra-repo useWebSocket hook_
  - _Requirements: REQ-4 (real-time streaming), Non-functional (Reliability)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in real-time communication | Task: Create useWebSocket hook with connection management. Connect with JWT token in query string. Implement exponential backoff reconnection (1s, 2s, 4s... max 30s) per design.md. Queue messages during disconnect, send on reconnect. Parse incoming messages by type | Restrictions: Auto-reconnect only on abnormal close, clear queue on intentional disconnect, do not reconnect if token invalid | _Leverage: clipendra-repo useWebSocket.ts hook implementation | _Requirements: REQ-4 (WebSocket streaming, reconnection) | Success: Connection established with auth, reconnects on disconnect, messages sent/received | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement hook 4) Log implementation 5) Mark complete_

- [x] 4.6 Create API utility functions
  - Files: `frontend/src/lib/api.ts`
  - Create fetch wrapper with auth header
  - Handle 401 responses (redirect to login)
  - Add request/response error handling
  - Purpose: Centralized API communication
  - _Leverage: clipendra-repo API patterns_
  - _Requirements: Non-functional (Security, Clean Interfaces)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in API integration | Task: Create API utility with fetch wrapper that automatically adds Authorization header from auth store. Handle 401 by clearing auth state and redirecting to login. Provide typed methods for GET, POST, PUT, DELETE. Handle network errors gracefully | Restrictions: Do not use axios (use native fetch), always include Content-Type header for JSON, do not retry on 4xx errors | _Leverage: clipendra-repo api utility patterns | _Requirements: Non-functional (Security, Clean Interfaces) | Success: API calls include auth header, 401 handled correctly, errors formatted nicely | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement API utility 4) Log implementation 5) Mark complete_

## Phase 5: UI Components

- [x] 5.1 Create LoginPage and RegisterPage
  - Files: `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/RegisterPage.tsx`
  - Create login form with email/password
  - Create register form with validation
  - Handle loading and error states
  - Purpose: Authentication UI
  - _Leverage: TailwindCSS form patterns_
  - _Requirements: REQ-1 (User Authentication)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in forms and UX | Task: Create LoginPage and RegisterPage with email/password forms. Use useAuthStore for actions. Show loading spinner during submission, display error messages clearly. Add link to switch between login/register. Mobile-friendly with 44px touch targets | Restrictions: Do not add social login buttons, validate email format client-side, minimum password 8 chars with feedback | _Leverage: TailwindCSS form styling patterns | _Requirements: REQ-1 (User Authentication) | Success: Forms submit correctly, errors displayed, navigation between pages works | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create pages 4) Log implementation 5) Mark complete_

- [x] 5.2 Create MainLayout with responsive design
  - Files: `frontend/src/components/MainLayout.tsx`
  - Implement mobile layout (full-screen views)
  - Implement desktop layout (sidebar + main area)
  - Use 1024px breakpoint for switching
  - Purpose: Core responsive layout structure
  - _Leverage: clipendra-repo TelegramLayout, design.md MainLayout interface_
  - _Requirements: REQ-6 (Mobile-First Responsive UI)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in responsive design | Task: Create MainLayout following design.md interface. Desktop (>=1024px): sidebar with project selector and agent list, main content area. Mobile (<1024px): full-screen views with navigation. Use CSS media queries or Tailwind responsive classes | Restrictions: Mobile layout must be default (mobile-first), no layout shift on resize, sidebar width 280px on desktop | _Leverage: clipendra-repo TelegramLayout.tsx pattern, bolt_ai_front layout patterns | _Requirements: REQ-6 (Mobile-First Responsive UI) | Success: Layout switches at 1024px, mobile shows single panel, desktop shows sidebar+content | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.3 Create ProjectSelector component
  - Files: `frontend/src/components/ProjectSelector.tsx`
  - Dropdown for selecting active project
  - "New Project" button
  - Show project name (derived from path)
  - Purpose: Project selection UI
  - _Leverage: design.md ProjectSelector interface_
  - _Requirements: REQ-2 (Project Management)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in dropdown components | Task: Create ProjectSelector following design.md interface. Show current project name in trigger button. Dropdown lists all projects with path tooltips. "New Project" option at bottom opens DirectoryBrowser. Handle empty state | Restrictions: Do not allow deselecting all projects, show loading state while fetching, truncate long names with ellipsis | _Leverage: design.md "ProjectSelector" interface | _Requirements: REQ-2 (Project Management) | Success: Projects selectable, new project triggers DirectoryBrowser, current project highlighted | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.4 Create DirectoryBrowser modal
  - Files: `frontend/src/components/DirectoryBrowser.tsx`
  - Modal for browsing server filesystem
  - Breadcrumb navigation
  - Directory list with folder icons
  - Select current directory button
  - Purpose: Enable project directory selection
  - _Leverage: clipendra-repo DirectoryBrowser component_
  - _Requirements: REQ-2 (DirectoryBrowser modal)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in file browsers and modals | Task: Create DirectoryBrowser following design.md interface. Adapt clipendra-repo DirectoryBrowser component. Show breadcrumb path, list directories, "Select" button for current path. Start at /home. Mobile-friendly touch targets | Restrictions: Only show directories (not files), prevent navigation above /home, show loading during navigation | _Leverage: clipendra-repo DirectoryBrowser.tsx - adapt for Qomplex auth context | _Requirements: REQ-2 (DirectoryBrowser modal with breadcrumb navigation) | Success: Directory browsing works, selection returns path, breadcrumbs navigate correctly | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.5 Create AgentList component
  - Files: `frontend/src/components/AgentList.tsx`
  - List agents for current project
  - Show agent name and status indicator
  - Settings button per agent
  - Purpose: Agent selection UI
  - _Leverage: design.md AgentList interface, clipendra ChatListPanel pattern_
  - _Requirements: REQ-3 (Agent Management)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in list components | Task: Create AgentList following design.md interface. Show all agents for current project. Highlight selected agent. Settings icon button on each row. "Create Agent" button at bottom. Touch-friendly 44px row height | Restrictions: Do not show agents from other projects, handle empty state gracefully, settings icon should not trigger agent selection | _Leverage: design.md "AgentList" interface, clipendra-repo ChatListPanel pattern | _Requirements: REQ-3 (Agent Management) | Success: Agents displayed, selection works, settings accessible, create agent works | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.6 Create AgentSettingsPanel component
  - Files: `frontend/src/components/AgentSettingsPanel.tsx`
  - Edit agent name (input)
  - Edit system prompt (textarea, max 10000 chars)
  - Manage linked MD files (add/remove list)
  - Save and Cancel buttons
  - Purpose: Agent configuration UI
  - _Leverage: design.md AgentSettingsPanel interface_
  - _Requirements: REQ-3 (Agent configuration)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in form components | Task: Create AgentSettingsPanel following design.md interface. Slide-in panel or modal with form fields: name (input), system_prompt (textarea with char counter), linked_md_files (list with add button that opens file picker). Save calls updateAgent API | Restrictions: Validate system_prompt <= 10000 chars, show unsaved changes warning on cancel, disable save button while saving | _Leverage: design.md "AgentSettingsPanel" interface | _Requirements: REQ-3 (Agent settings with editable name, prompt, linked files) | Success: All fields editable, validation works, save persists changes | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.7 Create ChatPanel and MessageBubble components
  - Files: `frontend/src/components/ChatPanel.tsx`, `frontend/src/components/MessageBubble.tsx`
  - Message list with virtual scrolling consideration
  - Telegram-style message bubbles
  - Message input with send button
  - Loading indicator during streaming
  - Purpose: Core chat UI
  - _Leverage: clipendra-repo ChatPanel and MessageBubble_
  - _Requirements: REQ-4 (Chat Interface)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in chat interfaces | Task: Create ChatPanel following design.md interface. MessageBubble with Telegram-style alignment (user right, assistant left). Use react-markdown for rendering with syntax highlighting. Input at bottom with send button. Show typing indicator during streaming | Restrictions: Auto-scroll to bottom on new messages, handle long messages gracefully, mobile keyboard should not cover input | _Leverage: clipendra-repo ChatPanel.tsx and MessageBubble.tsx | _Requirements: REQ-4 (Chat Interface with message history, streaming display) | Success: Messages render correctly, markdown works, streaming visible, input functional | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create components 4) Log implementation 5) Mark complete_

- [x] 5.8 Create ToolUsageDisplay component
  - Files: `frontend/src/components/ToolUsageDisplay.tsx`
  - Display tool_use events in chat
  - Collapsible tool output
  - Different styling for different tools (Read, Write, Bash)
  - Purpose: Show CLI tool usage in chat
  - _Leverage: clipendra-repo tool display patterns_
  - _Requirements: REQ-4 (show tool usage in chat)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in data visualization | Task: Create ToolUsageDisplay component for showing tool_use and tool_result events in chat. Collapsible sections with tool name, input, and output. Different icons/colors for Read, Write, Bash, Edit tools. Show file paths clearly | Restrictions: Collapse output by default for large results, syntax highlight code in tool results, handle missing tool results gracefully | _Leverage: clipendra-repo tool usage display patterns | _Requirements: REQ-4 (show tool usage in chat) | Success: Tool usage displayed clearly, collapsible, different tools distinguished | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.9 Create TokenUsageIndicator component
  - Files: `frontend/src/components/TokenUsageIndicator.tsx`
  - Display input/output tokens for message
  - Show total session tokens
  - Warning state at 120K tokens
  - Tooltip with detailed breakdown
  - Purpose: Token usage visibility
  - _Leverage: design.md TokenUsageIndicator interface_
  - _Requirements: REQ-7 (Token Usage Monitoring)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in data display | Task: Create TokenUsageIndicator following design.md interface. Show compact token count (e.g., "12.5K tokens"). Yellow warning when >= 120K. Hover/tap shows tooltip with input tokens, output tokens, cost. Progress bar optional | Restrictions: Format large numbers nicely (K suffix), warning threshold from props (default 120000), tooltip should work on mobile (tap) | _Leverage: design.md "TokenUsageIndicator" interface | _Requirements: REQ-7 (Token Usage Monitoring with warning at 120K) | Success: Tokens displayed, warning state works, tooltip shows breakdown | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.10 Create DocViewer component
  - Files: `frontend/src/components/DocViewer.tsx`
  - Render markdown with react-markdown
  - GitHub-flavored markdown support
  - Syntax highlighting for code blocks
  - Purpose: Markdown document viewing
  - _Leverage: design.md DocViewer interface_
  - _Requirements: REQ-5 (Markdown Document Viewer)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in document rendering | Task: Create DocViewer following design.md interface. Use react-markdown with remark-gfm for GitHub-flavored markdown. Add rehype-highlight for syntax highlighting. Handle proper heading hierarchy. Show filename in header | Restrictions: Do not allow editing (view only), handle missing/empty content gracefully, use consistent code block styling | _Leverage: design.md "DocViewer" interface, design.md Technical Notes for libraries | _Requirements: REQ-5 (Markdown Document Viewer with GFM and syntax highlighting) | Success: Markdown renders correctly, code highlighted, GFM features work | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.11 Create MobileTabSwitcher component
  - Files: `frontend/src/components/MobileTabSwitcher.tsx`
  - Bottom sheet for tab selection on mobile
  - Show open agent chats and docs
  - Swipe to close tabs
  - Purpose: Mobile tab navigation
  - _Leverage: bolt_ai_front MobileTabSwitcher_
  - _Requirements: REQ-6 (Mobile tab switching), REQ-5 (swipeable doc tabs)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in mobile UX | Task: Create MobileTabSwitcher following design.md interface. Bottom sheet that slides up showing open tabs. Tab items show agent name or doc filename. Swipe left to close tab. Tap to switch. Different icons for chat vs doc tabs | Restrictions: Sheet should not block too much content, smooth animations, handle many tabs with scroll | _Leverage: bolt_ai_front MobileTabSwitcher.tsx | _Requirements: REQ-6 (Mobile tab switching), REQ-5 (swipeable doc tabs) | Success: Tab sheet opens/closes, tabs selectable, close gesture works | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

- [x] 5.12 Create MobileHeader component
  - Files: `frontend/src/components/MobileHeader.tsx`
  - Back button for navigation
  - Current agent/doc name
  - Settings and tab switcher buttons
  - Purpose: Mobile navigation header
  - _Leverage: clipendra-repo mobile header patterns_
  - _Requirements: REQ-6 (Mobile header with back button)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in mobile navigation | Task: Create MobileHeader for mobile layout. Back button on left (navigates to agent list). Title in center (agent name or doc filename). Settings icon and tab count button on right. Fixed position at top | Restrictions: Height 56px maximum, touch targets 44px minimum, hide on desktop (only for mobile layout) | _Leverage: clipendra-repo mobile header patterns, Telegram-style header | _Requirements: REQ-6 (Mobile header with back button) | Success: Header displays on mobile, back navigation works, buttons accessible | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create component 4) Log implementation 5) Mark complete_

## Phase 6: Integration

- [x] 6.1 Connect ChatPanel to WebSocket for streaming
  - Files: `frontend/src/components/ChatPanel.tsx` (extend), `frontend/src/pages/ChatPage.tsx`
  - Connect useWebSocket to ChatPanel
  - Handle stream events to update messages
  - Show loading state during response
  - Purpose: Wire up real-time chat
  - _Leverage: clipendra-repo chat WebSocket integration_
  - _Requirements: REQ-4 (real-time streaming)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in real-time integrations | Task: Connect ChatPanel to useWebSocket. On send message, emit 'query' WebSocket message. Handle 'stream' events to update last message content. Handle 'complete' to show token usage. Handle 'error' to show error message. Create ChatPage wrapper | Restrictions: Show typing indicator during streaming, disable input while waiting for response, handle disconnect gracefully | _Leverage: clipendra-repo chat WebSocket integration pattern | _Requirements: REQ-4 (Stream response in real-time via WebSocket) | Success: Messages send via WebSocket, responses stream, completion shows tokens | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Integrate WebSocket 4) Log implementation 5) Mark complete_

- [x] 6.2 Integrate DirectoryBrowser with project creation
  - Files: `frontend/src/components/ProjectSelector.tsx` (extend)
  - Open DirectoryBrowser on "New Project"
  - Call createProject with selected path
  - Handle errors (duplicate path)
  - Purpose: Complete project creation flow
  - _Leverage: design.md project creation flow_
  - _Requirements: REQ-2 (DirectoryBrowser creates project)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in component integration | Task: Integrate DirectoryBrowser with ProjectSelector. When "New Project" clicked, open DirectoryBrowser modal. On path selection, call projectStore.createProject. Handle success (select new project) and error (show message for duplicate). Close modal on complete | Restrictions: Validate path selected before submit, show loading during creation, handle 409 conflict with user-friendly message | _Leverage: design.md project creation flow, REQ-2 acceptance criteria | _Requirements: REQ-2 (DirectoryBrowser creates project with selected path) | Success: Full flow works: open browser -> select path -> create project -> project selected | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Integrate components 4) Log implementation 5) Mark complete_

- [x] 6.3 Integrate AgentSettings with backend updates
  - Files: `frontend/src/components/AgentSettingsPanel.tsx` (extend)
  - Connect save to agentStore.updateAgent
  - Load linked MD files via file API
  - Handle optimistic updates
  - Purpose: Complete agent configuration flow
  - _Leverage: design.md agent update flow_
  - _Requirements: REQ-3 (Agent configuration saves)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in form state management | Task: Connect AgentSettingsPanel to agentStore. Save button calls updateAgent with form data. For adding linked MD files, open file browser filtered to *.md. Show save success feedback. Handle validation errors from backend | Restrictions: Debounce system_prompt validation, confirm before discarding unsaved changes, update local agent state on success | _Leverage: design.md agent update API | _Requirements: REQ-3 (Agent configuration with editable fields) | Success: Settings save to backend, linked files manageable, feedback shown | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Integrate settings 4) Log implementation 5) Mark complete_

- [x] 6.4 Integrate DocViewer with linked MD files
  - Files: `frontend/src/pages/DocViewerPage.tsx`
  - Load MD file content via file API
  - Open in tab from agent settings
  - Handle file not found errors
  - Purpose: Complete document viewing flow
  - _Leverage: design.md file read API_
  - _Requirements: REQ-5 (View linked MD files)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in content loading | Task: Create DocViewerPage that loads MD file content from /api/files/read. Integrate with tab system - clicking linked file in agent settings opens doc tab. Handle loading, error (file not found), and empty states. Show filename in tab and header | Restrictions: Cache loaded content in tab store, handle large files gracefully, show loading skeleton while fetching | _Leverage: design.md file read API endpoint | _Requirements: REQ-5 (View linked MD files in viewer tab) | Success: MD files load and display, tabs work, errors handled | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Create doc viewer page 4) Log implementation 5) Mark complete_

- [x] 6.5 Integrate session resume with chat history
  - Files: `frontend/src/pages/ChatPage.tsx` (extend)
  - Load chat history on agent selection
  - Pass session_id for --resume
  - Handle new session vs existing session
  - Purpose: Enable session continuity
  - _Leverage: design.md session resume flow_
  - _Requirements: REQ-8 (Session Persistence)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in state management | Task: When agent selected, check if agent has session_id. If yes, load history from transcript API (or display from local cache). Pass session_id with WebSocket query for --resume. Handle "Start New Session" button that clears session_id | Restrictions: Show loading while fetching history, handle missing transcripts gracefully, differentiate new vs resumed session in UI | _Leverage: design.md session resume flow, REQ-8 acceptance criteria | _Requirements: REQ-8 (Resume with --resume <session_id>, load history) | Success: History loads for existing sessions, new sessions start fresh, resume works | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement session resume 4) Log implementation 5) Mark complete_

- [x] 6.6 Implement mobile navigation flow
  - Files: `frontend/src/App.tsx` (extend), `frontend/src/components/MainLayout.tsx` (extend)
  - Swipe between open tabs
  - Back button navigation
  - Tab switching via MobileTabSwitcher
  - Purpose: Complete mobile UX
  - _Leverage: bolt_ai_front mobile navigation patterns_
  - _Requirements: REQ-6 (Mobile navigation)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in mobile UX | Task: Implement mobile navigation in MainLayout. Back button in MobileHeader returns to agent list. Swipe left/right switches between open tabs. Tab button opens MobileTabSwitcher. Track current view state (agent-list, chat, doc) | Restrictions: Smooth swipe animations (60fps), prevent accidental swipes during scroll, maintain scroll position when switching tabs | _Leverage: bolt_ai_front mobile navigation and swipe patterns | _Requirements: REQ-6 (Mobile navigation with swipes, back button) | Success: Mobile navigation intuitive, swipes work, state maintained | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement mobile nav 4) Log implementation 5) Mark complete_

## Phase 7: Testing & Polish

- [x] 7.1 Add backend unit tests for services
  - Files: `backend/src/services/*.test.ts`
  - Test AuthService (register, login, verify)
  - Test ProjectService CRUD
  - Test AgentService with default agents
  - Purpose: Backend service reliability
  - _Leverage: Vitest testing patterns_
  - _Requirements: Non-functional (Testing - 70% coverage for services)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer specializing in unit testing | Task: Create unit tests for backend services using Vitest. Test AuthService (register creates user, login returns token, verify validates token). Test ProjectService (CRUD, duplicate path rejection). Test AgentService (default agent creation, update). Mock database calls | Restrictions: Use Vitest not Jest, mock external dependencies, test both success and error paths, aim for 70% coverage | _Leverage: Vitest testing patterns | _Requirements: Non-functional (Testing - 70% coverage for services) | Success: All service methods tested, mocks work, 70%+ coverage | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Write tests 4) Log implementation 5) Mark complete_

- [x] 7.2 Add frontend component tests
  - Files: `frontend/src/components/*.test.tsx`
  - Test key components with React Testing Library
  - Test store actions with Vitest
  - Test form validation
  - Purpose: Frontend component reliability
  - _Leverage: React Testing Library patterns_
  - _Requirements: Non-functional (Testing - 50% coverage for components)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer specializing in React testing | Task: Create component tests using Vitest and React Testing Library. Test LoginPage (form submission, validation errors). Test ProjectSelector (project selection, new project). Test ChatPanel (message display, input). Test Zustand stores (actions, state transitions) | Restrictions: Use jsdom environment, mock API calls, test user interactions not implementation details, aim for 50% coverage | _Leverage: React Testing Library patterns | _Requirements: Non-functional (Testing - 50% coverage for components) | Success: Key components tested, stores tested, 50%+ coverage | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Write tests 4) Log implementation 5) Mark complete_

- [x] 7.3 Add API integration tests
  - Files: `backend/src/routes/*.test.ts`
  - Test auth flow (register -> login -> me)
  - Test project/agent CRUD flow
  - Test file browsing security
  - Purpose: API endpoint reliability
  - _Leverage: supertest for HTTP testing_
  - _Requirements: Non-functional (Testing)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer specializing in API testing | Task: Create integration tests for API routes using supertest and Vitest. Test full auth flow (register user, login, access protected route). Test project CRUD with auth. Test agent CRUD. Test file browse path security (reject .., reject outside /home) | Restrictions: Use test database (or mock), clean up test data, test auth rejection (401), test validation errors (400) | _Leverage: supertest for HTTP testing | _Requirements: Non-functional (Testing) | Success: All API flows tested, auth required enforced, security validated | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Write integration tests 4) Log implementation 5) Mark complete_

- [x] 7.4 Add comprehensive error handling
  - Files: Multiple frontend/backend files
  - Add React error boundaries
  - Improve error messages for all error scenarios
  - Add user-friendly error displays
  - Purpose: Graceful error handling
  - _Leverage: design.md Error Handling section_
  - _Requirements: Non-functional (Reliability, Usability)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Full-stack Developer specializing in error handling | Task: Implement comprehensive error handling per design.md Error Handling section. Add React ErrorBoundary at app root. Create user-friendly error display components. Handle all error scenarios: CLI not authenticated, terms required, WebSocket disconnect, timeout, token limit, invalid JWT, path conflict | Restrictions: Never expose internal errors to users, log errors with context, show actionable messages, maintain app stability on errors | _Leverage: design.md "Error Handling" section for all scenarios | _Requirements: Non-functional (Reliability, Usability - clear error messages) | Success: All error scenarios handled gracefully, messages helpful, app doesn't crash | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Implement error handling 4) Log implementation 5) Mark complete_

- [x] 7.5 Add loading states and skeletons
  - Files: Multiple frontend files
  - Add loading skeletons for lists
  - Add spinners for async actions
  - Add progress indicators where appropriate
  - Purpose: Improve perceived performance
  - _Leverage: TailwindCSS animation utilities_
  - _Requirements: Non-functional (Usability - loading states)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in UX | Task: Add loading states throughout the app. Create skeleton components for AgentList, MessageList. Add spinners for form submissions, API calls. Show reconnecting indicator for WebSocket. Ensure all async operations have visual feedback | Restrictions: Skeletons should match final layout, avoid layout shift, spinners should be subtle, don't block interaction unnecessarily | _Leverage: TailwindCSS animation utilities for skeletons | _Requirements: Non-functional (Usability - loading states for all async operations) | Success: All async operations show loading state, skeletons look good, no layout shift | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Add loading states 4) Log implementation 5) Mark complete_

- [x] 7.6 PWA configuration and manifest
  - Files: `frontend/public/manifest.json`, `frontend/src/sw.ts`, `frontend/index.html`
  - Create PWA manifest with app info
  - Add service worker for offline shell
  - Configure icons and theme colors
  - Purpose: Enable PWA installation
  - _Leverage: PWA best practices_
  - _Requirements: REQ-6 (PWA support)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in PWA | Task: Configure PWA for Qomplex. Create manifest.json with app name, icons (192x192, 512x512), theme color, background color. Register service worker for offline app shell caching. Add meta tags to index.html for PWA. Use vite-plugin-pwa if helpful | Restrictions: Offline mode is out of scope - just cache app shell, do not cache API responses, test on mobile devices | _Leverage: PWA best practices, vite-plugin-pwa | _Requirements: REQ-6 (PWA - work as standalone app) | Success: App installable on mobile, opens in standalone mode, icons display correctly | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Configure PWA 4) Log implementation 5) Mark complete_

- [x] 7.7 Final cleanup and documentation
  - Files: `README.md`, inline code comments
  - Add README with setup instructions
  - Add code comments for complex logic
  - Remove unused code and dependencies
  - Ensure all environment variables documented
  - Purpose: Production readiness
  - _Leverage: Standard documentation practices_
  - _Requirements: Non-functional (Code Architecture)_
  - _Prompt: Implement the task for spec qomplex-mvp, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Senior Developer specializing in code quality | Task: Final cleanup for production. Update README with: project overview, setup instructions (Docker and local), environment variables, deployment guide. Add inline comments for complex logic (ClaudeCliService, WebSocket handler). Remove unused imports, dead code. Verify all .env.example variables documented | Restrictions: Do not over-document obvious code, focus on setup instructions, ensure Docker deployment works as documented | _Leverage: Standard documentation practices | _Requirements: Non-functional (Code Architecture and Modularity) | Success: README complete, code clean, documentation accurate, deployment works | Instructions: 1) Run spec-workflow-guide 2) Mark in-progress 3) Cleanup and document 4) Log implementation 5) Mark complete_

---

## Task Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1. Project Setup | 5 | Monorepo, TypeScript, Docker, shared types |
| 2. Backend Core | 8 | Express, PostgreSQL, Auth, Services, Routes |
| 3. CLI Integration | 5 | ClaudeCliService, Transcripts, WebSocket |
| 4. Frontend Core | 6 | React app, Zustand stores, hooks |
| 5. UI Components | 12 | All UI components from design.md |
| 6. Integration | 6 | Connect frontend to backend |
| 7. Testing & Polish | 7 | Tests, error handling, PWA |
| **Total** | **49** | |

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| REQ-1: User Authentication | 2.3, 2.4, 4.1, 4.2, 5.1 |
| REQ-2: Project Management | 2.5, 2.7, 2.8, 5.3, 5.4, 6.2 |
| REQ-3: Agent Management | 2.6, 2.7, 5.5, 5.6, 6.3 |
| REQ-4: Chat Interface | 3.1, 3.3, 3.4, 3.5, 5.7, 5.8, 6.1 |
| REQ-5: Markdown Document Viewer | 2.8, 5.10, 6.4 |
| REQ-6: Mobile-First Responsive UI | 1.5, 5.2, 5.11, 5.12, 6.6, 7.6 |
| REQ-7: Token Usage Monitoring | 3.4, 5.9 |
| REQ-8: Session Persistence | 3.1, 3.2, 6.5 |

---

*Last updated: December 2025*
