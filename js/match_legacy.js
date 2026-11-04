// Set once a match has genuinely been under way, so "full time" can never fire
// over the menus (where matchRunning is simply false because nothing started).
let cutsceneMatchSeen = false;
// The pre-match intro plays once per match. It holds the kickoff for its own
// length, so it finishes while kickoffIntro is still counting down; this latch
// stops it starting again on the very next frame.
let cutsceneIntroDone = false;
function cutsceneTeamName(team) {
  const n = endScreenTeamNames && endScreenTeamNames[team]
    ? endScreenTeamNames[team]
    : (team === "blue" ? selectedTeam : getOpponentTeam());
  // A quick match or a test fixture can leave the club unset; a caption that
  // reads "null - attacking right" would look broken, so fall back.
  if (!n || n === "Unknown" || /^(null|undefined)$/i.test(String(n))) {
    return team === "blue" ? "Home" : "Away";
  }
  return n;
}
// Where the camera should be looking for a cutscene that cares (the goal spot).
function cutsceneGoalFx() {
  return Math.max(0.08, Math.min(0.92, (celebrationSpot.x - field.x) / field.width));
}
function cutsceneGoalFy() {
  return Math.max(0.08, Math.min(0.92, (celebrationSpot.y - field.y) / field.height));
}
function buildCutscene(kind) {
  const blue = cutsceneTeamName("blue");
  const red = cutsceneTeamName("red");
  if (kind === "intro") {
    return {
      title: "KICK OFF",
      tint: "rgba(10,14,32,",
      shots: [
        { dur: 2.4, fx: 0.5, fy: 0.5, zoom: 1.34, sub: "The teams walk out" },
        { dur: 2.2, fx: 0.22, fy: 0.42, zoom: 1.12, sub: blue + " - attacking right" },
        { dur: 2.2, fx: 0.78, fy: 0.58, zoom: 1.12, sub: red + " - attacking left" },
      ],
    };
  }
  if (kind === "goal") {
    const fx = cutsceneGoalFx(), fy = cutsceneGoalFy();
    return {
      title: "GOAL!",
      tint: "rgba(24,10,10,",
      shots: [
        { dur: 1.5, fx, fy, zoom: 1.5, sub: "It is in!" },
        { dur: 1.4, fx: 1 - fx, fy: 1 - fy, zoom: 1.16, sub: "Replay it back" },
        { dur: 1.6, fx, fy, zoom: 1.28, sub: "The crowd is on its feet" },
      ],
    };
  }
  if (kind === "halftime") {
    return {
      title: "HALF TIME",
      tint: "rgba(8,16,34,",
      shots: [
        { dur: 3.2, fx: 0.5, fy: 0.5, zoom: 0.8, sub: "The teams head back to the dugouts" },
        { dur: 3.0, fx: 0.18, fy: 0.5, zoom: 1.18, sub: blue + " " + blueScore + " - " + redScore + " " + red },
        { dur: 2.6, fx: 0.82, fy: 0.5, zoom: 1.18, sub: "45 minutes gone" },
      ],
    };
  }
  return {
    title: "FULL TIME",
    tint: "rgba(6,10,26,",
    shots: [
      { dur: 3.4, fx: 0.5, fy: 0.5, zoom: 0.76, sub: "The final whistle" },
      { dur: 3.0, fx: 0.5, fy: 0.5, zoom: 0.62, sub: blueScore + " - " + redScore + " " + red },
    ],
  };
}
function startCutscene(kind) {
  const c = buildCutscene(kind);
  c.kind = kind;
  c.i = 0;
  c.t = 0;
  c.skipped = false;
  c.total = c.shots.reduce((a, s) => a + s.dur, 0);
  cutscene = c;
  cutsceneKind = kind;
}
function endCutscene(skip) {
  if (cutscene && !skip) cutsceneCooldown = 8;
  // The intro scene replaced the old pre-match countdown, so once it is done -
  // or the player skips it - there is no reason to sit through the remainder
  // of a 5s countdown. Leave just the beat before the whistle. Skipping is
  // still not instant, so the cut never jumps straight from a shot to a
  // scramble.
  if (cutsceneKind === "intro") {
    cutsceneIntroDone = true;
    if (kickoffIntro > 0) kickoffIntro = Math.min(kickoffIntro, CUTSCENE_KICKOFF_LEAD);
  }
  cutscene = null;
  cutsceneKind = "";
  cutsceneWasRunning = matchRunning;
}
function cutsceneShot() {
  return cutscene ? (cutscene.shots[cutscene.i] || cutscene.shots[cutscene.shots.length - 1]) : null;
}
// Which moment, if any, deserves the screen. The biggest one wins.
function cutsceneWant() {
  // Full time: the whistle has gone on a match that really was being played.
  if (cutsceneMatchSeen && !matchRunning) return "fulltime";
  // Only the real interval: "INJURY TIME" and "EXTRA TIME" must not hijack it.
  if (breakPhase) return /\bHALF\b/i.test(breakPhase.label) ? "halftime" : null;
  if (goalPhase === "replay" || goalPhase === "celebrate") return "goal";
  if (kickoffIntro > 0 && !cutsceneIntroDone) return "intro";
  return null;
}
function updateCutscenes(dt) {
  if (cutsceneCooldown > 0) cutsceneCooldown--;
  if (matchRunning) cutsceneMatchSeen = true;
  const want = cutsceneWant();
  if (want && want !== cutsceneKind) {
    startCutscene(want);
  } else if (!want && cutscene) {
    endCutscene();
  }
  cutsceneWasRunning = matchRunning;
  if (!cutscene) return;
  // Any of the action keys bails out early, so nobody is forced to watch.
  if (!cutscene.skipped && cutscene.t > 0.45) {
    for (const k of CUTSCENE_SKIP_KEYS) {
      if (keys[k]) { endCutscene(true); return; }
    }
  }
  cutscene.t += dt;
  const shots = cutscene.shots;
  while (cutscene.i < shots.length - 1 && cutscene.t >= (cutscene.i + 1 < shots.length ? shots[cutscene.i].dur : Infinity)) {
    cutscene.t -= shots[cutscene.i].dur;
    cutscene.i++;
  }
  if (cutscene.t >= cutscene.total) endCutscene();
}
function drawCutscene() {
  if (!cutscene) return;
  const shot = cutsceneShot();
  if (!shot) return;
  const inQ = Math.max(0, Math.min(1, cutscene.t / shot.dur));
  const outQ = inQ > 0.82 ? (inQ - 0.82) / 0.18 : 0;
  const bar = H * CUTSCENE_BAR;
  ctx.save();
  // Letterbox bars.
  ctx.fillStyle = "rgba(4,6,14,0.92)";
  ctx.fillRect(0, 0, W, bar);
  ctx.fillRect(0, H - bar, W, bar);
  // A soft vignette pulls the eye to the middle of the frame.
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, cutscene.tint + (0.42 + outQ * 0.2).toFixed(3) + ")");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // Title, wiped in over the first third of the shot.
  const wipe = Math.max(0, Math.min(1, cutscene.t / (shot.dur * 0.34)));
  ctx.textAlign = "center";
  ctx.font = "bold " + Math.round(Math.max(26, Math.min(64, H * 0.075))) + "px Arial";
  ctx.globalAlpha = wipe * (1 - outQ);
  const ty = H * 0.3;
  const tw = ctx.measureText(cutscene.title).width;
  const cover = tw * wipe + 8;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(W / 2 - cover / 2, ty - Math.max(22, H * 0.05), cover, Math.max(34, H * 0.085));
  ctx.fillStyle = "#ffffff";
  ctx.fillText(cutscene.title, W / 2, ty);
  // Caption.
  ctx.font = "bold " + Math.round(Math.max(13, Math.min(22, H * 0.026))) + "px Arial";
  ctx.fillStyle = "#ffd700";
  ctx.globalAlpha = Math.max(0, Math.min(1, (inQ - 0.12) * 3)) * (1 - outQ);
  ctx.fillText(shot.sub, W / 2, ty + Math.max(26, H * 0.062));
  // Shot-progress strip inside the lower bar.
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(bar, H - bar + bar * 0.42, W - bar * 2, 3);
  ctx.fillStyle = "#ffd700";
  const seg = (W - bar * 2) / cutscene.shots.length;
  ctx.fillRect(bar + seg * cutscene.i, H - bar + bar * 0.42, seg * Math.min(1, inQ), 3);
  ctx.globalAlpha = 0.55;
  ctx.font = "11px Arial";
  ctx.fillStyle = "#c9d6ea";
  ctx.textAlign = "left";
  ctx.fillText("SKIP: press any action key", bar + 4, H - bar * 0.28);
  ctx.restore();
}

// --- Squad walk-out --------------------------------------------------------
// The eleven file out of the tunnel and take their positions during the
// kickoff countdown. Like the cutscenes this is decoration over a pause the
// game already has, so no real position ever moves: the walk-out lives purely
// in the renderer, which keeps an online match in step.
const WALKOUT_FRAMES = 150;      // ~2.5s to walk out
const WALKOUT_EDGE = 130;        // how far outside the pitch the tunnel is
let walkoutT = 0;                // 0 = in the tunnel, 1 = on the formation mark
let walkoutDone = false;         // only the first kick-off of a match walks out
let walkoutCards = null;         // built once, then cached
// Where a player starts, and how long after the whistle they set off.
function walkoutLane(p) {
  const idx = allPlayers.indexOf(p);
  const lead = p.team === "blue" ? -1 : 1;
  const rank = idx % 11;
  return {
    x: field.x + (lead < 0 ? -WALKOUT_EDGE : field.width + WALKOUT_EDGE),
    y: field.y + field.height * 0.5 + (rank - 5) * 24,
    lag: (idx % 11) * 0.018,
    phase: (idx % 7) * 0.9,
  };
}
// The position to DRAW this player at, or null when no walk-out is running.
function walkoutDrawPos(p) {
  // t === 0 is deliberate: the squad starts in the tunnel mouth, off the pitch,
  // so they walk in from off-screen rather than popping onto their marks.
  if (walkoutDone) return null;
  const lane = walkoutLane(p);
  const span = Math.max(0.001, 1 - lane.lag);
  const t = Math.max(0, Math.min(1, (walkoutT - lane.lag) / span));
  const e = 1 - Math.pow(1 - t, 2.2);   // ease-out: they slow into position
  return {
    x: lane.x + (p.x - lane.x) * e,
    y: lane.y + (p.y - lane.y) * e,
    // Stride cycle, kept in step with the walk rather than with sim ticks.
    phase: walkoutT * 6.28 + lane.phase,
    walking: t < 1,
  };
}
function walkoutTier(ovr) {
  if (ovr >= 85) return { name: "GOLD", a: "#f7d774", b: "#b8860b" };
  if (ovr >= 75) return { name: "SILVER", a: "#e3e8ee", b: "#8d99a6" };
  return { name: "BRONZE", a: "#e0a878", b: "#8c5a2b" };
}
// The stand-out player from each team earns a bonus card.
function walkoutCardList() {
  if (walkoutCards) return walkoutCards;
  const out = [];
  for (const team of ["blue", "red"]) {
    const squad = allPlayers.filter((p) => p.team === team && !p.sentOff);
    if (!squad.length) continue;
    const top = squad.reduce((a, b) => ((b.overall || 0) > (a.overall || 0) ? b : a));
    out.push({ p: top, team, ovr: top.overall || 0, tier: walkoutTier(top.overall || 0) });
  }
  walkoutCards = out;
  return out;
}
function updateWalkout() {
  if (kickoffIntro > 0) {
    if (!walkoutDone && walkoutT < 1) walkoutT = Math.min(1, walkoutT + 1 / WALKOUT_FRAMES);
  } else {
    // No kick-off countdown in progress. Either they are already out on their
    // marks, or this flow never had a walk-out at all (a shootout, or a match
    // dropped straight into play) - in both cases stop overriding the draw
    // position, or the squad would be stuck in the tunnel for the whole match.
    walkoutDone = true;
  }
}
function drawWalkoutCards() {
  if (walkoutDone || walkoutT <= 0.12) return;
  const cards = walkoutCardList();
  const q = Math.max(0, Math.min(1, (walkoutT - 0.12) / 0.3));
  const ease = 1 - Math.pow(1 - q, 3);
  const cw = Math.min(360, W * 0.3);
  const ch = cw * 0.42;
  ctx.save();
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    // The second card slides in a beat later.
    const qi = Math.max(0, Math.min(1, (walkoutT - 0.12 - i * 0.1) / 0.3));
    if (qi <= 0) continue;
    const e = 1 - Math.pow(1 - qi, 3);
    const x = field.x - 40 + (1 - e) * (-cw - 60);
    const y = H * 0.5 - ch * (i + 1) - 8;
    ctx.globalAlpha = Math.min(1, e * 1.4) * (walkoutT > 0.9 ? (1 - walkoutT) * 10 : 1);
    const g = ctx.createLinearGradient(x, y, x + cw, y + ch);
    g.addColorStop(0, c.tier.a);
    g.addColorStop(1, c.tier.b);
    ctx.fillStyle = g;
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, cw, ch, 10) : ctx.rect(x, y, cw, ch);
    ctx.fill();
    ctx.stroke();
    // Team stripe.
    ctx.fillStyle = c.team === "blue" ? "#168cff" : "#e63946";
    ctx.fillRect(x, y, 10, ch);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.font = "bold " + Math.round(ch * 0.17) + "px Arial";
    ctx.textAlign = "left";
    ctx.fillText(c.tier.name, x + 26, y + ch * 0.28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold " + Math.round(ch * 0.26) + "px Arial";
    ctx.fillText(displayNameFor(c.p) || "PLAYER", x + 26, y + ch * 0.6);
    ctx.font = Math.round(ch * 0.17) + "px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(String(c.p.role || "").toUpperCase(), x + 26, y + ch * 0.83);
    ctx.textAlign = "right";
    ctx.font = "bold " + Math.round(ch * 0.42) + "px Arial";
    ctx.fillText(String(c.ovr), x + cw - 16, y + ch * 0.68);
    // The face itself, clipped into the card.
    const hs = Math.round(ch * 0.62);
    const hx = x + cw - hs - 12;
    const hy = y + (ch - hs) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(hx, hy, hs, hs);
    ctx.clip();
    ctx.translate(hx, hy);
    paintHeadshot(ctx, headshotSeed(headshotKeyFor(c.p)), hs, c.team);
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hs, hs);
  }
  ctx.restore();
  void ease;
}

// --- Procedural headshots --------------------------------------------------
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

function drawScoreboard() {

  if (!matchRunning) return;

  // The pixel-art arcade HUD (drawArcadeHUD) owns the scoreboard in Pixel
  // Striker mode, so the smooth pill scoreboard stands down.
  if (typeof pixelArtOn === "function" && pixelArtOn()) return;

  const w = W;

  const cx = w / 2;

  const top = 40;

  const bh = 60;

  // Practice Arena is a free-play drill: no clubs, no score, no clock.
  if (currentMode === "practice") {
    ctx.save();
    ctx.font = "bold 34px Arial";
    const label = "PRACTICE";
    const tw = ctx.measureText(label).width;
    const bw = tw + 64;
    const bx = cx - bw / 2;
    ctx.fillStyle = "rgba(10, 12, 30, 0.72)";
    ctx.beginPath();
    ctx.arc(bx + bh / 2, top + bh / 2, bh / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(bx + bh / 2, top, bw - bh, bh);
    ctx.beginPath();
    ctx.arc(bx + bw - bh / 2, top + bh / 2, bh / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#7cffa8";
    ctx.fillText(label, cx, top + 42);
    ctx.textAlign = "left";
    ctx.restore();
    return;
  }

  const blueCode = FIFA_CODES[selectedTeam] || "???";

  const redCode = FIFA_CODES[getOpponentTeam()] || "???";

  ctx.save();

  ctx.font = "bold 38px Arial";

  const scoreTxt = blueScore + " - " + redScore;

  const scoreW = ctx.measureText(scoreTxt).width;

  ctx.font = "bold 32px Arial";

  const blueW = ctx.measureText(blueCode).width;

  const redW = ctx.measureText(redCode).width;

  const gap = 22;

  const bw = blueW + redW + scoreW + gap * 2 + 48;

  const bx = cx - bw / 2;

  // Pill background, centered on the top-middle of the screen.
  ctx.fillStyle = "rgba(10, 12, 30, 0.72)";

  ctx.beginPath();

  ctx.arc(bx + bh / 2, top + bh / 2, bh / 2, 0, Math.PI * 2);

  ctx.fill();

  ctx.fillRect(bx + bh / 2, top, bw - bh, bh);

  ctx.beginPath();

  ctx.arc(bx + bw - bh / 2, top + bh / 2, bh / 2, 0, Math.PI * 2);

  ctx.fill();

  const yBase = top + 42;

  // Blue code (left), score (center), red code (right).
  ctx.textAlign = "right";

  ctx.font = "bold 32px Arial";

  ctx.fillStyle = "#7cc5ff";

  ctx.fillText(blueCode, cx - (scoreW / 2 + gap), yBase);

  ctx.textAlign = "left";

  ctx.fillStyle = "#ff9a9a";

  ctx.fillText(redCode, cx + (scoreW / 2 + gap), yBase);

  ctx.textAlign = "center";

  ctx.font = "bold 38px Arial";

  ctx.fillStyle = "#ffffff";

  ctx.fillText(scoreTxt, cx, yBase);

  // Match clock directly UNDER the score, as requested. It used to live only
  // in the DOM header above the canvas, which meant it was off the top of the
  // screen in fullscreen and nowhere near the score it belongs to. Reuse the
  // exact same wording as updateTimer() so the two never disagree.
  ctx.textAlign = "center";
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = "#ffd75e";
  ctx.fillText(matchClockText(), cx, yBase + 38);

  ctx.restore();

}

// The clock string shown on the canvas scoreboard. updateTimer() owns the
// DOM copy of this; both read from the same rules so they stay identical.
function matchClockText() {
  if (breakPhase) return breakPhase.label + " " + Math.max(0, breakPhase.seconds);
  const min = currentMinute();
  if (matchPhase === "extra") {
    if (matchTime > 30 && stoppageMins > 0) {
      const base = clockHalf === 4 ? 120 : 105;
      const added = Math.min(stoppageMins, Math.ceil((matchTime - 30) / 2));
      return base + "+" + added + "' EX";
    }
    return min + "' EX";
  }
  if (matchPhase === "sudden") return "SUDDEN DEATH";
  if (matchPhase === "penalties") return "PENALTIES";
  if (matchPhase === "normal") {
    if (matchTime > 90 && stoppageMins > 0) {
      const base = clockHalf === 2 ? 90 : 45;
      const added = Math.min(stoppageMins, Math.ceil((matchTime - 90) / 2));
      return base + "+" + added + "' - " + (clockHalf === 1 ? "1st Half" : "2nd Half");
    }
    return min + "' - " + (clockHalf === 1 ? "1st Half" : "2nd Half");
  }
  return min + "'";
}

function cardCounts() {

  let yb = 0, rb = 0, yr = 0, rr = 0;

  for (const p of teammates) {

    if (p.cards === 1) yb++;

    else if (p.cards >= 2) rb++;

  }

  if (player) {

    if (player.cards === 1) yb++;

    else if (player.cards >= 2) rb++;

  }

  for (const p of opponents) {

    if (p.cards === 1) yr++;

    else if (p.cards >= 2) rr++;

  }

  return { yb, rb, yr, rr };

}

function drawCardTallies() {

  if (!matchRunning) return;

  // Practice Arena keeps no cards.
  if (currentMode === "practice") return;

  const { yb, rb, yr, rr } = cardCounts();

  const cx = W / 2;

  // Sits BELOW the scoreboard pill and the new match clock beneath it. The
  // clock was added under the score at y = 114, which left this pill at 112
  // overlapping it, so the tallies were pushed down to clear both.
  const top = 148;

  const bh = 40;

  ctx.save();

  ctx.font = "bold 22px Arial";

  ctx.textAlign = "center";

  const labelTxt = "CARDS";

  const blueTxt = "Y" + yb + " R" + rb;

  const redTxt = "Y" + yr + " R" + rr;

  const labW = ctx.measureText(labelTxt).width;

  const blueW = ctx.measureText(blueTxt).width;

  const redW = ctx.measureText(redTxt).width;

  const sepW = ctx.measureText("|").width;

  const gapMid = 18;

  const gapLab = 12;

  const bw = labW + gapLab + blueW + gapMid + sepW + gapMid + redW + 34;

  const bx = cx - bw / 2;

  // Pill background so the tallies read clearly under the scoreboard.
  ctx.fillStyle = "rgba(10, 12, 30, 0.65)";

  ctx.beginPath();

  ctx.arc(bx + bh / 2, top + bh / 2, bh / 2, 0, Math.PI * 2);

  ctx.fill();

  ctx.fillRect(bx + bh / 2, top, bw - bh, bh);

  ctx.beginPath();

  ctx.arc(bx + bw - bh / 2, top + bh / 2, bh / 2, 0, Math.PI * 2);

  ctx.fill();

  const yBase = top + 28;

  let x = bx + 17;

  ctx.textAlign = "left";

  ctx.fillStyle = "#9aa7b5";

  ctx.fillText(labelTxt, x, yBase);

  x += labW + gapLab;

  ctx.fillStyle = "#7cc5ff";

  ctx.fillText(blueTxt, x, yBase);

  x += blueW + gapMid;

  ctx.fillStyle = "#ffffff";

  ctx.fillText("|", x, yBase);

  x += sepW + gapMid;

  ctx.fillStyle = "#ff9a9a";

  ctx.fillText(redTxt, x, yBase);

  ctx.restore();

}

function drawCountdown() {
  // The broadcast intro is letterboxed and captioned, so the countdown disc
  // would sit right on top of the shot it is meant to be counting down to.
  if (cutscene && cutsceneKind === "intro") return;


  const fkWait = freekick && freekick.frames < freekick.wait;

  const pkWait = matchPenalty && matchPenalty.phase === "wait";

  if (kickoffIntro <= 0 && (postGoalPause <= 0 || goalPhase !== "") && !fkWait && !pkWait) return;

  const spot = projectPoint(PITCH_CX, PITCH_CY);

  if (!spot) return;

  const pulse = 1 + 0.08 * Math.sin(performance.now() / 90);

  const size = Math.max(42, 110 * Math.min(1.6, spot.s) * pulse);

  ctx.font = "bold " + size + "px Arial";

  ctx.textAlign = "center";

  ctx.beginPath();

  ctx.arc(spot.x, spot.y, size * 0.6, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(10, 12, 30, 0.75)";

  ctx.fill();

  ctx.fillStyle = "#ffffff";

  ctx.fillText(kickoffIntro > 0 ? Math.max(1, Math.ceil(kickoffIntro / 60)) : countdownSeconds, spot.x, spot.y + size * 0.35);

  ctx.font = "bold " + Math.max(14, size * 0.18) + "px Arial";

  ctx.fillStyle = "#ffd700";

  ctx.fillText(fkWait ? "FREE KICK IN" : (pkWait ? "PENALTY IN" : "KICKOFF IN"), spot.x, spot.y - size * 0.55);

  ctx.textAlign = "left";

}
function drawAimCursor() {
  const kickRange = Math.max(45, Math.min(100, 65 * (player.dribbling / 70)));
  if (distance(player, ball) >= kickRange) return;

  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const length = Math.hypot(dx, dy) || 1;
  let ux = dx / length;
  let uy = dy / length;
  // Controller precision aim previews where the stick is aiming, so the arc
  // you see on the turf is where the shot will actually go.
  const stickAimDir = stickWorldAim();
  if (stickAimDir) {
    ux = stickAimDir[0];
    uy = stickAimDir[1];
  }
  const basePower = Math.max(7, Math.min(20, 12 * (player.shooting / 70)));
  const chargeMult = player.charging
    ? MIN_CHARGE_MULTIPLIER + (player.chargeFrames / MAX_CHARGE_FRAMES) * (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER)
    : MIN_CHARGE_MULTIPLIER;
  const range = basePower * 15 * chargeMult;
  const now = performance.now() * 0.005;

  ctx.save();
  ctx.lineCap = "round";
  for (let t = 0.08; t <= 1; t += 0.09) {
    const pt = projectPoint(ball.x + ux * range * t, ball.y + uy * range * t);
    ctx.strokeStyle = player.charging ? "rgba(255,215,0,0.95)" : "rgba(255,255,255,0.85)";
    const alpha = 0.15 + (1 - t) * 0.55;
    ctx.fillStyle = "rgba(255,255,255," + alpha.toFixed(2) + ")";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(1.5, pt.s * 2.2 * t * (player.charging ? 1.4 : 1)), 0, Math.PI * 2);
    ctx.fill();
  }

  const end = projectPoint(ball.x + ux * range, ball.y + uy * range);
  if (end) {
    const pulse = 1 + 0.18 * Math.sin(now * 6);
    ctx.strokeStyle = player.charging ? "rgba(255,215,0,0.95)" : "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(2, end.s * 4 * pulse);
    ctx.beginPath();
    ctx.arc(end.x, end.y, Math.max(4, end.s * 9 * pulse), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = player.charging ? "rgba(255,215,0,0.95)" : "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(end.x, end.y, Math.max(2, end.s * 3.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawGoal(gx) {
  drawGoalFrame(gx, 0.45, 11);
}

 

function boneFaces(x0, y0, z0, x1, y1, z1, r0, r1, seg) {
  seg = seg || 4;
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const L = Math.hypot(dx, dy, dz) || 1;
  const ax = dx / L, ay = dy / L, az = dz / L;
  let hx, hy, hz;
  if (Math.abs(az) < 0.92) { hx = 0; hy = 0; hz = 1; }
  else { hx = 1; hy = 0; hz = 0; }
  let ux = ay * hz - az * hy, uy = az * hx - ax * hz, uz = ax * hy - ay * hx;
  const ul = Math.hypot(ux, uy, uz) || 1;
  ux /= ul; uy /= ul; uz /= ul;
  const vx = ay * uz - az * uy, vy = az * ux - ax * uz, vz = ax * uy - ay * ux;
  const faces = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0);
    const c1 = Math.cos(a1), s1 = Math.sin(a1);
    faces.push([
      [x0 + ux * r0 * c0 + vx * r0 * s0, y0 + uy * r0 * c0 + vy * r0 * s0, z0 + uz * r0 * c0 + vz * r0 * s0],
      [x1 + ux * r1 * c0 + vx * r1 * s0, y1 + uy * r1 * c0 + vy * r1 * s0, z1 + uz * r1 * c0 + vz * r1 * s0],
      [x1 + ux * r1 * c1 + vx * r1 * s1, y1 + uy * r1 * c1 + vy * r1 * s1, z1 + uz * r1 * c1 + vz * r1 * s1],
      [x0 + ux * r0 * c1 + vx * r0 * s1, y0 + uy * r0 * c1 + vy * r0 * s1, z0 + uz * r0 * c1 + vz * r0 * s1]
    ]);
  }
  return faces;
}

function cylFaces(cx, cy, z0, z1, rxA, ryA, rxB, ryB, seg) {
  seg = seg || 8;
  const faces = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0);
    const c1 = Math.cos(a1), s1 = Math.sin(a1);
    faces.push([
      [cx + c0 * rxB, cy + s0 * ryB, z0],
      [cx + c0 * rxA, cy + s0 * ryA, z1],
      [cx + c1 * rxA, cy + s1 * ryA, z1],
      [cx + c1 * rxB, cy + s1 * ryB, z0]
    ]);
  }
  return faces;
}

function bone(x0, y0, z0, x1, y1, z1, r0, r1, color) {
  drawSolid(boneFaces(x0, y0, z0, x1, y1, z1, r0, r1, 4), color);
}

function drawClassicPlayer(p, proj) {
  const r = Math.max(3, p.radius * proj.s);
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.strokeStyle = p.role === "goalkeeper" ? "#ffd700" : "white";
  ctx.lineWidth = 2;
  ctx.stroke();
  if (p === localPlayer) {
    const pulse = (Date.now() % 600) / 600;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, r + 8 + pulse * 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  const isLocal = p === localPlayer;
  const isOppCarrier = !isLocal && localPlayer && p.team !== localPlayer.team && ballCarrier === p;
  if (isLocal || isOppCarrier) {
    const displayName = p.name || (isLocal ? playerName : "");
    if (displayName) {
      ctx.fillStyle = isLocal ? "#ffd700" : "#ff8b8b";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(displayName, proj.x, proj.y - 40);
    }
  }
  if (p.indicatorFrames > 0) {
    ctx.fillStyle = "#62e36b";
    ctx.font = "bold 18px Arial";
    ctx.fillText(p.indicatorText, proj.x, proj.y - 40);
  }
  if (p === localPlayer && p.charging) {
    const chargeFraction = p.chargeFrames / MAX_CHARGE_FRAMES;
    const barWidth = 34;
    const barHeight = 5;
    const barX = proj.x - barWidth / 2;
    const barY = proj.y - 58;

    ctx.fillStyle = "#263746";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = chargeFraction < 0.5 ? "#ffd700" : "#e63946";
    ctx.fillRect(barX, barY, barWidth * chargeFraction, barHeight);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
}

// Render-only bookkeeping for the run-cycle animation. This must live
// OUTSIDE the player objects: mutating shared simulation state while drawing
// makes the sim depend on how many frames each peer happened to render, which
// breaks two-peer lockstep verification.
const lastDrawnPos = new WeakMap();

function drawPlayer(p) {
  if (!p) return;
  // A squad walk-out draws players from the tunnel to their marks; the real
  // positions never move, so the simulation is untouched.
  const wq = walkoutDrawPos(p);
  const proj = projectPoint(wq ? wq.x : p.x, wq ? wq.y : p.y);
  if (!proj) return;
  if (SETTINGS.oldPlayers) { drawClassicPlayer(p, proj); return; }
  const k = (p.radius / 18) * FIG_SIZE;
  const legH = 16.5 * k;
  const torsoH = 21 * k;
  const headR = 5.4 * k;
  const headZ = legH + torsoH + 1.3 * k;
  const topZ = headZ + headR * 0.95;
  const armOff = 4.6 * k;

  // ---- animation state ----
  const tw = performance.now() * 0.004;
  const prevDrawn = lastDrawnPos.get(p);
  const moving = wq ? wq.walking : (prevDrawn ? (prevDrawn[0] !== p.x || prevDrawn[1] !== p.y) : false);
  lastDrawnPos.set(p, wq ? [wq.x, wq.y] : [p.x, p.y]);
  const walkPhase = wq ? wq.phase : (p.walk || 0) * 0.18;
  const kickT = p.kickAnim || 0;
  const kicking = kickT > 0;
  const kickF = 1 - kickT / 14;
  const tackleT = p.tackleAnim || 0;
  const tackling = tackleT > 0;
  const tackleDur = p.tackleDuration || 12;
  const tackleF = 1 - tackleT / Math.max(1, tackleDur);
  const downed = (p.stumble || 0) > 0;
  const diveT = p.diveFrames || 0;
  const diving = p.role === "goalkeeper" && diveT > 0;
  const lean = ballCarrier === p && !kicking && !tackling ? 1.4 * k : 0;

  let xoff = lean + (kicking ? -1.5 * k : 0) + (tackling ? 2.5 * k : 0);
  let bob = 0;
  let legOff = 0;
  let kneeLift = 0;
  let kickLeg = 0;
  let kickLift = 0;
  let armReach = 0;
  let armLift = 0;
  let armLiftA = 0;
  let armLiftB = 0;
  let armHigh = 0;
  let runLean = 0;
  if (tackling) {
    // Slide tackle: the whole body drops low, arms reach out, and one leg
    // extends forward to poke the ball loose.
    bob = -tackleF * 3 * k;
    legOff = -tackleF * 5 * k;
    kickLeg = tackleF * 7 * k;
    kickLift = tackleF * 3 * k;
    armLift = tackleF * 3.5 * k;
    armReach = tackleF * 1.5 * k;
  } else if (kicking) {
    // Follow-through kick: the kicking leg reaches forward and up while
    // the other leg plants; the torso leans back and the opposite arm
    // swings back-and-up for balance.
    kickLeg = kickF * 7 * k;
    kickLift = kickF * 3 * k;
    legOff = -kickF * 1 * k;
    bob = kickF * 0.8 * k;
    armReach = kickF * 2.2 * k;
    armLiftA = kickF * 3 * k;
  } else if ((p.celebrate || 0) > 0) {
    // Goal celebration: bouncing hops with both arms flung up overhead.
    const hopPhase = (p.celebratePhase || tw);
    bob = -(Math.abs(Math.sin(hopPhase * 1.4)) * 2.6 * k + 0.6 * k);
    armHigh = 5.5 * k;
    armLift = 2.3 * k;
    armLiftA = 1.1 * k;
    armLiftB = 1.1 * k;
    armReach = 0.5 * k;
    xoff += 0.7 * k;
  } else if (moving) {
    // Run cycle: legs scissor in a wide stride, the trailing knee lifts
    // each step (kneeLift), the body springs off each footfall (smooth
    // two-beat bob, no cusp), and the torso leans into the run.
    const stride = Math.sin(walkPhase);
    legOff = stride * 4.6 * k;
    kneeLift = Math.cos(walkPhase) * 1.4 * k;
    bob = -(0.5 + 0.5 * Math.cos(walkPhase * 2)) * 0.9 * k;
    armReach = -stride * 1.8 * k;
    armLiftA = (stride > 0 ? 0 : -stride) * 1.4 * k;
    armLiftB = (stride > 0 ? stride : 0) * 1.4 * k;
    runLean = 1.4 * k;
    xoff += runLean;
  } else {
    bob = Math.sin(tw * 2.2) * 0.7 * k;
  }

  const shortsColor = p.role === "referee" ? "#1e1e2c" : "#f4f6f9";
  const sleeve = shadeColor(p.color, 0.72);
  const bootColor = "#0d0d16";

  // ground shadow
  ctx.beginPath();
  ctx.ellipse(proj.x, proj.y, Math.max(2, proj.s * 13 * FIG_SIZE), Math.max(1, proj.s * 4.5 * FIG_SIZE), 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  // name label (controlled player and opponent on the ball, scaled with depth)
  const isLocal = p === localPlayer;
  const isOppCarrier = !isLocal && localPlayer && p.team !== localPlayer.team && ballCarrier === p;
  if (isLocal || isOppCarrier) {
    const displayName = p.name || (isLocal ? playerName : "");
    if (displayName) {
      const fontSize = Math.max(8, Math.min(22, 22 * (proj.s / 0.5)));
      const labelY = proj.y - (downed ? 6 * k : topZ + bob) * proj.s - 4;
      ctx.fillStyle = isLocal ? "#ffd700" : "#ff8b8b";
      ctx.font = "bold " + fontSize + "px Arial";
      ctx.textAlign = "center";
      ctx.fillText(displayName, proj.x, labelY);
    }
  }

  // A keeper in a committed dive is drawn lying ACROSS the goal: body flat,
  // trailing legs on one side, and the leading arm fully stretched past his
  // head toward the shot.
  if (diving) {
    const dF = 1 - diveT / 26;
    // Ease the full-stretch reach in fast, then hold it so the save reads
    // as a proper fling rather than a flick: the leading arm snaps past the
    // head while the body follows flat behind it.
    const ext = 0.55 + 0.6 * Math.sin(Math.min(1, Math.max(0, dF)) * Math.PI * 0.5);
    const dir = p.diveDir || 1;
    const span = 4.7 * k * Math.min(1, ext);
    const zc = 2.4 * k;
    // Full stretch, trailing legs on one side of the body.
    drawSolid(boxFaces(p.x - 1.5 * k, p.y + dir * (span + 3 * k), 0.35 * k, 1.5 * k, 3.6 * k, 1.5 * k), "#2c2c3e");
    drawSolid(boxFaces(p.x + 1.5 * k, p.y + dir * (span + 3 * k), 0.35 * k, 1.5 * k, 3.6 * k, 1.5 * k), "#2c2c3e");
    drawSolid(boxFaces(p.x - 1.5 * k, p.y + dir * (span + 5 * k), 0.35 * k, 1.3 * k, 1.9 * k, 1.3 * k), bootColor);
    drawSolid(boxFaces(p.x + 1.5 * k, p.y + dir * (span + 5 * k), 0.35 * k, 1.3 * k, 1.9 * k, 1.3 * k), bootColor);
    // The torso throws itself outward and slightly up as the dive builds.
    drawSolid(boxFaces(p.x, p.y + dir * span * 0.12, zc * (0.5 + 0.25 * ext), 3.4 * k, span, 3.1 * k), p.color);
    // Trailing arm held back for balance, leading arm dead-straight past
    // the head toward the sphere.
    drawSolid(boxFaces(p.x - 1.8 * k, p.y + dir * span * 0.55, zc * 0.4, 1.2 * k, span * 0.6, 1.3 * k), sleeve);
    drawSolid(boxFaces(p.x, p.y - dir * (span * 0.95), zc * 0.85, 1.5 * k, span * 1.05, 1.35 * k), sleeve);
    drawSphere(p.x, p.y - dir * (span + 1.7 * k), zc * 0.95, headR * 0.9, "#ffe6c4", "#e0a96d");
    return;
  }

  // A player who has just been tackled goes down and lies flat until the
  // hurdle timer runs out (a few seconds on the ground).
  if (downed) {
    const lay = 2.2 * k;
    drawSolid(boxFaces(p.x - 8.5 * k, p.y - 1.6 * k, 0.4 * k, 4.5 * k, 2.4 * k, 4.4 * k), "#2c2c3e");
    drawSolid(boxFaces(p.x - 8.5 * k, p.y + 1.6 * k, 0.4 * k, 4.5 * k, 2.4 * k, 4.4 * k), "#2c2c3e");
    drawSolid(boxFaces(p.x - 7.5 * k, p.y - 1.6 * k, 0.4 * k, 3 * k, 1.6 * k, 3 * k), bootColor);
    drawSolid(boxFaces(p.x - 7.5 * k, p.y + 1.6 * k, 0.4 * k, 3 * k, 1.6 * k, 3 * k), bootColor);
    drawSolid(boxFaces(p.x - 2 * k, p.y, 0.4 * k, 7 * k, 3.6 * k, lay > 2 ? 8 * k : 7.4 * k), p.color);
    drawSolid(boxFaces(p.x - 1 * k, p.y - (armOff - 1 * k), 0.4 * k, 2.8 * k, 3 * k, 4.6 * k), sleeve);
    drawSolid(boxFaces(p.x - 1 * k, p.y + (armOff - 1 * k), 0.4 * k, 2.8 * k, 3 * k, 4.6 * k), sleeve);
    drawSphere(p.x + 5.5 * k, p.y, 1.4 * k, headR * 0.85, "#ffe6c4", "#e0a96d");
    return;
  }

  const skinTone = "#e2ac7c";
  const skinShade = "#cf9568";
  const sockC = shadeColor(p.color, 0.72);
  const hipX = p.x + xoff;
  const hipZ = bob + legH;
  const cy2 = p.y;
  const side = 3.5 * k;

  // legs: thigh -> knee -> sock -> boot, bending through the run / kick cycle
  const fA = { x: hipX + legOff + kickLeg, y: cy2 - side, z: Math.max(0.2 * k, bob + kickLift * 0.4 + Math.max(0, kneeLift) * 0.5) };
  const fB = { x: hipX - legOff, y: cy2 + side, z: Math.max(0.2 * k, bob + Math.max(0, -kneeLift) * 0.4) };
  const kneeA = { x: (hipX + fA.x) / 2 + (legOff > 0 ? 1.4 * k : 0.6 * k) + kickLeg * 0.3, y: fA.y, z: hipZ - legH * 0.5 };
  const kneeB = { x: (hipX + fB.x) / 2 + (legOff < 0 ? 1.4 * k : 0.6 * k), y: fB.y, z: hipZ - legH * 0.5 };
  const ankA = { x: fA.x, y: fA.y, z: fA.z + 2.3 * k };
  const ankB = { x: fB.x, y: fB.y, z: fB.z + 2.3 * k };
  bone(hipX, cy2 - side, hipZ, kneeA.x, kneeA.y, kneeA.z, 1.45 * k, 1.2 * k, skinTone);
  bone(kneeA.x, kneeA.y, kneeA.z, ankA.x, ankA.y, ankA.z, 1.2 * k, 1.0 * k, sockC);
  bone(ankA.x, ankA.y, ankA.z, fA.x, fA.y, fA.z + 0.5 * k, 1.0 * k, 1.5 * k, bootColor);
  bone(hipX, cy2 + side, hipZ, kneeB.x, kneeB.y, kneeB.z, 1.45 * k, 1.2 * k, skinTone);
  bone(kneeB.x, kneeB.y, kneeB.z, ankB.x, ankB.y, ankB.z, 1.2 * k, 1.0 * k, sockC);
  bone(ankB.x, ankB.y, ankB.z, fB.x, fB.y, fB.z + 0.5 * k, 1.0 * k, 1.5 * k, bootColor);

  // shorts (tapered)
  drawSolid(cylFaces(hipX, cy2, hipZ - 0.6 * k, hipZ + 3 * k, 3.3 * k, 2.75 * k, 2.6 * k, 2.0 * k, 6), shortsColor);

  // torso (jersey) - broad at the shoulders, narrower at the hips
  drawSolid(cylFaces(hipX, cy2, hipZ + 2 * k, hipZ + torsoH, 4.4 * k, 3.9 * k, 3.3 * k, 2.6 * k, 8), p.color);

  // arms: shoulder -> elbow -> hand (swing opposite the legs, sleeves + skin)
  const shZ = hipZ + torsoH * 0.9;
  const hzA = hipZ + torsoH * 0.4 + armHigh;
  const shA = { x: hipX - armReach * 0.5, y: cy2 - armOff + armLift + armLiftA, z: shZ };
  const shB = { x: hipX + armReach * 0.5, y: cy2 + armOff - armLift - armLiftB, z: shZ };
  const hA = { x: hipX - armReach, y: cy2 - armOff + armLift + armLiftA, z: hzA };
  const hB = { x: hipX + armReach, y: cy2 + armOff - armLift - armLiftB, z: hzA };
  const elA = { x: (shA.x + hA.x) / 2 + 0.7 * k, y: (shA.y + hA.y) / 2, z: (shA.z + hA.z) / 2 };
  const elB = { x: (shB.x + hB.x) / 2 + 0.7 * k, y: (shB.y + hB.y) / 2, z: (shB.z + hB.z) / 2 };
  bone(shA.x, shA.y, shA.z, elA.x, elA.y, elA.z, 1.45 * k, 1.15 * k, sleeve);
  bone(elA.x, elA.y, elA.z, hA.x, hA.y, hA.z, 1.15 * k, 1.0 * k, sleeve);
  drawDot(hA.x, hA.y, hA.z, 1.15 * k, skinTone);
  bone(shB.x, shB.y, shB.z, elB.x, elB.y, elB.z, 1.45 * k, 1.15 * k, sleeve);
  bone(elB.x, elB.y, elB.z, hB.x, hB.y, hB.z, 1.15 * k, 1.0 * k, sleeve);
  drawDot(hB.x, hB.y, hB.z, 1.15 * k, skinTone);

  // neck + head
  bone(hipX, cy2, hipZ + torsoH - 0.4 * k, hipX, cy2, hipZ + torsoH + 1.3 * k, 1.1 * k, 0.85 * k, skinTone);
  const headCz = hipZ + torsoH + 2.1 * k;
  drawSphere(hipX, cy2, headCz, headR, skinTone, skinShade);

  // hair cap + simple face that turns with the run direction
  const hc = proj3(hipX, cy2, headCz);
  if (hc) {
    const hrad = Math.max(1, headR * hc.s);
    ctx.fillStyle = "#33261a";
    ctx.beginPath();
    ctx.arc(hc.x, hc.y - hrad * 0.38, hrad * 0.9, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hc.x, hc.y - hrad * 0.28, hrad * 0.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.closePath();
    ctx.fill();
    const facingAway = (p.facingX ?? (p.team === "blue" ? 1 : -1)) > 0;
    if (!facingAway) {
      ctx.fillStyle = "rgba(22,10,4,0.9)";
      ctx.beginPath();
      ctx.arc(hc.x - hrad * 0.32, hc.y + hrad * 0.08, hrad * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hc.x + hrad * 0.32, hc.y + hrad * 0.08, hrad * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // jersey number band on the back (visible when facing goal)
  if (p.team === "blue") {
    const backP = proj3(hipX - 4.1 * k, cy2, bob + legH + torsoH * 0.5);
    if (backP && Math.abs(backP.x - proj.x) > 1) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(
        backP.x - backP.s * 2.4 * FIG_SIZE,
        backP.y - backP.s * 2.9 * FIG_SIZE,
        backP.s * 4.8 * FIG_SIZE,
        backP.s * 5.6 * FIG_SIZE
      );
    }
  }

  // GK ring on the jersey
  if (p.role === "goalkeeper") {
    const chest = proj3(hipX, cy2, bob + legH + torsoH * 0.55);
    if (chest) {
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = Math.max(1, proj.s * 1.4);
      ctx.beginPath();
      ctx.arc(chest.x, chest.y, Math.max(2, proj.s * 8), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // selection pulse ring
  if (p === localPlayer) {
    ctx.beginPath();
    ctx.ellipse(proj.x, proj.y, Math.max(3, proj.s * 16 * FIG_SIZE), Math.max(1.5, proj.s * 5 * FIG_SIZE), 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // pass indicator
  if (p.indicatorFrames > 0) {
    ctx.fillStyle = "#62e36b";
    ctx.font = "bold " + (fontSize * 0.9) + "px Arial";
    ctx.fillText(p.indicatorText, proj.x, labelY - fontSize);
  }

  // shot charge bar
  if (p === localPlayer && p.charging) {
    const chargeFraction = p.chargeFrames / MAX_CHARGE_FRAMES;
    const barWidth = Math.max(24, proj.s * 22);
    const barHeight = 5;
    const barX = proj.x - barWidth / 2;
    const barY = labelY - fontSize - 10;

    ctx.fillStyle = "#263746";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = chargeFraction < 0.5 ? "#ffd700" : "#e63946";
    ctx.fillRect(barX, barY, barWidth * chargeFraction, barHeight);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
}
function drawBall() {
  const p = proj3(ball.x, ball.y, ball.radius + (ball.z || 0));
  if (!p) return;
  const r = Math.max(1.5, ball.radius * p.s * 1.0);

  // ground shadow (tightens and fades as the ball climbs)
  const g = proj3(ball.x, ball.y, 0);
  if (g) {
    const lift = Math.min(1, (ball.z || 0) / 120);
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, r * (1.15 - lift * 0.55), r * (0.4 - lift * 0.16), 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0," + (0.3 - lift * 0.19).toFixed(3) + ")";
    ctx.fill();
  }

  // shaded ball
  const ballBase = ballColorSetting();
  const ballPanel = ballPanelSetting();
  const grad = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
  grad.addColorStop(0, mixHex(ballBase, "#ffffff", 0.35));
  grad.addColorStop(0.6, ballBase);
  grad.addColorStop(1, mixHex(ballBase, "#000000", 0.3));
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = ballPanel;
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.stroke();

  // pentagon panel
  ctx.beginPath();
  const pp = r * 0.42;
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = p.x - r * 0.15 + Math.cos(ang) * pp;
    const y = p.y - r * 0.1 + Math.sin(ang) * pp;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = ballPanel;
  ctx.fill();
}
function distance(a, b) { 

  return Math.hypot(a.x - b.x, a.y - b.y); 

} 

 

function keepInsideField(p) { 

  p.x = Math.max( 

    field.x + p.radius, 

    Math.min(field.x + field.width - p.radius, p.x) 

  ); 

 

  p.y = Math.max( 

    field.y + p.radius, 

    Math.min(field.y + field.height - p.radius, p.y) 

  ); 

} 

 

function moveToward(object, x, y, speed) { 

  const dx = x - object.x; 

  const dy = y - object.y; 

  const length = Math.hypot(dx, dy); 

 

  if (length > 2) { 

    object.x += dx / length * speed; 

    object.y += dy / length * speed; 

    object.facingX = dx / length; 

    object.facingY = dy / length; 

    object.walk = (object.walk || 0) + speed; 

  } 

} 

 

function moveHuman() { 

  // Sent off: the user watches from the bench, play carries on.
  if (player.sentOff) return;

  // A tackle just made the player stumble - he is stunned a moment.
  if ((player.stumble || 0) > 0) { 

    player.stumble--; 

    // Stumbling is the recovery half of a sprint: hold still and the bar
    // refills, so the next burst is available instead of permanently spent.
    player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_REGEN_RATE * 1.5);

updateEnergyBar();

    return;

  }

  // Sliding tackle: the player is committed — he glides along the ground
  // in the direction he was sprinting and can't steer until he stops.
  if ((player.slideTackle || 0) > 0) {
    const d = player.slideTackle;
    player.slideTackle--;
    const sp = player.speed * 2.2 * (d / 14);
    player.x += (player.slideDx || 0) * sp;
    player.y += (player.slideDy || 0) * sp;
    keepInsideField(player);
    // A slide is a committed burst of pace, so it keeps burning stamina
    // while it plays out. Without this the bar sat at full through the whole
    // slide and the sprint it was meant to have cost was never paid for.
    player.energy = Math.max(0, player.energy - ENERGY_DRAIN_RATE * 1.6);
    updateEnergyBar();
    return;
  }

  let dx = 0; 

  let dy = 0;

 

  // Movement is mapped to the CAMERA frame, not the world. W runs straight up
  // the screen, S back down, and A/D slide left/right on screen, so when the
  // side camera has pivoted toward the goal, holding W carries the player
  // diagonally across the pitch in the direction the camera faces instead of
  // up the fixed -Y world axis. PIVOT_C/PIVOT_S rotate screen-space inputs
  // into world space:
  //   screen-up   (W) = (PIVOT_S, -PIVOT_C)
  //   screen-down (S) = (-PIVOT_S,  PIVOT_C)
  //   screen-right(D) = ( PIVOT_C,  PIVOT_S)
  //   screen-left (A) = (-PIVOT_C, -PIVOT_S)
  // With no pivot (cam2d or straight-on side view) this collapses back to the
  // classic WASD world mapping.
  const u = (keys["w"] || keys["arrowup"] || vInput.up) ? 1 : 0;
  const dn = (keys["s"] || keys["arrowdown"] || vInput.down) ? 1 : 0;
  const lt = (keys["a"] || keys["arrowleft"] || vInput.left) ? 1 : 0;
  const rt = (keys["d"] || keys["arrowright"] || vInput.right) ? 1 : 0;
  const lr = rt - lt;
  const ud = u - dn;
  // The screen-to-world pivot is a RENDER-RATE camera value (smoothed from
  // rAF timing), so it can differ between two peers running lockstep and would
  // silently rotate the identical replicated input into different movements.
  // In a lockstep match the sim must use the fixed world frame instead.
  const pc = netLockstepActive() ? 1 : PIVOT_C;
  const ps = netLockstepActive() ? 0 : PIVOT_S;
  dx = lr * pc + ud * ps;
  dy = lr * ps - ud * pc;

 

  const holdingSprint = (keys["shift"] || vInput.sprint) && (dx || dy);

  const wantsSprint = holdingSprint && player.energy > 0;



 

  if (dx || dy) { 

    const length = Math.hypot(dx, dy); 

    player.facingX = dx / length; 

    player.facingY = dy / length; 

    // Shielding (LT + down while on the ball) kills the pace: the carrier
    // turns his back and rolls at walking speed to keep possession.
    const shielding = ballCarrier === player && leftTriggerHeld() && dy > 0;
    const effectiveSpeed = player.speed * (wantsSprint ? 1.4 : 1) * (shielding ? 0.55 : 1); 

 

player.x += dx / length * effectiveSpeed; 
    player.walk = (player.walk || 0) + effectiveSpeed; 

    player.y += dy / length * effectiveSpeed; 
  } 

  // Stamina: sprinting burns it, everything else replenishes it. The drain
  // used to sit immediately above the regen inside the movement block, so the
  // two cancelled out and the bar only ever fell - which meant sprint ran out
  // after a couple of seconds and never came back. Drain only while the
  // sprint is actually being granted, and refill whenever it is not.
  if (wantsSprint) {
    player.energy = Math.max(0, player.energy - ENERGY_DRAIN_RATE);
  } else {
    player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_REGEN_RATE);
  }

 

  updateEnergyBar(); 

  // Can't dribble the ball across the goal line: keep the glued ball
  // inside the pitch no matter which way the carrier is facing.
  if (ballCarrier === player) {
    const gux = player.facingX || (player.team === "blue" ? 1 : -1);
    const guy = player.facingY || 0;
    const goff = player.radius + ball.radius + 5;
    player.x = Math.max(
      field.x + ball.radius - gux * goff,
      Math.min(field.x + field.width - ball.radius - gux * goff, player.x)
    );
    player.y = Math.max(
      field.y + ball.radius - guy * goff,
      Math.min(field.y + field.height - ball.radius - guy * goff, player.y)
    );
  }

  keepInsideField(player); 

  // Close control: touch, crossover, flick-up and shielding all live at the end
  // of the human's move so they stage off the same replicated frame.
  applyHumanBallControl();

} 

 

function gkClearBall(gk, isBlue) {
  const reflex = (gk.defending + gk.physical) / 4 / 70;
  const power = Math.max(16, Math.min(27, 18 * reflex));
  // Boot it a long way into the opponent's half, with some width so the
  // team can actually win the second ball.
  const targetX = isBlue
    ? Math.max(ball.x + 300, field.x + field.width * 0.7)
    : Math.min(ball.x - 300, field.x + field.width * 0.3);
  const targetY = H / 2 + (netRand() - 0.5) * 320;
  const adx = targetX - ball.x;
  const ady = targetY - ball.y;
  const al = Math.hypot(adx, ady) || 1;
  ball.vx = adx / al * power;
  ball.vy = ady / al * power;
  setBallToucher(gk);
  ball.passTarget = null;
  gk.kickAnim = 14;
  gk.grabCooldown = 90;
}

// Decide when during the 10s hold window the keeper should try to release
// a pass. He waits a beat after catching it, then passes the first time a
// teammate is open; if nobody is ever open he keeps the full 10 seconds
// and clears on the timeout.
function gkHoldTimeToPass(gk) {
  const held = 600 - (gk.holdFrames || 0);
  return held >= 26 && held <= 585;
}

// Pass the ball out from the keeper to the best open teammate.
// Returns true if a pass was made.
function gkPassToTeammate(gk, isBlue) {
  const candidates = isBlue
    ? (teammates || []).concat([player])
    : (opponents || []);
  let best = null;
  let bestScore = -Infinity;
  const passRange = Math.max(600, Math.min(1800, 1200 * (gk.passing / 70 || 1)));
  for (const tm of candidates) {

    if (tm.sentOff) continue;

    if (tm.role === "goalkeeper") continue;
    if (tm === gk) continue;
    const d = distance(gk, tm);
    if (d < 200) continue;
    if (d > passRange) continue;
    // Prefer open, forward, wide options that are far from the goal.
    let openness = 700;
    const foes = isBlue ? (opponents || []) : (teammates || []).concat([player]);
    for (const f of foes) {
      if (f.role === "goalkeeper") continue;
      const fd = distance(f, tm);
      if (fd < openness) openness = fd;
    }
    const forward = (tm.x - gk.x) * (isBlue ? 1 : -1);
    const score = forward * 0.6 + Math.min(openness, 400) * 0.25 + d * 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = tm;
    }
  }
  if (!best) return false;
  const aimX = Math.max(field.x + 20, Math.min(field.x + field.width - 20, best.x));
  const aimY = Math.max(field.y + 20, Math.min(field.y + field.height - 20, best.y));
  const adx = aimX - ball.x;
  const ady = aimY - ball.y;
  const al = Math.hypot(adx, ady) || 1;
  const passingFactor = (gk.passing / 70) || 1;
  const passSpeed = Math.max(10, Math.min(26, (distance(gk, best) / 14) * passingFactor));
  ball.vx = adx / al * passSpeed;
  ball.vy = ady / al * passSpeed;
  setBallToucher(gk);
  ball.passTarget = best;
  gk.kickAnim = 14;
  gk.indicatorText = "PASS!";
  gk.indicatorFrames = 40;
  best.indicatorText = "PASS!";
  best.indicatorFrames = 40;
  return true;
}

// A My Club goalkeeper stop (save or block) credits the keeper's card. A
// "save" is a hard shot stopped on the way in; a "block" is any other claim
// or clear the keeper makes to snuff out an attack. Either only counts once
// every 90 frames so a punch that keeps re-firing doesn't inflate the total.
function myClubCreditKeeperStop(gk, save, force) {
  if (!gk || gk.team !== "blue") return;
  if (currentMode !== "myclub" || !myClubLeague) return;
  if (!force && (gk.statCd || 0) > 0) return;
  const statCareer = getMyClubCareer(myClubLeague);
  if (!statCareer) return;
  const statGroup = getPlayerGroup();
  const statCup = (statGroup && statGroup.cup === "cl") ? "cl" : "league";
  myClubCreditPlayerStat(statCareer, gk, save ? "save" : "block", statCup);
  if (!force) gk.statCd = 90;
}

// Where each keeper waits on the line, so far out the wider pitch still has
// him patrolling ahead of his goal. Blue defends the left goal, red the right.
function keeperHomeX(team) {
  return team === "blue" ? field.x + 135 : field.x + field.width - 135;
}

function moveGoalkeeper(gk) {

  const homeX = keeperHomeX(gk.team);

  const isBlue = gk.team === "blue";

  // Reflexes scale with defending + physical around a 70-rated baseline
  const reflex = (gk.defending + gk.physical) / 4 / 70;

  if ((gk.statCd || 0) > 0) gk.statCd--;

  // ---- The keeper caught the ball: hold it up to 10 seconds, then pass
  // or clear. While he has it, everyone spreads far so the clearance/pass
  // has room to land - he throws/passes it out to a teammate when one is
  // open, or hoofs it long when the clock runs to zero.
  if (gk.holdsBall) {
    // A keeper who catches the ball gets back up: clear any dive so he is
    // never left lying down holding it for the whole hold.
    gk.diveFrames = 0;
    gk.diveCooldown = 0;
    if (ballCarrier === gk) {
      ball.x = Math.max(field.x + ball.radius, Math.min(field.x + field.width - ball.radius, gk.x + (isBlue ? 22 : -22)));
      ball.y = Math.max(field.y + ball.radius, Math.min(field.y + field.height - ball.radius, gk.y));
      ball.vx = 0;
      ball.vy = 0;
    }
    gk.holdFrames = (gk.holdFrames || 0) - 1;
    if ((gk.holdFrames || 0) <= 0) {
      gk.holdsBall = false;
      if (ballCarrier === gk) ballCarrier = null;
      gkClearBall(gk, isBlue);
    } else if (gkHoldTimeToPass(gk)) {
      // A teammate is open - release a controlled pass out to them.
      if (gkPassToTeammate(gk, isBlue)) {
        gk.holdsBall = false;
        if (ballCarrier === gk) ballCarrier = null;
        setBallToucher(gk);
        gk.grabCooldown = 90;
      }
    }
    return;
  }

  const penaltyX = isBlue

    ? field.x + PBOX_DEPTH - 60

    : field.x + field.width - PBOX_DEPTH + 60;

  // An opponent attack is on the way when the ball is near this goal

  // or being driven toward it from this half.

  const underAttack = isBlue

    ? ball.x < penaltyX || (ball.x < PITCH_CX && ball.vx < -0.5)

    : ball.x > penaltyX || (ball.x > PITCH_CX && ball.vx > 0.5);

  const goalLineX = isBlue ? field.x : field.x + field.width;

  const goalLineSide = isBlue ? gk.radius : -gk.radius;

  const onGoalLineX = goalLineX + goalLineSide;

  const ballDepth = isBlue ? ball.x - goalLineX : goalLineX - ball.x;

  // A shot is a free ball driven hard at the goal. The instant one is fired
  // the keeper drops the run-out and hurries back to his line so he's never
  // caught out of the goal mouth while the ball is on its way in.
  const ballSpd = Math.hypot(ball.vx, ball.vy);
  const shotIncoming = ballSpd > 6 && (isBlue ? ball.vx < -1.2 : ball.vx > 1.2);

  // ---- Committed full-stretch dive ----
  // A shot aimed outside the keeper's standing reach makes him commit: he
  // throws himself sideways at the projected crossing point and stretches for
  // it. If he gets a hand to it he tips it clear; if not he is beaten and has
  // to scramble back up. The decision is pure geometry (no randomness), so the
  // two lockstep peers always agree on the same dive.
  let gkDiving = false;
  if ((gk.diveFrames || 0) > 0) {
    gk.diveFrames--;
    const dir = gk.diveDir || 1;
    // Throwing himself across the goal is far quicker than he can run.
    gk.y += dir * 11 * reflex;
    gk.x += (onGoalLineX - gk.x) * 0.5 * reflex;
    gkDiving = true;
  } else if ((gk.diveCooldown || 0) > 0) {
    gk.diveCooldown--;
  } else if (shotIncoming && Math.abs(ball.vx) > 0.5) {
    // Where the shot would cross the goal line, and how far that is from him.
    const tt = (onGoalLineX - ball.x) / ball.vx;
    if (tt > 0 && tt < 100) {
      const crossY = ball.y + ball.vy * tt;
      const gap = Math.abs(crossY - gk.y);
      if (gap > 46 * reflex && gap < 320) {
        gk.diveDir = crossY > gk.y ? 1 : -1;
        gk.diveFrames = 26;
        gk.diveCooldown = 46;
        gk.indicatorText = "DIVE!";
        gk.indicatorFrames = 30;
        gkDiving = true;
      }
    }
  }

  // ---- Come off the line for a dribbler who enters the box ----
  // When an opponent carries the ball into our penalty box, charge straight
  // at the carrier and take it off him instead of waiting on the line for
  // the shot. The keeper only commits for a ball being dribbled at the
  // goal, so he doesn't stray out after loose balls in the channels.
  const dribblerInBox = ballCarrier && ballCarrier.team !== gk.team && inPenaltyBox(ball.x, ball.y);

  if (dribblerInBox && !shotIncoming) {

    moveToward(gk, ballCarrier.x, ballCarrier.y, 8.5 * reflex);

  } else if (underAttack) {

    // When the ball reaches the line (or goes into the goal), back all the

    // way onto the goal line; otherwise hold near the front edge of the box

    // while tracking the ball's height.

    const retreatX = onGoalLineX;

    // An incoming shot snaps the keeper back to the line and across the
    // goal mouth far quicker than normal positioning, so he dives on the
    // ball instead of getting sidestepped by it.

    const back = shotIncoming ? 0.55 : 0.32;

    gk.x += (retreatX - gk.x) * back * reflex;

    // The keeper tracks the ball's height but only dives so fast — a hard
    // shot to the corner can outrun his lateral movement and go past him.
    // A committed dive above already owns his lateral motion for its duration.
    if (!gkDiving) {
      const diveSpeed = shotIncoming ? 0.16 : 0.085;

      const diveTarget = (ball.y - gk.y) * diveSpeed * reflex;

      gk.y += diveTarget;
    }

  } else {

    // Roam the penalty area to follow the run of play, drifting out

    // to meet the ball without ever leaving the box.

    const roamX = isBlue

      ? Math.max(onGoalLineX, Math.min(homeX + 105, ball.x - 120))

      : Math.min(onGoalLineX, Math.max(homeX - 105, ball.x + 120));

    const roamY = Math.max(

      450 + gk.radius,

      Math.min(1050 - gk.radius, ball.y)

    );

    moveToward(gk, roamX, roamY, 5.6 * reflex);

  }

  gk.y = Math.max(

    goalTop + (gkDiving ? 0 : gk.radius),

    Math.min(goalBottom - (gkDiving ? 0 : gk.radius), gk.y)

  );

  // ---- Pick up the ball when attackers pile in around the goal ----
  // Handling is legal only inside the penalty box. The keeper claims any
  // loose ball he's in reach of, and grabs straight away when an opposing
  // outfield player is pressing it, so a striker can't knock it off him.
  const oppList = gk.team === "blue" ? opponents : teammates.concat([player]);
  const oppAttackerNear = oppList.some(a => !a.sentOff && a.role !== "goalkeeper" && distance(a, ball) < 240);
  if ((gk.grabCooldown || 0) > 0) {

    gk.grabCooldown--;

  } else if ((!ballCarrier || ballCarrier.team !== gk.team) && inPenaltyBox(ball.x, ball.y) && (oppAttackerNear || !ballCarrier) && distance(gk, ball) < 68 * reflex * (gkDiving ? 1.55 : 1)) {

    // The keeper claims any loose ball in reach inside the box — or an
    // opponent attacker dribbling the ball right onto his feet. Without
    // this, a carrier can park the ball at the keeper and it wedges
    // motionless between the two (the punch below can't move a pinned
    // ball). Using the same rule for both keepers keeps the two goalies
    // symmetric (they always defend the ball that's in front of them
    // regardless of which team the human controls).

    gk.holdsBall = true;

    gk.holdFrames = 600;

    ballCarrier = gk;

    setBallToucher(gk);

    myClubCreditKeeperStop(gk, false, false);

    ball.vx = 0;

    ball.vy = 0;

    ball.passTarget = null;

    const ux = isBlue ? 1 : -1;

    ball.x = Math.max(field.x + ball.radius, Math.min(field.x + field.width - ball.radius, gk.x + ux * (gk.radius + ball.radius + 5)));

    ball.y = Math.max(field.y + ball.radius, Math.min(field.y + field.height - ball.radius, gk.y));

  }

  // Fallback defensive punch: chip the ball away when it's loose near the
  // keeper with no crowd around (the grab above handles the crowded case).
  // This block must NOT wait out the grab cooldown - the cooldown exists to
  // stop the keeper instantly re-catching a ball he just cleared, but without
  // it a quick shot launched straight back (retrieved right after his
  // kick-out) would sail straight through him as if he weren't there.
  if (!gk.holdsBall && distance(gk, ball) < 56 * reflex * (gkDiving ? 1.6 : 1)) {

    const direction = isBlue ? 1 : -1;

    ball.vx = direction * 7 * reflex;

    ball.vy = (ball.y - gk.y) * 0.12;

    setBallToucher(gk);

    myClubCreditKeeperStop(gk, !!shotIncoming, false);

  }

}

 

function getVerticalLane(p) {

  const laneHeight = field.height / 4;

  const laneIndex = Math.min(

    3,

    Math.max(0, Math.floor((p.startY - field.y) / laneHeight))

  );

  return {

    minY: field.y + laneIndex * laneHeight + p.radius,

    maxY: field.y + (laneIndex + 1) * laneHeight - p.radius

  };

}



function clampToLane(lane, y) {

  return Math.max(lane.minY, Math.min(lane.maxY, y));

}



function moveTeam(list, attackDirection, teamHasBall, intensityMul) {
  const I = (typeof intensityMul === "number") ? intensityMul : 1;

  let closest = null;

  let closestDistance = Infinity;

  // When either keeper has caught the ball, everyone spreads far across
  // the pitch (ready for the keeper's pass or long clearance) instead of
  // crowding the goalmouth.
  const keeperHolding = ballCarrier !== null && ballCarrier.role === "goalkeeper" && !!ballCarrier.holdsBall;



  for (const p of list) {
    if (p.sentOff) continue;

    if (p.human) continue;

    if (p.role === "goalkeeper") continue;




    const d = distance(p, ball);



    if (d < closestDistance) {

      closestDistance = d;

      closest = p;

    }

  }



  for (const p of list) {

    if (p.sentOff) continue;

    // A human in this list is driven by the input frame, not by the AI. In solo
    // the controlled man is never in a team list, but in an online match the
    // guest's human IS a member of `redSquad`, so without this he would be
    // driven twice per tick - once by his stick and once by the team shape.
    if (p.human) continue;

    if (p.role === "goalkeeper") {

      moveGoalkeeper(p);

      continue;

    }

    // A successful tackle stuns the victim for a moment.
    if ((p.stumble || 0) > 0) {

      p.stumble--;

      continue;

    }

    // A goalkeeper is holding the ball: every outfield player of both
    // teams spreads far from goal so the keeper can pass it out or clear
    // it long without the ball landing in a crowd.
    if (keeperHolding) {
      const lane = getVerticalLane(p);
      const goForward = p.team === "blue" ? 1 : -1;
      const spreadX = p.team === "blue"
        ? field.x + field.width * 0.62
        : field.x + field.width * 0.38;
      const spreadY = clampToLane(lane, p.startY + (ball.y - H / 2) * 0.25);
      moveToward(p, spreadX, spreadY, p.speed * 1.4 * I);
      keepInsideField(p);
      continue;
    }

    // This player is dribbling the ball: carry it up the pitch, keep the
    // glued ball tracking their facing, decide to shoot when pressured or
    // close to goal, and clamp so they can never dribble it across the
    // goal line.
    if (ballCarrier === p) {
      const dir = p.team === "blue" ? 1 : -1;
      moveToward(p, dir === 1 ? field.x + field.width : field.x, PITCH_CY, p.speed * 0.92 * I);
      keepInsideField(p);
      if (ballCarrier === p) {
        const aux = p.facingX || dir;
      const auy = p.facingY || 0;
      const gl = glueAwayFromBlockers(p, aux, auy);
      const gx = gl[0];
      const gy = gl[1];
      const aoff = p.radius + ball.radius + 5;
      p.x = Math.max(field.x + ball.radius - gx * aoff, Math.min(field.x + field.width - ball.radius - gx * aoff, p.x));
      p.y = Math.max(field.y + ball.radius - gy * aoff, Math.min(field.y + field.height - ball.radius - gy * aoff, p.y));
      ball.x = p.x + gx * aoff;
      ball.y = p.y + gy * aoff;
        ball.vx = 0;
        ball.vy = 0;
      }
      const cc = p.cooldown || 0;
      if (cc > 0) {
        p.cooldown = cc - 1;
      } else {
        let pressured = false;
        const chasers = p.team === "blue" ? opponents : teammates.concat([player]);
        for (const foe of chasers) {
          if (distance(foe, p) < 95) { pressured = true; break; }
        }
        // Carriers build plays: with a forward pass on and the goal still
        // far away the AI releases the ball to an open teammate instead of
        // dribbling it into a blind alley or banging a hopeless shot at
        // goal. Pressed carriers move the ball on much more urgently.
        const distToGoal = dir === 1 ? (field.x + field.width) - p.x : p.x - field.x;
        const passChance = pressured ? 0.5 : 0.13;
        if (distToGoal > 340 && netRand() < passChance && aiPass(p)) {
          // pass released - the carrier becomes a support outlet again
        } else {
          // Long-range strikes: from inside a broad window past the close
          // range, the AI will occasionally let one fly at goal. The shot
          // is handed the goal distance so aiKick can tune power/accuracy.
          const inLongRange = distToGoal >= 600 && distToGoal <= 1100;
          const longShotChance = inLongRange ? Math.max(0.03, 0.11 - (distToGoal - 600) * 0.00005) : 0;
          if (pressured || distToGoal < 600 || netRand() < longShotChance || netRand() < 0.025) {
            aiKick(p, distToGoal < 600 ? 0 : distToGoal);
          } else {
            p.cooldown = 26;
          }
        }
      }
      continue;
    }



    // The quarter split keeps every outfield player locked into the same

    // vertical quarter of the pitch they started in (top fullback stays

    // up top, bottom fullback stays down bottom, and so on). This is

    // what stops RB/LB and other positions from swapping when either

    // team attacks or defends.

    const lane = getVerticalLane(p);



    if (p.role === "attacker") {

      // Attackers push forward more freely, only dropping back to

      // their formation slot when the ball is deep in the opponent's

      // defensive third.

      const ballIsAdvanced = attackDirection === 1

        ? ball.x < PITCH_CX + 350

        : ball.x > PITCH_CX - 350;



      // A slight speed boost for pushing into the opponent's half

      const isOnOtherSide = attackDirection === 1

        ? p.x > PITCH_CX

        : p.x < PITCH_CX;



      const attackerSpeed = isOnOtherSide ? p.speed * 1.05 * I : p.speed * I;

      const attackerReturnSpeed = p.speed * RETURN_SPEED_FACTOR * I;

      // While a teammate is on the ball, attackers push forward to give
      // the carrier a passing outlet instead of swarming the ball.
      const supportX = attackDirection === 1 ? Math.min(p.startX + 180, field.x + field.width - 80) : Math.max(p.startX - 180, field.x + 80);

      if (!teamHasBall && (p === closest || ballIsAdvanced)) {

        moveToward(p, ball.x, ball.y, attackerSpeed);

      } else {

        moveToward(

          p,

          teamHasBall ? supportX : p.startX,

          clampToLane(lane, p.startY + (ball.y - H / 2) * 0.2),

          isOnOtherSide ? attackerReturnSpeed * 1.05 : attackerReturnSpeed

        );

      }



      keepInsideField(p);

      continue;

    }



    // Defenders and midfielders hold their formation shape but drift

    // toward the run of play, and will step out much further to

    // contest the ball if they're the closest player on the team to it.

    // Better defenders track the ball from farther away.

    const engageRange = 1600 * (p.defending / 70) * I;



    if (!teamHasBall && p === closest && closestDistance < engageRange) {

      moveToward(p, ball.x, ball.y, p.speed * I);

    } else {

      moveToward(

        p,

        teamHasBall ? p.startX + attackDirection * 60 : p.startX + (ball.x - p.startX) * 0.6,

        clampToLane(lane, p.startY + (ball.y - H / 2) * 0.35),

        p.speed * HOLD_SPEED_FACTOR

      );

    }



    keepInsideField(p);

  }

}

 

// Hand control to the teammate nearest the ball.
//
// The controlled man is NOT a member of his own squad array: `allPlayers` is
// `[player, ...teammates, ...opponents, referee]`, so the steered blue man is an
// 11th object held outside `teammates`. To switch we therefore exchange the two
// bodies' list membership - the new man leaves the squad and the man we just
// released takes his slot - so the full XI stays intact and every team-wide
// query (pass targets, card counts, the nearest-man-to-ball pick, formation
// resets) keeps seeing the same eleven objects.
//
// The swap is done in place, never by reassignment, because `blueSquad` and
// `redSquad` hold second references to the same arrays.
//
// This is driven off `localPlayer`, never off the global `player`. In an online
// match `player` must stay the blue attacker on BOTH peers - every `=== player`
// gate in the simulation depends on it - while the guest steers `redHuman`. The
// global is only re-pointed in a solo match, where it *is* the local human.
function switchPlayer() {
  if (!netActionAllowed()) return false;

  // Open play only. A dead ball hands the restart to a named taker and points
  // the camera at him, so rebinding mid-restart would drag the taker off it.
  if (!matchRunning) return false;
  if (kickoffIntro > 0 || goalPhase || breakPhase) return false;
  if (freekick || matchPenalty || penaltyShootout) return false;

  const me = localPlayer;
  if (!me) return false;
  const list = me.team === "blue" ? blueSquad : redSquad;
  if (!list) return false;

  // Nearest on-pitch teammate to the ball. The keeper is a full candidate - a
  // pure distance pick - and the man we are releasing has already left the
  // squad array, so he can never be selected.
  let target = null;
  let bestDistance = Infinity;
  for (const p of list) {
    if (p.sentOff) continue;
    if (p.human) continue;
    const d = distance(p, ball);
    if (d < bestDistance) {
      bestDistance = d;
      target = p;
    }
  }
  if (!target) return false;

  // Exchange membership: `target` becomes the controlled 11th shirt and `me`
  // inherits exactly the formation slot `target` was standing in, so a later
  // resetPositions() puts both men back where the shape expects them.
  const slot = list.indexOf(target);
  if (slot < 0) return false;
  list[slot] = me;

  me.human = false;
  target.human = true;

  // The new man is a different body entirely: drop any input we were holding so
  // a charged shot never carries across, and hand him a clean frame so a *held*
  // switch button cannot re-fire on the next tick.
  target.netFrame = makeInputFrame();
  target.shootHeld = false;
  target.charging = false;
  target.chargeFrames = 0;
  target.cooldown = 0;
  target.passLockT = 0;

  // The released man is ordinary AI now. `hadBall` is replicated state that
  // drives the "LOST!" indicator, so keep it truthful for both men rather than
  // blanking it - forcing it false would fire a phantom turnover next tick.
  me.hadBall = ballCarrier === me;
  target.hadBall = ballCarrier === target;
  me.shootHeld = false;
  me.charging = false;
  me.chargeFrames = 0;

  localPlayer = target;

  // Keep the lockstep roster pointed at the man this client is actually
  // steering. In solo there is a single slot; online the slot is whichever one
  // held the outgoing man, and the two peers run the same swap on the same tick.
  if (simHumanIndex(target) < 0) {
    const hi = simHumanIndex(me);
    if (hi >= 0) simHumans[hi] = target;
    else if (simHumans.length === 1) simHumans[0] = target;
  }
  if (!netLockstepActive()) player = target;
  if (netGuestHuman === me) netGuestHuman = target;

  target.indicatorText = "SWITCH!";
  target.indicatorFrames = 30;

  return true;
}

function moveTeammates() {

  moveTeam(teammates, 1, ballCarrier === player || (ballCarrier !== null && ballCarrier.team === "blue"));

  aiTackleTeam(teammates, opponents);

  // The pass receiver sprints to meet the ball while it is in flight.

  const receiver = ball.passTarget;

  if (receiver && receiver.team === "blue" && receiver !== player && !receiver.sentOff) {

    moveToward(receiver, ball.x, ball.y, Math.max(receiver.speed, 3.6));

    keepInsideField(receiver);

  }

}

 

function moveOpponents() { 

  moveTeam(opponents, -1, ballCarrier !== null && ballCarrier.team === "red", getDifficultyScale());

  aiTackleTeam(opponents, teammates.concat([player]), getDifficultyScale());

} 

// The referee trails the play at a respectful jog: he tracks the run of
// the ball but stays off the ball, weaving up and down the pitch.
function moveReferee() {
  const t = netSimClock() * 0.001;
  const targetX = Math.max(
    field.x + 260,
    Math.min(field.x + field.width - 260, ball.x * 0.55 + PITCH_CX * 0.45)
  );
  const targetY = Math.max(
    field.y + 260,
    Math.min(field.y + field.height - 260, ball.y + Math.sin(t * 0.8) * 340)
  );
  const d = distance(referee, { x: targetX, y: targetY });
  moveToward(referee, targetX, targetY, d > 140 ? referee.speed * 0.55 : 0.4);
  keepInsideField(referee);
}
// isChargingShot / shotChargeFrames now live on the player object (see createPlayer)
 

const MAX_CHARGE_FRAMES = 45; 

const MIN_CHARGE_MULTIPLIER = 0.7; 
const MAX_CHARGE_MULTIPLIER = 1.8; 

// Technical shooting / dribbling. LT (Q on the keyboard) plus an aim
// direction picks the shot type, and the same LT plus a right-stick
// direction picks a dribble skill. The stick is read as a world direction,
// which keeps both peers in step: it comes from the replicated frame, never
// from a live analogue axis.
const SHOT_MODES = ["normal", "chip", "curve", "driven", "bicycle"];

function leftTriggerHeld() {
  return !!keys["q"] || !!vInput.lt;
}

function currentStickDir() {
  const sx = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  const sy = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  if (sx || sy) {
    const l = Math.hypot(sx, sy) || 1;
    return [sx / l, sy / l];
  }
  // No stick input (keyboard/touch): the movement keys stand in for it.
  const u = (keys["w"] || keys["arrowup"]) ? 1 : 0;
  const d = (keys["s"] || keys["arrowdown"]) ? 1 : 0;
  const l = (keys["a"] || keys["arrowleft"]) ? 1 : 0;
  const r = (keys["d"] || keys["arrowright"]) ? 1 : 0;
  const dx = r - l, dy = d - u;
  if (!dx && !dy) return [0, 0];
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m];
}

// Which technical shot a release would produce right now. Stick up is -Y in
// both the pad axes and the keyboard fallback, matching the movement mapping.
function currentShotMode() {
  if (!leftTriggerHeld()) return "normal";
  const s = currentStickDir();
  // A quick down-then-up flick of the stick with LT held is the bicycle.
  if (player.bikeFlick > 0 && s[1] < -0.35) return "bicycle";
  if (s[1] < -0.35) return "chip";
  if (Math.abs(s[0]) > 0.35) return "curve";
  if (s[1] > 0.35) return "driven";
  return "driven";
}

function passModifierKey() {
  if (vInput.ptLob) return "lob";
  if (!!keys["g"] || !!vInput.lb) return "through";
  if (!!keys["r"] || !!vInput.rb) return "lob";
  return "direct";
}

// Pass flavour read from the modifiers held at the instant of the pass.
function currentPassMode() {
  return passModifierKey();
}

// Which dribble skill, if any, the LT + stick is asking for right now.
function currentDribbleSkill() {
  if (!leftTriggerHeld()) return "";
  const s = currentStickDir();
  if (s[1] < -0.4) return "flick";
  if (Math.abs(s[0]) > 0.4) return "cross";
  if (s[1] > 0.4) return "shield";
  return "";
}

// Knock the ball out of the carrier's glue and give it a short push in
// (dx,dy). Used by every dribble touch and skill move.
function ballTouchRelease(dx, dy, speed) {
  const l = Math.hypot(dx, dy) || 1;
  ballGroundReset();
  ball.vx = dx / l * speed;
  ball.vy = dy / l * speed;
  setBallToucher(player);
  ballCarrier = null;
  player.passLockT = 7;
  ball.x += dx / l * 16;
  ball.y += dy / l * 16;
}

// Right stick ALONE, with no keyboard fallback. currentStickDir() deliberately
// substitutes the movement keys so aiming works without a pad, which is right
// for shots and corners - but the pad nudge below is a separate deliberate
// touch, and borrowing the movement keys there meant simply running with the
// ball knocked it out of your feet: the ball was released at speed 11 and
// possession dropped every time the touch cooldown lapsed, so carrying it was
// impossible.
function rightStickDirOnly() {
  const sx = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  const sy = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  if (!sx && !sy) return [0, 0];
  const l = Math.hypot(sx, sy) || 1;
  return [sx / l, sy / l];
}

// The right stick converted into a world-pitch direction for aim steering.
// The stick is rotated exactly like the movement keys (pad up == screen-up),
// so "point the stick at the post" matches where the player looks on screen.
// Inside a lockstep match it uses the fixed world frame - the same guard the
// movement uses - so two peers can never rotate the identical replicated stick
// input into different aim directions. Returns [dx, dy, magnitude] (the unit
// aim plus stick deflection, which callers use to scale pass reach), or null
// when the stick is centred/digital.
function stickWorldAim() {
  const sx = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  const sy = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  const mag = Math.hypot(sx, sy);
  if (mag < 0.3) return null;
  const lr = sx;
  const ud = -sy;                                   // pad up (-Y) is screen-up
  const pc = netLockstepActive() ? 1 : PIVOT_C;
  const ps = netLockstepActive() ? 0 : PIVOT_S;
  return [(lr * pc + ud * ps) / mag, (lr * ps - ud * pc) / mag, mag];
}

// A deliberate little nudge of the ball while carrying it (the dribble
// button, or a right-stick deflection on a pad).
function dribbleTouch() {
  if (!netActionAllowed()) return;
  if (!matchRunning || player.sentOff) return;
  if (ballCarrier !== player) return;
  if ((player.touchCd || 0) > 0) return;
  const s = currentStickDir();
  let dx = s[0];
  let dy = s[1];
  if (!dx && !dy) { dx = player.facingX || 1; dy = player.facingY || 0; }
  ballTouchRelease(dx, dy, 12);
  player.touchCd = 12;
  player.indicatorText = "TOUCH";
  player.indicatorFrames = 26;
}

// Close control for the human on the ball: touches, a crossover, a flick-up
// over a challenge and shielding. Everything here runs inside the simulation
// off the replicated frame (stick + LT), so both peers stage the same move on
// the same tick.
function applyHumanBallControl() {
  // Gesture tracking first, and it runs whether or not the ball is on the
  // foot: pulling the stick down and snapping it up while LT is held arms the
  // bicycle kick, which is played while winding a shot up (no ball needed yet).
  const s = currentStickDir();

  if (leftTriggerHeld()) {
    if (s[1] > 0.35) player.stickLow = 6;
    else if (player.stickLow > 0) {
      if (s[1] < -0.35) player.bikeFlick = 10;
      player.stickLow--;
    }
  } else {
    player.stickLow = 0;
    player.bikeFlick = 0;
  }
  if (player.bikeFlick > 0) player.bikeFlick--;

  // While winding a shot up the stick belongs to the shot, so no touches,
  // skills or passes-by-ball: otherwise a chip charge would trigger a flick-up
  // and knock the ball out from under the striker.
  if (player.charging) return;

  if (ballCarrier !== player) {
    player.touchCd = 0;
    return;
  }
  if (player.touchCd > 0) player.touchCd--;

  const skill = currentDribbleSkill();

  if (skill === "cross") {
    if (player.touchCd > 0) return;
    // Crossover: a sharp touch across the body plus a burst of pace, so the
    // defender is sent the wrong way.
    const side = s[0] > 0 ? 1 : -1;
    const fx = player.facingX || (player.team === "blue" ? 1 : -1);
    const fy = player.facingY || 0;
    const tx = -fy * side;
    const ty = fx * side;
    ballTouchRelease(tx, ty, 13);
    player.x += tx * 16;
    player.y += ty * 16;
    player.touchCd = 28;
    player.indicatorText = "CROSSOVER!";
    player.indicatorFrames = 36;
    return;
  }

  if (skill === "flick") {
    if (player.touchCd > 0) return;
    // Flick-up: pop the ball over the challenge and run underneath it.
    const fx = player.facingX || (player.team === "blue" ? 1 : -1);
    const fy = player.facingY || 0;
    ballGroundReset();
    ball.vx = fx * 9;
    ball.vy = fy * 9;
    ballLaunch(11.5, 0, 44);
    setBallToucher(player);
    ballCarrier = null;
    player.passLockT = 8;
    player.touchCd = 36;
    player.indicatorText = "FLICK!";
    player.indicatorFrames = 36;
    return;
  }

  // Pad only: nudging the RIGHT stick away from the ball line pushes the ball
  // in that direction (feint touches). It reads the right stick on its own -
  // see rightStickDirOnly() - because using the shared stick direction meant
  // ordinary movement keys counted as a pad input. Shielding is a held state
  // and its slow roll lives in moveHuman.
  const pad = rightStickDirOnly();
  if (!leftTriggerHeld() && (pad[0] || pad[1]) && player.touchCd <= 0) {
    ballTouchRelease(pad[0], pad[1], 11);
    player.touchCd = 14;
  }
}
 

let tackleBlockedThisFrame = false;

 

function updateControlsHint() {
  const el = document.getElementById("controlsHint");
  if (!el) return;
  if (SETTINGS.controls === "controller") {
    el.textContent = "Move: Left Stick / D-Pad | Sprint: RT | Kick: A (hold for power) | Pass: X | Through Ball: LB + X | Lob: RB + X | Skills / Chip: LT + Right Stick | Kick Power: Right Stick up | Tackle: Y | Request Ball: B | Fix Ball: Z | Switch Player: L3 | Pause: Start";
  } else if (SETTINGS.controls === "mobile") {
    el.textContent = "Move: left joystick | Sprint: Sprint button | Kick: Shoot (hold for a power shot) | Pass / Tackle / Request: on-screen buttons | Pause: pause button";
  } else {
    el.textContent = "Move: WASD / Arrow Keys | Sprint: Shift | Kick: Space (hold for a power shot) | Pass: B | Through Ball: G + B | Lob: R + B | Dribble Touch: X | Switch Player: F | Skills (Crossover / Flick / Shield): Q + direction | Chip / Curve / Driven / Bicycle: Q + direction + hold Kick | Pause: Esc";
  }
} 

 
function startChargingShot() { 
  // Mirror of every shoot press (keyboard / gamepad / touch), kept even where
  // the charge itself is gated off - e.g. a match penalty, which is taken on
  // this button rather than fired on a countdown.
  shotHeld = true;

  if (!netActionAllowed()) return;
  if (!matchRunning) return; 

  if (player.sentOff) return; 

  if (freekick && freekick.taker !== player) return;

  if (matchPenalty) return;
  player.charging = true;
  player.chargeFrames = 0;
  // Latch the technical shot (LT + stick) at the moment of the press so the
  // mode can't flicker while the button is held.
  player.shootMode = currentShotMode();
} 

 

 

// Runs once per simulation tick while the shoot button is held, so holding it
// really does build power. The power bar in the renderer reads the same
// chargeFrames counter.
function updateShotCharge() { 

  if (!player.charging) return; 

  player.chargeFrames = Math.min(MAX_CHARGE_FRAMES, player.chargeFrames + 1); 

} 

function releaseShot() { 
  shotHeld = false;
  if (!netActionAllowed()) return;
  // Snapshot the charge BEFORE the counters are cleared: this is what turns a
  // held button into a harder strike.
  const chargeFraction = Math.max(0, Math.min(1, player.chargeFrames / MAX_CHARGE_FRAMES));
  player.charging = false;

  player.chargeFrames = 0;
  // A corner is crossed into the box, not shot at the goal: the stick picks
  // the target zone and the ball is lofted over the crowd to it.
  if (freekick && freekick.kind === "corner" && freekick.taker === player) {
    crossCorner(player, cornerAim(player));
    endFreekick();
    return;
  }
  if (matchPenalty) return;



 





  

  if (!matchRunning) return; 

  if (player.sentOff) return; 

  if (freekick && (freekick.taker !== player || freekick.frames < freekick.wait)) return;

  // A set piece strikes with the piece tuner: the aim is where the taker
  // stands, power rides on the SPACE charge, and the tuner's HEIGHT and BEND
  // readouts loft and curve the ball. Bypasses the open-play tech shot modes.
  if (freekick && freekick.taker === player) {
    strikeSetPieceBall(player, chargeFraction);
    return;
  }

  // A goalkeeper holding the ball keeps it — you can't boot it out of
  // his hands.
  if (keeperHoldingBall()) return;

 

  const kickRange = Math.max(45, Math.min(100, 65 * (player.dribbling / 70))); 

 

  if (distance(player, ball) < kickRange) { 

    const dx0 = ball.x - player.x;

    const dy0 = ball.y - player.y;

    // Standing dead on the ball would produce a zero-length swing (dx=0,dy=0)
    // and a 'kick' that never moves the ball (e.g. dribbled right onto a free
    // kick spot). Angle it off the player's facing so the strike actually fires.
    let dx = dx0;

    let dy = dy0;

    let length = Math.hypot(dx, dy);

    if (length < 1) {

      dx = player.facingX;

      dy = player.facingY;

      length = Math.hypot(dx, dy);

    }

    if (length < 1) length = 1; 

    // Controller precision aim: a deflected right stick steers the strike
    // exactly where it points on the pitch, no matter which way the man
    // faces. (LT + the same stick still picks the shot TYPE; the same
    // replicated stick values feed either, so peers always agree.)
    const stickAimDir = stickWorldAim();
    if (stickAimDir) {
      dx = stickAimDir[0];
      dy = stickAimDir[1];
      length = 1;
    } 

 

    const basePower = Math.max(7, Math.min(20, 12 * (player.shooting / 70))); 

 

    const chargeMultiplier = 

      MIN_CHARGE_MULTIPLIER + 

      chargeFraction * (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER); 

const power = Math.min(28, basePower * chargeMultiplier); 

  

 

ballGroundReset();

ball.vx = dx / length * power;

    ball.vy = dy / length * power; 

    // Technical shots. The mode is latched when the button goes down, so
    // swinging the stick mid-charge can't change the shot out from under the
    // swing animation - except the bicycle, which IS a mid-charge gesture
    // (LT, stick down then snapped up while winding up).
    let mode = player.shootMode || "normal"; 

    if (player.bikeFlick > 0) mode = "bicycle"; 

    if (mode === "chip") {

      // Lob it over the keeper: full pace, plenty of height, drops short.

      ballLaunch(13 + power * 0.26, 0, Math.round(26 + power * 2.6)); 

    } else if (mode === "curve") {

      // Bend it round the wall: a little float and a lot of side-spin.

      ballLaunch(5 + power * 0.2, -(dx / length) * power * 0.62, 24); 

    } else if (mode === "driven") {

      // Driven shot: flat, straight and much harder than a normal strike.

      ball.vx = dx / length * power * 1.55; 

      ball.vy = dy / length * power * 1.55; 

    } else if (mode === "bicycle") {

      // Scissor overhead: launched up and forward, and it drops back down
      // through a crowded box.

      ball.vx = dx / length * power * 0.82; 

      ball.vy = dy / length * power * 0.82; 

      ballLaunch(15 + power * 0.3, 0, 42); 

      player.kickAnim = 22; 

    } 

if (mode !== "normal") { player.indicatorText = mode.toUpperCase() + "!"; player.indicatorFrames = 46; }

    setBallToucher(player);
    ballCarrier = null;
    if (mode === "normal") player.kickAnim = 14;
    // A kick is an active pass: keep the dribble-lock from swallowing the
    // just-struck ball and eating the shot next frame.
    player.passLockT = 10;
    sponsorNote("shots");
  } 

} 

// The user's free kick / corner strike. The aim is the direction they stand
// relative to the ball (same line the aim cursor draws), power comes from the
// SPACE charge they built up, and the piece tuner's HEIGHT and BEND readouts
// loft and curve the flight. BEND rotates the aim by up to ~14 degrees and
// lays flight spin on top; HEIGHT lifts the trajectory off the deck.
function strikeSetPieceBall(taker, chargeFraction) {
  if (!taker) return;
  let dx = ball.x - taker.x;
  let dy = ball.y - taker.y;
  let length = Math.hypot(dx, dy);
  if (length < 1) {
    dx = taker.facingX;
    dy = taker.facingY;
    length = Math.hypot(dx, dy);
  }
  if (length < 1) length = 1;
  const basePower = Math.max(7, Math.min(20, 12 * (taker.shooting / 70)));
  const chargeMultiplier = MIN_CHARGE_MULTIPLIER + chargeFraction * (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER);
  const power = Math.min(28, basePower * chargeMultiplier);
  const lift = Math.max(0, Math.min(1, taker.fkLift || 0));
  const bend = Math.max(-1, Math.min(1, taker.fkBend || 0));
  const bendAng = bend * 0.24;
  const ca = Math.cos(bendAng), sa = Math.sin(bendAng);
  const rx = (dx * ca - dy * sa) / length;
  const ry = (dx * sa + dy * ca) / length;
  ballGroundReset();
  ball.vx = rx * power;
  ball.vy = ry * power;
  // Loft scales the HEIGHT tune; spin bends the flight toward the BEND tune.
  ballLaunch(5 + 20 * lift + power * 0.16, bend * 11, Math.round(28 + lift * 34));
  setBallToucher(taker);
  ballCarrier = null;
  taker.kickAnim = 14;
  taker.passLockT = 10;
  let label = "";
  if (lift > 0.6) label = "LOFTED";
  if (Math.abs(bend) > 0.45) label = (label ? label + " " : "") + (bend > 0 ? "CURVE RIGHT" : "CURVE LEFT");
  if (label) { taker.indicatorText = label; taker.indicatorFrames = 46; }
  if (freekick) endFreekick();
}

let pieceTunerTick = 0;

// The piece tuner only matters while the user is over their own free kick.
// In-match penalties are aimed with the stick, so the readouts stay dark there.
function pieceTunerActive() {
  return !!freekick && freekick.taker && freekick.taker === player && !player.sentOff;
}

// Render-side poll: while Q/LT is held on a set piece, the movement stick
// retunes the strike instead of walking the taker. W/S raise or lower the
// HEIGHT readout, A/D push the BEND left or right. A controller right stick
// is read as a pure analog dial: a light push trims HEIGHT/BEND gradually
// (finer than the old 0.06 steps) while a full flick sweeps the whole bar.
// Throttled so a held stick climbs at a readable pace.
function updateSetPieceTuner() {
  if (!pieceTunerActive()) { pieceTunerTick = 0; return; }
  const held = leftTriggerHeld() || !!vInput.lt;
  if (!held) { pieceTunerTick = 0; return; }
  pieceTunerTick = (pieceTunerTick || 0) + 1;
  const rsx = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  const rsy = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  if (Math.abs(rsx) >= 0.15 || Math.abs(rsy) >= 0.15) {
    player.fkBend = Math.max(-1, Math.min(1, (player.fkBend || 0) + rsx * 0.05));
    player.fkLift = Math.max(0, Math.min(1, (player.fkLift || 0) - rsy * 0.05));
    return;
  }
  if (pieceTunerTick % 4 !== 0) return;
  const up    = keys["w"] || keys["arrowup"]    || !!vInput.up;
  const down  = keys["s"] || keys["arrowdown"]  || !!vInput.down;
  const left  = keys["a"] || keys["arrowleft"]  || !!vInput.left;
  const right = keys["d"] || keys["arrowright"] || !!vInput.right;
  if (up) player.fkLift = Math.min(1, (player.fkLift || 0) + 0.06);
  if (down) player.fkLift = Math.max(0, (player.fkLift || 0) - 0.06);
  if (right) player.fkBend = Math.min(1, (player.fkBend || 0) + 0.06);
  if (left) player.fkBend = Math.max(-1, (player.fkBend || 0) - 0.06);
}

// The set-piece tuning HUD: POWER, HEIGHT and BEND readouts in one pill above
// the commentary strip, plus a controls hint. The pill glows gold while the
// tuner is live (Q held).
function drawSetPieceTuner() {
  if (!matchRunning) return;
  const tuning = pieceTunerActive();
  if (!tuning) return;
  const active = leftTriggerHeld() || !!vInput.lt;
  const charge = Math.max(0, Math.min(1, player.chargeFrames / MAX_CHARGE_FRAMES));
  const lift = Math.max(0, Math.min(1, player.fkLift || 0));
  const bend = Math.max(-1, Math.min(1, player.fkBend || 0));

  const bw = 640, bh = 64;
  const bx = W / 2 - bw / 2, by = H - 200;
  ctx.save();
  ctx.fillStyle = active ? "rgba(10,12,30,0.82)" : "rgba(10,12,30,0.70)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(bx, by, bw, bh, 10);
  else ctx.rect(bx, by, bw, bh);
  ctx.fill();
  ctx.strokeStyle = active ? "rgba(255,215,0,0.9)" : "rgba(255,255,255,0.35)";
  ctx.lineWidth = active ? 2 : 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const segW = bw / 3, barW = segW * 0.62, barY = by + 34, barH = 7;
  const labelY = by + 18;

  const seg = (cx, label, frac, color, lc, rc) => {
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#cfd8ec";
    ctx.fillText(label, cx, labelY);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(cx - barW / 2, barY, barW, barH);
    ctx.fillStyle = active ? color : shadeColor(color, 0.75);
    if (lc !== undefined && rc !== undefined) {
      // BEND: centered scale, marker slides -1..1.
      ctx.fillRect(cx - barW / 2, barY, barW * 0.02, barH);
      ctx.fillRect(cx + barW / 2 - barW * 0.02, barY, barW * 0.02, barH);
      const mx = cx + (frac * barW * 0.9) / 2;
      ctx.fillRect(mx - 1.5, barY - 3, 3, barH + 6);
    } else {
      const w = Math.max(2, barW * frac);
      ctx.fillRect(cx - barW / 2, barY, w, barH);
    }
  };

  seg(bx + segW * 0.5,        "POWER " + Math.round(charge * 10), charge, "#ffd75e");
  seg(bx + segW * 1.5, "HEIGHT " + Math.round(lift * 10),        lift,   "#7cffa8");
  seg(bx + segW * 2.5,        "BEND",                        bend,   "#9ab8ff", -1, 1);

  ctx.font = "10px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Q + W/S loft      Q + A/D bend      SPACE power", W / 2, by + bh - 6);
  ctx.restore();
} 

 

function passBall() { 
  if (!netActionAllowed()) return;
if (!matchRunning) return; 

  if (player.sentOff) return; 

if (freekick) return;

  if (matchPenalty) return;

  // Can't pass the ball out of a goalkeeper's hands either.
  if (keeperHoldingBall()) return;

 

  const attackDir = player.team === "blue" ? 1 : -1;
  // B only passes when the human actually has the ball (glued carrier or
  // within reach); otherwise it does nothing — E is how you request a ball.
  if (ballCarrier !== player && distance(player, ball) >= 150) return;

  const passer = player;

  {
const passRange = Math.max(500, Math.min(1400, 900 * (passer.passing / 70))); 

    // Three passing options share this one button and are picked by the
    // modifiers held at the moment of the press:
    //   direct  - plain pass, hit harder and weighted forward
    //   through - LB held: played into the space the runner is attacking
    //   lob     - RB held: lofted cross that clears everyone between
    const mode = currentPassMode();

    const modeRange = mode === "through" ? passRange * 1.15 : (mode === "lob" ? passRange * 1.05 : passRange); 

    // Controller manual pass: a deflected right stick points exactly where
    // the ball goes, overriding the auto-target. Reach scales with stick
    // deflection, so a full push needs the keeper's work to cover no more
    // than the pass range while a light touch drops it short of a teammate.
    // Lobs keep their loft and through-balls stay firm, same as auto-pass.
    const stickAimDir = stickWorldAim();
    if (stickAimDir) {
      const pushFrac = Math.min(1, stickAimDir[2]);
      const distGoal = passRange * (0.5 + 0.5 * pushFrac);
      let passSpeed = Math.max(9, Math.min(26, (distGoal / 16) * (passer.passing / 70)));
      if (mode === "direct") passSpeed *= 1.12;
      else if (mode === "through") passSpeed *= 1.06;
      else passSpeed *= 0.72;
      ballGroundReset();
      ball.vx = stickAimDir[0] * passSpeed;
      ball.vy = stickAimDir[1] * passSpeed;
      if (mode === "lob") ballLaunch(6 + distGoal * 0.012, 0, Math.round(16 + distGoal * 0.008));
      setBallToucher(player);
      ballCarrier = null;
      player.passLockT = 12;
      return;
    } 

    let bestTeammate = null;

    let bestScore = -Infinity;

    const boxX = passer.team === "blue" ? field.x + field.width - 380 : field.x + 380; 

    for (const teammate of allPlayers) {

      if (teammate.sentOff) continue;

      if (teammate.team !== passer.team) continue;

      if (teammate === passer) continue;

      if (teammate.role === "goalkeeper") continue;

      const teammatePlayerDistance = distance(teammate, passer); 

      if (teammatePlayerDistance >= modeRange) continue;

      let openness = 700;

      for (const opp of opponents) {

        const oppDistance = distance(opp, teammate); 

        if (oppDistance < openness) openness = oppDistance; 

      } 

      const forward = (teammate.x - passer.x) * attackDir; 

      let score;

      if (mode === "through") {

        // Ball into the run, not to the feet: forward progress and clear
        // space ahead of the receiver matter most.

        const runAhead = (teammate.facingX || attackDir) * attackDir; 

        score = forward * 1.3 + Math.min(openness, 420) * 0.5 - Math.abs(teammatePlayerDistance - 640) * 0.25 + runAhead * 70; 

      } else if (mode === "lob") {

        // A cross wants a target near the far box with room to attack it.

        score = -Math.abs(teammate.x - boxX) * 0.55 + Math.min(openness, 400) * 0.3 - Math.abs(teammate.y - H / 2) * 0.25; 

      } else {

        // Direct pass: the old safe lay-off, weighted a little further
        // forward and a little harder.

        score = -teammatePlayerDistance + forward * 0.55 + Math.min(openness, 320) * 0.22; 

      } 

      if (score > bestScore) {

        bestScore = score;

        bestTeammate = teammate; 

      } 

    } 

    if (!bestTeammate) return;

    const length = distance(ball, bestTeammate);

    // Aim straight at the receiver's current position so the ball arrives
    // TO them, not past them; a through ball leads the run instead.

    let aimRawX = bestTeammate.x;

    let aimRawY = bestTeammate.y; 

    if (mode === "through") {

      const lead = 120 + length * 0.22;

      aimRawX += (bestTeammate.facingX || attackDir) * lead;

      aimRawY += (bestTeammate.facingY || 0) * lead * 0.5; 

    } else if (mode === "lob") {

      aimRawX += attackDir * (90 + length * 0.16); 

    } 

    const aimX = Math.max(
      field.x + 20,
      Math.min(field.x + field.width - 20, aimRawX)
    );

    const aimY = Math.max(
      field.y + 20,
      Math.min(field.y + field.height - 20, aimRawY)
    );

    const adx = aimX - ball.x;

    const ady = aimY - ball.y;

    const alength = Math.hypot(adx, ady) || 1;

    const passingFactor = passer.passing / 70;

    // Longer passes get hit harder so they actually arrive before the ball
    // slows to a crawl.

    let passSpeed = Math.max(8, Math.min(24, (length / 16) * passingFactor)); 

    if (mode === "direct") passSpeed *= 1.12; else if (mode === "through") passSpeed *= 1.06; else passSpeed *= 0.72; 

    ballGroundReset();

ball.vx = adx / alength * passSpeed;

    ball.vy = ady / alength * passSpeed; 

    if (mode === "lob") {

      // Lofted cross: enough height to travel over every head on the way.

      const flight = Math.max(24, length / Math.max(6, passSpeed)); 

      ballLaunch(flight * 0.6, 0, Math.min(90, Math.round(flight * 1.7))); 

    } 

    const passLabel = mode === "through" ? "THROUGH!" : (mode === "lob" ? "CROSS!" : "PASS!");

    ball.vy = ady / alength * passSpeed;

    setBallToucher(passer);

    ballCarrier = null;
    player.passLockT = 10;
    passer.kickAnim = 14;

    // Nudge the ball clear of the passer immediately, otherwise a

    // nearby player touching the ball on the very next frame can 

    // instantly overwrite this velocity with their own kick. 

    const nudge = Math.min(18, length * 0.12);

    ball.x += adx / alength * nudge;

    ball.y += ady / alength * nudge;

    // Tag the pass so the receiver sprints to meet it and earns a

    // controlled first touch instead of a reflex clearance.

    ball.passTarget = bestTeammate;

    // Show a brief pass indicator above both players 

    passer.indicatorText = passLabel; 

    passer.indicatorFrames = 40; 

    bestTeammate.indicatorText = passLabel; 

    bestTeammate.indicatorFrames = 40; 

    return;

  }

}

function requestBall() {
  if (!netActionAllowed()) return;

  if (!matchRunning) return;

  if (player.sentOff) return;

  if (freekick) return;

  if (matchPenalty) return;

  // Only request when the human does NOT have the ball.
  if (ballCarrier === player || distance(player, ball) < 150) return;

  // Human is open without the ball: ask the nearest teammate who is on
  // the ball to play it to the player.

  // The blue player ON the ball must always pass back to the human: 

  let passer = null; 

  if (ballCarrier && ballCarrier.team === "blue" && ballCarrier !== player) { 

    passer = ballCarrier; 

  } else { 

    let closestToBall = Infinity; 

    for (const teammate of teammates) { 

      const d = distance(teammate, ball); 

      if (d < 110 && d < closestToBall) { 

        closestToBall = d; 

        passer = teammate; 

      } 

    } 

  } 

  if (!passer) { 

    const holder = allPlayers.find(p => p.team === "blue" && p.role === "goalkeeper" && p.holdsBall); 

    if (holder) passer = holder; 

  } 

  if (!passer) return; 

  const dx = player.x - ball.x;

  const dy = player.y - ball.y;

  const length = Math.hypot(dx, dy) || 1;

  const adx = player.x - ball.x;

  const ady = player.y - ball.y;

  const alength = Math.hypot(adx, ady) || 1;

  const passingFactor = passer.passing / 70;

  const passSpeed = Math.max(8, Math.min(24, (length / 16) * passingFactor));

  ball.vx = adx / alength * passSpeed;

  ball.vy = ady / alength * passSpeed;

  setBallToucher(passer);

  const nudge = Math.min(45, length * 0.4);

  ball.x += adx / alength * nudge;

  ball.y += ady / alength * nudge;

  ball.passTarget = player;

  // The keeper hands the ball out on a called pass: release his hold and
  // put him on his standard throw-out cooldown, or he would re-pin the
  // ball at his feet on the very next frame.
  if (passer.role === "goalkeeper") {

    passer.holdsBall = false;

    if (ballCarrier === passer) ballCarrier = null;

    passer.grabCooldown = 90;

    passer.holdFrames = 0;

  }

  passer.indicatorText = "PASS!"; 

  passer.indicatorFrames = 40; 

player.indicatorText = "PASS!";

  player.indicatorFrames = 40;

}

 

// True when the point sits inside either penalty box (the marked 360-wide
// areas in front of each goal). Tackles there are riskier and less likely.
function inPenaltyBox(x, y) {
  if (y < 450 || y > 1050) return false;
  return x <= field.x + PBOX_DEPTH || x >= field.x + field.width - PBOX_DEPTH;
}

function tryTackle() {
  if (!netActionAllowed()) return;

  if (!matchRunning) return;

  if (player.sentOff) return;

  if (freekick) return;

  if (matchPenalty) return;

  if (ballCarrier === player) return;

  if ((player.tackleCooldown || 0) > 0) return;

  if ((player.tackleAnim || 0) > 0) return;

  if (tackleBlockedThisFrame) return;

  // Sprinting (Shift) while moving into the challenge turns a standing
  // tackle into a full-blooded slide: longer reach, the tackler glides
  // forward on the ground, and the ball is knocked much further clear.
  const moving =
    keys["w"] || keys["arrowup"] || keys["s"] || keys["arrowdown"] ||
    keys["a"] || keys["arrowleft"] || keys["d"] || keys["arrowright"] ||
    vInput.up || vInput.down || vInput.left || vInput.right;
  const sliding = !!((keys["shift"] || vInput.sprint) && moving);

  const reach = sliding ? 150 : 95;

  // A slick surface means the ball is knocked further clear by a tackle.
  const knock = (sliding ? 16 : 11) * (2 - weatherGrip());

  const stunFrames = sliding ? 150 : 30;

  const animFrames = sliding ? 18 : 12;

  const cooldownFrames = sliding ? 780 : 600;

  // A valid tackle needs an opponent within reach (tackles work anywhere
  // on the pitch, not just near the ball).
  let target = null;

  let bestDist = Infinity;

  for (const opp of opponents) {

      if (opp.role === "goalkeeper") continue;

      const toOpp = distance(opp, player);

      if (toOpp < reach && toOpp < bestDist) {

        bestDist = toOpp;

        target = opp;

      }

    }

  if (!target) return;

  // In the penalty box, many tackles don't come off: a committed lunge
  // that gets no contact, so the defender tears past his man and the
  // attacker keeps the ball. Still costs the tackle's animation/cooldown.
  if (inPenaltyBox(target.x, target.y) && netRand() < 0.55) {
  player.energy = Math.max(0, player.energy - 15);
    player.tackleAnim = animFrames;
    player.tackleDuration = animFrames;
    player.tackleCooldown = cooldownFrames;
    if (sliding) {
      player.slideTackle = 14;
      let wdx = player.facingX || (player.team === "blue" ? 1 : -1);
      let wdy = player.facingY || 0;
      const wl = Math.hypot(wdx, wdy) || 1;
      player.slideDx = wdx / wl;
      player.slideDy = wdy / wl;

    }
    return;
  }

  tackleBlockedThisFrame = true;

  player.tackleAnim = animFrames;

  player.tackleDuration = animFrames;
player.energy = Math.max(0, player.energy - 15);
  player.tackleCooldown = cooldownFrames;

  // A slide also flings the tackler forward along the run-up direction.
  if (sliding) {
    player.slideTackle = 14;
    let sdx = player.facingX || (player.team === "blue" ? 1 : -1);
    let sdy = player.facingY || 0;
    const sl = Math.hypot(sdx, sdy) || 1;
    player.slideDx = sdx / sl;
    player.slideDy = sdy / sl;

  }

  // Knock the ball away from the tackled player into space - only when
  // the ball is actually near them (off-the-ball challenges just bring
  // the target down). A keeper holding the ball can't be dispossessed.
  if (!keeperHoldingBall() && distance(ball, target) < 220) {
    const dx = ball.x - target.x;

    const dy = ball.y - target.y;

    const l = Math.hypot(dx, dy) || 1;

    ball.vx = dx / l * knock + (netRand() - 0.5) * 3;

    ball.vy = dy / l * knock + (netRand() - 0.5) * 3;
setBallToucher(null);

    ballCarrier = null;

    ball.passTarget = null;
    sponsorNote("tackles");
  }

target.stumble = stunFrames;

  // Whistle: the lunge may be judged a foul or worse. On a foul/card the
  // play is stopped and restarted from the spot with a free kick to the
  // fouled team (offender = the human).
  const judgement = rollTackleJudgement(sliding);

  if (judgement) {

    startFreekick(target.team, target.x, target.y, player, judgement);

  }

}

 

function aiTackleTeam(teamList, foes, intensityMul) {
  const I = (typeof intensityMul === "number") ? intensityMul : 1;
  if (tackleBlockedThisFrame) return;

  // Nobody concedes a tackle to a keeper who's holding the ball.
  if (keeperHoldingBall()) return;

  // Only one tackler per team each frame: the closest ready outfield
  // player to the ball gets the challenge.
  let tackler = null;

  let tacklerDist = Infinity;

  for (const attacker of teamList) {

    if (attacker.sentOff) continue;

    if (attacker.human) continue;

    if (attacker.role === "goalkeeper") continue;

    if (attacker === ballCarrier) continue;

    if ((attacker.tackleAnim || 0) > 0) continue;

    if ((attacker.tackleCooldown || 0) > 0) continue;

    const d = distance(attacker, ball);

    if (d < tacklerDist) {

      tacklerDist = d;

      tackler = attacker;

    }

  }

  if (!tackler) return;
  // Only the single closest foe to the tackler goes down.
  let target = null;

  let bestDist = Infinity;

  for (const f of foes) {

    if (f.sentOff) continue;

    if (f.role === "goalkeeper") continue;

    // The human is mid-kick: leave them out of the takedown candidate pool.
    if (f === player && ((player.charging && distance(ball, player) < Math.max(45, Math.min(100, 65 * (player.dribbling / 70)))) || (player.kickAnim || 0) > 0)) continue;

      if (distance(tackler, f) < 88 && distance(ball, f) < 95) {

      const fd = distance(tackler, f);

      if (fd < bestDist) {

        bestDist = fd;

        target = f;

      }

    }

  }

  if (!target) return;

  // Tackles are rare inside the box - the keeper owns that space and
  // outfield challenges there usually come off as fouls instead.
  const inBox = inPenaltyBox(target.x, target.y) || inPenaltyBox(tackler.x, tackler.y) || inPenaltyBox(ball.x, ball.y);

  if (netRand() > Math.min(0.35, (inBox ? 0.02 : 0.07) * I)) return;

  // Rarely the challenge is a full slide: longer reach pose, the target
  // is dumped for a proper stumble and the ball is knocked much further.
  const aiSlide = netRand() < Math.min(0.35, 0.10 * I);

  tackler.tackleAnim = aiSlide ? 18 : 12;

  tackler.tackleDuration = aiSlide ? 18 : 12;

  tackler.tackleCooldown = aiSlide ? 780 : 600;

  const dx = ball.x - target.x;

  const dy = ball.y - target.y;

  const l = Math.hypot(dx, dy) || 1;

  ball.vx = dx / l * (aiSlide ? 16 : 10) + (netRand() - 0.5) * 3;

  ball.vy = dy / l * (aiSlide ? 16 : 10) + (netRand() - 0.5) * 3;

  setBallToucher(null);

  ballCarrier = null;

  ball.passTarget = null;

  target.stumble = aiSlide ? 150 : 30;
  if (tackler.team === "blue") sponsorNote("tackles");
  if (target === player && (ballCarrier === player || player.hadBall)) {
    player.indicatorText = "TACKLED!";
    player.indicatorFrames = 40;
  }
  if (currentMode === "myclub" && target.team === "blue") maybeInjureBluePlayer(target, aiSlide);

  // Whistle: the AI challenge can also be judged a foul/card. The free
  // kick goes to the fouled side — against the human that means the user
  // himself takes it.
  const judgement = rollAiJudgement(aiSlide);

  if (judgement) {

    startFreekick(target.team, target.x, target.y, tackler, judgement);

  }

  tackleBlockedThisFrame = true;

}
function aiKick(p, longDist) {

  if (p.cooldown > 0) { 

    p.cooldown--; 

    return; 

  } 

 

  if (distance(p, ball) < 100) { 

const goalLineX = p.team === "blue" ? field.x + field.width - 16 : field.x + 16;

    const longRange = !!longDist;

    const shootingFactor = p.shooting / 70;

    const aiming = Math.max(0.25, Math.min(1, p.shooting / 100));

    const opening = goalHeight / 2 - 24;

    // The keeper camps mid-goal: a composed finisher picks a corner while
    // weaker shooters spray around the mouth.
    const pickCorner = netRand() < 0.35 + aiming * 0.4;

    const aimY = pickCorner

      ? H / 2 + (netRand() < 0.5 ? -1 : 1) * opening

      : H / 2 + (netRand() * 2 - 1) * opening * 0.6;

    // Dispersion shrinks with shooting quality and close range; long blasts
    // still spray but capable strikers rein them in. Wide scatter = off
    // target.
    const spread = (longRange ? (90 + longDist * 0.12) : (34 - aiming * 8)) / Math.max(0.45, aiming);

    const targetY = aimY + (netRand() * 2 - 1) * spread;

    // Better shooters hit harder and recover faster (clamped so absurd
    // stats don't break the keeper).
    const power = Math.max(longRange ? 13 : 8, Math.min(longRange ? 19 : 15, 9 * shootingFactor));

    const cooldown = longRange

      ? 90

      : Math.round(

          Math.max(12, Math.min(45, 35 / shootingFactor))

        );

    const dx = goalLineX - ball.x;

    const dy = targetY - ball.y;

    const length = Math.hypot(dx, dy) || 1; 

 

    if (ballCarrier === p) ballCarrier = null; 

 

    setBallToucher(p); 

 

    ball.vx = dx / length * power; 

    ball.vy = dy / length * power; 

 

    p.cooldown = cooldown;

    p.kickAnim = 14;

  }

}
 

 

function aiPass(p) {

  const dir = p.team === "blue" ? 1 : -1;

  const passRange = Math.max(430, Math.min(1150, 800 * (p.passing / 70)));

  const foes = p.team === "blue" ? opponents : teammates.concat([player]);

  let best = null;

  let bestScore = -Infinity;

  for (const tm of allPlayers) {

    if (tm.sentOff || tm === p) continue;

    if (tm.team !== p.team) continue;

    if (tm.role === "goalkeeper") continue;

    const d = distance(tm, p);

    if (d >= passRange) continue;

    let openness = 999;

    for (const f of foes) {

      const fd = distance(f, tm);

      if (fd < openness) openness = fd;

    }

    const forward = (tm.x - p.x) * dir;

    // Prefer open, more-advanced teammates; sideways keep-balls aren't
    // plays. Blue teammates are weighted to find the human forward so AI
    // build-up flows into the user's possession.
    const score =
      -d +
      forward * 0.6 +
      Math.min(openness, 260) * 0.25 +
      (tm === player ? 60 : 0);

    if (score > bestScore) {

      bestScore = score;

      best = tm;

    }

  }

  if (!best) return false;

  // Only pull the trigger when the pass keeps the attack moving or bails
  // the carrier out - never a blind backwards ball into pressure.
  if ((best.x - p.x) * dir < -80) return false;

  const aimX = Math.max(field.x + 20, Math.min(field.x + field.width - 20, best.x));

  const aimY = Math.max(field.y + 20, Math.min(field.y + field.height - 20, best.y));

  const adx = aimX - ball.x;

  const ady = aimY - ball.y;

  const alength = Math.hypot(adx, ady) || 1;

  const length = Math.hypot(best.x - ball.x, best.y - ball.y) || 1;

  const passSpeed = Math.max(8, Math.min(22, (length / 15) * (p.passing / 70)));

  if (ballCarrier === p) ballCarrier = null;

  setBallToucher(p);

  ball.vx = adx / alength * passSpeed;

  ball.vy = ady / alength * passSpeed;

  ball.passTarget = best;

  // Nudge the ball clear of the passer's feet so it isn't re-captured on
  // the very next frame by the player who just released it.
  const nudge = Math.min(18, length * 0.12);

  ball.x += adx / alength * nudge;

  ball.y += ady / alength * nudge;

  p.kickAnim = 14;

  p.cooldown = 26 + Math.floor(netRand() * 14);

  return true;

}

function nudgeBall() {
  if (!netActionAllowed()) return;

  // Manual ball rescue (Z): if the ball ever gets wedged between players
  // or stuck on a keeper who can't pick it up, pop it out from under the
  // nearest non-holder so play can continue.

  if (matchPenalty) return;

  const step = 6;

  let nearest = null;

  let nd = Infinity;

  for (const p of allPlayers) {

    if (p.sentOff) continue;

    const d = distance(p, ball);

    if (d < nd) {

      nd = d;

      nearest = p;

    }

  }

  // Free the ball from whoever held it so the nudge actually sticks, and
  // keep that player (e.g. a keeper who just smothered it) from instantly
  // re-claiming it before it has a chance to escape.
  if (ballCarrier) {

    if (ballCarrier.holdsBall) {

      ballCarrier.holdsBall = false;

      ballCarrier.holdFrames = 0;

    }

    ballCarrier.grabCooldown = 100;

    ballCarrier = null;

  }

  ball.passTarget = null;

  setBallToucher(null);

  // A ground-level rescue: drop any loft back down so the nudge can't leave
  // the ball hanging in the air.
  ballGroundReset();

  ball.vx = 0;

  ball.vy = 0;

  let dx = 0;

  let dy = 0;

  if (nearest && nd > 0) {

    dx = (ball.x - nearest.x) / nd;

    dy = (ball.y - nearest.y) / nd;

  } else {

    dy = -1;

  }

  // Small nudge normally; if the ball is literally inside another player,
  // push it clear of their contact radius so it never re-wedges.
  let push = step;

  if (nearest && nd < nearest.radius + ball.radius + step) {

    push = (nearest.radius + ball.radius + step) - nd;

  }

  ball.x = Math.max(field.x + ball.radius, Math.min(field.x + field.width - ball.radius, ball.x + dx * push));

  ball.y = Math.max(field.y + ball.radius, Math.min(field.y + field.height - ball.radius, ball.y + dy * push));

}


function opponentsOf(p) {
  if (p.team === "red") {
    return teammates.concat([player]);
  }
  return opponents;
}

function glueAwayFromBlockers(p, ux, uy) {
  // If the usual dribble pin point is occupied by an opposing player, the
  // ball would just re-pin into their body every frame and both players
  // get frozen shuffling on the spot. Rotate the pin to a free angle
  // around the dribbler so the deadlock resolves and the carrier can
  // actually move the ball past a defender.
  const foes = opponentsOf(p);
  const aoff = p.radius + ball.radius + 5;
  const pinOK = (cx, cy) => {
    if (cx < field.x + ball.radius || cx > field.x + field.width - ball.radius) return false;
    if (cy < field.y + ball.radius || cy > field.y + field.height - ball.radius) return false;
    for (const f of foes) {
      if (f.sentOff) continue;
      if (f === p) continue;
      if (Math.hypot(f.x - cx, f.y - cy) < f.radius + ball.radius + 2) return false;
    }
    return true;
  };
  if (pinOK(p.x + ux * aoff, p.y + uy * aoff)) return [ux, uy];
  for (let kk = 1; kk < 8; kk++) {
    const a = kk * Math.PI / 4;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const rx = ux * cosA - uy * sinA;
    const ry = ux * sinA + uy * cosA;
    if (pinOK(p.x + rx * aoff, p.y + ry * aoff)) return [rx, ry];
  }
  return [ux, uy];
}
function collideWithBall(p) { 

  // The referee never plays the ball - he just jogs along and the ball
  // passes him by.
  if (p.role === "referee") return;

  // A ball in the air (chip, lob, lofted cross, bicycle) sails over every
  // standing foot on the pitch: nobody can claim it until it drops back
  // inside head height.
  if (ball.z > BALL_CONTROL_HEIGHT) return;

  // A goalkeeper never wins the ball through body collisions - his grabs,
  // holds, punches and throw-outs are all handled in moveGoalkeeper. Letting
  // the collision code claim for him re-pinned the ball at his feet the
  // instant he'd passed it out, which left a stale "ballCarrier" that
  // stopped the intended receiver from taking the ball.
  if (p.role === "goalkeeper") return;

  // Nobody can win the ball off a player who's on it by running into
  // him - the ball stays glued to the dribbler. Only a tackle (V /
  // slides / AI challenges), a keeper grab, or a first touch on an
  // incoming pass (passTarget) can change who owns it.
  if (ballCarrier && ballCarrier !== p && ball.passTarget !== p) return;

  // Dribble lock: the human player carries the ball glued just ahead of
  // their feet, following their facing while they move. Skipped briefly
  // after a pass so a moving player can't re-capture the ball instantly —
  // unless the pass was blocked and the ball has already gone dead.
  if (p === player && p.role !== "goalkeeper" && (p.stumble || 0) <= 0 && (p.slideTackle || 0) <= 0 && !(ballCarrier && ballCarrier.role === "goalkeeper" && ballCarrier.holdsBall) && ((player.passLockT || 0) <= 0 || (Math.abs(ball.vx) < 1.2 && Math.abs(ball.vy) < 1.2)) && (ballCarrier === p || distance(p, ball) < p.radius + ball.radius)) { 

    // Settling on the ball: the frame the player first takes possession, arm a
    // short touch cooldown (the same one an AI receiver gets). Without it the
    // pad nudge in applyHumanBallControl was live on the very frame the ball
    // arrived, so a right stick that was merely still-tilted knocked the ball
    // straight back out of the player's feet.
    if (ballCarrier !== p) player.touchCd = 12;

setBallToucher(p);

ballCarrier = p;

    const ux = p.facingX || (p.team === "blue" ? 1 : -1);
    const uy = p.facingY || 0;
    const gl = glueAwayFromBlockers(p, ux, uy);
    ball.x = p.x + gl[0] * (p.radius + ball.radius + 5);
    ball.y = p.y + gl[1] * (p.radius + ball.radius + 5); 

    ball.x = Math.max( 

      field.x + ball.radius, 

      Math.min(field.x + field.width - ball.radius, ball.x) 

    ); 

    ball.y = Math.max( 

      field.y + ball.radius, 

      Math.min(field.y + field.height - ball.radius, ball.y) 

    ); 

    ball.vx = 0; 

    ball.vy = 0; 

    ball.passTarget = null; 

    return; 

  } 

  // A keeper currently holding the ball keeps it - nobody can
  // dispossess him just by walking into the ball.
  if (ballCarrier && ballCarrier.role === "goalkeeper" && ballCarrier.holdsBall && ballCarrier !== p) return;

  if (distance(p, ball) < p.radius + ball.radius) { 

    const dx = ball.x - p.x; 

    const dy = ball.y - p.y; 

    const length = Math.hypot(dx, dy) || 1; 

 

    ball.x = p.x + dx / length * (p.radius + ball.radius); 

    ball.y = p.y + dy / length * (p.radius + ball.radius); 

 

    ball.x = Math.max( 

      field.x + ball.radius, 

      Math.min(field.x + field.width - ball.radius, ball.x) 

    ); 

 

    ball.y = Math.max( 

      field.y + ball.radius, 

      Math.min(field.y + field.height - ball.radius, ball.y) 

    ); 

 

if (p !== player) {

      // Downed players can't claim the ball - they just lie there and
      // the ball stays loose instead of getting glued between them.
      if ((p.stumble || 0) > 0) return;

      // The carrier ahead in the loop already owns it this frame - don't
      // knock it loose or yank possession, just leave the ball with him.
      // Steals only come from tackles and keeper pickups.
      if (ballCarrier && ballCarrier !== p) {
        return;
      }

      // The intended receiver settles the ball for a controlled

      // first touch and holds it briefly; anyone else snapping the

      // ball out of the pass gets the usual reaction kick.

      const receiving = ball.passTarget === p;

      ball.passTarget = null;

      if (receiving) {

        // First touch settles the ball under control - the receiver
        // claims it and starts dribbling instead of punching it forward.
        p.cooldown = 25;

      } else {

        p.cooldown = 30;

      }

      ballCarrier = p;
      // Taking possession IS a touch, so it has to run through setBallToucher.
      // Claiming the ball without it meant the offside phase was never
      // re-evaluated for the receiving team - the flag was only ever raised for
      // whoever happened to be holding the ball when the pass was played, so a
      // flagged attacker running onto the pass was judged on his own touch (which
      // clears the flag) and the goal stood.
      setBallToucher(p);
      const aux = p.facingX || (p.team === "blue" ? 1 : -1);
      const auy = p.facingY || 0;
      const gl = glueAwayFromBlockers(p, aux, auy);
      const aoff = p.radius + ball.radius + 5;
      ball.x = p.x + gl[0] * aoff;
      ball.y = p.y + gl[1] * aoff;
      ball.x = Math.max(field.x + ball.radius, Math.min(field.x + field.width - ball.radius, ball.x));
      ball.y = Math.max(field.y + ball.radius, Math.min(field.y + field.height - ball.radius, ball.y));
      ball.vx = 0;
      ball.vy = 0;

    } else {

      ball.passTarget = null;

      ball.vx += dx / length * 0.25;

      ball.vy += dy / length * 0.25;

    }

  } 

} 

 

function bounce(velocity, outwardSign) { 

  const reflected = velocity * -0.8; 

  const MIN_BOUNCE_SPEED = 3; 

 

  if (Math.abs(reflected) < MIN_BOUNCE_SPEED) { 

    return MIN_BOUNCE_SPEED * outwardSign; 

  } 

 

  return reflected; 

} 
function updateBall() { 

  ball.x += ball.vx; 

  ball.y += ball.vy; 

   

  // Wet grass has less bite, so the ball carries further before it slows.
  const rollDecay = 0.992 + (1 - weatherGrip()) * 0.05;

  ball.vx *= rollDecay; 

  ball.vy *= rollDecay; 

   

  // Lofted ball physics: a struck ball rises under its own upward impulse,
  // falls back under gravity, and a spinning one bends across its flight.
  if (ball.z > 0 || ball.vz !== 0) {

    ball.z += ball.vz;

    ball.vz -= BALL_GRAVITY;

    if (ball.z > BALL_MAX_Z) { ball.z = BALL_MAX_Z; if (ball.vz > 0) ball.vz = 0; }

    if (ball.z <= 0) {

      // Landed: kill the height, keep a little of the pace rolling on.

      ball.z = 0;

      if (ball.vz < -1) ball.vz = -ball.vz * 0.34; else ball.vz = 0;

    }

  } 

  if (ball.spin) {

    const moving = Math.hypot(ball.vx, ball.vy);

    if (moving > 0.6) {

      // Bends along the normal of travel, and unwinds as it does.

      ball.vx += (-ball.vy / moving) * ball.spin;

      ball.vy += (ball.vx / moving) * ball.spin;

    }

    ball.spin *= 0.986;

    if (Math.abs(ball.spin) < 0.004) ball.spin = 0;

  } 

  if (ball.airT > 0) ball.airT--;

  if (ball.z <= 0) ball.airT = 0;

   

  // A pass feathers toward its receiver: as the ball nears the intended
  // player it brakes hard so it rolls TO them instead of skidding past.
  if (ball.passTarget && ball.z <= 0) {

    const dToTarget = distance(ball, ball.passTarget);

    if (dToTarget < 130) {

      ball.vx *= 0.84;

      ball.vy *= 0.84;

    }

  }
 

  // Top and bottom boundaries are handled by the out-of-play block below.

  // --- Out of play --------------------------------------------------------
  // The ball no longer bounces off the touchlines: leaving the field awards a
  // throw-in, a corner or a goal kick. If no restart can be awarded the old
  // bounce-back stays as a safety net so play can never stall dead.
  const outTop = ball.y - ball.radius < field.y;

  const outBottom = ball.y + ball.radius > field.y + field.height;

  const outLeft = ball.x - ball.radius < field.x;

  const outRight = ball.x + ball.radius > field.x + field.width;

  let awardedRestart = false;

  if (outTop || outBottom) {

    awardedRestart = startOutOfPlay(true, ball.x, outTop ? field.y : field.y + field.height);

  } else if (outLeft || outRight) {

    if (ball.y > goalTop && ball.y < goalBottom) {

      const scoringTeam = outLeft ? "red" : "blue";

      // Offside: the goal does not count if the attacker who got there was
      // beyond the second-last defender when the ball was played to him. It is
      // an indirect free kick to the defending side, taken where he interfered.
      // Penalties are exempt, and so is a ball last touched by a defender
      // (that is simply an own goal).
      if (!matchPenalty && ball.lastToucher && ball.lastToucher.offside && ball.lastToucher.team === scoringTeam) {
        const spotX = Math.max(field.x + 60, Math.min(field.x + field.width - 60, ball.x));
        const spotY = Math.max(field.y + 60, Math.min(field.y + field.height - 60, ball.y));
        const defendingTeam = scoringTeam === "blue" ? "red" : "blue";
        // The flag is called over the toucher - and, sent through the replay,
        // the whole build-up - before the indirect free kick is awarded.
        ball.lastToucher.offside = false;
        ball.lastToucher.indicatorText = "OFFSIDE!";
        ball.lastToucher.indicatorFrames = 70;
        goalMoment = takeSnapshot();
        goalReplay = replayBuffer.slice(-REPLAY_WINDOW);
        goalReplay.push(goalMoment);
        goalReplayIndex = 0;
        replayHold = 0;
        resetPositions();
        offsideReplay = { frames: goalReplay, team: defendingTeam, spotX, spotY };
        return;
      }

      goalScored(scoringTeam);

      return;

    }

    awardedRestart = startOutOfPlay(false, outLeft ? field.x : field.x + field.width, ball.y);

  }

  if (awardedRestart) return;

  if (outBottom) {

    ball.y = field.y + field.height - ball.radius;

    ball.vy = bounce(ball.vy, -1);

  }

  if (outTop) {

    ball.y = field.y + ball.radius;

    ball.vy = bounce(ball.vy, 1);

  }

  if (outLeft) {

    ball.x = field.x + ball.radius;

    ball.vx = bounce(ball.vx, 1);

  }

  if (outRight) {

    ball.x = field.x + field.width - ball.radius;

    ball.vx = bounce(ball.vx, -1);

  }

 

  // Safety net: never let the ball's position drift outside the 

  // field (e.g. from being shoved by a player) beyond what the 

  // bounce logic above already corrected this frame. 

  ball.x = Math.max( 

    field.x + ball.radius, 

    Math.min(field.x + field.width - ball.radius, ball.x) 

  ); 

 

  ball.y = Math.max( 

    field.y + ball.radius, 

    Math.min(field.y + field.height - ball.radius, ball.y) 

  ); 

} 

 

function resetPositions() {
  
  // Every restart clears the offside phase: the next ball played forward is
  // judged fresh.
  clearOffside();
  
  for (const p of allPlayers) {

    // Sent-off players stay parked on the bench between restarts.
    if (p.sentOff) { 

      const isBlue = p.team === "blue"; 

      p.x = isBlue ? field.x + 140 : field.x + field.width - 140; 

      p.y = isBlue ? field.y + field.height + 40 : field.y - 40; 

      p.tackleAnim = 0; 

      p.tackleCooldown = 0; 

      continue; 

    } 

    p.x = p.startX; 

    p.y = p.startY; 

    p.cooldown = 0; 

    p.stumble = 0; 

    p.tackleAnim = 0; 

    p.tackleCooldown = 0; 

  } 

  player.hadBall = false;
  player.indicatorFrames = 0; 

 

ball.x = PITCH_CX;

  ball.y = PITCH_CY;

ball.vx = 0; 

  ball.vy = 0; 

  ball.passTarget = null; 

  ballGroundReset();

  setBallToucher(null); 

  ballCarrier = null; 

}

 

// A cheap state snapshot used both as the rolling replay buffer and as
// the captured scoring moment. Only positions/facing/phase are stored.
function takeSnapshot() { 

  const players = new Array(allPlayers.length); 

  for (let i = 0; i < allPlayers.length; i++) { 

    const p = allPlayers[i]; 

    players[i] = [p.x, p.y, p.facingX, p.facingY, p.walk || 0]; 

  } 

  return { players, ball: [ball.x, ball.y, ball.vx, ball.vy] }; 

} 

function applySnapshot(snap) { 

  for (let i = 0; i < allPlayers.length; i++) { 

    const p = allPlayers[i]; 

    const s = snap.players[i]; 

    p.x = s[0]; 

    p.y = s[1]; 

    p.facingX = s[2]; 

    p.facingY = s[3]; 

    p.walk = s[4] || 0; 

    p.kickAnim = 0; 

    p.tackleAnim = 0; 

    p.stumble = 0; 

    p.slideTackle = 0; 

    p.celebrate = 0; 

    p.celebratePhase = 0; 

  } 

  ball.x = snap.ball[0]; 

  ball.y = snap.ball[1]; 

  ball.vx = 0; 

  ball.vy = 0; 

  setBallToucher(null); 

  ballCarrier = null; 

  ball.passTarget = null; 

} 

function recordSnapshot() { 

  replayBuffer.push(takeSnapshot()); 

  if (replayBuffer.length > REPLAY_BUFFER_MAX) replayBuffer.shift(); 

} 

function startCelebration() { 

  // Rally point just inside the pitch at the goal-mouth the ball crossed.
  const gx = goalMoment ? goalMoment.ball[0] : celebrationSpot.x; 
  celebrationSpot.x = Math.max(field.x + 120, Math.min(field.x + field.width - 120, gx)); 
  celebrationSpot.y = (goalMoment ? goalMoment.ball[1] : celebrationSpot.y); 

  for (const p of allPlayers) { 

    if (p.sentOff) continue; 

    if (p.team !== celebrateTeam) continue; 

    p.celebrate = 1; 

    p.celebratePhase = netRand() * Math.PI * 2; 

    const off = 40 + netRand() * 80; 

    const ang = netRand() * Math.PI * 2; 

    p._celebrateTx = celebrationSpot.x + Math.cos(ang) * off; 

    p._celebrateTy = celebrationSpot.y + Math.sin(ang) * off; 

  } 

} 

function stepCelebration() { 

  for (const p of allPlayers) { 

    if (p.sentOff) continue; 

    if (p.team !== celebrateTeam) continue; 

    p.celebrate = (p.celebrate || 0) + 1; 

    p.celebratePhase = (p.celebratePhase || 0) + 0.16; 

    p.walk = (p.walk || 0) + 0.5; 

    const distTo = distance(p, { x: p._celebrateTx, y: p._celebrateTy }); 

    if (distTo > 14) { 

      moveToward(p, p._celebrateTx, p._celebrateTy, p.speed * 2.1); 

      keepInsideField(p); 

    } else { 

      // Once at the rally point, keep the party going by grabbing a new
      // spot nearby every so often instead of freezing on the spot.
      p._celebReroll = (p._celebReroll || 0) + 1; 
      if (p._celebReroll > 32) { 
        p._celebReroll = 0; 
        const off = 60 + netRand() * 120; 
        const ang = netRand() * Math.PI * 2; 
        p._celebrateTx = celebrationSpot.x + Math.cos(ang) * off; 
        p._celebrateTy = celebrationSpot.y + Math.sin(ang) * off; 
      } 

    } 

  } 

  celebrateFrames--; 

  if (celebrateFrames <= 0) { 

    for (const p of allPlayers) { 

      p.celebrate = 0; 

      p.celebratePhase = 0; 

      p._celebReroll = 0; 

    } 

    // Celebration is done. The goal sequence is OVER: end it and hand the
    // match back to live play with a kickoff countdown. This used to jump back
    // to "replay" instead, so replay -> celebrate -> replay cycled forever and
    // the match stayed frozen on the goal for good, because the celebration
    // never consumed the frames that would have ended it.
    goalReplayIndex = 0;
    replayHold = 0;
    goalPhase = "";
    resetPositions();
    postGoalPause = 180;
    countdownSeconds = 3;

  } 
}

 

// ---- Pitch invasion ----
let invasion = null;            // {frames, crowd[], kind, leaving}

const INVADE_STAY_FRAMES = 420; // ~7s of celebrating on the pitch

const INVADE_COLORS = ["#e34f4f", "#4f8fe3", "#f5f5f0", "#f7c948", "#62d18b", "#9b6bd1", "#ff8b4f", "#4fc7d1"];

// True when the current (unplayed) player match is the tournament final.
function isInFinal() {
  const match = findPlayerMatch();
  if (!match) return false;
  const group = getPlayerGroup();
  if (group && group.matches.indexOf(match) !== -1) return false;
  const idx = KNOCKOUT_ROUNDS.findIndex(key => ((tournament[key] || []).indexOf(match) !== -1));
  return idx === KNOCKOUT_ROUNDS.length - 1;
}

// Spawn a crowd from the touchlines that sprints onto the pitch and mills
// around the scoring spot. "final" floods the field with supporters, the
// smaller "clutch" rush is for late winners and equalizers.
function createInvasion(kind, cx, cy) {
  if (invasion) return;
  const count = kind === "final" ? 150 : 70;
  const crowd = [];
  for (let i = 0; i < count; i++) {
    const side = i % 4;
    let x, y;
    if (side === 0) { x = field.x + 80 + netRand() * (field.width - 160); y = field.y - 10; }
    else if (side === 1) { x = field.x + 80 + netRand() * (field.width - 160); y = field.y + field.height + 10; }
    else if (side === 2) { x = field.x - 10; y = field.y + 120 + netRand() * (field.height - 240); }
    else { x = field.x + field.width + 10; y = field.y + 120 + netRand() * (field.height - 240); }
    const off = 30 + netRand() * 170;
    const ang = netRand() * Math.PI * 2;
    crowd.push({
      x: x, y: y,
      sx: x, sy: y,
      tx: Math.max(field.x + 24, Math.min(field.x + field.width - 24, cx + Math.cos(ang) * off)),
      ty: Math.max(field.y + 24, Math.min(field.y + field.height - 24, cy + Math.sin(ang) * off)),
      speed: 2.4 + netRand() * 2.6,
      phase: netRand() * Math.PI * 2,
      bob: 0.5 + netRand() * 0.9,
      color: INVADE_COLORS[(netRand() * INVADE_COLORS.length) | 0],
      radius: 18,
      px: x, py: y, role: "attacker", name: "",
      stumble: 0, kickAnim: 0, tackleAnim: 0, tackleDuration: 12,
      celebrate: 0, indicatorFrames: 0
    });
  }
  invasion = { frames: 0, crowd: crowd, kind: kind, leaving: false };
}

// Run onto the pitch, mill around, then run back off when their time is up.
function stepInvasion() {
  if (!invasion) return;
  invasion.frames++;
  for (const m of invasion.crowd) {
    const d = distance(m, { x: m.tx, y: m.ty });
    if (d > 10) {
      moveToward(m, m.tx, m.ty, m.speed);
    } else if (!invasion.leaving && netRand() < 0.008) {
      const off = 20 + netRand() * 100;
      const ang = netRand() * Math.PI * 2;
      m.tx = Math.max(field.x + 24, Math.min(field.x + field.width - 24, m.x + Math.cos(ang) * off));
      m.ty = Math.max(field.y + 24, Math.min(field.y + field.height - 24, m.y + Math.sin(ang) * off));
    }
  }
  if (!invasion.leaving && invasion.frames >= INVADE_STAY_FRAMES) {
    invasion.leaving = true;
    for (const m of invasion.crowd) { m.tx = m.sx; m.ty = m.sy; m.speed = 3.6; }
  }
  if (invasion.leaving) {
    let offPitch = 0;
    for (const m of invasion.crowd) {
      const d = distance(m, { x: m.sx, y: m.sy });
      if (d > 10) moveToward(m, m.sx, m.sy, m.speed);
      else offPitch++;
    }
    if (offPitch >= invasion.crowd.length) invasion = null;
  }
}

// A simple little supporter figure, depth-sorted with the players.
function drawInvader(m) {
  // Supporters use the exact same player figure and size as the outfield
  // players, just in crowd colors, so an invasion floods the pitch with
  // full-size people rather than little bobble-heads.
  drawPlayer(m);
}

 

let freekick = null;      // active free-kick restart: {team,x,y,taker,frames,wait,card,offender}

let cardFlash = null;     // center-screen card call-out: {color,text,name,frames}

const FREEKICK_CLEAR_DIST = 280;  // how far everyone backs off from the spot

const FREEKICK_WAIT_FRAMES = 180; // ~3 seconds of countdown before the kick

let matchPenalty = null;      // in-match penalty kick: {team,x,y,spot,taker,keeper,phase,...}

// Held state of the shoot button (from startChargingShot/releaseShot). The
// charge gates it off during a match penalty, but the flag still tracks the
// physical press so the user can TAKE the penalty on the kick button.
let shotHeld = false;

const MATCH_PENALTY_WAIT_FRAMES = 120; // ~2 seconds of "PENALTY IN" before the run-up

// Practice Arena drill state. A drill is "open" during regular practice and one
// of the repeating set-piece drills otherwise: the sim loops the same kind of
// restart over and over so the user can grind one discipline.
// {kind:"freekick"|"corner"|"penalty", phase:"rep"|"cooldown", wait, flight, reps, scored, alt}
let practiceDrill = null;
const PRACTICE_COOLDOWN = 70;  // frames between a rep finishing and the next staging

const PRACTICE_REP_WAIT = 100; // frames of loose ball after a strike before the drill resets

const PRACTICE_IDLE_RESET = 540; // frames a rep may sit untaken before the drill re-stages it

 

// Normal tackle = ~35% foul / ~7% yellow; slide tackle = ~36% yellow / ~14% red.
function rollTackleJudgement(sliding) {

  if (sliding) {

    if (netRand() < 0.05) return "red";

    if (netRand() < 0.16) return "yellow";

    return null;

  }

  if (netRand() < 0.02) return "yellow";

  if (netRand() < 0.10) return "foul";

  return null;

}

// The AI commits a gentler share of fouls so the game doesn't grind to a
// halt on whistles — but slides are still punished hard.
function rollAiJudgement(sliding) {

  if (sliding) {

    if (netRand() < 0.03) return "red";

    if (netRand() < 0.08) return "yellow";

    return null;

  }

  if (netRand() < 0.01) return "yellow";

  if (netRand() < 0.04) return "foul";

  return null;

}

// Stop play and spot a free kick for the fouled side. The ball is pinned
// to the exact spot; a ~3-second KICKOFF-style countdown runs first, then
// everyone except the taker backs off down the field while the taker
// strides up to strike the ball. The user's team takes with the human.
// --- Out of play ----------------------------------------------------------
// Who gets the ball when it leaves the field:
//   touchline  -> throw-in to the team that did NOT touch it last
//   goal line  -> corner to the attackers if a defender put it out,
//                 otherwise a goal kick for the defending side
// Red attack the left goal (blue defend it) and blue attack the right goal.
function outOfPlayTeam(onTouchline, leftEnd) {
  const lt = ball.lastToucher;
  const other = lt ? (lt.team === "blue" ? "red" : "blue") : (leftEnd ? "red" : "blue");
  if (onTouchline) return other;
  const defending = leftEnd ? "blue" : "red";
  if (lt && lt.team === defending) return other;
  return defending;
}

// Awards the restart and pins the ball on the correct spot. Returns true when
// a restart actually started so the caller can leave updateBall early; false
// means play could not be stopped (no match, a set piece already running) and
// the caller falls back to bouncing the ball back in bounds.
function startOutOfPlay(onTouchline, exitX, exitY) {
  if (!matchRunning || goalPhase !== "" || freekick || matchPenalty) return false;
  // During a repeating practice drill the loop stages its own next restart, so
  // ordinary goal kicks / corners / throw-ins are suppressed and the ball just
  // bounces back in bounds until the drill resets.
  if (currentMode === "practice" && practiceDrill && practiceDrill.kind !== "open") return false;
  const leftEnd = exitX <= field.x + 1;
  const team = outOfPlayTeam(onTouchline, leftEnd);
  const spotX = Math.max(field.x + 25, Math.min(field.x + field.width - 25, exitX));
  let x, y, opts;

  if (onTouchline) {
    // Ball is placed just inside the touchline it crossed.
    x = spotX;
    y = exitY < field.y + field.height / 2 ? field.y + 25 : field.y + field.height - 25;
    opts = { kind: "throwIn", wait: 45, addStoppage: false, quiet: true };
  } else {
    const defending = leftEnd ? "blue" : "red";
    const nearTop = exitY < H / 2;
    if (ball.lastToucher && ball.lastToucher.team === defending) {
      // Defender's ball: corner flag, ball placed just inside the arc.
      x = leftEnd ? field.x + 25 : field.x + field.width - 25;
      y = nearTop ? field.y + 25 : field.y + field.height - 25;
      opts = { kind: "corner", wait: 250, addStoppage: false };
    } else {
      // Attacker's ball: goal kick from inside the six-yard area.
      x = leftEnd ? field.x + 150 : field.x + field.width - 150;
      y = H / 2;
      opts = { kind: "goalKick", wait: 90, addStoppage: false };
    }
  }

  startFreekick(team, x, y, null, null, opts);
  return !!freekick;
}

// --- Practice drills ---------------------------------------------------------
// The Practice Arena can loop one repeating set piece so the user can grind a
// single discipline instead of open play. stepPracticeDrill() runs once per sim
// tick: while a rep is staged (matchPenalty/freekick) nothing happens; once the
// strike is taken the ball gets a short flight window, then the drill rests a
// beat and stages the next identical spot.

function practiceDrillSpot() {
  const goalX = field.x + field.width;
  const box = Math.max(360, field.width / 7);
  const yOff = ((practiceDrill.alt % 3) - 1);
  return { x: goalX - (box + 120), y: PITCH_CY + yOff * 190, z: 0 };
}

function practiceStageRep() {
  if (currentMode !== "practice" || !practiceDrill || practiceDrill.kind === "open") return;
  for (const p of allPlayers) {
    p.holdsBall = false;
    p.holdFrames = 0;
    p.stumble = 0;
  }
  setBallToucher(null);
  ballCarrier = null;
  ball.vx = 0;
  ball.vy = 0;
  ball.z = 0;
  ball.passTarget = null;
  goalPhase = "";
  postGoalPause = 0;
  freekick = null;
  matchPenalty = null;
  clearOffside();
  resetPositions();

  practiceDrill.reps++;
  const kind = practiceDrill.kind;
  if (kind === "penalty") {
    beginMatchPenalty("blue", penaltySpotX(true), H / 2, null, null);
  } else if (kind === "freekick") {
    const pt = practiceDrillSpot();
    startFreekick("blue", pt.x, pt.y, null, null,
                  { kind: "freekick", wait: FREEKICK_WAIT_FRAMES, addStoppage: false, quiet: true });
  } else if (kind === "corner") {
    const topCorner = (practiceDrill.alt % 2) === 0;
    startFreekick("blue", field.x + field.width - 25,
                  topCorner ? field.y + 25 : field.y + field.height - 25, null, null,
                  { kind: "corner", wait: 250, addStoppage: false, quiet: true });
  }
}

function stepPracticeDrill() {
  const d = practiceDrill;
  if (!d || d.kind === "open") return;
  // A rep that sits untaken for a long beat re-stages instead of hanging - the
  // drill never strikes the ball for you, it just sets up the next attempt.
  const pieceIdle = freekick ? freekick.frames : matchPenalty ? matchPenalty.frames : 0;
  if (pieceIdle > PRACTICE_IDLE_RESET) {
    d.flight = 0;
    d.phase = "cooldown";
    d.wait = PRACTICE_COOLDOWN;
    return;
  }
  if (!freekick && !matchPenalty && goalPhase === "" && postGoalPause <= 0) {
    if (d.phase === "cooldown") {
      if (d.wait > 0) {
        d.wait--;
        return;
      }
      d.phase = "rep";
      d.flight = 0;
      d.alt = (d.alt || 0) + 1;
      practiceStageRep();
      return;
    }
    d.flight = (d.flight || 0) + 1;
    if (d.flight >= PRACTICE_REP_WAIT) {
      d.flight = 0;
      d.phase = "cooldown";
      d.wait = PRACTICE_COOLDOWN;
    }
    return;
  }
  d.flight = 0;
}

function practiceEndDrill() {
  practiceDrill = null;
  const hud = document.getElementById("drillHud");
  if (hud) hud.style.display = "none";
}

function updateDrillHud() {
  const hud = document.getElementById("drillHud");
  if (!hud) return;
  if (currentMode !== "practice" || !practiceDrill || practiceDrill.kind === "open") {
    if (hud.style.display !== "none") hud.style.display = "none";
    return;
  }
  const d = practiceDrill;
  const kind = d.kind;
  const names = { freekick: "FREE-KICK PRACTICE", corner: "CORNER PRACTICE", penalty: "PENALTY PRACTICE" };
  const marks = { freekick: "FK", corner: "CK", penalty: "PK" };
  let tip;
  if (kind === "penalty") {
    tip = d.phase === "cooldown" ? "Preparing the next spot-kick…" : "Aim with the Right Stick, then press KICK (Space / A)";
  } else if (kind === "freekick") {
    tip = "Hold Q / LT to tune HEIGHT (up) and BEND (left/right), then kick";
  } else {
    tip = "Aim with the Right Stick: left/right near/far, up/down float/fast, then kick";
  }
  const nextIn = d.phase === "cooldown" ? " · next in " + Math.ceil(d.wait / 60) + "s" : "";
  hud.innerHTML =
    "<span class='drillHudMark'>" + marks[kind] + "</span>" +
    "<span class='drillHudName'>" + names[kind] + "</span>" +
    "<span class='drillHudScore'>" + d.scored + " / " + d.reps + "</span>" +
    "<span class='drillHudTip'>" + tip + nextIn + "</span>";
  hud.style.display = "flex";
}

function startFreekick(team, spotX, spotY, offender, card, opts) {

  opts = opts || {};

  if (!matchRunning || goalPhase !== "" || freekick || matchPenalty) return;

  // Out-of-play restarts (throw-ins, corners, goal kicks) are routine and do
  // not burn stoppage time; a real free kick still does.
  if (opts.addStoppage !== false) stoppageMins++;

  if (card === "yellow") crowdEvent("yellow");
  else if (card === "red") crowdEvent("red");
  else if (!opts.quiet) crowdEvent("freekick"); 

  const x = Math.max(field.x + 25, Math.min(field.x + field.width - 25, spotX));

  const y = Math.max(field.y + 25, Math.min(field.y + field.height - 25, spotY));

  // A foul or card committed by the defending side inside its own box is a
  // penalty to the attacked team, not a free kick: only the team that
  // defends the goal at that end can concede a spot-kick there.
  if (offender && inPenaltyBox(x, y)) {
    const leftBox = x <= field.x + PBOX_DEPTH;
    const rightBox = x >= field.x + field.width - PBOX_DEPTH;
    const defenderOfBox = leftBox ? "blue" : rightBox ? "red" : null;
    if (defenderOfBox && offender.team === defenderOfBox) {
      beginMatchPenalty(team, x, y, offender, card);
      return;
    }
  }

  ball.x = x;

  ball.y = y;

  ball.vx = 0;

  ball.vy = 0;

  ball.passTarget = null;

  setBallToucher(null);

  ballCarrier = null;

 

  let taker = null;

  if (team === player.team && !player.sentOff) {

    taker = player;

  } else {

    const list = team === "blue" ? teammates : opponents;

    let bd = Infinity;

    for (const p of list) {

      if (p.role === "goalkeeper") continue;

      if (p.sentOff) continue;

      const d = Math.hypot(p.x - x, p.y - y);

      if (d < bd) { bd = d; taker = p; }

    }

    if (!taker) return;

  }

 

  freekick = { team: team, x: x, y: y, taker: taker, frames: 0, wait: opts.wait || FREEKICK_WAIT_FRAMES, card: card || null, offender: offender || null, kind: opts.kind || "freekick" };

  countdownSeconds = Math.max(1, Math.ceil(freekick.wait / 60));

  // Fresh set piece = fresh tuner: the user's HEIGHT/BEND reset to neutral.
  if (taker === player) { player.fkLift = 0.35; player.fkBend = 0; }

  applyFoulCard(offender, card);

}

// --- Aimed corner kicks ----------------------------------------------------
// A corner is crossed into the box, never driven at the goal. The taker aims
// with the right stick / movement keys: left-right picks the target across the
// goal mouth, up-down picks how high the ball is lofted.
function cornerAim(taker) {
  let dx = 0, dy = 0;
  const f = taker ? taker.netFrame : null;
  if (f && f.s && (f.s[0] || f.s[1])) { dx = f.s[0] || 0; dy = f.s[1] || 0; }
  else if (f && (f.up || f.down || f.left || f.right)) {
    dx = (f.right ? 1 : 0) - (f.left ? 1 : 0);
    dy = (f.down ? 1 : 0) - (f.up ? 1 : 0);
  }
  if (!dx && !dy) {
    // Nobody is aiming (the AI, or a human holding still): cross to the far
    // post, which is where a corner is worth the most.
    dx = taker && taker.team === "blue" ? 0.42 : -0.42;
    dy = -0.5;
  }
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m];
}

// Where the cross is headed: inside the box, across the goal mouth.
function cornerAimPoint(taker, aim) {
  const dir = taker.team === "blue" ? 1 : -1;
  const goalX = field.x + (dir > 0 ? field.width : 0);
  const spread = goalHeight / 2 - 46;
  return { x: goalX - dir * 120, y: H / 2 + aim[0] * spread };
}

// Lofts the ball from the corner to the aimed spot on a real arc, so it
// clears everyone packed into the box and drops into the target zone.
function crossCorner(taker, aim) {
  const a = aim || cornerAim(taker);
  const target = cornerAimPoint(taker, a);
  const dist = Math.hypot(target.x - ball.x, target.y - ball.y) || 1;
  const speed = Math.max(6.5, Math.min(12.5, dist / 24));
  const ux = (target.x - ball.x) / dist;
  const uy = (target.y - ball.y) / dist;
  ball.vx = ux * speed;
  ball.vy = uy * speed;
  const flight = dist / Math.max(1, speed);
  // Stick up = a floated, hanging cross; stick down = a flatter, faster ball.
  const hang = a[1] < 0 ? 1.18 : (a[1] > 0 ? 0.86 : 1);
  ballLaunch((0.5 * BALL_GRAVITY * flight) * hang + 0.3, ux * 1.1, flight);
  ball.passTarget = null;
  setBallToucher(taker);
  taker.kickAnim = 14;
  taker.cooldown = 8;
  taker.charging = false;
  taker.chargeFrames = 0;
  taker.indicatorText = a[0] < -0.25 ? "NEAR POST" : (a[0] > 0.25 ? "FAR POST" : "CROSS!");
  taker.indicatorFrames = 40;
}

// Shared by free kicks and in-box penalties: clears the offender's rag-doll
// state and applies the card (yellow-to-red wrap, red-carded dismissal,
// card flash, call-out) or plain foul call-out.
function applyFoulCard(offender, card) {

  if (offender) {

    offender.stumble = 0;

    offender.slideTackle = 0;

  }

  // Practice Arena keeps no cards: a yellow or red is just a plain foul (the
  // free kick still stands) so nobody is ever booked or sent off in a drill.
  if (currentMode === "practice") card = "foul";

  // Cards: a second yellow auto-converts to a red.
  if (card && card !== "foul") {

    let shown = card;

    stoppageMins++;

    if (card === "yellow") {

      offender.cards = (offender.cards || 0) + 1;

      if (offender.cards >= 2) {

        offender.cards = 2;

        shown = "red";

      }

    } else {

      offender.cards = 2;

    }

    const isRed = shown === "red";

    cardLog.push({

      minute: currentMinute(),

      team: offender.team,

      name: displayNameFor(offender),

      card: isRed ? "red" : "yellow"

    });

    if (isRed) sendOffPlayer(offender);

    cardFlash = {

      color: isRed ? "#ff4757" : "#ffd32a",

      text: isRed ? "RED CARD" : "YELLOW CARD",

      name: displayNameFor(offender),

      frames: isRed ? FREEKICK_WAIT_FRAMES : 150  // stay up through the countdown

    };

    offender.indicatorText = isRed ? "RED CARD!" : "YELLOW CARD!";

    offender.indicatorFrames = isRed ? 90 : 70;

    updateCards();

  } else if (offender) {

    offender.indicatorText = "FOUL!";

    offender.indicatorFrames = 45;

  }

}

 

function endFreekick() {

  freekick = null;

}

// Stages an in-match penalty kick for the fouled team. The ball is pinned
// on the spot, everyone is staged shootout-style, and a ~2s countdown runs
// before the taker's run-up. Blue's taker is the human; red's is picked by
// the AI. The corner placement is decided when the countdown ends.
function beginMatchPenalty(team, spotX, spotY, offender, card) {

  shotHeld = false;

  const x = Math.max(field.x + 10, Math.min(field.x + field.width - 10, spotX));

  const y = Math.max(field.y + 10, Math.min(field.y + field.height - 10, spotY));

  ball.x = x;

  ball.y = y;

  ball.vx = 0;

  ball.vy = 0;

  ball.z = 0;

  ball.passTarget = null;

  setBallToucher(null);

  ballCarrier = null;

  applyFoulCard(offender, card);

  const isPlayerShot = team === "blue";

  const dir = isPlayerShot ? 1 : -1;

  let taker = isPlayerShot && !player.sentOff ? player : null;

  if (!taker) {

    const list = team === "blue" ? teammates : opponents;

    for (const p of list) {

      if (p.role === "goalkeeper" || p.sentOff) continue;

      taker = p;

      break;

    }

  }

  if (!taker) taker = isPlayerShot ? player : opponents[0];

  penaltySetField(isPlayerShot);

  const spot = { x: penaltySpotX(isPlayerShot), y: H / 2 };

  taker.x = spot.x - dir * 84;

  taker.y = H / 2;

  const keeper = allPlayers.find(function (pp) {

    return pp.role === "goalkeeper" && pp.team === (isPlayerShot ? "red" : "blue");

  });

  matchPenalty = {

    team: team,

    x: x,

    y: y,

    isPlayerShot: isPlayerShot,

    dir: dir,

    goalX: isPlayerShot ? field.x + field.width : field.x,

    spot: spot,

    taker: taker,

    keeper: keeper,

    side: null,

    keeperSide: null,

    target: null,

    keeperTarget: null,

    goalFlag: true,

    arc: 34,

    maxFrames: Math.max(1, Math.round(penaltyAnimMs / 16)),

    frames: 0,

    wait: MATCH_PENALTY_WAIT_FRAMES,

    phase: "wait",

    done: false,

    prevShoot: false

  };

  countdownSeconds = isPlayerShot ? 0 : 3;

}

// The human aims their penalty with the full right stick for a precision
// strike. Pushing across the goal mouth (left = near post / keeper's far,
// right = far post) picks the post; nudging up or down lifts the shot under
// the bar or keeps it low. A gentle push places the ball a little off centre
// while a full diagonal flick buries it in the very corner. Movement keys
// fall back to the classic four corners. Returns the exact strike point (a
// goal-relative Y and height Z) plus the keeper-side zone that round belongs
// to, or null when the shooter isn't aiming at all.
function readPenaltyAim() {
  const sx = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  const sy = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  let across = 0, height = 0;
  const mag = Math.hypot(sx, sy);
  if (mag >= 0.35) {
    across = sx / mag;      // stick into the near post (-Y) or far post (+Y)
    height = -sy / mag;     // up = crossbar, down = along the turf
  } else {
    const leftK  = keys["arrowleft"] || keys["a"] || !!vInput.left;
    const upK    = keys["arrowup"]   || keys["w"];
    const downK  = keys["arrowdown"] || keys["s"] || !!vInput.down;
    const rightK = keys["arrowright"] || keys["d"] || !!vInput.right;
    if (leftK || upK) { across = -1; height = 1; }
    else if (rightK) { across = 1; height = 1; }
    else if (downK) { across = -1; height = -1; }
    else return null;
  }
  const acrossC = Math.max(-1, Math.min(1, across));
  const heightC = Math.max(-1, Math.min(1, height));
  const L = acrossC <= -0.45, R = acrossC >= 0.45;
  const T = heightC >= 0.45, B = heightC <= -0.45;
  let side;
  if (!L && !R) side = "MID";
  else if (T) side = L ? "TL" : "TR";
  else if (B) side = L ? "BL" : "BR";
  else side = L ? "TL" : "TR";
  const yRange = ((goalBottom - 36) - (goalTop + 36)) / 2;
  const y = H / 2 + acrossC * yRange;
  const z = 39 + heightC * 25;
  return { side: side, y: y, z: z };
}

function penaltyCommitAim(mp) {
  const aim = readPenaltyAim();
  if (aim) {
    mp.side = aim.side;
    mp.target = { x: mp.goalX - mp.dir * 12, y: aim.y, z: Math.max(6, aim.z) };
  } else {
    mp.side = penaltyRandSide();
    mp.target = penaltyCorner(mp.isPlayerShot, mp.side);
  }
  mp.keeperSide = penaltyRandSide();
  mp.goalFlag = mp.side !== mp.keeperSide;
  mp.keeperTarget = penaltyKeeperDiveSpot(mp.isPlayerShot, mp.keeperSide);
}

function penaltyStartRunup(mp) {
  mp.phase = "runup";
  ball.x = mp.spot.x;
  ball.y = mp.spot.y;
  ball.z = 0;
  ball.vx = 0;
  ball.vy = 0;
  setBallToucher(null);
  ballCarrier = null;
  mp.taker.kickAnim = 0;
}

function stepMatchPenalty() {

  const mp = matchPenalty;

  if (!mp || mp.done) return;

  mp.frames++;

  const tk = mp.taker;

  const gk = mp.keeper;

  if (!tk || !gk) { matchPenalty = null; return; }

  if (mp.phase === "wait") {

    // The AI's spot-kick still runs on a countdown as before.
    if (!mp.isPlayerShot) {

      if (mp.frames < mp.wait) {

        const secs = Math.max(1, Math.ceil((mp.wait - mp.frames) / 60));

        if (countdownSeconds !== secs) countdownSeconds = secs;

        return;

      }

      penaltyCommitAim(mp);

      penaltyStartRunup(mp);

      return;

    }

    // ...but the user's penalty is fully manual: no clock, aim with the right
    // stick, and take it on the kick button. A full-stick flick pins the
    // corner; a gentle push or no aim still strikes somewhere sensible.
    countdownSeconds = 0;

    const nowShoot = shotHeld;

    const pressEdge = nowShoot && !mp.prevShoot;

    mp.prevShoot = nowShoot;

    const aimHere = readPenaltyAim();

    tk.indicatorText = aimHere ? ("PRESS KICK! - " + aimHere.side) : "AIM WITH STICK - PRESS KICK";

    tk.indicatorFrames = 30;

    if (pressEdge) {

      penaltyCommitAim(mp);

      penaltyStartRunup(mp);

    }

    return;

  }

  if (mp.phase === "runup") {

    if (Math.abs(tk.x - mp.spot.x) > 26 || Math.abs(tk.y - mp.spot.y) > 26) {

      moveToward(tk, mp.spot.x, mp.spot.y, 16);

    } else {

      mp.phase = "flight";

      tk.kickAnim = 8;

      penaltyLaunchBall(mp);

    }

    return;

  }

  ball.x += ball.vx;

  ball.y += ball.vy;

  const seg = Math.abs(ball.x - mp.spot.x) / 430;

  const t = Math.min(1, Math.max(0, seg));

  ball.z = mp.arc * 4 * t * (1 - t) + (mp.target ? mp.target.z : 0) * t;

  moveToward(gk, mp.keeperTarget.x, mp.keeperTarget.y, 30);

  gk.y = Math.max(goalTop + gk.radius, Math.min(goalBottom - gk.radius, gk.y));

  gk.x = Math.max(mp.goalX - mp.dir * 80, Math.min(mp.goalX - mp.dir * 4, gk.x));

  const crossed = mp.dir === 1 ? ball.x > mp.goalX - ball.radius : ball.x < mp.goalX + ball.radius;

  const inMouth = ball.y > goalTop && ball.y < goalBottom;

  if (crossed) ball.x = mp.goalX - mp.dir * ball.radius;

  const missFrames = mp.wait + mp.maxFrames + 30;

  if (mp.goalFlag) {

    if ((crossed && inMouth) || mp.frames > missFrames) resolveMatchPenalty(true);

  } else if (distance(gk, ball) < 44 || mp.frames > missFrames) {

    resolveMatchPenalty(false);

  }

}

function resolveMatchPenalty(scored) {

  const mp = matchPenalty;

  if (!mp || mp.done) return;

  mp.done = true;

  countdownSeconds = 0;

  ball.vx = 0;

  ball.vy = 0;

  matchPenalty = null;

  if (scored) {

    goalScored(mp.team);

  } else {

    // Saved or off target: the keeper smothers the ball and the match
    // simply carries on from where play stopped.
    const gk = mp.keeper;

    if (gk) {

      ball.x = gk.x;

      ball.y = Math.max(goalTop + 20, Math.min(goalBottom - 20, gk.y));

      ball.z = 0;

      setBallToucher(gk);

      ballCarrier = gk;

      gk.holdsBall = true;

      gk.holdFrames = 0;

      gk.indicatorText = "SAVE!";

      gk.indicatorFrames = 60;

    }

  }

}

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

function stepFreekick() {

  const fk = freekick;

  if (!fk) return;

  // Already struck? The user releases their shot between frames (SPACE
  // keyup), so if the ball is already flying off the taker's boot the
  // restart is over — do not re-pin it back onto the spot.
  if ((ball.vx !== 0 || ball.vy !== 0) && ball.lastToucher === fk.taker) {

    endFreekick();

    return;

  }

  // The restart stays nailed to the spot until the taker hits the ball.
  ball.x = fk.x;

  ball.y = fk.y;

  ball.vx = 0;

  ball.vy = 0;

  ball.passTarget = null;

  ballCarrier = null;

  fk.frames++;

  // Everyone except the taker backs off DOWN the field right from the
  // whistle: they clear away from the restarted spot and gather on a
  // spread line a free-kick-clear distance ahead of the ball, each locked
  // to the pitch quarter they started in. Goalkeepers hold their goal,
  // the referee stays out of it, and sent-off players are already on the
  // bench. It runs every frame so the field is fully cleared BEFORE the
  // kick is taken, even while the countdown is still ticking.
  const downDir = fk.team === "blue" ? 1 : -1;

  // A corner is not a free kick: instead of everyone backing down the field,
  // the attacking side packs the box and the defending side picks them up, so
  // the cross has real targets to be aimed at.
  const isCorner = fk.kind === "corner";

  const boxX = fk.team === "blue" ? field.x + field.width - 250 : field.x + 250;

  let boxSlot = 0;

  for (const p of allPlayers) {

    if (p.sentOff) continue;

    if (p === fk.taker) continue;

    if (p.role === "goalkeeper") continue;

    if (p.role === "referee") continue;

    const lane = getVerticalLane(p);

    if (isCorner) {

      const mine = p.team === fk.team;

      // Attackers spread across the six-yard box; defenders sit goal-side of
      // the attacker they are covering. Corners deliberately break formation
      // lanes, so only the touchline margin still applies.
      const spreadY = Math.max(field.y + 70, Math.min(field.y + field.height - 70,
        H / 2 + ((boxSlot % 3) - 1) * 95));

      boxSlot++;

      const tx = boxX + (mine ? 0 : downDir * 45);

      // Crosses are on a short fuse, so the box is filled at a jog rather than
      // a walk: at the normal pace the side would still be jogging up the pitch
      // when the ball is delivered.
      moveToward(p, tx, spreadY, p.speed * 3.2);

      keepInsideField(p);

      continue;

    }

    const tx = fk.x + downDir * FREEKICK_CLEAR_DIST;

    const ty = clampToLane(lane, p.startY + (ball.y - H / 2) * 0.2);

    moveToward(p, tx, ty, p.speed * 1.3);

    keepInsideField(p);

  }

  // A KICKOFF-style countdown: the kick stays locked (same wall-clock
  // "3...2...1" as before the start of a new play) while everyone else
  // is already heading down the field.
  const secs = Math.max(1, Math.ceil((fk.wait - fk.frames) / 60));
  if (countdownSeconds !== secs) { 
    countdownSeconds = secs; 
  }
  if (fk.taker.human) {
    // The user takes their team's free kick: only they move, and they
    // shoot the way they always do (walk up & charge with SPACE). The
    // swing is allowed right away so a press held through the countdown
    // still charges up; the ball only leaves on SPACE release once the
    // wall has cleared below.
    stepSetPieceHuman(fk.taker);

    updateShotCharge();

  }

  if (fk.frames < fk.wait) return;

  // The user's restart is taken by them and only them: no auto-strike. The
  // taker keeps the ball pinned on the spot until they walk up and hit it, so
  // these legs are always played on the kick button.
  if (fk.taker.human) return;

  if (!fk.taker.human) {

    const t = fk.taker;

    t.stumble = 0;

    moveToward(t, fk.x, fk.y, t.speed * 1.35);

    keepInsideField(t);

    if (distance(t, ball) < 100) {

      t.cooldown = 0;

      if (fk.kind === "corner") {

        // Cross into the box instead of shooting at the goal.
        crossCorner(t, cornerAim(t));

      } else {

      // The opponent's free kick is a proper long-range strike: boot it
      // hard toward the goal with scatter scaled to how far out it is.
      const goalX = t.team === "red" ? field.x : field.x + field.width;

      const fkRange = Math.hypot(goalX - ball.x, H / 2 - ball.y);

      aiKick(t, Math.max(600, fkRange));

      }

      endFreekick();

    }

  }

  // Last-resort backstop: no restart may ever hold the match hostage. An AI
  // taker that gets blocked (wedged behind a wall, jogging away from the spot)
  // just orbits the ball forever. Well after anyone reasonable would have
  // struck it, the nearest eligible player simply takes it from wherever they
  // happen to be, so the match always restarts. Human takers are excluded: the
  // user's restarts are always on their own button.
  if (!fk.taker.human && fk.frames > fk.wait + 180) {
    let sub = null, bd = Infinity;
    let backup = null, bbd = Infinity;
    const mates = fk.team === "blue" ? teammates : opponents;
    for (const m of mates) {
      if (m.sentOff || m.role === "referee") continue;
      const d = Math.hypot(m.x - fk.x, m.y - fk.y);
      if (m === fk.taker) { if (d < bbd) { bbd = d; backup = m; } continue; }
      if (d < bd) { bd = d; sub = m; }
    }
    const t = sub || backup;
    if (!t) { endFreekick(); return; }
    t.cooldown = 0;
    t.stumble = 0;
    if (fk.kind === "corner") {
      crossCorner(t, cornerAim(t));
    } else {
      const goalX = t.team === "red" ? field.x : field.x + field.width;
      aiKick(t, Math.max(600, Math.hypot(goalX - fk.x, H / 2 - fk.y)));
    }
    endFreekick();
  }

}

 

function gameLoop() {
  pollAlternativeInput();
  updateSetPieceTuner();
  updateDrillHud();

  // --- Arcade presentation --------------------------------------------------
  // Matches are always the pixel arcade top-down view now. Lock the camera to
  // the fixed bird's-eye angle and present the small backing store at a
  // whole-number upscale on whole pixels, so the chunky look stays perfectly
  // crisp. The adaptive-quality monitor is gone - the tiny buffer is already
  // cheap, and a pixel-perfect integer scale is what we want at all times.
  cam2d = true;
  if (typeof pixelCanvasPresent === "function") pixelCanvasPresent();
  applyPixelArtChrome(true);

  // Pre-match kickoff intro: 5-second countdown ticks down before play starts.
  if (kickoffIntro > 0) {
    const gsEl = (typeof document !== "undefined" && document.getElementById) ? document.getElementById("gameScreen") : null;
    const pitchVisible = !gsEl || gsEl.style.display !== "none";
    // The broadcast intro is the pre-match screen while it is up, so the
    // countdown waits for its last shot rather than running it out from under
    // it. endCutscene drops the remainder to a short beat when it finishes.
    const introOnScreen = cutscene && cutsceneKind === "intro" && !cutscene.skipped;
    if (pitchVisible && !introOnScreen) {
      kickoffIntro--;
      if (kickoffIntro <= 0) beginMatch();
    }
  }
  if (matchRunning) {
    netPumpInput();
    netRunFixedSteps();
  }

  // Presentation-only bookkeeping (crowd queue, captions) never feeds the sim.
  updateCommentaryFrame();
 
  stepInvasion();

  if (matchPhase === "penalties" && penaltyShot && !penaltyShot.done) {
    stepPenalty();
  }

 // In a lockstep match these counters decay once per SIMULATION TICK (inside
 // stepMatchSim) so both peers burn them at the identical rate. In solo play
 // they keep the original per-render-frame cadence below.
 if (!netLockstepActive()) {
for (const p of allPlayers) {

    if (p.indicatorFrames > 0) {

      p.indicatorFrames--;

    }

    if (p.kickAnim > 0) {

      p.kickAnim--;

    }

    if (p.tackleAnim > 0) {

      p.tackleAnim--;

    }

    if (p.tackleCooldown > 0) {

      p.tackleCooldown--;

    }

  }

  // The human's post-kick lockout ticks once per frame, NOT once per player.
  if (player.passLockT > 0) {

    player.passLockT--;

  }
 }

  // The card call-out ticks down once per frame, NOT once per player.
  if (cardFlash && cardFlash.frames > 0) {

    cardFlash.frames--;

    if (cardFlash.frames <= 0) cardFlash = null;

  }

 

  updateCamera(); 

  updateCutscenes(1 / 60);

  updateWalkout();

  updateWeatherVisuals();

  drawField(); 

  // Haze, darkening and lightning sit under the players; the falling rain and
  // snow are drawn over them further down.
  drawWeatherBehind();
 
 

  // Paint distance-sorted (far→near) so nearer objects cover farther ones,
  // with the ball in the same layer so you can tell if it's in front of or behind players
  const depthOf = (x, y) => {
    const d = projectPoint(x, y);
    return d ? d.depth : Infinity;
  };
  const items = [];
  for (const p of allPlayers) {

    if (p.sentOff) continue;

    items.push({ obj: p, isBall: false, depth: depthOf(p.x, p.y) });

  }
  items.push({ obj: ball, isBall: true, depth: depthOf(ball.x, ball.y) });

  if (invasion) {

    for (const m of invasion.crowd) {

      items.push({ obj: m, isInvader: true, depth: depthOf(m.x, m.y) });

    }

  }
  // goal nets join the same painter's stack so players inside the box
  // get partially occluded by the frame (seen through the translucent mesh)
  items.push({ obj: field.x, isGoal: true, depth: depthOf(field.x, goalTop) });
  items.push({ obj: field.x + field.width, isGoal: true, depth: depthOf(field.x + field.width, goalTop) });
  items.sort((a, b) => b.depth - a.depth);

  for (const it of items) { 

    if (it.isBall) drawBall(); 

    else if (it.isGoal) drawGoalNet(it.obj); 

    else if (it.isInvader) drawInvader(it.obj); 

    else drawPlayer(it.obj); 

  } 

 

  drawAimCursor(); 

  drawSetPieceTuner(); 

  drawWeatherFront();

  drawWalkoutCards();

  drawCountdown(); 

drawScoreboard();
  drawArcadeHUD();
  
  drawReplayBadge();
  
  drawCardTallies();

drawCommentary();

drawMinimap();

 

drawReplayIndicator(); 

  drawFreekickBanner(); 

  drawCardFlash(); 

  drawSentOffNote();

  drawBreakOverlay(); 

  // Cutscene framing sits on top of everything, bars included.
  drawCutscene();

  tackleBlockedThisFrame = false;

 

requestAnimationFrame(gameLoop); 

} 



/* ------------------------------ 

   Transfer market & squad editor 

----------------------------- */ 



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

/* ------------------------------
   Penalty shootout: a knockout
   tie after extra time goes to
   5 penalty kicks each. Pick your
   spot from 5 corners on every
   one of your kicks; sudden-death
   rounds follow a 5-5 tie.
------------------------------ */
const PENALTY_SIDES = ["TL", "BL", "TR", "BR", "MID"];
let penaltyShootout = null;
let penaltyWinner = null;
// Survives the shootout screen being torn down, so the score can be stored on
// the match and shown afterwards (previously only the winner side was kept).
let penaltyScore = null;
let penaltyDelayMs = 900;

function penaltyRandSide() {
  return PENALTY_SIDES[Math.floor(Math.random() * PENALTY_SIDES.length)];
}
let penaltyShot = null;
let penaltyAnimMs = 900;

function penaltySpotX(isPlayer) {
  return isPlayer ? field.x + field.width - PENALTY_SPOT_IN : field.x + PENALTY_SPOT_IN;
}

function penaltyCorner(isPlayer, side) {
  const goalX = isPlayer ? field.x + field.width : field.x;
  const dir = isPlayer ? 1 : -1;
  const x = goalX - dir * 12;
  if (side === "MID") return { x: x, y: H / 2, z: 42 };
  const nearTop = side === "TL" || side === "BL";
  const y = nearTop ? goalTop + 36 : goalBottom - 36;
  const z = side === "TL" || side === "TR" ? 64 : 14;
  return { x: x, y: y, z: z };
}

function penaltyKeeperDiveSpot(isPlayer, side) {
  const goalX = isPlayer ? field.x + field.width : field.x;
  const dir = isPlayer ? 1 : -1;
  let y = H / 2;
  if (side !== "MID") y = (side === "TL" || side === "BL") ? goalTop + 30 : goalBottom - 30;
  return { x: goalX - dir * 10, y: y };
}

function penaltySetField(isPlayer) {
  const taker = isPlayer ? player : allPlayers.find(function (pp) {
    return pp.team === "red" && pp.role !== "goalkeeper" && !pp.sentOff;
  });
  const spotX = penaltySpotX(isPlayer);
  const dir = isPlayer ? 1 : -1;
  let bi = 0;
  let ri = 0;
  for (const pp of allPlayers) {
    if (pp.sentOff) continue;
    if (pp === taker) {
      pp.x = spotX - dir * 84;
      pp.y = H / 2;
      pp.holdsBall = false;
      continue;
    }
    if (pp.role === "goalkeeper") {
      if (pp.team === "blue") { pp.x = field.x + 44; pp.y = H / 2; }
      else { pp.x = field.x + field.width - 44; pp.y = H / 2; }
      pp.holdsBall = false;
      continue;
    }
    if (pp === referee) { pp.x = PITCH_CX; pp.y = PITCH_CY; continue; }
    if (pp.team === "blue") {
      pp.x = field.x + PENALTY_SPOT_IN + 250 + (bi % 5) * 95;
      pp.y = field.y + 180 + ((bi % 3) + 1) * 170;
      bi++;
    } else if (pp.team === "red") {
      pp.x = field.x + field.width - PENALTY_SPOT_IN - 250 - (ri % 5) * 95;
      pp.y = field.y + 180 + ((ri % 3) + 1) * 170;
      ri++;
    }
  }
  ball.x = spotX;
  ball.y = H / 2;
  ball.vx = 0;
  ball.vy = 0;
  ball.z = 0;
  ball.passTarget = null;
  setBallToucher(null);
  ballCarrier = null;
}

function penaltyLaunchBall(sh) {
  const dx = sh.target.x - ball.x;
  const dy = sh.target.y - ball.y;
  const dist = Math.hypot(dx, dy) || 1;
  const frames = Math.max(4, Math.round(sh.maxFrames * 0.55));
  ball.vx = (dx / dist) * (dist / frames);
  ball.vy = (dy / dist) * (dist / frames);
  ball.z = 4;
  ball.lastToucher = sh.taker;
  setBallToucher(sh.taker);
}

function startPenaltyKick(isPlayer, side, keeperSide, goalFlag, onDone) {
  penaltySetField(isPlayer);
  const sh = {
    isPlayer: isPlayer,
    side: side,
    keeperSide: keeperSide,
    goalFlag: goalFlag,
    dir: isPlayer ? 1 : -1,
    goalX: isPlayer ? field.x + field.width : field.x,
    spot: { x: penaltySpotX(isPlayer), y: H / 2 },
    target: penaltyCorner(isPlayer, side),
    keeperTarget: penaltyKeeperDiveSpot(isPlayer, keeperSide),
    taker: isPlayer ? player : allPlayers.find(function (pp) {
      return pp.team === "red" && pp.role !== "goalkeeper" && !pp.sentOff;
    }),
    keeper: isPlayer
      ? allPlayers.find(function (pp) { return pp.team === "red" && pp.role === "goalkeeper"; })
      : allPlayers.find(function (pp) { return pp.team === "blue" && pp.role === "goalkeeper"; }),
    maxFrames: Math.max(1, Math.round(penaltyAnimMs / 16)),
    frames: 0,
    phase: "runup",
    done: false,
    arc: 34,
    onDone: onDone
  };
  if (sh.maxFrames <= 2) {
    sh.taker.x = sh.spot.x;
    sh.taker.y = sh.spot.y;
    sh.phase = "flight";
    penaltyLaunchBall(sh);
  }
  penaltyShot = sh;
}

function penaltyResolveShot(saved) {
  const sh = penaltyShot;
  if (!sh || sh.done) return;
  sh.done = true;
  if (saved) {
    ball.vx = 0;
    ball.vy = 0;
    ball.z = Math.min(Math.max(6, ball.z || 0), 24);
  } else {
    ball.vx = 0;
    ball.vy = 0;
    ball.z = Math.max(8, (sh.target && sh.target.z) || 8);
  }
  document.getElementById("penaltyResult").textContent = sh.isPlayer
    ? (saved ? "SAVED - the keeper guessed your spot." : "GOAL!")
    : (saved ? "YOUR KEEPER SAVES!" : "OPPONENT SCORES!");
  if (saved && sh.keeper) myClubCreditKeeperStop(sh.keeper, true, true);
  const cb = sh.onDone;
  setTimeout(function () {
    penaltyShot = null;
    if (cb) cb();
  }, penaltyDelayMs);
}

function stepPenalty() {
  const sh = penaltyShot;
  if (!sh || sh.done) return;
  sh.frames++;
  const tk = sh.taker;
  const gk = sh.keeper;
  if (!tk || !gk) return;
  if (sh.phase === "runup") {
    if (Math.abs(tk.x - sh.spot.x) > 26 || Math.abs(tk.y - sh.spot.y) > 26) {
      moveToward(tk, sh.spot.x, sh.spot.y, 16);
    } else {
      sh.phase = "flight";
      penaltyLaunchBall(sh);
    }
    return;
  }
  ball.x += ball.vx;
  ball.y += ball.vy;
  const seg = Math.abs(ball.x - sh.spot.x) / 430;
  const t = Math.min(1, Math.max(0, seg));
  const arc = sh.arc * 4 * t * (1 - t);
  ball.z = arc + sh.target.z * t;
  moveToward(gk, sh.keeperTarget.x, sh.keeperTarget.y, 30);
  gk.y = Math.max(goalTop + gk.radius, Math.min(goalBottom - gk.radius, gk.y));
  gk.x = Math.max(sh.goalX - sh.dir * 80, Math.min(sh.goalX - sh.dir * 4, gk.x));
  const crossed = sh.dir === 1
    ? ball.x > sh.goalX - ball.radius
    : ball.x < sh.goalX + ball.radius;
  const inMouth = ball.y > goalTop && ball.y < goalBottom;
  if (crossed) {
    ball.x = sh.goalX - sh.dir * ball.radius;
  }
  if (sh.goalFlag) {
    if ((crossed && inMouth) || sh.frames > 80) penaltyResolveShot(false);
  } else {
    if (distance(gk, ball) < 44 || sh.frames > 70) penaltyResolveShot(true);
  }
}

function beginPenalties() {
  clearInterval(timerInterval);
  matchRunning = false;
  matchPhase = "penalties";
  penaltyWinner = null;
  penaltyScore = null;
  penaltyShootout = { playerKicks: 0, oppKicks: 0, playerScore: 0, oppScore: 0, winner: null, lastGoal: false };
  freekick = null;
  matchPenalty = null;
  resetPositions();
  penaltyShot = null;
  penaltySetField(true);
  document.getElementById("penaltyScreen").style.display = "block";
  renderPenalties();
  updateTimer();
}

function renderPenalties() {
  const s = penaltyShootout;
  if (!s) return;
  document.getElementById("penaltyPlayerScore").textContent = s.playerScore;
  document.getElementById("penaltyOppScore").textContent = s.oppScore;
  const msg = document.getElementById("penaltyMsg");
  const btns = document.getElementById("penaltyButtons");
  const result = document.getElementById("penaltyResult");
  if (s.winner) {
    msg.textContent = s.winner === "blue" ? "YOU WIN THE SHOOTOUT!" : "OPPONENT WINS THE SHOOTOUT.";
    btns.style.display = "none";
    result.textContent = "";
  } else if (s.playerKicks === s.oppKicks) {
    msg.textContent = "Round " + (s.playerKicks + 1) + " - pick where to shoot:";
    btns.style.display = "flex";
    result.textContent = "";
  } else {
    msg.textContent = "Opponent is shooting...";
    btns.style.display = "none";
  }
}

function penaltyPick(side) {
  const s = penaltyShootout;
  if (!s || s.winner) return;
  if (s.playerKicks !== s.oppKicks) return;
  const keeper = penaltyRandSide();
  const goal = keeper !== side;
  s.playerKicks++;
  if (goal) s.playerScore++;
  s.lastGoal = goal;
  renderPenalties();
  document.getElementById("penaltyButtons").style.display = "none";
  startPenaltyKick(true, side, keeper, goal, function () {
    setTimeout(penaltyOppKick, penaltyDelayMs);
  });
}

function penaltyOppKick() {
  const s = penaltyShootout;
  if (!s || s.winner) return;
  const taker = penaltyRandSide();
  const keeper = penaltyRandSide();
  const goal = taker !== keeper;
  s.oppKicks++;
  if (goal) s.oppScore++;
  s.lastGoal = goal;
  renderPenalties();
  startPenaltyKick(false, taker, keeper, goal, function () {
    setTimeout(penaltyAfterRound, penaltyDelayMs);
  });
}

function penaltyDecided() {
  const s = penaltyShootout;
  if (!s || s.playerKicks !== s.oppKicks) return false;
  const kicked = s.playerKicks;
  if (kicked < 5) return Math.abs(s.playerScore - s.oppScore) > (5 - kicked);
  return s.playerScore !== s.oppScore;
}

function penaltyAfterRound() {
  const s = penaltyShootout;
  if (!s || s.winner) return;
  if (penaltyDecided()) {
    s.winner = s.playerScore > s.oppScore ? "blue" : "red";
    penaltyWinner = s.winner;
    penaltyScore = { blue: s.playerScore, red: s.oppScore };
    renderPenalties();
    setTimeout(() => {
      penaltyShootout = null;
      penaltyShot = null;
      document.getElementById("penaltyScreen").style.display = "none";
      endMatch();
    }, penaltyDelayMs + 350);
    return;
  }
  renderPenalties();
}

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

    { name: "MAX Eusébio", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

  ],

  Brazil: [ 

    { name: "MAX Pelé", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Ronaldo Nazário", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Garrincha", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Zico", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

    { name: "MAX Romário", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } },

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

    { name: "MAX Alfredo Di Stéfano", role: "attacker", stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 } }

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
