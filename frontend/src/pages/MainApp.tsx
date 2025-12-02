import { useEffect } from 'react';
import { MainLayout } from '../components/MainLayout';
import { useProjectStore } from '../store/projectStore';
import { setupProjectAgentSync } from '../store/agentStore';

/**
 * MainApp - Main application component (lazy loaded)
 *
 * This is the entry point for authenticated users.
 * It contains the MainLayout with project selector, agent list, and chat panels.
 *
 * Features:
 * - Fetches projects on mount
 * - Sets up project-agent sync for automatic agent loading
 * - Responsive layout with mobile-first design
 */
export default function MainApp() {
  const { fetchProjects, isLoading, error } = useProjectStore();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Setup project-agent sync (fetches agents when project changes)
  useEffect(() => {
    const unsubscribe = setupProjectAgentSync();
    return () => unsubscribe();
  }, []);

  // Show error state if project loading fails
  if (error && !isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-error"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Projects
            </h2>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchProjects()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Main app with layout
  // Children will contain ChatPanel, DocViewer, etc. when those are implemented
  return (
    <MainLayout>
      {/* Content placeholder - will be replaced with ChatPanel/DocViewer in later phases */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Qomplex
          </h2>
          <p className="text-gray-600 mb-4">
            Web interface for Claude Code CLI
          </p>
          <p className="text-sm text-gray-400">
            Select a project and agent to start chatting
          </p>
          <p className="text-xs text-gray-400 mt-4">
            ChatPanel, DocViewer, and other components will be
            implemented in upcoming tasks.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
