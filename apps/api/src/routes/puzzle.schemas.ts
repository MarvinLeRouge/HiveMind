import { z } from 'zod';

export const puzzleParamsSchema = z.object({
  id: z.string().uuid(),
  pid: z.string().uuid(),
});

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

export const puzzleListSchema = z.array(puzzleSchema);
