import { z } from 'zod';

// ── Request schemas ──────────────────────────────────────────────────────────

/** Request body for POST /auth/register. */
export const registerBodySchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

/** Request body for POST /auth/login. */
export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Response schemas ─────────────────────────────────────────────────────────

/** Response shape for a user resource. */
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  isAdmin: z.boolean(),
  createdAt: z.string(),
});

/** Response shape for a successful login or register (includes access token). */
export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

/** Standard error response shape used across all routes. */
export const errorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
