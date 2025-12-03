/**
 * Integration tests for File Routes
 * Tests file browsing and security (path traversal prevention)
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { fileRouter } from './file.routes.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import type { User } from '@qomplex/shared';

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

// Mock fs module for file operations
vi.mock('fs', () => ({
  promises: {
    stat: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
    lstat: vi.fn(),
    realpath: vi.fn(),
  },
}));

// Import mocked modules
import { query } from '../db/index.js';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';

const mockQuery = vi.mocked(query);
const mockJwtVerify = vi.mocked(jwt.verify);
const mockStat = vi.mocked(fs.stat);
const mockReaddir = vi.mocked(fs.readdir);
const mockReadFile = vi.mocked(fs.readFile);
const mockLstat = vi.mocked(fs.lstat);
const mockRealpath = vi.mocked(fs.realpath);

/**
 * Create test Express app with file routes
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', fileRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('File Routes Integration Tests', () => {
  let app: Express;

  const testUser: User = {
    id: 'user-123-uuid',
    email: 'test@example.com',
    password_hash: 'hashed_password',
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
    it('should return 401 without authorization header for browse', async () => {
      vi.clearAllMocks();

      const response = await request(app)
        .get('/api/browse')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('No authorization header');
    });

    it('should return 401 without authorization header for file read', async () => {
      vi.clearAllMocks();

      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/user/file.txt' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/browse', () => {
    it('should browse /home directory by default', async () => {
      mockStat.mockResolvedValue({ isDirectory: () => true } as never);
      mockReaddir.mockResolvedValue([
        { name: 'testuser', isDirectory: () => true },
      ] as never);
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);

      const response = await request(app)
        .get('/api/browse')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentPath).toBe('/home');
      expect(response.body.items).toBeDefined();
    });

    it('should browse a valid subdirectory', async () => {
      mockStat.mockResolvedValue({ isDirectory: () => true, mtime: new Date() } as never);
      mockReaddir.mockResolvedValue([
        { name: 'projects', isDirectory: () => true },
        { name: 'documents', isDirectory: () => true },
      ] as never);
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);

      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.currentPath).toBe('/home/testuser');
    });

    it('should return parent path for navigation', async () => {
      mockStat.mockResolvedValue({ isDirectory: () => true, mtime: new Date() } as never);
      mockReaddir.mockResolvedValue([] as never);

      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser/projects' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.parentPath).toBe('/home/testuser');
    });

    it('should filter out hidden files (starting with .)', async () => {
      mockStat.mockResolvedValue({ isDirectory: () => true, mtime: new Date() } as never);
      mockReaddir.mockResolvedValue([
        { name: '.hidden', isDirectory: () => true },
        { name: 'visible', isDirectory: () => true },
      ] as never);
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);

      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Hidden directory should be filtered out
      const items = response.body.items;
      const hasHidden = items.some((item: any) => item.name.startsWith('.'));
      expect(hasHidden).toBe(false);
    });
  });

  describe('Path Security - Reject Path Traversal (..)', () => {
    it('should reject paths containing ..', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser/../../../etc' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('traversal');
    });

    it('should reject encoded path traversal attempts', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser/..%2F..%2Fetc' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/);

      // Should either be 400 (validation) or 403 (forbidden)
      expect([400, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject simple .. at the end', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser/..' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject .. in the middle of path', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/user/../admin' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Path Security - Reject Paths Outside /home', () => {
    it('should reject /etc path', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/etc' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('/home');
    });

    it('should reject /var path', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/var/log' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject root path', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject /tmp path', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/tmp' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject /usr path', async () => {
      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/usr/bin' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/files/read', () => {
    it('should read a file successfully', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => false,
        size: 100,
      } as never);
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
      mockReadFile.mockResolvedValue('File content here' as never);

      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/testuser/readme.md' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.content).toBe('File content here');
    });

    it('should return 400 for missing path parameter', async () => {
      const response = await request(app)
        .get('/api/files/read')
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject path traversal in file read', async () => {
      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/testuser/../../etc/passwd' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject file read outside /home', async () => {
      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/etc/passwd' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when trying to read a directory', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => true,
        size: 4096,
      } as never);

      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/testuser/projects' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('directory');
    });

    it('should return 400 for files exceeding max size', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => false,
        size: 2 * 1024 * 1024, // 2MB, exceeds 1MB limit
      } as never);

      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/testuser/large-file.bin' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('too large');
    });

    it('should return 404 for non-existent file', async () => {
      const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockStat.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/testuser/nonexistent.txt' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for permission denied', async () => {
      const error = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockStat.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/files/read')
        .query({ path: '/home/root/secret.txt' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/files/browse (with files)', () => {
    it('should browse directory with files', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => true,
        mtime: new Date(),
        size: 4096,
      } as never);
      mockReaddir.mockResolvedValue([
        { name: 'subdir', isDirectory: () => true },
        { name: 'file.md', isDirectory: () => false },
      ] as never);
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);

      const response = await request(app)
        .get('/api/files/browse')
        .query({ path: '/home/testuser' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
    });

    it('should filter files by pattern', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => true,
        mtime: new Date(),
        size: 4096,
      } as never);
      mockReaddir.mockResolvedValue([
        { name: 'readme.md', isDirectory: () => false },
        { name: 'code.ts', isDirectory: () => false },
      ] as never);
      mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);

      const response = await request(app)
        .get('/api/files/browse')
        .query({ path: '/home/testuser', pattern: '*.md' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject path traversal in files/browse', async () => {
      const response = await request(app)
        .get('/api/files/browse')
        .query({ path: '/home/user/../../../etc' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject paths outside /home in files/browse', async () => {
      const response = await request(app)
        .get('/api/files/browse')
        .query({ path: '/var/www' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Symlink Security', () => {
    it('should reject symlinks pointing outside allowed root', async () => {
      mockStat.mockResolvedValue({
        isDirectory: () => true,
        mtime: new Date(),
      } as never);
      mockReaddir.mockResolvedValue([
        { name: 'safe-link', isDirectory: () => true },
      ] as never);
      // Simulate symlink pointing outside /home
      mockLstat.mockResolvedValue({ isSymbolicLink: () => true } as never);
      mockRealpath.mockResolvedValue('/etc/secrets' as never);

      const response = await request(app)
        .get('/api/browse')
        .query({ path: '/home/testuser' })
        .set('Authorization', 'Bearer valid_token')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      // The symlink should be filtered out
      const hasLink = response.body.items.some((item: any) => item.name === 'safe-link');
      expect(hasLink).toBe(false);
    });
  });

  describe('Security Test Summary', () => {
    it('should pass all path traversal security checks', async () => {
      const maliciousPaths = [
        '/home/../etc/passwd',
        '/home/user/../../../etc/shadow',
        '/home/..%2F..%2Fetc/passwd',
        '/home/user/./../../etc',
        '/home/user/..',
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .get('/api/browse')
          .query({ path })
          .set('Authorization', 'Bearer valid_token');

        expect([400, 403]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    it('should pass all restricted path security checks', async () => {
      const restrictedPaths = [
        '/',
        '/etc',
        '/var',
        '/tmp',
        '/usr',
        '/root',
        '/opt',
        '/sys',
        '/proc',
      ];

      for (const path of restrictedPaths) {
        const response = await request(app)
          .get('/api/browse')
          .query({ path })
          .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      }
    });
  });
});
