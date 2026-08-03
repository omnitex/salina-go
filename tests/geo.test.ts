import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters } from '../src/lib/geo';

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
