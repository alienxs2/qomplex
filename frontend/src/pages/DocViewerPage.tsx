import { useState, useEffect, useCallback, useRef } from 'react';
import { DocViewer } from '../components/DocViewer';
import { api } from '../lib/api';
import { useTabStore } from '../store/tabStore';

/**
 * Response from GET /api/files/read endpoint
 */
interface FileReadResponse {
  content: string;
  path: string;
  size: number;
}

/**
 * DocViewerPage Props
 */
interface DocViewerPageProps {
  /** File path to load and display */
  filePath: string;
  /** Optional callback when close button is clicked */
  onClose?: () => void;
}

/**
 * Content cache entry stored in component
 */
interface CachedContent {
  content: string;
  timestamp: number;
}

/**
 * Cache expiry time (5 minutes)
 */
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Maximum file size to load (1MB)
 * Larger files will show a warning
 */
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;

/**
 * DocViewerPage - Wrapper component for loading and displaying MD file content
 *
 * Features:
 * - Loads MD file content from /api/files/read endpoint
 * - Caches loaded content to avoid repeated fetches
 * - Shows loading skeleton while fetching
 * - Handles error states (file not found, network errors)
 * - Handles empty file state
 * - Handles large files gracefully with warnings
 * - Integrates with tab system for filename display
 *
 * Requirements: REQ-5 (View linked MD files in viewer tab)
 *
 * @param filePath - The file path to load
 * @param onClose - Optional callback for close button
 */
export function DocViewerPage({ filePath, onClose }: DocViewerPageProps) {
  // Content state
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLargeFile, setIsLargeFile] = useState(false);

  // Cache ref to persist across renders
  const contentCacheRef = useRef<Map<string, CachedContent>>(new Map());

  // Tab store for caching content in tab data
  const { getTabById } = useTabStore();

  /**
   * Extract filename from path for display
   */
  const filename = filePath.split('/').pop() || filePath;

  /**
   * Check if cached content is still valid
   */
  const isValidCache = useCallback((cached: CachedContent | undefined): boolean => {
    if (!cached) return false;
    const now = Date.now();
    return now - cached.timestamp < CACHE_EXPIRY_MS;
  }, []);

  /**
   * Get cached content if available and valid
   */
  const getCachedContent = useCallback((): string | null => {
    // First check component-level cache
    const cached = contentCacheRef.current.get(filePath);
    if (isValidCache(cached)) {
      return cached!.content;
    }

    // Then check tab store for cached content
    const tab = getTabById(`doc-${filePath}`);
    if (tab && 'content' in tab && typeof tab.content === 'string') {
      // Cache it locally too
      contentCacheRef.current.set(filePath, {
        content: tab.content,
        timestamp: Date.now(),
      });
      return tab.content;
    }

    return null;
  }, [filePath, isValidCache, getTabById]);

  /**
   * Cache content locally
   */
  const cacheContent = useCallback((content: string) => {
    contentCacheRef.current.set(filePath, {
      content,
      timestamp: Date.now(),
    });
  }, [filePath]);

  /**
   * Fetch file content from API
   */
  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsLargeFile(false);

    // Check cache first
    const cachedContent = getCachedContent();
    if (cachedContent !== null) {
      setContent(cachedContent);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<FileReadResponse>(
        `/files/read?path=${encodeURIComponent(filePath)}`
      );

      // Check file size
      if (response.size > MAX_FILE_SIZE_BYTES) {
        setIsLargeFile(true);
      }

      // Set content and cache it
      setContent(response.content);
      cacheContent(response.content);
    } catch (err) {
      // Handle different error types
      let errorMessage = 'Failed to load file';

      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('not found')) {
          errorMessage = 'File not found. The file may have been moved or deleted.';
        } else if (err.message.includes('403') || err.message.includes('permission')) {
          errorMessage = 'Permission denied. You do not have access to this file.';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filePath, getCachedContent, cacheContent]);

  /**
   * Fetch content when filePath changes
   */
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  /**
   * Handle retry button click
   */
  const handleRetry = useCallback(() => {
    // Clear cache for this file and refetch
    contentCacheRef.current.delete(filePath);
    fetchContent();
  }, [filePath, fetchContent]);

  // ==========================================================================
  // Loading State
  // ==========================================================================
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
          {onClose && (
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          )}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Title skeleton */}
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />

            {/* Paragraph skeletons */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
            </div>

            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2 mt-6" />

            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>

            {/* Code block skeleton */}
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse mt-4" />

            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Error State
  // ==========================================================================
  if (error) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
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
            <span className="font-medium text-gray-900 truncate" title={filePath}>
              {filename}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Close document"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
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
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load File
            </h2>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <p className="text-xs text-gray-400 mb-4 truncate" title={filePath}>
              {filePath}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Large File Warning (still show content but with warning)
  // ==========================================================================
  if (isLargeFile && content) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Warning banner */}
        <div className="flex-shrink-0 px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
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
            <span>
              Large file warning: This file is larger than 1MB. Scrolling may be slower.
            </span>
          </div>
        </div>

        {/* DocViewer with content */}
        <div className="flex-1 overflow-hidden">
          <DocViewer
            content={content}
            filename={filename}
            {...(onClose && { onClose })}
          />
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Normal Content State
  // ==========================================================================
  return (
    <DocViewer
      content={content || ''}
      filename={filename}
      {...(onClose && { onClose })}
    />
  );
}

export default DocViewerPage;
