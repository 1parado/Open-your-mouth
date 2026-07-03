import { Pool } from 'pg';
import { logger } from '../utils/logger';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'oral_teacher',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  port: parseInt(process.env.DB_PORT || '5432'),
  options: '-c search_path=oral_teacher,public',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  logger.error({ err }, 'PostgreSQL pool error');
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now');
    client.release();
    logger.info(`PostgreSQL connected at ${result.rows[0].now}`);
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL');
    return false;
  }
}
