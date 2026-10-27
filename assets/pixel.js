// Fatty Cat site: the game's 5x7 pixel font (headings) and a tiny playable hero.
(() => {
  "use strict";

  // ── Pixel font (ported from PixelFont.swift) ───────────────────────
  const G = {
    A:".###.|#...#|#...#|#####|#...#|#...#|#...#", B:"####.|#...#|#...#|####.|#...#|#...#|####.",
    C:".####|#....|#....|#....|#....|#....|.####", D:"####.|#...#|#...#|#...#|#...#|#...#|####.",
    E:"#####|#....|#....|####.|#....|#....|#####", F:"#####|#....|#....|####.|#....|#....|#....",
    G:".####|#....|#....|#.###|#...#|#...#|.####", H:"#...#|#...#|#...#|#####|#...#|#...#|#...#",
    I:"#####|..#..|..#..|..#..|..#..|..#..|#####", J:"..###|...#.|...#.|...#.|...#.|#..#.|.##..",
    K:"#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L:"#....|#....|#....|#....|#....|#....|#####",
    M:"#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N:"#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",
    O:".###.|#...#|#...#|#...#|#...#|#...#|.###.", P:"####.|#...#|#...#|####.|#....|#....|#....",
    Q:".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R:"####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    S:".####|#....|#....|.###.|....#|....#|####.", T:"#####|..#..|..#..|..#..|..#..|..#..|..#..",
    U:"#...#|#...#|#...#|#...#|#...#|#...#|.###.", V:"#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
    W:"#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#", X:"#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    Y:"#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z:"#####|....#|...#.|..#..|.#...|#....|#####",
    a:".....|.....|.###.|....#|.####|#...#|.####", b:"#....|#....|#.##.|##..#|#...#|##..#|#.##.",
    c:".....|.....|.####|#....|#....|#....|.####", d:"....#|....#|.##.#|#..##|#...#|#..##|.##.#",
    e:".....|.....|.###.|#...#|#####|#....|.####", f:"..##.|.#..#|.#...|###..|.#...|.#...|.#...",
    g:".....|.####|#...#|#...#|.####|....#|.###.", h:"#....|#....|#.##.|##..#|#...#|#...#|#...#",
    i:"..#..|.....|.##..|..#..|..#..|..#..|.###.", j:"...#.|.....|..##.|...#.|...#.|#..#.|.##..",
    k:"#....|#....|#..#.|#.#..|##...|#.#..|#..#.", l:".##..|..#..|..#..|..#..|..#..|..#..|.###.",
    m:".....|.....|##.#.|#.#.#|#.#.#|#...#|#...#", n:".....|.....|#.##.|##..#|#...#|#...#|#...#",
    o:".....|.....|.###.|#...#|#...#|#...#|.###.", p:".....|####.|#...#|#...#|####.|#....|#....",
    q:".....|.####|#...#|#...#|.####|....#|....#", r:".....|.....|#.##.|##..#|#....|#....|#....",
    s:".....|.....|.####|#....|.###.|....#|####.", t:".#...|.#...|###..|.#...|.#...|.#..#|..##.",
    u:".....|.....|#...#|#...#|#...#|#..##|.##.#", v:".....|.....|#...#|#...#|#...#|.#.#.|..#..",
    w:".....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.", x:".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",
    y:".....|#...#|#...#|#...#|.####|....#|.###.", z:".....|.....|#####|...#.|..#..|.#...|#####",
    0:".###.|#...#|#...#|#...#|#...#|#...#|.###.", 1:"..#..|.##..|..#..|..#..|..#..|..#..|.###.",
    2:".###.|#...#|....#|...#.|..#..|.#...|#####", 3:"#####|...#.|..#..|...#.|....#|#...#|.###.",
    4:"...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5:"#####|#....|####.|....#|....#|#...#|.###.",
    6:"..##.|.#...|#....|####.|#...#|#...#|.###.", 7:"#####|....#|...#.|..#..|.#...|.#...|.#...",
    8:".###.|#...#|#...#|.###.|#...#|#...#|.###.", 9:".###.|#...#|#...#|.####|....#|...#.|.##..",
    "!":"#|#|#|#|#|.|#", "+":".....|..#..|..#..|#####|..#..|..#..|.....", "-":".....|.....|.....|#####|.....|.....|.....",
    ".":"..|..|..|..|..|##|##", ",":"..|..|..|..|##|##|#.", "'":"#|#|.|.|.|.|.", "?":".###.|#...#|....#|..##.|..#..|.....|..#..",
    "&":".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#", ":":"..|##|##|..|##|##|..",
  };
  const glyph = (ch) => (G[ch] || G[ch.toUpperCase()] || null);
  const textWidth = (t) => [...t].reduce((w, ch) => w + (glyph(ch) ? glyph(ch).split("|")[0].length : 3) + 1, 0) - 1;

  /** Calls fn(x, y, w) for every horizontal run of lit pixels in the text. */
  function eachRun(text, fn) {
    let x = 0;
    for (const ch of text) {
      const g = glyph(ch);
      if (!g) { x += 4; continue; }
      const rows = g.split("|");
      rows.forEach((row, y) => {
        let start = -1;
        for (let c = 0; c <= row.length; c++) {
          if (row[c] === "#" && start < 0) start = c;
          if (row[c] !== "#" && start >= 0) { fn(x + start, y, c - start); start = -1; }
        }
      });
      x += rows[0].length + 1;
    }
  }

  function svgFor(text, fill, shadow) {
    const w = textWidth(text) + (shadow ? 1 : 0), h = 7 + (shadow ? 1 : 0);
    let rects = "";
    if (shadow) eachRun(text, (x, y, rw) => { rects += `<rect x="${x + 1}" y="${y + 1}" width="${rw}" height="1" fill="${shadow}"/>`; });
    eachRun(text, (x, y, rw) => { rects += `<rect x="${x}" y="${y}" width="${rw}" height="1" fill="${fill}"/>`; });
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${rects}</svg>`;
  }

  // Headings: keep the real text for assistive tech, draw the pixel version on top.
  document.querySelectorAll("[data-px]").forEach((el) => {
    const text = el.textContent.trim();
    const cs = getComputedStyle(el);
    const fill = cs.getPropertyValue("--px-fill").trim() || "currentColor";
    const shadow = cs.getPropertyValue("--px-shadow").trim() || null;
    const label = document.createElement("span");
    label.className = "sr";
    label.textContent = text;
    el.replaceChildren(label);
    el.insertAdjacentHTML("beforeend", svgFor(text, fill, shadow)); // markup built only from glyph data
    el.classList.add("px-ready");
  });

  // ── Mini game ─────────────────────────────────────────────────────
  const canvas = document.getElementById("play");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const C = {
    sky: "#62A6EC", bands: ["#72B1EF", "#86BEF2", "#9ECCF5"], bank: "#BCDDF8", trees: "#3C8C6E", treesLight: "#5CAD84",
    water: "#3E86C8", waterDeep: "#2A66A4", waterLight: "#7CBCEC", pink: "#EE5A96", pinkLight: "#FF9DCF",
    pinkDark: "#6E1A40", outline: "#15151C", marker: "#FF3B3B", stick: "#4A2712", navy: "#1B1E5E",
    badge: "#B9BCF4", yellow: "#FFD21F", white: "#FFFFFF",
  };
  // Peach, the cat from the store screenshots (CatSkin.swift body, mirrored to face right)
  const flip = (r) => [...r].reverse().join("");
  const BODY = [
    "...K......K.............", "..KFK....KFK............", "..KFSKKKKSFKK........KK.", ".KSFFPPFPFFFFK......KTTK",
    ".KFFFFFFFFFFFK......KTTK", "KSFFFFFFFFFFFFKKKK...KtK", "KFFEFFNFFEFFFFPFPFK..KTK", "KFCFFNFNFFCFFFPFPFFKKKtK",
    "KFFFFFFFFFFFFFFFFFFFKTK.", "KFFFFFFFFFFFFFFFFFFFKTK.", "KFFFFFFFFFFFFFFFFFFFFK..", "KSFFFFFFFFFFFFFFFFFFFK..",
    "KSFBBBBBBBBBBBBBBFFFFK..", "KSFBBBBBBBBBBBBBBFFFSK..", ".KSBBBBBBBBBBBBBBFFSK...", "..KSFSSFSFFFFSFSSFSK....",
  ];
  const CAT = BODY.concat(["...KFKKFKKKKKKFKKFK.....", "...KK..KK....KK..KK....."]).map(flip);
  const CAT_WALK = BODY.concat(["...KFKKKKKKKKKFKKKK.....", "...KK........KK........."]).map(flip);
  const CAT_COL = { K: C.outline, F: "#F7C4A0", S: "#E0A07C", P: "#E0A07C", E: "#8B6BC6", N: C.outline, C: "#F69AA8", T: "#F7C4A0", t: "#E0A07C", B: "#FFF0E4" };
  const CLOUD = ["....LLLL....", "..LLWWWWLL..", ".LWWWWWWWWLL", "LWWWWWWWWWWL", "LSSWWWWWWSSL", ".LLLLLLLLLL."];
  const CLOUD_COL = { L: "#2A2E70", W: C.white, S: "#C3E1FA" };
  const CAT_W = 24, CAT_H = 18, GH = 64, TOP = 42, GROW = 62, WALK = 50, ROT = 0.32, SCROLL = 0.4;

  let s = 1, GW = 120, pillars = [], cam = 0, camFrom = 0, camTo = 0, t = 0;
  let phase = "idle", stick = 0, angle = 0, clock = 0, heroX = 0, heroY = 0, vy = 0;
  let score = 0, best = 0, bonus = 0, walkTo = 0, landed = null, base = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  function addPillar() {
    const last = pillars[pillars.length - 1];
    const x = last ? last.x + last.w + Math.round(rand(12, Math.min(52, GW * 0.42))) : 0;
    pillars.push({ x, w: last ? Math.round(rand(16, 34)) : 30 });
  }
  function reset() {
    pillars = []; addPillar(); while (pillars[pillars.length - 1].x < GW * 2) addPillar();
    base = pillars[0]; cam = camFrom = camTo = 0; score = 0; phase = "idle"; stick = 0; angle = 0; vy = 0;
    heroX = base.x + base.w - CAT_W + 2; heroY = TOP;
  }
  const nextOf = (p) => pillars[pillars.indexOf(p) + 1];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    s = Math.max(2, Math.floor((canvas.clientHeight * dpr) / GH));
    canvas.height = GH * s;
    canvas.width = Math.ceil((canvas.clientWidth * dpr) / s) * s;
    GW = canvas.width / s;
    if (!pillars.length || (phase === "idle" && score === 0)) reset();
  }

  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) * s, Math.round(y) * s, w * s, h * s); };
  const text = (str, x, y, c) => eachRun(str, (rx, ry, rw) => px(x + rx, y + ry, rw, 1, c));

  function draw() {
    px(0, 0, GW, GH, C.sky);
    C.bands.forEach((c, i) => px(0, 22 + i * 3, GW, 3, c));
    const span = GW + 40;
    [[10, 6], [47, 13], [83, 4], [121, 10]].forEach(([cx, cy]) => {
      const x = ((cx * 3 - cam * 0.2) % span + span) % span - 20;
      CLOUD.forEach((row, y) => { for (let i = 0; i < row.length; i++) if (row[i] !== ".") px(x + i, cy + y, 1, 1, CLOUD_COL[row[i]]); });
    });
    px(0, 31, GW, 2, C.bank);
    for (let x = -(Math.floor(cam * 0.3) % 9); x < GW; x += 9) { px(x, 32, 6, 2, C.treesLight); px(x + 2, 31, 3, 1, C.treesLight); }
    px(0, 34, GW, 2, C.trees);
    px(0, 36, GW, GH - 36, C.water);
    for (let x = -(Math.floor(cam * 0.6) % 23); x < GW; x += 23) { px(x + 3, 39, 4, 1, C.waterLight); px(x + 14, 47, 5, 1, C.waterLight); }
    px(0, TOP + 4, GW, GH, C.waterDeep);

    const target = nextOf(base);
    for (const p of pillars) {
      const x = p.x - cam;
      if (x > GW || x + p.w < 0) continue;
      px(x - 1, TOP, p.w + 2, GH, C.outline);
      px(x, TOP + 1, p.w, GH, C.pink);
      px(x, TOP + 1, p.w, 1, C.pinkLight);
      for (let y = TOP + 4, row = 0; y < GH; y += 3, row++) {
        px(x, y, p.w, 1, C.pinkDark);
        for (let bx = (row % 2) * 3 + 1; bx < p.w; bx += 6) px(x + bx, y + 1, 1, 2, C.pinkDark);
      }
      if (p === target && phase !== "walking") px(x + Math.floor(p.w / 2) - 1, TOP, 2, 1, C.marker);
    }

    // stick: pivot at the base pillar's right edge, angle 0 = up, π/2 = flat
    if (stick > 0) {
      const ox = base.x + base.w - 1 - cam;
      for (let i = 0; i < Math.round(stick); i++) px(ox + Math.sin(angle) * i, TOP - 1 - Math.cos(angle) * i, 1, 1, C.stick);
    }

    const sprite = phase === "walking" && Math.floor(clock * 8) % 2 ? CAT_WALK : CAT;
    sprite.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== ".") px(heroX - cam + x, heroY - CAT_H + y, 1, 1, CAT_COL[row[x]]); });

    const label = String(score).padStart(3, "0"), bw = textWidth(label) + 6, bx = Math.floor((GW - bw) / 2);
    px(bx - 1, 3, bw + 2, 13, C.badge); px(bx, 4, bw, 11, C.navy); text(label, bx + 3, 6, C.white);
    if (bonus > 0) text("Perfect +2", Math.round(heroX - cam - 4), heroY - CAT_H - 10, C.yellow);
    if (phase === "idle" && score === 0) text(best ? `Best ${best}` : "Hold to build", Math.round(heroX - cam) + CAT_W + 4, 18, C.navy);
  }

  function step(dt) {
    clock += dt; bonus = Math.max(0, bonus - dt);
    if (phase === "growing") stick = Math.min(stick + GROW * dt, GW - 8);
    else if (phase === "rotating") {
      t += dt; angle = Math.min(1, t / ROT) ** 2 * Math.PI / 2;
      if (t >= ROT) {
        const tip = base.x + base.w - 1 + stick, nx = nextOf(base);
        landed = nx && tip >= nx.x && tip <= nx.x + nx.w ? nx : null;
        walkTo = landed ? landed.x + landed.w - CAT_W + 2 : tip - CAT_W / 2;
        if (landed && Math.abs(tip - (landed.x + landed.w / 2)) <= 1.5) { score += 2; bonus = 1; }
        else if (landed) score += 1;
        phase = "walking";
      }
    } else if (phase === "walking") {
      heroX = Math.min(walkTo, heroX + WALK * dt);
      if (heroX >= walkTo) {
        if (landed) {
          stick = 0; angle = 0; base = landed; phase = "scrolling"; t = 0; camFrom = cam; camTo = landed.x - 4;
          while (pillars[pillars.length - 1].x < camTo + GW * 2) addPillar();
        } else { phase = "falling"; vy = 0; t = 0; }
      }
    } else if (phase === "scrolling") {
      t += dt; const k = Math.min(1, t / SCROLL); cam = camFrom + (camTo - camFrom) * (1 - (1 - k) ** 3);
      if (k >= 1) { phase = "idle"; pillars = pillars.filter((p) => p.x + p.w > cam - 4); }
    } else if (phase === "falling") {
      t += dt; vy += 400 * dt; heroY += vy * dt;
      if (t > 1.1) { best = Math.max(best, score); reset(); }
    }
  }

  let last = 0, running = false;
  function frame(now) {
    step(Math.min((now - last) / 1000, 1 / 20)); last = now; draw();
    if (phase !== "idle" || bonus > 0) requestAnimationFrame(frame); else running = false;
  }
  const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };

  function press() { if (phase === "idle") { phase = "growing"; stick = 0; angle = 0; kick(); } }
  function release() { if (phase === "growing") { phase = "rotating"; t = 0; } }
  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); press(); });
  ["pointerup", "pointercancel"].forEach((n) => canvas.addEventListener(n, release));
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("keydown", (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (!e.repeat) press(); } });
  canvas.addEventListener("keyup", (e) => { if (e.code === "Space" || e.code === "Enter") release(); });

  new ResizeObserver(() => { resize(); draw(); }).observe(canvas);
})();
