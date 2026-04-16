import { z } from 'zod';

// ── Request schemas ──────────────────────────────────────────────────────────

export const registerBodySchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Response schemas ─────────────────────────────────────────────────────────

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  isAdmin: z.boolean(),
  createdAt: z.string(),
});

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

export const errorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
