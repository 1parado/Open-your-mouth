import { pool } from './pool';
import { logger } from '../utils/logger';

function hasErrorCode(error: unknown): error is { code?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

const MIGRATIONS = [
  // Create users table
  {
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
  },
  // Create refresh_tokens table
  {
    name: 'create_refresh_tokens_table',
    sql: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(512) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
  },
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const migration of MIGRATIONS) {
      try {
        await client.query(migration.sql);
        logger.info(`Migration passed: ${migration.name}`);
      } catch (err: unknown) {
        if (!hasErrorCode(err) || err.code !== '42P07') {
          throw err;
        }
        logger.info(`Skipped: ${migration.name} (already exists)`);
      }
    }
  } finally {
    client.release();
  }
}
