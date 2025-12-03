/**
 * Unit tests for AgentService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Agent } from '@qomplex/shared';
import { DEFAULT_AGENTS } from '@qomplex/shared';

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

// Import after mocks are set up
import { AgentService } from './agent.service.js';
import { query } from '../db/index.js';

describe('AgentService', () => {
  let agentService: AgentService;
  const mockQuery = vi.mocked(query);

  beforeEach(() => {
    agentService = new AgentService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockAgent: Agent = {
    id: 'agent-123',
    project_id: 'project-123',
    name: 'PM',
    system_prompt: 'You are a Project Manager.',
    session_id: null,
    linked_md_files: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('createDefaultAgents', () => {
    it('should create all default agents for a project', async () => {
      // Mock successful insertions for each default agent
      for (let i = 0; i < DEFAULT_AGENTS.length; i++) {
        mockQuery.mockResolvedValueOnce({
          rows: [{
            id: `agent-${i}`,
            project_id: 'project-123',
            name: DEFAULT_AGENTS[i].name,
            system_prompt: DEFAULT_AGENTS[i].system_prompt,
            session_id: null,
            linked_md_files: [],
            created_at: new Date(),
            updated_at: new Date(),
          }],
          rowCount: 1,
          command: '',
          oid: 0,
          fields: [],
        } as never);
      }

      const result = await agentService.createDefaultAgents('project-123');

      expect(result).toHaveLength(DEFAULT_AGENTS.length);
      expect(mockQuery).toHaveBeenCalledTimes(DEFAULT_AGENTS.length);

      // Verify each agent was created with correct data
      DEFAULT_AGENTS.forEach((template, index) => {
        expect(mockQuery).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringContaining('INSERT INTO agents'),
          ['project-123', template.name, template.system_prompt, JSON.stringify([])]
        );
      });
    });

    it('should use provided client for transaction', async () => {
      const mockClient = {
        query: vi.fn(),
      };

      // Mock successful insertions
      DEFAULT_AGENTS.forEach(() => {
        mockClient.query.mockResolvedValueOnce({
          rows: [mockAgent],
        });
      });

      const result = await agentService.createDefaultAgents('project-123', mockClient as unknown as import('pg').PoolClient);

      expect(result).toHaveLength(DEFAULT_AGENTS.length);
      expect(mockClient.query).toHaveBeenCalledTimes(DEFAULT_AGENTS.length);
      // Main query should not be called when client is provided
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('getByProject', () => {
    it('should return all agents for a project', async () => {
      const agents = [
        mockAgent,
        { ...mockAgent, id: 'agent-456', name: 'BackDev' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: agents, rowCount: 2, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getByProject('project-123');

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM agents WHERE project_id = $1 ORDER BY created_at ASC',
        ['project-123']
      );
    });

    it('should parse linked_md_files from JSONB', async () => {
      const agentWithFiles = {
        ...mockAgent,
        linked_md_files: ['/path/to/file.md', '/another/file.md'],
      };
      mockQuery.mockResolvedValueOnce({ rows: [agentWithFiles], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getByProject('project-123');

      expect(result[0].linked_md_files).toEqual(['/path/to/file.md', '/another/file.md']);
    });

    it('should handle null linked_md_files', async () => {
      const agentWithNullFiles = { ...mockAgent, linked_md_files: null };
      mockQuery.mockResolvedValueOnce({ rows: [agentWithNullFiles], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getByProject('project-123');

      expect(result[0].linked_md_files).toEqual([]);
    });

    it('should return empty array if project has no agents', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getByProject('project-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should return agent by id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getById('agent-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockAgent.id);
    });

    it('should return null if agent not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getByIdForUser', () => {
    it('should return agent if owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getByIdForUser('agent-123', 'user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockAgent.id);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN projects'),
        ['agent-123', 'user-123']
      );
    });

    it('should return null if agent not owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.getByIdForUser('agent-123', 'different-user');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update agent name', async () => {
      const updatedAgent = { ...mockAgent, name: 'NewName' };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never) // Check duplicate name
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Update

      const result = await agentService.update('agent-123', 'user-123', { name: 'NewName' });

      expect(result).toBeDefined();
      expect(result?.name).toBe('NewName');
    });

    it('should update system_prompt', async () => {
      const updatedAgent = { ...mockAgent, system_prompt: 'New prompt' };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Update

      const result = await agentService.update('agent-123', 'user-123', { system_prompt: 'New prompt' });

      expect(result).toBeDefined();
      expect(result?.system_prompt).toBe('New prompt');
    });

    it('should update linked_md_files', async () => {
      const files = ['/path/to/file.md'];
      const updatedAgent = { ...mockAgent, linked_md_files: files };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Update

      const result = await agentService.update('agent-123', 'user-123', { linked_md_files: files });

      expect(result).toBeDefined();
      expect(result?.linked_md_files).toEqual(files);
    });

    it('should update session_id', async () => {
      const updatedAgent = { ...mockAgent, session_id: 'session-abc' };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Update

      const result = await agentService.update('agent-123', 'user-123', { session_id: 'session-abc' });

      expect(result).toBeDefined();
      expect(result?.session_id).toBe('session-abc');
    });

    it('should throw ValidationError if system_prompt exceeds 10000 chars', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // getByIdForUser

      const longPrompt = 'a'.repeat(10001);

      await expect(
        agentService.update('agent-123', 'user-123', { system_prompt: longPrompt })
      ).rejects.toThrow('System prompt cannot exceed 10000 characters');
    });

    it('should throw ValidationError if duplicate agent name in project', async () => {
      const existingAgent = { ...mockAgent, id: 'agent-456', name: 'ExistingName' };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [existingAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Check duplicate - found

      await expect(
        agentService.update('agent-123', 'user-123', { name: 'ExistingName' })
      ).rejects.toThrow('An agent with this name already exists in the project');
    });

    it('should return null if agent not owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never); // getByIdForUser returns null

      const result = await agentService.update('agent-123', 'different-user', { name: 'NewName' });

      expect(result).toBeNull();
    });

    it('should return existing agent if no updates provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // getByIdForUser

      const result = await agentService.update('agent-123', 'user-123', {});

      expect(result).toEqual(mockAgent);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should allow updating name to same value', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never) // getByIdForUser
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Update (no duplicate check for same name)

      // When name equals current name, no duplicate check is performed
      const result = await agentService.update('agent-123', 'user-123', { name: 'PM' });

      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete agent owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: mockAgent.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.delete('agent-123', 'user-123');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM agents'),
        ['agent-123', 'user-123']
      );
    });

    it('should return false if agent not found or not owned', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await agentService.delete('agent-123', 'different-user');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a custom agent', async () => {
      const newAgent = {
        ...mockAgent,
        name: 'CustomAgent',
        system_prompt: 'Custom prompt',
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'project-123' }], rowCount: 1, command: '', oid: 0, fields: [] } as never) // Verify project ownership
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never) // Check duplicate name
        .mockResolvedValueOnce({ rows: [newAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Insert agent

      const result = await agentService.create('project-123', 'user-123', {
        name: 'CustomAgent',
        system_prompt: 'Custom prompt',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('CustomAgent');
      expect(result.system_prompt).toBe('Custom prompt');
    });

    it('should throw NotFoundError if project not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never); // Project not found

      await expect(
        agentService.create('project-123', 'user-123', {
          name: 'CustomAgent',
          system_prompt: 'Custom prompt',
        })
      ).rejects.toThrow('Project not found');
    });

    it('should throw ValidationError if system_prompt exceeds 10000 chars', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'project-123' }], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Project found

      const longPrompt = 'a'.repeat(10001);

      await expect(
        agentService.create('project-123', 'user-123', {
          name: 'CustomAgent',
          system_prompt: longPrompt,
        })
      ).rejects.toThrow('System prompt cannot exceed 10000 characters');
    });

    it('should throw ValidationError if duplicate agent name', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'project-123' }], rowCount: 1, command: '', oid: 0, fields: [] } as never) // Project found
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Duplicate found

      await expect(
        agentService.create('project-123', 'user-123', {
          name: 'PM',
          system_prompt: 'Custom prompt',
        })
      ).rejects.toThrow('An agent with this name already exists in the project');
    });

    it('should throw error if agent creation fails', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'project-123' }], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never) // No duplicate
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never); // Insert returns nothing

      await expect(
        agentService.create('project-123', 'user-123', {
          name: 'CustomAgent',
          system_prompt: 'Custom prompt',
        })
      ).rejects.toThrow('Failed to create agent');
    });
  });
});
