import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Line, Stop } from '../data/schema';
import type { UnlocksRepository } from '../lib/storage/types';
import { StopCard } from './StopCard';
import { ProgressBar } from './ProgressBar';

interface LineDetailScreenProps {
  lines: Line[];
  stops: Stop[];
  unlockedIds: string[];
  repo: UnlocksRepository;
  onFirstUnlock?: () => void;
}

export function LineDetailScreen({
  lines,
  stops,
  unlockedIds,
  repo,
  onFirstUnlock,
}: LineDetailScreenProps) {
  const { lineId } = useParams<{ lineId: string }>();
  const line = lines.find((l) => l.id === lineId);

  if (!line) {
    return <div>Line not found</div>;
  }

  const [isReversed, setIsReversed] = useState(false);
  const storageKey = `line-reversed-${line.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'true') setIsReversed(true);
  }, [storageKey]);

  const toggleReverse = () => {
    const newValue = !isReversed;
    setIsReversed(newValue);
    localStorage.setItem(storageKey, String(newValue));
  };

  const unlockedSet = new Set(unlockedIds);
  const lineStops = line.stopIds
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is Stop => s !== undefined);

  const displayedStops = isReversed ? [...lineStops].reverse() : lineStops;

  const unlockedCount = line.stopIds.filter((id) => unlockedSet.has(id)).length;
  const isComplete = line.stopIds.length > 0 && unlockedCount >= line.stopIds.length;
  const bgColor = line.routeColor ?? '#9CA3AF';

  return (
    <div>
      <Link
        to="/"
        className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      >
        <span aria-hidden>←</span> All lines
      </Link>

      <div
        className={[
          'mb-4 rounded-2xl border-2 p-4 shadow-sm',
          isComplete ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: bgColor }}
            aria-hidden
          >
            {line.id}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line {line.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unlockedCount} / {line.stopIds.length} stops
              {isComplete && <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">✓ Completed</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleReverse}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label={isReversed ? 'Show stops in original order' : 'Show stops in reverse order'}
            title={isReversed ? 'Show stops in original order' : 'Show stops in reverse order'}
          >
            {isReversed ? '↺' : '↻'}
          </button>
        </div>
        <div className="mt-3">
          <ProgressBar unlocked={unlockedCount} total={line.stopIds.length} />
        </div>
      </div>

      <ul className="space-y-3">
        {displayedStops.map((stop) => (
          <li key={stop.id}>
            <StopCard
              stop={stop}
              unlocked={unlockedSet.has(stop.id)}
              repo={repo}
              onFirstUnlock={onFirstUnlock}
            />
          </li>
        ))}
      </ul>

      <footer className="mt-8 px-4 py-4 text-center text-xs text-gray-400 dark:text-gray-600">
        Data: KORDIS JMK · OSM contributors
      </footer>
    </div>
  );
}
