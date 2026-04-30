import { z } from 'zod';
import { templateSchema } from './template.schemas.js';

// ── Params ────────────────────────────────────────────────────────────────────

export const collectionIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const memberParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

// ── Request bodies ────────────────────────────────────────────────────────────

export const createCollectionBodySchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  templateId: z.string().min(1),
});

export const updateCollectionBodySchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    description: z.string().max(512).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ── Response schemas ──────────────────────────────────────────────────────────

export const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdBy: z.string(),
  templateSnapshot: templateSchema,
  createdAt: z.string(),
});

export const collectionListSchema = z.array(collectionSchema);

export const memberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  joinedAt: z.string(),
});

export const memberListSchema = z.array(memberSchema);
