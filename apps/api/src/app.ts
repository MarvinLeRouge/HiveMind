import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import multipart from '@fastify/multipart';
import prismaPlugin from './plugins/prisma.js';
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import collectionRoutes from './routes/collections.js';
import invitationRoutes from './routes/invitations.js';
import puzzleRoutes from './routes/puzzles.js';
import notesAttemptsRoutes from './routes/notes-attempts.js';
import importRoutes from './routes/import.js';

/**
 * Builds and configures the Fastify application instance.
 * Exported separately from the entry point to enable testing via fastify.inject().
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: env.NODE_ENV !== 'test',
  });

  // ── Schema validation ──────────────────────────────────────────────────────
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'HiveMind API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  await app.register(prismaPlugin);

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(templateRoutes, { prefix: '/templates' });
  await app.register(collectionRoutes, { prefix: '/collections' });
  await app.register(invitationRoutes, { prefix: '/invitations' });
  await app.register(puzzleRoutes, { prefix: '/collections' });
  await app.register(notesAttemptsRoutes, { prefix: '/puzzles' });
  await app.register(importRoutes, { prefix: '/collections' });

  return app;
}
