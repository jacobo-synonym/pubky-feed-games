import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

type Engine = {
  deck: (seed: number, difficulty: number) => number[];
  memoryScore: (pairs: number, moves: number) => number;
  reactionDelays: (seed: number, difficulty: number) => number[];
  reactionScore: (times: (number | null)[]) => number;
};
const context = { ArcadeEngine: {} as Engine };
runInNewContext(readFileSync('public/games/runtime/2.0.0/arcade-engine.js', 'utf8'), context);
const engine = context.ArcadeEngine;

describe('Deterministic arcade rules', () => {
  it.each([1, 2, 3])('creates a solvable deck at difficulty %i', (difficulty) => {
    const cards = engine.deck(719, difficulty);
    expect(cards).toHaveLength([8, 12, 16][difficulty - 1]);
    for (const symbol of new Set(cards)) expect(cards.filter((card) => card === symbol)).toHaveLength(2);
    expect(engine.deck(719, difficulty)).toEqual(cards);
    expect(engine.deck(720, difficulty)).not.toEqual(cards);
  });
  it('rewards accurate memory play and keeps scores bounded', () => {
    expect(engine.memoryScore(6, 6)).toBe(600);
    expect(engine.memoryScore(6, 8)).toBe(560);
    expect(engine.memoryScore(6, 500)).toBe(10);
  });
  it('uses seeded reaction timings and penalizes early or missed taps', () => {
    expect(engine.reactionDelays(2026, 3)).toHaveLength(9);
    expect(engine.reactionDelays(2026, 3)).toEqual(engine.reactionDelays(2026, 3));
    expect(engine.reactionDelays(2026, 1).every((delay) => delay >= 1000 && delay < 3200)).toBe(true);
    expect(engine.reactionScore([200, 400, null, 2000])).toBe(1400);
  });
});

describe('Versioned runner courses', () => {
  type Runner = { create: (config: { seed: number; difficulty: number; pattern?: string }) => { events: unknown[] } };
  function load(version: string): Runner {
    const context = { VibesEngine: {} as Runner };
    runInNewContext(readFileSync(`public/games/runtime/${version}/engine.js`, 'utf8'), context);
    return context.VibesEngine;
  }
  it('keeps the original balanced course and makes course style meaningful', () => {
    const original = load('1.0.0'),
      current = load('2.0.0');
    const config = { seed: 4242, difficulty: 2 };
    expect(current.create({ ...config, pattern: 'balanced' }).events).toEqual(original.create(config).events);
    expect(current.create({ ...config, pattern: 'snacks' }).events).not.toEqual(
      current.create({ ...config, pattern: 'hurdles' }).events,
    );
  });
});
