import JSZip from 'jszip';
import { StopsFileSchema, LinesFileSchema } from '../../data/schema';
import { parseCsv } from './csv';
import { parseGtfsNetwork, type GtfsInput } from './transform';
import type { FetchedNetwork } from './transform';
import type { NetworkFetcher } from './types';

const GTFS_URL = 'https://kordis-jmk.cz/gtfs/gtfs.zip';

const NEEDED_FILES = ['routes.txt', 'trips.txt', 'stop_times.txt', 'stops.txt'] as const;

async function downloadAndExtract(url: string): Promise<Map<string, string>> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'salina-go/0.1 (https://github.com/omnitex/salina-go)' },
  });
  if (!res.ok) {
    throw new Error(`GTFS download failed: HTTP ${res.status} from ${url}`);
  }
  const buf = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const files = new Map<string, string>();
  for (const name of NEEDED_FILES) {
    const entry =
      zip.file(name) ??
      zip.file(new RegExp(`(^|/)${name}$`))[0];
    if (!entry) {
      throw new Error(`GTFS zip missing required file: ${name}`);
    }
    files.set(name, await entry.async('text'));
  }
  return files;
}

function buildInput(files: Map<string, string>): GtfsInput {
  return {
    routes: parseCsv(files.get('routes.txt') ?? ''),
    trips: parseCsv(files.get('trips.txt') ?? ''),
    stopTimes: parseCsv(files.get('stop_times.txt') ?? ''),
    stops: parseCsv(files.get('stops.txt') ?? ''),
  };
}

export class GtfsFetcher implements NetworkFetcher {
  private readonly url: string;

  constructor(url: string = GTFS_URL) {
    this.url = url;
  }

  async fetch(): Promise<FetchedNetwork> {
    const files = await downloadAndExtract(this.url);
    const input = buildInput(files);
    const network = parseGtfsNetwork(input);

    // Validate before returning — fail loudly on schema violations so the
    // CLI doesn't write malformed JSON to disk.
    StopsFileSchema.parse(network.stops);
    LinesFileSchema.parse(network.lines);

    return network;
  }
}
