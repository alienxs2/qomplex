import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Agent } from '@shared/types';
import { useAgentStore } from '../store/agentStore';
import { api } from '../lib/api';

/**
 * Maximum characters allowed for system prompt
 */
const MAX_SYSTEM_PROMPT_LENGTH = 10000;

/**
 * Directory entry from file browser API
 */
interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

/**
 * Response from GET /api/browse endpoint
 */
interface BrowseResponse {
  entries: FileEntry[];
  currentPath: string;
  parentPath: string | null;
}

/**
 * AgentSettingsPanel Props following design.md interface
 */
interface AgentSettingsPanelProps {
  agent: Agent;
  onSave: (updates: Partial<Agent>) => void;
  onClose: () => void;
}

/**
 * AgentSettingsPanel - Component for editing agent configuration
 *
 * Features:
 * - Slide-in panel with form fields
 * - Name input field
 * - System prompt textarea with character counter (max 10000)
 * - Linked MD files list with add/remove functionality
 * - File picker for adding MD files
 * - Save and Cancel buttons
 * - Unsaved changes warning on cancel
 * - Disabled save button while saving
 * - Validation for system_prompt length
 *
 * Requirements: REQ-3 (Agent settings with editable name, prompt, linked files)
 *
 * @param agent - The agent to edit
 * @param onSave - Callback when save is clicked with updates
 * @param onClose - Callback when panel should close
 */
export function AgentSettingsPanel({
  agent,
  onSave,
  onClose,
}: AgentSettingsPanelProps) {
  // Form state
  const [name, setName] = useState(agent.name);
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt);
  const [linkedMdFiles, setLinkedMdFiles] = useState<string[]>(
    agent.linked_md_files || []
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Get updateAgent from store
  const updateAgent = useAgentStore((state) => state.updateAgent);

  /**
   * Reset form when agent changes
   */
  useEffect(() => {
    setName(agent.name);
    setSystemPrompt(agent.system_prompt);
    setLinkedMdFiles(agent.linked_md_files || []);
    setError(null);
  }, [agent]);

  /**
   * Check if form has unsaved changes
   */
  const hasUnsavedChanges = useMemo(() => {
    const originalFiles = agent.linked_md_files || [];
    const currentFiles = linkedMdFiles;

    // Check if arrays are different
    const filesChanged =
      originalFiles.length !== currentFiles.length ||
      originalFiles.some((file, index) => file !== currentFiles[index]);

    return (
      name !== agent.name ||
      systemPrompt !== agent.system_prompt ||
      filesChanged
    );
  }, [name, systemPrompt, linkedMdFiles, agent]);

  /**
   * Validate system prompt length
   */
  const isSystemPromptValid = systemPrompt.length <= MAX_SYSTEM_PROMPT_LENGTH;

  /**
   * Validate form
   */
  const isFormValid = name.trim().length > 0 && isSystemPromptValid;

  /**
   * Character count for system prompt
   */
  const charCount = systemPrompt.length;
  const charCountColor =
    charCount > MAX_SYSTEM_PROMPT_LENGTH
      ? 'text-red-500'
      : charCount > MAX_SYSTEM_PROMPT_LENGTH * 0.9
        ? 'text-yellow-500'
        : 'text-gray-400';

  /**
   * Handle save button click
   */
  const handleSave = useCallback(async () => {
    if (!isFormValid || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateAgent(agent.id, {
        name: name.trim(),
        system_prompt: systemPrompt,
        linked_md_files: linkedMdFiles,
      });

      onSave({
        name: name.trim(),
        system_prompt: systemPrompt,
        linked_md_files: linkedMdFiles,
      });

      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save agent settings';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    isFormValid,
    isSaving,
    updateAgent,
    agent.id,
    name,
    systemPrompt,
    linkedMdFiles,
    onSave,
    onClose,
  ]);

  /**
   * Handle cancel button click
   */
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  /**
   * Confirm cancel with unsaved changes
   */
  const handleConfirmCancel = useCallback(() => {
    setShowUnsavedWarning(false);
    onClose();
  }, [onClose]);

  /**
   * Dismiss unsaved changes warning
   */
  const handleDismissWarning = useCallback(() => {
    setShowUnsavedWarning(false);
  }, []);

  /**
   * Remove a linked MD file
   */
  const handleRemoveFile = useCallback((filePath: string) => {
    setLinkedMdFiles((prev) => prev.filter((f) => f !== filePath));
  }, []);

  /**
   * Add a linked MD file from file picker
   */
  const handleAddFile = useCallback((filePath: string) => {
    setLinkedMdFiles((prev) => {
      // Don't add duplicates
      if (prev.includes(filePath)) return prev;
      return [...prev, filePath];
    });
    setShowFilePicker(false);
  }, []);

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  /**
   * Handle escape key to close
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFilePicker) {
          setShowFilePicker(false);
        } else if (showUnsavedWarning) {
          setShowUnsavedWarning(false);
        } else {
          handleCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCancel, showFilePicker, showUnsavedWarning]);

  /**
   * Get filename from path
   */
  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  return (
    <>
      {/* Panel Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleBackdropClick}
        role="presentation"
      />

      {/* Slide-in Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2
            id="agent-settings-title"
            className="text-lg font-semibold text-gray-900"
          >
            Agent Settings
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close settings"
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
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label
              htmlFor="agent-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name"
              className={`
                w-full px-3 py-2 border rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${name.trim().length === 0 ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={isSaving}
            />
            {name.trim().length === 0 && (
              <p className="mt-1 text-xs text-red-500">Name is required</p>
            )}
          </div>

          {/* System Prompt Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="system-prompt"
                className="block text-sm font-medium text-gray-700"
              >
                System Prompt
              </label>
              <span className={`text-xs ${charCountColor}`}>
                {charCount.toLocaleString()} / {MAX_SYSTEM_PROMPT_LENGTH.toLocaleString()}
              </span>
            </div>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter system prompt for this agent..."
              rows={8}
              className={`
                w-full px-3 py-2 border rounded-lg transition-colors resize-y min-h-[120px]
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${!isSystemPromptValid ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={isSaving}
            />
            {!isSystemPromptValid && (
              <p className="mt-1 text-xs text-red-500">
                System prompt exceeds maximum length of {MAX_SYSTEM_PROMPT_LENGTH.toLocaleString()} characters
              </p>
            )}
          </div>

          {/* Linked MD Files */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Linked Markdown Files
              </label>
              <button
                onClick={() => setShowFilePicker(true)}
                disabled={isSaving}
                className={`
                  flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${isSaving
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }
                `}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add File
              </button>
            </div>

            {/* File List */}
            {linkedMdFiles.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                <svg
                  className="w-8 h-8 text-gray-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm text-gray-500">No linked files</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add markdown files to provide context to the agent
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {linkedMdFiles.map((filePath) => (
                  <li
                    key={filePath}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* File Icon */}
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getFileName(filePath)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {filePath}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFile(filePath)}
                      disabled={isSaving}
                      className={`
                        p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px]
                        flex items-center justify-center flex-shrink-0
                        ${isSaving
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }
                      `}
                      aria-label={`Remove ${getFileName(filePath)}`}
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors min-h-[44px]
              ${isSaving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors min-h-[44px]
              flex items-center justify-center gap-2
              ${!isFormValid || isSaving
                ? 'bg-primary-300 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
              }
            `}
          >
            {isSaving && (
              <svg
                className="w-4 h-4 animate-spin"
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <UnsavedChangesModal
          onConfirm={handleConfirmCancel}
          onCancel={handleDismissWarning}
        />
      )}

      {/* File Picker Modal */}
      {showFilePicker && (
        <FilePicker
          onSelect={handleAddFile}
          onClose={() => setShowFilePicker(false)}
          existingFiles={linkedMdFiles}
        />
      )}
    </>
  );
}

/**
 * Unsaved Changes Warning Modal
 */
interface UnsavedChangesModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function UnsavedChangesModal({ onConfirm, onCancel }: UnsavedChangesModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-yellow-600"
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
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Unsaved Changes
            </h3>
            <p className="text-sm text-gray-500">
              You have unsaved changes that will be lost.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors min-h-[44px]"
          >
            Keep Editing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors min-h-[44px]"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * File Picker Modal for selecting MD files
 */
interface FilePickerProps {
  onSelect: (path: string) => void;
  onClose: () => void;
  existingFiles: string[];
}

function FilePicker({ onSelect, onClose, existingFiles }: FilePickerProps) {
  // Directory state
  const [currentPath, setCurrentPath] = useState<string>('/home');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch directory contents from backend
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
      // Show both directories and .md files
      setEntries(
        response.entries.filter(
          (entry) => entry.isDirectory || entry.name.endsWith('.md')
        )
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load directory';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load initial directory
   */
  useEffect(() => {
    fetchDirectory('/home');
  }, [fetchDirectory]);

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
   */
  const handleGoUp = useCallback(() => {
    if (parentPath && parentPath.startsWith('/home')) {
      fetchDirectory(parentPath);
    } else if (parentPath === '/') {
      fetchDirectory('/home');
    }
  }, [parentPath, fetchDirectory]);

  /**
   * Navigate to home
   */
  const handleGoHome = useCallback(() => {
    fetchDirectory('/home');
  }, [fetchDirectory]);

  /**
   * Handle entry click
   */
  const handleEntryClick = useCallback(
    (entry: FileEntry) => {
      if (entry.isDirectory) {
        handleNavigate(entry.path);
      } else {
        onSelect(entry.path);
      }
    },
    [handleNavigate, onSelect]
  );

  /**
   * Build breadcrumbs
   */
  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];

    const relativePath = currentPath.replace(/^\/home\/?/, '');
    if (!relativePath) return [];

    const parts = relativePath.split('/').filter(Boolean);
    return parts.map((part, index) => ({
      name: part,
      path: '/home/' + parts.slice(0, index + 1).join('/'),
    }));
  }, [currentPath]);

  const canGoUp = parentPath && parentPath.startsWith('/home');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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
                p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px]
                flex items-center justify-center
                ${canGoUp && !isLoading
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
                p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px]
                flex items-center justify-center
                ${!isLoading
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

          <h2 className="font-semibold text-gray-900">Select Markdown File</h2>

          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] flex items-center"
          >
            Cancel
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          <nav
            className="flex items-center gap-1 text-sm whitespace-nowrap"
            aria-label="Breadcrumb"
          >
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
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

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
              <svg
                className="w-8 h-8 text-red-500 mb-2"
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
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                onClick={() => fetchDirectory(currentPath)}
                className="px-4 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-500">No markdown files found</p>
            </div>
          )}

          {/* File/Directory List */}
          {!isLoading && !error && entries.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const isAlreadyAdded = existingFiles.includes(entry.path);

                return (
                  <li key={entry.path}>
                    <button
                      onClick={() => handleEntryClick(entry)}
                      disabled={isAlreadyAdded}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left min-h-[44px]
                        transition-colors
                        ${isAlreadyAdded
                          ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      {/* Icon */}
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                          ${entry.isDirectory ? 'bg-primary-100' : 'bg-blue-100'}
                        `}
                      >
                        {entry.isDirectory ? (
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
                        ) : (
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Name and Path */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {entry.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {entry.path}
                        </p>
                      </div>

                      {/* Indicators */}
                      {isAlreadyAdded ? (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          Already added
                        </span>
                      ) : entry.isDirectory ? (
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
                      ) : (
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Click on a markdown file to add it, or navigate into folders
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgentSettingsPanel;
