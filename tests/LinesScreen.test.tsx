import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { LinesScreen } from '../src/components/LinesScreen';
import { AppProvider } from '../src/contexts/AppContext';
import type { Line, Stop } from '../src/data/schema';

const lines: Line[] = [
  { id: '1', name: '1', routeColor: '#D40000', stopIds: ['gtfs:S1', 'gtfs:S2'] },
  { id: '2', name: '2', routeColor: '#4AB95D', stopIds: ['gtfs:S2', 'gtfs:S3', 'gtfs:S4'] },
];

const stops: Stop[] = [
  { id: 'gtfs:S1', name: 'Alpha', lat: 49.1, lon: 16.5, lines: ['1'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S1' } },
  { id: 'gtfs:S2', name: 'Bravo', lat: 49.2, lon: 16.6, lines: ['1', '2'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S2' } },
  { id: 'gtfs:S3', name: 'Charlie', lat: 49.3, lon: 16.7, lines: ['2'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S3' } },
  { id: 'gtfs:S4', name: 'Delta', lat: 49.4, lon: 16.8, lines: ['2'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S4' } },
];

describe('LinesScreen', () => {
  it('renders one LineCard per line', () => {
    render(
      <HashRouter>
        <AppProvider>
          <LinesScreen
            lines={lines}
            stops={stops}
            unlockedIds={[]}
          />
        </AppProvider>
      </HashRouter>,
    );
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
  });

  it('shows per-line progress based on unlockedIds', () => {
    render(
      <HashRouter>
        <AppProvider>
          <LinesScreen
            lines={lines}
            stops={stops}
            unlockedIds={['gtfs:S1']}
          />
        </AppProvider>
      </HashRouter>,
    );
    // Line 1 has 1/2 unlocked (S1)
    expect(screen.getByText('1/2 collected')).toBeInTheDocument();
    // Line 2 has 0/3 unlocked
    expect(screen.getByText('0/3 collected')).toBeInTheDocument();
  });

  it('navigates to line detail when a card is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <HashRouter>
        <AppProvider>
          <LinesScreen
            lines={lines}
            stops={stops}
            unlockedIds={[]}
          />
        </AppProvider>
      </HashRouter>,
    );
    const buttons = container.querySelectorAll('a');
    await user.click(buttons[1]); // Line 2
    expect(window.location.hash).toBe('#/line/2');
  });
});