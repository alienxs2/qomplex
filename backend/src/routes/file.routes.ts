/**
 * File Routes
 * GET /api/browse - Browse directory contents
 * GET /api/files/read - Read file content
 */

import { Router, Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service.js';
import { authMiddleware } from '../middleware/auth.js';

export const fileRouter = Router();

// All routes require authentication
fileRouter.use(authMiddleware);

/**
 * GET /api/browse
 * Browse directory contents (directories only)
 * Query params:
 *   - path: Directory path to browse (default: /home)
 */
fileRouter.get(
  '/browse',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestedPath = req.query.path as string | undefined;

      const result = await fileService.browseDirectory(requestedPath);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/files/read
 * Read file content
 * Query params:
 *   - path: File path to read (required)
 */
fileRouter.get(
  '/files/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestedPath = req.query.path as string;

      const content = await fileService.readFile(requestedPath);

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/files/browse
 * Browse directory contents including files (for file picker)
 * Query params:
 *   - path: Directory path to browse (default: /home)
 *   - pattern: File pattern to filter (e.g., "*.md")
 */
fileRouter.get(
  '/files/browse',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestedPath = req.query.path as string | undefined;
      const pattern = req.query.pattern as string | undefined;

      const result = await fileService.browseDirectoryWithFiles(requestedPath, pattern);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);
