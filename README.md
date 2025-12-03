# Qomplex

A web interface for Claude Code CLI - AI Agent Orchestration System

## Overview

Qomplex is a web-based interface that enables users to interact with Claude Code CLI through a modern, mobile-first UI. It provides project management, multiple AI agents per project, and real-time streaming chat capabilities.

### Key Features

- **User Authentication**: Secure JWT-based authentication with register/login flow
- **Project Management**: Create and manage projects linked to working directories on your server
- **AI Agents**: 7 pre-configured agents per project plus custom agent creation with editable system prompts
- **Real-time Chat**: WebSocket-based streaming communication with Claude CLI using NDJSON format
- **Session Persistence**: Resume conversations using Claude's `--resume` flag
- **Mobile-First Design**: Responsive UI optimized for mobile devices with swipe navigation
- **Document Viewer**: View linked Markdown files with syntax highlighting
- **Token Usage Monitoring**: Track input/output tokens with warning at 120K tokens
- **PWA Support**: Installable as a Progressive Web App on mobile devices

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | Node.js 20, Express, TypeScript, WebSocket (ws), Pino Logger |
| Database | PostgreSQL 16 |
| CLI Integration | child_process.spawn with `--output-format stream-json` |
| Deployment | Docker Compose with multi-stage build |

## Prerequisites

Before setting up Qomplex, ensure you have:

1. **Node.js** >= 18.0.0 (20.x recommended)
2. **Docker** and **Docker Compose** (for containerized deployment)
3. **Claude Code CLI** installed and authenticated:
   ```bash
   # Install Claude CLI (if not already installed)
   npm install -g @anthropic/claude-cli

   # Authenticate with your Anthropic account
   claude login
   ```

## Project Structure

```
qomplex/
├── package.json              # Root monorepo configuration (npm workspaces)
├── docker-compose.yml        # Docker services (app, postgres, dev)
├── Dockerfile                # Production multi-stage build
├── Dockerfile.dev            # Development build with hot reload
├── tsconfig.json             # Root TypeScript config
├── .env.example              # Environment variables template
│
├── frontend/                 # React + Vite frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx          # App entry point
│       ├── App.tsx           # Root component with routing
│       ├── router.tsx        # React Router configuration
│       ├── index.css         # TailwindCSS imports
│       ├── components/       # Reusable UI components
│       ├── pages/            # Page components
│       ├── store/            # Zustand state stores
│       ├── hooks/            # Custom React hooks (useWebSocket)
│       └── lib/              # Utilities (API client)
│
├── backend/                  # Express backend
│   ├── package.json
│   └── src/
│       ├── index.ts          # Server entry point
│       ├── app.ts            # Express application setup
│       ├── logger.ts         # Pino logger configuration
│       ├── db/               # Database connection & migrations
│       ├── services/         # Business logic (auth, projects, agents, claude-cli)
│       ├── routes/           # API endpoints
│       ├── middleware/       # Auth and error handling middleware
│       └── websocket/        # Real-time communication (ws)
│
└── shared/                   # Shared types & validation
    ├── package.json
    └── src/
        ├── types/            # TypeScript interfaces
        ├── schemas/          # Zod validation schemas
        └── index.ts          # Package exports
```

## Setup Instructions

### Option 1: Docker Deployment (Recommended for Production)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alienxs2/qomplex.git
   cd qomplex
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** (edit `.env`):
   ```bash
   # IMPORTANT: Change these for production!
   JWT_SECRET=your_secure_secret_minimum_32_characters_long
   POSTGRES_PASSWORD=your_secure_database_password
   ```

4. **Start production services:**
   ```bash
   docker-compose up -d qomplex-app qomplex-postgres
   ```

5. **Check service health:**
   ```bash
   docker-compose ps
   docker-compose logs qomplex-app
   ```

6. **Access the application:**
   - Web UI: http://localhost:3000
   - Health check: http://localhost:3000/health

### Option 2: Docker Development Mode

For development with hot reload and source maps:

```bash
# Start development services (includes dev profile)
docker-compose --profile dev up qomplex-dev qomplex-postgres
```

This exposes:
- Backend API: http://localhost:3000
- Frontend Vite Dev Server: http://localhost:5173

### Option 3: Local Development (without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (via Docker or local install):
   ```bash
   # Using Docker (recommended)
   docker-compose up -d qomplex-postgres

   # Or configure DATABASE_URL for your local PostgreSQL
   ```

3. **Create and configure `.env`:**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

4. **Build shared package first:**
   ```bash
   npm run build:shared
   ```

5. **Start backend** (in one terminal):
   ```bash
   npm run dev:backend
   ```

6. **Start frontend** (in another terminal):
   ```bash
   npm run dev:frontend
   ```

7. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode (development/production) | `development` | No |
| `PORT` | Backend server port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection string | See .env.example | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password (for Docker) | `qomplex_dev_password` | Yes (production) |
| `JWT_SECRET` | Secret for JWT token signing (min 32 chars) | Dev default provided | Yes (production) |
| `CLAUDE_CLI_TIMEOUT_MS` | CLI command timeout in milliseconds | `600000` (10 min) | No |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:3000` | No |
| `VITE_WS_URL` | Frontend WebSocket URL | `ws://localhost:3000` | No |

**Security Notes:**
- Always change `JWT_SECRET` and `POSTGRES_PASSWORD` for production deployments
- `JWT_SECRET` must be at least 32 characters long
- Database port is not exposed externally in Docker for security

## Development Commands

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:shared
npm run build:frontend
npm run build:backend

# Development mode
npm run dev                  # Start all in dev mode
npm run dev:frontend         # Start frontend only
npm run dev:backend          # Start backend only

# Testing
npm run test                 # Run all tests

# Linting
npm run lint                 # Lint all packages

# Clean node_modules
npm run clean
```

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate and get JWT token |
| `/api/auth/me` | GET | Get current user info (protected) |

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List user's projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/:id` | GET | Get project details |
| `/api/projects/:id` | DELETE | Delete project and its agents |

### Agents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/:projectId/agents` | GET | List project's agents |
| `/api/projects/:projectId/agents` | POST | Create custom agent |
| `/api/agents/:id` | PUT | Update agent (name, prompt, linked files) |
| `/api/agents/:id` | DELETE | Delete agent |

### Files

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/browse` | GET | Browse directory contents (under /home) |
| `/api/files/read` | GET | Read file content (for MD files) |

### WebSocket

Connect to `ws://localhost:3000/ws` with JWT token in query string or first message.

**Client Messages:**
- `query` - Send message to Claude (includes prompt, agentId, projectId, sessionId)
- `history` - Request chat history for agent
- `cancel` - Cancel active CLI process
- `ping` - Keep-alive ping

**Server Messages:**
- `connected` - Connection established with session info
- `stream` - Streaming response content
- `tool_use` - Tool being used (Read, Write, Bash, etc.)
- `tool_result` - Tool execution result
- `complete` - Response finished with usage stats
- `history` - Chat history response
- `error` - Error occurred
- `token_warning` - Context limit approaching (120K tokens)
- `pong` - Ping response

## Default Agents

Each project is created with 7 pre-configured agents, each with a specialized system prompt:

| Agent | Purpose |
|-------|---------|
| **PM** | Project management, task coordination, planning |
| **Research** | Documentation study, API analysis, research |
| **BackDev** | Node.js/TypeScript backend development |
| **FrontDev** | React + TailwindCSS frontend development |
| **DevOps** | Docker, infrastructure, deployment |
| **CI/CD** | GitHub Actions, pipelines, automation |
| **Docs** | Documentation writing in Markdown |

Agents can be customized by editing their name, system prompt, and linked Markdown files.

## Architecture Overview

### CLI Integration

Qomplex uses `child_process.spawn()` to interact with Claude Code CLI:

```
User Message -> WebSocket -> Backend -> spawn('claude', [...args]) -> NDJSON Stream -> WebSocket -> UI
```

**Key CLI flags used:**
- `--output-format stream-json` - NDJSON streaming output
- `--resume <session_id>` - Resume previous conversation
- `--append-system-prompt <prompt>` - Agent's system prompt
- `--dangerously-skip-permissions` - Auto-accept tool use
- `--permission-mode acceptEdits` - Auto-accept file edits

### WebSocket Protocol

Real-time communication follows a simple JSON message protocol:

1. Client connects with JWT token
2. Client sends `query` message with user prompt
3. Server spawns Claude CLI process
4. Server streams NDJSON events to client as they arrive
5. Client receives `complete` message with token usage

### Session Persistence

- Each agent stores its `session_id` in the database
- When resuming, the `--resume` flag is used with the stored session_id
- Claude CLI maintains conversation history in `~/.claude/projects/<hash>/sessions/`
- Transcript service can read historical messages from JSONL files

## Troubleshooting

### Claude CLI Not Authenticated

If you see "Claude CLI is not authenticated" error:

```bash
# Run Claude CLI directly to authenticate
claude login
```

### Terms Update Required

If prompted to accept updated terms:

```bash
# Run Claude CLI and accept the terms
claude
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps qomplex-postgres

# View PostgreSQL logs
docker-compose logs qomplex-postgres

# Restart the database
docker-compose restart qomplex-postgres
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Or change PORT in .env
PORT=3001
```

## Deployment

### Production Checklist

1. Set secure `JWT_SECRET` (minimum 32 characters)
2. Set secure `POSTGRES_PASSWORD`
3. Configure reverse proxy (nginx/traefik) for HTTPS
4. Set up SSL certificates
5. Configure backup for PostgreSQL data volume
6. Set appropriate resource limits in docker-compose.yml

### Reverse Proxy Example (nginx)

```nginx
server {
    listen 443 ssl;
    server_name qomplex.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Contributing

See `.spec-workflow/specs/qomplex-mvp/tasks.md` for the full task breakdown and implementation guidelines.

## License

MIT
