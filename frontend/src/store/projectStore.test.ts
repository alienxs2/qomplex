/**
 * ProjectStore Tests
 *
 * Tests for the project Zustand store including:
 * - fetchProjects action and state transitions
 * - setCurrentProject action
 * - createProject action
 * - deleteProject action
 * - Error handling
 * - State persistence
 *
 * Requirements: REQ-2 (Project Management)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useProjectStore,
  getCurrentProjectId,
  hasCurrentProject,
} from './projectStore';
import { useAuthStore } from './authStore';
import type { Project } from '@shared/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample projects for testing
const mockProjects: Project[] = [
  {
    id: 'project-1',
    user_id: 'user-1',
    name: 'project-one',
    working_directory: '/home/dev/project-one',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  },
  {
    id: 'project-2',
    user_id: 'user-1',
    name: 'project-two',
    working_directory: '/home/dev/project-two',
    created_at: new Date('2024-01-02'),
    updated_at: new Date('2024-01-02'),
  },
];

describe('projectStore', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
    });

    // Set a valid auth token for authenticated requests
    useAuthStore.setState({
      token: 'test-token',
      user: { id: 'user-1', email: 'test@example.com', created_at: new Date() },
      isLoading: false,
      error: null,
    });

    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useProjectStore.getState();

      expect(state.projects).toEqual([]);
      expect(state.currentProject).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchProjects', () => {
    it('sets isLoading to true when fetch starts', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ projects: mockProjects }),
              });
            }, 100);
          })
      );

      const fetchPromise = useProjectStore.getState().fetchProjects();

      expect(useProjectStore.getState().isLoading).toBe(true);

      await fetchPromise;
    });

    it('sets projects on successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: mockProjects }),
      });

      await useProjectStore.getState().fetchProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual(mockProjects);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sends Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      });

      await useProjectStore.getState().fetchProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('clears currentProject if no longer in projects list', async () => {
      // Set a current project that won't be in the fetched list
      useProjectStore.setState({
        currentProject: {
          id: 'deleted-project',
          user_id: 'user-1',
          name: 'deleted',
          working_directory: '/deleted',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: mockProjects }),
      });

      await useProjectStore.getState().fetchProjects();

      expect(useProjectStore.getState().currentProject).toBeNull();
    });

    it('keeps currentProject if still in projects list', async () => {
      useProjectStore.setState({ currentProject: mockProjects[0] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: mockProjects }),
      });

      await useProjectStore.getState().fetchProjects();

      expect(useProjectStore.getState().currentProject).toEqual(mockProjects[0]);
    });

    it('sets error on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await useProjectStore.getState().fetchProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.currentProject).toBeNull();
      expect(state.error).toBe('Authentication required');
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useProjectStore.getState().fetchProjects();

      const state = useProjectStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('handles empty projects array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      });

      await useProjectStore.getState().fetchProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('setCurrentProject', () => {
    it('sets current project', () => {
      useProjectStore.getState().setCurrentProject(mockProjects[0]);

      expect(useProjectStore.getState().currentProject).toEqual(mockProjects[0]);
    });

    it('clears current project when null', () => {
      useProjectStore.setState({ currentProject: mockProjects[0] });

      useProjectStore.getState().setCurrentProject(null);

      expect(useProjectStore.getState().currentProject).toBeNull();
    });

    it('clears error when setting project', () => {
      useProjectStore.setState({ error: 'Previous error' });

      useProjectStore.getState().setCurrentProject(mockProjects[0]);

      expect(useProjectStore.getState().error).toBeNull();
    });
  });

  describe('createProject', () => {
    it('creates project and returns it', async () => {
      const newProject: Project = {
        id: 'new-project',
        user_id: 'user-1',
        name: 'new-project',
        working_directory: '/home/dev/new-project',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ project: newProject }),
      });

      const result = await useProjectStore
        .getState()
        .createProject('/home/dev/new-project');

      expect(result).toEqual(newProject);
    });

    it('adds created project to projects list', async () => {
      useProjectStore.setState({ projects: mockProjects });

      const newProject: Project = {
        id: 'new-project',
        user_id: 'user-1',
        name: 'new-project',
        working_directory: '/home/dev/new-project',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ project: newProject }),
      });

      await useProjectStore.getState().createProject('/home/dev/new-project');

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(3);
      expect(state.projects).toContainEqual(newProject);
    });

    it('sets new project as current project', async () => {
      const newProject: Project = {
        id: 'new-project',
        user_id: 'user-1',
        name: 'new-project',
        working_directory: '/home/dev/new-project',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ project: newProject }),
      });

      await useProjectStore.getState().createProject('/home/dev/new-project');

      expect(useProjectStore.getState().currentProject).toEqual(newProject);
    });

    it('sends correct request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            project: {
              id: 'new',
              user_id: 'user-1',
              name: 'test',
              working_directory: '/home/dev/test',
              created_at: new Date(),
              updated_at: new Date(),
            },
          }),
      });

      await useProjectStore.getState().createProject('/home/dev/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ working_directory: '/home/dev/test' }),
        })
      );
    });

    it('throws and sets error on 409 conflict (duplicate path)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Path already exists' }),
      });

      await expect(
        useProjectStore.getState().createProject('/home/dev/existing')
      ).rejects.toThrow('This directory is already registered as a project');

      expect(useProjectStore.getState().error).toBe(
        'This directory is already registered as a project'
      );
    });

    it('throws on other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid path' }),
      });

      await expect(
        useProjectStore.getState().createProject('/invalid')
      ).rejects.toThrow('Invalid path');
    });

    it('sets isLoading during creation', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    project: {
                      id: 'new',
                      user_id: 'user-1',
                      name: 'test',
                      working_directory: '/test',
                      created_at: new Date(),
                      updated_at: new Date(),
                    },
                  }),
              });
            }, 100);
          })
      );

      const createPromise = useProjectStore.getState().createProject('/test');

      expect(useProjectStore.getState().isLoading).toBe(true);

      await createPromise;

      expect(useProjectStore.getState().isLoading).toBe(false);
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      useProjectStore.setState({ projects: mockProjects });
    });

    it('removes project from list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await useProjectStore.getState().deleteProject('project-1');

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects.find((p) => p.id === 'project-1')).toBeUndefined();
    });

    it('clears currentProject if deleted project was current', async () => {
      useProjectStore.setState({ currentProject: mockProjects[0] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await useProjectStore.getState().deleteProject('project-1');

      expect(useProjectStore.getState().currentProject).toBeNull();
    });

    it('keeps currentProject if different project was deleted', async () => {
      useProjectStore.setState({ currentProject: mockProjects[0] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await useProjectStore.getState().deleteProject('project-2');

      expect(useProjectStore.getState().currentProject).toEqual(mockProjects[0]);
    });

    it('sends DELETE request with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await useProjectStore.getState().deleteProject('project-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/project-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('throws and sets error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Project not found' }),
      });

      await expect(
        useProjectStore.getState().deleteProject('nonexistent')
      ).rejects.toThrow('Project not found');

      expect(useProjectStore.getState().error).toBe('Project not found');
    });

    it('sets isLoading during deletion', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              });
            }, 100);
          })
      );

      const deletePromise = useProjectStore.getState().deleteProject('project-1');

      expect(useProjectStore.getState().isLoading).toBe(true);

      await deletePromise;

      expect(useProjectStore.getState().isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useProjectStore.setState({ error: 'Some error' });

      useProjectStore.getState().clearError();

      expect(useProjectStore.getState().error).toBeNull();
    });

    it('does not affect other state', () => {
      useProjectStore.setState({
        projects: mockProjects,
        currentProject: mockProjects[0],
        error: 'Some error',
      });

      useProjectStore.getState().clearError();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual(mockProjects);
      expect(state.currentProject).toEqual(mockProjects[0]);
      expect(state.error).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    describe('getCurrentProjectId', () => {
      it('returns project id when set', () => {
        useProjectStore.setState({ currentProject: mockProjects[0] });

        expect(getCurrentProjectId()).toBe('project-1');
      });

      it('returns null when no current project', () => {
        useProjectStore.setState({ currentProject: null });

        expect(getCurrentProjectId()).toBeNull();
      });
    });

    describe('hasCurrentProject', () => {
      it('returns true when project is selected', () => {
        useProjectStore.setState({ currentProject: mockProjects[0] });

        expect(hasCurrentProject()).toBe(true);
      });

      it('returns false when no project selected', () => {
        useProjectStore.setState({ currentProject: null });

        expect(hasCurrentProject()).toBe(false);
      });
    });
  });

  describe('State Transitions', () => {
    it('handles rapid project switches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: mockProjects }),
        });

      await useProjectStore.getState().fetchProjects();

      // Rapid project switches
      useProjectStore.getState().setCurrentProject(mockProjects[0]);
      expect(useProjectStore.getState().currentProject).toEqual(mockProjects[0]);

      useProjectStore.getState().setCurrentProject(mockProjects[1]);
      expect(useProjectStore.getState().currentProject).toEqual(mockProjects[1]);

      useProjectStore.getState().setCurrentProject(null);
      expect(useProjectStore.getState().currentProject).toBeNull();

      useProjectStore.getState().setCurrentProject(mockProjects[0]);
      expect(useProjectStore.getState().currentProject).toEqual(mockProjects[0]);
    });

    it('handles create followed by delete', async () => {
      const newProject: Project = {
        id: 'temp-project',
        user_id: 'user-1',
        name: 'temp',
        working_directory: '/temp',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ project: newProject }),
      });

      await useProjectStore.getState().createProject('/temp');

      expect(useProjectStore.getState().projects).toContainEqual(newProject);
      expect(useProjectStore.getState().currentProject).toEqual(newProject);

      // Delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await useProjectStore.getState().deleteProject('temp-project');

      expect(
        useProjectStore.getState().projects.find((p) => p.id === 'temp-project')
      ).toBeUndefined();
      expect(useProjectStore.getState().currentProject).toBeNull();
    });
  });

  describe('Authentication Integration', () => {
    it('sends requests without auth header when no token', async () => {
      useAuthStore.setState({ token: null });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await useProjectStore.getState().fetchProjects();

      // Verify request was made without Authorization header
      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });
});
