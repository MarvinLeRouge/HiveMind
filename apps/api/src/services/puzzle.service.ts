import type {
  PuzzleRepository,
  PuzzleRow,
  CreatePuzzleData,
  UpdatePuzzleData,
} from '../repositories/puzzle.repository.js';

/** Valid forward-only status transitions for a puzzle. */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress'],
  in_progress: ['solved'],
  solved: ['verified'],
  verified: [],
};

/**
 * A puzzle response with only the fields enabled by the collection's template
 * snapshot. Fields not enabled by the template are omitted entirely.
 */
export type FilteredPuzzle = {
  id: string;
  collectionId: string;
  sortOrder: number;
  title: string;
  status: string;
  workingOnId: string | null;
  checkerUrl: string | null;
  updatedAt: Date;
  gcCode?: string | null;
  difficulty?: number | null;
  terrain?: number | null;
  coords?: string | null;
  hint?: string | null;
  spoiler?: string | null;
  customFields?: unknown;
};

/** Input shape for creating a puzzle (sortOrder assigned automatically). */
export type CreatePuzzleInput = Omit<
  CreatePuzzleData,
  'collectionId' | 'sortOrder'
>;

/** Input shape for patching a puzzle. */
export type UpdatePuzzleInput = UpdatePuzzleData;

/**
 * Business logic for puzzles.
 *
 * Access control (membership / ownership) is enforced by the requireMember and
 * requireOwner HTTP middlewares. This service handles:
 * - Template-driven field filtering on list/get responses
 * - Auto sortOrder assignment on create
 * - Forward-only status transition validation
 * - Claim / unclaim ownership checks
 */
export class PuzzleService {
  constructor(private readonly repo: PuzzleRepository) {}

  /**
   * Returns all puzzles for a collection, with template-filtered fields.
   */
  async list(collectionId: string): Promise<FilteredPuzzle[]> {
    const puzzles = await this.repo.findAllByCollection(collectionId);
    return puzzles.map((p) => filterPuzzleFields(p));
  }

  /**
   * Returns a single puzzle by ID within a collection.
   * Throws 404 if the puzzle does not exist.
   */
  async getById(
    collectionId: string,
    puzzleId: string,
  ): Promise<FilteredPuzzle> {
    const puzzle = await this.repo.findById(collectionId, puzzleId);
    if (!puzzle) throw this.notFound();
    return filterPuzzleFields(puzzle);
  }

  /**
   * Creates a puzzle, appending it at the end of the collection's sort order.
   */
  async create(
    collectionId: string,
    data: CreatePuzzleInput,
  ): Promise<FilteredPuzzle> {
    const sortOrder = await this.repo.findNextSortOrder(collectionId);
    const puzzle = await this.repo.create({ collectionId, sortOrder, ...data });
    return filterPuzzleFields(puzzle);
  }

  /**
   * Updates a puzzle's fields.
   * Throws 404 if the puzzle does not exist.
   * Throws 422 if the requested status transition is invalid.
   */
  async update(
    collectionId: string,
    puzzleId: string,
    data: UpdatePuzzleInput,
  ): Promise<FilteredPuzzle> {
    const puzzle = await this.repo.findById(collectionId, puzzleId);
    if (!puzzle) throw this.notFound();

    if (data.status !== undefined) {
      const allowed = STATUS_TRANSITIONS[puzzle.status] ?? [];
      if (!allowed.includes(data.status)) {
        throw Object.assign(
          new Error(
            `Invalid status transition: ${puzzle.status} → ${data.status}`,
          ),
          { statusCode: 422 },
        );
      }
    }

    const updated = await this.repo.update(puzzleId, data);
    return filterPuzzleFields(updated);
  }

  /**
   * Deletes a puzzle and all its notes and attempts (cascade).
   * Throws 404 if the puzzle does not exist.
   */
  async delete(collectionId: string, puzzleId: string): Promise<void> {
    const puzzle = await this.repo.findById(collectionId, puzzleId);
    if (!puzzle) throw this.notFound();
    await this.repo.delete(puzzleId);
  }

  /**
   * Bulk-updates the sortOrder of puzzles in a collection.
   */
  async reorder(
    collectionId: string,
    items: { id: string; sortOrder: number }[],
  ): Promise<void> {
    await this.repo.reorder(collectionId, items);
  }

  /**
   * Claims a puzzle for the current user (sets workingOnId).
   * Throws 404 if the puzzle does not exist.
   * Throws 409 if the puzzle is already claimed by someone.
   */
  async claim(
    collectionId: string,
    puzzleId: string,
    userId: string,
  ): Promise<void> {
    const puzzle = await this.repo.findById(collectionId, puzzleId);
    if (!puzzle) throw this.notFound();

    if (puzzle.workingOnId !== null) {
      throw Object.assign(new Error('Puzzle is already claimed'), {
        statusCode: 409,
      });
    }

    await this.repo.setClaim(puzzleId, userId);
  }

  /**
   * Releases the claim on a puzzle (clears workingOnId).
   * Throws 404 if the puzzle does not exist.
   * Throws 403 if the current user is not the claimant.
   */
  async unclaim(
    collectionId: string,
    puzzleId: string,
    userId: string,
  ): Promise<void> {
    const puzzle = await this.repo.findById(collectionId, puzzleId);
    if (!puzzle) throw this.notFound();

    if (puzzle.workingOnId !== userId) {
      throw Object.assign(new Error('Puzzle is not claimed by you'), {
        statusCode: 403,
      });
    }

    await this.repo.setClaim(puzzleId, null);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private notFound(): Error {
    return Object.assign(new Error('Puzzle not found'), { statusCode: 404 });
  }
}

/** Strips fields disabled in the collection's template snapshot from the puzzle. */
function filterPuzzleFields(puzzle: PuzzleRow): FilteredPuzzle {
  const snap = puzzle.collection.templateSnapshot;
  const result: FilteredPuzzle = {
    id: puzzle.id,
    collectionId: puzzle.collectionId,
    sortOrder: puzzle.sortOrder,
    title: puzzle.title,
    status: puzzle.status,
    workingOnId: puzzle.workingOnId,
    checkerUrl: puzzle.checkerUrl,
    updatedAt: puzzle.updatedAt,
  };

  if (snap.useGcCode) result.gcCode = puzzle.gcCode;
  if (snap.useDifficulty) result.difficulty = puzzle.difficulty;
  if (snap.useTerrain) result.terrain = puzzle.terrain;
  if (snap.useCoords) result.coords = puzzle.coords;
  if (snap.useHint) result.hint = puzzle.hint;
  if (snap.useSpoiler) result.spoiler = puzzle.spoiler;
  if (snap.customField1Label ?? snap.customField2Label)
    result.customFields = puzzle.customFields;

  return result;
}
