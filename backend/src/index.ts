/**
 * Qomplex Backend Entry Point
 */

import 'dotenv/config';
import { createServer } from 'http';
import logger from './logger.js';
import { createApp, setupErrorHandlers } from './app.js';
import { runMigrations, closePool } from './db/index.js';

// Import routes
import { authRouter } from './routes/auth.routes.js';
import { projectRouter } from './routes/project.routes.js';
import { agentRouter } from './routes/agent.routes.js';
import { fileRouter } from './routes/file.routes.js';

// Import WebSocket
import { setupWebSocket } from './websocket/index.js';
import { createMessageHandler, handleShutdown as handleWsShutdown } from './websocket/handler.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    logger.info('Starting Qomplex Backend...');

    // Run database migrations
    await runMigrations();

    // Create Express app
    const app = createApp();

    // Register API routes
    app.use('/api/auth', authRouter);
    app.use('/api/projects', projectRouter);
    app.use('/api/agents', agentRouter);
    app.use('/api', fileRouter);

    // Setup error handlers (must be last)
    setupErrorHandlers(app);

    // Create HTTP server
    const server = createServer(app);

    // Setup WebSocket server
    const messageHandler = createMessageHandler();
    const wss = setupWebSocket(server, messageHandler);

    // Start server
    server.listen(PORT, () => {
      logger.info({ port: PORT }, `Server running on http://localhost:${PORT}`);
      logger.info('API endpoints available:');
      logger.info('  GET    /health');
      logger.info('  GET    /health/ready');
      logger.info('  POST   /api/auth/register');
      logger.info('  POST   /api/auth/login');
      logger.info('  GET    /api/auth/me');
      logger.info('  GET    /api/projects');
      logger.info('  POST   /api/projects');
      logger.info('  DELETE /api/projects/:id');
      logger.info('  GET    /api/projects/:projectId/agents');
      logger.info('  POST   /api/projects/:projectId/agents');
      logger.info('  GET    /api/agents/:id');
      logger.info('  PUT    /api/agents/:id');
      logger.info('  DELETE /api/agents/:id');
      logger.info('  GET    /api/browse');
      logger.info('  GET    /api/files/read');
      logger.info('  WS     /ws (WebSocket with JWT auth)');
    });

    // Graceful shutdown handlers
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      // Cleanup WebSocket and CLI processes
      handleWsShutdown();

      // Close WebSocket server
      wss.close(() => {
        logger.info('WebSocket server closed');
      });

      server.close(async () => {
        await closePool();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();
