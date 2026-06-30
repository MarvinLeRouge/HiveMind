import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

/** Valid values for a template field mode. */
export const fieldModeSchema = z.enum(['disabled', 'optional', 'required']);

// ── Shared field definitions ─────────────────────────────────────────────────

const templateFields = {
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  isPublic: z.boolean().optional(),
  indexMode: fieldModeSchema.optional(),
  gcCodeMode: fieldModeSchema.optional(),
  difficultyMode: fieldModeSchema.optional(),
  terrainMode: fieldModeSchema.optional(),
  coordsMode: fieldModeSchema.optional(),
  hintMode: fieldModeSchema.optional(),
  spoilerMode: fieldModeSchema.optional(),
  customField1Label: z.string().max(32).optional(),
  customField1Mode: fieldModeSchema.optional(),
  customField2Label: z.string().max(32).optional(),
  customField2Mode: fieldModeSchema.optional(),
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
  indexMode: z.string(),
  gcCodeMode: z.string(),
  difficultyMode: z.string(),
  terrainMode: z.string(),
  coordsMode: z.string(),
  hintMode: z.string(),
  spoilerMode: z.string(),
  customField1Label: z.string().nullable(),
  customField1Mode: z.string(),
  customField2Label: z.string().nullable(),
  customField2Mode: z.string(),
  createdAt: z.string(),
});

/** Response shape for a list of templates. */
export const templateListSchema = z.array(templateSchema);
