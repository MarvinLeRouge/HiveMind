import type { PrismaClient, Puzzle, Prisma, User } from '@prisma/client';

/** Template field modes needed for field-filtering puzzle responses. */
type TemplateFlags = {
  indexMode: string;
  gcCodeMode: string;
  difficultyMode: string;
  terrainMode: string;
  coordsMode: string;
  hintMode: string;
  spoilerMode: string;
  customField1Label: string | null;
  customField1Mode: string;
  customField2Label: string | null;
  customField2Mode: string;
};

/** Worker summary included in puzzle responses. */
export type WorkerSummary = Pick<User, 'id' | 'username'>;

/** Puzzle row with the collection's template snapshot flags and workers included. */
export type PuzzleRow = Puzzle & {
  collection: { templateSnapshot: TemplateFlags };
  workers: { user: WorkerSummary }[];
};

/** Input shape for creating a puzzle. */
export interface CreatePuzzleData {
  collectionId: string;
  sortOrder: number;
  title: string;
  description?: string;
  checkerUrl?: string;
  gcCode?: string;
  difficulty?: number;
  terrain?: number;
  coords?: string;
  hint?: string;
  spoiler?: string;
  customFields?: Record<string, unknown>;
}

/** Input shape for updating a puzzle's mutable fields. */
export interface UpdatePuzzleData {
  title?: string;
  description?: string | null;
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
    indexMode: true,
    gcCodeMode: true,
    difficultyMode: true,
    terrainMode: true,
    coordsMode: true,
    hintMode: true,
    spoilerMode: true,
    customField1Label: true,
    customField1Mode: true,
    customField2Label: true,
    customField2Mode: true,
  },
} as const;

const WORKERS_INCLUDE = {
  select: { user: { select: { id: true, username: true } } },
} as const;

const PUZZLE_INCLUDE = {
  collection: { select: { templateSnapshot: SNAPSHOT_SELECT } },
  workers: WORKERS_INCLUDE,
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
      data: {
        ...data,
        customFields: data.customFields as Prisma.InputJsonValue | undefined,
      },
      include: PUZZLE_INCLUDE,
    }) as unknown as Promise<PuzzleRow>;
  }

  /**
   * Updates a puzzle's mutable fields and returns it with the template snapshot.
   */
  async update(id: string, data: UpdatePuzzleData): Promise<PuzzleRow> {
    return this.prisma.puzzle.update({
      where: { id },
      data: {
        ...data,
        customFields: data.customFields as unknown as
          | Prisma.NullableJsonNullValueInput
          | Prisma.InputJsonValue
          | undefined,
      },
      include: PUZZLE_INCLUDE,
    }) as unknown as Promise<PuzzleRow>;
  }

  /**
   * Bulk-inserts multiple puzzles and returns the number created.
   */
  async createMany(data: CreatePuzzleData[]): Promise<number> {
    const result = await this.prisma.puzzle.createMany({
      data: data.map(({ customFields, ...rest }) => ({
        ...rest,
        customFields: customFields as Prisma.InputJsonValue | undefined,
      })),
    });
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
   * Marks the user as working on the puzzle (idempotent).
   */
  async addWorker(puzzleId: string, userId: string): Promise<void> {
    await this.prisma.puzzleWorker.upsert({
      where: { puzzleId_userId: { puzzleId, userId } },
      create: { puzzleId, userId },
      update: {},
    });
  }

  /**
   * Removes the user from the puzzle's workers list (no-op if not present).
   */
  async removeWorker(puzzleId: string, userId: string): Promise<void> {
    await this.prisma.puzzleWorker.deleteMany({
      where: { puzzleId, userId },
    });
  }
}
