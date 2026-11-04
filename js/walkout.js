/* ==========================================================================
   Vantage FC - walkout.js  (V1.34.19)
   --------------------------------------------------------------------------
   The pre-match "Walkout" cinematic, ported from
   Pixel Striker FC - Walkout.html.

   It plays first, before the Crowd Cam's kick-off countdown, at the start of
   every match. Seven shots run in order - TUNNEL, WALKOUT, ESCORTS, ANTHEM,
   COIN TOSS, LINE-UPS, KICK OFF - over a little under 29 seconds.

   It is a PURE renderer: the engine owns the clock and calls walkoutDraw()
   with the elapsed time each frame, so the module keeps no timeline state of
   its own (only the cached sprites, stadium backdrop and fan layout). The
   engine draws to its own 480x270 canvas, so this draws straight into the
   passed context, exactly like crowdcam.js.
   ========================================================================== */
(function () {
  "use strict";

  const W = 480, H = 270, WW = 640, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ez = u => u * u * (3 - 2 * u);
  const lerp = (a, b, u) => a + (b - a) * u;
  function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- pixel font (3x5) ---------- */
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '#': '101111101111101', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ':': '000010000010000' };
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

  /* ---------- sprites ---------- */
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
  const BS = ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhsse.', '..hsss..', '.kkkkkk.', '.kkkkks.', '.kkkkks.', '.kkkkkk.', '.pppppp.'];
  const LS = { 0: ['..pppp..', '..oooo..', '..oooo..', '..bbbbb.'], 1: ['..pppp..', '.oo..oo.', '.oo..oo.', '.bbb.bbb'], 3: ['..pppp..', '..oo.oo.', '..oo.oo.', '..bbbbbb'] };
  const pad = (a, n) => a.map(s => '.'.repeat(n) + s + '.'.repeat(n));
  const legsFB = fr => { const n = ['p', 'o', 'o', 'b'], l = ['p', 'o', 'b', '.'], r = []; for (let i = 0; i < 4; i++) { const a = fr === 1 ? l[i] : n[i], b = fr === 3 ? l[i] : n[i]; r.push('.' + a + a + '..' + b + b + '.'); } return r; };
  const PT = (function () { const r = BS.map(s => ('.' + s + '.').split('')); r[6] = '..kkkkkkss'.split(''); r[7] = '..kkkkkk..'.split(''); return r.map(a => a.join('')).concat(pad(LS[0], 1)); })();
  function rowsFor(p) {
    if (p === 'f' || p === 'f1' || p === 'f3') return BD.concat(legsFB(+p[1] || 0));
    if (p === 'pt') return PT;
    if (p === 'Fd') return BD.slice(0, 9);
    if (p === 'Fu') { const r = BD.slice(0, 9).map(s => ('.' + s + '.').split('')); for (const i of [6, 7]) { r[i][1] = '.'; r[i][8] = '.'; } for (let i = 0; i <= 5; i++) { r[i][1] = i ? 'k' : 's'; r[i][8] = i ? 'k' : 's'; } return r.map(a => a.join('')); }
    return BS.concat(LS[+p[1]]);
  }

  const KITS = [
    { t: 'PIXEL FC', s: '#2f6fe4', p: '#f2f2f2' },
    { t: 'RETRO UTD', s: '#d83a3a', p: '#f2f2f2' },
    { t: '8-BIT CITY', s: '#1fa65a', p: '#0d3b24' },
    { t: 'BYTE ROVERS', s: '#f2c21b', p: '#222a55' },
    { t: 'VOXEL ATH', s: '#8a4fd6', p: '#e9e0ff' },
    { t: 'SPRITE SC', s: '#f2812b', p: '#1c1c1c' },
    { t: 'GLITCH FC', s: '#2b2b33', p: '#d5d5d5' },
    { t: 'ARCADE UTD', s: '#f1f1f1', p: '#2f6fe4' },
    { t: 'REF', s: '#e8d020', p: '#15151a' }
  ];
  const kit = 0; // the game always wears the home/away kits handed to us
  const kitOf = k => k === 'h' ? KITS[0] : k === 'a' ? KITS[1] : KITS[8];
  const SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'], HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];
  const SC = new Map();
  function spr(a, pose, kk) {
    const key = a[0] + '|' + a[1] + pose + kk + (kk === 'h' ? 0 : kk === 'a' ? 0 : ''); let c = SC.get(key); if (c) return c; const K = kitOf(kk);
    c = mk(rowsFor(pose), { h: HAIRS[a[1]], s: SKINS[a[0]], e: '#1a1420', k: K.s, p: K.p, o: K.s, b: '#15131c' }); SC.set(key, c); return c;
  }
  const BALL = mk(['.www.', 'wkwww', 'wwwww', 'wwwkw', '.www.'], { w: '#f6f6f2', k: '#2a2a33' });
  const cc = ['#d94f4f', '#e8c24a', '#4a90d9', '#e8e8e8', '#7bd96a', '#c86ad9', '#e8914a', '#9ad9d6'];
  function crowd(g, R, x0, y0, x1, y1, p) { for (let y = y0; y < y1; y += 4) for (let x = x0 + ((y & 4) ? 2 : 0); x < x1; x += 4) if (R() < p) { g.fillStyle = cc[(R() * 8) | 0]; g.fillRect(x, y, 2, 2); } }
  function ads(g, w, y, h) { const ad = ['PIXEL', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE'], ac = ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f']; for (let x = 0, i = 0; x < w; x += 80, i++) { g.fillStyle = ac[i % 6]; g.fillRect(x, y, 80, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 78, y, 2, h); txt(g, ad[i % 6], x + 40, y + (h - 5 >> 1), '#fff', 1, 'c'); } }
  function mkc(w) { const c = document.createElement('canvas'); c.width = w; c.height = H; return c; }

  const bgW = (function () {
    const c = mkc(WW), g = c.getContext('2d'), R = rng(3);
    g.fillStyle = '#0b0e17'; g.fillRect(0, 0, WW, 128);
    for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(40,55,95,' + (.06 * k).toFixed(2) + ')'; g.fillRect(0, k * 6, WW, 6); }
    crowd(g, R, 0, 40, WW, 112, .4); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 40, WW, 12);
    for (const x of [80, 300, 520]) { g.fillStyle = 'rgba(255,250,220,.5)'; g.fillRect(x - 6, 8, 12, 5); g.fillStyle = 'rgba(255,250,220,.06)'; g.beginPath(); g.moveTo(x - 8, 12); g.lineTo(x + 8, 12); g.lineTo(x + 70, 128); g.lineTo(x - 70, 128); g.fill(); }
    ads(g, WW, 114, 14);
    for (let x = 0, k = 0; x < WW; x += 40, k++) { g.fillStyle = k & 1 ? '#2f7a33' : '#37873c'; g.fillRect(x, 128, 40, H - 128); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 134, WW, 1); g.fillRect(0, 246, WW, 1); g.fillRect(320, 134, 1, 113);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(320.5, 190.5, 44, 18, 0, 0, TAU); g.stroke(); g.fillStyle = '#fff'; g.fillRect(319, 189, 3, 3);
    g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, 247, WW, 23);
    g.fillStyle = '#05060a'; g.fillRect(40, 92, 46, 40); g.fillStyle = '#1c2330'; g.fillRect(36, 88, 54, 5); g.fillStyle = '#3a4252'; g.fillRect(36, 88, 54, 1);
    g.fillStyle = '#cfe8d0'; g.fillRect(44, 96, 38, 3); txt(g, 'TUNNEL', 63, 80, '#fff', 1, 'c');
    return c;
  })();

  /* ---------- the walkout simulation ---------- */
  function poly(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { len: L[L.length - 1], at(d) { if (d >= this.len) return pts[pts.length - 1]; for (let i = 1; i < pts.length; i++) if (d <= L[i]) { const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; } return pts[pts.length - 1]; } }; }
  const HS = i => 294 - 26 * i, AS = i => 346 + 26 * i, TS = i => 3.6 + .45 * i, SPD = 85;
  const PATH = [0, 1].map(h => Array.from({ length: 11 }, (_, i) => { const sx = h ? AS(i) : HS(i), ly = h ? 172 : 150; return { p: poly([[62, 131], [84, ly], [sx, ly], [sx, 205]]), ly: ly, sx: sx }; }));
  const rs = rng(21), AP = () => [(rs() * 5) | 0, (rs() * 6) | 0];
  const PA = [0, 1].map(() => Array.from({ length: 11 }, () => AP()));
  const KA = [0, 1].map(() => Array.from({ length: 11 }, () => AP()));
  const RA = [0, 0];
  const KP = [[320, 196], [312, 148], [312, 232], [258, 150], [262, 240], [206, 150], [200, 240], [140, 150], [140, 236], [66, 196], [34, 196]];
  function walk(i, h, T) {
    const P = PATH[h][i], ts = TS(i); if (T < ts) return null;
    const d = (T - ts) * SPD, L = P.p.len, fr = (Math.floor(T * 6 + i) & 1) ? 1 : 3;
    if (d < L) { const q = P.p.at(d), down = d > L - (205 - P.ly); return { x: q[0], y: q[1], pose: down ? 'f' + fr : 'r' + fr, mv: 1 }; }
    return { x: P.sx, y: 205, pose: 'f', mv: 0 };
  }
  function playerEnt(i, h, T) {
    const s = walk(i, h, T); if (!s) return null;
    const o = { a: PA[h][i], kk: h ? 'a' : 'h', x: s.x, y: s.y, pose: s.pose, ph: i }, fr = (Math.floor(T * 9 + i) & 1) ? 1 : 3, sx = PATH[h][i].sx;
    let x0 = sx;
    if (i === 0 && T > 17.2) {
      const hx = h ? 332 : 308; x0 = hx;
      if (T < 18.1) { o.x = lerp(sx, hx, ez(seg(T, 17.2, 18.1))); o.pose = 'r' + fr; o.flip = !!h; }
      else { o.x = hx; o.flip = !!h; o.pose = T < 19.4 ? 'r0' : T < 21.4 ? 'pt' : 'f'; }
    }
    if (T >= 25) {
      const k = KP[i], tx = h ? 640 - k[0] : k[0], ty = k[1], ta = 25 + i * .05, u = seg(T, ta, ta + 2.2);
      if (T >= ta) { o.x = lerp(x0, tx, u); o.y = lerp(205, ty, u); o.flip = tx < x0; o.pose = u < 1 ? 'r' + fr : 'r0'; if (u >= 1) o.flip = !!h; }
      else { o.x = x0; o.y = 205; o.pose = 'f'; o.flip = false; }
    }
    return o;
  }
  function kidEnt(i, h, T) {
    const s = walk(i, h, T); if (!s) return null;
    const o = { a: KA[h][i], kk: h ? 'a' : 'h', sc: 2, ph: i };
    if (T >= 17) { const q = seg(T, 17, 18.8); if (q >= 1) return null; o.x = s.x + (h ? 10 : -10) * q; o.y = 219 + q * 90; o.pose = 'f' + ((Math.floor(T * 9 + i) & 1) ? 1 : 3); return o; }
    if (s.mv) { o.x = s.x - 15; o.y = s.y + 6; o.pose = s.pose; } else { o.x = s.x; o.y = 219; o.pose = 'f'; }
    return o;
  }
  const REFP = poly([[62, 131], [84, 160], [320, 160], [320, 198]]);
  function refEnt(T) {
    const o = { a: RA, kk: 'r', ph: 0 }, d = (T - 3) * SPD, fr = (Math.floor(T * 6) & 1) ? 1 : 3;
    if (T < 3) return null;
    if (T >= 25) { const u = seg(T, 25, 26); o.x = lerp(320, 326, u); o.y = lerp(198, 224, u); o.pose = u < 1 ? 'r' + fr : 'f'; return o; }
    if (d < REFP.len) { const q = REFP.at(d); o.x = q[0]; o.y = q[1]; o.pose = d > REFP.len - 38 ? 'f' + fr : 'r' + fr; return o; }
    o.x = 320; o.y = 198; o.pose = 'f'; return o;
  }
  function sim(T) {
    const L = [], r = refEnt(T); if (r) L.push(r);
    for (let h = 0; h < 2; h++) for (let i = 0; i < 11; i++) { const p = playerEnt(i, h, T); if (p) L.push(p); const k = kidEnt(i, h, T); if (k) L.push(k); }
    return L;
  }

  const fans = []; (function () { const r = rng(77); [58, 84, 110].forEach((y, ri) => { for (let x = 8 + (ri & 1) * 11; x < WW; x += 22) fans.push({ x: x + ((r() * 5) | 0), y: y, flag: r() < .14, kk: x < 320 ? 'h' : 'a', a: PA[(r() * 2) | 0][(r() * 11) | 0], ph: r() * 6 }); }); })();

  let ctx = null;
  function drawFans(T, x0, x1) {
    for (const f of fans) {
      if (f.x < x0 - 20 || f.x > x1 + 20) continue;
      const up = T > 3.4 && T < 17.5, j = Math.round(Math.abs(Math.sin(T * (up ? 8 : 2) + f.ph)) * (up ? 4 : 1)), s = spr(f.a, up && Math.sin(T * 8 + f.ph) > -.4 ? 'Fu' : 'Fd', f.kk), top = f.y - s.height * 2 - j;
      if (up && f.flag) { const K = kitOf(f.kk), px = Math.round(f.x + s.width - 4); ctx.fillStyle = '#d8d8d8'; ctx.fillRect(px, top - 14, 1, 18); for (let i = 0; i < 12; i++) { ctx.fillStyle = (i % 6 < 3) ? K.s : '#f4f4f4'; ctx.fillRect(px + 1 + i, top - 14 + Math.round(Math.sin(T * 7 - i * .5 + f.ph) * 1.5), 1, 7); } }
      ctx.drawImage(s, Math.round(f.x - s.width), top, s.width * 2, s.height * 2);
    }
  }
  function drawList(list, sc0) {
    list.sort((a, b) => (a.gy !== undefined ? a.gy : a.y) - (b.gy !== undefined ? b.gy : b.y));
    for (const e of list) {
      if (e.fn) { e.fn(); continue; }
      const sc = e.sc || sc0, s = spr(e.a, e.pose, e.kk), w = s.width * sc, h = s.height * sc, z = (e.z || 0) * sc / 3;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(Math.round(e.x - w * .4), Math.round(e.y - sc / 2), Math.round(w * .8), Math.round(sc * 1.3));
      ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y - z));
      if (e.flip) ctx.scale(-1, 1);
      ctx.drawImage(s, -w / 2, -h, w, h); ctx.restore();
    }
  }

  let parts = [];
  function side(T, cx, cy, z, ents, dt) {
    ctx.setTransform(z, 0, 0, z, -cx * z, -cy * z); ctx.drawImage(bgW, 0, 0); drawFans(T, cx, cx + W / z);
    const L = ents.map(e => Object.assign({}, e));
    if (T >= 24.8) L.push({ gy: 208, fn() { ctx.drawImage(BALL, 313, 201, 14, 14); } });
    if (T >= 18 && T < 19.6) { const u = seg(T, 18, 19.5), zz = Math.sin(u * Math.PI) * 52, sp = Math.abs(Math.cos(u * 25)) * 3 + 1; L.push({ gy: 300, fn() { ctx.fillStyle = '#120e18'; ctx.fillRect(Math.round(320 - sp - 1), Math.round(176 - zz - 1), Math.round(sp * 2 + 2), 6); ctx.fillStyle = '#ffd84a'; ctx.fillRect(Math.round(320 - sp), Math.round(176 - zz), Math.round(sp * 2), 4); } }); }
    drawList(L, 3);
    if (dt && T > 4 && T < 9) { for (let k = 0; k < 4; k++) { const side2 = k & 1 ? 500 : 140, d = side2 < 300 ? 1 : -1; parts.push({ x: side2, y: 130, vx: d * rnd(20, 90), vy: -rnd(110, 190), life: rnd(1.4, 2.4), c: ['#ffe45e', '#ff5d73', '#5de0ff', '#7dff8a', '#fff'][k % 5] }); } }
    for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; if (dt) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 150 * dt; } if (q.life <= 0 || q.y > 260) { parts.splice(i, 1); continue; } ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function tunnel(T) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = seg(T, 0, 3.6), ow = 80 + 70 * g, oh = ow * .72, ox = 240 - ow / 2, oy = 100 - oh / 2, p = seg(T, 2.3, 3.6);
    ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, H);
    const quad = (c, pts) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.fill(); };
    quad('#17131f', [[0, 0], [W, 0], [ox + ow, oy], [ox, oy]]); quad('#1f1a33', [[0, H], [W, H], [ox + ow, oy + oh], [ox, oy + oh]]);
    quad('#110d19', [[0, 0], [ox, oy], [ox, oy + oh], [0, H]]); quad('#110d19', [[W, 0], [ox + ow, oy], [ox + ow, oy + oh], [W, H]]);
    for (let k = 0; k < 6; k++) { const u = Math.pow(k / 6, 1.6), w = lerp(70, 8, k / 6); ctx.fillStyle = '#c4d4ff'; ctx.fillRect(240 - w / 2, lerp(3, oy - 4, u), w, 2); ctx.fillStyle = 'rgba(180,200,255,.18)'; ctx.fillRect(lerp(10, ox - 6, u), lerp(40, oy + oh / 2, u), 2, lerp(150, oh * .7, k / 6)); ctx.fillRect(W - lerp(10, ox - 6, u) - 2, lerp(40, oy + oh / 2, u), 2, lerp(150, oh * .7, k / 6)); }
    ctx.fillStyle = '#d8f0d8'; ctx.fillRect(ox, oy, ow, oh); ctx.fillStyle = '#37873c'; ctx.fillRect(ox, oy + oh * .62, ow, oh * .38);
    ctx.fillStyle = '#10141f'; ctx.fillRect(ox, oy, ow, oh * .38); const R = rng(8); crowd(ctx, R, Math.round(ox), Math.round(oy + 2), Math.round(ox + ow), Math.round(oy + oh * .36), .8);
    ctx.fillStyle = '#fff'; for (let k = 0; k < 9; k++) ctx.fillRect(Math.round(ox + Math.random() * ow), Math.round(oy + Math.random() * oh * .4), 2, 2);
    const SCl = [5, 4, 4, 3, 3, 2], HW = [86, 72, 60, 48, 38, 30], L = [];
    for (let r = 5; r >= 0; r--) { const y = 258 - 24 * r + p * 80, z = Math.round(Math.abs(Math.sin(T * 6 + r * 1.2)) * 4); L.push({ a: PA[0][r], kk: 'h', pose: 'f', x: 240 - HW[r] - p * 30, y: y, z: z, sc: SCl[r] }); L.push({ a: PA[1][r], kk: 'a', pose: 'f', x: 240 + HW[r] + p * 30, y: y, z: z, sc: SCl[r] }); }
    L.push({ a: RA, kk: 'r', pose: 'f', x: 240, y: 146 + p * 60, sc: 3 });
    drawList(L, 3);
  }

  const FORM = [[.5, .9], [.14, .72], [.38, .74], [.62, .74], [.86, .72], [.12, .5], [.38, .5], [.62, .5], [.88, .5], [.36, .24], [.64, .24]], POS = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'], NUM = [1, 3, 5, 4, 2, 11, 8, 6, 7, 9, 10];
  const NAMES = [['ALVES', 'BRUNO', 'CARLO', 'DIEGO', 'ELIAS', 'FABIO', 'GASPAR', 'HUGO', 'IVAN', 'JONAS', 'KAI'], ['MORO', 'NAVAS', 'OTTO', 'PAULO', 'QUINN', 'RAFA', 'SILVA', 'TOMAS', 'URI', 'VICO', 'WILL']];
  // The real starting XI for each side, handed in by the engine (see
  // walkoutDraw opts.squadHome / opts.squadAway). `list` is ordered keeper
  // first, then defenders, midfielders and attackers, and `form` is the shape.
  let SQUADS = null;
  function fmtName(s) {
    s = String(s == null ? '' : s);
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.toUpperCase().replace(/[^A-Z0-9' .#!?-]/g, '');
    return s.length > 18 ? s.slice(0, 18) : s;
  }
  function makeSquad(arr) {
    const list = [];
    for (const e of (arr || [])) { if (!e) continue; const nm = fmtName(e.name != null ? e.name : e.n); if (!nm) continue; list.push({ name: nm, pos: String(e.pos || e.p || 'DEF').toUpperCase() }); }
    const d = list.filter(x => x.pos === 'DEF').length, m = list.filter(x => x.pos === 'MID').length, a = list.filter(x => x.pos === 'ATT').length;
    return { list: list, form: d + '-' + m + '-' + a };
  }
  function lineup(T) {
    const tl = T - 20.5, h = tl < 2.25 ? 0 : 1, t = tl - (h ? 2.25 : 0), K = h ? KITS[1] : KITS[0];
    const sqTeam = SQUADS ? (h ? SQUADS.away : SQUADS.home) : null;
    const S = (sqTeam && sqTeam.list && sqTeam.list.length >= 11) ? sqTeam : null;
    const POSL = S ? S.list.map(x => x.pos) : POS;
    const NAMEL = S ? S.list.map(x => x.name) : NAMES[h];
    const formL = S ? S.form : '4-4-2';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0a0e18'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .3; ctx.fillStyle = K.s; ctx.fillRect(0, 0, 236, H); ctx.globalAlpha = 1; ctx.fillStyle = K.s; ctx.fillRect(236, 0, 4, H);
    txt(ctx, K.t, 12, 10, '#fff', 3, 'l', '#000'); txt(ctx, 'STARTING XI', 12, 36, '#ffe45e', 2); txt(ctx, 'MANAGER: A. CODER', 12, 54, '#cfe8d6', 1);
    for (let i = 0; i < 11; i++) { const u = ez(seg(t, .2 + i * .1, .55 + i * .1)), x = 12 - (1 - u) * 260, y = 68 + i * 17; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y, 216, 14); ctx.fillStyle = K.s; ctx.fillRect(x, y, 22, 14); txt(ctx, NUM[i], x + 11, y + 4, K.s === '#f1f1f1' || K.s === '#f2c21b' ? '#10141f' : '#fff', 1, 'c'); txt(ctx, POSL[i], x + 28, y + 4, '#8fb7a0', 1); txt(ctx, NAMEL[i], x + 54, y + 3, '#fff', 2); }
    const px = 252, py = 22, pw = 216, ph = 228;
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k & 1 ? '#2f7a33' : '#37873c'; ctx.fillRect(px, py + k * ph / 8, pw, ph / 8 + 1); }
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(px, py, pw, 1); ctx.fillRect(px, py + ph, pw, 1); ctx.fillRect(px, py, 1, ph); ctx.fillRect(px + pw, py, 1, ph + 1); ctx.fillRect(px, py + ph / 2, pw, 1);
    ctx.fillRect(px + pw * .2, py, pw * .6, 1); ctx.fillRect(px + pw * .2, py, 1, 34); ctx.fillRect(px + pw * .8, py, 1, 34); ctx.fillRect(px + pw * .2, py + 34, pw * .6, 1);
    ctx.fillRect(px + pw * .2, py + ph - 34, pw * .6, 1); ctx.fillRect(px + pw * .2, py + ph - 34, 1, 34); ctx.fillRect(px + pw * .8, py + ph - 34, 1, 34);
    const L = [];
    for (let i = 0; i < 11; i++) { const u = seg(t, .5 + i * .1, .8 + i * .1); if (u <= 0) continue; L.push({ a: PA[h][i], kk: h ? 'a' : 'h', pose: 'f', x: px + FORM[i][0] * pw, y: py + FORM[i][1] * ph + 10 - Math.round((1 - u) * 30), sc: 2 }); }
    drawList(L, 2);
    for (let i = 0; i < 11; i++) if (seg(t, .5 + i * .1, .8 + i * .1) >= 1) txt(ctx, NUM[i], px + FORM[i][0] * pw, py + FORM[i][1] * ph + 13, '#fff', 1, 'c', '#000');
    txt(ctx, formL, px + pw - 4, py + ph + 3, '#ffe45e', 1, 'r');
  }

  const SHOTS = [{ n: 'TUNNEL', a: 0, b: 3.6 }, { n: 'WALKOUT', a: 3.6, b: 8.4 }, { n: 'ESCORTS', a: 8.4, b: 12.4 }, { n: 'ANTHEM', a: 12.4, b: 17 }, { n: 'COIN TOSS', a: 17, b: 20.5 }, { n: 'LINE-UPS', a: 20.5, b: 25 }, { n: 'KICK OFF', a: 25, b: 28.2 }];
  const MSG = ['PLAYERS READY IN THE TUNNEL', 'THE TEAMS WALK OUT', 'MASCOT ESCORTS LEAD THE WAY', 'NATIONAL ANTHEMS', 'CAPTAINS MEET FOR THE COIN TOSS', 'TODAYS STARTING LINE-UPS', 'KICK OFF!'];
  const LAST = 28.2;
  const shotAt = t => { for (let i = 0; i < SHOTS.length; i++) if (t < SHOTS[i].a) return Math.max(0, i - 1); return SHOTS.length - 1; };

  let _score = [0, 0];
  function overlay(T, si) {
    const home = KITS[0], away = KITS[1];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(96, 3, 288, 17);
    ctx.fillStyle = home.s; ctx.fillRect(96, 3, 5, 17); ctx.fillStyle = away.s; ctx.fillRect(379, 3, 5, 17);
    txt(ctx, home.t, 106, 9, '#e8f3ec', 1); txt(ctx, away.t, 374, 9, '#e8f3ec', 1, 'r');
    txt(ctx, _score[0], 214, 5, '#fff', 2, 'c'); txt(ctx, '-', 240, 5, '#8fb7a0', 2, 'c'); txt(ctx, _score[1], 266, 5, '#fff', 2, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(208, 20, 64, 10); txt(ctx, T >= 25 ? "0'" : 'KO 15:00', 240, 23, '#ffe45e', 1, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 3, 86, 14); txt(ctx, 'CAM ' + (si + 1) + ' ' + SHOTS[si].n, 8, 6, '#ffe45e', 1);
    if (si === 3) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 40, W, 22); txt(ctx, 'NATIONAL ANTHEMS', 240, 46, '#ffe45e', 2, 'c', '#000'); }
    if (si === 6) { txt(ctx, 'KICK OFF!', 240, 60, Math.floor(T * 4) & 1 ? '#ffe45e' : '#fff', 5, 'c', '#000'); }
    const msg = MSG[si];
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 236, msg.length * 4 + 14, 13); ctx.fillStyle = home.s; ctx.fillRect(4, 236, 4, 13); txt(ctx, msg, 13, 240, '#fff', 1);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, 266, W, 4); ctx.fillStyle = '#ffe45e'; ctx.fillRect(0, 266, Math.round(clamp(T / LAST, 0, 1) * W), 4);
    ctx.fillStyle = '#000'; for (const s of SHOTS) ctx.fillRect(Math.round(s.a / LAST * W), 266, 1, 4);
  }

  let _lastT = -1, _lastShot = -1, _fl = 0, _key = null;

  /* ---------- main draw ---------- */
  // g      : target 2D context (the PS engine's 480x270 canvas)
  // t      : elapsed seconds since the walkout began (0 .. walkoutDuration)
  // opts   : { home, away, kitHome, kitAway, score:[a,b], squadHome, squadAway }
  function walkoutDraw(g, t, opts) {
    opts = opts || {};
    ctx = g; ctx.imageSmoothingEnabled = false;

    const home = String(opts.home || 'HOME').toUpperCase().slice(0, 13);
    const away = String(opts.away || 'AWAY').toUpperCase().slice(0, 13);
    const kitHome = opts.kitHome || '#2f6fe4', kitAway = opts.kitAway || '#d83a3a';
    const key = kitHome + '|' + kitAway + '|' + home + '|' + away;
    if (key !== _key) {
      SC.clear();
      KITS[0] = { t: home.length > 13 ? home.slice(0, 13) : home, s: kitHome, p: '#f2f2f2' };
      KITS[1] = { t: away.length > 13 ? away.slice(0, 13) : away, s: kitAway, p: '#f2f2f2' };
      _key = key;
    }
    // Real line-ups (names + positions), if the engine supplied them.
    if (Array.isArray(opts.squadHome) && opts.squadHome.length) {
      SQUADS = { home: makeSquad(opts.squadHome), away: makeSquad(opts.squadAway) };
    }
    _score = opts.score || [0, 0];

    t = clamp(t, 0, LAST);
    const dt = (t >= _lastT) ? Math.min(t - _lastT, 0.1) : 0;
    if (t < _lastT) parts = [];
    _lastT = t;

    const si = shotAt(t);
    if (si !== _lastShot) { _lastShot = si; _fl = 0.14; } else _fl = Math.max(0, _fl - dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (si === 0) tunnel(t);
    else if (si === 5) lineup(t);
    else {
      const E = sim(t);
      if (si === 1) side(t, lerp(0, 160, ez(seg(t, 3.6, 8.4))), 0, 1, E, dt);
      else if (si === 2) { const q = playerEnt(5, 1, t), cx = clamp((q ? q.x : 300) - 150, 0, 400); side(t, cx, 98, 2, E, dt); }
      else if (si === 3) side(t, lerp(0, 160, ez(seg(t, 12.4, 17))), 0, 1, E, dt);
      else if (si === 4) side(t, 248, 122, 2, E, dt);
      else side(t, 80, 0, 1, E, dt);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); overlay(t, si);
  }

  // Called by the engine when a fresh walkout starts, so the confetti and the
  // shot-change flash don't leak in from the previous match.
  function walkoutReset() { parts = []; _lastT = -1; _lastShot = -1; _fl = 0; SQUADS = null; }

  window.walkoutDraw = walkoutDraw;
  window.walkoutReset = walkoutReset;
  window.walkoutDuration = LAST;
})();
