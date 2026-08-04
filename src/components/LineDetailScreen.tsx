import type { Line, Stop } from '../data/schema';
import type { UnlocksRepository } from '../lib/storage/types';
import { StopCard } from './StopCard';
import { ProgressBar } from './ProgressBar';

interface LineDetailScreenProps {
  line: Line;
  stops: Stop[];
  unlockedIds: string[];
  repo: UnlocksRepository;
  onBack: () => void;
  onFirstUnlock?: () => void;
}

export function LineDetailScreen({
  line,
  stops,
  unlockedIds,
  repo,
  onBack,
  onFirstUnlock,
}: LineDetailScreenProps) {
  const unlockedSet = new Set(unlockedIds);
  const lineStops = line.stopIds
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is Stop => s !== undefined);
  const unlockedCount = line.stopIds.filter((id) => unlockedSet.has(id)).length;
  const isComplete = line.stopIds.length > 0 && unlockedCount >= line.stopIds.length;
  const bgColor = line.routeColor ?? '#9CA3AF';

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <span aria-hidden>←</span> All lines
      </button>

      <div
        className={[
          'mb-4 rounded-2xl border-2 p-4 shadow-sm',
          isComplete ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white',
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
            <h2 className="text-lg font-semibold text-gray-900">Line {line.name}</h2>
            <p className="text-sm text-gray-600">
              {unlockedCount} / {line.stopIds.length} stops
              {isComplete && <span className="ml-2 text-amber-600 font-semibold">✓ Completed</span>}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar unlocked={unlockedCount} total={line.stopIds.length} />
        </div>
      </div>

      <ul className="space-y-3">
        {lineStops.map((stop) => (
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
    </div>
  );
}
