import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { StopsFileSchema, type Stop } from '../src/data/schema';
import { wishlist } from '../src/data/wishlist';
import { OsmFetcher } from '../src/lib/fetch-stops/osm';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  console.log(`Fetching ${wishlist.length} stops from OpenStreetMap...`);
  const fetcher = new OsmFetcher();
  const results = await fetcher.fetchAll(wishlist);

  const stops: Stop[] = results.map((r) => r.stop);

  // Validate before writing — fail loudly on schema violations.
  const validated = StopsFileSchema.parse(stops);

  const outPath = resolve(__dirname, '../src/data/stops.json');
  writeFileSync(outPath, JSON.stringify(validated, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${validated.length} stops to ${outPath}`);
  for (const s of validated) {
    console.log(`  ${s.id}  ${s.name.padEnd(20)} (${s.lat.toFixed(5)}, ${s.lon.toFixed(5)})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
