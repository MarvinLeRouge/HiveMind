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
  language: z.string(),
  createdAt: z.string(),
});

/** Request body for PATCH /auth/me. */
export const patchMeBodySchema = z.object({
  language: z.enum(['en', 'fr']),
});

/** Request body for POST /auth/verify-email. */
export const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

/** Response shape for a successful login or token refresh (includes access token). */
export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

/** Response shape for a successful register (no token — email verification required). */
export const registerResponseSchema = z.object({
  message: z.string(),
  user: userSchema,
});

/** Standard error response shape used across all routes. */
export const errorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});
