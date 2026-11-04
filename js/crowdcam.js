/* ==========================================================================
   Vantage FC - crowdcam.js  (V1.34.8)
   --------------------------------------------------------------------------
   The "Crowd Cam" cutscene, ported from Pixel Striker FC - Crowd Cam.html.
   It plays before the beginning of every half, replacing the old pre-match
   wait and the half-time break screen.

   It is a PURE renderer: the engine owns the clock and calls crowdCamDraw()
   with the elapsed time each frame, so the module keeps no animation state of
   its own (only a cached stadium world + fan layout). The engine draws to its
   own 480x270 canvas, so this draws straight into the passed context.
   ========================================================================== */
(function () {
  "use strict";

  const W = 480, H = 270, WORLD = 1500, S = 2, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  /* ---------- pixel font (3x5) ---------- */
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '.': '000000000000010', '&': '010101010110011' };

  function txt(g, str, x, y, col, s, al, sh) {
    str = String(str).toUpperCase();
    const w = str.length * 4 * s - s;
    x = Math.round(al === 'c' ? x - w / 2 : al === 'r' ? x - w : x); y = Math.round(y);
    for (const pair of sh ? [[sh, s], [col, 0]] : [[col, 0]]) {
      const c = pair[0], o = pair[1];
      g.fillStyle = c; g.beginPath();
      for (let i = 0; i < str.length; i++) {
        const gl = F[str[i]]; if (!gl) continue;
        for (let k = 0; k < 15; k++) if (gl[k] === '1') g.rect(x + o + i * 4 * s + (k % 3) * s, y + o + ((k / 3) | 0) * s, s, s);
      }
      g.fill();
    }
  }

  /* ---------- sprites (upper body only - the stands hide the legs) ---------- */
  function mk(rows, pal) {
    const h = rows.length, w = rows[0].length, Wd = w + 2, Hd = h + 2, c = document.createElement('canvas'); c.width = Wd; c.height = Hd;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + 1, y + 1, 1, 1); } }
    const im = g.getImageData(0, 0, Wd, Hd), d = im.data, so = new Uint8Array(Wd * Hd);
    for (let i = 0; i < Wd * Hd; i++) so[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const i = y * Wd + x; if (so[i]) continue; if ((x > 0 && so[i - 1]) || (x < Wd - 1 && so[i + 1]) || (y > 0 && so[i - Wd]) || (y < Hd - 1 && so[i + Wd])) { d[i * 4] = 18; d[i * 4 + 1] = 14; d[i * 4 + 2] = 24; d[i * 4 + 3] = 255; } }
    g.putImageData(im, 0, 0); return c;
  }
  const BD = ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '..ssss..', '.kkkkkk.', 'skkkkkks', 'skkkkkks', '.kkkkkk.', '.pppppp.'];
  const DN = BD.slice(0, 9);
  const UP = (function () {
    const r = BD.map(s => ('.' + s + '.').split(''));
    for (const i of [6, 7]) { r[i][1] = '.'; r[i][8] = '.'; }
    for (let i = 0; i <= 5; i++) { r[i][1] = i ? 'k' : 's'; r[i][8] = i ? 'k' : 's'; }
    return r.map(a => a.join('')).slice(0, 9);
  })();
  const SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'];
  const HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];
  const EXTRA_KITS = [
    ['#1fa65a', '#0d3b24'], ['#f2c21b', '#222a55'], ['#8a4fd6', '#e9e0ff'],
    ['#f2812b', '#1c1c1c'], ['#2b2b33', '#d5d5d5'], ['#f1f1f1', '#2f6fe4']
  ];
  const SC = new Map();
  function spr(kit, sk, hr, up) {
    const key = kit[0] + kit[1] + sk + hr + up;
    let c = SC.get(key); if (c) return c;
    c = mk(up ? UP : DN, { h: hr, s: sk, e: '#1a1420', k: kit[0], p: kit[1] });
    SC.set(key, c); return c;
  }

  function darken(hex, f) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return '#34425e';
    const n = parseInt(m[1], 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /* ---------- cached world (stadium + fan layout), keyed by team colours ---------- */
  const ROWY = [70, 102, 134, 166, 198];
  let cacheKey = null, world = null, fans = null;

  function build(key, kitHome, kitAway) {
    const c = document.createElement('canvas'); c.width = WORLD; c.height = H; const g = c.getContext('2d');
    const seatHome = darken(kitHome, .42), seatAway = darken(kitAway, .42);
    // roof + tiers
    g.fillStyle = '#0b0e17'; g.fillRect(0, 0, WORLD, H);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(40,55,95,' + (.05 * k).toFixed(2) + ')'; g.fillRect(0, k * 8, WORLD, 8); }
    g.fillStyle = '#05070c'; g.fillRect(0, 0, WORLD, 6);
    for (let x = 0; x < WORLD; x += 75) { g.fillStyle = '#161b28'; g.fillRect(x, 0, 3, 44); g.fillRect(x + 3, 20, 72, 2); }
    ROWY.forEach(function (y, r) {
      g.fillStyle = r & 1 ? '#343a48' : '#2c313e'; g.fillRect(0, y, WORLD, 32);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, y, WORLD, 2);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, y + 30, WORLD, 2);
      for (let x = (r & 1) ? 11 : 1; x < WORLD; x += 21) { g.fillStyle = x < 700 ? seatHome : x >= 1020 ? seatAway : '#34425e'; g.fillRect(x - 8, y + 3, 16, 8); }
    });
    for (let x = 105; x < WORLD; x += 210) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x, 56, 6, 175); }
    g.fillStyle = '#8c93a3'; g.fillRect(0, 230, WORLD, 2); g.fillStyle = '#4a5060'; g.fillRect(0, 232, WORLD, 6);
    const ads = ['PIXEL STRIKER', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE'], ac = ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f'];
    for (let x = 0, i = 0; x < WORLD; x += 110, i++) {
      g.fillStyle = ac[i % 6]; g.fillRect(x, 238, 110, 32);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, 266, 110, 4); g.fillRect(x + 108, 238, 2, 32);
      txt(g, ads[i % 6], x + 55, 248, '#fff', 2, 'c');
    }
    world = c;

    // fans (positions + look are fixed; only the kit colour index is re-mapped)
    fans = [];
    const R = rng(31);
    ROWY.forEach(function (y, r) {
      for (let x = (r & 1) ? 11 : 1; x < WORLD; x += 21) {
        if (R() < .04) continue;
        const home = x < 700, away = x >= 1020;
        const kit = home ? (R() < .93 ? 0 : (R() * 8) | 0) : away ? (R() < .93 ? 1 : (R() * 8) | 0) : (R() * 8) | 0;
        const q = R(), st = q < .36 ? 0 : q < .66 ? 1 : q < .78 ? 2 : q < .86 ? 3 : 4;
        fans.push({ x: x + ((R() * 4) | 0) - 2, y: y, r: r, kit: kit, sk: (R() * 5) | 0, hr: (R() * 6) | 0, st: st, ph: R() * 6.28 });
      }
    });
    cacheKey = key;
  }

  /* ---------- camera shots ---------- */
  const SH = [
    { z: 1, a: [240, 135], b: [1260, 135], d: 1.8 },
    { z: 2, a: [200, 150], b: [560, 128], d: 1.0 },
    { z: 1, a: [1260, 135], b: [760, 135], d: 1.2 },
    { z: 2, a: [1160, 150], b: [1380, 126], d: 0.8 },
    { z: 2, a: [760, 176], b: [430, 160], d: 0.8 }
  ];
  const TOTAL = SH.reduce(function (a, s) { return a + s.d; }, 0);
  const FADE = 0.15;

  function banner(g, x, y, w, text, c1, c2, t) {
    for (let i = 0; i < w; i++) { const o = Math.round(Math.sin(t * 2.4 + i * .05 + x) * 2); g.fillStyle = c1; g.fillRect(x + i, y + o, 1, 24); }
    txt(g, text, x + w / 2, y + 5 + Math.round(Math.sin(t * 2.4 + w * .025 + x) * 2), c2, 3, 'c', '#000');
  }

  function shortName(n, max) {
    n = String(n == null ? '' : n).toUpperCase();
    return n.length > max ? n.slice(0, max) : n;
  }

  /* ---------- main draw ---------- */
  // g      : target 2D context (the PS engine's 480x270 canvas)
  // t      : elapsed seconds since this cutscene began
  // opts   : { home, away, kitHome, kitAway, label, clock, score:[a,b], tRemain, excited }
  function crowdCamDraw(g, t, opts) {
    opts = opts || {};
    t = t || 0;
    const kitHome = opts.kitHome || '#2f6fe4', kitAway = opts.kitAway || '#d83a3a';
    const key = kitHome + '|' + kitAway;
    if (cacheKey !== key || !world) build(key, kitHome, kitAway);
    const kits = [[kitHome, '#f2f2f2'], [kitAway, '#f2f2f2']].concat(EXTRA_KITS);

    const score = opts.score || [0, 0];
    const home = shortName(opts.home || 'HOME', 13), away = shortName(opts.away || 'AWAY', 13);
    const homeShort = shortName(opts.home || 'HOME', 12), awayShort = shortName(opts.away || 'AWAY', 12);
    const label = String(opts.label || 'KICK OFF').toUpperCase();
    const clock = String(opts.clock == null ? "0'" : opts.clock);
    const excited = !!opts.excited;
    const tRemain = typeof opts.tRemain === 'number' ? opts.tRemain : 999;

    // pick the current shot from the looping timeline
    let u0 = t % TOTAL, shot = 0, st = u0;
    for (let i = 0; i < SH.length; i++) { if (st < SH[i].d) { shot = i; break; } st -= SH[i].d; }
    const s = SH[shot];
    const u = clamp(st / s.d, 0, 1), e = u * u * (3 - 2 * u), z = s.z;
    const cx = s.a[0] + (s.b[0] - s.a[0]) * e, cy = s.a[1] + (s.b[1] - s.a[1]) * e;
    const vw = W / z, vh = H / z, camx = Math.round(clamp(cx - vw / 2, 0, WORLD - vw)), camy = Math.round(clamp(cy - vh / 2, 0, H - vh));

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.setTransform(z, 0, 0, z, -camx * z, -camy * z);
    g.drawImage(world, 0, 0);
    // floodlights
    for (let k = 0; k < 5; k++) {
      const lx = 120 + k * 300;
      g.fillStyle = 'rgba(255,250,220,' + (.5 + .2 * Math.sin(t * 3 + k)).toFixed(2) + ')';
      g.fillRect(lx - 6, 10, 12, 6);
      g.fillStyle = 'rgba(255,250,220,.25)'; g.fillRect(lx - 14, 7, 28, 12);
      g.fillStyle = 'rgba(255,250,220,.07)'; g.beginPath(); g.moveTo(lx - 10, 18); g.lineTo(lx + 10, 18); g.lineTo(lx + 60, 230); g.lineTo(lx - 60, 230); g.fill();
    }
    // the crowd
    const waveX = (t * 150) % (WORLD + 500) - 250;
    for (let fi = 0; fi < fans.length; fi++) {
      const f = fans[fi];
      if (f.x < camx - 26 || f.x > camx + vw + 26) continue;
      const wv = f.x - waveX, wa = wv < 0 && wv > -110 ? Math.sin(-wv / 110 * Math.PI) : 0;
      let up = f.st > 1 || wa > .25 || (f.st === 1 && Math.sin(t * 5 + f.ph) > 0);
      if (excited && f.st === 0 && Math.sin(t * 2 + f.ph) > .6) up = true;
      const bob = (f.st === 1 ? Math.round(Math.abs(Math.sin(t * 6 + f.ph)) * 3) : 0) + Math.round(wa * 4);
      const kit = kits[f.kit] || kits[2];
      const sp = spr(kit, SKINS[f.sk], HAIRS[f.hr], up), w = sp.width * S, h = sp.height * S;
      const left = Math.round(f.x - w / 2), top = f.y - h - bob;
      if (f.st === 2) { const sx = left - 8; for (let i = 0; i < 20; i++) { g.fillStyle = (i >> 1) & 1 ? '#f4f4f4' : kit[0]; g.fillRect(sx + i, top + 2 + Math.round(Math.sin(t * 4 + i * .4 + f.ph) * 1.5), 1, 3); } }
      g.drawImage(sp, left, top, w, h);
      if (f.st === 3) {
        const px = left + w - 4; g.fillStyle = '#d8d8d8'; g.fillRect(px, top - 16, 1, 20);
        for (let i = 0; i < 14; i++) { const o = Math.round(Math.sin(t * 7 - i * .5 + f.ph) * 1.5); g.fillStyle = (i % 6 < 3) ? kit[0] : '#f4f4f4'; g.fillRect(px + 1 + i, top - 16 + o, 1, 8); }
      }
      if (f.st === 4 && Math.sin(t * 9 + f.ph * 7) > .93) { g.fillStyle = '#fff'; g.fillRect(left + w / 2 - 2, top - 3, 4, 4); }
    }
    // fan banners
    banner(g, 120, 40, 230, home, kitHome, '#fff', t);
    banner(g, 1160, 40, 190, away, kitAway, '#fff', t);
    g.setTransform(1, 0, 0, 1, 0, 0);
    // vignette + scanlines
    for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(0,0,0,' + (.07 + .02 * k).toFixed(2) + ')'; g.lineWidth = 1; g.strokeRect(k + .5, k + .5, W - 2 * k - 1, H - 2 * k - 1); }
    g.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    // broadcast HUD
    g.fillStyle = 'rgba(8,14,12,.82)'; g.fillRect(96, 3, 288, 17);
    g.fillStyle = kitHome; g.fillRect(96, 3, 5, 17); g.fillStyle = kitAway; g.fillRect(379, 3, 5, 17);
    txt(g, homeShort, 106, 9, '#e8f3ec', 1); txt(g, awayShort, 374, 9, '#e8f3ec', 1, 'r');
    txt(g, score[0], 214, 5, '#fff', 2, 'c'); txt(g, '-', 240, 5, '#8fb7a0', 2, 'c'); txt(g, score[1], 266, 5, '#fff', 2, 'c');
    g.fillStyle = 'rgba(8,14,12,.82)'; g.fillRect(216, 20, 48, 10); txt(g, clock, 240, 23, '#ffe45e', 1, 'c');
    g.fillStyle = 'rgba(8,14,12,.82)'; g.fillRect(8, 188, 176, 44); g.fillStyle = kitHome; g.fillRect(8, 188, 5, 44);
    txt(g, label, 20, 194, '#ffffff', 3, 'l', '#000'); txt(g, homeShort + ' V ' + awayShort, 20, 218, '#8fb7a0', 1);
    if (Math.floor(t * 1.5) & 1) { g.fillStyle = '#ff3a3a'; g.fillRect(432, 8, 6, 6); } txt(g, 'LIVE', 442, 9, '#fff', 1, 'l', '#000');
    // fade: per-shot in/out (source) + a clean fade-out as the half is about to begin
    const shotFade = Math.min(1, st / FADE, (s.d - st) / FADE);
    const master = Math.min(1, shotFade, t / .35, tRemain / .5);
    if (master < 1) { g.fillStyle = 'rgba(0,0,0,' + (1 - master).toFixed(2) + ')'; g.fillRect(0, 0, W, H); }
  }

  window.crowdCamDraw = crowdCamDraw;
})();
