/**
 * WebSocket Server Setup
 * Handles WebSocket connections with JWT authentication
 *
 * Based on clipendra-repo WebSocket setup pattern with JWT auth
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'http';
import { URL } from 'url';
import logger from '../logger.js';
import { authService } from '../services/auth.service.js';
import type {
  AuthenticatedWebSocket,
  ClientContext,
  ServerConnectedMessage,
  ServerErrorMessage
} from './types.js';

/**
 * WebSocket server configuration
 */
interface WebSocketServerConfig {
  pingInterval?: number; // Ping interval in ms (default: 30000)
  pingTimeout?: number;  // Ping timeout in ms (default: 10000)
}

const DEFAULT_CONFIG: Required<WebSocketServerConfig> = {
  pingInterval: 30000,
  pingTimeout: 10000,
};

/**
 * Extract JWT token from WebSocket connection request
 *
 * Token can be passed via:
 * 1. Query string: ws://host/ws?token=xxx
 * 2. Protocol header: Sec-WebSocket-Protocol: token.xxx
 */
function extractToken(req: IncomingMessage): string | null {
  // Try query string first
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    if (token) {
      return token;
    }
  } catch (error) {
    logger.debug({ error }, 'Failed to parse WebSocket URL');
  }

  // Try protocol header (format: "token.xxx" or just the token)
  const protocol = req.headers['sec-websocket-protocol'];
  if (protocol) {
    const protocols = protocol.split(',').map(p => p.trim());
    for (const p of protocols) {
      if (p.startsWith('token.')) {
        return p.substring(6);
      }
      // If it looks like a JWT (has dots), use it
      if (p.includes('.')) {
        return p;
      }
    }
  }

  return null;
}

/**
 * Send error message and close connection
 */
function sendErrorAndClose(
  ws: WebSocket,
  error: string,
  code: string
): void {
  const errorMessage: ServerErrorMessage = {
    type: 'error',
    error,
    code,
    timestamp: Date.now()
  };

  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorMessage));
    }
    ws.close(4001, code);
  } catch (e) {
    logger.debug({ error: e }, 'Error sending close message');
  }
}

/**
 * Setup WebSocket server with JWT authentication
 *
 * @param server - HTTP server to attach WebSocket to
 * @param onMessage - Message handler callback
 * @param config - Server configuration
 * @returns WebSocketServer instance
 */
export function setupWebSocket(
  server: Server,
  onMessage: (ws: AuthenticatedWebSocket, data: string) => void,
  config: WebSocketServerConfig = {}
): WebSocketServer {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const log = logger.child({ component: 'WebSocketServer' });

  // Create WebSocket server attached to HTTP server
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    // Don't verify client here - we'll do JWT auth manually
    verifyClient: (_info, callback) => {
      // Allow all connections initially, authenticate after
      callback(true);
    }
  });

  // Track connection IDs
  let connectionCounter = 0;

  // Track all connected clients
  const clients = new Map<number, AuthenticatedWebSocket>();

  // Ping/pong interval for connection health
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;

      if (authWs.isAlive === false) {
        log.debug('Terminating stale connection');
        return authWs.terminate();
      }

      authWs.isAlive = false;
      authWs.ping();
    });
  }, cfg.pingInterval);

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(pingInterval);
    clients.clear();
  });

  // Handle new connections
  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const authWs = ws as AuthenticatedWebSocket;
    const connId = ++connectionCounter;
    const clientIp = req.socket.remoteAddress || 'unknown';

    log.info({ connId, clientIp }, 'WebSocket connection attempt');

    // Extract and validate token
    const token = extractToken(req);

    if (!token) {
      log.warn({ connId }, 'WebSocket connection rejected: no token');
      sendErrorAndClose(authWs, 'Authentication required', 'AUTH_REQUIRED');
      return;
    }

    // Verify JWT token
    const user = await authService.verifyToken(token);

    if (!user) {
      log.warn({ connId }, 'WebSocket connection rejected: invalid token');
      sendErrorAndClose(authWs, 'Invalid or expired token', 'INVALID_TOKEN');
      return;
    }

    // Setup client context
    const context: ClientContext = {
      user,
      userId: user.id,
      connectedAt: new Date(),
      lastPingAt: new Date(),
      activeSessionId: null
    };

    authWs.clientContext = context;
    authWs.isAlive = true;

    // Track client
    clients.set(connId, authWs);

    log.info({ connId, userId: user.id, email: user.email }, 'WebSocket client authenticated');

    // Handle pong responses
    authWs.on('pong', () => {
      authWs.isAlive = true;
      if (authWs.clientContext) {
        authWs.clientContext.lastPingAt = new Date();
      }
    });

    // Handle messages
    authWs.on('message', (data: Buffer) => {
      try {
        const message = data.toString();
        onMessage(authWs, message);
      } catch (error) {
        log.error({ error, connId }, 'Error processing message');
      }
    });

    // Handle close
    authWs.on('close', (code, reason) => {
      clients.delete(connId);
      log.info({ connId, code, reason: reason.toString() }, 'WebSocket client disconnected');
    });

    // Handle errors
    authWs.on('error', (error) => {
      log.error({ connId, error: error.message }, 'WebSocket error');
    });

    // Send connected message
    const connectedMessage: ServerConnectedMessage = {
      type: 'connected',
      sessionId: `ws-${connId}`,
      timestamp: Date.now()
    };

    authWs.send(JSON.stringify(connectedMessage));
  });

  log.info({ path: '/ws' }, 'WebSocket server initialized');

  // Return server with helper methods
  return Object.assign(wss, {
    /**
     * Get number of connected clients
     */
    getClientCount(): number {
      return clients.size;
    },

    /**
     * Get all connected client contexts
     */
    getClients(): ClientContext[] {
      const contexts: ClientContext[] = [];
      clients.forEach((ws) => {
        if (ws.clientContext) {
          contexts.push(ws.clientContext);
        }
      });
      return contexts;
    },

    /**
     * Broadcast message to all connected clients
     */
    broadcast(message: string): void {
      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    },

    /**
     * Send message to specific user
     */
    sendToUser(userId: string, message: string): boolean {
      let sent = false;
      clients.forEach((ws) => {
        if (ws.clientContext?.userId === userId && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          sent = true;
        }
      });
      return sent;
    }
  });
}

/**
 * Export types for external use
 */
export type { AuthenticatedWebSocket, ClientContext };
export * from './types.js';
