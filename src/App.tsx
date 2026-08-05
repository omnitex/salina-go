import { useState } from 'react';
import confetti from 'canvas-confetti';
import { stops, lines } from './data/load';
import { LocalUnlocksRepository } from './lib/storage/local';
import { useUnlocks } from './lib/useUnlocks';
import { Header } from './components/Header';
import { LinesScreen } from './components/LinesScreen';
import { LineDetailScreen } from './components/LineDetailScreen';

// Single repository instance for the lifetime of the app.
// Swap for RemoteUnlocksRepository when a backend arrives.
const repo = new LocalUnlocksRepository();

type View =
  | { kind: 'lines' }
  | { kind: 'line-detail'; lineId: string };

function celebrate() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
  });
}

export default function App() {
  const unlockedIds = useUnlocks(repo);
  const [view, setView] = useState<View>({ kind: 'lines' });

  const allLineStopIds = new Set(lines.flatMap((l) => l.stopIds));
  const orphanedUnlocks = unlockedIds.filter((id) => !allLineStopIds.has(id));

  if (orphanedUnlocks.length > 0 && view.kind === 'lines') {
    const handleCleanup = () => {
      repo.prune(allLineStopIds);
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-md px-4 py-8">
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
            <h1 className="text-lg font-semibold text-amber-900 mb-3">Data cleanup needed</h1>
            <p className="text-amber-800 text-sm mb-4">
              Found {orphanedUnlocks.length} unlocked stop(s) that no longer exist in any line.
              This can happen when the network data changes (e.g., hand-picking different routes).
            </p>
            <p className="text-amber-800 text-sm mb-4">
              Current total collected: <strong>{unlockedIds.length}</strong><br />
              Valid (in current lines): <strong>{unlockedIds.length - orphanedUnlocks.length}</strong><br />
              Orphaned (to remove): <strong>{orphanedUnlocks.length}</strong>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCleanup}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Clean up orphaned data
              </button>
              <button
                type="button"
                onClick={() => setView({ kind: 'lines' })}
                className="flex-1 rounded-lg border-2 border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unlockedSet = new Set(unlockedIds);
  const linesCompleted = lines.filter(
    (l) => l.stopIds.length > 0 && l.stopIds.every((id) => unlockedSet.has(id)),
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md">
        <Header
          unlocked={unlockedIds.length}
          total={stops.length}
          linesCompleted={linesCompleted}
          totalLines={lines.length}
        />
        <main className="px-4 py-4 pb-[env(safe-area-inset-bottom)]">
          {view.kind === 'lines' ? (
            <LinesScreen
              lines={lines}
              stops={stops}
              unlockedIds={unlockedIds}
              onSelectLine={(lineId) => setView({ kind: 'line-detail', lineId })}
            />
          ) : (
            <LineDetailScreen
              line={lines.find((l) => l.id === view.lineId)!}
              stops={stops}
              unlockedIds={unlockedIds}
              repo={repo}
              onBack={() => setView({ kind: 'lines' })}
              onFirstUnlock={celebrate}
            />
          )}
        </main>
        <footer className="px-4 py-4 text-center text-xs text-gray-400">
          Data: KORDIS JMK · OSM contributors
        </footer>
      </div>
    </div>
  );
}
