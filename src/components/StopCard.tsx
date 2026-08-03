import { useState } from 'react';
import type { Stop } from '../data/schema';
import type { UnlocksRepository } from '../lib/storage/types';
import { getCurrentPosition, type GeoError } from '../lib/geolocation';
import { haversineDistanceMeters } from '../lib/geo';

type UnlockState =
  | { kind: 'locked' }
  | { kind: 'requesting' }
  | { kind: 'unlocked'; unlockedAt: Date }
  | { kind: 'too_far'; distanceM: number; accuracyM: number }
  | { kind: 'error'; message: string };

interface StopCardProps {
  stop: Stop;
  unlocked: boolean;
  repo: UnlocksRepository;
  onFirstUnlock?: () => void;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} d ago`;
}

function friendlyGeoMessage(err: GeoError): string {
  switch (err.kind) {
    case 'unsupported':          return 'Your browser does not support geolocation.';
    case 'permission_denied':    return 'Location permission denied. Enable it in browser settings.';
    case 'position_unavailable': return 'Could not determine your location. Try moving outside.';
    case 'timeout':              return 'Took too long to get your location. Try again.';
  }
}

export function StopCard({ stop, unlocked, repo, onFirstUnlock }: StopCardProps) {
  const [state, setState] = useState<UnlockState>(
    unlocked ? { kind: 'unlocked', unlockedAt: new Date() } : { kind: 'locked' },
  );

  async function handleUnlockClick() {
    setState({ kind: 'requesting' });
    try {
      const pos = await getCurrentPosition();
      const distanceM = haversineDistanceMeters(pos, stop);
      if (distanceM <= 50) {
        const wasUnlocked = repo.isUnlocked(stop.id);
        repo.unlock(stop.id);
        setState({ kind: 'unlocked', unlockedAt: new Date() });
        if (!wasUnlocked && onFirstUnlock) onFirstUnlock();
      } else {
        setState({ kind: 'too_far', distanceM, accuracyM: pos.accuracyM });
      }
    } catch (err) {
      const message =
        err instanceof GeoError ? friendlyGeoMessage(err) : 'Unexpected error.';
      setState({ kind: 'error', message });
    }
  }

  if (state.kind === 'unlocked') {
    return (
      <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-900">{stop.name}</h2>
            <p className="text-sm text-green-700">
              ✓ Unlocked {relativeTime(state.unlockedAt)}
            </p>
          </div>
          <div className="text-4xl" aria-hidden>{stop.emoji ?? '📍'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={[
      'rounded-2xl border p-4 shadow-sm',
      state.kind === 'locked'
        ? 'border-gray-200 bg-white'
        : 'border-amber-200 bg-amber-50',
    ].join(' ')}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{stop.name}</h2>
          {state.kind === 'too_far' && (
            <p className="mt-1 text-sm text-amber-700">
              You're {Math.round(state.distanceM)} m away (±{Math.round(state.accuracyM)} m). Get closer!
            </p>
          )}
          {state.kind === 'error' && (
            <p className="mt-1 text-sm text-red-600">{state.message}</p>
          )}
          {state.kind === 'locked' && (
            <p className="mt-1 text-sm text-gray-500">🔒 Not yet collected</p>
          )}
        </div>
        <div className={['text-4xl', state.kind === 'locked' ? 'opacity-40 grayscale' : ''].join(' ')} aria-hidden>
          {stop.emoji ?? '📍'}
        </div>
      </div>
      <button
        type="button"
        onClick={handleUnlockClick}
        disabled={state.kind === 'requesting'}
        className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {state.kind === 'requesting' ? 'Locating you…' : 'Unlock'}
      </button>
    </div>
  );
}
