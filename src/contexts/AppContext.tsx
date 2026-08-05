import { createContext, useContext, useMemo } from 'react';
import type { UnlocksRepository } from '../lib/storage/types';
import { LocalUnlocksRepository } from '../lib/storage/local';
import { useUnlocks } from '../lib/useUnlocks';
import { stops, lines } from '../data/load';

interface AppContextValue {
  repo: UnlocksRepository;
  unlockedIds: string[];
  stops: typeof stops;
  lines: typeof lines;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => new LocalUnlocksRepository(), []);
  const unlockedIds = useUnlocks(repo);

  const value: AppContextValue = {
    repo,
    unlockedIds,
    stops,
    lines,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}