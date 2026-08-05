import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

function renderWithRouter() {
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
                unlockedIds={[]}
                repo={new LocalUnlocksRepository()}
              />
            }
          />
        </Routes>
      </AppProvider>
    </HashRouter>,
  );
}

describe('LineDetailScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the line header with name and progress fraction', () => {
    renderWithRouter();
    window.location.hash = '#/line/5';
    expect(screen.getByText('Line 5')).toBeInTheDocument();
    expect(screen.getByText('0 / 3 stops')).toBeInTheDocument();
  });

  it('renders one StopCard per stop in the line', () => {
    renderWithRouter();
    window.location.hash = '#/line/5';
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows the completion mark when all stops are unlocked', () => {
    render(
      <HashRouter>
        <AppProvider>
          <Routes>
            <Route
              path="/line/:lineId"
              element={
                <LineDetailScreen
                  lines={lines}
                  stops={stops}
                  unlockedIds={['gtfs:S1', 'gtfs:S2', 'gtfs:S3']}
                  repo={new LocalUnlocksRepository()}
                />
              }
            />
          </Routes>
        </AppProvider>
      </HashRouter>,
    );
    window.location.hash = '#/line/5';
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();
  });

  it('does not show the completion mark when stops are still locked', () => {
    render(
      <HashRouter>
        <AppProvider>
          <Routes>
            <Route
              path="/line/:lineId"
              element={
                <LineDetailScreen
                  lines={lines}
                  stops={stops}
                  unlockedIds={['gtfs:S1']}
                  repo={new LocalUnlocksRepository()}
                />
              }
            />
          </Routes>
        </AppProvider>
      </HashRouter>,
    );
    window.location.hash = '#/line/5';
    expect(screen.queryByText('✓ Completed')).not.toBeInTheDocument();
  });

  it('navigates back when the back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();
    window.location.hash = '#/line/5';

    const backButton = screen.getByRole('link', { name: /all lines/i });
    await user.click(backButton);
    expect(window.location.hash).toBe('#/');
  });
});