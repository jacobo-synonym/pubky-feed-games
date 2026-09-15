'use client';
import { useSearchParams } from 'next/navigation';
import { Gamepad2, Plus } from 'lucide-react';
import { Button } from '@/atoms/Button/Button';
import { GAME_REMIX_EVENT, gameUrl, parseGameUrl, SAMPLE_GAME } from '@/libs/feed-games/game';
import { PostLinkEmbeds } from '@/molecules/PostLinkEmbeds/PostLinkEmbeds';

export function FeedGamesIntroduction() {
  const params = useSearchParams();
  const origin = typeof window === 'undefined' ? 'https://pubky-feed-games.vercel.app' : window.location.origin;
  const shared = parseGameUrl(`${origin}/home?${params.toString()}`, origin);
  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-6"
      aria-label="Feed Games experiment"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Gamepad2 />
          Feed Games
        </h2>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.dispatchEvent(new CustomEvent(GAME_REMIX_EVENT, { detail: SAMPLE_GAME }))}
        >
          <Plus />
          Make a game
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Games you can play and remix inside Pubky posts. This experiment uses the Pubky staging network.
      </p>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {shared
            ? 'Shared game preview · open its original post for replies and tags'
            : 'Try a sample · this example has not been published as a post'}
        </p>
        <PostLinkEmbeds content={gameUrl(shared ?? SAMPLE_GAME, origin)} />
      </div>
    </section>
  );
}
