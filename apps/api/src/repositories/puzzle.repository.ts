import type { PrismaClient, Puzzle } from '@prisma/client';

/** Template flags needed for field-filtering puzzle responses. */
type TemplateFlags = {
  useIndex: boolean;
  useGcCode: boolean;
  useDifficulty: boolean;
  useTerrain: boolean;
  useCoords: boolean;
  useHint: boolean;
  useSpoiler: boolean;
  customField1Label: string | null;
  customField2Label: string | null;
};

/** Puzzle row with the collection's template snapshot flags included. */
export type PuzzleRow = Puzzle & {
  collection: { templateSnapshot: TemplateFlags };
};

export interface CreatePuzzleData {
  collectionId: string;
  sortOrder: number;
  title: string;
  checkerUrl?: string;
  gcCode?: string;
  difficulty?: number;
  terrain?: number;
  coords?: string;
  hint?: string;
  spoiler?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdatePuzzleData {
  title?: string;
  status?: string;
  checkerUrl?: string | null;
  gcCode?: string | null;
  difficulty?: number | null;
  terrain?: number | null;
  coords?: string | null;
  hint?: string | null;
  spoiler?: string | null;
  customFields?: Record<string, unknown> | null;
}

const SNAPSHOT_SELECT = {
  select: {
    useIndex: true,
    useGcCode: true,
    useDifficulty: true,
    useTerrain: true,
    useCoords: true,
    useHint: true,
    useSpoiler: true,
    customField1Label: true,
    customField2Label: true,
  },
} as const;

const PUZZLE_INCLUDE = {
  collection: { select: { templateSnapshot: SNAPSHOT_SELECT } },
} as const;

/**
 * Data access layer for puzzles.
 * Contains only Prisma queries — no business logic.
 */
export class PuzzleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Returns all puzzles for a collection, ordered by sortOrder.
   */
  async findAllByCollection(collectionId: string): Promise<PuzzleRow[]> {
    return this.prisma.puzzle.findMany({
      where: { collectionId },
      include: PUZZLE_INCLUDE,
      orderBy: { sortOrder: 'asc' },
    }) as Promise<PuzzleRow[]>;
  }

  /**
   * Finds a puzzle by ID within a specific collection.
   * Returns null if the puzzle does not exist or belongs to a different collection.
   */
  async findById(
    collectionId: string,
    puzzleId: string,
  ): Promise<PuzzleRow | null> {
    return this.prisma.puzzle.findFirst({
      where: { id: puzzleId, collectionId },
      include: PUZZLE_INCLUDE,
    }) as Promise<PuzzleRow | null>;
  }

  /**
   * Returns the next available sortOrder for a collection (max + 1, or 0).
   */
  async findNextSortOrder(collectionId: string): Promise<number> {
    const result = await this.prisma.puzzle.aggregate({
      where: { collectionId },
      _max: { sortOrder: true },
    });
    return (result._max.sortOrder ?? -1) + 1;
  }

  /**
   * Creates a new puzzle and returns it with the template snapshot.
   */
  async create(data: CreatePuzzleData): Promise<PuzzleRow> {
    return this.prisma.puzzle.create({
      data,
      include: PUZZLE_INCLUDE,
    }) as Promise<PuzzleRow>;
  }

  /**
   * Updates a puzzle's mutable fields and returns it with the template snapshot.
   */
  async update(id: string, data: UpdatePuzzleData): Promise<PuzzleRow> {
    return this.prisma.puzzle.update({
      where: { id },
      data,
      include: PUZZLE_INCLUDE,
    }) as Promise<PuzzleRow>;
  }

  /**
   * Bulk-inserts multiple puzzles and returns the number created.
   */
  async createMany(data: CreatePuzzleData[]): Promise<number> {
    const result = await this.prisma.puzzle.createMany({ data });
    return result.count;
  }

  /**
   * Deletes a puzzle. DB cascades handle notes and attempts.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.puzzle.delete({ where: { id } });
  }

  /**
   * Bulk-updates sortOrder for a list of puzzles in a single transaction.
   * Each update is scoped to the given collectionId to prevent cross-collection writes.
   */
  async reorder(
    collectionId: string,
    items: { id: string; sortOrder: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        this.prisma.puzzle.update({
          where: { id, collectionId },
          data: { sortOrder },
        }),
      ),
    );
  }

  /**
   * Sets (or clears) the workingOnId field to claim / unclaim a puzzle.
   */
  async setClaim(id: string, userId: string | null): Promise<void> {
    await this.prisma.puzzle.update({
      where: { id },
      data: { workingOnId: userId },
    });
  }
}
