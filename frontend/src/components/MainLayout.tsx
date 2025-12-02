import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAgentStore } from '../store/agentStore';
import { useTabStore } from '../store/tabStore';

/**
 * Mobile view states for navigation
 * - 'agents': Shows agent list
 * - 'chat': Shows active chat/content panel
 */
type MobileView = 'agents' | 'chat';

/**
 * MainLayout Props following design.md interface
 */
interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Sidebar Props for the left panel
 */
interface SidebarProps {
  header?: ReactNode;
  children: ReactNode;
}

/**
 * Sidebar component - renders on desktop, hidden on mobile in chat view
 */
function Sidebar({ header, children }: SidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200">
      {header && (
        <div className="flex-shrink-0 border-b border-gray-200">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  );
}

/**
 * MainLayout - Responsive layout component following design.md specification
 *
 * Desktop (>=1024px): Shows sidebar (280px) with project selector and agent list,
 * plus main content area
 *
 * Mobile (<1024px): Full-screen views with navigation between agent list and content
 *
 * Features:
 * - Mobile-first design (mobile layout is default)
 * - No layout shift on resize (uses CSS media queries/Tailwind classes)
 * - Sidebar width fixed at 280px on desktop
 * - Smooth transitions between views on mobile
 *
 * @param children - Main content to render in the content area
 */
export function MainLayout({ children }: MainLayoutProps) {
  // Mobile view state - 'agents' shows list, 'chat' shows content
  const [mobileView, setMobileView] = useState<MobileView>('agents');

  // Track if we're in desktop mode for conditional rendering
  const [isDesktop, setIsDesktop] = useState(false);

  // Store access
  const { currentProject } = useProjectStore();
  const { agents, currentAgent, setCurrentAgent } = useAgentStore();
  const { tabs } = useTabStore();

  /**
   * Check and update desktop state based on window width
   * Uses 1024px breakpoint as per design.md REQ-6
   */
  const checkDesktop = useCallback(() => {
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  /**
   * Setup resize listener for responsive breakpoint detection
   * This ensures no layout shift as we use state + CSS together
   */
  useEffect(() => {
    // Initial check
    checkDesktop();

    // Listen for resize events
    window.addEventListener('resize', checkDesktop);

    // Cleanup
    return () => window.removeEventListener('resize', checkDesktop);
  }, [checkDesktop]);

  /**
   * Handle agent selection - switches to chat view on mobile
   */
  const handleAgentSelect = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setCurrentAgent(agent);
      // On mobile, switch to chat view when agent is selected
      if (!isDesktop) {
        setMobileView('chat');
      }
    }
  }, [agents, setCurrentAgent, isDesktop]);

  /**
   * Handle back navigation on mobile - returns to agent list
   */
  const handleMobileBack = useCallback(() => {
    setMobileView('agents');
  }, []);

  /**
   * Get the current project name for display
   */
  const projectName = currentProject?.name || 'Select Project';

  /**
   * Get the current agent name for mobile header
   */
  const currentAgentName = currentAgent?.name || 'Chat';

  /**
   * Render the sidebar header with project selector placeholder
   * ProjectSelector component will be created in task 5.3
   */
  const renderSidebarHeader = () => (
    <div className="p-4">
      <button
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors min-h-touch"
        aria-label="Select project"
      >
        <div className="flex items-center gap-2 min-w-0">
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
          <span className="font-medium text-gray-900 truncate">
            {projectName}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-gray-500 flex-shrink-0"
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
      </button>
    </div>
  );

  /**
   * Render the agent list placeholder
   * AgentList component will be created in task 5.5
   */
  const renderAgentList = () => (
    <div className="p-2">
      <h2 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Agents
      </h2>
      {agents.length === 0 ? (
        <div className="px-2 py-4 text-sm text-gray-500 text-center">
          {currentProject ? 'No agents yet' : 'Select a project'}
        </div>
      ) : (
        <ul className="space-y-1">
          {agents.map((agent) => (
            <li key={agent.id}>
              <button
                onClick={() => handleAgentSelect(agent.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  min-h-touch
                  ${currentAgent?.id === agent.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {agent.session_id ? 'Active session' : 'No session'}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  /**
   * Render the mobile header
   */
  const renderMobileHeader = () => (
    <header className="flex-shrink-0 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center gap-2 px-3 py-2 min-h-[56px]">
        {/* Back button or menu - only show back when in chat view */}
        {mobileView === 'chat' ? (
          <button
            onClick={handleMobileBack}
            className="p-2 -ml-2 min-w-touch min-h-touch flex items-center justify-center"
            aria-label="Back to agents"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        ) : (
          <button
            className="p-2 -ml-2 min-w-touch min-h-touch flex items-center justify-center"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Title - shows agent name in chat view, "Agents" in list view */}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 truncate">
            {mobileView === 'chat' ? currentAgentName : 'Agents'}
          </h1>
          {mobileView === 'chat' && currentAgent && (
            <p className="text-xs text-gray-500 truncate">
              {projectName}
            </p>
          )}
        </div>

        {/* Project selector button on mobile */}
        {mobileView === 'agents' && (
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors min-h-touch"
            aria-label="Select project"
          >
            <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
              {projectName}
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
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
          </button>
        )}

        {/* Tab switcher button when there are multiple tabs */}
        {mobileView === 'chat' && tabs.length > 1 && (
          <button
            className="p-2 min-w-touch min-h-touch flex items-center justify-center relative"
            aria-label="Switch tabs"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
              {tabs.length}
            </span>
          </button>
        )}
      </div>
    </header>
  );

  /**
   * Render the desktop header
   */
  const renderDesktopHeader = () => (
    <header className="flex-shrink-0 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-900">Qomplex</h1>

        {/* Show current agent/tab info */}
        {currentAgent && (
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">
                {currentAgent.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {currentAgent.name}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tab count indicator */}
        {tabs.length > 0 && (
          <div className="text-sm text-gray-500">
            {tabs.length} tab{tabs.length !== 1 ? 's' : ''} open
          </div>
        )}
      </div>
    </header>
  );

  /**
   * Render the empty state for main content
   */
  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {currentProject ? 'Select an Agent' : 'Select a Project'}
        </h2>
        <p className="text-gray-500 text-sm">
          {currentProject
            ? 'Choose an agent from the sidebar to start chatting'
            : 'Select a project to see available agents'}
        </p>
      </div>
    </div>
  );

  // ==========================================================================
  // DESKTOP LAYOUT (>=1024px)
  // ==========================================================================
  if (isDesktop) {
    return (
      <div className="h-full flex flex-col bg-gray-100">
        {/* Desktop Header */}
        {renderDesktopHeader()}

        {/* Main area with sidebar and content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - fixed 280px width */}
          <div className="w-[280px] flex-shrink-0">
            <Sidebar header={renderSidebarHeader()}>
              {renderAgentList()}
            </Sidebar>
          </div>

          {/* Main content area */}
          <main className="flex-1 flex flex-col min-w-0 bg-white">
            {children || renderEmptyState()}
          </main>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MOBILE LAYOUT (<1024px)
  // ==========================================================================
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Content area - shows either agent list or chat based on mobileView */}
      <div className="flex-1 overflow-hidden relative">
        {/* Agent list view */}
        <div
          className={`
            absolute inset-0 flex flex-col bg-white
            transition-transform duration-200 ease-out
            ${mobileView === 'agents' ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-hidden={mobileView !== 'agents'}
        >
          {/* Project selector at top on mobile */}
          <div className="flex-shrink-0 border-b border-gray-200">
            {renderSidebarHeader()}
          </div>
          {/* Agent list */}
          <div className="flex-1 overflow-y-auto">
            {renderAgentList()}
          </div>
        </div>

        {/* Chat/Content view */}
        <div
          className={`
            absolute inset-0 flex flex-col bg-white
            transition-transform duration-200 ease-out
            ${mobileView === 'chat' ? 'translate-x-0' : 'translate-x-full'}
          `}
          aria-hidden={mobileView !== 'chat'}
        >
          {children || renderEmptyState()}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
