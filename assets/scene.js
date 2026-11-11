// Fatty Cat site: the hero scene. A self-playing loop of the game: the cat grows a stick, crosses,
// jumps a charging dog, jumps a bird, and keeps going. Art, colours and numbers are ported from
// the app (Sprites, CatSkin, Backdrop, BackdropPainter, PixelRenderer.pillar, GameViewModel Rules).
(() => {
  "use strict";
  const canvas = document.getElementById("scene");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GH = 113, GROUND = 97, HORIZON = 77;      // logical rows, pillar top, waterline
  const CAT_W = 24, CAT_H = 18, DOG_W = 24, BIRD_W = 16;
  const GROW = 62, WALK = 50, ROT = 0.32, SCROLL = 0.4;
  const JUMP_T = 0.72, JUMP_H = 32, DOG_SPEED = 64, BIRD_SPEED = 92;

  // ── Palette ───────────────────────────────────────────────────────
  const P = {
    sky: "#62A6EC", bands: ["#72B1EF", "#86BEF2", "#9ECCF5"], bank: "#BCDDF8", bankLight: "#E6F3FD",
    town: "#86A8D2", townWindow: "#A9C6E6", trees: "#3C8C6E", treesLight: "#5CAD84",
    water: "#3E86C8", waterDeep: "#2A66A4", waterLight: "#7CBCEC", outline: "#15151C", marker: "#FF3B3B",
    white: "#FFFFFF", navy: "#1B1E5E", cloudOutline: "#2A2E70", cloudShade: "#C3E1FA",
    grassLight: "#A6DE6E", grass: "#62B451", grassDark: "#3B8A42", soil: "#6B4A2E",
    stone: "#C2AA86", stoneLight: "#E4D3B2", stoneShade: "#977F62", stoneMossy: "#9DAA6E", mortar: "#5C4635",
    stickLight: "#D9A066", stickBody: "#A8652F", stickShade: "#5A3216", stickEnd: "#F2D3A0", vine: "#3E9A4E",
    yellow: "#FFD21F", yellowLight: "#FFE86A",
  };

  // ── Sprites ───────────────────────────────────────────────────────
  const mk = (rows, pal, flip) => {
    const w = Math.max(...rows.map((r) => r.length));
    const c = document.createElement("canvas");
    c.width = w; c.height = rows.length;
    const x = c.getContext("2d");
    rows.forEach((row, y) => {
      const r = flip ? [...row.padEnd(w, ".")].reverse() : [...row];
      r.forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } });
    });
    return c;
  };
  const darken = (hex, f) => "#" + [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f)).toString(16).padStart(2, "0")).join("");

  // Calico, the cat from the store art: shared body, fur mask stamped over fur pixels only.
  const BODY = [
    "...K......K.............", "..KFK....KFK............", "..KFSKKKKSFKK........KK.", ".KSFFPPFPFFFFK......KTTK",
    ".KFFFFFFFFFFFK......KTTK", "KSFFFFFFFFFFFFKKKK...KtK", "KFFEFFNFFeFFFFPFPFK..KTK", "KFCFFNFNFFCFFFPFPFFKKKtK",
    "KFFFFFFFFFFFFFFFFFFFKTK.", "KFFFFFFFFFFFFFFFFFFFKTK.", "KFFFFFFFFFFFFFFFFFFFFK..", "KSFFFFFFFFFFFFFFFFFFFK..",
    "KSFFFFFFFFFFFFFFFFFFSK..", "KSFFFFFFFFFFFFFFFFFFSK..", ".KSFFFFFFFFFFFFFFFFSK...", "..KSFSSFSFFFFSFSSFSK....",
  ];
  const MASK = [
    "..11111.................", "..11111.................", "..11111.................", "..11111.............2222",
    "..11111.............2222", "....................2222", "..............2222222222", "..............2222222222",
    "..............2222222222", "..............2222222222", "..............222222....", "....11111...............",
    "....11111...............", "....11111...............", "....11111...............",
  ];
  const stamp = (rows) => rows.map((row, y) => {
    const m = MASK[y]; if (!m) return row;
    return [...row].map((ch, x) => {
      const fur = "FPT".includes(ch), shade = ch === "S" || ch === "t";
      if (!fur && !shade) return ch;
      const s = m[x] || ".";
      return s === "1" ? (fur ? "A" : "a") : s === "2" ? (fur ? "B" : "b") : ch;
    }).join("");
  });
  const FUR = "#F7EFE2", PAT = "#E98A34", SEC = "#3B3239";
  const CAT_PAL = {
    K: P.outline, N: P.outline, F: FUR, S: darken(FUR, 0.88), T: FUR, t: darken(FUR, 0.88), P: FUR, E: "#7FB77E", e: "#7FB77E",
    C: "#F6B0C0", A: PAT, a: darken(PAT, 0.88), B: SEC, b: darken(SEC, 0.88),
  };
  const CAT_STAND = mk(stamp(BODY.concat(["...KFKKFKKKKKKFKKFK.....", "...KK..KK....KK..KK....."])), CAT_PAL, true);
  const CAT_WALK_S = mk(stamp(BODY.concat(["...KFKKKKKKKKKFKKKK.....", "...KK........KK........."])), CAT_PAL, true);

  const DOG_PAL = { K: P.outline, F: "#E8AE68", S: "#C98A45", W: "#FFF2DD", N: "#3A2A22", E: P.outline, T: "#E0566A" };
  const DOG_A = mk([
    "........................", "......................KK", "....KKKKKK...........KFF", "...KFFFFFSK..........KFF",
    "..KFFFFFSSSKKKK.....KFFK", ".KFFFFFFSSSFFFFKKKK.KFFK", ".KFFEEFFSSSSFFFFFFFKKFFK", ".KFFFFFFSSSSFFFFFFFFFFFK",
    "KNFFFFFFSSSFFFFFFFFFFFK.", "KNWWWFFFSSSFFFFFFFFFFFK.", "KWWWWFFFFFFFFFFFFFFFFFK.", "KWWWWFFFFFWWFFFFFFFFFFK.",
    ".KTTKKFFWWWWWWFFFFFFFK..", ".KTK..KFWWWWWWFFFFFFKK..", "..K...KSSKWWSSSSSSSKFFK.", "......KSSKFFKKKKKSSKFFK.",
    "......KSSKFFK...KSSKFFK.", ".......KK.KK.....KK.KK..",
  ], DOG_PAL);
  const DOG_B = mk([
    "........................", "......................KK", "....KKKKKK...........KFF", "...KFFFFFSK..........KFF",
    "..KFFFFFSSSKKKK.....KFFK", ".KFFFFFFSSSFFFFKKKK.KFFK", ".KFFEEFFSSSSFFFFFFFKKFFK", ".KFFFFFFSSSSFFFFFFFFFFFK",
    "KNFFFFFFSSSFFFFFFFFFFFK.", "KNWWWFFFSSSFFFFFFFFFFFK.", "KWWWWFFFFFFFFFFFFFFFFFK.", "KWWWWFFFFFWWFFFFFFFFFFK.",
    ".KTTKKFFWWWWWWFFFFFFFK..", ".KTK.KKSWWWWWWFFFSSFFFKK", "..K.KSSSFSWWSSSSSKSSSFFF", "...KSSKFFKKKKKKKK.KKSSKF",
    "..KSSKFFK...........KSSK", "...KK.KK.............KK.",
  ], DOG_PAL);

  const BIRD_PAL = { K: P.outline, R: "#E0566A", r: "#AA3248", O: "#FF9D78", Y: P.yellow, W: "#FFF2DD", E: P.outline };
  const BIRD_UP = mk([
    ".........KrK....", "...KK....KrK....", "..KRrK..KrOrK...", ".KRRRRK.KrOrrK..", "KRRWERRKrOOOrKKK", "YYRRRRRrrOOOOrrr",
    "YYRRRRRRRRRRRrrK", "KKRRRRRRRRRRRRrK", "..KKRRRRRRRRRrrK", "....KWWWWRRRKKKr", ".....KKKKKKK...K", "................",
  ], BIRD_PAL);
  const BIRD_DOWN = mk([
    "................", "...KK...........", "..KRrK..........", ".KRRRRK.KK......", "KRRWERRKRRKKK.KK", "YYRRRRRRRRRRRKrr",
    "YYRRRRRRRRRRRrrK", "KKRRRRRRRRRRRRrK", "..KKRRRrrOOOOrrK", "....KWWWrrOOrKKr", ".....KKKKrrrK..K", ".........KrK....",
  ], BIRD_PAL);
  const WARN = mk(["...KKK...", "..KYYYK..", "..KYKYK..", ".KYYKYYK.", ".KYYKYYK.", "KYYYYYYYK", "KYYYKYYYK", "KKKKKKKKK"], { K: P.outline, Y: P.yellow });
  const ALERT = mk(["#", "#", "#", "#", ".", "#"], { "#": P.yellowLight });

  const CLOUD_PAL = { W: P.white, S: P.cloudShade, L: P.cloudOutline };
  const CLOUD = mk([
    ".....LLLL.......", "....LWWWWL......", "...LWWWWWWL.LL..", "..LWWWWWWWWLWWL.", ".LWWWWWWWWWWWWWL",
    "LWWWWWWWWWWWWWWL", "LWWWWWWWWWWWWWWL", "LWSWWWWWSSWWWWSL", "LSSSSSSSSSSSSSSL", ".LLLLLLLLLLLLLL.",
  ], CLOUD_PAL);
  const CLOUD_S = mk([
    "...LLLL....", "..LWWWWL...", ".LWWWWWWLL.", "LWWWWWWWWWL", "LWWWWWWWWWL", "LSSWWWWSSSL", ".LLLLLLLLL.",
  ], CLOUD_PAL);
  const BALLOON = mk([
    "...RRYRR...", ".RRRRYRRRr.", "RWRRRYRRRrr", "RWRRRYRRRrr", "RRRRRYRRRrr", "RRRRRYRRRrr", ".RRRRYRRRr.", ".RRRRYRRRr.",
    "..RRRYRRr..", "...RRYRr...", "....b.b....", "....b.b....", "....BBB....", "....BBB....",
  ], { R: "#E8445A", r: "#B02F46", W: "#FF9FB0", Y: P.yellow, b: "#8C6A4A", B: P.stickBody });
  const BOAT = mk([
    "....m....", "....mS...", "...smSS..", "..ssmSSS.", ".sssmSSSS", "....m....", "HHHHHHHHH", ".mmmmmmm.",
  ], { S: P.white, s: P.cloudShade, H: "#C0463A", m: P.cloudOutline });
  const LIGHTHOUSE = mk([
    "...L...", "..KLK..", ".KKKKK.", "..WWW..", "..RRR..", "..WWW..", "..RRR..", ".WWWWW.", ".RRRRR.", ".WWWWW.", "KKKKKKK",
  ], { W: "#F4F1E6", R: "#D8414F", K: P.cloudOutline, L: P.yellowLight });
  const BIRD_FAR = [mk(["#...#", ".#.#.", "..#.."], { "#": P.navy }), mk(["..#..", ".#.#.", "#...#"], { "#": P.navy })];

  // ── Pillars: grass-topped sandstone, ported from PixelRenderer.pillar ──
  const h32 = (n) => { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); return (n ^ (n >>> 15)) >>> 0; };
  function pillarCanvas(w, seed) {
    const c = document.createElement("canvas");
    c.width = w; c.height = GH - GROUND;
    const x = c.getContext("2d");
    const f = (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(px, py, pw, ph); };
    f(0, 0, w, 1, P.outline); f(0, 4, w, 1, P.outline); f(0, 1, 1, 3, P.outline); f(w - 1, 1, 1, 3, P.outline);
    f(1, 1, w - 2, 1, P.grassLight); f(1, 2, w - 2, 1, P.grass); f(1, 3, w - 2, 1, P.soil);
    for (let i = 0; i < w - 2; i++) {
      if (i % 4 === 2) f(1 + i, 1, 1, 1, P.grass);
      if (i % 3 !== 1) f(1 + i, 3, 1, 1, P.grassDark);
    }
    const inset = w >= 14 ? 2 : 1, sx = inset, sw = w - inset * 2, top = 5, sh = GH - GROUND - top;
    f(sx, top, 1, sh, P.outline); f(sx + sw - 1, top, 1, sh, P.outline);
    const bx = sx + 1, bw = sw - 2, right = bx + bw;
    f(bx, top, bw, sh, P.stone);
    const mortar = [], light = [], shade = [], mossy = [], darker = [];
    for (let row = 0, ry = top; ry < top + sh; row++, ry += 5) {
      const rows = Math.min(4, top + sh - ry);
      for (let stx = bx - (row % 2 ? 4 : 0); stx < right; stx += 8) {
        const l = Math.max(stx, bx), r = Math.min(stx + 7, right);
        if (l < r) {
          const roll = h32(row * 32 + (stx - bx + 8) + seed * 977) % 8;
          if (roll === 0) mossy.push([l, ry, r - l, rows]); else if (roll === 1) darker.push([l, ry, r - l, rows]);
          light.push([l, ry, r - l, 1]);
          if (stx >= bx && rows > 1) light.push([stx, ry + 1, 1, rows - 2]);
          if (rows === 4 && Math.max(stx + 1, bx) < r) shade.push([Math.max(stx + 1, bx), ry + 3, r - Math.max(stx + 1, bx), 1]);
        }
        const mx = stx + 7;
        if (mx >= bx && mx < right) mortar.push([mx, ry, 1, rows]);
      }
      if (top + sh - ry > 4) mortar.push([bx, ry + 4, bw, 1]);
    }
    const paint = (list, col) => { x.fillStyle = col; list.forEach((r) => x.fillRect(...r)); };
    paint(mossy, P.stoneMossy); paint(darker, P.stoneShade); paint(light, P.stoneLight); paint(shade, P.stoneShade);
    if (bw > 3) f(right - 1, top, 1, sh, P.stoneShade);
    paint(mortar, P.mortar);
    f(bx, top, bw, 1, P.mortar);
    return c;
  }

  // ── Backdrop generators, ported from Backdrop.swift ───────────────
  const M64 = (1n << 64n) - 1n;
  const hashCache = new Map();
  function hash(index, seed) {
    const key = seed + ":" + index;
    let v = hashCache.get(key);
    if (v === undefined) {
      v = (BigInt(index) * 0x9E3779B97F4A7C15n + seed) & M64;
      v = ((v ^ (v >> 30n)) * 0xBF58476D1CE4E5B9n) & M64;
      v = ((v ^ (v >> 27n)) * 0x94D049BB133111EBn) & M64;
      v = v ^ (v >> 31n);
      if (hashCache.size > 4000) hashCache.clear();
      hashCache.set(key, v);
    }
    return v;
  }
  const wrap = (v, span) => v - Math.floor(v / span) * span;
  const RIDGE_CLOUD = { spacing: 13, minR: 10, maxR: 18, base: 8, flatten: 0.85, parallax: 0.03, drift: 0.6, seed: 0x7C1D3A55n };
  const RIDGE_TREE = { spacing: 6, minR: 3, maxR: 5, base: 2, flatten: 1, parallax: 0.32, drift: 0, seed: 0x2B9E0F17n };

  function ridge(r, gw, cam, t, body, lite, litRows, shadedRows) {
    const heights = new Array(gw).fill(r.base), lit = new Array(gw).fill(false);
    const offset = cam * r.parallax + t * r.drift, reach = r.maxR + r.spacing;
    const first = Math.floor((offset - reach) / r.spacing), last = Math.ceil((offset + gw + reach) / r.spacing);
    for (let i = first; i <= last; i++) {
      const n = hash(i, r.seed);
      const radius = r.minR + Number(n % BigInt(r.maxR - r.minR + 1));
      const jitter = Number((n >> 8n) % BigInt(r.spacing)) - Math.trunc(r.spacing / 2);
      const cx = Math.round(i * r.spacing + jitter - offset);
      for (let d = -radius; d <= radius; d++) {
        const col = cx + d;
        if (col < 0 || col >= gw) continue;
        const h = r.base + Math.round(Math.sqrt(radius * radius - d * d) * r.flatten);
        if (h > heights[col]) { heights[col] = h; lit[col] = d < 0; }
      }
    }
    for (let x = 0; x < gw; x++) {
      const h = heights[x], top = HORIZON - h, rim = Math.min(lit[x] ? litRows : shadedRows, h);
      if (rim > 0) { ctx.fillStyle = lite; ctx.fillRect(x * S, top * S, S, rim * S); }
      ctx.fillStyle = body; ctx.fillRect(x * S, (top + rim) * S, S, (h - rim) * S);
    }
  }

  const SKY_SEED = 0x3D7A91C3n, SLOT = 9;
  const buildingCache = new Map();
  function building(index) {
    let b = buildingCache.get(index);
    if (b !== undefined) return b;
    const n = hash(index, SKY_SEED), kind = Number(n % 8n);
    if (kind === 0) b = null;
    else {
      const dx = Number((n >> 4n) % 3n);
      const spire = kind === 1;
      const width = spire ? 4 + Number((n >> 8n) % 2n) : 6 + Number((n >> 8n) % 6n);
      const height = spire ? 14 + Number((n >> 12n) % 5n) : 6 + Number((n >> 12n) % 10n);
      const pitched = !spire && (n >> 20n) % 3n === 0n;
      const top = HORIZON - height, walls = [[0, top, width, height]], windows = [];
      if (spire) walls.push([Math.trunc(width / 2), top - 3, 1, 3]);
      else if (pitched) for (let inset = 1; inset * 2 < width; inset++) walls.push([inset, top - inset, width - inset * 2, 1]);
      else walls.push([-1, top, width + 2, 1]);
      for (let row = 0, y = top + 2; y < HORIZON - 4; y += 3, row++) {
        for (let col = 0, x = 1; x < width - 1; x += 2, col++) {
          if (hash(row * 16 + col, n) % 100n < 55n) windows.push([x, y, 1, 1]);
        }
      }
      b = { dx, walls, windows };
    }
    if (buildingCache.size > 500) buildingCache.clear();
    buildingCache.set(index, b);
    return b;
  }
  function town(gw, cam) {
    const offset = cam * 0.12;
    const first = Math.floor((offset - 16) / SLOT), last = Math.ceil((offset + gw) / SLOT);
    for (let i = first; i <= last; i++) {
      const b = building(i); if (!b) continue;
      const x0 = Math.round(i * SLOT - offset) + b.dx;
      ctx.fillStyle = P.town; b.walls.forEach(([x, y, w, h]) => ctx.fillRect((x0 + x) * S, y * S, w * S, h * S));
      ctx.fillStyle = P.townWindow; b.windows.forEach(([x, y, w, h]) => ctx.fillRect((x0 + x) * S, y * S, w * S, h * S));
    }
  }

  // ── Canvas helpers ────────────────────────────────────────────────
  let S = 4, GW = 120, U = 4;
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) * S, Math.round(y) * S, w * S, h * S); };
  const spr = (c, x, y) => ctx.drawImage(c, Math.round(x) * S, Math.round(y) * S, c.width * S, c.height * S);
  const dither = (y, step, phase, c) => { if (y < 0) return; ctx.fillStyle = c; for (let x = phase; x < GW; x += step) ctx.fillRect(x * S, y * S, S, S); };

  const CLOUDS = [[0.05, 5, CLOUD, 1.3], [0.28, 14, CLOUD_S, 0.9], [0.52, 3, CLOUD, 1.6], [0.74, 12, CLOUD_S, 1.1], [0.9, 7, CLOUD, 1.4]];

  function paintBackdrop(t, cam) {
    rect(0, 0, GW, GH, P.sky);
    P.bands.forEach((c, i) => {
      const y = HORIZON - 15 * (P.bands.length - i);
      rect(0, y, GW, HORIZON - y, c);
      dither(y - 2, 4, 0, c); dither(y - 1, 2, 1, c);
    });
    ridge(RIDGE_CLOUD, GW, cam, t, P.bank, P.bankLight, 3, 1);
    const span = GW + 60;
    CLOUDS.forEach(([f, y, c, v]) => spr(c, wrap(f * span + t * v - cam * 0.2, span) - 30, y));
    // balloon and a far flock
    const bs = GW + BALLOON.width * 2;
    spr(BALLOON, Math.round(wrap(GW * 0.55 + t * 1.6 - cam * 0.1, bs)) - BALLOON.width, 23 + Math.round(Math.sin(t * 0.9) * 1.5));
    const lead = Math.round(wrap(GW * 0.2 + t * 7 - cam * 0.15, GW + 40)) - 20, glide = Math.round(Math.sin(t * 0.7) * 3);
    [[0, 0], [-7, 3], [-13, -1]].forEach(([dx, dy], i) => spr(BIRD_FAR[(Math.floor(t * 5) + i) % 2], lead + dx, 3 + glide + dy));
    town(GW, cam);
    ridge(RIDGE_TREE, GW, cam, t, P.trees, P.treesLight, 2, 0);
    const off = cam * RIDGE_TREE.parallax;
    for (let i = Math.floor((off - 103) / 170); i <= Math.ceil((off + GW) / 170); i++) {
      const x = Math.round(i * 170 + 96 - off);
      if (x + 7 >= -12 && x < GW + 12) spr(LIGHTHOUSE, x, HORIZON - LIGHTHOUSE.height);
    }
    // river
    rect(0, HORIZON, GW, 24, P.water); rect(0, HORIZON + 24, GW, GH - HORIZON - 24, P.waterDeep);
    ctx.fillStyle = P.waterLight;
    for (let y = HORIZON + 3, i = 0; y < HORIZON + 40; y += 5 + i, i++) {
      const step = 26 + i * 5, width = 4 + (i % 3), drift = Math.round(t * (4 + i) + i * 11);
      for (let x = (((drift % step) + step) % step) - step; x < GW; x += step) ctx.fillRect(Math.max(0, x) * S, y * S, width * S, S);
    }
    // sailboats
    const sp = GW + BOAT.width * 2;
    [[0.7, 2.2, 3], [0.2, -1.5, 7]].forEach(([start, speed, depth], i) => {
      const x = Math.round(wrap(GW * start + t * speed - cam * 0.45, sp)) - BOAT.width;
      spr(BOAT, x, HORIZON + depth - BOAT.height + ((Math.floor(t * 1.6) + i) % 2));
    });
  }

  // ── The self-playing game ─────────────────────────────────────────
  let seed = 7;
  const rnd = (a, b) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return a + (seed / 4294967296) * (b - a); };
  let pillars, made, base, cam, camFrom, camTo, phase, pt, stick, angle, wantLen, heroX, walkTo, jt, dog, bird, warn, clock;

  function addPillar() {
    const last = pillars[pillars.length - 1], i = made++;
    const kind = i % 3 === 0 ? "dog" : i % 3 === 1 ? "bird" : "plain";
    const w = Math.round(kind === "dog" ? rnd(32, 38) : rnd(22, 34));
    const gap = Math.round(rnd(44, Math.min(60, Math.max(46, GW * 0.4))));
    pillars.push({ x: last.x + last.w + gap, w, kind, canvas: pillarCanvas(w, i + 1) });
  }
  const next = () => pillars[pillars.indexOf(base) + 1];
  const dogHomeX = (p) => p.x + Math.max(2, Math.round((p.w - DOG_W) / 2));
  function reset() {
    cam = camFrom = camTo = 0; phase = "idle"; pt = 0; stick = 0; angle = 0; jt = -1;
    dog = null; bird = null; warn = 0; clock = 0;
    pillars = [{ x: 10, w: 34, kind: "plain", canvas: pillarCanvas(34, 99) }]; made = 1;
    while (pillars[pillars.length - 1].x < GW * 2.5) addPillar();
    base = pillars[0]; heroX = base.x + base.w - CAT_W + 2;
  }
  const catScreen = () => heroX - cam;
  const blocked = () => warn > 0 || (dog && dog.state !== "flee") || (bird && bird.x + BIRD_W > catScreen());

  function startWalk() {
    const n = next();
    walkTo = n.x + n.w - CAT_W + 2; phase = "walking"; pt = 0;
    if (n.kind === "dog") dog = { x: dogHomeX(n), state: "alert", t: 0.3, pillar: n };
    if (n.kind === "bird") warn = 0.95;
  }

  function step(dt) {
    clock += dt; pt += dt;
    if (warn > 0) { warn -= dt; if (warn <= 0) bird = { x: GW + 2, y: GROUND - 22 }; }
    if (bird) { bird.x -= BIRD_SPEED * dt; if (bird.x < -BIRD_W - 4) bird = null; }
    if (dog) {
      if (dog.state === "alert") { dog.t -= dt; if (dog.t <= 0) dog.state = "charge"; }
      else {
        dog.x -= DOG_SPEED * dt;
        if (dog.state === "charge" && dog.x + DOG_W - 4 < heroX + 2) dog.state = "flee";
        if (dog.x - cam < -DOG_W - 4) dog = null;
      }
    }
    // the cat jumps whatever is coming, unless it is growing a stick
    if (jt < 0 && phase !== "growing" && phase !== "rotating") {
      // start the hop so the enemy is under the cat for the middle of the arc, whatever the closing speed
      const move = phase === "walking" ? WALK : 0;
      if (dog && dog.state === "charge" && dog.x - (heroX + CAT_W - 2) <= (DOG_SPEED + move) * 0.1) jt = 0;
      else if (bird && bird.x > catScreen() && bird.x - (catScreen() + CAT_W - 2) <= (BIRD_SPEED + move) * 0.12) jt = 0;
    }
    if (jt >= 0) { jt += dt; if (jt >= JUMP_T) jt = -1; }

    if (phase === "idle") {
      if (pt > 0.5 && !blocked() && jt < 0) {
        phase = "growing"; pt = 0; stick = 0; angle = 0;
        const n = next(); wantLen = n.x - (base.x + base.w - 1) + rnd(3, n.w - 3);
      }
    } else if (phase === "growing") {
      stick += GROW * dt;
      if (stick >= wantLen) { stick = wantLen; phase = "rotating"; pt = 0; }
    } else if (phase === "rotating") {
      angle = Math.min(1, pt / ROT) ** 2 * Math.PI / 2;
      if (pt >= ROT) startWalk();
    } else if (phase === "walking") {
      heroX = Math.min(walkTo, heroX + WALK * dt);
      if (heroX >= walkTo) { phase = "arrived"; pt = 0; }
    } else if (phase === "arrived") {
      if (pt > 0.25 && !blocked()) {
        base = next(); stick = 0; angle = 0; phase = "scrolling"; pt = 0; camFrom = cam; camTo = heroX - 36;
        while (pillars[pillars.length - 1].x < camTo + GW * 2.5) addPillar();
      }
    } else if (phase === "scrolling") {
      const k = Math.min(1, pt / SCROLL); cam = camFrom + (camTo - camFrom) * (1 - (1 - k) ** 3);
      if (k >= 1) { phase = "idle"; pt = 0; pillars = pillars.filter((p) => p.x + p.w > cam - 12 || p === base); }
    }
  }

  function drawWorld() {
    const aiming = phase === "idle" || phase === "growing" || phase === "rotating";
    const target = aiming ? next() : null;
    for (const p of pillars) {
      const x = p.x - cam;
      if (x > GW || x + p.w < 0) continue;
      ctx.drawImage(p.canvas, Math.round(x) * S, GROUND * S, p.w * S, (GH - GROUND) * S);
      if (p === target) {
        const cx = Math.round(x) + Math.floor(p.w / 2);
        rect(cx - 2, GROUND + 1, 1, 3, P.white); rect(cx + 2, GROUND + 1, 1, 3, P.white); rect(cx - 1, GROUND + 1, 3, 3, P.marker);
      }
      // the dog waits on its pillar until the bridge lands
      if (p.kind === "dog" && !(dog && dog.pillar === p) && p !== base && !p.dogGone && (aiming && p === target)) spr(DOG_A, dogHomeX(p) - cam, GROUND - 18);
    }
    // stick: log with a vine, pivot on the base pillar's right edge
    if (stick > 0) {
      const ox = base.x + base.w - 1 - cam, len = Math.round(stick), vertical = angle < Math.PI / 4;
      for (let i = 0; i < len; i++) {
        const x = Math.round(ox + Math.sin(angle) * i), y = Math.round(GROUND - 2 - Math.cos(angle) * i);
        const end = i === len - 1, vine = i % 5 === 2;
        const L = end ? P.stickEnd : P.stickLight, B = vine ? P.vine : end ? P.stickEnd : P.stickBody;
        if (vertical) { rect(x - 1, y, 1, 1, L); rect(x, y, 1, 1, B); rect(x + 1, y, 1, 1, P.stickShade); }
        else { rect(x, y - 1, 1, 1, L); rect(x, y, 1, 1, B); rect(x, y + 1, 1, 1, P.stickShade); }
      }
    }
    if (dog) {
      const f = dog.state === "alert" ? DOG_A : Math.floor(clock * 10) % 2 ? DOG_B : DOG_A;
      spr(f, dog.x - cam, GROUND - 18);
      if (dog.state === "alert") spr(ALERT, dog.x - cam + 3, GROUND - 26);
    }
    if (warn > 0 && Math.floor(clock * 6) % 2 === 0) spr(WARN, GW - 14, GROUND - 28);
    if (bird) spr(Math.floor(clock * 8) % 2 ? BIRD_DOWN : BIRD_UP, bird.x, bird.y);
    let lift = 0;
    if (jt >= 0) { const k = jt / JUMP_T; lift = JUMP_H * 4 * k * (1 - k); }
    const f = phase === "walking" && jt < 0 && Math.floor(clock * 8) % 2 ? CAT_WALK_S : CAT_STAND;
    spr(f, heroX - cam, GROUND - CAT_H - lift);
  }

  function draw() { paintBackdrop(clock, cam); drawWorld(); }

  // ── Sizing and loop ───────────────────────────────────────────────
  function resize() {
    U = parseFloat(getComputedStyle(hero).getPropertyValue("--u")) || 4;
    const dpr = window.devicePixelRatio || 1;
    GW = Math.ceil(hero.clientWidth / U);
    S = Math.max(1, Math.round(U * dpr));
    canvas.width = GW * S; canvas.height = GH * S;
    canvas.style.width = (GW * S) / dpr + "px"; canvas.style.height = (GH * S) / dpr + "px";
    ctx.imageSmoothingEnabled = false;
    reset();
    if (reduceMotion) for (let i = 0; i < 160; i++) step(1 / 30);
    draw();
  }

  let last = 0, raf = 0, visible = true;
  function frame(now) { raf = 0; step(Math.max(0, Math.min((now - last) / 1000, 1 / 20))); last = now; draw(); schedule(); }
  function schedule() { if (!raf && visible && !document.hidden && !reduceMotion) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; schedule(); }).observe(canvas);
  document.addEventListener("visibilitychange", schedule);
  resize(); schedule();
})();
