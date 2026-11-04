/* ==========================================================================
   Vantage FC - homebg.js
   --------------------------------------------------------------------------
   Animated pixel-art stadium behind the home (mode select) screen: a looping
   mini-match, a swaying crowd, floodlights, fireworks and a starfield, all
   drawn on a 480x270 canvas and scaled up crisply to cover the viewport.

   Self-contained: it looks for #homeBgCanvas, fits it to the window and runs
   its own requestAnimationFrame loop. While the home screen is hidden it stops
   drawing so it costs nothing during a match.
   ========================================================================== */
(function () {
  "use strict";
  const cv = document.getElementById("homeBgCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const VW = 480, VH = 270;
  cv.width = VW; cv.height = VH;
  ctx.imageSmoothingEnabled = false;

  /* ---------- helpers ---------- */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const TAU = Math.PI * 2;
  function seeded(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function hexRGB(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  /* ---------- pixel font (3x5) ---------- */
  const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', ':': '000010000010000', '-': '000000111000000', '!': '010010010000010', '.': '000000000000010', '/': '001001010100100', '<': '001010100010001', '>': '100010001010100', '+': '000010111010000', "'": '010010000000000', '?': '110001010000010', ',': '000000000010100', '%': '101001010100101', '_': '000000000000111', '=': '000111000111000' };
  function glyphs(g, str, x, y, col, s) {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < str.length; i++) {
      const gl = FONT[str[i]]; if (!gl) continue;
      for (let k = 0; k < 15; k++) if (gl.charCodeAt(k) === 49) g.rect(x + i * 4 * s + (k % 3) * s, y + ((k / 3) | 0) * s, s, s);
    }
    g.fill();
  }
  function textOn(g, str, x, y, col, s, align, shadow) {
    str = String(str).toUpperCase(); s = s || 1;
    const w = str.length * 4 * s - s;
    if (align === 'c') x -= w >> 1; else if (align === 'r') x -= w;
    x = Math.round(x); y = Math.round(y);
    if (shadow) glyphs(g, str, x + s, y + s, shadow, s);
    glyphs(g, str, x, y, col, s);
  }

  /* ---------- sprite builder (used by the actors + crowd) ---------- */
  function makeSprite(rows, pal) {
    const h = rows.length, w = rows[0].length, W = w + 2, H = h + 2;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + 1, y + 1, 1, 1); } }
    const img = g.getImageData(0, 0, W, H), d = img.data, solid = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) solid[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < W - 1 && solid[i + 1]) || (y > 0 && solid[i - W]) || (y < H - 1 && solid[i + W])) { d[i * 4] = 18; d[i * 4 + 1] = 14; d[i * 4 + 2] = 24; d[i * 4 + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  function flipH(c) { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
  const BODY_DOWN = ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '..ssss..', '.kkkkkk.', 'skkkkkks', 'skkkkkks', '.kkkkkk.', '.pppppp.'];
  const BODY_UP = ['..hhhh..', '.hhhhhh.', '.hhhhhh.', '.hhhhhh.', '..hhhh..', '.kkkkkk.', 'skkkkkks', 'skkkkkks', '.kkkkkk.', '.pppppp.'];
  const BODY_SIDE = ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhsse.', '..hsss..', '.kkkkkk.', '.kkkkks.', '.kkkkks.', '.kkkkkk.', '.pppppp.'];
  const LEGS_SIDE = [
    ['..pppp..', '..oooo..', '..oooo..', '..bbbbb.'],
    ['..pppp..', '.oo..oo.', '.oo..oo.', '.bbb.bbb'],
    ['..pppp..', '..oooo..', '..oooo..', '..bbbbb.'],
    ['..pppp..', '..oo.oo.', '..oo.oo.', '..bbbbbb']
  ];
  function legsFB(fr) {
    const n = ['p', 'o', 'o', 'b'], l = ['p', 'o', 'b', '.'];
    const lifted = fr === 1 ? 'L' : fr === 3 ? 'R' : null, rows = [];
    for (let r = 0; r < 4; r++) {
      const a = lifted === 'L' ? l[r] : n[r], b = lifted === 'R' ? l[r] : n[r];
      rows.push('.' + a + a + '..' + b + b + '.');
    }
    return rows;
  }
  const SPR = new Map();
  function getSprite(kit, skin, hair, dir, fr) {
    const key = kit.shirt + kit.shorts + kit.socks + skin + hair + dir + fr;
    let c = SPR.get(key); if (c) return c;
    if (dir === 'left') { c = flipH(getSprite(kit, skin, hair, 'right', fr)); SPR.set(key, c); return c; }
    let body, legs;
    if (dir === 'down') { body = BODY_DOWN; legs = legsFB(fr); }
    else if (dir === 'up') { body = BODY_UP; legs = legsFB(fr); }
    else { body = BODY_SIDE; legs = LEGS_SIDE[fr & 3]; }
    c = makeSprite(body.concat(legs), { h: hair, s: skin, e: '#1a1420', k: kit.shirt, p: kit.shorts, o: kit.socks, b: '#15131c' });
    SPR.set(key, c); return c;
  }
  const BALL_ROWS = [
    ['.www.', 'wkwww', 'wwwww', 'wwwkw', '.www.'],
    ['.www.', 'wwwkw', 'wwwww', 'wkwww', '.www.'],
    ['.wkw.', 'wwwww', 'wwwww', 'wwwww', '.wkw.'],
    ['.www.', 'wwwww', 'kwwwk', 'wwwww', '.www.']
  ];
  const BALL_SPR = BALL_ROWS.map(r => makeSprite(r, { w: '#f6f6f2', k: '#2a2a33' }));

  /* ---------- data used by the scene ---------- */
  const KITS = [
    { team: 'PIXEL FC', shirt: '#2f6fe4', shorts: '#f2f2f2', socks: '#2f6fe4' },
    { team: 'RETRO UTD', shirt: '#d83a3a', shorts: '#f2f2f2', socks: '#d83a3a' },
    { team: '8-BIT CITY', shirt: '#1fa65a', shorts: '#0d3b24', socks: '#1fa65a' },
    { team: 'BYTE ROVERS', shirt: '#f2c21b', shorts: '#222a55', socks: '#f2c21b' },
    { team: 'VOXEL ATH', shirt: '#8a4fd6', shorts: '#e9e0ff', socks: '#8a4fd6' },
    { team: 'SPRITE SC', shirt: '#f2812b', shorts: '#1c1c1c', socks: '#f2812b' },
    { team: 'GLITCH FC', shirt: '#2b2b33', shorts: '#d5d5d5', socks: '#2b2b33' },
    { team: 'ARCADE UTD', shirt: '#f1f1f1', shorts: '#2f6fe4', socks: '#f1f1f1' }
  ];
  const SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'];
  const HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];
  const HOME_KIT = KITS[0], AWAY_KIT = KITS[1];   // <- swap these to change the teams on screen

  /* ================================================================
     CINEMATIC BACKGROUND
     ================================================================ */
  const cinL = (a, b, u) => a + (b - a) * u;
  const cinRng = seeded(2026);
  const cinStars = Array.from({ length: 120 }, () => ({ x: cinRng() * 480, y: cinRng() * 104, s: cinRng(), p: cinRng() * 6 }));
  const cinWin = [];
  const cinCity = (() => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 70; const g = c.getContext('2d'); let x = 0;
    while (x < 960) {
      const w = 14 + ((cinRng() * 26) | 0), h = 16 + ((cinRng() * 50) | 0);
      g.fillStyle = '#0c1224'; g.fillRect(x, 70 - h, w, h); g.fillStyle = '#141c36'; g.fillRect(x, 70 - h, w, 2);
      for (let wy = 70 - h + 5; wy < 66; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (cinRng() < .42) cinWin.push({ x: wx, y: wy, p: cinRng() * 6 });
      if (cinRng() < .22) { g.fillStyle = '#0c1224'; g.fillRect(x + (w >> 1), 70 - h - 9, 1, 9); }
      x += w + ((cinRng() * 5) | 0);
    }
    return c;
  })();
  const cinCrowd = (() => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 62; const g = c.getContext('2d');
    const cols = ['#d94f4f', '#e8c24a', '#4a90d9', '#e8e8e8', '#7bd96a', '#c86ad9', '#e8914a', '#9ad9d6'];
    g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, 960, 62);
    for (let y = 6; y < 60; y += 4) for (let x = (y & 4) ? 2 : 0; x < 960; x += 4) if (cinRng() < .82) { g.fillStyle = cols[(cinRng() * 8) | 0]; g.fillRect(x, y, 2, 2); }
    g.fillStyle = 'rgba(6,9,18,.55)'; g.fillRect(0, 0, 960, 62);
    for (let x = 60; x < 960; x += 120) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, 0, 4, 62); }
    g.fillStyle = '#1a2236'; g.fillRect(0, 0, 960, 3); g.fillStyle = '#2a3350'; g.fillRect(0, 0, 960, 1);
    return c;
  })();
  const cinAds = (() => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 12; const g = c.getContext('2d');
    const ad = ['PIXEL', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE'], ac = ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f'];
    for (let x = 0, i = 0; x < 960; x += 80, i++) { g.fillStyle = ac[i % 6]; g.fillRect(x, 0, 80, 12); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 78, 0, 2, 12); textOn(g, ad[i % 6], x + 40, 3, '#fff', 1, 'c'); }
    return c;
  })();
  const cinC = { dTop: hexRGB('#3a2560'), nTop: hexRGB('#050a1c'), dHor: hexRGB('#ff9a55'), nHor: hexRGB('#142447') };
  const cinMx = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const cinRGB = (c, al) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (al === undefined ? 1 : al) + ')';
  const cinMotes = Array.from({ length: 38 }, () => ({ x: cinRng(), y: cinRng(), vx: cinRng() * 8 - 4, vy: 3 + cinRng() * 8, p: cinRng() * 6, s: cinRng() }));
  const CIN_LOOP = 20;

  /* a looping mini-match: build-up, one-two, cross, volley, celebration, reset */
  const cinKFs = {
    A1: [[0, 40, 228], [3.2, 170, 222], [3.7, 176, 222], [6.5, 240, 232], [8.5, 300, 236], [10, 330, 234], [12.5, 330, 234], [17.5, 40, 228], [20, 40, 228]],
    A2: [[0, 60, 190], [3.4, 190, 198], [4.2, 196, 200], [6.8, 300, 205], [7.2, 304, 206], [9.5, 330, 206], [12, 330, 206], [17.5, 60, 190], [20, 60, 190]],
    A3: [[0, 150, 244], [5, 250, 240], [6.8, 330, 236], [7.4, 350, 232], [7.7, 352, 232], [9.5, 420, 250], [11, 400, 252], [12.5, 400, 252], [17.5, 150, 244], [20, 150, 244]],
    B1: [[0, 330, 225], [3.4, 200, 222], [4.2, 196, 224], [6.5, 270, 222], [8, 330, 224], [17.5, 330, 225], [20, 330, 225]],
    B2: [[0, 380, 205], [6.8, 330, 205], [7.4, 345, 208], [12.5, 345, 208], [17.5, 380, 205], [20, 380, 205]],
    GK: [[0, 446, 214], [7.4, 446, 214], [7.9, 452, 218], [12.4, 452, 218], [12.9, 446, 214], [20, 446, 214]],
    BALL: [[0, 49, 228, 0], [3.2, 179, 222, 0], [3.4, 181, 222, 0], [3.7, 190, 211, 8], [4, 198, 201, 0], [6.8, 309, 206, 0], [7, 311, 206, 0], [7.25, 330, 214, 22], [7.5, 348, 230, 6], [7.6, 350, 232, 10], [8, 455, 214, 16], [8.2, 460, 214, 14], [8.6, 462, 216, 0], [12.2, 462, 216, 0]]
  };
  function cinKF(k, L) {
    if (L <= k[0][0]) return { x: k[0][1], y: k[0][2], z: k[0][3] || 0, vx: 0, vy: 0 };
    for (let i = 1; i < k.length; i++) if (L <= k[i][0]) { const a = k[i - 1], b = k[i], d = b[0] - a[0], u = (L - a[0]) / d; return { x: cinL(a[1], b[1], u), y: cinL(a[2], b[2], u), z: cinL(a[3] || 0, b[3] || 0, u), vx: (b[1] - a[1]) / d, vy: (b[2] - a[2]) / d }; }
    const e = k[k.length - 1]; return { x: e[1], y: e[2], z: e[3] || 0, vx: 0, vy: 0 };
  }
  function cinActors(t, cx, cy) {
    const L = (t * 1.3) % CIN_LOOP, hk = HOME_KIT, ak = AWAY_KIT, gk = { shirt: '#e8e03a', shorts: '#1c1c22', socks: '#e8e03a' };
    const defs = [['A1', hk, 1, 1, 'right'], ['A2', hk, 0, 3, 'right'], ['A3', hk, 3, 0, 'right'], ['B1', ak, 2, 4, 'left'], ['B2', ak, 4, 0, 'left'], ['GK', gk, 0, 5, 'left']];
    const items = [];
    for (const d of defs) {
      const p = cinKF(cinKFs[d[0]], L), sp = Math.hypot(p.vx, p.vy); let dir = d[4], fr = 0;
      if (sp > 4) { dir = Math.abs(p.vx) > Math.abs(p.vy) * .8 ? (p.vx > 0 ? 'right' : 'left') : (p.vy > 0 ? 'down' : 'up'); fr = Math.floor(L * 6 + d[2] * 3) & 3; }
      const cel = d[0] === 'A3' ? (L > 8.2 && L < 12) : (d[0] === 'A1' || d[0] === 'A2') ? (L > 9 && L < 12.2) : false;
      items.push({ y: p.y, k: d[0], x: p.x - cx, spr: getSprite(d[1], SKINS[d[2]], HAIRS[d[3]], dir, fr), kit: d[1], skin: SKINS[d[2]], cel: cel, ph: d[2], gk: d[0] === 'GK' ? (Math.PI / 2 * (cinL(0, 1, Math.min(1, Math.max(0, (L - 7.6) / .4))) - Math.min(1, Math.max(0, (L - 12.4) / .5)))) : 0 });
    }
    let b = null;
    if (L <= 12.2) b = cinKF(cinKFs.BALL, L); else if (L >= 17.5) { const a = cinKF(cinKFs.A1, L); b = { x: a.x + 9, y: a.y, z: 0 }; }
    if (b) items.push({ y: b.y, ball: true, x: b.x - cx, z: b.z });
    items.sort((a, c) => a.y - c.y);
    for (const it of items) {
      const x = Math.round(it.x), y = Math.round(it.y + cy);
      if (it.ball) {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 5, y, 10, 2);
        const bs = BALL_SPR[Math.floor(t * 10) & 3]; ctx.drawImage(bs, x - 7, Math.round(y - it.z - 12), 14, 14); continue;
      }
      const s = it.spr, w = s.width * 3, h = s.height * 3, bob = it.cel ? Math.round(Math.abs(Math.sin(t * 8 + it.ph)) * 5) : 0, top = y - h + 3 - bob;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 34, y + 7); ctx.lineTo(x + 14, y + 7); ctx.fill();
      if (it.gk > .02) { ctx.save(); ctx.translate(x, y - 24 + Math.round(16 * it.gk / (Math.PI / 2))); ctx.rotate(it.gk); ctx.drawImage(s, -w / 2, -h / 2, w, h); ctx.restore(); continue; }
      if (it.cel) {
        ctx.fillStyle = '#120e18'; ctx.fillRect(x - 17, top - 6, 5, 20); ctx.fillRect(x + 12, top - 6, 5, 20);
        ctx.fillStyle = it.kit.shirt; ctx.fillRect(x - 16, top + 2, 3, 12); ctx.fillRect(x + 13, top + 2, 3, 12);
        ctx.fillStyle = it.skin; ctx.fillRect(x - 16, top - 5, 3, 7); ctx.fillRect(x + 13, top - 5, 3, 7);
      }
      ctx.drawImage(s, x - w / 2, top, w, h);
    }
  }
  function cinFans(t, cx) {
    const home = HOME_KIT, away = AWAY_KIT;
    for (const r of [1, 0]) {
      const y = r ? 136 : 156, par = r ? .65 : .75;
      for (let i = -1; i < 26; i++) {
        const sx = Math.round(i * 22 + (r ? 11 : 0) - cx * par); if (sx < -24 || sx > VW + 24) continue;
        const id = ((i + 30) * 7 + r * 13) % 17, k = id < 12 ? home : (id < 15 ? away : KITS[(id + 2) % 8]);
        const up = Math.sin(t * 5 + id * 1.7) > .1 && id % 3 !== 0, bob = up ? Math.round(Math.abs(Math.sin(t * 8 + id)) * 3) : 0;
        const sp = getSprite(k, SKINS[id % 5], HAIRS[id % 6], 'down', 0), w = sp.width * 2, top = y - 22 - bob;
        if (up) { const ax = sx + ((id & 1) ? 7 : -9); ctx.fillStyle = k.shirt; ctx.fillRect(ax, top - 5, 2, 9); ctx.fillStyle = SKINS[id % 5]; ctx.fillRect(ax, top - 8, 2, 3); }
        if (up && id % 7 === 0) { const px = sx + 8; ctx.fillStyle = '#d8d8d8'; ctx.fillRect(px, top - 18, 1, 20); for (let q = 0; q < 10; q++) { ctx.fillStyle = (q % 6 < 3) ? k.shirt : '#f4f4f4'; ctx.fillRect(px + 1 + q, top - 18 + Math.round(Math.sin(t * 7 - q * .5 + id) * 1.5), 1, 6); } }
        ctx.drawImage(sp, 0, 0, sp.width, 11, sx - w / 2, top, w, 22);
      }
    }
  }
  function cinBG(t) {
    const n = .5 - .5 * Math.cos(t * TAU / 80), cx = Math.sin(t * .11) * 34, cy = Math.sin(t * .17) * 2;
    const top = cinMx(cinC.dTop, cinC.nTop, n), hor = cinMx(cinC.dHor, cinC.nHor, n), lit = clamp(.35 + .9 * n, 0, 1) * (.97 + .03 * Math.sin(t * 37));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 24; i++) { ctx.fillStyle = cinRGB(cinMx(top, hor, Math.pow(i / 23, 1.6))); ctx.fillRect(0, i * 5, VW, 5); }
    const sa = clamp((n - .2) * 1.7, 0, 1);
    if (sa > .02) for (const s of cinStars) { const a = sa * (.55 + .45 * Math.sin(t * 2 + s.p)); if (a < .08) continue; ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(s.x - cx * .03), Math.round(s.y), s.s > .85 ? 2 : 1, 1); }
    /* moon */
    const mx = Math.round(382 - cx * .05), my = Math.round(36 + cy);
    ctx.globalAlpha = .3 + .7 * n;
    for (let r = 28; r >= 16; r -= 4) { ctx.fillStyle = 'rgba(200,215,255,' + (.05 + (28 - r) * .004).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#eef2fb'; ctx.beginPath(); ctx.arc(mx, my, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#cfd7ea';
    ctx.fillRect(mx - 5, my - 3, 3, 3); ctx.fillRect(mx + 2, my + 2, 4, 3); ctx.fillRect(mx - 2, my + 5, 2, 2);
    ctx.globalAlpha = 1;
    if (n > .4) { const e = (t % 9.5) / 1.1; if (e < 1) { for (let k = 0; k < 10; k++) { ctx.fillStyle = 'rgba(255,255,255,' + ((1 - e) * (1 - k / 10)).toFixed(2) + ')'; ctx.fillRect(Math.round(420 - e * 220 + k * 2), Math.round(14 + e * 70 - k), 2, 1); } } }
    /* clouds and birds */
    const cloud = cinRGB(cinMx([255, 170, 130], [90, 110, 170], n), .26);
    for (let k = 0; k < 5; k++) {
      const x = Math.round(((t * (3 + k * 1.3) + k * 140) % 720) - 120 - cx * .1), y = 24 + k * 14 + (k % 2) * 8, w = 40 + k * 6;
      ctx.fillStyle = cloud; ctx.fillRect(x, y, w, 6); ctx.fillRect(x + 8, y - 4, w - 18, 5); ctx.fillRect(x + 18, y + 6, w - 30, 3);
    }
    if (n < .65) for (let k = 0; k < 3; k++) {
      const x = ((t * 18 + k * 160) % 560) - 40 - cx * .1, y = 52 + k * 10 + Math.sin(t * 3 + k) * 4, f = Math.sin(t * 9 + k * 2) > 0;
      ctx.fillStyle = '#0c1224'; ctx.fillRect(Math.round(x), Math.round(y) + (f ? 0 : 2), 2, 1); ctx.fillRect(Math.round(x) + 2, Math.round(y) + 1, 1, 1); ctx.fillRect(Math.round(x) + 3, Math.round(y) + (f ? 0 : 2), 2, 1);
    }
    /* fireworks */
    { const id = Math.floor((t + 2) / 7), e = ((t + 2) % 7) / 1.7;
      if (e < 1 && n > .25) {
        const px = 80 + ((id * 173) % 320), py = 28 + ((id * 61) % 40), col = ['#ffe45e', '#ff5d73', '#5de0ff', '#7dff8a', '#c78bff'][id % 5];
        ctx.fillStyle = 'rgba(255,255,255,' + (.06 * (1 - e)).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, 110);
        for (let k = 0; k < 26; k++) { const a = k / 26 * TAU; for (const q of [1, .6]) { ctx.fillStyle = col; ctx.globalAlpha = (1 - e) * q; ctx.fillRect(Math.round(px + Math.cos(a) * e * 38 * q - cx * .1), Math.round(py + Math.sin(a) * e * 38 * q + e * e * 22), 2, 2); } }
        ctx.globalAlpha = 1;
      } }
    /* skyline */
    { const off = ((-cx * .2) % 960 + 960) % 960; ctx.drawImage(cinCity, -off, 42); ctx.drawImage(cinCity, 960 - off, 42);
      for (const w of cinWin) { const sx = ((w.x - cx * .2) % 960 + 960) % 960; if (sx > 484) continue; if (Math.sin(t * .7 + w.p) > -.4) { ctx.fillStyle = 'rgba(255,220,130,' + (.35 + .4 * n).toFixed(2) + ')'; ctx.fillRect(Math.round(sx), 42 + w.y, 2, 3); } }
      ctx.fillStyle = cinRGB(hor, .3); ctx.fillRect(0, 96, VW, 16); }
    /* floodlight masts */
    const towers = [64 - cx * .45, 416 - cx * .45];
    for (const tx of towers) {
      const x = Math.round(tx);
      ctx.fillStyle = '#0a0e18'; ctx.fillRect(x - 2, 30, 5, 76); for (let y = 34; y < 104; y += 9) { ctx.fillRect(x - 4, y, 9, 1); }
      ctx.fillRect(x - 16, 12, 33, 17);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,246,208,' + (.25 + .75 * lit).toFixed(2) + ')'; ctx.fillRect(x - 14 + i * 8, 14 + j * 7, 6, 5); }
    }
    /* stands, banners, flares */
    { const off = ((-cx * .6) % 960 + 960) % 960; ctx.drawImage(cinCrowd, -off, 100); ctx.drawImage(cinCrowd, 960 - off, 100); }
    const bannerA = (sx, wd, kt, label) => {
      for (let i = 0; i < wd; i += 2) { const o = Math.round(Math.sin(t * 2.2 + i * .04 + sx) * 2); ctx.fillStyle = kt.shirt; ctx.fillRect(sx + i, 106 + o, 2, 24); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(sx + i, 106 + o, 2, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(sx + i, 128 + o, 2, 2); }
      textOn(ctx, label, sx + wd / 2, 114 + Math.round(Math.sin(t * 2.2 + wd * .02 + sx) * 2), kt.shirt === '#f1f1f1' || kt.shirt === '#f2c21b' ? '#10141f' : '#ffffff', 2, 'c', 'rgba(0,0,0,.5)');
    };
    bannerA(Math.round(150 - cx * .6), 170, HOME_KIT, 'PIXEL STRIKER');
    bannerA(Math.round(520 - cx * .6), 110, AWAY_KIT, AWAY_KIT.team);
    for (const fx of [90, 230, 350, 470]) {
      const sx = Math.round(fx - cx * .6);
      for (let k = 0; k < 7; k++) { const age = ((t * .5 + k / 7) % 1), s = 3 + Math.round(age * 9); ctx.fillStyle = 'rgba(' + (255 - Math.round(age * 60)) + ',' + (90 + Math.round(age * 80)) + ',' + (60 + Math.round(age * 80)) + ',' + (.22 * (1 - age)).toFixed(2) + ')'; ctx.fillRect(Math.round(sx + Math.sin(t * 1.3 + k + fx) * 5 + age * 10) - (s >> 1), Math.round(140 - age * 60), s, s); }
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,90,40,' + (.35 + .25 * Math.sin(t * 9 + fx)).toFixed(2) + ')'; ctx.fillRect(sx - 3, 138, 7, 6); ctx.fillStyle = 'rgba(255,90,40,.1)'; ctx.beginPath(); ctx.arc(sx, 141, 16, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff'; ctx.fillRect(sx - 1, 140, 3, 3);
    }
    for (let k = 0; k < 6; k++) if (Math.sin(t * (7 + k) + k * 5) > .985) { ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(40 + k * 76 - cx * .6), 112 + ((k * 37) % 30), 3, 3); }
    cinFans(t, cx);
    { const off = ((-cx * .85) % 960 + 960) % 960; ctx.drawImage(cinAds, -off, 160); ctx.drawImage(cinAds, 960 - off, 160); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 170, VW, 2); }
    /* pitch */
    const ys = [172, 177, 184, 193, 205, 221, 243, 270];
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i & 1 ? '#2f7a33' : '#37873c'; ctx.fillRect(0, ys[i], VW, ys[i + 1] - ys[i]); }
    ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = -1; k < 12; k++) { const x = Math.round(k * 44 - cx); ctx.fillRect(x, 172, 22, 98); }
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(0, 173, VW, 1);
    for (let y = 174; y < 270; y += 2) ctx.fillRect(Math.round(cinL(362, 300, (y - 174) / 96) - cx), y, 1, 2);
    ctx.fillStyle = 'rgba(8,20,12,.7)'; ctx.fillRect(Math.round(452 - cx), 182, 30, 38); ctx.fillStyle = 'rgba(230,240,235,.45)';
    for (let x = 0; x < 30; x += 3) ctx.fillRect(Math.round(452 - cx) + x, 182, 1, 38); for (let y = 0; y < 38; y += 3) ctx.fillRect(Math.round(452 - cx), 182 + y, 30, 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(452 - cx) - 1, 180, 3, 42); ctx.fillRect(Math.round(452 - cx) - 1, 180, 32, 2);
    /* light beams */
    ctx.globalCompositeOperation = 'lighter';
    towers.forEach((tx, i) => {
      const x = tx, dir = i ? -1 : 1;
      ctx.fillStyle = 'rgba(255,246,208,' + (.06 * lit).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(x - 12, 26); ctx.lineTo(x + 12, 26); ctx.lineTo(x + dir * 190 + 90, 272); ctx.lineTo(x + dir * 190 - 90, 272); ctx.fill();
      ctx.fillStyle = 'rgba(255,246,208,' + (.22 * lit).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, 20, 16 + Math.sin(t * 3 + i) * 2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,230,' + (.3 * lit).toFixed(3) + ')'; ctx.fillRect(Math.round(x - 36), 19, 72, 2); ctx.fillRect(Math.round(x) - 1, 0, 3, 44);
    });
    ctx.globalCompositeOperation = 'source-over';
    cinActors(t, cx, cy);
    /* foreground: dust, bokeh, lens sweep */
    ctx.globalCompositeOperation = 'lighter';
    for (const m of cinMotes) {
      const x = ((m.x * 480 - cx * 1.4 + t * m.vx) % 520 + 520) % 520 - 20, y = ((m.y * 270 - t * m.vy) % 290 + 290) % 290 - 10, a = .2 + .3 * Math.sin(t * 2 + m.p);
      ctx.fillStyle = 'rgba(255,230,170,' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(x), Math.round(y), m.s > .8 ? 2 : 1, m.s > .8 ? 2 : 1);
      if (m.s > .9) { ctx.fillStyle = 'rgba(255,230,170,.05)'; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), 8, 0, TAU); ctx.fill(); }
    }
    { const x = ((t % 14) / 14) * 700 - 100; ctx.fillStyle = 'rgba(255,240,200,.05)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 16, 0); ctx.lineTo(x - 60, 270); ctx.lineTo(x - 76, 270); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    /* grade, vignette, grain */
    ctx.fillStyle = 'rgba(255,110,40,' + (.12 * (1 - n)).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = 'rgba(10,30,90,' + (.16 * n).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
    ctx.strokeStyle = 'rgba(0,0,0,.07)'; for (let k = 0; k < 7; k++) ctx.strokeRect(k + .5, k + .5, VW - 2 * k - 1, VH - 2 * k - 1);
    for (let k = 0; k < 70; k++) { ctx.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'; ctx.fillRect((Math.random() * VW) | 0, (Math.random() * VH) | 0, 1, 1); }
  }

  /* ---------- fit & loop ---------- */
  // Cover the viewport (crop the overflow) rather than letterboxing.
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    let s = Math.max(w / VW, h / VH); if (s >= 2) s = Math.floor(s * 4) / 4;
    cv.style.width = Math.floor(VW * s) + 'px'; cv.style.height = Math.floor(VH * s) + 'px';
  }
  window.addEventListener("resize", fit); fit();

  function homeVisible() {
    const hs = document.getElementById("modeSelectScreen");
    return !!(hs && hs.offsetParent !== null && getComputedStyle(hs).display !== "none");
  }

  let last = performance.now(), T = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now; if (dt > .1) dt = .1;
    if (!homeVisible()) return;   // only animates behind the home screen
    T += dt;
    cinBG(T);
  }
  requestAnimationFrame(frame);
})();
