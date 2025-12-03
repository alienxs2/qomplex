/**
 * Skeleton - Reusable loading skeleton components
 *
 * Provides a consistent loading experience across the application.
 * Skeletons match the final layout to prevent layout shift.
 *
 * Features:
 * - Base Skeleton component with customizable dimensions
 * - Pre-built skeletons for common patterns (AgentListSkeleton, MessageListSkeleton)
 * - Shimmer animation using TailwindCSS
 * - Subtle, non-intrusive visual feedback
 * - Matches actual component dimensions to avoid layout shift
 *
 * Requirements: Non-functional (Usability - loading states)
 */

import { type ReactNode } from 'react';

/**
 * Base Skeleton Props
 */
interface SkeletonProps {
  /** Width class or value (default: w-full) */
  width?: string;
  /** Height class or value (default: h-4) */
  height?: string;
  /** Border radius class (default: rounded) */
  rounded?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Base Skeleton component - animated placeholder for content
 *
 * Uses a shimmer animation effect with a subtle gradient.
 * Background is gray-200 base with gray-100 shimmer.
 */
export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`
        ${width} ${height} ${rounded}
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        bg-[length:200%_100%]
        animate-skeleton
        ${className}
      `}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText - Multiple lines of text skeleton
 */
interface SkeletonTextProps {
  /** Number of lines to show */
  lines?: number;
  /** Gap between lines */
  gap?: string;
  /** Make last line shorter */
  lastLineWidth?: string;
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonText({
  lines = 3,
  gap = 'gap-2',
  lastLineWidth = 'w-3/4',
  className = '',
}: SkeletonTextProps) {
  return (
    <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : 'w-full'}
          height="h-3"
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCircle - Circular skeleton for avatars
 */
interface SkeletonCircleProps {
  /** Size class (default: w-10 h-10) */
  size?: string;
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonCircle({
  size = 'w-10 h-10',
  className = '',
}: SkeletonCircleProps) {
  return (
    <Skeleton
      width=""
      height=""
      rounded="rounded-full"
      className={`${size} flex-shrink-0 ${className}`}
    />
  );
}

/**
 * SkeletonButton - Button-shaped skeleton
 */
interface SkeletonButtonProps {
  /** Width class (default: w-full) */
  width?: string;
  /** Height class (default: h-10) */
  height?: string;
  /** Additional CSS classes */
  className?: string;
}

export function SkeletonButton({
  width = 'w-full',
  height = 'h-10',
  className = '',
}: SkeletonButtonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      rounded="rounded-lg"
      className={className}
    />
  );
}

// =============================================================================
// PRE-BUILT SKELETON COMPONENTS FOR SPECIFIC UI PATTERNS
// =============================================================================

/**
 * AgentListItemSkeleton - Single agent list item skeleton
 * Matches AgentList item layout: avatar + name/status + settings button
 */
export function AgentListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 min-h-[44px]">
      {/* Avatar skeleton */}
      <SkeletonCircle size="w-10 h-10" />

      {/* Name and status */}
      <div className="flex-1 min-w-0">
        <Skeleton width="w-28" height="h-4" className="mb-1" />
        <Skeleton width="w-20" height="h-3" />
      </div>

      {/* Settings button placeholder */}
      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
        <SkeletonCircle size="w-5 h-5" />
      </div>
    </div>
  );
}

/**
 * AgentListSkeleton - Full agent list skeleton
 * Shows multiple agent item skeletons
 */
interface AgentListSkeletonProps {
  /** Number of items to show (default: 5) */
  count?: number;
}

export function AgentListSkeleton({ count = 5 }: AgentListSkeletonProps) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: count }).map((_, index) => (
        <AgentListItemSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * MessageBubbleSkeleton - Single message bubble skeleton
 * Can be styled as user (right aligned) or assistant (left aligned)
 */
interface MessageBubbleSkeletonProps {
  /** Role determines alignment: 'user' (right) or 'assistant' (left) */
  role?: 'user' | 'assistant';
  /** Number of text lines (default: 2) */
  lines?: number;
}

export function MessageBubbleSkeleton({
  role = 'assistant',
  lines = 2,
}: MessageBubbleSkeletonProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex px-4 py-1 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-2
          ${isUser
            ? 'bg-primary-100 rounded-tr-md'
            : 'bg-gray-100 rounded-tl-md'
          }
        `}
      >
        {/* Agent name for assistant messages */}
        {!isUser && (
          <Skeleton width="w-16" height="h-3" className="mb-2" />
        )}

        {/* Message content lines */}
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              width={index === lines - 1 ? 'w-3/4' : 'w-full'}
              height="h-3"
              className={isUser ? 'bg-gradient-to-r from-primary-200 via-primary-100 to-primary-200' : ''}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * MessageListSkeleton - Full message list skeleton
 * Shows alternating user/assistant messages
 */
interface MessageListSkeletonProps {
  /** Number of message pairs to show (default: 3) */
  pairs?: number;
}

export function MessageListSkeleton({ pairs = 3 }: MessageListSkeletonProps) {
  return (
    <div className="py-2 space-y-2">
      {Array.from({ length: pairs }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* User message */}
          <MessageBubbleSkeleton role="user" lines={1} />
          {/* Assistant response */}
          <MessageBubbleSkeleton role="assistant" lines={3} />
        </div>
      ))}
    </div>
  );
}

/**
 * ProjectSelectorSkeleton - Skeleton for project selector dropdown
 */
export function ProjectSelectorSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg min-h-[44px]">
      <Skeleton width="w-5" height="h-5" rounded="rounded" />
      <Skeleton width="w-32" height="h-4" />
      <div className="flex-1" />
      <Skeleton width="w-4" height="h-4" />
    </div>
  );
}

// =============================================================================
// LOADING INDICATORS
// =============================================================================

/**
 * Spinner - Circular spinning loader
 */
interface SpinnerProps {
  /** Size class (default: w-5 h-5) */
  size?: string;
  /** Color class (default: text-primary-500) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

export function Spinner({
  size = 'w-5 h-5',
  color = 'text-primary-500',
  className = '',
}: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${size} ${color} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );
}

/**
 * InlineSpinner - Small spinner for inline use (buttons, labels)
 */
interface InlineSpinnerProps {
  /** Size class (default: w-4 h-4) */
  size?: string;
  /** Color class (default: current text color) */
  color?: string;
}

export function InlineSpinner({
  size = 'w-4 h-4',
  color = 'currentColor',
}: InlineSpinnerProps) {
  return (
    <svg
      className={`animate-spin ${size}`}
      style={{ color }}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );
}

/**
 * LoadingOverlay - Full container overlay with centered spinner
 */
interface LoadingOverlayProps {
  /** Message to display below spinner */
  message?: string;
  /** Whether overlay is visible */
  visible?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function LoadingOverlay({
  message,
  visible = true,
  className = '',
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={`
        absolute inset-0 bg-white/80 backdrop-blur-sm
        flex flex-col items-center justify-center z-10
        ${className}
      `}
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner size="w-8 h-8" />
      {message && (
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}

// =============================================================================
// CONNECTION STATUS INDICATORS
// =============================================================================

/**
 * ConnectionStatus - WebSocket connection status indicator
 */
interface ConnectionStatusProps {
  /** Current connection status */
  status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  /** Current reconnect attempt number (for reconnecting state) */
  reconnectAttempt?: number;
  /** Whether to show the indicator (auto-hides when connected) */
  alwaysShow?: boolean;
}

export function ConnectionStatus({
  status,
  reconnectAttempt = 0,
  alwaysShow = false,
}: ConnectionStatusProps) {
  // Don't show if connected and not always showing
  if (status === 'connected' && !alwaysShow) return null;

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      animate: false,
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      animate: true,
    },
    reconnecting: {
      color: 'bg-yellow-500',
      text: `Reconnecting${reconnectAttempt > 0 ? ` (attempt ${reconnectAttempt})` : '...'}`,
      animate: true,
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'Disconnected',
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 text-white text-sm rounded-full shadow-lg"
      role="status"
      aria-live="polite"
    >
      <span
        className={`
          w-2 h-2 rounded-full ${config.color}
          ${config.animate ? 'animate-pulse' : ''}
        `}
      />
      <span>{config.text}</span>
    </div>
  );
}

/**
 * ReconnectingBanner - Banner shown at top when WebSocket is reconnecting
 */
interface ReconnectingBannerProps {
  /** Whether to show the banner */
  visible: boolean;
  /** Current reconnect attempt */
  attempt?: number;
  /** Manual reconnect callback (optional) */
  onReconnect?: (() => void) | undefined;
}

export function ReconnectingBanner({
  visible,
  attempt = 0,
  onReconnect,
}: ReconnectingBannerProps) {
  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm"
      role="alert"
    >
      <InlineSpinner size="w-4 h-4" color="currentColor" />
      <span className="flex-1">
        Connection lost. Reconnecting{attempt > 0 ? ` (attempt ${attempt})` : ''}...
      </span>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="px-2 py-1 text-xs font-medium bg-yellow-200 hover:bg-yellow-300 rounded transition-colors"
        >
          Retry Now
        </button>
      )}
    </div>
  );
}

// =============================================================================
// WRAPPER COMPONENTS
// =============================================================================

/**
 * SkeletonWrapper - Conditionally renders skeleton or children
 * Useful for wrapping components that need loading states
 */
interface SkeletonWrapperProps {
  /** Whether to show skeleton */
  isLoading: boolean;
  /** Skeleton component to show when loading */
  skeleton: ReactNode;
  /** Content to show when not loading */
  children: ReactNode;
}

export function SkeletonWrapper({
  isLoading,
  skeleton,
  children,
}: SkeletonWrapperProps) {
  return <>{isLoading ? skeleton : children}</>;
}

// Default export for convenience
export default Skeleton;
