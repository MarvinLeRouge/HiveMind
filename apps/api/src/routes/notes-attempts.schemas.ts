import { z } from 'zod';

/** Route params containing a puzzle ID (used by notes and attempts routes). */
export const puzzleIdParamSchema = z.object({
  pid: z.string().uuid(),
});

/** Route params containing a puzzle ID and a note ID. */
export const noteParamSchema = z.object({
  pid: z.string().uuid(),
  nid: z.string().uuid(),
});

/** Request body for adding a note to a puzzle. */
export const createNoteBodySchema = z.object({
  content: z.string().min(1),
});

/** Request body for editing a note's content. */
export const updateNoteBodySchema = z.object({
  content: z.string().min(1),
});

/** Response shape for a note resource. */
export const noteSchema = z.object({
  id: z.string(),
  puzzleId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Response shape for a list of notes. */
export const noteListSchema = z.array(noteSchema);

/** Request body for recording an attempt on a puzzle. */
export const createAttemptBodySchema = z.object({
  valueTested: z.string().min(1),
  checkerResult: z.boolean(),
  comment: z.string().optional(),
});

/** Response shape for an attempt resource. Attempts are immutable after creation. */
export const attemptSchema = z.object({
  id: z.string(),
  puzzleId: z.string(),
  userId: z.string(),
  valueTested: z.string(),
  checkerResult: z.boolean(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

/** Response shape for a list of attempts. */
export const attemptListSchema = z.array(attemptSchema);
