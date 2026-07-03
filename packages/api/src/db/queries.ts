import { pool } from './pool';
import { logger } from '../utils/logger';

export interface QueryConfig {
  text: string;
  values?: unknown[];
}

export async function query<T = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await pool.query(text, values);
    logger.info({ duration: Date.now() - start, rows: result.rowCount }, 'Query executed');
    return result.rows as T[];
  } catch (err) {
    logger.error({ err, query: text, duration: Date.now() - start }, 'Query failed');
    throw err;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] || null;
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}