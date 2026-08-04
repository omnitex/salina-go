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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md">
        <Header unlocked={unlockedIds.length} total={stops.length} />
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
