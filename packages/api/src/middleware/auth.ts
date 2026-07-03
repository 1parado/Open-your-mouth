import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verifyAccessToken, type TokenPayload } from '../utils/jwt';
import { ApiError } from './error';
import { logger } from '../utils/logger';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export function authenticate(request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' },
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid Authorization header format' },
    });
    return;
  }

  const token = parts[1];

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
    done();
  } catch (err) {
    logger.warn({ err }, 'Token verification failed');
    reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}