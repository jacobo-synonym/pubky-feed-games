/* Original, deterministic arcade rules. No network, storage, or user identity. */
(function (root) {
  'use strict';
  const directions = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  function random(seed) {
    let n = seed >>> 0;
    return () => {
      n ^= n << 13;
      n ^= n >>> 17;
      n ^= n << 5;
      return (n >>> 0) / 4294967296;
    };
  }
  const same = (a, b) => a.x === b.x && a.y === b.y;
  function create(kind, seed, difficulty) {
    const s = {
      kind,
      random: random(seed),
      difficulty,
      score: 0,
      over: false,
      elapsed: 0,
      tick: 0,
      dir: 1,
      w: 18,
      h: 18,
    };
    if (kind === 'snake') {
      s.body = [
        { x: 6, y: 9 },
        { x: 5, y: 9 },
        { x: 4, y: 9 },
      ];
      s.nextDir = 1;
      food(s);
    }
    if (kind === 'maze') {
      s.w = 19;
      s.h = 17;
      s.cells = Array.from({ length: s.h }, () => Array(s.w).fill(1));
      const stack = [{ x: 1, y: 1 }];
      s.cells[1][1] = 0;
      while (stack.length) {
        const p = stack[stack.length - 1],
          options = directions.filter(
            ([dx, dy]) =>
              p.x + dx * 2 > 0 &&
              p.x + dx * 2 < s.w - 1 &&
              p.y + dy * 2 > 0 &&
              p.y + dy * 2 < s.h - 1 &&
              s.cells[p.y + dy * 2][p.x + dx * 2],
          );
        if (!options.length) {
          stack.pop();
          continue;
        }
        const [dx, dy] = options[Math.floor(s.random() * options.length)];
        s.cells[p.y + dy][p.x + dx] = 0;
        s.cells[p.y + dy * 2][p.x + dx * 2] = 0;
        stack.push({ x: p.x + dx * 2, y: p.y + dy * 2 });
      }
      // Extra junctions allow escapes rather than forcing dead-end encounters.
      for (let y = 1; y < s.h - 1; y++)
        for (let x = 1; x < s.w - 1; x++)
          if (
            s.cells[y][x] &&
            s.random() < 0.22 &&
            ((!s.cells[y][x - 1] && !s.cells[y][x + 1]) || (!s.cells[y - 1][x] && !s.cells[y + 1][x]))
          )
            s.cells[y][x] = 0;
      s.player = { x: 1, y: 1 };
      s.nextDir = 1;
      s.dots = new Set();
      s.power = 0;
      s.steps = 0;
      for (let y = 1; y < s.h - 1; y++)
        for (let x = 1; x < s.w - 1; x++) if (!s.cells[y][x] && (x !== 1 || y !== 1)) s.dots.add(y * s.w + x);
      s.powers = new Set([s.w + 17, 15 * s.w + 1, 15 * s.w + 17]);
      s.enemies = [
        { x: 17, y: 15 },
        { x: 17, y: 1 },
      ].slice(0, difficulty === 1 ? 1 : 2);
    }
    if (kind === 'blocks') {
      s.w = 10;
      s.h = 18;
      s.board = Array.from({ length: s.h }, () => Array(s.w).fill(0));
      s.bag = [];
      s.lines = 0;
      s.next = takePiece(s);
      spawn(s);
    }
    if (kind === 'breaker') {
      s.w = 360;
      s.h = 300;
      s.paddle = 180;
      s.lives = 3;
      s.bricks = Array.from({ length: 40 }, (_, i) => ({
        x: 12 + (i % 8) * 42,
        y: 24 + Math.floor(i / 8) * 18,
        alive: true,
      }));
      resetBall(s);
    }
    return s;
  }
  function food(s) {
    const free = [];
    for (let y = 0; y < s.h; y++)
      for (let x = 0; x < s.w; x++) if (!s.body.some((p) => p.x === x && p.y === y)) free.push({ x, y });
    if (!free.length) {
      s.over = true;
      return;
    }
    s.food = free[Math.floor(s.random() * free.length)];
  }
  const shapes = [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  ];
  function takePiece(s) {
    if (!s.bag.length) {
      s.bag = [0, 1, 2, 3, 4, 5, 6];
      for (let i = 6; i > 0; i--) {
        const j = Math.floor(s.random() * (i + 1));
        [s.bag[i], s.bag[j]] = [s.bag[j], s.bag[i]];
      }
    }
    return s.bag.pop();
  }
  function spawn(s) {
    s.piece = { type: s.next, cells: shapes[s.next].map((p) => p.slice()), x: 3, y: 0 };
    s.next = takePiece(s);
    if (!fits(s, s.piece)) s.over = true;
  }
  function fits(s, p) {
    return p.cells.every(
      ([x, y]) => p.x + x >= 0 && p.x + x < s.w && p.y + y >= 0 && p.y + y < s.h && !s.board[p.y + y][p.x + x],
    );
  }
  function clearRows(s) {
    const remaining = s.board.filter((row) => row.some((cell) => !cell)),
      count = s.h - remaining.length;
    s.board = [...Array.from({ length: count }, () => Array(s.w).fill(0)), ...remaining];
    s.lines += count;
    s.score += [0, 100, 300, 500, 800][count] || 0;
    return count;
  }
  function drop(s) {
    if (fits(s, { ...s.piece, y: s.piece.y + 1 })) {
      s.piece.y++;
      return true;
    }
    for (const [x, y] of s.piece.cells) s.board[s.piece.y + y][s.piece.x + x] = s.piece.type + 1;
    clearRows(s);
    spawn(s);
    return false;
  }
  function resetBall(s) {
    s.ball = { x: s.paddle, y: 267, vx: (s.random() < 0.5 ? -1 : 1) * 90, vy: -(135 + 25 * s.difficulty) };
  }
  function input(s, action) {
    if (s.over) return;
    const dir = { up: 0, right: 1, down: 2, left: 3 }[action];
    if (s.kind === 'snake' && dir !== undefined && dir !== (s.dir + 2) % 4) s.nextDir = dir;
    if (s.kind === 'maze' && dir !== undefined) s.nextDir = dir;
    if (s.kind === 'blocks') {
      if (action === 'left' || action === 'right') {
        const p = { ...s.piece, x: s.piece.x + (action === 'left' ? -1 : 1) };
        if (fits(s, p)) s.piece = p;
      }
      if (action === 'up' && s.piece.type !== 1) {
        const size = s.piece.type === 0 ? 4 : 3,
          cells = s.piece.cells.map(([x, y]) => [size - 1 - y, x]);
        for (const dx of [0, -1, 1, -2, 2]) {
          const p = { ...s.piece, cells, x: s.piece.x + dx };
          if (fits(s, p)) {
            s.piece = p;
            break;
          }
        }
      }
      if (action === 'down') drop(s);
      if (action === 'drop') {
        while (drop(s)) s.score++;
        s.tick = 0;
      }
    }
    if (s.kind === 'breaker' && (action === 'left' || action === 'right'))
      s.paddle = Math.max(36, Math.min(324, s.paddle + (action === 'left' ? -24 : 24)));
  }
  function moveMaze(s) {
    const walk = (p, dir) => {
      const [dx, dy] = directions[dir];
      return s.cells[p.y + dy]?.[p.x + dx] === 0 ? { x: p.x + dx, y: p.y + dy } : null;
    };
    const next = walk(s.player, s.nextDir);
    if (next) {
      s.player = next;
      s.dir = s.nextDir;
    } else s.player = walk(s.player, s.dir) || s.player;
    const key = s.player.y * s.w + s.player.x;
    if (s.dots.delete(key)) s.score += 10;
    if (s.powers.delete(key)) s.power = 35;
    const collide = () => {
      s.enemies.forEach((e, i) => {
        if (same(e, s.player)) {
          if (s.power) {
            s.score += 100;
            s.enemies[i] = { x: 17, y: 15 };
          } else s.over = true;
        }
      });
    };
    collide();
    s.steps++;
    if (s.steps % (s.difficulty === 3 ? 2 : 3) === 0) {
      const distances = new Map([[s.player.y * s.w + s.player.x, 0]]),
        queue = [s.player];
      for (let i = 0; i < queue.length; i++) {
        const p = queue[i],
          distance = distances.get(p.y * s.w + p.x);
        for (let d = 0; d < 4; d++) {
          const next = walk(p, d);
          if (!next) continue;
          const key = next.y * s.w + next.x;
          if (!distances.has(key)) {
            distances.set(key, distance + 1);
            queue.push(next);
          }
        }
      }
      s.enemies = s.enemies.map((e) => {
        const options = directions.map((_, i) => walk(e, i)).filter(Boolean);
        options.sort((a, b) => (distances.get(a.y * s.w + a.x) - distances.get(b.y * s.w + b.x)) * (s.power ? -1 : 1));
        return options.length ? options[s.random() < 0.15 ? Math.floor(s.random() * options.length) : 0] : e;
      });
      collide();
    }
    s.power = Math.max(0, s.power - 1);
    if (!s.dots.size) {
      s.score += 500;
      s.over = true;
    }
  }
  function step(s, dt) {
    if (s.over) return;
    s.elapsed += dt;
    if (s.elapsed >= 120) {
      s.over = true;
      return;
    }
    s.tick += dt;
    if (s.kind === 'snake' || s.kind === 'maze') {
      const interval = s.kind === 'snake' ? 0.25 - s.difficulty * 0.04 : 0.15;
      while (s.tick >= interval && !s.over) {
        s.tick -= interval;
        if (s.kind === 'maze') {
          moveMaze(s);
          continue;
        }
        s.dir = s.nextDir;
        const [dx, dy] = directions[s.dir],
          p = { x: s.body[0].x + dx, y: s.body[0].y + dy },
          eat = same(p, s.food);
        if (
          p.x < 0 ||
          p.y < 0 ||
          p.x >= s.w ||
          p.y >= s.h ||
          s.body.slice(0, eat ? s.body.length : -1).some((b) => same(b, p))
        ) {
          s.over = true;
          break;
        }
        s.body.unshift(p);
        if (eat) {
          s.score += 50;
          food(s);
        } else s.body.pop();
      }
    }
    if (s.kind === 'blocks') {
      const interval = Math.max(0.1, 0.8 - s.difficulty * 0.15 - s.lines * 0.015);
      while (s.tick >= interval && !s.over) {
        s.tick -= interval;
        drop(s);
      }
    }
    if (s.kind === 'breaker') {
      const b = s.ball;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 6) {
        b.x = 6;
        b.vx = Math.abs(b.vx);
      }
      if (b.x > 354) {
        b.x = 354;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < 6) {
        b.y = 6;
        b.vy = Math.abs(b.vy);
      }
      if (b.vy > 0 && b.y >= 270 && b.y <= 282 && Math.abs(b.x - s.paddle) < 42) {
        b.y = 270;
        b.vy = -Math.abs(b.vy);
        b.vx = (b.x - s.paddle) * 5;
      }
      for (const brick of s.bricks)
        if (brick.alive && b.x >= brick.x - 5 && b.x <= brick.x + 43 && b.y >= brick.y - 5 && b.y <= brick.y + 19) {
          brick.alive = false;
          b.vy = -b.vy;
          s.score += 25;
          break;
        }
      if (b.y > 310) {
        s.lives--;
        if (s.lives === 0) s.over = true;
        else resetBall(s);
      }
      if (s.bricks.every((b) => !b.alive)) {
        s.score += 500;
        s.over = true;
      }
    }
    s.score = Math.min(100000, s.score);
  }
  root.ClassicsEngine = { create, input, step, fits, clearRows };
})(globalThis);
