(() => {
  'use strict';
  const $ = (id) => document.getElementById(id),
    canvas = $('board'),
    ctx = canvas.getContext('2d'),
    E = ClassicsEngine;
  const info = {
    maze: [
      'Maze Munch',
      'Collect every dot and avoid the chasers. Big dots give you a short power-up.',
      'Arrow keys / WASD · swipe or tap arrows',
    ],
    blocks: [
      'Falling Blocks',
      'Complete horizontal rows. Rotate and drop pieces before the stack reaches the top.',
      '← → move · ↑ rotate · ↓ lower · Space drop',
    ],
    breaker: [
      'Brick Breaker',
      'Move your paddle to keep the ball alive. Clear all the bricks. You have three lives.',
      '← → move · drag the paddle',
    ],
    snake: [
      'Snake',
      'Eat the snacks and grow. Avoid the edges and your own tail.',
      'Arrow keys / WASD · swipe or tap arrows',
    ],
  };
  let config,
    channel,
    parentOrigin,
    state,
    running = false,
    paused = false,
    last = 0,
    held = null,
    repeat = 0,
    touch = null;
  const send = (type, data = {}) => {
    if (channel) parent.postMessage({ v: 1, channel, type, ...data }, parentOrigin);
  };
  function action(name) {
    if (running && !paused) E.input(state, name);
  }
  function start() {
    state = E.create(config.kind, config.seed, config.difficulty);
    running = true;
    paused = false;
    held = null;
    last = performance.now();
    $('intro').hidden = true;
    $('paused').hidden = true;
    $('play').hidden = false;
    $('pause').hidden = false;
    send('start');
    canvas.focus();
    draw();
  }
  function pause() {
    if (!running || paused) return;
    paused = true;
    held = null;
    $('play').hidden = true;
    $('paused').hidden = false;
    $('resume').focus();
  }
  function resume() {
    paused = false;
    last = performance.now();
    $('play').hidden = false;
    $('paused').hidden = true;
    canvas.focus();
  }
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  }
  function dot(x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const palettes = {
    park: ['#c8f563', '#93c5fd', '#d4b4fe', '#f9bc80', '#7dd3c4', '#f5a3b5', '#e0e0e8'],
    sunset: ['#f9bc80', '#f5a3b5', '#d4b4fe', '#c8f563', '#7dd3c4', '#93c5fd', '#e0e0e8'],
    midnight: ['#93c5fd', '#d4b4fe', '#7dd3c4', '#c8f563', '#f9bc80', '#f5a3b5', '#e0e0e8'],
  };
  function draw() {
    const s = state,
      palette = palettes[config.theme];
    ctx.clearRect(0, 0, 380, 360);
    rect(0, 0, 380, 360, '#16161a');
    if (s.kind === 'blocks') {
      const size = 18,
        ox = 72;
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 10; x++)
          rect(ox + x * size, y * size + 18, 17, 17, s.board[y][x] ? palette[s.board[y][x] - 1] : '#232327');
      let ghost = { ...s.piece };
      while (E.fits(s, { ...ghost, y: ghost.y + 1 })) ghost.y++;
      for (const [x, y] of ghost.cells) rect(ox + (ghost.x + x) * size, (ghost.y + y) * size + 18, 17, 17, '#414148');
      for (const [x, y] of s.piece.cells)
        rect(ox + (s.piece.x + x) * size, (s.piece.y + y) * size + 18, 17, 17, palette[s.piece.type]);
      ctx.fillStyle = '#aaaab3';
      ctx.font = '12px system-ui';
      ctx.fillText('NEXT', 278, 40);
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
      for (const [x, y] of shapes[s.next]) rect(278 + x * 14, 54 + y * 14, 13, 13, palette[s.next]);
    } else if (s.kind === 'maze') {
      const size = 20;
      for (let y = 0; y < s.h; y++)
        for (let x = 0; x < s.w; x++) if (s.cells[y][x]) rect(x * size + 1, y * size + 11, 18, 18, '#3a3a44');
      for (const key of s.dots) {
        const x = key % s.w,
          y = Math.floor(key / s.w);
        dot(x * size + 10, y * size + 20, s.powers.has(key) ? 5 : 2, palette[0]);
      }
      dot(s.player.x * size + 10, s.player.y * size + 20, 7, palette[0]);
      for (const e of s.enemies) {
        rect(e.x * size + 3, e.y * size + 13, 14, 14, s.power ? '#93c5fd' : '#f5a3b5');
        dot(e.x * size + 7, e.y * size + 18, 2, '#16161a');
        dot(e.x * size + 13, e.y * size + 18, 2, '#16161a');
      }
    } else if (s.kind === 'snake') {
      for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) rect(10 + x * 20, y * 20, 19, 19, '#232327');
      s.body.forEach((p, i) => rect(11 + p.x * 20, 1 + p.y * 20, 18, 18, i ? '#7a9b40' : palette[0]));
      dot(20 + s.food.x * 20, 10 + s.food.y * 20, 6, '#f9bc80');
    } else {
      for (const b of s.bricks) if (b.alive) rect(b.x + 10, b.y + 18, 38, 14, palette[Math.floor((b.y - 24) / 18)]);
      rect(s.paddle - 26, 294, 72, 8, palette[0]);
      dot(s.ball.x + 10, s.ball.y + 18, 6, '#fff');
    }
    $('score').textContent = `${s.score} points`;
    $('detail').textContent =
      s.kind === 'blocks'
        ? `${s.lines} rows`
        : s.kind === 'breaker'
          ? `${s.lives} lives`
          : s.kind === 'maze'
            ? `${s.dots.size} dots`
            : `${s.body.length} long`;
    $('time').textContent = `${Math.max(0, Math.ceil(120 - s.elapsed))}s`;
  }
  function loop(now) {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    if (running && !paused) {
      if (held && (config.kind === 'blocks' || config.kind === 'breaker')) {
        repeat += dt;
        if (repeat > 0.11) {
          action(held);
          repeat = 0;
        }
      }
      E.step(state, dt);
      draw();
      if (state.over) {
        running = false;
        held = null;
        $('pause').hidden = true;
        send('result', { result: { score: state.score } });
      }
    }
    requestAnimationFrame(loop);
  }
  $('start').onclick = start;
  $('pause').onclick = pause;
  $('resume').onclick = resume;
  document.querySelectorAll('[data-action]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      action(b.dataset.action);
      if (['left', 'right', 'down'].includes(b.dataset.action)) {
        held = b.dataset.action;
        repeat = -0.15;
      }
      b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointerup', () => (held = null));
    b.addEventListener('pointercancel', () => (held = null));
    b.addEventListener('click', (e) => {
      if (e.detail === 0) action(b.dataset.action);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName === 'BUTTON') return;
    const a = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
      Space: 'drop',
    }[e.code];
    if (a && running && !paused) {
      e.preventDefault();
      action(a);
    }
    if (e.code === 'Escape') send('exit');
    if (e.code === 'KeyP') {
      e.preventDefault();
      if (paused) resume();
      else pause();
    }
  });
  canvas.addEventListener('pointerdown', (e) => {
    touch = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    paddle(e);
  });
  function paddle(e) {
    if (config.kind === 'breaker' && running && !paused) {
      const r = canvas.getBoundingClientRect();
      state.paddle = Math.max(36, Math.min(324, ((e.clientX - r.left) * 380) / r.width - 10));
    }
  }
  canvas.addEventListener('pointermove', (e) => {
    if (touch) paddle(e);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (touch) {
      const dx = e.clientX - touch.x,
        dy = e.clientY - touch.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 12)
        action(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      touch = null;
    }
  });
  canvas.addEventListener('pointercancel', () => (touch = null));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  window.addEventListener('blur', () => {
    held = null;
  });
  window.addEventListener('message', (event) => {
    if (event.source !== parent || event.data?.v !== 1) return;
    const m = event.data;
    if (m.type === 'init' && !channel && typeof m.channel === 'string' && m.channel.length === 36) {
      const c = m.config;
      if (
        !c ||
        !Object.hasOwn(info, c.kind) ||
        ![1, 2, 3].includes(c.difficulty) ||
        !Number.isInteger(c.seed) ||
        c.seed < 1 ||
        c.seed > 2147483647 ||
        !['park', 'sunset', 'midnight'].includes(c.theme)
      )
        return;
      config = c;
      channel = m.channel;
      parentOrigin = event.origin;
      const [title, instructions, hint] = info[c.kind];
      $('title').textContent = title;
      $('heading').textContent = title;
      $('instructions').textContent = instructions;
      $('hint').textContent = hint;
      canvas.setAttribute('aria-label', `${title}: ${hint}`);
      $('drop').hidden = c.kind !== 'blocks';
      $('up').hidden = $('down').hidden = c.kind === 'breaker';
      if (c.kind === 'blocks') {
        $('up').textContent = '↻';
        $('up').setAttribute('aria-label', 'Rotate piece');
        $('down').setAttribute('aria-label', 'Lower piece');
      }
      send('ready');
      requestAnimationFrame(loop);
    } else if (channel && m.channel === channel) {
      if (m.type === 'restart') start();
      if (m.type === 'pause') pause();
    }
  });
  parent.postMessage({ v: 1, type: 'boot' }, '*');
})();
