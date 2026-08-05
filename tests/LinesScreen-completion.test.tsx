import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { LinesScreen } from '../src/components/LinesScreen';
import { AppProvider } from '../src/contexts/AppContext';
import type { Line, Stop } from '../src/data/schema';

const lines: Line[] = [
  { id: '1', name: '1', routeColor: '#D40000', stopIds: ['gtfs:S1', 'gtfs:S2'] },
  { id: '2', name: '2', routeColor: '#4AB95D', stopIds: ['gtfs:S3'] },
];

const stops: Stop[] = [
  { id: 'gtfs:S1', name: 'Alpha', lat: 0, lon: 0, lines: ['1'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S1' } },
  { id: 'gtfs:S2', name: 'Bravo', lat: 0, lon: 0, lines: ['1'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S2' } },
  { id: 'gtfs:S3', name: 'Charlie', lat: 0, lon: 0, lines: ['2'], emoji: '🚋', source: { kind: 'gtfs', gtfsStopId: 'S3' } },
];

describe('LinesScreen completion banner', () => {
  it('does NOT render the banner when not all lines are complete', () => {
    render(
      <HashRouter>
        <AppProvider>
          <LinesScreen
            lines={lines}
            stops={stops}
            unlockedIds={['gtfs:S1', 'gtfs:S2']}
          />
        </AppProvider>
      </HashRouter>,
    );
    // Line 1 complete, Line 2 not
    expect(screen.queryByText(/completed the entire tram network/i)).not.toBeInTheDocument();
  });

  it('renders the banner when all lines are complete', () => {
    render(
      <HashRouter>
        <AppProvider>
          <LinesScreen
            lines={lines}
            stops={stops}
            unlockedIds={['gtfs:S1', 'gtfs:S2', 'gtfs:S3']}
          />
        </AppProvider>
      </HashRouter>,
    );
    expect(screen.getByText(/completed the entire tram network/i)).toBeInTheDocument();
  });
});