/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError } from './errorHandler.js';
import type { UserPublic } from '@qomplex/shared';

/**
 * Extended Express Request with user
 */
export interface AuthenticatedRequest extends Request {
  user: UserPublic;
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

/**
 * Auth middleware - requires valid JWT token
 * Extracts token from Authorization header: "Bearer <token>"
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header');
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = parts[1];
    if (!token) {
      throw new UnauthorizedError('Token is missing');
    }

    // Verify token and get user
    const user = await authService.verifyToken(token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 * Attaches user if token is valid, otherwise continues
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        if (token) {
          const user = await authService.verifyToken(token);
          if (user) {
            (req as AuthenticatedRequest).user = user;
          }
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
}
