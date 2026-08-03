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
