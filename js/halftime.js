/* ==========================================================================
   Vantage FC - halftime.js  (V1.34.21)
   --------------------------------------------------------------------------
   The "Half Time" cutscene, ported from Pixel Striker FC - Half Time.html.
   It plays at the half-time break, standing in for the plain break screen,
   and hands over to the Crowd Cam's SECOND HALF countdown before the restart.

   Six shots: the half-time whistle (wide), the touchline, the teams heading
   for the tunnel, the crowd, the manager stopped in the tunnel, and a
   first-half stats card.

   It is a PURE renderer: the engine owns the clock and calls halfTimeDraw()
   with the elapsed time each frame. The engine draws into its own 480x270
   canvas, so this draws straight into the context it is handed.
   ========================================================================== */
(function () {
  "use strict";

  const W = 480, H = 270, WW = 640, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const ez = u => u * u * (3 - 2 * u);
  const lerp = (a, b, k) => a + (b - a) * k;
  function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  // the context every helper draws into (set on each halfTimeDraw call)
  let ctx = null;

  /* ---------- pixel font (3x5) ---------- */
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '#': '101111101111101', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ':': '000010000010000', '%': '101001010100101', '+': '000010111010000' };
  function txt(g, str, x, y, col, s, al, sh) {
    str = String(str).toUpperCase();
    const w = str.length * 4 * s - s;
    x = Math.round(al === 'c' ? x - w / 2 : al === 'r' ? x - w : x); y = Math.round(y);
    for (const pair of (sh ? [[sh, s], [col, 0]] : [[col, 0]])) {
      const c = pair[0], o = pair[1];
      g.fillStyle = c; g.beginPath();
      for (let i = 0; i < str.length; i++) {
        const gl = F[str[i]]; if (!gl) continue;
        for (let k = 0; k < 15; k++) if (gl[k] === '1') g.rect(x + o + i * 4 * s + (k % 3) * s, y + o + ((k / 3) | 0) * s, s, s);
      }
      g.fill();
    }
  }
  function shortName(n, max) {
    n = String(n == null ? '' : n).toUpperCase();
    return n.length > max ? n.slice(0, max) : n;
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
  const PT = (() => { const r = BS.map(s => ('.' + s + '.').split('')); r[6] = '..kkkkkkss'.split(''); r[7] = '..kkkkkk..'.split(''); return r.map(a => a.join('')).concat(pad(LS[0], 1)); })();
  const WB = (() => { const r = BD.map(s => ('...' + s + '...').split('')); r[6] = 'sskkkkkkkkkkss'.split(''); r[7] = '...kkkkkkkk...'.split(''); return r.map(a => a.join('')).concat(pad(legsFB(0), 3)); })();
  function rowsFor(p) {
    if (p === 'f' || p === 'f1' || p === 'f3') return BD.concat(legsFB(+p[1] || 0));
    if (p === 'pt') return PT;
    if (p === 'w') return WB;
    if (p === 'Fd') return BD.slice(0, 9);
    if (p === 'Fu') { const r = BD.slice(0, 9).map(s => ('.' + s + '.').split('')); for (const i of [6, 7]) { r[i][1] = '.'; r[i][8] = '.'; } for (let i = 0; i <= 5; i++) { r[i][1] = i ? 'k' : 's'; r[i][8] = i ? 'k' : 's'; } return r.map(a => a.join('')); }
    return BS.concat(LS[+p[1]]);
  }

  // Home / away kits are filled in from the live match each draw; the officials
  // keep their fixed colours.
  let KIT_H = { t: 'HOME', s: '#2f6fe4', p: '#f2f2f2' };
  let KIT_A = { t: 'AWAY', s: '#d83a3a', p: '#f2f2f2' };
  const KIT_R = { t: 'REF', s: '#e8d020', p: '#15151a' };
  const KIT_S = { t: 'STAFF', s: '#252a38', p: '#252a38' };
  const KIT_L = { t: 'OFFICIAL', s: '#f28a1f', p: '#15151a' };
  const kitOf = k => k === 'h' ? KIT_H : k === 'a' ? KIT_A : k === 's' ? KIT_S : k === 'l' ? KIT_L : KIT_R;
  const SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'], HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];
  const SC = new Map();
  function spr(a, pose, kk) {
    const key = a[0] + '|' + a[1] + pose + kk; let c = SC.get(key); if (c) return c; const K = kitOf(kk);
    c = mk(rowsFor(pose), { h: HAIRS[a[1]], s: SKINS[a[0]], e: '#1a1420', k: K.s, p: K.p, o: K.s, b: '#15131c' }); SC.set(key, c); return c;
  }

  const cc = ['#d94f4f', '#e8c24a', '#4a90d9', '#e8e8e8', '#7bd96a', '#c86ad9', '#e8914a', '#9ad9d6'];
  function crowd(g, R, x0, y0, x1, y1, p) { for (let y = y0; y < y1; y += 4) for (let x = x0 + ((y & 4) ? 2 : 0); x < x1; x += 4) if (R() < p) { g.fillStyle = cc[(R() * 8) | 0]; g.fillRect(x, y, 2, 2); } }
  function ads(g, w, y, h) {
    const ad = ['PIXEL', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE'], ac = ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f'];
    for (let x = 0, i = 0; x < w; x += 80, i++) { g.fillStyle = ac[i % 6]; g.fillRect(x, y, 80, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 78, y, 2, h); txt(g, ad[i % 6], x + 40, y + (h - 5 >> 1), '#fff', 1, 'c'); }
  }
  function mkc(w) { const c = document.createElement('canvas'); c.width = w; c.height = H; return c; }
  const bgW = (() => {
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
    g.fillStyle = '#121722'; g.fillRect(112, 84, 124, 50); g.fillStyle = '#1c2330'; g.fillRect(112, 84, 124, 3); g.fillStyle = '#3a4252'; g.fillRect(116, 126, 116, 8);
    return c;
  })();

  /* ---------- simulation: everyone heads for the tunnel ---------- */
  function poly(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return {
      len: L[L.length - 1],
      at(d) { if (d >= this.len) return pts[pts.length - 1]; for (let i = 1; i < pts.length; i++) if (d <= L[i]) { const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; } return pts[pts.length - 1]; }
    };
  }
  const rs = rng(31), AP = () => [(rs() * 5) | 0, (rs() * 6) | 0];
  const KP = [[300, 196], [270, 160], [270, 232], [236, 196], [200, 150], [200, 240], [170, 196], [130, 150], [130, 240], [90, 196], [34, 196]];
  const HOME_SAY = ['SHAKE IT OFF', 'HEADS UP LADS', 'ONE GOAL BEHIND'], AWAY_SAY = ['NICE AND CALM', 'STAY SHARP', '45 MORE MINS'];
  const WK = [];
  function add(o) { o.mv = poly(o.pts); WK.push(o); }
  for (let k = 0; k < 22; k++) {
    const h = k < 11 ? 1 : 0, i = k % 11, p = KP[i], sx = h ? 640 - p[0] : p[0], sy = p[1], lane = 138 + ((k * 37) % 44);
    add({ a: AP(), kk: h ? 'a' : 'h', ts: 1.4 + .11 * i + (h ? .25 : 0) + (i === 10 ? 1.2 : 0), v: 62 + ((k * 7) % 18), k: k, sx: sx, sy: sy, pre: k % 5 === 0 ? 'w' : 'f',
      pts: [[sx, sy], [lerp(sx, 84, .55), lerp(sy, lane, .7)], [84, lane], [62, 131]],
      say: k % 5 === 1 ? { l: h ? AWAY_SAY : HOME_SAY, t0: 3.5 + k * .1, t1: 11 } : null });
  }
  add({ a: [0, 3], kk: 'r', ts: 2, v: 70, k: 30, sx: 330, sy: 198, pre: T => T < .8 ? 'f' : 'pt', say: { l: ['FWEET!'], t0: .8, t1: 1.7 }, pts: [[330, 198], [150, 160], [84, 152], [62, 131]] });
  add({ a: [1, 2], kk: 'l', ts: 2.2, v: 70, k: 31, sx: 330, sy: 240, pre: 'f', pts: [[330, 240], [150, 176], [84, 160], [62, 131]] });
  add({ a: [3, 4], kk: 'l', ts: 2.3, v: 70, k: 32, sx: 330, sy: 142, pre: 'f', pts: [[330, 142], [150, 146], [84, 146], [62, 131]] });
  add({ a: [2, 5], kk: 's', ts: 2.6, v: 60, k: 33, sx: 150, sy: 131, pre: 'f', say: { l: ['UNLUCKY LADS', 'NO PANIC'], t0: 5, t1: 9.5 }, pts: [[150, 131], [120, 148], [84, 150], [62, 131]] });
  for (let i = 0; i < 4; i++) add({ a: AP(), kk: 'h', ts: 3 + .25 * i, v: 60, k: 40 + i, sx: 130 + 24 * i, sy: 131, pre: 'f', pts: [[130 + 24 * i, 131], [116 + 24 * i, 146], [84, 146], [62, 131]] });
  function ents(T) {
    const L = [];
    for (const w of WK) {
      if (T < w.ts) { L.push({ a: w.a, kk: w.kk, x: w.sx, y: w.sy, pose: typeof w.pre === 'function' ? w.pre(T) : w.pre, flip: w.sx > 200 && typeof w.pre === 'function', ph: w.k, say: w.say }); continue; }
      const d = (T - w.ts) * w.v; if (d >= w.mv.len) continue;
      const q = w.mv.at(d), fr = (Math.floor(T * 6 + w.k) & 1) ? 1 : 3;
      L.push({ a: w.a, kk: w.kk, x: q[0], y: q[1], pose: 'r' + fr, flip: true, alpha: clamp((w.mv.len - d) / 22, 0, 1), ph: w.k, say: w.say });
    }
    return L;
  }
  const fans = []; (() => { const r = rng(77);[58, 84, 110].forEach((y, ri) => { for (let x = 8 + (ri & 1) * 11; x < WW; x += 22) fans.push({ x: x + ((r() * 5) | 0), y: y, kk: x < 320 ? 'h' : 'a', a: AP(), ph: r() * 6 }); }); })();
  function drawFans(T, x0, x1) {
    for (const f of fans) {
      if (f.x < x0 - 20 || f.x > x1 + 20) continue;
      const up = T < 13 || (T > 12.5 && T < 15.5 && Math.sin(T * 3 + f.ph) > .2), j = Math.round(Math.abs(Math.sin(T * 8 + f.ph)) * (up ? 3 : 0)), s = spr(f.a, up && Math.sin(T * 8 + f.ph) > -.3 ? 'Fu' : 'Fd', f.kk);
      ctx.drawImage(s, Math.round(f.x - s.width), f.y - s.height * 2 - j, s.width * 2, s.height * 2);
    }
  }
  function bub(x, y, s) {
    const w = s.length * 4 + 7; x = Math.round(x - w / 2); y = Math.round(y);
    ctx.fillStyle = '#120e18'; ctx.fillRect(x - 1, y - 1, w + 2, 11); ctx.fillRect(Math.round(x + w / 2 - 2), y + 10, 5, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 9); ctx.fillRect(Math.round(x + w / 2 - 1), y + 9, 3, 3); txt(ctx, s, x + 3, y + 2, '#10141f', 1);
  }
  function drawList(list, sc0) {
    list.sort((a, b) => (a.gy !== undefined ? a.gy : a.y) - (b.gy !== undefined ? b.gy : b.y));
    for (const e of list) {
      if (e.fn) { e.fn(); continue; }
      const sc = e.sc || sc0, s = spr(e.a, e.pose, e.kk), w = s.width * sc, h = s.height * sc, z = (e.z || 0) * sc / 3;
      ctx.globalAlpha = e.alpha === undefined ? 1 : e.alpha;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(Math.round(e.x - w * .4), Math.round(e.y - sc / 2), Math.round(w * .8), Math.round(sc * 1.3));
      ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y - z));
      if (e.flip) ctx.scale(-1, 1);
      ctx.drawImage(s, -w / 2, -h, w, h); ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  /* ---------- shots ---------- */
  function side(T, cx, cy, z) {
    ctx.setTransform(z, 0, 0, z, -cx * z, -cy * z); ctx.drawImage(bgW, 0, 0); drawFans(T, cx, cx + W / z);
    const E = ents(T), L = E.slice();
    L.push({ gy: 134, fn() { ctx.fillStyle = '#2a3140'; ctx.fillRect(114, 116, 120, 18); ctx.fillStyle = '#4a5468'; ctx.fillRect(114, 116, 120, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(114, 130, 120, 4); } });
    drawList(L, 3);
    for (const e of E) { if (e.say && T >= e.say.t0 && T < e.say.t1 && (e.alpha === undefined || e.alpha > .5)) { const v = T * .9 + (e.ph || 0) * 1.3, i = Math.floor(v) % e.say.l.length; if (v % 1 < .72 || e.say.l.length === 1) bub(e.x, e.y - 58 - ((e.ph || 0) % 2) * 11, e.say.l[i]); } }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function inside(T) {
    const tl = T - 15.5, g = seg(tl, 0, 4.5), ow = 90 + 20 * g, oh = ow * .72, ox = 240 - ow / 2, oy = 96 - oh / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0a0810'; ctx.fillRect(0, 0, W, H);
    const quad = (c, p) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.fill(); };
    quad('#17131f', [[0, 0], [W, 0], [ox + ow, oy], [ox, oy]]); quad('#1f1a33', [[0, H], [W, H], [ox + ow, oy + oh], [ox, oy + oh]]);
    quad('#110d19', [[0, 0], [ox, oy], [ox, oy + oh], [0, H]]); quad('#110d19', [[W, 0], [ox + ow, oy], [ox + ow, oy + oh], [W, H]]);
    for (let k = 0; k < 6; k++) { const u = Math.pow(k / 6, 1.6), w = lerp(70, 8, k / 6); ctx.fillStyle = '#c4d4ff'; ctx.fillRect(240 - w / 2, lerp(3, oy - 4, u), w, 2); }
    ctx.fillStyle = '#d8f0d8'; ctx.fillRect(ox, oy, ow, oh); ctx.fillStyle = '#37873c'; ctx.fillRect(ox, oy + oh * .62, ow, oh * .38); ctx.fillStyle = '#10141f'; ctx.fillRect(ox, oy, ow, oh * .38);
    const L = [];
    for (let i = 0; i < 11; i++) {
      const ts = .15 + .34 * i, u = seg(tl, ts, ts + 3.4); if (u <= 0 || u >= 1) continue;
      const e = u * u, y = lerp(128, 300, e), sc = Math.max(2, Math.round(lerp(2, 7, e))), xo = lerp(8, 175, e), fr = 'f' + ((Math.floor(tl * 5 + i) & 1) ? 1 : 3);
      L.push({ a: AP2[0][i], kk: 'h', pose: fr, x: 240 - xo, y: y, sc: sc }); L.push({ a: AP2[1][i], kk: 'a', pose: fr, x: 240 + xo, y: y, sc: sc });
    }
    const rx = 64, ry = 262;
    L.push({ a: [2, 0], kk: 'l', pose: 'pt', x: rx, y: ry, sc: 6 });
    L.push({ gy: ry + 1, fn() { ctx.fillStyle = '#222'; ctx.fillRect(rx + 22, ry - 52, 10, 12); ctx.fillStyle = '#9aa4b8'; ctx.fillRect(rx + 24, ry - 56, 6, 5); } });
    const mu = seg(tl, 2, 3.2); L.push({ a: [2, 5], kk: 's', pose: 'f', x: lerp(250, 178, ez(mu)), y: lerp(150, 240, ez(mu)), sc: Math.round(lerp(3, 5, mu)) });
    drawList(L, 3);
    if (tl > 3.2 && tl < 4.5) { const q = Math.floor((tl - 3.2) * 1.6); bub(rx + 14, ry - 120, ['HOW DO YOU SEE IT?', 'WE GO AGAIN!'][q % 2]); }
    if (tl > 2.5 && tl < 3.2) bub(178, 150, 'GIVE ME A MINUTE');
  }
  const AP2 = [Array.from({ length: 11 }, AP), Array.from({ length: 11 }, AP)];
  const p2 = n => String(n).padStart(2, '0');

  // stats card state, filled from the live match each draw
  let S = { score: [0, 0], home: 'HOME', away: 'AWAY', rows: [], scorerH: '', scorerA: '' };
  function stats(T) {
    const tl = T - 20, home = KIT_H, away = KIT_A;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0a0e18'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .25; ctx.fillStyle = home.s; ctx.fillRect(0, 0, 240, H); ctx.fillStyle = away.s; ctx.fillRect(240, 0, 240, H); ctx.globalAlpha = 1;
    txt(ctx, 'HALF TIME', 240, 12, '#ffe45e', 5, 'c', '#6b3300');
    txt(ctx, home.t, 120, 52, '#fff', 2, 'c', '#000'); txt(ctx, away.t, 360, 52, '#fff', 2, 'c', '#000');
    txt(ctx, S.score[0] + ' - ' + S.score[1], 240, 70, '#fff', 5, 'c', '#000');
    txt(ctx, S.scorerH, 120, 100, '#9fc3ad', 1, 'c'); txt(ctx, S.scorerA, 360, 100, '#ffe45e', 1, 'c');
    const rows = S.rows;
    rows.forEach((r, i) => {
      const y = 118 + i * 24, u = ez(seg(tl, .3 + i * .25, .9 + i * .25)), tot = r[1] + r[2], bw = 300;
      txt(ctx, r[0], 240, y, '#cfe8d6', 1, 'c');
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(90, y + 8, bw, 8);
      ctx.fillStyle = home.s; ctx.fillRect(90, y + 8, Math.round(bw * r[1] / tot * u), 8); ctx.fillStyle = away.s; const aw = Math.round(bw * r[2] / tot * u); ctx.fillRect(90 + bw - aw, y + 8, aw, 8);
      ctx.fillStyle = '#fff'; ctx.fillRect(240, y + 7, 1, 10);
      txt(ctx, Math.round(r[1] * u) + r[3], 80, y + 9, '#fff', 1, 'r'); txt(ctx, Math.round(r[2] * u) + r[3], 400, y + 9, '#fff', 1);
    });
    const rem = Math.max(0, 900 - Math.floor(tl * 40));
    txt(ctx, 'SECOND HALF IN ' + p2(Math.floor(rem / 60)) + ':' + p2(rem % 60), 240, 246, '#ffe45e', 1, 'c');
  }

  const SHOTS = [{ n: 'WIDE', a: 0, b: 4 }, { n: 'TOUCHLINE', a: 4, b: 8.5 }, { n: 'TUNNEL MOUTH', a: 8.5, b: 12.5 }, { n: 'CROWD', a: 12.5, b: 15.5 }, { n: 'IN THE TUNNEL', a: 15.5, b: 20 }, { n: 'HT STATS', a: 20, b: 24.5 }];
  const MSG = ['THE WHISTLE GOES FOR HALF TIME', 'TEAMS HEAD FOR THE TUNNEL', 'OFF THE PITCH AND OUT OF SIGHT', 'APPLAUSE AND BOOS FROM THE STANDS', 'MANAGER STOPPED BY THE REPORTER', 'FIRST HALF IN NUMBERS'];
  const LAST = 24.5;
  const BOOS = (() => { const r = rng(9); return Array.from({ length: 9 }, (_, i) => ({ x: 30 + r() * 420, y: 90 + r() * 130, p: r() * 3, s: 2 + (i % 2), w: i % 3 ? 'CLAP!' : 'BOO!' })); })();
  let lastShot = -1, fl = 0, prevT = null;
  const shotAt = t => { for (let i = 0; i < SHOTS.length; i++) if (t < SHOTS[i].b) return i; return SHOTS.length - 1; };
  function overlay(T, si) {
    const home = KIT_H, away = KIT_A;
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(96, 3, 288, 17); ctx.fillStyle = home.s; ctx.fillRect(96, 3, 5, 17); ctx.fillStyle = away.s; ctx.fillRect(379, 3, 5, 17);
    txt(ctx, home.t, 106, 9, '#e8f3ec', 1); txt(ctx, away.t, 374, 9, '#e8f3ec', 1, 'r');
    txt(ctx, S.score[0], 214, 5, '#fff', 2, 'c'); txt(ctx, '-', 240, 5, '#8fb7a0', 2, 'c'); txt(ctx, S.score[1], 266, 5, '#fff', 2, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(216, 20, 48, 10); txt(ctx, T < .8 ? "45+2'" : 'HT', 240, 23, '#ffe45e', 1, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 3, 86, 14); txt(ctx, 'CAM ' + (si + 1) + ' ' + SHOTS[si].n, 8, 6, '#ffe45e', 1);
    if (si === 3) { txt(ctx, 'HALF TIME', 240, 40, '#ffe45e', 4, 'c', '#000'); for (const b of BOOS) { const v = ((T * .6 + b.p) % 1); txt(ctx, b.w, b.x, b.y - v * 30, '#fff', b.s, 'c', '#000'); } }
    if (si !== 5) { const msg = MSG[si]; ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 236, msg.length * 4 + 14, 13); ctx.fillStyle = home.s; ctx.fillRect(4, 236, 4, 13); txt(ctx, msg, 13, 240, '#fff', 1); }
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, 266, W, 4); ctx.fillStyle = '#ffe45e'; ctx.fillRect(0, 266, Math.round(clamp(T / LAST, 0, 1) * W), 4);
    ctx.fillStyle = '#000'; for (const s of SHOTS) ctx.fillRect(Math.round(s.a / LAST * W), 266, 1, 4);
    if (fl > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (fl / .14 * .7).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  // Build the five stat rows from the engine's live match stats.
  function buildRows(st) {
    const pair = k => { const a = st && st[k]; return [(a && isFinite(a[0])) ? a[0] : 0, (a && isFinite(a[1])) ? a[1] : 0]; };
    const poss = pair('poss'), tot = poss[0] + poss[1];
    const ph = tot > 0 ? Math.round(poss[0] / tot * 100) : 50, pa = tot > 0 ? 100 - ph : 50;
    const shots = pair('shots'), on = pair('on'), chances = pair('chances'), saves = pair('saves');
    return [
      ['POSSESSION', ph, pa, '%'],
      ['SHOTS', shots[0], shots[1], ''],
      ['ON TARGET', on[0], on[1], ''],
      ['CHANCES', chances[0], chances[1], ''],
      ['SAVES', saves[0], saves[1], '']
    ];
  }

  /* ---------- main draw ---------- */
  // g    : target 2D context (the PS engine's 480x270 canvas)
  // t    : elapsed seconds since the half-time break began
  // opts : { home, away, kitHome, kitAway, score:[h,a], stats, scorers:{home,away} }
  function halfTimeDraw(g, t, opts) {
    opts = opts || {};
    ctx = g;
    t = Math.max(0, t || 0);

    const kitHome = opts.kitHome || '#2f6fe4', kitAway = opts.kitAway || '#d83a3a';
    if (KIT_H.s !== kitHome || KIT_A.s !== kitAway) { SC.clear(); KIT_H = { t: shortName(opts.home || 'HOME', 14), s: kitHome, p: '#f2f2f2' }; KIT_A = { t: shortName(opts.away || 'AWAY', 14), s: kitAway, p: '#f2f2f2' }; }
    const score = Array.isArray(opts.score) ? opts.score : [0, 0];
    const scorers = opts.scorers || {};
    S = {
      score: score,
      home: KIT_H.t, away: KIT_A.t,
      rows: buildRows(opts.stats),
      scorerH: scorers.home || (score[0] === 0 ? 'NO GOALS YET' : ''),
      scorerA: scorers.away || (score[1] === 0 ? 'NO GOALS YET' : '')
    };

    // flash on each shot change, and a small dt for the decay
    const dt = prevT === null ? 0 : clamp(t - prevT, 0, .05);
    if (prevT !== null && t < prevT) { lastShot = -1; fl = 0; }
    prevT = t;
    const si = shotAt(t);
    if (si !== lastShot) { lastShot = si; fl = .14; } else fl = Math.max(0, fl - dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (si === 0) side(t, lerp(100, 40, ez(seg(t, 0, 4))), 0, 1);
    else if (si === 1) side(t, lerp(80, 0, ez(seg(t, 4, 8.5))), 0, 1);
    else if (si === 2) side(t, 18, 60, 2);
    else if (si === 3) side(t, 200, 2, 2);
    else if (si === 4) inside(t);
    else stats(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0); overlay(t, si);
  }

  function halfTimeReset() { SC.clear(); lastShot = -1; fl = 0; prevT = null; }

  window.halfTimeDraw = halfTimeDraw;
  window.halfTimeReset = halfTimeReset;
  window.halfTimeDuration = LAST;
})();
