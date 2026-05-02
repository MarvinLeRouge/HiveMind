import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { InvitationRepository } from '../repositories/invitation.repository.js';
import { InvitationService } from '../services/invitation.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { errorSchema } from './auth.schemas.js';
import {
  invitationIdParamSchema,
  invitationSchema,
} from './invitation.schemas.js';
import { z } from 'zod';

/** Serializes a Prisma Invitation to the API response shape. */
function serializeInvitation(inv: {
  id: string;
  collectionId: string;
  invitedBy: string;
  inviteeEmail: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}) {
  return {
    ...inv,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
  };
}

/**
 * Invitation routes: get, accept, decline.
 * The send route lives in collections.ts (POST /collections/:id/invitations).
 */
export default async function invitationRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = new InvitationService(new InvitationRepository(app.prisma));

  // ── GET /invitations/:id ──────────────────────────────────────────────────
  typed.get('/:id', {
    schema: {
      tags: ['invitations'],
      summary: 'Get an invitation by ID',
      security: [{ bearerAuth: [] }],
      params: invitationIdParamSchema,
      response: { 200: invitationSchema, 404: errorSchema },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const invitation = await service.getById(request.params.id);
      return reply.send(serializeInvitation(invitation));
    },
  });

  // ── POST /invitations/:id/accept ──────────────────────────────────────────
  typed.post('/:id/accept', {
    schema: {
      tags: ['invitations'],
      summary: 'Accept an invitation',
      security: [{ bearerAuth: [] }],
      params: invitationIdParamSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
        410: errorSchema,
      },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      await service.accept(
        request.params.id,
        request.user.sub,
        request.user.email,
      );
      return reply.status(204).send({});
    },
  });

  // ── POST /invitations/:id/decline ─────────────────────────────────────────
  typed.post('/:id/decline', {
    schema: {
      tags: ['invitations'],
      summary: 'Decline an invitation',
      security: [{ bearerAuth: [] }],
      params: invitationIdParamSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
        410: errorSchema,
      },
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      await service.decline(
        request.params.id,
        request.user.sub,
        request.user.email,
      );
      return reply.status(204).send({});
    },
  });
}
