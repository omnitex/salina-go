import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineDetailScreen } from '../src/components/LineDetailScreen';
import { LocalUnlocksRepository } from '../src/lib/storage/local';
import type { Line, Stop } from '../src/data/schema';

const line: Line = {
  id: '5',
  name: '5',
  routeColor: '#F31D7F',
  stopIds: ['gtfs:S1', 'gtfs:S2', 'gtfs:S3'],
};

const stops: Stop[] = [
  { id: 'gtfs:S1', name: 'Alpha', lat: 49.1, lon: 16.5, lines: ['5'] },
  { id: 'gtfs:S2', name: 'Bravo', lat: 49.2, lon: 16.6, lines: ['5'] },
  { id: 'gtfs:S3', name: 'Charlie', lat: 49.3, lon: 16.7, lines: ['5'] },
];

describe('LineDetailScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the line header with name and progress fraction', () => {
    render(
      <LineDetailScreen
        line={line}
        stops={stops}
        unlockedIds={[]}
        repo={new LocalUnlocksRepository()}
        onBack={() => {}}
      />,
    );
    expect(screen.getByText('Line 5')).toBeInTheDocument();
    expect(screen.getByText('0 / 3 stops')).toBeInTheDocument();
  });

  it('renders one StopCard per stop in the line', () => {
    render(
      <LineDetailScreen
        line={line}
        stops={stops}
        unlockedIds={[]}
        repo={new LocalUnlocksRepository()}
        onBack={() => {}}
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows the completion mark when all stops are unlocked', () => {
    render(
      <LineDetailScreen
        line={line}
        stops={stops}
        unlockedIds={['gtfs:S1', 'gtfs:S2', 'gtfs:S3']}
        repo={new LocalUnlocksRepository()}
        onBack={() => {}}
      />,
    );
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();
  });

  it('does not show the completion mark when stops are still locked', () => {
    render(
      <LineDetailScreen
        line={line}
        stops={stops}
        unlockedIds={['gtfs:S1']}
        repo={new LocalUnlocksRepository()}
        onBack={() => {}}
      />,
    );
    expect(screen.queryByText('✓ Completed')).not.toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    let went = false;
    render(
      <LineDetailScreen
        line={line}
        stops={stops}
        unlockedIds={[]}
        repo={new LocalUnlocksRepository()}
        onBack={() => { went = true; }}
      />,
    );
    await user.click(screen.getByRole('button', { name: /all lines/i }));
    expect(went).toBe(true);
  });
});
