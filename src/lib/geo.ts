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
