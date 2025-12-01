# Qomplex

Web interface for Claude Code CLI - AI Agent Orchestration System

## Overview

Qomplex is a web-based interface that enables users to interact with Claude Code CLI through a modern, mobile-first UI. It provides project management, multiple AI agents per project, and real-time streaming chat capabilities.

### Key Features

- **Project Management**: Create and manage projects linked to working directories
- **AI Agents**: Pre-configured and custom agents with editable system prompts
- **Real-time Chat**: WebSocket-based streaming communication with Claude CLI
- **Session Persistence**: Resume conversations using Claude's `--resume` flag
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Docker Deployment**: Production-ready containerized deployment

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | Node.js, Express, TypeScript, WebSocket (ws) |
| Database | PostgreSQL 16 |
| CLI Integration | child_process.spawn with `--output-format stream-json` |
| Deployment | Docker Compose |

## Project Structure

```
qomplex/
├── package.json              # Root monorepo configuration
├── docker-compose.yml        # Docker services (app, postgres)
├── Dockerfile               # Production multi-stage build
├── Dockerfile.dev           # Development build with hot reload
├── tsconfig.json            # Root TypeScript config
│
├── frontend/                # React + Vite frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       └── index.css
│
├── backend/                 # Express backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts         # Entry point
│       ├── app.ts           # Express application
│       ├── logger.ts        # Pino logger
│       ├── db/              # Database connection & migrations
│       ├── services/        # Business logic
│       ├── routes/          # API endpoints
│       ├── middleware/      # Auth, error handling
│       └── websocket/       # Real-time communication
│
├── shared/                  # Shared types & validation
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── types/           # TypeScript interfaces
│       ├── schemas/         # Zod validation schemas
│       └── index.ts
│
└── docs/                    # Documentation
    └── claudecodecli/       # Claude Code CLI reference
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- Claude Code CLI installed and authenticated

### Running with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alienxs2/qomplex.git
   cd qomplex
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start production services:**
   ```bash
   docker-compose up -d qomplex-app qomplex-postgres
   ```

4. **Access the application:**
   - Web UI: http://localhost:3000

### Development Mode

For development with hot reload:

```bash
# Start development services
docker-compose --profile dev up qomplex-dev qomplex-postgres
```

This exposes:
- Backend: http://localhost:3000
- Frontend (Vite): http://localhost:5173

### Local Development (without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (manually or via Docker):
   ```bash
   docker-compose up -d qomplex-postgres
   ```

3. **Start backend:**
   ```bash
   npm run dev:backend
   ```

4. **Start frontend** (in another terminal):
   ```bash
   npm run dev:frontend
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | - |
| `POSTGRES_PASSWORD` | PostgreSQL password | qomplex_dev_password |
| `CLAUDE_CLI_TIMEOUT_MS` | CLI command timeout | 600000 (10 min) |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project

### Agents
- `GET /api/projects/:projectId/agents` - List project's agents
- `POST /api/projects/:projectId/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Files
- `GET /api/browse` - Browse directory contents
- `GET /api/files/read` - Read file content

### WebSocket
- `ws://localhost:3000/ws` - Real-time chat (requires JWT auth)

## Default Agents

Each project is created with 7 pre-configured agents:

| Agent | Purpose |
|-------|---------|
| PM | Project management, coordination |
| Research | Documentation study, analysis |
| BackDev | Node.js/TypeScript backend |
| FrontDev | React + TailwindCSS frontend |
| DevOps | Docker, infrastructure |
| CI/CD | GitHub Actions, pipelines |
| Docs | Documentation in Markdown |

## Current Status

**Progress: 18/49 tasks (37%)**

| Phase | Status | Tasks |
|-------|--------|-------|
| 1. Project Setup | COMPLETE | 5/5 |
| 2. Backend Core | COMPLETE | 8/8 |
| 3. CLI Integration | COMPLETE | 5/5 |
| 4. Frontend Core | PENDING | 0/6 |
| 5. UI Components | PENDING | 0/12 |
| 6. Integration | PENDING | 0/6 |
| 7. Testing & Polish | PENDING | 0/7 |

### Completed Features
- Monorepo structure with npm workspaces
- Express backend with PostgreSQL
- JWT authentication
- Project and Agent CRUD operations
- File browsing API
- Claude CLI integration with NDJSON streaming
- WebSocket server for real-time chat
- Session transcript loading

### In Progress
- Frontend React application (Phase 4)

## Architecture Notes

### CLI Integration
Qomplex uses `child_process.spawn()` to interact with Claude Code CLI:
- Output format: `--output-format stream-json`
- Session resume: `--resume <session_id>`
- System prompt: `--append-system-prompt`
- Working directory: `--cwd <path>`

### WebSocket Protocol
Messages are JSON with a `type` field:
- `query` - User message to Claude
- `stream` - Streaming response chunks
- `complete` - Response finished with usage stats
- `error` - Error occurred

## Contributing

See `.spec-workflow/specs/qomplex-mvp/tasks.md` for the full task breakdown and implementation guidelines.

## License

MIT
