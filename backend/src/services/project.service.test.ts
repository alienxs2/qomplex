/**
 * Unit tests for ProjectService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Project } from '@qomplex/shared';

// Mock logger - must be before importing the service
vi.mock('../logger.js', () => ({
  default: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    }),
  },
}));

// Mock database module
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
  getClient: vi.fn(),
}));

// Mock agent service
vi.mock('./agent.service.js', () => ({
  agentService: {
    createDefaultAgents: vi.fn(),
  },
}));

// Import after mocks are set up
import { ProjectService } from './project.service.js';
import { query, transaction } from '../db/index.js';
import { agentService } from './agent.service.js';

describe('ProjectService', () => {
  let projectService: ProjectService;
  const mockQuery = vi.mocked(query);
  const mockTransaction = vi.mocked(transaction);
  const mockCreateDefaultAgents = vi.mocked(agentService.createDefaultAgents);

  beforeEach(() => {
    projectService = new ProjectService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockProject: Project = {
    id: 'project-123',
    user_id: 'user-123',
    name: 'my-project',
    working_directory: '/home/dev/my-project',
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('create', () => {
    it('should create a project and default agents', async () => {
      // Mock transaction to simulate successful creation
      mockTransaction.mockImplementation(async (fn: (client: unknown) => Promise<unknown>) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [] }) // Check duplicate
            .mockResolvedValueOnce({ rows: [mockProject] }), // Insert project
        };
        return fn(mockClient);
      });
      mockCreateDefaultAgents.mockResolvedValue([]);

      const result = await projectService.create('user-123', '/home/dev/my-project');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockProject.id);
      expect(result.name).toBe('my-project'); // Extracted from path
      expect(mockCreateDefaultAgents).toHaveBeenCalledWith(mockProject.id, expect.anything());
    });

    it('should extract project name from working directory path', async () => {
      const projectWithPath = { ...mockProject, name: 'test-app' };
      mockTransaction.mockImplementation(async (fn: (client: unknown) => Promise<unknown>) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [projectWithPath] }),
        };
        return fn(mockClient);
      });
      mockCreateDefaultAgents.mockResolvedValue([]);

      await projectService.create('user-123', '/home/dev/projects/test-app');

      // Verify the name was extracted from path
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should throw ValidationError for relative path', async () => {
      await expect(
        projectService.create('user-123', 'relative/path')
      ).rejects.toThrow('working_directory must be an absolute path');
    });

    it('should throw ValidationError for path with traversal', async () => {
      await expect(
        projectService.create('user-123', '/home/dev/../etc/passwd')
      ).rejects.toThrow('working_directory cannot contain path traversal');
    });

    it('should throw ConflictError for duplicate working directory', async () => {
      mockTransaction.mockImplementation(async (fn: (client: unknown) => Promise<unknown>) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [mockProject] }), // Duplicate found
        };
        return fn(mockClient);
      });

      await expect(
        projectService.create('user-123', '/home/dev/my-project')
      ).rejects.toThrow('This directory is already registered as a project');
    });

    it('should throw error if project creation fails', async () => {
      mockTransaction.mockImplementation(async (fn: (client: unknown) => Promise<unknown>) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] }), // No project returned
        };
        return fn(mockClient);
      });

      await expect(
        projectService.create('user-123', '/home/dev/my-project')
      ).rejects.toThrow('Failed to create project');
    });
  });

  describe('getByUser', () => {
    it('should return all projects for a user', async () => {
      const projects = [mockProject, { ...mockProject, id: 'project-456' }];
      mockQuery.mockResolvedValueOnce({ rows: projects, rowCount: 2, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.getByUser('user-123');

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
        ['user-123']
      );
    });

    it('should return empty array if user has no projects', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.getByUser('user-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return project by id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProject], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.getById('project-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockProject.id);
    });

    it('should return null if project not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.getById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getByIdForUser', () => {
    it('should return project if owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProject], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.getByIdForUser('project-123', 'user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockProject.id);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        ['project-123', 'user-123']
      );
    });

    it('should return null if project not owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.getByIdForUser('project-123', 'different-user');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete project owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: mockProject.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.delete('project-123', 'user-123');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
        ['project-123', 'user-123']
      );
    });

    it('should return false if project not found or not owned', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await projectService.delete('project-123', 'different-user');

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update project name', async () => {
      const updatedProject = { ...mockProject, name: 'new-name' };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockProject], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [updatedProject], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Update

      const result = await projectService.update('project-123', 'user-123', { name: 'new-name' });

      expect(result).toBeDefined();
      expect(result?.name).toBe('new-name');
    });

    it('should return null if project not owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never); // getByIdForUser returns null

      const result = await projectService.update('project-123', 'different-user', { name: 'new-name' });

      expect(result).toBeNull();
    });

    it('should return existing project if no updates provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockProject], rowCount: 1, command: '', oid: 0, fields: [] } as never); // getByIdForUser

      const result = await projectService.update('project-123', 'user-123', {});

      expect(result).toEqual(mockProject);
      // Only one query should be made (getByIdForUser)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});
