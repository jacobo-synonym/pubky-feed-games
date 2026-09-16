import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARCADE_GAMES, GAME_CHALLENGE_EVENT, GAME_PLAY_EVENT, SAMPLE_GAME } from '@/libs/feed-games/game';
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
  it('opens a challenge draft with the post and exact course before playing', () => {
    const receive = vi.fn();
    window.addEventListener(GAME_CHALLENGE_EVENT, receive);
    const postId = `${'y'.repeat(52)}:0035JQHRS0000`;
    render(<FeedGameCard game={ARCADE_GAMES[6]} postId={postId} />);
    fireEvent.click(screen.getByRole('button', { name: 'Challenge someone' }));
    expect(receive.mock.calls[0][0].detail).toEqual({
      game: ARCADE_GAMES[6],
      postId,
      challenge: true,
      score: undefined,
    });
    expect(screen.queryByTitle('Snake player')).toBeNull();
    window.removeEventListener(GAME_CHALLENGE_EVENT, receive);
  });
  it('keeps challenge actions out of an unpublished creator preview', () => {
    render(<FeedGameCard game={SAMPLE_GAME} preview />);
    expect(screen.queryByRole('button', { name: 'Challenge someone' })).toBeNull();
  });
  it('keeps game promotion out of post cards', () => {
    render(<FeedGameCard game={SAMPLE_GAME} />);
    expect(screen.queryByRole('link', { name: 'Try a game' })).toBeNull();
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
      '/post/xxczmnpzqqz5o3ywmdefcc6f7f3pkg6g4x3hhpgd3wgy11fk5wgo/0035Q8CV050RG',
    );
    expect(screen.getByRole('link', { name: 'Explore #feed-games posts' })).toHaveAttribute(
      'href',
      '/search?tags=feed-games',
    );
    expect(screen.queryByTitle('Brick Breaker player')).toBeNull();
    const receive = vi.fn();
    window.addEventListener(GAME_CHALLENGE_EVENT, receive);
    fireEvent.click(screen.getByRole('button', { name: 'Challenge someone' }));
    expect(receive.mock.calls[0][0].detail).toEqual(
      expect.objectContaining({ game: ARCADE_GAMES[4], score: 1200, challenge: true }),
    );
    expect(screen.queryByTitle('Falling Blocks player')).toBeNull();
    window.removeEventListener(GAME_CHALLENGE_EVENT, receive);
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
