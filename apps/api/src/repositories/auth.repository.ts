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

  /**
   * Stores a hashed email verification token for the given user.
   */
  async createVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.verificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  /**
   * Looks up a verification token by its hash.
   * Returns null if not found or already expired.
   */
  async findVerificationToken(
    tokenHash: string,
  ): Promise<{ userId: string } | null> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });
    if (!record) return null;
    if (record.expiresAt < new Date()) {
      await this.prisma.verificationToken.delete({ where: { tokenHash } });
      return null;
    }
    return { userId: record.userId };
  }

  /**
   * Deletes a verification token after use.
   * Silently succeeds if the token does not exist.
   */
  async deleteVerificationToken(tokenHash: string): Promise<void> {
    await this.prisma.verificationToken
      .delete({ where: { tokenHash } })
      .catch(() => undefined);
  }

  /**
   * Marks a user's email as verified.
   */
  async markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  /**
   * Removes all verification tokens for the given user (cleanup on verify).
   */
  async deleteVerificationTokensByUser(userId: string): Promise<void> {
    await this.prisma.verificationToken.deleteMany({ where: { userId } });
  }
}
