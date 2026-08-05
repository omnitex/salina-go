import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { StopsFileSchema, LinesFileSchema } from '../src/data/schema';
import { downloadAndExtract, buildInput } from '../src/lib/fetch-network/gtfs';
import { getRoutePatterns, buildNetworkFromSelections, type RoutePattern } from '../src/lib/fetch-network/transform';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '.fetch-network-config.json');

interface SavedConfig {
  selections: { routeId: string; patternIndex: number }[];
  timestamp: number;
}

interface LineState {
  patterns: RoutePattern[];
  selectedPattern: number | null;
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

function formatPattern(p: RoutePattern, index: number, showStops: boolean, stopById: Map<string, string>): string {
  const headSign = p.tripHeadSign ? ` → ${p.tripHeadSign}` : '';
  let output = `  [${index}] ${p.stopCount} stops${headSign}`;
  if (showStops) {
    const stopNames = p.stopIds.map((sid) => {
      const rawId = sid.slice('gtfs:'.length);
      return stopById.get(rawId) ?? rawId;
    });
    output += '\n      ' + stopNames.join('\n      ');
  }
  return output;
}

function loadSavedConfig(): SavedConfig | null {
  try {
    if (!existsSync(CONFIG_PATH)) return null;
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw) as SavedConfig;
  } catch {
    return null;
  }
}

function saveConfig(selections: Map<string, RoutePattern>): void {
  const config: SavedConfig = {
    selections: Array.from(selections.entries()).map(([routeId, pattern]) => ({
      routeId,
      patternIndex: routePatterns.findIndex((r) => r.routeId === routeId && r.patterns.includes(pattern)),
    })),
    timestamp: Date.now(),
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

async function main(): Promise<void> {
  console.log('Fetching tram network from KORDIS JMK GTFS feed...');
  const GTFS_URL = 'https://kordis-jmk.cz/gtfs/gtfs.zip';

  const files = await downloadAndExtract(GTFS_URL);
  const input = buildInput(files);
  let routePatterns = getRoutePatterns(input);

  const numericNames = routePatterns
    .filter((r) => /^\d+$/.test(r.routeName))
    .sort((a, b) => parseInt(a.routeName, 10) - parseInt(b.routeName, 10));
  const specialNames = routePatterns
    .filter((r) => !/^\d+$/.test(r.routeName))
    .sort((a, b) => a.routeName.localeCompare(b.routeName));
  routePatterns = [...numericNames, ...specialNames];

  const stopById = new Map<string, string>();
  for (const s of input.stops) stopById.set(s.stop_id, s.stop_name);

  const lineStates = new Map<string, LineState>();
  for (const route of routePatterns) {
    lineStates.set(route.routeId, {
      patterns: route.patterns,
      selectedPattern: null,
    });
  }

  function printList(): void {
    console.log('');
    console.log('Available lines (✓ = selected):');
    let index = 1;
    for (const route of routePatterns) {
      const state = lineStates.get(route.routeId)!;
      const selected = state.selectedPattern !== null ? ` (✓ pattern ${state.selectedPattern + 1})` : '';
      const color = `#${route.routeColor ?? '——'}`;
      console.log(`  [${index}] ${route.routeName.padEnd(4)} ${color.padEnd(9)} ${state.patterns.length} pattern(s)${selected}`);
      index++;
    }
    console.log('');
    console.log('Commands:');
    console.log('  <line-number>           - Show patterns for this line');
    console.log('  <line-number> p <N>     - Print stops for pattern N on line');
    console.log('  <line-number> s <N>     - Select pattern N for this line');
    console.log('  <line-number> d         - Deselect this line');
    console.log('  list                    - Show this list again');
    console.log('  export                  - Export to JSON and exit');
    console.log('  quit                    - Exit without exporting');
    console.log('');
  }

  printList();

  const savedConfig = loadSavedConfig();
  if (savedConfig) {
    console.log('');
    console.log('Found saved configuration (from ' + new Date(savedConfig.timestamp).toLocaleString() + ').');
    console.log('  reconfig - Use saved configuration and export');
    console.log('  clear    - Clear saved configuration');
    console.log('');
  }

  while (true) {
    const answer = await question('Command: ');
    const parts = answer.split(/\s+/).filter((p) => p.length > 0);
    if (parts.length === 0) continue;

    const cmd = parts[0].toLowerCase();

    if (cmd === 'reconfig' && savedConfig) {
      for (const saved of savedConfig.selections) {
        const route = routePatterns.find((r) => r.routeId === saved.routeId);
        if (route && saved.patternIndex >= 0 && saved.patternIndex < route.patterns.length) {
          lineStates.get(saved.routeId)!.selectedPattern = saved.patternIndex;
        }
      }
      console.log('Applied saved configuration.');
    }
    if (cmd === 'clear') {
      for (const state of lineStates.values()) {
        state.selectedPattern = null;
      }
      if (existsSync(CONFIG_PATH)) {
        try {
          writeFileSync(CONFIG_PATH, '', 'utf8');
          console.log('Cleared saved configuration.');
        } catch {}
      }
      printList();
      continue;
    }

    if (cmd === 'list') {
      printList();
      continue;
    }

    if (cmd === 'export') {
      const selections = new Map<string, RoutePattern>();
      for (const route of routePatterns) {
        const state = lineStates.get(route.routeId)!;
        if (state.selectedPattern !== null) {
          selections.set(route.routeId, state.patterns[state.selectedPattern]);
        }
      }

      if (selections.size === 0) {
        console.log('No lines selected. Use <line-number> s <N> to select patterns first.');
        continue;
      }

      console.log('Building network from selections...');
      const { stops, lines } = buildNetworkFromSelections(input, selections);

      saveConfig(selections);

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
      rl.close();
      return;
    }

    if (cmd === 'quit') {
      console.log('Exiting without exporting.');
      rl.close();
      return;
    }

    const lineNum = parseInt(cmd, 10);
    if (isNaN(lineNum) || lineNum < 1 || lineNum > routePatterns.length) {
      console.log(`Invalid command or line number. Use 1-${routePatterns.length} for lines.`);
      continue;
    }

    const route = routePatterns[lineNum - 1];
    const state = lineStates.get(route.routeId)!;
    const routeKey = `${route.routeName.padEnd(4)} #${route.routeColor ?? '——'}`;

    if (parts.length === 1) {
      console.log(`Line ${routeKey}: ${state.patterns.length} pattern(s)`);
      for (let i = 0; i < state.patterns.length; i++) {
        console.log(formatPattern(state.patterns[i], i + 1, false, stopById));
      }
      console.log('');
      continue;
    }

    const subcmd = parts[1].toLowerCase();

    if (subcmd === 'd') {
      state.selectedPattern = null;
      console.log(`Deselected line ${route.routeName}`);
      printList();
      continue;
    }

    if (subcmd !== 'p' && subcmd !== 's') {
      console.log(`Unknown subcommand: ${subcmd}. Use 'p' (print stops) or 's' (select pattern).`);
      continue;
    }

    if (parts.length < 3) {
      console.log(`Usage: ${lineNum} ${subcmd} <pattern-number>`);
      continue;
    }

    const patternNum = parseInt(parts[2], 10);
    if (isNaN(patternNum) || patternNum < 1 || patternNum > state.patterns.length) {
      console.log(`Invalid pattern number. Use 1-${state.patterns.length}.`);
      continue;
    }

    const patternIndex = patternNum - 1;
    const pattern = state.patterns[patternIndex];

    if (subcmd === 'p') {
      console.log(`Line ${routeKey}: pattern ${patternNum} (${pattern.stopCount} stops)`);
      console.log(formatPattern(pattern, patternNum, true, stopById));
      console.log('');
    } else {
      state.selectedPattern = patternIndex;
      console.log(`Selected pattern ${patternNum} (${pattern.stopCount} stops) for line ${route.routeName}`);
      printList();
    }
  }
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});