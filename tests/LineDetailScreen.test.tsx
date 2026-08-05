import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { LineDetailScreen } from '../src/components/LineDetailScreen';
import { LocalUnlocksRepository } from '../src/lib/storage/local';
import { AppProvider } from '../src/contexts/AppContext';
import type { Line, Stop } from '../src/data/schema';

const line: Line = {
  id: '5',
  name: '5',
  routeColor: '#F31D7F',
  stopIds: ['gtfs:S1', 'gtfs:S2', 'gtfs:S3'],
};

const stops: Stop[] = [
  { id: 'gtfs:S1', name: 'Alpha', lat: 49.1, lon: 16.5, lines: ['5'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S1' } },
  { id: 'gtfs:S2', name: 'Bravo', lat: 49.2, lon: 16.6, lines: ['5'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S2' } },
  { id: 'gtfs:S3', name: 'Charlie', lat: 49.3, lon: 16.7, lines: ['5'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S3' } },
];

const lines: Line[] = [line];

function renderLineDetailScreen(unlockedIds: string[] = []) {
  return render(
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route
            path="/line/:lineId"
            element={
              <LineDetailScreen
                lines={lines}
                stops={stops}
                unlockedIds={unlockedIds}
                repo={new LocalUnlocksRepository()}
              />
            }
          />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </AppProvider>
    </HashRouter>,
  );
}

describe('LineDetailScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '#/line/5');
  });

  it('renders the line header with name and progress fraction', async () => {
    renderLineDetailScreen();

    await waitFor(() => {
      expect(screen.getByText('Alpha – Charlie')).toBeInTheDocument();
      expect(screen.getByText('0 / 3 stops')).toBeInTheDocument();
    });
  });

  it('renders one StopCard per stop in the line', async () => {
    renderLineDetailScreen();

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Bravo')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('shows the completion mark when all stops are unlocked', async () => {
    renderLineDetailScreen(['gtfs:S1', 'gtfs:S2', 'gtfs:S3']);

    await waitFor(() => {
      expect(screen.getByText('✓ Completed')).toBeInTheDocument();
    });
  });

  it('does not show the completion mark when stops are still locked', async () => {
    renderLineDetailScreen(['gtfs:S1']);

    await waitFor(() => {
      expect(screen.queryByText('✓ Completed')).not.toBeInTheDocument();
    });
  });

  it('navigates back when the back button is clicked', async () => {
    const user = userEvent.setup();
    renderLineDetailScreen();

    await waitFor(() => {
      const backButton = screen.getByRole('link', { name: /lines/i });
      expect(backButton).toBeInTheDocument();
    });

    const backButton = screen.getByRole('link', { name: /lines/i });
    await user.click(backButton);
    expect(window.location.hash).toBe('#/lines');
  });
});