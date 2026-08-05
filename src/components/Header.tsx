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
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pb-3 pt-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Šalina GO
          </h1>
          <ProgressBar unlocked={unlocked} total={total} />
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {linesCompleted >= totalLines && totalLines > 0 ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">🏆 All {totalLines} lines completed!</span>
            ) : (
              <>✓ {linesCompleted}/{totalLines} lines completed</>
            )}
          </p>
        </div>
      </div>
    </header>
  );
}
