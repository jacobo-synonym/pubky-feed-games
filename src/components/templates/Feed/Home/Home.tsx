'use client';
import { useSearchParams } from 'next/navigation';
import { TIMELINE_FEED_VARIANT } from '@/config/feed';
import { FEED_GAMES_ENABLED } from '@/config/feedGames';
import { useDefaultHomeReach } from '@/hooks/useDefaultHomeReach/useDefaultHomeReach';
import { TaggedAsHeadline } from '@/molecules/TaggedAsHeadline/TaggedAsHeadline';
import { AlertBackup } from '@/organisms/AlertBackup/AlertBackup';
import { DialogWelcome } from '@/organisms/DialogWelcome/DialogWelcome';
import { FeedGamesIntroduction } from '@/organisms/FeedGamesIntroduction/FeedGamesIntroduction';
import { FeedNavigation } from '@/organisms/FeedNavigation/FeedNavigation';
import { PostInput } from '@/organisms/PostInput/PostInput';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';
import { TimelineFeed } from '@/organisms/Timeline/Feed/TimelineFeed/TimelineFeed';

/**
 * Forward-navigation top-scroll (the `FORCE_FEED_SCROLL_TOP_KEY` flag) is set by
 * feed nav entry points and consumed centrally in `(feeds)/layout.tsx`, which
 * is the single owner of feed scroll positioning across the persistent layout.
 */
export function Home() {
  useDefaultHomeReach();
  const params = useSearchParams();
  const gamesView =
    FEED_GAMES_ENABLED && params.get('view') === 'games' && params.get('tags') === 'feed-games' && !params.get('q');

  return (
    <>
      <DialogWelcome />
      {/* First child so the mobile tab bar sits directly under the compact header (Hot pattern). */}
      <FeedNavigation />
      <AlertBackup />
      <FeedGamesIntroduction />
      <TimelineFeed
        key={gamesView ? 'games' : 'home'}
        variant={gamesView ? TIMELINE_FEED_VARIANT.SEARCH : TIMELINE_FEED_VARIANT.HOME}
        persistentHeader={<TaggedAsHeadline />}
      >
        <PostInput dataCy="home-post-input" variant={POST_INPUT_VARIANT.POST} />
      </TimelineFeed>
    </>
  );
}
