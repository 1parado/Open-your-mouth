import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const logger = request.log;

  logger.error({
    type: 'unhandled_error',
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  // Don't expose internal errors in production
  const isDev = process.env.NODE_ENV !== 'production';

  reply.status(500).send({
    error: {
      message: isDev ? error.message : 'Internal server error',
      type: 'internal_error',
      code: 500,
    },
  });
}
