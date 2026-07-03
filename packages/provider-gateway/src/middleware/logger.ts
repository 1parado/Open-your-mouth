import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requestLogger(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now();

  // Use reply hook to log after response is sent
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;

    request.log.info({
      type: 'request',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
    });
  });
}
