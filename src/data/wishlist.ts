/**
 * Hand-curated list of stops to include in the app.
 * The fetcher resolves each `displayName` against OpenStreetMap and writes
 * the full Stop entry (with real coordinates and source IDs) to stops.json.
 *
 * The `slug` here is only a human-friendly label inside this file. The actual
 * Stop.id written to JSON is `osm:<node_id>` — never the slug.
 */
export interface WishlistEntry {
  slug: string;        // human label in this file only
  displayName: string; // exact name to match in OSM
  emoji?: string;      // visual flair
}

export const wishlist: WishlistEntry[] = [
  { slug: 'ceska',            displayName: 'Česká',            emoji: '🚋' },
  { slug: 'hlavni-nadrazi',   displayName: 'Hlavní nádraží',   emoji: '🚆' },
  { slug: 'mendlovo-namesti', displayName: 'Mendlovo náměstí', emoji: '🚋' },
  { slug: 'moravske-namesti', displayName: 'Moravské náměstí', emoji: '🚋' },
  { slug: 'pisarky',          displayName: 'Pisárky',          emoji: '🚋' },
];
