import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineCard } from '../src/components/LineCard';
import type { Line } from '../src/data/schema';

const baseLine: Line = {
  id: '12',
  name: '12',
  routeColor: '#00CCFF',
  stopIds: ['gtfs:S1', 'gtfs:S2', 'gtfs:S3'],
};

describe('LineCard', () => {
  it('renders the line id and progress fraction', () => {
    render(<LineCard line={baseLine} unlockedCount={1} onSelect={() => {}} />);
    expect(screen.getByText('Line 12')).toBeInTheDocument();
    // ProgressBar renders "1/3 collected"
    expect(screen.getByText('1/3 collected')).toBeInTheDocument();
  });

  it('does not show a completion mark when progress < 100%', () => {
    render(<LineCard line={baseLine} unlockedCount={2} onSelect={() => {}} />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('shows the completion mark when all stops unlocked', () => {
    render(<LineCard line={baseLine} unlockedCount={3} onSelect={() => {}} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    let clicked = false;
    const { container } = render(
      <LineCard line={baseLine} unlockedCount={0} onSelect={() => { clicked = true; }} />,
    );
    const button = container.querySelector('button')!;
    await user.click(button);
    expect(clicked).toBe(true);
  });
});
