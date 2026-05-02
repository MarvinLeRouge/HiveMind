import type { PuzzleRepository } from '../repositories/puzzle.repository.js';
import type { ParsedWaypoint } from './gpx-parser.service.js';

/**
 * Bulk-imports parsed GPX waypoints as puzzles in a collection.
 * sortOrder is assigned starting from the current collection maximum + 1.
 */
export class GpxImportService {
  constructor(private readonly repo: PuzzleRepository) {}

  /**
   * Inserts all waypoints as puzzles in the given collection.
   * Returns the number of puzzles created.
   */
  async import(
    collectionId: string,
    waypoints: ParsedWaypoint[],
  ): Promise<number> {
    if (waypoints.length === 0) return 0;

    const startOrder = await this.repo.findNextSortOrder(collectionId);

    const data = waypoints.map((wp, i) => ({
      collectionId,
      sortOrder: startOrder + i,
      title: wp.title,
      gcCode: wp.gcCode,
      difficulty: wp.difficulty,
      terrain: wp.terrain,
      coords: wp.coords,
      hint: wp.hint,
    }));

    return this.repo.createMany(data);
  }
}
