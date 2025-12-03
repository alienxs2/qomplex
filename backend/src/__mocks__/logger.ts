/**
 * Mock logger for tests
 */

import { vi } from 'vitest';

const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockChildLogger),
};

export default mockLogger;
export const createLogger = vi.fn(() => mockChildLogger);
