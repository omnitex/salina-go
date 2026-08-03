import rawStops from './stops.json';
import { StopsFileSchema, type Stop } from './schema';

// If stops.json is malformed, fail loudly at module load rather than
// rendering a confusing broken UI.
export const stops: Stop[] = StopsFileSchema.parse(rawStops);
