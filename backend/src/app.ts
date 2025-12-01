/**
 * Express Application Configuration
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import logger from './logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { pool } from './db/index.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Trust proxy for proper IP handling
  app.set('trust proxy', 1);

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // JSON body parser
  app.use(express.json({ limit: '10mb' }));

  // Request logging middleware
  app.use((req: Request, res: Response, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      }, 'Request completed');
    });

    next();
  });

  // Health check endpoints
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'qomplex-backend',
    });
  });

  app.get('/health/ready', async (_req: Request, res: Response) => {
    try {
      // Check database connection
      await pool.query('SELECT 1');

      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Health check failed - database not ready');
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'failed',
        },
      });
    }
  });

  return app;
}

/**
 * Setup error handlers (must be called after routes are registered)
 */
export function setupErrorHandlers(app: Express): void {
  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);
}
