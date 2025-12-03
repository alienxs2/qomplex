/**
 * Unit tests for AuthService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from '@qomplex/shared';

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

// Import after mocks are set up
import { AuthService } from './auth.service.js';
import { query } from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let authService: AuthService;
  const mockQuery = vi.mocked(query);
  const mockBcryptHash = vi.mocked(bcrypt.hash);
  const mockBcryptCompare = vi.mocked(bcrypt.compare);
  const mockJwtSign = vi.mocked(jwt.sign);
  const mockJwtVerify = vi.mocked(jwt.verify);
  const mockJwtDecode = vi.mocked(jwt.decode);

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('register', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create a new user and return token', async () => {
      // Setup mocks
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptHash.mockResolvedValue('hashed_password' as never);
      mockJwtSign.mockReturnValue('mock_jwt_token' as never);

      const result = await authService.register('test@example.com', 'password123');

      // Verify user creation
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.token).toBe('mock_jwt_token');

      // Verify password was hashed
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10);

      // Verify email was lowercased
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should throw ConflictError if email already exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      await expect(
        authService.register('test@example.com', 'password123')
      ).rejects.toThrow('Email already registered');
    });

    it('should lowercase email before registration', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [{ ...mockUser, email: 'test@example.com' }], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptHash.mockResolvedValue('hashed_password' as never);
      mockJwtSign.mockReturnValue('mock_jwt_token' as never);

      await authService.register('TEST@EXAMPLE.COM', 'password123');

      // Verify email was lowercased in both queries
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should throw error if user creation fails', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);
      mockBcryptHash.mockResolvedValue('hashed_password' as never);

      await expect(
        authService.register('test@example.com', 'password123')
      ).rejects.toThrow('Failed to create user');
    });
  });

  describe('login', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should login user and return token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptCompare.mockResolvedValue(true as never);
      mockJwtSign.mockReturnValue('mock_jwt_token' as never);

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.token).toBe('mock_jwt_token');

      // Verify password was compared
      expect(mockBcryptCompare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptCompare.mockResolvedValue(false as never);

      await expect(
        authService.login('test@example.com', 'wrong_password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should lowercase email before login', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);
      mockBcryptCompare.mockResolvedValue(true as never);
      mockJwtSign.mockReturnValue('mock_jwt_token' as never);

      await authService.login('TEST@EXAMPLE.COM', 'password123');

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });
  });

  describe('verifyToken', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return user if token is valid', async () => {
      mockJwtVerify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' } as never);
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await authService.verifyToken('valid_token');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      // Verify password_hash is not returned
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return null if token is invalid', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyToken('invalid_token');

      expect(result).toBeNull();
    });

    it('should return null if user no longer exists', async () => {
      mockJwtVerify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' } as never);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await authService.verifyToken('valid_token');

      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      mockBcryptHash.mockResolvedValue('hashed_password' as never);

      const result = await authService.hashPassword('password123');

      expect(result).toBe('hashed_password');
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      mockBcryptCompare.mockResolvedValue(true as never);

      const result = await authService.comparePassword('password123', 'hashed_password');

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      mockBcryptCompare.mockResolvedValue(false as never);

      const result = await authService.comparePassword('wrong_password', 'hashed_password');

      expect(result).toBe(false);
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      mockJwtDecode.mockReturnValue({ userId: 'user-123', email: 'test@example.com' } as never);

      const result = authService.decodeToken('some_token');

      expect(result).toEqual({ userId: 'user-123', email: 'test@example.com' });
    });

    it('should return null for invalid token', () => {
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.decodeToken('invalid_token');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should return user public data by id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1, command: '', oid: 0, fields: [] } as never);

      const result = await authService.getUserById('user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as never);

      const result = await authService.getUserById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
