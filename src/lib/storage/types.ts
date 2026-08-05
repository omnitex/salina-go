/**
 * Persistence layer for unlock state.
 *
 * `LocalUnlocksRepository` (localStorage) is the MVP implementation. A future
 * `RemoteUnlocksRepository` wraps an API client with the same shape, so the
 * UI code never changes when a backend arrives.
 */
export interface UnlocksRepository {
  /** Whether a given stop (by namespaced id) has been unlocked. */
  isUnlocked(stopId: string): boolean;
  /** All unlocked stop ids, in insertion order. */
  list(): string[];
  /** Mark a stop as unlocked. Idempotent. */
  unlock(stopId: string): void;
  /** Clear all unlocks. */
  reset(): void;
  /**
   * Remove stops not present in the provided valid set.
   * Returns the number of orphaned stops removed.
   */
  prune(validStopIds: Set<string>): number;
  /**
   * Subscribe to changes. Returns an unsubscribe function.
   * Used by useSyncExternalStore in the React hook.
   */
  subscribe(listener: () => void): () => void;
}
