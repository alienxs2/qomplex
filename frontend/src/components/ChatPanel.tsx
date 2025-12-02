import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type FormEvent,
} from 'react';
import { useMessageStore } from '../store/messageStore';
import { useAgentStore } from '../store/agentStore';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@shared/types';

/**
 * ChatPanel Props following design.md interface
 */
interface ChatPanelProps {
  agentId: string;
  showHeader?: boolean;
  onSendMessage?: (content: string) => void;
}

/**
 * TypingIndicator - Animated dots showing assistant is typing
 */
function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="inline-flex items-center gap-2 bg-gray-100 rounded-2xl rounded-tl-md px-4 py-2">
        <span className="text-xs font-semibold text-primary-600">
          {agentName}
        </span>
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * EmptyState - Displayed when there are no messages
 */
function EmptyState({
  agentName,
  agentDescription,
}: {
  agentName: string;
  agentDescription?: string | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
        <span className="text-3xl font-bold text-primary-600">
          {agentName.charAt(0).toUpperCase()}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{agentName}</h2>
      {agentDescription && (
        <p className="text-sm text-gray-500 max-w-xs">{agentDescription}</p>
      )}
      <p className="text-sm text-gray-400 mt-4">
        Send a message to start the conversation
      </p>
    </div>
  );
}

/**
 * ChatInput - Message input component with send button
 */
interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-resize textarea based on content
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 150; // Maximum height in pixels
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && !disabled && !isLoading) {
        onSend(trimmedValue);
        setInputValue('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [inputValue, disabled, isLoading, onSend]
  );

  /**
   * Handle keyboard shortcuts (Enter to send, Shift+Enter for new line)
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !disabled && !isLoading) {
          onSend(trimmedValue);
          setInputValue('');
          // Reset textarea height
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        }
      }
    },
    [inputValue, disabled, isLoading, onSend]
  );

  /**
   * Focus input on mount
   */
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const canSend = inputValue.trim().length > 0 && !disabled && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-shrink-0 border-t border-gray-200 bg-white p-3 pb-safe"
    >
      <div className="flex items-end gap-2">
        {/* Textarea input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={`
              w-full resize-none rounded-2xl border border-gray-300 px-4 py-2.5
              focus:border-primary-500 focus:ring-1 focus:ring-primary-500
              placeholder:text-gray-400 text-gray-900
              disabled:bg-gray-50 disabled:text-gray-500
              min-h-[44px] max-h-[150px]
            `}
            style={{ overflow: 'hidden' }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`
            flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center
            transition-colors
            ${
              canSend
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          {isLoading ? (
            // Loading spinner
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
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
          ) : (
            // Send icon
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-gray-400 mt-1 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}

/**
 * ChatPanel - Core chat UI component with message list, input, and streaming support
 *
 * Features:
 * - Message list with Telegram-style bubbles (user right, assistant left)
 * - Auto-scroll to bottom on new messages
 * - Typing indicator during streaming
 * - Message input at bottom with send button
 * - Mobile keyboard handling (pb-safe class for safe area)
 * - Long message handling with proper scrolling
 *
 * Requirements: REQ-4 (Chat Interface with message history, streaming display)
 *
 * Reference: clipendra-repo ChatPanel.tsx
 *
 * @param agentId - ID of the agent to chat with
 * @param showHeader - Whether to show the header (default: true on desktop)
 * @param onSendMessage - Callback when a message is sent
 */
export function ChatPanel({
  agentId,
  showHeader = true,
  onSendMessage,
}: ChatPanelProps) {
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store access
  const { messages, isLoading, isStreaming, addMessage, contextUsage } =
    useMessageStore();
  const { agents, currentAgent } = useAgentStore();

  // Find the current agent from the store
  const agent = useMemo(() => {
    return currentAgent?.id === agentId
      ? currentAgent
      : agents.find((a) => a.id === agentId);
  }, [agents, currentAgent, agentId]);

  /**
   * Auto-scroll to bottom when new messages arrive or during streaming
   */
  useEffect(() => {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, isStreaming]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      // Create user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      // Add to store
      addMessage(userMessage);

      // Call external handler (e.g., WebSocket send)
      onSendMessage?.(content.trim());
    },
    [addMessage, onSendMessage]
  );

  /**
   * Handle copying message content
   */
  const handleCopyMessage = useCallback((content: string) => {
    // Could show a toast notification here
    console.log('Copied to clipboard:', content.substring(0, 50) + '...');
  }, []);

  /**
   * Get agent display name
   */
  const agentName = agent?.name || 'Assistant';
  const agentDescription = agent?.system_prompt
    ? agent.system_prompt.substring(0, 100) +
      (agent.system_prompt.length > 100 ? '...' : '')
    : undefined;

  /**
   * Check if there are any messages to display
   */
  const hasMessages = messages.length > 0;

  /**
   * Check if approaching token limit
   */
  const isApproachingLimit =
    contextUsage.totalTokens >= contextUsage.warningThreshold;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Optional Header */}
      {showHeader && agent && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          {/* Agent avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-700">
              {agentName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Agent info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{agentName}</h2>
            <p className="text-xs text-gray-500 truncate">
              {isStreaming ? 'typing...' : agent.session_id ? 'Active session' : 'Ready'}
            </p>
          </div>
          {/* Token usage indicator */}
          {contextUsage.totalTokens > 0 && (
            <div
              className={`
                text-xs px-2 py-1 rounded-full
                ${
                  isApproachingLimit
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
                }
              `}
              title={`Input: ${contextUsage.inputTokens}, Output: ${contextUsage.outputTokens}`}
            >
              {contextUsage.totalTokens >= 1000
                ? `${(contextUsage.totalTokens / 1000).toFixed(1)}K`
                : contextUsage.totalTokens}{' '}
              tokens
            </div>
          )}
        </div>
      )}

      {/* Token limit warning banner */}
      {isApproachingLimit && (
        <div className="flex-shrink-0 bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-700 flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Context limit approaching. Consider starting a new session.
          </p>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth-touch"
      >
        {/* Empty state */}
        {!hasMessages && !isLoading && (
          <EmptyState agentName={agentName} agentDescription={agentDescription || undefined} />
        )}

        {/* Message list */}
        {hasMessages && (
          <div className="py-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={handleCopyMessage}
              />
            ))}
          </div>
        )}

        {/* Typing indicator during streaming */}
        {(isLoading || isStreaming) && (
          <TypingIndicator agentName={agentName} />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!agent}
        isLoading={isLoading}
        placeholder={agent ? `Message ${agentName}...` : 'Select an agent to chat'}
      />
    </div>
  );
}

export default ChatPanel;
