import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Message } from '@shared/types';

// Import highlight.js styles - using a dark theme similar to VSCode
import 'highlight.js/styles/github-dark.css';

/**
 * MessageBubble Props
 */
interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
}

/**
 * MessageBubble - Telegram-style message bubble component with markdown rendering
 *
 * Features:
 * - Telegram-style alignment (user messages on right, assistant on left)
 * - Markdown rendering with react-markdown
 * - GitHub-flavored markdown support (tables, strikethrough, etc.)
 * - Syntax highlighting for code blocks using rehype-highlight
 * - Copy button for code blocks
 * - Long message handling with proper text wrapping
 * - Timestamp display
 *
 * Requirements: REQ-4 (Chat Interface with message history, streaming display)
 *
 * Reference: clipendra-repo MessageBubble.tsx
 */
export function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  /**
   * Determine if this is a user message
   */
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  /**
   * Format timestamp for display
   */
  const formattedTime = useMemo(() => {
    const date = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.timestamp]);

  /**
   * Handle copying code block content
   */
  const handleCopyCode = useCallback(
    async (code: string, blockIndex: number) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedBlockIndex(blockIndex);
        setTimeout(() => setCopiedBlockIndex(null), 2000);
        onCopy?.(code);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    },
    [onCopy]
  );

  /**
   * Handle copying full message content
   */
  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      onCopy?.(message.content);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  }, [message.content, onCopy]);

  /**
   * Track code block index for copy button state
   */
  let codeBlockIndex = 0;

  /**
   * System message styling
   */
  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="max-w-[85%] px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}
    >
      <div
        className={`
          relative max-w-[85%] rounded-2xl px-4 py-2 group
          ${
            isUser
              ? 'bg-primary-500 text-white rounded-tr-md'
              : 'bg-gray-100 text-gray-900 rounded-tl-md'
          }
        `}
      >
        {/* Agent label for assistant messages */}
        {!isUser && (
          <div className="text-xs font-semibold text-primary-600 mb-1">
            Assistant
          </div>
        )}

        {/* Message content with Markdown rendering */}
        <div
          className={`
            text-[15px] leading-relaxed break-words
            prose prose-sm max-w-none
            ${isUser ? 'prose-invert' : ''}
          `}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Paragraph styling
              p: ({ children }) => (
                <p className="mb-2 last:mb-0">{children}</p>
              ),

              // Code block with copy button
              pre: ({ children }) => {
                const currentIndex = codeBlockIndex++;
                // Extract code content from children
                const codeElement = children as React.ReactElement;
                const codeContent =
                  typeof codeElement?.props?.children === 'string'
                    ? codeElement.props.children
                    : '';

                return (
                  <div className="relative my-2 rounded-lg overflow-hidden">
                    <pre className="!p-3 !m-0 overflow-x-auto text-sm !bg-gray-900 !text-gray-100">
                      {children}
                    </pre>
                    {/* Copy button for code blocks */}
                    <button
                      onClick={() => handleCopyCode(codeContent, currentIndex)}
                      className="absolute top-2 right-2 p-1.5 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy code"
                    >
                      {copiedBlockIndex === currentIndex ? (
                        <svg
                          className="w-4 h-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              },

              // Inline code styling
              code: ({ className, children, ...props }) => {
                // Check if this is inline code (no language class and not inside pre)
                const isInline = !className;
                if (isInline) {
                  return (
                    <code
                      className={`
                        px-1.5 py-0.5 rounded text-sm font-mono
                        ${isUser ? 'bg-primary-400/30' : 'bg-gray-200'}
                      `}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },

              // List styling
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-2 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="ml-2">{children}</li>,

              // Link styling
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${
                    isUser
                      ? 'text-white hover:text-gray-200'
                      : 'text-primary-600 hover:text-primary-700'
                  }`}
                >
                  {children}
                </a>
              ),

              // Heading styling
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-bold mb-2 mt-2 first:mt-0">
                  {children}
                </h3>
              ),

              // Blockquote styling
              blockquote: ({ children }) => (
                <blockquote
                  className={`
                    border-l-4 pl-3 my-2 italic
                    ${isUser ? 'border-white/50' : 'border-gray-300'}
                  `}
                >
                  {children}
                </blockquote>
              ),

              // Horizontal rule
              hr: () => (
                <hr
                  className={`my-4 border-t ${
                    isUser ? 'border-white/30' : 'border-gray-200'
                  }`}
                />
              ),

              // Table styling (GFM)
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="min-w-full border-collapse text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead
                  className={isUser ? 'bg-primary-400/20' : 'bg-gray-200'}
                >
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-2 py-1 text-left font-semibold border border-gray-300">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-2 py-1 border border-gray-300">{children}</td>
              ),

              // Image styling
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt || ''}
                  className="max-w-full h-auto rounded-lg my-2"
                  loading="lazy"
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Footer: Time + Token Usage */}
        <div className="flex items-center justify-end gap-2 mt-1">
          {/* Token usage display for assistant messages */}
          {!isUser && message.usage && (
            <span className="text-[11px] text-gray-400">
              {message.usage.input_tokens + message.usage.output_tokens} tokens
            </span>
          )}
          <span
            className={`text-[11px] ${
              isUser ? 'text-white/70' : 'text-gray-400'
            }`}
          >
            {formattedTime}
          </span>
          {/* Read indicator for user messages */}
          {isUser && (
            <svg
              className="w-4 h-4 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>

        {/* Copy message button (visible on hover) */}
        {!isUser && (
          <button
            onClick={handleCopyMessage}
            className="absolute -bottom-7 left-0 p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all opacity-0 group-hover:opacity-100"
            title="Copy message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
