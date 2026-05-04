import { z } from 'zod';
import { templateSchema } from './template.schemas.js';

// ── Params ────────────────────────────────────────────────────────────────────

/** Route params containing a collection slug. */
export const collectionIdParamSchema = z.object({
  id: z.string().min(1),
});

/** Route params containing a collection ID and a member user ID. */
export const memberParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

// ── Request bodies ────────────────────────────────────────────────────────────

/** Request body for creating a collection. */
export const createCollectionBodySchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  templateId: z.string().min(1),
});

/** Request body for updating a collection (at least one field required). */
export const updateCollectionBodySchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    description: z.string().max(512).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ── Response schemas ──────────────────────────────────────────────────────────

/** Response shape for a collection resource (includes template snapshot). */
export const collectionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdBy: z.string(),
  templateSnapshot: templateSchema,
  createdAt: z.string(),
});

/** Response shape for a list of collections. */
export const collectionListSchema = z.array(collectionSchema);

/** Response shape for a collection member. */
export const memberSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  joinedAt: z.string(),
});

/** Response shape for a list of collection members. */
export const memberListSchema = z.array(memberSchema);
