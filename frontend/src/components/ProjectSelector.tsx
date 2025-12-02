import { useState, useRef, useEffect, useCallback } from 'react';
import type { Project } from '@shared/types';

/**
 * ProjectSelector Props following design.md interface
 */
interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onSelect: (project: Project) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

/**
 * ProjectSelector - Dropdown component for selecting active project
 *
 * Features:
 * - Shows current project name in trigger button (truncated with ellipsis)
 * - Dropdown lists all projects with path tooltips
 * - "New Project" option at bottom triggers callback
 * - Handles empty state when no projects exist
 * - Loading state while fetching projects
 * - Current project highlighted in dropdown
 * - Does not allow deselecting all projects
 *
 * Requirements: REQ-2 (Project Management)
 *
 * @param projects - Array of available projects
 * @param currentProject - Currently selected project (null if none)
 * @param onSelect - Callback when a project is selected
 * @param onAddNew - Callback when "New Project" is clicked
 * @param isLoading - Show loading state while fetching
 */
export function ProjectSelector({
  projects,
  currentProject,
  onSelect,
  onAddNew,
  isLoading = false,
}: ProjectSelectorProps) {
  // Dropdown open state
  const [isOpen, setIsOpen] = useState(false);

  // Ref for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Handle click outside to close dropdown
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Handle keyboard navigation and escape key
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  /**
   * Toggle dropdown open/closed
   */
  const handleToggle = useCallback(() => {
    if (!isLoading) {
      setIsOpen((prev) => !prev);
    }
  }, [isLoading]);

  /**
   * Handle project selection
   * Does not allow deselecting - always selects a project
   */
  const handleSelect = useCallback(
    (project: Project) => {
      onSelect(project);
      setIsOpen(false);
    },
    [onSelect]
  );

  /**
   * Handle "New Project" click
   */
  const handleAddNew = useCallback(() => {
    setIsOpen(false);
    onAddNew();
  }, [onAddNew]);

  /**
   * Get display name for current project
   */
  const displayName = currentProject?.name || 'Select Project';

  /**
   * Check if dropdown has any items to show
   */
  const hasProjects = projects.length > 0;

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          w-full flex items-center justify-between px-3 py-2
          bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors
          min-h-touch
          ${isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'bg-gray-100 ring-2 ring-primary-200' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current project: ${displayName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Folder Icon */}
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
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

          {/* Project Name - truncated */}
          <span
            className="font-medium text-gray-900 truncate"
            title={currentProject?.working_directory}
          >
            {isLoading ? 'Loading...' : displayName}
          </span>
        </div>

        {/* Chevron Icon */}
        {isLoading ? (
          <svg
            className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0"
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
        ) : (
          <svg
            className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
          aria-label="Select a project"
        >
          {/* Empty State */}
          {!hasProjects && (
            <div className="px-4 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
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
              </div>
              <p className="text-sm text-gray-600 mb-1">No projects yet</p>
              <p className="text-xs text-gray-400">
                Create a new project to get started
              </p>
            </div>
          )}

          {/* Project List */}
          {hasProjects && (
            <ul className="max-h-60 overflow-y-auto py-1">
              {projects.map((project) => {
                const isSelected = currentProject?.id === project.id;

                return (
                  <li key={project.id}>
                    <button
                      onClick={() => handleSelect(project)}
                      className={`
                        w-full flex items-start gap-3 px-4 py-3
                        text-left transition-colors
                        min-h-touch
                        ${
                          isSelected
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                      role="option"
                      aria-selected={isSelected}
                      title={project.working_directory}
                    >
                      {/* Folder Icon */}
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          isSelected ? 'text-primary-500' : 'text-gray-400'
                        }`}
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

                      <div className="flex-1 min-w-0">
                        {/* Project Name */}
                        <p
                          className={`font-medium truncate ${
                            isSelected ? 'text-primary-700' : 'text-gray-900'
                          }`}
                        >
                          {project.name}
                        </p>

                        {/* Path Tooltip (shown as subtitle) */}
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            isSelected ? 'text-primary-500' : 'text-gray-400'
                          }`}
                        >
                          {project.working_directory}
                        </p>
                      </div>

                      {/* Checkmark for selected */}
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-primary-500 flex-shrink-0"
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* New Project Button */}
          <button
            onClick={handleAddNew}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-touch"
          >
            {/* Plus Icon */}
            <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 text-primary-600"
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
            </div>

            <span className="font-medium text-primary-600">New Project</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectSelector;
