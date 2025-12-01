/**
 * WebSocket Types for Qomplex
 * Based on design.md WebSocket Protocol section
 */

import type { WebSocket } from 'ws';
import type { UserPublic, TokenUsage } from '@qomplex/shared';

/**
 * Client context attached to WebSocket connection
 */
export interface ClientContext {
  user: UserPublic;
  userId: string;
  connectedAt: Date;
  lastPingAt: Date;
  activeSessionId: string | null;
}

/**
 * Extended WebSocket with client context
 */
export interface AuthenticatedWebSocket extends WebSocket {
  clientContext?: ClientContext;
  isAlive?: boolean;
}

// ============================================
// Client -> Server Messages
// ============================================

/**
 * Query message - send a prompt to Claude
 */
export interface ClientQueryMessage {
  type: 'query';
  prompt: string;
  sessionId: string;  // UI session ID
  agentId: string;
  projectId: string;
}

/**
 * Ping message - connection health check
 */
export interface ClientPingMessage {
  type: 'ping';
  timestamp: number;
}

/**
 * Cancel message - abort current operation
 */
export interface ClientCancelMessage {
  type: 'cancel';
  sessionId: string;
}

/**
 * History request - load chat history
 */
export interface ClientHistoryMessage {
  type: 'history';
  agentId: string;
  projectId: string;
  sessionId?: string; // CLI session ID to load
}

/**
 * All possible client messages
 */
export type ClientMessage =
  | ClientQueryMessage
  | ClientPingMessage
  | ClientCancelMessage
  | ClientHistoryMessage;

// ============================================
// Server -> Client Messages
// ============================================

/**
 * Connected message - sent after successful authentication
 */
export interface ServerConnectedMessage {
  type: 'connected';
  sessionId: string;
  model?: string;
  cwd?: string;
  claudeSessionId?: string;
  timestamp: number;
}

/**
 * Stream message - streaming content from assistant
 */
export interface ServerStreamMessage {
  type: 'stream';
  content: {
    type: 'assistant';
    message: {
      content: string;
      id?: string;
      usage?: TokenUsage;
    };
  };
  sessionId: string;
}

/**
 * Tool use message - CLI is using a tool
 */
export interface ServerToolUseMessage {
  type: 'tool_use';
  toolUse: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  sessionId: string;
}

/**
 * Tool result message - result of tool use
 */
export interface ServerToolResultMessage {
  type: 'tool_result';
  toolResult: {
    toolUseId: string;
    content: string;
    isError: boolean;
  };
  sessionId: string;
}

/**
 * Complete message - CLI finished processing
 */
export interface ServerCompleteMessage {
  type: 'complete';
  result: unknown;
  usage: TokenUsage;
  cost: number;
  duration: number;
  numTurns: number;
  isError: boolean;
  sessionId: string;
}

/**
 * Error message - something went wrong
 */
export interface ServerErrorMessage {
  type: 'error';
  error: string;
  code: string;
  sessionId?: string;
  timestamp: number;
}

/**
 * Pong message - response to ping
 */
export interface ServerPongMessage {
  type: 'pong';
  timestamp: number;
}

/**
 * History message - chat history loaded
 */
export interface ServerHistoryMessage {
  type: 'history';
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  sessionId?: string;
  agentId: string;
}

/**
 * Token warning message - context limit approaching
 */
export interface ServerTokenWarningMessage {
  type: 'token_warning';
  totalTokens: number;
  threshold: number;
  message: string;
  sessionId: string;
}

/**
 * All possible server messages
 */
export type ServerMessage =
  | ServerConnectedMessage
  | ServerStreamMessage
  | ServerToolUseMessage
  | ServerToolResultMessage
  | ServerCompleteMessage
  | ServerErrorMessage
  | ServerPongMessage
  | ServerHistoryMessage
  | ServerTokenWarningMessage;

// ============================================
// Error Codes (from design.md)
// ============================================

export const WS_ERROR_CODES = {
  // Authentication errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',

  // CLI errors
  CLAUDE_LOGIN_REQUIRED: 'CLAUDE_LOGIN_REQUIRED',
  CLAUDE_TERMS_REQUIRED: 'CLAUDE_TERMS_REQUIRED',
  CLI_TIMEOUT: 'CLI_TIMEOUT',
  CLI_SPAWN_ERROR: 'CLI_SPAWN_ERROR',
  CLI_PROCESS_ERROR: 'CLI_PROCESS_ERROR',
  CLI_STDERR: 'CLI_STDERR',

  // Business logic errors
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  SESSION_BUSY: 'SESSION_BUSY',

  // Protocol errors
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  UNKNOWN_MESSAGE_TYPE: 'UNKNOWN_MESSAGE_TYPE',
  MISSING_FIELDS: 'MISSING_FIELDS',

  // Resource limits
  TOKEN_LIMIT_WARNING: 'TOKEN_LIMIT_WARNING',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type WsErrorCode = typeof WS_ERROR_CODES[keyof typeof WS_ERROR_CODES];

// ============================================
// Helper Types
// ============================================

/**
 * Message handler function type
 */
export type MessageHandler<T extends ClientMessage> = (
  ws: AuthenticatedWebSocket,
  message: T
) => Promise<void>;

/**
 * Validate message has required fields
 */
export function isValidQueryMessage(msg: unknown): msg is ClientQueryMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return (
    m.type === 'query' &&
    typeof m.prompt === 'string' &&
    typeof m.sessionId === 'string' &&
    typeof m.agentId === 'string' &&
    typeof m.projectId === 'string'
  );
}

export function isValidPingMessage(msg: unknown): msg is ClientPingMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'ping' && typeof m.timestamp === 'number';
}

export function isValidCancelMessage(msg: unknown): msg is ClientCancelMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'cancel' && typeof m.sessionId === 'string';
}

export function isValidHistoryMessage(msg: unknown): msg is ClientHistoryMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return (
    m.type === 'history' &&
    typeof m.agentId === 'string' &&
    typeof m.projectId === 'string'
  );
}
