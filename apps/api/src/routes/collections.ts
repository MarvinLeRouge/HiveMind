import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CollectionRepository } from '../repositories/collection.repository.js';
import { TemplateRepository } from '../repositories/template.repository.js';
import { CollectionService } from '../services/collection.service.js';
import { InvitationRepository } from '../repositories/invitation.repository.js';
import { InvitationService } from '../services/invitation.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireMember } from '../middlewares/requireMember.js';
import { requireOwner } from '../middlewares/requireOwner.js';
import { errorSchema } from './auth.schemas.js';
import {
  collectionIdParamSchema,
  collectionListSchema,
  collectionSchema,
  createCollectionBodySchema,
  memberListSchema,
  memberParamSchema,
  updateCollectionBodySchema,
} from './collection.schemas.js';
import {
  invitationSchema,
  sendInvitationBodySchema,
} from './invitation.schemas.js';

/** Serializes a CollectionRow to the API response shape. */
function serializeCollection(c: {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  templateSnapshot: {
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
  };
}) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    templateSnapshot: {
      ...c.templateSnapshot,
      createdAt: c.templateSnapshot.createdAt.toISOString(),
    },
  };
}

/**
 * Collection routes: list, get, create, update, delete, list members,
 * remove member, send invitation.
 */
export default async function collectionRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = new CollectionService(
    new CollectionRepository(app.prisma),
    new TemplateRepository(app.prisma),
  );
  const invitationService = new InvitationService(
    new InvitationRepository(app.prisma),
  );

  // ── GET /collections ──────────────────────────────────────────────────────
  typed.get('/', {
    schema: {
      tags: ['collections'],
      summary: 'List collections where the current user is a member',
      security: [{ bearerAuth: [] }],
      response: { 200: collectionListSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const collections = await service.list(request.user.sub);
      return reply.send(collections.map(serializeCollection));
    },
  });

  // ── GET /collections/:id ──────────────────────────────────────────────────
  typed.get('/:id', {
    schema: {
      tags: ['collections'],
      summary: 'Get a collection by ID (member only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: { 200: collectionSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      const collection = await service.getById(request.params.id);
      return reply.send(serializeCollection(collection));
    },
  });

  // ── POST /collections ─────────────────────────────────────────────────────
  typed.post('/', {
    schema: {
      tags: ['collections'],
      summary: 'Create a collection with a template snapshot',
      security: [{ bearerAuth: [] }],
      body: createCollectionBodySchema,
      response: { 201: collectionSchema, 404: errorSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const collection = await service.create(request.user.sub, request.body);
      return reply.status(201).send(serializeCollection(collection));
    },
  });

  // ── PATCH /collections/:id ────────────────────────────────────────────────
  typed.patch('/:id', {
    schema: {
      tags: ['collections'],
      summary: 'Update a collection (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      body: updateCollectionBodySchema,
      response: {
        200: collectionSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      const collection = await service.update(request.params.id, request.body);
      return reply.send(serializeCollection(collection));
    },
  });

  // ── DELETE /collections/:id ───────────────────────────────────────────────
  typed.delete('/:id', {
    schema: {
      tags: ['collections'],
      summary: 'Delete a collection (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: { 204: z.object({}), 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      await service.delete(request.params.id);
      return reply.status(204).send({});
    },
  });

  // ── GET /collections/:id/members ──────────────────────────────────────────
  typed.get('/:id/members', {
    schema: {
      tags: ['collections'],
      summary: 'List members of a collection (member only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: { 200: memberListSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      const members = await service.listMembers(request.params.id);
      return reply.send(
        members.map((m) => ({
          userId: m.userId,
          username: m.user.username,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
        })),
      );
    },
  });

  // ── DELETE /collections/:id/members/:userId ───────────────────────────────
  typed.delete('/:id/members/:userId', {
    schema: {
      tags: ['collections'],
      summary: 'Remove a member from a collection (owner only)',
      security: [{ bearerAuth: [] }],
      params: memberParamSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      await service.removeMember(request.params.id, request.params.userId);
      return reply.status(204).send({});
    },
  });

  // ── POST /collections/:id/invitations ─────────────────────────────────────
  typed.post('/:id/invitations', {
    schema: {
      tags: ['invitations'],
      summary: 'Send an invitation to a collection (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      body: sendInvitationBodySchema,
      response: { 201: invitationSchema, 403: errorSchema, 409: errorSchema },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      const invitation = await invitationService.sendInvitation(
        request.params.id,
        request.user.sub,
        request.body.email,
      );
      return reply.status(201).send({
        ...invitation,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt.toISOString(),
      });
    },
  });
}
