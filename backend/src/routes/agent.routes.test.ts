/**
 * Integration tests for Agent Routes
 * Tests agent CRUD operations with authentication
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { agentRouter } from './agent.routes.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import type { Agent, User, Project } from '@qomplex/shared';

// Mock logger
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

// Mock database
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
  getClient: vi.fn(),
  pool: { query: vi.fn() },
}));

// Mock bcrypt (needed for auth middleware)
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
  },
}));

// Mock transcript service
vi.mock('../services/transcript.service.js', () => ({
  transcriptService: {
    getSessionMessages: vi.fn(),
  },
}));

// Import mocked modules
import { query } from '../db/index.js';
import jwt from 'jsonwebtoken';
import { transcriptService } from '../services/transcript.service.js';

const mockQuery = vi.mocked(query);
const mockJwtVerify = vi.mocked(jwt.verify);
const mockGetSessionMessages = vi.mocked(transcriptService.getSessionMessages);

/**
 * Create test Express app with agent routes
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/agents', agentRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('Agent Routes Integration Tests', () => {
  let app: Express;

  const testUser: User = {
    id: 'user-123-uuid',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const testProject: Project = {
    id: 'project-123-uuid',
    user_id: 'user-123-uuid',
    name: 'test-project',
    working_directory: '/home/testuser/projects/test-project',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const testAgent: Agent = {
    id: 'agent-123-uuid',
    project_id: 'project-123-uuid',
    name: 'Code Agent',
    system_prompt: 'You are a helpful coding assistant.',
    session_id: null,
    linked_md_files: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const testAgentWithSession: Agent = {
    ...testAgent,
    session_id: 'session-abc-123',
  };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default auth mock
    mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
    mockQuery.mockResolvedValue({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication Required', () => {
    it('should return 401 without authorization header', async () => {
      vi.clearAllMocks();

      const response = await request(app)
        .get('/api/agents/agent-123-uuid')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No authorization header');
    });

    it('should return 401 with invalid token', async () => {
      vi.clearAllMocks();
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/agents/agent-123-uuid')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return an agent by ID', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.id).toBe(testAgent.id);
      expect(response.body.agent.name).toBe(testAgent.name);
    });

    it('should return 404 for non-existent agent', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/agents/nonexistent-uuid')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Agent not found');
    });

    it('should return 404 when agent belongs to another user', async () => {
      // getByIdForUser returns null when user doesn't own the agent
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/agents/other-user-agent-uuid')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/agents/:id', () => {
    it('should update agent name successfully', async () => {
      const updatedAgent = { ...testAgent, name: 'Updated Agent Name' };

      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never) // Check duplicate name
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .put(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ name: 'Updated Agent Name' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.name).toBe('Updated Agent Name');
    });

    it('should update agent system_prompt successfully', async () => {
      const updatedAgent = { ...testAgent, system_prompt: 'New system prompt.' };

      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .put(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ system_prompt: 'New system prompt.' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.agent.system_prompt).toBe('New system prompt.');
    });

    it('should update agent linked_md_files successfully', async () => {
      const updatedAgent = { ...testAgent, linked_md_files: ['/home/user/doc.md'] };

      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .put(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ linked_md_files: ['/home/user/doc.md'] })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.agent.linked_md_files)).toBe(true);
    });

    it('should return 400 for system_prompt exceeding 10000 chars', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .put(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ system_prompt: 'a'.repeat(10001) })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent agent', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .put('/api/agents/nonexistent-uuid')
        .set('Authorization', 'Bearer valid_token')
        .send({ name: 'Updated Name' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid update data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .put(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ name: '' }) // Empty name not allowed
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete an agent successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ id: testAgent.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .delete(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent agent', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .delete('/api/agents/nonexistent-uuid')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 when deleting another user agent', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .delete('/api/agents/other-user-agent-uuid')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/agents/:id/transcript', () => {
    it('should return empty messages when agent has no session', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get(`/api/agents/${testAgent.id}/transcript`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toEqual([]);
      expect(response.body.hasSession).toBe(false);
    });

    it('should return transcript messages when agent has session', async () => {
      const mockMessages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgentWithSession], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testProject], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      mockGetSessionMessages.mockResolvedValue(mockMessages as never);

      const response = await request(app)
        .get(`/api/agents/${testAgentWithSession.id}/transcript`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hasSession).toBe(true);
      expect(response.body.sessionId).toBe('session-abc-123');
      expect(response.body.messages).toBeDefined();
    });

    it('should return 404 for non-existent agent', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/agents/nonexistent-uuid/transcript')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/agents/:id/clear-session', () => {
    it('should clear agent session successfully', async () => {
      const clearedAgent = { ...testAgentWithSession, session_id: null };

      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgentWithSession], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [clearedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post(`/api/agents/${testAgentWithSession.id}/clear-session`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.agent).toBeDefined();
    });

    it('should return 404 for non-existent agent', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post('/api/agents/nonexistent-uuid/clear-session')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Agent CRUD Flow', () => {
    it('should complete full flow: get -> update -> get transcript -> clear session', async () => {
      // Get agent
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const getResponse = await request(app)
        .get(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.agent.name).toBe(testAgent.name);

      // Update agent
      vi.clearAllMocks();
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);

      const updatedAgent = { ...testAgent, name: 'Updated Agent' };
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [updatedAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const updateResponse = await request(app)
        .put(`/api/agents/${testAgent.id}`)
        .set('Authorization', 'Bearer valid_token')
        .send({ name: 'Updated Agent' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.agent.name).toBe('Updated Agent');

      // Get transcript (no session)
      vi.clearAllMocks();
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const transcriptResponse = await request(app)
        .get(`/api/agents/${testAgent.id}/transcript`)
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(transcriptResponse.body.success).toBe(true);
      expect(transcriptResponse.body.hasSession).toBe(false);

      // Clear session (even if no session, should succeed)
      vi.clearAllMocks();
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ ...testAgent, session_id: null }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const clearResponse = await request(app)
        .post(`/api/agents/${testAgent.id}/clear-session`)
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(clearResponse.body.success).toBe(true);
    });
  });
});
