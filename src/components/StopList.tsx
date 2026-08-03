import type { Stop } from '../data/schema';
import type { UnlocksRepository } from '../lib/storage/types';
import { StopCard } from './StopCard';

interface StopListProps {
  stops: Stop[];
  unlockedIds: string[];
  repo: UnlocksRepository;
  onFirstUnlock?: () => void;
}

export function StopList({ stops, unlockedIds, repo, onFirstUnlock }: StopListProps) {
  const unlockedSet = new Set(unlockedIds);
  return (
    <ul className="space-y-3">
      {stops.map((stop) => (
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
  );
}
