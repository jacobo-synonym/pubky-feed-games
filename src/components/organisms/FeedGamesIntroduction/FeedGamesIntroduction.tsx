'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Gamepad2, Plus } from 'lucide-react';
import { APP_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { FEED_GAMES_ENABLED } from '@/config/feedGames';
import { ARCADE_GAMES, GAME_REMIX_EVENT, GAME_TAG, gameUrl, parseGameUrl } from '@/libs/feed-games/game';
import { PostLinkEmbeds } from '@/molecules/PostLinkEmbeds/PostLinkEmbeds';

export function FeedGamesIntroduction() {
  const params = useSearchParams();
  const [selected, setSelected] = useState(0);
  const origin = typeof window === 'undefined' ? 'https://pubky-feed-games.vercel.app' : window.location.origin;
  const shared = parseGameUrl(`${origin}${APP_ROUTES.HOME}?${params.toString()}`, origin);
  const gamesView = params.get('view') === 'games';
  if (!FEED_GAMES_ENABLED) return null;
  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-6"
      aria-label="Feed Games experiment"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            The feed is your arcade
          </p>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Gamepad2 />
            Feed Games
          </h2>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.dispatchEvent(new CustomEvent(GAME_REMIX_EVENT, { detail: ARCADE_GAMES[selected] }))}
        >
          <Plus />
          Make a game
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Play a post. Beat a score. Remix the challenge. An experiment on the Pubky staging network.
      </p>
      <nav className="flex gap-2" aria-label="Feed view">
        <Button asChild variant={gamesView ? 'ghost' : 'secondary'} size="sm">
          <Link href={APP_ROUTES.HOME} aria-current={!gamesView ? 'page' : undefined}>
            All posts
          </Link>
        </Button>
        <Button asChild variant={gamesView ? 'secondary' : 'ghost'} size="sm">
          <Link href={`${APP_ROUTES.HOME}?view=games&tags=${GAME_TAG}`} aria-current={gamesView ? 'page' : undefined}>
            Games
          </Link>
        </Button>
      </nav>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {shared
            ? 'Shared game preview · open its original post for replies and tags'
            : 'Try the arcade · these samples have not been published as posts'}
        </p>
        {!shared && (
          <div className="flex flex-wrap gap-2" aria-label="Sample games">
            {ARCADE_GAMES.map((game, index) => (
              <Button
                key={game.kind}
                size="sm"
                variant={selected === index ? 'default' : 'ghost'}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                {game.title}
              </Button>
            ))}
          </div>
        )}
        <PostLinkEmbeds content={gameUrl(shared ?? ARCADE_GAMES[selected], origin)} />
      </div>
      {gamesView && (
        <p className="text-xs text-muted-foreground">
          Below: public staging posts tagged “feed-games”. Anyone can add this tag; scores are self-reported.
        </p>
      )}
    </section>
  );
}
