import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { PuzzleRepository } from '../repositories/puzzle.repository.js';
import { GpxParserService } from '../services/gpx-parser.service.js';
import { GpxImportService } from '../services/gpx-import.service.js';
import { CsvPreviewService } from '../services/csv-preview.service.js';
import { CsvImportService } from '../services/csv-import.service.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireOwner } from '../middlewares/requireOwner.js';
import { errorSchema } from './auth.schemas.js';
import { collectionIdParamSchema } from './collection.schemas.js';

const importResultSchema = z.object({ created: z.number() });

const csvPreviewSchema = z.object({
  columns: z.array(z.string()),
  // rows uses unknown because column names are dynamic (fast-json-stringify
  // does not support additionalProperties in serialization schemas)
  rows: z.array(z.unknown()),
});

/**
 * Import routes — mounted under the /collections prefix.
 * Handles GPX pocket-query and CSV imports.
 */
export default async function importRoutes(
  app: FastifyInstance,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const puzzleRepo = new PuzzleRepository(app.prisma);
  const parser = new GpxParserService();
  const gpxImportService = new GpxImportService(puzzleRepo);
  const csvPreviewService = new CsvPreviewService();
  const csvImportService = new CsvImportService(puzzleRepo);

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
      const created = await gpxImportService.import(
        request.params.id,
        waypoints,
      );

      return reply.status(201).send({ created });
    },
  });

  // ── POST /collections/:id/import/csv/preview ──────────────────────────────
  typed.post('/:id/import/csv/preview', {
    schema: {
      tags: ['import'],
      summary: 'Preview CSV columns and sample rows (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: { 200: csvPreviewSchema, 400: errorSchema, 403: errorSchema },
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

      const csv = (await file.toBuffer()).toString('utf-8');
      const preview = csvPreviewService.preview(csv);

      return reply.send(preview);
    },
  });

  // ── POST /collections/:id/import/csv ─────────────────────────────────────
  typed.post('/:id/import/csv', {
    schema: {
      tags: ['import'],
      summary:
        'Import puzzles from a CSV file with column mapping (owner only)',
      security: [{ bearerAuth: [] }],
      params: collectionIdParamSchema,
      response: {
        201: importResultSchema,
        400: errorSchema,
        403: errorSchema,
      },
    },
    preHandler: [authenticate, requireOwner],
    handler: async (request, reply) => {
      let csvContent: string | null = null;
      let mapping: Record<string, string> = {};

      for await (const part of request.parts()) {
        if (part.type === 'file' && part.fieldname === 'file') {
          csvContent = (await part.toBuffer()).toString('utf-8');
        } else if (part.type === 'field' && part.fieldname === 'mapping') {
          try {
            mapping = JSON.parse(String(part.value)) as Record<string, string>;
          } catch {
            return reply.status(400).send({
              statusCode: 400,
              error: 'Bad Request',
              message: 'Invalid mapping JSON',
            });
          }
        }
      }

      if (!csvContent) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'No file uploaded',
        });
      }

      const created = await csvImportService.import(
        request.params.id,
        csvContent,
        mapping,
      );

      return reply.status(201).send({ created });
    },
  });
}
