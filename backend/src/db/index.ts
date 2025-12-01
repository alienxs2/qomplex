/**
 * PostgreSQL Database Connection Pool
 */

import pg from 'pg';
import logger from '../logger.js';

const { Pool } = pg;

// Database connection configuration from environment
const connectionConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://qomplex:password@localhost:5432/qomplex',
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
};

// Create connection pool
export const pool = new Pool(connectionConfig);

// Log pool events
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error({ error: err.message }, 'Unexpected database pool error');
});

/**
 * Execute a query with the pool
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  logger.debug({
    query: text.substring(0, 100),
    duration: `${duration}ms`,
    rows: result.rowCount,
  }, 'Query executed');

  return result;
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<pg.PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Execute a function within a transaction
 */
export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  logger.info('Running database migrations...');

  try {
    // Create migrations tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of executed migrations
    const result = await pool.query<{ name: string }>('SELECT name FROM migrations');
    const executedMigrations = new Set(result.rows.map(r => r.name));

    // Import and run migrations
    const migrations = await import('./migrations/001_initial.js');

    for (const [name, sql] of Object.entries(migrations.default)) {
      if (!executedMigrations.has(name)) {
        logger.info({ migration: name }, 'Executing migration');
        await pool.query(sql as string);
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
        logger.info({ migration: name }, 'Migration completed');
      }
    }

    logger.info('All migrations completed');
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    throw error;
  }
}

/**
 * Close the database pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}
