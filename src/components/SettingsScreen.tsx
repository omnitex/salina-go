import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const THEME_KEY = 'salina-go:theme';

type Theme = 'light' | 'dark';

export function SettingsScreen() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      localStorage.removeItem('salina-go:unlocks');
      window.location.hash = '/';
      window.location.reload();
    }
  };

  return (
    <div>
      <Link
        to="/"
        className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <span aria-hidden>←</span> Back
      </Link>

      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Appearance</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Dark mode</p>
              <p className="text-sm text-gray-600">Use dark theme for the interface</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200',
              ].join(' ')}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-red-900 mb-3">Danger zone</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Reset all progress</p>
              <p className="text-sm text-red-700">
                Clears all unlocked stops. Cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={resetProgress}
              className="rounded-lg border-2 border-red-300 bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-900 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Šalina Go</span> — Brno tram collection game.<br />
            Built with ❤️ using KORDIS JMK GTFS data.
          </p>
        </div>
      </div>
    </div>
  );
}