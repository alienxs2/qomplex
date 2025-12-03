/**
 * Integration tests for Auth Routes
 * Tests full auth flow: register -> login -> access protected route
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { authRouter } from './auth.routes.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';

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

// Mock bcrypt
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
import { query } from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const mockQuery = vi.mocked(query);
const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockJwtSign = vi.mocked(jwt.sign);
const mockJwtVerify = vi.mocked(jwt.verify);

/**
 * Create test Express app with auth routes
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('Auth Routes Integration Tests', () => {
  let app: Express;
  const testUser = {
    id: 'user-123-uuid',
    email: 'test@example.com',
    password_hash: 'hashed_password_123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Setup mocks
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never) // Check existing
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never); // Insert
      mockBcryptHash.mockResolvedValue('hashed_password_123' as never);
      mockJwtSign.mockReturnValue('mock_jwt_token' as never);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBe('mock_jwt_token');
      // Password hash should not be returned
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('8 characters');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptCompare.mockResolvedValue(true as never);
      mockJwtSign.mockReturnValue('mock_jwt_token' as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBe('mock_jwt_token');
    });

    it('should return 401 for invalid email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return 401 for wrong password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptCompare.mockResolvedValue(false as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No authorization header');
    });

    it('should return 401 with invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid authorization header format');
    });

    it('should return 401 with expired/invalid token', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 if user no longer exists', async () => {
      mockJwtVerify.mockReturnValue({ userId: 'deleted-user-uuid', email: 'deleted@example.com' } as never);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Full Auth Flow', () => {
    it('should complete full flow: register -> login -> get user', async () => {
      // Step 1: Register
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptHash.mockResolvedValue('hashed_password_123' as never);
      mockJwtSign.mockReturnValue('register_token' as never);

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@example.com', password: 'securepassword123' })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.token).toBeDefined();

      // Step 2: Login
      vi.clearAllMocks();
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptCompare.mockResolvedValue(true as never);
      mockJwtSign.mockReturnValue('login_token' as never);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'newuser@example.com', password: 'securepassword123' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const loginToken = loginResponse.body.token;

      // Step 3: Access protected route with token
      vi.clearAllMocks();
      mockJwtVerify.mockReturnValue({ userId: 'user-123-uuid', email: 'test@example.com' } as never);
      mockQuery.mockResolvedValueOnce({ rows: [testUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.user).toBeDefined();
    });
  });
});
