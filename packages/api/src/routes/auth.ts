import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../utils/jwt';
import { queryOne, query } from '../db/queries';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import { registerSchema, loginSchema } from '../utils/validation';

const auth: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      throw new ApiError(400, result.error.errors[0].message, 'VALIDATION_ERROR');
    }

    const { email, password, displayName } = result.data;

    const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      throw new ApiError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(password);

    const user = await queryOne<UserRow>(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at',
      [email, passwordHash, displayName || null]
    );

    if (!user) {
      throw new ApiError(500, 'Failed to create user', 'CREATE_USER_FAILED');
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    logger.info({ userId: user.id }, 'User registered');

    reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  });

  fastify.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      throw new ApiError(400, result.error.errors[0].message, 'VALIDATION_ERROR');
    }

    const { email, password } = result.data;

    const user = await queryOne<UserRow>(
      'SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1',
      [email]
    );

    if (!user) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    logger.info({ userId: user.id }, 'User logged in');

    reply.send({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  });

  fastify.post('/refresh', async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
    const { refresh_token } = request.body;
    if (!refresh_token) {
      throw new ApiError(400, 'Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }

    const tokenRow = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refresh_token]
    );

    if (!tokenRow) {
      throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await queryOne<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE id = $1',
      [tokenRow.user_id]
    );

    if (!user) {
      throw new ApiError(401, 'User not found', 'USER_NOT_FOUND');
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = generateAccessToken(tokenPayload);

    reply.send({
      access_token: newAccessToken,
    });
  });

  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new ApiError(401, 'Missing Authorization header', 'UNAUTHORIZED');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(401, 'Invalid Authorization header format', 'UNAUTHORIZED');
    }

    try {
      const payload = verifyAccessToken(parts[1]);
      const userInfo = await queryOne<{ id: string; email: string; display_name: string | null; created_at: Date }>(
        'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
        [payload.userId]
      );

      if (!userInfo) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
      }

      reply.send({
        id: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.display_name,
        createdAt: userInfo.created_at,
      });
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    }
  });
};

export default auth;

// Types
interface RegisterBody {
  email: string;
  password: string;
  displayName?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: Date;
}