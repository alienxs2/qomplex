/**
 * File Service
 * Secure file system operations for directory browsing and file reading
 */

import { promises as fs } from 'fs';
import path from 'path';
import logger from '../logger.js';
import type { DirectoryItem, BrowseResponse } from '@qomplex/shared';
import { ValidationError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

// Allowed root path for file browsing (security)
const ALLOWED_ROOT = '/home';

// Maximum file size for reading (1MB)
const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Validate and normalize a path to prevent traversal attacks
 */
function validatePath(requestedPath: string): string {
  // Resolve to absolute path
  const resolvedPath = path.resolve(requestedPath);
  const normalizedPath = path.normalize(resolvedPath);

  // Check for path traversal attempts
  if (requestedPath.includes('..')) {
    throw new ValidationError('Path traversal not allowed');
  }

  // Ensure path is under allowed root
  if (!normalizedPath.startsWith(ALLOWED_ROOT)) {
    throw new ForbiddenError(`Access denied. Only paths under ${ALLOWED_ROOT} are allowed`);
  }

  return normalizedPath;
}

/**
 * Check if a path is a symbolic link pointing outside allowed root
 */
async function isSymlinkOutsideRoot(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    if (stats.isSymbolicLink()) {
      const realPath = await fs.realpath(filePath);
      return !realPath.startsWith(ALLOWED_ROOT);
    }
    return false;
  } catch {
    return true; // Treat inaccessible paths as outside root
  }
}

/**
 * File Service class
 */
export class FileService {
  /**
   * Browse directory contents
   */
  async browseDirectory(requestedPath?: string): Promise<BrowseResponse> {
    const log = logger.child({ method: 'browseDirectory' });

    // Default to /home if no path provided
    const targetPath = requestedPath || ALLOWED_ROOT;

    // Validate and normalize path
    const normalizedPath = validatePath(targetPath);
    log.info({ path: normalizedPath }, 'Browsing directory');

    // Check if path exists and is a directory
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new ValidationError('Path is not a directory');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('Directory not found');
      }
      if (error.code === 'EACCES') {
        throw new ForbiddenError('Permission denied');
      }
      throw error;
    }

    // Read directory contents
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

    // Process entries, filtering out hidden files and symlinks outside root
    const items: DirectoryItem[] = [];

    for (const entry of entries) {
      // Skip hidden files (starting with .)
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(normalizedPath, entry.name);

      // Skip symlinks pointing outside allowed root
      if (await isSymlinkOutsideRoot(fullPath)) {
        continue;
      }

      try {
        const entryStats = await fs.stat(fullPath);

        // Only show directories for browsing
        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            path: fullPath,
            isDirectory: true,
            modifiedAt: entryStats.mtime,
          });
        }
      } catch {
        // Skip entries we can't access
        continue;
      }
    }

    // Sort alphabetically
    items.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate parent path
    const parentPath = path.dirname(normalizedPath);
    const hasParent = parentPath !== normalizedPath && parentPath.startsWith(ALLOWED_ROOT);

    return {
      currentPath: normalizedPath,
      parentPath: hasParent ? parentPath : null,
      items,
    };
  }

  /**
   * Read file content
   */
  async readFile(requestedPath: string): Promise<string> {
    const log = logger.child({ method: 'readFile' });

    if (!requestedPath) {
      throw new ValidationError('Path is required');
    }

    // Validate and normalize path
    const normalizedPath = validatePath(requestedPath);
    log.info({ path: normalizedPath }, 'Reading file');

    // Check if path exists and is a file
    try {
      const stats = await fs.stat(normalizedPath);

      if (stats.isDirectory()) {
        throw new ValidationError('Path is a directory, not a file');
      }

      // Check file size
      if (stats.size > MAX_FILE_SIZE) {
        throw new ValidationError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.code === 'ENOENT') {
        throw new NotFoundError('File not found');
      }
      if (error.code === 'EACCES') {
        throw new ForbiddenError('Permission denied');
      }
      throw error;
    }

    // Check if it's a symlink outside root
    if (await isSymlinkOutsideRoot(normalizedPath)) {
      throw new ForbiddenError('Access denied');
    }

    // Read file content
    const content = await fs.readFile(normalizedPath, 'utf-8');

    return content;
  }

  /**
   * Browse directory contents including files (for file picker)
   */
  async browseDirectoryWithFiles(requestedPath?: string, pattern?: string): Promise<BrowseResponse> {
    const log = logger.child({ method: 'browseDirectoryWithFiles' });

    // Default to /home if no path provided
    const targetPath = requestedPath || ALLOWED_ROOT;

    // Validate and normalize path
    const normalizedPath = validatePath(targetPath);
    log.info({ path: normalizedPath, pattern }, 'Browsing directory with files');

    // Check if path exists and is a directory
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new ValidationError('Path is not a directory');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('Directory not found');
      }
      if (error.code === 'EACCES') {
        throw new ForbiddenError('Permission denied');
      }
      throw error;
    }

    // Read directory contents
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

    // Process entries
    const items: DirectoryItem[] = [];

    for (const entry of entries) {
      // Skip hidden files (starting with .)
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(normalizedPath, entry.name);

      // Skip symlinks pointing outside allowed root
      if (await isSymlinkOutsideRoot(fullPath)) {
        continue;
      }

      try {
        const entryStats = await fs.stat(fullPath);

        // Include directories
        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            path: fullPath,
            isDirectory: true,
            modifiedAt: entryStats.mtime,
          });
        }
        // Include files matching pattern (default: all)
        else if (!pattern || entry.name.match(new RegExp(pattern.replace('*', '.*')))) {
          items.push({
            name: entry.name,
            path: fullPath,
            isDirectory: false,
            size: entryStats.size,
            modifiedAt: entryStats.mtime,
          });
        }
      } catch {
        // Skip entries we can't access
        continue;
      }
    }

    // Sort: directories first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    // Calculate parent path
    const parentPath = path.dirname(normalizedPath);
    const hasParent = parentPath !== normalizedPath && parentPath.startsWith(ALLOWED_ROOT);

    return {
      currentPath: normalizedPath,
      parentPath: hasParent ? parentPath : null,
      items,
    };
  }
}

// Export singleton instance
export const fileService = new FileService();
