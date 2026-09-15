/* Version 1.0.0: fixed 60 Hz rules, shared by the player and replay tests. */
(function (root) {
  const MAX_FRAMES = 1800;
  function random(seed) {
    let n = seed >>> 0;
    return () => {
      n ^= n << 13;
      n ^= n >>> 17;
      n ^= n << 5;
      return (n >>> 0) / 4294967296;
    };
  }
  function create(config) {
    const rng = random(config.seed),
      events = [];
    let at = 100;
    while (at < 1700) {
      const obstacle = rng() > 0.28;
      events.push({
        at,
        type: obstacle ? "cone" : "fries",
        y: obstacle ? 0 : 50 + Math.floor(rng() * 55),
      });
      if (obstacle) events.push({ at: at + 28, type: "fries", y: 95 });
      at += 110 + Math.floor(rng() * 50) - (config.difficulty - 1) * 12;
    }
    return {
      frame: 0,
      y: 0,
      vy: 0,
      score: 0,
      combo: 0,
      done: false,
      hit: false,
      objects: [],
      events,
      speed: 4.1 + config.difficulty * 0.45,
      difficulty: config.difficulty,
    };
  }
  function step(s, jump = false) {
    if (s.done) return s;
    s.frame++;
    if (jump && s.y === 0) {
      s.vy = 11.5;
    }
    s.y = Math.max(0, s.y + s.vy);
    s.vy -= 0.52;
    if (s.y === 0) s.vy = 0;
    for (const e of s.events)
      if (e.at === s.frame) s.objects.push({ ...e, x: 690, taken: false });
    for (const o of s.objects) {
      o.x -= s.speed;
      if (o.taken) continue;
      if (o.type === "cone" && Math.abs(o.x - 135) < 23 && s.y < 40) {
        s.hit = true;
        s.done = true;
      }
      if (
        o.type === "fries" &&
        Math.abs(o.x - 135) < 34 &&
        Math.abs(o.y - s.y) < 42
      ) {
        o.taken = true;
        s.score++;
        s.combo++;
      }
    }
    s.objects = s.objects.filter((o) => o.x > -50);
    if (s.frame >= MAX_FRAMES) s.done = true;
    return s;
  }
  function replay(config, jumps) {
    const s = create(config);
    const inputs = new Set(jumps);
    while (!s.done) step(s, inputs.has(s.frame + 1));
    return { score: s.score, frames: s.frame, hit: s.hit };
  }
  root.VibesEngine = { create, step, replay, MAX_FRAMES, random };
})(globalThis);
