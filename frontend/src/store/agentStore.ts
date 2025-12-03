import { create } from 'zustand';
import type { Agent, UpdateAgentRequest, CreateAgentRequest, Message } from '@shared/types';
import { getAuthToken } from './authStore';
import { useProjectStore } from './projectStore';

/**
 * API base URL - uses same host with backend port
 */
const API_BASE = `http://${window.location.hostname}:3000`;

/**
 * Transcript response from API
 */
interface TranscriptResponse {
  success: boolean;
  messages: Message[];
  hasSession: boolean;
  sessionId?: string;
}

/**
 * AgentState interface following design.md specification
 */
interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAgents: (projectId: string) => Promise<void>;
  setCurrentAgent: (agent: Agent | null) => void;
  updateAgent: (id: string, data: Partial<UpdateAgentRequest>) => Promise<void>;
  createAgent: (data: CreateAgentRequest) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  clearAgents: () => void;
  clearError: () => void;
  /**
   * REQ-8: Clear agent session to start fresh
   */
  clearAgentSession: (agentId: string) => Promise<void>;
  /**
   * REQ-8: Fetch transcript/history for an agent
   */
  fetchTranscript: (agentId: string) => Promise<TranscriptResponse>;
}

/**
 * Helper function to make authenticated API requests
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

/**
 * useAgentStore - Zustand store for agent state management
 *
 * Features:
 * - Agents are fetched per project (project-scoped)
 * - Clears agents when project changes
 * - CRUD operations call backend APIs
 * - Handle loading and error states
 */
export const useAgentStore = create<AgentState>()((set) => ({
  agents: [],
  currentAgent: null,
  isLoading: false,
  error: null,

  /**
   * Fetch all agents for a specific project
   * Calls GET /api/projects/:id/agents
   */
  fetchAgents: async (projectId: string) => {
    // Clear existing agents before fetching new ones
    set({ agents: [], currentAgent: null, isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/api/projects/${projectId}/agents`);

      if (!response.ok) {
        if (response.status === 401) {
          set({
            agents: [],
            currentAgent: null,
            isLoading: false,
            error: 'Authentication required',
          });
          return;
        }
        if (response.status === 404) {
          set({
            agents: [],
            currentAgent: null,
            isLoading: false,
            error: 'Project not found',
          });
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch agents');
      }

      const data = await response.json();
      const agents: Agent[] = data.agents || [];

      set({
        agents,
        currentAgent: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
        isLoading: false,
      });
    }
  },

  /**
   * Set the current active agent
   */
  setCurrentAgent: (agent: Agent | null) => {
    set({ currentAgent: agent, error: null });
  },

  /**
   * Update an existing agent
   * Calls PUT /api/agents/:id
   */
  updateAgent: async (id: string, data: Partial<UpdateAgentRequest>) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/api/agents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Agent not found');
        }
        throw new Error(responseData.error || 'Failed to update agent');
      }

      const updatedAgent: Agent = responseData.agent;

      // Update the agent in the list
      set((state) => ({
        agents: state.agents.map(a => a.id === id ? updatedAgent : a),
        currentAgent: state.currentAgent?.id === id ? updatedAgent : state.currentAgent,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update agent';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Create a new agent for the current project
   * Calls POST /api/projects/:projectId/agents
   */
  createAgent: async (data: CreateAgentRequest): Promise<Agent> => {
    const currentProject = useProjectStore.getState().currentProject;

    if (!currentProject) {
      const error = new Error('No project selected');
      set({ error: error.message });
      throw error;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(
        `${API_BASE}/api/projects/${currentProject.id}/agents`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('An agent with this name already exists');
        }
        throw new Error(responseData.error || 'Failed to create agent');
      }

      const newAgent: Agent = responseData.agent;

      // Add to agents list
      set((state) => ({
        agents: [...state.agents, newAgent],
        isLoading: false,
        error: null,
      }));

      return newAgent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Delete an agent by ID
   * Calls DELETE /api/agents/:id
   */
  deleteAgent: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/api/agents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete agent');
      }

      // Remove from agents list
      set((state) => {
        const updatedAgents = state.agents.filter(a => a.id !== id);

        // If deleted agent was current, clear current
        const newCurrentAgent = state.currentAgent?.id === id
          ? null
          : state.currentAgent;

        return {
          agents: updatedAgents,
          currentAgent: newCurrentAgent,
          isLoading: false,
          error: null,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete agent',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Clear all agents (used when project changes)
   */
  clearAgents: () => {
    set({
      agents: [],
      currentAgent: null,
      error: null,
    });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear agent session to start fresh (REQ-8)
   * Calls POST /api/agents/:id/clear-session
   */
  clearAgentSession: async (agentId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authFetch(`${API_BASE}/api/agents/${agentId}/clear-session`, {
        method: 'POST',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to clear session');
      }

      const updatedAgent: Agent = responseData.agent;

      // Update the agent in the list and currentAgent
      set((state) => ({
        agents: state.agents.map(a => a.id === agentId ? updatedAgent : a),
        currentAgent: state.currentAgent?.id === agentId ? updatedAgent : state.currentAgent,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear session';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch transcript/history for an agent (REQ-8)
   * Calls GET /api/agents/:id/transcript
   */
  fetchTranscript: async (agentId: string): Promise<TranscriptResponse> => {
    try {
      const response = await authFetch(`${API_BASE}/api/agents/${agentId}/transcript`);

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to fetch transcript');
      }

      const data: TranscriptResponse = await response.json();
      return data;
    } catch (error) {
      // Return empty response on error (graceful handling)
      console.warn('[agentStore] Failed to fetch transcript:', error);
      return {
        success: false,
        messages: [],
        hasSession: false,
      };
    }
  },
}));

/**
 * Subscribe to project changes and fetch agents when project changes
 * This sets up a subscription that automatically fetches agents
 * whenever the current project changes
 */
export function setupProjectAgentSync(): () => void {
  let previousProjectId: string | null = null;

  const unsubscribe = useProjectStore.subscribe((state) => {
    const currentProjectId = state.currentProject?.id || null;

    if (currentProjectId !== previousProjectId) {
      previousProjectId = currentProjectId;

      if (currentProjectId) {
        // Fetch agents for the new project
        useAgentStore.getState().fetchAgents(currentProjectId);
      } else {
        // Clear agents when no project is selected
        useAgentStore.getState().clearAgents();
      }
    }
  });

  return unsubscribe;
}

/**
 * Helper function to get the current agent ID
 * Returns null if no agent is selected
 */
export function getCurrentAgentId(): string | null {
  return useAgentStore.getState().currentAgent?.id || null;
}

/**
 * Helper function to check if an agent is selected
 */
export function hasCurrentAgent(): boolean {
  return !!useAgentStore.getState().currentAgent;
}
