'use client';
import { useEffect, useRef, useState } from 'react';
import { type FeedGame, GAME_PLAY_EVENT } from '@/libs/feed-games/game';

export function useFeedGamePlayer(game: FeedGame) {
  const { seed, difficulty, theme } = game;
  const frame = useRef<HTMLIFrameElement>(null);
  const [channel, setChannel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    if (!channel) return;
    const send = (type: string) => frame.current?.contentWindow?.postMessage({ v: 1, channel, type }, '*');
    const timeout = window.setTimeout(() => setFailed(true), 10000);
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' || event.data?.v !== 1) return;
      const message = event.data;
      if (message.type === 'boot') {
        frame.current?.contentWindow?.postMessage(
          {
            v: 1,
            type: 'init',
            channel,
            config: { seed, difficulty, theme },
            reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            sound: false,
          },
          '*',
        );
        return;
      }
      if (message.channel !== channel) return;
      if (message.type === 'ready') {
        window.clearTimeout(timeout);
        setReady(true);
        setFailed(false);
      }
      if (message.type === 'start') setScore(null);
      if (message.type === 'exit') setChannel(null);
      if (
        message.type === 'result' &&
        Number.isInteger(message.result?.score) &&
        message.result.score >= 0 &&
        message.result.score <= 1000
      )
        setScore(message.result.score);
    };
    const pause = () => {
      if (document.hidden) send('pause');
    };
    const otherGame = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== channel) setChannel(null);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) send('pause');
    });
    if (frame.current) observer.observe(frame.current);
    window.addEventListener('message', receive);
    window.addEventListener(GAME_PLAY_EVENT, otherGame);
    document.addEventListener('visibilitychange', pause);
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener('message', receive);
      window.removeEventListener(GAME_PLAY_EVENT, otherGame);
      document.removeEventListener('visibilitychange', pause);
    };
  }, [channel, seed, difficulty, theme]);
  const play = () => {
    const id = crypto.randomUUID();
    window.dispatchEvent(new CustomEvent(GAME_PLAY_EVENT, { detail: id }));
    setReady(false);
    setFailed(false);
    setScore(null);
    setChannel(id);
  };
  const replay = () => {
    setScore(null);
    frame.current?.contentWindow?.postMessage({ v: 1, channel, type: 'restart' }, '*');
    frame.current?.focus();
  };
  return { frame, channel, ready, failed, score, play, replay, close: () => setChannel(null) };
}
