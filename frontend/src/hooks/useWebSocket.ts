import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthToken } from '../store/authStore';

/**
 * Vite environment type declaration
 */
declare const VITE_WS_URL: string | undefined;

/**
 * WebSocket URL - defaults to localhost:3001 or uses WS_URL env var
 * Environment variable should be set via Vite define or .env file
 */
const WS_URL = ((): string => {
  // Try to get from Vite environment (defined in vite.config.ts or .env)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteEnv = (import.meta as any).env;
    if (viteEnv?.VITE_WS_URL) {
      return viteEnv.VITE_WS_URL;
    }
  } catch {
    // Ignore - not in Vite environment
  }
  // Default: same host with WebSocket port 3001
  return `ws://${window.location.hostname}:3001`;
})();

/**
 * WebSocket message types from server
 */
export interface StreamMessage {
  type: 'stream';
  data: {
    content?: string;
    [key: string]: unknown;
  };
  sessionId?: string;
}

export interface CompleteMessage {
  type: 'complete';
  data: {
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    sessionId?: string;
  };
  sessionId?: string;
}

export interface ErrorMessage {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
  sessionId?: string;
}

export interface ConnectedMessage {
  type: 'connected';
  sessionId?: string;
}

export type ServerMessage = StreamMessage | CompleteMessage | ErrorMessage | ConnectedMessage;

/**
 * Client message types
 */
export interface QueryMessage {
  type: 'query';
  data: {
    agentId: string;
    message: string;
    sessionId?: string;
  };
}

export type ClientMessage = QueryMessage;

/**
 * Connection status types
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * WebSocket close codes
 */
const CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  INVALID_TOKEN: 4001,
} as const;

/**
 * Reconnection configuration
 */
const RECONNECT_CONFIG = {
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  maxAttempts: Infinity, // Keep trying
} as const;

/**
 * Calculate exponential backoff delay
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds (1s, 2s, 4s, 8s, 16s, max 30s)
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = RECONNECT_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RECONNECT_CONFIG.maxDelay);
}

/**
 * useWebSocket Hook
 *
 * Manages WebSocket connection with authentication, reconnection,
 * and message queueing per design.md specifications.
 *
 * Features:
 * - Connects with JWT token in query string
 * - Exponential backoff reconnection (1s, 2s, 4s... max 30s)
 * - Message queue during disconnect, sends on reconnect
 * - Parses incoming messages by type
 * - No reconnect on intentional disconnect or invalid token (4001)
 */
export function useWebSocket() {
  // Connection state
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Refs for stable references across renders
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<ClientMessage[]>([]);
  const intentionalCloseRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Message handlers - stored in refs to avoid re-renders
  const messageHandlersRef = useRef<{
    onStream?: (message: StreamMessage) => void;
    onComplete?: (message: CompleteMessage) => void;
    onError?: (message: ErrorMessage) => void;
    onConnected?: (message: ConnectedMessage) => void;
  }>({});

  /**
   * Set message handlers
   */
  const setMessageHandlers = useCallback((handlers: {
    onStream?: (message: StreamMessage) => void;
    onComplete?: (message: CompleteMessage) => void;
    onError?: (message: ErrorMessage) => void;
    onConnected?: (message: ConnectedMessage) => void;
  }) => {
    messageHandlersRef.current = handlers;
  }, []);

  /**
   * Clear reconnect timeout
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Get auth token
    const token = getAuthToken();
    if (!token) {
      console.warn('[useWebSocket] No auth token available, cannot connect');
      setStatus('disconnected');
      return;
    }

    // Clear any pending reconnect
    clearReconnectTimeout();

    setStatus('connecting');
    intentionalCloseRef.current = false;

    // Build WebSocket URL with token in query string
    const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;

        console.log('[useWebSocket] Connected');
        setStatus('connected');
        setReconnectAttempt(0);

        // Send queued messages
        if (messageQueueRef.current.length > 0) {
          console.log(`[useWebSocket] Sending ${messageQueueRef.current.length} queued messages`);
          messageQueueRef.current.forEach((msg) => {
            ws.send(JSON.stringify(msg));
          });
          messageQueueRef.current = [];
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message = JSON.parse(event.data) as ServerMessage;

          // Route message to appropriate handler
          switch (message.type) {
            case 'stream':
              messageHandlersRef.current.onStream?.(message);
              break;
            case 'complete':
              messageHandlersRef.current.onComplete?.(message);
              break;
            case 'error':
              messageHandlersRef.current.onError?.(message);
              break;
            case 'connected':
              messageHandlersRef.current.onConnected?.(message);
              break;
            default:
              console.warn('[useWebSocket] Unknown message type:', (message as { type: string }).type);
          }
        } catch (error) {
          console.error('[useWebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        console.log(`[useWebSocket] Closed: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);

        wsRef.current = null;

        // Don't reconnect on intentional close
        if (intentionalCloseRef.current) {
          console.log('[useWebSocket] Intentional close, not reconnecting');
          setStatus('disconnected');
          return;
        }

        // Don't reconnect on invalid token (4001)
        if (event.code === CLOSE_CODES.INVALID_TOKEN) {
          console.error('[useWebSocket] Invalid token, not reconnecting');
          setStatus('disconnected');
          // Clear the message queue on auth failure
          messageQueueRef.current = [];
          return;
        }

        // Don't reconnect on normal close
        if (event.wasClean && event.code === CLOSE_CODES.NORMAL) {
          console.log('[useWebSocket] Clean close, not reconnecting');
          setStatus('disconnected');
          return;
        }

        // Abnormal close - attempt reconnection with exponential backoff
        setStatus('reconnecting');
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error('[useWebSocket] Error:', error);
        // onclose will be called after onerror, so we handle reconnection there
      };

    } catch (error) {
      console.error('[useWebSocket] Failed to create WebSocket:', error);
      setStatus('disconnected');
      scheduleReconnect();
    }
  }, [clearReconnectTimeout]);

  /**
   * Schedule reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (intentionalCloseRef.current) return;

    const currentAttempt = reconnectAttempt;
    const delay = calculateBackoffDelay(currentAttempt);

    console.log(`[useWebSocket] Scheduling reconnect in ${delay}ms (attempt ${currentAttempt + 1})`);

    setReconnectAttempt((prev) => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !intentionalCloseRef.current) {
        connect();
      }
    }, delay);
  }, [reconnectAttempt, connect]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    console.log('[useWebSocket] Disconnecting intentionally');

    intentionalCloseRef.current = true;
    clearReconnectTimeout();

    // Clear message queue on intentional disconnect
    messageQueueRef.current = [];

    if (wsRef.current) {
      wsRef.current.close(CLOSE_CODES.NORMAL, 'Client disconnect');
      wsRef.current = null;
    }

    setStatus('disconnected');
    setReconnectAttempt(0);
  }, [clearReconnectTimeout]);

  /**
   * Send a message to the server
   * Queues message if not connected, sends immediately if connected
   */
  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      // Queue message for later
      console.log('[useWebSocket] Connection not open, queueing message');
      messageQueueRef.current.push(message);

      // Attempt to reconnect if disconnected
      if (status === 'disconnected') {
        connect();
      }

      return false;
    }
  }, [status, connect]);

  /**
   * Send a query message (convenience method)
   */
  const sendQuery = useCallback((agentId: string, message: string, sessionId?: string) => {
    const queryMessage: QueryMessage = {
      type: 'query',
      data: sessionId !== undefined
        ? { agentId, message, sessionId }
        : { agentId, message },
    };
    return sendMessage(queryMessage);
  }, [sendMessage]);

  /**
   * Get current queue length
   */
  const getQueueLength = useCallback(() => {
    return messageQueueRef.current.length;
  }, []);

  /**
   * Clear message queue
   */
  const clearQueue = useCallback(() => {
    messageQueueRef.current = [];
  }, []);

  /**
   * Manual reconnect - resets attempt counter
   */
  const reconnect = useCallback(() => {
    console.log('[useWebSocket] Manual reconnect requested');

    intentionalCloseRef.current = false;
    setReconnectAttempt(0);
    clearReconnectTimeout();

    if (wsRef.current) {
      wsRef.current.close(CLOSE_CODES.NORMAL, 'Reconnecting');
      wsRef.current = null;
    }

    connect();
  }, [connect, clearReconnectTimeout]);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      clearReconnectTimeout();

      if (wsRef.current) {
        intentionalCloseRef.current = true;
        wsRef.current.close(CLOSE_CODES.GOING_AWAY, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect, clearReconnectTimeout]);

  // Reconnect when token changes (e.g., after login)
  useEffect(() => {
    const token = getAuthToken();

    // If we have a token and we're disconnected, try to connect
    if (token && status === 'disconnected' && !intentionalCloseRef.current) {
      connect();
    }

    // If we don't have a token and we're connected, disconnect
    if (!token && status === 'connected') {
      disconnect();
    }
  }, [status, connect, disconnect]);

  return {
    // Connection state
    status,
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    reconnectAttempt,

    // Actions
    connect,
    disconnect,
    reconnect,
    sendMessage,
    sendQuery,

    // Message handlers
    setMessageHandlers,

    // Queue management
    getQueueLength,
    clearQueue,
  };
}

export default useWebSocket;
