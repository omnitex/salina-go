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
      'id must be namespaced, e.g. "gtfs:U1234"',
    ),
  name: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
  emoji: z.string().optional(),
  lines: z.array(z.string()).default([]),
  zoneId: z.string().optional(),
  locationType: z.number().optional(),
  parentStation: z.string().optional(),
  wheelchairBoarding: z.number().optional(),
  platformCode: z.string().optional(),
  source: z
    .object({
      kind: z.enum(['osm', 'gtfs', 'jdf']),
      osmId: z.number().optional(),
      gtfsStopId: z.string().optional(),
      officialRef: z.string().optional(),
    })
    .optional(),
});

export type Stop = z.infer<typeof StopSchema>;

/** A list of stops, validated as a whole. */
export const StopsFileSchema = z.array(StopSchema);

/**
 * A tram line. `id` is the line number as a string, e.g. "12".
 * `stopIds` is the source of truth for membership; `Stop.lines` is the
 * denormalized reverse, computed by the fetcher.
 */
export const LineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  routeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'routeColor must be hex like "#E2001A"')
    .optional(),
  stopIds: z.array(z.string()),
});

export type Line = z.infer<typeof LineSchema>;

/** A list of lines, validated as a whole. */
export const LinesFileSchema = z.array(LineSchema);
