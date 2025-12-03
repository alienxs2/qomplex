import { useEffect, useCallback, useRef, useState } from 'react';
import { ChatPanel } from '../components/ChatPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMessageStore, createAssistantMessage } from '../store/messageStore';
import { useAgentStore } from '../store/agentStore';
import { getErrorInfo, TokenWarningBanner, ErrorModal } from '../components/ErrorDisplay';
import type { StreamMessage, CompleteMessage, ErrorMessage, ConnectedMessage } from '../hooks/useWebSocket';

/**
 * ChatPage Props
 */
interface ChatPageProps {
  agentId: string;
  showHeader?: boolean;
}

/**
 * ChatPage - Wrapper component connecting ChatPanel to WebSocket
 *
 * This component:
 * - Manages WebSocket connection and message handlers
 * - Handles sending messages via WebSocket 'query' messages
 * - Processes 'stream' events to update message content in real-time
 * - Processes 'complete' events to show token usage
 * - Processes 'error' events to display error messages
 * - Shows typing indicator during streaming
 * - Disables input while waiting for response
 * - Handles disconnect gracefully
 * - REQ-8: Detects agent session_id and loads history from transcript
 * - REQ-8: Passes sessionId with WebSocket query for --resume
 * - REQ-8: Provides "Start New Session" button to clear session_id
 *
 * Requirements: REQ-4 (real-time streaming via WebSocket), REQ-8 (Session Persistence)
 */
export function ChatPage({ agentId, showHeader = true }: ChatPageProps) {
  // WebSocket hook
  const {
    status,
    isConnected,
    reconnectAttempt,
    sendQuery,
    setMessageHandlers,
    reconnect,
  } = useWebSocket();

  // Message store
  const {
    addMessage,
    updateLastMessage,
    setIsLoading,
    setIsStreaming,
    setIsLoadingHistory,
    setMessages,
    clearMessages,
    setContextUsage,
    setError,
    isLoading,
    isStreaming,
    isLoadingHistory,
  } = useMessageStore();

  // Agent store
  const { currentAgent, fetchTranscript, clearAgentSession } = useAgentStore();

  // Track if we're waiting for a response
  const waitingForResponseRef = useRef(false);

  // Track accumulated content during streaming
  const streamContentRef = useRef('');

  // Track if transcript has been loaded for current agent
  const loadedAgentIdRef = useRef<string | null>(null);

  // State for session info display
  const [isResumedSession, setIsResumedSession] = useState(false);

  // State for error modal (critical errors that require user action)
  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    code: string;
    message: string;
  }>({ open: false, code: '', message: '' });

  // State for token warning
  const [tokenWarning, setTokenWarning] = useState<{
    show: boolean;
    totalTokens: number;
  }>({ show: false, totalTokens: 0 });

  /**
   * REQ-8: Load transcript history when agent is selected (if session exists)
   */
  useEffect(() => {
    // Skip if no agent, or if already loaded for this agent
    if (!currentAgent || loadedAgentIdRef.current === currentAgent.id) {
      return;
    }

    // Mark as loading for this agent
    loadedAgentIdRef.current = currentAgent.id;

    const loadHistory = async () => {
      // Clear previous messages
      clearMessages();

      // Check if agent has a session_id
      if (currentAgent.session_id) {
        console.log('[ChatPage] Agent has session_id, loading transcript:', currentAgent.session_id);
        setIsLoadingHistory(true);
        setIsResumedSession(true);

        try {
          const result = await fetchTranscript(currentAgent.id);

          if (result.success && result.messages.length > 0) {
            // Convert message timestamps from string to Date if needed
            const processedMessages = result.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
            }));
            setMessages(processedMessages);
            console.log('[ChatPage] Loaded', processedMessages.length, 'messages from transcript');
          } else {
            console.log('[ChatPage] No transcript messages found (session may be new or transcript unavailable)');
          }
        } catch (error) {
          console.warn('[ChatPage] Failed to load transcript:', error);
          // Gracefully handle - just start with empty messages
        } finally {
          setIsLoadingHistory(false);
        }
      } else {
        console.log('[ChatPage] No session_id, starting fresh');
        setIsResumedSession(false);
      }
    };

    loadHistory();
  }, [currentAgent, fetchTranscript, clearMessages, setMessages, setIsLoadingHistory]);

  /**
   * Handle stream events - update last message content
   */
  const handleStream = useCallback((message: StreamMessage) => {
    // Accumulate content from stream
    if (message.data?.content) {
      streamContentRef.current += message.data.content;
      updateLastMessage(streamContentRef.current);
    }

    // Show streaming indicator
    if (!isStreaming) {
      setIsStreaming(true);
    }
  }, [updateLastMessage, isStreaming, setIsStreaming]);

  /**
   * Handle complete events - show token usage
   */
  const handleComplete = useCallback((message: CompleteMessage) => {
    // Stop loading and streaming states
    setIsLoading(false);
    setIsStreaming(false);
    waitingForResponseRef.current = false;

    // Update context usage with token info
    if (message.data?.tokenUsage) {
      const { inputTokens, outputTokens, totalTokens } = message.data.tokenUsage;
      setContextUsage({
        totalTokens,
        inputTokens,
        outputTokens,
        warningThreshold: 120000, // 120K tokens warning
      });
    }

    // After first message, we're in an active session
    setIsResumedSession(true);

    // Reset stream content accumulator
    streamContentRef.current = '';
  }, [setIsLoading, setIsStreaming, setContextUsage]);

  /**
   * Handle error events - show error message with appropriate UI
   *
   * Based on design.md Error Handling section, different errors
   * require different handling:
   * - CLI_NOT_AUTHENTICATED, TERMS_REQUIRED: Show modal (requires external action)
   * - CLI_TIMEOUT: Show inline error with retry
   * - TOKEN_LIMIT_WARNING: Show warning banner
   * - Others: Show inline error
   */
  const handleError = useCallback((message: ErrorMessage) => {
    // Stop loading and streaming states
    setIsLoading(false);
    setIsStreaming(false);
    waitingForResponseRef.current = false;

    // Get error details
    const errorMessage = message.data?.message || 'An error occurred';
    const errorCode = message.data?.code || 'UNKNOWN_ERROR';

    console.error('[ChatPage] Error received:', { code: errorCode, message: errorMessage });

    // Check if this error requires special handling
    const criticalErrors = [
      'CLAUDE_LOGIN_REQUIRED',
      'CLAUDE_TERMS_REQUIRED',
      'INVALID_JWT',
    ];

    if (criticalErrors.includes(errorCode)) {
      // Show modal for critical errors that require user action
      setErrorModal({
        open: true,
        code: errorCode,
        message: errorMessage,
      });
    } else if (errorCode === 'TOKEN_LIMIT_WARNING') {
      // Show token warning banner
      const totalTokens = (message as unknown as { totalTokens?: number }).totalTokens || 120000;
      setTokenWarning({ show: true, totalTokens });
    } else {
      // Show inline error for other errors
      setError(`[${errorCode}] ${errorMessage}`);

      // Add error as a system message for visibility
      const errorInfo = getErrorInfo(errorCode);
      const errorSystemMessage = createAssistantMessage(
        `Error: ${errorInfo.title}\n\n${errorInfo.message}`
      );
      addMessage(errorSystemMessage);
    }

    // Reset stream content accumulator
    streamContentRef.current = '';
  }, [setIsLoading, setIsStreaming, setError, addMessage]);

  /**
   * Handle connected events
   */
  const handleConnected = useCallback((_message: ConnectedMessage) => {
    // Clear any previous errors on successful connection
    setError(null);
  }, [setError]);

  /**
   * Setup message handlers when component mounts
   */
  useEffect(() => {
    setMessageHandlers({
      onStream: handleStream,
      onComplete: handleComplete,
      onError: handleError,
      onConnected: handleConnected,
    });
  }, [setMessageHandlers, handleStream, handleComplete, handleError, handleConnected]);

  /**
   * Handle sending a message
   * - Creates assistant message placeholder
   * - Sends query via WebSocket
   * - Sets loading state
   * - REQ-8: Passes session_id for --resume
   */
  const handleSendMessage = useCallback((content: string) => {
    if (!agentId || !content.trim()) return;

    // Don't send if already waiting for response
    if (waitingForResponseRef.current) return;

    // Set loading state
    setIsLoading(true);
    waitingForResponseRef.current = true;
    streamContentRef.current = '';

    // Create placeholder for assistant response
    const assistantMessage = createAssistantMessage('');
    addMessage(assistantMessage);

    // REQ-8: Get session ID from current agent if available for --resume
    const sessionId = currentAgent?.session_id || undefined;

    // Send query via WebSocket
    const sent = sendQuery(agentId, content, sessionId);

    // If message wasn't sent (queued), it will be sent on reconnect
    if (!sent) {
      console.log('[ChatPage] Message queued, waiting for reconnection');
    }
  }, [agentId, sendQuery, setIsLoading, addMessage, currentAgent]);

  /**
   * Handle disconnect gracefully
   * - Show reconnection status
   * - Allow user to manually reconnect
   */
  const handleReconnectClick = useCallback(() => {
    reconnect();
  }, [reconnect]);

  /**
   * REQ-8: Handle "Start New Session" button click
   * Clears the session_id and messages to start fresh
   */
  const handleStartNewSession = useCallback(async () => {
    if (!currentAgent) return;

    try {
      // Clear messages immediately for UI feedback
      clearMessages();
      setIsResumedSession(false);

      // Clear session on backend
      await clearAgentSession(currentAgent.id);

      // Reset loaded agent tracker to allow fresh start
      loadedAgentIdRef.current = null;

      console.log('[ChatPage] Started new session');
    } catch (error) {
      console.error('[ChatPage] Failed to start new session:', error);
      setError('Failed to start new session');
    }
  }, [currentAgent, clearMessages, clearAgentSession, setError]);

  // Determine if input should be disabled
  const inputDisabled = isLoading || isStreaming || isLoadingHistory || !isConnected;

  /**
   * Handle error modal actions based on error type
   */
  const handleErrorModalAction = useCallback(() => {
    const { code } = errorModal;

    if (code === 'INVALID_JWT') {
      // Redirect to login page
      window.location.href = '/login';
    } else {
      // For CLI errors, user has taken action externally, close modal and retry
      setErrorModal({ open: false, code: '', message: '' });
      reconnect();
    }
  }, [errorModal, reconnect]);

  /**
   * Handle token warning actions
   */
  const handleStartNewSessionFromWarning = useCallback(() => {
    setTokenWarning({ show: false, totalTokens: 0 });
    handleStartNewSession();
  }, [handleStartNewSession]);

  // Get error info for modal display
  const errorInfo = getErrorInfo(errorModal.code);

  return (
    <div className="flex flex-col h-full">
      {/* Error Modal for critical errors */}
      {errorModal.open && (
        <ErrorModal
          open={errorModal.open}
          type={errorInfo.type}
          title={errorInfo.title}
          message={errorInfo.message}
          actionLabel={errorInfo.actionLabel || 'OK'}
          onAction={handleErrorModalAction}
          secondaryActionLabel="Dismiss"
          onSecondaryAction={() => setErrorModal({ open: false, code: '', message: '' })}
          onClose={() => setErrorModal({ open: false, code: '', message: '' })}
        />
      )}
      {/* Connection status banner - show when disconnected or reconnecting */}
      {(status === 'disconnected' || status === 'reconnecting') && (
        <div
          className={`
            flex-shrink-0 px-4 py-2 text-sm flex items-center justify-between
            ${status === 'reconnecting'
              ? 'bg-yellow-50 border-b border-yellow-200 text-yellow-700'
              : 'bg-red-50 border-b border-red-200 text-red-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {status === 'reconnecting' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Reconnecting... (attempt {reconnectAttempt})</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span>Disconnected from server</span>
              </>
            )}
          </div>
          {status === 'disconnected' && (
            <button
              onClick={handleReconnectClick}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      )}

      {/* REQ-8: Session status banner - show for resumed sessions */}
      {isResumedSession && currentAgent?.session_id && (
        <div className="flex-shrink-0 px-4 py-2 text-sm flex items-center justify-between bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Resuming session</span>
          </div>
          <button
            onClick={handleStartNewSession}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Start New Session
          </button>
        </div>
      )}

      {/* Loading history indicator */}
      {isLoadingHistory && (
        <div className="flex-shrink-0 px-4 py-3 text-sm flex items-center justify-center bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading chat history...</span>
          </div>
        </div>
      )}

      {/* Token warning banner */}
      {tokenWarning.show && (
        <div className="flex-shrink-0 px-4">
          <TokenWarningBanner
            totalTokens={tokenWarning.totalTokens}
            threshold={120000}
            onStartNewSession={handleStartNewSessionFromWarning}
            onDismiss={() => setTokenWarning({ show: false, totalTokens: 0 })}
          />
        </div>
      )}

      {/* ChatPanel with WebSocket integration */}
      <ChatPanel
        agentId={agentId}
        showHeader={showHeader}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
        isDisabled={inputDisabled}
      />
    </div>
  );
}

export default ChatPage;
