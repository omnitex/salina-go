import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';

interface HeaderProps {
  unlocked: number;
  total: number;
  linesCompleted: number;
  totalLines: number;
}

export function Header({ unlocked, total, linesCompleted, totalLines }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 pb-3 pt-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            <span aria-hidden>🚋</span> Šalina Go
          </h1>
          <ProgressBar unlocked={unlocked} total={total} />
          <p className="mt-1 text-sm text-gray-600">
            {linesCompleted >= totalLines && totalLines > 0 ? (
              <span className="font-semibold text-amber-600">🏆 All {totalLines} lines completed!</span>
            ) : (
              <>✓ {linesCompleted}/{totalLines} lines completed</>
            )}
          </p>
        </div>
        <Link
          to="/settings"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Settings"
          title="Settings"
        >
          ⚙️
        </Link>
      </div>
    </header>
  );
}
