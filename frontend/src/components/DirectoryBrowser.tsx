import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Directory entry returned from the backend API
 */
interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

/**
 * Response from GET /api/browse endpoint
 */
interface BrowseResponse {
  entries: DirectoryEntry[];
  currentPath: string;
  parentPath: string | null;
}

/**
 * DirectoryBrowser Props following design.md interface
 */
interface DirectoryBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

/**
 * DirectoryBrowser - Modal for browsing server filesystem
 *
 * Features:
 * - Modal overlay with click-outside to close
 * - Breadcrumb navigation showing current path
 * - Directory list with folder icons (directories only, no files)
 * - "Select This Directory" button for current path
 * - Navigation controls (back, home)
 * - Starts at /home
 * - Mobile-friendly with 44px touch targets
 * - Loading state during navigation
 * - Prevents navigation above /home
 *
 * Requirements: REQ-2 (DirectoryBrowser modal with breadcrumb navigation)
 *
 * @param open - Whether the modal is visible
 * @param onClose - Callback when modal should close
 * @param onSelect - Callback with selected directory path
 */
export function DirectoryBrowser({
  open,
  onClose,
  onSelect,
}: DirectoryBrowserProps) {
  // Directory state
  const [currentPath, setCurrentPath] = useState<string>('/home');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch directory contents from backend
   * @param path - Path to browse (defaults to /home)
   */
  const fetchDirectory = useCallback(async (path: string = '/home') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<BrowseResponse>(
        `/browse?path=${encodeURIComponent(path)}`
      );

      setCurrentPath(response.currentPath);
      setParentPath(response.parentPath);
      // Filter to only show directories
      setEntries(response.entries.filter((entry) => entry.isDirectory));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load directory';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load initial directory when modal opens
   */
  useEffect(() => {
    if (open) {
      // Reset to /home on open
      fetchDirectory('/home');
    }
  }, [open, fetchDirectory]);

  /**
   * Navigate to a directory
   */
  const handleNavigate = useCallback(
    (path: string) => {
      fetchDirectory(path);
    },
    [fetchDirectory]
  );

  /**
   * Navigate to parent directory
   * Prevent navigation above /home
   */
  const handleGoUp = useCallback(() => {
    if (parentPath && parentPath.startsWith('/home')) {
      fetchDirectory(parentPath);
    } else if (parentPath === '/') {
      // Don't navigate above /home, stay at /home
      fetchDirectory('/home');
    }
  }, [parentPath, fetchDirectory]);

  /**
   * Navigate to home (/home)
   */
  const handleGoHome = useCallback(() => {
    fetchDirectory('/home');
  }, [fetchDirectory]);

  /**
   * Select current directory and close modal
   */
  const handleSelectCurrent = useCallback(() => {
    onSelect(currentPath);
    onClose();
  }, [currentPath, onSelect, onClose]);

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle escape key to close
   */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  /**
   * Build breadcrumb segments from current path
   * Only show parts after /home
   */
  const getBreadcrumbs = useCallback(() => {
    if (!currentPath) return [];

    // Remove leading /home and split
    const relativePath = currentPath.replace(/^\/home\/?/, '');
    if (!relativePath) return [];

    const parts = relativePath.split('/').filter(Boolean);
    return parts.map((part, index) => ({
      name: part,
      path: '/home/' + parts.slice(0, index + 1).join('/'),
    }));
  }, [currentPath]);

  /**
   * Check if we can navigate up (not at /home)
   */
  const canGoUp = parentPath && parentPath.startsWith('/home');

  // Don't render if not open
  if (!open) return null;

  const breadcrumbs = getBreadcrumbs();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="directory-browser-title"
    >
      {/* Modal Container */}
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {/* Back Button */}
            <button
              onClick={handleGoUp}
              disabled={!canGoUp || isLoading}
              className={`
                p-2 rounded-lg transition-colors min-w-touch min-h-touch
                flex items-center justify-center
                ${
                  canGoUp && !isLoading
                    ? 'hover:bg-gray-200 text-gray-600'
                    : 'text-gray-300 cursor-not-allowed'
                }
              `}
              aria-label="Go to parent directory"
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>

            {/* Home Button */}
            <button
              onClick={handleGoHome}
              disabled={isLoading}
              className={`
                p-2 rounded-lg transition-colors min-w-touch min-h-touch
                flex items-center justify-center
                ${
                  !isLoading
                    ? 'hover:bg-gray-200 text-gray-600'
                    : 'text-gray-300 cursor-not-allowed'
                }
              `}
              aria-label="Go to home directory"
            >
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>
          </div>

          <h2
            id="directory-browser-title"
            className="font-semibold text-gray-900"
          >
            Select Directory
          </h2>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors min-h-touch flex items-center"
          >
            Cancel
          </button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <nav
            className="flex items-center gap-1 text-sm whitespace-nowrap"
            aria-label="Breadcrumb"
          >
            {/* Home root */}
            <button
              onClick={handleGoHome}
              disabled={isLoading}
              className={`
                text-gray-500 hover:text-primary-600 transition-colors
                ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              /home
            </button>

            {/* Path segments */}
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.path} className="flex items-center gap-1">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => handleNavigate(crumb.path)}
                  disabled={isLoading}
                  className={`
                    text-gray-500 hover:text-primary-600 transition-colors
                    truncate max-w-[120px]
                    ${index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}
                    ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                  title={crumb.path}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        {/* Directory Contents */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <svg
                className="w-8 h-8 text-primary-500 animate-spin"
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
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
              <svg
                className="w-8 h-8 text-error mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-error mb-3">{error}</p>
              <button
                onClick={() => fetchDirectory(currentPath)}
                className="px-4 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
              <svg
                className="w-8 h-8 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-500">No subdirectories</p>
            </div>
          )}

          {/* Directory List */}
          {!isLoading && !error && entries.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <li key={entry.path}>
                  <button
                    onClick={() => handleNavigate(entry.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left min-h-touch"
                  >
                    {/* Folder Icon */}
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Directory Name */}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.name}
                      </p>
                      {/* Full Path */}
                      <p className="text-xs text-gray-400 truncate">
                        {entry.path}
                      </p>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer - Select Button */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleSelectCurrent}
            disabled={isLoading || !!error}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors
              flex items-center justify-center gap-2 min-h-touch
              ${
                isLoading || error
                  ? 'bg-primary-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }
            `}
          >
            {/* Checkmark Icon */}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Select This Directory
          </button>

          {/* Current Path Display */}
          <p className="mt-2 text-xs text-gray-500 text-center truncate">
            {currentPath}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DirectoryBrowser;
