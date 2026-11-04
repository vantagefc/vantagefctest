/* ==========================================================================
   Vantage FC - commentary.js  (V1.34.8)
   --------------------------------------------------------------------------
   Broadcast commentary rendered as TV-style lower-third captions. Lines are
   generated for the Crowd Cam cutscenes (pre-match / half-time) and for live
   match events, then shown on the match canvas as a commentator name plate
   with a caption box.

   The module owns its own caption queue + timers. The engine feeds it a small
   per-frame context via commentary.tick(dt, ctx) and draws it with
   commentary.draw(g, w, h) onto the 480x270 match canvas.
   ========================================================================== */
(function () {
  "use strict";

  const NAME = "PIXEL SPORTS";   // commentator name plate
  const GOLD = "#e8b81f";        // default plate colour
  const GAP = 0.55;              // seconds between captions
  const MAXQUEUE = 3;

  /* ---------- pixel font (3x5) ---------- */
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010', ':': '000010000010000' };
  function txt(g, str, x, y, col, s) {
    str = String(str).toUpperCase(); s = s || 1; x = Math.round(x); y = Math.round(y);
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < str.length; i++) {
      const gl = F[str[i]]; if (!gl) continue;
      for (let k = 0; k < 15; k++) if (gl[k] === '1') g.rect(x + i * 4 * s + (k % 3) * s, y + ((k / 3) | 0) * s, s, s);
    }
    g.fill();
  }

  /* ---------- caption state ---------- */
  let cur = null, queue = [], gap = 0;
  let _prev = null, _phase = null, _preIdx = -1, _brkIdx = -1;

  function wrap(text, max) {
    const words = String(text).split(/\s+/), lines = []; let line = "";
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!line) line = w;
      else if ((line + " " + w).length <= max) line += " " + w;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    if (lines.length > 2) { lines.length = 2; if (lines[1].length > max - 3) lines[1] = lines[1].slice(0, max - 3); lines[1] += "..."; }
    return lines;
  }

  function say(text, opts) {
    text = String(text == null ? "" : text).trim(); if (!text) return;
    opts = opts || {};
    if (cur && cur.text === text) return;
    for (let i = 0; i < queue.length; i++) if (queue[i].text === text) return;
    const name = opts.name || NAME, color = opts.color || GOLD;
    const dur = opts.dur || Math.max(2.3, Math.min(5.2, 1.7 + text.length * 0.05));
    const item = { text: text, name: name, color: color, dur: dur, t: dur, lines: wrap(text, 74) };
    if (opts.priority) { cur = item; queue.length = 0; gap = 0; }
    else if (!cur) { cur = item; gap = 0; }
    else { queue.push(item); if (queue.length > MAXQUEUE) queue.shift(); }
  }

  function update(dt) {
    if (cur) { cur.t -= dt; if (cur.t <= 0) { cur = null; gap = GAP; } }
    if (!cur) { if (gap > 0) gap -= dt; if (gap <= 0 && queue.length) cur = queue.shift(); }
  }

  function draw(g, W, H) {
    const L = cur; if (!L) return;
    const age = L.dur - L.t;
    const a = Math.min(1, age / 0.22, L.t / 0.32);
    if (a <= 0.01) return;
    const pad = 5, plateH = 8, lineH = 8;
    const boxH = plateH + 4 + L.lines.length * lineH + 1;
    const boxW = Math.min(W - 16, 344);
    const x = 8, y = H - boxH - 5;
    const yo = Math.round((1 - a) * 4);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = a;
    // drop shadow
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x + 2, y + 2 + yo, boxW, boxH);
    // panel
    g.fillStyle = "rgba(7,13,11,.88)"; g.fillRect(x, y + yo, boxW, boxH);
    // left accent bar
    g.fillStyle = L.color; g.fillRect(x, y + yo, 4, boxH);
    // name plate
    const pw = 8 + L.name.length * 4;
    g.fillStyle = L.color; g.fillRect(x + 4, y + yo, pw, plateH);
    txt(g, L.name, x + 8, y + yo + 2, "#161006", 1);
    // caption lines
    let ty = y + yo + plateH + 3;
    for (let i = 0; i < L.lines.length; i++) { txt(g, L.lines[i], x + 9, ty, "#f2f7f3", 1); ty += lineH; }
    // border
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.strokeRect(x + 0.5, y + yo + 0.5, boxW - 1, boxH - 1);
    g.restore();
  }

  /* ---------- line generation ---------- */
  function tn(ctx, t) { return (t === 0 ? ctx.home : ctx.away) || (t ? "AWAY" : "HOME"); }
  function kitColor(ctx, t, info) {
    if (info && info.teamKits && info.teamKits[t]) return info.teamKits[t];
    return GOLD;
  }
  function snap(i) {
    if (!i) return null;
    return {
      state: i.state, score: i.score.slice(), half: i.half, addedMin: i.addedMin,
      cardY: [i.cardCount[0][0], i.cardCount[1][0]], cardR: [i.cardCount[0][1], i.cardCount[1][1]],
      saves: i.stats ? i.stats.saves.slice() : [0, 0], corner: i.restart && i.restart.type === "corner" ? i.restart.team : null
    };
  }

  // ctx = { phase, elapsed, home, away, score, info }
  function tick(dt, ctx) {
    ctx = ctx || {};

    // The Last Minute Winner cutscene owns the screen (it has its own caption
    // bar); keep the lower-third empty while it plays.
    if (ctx.phase === "winner") { cur = null; queue.length = 0; gap = 0; _prev = null; _phase = "winner"; return; }

    update(dt);

    // new match starting up: reset the scripted cursors
    if (ctx.phase === "pre" && _phase !== "pre") { _preIdx = -1; _prev = null; }
    if (ctx.phase === "break" && _phase !== "break") { _brkIdx = -1; _prev = null; }

    if (ctx.phase === "pre") {
      const el = ctx.elapsed || 0;
      const lines = [
        { at: 0.35, t: "Welcome to the ground for " + tn(ctx, 0) + " v " + tn(ctx, 1) + "." },
        { at: 2.5, t: "The teams are lined up - we're moments away from kick off." }
      ];
      for (let k = 0; k < lines.length; k++) if (_preIdx < k && el >= lines[k].at) { _preIdx = k; say(lines[k].t); }
      _phase = "pre"; _prev = null; return;
    }

    if (ctx.phase === "break") {
      const el = ctx.elapsed || 0, i = ctx.info;
      const sc = ctx.score || (i ? i.score : [0, 0]);
      const et = i && (i.breakNext === 3 || i.breakNext === 4);
      const lines = et
        ? [{ at: 0.35, t: "We're into extra time - still all to play for." }]
        : [
          { at: 0.35, t: "That's the break - " + tn(ctx, 0) + " " + sc[0] + ", " + tn(ctx, 1) + " " + sc[1] + "." },
          { at: 2.6, t: "Back out for the second half." }
        ];
      for (let k = 0; k < lines.length; k++) if (_brkIdx < k && el >= lines[k].at) { _brkIdx = k; say(lines[k].t); }
      _phase = "break"; _prev = null; return;
    }

    if (ctx.phase === "play" && ctx.info) {
      const i = ctx.info, p = _prev;
      if (p) {
        if (i.score[0] !== p.score[0] || i.score[1] !== p.score[1]) {
          const t = (i.score[0] !== p.score[0]) ? 0 : 1;
          const scorer = i.scorer && i.scorer.team === t ? i.scorer : null;
          const who = scorer && scorer.name ? (scorer.name + " for " + tn(ctx, t)) : tn(ctx, t);
          say("GOAL! " + who + " scores - " + tn(ctx, 0) + " " + i.score[0] + ", " + tn(ctx, 1) + " " + i.score[1] + ".",
            { priority: true, color: kitColor(ctx, t, i), dur: 4.4 });
        }
        if (i.cardCount[0][1] > p.cardR[0] || i.cardCount[1][1] > p.cardR[1]) {
          const t = (i.cardCount[0][1] > p.cardR[0]) ? 0 : 1;
          say("RED CARD! " + tn(ctx, t) + " are down to ten men.", { priority: true, color: "#e23b3b", dur: 4.0 });
        } else if (i.cardCount[0][0] > p.cardY[0] || i.cardCount[1][0] > p.cardY[1]) {
          const t = (i.cardCount[0][0] > p.cardY[0]) ? 0 : 1;
          say("A booking - " + tn(ctx, t) + " go into the book.", { color: "#ffe45e" });
        }
        if (i.restart && i.restart.type === "corner" && p.corner !== i.restart.team) {
          say(tn(ctx, i.restart.team) + " win a corner.");
        }
        if (i.stats && (i.stats.saves[0] > p.saves[0] || i.stats.saves[1] > p.saves[1])) {
          const t = (i.stats.saves[0] > p.saves[0]) ? 0 : 1;
          say("A fine save by the " + tn(ctx, t) + " keeper!");
        }
        if (i.addedMin > 0 && p.addedMin !== i.addedMin) {
          say("The board is up - " + i.addedMin + " minutes of added time.");
        }
        if (p.state !== "fulltime" && i.state === "fulltime") {
          if (i.score[0] === i.score[1]) say("Full time and it's level - we're heading to penalties!", { priority: true, dur: 4.6 });
          else say("Full time! " + tn(ctx, 0) + " " + i.score[0] + ", " + tn(ctx, 1) + " " + i.score[1] + ".", { priority: true, dur: 4.6 });
        }
      } else if (i.half === 1) {
        say(tn(ctx, 0) + " get us underway - we're off!");
      }
      _phase = "play";
      _prev = snap(i);
      return;
    }

    _phase = ctx.phase || null;
    if (ctx.phase !== "play") _prev = null;
  }

  function clear() { cur = null; queue = []; gap = 0; _prev = null; _phase = null; _preIdx = -1; _brkIdx = -1; }
  function active() { return !!cur; }
  function currentText() { return cur ? cur.text : null; }

  window.commentary = {
    tick: tick, update: update, draw: draw, say: say,
    clear: clear, active: active, currentText: currentText, NAME: NAME
  };
})();
