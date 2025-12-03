import { create } from 'zustand';
import type { Message, ContextUsage } from '@shared/types';

/**
 * Default context usage values
 */
const DEFAULT_CONTEXT_USAGE: ContextUsage = {
  totalTokens: 0,
  inputTokens: 0,
  outputTokens: 0,
  warningThreshold: 120000, // 120K tokens warning threshold per design.md
};

/**
 * MessageState interface following design.md specification
 */
interface MessageState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  isLoadingHistory: boolean; // REQ-8: Loading history state
  contextUsage: ContextUsage;
  error: string | null;

  // Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  setContextUsage: (usage: ContextUsage) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsLoadingHistory: (loading: boolean) => void; // REQ-8
  setError: (error: string | null) => void;
}

/**
 * useMessageStore - Zustand store for chat message state management
 *
 * Features:
 * - Messages are NOT persisted (loaded from backend per design.md restrictions)
 * - addMessage appends a new message to the list
 * - updateLastMessage efficiently updates the last message content (for streaming)
 * - setContextUsage tracks token usage with warning threshold
 * - Separate isLoading and isStreaming states for different UI feedback
 *
 * Performance considerations:
 * - updateLastMessage uses immer-style update to avoid re-creating entire array
 * - Messages are stored by reference, only updating when necessary
 */
export const useMessageStore = create<MessageState>()((set) => ({
  messages: [],
  isLoading: false,
  isStreaming: false,
  isLoadingHistory: false,
  contextUsage: { ...DEFAULT_CONTEXT_USAGE },
  error: null,

  /**
   * Add a new message to the chat
   * Used for both user messages and initial assistant messages
   */
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
      error: null,
    }));
  },

  /**
   * Update the content of the last message in the list
   * Used for streaming responses - appends or replaces content
   *
   * This is optimized for streaming by only updating the last message
   * rather than rebuilding the entire messages array
   */
  updateLastMessage: (content: string) => {
    set((state) => {
      const { messages } = state;

      // No messages to update
      if (messages.length === 0) {
        return state;
      }

      // Create a new array with the updated last message
      const updatedMessages = [...messages];
      const lastIndex = updatedMessages.length - 1;
      const lastMessage = updatedMessages[lastIndex];

      // Guard against undefined (shouldn't happen due to length check above)
      if (!lastMessage) {
        return state;
      }

      // Update the last message with new content
      // Only include optional properties if they exist
      const updatedMessage: Message = {
        id: lastMessage.id,
        role: lastMessage.role,
        content,
        timestamp: lastMessage.timestamp,
      };

      // Add optional properties only if they exist
      if (lastMessage.usage) {
        updatedMessage.usage = lastMessage.usage;
      }
      if (lastMessage.toolUse) {
        updatedMessage.toolUse = lastMessage.toolUse;
      }

      updatedMessages[lastIndex] = updatedMessage;

      return {
        messages: updatedMessages,
      };
    });
  },

  /**
   * Set all messages at once
   * Used when loading chat history from backend
   */
  setMessages: (messages: Message[]) => {
    set({
      messages,
      error: null,
    });
  },

  /**
   * Clear all messages
   * Used when switching agents or starting a new session
   */
  clearMessages: () => {
    set({
      messages: [],
      isLoading: false,
      isStreaming: false,
      isLoadingHistory: false,
      contextUsage: { ...DEFAULT_CONTEXT_USAGE },
      error: null,
    });
  },

  /**
   * Set context usage for token tracking
   * Shows warning when approaching token limit (default 120K)
   */
  setContextUsage: (usage: ContextUsage) => {
    set({ contextUsage: usage });
  },

  /**
   * Set loading state
   * Used when waiting for initial response
   */
  setIsLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Set streaming state
   * Used when receiving streaming response chunks
   */
  setIsStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  /**
   * Set loading history state (REQ-8)
   * Used when fetching chat history from transcript
   */
  setIsLoadingHistory: (loading: boolean) => {
    set({ isLoadingHistory: loading });
  },

  /**
   * Set error state
   */
  setError: (error: string | null) => {
    set({ error });
  },
}));

/**
 * Helper function to check if context usage is at warning level
 * Returns true if total tokens >= warning threshold (default 120K)
 */
export function isContextWarning(): boolean {
  const { contextUsage } = useMessageStore.getState();
  return contextUsage.totalTokens >= contextUsage.warningThreshold;
}

/**
 * Helper function to get the last message
 * Returns null if no messages exist
 */
export function getLastMessage(): Message | null {
  const { messages } = useMessageStore.getState();
  if (messages.length === 0) {
    return null;
  }
  const lastMessage = messages[messages.length - 1];
  return lastMessage ?? null;
}

/**
 * Helper function to get message count
 */
export function getMessageCount(): number {
  return useMessageStore.getState().messages.length;
}

/**
 * Helper function to check if there are any messages
 */
export function hasMessages(): boolean {
  return useMessageStore.getState().messages.length > 0;
}

/**
 * Helper function to create a new user message
 */
export function createUserMessage(content: string): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

/**
 * Helper function to create a new assistant message
 * Used when starting a streaming response
 */
export function createAssistantMessage(content: string = ''): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
}
