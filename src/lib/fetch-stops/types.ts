import type { Stop } from '../../data/schema';
import type { WishlistEntry } from '../../data/wishlist';

export interface FetchStopResult {
  wishlistEntry: WishlistEntry;
  stop: Stop;
}

/**
 * Resolves wishlist entries into fully-populated Stop records.
 *
 * OsmFetcher (now): queries the Overpass API for public_transport stops
 * matching each displayName inside the Brno bounding box.
 *
 * GtfsFetcher / JdfFetcher (future): same interface, different source.
 */
export interface StopsFetcher {
  fetchAll(entries: WishlistEntry[]): Promise<FetchStopResult[]>;
}
