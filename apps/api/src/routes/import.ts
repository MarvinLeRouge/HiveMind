import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { PuzzleRepository } from '../repositories/puzzle.repository.js';
import { GpxParserService } from '../services/gpx-parser.service.js';
import { GpxImportService } from '../services/gpx-import.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireOwner } from '../middlewares/requireOwner.js';
import { errorSchema } from './auth.schemas.js';
import { collectionIdParamSchema } from './collection.schemas.js';

const importResultSchema = z.object({ created: z.number() });

/**
 * Import routes — mounted under the /collections prefix.
 * Currently handles GPX pocket-query imports.
 */
export default async function importRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const parser = new GpxParserService();
  const importService = new GpxImportService(new PuzzleRepository(app.prisma));

  // ── POST /collections/:id/import/gpx ─────────────────────────────────────
  typed.post('/:id/import/gpx', {
    schema: {
      tags: ['import'],
      summary: 'Import puzzles from a GPX pocket-query file (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: {
        201: importResultSchema,
        400: errorSchema,
        403: errorSchema,
      },
      // No body schema — handled by @fastify/multipart
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      const buffer = await file.toBuffer();
      const xml = buffer.toString('utf-8');

      const waypoints = parser.parse(xml);
      const created = await importService.import(request.params.id, waypoints);

      return reply.status(201).send({ created });
    },
  });
}
