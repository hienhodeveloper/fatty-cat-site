// Fatty Cat site: the game's sound effects and chiptune loop, with a floating mute button.
// Sound starts off. Browsers only allow audio after a tap, so the button is also the opt-in.
(() => {
  "use strict";
  const BASE = "assets/audio/";
  // File and volume per effect, taken from AudioService.swift.
  const FX = {
    grow: ["stick_grow", 0.3], land: ["stick_land", 0.6], step: ["paw_step", 0.3], stepAlt: ["paw_step_alt", 0.3],
    jump: ["8bit_jump_boing", 0.45], score: ["coin_pickup_chime", 0.5], perfect: ["perfect_chime", 0.55],
    dog: ["gaugau", 0.5], birdChirp: ["bird_chirp", 0.4], birdFly: ["bird_fly", 0.35], dodge: ["dodge_whoosh", 0.45],
    bubble: ["bubble_pop", 0.3], meow: ["meow", 0.55], meow1: ["meow_1", 0.55],
  };
  const MUSIC_VOLUME = 0.35, KEY = "fattycat.sound";
  const btn = document.getElementById("sound");
  let on = false, ctx = null, loading = null, music = null;
  const buffers = {}, playing = {};

  const store = {
    get() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } },
    set(v) { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) { /* private mode */ } },
  };

  // Speaker icons from Sprites.swift, drawn as pixel SVG.
  const ICONS = {
    on: ["...#....", "..##..#.", ".###...#", "####.#.#", ".###...#", "..##..#.", "...#...."],
    off: ["...#....", "..##....", ".###.#.#", "####..#.", ".###.#.#", "..##....", "...#...."],
  };
  function icon(kind) {
    let r = "";
    ICONS[kind].forEach((row, y) => { [...row].forEach((c, x) => { if (c === "#") r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }); });
    return `<svg viewBox="0 0 8 7" aria-hidden="true" focusable="false" shape-rendering="crispEdges" fill="currentColor">${r}</svg>`;
  }
  function paint() {
    if (!btn) return;
    btn.innerHTML = icon(on ? "on" : "off"); // markup built only from the constant icon rows above
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
    btn.title = on ? "Sound on" : "Sound off";
    btn.classList.toggle("is-on", on);
  }

  function load() {
    if (loading) return loading;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.resolve();
    ctx = new AC();
    loading = Promise.all(Object.entries(FX).map(async ([name, [file]]) => {
      try {
        const res = await fetch(`${BASE}${file}.mp3`);
        buffers[name] = await ctx.decodeAudioData(await res.arrayBuffer());
      } catch (e) { /* a missing effect just stays silent */ }
    }));
    music = new Audio(`${BASE}music.mp3`);
    music.loop = true; music.volume = MUSIC_VOLUME; music.preload = "none";
    return loading;
  }

  // iOS Safari only lets audio start inside the tap itself, so everything that starts sound runs
  // before the first await: create and unlock the context, start the music, then wait for the effects.
  function enable() {
    on = true; paint(); store.set(true);
    const pending = load();
    if (ctx) {
      try { ctx.resume(); } catch (e) { /* ignore */ }
      try { // a one-sample silent buffer unlocks Web Audio on iOS
        const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0);
      } catch (e) { /* ignore */ }
    }
    if (music) { const p = music.play(); if (p && p.catch) p.catch(() => {}); }
    return pending;
  }
  function disable() {
    on = false; paint(); store.set(false);
    if (music) music.pause();
    Object.keys(playing).forEach(stop);
  }

  function play(name) {
    const buf = buffers[name];
    if (!on || !ctx || !buf || ctx.state !== "running") return;
    const src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = buf; gain.gain.value = FX[name][1];
    src.connect(gain).connect(ctx.destination);
    src.start();
    playing[name] = src;
    src.onended = () => { if (playing[name] === src) delete playing[name]; };
  }
  function stop(name) {
    const src = playing[name];
    if (src) { try { src.stop(); } catch (e) { /* already ended */ } delete playing[name]; }
  }
  window.FattyAudio = { play, stop };

  if (btn) {
    btn.addEventListener("click", () => (on ? disable() : enable()));
    // Remember the choice: if sound was on last time, start it at the first tap anywhere on the page.
    if (store.get()) {
      on = true;
      const EVENTS = ["click", "touchend", "keydown"];
      const resume = (e) => {
        if (btn.contains(e.target)) return;
        EVENTS.forEach((n) => removeEventListener(n, resume, true));
        if (on) enable();
      };
      EVENTS.forEach((n) => addEventListener(n, resume, true));
    }
    // Pause the music while the tab is hidden.
    document.addEventListener("visibilitychange", () => {
      if (!music || !on) return;
      if (document.hidden) music.pause(); else music.play().catch(() => {});
    });
    paint();
  }
})();
