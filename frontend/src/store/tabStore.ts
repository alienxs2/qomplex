import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TabData } from '@shared/types';

/**
 * Maximum number of open tabs allowed
 * Prevents memory issues with too many open tabs
 */
const MAX_OPEN_TABS = 10;

/**
 * TabState interface following design.md specification
 */
interface TabState {
  tabs: TabData[];
  activeTabId: string | null;

  // Actions
  openTab: (tab: TabData) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  getTabById: (id: string) => TabData | undefined;
  hasTab: (id: string) => boolean;
}

/**
 * useTabStore - Zustand store for tab state management
 *
 * Features:
 * - Manages open agent chat tabs and document tabs
 * - Limits open tabs to MAX_OPEN_TABS (10)
 * - Persists tab state in localStorage
 * - Supports both 'chat' and 'doc' tab types
 * - Handles tab switching and closing
 *
 * Tab types:
 * - 'chat': Agent chat tabs, identified by agentId
 * - 'doc': Document viewer tabs, identified by filePath
 */
export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      /**
       * Open a new tab or switch to existing tab
       * If tab with same ID exists, switches to it
       * If at max tabs, removes oldest tab (first in list)
       */
      openTab: (tab: TabData) => {
        set((state) => {
          // Check if tab already exists
          const existingTab = state.tabs.find((t) => t.id === tab.id);

          if (existingTab) {
            // Tab exists, just switch to it
            return {
              activeTabId: tab.id,
            };
          }

          // Check if we need to remove oldest tab to make room
          let updatedTabs = [...state.tabs];

          if (updatedTabs.length >= MAX_OPEN_TABS) {
            // Remove the oldest tab (first in list)
            // but not if it's the active tab
            const tabToRemoveIndex = updatedTabs.findIndex(
              (t) => t.id !== state.activeTabId
            );

            if (tabToRemoveIndex !== -1) {
              updatedTabs.splice(tabToRemoveIndex, 1);
            } else {
              // If all tabs are active (shouldn't happen), remove first
              updatedTabs.shift();
            }
          }

          // Add new tab and set as active
          return {
            tabs: [...updatedTabs, tab],
            activeTabId: tab.id,
          };
        });
      },

      /**
       * Close a tab by ID
       * If closing active tab, switches to previous tab or first available
       */
      closeTab: (id: string) => {
        set((state) => {
          const tabIndex = state.tabs.findIndex((t) => t.id === id);

          // Tab not found
          if (tabIndex === -1) {
            return state;
          }

          const updatedTabs = state.tabs.filter((t) => t.id !== id);

          // If closing active tab, determine new active tab
          let newActiveTabId = state.activeTabId;

          if (state.activeTabId === id) {
            if (updatedTabs.length === 0) {
              // No tabs left
              newActiveTabId = null;
            } else if (tabIndex > 0) {
              // Switch to previous tab
              const prevTab = updatedTabs[tabIndex - 1];
              newActiveTabId = prevTab ? prevTab.id : null;
            } else {
              // Switch to next tab (now at index 0)
              const firstTab = updatedTabs[0];
              newActiveTabId = firstTab ? firstTab.id : null;
            }
          }

          return {
            tabs: updatedTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      /**
       * Set the active tab by ID
       * Does nothing if tab doesn't exist
       */
      setActiveTab: (id: string) => {
        const { tabs } = get();
        const tabExists = tabs.some((t) => t.id === id);

        if (tabExists) {
          set({ activeTabId: id });
        }
      },

      /**
       * Close all tabs
       */
      closeAllTabs: () => {
        set({
          tabs: [],
          activeTabId: null,
        });
      },

      /**
       * Close all tabs except the specified one
       */
      closeOtherTabs: (id: string) => {
        set((state) => {
          const tabToKeep = state.tabs.find((t) => t.id === id);

          if (!tabToKeep) {
            return state;
          }

          return {
            tabs: [tabToKeep],
            activeTabId: id,
          };
        });
      },

      /**
       * Get a tab by ID
       */
      getTabById: (id: string) => {
        return get().tabs.find((t) => t.id === id);
      },

      /**
       * Check if a tab exists
       */
      hasTab: (id: string) => {
        return get().tabs.some((t) => t.id === id);
      },
    }),
    {
      name: 'qomplex-tabs',
      // Persist tabs and active tab
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);

/**
 * Helper function to create a chat tab for an agent
 */
export function createChatTab(agentId: string, agentName: string): TabData {
  return {
    id: `chat-${agentId}`,
    type: 'chat',
    title: agentName,
    agentId,
  };
}

/**
 * Helper function to create a document tab
 */
export function createDocTab(filePath: string): TabData {
  // Extract filename from path for title
  const filename = filePath.split('/').pop() || filePath;

  return {
    id: `doc-${filePath}`,
    type: 'doc',
    title: filename,
    filePath,
  };
}

/**
 * Helper function to get the active tab
 * Returns null if no active tab
 */
export function getActiveTab(): TabData | null {
  const { tabs, activeTabId } = useTabStore.getState();

  if (!activeTabId) {
    return null;
  }

  return tabs.find((t) => t.id === activeTabId) || null;
}

/**
 * Helper function to get the count of open tabs
 */
export function getTabCount(): number {
  return useTabStore.getState().tabs.length;
}

/**
 * Helper function to check if there are any open tabs
 */
export function hasTabs(): boolean {
  return useTabStore.getState().tabs.length > 0;
}

/**
 * Helper function to get all chat tabs
 */
export function getChatTabs(): TabData[] {
  return useTabStore.getState().tabs.filter((t) => t.type === 'chat');
}

/**
 * Helper function to get all document tabs
 */
export function getDocTabs(): TabData[] {
  return useTabStore.getState().tabs.filter((t) => t.type === 'doc');
}

/**
 * Helper function to check if a chat tab for an agent is open
 */
export function hasAgentChatTab(agentId: string): boolean {
  return useTabStore.getState().tabs.some(
    (t) => t.type === 'chat' && t.agentId === agentId
  );
}

/**
 * Helper function to check if a document tab is open
 */
export function hasDocTab(filePath: string): boolean {
  return useTabStore.getState().tabs.some(
    (t) => t.type === 'doc' && t.filePath === filePath
  );
}

/**
 * Helper function to open or switch to an agent chat tab
 */
export function openAgentChat(agentId: string, agentName: string): void {
  const tab = createChatTab(agentId, agentName);
  useTabStore.getState().openTab(tab);
}

/**
 * Helper function to open or switch to a document tab
 */
export function openDocument(filePath: string): void {
  const tab = createDocTab(filePath);
  useTabStore.getState().openTab(tab);
}
