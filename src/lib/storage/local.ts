import type { UnlocksRepository } from './types';

const STORAGE_KEY = 'salina-go:unlocks';

interface UnlockRecord {
  id: string;
  unlockedAt: string;
}

export class LocalUnlocksRepository implements UnlocksRepository {
  private readonly listeners = new Set<() => void>();
  private cachedList: UnlockRecord[] | null = null;
  private cachedStringList: string[] | null = null;
  private readonly storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  isUnlocked(stopId: string): boolean {
    return this.snapshot().some((r) => r.id === stopId);
  }

  list(): string[] {
    const records = this.snapshot();
    if (this.cachedStringList === null) {
      this.cachedStringList = records.map((r) => r.id);
    }
    return this.cachedStringList;
  }

  getUnlockedAt(stopId: string): Date | null {
    const record = this.snapshot().find((r) => r.id === stopId);
    if (!record) return null;
    return new Date(record.unlockedAt);
  }

  unlock(stopId: string): void {
    const current = this.snapshot();
    if (current.some((r) => r.id === stopId)) return;
    const next = [...current, { id: stopId, unlockedAt: new Date().toISOString() }];
    this.writeAndCache(next);
  }

  reset(): void {
    this.writeAndCache([]);
  }

  prune(validStopIds: Set<string>): number {
    const current = this.snapshot();
    const pruned = current.filter((r) => validStopIds.has(r.id));
    const removed = current.length - pruned.length;
    if (removed > 0) this.writeAndCache(pruned);
    return removed;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private snapshot(): UnlockRecord[] {
    if (this.cachedList === null) {
      this.cachedList = this.read();
    }
    return this.cachedList;
  }

  private writeAndCache(next: UnlockRecord[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.cachedList = next;
    this.cachedStringList = next.map((r) => r.id);
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private read(): UnlockRecord[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];

        const first = parsed[0];

        if (typeof first === 'string') {
          const migrated = parsed.map((id): UnlockRecord => ({ id, unlockedAt: new Date().toISOString() }));
          this.writeAndCache(migrated);
          return migrated;
        }

        if (parsed.every((x): x is UnlockRecord =>
          typeof x === 'object' && x !== null &&
          'id' in x && typeof x.id === 'string' &&
          'unlockedAt' in x && typeof x.unlockedAt === 'string'
        )) {
          return parsed;
        }
      }

      return [];
    } catch {
      return [];
    }
  }
}
