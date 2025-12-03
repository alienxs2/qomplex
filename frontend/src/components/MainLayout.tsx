import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { Project } from '@shared/types';
import { useProjectStore } from '../store/projectStore';
import { useAgentStore } from '../store/agentStore';
import { useTabStore } from '../store/tabStore';
import { ProjectSelector } from './ProjectSelector';
import { MobileTabSwitcher } from './MobileTabSwitcher';
import { ReconnectingBanner, ConnectionStatus } from './Skeleton';
import type { ConnectionStatus as ConnectionStatusType } from '../hooks/useWebSocket';

/**
 * Mobile view states for navigation
 * - 'agent-list': Shows agent list (sidebar content)
 * - 'chat': Shows active chat panel
 * - 'doc': Shows document viewer
 */
type MobileView = 'agent-list' | 'chat' | 'doc';

/**
 * Swipe gesture configuration
 */
const SWIPE_THRESHOLD = 50; // Minimum pixels to trigger swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger swipe
const VERTICAL_THRESHOLD = 30; // Max vertical movement to consider horizontal swipe

/**
 * MainLayout Props following design.md interface
 */
interface MainLayoutProps {
  children: React.ReactNode;
  /** WebSocket connection status for showing reconnecting indicator */
  connectionStatus?: ConnectionStatusType;
  /** Current reconnect attempt number */
  reconnectAttempt?: number;
  /** Callback to manually trigger reconnection */
  onReconnect?: () => void;
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
export function MainLayout({
  children,
  connectionStatus = 'connected',
  reconnectAttempt = 0,
  onReconnect,
}: MainLayoutProps) {
  // Mobile view state - 'agent-list' shows list, 'chat' shows content, 'doc' shows document
  const [mobileView, setMobileView] = useState<MobileView>('agent-list');

  // Determine if we should show the reconnecting banner
  const showReconnectingBanner = connectionStatus === 'reconnecting' || connectionStatus === 'connecting';

  // Track if we're in desktop mode for conditional rendering
  const [isDesktop, setIsDesktop] = useState(false);

  // Tab switcher modal state
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);

  // Store access
  const { projects, currentProject, setCurrentProject, createProject, isLoading: projectsLoading } = useProjectStore();
  const { agents, currentAgent, setCurrentAgent } = useAgentStore();
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

  // Swipe gesture tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // Scroll position preservation for each tab
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const contentScrollRef = useRef<HTMLDivElement>(null);

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
   * Save scroll position before switching tabs
   */
  const saveScrollPosition = useCallback(() => {
    if (contentScrollRef.current && activeTabId) {
      scrollPositionsRef.current.set(activeTabId, contentScrollRef.current.scrollTop);
    }
  }, [activeTabId]);

  /**
   * Restore scroll position when switching to a tab
   */
  const restoreScrollPosition = useCallback((tabId: string) => {
    if (contentScrollRef.current) {
      const savedPosition = scrollPositionsRef.current.get(tabId) || 0;
      // Use requestAnimationFrame for smooth scroll restoration
      requestAnimationFrame(() => {
        if (contentScrollRef.current) {
          contentScrollRef.current.scrollTop = savedPosition;
        }
      });
    }
  }, []);

  /**
   * Handle touch start for swipe detection
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only track swipes on mobile in chat/doc view
    if (isDesktop || mobileView === 'agent-list') return;

    const touch = e.touches[0];
    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    isSwipingRef.current = false;
  }, [isDesktop, mobileView]);

  /**
   * Handle touch move for swipe detection
   * Prevents accidental swipes during vertical scrolling
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isDesktop || mobileView === 'agent-list') return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // If vertical movement exceeds threshold, cancel swipe detection
    if (deltaY > VERTICAL_THRESHOLD) {
      touchStartRef.current = null;
      return;
    }

    // If horizontal movement exceeds threshold, we're swiping
    if (Math.abs(deltaX) > SWIPE_THRESHOLD / 2) {
      isSwipingRef.current = true;
    }
  }, [isDesktop, mobileView]);

  /**
   * Handle touch end for swipe completion
   * Switches between open tabs based on swipe direction
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isDesktop || mobileView === 'agent-list') {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) {
      touchStartRef.current = null;
      return;
    }

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    touchStartRef.current = null;

    // Ignore if vertical movement was too large (user was scrolling)
    if (deltaY > VERTICAL_THRESHOLD) {
      return;
    }

    // Check if swipe meets threshold requirements
    const isValidSwipe =
      (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) &&
      isSwipingRef.current;

    if (!isValidSwipe || tabs.length < 2) return;

    // Find current tab index
    const currentTabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (currentTabIndex === -1) return;

    // Save current scroll position before switching
    saveScrollPosition();

    if (deltaX > 0) {
      // Swipe right - go to previous tab
      const prevIndex = currentTabIndex > 0 ? currentTabIndex - 1 : tabs.length - 1;
      const prevTab = tabs[prevIndex];
      if (prevTab) {
        setActiveTab(prevTab.id);
        // Update view based on tab type
        setMobileView(prevTab.type === 'doc' ? 'doc' : 'chat');
        restoreScrollPosition(prevTab.id);
      }
    } else {
      // Swipe left - go to next tab
      const nextIndex = currentTabIndex < tabs.length - 1 ? currentTabIndex + 1 : 0;
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        setActiveTab(nextTab.id);
        // Update view based on tab type
        setMobileView(nextTab.type === 'doc' ? 'doc' : 'chat');
        restoreScrollPosition(nextTab.id);
      }
    }

    isSwipingRef.current = false;
  }, [isDesktop, mobileView, tabs, activeTabId, setActiveTab, saveScrollPosition, restoreScrollPosition]);

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
   * Saves scroll position before navigating
   */
  const handleMobileBack = useCallback(() => {
    saveScrollPosition();
    setMobileView('agent-list');
  }, [saveScrollPosition]);

  /**
   * Handle tab switcher open
   */
  const handleOpenTabSwitcher = useCallback(() => {
    setIsTabSwitcherOpen(true);
  }, []);

  /**
   * Handle tab switcher close
   */
  const handleCloseTabSwitcher = useCallback(() => {
    setIsTabSwitcherOpen(false);
  }, []);

  /**
   * Handle tab selection from MobileTabSwitcher
   */
  const handleSelectTab = useCallback((tabId: string) => {
    saveScrollPosition();
    setActiveTab(tabId);

    // Find the tab to determine which view to show
    const selectedTab = tabs.find(t => t.id === tabId);
    if (selectedTab) {
      setMobileView(selectedTab.type === 'doc' ? 'doc' : 'chat');
      restoreScrollPosition(tabId);
    }

    setIsTabSwitcherOpen(false);
  }, [tabs, setActiveTab, saveScrollPosition, restoreScrollPosition]);

  /**
   * Handle tab close from MobileTabSwitcher
   */
  const handleCloseTab = useCallback((tabId: string) => {
    closeTab(tabId);

    // If closing the last tab, return to agent list
    if (tabs.length <= 1) {
      setMobileView('agent-list');
    }
  }, [tabs.length, closeTab]);

  /**
   * Get the current project name for display
   */
  const projectName = currentProject?.name || 'Select Project';

  /**
   * Get the current agent name for mobile header
   */
  const currentAgentName = currentAgent?.name || 'Chat';

  /**
   * Handle project selection from ProjectSelector
   */
  const handleProjectSelect = useCallback((project: Project) => {
    setCurrentProject(project);
  }, [setCurrentProject]);

  /**
   * Render the sidebar header with ProjectSelector component
   * Integrated DirectoryBrowser for new project creation (task 6.2)
   */
  const renderSidebarHeader = () => (
    <div className="p-4">
      <ProjectSelector
        projects={projects}
        currentProject={currentProject}
        onSelect={handleProjectSelect}
        onCreateProject={createProject}
        isLoading={projectsLoading}
      />
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
   * Get display title for mobile header based on current view and active tab
   */
  const getMobileTitle = useCallback(() => {
    if (mobileView === 'agent-list') return 'Agents';

    // Try to get title from active tab
    if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) return activeTab.title;
    }

    return currentAgentName;
  }, [mobileView, activeTabId, tabs, currentAgentName]);

  /**
   * Render the mobile header
   */
  const renderMobileHeader = () => (
    <header className="flex-shrink-0 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center gap-2 px-3 py-2 min-h-[56px]">
        {/* Back button or menu - only show back when in chat/doc view */}
        {mobileView !== 'agent-list' ? (
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

        {/* Title - shows tab title in chat/doc view, "Agents" in list view */}
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 truncate">
            {getMobileTitle()}
          </h1>
          {mobileView !== 'agent-list' && currentAgent && (
            <p className="text-xs text-gray-500 truncate">
              {projectName}
            </p>
          )}
        </div>

        {/* Project selector button on mobile agent list view */}
        {mobileView === 'agent-list' && (
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

        {/* Tab switcher button when there are tabs and in chat/doc view */}
        {mobileView !== 'agent-list' && tabs.length > 0 && (
          <button
            onClick={handleOpenTabSwitcher}
            className="p-2 min-w-touch min-h-touch flex items-center justify-center relative"
            aria-label={`${tabs.length} open tab${tabs.length !== 1 ? 's' : ''}`}
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
            {tabs.length > 1 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {tabs.length}
              </span>
            )}
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

        {/* Connection status indicator - shows when not fully connected */}
        {connectionStatus !== 'connected' && (
          <ConnectionStatus
            status={connectionStatus}
            reconnectAttempt={reconnectAttempt}
          />
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
        {/* Reconnecting Banner - shown when WebSocket is reconnecting */}
        <ReconnectingBanner
          visible={showReconnectingBanner}
          attempt={reconnectAttempt}
          onReconnect={onReconnect}
        />

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
      {/* Reconnecting Banner - shown when WebSocket is reconnecting */}
      <ReconnectingBanner
        visible={showReconnectingBanner}
        attempt={reconnectAttempt}
        onReconnect={onReconnect}
      />

      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Content area - shows either agent list or chat/doc based on mobileView */}
      <div
        ref={swipeContainerRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Agent list view */}
        <div
          className={`
            absolute inset-0 flex flex-col bg-white
            transition-transform duration-200 ease-out
            ${mobileView === 'agent-list' ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-hidden={mobileView !== 'agent-list'}
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

        {/* Chat/Content view with swipe support */}
        <div
          ref={contentScrollRef}
          className={`
            absolute inset-0 flex flex-col bg-white
            transition-transform duration-200 ease-out
            ${mobileView !== 'agent-list' ? 'translate-x-0' : 'translate-x-full'}
          `}
          aria-hidden={mobileView === 'agent-list'}
          style={{
            // Use will-change for smoother 60fps animations
            willChange: 'transform',
          }}
        >
          {/* Swipe hint indicator - shows tab navigation is available */}
          {tabs.length > 1 && (
            <div className="absolute top-1/2 left-0 right-0 pointer-events-none z-10 flex justify-between px-1 -translate-y-1/2">
              {/* Left swipe hint */}
              <div className="w-1 h-12 bg-gradient-to-r from-gray-300 to-transparent rounded-r opacity-30" />
              {/* Right swipe hint */}
              <div className="w-1 h-12 bg-gradient-to-l from-gray-300 to-transparent rounded-l opacity-30" />
            </div>
          )}
          {children || renderEmptyState()}
        </div>
      </div>

      {/* Mobile Tab Switcher Modal */}
      <MobileTabSwitcher
        tabs={tabs}
        activeTabId={activeTabId || ''}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        isOpen={isTabSwitcherOpen}
        onClose={handleCloseTabSwitcher}
      />
    </div>
  );
}

export default MainLayout;
