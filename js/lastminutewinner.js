/* ==========================================================================
   Vantage FC - lastminutewinner.js  (V1.34.11)
   --------------------------------------------------------------------------
   The "Last Minute Winner" cutscene, ported from
   Pixel Striker FC - Last Minute Winner.html.

   It plays once when a closing-time goal puts a side ahead to win. Like
   crowdcam.js it is a PURE renderer: the engine owns the clock and calls
   lastMinuteWinnerDraw(g, t, opts) each frame, so the module keeps almost no
   animation state of its own (only a sprite cache and a tiny bit of camera /
   flash smoothing). The engine draws into its own 480x270 canvas, so this
   draws straight into the passed context.

   opts = { home, away, kitHome, kitAway, scoreA, scoreB, minute, scorerNum }
     home/away    - display names (home is the side that scored the winner)
     kitHome/Away - shirt colours
     scoreA/B     - the scoreline AFTER the goal (A = winners)
     minute       - pitch-clock label for the goal, e.g. "90+3'"
     scorerNum    - shirt number of the scorer
   ========================================================================== */
(function () {
  "use strict";

  const W = 480, H = 270, WW = 1040, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ez = u => u * u * (3 - 2 * u);
  function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  /* ---------- pixel font (3x5) ---------- */
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '#': '101111101111101', '!': '010010010000010', '+': '000010111010000', '.': '000000000000010', '<': '001010100010001', '>': '100010001010100' };
  function txt(g, str, x, y, col, s, al, sh) {
    str = String(str).toUpperCase();
    const w = str.length * 4 * s - s; x = Math.round(al === 'c' ? x - w / 2 : al === 'r' ? x - w : x); y = Math.round(y);
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
  const BU = ['..hhhh..', '.hhhhhh.', '.hhhhhh.', '.hhhhhh.', '..hhhh..', '.kkkkkk.', 'skkkkkks', 'skkkkkks', '.kkkkkk.', '.pppppp.'];
  const BS = ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhsse.', '..hsss..', '.kkkkkk.', '.kkkkks.', '.kkkkks.', '.kkkkkk.', '.pppppp.'];
  const LS = { 0: ['..pppp..', '..oooo..', '..oooo..', '..bbbbb.'], 1: ['..pppp..', '.oo..oo.', '.oo..oo.', '.bbb.bbb'], 3: ['..pppp..', '..oo.oo.', '..oo.oo.', '..bbbbbb'] };
  const pad = (a, n) => a.map(s => '.'.repeat(n) + s + '.'.repeat(n));
  const legsFB = fr => { const n = ['p', 'o', 'o', 'b'], l = ['p', 'o', 'b', '.'], r = []; for (let i = 0; i < 4; i++) { const a = fr === 1 ? l[i] : n[i], b = fr === 3 ? l[i] : n[i]; r.push('.' + a + a + '..' + b + b + '.'); } return r; };
  const UPB = (() => {
    const r = BD.map(s => ('.' + s + '.').split(''));
    for (const i of [6, 7]) { r[i][1] = '.'; r[i][8] = '.'; }
    for (let i = 0; i <= 5; i++) { r[i][1] = i ? 'k' : 's'; r[i][8] = i ? 'k' : 's'; }
    return r.map(a => a.join(''));
  })();
  const WB = (() => {
    const r = BD.map(s => ('...' + s + '...').split(''));
    r[6] = 'sskkkkkkkkkkss'.split(''); r[7] = ('...kkkkkkkk...').split(''); return r.map(a => a.join(''));
  })();
  function rowsFor(p) {
    if (p === 'f') return BD.concat(legsFB(0));
    if (p === 'fu') return UPB.concat(pad(legsFB(0), 1));
    if (p === 'k') return UPB.concat(pad(['.pp..pp.', '.bb..bb.'], 1));
    if (p === 'kd') return BD.concat(['.pp..pp.', '.bb..bb.']);
    if (p === 'b') return BU.concat(legsFB(0));
    if (p === 'Fd') return BD.slice(0, 9);
    if (p === 'Fu') return UPB.slice(0, 9);
    if (p[0] === 'w') return WB.concat(pad(legsFB(+p[1] || 0), 3));
    return BS.concat(LS[+p[1]]);
  }

  const SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'];
  const HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];
  const EXTRA = [['#1fa65a', '#0d3b24'], ['#f2c21b', '#222a55'], ['#8a4fd6', '#e9e0ff'], ['#f2812b', '#1c1c1c'], ['#2b2b33', '#d5d5d5'], ['#f1f1f1', '#2f6fe4']];
  const STAFF = ['#252a38', '#252a38'];

  const SC = new Map();
  let KITS = null, kitKey = null;
  function ensureKits(opts) {
    const key = (opts.kitHome || '') + '|' + (opts.kitAway || '');
    if (key === kitKey && KITS) return;
    KITS = [{ s: opts.kitHome || '#2f6fe4', p: '#f2f2f2' }, { s: opts.kitAway || '#d83a3a', p: '#f2f2f2' }]
      .concat(EXTRA.map(e => ({ s: e[0], p: e[1] })), [{ s: STAFF[0], p: STAFF[1] }]);
    kitKey = key;
  }
  const kitOf = k => typeof k === 'number' ? KITS[k] : k === 'h' ? KITS[0] : k === 'a' ? KITS[1] : KITS[8];
  function spr(a, pose, kk) {
    const K = kitOf(kk);
    const key = a[0] + '|' + a[1] + pose + K.s + K.p;
    let c = SC.get(key); if (c) return c;
    c = mk(rowsFor(pose), { h: HAIRS[a[1]], s: SKINS[a[0]], e: '#1a1420', k: K.s, p: K.p, o: K.s, b: '#15131c' });
    SC.set(key, c); return c;
  }
  const BALL = mk(['.www.', 'wkwww', 'wwwww', 'wwwkw', '.www.'], { w: '#f6f6f2', k: '#2a2a33' });

  /* ---------- backgrounds (generic; independent of team colours) ---------- */
  const cc = ['#d94f4f', '#e8c24a', '#4a90d9', '#e8e8e8', '#7bd96a', '#c86ad9', '#e8914a', '#9ad9d6'];
  function crowd(g, R, x0, y0, x1, y1, p) { for (let y = y0; y < y1; y += 4) for (let x = x0 + ((y & 4) ? 2 : 0); x < x1; x += 4) if (R() < p) { g.fillStyle = cc[(R() * 8) | 0]; g.fillRect(x, y, 2, 2); } }
  function ads(g, w, y, h) { const ad = ['PIXEL', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE'], ac = ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f']; for (let x = 0, i = 0; x < w; x += 80, i++) { g.fillStyle = ac[i % 6]; g.fillRect(x, y, 80, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 78, y, 2, h); txt(g, ad[i % 6], x + 40, y + (h - 5 >> 1), '#fff', 1, 'c'); } }
  function mkc(w) { const c = document.createElement('canvas'); c.width = w; c.height = H; return c; }
  const bgS = (() => {
    const c = mkc(WW), g = c.getContext('2d'), R = rng(3);
    g.fillStyle = '#0b0e17'; g.fillRect(0, 0, WW, 128);
    for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(40,55,95,' + (.06 * k).toFixed(2) + ')'; g.fillRect(0, k * 6, WW, 6); }
    crowd(g, R, 0, 40, WW, 112, .4);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 40, WW, 12);
    for (const x of [60, 340, 620, 900]) { g.fillStyle = 'rgba(255,250,220,.5)'; g.fillRect(x - 6, 8, 12, 5); g.fillStyle = 'rgba(255,250,220,.06)'; g.beginPath(); g.moveTo(x - 8, 12); g.lineTo(x + 8, 12); g.lineTo(x + 70, 128); g.lineTo(x - 70, 128); g.fill(); }
    ads(g, WW, 114, 14);
    for (let x = 0, k = 0; x < WW; x += 40, k++) { g.fillStyle = k & 1 ? '#2f7a33' : '#37873c'; g.fillRect(x, 128, 40, H - 128); }
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 134, WW, 1); g.fillRect(0, 246, WW, 1); g.fillRect(880, 134, 1, 113); g.fillRect(1000, 134, 1, 113);
    g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, 247, WW, 23);
    g.fillStyle = '#121722'; g.fillRect(138, 84, 274, 50); g.fillStyle = '#1c2330'; g.fillRect(138, 84, 274, 3); g.fillStyle = '#3a4252'; g.fillRect(142, 126, 266, 8);
    g.fillStyle = 'rgba(8,20,12,.7)'; g.fillRect(1000, 178, 32, 36); g.fillStyle = 'rgba(230,240,235,.45)';
    for (let x = 1000; x < 1032; x += 3) g.fillRect(x, 178, 1, 36); for (let y = 178; y < 214; y += 3) g.fillRect(1000, y, 32, 1);
    g.fillStyle = '#fff'; g.fillRect(999, 176, 3, 40); g.fillRect(999, 176, 34, 2); g.fillRect(1031, 176, 2, 38);
    for (const y of [134, 246]) { g.fillStyle = '#e8e8e8'; g.fillRect(1030, y - 24, 2, 24); g.fillStyle = '#ffe45e'; g.fillRect(1032, y - 24, 8, 6); }
    return c;
  })();
  const bgA = (() => {
    const c = mkc(W), g = c.getContext('2d'), R = rng(4);
    g.fillStyle = '#0b0e17'; g.fillRect(0, 0, W, H); crowd(g, R, 0, 0, W, 40, .8); ads(g, W, 44, 12);
    for (let x = 0, k = 0; x < W; x += 30, k++) { g.fillStyle = k & 1 ? '#2f7a33' : '#37873c'; g.fillRect(x, 58, 30, 170); }
    g.fillStyle = '#10141f'; g.fillRect(0, 228, W, 42); crowd(g, R, 0, 232, W, 270, .8); ads(g, W, 226, 8);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 69, W, 1); g.fillRect(0, 217, W, 1); g.fillRect(460, 69, 1, 149); g.fillRect(386, 100, 74, 1); g.fillRect(386, 186, 74, 1); g.fillRect(386, 100, 1, 87);
    g.beginPath(); g.arc(386, 143, 26, -1.1, 1.1); g.strokeStyle = 'rgba(255,255,255,.6)'; g.stroke();
    g.fillStyle = 'rgba(8,20,12,.7)'; g.fillRect(460, 125, 18, 36); g.fillStyle = 'rgba(230,240,235,.45)'; for (let y = 125; y < 161; y += 3) g.fillRect(460, y, 18, 1);
    g.fillStyle = '#121722'; g.fillRect(66, 52, 126, 14); g.fillStyle = '#3a4252'; g.fillRect(68, 62, 122, 3);
    return c;
  })();
  const bgB = (() => {
    const c = mkc(W), g = c.getContext('2d'), R = rng(6);
    g.fillStyle = '#0b0e17'; g.fillRect(0, 0, W, 110); crowd(g, R, 0, 10, W, 92, .85); ads(g, W, 94, 14);
    const ys = [108, 114, 121, 129, 139, 151, 165, 182, 202, 226, 270];
    ys.forEach((y, i) => { if (i < ys.length - 1) { g.fillStyle = i & 1 ? '#2f7a33' : '#37873c'; g.fillRect(0, y, W, ys[i + 1] - y); } });
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(40, 232, 400, 2);
    g.fillRect(120, 214, 240, 1); g.fillRect(120, 214, 1, 18); g.fillRect(360, 214, 1, 18);
    return c;
  })();

  /* ---------- simulation (all world coordinates) ---------- */
  const PC = [1004, 226];
  const SLOT = [[0, 0, 0], [-18, -6, 0], [16, -4, 0], [-4, 8, 0], [-30, 2, 0], [26, 6, 0], [-12, -14, 18], [10, -12, 18], [0, -2, 34], [-24, -4, 24], [20, 0, 22], [-6, 10, 16], [4, -18, 10]];
  function poly(pts) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return {
      len: L[L.length - 1], at(d) {
        if (d >= this.len) return pts[pts.length - 1];
        for (let i = 1; i < pts.length; i++) if (d <= L[i]) { const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; }
        return pts[pts.length - 1];
      }
    };
  }
  const rs = rng(12), AP = () => [(rs() * 5) | 0, (rs() * 6) | 0];
  const runners = [];
  [[700, 190], [740, 222], [770, 200]].forEach((s, k) => {
    const sl = SLOT[1 + k]; runners.push({ a: AP(), kk: 'h', ts: 0.2 + k * .08, v: 190, slot: 1 + k, ph: k, mv: poly([s, [PC[0] + sl[0], PC[1] + sl[1]]]), pre: () => ({ x: s[0], y: s[1], pose: 'r0' }) });
  });
  for (let i = 0; i < 9; i++) {
    const x0 = 150 + 28 * i, sl = SLOT[4 + i], lane = 160 + (i * 29) % 56, ts = [0.35, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 0.98][i];
    runners.push({
      a: AP(), kk: i < 6 ? 'h' : 's', ts: ts, v: i < 6 ? 175 + ((i * 13) % 35) : 150 + i * 3, slot: 4 + i, ph: i * 1.3, style: i % 3 === 0 ? 'w' : 'r',
      mv: poly([[x0, 131], [x0 + 24, 152], [x0 + 70, lane], [930, lane + (i * 7) % 9], [PC[0] + sl[0], PC[1] + sl[1]]]),
      pre: T => T < 5.6 ? { x: x0, y: 131, pose: 'f' } : { x: x0, y: 131, pose: 'fu', z: Math.round(Math.abs(Math.sin(T * 8 + i)) * 9) }
    });
  }
  function runnerAt(r, T) {
    if (T < r.ts) { const p = r.pre(T); p.a = r.a; p.kk = r.kk; return p; }
    const d = (T - r.ts) * r.v;
    if (d < r.mv.len) { const p = r.mv.at(d), f = (Math.floor(T * 9 + r.ph) & 1) ? 1 : 3; return { a: r.a, kk: r.kk, x: p[0], y: p[1], pose: (r.style === 'w' ? 'w' : 'r') + f }; }
    const sl = SLOT[r.slot], ta = r.ts + r.mv.len / r.v;
    return { a: r.a, kk: r.kk, x: PC[0] + sl[0], y: PC[1] + sl[1], pose: 'fu', z: sl[2] * ez(seg(T - ta, 0, .5)) + Math.round(Math.abs(Math.sin(T * 7 + r.ph)) * (4 + sl[2] / 6)) };
  }
  const SA = [1, 1], OA = [[3, 0], [0, 2], [4, 5]], GA = [2, 0];
  function scorerAt(T) {
    const o = { a: SA, kk: 'h' };
    if (T < .6) return Object.assign(o, { x: 800, y: 205, pose: 'r0' });
    if (T < .9) return Object.assign(o, { x: 800, y: 205, pose: 'r1' });
    if (T < 1.6) return Object.assign(o, { x: 800, y: 205, pose: 'r0' });
    if (T < 3.6) { const u = seg(T, 1.6, 3.6); return Object.assign(o, { x: 800 + 204 * u, y: 205 + 25 * u, pose: 'w' + (Math.floor(T * 9) & 1 ? 1 : 3) }); }
    return Object.assign(o, { x: PC[0], y: PC[1] + 4, pose: 'k' });
  }
  function ballAt(T) {
    if (T < .6) return { x: 808, y: 207, z: 0 };
    if (T < 1.4) { const u = (T - .6) / .8; return { x: 808 + 200 * u, y: 207 - 11 * u, z: 46 * Math.sin(Math.PI * u) * .9 + 22 * u }; }
    return { x: 1008 + 6 * seg(T, 1.4, 1.7), y: 196, z: 22 * (1 - seg(T, 1.4, 2.2)) };
  }
  function others(T) {
    const L = [], d = T > 1.5;
    L.push({ a: OA[0], kk: 'a', x: 900, y: 214, pose: d ? 'kd' : 'r0', flip: !d });
    L.push({ a: OA[1], kk: 'a', x: 870 + (d ? Math.round(Math.sin(T * 30)) : 0), y: 192, pose: d ? 'f' : 'r0', flip: !d });
    L.push({ a: OA[2], kk: 'a', x: 944, y: 234, pose: d ? 'kd' : 'r0', flip: !d });
    if (T < 1) L.push({ a: GA, kk: 'a', x: 985, y: 212, pose: 'f' });
    else if (T < 1.5) { const u = seg(T, 1, 1.5); L.push({ a: GA, kk: 'a', x: 985 + 18 * u, y: 212, z: Math.round(16 * Math.sin(u * Math.PI)), pose: 'r1', rot: u > .5 ? Math.PI / 2 : 0 }); }
    else L.push({ a: GA, kk: 'a', x: 1004, y: 222, pose: 'r0', rot: Math.PI / 2 });
    return L;
  }
  const fans = [];
  (() => { const r = rng(77);[58, 84, 110].forEach((y, ri) => { for (let x = 8 + (ri & 1) * 11; x < WW; x += 22) fans.push({ x: x + ((r() * 5) | 0), y: y, kk: x > 600 && r() < .8 ? 'h' : (r() * 8) | 0, a: [(r() * 5) | 0, (r() * 6) | 0], ph: r() * 6 }); }); })();
  function drawFans(T, x0, x1) {
    for (const f of fans) {
      if (f.x < x0 - 20 || f.x > x1 + 20) continue;
      const up = T > 1.4, j = Math.round(Math.abs(Math.sin(T * 6 + f.ph)) * (up ? 6 : 1)), s = spr(f.a, up ? 'Fu' : 'Fd', f.kk);
      ctx.drawImage(s, Math.round(f.x - s.width), f.y - s.height * 2 - j, s.width * 2, s.height * 2);
    }
  }

  /* ---------- drawing ---------- */
  let ctx = null, ents = [];
  function drawList(list, m, sc0) {
    list.sort((a, b) => (a.gy !== undefined ? a.gy : a.y) - (b.gy !== undefined ? b.gy : b.y));
    for (const e of list) {
      if (e.fn) { e.fn(); continue; }
      const sc = e.sc || sc0, p = m(e.x, e.y), s = spr(e.a, e.pose, e.kk), w = s.width * sc, h = s.height * sc, z = (e.z || 0) * sc / 3;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(Math.round(p[0] - w * .4), Math.round(p[1] - sc / 2), Math.round(w * .8), Math.round(sc * 1.3));
      ctx.save(); ctx.translate(Math.round(p[0]), Math.round(p[1] - z));
      if (e.rot) { ctx.translate(0, -h / 2); ctx.rotate(e.rot); ctx.translate(0, h / 2); }
      if (e.flip) ctx.scale(-1, 1);
      ctx.drawImage(s, -w / 2, -h, w, h); ctx.restore();
    }
  }
  const ID = (x, y) => [x, y];
  function sim(T) {
    const L = [scorerAt(T)].concat(others(T));
    for (const r of runners) L.push(runnerAt(r, T));
    return L;
  }
  function drawBall(T, m, sc) {
    const b = ballAt(T), p = m(b.x, b.y);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(Math.round(p[0] - sc * 1.2), Math.round(p[1]), Math.round(sc * 2.4), Math.max(1, Math.round(sc * .6)));
    ctx.drawImage(BALL, Math.round(p[0] - BALL.width * sc / 2), Math.round(p[1] - b.z * sc / 3 - BALL.height * sc / 2), BALL.width * sc, BALL.height * sc);
  }
  function side(T, cx, cy, z) {
    ctx.setTransform(z, 0, 0, z, -cx * z, -cy * z); ctx.drawImage(bgS, 0, 0); drawFans(T, cx, cx + W / z);
    const L = ents.map(e => Object.assign({}, e));
    L.push({ gy: 134, fn() { ctx.fillStyle = '#2a3140'; ctx.fillRect(140, 116, 270, 18); ctx.fillStyle = '#4a5468'; ctx.fillRect(140, 116, 270, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(140, 130, 270, 4); } });
    drawList(L, ID, 3); drawBall(T, ID, 2); ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function aerial(T) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bgA, 0, 0);
    const m = (x, y) => [x * .46, 20 + (y - 100) * 1.45];
    drawList(ents.map(e => Object.assign({}, e)), m, 2); drawBall(T, m, 1);
  }
  const AP2 = [[0, 3], [3, 1]];
  function behind(T) {
    const tb = T - 2.8; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bgB, 0, 0);
    const L = [{ a: GA, kk: 'a', pose: 'b', x: 170, y: 238, rot: -Math.PI / 2, sc: 4 }];
    const u = seg(tb, .3, 2), f = Math.floor(T * 9) & 1 ? 'w1' : 'w3';
    if (tb >= 2) { const v = ez(seg(tb, 2, 2.6)); L.push({ a: SA, kk: 'h', pose: 'k', x: 410 + 36 * v, y: 230, sc: 5 }); }
    else L.push({ a: SA, kk: 'h', pose: tb < .3 ? 'fu' : f, x: 240 + 170 * u, y: 128 + 100 * u * u, sc: 2 + Math.round(3 * u) });
    [[190, 126, 360], [300, 128, 390]].forEach((m, k) => {
      const w = ez(seg(tb, .6 + k * .2, 2.4));
      L.push({ a: AP2[k], kk: 'h', pose: w > 0 && w < 1 ? (Math.floor(T * 9 + k) & 1 ? 'w1' : 'w3') : 'fu', x: m[0] + (m[2] - m[0]) * w, y: m[1] + (205 - m[1]) * w, sc: 2 + Math.round(2 * w), z: w <= 0 ? Math.round(Math.abs(Math.sin(T * 8 + k)) * 6) : 0 });
    });
    drawList(L, ID, 3);
    ctx.drawImage(BALL, 336, 60, 21, 21);
    for (let k = 0; k < 3; k++) { const r = ((tb * 50 + k * 14) % 44) + 4; ctx.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - r / 48)).toFixed(2) + ')'; for (let a = 0; a < TAU; a += .09) ctx.fillRect(Math.round(346 + Math.cos(a) * r), Math.round(70 + Math.sin(a) * r * .8), 2, 2); }
    ctx.fillStyle = 'rgba(255,255,255,.13)'; for (let x = 66; x < 414; x += 6) ctx.fillRect(x, 22, 1, 248); for (let y = 22; y < 270; y += 6) ctx.fillRect(66, y, 348, 1);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(56, 12, 368, 10); ctx.fillRect(56, 12, 10, 258); ctx.fillRect(414, 12, 10, 258);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(56, 19, 368, 3); ctx.fillRect(62, 22, 4, 248); ctx.fillRect(414, 22, 4, 248);
  }
  const SHOTS = [{ n: 'BENCH RUSH', a: 0, b: 4.5 }, { n: 'PILE', a: 4.5, b: 7.5 }];
  const CONTENT_END = SHOTS[1].b;
  const shotAt = t => { for (let i = 0; i < SHOTS.length; i++) if (t < SHOTS[i].b) return i; return SHOTS.length - 1; };

  function shortName(n, max) { n = String(n == null ? '' : n).toUpperCase(); return n.length > max ? n.slice(0, max) : n; }

  function overlay(T, si, O, sA, fl) {
    const home = KITS[0], away = KITS[1];
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(96, 3, 288, 17); ctx.fillStyle = home.s; ctx.fillRect(96, 3, 5, 17); ctx.fillStyle = away.s; ctx.fillRect(379, 3, 5, 17);
    txt(ctx, O.home, 106, 9, '#e8f3ec', 1); txt(ctx, O.away, 374, 9, '#e8f3ec', 1, 'r');
    txt(ctx, sA, 214, 5, '#fff', 2, 'c'); txt(ctx, '-', 240, 5, '#8fb7a0', 2, 'c'); txt(ctx, O.scoreB, 266, 5, '#fff', 2, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(212, 20, 56, 10); txt(ctx, T >= CONTENT_END ? 'FULL TIME' : O.minute, 240, 23, '#ffe45e', 1, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 3, 86, 14); txt(ctx, 'CAM ' + (si + 1) + ' ' + SHOTS[si].n, 8, 6, '#ffe45e', 1);
    const msg = T < CONTENT_END ? 'THE BENCH RUSHES THE PITCH' : ('FULL TIME - ' + O.scoreA + '-' + O.scoreB);
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 236, msg.length * 4 + 14, 13); ctx.fillStyle = home.s; ctx.fillRect(4, 236, 4, 13); txt(ctx, msg, 13, 240, '#fff', 1);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, 266, W, 4); ctx.fillStyle = '#ffe45e'; ctx.fillRect(0, 266, Math.round(clamp(T / CONTENT_END, 0, 1) * W), 4);
    ctx.fillStyle = '#000'; for (const s of SHOTS) ctx.fillRect(Math.round(s.a / CONTENT_END * W), 266, 1, 4);
    if (fl > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (fl / .14 * .7).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  /* ---------- tiny per-play state (camera smoothing + shot flash) ---------- */
  let _prevT = 0, _prevShot = -1, _flash = 0, _dcam = -1;

  function lastMinuteWinnerDraw(g, t, opts) {
    if (!g) return;
    opts = opts || {};
    t = t || 0;
    if (t < _prevT) { _prevT = 0; _prevShot = -1; _flash = 0; _dcam = -1; }
    let dt = t - _prevT; if (!(dt > 0) || dt > .1) dt = 1 / 60;
    _prevT = t;

    ensureKits(opts);
    const O = {
      home: shortName(opts.home || 'HOME', 16), away: shortName(opts.away || 'AWAY', 16),
      scoreA: Math.max(0, opts.scoreA | 0), scoreB: Math.max(0, opts.scoreB | 0),
      minute: String(opts.minute == null ? "90+1'" : opts.minute), scorerNum: opts.scorerNum == null ? 9 : opts.scorerNum
    };

    ents = sim(t);
    const tt = Math.min(t, CONTENT_END);
    ctx = g;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    const si = shotAt(t);
    if (si !== _prevShot) { _flash = .14; } else { _flash = Math.max(0, _flash - dt); }
    _prevShot = si;
    if (si !== 3) _dcam = -1;

    if (si === 0) side(tt, 136 + 180 * ez(seg(tt, 0.6, 4.5)), 43, 2);
    else side(tt, 800, 123, 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sA = t > 1.5 ? O.scoreA : Math.max(0, O.scoreA - 1);
    overlay(t, si, O, sA, _flash);
  }

  window.lastMinuteWinnerDraw = lastMinuteWinnerDraw;
  window.LAST_MINUTE_WINNER_END = 7.5; // suggested play length (seconds)
})();
