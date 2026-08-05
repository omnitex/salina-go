import type { UnlocksRepository } from './types';

const STORAGE_KEY = 'salina-go:unlocks';

export class LocalUnlocksRepository implements UnlocksRepository {
  private readonly listeners = new Set<() => void>();
  private cachedList: string[] | null = null;
  private readonly storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  isUnlocked(stopId: string): boolean {
    return this.snapshot().includes(stopId);
  }

  list(): string[] {
    return this.snapshot();
  }

  unlock(stopId: string): void {
    const current = this.snapshot();
    if (current.includes(stopId)) return;
    const next = [...current, stopId];
    this.writeAndCache(next);
  }

  reset(): void {
    this.writeAndCache([]);
  }

  prune(validStopIds: Set<string>): number {
    const current = this.snapshot();
    const pruned = current.filter((id) => validStopIds.has(id));
    const removed = current.length - pruned.length;
    if (removed > 0) this.writeAndCache(pruned);
    return removed;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private snapshot(): string[] {
    if (this.cachedList === null) {
      this.cachedList = this.read();
    }
    return this.cachedList;
  }

  private writeAndCache(next: string[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.cachedList = next;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private read(): string[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      return [];
    }
  }
}
