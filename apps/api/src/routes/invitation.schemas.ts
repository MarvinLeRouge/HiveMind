import { z } from 'zod';

// ── Params ────────────────────────────────────────────────────────────────────

export const invitationIdParamSchema = z.object({
  id: z.string().uuid(),
});

// ── Request bodies ────────────────────────────────────────────────────────────

export const sendInvitationBodySchema = z.object({
  email: z.string().email(),
});

// ── Response schemas ──────────────────────────────────────────────────────────

export const invitationSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  invitedBy: z.string(),
  inviteeEmail: z.string(),
  status: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
});
