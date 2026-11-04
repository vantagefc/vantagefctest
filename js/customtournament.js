/* ============================================================================
   CUSTOM TOURNAMENT MODE
   ----------------------------------------------------------------------------
   A fully user-configured competition that sits alongside Champions League,
   My Club and World Cup. The player chooses the team pool (clubs, nations or
   both), how many teams, which teams, your own team, and the format:

     - Round-robin league      (single or home & away; champion = 1st place)
     - Groups + Knockout       (groups of 3-6; top 1-3 per group advance)
     - Straight Knockout       (single elimination, byes fill to a power of 2)

   Like the World Cup module it reuses the shared match engine by registering a
   match context and routing match completion through ctEndMatch() from
   engine.js when currentMode === "custom". Group/league games can be drawn;
   every knockout tie is a single leg with extra time and penalties.
   ============================================================================ */

/* ------------------------------------------------------------ team pools -- */

function ctNationPool() {
  if (typeof WC_NATIONS !== "undefined" && Array.isArray(WC_NATIONS)) return WC_NATIONS.map(n => n.name);
  return [];
}

/* Every club the game knows about, listed by country (league) then
   alphabetical. Champions League clubs outside the leagues follow last. */
function ctClubPool() {
  const out = [], seen = {};
  const push = (name) => { if (name && !seen[name]) { seen[name] = 1; out.push(name); } };
  if (typeof MYCLUB_LEAGUES !== "undefined" && Array.isArray(MYCLUB_LEAGUES)) {
    for (const lg of MYCLUB_LEAGUES) {
      const list = (lg.clubs || []).slice().sort((a, b) => String(a).localeCompare(String(b)));
      for (const c of list) push(c);
    }
  }
  if (Array.isArray(teams)) {
    const extra = teams.filter(t => t && !seen[t]).slice().sort((a, b) => String(a).localeCompare(String(b)));
    for (const t of extra) push(t);
  }
  return out;
}

function ctPoolFor(kind) {
  if (kind === "nations") return ctNationPool();
  if (kind === "all") {
    const out = ctClubPool();
    for (const n of ctNationPool()) if (out.indexOf(n) === -1) out.push(n);
    return out;
  }
  return ctClubPool();
}

/* A short badge for a team: the nation code where we have one, else initials. */
function ctTeamCode(team) {
  if (typeof WC_NATION_BY_NAME !== "undefined" && WC_NATION_BY_NAME[team]) return WC_NATION_BY_NAME[team].code;
  const parts = String(team).split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0] + (parts[2] ? parts[2][0] : "")).toUpperCase();
}

function ctEsc(s) { return (typeof escapeHtml === "function") ? escapeHtml(String(s)) : String(s); }

function ctNextPow2(n) { let p = 2; while (p < n) p *= 2; return p; }

function ctRoundName(teamsInRound) {
  if (teamsInRound <= 2) return "Final";
  if (teamsInRound === 4) return "Semi-finals";
  if (teamsInRound === 8) return "Quarter-finals";
  return "Round of " + teamsInRound;
}

function ctGroupLetter(i) { return i < 26 ? String.fromCharCode(65 + i) : "G" + (i + 1); }

/* ---------------------------------------------------------------- state --- */

const CT_STORAGE_KEY = "customTournament_v1";

let ctState = null;     // the built tournament
let ctContext = null;   // live match context ({ opponent }), read by engine.js
let ctMidMatch = false; // hub opened while a live match is in progress

/* Several tournaments can be saved at once. The store is now
   { v:2, tournaments:[...], active:0 }; older builds wrote a single tournament
   object straight to this key, so ctLoadAll() wraps that into the new shape and
   nobody loses an in-progress cup. */
function ctLoadAll() {
  try {
    const raw = localStorage.getItem(CT_STORAGE_KEY);
    if (!raw) return { v: 2, tournaments: [], active: 0 };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.tournaments)) {
      parsed.v = 2;
      parsed.tournaments = parsed.tournaments.map(ctNormalize);
      return parsed;
    }
    if (parsed && parsed.selectedTeam && Array.isArray(parsed.teams)) {
      return { v: 2, tournaments: [ctNormalize(parsed)], active: 0 };
    }
    return { v: 2, tournaments: [], active: 0 };
  } catch (e) { return { v: 2, tournaments: [], active: 0 }; }
}
function ctSaveAll(data) { try { localStorage.setItem(CT_STORAGE_KEY, JSON.stringify(data)); } catch (e) {} }
function ctSave() {
  if (!ctState) return;
  ctState.updatedAt = Date.now();
  const all = ctLoadAll();
  const i = all.tournaments.findIndex(t => t.id === ctState.id);
  if (i >= 0) all.tournaments[i] = ctState; else all.tournaments.unshift(ctState);
  all.active = 0;
  ctSaveAll(all);
}
function ctDeleteTournament(id) {
  const all = ctLoadAll();
  all.tournaments = all.tournaments.filter(t => t.id !== id);
  ctSaveAll(all);
}
function ctNormalize(t) {
  if (!t || typeof t !== "object") return t;
  t.id = t.id || ("ct" + Date.now() + Math.floor(Math.random() * 1e6));
  t.updatedAt = t.updatedAt || t.createdAt || Date.now();
  if (t.format === undefined) t.format = "knockout";
  if (!Array.isArray(t.groups)) t.groups = [];
  if (!Array.isArray(t.knockout)) t.knockout = [];
  return t;
}
function ctStatusLine(t) {
  if (t.champion) return t.champion === t.selectedTeam ? "Champions" : "Won by " + t.champion;
  if (t.eliminated) return "Eliminated";
  return "In progress";
}
function ctFormatLabel(f) {
  if (f === "league") return "Round-robin";
  if (f === "groups") return "Groups + Knockout";
  return "Knockout";
}
function ctTwo(name) { return sgInitials(name); }

/* --------------------------------------------------------------- entry ----- */

function startModeCustom() {
  currentMode = "custom";
  if (typeof TeamEdits !== "undefined" && TeamEdits.exitCareer) TeamEdits.exitCareer();
  document.getElementById("modeSelectScreen").style.display = "none";
  const wcScreen = document.getElementById("worldCupScreen");
  if (wcScreen) wcScreen.style.display = "none";
  const all = ctLoadAll();
  if (all.tournaments.length) ctShowPicker();
  else { ctConfig = null; ctShowSetup(); }
}

/* --------------------------------------------------------- saved games ----- */

function ctShowPicker() {
  const body = document.getElementById("ctBody");
  if (!body) return;
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("customTournamentScreen").style.display = "block";
  const title = document.getElementById("ctTitle");
  if (title) title.textContent = "Custom Tournament";
  const sub = document.getElementById("ctSubtitle");
  if (sub) sub.textContent = "Pick up a saved competition, or start a new one.";
  const items = ctLoadAll().tournaments.map(t => ({
    badge: ctTwo(t.selectedTeam),
    name: t.name || "Custom Tournament",
    meta: `${ctFormatLabel(t.format)} \u00b7 ${t.selectedTeam || "?"} \u00b7 ${ctStatusLine(t)}` + (t.updatedAt ? ` \u00b7 ${sgWhen(t.updatedAt)}` : ""),
    resume: `ctResumeTournament('${t.id}')`,
    del: `ctDeleteTournamentAsk('${t.id}')`
  }));
  body.innerHTML = sgPickerHTML({
    items: items,
    emptyText: "No saved tournaments yet.",
    newLabel: "New Tournament",
    newAction: "ctNewTournament()",
    backAction: "ctQuitToMenu()"
  });
  if (typeof enterScreen === "function") enterScreen("customTournamentScreen", "block");
}

function ctResumeTournament(id) {
  const all = ctLoadAll();
  const i = all.tournaments.findIndex(t => t.id === id);
  if (i < 0) { ctShowPicker(); return; }
  const t = all.tournaments.splice(i, 1)[0];
  all.tournaments.unshift(t);
  all.active = 0;
  ctSaveAll(all);
  ctState = t;
  selectedTeam = ctState.selectedTeam;
  ctShowHub();
}

function ctDeleteTournamentAsk(id) {
  const all = ctLoadAll();
  const t = all.tournaments.find(x => x.id === id);
  if (!t) return;
  if (!window.confirm('Delete "' + (t.name || "this tournament") + '"? This cannot be undone.')) return;
  ctDeleteTournament(id);
  if (ctState && ctState.id === id) ctState = null;
  ctShowPicker();
}

/* ------------------------------------------------------------- setup UI --- */

let ctConfig = null;
let ctPool = [];

function ctDefaultConfig() {
  return {
    name: "My Tournament",
    pool: "clubs",
    format: "knockout",
    leagueRounds: "single",
    groupSize: 4,
    advance: 2,
    count: 8,
    selected: [],
    yourTeam: null,
    playerName: "YOU",
    search: ""
  };
}

function ctShowSetup() {
  const body = document.getElementById("ctBody");
  if (!body) return;
  if (!ctConfig) { ctConfig = ctDefaultConfig(); ctPool = ctPoolFor(ctConfig.pool); ctResetSelection(); }
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("customTournamentScreen").style.display = "block";
  const title = document.getElementById("ctTitle");
  if (title) title.textContent = "Custom Tournament";
  const sub = document.getElementById("ctSubtitle");
  if (sub) sub.textContent = "Design your own competition, then play it out.";
  ctRenderSetup();
  if (typeof enterScreen === "function") enterScreen("customTournamentScreen", "block");
}

function ctResetSelection() {
  ctPool = ctPoolFor(ctConfig.pool);
  ctConfig.selected = [];
  ctConfig.yourTeam = null;
  ctApplyCount(Math.min(ctConfig.count, ctPool.length));
}

function ctApplyCount(n) {
  const total = ctPool.length;
  n = Math.max(2, Math.min(Number(n) || 2, total));
  ctConfig.count = n;
  const shuffled = shuffle([...ctPool]);
  ctConfig.selected = shuffled.slice(0, n);
  ctConfig.yourTeam = ctConfig.selected[0] || null;
}

/* --- setup rendering ------------------------------------------------------ */

function ctSegBtn(prop, val, label) {
  const on = ctConfig[prop] === val ? " on" : "";
  return `<button class="ctSegBtn${on}" onclick="ctSetOpt('${prop}','${val}')">${label}</button>`;
}

function ctRenderSetup() {
  const body = document.getElementById("ctBody");
  if (!body) return;
  ctPool = ctPoolFor(ctConfig.pool);
  body.innerHTML = `
    <div class="wcSetup">
      <div class="wcSetupName">
        <label for="ctNameInput">TOURNAMENT NAME</label>
        <input id="ctNameInput" type="text" maxlength="28" placeholder="Enter a name..." value="${ctEsc(ctConfig.name)}" oninput="ctConfig.name=this.value">
      </div>
      <div class="wcSetupName">
        <label for="ctPlayerInput">YOUR NAME</label>
        <input id="ctPlayerInput" type="text" maxlength="16" placeholder="Enter your name..." value="${ctEsc(ctConfig.playerName)}" oninput="ctConfig.playerName=this.value">
      </div>
      <div class="ctOptRow">
        <span class="ctOptLabel">Format</span>
        <div class="ctSeg">
          ${ctSegBtn("format", "league", "Round-robin")}
          ${ctSegBtn("format", "groups", "Groups + Knockout")}
          ${ctSegBtn("format", "knockout", "Knockout")}
        </div>
      </div>
      <div class="ctOptRow">
        <span class="ctOptLabel">Team pool</span>
        <div class="ctSeg">
          ${ctSegBtn("pool", "clubs", "Clubs")}
          ${ctSegBtn("pool", "nations", "Nations")}
          ${ctSegBtn("pool", "all", "Both")}
        </div>
      </div>
      ${ctFormatOptions()}
      <div class="ctOptRow">
        <span class="ctOptLabel">Teams</span>
        <input id="ctCountInput" class="ctNumInput" type="number" min="2" max="${ctPool.length}" value="${ctConfig.selected.length}" onchange="ctSetCount(this.value)">
        <button class="wcGhostBtn" onclick="ctRandomize()">Randomize</button>
        <button class="wcGhostBtn" onclick="ctClearTeams()">Clear</button>
        <span class="ctCount" id="ctCount">${ctConfig.selected.length} selected</span>
      </div>
      <div class="wcSetupName ctSearch">
        <label for="ctSearchInput">SEARCH TEAMS</label>
        <input id="ctSearchInput" type="text" placeholder="Filter by name..." value="${ctEsc(ctConfig.search)}" oninput="ctFilterTeams(this.value)">
      </div>
      <div class="wcNationGrid ctTeamGrid" id="ctTeamGrid">${ctTeamGridHTML()}</div>
      <div id="ctTeamMeta">${ctMetaHTML()}</div>
      <div class="wcSetupMsg" id="ctSetupMsg"></div>
      <div class="wcSetupActions">
        <button class="wcPrimaryBtn" onclick="ctBeginFromSetup()">Start Tournament</button>
        <button class="wcGhostBtn" onclick="ctQuitToMenu()">Back</button>
      </div>
    </div>`;
}

function ctFormatOptions() {
  if (ctConfig.format === "league") {
    return `<div class="ctOptRow">
      <span class="ctOptLabel">Rounds</span>
      <div class="ctSeg">
        ${ctSegBtn("leagueRounds", "single", "Single")}
        ${ctSegBtn("leagueRounds", "double", "Home &amp; Away")}
      </div>
    </div>`;
  }
  if (ctConfig.format === "groups") {
    return `<div class="ctOptRow">
      <span class="ctOptLabel">Group size</span>
      <div class="ctSeg">
        ${ctSegBtn("groupSize", 3, "3 teams")}
        ${ctSegBtn("groupSize", 4, "4 teams")}
        ${ctSegBtn("groupSize", 5, "5 teams")}
        ${ctSegBtn("groupSize", 6, "6 teams")}
      </div>
      <div class="ctSeg">
        <span class="ctOptLabel">Advance</span>
        ${ctSegBtn("advance", 1, "Top 1")}
        ${ctSegBtn("advance", 2, "Top 2")}
        ${ctSegBtn("advance", 3, "Top 3")}
      </div>
    </div>`;
  }
  return "";
}

function ctTeamCodeColor(team) {
  if (typeof WC_NATION_BY_NAME !== "undefined" && WC_NATION_BY_NAME[team] && WC_NATION_BY_NAME[team].color) return WC_NATION_BY_NAME[team].color;
  if (typeof teamColors !== "undefined" && teamColors && teamColors[team]) return teamColors[team];
  return "";
}

function ctTeamGridHTML() {
  const q = (ctConfig.search || "").trim().toLowerCase();
  const list = ctPool.filter(t => !q || t.toLowerCase().includes(q));
  if (!list.length) return `<div class="ctEmpty">No teams match.</div>`;
  return list.map(t => {
    const on = ctConfig.selected.indexOf(t) >= 0;
    const col = ctTeamCodeColor(t);
    return `<button class="f16ClubTile${on ? " sel" : ""}" onclick="ctToggleTeam(${ctPool.indexOf(t)})">` +
      `<span class="f16Crest"${col ? ` style="background:${ctEsc(col)}"` : ""}>${ctEsc(ctTeamCode(t))}</span>` +
      `<span class="f16ClubName">${ctEsc(t)}</span>` +
      `</button>`;
  }).join("");
}

function ctMetaHTML() {
  const opts = ctConfig.selected.map((t, i) =>
    `<option value="${i}"${t === ctConfig.yourTeam ? " selected" : ""}>${ctEsc(t)}</option>`).join("");
  return `<div class="ctOptRow">
    <span class="ctOptLabel">Your team</span>
    <select class="ctSelect" onchange="ctSetYourTeam(this.value)">${opts || '<option value="">(no teams selected)</option>'}</select>
    <span class="ctCount">${ctConfig.selected.length} of ${ctPool.length} teams</span>
  </div>`;
}

function ctRenderTeamGrid() {
  const el = document.getElementById("ctTeamGrid");
  if (el) el.innerHTML = ctTeamGridHTML();
}
function ctRenderMeta() {
  const el = document.getElementById("ctTeamMeta");
  if (el) el.innerHTML = ctMetaHTML();
  const c = document.getElementById("ctCount");
  if (c) c.textContent = ctConfig.selected.length + " selected";
  const ci = document.getElementById("ctCountInput");
  if (ci) ci.value = ctConfig.selected.length;
}

/* --- setup interactions --------------------------------------------------- */

function ctSetOpt(prop, val) {
  if (prop === "pool") { ctConfig.pool = val; ctResetSelection(); }
  else ctConfig[prop] = val;
  ctRenderSetup();
}

function ctSetCount(v) { ctApplyCount(v); ctRenderSetup(); }

function ctRandomize() { ctApplyCount(ctConfig.count); ctRenderSetup(); }

function ctClearTeams() {
  ctConfig.selected = [];
  ctConfig.yourTeam = null;
  ctConfig.count = 0;
  ctRenderSetup();
  ctRenderMeta();
}

function ctFilterTeams(v) { ctConfig.search = v; ctRenderTeamGrid(); }

function ctToggleTeam(idx) {
  const t = ctPool[idx];
  if (!t) return;
  const i = ctConfig.selected.indexOf(t);
  if (i >= 0) {
    ctConfig.selected.splice(i, 1);
    if (ctConfig.yourTeam === t) ctConfig.yourTeam = ctConfig.selected[0] || null;
  } else {
    ctConfig.selected.push(t);
    if (!ctConfig.yourTeam) ctConfig.yourTeam = t;
  }
  ctConfig.count = ctConfig.selected.length;
  ctRenderTeamGrid();
  ctRenderMeta();
}

function ctSetYourTeam(i) {
  const t = ctConfig.selected[Number(i)];
  if (t) ctConfig.yourTeam = t;
}

function ctValidate() {
  if (!ctConfig.name || !ctConfig.name.trim()) return "Give your tournament a name.";
  if (ctConfig.selected.length < 2) return "Select at least 2 teams.";
  if (!ctConfig.yourTeam || ctConfig.selected.indexOf(ctConfig.yourTeam) < 0) return "Pick your team.";
  if (ctConfig.format === "groups") {
    const n = ctConfig.selected.length;
    const gs = ctConfig.groupSize;
    if (n % gs !== 0) return `Groups of ${gs} need a team count that is a multiple of ${gs} (you have ${n}).`;
    const groups = n / gs;
    if (groups < 2) return "You need at least 2 groups.";
    if (ctConfig.advance >= gs) return "Teams advancing must be fewer than the group size.";
    if (groups * ctConfig.advance < 2) return "The knockout phase needs at least 2 qualifiers.";
  }
  return null;
}

function ctBeginFromSetup() {
  const msg = ctValidate();
  const el = document.getElementById("ctSetupMsg");
  if (msg) { if (el) el.textContent = msg; return; }
  if (el) el.textContent = "";
  ctStartTournament();
}

/* --------------------------------------------------------- tournament ----- */

function ctStartTournament() {
  ctState = {
    v: 2,
    id: "ct" + Date.now() + Math.floor(Math.random() * 1e6),
    name: (ctConfig.name || "Custom Tournament").trim(),
    format: ctConfig.format,
    leagueRounds: ctConfig.leagueRounds,
    groupSize: ctConfig.groupSize,
    advance: ctConfig.advance,
    selectedTeam: ctConfig.yourTeam,
    playerName: (ctConfig.playerName || "YOU").trim() || "YOU",
    teams: ctConfig.selected.slice(),
    groups: [],
    knockout: [],
    stage: "league",
    champion: null,
    eliminated: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  if (ctState.format === "league") ctBuildLeague();
  else if (ctState.format === "groups") ctBuildGroups();
  else ctBuildKnockoutOnly();
  selectedTeam = ctState.selectedTeam;
  ctSave();
  ctShowHub();
}

/* Standard circle-method round-robin. A bye is used for an odd field. When
   doubleRound is set, the reverse fixtures are appended as a second half of
   the schedule so no one plays twice in a single matchday. */
function ctRoundRobin(teamList, doubleRound) {
  const odd = teamList.length % 2 === 1;
  const arr = odd ? [...teamList, null] : [...teamList];
  const n = arr.length;
  const rot = arr.slice();
  const roundsCount = n - 1;
  const single = [];
  for (let r = 0; r < roundsCount; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = rot[i], b = rot[n - 1 - i];
      if (a && b) { const m = createMatch(a, b); m.round = r + 1; single.push(m); }
    }
    const last = rot.pop();
    rot.splice(1, 0, last);
  }
  if (!doubleRound) return single;
  const all = single.slice();
  for (const m of single) {
    const rev = createMatch(m.team2, m.team1);
    rev.round = (m.round || 1) + roundsCount;
    all.push(rev);
  }
  return all;
}

function ctBuildLeague() {
  const list = shuffle([...ctState.teams]);
  const matches = ctRoundRobin(list, ctState.leagueRounds === "double");
  ctState.groups = [{ name: "League", teams: list, matches }];
  ctState.stage = "league";
}

function ctBuildGroups() {
  const list = shuffle([...ctState.teams]);
  const gs = ctState.groupSize;
  const groups = [];
  const groupCount = Math.floor(list.length / gs);
  for (let g = 0; g < groupCount; g++) {
    const slice = list.slice(g * gs, g * gs + gs);
    groups.push({ name: ctGroupLetter(g), teams: slice, matches: ctRoundRobin(slice, false) });
  }
  ctState.groups = groups;
  ctState.stage = "groups";
}

function ctBuildKnockoutOnly() {
  ctBuildBracket(shuffle([...ctState.teams]));
  ctState.stage = "knockout";
}

/* -------------------------------------------------------- the bracket ----- */

function ctMakeTie(a, b) {
  return { team1: a || null, team2: b || null, score1: null, score2: null, winner: null,
    played: false, pens1: null, pens2: null, decidedBy: null, bye: false };
}

/* Standard single-elimination seat order for a power-of-two bracket. Seat j
   receives seed order[j]; seeds 1 and 2 are placed in opposite halves so the
   top seeds only meet in the final, and any missing seeds become first-round
   byes for the strongest teams. */
function ctSeedOrder(n) {
  let order = [1];
  while (order.length < n) {
    const size = order.length * 2;
    const next = [];
    for (const x of order) { next.push(x); next.push(size + 1 - x); }
    order = next;
  }
  return order;
}

function ctBuildBracket(seedTeams) {
  const size = ctNextPow2(Math.max(2, seedTeams.length));
  const defs = [];
  let ties = size / 2;
  while (ties >= 1) { defs.push({ key: "r" + ties, title: ctRoundName(ties * 2), ties }); ties = ties / 2; }
  const rounds = defs.map(def => ({ key: def.key, title: def.title, ties: [] }));
  const seats = ctSeedOrder(size).map(seed => seedTeams[seed - 1] || null);
  for (let i = 0; i < defs[0].ties; i++) rounds[0].ties.push(ctMakeTie(seats[i * 2], seats[i * 2 + 1]));
  for (let r = 1; r < rounds.length; r++) for (let i = 0; i < defs[r].ties; i++) rounds[r].ties.push(ctMakeTie(null, null));
  ctState.knockout = rounds;
  ctSyncBracket();
}

function ctRoundByKey(key) { return (ctState.knockout || []).find(r => r.key === key) || null; }
function ctLastRound() { const k = ctState.knockout || []; return k[k.length - 1] || null; }

/* Resolve first-round byes and push every decided winner into the next round.
   Safe to call repeatedly: a slot always takes the winner of its feeder. */
function ctSyncBracket() {
  const rounds = ctState.knockout || [];
  if (!rounds.length) return;
  for (const t of rounds[0].ties) {
    if (t.played) continue;
    if (t.team1 && !t.team2) { t.played = true; t.winner = t.team1; t.bye = true; }
    else if (!t.team1 && t.team2) { t.played = true; t.winner = t.team2; t.bye = true; }
  }
  for (let r = 0; r < rounds.length - 1; r++) {
    const cur = rounds[r], next = rounds[r + 1];
    for (let j = 0; j < next.ties.length; j++) {
      const a = cur.ties[j * 2], b = cur.ties[j * 2 + 1];
      if (a && a.played && a.winner) next.ties[j].team1 = a.winner;
      if (b && b.played && b.winner) next.ties[j].team2 = b.winner;
    }
  }
}

function ctSimTie(tie) {
  const m = { team1: tie.team1, team2: tie.team2, score1: null, score2: null, winner: null, played: false };
  simulateMatch(m);
  tie.score1 = m.score1; tie.score2 = m.score2; tie.winner = m.winner; tie.played = true;
}

/* Simulate every ready tie that does not involve the user, advancing the
   bracket as far as it can. Crowns the champion if the final is done. */
function ctSimRemainingKnockout() {
  const rounds = ctState.knockout || [];
  if (!rounds.length) return;
  let progressed = true, guard = 0;
  while (progressed && guard++ < 40) {
    progressed = false;
    ctSyncBracket();
    for (const round of rounds) {
      for (const tie of round.ties) {
        if (tie.played) continue;
        if (!tie.team1 || !tie.team2) continue;
        if (tie.team1 === ctState.selectedTeam || tie.team2 === ctState.selectedTeam) continue;
        ctSimTie(tie);
        progressed = true;
      }
    }
  }
  ctSyncBracket();
  const fin = ctLastRound();
  if (fin && fin.ties[0] && fin.ties[0].played) { ctState.champion = fin.ties[0].winner; ctState.stage = "complete"; }
}

/* Seed the knockout phase from completed group tables: all first-placed teams
   (best record first), then all second-placed, and so on. */
function ctBuildKnockoutFromGroups() {
  const adv = ctState.advance;
  const placing = [];
  for (let p = 0; p < adv; p++) placing.push([]);
  for (const g of ctState.groups) {
    const st = ctGroupStandings(g);
    for (let p = 0; p < adv; p++) if (st[p]) placing[p].push({ team: st[p].team, points: st[p].points, gd: st[p].gd, gf: st[p].gf });
  }
  const byRecord = (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf;
  const seeds = [];
  for (let p = 0; p < adv; p++) { placing[p].sort(byRecord); for (const r of placing[p]) seeds.push(r.team); }
  ctBuildBracket(seeds);
  ctState.stage = "knockout";
}

/* ------------------------------------------------------ group standings --- */

function ctGroupStandings(group) { return computeGroupStandings(group); }
function ctGroupOf(team) { return (ctState.groups || []).find(g => g.teams.includes(team)) || null; }
function ctAllGroupsDone() {
  return (ctState.groups || []).length > 0 && ctState.groups.every(g => g.matches.every(m => m.played));
}

/* --------------------------------------------------------- match lookup --- */

function ctCurrentMatch() {
  if (!ctState) return null;
  if (ctState.eliminated || ctState.champion) return null;
  const me = ctState.selectedTeam;

  if (ctState.stage === "league") {
    const g = ctState.groups[0];
    if (!g) return null;
    let best = null;
    for (const m of g.matches) {
      if (m.played) continue;
      if (m.team1 !== me && m.team2 !== me) continue;
      if (!best || (m.round || 1) < (best.round || 1)) best = m;
    }
    if (!best) return null;
    return { kind: "group", match: best, opponent: best.team1 === me ? best.team2 : best.team1, round: best.round || 1 };
  }

  if (ctState.stage === "groups") {
    const g = ctGroupOf(me);
    if (!g) return null;
    let best = null;
    for (const m of g.matches) {
      if (m.played) continue;
      if (m.team1 !== me && m.team2 !== me) continue;
      if (!best || (m.round || 1) < (best.round || 1)) best = m;
    }
    if (!best) return null;
    return { kind: "group", match: best, opponent: best.team1 === me ? best.team2 : best.team1, round: best.round || 1 };
  }

  if (ctState.stage === "knockout") {
    for (const round of ctState.knockout) {
      const tie = round.ties.find(t => !t.played && t.team1 && t.team2 && (t.team1 === me || t.team2 === me));
      if (tie) return { kind: "ko", match: tie, opponent: tie.team1 === me ? tie.team2 : tie.team1, roundKey: round.key, roundTitle: round.title };
    }
  }
  return null;
}

function ctIsGroupMatch() {
  const cur = ctCurrentMatch();
  return !!(cur && cur.kind === "group");
}

/* ---------------------------------------------------------- match flow ---- */

function ctPlayNext() {
  const cur = ctCurrentMatch();
  if (!cur) { ctShowHub(); return; }
  if (typeof matchRunning !== "undefined" && (matchRunning || awaitingStart)) return;
  selectedTeam = ctState.selectedTeam;
  playerName = ctState.playerName || "YOU";
  ctContext = { opponent: cur.opponent };
  document.getElementById("customTournamentScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function ctResumeMatch() {
  ctMidMatch = false;
  document.getElementById("customTournamentScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  matchRunning = true;
  startTimer();
}

function ctSimNext() {
  const cur = ctCurrentMatch();
  if (!cur) { ctShowHub(); return; }
  if (cur.kind === "group") {
    simulateGroupMatch(cur.match);
    ctSimRestOfRound(cur.round);
  } else {
    ctSimTie(cur.match);
    ctSyncBracket();
    ctAfterUserKo();
  }
  ctSave();
  ctShowHub();
}

function ctSimRestOfRound(round) {
  for (const g of ctState.groups) {
    for (const m of g.matches) {
      if (m.played) continue;
      if ((m.round || 1) !== round) continue;
      if (m.team1 === ctState.selectedTeam || m.team2 === ctState.selectedTeam) continue;
      simulateGroupMatch(m);
    }
  }
}

/* Called from engine.js when a live custom match reaches full time. */
function ctEndMatch() {
  const cur = ctCurrentMatch();
  ctContext = null;
  if (!cur) { ctShowHub(); return; }
  const m = cur.match, opp = cur.opponent, me = ctState.selectedTeam;

  if (cur.kind === "group") {
    if (m.team1 === me) { m.score1 = blueScore; m.score2 = redScore; } else { m.score1 = redScore; m.score2 = blueScore; }
    m.played = true;
    ctSimRestOfRound(cur.round);
    ctSave();
    const scoreLine = `${me} ${blueScore} \u2014 ${redScore} ${opp}`;
    let resultText;
    if (blueScore > redScore) resultText = `${me} beat ${opp} ${blueScore}-${redScore}.`;
    else if (blueScore < redScore) resultText = `${me} lost to ${opp} ${redScore}-${blueScore}.`;
    else resultText = `${me} drew ${blueScore}-${blueScore} with ${opp}.`;
    showEndScreen(resultText, scoreLine, () => ctShowHub(), { blue: me, red: opp });
    return;
  }

  // Knockout, one leg.
  let winner;
  if (blueScore !== redScore) winner = blueScore > redScore ? me : opp;
  else winner = (penaltyWinner === "blue") ? me : opp;
  if (m.team1 === me) { m.score1 = blueScore; m.score2 = redScore; } else { m.score1 = redScore; m.score2 = blueScore; }
  if (typeof penaltyScore !== "undefined" && penaltyScore && blueScore === redScore) {
    if (m.team1 === me) { m.pens1 = penaltyScore.blue; m.pens2 = penaltyScore.red; }
    else { m.pens1 = penaltyScore.red; m.pens2 = penaltyScore.blue; }
    m.decidedBy = "penalties";
  }
  m.winner = winner;
  m.played = true;
  ctSyncBracket();
  ctSave();

  const pensTxt = m.decidedBy === "penalties" ? ` (${m.pens1}-${m.pens2} on penalties)` : "";
  const scoreLine = `${me} ${blueScore} \u2014 ${redScore} ${opp}${pensTxt}`;
  const finalRound = ctLastRound();

  if (finalRound && cur.roundKey === finalRound.key) {
    ctState.champion = winner;
    ctState.stage = "complete";
    ctSave();
    showEndScreen(
      winner === me ? `CHAMPIONS! ${me} won ${ctState.name}!` : `${me} lost the final to ${opp}. ${winner} are champions.`,
      scoreLine, () => ctShowHub(), { blue: me, red: opp }, winner === me ? (ctState.trophy || ctState.name) : null);
    return;
  }

  if (winner !== me) {
    ctState.eliminated = true;
    ctSimRemainingKnockout();
    ctSave();
    const champ = ctState.champion;
    showEndScreen(
      `${me} were knocked out in the ${cur.roundTitle} by ${opp}.${pensTxt} ` +
        (champ ? `${champ} went on to win it.` : "The tournament continues without you."),
      scoreLine, () => ctShowHub(), { blue: me, red: opp });
    return;
  }

  ctSimRemainingKnockout();
  ctSave();
  showEndScreen(`${me} advanced past ${opp} in the ${cur.roundTitle}!`, scoreLine, () => ctShowHub(), { blue: me, red: opp });
}

function ctAfterUserKo() {
  ctSimRemainingKnockout();
  const me = ctState.selectedTeam;
  const alive = (ctState.knockout || []).some(r => r.ties.some(t => !t.played && (t.team1 === me || t.team2 === me)));
  if (!alive && ctState.champion !== me) ctState.eliminated = true;
}

/* ---------------------------------------------------------------- hub ----- */

function ctShowHub() {
  if (!ctState) { ctConfig = null; ctShowSetup(); return; }
  const body = document.getElementById("ctBody");
  if (!body) return;

  // Progress the competition to whatever stage it should be at now.
  if (ctState.stage === "league") {
    if (ctAllGroupsDone()) { ctState.champion = ctGroupStandings(ctState.groups[0])[0].team; ctState.stage = "complete"; ctSave(); }
  } else if (ctState.stage === "groups") {
    if (ctAllGroupsDone()) {
      ctBuildKnockoutFromGroups();
      const me = ctState.selectedTeam;
      const inFirstRound = (ctState.knockout[0] || { ties: [] }).ties.some(t => t.team1 === me || t.team2 === me);
      if (!inFirstRound) ctState.eliminated = true;
      ctSimRemainingKnockout();
      ctSave();
    }
  } else if (ctState.stage === "knockout" && !ctState.champion && !ctState.eliminated) {
    ctSimRemainingKnockout();
  }

  if (typeof matchRunning !== "undefined" && matchRunning) {
    matchRunning = false;
    try { clearInterval(timerInterval); } catch (e) {}
    ctMidMatch = true;
  } else {
    ctMidMatch = false;
  }
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";

  const me = ctState.selectedTeam;
  const cur = ctCurrentMatch();
  const title = document.getElementById("ctTitle");
  const sub = document.getElementById("ctSubtitle");

  if (ctState.champion && ctState.champion === me) {
    if (title) title.textContent = "Champions";
    if (sub) sub.textContent = `You won ${ctState.name}!`;
  } else if (ctState.champion) {
    if (title) title.textContent = "Tournament Over";
    if (sub) sub.textContent = `${ctState.champion} won ${ctState.name}.`;
  } else if (ctState.eliminated) {
    if (title) title.textContent = "Eliminated";
    if (sub) sub.textContent = "Your run is over. The tournament plays on without you.";
  } else if (cur) {
    if (title) title.textContent = `${me} \u2014 ${ctState.name}`;
    if (sub) sub.textContent = cur.kind === "group"
      ? (ctState.format === "league" ? `Matchday ${cur.round}. Next: ${me} vs ${cur.opponent}.` : `Group stage, matchday ${cur.round}. Next: ${me} vs ${cur.opponent}.`)
      : `${cur.roundTitle}: ${me} vs ${cur.opponent}.`;
  } else {
    if (title) title.textContent = `${me} \u2014 ${ctState.name}`;
    if (sub) sub.textContent = "Awaiting the next round.";
  }

  let actions = "";
  if (ctMidMatch) {
    actions = `<button class="wcPrimaryBtn" onclick="ctResumeMatch()">Resume Match</button>`;
  } else if (cur) {
    actions = `<button class="wcPrimaryBtn" onclick="ctPlayNext()">Play Next Match</button>
      <button class="wcGhostBtn" onclick="ctSimNext()">Simulate It</button>`;
  } else if (ctState.champion || ctState.eliminated) {
    actions = `<button class="wcPrimaryBtn" onclick="ctNewTournament()">New Tournament</button>`;
  }
  actions += `<button class="wcGhostBtn" onclick="ctShowPicker()">Saved Games</button>`;
  actions += `<button class="wcGhostBtn" onclick="ctQuitToMenu()">Quit to Menu</button>`;

  const hasGroups = ctState.format !== "knockout" && (ctState.groups || []).length > 0;
  const hasBracket = (ctState.knockout || []).length > 0;
  let cols = "";
  if (hasGroups && hasBracket) {
    cols = `<div class="wcHubCols"><div class="wcGroupsCol">${ctStandingsHTML()}</div><div class="wcBracketCol">${ctBracketHTML()}</div></div>`;
  } else if (hasGroups) {
    cols = `<div class="wcHubCols"><div class="wcGroupsCol">${ctStandingsHTML()}</div></div>`;
  } else if (hasBracket) {
    cols = `<div class="wcHubCols"><div class="wcBracketCol">${ctBracketHTML()}</div></div>`;
  }

  body.innerHTML = `
    <div class="wcHubActions">${actions}</div>
    ${ctState.champion ? `<div class="wcChampion">Champions: <b>${ctEsc(ctState.champion)}</b></div>` : ""}
    ${cols}`;

  document.getElementById("customTournamentScreen").style.display = "block";
  if (typeof enterScreen === "function") enterScreen("customTournamentScreen", "block");
}

function ctTableRows(standings, advance) {
  const me = ctState.selectedTeam;
  return standings.map((row, i) => {
    let cls = row.team === me ? "playerRow " : "";
    if (advance > 0) cls += (i < advance) ? "qualRow" : "outRow";
    return `<tr class="${cls.trim()}">
      <td class="rank">${i + 1}</td>
      <td class="team">${ctFlag(row.team)} ${ctEsc(row.team)}</td>
      <td class="gd">${row.gd > 0 ? "+" : ""}${row.gd}</td>
      <td class="pts">${row.points}</td>
    </tr>`;
  }).join("");
}

function ctStandingsHTML() {
  if (ctState.format === "league") {
    const g = ctState.groups[0];
    if (!g) return "";
    return `<div class="round leagueTableWrap">
      <h3>${ctEsc(ctState.name)}</h3>
      <div class="match tableCard">
        <table class="leagueTable">
          <thead><tr><th>#</th><th>Team</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>${ctTableRows(ctGroupStandings(g), 1)}</tbody>
        </table>
      </div>
    </div>`;
  }
  return ctState.groups.map(g => `
    <div class="round leagueTableWrap">
      <h3>Group ${ctEsc(g.name)}</h3>
      <div class="match tableCard">
        <table class="leagueTable">
          <thead><tr><th>#</th><th>Team</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>${ctTableRows(ctGroupStandings(g), ctState.advance)}</tbody>
        </table>
      </div>
    </div>`).join("");
}

function ctFlag(team) {
  const code = ctTeamCode(team);
  return code ? `<span class="wcCode">${ctEsc(code)}</span>` : "";
}

function ctBracketHTML() {
  const rounds = ctState.knockout || [];
  const me = ctState.selectedTeam;
  const cols = rounds.map(round => {
    const ties = round.ties.map(tie => {
      const a = tie.team1 || (tie.bye ? "BYE" : "TBD");
      const b = tie.team2 || (tie.bye ? "BYE" : "TBD");
      const aWin = (tie.played && tie.team1 && tie.winner === tie.team1) ? "clWin" : "";
      const bWin = (tie.played && tie.team2 && tie.winner === tie.team2) ? "clWin" : "";
      const aYou = tie.team1 === me ? "clYou" : "";
      const bYou = tie.team2 === me ? "clYou" : "";
      let score = "TBD";
      if (tie.bye) score = "BYE";
      else if (tie.played && tie.score1 != null) {
        score = `${tie.score1}\u2013${tie.score2}`;
        if (tie.decidedBy === "penalties") score += ` <i>${tie.pens1}-${tie.pens2}p</i>`;
      }
      return `<div class="clBracketTie">
        <div class="clBracketTeam ${aWin} ${aYou}">${ctEsc(a)}</div>
        <span class="clBracketScore">${score}</span>
        <div class="clBracketTeam ${bWin} ${bYou}">${ctEsc(b)}</div>
      </div>`;
    }).join("");
    return `<div class="clBracketRound"><div class="clBracketRoundTitle">${ctEsc(round.title)}</div>${ties}</div>`;
  }).join("");
  return `<div class="clBracket">${cols}</div>`;
}

function ctNewTournament() {
  ctState = null;
  ctContext = null;
  ctConfig = null;
  ctShowSetup();
}

function ctQuitToMenu() {
  ctContext = null;
  const screen = document.getElementById("customTournamentScreen");
  if (screen) screen.style.display = "none";
  document.getElementById("gameScreen").style.display = "none";
  quitToMenu();
}
