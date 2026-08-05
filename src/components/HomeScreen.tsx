import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import tramIcon from '@/assets/tram-icon.png?url';

export function HomeScreen() {
  const { unlockedIds, stops } = useAppContext();

  const unlockedCount = unlockedIds.length;
  const totalStops = stops.length;
  const percent = totalStops > 0 ? Math.round((unlockedCount / totalStops) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Lines Tile */}
        <Link
          to="/lines"
          className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <img src={tramIcon} alt="Tram" className="w-27 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Lines
          </h2>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {percent}% complete
          </p>
        </Link>

        {/* Achievements Tile (WIP) */}
        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 shadow-sm opacity-60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl grayscale" aria-hidden>🏆</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              WIP
            </span>
          </div>
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Achievements
          </h2>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full rounded-full bg-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Coming soon
          </p>
        </div>

        {/* Map Tile (WIP) */}
        <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 shadow-sm opacity-60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl grayscale" aria-hidden>🗺️</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
              WIP
            </span>
          </div>
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Map
          </h2>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full rounded-full bg-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Coming soon
          </p>
        </div>

        {/* Settings Tile */}
        <Link
          to="/settings"
          className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl" aria-hidden>⚙️</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Settings
          </h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Preferences & about
          </p>
        </Link>
      </div>
    </div>
  );
}