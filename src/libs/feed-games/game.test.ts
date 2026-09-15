import { describe, expect, it } from 'vitest';
import { findGameInContent, gamePost, gameUrl, parseGameUrl, SAMPLE_GAME } from './game';

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
    ['version', gameUrl(SAMPLE_GAME, origin).replace('v=1', 'v=2')],
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
