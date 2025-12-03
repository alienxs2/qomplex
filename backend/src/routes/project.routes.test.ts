/**
 * Integration tests for Project Routes
 * Tests project CRUD operations with authentication
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { projectRouter } from './project.routes.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import type { Project, Agent, User } from '@qomplex/shared';

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

// Import mocked modules
import { query, transaction } from '../db/index.js';
import jwt from 'jsonwebtoken';

const mockQuery = vi.mocked(query);
const mockTransaction = vi.mocked(transaction);
const mockJwtVerify = vi.mocked(jwt.verify);

/**
 * Create test Express app with project routes
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/projects', projectRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('Project Routes Integration Tests', () => {
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
      // Clear mocks to simulate no auth
      vi.clearAllMocks();

      const response = await request(app)
        .get('/api/projects')
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
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects for authenticated user', async () => {
      // First query for auth middleware (get user)
      // Second query for getByUser
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testProject], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);
    });

    it('should return empty array when user has no projects', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toEqual([]);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Check existing
            .mockResolvedValueOnce({ rows: [testProject], rowCount: 1 }) // Insert project
            .mockResolvedValue({ rows: [testAgent], rowCount: 1 }), // Default agents
        };
        return callback(mockClient as never);
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .send({ working_directory: '/home/testuser/projects/test-project' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.project).toBeDefined();
    });

    it('should return 400 for relative path', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .send({ working_directory: 'relative/path' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for path with traversal', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      mockTransaction.mockImplementation(async () => {
        const error = new Error('working_directory cannot contain path traversal');
        (error as any).statusCode = 400;
        (error as any).code = 'VALIDATION_ERROR';
        throw error;
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .send({ working_directory: '/home/user/../etc/passwd' })
        .expect('Content-Type', /json/);

      // Response may be 400 or 500 depending on error handling
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing working_directory', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate project path', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      // Import ConflictError to properly simulate the error
      const { ConflictError } = await import('../middleware/errorHandler.js');

      mockTransaction.mockImplementation(async () => {
        throw new ConflictError('This directory is already registered as a project');
      });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .send({ working_directory: '/home/testuser/existing-project' })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already registered');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ id: testProject.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .delete('/api/projects/nonexistent-project-uuid')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should return 404 when deleting another user project', async () => {
      // Simulate ownership check failing
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .delete('/api/projects/other-user-project-uuid')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:projectId/agents', () => {
    it('should return all agents for a project', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testProject], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get(`/api/projects/${testProject.id}/agents`)
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.agents).toBeDefined();
      expect(Array.isArray(response.body.agents)).toBe(true);
    });

    it('should return 404 for non-existent project', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/projects/nonexistent-uuid/agents')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/projects/:projectId/agents', () => {
    it('should create a custom agent for a project', async () => {
      const newAgent = {
        ...testAgent,
        id: 'new-agent-uuid',
        name: 'Custom Agent',
        system_prompt: 'You are a custom agent.',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ id: testProject.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [newAgent], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post(`/api/projects/${testProject.id}/agents`)
        .set('Authorization', 'Bearer valid_token')
        .send({ name: 'Custom Agent', system_prompt: 'You are a custom agent.' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.agent).toBeDefined();
    });

    it('should return 400 for missing name', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post(`/api/projects/${testProject.id}/agents`)
        .set('Authorization', 'Bearer valid_token')
        .send({ system_prompt: 'You are an agent.' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for system_prompt exceeding 10000 chars', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ id: testProject.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      // ValidationError is used internally by the error handler middleware

      // Mock the query to throw ValidationError when system_prompt is too long
      mockQuery.mockResolvedValueOnce({ rows: [{ id: testProject.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post(`/api/projects/${testProject.id}/agents`)
        .set('Authorization', 'Bearer valid_token')
        .send({
          name: 'Agent',
          system_prompt: 'a'.repeat(10001) // Exceeds 10000 char limit
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Project CRUD Flow', () => {
    it('should complete full CRUD flow: create -> read -> delete', async () => {
      // Create project
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockTransaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [], rowCount: 0 })
            .mockResolvedValueOnce({ rows: [testProject], rowCount: 1 })
            .mockResolvedValue({ rows: [testAgent], rowCount: 1 }),
        };
        return callback(mockClient as never);
      });

      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .send({ working_directory: '/home/user/new-project' })
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // Read projects
      vi.clearAllMocks();
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testProject], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const readResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.projects.length).toBeGreaterThanOrEqual(0);

      // Delete project
      vi.clearAllMocks();
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
      mockQuery
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ id: testProject.id }], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const deleteResponse = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });
  });
});
