import { pool } from './pool';
import { logger } from '../utils/logger';

const MIGRATIONS = [
  {
    name: 'create_required_extensions',
    sql: `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS citext;
    `,
  },
  {
    name: 'create_oral_teacher_schema',
    sql: `
      CREATE SCHEMA IF NOT EXISTS oral_teacher;
    `,
  },
  {
    name: 'create_updated_at_function',
    sql: `
      CREATE OR REPLACE FUNCTION oral_teacher.set_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;
    `,
  },
  {
    name: 'create_media_assets_table',
    sql: `
      CREATE TABLE IF NOT EXISTS oral_teacher.media_assets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_type text,
        owner_id uuid,
        media_type text NOT NULL,
        bucket_type text NOT NULL DEFAULT 'local',
        relative_path text NOT NULL,
        mime_type text NOT NULL,
        file_size bigint,
        duration_ms integer,
        checksum text,
        storage_status text NOT NULL DEFAULT 'active',
        meta_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW(),
        deleted_at timestamptz
      );
    `,
  },
  {
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS oral_teacher.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email citext,
        phone text,
        password_hash text,
        display_name text NOT NULL,
        avatar_media_id uuid REFERENCES oral_teacher.media_assets(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'active',
        last_login_at timestamptz,
        extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW(),
        deleted_at timestamptz
      );
    `,
  },
  {
    name: 'create_auth_sessions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS oral_teacher.auth_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES oral_teacher.users(id) ON DELETE CASCADE,
        refresh_token_hash text NOT NULL,
        ip inet,
        user_agent text,
        expired_at timestamptz NOT NULL,
        revoked_at timestamptz,
        extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: 'create_auth_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_media_assets_owner
        ON oral_teacher.media_assets(owner_type, owner_id);
      CREATE INDEX IF NOT EXISTS idx_media_assets_status
        ON oral_teacher.media_assets(storage_status);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active
        ON oral_teacher.users(email)
        WHERE deleted_at IS NULL AND email IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_status
        ON oral_teacher.users(status);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
        ON oral_teacher.auth_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expired_at
        ON oral_teacher.auth_sessions(expired_at);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token_hash
        ON oral_teacher.auth_sessions(refresh_token_hash);
    `,
  },
  {
    name: 'create_updated_at_triggers',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_media_assets_set_updated_at'
            AND tgrelid = 'oral_teacher.media_assets'::regclass
        ) THEN
          CREATE TRIGGER trg_media_assets_set_updated_at
          BEFORE UPDATE ON oral_teacher.media_assets
          FOR EACH ROW EXECUTE FUNCTION oral_teacher.set_updated_at();
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_users_set_updated_at'
            AND tgrelid = 'oral_teacher.users'::regclass
        ) THEN
          CREATE TRIGGER trg_users_set_updated_at
          BEFORE UPDATE ON oral_teacher.users
          FOR EACH ROW EXECUTE FUNCTION oral_teacher.set_updated_at();
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_auth_sessions_set_updated_at'
            AND tgrelid = 'oral_teacher.auth_sessions'::regclass
        ) THEN
          CREATE TRIGGER trg_auth_sessions_set_updated_at
          BEFORE UPDATE ON oral_teacher.auth_sessions
          FOR EACH ROW EXECUTE FUNCTION oral_teacher.set_updated_at();
        END IF;
      END;
      $$;
    `,
  },
];

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const migration of MIGRATIONS) {
      await client.query(migration.sql);
      logger.info(`Migration passed: ${migration.name}`);
    }
  } finally {
    client.release();
  }
}
