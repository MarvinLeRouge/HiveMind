import type { Attempt } from '@prisma/client';
import type { AttemptRepository } from '../repositories/attempt.repository.js';

/**
 * Business logic for attempts.
 *
 * Attempts are immutable after creation — there is no update or delete.
 * Collection membership is enforced by the requirePuzzleMember preHandler.
 */
export class AttemptService {
  constructor(private readonly repo: AttemptRepository) {}

  /**
   * Returns all attempts for a puzzle.
   */
  async list(puzzleId: string): Promise<Attempt[]> {
    return this.repo.findAllByPuzzle(puzzleId);
  }

  /**
   * Records a new attempt for a puzzle.
   */
  async add(
    puzzleId: string,
    userId: string,
    data: { valueTested: string; checkerResult: boolean; comment?: string },
  ): Promise<Attempt> {
    return this.repo.create({ puzzleId, userId, ...data });
  }
}
