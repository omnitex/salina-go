interface ProgressBarProps {
  unlocked: number;
  total: number;
}

export function ProgressBar({ unlocked, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((unlocked / total) * 100);
  return (
    <div className="mt-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {unlocked}/{total} collected
      </p>
    </div>
  );
}
