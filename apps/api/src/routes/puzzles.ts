import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { PuzzleRepository } from '../repositories/puzzle.repository.js';
import { PuzzleService } from '../services/puzzle.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireMember } from '../middlewares/requireMember.js';
import { requireOwner } from '../middlewares/requireOwner.js';
import { errorSchema } from './auth.schemas.js';
import {
  puzzleParamsSchema,
  reorderBodySchema,
  createPuzzleBodySchema,
  updatePuzzleBodySchema,
  puzzleSchema,
  puzzleListSchema,
} from './puzzle.schemas.js';
import { collectionIdParamSchema } from './collection.schemas.js';

/** Serializes a FilteredPuzzle to the API response shape. */
function serializePuzzle(p: {
  id: string;
  collectionId: string;
  sortOrder: number;
  title: string;
  status: string;
  workingOnId: string | null;
  checkerUrl: string | null;
  updatedAt: Date;
  gcCode?: string | null;
  difficulty?: number | null;
  terrain?: number | null;
  coords?: string | null;
  hint?: string | null;
  spoiler?: string | null;
  customFields?: unknown;
}) {
  return { ...p, updatedAt: p.updatedAt.toISOString() };
}

/**
 * Puzzle routes — all mounted under the /collections prefix.
 * Handles CRUD, bulk reorder, and claim/unclaim.
 */
export default async function puzzleRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const service = new PuzzleService(new PuzzleRepository(app.prisma));

  // ── GET /collections/:id/puzzles ──────────────────────────────────────────
  typed.get('/:id/puzzles', {
    schema: {
      tags: ['puzzles'],
      summary: 'List puzzles in a collection (member only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: { 200: puzzleListSchema, 403: errorSchema },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      const puzzles = await service.list(request.params.id);
      return reply.send(puzzles.map(serializePuzzle));
    },
  });

  // ── GET /collections/:id/puzzles/:pid ─────────────────────────────────────
  typed.get('/:id/puzzles/:pid', {
    schema: {
      tags: ['puzzles'],
      summary: 'Get a puzzle by ID (member only)',
      security: [{ bearerAuth: [] }],
      params: puzzleParamsSchema,
      response: { 200: puzzleSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      const puzzle = await service.getById(
        request.params.id,
        request.params.pid,
      );
      return reply.send(serializePuzzle(puzzle));
    },
  });

  // ── POST /collections/:id/puzzles ─────────────────────────────────────────
  typed.post('/:id/puzzles', {
    schema: {
      tags: ['puzzles'],
      summary: 'Create a puzzle in a collection (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      body: createPuzzleBodySchema,
      response: { 201: puzzleSchema, 403: errorSchema },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      const puzzle = await service.create(request.params.id, request.body);
      return reply.status(201).send(serializePuzzle(puzzle));
    },
  });

  // ── PATCH /collections/:id/puzzles/reorder ────────────────────────────────
  // Must be registered before /:id/puzzles/:pid so Fastify routes the static
  // "reorder" segment before the parametric :pid.
  typed.patch('/:id/puzzles/reorder', {
    schema: {
      tags: ['puzzles'],
      summary: 'Bulk-reorder puzzles in a collection (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      body: reorderBodySchema,
      response: { 204: z.object({}), 403: errorSchema },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      await service.reorder(request.params.id, request.body.puzzles);
      return reply.status(204).send({});
    },
  });

  // ── PATCH /collections/:id/puzzles/:pid ───────────────────────────────────
  typed.patch('/:id/puzzles/:pid', {
    schema: {
      tags: ['puzzles'],
      summary: 'Update a puzzle (member only)',
      security: [{ bearerAuth: [] }],
      params: puzzleParamsSchema,
      body: updatePuzzleBodySchema,
      response: {
        200: puzzleSchema,
        403: errorSchema,
        404: errorSchema,
        422: errorSchema,
      },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      const puzzle = await service.update(
        request.params.id,
        request.params.pid,
        request.body,
      );
      return reply.send(serializePuzzle(puzzle));
    },
  });

  // ── DELETE /collections/:id/puzzles/:pid ──────────────────────────────────
  typed.delete('/:id/puzzles/:pid', {
    schema: {
      tags: ['puzzles'],
      summary: 'Delete a puzzle (owner only)',
      security: [{ bearerAuth: [] }],
      params: puzzleParamsSchema,
      response: { 204: z.object({}), 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      await service.delete(request.params.id, request.params.pid);
      return reply.status(204).send({});
    },
  });

  // ── POST /collections/:id/puzzles/:pid/claim ──────────────────────────────
  typed.post('/:id/puzzles/:pid/claim', {
    schema: {
      tags: ['puzzles'],
      summary: 'Claim a puzzle (set as working on it)',
      security: [{ bearerAuth: [] }],
      params: puzzleParamsSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
        409: errorSchema,
      },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      await service.claim(
        request.params.id,
        request.params.pid,
        request.user.sub,
      );
      return reply.status(204).send({});
    },
  });

  // ── DELETE /collections/:id/puzzles/:pid/claim ────────────────────────────
  typed.delete('/:id/puzzles/:pid/claim', {
    schema: {
      tags: ['puzzles'],
      summary: 'Release the claim on a puzzle',
      security: [{ bearerAuth: [] }],
      params: puzzleParamsSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [authenticate, requireMember],
    handler: async (request, reply) => {
      await service.unclaim(
        request.params.id,
        request.params.pid,
        request.user.sub,
      );
      return reply.status(204).send({});
    },
  });
}
