import type { Stop } from '../../data/schema';
import type { WishlistEntry } from '../../data/wishlist';
import type { FetchStopResult, StopsFetcher } from './types';
import { haversineDistanceMeters } from '../geo';

// Brno bounding box (south, west, north, east) — generous to avoid edge cases.
const BRNO_BBOX = { south: 49.13, west: 16.47, north: 49.30, east: 16.74 };

// Overpass mirrors — tried in order. The main instance is most reliable in
// practice; kumi is a fallback if it's overloaded.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

interface OverpassElement {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// One batched query for all display names — one HTTP request, not N.
// Note: Overpass's parser requires each statement inside a union `(...)` to
// be on its own line; cramming them inline produces a parse error.
function buildBatchedQuery(displayNames: string[]): string {
  const { south, west, north, east } = BRNO_BBOX;
  const lines: string[] = [];
  for (const n of displayNames) {
    lines.push(`node["public_transport"]["name"="${n}"](${south},${west},${north},${east});`);
    lines.push(`node["highway"="bus_stop"]["name"="${n}"](${south},${west},${north},${east});`);
    lines.push(`node["railway"="tram_stop"]["name"="${n}"](${south},${west},${north},${east});`);
  }
  return ['[out:json][timeout:60];', '(', ...lines.map((l) => '  ' + l), ');', 'out body;'].join('\n');
}

async function queryOverpass(
  displayNames: string[],
  url: string,
): Promise<OverpassElement[]> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'salina-go/0.1 (https://github.com/martinhavlik/salina-go)',
    },
    body: 'data=' + encodeURIComponent(buildBatchedQuery(displayNames)),
  });
  if (!res.ok) {
    throw new Error(`Overpass ${url} returned ${res.status}`);
  }
  const json = (await res.json()) as OverpassResponse;
  return json.elements;
}

// Pick the entry closest to the median lat/lon of all matches.
//
// Real transit hubs have many nodes in OSM (one per platform), so the median
// lands inside the central cluster. Rural mismatches with the same name are
// isolated outliers and get rejected naturally — more robust than tightening
// the bounding box, which would break for legitimate future stops at the
// city edges.
function pickBestMatch(
  elements: OverpassElement[],
  displayName: string,
): OverpassElement | null {
  const matches = elements.filter((e) => e.tags?.name === displayName);
  if (matches.length === 0) return null;

  const sortedLat = [...matches].sort((a, b) => a.lat - b.lat);
  const sortedLon = [...matches].sort((a, b) => a.lon - b.lon);
  const median = {
    lat: sortedLat[Math.floor(sortedLat.length / 2)].lat,
    lon: sortedLon[Math.floor(sortedLon.length / 2)].lon,
  };

  let best = matches[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const e of matches) {
    const d = haversineDistanceMeters(e, median);
    if (d < bestD) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

export class OsmFetcher implements StopsFetcher {
  async fetchAll(entries: WishlistEntry[]): Promise<FetchStopResult[]> {
    const displayNames = entries.map((e) => e.displayName);
    let body: OverpassElement[] = [];

    let lastError: unknown = null;
    for (const url of OVERPASS_MIRRORS) {
      try {
        body = await queryOverpass(displayNames, url);
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (body.length === 0) {
      throw new Error(
        `All Overpass mirrors failed. Last error: ${String(lastError)}`,
      );
    }

    const results: FetchStopResult[] = [];
    for (const entry of entries) {
      const hit = pickBestMatch(body, entry.displayName);
      if (!hit) {
        throw new Error(`No OSM match for "${entry.displayName}"`);
      }
      const stop: Stop = {
        id: `osm:${hit.id}`,
        name: entry.displayName,
        lat: hit.lat,
        lon: hit.lon,
        emoji: entry.emoji,
        source: {
          kind: 'osm',
          osmId: hit.id,
          officialRef: hit.tags?.ref,
        },
      };
      results.push({ wishlistEntry: entry, stop });
    }
    return results;
  }
}
