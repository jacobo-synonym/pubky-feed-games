'use client';
import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Gamepad2, Plus } from 'lucide-react';
import { APP_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { FEED_GAMES_ENABLED } from '@/config/feedGames';
import { ARCADE_GAMES, GAME_CREATE_EVENT, GAME_TAG, gameUrl, parseGameUrl } from '@/libs/feed-games/game';
import { PostLinkEmbeds } from '@/molecules/PostLinkEmbeds/PostLinkEmbeds';

export function FeedGamesIntroduction() {
  const params = useSearchParams();
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(params.get('play') === '1');
  const samplesId = useId();
  const openSamples = params.get('play') === '1';
  useEffect(() => {
    if (openSamples) setExpanded(true);
  }, [openSamples]);
  const origin = typeof window === 'undefined' ? 'https://pubky-feed-games.vercel.app' : window.location.origin;
  const shared = parseGameUrl(`${origin}${APP_ROUTES.HOME}?${params.toString()}`, origin);
  const gamesView = params.get('view') === 'games';
  if (!FEED_GAMES_ENABLED) return null;
  return (
    <section className="flex flex-col gap-3" aria-label="Game discovery">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {shared ? (
          <p className="text-sm text-muted-foreground">Shared game preview</p>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            aria-expanded={expanded}
            aria-controls={samplesId}
            onClick={() => setExpanded(!expanded)}
          >
            <Gamepad2 />
            Try a game{expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        )}
        <Link
          href={`${APP_ROUTES.SEARCH}?tags=${GAME_TAG}`}
          className="px-3 py-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          #{GAME_TAG}
        </Link>
      </div>
      {(expanded || shared) && (
        <div id={samplesId} className="flex flex-col gap-3 pb-3">
          <p className="text-xs text-muted-foreground">
            {shared
              ? 'Play this challenge here, or use “Try a game” to browse the collection.'
              : 'Play a sample, then share a challenge for others to play. Samples are not published posts.'}
          </p>
          {!shared && (
            <div className="flex flex-wrap gap-2" aria-label="Sample games">
              {ARCADE_GAMES.map((game, index) => (
                <Button
                  key={game.kind}
                  size="sm"
                  variant={selected === index ? 'secondary' : 'ghost'}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  {game.title}
                </Button>
              ))}
            </div>
          )}
          <PostLinkEmbeds content={gameUrl(shared ?? ARCADE_GAMES[selected], origin)} />
          {!shared && (
            <Button
              size="sm"
              variant="ghost"
              className="self-start"
              onClick={() =>
                window.dispatchEvent(new CustomEvent(GAME_CREATE_EVENT, { detail: ARCADE_GAMES[selected] }))
              }
            >
              <Plus />
              Create game post
            </Button>
          )}
        </div>
      )}
      {gamesView && (
        <p className="text-xs text-muted-foreground">
          Posts tagged “feed-games”.{' '}
          <Link href={APP_ROUTES.HOME} className="underline">
            Back to all posts
          </Link>
        </p>
      )}
    </section>
  );
}
