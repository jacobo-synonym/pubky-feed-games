import { LinkifyIt } from 'linkify-it';
import { z } from 'zod';
import { APP_ROUTES, POST_ROUTES } from '@/app/routes';

export const GAME_REMIX_EVENT = 'pubky:remix-game';
export const GAME_PLAY_EVENT = 'pubky:play-game';
export const gameSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[^\r\n\u0000-\u001f]+$/),
  theme: z.enum(['park', 'sunset', 'midnight']),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  seed: z.number().int().min(1).max(2147483647),
  source: z
    .string()
    .regex(/^[ybndrfg8ejkmcpqxot1uwisza345h769]{52}:[A-Z0-9]{13}$/)
    .optional(),
});
export type FeedGame = z.infer<typeof gameSchema>;
export const SAMPLE_GAME: FeedGame = { title: 'Pigeon Lunch Run', theme: 'park', difficulty: 2, seed: 4242 };

/** Only declarative settings are accepted. A post can never supply executable code or a player URL. */
export function parseGameUrl(value: string, origin?: string): FeedGame | null {
  if (value.length > 1000) return null;
  try {
    const url = new URL(value);
    const allowed = url.origin === origin || url.origin === 'https://pubky-feed-games.vercel.app';
    if (
      !allowed ||
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash ||
      url.pathname !== APP_ROUTES.HOME
    )
      return null;
    const q = url.searchParams;
    if (q.get('game') !== 'pigeon' || q.get('v') !== '1') return null;
    const keys = ['game', 'v', 'title', 'theme', 'difficulty', 'seed', 'source'];
    for (const key of q.keys()) if (!keys.includes(key) || q.getAll(key).length !== 1) return null;
    const parsed = gameSchema.safeParse({
      title: q.get('title'),
      theme: q.get('theme'),
      difficulty: Number(q.get('difficulty')),
      seed: Number(q.get('seed')),
      ...(q.has('source') ? { source: q.get('source') } : {}),
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function gameUrl(game: FeedGame, origin: string): string {
  const url = new URL(APP_ROUTES.HOME, origin);
  url.searchParams.set('game', 'pigeon');
  url.searchParams.set('v', '1');
  for (const [key, value] of Object.entries(game)) if (value !== undefined) url.searchParams.set(key, String(value));
  return url.href;
}

export function gamePost(game: FeedGame, origin: string): string {
  return `${game.title}\nPlay this 30-second game right in the Feed Games vibe.\n${gameUrl(game, origin)}${game.source ? `\nRemixed from ${new URL(`${POST_ROUTES.POST}/${game.source.replace(':', '/')}`, origin).href}` : ''}`;
}

/** Find the game reference even when the caption contains another link first. */
export function findGameInContent(content: string, origin?: string): FeedGame | null {
  const links = new LinkifyIt().match(content) ?? [];
  for (const link of links) {
    const game = parseGameUrl(link.url, origin);
    if (game) return game;
  }
  return null;
}
