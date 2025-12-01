/**
 * Authentication Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * GET /api/auth/me (protected)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AuthRegisterRequestSchema, AuthLoginRequestSchema } from '@qomplex/shared';
import { ValidationError } from '../middleware/errorHandler.js';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const parseResult = AuthRegisterRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ValidationError(errorMessages);
      }

      const { email, password } = parseResult.data;

      const result = await authService.register(email, password);

      res.status(201).json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login an existing user
 */
authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const parseResult = AuthLoginRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ValidationError(errorMessages);
      }

      const { email, password } = parseResult.data;

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
authRouter.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;

      res.status(200).json({
        success: true,
        user: authReq.user,
      });
    } catch (error) {
      next(error);
    }
  }
);
