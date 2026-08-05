import { describe, it, expect } from 'vitest';
import { parseGtfsNetwork, type GtfsInput } from '../src/lib/fetch-network/transform';

// Synthetic minimal GTFS feed: 3 tram routes, 6 stops, 4 trips total.
// Lines 5 and 9 share stop S3 (a real-world interchange pattern).
// Route 99 is a bus (route_type=3) and must be filtered out.
const fixture: GtfsInput = {
  routes: [
    { route_id: 'R5',  route_short_name: '5',  route_long_name: 'A-B', route_type: '0', route_color: 'E2001A' },
    { route_id: 'R9',  route_short_name: '9',  route_long_name: 'C-D', route_type: '0' },
    { route_id: 'R99', route_short_name: '99', route_long_name: 'X-Y', route_type: '3' },
  ],
  trips: [
    { route_id: 'R5',  trip_id: 'T5-out',  trip_head_sign: 'B', direction_id: '0' },
    { route_id: 'R5',  trip_id: 'T5-ret',  trip_head_sign: 'A', direction_id: '1' },
    { route_id: 'R9',  trip_id: 'T9-out',  trip_head_sign: 'D', direction_id: '0' },
    // Route 99 (bus) has no trips in this fixture; would be filtered anyway.
  ],
  stopTimes: [
    // Line 5 outbound: S1 -> S2 -> S3
    { trip_id: 'T5-out', stop_id: 'S1', stop_sequence: '1' },
    { trip_id: 'T5-out', stop_id: 'S2', stop_sequence: '2' },
    { trip_id: 'T5-out', stop_id: 'S3', stop_sequence: '3' },
    // Line 5 return: S3 -> S2 -> S1 (same stops, reverse order)
    { trip_id: 'T5-ret', stop_id: 'S3', stop_sequence: '1' },
    { trip_id: 'T5-ret', stop_id: 'S2', stop_sequence: '2' },
    { trip_id: 'T5-ret', stop_id: 'S1', stop_sequence: '3' },
    // Line 9 outbound: S3 -> S4
    { trip_id: 'T9-out', stop_id: 'S3', stop_sequence: '1' },
    { trip_id: 'T9-out', stop_id: 'S4', stop_sequence: '2' },
  ],
  stops: [
    { stop_id: 'S1', stop_name: 'Alpha', stop_lat: '49.100', stop_lon: '16.500' },
    { stop_id: 'S2', stop_name: 'Bravo', stop_lat: '49.110', stop_lon: '16.510' },
    { stop_id: 'S3', stop_name: 'Charlie (Interchange)', stop_lat: '49.120', stop_lon: '16.520' },
    { stop_id: 'S4', stop_name: 'Delta', stop_lat: '49.130', stop_lon: '16.530' },
    { stop_id: 'S5', stop_name: 'Orphan Stop', stop_lat: '49.140', stop_lon: '16.540' },  // not on any trip
    { stop_id: 'S6', stop_name: 'Quoted, Name', stop_lat: '49.150', stop_lon: '16.550' }, // quoted comma in name
  ],
};

describe('parseGtfsNetwork', () => {
  it('filters to tram routes only (route_type=0)', () => {
    const { lines } = parseGtfsNetwork(fixture);
    const lineIds = lines.map((l) => l.id).sort();
    expect(lineIds).toEqual(['5', '9']);
  });

  it('emits a Line per tram route with stopIds in first-trip order', () => {
    const { lines } = parseGtfsNetwork(fixture);
    const line5 = lines.find((l) => l.id === '5');
    expect(line5).toBeDefined();
    expect(line5!.stopIds).toEqual(['gtfs:S1', 'gtfs:S2', 'gtfs:S3']);
  });

  it('uses route_short_name as Line.id and name', () => {
    const line5 = parseGtfsNetwork(fixture).lines.find((l) => l.id === '5');
    expect(line5!.name).toBe('5');
  });

  it('carries route_color through as #prefixed hex when present', () => {
    const line5 = parseGtfsNetwork(fixture).lines.find((l) => l.id === '5');
    expect(line5!.routeColor).toBe('#E2001A');
  });

  it('omits routeColor when GTFS did not provide one', () => {
    const line9 = parseGtfsNetwork(fixture).lines.find((l) => l.id === '9');
    expect(line9!.routeColor).toBeUndefined();
  });

  it('emits a Stop per unique stop_id that appears on at least one tram trip', () => {
    const { stops } = parseGtfsNetwork(fixture);
    const stopIds = stops.map((s) => s.id).sort();
    // S5 (orphan) is excluded; S6 (no trip) is excluded.
    expect(stopIds).toEqual(['gtfs:S1', 'gtfs:S2', 'gtfs:S3', 'gtfs:S4']);
  });

  it('uses namespaced gtfs: ids for stops and preserves source.gtfsStopId', () => {
    const { stops } = parseGtfsNetwork(fixture);
    const s1 = stops.find((s) => s.id === 'gtfs:S1');
    expect(s1!.source).toEqual({ kind: 'gtfs', gtfsStopId: 'S1' });
  });

  it('parses lat/lon as numbers', () => {
    const s1 = parseGtfsNetwork(fixture).stops.find((s) => s.id === 'gtfs:S1');
    expect(s1!.lat).toBeCloseTo(49.100, 3);
    expect(s1!.lon).toBeCloseTo(16.500, 3);
  });

  it('reverse-indexes line membership into Stop.lines', () => {
    const { stops } = parseGtfsNetwork(fixture);
    const s1 = stops.find((s) => s.id === 'gtfs:S1');
    const s3 = stops.find((s) => s.id === 'gtfs:S3');
    expect(s1!.lines).toEqual(['5']);
    expect(s3!.lines.sort()).toEqual(['5', '9']);
  });

  it('preserves the original stop name verbatim (including commas)', () => {
    const s6 = parseGtfsNetwork(fixture).stops.find((s) => s.id === 'gtfs:S6');
    // S6 is not on any trip, so it should NOT be emitted.
    expect(s6).toBeUndefined();
  });

  it('dedupes stopIds on a line even if multiple trips serve them', () => {
    const line5 = parseGtfsNetwork(fixture).lines.find((l) => l.id === '5');
    // T5-out and T5-ret both visit S1, S2, S3 — line5.stopIds should have each once.
    expect(line5!.stopIds).toHaveLength(3);
  });
});

// Regression: GTFS feeds include short-turn trips (e.g. ARENA BRNO turnarounds)
// that start/end mid-route. The transform must pick the longest trip per route,
// not the first one. T1-short is listed FIRST on purpose.
describe('parseGtfsNetwork — short-turn variant handling', () => {
  const shortTurnFixture: GtfsInput = {
    routes: [
      { route_id: 'R1', route_short_name: '1', route_type: '0' },
    ],
    trips: [
      // Short variant listed FIRST (the bug-triggering order).
      { route_id: 'R1', trip_id: 'T1-short', direction_id: '0' },
      { route_id: 'R1', trip_id: 'T1-full', direction_id: '0' },
    ],
    stopTimes: [
      // Short: A → B → C (3 stops, turnaround mid-route)
      { trip_id: 'T1-short', stop_id: 'A', stop_sequence: '1' },
      { trip_id: 'T1-short', stop_id: 'B', stop_sequence: '2' },
      { trip_id: 'T1-short', stop_id: 'C', stop_sequence: '3' },
      // Full: A → B → C → D → E (5 stops)
      { trip_id: 'T1-full', stop_id: 'A', stop_sequence: '1' },
      { trip_id: 'T1-full', stop_id: 'B', stop_sequence: '2' },
      { trip_id: 'T1-full', stop_id: 'C', stop_sequence: '3' },
      { trip_id: 'T1-full', stop_id: 'D', stop_sequence: '4' },
      { trip_id: 'T1-full', stop_id: 'E', stop_sequence: '5' },
    ],
    stops: [
      { stop_id: 'A', stop_name: 'Alpha', stop_lat: '49.0', stop_lon: '16.0' },
      { stop_id: 'B', stop_name: 'Bravo', stop_lat: '49.1', stop_lon: '16.1' },
      { stop_id: 'C', stop_name: 'Charlie', stop_lat: '49.2', stop_lon: '16.2' },
      { stop_id: 'D', stop_name: 'Delta', stop_lat: '49.3', stop_lon: '16.3' },
      { stop_id: 'E', stop_name: 'Echo', stop_lat: '49.4', stop_lon: '16.4' },
    ],
  };

  it('picks the longest trip even when a short variant is listed first', () => {
    const { lines } = parseGtfsNetwork(shortTurnFixture);
    expect(lines[0].stopIds).toHaveLength(5);
    expect(lines[0].stopIds).toEqual([
      'gtfs:A', 'gtfs:B', 'gtfs:C', 'gtfs:D', 'gtfs:E',
    ]);
  });
});
