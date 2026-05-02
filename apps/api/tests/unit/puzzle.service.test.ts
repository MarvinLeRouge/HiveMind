import { describe, expect, it, vi } from 'vitest';
import { PuzzleService } from '../../src/services/puzzle.service.js';
import type {
  PuzzleRepository,
  PuzzleRow,
} from '../../src/repositories/puzzle.repository.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const collectionId = 'col-uuid-1';
const puzzleId = 'puz-uuid-1';
const userId = 'user-uuid-1';
const otherId = 'user-uuid-2';

const allFlags = {
  useIndex: true,
  useGcCode: true,
  useDifficulty: true,
  useTerrain: true,
  useCoords: true,
  useHint: true,
  useSpoiler: true,
  customField1Label: 'Field 1',
  customField2Label: null,
};

function makePuzzle(overrides: Partial<PuzzleRow> = {}): PuzzleRow {
  return {
    id: puzzleId,
    collectionId,
    sortOrder: 0,
    title: 'Test Puzzle',
    status: 'open',
    workingOnId: null,
    checkerUrl: null,
    gcCode: 'GC12345',
    difficulty: 3,
    terrain: 2,
    coords: '48.0,2.0',
    hint: 'Look up',
    spoiler: 'Under the rock',
    customFields: { field1: 'val' },
    updatedAt: new Date('2025-01-01'),
    collection: { templateSnapshot: allFlags },
    ...overrides,
  };
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<PuzzleRepository> = {}): PuzzleRepository {
  return {
    findAllByCollection: vi.fn().mockResolvedValue([makePuzzle()]),
    findById: vi.fn().mockResolvedValue(null),
    findNextSortOrder: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue(makePuzzle()),
    update: vi.fn().mockResolvedValue(makePuzzle()),
    delete: vi.fn().mockResolvedValue(undefined),
    reorder: vi.fn().mockResolvedValue(undefined),
    setClaim: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as PuzzleRepository;
}

// ── PuzzleService.list ────────────────────────────────────────────────────────

describe('PuzzleService.list', () => {
  it('returns filtered puzzles from the repository', async () => {
    const service = new PuzzleService(makeRepo());
    const result = await service.list(collectionId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(puzzleId);
    expect(result[0].gcCode).toBe('GC12345');
  });

  it('omits fields disabled in the template snapshot', async () => {
    const puzzle = makePuzzle({
      collection: {
        templateSnapshot: { ...allFlags, useGcCode: false, useHint: false },
      },
    });
    const repo = makeRepo({
      findAllByCollection: vi.fn().mockResolvedValue([puzzle]),
    });
    const service = new PuzzleService(repo);

    const [result] = await service.list(collectionId);

    expect(result.gcCode).toBeUndefined();
    expect(result.hint).toBeUndefined();
    expect(result.difficulty).toBeDefined();
  });
});

// ── PuzzleService.getById ─────────────────────────────────────────────────────

describe('PuzzleService.getById', () => {
  it('returns the filtered puzzle when found', async () => {
    const puzzle = makePuzzle();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    const result = await service.getById(collectionId, puzzleId);

    expect(result.id).toBe(puzzleId);
    expect(result.gcCode).toBe('GC12345');
  });

  it('throws 404 when the puzzle does not exist', async () => {
    const service = new PuzzleService(makeRepo());

    await expect(
      service.getById(collectionId, 'unknown'),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ── PuzzleService.create ──────────────────────────────────────────────────────

describe('PuzzleService.create', () => {
  it('creates a puzzle with auto-assigned sortOrder', async () => {
    const repo = makeRepo({ findNextSortOrder: vi.fn().mockResolvedValue(5) });
    const service = new PuzzleService(repo);

    await service.create(collectionId, { title: 'New Puzzle' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionId,
        sortOrder: 5,
        title: 'New Puzzle',
      }),
    );
  });
});

// ── PuzzleService.update ──────────────────────────────────────────────────────

describe('PuzzleService.update', () => {
  it('throws 404 when the puzzle does not exist', async () => {
    const service = new PuzzleService(makeRepo());

    await expect(
      service.update(collectionId, 'unknown', { title: 'x' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows a valid forward status transition', async () => {
    const puzzle = makePuzzle({ status: 'open' });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await service.update(collectionId, puzzleId, { status: 'in_progress' });

    expect(repo.update).toHaveBeenCalledWith(
      puzzleId,
      expect.objectContaining({ status: 'in_progress' }),
    );
  });

  it('throws 422 for an invalid status transition', async () => {
    const puzzle = makePuzzle({ status: 'open' });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await expect(
      service.update(collectionId, puzzleId, { status: 'solved' }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws 422 for a backward status transition', async () => {
    const puzzle = makePuzzle({ status: 'in_progress' });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await expect(
      service.update(collectionId, puzzleId, { status: 'open' }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});

// ── PuzzleService.delete ──────────────────────────────────────────────────────

describe('PuzzleService.delete', () => {
  it('throws 404 when the puzzle does not exist', async () => {
    const service = new PuzzleService(makeRepo());

    await expect(service.delete(collectionId, 'unknown')).rejects.toMatchObject(
      {
        statusCode: 404,
      },
    );
  });

  it('calls repo.delete when the puzzle exists', async () => {
    const puzzle = makePuzzle();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await service.delete(collectionId, puzzleId);

    expect(repo.delete).toHaveBeenCalledWith(puzzleId);
  });
});

// ── PuzzleService.reorder ─────────────────────────────────────────────────────

describe('PuzzleService.reorder', () => {
  it('delegates to repo.reorder with the correct arguments', async () => {
    const repo = makeRepo();
    const service = new PuzzleService(repo);
    const items = [{ id: puzzleId, sortOrder: 2 }];

    await service.reorder(collectionId, items);

    expect(repo.reorder).toHaveBeenCalledWith(collectionId, items);
  });
});

// ── PuzzleService.claim ───────────────────────────────────────────────────────

describe('PuzzleService.claim', () => {
  it('sets workingOnId when the puzzle is unclaimed', async () => {
    const puzzle = makePuzzle({ workingOnId: null });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await service.claim(collectionId, puzzleId, userId);

    expect(repo.setClaim).toHaveBeenCalledWith(puzzleId, userId);
  });

  it('throws 409 when the puzzle is already claimed', async () => {
    const puzzle = makePuzzle({ workingOnId: otherId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await expect(
      service.claim(collectionId, puzzleId, userId),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 404 when the puzzle does not exist', async () => {
    const service = new PuzzleService(makeRepo());

    await expect(
      service.claim(collectionId, 'unknown', userId),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ── PuzzleService.unclaim ─────────────────────────────────────────────────────

describe('PuzzleService.unclaim', () => {
  it('clears workingOnId when the current user is the claimant', async () => {
    const puzzle = makePuzzle({ workingOnId: userId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await service.unclaim(collectionId, puzzleId, userId);

    expect(repo.setClaim).toHaveBeenCalledWith(puzzleId, null);
  });

  it('throws 403 when the current user is not the claimant', async () => {
    const puzzle = makePuzzle({ workingOnId: otherId });
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(puzzle) });
    const service = new PuzzleService(repo);

    await expect(
      service.unclaim(collectionId, puzzleId, userId),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 404 when the puzzle does not exist', async () => {
    const service = new PuzzleService(makeRepo());

    await expect(
      service.unclaim(collectionId, 'unknown', userId),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
