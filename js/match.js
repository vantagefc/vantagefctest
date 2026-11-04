/* ==========================================================================
   Vantage FC - match.js  (ground-up arcade match, V1.30.0)
   --------------------------------------------------------------------------
   A clean, self-contained top-down arcade football match. This file owns the
   whole playing experience: input, movement, AI, the ball, set pieces,
   celebrations, the HUD and the frame loop.

   The heavy data/bookkeeping systems (My Club tables, market, sponsors,
   injuries/suspensions, penalty shootout, headshots) are carried over
   verbatim further down the file so every other screen keeps working.

   World coordinates: the pitch runs x = field.x .. field.x+width and
   y = field.y .. field.y+height. Blue attacks +x (right), red attacks -x.
   ========================================================================== */

/* ------------------------------------------------------------------ *
 * 1. State
 * ------------------------------------------------------------------ */

let freekick = null;         // active free-kick restart {team,x,y,taker,wait,kind,...}
let matchPenalty = null;     // active in-match penalty {team,taker,keeper,phase,wait,...}
let practiceDrill = null;    // legacy practice rep state (unused now: drills run in PSMatch)
let practiceKind = null;     // active practice kind ('open'|'freekick'|'corner'|'penalty') or null
let invasion = null;         // pitch invasion {frames,crowd[],kind,leaving}
let cardFlash = null;        // yellow/red card flash {color,text,name,frames}

let cutsceneMatchSeen = false;
let cutsceneIntroDone = false;
let walkoutT = 0;
let walkoutDone = false;
let walkoutCards = null;

let shotHeld = false;
let tackleBlockedThisFrame = false;

const MAX_CHARGE_FRAMES = 45;
const MIN_CHARGE_MULTIPLIER = 0.7;
const MAX_CHARGE_MULTIPLIER = 1.8;
const SHOT_MODES = ["normal", "chip", "curve", "driven", "bicycle"];

const FREEKICK_WAIT_FRAMES = 90;
const MATCH_PENALTY_WAIT_FRAMES = 60;
const PRACTICE_COOLDOWN = 70;
const PRACTICE_REP_WAIT = 60;
const INVADE_STAY_FRAMES = 420;

const INVADE_COLORS = ["#ff2b2b", "#e63946", "#ff7f3f", "#ffd43b", "#69db7c", "#3dd6ff", "#b957d9", "#f4f6f8"];

// AI tuning
const AI_SHOOT_RANGE = 1000;     // how close before an AI carrier shoots
const AI_SHOOT_CHANCE = 0.18;    // per-frame shot chance once in range
const AI_PASS_PRESSURE = 95;     // defender distance that makes a carrier pass
const AI_PASS_CHANCE = 0.05;     // per-frame pass chance under pressure
const AI_KEEPER_HOLD = 45;       // frames a keeper holds before distributing
const AI_TACKLE_CHANCE = 0.03;   // per-frame chance a press wins the ball
const AI_FOUL_CHANCE = 0.01;     // per-frame chance a press concedes a foul

// Frames a kicked ball ignores player collisions, so it can clear the kicker
// (and the crowd at his feet) instead of bouncing straight back off him.
const KICK_IMMUNITY = 10;

/* ==================================================================== *
 * 1b. PIXEL STRIKER FC match engine (ported verbatim from Pixel Striker
 *     FC.html). It owns its own 480x270 world, sprites, physics, AI,
 *     controls and HUD, and renders to an offscreen canvas that the
 *     outer frame loop blits onto the game canvas. Wrapped in an IIFE so
 *     none of its (very generic) globals leak into the game.
 * ==================================================================== */
const PSMatch = (function () {
  'use strict';
  const VW = 480, VH = 270;
  const ocv = document.createElement('canvas'); ocv.width = VW; ocv.height = VH;
  const ctx = ocv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  /* ---------- helpers ---------- */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hyp = Math.hypot, TAU = Math.PI * 2;
  function seeded(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function hashStr(str) { let h = 2166136261 >>> 0; str = String(str || "club").toLowerCase(); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1);
    return hyp(px - (ax + dx * t), py - (ay + dy * t));
  }
  function hexRGB(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function colDist(a, b) { const x = hexRGB(a), y = hexRGB(b); return hyp(x[0] - y[0], x[1] - y[1], x[2] - y[2]); }

  /* ---------- world ---------- */
  const WW = 800, WH = 432;
  const PX0 = 48, PX1 = 752, PY0 = 36, PY1 = 396;
  const PW = PX1 - PX0, PH = PY1 - PY0, CX = (PX0 + PX1) / 2, CY = (PY0 + PY1) / 2;
  const GOAL_HALF = 40, GOAL_TOP = CY - GOAL_HALF, GOAL_BOT = CY + GOAL_HALF, GOAL_DEPTH = 18, BAR_H = 26;
  const BOX_D = 100, BOX_HALF = 84, SIX_D = 34, SIX_HALF = 46;
  const G = 380, FRIC = 1.0;
  const BASE_SPEED = 62, SPRINT_MULT = 1.32;
  const ownGoalX = t => t === 0 ? PX0 : PX1;
  const attackGoalX = t => t === 0 ? PX1 : PX0;
  const fracAttack = (x, t) => t === 0 ? (x - PX0) / PW : (PX1 - x) / PW;

  /* ---------- data ---------- */
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
  const GK_COLS = ['#e8e03a', '#3ae8b0', '#ff6fb5', '#ff9a3a', '#9bd0ff'];
  const DIFFS = [
    { n: 'EASY', spd: .80, gk: .45, tk: .26, react: .72 },
    { n: 'NORMAL', spd: .90, gk: .58, tk: .40, react: .88 },
    { n: 'HARD', spd: 1.00, gk: .72, tk: .54, react: 1.05 }
  ];
  // Your own AI team-mates (and your keeper) always play at this fixed level so
  // that turning the opponent difficulty down does not also weaken your side.
  const TEAMMATE = { n: 'TEAMMATE', spd: .96, gk: .72, tk: .5, react: 1 };
  const LENS = [2, 3, 5];
  const FORM = [
    { r: 'GK', fx: .03, fy: .5, push: 0, drop: 0 },
    { r: 'LB', fx: .20, fy: .14, push: .14, drop: 0 },
    { r: 'CB', fx: .18, fy: .38, push: .08, drop: 0 },
    { r: 'CB', fx: .18, fy: .62, push: .08, drop: 0 },
    { r: 'RB', fx: .20, fy: .86, push: .14, drop: 0 },
    { r: 'LM', fx: .42, fy: .12, push: .22, drop: .06 },
    { r: 'CM', fx: .40, fy: .38, push: .20, drop: .08 },
    { r: 'CM', fx: .40, fy: .62, push: .20, drop: .08 },
    { r: 'RM', fx: .42, fy: .88, push: .22, drop: .06 },
    { r: 'ST', fx: .62, fy: .38, push: .22, drop: .12 },
    { r: 'ST', fx: .62, fy: .62, push: .22, drop: .12 }
  ];
  let homeForm = FORM;
  const awayForm = FORM;
  // Build a formation from defender/midfielder/attacker counts. The PSMatch
  // index order stays keeper -> defence -> midfield -> attack so the engine's
  // squad-name bridge and roster slot mapping keep pointing at the same men.
  function makeForm(nd, nm, na) {
    nd = Math.max(1, nd | 0); nm = Math.max(1, nm | 0); na = Math.max(1, na | 0);
    const out = [FORM[0]];
    const add = function (count, fx, y0, y1, labels, push, drop) {
      for (let i = 0; i < count; i++) {
        const fy = count === 1 ? (y0 + y1) / 2 : y0 + (y1 - y0) * (i / (count - 1));
        out.push({ r: labels(i, count), fx: fx, fy: fy, push: push, drop: drop });
      }
    };
    add(nd, .19, .14, .86, function (i, n) {
      if (n === 3) return 'CB';
      if (i === 0) return 'LB';
      if (i === n - 1) return 'RB';
      return 'CB';
    }, .12, 0);
    add(nm, .42, .12, .88, function (i, n) {
      if (n >= 4 && i === 0) return 'LM';
      if (n >= 4 && i === n - 1) return 'RM';
      return 'CM';
    }, .21, .07);
    add(na, .62, .36, .64, function () { return 'ST'; }, .22, .12);
    return out.slice(0, 11);
  }
  const SKINS = ['#f6d1a8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4328'];
  const HAIRS = ['#1b1410', '#3b2412', '#7a4a21', '#d8b25a', '#b5452c', '#d9d9d9'];

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
  const text = (str, x, y, col, s, align, shadow) => textOn(ctx, str, x, y, col, s, align, shadow);

  /* ---------- audio ---------- */
  let AC = null, muted = false;
  function initAudio() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  function tone(freq, dur, type, vol, slide, delay) {
    if (!AC || muted) return;
    try {
      const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(vol || .05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + .03);
    } catch (e) { }
  }
  function noise(dur, vol, delay) {
    if (!AC || muted) return;
    try {
      const n = Math.max(1, Math.floor(AC.sampleRate * dur)), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 1800; s.buffer = b; g.gain.value = vol || .05;
      s.connect(f); f.connect(g); g.connect(AC.destination); s.start(AC.currentTime + (delay || 0));
    } catch (e) { }
  }
  const sfx = {
    kick() { tone(170, .09, 'triangle', .12, -100); noise(.05, .05); },
    pass() { tone(210, .07, 'triangle', .09, -90); noise(.04, .03); },
    shot() { tone(120, .16, 'sawtooth', .1, -80); noise(.12, .08); },
    tackle() { noise(.08, .08); tone(90, .08, 'square', .05, -40); },
    save() { tone(300, .1, 'square', .06, -120); noise(.09, .06); },
    post() { tone(1000, .14, 'triangle', .1, -400); },
    whistle() { tone(2300, .16, 'sine', .07); tone(2500, .32, 'sine', .07, 0, .18); },
    goal() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .2, 'square', .05, 0, i * .1)); noise(1.8, .05); },
    end() { tone(2300, .2, 'sine', .07); tone(2300, .2, 'sine', .07, 0, .3); tone(2500, .5, 'sine', .07, 0, .6); }
  };
  function toggleMute() { muted = !muted; }

  /* ---------- sprites ---------- */
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

  /* ---------- pitch ---------- */
  // The bowl is rebuilt per match from the stadium spec (js/stadium.js): two
  // stand stone shades, a sky tint, a hoarding colour, an ad palette and the
  // grass stripes. Everything is seeded so a given ground always looks the
  // same, and two clubs' grounds never look identical.
  const pitchCv = document.createElement('canvas'); pitchCv.width = WW; pitchCv.height = WH;
  let curStad = null;
  function stadOrDefault(s) {
    return s || { sky1: '#0b1220', sky2: '#17263a', standA: '#2b323e', standB: '#313846', hoarding: '#20242d', ads: ['#c8321f', '#1f5fc8', '#e8b81f', '#1f9a5a', '#8a3fc8', '#e8701f'], crowd: '#ccd0d9', dense: .84, grassA: '#348236', grassB: '#3b8c3d' };
  }
  function buildPitch(stad) {
    stad = stadOrDefault(stad);
    curStad = stad;
    const g = pitchCv.getContext('2d'), R = seeded(stad.club ? hashStr(stad.club) : 1234);
    // sky behind the bowl, tinted by the ground's theme
    const sky = g.createLinearGradient(0, 0, 0, WH);
    sky.addColorStop(0, stad.sky1); sky.addColorStop(1, stad.sky2);
    g.fillStyle = sky; g.fillRect(0, 0, WW, WH);
    const cc = [stad.crowd, '#e8e8e8', '#d94f4f', '#e8c24a', '#4a90d9', '#7bd96a', '#c86ad9', '#9ad9d6'];
    const dense = typeof stad.dense === 'number' ? stad.dense : .84;
    function crowd(x, y, w, h) {
      g.fillStyle = stad.standA; g.fillRect(x, y, w, h);
      // stand tiers: alternate the two stone shades in horizontal bands
      g.fillStyle = stad.standB;
      for (let ty = y; ty < y + h; ty += 10) g.fillRect(x, ty, w, 2);
      // walkway gap so big bowls read as terraced
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + Math.max(6, (h * .45) | 0), w, 2);
      for (let yy = y + 2; yy < y + h - 1; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 3) if (R() < dense) {
        g.fillStyle = cc[(R() * cc.length) | 0]; g.fillRect(xx, yy, 2, 2);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(xx, yy + 1, 2, 1);
      }
    }
    crowd(0, 0, WW, 22); crowd(0, WH - 22, WW, 22); crowd(0, 22, 22, WH - 44); crowd(WW - 22, 22, 22, WH - 44);
    // roof line above the far stand
    g.fillStyle = stad.standB; g.fillRect(0, 0, WW, 4);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 4, WW, 1);
    const ads = ['PIXEL', 'RETRO', 'BYTE', 'VOXEL', 'ARCADE', 'SPRITE', 'GLITCH', '8-BIT'], adc = stad.ads;
    for (let x = 30, i = 0; x < WW - 30; x += 70, i++) {
      const w = Math.min(70, WW - 30 - x);
      g.fillStyle = adc[i % adc.length]; g.fillRect(x, 22, w, 8); g.fillRect(x, WH - 30, w, 8);
      textOn(g, ads[i % ads.length], x + w / 2, 24, '#fff', 1, 'c'); textOn(g, ads[(i + 3) % ads.length], x + w / 2, WH - 28, '#fff', 1, 'c');
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 29, w, 1); g.fillRect(x, WH - 23, w, 1);
    }
    for (let y = 30, i = 0; y < WH - 30; y += 24, i++) {
      g.fillStyle = adc[(i + 2) % adc.length]; g.fillRect(22, y, 8, Math.min(24, WH - 30 - y)); g.fillRect(WW - 30, y, 8, Math.min(24, WH - 30 - y));
    }
    g.save(); g.beginPath(); g.rect(30, 30, WW - 60, WH - 60); g.clip();
    for (let i = -1; i < 18; i++) { g.fillStyle = (i & 1) ? stad.grassA : stad.grassB; g.fillRect(PX0 + i * 44, 30, 44, WH - 60); }
    for (let i = 0; i < 2200; i++) {
      const x = 30 + R() * (WW - 60), y = 30 + R() * (WH - 60);
      g.fillStyle = R() < .5 ? stad.grassB : stad.grassA; g.fillRect(x | 0, y | 0, R() < .5 ? 1 : 2, R() < .4 ? 2 : 1);
    }
    // subtle mow-ring highlight down the pitch centre
    g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(CX - 60, 30, 120, WH - 60);
    g.restore();
    g.fillStyle = '#e9f5e1';
    const px = (x, y) => g.fillRect(Math.round(x), Math.round(y), 1, 1);
    g.fillRect(PX0, PY0, PW + 1, 1); g.fillRect(PX0, PY1, PW + 1, 1); g.fillRect(PX0, PY0, 1, PH + 1); g.fillRect(PX1, PY0, 1, PH + 1); g.fillRect(CX, PY0, 1, PH);
    g.fillRect(PX0, CY - BOX_HALF, BOX_D, 1); g.fillRect(PX0, CY + BOX_HALF, BOX_D, 1); g.fillRect(PX0 + BOX_D, CY - BOX_HALF, 1, BOX_HALF * 2 + 1);
    g.fillRect(PX1 - BOX_D, CY - BOX_HALF, BOX_D, 1); g.fillRect(PX1 - BOX_D, CY + BOX_HALF, BOX_D, 1); g.fillRect(PX1 - BOX_D, CY - BOX_HALF, 1, BOX_HALF * 2 + 1);
    g.fillRect(PX0, CY - SIX_HALF, SIX_D, 1); g.fillRect(PX0, CY + SIX_HALF, SIX_D, 1); g.fillRect(PX0 + SIX_D, CY - SIX_HALF, 1, SIX_HALF * 2 + 1);
    g.fillRect(PX1 - SIX_D, CY - SIX_HALF, SIX_D, 1); g.fillRect(PX1 - SIX_D, CY + SIX_HALF, SIX_D, 1); g.fillRect(PX1 - SIX_D, CY - SIX_HALF, 1, SIX_HALF * 2 + 1);
    g.fillRect(PX0 + 70 - 1, CY - 1, 3, 3); g.fillRect(PX1 - 70 - 1, CY - 1, 3, 3); g.fillRect(CX - 1, CY - 1, 3, 3);
    for (let a = 0; a < TAU; a += .012) {
      px(CX + Math.cos(a) * 46, CY + Math.sin(a) * 46);
      const ax = PX0 + 70 + Math.cos(a) * 46, ay = CY + Math.sin(a) * 46; if (ax > PX0 + BOX_D + .5) px(ax, ay);
      const bx = PX1 - 70 + Math.cos(a) * 46; if (bx < PX1 - BOX_D - .5) px(bx, ay);
    }
    for (let a = 0; a < TAU / 4; a += .05) {
      const c = Math.cos(a) * 7, s = Math.sin(a) * 7;
      px(PX0 + c, PY0 + s); px(PX1 - c, PY0 + s); px(PX0 + c, PY1 - s); px(PX1 - c, PY1 - s);
    }
    function net(x, y, w, h) {
      g.fillStyle = 'rgba(8,20,12,.55)'; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(230,240,235,.5)';
      for (let xx = x; xx < x + w; xx += 3) g.fillRect(xx, y, 1, h);
      for (let yy = y; yy < y + h; yy += 3) g.fillRect(x, yy, w, 1);
    }
    net(PX0 - GOAL_DEPTH, GOAL_TOP, GOAL_DEPTH, GOAL_HALF * 2 + 1); net(PX1 + 1, GOAL_TOP, GOAL_DEPTH, GOAL_HALF * 2 + 1);
    g.fillStyle = '#e9f5e1';
    g.fillRect(PX0 - GOAL_DEPTH - 1, GOAL_TOP, 1, GOAL_HALF * 2 + 1); g.fillRect(PX1 + GOAL_DEPTH + 1, GOAL_TOP, 1, GOAL_HALF * 2 + 1);
    g.fillRect(PX0 - GOAL_DEPTH - 1, GOAL_TOP, GOAL_DEPTH + 1, 1); g.fillRect(PX0 - GOAL_DEPTH - 1, GOAL_BOT, GOAL_DEPTH + 1, 1);
    g.fillRect(PX1, GOAL_TOP, GOAL_DEPTH + 2, 1); g.fillRect(PX1, GOAL_BOT, GOAL_DEPTH + 2, 1);
    [[PX0, GOAL_TOP], [PX0, GOAL_BOT], [PX1, GOAL_TOP], [PX1, GOAL_BOT]].forEach(p => { g.fillStyle = '#101418'; g.fillRect(p[0] - 2, p[1] - 2, 5, 5); g.fillStyle = '#fff'; g.fillRect(p[0] - 1, p[1] - 1, 3, 3); });
  }
  buildPitch();

  /* ---------- input ---------- */
  const keys = {}, btn = { pass: 0, shoot: 0, lob: 0, skill: 0, sprint: 0 };
  const edge = { pass: 0, shoot: 0, lob: 0, skill: 0, sprint: 0, pause: 0, start: 0, up: 0, down: 0, left: 0, right: 0 };
  const rel = { shoot: 0 }, stick = { x: 0, y: 0 };
  let tap = null;
  function setBtn(n, d) { initAudio(); if (d && !btn[n]) edge[n] = 1; if (!d && btn[n] && n === 'shoot') rel.shoot = 1; btn[n] = d ? 1 : 0; }
  function moveVec() {
    let x = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    let y = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    x += stick.x; y += stick.y;
    const m = hyp(x, y); if (m > 1) { x /= m; y /= m; }
    return { x: x, y: y, mag: Math.min(1, m) };
  }
  function clearEdges() { for (const k in edge) edge[k] = 0; rel.shoot = 0; tap = null; }

  /* ---------- game state ---------- */
  let state = 'title', paused = false, time = 0, titleT = 0;
  let score = [0, 0], clock = 0, matchLen = 180, diff = DIFFS[1];
  // Added / injury time: `stoppage` accumulates lost time (goals, cards,
  // penalties) in displayed minutes over the match; `addedMin` is the total the
  // referee settles on the instant normal time runs out, and the clock then runs
  // 90+N' until the final whistle. -1 means "not decided yet".
  let stoppage = 0, addedMin = -1;
  // A match is split into halves: half 1 ends at 45', half 2 at 90', and a level
  // knockout adds extra-time halves 3 (105') and 4 (120'). `halfStart` is the sim
  // clock the current half kicked off at and `halfStartMin` the minute it began
  // on, so the pitch clock reads continuously across each half. Each half gets
  // its own added time. A break (`state === 'break'`) runs between every half.
  let half = 1, halfStart = 0, halfStartMin = 0, breakNext = 0, breakT = 0;
  // Crowd Cam cutscene: plays before every half (pre-match + each break). It is
  // a pure renderer (window.crowdCamDraw); the engine just feeds it the elapsed
  // time. `crowdT` counts up through a break so the break cam animates.
  let crowdT = 0;
  const BREAK_T = 5.2;
  // Last Minute Winner cutscene: a full-screen sequence shown once when a
  // closing-time goal wins it. It is a pure renderer (window.lastMinuteWinnerDraw);
  // the engine just counts `winnerT` up while `state === 'winner'` and hands the
  // scene the names/score/minute via `winnerData`. When it finishes the goal
  // resolves normally, so a winner at 90'+ still rolls into full time / ET.
  let winnerT = 0, winnerData = null;
  const WINNER_T = 7.5;
  // Substitution cutscene: a TV-style stoppage shown when a substitution is made
  // (from the pause menu). It is a pure renderer (window.substitutionDraw); the
  // engine counts `subT` up while `state === 'sub'`, freezes the sim, and hands
  // the scene the two players plus the scoreboard via `subData`. When it ends the
  // match simply resumes in the state it left off in.
  let subT = 0, subData = null, subReturn = 'play';
  // Extra time: knockout ties level after 90' roll into 2x15 more. `cfgEt` enables
  // it for this match; `etActive` marks it live; `etStart` is the sim clock it
  // began at, and `etLen` its total length in sim seconds (30 displayed minutes
  // at the same real-time pace as regulation).
  let cfgEt = false, etActive = false, etStart = 0, etLen = 0;
  let teams = [KITS[0], KITS[1]], gkKits = [null, null];
  let players = [], ball = null, controlled = null, restart = null, scorer = null, goalTeam = 0, goalT = 0, fullT = 0;
  let stats = null, banner = null, flash = null, parts = [], hintT = 0, switchCD = 0;
  // Player Career: the user owns one footballer, not the whole XI. When `solo`
  // is set the cursor never switches to a teammate; if that player is sent off
  // the side finishes the match under AI control.
  let solo = false, soloPlayer = null;
  let penPending = null;   // team awaiting the outcome of a penalty they just took
  let drill = null;   // practice drill {kind,reps,scored,cd}; benches everyone bar taker + opp GK
  let cardPop = null; // active card presentation {type,num,team,name,t} for the HUD
  let cardCount = [[0, 0], [0, 0]]; // [yellow,red] per team, for the HUD tally
  let chaser = [null, null], cover = [null, null];
  const cam = { x: 0, y: 0 };
  const menu = { row: 0, kit: 0, opp: 1, len: 1, diff: 1 };
  const D = p => p.team === 1 ? diff : TEAMMATE;
  const playerOf = (t, i) => players[t * 11 + i];
  function findSoloPlayer(cfg) {
    if (!solo) return null;
    const wanted = String(cfg.soloName || (typeof playerName !== "undefined" ? playerName : "") || "").trim().toLowerCase();
    let found = null;
    if (wanted) {
      for (const p of players) {
        if (p.team !== 0) continue;
        if (String(p.name || "").trim().toLowerCase() === wanted) { found = p; break; }
      }
    }
    return found || playerOf(0, 8) || playerOf(0, 9) || playerOf(0, 10) || null;
  }
  function keepSoloControl() {
    if (!solo) return false;
    controlled = (soloPlayer && !soloPlayer.sentOff && !soloPlayer.bench) ? soloPlayer : null;
    return true;
  }
  const newStats = () => ({ shots: [0, 0], on: [0, 0], poss: [0, 0], tackles: [0, 0], saves: [0, 0], chances: [0, 0], pens: [0, 0], penScored: [0, 0] });
  const HOOK = { goal: null, end: null, stop: null };
  // Notify the game that play has stopped (a dead ball or a card) so it can
  // carry out any substitution the player queued from the pause menu.
  function fireStop() {
    // The human's queued change takes this stoppage first; if the game did not
    // start a cutscene (no sub queued, or it could not launch this time) the AI
    // gets to play out any change it has staged. Only one cutscene at a time, so
    // a deferred side simply waits for the next stoppage.
    if (HOOK.stop) { try { HOOK.stop(); } catch (e) { } }
    if (state !== 'sub') aiFlushSub();
  }

  /* ---------- AI substitutions ----------
   * The opposing side (team 1) manages its own bench. From around the hour
   * mark it watches for a tired or quiet outfield player and, once play next
   * stops, brings a fresh same-role player on for them - up to three changes,
   * exactly like a real bench. It plays the full substitution cutscene so the
   * AI's changes read the same as the human's. */
  let aiSubsUsed = 0, aiSubNextAt = 0, aiStagedOff = null;
  const AI_MAX_SUBS = 3;
  const AI_SUB_START = 0.62;   // don't react before ~62% of the match
  const AI_SUB_END = 0.92;     // leave it late but not pointless
  function aiSubReset() { aiSubsUsed = 0; aiSubNextAt = 0; aiStagedOff = null; aiBenchCache = aiBench(); }

  // The bench the AI can draw on. Named clubs carry one on TEAM_ROSTERS; anyone
  // else gets a generated set of generic cover names so every match has depth.
  function aiBench() {
    const t = 1;
    let club = "";
    try { if (typeof getOpponentTeam === "function") { const o = getOpponentTeam(); club = (typeof o === "string") ? o : (o && o.name) || ""; } } catch (e) { }
    const out = [];
    const roster = club && (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
    if (roster) {
      const pools = [roster.bench || [], roster.reserves || []];
      for (const pool of pools) for (const rp of pool) if (rp && rp.name) out.push({ name: rp.name, role: rp.role || "midfielder" });
    }
    if (!out.length) {
      const gen = ["Andrews", "Bello", "Cruz", "Diaz", "Egan", "Fischer", "Grant", "Haas", "Ivanov", "Jensen", "Kane", "Lopez"];
      const roles = ["defender", "midfielder", "midfielder", "attacker", "attacker", "defender", "midfielder"];
      for (let i = 0; i < 7; i++) out.push({ name: gen[i % gen.length], role: roles[i % roles.length] });
    }
    return out;
  }
  let aiBenchCache = aiBench();

  // Which of the AI eleven shares a role - so a sub keeps the shape sensible.
  function aiRoleName(p) { return p && p.isGK ? "goalkeeper" : (p && p.role) || "midfielder"; }

  function aiPickTired() {
    const out = [];
    for (let i = 1; i < 11; i++) {   // never sub the keeper
      const p = playerOf(1, i);
      if (!p || p.sentOff || p.bench) continue;
      out.push(p);
    }
    if (!out.length) return null;
    // Prefer the most tired; tie-break on goals/assists being quiet is overkill,
    // so tiredness plus a little randomness reads naturally.
    out.sort((a, b) => a.stamina - b.stamina);
    const worst = out[0];
    if (worst.tired || worst.stamina < 0.22 || Math.random() < 0.25) return worst;
    return null;
  }

  function aiMakeFresh(onRole) {
    const p = playerOf(1, 1);   // borrow an outfield template for kits/coords
    return {
      team: 1, i: 11 + (aiSubsUsed), form: p ? p.form : FORM[5], isGK: false, num: 12 + aiSubsUsed, kit: null,
      x: p ? p.x : 0, y: p ? p.y : 0, vx: 0, vy: 0, fx: -1, fy: 0, dir: 'left',
      skin: SKINS[(Math.random() * SKINS.length) | 0], hair: HAIRS[(Math.random() * HAIRS.length) | 0],
      role: onRole,
      stamina: 1, tired: false, anim: 0, kickT: 0, noCatch: 0, stun: 0, tackleCD: 0, slideT: 0, slideHit: false, skillT: 0, skillCD: 0,
      charging: false, charge: 0, sprinting: false, diveT: 0, diveCD: 0, diveVx: 0, diveVy: 0, holdT: 0, gkErr: 0, gkErrT: 0,
      decideT: 0, shotCD: 0, lunge: 0, lx: 0, ly: 0, touchPh: 0, carryT: 0, bench: false,
      cards: 0, sentOff: false, foulCD: 0
    };
  }

  // Perform the swap in-place and return the cutscene data (or null).
  function aiDoSub() {
    const off = aiStagedOff;
    aiStagedOff = null;
    if (!off || players.indexOf(off) < 0 || off.sentOff || off.bench) return null;
    const onRole = aiRoleName(off);
    const idx = players.indexOf(off);
    const benchPool = aiBenchCache.slice();
    const onInfo = benchPool[aiSubsUsed % benchPool.length] || { name: "SUBBED", role: onRole };
    const on = aiMakeFresh(onRole);
    on.name = onInfo.name || ("#" + on.num);
    // Start the substitute exactly where the man came off, facing the same way.
    on.x = off.x; on.y = off.y; on.fx = off.fx; on.fy = off.fy; on.dir = off.dir;
    players[idx] = on;
    if (controlled === off) controlled = null;
    aiSubsUsed++;
    return {
      home: teams[0].team, away: teams[1].team,
      kitHome: teams[0].shirt, kitAway: teams[1].shirt,
      score: score.slice(),
      minute: clockText(),
      off: { name: off.name || ("#" + off.num), num: off.num, lines: [aiRoleName(off).toUpperCase(), "COMES OFF"] },
      on: { name: onInfo.name, num: on.num, lines: [onRole.toUpperCase(), "COMES ON"] }
    };
  }

  // Drives the AI bench. Called each frame while play is live; the actual swap
  // is deferred to the next stoppage so it never interrupts open play.
  function aiSubTick() {
    if (drill || aiStagedOff) return;
    if (aiSubsUsed >= AI_MAX_SUBS) return;
    const frac = matchLen > 0 ? clock / matchLen : 0;
    if (frac < AI_SUB_START || frac > AI_SUB_END) return;
    if (state !== 'play') return;
    // Space the AI's decisions out so it doesn't burn all three at once.
    if (clock < aiSubNextAt) return;
    const target = aiPickTired();
    aiSubNextAt = clock + 10 + Math.random() * 12;
    if (target) aiStagedOff = target;   // the swap waits for a stoppage
  }

  // Called when play stops: if the AI has a staged change, play it out now.
  function aiFlushSub() {
    if (!aiStagedOff) return false;
    const data = aiDoSub();
    if (!data) return false;
    return playSubstitution(data);
  }


  // On-pitch referee. It is a standalone sprite (deliberately NOT in `players`,
  // so it never takes part in the sim, roles, tackling or control switching). It
  // trails the ball around the pitch and holds up the yellow/red card whenever a
  // booking is being shown.
  const REF_KIT = { shirt: '#16161c', shorts: '#16161c', socks: '#16161c' };
  const referee = { isRef: true, isGK: false, team: -1, kit: REF_KIT, num: 0, x: CX, y: CY + 50, vx: 0, vy: 0, fx: 0, fy: 1, dir: 'down', anim: 0, skin: '#e2b98a', hair: '#1b1410', kickT: 0, slideT: 0, diveT: 0, diveVx: 0, stun: 0, charging: false };
  function resetReferee() { referee.x = CX; referee.y = CY + 50; referee.vx = referee.vy = 0; referee.dir = 'down'; referee.anim = 0; }
  function updateReferee(dt) {
    if (state === 'title' || drill) return;
    // Stand still and face the pitch while brandishing a card.
    if (cardPop) { referee.vx = referee.vy = 0; referee.dir = 'down'; return; }
    // Hang back behind the ball, drifting to the opposite side of the action.
    let tx = ball.x - 46, ty = ball.y + (ball.y < CY ? 46 : -46);
    tx = clamp(tx, PX0 + 12, PX1 - 12); ty = clamp(ty, PY0 + 12, PY1 - 12);
    const dx = tx - referee.x, dy = ty - referee.y, d = hyp(dx, dy) || 1;
    const vx = dx / d * 42, vy = dy / d * 42, k = Math.min(1, 6 * dt);
    referee.vx += (vx - referee.vx) * k; referee.vy += (vy - referee.vy) * k;
    referee.x = clamp(referee.x + referee.vx * dt, PX0 + 6, PX1 - 6);
    referee.y = clamp(referee.y + referee.vy * dt, PY0 + 6, PY1 - 6);
    referee.anim += hyp(referee.vx, referee.vy) * dt * .2;
    const sp = hyp(referee.vx, referee.vy);
    if (sp > 3) referee.dir = referee.vx >= 0 ? 'right' : 'left';
    else if (Math.abs(ball.y - referee.y) > 24) referee.dir = ball.y > referee.y ? 'down' : 'up';
  }

  function createPlayers() {
    players = [];
    const nums = [1, 3, 5, 4, 2, 11, 8, 6, 7, 9, 10];
    const forms = [homeForm, awayForm];
    for (let t = 0; t < 2; t++) for (let i = 0; i < 11; i++) {
      const rr = seeded(t * 101 + i * 13 + 7);
      players.push({
        team: t, i: i, form: forms[t][i] || FORM[i], isGK: i === 0, num: nums[i], kit: null,
        x: 0, y: 0, vx: 0, vy: 0, fx: t === 0 ? 1 : -1, fy: 0, dir: t === 0 ? 'right' : 'left',
        skin: SKINS[(rr() * SKINS.length) | 0], hair: HAIRS[(rr() * HAIRS.length) | 0],
        stamina: 1, tired: false, anim: 0, kickT: 0, noCatch: 0, stun: 0, tackleCD: 0, slideT: 0, slideHit: false, skillT: 0, skillCD: 0,
        charging: false, charge: 0, sprinting: false, diveT: 0, diveCD: 0, diveVx: 0, diveVy: 0, holdT: 0, gkErr: 0, gkErrT: 0,
        decideT: rnd(0, .4), shotCD: 0, lunge: 0, lx: 0, ly: 0, touchPh: 0, carryT: 0, bench: false,
        cards: 0, sentOff: false, foulCD: 0
      });
    }
    for (let t = 0; t < 2; t++) {
      const gk = playerOf(t, 0), col = gkKits[t];
      gk.kit = { shirt: col, shorts: '#1c1c22', socks: col };
    }
    aiSubReset();
  }
  function applySquadNames(squads) {
    if (!squads) return;
    const sides = [squads.home, squads.away];
    for (let t = 0; t < 2; t++) {
      const rows = sides[t];
      if (!rows || !rows.length) continue;
      for (let i = 0; i < 11; i++) {
        const p = playerOf(t, i);
        const row = rows[i];
        if (p && row && row.name) p.name = row.name;
      }
    }
  }
  function pickGK() {
    const used = [teams[0].shirt, teams[1].shirt], res = [];
    for (let t = 0; t < 2; t++) {
      let best = GK_COLS[0], bs = -1;
      for (const c of GK_COLS) { if (res.indexOf(c) >= 0) continue; const s = Math.min(colDist(c, used[0]), colDist(c, used[1])); if (s > bs) { bs = s; best = c; } }
      res.push(best);
    }
    return res;
  }
  function startMatch() {
    teams = [KITS[menu.kit], KITS[menu.opp]];
    diff = DIFFS[menu.diff]; matchLen = LENS[menu.len] * 60;
    gkKits = pickGK();
    score = [0, 0]; clock = 0; stats = newStats(); parts = []; banner = null; flash = null; paused = false; hintT = 8; switchCD = 0; cardPop = null; cardCount = [[0, 0], [0, 0]]; stoppage = 0; addedMin = -1; cfgEt = false; etActive = false; etStart = 0; etLen = 0;
    half = 1; halfStart = 0; halfStartMin = 0; breakNext = 0; breakT = 0; resetReferee();
    ball = { x: CX, y: CY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, held: false, lastTouch: null, target: null, targetT: 0, roll: 0 };
    solo = false; soloPlayer = null;
    createPlayers(); controlled = null; scorer = null; restart = null;
    setupKickoff(0);
    cam.x = clamp(CX - VW / 2, 0, WW - VW); cam.y = clamp(CY - VH / 2, 0, WH - VH);
  }
  function prepare(cfg) {
    cfg = cfg || {};
    teams = [
      { team: cfg.name0 || 'PIXEL FC', shirt: cfg.color0 || '#2f6fe4', shorts: '#f2f2f2', socks: cfg.color0 || '#2f6fe4' },
      { team: cfg.name1 || 'RETRO UTD', shirt: cfg.color1 || '#d83a3a', shorts: '#f2f2f2', socks: cfg.color1 || '#d83a3a' }
    ];
    diff = DIFFS[clamp(cfg.diff | 0, 0, 2)];
    matchLen = cfg.matchLen || 180;
    gkKits = pickGK();
    score = [0, 0]; clock = 0; stats = newStats(); parts = []; banner = null; flash = null; paused = false; hintT = 0; switchCD = 0; drill = null; cardPop = null; cardCount = [[0, 0], [0, 0]]; stoppage = 0; addedMin = -1;
    cfgEt = !!cfg.et; etActive = false; etStart = 0; etLen = 0;
    half = 1; halfStart = 0; halfStartMin = 0; breakNext = 0; breakT = 0; resetReferee();
    winnerT = 0; winnerData = null;
    subT = 0; subData = null; subReturn = 'play';
    time = 0; titleT = 0; fullT = 0; goalT = 0;
    ball = { x: CX, y: CY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, held: false, lastTouch: null, target: null, targetT: 0, roll: 0 };
    solo = !!cfg.solo;
    const fm = cfg.formation;
    homeForm = (fm && fm.nd && fm.nm && fm.na) ? makeForm(fm.nd, fm.nm, fm.na) : FORM;
    createPlayers(); applySquadNames(cfg.squads); soloPlayer = findSoloPlayer(cfg);
    controlled = solo ? soloPlayer : null; scorer = null; restart = null;
    if (cfg.stadium) buildPitch(cfg.stadium);
    setupKickoff(0);
    cam.x = clamp(CX - VW / 2, 0, WW - VW); cam.y = clamp(CY - VH / 2, 0, WH - VH);
  }

  /* ---------- restarts & match flow ---------- */
  function resetFormation(kickTeam) {
    for (const p of players) {
      if (p.sentOff) { p.x = PX0 - 40; p.y = PY0 - 40 + (p.team === 1 ? 12 : 0); p.vx = p.vy = 0; p.stun = 999; p.bench = true; continue; }
      const f = p.form, t = p.team;
      let fx = f.fx * .78, fy = f.fy;
      if (f.r === 'ST') {
        fx = t === kickTeam ? .485 : .36;
        if (t === kickTeam) {
          let sts = 0, stIdx = 0;
          for (const q of players) {
            if (q.team !== t || !q.form || q.form.r !== 'ST') continue;
            if (q === p) stIdx = sts;
            sts++;
          }
          fy = sts <= 1 ? .5 : (sts === 2 ? (stIdx === 1 ? .5 : .58) : .3 + stIdx * .2);
        }
      }
      p.x = t === 0 ? PX0 + fx * PW : PX1 - fx * PW; p.y = PY0 + fy * PH;
      p.vx = p.vy = 0; p.fx = t === 0 ? 1 : -1; p.fy = 0; p.dir = t === 0 ? 'right' : 'left';
      p.stun = 0; p.slideT = 0; p.diveT = 0; p.noCatch = 0; p.charging = false; p.holdT = 0; p.lunge = 0; p.skillT = 0; p.tackleCD = 0; p.sprinting = false; p.carryT = 0;
    }
  }
  function setupKickoff(team) {
    resetFormation(team);
    ball.owner = null; ball.held = false; ball.vx = ball.vy = ball.vz = 0; ball.z = 0; ball.x = CX; ball.y = CY; ball.target = null;
    const taker = playerOf(team, 10), s = team === 0 ? 1 : -1;
    taker.x = CX - s * 5; taker.y = CY; taker.fx = s; taker.fy = 0;
    setRestart('kickoff', team, { x: CX, y: CY }, taker);
  }
  function setRestart(type, team, spot, forceTaker) {
    penPending = null;
    state = 'restart'; ball.owner = null; ball.vx = ball.vy = ball.vz = 0; ball.z = 0; ball.target = null;
    let taker = forceTaker || null; const s = team === 0 ? 1 : -1;
    if (type === 'goalkick') {
      taker = playerOf(team, 0); taker.x = spot.x - s * 2; taker.y = spot.y; taker.fx = s; taker.fy = 0;
    } else if (!taker) {
      let bd = 1e9;
      for (const p of players) { if (p.team !== team || p.isGK || p.bench || p.sentOff) continue; const d = hyp(p.x - spot.x, p.y - spot.y); if (d < bd) { bd = d; taker = p; } }
      if (!taker) taker = playerOf(team, 0);   // every outfielder gone: keeper restarts
      if (type === 'throwin') { taker.x = spot.x; taker.y = spot.y; taker.fx = 0; taker.fy = spot.y < CY ? 1 : -1; }
      else if (type === 'freekick') { taker.x = spot.x - s * 9; taker.y = spot.y; taker.fx = s; taker.fy = 0; }
      else { const sx = spot.x < CX ? 1 : -1, sy = spot.y < CY ? 1 : -1, l = hyp(.8, .6); taker.x = spot.x; taker.y = spot.y; taker.fx = sx * .8 / l; taker.fy = sy * .6 / l; }
    }
    taker.vx = taker.vy = 0; taker.stun = 0; taker.slideT = 0; taker.diveT = 0;
    restart = { type: type, team: team, taker: taker, t: 0, aiDelay: type === 'kickoff' ? 1.6 : 1.2 + rnd(0, .5), spot: spot };
    ball.owner = taker; ball.held = true; ball.lastTouch = taker; holdBall(taker);
    const names = { throwin: 'THROW IN', goalkick: 'GOAL KICK', corner: 'CORNER', kickoff: 'KICK OFF', freekick: 'FREE KICK' };
    showBanner(names[type], 1.8, false); sfx.whistle();
    fireStop();
  }
  function showBanner(t, d, big) { banner = { text: t, t: d, big: !!big }; }
  function showFlash(t) { flash = { text: t, t: 1.1 }; }
  function ballOut(kind) {
    if (drill) { drill.reps++; ball.owner = null; ball.held = false; showFlash('OUT'); drill.cd = .8; return; }
    const lt = ball.lastTouch ? ball.lastTouch.team : (Math.random() < .5 ? 0 : 1);
    ball.owner = null; ball.held = false;
    if (kind === 'side') {
      setRestart('throwin', 1 - lt, { x: clamp(ball.x, PX0 + 14, PX1 - 14), y: ball.y < CY ? PY0 : PY1 });
    } else {
      const left = kind === 'endL', def = left ? 0 : 1, s = left ? 1 : -1;
      if (lt === def) setRestart('corner', 1 - def, { x: left ? PX0 : PX1, y: ball.y < CY ? PY0 : PY1 });
      else setRestart('goalkick', def, { x: (left ? PX0 : PX1) + s * 18, y: CY + (ball.y < CY ? -1 : 1) * 20 });
    }
  }
  function onGoal(t) {
    if (state !== 'play') return;
    if (drill) {
      drill.reps++; if (t === 0) drill.scored++;
      score = [0, 0]; ball.owner = null; ball.held = false;
      sfx.goal(); confetti(); showBanner('GOAL!', 1.1, true);
      drill.cd = 1.35;
      return;
    }
    const beforeLevel = score[0] === score[1];
    score[t]++; state = 'goal'; goalT = 0; goalTeam = t; stoppage += .5;
    if (penPending !== null) { if (penPending === t) stats.penScored[t]++; penPending = null; }
    let sc = ball.lastTouch;
    if (!sc || sc.team !== t) {
      let bd = 1e9; sc = null;
      for (const p of players) { if (p.team !== t || p.isGK) continue; const d = hyp(p.x - ball.x, p.y - ball.y); if (d < bd) { bd = d; sc = p; } }
    }
    scorer = sc; ball.owner = null; ball.held = false; ball.vx *= .35; ball.vy *= .35;
    for (const p of players) { p.charging = false; p.slideT = 0; }
    sfx.goal(); confetti(); showBanner('GOAL!', 2.8, true);
    if (HOOK.goal) { try { HOOK.goal(t); } catch (e) { } }
    // A go-ahead goal from level in the closing stages is the winner: play the
    // Last Minute Winner cutscene instead of the usual goal celebration. "Late"
    // means 87'+ or past normal time (added time) in the current period.
    const per = matchPerMin(), disp = halfStartMin + (clock - halfStart) / per, base = periodMinutes();
    if (half >= 2 && beforeLevel && (disp >= 87 || clock >= periodBase()) && score[t] > score[1 - t]) {
      const minute = disp <= base ? (Math.floor(disp) + "'") : (base + "+" + Math.max(1, Math.round(disp - base)) + "'");
      startWinner(t, minute);
    }
  }
  // Real match seconds per displayed pitch minute: the whole match is mapped
  // onto the 90' clock, so added time is measured in these same displayed
  // minutes and converted back to sim seconds when a half runs over.
  const matchPerMin = () => matchLen / 90;
  // Displayed minute the current half's normal time ends at (45/90/105/120).
  function periodMinutes() { return halfStartMin + (half <= 2 ? 45 : 15); }
  // Sim clock at which the current half's normal time ends, before added time.
  function periodBase() { return halfStart + (half <= 2 ? matchLen / 2 : etLen / 2); }
  // The scoreboard minute, including stoppage time (45+1', 90+3', 105+1').
  function clockText() {
    if (drill) return Math.floor(clock / 60) + ':' + String(Math.floor(clock % 60)).padStart(2, '0');
    const per = matchPerMin();
    const base = periodBase();
    const startMin = halfStartMin;
    const baseMin = periodMinutes();
    if (clock < base) {
      const m = startMin + Math.floor((clock - halfStart) / per);
      return Math.min(baseMin, Math.max(startMin, m)) + "'";
    }
    const k = Math.min(Math.max(1, addedMin), Math.floor((clock - base) / per) + 1);
    return baseMin + '+' + k + "'";
  }
  // Roll a level knockout tie into 2x15 of extra time (halves 3 and 4).
  function enterExtraTime() {
    if (etActive) return;
    etActive = true; etStart = clock; etLen = matchLen / 3;
    sfx.whistle();
  }
  // A team mid-attack as the half expires is allowed to finish the move before
  // the whistle. Capped (in checkTime) so a scramble can't hold a half forever.
  function attackLive() {
    if (state !== 'play') return false;
    const o = ball.owner;
    if (o && !o.isGK) return fracAttack(o.x, o.team) > .60;
    if (!o) {
      const sp = hyp(ball.vx, ball.vy);
      if (sp > 40) { const t = ball.vx > 0 ? 0 : 1; return fracAttack(ball.x, t) > .68; }
    }
    return false;
  }
  // Decide what happens at the current half's boundary. Returns 'end' when the
  // match is over, 'et' the instant extra time begins, 'half' to go to the break,
  // otherwise null. Added time is settled once per half (guarded by addedMin < 0).
  function checkTime() {
    const base = periodBase();
    if (clock < base) return null;
    if (addedMin < 0) {
      addedMin = Math.max(1, Math.min(9, Math.round(1 + stoppage)));
      showBanner('ADDED TIME', 2.2, false);
    }
    const limit = base + Math.max(0, addedMin) * matchPerMin();
    if (clock < limit) return null;
    if (attackLive() && clock < limit + matchPerMin() * 2) return null;
    if (half === 1) return 'half';
    if (half === 2) return (cfgEt && !etActive && score[0] === score[1]) ? 'et' : 'end';
    if (half === 3) return 'half';
    return 'end';
  }
  function enterBreak(next) {
    state = 'break'; breakNext = next;
    // Half time leads with the Half Time cutscene, then the Crowd Cam's SECOND
    // HALF countdown; the extra-time break just runs the Crowd Cam as before.
    breakT = (next === 2 && typeof window.halfTimeDuration === 'number') ? window.halfTimeDuration + BREAK_T : BREAK_T;
    crowdT = 0;
    if (typeof window.halfTimeReset === 'function') window.halfTimeReset();
    ball.owner = null; ball.held = false; ball.vx = ball.vy = ball.vz = 0; ball.z = 0;
    for (const p of players) { p.charging = false; p.slideT = 0; p.vx = p.vy = 0; }
    cam.x = clamp(CX - VW / 2, 0, WW - VW); cam.y = clamp(CY - VH / 2, 0, WH - VH);
    sfx.whistle();
  }
  function breakLabel(next) { return next === 2 ? 'HALF TIME' : 'EXTRA TIME'; }
  function startHalf(h) {
    half = h; halfStart = clock; halfStartMin = h === 1 ? 0 : h === 2 ? 45 : h === 3 ? 90 : 105;
    stoppage = 0; addedMin = -1;
    setupKickoff(h === 1 ? 0 : 1);
  }
  // A go-ahead goal from level in the closing stages stops the match and plays
  // the Last Minute Winner cutscene. `state` is set to 'winner' so update() and
  // draw() hand over to the scene; endGoal() runs once it has played out.
  function startWinner(team, minute) {
    winnerT = 0;
    winnerData = {
      team: team,
      home: teams[team].team, away: teams[1 - team].team,
      kitHome: teams[team].shirt, kitAway: teams[1 - team].shirt,
      scoreA: score[team], scoreB: score[1 - team],
      minute: minute, scorerNum: scorer ? scorer.num : 9
    };
    state = 'winner';
    ball.owner = null; ball.held = false; ball.vx = ball.vy = ball.vz = 0;
    for (const p of players) { p.charging = false; p.slideT = 0; p.vx = p.vy = 0; }
  }
  // A substitution stops the match for the Substitution cutscene. `data` carries
  // the two players and the scoreboard; the engine counts `subT` up while
  // `state === 'sub'` and then drops straight back into play.
  function playSubstitution(data) {
    if (state === 'title' || state === 'fulltime') return false;
    subReturn = (state === 'restart' || state === 'goal') ? state : 'play';
    subData = data || {};
    subT = 0;
    state = 'sub';
    ball.owner = null; ball.held = false; ball.vx = ball.vy = ball.vz = 0;
    for (const p of players) { p.charging = false; p.slideT = 0; p.vx = p.vy = 0; }
    if (typeof window.substitutionReset === 'function') window.substitutionReset();
    return true;
  }
  const SUB_T = () => (typeof window.substitutionDuration === 'number' ? window.substitutionDuration : 23.5);
  function endGoal() {
    if (drill) { stageDrill(); return; }
    const c = checkTime();
    if (c === 'end') { endMatch(); return; }
    if (c === 'half') { enterBreak(half + 1); return; }
    if (c === 'et') { enterExtraTime(); enterBreak(3); return; }
    setupKickoff(1 - goalTeam);
  }
  function endMatch() {
    if (drill) return;
    state = 'fulltime'; fullT = 0; ball.owner = null; ball.held = false; sfx.end(); confetti();
    for (const p of players) { p.vx = p.vy = 0; }
    // The end hook runs the whole end-of-match hand-off (stats, prizes, the end
    // screen, the season rollover). It must never be allowed to die silently -
    // a swallowed throw here left the pitch frozen with the players stood still
    // and no way back to the lobby, so surface it and fall back to a plain end
    // screen if the handler could not complete.
    if (HOOK.end) {
      try {
        HOOK.end();
      } catch (e) {
        if (window.console && console.error) console.error("End-of-match handler failed:", e);
        try {
          const endEl = document.getElementById("endScreen");
          if ((!endEl || endEl.style.display !== "flex") && typeof showFullTimeFallback === "function") showFullTimeFallback(null);
        } catch (e2) {}
      }
    }
  }

  /* ---------- practice drills ----------
   * Free-kick / corner / penalty training, run inside this engine so practice
   * matches the rest of the game. Everyone except the taker and the opposing
   * keeper is benched (parked off the pitch, skipped by the sim and draw) so
   * each rep is a clean shot on goal. A goal or the ball going dead counts a
   * rep, then the spot re-stages. */
  function drillLabel(k) { return k === 'open' ? 'OPEN PLAY' : k === 'freekick' ? 'FREE KICKS' : k === 'corner' ? 'CORNERS' : 'PENALTIES'; }
  function drillBanner(k) { return k === 'open' ? 'OPEN PLAY' : k === 'freekick' ? 'FREE KICK' : k === 'corner' ? 'CORNER' : 'PENALTY'; }
  function benchOthers(keep) {
    let bx = PX0 - 60;
    for (const p of players) {
      const k = (p === keep) || (p.team === 1 && p.isGK);
      p.bench = !k;
      if (!k) { p.x = bx; p.y = PY0 - 90; p.vx = p.vy = 0; bx += 26; }
    }
  }
  function stageDrill() {
    if (!drill) return;
    const k = drill.kind;
    state = 'play'; restart = null; scorer = null; goalT = 0;
    ball.owner = null; ball.held = false; ball.vx = ball.vy = ball.vz = 0; ball.z = 0; ball.roll = 0; ball.target = null;
    const taker = playerOf(0, 9), gk = playerOf(1, 0);
    benchOthers(taker);
    taker.vx = taker.vy = 0; taker.charging = false; taker.charge = 0; taker.stun = 0; taker.slideT = 0; taker.skillT = 0; taker.lunge = 0; taker.tackleCD = 0;
    gk.vx = gk.vy = 0; gk.diveT = 0; gk.holdT = 0; gk.noCatch = 0; gk.stun = 0;
    let spot;
    if (k === 'freekick') {
      const dy = (Math.random() < .5 ? -1 : 1) * 58;
      spot = { x: PX1 - 205, y: CY + dy };
      taker.x = spot.x - 14; taker.y = spot.y; taker.fx = 1; taker.fy = 0; taker.dir = 'right';
    } else if (k === 'corner') {
      const top = Math.random() < .5;
      spot = { x: PX1, y: top ? PY0 : PY1 };
      taker.x = PX1 - 12; taker.y = spot.y + (top ? 16 : -16); taker.fx = 1; taker.fy = top ? 1 : -1; taker.dir = 'right';
    } else if (k === 'open') {
      // Open Play: the same solo set-up as the set-piece drills, but staged on
      // the halfway line so you can run at the goal with the whole pitch to use.
      spot = { x: CX, y: CY };
      taker.x = CX - 14; taker.y = CY; taker.fx = 1; taker.fy = 0; taker.dir = 'right';
    } else {
      spot = { x: PX1 - 74, y: CY };
      taker.x = spot.x - 15; taker.y = CY; taker.fx = 1; taker.fy = 0; taker.dir = 'right';
    }
    gk.x = PX1 - 3; gk.y = CY; gk.fx = -1; gk.fy = 0; gk.dir = 'left';
    ball.x = spot.x; ball.y = spot.y; ball.z = 0;
    ball.lastTouch = taker; ball.owner = taker; ball.held = false;
    controlled = taker; switchCD = 0; hintT = 6;
    cam.x = clamp(CX - VW / 2, 0, WW - VW); cam.y = clamp(CY - VH / 2, 0, WH - VH);
    // Open Play re-stages silently; the HUD label already names the mode.
    if (k !== 'open') showBanner(drillBanner(k), 1.2, false);
  }
  function startDrill(kind) {
    if (!kind) { clearDrill(); return; }
    drill = { kind: kind, reps: 0, scored: 0, cd: 0 };
    state = 'play'; restart = null; scorer = null; goalT = 0; fullT = 0; time = 0;
    score = [0, 0]; clock = 0; matchLen = 1e9; stats = newStats(); stoppage = 0; addedMin = -1; cfgEt = false; etActive = false; etStart = 0; etLen = 0;
    half = 1; halfStart = 0; halfStartMin = 0; breakNext = 0; breakT = 0;
    parts = []; banner = null; flash = null; paused = false; controlled = null;
    stageDrill();
  }
  function clearDrill() { drill = null; for (const p of players) p.bench = false; }

  /* ---------- ball logic ---------- */
  function ballPred() {
    if (ball.owner) return { x: ball.x, y: ball.y };
    let tl = .28;
    if (ball.z > 1) { tl = (ball.vz + Math.sqrt(ball.vz * ball.vz + 2 * G * ball.z)) / G; tl = clamp(tl, .1, 1.4); }
    const f = ball.z > 1 ? 1 : (1 - Math.exp(-FRIC * tl)) / (FRIC * tl);
    return { x: clamp(ball.x + ball.vx * tl * f, PX0 - 8, PX1 + 8), y: clamp(ball.y + ball.vy * tl * f, PY0 - 8, PY1 + 8) };
  }
  function release(p, nc) { ball.owner = null; ball.held = false; ball.lastTouch = p; p.noCatch = nc; p.charging = false; p.kickT = .2; }
  function takeBall(p) {
    ball.owner = p; ball.held = false; ball.lastTouch = p; ball.target = null;
    ball.vx = p.vx; ball.vy = p.vy; ball.z = 0; ball.vz = 0;
    p.holdT = 0; p.carryT = 0; p.decideT = rnd(.2, .45);
    if (p.team === 0 && !p.isGK && (!solo || p === soloPlayer)) controlled = p;
  }
  function dispossess(o) { ball.owner = null; ball.held = false; o.noCatch = .5; o.stun = .4; o.charging = false; }
  function nearestOppDist(p) { let m = 1e9; for (const o of players) if (o.team !== p.team) { const d = hyp(o.x - p.x, o.y - p.y); if (d < m) m = d; } return m; }
  function bestPass(p, aim, allowGK) {
    const t = p.team, dirX = t === 0 ? 1 : -1; let best = null, bs = -1e9;
    for (const q of players) {
      if (q.team !== t || q === p) continue;
      if (q.isGK && !allowGK) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = hyp(dx, dy);
      if (d < 28 || d > 360) continue;
      let s = 0;
      if (aim) { const cs = (dx * aim.x + dy * aim.y) / d; if (cs < .5) continue; s += cs * 160; }
      else s += dx * dirX * .35;
      s -= Math.abs(d - 140) * .3;
      let blocked = 0, np = 1e9;
      for (const o of players) {
        if (o.team === t) continue;
        const od = segDist(o.x, o.y, p.x, p.y, q.x, q.y); if (od < 14) blocked += 14 - od;
        const dd = hyp(o.x - q.x, o.y - q.y); if (dd < np) np = dd;
      }
      s -= blocked * 5; if (np < 26) s -= (26 - np) * 1.5;
      if (!aim) s += (1 - Math.abs(q.y - CY) / (PH / 2)) * 6;
      if (s > bs) { bs = s; best = q; }
    }
    return best ? { target: best, score: bs, dist: hyp(best.x - p.x, best.y - p.y) } : null;
  }
  function doPass(p, target, kind, aim) {
    const dirX = p.team === 0 ? 1 : -1; let tx, ty;
    if (target) {
      const lead = kind === 'ground' ? .28 : .42;
      tx = target.x + target.vx * lead; ty = target.y + target.vy * lead;
      if (kind === 'lob') tx += dirX * 10;
    } else {
      const a = aim || { x: dirX, y: 0 };
      tx = ball.x + a.x * (kind === 'ground' ? 150 : 210); ty = ball.y + a.y * (kind === 'ground' ? 150 : 210);
    }
    tx = clamp(tx, PX0 + 2, PX1 - 2); ty = clamp(ty, PY0 + 2, PY1 - 2);
    let dx = tx - ball.x, dy = ty - ball.y; const dist = hyp(dx, dy) || 1; dx /= dist; dy /= dist;
    if (kind === 'ground') {
      const sp = clamp(dist * FRIC + 78, 130, 410);
      ball.vx = dx * sp; ball.vy = dy * sp; ball.vz = 0; ball.z = Math.max(0, ball.z);
      sfx.pass();
    } else {
      const T = clamp(.5 + dist / 430, .6, 1.35), sp = dist / T * 1.04;
      ball.vx = dx * sp; ball.vy = dy * sp; ball.vz = G * T / 2; ball.z = Math.max(.5, ball.z);
      sfx.kick();
    }
    release(p, .3); p.fx = dx; p.fy = dy;
    ball.target = target || null; ball.targetT = 2;
    if (target && p.team === 0 && !target.isGK && (!solo || target === soloPlayer)) controlled = target;
  }
  function shoot(p, charge, ax, ay) {
    let dx = ax - ball.x, dy = ay - ball.y; const d = hyp(dx, dy) || 1; dx /= d; dy /= d;
    const power = .5 + .5 * charge;
    const err = rnd(-1, 1) * (.02 + .12 * Math.max(0, charge - .8) + (nearestOppDist(p) < 22 ? .04 : 0));
    const c = Math.cos(err), s = Math.sin(err), nx = dx * c - dy * s, ny = dx * s + dy * c; dx = nx; dy = ny;
    const spd = 240 + 200 * power;
    ball.vx = dx * spd; ball.vy = dy * spd; ball.z = .5;
    ball.vz = 22 + power * 38 + rnd(0, 18) + (charge > .86 ? rnd(0, 125) : 0);
    release(p, .35); p.fx = dx; p.fy = dy;
    stats.shots[p.team]++;
    if (inOwnBox(ball.x, ball.y, 1 - p.team)) stats.chances[p.team]++;
    const gx = attackGoalX(p.team);
    if (dx * (gx - CX) > 0) { const t = (gx - ball.x) / dx, yAt = ball.y + dy * t; if (Math.abs(yAt - CY) < GOAL_HALF && ball.vz < 165) stats.on[p.team]++; }
    sfx.shot();
  }
  function humanShotAim(p, mv) {
    const gx = attackGoalX(p.team), dirX = p.team === 0 ? 1 : -1;
    let ax, ay, manual = mv.mag > .25;
    if (manual) { ax = mv.x / mv.mag; ay = mv.y / mv.mag; } else { ax = p.fx; ay = p.fy; }
    if (ax * dirX > .25) {
      if (!manual && ax * dirX > .5) {
        const gk = playerOf(1 - p.team, 0);
        return { x: gx, y: CY + (gk.y > CY ? -1 : 1) * (GOAL_HALF - 10) };
      }
      const t = (gx - ball.x) / ax, yAt = ball.y + ay * t;
      if (Math.abs(yAt - CY) < GOAL_HALF + 40) return { x: gx, y: clamp(yAt, CY - GOAL_HALF + 5, CY + GOAL_HALF - 5) };
    }
    return { x: ball.x + ax * 200, y: ball.y + ay * 200 };
  }
  function tryTackle(p) {
    const o = ball.owner;
    if (p.tackleCD > 0 || !o || o.team === p.team || ball.held || state !== 'play') return;
    p.tackleCD = p.team === 0 && p === controlled ? .7 : .9;
    const d = hyp(ball.x - p.x, ball.y - p.y);
    if (d > 0) { p.lunge = .16; p.lx = (ball.x - p.x) / d; p.ly = (ball.y - p.y) / d; }
    p.kickT = .2;
    if (d < 16) {
      let ch = D(p).tk + (p.team === 0 ? .12 : 0);
      if (o.sprinting) ch += .08; if (o.skillT > 0) ch -= .4; if (o.stun > 0) ch += .3;
      if (Math.random() < ch) {
        stats.tackles[p.team]++; dispossess(o);
        if (Math.random() < .6) takeBall(p);
        else { ball.vx = p.lx * 140 + rnd(-40, 40); ball.vy = p.ly * 140 + rnd(-40, 40); ball.lastTouch = p; }
        sfx.tackle();
      } else {
        p.stun = .15;
        if (Math.random() < FOUL_STAND) foul(p, o, 'normal');
      }
    }
  }
  function startSlide(p, mv) {
    if (p.tackleCD > 0 || p.slideT > 0 || state !== 'play') return;
    let dx = mv.mag > .2 ? mv.x / mv.mag : p.fx, dy = mv.mag > .2 ? mv.y / mv.mag : p.fy;
    const bd = hyp(ball.x - p.x, ball.y - p.y);
    if (bd < 60 && bd > 0) { dx = dx * .5 + (ball.x - p.x) / bd * .5; dy = dy * .5 + (ball.y - p.y) / bd * .5; const l = hyp(dx, dy) || 1; dx /= l; dy /= l; }
    p.slideT = .42; p.slideHit = false; p.vx = dx * 175; p.vy = dy * 175; p.fx = dx; p.fy = dy; p.tackleCD = 1.3; p.charging = false;
    for (let i = 0; i < 5; i++) spawn(p.x, p.y, rnd(-20, 20), rnd(-14, 0), .4, 'rgba(225,235,200,.7)', 2, 0);
  }
  function slideStep(p, dt) {
    p.slideT -= dt; const k = Math.pow(.35, dt); p.vx *= k; p.vy *= k;
    if (Math.random() < .5) spawn(p.x, p.y, rnd(-10, 10), rnd(-10, 0), .3, 'rgba(225,235,200,.6)', 2, 0);
    if (!p.slideHit && state === 'play') {
      const bd = hyp(ball.x - p.x, ball.y - p.y);
      if (bd < 13 && ball.z < 12) {
        const o = ball.owner;
        if (o && o.team !== p.team && !ball.held) {
          if (Math.random() < .72) { stats.tackles[p.team]++; dispossess(o); ball.vx = p.vx * .9; ball.vy = p.vy * .9; ball.lastTouch = p; sfx.tackle(); }
          else { o.stun = .2; if (Math.random() < FOUL_SLIDE_MISS) foul(p, o, 'reckless'); }
          p.slideHit = true;
        } else if (!o) { ball.vx = p.vx * 1.3; ball.vy = p.vy * 1.3; ball.lastTouch = p; p.slideHit = true; sfx.kick(); }
      }
      for (const q of players) {
        if (q.team === p.team || q === p || q.stun > 0 || q.sentOff) continue;
        if (hyp(q.x - p.x, q.y - p.y) < 10) {
          if (!p.slideHit && Math.random() < FOUL_SLIDE_BODY) { foul(p, q, 'reckless'); p.slideHit = true; break; }
          q.stun = .5;
        }
      }
    }
    if (p.slideT <= 0) p.stun = .35;
  }

  /* ---------- fouls & cards ----------
   * A mistimed tackle, or a slide that catches the man instead of the ball, is
   * a foul: the victim's team is awarded a free kick (a penalty if it happened
   * inside the offender's box) and the offender can be booked or sent off.
   * Cards last only for the match; a second yellow is a red. */
  const FOUL_STAND = .18;      // chance a failed standing tackle is a foul
  const FOUL_SLIDE_MISS = .5;  // chance a slide that misses the ball catches the man
  const FOUL_SLIDE_BODY = .62; // chance a slide into a non-carrier is a foul
  const CARD_YELLOW = .34;     // base chance an ordinary foul is a booking
  function inOwnBox(x, y, t) { return Math.abs(x - ownGoalX(t)) < BOX_D && Math.abs(y - CY) < BOX_HALF; }
  function penaltySpot(team) { return { x: attackGoalX(team) + (team === 0 ? -74 : 74), y: CY }; }
  function lastDefender(offender, victim) {
    // Through on goal: the victim has the ball, is past halfway, and no more
    // than one outfield defender stands between them and the goal.
    if (!victim || ball.owner !== victim || victim.isGK) return false;
    if (fracAttack(victim.x, victim.team) < .5) return false;
    const gx = attackGoalX(victim.team); let between = 0;
    for (const q of players) {
      if (q === offender || q.team === victim.team || q.isGK || q.bench || q.sentOff) continue;
      if ((q.x - victim.x) * (gx - victim.x) > 0) between++;
    }
    return between <= 1;
  }
  function sendOff(p) {
    p.cards = 2; p.sentOff = true; p.bench = true;
    p.x = PX0 - 40; p.y = PY0 - 40 + (p.team === 1 ? 12 : 0); p.vx = p.vy = 0; p.stun = 999; p.slideT = 0;
    if (controlled === p) controlled = solo ? null : nearestOutfield(0, ball.x, ball.y, p);
    if (ball.owner === p) { ball.owner = null; ball.held = false; }
    if (p.team === 0 && typeof __psRedCard === "function") {
      try { __psRedCard(p.name); } catch (e) { }
    }
  }
  function book(offender, type) {
    stoppage += .5;
    cardCount[offender.team][type === 'red' ? 1 : 0]++;
    if (type === 'red') offender.cards = 2; else if (offender.cards < 1) offender.cards = 1;
    cardPop = { type: type, num: offender.num, team: offender.team, t: 2.4 };
    if (type === 'red') sendOff(offender);
  }
  function foul(offender, victim, severity) {
    if (state !== 'play' || drill || !offender || offender.sentOff || offender.foulCD > 0) return;
    offender.foulCD = .6;
    const vTeam = victim ? victim.team : (1 - offender.team);
    let card = null;
    const dogso = severity === 'dogso' || lastDefender(offender, victim);
    if (dogso) card = Math.random() < .5 ? 'red' : 'yellow';
    else if (severity === 'reckless') card = Math.random() < .55 ? (Math.random() < .22 ? 'red' : 'yellow') : null;
    else card = Math.random() < CARD_YELLOW ? 'yellow' : null;
    if (card === 'yellow' && offender.cards >= 1) card = 'red';   // second bookable offence
    if (card) book(offender, card);
    offender.stun = Math.max(offender.stun, .55);
    const spot = { x: clamp(ball.x, PX0 + 3, PX1 - 3), y: clamp(ball.y, PY0 + 3, PY1 - 3) };
    if (inOwnBox(spot.x, spot.y, offender.team)) setupPenalty(1 - offender.team, penaltySpot(1 - offender.team));
    else setRestart('freekick', vTeam, spot);
  }
  function setupPenalty(team, spot) {
    stoppage += .5;
    stats.pens[team]++; penPending = team;
    state = 'restart'; scorer = null; goalT = 0;
    ball.owner = null; ball.vx = ball.vy = ball.vz = 0; ball.z = 0; ball.target = null;
    const dir = team === 0 ? 1 : -1, gx = attackGoalX(team);
    let taker = playerOf(team, 9);
    if (!taker || taker.sentOff || taker.bench) taker = nearestOutfield(team, spot.x, spot.y, null) || playerOf(team, 0);
    // Everyone bar the taker lines up behind the spot; the keeper takes the line.
    const lineX = spot.x - dir * 26; let row = 0;
    for (const p of players) {
      if (p === taker || p.isGK || p.sentOff) continue;
      p.x = lineX; p.y = PY0 + 26 + (row * 30) % (PH - 52); row++;
      p.vx = p.vy = 0; p.stun = Math.max(p.stun, 1.7); p.slideT = 0;
    }
    const gk = playerOf(1 - team, 0);
    gk.x = gx - dir * 3; gk.y = CY; gk.fx = -dir; gk.fy = 0; gk.dir = dir > 0 ? 'left' : 'right';
    gk.vx = gk.vy = 0; gk.diveT = 0; gk.noCatch = 0; gk.stun = 0;
    taker.x = spot.x - dir * 11; taker.y = spot.y; taker.fx = dir; taker.fy = 0; taker.dir = dir > 0 ? 'right' : 'left';
    taker.vx = taker.vy = 0; taker.stun = 0; taker.charging = false;
    ball.x = spot.x; ball.y = spot.y; ball.z = 0; ball.lastTouch = taker; ball.owner = taker; ball.held = false;
    if (team === 0) controlled = solo ? (soloPlayer && !soloPlayer.sentOff ? soloPlayer : null) : taker;
    cam.x = clamp(spot.x - VW / 2, 0, WW - VW); cam.y = clamp(CY - VH / 2, 0, WH - VH);
    restart = { type: 'penalty', team: team, taker: taker, t: 0, aiDelay: 1.7, spot: spot };
    showBanner('PENALTY', 1.8, false); sfx.whistle();
    fireStop();
  }

  /* ---------- player update ---------- */
  function steer(p, tx, ty, speed, dt, accel) {
    const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy); let sp = speed;
    if (d < 24) sp *= d / 24;
    const vx = d > .01 ? dx / d * sp : 0, vy = d > .01 ? dy / d * sp : 0, k = Math.min(1, (accel || 7) * dt);
    p.vx += (vx - p.vx) * k; p.vy += (vy - p.vy) * k;
  }
  function faceUpdate(p, dt) {
    const sp = hyp(p.vx, p.vy); let tx, ty;
    if (sp > 12) { tx = p.vx / sp; ty = p.vy / sp; }
    else { const dx = ball.x - p.x, dy = ball.y - p.y, d = hyp(dx, dy) || 1; tx = dx / d; ty = dy / d; }
    const k = Math.min(1, 10 * dt);
    p.fx += (tx - p.fx) * k; p.fy += (ty - p.fy) * k;
    const l = hyp(p.fx, p.fy) || 1; p.fx /= l; p.fy /= l;
  }
  function setDir(p) {
    const ax = Math.abs(p.fx), ay = Math.abs(p.fy);
    if (ax > ay * 1.15) p.dir = p.fx > 0 ? 'right' : 'left';
    else if (ay > ax * 1.15) p.dir = p.fy > 0 ? 'down' : 'up';
  }
  function integrate(p, dt) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, PX0 - 12, PX1 + 12); p.y = clamp(p.y, PY0 - 12, PY1 + 12);
    p.anim += hyp(p.vx, p.vy) * dt * .17;
    setDir(p);
  }
  function computeRoles() {
    const bp = ballPred();
    for (let t = 0; t < 2; t++) {
      let a = null, b = null, da = 1e9, db = 1e9;
      for (const p of players) {
        if (p.team !== t || p.isGK || p.bench || p === controlled || p.stun > 0 || p.slideT > 0) continue;
        if (restart && restart.taker === p) continue;
        const d = hyp(p.x - bp.x, p.y - bp.y);
        if (d < da) { b = a; db = da; a = p; da = d; } else if (d < db) { b = p; db = d; }
      }
      chaser[t] = a; cover[t] = b;
    }
  }
  function formTarget(p, poss) {
    const f = p.form, t = p.team, bf = fracAttack(ball.x, t);
    let fx = f.fx + (bf - .5) * .5 + (poss === t ? f.push : -f.drop);
    fx = clamp(fx, f.r === 'GK' ? .03 : .07, .95);
    const by = (ball.y - PY0) / PH;
    const fy = clamp(.5 + (f.fy - .5) * (poss === t ? 1 : .82) + (by - .5) * .28, .05, .95);
    let x = t === 0 ? PX0 + fx * PW : PX1 - fx * PW;
    if (restart && restart.type === 'goalkick' && t !== restart.team) {
      const gx = ownGoalX(restart.team);
      if (Math.abs(x - gx) < BOX_D + 14) x = gx + (gx < CX ? 1 : -1) * (BOX_D + 14);
    }
    return { x: x, y: PY0 + fy * PH };
  }
  function aiOutfield(p, dt) {
    const t = p.team, d = D(p), owner = ball.owner;
    const poss = owner ? owner.team : (ball.lastTouch ? ball.lastTouch.team : -1);
    if (owner === p && !ball.held) { aiCarrier(p, dt, d); return; }
    let tgt = formTarget(p, poss), speed = BASE_SPEED * .9 * d.spd; p.sprinting = false;
    const bp = ballPred(), sprintSp = BASE_SPEED * SPRINT_MULT * .96 * d.spd;
    if (state === 'play' || state === 'restart') {
      if (!owner) {
        if (chaser[t] === p || ball.target === p) { tgt = bp; speed = sprintSp; p.sprinting = true; }
      } else if (owner.team !== t && !ball.held && !owner.isGK) {
        if (chaser[t] === p) {
          const gx = ownGoalX(t); let dx = gx - owner.x, dy = CY - owner.y; const dd = hyp(dx, dy) || 1;
          tgt = { x: owner.x + dx / dd * 9, y: owner.y + dy / dd * 9 };
          const dist = hyp(ball.x - p.x, ball.y - p.y);
          if (dist < 34) tgt = { x: ball.x, y: ball.y };
          speed = sprintSp; p.sprinting = true;
          if (dist < 15 && p.tackleCD <= 0 && state === 'play') { tryTackle(p); p.tackleCD = rnd(.9, 1.7) / d.react; }
        } else if (cover[t] === p && hyp(owner.x - p.x, owner.y - p.y) < 150) {
          const gx = ownGoalX(t); tgt = { x: (owner.x * 2 + gx) / 3, y: (owner.y * 2 + CY) / 3 }; speed = BASE_SPEED * 1.1 * d.spd;
        }
      }
    }
    steer(p, tgt.x, tgt.y, speed, dt, 7);
    faceUpdate(p, dt);
  }
  function aiCarrier(p, dt, d) {
    const t = p.team, gx = attackGoalX(t);
    p.decideT -= dt; p.carryT += dt;
    let nearD = 1e9; const rep = { x: 0, y: 0 };
    for (const o of players) {
      if (o.team === t) continue;
      const dx = p.x - o.x, dy = p.y - o.y, dd = hyp(dx, dy);
      if (dd < nearD) nearD = dd;
      if (dd < 48 && dd > 0) { const w = (48 - dd) / 48; rep.x += dx / dd * w; rep.y += dy / dd * w; }
    }
    let ax = gx - p.x, ay = (CY - p.y) * .5; const al = hyp(ax, ay) || 1; ax /= al; ay /= al;
    ax += rep.x * 1.2; ay += rep.y * 1.2;
    if (p.y < PY0 + 22) ay += .6; if (p.y > PY1 - 22) ay -= .6;
    const l = hyp(ax, ay) || 1; ax /= l; ay /= l;
    const dg = hyp(gx - p.x, CY - p.y);
    if (p.decideT <= 0 && state === 'play') {
      p.decideT = rnd(.3, .6) / d.react;
      if (dg < 175 && Math.abs(p.y - CY) < 125 && p.shotCD <= 0 && (Math.random() < (dg < 110 ? .55 : .3) || nearD < 22)) {
        const gk = playerOf(1 - t, 0), sgn = gk.y > CY ? -1 : 1;
        shoot(p, rnd(.55, .95), gx, CY + sgn * rnd(GOAL_HALF * .45, GOAL_HALF - 6)); p.shotCD = 2.5; return;
      }
      if (nearD < 26 || Math.random() < .16 || p.carryT > 3.5) {
        const q = bestPass(p, null, false);
        if (q) { doPass(p, q.target, q.dist > 210 && Math.random() < .5 ? 'lob' : 'ground', null); return; }
      }
    }
    const sprint = nearD > 60 && fracAttack(p.x, t) > .4;
    p.sprinting = sprint;
    const sp = BASE_SPEED * d.spd * (sprint ? 1.22 : .95);
    steer(p, p.x + ax * 60, p.y + ay * 60, sp, dt, 8);
    if (hyp(p.vx, p.vy) > 10) { const k = Math.min(1, 12 * dt); p.fx += (ax - p.fx) * k; p.fy += (ay - p.fy) * k; const ll = hyp(p.fx, p.fy) || 1; p.fx /= ll; p.fy /= ll; }
  }
  function gkUpdate(p, dt) {
    const t = p.team, gx = ownGoalX(t), s = t === 0 ? 1 : -1, d = D(p);
    const taker = state === 'restart' && restart && restart.taker === p;
    if (ball.owner === p) {
      p.vx *= .8; p.vy *= .8;
      if (!taker) { p.holdT += dt; if (p.holdT > 1.2 && state === 'play') gkDistribute(p); }
      faceUpdate(p, dt); return;
    }
    p.holdT = 0;
    if (p.diveT > 0) { p.diveT -= dt; p.vx = p.diveVx; p.vy = p.diveVy; return; }
    const depth = (ball.x - gx) * s, vin = -ball.vx * s;
    let tx = gx + s * clamp(7 + depth * .045, 7, 24), speed = 88 * d.spd;
    let ty = CY + clamp((ball.y - CY) * .4, -GOAL_HALF + 8, GOAL_HALF - 8);
    if (!ball.owner && vin > 100 && depth > 0 && ball.z < 40) {
      const tt = depth / vin, yp = ball.y + ball.vy * tt;
      if (Math.abs(yp - CY) < GOAL_HALF + 16) {
        if (p.gkErrT <= 0) { p.gkErr = rnd(-1, 1) * (1.15 - d.gk) * 22; p.gkErrT = 1; }
        ty = clamp(yp + p.gkErr, CY - GOAL_HALF + 3, CY + GOAL_HALF - 3); tx = gx + s * 6; speed = 150 * d.spd;
        const dd = hyp(ball.x - p.x, ball.y - p.y);
        if (dd < 34 && p.diveCD <= 0) {
          p.diveT = .38; p.diveCD = 1.4;
          const ex = ball.x + ball.vx * .1 - p.x, ey = ball.y + ball.vy * .1 - p.y, el = hyp(ex, ey) || 1;
          p.diveVx = ex / el * 190; p.diveVy = ey / el * 190; return;
        }
      }
    }
    if (!ball.owner && state === 'play' && depth > 0 && depth < BOX_D - 6 && Math.abs(ball.y - CY) < BOX_HALF - 6 && hyp(ball.vx, ball.vy) < 150) {
      const mine = hyp(p.x - ball.x, p.y - ball.y); let closer = false;
      for (const o of players) if (o.team !== t && hyp(o.x - ball.x, o.y - ball.y) < mine - 4) { closer = true; break; }
      if (!closer) { tx = ball.x; ty = ball.y; speed = 105 * d.spd; }
    }
    steer(p, tx, ty, speed, dt, 9);
    faceUpdate(p, dt);
  }
  function gkDistribute(p) {
    const q = bestPass(p, null, false);
    doPass(p, q ? q.target : null, (!q || q.dist > 190) ? 'lob' : 'ground', { x: p.team === 0 ? 1 : -1, y: 0 });
  }
  function humanPass(p, mv, kind) {
    const aim = mv.mag > .25 ? { x: mv.x / mv.mag, y: mv.y / mv.mag } : { x: p.fx, y: p.fy };
    let q = bestPass(p, aim, false);
    if (!q && mv.mag < .25) q = bestPass(p, null, false);
    doPass(p, q ? q.target : null, kind, aim);
  }
  function humanControl(p, dt) {
    const mv = moveVec(), has = ball.owner === p && !ball.held;
    if (state === 'play') {
      if (has) {
        if (edge.pass) humanPass(p, mv, 'ground');
        else if (edge.lob) humanPass(p, mv, 'lob');
        else if (edge.shoot) { p.charging = true; p.charge = 0; }
        if (edge.skill && p.skillCD <= 0) { p.skillT = .3; p.skillCD = 1.1; if (mv.mag > .2) { p.fx = mv.x / mv.mag; p.fy = mv.y / mv.mag; } }
        if (p.charging && ball.owner === p) {
          if (btn.shoot) p.charge = Math.min(1, p.charge + dt / .85);
          if (rel.shoot || !btn.shoot) { const a = humanShotAim(p, mv); shoot(p, p.charge, a.x, a.y); p.charging = false; }
        }
      } else {
        p.charging = false;
        if (edge.pass) tryTackle(p);
        if (edge.shoot) startSlide(p, mv);
      }
    } else p.charging = false;
    if (p.slideT > 0 || p.lunge > 0) return;
    const holding = ball.owner === p;
    const sprint = btn.sprint && mv.mag > .2 && !p.tired;
    p.sprinting = sprint;
    if (sprint) p.stamina = Math.max(0, p.stamina - dt * .21); else p.stamina = Math.min(1, p.stamina + dt * .18);
    if (p.stamina <= 0) p.tired = true; else if (p.stamina > .3) p.tired = false;
    let sp = BASE_SPEED * (sprint ? SPRINT_MULT : 1) * (holding ? .94 : 1) * (p.charging ? .7 : 1);
    if (p.skillT > 0) sp = BASE_SPEED * 1.65;
    let tx = mv.x * sp * Math.min(1, mv.mag * 1.15), ty = mv.y * sp * Math.min(1, mv.mag * 1.15);
    if (p.skillT > 0 && mv.mag < .2) { tx = p.fx * sp; ty = p.fy * sp; }
    const k = Math.min(1, 10 * dt);
    p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k;
    if (mv.mag > .2) { const kk = Math.min(1, 12 * dt); p.fx += (mv.x / mv.mag - p.fx) * kk; p.fy += (mv.y / mv.mag - p.fy) * kk; const l = hyp(p.fx, p.fy) || 1; p.fx /= l; p.fy /= l; }
    if (sprint && Math.random() < .18) spawn(p.x, p.y, rnd(-8, 8), rnd(-8, 0), .3, 'rgba(210,225,190,.5)', 1, 0);
  }
  function celebrate(p, dt) {
    p.sprinting = false;
    if (p === scorer) { const k = Math.pow(.05, dt); p.vx *= k; p.vy *= k; }
    else if (p.team === goalTeam && !p.isGK && scorer) {
      const d = hyp(scorer.x - p.x, scorer.y - p.y);
      if (d > 26) steer(p, scorer.x, scorer.y, 66, dt, 6); else { const k = Math.pow(.05, dt); p.vx *= k; p.vy *= k; }
    } else { const k = Math.pow(.1, dt); p.vx *= k; p.vy *= k; }
    if (scorer) { const dx = scorer.x - p.x, dy = scorer.y - p.y, d = hyp(dx, dy) || 1; p.fx = dx / d; p.fy = dy / d; }
  }
  function updatePlayer(p, dt) {
    if (p.bench) return;
    p.noCatch -= dt; p.stun -= dt; p.tackleCD -= dt; p.kickT -= dt; p.skillCD -= dt; p.shotCD -= dt; p.skillT -= dt; p.lunge -= dt; p.diveCD -= dt; p.gkErrT -= dt; p.foulCD -= dt;
    const taker = state === 'restart' && restart && restart.taker === p;
    if (state === 'restart' && restart && restart.type === 'kickoff') { p.vx = p.vy = 0; if (!taker) faceUpdate(p, dt); setDir(p); return; }
    if (taker) { p.vx = p.vy = 0; setDir(p); return; }
    if (state === 'goal') { celebrate(p, dt); integrate(p, dt); return; }
    if (p.slideT > 0) { slideStep(p, dt); integrate(p, dt); return; }
    if (p.stun > 0) { const k = Math.pow(.02, dt); p.vx *= k; p.vy *= k; integrate(p, dt); return; }
    if (p.lunge > 0) { p.vx = p.lx * 110; p.vy = p.ly * 110; integrate(p, dt); return; }
    if (p.isGK) gkUpdate(p, dt);
    else if (p === controlled) humanControl(p, dt);
    else aiOutfield(p, dt);
    integrate(p, dt);
  }
  function separate() {
    for (let i = 0; i < players.length; i++) {
      const a = players[i];
      if (a.bench) continue;
      for (let j = i + 1; j < players.length; j++) {
        const b = players[j]; if (b.bench) continue; let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy;
        if (d2 < 64) {
          let d = Math.sqrt(d2); if (d < .01) { dx = rnd(-1, 1); dy = rnd(-1, 1); d = hyp(dx, dy) || 1; }
          const push = (8 - d) * .35; dx /= d; dy /= d;
          a.x += dx * push; a.y += dy * push; b.x -= dx * push; b.y -= dy * push;
        }
      }
    }
  }

  /* ---------- control selection ---------- */
  function updateControl(dt) {
    switchCD -= dt;
    if (keepSoloControl()) return;
    if (state === 'restart') {
      if (restart.team === 0 && !restart.taker.isGK) controlled = restart.taker;
      else if (!controlled || controlled.team !== 0 || controlled.isGK) controlled = nearestOutfield(0, ball.x, ball.y, null);
      return;
    }
    if (state === 'goal' || state === 'fulltime') return;
    const o = ball.owner;
    if (o && o.team === 0 && !o.isGK) { controlled = o; return; }
    const bp = ballPred(), best = nearestOutfield(0, bp.x, bp.y, null);
    if (!controlled || controlled.team !== 0 || controlled.isGK) { controlled = best; return; }
    if (edge.lob || edge.skill) {
      const n = nearestOutfield(0, bp.x, bp.y, controlled);
      if (n) { controlled = n; switchCD = .25; }
    } else if (best && best !== controlled && switchCD <= 0) {
      const cd = hyp(controlled.x - bp.x, controlled.y - bp.y), bd = hyp(best.x - bp.x, best.y - bp.y);
      if (bd + 16 < cd) { controlled = best; switchCD = .3; }
    }
  }
  function nearestOutfield(t, x, y, excl) {
    let b = null, bd = 1e9;
    for (const p of players) { if (p.team !== t || p.isGK || p.bench || p === excl) continue; const d = hyp(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } }
    return b;
  }

  /* ---------- restart input ---------- */
  function updateRestart(dt) {
    const r = restart; r.t += dt;
    const p = r.taker, human = r.team === 0 && !p.isGK;
    const mv = moveVec();
    if (human && mv.mag > .25) {
      const k = Math.min(1, 14 * dt); p.fx += (mv.x / mv.mag - p.fx) * k; p.fy += (mv.y / mv.mag - p.fy) * k;
      const l = hyp(p.fx, p.fy) || 1; p.fx /= l; p.fy /= l;
    }
    p.vx = p.vy = 0; holdBall(p);
    if (r.t < .6) return;
    if (r.type === 'penalty') {
      if (human) { if (edge.shoot || edge.lob || edge.pass) penaltyKick(p, mv); else if (r.t > 9) penaltyKick(p, null); }
      else if (r.t > r.aiDelay) penaltyKick(p, null);
      return;
    }
    if (human) {
      if (edge.pass) restartKick(p, 'ground', mv);
      else if (edge.shoot) restartKick(p, 'shot', mv);
      else if (edge.lob) restartKick(p, 'lob', mv);
      else if (r.t > 9) restartKick(p, 'ground', null);
    } else if (r.t > r.aiDelay) {
      const gx = attackGoalX(r.team), d = hyp(gx - ball.x, CY - ball.y);
      if (r.type === 'freekick' && d < 250 && Math.random() < .55) restartKick(p, 'shot', null);
      else restartKick(p, null, null);
    }
  }
  function penaltyKick(p, mv) {
    if (!restart) return;
    const gx = attackGoalX(p.team);
    let side;
    if (mv && mv.mag > .25) side = clamp(mv.y / mv.mag, -.85, .85);
    else side = (Math.random() < .5 ? -1 : 1) * rnd(.45, 1);
    state = 'play'; restart = null; ball.held = false;
    shoot(p, .8, gx, CY + side * (GOAL_HALF - 10));
  }
  function restartKick(p, kind, mv) {
    const r = restart; let aim;
    if (mv && mv.mag > .25) aim = { x: mv.x / mv.mag, y: mv.y / mv.mag }; else aim = { x: p.fx, y: p.fy };
    if (r.type === 'throwin') { const sy = r.spot.y < CY ? 1 : -1; if (aim.y * sy < .25) { aim.y = .45 * sy; } }
    if (r.type === 'corner') { const sx = r.spot.x < CX ? 1 : -1, sy = r.spot.y < CY ? 1 : -1; if (aim.x * sx < .2) { aim.x = .3 * sx; } if (aim.y * sy < .2) { aim.y = .3 * sy; } }
    const l = hyp(aim.x, aim.y) || 1; aim.x /= l; aim.y /= l;
    if (kind === 'shot') {
      state = 'play'; restart = null; ball.held = false;
      shoot(p, .82, ball.x + aim.x * 240, ball.y + aim.y * 240);
      return;
    }
    let q = bestPass(p, mv && mv.mag > .25 ? aim : null, false);
    if (q && r.type === 'throwin') {
      const sy = r.spot.y < CY ? 1 : -1; if ((q.target.y - p.y) * sy < 0) q = null;
    }
    let k = kind;
    if (!k) k = (r.type === 'corner' || (q && q.dist > 200) || (!q && r.type === 'goalkick')) ? 'lob' : 'ground';
    state = 'play'; restart = null; ball.held = false;
    doPass(p, q ? q.target : null, k, aim);
  }

  /* ---------- ball physics ---------- */
  function holdBall(p) {
    const r = restart;
    if (r.type === 'throwin') { ball.x = p.x; ball.y = p.y; ball.z = 18; }
    else if (r.type === 'corner' || r.type === 'freekick' || r.type === 'penalty') { ball.x = r.spot.x; ball.y = r.spot.y; ball.z = 0; }
    else { ball.x = p.x + p.fx * 6; ball.y = p.y + p.fy * 6; ball.z = 0; }
    ball.vx = ball.vy = 0; ball.vz = 0;
  }
  function carryBall(p, dt) {
    const sp = hyp(p.vx, p.vy);
    p.touchPh += sp * dt * .28;
    if (p.isGK) {
      ball.x += ((p.x + p.fx * 5) - ball.x) * Math.min(1, 20 * dt); ball.y += ((p.y + p.fy * 5) - ball.y) * Math.min(1, 20 * dt);
      ball.vx = ball.vy = 0; ball.z = 4; return;
    }
    const sprint = p.sprinting;
    let off = (sprint ? 12 : 8.5) + Math.sin(p.touchPh) * (sprint ? 3.2 : 1.6);
    if (p.skillT > 0) off = 15;
    const tx = p.x + p.fx * off, ty = p.y + p.fy * off, k = Math.min(1, (sprint ? 12 : 20) * dt);
    ball.x += (tx - ball.x) * k; ball.y += (ty - ball.y) * k;
    ball.vx = p.vx; ball.vy = p.vy; ball.z = 0; ball.vz = 0;
    ball.roll += sp * dt * .3;
  }
  function catchBall(gk) { takeBall(gk); stats.saves[gk.team]++; penPending = null; showFlash('SAVE!'); sfx.save(); }
  function parry(gk) {
    const s = gk.team === 0 ? 1 : -1;
    ball.vx = -ball.vx * .35 + s * rnd(40, 110); ball.vy = ball.vy * .4 + rnd(-110, 110); ball.vz = rnd(30, 90); ball.z = Math.max(ball.z, 1);
    gk.noCatch = .35; ball.lastTouch = gk; stats.saves[gk.team]++; penPending = null; showFlash('SAVE!'); sfx.save();
  }
  function resolveContact() {
    if (ball.owner || state !== 'play') return;
    let best = null, bd = 1e9;
    for (const p of players) {
      if (p.bench) continue;
      if (p.noCatch > 0 || p.stun > 0 || p.slideT > 0) continue;
      if (ball.z > (p.isGK ? 24 : 9)) continue;
      const reach = p.isGK ? (p.diveT > 0 ? 19 : 12) : 8.5, d = hyp(ball.x - p.x, ball.y - p.y);
      if (d < reach && d < bd) { bd = d; best = p; }
    }
    if (!best) return;
    const sp = hyp(ball.vx, ball.vy), hostile = ball.lastTouch && ball.lastTouch.team !== best.team;
    if (best.isGK && hostile && sp > 150) {
      const sk = D(best).gk - Math.max(0, sp - 260) / 900;
      if (Math.random() < Math.max(.3, sk)) { if (sp < 250) catchBall(best); else parry(best); }
      else best.noCatch = .25;
      return;
    }
    if (!best.isGK && sp > 360 && hostile) {
      ball.vx *= -.3; ball.vy *= .5; ball.lastTouch = best; best.noCatch = .3; return;
    }
    if (ball.target === best) ball.target = null;
    takeBall(best);
  }
  function moveBallStep(dt) {
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    ball.z += ball.vz * dt; ball.vz -= G * dt;
    if (ball.z <= 0) {
      ball.z = 0;
      if (ball.vz < -40) { ball.vz = -ball.vz * .4; ball.vx *= .8; ball.vy *= .8; } else ball.vz = 0;
    }
    const posts = [[PX0, GOAL_TOP], [PX0, GOAL_BOT], [PX1, GOAL_TOP], [PX1, GOAL_BOT]];
    for (const q of posts) {
      const dx = ball.x - q[0], dy = ball.y - q[1], d = hyp(dx, dy);
      if (d < 3.4 && ball.z < BAR_H) {
        const nx = d ? dx / d : 1, ny = d ? dy / d : 0, vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) { ball.vx -= 1.6 * vn * nx; ball.vy -= 1.6 * vn * ny; if (-vn > 90) sfx.post(); }
        ball.x = q[0] + nx * 3.5; ball.y = q[1] + ny * 3.5;
      }
    }
    if (state === 'goal') {
      if (ball.x < PX0 - GOAL_DEPTH + 3) { ball.x = PX0 - GOAL_DEPTH + 3; ball.vx = Math.abs(ball.vx) * .25; }
      if (ball.x > PX1 + GOAL_DEPTH - 3) { ball.x = PX1 + GOAL_DEPTH - 3; ball.vx = -Math.abs(ball.vx) * .25; }
      if (ball.x < PX0 || ball.x > PX1) {
        if (ball.y < GOAL_TOP + 2) { ball.y = GOAL_TOP + 2; ball.vy = Math.abs(ball.vy) * .3; }
        if (ball.y > GOAL_BOT - 2) { ball.y = GOAL_BOT - 2; ball.vy = -Math.abs(ball.vy) * .3; }
      }
    }
  }
  function updateBall(dt) {
    if (ball.targetT > 0) { ball.targetT -= dt; if (ball.targetT <= 0) ball.target = null; }
    if (ball.owner) {
      if (ball.held) holdBall(ball.owner);
      else carryBall(ball.owner, dt);
      checkBounds();
      return;
    }
    const sp0 = hyp(ball.vx, ball.vy);
    const n = clamp(Math.ceil(sp0 * dt / 2.5), 1, 10), h = dt / n;
    for (let i = 0; i < n; i++) moveBallStep(h);
    const f = ball.z > .5 ? Math.exp(-.25 * dt) : Math.exp(-FRIC * dt);
    ball.vx *= f; ball.vy *= f;
    if (ball.z === 0 && hyp(ball.vx, ball.vy) < 6) { ball.vx = ball.vy = 0; }
    ball.roll += hyp(ball.vx, ball.vy) * dt * .3;
    resolveContact();
    checkBounds();
  }
  function checkBounds() {
    if (state !== 'play') return;
    const x = ball.x, y = ball.y;
    if (x < PX0 || x > PX1) {
      const left = x < PX0;
      if (y > GOAL_TOP && y < GOAL_BOT && ball.z < BAR_H) { onGoal(left ? 1 : 0); return; }
      ballOut(left ? 'endL' : 'endR'); return;
    }
    if (y < PY0 || y > PY1) ballOut('side');
  }

  /* ---------- particles ---------- */
  function spawn(x, y, vx, vy, life, col, sz, g) { if (parts.length < 400) parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, col: col, sz: sz || 2, g: g || 0 }); }
  function confetti() {
    const cols = ['#ffe45e', '#ff5d73', '#5de0ff', '#7dff8a', '#ffffff', '#c78bff'];
    for (let i = 0; i < 110; i++) spawn(cam.x + rnd(0, VW), cam.y - rnd(0, 60), rnd(-25, 25), rnd(30, 110), rnd(1.6, 3.2), cols[(Math.random() * cols.length) | 0], 2, 0);
  }
  function updateParticles(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i]; q.life -= dt; if (q.life <= 0) { parts.splice(i, 1); continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt;
    }
  }

  /* ---------- camera ---------- */
  function updateCamera(dt, snap) {
    let tx, ty;
    if (state === 'goal' && scorer) { tx = scorer.x; ty = scorer.y; }
    else if (state === 'restart') { tx = ball.x; ty = ball.y; }
    else { tx = ball.x + clamp(ball.vx * .22, -50, 50); ty = ball.y + clamp(ball.vy * .22, -35, 35); }
    const gx = clamp(tx - VW / 2, 0, WW - VW), gy = clamp(ty - VH / 2, 0, WH - VH);
    const k = snap ? 1 : 1 - Math.exp(-5 * dt);
    cam.x += (gx - cam.x) * k; cam.y += (gy - cam.y) * k;
  }

  /* ---------- drawing ---------- */
  function drawArrow(x, y, col) {
    ctx.fillStyle = '#120e18';
    ctx.fillRect(x - 3, y - 1, 7, 1); ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x - 1, y + 1, 3, 1); ctx.fillRect(x, y + 2, 1, 2); ctx.fillRect(x - 3, y, 1, 1); ctx.fillRect(x + 3, y, 1, 1);
    ctx.fillStyle = col; ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x - 1, y + 1, 3, 1); ctx.fillRect(x, y + 2, 1, 1);
  }
  function drawPlayer(p, cx, cy) {
    const kit = p.isRef ? REF_KIT : (p.isGK ? p.kit : teams[p.team]);
    const sp = hyp(p.vx, p.vy);
    const sx = Math.round(p.x) - cx, sy = Math.round(p.y) - cy;
    let fr = 0;
    if (p.kickT > 0) fr = 1; else if (sp > 8) fr = Math.floor(p.anim) & 3;
    if (p.slideT > 0 || p.diveT > 0) {
      const right = (p.diveT > 0 ? p.diveVx : p.fx) >= 0;
      const spr = getSprite(kit, p.skin, p.hair, right ? 'right' : 'left', 1);
      ctx.save(); ctx.translate(sx, sy - 3); ctx.rotate(right ? -Math.PI / 2 : Math.PI / 2); ctx.drawImage(spr, -5, -12); ctx.restore();
      return;
    }
    const spr = getSprite(kit, p.skin, p.hair, p.dir, fr);
    let y = sy - 15;
    if (sp > 8 && (Math.floor(p.anim) & 1) === 1) y -= 1;
    if (p === scorer && state === 'goal') y -= Math.round(Math.abs(Math.sin(goalT * 9)) * 6);
    if (p.stun > 0 && p.stun < .4 && p.slideT <= 0) y += 1;
    ctx.drawImage(spr, sx - 5, y);
  }
  function drawBallSprite(cx, cy) {
    const bx = Math.round(ball.x) - cx, by = Math.round(ball.y) - cy;
    ctx.fillStyle = 'rgba(0,0,0,' + (.32 - Math.min(.2, ball.z / 150)).toFixed(2) + ')';
    ctx.fillRect(bx - 2, by, 5, 1); ctx.fillRect(bx - 1, by + 1, 3, 1);
    ctx.drawImage(BALL_SPR[Math.floor(ball.roll) & 3], bx - 3, by - Math.round(ball.z) - 5);
  }
  function drawWorld() {
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    ctx.drawImage(pitchCv, -cx, -cy);
    const vis = [];
    for (const p of players) {
      const sx = Math.round(p.x) - cx, sy = Math.round(p.y) - cy;
      if (sx < -24 || sx > VW + 24 || sy < -30 || sy > VH + 30) continue;
      vis.push(p);
      ctx.fillStyle = 'rgba(0,0,0,.26)';
      ctx.fillRect(sx - 3, sy - 1, 7, 1); ctx.fillRect(sx - 4, sy, 9, 1); ctx.fillRect(sx - 3, sy + 1, 7, 1);
    }
    if (!drill) {
      const sx = Math.round(referee.x) - cx, sy = Math.round(referee.y) - cy;
      if (!(sx < -24 || sx > VW + 24 || sy < -30 || sy > VH + 30)) {
        vis.push(referee);
        ctx.fillStyle = 'rgba(0,0,0,.26)';
        ctx.fillRect(sx - 3, sy - 1, 7, 1); ctx.fillRect(sx - 4, sy, 9, 1); ctx.fillRect(sx - 3, sy + 1, 7, 1);
      }
    }
    vis.sort((a, b) => a.y - b.y);
    let ballDone = false;
    for (const p of vis) {
      if (!ballDone && ball.y < p.y) { drawBallSprite(cx, cy); ballDone = true; }
      drawPlayer(p, cx, cy);
      // The referee raises the card high while a booking is on screen.
      if (p.isRef && cardPop && cardPop.t > 0) {
        const sx = Math.round(referee.x) - cx, sy = Math.round(referee.y) - cy, red = cardPop.type === 'red';
        ctx.fillStyle = '#120e18'; ctx.fillRect(sx + 4, sy - 32, 9, 15);
        ctx.fillStyle = red ? '#ff4d4d' : '#ffe45e'; ctx.fillRect(sx + 5, sy - 31, 7, 13);
      }
    }
    if (!ballDone) drawBallSprite(cx, cy);
    for (const p of vis) {
      const isControlled = p === controlled;
      const isOppCarrier = !isControlled && controlled && p.team !== controlled.team && ball.owner === p;
      if ((!isControlled && !isOppCarrier) || p.isRef || p.bench || p.sentOff) continue;
      const sx = Math.round(p.x) - cx, sy = Math.round(p.y) - cy;
      const nm = String(p.name || (isControlled && typeof playerName !== 'undefined' ? playerName : '') || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 16);
      if (!nm) continue;
      text(nm, sx, sy - 37, isControlled ? '#ffe45e' : '#ff8b8b', 1, 'c', '#120e18');
    }
    if (controlled && state !== 'goal' && state !== 'fulltime') {
      const p = controlled, sx = Math.round(p.x) - cx, sy = Math.round(p.y) - cy;
      ctx.fillStyle = '#ffe45e';
      ctx.fillRect(sx - 3, sy + 2, 7, 1);
      drawArrow(sx, sy - 27 + (Math.floor(time * 5) & 1), '#ffe45e');
      if (p.charging) {
        ctx.fillStyle = '#000'; ctx.fillRect(sx - 8, sy + 5, 17, 4);
        const c = p.charge; ctx.fillStyle = c < .5 ? '#7dff8a' : c < .86 ? '#ffe45e' : '#ff5d5d';
        ctx.fillRect(sx - 7, sy + 6, Math.round(15 * c), 2);
      }
      if (state === 'play' && ball.owner === p && !p.charging) {
        const mv = moveVec(), aim = mv.mag > .25 ? { x: mv.x / mv.mag, y: mv.y / mv.mag } : { x: p.fx, y: p.fy };
        const q = bestPass(p, aim, false);
        if (q) drawArrow(Math.round(q.target.x) - cx, Math.round(q.target.y) - cy - 24, '#ffffff');
      }
    }
    for (const q of parts) {
      const sx = Math.round(q.x) - cx, sy = Math.round(q.y) - cy;
      if (sx < -4 || sx > VW + 4 || sy < -4 || sy > VH + 4) continue;
      ctx.fillStyle = q.col; ctx.fillRect(sx, sy, q.sz, q.sz);
    }
  }
  function drawHUD() {
    const t0 = teams[0], t1 = teams[1];
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(96, 3, 288, 17);
    ctx.fillStyle = t0.shirt; ctx.fillRect(96, 3, 5, 17); ctx.fillStyle = t1.shirt; ctx.fillRect(379, 3, 5, 17);
    text(t0.team, 106, 9, '#e8f3ec', 1);
    text(t1.team, 374, 9, '#e8f3ec', 1, 'r');
    text(String(score[0]), 214, 5, '#ffffff', 2, 'c'); text('-', 240, 5, '#8fb7a0', 2, 'c'); text(String(score[1]), 266, 5, '#ffffff', 2, 'c');
    const cardRow = (x, team, align) => {
      const seq = [];
      for (let i = 0; i < cardCount[team][0]; i++) seq.push('#ffe45e');
      for (let i = 0; i < cardCount[team][1]; i++) seq.push('#ff4d4d');
      const start = align === 'r' ? x - seq.length * 6 : x;
      for (let i = 0; i < seq.length; i++) { ctx.fillStyle = seq[i]; ctx.fillRect(start + i * 6, 21, 4, 7); }
    };
    if (!drill) { cardRow(106, 0, 'l'); cardRow(374, 1, 'r'); }
    const ckTxt = clockText();
    ctx.fillStyle = 'rgba(8,14,12,.82)'; ctx.fillRect(216, 20, 48, 10);
    text(ckTxt, 240, 23, '#ffe45e', 1, 'c');
    if (!drill) text(half === 1 ? '1ST HALF' : half === 2 ? '2ND HALF' : half === 3 ? 'ET 1' : 'ET 2', 240, 31, '#9fd8b6', 1, 'c');
    const rx = 204, ry = VH - 40, rw = 72, rh = 37;
    ctx.fillStyle = 'rgba(8,24,14,.6)'; ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(rx + rw / 2, ry, 1, rh);
    ctx.fillRect(rx, ry, rw, 1); ctx.fillRect(rx, ry + rh - 1, rw, 1); ctx.fillRect(rx, ry, 1, rh); ctx.fillRect(rx + rw - 1, ry, 1, rh);
    const mx = x => rx + clamp((x - PX0) / PW, 0, 1) * (rw - 2), my = y => ry + clamp((y - PY0) / PH, 0, 1) * (rh - 2);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(rx + clamp((cam.x - PX0) / PW, 0, 1) * rw) + .5, Math.round(ry + clamp((cam.y - PY0) / PH, 0, 1) * rh) + .5, Math.round(VW / PW * rw), Math.round(VH / PH * rh));
    for (const p of players) { if (p.bench) continue; ctx.fillStyle = p === controlled ? '#ffe45e' : (p.isGK ? p.kit.shirt : teams[p.team].shirt); ctx.fillRect(Math.round(mx(p.x)), Math.round(my(p.y)), 2, 2); }
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(mx(ball.x)), Math.round(my(ball.y)), 2, 2);
    if (drill) {
      ctx.fillStyle = 'rgba(8,14,12,.9)'; ctx.fillRect(150, 33, 180, 10);
      text(drillLabel(drill.kind) + '   ' + drill.scored + '/' + drill.reps, 240, 36, '#ffe45e', 1, 'c');
    }
    if (controlled) {
      ctx.fillStyle = 'rgba(8,14,12,.7)'; ctx.fillRect(8, VH - 14, 52, 8);
      ctx.fillStyle = controlled.tired ? '#ff5d5d' : '#7dff8a'; ctx.fillRect(9, VH - 13, Math.round(50 * controlled.stamina), 6);
    }
    if (banner && banner.t > 0) {
      const big = banner.big, s = big ? 7 : 3, y = big ? 96 : 196, a = Math.min(1, banner.t * 3);
      ctx.fillStyle = 'rgba(0,0,0,' + (.45 * a).toFixed(2) + ')'; ctx.fillRect(0, y - 6, VW, s * 5 + 12);
      const col = big ? (Math.floor(time * 8) & 1 ? '#ffe45e' : '#ffffff') : '#ffffff';
      text(banner.text, 240, y, col, s, 'c', '#000');
      if (big && scorer) { text(teams[goalTeam].team + '  #' + scorer.num, 240, y + s * 5 + 16, '#cfe8d6', 2, 'c', '#000'); }
    }
    if (flash && flash.t > 0) text(flash.text, 240, 54, '#ffffff', 2, 'c', '#000');
    if (cardPop && cardPop.t > 0) {
      const red = cardPop.type === 'red', w = 128, h = 42, x = (VW - w) / 2, y = 150;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = red ? '#ff4d4d' : '#ffe45e'; ctx.fillRect(x + 8, y + 9, 11, 24);
      text(red ? 'RED CARD' : 'YELLOW CARD', x + 26, y + 11, red ? '#ff8080' : '#ffe45e', 1);
      text(teams[cardPop.team].team + '  #' + cardPop.num, x + 26, y + 24, '#e8f3ec', 1);
    }
    if (hintT > 0 && state !== 'goal') {
      text('J PASS  K SHOOT  L LOB  SPACE SKILL  SHIFT SPRINT', 240, VH - 22, '#ffffff', 1, 'c', '#000');
    }
    if (state === 'break') {
      ctx.fillStyle = 'rgba(6,10,9,.72)'; ctx.fillRect(0, 0, VW, VH);
      text(breakLabel(breakNext), 240, 104, '#ffffff', 5, 'c', '#000');
      text(teams[0].team + ' ' + score[0] + ' - ' + score[1] + ' ' + teams[1].team, 240, 134, '#cfe8d6', 2, 'c', '#000');
      text(String(Math.max(0, Math.ceil(breakT))), 240, 166, '#ffe45e', 3, 'c', '#000');
    }
  }
  // Crowd Cam cutscene: a full-screen stadium scene shown before every half,
  // standing in for the old pre-match wait and the half-time break screen.
  // `next` is the half about to begin (1 = kick off). Returns true if it drew.
  let walkoutSquads = null;
  function drawCrowdCam(t, tRemain, next, sc) {
    if (typeof window.crowdCamDraw !== 'function') return false;
    const label = next === 1 ? 'KICK OFF' : next === 2 ? 'SECOND HALF' : 'EXTRA TIME';
    const clock = next === 1 ? "0'" : next === 2 ? "45'" : next === 3 ? "90'" : "105'";
    try {
      window.crowdCamDraw(ctx, t, {
        home: teams[0].team, away: teams[1].team,
        kitHome: teams[0].shirt, kitAway: teams[1].shirt,
        label: label, clock: clock, score: sc, tRemain: tRemain, excited: next !== 1
      });
    } catch (e) { return false; }
    return true;
  }
  // Latest scorer for each side, for the Half Time stats card.
  function breakScorers() {
    const out = { home: '', away: '' };
    try {
      if (typeof goalLog !== 'undefined' && goalLog && goalLog.length) {
        for (let i = 0; i < goalLog.length; i++) {
          const g = goalLog[i];
          const s = (g.name || 'Unknown') + " " + String(g.minute || '').replace(/'+$/, '') + "'";
          if (g.team === 'blue') out.home = s; else if (g.team === 'red') out.away = s;
        }
      }
    } catch (e) { }
    return out;
  }
  function draw() {
    if (state === 'title') return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Last Minute Winner cutscene takes over the whole screen while it plays.
    if (state === 'winner' && winnerData && typeof window.lastMinuteWinnerDraw === 'function') {
      try { window.lastMinuteWinnerDraw(ctx, winnerT, winnerData); return; } catch (e) { }
    }
    // Substitution cutscene takes over the whole screen while it plays.
    if (state === 'sub' && typeof window.substitutionDraw === 'function') {
      try { window.substitutionDraw(ctx, subT, subData || {}); return; } catch (e) { }
    }
    if (!drill) {
      // Pre-match: the Walkout cinematic plays first, then the Crowd Cam's KICK
      // OFF scene runs the 5-second countdown before the whistle.
      if (kickoffIntro > 0) {
        const total = (typeof KICKOFF_INTRO_WAIT === 'number') ? KICKOFF_INTRO_WAIT : 300;
        const wdur = (typeof WALKOUT_INTRO_WAIT === 'number' ? WALKOUT_INTRO_WAIT : 0) / 60;
        const el = Math.max(0, (total - kickoffIntro) / 60);
        if (wdur > 0 && el < wdur && typeof window.walkoutDraw === 'function') {
          if (el <= 1 / 60) {
            if (typeof window.walkoutReset === 'function') window.walkoutReset();
            walkoutSquads = (typeof __psSquadNames === 'function') ? __psSquadNames() : null;
          }
          try {
            window.walkoutDraw(ctx, el, {
              home: teams[0].team, away: teams[1].team,
              kitHome: teams[0].shirt, kitAway: teams[1].shirt,
              score: [0, 0], clock: "0'",
              squadHome: walkoutSquads && walkoutSquads.home,
              squadAway: walkoutSquads && walkoutSquads.away
            });
            return;
          } catch (e) { /* fall through to the Crowd Cam */ }
        }
        if (drawCrowdCam(Math.max(0, el - wdur), kickoffIntro / 60, 1, [0, 0])) return;
      }
      // Half-time / extra-time break. Half time opens with the Half Time
      // cutscene (tea's whistle, the walk to the tunnel, the reporter, the
      // first-half numbers), then hands over to the Crowd Cam's SECOND HALF
      // countdown; the extra-time break just runs the Crowd Cam.
      if (state === 'break') {
        const htd = (breakNext === 2 && typeof window.halfTimeDuration === 'number') ? window.halfTimeDuration : 0;
        if (htd > 0 && crowdT < htd && typeof window.halfTimeDraw === 'function') {
          try {
            window.halfTimeDraw(ctx, crowdT, {
              home: teams[0].team, away: teams[1].team,
              kitHome: teams[0].shirt, kitAway: teams[1].shirt,
              score: score, stats: stats, scorers: breakScorers()
            });
            return;
          } catch (e) { /* fall through to the Crowd Cam */ }
        }
        if (drawCrowdCam(Math.max(0, crowdT - htd), breakT, breakNext, score)) return;
      }
    }
    drawWorld();
    if (state === 'fulltime') return;
    drawHUD();
  }

  /* ---------- main update ---------- */
  function update(dt) {
    if (state === 'title') return;
    time += dt;
    if (state === 'fulltime') { fullT += dt; updateParticles(dt); return; }
    if (state === 'winner') {
      winnerT += dt; updateParticles(dt);
      if (winnerT >= WINNER_T) { winnerT = WINNER_T; winnerData = null; endGoal(); }
      return;
    }
    if (state === 'sub') {
      subT += dt; updateParticles(dt);
      const dur = SUB_T();
      if (subT >= dur) { subT = dur; subData = null; state = subReturn; }
      return;
    }
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; }
    if (cardPop) { cardPop.t -= dt; if (cardPop.t <= 0) cardPop = null; }
    if (drill && drill.cd > 0) { drill.cd -= dt; if (drill.cd <= 0) stageDrill(); return; }
    if (hintT > 0 && state === 'play') hintT -= dt;
    updateParticles(dt);
    if (state === 'break') {
      breakT -= dt; crowdT += dt; updateReferee(dt);
      if (breakT <= 0) startHalf(breakNext);
      return;
    }
    if (state === 'play') {
      clock += dt;
      const t = ball.owner ? ball.owner.team : (ball.lastTouch ? ball.lastTouch.team : -1);
      if (t >= 0) stats.poss[t] += dt;
      const c = checkTime();
      if (c === 'end') { endMatch(); return; }
      if (c === 'half') { enterBreak(half + 1); return; }
      if (c === 'et') { enterExtraTime(); enterBreak(3); return; }
    }
    if (state === 'goal') { goalT += dt; if (goalT > 3) { endGoal(); return; } }
    updateControl(dt);
    computeRoles();
    if (state === 'restart') updateRestart(dt);
    aiSubTick();
    for (const p of players) updatePlayer(p, dt);
    updateReferee(dt);
    separate();
    updateBall(dt);
    if (drill && state === 'play' && ball.owner && ball.owner.team === 1) { drill.reps++; ball.owner = null; ball.held = false; showFlash('SAVED'); drill.cd = .9; }
    updateCamera(dt, false);
  }

  /* ---------- cutscene skip ---------- */
  // Describe whatever cutscene is on screen right now (for skip.js), or null.
  // The pre-match and half-time cutscenes run in two stages (the cinematic, then
  // the Crowd Cam countdown), so a skip advances one stage at a time.
  function sceneInfo() {
    if (state === 'sub') return { id: 'sub', label: 'SUBSTITUTION' };
    if (state === 'winner') return { id: 'winner', label: 'LAST MINUTE WINNER' };
    if (state === 'break') {
      const htd = (breakNext === 2 && typeof window.halfTimeDuration === 'number') ? window.halfTimeDuration : 0;
      if (htd > 0 && crowdT < htd) return { id: 'halftime', label: 'HALF TIME' };
      return { id: 'breakcam', label: breakNext === 2 ? 'SECOND HALF' : breakNext === 3 ? 'EXTRA TIME' : 'KICK OFF' };
    }
    if (!drill && typeof kickoffIntro === 'number' && kickoffIntro > 0) {
      const total = (typeof KICKOFF_INTRO_WAIT === 'number') ? KICKOFF_INTRO_WAIT : 300;
      const wdur = (typeof WALKOUT_INTRO_WAIT === 'number' ? WALKOUT_INTRO_WAIT : 0) / 60;
      const el = Math.max(0, (total - kickoffIntro) / 60);
      if (wdur > 0 && el < wdur) return { id: 'walkout', label: 'WALKOUT' };
      return { id: 'kickoffcam', label: 'KICK OFF' };
    }
    return null;
  }
  // Skip the current cutscene by jumping its clock to the end. Returns true if
  // something was skipped.
  function skipScene() {
    if (state === 'sub') { subT = SUB_T(); return true; }
    if (state === 'winner') { winnerT = WINNER_T; return true; }
    if (state === 'break') {
      const htd = (breakNext === 2 && typeof window.halfTimeDuration === 'number') ? window.halfTimeDuration : 0;
      if (htd > 0 && crowdT < htd) { crowdT = htd; return true; }   // half-time show -> Crowd Cam
      breakT = 0; return true;                                       // Crowd Cam -> kick off the half
    }
    if (!drill && typeof kickoffIntro === 'number' && kickoffIntro > 0) {
      const total = (typeof KICKOFF_INTRO_WAIT === 'number') ? KICKOFF_INTRO_WAIT : 300;
      const wdurFrames = (typeof WALKOUT_INTRO_WAIT === 'number') ? WALKOUT_INTRO_WAIT : 0;
      if (wdurFrames > 0 && kickoffIntro > total - wdurFrames) { kickoffIntro = total - wdurFrames; return true; } // walkout -> Crowd Cam
      kickoffIntro = 1; return true;                                 // Crowd Cam -> kick off now
    }
    return false;
  }

  return {
    prepare: prepare,
    update: update,
    draw: draw,
    canvas: ocv,
    info: function () { return { state: state, score: score.slice(), clock: clock, matchLen: matchLen, aiSubs: aiSubsUsed, stats: stats, controlled: controlled, ball: ball, players: players, scorer: scorer, goalTeam: goalTeam, restart: restart, stoppage: stoppage, addedMin: addedMin, etActive: etActive, etStart: etStart, etLen: etLen, half: half, halfStart: halfStart, halfStartMin: halfStartMin, clockText: clockText(), breakNext: breakNext, breakT: breakT, crowdT: crowdT, winnerT: winnerT, winner: winnerData ? { team: winnerData.team, home: winnerData.home, away: winnerData.away, minute: winnerData.minute, scoreA: winnerData.scoreA, scoreB: winnerData.scoreB } : null, teamNames: [teams[0].team, teams[1].team], teamKits: [teams[0].shirt, teams[1].shirt], referee: referee, cam: { x: cam.x, y: cam.y }, cardCount: cardCount.map(function (c) { return c.slice(); }), cardPop: cardPop }; },
    setStick: function (x, y) { stick.x = x || 0; stick.y = y || 0; },
    setBtn: function (n, d) { setBtn(n, d); },
    press: function (n) { if (n && n in edge) edge[n] = 1; },
    clearEdges: clearEdges,
    initAudio: initAudio,
    setHooks: function (h) { if (h) { HOOK.goal = h.goal || null; HOOK.end = h.end || null; } },
    setStopHook: function (fn) { HOOK.stop = (typeof fn === "function") ? fn : null; },
    setDrill: function (kind) { try { startDrill(kind); } catch (e) { } },
    clearDrill: function () { clearDrill(); },
    refreshNames: function () { applySquadNames((typeof __psSquadNames === "function") ? __psSquadNames() : null); },
    playSubstitution: function (data) { playSubstitution(data); },
    sceneInfo: function () { try { return sceneInfo(); } catch (e) { return null; } },
    skipScene: function () { try { return skipScene(); } catch (e) { return false; } },
    drillInfo: function () { return drill ? { kind: drill.kind, reps: drill.reps, scored: drill.scored } : null; }
  };
})();

// Register the on-pitch cutscenes with the skip service (skip.js). One scene
// covers the Walkout, the Crowd Cam, the Half Time show, the Substitution and
// the Last Minute Winner; the service just asks PSMatch what is on screen.
if (window.psSkip && typeof window.psSkip.register === "function") {
  window.psSkip.register({
    id: "match",
    active: function () {
      try {
        const gs = document.getElementById("gameScreen");
        if (!gs || gs.style.display === "none" || gs.getBoundingClientRect().height <= 0) return false;
        return !!PSMatch.sceneInfo();
      } catch (e) { return false; }
    },
    skip: function () { try { return PSMatch.skipScene(); } catch (e) { return false; } }
  });
}

/* --- Glue between the game engine and the Pixel Striker match --------- */
// PSMatch sends a red card here by name because its live players are separate
// from the engine's roster objects. Flag the matching roster slot for the next
// match; Player Career also records the ban on the career so the next fixture
// can be simulated instead of played.
function __psRedCard(name) {
  name = String(name || "").trim();
  if (!name) return;
  const lower = name.toLowerCase();
  try {
    if (typeof currentMode !== "undefined" && currentMode === "playercareer" &&
        typeof pcState !== "undefined" && pcState &&
        String(pcState.name || "").trim().toLowerCase() === lower) {
      pcState.suspNext = 1;
      if (typeof pcSave === "function") pcSave();
    }
  } catch (e) { }
  try {
    const club = (typeof selectedTeam === "string") ? selectedTeam : "";
    const roster = club && (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
    if (!roster) return;
    const keys = (typeof currentMode !== "undefined" && currentMode === "myclub" && typeof myClubSlotList === "function")
      ? myClubSlotList().map(function (s) { return s.key; })
      : ["gk", "d0", "d1", "d2", "d3", "m0", "m1", "m2", "a0", "a1", "a2"];
    for (const key of keys) {
      const rp = getSlotData(roster, key);
      if (!rp || String(rp.name || "").trim().toLowerCase() !== lower) continue;
      rp.__redCarded = true;
      rp.susp = 1;
      if (typeof currentMode !== "undefined" && currentMode === "myclub" &&
          typeof myClubLeague !== "undefined" && myClubLeague && rp.__cid &&
          typeof getMyClubCareer === "function") {
        const career = getMyClubCareer(myClubLeague);
        if (career) {
          if (!career.mySusp || typeof career.mySusp !== "object") career.mySusp = {};
          career.mySusp[rp.__cid] = 1;
          if (typeof saveMyClubData === "function") saveMyClubData();
        }
      }
      break;
    }
  } catch (e) { }
}
function __psTruncName(n) { n = String(n || "").toUpperCase(); return n.length > 15 ? n.slice(0, 15) : n; }
// The named starting XIs for the two sides, for the Walkout line-ups shot. The
// live `allPlayers` set is the one the match actually uses (it carries each
// player's real name, team and role), so read the eleven for each colour and
// order them keeper -> defenders -> midfielders -> attackers.
const __PS_ROLE_ORDER = { goalkeeper: 0, defender: 1, midfielder: 2, attacker: 3 };
const __PS_ROLE_POS = { goalkeeper: "GK", defender: "DEF", midfielder: "MID", attacker: "ATT" };
function __psSquadNames() {
  try {
    if (typeof allPlayers === "undefined" || !allPlayers || !allPlayers.length) return null;
    const pick = function (color) {
      const rows = [];
      for (let i = 0; i < allPlayers.length; i++) {
        const p = allPlayers[i];
        if (!p || p.team !== color) continue;
        const role = p.role;
        if (role === "referee" || role === "neutral") continue;
        rows.push({ name: p.name, pos: __PS_ROLE_POS[role] || "DEF", r: (role in __PS_ROLE_ORDER) ? __PS_ROLE_ORDER[role] : 1, i: i });
      }
      rows.sort(function (a, b) { return (a.r - b.r) || (a.i - b.i); });
      return rows;
    };
    const homeColor = (typeof teammates !== "undefined" && teammates && teammates[0] && teammates[0].team) || "blue";
    const awayColor = homeColor === "blue" ? "red" : "blue";
    const home = pick(homeColor), away = pick(awayColor);
    if (home.length < 11 && away.length < 11) return null;
    // If the squads were never named (still carrying the role placeholders),
    // don't put "DEFENDER" on the team sheet - let the walkout use its defaults.
    const generic = function (rows) { return rows.filter(function (r) { return /^(defender|midfielder|attacker|goalkeeper|field)$/i.test(String(r.name || "")); }).length; };
    if (generic(home) > 3 && generic(away) > 3) return null;
    return { home: home, away: away };
  } catch (e) { return null; }
}
function __psColorDistance(a, b) {
  try {
    const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const x = p(a), y = p(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  } catch (e) { return 999; }
}
const BASE_FORMATIONS = {};
function baseFormation() {
  let key = BASE_FORMATIONS[selectedTeam] || "4-3-3";
  try { key = localStorage.getItem("sg_team_formation_" + selectedTeam) || key; } catch (e) { }
  if (!MY_CLUB_FORMATIONS[key]) key = "4-3-3";
  BASE_FORMATIONS[selectedTeam] = key;
  const f = MY_CLUB_FORMATIONS[key];
  return { key: key, nd: f.defs, nm: f.mids, na: f.atts };
}
function setBaseFormation(key) {
  if (!MY_CLUB_FORMATIONS[key]) return false;
  BASE_FORMATIONS[selectedTeam] = key;
  try { localStorage.setItem("sg_team_formation_" + selectedTeam, key); } catch (e) { }
  return true;
}
function __psConfig() {
  const name0 = (typeof selectedTeam === "string" && selectedTeam) ? selectedTeam : "YOUR TEAM";
  let name1 = "OPPONENT";
  try { if (typeof getOpponentTeam === "function") { const t = getOpponentTeam(); if (t) name1 = (typeof t === "string") ? t : (t.name || "OPPONENT"); } } catch (e) { }
  const tc = (typeof teamColors === "object" && teamColors) ? teamColors : {};
  let c0 = tc[name0] || "#168cff";
  let c1 = tc[name1] || "#e63946";
  if (__psColorDistance(c0, c1) < 90) c1 = (__psColorDistance(c0, "#ffffff") > 90) ? "#ffffff" : "#101010";
  let diff = 1;
  try { const s = (typeof getDifficultyScale === "function") ? getDifficultyScale() : 1; diff = s <= 0.9 ? 0 : (s >= 1.1 ? 2 : 1); } catch (e) { }
  let matchLen = 180;
  try { const half = (typeof halfLengthMinutes === "function") ? halfLengthMinutes() : 1.5; matchLen = Math.max(60, Math.round(2 * half * 60)); } catch (e) { }
  return {
    name0: __psTruncName(name0), color0: c0, name1: __psTruncName(name1), color1: c1,
    diff: diff, matchLen: matchLen, et: __psKnockout(), stadium: __psStadium(),
    squads: (typeof __psSquadNames === "function") ? __psSquadNames() : null,
    solo: (typeof currentMode !== "undefined" && currentMode === "playercareer"),
    soloName: (typeof playerName === "string") ? playerName : "",
    formation: (typeof currentMode !== "undefined" && currentMode !== "myclub") ? baseFormation() : null
  };
}
// Work out which club hosts this match and return its stadium spec. The
// fixture records team1 = home, so the player's club ("selectedTeam") is home
// when it is team1 and away otherwise; either way the ground on screen is the
// HOME club's. My Club may have bought an upgrade, so ask the career first.
function __psStadium() {
  try {
    if (typeof window === "undefined" || !window.STADIUMS) return null;
    const home = __psHomeClub();
    if (!home) return null;
    if (typeof window.myClubStadiumSpec === "function") {
      const own = window.myClubStadiumSpec(home);
      if (own) return own;
    }
    return window.STADIUMS.forClub(home);
  } catch (e) { return null; }
}
function __psHomeClub() {
  try {
    const me = (typeof selectedTeam === "string") ? selectedTeam : "";
    const fx = __psFixture();
    if (fx && fx.match && fx.match.team1) return fx.match.team1;
    // No fixture context (friendly/exhibition): treat the player's club as home.
    return me || null;
  } catch (e) { return (typeof selectedTeam === "string") ? selectedTeam : null; }
}
function __psFixture() {
  try {
    if (typeof pcContext !== "undefined" && pcContext && pcContext.fixture) return pcContext.fixture;
    if (typeof mcContext !== "undefined" && mcContext && mcContext.fixture) return mcContext.fixture;
  } catch (e) { }
  return null;
}
// A knockout tie goes to extra time (and then penalties) if it is level at full
// time; group-stage and one-off matches just end. Shared by the config (which
// turns extra time on) and the end hook (which sends a still-level tie to
// penalties).
function __psKnockout() {
  try {
    if (typeof currentMode === "undefined") return false;
    if (currentMode === "worldcup" || currentMode === "custom" || currentMode === "playercareer" || currentMode === "managercareer") {
      return !(typeof isGroupStageMatch === "function" && isGroupStageMatch());
    }
  } catch (e) { }
  return false;
}
function __psNeutralizeTimer() {
  try { if (typeof timerInterval !== "undefined" && timerInterval) { clearInterval(timerInterval); timerInterval = null; } } catch (e) { }
}
function __psGoal(t) {
  PSMatch.initAudio();
  const info = PSMatch.info();
  blueScore = info.score[0]; redScore = info.score[1];
  if (typeof updateScore === "function") updateScore();
  if (typeof crowdEvent === "function") { try { crowdEvent("goal"); } catch (e) { } }
  // Record the goal so the end-of-match summary and career top-scorer tables
  // still list it, using the scorer's squad name and the same stoppage-time
  // clock shown on the HUD (45+1', 90+3', 105+1').
  try {
    const lbl = info.goalTeam === 0 ? "blue" : "red";
    const who = info.scorer ? (info.scorer.name || ("#" + info.scorer.num)) : "Unknown";
    const per = info.matchLen / 90;
    const minute = info.clockText || (info.etActive
      ? 90 + Math.max(1, Math.min(30, Math.round((info.clock - info.etStart) / per)))
      : Math.max(1, Math.min(90, Math.round(info.clock / per)))) + "'";
    goalLog.push({ team: lbl, name: who, minute: minute, own: false, assist: null });
  } catch (e) { }
}
function __psEnd() {
  const info = PSMatch.info();
  const sc = info.score;
  blueScore = sc[0]; redScore = sc[1];
  if (typeof updateScore === "function") updateScore();
  // Freeze this match's statistics for the post-match summary before anything
  // else can touch the engine.
  try {
    matchStatsSnapshot = {
      stats: info.stats,
      cardCount: info.cardCount,
      penalty: (typeof penaltyScore !== "undefined" && penaltyScore) ? { winner: penaltyWinner, score: penaltyScore } : null
    };
  } catch (e) { matchStatsSnapshot = null; }
  const tied = (blueScore === redScore);
  // By now any knockout tie has already played its extra time inside the match
  // engine, so a tie that survives to full time is settled on penalties.
  if (tied && __psKnockout() && typeof beginPenalties === "function") { beginPenalties(); return; }
  if (typeof endMatch === "function") endMatch();
}
PSMatch.setHooks({ goal: __psGoal, end: __psEnd });

/* ------------------------------------------------------------------ *
 * 2. Small helpers
 * ------------------------------------------------------------------ */

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

function worldLeftOf(team) { return team === "blue" ? field.x : field.x + field.width; }
function attackDirOf(p) { return p.team === "blue" ? 1 : -1; }

// Steer an object toward a target at a given speed (single step, no easing).
function moveToward(object, tx, ty, speed) {
  const dx = tx - object.x;
  const dy = ty - object.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.001) return;
  const step = Math.min(d, speed);
  object.x += (dx / d) * step;
  object.y += (dy / d) * step;
}

// The X a keeper guards on their line.
function keeperHomeX(team) {
  return team === "blue" ? field.x + 44 : field.x + field.width - 44;
}

function homeSpot(p) {
  const hx = (typeof p.startX === "number") ? p.startX : PITCH_CX;
  const hy = (typeof p.startY === "number") ? p.startY : PITCH_CY;
  return { x: hx, y: hy };
}

function inPenaltyBox(x, y) {
  const penDepth = Math.round(field.width / 7);
  const penHalf = goalHeight / 2 + 120;
  if (x < field.x + penDepth && Math.abs(y - PITCH_CY) < penHalf) return true;
  if (x > field.x + field.width - penDepth && Math.abs(y - PITCH_CY) < penHalf) return true;
  return false;
}

function keepInsideField(p) {
  p.x = clamp(p.x, field.x - 20, field.x + field.width + 20);
  p.y = clamp(p.y, field.y - 20, field.y + field.height + 20);
}

function opponentsOf(p) {
  return p.team === "blue" ? opponents : teammates;
}

function nearestToBallOf(list) {
  let best = null, bestD = Infinity;
  for (const q of list) {
    if (!q || q.sentOff) continue;
    const d = distance(q, ball);
    if (d < bestD) { bestD = d; best = q; }
  }
  return best;
}

// A player holding the ball keeps it just ahead of them, in their facing dir.
function glueBallToCarrier(p) {
  if (!p) return;
  const dir = attackDirOf(p);
  ball.x = p.x + dir * (p.radius + ball.radius + 2);
  ball.y = p.y;
  ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0;
  ball.x = clamp(ball.x, field.x - 6, field.x + field.width + 6);
  ball.y = clamp(ball.y, field.y - 6, field.y + field.height + 6);
}

/* ------------------------------------------------------------------ *
 * 3. Input sampling
 * ------------------------------------------------------------------ */

function leftTriggerHeld() {
  return !!(keys["q"] || vInput.lt);
}

function currentStickDir() {
  let x = 0, y = 0;
  if (keys["w"] || keys["arrowup"] || vInput.up) y -= 1;
  if (keys["s"] || keys["arrowdown"] || vInput.down) y += 1;
  if (keys["a"] || keys["arrowleft"] || vInput.left) x -= 1;
  if (keys["d"] || keys["arrowright"] || vInput.right) x += 1;
  const d = Math.hypot(x, y);
  if (d > 0) { x /= d; y /= d; }
  return { x: x, y: y };
}

function rightStickDirOnly() {
  const x = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  const y = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  return { x: x, y: y };
}

function currentShotMode() { return SHOT_MODES[0]; }
function currentPassMode() { return passModifierKey() ? "lob" : "ground"; }
function passModifierKey() { return !!(keys["b"] && keys["shift"]); }
function currentDribbleSkill() { return "knock"; }

function stickWorldAim() {
  const r = rightStickDirOnly();
  if (Math.hypot(r.x, r.y) > 0.2) return { x: r.x, y: r.y };
  const p = player;
  return { x: attackDirOf(p), y: 0 };
}

function gamepadConnected() {
  try {
    const pads = navigator.getGamepads ? navigator.getGamepads() : null;
    if (!pads) return false;
    for (let i = 0; i < pads.length; i++) if (pads[i]) return true;
  } catch (e) { }
  return false;
}

function updateControlsHint() {
  const el = document.getElementById("controlsHint");
  if (!el) return;
  if (currentScheme() === "mobile") { el.textContent = "Stick to move - Shoot - Pass - Run"; return; }
  if (gamepadConnected()) { el.textContent = "Stick move - A shoot - X pass - Y tackle - LB switch - RT run"; return; }
  el.textContent = "WASD move - Space shoot - B pass - V tackle - F switch - Shift run";
}

/* ------------------------------------------------------------------ *
 * 4. Cutscene + walkout (lightweight presentation)
 * ------------------------------------------------------------------ */

function endCutscene(skip) {
  cutscene = null;
  cutsceneKind = null;
  cutsceneIntroDone = true;
  if (typeof kickoffIntro === "number" && kickoffIntro > CUTSCENE_KICKOFF_LEAD) {
    kickoffIntro = Math.min(kickoffIntro, CUTSCENE_KICKOFF_LEAD);
  }
}

function buildCutscene(kind) { cutsceneKind = kind || "intro"; }

// The engine's camera asks for the current cutscene shot. The arcade build has
// no cutscenes, so there is never a shot to frame.
function cutsceneShot() { return null; }

function startCutscene(kind) {
  if (cutsceneMatchSeen) return;
  cutsceneMatchSeen = true;
  buildCutscene(kind || "intro");
}

function updateCutscenes(dt) {
  // The broadcast intro is skipped entirely in the arcade build: the pitch
  // fades straight in under the KICKOFF countdown.
  if (cutscene) endCutscene(true);
}

function drawCutscene() {
  if (!cutscene) return;
  const msg = "KICKOFF";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.fillText(msg, W / 2, H / 2);
  ctx.textAlign = "left";
}

function walkoutLane(p) {
  const i = allPlayers.indexOf(p);
  return (i % 2 === 0) ? -1 : 1;
}

function walkoutDrawPos(p) {
  if (!walkoutT || walkoutDone) return null;
  const h = homeSpot(p);
  const tx = h.x, ty = h.y;
  const sx = p.team === "blue" ? field.x - 60 : field.x + field.width + 60;
  const sy = PITCH_CY + walkoutLane(p) * 260;
  const t = clamp(walkoutT, 0, 1);
  const e = t * t * (3 - 2 * t);
  return {
    x: sx + (tx - sx) * e,
    y: sy + (ty - sy) * e,
    walking: t < 1,
    phase: t * 18,
  };
}

function walkoutTier(ovr) {
  if (ovr >= 88) return "gold";
  if (ovr >= 78) return "silver";
  return "bronze";
}

function walkoutCardList() {
  if (walkoutCards) return walkoutCards;
  walkoutCards = teammates.slice(0, 4).map((p) => ({ name: p.name, ovr: p.overall || 70 }));
  return walkoutCards;
}

function updateWalkout() {
  if (walkoutDone) return;
  walkoutT += 1 / 150;
  if (walkoutT >= 1) { walkoutT = 1; walkoutDone = true; }
}

function drawWalkoutCards() {
  if (walkoutDone || !walkoutT) return;
  const list = walkoutCardList();
  const n = list.length;
  for (let i = 0; i < n; i++) {
    const c = list[i];
    const x = W / 2 + (i - (n - 1) / 2) * 150;
    const y = H / 2;
    ctx.fillStyle = walkoutTier(c.ovr) === "gold" ? "#d4af37" : (walkoutTier(c.ovr) === "silver" ? "#c0c0c0" : "#cd7f32");
    ctx.fillRect(x - 60, y - 80, 120, 160);
    ctx.fillStyle = "#101010";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(c.name, x, y + 6);
    ctx.font = "bold 34px Arial";
    ctx.fillText(String(c.ovr), x, y + 46);
    ctx.textAlign = "left";
  }
}

/* ------------------------------------------------------------------ *
 * 5. HUD + goal rendering
 * ------------------------------------------------------------------ */

function matchClockText() {
  if (matchPhase === "penalties") return "PENS";
  const half = (matchPhase === "sudden")
    ? "SD"
    : (clockHalf === 1 ? "1st Half" : (clockHalf === 2 ? "2nd Half" : (clockHalf === 3 ? "ET1" : "ET2")));
  const min = Math.max(1, Math.min(matchPhase === "extra" ? 120 : 90, Math.floor(matchTime)));
  return min + "' - " + half;
}

function cardCounts() {
  // The engine HUD (updateCards) reads this as {yb, rb, yr, rr}:
  // yellow/red for blue and for red.
  let yb = 0, rb = 0, yr = 0, rr = 0;
  for (const p of allPlayers) {
    if (p.role === "referee") continue;
    if (p.team === "blue") { if (p.cards === 1) yb++; else if (p.cards >= 2) rb++; }
    else { if (p.cards === 1) yr++; else if (p.cards >= 2) rr++; }
  }
  return { yb: yb, rb: rb, yr: yr, rr: rr };
}

function drawCountdown() {
  const fkWait = !!(freekick && freekick.wait > 0);
  const pkWait = !!(matchPenalty && matchPenalty.phase === "wait");
  if (kickoffIntro <= 0 && !fkWait && !pkWait && (postGoalPause || 0) <= 0) return;
  const spot = projectPoint(PITCH_CX, PITCH_CY);
  if (!spot) return;
  const pulse = 1 + 0.08 * Math.sin(performance.now() / 90);
  const size = Math.max(42, 110 * pulse);
  ctx.textAlign = "center";
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, size * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10,12,30,0.75)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold " + size + "px Arial";
  const num = kickoffIntro > 0 ? Math.max(1, Math.ceil(kickoffIntro / 60)) : countdownSeconds;
  ctx.fillText(String(num), spot.x, spot.y + size * 0.35);
  ctx.font = "bold " + Math.max(14, size * 0.18) + "px Arial";
  ctx.fillStyle = "#ffd700";
  ctx.fillText(fkWait ? "FREE KICK IN" : (pkWait ? "PENALTY IN" : "KICKOFF IN"), spot.x, spot.y - size * 0.55);
  ctx.textAlign = "left";
}

function drawGoal(gx) {
  const S2 = 0.85;
  const px = (x) => VPR + (x - W / 2) * S2;
  const py = (y) => H / 2 + (y - H / 2) * S2;
  const x = px(gx);
  const t = py(PITCH_CY - goalHeight / 2);
  const b = py(PITCH_CY + goalHeight / 2);
  ctx.strokeStyle = "#f4f6f8";
  ctx.lineWidth = 6;
  ctx.strokeRect(x - 14, t, 28, b - t);
  ctx.strokeStyle = "rgba(244,246,248,0.4)";
  for (let yy = t; yy <= b; yy += 22) {
    ctx.beginPath(); ctx.moveTo(x - 14, yy); ctx.lineTo(x + 14, yy); ctx.stroke();
  }
}

/* ------------------------------------------------------------------ *
 * 6. Player + ball rendering (top-down arcade)
 * ------------------------------------------------------------------ */

function drawPlayer(p) {
  if (!p || p.sentOff) return;
  const wq = walkoutDrawPos(p);
  const proj = projectPoint(wq ? wq.x : p.x, wq ? wq.y : p.y);
  if (!proj) return;

  // ground shadow
  ctx.beginPath();
  ctx.ellipse(proj.x, proj.y + 9, 14, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fill();

  const bodyR = p.role === "goalkeeper" ? 15 : 16;

  // little running bob
  const bob = (p.walk || 0) > 0 ? Math.sin((p.walk || 0) * 0.3) * 1.5 : 0;

  // jersey
  ctx.beginPath();
  ctx.arc(proj.x, proj.y + bob, bodyR, 0, Math.PI * 2);
  ctx.fillStyle = p.color || (p.team === "blue" ? "#168cff" : "#e63946");
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = shadeColor(p.color || "#168cff", 0.6);
  ctx.stroke();

  // shorts hint
  ctx.beginPath();
  ctx.arc(proj.x, proj.y + bob + 6, bodyR * 0.7, 0, Math.PI);
  ctx.fillStyle = p.role === "goalkeeper" ? "#1e1e2c" : "#f4f6f9";
  ctx.fill();

  // facing nub (shows shooting direction)
  const fx = (p.facingX != null ? p.facingX : attackDirOf(p));
  ctx.beginPath();
  ctx.moveTo(proj.x, proj.y + bob - 4);
  ctx.lineTo(proj.x + fx * (bodyR + 6), proj.y + bob - 4 - (p.facingY || 0) * (bodyR + 6));
  ctx.lineTo(proj.x, proj.y + bob + 4);
  ctx.closePath();
  ctx.fillStyle = shadeColor(p.color || "#168cff", 0.75);
  ctx.fill();

  // name label for the controlled player and the opponent on the ball
  const isLocal = p === localPlayer;
  const isOppCarrier = !isLocal && localPlayer && p.team !== localPlayer.team && ballCarrier === p;
  if (isLocal || isOppCarrier) {
    const displayName = p.name || (isLocal ? playerName : "");
    if (displayName) {
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.72)";
      ctx.strokeText(displayName, proj.x, proj.y - bodyR - 8);
      ctx.fillStyle = isLocal ? "#ffd700" : "#ff8b8b";
      ctx.fillText(displayName, proj.x, proj.y - bodyR - 8);
    }
  }

  // selection ring
  if (p === localPlayer) {
    ctx.beginPath();
    ctx.arc(proj.x, proj.y + bob, bodyR + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,215,0,0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // pass-request indicator
  if (p.indicatorFrames > 0 && p.indicatorText) {
    ctx.fillStyle = "#62e36b";
    ctx.font = "bold 18px Arial";
    ctx.fillText(p.indicatorText, proj.x, proj.y - bodyR - 30);
  }

  // shot charge bar
  if (p === localPlayer && p.charging) {
    const frac = clamp((p.chargeFrames || 0) / MAX_CHARGE_FRAMES, 0, 1);
    const bw = 40, bh = 6;
    const bx = proj.x - bw / 2, by = proj.y - bodyR - 30;
    ctx.fillStyle = "#263746";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = frac < 0.5 ? "#ffd700" : "#e63946";
    ctx.fillRect(bx, by, bw * frac, bh);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }
  ctx.textAlign = "left";
}

function drawBall() {
  const proj = projectPoint(ball.x, ball.y);
  if (!proj) return;
  const r = Math.max(6, ball.radius * 1.1);
  const lift = clamp((ball.z || 0) / 120, 0, 1);

  const gproj = projectPoint(ball.x, ball.y);
  if (gproj) {
    ctx.beginPath();
    ctx.ellipse(gproj.x, gproj.y + r, r * (1.1 - lift * 0.5), r * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0," + (0.3 - lift * 0.18).toFixed(3) + ")";
    ctx.fill();
  }
  const y = proj.y - (ball.z || 0) * 0.12;
  const base = ballColorSetting();
  const panel = ballPanelSetting();
  ctx.beginPath();
  ctx.arc(proj.x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = base;
  ctx.fill();
  ctx.strokeStyle = panel;
  ctx.lineWidth = Math.max(1, r * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(proj.x - r * 0.15, y - r * 0.1, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = panel;
  ctx.fill();
}

function drawAimCursor() {
  if (!player || !player.charging) return;
  const proj = projectPoint(player.x + attackDirOf(player) * 90, player.y);
  if (!proj) return;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 14, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,215,0,0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawCardFlash() {
  if (!cardFlash || cardFlash.frames <= 0) return;
  ctx.fillStyle = cardFlash.color;
  ctx.fillRect(W / 2 - 40, 60, 80, 110);
  ctx.fillStyle = "#101010";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(cardFlash.text || "", W / 2, 200);
  ctx.textAlign = "left";
}

function drawInvader(m) {
  const proj = projectPoint(m.x, m.y);
  if (!proj) return;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = m.color || "#ff2b2b";
  ctx.fill();
}

/* ------------------------------------------------------------------ *
 * 7. Possession + ball physics
 * ------------------------------------------------------------------ */

function canControlBall(p) {
  return !p.sentOff && p.role !== "referee" && p.team !== "neutral" && (ball.z || 0) < BALL_CONTROL_HEIGHT;
}

function collideWithBall(p) {
  if (!p || p.sentOff || p.role === "referee" || p.team === "neutral") return;
  if (ball.immune > 0) return;
  if (ballCarrier === p) { glueBallToCarrier(p); return; }
  const d = distance(p, ball);
  if (d > p.radius + ball.radius + 6) return;

  // Moving hard ball.
  const speed = Math.hypot(ball.vx || 0, ball.vy || 0);
  if (speed > 7) {
    if (p.role === "goalkeeper") {
      // Shot-stopping: catch it, or parry it back out.
      if (netRand() < 0.5) {
        ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0;
        ballCarrier = p; setBallToucher(p);
      } else {
        bounce(1);
      }
      return;
    }
    // A teammate lets his own shot/pass run; opponents block it.
    if (ball.lastToucher && ball.lastToucher.team === p.team) return;
    bounce(-1);
    return;
  }
  if (!canControlBall(p)) return;

  // Take possession if free, or win it off an opponent with a 50/50 nudge.
  if (!ballCarrier) {
    takePossession(p);
  } else if (ballCarrier.team !== p.team) {
    if (netRand() < 0.5) takePossession(p);
  }
}

function takePossession(p) {
  ballCarrier = p;
  setBallToucher(p);
  setTimeout(function () { if (p.indicatorFrames > 0) p.indicatorFrames = 0; }, 0);
}

function bounce(outwardSign) {
  const dx = ball.x - PITCH_CX;
  const dy = ball.y - PITCH_CY;
  const d = Math.hypot(dx, dy) || 1;
  const sp = Math.hypot(ball.vx || 0, ball.vy || 0);
  const push = Math.max(4, sp * 0.6);
  ball.vx = (dx / d) * push * outwardSign;
  ball.vy = (dy / d) * push * outwardSign;
}

function nudgeBall() {
  if (practiceDrill) {
    const p = ballCarrier || player;
    if (!p) return;
    if (ballCarrier === p) {
      const r = sticksAim(p);
      ball.vx = r.x * 9;
      ball.vy = r.y * 9;
      ballCarrier = null;
      setBallToucher(p);
      ball.immune = KICK_IMMUNITY;
    }
    return;
  }
  PSMatch.press("skill");
}

function updateBall() {
  if (ball.immune > 0) ball.immune--;
  if (ballCarrier && !ballCarrier.sentOff) glueBallToCarrier(ballCarrier);

  // integrate planar motion with friction (grass barely bites, so the ball
  // carries a long way - a struck shot can reach the goal from range)
  ball.x += ball.vx || 0;
  ball.y += ball.vy || 0;
  ball.vx *= 0.992;
  ball.vy *= 0.992;
  if (Math.abs(ball.vx) < 0.04) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.04) ball.vy = 0;

  // integrate loft
  if (ball.z > 0 || ball.vz !== 0) {
    ball.z += ball.vz || 0;
    ball.vz = (ball.vz || 0) - BALL_GRAVITY;
    if (ball.z <= 0) { ball.z = 0; ball.vz = 0; }
  }

  // a moving free ball can be intercepted by the nearest player
  detectGoal();
  detectOutOfPlay();
  if (!ballCarrier) checkBallPickup();
}

function checkBallPickup() {
  if (ball.immune > 0) return;
  for (const p of allPlayers) {
    if (p.sentOff || p.role === "referee" || p.team === "neutral") continue;
    if (distance(p, ball) <= p.radius + ball.radius + 4 && (ball.z || 0) < BALL_CONTROL_HEIGHT) {
      const sp = Math.hypot(ball.vx || 0, ball.vy || 0);
      if (sp < 6) { takePossession(p); return; }
    }
  }
}

function detectGoal() {
  const top = PITCH_CY - goalHeight / 2;
  const bot = PITCH_CY + goalHeight / 2;
  if (ball.x < field.x - 2 && ball.y > top && ball.y < bot) {
    ball.vx = 0; ball.vy = 0;
    goalScored("red");
    resetPositions();
    return;
  }
  if (ball.x > field.x + field.width + 2 && ball.y > top && ball.y < bot) {
    ball.vx = 0; ball.vy = 0;
    goalScored("blue");
    resetPositions();
  }
}

function detectOutOfPlay() {
  const outX = ball.x < field.x - 4 || ball.x > field.x + field.width + 4;
  const outY = ball.y < field.y - 4 || ball.y > field.y + field.height + 4;
  if (!outX && !outY) return;
  if (typeof ball.z === "number" && ball.z > 20) return; // still in the air

  // Which team last touched decides the restart.
  const last = ball.lastToucher;
  const restartTeam = last ? (last.team === "blue" ? "red" : "blue") : "blue";

  ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0;
  ball.x = clamp(ball.x, field.x + 6, field.x + field.width - 6);
  ball.y = clamp(ball.y, field.y + 6, field.y + field.height - 6);
  ballCarrier = null;

  // The nearest player of the restart team walks onto it.
  const team = restartTeam === "blue" ? teammates : opponents;
  const taker = nearestToBallOf(team.filter((q) => !q.sentOff));
  if (taker) { taker.x = ball.x - attackDirOf(taker) * 26; taker.y = ball.y; }
  setBallToucher(taker || last);
}

/* ------------------------------------------------------------------ *
 * 8. Movement + AI
 * ------------------------------------------------------------------ */

function sticksAim(p) {
  const w = currentStickDir();
  if (Math.hypot(w.x, w.y) > 0.2) return w;
  return { x: attackDirOf(p), y: 0 };
}

function moveHuman() {
  // Used by the engine sim path (practice drills). Real matches are driven by
  // the Pixel Striker engine, which never calls this.
  if (!player) return;
  const dir = currentStickDir();
  const sprint = !!(keys["shift"] || vInput.sprint);
  let speed = computeSpeed(player.pace || 70, player.physical || 70);
  if (sprint && player.energy > 4) speed *= 1.35;

  if (dir.x || dir.y) {
    player.x += dir.x * speed;
    player.y += dir.y * speed;
    player.facingX = dir.x !== 0 ? Math.sign(dir.x) : (player.facingX || attackDirOf(player));
    player.facingY = dir.y;
    player.walk = (player.walk || 0) + speed * 0.4;
  } else {
    player.walk = 0;
  }

  if (sprint && (dir.x || dir.y)) player.energy = Math.max(0, player.energy - ENERGY_DRAIN_RATE);
  else player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_REGEN_RATE);

  if (player.kickAnim > 0) player.kickAnim--;
  if (player.indicatorFrames > 0) player.indicatorFrames--;
  keepInsideField(player);
}

function switchPlayer() {
  if (practiceDrill) {
    const outfield = teammates.filter((p) => !p.sentOff && p.role !== "goalkeeper");
    if (!outfield.length) return;
    const idx = outfield.indexOf(player);
    const next = outfield[(idx + 1 + outfield.length) % outfield.length] || outfield[0];
    player = next;
    localPlayer = next;
    bindSimHuman(next);
    return;
  }
  PSMatch.press("lob");
}

function aiMovePlayer(p, attackDir) {
  // Keeper: guard the line and distribute when holding.
  if (p.role === "goalkeeper") { aiKeeper(p); return; }

  const team = p.team;
  const teamHasBall = !!(ballCarrier && ballCarrier.team === team);

  // The ball carrier drives at goal and shoots / passes.
  if (ballCarrier === p) { aiCarry(p); return; }

  // The defending side sends its closest outfielder to press the carrier.
  if (ballCarrier && !teamHasBall) {
    const mates = (team === "blue" ? teammates : opponents).filter((q) => !q.sentOff && q.role !== "goalkeeper");
    if (nearestToBallOf(mates) === p) {
      moveToward(p, ballCarrier.x, ballCarrier.y, computeSpeed(p.pace, p.physical) * 1.02);
      aiAttemptTackle(p);
      keepInsideField(p);
      return;
    }
  }

  // Free ball: the nearest player on each side chases it down.
  if (!ballCarrier) {
    const chaser = nearestToBallOf((team === "blue" ? teammates : opponents).filter((q) => !q.sentOff));
    if (chaser === p) {
      moveToward(p, ball.x, ball.y, computeSpeed(p.pace, p.physical) * 1.05);
      keepInsideField(p);
      return;
    }
  }

  // Otherwise keep a team shape that slides with the ball.
  const h = homeSpot(p);
  const shift = (ball.x - PITCH_CX) * 0.30;
  let tx = h.x + shift * attackDir;
  let ty = h.y + (ball.y - PITCH_CY) * 0.25;
  if (!teamHasBall) tx -= attackDir * 60;
  p.x = p.x + clamp(tx - p.x, -1, 1) * computeSpeed(p.pace, p.physical) * 0.5;
  p.y = p.y + clamp(ty - p.y, -1, 1) * computeSpeed(p.pace, p.physical) * 0.5;
  keepInsideField(p);
}

// An AI player in possession: dribble at the goal, pass under pressure, shoot
// once in range.
function aiCarry(p) {
  const goalX = p.team === "blue" ? field.x + field.width : field.x;
  const dx = goalX - p.x;
  const dy = PITCH_CY - p.y;
  const dist = Math.hypot(dx, dy) || 1;

  const inRange = dist < AI_SHOOT_RANGE && Math.abs(PITCH_CY - p.y) < 560;
  if (inRange && netRand() < AI_SHOOT_CHANCE) { aiKick(p); return; }
  if (!inRange && nearestOpponentDistance(p) < AI_PASS_PRESSURE && netRand() < AI_PASS_CHANCE) {
    if (bestPassTarget(p)) { aiPass(p); return; }
  }
  const ux = dx / dist, uy = dy / dist;
  const spd = computeSpeed(p.pace, p.physical) * 1.0;
  p.x += ux * spd;
  p.y += uy * spd;
  p.facingX = Math.sign(ux) || attackDirOf(p);
  p.facingY = uy;
  p.walk = (p.walk || 0) + spd * 0.4;
  keepInsideField(p);
}

// A goalkeeper holds its line, edges out for a loose ball, and distributes
// when it has the ball.
function aiKeeper(gk) {
  if (ballCarrier === gk) {
    gk._hold = (gk._hold || 0) + 1;
    if (gk._hold > AI_KEEPER_HOLD) {
      gk._hold = 0;
      if (netRand() < 0.5) gkPassToTeammate(gk, gk.team === "blue");
      else gkClearBall(gk, gk.team === "blue");
    }
    return;
  }
  gk._hold = 0;
  const gx = keeperHomeX(gk.team);
  const ty = clamp(ball.y, PITCH_CY - 110, PITCH_CY + 110);
  let tx = gx;
  if (!ballCarrier && Math.abs(ball.x - gx) < 150) tx = gx + (gk.team === "blue" ? 40 : -40);
  moveToward(gk, tx, ty, computeSpeed(gk.pace, gk.physical) * 0.9);
}

function nearestOpponentDistance(p) {
  const foes = (p.team === "blue" ? opponents : teammates);
  let best = Infinity;
  for (const q of foes) {
    if (q.sentOff) continue;
    const d = distance(q, p);
    if (d < best) best = d;
  }
  return best;
}

// A pressing defender lunges in: usually nothing, sometimes a clean tackle,
// occasionally a foul that hands the other side a set piece.
function aiAttemptTackle(p) {
  const c = ballCarrier;
  if (!c || c.team === p.team) return;
  if (distance(p, c) > 34) return;
  p.tackleAnim = 12;
  if (netRand() < AI_TACKLE_CHANCE) { ballCarrier = null; setBallToucher(p); return; }
  if (netRand() < AI_FOUL_CHANCE) applyFoulCard(p, "yellow", c);
}

function moveTeammates() {
  for (const p of teammates) {
    if (p.human || p === player) continue;
    if (p.sentOff) continue;
    aiMovePlayer(p, 1);
    if (p.kickAnim > 0) p.kickAnim--;
    if (p.indicatorFrames > 0) p.indicatorFrames--;
  }
}

function moveOpponents() {
  for (const p of opponents) {
    if (p.sentOff) continue;
    aiMovePlayer(p, -1);
    if (p.kickAnim > 0) p.kickAnim--;
  }
}

function moveReferee() {
  const ref = allPlayers.find((p) => p.role === "referee");
  if (!ref) return;
  const t = (typeof netSimClock === "function" ? netSimClock() : Date.now()) * 0.0004;
  const tx = PITCH_CX + Math.cos(t) * 400;
  const ty = PITCH_CY + Math.sin(t * 1.3) * 220;
  moveToward(ref, tx, ty, 2.2);
}

/* ------------------------------------------------------------------ *
 * 9. Actions: shoot / pass / tackle / skill
 * ------------------------------------------------------------------ */

function startChargingShot() {
  if (practiceDrill) {
    if (!player) return;
    player.charging = true;
    player.chargeFrames = 0;
    shotHeld = true;
    return;
  }
  shotHeld = true;
  PSMatch.setBtn("shoot", true);
  PSMatch.press("shoot");
}

function updateShotCharge() {
  if (practiceDrill) {
    if (!player) return;
    if (player.charging && player.chargeFrames < MAX_CHARGE_FRAMES) player.chargeFrames++;
  }
  /* Pixel Striker charges the shot internally during real matches */
}

function releaseShot() {
  if (practiceDrill) {
    if (!player) return;
    const p = player;
    if (!p.charging || ballCarrier !== p) { p.charging = false; shotHeld = false; return; }
    const frac = clamp((p.chargeFrames || 0) / MAX_CHARGE_FRAMES, 0, 1);
    const mult = MIN_CHARGE_MULTIPLIER + (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * frac;
    const aim = sticksAim(p);
    strikeBall(p, aim.x, aim.y, mult);
    p.charging = false;
    p.chargeFrames = 0;
    shotHeld = false;
    return;
  }
  PSMatch.setBtn("shoot", false);
  shotHeld = false;
}

function strikeBall(p, ax, ay, power) {
  const spd = 16 * power;
  ball.vx = ax * spd;
  ball.vy = ay * spd;
  const loft = leftTriggerHeld() ? 3.2 : 0.8;
  ball.z = Math.max(ball.z || 0, 4);
  ball.vz = loft;
  ballCarrier = null;
  setBallToucher(p);
  ball.immune = KICK_IMMUNITY;
  p.kickAnim = 14;
}

function passBall() {
  if (practiceDrill) {
    const p = ballCarrier || player;
    if (!p || ballCarrier !== p) { requestBall(); return; }
    const mate = bestPassTarget(p);
    if (!mate) { const a = sticksAim(p); strikeBall(p, a.x, a.y, 1.0); return; }
    const dx = mate.x - p.x, dy = mate.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const spd = clamp(d * 0.05 + 6, 6, 20);
    ball.vx = (dx / d) * spd;
    ball.vy = (dy / d) * spd;
    const lob = passModifierKey();
    ball.z = lob ? 6 : 0;
    ball.vz = lob ? 3 : 0;
    ballCarrier = null;
    setBallToucher(p);
    ball.immune = KICK_IMMUNITY;
    p.kickAnim = 12;
    mate.indicatorFrames = 40;
    mate.indicatorText = "!";
    return;
  }
  // The LOB touch button sets vInput.ptLob just before calling passBall().
  if (typeof vInput !== "undefined" && vInput.ptLob) PSMatch.press("lob");
  else PSMatch.press("pass");
}

function bestPassTarget(p) {
  const list = (p.team === "blue" ? teammates : opponents).filter((q) => q && q !== p && !q.sentOff && q.role !== "goalkeeper");
  const dir = attackDirOf(p);
  let best = null, bestScore = -Infinity;
  for (const q of list) {
    const ahead = (q.x - p.x) * dir;
    const lateral = Math.abs(q.y - p.y);
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < 1) continue;
    const score = ahead * 1.2 - lateral * 0.4 - d * 0.05;
    if (score > bestScore) { bestScore = score; best = q; }
  }
  return best;
}

function requestBall() {
  if (practiceDrill) {
    if (!player) return;
    player.indicatorFrames = 40;
    player.indicatorText = "!";
    if (ballCarrier && ballCarrier.team === player.team && !ballCarrier.human) {
      const p = ballCarrier;
      const dx = player.x - p.x, dy = player.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      ball.vx = (dx / d) * 12;
      ball.vy = (dy / d) * 12;
      ballCarrier = null;
      setBallToucher(p);
      ball.immune = KICK_IMMUNITY;
    }
    return;
  }
  // In Pixel Striker this is the player-switch button.
  PSMatch.press("lob");
}

function tryTackle() {
  if (practiceDrill) {
    const p = player;
    if (!p || tackleBlockedThisFrame) return;
    tackleBlockedThisFrame = true;
    p.tackleAnim = 12;
    const opp = opponents.find(function (q) { return !q.sentOff && distance(q, p) < 70; });
    if (!opp) return;
    const hasBall = ballCarrier === opp;
    if (hasBall && netRand() < 0.55) {
      ballCarrier = null;
      setBallToucher(p);
      p.x = opp.x - attackDirOf(opp) * (p.radius + 6);
      p.y = opp.y;
    } else if (netRand() < 0.35) {
      applyFoulCard(opp, "yellow", p);
    }
    return;
  }
  // Contextual "pass / defending: tackle" - Pixel Striker resolves which.
  PSMatch.press("pass");
}

function dribbleTouch() {
  if (practiceDrill) {
    const p = ballCarrier || player;
    if (!p || ballCarrier !== p) return;
    const a = sticksAim(p);
    ball.vx = a.x * 14;
    ball.vy = a.y * 14;
    ballCarrier = null;
    setBallToucher(p);
    ball.immune = KICK_IMMUNITY;
    return;
  }
  // Pixel Striker skill burst.
  PSMatch.press("skill");
}

function applyFoulCard(offender, card, victim) {
  if (!offender) return;
  offender.cards = (offender.cards || 0) + 1;
  cardFlash = { color: offender.cards >= 2 ? "#e63946" : "#ffd700", text: offender.cards >= 2 ? "RED CARD" : "YELLOW CARD", name: offender.name || "", frames: 90 };
  if (offender.cards >= 2) sendOffPlayer(offender);

  const spotX = clamp(ball.x, field.x + 20, field.x + field.width - 20);
  const spotY = clamp(ball.y, field.y + 20, field.y + field.height - 20);
  if (inPenaltyBox(spotX, spotY)) {
    beginMatchPenalty(victim ? victim.team : (offender.team === "blue" ? "red" : "blue"), spotX, spotY);
  } else {
    startFreekick(victim ? victim.team : (offender.team === "blue" ? "red" : "blue"), spotX, spotY, offender, { kind: "freeKick" });
  }
}

function aiKick(p) {
  const goalX = p.team === "blue" ? field.x + field.width : field.x;
  // Aim for the corners of the goal so the shot can beat the keeper.
  const aimY = PITCH_CY + (netRand() - 0.5) * (goalHeight * 0.9);
  const dx = goalX - p.x, dy = aimY - p.y;
  const d = Math.hypot(dx, dy) || 1;
  strikeBall(p, dx / d, dy / d, 1.3);
}

function aiPass(p) {
  const mate = bestPassTarget(p);
  if (!mate) { aiKick(p); return; }
  const dx = mate.x - p.x, dy = mate.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  ball.vx = (dx / d) * 12;
  ball.vy = (dy / d) * 12;
  ballCarrier = null;
  setBallToucher(p);
  ball.immune = KICK_IMMUNITY;
}

function aiTackleTeam(teamList, foes, intensityMul) {
  for (const p of teamList) {
    if (p.sentOff || p.human) continue;
    const target = foes.find((q) => !q.sentOff && ballCarrier === q && distance(q, p) < 40);
    if (target && netRand() < 0.02 * (intensityMul || 1)) {
      ballCarrier = null;
      setBallToucher(p);
    }
  }
}

// Keepers: clear long when under pressure.
function myClubCreditKeeperStop(gk, save, force) { /* stats hook - no-op in arcade */ }

function gkClearBall(gk, isBlue) {
  const dir = isBlue ? 1 : -1;
  ball.vx = dir * 14;
  ball.vy = (netRand() - 0.5) * 8;
  ball.z = 6; ball.vz = 3;
  ballCarrier = null;
  setBallToucher(gk);
  ball.immune = KICK_IMMUNITY;
}

function gkHoldTimeToPass(gk) { return 60; }
function gkPassToTeammate(gk, isBlue) {
  const mates = (isBlue ? teammates : opponents).filter((q) => !q.sentOff && q.role !== "goalkeeper");
  const mate = mates.length ? mates[Math.floor(netRand() * mates.length)] : null;
  if (!mate) { gkClearBall(gk, isBlue); return; }
  const dx = mate.x - gk.x, dy = mate.y - gk.y;
  const d = Math.hypot(dx, dy) || 1;
  ball.vx = (dx / d) * 13;
  ball.vy = (dy / d) * 13;
  ballCarrier = null;
  setBallToucher(gk);
  ball.immune = KICK_IMMUNITY;
}

/* ------------------------------------------------------------------ *
 * 10. Set pieces: free kicks + penalties
 * ------------------------------------------------------------------ */

function startFreekick(team, spotX, spotY, offender, card, opts) {
  opts = opts || {};
  const teamList = team === "blue" ? teammates : opponents;
  const taker = nearestToBallOf(teamList.filter((q) => !q.sentOff && q.role !== "goalkeeper"));
  freekick = {
    team: team, x: spotX, y: spotY, taker: taker || null,
    wait: opts.wait != null ? opts.wait : FREEKICK_WAIT_FRAMES,
    kind: opts.kind || "freeKick",
  };
  ball.x = spotX; ball.y = spotY; ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0;
  ball.immune = 0;
  ballCarrier = null;
  if (taker) { taker.x = spotX - (team === "blue" ? 26 : -26); taker.y = spotY; taker.charging = false; }
  // Wall: opponents back off.
  const foes = team === "blue" ? opponents : teammates;
  for (const q of foes) { if (!q.sentOff && q.role !== "goalkeeper") { q.y += (q.y < spotY ? -30 : 30); } }
}

function endFreekick() {
  freekick = null;
  clearOffside();
}

function stepFreekick() {
  const fk = freekick;
  if (!fk) return;
  if (fk.wait > 0) { fk.wait--; if (fk.taker) moveToward(fk.taker, ball.x - attackDirOf(fk.taker) * 24, ball.y, 4); return; }

  const taker = fk.taker;
  if (!taker || taker.sentOff) { endFreekick(); return; }

  // The taker strikes: shoot if close to goal, otherwise pass/cross forward.
  const goalX = fk.team === "blue" ? field.x + field.width : field.x;
  const dist = Math.abs(goalX - fk.x);
  if (dist < 620) {
    const dx = goalX - taker.x, dy = PITCH_CY - taker.y;
    const d = Math.hypot(dx, dy) || 1;
    ball.vx = (dx / d) * 18; ball.vy = (dy / d) * 18; ball.z = 8; ball.vz = 3;
    ball.x = taker.x; ball.y = taker.y;
    ballCarrier = null; setBallToucher(taker); ball.immune = KICK_IMMUNITY; taker.kickAnim = 14;
  } else {
    ball.x = taker.x; ball.y = taker.y;
    aiPass(taker);
  }
  endFreekick();
}

function beginMatchPenalty(team, spotX, spotY) {
  const kx = team === "blue" ? field.x + field.width : field.x;
  const teamList = team === "blue" ? teammates : opponents;
  const taker = nearestToBallOf(teamList.filter((q) => !q.sentOff && q.role !== "goalkeeper")) || player;
  const foes = team === "blue" ? opponents : teammates;
  const keeper = foes.find((q) => q.role === "goalkeeper" && !q.sentOff) || null;
  matchPenalty = {
    team: team, taker: taker, keeper: keeper,
    spotX: team === "blue" ? field.x + field.width - PENALTY_SPOT_IN : field.x + PENALTY_SPOT_IN,
    spotY: PITCH_CY, phase: "wait", wait: MATCH_PENALTY_WAIT_FRAMES,
  };
  ball.x = matchPenalty.spotX; ball.y = matchPenalty.spotY;
  ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0; ballCarrier = null;
  if (taker) { taker.x = matchPenalty.spotX - attackDirOf(taker) * 40; taker.y = PITCH_CY; }
  if (keeper) { keeper.x = keeperHomeX(team === "blue" ? "red" : "blue"); keeper.y = PITCH_CY; }
  const dir = team === "blue" ? 1 : -1, lineX = matchPenalty.spotX - dir * 70;
  let row = 0;
  for (const q of teamList.concat(foes)) {
    if (q === taker || q === keeper || q.sentOff) continue;
    q.x = lineX;
    q.y = PITCH_CY + ((row % 11) - 5) * 26;
    row++;
  }
}

function stepMatchPenalty() {
  const mp = matchPenalty;
  if (!mp) return;
  if (mp.wait > 0) { mp.wait--; return; }
  const taker = mp.taker;
  if (!taker || taker.sentOff) { matchPenalty = null; return; }
  const goalX = mp.team === "blue" ? field.x + field.width : field.x;
  const corner = PITCH_CY + (netRand() < 0.5 ? -1 : 1) * (goalHeight / 2 - 40);
  const dx = goalX - taker.x, dy = corner - taker.y;
  const d = Math.hypot(dx, dy) || 1;
  ball.x = taker.x; ball.y = taker.y;
  ball.vx = (dx / d) * 22; ball.vy = (dy / d) * 22; ball.z = 4; ball.vz = 2;
  ballCarrier = null; setBallToucher(taker); ball.immune = KICK_IMMUNITY; taker.kickAnim = 14;
  if (mp.keeper) mp.keeper.diveDir = netRand() < 0.5 ? -1 : 1;
  matchPenalty = null;
}

function resolveMatchPenalty(scored) { matchPenalty = null; }

/* ------------------------------------------------------------------ *
 * 11. Practice drill
 * ------------------------------------------------------------------ */

function practiceStageRep() {
  if (!practiceDrill) return;
  const d = practiceDrill;
  d.phase = "rep";
  d.wait = 0;
  d.flight = 0;
  const blueSide = "blue";
  const goalX = field.x + field.width;
  const redGK = opponents[opponents.length - 1];

  if (d.kind === "freekick") {
    const spotX = goalX - 520;
    const spotY = PITCH_CY + (netRand() < 0.5 ? -120 : 120);
    ball.x = spotX; ball.y = spotY;
    if (player) { player.x = spotX - 30; player.y = spotY; player.charging = false; }
  } else if (d.kind === "corner") {
    ball.x = goalX - 20; ball.y = field.y + 20;
    if (player) { player.x = goalX - 60; player.y = field.y + 60; }
  } else if (d.kind === "penalty") {
    ball.x = goalX - PENALTY_SPOT_IN; ball.y = PITCH_CY;
    if (player) { player.x = goalX - PENALTY_SPOT_IN - 40; player.y = PITCH_CY; }
  } else {
    ball.x = PITCH_CX; ball.y = PITCH_CY;
  }
  ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0; ballCarrier = null;
  if (redGK && redGK.role === "goalkeeper") { redGK.x = keeperHomeX("red"); redGK.y = PITCH_CY; }
  clearOffside();
}

function stepPracticeDrill() {
  const d = practiceDrill;
  if (!d) return;
  if (d.phase === "cooldown") {
    if (d.wait > 0) { d.wait--; return; }
    practiceStageRep();
    return;
  }
  // Live rep: if the ball has gone dead/out, cool down and stage again.
  const out = ball.x < field.x || ball.x > field.x + field.width + 200 || ball.y < field.y - 200 || ball.y > field.y + field.height + 200;
  if (out) { d.phase = "cooldown"; d.wait = PRACTICE_COOLDOWN; d.reps++; }
}

function practiceEndDrill() {
  practiceDrill = null;
  practiceKind = null;
  try { PSMatch.clearDrill(); } catch (e) { }
}

function updateDrillHud() {
  // Drill progress is drawn on the arcade HUD canvas now, so the old DOM
  // panel must stay hidden. Left visible it renders as an empty pill (its
  // CSS default is display:flex) that floats over the match clock.
  const hud = document.getElementById("drillHud");
  if (hud && hud.style.display !== "none") hud.style.display = "none";
}

function updateSetPieceTuner() { /* set-piece aim tuner is not used in arcade */ }
function pieceTunerActive() { return false; }
function drawSetPieceTuner() { }

/* ------------------------------------------------------------------ *
 * 12. Celebration + invasion
 * ------------------------------------------------------------------ */

function startCelebration() {
  if (goalPhase !== "celebrate" && goalPhase !== "replay") goalPhase = "celebrate";
  for (const p of allPlayers) {
    if (p.team === celebrateTeam && !p.sentOff) { p.celebrate = celebrateFrames > 0 ? celebrateFrames : CELEBRATE_FRAMES_TOTAL; p.celebratePhase = netRand() * 6; }
  }
  if (typeof celebrateFrames === "number" && celebrateFrames <= 0) celebrateFrames = CELEBRATE_FRAMES_TOTAL;
}

function stepCelebration() {
  if (celebrateFrames > 0) celebrateFrames--;
  for (const p of allPlayers) {
    if (p.celebrate > 0) { p.celebrate--; p.celebratePhase += 0.15; }
  }
  if (celebrateFrames <= 0) {
    goalPhase = "";
    for (const p of allPlayers) p.celebrate = 0;
    postGoalPause = 90;
    countdownSeconds = 3;
    resetPositions();
  }
}

function isInFinal() { return tournament && tournament.stage === "final"; }

function createInvasion(kind, cx, cy) {
  const crowd = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    crowd.push({
      x: cx + (netRand() - 0.5) * 500,
      y: cy + (netRand() - 0.5) * 420,
      tx: PITCH_CX + (netRand() - 0.5) * 1100,
      ty: PITCH_CY + (netRand() - 0.5) * 700,
      color: INVADE_COLORS[i % INVADE_COLORS.length],
      speed: 1.5 + netRand() * 2,
    });
  }
  invasion = { frames: INVADE_STAY_FRAMES, crowd: crowd, kind: kind || "score", leaving: false };
}

function stepInvasion() {
  if (!invasion) return;
  invasion.frames--;
  for (const m of invasion.crowd) {
    const tx = invasion.leaving ? ball.x : m.tx;
    const ty = invasion.leaving ? ball.y : m.ty;
    moveToward(m, tx, ty, m.speed);
  }
  if (invasion.frames <= 0) invasion = null;
  if (cardFlash && cardFlash.frames > 0) cardFlash.frames--;
}

function drawInvasion() {
  if (!invasion) return;
  for (const m of invasion.crowd) drawInvader(m);
}

/* ------------------------------------------------------------------ *
 * 13. Snapshots (used by the engine's goal replay)
 * ------------------------------------------------------------------ */

function takeSnapshot() {
  return {
    players: allPlayers.map(function (p) { return { x: p.x, y: p.y, facingX: p.facingX, facingY: p.facingY }; }),
    ball: { x: ball.x, y: ball.y, z: ball.z || 0, vx: ball.vx || 0, vy: ball.vy || 0, vz: ball.vz || 0 },
  };
}

function applySnapshot(snap) {
  if (!snap) return;
  for (let i = 0; i < allPlayers.length && i < snap.players.length; i++) {
    const p = allPlayers[i], s = snap.players[i];
    p.x = s.x; p.y = s.y; p.facingX = s.facingX; p.facingY = s.facingY;
  }
  ball.x = snap.ball.x; ball.y = snap.ball.y; ball.z = snap.ball.z;
  ball.vx = snap.ball.vx; ball.vy = snap.ball.vy; ball.vz = snap.ball.vz;
  ballCarrier = null;
}

function recordSnapshot() {
  replayBuffer.push(takeSnapshot());
  const max = (typeof REPLAY_WINDOW === "number") ? REPLAY_WINDOW : 150;
  if (replayBuffer.length > max) replayBuffer.shift();
}

/* ------------------------------------------------------------------ *
 * 14. Reset / kickoff positions
 * ------------------------------------------------------------------ */

function resetPositions() {
  // Keep the engine's ball sane so the carried penalty-shootout slice still
  // has something to work with, then hand the whole match over to Pixel
  // Striker: it builds the teams, kits, kickoff and formations itself.
  ballCarrier = null;
  ball.x = PITCH_CX; ball.y = PITCH_CY;
  ball.vx = 0; ball.vy = 0; ball.z = 0; ball.vz = 0;
  ball.immune = 0;
  ball.lastToucher = null;
  if (player) { player.charging = false; player.chargeFrames = 0; }
  clearOffside();
  try { PSMatch.prepare(__psConfig()); } catch (e) { }
  if (practiceKind) { try { PSMatch.setDrill(practiceKind); } catch (e) { } }
}

/* ------------------------------------------------------------------ *
 * 15. The frame loop
 * ------------------------------------------------------------------ */

let __psAcc = 0, __psLast = 0;

function gameLoop() {
  pollAlternativeInput();
  updateSetPieceTuner();
  updateDrillHud();

  // Arcade presentation: fixed top-down camera, crisp integer pixel upscale.
  cam2d = true;
  if (typeof pixelCanvasPresent === "function") pixelCanvasPresent();
  applyPixelArtChrome(true);

  // Pre-match kickoff countdown.
  if (kickoffIntro > 0) {
    const gsEl = document.getElementById("gameScreen");
    const pitchVisible = !gsEl || gsEl.style.display !== "none";
    if (pitchVisible) {
      kickoffIntro--;
      if (kickoffIntro <= 0) { beginMatch(); __psNeutralizeTimer(); }
    }
  }

  // Training drills keep the original engine simulation + rendering.
  if (practiceDrill) {
    if (matchRunning) { netPumpInput(); netRunFixedSteps(); }
    stepInvasion();
    stepPracticeDrill();
    if (cardFlash && cardFlash.frames > 0) cardFlash.frames--;
    updateCamera();
    updateCutscenes(1 / 60);
    updateWalkout();
    drawField2D();
    const dr = allPlayers.filter(function (p) { return p && !p.sentOff; });
    dr.sort(function (a, b) { return a.y - b.y; });
    for (const p of dr) drawPlayer(p);
    drawBall();
    drawInvasion();
    ctx.globalAlpha = 1;
    drawGoal(field.x);
    drawGoal(field.x + field.width);
    drawAimCursor();
    drawWalkoutCards();
    drawCountdown();
    if (typeof drawArcadeHUD === "function") drawArcadeHUD();
    drawCardFlash();
    drawCutscene();
    tackleBlockedThisFrame = false;
    requestAnimationFrame(gameLoop);
    return;
  }

  // Bridge the game's keyboard + virtual joystick into Pixel Striker.
  const dir = currentStickDir();
  PSMatch.setStick(dir.x, dir.y);
  PSMatch.setBtn("sprint", !!(keys["shift"] || vInput.sprint));

  // Advance the Pixel Striker sim at a fixed 1/60 s step.
  const now = performance.now();
  if (!__psLast) __psLast = now;
  let dt = (now - __psLast) / 1000; __psLast = now;
  if (dt > 0.1) dt = 0.1;
  if (matchRunning && PSMatch.info().state !== "title") {
    __psAcc += dt;
    const STEP = 1 / 60; let steps = 0;
    // Fixed step. Button edges set by input events are consumed by the first
    // update of the frame and cleared afterwards; if no step runs this frame
    // the edges are kept so a quick tap is never dropped.
    while (__psAcc >= STEP && steps < 5) { PSMatch.update(STEP); PSMatch.clearEdges(); __psAcc -= STEP; steps++; }
  } else {
    __psAcc = 0;
  }

  // Broadcast commentary: scripted during the Crowd Cam cutscenes, event-driven
  // during play. The captions are drawn as a TV-style lower-third.
  if (window.commentary) {
    let cmPhase = "other", cmEl = 0, cmInfo = null;
    if (matchRunning && !PSMatch.drillInfo()) {
      cmInfo = PSMatch.info();
      if (kickoffIntro > 0) {
        // Pre-match captions belong to the Crowd Cam countdown, so hold them
        // until the Walkout cinematic has finished.
        const cmPre = (KICKOFF_INTRO_WAIT - kickoffIntro) / 60 - (typeof WALKOUT_INTRO_WAIT === 'number' ? WALKOUT_INTRO_WAIT : 0) / 60;
        if (cmPre >= 0) { cmPhase = "pre"; cmEl = cmPre; }
      }
      else if (cmInfo.state === "break") { cmPhase = "break"; cmEl = cmInfo.crowdT; }
      else if (cmInfo.state === "winner") cmPhase = "winner";
      else if (cmInfo.state === "play" || cmInfo.state === "goal" || cmInfo.state === "restart") cmPhase = "play";
      else if (cmInfo.state === "fulltime") cmPhase = "fulltime";
    }
    window.commentary.tick(dt, {
      phase: cmPhase, elapsed: cmEl,
      home: cmInfo ? cmInfo.teamNames[0] : null, away: cmInfo ? cmInfo.teamNames[1] : null,
      score: cmInfo ? cmInfo.score : null, info: cmInfo
    });
  }

  stepInvasion();

  if (matchPhase === "penalties") {
    if (typeof stepPenalty === "function" && typeof penaltyShot !== "undefined" && penaltyShot && !penaltyShot.done) stepPenalty();
  } else if (practiceDrill) {
    stepPracticeDrill();
  }

  if (cardFlash && cardFlash.frames > 0) cardFlash.frames--;

  // ---- draw: blit the 480x270 Pixel Striker canvas across the pitch ----
  if (typeof ctx.setTransform === "function" && typeof RENDER_SCALE === "number") {
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if ("imageSmoothingEnabled" in ctx) ctx.imageSmoothingEnabled = false;
  PSMatch.draw();
  if (window.commentary) { try { window.commentary.draw(PSMatch.canvas.getContext("2d"), PSMatch.canvas.width, PSMatch.canvas.height); } catch (e) { } }
  try { ctx.drawImage(PSMatch.canvas, 0, 0, W, H); } catch (e) { }

  tackleBlockedThisFrame = false;
  requestAnimationFrame(gameLoop);
}

/* ======================================================================
 * CARRIED OVER SYSTEMS (verbatim from the previous match.js)
 *   1. Procedural headshots        (legacy 316-489)
 *   2. Roster / injuries / bans    (legacy 5382-6124)
 *   3. Coins / sponsors            (legacy 6527-6754)
 *   4. Penalty shootout            (legacy 6756-7048)
 *   5. Market + My Club tables     (legacy 7050-7549)
 * ====================================================================== */

/* ---- 1. Procedural headshots ---- */
// A face is derived from a hash of the player's name, so the same player
// always gets the same face on every machine and in every session, and the
// game still ships without a single image asset. The generator runs on its own
// local PRNG: it must never touch netRand or the match would desync.
const HEAD_SKIN_SET = ["#f7d9bd", "#eec59d", "#dda672", "#c08050", "#9c6438", "#744a28", "#5a3a22"];
const HEAD_HAIR = ["#14100d", "#241a13", "#3d2415", "#6b3f1e", "#a86a2c", "#d4a017", "#8d8d8d", "#dcdcdc"];
const HEAD_EYES = ["#3a2a1c", "#5c3a1c", "#2c4a5c", "#37573a", "#4a4a58"];
function headshotSeed(key) {
  let h = 0x811c9dc5;
  const s = String(key === undefined || key === null ? "" : key);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function headRndFactory(seed) {
  let x = (seed >>> 0) || 0x2545f491;
  return function () {
    x ^= x << 13; x |= 0;
    x ^= x >>> 17;
    x ^= x << 5; x |= 0;
    return (x >>> 0) / 4294967296;
  };
}
// Paints a head into any 2D context. `team` only tints the backdrop/shirt.
function paintHeadshot(g, seed, size, team) {
  if (!g || !size) return;
  const r = headRndFactory(seed);
  const pick = (arr) => arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
  const skin = pick(HEAD_SKIN_SET);
  const hair = pick(HEAD_HAIR);
  const eye = pick(HEAD_EYES);
  const shirt = team === "red" ? "#c8323c" : team === "blue" ? "#1f6fd0" : "#3c4658";
  const style = Math.floor(r() * 6);          // 0 buzz 1 short 2 curly 3 bald 4 long 5 afro
  const beard = r() < 0.42 ? Math.floor(r() * 3) : -1;  // 0 stubble 1 moustache 2 full
  const browLift = (r() - 0.5) * 0.5;
  const eyeGap = 0.3 + r() * 0.08;
  const noseW = 0.1 + r() * 0.06;
  const smile = r() < 0.5 ? 0 : (r() - 0.5) * 0.8;
  const S = size;
  const el = (x, y, rx, ry, fill) => {
    g.beginPath();
    g.ellipse(x * S, y * S, rx * S, ry * S, 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
  };
  g.clearRect(0, 0, S, S);
  // Backdrop: a soft vertical wash in the club colour.
  const bg = g.createLinearGradient(0, 0, 0, S);
  bg.addColorStop(0, team === "red" ? "#3a1620" : team === "blue" ? "#12294a" : "#1b2130");
  bg.addColorStop(1, team === "red" ? "#1c0c12" : team === "blue" ? "#0a1730" : "#11151f");
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);
  // Shoulders / shirt.
  g.fillStyle = shirt;
  g.beginPath();
  g.ellipse(0.5 * S, 1.16 * S, 0.46 * S, 0.34 * S, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.14)";
  g.beginPath();
  g.ellipse(0.5 * S, 1.1 * S, 0.2 * S, 0.2 * S, 0, 0, Math.PI * 2);
  g.fill();
  // Neck.
  g.fillStyle = skin;
  g.fillRect(0.42 * S, 0.66 * S, 0.16 * S, 0.2 * S);
  g.fillStyle = "rgba(0,0,0,0.16)";
  g.fillRect(0.42 * S, 0.66 * S, 0.16 * S, 0.05 * S);
  // Ears.
  el(0.28 * S, 0.5 * S, 0.05 * S, 0.075 * S, skin);
  el(0.72 * S, 0.5 * S, 0.05 * S, 0.075 * S, skin);
  // Hair that falls BEHIND the head goes down first, so it never covers a face
  // and never has to be punched back out of the backdrop.
  if (style === 4) {
    g.fillStyle = hair;
    g.beginPath();
    g.ellipse(0.5 * S, 0.52 * S, 0.26 * S, 0.32 * S, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Head.
  el(0.5 * S, 0.45 * S, 0.21 * S, 0.26 * S, skin);
  // Cheek shading for a bit of depth.
  g.fillStyle = "rgba(0,0,0,0.07)";
  el(0.62 * S, 0.56 * S, 0.11 * S, 0.14 * S, "rgba(0,0,0,0.07)");
  // Hair, in front.
  g.fillStyle = hair;
  if (style === 3) {
    // Bald: just a shadow at the temples.
    g.fillStyle = "rgba(0,0,0,0.1)";
    el(0.5 * S, 0.3 * S, 0.19 * S, 0.1 * S, "rgba(0,0,0,0.1)");
  } else if (style === 5) {
    el(0.5 * S, 0.26 * S, 0.27 * S, 0.15 * S, hair);
  } else {
    g.beginPath();
    g.ellipse(0.5 * S, 0.36 * S, 0.225 * S, 0.2 * S, 0, Math.PI, Math.PI * 2);
    g.fill();
    if (style === 2) {          // curly: a scalloped edge
      for (let i = 0; i < 7; i++) {
        el((0.3 + i * 0.066) * S, (0.29 + (i % 2) * 0.03) * S, 0.05 * S, 0.05 * S, hair);
      }
    }
    if (style === 4) {          // long: a fringe over the forehead
      g.fillRect(0.28 * S, 0.34 * S, 0.44 * S, 0.04 * S);
    }
  }
  // Brows.
  g.strokeStyle = hair;
  g.lineWidth = Math.max(1, 0.022 * S);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo((0.5 - eyeGap - 0.08) * S, (0.4 + browLift * 0.02) * S);
  g.lineTo((0.5 - eyeGap + 0.06) * S, (0.385 + browLift * 0.02) * S);
  g.moveTo((0.5 + eyeGap - 0.06) * S, (0.385 + browLift * 0.02) * S);
  g.lineTo((0.5 + eyeGap + 0.08) * S, (0.4 + browLift * 0.02) * S);
  g.stroke();
  // Eyes.
  for (const s of [-1, 1]) {
    el((0.5 + s * eyeGap) * S, 0.44 * S, 0.055 * S, 0.038 * S, "#f6f6f4");
    el((0.5 + s * eyeGap) * S, 0.442 * S, 0.028 * S, 0.028 * S, eye);
    g.fillStyle = "#101014";
    el((0.5 + s * eyeGap) * S, 0.442 * S, 0.011 * S, 0.011 * S, "#101014");
  }
  // Nose.
  g.strokeStyle = "rgba(0,0,0,0.3)";
  g.lineWidth = Math.max(1, 0.016 * S);
  g.beginPath();
  g.moveTo(0.5 * S, 0.44 * S);
  g.lineTo((0.5 + noseW * 0.5) * S, 0.52 * S);
  g.stroke();
  // Mouth.
  g.strokeStyle = "#7a3b34";
  g.lineWidth = Math.max(1, 0.02 * S);
  g.beginPath();
  g.moveTo((0.5 - 0.07) * S, (0.575 + smile * 0.012) * S);
  g.quadraticCurveTo(0.5 * S, (0.6 + smile * 0.03) * S, (0.5 + 0.07) * S, (0.575 + smile * 0.012) * S);
  g.stroke();
  // Facial hair.
  if (beard >= 0) {
    g.fillStyle = hair;
    g.globalAlpha = beard === 0 ? 0.28 : 0.85;
    if (beard === 1) g.fillRect(0.44 * S, 0.545 * S, 0.12 * S, 0.03 * S);
    else {
      g.beginPath();
      g.ellipse(0.5 * S, 0.66 * S, 0.16 * S, 0.1 * S, 0, 0, Math.PI);
      g.fill();
      g.fillRect(0.44 * S, 0.545 * S, 0.12 * S, 0.03 * S);
    }
    g.globalAlpha = 1;
  }
  // Frame.
  g.strokeStyle = "rgba(255,255,255,0.16)";
  g.lineWidth = Math.max(1, 0.02 * S);
  g.strokeRect(0.01 * S, 0.01 * S, 0.98 * S, 0.98 * S);
}
// The seed for a live player, stable within and across matches.
function headshotKeyFor(p) {
  if (!p) return "";
  const n = displayNameFor(p) || p.name || "";
  return (p.team || "") + ":" + n + ":" + (p.number === undefined ? "" : p.number);
}
function headshotCanvasHtml(key, size, team) {
  const px = size || 34;
  return '<canvas class="headshotCanvas" data-headshot="' + escapeHtml(String(key)) +
    '" data-team="' + escapeHtml(String(team || "")) + '" width="' + px + '" height="' + px + '"></canvas>';
}
function paintHeadshots() {
  const list = document.querySelectorAll("canvas[data-headshot]");
  for (let i = 0; i < list.length; i++) {
    const cv = list[i];
    try {
      paintHeadshot(cv.getContext("2d"), headshotSeed(cv.getAttribute("data-headshot")),
        cv.width, cv.getAttribute("data-team"));
    } catch (e) {}
  }
}

/* ---- 2. Roster / injuries / bans ---- */
// A red card: the player is OFF for the rest of the match. They are parked
// on the bench by their technical area, drawn no longer, and excluded from
// every phase of play. If the victim was a goalkeeper, the nearest active
// outfield teammate swaps into the goal so the side keeps a keeper.
function sendOffPlayer(p) {

  if (!p || p.sentOff) return;

  p.sentOff = true;

  p.cards = 2;

  const isBlue = p.team === "blue";

  // A red card is a two-game suspension: the rest of this match (sentOff
  // above) plus the entire next match. Flag the roster slot so the next
  // kickoff benches that player and a fit teammate can cover.
  if (isBlue && TEAM_ROSTERS[selectedTeam]) {

    const slotKey = slotKeyForPlayer(p);

    if (slotKey) {

      const rosterPlayer = getSlotData(TEAM_ROSTERS[selectedTeam], slotKey);

      if (rosterPlayer) {

        rosterPlayer.susp = 1;

        // My Club: persist the human-side ban on the card so a reloaded
        // career still benches them for the next match and the lineup UI
        // can mark them suspended.
        if (currentMode === "myclub" && myClubLeague && rosterPlayer.__cid) {

          const career = getMyClubCareer(myClubLeague);

          if (career) {

            if (!career.mySusp || typeof career.mySusp !== "object") career.mySusp = {};

            career.mySusp[rosterPlayer.__cid] = 1;

            saveMyClubData();

          }

        }

      }

    }

  }

  // The same two-game ban bites the AI side: a sent-off opponent is
  // benched for their club's next live match too. My Club persists the ban
  // against that club so a resumed career still enforces it.
  if (!isBlue) {

    const oppName = getOpponentTeam();

    const oppRoster = TEAM_ROSTERS[oppName];

    const slotKey = opponentSlotKeyForPlayer(p);

    if (oppRoster && slotKey) {

      const rp = getSlotData(oppRoster, slotKey);

      if (rp) {

        rp.susp = 1;

        if (currentMode === "myclub" && myClubLeague) {

          const career = getMyClubCareer(myClubLeague);

          if (career) {

            if (!career.reds || typeof career.reds !== "object") career.reds = {};

            if (!career.reds[oppName]) career.reds[oppName] = {};

            career.reds[oppName][slotKey] = 1;

            saveMyClubData();

          }

        }

      }

    }

  }

  p.x = isBlue ? field.x + 140 : field.x + field.width - 140;

  p.y = isBlue ? field.y + field.height + 40 : field.y - 40;

  p.facingX = isBlue ? 1 : -1;

  p.facingY = 0;

  p.stumble = 0;

  p.slideTackle = 0;

  p.tackleAnim = 0;

  p.kickAnim = 0;

  p.celebrate = 0;

  p.tackleCooldown = 0;

  p.cooldown = 0;

  if (ballCarrier === p) ballCarrier = null;

  if (ball.passTarget === p) ball.passTarget = null;

  if (p.holdsBall) {

    p.holdsBall = false;

    p.holdFrames = 0;

  }

  // A keeper sent off: promote the nearest active outfield player to goal.
  if (p.role === "goalkeeper") {

    const list = isBlue ? teammates : opponents;

    let repl = null;

    let rd = Infinity;

    for (const tm of list) {

      if (tm.sentOff || tm.role === "goalkeeper") continue;

      const d = Math.abs(tm.startX - keeperHomeX(isBlue ? "blue" : "red"));

      if (d < rd) { rd = d; repl = tm; }

    }

    if (repl) {

      repl.role = "goalkeeper";

      repl.radius = 16;

    }

  }

}

 

// Map a live blue player back to its roster slot key (the market's
// gk/d0-d3/m0-m2/a0-a1/a2 layout) so red-card suspensions can be applied
// to the persistent squad. Opponents and unknown teammates yield null.
function slotKeyForPlayer(p) {
  if (p === localPlayer) return "a" + ((currentMode === "myclub") ? (myClubFormation().na - 1) : 2);
  if (p.team !== "blue") return null;
  const idx = teammates.indexOf(p);
  if (idx < 0) return null;
  if (currentMode === "myclub") {
    const f = myClubFormation();
    if (idx < f.nd) return "d" + idx;
    if (idx < f.nd + f.nm) return "m" + (idx - f.nd);
    if (idx === 9) return "gk";
    return "a" + (idx - f.nd - f.nm);
  }
  if (idx <= 3) return "d" + idx;
  if (idx <= 6) return "m" + (idx - 4);
  if (idx === 7) return "a0";
  if (idx === 8) return "a1";
  if (idx === 9) return "gk";
  return null;
}

// Which live player fills each roster slot for the selected team.
function slotLivePlayer(key) {
  if (teammates.length < 10) return null;
  if (currentMode === "myclub") {
    const f = myClubFormation();
    if (key === "gk") return teammates[9];
    if (key[0] === "a") {
      const ai = parseInt(key.slice(1), 10);
      if (ai === f.na - 1) return player;
      return teammates[f.nd + f.nm + ai];
    }
    const mi = slotIndex(key);
    if (key[0] === "d") return teammates[mi];
    if (key[0] === "m") return teammates[f.nd + mi];
    return null;
  }
  if (key === "gk") return teammates[9];
  if (key === "a2") return player;
  if (key === "a0") return teammates[7];
  if (key === "a1") return teammates[8];
  const idx = slotIndex(key);
  if (key[0] === "d") return teammates[idx];
  if (key[0] === "m") return teammates[4 + idx];
  return null;
}

// Mirrors above for the red side: map a live opponent back to its club
// roster slot and back, so a red-card ban can bench the exact enemy
// stood in for a suspended roster spot.
function opponentSlotKeyForPlayer(p) {
  if (p.team !== "red") return null;
  const idx = opponents.indexOf(p);
  if (idx < 0) return null;
  if (idx <= 3) return "d" + idx;
  if (idx <= 6) return "m" + (idx - 4);
  if (idx === 7) return "a0";
  if (idx === 8) return "a1";
  if (idx === 9) return "a2";
  if (idx === 10) return "gk";
  return null;
}

function opponentSlotLivePlayer(key) {
  if (opponents.length < 11) return null;
  if (key === "gk") return opponents[10];
  if (key === "a0") return opponents[7];
  if (key === "a1") return opponents[8];
  if (key === "a2") return opponents[9];
  const idx = slotIndex(key);
  if (key[0] === "d") return opponents[idx];
  if (key[0] === "m") return opponents[4 + idx];
  return null;
}

// A red card carries over to the next match: at kickoff the flagged roster
// players sit this one out (parked on the bench via sentOff, just like a
// same-match dismissal), a suspended goalkeeper is covered by the nearest
// outfield player, and if the human's striker is suspended a fit teammate
// steps in for the user. Serving the match clears the flag, so a player
// sent off this round returns the game after.
function applySuspensions() {
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster || teammates.length < 10) return;
  const keys = (currentMode === "myclub") ? myClubSlotList().map(s => s.key) : ["gk", "d0", "d1", "d2", "d3", "m0", "m1", "m2", "a0", "a1", "a2"];
  const benched = [];
  const benchUsed = {};
  const baseRoleFor = function (key) {
    if (key === "gk") return "goalkeeper";
    if (key[0] === "d") return "defender";
    if (key[0] === "m") return "midfielder";
    return "attacker";
  };
  for (const key of keys) {
    const rp = getSlotData(roster, key);
    if (!rp || (rp.susp || 0) < 1) continue;
    const cid = rp.__cid || null;
    // My Club: the suspended card must be replaced - if a fit card of the
    // same role waits on the bench, swap it into the lineup now so the
    // side still kicks off full strength. The suspended card serves its
    // ban on the bench and returns next match.
    if (currentMode === "myclub" && cid) {
      const slot = myClubSlotList().find(function (x) { return x.key === key; }) || null;
      const cand = slot ? bestPoolSub(slot.role) : null;
      if (cand) {
        ownedPool.splice(ownedPool.indexOf(cand), 1);
        const outgoing = clonePlayer(rp);
        outgoing.susp = 0;
        ownedPool.push(outgoing);
        setSlotData(roster, key, clonePlayer(cand));
        const live = slotLivePlayer(key);
        if (live) {
          live.sentOff = false;
          live.cards = 0;
          applyPlayerData(live, cand, slot.role);
        }
        rp.susp = 0;
        serveMyClubSusp(cid);
        continue;
      }
      // No fit card waits on the bench: the suspended player still sits the
      // match out (the side kicks off short), and the ban counts as served.
      serveMyClubSusp(cid);
    }
    // Outside My Club the club's own bench/reserves cover the ban so a base
    // mode side never has to kick off a man short while depth is available.
    if (currentMode !== "myclub" && !cid) {
      const role = baseRoleFor(key);
      const live = slotLivePlayer(key);
      if (coverBaseSlotFromBench(selectedTeam, key, role, live, benchUsed)) {
        rp.susp = 0;
        continue;
      }
    }
    benched.push(key);
    rp.susp = 0;
    const live = slotLivePlayer(key);
    if (!live) continue;
    live.sentOff = true;
    live.cards = 0;
    live.stumble = 0;
    live.tackleAnim = 0;
    live.tackleCooldown = 0;
    live.cooldown = 0;
    if (ballCarrier === live) ballCarrier = null;
    if (ball.passTarget === live) ball.passTarget = null;
    if (live.holdsBall) {
      live.holdsBall = false;
      live.holdFrames = 0;
    }
  }
  if (benched.length === 0) return;

  // Suspended goalkeeper: the nearest active outfield teammate minds goal.
  if (benched.indexOf("gk") !== -1) {
    let repl = null;
    let rd = Infinity;
    for (let i = 0; i < teammates.length; i++) {
      const tm = teammates[i];
      if (tm.sentOff || tm.role === "goalkeeper") continue;
      const d = Math.abs(tm.startX - keeperHomeX("blue"));
      if (d < rd) { rd = d; repl = tm; }
    }
    if (repl) {
      repl.role = "goalkeeper";
      repl.radius = 16;
    }
  }

  // Suspended "You" striker: the human controls the next fit attacker,
  // whose usual AI slot is vacated so they cannot play twice.
  const youKey = (currentMode === "myclub") ? "a" + (myClubFormation().na - 1) : "a2";
  if (benched.indexOf(youKey) !== -1) {
    const candidates = (currentMode === "myclub")
      ? (function () {
          const na = myClubFormation().na;
          const out = [];
          for (let i = na - 2; i >= 0; i--) out.push("a" + i);
          return out;
        })()
      : ["a1", "a0"];
    const subKey = candidates.find(function (k) {
      const rp = getSlotData(roster, k);
      return rp && (rp.susp || 0) < 1;
    });
    if (subKey) {
      const sub = getSlotData(roster, subKey);
      player.sentOff = false;
      player.cards = 0;
      applyPlayerData(player, sub, "attacker");
      const subLive = slotLivePlayer(subKey);
      if (subLive) {
        subLive.sentOff = true;
        subLive.cards = 0;
      }
    }
  }
}

// The best fit, un-suspended card on the owner's bench for a lineup role.
function bestPoolSub(role) {
  let best = null;
  let bo = -1;
  for (const p of ownedPool) {
    if (p.__cid == null) continue;
    if ((p.susp || 0) >= 1) continue;
    if ((p.inj || 0) > 0) continue;
    if (p.role !== role && p.tag !== "SUPERSTAR") continue;
    const ov = calculateOverall(p, role);
    if (ov > bo) { bo = ov; best = p; }
  }
  return best;
}

// The best fit member of the club's own bench to cover a suspended or injured
// starter. Used outside My Club, where there is no owned-card pool: the bench
// defined on the roster (TEAM_ROSTERS[club].bench / .reserves) is the source.
function bestRosterBenchSub(club, role, usedNames) {
  const r = TEAM_ROSTERS[club];
  if (!r) return null;
  const used = usedNames || {};
  let best = null;
  let bo = -1;
  const pools = [r.bench || [], r.reserves || []];
  for (const pool of pools) {
    for (const p of pool) {
      if (!p) continue;
      if (p.__subOff) continue;
      if ((p.susp || 0) >= 1) continue;
      if ((p.inj || 0) > 0) continue;
      if (used[p.name]) continue;
      if (p.role !== role) continue;
      const ov = calculateOverall(p, role);
      if (ov > bo) { bo = ov; best = p; }
    }
  }
  return best;
}

// Swap a club bench/reserve player into a live base-mode slot so a suspended
// starter is covered instead of leaving the side short. This only reshapes the
// on-pitch player for the current match - the club roster is left untouched, so
// a one-off suspension never permanently promotes a bench player. Returns true
// when a change was made. `live` is the on-pitch player to hand the stats to.
function coverBaseSlotFromBench(club, slotKey, role, live, usedNames) {
  const cand = bestRosterBenchSub(club, role, usedNames);
  if (!cand) return false;
  if (usedNames) usedNames[cand.name] = 1;
  if (live) {
    live.sentOff = false;
    live.cards = 0;
    live.stumble = 0;
    live.tackleAnim = 0;
    live.tackleCooldown = 0;
    live.cooldown = 0;
    applyPlayerData(live, cand, role);
  }
  return !!(live);
}

// Serving a My Club suspension: the ban's one-match stint is now spent, so
// drop the career record and any lingering bench flag to free the card up.
function serveMyClubSusp(cid) {
  if (currentMode !== "myclub" || !myClubLeague || !cid) return;
  const career = getMyClubCareer(myClubLeague);
  if (!career || !career.mySusp) return;
  delete career.mySusp[cid];
  for (const pc of ownedPool) {
    if (pc.__cid === cid && (pc.susp || 0)) pc.susp = 0;
  }
  saveMyClubData();
}

// True while a My Club card must sit out: a slot/bench flag or a pending
// career ban (both human-side and the opponent reds live elsewhere).
function cardIsSuspended(p) {
  if (!p) return false;
  if (currentMode !== "myclub" || !myClubLeague) return (p.susp || 0) >= 1;
  if ((p.susp || 0) >= 1) return true;
  if (p.__cid) {
    const career = getMyClubCareer(myClubLeague);
    if (career && career.mySusp && career.mySusp[p.__cid]) return true;
  }
  return false;
}

function suspBadgeHTML() {
  return '<div class="suspBadge">SUSPENDED - 1 GAME</div>';
}

// Starting-XI cards that must sit out this kickoff, so the lobby can refuse to
// begin a match while any of them remains in the side. Only starters count -
// a ban on the bench is served without blocking play.
function myClubSuspendedStarters() {
  const out = [];
  if (currentMode !== "myclub" || !myClubLeague) return out;
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return out;
  for (const s of myClubSlotList()) {
    const rp = getSlotData(roster, s.key);
    if (rp && cardIsSuspended(rp)) out.push(rp);
  }
  return out;
}

// Restores My Club bans saved against a league club onto its roster so a
// resumed career still benches the sent-off player at the next kickoff.
function hydrateOpponentBans() {
  if (currentMode !== "myclub" || !myClubLeague) return;
  const career = getMyClubCareer(myClubLeague);
  const oppName = getOpponentTeam();
  if (!career || !career.reds || !career.reds[oppName]) return;
  const roster = TEAM_ROSTERS[oppName];
  if (!roster) return;
  for (const key in career.reds[oppName]) {
    const rp = getSlotData(roster, key);
    if (rp && career.reds[oppName][key] > 0) rp.susp = 1;
  }
}

// Mirrors the above for the user's own club: a red card earned by one of
// your players (persisted in career.mySusp by the card's cid) is re-applied
// to that card wherever it sits - a starting slot or the bench - so a
// reloaded career still benches them for the next match and the lineup
// rejects them until the ban is served.
function hydrateMyClubSuspensions() {
  if (currentMode !== "myclub" || !myClubLeague) return;
  const career = getMyClubCareer(myClubLeague);
  if (!career || !career.mySusp) return;
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return;
  for (const s of myClubSlotList()) {
    const rp = getSlotData(roster, s.key);
    if (rp && rp.__cid && career.mySusp[rp.__cid]) rp.susp = 1;
  }
  for (const p of ownedPool) {
    if (p.__cid && career.mySusp[p.__cid] && !(p.susp || 0)) p.susp = 1;
  }
}

let injBannerTimeout = null;

function showInjuryIndicator(name, days) {
  const banner = document.getElementById("injBanner");
  if (!banner) return;
  const line = banner.querySelector(".injBannerLine");
  if (line) line.textContent = (name || "Player") + " is injured - out " + days + " day" + (days > 1 ? "s" : "");
  banner.classList.add("show");
  clearTimeout(injBannerTimeout);
  injBannerTimeout = setTimeout(() => banner.classList.remove("show"), 3200);
}

// Days remaining on a My Club card's injury, or 0 when fit. A card flagged
// live and the persisted career record agree; the slot flag is the fast
// path used on-screen while reloading refreshes it from the career.
function cardInjuryDays(p) {
  if (!p) return 0;
  if (currentMode !== "myclub" || !myClubLeague) return (p.inj || 0);
  if (p.__cid) {
    const career = getMyClubCareer(myClubLeague);
    if (career && career.myInj && career.myInj[p.__cid]) return career.myInj[p.__cid];
  }
  return (p.inj || 0);
}

function cardIsInjured(p) {
  return cardInjuryDays(p) > 0;
}

function injBadgeHTML() {
  return '<div class="injBadge">INJURED</div>';
}

// Starting-XI cards that must sit out this kickoff because of an injury, so
// the lobby can refuse to start while any remain in the side. Only starters
// count - a knock on the bench never blocks play.
function myClubInjuredStarters() {
  const out = [];
  if (currentMode !== "myclub" || !myClubLeague) return out;
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return out;
  for (const s of myClubSlotList()) {
    const rp = getSlotData(roster, s.key);
    if (rp && cardIsInjured(rp)) out.push(rp);
  }
  return out;
}

// Mirrors the suspension hydrate: a persisted My Club injury (career.myInj
// keyed by the card's cid) is re-applied to that card wherever it sits - a
// starting slot or the bench - so a resumed career still benches them until
// the days run down.
function hydrateMyClubInjuries() {
  if (currentMode !== "myclub" || !myClubLeague) return;
  const career = getMyClubCareer(myClubLeague);
  if (!career || !career.myInj) return;
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return;
  for (const s of myClubSlotList()) {
    const rp = getSlotData(roster, s.key);
    if (rp && rp.__cid && career.myInj[rp.__cid]) rp.inj = career.myInj[rp.__cid];
  }
  for (const p of ownedPool) {
    if (p.__cid && career.myInj[p.__cid] && !(p.inj || 0)) p.inj = career.myInj[p.__cid];
  }
}

// One in-game day passes (friendlyDay was just advanced): every collected
// injury loses a day, and a card that hits zero is fit again. Cleared flags
// are stripped from the roster and pool so the UI un-marks them.
function advanceMyClubInjuries() {
  if (currentMode !== "myclub" || !myClubLeague) return;
  const career = getMyClubCareer(myClubLeague);
  if (!career || !career.myInj) return;
  for (const cid in career.myInj) {
    career.myInj[cid] = Math.max(0, (career.myInj[cid] || 0) - 1);
    if (career.myInj[cid] <= 0) delete career.myInj[cid];
  }
  const roster = TEAM_ROSTERS[selectedTeam];
  if (roster) {
    for (const s of myClubSlotList()) {
      const rp = getSlotData(roster, s.key);
      if (rp && (rp.inj || 0) > 0 && !career.myInj[rp.__cid]) rp.inj = 0;
    }
  }
  for (const p of ownedPool) {
    if ((p.inj || 0) > 0 && !career.myInj[p.__cid]) p.inj = 0;
  }
}

// The roster card that a live starting player stands in for, to pin a
// tackle-born injury onto the right My Club card.
function myClubCardForLivePlayer(live) {
  if (currentMode !== "myclub" || !myClubLeague) return null;
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster || !live) return null;
  for (const s of myClubSlotList()) {
    if (slotLivePlayer(s.key) === live) {
      const rp = getSlotData(roster, s.key);
      if (rp && rp.__cid) return rp;
    }
  }
  return null;
}

// A My Club card picked up a knock: record the days on the card and in the
// career, persist, and flash the injury banner.
function applyMyClubInjury(card, days) {
  if (!card || !card.__cid) return;
  const career = getMyClubCareer(myClubLeague);
  if (!career) return;
  if (!career.myInj || typeof career.myInj !== "object") career.myInj = {};
  career.myInj[card.__cid] = Math.max(career.myInj[card.__cid] || 0, days);
  card.inj = career.myInj[card.__cid];
  for (const p of ownedPool) if (p.__cid === card.__cid) p.inj = card.inj;
  saveMyClubData();
  showInjuryIndicator(card.name, card.inj);
}

// The My Club starting slot that a live blue player is standing in for, so a
// tackle-born injury can pin the exit and the forced sub onto the right spot.
function myClubSlotKeyForLivePlayer(live) {
  if (currentMode !== "myclub" || !myClubLeague) return null;
  if (!live) return null;
  for (const s of myClubSlotList()) {
    if (slotLivePlayer(s.key) === live) return s.key;
  }
  return null;
}

// The best fit bench card that can cover a slot after an injury: same role
// (or a SUPERSTAR), still in the match bench, not already on the pitch and
// not sitting out via a suspension or an existing injury. Null means the
// position can't be replaced, so the knock is shaken off instead.
function myClubInjuryReplacementFor(slotKey) {
  const slot = myClubSlotList().find(s => s.key === slotKey);
  if (!slot) return null;
  const inLineup = clubCardIdsInLineup();
  const eligible = myClubBench().filter(p =>
    p && p.__cid &&
    !inLineup.has(p.__cid) &&
    !cardIsSuspended(p) &&
    !cardIsInjured(p) &&
    (p.role === slot.role || p.tag === "SUPERSTAR")
  );
  if (!eligible.length) return null;
  eligible.sort((a, b) => calculateOverall(b, b.role) - calculateOverall(a, a.role));
  return eligible[0];
}

// A live player of the user's My Club side just got tackled: roll a chance he
// comes out of it injured (much rarer now), with worst slides hurting longest.
// When a bench card can cover the position the player is taken straight off
// and the automatic substitution runs, consuming one of the match subs. If no
// replacement exists for the slot - or no subs are left - the injured player
// still goes off and the side has to play out the match a man down.
function maybeInjureBluePlayer(live, hard) {
  if (currentMode !== "myclub" || !myClubLeague) return;
  if (!live || live.sentOff) return;
  const chance = hard ? 0.015 : 0.006;
  if (netRand() >= chance) return;
  const slotKey = myClubSlotKeyForLivePlayer(live);
  if (!slotKey) return;
  const card = getSlotData(TEAM_ROSTERS[selectedTeam], slotKey);
  if (!card || !card.__cid) return;
  const days = 1 + Math.floor(netRand() * (hard ? 4 : 3));
  applyMyClubInjury(card, days);

  // Detach the departing player from the ball before anyone else steps in.
  if (ballCarrier === live) ballCarrier = null;
  if (ball && ball.passTarget === live) ball.passTarget = null;
  if (live.holdsBall) {
    live.holdsBall = false;
    live.holdFrames = 0;
  }

  const replacement = (subsUsedThisMatch < MAX_MATCH_SUBS) ? myClubInjuryReplacementFor(slotKey) : null;
  if (!replacement) {
    // Nobody can come on: park the injured player on the bench and play on
    // shorthanded for the rest of the match.
    parkInjuredPlayer(live);
    saveClubState();
    saveMyClubData();
    return;
  }

  const err = doSwap(slotKey, replacement.__cid);
  if (err) {
    parkInjuredPlayer(live);
    saveClubState();
    saveMyClubData();
    return;
  }
  refreshLiveSlot(slotKey);
  subsUsedThisMatch++;
  live.stumble = 0;
  live.tackleAnim = 0;
  live.tackleCooldown = 0;
  live.cooldown = 0;
  saveClubState();
  saveMyClubData();
  showSubIndicator(card.name, replacement.name);
}

// Take an injured player off for good: park them by the technical area and
// exclude them from the rest of the match via sentOff, exactly like a red
// card but without the suspension. If it is the goalkeeper going off, the
// nearest active outfield teammate takes the gloves so the side keeps one.
function parkInjuredPlayer(live) {
  if (!live || live.sentOff) return;
  live.sentOff = true;
  live.offInjured = true;
  live.cards = 0;
  const isBlue = live.team === "blue";
  live.x = isBlue ? field.x + 140 : field.x + field.width - 140;
  live.y = isBlue ? field.y + field.height + 40 : field.y - 40;
  live.facingX = isBlue ? 1 : -1;
  live.facingY = 0;
  live.stumble = 0;
  live.slideTackle = 0;
  live.tackleAnim = 0;
  live.kickAnim = 0;
  live.celebrate = 0;
  live.tackleCooldown = 0;
  live.cooldown = 0;
  if (live.role === "goalkeeper") {
    const list = isBlue ? teammates : opponents;
    let repl = null;
    let rd = Infinity;
    for (const tm of list) {
      if (tm.sentOff || tm.role === "goalkeeper") continue;
      const d = Math.abs(tm.startX - keeperHomeX(isBlue ? "blue" : "red"));
      if (d < rd) { rd = d; repl = tm; }
    }
    if (repl) {
      repl.role = "goalkeeper";
      repl.radius = 16;
    }
  }
}

// Red cards carry into the opponent's next live match exactly like the
// user's: at kickoff the flagged enemy sits this one out (parked on the
// bench via sentOff), a banned goalkeeper is covered by the nearest
// outfield player, and serving the match clears the flag along with any
// persisted My Club ban.
function applyOpponentSuspensions() {
  const oppName = getOpponentTeam();
  const roster = TEAM_ROSTERS[oppName];
  if (!roster || opponents.length < 11) return;
  const keys = ["gk", "d0", "d1", "d2", "d3", "m0", "m1", "m2", "a0", "a1", "a2"];
  const benched = [];
  for (const key of keys) {
    const rp = getSlotData(roster, key);
    if (!rp || (rp.susp || 0) < 1) continue;
    benched.push(key);
    rp.susp = 0;
    const live = opponentSlotLivePlayer(key);
    if (!live) continue;
    live.sentOff = true;
    live.cards = 0;
    live.stumble = 0;
    live.tackleAnim = 0;
    live.tackleCooldown = 0;
    live.cooldown = 0;
    if (ballCarrier === live) ballCarrier = null;
    if (ball.passTarget === live) ball.passTarget = null;
    if (live.holdsBall) {
      live.holdsBall = false;
      live.holdFrames = 0;
    }
  }
  if (benched.length === 0) return;

  // Suspended opponent goalkeeper: the nearest active outfield enemy minds goal.
  if (benched.indexOf("gk") !== -1) {
    let repl = null;
    let rd = Infinity;
    for (let i = 0; i < opponents.length; i++) {
      const o = opponents[i];
      if (o.sentOff || o.role === "goalkeeper") continue;
      const d = Math.abs(o.startX - keeperHomeX("red"));
      if (d < rd) { rd = d; repl = o; }
    }
    if (repl) {
      repl.role = "goalkeeper";
      repl.radius = 16;
    }
  }

  // Serving the match clears any persisted My Club ban for these slots.
  if (currentMode === "myclub" && myClubLeague) {
    const career = getMyClubCareer(myClubLeague);
    if (career && career.reds && career.reds[oppName]) {
      for (const key of benched) delete career.reds[oppName][key];
      if (Object.keys(career.reds[oppName]).length === 0) delete career.reds[oppName];
      saveMyClubData();
    }
  }
}

/* ---- 3. Coins / sponsors ---- */
const DEFAULT_CLUB_COINS = 0; 

const CLUB_WIN_PRIZE = 1000000; 

const GOAL_PRIZE = 500000; 

const DRAW_PRIZE = 500000; 

let playerCoins = DEFAULT_CLUB_COINS;

/* ------------------------------
   Team sponsors: pick ONE partner
   after choosing your team. Before
   every match they hand out 3 bonus
   tasks; each completed task pays
   coins (tiered + progressive).
------------------------------ */

const SPONSORS = [
  { key: "voltfly",   name: "VoltFly Energy",  color: "#3dd6ff", base: 150000, badge: "VF", pitch: "Goals pay - cash in on every strike" },
  { key: "crestbrew", name: "Crest Brew",      color: "#ffd43b", base: 200000, badge: "CB", pitch: "Wins pay - bank on results" },
  { key: "aeroturf",  name: "AeroTurf",        color: "#69db7c", base: 175000, badge: "AT", pitch: "Graft pays - tackles and attempts" },
  { key: "pinnacle",  name: "Pinnacle Motors", color: "#ff6b6b", base: 225000, badge: "PM", pitch: "Control pays - keep it tight" }
];
const SPONSOR_TASKS = [
  { key: "goal",     label: "Score a goal",       doneAt: "1 goal" },
  { key: "win",      label: "Win the match",      doneAt: "finish ahead" },
  { key: "twogoals", label: "Score 2+ goals",     doneAt: "2nd goal" },
  { key: "clean",    label: "Keep a clean sheet", doneAt: "concede 0" },
  { key: "tackles",  label: "Win 6 tackles",      doneAt: "6 won" },
  { key: "shots",    label: "Take 5 shots",       doneAt: "5 attempts" }
];
let selectedSponsor = null;
let sponsorSession = null;
let sponsorToastTimer = null;

function sponsorById(key) {
  return SPONSORS.find(s => s.key === key) || null;
}

function sponsorTier() {
  const m = findPlayerMatch();
  if (!m) return 1;
  const g = getPlayerGroup();
  if (g && g.matches.includes(m)) return m.round || 1;
  if (tournament.roundOf16.includes(m)) return 9;
  if (tournament.quarterfinals.includes(m)) return 10;
  if (tournament.semifinals.includes(m)) return 11;
  return 12;
}

function sponsorTaskPayout() {
  const sp = sponsorById(selectedSponsor);
  if (!sp) return 0;
  const scale = 1 + 0.12 * (sponsorTier() - 1);
  return Math.round((sp.base * scale) / 1000) * 1000;
}

function generateSponsorTasks() {
  if (friendlyContext || pvpContext || (typeof currentMode !== "undefined" && (currentMode === "worldcup" || currentMode === "custom" || currentMode === "playercareer" || currentMode === "managercareer"))) {
    sponsorSession = null;
    updateSponsorUi();
    return;
  }
  if (!selectedSponsor || !sponsorById(selectedSponsor)) {
    sponsorSession = null;
    updateSponsorUi();
    return;
  }
  const pool = SPONSOR_TASKS.slice();
  const picked = [];
  while (picked.length < 3 && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  sponsorSession = {
    tasks: picked.map(t => ({ key: t.key, label: t.label, done: false })),
    counters: { goal: 0, tackles: 0, shots: 0 },
    awarded: {},
    bonusPaid: false
  };
  updateSponsorUi();
}

function sponsorTaskDone(key) {
  const s = sponsorSession;
  if (!s) return false;
  switch (key) {
    case "goal": return s.counters.goal >= 1;
    case "twogoals": return s.counters.goal >= 2;
    case "tackles": return s.counters.tackles >= 6;
    case "shots": return s.counters.shots >= 5;
    case "win": return blueScore > redScore;
    case "clean": return redScore === 0;
  }
  return false;
}

function paySponsorTask(t) {
  const s = sponsorSession;
  if (!s) return;
  t.done = true;
  s.awarded[t.key] = true;
  const pay = sponsorTaskPayout();
  playerCoins += pay;
  saveClubState();
  showSponsorToast(t.label + " complete  +" + formatMoney(pay));
}

function sponsorNote(kind, amount) {
  const s = sponsorSession;
  if (!s || !selectedSponsor) return;
  s.counters[kind] = (s.counters[kind] || 0) + (amount || 1);
  if (kind === "win" || kind === "clean") {
    for (const t of s.tasks) {
      if (t.done || s.awarded[t.key]) continue;
      if (sponsorTaskDone(t.key)) paySponsorTask(t);
    }
  } else {
    for (const t of s.tasks) {
      if (t.key === "win" || t.key === "clean") continue;
      if (t.done || s.awarded[t.key]) continue;
      if (sponsorTaskDone(t.key)) paySponsorTask(t);
    }
  }
  updateSponsorHud();
}

function settleSponsorTasks() {
  const s = sponsorSession;
  if (!s || !selectedSponsor) return;
  sponsorNote("win");
  sponsorNote("clean");
  if (s.tasks.every(t => t.done) && !s.bonusPaid) {
    s.bonusPaid = true;
    const pay = sponsorTaskPayout();
    playerCoins += pay;
    saveClubState();
    showSponsorToast("ALL 3 SPONSOR TASKS  +" + formatMoney(pay));
  }
  refreshSponsorSection();
  updateSponsorUi();
}

function buildSponsorButtons() {
  const box = document.getElementById("sponsorButtons");
  if (!box) return;
  SPONSORS.forEach(sp => {
    const b = document.createElement("button");
    b.className = "sponsorButton";
    b.dataset.key = sp.key;
    b.style.setProperty("--sp-color", sp.color);
    b.innerHTML =
      '<span class="sponsorBadge" style="background:' + sp.color + '">' + sp.badge + '</span>' +
      '<span class="sponsorLabel"><span class="sponsorName">' + sp.name + '</span>' +
      '<span class="sponsorPitch">' + sp.pitch + '</span></span>';
    b.onclick = () => {
      if (!selectedTeam) return;
      selectedSponsor = sp.key;
      saveClubState();
      refreshSponsorSection();
      updateSponsorUi();
    };
    box.appendChild(b);
  });
}

function refreshSponsorSection() {
  const enabled = !!selectedTeam;
  const sec = document.getElementById("sponsorSection");
  if (sec) sec.classList.toggle("sponsorSectionLocked", !enabled);
  document.querySelectorAll(".sponsorButton").forEach(b => {
    b.classList.toggle("selected", !!selectedTeam && b.dataset.key === selectedSponsor);
  });
}

function updateSponsorUi() {
  const sp = sponsorById(selectedSponsor);
  const s = sponsorSession;
  const panel = document.getElementById("sponsorPanel");
  const hud = document.getElementById("sponsorHud");
  if (!sp || !s) {
    if (panel) panel.style.display = "none";
    if (hud) hud.style.display = "none";
    return;
  }
  const showPanel = !!(matchRunning === false && awaitingStart);
  if (showPanel) {
    panel.style.display = "block";
    panel.style.setProperty("--sp-color", sp.color);
    panel.innerHTML =
      '<div class="sponsorPanelHead">' +
      '<span class="sponsorBadge" style="background:' + sp.color + '">' + sp.badge + '</span>' +
      '<div><div class="sponsorPanelName">' + sp.name + '</div>' +
      '<div class="sponsorPanelSub">3 tasks this match - ' + formatMoney(sponsorTaskPayout()) + ' each - all 3 = bonus payout</div></div>' +
      '</div>' +
      s.tasks.map(t => '<div class="sponsorTask"><span>' + (t.done ? "CHECK" : "TASK") + '</span> ' + t.label + '</div>').join("");
  } else {
    panel.style.display = "none";
  }
  if (matchRunning) updateSponsorHud();
  else if (hud) hud.style.display = "none";
}

function updateSponsorHud() {
  const sp = sponsorById(selectedSponsor);
  const s = sponsorSession;
  const hud = document.getElementById("sponsorHud");
  if (!hud || !sp || !s || !matchRunning || awaitingStart) return;
  hud.style.display = "block";
  hud.style.setProperty("--sp-color", sp.color);
  hud.innerHTML =
    '<div class="sponsorHudTitle">' + sp.badge + ' ' + sp.name + '</div>' +
    s.tasks.map(t => '<div class="sponsorTask' + (t.done ? " sponsorTaskDone" : "") + '"><span>' + (t.done ? "OK" : "-") + '</span> ' + t.label + '</div>').join("");
}

function showSponsorToast(msg) {
  const t = document.getElementById("sponsorToast");
  if (!t) return;
  const sp = sponsorById(selectedSponsor);
  if (sp) t.style.setProperty("--sp-color", sp.color);
  t.style.display = "block";
  t.textContent = msg;
  clearTimeout(sponsorToastTimer);
  sponsorToastTimer = setTimeout(() => { t.style.display = "none"; }, 3500);
}

buildSponsorButtons();
refreshSponsorSection(); 

/* ---- 4. Penalty shootout ---- */
/* ------------------------------
   Penalty shootout: knockout
   5 kicks each, sudden death.
   New: timing meter + skill
   Player defends by picking dive
   AI keeper reads tendencies + drama
   Canvas scene + tally
------------------------------ */
const PENALTY_SIDES = ["TL", "BL", "TR", "BR", "MID"];
const PEN_DIFF = {
  TL: { aim: 1.25, save: 0.55 },
  TR: { aim: 1.25, save: 0.55 },
  BL: { aim: 1.00, save: 0.78 },
  BR: { aim: 1.00, save: 0.78 },
  MID: { aim: 0.80, save: 0.98 }
};
const PEN_MISS_LINE = 0.6;

let penaltyShootout = null;
let penaltyWinner = null;
let penaltyScore = null;
let penaltyDelayMs = 900;
let penaltyShot = null; // keep for compatibility
let penaltyAnimMs = 900;

let penaltyLoopId = null;
let penaltyLoopActive = false;

function penaltyRandSide() {
  return PENALTY_SIDES[Math.floor(Math.random() * PENALTY_SIDES.length)];
}

function penaltySfx(kind) {
  try {
    if (kind === "goal") {
      if (typeof crowdRoar === "function") crowdRoar(0.8);
      else if (typeof sfxTone === "function") sfxTone(0.3, 0.2, "square", 520, 780);
    } else if (kind === "save") {
      if (typeof crowdOoh === "function") crowdOoh();
      if (typeof sfxNoiseBurst === "function") sfxNoiseBurst(0.18, 0.2, "lowpass", 900, 200, 0.7);
    } else if (kind === "miss") {
      if (typeof crowdGroan === "function") crowdGroan();
    } else if (kind === "kick") {
      if (typeof sfxTone === "function") sfxTone(0.08, 0.16, "square", 300, 180);
    } else if (kind === "whistle") {
      if (typeof refereeWhistle === "function") refereeWhistle(false);
    }
  } catch (e) {}
}

function getDiffIndex() {
  try {
    if (typeof getDifficultyScale === "function") {
      const s = getDifficultyScale();
      if (s <= 0.9) return 0;
      if (s >= 1.1) return 2;
      return 1;
    }
  } catch (e) {}
  return 1;
}

function stopPenaltyLoop() {
  penaltyLoopActive = false;
  if (penaltyLoopId !== null) {
    try { cancelAnimationFrame(penaltyLoopId); } catch (e) {}
    penaltyLoopId = null;
  }
}

function drawPenaltyScene() {
  const canvas = document.getElementById("penaltyCanvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#6fa1f0");
  g.addColorStop(0.65, "#7ecf60");
  g.addColorStop(0.85, "#5fb04a");
  g.addColorStop(1, "#447c35");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // goal frame
  const goalW = 240, goalH = 70;
  const gx = (W - goalW) / 2, gy = 20;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.strokeRect(gx, gy, goalW, goalH);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(gx+2, gy+2, goalW-4, goalH-4);
  ctx.beginPath();
  for (let x=gx+12; x<gx+goalW; x+=18) {
    ctx.moveTo(x, gy+2); ctx.lineTo(x, gy+goalH-2);
  }
  for (let y=gy+8; y<gy+goalH; y+=12) {
    ctx.moveTo(gx+2, y); ctx.lineTo(gx+goalW-2, y);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1; ctx.stroke();
  // keeper
  const s = penaltyShootout;
  if (s) {
    let kx = W/2, ky = 65;
    if (s.anim && s.anim.keep) {
      const d = s.anim.dive || "MID";
      if (d==="TL") { kx-=22; ky-=10; }
      else if (d==="TR") { kx+=22; ky-=10; }
      else if (d==="BL") { kx-=16; ky+=6; }
      else if (d==="BR") { kx+=16; ky+=6; }
      else { kx=W/2; ky=68; }
    }
    ctx.fillStyle = s.anim && s.anim.keep==="blue" ? "#1f6fd0" : "#e63946";
    ctx.beginPath();
    ctx.arc(kx, ky, 8, 0, Math.PI*2); ctx.fill();
  }
  // ball
  if (s && s.anim && s.anim.ball) {
    const b = s.anim.ball;
    const x = gx + 2 + b.p * (goalW-4);
    const y = 95 + (s.anim.t / Math.max(.01,s.anim.dur)) * 20 + (s.anim.outcome==="goal"? -10:0);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
  }
  // taker
  ctx.fillStyle = "#168cff";
  ctx.beginPath();
  ctx.arc(W-60, 130, 8, 0, Math.PI*2); ctx.fill();
}

function penLoop() {
  if (!penaltyLoopActive) return;
  const s = penaltyShootout;
  const canvas = document.getElementById("penaltyCanvas");
  const meter = document.getElementById("penaltyMeter");
  const mark = document.getElementById("penaltyMeterMark");
  const z = document.getElementById("penaltyMeterZone");
  if (!s) { stopPenaltyLoop(); return; }
  const now = performance.now ? performance.now() : Date.now();
  if (!s._last) s._last = now;
  const dt = Math.min(0.05, (now - s._last)/1000); s._last = now;
  if (s.phase === "playerShoot") {
    s.meterPos += s.meterDir * 0.9 * dt;
    if (s.meterPos < 0) { s.meterPos=0; s.meterDir=1; }
    if (s.meterPos > 1) { s.meterPos=1; s.meterDir=-1; }
    if (mark) mark.style.left = (s.meterPos*100) + "%";
    if (z) {
      const half = 0.16;
      z.style.left = ((0.5-half)*100) + "%";
      z.style.width = (half*2*100) + "%";
    }
  }
  if (s.anim) {
    s.anim.t += dt;
    if (s.anim.t >= s.anim.dur) s.anim.done = true;
  }
  drawPenaltyScene();
  if (meter) meter.style.display = (s.phase==="playerShoot") ? "block" : "none";
  penaltyLoopId = requestAnimationFrame(penLoop);
}

function updateTally() {
  const t = document.getElementById("penaltyTally");
  if (!t) return;
  const s = penaltyShootout; if (!s) { t.textContent=""; return; }
  let out=[];
  for (let i=0;i<s.shots.length;i++) {
    const sh=s.shots[i];
    out.push((sh.team==="blue"?"Y":"O")+":"+ (sh.scored?"G":"X"));
  }
  t.textContent = out.join("  ");
}

function renderPenalties() {
  const s = penaltyShootout;
  if (!s) return;
  const ps = document.getElementById("penaltyPlayerScore");
  const os = document.getElementById("penaltyOppScore");
  if (ps) ps.textContent = s.playerScore;
  if (os) os.textContent = s.oppScore;
  const msg = document.getElementById("penaltyMsg");
  const btns = document.getElementById("penaltyButtons");
  const dbtn = document.getElementById("penaltyDiveButtons");
  const result = document.getElementById("penaltyResult");
  updateTally();
  if (s.winner) {
    if (msg) msg.textContent = (s.winner==="blue")?"YOU WIN THE SHOOTOUT!":"OPPONENT WINS THE SHOOTOUT.";
    if (btns) btns.style.display="none";
    if (dbtn) dbtn.style.display="none";
    if (result) result.textContent = (s.lastResult||"");
    return;
  }
  if (s.phase === "playerShoot") {
    if (msg) msg.textContent = "Your kick - pick corner (or 1-5). Meter shows accuracy.";
    if (btns) btns.style.display="flex";
    if (dbtn) dbtn.style.display="none";
    if (result) result.textContent = (s.lastResult||"");
  } else if (s.phase === "playerSave") {
    if (msg) msg.textContent = "Opponent shooting - dive! (or 1-5).";
    if (btns) btns.style.display="none";
    if (dbtn) dbtn.style.display="flex";
    if (result) result.textContent = (s.lastResult||"");
  } else if (s.phase === "anim") {
    if (msg) msg.textContent = "Shot in progress...";
    if (btns) btns.style.display="none";
    if (dbtn) dbtn.style.display="none";
    if (result) result.textContent = (s.lastResult||"");
  } else {
    const round = s.round || ((s.playerKicks+s.oppKicks)+1);
    if (msg) msg.textContent = "Round "+round+" - prepare your kick.";
    if (btns) btns.style.display="flex";
    if (dbtn) dbtn.style.display="none";
    if (result) result.textContent = (s.lastResult||"");
  }
  if (!penaltyLoopActive) { penaltyLoopActive = true; penaltyLoopId = requestAnimationFrame(penLoop); }
}

function getShootingStat() {
  let shot = 70;
  try { if (player && typeof player.shooting === "number") shot = player.shooting; } catch(e){}
  if (shot < 50) shot = 50; if (shot > 99) shot = 99;
  return shot;
}

function getKeeperStat() {
  let k=90;
  try {
    const kp = allPlayers && allPlayers.find ? allPlayers.find(p=>p.team==="blue" && p.role==="goalkeeper") : null;
    if (kp && typeof kp.defending === "number") k = kp.defending;
  } catch(e){}
  if (k<50) k=50; if (k>99) k=99;
  return k;
}

function keeperGuess(s) {
  const h = s.history && s.history.player ? s.history.player.slice(-5) : [];
  const freq = {};
  for (let i=0;i<h.length;i++) freq[h[i]] = (freq[h[i]]||0)+1;
  let best = null, bestc=0;
  for (let k in freq) { if (freq[k]>bestc) { bestc=freq[k]; best=k; } }
  const r = Math.random();
  const read = 0.3 + 0.1*getDiffIndex();
  if (best && r < read) return best;
  return PENALTY_SIDES[Math.floor(Math.random()*PENALTY_SIDES.length)];
}

function penaltyPick(side) {
  const s = penaltyShootout;
  if (!s || s.winner) return;
  if (s.phase !== "playerShoot") return;
  s.phase = "anim";
  s.chosenSide = side;
  s.history.player.push(side);
  const a = PEN_DIFF[side] || PEN_DIFF.MID;
  const shot = getShootingStat();
  const err = Math.abs((s.meterPos!=null?s.meterPos:0.5) - 0.5);
  const tol = 0.16;
  const rawQ = clamp(1 - err/Math.max(0.0001, tol), 0, 1);
  const quality = clamp(rawQ * a.aim * (0.85 + (shot-70)*0.004), 0, 1);
  const onTarget = rawQ > 0;
  let scored = false;
  let saved = false;
  let miss = false;
  let kside = penaltyRandSide();
  if (!onTarget || quality < PEN_MISS_LINE) {
    miss = true;
    scored = false;
  } else {
    kside = keeperGuess(s);
    s.history.opp.push(kside);
    let saveChance = a.save;
    saveChance *= (1 - 0.5*quality);
    if (kside === side) saveChance = clamp(saveChance, .25, .9);
    else saveChance = clamp(saveChance * 0.45, .05, .25);
    saved = Math.random() < saveChance;
    scored = !saved;
  }
  s.lastResult = miss ? "MISS WIDE" : (saved ? "SAVED - keeper guessed well." : "GOAL!");
  s.anim = { taker:"blue", keep:"red", side:side, dive: kside, t:0, dur:0.9, outcome: scored?"goal":(miss?"miss":"save"), p: Math.random()*.6 + .2 };
  s.playerKicks++;
  if (scored) s.playerScore++;
  s.shots.push({team:"blue", scored: scored});
  s.lastGoal = scored;
  renderPenalties();
  penaltySfx("kick");
  setTimeout(function(){ penaltySfx(miss ? "miss" : (saved ? "save" : "goal")); }, 420);
  setTimeout(function(){ penaltyAfterPlayer(); }, Math.round(penaltyDelayMs));
}

function penaltyZone(dive) {
  const s = penaltyShootout;
  if (!s || s.winner) return;
  if (s.phase !== "playerSave") return;
  s.phase = "anim";
  const oppSide = s._oppSide || penaltyRandSide();
  const diff = getDiffIndex();
  const oppAcc = (diff===2?0.85: diff===1?0.75:0.65);
  const quality = oppAcc * (0.8 + Math.random()*0.4);
  const k = getKeeperStat();
  let saved = false;
  let scored = true;
  let miss = false;
  if (quality < PEN_MISS_LINE) { miss=true; scored=false; }
  else {
    if (dive === oppSide) saved = Math.random() < clamp(0.62 + (k-50)*0.008, 0.6, 0.95);
    else saved = Math.random() < k*0.0022;
    scored = !saved && !miss;
  }
  s.lastResult = miss ? "OPPONENT MISSES!" : (saved ? "YOUR KEEPER SAVES!" : "OPPONENT SCORES.");
  s.anim = { taker:"red", keep:"blue", side:oppSide, dive:dive, t:0, dur:0.9, outcome: scored?"goal":(miss?"miss":"save"), p: Math.random()*.6 + .2 };
  s.oppKicks++;
  if (scored) s.oppScore++;
  s.shots.push({team:"red", scored: scored});
  s.lastGoal = scored;
  renderPenalties();
  penaltySfx("kick");
  setTimeout(function(){ penaltySfx(miss ? "miss" : (saved ? "save" : "goal")); }, 420);
  setTimeout(function(){ penaltyAfterOpp(); }, Math.round(penaltyDelayMs));
}

function penaltyAfterPlayer() {
  const s = penaltyShootout; if (!s || s.winner) return;
  if (penaltyDecided()) return finishShootout();
  s.phase = "playerSave";
  s._oppSide = penaltyRandSide();
  s.diveSide = null;
  renderPenalties();
}

function penaltyAfterOpp() {
  const s = penaltyShootout; if (!s || s.winner) return;
  if (penaltyDecided()) return finishShootout();
  s.phase = "playerShoot";
  s.round = s.playerKicks + 1;
  renderPenalties();
}

function penaltyDecided() {
  const s = penaltyShootout;
  if (!s) return true;
  // Only decide once both sides have taken the same number of kicks.
  if (s.playerKicks !== s.oppKicks) return false;
  const kicked = s.playerKicks;
  if (kicked >= 5) return s.playerScore !== s.oppScore;
  return Math.abs(s.playerScore - s.oppScore) > (5 - kicked);
}

function finishShootout() {
  const s = penaltyShootout;
  if (!s || s.winner) return;
  if (s.playerScore > s.oppScore) s.winner = "blue";
  else if (s.oppScore > s.playerScore) s.winner = "red";
  else { s.winner = (Math.random()<0.5?"blue":"red"); }
  penaltyWinner = s.winner;
  penaltyScore = { blue: s.playerScore, red: s.oppScore };
  s.phase = "done";
  s.round = (s.playerKicks+s.oppKicks)+1;
  s.sudden = (s.playerKicks>=5);
  renderPenalties();
  stopPenaltyLoop();
  penaltySfx("whistle");
  setTimeout(() => {
    try { if (document.getElementById("penaltyScreen")) document.getElementById("penaltyScreen").style.display="none"; } catch(e){}
    if (typeof endMatch === "function") endMatch();
  }, penaltyDelayMs + 350);
}

function beginPenalties() {
  try { clearInterval(timerInterval); } catch(e){}
  matchRunning = false;
  matchPhase = "penalties";
  penaltyWinner = null;
  penaltyScore = null;
  penaltyShootout = {
    playerKicks:0, oppKicks:0, playerScore:0, oppScore:0,
    winner:null, round:1, sudden:false,
    history:{player:[], opp:[]}, shots:[],
    phase:"playerShoot",
    meterPos:0.5, meterDir:1,
    chosenSide:"MID",
    lastResult:"", lastGoal:false,
    _last:0, anim:null
  };
  freekick = null;
  matchPenalty = null;
  try { resetPositions(); } catch(e){}
  penaltyShot = null;
  try {
    const ps = document.getElementById("penaltyScreen");
    if (ps) ps.style.display="block";
  } catch(e){}
  renderPenalties();
  try { if (typeof updateTimer === "function") updateTimer(); } catch(e){}
  penaltyLoopActive = true;
  if (penaltyLoopId === null) penaltyLoopId = requestAnimationFrame(penLoop);
  penaltySfx("whistle");
}

function penaltyPickLegacy(side){ penaltyPick(side); }
function penaltyZoneLegacy(side){ penaltyZone(side); }

// keep old names refs
function penaltyOppKick(){
  const s = penaltyShootout;
  if (!s || s.phase!=="playerSave") return;
  penaltyZone(s._oppSide || penaltyRandSide());
}

function penaltyAfterRound(){
  const s = penaltyShootout;
  if (!s) return;
  if (s.winner) return;
  if (s.phase==="anim") return;
  if (s.playerKicks < s.oppKicks) s.phase="playerShoot";
  else if (s.oppKicks < s.playerKicks) { s.phase="playerSave"; s._oppSide=penaltyRandSide(); }
  else s.phase="playerShoot";
  renderPenalties();
}

const PEN_KEY_SIDE = { "1":"TL", "2":"BL", "3":"TR", "4":"BR", "5":"MID" };
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("keydown", function (e) {
    const s = penaltyShootout;
    if (!s || s.winner) return;
    const side = PEN_KEY_SIDE[e.key];
    if (!side) return;
    if (s.phase === "playerShoot") { e.preventDefault(); penaltyPick(side); }
    else if (s.phase === "playerSave") { e.preventDefault(); penaltyZone(side); }
  }, true);
}

/* ---- 5. Market + My Club tables ---- */
let ownedPool = []; 

let marketCards = []; 

let marketCategory = "all"; 

let clubDefaults = {}; 



const MARKET_ROLE_LABEL = { 

  attacker: "Attacker", midfielder: "Midfielder", defender: "Defender", goalkeeper: "Goalkeeper" 

}; 



const ICON_PLAYERS = {

  "Real Madrid": [
    { name: "Zinedine Zidane", role: "midfielder", stats: { pace: 98, shooting: 91, passing: 99, dribbling: 99, defending: 85, physical: 99 } },
    { name: "Roberto Carlos", role: "defender", stats: { pace: 97, shooting: 84, passing: 98, dribbling: 88, defending: 99, physical: 87 } },
    { name: "Raul", role: "attacker", stats: { pace: 98, shooting: 99, passing: 95, dribbling: 99, defending: 53, physical: 71 } },
    { name: "Fernando Hierro", role: "defender", stats: { pace: 94, shooting: 81, passing: 95, dribbling: 85, defending: 99, physical: 84 } },
    { name: "Guti", role: "midfielder", stats: { pace: 91, shooting: 84, passing: 94, dribbling: 92, defending: 78, physical: 99 } },
  ],

  "Barcelona": [
    { name: "Johan Cruyff", role: "attacker", stats: { pace: 99, shooting: 99, passing: 97, dribbling: 99, defending: 55, physical: 73 } },
    { name: "Ronaldinho", role: "midfielder", stats: { pace: 97, shooting: 90, passing: 99, dribbling: 98, defending: 84, physical: 99 } },
    { name: "Xavi Hernandez", role: "midfielder", stats: { pace: 95, shooting: 88, passing: 98, dribbling: 96, defending: 82, physical: 99 } },
    { name: "Carles Puyol", role: "defender", stats: { pace: 94, shooting: 81, passing: 95, dribbling: 85, defending: 99, physical: 84 } },
    { name: "Andres Iniesta", role: "midfielder", stats: { pace: 94, shooting: 87, passing: 97, dribbling: 95, defending: 81, physical: 99 } },
  ],

  "Atletico Madrid": [
    { name: "Fernando Torres", role: "attacker", stats: { pace: 94, shooting: 95, passing: 91, dribbling: 96, defending: 49, physical: 67 } },
    { name: "Diego Forlan", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Francisco Gento", role: "attacker", stats: { pace: 95, shooting: 96, passing: 92, dribbling: 97, defending: 50, physical: 68 } },
    { name: "Luis Aragones", role: "midfielder", stats: { pace: 91, shooting: 84, passing: 94, dribbling: 92, defending: 78, physical: 99 } },
    { name: "Koke", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
  ],

  "Villarreal": [
    { name: "Diego Forlan", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Marcos Senna", role: "midfielder", stats: { pace: 91, shooting: 84, passing: 94, dribbling: 92, defending: 78, physical: 99 } },
    { name: "Fabio Cannavaro", role: "defender", stats: { pace: 93, shooting: 80, passing: 94, dribbling: 84, defending: 99, physical: 83 } },
    { name: "Santi Cazorla", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
  ],

  "Real Betis": [
    { name: "Joaquin", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
    { name: "Rafael Gordillo", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Julio Cardenosa", role: "midfielder", stats: { pace: 85, shooting: 78, passing: 88, dribbling: 86, defending: 72, physical: 95 } },
    { name: "Alfonso Perez", role: "attacker", stats: { pace: 87, shooting: 88, passing: 84, dribbling: 89, defending: 42, physical: 60 } },
    { name: "Ruben Castro", role: "attacker", stats: { pace: 86, shooting: 87, passing: 83, dribbling: 88, defending: 41, physical: 59 } },
  ],

  "Paris Saint-Germain": [
    { name: "Neymar Jr", role: "attacker", stats: { pace: 99, shooting: 99, passing: 96, dribbling: 99, defending: 54, physical: 72 } },
    { name: "Thiago Silva", role: "defender", stats: { pace: 93, shooting: 80, passing: 94, dribbling: 84, defending: 99, physical: 83 } },
    { name: "Zlatan Ibrahimovic", role: "attacker", stats: { pace: 95, shooting: 96, passing: 92, dribbling: 97, defending: 50, physical: 68 } },
    { name: "Cavani", role: "attacker", stats: { pace: 94, shooting: 95, passing: 91, dribbling: 96, defending: 49, physical: 67 } },
    { name: "Ronaldinho", role: "midfielder", stats: { pace: 97, shooting: 90, passing: 99, dribbling: 98, defending: 84, physical: 99 } },
  ],

  "Bayern Munich": [
    { name: "Franz Beckenbauer", role: "defender", stats: { pace: 94, shooting: 81, passing: 95, dribbling: 85, defending: 99, physical: 84 } },
    { name: "Gerd Muller", role: "attacker", stats: { pace: 96, shooting: 97, passing: 93, dribbling: 98, defending: 51, physical: 69 } },
    { name: "Oliver Kahn", role: "goalkeeper", stats: { pace: 75, shooting: 39, passing: 89, dribbling: 45, defending: 99, physical: 87 } },
    { name: "Lothar Matthaus", role: "midfielder", stats: { pace: 92, shooting: 85, passing: 95, dribbling: 93, defending: 79, physical: 99 } },
    { name: "Karl-Heinz Rummenigge", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
  ],

  "Borussia Dortmund": [
    { name: "Matthias Sammer", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
    { name: "Marco Reus", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Michael Zorc", role: "midfielder", stats: { pace: 87, shooting: 80, passing: 90, dribbling: 88, defending: 74, physical: 97 } },
    { name: "Jurgen Kohler", role: "defender", stats: { pace: 88, shooting: 75, passing: 89, dribbling: 79, defending: 95, physical: 78 } },
  ],

  "RB Leipzig": [
    { name: "Emil Forsberg", role: "midfielder", stats: { pace: 83, shooting: 76, passing: 86, dribbling: 84, defending: 70, physical: 93 } },
    { name: "Timo Werner", role: "attacker", stats: { pace: 85, shooting: 86, passing: 82, dribbling: 87, defending: 40, physical: 58 } },
    { name: "Dani Olmo", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Xaver Schlager", role: "midfielder", stats: { pace: 83, shooting: 76, passing: 86, dribbling: 84, defending: 70, physical: 93 } },
  ],

  "VfB Stuttgart": [
    { name: "Mario Gomez", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
    { name: "Fritz Walter", role: "attacker", stats: { pace: 91, shooting: 92, passing: 88, dribbling: 93, defending: 46, physical: 64 } },
    { name: "Guido Buchwald", role: "defender", stats: { pace: 85, shooting: 72, passing: 86, dribbling: 76, defending: 92, physical: 75 } },
    { name: "Timo Hildebrand", role: "goalkeeper", stats: { pace: 67, shooting: 31, passing: 81, dribbling: 37, defending: 91, physical: 79 } },
  ],

  "Inter Milan": [
    { name: "Ronaldo", role: "attacker", stats: { pace: 99, shooting: 99, passing: 96, dribbling: 99, defending: 54, physical: 72 } },
    { name: "Javier Zanetti", role: "defender", stats: { pace: 89, shooting: 76, passing: 90, dribbling: 80, defending: 96, physical: 79 } },
    { name: "Lothar Matthaus", role: "midfielder", stats: { pace: 92, shooting: 85, passing: 95, dribbling: 93, defending: 79, physical: 99 } },
    { name: "Sandro Mazzola", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
    { name: "Giuseppe Bergomi", role: "defender", stats: { pace: 88, shooting: 75, passing: 89, dribbling: 79, defending: 95, physical: 78 } },
  ],

  "Napoli": [
    { name: "Diego Maradona", role: "midfielder", stats: { pace: 99, shooting: 92, passing: 99, dribbling: 99, defending: 86, physical: 99 } },
    { name: "Marek Hamsik", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Gianfranco Zola", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
    { name: "Careca", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
    { name: "Fabio Cannavaro", role: "defender", stats: { pace: 91, shooting: 78, passing: 92, dribbling: 82, defending: 98, physical: 81 } },
  ],

  "Manchester City": [
    { name: "David Silva", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
    { name: "Kevin De Bruyne", role: "midfielder", stats: { pace: 92, shooting: 85, passing: 95, dribbling: 93, defending: 79, physical: 99 } },
    { name: "Vincent Kompany", role: "defender", stats: { pace: 89, shooting: 76, passing: 90, dribbling: 80, defending: 96, physical: 79 } },
    { name: "Yaya Toure", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
    { name: "Sergio Aguero", role: "attacker", stats: { pace: 91, shooting: 92, passing: 88, dribbling: 93, defending: 46, physical: 64 } },
  ],

  "Arsenal": [
    { name: "Thierry Henry", role: "attacker", stats: { pace: 96, shooting: 97, passing: 93, dribbling: 98, defending: 51, physical: 69 } },
    { name: "Dennis Bergkamp", role: "midfielder", stats: { pace: 92, shooting: 85, passing: 95, dribbling: 93, defending: 79, physical: 99 } },
    { name: "Tony Adams", role: "defender", stats: { pace: 87, shooting: 74, passing: 88, dribbling: 78, defending: 94, physical: 77 } },
    { name: "Patrick Vieira", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
    { name: "Sol Campbell", role: "defender", stats: { pace: 87, shooting: 74, passing: 88, dribbling: 78, defending: 94, physical: 77 } },
  ],

  "Liverpool": [
    { name: "Steven Gerrard", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Kenny Dalglish", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Graeme Souness", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Sami Hyypia", role: "defender", stats: { pace: 85, shooting: 72, passing: 86, dribbling: 76, defending: 92, physical: 75 } },
    { name: "Robbie Fowler", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
  ],

  "Manchester United": [
    { name: "Eric Cantona", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
    { name: "Paul Scholes", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "George Best", role: "attacker", stats: { pace: 95, shooting: 96, passing: 92, dribbling: 97, defending: 50, physical: 68 } },
    { name: "Bobby Charlton", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Roy Keane", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
  ],

  "Aston Villa": [
    { name: "Paul McGrath", role: "defender", stats: { pace: 89, shooting: 76, passing: 90, dribbling: 80, defending: 96, physical: 79 } },
    { name: "Dwight Yorke", role: "attacker", stats: { pace: 87, shooting: 88, passing: 84, dribbling: 89, defending: 42, physical: 60 } },
    { name: "Ian Taylor", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
    { name: "Emiliano Martinez", role: "goalkeeper", stats: { pace: 69, shooting: 33, passing: 83, dribbling: 39, defending: 93, physical: 81 } },
  ],

  "AS Roma": [
    { name: "Francesco Totti", role: "attacker", stats: { pace: 95, shooting: 96, passing: 92, dribbling: 97, defending: 50, physical: 68 } },
    { name: "Daniele De Rossi", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Gabriel Batistuta", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Alessandro Nesta", role: "defender", stats: { pace: 92, shooting: 79, passing: 93, dribbling: 83, defending: 99, physical: 82 } },
    { name: "Paulo Roberto Falcao", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
  ],

  "Como": [
    { name: "Cesc Fabregas", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Gianluca Zambrotta", role: "defender", stats: { pace: 87, shooting: 74, passing: 88, dribbling: 78, defending: 94, physical: 77 } },
    { name: "Dan Corneliusson", role: "attacker", stats: { pace: 87, shooting: 88, passing: 84, dribbling: 89, defending: 42, physical: 60 } },
    { name: "Stefano Borgonovo", role: "attacker", stats: { pace: 87, shooting: 88, passing: 84, dribbling: 89, defending: 42, physical: 60 } },
  ],

  "Porto": [
    { name: "Vitor Baia", role: "goalkeeper", stats: { pace: 72, shooting: 36, passing: 86, dribbling: 42, defending: 96, physical: 84 } },
    { name: "Pepe", role: "defender", stats: { pace: 91, shooting: 78, passing: 92, dribbling: 82, defending: 98, physical: 81 } },
    { name: "Deco", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Hulk", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
    { name: "Radamel Falcao", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
  ],

  "Sporting CP": [
    { name: "Luis Figo", role: "attacker", stats: { pace: 94, shooting: 95, passing: 91, dribbling: 96, defending: 49, physical: 67 } },
    { name: "Bruno Fernandes", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Rui Patricio", role: "goalkeeper", stats: { pace: 70, shooting: 34, passing: 84, dribbling: 40, defending: 94, physical: 82 } },
    { name: "Joao Moutinho", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Ricardo Quaresma", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
  ],

  "PSV Eindhoven": [
    { name: "Ruud van Nistelrooy", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
    { name: "Romario", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Ronald Koeman", role: "defender", stats: { pace: 91, shooting: 78, passing: 92, dribbling: 82, defending: 98, physical: 81 } },
    { name: "Mark van Bommel", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Arjen Robben", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
  ],

  "Feyenoord": [
    { name: "Robin van Persie", role: "attacker", stats: { pace: 91, shooting: 92, passing: 88, dribbling: 93, defending: 46, physical: 64 } },
    { name: "Ruud Gullit", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Wim van Hanegem", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Coen Moulijn", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
    { name: "Giovanni van Bronckhorst", role: "defender", stats: { pace: 87, shooting: 74, passing: 88, dribbling: 78, defending: 94, physical: 77 } },
  ],

  "Club Brugge": [
    { name: "Jan Ceulemans", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
    { name: "Franky Van der Elst", role: "midfielder", stats: { pace: 88, shooting: 81, passing: 91, dribbling: 89, defending: 75, physical: 98 } },
    { name: "Timmy Simons", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Raoul Lambert", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
    { name: "Hans Koller", role: "attacker", stats: { pace: 87, shooting: 88, passing: 84, dribbling: 89, defending: 42, physical: 60 } },
  ],

  "Lille": [
    { name: "Eden Hazard", role: "attacker", stats: { pace: 97, shooting: 98, passing: 94, dribbling: 99, defending: 52, physical: 70 } },
    { name: "Jonathan David", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
    { name: "Rio Mavuba", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Yohan Cabaye", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Mike Maignan", role: "goalkeeper", stats: { pace: 71, shooting: 35, passing: 85, dribbling: 41, defending: 95, physical: 83 } },
  ],

  "RC Lens": [
    { name: "Jean-Pierre Papin", role: "attacker", stats: { pace: 95, shooting: 96, passing: 92, dribbling: 97, defending: 50, physical: 68 } },
    { name: "Wahbi Khazri", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Lassana Diarra", role: "midfielder", stats: { pace: 87, shooting: 80, passing: 90, dribbling: 88, defending: 74, physical: 97 } },
    { name: "Charles Orlanducci", role: "defender", stats: { pace: 85, shooting: 72, passing: 86, dribbling: 76, defending: 92, physical: 75 } },
  ],

  "Galatasaray": [
    { name: "Gheorghe Hagi", role: "midfielder", stats: { pace: 92, shooting: 85, passing: 95, dribbling: 93, defending: 79, physical: 99 } },
    { name: "Hakan Sukur", role: "attacker", stats: { pace: 92, shooting: 93, passing: 89, dribbling: 94, defending: 47, physical: 65 } },
    { name: "Taffarel", role: "goalkeeper", stats: { pace: 72, shooting: 36, passing: 86, dribbling: 42, defending: 96, physical: 84 } },
    { name: "Hasan Sas", role: "attacker", stats: { pace: 89, shooting: 90, passing: 86, dribbling: 91, defending: 44, physical: 62 } },
    { name: "Arif Erdem", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
  ],

  "Fenerbahce": [
    { name: "Alex de Souza", role: "midfielder", stats: { pace: 93, shooting: 86, passing: 96, dribbling: 94, defending: 80, physical: 99 } },
    { name: "Lefter Kucukandonyadis", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Roberto Carlos", role: "defender", stats: { pace: 88, shooting: 75, passing: 89, dribbling: 79, defending: 95, physical: 78 } },
    { name: "Can Bartu", role: "midfielder", stats: { pace: 89, shooting: 82, passing: 92, dribbling: 90, defending: 76, physical: 99 } },
    { name: "Tuncay Sanli", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
  ],

  "Shakhtar Donetsk": [
    { name: "Luiz Adriano", role: "attacker", stats: { pace: 91, shooting: 92, passing: 88, dribbling: 93, defending: 46, physical: 64 } },
    { name: "Willian", role: "attacker", stats: { pace: 91, shooting: 92, passing: 88, dribbling: 93, defending: 46, physical: 64 } },
    { name: "Jadson", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Darijo Srna", role: "defender", stats: { pace: 87, shooting: 74, passing: 88, dribbling: 78, defending: 94, physical: 77 } },
    { name: "Fernandinho", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
  ],

  "Slavia Prague": [
    { name: "Petr Cech", role: "goalkeeper", stats: { pace: 77, shooting: 41, passing: 91, dribbling: 47, defending: 99, physical: 89 } },
    { name: "Tomas Rosicky", role: "midfielder", stats: { pace: 90, shooting: 83, passing: 93, dribbling: 91, defending: 77, physical: 99 } },
    { name: "Milan Baros", role: "attacker", stats: { pace: 90, shooting: 91, passing: 87, dribbling: 92, defending: 45, physical: 63 } },
    { name: "Patrik Berger", role: "midfielder", stats: { pace: 86, shooting: 79, passing: 89, dribbling: 87, defending: 73, physical: 96 } },
    { name: "Tomas Ujfalusi", role: "defender", stats: { pace: 86, shooting: 73, passing: 87, dribbling: 77, defending: 93, physical: 76 } },
  ],

  "Slovan Bratislava": [
    { name: "Jan Popluhar", role: "defender", stats: { pace: 89, shooting: 76, passing: 90, dribbling: 80, defending: 96, physical: 79 } },
    { name: "Pavel Masny", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
    { name: "Jan Capkovic", role: "attacker", stats: { pace: 87, shooting: 88, passing: 84, dribbling: 89, defending: 42, physical: 60 } },
    { name: "Robert Vittek", role: "attacker", stats: { pace: 86, shooting: 87, passing: 83, dribbling: 88, defending: 41, physical: 59 } },
    { name: "Alexander Vencel", role: "goalkeeper", stats: { pace: 66, shooting: 30, passing: 80, dribbling: 36, defending: 90, physical: 78 } },
  ],

  "Bodo/Glimt": [
    { name: "Sigurd Rushfeldt", role: "attacker", stats: { pace: 83, shooting: 84, passing: 80, dribbling: 85, defending: 38, physical: 56 } },
    { name: "Stig Johansen", role: "attacker", stats: { pace: 81, shooting: 82, passing: 78, dribbling: 83, defending: 36, physical: 54 } },
    { name: "Runar Berg", role: "midfielder", stats: { pace: 79, shooting: 72, passing: 82, dribbling: 80, defending: 66, physical: 89 } },
    { name: "Harald Berg", role: "midfielder", stats: { pace: 77, shooting: 70, passing: 80, dribbling: 78, defending: 64, physical: 87 } },
  ],

  "Viking": [
    { name: "Brede Hangeland", role: "defender", stats: { pace: 86, shooting: 73, passing: 87, dribbling: 77, defending: 93, physical: 76 } },
    { name: "Bengt Saternes", role: "attacker", stats: { pace: 85, shooting: 86, passing: 82, dribbling: 87, defending: 40, physical: 58 } },
    { name: "Petter Belsvik", role: "attacker", stats: { pace: 83, shooting: 84, passing: 80, dribbling: 85, defending: 38, physical: 56 } },
    { name: "Svein Nilsen", role: "defender", stats: { pace: 79, shooting: 66, passing: 80, dribbling: 70, defending: 86, physical: 69 } },
  ],

  "AEK Athens": [
    { name: "Mimis Papaioannou", role: "attacker", stats: { pace: 95, shooting: 96, passing: 92, dribbling: 97, defending: 50, physical: 68 } },
    { name: "Thomas Mavros", role: "attacker", stats: { pace: 93, shooting: 94, passing: 90, dribbling: 95, defending: 48, physical: 66 } },
    { name: "Kostas Nestoridis", role: "attacker", stats: { pace: 91, shooting: 92, passing: 88, dribbling: 93, defending: 46, physical: 64 } },
    { name: "Dusan Bajevic", role: "attacker", stats: { pace: 90, shooting: 91, passing: 87, dribbling: 92, defending: 45, physical: 63 } },
    { name: "Kostas Manolas", role: "defender", stats: { pace: 86, shooting: 73, passing: 87, dribbling: 77, defending: 93, physical: 76 } },
  ],

  "LASK": [
    { name: "Franz Koglberger", role: "attacker", stats: { pace: 88, shooting: 89, passing: 85, dribbling: 90, defending: 43, physical: 61 } },
    { name: "Kozlicek", role: "attacker", stats: { pace: 85, shooting: 86, passing: 82, dribbling: 87, defending: 40, physical: 58 } },
  ],

  "Sabah FC": [
    { name: "Marko Devic", role: "attacker", stats: { pace: 78, shooting: 79, passing: 75, dribbling: 80, defending: 33, physical: 51 } },
  ],

};const MAX_PLAYERS = { 

  Argentina: [ 

    { name: "MAX Lionel Messi", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Diego Maradona", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Portugal: [ 

    { name: "MAX Cristiano Ronaldo", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX EusÃ©bio", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Brazil: [ 

    { name: "MAX PelÃ©", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Ronaldo NazÃ¡rio", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Garrincha", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Zico", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX RomÃ¡rio", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Ronaldinho", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Germany: [ 

    { name: "MAX Franz Beckenbauer", role: "defender", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Gerd Muller", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Lothar Matthaus", role: "midfielder", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Netherlands: [ 

    { name: "MAX Johan Cruyff", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Marco van Basten", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Ruud Gullit", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  France: [ 

    { name: "MAX Zinedine Zidane", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Michel Platini", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Raymond Kopa", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Spain: [ 

    { name: "MAX Alfredo Di StÃ©fano", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Italy: [ 

    { name: "MAX Paolo Maldini", role: "defender", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Franco Baresi", role: "defender", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Roberto Baggio", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Giuseppe Meazza", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  England: [ 

    { name: "MAX Bobby Charlton", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],


}; 



const SUPERSTAR_PLAYERS = { 

  China: [ 

    { name: "Sixseven Dingaching", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "Xiao Ling", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  "Saudi Arabia": [ 

    { name: "Twinkle Toes Jr.", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "Twinkle Toes", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ]

}; 



const MARKET_SLOTS = [ 

  { key: "gk", role: "goalkeeper", label: "Goalkeeper" }, 

  { key: "d0", role: "defender", label: "RB" }, 

  { key: "d1", role: "defender", label: "CB" }, 

  { key: "d2", role: "defender", label: "CB" }, 

  { key: "d3", role: "defender", label: "LB" }, 

  { key: "m0", role: "midfielder", label: "CDM" }, 

  { key: "m1", role: "midfielder", label: "CM" }, 

  { key: "m2", role: "midfielder", label: "CAM" }, 

  { key: "a0", role: "attacker", label: "RW" }, 

  { key: "a1", role: "attacker", label: "ST" }, 

  { key: "a2", role: "attacker", label: "ST - You" } 

]; 

const MY_CLUB_FORMATIONS = { 

  "4-3-3": { defs: 4, mids: 3, atts: 3 }, 

  "4-4-2": { defs: 4, mids: 4, atts: 2 }, 

  "3-5-2": { defs: 3, mids: 5, atts: 2 }, 

  "5-3-2": { defs: 5, mids: 3, atts: 2 }, 

  "3-4-3": { defs: 3, mids: 4, atts: 3 }, 

  "4-5-1": { defs: 4, mids: 5, atts: 1 } 

}; 

const MY_CLUB_FORMATION_ORDER = Object.keys(MY_CLUB_FORMATIONS); 

function myClubFormation() { 

  try { 

    const c = myClubLeague ? getMyClubCareer(myClubLeague) : null; 

    const key = (c && c.formation && MY_CLUB_FORMATIONS[c.formation]) ? c.formation : "4-3-3"; 

    return { key: key, nd: MY_CLUB_FORMATIONS[key].defs, nm: MY_CLUB_FORMATIONS[key].mids, na: MY_CLUB_FORMATIONS[key].atts }; 

  } catch (e) { 

    return { key: "4-3-3", nd: 4, nm: 3, na: 3 }; 

  } 

} 

function myClubSlotList() { 

  const f = myClubFormation(); 

  const dLabels = ["RB", "CB", "CB", "CB", "LB"]; 

  const mLabels = ["CDM", "CM", "CM", "CAM", "CAM"]; 

  const aLabels = f.na === 3 ? ["RW", "ST", "ST - You"] : (f.na === 2 ? ["ST", "ST - You"] : ["ST - You"]); 

  const slots = [{ key: "gk", role: "goalkeeper", label: "Goalkeeper" }]; 

  for (let i = 0; i < f.nd; i++) slots.push({ key: "d" + i, role: "defender", label: dLabels[i] || "DEF" }); 

  for (let i = 0; i < f.nm; i++) slots.push({ key: "m" + i, role: "midfielder", label: mLabels[i] || "MID" }); 

  for (let i = 0; i < f.na; i++) slots.push({ key: "a" + i, role: "attacker", label: aLabels[i] || "ATT" }); 

  return slots; 

} 

const MARKET_FILTERS = [ 

  ["all", "All"], ["icons", "Icons"], ["superstar", "Superstar"], ["max", "MAX"], ["special", "Specials"], 

  ["defender", "Defenders"], ["midfielder", "Midfielders"], 

  ["attacker", "Attackers"], ["goalkeeper", "Goalkeeper"] 

]; 
