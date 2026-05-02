import { describe, expect, it } from 'vitest';
import { CsvPreviewService } from '../../src/services/csv-preview.service.js';

const service = new CsvPreviewService();

const FULL_CSV = `title,gcCode,difficulty
Cache A,GC11111,2
Cache B,GC22222,3
Cache C,GC33333,4
Cache D,GC44444,5`;

describe('CsvPreviewService.preview', () => {
  it('returns column headers and up to 3 rows', () => {
    const result = service.preview(FULL_CSV);

    expect(result.columns).toEqual(['title', 'gcCode', 'difficulty']);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({
      title: 'Cache A',
      gcCode: 'GC11111',
      difficulty: '2',
    });
  });

  it('returns fewer than 3 rows when the CSV has fewer data rows', () => {
    const csv = `title,gcCode\nOnly Row,GC99999`;
    const result = service.preview(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.columns).toEqual(['title', 'gcCode']);
  });

  it('returns empty columns and rows for a header-only CSV', () => {
    const csv = `title,gcCode,difficulty\n`;
    const result = service.preview(csv);

    expect(result.columns).toEqual([]);
    expect(result.rows).toHaveLength(0);
  });

  it('throws 400 for invalid CSV content', () => {
    expect(() => service.preview('')).not.toThrow();
    // csv-parse handles most input gracefully; a truly unparseable case:
    expect(() => service.preview('"unclosed quote')).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
