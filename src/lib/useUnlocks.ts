import { useSyncExternalStore } from 'react';
import type { UnlocksRepository } from './storage/types';

export function useUnlocks(repo: UnlocksRepository): string[] {
  const subscribe = (cb: () => void): (() => void) => repo.subscribe(cb);
  const getSnapshot = (): string[] => repo.list();
  return useSyncExternalStore(subscribe, getSnapshot);
}
