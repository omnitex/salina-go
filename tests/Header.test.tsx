import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { Header } from '../src/components/Header';

describe('Header lines-completed stat', () => {
  it('shows the lines-completed fraction when not all done', () => {
    render(
      <HashRouter>
        <Header unlocked={10} total={149} linesCompleted={2} totalLines={13} />
      </HashRouter>,
    );
    expect(screen.getByText(/2\/13 lines completed/)).toBeInTheDocument();
  });

  it('shows the trophy message when all lines complete', () => {
    render(
      <HashRouter>
        <Header unlocked={149} total={149} linesCompleted={13} totalLines={13} />
      </HashRouter>,
    );
    expect(screen.getByText(/All 13 lines completed!/)).toBeInTheDocument();
  });
});
