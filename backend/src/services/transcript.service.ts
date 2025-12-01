/**
 * Transcript Service
 * Reads chat history from CLI transcript files (~/.claude/projects/)
 *
 * Claude CLI stores transcripts in:
 * ~/.claude/projects/<hash>/sessions/<session_id>.jsonl
 *
 * The hash is derived from the working_directory path
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import crypto from 'crypto';
import os from 'os';
import logger from '../logger.js';
import type { Message } from '@qomplex/shared';

/**
 * Raw transcript entry from JSONL file
 */
interface TranscriptEntry {
  type: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: string | Array<{ type: string; text?: string }>;
    id?: string;
  };
  session_id?: string;
  model?: string;
  result?: unknown;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  [key: string]: unknown;
}

/**
 * TranscriptService - Reads chat history from CLI transcript files
 *
 * Features:
 * - Find transcript files using working_directory hash
 * - Parse JSONL transcript files line by line (streaming)
 * - Extract messages for display
 * - Handle missing transcripts gracefully
 */
export class TranscriptService {
  private readonly claudeDir: string;

  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
  }

  /**
   * Find the project path for a given working directory
   *
   * Claude CLI uses SHA-256 hash of the working directory to create
   * project folders in ~/.claude/projects/
   *
   * @param workingDirectory - Absolute path to project
   * @returns Path to project folder or null if not found
   */
  async findProjectPath(workingDirectory: string): Promise<string | null> {
    const log = logger.child({ method: 'findProjectPath', workingDirectory });

    try {
      // Normalize the path
      const normalizedPath = path.resolve(workingDirectory);

      // Calculate hash of working directory (Claude CLI uses this)
      const hash = crypto
        .createHash('sha256')
        .update(normalizedPath)
        .digest('hex')
        .substring(0, 16); // First 16 chars

      const projectPath = path.join(this.claudeDir, 'projects', hash);

      // Check if directory exists
      try {
        await fs.access(projectPath);
        log.info({ projectPath, hash }, 'Found project path');
        return projectPath;
      } catch {
        log.debug({ projectPath }, 'Project path not found');
        return null;
      }
    } catch (error) {
      log.error({ error }, 'Error finding project path');
      return null;
    }
  }

  /**
   * Get all session IDs for a project
   *
   * @param workingDirectory - Absolute path to project
   * @returns Array of session IDs
   */
  async getProjectSessions(workingDirectory: string): Promise<string[]> {
    const log = logger.child({ method: 'getProjectSessions', workingDirectory });

    const projectPath = await this.findProjectPath(workingDirectory);
    if (!projectPath) {
      return [];
    }

    const sessionsDir = path.join(projectPath, 'sessions');

    try {
      const files = await fs.readdir(sessionsDir);
      const sessionIds = files
        .filter(f => f.endsWith('.jsonl'))
        .map(f => f.replace('.jsonl', ''));

      log.info({ count: sessionIds.length }, 'Found sessions');
      return sessionIds;
    } catch (error) {
      log.debug({ error }, 'Sessions directory not found');
      return [];
    }
  }

  /**
   * Get messages for a specific session
   *
   * @param sessionId - CLI session ID
   * @param workingDirectory - Absolute path to project (optional, for lookup)
   * @returns Array of messages or empty array if not found
   */
  async getSessionMessages(
    sessionId: string,
    workingDirectory?: string
  ): Promise<Message[]> {
    const log = logger.child({ method: 'getSessionMessages', sessionId });

    // Find the transcript file
    let transcriptPath: string | null = null;

    if (workingDirectory) {
      const projectPath = await this.findProjectPath(workingDirectory);
      if (projectPath) {
        transcriptPath = path.join(projectPath, 'sessions', `${sessionId}.jsonl`);
      }
    }

    // If not found via working directory, search all projects
    if (!transcriptPath) {
      transcriptPath = await this.findSessionFile(sessionId);
    }

    if (!transcriptPath) {
      log.debug('Transcript file not found');
      return [];
    }

    // Parse the transcript file
    return this.parseTranscriptFile(transcriptPath);
  }

  /**
   * Search for a session file across all projects
   *
   * @param sessionId - CLI session ID
   * @returns Path to transcript file or null
   */
  private async findSessionFile(sessionId: string): Promise<string | null> {
    const log = logger.child({ method: 'findSessionFile', sessionId });

    const projectsDir = path.join(this.claudeDir, 'projects');

    try {
      const projects = await fs.readdir(projectsDir);

      for (const project of projects) {
        const sessionPath = path.join(
          projectsDir,
          project,
          'sessions',
          `${sessionId}.jsonl`
        );

        try {
          await fs.access(sessionPath);
          log.info({ sessionPath }, 'Found session file');
          return sessionPath;
        } catch {
          // Continue searching
        }
      }
    } catch (error) {
      log.debug({ error }, 'Projects directory not found');
    }

    return null;
  }

  /**
   * Parse a transcript JSONL file
   *
   * @param filePath - Path to transcript file
   * @returns Array of messages
   */
  private async parseTranscriptFile(filePath: string): Promise<Message[]> {
    const log = logger.child({ method: 'parseTranscriptFile', filePath });
    const messages: Message[] = [];

    try {
      // Check file exists and get stats
      const stats = await fs.stat(filePath);

      // Warn if file is large (> 10MB)
      if (stats.size > 10 * 1024 * 1024) {
        log.warn({ size: stats.size }, 'Large transcript file, parsing may take time');
      }

      // Use streaming for memory efficiency
      const fileStream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNumber = 0;

      for await (const line of rl) {
        lineNumber++;

        if (!line.trim()) continue;

        try {
          const entry: TranscriptEntry = JSON.parse(line);
          const message = this.extractMessage(entry);

          if (message) {
            messages.push(message);
          }
        } catch (parseError) {
          log.warn({ lineNumber, error: parseError }, 'Failed to parse transcript line');
        }
      }

      log.info({ messageCount: messages.length }, 'Parsed transcript file');
      return messages;
    } catch (error) {
      log.error({ error }, 'Error parsing transcript file');
      return [];
    }
  }

  /**
   * Extract a message from a transcript entry
   *
   * @param entry - Raw transcript entry
   * @returns Message or null if not a displayable message
   */
  private extractMessage(entry: TranscriptEntry): Message | null {
    // Handle user messages
    if (entry.type === 'user' || entry.type === 'human') {
      const content = this.extractContent(entry.message?.content);
      if (!content) return null;

      return {
        id: entry.message?.id || crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      };
    }

    // Handle assistant messages
    if (entry.type === 'assistant') {
      const content = this.extractContent(entry.message?.content);
      if (!content) return null;

      const message: Message = {
        id: entry.message?.id || crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      };

      if (entry.usage) {
        message.usage = {
          input_tokens: entry.usage.input_tokens || 0,
          output_tokens: entry.usage.output_tokens || 0,
        };
      }

      return message;
    }

    // Handle result events (final message)
    if (entry.type === 'result' && !entry.is_error) {
      const content = this.extractContent(entry.result);
      if (!content) return null;

      const message: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      };

      if (entry.usage) {
        message.usage = {
          input_tokens: entry.usage.input_tokens || 0,
          output_tokens: entry.usage.output_tokens || 0,
        };
      }

      return message;
    }

    return null;
  }

  /**
   * Extract text content from various content formats
   *
   * @param content - Content in various formats
   * @returns Text content or null
   */
  private extractContent(content: unknown): string | null {
    if (!content) return null;

    // String content
    if (typeof content === 'string') {
      return content.trim() || null;
    }

    // Array of content blocks
    if (Array.isArray(content)) {
      const texts = content
        .filter((block): block is { type: string; text: string } =>
          block && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string'
        )
        .map(block => block.text);

      const combined = texts.join('').trim();
      return combined || null;
    }

    // Object with text property
    if (typeof content === 'object' && content !== null && 'text' in content) {
      const text = (content as { text: unknown }).text;
      if (typeof text === 'string') {
        return text.trim() || null;
      }
    }

    return null;
  }

  /**
   * Get recent messages from a session (last N messages)
   *
   * @param sessionId - CLI session ID
   * @param limit - Maximum number of messages to return
   * @param workingDirectory - Absolute path to project
   * @returns Array of recent messages
   */
  async getRecentMessages(
    sessionId: string,
    limit: number = 50,
    workingDirectory?: string
  ): Promise<Message[]> {
    const allMessages = await this.getSessionMessages(sessionId, workingDirectory);
    return allMessages.slice(-limit);
  }

  /**
   * Check if transcripts exist for a working directory
   *
   * @param workingDirectory - Absolute path to project
   * @returns True if transcripts exist
   */
  async hasTranscripts(workingDirectory: string): Promise<boolean> {
    const projectPath = await this.findProjectPath(workingDirectory);
    if (!projectPath) return false;

    const sessions = await this.getProjectSessions(workingDirectory);
    return sessions.length > 0;
  }

  /**
   * Get the latest session ID for a working directory
   *
   * @param workingDirectory - Absolute path to project
   * @returns Latest session ID or null
   */
  async getLatestSessionId(workingDirectory: string): Promise<string | null> {
    const log = logger.child({ method: 'getLatestSessionId', workingDirectory });

    const projectPath = await this.findProjectPath(workingDirectory);
    if (!projectPath) return null;

    const sessionsDir = path.join(projectPath, 'sessions');

    try {
      const files = await fs.readdir(sessionsDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

      if (jsonlFiles.length === 0) return null;

      // Get file stats to find most recent
      const fileStats = await Promise.all(
        jsonlFiles.map(async (file) => {
          const filePath = path.join(sessionsDir, file);
          const stats = await fs.stat(filePath);
          return { file, mtime: stats.mtime };
        })
      );

      // Sort by modification time (most recent first)
      fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const firstFile = fileStats[0];
      if (!firstFile) return null;

      const latestSessionId = firstFile.file.replace('.jsonl', '');
      log.info({ latestSessionId }, 'Found latest session');

      return latestSessionId;
    } catch (error) {
      log.debug({ error }, 'Error finding latest session');
      return null;
    }
  }
}

// Export singleton instance
export const transcriptService = new TranscriptService();
