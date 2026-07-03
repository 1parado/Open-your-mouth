import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { loadConfig } from './config/loader';
import { registerLLMRoutes } from './routes/chat';
import { registerAudioRoutes } from './routes/audio';
import { registerPronunciationRoutes } from './routes/pronunciation';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error';

export async function createApp() {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.app.env === 'production' ? 'info' : 'debug',
      transport: config.app.env === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // Register plugins
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Register middleware
  app.addHook('onRequest', requestLogger);
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  const context = { config, logger: app.log };
  registerLLMRoutes(app, context);
  registerAudioRoutes(app, context);
  registerPronunciationRoutes(app, context);

  return app;
}
