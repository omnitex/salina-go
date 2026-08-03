import type { UnlocksRepository } from './types';

const STORAGE_KEY = 'salina-go:unlocks';

export class LocalUnlocksRepository implements UnlocksRepository {
  private readonly listeners = new Set<() => void>();

  constructor(private readonly storage: Storage = localStorage) {}

  isUnlocked(stopId: string): boolean {
    return this.read().includes(stopId);
  }

  list(): string[] {
    return this.read();
  }

  unlock(stopId: string): void {
    const current = this.read();
    if (current.includes(stopId)) return;
    this.write([...current, stopId]);
    this.emit();
  }

  reset(): void {
    this.write([]);
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
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

  private write(ids: string[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}
