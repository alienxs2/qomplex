/**
 * Agent Service
 * CRUD operations for agents with default agent creation
 */

import pg from 'pg';
import { query } from '../db/index.js';
import logger from '../logger.js';
import type { Agent } from '@qomplex/shared';
import { DEFAULT_AGENTS } from '@qomplex/shared';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

/**
 * Agent Service class
 */
export class AgentService {
  /**
   * Create default agents for a new project
   * Uses transaction client if provided (for atomic project+agents creation)
   */
  async createDefaultAgents(
    projectId: string,
    client?: pg.PoolClient
  ): Promise<Agent[]> {
    const log = logger.child({ method: 'createDefaultAgents', projectId });
    log.info('Creating default agents for project');

    const agents: Agent[] = [];

    const queryFn = client
      ? (text: string, params?: unknown[]) => client.query(text, params)
      : (text: string, params?: unknown[]) => query(text, params);

    for (const template of DEFAULT_AGENTS) {
      const result = await queryFn(
        `INSERT INTO agents (project_id, name, system_prompt, linked_md_files)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [projectId, template.name, template.system_prompt, JSON.stringify([])]
      );

      agents.push(result.rows[0] as Agent);
    }

    log.info({ count: agents.length }, 'Default agents created');

    return agents;
  }

  /**
   * Get all agents for a project
   */
  async getByProject(projectId: string): Promise<Agent[]> {
    const log = logger.child({ method: 'getByProject', projectId });
    log.info('Fetching project agents');

    const result = await query<Agent>(
      'SELECT * FROM agents WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );

    // Parse linked_md_files from JSONB
    return result.rows.map(agent => ({
      ...agent,
      linked_md_files: agent.linked_md_files || [],
    }));
  }

  /**
   * Get an agent by ID
   */
  async getById(id: string): Promise<Agent | null> {
    const result = await query<Agent>(
      'SELECT * FROM agents WHERE id = $1',
      [id]
    );

    const agent = result.rows[0];
    if (!agent) {
      return null;
    }

    return {
      ...agent,
      linked_md_files: agent.linked_md_files || [],
    };
  }

  /**
   * Get an agent by ID and verify it belongs to user's project
   */
  async getByIdForUser(id: string, userId: string): Promise<Agent | null> {
    const result = await query<Agent>(
      `SELECT a.* FROM agents a
       JOIN projects p ON a.project_id = p.id
       WHERE a.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    const agent = result.rows[0];
    if (!agent) {
      return null;
    }

    return {
      ...agent,
      linked_md_files: agent.linked_md_files || [],
    };
  }

  /**
   * Update an agent
   */
  async update(
    id: string,
    userId: string,
    updates: {
      name?: string;
      system_prompt?: string;
      linked_md_files?: string[];
      session_id?: string | null;
    }
  ): Promise<Agent | null> {
    const log = logger.child({ method: 'updateAgent', agentId: id, userId });
    log.info('Updating agent');

    // Verify ownership
    const agent = await this.getByIdForUser(id, userId);
    if (!agent) {
      log.warn('Agent not found or not owned by user');
      return null;
    }

    // Validate system_prompt length
    if (updates.system_prompt !== undefined && updates.system_prompt.length > 10000) {
      throw new ValidationError('System prompt cannot exceed 10000 characters');
    }

    // Check for duplicate agent name in project
    if (updates.name !== undefined && updates.name !== agent.name) {
      const existingResult = await query<Agent>(
        'SELECT id FROM agents WHERE project_id = $1 AND name = $2 AND id != $3',
        [agent.project_id, updates.name, id]
      );

      if (existingResult.rows.length > 0) {
        throw new ValidationError('An agent with this name already exists in the project');
      }
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.system_prompt !== undefined) {
      updateFields.push(`system_prompt = $${paramIndex++}`);
      values.push(updates.system_prompt);
    }

    if (updates.linked_md_files !== undefined) {
      updateFields.push(`linked_md_files = $${paramIndex++}`);
      values.push(JSON.stringify(updates.linked_md_files));
    }

    if (updates.session_id !== undefined) {
      updateFields.push(`session_id = $${paramIndex++}`);
      values.push(updates.session_id);
    }

    if (updateFields.length === 0) {
      return agent;
    }

    values.push(id);

    const result = await query<Agent>(
      `UPDATE agents SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    const updatedAgent = result.rows[0];
    if (!updatedAgent) {
      return null;
    }
    log.info('Agent updated successfully');

    return {
      ...updatedAgent,
      linked_md_files: updatedAgent.linked_md_files || [],
    };
  }

  /**
   * Delete an agent
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const log = logger.child({ method: 'deleteAgent', agentId: id, userId });
    log.info('Deleting agent');

    // Verify ownership via join with projects
    const result = await query(
      `DELETE FROM agents
       WHERE id = $1
       AND project_id IN (SELECT id FROM projects WHERE user_id = $2)
       RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      log.warn('Agent not found or not owned by user');
      return false;
    }

    log.info('Agent deleted successfully');
    return true;
  }

  /**
   * Create a custom agent for a project
   */
  async create(
    projectId: string,
    userId: string,
    data: { name: string; system_prompt: string }
  ): Promise<Agent> {
    const log = logger.child({ method: 'createAgent', projectId, userId });
    log.info('Creating custom agent');

    // Verify user owns the project
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      throw new NotFoundError('Project not found');
    }

    // Validate system_prompt length
    if (data.system_prompt.length > 10000) {
      throw new ValidationError('System prompt cannot exceed 10000 characters');
    }

    // Check for duplicate agent name
    const existingResult = await query<Agent>(
      'SELECT id FROM agents WHERE project_id = $1 AND name = $2',
      [projectId, data.name]
    );

    if (existingResult.rows.length > 0) {
      throw new ValidationError('An agent with this name already exists in the project');
    }

    const result = await query<Agent>(
      `INSERT INTO agents (project_id, name, system_prompt, linked_md_files)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [projectId, data.name, data.system_prompt, JSON.stringify([])]
    );

    const agent = result.rows[0];
    if (!agent) {
      throw new Error('Failed to create agent');
    }
    log.info({ agentId: agent.id }, 'Custom agent created');

    return {
      ...agent,
      linked_md_files: [],
    };
  }
}

// Export singleton instance
export const agentService = new AgentService();
