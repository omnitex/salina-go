import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters, isWithinProximity } from '../src/lib/geo';

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 49.195, lon: 16.609 };
    expect(haversineDistanceMeters(p, p)).toBe(0);
  });

  it('returns a plausible Brno intra-city distance (~500-1000 m)', () => {
    const ceska = { lat: 49.1951, lon: 16.6097 };
    const hlavni = { lat: 49.1902, lon: 16.6123 };
    const d = haversineDistanceMeters(ceska, hlavni);
    // Inputs are approximate — verify magnitude, not specific distance.
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(1_000);
  });

  it('matches known long distance Brno→Praha (~190 km)', () => {
    const brno = { lat: 49.195, lon: 16.609 };
    const praha = { lat: 50.087, lon: 14.421 };
    const d = haversineDistanceMeters(brno, praha);
    expect(d).toBeGreaterThan(185_000);
    expect(d).toBeLessThan(200_000);
  });
});

describe('isWithinProximity', () => {
  const stop = { lat: 49.1951, lon: 16.6097 }; // Česká

  it('returns true when user is exactly at the stop', () => {
    expect(isWithinProximity(stop, stop, 50)).toBe(true);
  });

  it('returns true at boundary (point ~49 m away)', () => {
    // ~0.000442° latitude ≈ 49 m north of stop
    const user = { lat: stop.lat + 0.000442, lon: stop.lon };
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
