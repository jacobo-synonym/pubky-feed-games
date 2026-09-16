import { describe, expect, it } from 'vitest';
import {
  ARCADE_GAMES,
  findGameInContent,
  gamePlayer,
  gamePost,
  gameSchema,
  gameUrl,
  parseGameUrl,
  resultPost,
  SAMPLE_GAME,
  suggestedGames,
} from './game';

const origin = 'https://pubky-feed-games.vercel.app';
describe('Feed Games references', () => {
  it('finds games after another caption link', () => {
    expect(findGameInContent(`See https://example.org first. ${gameUrl(SAMPLE_GAME, origin)}`)).toEqual(SAMPLE_GAME);
  });
  it('round-trips a frozen course and attribution', () => {
    const game = { ...SAMPLE_GAME, title: 'Fries & friends', source: `${'y'.repeat(52)}:0035JQHRS0000` };
    expect(parseGameUrl(gameUrl(game, origin))).toEqual(game);
    expect(gamePost(game, origin)).toContain(`/post/${'y'.repeat(52)}/0035JQHRS0000`);
  });
  it.each([
    ['foreign host', gameUrl(SAMPLE_GAME, 'https://evil.example')],
    ['lookalike host', gameUrl(SAMPLE_GAME, `${origin}.evil.example`)],
    ['duplicate settings', `${gameUrl(SAMPLE_GAME, origin)}&seed=3`],
    ['code', `${gameUrl(SAMPLE_GAME, origin)}&script=alert(1)`],
    ['external runtime', `${gameUrl(SAMPLE_GAME, origin)}&runtime=https://evil.example/game.js`],
    ['version', gameUrl(SAMPLE_GAME, origin).replace('v=1', 'v=99')],
    ['seed', gameUrl(SAMPLE_GAME, origin).replace('seed=4242', 'seed=-1')],
    ['difficulty', gameUrl(SAMPLE_GAME, origin).replace('difficulty=2', 'difficulty=4')],
    ['title', gameUrl(SAMPLE_GAME, origin).replace('Pigeon+Lunch+Run', '%0A')],
    ['attribution', `${gameUrl(SAMPLE_GAME, origin)}&source=not-a-post`],
    ['fragment', `${gameUrl(SAMPLE_GAME, origin)}#script`],
  ])('rejects invalid %s', (_name, value) => {
    expect(parseGameUrl(value)).toBeNull();
  });
  it('supports the current local preview without trusting unrelated localhost ports', () => {
    const local = 'http://127.0.0.1:4325';
    expect(parseGameUrl(gameUrl(SAMPLE_GAME, local), local)).toEqual(SAMPLE_GAME);
    expect(parseGameUrl(gameUrl(SAMPLE_GAME, local), 'http://127.0.0.1:4324')).toBeNull();
  });
});

describe('Arcade v2', () => {
  it.each(ARCADE_GAMES)('suggests three different games after $kind', (game) => {
    const suggestions = suggestedGames(game);
    expect(suggestions).toHaveLength(3);
    expect(new Set(suggestions.map((item) => item.kind)).size).toBe(3);
    expect(suggestions.every((item) => item.kind !== game.kind)).toBe(true);
  });
  it.each(ARCADE_GAMES)('round-trips $kind without external runtimes', (game) => {
    expect(parseGameUrl(gameUrl(game, origin))).toEqual(game);
    expect(gamePlayer(game)).toMatch(/^\/games\/runtime\/3.0.0\/(player|arcade|classics)\.html$/);
  });
  it('preserves legacy rules and rejects invalid legacy kinds', () => {
    expect(gamePlayer(SAMPLE_GAME)).toBe('/games/runtime/1.0.0/player.html');
    expect(gameSchema.safeParse({ ...SAMPLE_GAME, kind: 'memory' }).success).toBe(false);
    expect(gameSchema.safeParse({ ...SAMPLE_GAME, pattern: 'snacks' }).success).toBe(false);
  });
  it('shares the exact course with an honest score label', () => {
    const game = { ...ARCADE_GAMES[2], seed: 23 };
    const content = resultPost({ game, score: 6500 }, origin);
    expect(content).toContain('6500 points');
    expect(content).toContain('self-reported');
    expect(findGameInContent(content)).toEqual(game);
  });
});
