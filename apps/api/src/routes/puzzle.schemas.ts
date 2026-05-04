import { z } from 'zod';

/** Route params containing a collection ID and a puzzle ID. */
export const puzzleParamsSchema = z.object({
  id: z.string().uuid(),
  pid: z.string().uuid(),
});

/** Request body for bulk-reordering puzzles. */
export const reorderBodySchema = z.object({
  puzzles: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

/** Request body for creating a puzzle. */
export const createPuzzleBodySchema = z.object({
  title: z.string().min(1).max(255),
  checkerUrl: z.string().url().optional(),
  gcCode: z.string().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  terrain: z.number().min(1).max(5).optional(),
  coords: z.string().optional(),
  hint: z.string().optional(),
  spoiler: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

/** Request body for partially updating a puzzle (at least one field required). */
export const updatePuzzleBodySchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    status: z.enum(['open', 'in_progress', 'solved', 'verified']).optional(),
    checkerUrl: z.string().url().nullable().optional(),
    gcCode: z.string().nullable().optional(),
    difficulty: z.number().min(1).max(5).nullable().optional(),
    terrain: z.number().min(1).max(5).nullable().optional(),
    coords: z.string().nullable().optional(),
    hint: z.string().nullable().optional(),
    spoiler: z.string().nullable().optional(),
    customFields: z.record(z.unknown()).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** Response shape for a puzzle resource (template-driven optional fields omitted when disabled). */
export const puzzleSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  sortOrder: z.number(),
  title: z.string(),
  status: z.string(),
  workingOnId: z.string().nullable(),
  checkerUrl: z.string().nullable(),
  updatedAt: z.string(),
  gcCode: z.string().nullable().optional(),
  difficulty: z.number().nullable().optional(),
  terrain: z.number().nullable().optional(),
  coords: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
  spoiler: z.string().nullable().optional(),
  customFields: z.unknown().optional(),
});

/** Response shape for a list of puzzles. */
export const puzzleListSchema = z.array(puzzleSchema);
