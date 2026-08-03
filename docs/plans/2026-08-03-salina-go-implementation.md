# Šalina Go — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a mobile-first React MVP where users unlock 5 curated Brno transit stops by physically visiting them (50 m proximity check via Geolocation API).

**Architecture:** Static SPA. App reads `src/data/stops.json` (committed, source-agnostic). A separate CLI script (`scripts/fetch-stops.ts`) populates that JSON from OpenStreetMap via the Overpass API. Unlock state lives in `localStorage` behind an `UnlocksRepository` interface so a future backend can drop in.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind CSS, Zod, Vitest + React Testing Library, canvas-confetti.

**Reference design:** `docs/plans/2026-08-03-salina-go-design.md`

---

## Conventions

- **TDD discipline**: tests first, watch them fail, then implement. Apply to pure logic only (geo, storage, hooks). UI components get smoke tests, not behavior tests.
- **Commit cadence**: one commit per task (or per test+implementation pair). Use conventional-commit messages (`feat:`, `test:`, `chore:`, `docs:`, `refactor:`).
- **File org**: see design doc's "Project structure" section. Don't invent new directories.
- **No `any`, no `@ts-ignore`, no suppressed type errors.** If TypeScript complains, fix the code.
- **Mobile-first**: every UI task must be verified at viewport ~390×844 (iPhone 14) in DevTools before commit.

---

## Task 0: Repo hygiene (`.gitignore`)

**Why:** `.omo/` and Node artifacts will pollute `git status` forever otherwise. Get the ignores right before any code lands.

**Files:**
- Create: `.gitignore`

**Step 1: Write `.gitignore`**

```gitignore
# Dependencies
node_modules/

# Build output
dist/
dist-ssr/

# Editor / OS
.vscode/*
!.vscode/extensions.json
.idea/
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Agent tooling (not part of the project)
.omo/
.cursor/
.cache/

# Env
.env
.env.local
.env.*.local
```

**Step 2: Verify**

Run: `git status`
Expected: `.omo/` no longer appears under "Untracked files".

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore for node, build, and tooling artifacts"
```

---

## Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: many (Vite generates the scaffold)
- Modify: `package.json`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

**Step 1: Scaffold with Vite**

Run from the repo root (`/Users/martinhavlik/personal/salina-go`):

```bash
npm create vite@latest . -- --template react-ts
```

If Vite asks "Current directory is not empty. Remove existing files and continue?" answer **No** — Vite will instead create files alongside what's there. If it errors, use the alternative:

```bash
npm create vite@latest temp-scaffold -- --template react-ts
# then move files manually:
mv temp-scaffold/* temp-scaffold/.* . 2>/dev/null
rm -rf temp-scaffold
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Verify dev server runs**

```bash
npm run dev
```

Expected: prints a localhost URL. Open it; you should see the default Vite+React splash page with a counter button. Stop the dev server with Ctrl+C.

**Step 4: Strip the demo content**

Replace `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <h1 className="p-4 text-xl font-bold">Šalina Go</h1>
    </div>
  );
}
```

Delete `src/App.css` and remove its import if present. Empty out `src/index.css` (Tailwind will own this file in Task 2). Remove the Vite SVG (`public/vite.svg`, `src/assets/react.svg`) — we won't use them.

**Step 5: Verify it still runs**

Run: `npm run dev`
Expected: page shows "Šalina Go" heading. No console errors.

**Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

## Task 2: Install runtime dependencies + configure Tailwind

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`, `package.json`

**Step 1: Install runtime deps**

```bash
npm install zod canvas-confetti
npm install -D tailwindcss postcss autoprefixer @types/canvas-confetti
```

**Step 2: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`.

**Step 3: Configure Tailwind content paths**

Replace the contents of `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Step 4: Write Tailwind directives to `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Verify Tailwind is working**

Temporarily add `className="bg-blue-500"` to the `<h1>` in `src/App.tsx`. Run `npm run dev`. Confirm the heading has a blue background. Then remove the class.

**Step 6: Commit**

```bash
git add .
git commit -m "chore: install Tailwind, Zod, canvas-confetti"
```

---

## Task 3: Install dev dependencies (testing)

**Files:**
- Modify: `package.json`, `vite.config.ts`

**Step 1: Install testing deps**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

**Step 2: Configure Vitest**

Edit `vite.config.ts` to include the test config:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**Step 3: Create the setup file**

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

**Step 4: Verify the test runner works**

Create `tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npx vitest run`
Expected: 1 test passes.

Delete `tests/sanity.test.ts` after verifying.

**Step 5: Add test script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 6: Commit**

```bash
git add .
git commit -m "chore: configure Vitest with jsdom and RTL"
```

---

## Task 4: Data schema (Zod)

**Why:** Everything downstream depends on the `Stop` shape. Lock it in first.

**Files:**
- Create: `src/data/schema.ts`

**Step 1: Write the schema**

```ts
// src/data/schema.ts
import { z } from 'zod';

/**
 * A transit stop. The `id` is the stability anchor for unlock state — it must
 * never change for a given physical stop while unlocks are live.
 *
 * IDs are namespaced by source (`osm:`, `gtfs:`, `jdf:`) so different data
 * sources can never collide and a source swap forces an intentional migration.
 */
export const StopSchema = z.object({
  id: z
    .string()
    .regex(
      /^[a-z]+:[A-Za-z0-9_-]+$/,
      'id must be namespaced, e.g. "osm:1234567890"',
    ),
  name: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
  emoji: z.string().optional(),
  source: z
    .object({
      kind: z.enum(['osm', 'gtfs', 'jdf']),
      osmId: z.number().optional(),
      officialRef: z.string().optional(),
    })
    .optional(),
});

export type Stop = z.infer<typeof StopSchema>;

/** A list of stops, validated as a whole. */
export const StopsFileSchema = z.array(StopSchema);
```

**Step 2: Commit**

```bash
git add src/data/schema.ts
git commit -m "feat(data): add Stop schema with namespaced IDs"
```

---

## Task 5: Stub `stops.json` (empty)

**Why:** The app should handle zero stops gracefully. We'll populate this in Task 11 via the OSM fetcher.

**Files:**
- Create: `src/data/stops.json`

**Step 1: Write the stub**

```json
[]
```

**Step 2: Commit**

```bash
git add src/data/stops.json
git commit -m "feat(data): stub stops.json (populated by fetch-stops script)"
```

---

## Task 6: Wishlist (the curated 5)

**Why:** This is the input to the fetcher. Hand-curated, intentionally small.

**Files:**
- Create: `src/data/wishlist.ts`

**Step 1: Write the wishlist**

```ts
// src/data/wishlist.ts

/**
 * Hand-curated list of stops to include in the app.
 * The fetcher resolves each `displayName` against OpenStreetMap and writes
 * the full Stop entry (with real coordinates and source IDs) to stops.json.
 *
 * The `slug` here is only a human-friendly label inside this file. The actual
 * Stop.id written to JSON is `osm:<node_id>` — never the slug.
 */
export interface WishlistEntry {
  slug: string;        // human label in this file only
  displayName: string; // exact name to match in OSM
  emoji?: string;      // visual flair
}

export const wishlist: WishlistEntry[] = [
  { slug: 'ceska',            displayName: 'Česká',            emoji: '🚋' },
  { slug: 'hlavni-nadrazi',   displayName: 'Hlavní nádraží',   emoji: '🚆' },
  { slug: 'mendlovo-namesti', displayName: 'Mendlovo náměstí', emoji: '🚋' },
  { slug: 'moravske-namesti', displayName: 'Moravské náměstí', emoji: '🚋' },
  { slug: 'pisarky',          displayName: 'Pisárky',          emoji: '🚋' },
];
```

**Step 2: Commit**

```bash
git add src/data/wishlist.ts
git commit -m "feat(data): add curated wishlist of 5 starter stops"
```

---

## Task 7: Geo utilities — `haversineDistanceMeters` (TDD)

**Files:**
- Create: `src/lib/geo.ts`
- Create: `tests/geo.test.ts`

**Step 1: Write the failing test**

```ts
// tests/geo.test.ts
import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters } from '../src/lib/geo';

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 49.195, lon: 16.609 };
    expect(haversineDistanceMeters(p, p)).toBe(0);
  });

  it('matches known distance between Česká and Hlavní nádraží (~700 m)', () => {
    const ceska = { lat: 49.1951, lon: 16.6097 };
    const hlavni = { lat: 49.1902, lon: 16.6123 };
    const d = haversineDistanceMeters(ceska, hlavni);
    // Real-world ~720 m; allow a generous window for input imprecision.
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(850);
  });

  it('matches known long distance Brno→Praha (~190 km)', () => {
    const brno = { lat: 49.195, lon: 16.609 };
    const praha = { lat: 50.087, lon: 14.421 };
    const d = haversineDistanceMeters(brno, praha);
    expect(d).toBeGreaterThan(185_000);
    expect(d).toBeLessThan(200_000);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/geo.test.ts`
Expected: FAIL — module `../src/lib/geo` does not exist.

**Step 3: Implement `haversineDistanceMeters`**

```ts
// src/lib/geo.ts
export interface Coord {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates, in meters.
 */
export function haversineDistanceMeters(a: Coord, b: Coord): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
```

**Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/geo.test.ts`
Expected: PASS (3 tests).

**Step 5: Commit**

```bash
git add src/lib/geo.ts tests/geo.test.ts
git commit -m "feat(geo): add haversineDistanceMeters"
```

---

## Task 8: Geo utilities — `isWithinProximity` (TDD)

**Files:**
- Modify: `src/lib/geo.ts`
- Modify: `tests/geo.test.ts`

**Step 1: Add failing tests**

Append to `tests/geo.test.ts`:

```ts
import { isWithinProximity } from '../src/lib/geo';

describe('isWithinProximity', () => {
  const stop = { lat: 49.1951, lon: 16.6097 }; // Česká

  it('returns true when user is exactly at the stop', () => {
    expect(isWithinProximity(stop, stop, 50)).toBe(true);
  });

  it('returns true at boundary (point 49 m away)', () => {
    // ~0.000442° latitude ≈ 49 m north of stop
    const user = { lat: stop.lat + 0.000442, lon: stop.lon };
    const d = haversineDistanceMeters(stop, user);
    expect(d).toBeLessThanOrEqual(50);
    expect(isWithinProximity(user, stop, 50)).toBe(true);
  });

  it('returns false when user is clearly outside (1 km away)', () => {
    const user = { lat: stop.lat + 0.009, lon: stop.lon };
    expect(isWithinProximity(user, stop, 50)).toBe(false);
  });

  it('honors a custom radius', () => {
    const user = { lat: stop.lat + 0.000442, lon: stop.lon };
    // User is ~49 m away — inside 50 m, outside 20 m.
    expect(isWithinProximity(user, stop, 50)).toBe(true);
    expect(isWithinProximity(user, stop, 20)).toBe(false);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/geo.test.ts`
Expected: FAIL — `isWithinProximity` is not exported.

**Step 3: Implement `isWithinProximity`**

Append to `src/lib/geo.ts`:

```ts
/**
 * Whether `user` is within `radiusM` meters of `target`, by great-circle
 * distance. Default radius is 50 m (the MVP game rule).
 */
export function isWithinProximity(
  user: Coord,
  target: Coord,
  radiusM = 50,
): boolean {
  return haversineDistanceMeters(user, target) <= radiusM;
}
```

**Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/geo.test.ts`
Expected: PASS (7 tests total).

**Step 5: Commit**

```bash
git add src/lib/geo.ts tests/geo.test.ts
git commit -m "feat(geo): add isWithinProximity with default 50m radius"
```

---

## Task 9: Storage interface

**Files:**
- Create: `src/lib/storage/types.ts`

**Step 1: Write the interface**

```ts
// src/lib/storage/types.ts

/**
 * Persistence layer for unlock state.
 *
 * `LocalUnlocksRepository` (localStorage) is the MVP implementation. A future
 * `RemoteUnlocksRepository` wraps an API client with the same shape, so the
 * UI code never changes when a backend arrives.
 */
export interface UnlocksRepository {
  /** Whether a given stop (by namespaced id) has been unlocked. */
  isUnlocked(stopId: string): boolean;
  /** All unlocked stop ids, in insertion order. */
  list(): string[];
  /** Mark a stop as unlocked. Idempotent. */
  unlock(stopId: string): void;
  /** Clear all unlocks. */
  reset(): void;
  /**
   * Subscribe to changes. Returns an unsubscribe function.
   * Used by useSyncExternalStore in the React hook.
   */
  subscribe(listener: () => void): () => void;
}
```

**Step 2: Commit**

```bash
git add src/lib/storage/types.ts
git commit -m "feat(storage): add UnlocksRepository interface"
```

---

## Task 10: `LocalUnlocksRepository` (TDD)

**Files:**
- Create: `src/lib/storage/local.ts`
- Create: `tests/local-repository.test.ts`

**Step 1: Write the failing tests**

```ts
// tests/local-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalUnlocksRepository } from '../src/lib/storage/local';

describe('LocalUnlocksRepository', () => {
  let repo: LocalUnlocksRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalUnlocksRepository();
  });

  it('starts empty', () => {
    expect(repo.list()).toEqual([]);
    expect(repo.isUnlocked('osm:1')).toBe(false);
  });

  it('unlock marks the stop as unlocked', () => {
    repo.unlock('osm:42');
    expect(repo.isUnlocked('osm:42')).toBe(true);
    expect(repo.list()).toEqual(['osm:42']);
  });

  it('unlock is idempotent', () => {
    repo.unlock('osm:42');
    repo.unlock('osm:42');
    expect(repo.list()).toEqual(['osm:42']);
  });

  it('preserves insertion order across multiple unlocks', () => {
    repo.unlock('osm:3');
    repo.unlock('osm:1');
    repo.unlock('osm:2');
    expect(repo.list()).toEqual(['osm:3', 'osm:1', 'osm:2']);
  });

  it('reset clears all unlocks', () => {
    repo.unlock('osm:1');
    repo.reset();
    expect(repo.list()).toEqual([]);
    expect(repo.isUnlocked('osm:1')).toBe(false);
  });

  it('persists across instances (localStorage-backed)', () => {
    repo.unlock('osm:99');
    const fresh = new LocalUnlocksRepository();
    expect(fresh.isUnlocked('osm:99')).toBe(true);
  });

  it('notifies subscribers on unlock', () => {
    let calls = 0;
    repo.subscribe(() => { calls++; });
    repo.unlock('osm:1');
    expect(calls).toBe(1);
  });

  it('notifies subscribers on reset', () => {
    let calls = 0;
    repo.subscribe(() => { calls++; });
    repo.reset();
    expect(calls).toBe(1);
  });

  it('unsubscribe stops notifications', () => {
    let calls = 0;
    const unsub = repo.subscribe(() => { calls++; });
    repo.unlock('osm:1');
    unsub();
    repo.unlock('osm:2');
    expect(calls).toBe(1);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/local-repository.test.ts`
Expected: FAIL — module does not exist.

**Step 3: Implement `LocalUnlocksRepository`**

```ts
// src/lib/storage/local.ts
import type { UnlocksRepository } from './types';

const STORAGE_KEY = 'salina-go:unlocks';

export class LocalUnlocksRepository implements UnlocksRepository {
  private readonly listeners = new Set<() => void>();

  constructor(private readonly storage: Storage = localStorage) {}

  isUnlocked(stopId: string): boolean {
    return this.read().includes(stopId);
  }

  list(): string[] {
    return this.read();
  }

  unlock(stopId: string): void {
    const current = this.read();
    if (current.includes(stopId)) return;
    this.write([...current, stopId]);
    this.emit();
  }

  reset(): void {
    this.write([]);
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private read(): string[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      return [];
    }
  }

  private write(ids: string[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}
```

**Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/local-repository.test.ts`
Expected: PASS (9 tests).

**Step 5: Commit**

```bash
git add src/lib/storage/local.ts tests/local-repository.test.ts
git commit -m "feat(storage): add LocalUnlocksRepository with subscribe"
```

---

## Task 11: `StopsFetcher` interface + OSM implementation

**Files:**
- Create: `src/lib/fetch-stops/types.ts`
- Create: `src/lib/fetch-stops/osm.ts`

**Step 1: Write the fetcher interface**

```ts
// src/lib/fetch-stops/types.ts
import type { Stop } from '../../data/schema';
import type { WishlistEntry } from '../../data/wishlist';

export interface FetchStopResult {
  wishlistEntry: WishlistEntry;
  stop: Stop;
}

/**
 * Resolves wishlist entries into fully-populated Stop records.
 *
 * OsmFetcher (now): queries the Overpass API for public_transport stops
 * matching each displayName inside the Brno bounding box.
 *
 * GtfsFetcher / JdfFetcher (future): same interface, different source.
 */
export interface StopsFetcher {
  fetchAll(entries: WishlistEntry[]): Promise<FetchStopResult[]>;
}
```

**Step 2: Implement the OSM fetcher**

```ts
// src/lib/fetch-stops/osm.ts
import type { Stop } from '../../data/schema';
import type { WishlistEntry } from '../../data/wishlist';
import type { FetchStopResult, StopsFetcher } from './types';

/**
 * Brno bounding box (south, west, north, east) — generous to avoid edge cases.
 */
const BRNO_BBOX = { south: 49.13, west: 16.47, north: 49.30, east: 16.74 };

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Public transport stops in OSM use various tag combinations.
 * We search for any node that looks like a transit stop and matches the name.
 */
function buildQuery(displayName: string): string {
  // Use the public transport stop area within Brno for each name.
  return `
    [out:json][timeout:25];
    (
      node["public_transport"="stop_platform"]["name"="${displayName}"](${BRNO_BBOX.south},${BRNO_BBOX.west},${BRNO_BBOX.north},${BRNO_BBOX.east});
      node["public_transport"="platform"]["name"="${displayName}"](${BRNO_BBOX.south},${BRNO_BBOX.west},${BRNO_BBOX.north},${BRNO_BBOX.east});
      node["highway"="bus_stop"]["name"="${displayName}"](${BRNO_BBOX.south},${BRNO_BBOX.west},${BRNO_BBOX.north},${BRNO_BBOX.east});
      node["railway"="tram_stop"]["name"="${displayName}"](${BRNO_BBOX.south},${BRNO_BBOX.west},${BRNO_BBOX.north},${BRNO_BBOX.east});
    );
    out tags 1;
  `.trim();
}

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

async function queryOverpass(displayName: string): Promise<OverpassElement | null> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(buildQuery(displayName)),
  });
  if (!res.ok) {
    throw new Error(`Overpass returned ${res.status} for "${displayName}"`);
  }
  const json = (await res.json()) as OverpassResponse;
  return json.elements[0] ?? null;
}

export class OsmFetcher implements StopsFetcher {
  async fetchAll(entries: WishlistEntry[]): Promise<FetchStopResult[]> {
    const results: FetchStopResult[] = [];
    for (const entry of entries) {
      const hit = await queryOverpass(entry.displayName);
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
```

**Step 3: Commit**

```bash
git add src/lib/fetch-stops/
git commit -m "feat(fetch-stops): add StopsFetcher interface and OSM impl"
```

---

## Task 12: `scripts/fetch-stops.ts` CLI

**Why:** Runs the fetcher, validates output against the Zod schema, writes `src/data/stops.json`.

**Files:**
- Create: `scripts/fetch-stops.ts`
- Modify: `package.json` (add script)

**Step 1: Install `tsx` for running TypeScript directly**

```bash
npm install -D tsx
```

**Step 2: Write the CLI**

```ts
// scripts/fetch-stops.ts
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StopsFileSchema, type Stop } from '../src/data/schema';
import { wishlist } from '../src/data/wishlist';
import { OsmFetcher } from '../src/lib/fetch-stops/osm';

async function main() {
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
```

**Step 3: Add the npm script**

In `package.json`, inside `"scripts"`, add:

```json
"fetch-stops": "tsx scripts/fetch-stops.ts"
```

**Step 4: Run it**

```bash
npm run fetch-stops
```

Expected: prints `Fetching 5 stops from OpenStreetMap...`, then a list of 5 lines with ids/coords. If Overpass is rate-limited (occasional), wait 30 s and retry.

**Step 5: Inspect the result**

Open `src/data/stops.json`. Verify:
- 5 entries, all with `id: "osm:..."`, `name`, `lat`, `lon`, `emoji`, `source.kind: "osm"`.
- The names match: Česká, Hlavní nádraží, Mendlovo náměstí, Moravské náměstí, Pisárky.
- The lat/lon values look like Brno (lat ~49.1–49.3, lon ~16.5–16.7).

If any entry is missing or wildly off, file it as a bug in the fetcher's name-matching logic, don't hand-edit the JSON.

**Step 6: Commit**

```bash
git add scripts/fetch-stops.ts src/data/stops.json package.json package-lock.json
git commit -m "feat(fetch-stops): add CLI that populates stops.json from OSM"
```

---

## Task 13: `useUnlocks` hook

**Why:** Bridges the imperative repository to React's reactive model.

**Files:**
- Create: `src/lib/useUnlocks.ts`
- Modify: `src/App.tsx` (to instantiate the repository)

**Step 1: Write the hook**

```ts
// src/lib/useUnlocks.ts
import { useSyncExternalStore } from 'react';
import type { UnlocksRepository } from './storage/types';

/**
 * Subscribes to the repository and re-renders on changes.
 * Returns the current array of unlocked stop ids (referentially stable
 * across renders when nothing changes, per useSyncExternalStore contract).
 */
export function useUnlocks(repo: UnlocksRepository): string[] {
  return useSyncExternalStore(
    repo.subscribe.bind(repo) as (cb: () => void) => () => void,
    () => repo.list(),
  );
}
```

**Step 2: Add a test that exercises the hook**

```ts
// tests/useUnlocks.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnlocks } from '../src/lib/useUnlocks';
import { LocalUnlocksRepository } from '../src/lib/storage/local';

describe('useUnlocks', () => {
  it('returns the current unlock list and updates on unlock', () => {
    localStorage.clear();
    const repo = new LocalUnlocksRepository();
    const { result } = renderHook(() => useUnlocks(repo));

    expect(result.current).toEqual([]);

    act(() => repo.unlock('osm:1'));
    expect(result.current).toEqual(['osm:1']);

    act(() => repo.unlock('osm:2'));
    expect(result.current).toEqual(['osm:1', 'osm:2']);
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run tests/useUnlocks.test.tsx`
Expected: PASS (1 test).

**Step 4: Commit**

```bash
git add src/lib/useUnlocks.ts tests/useUnlocks.test.tsx
git commit -m "feat(hooks): add useUnlocks reactive hook"
```

---

## Task 14: Geolocation helper

**Why:** Wraps `navigator.geolocation.getCurrentPosition` in a Promise with a typed error.

**Files:**
- Create: `src/lib/geolocation.ts`

**Step 1: Write the helper**

```ts
// src/lib/geolocation.ts
export interface GeoResult {
  lat: number;
  lon: number;
  /** GPS accuracy in meters (95% confidence radius). */
  accuracyM: number;
}

export type GeoErrorKind =
  | 'unsupported'      // browser lacks navigator.geolocation
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout';

export class GeoError extends Error {
  constructor(public readonly kind: GeoErrorKind, message: string) {
    super(message);
    this.name = 'GeoError';
  }
}

/**
 * One-shot geolocation request. Resolves with the current position.
 * Times out after 10s. Uses high accuracy (GPS-first on mobile).
 */
export function getCurrentPosition(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('unsupported', 'Geolocation not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        });
      },
      (err) => {
        const kind: GeoErrorKind =
          err.code === err.PERMISSION_DENIED    ? 'permission_denied'
          : err.code === err.POSITION_UNAVAILABLE ? 'position_unavailable'
          : err.code === err.TIMEOUT              ? 'timeout'
          : 'position_unavailable';
        reject(new GeoError(kind, err.message));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/geolocation.ts
git commit -m "feat(geo): wrap getCurrentPosition in a typed Promise"
```

---

## Task 15: Load + validate `stops.json`

**Why:** Centralize the import so the Zod check happens once at startup.

**Files:**
- Create: `src/data/load.ts`

**Step 1: Write the loader**

```ts
// src/data/load.ts
import rawStops from './stops.json';
import { StopsFileSchema, type Stop } from './schema';

/**
 * Validated list of stops. If stops.json is malformed this throws at module
 * load time — preferable to a confusing UI crash later.
 */
export const stops: Stop[] = StopsFileSchema.parse(rawStops);
```

**Step 2: Make sure JSON imports work**

Check `tsconfig.json` has `"resolveJsonModule": true` (Vite's default tsconfig does, but verify). If missing, add it.

**Step 3: Commit**

```bash
git add src/data/load.ts
git commit -m "feat(data): validate stops.json at module load"
```

---

## Task 16: `StopCard` — locked & unlocked states

**Why:** The core UI primitive. Build it in two phases: static rendering first, then the interactive unlock flow in Task 17.

**Files:**
- Create: `src/components/StopCard.tsx`

**Step 1: Write the component skeleton**

```tsx
// src/components/StopCard.tsx
import { useState } from 'react';
import type { Stop } from '../data/schema';
import type { UnlocksRepository } from '../lib/storage/types';
import { getCurrentPosition, type GeoError } from '../lib/geolocation';
import { haversineDistanceMeters } from '../lib/geo';

type UnlockState =
  | { kind: 'locked' }
  | { kind: 'requesting' }
  | { kind: 'unlocked'; unlockedAt: Date }
  | { kind: 'too_far'; distanceM: number; accuracyM: number }
  | { kind: 'error'; message: string };

interface StopCardProps {
  stop: Stop;
  unlocked: boolean;
  repo: UnlocksRepository;
  onFirstUnlock?: () => void;  // for confetti
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} d ago`;
}

export function StopCard({ stop, unlocked, repo, onFirstUnlock }: StopCardProps) {
  const [state, setState] = useState<UnlockState>(
    unlocked ? { kind: 'unlocked', unlockedAt: new Date() } : { kind: 'locked' },
  );

  async function handleUnlockClick() {
    setState({ kind: 'requesting' });
    try {
      const pos = await getCurrentPosition();
      const distanceM = haversineDistanceMeters(pos, stop);
      if (distanceM <= 50) {
        const wasUnlocked = repo.isUnlocked(stop.id);
        repo.unlock(stop.id);
        setState({ kind: 'unlocked', unlockedAt: new Date() });
        if (!wasUnlocked && onFirstUnlock) onFirstUnlock();
      } else {
        setState({ kind: 'too_far', distanceM, accuracyM: pos.accuracyM });
      }
    } catch (err) {
      const message = err instanceof GeoError ? friendlyMessage(err) : 'Unexpected error.';
      setState({ kind: 'error', message });
    }
  }

  function friendlyMessage(err: GeoError): string {
    switch (err.kind) {
      case 'unsupported':         return 'Your browser does not support geolocation.';
      case 'permission_denied':   return 'Location permission denied. Enable it in browser settings.';
      case 'position_unavailable':return 'Could not determine your location. Try moving outside.';
      case 'timeout':             return 'Took too long to get your location. Try again.';
    }
  }

  if (state.kind === 'unlocked') {
    return (
      <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-900">{stop.name}</h2>
            <p className="text-sm text-green-700">
              ✓ Unlocked {relativeTime(state.unlockedAt)}
            </p>
          </div>
          <div className="text-4xl" aria-hidden>{stop.emoji ?? '📍'}</div>
        </div>
      </div>
    );
  }

  const muted = state.kind === 'locked';
  return (
    <div className={[
      'rounded-2xl border p-4 shadow-sm',
      muted
        ? 'border-gray-200 bg-white'
        : 'border-amber-200 bg-amber-50',
    ].join(' ')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{stop.name}</h2>
          {state.kind === 'too_far' && (
            <p className="mt-1 text-sm text-amber-700">
              You're {Math.round(state.distanceM)} m away (±{Math.round(state.accuracyM)} m). Get closer!
            </p>
          )}
          {state.kind === 'error' && (
            <p className="mt-1 text-sm text-red-600">{state.message}</p>
          )}
          {state.kind === 'locked' && (
            <p className="mt-1 text-sm text-gray-500">🔒 Not yet collected</p>
          )}
        </div>
        <div className={['text-4xl grayscale', muted ? 'opacity-40' : ''].join(' ')} aria-hidden>
          {stop.emoji ?? '📍'}
        </div>
      </div>
      <button
        type="button"
        onClick={handleUnlockClick}
        disabled={state.kind === 'requesting'}
        className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {state.kind === 'requesting' ? 'Locating you…' : 'Unlock'}
      </button>
    </div>
  );
}
```

**Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/StopCard.tsx
git commit -m "feat(ui): add StopCard with locked/unlocked/error states"
```

---

## Task 17: `Header` + `ProgressBar`

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/ProgressBar.tsx`

**Step 1: Write `ProgressBar`**

```tsx
// src/components/ProgressBar.tsx
interface ProgressBarProps {
  unlocked: number;
  total: number;
}

export function ProgressBar({ unlocked, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((unlocked / total) * 100);
  return (
    <div className="mt-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {unlocked}/{total} collected
      </p>
    </div>
  );
}
```

**Step 2: Write `Header`**

```tsx
// src/components/Header.tsx
import { ProgressBar } from './ProgressBar';

interface HeaderProps {
  unlocked: number;
  total: number;
}

export function Header({ unlocked, total }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 pb-3 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">
        <span aria-hidden>🚋</span> Šalina Go
      </h1>
      <ProgressBar unlocked={unlocked} total={total} />
    </header>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/Header.tsx src/components/ProgressBar.tsx
git commit -m "feat(ui): add Header with progress bar"
```

---

## Task 18: `StopList` + `App` wiring

**Files:**
- Create: `src/components/StopList.tsx`
- Modify: `src/App.tsx`
- Modify: `index.html` (viewport meta, title)

**Step 1: Write `StopList`**

```tsx
// src/components/StopList.tsx
import type { Stop } from '../data/schema';
import type { UnlocksRepository } from '../lib/storage/types';
import { StopCard } from './StopCard';

interface StopListProps {
  stops: Stop[];
  unlockedIds: string[];
  repo: UnlocksRepository;
  onFirstUnlock?: () => void;
}

export function StopList({ stops, unlockedIds, repo, onFirstUnlock }: StopListProps) {
  const unlockedSet = new Set(unlockedIds);
  return (
    <ul className="space-y-3">
      {stops.map((stop) => (
        <li key={stop.id}>
          <StopCard
            stop={stop}
            unlocked={unlockedSet.has(stop.id)}
            repo={repo}
            onFirstUnlock={onFirstUnlock}
          />
        </li>
      ))}
    </ul>
  );
}
```

**Step 2: Wire up `App.tsx`**

```tsx
// src/App.tsx
import confetti from 'canvas-confetti';
import { useMemo } from 'react';
import { stops } from './data/load';
import { LocalUnlocksRepository } from './lib/storage/local';
import { useUnlocks } from './lib/useUnlocks';
import { Header } from './components/Header';
import { StopList } from './components/StopList';

// Single repository instance for the lifetime of the app.
// In a future remote-storage world, swap this for RemoteUnlocksRepository.
const repo = new LocalUnlocksRepository();

function celebrate() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
  });
}

export default function App() {
  const unlockedIds = useUnlocks(repo);
  const unlockedCount = unlockedIds.length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md">
        <Header unlocked={unlockedCount} total={stops.length} />
        <main className="px-4 py-4 pb-[env(safe-area-inset-bottom)]">
          <StopList
            stops={stops}
            unlockedIds={unlockedIds}
            repo={repo}
            onFirstUnlock={celebrate}
          />
        </main>
      </div>
    </div>
  );
}
```

**Step 3: Update `index.html`**

In `index.html`, replace the existing `<meta name="viewport">` line with:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

(If the line is missing, add it inside `<head>`.)

Also change `<title>` to:

```html
<title>Šalina Go</title>
```

**Step 4: Verify it runs**

```bash
npm run dev
```

Open the dev URL. Expected:
- Header reads "🚋 Šalina Go" with progress bar `0/5 collected`.
- 5 cards listed, all in locked state, with Unlock buttons.
- No console errors.

Set viewport to iPhone 14 (390×844) in DevTools. Confirm cards are full-width and touch targets feel right.

**Step 5: Commit**

```bash
git add src/App.tsx src/components/StopList.tsx index.html
git commit -m "feat(ui): wire App, StopList, confetti, viewport meta"
```

---

## Task 19: Type-check, test, and build

**Why:** Make sure the whole thing holds together before manual verification.

**Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

**Step 2: Run tests**

Run: `npm test`
Expected: all tests pass (geo + local-repository + useUnlocks).

**Step 3: Production build**

Run: `npm run build`
Expected: build succeeds, outputs to `dist/`.

**Step 4: Preview the production build**

Run: `npm run preview`
Expected: server starts. Open URL, verify the app still works as in dev.

---

## Task 20: Manual verification on a phone

**Why:** Geolocation can't be triggered under jsdom. The only meaningful test of the unlock flow is on a real device (or with DevTools geolocation spoofing).

**Step 1: Serve the build over HTTPS**

Easiest path: deploy `dist/` to Vercel / Netlify / GitHub Pages. All three serve HTTPS by default, which the Geolocation API requires.

Alternative for local phone testing: use `vite preview --host` and access via your LAN IP. **This will NOT trigger geolocation** — HTTP is blocked. For phone testing you MUST use HTTPS. Use `mkcert` + `vite-plugin-mkcert` if you want local HTTPS, or just deploy.

**Step 2: Open the deployed URL on your phone**

- iOS Safari: should prompt for location permission when you tap Unlock (only after a tap).
- Android Chrome: same.

**Step 3: Test the unlock flow**

For each card:

- **Far from stop** (anywhere not Brno): tap Unlock → should see "You're Xm away" message.
- **At a stop** (physically visit Česká, etc.): tap Unlock → should unlock + confetti + green state.

If you can't visit Brno right now, use Chrome DevTools → Sensors → override location to a stop's lat/lon and verify the success path on desktop.

**Step 4: Test persistence**

- Unlock a stop (via spoofed location).
- Refresh the page.
- Confirm the stop is still unlocked (localStorage persists).

**Step 5: Test permission denial**

- In browser site settings, revoke location permission.
- Tap Unlock on a locked stop.
- Confirm friendly error message appears (not a crash).

---

## Task 21: Final commit + push (optional)

If everything works:

```bash
git status   # confirm clean
git log --oneline  # confirm the chain of commits looks sensible
git push origin main
```

If a `docs/plans/2026-08-03-salina-go-implementation.md` was created during planning (this file), it's already committed at planning time.

---

## Out-of-scope reminders (do NOT add during MVP)

- Do not add a router.
- Do not add rarity, types, lines, boroughs, or history fields. The schema allows them; just don't populate yet.
- Do not add a backend. `UnlocksRepository` is the seam; leave it alone.
- Do not write E2E tests. Manual verification is the gate.
- Do not add PWA/install prompts. Easy later; not now.

## Future enhancements (after MVP, not in this plan)

- Swap OSM→GTFS fetcher (unlocks line numbers, types, schedules).
- Migration script `scripts/migrate-ids.ts` to translate localStorage keys on source swap.
- React Router + completionist views (by line, by borough).
- Rarity, types, sounds, history fields per stop.
- `RemoteUnlocksRepository` backed by an API.
- PWA manifest + service worker for installable Home Screen app.
