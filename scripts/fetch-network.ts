import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { StopsFileSchema, LinesFileSchema } from '../src/data/schema';
import { GtfsFetcher } from '../src/lib/fetch-network/gtfs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  console.log('Fetching tram network from KORDIS JMK GTFS feed...');
  const fetcher = new GtfsFetcher();
  const { stops, lines } = await fetcher.fetch();

  const validatedStops = StopsFileSchema.parse(stops);
  const validatedLines = LinesFileSchema.parse(lines);

  const stopsPath = resolve(__dirname, '../src/data/stops.json');
  const linesPath = resolve(__dirname, '../src/data/lines.json');
  writeFileSync(stopsPath, JSON.stringify(validatedStops, null, 2) + '\n', 'utf8');
  writeFileSync(linesPath, JSON.stringify(validatedLines, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${validatedStops.length} stops and ${validatedLines.length} lines.`);
  console.log(`  ${stopsPath}`);
  console.log(`  ${linesPath}`);
  console.log('');
  console.log('Lines:');
  for (const line of validatedLines) {
    const color = line.routeColor ?? '——';
    console.log(`  ${line.name.padEnd(4)} ${color.padEnd(9)} ${line.stopIds.length} stops`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
