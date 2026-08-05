import type { Line } from '../data/schema';
import { ProgressBar } from './ProgressBar';

interface LineCardProps {
  line: Line;
  unlockedCount: number;
  onSelect: () => void;
}

function naturalLineOrder(a: Line, b: Line): number {
  const an = parseInt(a.id, 10);
  const bn = parseInt(b.id, 10);
  if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  return a.id.localeCompare(b.id);
}

export function sortLines(lines: Line[]): Line[] {
  return [...lines].sort(naturalLineOrder);
}

export function LineCard({ line, unlockedCount, onSelect }: LineCardProps) {
  const total = line.stopIds.length;
  const isComplete = total > 0 && unlockedCount >= total;
  const bgColor = line.routeColor ?? '#9CA3AF';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition',
        isComplete
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
      ].join(' ')}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: bgColor }}
        aria-hidden
      >
        {line.id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">Line {line.name}</h3>
          {isComplete && (
            <span className="shrink-0 text-amber-600 dark:text-amber-400 font-semibold" aria-label="Completed">
              ✓
            </span>
          )}
        </div>
        <ProgressBar unlocked={unlockedCount} total={total} />
      </div>
    </button>
  );
}
