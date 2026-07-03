import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { hashPassword, comparePassword } from '../utils/hash';
import {
  REFRESH_TOKEN_TTL_MS,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { queryOne, query } from '../db/queries';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import { registerSchema, loginSchema } from '../utils/validation';

function getDefaultDisplayName(email: string): string {
  return email.split('@')[0] || email;
}

async function persistRefreshToken(
  userId: string,
  refreshToken: string,
  request: FastifyRequest,
): Promise<void> {
  const userAgent = request.headers['user-agent'];

  await query(
    `INSERT INTO auth_sessions (user_id, refresh_token_hash, ip, user_agent, expired_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      hashRefreshToken(refreshToken),
      request.ip,
      Array.isArray(userAgent) ? userAgent.join(', ') : userAgent ?? null,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    ],
  );
}

const auth: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      throw new ApiError(400, result.error.errors[0].message, 'VALIDATION_ERROR');
    }

    const { email, password, displayName } = result.data;

    const existing = await queryOne<UserRow>(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );
    if (existing) {
      throw new ApiError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(password);

    const user = await queryOne<UserRow>(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at',
      [email, passwordHash, displayName || getDefaultDisplayName(email)],
    );

    if (!user) {
      throw new ApiError(500, 'Failed to create user', 'CREATE_USER_FAILED');
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await persistRefreshToken(user.id, refreshToken, request);

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
      `SELECT id, email, password_hash, display_name, created_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL AND status = 'active'`,
      [email],
    );

    if (!user || !user.password_hash) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    await persistRefreshToken(user.id, refreshToken, request);

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
    const refreshToken = request.body?.refresh_token;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }

    let payload: { userId: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const tokenRow = await queryOne<{ user_id: string }>(
      `SELECT user_id
       FROM auth_sessions
       WHERE refresh_token_hash = $1
         AND expired_at > NOW()
         AND revoked_at IS NULL`,
      [hashRefreshToken(refreshToken)],
    );

    if (!tokenRow || tokenRow.user_id !== payload.userId) {
      throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await queryOne<{ id: string; email: string }>(
      `SELECT id, email
       FROM users
       WHERE id = $1 AND deleted_at IS NULL AND status = 'active'`,
      [tokenRow.user_id],
    );

    if (!user) {
      throw new ApiError(401, 'User not found', 'USER_NOT_FOUND');
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });

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

    let payload: { userId: string; email: string };
    try {
      payload = verifyAccessToken(parts[1]);
    } catch {
      throw new ApiError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    }

    const userInfo = await queryOne<{ id: string; email: string; display_name: string | null; created_at: Date }>(
      `SELECT id, email, display_name, created_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL AND status = 'active'`,
      [payload.userId],
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
