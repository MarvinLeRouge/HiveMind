import { z } from 'zod';

// ── Shared field definitions ─────────────────────────────────────────────────

const templateFields = {
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  isPublic: z.boolean().optional(),
  useIndex: z.boolean().optional(),
  useGcCode: z.boolean().optional(),
  useDifficulty: z.boolean().optional(),
  useTerrain: z.boolean().optional(),
  useCoords: z.boolean().optional(),
  useHint: z.boolean().optional(),
  useSpoiler: z.boolean().optional(),
  customField1Label: z.string().max(32).optional(),
  customField2Label: z.string().max(32).optional(),
};

// ── Request schemas ──────────────────────────────────────────────────────────

/** Request body for creating a template. */
export const createTemplateBodySchema = z.object(templateFields);

/** Request body for updating a template (at least one field required). */
export const updateTemplateBodySchema = z
  .object(templateFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** Route params for a user-owned template (UUID). */
export const templateIdParamSchema = z.object({
  id: z.string().uuid(),
});

/** Route params that accept any template ID (UUID or string slug for system templates). */
export const templateAnyIdParamSchema = z.object({
  id: z.string().min(1),
});

// ── Response schemas ─────────────────────────────────────────────────────────

/** Response shape for a template resource. */
export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  isPublic: z.boolean(),
  createdBy: z.string().nullable(),
  useIndex: z.boolean(),
  useGcCode: z.boolean(),
  useDifficulty: z.boolean(),
  useTerrain: z.boolean(),
  useCoords: z.boolean(),
  useHint: z.boolean(),
  useSpoiler: z.boolean(),
  customField1Label: z.string().nullable(),
  customField2Label: z.string().nullable(),
  createdAt: z.string(),
});

/** Response shape for a list of templates. */
export const templateListSchema = z.array(templateSchema);
