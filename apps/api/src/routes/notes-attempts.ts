import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { NoteRepository } from '../repositories/note.repository.js';
import { NoteService } from '../services/note.service.js';
import { AttemptRepository } from '../repositories/attempt.repository.js';
import { AttemptService } from '../services/attempt.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requirePuzzleMember } from '../middlewares/requirePuzzleMember.js';
import { errorSchema } from './auth.schemas.js';
import {
  puzzleIdParamSchema,
  noteParamSchema,
  createNoteBodySchema,
  updateNoteBodySchema,
  noteSchema,
  noteListSchema,
  createAttemptBodySchema,
  attemptSchema,
  attemptListSchema,
} from './notes-attempts.schemas.js';

/** Serializes a Note to the API response shape. */
function serializeNote(n: {
  id: string;
  puzzleId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

/** Serializes an Attempt to the API response shape. */
function serializeAttempt(a: {
  id: string;
  puzzleId: string;
  userId: string;
  valueTested: string;
  checkerResult: boolean;
  comment: string | null;
  createdAt: Date;
}) {
  return { ...a, createdAt: a.createdAt.toISOString() };
}

/**
 * Notes and attempts routes — all mounted under the /puzzles prefix.
 * Notes support CRUD (edit/delete restricted to the author).
 * Attempts are immutable after creation.
 */
export default async function notesAttemptsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const noteService = new NoteService(new NoteRepository(app.prisma));
  const attemptService = new AttemptService(new AttemptRepository(app.prisma));

  // ── GET /puzzles/:pid/notes ───────────────────────────────────────────────
  typed.get('/:pid/notes', {
    schema: {
      tags: ['notes'],
      summary: 'List notes for a puzzle (member only)',
      security: [{ bearerAuth: [] }],
      params: puzzleIdParamSchema,
      response: { 200: noteListSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requirePuzzleMember],
    handler: async (request, reply) => {
      const notes = await noteService.list(request.params.pid);
      return reply.send(notes.map(serializeNote));
    },
  });

  // ── POST /puzzles/:pid/notes ──────────────────────────────────────────────
  typed.post('/:pid/notes', {
    schema: {
      tags: ['notes'],
      summary: 'Add a note to a puzzle (member only)',
      security: [{ bearerAuth: [] }],
      params: puzzleIdParamSchema,
      body: createNoteBodySchema,
      response: { 201: noteSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requirePuzzleMember],
    handler: async (request, reply) => {
      const note = await noteService.add(
        request.params.pid,
        request.user.sub,
        request.body.content,
      );
      return reply.status(201).send(serializeNote(note));
    },
  });

  // ── PATCH /puzzles/:pid/notes/:nid ────────────────────────────────────────
  typed.patch('/:pid/notes/:nid', {
    schema: {
      tags: ['notes'],
      summary: 'Edit a note (author only)',
      security: [{ bearerAuth: [] }],
      params: noteParamSchema,
      body: updateNoteBodySchema,
      response: {
        200: noteSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [authenticate, requirePuzzleMember],
    handler: async (request, reply) => {
      const note = await noteService.update(
        request.params.pid,
        request.params.nid,
        request.user.sub,
        request.body.content,
      );
      return reply.send(serializeNote(note));
    },
  });

  // ── DELETE /puzzles/:pid/notes/:nid ───────────────────────────────────────
  typed.delete('/:pid/notes/:nid', {
    schema: {
      tags: ['notes'],
      summary: 'Delete a note (author only)',
      security: [{ bearerAuth: [] }],
      params: noteParamSchema,
      response: {
        204: z.object({}),
        403: errorSchema,
        404: errorSchema,
      },
    },
    preHandler: [authenticate, requirePuzzleMember],
    handler: async (request, reply) => {
      await noteService.delete(
        request.params.pid,
        request.params.nid,
        request.user.sub,
      );
      return reply.status(204).send({});
    },
  });

  // ── GET /puzzles/:pid/attempts ────────────────────────────────────────────
  typed.get('/:pid/attempts', {
    schema: {
      tags: ['attempts'],
      summary: 'List attempts for a puzzle (member only)',
      security: [{ bearerAuth: [] }],
      params: puzzleIdParamSchema,
      response: { 200: attemptListSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requirePuzzleMember],
    handler: async (request, reply) => {
      const attempts = await attemptService.list(request.params.pid);
      return reply.send(attempts.map(serializeAttempt));
    },
  });

  // ── POST /puzzles/:pid/attempts ───────────────────────────────────────────
  typed.post('/:pid/attempts', {
    schema: {
      tags: ['attempts'],
      summary: 'Record an attempt on a puzzle (member only)',
      security: [{ bearerAuth: [] }],
      params: puzzleIdParamSchema,
      body: createAttemptBodySchema,
      response: { 201: attemptSchema, 403: errorSchema, 404: errorSchema },
    },
    preHandler: [authenticate, requirePuzzleMember],
    handler: async (request, reply) => {
      const attempt = await attemptService.add(
        request.params.pid,
        request.user.sub,
        request.body,
      );
      return reply.status(201).send(serializeAttempt(attempt));
    },
  });
}
