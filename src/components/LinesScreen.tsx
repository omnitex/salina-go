import type { Line, Stop } from '../data/schema';
import { LineCard, sortLines } from './LineCard';

interface LinesScreenProps {
  lines: Line[];
  stops: Stop[];
  unlockedIds: string[];
  onSelectLine: (lineId: string) => void;
}

export function LinesScreen({ lines, unlockedIds, onSelectLine }: LinesScreenProps) {
  const unlockedSet = new Set(unlockedIds);
  const sorted = sortLines(lines);

  return (
    <ul className="space-y-3">
      {sorted.map((line) => {
        const unlockedCount = line.stopIds.filter((id) => unlockedSet.has(id)).length;
        return (
          <li key={line.id}>
            <LineCard
              line={line}
              unlockedCount={unlockedCount}
              onSelect={() => onSelectLine(line.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
