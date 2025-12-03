/**
 * Claude CLI Service
 * Spawns and manages Claude CLI processes with streaming output
 *
 * Based on clipendra-repo ClaudeCliService with adaptations for Qomplex
 */

import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import logger from '../logger.js';
import type { TokenUsage } from '@qomplex/shared';

const DEFAULT_TIMEOUT_MS = 600_000; // 10 minutes

/**
 * Parse positive integer from various sources
 */
function resolveTimeoutMs(override?: number): number {
  const envValue = process.env.CLAUDE_CLI_TIMEOUT_MS;
  const parsePositiveInt = (value?: string | number | null): number | undefined => {
    if (value === undefined || value === null) return undefined;
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return undefined;
    }
    return Math.floor(numeric);
  };

  return (
    parsePositiveInt(override) ??
    parsePositiveInt(envValue) ??
    DEFAULT_TIMEOUT_MS
  );
}

/**
 * Options for spawning Claude CLI process
 */
export interface ClaudeCliOptions {
  cwd?: string;
  resumeSessionId?: string;
  continueSession?: boolean;
  allowedTools?: string[];
  disallowedTools?: string[];
  permissionMode?: 'default' | 'acceptEdits' | 'plan';
  model?: 'sonnet' | 'opus' | 'haiku';
  additionalDirs?: string[];
  appendSystemPrompt?: string;
  maxTurns?: number;
  dangerouslySkipPermissions?: boolean;
}

/**
 * Stream event from Claude CLI
 */
export interface StreamEvent {
  type: 'system' | 'assistant' | 'tool_use' | 'tool_result' | 'result';
  data: unknown;
}

/**
 * Tool use information from CLI events
 */
export interface ToolUseEvent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result event from CLI
 */
export interface ToolResultEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/**
 * Result event from CLI
 */
export interface ResultEvent {
  type: 'result';
  result: unknown;
  usage: TokenUsage;
  total_cost_usd: number;
  duration_ms: number;
  num_turns: number;
  is_error: boolean;
  session_id: string;
}

/**
 * Service configuration
 */
interface ClaudeCliServiceConfig {
  timeoutMs?: number;
}

/**
 * ClaudeCliService - Manages Claude CLI processes and output streaming
 *
 * Uses child_process.spawn() to execute local 'claude' command with
 * --output-format stream-json for NDJSON streaming output.
 *
 * Features:
 * - Session ID extraction from first system event
 * - Agent system prompts via --append-system-prompt
 * - Session continuity via --resume
 * - CLI error mapping (not authenticated, terms required)
 * - Timeout protection (default 10 minutes)
 * - Process cleanup on disconnect
 */
export class ClaudeCliService {
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private readonly timeoutMs: number;

  constructor(config?: ClaudeCliServiceConfig) {
    this.timeoutMs = resolveTimeoutMs(config?.timeoutMs);
  }

  /**
   * Spawn Claude CLI process with streaming output
   *
   * This is the core method that starts a new Claude CLI process. The process
   * outputs NDJSON (newline-delimited JSON) events that we parse and stream
   * to the WebSocket client.
   *
   * Flow:
   * 1. Build CLI arguments from options (see buildArgs)
   * 2. Spawn the 'claude' process with stdin/stdout/stderr pipes
   * 3. Close stdin immediately (we use -p flag for prompt, not interactive mode)
   * 4. Wait for the first 'system' event to extract session_id
   * 5. Return the process and session_id for further streaming
   *
   * @param prompt - User's message/prompt to send to Claude
   * @param options - CLI configuration options (cwd, resume, tools, etc.)
   * @returns Object with spawned process and extracted session ID
   */
  async spawnClaude(
    prompt: string,
    options: ClaudeCliOptions = {}
  ): Promise<{ process: ChildProcess; sessionId: string | null }> {
    const args = this.buildArgs(prompt, options);

    logger.info({ args, cwd: options.cwd }, 'Building Claude CLI args');

    // Spawn the Claude CLI process with pipe streams for I/O
    // stdio: ['pipe', 'pipe', 'pipe'] = [stdin, stdout, stderr]
    const claudeProcess = spawn('claude', args, {
      cwd: options.cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    logger.info({ pid: claudeProcess.pid }, 'Claude CLI process spawned');

    // Close stdin immediately - we pass the prompt via -p flag (non-interactive mode)
    // This signals to Claude CLI that no more input is coming
    if (claudeProcess.stdin) {
      claudeProcess.stdin.end();
    }

    // Handle spawn errors (e.g., 'claude' command not found)
    claudeProcess.on('error', (error) => {
      logger.error({ error: error.message }, 'Claude CLI spawn error');
    });

    let sessionId: string | null = null;
    let sessionIdExtracted = false;

    // Extract session_id from the first 'system' event in the NDJSON stream
    // The session_id is needed for resuming conversations later with --resume flag
    const extractSessionId = new Promise<string | null>((resolve) => {
      const onData = (chunk: Buffer) => {
        // Skip if we already extracted the session_id
        if (sessionIdExtracted) return;

        // NDJSON format: each line is a complete JSON object
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            // The 'system' event with subtype 'init' contains session_id
            // This is always the first event from Claude CLI
            if (event.type === 'system' && event.session_id) {
              sessionId = event.session_id;
              sessionIdExtracted = true;
              logger.info({ sessionId }, 'Claude CLI session started');

              // Stop listening once we have the session_id
              claudeProcess.stdout?.removeListener('data', onData);
              resolve(sessionId);
              return;
            }
          } catch (e) {
            // Line might be incomplete (chunked across multiple data events)
            // This is expected with streaming - just continue to next chunk
            logger.debug({ line: line.substring(0, 100) }, 'Failed to parse CLI output line');
          }
        }
      };

      claudeProcess.stdout?.on('data', onData);

      // Timeout fallback - if no system event arrives within 5 seconds,
      // resolve with null. This handles edge cases like CLI errors.
      setTimeout(() => {
        if (!sessionIdExtracted) {
          claudeProcess.stdout?.removeListener('data', onData);
          resolve(null);
        }
      }, 5000);
    });

    // Wait for session ID extraction (or timeout)
    sessionId = await extractSessionId;

    return { process: claudeProcess, sessionId };
  }

  /**
   * Stream Claude CLI output to WebSocket
   *
   * This method connects the CLI process stdout to a WebSocket connection,
   * parsing NDJSON events in real-time and forwarding them to the frontend.
   *
   * NDJSON Parsing Strategy:
   * - CLI outputs newline-delimited JSON (one complete JSON object per line)
   * - Data arrives in chunks that may split across JSON boundaries
   * - We buffer partial lines and only parse complete lines
   * - Each parsed event is routed to handleEvent() for WebSocket delivery
   *
   * Event Types (from Claude CLI --output-format stream-json):
   * - system: Initial event with session_id, model info, tools available
   * - assistant: Claude's response text (may arrive in multiple events)
   * - tool_use: Claude is calling a tool (Read, Write, Bash, etc.)
   * - tool_result: Result of tool execution
   * - result: Final event with usage stats, cost, and completion status
   *
   * @param claudeProcess - Spawned Claude CLI process
   * @param ws - WebSocket connection to frontend
   * @param sessionId - UI session ID for tracking (different from CLI session_id)
   * @param onComplete - Optional callback when CLI completes (for cleanup)
   */
  streamOutput(
    claudeProcess: ChildProcess,
    ws: WebSocket,
    sessionId: string,
    onComplete?: (result: ResultEvent) => void
  ): void {
    let isComplete = false;
    let buffer = '';  // Buffer for incomplete NDJSON lines
    let accumulatedContent = '';  // Track full response for logging

    // Timeout protection - kill process if it runs too long
    // Default is 10 minutes (configurable via CLAUDE_CLI_TIMEOUT_MS)
    const timeoutDurationSeconds = Math.round(this.timeoutMs / 1000);
    const timeout = setTimeout(() => {
      if (!claudeProcess.killed && !isComplete) {
        logger.warn({ sessionId }, 'Claude CLI process timeout');
        claudeProcess.kill('SIGTERM');

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            error: `Request timed out after ${timeoutDurationSeconds} seconds`,
            code: 'CLI_TIMEOUT',
            sessionId
          }));
        }
      }
    }, this.timeoutMs);

    // Handle stdout - this is where NDJSON events arrive
    claudeProcess.stdout?.on('data', (chunk: Buffer) => {
      // Append chunk to buffer (may contain partial lines from previous chunk)
      buffer += chunk.toString();
      const lines = buffer.split('\n');

      // Keep the last element in buffer - it's either empty or incomplete line
      // Complete lines have newline at end, so split gives empty string as last element
      buffer = lines.pop() || '';

      // Process each complete line as a JSON event
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line);
          this.handleEvent(event, ws, sessionId);

          // Track accumulated content for debugging/logging
          if (event.type === 'assistant' && event.message?.content) {
            const text = event.message.content
              .filter((c: { type: string }) => c.type === 'text')
              .map((c: { text: string }) => c.text)
              .join('');

            accumulatedContent += text;
          }

          // 'result' event signals completion - cleanup and notify
          if (event.type === 'result') {
            isComplete = true;
            clearTimeout(timeout);

            if (onComplete) {
              onComplete(event as ResultEvent);
            }
          }
        } catch (error) {
          // JSON parse errors are usually due to corrupted output
          // Log but don't crash - try to continue processing
          logger.warn({ error, line: line.substring(0, 100) }, 'Failed to parse CLI output');
        }
      }
    });

    // Handle stderr (errors)
    claudeProcess.stderr?.on('data', (chunk: Buffer) => {
      const errorMsg = chunk.toString();
      logger.error({ error: errorMsg, sessionId }, 'Claude CLI stderr');

      const mappedError = this.mapClaudeError(errorMsg);
      const payload = {
        type: 'error',
        error: mappedError?.message || errorMsg.trim() || 'Claude CLI reported an error',
        code: mappedError?.code || 'CLI_STDERR',
        sessionId
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    });

    // Handle process exit
    claudeProcess.on('close', (code) => {
      logger.info({ code, sessionId }, 'Claude CLI process exited');
      clearTimeout(timeout);

      if (!isComplete && code !== 0) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            error: `Process exited with code ${code}`,
            code: 'CLI_PROCESS_ERROR',
            sessionId
          }));
        }
      }

      this.cleanup(sessionId);
    });

    // Handle process errors
    claudeProcess.on('error', (error) => {
      logger.error({ error, sessionId }, 'Claude CLI process error');
      clearTimeout(timeout);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message,
          code: 'CLI_SPAWN_ERROR',
          sessionId
        }));
      }
    });

    // Store process for cleanup
    this.activeProcesses.set(sessionId, claudeProcess);
  }

  /**
   * Handle individual CLI event and send to WebSocket
   */
  private handleEvent(event: Record<string, unknown>, ws: WebSocket, sessionId: string): void {
    if (ws.readyState !== WebSocket.OPEN) {
      logger.warn({ sessionId }, 'WebSocket not open, skipping event');
      return;
    }

    switch (event.type) {
      case 'system':
        // System init - send metadata to client
        if (event.subtype === 'init') {
          ws.send(JSON.stringify({
            type: 'connected',
            sessionId: event.session_id,
            model: event.model,
            tools: event.tools,
            cwd: event.cwd,
            claudeSessionId: event.session_id
          }));
        }
        break;

      case 'assistant': {
        // Extract text content from message
        const message = event.message as { content?: Array<{ type: string; text?: string }>; id?: string; usage?: TokenUsage } | undefined;
        const content = message?.content || [];
        const text = content
          .filter((c) => c.type === 'text')
          .map((c) => c.text || '')
          .join('');

        if (text) {
          ws.send(JSON.stringify({
            type: 'stream',
            content: {
              type: 'assistant',
              message: {
                content: text,
                id: message?.id,
                usage: message?.usage
              }
            },
            sessionId
          }));
        }
        break;
      }

      case 'tool_use': {
        // Tool usage event
        ws.send(JSON.stringify({
          type: 'tool_use',
          toolUse: {
            id: event.id,
            name: event.name,
            input: event.input
          },
          sessionId
        }));
        break;
      }

      case 'tool_result': {
        // Tool result event
        ws.send(JSON.stringify({
          type: 'tool_result',
          toolResult: {
            toolUseId: event.tool_use_id,
            content: event.content,
            isError: event.is_error || false
          },
          sessionId
        }));
        break;
      }

      case 'result':
        // Final result - send completion
        ws.send(JSON.stringify({
          type: 'complete',
          result: event.result,
          usage: event.usage,
          cost: event.total_cost_usd,
          duration: event.duration_ms,
          numTurns: event.num_turns,
          isError: event.is_error,
          sessionId
        }));
        break;

      default:
        logger.debug({ eventType: event.type }, 'Unknown CLI event type');
    }
  }

  /**
   * Build command-line arguments for Claude CLI
   *
   * Constructs the argument array for the 'claude' command based on options.
   * Key flags used:
   * - `-p <prompt>`: Non-interactive mode with prompt passed as argument
   * - `--output-format stream-json`: Enable NDJSON streaming output
   * - `--verbose`: Required for stream-json to work properly
   * - `--resume <id>`: Resume a previous conversation by session ID
   * - `--append-system-prompt`: Add custom system prompt (for agent personas)
   * - `--dangerously-skip-permissions`: Auto-accept all tool use requests
   */
  private buildArgs(prompt: string, options: ClaudeCliOptions): string[] {
    // Base arguments: prompt mode with streaming JSON output
    const args: string[] = [
      '-p', prompt,                     // Print mode (non-interactive)
      '--output-format', 'stream-json', // Streaming JSON (NDJSON)
      '--verbose'                       // Required for stream-json
    ];

    // Session resume
    if (options.continueSession) {
      args.push('--continue');
    } else if (options.resumeSessionId) {
      args.push('--resume', options.resumeSessionId);
    }

    // Allowed tools
    if (options.allowedTools && options.allowedTools.length > 0) {
      args.push('--allowedTools', options.allowedTools.join(','));
    }

    // Disallowed tools
    if (options.disallowedTools && options.disallowedTools.length > 0) {
      args.push('--disallowedTools', options.disallowedTools.join(','));
    }

    // Permission mode
    if (options.permissionMode) {
      args.push('--permission-mode', options.permissionMode);
    }

    // Model selection
    if (options.model) {
      args.push('--model', options.model);
    }

    // Additional directories
    if (options.additionalDirs && options.additionalDirs.length > 0) {
      options.additionalDirs.forEach(dir => {
        args.push('--add-dir', dir);
      });
    }

    // Append system prompt (for agent prompts)
    if (options.appendSystemPrompt) {
      args.push('--append-system-prompt', options.appendSystemPrompt);
    }

    // Max turns
    if (options.maxTurns) {
      args.push('--max-turns', options.maxTurns.toString());
    }

    // Dangerously skip permissions
    if (options.dangerouslySkipPermissions) {
      args.push('--dangerously-skip-permissions');
    }

    return args;
  }

  /**
   * Map Claude CLI errors to structured error codes
   */
  private mapClaudeError(errorMsg: string): { message: string; code: string } | null {
    const normalized = errorMsg.trim();
    if (!normalized) {
      return null;
    }

    const lower = normalized.toLowerCase();

    // Check for terms update required
    if (lower.includes('action required') && lower.includes('consumer terms')) {
      return {
        code: 'CLAUDE_TERMS_REQUIRED',
        message: 'Anthropic requires you to review the updated Consumer Terms. Run `claude` once in a terminal, accept the new terms, and then retry your request.'
      };
    }

    // Check for login required
    if (lower.includes('claude login') || (lower.includes('login') && lower.includes('claude'))) {
      return {
        code: 'CLAUDE_LOGIN_REQUIRED',
        message: 'Claude CLI is not authenticated. Run `claude login` from your terminal to authenticate.'
      };
    }

    // Check for not authenticated
    if (lower.includes('not authenticated') || lower.includes('authentication required')) {
      return {
        code: 'CLAUDE_LOGIN_REQUIRED',
        message: 'Claude CLI is not authenticated. Run `claude login` from your terminal to authenticate.'
      };
    }

    return null;
  }

  /**
   * Clean up process resources for a specific session
   */
  cleanup(sessionId: string): void {
    const proc = this.activeProcesses.get(sessionId);

    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
      logger.debug({ sessionId }, 'Terminated Claude CLI process');
    }

    this.activeProcesses.delete(sessionId);
  }

  /**
   * Clean up all active processes (on shutdown)
   */
  cleanupAll(): void {
    logger.info({ count: this.activeProcesses.size }, 'Cleaning up all Claude CLI processes');

    for (const [_sessionId, proc] of this.activeProcesses.entries()) {
      if (!proc.killed) {
        proc.kill('SIGTERM');
      }
    }

    this.activeProcesses.clear();
  }

  /**
   * Check if a session has an active process
   */
  hasActiveProcess(sessionId: string): boolean {
    const proc = this.activeProcesses.get(sessionId);
    return proc !== undefined && !proc.killed;
  }

  /**
   * Get the number of active processes
   */
  getActiveProcessCount(): number {
    return this.activeProcesses.size;
  }
}

// Export singleton instance
export const claudeCliService = new ClaudeCliService();
