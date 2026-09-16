import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

type Point = { x: number; y: number };
type State = {
  score: number;
  over: boolean;
  elapsed: number;
  dir: number;
  body: Point[];
  food: Point;
  board: number[][];
  w: number;
  h: number;
  lines: number;
  piece: { type: number; cells: number[][]; x: number; y: number };
  cells: number[][];
  dots: Set<number>;
  player: Point;
  enemies: Point[];
  ball: { x: number; y: number; vx: number; vy: number };
  bricks: { x: number; y: number; alive: boolean }[];
  lives: number;
};
type Engine = {
  create: (kind: string, seed: number, difficulty: number) => State;
  input: (s: State, action: string) => void;
  step: (s: State, dt: number) => void;
  clearRows: (s: State) => number;
  fits: (s: State, p: State['piece']) => boolean;
};
const context = { ClassicsEngine: {} as Engine };
runInNewContext(readFileSync('public/games/runtime/3.0.0/classics-engine.js', 'utf8'), context);
const engine = context.ClassicsEngine;

describe('Classic arcade rules', () => {
  it('snake eats, grows, refuses reversals, and ends at a wall', () => {
    const s = engine.create('snake', 61, 2);
    s.food = { x: 7, y: 9 };
    engine.input(s, 'left');
    engine.step(s, 0.18);
    expect(s.body[0]).toEqual({ x: 7, y: 9 });
    expect(s.body).toHaveLength(4);
    expect(s.score).toBe(50);
    expect(s.body).not.toContainEqual(s.food);
    for (let i = 0; i < 30; i++) engine.step(s, 0.18);
    expect(s.over).toBe(true);
  });
  it('clears complete rows and preserves incomplete rows', () => {
    const s = engine.create('blocks', 87, 2);
    s.board[17].fill(1);
    s.board[16].fill(2);
    s.board[15][0] = 3;
    expect(engine.clearRows(s)).toBe(2);
    expect(s.score).toBe(300);
    expect(s.lines).toBe(2);
    expect(s.board[17][0]).toBe(3);
    expect(s.board).toHaveLength(18);
  });
  it('keeps rotated pieces within the board and ends a blocked stack', () => {
    const s = engine.create('blocks', 87, 2);
    for (let i = 0; i < 20; i++) {
      engine.input(s, 'left');
      engine.input(s, 'up');
      expect(engine.fits(s, s.piece)).toBe(true);
    }
    for (let i = 0; i < 100 && !s.over; i++) engine.input(s, 'drop');
    expect(s.over).toBe(true);
  });
  it.each([1, 42, 234, 2147483647])('generates a connected, repeatable maze for seed %i', (seed) => {
    const s = engine.create('maze', seed, 2),
      other = engine.create('maze', seed, 2);
    expect(s.cells).toEqual(other.cells);
    const seen = new Set<number>([20]),
      queue = [{ x: 1, y: 1 }];
    while (queue.length) {
      const p = queue.shift()!;
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        const x = p.x + dx,
          y = p.y + dy,
          key = y * s.w + x;
        if (s.cells[y]?.[x] === 0 && !seen.has(key)) {
          seen.add(key);
          queue.push({ x, y });
        }
      }
    }
    expect([...s.dots].every((key) => seen.has(key))).toBe(true);
    expect(seen.size).toBeGreaterThan(100);
  });
  it('maze collects a dot and detects capture', () => {
    const s = engine.create('maze', 42, 2);
    const [dx, dy, action] = s.cells[1][2] === 0 ? ([1, 0, 'right'] as const) : ([0, 1, 'down'] as const);
    engine.input(s, action);
    engine.step(s, 0.16);
    expect(s.score).toBe(10);
    s.enemies = [{ x: s.player.x + dx, y: s.player.y + dy }];
    // Put a chaser on the next walkable square.
    s.cells[s.player.y + dy][s.player.x + dx] = 0;
    engine.step(s, 0.16);
    expect(s.over).toBe(true);
  });
  it('breaker destroys a brick, bounces, and runs out of lives', () => {
    const s = engine.create('breaker', 53, 2),
      brick = s.bricks[0];
    s.ball = { x: brick.x + 10, y: brick.y + 8, vx: 0, vy: -150 };
    engine.step(s, 0.01);
    expect(brick.alive).toBe(false);
    expect(s.score).toBe(25);
    expect(s.ball.vy).toBeGreaterThan(0);
    for (let i = 0; i < 3; i++) {
      s.ball.y = 320;
      engine.step(s, 0.01);
    }
    expect(s.lives).toBe(0);
    expect(s.over).toBe(true);
  });
  it.each(['maze', 'blocks', 'breaker', 'snake'])('bounds each %s session and freezes finished scores', (kind) => {
    const s = engine.create(kind, 11, 1);
    s.elapsed = 119.99;
    engine.step(s, 0.02);
    expect(s.over).toBe(true);
    const score = s.score;
    engine.input(s, 'drop');
    engine.step(s, 1);
    expect(s.score).toBe(score);
  });
});
