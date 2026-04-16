import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { User } from '@prisma/client';
import type { AuthRepository } from '../repositories/auth.repository.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

/**
 * Business logic for authentication.
 * Depends on AuthRepository for data access and FastifyInstance for JWT signing.
 */
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly app: FastifyInstance,
  ) {}

  /**
   * Registers a new user. Throws 409 if email is already in use.
   */
  async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthUser> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      const err = Object.assign(new Error('Email already in use'), {
        statusCode: 409,
      });
      throw err;
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await this.repo.create({
      username: data.username,
      email: data.email,
      passwordHash,
    });

    return this.toAuthUser(user);
  }

  /**
   * Validates credentials and returns a token pair.
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

    return { user: this.toAuthUser(user), tokens: this.signTokens(user) };
  }

  /**
   * Verifies a refresh token and returns a new token pair.
   * Throws 401 if the token is invalid or the user no longer exists.
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

    const user = await this.repo.findById(payload.sub);
    if (!user) {
      throw this.unauthorized('User not found');
    }

    return this.signTokens(user);
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

  // ── Private helpers ────────────────────────────────────────────────────────

  private signTokens(user: User): TokenPair {
    const payload = { sub: user.id, email: user.email, isAdmin: user.isAdmin };

    const accessToken = this.app.jwt.sign(payload, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = this.app.jwt.sign(payload, {
      key: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };
  }

  private unauthorized(message: string): Error {
    return Object.assign(new Error(message), { statusCode: 401 });
  }
}
