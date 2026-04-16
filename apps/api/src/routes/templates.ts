import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { TemplateRepository } from '../repositories/template.repository.js';
import { TemplateService } from '../services/template.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  createTemplateBodySchema,
  templateAnyIdParamSchema,
  templateIdParamSchema,
  templateListSchema,
  templateSchema,
  updateTemplateBodySchema,
} from './template.schemas.js';
import { errorSchema } from './auth.schemas.js';

/** Serializes a Prisma Template to the API response shape. */
function serializeTemplate(t: {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isPublic: boolean;
  createdBy: string | null;
  useIndex: boolean;
  useGcCode: boolean;
  useDifficulty: boolean;
  useTerrain: boolean;
  useCoords: boolean;
  useHint: boolean;
  useSpoiler: boolean;
  customField1Label: string | null;
  customField2Label: string | null;
  createdAt: Date;
}) {
  return { ...t, createdAt: t.createdAt.toISOString() };
}

/**
 * Template routes: list, get, create (user + system), update (user + system), delete.
 */
export default async function templateRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = new TemplateService(new TemplateRepository(app.prisma));

  // ── GET /templates ────────────────────────────────────────────────────────
  typed.get('/', {
    schema: {
      tags: ['templates'],
      summary: 'List system, public, and own templates',
      security: [{ bearerAuth: [] }],
      response: { 200: templateListSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const templates = await service.list(request.user.sub);
      return reply.send(templates.map(serializeTemplate));
    },
  });

  // ── GET /templates/:id ────────────────────────────────────────────────────
  typed.get('/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Get a template by ID',
      security: [{ bearerAuth: [] }],
      params: templateIdParamSchema,
      response: { 200: templateSchema, 404: errorSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const template = await service.getById(request.params.id);
      return reply.send(serializeTemplate(template));
    },
  });

  // ── POST /templates ───────────────────────────────────────────────────────
  typed.post('/', {
    schema: {
      tags: ['templates'],
      summary: 'Create a user-owned template',
      security: [{ bearerAuth: [] }],
      body: createTemplateBodySchema,
      response: { 201: templateSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const template = await service.createUserTemplate(
        request.user.sub,
        request.body,
      );
      return reply.status(201).send(serializeTemplate(template));
    },
  });

  // ── PATCH /templates/:id ──────────────────────────────────────────────────
  typed.patch('/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Update own template',
      security: [{ bearerAuth: [] }],
      params: templateIdParamSchema,
      body: updateTemplateBodySchema,
      response: { 200: templateSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const template = await service.updateUserTemplate(
        request.user.sub,
        request.params.id,
        request.body,
      );
      return reply.send(serializeTemplate(template));
    },
  });

  // ── DELETE /templates/:id ─────────────────────────────────────────────────
  typed.delete('/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Delete own template',
      security: [{ bearerAuth: [] }],
      params: templateIdParamSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      await service.deleteUserTemplate(request.user.sub, request.params.id);
      return reply.status(204).send({});
    },
  });

  // ── POST /templates/system ────────────────────────────────────────────────
  typed.post('/system', {
    schema: {
      tags: ['templates'],
      summary: 'Create a system template (admin only)',
      security: [{ bearerAuth: [] }],
      body: createTemplateBodySchema,
      response: { 201: templateSchema, 403: errorSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const template = await service.createSystemTemplate(
        request.user.isAdmin,
        request.body,
      );
      return reply.status(201).send(serializeTemplate(template));
    },
  });

  // ── PATCH /templates/system/:id ───────────────────────────────────────────
  typed.patch('/system/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Update a system template (admin only)',
      security: [{ bearerAuth: [] }],
      params: templateAnyIdParamSchema,
      body: updateTemplateBodySchema,
      response: { 200: templateSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const template = await service.updateSystemTemplate(
        request.user.isAdmin,
        request.params.id,
        request.body,
      );
      return reply.send(serializeTemplate(template));
    },
  });
}
