import { describe, it, expect, vi } from 'vitest';
import { GpxImportService } from '../../src/services/gpx-import.service.js';
import type { PuzzleRepository } from '../../src/repositories/puzzle.repository.js';
import type { ParsedWaypoint } from '../../src/services/gpx-parser.service.js';

function makeRepo(): PuzzleRepository {
  return {
    findNextSortOrder: vi.fn().mockResolvedValue(5),
    createMany: vi
      .fn()
      .mockImplementation((data: unknown[]) => Promise.resolve(data.length)),
  } as unknown as PuzzleRepository;
}

const WAYPOINT: ParsedWaypoint = {
  title: 'Mystery #1',
  gcCode: 'GC12345',
  difficulty: 3,
  terrain: 2,
  coords: 'N 48° 51.000 E 002° 21.000',
  hint: 'Under the bench',
  sortOrder: 0,
};

describe('GpxImportService.import', () => {
  it('returns 0 without touching the repository when there are no waypoints', async () => {
    const repo = makeRepo();
    const service = new GpxImportService(repo);

    await expect(service.import('col-1', [])).resolves.toBe(0);
    expect(repo.findNextSortOrder).not.toHaveBeenCalled();
    expect(repo.createMany).not.toHaveBeenCalled();
  });

  it('creates puzzles with consecutive sort orders after the current maximum', async () => {
    const repo = makeRepo();
    const service = new GpxImportService(repo);

    const count = await service.import('col-1', [
      WAYPOINT,
      { ...WAYPOINT, title: 'Mystery #2', gcCode: 'GC67890' },
    ]);

    expect(count).toBe(2);
    expect(repo.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        collectionId: 'col-1',
        sortOrder: 5,
        gcCode: 'GC12345',
      }),
      expect.objectContaining({
        collectionId: 'col-1',
        sortOrder: 6,
        gcCode: 'GC67890',
      }),
    ]);
  });
});
