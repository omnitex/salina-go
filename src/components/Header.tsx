import { ProgressBar } from './ProgressBar';

interface HeaderProps {
  unlocked: number;
  total: number;
}

export function Header({ unlocked, total }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-4 pb-3 pt-6">
      <h1 className="text-2xl font-bold text-gray-900">
        <span aria-hidden>🚋</span> Šalina Go
      </h1>
      <ProgressBar unlocked={unlocked} total={total} />
    </header>
  );
}
