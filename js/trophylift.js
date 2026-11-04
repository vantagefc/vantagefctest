/* Trophy ceremony cutscene.
   Adapted from the standalone "Pixel Striker FC - Trophy Ceremony" animation.
   Renders a full-screen pixel cutscene (wide -> medals -> handover -> the walk
   -> the lift -> celebration -> fireworks -> champions card) onto the
   #trophyCanvas supplied by index.html.

   The game only ever used this as a celebratory beat between matches, so the
   public API is kept identical to the previous implementation:
     window.showTrophyLift({ competition, title, key, team, kit }, done)
     window.trophyLiftContinue() / window.hideTrophyLift()
     window.trophyLiftActive()
   plus a psSkip registration so a gamepad can skip it. */
(function () {
  "use strict";

  var cv = document.getElementById("trophyCanvas");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  var W = 480, H = 270, WW = 640, TAU = Math.PI * 2, PI = Math.PI;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var ez = function (u) { return u * u * (3 - 2 * u); };
  var lerp = function (a, b, u) { return a + (b - a) * u; };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  function rng(s) { return function () { return (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }; }
  var hex = function (h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; };

  var F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '#': '101111101111101', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ':': '000010000010000', '+': '000010111010000', '/': '001001010100100', '<': '001010100010001', '>': '100010001010100' };
  function txt(g, str, x, y, col, s, al, sh) {
    str = String(str).toUpperCase();
    var w = str.length * 4 * s - s;
    x = Math.round(al === 'c' ? x - w / 2 : al === 'r' ? x - w : x); y = Math.round(y);
    var layers = sh ? [[sh, s], [col, 0]] : [[col, 0]];
    for (var li = 0; li < layers.length; li++) {
      var c = layers[li][0], o = layers[li][1];
      g.fillStyle = c; g.beginPath();
      for (var i = 0; i < str.length; i++) {
        var gl = F[str[i]]; if (!gl) continue;
        for (var k = 0; k < 15; k++) if (gl[k] === '1') g.rect(x + o + i * 4 * s + (k % 3) * s, y + o + ((k / 3) | 0) * s, s, s);
      }
      g.fill();
    }
  }
  function mk(rows, pal) {
    var h = rows.length, w = rows[0].length, Wd = w + 2, Hd = h + 2, c = document.createElement('canvas'); c.width = Wd; c.height = Hd;
    var g = c.getContext('2d');
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var ch = rows[y][x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + 1, y + 1, 1, 1); } }
    var im = g.getImageData(0, 0, Wd, Hd), d = im.data, so = new Uint8Array(Wd * Hd);
    for (var i = 0; i < Wd * Hd; i++) so[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    for (var yy = 0; yy < Hd; yy++) for (var xx = 0; xx < Wd; xx++) { var idx = yy * Wd + xx; if (so[idx]) continue; if ((xx > 0 && so[idx - 1]) || (xx < Wd - 1 && so[idx + 1]) || (yy > 0 && so[idx - Wd]) || (yy < Hd - 1 && so[idx + Wd])) { d[idx * 4] = 18; d[idx * 4 + 1] = 14; d[idx * 4 + 2] = 24; d[idx * 4 + 3] = 255; } }
    g.putImageData(im, 0, 0); return c;
  }

  var BD = ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '..ssss..', '.kkkkkk.', 'skkkkkks', 'skkkkkks', '.kkkkkk.', '.pppppp.'];
  var BS = ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhsse.', '..hsss..', '.kkkkkk.', '.kkkkks.', '.kkkkks.', '.kkkkkk.', '.pppppp.'];
  var LS = { 0: ['..pppp..', '..oooo..', '..oooo..', '..bbbbb.'], 1: ['..pppp..', '.oo..oo.', '.oo..oo.', '.bbb.bbb'], 3: ['..pppp..', '..oo.oo.', '..oo.oo.', '..bbbbbb'] };
  var pad = function (a, n) { return a.map(function (s) { return '.'.repeat(n) + s + '.'.repeat(n); }); };
  var legsFB = function (fr) { var n = ['p', 'o', 'o', 'b'], l = ['p', 'o', 'b', '.'], r = []; for (var i = 0; i < 4; i++) { var a = fr === 1 ? l[i] : n[i], b = fr === 3 ? l[i] : n[i]; r.push('.' + a + a + '..' + b + b + '.'); } return r; };
  function armRows(L, R, kn, fr) {
    var g = BD.map(function (s) { return ('...' + s + '...').split(''); });
    g[6][3] = 'k'; g[6][10] = 'k'; g[7][3] = 'k'; g[7][10] = 'k';
    var arm = function (t, sd) {
      var sh = sd < 0 ? 3 : 10, x0 = sd < 0 ? 2 : 11;
      if (t === 'd') { g[6][sh] = 's'; g[7][sh] = 's'; }
      else if (t === 'u') { g[5][sh] = 'k'; for (var r = 5; r >= 1; r--) g[r][x0] = 'k'; g[0][x0] = 's'; }
      else if (t === 'b') { g[6][sh] = 'k'; g[6][x0] = 'k'; g[5][x0] = 'k'; g[4][x0] = 's'; g[3][x0] = 's'; }
      else if (t === 'w') { for (var i = 0; i < 3; i++) g[6][sh + sd * (i + 1)] = i < 2 ? 'k' : 's'; }
      else if (t === 'f') { var c0 = sd < 0 ? 4 : 7; for (var cc = c0; cc < c0 + 3; cc++) g[7][cc] = 's'; }
    };
    arm(L, -1); arm(R, 1);
    return g.map(function (a) { return a.join(''); }).concat(kn ? pad(['.pp..pp.', '.bb..bb.'], 3) : pad(legsFB(fr), 3));
  }
  function rowsFor(p) {
    if (p[0] === 'A' || p[0] === 'K') return armRows(p[1], p[2], p[0] === 'K', +p[3] || 0);
    if (p === 'Fd') return BD.slice(0, 9);
    if (p === 'Fu') { var r = BD.slice(0, 9).map(function (s) { return ('.' + s + '.').split(''); }); var arr = [6, 7]; for (var ai = 0; ai < arr.length; ai++) { r[arr[ai]][1] = '.'; r[arr[ai]][8] = '.'; } for (var i = 0; i <= 5; i++) { r[i][1] = i ? 'k' : 's'; r[i][8] = i ? 'k' : 's'; } return r.map(function (a) { return a.join(''); }); }
    return BS.concat(LS[+p[1]]);
  }

  var KITS = [{ t: 'PIXEL FC', s: '#2f6fe4', p: '#f2f2f2' }, { t: 'RETRO UTD', s: '#d83a3a', p: '#f2f2f2' }, { t: '8-BIT CITY', s: '#1fa65a', p: '#0d3b24' }, { t: 'BYTE ROVERS', s: '#f2c21b', p: '#222a55' }, { t: 'VOXEL ATH', s: '#8a4fd6', p: '#e9e0ff' }, { t: 'SPRITE SC', s: '#f2812b', p: '#1c1c1c' }, { t: 'GLITCH FC', s: '#2b2b33', p: '#d5d5d5' }, { t: 'ARCADE UTD', s: '#f1f1f1', p: '#2f6fe4' }];
  var STAFF = { s: '#252a38', p: '#252a38' };
  var kitIdx = 0;
  var kitOf = function (k) { return k === 'h' ? KITS[kitIdx] : STAFF; };
  var SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'], HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];
  var SC = new Map();
  function spr(a, pose, kk) {
    var key = a[0] + '|' + a[1] + pose + kk + (kk === 'h' ? kitIdx : '');
    var c = SC.get(key); if (c) return c;
    var K = kitOf(kk);
    c = mk(rowsFor(pose), { h: HAIRS[a[1]], s: SKINS[a[0]], e: '#1a1420', k: K.s, p: K.p, o: K.s, b: '#15131c' });
    SC.set(key, c); return c;
  }

  var CUP = ['..mmmmmmmm..', 'HHmhmmmmdmHH', 'H.mhmmmmdm.H', 'H..mhmmdm..H', 'HH..mmmm..HH', '....mddm....', '.....dd.....', '...bbbbbb...', '..bbabbabb..', '..bbbbbbbb..'];
  var SILV = { m: '#cfd6e0', h: '#ffffff', d: '#8892a6', H: '#e4e9f0' }, GOLD = { m: '#f2c230', h: '#fff2a0', d: '#b8860b', H: '#f2c230' };
  var WC = ['...gggggg...', '..gGgggggg..', '..gGggggoo..', '..gggggooo..', '...gggooo...', '....ggoo....', '....gGgo....', '....gggo....', '...ggggoo...', '...eeeeee...', '...gggggg...', '..eeeeeeee..', '..gggggggg..'];
  var HEX = ['...mmmmmm...', '..mhhmmmmd..', '.mhmmbbmmmd.', 'mhmmbbbbmmmd', 'mmmbbbbbbmmd', 'mmmbbbbbbmmd', 'mmmmbbbbmmmd', '.mmmmmmmmmd.', '..mmmmmmmd..', '....dddd....', '...dddddd...', '..bbbbbbbb..'];
  var DISH = ['...dddddd...', '.ddmmmmmmdd.', '.dmmhhmmmmd.', 'dmmhmmmmmmmd', 'dmmmmggmmmmd', 'dmmmggggmmmd', 'dmmmggggmmmd', 'dmmmmggmmmmd', 'dmmmmmmmmmmd', '.dmmmmmmmmd.', '.ddmmmmmmdd.', '...dddddd...'];
  var CROWN = ['..g.g..g.g..', '..gggggggg..'];
  var TR = [
    { n: 'WORLD CUP', col: ['#ffd84a', '#2fbf6a', '#ffffff'], rows: WC, pal: { g: '#f2c230', G: '#fff2a0', o: '#b8860b', e: '#1f9a5a' } },
    { n: 'CHAMPIONS LEAGUE', col: ['#4a6bff', '#ffffff', '#9fb4ff'], rows: CUP, pal: Object.assign({}, SILV, { b: '#14183a', a: '#ffffff' }) },
    { n: 'EUROPA LEAGUE', col: ['#ff9a2a', '#ffffff', '#ffd2a0'], rows: CUP, pal: Object.assign({}, SILV, { b: '#f28a1f', a: '#ffffff' }) },
    { n: 'CONFERENCE LEAGUE', col: ['#2fe08a', '#ffffff', '#a8ffd2'], rows: CUP, pal: Object.assign({}, SILV, { b: '#1fb86a', a: '#ffffff' }) },
    { n: 'PREMIER LEAGUE', col: ['#a46bff', '#ffffff', '#e0c8ff'], rows: CROWN.concat(CUP), pal: Object.assign({}, SILV, { g: '#f2c230', b: '#1f8f5a', a: '#7a3cff' }) },
    { n: 'LIGUE 1', col: ['#3a7bff', '#ffffff', '#ff4a5a'], rows: HEX, pal: { m: '#c9d3e6', h: '#ffffff', d: '#7e8aa6', b: '#1b4fd6' } },
    { n: 'BUNDESLIGA', col: ['#ff3a3a', '#ffd84a', '#ffffff'], rows: DISH, pal: { m: '#cfd6e0', h: '#ffffff', d: '#8892a6', g: '#e0b030' } },
    { n: 'SERIE A', col: ['#2fbf6a', '#ffffff', '#ff4a4a'], rows: CUP, pal: Object.assign({}, SILV, { b: '#1fa65a', a: '#d83a3a' }) },
    { n: 'LA LIGA', col: ['#ffd84a', '#ff4a4a', '#ffffff'], rows: CUP, pal: Object.assign({}, GOLD, { b: '#c8321f', a: '#ffe45e' }) },
    { n: 'THE TROPHY', col: ['#ffd84a', '#c9d3e6', '#ffffff'], rows: CUP, pal: Object.assign({}, SILV, { b: '#2f6fe4', a: '#ffe45e' }) }
  ];
  for (var ti = 0; ti < TR.length; ti++) TR[ti].spr = mk(TR[ti].rows, TR[ti].pal);

  var KEYMAP = [
    ['WORLD_CUP', ['world cup', 'world champions', 'club world cup']],
    ['CHAMPIONS_LEAGUE', ['champions league']],
    ['EUROPA_LEAGUE', ['europa']],
    ['CONFERENCE_LEAGUE', ['conference']],
    ['PREMIER_LEAGUE', ['premier']],
    ['LIGUE_1', ['ligue']],
    ['BUNDESLIGA', ['bundesliga']],
    ['SERIE_A', ['serie']],
    ['LA_LIGA', ['la liga']]
  ];
  function keyFor(name) {
    var s = String(name || '').toLowerCase();
    for (var i = 0; i < KEYMAP.length; i++) { var key = KEYMAP[i][0], nds = KEYMAP[i][1]; for (var j = 0; j < nds.length; j++) if (s.indexOf(nds[j]) >= 0) return key; }
    if (s.indexOf('champions') >= 0) return 'CHAMPIONS_LEAGUE';
    return 'THE TROPHY';
  }

  var CKK = ['#d94f4f', '#e8c24a', '#4a90d9', '#e8e8e8', '#7bd96a', '#c86ad9', '#e8914a', '#9ad9d6'];
  function crowd(g, R, x0, y0, x1, y1, p) { for (var y = y0; y < y1; y += 4) for (var x = x0 + ((y & 4) ? 2 : 0); x < x1; x += 4) if (R() < p) { g.fillStyle = CKK[(R() * 8) | 0]; g.fillRect(x, y, 2, 2); } }
  function ads(g, w, y, h) {
    var ad = ['PIXEL', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE'], ac = ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f'];
    for (var x = 0, i = 0; x < w; x += 80, i++) { g.fillStyle = ac[i % 6]; g.fillRect(x, y, 80, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 78, y, 2, h); txt(g, ad[i % 6], x + 40, y + (h - 5 >> 1), '#fff', 1, 'c'); }
  }
  function mkc(w) { var c = document.createElement('canvas'); c.width = w; c.height = H; return c; }

  var SL = [[296, 208], [314, 203], [332, 208], [350, 203], [366, 208], [402, 208], [418, 203], [436, 208], [454, 203], [470, 208]], ORD = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
  var ti2 = 0, bgW = null, bgL = null;
  function buildBG() {
    var t = TR[ti2], c = mkc(WW), g = c.getContext('2d'), R = rng(3 + ti2);
    g.fillStyle = '#0b0e17'; g.fillRect(0, 0, WW, 128);
    for (var k = 0; k < 5; k++) { g.fillStyle = 'rgba(40,55,95,' + (.06 * k).toFixed(2) + ')'; g.fillRect(0, k * 6, WW, 6); }
    crowd(g, R, 0, 0, WW, 112, .5); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, WW, 112);
    var sp = [60, 300, 560];
    for (var si = 0; si < sp.length; si++) { var x = sp[si]; g.fillStyle = 'rgba(255,250,220,.5)'; g.fillRect(x - 6, 8, 12, 5); g.fillStyle = 'rgba(255,250,220,.06)'; g.beginPath(); g.moveTo(x - 8, 12); g.lineTo(x + 8, 12); g.lineTo(x + 70, 128); g.lineTo(x - 70, 128); g.fill(); }
    ads(g, WW, 114, 14);
    for (var x2 = 0, k2 = 0; x2 < WW; x2 += 40, k2++) { g.fillStyle = k2 & 1 ? '#2f7a33' : '#37873c'; g.fillRect(x2, 128, 40, H - 128); }
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, 134, WW, 1); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, 238, WW, 32);
    g.fillStyle = '#05070d'; g.fillRect(262, 58, 298, 150); g.fillStyle = t.col[0]; g.fillRect(262, 58, 298, 3); g.fillRect(262, 205, 298, 3); g.fillRect(262, 58, 3, 150); g.fillRect(557, 58, 3, 150);
    for (var y = 64; y < 204; y += 4) { g.fillStyle = hex(t.col[0], (.04 + .05 * (y - 64) / 140).toFixed(3)); g.fillRect(266, y, 290, 2); }
    txt(g, 'CHAMPIONS', 411, 66, t.col[0], 4, 'c', '#000');
    g.drawImage(t.spr, 411 - t.spr.width * 2, 94, t.spr.width * 4, t.spr.height * 4);
    txt(g, t.n, 411, 158, '#ffffff', 2, 'c', '#000');
    txt(g, 'WINNERS 2026', 411, 190, t.col[2], 1, 'c');
    g.fillStyle = '#10141f'; g.fillRect(250, 40, 330, 6);
    for (var x3 = 252; x3 < 578; x3 += 14) g.fillRect(x3, 46, 2, 6);
    var lx = [290, 350, 410, 470, 530];
    for (var li = 0; li < lx.length; li++) { g.fillStyle = '#e8f0ff'; g.fillRect(lx[li] - 4, 52, 8, 4); }
    g.fillStyle = '#1a2030'; g.fillRect(262, 208, 298, 28); g.fillStyle = '#3a4660'; g.fillRect(262, 206, 298, 3); g.fillStyle = t.col[0]; g.fillRect(262, 222, 298, 3);
    g.fillStyle = 'rgba(255,255,255,.07)'; for (var x4 = 264; x4 < 560; x4 += 30) g.fillRect(x4, 210, 2, 12);
    var st = [[226, 232], [238, 224], [250, 216]];
    for (var sti = 0; sti < st.length; sti++) { var s2 = st[sti]; g.fillStyle = '#252d42'; g.fillRect(s2[0], s2[1], 12, 236 - s2[1]); g.fillStyle = '#4a5878'; g.fillRect(s2[0], s2[1], 12, 2); }
    g.fillStyle = '#10141f'; g.fillRect(204, 210, 20, 26); g.fillStyle = '#232c44'; g.fillRect(204, 210, 20, 2); g.fillStyle = t.col[0]; g.fillRect(202, 208, 24, 3);
    bgW = c;
    var l = mkc(W), h = l.getContext('2d'), R2 = rng(9 + ti2);
    h.fillStyle = '#04060c'; h.fillRect(0, 0, W, H); crowd(h, R2, 0, 0, W, 40, .8); h.fillStyle = 'rgba(0,0,0,.5)'; h.fillRect(0, 0, W, 40);
    h.fillStyle = '#05070d'; h.fillRect(20, 40, 440, 152); h.fillStyle = t.col[0]; h.fillRect(20, 40, 440, 3); h.fillRect(20, 189, 440, 3); h.fillRect(20, 40, 3, 152); h.fillRect(457, 40, 3, 152);
    for (var yl = 46; yl < 188; yl += 4) { h.fillStyle = hex(t.col[0], (.05 + .07 * (yl - 46) / 142).toFixed(3)); h.fillRect(24, yl, 432, 2); }
    txt(h, 'CHAMPIONS', 240, 56, t.col[0], 7, 'c', '#000'); txt(h, t.n, 240, 106, '#ffffff', 3, 'c', '#000'); txt(h, 'WINNERS 2026', 240, 140, t.col[2], 2, 'c');
    h.fillStyle = '#10162a'; h.fillRect(0, 192, W, 78); h.fillStyle = t.col[0]; h.fillRect(0, 192, W, 2);
    for (var xs = -20; xs < W + 40; xs += 48) { h.fillStyle = 'rgba(255,255,255,.05)'; h.beginPath(); h.moveTo(xs, 194); h.lineTo(xs + 16, 194); h.lineTo(xs + 60, 270); h.lineTo(xs + 20, 270); h.fill(); }
    bgL = l;
  }

  var rs = rng(41), AP = function () { return [(rs() * 5) | 0, (rs() * 6) | 0]; };
  var APP = []; for (var api = 0; api < 10; api++) APP.push(AP());
  var CAPA = [1, 1], PRES = [0, 5];
  var FANS = []; (function () { var r = rng(77); var ys = [58, 84, 108]; for (var ri = 0; ri < ys.length; ri++) { var y = ys[ri]; for (var x = 8 + (ri & 1) * 11; x < WW; x += 22) if (x < 250 || x > 568) FANS.push({ x: x, y: y, kk: 'h', a: AP(), ph: r() * 6 }); } })();

  function poly(pts) {
    var Lp = [0];
    for (var i = 1; i < pts.length; i++) Lp.push(Lp[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return {
      len: Lp[Lp.length - 1],
      at: function (d) {
        if (d >= this.len) return pts[pts.length - 1];
        for (var i = 1; i < pts.length; i++) if (d <= Lp[i]) { var u = (d - Lp[i - 1]) / (Lp[i] - Lp[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; }
        return pts[pts.length - 1];
      }
    };
  }
  var UP = [[178, 236], [226, 236], [232, 232], [244, 224], [256, 216], [264, 208]];
  var CL = [], CLtmp = UP.concat([[0, 0]]);
  for (var ci = 0; ci < APP.length; ci++) { CLtmp[CLtmp.length - 1] = SL[ORD[ci]]; CL.push(poly(CLtmp.slice())); }
  var CAPCL = poly(UP.concat([[384, 208]]));
  var F3 = function (u, k) { return (Math.floor(u * 9 + k) & 1) ? 1 : 3; };
  var rcv = function (i) { return 3.6 + .6 * i; }, CAP_ARR = 11.8 + CAPCL.len / 55;
  function playerEnt(i, T) {
    var r = rcv(i), o = { a: APP[i], kk: 'h' };
    if (T < r - 3.5) return null;
    if (T < r) return Object.assign(o, { x: lerp(-34, 178, (T - r + 3.5) / 3.5), y: 236, pose: 'r' + F3(T, i) });
    if (T < r + .5) return Object.assign(o, { x: 178, y: 236, pose: 'r0', medal: T > r + .35 });
    var d = (T - r - .5) * 70, L = CL[i];
    if (d < L.len) { var q = L.at(d); return Object.assign(o, { x: q[0], y: q[1], pose: 'r' + F3(T, i), medal: true }); }
    var s = SL[ORD[i]], cheer = T > 17.5;
    return Object.assign(o, { x: s[0], y: s[1], medal: true, pose: cheer ? 'Auu0' : (Math.floor(T * 4 + i) & 1 ? 'Aff0' : 'Add0'), z: cheer ? Math.round(Math.abs(Math.sin(T * 7 + i)) * 6) : 0 });
  }
  function capEnt(T) {
    var o = { a: CAPA, kk: 'h' };
    if (T < 6.9) return null;
    if (T < 10.4) return Object.assign(o, { x: lerp(-34, 178, (T - 6.9) / 3.5), y: 236, pose: 'r' + F3(T, 9) });
    if (T < 11.0) return Object.assign(o, { x: 178, y: 236, pose: 'r0' });
    if (T < 11.8) return Object.assign(o, { x: 178, y: 236, pose: 'Abb0' });
    var d = (T - 11.8) * 55;
    if (d < CAPCL.len) { var q = CAPCL.at(d); return Object.assign(o, { x: q[0], y: q[1], pose: 'Abb' + F3(T, 2) }); }
    return Object.assign(o, { x: 384, y: 208, pose: T < 17.4 ? 'Abb0' : 'Auu0', z: T > 17.5 ? Math.round(Math.abs(Math.sin(T * 5)) * 3) : 0 });
  }
  function presEnt(T) {
    var pt = T >= 10.4 && T < 11.0;
    for (var i = 0; i < 10; i++) { var r = rcv(i); if (T >= r && T < r + .45) pt = true; }
    return { a: PRES, kk: 's', x: 198, y: 237, flip: true, pose: pt ? 'r0' : (T > 11.8 ? (Math.floor(T * 4) & 1 ? 'Aff0' : 'Add0') : 'Add0') };
  }
  var CHAIN = [-1, 1, 3, 5, 7, 9];
  function holderPos(k, T) { if (k < 0 || CHAIN[k] < 0) { var c = capEnt(T); return { x: c.x, y: c.y }; } var s = SL[ORD[CHAIN[k]]]; return { x: s[0], y: s[1] }; }
  function trophyAt(T) {
    var capHold = function () { var c = capEnt(T); return { x: c.x, y: c.y, z: T >= 17.4 ? 42 : 22 }; };
    if (T < 10.6) return { x: 214, y: 236, z: 26 };
    if (T < 11.7) { var u = ez(seg(T, 10.6, 11.7)), c = capEnt(T); return { x: lerp(214, c.x, u), y: 236, z: lerp(26, 22, u) + Math.sin(u * PI) * 10 }; }
    if (T < 19.2) return capHold();
    var k = Math.floor((T - 19.2) / .75), uu = ((T - 19.2) % .75) / .75;
    if (k < 5) {
      var a = holderPos(k, T), b = holderPos(k + 1, T);
      if (uu < .6) return { x: a.x, y: a.y, z: 42 + Math.round(Math.sin(T * 8) * 2) };
      var f = ez((uu - .6) / .4); return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), z: 42 + Math.sin(f * PI) * 16 };
    }
    if (T < 23.0) { var a2 = holderPos(5, T); return { x: a2.x, y: a2.y, z: 42 }; }
    var a3 = holderPos(5, T), b3 = holderPos(0, T), f3 = ez(seg(T, 23.0, 23.7));
    return { x: lerp(a3.x, b3.x, f3), y: lerp(a3.y, b3.y, f3), z: 42 + Math.sin(f3 * PI) * 16 };
  }

  var parts = [], SX = 0, SY = 0, camName = '';
  function cannons() { var cs = TR[ti2].col.concat(['#ffe45e', '#ff5d73']); var src = [[278, 1], [552, -1]]; for (var si = 0; si < src.length; si++) for (var i = 0; i < 70; i++) parts.push({ x: src[si][0], y: 200, vx: src[si][1] * rnd(10, 90), vy: -rnd(150, 270), g: 150, life: rnd(1.6, 3), c: cs[i % cs.length], w: 2 }); }
  var EV = [[17.5, cannons], [19.2, cannons], [23.7, cannons]], KICKS = [[10.9, 2], [17.55, 6], [19.2, 4], [23.7, 4]], FLASH = [17.55, 19.2, 23.7];

  var shT = document.createElement('canvas'), shG = shT.getContext('2d');
  function trophyDraw(ts, sc, x, y, t, shine) {
    var w = ts.width * sc, h = ts.height * sc;
    if (shine) {
      shT.width = w; shT.height = h; shG.imageSmoothingEnabled = false; shG.drawImage(ts, 0, 0, w, h); shG.globalCompositeOperation = 'source-atop';
      var p = ((t * .6) % 1.7 - .3) * (w + h), bw = Math.max(6, w * .22); shG.fillStyle = 'rgba(255,255,255,.75)';
      shG.beginPath(); shG.moveTo(p, 0); shG.lineTo(p + bw, 0); shG.lineTo(p + bw - h * .5, h); shG.lineTo(p - h * .5, h); shG.fill(); shG.globalCompositeOperation = 'source-over';
      ctx.drawImage(shT, Math.round(x - w / 2), Math.round(y - h));
    } else ctx.drawImage(ts, Math.round(x - w / 2), Math.round(y - h), w, h);
  }
  function glow(x, y, r, col, a) { ctx.globalCompositeOperation = 'lighter'; for (var k = 3; k >= 1; k--) { ctx.fillStyle = hex(col, (a * k / 6).toFixed(3)); ctx.beginPath(); ctx.arc(x, y, r * k / 3, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; }
  function sparkles(x, y, r, t, n, col) {
    ctx.fillStyle = col || '#fff';
    for (var k = 0; k < n; k++) { var v = Math.sin(t * 3 + k * 1.7); if (v < .4) continue; var a = k * 2.4 + t * .3, rr = r * (.6 + .4 * Math.sin(k * 3.1)), sx = Math.round(x + Math.cos(a) * rr), sy = Math.round(y + Math.sin(a) * rr * .8), z = v > .85 ? 3 : 2; ctx.fillRect(sx - z, sy, z * 2 + 1, 1); ctx.fillRect(sx, sy - z, 1, z * 2 + 1); }
  }
  function drawList(list, sc0) {
    list.sort(function (a, b) { return ((a.gy !== undefined ? a.gy : a.y)) - ((b.gy !== undefined ? b.gy : b.y)); });
    for (var li = 0; li < list.length; li++) {
      var e = list[li];
      if (e.fn) { e.fn(); continue; }
      var sc = e.sc || sc0, s = spr(e.a, e.pose, e.kk), w = s.width * sc, h = s.height * sc, z = (e.z || 0) * sc / 3, u = sc / 3;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(Math.round(e.x - w * .4), Math.round(e.y - u / 2), Math.round(w * .8), Math.round(u * 1.3));
      ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y - z));
      if (e.flip) ctx.scale(-1, 1);
      ctx.drawImage(s, -w / 2, -h, w, h);
      if (e.medal) { ctx.fillStyle = '#120e18'; ctx.fillRect(Math.round(-2.5 * u), Math.round(-29 * u), Math.round(5 * u), Math.round(7 * u)); ctx.fillStyle = '#ffd84a'; ctx.fillRect(Math.round(-1.5 * u), Math.round(-27 * u), Math.round(3 * u), Math.round(4 * u)); ctx.fillStyle = '#d83a3a'; ctx.fillRect(Math.round(-.5 * u), Math.round(-29 * u), Math.round(1 * u), Math.round(2 * u)); }
      ctx.restore();
    }
  }
  function fireworks(T) {
    var col = TR[ti2].col, t0 = 17.4, n = Math.floor((T - t0) / .9); if (T < t0) return;
    for (var id = Math.max(0, n - 2); id <= n; id++) {
      var e = (T - t0 - id * .9) / 1.6; if (e < 0 || e >= 1) continue;
      var px = 290 + ((id * 137) % 260), py = 22 + ((id * 47) % 40), c = col[id % col.length];
      ctx.fillStyle = hex(c, (.1 * (1 - e)).toFixed(3)); ctx.beginPath(); ctx.arc(px, py, 30 + e * 20, 0, TAU); ctx.fill();
      for (var k = 0; k < 28; k++) { var a = k / 28 * TAU; var qs = [1, .6]; for (var qi = 0; qi < qs.length; qi++) { var q = qs[qi]; ctx.fillStyle = c; ctx.globalAlpha = (1 - e) * q; ctx.fillRect(Math.round(px + Math.cos(a) * e * 40 * q), Math.round(py + Math.sin(a) * e * 40 * q + e * e * 24), 2, 2); } }
      ctx.globalAlpha = 1;
    }
  }
  function world(T, cx, cy, z, name) {
    camName = name; cx = Math.round(cx); cy = Math.round(cy);
    ctx.setTransform(z, 0, 0, z, -cx * z + SX, -cy * z + SY); ctx.drawImage(bgW, 0, 0);
    var up = T > 17.5;
    for (var fi = 0; fi < FANS.length; fi++) {
      var f = FANS[fi];
      if (f.x < cx - 20 || f.x > cx + W / z + 20) continue;
      var j = Math.round(Math.abs(Math.sin(T * 8 + f.ph)) * (up ? 4 : 1)), s = spr(f.a, up && Math.sin(T * 8 + f.ph) > -.3 ? 'Fu' : 'Fd', 'h');
      ctx.drawImage(s, Math.round(f.x - s.width), f.y - s.height * 2 - j, s.width * 2, s.height * 2);
    }
    txt(ctx, KITS[kitIdx].t, 411, 170, '#ffe45e', 2, 'c', '#000');
    ctx.save(); ctx.beginPath(); ctx.rect(264, 60, 294, 146); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    var bx = 262 + ((T * 70) % 420) - 60; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(bx, 60); ctx.lineTo(bx + 26, 60); ctx.lineTo(bx - 30, 206); ctx.lineTo(bx - 56, 206); ctx.fill(); ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    var lx = [290, 350, 410, 470, 530];
    for (var i = 0; i < lx.length; i++) { var sw = Math.sin(T * 1.3 + i) * 14; ctx.fillStyle = 'rgba(255,246,208,' + (T > 17.4 ? .07 : .045) + ')'; ctx.beginPath(); ctx.moveTo(lx[i] - 4, 54); ctx.lineTo(lx[i] + 4, 54); ctx.lineTo(lx[i] + sw + 34, 208); ctx.lineTo(lx[i] + sw - 34, 208); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    fireworks(T);
    var L = [];
    for (var pi = 0; pi < 10; pi++) { var e = playerEnt(pi, T); if (e) L.push(e); }
    var c = capEnt(T); if (c) L.push(c); L.push(presEnt(T));
    var tp = trophyAt(T), tc = TR[ti2].col[0];
    L.push({ gy: tp.y + 2, fn: function () { var bx2 = tp.x, by = tp.y - tp.z; glow(bx2, by - 18, 34, tc, .5); trophyDraw(TR[ti2].spr, 3, bx2, by, T, true); sparkles(bx2, by - 18, 26, T, 6); } });
    drawList(L, 3);
    for (var qi = 0; qi < parts.length; qi++) { var q = parts[qi]; ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.w, q.w); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function conf(s, t0, n) {
    var cs = TR[ti2].col.concat(['#ffe45e', '#ff5d73']);
    for (var k = 0; k < n; k++) {
      var side = k & 1, age = s - t0 - (k % 9) * .02; if (age < 0) continue;
      var x = (side ? W + 10 : -10) + (side ? -1 : 1) * (50 + ((k * 37) % 120)) * age, y = H + 10 - ((260 + ((k * 53) % 170)) * age - 130 * age * age);
      if (y > H + 8 || y < -30) continue; ctx.fillStyle = cs[k % cs.length]; ctx.fillRect(Math.round(x), Math.round(y), 2, 3);
    }
  }
  function lift(T) {
    var s = T - 15.7, t = TR[ti2]; camName = 'THE LIFT';
    ctx.setTransform(1, 0, 0, 1, SX, SY); ctx.drawImage(bgL, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    var xs = [60, 180, 300, 420];
    for (var i = 0; i < xs.length; i++) { ctx.fillStyle = 'rgba(255,246,208,.06)'; ctx.beginPath(); ctx.moveTo(xs[i] - 6, 0); ctx.lineTo(xs[i] + 6, 0); ctx.lineTo(240 + (xs[i] - 240) * .5 + Math.sin(T * 1.5 + i) * 30 + 50, 196); ctx.lineTo(240 + (xs[i] - 240) * .5 + Math.sin(T * 1.5 + i) * 30 - 50, 196); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    var cheer = s > 1.85, clap = Math.floor(s * 4) & 1, L = [];
    var spot = [[70, 200], [130, 196], [190, 200], [290, 200], [350, 196], [410, 200], [100, 186], [160, 182], [320, 182], [380, 186]];
    for (var k = 0; k < spot.length; k++) L.push({ a: APP[k], kk: 'h', x: spot[k][0], y: spot[k][1], pose: cheer ? 'Auu0' : (clap ? 'Aff0' : 'Add0'), sc: 3, medal: true, z: cheer ? Math.round(Math.abs(Math.sin(s * 8 + k)) * 10) : 0 });
    var sc = s < 1.2 ? 6 : s < 2.4 ? 7 : 8, up = ez(seg(s, .8, 1.8)), cy = 276;
    L.push({ a: CAPA, kk: 'h', x: 240, y: cy, pose: s < 1.3 ? 'Abb0' : 'Auu0', sc: sc, medal: true, z: cheer ? Math.round(Math.abs(Math.sin(s * 5)) * 3) : 0 });
    drawList(L, 3);
    var zt = lerp(22, 42, up), ty = cy - zt * sc / 3, tx = 240;
    glow(tx, ty - sc * 7, 60 + up * 30, t.col[0], .55);
    if (s > 1.85) { var p = Math.sin((s - 1.85) * 3) * .5 + .5; glow(tx, ty - sc * 7, 100, t.col[2], .2 * p); }
    trophyDraw(t.spr, sc, tx, ty, T, true); sparkles(tx, ty - sc * 6, sc * 9, T, 10);
    if (s > 1.85) conf(s, 1.85, 100);
    if (s > 2.0) { var bl = Math.floor(s * 6) & 1; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, 14, W, 34); txt(ctx, 'CHAMPIONS!', 240, 20, bl ? t.col[0] : '#ffffff', 5, 'c', '#000'); }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, 260, W, 10);
  }
  function card(T) {
    var tl = T - 27, t = TR[ti2], K = KITS[kitIdx]; camName = 'CHAMPIONS';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 14; i++) { ctx.fillStyle = hex(t.col[0], (.03).toFixed(2)); ctx.beginPath(); var a = i / 14 * TAU + tl * .15; ctx.moveTo(240, 160); ctx.lineTo(240 + Math.cos(a) * 400, 160 + Math.sin(a) * 400); ctx.lineTo(240 + Math.cos(a + .12) * 400, 160 + Math.sin(a + .12) * 400); ctx.fill(); }
    glow(240, 150, 110, t.col[0], .5);
    var bob = Math.round(Math.sin(tl * 2) * 3);
    trophyDraw(t.spr, 7, 240, 206 + bob, T, true); sparkles(240, 150, 70, T, 14);
    var sh = ((tl * 140) % 760) - 140;
    txt(ctx, 'CHAMPIONS', 240, 18, t.col[0], 6, 'c', '#000');
    ctx.save(); ctx.beginPath(); ctx.rect(sh, 10, 26, 40); ctx.clip(); txt(ctx, 'CHAMPIONS', 240, 18, '#ffffff', 6, 'c'); ctx.restore();
    txt(ctx, t.n, 240, 58, '#ffffff', 3, 'c', '#000');
    txt(ctx, K.t, 240, 222, '#ffe45e', 3, 'c', '#000'); txt(ctx, 'SEASON 2026', 240, 250, '#cfe8d6', 1, 'c');
    ctx.fillStyle = K.s; ctx.fillRect(0, 262, W, 8);
    conf(tl, 0, 120);
  }

  var SHOTS = [{ n: 'WIDE', a: 0, b: 3.5 }, { n: 'MEDALS', a: 3.5, b: 9.5 }, { n: 'HANDOVER', a: 9.5, b: 12 }, { n: 'THE WALK', a: 12, b: 15.7 }, { n: 'THE LIFT', a: 15.7, b: 19.2 }, { n: 'CELEBRATION', a: 19.2, b: 23.7 }, { n: 'FIREWORKS', a: 23.7, b: 27 }, { n: 'CHAMPIONS', a: 27, b: 31 }];
  var MSG = ['THE CEREMONY BEGINS', 'MEDALS FOR THE CHAMPIONS', 'THE CAPTAIN RECEIVES THE TROPHY', 'UP THE STEPS TO THE STAGE', '', 'THE TEAM CELEBRATES', 'FIREWORKS OVER THE STADIUM', ''];
  var END = 32.4, LAST = 31;
  var T = 0, lastShot = -1, fl = 0, fired = {};
  var shotAt = function (t) { for (var i = 0; i < SHOTS.length; i++) if (t < SHOTS[i].b) return i; return SHOTS.length - 1; };
  function reset() { T = 0; parts = []; fired = {}; lastShot = -1; }
  function overlay(t, si) {
    var home = KITS[kitIdx], tr = TR[ti2];
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(96, 3, 288, 17); ctx.fillStyle = home.s; ctx.fillRect(96, 3, 5, 17); ctx.fillStyle = tr.col[0]; ctx.fillRect(379, 3, 5, 17);
    txt(ctx, tr.n, 240, 5, '#fff', 1, 'c'); txt(ctx, home.t + ' - CHAMPIONS', 240, 12, '#ffe45e', 1, 'c');
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 3, 86, 14); txt(ctx, camName, 8, 6, '#ffe45e', 1);
    var msg = MSG[si];
    if (msg) { ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(4, 236, msg.length * 4 + 14, 13); ctx.fillStyle = home.s; ctx.fillRect(4, 236, 4, 13); txt(ctx, msg, 13, 240, '#fff', 1); }
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, 266, W, 4); ctx.fillStyle = '#ffe45e'; ctx.fillRect(0, 266, Math.round(clamp(t / LAST, 0, 1) * W), 4);
    ctx.fillStyle = '#000'; for (var si2 = 0; si2 < SHOTS.length; si2++) ctx.fillRect(Math.round(SHOTS[si2].a / LAST * W), 266, 1, 4);
    for (var i = 0; i < TR.length; i++) { var x = 24 + i * 22; ctx.fillStyle = i === ti2 ? '#ffe45e' : 'rgba(8,14,12,.8)'; ctx.fillRect(x, 252, 18, 10); txt(ctx, i + 1, x + 9, 255, i === ti2 ? '#10201a' : '#cfe8d6', 1, 'c'); }
    if (fl > .02) { ctx.fillStyle = 'rgba(255,255,255,' + (fl * .6).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  var active = false, raf = 0, last = 0, onDone = null;

  function frame(now) {
    if (!active) return;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
    if (T > END) { reset(); }
    var t = Math.min(T, LAST), si = shotAt(T);
    for (var ei = 0; ei < EV.length; ei++) { var e = EV[ei]; if (t >= e[0] && !fired[ei]) { fired[ei] = 1; e[1](); } }
    for (var qi = 0; qi < parts.length; qi++) { var q = parts[qi]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
    parts = parts.filter(function (q) { return q.life > 0; });
    var a = 0; for (var ki = 0; ki < KICKS.length; ki++) if (t >= KICKS[ki][0]) a += KICKS[ki][1] * Math.exp(-(t - KICKS[ki][0]) * 8);
    SX = Math.round(Math.sin(t * 70) * a); SY = Math.round(Math.cos(t * 63) * a);
    var f2 = 0; for (var fi = 0; fi < FLASH.length; fi++) if (t >= FLASH[fi]) f2 = Math.max(f2, Math.exp(-(t - FLASH[fi]) * 7));
    fl = f2;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (si === 0) world(t, lerp(150, 130, ez(seg(t, 0, 3.5))), 0, 1, 'WIDE');
    else if (si === 1) world(t, lerp(80, 190, ez(seg(t, 3.5, 9.5))), 112, 2, 'MEDALS');
    else if (si === 2) world(t, 110, 160, 3, 'HANDOVER');
    else if (si === 3) { var c = capEnt(t); world(t, clamp((c ? c.x : 200) - 110, 100, 400), 118, 2, 'THE WALK'); }
    else if (si === 4) lift(t);
    else if (si === 5) t < 21.2 ? world(t, 300, 100, 2, 'CELEBRATION') : world(t, 160, 0, 1, 'CELEBRATION WIDE');
    else if (si === 6) world(t, lerp(160, 120, seg(t, 23.7, 27)), 0, 1, 'FIREWORKS');
    else card(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = 'rgba(0,0,0,.09)'; for (var kk = 0; kk < 5; kk++) ctx.strokeRect(kk + .5, kk + .5, W - 2 * kk - 1, H - 2 * kk - 1);
    if (si === 6) { var tt = TR[ti2]; txt(ctx, 'CHAMPIONS', 240, 44, Math.floor(t * 4) & 1 ? tt.col[0] : '#fff', 6, 'c', '#000'); }
    overlay(t, si);
    raf = requestAnimationFrame(frame);
  }

  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var k = Math.min(vw / W, vh / H);
    cv.width = W; cv.height = H;
    cv.style.width = Math.floor(W * k) + 'px';
    cv.style.height = Math.floor(H * k) + 'px';
    ctx.imageSmoothingEnabled = false;
  }

  function showTrophyLift(opts, done) {
    opts = opts || {};
    var comp = opts.competition || 'Champions';
    var key = opts.key;
    if (key && TR.some(function (x) { return x.n === key; })) {
      ti2 = TR.findIndex(function (x) { return x.n === key; });
    } else {
      var k = keyFor(comp); ti2 = Math.max(0, TR.findIndex(function (x) { return x.n === k; }));
    }
    // Match the ceremony team's kit to the winning side when the game passes one.
    kitIdx = 0;
    if (opts.kit && opts.kit.shirt) {
      for (var i = 0; i < KITS.length; i++) if (String(KITS[i].s).toLowerCase() === String(opts.kit.shirt).toLowerCase()) { kitIdx = i; break; }
    }
    onDone = typeof done === 'function' ? done : null;
    var screen = document.getElementById('trophyScreen');
    if (screen) screen.style.display = 'block';
    buildBG(); reset();
    fit();
    SC.clear();
    active = true; last = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function trophyLiftContinue() {
    if (!active) return;
    active = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    var screen = document.getElementById('trophyScreen');
    if (screen) screen.style.display = 'none';
    var cb = onDone; onDone = null;
    if (cb) cb();
  }

  function hideTrophyLift() {
    if (!active) return;
    active = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    var screen = document.getElementById('trophyScreen');
    if (screen) screen.style.display = 'none';
    onDone = null;
  }

  addEventListener('resize', function () { if (active) fit(); });
  addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); trophyLiftContinue(); }
  }, true);

  var screenEl = document.getElementById('trophyScreen');
  if (screenEl) screenEl.addEventListener('pointerdown', function (e) {
    if (!active) return;
    if (e.target && e.target.id === 'trophyContinue') return;
    trophyLiftContinue();
  });

  window.showTrophyLift = showTrophyLift;
  window.trophyLiftContinue = trophyLiftContinue;
  window.hideTrophyLift = hideTrophyLift;
  window.trophyLiftActive = function () { return active; };

  // Let skip.js drive the trophy lift too, so a gamepad can skip it and the
  // on-screen SKIP button appears (the keyboard / pointer handlers above stay).
  if (window.psSkip && typeof window.psSkip.register === "function") {
    window.psSkip.register({
      id: "trophy",
      active: function () { return active; },
      skip: function () { trophyLiftContinue(); }
    });
  }
})();
