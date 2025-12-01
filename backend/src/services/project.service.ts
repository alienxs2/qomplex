/**
 * Project Service
 * CRUD operations for projects
 */

import { query, transaction } from '../db/index.js';
import logger from '../logger.js';
import type { Project } from '@qomplex/shared';
import { ConflictError, ValidationError } from '../middleware/errorHandler.js';
import { agentService } from './agent.service.js';
import path from 'path';

/**
 * Extract project name from working directory path
 */
function extractProjectName(workingDirectory: string): string {
  // Get the last segment of the path
  const baseName = path.basename(workingDirectory);
  return baseName || workingDirectory;
}

/**
 * Project Service class
 */
export class ProjectService {
  /**
   * Create a new project
   * Also creates default agents for the project
   */
  async create(userId: string, workingDirectory: string): Promise<Project> {
    const log = logger.child({ method: 'createProject', userId, workingDirectory });
    log.info('Creating new project');

    // Validate working_directory is absolute path
    if (!workingDirectory.startsWith('/')) {
      throw new ValidationError('working_directory must be an absolute path');
    }

    // Prevent path traversal
    if (workingDirectory.includes('..')) {
      throw new ValidationError('working_directory cannot contain path traversal');
    }

    // Auto-generate project name from path
    const name = extractProjectName(workingDirectory);

    // Use transaction to create project and default agents atomically
    const project = await transaction(async (client) => {
      // Check for duplicate working_directory for this user
      const existingResult = await client.query<Project>(
        'SELECT * FROM projects WHERE user_id = $1 AND working_directory = $2',
        [userId, workingDirectory]
      );

      if (existingResult.rows.length > 0) {
        throw new ConflictError('This directory is already registered as a project');
      }

      // Create project
      const result = await client.query<Project>(
        `INSERT INTO projects (user_id, name, working_directory)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, name, workingDirectory]
      );

      const newProject = result.rows[0];
      if (!newProject) {
        throw new Error('Failed to create project');
      }

      // Create default agents for the project
      await agentService.createDefaultAgents(newProject.id, client);

      return newProject;
    });

    if (!project) {
      throw new Error('Failed to create project');
    }

    log.info({ projectId: project.id }, 'Project created successfully');

    return project;
  }

  /**
   * Get all projects for a user
   */
  async getByUser(userId: string): Promise<Project[]> {
    const log = logger.child({ method: 'getByUser', userId });
    log.info('Fetching user projects');

    const result = await query<Project>(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  /**
   * Get a project by ID
   */
  async getById(id: string): Promise<Project | null> {
    const result = await query<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get a project by ID and verify ownership
   */
  async getByIdForUser(id: string, userId: string): Promise<Project | null> {
    const result = await query<Project>(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a project
   * Also deletes all associated agents and sessions (via CASCADE)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const log = logger.child({ method: 'deleteProject', projectId: id, userId });
    log.info('Deleting project');

    // Verify ownership before deletion
    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rowCount === 0) {
      log.warn('Project not found or not owned by user');
      return false;
    }

    log.info('Project deleted successfully');
    return true;
  }

  /**
   * Update a project (currently only name can be updated)
   */
  async update(id: string, userId: string, updates: { name?: string }): Promise<Project | null> {
    const log = logger.child({ method: 'updateProject', projectId: id, userId });
    log.info('Updating project');

    // Verify ownership
    const project = await this.getByIdForUser(id, userId);
    if (!project) {
      return null;
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updateFields.length === 0) {
      return project;
    }

    values.push(id);
    values.push(userId);

    const result = await query<Project>(
      `UPDATE projects SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
