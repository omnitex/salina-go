import type { Line, Stop } from '../../data/schema';

export interface GtfsRouteRow {
  route_id: string;
  route_short_name: string;
  route_long_name?: string;
  route_type: string;
  route_color?: string;
}

export interface GtfsTripRow {
  route_id: string;
  trip_id: string;
  trip_head_sign?: string;
  direction_id?: string;
}

export interface GtfsStopTimeRow {
  trip_id: string;
  stop_id: string;
  stop_sequence: string;
}

export interface GtfsStopRow {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
}

export interface GtfsInput {
  routes: GtfsRouteRow[];
  trips: GtfsTripRow[];
  stopTimes: GtfsStopTimeRow[];
  stops: GtfsStopRow[];
}

export interface FetchedNetwork {
  stops: Stop[];
  lines: Line[];
}

// GTFS route_type 0 = tram (including streetcars and aerial trams).
// See https://gtfs.org/documentation/reference/#routestxt
const TRAM_ROUTE_TYPE = '0';

export function parseGtfsNetwork(input: GtfsInput): FetchedNetwork {
  const tramRoutes = input.routes.filter((r) => r.route_type === TRAM_ROUTE_TYPE);
  const tramRouteIds = new Set(tramRoutes.map((r) => r.route_id));

  // trips grouped by route_id, restricted to tram routes
  const tripsByRoute = new Map<string, string[]>();
  for (const trip of input.trips) {
    if (!tramRouteIds.has(trip.route_id)) continue;
    const list = tripsByRoute.get(trip.route_id) ?? [];
    list.push(trip.trip_id);
    tripsByRoute.set(trip.route_id, list);
  }

  // stop_times grouped by trip_id, sorted by stop_sequence, kept as stop_id lists
  const stopTimesByTrip = new Map<string, GtfsStopTimeRow[]>();
  for (const st of input.stopTimes) {
    const list = stopTimesByTrip.get(st.trip_id) ?? [];
    list.push(st);
    stopTimesByTrip.set(st.trip_id, list);
  }
  for (const list of stopTimesByTrip.values()) {
    list.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
  }

  // Build lines: one per tram route, stopIds from the route's first trip,
  // deduped (preserve first occurrence).
  const lines: Line[] = tramRoutes.map((route) => {
    const tripIds = tripsByRoute.get(route.route_id) ?? [];
    const firstTrip = tripIds[0];
    const stopTimes = stopTimesByTrip.get(firstTrip) ?? [];
    const seen = new Set<string>();
    const stopIds: string[] = [];
    for (const st of stopTimes) {
      const namespaced = `gtfs:${st.stop_id}`;
      if (seen.has(namespaced)) continue;
      seen.add(namespaced);
      stopIds.push(namespaced);
    }
    const line: Line = {
      id: route.route_short_name,
      name: route.route_short_name,
      stopIds,
    };
    if (route.route_color) {
      line.routeColor = `#${route.route_color}`;
    }
    return line;
  });

  // Collect all stop_ids referenced by any tram line.
  const usedStopIds = new Set<string>();
  for (const line of lines) {
    for (const sid of line.stopIds) usedStopIds.add(sid);
  }

  // Build stops, reverse-indexing line membership.
  const lineIdsByStopId = new Map<string, string[]>();
  for (const line of lines) {
    for (const sid of line.stopIds) {
      const list = lineIdsByStopId.get(sid) ?? [];
      list.push(line.id);
      lineIdsByStopId.set(sid, list);
    }
  }

  const stopById = new Map<string, GtfsStopRow>();
  for (const s of input.stops) stopById.set(s.stop_id, s);

  const stops: Stop[] = [];
  for (const namespaced of usedStopIds) {
    const rawId = namespaced.slice('gtfs:'.length);
    const row = stopById.get(rawId);
    if (!row) continue;
    const stop: Stop = {
      id: namespaced,
      name: row.stop_name,
      lat: Number(row.stop_lat),
      lon: Number(row.stop_lon),
      lines: lineIdsByStopId.get(namespaced) ?? [],
      emoji: '🚋',
      source: { kind: 'gtfs', gtfsStopId: rawId },
    };
    stops.push(stop);
  }

  return { stops, lines };
}
