/**
 * Project Routes
 * GET /api/projects - Get all projects for user
 * POST /api/projects - Create new project
 * DELETE /api/projects/:id - Delete a project
 */

import { Router, Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service.js';
import { agentService } from '../services/agent.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CreateProjectRequestSchema, CreateAgentRequestSchema } from '@qomplex/shared';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

export const projectRouter = Router();

// All routes require authentication
projectRouter.use(authMiddleware);

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
projectRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const projects = await projectService.getByUser(authReq.user.id);

      res.status(200).json({
        success: true,
        projects,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/projects
 * Create a new project
 */
projectRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Validate request body
      const parseResult = CreateProjectRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ValidationError(errorMessages);
      }

      const { working_directory } = parseResult.data;

      const project = await projectService.create(authReq.user.id, working_directory);

      res.status(201).json({
        success: true,
        project,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
projectRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Project ID is required');
      }
      const deleted = await projectService.delete(id, authReq.user.id);

      if (!deleted) {
        throw new NotFoundError('Project not found');
      }

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/projects/:projectId/agents
 * Get all agents for a project
 */
projectRouter.get(
  '/:projectId/agents',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { projectId } = req.params;

      if (!projectId) {
        throw new ValidationError('Project ID is required');
      }

      // Verify user owns the project
      const project = await projectService.getByIdForUser(projectId, authReq.user.id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const agents = await agentService.getByProject(project.id);

      res.status(200).json({
        success: true,
        agents,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/projects/:projectId/agents
 * Create a custom agent for a project
 */
projectRouter.post(
  '/:projectId/agents',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { projectId } = req.params;

      if (!projectId) {
        throw new ValidationError('Project ID is required');
      }

      // Validate request body
      const parseResult = CreateAgentRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ValidationError(errorMessages);
      }

      const agent = await agentService.create(projectId, authReq.user.id, parseResult.data);

      res.status(201).json({
        success: true,
        agent,
      });
    } catch (error) {
      next(error);
    }
  }
);
