/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import logger from '../logger.js';
import type { User, UserPublic } from '@qomplex/shared';
import { UnauthorizedError, ConflictError } from '../middleware/errorHandler.js';

const BCRYPT_COST_FACTOR = 10;
const JWT_EXPIRATION = '24h';
const JWT_SECRET = process.env.JWT_SECRET || 'qomplex-dev-secret-change-in-production';

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Convert database User to UserPublic (without password_hash)
 */
function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Authentication Service class
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<{ user: UserPublic; token: string }> {
    const log = logger.child({ method: 'register', email });
    log.info('Registering new user');

    // Check if user already exists
    const existingUser = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await query<User>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING *`,
      [email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('Failed to create user');
    }
    const token = this.generateToken(user);

    log.info({ userId: user.id }, 'User registered successfully');

    return {
      user: toUserPublic(user),
      token,
    };
  }

  /**
   * Login a user
   */
  async login(email: string, password: string): Promise<{ user: UserPublic; token: string }> {
    const log = logger.child({ method: 'login', email });
    log.info('User login attempt');

    // Find user by email
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);

    log.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: toUserPublic(user),
      token,
    };
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<UserPublic | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

      // Fetch user from database to ensure they still exist
      const result = await query<User>(
        'SELECT * FROM users WHERE id = $1',
        [payload.userId]
      );

      const user = result.rows[0];
      if (!user) {
        return null;
      }

      return toUserPublic(user);
    } catch (error) {
      logger.debug({ error }, 'Token verification failed');
      return null;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST_FACTOR);
  }

  /**
   * Compare a password with a hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  }

  /**
   * Decode JWT token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserPublic | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return null;
    }

    return toUserPublic(user);
  }
}

// Export singleton instance
export const authService = new AuthService();
