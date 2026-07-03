import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { logger } from '../utils/logger';

export function requestLogger(request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): void {
  const start = Date.now();

  reply.raw.on('finish', () => {
    logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${Date.now() - start}ms`,
        ip: request.ip,
      },
      `${request.method} ${request.url} - ${reply.statusCode} (${Date.now() - start}ms)`
    );
  });

  done();
}