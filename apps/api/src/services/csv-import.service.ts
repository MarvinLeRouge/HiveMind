import { parse } from 'csv-parse/sync';
import type { PuzzleRepository } from '../repositories/puzzle.repository.js';

/** Maps a CSV column name to a target puzzle field name. */
export type ColumnMapping = Record<string, string>;

/** Puzzle field names that can be targeted by a column mapping. */
const VALID_FIELDS = new Set([
  'title',
  'gcCode',
  'difficulty',
  'terrain',
  'coords',
  'hint',
  'spoiler',
  'checkerUrl',
]);

/**
 * Parses a CSV string and bulk-inserts rows as puzzles using the provided
 * column-to-field mapping.
 * Throws 400 if the CSV cannot be parsed or if no column is mapped to 'title'.
 */
export class CsvImportService {
  constructor(private readonly repo: PuzzleRepository) {}

  /**
   * Imports CSV rows as puzzles in the given collection.
   * Returns the number of puzzles created.
   * Rows where the mapped title value is empty are skipped silently.
   */
  async import(
    collectionId: string,
    csvContent: string,
    mapping: ColumnMapping,
  ): Promise<number> {
    // Validate that at least one column is mapped to 'title'
    const hasTitleMapping = Object.values(mapping).includes('title');
    if (!hasTitleMapping) {
      throw Object.assign(
        new Error("Column mapping must include a field mapped to 'title'"),
        { statusCode: 400 },
      );
    }

    let records: Record<string, string>[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
    } catch {
      throw Object.assign(new Error('Invalid CSV file'), { statusCode: 400 });
    }

    if (records.length === 0) return 0;

    const startOrder = await this.repo.findNextSortOrder(collectionId);

    const puzzles = records
      .map((row, i) => {
        const puzzle: Record<string, unknown> = {
          collectionId,
          sortOrder: startOrder + i,
        };

        for (const [columnName, fieldKey] of Object.entries(mapping)) {
          if (!VALID_FIELDS.has(fieldKey)) continue;
          const raw = row[columnName] ?? '';
          if (raw === '') continue;

          if (fieldKey === 'difficulty' || fieldKey === 'terrain') {
            const n = parseFloat(raw);
            if (!isNaN(n)) puzzle[fieldKey] = n;
          } else {
            puzzle[fieldKey] = raw;
          }
        }

        return puzzle;
      })
      .filter(
        (p): p is typeof p & { title: string } =>
          typeof p.title === 'string' && p.title.length > 0,
      );

    if (puzzles.length === 0) return 0;

    return this.repo.createMany(
      puzzles as Parameters<typeof this.repo.createMany>[0],
    );
  }
}
