'use client';
import { useSearchParams } from 'next/navigation';
import { APP_ROUTES } from '@/app/routes';
import { FEED_GAMES_ENABLED } from '@/config/feedGames';
import { gameUrl, parseGameUrl } from '@/libs/feed-games/game';
import { PostLinkEmbeds } from '@/molecules/PostLinkEmbeds/PostLinkEmbeds';

// Preserve shared challenge URLs without adding a game catalog above the feed.
export function FeedGamesIntroduction() {
  const params = useSearchParams();
  const origin = typeof window === 'undefined' ? 'https://pubky-feed-games.vercel.app' : window.location.origin;
  const shared = parseGameUrl(`${origin}${APP_ROUTES.HOME}?${params.toString()}`, origin);
  if (!FEED_GAMES_ENABLED || !shared) return null;
  return (
    <section className="flex flex-col gap-3" aria-label="Shared game preview">
      <PostLinkEmbeds content={gameUrl(shared, origin)} />
    </section>
  );
}
