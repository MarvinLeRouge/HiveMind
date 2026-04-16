import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AuthRepository } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { env } from '../config/env.js';
import {
  errorSchema,
  loginBodySchema,
  registerBodySchema,
  tokenResponseSchema,
  userSchema,
} from './auth.schemas.js';

const REFRESH_COOKIE = 'refreshToken';

/**
 * Authentication routes: register, login, refresh, logout, me.
 */
export default async function authRoutes(app: FastifyInstance): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = new AuthService(new AuthRepository(app.prisma), app);

  // ── POST /auth/register ──────────────────────────────────────────────────
  typed.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Create a new account',
      body: registerBodySchema,
      response: {
        201: tokenResponseSchema,
        409: errorSchema,
      },
    },
    handler: async (request, reply) => {
      const user = await service.register(request.body);
      const { tokens } = await service.login({
        email: request.body.email,
        password: request.body.password,
      });
      setRefreshCookie(reply, tokens.refreshToken);
      return reply.status(201).send({
        accessToken: tokens.accessToken,
        user: { ...user, createdAt: user.createdAt.toISOString() },
      });
    },
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────
  typed.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login and receive tokens',
      body: loginBodySchema,
      response: {
        200: tokenResponseSchema,
        401: errorSchema,
      },
    },
    handler: async (request, reply) => {
      const { user, tokens } = await service.login(request.body);
      setRefreshCookie(reply, tokens.refreshToken);
      return reply.send({
        accessToken: tokens.accessToken,
        user: { ...user, createdAt: user.createdAt.toISOString() },
      });
    },
  });

  // ── POST /auth/refresh ───────────────────────────────────────────────────
  typed.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Rotate tokens using the refresh cookie',
      response: {
        200: z.object({ accessToken: z.string() }),
        401: errorSchema,
      },
    },
    handler: async (request, reply) => {
      const token: string | undefined = request.cookies[REFRESH_COOKIE];
      if (!token) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing refresh token cookie',
        });
      }
      const tokens = await service.refresh(token);
      setRefreshCookie(reply, tokens.refreshToken);
      return reply.send({ accessToken: tokens.accessToken });
    },
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────
  typed.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Logout and clear the refresh cookie',
      security: [{ bearerAuth: [] }],
      response: {
        204: z.object({}),
        401: errorSchema,
      },
    },
    preHandler: authenticate,
    handler: async (_request, reply) => {
      reply.clearCookie(REFRESH_COOKIE, { path: '/' });
      return reply.status(204).send({});
    },
  });

  // ── GET /auth/me ─────────────────────────────────────────────────────────
  typed.get('/me', {
    schema: {
      tags: ['auth'],
      summary: 'Get current authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: userSchema,
        401: errorSchema,
      },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const user = await service.me(request.user.sub);
      return reply.send({ ...user, createdAt: user.createdAt.toISOString() });
    },
  });
}

// ── Cookie helper ────────────────────────────────────────────────────────────

function setRefreshCookie(
  reply: import('fastify').FastifyReply,
  token: string,
): void {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(Date.now() + sevenDays),
  });
}
