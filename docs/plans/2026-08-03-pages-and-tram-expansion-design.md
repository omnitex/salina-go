# Šalina Go — Tram Expansion & Pages Deployment Design

**Status**: In-progress brainstorm (2026-08-03).
**Project type**: Personal alpha. Modern best practices, not over-engineered.

## Goal

Two parallel improvements to the existing MVP (5-stop, localStorage-only, run-locally app):

1. **Deploy the app publicly** via GitHub Pages, with CI auto-deploy on every push.
2. **Expand from 5 curated stops to all ~300 Brno tram stops**, sourced from the official GTFS feed, with line-centric navigation and inline completion indicators as the foundation for a future achievement system.

Shipped in two phases: Pages first (small, immediate value), then the tram expansion (larger, multi-session).

## Background

The existing MVP (commit `1e5d58a` and earlier) ships:
- 5 curated Brno stops sourced from OSM via Overpass
- localStorage unlock state behind a swappable `UnlocksRepository`
- 50m haversine proximity check
- Pokédex-lite single-screen UI
- All pure-logic unit-tested (17 tests)

The architecture was deliberately designed to allow swapping data sources and adding fields without rewrites — see `docs/plans/2026-08-03-salina-go-design.md` → "Future evolution".

## Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Stop scope | All tram stops (~300) | Tram lines are iconic; bus data is noisy; can add trolleybuses later |
| Data source | GTFS (clean slate, no migration) | Authoritative, weekly-updated, CC-BY-4.0 licensed, includes line data structurally |
| Navigation | Line-centric | Achievement loop visible at a glance; drilldown keeps each screen small (~30 stops per line) |
| Achievement level | Data + inline completion (B) | Smallest piece that makes the dopamine hit of "line completed" visible |
| Hosting | GitHub Actions CI on push to main | Auto-deploy on every commit; one-time setup |
| Repo | `omnitex/salina-go` (public) | Pages requires public for free tier |

### Data source verified

- **Official feed**: `https://kordis-jmk.cz/gtfs/gtfs.zip`
- **Publisher**: KORDIS JMK
- **License**: CC-BY-4.0 (requires attribution somewhere in app footer)
- **Update cadence**: weekly
- **Coverage**: 348 routes, 6,308 stops, 1 agency (whole IDS JMK region — we filter to trams)
- **Transitland mirror**: `https://www.transit.land/feeds/f-u2e-idsjmk` (backup if primary URL down)

Tram-only filter: `routes.txt` has `route_type` field, value `0` = tram. ~13 day-time lines, ~300 unique stops after dedup.

## Phase 1: GitHub Pages Deployment

Small, low-risk, immediate value. Ships the existing MVP publicly.

### Changes

**1. `vite.config.ts` — set base path:**

```ts
export default defineConfig({
  base: '/salina-go/',
  plugins: [react(), tailwindcss()],
  test: { /* ... existing ... */ },
});
```

`/salina-go/` matches the `omnitex.github.io/salina-go/` URL. Without this, Vite emits absolute asset paths that 404 on Pages subpaths.

**2. `.github/workflows/deploy.yml` — CI pipeline:**

On push to `main`:
- Checkout
- Setup Node 22 (matches local)
- `npm ci`
- `npm run build`
- Upload `dist/` as a Pages artifact
- Deploy to GitHub Pages

Uses official GitHub actions: `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`.

**3. Repo settings (manual one-time, done by user):**

GitHub UI → Settings → Pages → Build and deployment → Source: **GitHub Actions** (not the legacy "Deploy from a branch" mode).

### Subtleties

- `npm run dev` ignores `base` — always serves from root. To verify the production base path locally, use `npm run preview` after `npm run build`.
- HTTPS is automatic on Pages — Geolocation API will work in production without any extra setup.
- No app code changes, no test changes. Pure infrastructure.

---

## Phase 2: Tram Expansion

### Section 2: Schema changes

Two new types alongside the existing `Stop`:

```ts
// src/data/schema.ts (additions)

/** A tram line. id is the line number as a string, e.g. "12". */
export const LineSchema = z.object({
  id: z.string(),                          // "12"
  name: z.string(),                        // display name
  routeColor: z.string().optional(),       // hex "#E2001A" if GTFS provides route_color
  stopIds: z.array(z.string()),            // all stop ids served by this line, in route order
});
export type Line = z.infer<typeof LineSchema>;

// Stop gains a `lines` field:
export const StopSchema = z.object({
  id: z.string(),                          // now: "gtfs:U1234" (was "osm:...")
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  emoji: z.string().optional(),
  lines: z.array(z.string()).default([]),  // line ids serving this stop: ["5", "9", "12"]
  source: z.object({
    kind: z.literal('gtfs'),
    gtfsStopId: z.string(),                // raw GTFS stop_id, e.g. "U1234"
  }).optional(),
});
```

Two data files:

```
src/data/
  stops.json    # array of Stop
  lines.json    # array of Line
  load.ts       # validates both, exports { stops, lines }
```

**Why two files?** Stops and lines are conceptually different things with different lifecycles. A stop exists independently of its lines; a line is defined by its stop memberships.

**Why `stopIds` on Line, not `lineIds` on Stop?** We need both directions:

- Line → stops (line detail screen)
- Stop → lines (showing "served by 5, 9, 12" on a StopCard)

`Line.stopIds` is the source of truth; `Stop.lines` is a denormalized convenience the fetcher computes. Avoids runtime computation, makes JSON readable.

**ID scheme change**: `osm:<node_id>` → `gtfs:<stop_id>`. Existing 5 unlocks become orphans (alpha decision). No migration script needed.

**`routeColor`**: Brno tram lines have official colors. If GTFS provides `route_color`, use it. Otherwise fallback palette keyed by line id.

### Section 3: GTFS fetcher

The current fetcher architecture (`StopsFetcher` interface, `OsmFetcher` impl, wishlist-driven) doesn't fit — we want **all** tram stops + their lines, not a curated subset. Cleaner to replace than extend.

**New shape:**

```ts
// src/lib/fetch-network/types.ts
export interface FetchedNetwork {
  stops: Stop[];
  lines: Line[];
}

export interface NetworkFetcher {
  fetch(): Promise<FetchedNetwork>;
}
```

`OsmFetcher`, `WishlistEntry`, and the old `StopsFetcher` interface get deleted. The architectural seam (swappable fetchers) survives — `NetworkFetcher` is the new contract; a future `JdfFetcher` or revised `OsmFetcher` would implement it.

**`GtfsFetcher` implementation** (~80 lines + a CSV parser):

1. Download `https://kordis-jmk.cz/gtfs/gtfs.zip`, extract in-memory.
2. Parse 4 CSV files: `routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt`.
3. Filter `routes.txt` to `route_type=0` (tram). Collect their `route_id`s.
4. From `trips.txt`: collect `trip_id`s belonging to those routes.
5. From `stop_times.txt`: collect (`trip_id`, `stop_id`) pairs for those trips.
6. Join with `stops.txt` for coordinates + names.
7. Build `Line` per route (id from `route_short_name`, stopIds in first-trip order).
8. Build `Stop` per unique stop id, with `lines` derived from reverse-indexing line→stops.
9. Validate via Zod, write `stops.json` + `lines.json`.

**CSV parsing**: no new dep. Use Node's `readline` + a ~20-line CSV parser (handles quoted fields, commas inside quotes). GTFS files are simple RFC 4180.

**CLI**: `npm run fetch-network` replaces `npm run fetch-stops`. The old script gets deleted.

**Attribution (CC-BY-4.0)**: app footer gains "Data: KORDIS JMK · OSM contributors". A short `ATTRIBUTION.md` in the repo root documents the source URLs and license.

**Per-stop emojis**: without the wishlist, every stop gets `🚋` by default. Special emojis (e.g. `🚆` for the train station) can be hand-tagged in a small overrides map keyed by stop id, populated on demand. Not required for alpha.

### Section 4: UI restructure (line-centric)

Two screens, state-switched (no router):

```ts
type View =
  | { kind: 'lines' }
  | { kind: 'line-detail'; lineId: string };
```

**Component tree:**

```
App
├── Header                                    // updated
│   ├── 🚋 Šalina Go
│   ├── Overall progress: ━━━░░░ X/300 stops
│   └── ✓ Y/13 lines completed                // NEW inline completion stat
└── main
    ├── (View: 'lines')     → LinesScreen     // NEW (replaces StopList as primary)
    └── (View: 'line-detail') → LineDetailScreen

LinesScreen
├── list of LineCard                          // NEW component
│   ├── Line badge (colored by routeColor, e.g. "12")
│   ├── Progress bar: ━━━━━░░░ 18/30
│   └── ✓ or 🏆 badge when complete (special styling)
└── (no search for alpha — ~13 lines is browseable)

LineDetailScreen
├── Back button (chevron ←)
├── Line header: badge + "Line 12 — 18/30 stops" + ✓ if complete
└── List of existing StopCard (in route order)
```

**Component changes summary:**

| Component | Status | Change |
|---|---|---|
| `Header` | Modify | Add "Y/13 lines completed" line; show overall stop progress. |
| `StopCard` | Reuse as-is | Works unchanged inside LineDetailScreen. |
| `StopList` | Delete | Replaced by LinesScreen + LineDetailScreen. |
| `LinesScreen` | New | Lists lines with progress + completion indicators. |
| `LineCard` | New | One row per line: badge, progress, completion mark. |
| `LineDetailScreen` | New | Back button + header + list of StopCards for one line. |
| `ProgressBar` | Reuse | Used both overall (header) and per-line. |

**StopCard enhancement (small, optional in alpha):** show "Served by lines 5, 9, 12" subtitle when unlocked. For alpha we can skip this — defer until users ask for it.

**Completion indicator visual rules:**

- Line progress `< 100%`: normal card, gray progress bar.
- Line progress `= 100%`: card gets a gold border + ✓ badge + slightly green-tinted background. Header "Y/13 lines completed" increments.
- All 13 lines complete: a special banner at the top of LinesScreen ("You completed the entire tram network 🏆").

**State for navigation:** plain `useState<View>({ kind: 'lines' })`. Back button sets it back to `{ kind: 'lines' }`. No router, no URL changes. Add router later if you want shareable deep links to specific lines.

**Footer** (new): tiny `Data: KORDIS JMK · OSM contributors · About` line at the bottom of every screen. Required by CC-BY-4.0 attribution.

### Section 5: Testing approach and implementation order

**Testing strategy** (deliberately lightweight, matches MVP):

| What | How | Why |
|---|---|---|
| CSV parser | Vitest unit tests against a tiny fixture (~5 lines of fake `routes.txt`). | Pure logic, easy to test, catches the obvious bugs (quoted fields, missing columns). |
| GTFS → Network transform | Vitest unit tests against a synthetic minimal feed (3 routes, 6 stops, 4 trips). | Pure logic, the highest-value test — this is where "did we join the tables correctly?" lives. |
| `GtfsFetcher` end-to-end (live network) | Manual: run `npm run fetch-network`, eyeball the JSON, sanity-check 13 lines + ~300 stops. | Can't meaningfully mock the live feed without rewriting half the fetcher. |
| Existing geo + storage + useUnlocks tests | Keep running unchanged. | The pure-logic layer doesn't change. |
| New UI components (`LinesScreen`, `LineCard`, `LineDetailScreen`) | Smoke tests via RTL: renders without crashing, shows expected line numbers, completion indicator appears when progress = 100%. | Matches MVP testing depth. |
| Manual verification (final gate) | Deploy on Pages, open on phone, complete a real line, see the ✓ indicator + stat update. | Geolocation can't be triggered in jsdom — same constraint as MVP. |

**What we don't add** (YAGNI for alpha): E2E browser tests, snapshot tests, visual regression.

**Implementation order** (each task ends with a commit, like before):

| # | Task | Lines of code (rough) |
|---|---|---|
| 1 | Phase 1: Vite base path + GitHub Actions YAML | ~50 (mostly YAML) |
| 2 | Enable Pages in repo settings → MVP goes live | (manual click) |
| 3 | Phase 2 starts: add `LineSchema`, update `StopSchema` with `lines` + `gtfs` source | ~30 |
| 4 | Write inline CSV parser + tests | ~50 + ~30 tests |
| 5 | Write `parseGtfsNetwork()` transform + tests (synthetic fixture) | ~80 + ~60 tests |
| 6 | Write `GtfsFetcher` (download zip, extract, call transform) | ~50 |
| 7 | Update `scripts/fetch-stops.ts` → `scripts/fetch-network.ts`, run it, populate `stops.json` + `lines.json` | ~30 |
| 8 | Delete `OsmFetcher`, `WishlistEntry`, old `StopsFetcher` interface | (deletion) |
| 9 | Update `src/data/load.ts` to load + validate both files | ~15 |
| 10 | Add `View` type + state in `App.tsx` (skeleton, no new screens yet) | ~20 |
| 11 | Build `LineCard` + smoke test | ~50 + ~20 tests |
| 12 | Build `LinesScreen` + smoke test | ~40 + ~20 tests |
| 13 | Build `LineDetailScreen` (reuses StopCard) + smoke test | ~40 + ~20 tests |
| 14 | Update `Header` with overall stop progress + lines completed stat | ~30 |
| 15 | Add completion visual states on LineCard (gold border, ✓) + all-lines-complete banner | ~30 |
| 16 | Add Footer with attribution | ~10 |
| 17 | Manual verification: deploy on Pages, complete a real line on phone | (manual) |

17 tasks, ~600 lines of new code (excluding data + tests), spread across two phases. Phase 1 is tasks 1–2; Phase 2 is 3–17.

**Ship gates:**
- After task 2: MVP live on Pages.
- After task 9: backend/data layer swapped, app still works on `npm run dev` (with stale UI — old StopList still in place but reading new data shape). This intermediate state is OK because the schema is backward-compatible-ish (`lines` defaults to `[]`).
- After task 16: full alpha feature-complete.
- After task 17: alpha shipped.

## Open questions to resolve during implementation

- **GTFS `stop_id` format**: unknown until we look at real data. Could be numeric, `U1234`, or `K987`. The schema accepts any string, so this is display-only.
- **`route_color` availability in JMK feed**: if absent, fallback palette. Check during task 7.
- **Multiple stops with same name across different platforms**: keep as separate collectibles (each platform = one stop). Realistic for the collection-game metaphor.
- **Direction variants**: GTFS uses `direction_id` for outbound/inbound. For our purposes, both directions of a line count toward the same line completion (a stop on either direction counts). Implicit in the join logic.
