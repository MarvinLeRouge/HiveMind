import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { User } from '@prisma/client';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { MailerService } from './mailer.service.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;

/** Access and refresh token pair returned after successful authentication. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Public user fields returned by auth endpoints. */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  language: string;
  createdAt: Date;
}

/**
 * Business logic for authentication.
 * Depends on AuthRepository for data access, FastifyInstance for JWT signing,
 * and MailerService for sending verification emails.
 */
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly app: FastifyInstance,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Registers a new user and sends a verification email.
   * Throws 409 if the email is already in use.
   * The user cannot log in until they verify their email.
   */
  async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthUser> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw Object.assign(new Error('Email already in use'), {
        statusCode: 409,
      });
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await this.repo.create({
      username: data.username,
      email: data.email,
      passwordHash,
    });

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + parseDurationMs(env.VERIFICATION_TOKEN_EXPIRES_IN),
    );
    await this.repo.createVerificationToken(
      user.id,
      this.hashToken(rawToken),
      expiresAt,
    );
    await this.mailer.sendVerificationEmail({
      to: user.email,
      token: rawToken,
    });

    return this.toAuthUser(user);
  }

  /**
   * Verifies a user's email using the token from the verification link.
   * Throws 400 if the token is invalid or expired.
   * Returns the updated user after marking their email as verified.
   */
  async verifyEmail(rawToken: string): Promise<AuthUser> {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.repo.findVerificationToken(tokenHash);
    if (!record) {
      throw Object.assign(new Error('Invalid or expired verification token'), {
        statusCode: 400,
      });
    }

    const user = await this.repo.markEmailVerified(record.userId);
    await this.repo.deleteVerificationTokensByUser(record.userId);

    return this.toAuthUser(user);
  }

  /**
   * Validates credentials and returns a token pair.
   * Stores a hashed refresh token for server-side invalidation.
   * Throws 401 if credentials are invalid.
   */
  async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const user = await this.repo.findByEmail(data.email);
    if (!user) {
      throw this.unauthorized('Invalid email or password');
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw this.unauthorized('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw Object.assign(
        new Error(
          'Please verify your email address before logging in. Check your inbox for the verification link.',
        ),
        { statusCode: 403 },
      );
    }

    const tokens = this.signTokens(user);
    const decoded = this.app.jwt.decode<{ exp: number }>(tokens.refreshToken);
    if (!decoded) throw new Error('Failed to decode refresh token');
    await this.repo.createRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      new Date(decoded.exp * 1000),
    );

    return { user: this.toAuthUser(user), tokens };
  }

  /**
   * Verifies a refresh token, rotates it (deletes old, stores new), and
   * returns a new token pair. Throws 401 if the token is invalid, revoked,
   * or the user no longer exists.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string };
    try {
      payload = this.app.jwt.verify<{ sub: string }>(refreshToken, {
        key: env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw this.unauthorized('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.repo.findRefreshToken(tokenHash);
    if (!stored) {
      throw this.unauthorized('Refresh token has been revoked');
    }

    const user = await this.repo.findById(payload.sub);
    if (!user) {
      throw this.unauthorized('User not found');
    }

    const tokens = this.signTokens(user);
    const decoded = this.app.jwt.decode<{ exp: number }>(tokens.refreshToken);
    if (!decoded) throw new Error('Failed to decode refresh token');

    await this.repo.deleteRefreshToken(tokenHash);
    await this.repo.createRefreshToken(
      user.id,
      this.hashToken(tokens.refreshToken),
      new Date(decoded.exp * 1000),
    );
    await this.repo.deleteExpiredRefreshTokens(user.id);

    return tokens;
  }

  /**
   * Invalidates the stored refresh token. Called on logout.
   * Silently succeeds if the token is not found (already revoked).
   */
  async logout(refreshToken: string): Promise<void> {
    await this.repo.deleteRefreshToken(this.hashToken(refreshToken));
  }

  /**
   * Returns the authenticated user's profile.
   * Throws 401 if the user no longer exists.
   */
  async me(userId: string): Promise<AuthUser> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw this.unauthorized('User not found');
    }
    return this.toAuthUser(user);
  }

  /**
   * Updates the preferred language for the authenticated user.
   * Throws 400 if the language code is invalid.
   * Throws 401 if the user no longer exists.
   */
  async updateLanguage(userId: string, language: string): Promise<AuthUser> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw this.unauthorized('User not found');
    }
    const updated = await this.repo.updateLanguage(userId, language);
    return this.toAuthUser(updated);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signTokens(user: User): TokenPair {
    const payload = { sub: user.id, email: user.email, isAdmin: user.isAdmin };

    const accessToken = this.app.jwt.sign(payload, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    // jti ensures uniqueness even when two tokens are signed in the same second
    const refreshToken = this.app.jwt.sign(
      { ...payload, jti: randomUUID() },
      { key: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_EXPIRES_IN },
    );

    return { accessToken, refreshToken };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      language: user.language,
      createdAt: user.createdAt,
    };
  }

  private unauthorized(message: string): Error {
    return Object.assign(new Error(message), { statusCode: 401 });
  }
}

/** Parses a duration string like "24h", "7d", "30m" into milliseconds. */
function parseDurationMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
  if (!match) throw new Error(`Invalid duration format: "${duration}"`);
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[match[2]];
}
