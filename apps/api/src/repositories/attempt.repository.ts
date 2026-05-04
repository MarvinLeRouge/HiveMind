import type { Attempt, PrismaClient } from '@prisma/client';

/** Input shape for recording an attempt. */
export interface CreateAttemptData {
  puzzleId: string;
  userId: string;
  valueTested: string;
  checkerResult: boolean;
  comment?: string;
}

/**
 * Data access layer for attempts.
 * Attempts are immutable after creation — no update or delete methods.
 */
export class AttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns all attempts for a puzzle, ordered by creation date ascending.
   */
  async findAllByPuzzle(puzzleId: string): Promise<Attempt[]> {
    return this.prisma.attempt.findMany({
      where: { puzzleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Creates a new attempt.
   */
  async create(data: CreateAttemptData): Promise<Attempt> {
    return this.prisma.attempt.create({ data });
  }
}
