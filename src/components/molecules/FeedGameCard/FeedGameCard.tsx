'use client';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Play, RotateCcw, Swords, X } from 'lucide-react';
import { APP_ROUTES, POST_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { useFeedGamePlayer } from '@/hooks/useFeedGamePlayer/useFeedGamePlayer';
import {
  type FeedGame,
  GAME_CHALLENGE_EVENT,
  GAME_RESULT_EVENT,
  GAME_TAG,
  gameCover,
  gameLabel,
  gamePlayer,
  gameScore,
  STARTER_GAME_POSTS,
  suggestedGames,
} from '@/libs/feed-games/game';

export function FeedGameCard({
  game,
  postId,
  preview = false,
}: {
  game: FeedGame;
  postId?: string;
  preview?: boolean;
}) {
  const { frame: frameRef, channel, ready, failed, score, play, replay, close } = useFeedGamePlayer(game);
  const challengeSomeone = () => {
    close();
    window.dispatchEvent(
      new CustomEvent(GAME_CHALLENGE_EVENT, {
        detail: { game, postId, score: score ?? undefined, challenge: true },
      }),
    );
  };
  return (
    <section
      aria-label={`${game.title} game`}
      className="w-full overflow-hidden rounded-xl border border-border bg-secondary/30"
      onClick={(event) => event.stopPropagation()}
    >
      {channel ? (
        <div className="relative">
          <iframe
            key={channel}
            hidden={score !== null}
            ref={frameRef}
            title={`${game.title} player`}
            src={gamePlayer(game)}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className={
              game.kind === 'pigeon'
                ? 'aspect-[18/11] w-full border-0'
                : ['memory', 'reaction'].includes(game.kind)
                  ? 'aspect-square w-full border-0'
                  : 'aspect-[3/4] w-full border-0 sm:aspect-square'
            }
          />
          {!ready && (
            <div
              role="status"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background"
            >
              <p>{failed ? 'The game could not load.' : 'Loading game…'}</p>
              {failed && <Button onClick={play}>Try again</Button>}
            </div>
          )}
          {score !== null && (
            <div className="flex flex-col items-center gap-3 bg-background p-5" role="status">
              <p className="text-3xl font-bold">{gameScore(game, score)}</p>
              <p className="text-sm text-muted-foreground">Casual score · self-reported</p>
              <Button onClick={replay}>
                <RotateCcw />
                Play again
              </Button>
              {!preview && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    close();
                    window.dispatchEvent(new CustomEvent(GAME_RESULT_EVENT, { detail: { game, postId, score } }));
                  }}
                >
                  <MessageCircle />
                  {postId ? 'Reply with score' : 'Share challenge'}
                </Button>
              )}
              {!preview && (
                <Button variant="secondary" onClick={challengeSomeone}>
                  <Swords />
                  Challenge someone
                </Button>
              )}
              <div className="mt-2 w-full border-t border-border pt-3 text-center">
                <p className="mb-2 text-sm text-muted-foreground">Try something else</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedGames(game).map((suggestion) => (
                    <Button key={suggestion.kind} asChild variant="secondary" size="sm">
                      <Link href={`${POST_ROUTES.POST}/${STARTER_GAME_POSTS[suggestion.kind].replace(':', '/')}`}>
                        {suggestion.title}
                      </Link>
                    </Button>
                  ))}
                </div>
                <Link
                  href={`${APP_ROUTES.SEARCH}?tags=${GAME_TAG}`}
                  className="mt-3 inline-block text-xs text-muted-foreground underline"
                >
                  Explore #feed-games posts
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Image
            src={gameCover(game)}
            alt={`${game.title} illustration`}
            width={700}
            height={420}
            className="aspect-[18/11] w-full object-cover"
            unoptimized
          />
          <div className="absolute bottom-4 left-4">
            <Button variant="secondary" onClick={play}>
              <Play />
              Play in feed
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-bold break-words">{game.title}</h3>
          <p className="text-sm text-muted-foreground">
            {`${gameLabel(game)} · ${['Easy', 'Medium', 'Hard'][game.difficulty - 1]} · ${game.theme}`}
          </p>
          {game.source && (
            <Link
              className="text-xs text-muted-foreground underline"
              href={`${POST_ROUTES.POST}/${game.source.replace(':', '/')}`}
            >
              Original post
            </Link>
          )}
          <p className="text-xs text-muted-foreground">{`Course ${game.seed}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!preview && !channel && (
            <Button variant="ghost" size="sm" onClick={challengeSomeone}>
              <Swords />
              Challenge someone
            </Button>
          )}
          {channel && (
            <Button variant="ghost" size="sm" onClick={close}>
              <X />
              Close game
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
