/**
 * Pino logger configuration for Qomplex Backend
 */

import pino, { LoggerOptions } from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Build logger options
const loggerOptions: LoggerOptions = {
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
};

// Add transport only in development
if (isDevelopment) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  };
}

// Create logger instance
const logger = pino(loggerOptions);

/**
 * Create a child logger with context
 * @param context - Context name (e.g., 'AuthService', 'ProjectService')
 * @returns Child logger with context metadata
 */
export const createLogger = (context: string) => {
  return logger.child({ context });
};

export default logger;
