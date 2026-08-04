import rawStops from './stops.json';
import rawLines from './lines.json';
import { StopsFileSchema, LinesFileSchema, type Stop, type Line } from './schema';

// If either file is malformed, fail loudly at module load rather than
// rendering a confusing broken UI.
export const stops: Stop[] = StopsFileSchema.parse(rawStops);
export const lines: Line[] = LinesFileSchema.parse(rawLines);
