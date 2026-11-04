/* ============================================================================
 * Vantage FC - Substitution cutscene
 * ----------------------------------------------------------------------------
 * A faithful port of "Pixel Striker FC - Substitution". When you make a
 * substitution the game cuts away for a TV-style stoppage: the fourth official
 * raises the board, the sub strips off his bib by the bench, the two players
 * shake hands on the touchline to a standing ovation, and a card spells out who
 * is coming off and who is coming on.
 *
 * It is a PURE renderer - the engine owns the clock and calls substitutionDraw()
 * with the elapsed time each frame, drawing into its own 480x270 context.
 *
 *   window.substitutionDraw(g, t, opts)
 *   window.substitutionReset()
 *   window.substitutionDuration    (seconds; the length of the show)
 *
 * opts = {
 *   home, away, kitHome, kitAway,       // team names + shirt colours
 *   score: [home, away], minute: "62'", // scoreboard
 *   off: { name, num, lines:[a,b,c] },  // player coming off
 *   on:  { name, num, lines:[a,b,c] }   // player coming on
 * }
 * ========================================================================== */
(function () {
  "use strict";

  const W = 480, H = 270, WW = 640, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ez = u => u * u * (3 - 2 * u);
  const lerp = (a, b, u) => a + (b - a) * u;
  function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  // The context every helper draws into (set on each substitutionDraw call).
  let ctx = null;

  /* ---------- pixel font (3x5) ---------- */
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '#': '101111101111101', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ':': '000010000010000', '%': '101001010100101', '+': '000010111010000', '/': '001001010100100' };
  function txt(g, str, x, y, col, s, al, sh) {
    str = String(str).toUpperCase();
    const w = str.length * 4 * s - s; x = Math.round(al === 'c' ? x - w / 2 : al === 'r' ? x - w : x); y = Math.round(y);
    for (const [c, o] of sh ? [[sh, s], [col, 0]] : [[col, 0]]) {
      g.fillStyle = c; g.beginPath();
      for (let i = 0; i < str.length; i++) { const gl = F[str[i]]; if (!gl) continue; for (let k = 0; k < 15; k++) if (gl[k] === '1') g.rect(x + o + i * 4 * s + (k % 3) * s, y + o + ((k / 3) | 0) * s, s, s); }
      g.fill();
    }
  }
  const cut = (s, n) => { s = String(s || "").toUpperCase(); return s.length > n ? s.slice(0, n) : s; };

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
  const UPR = n => { const r = BD.slice(0, n).map(s => ('.' + s + '.').split('')); for (const i of [6, 7]) { r[i][1] = '.'; r[i][8] = '.'; } for (let i = 0; i <= 5; i++) { r[i][1] = i ? 'k' : 's'; r[i][8] = i ? 'k' : 's'; } return r.map(a => a.join('')); };
  function rowsFor(p) {
    if (p === 'f' || p === 'f1' || p === 'f3') return BD.concat(legsFB(+p[1] || 0));
    if (p === 'fu') return UPR(10).concat(legsFB(0));
    if (p === 'pt') return PT;
    if (p === 'w') return WB;
    if (p === 'Fd') return BD.slice(0, 9);
    if (p === 'Fu') return UPR(9);
    return BS.concat(LS[+p[1]]);
  }

  // Home / away kits come from the live match; the officials and the bib keep
  // their fixed colours.
  let KIT_H = { t: 'HOME', s: '#2f6fe4', p: '#f2f2f2' };
  let KIT_A = { t: 'AWAY', s: '#d83a3a', p: '#f2f2f2' };
  const KIT_R = { t: 'REF', s: '#e8d020', p: '#15151a' };
  const KIT_S = { t: 'STAFF', s: '#252a38', p: '#252a38' };
  const KIT_L = { t: 'OFFICIAL', s: '#f28a1f', p: '#15151a' };
  const KIT_B = { t: 'BIB', s: '#ff9a1f', p: '#2b2b33' };
  const kitOf = k => k === 'h' ? KIT_H : k === 'a' ? KIT_A : k === 's' ? KIT_S : k === 'l' ? KIT_L : k === 'b' ? KIT_B : KIT_R;
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
    g.fillStyle = '#121722'; g.fillRect(112, 84, 124, 50); g.fillStyle = '#1c2330'; g.fillRect(112, 84, 124, 3); g.fillStyle = '#3a4252'; g.fillRect(116, 126, 116, 8);
    return c;
  })();

  /* ---------- the substitution ---------- */
  function poly(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { len: L[L.length - 1], at(d) { if (d >= this.len) return pts[pts.length - 1]; for (let i = 1; i < pts.length; i++) if (d <= L[i]) { const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; } return pts[pts.length - 1]; } };
  }
  const rs = rng(31), AP = () => [(rs() * 5) | 0, (rs() * 6) | 0];
  const KP = [[300, 196], [270, 160], [270, 232], [236, 196], [200, 150], [200, 240], [170, 196], [130, 150], [130, 240], [90, 196], [34, 196]];
  const OFFA = [1, 1], SUBA = [3, 0], MATES = KP.slice(1).map(p => ({ a: AP(), x: p[0], y: p[1] })), FOES = KP.map(p => ({ a: AP(), x: 640 - p[0], y: p[1] })), BENCHSUBS = [[122, AP()], [142, AP()], [214, AP()]];
  const OFFp = poly([[300, 196], [354, 146]]), OFFb = poly([[354, 146], [250, 150], [190, 146], [176, 131]]), SUB1 = poly([[160, 131], [172, 146], [330, 146]]), SUB2 = poly([[330, 146], [312, 172], [300, 196]]);
  const fr = (T, k) => (Math.floor(T * 6 + k) & 1) ? 1 : 3, frj = (T, k) => (Math.floor(T * 9 + k) & 1) ? 1 : 3;
  function ents(T) {
    const L = [];
    /* player coming off (#10) */
    if (T < 4.5) L.push({ a: OFFA, kk: 'h', x: 300, y: 196, pose: 'f' });
    else {
      const d = (T - 4.5) * 34;
      if (d < OFFp.len) { const q = OFFp.at(d); L.push({ a: OFFA, kk: 'h', x: q[0], y: q[1], pose: 'r' + fr(T, 0) }); }
      else if (T < 9.5) L.push({ a: OFFA, kk: 'h', x: 354, y: 146, pose: 'f' });
      else if (T < 10.8) L.push({ a: OFFA, kk: 'h', x: 354, y: 146, pose: 'pt', flip: true });
      else { const d2 = (T - 10.8) * 40; if (d2 < OFFb.len) { const q = OFFb.at(d2); L.push({ a: OFFA, kk: 'h', x: q[0], y: q[1], pose: 'r' + fr(T, 0), flip: true, alpha: clamp((OFFb.len - d2) / 16, 0, 1) }); } }
    }
    /* substitute (#14) */
    const s = { a: SUBA, ph: 3 };
    if (T < 6.7) L.push(Object.assign(s, { kk: 'b', x: 160, y: 131, pose: 'f' }));
    else if (T < 7.6) L.push(Object.assign(s, { kk: T < 7.2 ? 'b' : 'h', x: 160, y: 131, pose: 'w' }));
    else {
      const d = (T - 7.6) * 100;
      if (d < SUB1.len) { const q = SUB1.at(d); L.push(Object.assign(s, { kk: 'h', x: q[0], y: q[1], pose: 'r' + frj(T, 3) })); }
      else if (T < 9.5) L.push(Object.assign(s, { kk: 'h', x: 330, y: 146, pose: 'f' }));
      else if (T < 10.8) L.push(Object.assign(s, { kk: 'h', x: 330, y: 146, pose: 'pt' }));
      else { const d2 = (T - 10.8) * 100; if (d2 < SUB2.len) { const q = SUB2.at(d2); L.push(Object.assign(s, { kk: 'h', x: q[0], y: q[1], pose: 'r' + frj(T, 3), flip: true })); } else L.push(Object.assign(s, { kk: 'h', x: 300, y: 196, pose: 'f' })); }
    }
    if (T >= 7.15 && T < 7.4) L.push({ gy: 300, fn() { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(146, 86, 30, 48); } });
    /* everyone else */
    const clap = T > 9.6 && T < 14;
    MATES.forEach((m, i) => L.push({ a: m.a, kk: 'h', x: m.x, y: m.y, pose: clap && (i === 2 || i === 5 || i === 6) ? 'fu' : 'f', z: clap && (i === 2 || i === 5) ? Math.round(Math.abs(Math.sin(T * 8 + i)) * 3) : 0 }));
    FOES.forEach(m => L.push({ a: m.a, kk: 'a', x: m.x, y: m.y, pose: 'f' }));
    BENCHSUBS.forEach((b, i) => L.push({ a: b[1], kk: 'h', x: b[0], y: 131, pose: clap ? 'fu' : 'f' }));
    /* staff */
    const c = T > 6.8 && T < 8.6;
    L.push({ a: [2, 5], kk: 's', x: 194, y: 131, pose: c ? 'pt' : 'f', ph: 2, say: { l: ['PRESS HIGH!', 'KEEP IT SIMPLE!'], t0: 6.9, t1: 8.6 } });
    L.push({ a: [1, 3], kk: 'l', x: 306, y: 141, pose: 'f' });
    L.push({
      gy: 142, fn() {
        if (T < 1.5 || T > 13) return; const on = Math.floor(T * 3) & 1 || T < 2, x = 288, y = 62;
        ctx.fillStyle = '#d8d8d8'; ctx.fillRect(x - 1, y - 1, 40, 30); ctx.fillStyle = '#0a0a12'; ctx.fillRect(x, y, 38, 28);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y, 38, 4);
        txt(ctx, OFF_NUM, x + 8, y + 3, on ? '#ff4a4a' : '#7a2a2a', 2); txt(ctx, ON_NUM, x + 8, y + 16, on ? '#5dff7a' : '#2a7a38', 2);
        ctx.fillStyle = on ? '#ff4a4a' : '#7a2a2a'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 27 + i, y + 4 + i, 9 - 2 * i, 1);
        ctx.fillStyle = on ? '#5dff7a' : '#2a7a38'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 27 + i, y + 22 - i, 9 - 2 * i, 1);
      }
    });
    L.push({ a: [0, 3], kk: 'r', x: 330, y: 206, pose: T > 1.8 && T < 3.5 || T > 20.6 && T < 21.6 ? 'pt' : 'f', flip: true, ph: 0, say: { l: ['FWEET!'], t0: 20.9, t1: 21.8 } });
    return L;
  }
  const fans = []; (() => { const r = rng(77);[58, 84, 110].forEach((y, ri) => { for (let x = 8 + (ri & 1) * 11; x < WW; x += 22) fans.push({ x: x + ((r() * 5) | 0), y: y, kk: x < 320 ? 'h' : 'a', a: AP(), ph: r() * 6 }); }); })();
  function drawFans(T, x0, x1) {
    for (const f of fans) {
      if (f.x < x0 - 20 || f.x > x1 + 20) continue;
      const up = T > 9.6 && (f.kk === 'h' || T < 17), j = Math.round(Math.abs(Math.sin(T * (up ? 8 : 2) + f.ph)) * (up ? 4 : 1)), s = spr(f.a, up && Math.sin(T * 8 + f.ph) > -.3 ? 'Fu' : 'Fd', f.kk);
      ctx.drawImage(s, Math.round(f.x - s.width), f.y - s.height * 2 - j, s.width * 2, s.height * 2);
    }
  }
  function bub(x, y, s) { const w = s.length * 4 + 7; x = Math.round(x - w / 2); y = Math.round(y); ctx.fillStyle = '#120e18'; ctx.fillRect(x - 1, y - 1, w + 2, 11); ctx.fillRect(Math.round(x + w / 2 - 2), y + 10, 5, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, 9); ctx.fillRect(Math.round(x + w / 2 - 1), y + 9, 3, 3); txt(ctx, s, x + 3, y + 2, '#10141f', 1); }
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
  function side(T, cx, cy, z) {
    ctx.setTransform(z, 0, 0, z, -cx * z, -cy * z); ctx.drawImage(bgW, 0, 0); drawFans(T, cx, cx + W / z);
    const E = ents(T), L = E.slice();
    L.push({ gy: 134, fn() { ctx.fillStyle = '#2a3140'; ctx.fillRect(114, 116, 120, 18); ctx.fillStyle = '#4a5468'; ctx.fillRect(114, 116, 120, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(114, 130, 120, 4); } });
    drawList(L, 3);
    for (const e of E) { if (e.say && T >= e.say.t0 && T < e.say.t1) { const v = T * .9 + (e.ph || 0) * 1.3, i = Math.floor(v) % e.say.l.length; if (v % 1 < .72 || e.say.l.length === 1) bub(e.x, e.y - 58, e.say.l[i]); } }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const tri = (x, y, up, col, n) => { ctx.fillStyle = col; for (let i = 0; i < n; i++) ctx.fillRect(x - i, up ? y + n * 2 - i * 2 - 2 : y + i * 2, i * 2 + 1, 2); };
  function card(T, o) {
    const tl = T - 16.5, u = ez(seg(tl, 0, .7));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0a0e18'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-(1 - u) * 240, 0); ctx.globalAlpha = .3; ctx.fillStyle = '#d83a3a'; ctx.fillRect(0, 0, 240, H); ctx.globalAlpha = 1; ctx.restore();
    ctx.save(); ctx.translate((1 - u) * 240, 0); ctx.globalAlpha = .3; ctx.fillStyle = '#2fbf6a'; ctx.fillRect(240, 0, 240, H); ctx.globalAlpha = 1; ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, 34); txt(ctx, 'SUBSTITUTION', 240, 8, '#ffe45e', 3, 'c', '#6b3300');
    ctx.fillStyle = 'rgba(8,14,12,.85)'; ctx.fillRect(210, 40, 60, 14); txt(ctx, o.minute, 240, 44, '#fff', 2, 'c');
    const L = [{ a: OFFA, kk: 'h', pose: 'f', x: 120 - (1 - u) * 240, y: 236, sc: 6, alpha: 1 }, { a: SUBA, kk: 'h', pose: T > 17.6 && Math.floor(T * 4) & 1 ? 'fu' : 'f', x: 360 + (1 - u) * 240, y: 236, sc: 6 }];
    drawList(L, 6);
    const ex = -(1 - u) * 240, en = (1 - u) * 240;
    tri(40 + ex, 70, false, '#ff4a4a', 7); txt(ctx, 'OFF', 56 + ex, 70, '#ff4a4a', 3, 'l', '#000');
    txt(ctx, o.off.tag, 14 + ex, 100, '#fff', 2); txt(ctx, cut(o.off.name, 12), 14 + ex, 118, '#fff', 3, 'l', '#000');
    o.off.lines.forEach((s, i) => txt(ctx, cut(s, 16), 14 + ex, 146 + i * 10, '#cfe8d6', 1));
    tri(262 + en, 70, true, '#5dff7a', 7); txt(ctx, 'ON', 278 + en, 70, '#5dff7a', 3, 'l', '#000');
    txt(ctx, o.on.tag, 254 + en, 100, '#fff', 2); txt(ctx, cut(o.on.name, 12), 254 + en, 118, '#fff', 3, 'l', '#000');
    o.on.lines.forEach((s, i) => txt(ctx, cut(s, 16), 254 + en, 146 + i * 10, '#cfe8d6', 1));
    ctx.fillStyle = KIT_H.s; ctx.fillRect(0, 262, W, 8); txt(ctx, KIT_H.t, 240, 263, KIT_H.s === '#f1f1f1' || KIT_H.s === '#f2c21b' ? '#10141f' : '#fff', 1, 'c');
  }

  const SHOTS = [{ n: 'WIDE', a: 0, b: 3.5 }, { n: 'THE BOARD', a: 3.5, b: 6.5 }, { n: 'BENCH', a: 6.5, b: 9.7 }, { n: 'TOUCHLINE', a: 9.7, b: 13.5 }, { n: 'CROWD', a: 13.5, b: 16.5 }, { n: 'THE CARD', a: 16.5, b: 20.5 }, { n: 'RESUME', a: 20.5, b: 23.5 }];
  const MSG = ['PLAY STOPS FOR A SUBSTITUTION', 'THE FOURTH OFFICIAL RAISES THE BOARD', 'THE SUBSTITUTE STRIPS OFF AND GETS READY', 'A HANDSHAKE AT THE TOUCHLINE', 'STANDING OVATION FOR THE SUB', '', 'PLAY RESUMES'];
  const END = 25, LAST = 23.5;
  let OFF_NAME = 'PLAYER', OFF_NUM = '10', ON_NUM = '14', CHANT = [];
  function chantFor(name) { const r = rng(9), w = cut(String(name || 'SUB').trim().split(/\s+/).pop(), 10) + '!'; return Array.from({ length: 9 }, (_, i) => ({ x: 30 + r() * 420, y: 90 + r() * 130, p: r() * 3, s: 2 + (i % 2), w: i % 3 ? w : 'CLAP!' })); }

  let lastShot = -1, fl = 0, prevT = null;
  const shotAt = t => { for (let i = 0; i < SHOTS.length; i++) if (t < SHOTS[i].b) return i; return SHOTS.length - 1; };
  function overlay(T, si, o) {
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(96, 3, 288, 17); ctx.fillStyle = KIT_H.s; ctx.fillRect(96, 3, 5, 17); ctx.fillStyle = KIT_A.s; ctx.fillRect(379, 3, 5, 17);
    txt(ctx, KIT_H.t, 106, 9, '#e8f3ec', 1); txt(ctx, KIT_A.t, 374, 9, '#e8f3ec', 1, 'r');
    txt(ctx, o.score[0], 214, 5, '#fff', 2, 'c'); txt(ctx, '-', 240, 5, '#8fb7a0', 2, 'c'); txt(ctx, o.score[1], 266, 5, '#fff', 2, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(216, 20, 48, 10); txt(ctx, o.minute, 240, 23, '#ffe45e', 1, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 3, 86, 14); txt(ctx, 'CAM ' + (si + 1) + ' ' + SHOTS[si].n, 8, 6, '#ffe45e', 1);
    if (si === 4) { txt(ctx, 'STANDING OVATION', 240, 40, '#ffe45e', 3, 'c', '#000'); for (const b of CHANT) { const v = ((T * .6 + b.p) % 1); txt(ctx, b.w, b.x, b.y - v * 30, '#fff', b.s, 'c', '#000'); } }
    if (si !== 5) { const msg = MSG[si]; ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 236, msg.length * 4 + 14, 13); ctx.fillStyle = KIT_H.s; ctx.fillRect(4, 236, 4, 13); txt(ctx, msg, 13, 240, '#fff', 1); }
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, 266, W, 4); ctx.fillStyle = '#ffe45e'; ctx.fillRect(0, 266, Math.round(clamp(T / LAST, 0, 1) * W), 4);
    ctx.fillStyle = '#000'; for (const s of SHOTS) ctx.fillRect(Math.round(s.a / LAST * W), 266, 1, 4);
    if (fl > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (fl / .14 * .7).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  // g    : target 2D context (the PS engine's 480x270 canvas)
  // t    : elapsed seconds since the substitution began
  // opts : see the header
  function substitutionDraw(g, t, opts) {
    opts = opts || {};
    ctx = g;
    t = Math.max(0, t || 0);

    const kitHome = opts.kitHome || '#2f6fe4', kitAway = opts.kitAway || '#d83a3a';
    if (KIT_H.s !== kitHome || KIT_A.s !== kitAway) { SC.clear(); KIT_H = { t: cut(opts.home || 'HOME', 14), s: kitHome, p: '#f2f2f2' }; KIT_A = { t: cut(opts.away || 'AWAY', 14), s: kitAway, p: '#f2f2f2' }; }

    const off = opts.off || {}, on = opts.on || {};
    OFF_NAME = off.name || 'PLAYER'; OFF_NUM = String(off.num != null ? off.num : '10'); ON_NUM = String(on.num != null ? on.num : '14');
    CHANT = chantFor(OFF_NAME);

    const o = {
      score: Array.isArray(opts.score) ? opts.score : [1, 1],
      minute: opts.minute || "62'",
      off: { name: OFF_NAME, num: OFF_NUM, tag: off.tag || ('#' + OFF_NUM), lines: (off.lines && off.lines.length ? off.lines : ['OFF', '', '']) },
      on: { name: on.name || 'PLAYER', num: ON_NUM, tag: on.tag || ('#' + ON_NUM), lines: (on.lines && on.lines.length ? on.lines : ['ON', '', '']) }
    };

    const dt = prevT === null ? 0 : clamp(t - prevT, 0, .05);
    if (prevT !== null && t < prevT) { lastShot = -1; fl = 0; }
    prevT = t;
    const si = shotAt(t);
    if (si !== lastShot) { lastShot = si; fl = .14; } else fl = Math.max(0, fl - dt);

    const tt = Math.min(t, LAST);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (si === 0) side(tt, lerp(160, 100, ez(seg(tt, 0, 3.5))), 0, 1);
    else if (si === 1) side(tt, 186, 33, 2);
    else if (si === 2) side(tt, 60, 50, 2);
    else if (si === 3) side(tt, lerp(230, 250, ez(seg(tt, 9.7, 13.5))), 75, 2);
    else if (si === 4) side(tt, 200, 2, 2);
    else if (si === 5) card(tt, o);
    else side(tt, lerp(150, 200, ez(seg(tt, 20.5, 23.5))), 0, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0); overlay(t, si, o);
  }

  function substitutionReset() { lastShot = -1; fl = 0; prevT = null; }

  window.substitutionDraw = substitutionDraw;
  window.substitutionReset = substitutionReset;
  window.substitutionDuration = LAST;
})();
