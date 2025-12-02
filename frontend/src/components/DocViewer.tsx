import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { X, FileText, Copy, Check } from 'lucide-react';

// Import highlight.js styles - using a dark theme similar to VSCode
import 'highlight.js/styles/github-dark.css';

/**
 * DocViewer Props following design.md interface
 */
interface DocViewerProps {
  /** Markdown content to render */
  content: string;
  /** File path or name for the header */
  filename: string;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

/**
 * DocViewer - Markdown document viewer component
 *
 * Features:
 * - Renders markdown with react-markdown
 * - GitHub-flavored markdown support (tables, task lists, strikethrough)
 * - Syntax highlighting for code blocks using rehype-highlight
 * - Proper heading hierarchy with visual distinction
 * - Filename displayed in header
 * - Copy button for code blocks
 * - View-only (no editing)
 * - Graceful handling of missing/empty content
 *
 * Requirements: REQ-5 (Markdown Document Viewer with GFM and syntax highlighting)
 *
 * Reference: design.md DocViewer interface
 */
export function DocViewer({ content, filename, onClose }: DocViewerProps) {
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  /**
   * Extract just the filename from a path
   */
  const displayName = filename.split('/').pop() || filename;

  /**
   * Handle copying code block content
   */
  const handleCopyCode = useCallback(
    async (code: string, blockIndex: number) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedBlockIndex(blockIndex);
        setTimeout(() => setCopiedBlockIndex(null), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    },
    []
  );

  /**
   * Track code block index for copy button state
   */
  let codeBlockIndex = 0;

  /**
   * Handle empty or missing content
   */
  if (!content || content.trim() === '') {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 truncate" title={filename}>
              {displayName}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-icon flex-shrink-0"
              aria-label="Close document"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No content available</p>
            <p className="text-sm mt-1">This document is empty or could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with filename */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate" title={filename}>
            {displayName}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="btn-icon flex-shrink-0"
            aria-label="Close document"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto scroll-smooth-touch">
        <article className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="prose prose-gray max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Heading hierarchy with proper styling
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-8 first:mt-0 pb-2 border-b border-gray-200">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-6 first:mt-0 pb-1 border-b border-gray-100">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-5 first:mt-0">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-4 first:mt-0">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-base font-semibold text-gray-800 mb-2 mt-3 first:mt-0">
                    {children}
                  </h5>
                ),
                h6: ({ children }) => (
                  <h6 className="text-sm font-semibold text-gray-700 mb-2 mt-3 first:mt-0 uppercase tracking-wide">
                    {children}
                  </h6>
                ),

                // Paragraph styling
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                    {children}
                  </p>
                ),

                // Code block with copy button (consistent styling)
                pre: ({ children }) => {
                  const currentIndex = codeBlockIndex++;
                  // Extract code content from children
                  const codeElement = children as React.ReactElement;
                  const codeContent =
                    typeof codeElement?.props?.children === 'string'
                      ? codeElement.props.children
                      : '';

                  return (
                    <div className="relative my-4 rounded-lg overflow-hidden group">
                      <pre className="!p-4 !m-0 overflow-x-auto text-sm !bg-gray-900 !text-gray-100">
                        {children}
                      </pre>
                      {/* Copy button for code blocks */}
                      <button
                        onClick={() => handleCopyCode(codeContent, currentIndex)}
                        className="absolute top-2 right-2 p-2 rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy code"
                        aria-label="Copy code to clipboard"
                      >
                        {copiedBlockIndex === currentIndex ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                },

                // Inline code styling (consistent with MessageBubble)
                code: ({ className, children, ...props }) => {
                  // Check if this is inline code (no language class)
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-800"
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
                  <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-gray-700">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-gray-700">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),

                // GFM: Task list styling
                input: ({ type, checked, ...props }) => {
                  if (type === 'checkbox') {
                    return (
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled
                        className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        {...props}
                      />
                    );
                  }
                  return <input type={type} {...props} />;
                },

                // Link styling
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),

                // Blockquote styling
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                    {children}
                  </blockquote>
                ),

                // Horizontal rule
                hr: () => <hr className="my-8 border-t border-gray-200" />,

                // GFM: Table styling
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white divide-y divide-gray-200">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {children}
                  </td>
                ),

                // GFM: Strikethrough styling
                del: ({ children }) => (
                  <del className="text-gray-500 line-through">{children}</del>
                ),

                // Image styling
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt || ''}
                    className="max-w-full h-auto rounded-lg my-4 shadow-sm"
                    loading="lazy"
                  />
                ),

                // Strong/Bold text
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),

                // Emphasis/Italic text
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}

export default DocViewer;
