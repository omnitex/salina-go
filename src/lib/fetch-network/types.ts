import type { FetchedNetwork } from './transform';

/**
 * Resolves the full tram network (stops + lines) from a transit feed.
 *
 * GtfsFetcher (now): downloads the KORDIS JMK GTFS zip, filters to trams,
 * joins routes/trips/stop_times/stops into a network.
 *
 * A future JdfFetcher or revised OsmFetcher-with-routes would implement
 * the same contract.
 */
export interface NetworkFetcher {
  fetch(): Promise<FetchedNetwork>;
}
