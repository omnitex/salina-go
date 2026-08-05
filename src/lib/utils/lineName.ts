import type { Line, Stop } from '../../data/schema';

/**
 * Formats a line name as "StartStop – EndStop" for display.
 * Falls back to "Line {lineName}" if stops are unavailable.
 */
export function getLineDisplayName(line: Line, stops: Stop[]): string {
  if (line.stopIds.length === 0) {
    return `Line ${line.name}`;
  }

  const firstStopId = line.stopIds[0];
  const lastStopId = line.stopIds[line.stopIds.length - 1];

  const firstStop = stops.find((s) => s.id === firstStopId);
  const lastStop = stops.find((s) => s.id === lastStopId);

  if (firstStop && lastStop) {
    return `${firstStop.name} – ${lastStop.name}`;
  }

  return `Line ${line.name}`;
}