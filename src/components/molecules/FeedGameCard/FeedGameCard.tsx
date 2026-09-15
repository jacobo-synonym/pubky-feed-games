'use client';
import Image from 'next/image';
import { Play, RotateCcw, Shuffle, X } from 'lucide-react';
import { Button } from '@/atoms/Button/Button';
import { useFeedGamePlayer } from '@/hooks/useFeedGamePlayer/useFeedGamePlayer';
import { type FeedGame, GAME_REMIX_EVENT } from '@/libs/feed-games/game';

export function FeedGameCard({ game, postId }: { game: FeedGame; postId?: string }) {
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
            src="/games/runtime/1.0.0/player.html"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className="aspect-[18/11] w-full border-0"
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
              <p className="text-3xl font-bold">{score} fries</p>
              <p className="text-sm text-muted-foreground">Casual score · saved only for this play</p>
              <Button onClick={replay}>
                <RotateCcw />
                Play again
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Image
            src={`/games/${game.theme}.svg`}
            alt="A hungry pigeon chasing fries through the park"
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
            {`30 seconds · ${['Easy', 'Medium', 'Hard'][game.difficulty - 1]} · ${game.theme}`}
          </p>
        </div>
        <div className="flex gap-2">
          {channel && (
            <Button variant="ghost" size="sm" onClick={close}>
              <X />
              Close game
            </Button>
          )}
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
        </div>
      </div>
    </section>
  );
}
