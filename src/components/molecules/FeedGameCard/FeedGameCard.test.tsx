import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_PLAY_EVENT, SAMPLE_GAME } from '@/libs/feed-games/game';
import { FeedGameCard } from './FeedGameCard';

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('FeedGameCard', () => {
  it('loads no executable frame until Play, and closes it inline', () => {
    render(<FeedGameCard game={SAMPLE_GAME} />);
    expect(screen.queryByTitle('Pigeon Lunch Run player')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play in feed' }));
    const frame = screen.getByTitle('Pigeon Lunch Run player');
    expect(frame).toHaveAttribute('src', '/games/runtime/1.0.0/player.html');
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
    fireEvent.click(screen.getByRole('button', { name: 'Close game' }));
    expect(screen.queryByTitle('Pigeon Lunch Run player')).toBeNull();
  });
  it('rejects spoofed messages and releases the frame when another game starts', () => {
    render(<FeedGameCard game={SAMPLE_GAME} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play in feed' }));
    act(() =>
      window.dispatchEvent(
        new MessageEvent('message', { origin: 'null', source: window, data: { v: 1, type: 'ready' } }),
      ),
    );
    expect(screen.getByText('Loading game…')).toBeInTheDocument();
    act(() => window.dispatchEvent(new CustomEvent(GAME_PLAY_EVENT, { detail: 'another-player' })));
    expect(screen.queryByTitle('Pigeon Lunch Run player')).toBeNull();
  });
});
