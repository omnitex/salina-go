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
