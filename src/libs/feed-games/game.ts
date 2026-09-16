import { LinkifyIt } from 'linkify-it';
import { z } from 'zod';
import { APP_ROUTES, POST_ROUTES } from '@/app/routes';

export const GAME_KINDS = ['pigeon', 'memory', 'reaction', 'maze', 'blocks', 'breaker', 'snake'] as const;
export const GAME_CREATE_EVENT = 'pubky:create-game';
export const GAME_RESULT_EVENT = 'pubky:game-result';
export const GAME_TAG = 'feed-games';
export const GAME_PLAY_EVENT = 'pubky:play-game';
export const postReferenceSchema = z.string().regex(/^[ybndrfg8ejkmcpqxot1uwisza345h769]{52}:[A-Z0-9]{13}$/);
export const gameSchema = z
  .object({
    kind: z.enum(GAME_KINDS).default('pigeon'),
    version: z.union([z.literal(1), z.literal(2)]).default(1),
    pattern: z.enum(['balanced', 'hurdles', 'snacks']).default('balanced'),
    title: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .regex(/^[^\r\n\u0000-\u001f]+$/),
    theme: z.enum(['park', 'sunset', 'midnight']),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    seed: z.number().int().min(1).max(2147483647),
    source: postReferenceSchema.optional(),
  })
  .refine((game) => game.version === 2 || (game.kind === 'pigeon' && game.pattern === 'balanced'), {
    message: 'Unsupported game rules.',
  });
export type FeedGame = z.infer<typeof gameSchema>;
export const SAMPLE_GAME: FeedGame = {
  kind: 'pigeon',
  version: 1,
  pattern: 'balanced',
  title: 'Pigeon Lunch Run',
  theme: 'park',
  difficulty: 2,
  seed: 4242,
};
export const ARCADE_GAMES: FeedGame[] = [
  { ...SAMPLE_GAME, version: 2 },
  { ...SAMPLE_GAME, version: 2, kind: 'memory', title: 'Pocket Pairs', theme: 'sunset', seed: 719 },
  { ...SAMPLE_GAME, version: 2, kind: 'reaction', title: 'Signal Sprint', theme: 'midnight', seed: 2026 },
  { ...SAMPLE_GAME, version: 2, kind: 'maze', title: 'Maze Munch', theme: 'midnight', seed: 42 },
  { ...SAMPLE_GAME, version: 2, kind: 'blocks', title: 'Falling Blocks', theme: 'park', seed: 87 },
  { ...SAMPLE_GAME, version: 2, kind: 'breaker', title: 'Brick Breaker', theme: 'sunset', seed: 53 },
  { ...SAMPLE_GAME, version: 2, kind: 'snake', title: 'Snake', theme: 'park', seed: 61 },
];

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
    if (!['1', '2'].includes(q.get('v') ?? '') || !GAME_KINDS.some((kind) => kind === q.get('game'))) return null;
    if (q.get('v') === '1' && (q.get('game') !== 'pigeon' || q.has('pattern'))) return null;
    const keys = ['game', 'v', 'title', 'theme', 'difficulty', 'seed', 'source', 'pattern'];
    for (const key of q.keys()) if (!keys.includes(key) || q.getAll(key).length !== 1) return null;
    const parsed = gameSchema.safeParse({
      kind: q.get('game'),
      version: Number(q.get('v')),
      pattern: q.get('pattern') ?? 'balanced',
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
  url.searchParams.set('game', game.kind);
  url.searchParams.set('v', String(game.version));
  for (const key of ['title', 'theme', 'difficulty', 'seed', 'source'] as const) {
    const value = game[key];
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  if (game.version === 2) url.searchParams.set('pattern', game.pattern);
  return url.href;
}

export function gamePost(game: FeedGame, origin: string): string {
  return `${game.title}\nYour turn. Play this challenge inside the Feed Games vibe.\n${gameUrl(game, origin)}${game.source ? `\nRemixed from ${new URL(`${POST_ROUTES.POST}/${game.source.replace(':', '/')}`, origin).href}` : ''}`;
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

export function gameCover(game: FeedGame): string {
  if (['maze', 'blocks', 'breaker', 'snake'].includes(game.kind)) return `/games/${game.kind}.svg`;
  return `/games/${game.kind === 'pigeon' ? '' : `${game.kind}-`}${game.theme}.svg`;
}
export function gamePlayer(game: FeedGame): string {
  const player = game.kind === 'pigeon' ? 'player' : ['memory', 'reaction'].includes(game.kind) ? 'arcade' : 'classics';
  return `/games/runtime/${game.version === 1 ? '1.0.0' : '3.0.0'}/${player}.html`;
}
export function gameScore(game: FeedGame, score: number): string {
  return game.kind === 'pigeon' ? `${score} fries` : `${score} points`;
}
export function gameDescription(game: FeedGame): string {
  const descriptions: Record<FeedGame['kind'], string> = {
    pigeon: 'Hop cones. Collect fries. Own the park.',
    memory: 'Find every pair. Keep your moves sharp.',
    reaction: 'Wait for the signal. Make every tap count.',
    maze: 'Collect the dots. Dodge the chasers. Power up and turn the tables.',
    blocks: 'Rotate, drop, and clear full rows before the stack reaches the top.',
    breaker: 'Keep the ball in play. Clear the bricks with your paddle.',
    snake: 'Grab a snack. Grow your snake. Leave yourself a way out.',
  };
  return descriptions[game.kind];
}
export const resultRequestSchema = z.object({
  game: gameSchema,
  postId: postReferenceSchema.optional(),
  score: z.number().int().min(0).max(100000),
});
export type GameResultRequest = z.infer<typeof resultRequestSchema>;
export function resultPost({ game, score }: GameResultRequest, origin: string): string {
  return `I scored ${gameScore(game, score)} on ${game.title}. Can you beat it?\nCasual result · self-reported\n${gameUrl(game, origin)}`;
}

export type GameEditorRequest = { game: FeedGame; onInsert?: (game: FeedGame) => void };

export function gameLabel(game: FeedGame): string {
  return {
    pigeon: '30 seconds',
    memory: 'Match the pairs',
    reaction: 'Quick reactions',
    maze: 'Maze chase',
    blocks: 'Clear the rows',
    breaker: 'Break the bricks',
    snake: 'Eat and grow',
  }[game.kind];
}
export function suggestedGames(game: FeedGame): FeedGame[] {
  const index = ARCADE_GAMES.findIndex((item) => item.kind === game.kind);
  return Array.from({ length: 3 }, (_, offset) => ARCADE_GAMES[(index + 1 + offset) % ARCADE_GAMES.length]);
}
