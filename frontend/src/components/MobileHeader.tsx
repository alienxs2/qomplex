import { useCallback, useState } from 'react';
import { ChevronLeft, Settings, Layers } from 'lucide-react';
import { useTabStore } from '../store/tabStore';
import { useAgentStore } from '../store/agentStore';
import { MobileTabSwitcher } from './MobileTabSwitcher';

/**
 * MobileHeader - Navigation header for mobile layout
 *
 * Features:
 * - Fixed position at top (56px height max)
 * - Back button on left (navigates to agent list)
 * - Title in center (agent name or doc filename)
 * - Settings icon and tab count button on right
 * - Touch targets minimum 44px
 * - Hidden on desktop (only for mobile layout < 1024px)
 *
 * Following REQ-6: Mobile header with back button
 * Telegram-style header design
 */

interface MobileHeaderProps {
  /**
   * Callback when back button is pressed
   * Should navigate user back to agent list
   */
  onBack: () => void;
  /**
   * Callback when settings button is pressed
   * Should open agent settings panel
   */
  onSettings?: () => void;
  /**
   * Optional title override
   * If not provided, uses current agent name or active tab title
   */
  title?: string;
  /**
   * Optional subtitle (e.g., project name)
   */
  subtitle?: string;
  /**
   * Whether to show the back button
   * @default true
   */
  showBack?: boolean;
  /**
   * Whether to show the settings button
   * @default true
   */
  showSettings?: boolean;
  /**
   * Whether to show the tab count button
   * @default true
   */
  showTabCount?: boolean;
}

/**
 * MobileHeader Component
 *
 * Provides navigation header for mobile layout with:
 * - Back navigation to agent list
 * - Current context title (agent name/doc filename)
 * - Quick access to settings and tab switching
 */
export function MobileHeader({
  onBack,
  onSettings,
  title,
  subtitle,
  showBack = true,
  showSettings = true,
  showTabCount = true,
}: MobileHeaderProps) {
  // Store access for tab count and current agent
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const { currentAgent } = useAgentStore();

  // State for tab switcher modal
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState(false);

  /**
   * Get display title
   * Priority: prop title > active tab title > current agent name > default
   */
  const displayTitle = useCallback(() => {
    if (title) return title;

    // Try to get title from active tab
    if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        return activeTab.title;
      }
    }

    // Fall back to current agent name
    if (currentAgent) {
      return currentAgent.name;
    }

    return 'Chat';
  }, [title, activeTabId, tabs, currentAgent]);

  /**
   * Handle back button press
   */
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  /**
   * Handle settings button press
   */
  const handleSettings = useCallback(() => {
    onSettings?.();
  }, [onSettings]);

  /**
   * Handle tab count button press - opens tab switcher
   */
  const handleTabCountPress = useCallback(() => {
    setIsTabSwitcherOpen(true);
  }, []);

  /**
   * Handle tab switcher close
   */
  const handleTabSwitcherClose = useCallback(() => {
    setIsTabSwitcherOpen(false);
  }, []);

  /**
   * Handle tab selection from switcher
   */
  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setIsTabSwitcherOpen(false);
  }, [setActiveTab]);

  /**
   * Handle tab close from switcher
   */
  const handleCloseTab = useCallback((tabId: string) => {
    closeTab(tabId);
  }, [closeTab]);

  // Get tab count for display
  const tabCount = tabs.length;

  return (
    <>
      {/* Header - fixed at top, hidden on desktop (lg breakpoint = 1024px) */}
      <header
        className="
          fixed top-0 left-0 right-0 z-30
          bg-white border-b border-gray-200
          lg:hidden
          safe-area-top
        "
        role="banner"
      >
        <div
          className="
            flex items-center
            h-14 max-h-[56px]
            px-2
          "
        >
          {/* Left section - Back button */}
          <div className="flex-shrink-0">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="
                  flex items-center justify-center
                  min-w-[44px] min-h-[44px]
                  p-2 -ml-1
                  rounded-full
                  hover:bg-gray-100 active:bg-gray-200
                  transition-colors
                "
                aria-label="Back to agent list"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
            ) : (
              // Spacer when back button is hidden to maintain layout
              <div className="w-[44px]" />
            )}
          </div>

          {/* Center section - Title and subtitle */}
          <div className="flex-1 min-w-0 px-2">
            <div className="text-center">
              <h1
                className="
                  font-semibold text-gray-900
                  truncate text-base leading-tight
                "
              >
                {displayTitle()}
              </h1>
              {subtitle && (
                <p
                  className="
                    text-xs text-gray-500
                    truncate leading-tight
                  "
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right section - Settings and Tab count */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* Settings button */}
            {showSettings && onSettings && (
              <button
                type="button"
                onClick={handleSettings}
                className="
                  flex items-center justify-center
                  min-w-[44px] min-h-[44px]
                  p-2
                  rounded-full
                  hover:bg-gray-100 active:bg-gray-200
                  transition-colors
                "
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Tab count button */}
            {showTabCount && tabCount > 0 && (
              <button
                type="button"
                onClick={handleTabCountPress}
                className="
                  flex items-center justify-center
                  min-w-[44px] min-h-[44px]
                  p-2
                  rounded-full
                  hover:bg-gray-100 active:bg-gray-200
                  transition-colors
                  relative
                "
                aria-label={`${tabCount} open tab${tabCount !== 1 ? 's' : ''}`}
              >
                <Layers className="w-5 h-5 text-gray-600" />
                {/* Tab count badge */}
                {tabCount > 1 && (
                  <span
                    className="
                      absolute -top-0.5 -right-0.5
                      min-w-[18px] h-[18px]
                      bg-blue-500 text-white
                      text-xs font-medium
                      rounded-full
                      flex items-center justify-center
                      px-1
                    "
                  >
                    {tabCount > 99 ? '99+' : tabCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tab switcher modal */}
      <MobileTabSwitcher
        tabs={tabs}
        activeTabId={activeTabId || ''}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        isOpen={isTabSwitcherOpen}
        onClose={handleTabSwitcherClose}
      />

      {/* Spacer to prevent content from being hidden behind fixed header */}
      {/* Only render on mobile (hidden on lg breakpoint) */}
      <div className="h-14 flex-shrink-0 lg:hidden" aria-hidden="true" />
    </>
  );
}

export default MobileHeader;
