import { z } from 'zod';

export const puzzleIdParamSchema = z.object({
  pid: z.string().uuid(),
});

export const noteParamSchema = z.object({
  pid: z.string().uuid(),
  nid: z.string().uuid(),
});

export const createNoteBodySchema = z.object({
  content: z.string().min(1),
});

export const updateNoteBodySchema = z.object({
  content: z.string().min(1),
});

export const noteSchema = z.object({
  id: z.string(),
  puzzleId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const noteListSchema = z.array(noteSchema);

export const createAttemptBodySchema = z.object({
  valueTested: z.string().min(1),
  checkerResult: z.boolean(),
  comment: z.string().optional(),
});

export const attemptSchema = z.object({
  id: z.string(),
  puzzleId: z.string(),
  userId: z.string(),
  valueTested: z.string(),
  checkerResult: z.boolean(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export const attemptListSchema = z.array(attemptSchema);
