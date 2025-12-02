import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@shared/types';
import { getAuthToken } from './authStore';

/**
 * API base URL - uses same host with backend port
 */
const API_BASE = `http://${window.location.hostname}:3000`;

/**
 * ProjectState interface following design.md specification
 */
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (workingDirectory: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  clearError: () => void;
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
 * useProjectStore - Zustand store for project state management
 *
 * Features:
 * - Persist middleware stores currentProject selection in localStorage
 * - CRUD operations call backend APIs
 * - Automatically fetch projects on first access
 * - Handle loading and error states
 */
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,

      /**
       * Fetch all projects for the current user
       * Calls GET /api/projects
       */
      fetchProjects: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await authFetch(`${API_BASE}/api/projects`);

          if (!response.ok) {
            if (response.status === 401) {
              set({
                projects: [],
                currentProject: null,
                isLoading: false,
                error: 'Authentication required',
              });
              return;
            }
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch projects');
          }

          const data = await response.json();
          const projects: Project[] = data.projects || [];

          // If current project is no longer in the list, clear it
          const { currentProject } = get();
          const currentStillExists = currentProject
            ? projects.some(p => p.id === currentProject.id)
            : false;

          set({
            projects,
            currentProject: currentStillExists ? currentProject : null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch projects',
            isLoading: false,
          });
        }
      },

      /**
       * Set the current active project
       * This will trigger agent store to fetch new agents
       */
      setCurrentProject: (project: Project | null) => {
        set({ currentProject: project, error: null });
      },

      /**
       * Create a new project with the given working directory
       * Calls POST /api/projects
       * Returns the created project on success
       */
      createProject: async (workingDirectory: string): Promise<Project> => {
        set({ isLoading: true, error: null });

        try {
          const response = await authFetch(`${API_BASE}/api/projects`, {
            method: 'POST',
            body: JSON.stringify({ working_directory: workingDirectory }),
          });

          const data = await response.json();

          if (!response.ok) {
            // Handle 409 Conflict (duplicate path)
            if (response.status === 409) {
              set({
                error: 'This directory is already registered as a project',
                isLoading: false,
              });
              throw new Error('This directory is already registered as a project');
            }
            throw new Error(data.error || 'Failed to create project');
          }

          const newProject: Project = data.project;

          // Add to projects list and set as current
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProject: newProject,
            isLoading: false,
            error: null,
          }));

          return newProject;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Delete a project by ID
       * Calls DELETE /api/projects/:id
       */
      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authFetch(`${API_BASE}/api/projects/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete project');
          }

          // Remove from projects list
          set((state) => {
            const updatedProjects = state.projects.filter(p => p.id !== id);

            // If deleted project was current, clear current
            const newCurrentProject = state.currentProject?.id === id
              ? null
              : state.currentProject;

            return {
              projects: updatedProjects,
              currentProject: newCurrentProject,
              isLoading: false,
              error: null,
            };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete project',
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'qomplex-project',
      // Only persist currentProject (not all projects - those are fetched)
      partialize: (state) => ({
        currentProject: state.currentProject,
      }),
    }
  )
);

/**
 * Helper function to get the current project ID
 * Returns null if no project is selected
 */
export function getCurrentProjectId(): string | null {
  return useProjectStore.getState().currentProject?.id || null;
}

/**
 * Helper function to check if a project is selected
 */
export function hasCurrentProject(): boolean {
  return !!useProjectStore.getState().currentProject;
}
