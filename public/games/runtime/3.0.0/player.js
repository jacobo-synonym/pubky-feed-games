(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    canvas = $("game"),
    ctx = canvas.getContext("2d");
  const themes = {
    park: {
      sky: "#c6dfba",
      ground: "#536b44",
      ink: "#24382b",
      bird: "#a6a5cb",
      accent: "#ffe17b",
    },
    sunset: {
      sky: "#efbc95",
      ground: "#985c4d",
      ink: "#583c49",
      bird: "#dfd3e6",
      accent: "#ffeb8e",
    },
    midnight: {
      sky: "#363658",
      ground: "#272b3b",
      ink: "#b8b6d6",
      bird: "#a6bbcf",
      accent: "#dfeb91",
    },
  };
  let config = { seed: 4242, difficulty: 2, theme: "park" },
    state = VibesEngine.create(config),
    playing = false,
    paused = false,
    accumulator = 0,
    last = 0,
    request = 0,
    queued = false,
    channel = null,
    parentOrigin = null,
    audio = null,
    sound = false,
    reduced = false;
  const jumps = [];
  let particles = [];
  const send = (type, data = {}) => {
    if (channel)
      parent.postMessage({ v: 1, channel, type, ...data }, parentOrigin);
  };
  function path(fill, draw) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    draw();
    ctx.fill();
  }
  function ellipse(x, y, rx, ry, fill) {
    path(fill, () => ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2));
  }
  function rect(x, y, w, h, fill, r = 0) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function pigeon(x, y, scale = 1, flight = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const t = themes[config.theme];
    ctx.strokeStyle = "#b97d55";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const a of [-12, 12]) {
      ctx.beginPath();
      ctx.moveTo(a, 20);
      ctx.lineTo(a + (flight ? -9 : 0), 36);
      ctx.lineTo(a + 10, 36);
      ctx.stroke();
    }
    path("#7d8098", () => {
      ctx.moveTo(-35, 0);
      ctx.lineTo(-66, -12);
      ctx.lineTo(-49, 19);
      ctx.lineTo(-23, 20);
    });
    ellipse(-5, 3, 39, 28, t.bird);
    ellipse(-9, 3, 24, 17, "#8587a5");
    path("#62857f", () => {
      ctx.moveTo(14, 3);
      ctx.quadraticCurveTo(40, -12, 32, -46);
      ctx.lineTo(9, -35);
      ctx.lineTo(7, 5);
    });
    ellipse(23, -43, 20, 21, t.bird);
    ellipse(31, -46, 5.5, 5.5, "#fff7d8");
    ellipse(33, -46, 2.8, 3, "#26352e");
    path("#e1ac63", () => {
      ctx.moveTo(40, -40);
      ctx.lineTo(54, -35);
      ctx.lineTo(39, -31);
    });
    ctx.strokeStyle = "#ffffff50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-23, -1);
    ctx.quadraticCurveTo(-13, 12, 3, 11);
    ctx.stroke();
    ctx.restore();
  }
  function fry(x, y, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    rect(-5, -17, 10, 32, "#ffe28b", 2);
    rect(-4, -16, 3, 28, "#fff3bc", 1);
    ctx.restore();
  }
  function draw() {
    const t = themes[config.theme],
      moving = playing ? state.frame : 0,
      offset = moving * state.speed;
    ctx.fillStyle = t.sky;
    ctx.fillRect(0, 0, 720, 440);
    ellipse(
      560,
      83,
      46,
      46,
      config.theme === "midnight" ? "#e2e5c6" : "#fff0b3",
    );
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 9; i++) {
      let x = ((((i * 112 - offset * 0.14) % 980) + 980) % 980) - 80;
      rect(x, 140 - (i % 3) * 20, 75, 150, t.ink, 3);
      for (let j = 0; j < 3; j++) rect(x + 14 + j * 17, 162, 7, 13, t.sky);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      let x = ((((i * 170 - offset * 0.3) % 1080) + 1080) % 1080) - 100;
      rect(x, 197, 7, 156, t.ground);
      ellipse(x + 3, 178, 53, 63, t.ground);
      ctx.globalAlpha = 0.18;
      ellipse(x + 21, 170, 26, 41, t.sky);
      ctx.globalAlpha = 1;
    }
    rect(0, 334, 720, 106, t.ground);
    rect(
      0,
      341,
      720,
      65,
      config.theme === "park"
        ? "#b8b59b"
        : config.theme === "sunset"
          ? "#cd9d80"
          : "#65667b",
    );
    ctx.strokeStyle = t.ink + "30";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const x = ((((i * 90 - offset) % 1080) + 1080) % 1080) - 100;
      ctx.beginPath();
      ctx.moveTo(x, 346);
      ctx.lineTo(x - 30, 400);
      ctx.stroke();
    }
    rect(0, 402, 720, 4, t.ink + "55");
    if (!playing) {
      const narrow = canvas.clientWidth < 500;
      ctx.save();
      ctx.translate(narrow ? 335 : 535, narrow ? 332 : 314);
      ctx.rotate(-0.08);
      pigeon(0, 0, narrow ? 1.55 : 2.1);
      ctx.restore();
      fry(615, 282, 0.55);
      fry(650, 280, -0.4);
      fry(626, 313, 0.12);
      fry(579, 380, 1.1);
      ctx.strokeStyle = t.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(584, 230, 38, -1, -0.3);
      ctx.stroke();
    } else {
      ellipse(135, 372, 31 - state.y * 0.07, 6, "#00000020");
      for (const o of state.objects) {
        if (o.taken) continue;
        const y = 365 - o.y;
        if (o.type === "fries") {
          fry(o.x, y - 0.0, -0.2);
          ctx.globalAlpha = 0.4;
          ellipse(o.x, y, 20, 20, "#ffe48b40");
          ctx.globalAlpha = 1;
        } else {
          rect(o.x - 22, 367, 44, 6, "#775747", 3);
          path("#db865a", () => {
            ctx.moveTo(o.x - 16, 367);
            ctx.lineTo(o.x - 4, 322);
            ctx.lineTo(o.x + 4, 322);
            ctx.lineTo(o.x + 16, 367);
          });
          rect(o.x - 9, 340, 18, 7, "#ffe6bd");
        }
      }
      pigeon(135, 337 - state.y, 1, state.y > 0);
      if (!reduced)
        for (const p of particles) {
          ellipse(p.x, p.y, 3, 3, t.accent);
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.life--;
        }
      particles = particles.filter((p) => p.life > 0);
    }
  }
  function tone(freq) {
    if (!sound) return;
    try {
      audio ||= new AudioContext();
      audio.resume();
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.connect(g);
      g.connect(audio.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.11);
      o.start();
      o.stop(audio.currentTime + 0.12);
    } catch {
      sound = false;
    }
  }
  function tick(now) {
    if (!playing || paused) return;
    if (!last) last = now;
    accumulator += Math.min(now - last, 100);
    last = now;
    while (accumulator >= 1000 / 60 && !state.done) {
      const before = state.score;
      const jump = queued;
      queued = false;
      if (jump) jumps.push(state.frame + 1);
      VibesEngine.step(state, jump);
      if (state.score > before) {
        tone(780);
        if (!reduced)
          for (let i = 0; i < 7; i++)
            particles.push({
              x: 135,
              y: 337 - state.y,
              vx: (i - 3) * 1.3,
              vy: -3 - i * 0.2,
              life: 20,
            });
      }
      accumulator -= 1000 / 60;
    }
    draw();
    $("score").textContent =
      `${state.score} ${state.score === 1 ? "fry" : "fries"}`;
    $("time").textContent = `${Math.ceil((1800 - state.frame) / 60)}s`;
    if (state.done) {
      tone(state.hit ? 180 : 950);
      send("result", {
        result: {
          score: state.score,
          frames: state.frame,
          hit: state.hit,
          jumps: jumps.slice(0, 300),
        },
      });
      $("jump").hidden = true;
      $("pause-button").hidden = true;
      return;
    }
    request = requestAnimationFrame(tick);
  }
  function start() {
    state = VibesEngine.create(config);
    jumps.length = 0;
    particles = [];
    playing = true;
    paused = false;
    last = 0;
    accumulator = 0;
    $("intro").hidden = true;
    $("pause").hidden = true;
    $("jump").hidden = false;
    $("pause-button").hidden = false;
    send("start");
    cancelAnimationFrame(request);
    request = requestAnimationFrame(tick);
    $("jump").focus();
  }
  function pause() {
    if (!playing || state.done || paused) return;
    paused = true;
    cancelAnimationFrame(request);
    $("pause").hidden = false;
    $("jump").hidden = true;
    $("resume").focus();
  }
  function resume() {
    if (!playing || !paused) return;
    paused = false;
    last = 0;
    $("pause").hidden = true;
    $("jump").hidden = false;
    request = requestAnimationFrame(tick);
    $("jump").focus();
  }
  function jump() {
    if (playing && !paused && !state.done) {
      queued = true;
      tone(330);
    }
  }
  $("start").onclick = start;
  $("resume").onclick = resume;
  $("jump").onclick = jump;
  $("pause-button").onclick = pause;
  canvas.onpointerdown = () => {
    if (playing) jump();
  };
  $("sound").onclick = () => {
    sound = !sound;
    tone(550);
    $("sound").textContent = sound ? "Sound on" : "Sound off";
    $("sound").setAttribute(
      "aria-label",
      sound ? "Turn sound off" : "Turn sound on",
    );
    send("sound", { enabled: sound });
  };
  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (!playing) start();
      else if (paused) resume();
      else jump();
    }
    if (e.code === "Escape") send("exit");
    if (e.code === "KeyP") {
      if (paused) resume();
      else pause();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("message", (e) => {
    if (e.source !== parent || !e.data || e.data.v !== 1) return;
    const m = e.data;
    if (
      m.type === "init" &&
      !channel &&
      typeof m.channel === "string" &&
      m.channel.length === 36
    ) {
      if (
        !m.config ||
        !themes[m.config.theme] ||
        !Number.isInteger(m.config.seed) ||
        m.config.seed < 1 ||
        m.config.seed > 2147483647 ||
        ![1, 2, 3].includes(m.config.difficulty)
      )
        return;
      channel = m.channel;
      parentOrigin = e.origin;
      config = m.config;
      state = VibesEngine.create(config);
      reduced = !!m.reduced;
      sound = !!m.sound;
      $("sound").textContent = sound ? "Sound on" : "Sound off";
      draw();
      send("ready");
    } else if (m.channel === channel) {
      if (m.type === "pause") pause();
      if (m.type === "restart") start();
    }
  });
  draw();
  parent.postMessage({ v: 1, type: "boot" }, "*");
})();
