import { describe, expect, it, vi } from 'vitest';
import { CsvImportService } from '../../src/services/csv-import.service.js';
import type { PuzzleRepository } from '../../src/repositories/puzzle.repository.js';

const collectionId = 'col-uuid-1';

const SIMPLE_CSV = `title,gcCode,difficulty,terrain
Cache A,GC11111,2,1.5
Cache B,GC22222,3,2`;

const MAPPING = {
  title: 'title',
  gcCode: 'gcCode',
  difficulty: 'difficulty',
  terrain: 'terrain',
};

function makeRepo(overrides: Partial<PuzzleRepository> = {}): PuzzleRepository {
  return {
    findNextSortOrder: vi.fn().mockResolvedValue(0),
    createMany: vi.fn().mockResolvedValue(2),
    ...overrides,
  } as unknown as PuzzleRepository;
}

describe('CsvImportService.import', () => {
  it('creates puzzles from a valid CSV with mapping', async () => {
    const repo = makeRepo();
    const service = new CsvImportService(repo);

    const count = await service.import(collectionId, SIMPLE_CSV, MAPPING);

    expect(count).toBe(2);
    expect(repo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          collectionId,
          title: 'Cache A',
          gcCode: 'GC11111',
          difficulty: 2,
          terrain: 1.5,
          sortOrder: 0,
        }),
        expect.objectContaining({
          title: 'Cache B',
          sortOrder: 1,
        }),
      ]),
    );
  });

  it('parses numeric fields as numbers', async () => {
    const repo = makeRepo();
    const service = new CsvImportService(repo);

    await service.import(collectionId, SIMPLE_CSV, MAPPING);

    const [[puzzles]] = (repo.createMany as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(puzzles[0].difficulty).toBe(2);
    expect(puzzles[0].terrain).toBe(1.5);
  });

  it('skips rows where the mapped title is empty', async () => {
    const csv = `name,code\n,GC11111\nCache B,GC22222`;
    const mapping = { name: 'title', code: 'gcCode' };
    const repo = makeRepo({ createMany: vi.fn().mockResolvedValue(1) });
    const service = new CsvImportService(repo);

    await service.import(collectionId, csv, mapping);

    const [[puzzles]] = (repo.createMany as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(puzzles).toHaveLength(1);
    expect(puzzles[0].title).toBe('Cache B');
  });

  it('returns 0 without calling createMany when all rows are skipped', async () => {
    const csv = `name\n\n\n`;
    const mapping = { name: 'title' };
    const repo = makeRepo();
    const service = new CsvImportService(repo);

    const count = await service.import(collectionId, csv, mapping);

    expect(count).toBe(0);
    expect(repo.createMany).not.toHaveBeenCalled();
  });

  it('ignores columns not in the mapping', async () => {
    const csv = `title,secret\nCache A,sensitive`;
    const mapping = { title: 'title' };
    const repo = makeRepo({ createMany: vi.fn().mockResolvedValue(1) });
    const service = new CsvImportService(repo);

    await service.import(collectionId, csv, mapping);

    const [[puzzles]] = (repo.createMany as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(puzzles[0]).not.toHaveProperty('secret');
  });

  it('ignores mapping entries targeting invalid field names', async () => {
    const csv = `title,notes\nCache A,some notes`;
    const mapping = { title: 'title', notes: 'nonExistentField' };
    const repo = makeRepo({ createMany: vi.fn().mockResolvedValue(1) });
    const service = new CsvImportService(repo);

    await service.import(collectionId, csv, mapping);

    const [[puzzles]] = (repo.createMany as ReturnType<typeof vi.fn>).mock
      .calls;
    expect(puzzles[0]).not.toHaveProperty('nonExistentField');
  });

  it('throws 400 when no column is mapped to title', async () => {
    const service = new CsvImportService(makeRepo());

    await expect(
      service.import(collectionId, SIMPLE_CSV, { gcCode: 'gcCode' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for invalid CSV content', async () => {
    const service = new CsvImportService(makeRepo());

    await expect(
      service.import(collectionId, '"unclosed quote', { title: 'title' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
