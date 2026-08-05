import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { TitleSection } from '../components/TitleSection';
import { HomeScreen } from '../components/HomeScreen';
import { LinesScreen } from '../components/LinesScreen';
import { LineDetailScreen } from '../components/LineDetailScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { useAppContext } from '../contexts/AppContext';

export function AppRoutes() {
  const { repo, unlockedIds, stops, lines } = useAppContext();
  const location = useLocation();

  const unlockedSet = new Set(unlockedIds);
  const allLineStopIds = new Set(lines.flatMap((l) => l.stopIds));
  const orphanedUnlocks = unlockedIds.filter((id) => !allLineStopIds.has(id));

  const isCleanupView = location.pathname === '/cleanup';

  if (orphanedUnlocks.length > 0 && !isCleanupView) {
    const handleCleanup = () => {
      repo.prune(allLineStopIds);
      window.location.hash = '/cleanup';
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="mx-auto max-w-md px-4 py-8">
          <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-6">
            <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">Data cleanup needed</h1>
            <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
              Found {orphanedUnlocks.length} unlocked stop(s) that no longer exist in any line.
              This can happen when the network data changes (e.g., hand-picking different routes).
            </p>
            <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
              Current total collected: <strong>{unlockedIds.length}</strong><br />
              Valid (in current lines): <strong>{unlockedIds.length - orphanedUnlocks.length}</strong><br />
              Orphaned (to remove): <strong>{orphanedUnlocks.length}</strong>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCleanup}
                className="flex-1 rounded-lg bg-amber-600 dark:bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 dark:hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Clean up orphaned data
              </button>
              <button
                type="button"
                onClick={() => (window.location.hash = '/cleanup')}
                className="flex-1 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const linesCompleted = lines.filter(
    (l) => l.stopIds.length > 0 && l.stopIds.every((id) => unlockedSet.has(id)),
  ).length;

  const isHome = location.pathname === '/';

  function celebrate() {
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-md">
        {!isHome && <Header
          unlocked={unlockedIds.length}
          total={stops.length}
          linesCompleted={linesCompleted}
          totalLines={lines.length}
        />}
        {isHome && <TitleSection />}
        <main className="px-4 py-4 pb-[env(safe-area-inset-bottom)]">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route
              path="/lines"
              element={
                <LinesScreen
                  lines={lines}
                  stops={stops}
                  unlockedIds={unlockedIds}
                />
              }
            />
            <Route
              path="/line/:lineId"
              element={
                <LineDetailScreen
                  lines={lines}
                  stops={stops}
                  unlockedIds={unlockedIds}
                  repo={repo}
                  onFirstUnlock={celebrate}
                />
              }
            />
            <Route path="/cleanup" element={<div>Cleanup complete. Reloading...</div>} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </main>
        <footer className="px-4 py-4 text-center text-xs text-gray-400 dark:text-gray-600">
          Data: KORDIS JMK · OSM contributors
        </footer>
      </div>
    </div>
  );
}