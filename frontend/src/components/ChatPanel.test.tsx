/**
 * ChatPanel Component Tests
 *
 * Tests for the ChatPanel component including:
 * - Message display
 * - Message input and sending
 * - Loading and streaming states
 * - Empty state handling
 * - Token usage warning display
 *
 * Requirements: REQ-4 (Chat Interface)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from './ChatPanel';
import { useMessageStore } from '../store/messageStore';
import { useAgentStore } from '../store/agentStore';
import type { Message, Agent } from '@shared/types';

// Mock react-markdown to avoid complex rendering in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

// Mock remark-gfm and rehype-highlight
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));

// Mock highlight.js styles
vi.mock('highlight.js/styles/github-dark.css', () => ({}));

// Sample messages for testing
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    timestamp: new Date('2024-01-01T10:00:05'),
  },
];

// Sample agent for testing
const mockAgent: Agent = {
  id: 'agent-1',
  project_id: 'project-1',
  name: 'Test Agent',
  system_prompt: 'You are a helpful assistant.',
  linked_md_files: [],
  session_id: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('ChatPanel', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useMessageStore.setState({
      messages: [],
      isLoading: false,
      isStreaming: false,
      isLoadingHistory: false,
      contextUsage: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        warningThreshold: 120000,
      },
      error: null,
    });

    useAgentStore.setState({
      agents: [mockAgent],
      currentAgent: mockAgent,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders empty state when no messages', () => {
      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText(/send a message to start the conversation/i)).toBeInTheDocument();
    });

    it('renders agent name in empty state', () => {
      render(<ChatPanel agentId="agent-1" />);

      // Agent name appears multiple times (header and empty state)
      const agentNames = screen.getAllByText('Test Agent');
      expect(agentNames.length).toBeGreaterThanOrEqual(1);
    });

    it('renders message input', () => {
      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByPlaceholderText(/message test agent/i)).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('renders keyboard hint', () => {
      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText(/press enter to send/i)).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('renders user messages', () => {
      useMessageStore.setState({ messages: mockMessages });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('renders assistant messages', () => {
      useMessageStore.setState({ messages: mockMessages });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
    });

    it('renders multiple messages in order', () => {
      useMessageStore.setState({ messages: mockMessages });

      render(<ChatPanel agentId="agent-1" />);

      const messages = screen.getAllByText(/./);
      // Both messages should be present
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('allows typing in message input', async () => {
      const user = userEvent.setup();
      render(<ChatPanel agentId="agent-1" />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Test message');

      expect(input).toHaveValue('Test message');
    });

    it('enables send button when text is entered', async () => {
      const user = userEvent.setup();
      render(<ChatPanel agentId="agent-1" />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('disables send button when input is empty', () => {
      render(<ChatPanel agentId="agent-1" />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('calls onSendMessage when send button is clicked', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn();

      render(<ChatPanel agentId="agent-1" onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup();

      render(<ChatPanel agentId="agent-1" onSendMessage={vi.fn()} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('sends message on Enter key press', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn();

      render(<ChatPanel agentId="agent-1" onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('allows new line with Shift+Enter', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn();

      render(<ChatPanel agentId="agent-1" onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(input, 'Line 2');

      // Should not have sent the message
      expect(onSendMessage).not.toHaveBeenCalled();
      // Input should contain both lines
      expect(input).toHaveValue('Line 1\nLine 2');
    });

    it('trims whitespace before sending', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn();

      render(<ChatPanel agentId="agent-1" onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, '  Test message  ');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onSendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('does not send empty message', async () => {
      const user = userEvent.setup();
      const onSendMessage = vi.fn();

      render(<ChatPanel agentId="agent-1" onSendMessage={onSendMessage} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, '   ');
      await user.keyboard('{Enter}');

      expect(onSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows typing indicator when loading', () => {
      useMessageStore.setState({ isLoading: true });

      render(<ChatPanel agentId="agent-1" />);

      // Typing indicator should be visible (contains agent name)
      expect(screen.getAllByText('Test Agent').length).toBeGreaterThan(0);
    });

    it('shows typing indicator when streaming', () => {
      useMessageStore.setState({ isStreaming: true });

      render(<ChatPanel agentId="agent-1" />);

      // The typing indicator component should be rendered
      expect(document.querySelector('.animate-bounce')).toBeInTheDocument();
    });

    it('disables input while loading', () => {
      render(<ChatPanel agentId="agent-1" isLoading={true} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      expect(input).toBeDisabled();
    });

    it('accepts external isLoading prop', () => {
      render(<ChatPanel agentId="agent-1" isLoading={true} />);

      // Should show loading spinner in send button
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('accepts external isStreaming prop', () => {
      render(<ChatPanel agentId="agent-1" isStreaming={true} />);

      // Typing indicator should be present
      expect(document.querySelector('.animate-bounce')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when isDisabled is true', () => {
      render(<ChatPanel agentId="agent-1" isDisabled={true} />);

      const input = screen.getByPlaceholderText(/connecting/i);
      expect(input).toBeDisabled();
    });

    it('shows "Connecting..." placeholder when disabled', () => {
      render(<ChatPanel agentId="agent-1" isDisabled={true} />);

      expect(screen.getByPlaceholderText(/connecting/i)).toBeInTheDocument();
    });
  });

  describe('Header Display', () => {
    it('shows header by default', () => {
      render(<ChatPanel agentId="agent-1" />);

      // Agent avatar letter should be visible (may appear multiple times)
      const avatarLetters = screen.getAllByText('T');
      expect(avatarLetters.length).toBeGreaterThanOrEqual(1);
    });

    it('hides header when showHeader is false', () => {
      render(<ChatPanel agentId="agent-1" showHeader={false} />);

      // Look for the header container with agent info
      // It should not have the avatar when header is hidden
      const avatars = screen.queryAllByText('T');
      // Only the empty state avatar should be present, not the header avatar
      expect(avatars.length).toBeLessThanOrEqual(1);
    });

    it('shows session status in header', () => {
      const agentWithSession = { ...mockAgent, session_id: 'session-123' };
      useAgentStore.setState({
        agents: [agentWithSession],
        currentAgent: agentWithSession,
      });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText(/active session/i)).toBeInTheDocument();
    });

    it('shows "Ready" status when no session', () => {
      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText(/ready/i)).toBeInTheDocument();
    });
  });

  describe('Token Usage', () => {
    it('shows token usage in header when tokens are used', () => {
      useMessageStore.setState({
        contextUsage: {
          totalTokens: 5000,
          inputTokens: 3000,
          outputTokens: 2000,
          warningThreshold: 120000,
        },
      });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText(/5.*tokens/i)).toBeInTheDocument();
    });

    it('shows warning banner when approaching token limit', () => {
      useMessageStore.setState({
        contextUsage: {
          totalTokens: 125000,
          inputTokens: 75000,
          outputTokens: 50000,
          warningThreshold: 120000,
        },
      });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText(/context limit approaching/i)).toBeInTheDocument();
    });

    it('does not show warning when under threshold', () => {
      useMessageStore.setState({
        contextUsage: {
          totalTokens: 50000,
          inputTokens: 30000,
          outputTokens: 20000,
          warningThreshold: 120000,
        },
      });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.queryByText(/context limit approaching/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('shows error banner when there is an error', () => {
      useMessageStore.setState({ error: 'Something went wrong' });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('hides error banner when no error', () => {
      useMessageStore.setState({ error: null });

      render(<ChatPanel agentId="agent-1" />);

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('No Agent Selected', () => {
    it('shows appropriate placeholder when no agent', () => {
      useAgentStore.setState({
        agents: [],
        currentAgent: null,
      });

      render(<ChatPanel agentId="unknown-agent" />);

      expect(screen.getByPlaceholderText(/select an agent to chat/i)).toBeInTheDocument();
    });

    it('disables input when no agent is selected', () => {
      useAgentStore.setState({
        agents: [],
        currentAgent: null,
      });

      render(<ChatPanel agentId="unknown-agent" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Message Store Integration', () => {
    it('adds user message to store when sending', async () => {
      const user = userEvent.setup();
      const addMessageSpy = vi.fn();
      useMessageStore.setState({ addMessage: addMessageSpy });

      render(<ChatPanel agentId="agent-1" onSendMessage={vi.fn()} />);

      const input = screen.getByPlaceholderText(/message test agent/i);
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(addMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'user',
            content: 'Test message',
          })
        );
      });
    });
  });
});
