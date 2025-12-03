/**
 * WebSocket Message Handler
 *
 * This module handles incoming WebSocket messages from the frontend and integrates
 * with Claude CLI for real-time chat functionality. It's the bridge between the
 * user interface and the Claude CLI process.
 *
 * Message Flow:
 * 1. Frontend connects via WebSocket with JWT auth
 * 2. Frontend sends 'query' message with prompt, agentId, projectId
 * 3. Handler validates ownership, loads agent/project from database
 * 4. Handler spawns Claude CLI via ClaudeCliService
 * 5. CLI output is streamed back to frontend in real-time
 * 6. On completion, token usage is checked and session_id is saved
 *
 * Supported Message Types:
 * - query: Send a message to Claude (main chat functionality)
 * - history: Load chat history from CLI transcripts
 * - cancel: Cancel an in-progress CLI request
 * - ping: Keep-alive heartbeat
 *
 * Error Handling:
 * - All errors are mapped to user-friendly messages with action suggestions
 * - CLI-specific errors (auth, terms) are handled with appropriate codes
 * - Process cleanup happens on disconnect and shutdown
 */

import { WebSocket } from 'ws';
import logger from '../logger.js';
import { claudeCliService, ClaudeCliOptions, ResultEvent } from '../services/claude-cli.service.js';
import { transcriptService } from '../services/transcript.service.js';
import { agentService } from '../services/agent.service.js';
import { projectService } from '../services/project.service.js';
import type {
  AuthenticatedWebSocket,
  ClientMessage,
  ServerErrorMessage,
  ServerHistoryMessage,
  ServerPongMessage,
  ServerTokenWarningMessage
} from './types.js';
import {
  isValidQueryMessage,
  isValidPingMessage,
  isValidCancelMessage,
  isValidHistoryMessage
} from './types.js';

// Token warning threshold - warn users when approaching Claude's context limit
// At 120K tokens, we suggest starting a new session to avoid hitting the 128K limit
const TOKEN_WARNING_THRESHOLD = 120_000;

/**
 * Create WebSocket message handler
 *
 * @returns Message handler function for setupWebSocket
 */
export function createMessageHandler() {
  const log = logger.child({ component: 'WebSocketHandler' });

  // Track active CLI sessions per WebSocket connection
  const activeSessions = new Map<AuthenticatedWebSocket, string>();

  /**
   * Send error message to client
   */
  function sendError(
    ws: WebSocket,
    error: string,
    code: string,
    sessionId?: string
  ): void {
    const message: ServerErrorMessage = {
      type: 'error',
      error,
      code,
      timestamp: Date.now(),
      ...(sessionId && { sessionId })
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle query message - spawn Claude CLI and stream response
   *
   * This is the core function that processes user messages. It:
   * 1. Validates the user owns the project and agent
   * 2. Checks no other CLI process is already running
   * 3. Builds CLI options (working directory, session resume, system prompt)
   * 4. Spawns the Claude CLI process
   * 5. Saves the session_id for future conversation resume
   * 6. Monitors token usage and warns if approaching limits
   *
   * Only one CLI process is allowed per WebSocket connection at a time.
   * This prevents resource exhaustion and race conditions.
   */
  async function handleQuery(
    ws: AuthenticatedWebSocket,
    prompt: string,
    sessionId: string,
    agentId: string,
    projectId: string
  ): Promise<void> {
    const context = ws.clientContext;
    if (!context) {
      sendError(ws, 'Not authenticated', 'AUTH_REQUIRED', sessionId);
      return;
    }

    const handlerLog = log.child({
      method: 'handleQuery',
      userId: context.userId,
      agentId,
      projectId,
      sessionId
    });

    // Prevent concurrent CLI processes per WebSocket connection
    // This ensures predictable behavior and prevents resource exhaustion
    if (activeSessions.has(ws)) {
      handlerLog.warn('Session busy - CLI already running');
      sendError(ws, 'Another request is in progress', 'SESSION_BUSY', sessionId);
      return;
    }

    try {
      // Validate ownership: user must own the project
      const project = await projectService.getByIdForUser(projectId, context.userId);
      if (!project) {
        handlerLog.warn('Project not found');
        sendError(ws, 'Project not found', 'PROJECT_NOT_FOUND', sessionId);
        return;
      }

      // Validate ownership: agent must belong to user's project
      const agent = await agentService.getByIdForUser(agentId, context.userId);
      if (!agent) {
        handlerLog.warn('Agent not found');
        sendError(ws, 'Agent not found', 'AGENT_NOT_FOUND', sessionId);
        return;
      }

      handlerLog.info({
        projectPath: project.working_directory,
        agentName: agent.name,
        hasSessionId: !!agent.session_id
      }, 'Processing query');

      // Build CLI options for this request
      const cliOptions: ClaudeCliOptions = {
        cwd: project.working_directory,  // Set working directory to project path
        dangerouslySkipPermissions: true,  // Auto-accept tool use (for web UI experience)
        permissionMode: 'acceptEdits',  // Auto-accept file edits
      };

      // Resume previous conversation if agent has a stored session_id
      // This allows users to continue conversations across browser sessions
      if (agent.session_id) {
        cliOptions.resumeSessionId = agent.session_id;
        handlerLog.info({ sessionId: agent.session_id }, 'Resuming previous session');
      }

      // Inject agent's custom system prompt if defined
      // This is how different agents (PM, Dev, etc.) have different personas
      if (agent.system_prompt) {
        cliOptions.appendSystemPrompt = agent.system_prompt;
      }

      // Mark this WebSocket as having an active CLI process
      activeSessions.set(ws, sessionId);
      context.activeSessionId = sessionId;

      // Spawn the Claude CLI process
      const { process: claudeProcess, sessionId: cliSessionId } = await claudeCliService.spawnClaude(
        prompt,
        cliOptions
      );

      handlerLog.info({ cliSessionId, pid: claudeProcess.pid }, 'CLI process spawned');

      // Persist the CLI session_id for future conversation resume
      // This happens when a new session is created or the first message is sent
      if (cliSessionId && cliSessionId !== agent.session_id) {
        await agentService.update(agentId, context.userId, {
          session_id: cliSessionId
        });
        handlerLog.info({ cliSessionId }, 'Updated agent session_id');
      }

      // Callback for when CLI completes - cleanup and token warning
      const onComplete = async (result: ResultEvent) => {
        // Clear the active session marker
        activeSessions.delete(ws);
        if (context) {
          context.activeSessionId = null;
        }

        // Check if we're approaching the context limit (120K tokens)
        // Warn the user so they can start a new session before hitting the limit
        if (result.usage) {
          const totalTokens =
            (result.usage.input_tokens || 0) +
            (result.usage.output_tokens || 0);

          if (totalTokens >= TOKEN_WARNING_THRESHOLD) {
            const warningMessage: ServerTokenWarningMessage = {
              type: 'token_warning',
              totalTokens,
              threshold: TOKEN_WARNING_THRESHOLD,
              message: 'Context limit approaching. Consider starting a new session.',
              sessionId
            };

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(warningMessage));
            }
          }
        }
      };

      // Start streaming CLI output to the WebSocket
      // This handles all the NDJSON parsing and message forwarding
      claudeCliService.streamOutput(claudeProcess, ws, sessionId, onComplete);

    } catch (error) {
      // Cleanup on error - ensure we don't leave orphaned state
      handlerLog.error({ error }, 'Error handling query');
      activeSessions.delete(ws);
      if (context) {
        context.activeSessionId = null;
      }
      sendError(
        ws,
        error instanceof Error ? error.message : 'Internal error',
        'CLI_SPAWN_ERROR',
        sessionId
      );
    }
  }

  /**
   * Handle ping message
   */
  function handlePing(ws: AuthenticatedWebSocket, timestamp: number): void {
    const pongMessage: ServerPongMessage = {
      type: 'pong',
      timestamp
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(pongMessage));
    }
  }

  /**
   * Handle cancel message - terminate active CLI process
   */
  function handleCancel(ws: AuthenticatedWebSocket, sessionId: string): void {
    const activeSessionId = activeSessions.get(ws);

    if (activeSessionId === sessionId) {
      claudeCliService.cleanup(sessionId);
      activeSessions.delete(ws);

      if (ws.clientContext) {
        ws.clientContext.activeSessionId = null;
      }

      log.info({ sessionId }, 'Cancelled CLI process');
    }
  }

  /**
   * Handle history message - load chat history from Claude CLI transcripts
   *
   * Claude CLI stores conversation transcripts in ~/.claude/projects/<hash>/sessions/
   * as JSONL (JSON Lines) files. This function loads and parses those files to
   * display previous messages when a user selects an agent.
   *
   * The transcript files are read-only - we never modify Claude CLI's data.
   */
  async function handleHistory(
    ws: AuthenticatedWebSocket,
    agentId: string,
    projectId: string,
    sessionId?: string
  ): Promise<void> {
    const context = ws.clientContext;
    if (!context) {
      sendError(ws, 'Not authenticated', 'AUTH_REQUIRED');
      return;
    }

    const handlerLog = log.child({
      method: 'handleHistory',
      userId: context.userId,
      agentId,
      projectId
    });

    try {
      // Get project info
      const project = await projectService.getByIdForUser(projectId, context.userId);
      if (!project) {
        sendError(ws, 'Project not found', 'PROJECT_NOT_FOUND');
        return;
      }

      // Get agent info
      const agent = await agentService.getByIdForUser(agentId, context.userId);
      if (!agent) {
        sendError(ws, 'Agent not found', 'AGENT_NOT_FOUND');
        return;
      }

      // Use provided sessionId or agent's stored sessionId
      const targetSessionId = sessionId || agent.session_id;

      if (!targetSessionId) {
        // No session history available
        const historyMessage: ServerHistoryMessage = {
          type: 'history',
          messages: [],
          agentId
        };

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(historyMessage));
        }
        return;
      }

      // Load messages from transcript
      const messages = await transcriptService.getRecentMessages(
        targetSessionId,
        50,
        project.working_directory
      );

      const historyMessage: ServerHistoryMessage = {
        type: 'history',
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString()
        })),
        sessionId: targetSessionId,
        agentId
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(historyMessage));
      }

      handlerLog.info({ messageCount: messages.length }, 'Sent chat history');

    } catch (error) {
      handlerLog.error({ error }, 'Error loading history');
      sendError(
        ws,
        'Failed to load history',
        'HISTORY_ERROR'
      );
    }
  }

  /**
   * Main message handler - routes incoming WebSocket messages to appropriate handlers
   *
   * This is the entry point for all client messages. It:
   * 1. Parses the JSON message
   * 2. Validates the message structure using type guards
   * 3. Routes to the appropriate handler function
   *
   * Type guards (isValidQueryMessage, etc.) ensure type safety at runtime.
   */
  return async function handleMessage(
    ws: AuthenticatedWebSocket,
    data: string
  ): Promise<void> {
    let message: ClientMessage;

    // Parse incoming JSON message
    try {
      message = JSON.parse(data);
    } catch (error) {
      log.warn({ data: data.substring(0, 100) }, 'Invalid JSON message');
      sendError(ws, 'Invalid JSON', 'INVALID_MESSAGE');
      return;
    }

    // Route message to appropriate handler based on type
    // Type guards validate the message structure before processing
    if (isValidQueryMessage(message)) {
      // User sending a message to Claude
      await handleQuery(
        ws,
        message.prompt,
        message.sessionId,
        message.agentId,
        message.projectId
      );
    } else if (isValidPingMessage(message)) {
      // Keep-alive heartbeat
      handlePing(ws, message.timestamp);
    } else if (isValidCancelMessage(message)) {
      // Cancel in-progress request
      handleCancel(ws, message.sessionId);
    } else if (isValidHistoryMessage(message)) {
      // Load chat history
      await handleHistory(
        ws,
        message.agentId,
        message.projectId,
        message.sessionId
      );
    } else {
      log.warn({ messageType: (message as { type?: unknown }).type }, 'Unknown message type');
      sendError(ws, 'Unknown message type', 'UNKNOWN_MESSAGE_TYPE');
    }
  };
}

/**
 * Cleanup handler for WebSocket disconnection
 * Should be called when a WebSocket connection closes
 */
export function handleDisconnect(ws: AuthenticatedWebSocket): void {
  const context = ws.clientContext;

  if (context?.activeSessionId) {
    claudeCliService.cleanup(context.activeSessionId);
    logger.info({ sessionId: context.activeSessionId }, 'Cleaned up CLI process on disconnect');
  }
}

/**
 * Shutdown handler for server shutdown
 * Should be called on SIGTERM/SIGINT
 */
export function handleShutdown(): void {
  claudeCliService.cleanupAll();
  logger.info('Cleaned up all CLI processes on shutdown');
}

/**
 * Error code mapping from CLI errors to user-friendly messages
 * Based on design.md Error Handling section
 */
export const ERROR_MESSAGES: Record<string, { userMessage: string; actionRequired?: string }> = {
  CLAUDE_LOGIN_REQUIRED: {
    userMessage: 'Claude CLI is not authenticated.',
    actionRequired: 'Run `claude login` in terminal to authenticate.'
  },
  CLAUDE_TERMS_REQUIRED: {
    userMessage: 'Anthropic requires you to accept updated terms.',
    actionRequired: 'Run `claude` in terminal and accept the terms.'
  },
  CLI_TIMEOUT: {
    userMessage: 'Request timed out.',
    actionRequired: 'Try a shorter message or break the task into smaller parts.'
  },
  CLI_SPAWN_ERROR: {
    userMessage: 'Failed to start Claude CLI.',
    actionRequired: 'Ensure Claude CLI is installed and in PATH.'
  },
  CLI_PROCESS_ERROR: {
    userMessage: 'Claude CLI process encountered an error.',
    actionRequired: 'Check the server logs for details.'
  },
  SESSION_BUSY: {
    userMessage: 'Another request is already in progress.',
    actionRequired: 'Wait for the current request to complete or cancel it.'
  },
  PROJECT_NOT_FOUND: {
    userMessage: 'Project not found.',
    actionRequired: 'Ensure the project exists and you have access.'
  },
  AGENT_NOT_FOUND: {
    userMessage: 'Agent not found.',
    actionRequired: 'Ensure the agent exists and belongs to this project.'
  },
  AUTH_REQUIRED: {
    userMessage: 'Authentication required.',
    actionRequired: 'Please log in again.'
  },
  INVALID_TOKEN: {
    userMessage: 'Invalid or expired authentication token.',
    actionRequired: 'Please log in again.'
  },
  TOKEN_LIMIT_WARNING: {
    userMessage: 'Context limit approaching.',
    actionRequired: 'Consider starting a new session to avoid hitting the limit.'
  }
};

/**
 * Get user-friendly error message for an error code
 */
export function getUserFriendlyError(code: string): { userMessage: string; actionRequired?: string } {
  return ERROR_MESSAGES[code] || {
    userMessage: 'An unexpected error occurred.',
    actionRequired: 'Please try again or contact support.'
  };
}

/**
 * Check if an error code indicates a recoverable error
 * (client can retry after taking some action)
 */
export function isRecoverableError(code: string): boolean {
  const recoverableCodes = [
    'SESSION_BUSY',
    'CLI_TIMEOUT',
    'TOKEN_LIMIT_WARNING'
  ];
  return recoverableCodes.includes(code);
}

/**
 * Check if an error code requires user action outside the app
 * (e.g., running commands in terminal)
 */
export function requiresExternalAction(code: string): boolean {
  const externalActionCodes = [
    'CLAUDE_LOGIN_REQUIRED',
    'CLAUDE_TERMS_REQUIRED',
    'CLI_SPAWN_ERROR'
  ];
  return externalActionCodes.includes(code);
}
