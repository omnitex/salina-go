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
