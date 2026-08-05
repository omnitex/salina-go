import { Link } from 'react-router-dom';
import type { Line, Stop } from '../data/schema';
import { LineCard, sortLines } from './LineCard';

interface LinesScreenProps {
  lines: Line[];
  stops: Stop[];
  unlockedIds: string[];
}

function isLineComplete(line: Line, unlockedSet: Set<string>): boolean {
  return (
    line.stopIds.length > 0 &&
    line.stopIds.every((id) => unlockedSet.has(id))
  );
}

export function LinesScreen({ lines, unlockedIds }: LinesScreenProps) {
  const unlockedSet = new Set(unlockedIds);
  const sorted = sortLines(lines);
  const completedCount = lines.filter((l) => isLineComplete(l, unlockedSet)).length;
  const allComplete = lines.length > 0 && completedCount === lines.length;

  return (
    <div>
      {allComplete && (
        <div className="mb-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-4 text-center shadow-sm">
          <div className="text-3xl" aria-hidden>🏆</div>
          <p className="mt-1 font-semibold text-amber-800 dark:text-amber-200">
            You completed the entire tram network!
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {lines.length} lines · {lines.reduce((n, l) => n + l.stopIds.length, 0)} stops collected
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {sorted.map((line) => {
          const unlockedCount = line.stopIds.filter((id) => unlockedSet.has(id)).length;
          return (
            <li key={line.id}>
              <Link to={`/line/${line.id}`}>
                <LineCard
                  line={line}
                  unlockedCount={unlockedCount}
                  onSelect={() => {}}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
