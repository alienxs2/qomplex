/**
 * WebSocket Message Handler
 * Handles incoming WebSocket messages and integrates with Claude CLI
 *
 * Based on clipendra-repo handler pattern with Qomplex auth context
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

// Token warning threshold (120K tokens as per design.md)
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

    // Check if there's already an active CLI process
    if (activeSessions.has(ws)) {
      handlerLog.warn('Session busy - CLI already running');
      sendError(ws, 'Another request is in progress', 'SESSION_BUSY', sessionId);
      return;
    }

    try {
      // Get project info
      const project = await projectService.getByIdForUser(projectId, context.userId);
      if (!project) {
        handlerLog.warn('Project not found');
        sendError(ws, 'Project not found', 'PROJECT_NOT_FOUND', sessionId);
        return;
      }

      // Get agent info
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

      // Build CLI options
      const cliOptions: ClaudeCliOptions = {
        cwd: project.working_directory,
        dangerouslySkipPermissions: true,
        permissionMode: 'acceptEdits',
      };

      // Use session resume if agent has previous session
      if (agent.session_id) {
        cliOptions.resumeSessionId = agent.session_id;
        handlerLog.info({ sessionId: agent.session_id }, 'Resuming previous session');
      }

      // Add agent system prompt if defined
      if (agent.system_prompt) {
        cliOptions.appendSystemPrompt = agent.system_prompt;
      }

      // Mark session as active
      activeSessions.set(ws, sessionId);
      context.activeSessionId = sessionId;

      // Spawn Claude CLI
      const { process: claudeProcess, sessionId: cliSessionId } = await claudeCliService.spawnClaude(
        prompt,
        cliOptions
      );

      handlerLog.info({ cliSessionId, pid: claudeProcess.pid }, 'CLI process spawned');

      // Update agent's session_id if new
      if (cliSessionId && cliSessionId !== agent.session_id) {
        await agentService.update(agentId, context.userId, {
          session_id: cliSessionId
        });
        handlerLog.info({ cliSessionId }, 'Updated agent session_id');
      }

      // Handle completion callback
      const onComplete = async (result: ResultEvent) => {
        // Clear active session
        activeSessions.delete(ws);
        if (context) {
          context.activeSessionId = null;
        }

        // Check token usage for warning
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

      // Stream output to WebSocket
      claudeCliService.streamOutput(claudeProcess, ws, sessionId, onComplete);

    } catch (error) {
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
   * Handle history message - load chat history from transcripts
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
   * Main message handler
   */
  return async function handleMessage(
    ws: AuthenticatedWebSocket,
    data: string
  ): Promise<void> {
    let message: ClientMessage;

    // Parse message
    try {
      message = JSON.parse(data);
    } catch (error) {
      log.warn({ data: data.substring(0, 100) }, 'Invalid JSON message');
      sendError(ws, 'Invalid JSON', 'INVALID_MESSAGE');
      return;
    }

    // Handle message by type
    if (isValidQueryMessage(message)) {
      await handleQuery(
        ws,
        message.prompt,
        message.sessionId,
        message.agentId,
        message.projectId
      );
    } else if (isValidPingMessage(message)) {
      handlePing(ws, message.timestamp);
    } else if (isValidCancelMessage(message)) {
      handleCancel(ws, message.sessionId);
    } else if (isValidHistoryMessage(message)) {
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
