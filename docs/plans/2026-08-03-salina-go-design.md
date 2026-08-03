# Šalina Go — Design Document

**Status**: Validated brainstorm (2026-08-03). Ready for implementation planning.
**Project type**: Fun personal side-project. Modern best practices, not over-engineered.

## Goal

A mobile-first React web app where users "collect" Brno public transit stops like
Pokémon — physically visiting each stop and unlocking it via the browser's
Geolocation API. MVP scope: 5 curated central-Brno stops, localStorage
persistence, Pokédex-lite visual style.

## Scope (MVP)

- Static SPA, single screen (no router).
- 5 hand-curated popular Brno stops (Česká, Hlavní nádraží, Mendlovo náměstí,
  Moravské náměstí, Pisárky).
- Coordinates sourced from OpenStreetMap via the Overpass API at build time
  (committed JSON; no runtime API dependency).
- localStorage-backed unlock state, behind a swappable repository interface.
- 50 m proximity check using the browser Geolocation API (`getCurrentPosition`,
  one-shot).
- Pokédex-lite UI: locked stops appear as "silhouettes", unlocked stops are
  full-color with a confetti burst on first unlock, progress bar at top.

## Out of scope (future, not now)

- Rarity tiers, transit types, line numbers, boroughs, history tidbits, sounds.
- Completionist views (per-line, per-borough screens).
- Backend sync / cross-device.
- Live data refresh at runtime.

These are documented under **Future evolution** below to make sure the MVP
design doesn't paint us into a corner.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  App UI (React + Tailwind)                       │
│  imports stops from ./data/stops.json            │
│  ← never knows the source                        │
└──────────────────┬──────────────────────────────┘
                   │ static file, committed to repo
┌──────────────────▼──────────────────────────────┐
│  src/data/stops.json  (the contract)             │
│  Schema: { id, name, lat, lon, ... }             │
└──────────────────▲──────────────────────────────┘
                   │ writes
┌──────────────────┴──────────────────────────────┐
│  scripts/fetch-stops.ts                          │
│  implements StopsFetcher interface               │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ OsmFetcher  │ │GtfsFetcher  │ │JdfFetcher  │ │
│  │ (MVP)       │ │ (future)    │ │ (future)   │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
└─────────────────────────────────────────────────┘
```

Two swappability seams:

1. **Data source → JSON**: the fetcher script is replaceable. Switching OSM →
   GTFS is a one-line wiring change in the script.
2. **Storage → App**: the unlock state repository is behind an interface.
   `LocalUnlocksRepository` (now) and a future `RemoteUnlocksRepository`
   (later) both satisfy it.

## Tech stack

- **Vite + React 18 + TypeScript** — modern SPA default, fast dev server.
- **Tailwind CSS** — mobile-first utility classes, fast to write.
- **Zod** — runtime schema validation of `stops.json` (~10 KB, cheap insurance).
- **Vitest + React Testing Library** — for the pure logic (geo, storage) and
  a couple of smoke tests. Not TDD-gospel.
- **canvas-confetti** — tiny celebratory animation on first unlock (Pokédex-lite).
- **No router** — single-screen MVP.
- **Deploy**: static host with HTTPS (GitHub Pages, Vercel, or Netlify).
  HTTPS is non-negotiable: the Geolocation API is blocked on plain HTTP.

## Project structure

```
salina-go/
├── scripts/
│   └── fetch-stops.ts          # CLI: query OSM, write stops.json
├── src/
│   ├── data/
│   │   ├── stops.json          # committed, source-agnostic
│   │   ├── wishlist.ts         # the 5 curated stops (id + name only)
│   │   └── schema.ts           # Stop type + Zod validator
│   ├── lib/
│   │   ├── geo.ts              # haversineDistanceMeters, isWithinProximity
│   │   ├── storage/
│   │   │   ├── types.ts        # UnlocksRepository interface
│   │   │   └── local.ts        # localStorage impl
│   │   ├── fetch-stops/        # used by scripts/fetch-stops.ts
│   │   │   ├── types.ts        # StopsFetcher interface
│   │   │   └── osm.ts          # Overpass impl
│   │   └── useUnlocks.ts       # React hook wrapping the repository
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StopList.tsx
│   │   └── StopCard.tsx        # owns the per-card unlock state machine
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── geo.test.ts
│   └── local-repository.test.ts
├── docs/plans/
│   └── 2026-08-03-salina-go-design.md   # this file
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Data model

```ts
// src/data/schema.ts
import { z } from 'zod';

export const StopSchema = z.object({
  id: z.string().regex(/^[a-z]+:[A-Za-z0-9_-]+$/,
    'id must be namespaced, e.g. "osm:1234567890"'),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  emoji: z.string().optional(),
  source: z.object({
    kind: z.enum(['osm', 'gtfs', 'jdf']),
    osmId: z.number().optional(),
    officialRef: z.string().optional(),
  }).optional(),
});

export type Stop = z.infer<typeof StopSchema>;
```

### Why namespaced opaque IDs

- `id` is the stability anchor for unlock state. It must never change for a
  given physical stop while that stop's unlocks are live.
- Stop **names** can change (renamings), have multiple words, contain colons
  or diacritics (`Mendlovo náměstí`). Names are display-only, never used as
  keys.
- OSM node IDs are stable *within OSM*. GTFS stop IDs are stable *within
  GTFS*. They are not the same identifier space.
- Prefixing with the source (`osm:`, `gtfs:`, `jdf:`) makes the space explicit
  and collision-proof.
- When the project later swaps OSM → GTFS, the new `stops.json` ships with
  different IDs (e.g. `gtfs:U123`). A one-time `migrate-ids.ts` script maps
  old localStorage keys to new ones by matching on `name` (or geography).
  For ~5–20 stops on a personal project, this is ~15 lines of code, run once.

### Wishlist (the curated 5)

```ts
// src/data/wishlist.ts
export const wishlist = [
  { id: 'ceska',            displayName: 'Česká' },           // central tram hub
  { id: 'hlavni-nadrazi',   displayName: 'Hlavní nádraží' },  // main train station
  { id: 'mendlovo-namesti', displayName: 'Mendlovo náměstí' },// south hub
  { id: 'moravske-namesti', displayName: 'Moravské náměstí' },// north of center
  { id: 'pisarky',          displayName: 'Pisárky' },         // western terminus
];
```

The fetcher resolves each `displayName` against Overpass, captures the OSM
node ID and (if present) the `ref` tag, and writes a complete `Stop` entry.
The slug portion of the wishlist `id` is used only as a human-friendly
label in the wishlist source file; the actual `Stop.id` written to JSON is
`osm:<node_id>`.

## Data sourcing flow

```bash
$ npm run fetch-stops
→ reads src/data/wishlist.ts
→ for each entry, queries Overpass for a public_transport=stop node
  whose name matches displayName, inside Brno's bounding box
→ picks the best match (highest match score, prefers nodes with ref tags)
→ writes src/data/stops.json with the validated Stop schema
```

The script is idempotent and git-friendly — re-running it produces a clean
diff (or no diff) that's easy to review.

## Core logic

### `src/lib/geo.ts`

Pure functions, no side effects:

```ts
export interface Coord { lat: number; lon: number }

export function haversineDistanceMeters(a: Coord, b: Coord): number;
export function isWithinProximity(
  user: Coord,
  stop: { lat: number; lon: number },
  radiusM = 50,
): boolean;
```

Haversine is correct for short distances and trivially unit-testable. The
`radiusM` default makes per-stop tuning possible later (e.g. a "boss" stop
with a 20 m radius).

### `src/lib/storage/types.ts`

```ts
export interface UnlocksRepository {
  isUnlocked(stopId: string): boolean;
  list(): string[];
  unlock(stopId: string): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}
```

`subscribe` enables React reactivity. A small `useUnlocks()` hook wraps the
repository in a `useSyncExternalStore` and re-renders on changes.

### Unlock flow (per StopCard)

```
idle → (tap Unlock) → requesting
                       │
                       ├─ GPS success, distance ≤ 50m
                       │   → repo.unlock(stop.id)
                       │   → state: unlocked
                       │   → confetti burst (first time only)
                       │
                       ├─ GPS success, distance > 50m
                       │   → state: too_far
                       │   → message: "You're {distance} m away — get closer!"
                       │   → Retry button
                       │
                       └─ GPS error (denied, timeout, unavailable)
                           → state: error
                           → friendly message + Retry button
```

### Geolocation API notes (gotchas)

- **HTTPS-only** — blocked on plain HTTP. `localhost` is exempt for dev.
- **`coords.accuracy`** — 95% confidence radius in meters. Displayed to the
  user as "±{accuracy} m" but **not** used in the proximity decision (keep
  the rule predictable, not clever).
- **One-shot `getCurrentPosition`** — no tracking, no battery drain. 10s
  timeout, `enableHighAccuracy: true`.
- **Permission prompt** — only triggered on the user's first tap. Browsers
  remember the decision; a future "Reset" clears unlocks but not the OS-level
  permission.

## UI/UX (Pokédex-lite)

### Layout

```
┌──────────────────────────────┐
│  🚋 Šalina Go                 │   Header
│  ━━━━━━━░░░ 2/5 collected     │   Progress bar (Pokédex vibe)
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ ✓ Česká            🚋  │  │   Unlocked card (green accent)
│  │   Unlocked 2 days ago   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔒 Hlavní nádraží  🚆  │  │   Locked card (silhouette / muted)
│  │   [    Unlock    ]      │  │
│  └────────────────────────┘  │
│  ... 3 more cards ...        │
└──────────────────────────────┘
```

### Components

| Component | Responsibility |
|---|---|
| `App.tsx` | Owns the repository instance; renders `Header` + `StopList` |
| `Header` | Title + progress bar |
| `ProgressBar` | Visual `unlockedCount / total` |
| `StopList` | Maps `stops` → `StopCard` |
| `StopCard` | One card; owns the per-card unlock state machine |

### StopCard states

| State | Visual |
|---|---|
| `locked` | Muted colors, 🔒, big Unlock button |
| `requesting` | Button becomes spinner + "Locating you…" |
| `unlocked` | Green accent, ✓ badge, "Unlocked {rel-time}" (no button) |
| `too_far` | Stays muted, distance message + Retry |
| `error` | Red note + Retry |

### Mobile-first rules

- Single column, full-width cards.
- Touch targets ≥ 44 px (Apple HIG minimum).
- No hover-only interactions.
- Big Unlock button, thumb-reachable.
- Safe-area insets for notched phones via `env(safe-area-inset-bottom)`.

### Pokédex-lite flavor

- Locked stops show a grayed-out emoji (silhouette effect).
- Unlocked stops show full-color emoji + check.
- Progress bar fills like a Pokédex.
- First unlock triggers a brief `canvas-confetti` burst.

## Testing

| Test target | Tool |
|---|---|
| `haversineDistanceMeters` | Vitest, a few known-good cases |
| `isWithinProximity` boundary | Vitest, 49 m / 50 m / 51 m cases |
| `LocalUnlocksRepository` | Vitest, fake `localStorage` |
| `StopCard` rendering | RTL, locked + unlocked smoke tests |
| `fetch-stops.ts` | Manual — run once, eyeball the JSON |

No E2E tests for MVP. Geolocation can't be triggered in jsdom; manual
verification on a real phone is the only meaningful test.

## Deployment

- Static host with HTTPS (GitHub Pages, Vercel, or Netlify — pick later).
- `npm run build` produces a `dist/` folder; upload it.
- For iOS Safari users: prompt them to add to Home Screen for full-screen
  PWA feel (out of scope to implement, but easy later via `manifest.json`).

## Future evolution (out of scope for MVP)

| Feature | How it slots in | Cost |
|---|---|---|
| Rarity tiers | Add `rarity?: 'common' \| 'rare' \| 'legendary'` field | Just data |
| Transit types | Add `types?: TransitType[]` field | OSM already tags; GTFS gives free |
| Lines passing through | Add `lines?: string[]` field | **OSM→GTFS swap unlocks this** |
| Borough / district | Add `borough?: string` field | One lat/lon→polygon lookup |
| History tidbits | Add `description?: string` field | Hand-curated, ~5 lines per stop |
| Sounds | Web Audio hook on unlock | New hook, no schema change |
| Completionist views | Add React Router + new screens | Trivial late addition |
| Cross-device sync | `RemoteUnlocksRepository` impl | Drop-in over existing interface |

The interesting one: **the OSM→GTFS migration gives you line numbers, types,
and schedule data for free** — so it's not just a data-quality upgrade, it's
a feature unlock. Prioritize it when you start wanting rarity/lines.
