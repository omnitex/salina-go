import '@testing-library/jest-dom';

// jsdom 30 + Node 22+ conflict: Node's experimental `localStorage` shadows
// jsdom's, and jsdom ends up exposing neither. Provide a minimal in-memory
// shim so app code (which uses `localStorage` directly) works in tests.
// Semantics match the Storage Web IDL; persistence across instances is
// preserved by reusing one store, matching real browser behavior.
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

const shim = new MemoryStorage();
(globalThis as unknown as { localStorage: Storage }).localStorage = shim;
