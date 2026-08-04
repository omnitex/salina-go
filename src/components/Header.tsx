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
    </header>
  );
}
