import confetti from 'canvas-confetti';
import { stops } from './data/load';
import { LocalUnlocksRepository } from './lib/storage/local';
import { useUnlocks } from './lib/useUnlocks';
import { Header } from './components/Header';
import { StopList } from './components/StopList';

// Single repository instance for the lifetime of the app.
// Swap for RemoteUnlocksRepository when a backend arrives.
const repo = new LocalUnlocksRepository();

function celebrate() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
  });
}

export default function App() {
  const unlockedIds = useUnlocks(repo);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md">
        <Header unlocked={unlockedIds.length} total={stops.length} />
        <main className="px-4 py-4 pb-[env(safe-area-inset-bottom)]">
          <StopList
            stops={stops}
            unlockedIds={unlockedIds}
            repo={repo}
            onFirstUnlock={celebrate}
          />
        </main>
      </div>
    </div>
  );
}
