import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARCADE_GAMES, gameUrl } from '@/libs/feed-games/game';
import { Home } from './Home';

const search = vi.hoisted(() => ({ value: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(search.value),
}));

// Mock Organisms
vi.mock('@/organisms/AlertBackup/AlertBackup', () => {
  return {
    AlertBackup: () => <div data-testid="alert-backup">AlertBackup</div>,
  };
});

vi.mock('@/organisms/DialogWelcome/DialogWelcome', () => {
  return {
    DialogWelcome: () => <div data-testid="dialog-welcome">DialogWelcome</div>,
  };
});

vi.mock('@/organisms/FeedNavigation/FeedNavigation', () => {
  return {
    FeedNavigation: ({ className }: { className?: string }) => (
      <div data-testid="feed-navigation" data-classname={className}>
        FeedNavigation
      </div>
    ),
  };
});

vi.mock('@/organisms/PostInput/PostInput', () => {
  return {
    PostInput: ({ dataCy, variant }: { dataCy?: string; variant?: string }) => (
      <div data-testid="post-input" data-cy={dataCy} data-variant={variant}>
        PostInput
      </div>
    ),
  };
});

const mockUseDefaultHomeReach = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDefaultHomeReach/useDefaultHomeReach', () => ({
  useDefaultHomeReach: mockUseDefaultHomeReach,
}));

vi.mock('@/molecules/TaggedAsHeadline/TaggedAsHeadline', () => ({
  TaggedAsHeadline: () => <div data-testid="tagged-as-headline">TaggedAsHeadline</div>,
}));

vi.mock('@/organisms/Timeline/Feed/TimelineFeed/TimelineFeed', () => {
  return {
    TimelineFeed: ({
      children,
      persistentHeader,
      variant,
    }: {
      children: React.ReactNode;
      persistentHeader?: React.ReactNode;
      variant: string;
    }) => (
      <div data-testid="timeline-feed" data-variant={variant}>
        {children}
        {persistentHeader}
      </div>
    ),
  };
});

// Mock constants
vi.mock('@/organisms/PostInput/PostInput.constants', () => ({
  POST_INPUT_VARIANT: {
    POST: 'post',
  },
}));

vi.mock('@/config/feed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/feed')>();
  return {
    ...actual,
    TIMELINE_FEED_VARIANT: {
      ...actual.TIMELINE_FEED_VARIANT,
      HOME: 'home',
    },
  };
});

beforeEach(() => {
  search.value = '';
});

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = '';
    window.sessionStorage.clear();
  });

  it('renders DialogWelcome', () => {
    render(<Home />);
    expect(screen.getByTestId('dialog-welcome')).toBeInTheDocument();
  });

  it('renders AlertBackup', () => {
    render(<Home />);
    expect(screen.getByTestId('alert-backup')).toBeInTheDocument();
  });

  it('renders FeedNavigation in main content', () => {
    render(<Home />);
    expect(screen.getByTestId('feed-navigation')).toBeInTheDocument();
  });

  it('renders TimelineFeed with HOME variant', () => {
    render(<Home />);
    const timelineFeed = screen.getByTestId('timeline-feed');
    expect(timelineFeed).toBeInTheDocument();
    expect(timelineFeed).toHaveAttribute('data-variant', 'home');
  });

  it('starts the asynchronous fresh-user reach resolution', () => {
    render(<Home />);

    expect(mockUseDefaultHomeReach).toHaveBeenCalledTimes(1);
  });

  it('renders PostInput inside TimelineFeed', () => {
    render(<Home />);
    const postInput = screen.getByTestId('post-input');
    expect(postInput).toBeInTheDocument();
    expect(screen.getByTestId('timeline-feed')).toContainElement(postInput);
  });

  it('renders PostInput with correct props', () => {
    render(<Home />);
    const postInput = screen.getByTestId('post-input');
    expect(postInput).toHaveAttribute('data-cy', 'home-post-input');
    expect(postInput).toHaveAttribute('data-variant', 'post');
  });

  it('passes the Tagged-as headline through the persistent header slot', () => {
    render(<Home />);

    expect(screen.getByTestId('timeline-feed')).toContainElement(screen.getByTestId('tagged-as-headline'));
  });

  it('does not render a ContentLayout shell (hoisted into (feeds)/layout.tsx)', () => {
    render(<Home />);
    expect(screen.queryByTestId('content-layout')).not.toBeInTheDocument();
  });
});

describe('Home - Snapshots', () => {
  it('uses the native tagged search only for the optional Games view', () => {
    search.value = 'view=games&tags=feed-games';
    render(<Home />);
    expect(screen.getByTestId('timeline-feed')).toHaveAttribute('data-variant', 'search');
  });

  it.each(['', 'play=1'])('keeps the home feed free of game promotion (%s)', (query) => {
    search.value = query;
    render(<Home />);
    expect(screen.queryByRole('button', { name: 'Try a game' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play in feed' })).toBeNull();
    expect(screen.queryByLabelText('Sample games')).toBeNull();
  });

  it('still opens a directly shared game without an extra discovery step', () => {
    search.value = new URL(gameUrl(ARCADE_GAMES[1], window.location.origin)).search;
    render(<Home />);
    expect(screen.getByRole('heading', { name: 'Pocket Pairs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play in feed' })).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<Home />);
    expect(container).toMatchSnapshot();
  });
});
