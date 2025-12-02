import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { ToolUseInfo } from '@shared/types';

// Import highlight.js styles (already imported in MessageBubble)
import 'highlight.js/styles/github-dark.css';

/**
 * Tool configuration with icons and colors
 */
interface ToolConfig {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
}

/**
 * Get tool configuration based on tool name
 */
function getToolConfig(toolName: string): ToolConfig {
  const normalizedName = toolName.toLowerCase();

  // Read tool - blue theme (viewing files)
  if (normalizedName === 'read' || normalizedName.includes('read')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      label: 'Read',
    };
  }

  // Write tool - green theme (creating files)
  if (normalizedName === 'write' || normalizedName.includes('write')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      label: 'Write',
    };
  }

  // Edit tool - yellow/amber theme (modifying files)
  if (normalizedName === 'edit' || normalizedName.includes('edit')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      label: 'Edit',
    };
  }

  // Bash tool - purple theme (running commands)
  if (normalizedName === 'bash' || normalizedName.includes('bash') || normalizedName.includes('command')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      label: 'Bash',
    };
  }

  // Glob tool - cyan theme (finding files)
  if (normalizedName === 'glob' || normalizedName.includes('glob') || normalizedName.includes('find')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      borderColor: 'border-cyan-200',
      label: 'Glob',
    };
  }

  // Grep tool - orange theme (searching content)
  if (normalizedName === 'grep' || normalizedName.includes('grep') || normalizedName.includes('search')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      label: 'Grep',
    };
  }

  // WebFetch tool - indigo theme (fetching URLs)
  if (normalizedName.includes('web') || normalizedName.includes('fetch') || normalizedName.includes('url')) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      label: 'WebFetch',
    };
  }

  // Default - gray theme (unknown tools)
  return {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    label: toolName,
  };
}

/**
 * Extract file path from tool input
 */
function extractFilePath(input: Record<string, unknown>): string | null {
  // Common field names for file paths
  const pathFields = ['file_path', 'filePath', 'path', 'filename', 'file'];

  for (const field of pathFields) {
    if (typeof input[field] === 'string') {
      return input[field] as string;
    }
  }

  return null;
}

/**
 * Extract command from Bash tool input
 */
function extractCommand(input: Record<string, unknown>): string | null {
  if (typeof input.command === 'string') {
    return input.command;
  }
  return null;
}

/**
 * Format the tool input for display
 */
function formatToolInput(toolName: string, input: Record<string, unknown>): React.ReactNode {
  const normalizedName = toolName.toLowerCase();

  // Handle Bash commands
  if (normalizedName === 'bash' || normalizedName.includes('bash')) {
    const command = extractCommand(input);
    if (command) {
      return (
        <code className="block text-sm font-mono bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
          $ {command}
        </code>
      );
    }
  }

  // Handle file operations - show file path prominently
  const filePath = extractFilePath(input);
  if (filePath) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <code className="font-mono text-gray-600 truncate" title={filePath}>
          {filePath}
        </code>
      </div>
    );
  }

  // For other tools, show formatted JSON
  const inputStr = JSON.stringify(input, null, 2);
  if (inputStr.length <= 100) {
    return (
      <code className="text-sm font-mono text-gray-600 break-all">
        {inputStr}
      </code>
    );
  }

  return (
    <code className="block text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">
      {inputStr}
    </code>
  );
}

/**
 * Threshold for auto-collapsing output
 */
const OUTPUT_COLLAPSE_THRESHOLD = 500;

/**
 * ToolUsageDisplay Props
 */
interface ToolUsageDisplayProps {
  toolUse: ToolUseInfo;
  showBorder?: boolean;
}

/**
 * Single tool usage display component
 */
function SingleToolDisplay({ toolUse, showBorder = true }: ToolUsageDisplayProps) {
  // Get tool configuration
  const config = useMemo(() => getToolConfig(toolUse.name), [toolUse.name]);

  // Determine if output should be collapsed by default (large output)
  const shouldCollapseByDefault = useMemo(() => {
    if (!toolUse.output) return false;
    return toolUse.output.length > OUTPUT_COLLAPSE_THRESHOLD;
  }, [toolUse.output]);

  // Collapse state
  const [isExpanded, setIsExpanded] = useState(!shouldCollapseByDefault);

  // Toggle expand/collapse
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Status indicator
  const statusIcon = useMemo(() => {
    switch (toolUse.status) {
      case 'pending':
        return (
          <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  }, [toolUse.status]);

  // Has output to show
  const hasOutput = toolUse.output && toolUse.output.trim().length > 0;

  return (
    <div
      className={`
        rounded-lg overflow-hidden
        ${showBorder ? `border ${config.borderColor}` : ''}
        ${config.bgColor}
      `}
    >
      {/* Header - always visible */}
      <button
        onClick={hasOutput ? toggleExpanded : undefined}
        className={`
          w-full flex items-center gap-2 px-3 py-2
          ${hasOutput ? 'cursor-pointer hover:bg-black/5' : 'cursor-default'}
          transition-colors
        `}
        aria-expanded={isExpanded}
        disabled={!hasOutput}
      >
        {/* Tool icon */}
        <span className={config.textColor}>{config.icon}</span>

        {/* Tool name */}
        <span className={`font-medium text-sm ${config.textColor}`}>
          {config.label}
        </span>

        {/* Status */}
        <span className="flex-shrink-0">{statusIcon}</span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Expand/collapse indicator */}
        {hasOutput && (
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Tool input - always visible */}
      <div className="px-3 pb-2">
        {formatToolInput(toolUse.name, toolUse.input)}
      </div>

      {/* Tool output - collapsible */}
      {hasOutput && isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          <div className="p-3">
            {toolUse.status === 'error' ? (
              // Error output styling
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap break-words overflow-x-auto">
                  {toolUse.output}
                </pre>
              </div>
            ) : (
              // Normal output with syntax highlighting for code
              <div className="prose prose-sm max-w-none overflow-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Wrap code blocks in scrollable container
                    pre: ({ children }) => (
                      <pre className="!p-3 !m-0 overflow-x-auto text-sm !bg-gray-900 !text-gray-100 rounded">
                        {children}
                      </pre>
                    ),
                    // Inline code styling
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="px-1.5 py-0.5 rounded text-sm font-mono bg-gray-200" {...props}>
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
                    // Paragraph styling
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0 text-sm text-gray-700">{children}</p>
                    ),
                  }}
                >
                  {`\`\`\`\n${toolUse.output}\n\`\`\``}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Output size indicator for large outputs */}
          {toolUse.output && toolUse.output.length > OUTPUT_COLLAPSE_THRESHOLD && (
            <div className="px-3 pb-2 text-xs text-gray-400">
              {toolUse.output.length.toLocaleString()} characters
            </div>
          )}
        </div>
      )}

      {/* Collapsed output indicator */}
      {hasOutput && !isExpanded && (
        <div className="px-3 pb-2">
          <span className="text-xs text-gray-400">
            Click to expand output ({toolUse.output!.length.toLocaleString()} chars)
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * ToolUsageListProps
 */
interface ToolUsageListProps {
  tools: ToolUseInfo[];
  className?: string;
}

/**
 * ToolUsageDisplay - Display a list of tool usage events in chat
 *
 * Features:
 * - Different icons and colors for different tool types (Read, Write, Edit, Bash, Glob, Grep)
 * - Collapsible output sections (auto-collapsed for large outputs > 500 chars)
 * - Clear file path display
 * - Syntax highlighting for code in tool results
 * - Status indicators (pending spinner, completed checkmark, error X)
 * - Handles missing tool results gracefully
 *
 * Requirements: REQ-4 (show tool usage in chat)
 *
 * @param tools - Array of ToolUseInfo objects to display
 * @param className - Additional CSS classes
 */
export function ToolUsageDisplay({ tools, className = '' }: ToolUsageListProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {tools.map((tool) => (
        <SingleToolDisplay key={tool.id} toolUse={tool} />
      ))}
    </div>
  );
}

/**
 * Export single tool display for individual use
 */
export { SingleToolDisplay };

export default ToolUsageDisplay;
