import type { PrismaClient, User } from '@prisma/client';

/**
 * Data access layer for authentication.
 * Contains only Prisma queries — no business logic.
 */
export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds a user by their email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Finds a user by their unique ID.
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Creates a new user with the given data.
   */
  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Updates the preferred language for a user. Returns the updated user.
   */
  async updateLanguage(id: string, language: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { language } });
  }

  /**
   * Stores a hashed refresh token for server-side invalidation.
   */
  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  /**
   * Looks up a stored refresh token by its hash.
   * Returns null if not found or already expired.
   */
  async findRefreshToken(
    tokenHash: string,
  ): Promise<{ userId: string } | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
  }

  /**
   * Deletes a stored refresh token (used on refresh rotation and logout).
   * Silently succeeds if the token does not exist.
   */
  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken
      .delete({ where: { tokenHash } })
      .catch(() => undefined);
  }

  /**
   * Removes all expired refresh tokens for a given user (lazy cleanup).
   */
  async deleteExpiredRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    });
  }
}
