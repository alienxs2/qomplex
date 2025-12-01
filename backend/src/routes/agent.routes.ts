/**
 * Agent Routes
 * GET /api/agents/:id - Get agent by ID
 * PUT /api/agents/:id - Update agent
 * DELETE /api/agents/:id - Delete agent
 */

import { Router, Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { UpdateAgentRequestSchema } from '@qomplex/shared';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

export const agentRouter = Router();

// All routes require authentication
agentRouter.use(authMiddleware);

/**
 * GET /api/agents/:id
 * Get an agent by ID
 */
agentRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Agent ID is required');
      }

      const agent = await agentService.getByIdForUser(id, authReq.user.id);

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      res.status(200).json({
        success: true,
        agent,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/agents/:id
 * Update an agent
 */
agentRouter.put(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Agent ID is required');
      }

      // Validate request body
      const parseResult = UpdateAgentRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ValidationError(errorMessages);
      }

      const updates: {
        name?: string;
        system_prompt?: string;
        linked_md_files?: string[];
      } = {};
      if (parseResult.data.name !== undefined) updates.name = parseResult.data.name;
      if (parseResult.data.system_prompt !== undefined) updates.system_prompt = parseResult.data.system_prompt;
      if (parseResult.data.linked_md_files !== undefined) updates.linked_md_files = parseResult.data.linked_md_files;

      const agent = await agentService.update(id, authReq.user.id, updates);

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      res.status(200).json({
        success: true,
        agent,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
agentRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Agent ID is required');
      }

      const deleted = await agentService.delete(id, authReq.user.id);

      if (!deleted) {
        throw new NotFoundError('Agent not found');
      }

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);
