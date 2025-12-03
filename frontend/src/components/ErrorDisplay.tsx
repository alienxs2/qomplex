/**
 * ErrorDisplay - User-Friendly Error Display Components
 *
 * Provides a suite of error display components for different error scenarios
 * as defined in design.md Error Handling section.
 *
 * Error scenarios handled:
 * - CLI not authenticated (CLAUDE_LOGIN_REQUIRED)
 * - Terms required (CLAUDE_TERMS_REQUIRED)
 * - WebSocket disconnect (WEBSOCKET_DISCONNECT)
 * - Timeout (CLI_TIMEOUT)
 * - Token limit (TOKEN_LIMIT_WARNING)
 * - Invalid JWT (INVALID_JWT)
 * - Path conflict (PROJECT_PATH_CONFLICT)
 */

import React, { ReactNode } from 'react';

/**
 * Error type determines styling and icon
 */
export type ErrorType = 'error' | 'warning' | 'info' | 'critical';

/**
 * Props for ErrorDisplay component
 */
interface ErrorDisplayProps {
  /** Type of error (affects styling) */
  type?: ErrorType | undefined;
  /** Error title/headline */
  title: string;
  /** Error message description */
  message: string;
  /** Optional action button label */
  actionLabel?: string | undefined;
  /** Optional action button callback */
  onAction?: (() => void) | undefined;
  /** Optional secondary action label */
  secondaryActionLabel?: string | undefined;
  /** Optional secondary action callback */
  onSecondaryAction?: (() => void) | undefined;
  /** Optional details (shown in development only typically) */
  details?: string | undefined;
  /** Whether to show as inline vs card */
  inline?: boolean | undefined;
  /** Optional dismiss handler */
  onDismiss?: (() => void) | undefined;
  /** Custom icon */
  icon?: ReactNode | undefined;
}

/**
 * Icon components for different error types
 */
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CriticalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
    />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WifiOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.364 5.636a9 9 0 010 12.728m0 0l-12.728-12.728M5.636 18.364a9 9 0 010-12.728"
    />
  </svg>
);

/**
 * Get icon component for error type
 */
function getIcon(type: ErrorType): React.FC<{ className?: string }> {
  switch (type) {
    case 'warning':
      return WarningIcon;
    case 'info':
      return InfoIcon;
    case 'critical':
      return CriticalIcon;
    case 'error':
    default:
      return ErrorIcon;
  }
}

/**
 * Get styling classes for error type
 */
function getTypeClasses(type: ErrorType): {
  container: string;
  icon: string;
  title: string;
  button: string;
} {
  switch (type) {
    case 'warning':
      return {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500 dark:text-yellow-400',
        title: 'text-yellow-800 dark:text-yellow-200',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      };
    case 'info':
      return {
        container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500 dark:text-blue-400',
        title: 'text-blue-800 dark:text-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    case 'critical':
      return {
        container: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-900 dark:text-red-100',
        button: 'bg-red-600 hover:bg-red-700 text-white',
      };
    case 'error':
    default:
      return {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        icon: 'text-red-500 dark:text-red-400',
        title: 'text-red-800 dark:text-red-200',
        button: 'bg-red-600 hover:bg-red-700 text-white',
      };
  }
}

/**
 * ErrorDisplay Component
 *
 * Displays user-friendly error messages with optional actions.
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'error',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  details,
  inline = false,
  onDismiss,
  icon,
}) => {
  const classes = getTypeClasses(type);
  const IconComponent = getIcon(type);

  const containerClasses = inline
    ? `${classes.container} rounded-md p-3 border`
    : `${classes.container} rounded-lg p-4 border shadow-sm`;

  return (
    <div className={containerClasses} role="alert">
      <div className="flex">
        {/* Icon */}
        <div className="flex-shrink-0">
          {icon || <IconComponent className={`h-5 w-5 ${classes.icon}`} />}
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${classes.title}`}>{title}</h3>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{message}</p>

          {/* Details (for development) */}
          {details && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                Technical details
              </summary>
              <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {details}
              </pre>
            </details>
          )}

          {/* Actions */}
          {(actionLabel || secondaryActionLabel) && (
            <div className="mt-3 flex gap-2">
              {actionLabel && onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${classes.button}`}
                >
                  {actionLabel}
                </button>
              )}
              {secondaryActionLabel && onSecondaryAction && (
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  {secondaryActionLabel}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <span className="sr-only">Dismiss</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Error code to user-friendly message mapping
 * Based on design.md Error Handling section
 */
export interface ErrorInfo {
  type: ErrorType;
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: 'retry' | 'login' | 'terminal' | 'refresh' | 'dismiss';
}

export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // CLI not authenticated
  CLAUDE_LOGIN_REQUIRED: {
    type: 'error',
    title: 'Claude CLI Not Authenticated',
    message: 'The Claude CLI is not authenticated. Please run `claude login` in your terminal to authenticate.',
    actionLabel: 'I\'ve logged in',
    actionType: 'retry',
  },
  // Terms required
  CLAUDE_TERMS_REQUIRED: {
    type: 'warning',
    title: 'Terms Update Required',
    message: 'Anthropic requires you to accept updated terms. Please run `claude` in your terminal and accept the terms.',
    actionLabel: 'I\'ve accepted',
    actionType: 'retry',
  },
  // WebSocket disconnect
  WEBSOCKET_DISCONNECT: {
    type: 'warning',
    title: 'Connection Lost',
    message: 'Lost connection to the server. Attempting to reconnect...',
    actionLabel: 'Reconnect Now',
    actionType: 'retry',
  },
  // Timeout
  CLI_TIMEOUT: {
    type: 'error',
    title: 'Request Timed Out',
    message: 'The request took too long to complete. Try a shorter message or break your task into smaller parts.',
    actionLabel: 'Try Again',
    actionType: 'retry',
  },
  // Token limit warning
  TOKEN_LIMIT_WARNING: {
    type: 'warning',
    title: 'Context Limit Approaching',
    message: 'You are approaching the token limit for this session. Consider starting a new session to avoid hitting the limit.',
    actionLabel: 'Start New Session',
    actionType: 'refresh',
  },
  // Invalid JWT
  INVALID_JWT: {
    type: 'error',
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    actionLabel: 'Log In',
    actionType: 'login',
  },
  // Project path conflict
  PROJECT_PATH_CONFLICT: {
    type: 'error',
    title: 'Project Already Exists',
    message: 'This directory is already registered as a project. Please select a different directory.',
    actionLabel: 'Choose Different Directory',
    actionType: 'dismiss',
  },
  // Generic errors
  INTERNAL_ERROR: {
    type: 'error',
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
    actionType: 'retry',
  },
  NETWORK_ERROR: {
    type: 'error',
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    actionLabel: 'Retry',
    actionType: 'retry',
  },
  SESSION_BUSY: {
    type: 'info',
    title: 'Request In Progress',
    message: 'Another request is already in progress. Please wait for it to complete or cancel it.',
    actionLabel: 'Cancel Current',
    actionType: 'dismiss',
  },
  PROJECT_NOT_FOUND: {
    type: 'error',
    title: 'Project Not Found',
    message: 'The requested project could not be found. It may have been deleted.',
    actionLabel: 'Go to Projects',
    actionType: 'dismiss',
  },
  AGENT_NOT_FOUND: {
    type: 'error',
    title: 'Agent Not Found',
    message: 'The requested agent could not be found. It may have been deleted.',
    actionLabel: 'Go to Agents',
    actionType: 'dismiss',
  },
};

/**
 * Get error info for a given error code
 */
export function getErrorInfo(code: string): ErrorInfo {
  return ERROR_MESSAGES[code] || {
    type: 'error',
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
    actionType: 'retry',
  };
}

/**
 * ConnectionStatus Component
 *
 * Displays WebSocket connection status with reconnection info
 */
interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  reconnectAttempt?: number;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  reconnectAttempt = 0,
  onReconnect,
}) => {
  if (status === 'connected') {
    return null; // Don't show anything when connected
  }

  const getMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (attempt ${reconnectAttempt})`;
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown status';
    }
  };

  const isReconnecting = status === 'reconnecting' || status === 'connecting';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
        {isReconnecting && (
          <svg
            className="animate-spin h-4 w-4"
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
        )}
        {!isReconnecting && <WifiOffIcon className="h-4 w-4" />}
        <span>{getMessage()}</span>
        {status === 'disconnected' && onReconnect && (
          <button
            onClick={onReconnect}
            className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700 rounded transition-colors"
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * TokenWarningBanner Component
 *
 * Displays token limit warning banner
 */
interface TokenWarningBannerProps {
  totalTokens: number;
  threshold: number;
  onStartNewSession?: () => void;
  onDismiss?: () => void;
}

export const TokenWarningBanner: React.FC<TokenWarningBannerProps> = ({
  totalTokens,
  threshold,
  onStartNewSession,
  onDismiss,
}) => {
  const percentage = Math.min(100, (totalTokens / threshold) * 100);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <WarningIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Context Limit Approaching
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            You&apos;ve used approximately {Math.round(totalTokens / 1000)}K tokens ({Math.round(percentage)}% of the limit).
            Consider starting a new session to avoid hitting the limit.
          </p>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {onStartNewSession && (
              <button
                onClick={onStartNewSession}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
              >
                Start New Session
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded-md transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ErrorModal Component
 *
 * Full-screen modal for critical errors that require user attention
 */
interface ErrorModalProps {
  open: boolean;
  type?: ErrorType | undefined;
  title: string;
  message: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  secondaryActionLabel?: string | undefined;
  onSecondaryAction?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  open,
  type = 'error',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onClose,
}) => {
  if (!open) return null;

  const classes = getTypeClasses(type);
  const IconComponent = getIcon(type);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            <div className={`rounded-full p-3 ${classes.container} mb-4`}>
              <IconComponent className={`h-8 w-8 ${classes.icon}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              {actionLabel && onAction && (
                <button
                  onClick={onAction}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${classes.button}`}
                >
                  {actionLabel}
                </button>
              )}
              {secondaryActionLabel && onSecondaryAction && (
                <button
                  onClick={onSecondaryAction}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  {secondaryActionLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * InlineError Component
 *
 * Small inline error display for form fields or minor errors
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => (
  <p className={`text-sm text-red-600 dark:text-red-400 mt-1 ${className}`} role="alert">
    {message}
  </p>
);

/**
 * Toast-style error notification hook/component would go here
 * For now, we use the ErrorDisplay component for all error displays
 */

export default ErrorDisplay;
