/**
 * Shared types for Qomplex MVP
 * Based on design.md Data Models section
 */

// User type
export interface User {
  id: string;              // UUID
  email: string;           // Unique
  password_hash: string;   // bcrypt
  created_at: Date;
  updated_at: Date;
}

// User without sensitive data (for API responses)
export interface UserPublic {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// Project type
export interface Project {
  id: string;              // UUID
  user_id: string;         // FK to users
  name: string;            // Display name (derived from path)
  working_directory: string; // Absolute path
  created_at: Date;
  updated_at: Date;
}

// Agent type
export interface Agent {
  id: string;              // UUID
  project_id: string;      // FK to projects
  name: string;            // e.g., "BackDev", "PM"
  system_prompt: string;   // Max 10000 chars
  session_id: string | null; // CLI session ID for --resume
  linked_md_files: string[]; // Array of file paths
  created_at: Date;
  updated_at: Date;
}

// Agent Session type (for token tracking)
export interface AgentSession {
  id: string;              // UUID
  agent_id: string;        // FK to agents
  cli_session_id: string;  // From Claude CLI system event
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  created_at: Date;
  ended_at: Date | null;
}

// Token Usage type
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

// Context Usage type (for UI display)
export interface ContextUsage {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  warningThreshold: number; // default 120000
}

// Message type for chat
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  usage?: TokenUsage;
  toolUse?: ToolUseInfo[];
}

// Tool usage information
export interface ToolUseInfo {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'completed' | 'error';
}

// Tab data for UI
export interface TabData {
  id: string;
  type: 'chat' | 'doc';
  title: string;
  agentId?: string;
  filePath?: string;
}

// Directory item for file browser
export interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: Date;
}

// Default Agent Template type
export type DefaultAgentTemplate = Omit<
  Agent,
  'id' | 'project_id' | 'session_id' | 'linked_md_files' | 'created_at' | 'updated_at'
>;

// Default agents configuration (7 agents as per design.md)
export const DEFAULT_AGENTS: DefaultAgentTemplate[] = [
  {
    name: 'PM',
    system_prompt: 'You are a Project Manager. Coordinate tasks, review progress, make architectural decisions. Focus on planning and delegation.'
  },
  {
    name: 'Research',
    system_prompt: 'You are a Research agent. Study documentation, analyze codebases, find solutions. Provide detailed findings with sources.'
  },
  {
    name: 'BackDev',
    system_prompt: 'You are a Backend Developer. Write Node.js/TypeScript code, implement APIs, handle database operations. Follow best practices.'
  },
  {
    name: 'FrontDev',
    system_prompt: 'You are a Frontend Developer. Build React components with TypeScript and TailwindCSS. Focus on responsive, accessible UI.'
  },
  {
    name: 'DevOps',
    system_prompt: 'You are a DevOps engineer. Manage Docker, containers, deployment configurations. Optimize infrastructure.'
  },
  {
    name: 'CI/CD',
    system_prompt: 'You are a CI/CD specialist. Configure GitHub Actions, pipelines, automated testing and deployment workflows.'
  },
  {
    name: 'Docs',
    system_prompt: 'You are a Documentation specialist. Write clear, comprehensive documentation in Markdown. Keep docs in sync with code.'
  }
];

// WebSocket message types
export interface QueryMessage {
  type: 'query';
  prompt: string;
  sessionId: string;  // UI session ID
  agentId: string;
  projectId: string;
}

export interface ConnectedMessage {
  type: 'connected';
  sessionId: string;
  model: string;
  cwd: string;
  claudeSessionId: string;
}

export interface StreamMessage {
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

export interface CompleteMessage {
  type: 'complete';
  result: unknown;
  usage: TokenUsage;
  cost: number;
  duration: number;
  numTurns: number;
  isError: boolean;
  sessionId: string;
}

export interface ErrorMessage {
  type: 'error';
  error: string;
  code: string;
  sessionId: string;
}

export type WebSocketMessage =
  | QueryMessage
  | ConnectedMessage
  | StreamMessage
  | CompleteMessage
  | ErrorMessage;

// API request/response types
export interface AuthRegisterRequest {
  email: string;
  password: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
}

export interface CreateProjectRequest {
  working_directory: string;
}

export interface UpdateAgentRequest {
  name?: string;
  system_prompt?: string;
  linked_md_files?: string[];
}

export interface CreateAgentRequest {
  name: string;
  system_prompt: string;
}

// Browse response
export interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  items: DirectoryItem[];
}

// Error codes
export const ERROR_CODES = {
  CLAUDE_LOGIN_REQUIRED: 'CLAUDE_LOGIN_REQUIRED',
  CLAUDE_TERMS_REQUIRED: 'CLAUDE_TERMS_REQUIRED',
  WEBSOCKET_DISCONNECT: 'WEBSOCKET_DISCONNECT',
  CLI_TIMEOUT: 'CLI_TIMEOUT',
  TOKEN_LIMIT_WARNING: 'TOKEN_LIMIT_WARNING',
  INVALID_JWT: 'INVALID_JWT',
  PROJECT_PATH_CONFLICT: 'PROJECT_PATH_CONFLICT',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
