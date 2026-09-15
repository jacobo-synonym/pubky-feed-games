'use client';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Play, RotateCcw, Shuffle, X } from 'lucide-react';
import { POST_ROUTES } from '@/app/routes';
import { Button } from '@/atoms/Button/Button';
import { useFeedGamePlayer } from '@/hooks/useFeedGamePlayer/useFeedGamePlayer';
import {
  type FeedGame,
  GAME_REMIX_EVENT,
  GAME_RESULT_EVENT,
  gameCover,
  gamePlayer,
  gameScore,
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
            ref={frameRef}
            title={`${game.title} player`}
            src={gamePlayer(game)}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className={
              game.kind === 'pigeon'
                ? 'aspect-[18/11] w-full border-0'
                : 'aspect-square w-full border-0 sm:aspect-[18/11]'
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
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95"
              role="status"
            >
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
            <Button variant="dark" size="lg" onClick={play}>
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
            {`${game.kind === 'pigeon' ? '30 seconds' : game.kind === 'memory' ? 'Match the pairs' : 'Quick reactions'} · ${['Easy', 'Medium', 'Hard'][game.difficulty - 1]} · ${game.theme}`}
          </p>
          {game.source && (
            <Link
              className="text-xs text-muted-foreground underline"
              href={`${POST_ROUTES.POST}/${game.source.replace(':', '/')}`}
            >
              Remixed from an original post
            </Link>
          )}
          <p className="text-xs text-muted-foreground">{`Course ${game.seed}`}</p>
        </div>
        <div className="flex gap-2">
          {channel && (
            <Button variant="ghost" size="sm" onClick={close}>
              <X />
              Close game
            </Button>
          )}
          {!preview && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                close();
                window.dispatchEvent(
                  new CustomEvent(GAME_REMIX_EVENT, { detail: { ...game, source: postId ?? game.source } }),
                );
              }}
            >
              <Shuffle />
              Remix
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
