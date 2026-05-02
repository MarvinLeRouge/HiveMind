import { describe, expect, it, vi } from 'vitest';
import type { Attempt } from '@prisma/client';
import { AttemptService } from '../../src/services/attempt.service.js';
import type { AttemptRepository } from '../../src/repositories/attempt.repository.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const puzzleId = 'puz-uuid-1';
const attemptId = 'att-uuid-1';
const userId = 'user-uuid-1';

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: attemptId,
    puzzleId,
    userId,
    valueTested: 'ABCDE',
    checkerResult: false,
    comment: null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeRepo(
  overrides: Partial<AttemptRepository> = {},
): AttemptRepository {
  return {
    findAllByPuzzle: vi.fn().mockResolvedValue([makeAttempt()]),
    create: vi.fn().mockResolvedValue(makeAttempt()),
    ...overrides,
  } as unknown as AttemptRepository;
}

// ── AttemptService.list ───────────────────────────────────────────────────────

describe('AttemptService.list', () => {
  it('returns all attempts for a puzzle', async () => {
    const service = new AttemptService(makeRepo());
    const result = await service.list(puzzleId);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(attemptId);
  });
});

// ── AttemptService.add ────────────────────────────────────────────────────────

describe('AttemptService.add', () => {
  it('creates an attempt with the correct data', async () => {
    const repo = makeRepo();
    const service = new AttemptService(repo);

    await service.add(puzzleId, userId, {
      valueTested: 'ABCDE',
      checkerResult: true,
      comment: 'Close!',
    });

    expect(repo.create).toHaveBeenCalledWith({
      puzzleId,
      userId,
      valueTested: 'ABCDE',
      checkerResult: true,
      comment: 'Close!',
    });
  });

  it('creates an attempt without a comment', async () => {
    const repo = makeRepo();
    const service = new AttemptService(repo);

    await service.add(puzzleId, userId, {
      valueTested: 'XYZ',
      checkerResult: false,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ puzzleId, userId, valueTested: 'XYZ' }),
    );
  });
});
