import { AppRouter } from './router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectionStatus } from './components/ErrorDisplay';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuthStore } from './store/authStore';

/**
 * AppContent - Main application content with WebSocket connection status
 *
 * This component displays the connection status banner and main router content.
 * It's separated from App to allow ErrorBoundary to wrap it.
 */
function AppContent() {
  const { status, reconnectAttempt, reconnect } = useWebSocket();
  const { token } = useAuthStore();

  return (
    <>
      {/* Show connection status only when authenticated */}
      {token && (
        <ConnectionStatus
          status={status}
          reconnectAttempt={reconnectAttempt}
          onReconnect={reconnect}
        />
      )}
      <AppRouter />
    </>
  );
}

/**
 * App - Root application component
 *
 * This component serves as the root of the React application.
 * It wraps the entire app in an ErrorBoundary to catch any unhandled
 * JavaScript errors and display a user-friendly fallback UI.
 *
 * Features:
 * - Global error boundary for crash prevention
 * - WebSocket connection status display
 * - Centralized error logging
 */
function App() {
  /**
   * Handle errors caught by the error boundary
   * In production, this could send errors to a monitoring service
   */
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error with context for debugging
    console.error('[App] Unhandled error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to send this to an error tracking service
    // e.g., Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  };

  return (
    <ErrorBoundary onError={handleError} showRetry>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
