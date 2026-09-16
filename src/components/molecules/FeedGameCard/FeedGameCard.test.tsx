import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARCADE_GAMES, GAME_PLAY_EVENT, SAMPLE_GAME } from '@/libs/feed-games/game';
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
  it('links to the open chooser from a game post', () => {
    render(<FeedGameCard game={SAMPLE_GAME} />);
    expect(screen.getByRole('link', { name: 'Try a game' })).toHaveAttribute('href', '/home?play=1');
  });
  it('offers other games after a valid result without loading them automatically', () => {
    const channel = '12345678-1234-1234-1234-123456789012';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(channel);
    render(<FeedGameCard game={ARCADE_GAMES[4]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play in feed' }));
    const frame = screen.getByTitle<HTMLIFrameElement>('Falling Blocks player');
    for (const data of [
      { v: 1, channel, type: 'ready' },
      { v: 1, channel, type: 'result', result: { score: 1200 } },
    ]) {
      act(() =>
        window.dispatchEvent(new MessageEvent('message', { origin: 'null', source: frame.contentWindow, data })),
      );
    }
    expect(screen.getByText('1200 points')).toBeInTheDocument();
    expect(frame).not.toBeVisible();
    expect(screen.getByRole('link', { name: 'Brick Breaker' })).toHaveAttribute(
      'href',
      expect.stringContaining('game=breaker'),
    );
    expect(screen.getByRole('link', { name: 'Explore #feed-games posts' })).toHaveAttribute(
      'href',
      '/search?tags=feed-games',
    );
    expect(screen.queryByTitle('Brick Breaker player')).toBeNull();
    vi.restoreAllMocks();
  });
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
