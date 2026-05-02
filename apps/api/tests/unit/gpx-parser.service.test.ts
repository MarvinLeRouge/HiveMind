import { describe, expect, it } from 'vitest';
import { GpxParserService } from '../../src/services/gpx-parser.service.js';

const service = new GpxParserService();

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeGpx(wpts: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<gpx xmlns:groundspeak="http://www.groundspeak.com/cache/1/0"
     xmlns="http://www.topografix.com/GPX/1/0">
  ${wpts}
</gpx>`;
}

const FULL_WPT = makeGpx(`
  <wpt lat="48.8503" lon="2.3492">
    <name>GC12345</name>
    <groundspeak:cache>
      <groundspeak:difficulty>2</groundspeak:difficulty>
      <groundspeak:terrain>1.5</groundspeak:terrain>
      <groundspeak:short_description>Under the bridge</groundspeak:short_description>
    </groundspeak:cache>
  </wpt>
`);

const TWO_WPTS = makeGpx(`
  <wpt lat="48.8503" lon="2.3492">
    <name>GC11111</name>
    <groundspeak:cache>
      <groundspeak:difficulty>1</groundspeak:difficulty>
      <groundspeak:terrain>1</groundspeak:terrain>
    </groundspeak:cache>
  </wpt>
  <wpt lat="48.8603" lon="2.3592">
    <name>GC22222</name>
    <groundspeak:cache>
      <groundspeak:difficulty>4</groundspeak:difficulty>
      <groundspeak:terrain>3</groundspeak:terrain>
    </groundspeak:cache>
  </wpt>
`);

const NO_GROUNDSPEAK = makeGpx(`
  <wpt lat="48.9000" lon="2.4000">
    <name>Simple Waypoint</name>
  </wpt>
`);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GpxParserService.parse', () => {
  it('maps all fields from a full geocaching waypoint', () => {
    const [wp] = service.parse(FULL_WPT);

    expect(wp.title).toBe('GC12345');
    expect(wp.gcCode).toBe('GC12345');
    expect(wp.coords).toBe('48.8503,2.3492');
    expect(wp.difficulty).toBe(2);
    expect(wp.terrain).toBe(1.5);
    expect(wp.hint).toBe('Under the bridge');
    expect(wp.sortOrder).toBe(0);
  });

  it('assigns sortOrder based on position in file', () => {
    const wps = service.parse(TWO_WPTS);

    expect(wps[0].sortOrder).toBe(0);
    expect(wps[1].sortOrder).toBe(1);
  });

  it('returns two waypoints for two <wpt> elements', () => {
    const wps = service.parse(TWO_WPTS);
    expect(wps).toHaveLength(2);
  });

  it('sets gcCode only when name starts with GC (case-insensitive)', () => {
    const gpx = makeGpx(`
      <wpt lat="1" lon="1"><name>GC99999</name></wpt>
      <wpt lat="2" lon="2"><name>GCABCDE</name></wpt>
      <wpt lat="3" lon="3"><name>Regular Name</name></wpt>
    `);
    const wps = service.parse(gpx);

    expect(wps[0].gcCode).toBe('GC99999');
    expect(wps[1].gcCode).toBe('GCABCDE');
    expect(wps[2].gcCode).toBeUndefined();
  });

  it('handles a waypoint without groundspeak data', () => {
    const [wp] = service.parse(NO_GROUNDSPEAK);

    expect(wp.title).toBe('Simple Waypoint');
    expect(wp.gcCode).toBeUndefined();
    expect(wp.difficulty).toBeUndefined();
    expect(wp.terrain).toBeUndefined();
    expect(wp.hint).toBeUndefined();
    expect(wp.coords).toBe('48.9000,2.4000');
  });

  it('returns an empty array when there are no <wpt> elements', () => {
    const gpx = makeGpx('');
    const wps = service.parse(gpx);
    expect(wps).toHaveLength(0);
  });

  it('throws 400 for non-XML input', () => {
    expect(() => service.parse('not xml at all <<<')).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('throws 400 when the root element is not <gpx>', () => {
    expect(() => service.parse('<root><something/></root>')).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
