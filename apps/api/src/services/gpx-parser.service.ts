import { XMLParser } from 'fast-xml-parser';

/** A single parsed waypoint ready to be inserted as a puzzle. */
export interface ParsedWaypoint {
  title: string;
  gcCode?: string;
  difficulty?: number;
  terrain?: number;
  coords?: string;
  hint?: string;
  sortOrder: number;
}

type RawCache = {
  difficulty?: unknown;
  terrain?: unknown;
  short_description?: unknown;
};

type RawWaypoint = {
  '@_lat'?: unknown;
  '@_lon'?: unknown;
  name?: unknown;
  cache?: RawCache;
};

type ParsedGpx = {
  gpx?: {
    wpt?: RawWaypoint | RawWaypoint[];
  };
};

/**
 * Parses a Groundspeak GPX pocket-query XML string into an array of
 * normalized waypoints ready to be imported as puzzles.
 */
export class GpxParserService {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  /**
   * Parses the given GPX XML string and returns one entry per <wpt> element.
   * Throws 400 if the string is not valid GPX XML.
   */
  parse(xml: string): ParsedWaypoint[] {
    let parsed: ParsedGpx;
    try {
      parsed = this.parser.parse(xml) as ParsedGpx;
    } catch {
      throw Object.assign(new Error('Invalid GPX file'), { statusCode: 400 });
    }

    if (parsed.gpx === undefined || parsed.gpx === null) {
      throw Object.assign(
        new Error('Invalid GPX file: missing <gpx> root element'),
        { statusCode: 400 },
      );
    }

    // fast-xml-parser returns '' for empty elements; treat as no waypoints
    const gpxContent =
      typeof parsed.gpx === 'object' ? parsed.gpx : ({} as ParsedGpx['gpx']);
    const rawWpts = gpxContent?.wpt;
    if (!rawWpts) return [];

    const wpts: RawWaypoint[] = Array.isArray(rawWpts) ? rawWpts : [rawWpts];

    return wpts.map((wpt, index) => {
      const lat = String(wpt['@_lat'] ?? '');
      const lon = String(wpt['@_lon'] ?? '');
      const name = String(wpt.name ?? '');
      const cache = wpt.cache ?? {};

      const waypoint: ParsedWaypoint = { title: name, sortOrder: index };

      if (name.toUpperCase().startsWith('GC')) {
        waypoint.gcCode = name;
      }

      if (lat && lon) {
        waypoint.coords = `${lat},${lon}`;
      }

      if (cache.difficulty != null) {
        waypoint.difficulty = Number(cache.difficulty);
      }

      if (cache.terrain != null) {
        waypoint.terrain = Number(cache.terrain);
      }

      if (cache.short_description != null) {
        waypoint.hint = String(cache.short_description);
      }

      return waypoint;
    });
  }
}
