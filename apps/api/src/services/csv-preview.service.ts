import { parse } from 'csv-parse/sync';

/** Shape returned by the CSV preview endpoint. */
export interface CsvPreview {
  columns: string[];
  rows: Record<string, string>[];
}

/**
 * Parses a CSV string and returns the detected column headers and the first
 * three data rows — enough for the client to build a column-mapping UI.
 * Throws 400 if the content cannot be parsed as CSV.
 */
export class CsvPreviewService {
  /**
   * Returns column headers and up to three sample rows from the CSV.
   */
  preview(csvContent: string): CsvPreview {
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

    if (records.length === 0) {
      return { columns: [], rows: [] };
    }

    return {
      columns: Object.keys(records[0]),
      rows: records.slice(0, 3),
    };
  }
}
