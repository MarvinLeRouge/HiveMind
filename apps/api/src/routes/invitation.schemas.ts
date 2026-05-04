import { z } from 'zod';

// ── Params ────────────────────────────────────────────────────────────────────

/** Route params containing an invitation ID. */
export const invitationIdParamSchema = z.object({
  id: z.string().uuid(),
});

// ── Request bodies ────────────────────────────────────────────────────────────

/** Request body for sending an invitation to a collection. */
export const sendInvitationBodySchema = z.object({
  email: z.string().email(),
});

// ── Response schemas ──────────────────────────────────────────────────────────

/** Response shape for an invitation resource. */
export const invitationSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  invitedBy: z.string(),
  inviteeEmail: z.string(),
  status: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
});
