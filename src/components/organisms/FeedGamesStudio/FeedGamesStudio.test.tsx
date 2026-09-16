import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ARCADE_GAMES, GAME_CHALLENGE_EVENT, GAME_CREATE_EVENT, GAME_RESULT_EVENT } from '@/libs/feed-games/game';
import type { PostInput } from '@/organisms/PostInput/PostInput';
import { FeedGamesStudio } from './FeedGamesStudio';

const auth = vi.hoisted(() => ({ isAuthenticated: true, requireAuth: vi.fn() }));
vi.mock('@/hooks/useRequireAuth/useRequireAuth', () => ({ useRequireAuth: () => auth }));
vi.mock('@/molecules/FeedGameCard/FeedGameCard', () => ({ FeedGameCard: () => <div>Playable preview</div> }));
vi.mock('@/organisms/PostInput/PostInput', () => ({
  PostInput: (props: ComponentProps<typeof PostInput>) => (
    <div
      data-testid="native-composer"
      data-variant={props.variant}
      data-parent={props.postId}
      data-tags={props.initialTags?.join(',')}
    >
      {props.initialContent}
    </div>
  ),
}));
afterEach(() => {
  cleanup();
  auth.isAuthenticated = true;
});
const postId = `${'y'.repeat(52)}:0035JQHRS0000`;

describe('Feed Games native publishing', () => {
  it.each([undefined, 0, 1200])('prepares a mention challenge reply with optional score %s', (score) => {
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_CHALLENGE_EVENT, {
          detail: { game: ARCADE_GAMES[4], postId, score, challenge: true },
        }),
      ),
    );
    expect(screen.getByRole('heading', { name: 'Challenge someone' })).toBeInTheDocument();
    const composer = screen.getByTestId('native-composer');
    expect(composer).toHaveAttribute('data-variant', 'reply');
    expect(composer).toHaveAttribute('data-parent', postId);
    expect(composer).toHaveTextContent('Your turn, @');
    expect(composer).toHaveTextContent('seed=87');
    if (score === undefined) expect(composer).not.toHaveTextContent('I scored');
    else expect(composer).toHaveTextContent(`${score} points`);
  });
  it('uses a root post for a shared challenge without an authored parent', () => {
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_CHALLENGE_EVENT, {
          detail: { game: ARCADE_GAMES[4], challenge: true },
        }),
      ),
    );
    expect(screen.getByTestId('native-composer')).toHaveAttribute('data-variant', 'post');
    expect(screen.getByText(/Your challenge is a public game post/)).toBeInTheDocument();
  });
  it('requires native sign-in before composing a mention challenge', () => {
    auth.isAuthenticated = false;
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_CHALLENGE_EVENT, {
          detail: { game: ARCADE_GAMES[4], postId, challenge: true },
        }),
      ),
    );
    expect(screen.queryByTestId('native-composer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to challenge someone' }));
    expect(auth.requireAuth).toHaveBeenCalled();
  });
  it('ignores malformed challenge event payloads', () => {
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_CHALLENGE_EVENT, {
          detail: { game: ARCADE_GAMES[4], postId: 'invalid', challenge: true },
        }),
      ),
    );
    expect(screen.queryByTestId('native-composer')).toBeNull();
  });
  it('prepares a result as a reply to the actual post, preserving the course', () => {
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_RESULT_EVENT, { detail: { game: ARCADE_GAMES[2], postId, score: 4500 } }),
      ),
    );
    const composer = screen.getByTestId('native-composer');
    expect(composer).toHaveAttribute('data-variant', 'reply');
    expect(composer).toHaveAttribute('data-parent', postId);
    expect(composer).toHaveTextContent('4500 points');
    expect(composer).toHaveTextContent('self-reported');
    expect(composer).toHaveTextContent('seed=2026');
  });
  it('uses a new post for sample challenges rather than a fictitious reply', () => {
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(new CustomEvent(GAME_RESULT_EVENT, { detail: { game: ARCADE_GAMES[1], score: 600 } })),
    );
    expect(screen.getByTestId('native-composer')).toHaveAttribute('data-variant', 'post');
    expect(screen.getByTestId('native-composer')).toHaveAttribute('data-tags', 'feed-games');
  });
  it('previews a configured game before inserting it', async () => {
    const insert = vi.fn();
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_CREATE_EVENT, {
          detail: { game: ARCADE_GAMES[0], onInsert: insert },
        }),
      ),
    );
    fireEvent.change(screen.getByLabelText('Course number'), { target: { value: '817' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview game post' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add game to post' })).toBeInTheDocument());
    expect(insert).not.toHaveBeenCalled();
    expect(screen.queryByTestId('native-composer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add game to post' }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ seed: 817, version: 2 }));
  });
  it('searches the game picker and selects a game without a thumbnail grid', async () => {
    render(<FeedGamesStudio />);
    act(() => window.dispatchEvent(new CustomEvent(GAME_CREATE_EVENT, { detail: ARCADE_GAMES[0] })));
    expect(screen.queryByLabelText('Game templates')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Choose game' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search games' }), { target: { value: 'blocks' } });
    expect(screen.queryByRole('button', { name: /Pocket Pairs/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Falling Blocks/ }));
    expect(screen.getByRole('textbox', { name: 'Game title' })).toHaveValue('Falling Blocks');
    expect(screen.queryByRole('textbox', { name: 'Search games' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Preview game post' }));
    await waitFor(() => expect(screen.getByTestId('native-composer')).toHaveTextContent('game=blocks'));
  });
  it('keeps publishing behind the native sign-in gate', () => {
    auth.isAuthenticated = false;
    render(<FeedGamesStudio />);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(GAME_RESULT_EVENT, { detail: { game: ARCADE_GAMES[1], postId, score: 600 } }),
      ),
    );
    expect(screen.queryByTestId('native-composer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to share your score' }));
    expect(auth.requireAuth).toHaveBeenCalled();
  });
});
