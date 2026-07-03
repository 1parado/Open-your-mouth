import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import { testConnection, runMigrations } from './db/migrations';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.addHook('onRequest', requestLogger);
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  return app;
}

export async function initializeDatabase(): Promise<void> {
  const connected = await testConnection();
  if (!connected) {
    throw new Error('Failed to connect to PostgreSQL');
  }
  await runMigrations();
}