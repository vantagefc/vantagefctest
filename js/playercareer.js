/* Player Career mode. Rebuilt orchestrator: owns setup, save state, season
   fixtures, the hub shell and the engine hooks (pcContext, pcOnGoal,
   pcIsGroupMatch, pcEndMatch, pcShowHub). pcpanels.js loads after this file and
   wraps pcStartSeason / pcApplyResult / pcShowHub / pcRenderSetup, and provides
   the News, Media, Relationships, Objectives, Transfers, Contract, Loans and
   Fitness tab bodies - so everything here exists as global functions. */

var pcState = null;
var pcContext = null;
var pcMidMatch = false;
var pcTab = "home";
var pcCompSel = null;
var pcView = { y: 2026, m: 7 };
var pcSetup = { name: "", club: null, pos: null, trait: null, league: null, mode: "prospect", epSlot: null };
var pcLive = { goals: 0, assists: 0 };
var pcTicker = null;
var pcTicking = false;
var pcSimPreview = false;
var PC_STORAGE_KEY = "vantagePlayerCareer_v1";

var PC_POSITIONS = [
  { key: "striker", label: "Striker", blurb: "A penalty-box predator: first to the ball, first to score." },
  { key: "winger", label: "Winger", blurb: "Pace and direct running out wide, cutting inside to hurt teams." },
  { key: "playmaker", label: "Playmaker", blurb: "The side's creator - you dictate tempo and pick the passes." }
];

var PC_TRAIT_CHOICES = [
  { key: "professional", label: "Professional", blurb: "Never drops below a seven. Reliable, respected, coachable." },
  { key: "ambitious", label: "Ambitious", blurb: "Pushes for bigger clubs and bigger stages every season." },
  { key: "loyal", label: "Loyal", blurb: "Fans adore a one-club man. Bonds form quickly around you." },
  { key: "mercurial", label: "Mercurial", blurb: "Unplayable on your day - and impossible to predict off it." },
  { key: "hotshot", label: "Hotshot", blurb: "Young, loud and front of every headline. The media watches." }
];

function pcEsc(s) { return (typeof ccEsc === "function") ? ccEsc(s) : String(s == null ? "" : s); }
function pcNum(n, d) { return (typeof ccNum === "function") ? ccNum(n, d) : (isFinite(Number(n)) ? Number(n) : (d || 0)); }
function pcCl(v, lo, hi) { return Math.max(lo, Math.min(hi, pcNum(v, lo))); }
function pcPickOf(a) { return a[Math.floor(Math.random() * a.length)]; }

/* The shared save-picker (sgPickerHTML/sgWhen) lives in core.js. Career files
   are also exercised standalone by harnesses that do not load it, so define
   fallbacks here when it is absent - in the browser core.js runs first and
   this block is skipped. */
if (typeof window !== "undefined" && typeof window.sgPickerHTML !== "function") {
  var pcSgEsc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  };
  window.sgWhen = function (ts) {
    var d = new Date(Number(ts) || 0);
    if (isNaN(d.getTime()) || !ts) return "";
    try { return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return ""; }
  };
  window.sgRowHTML = function (it) {
    return '<div class="sgRow">' +
      '<div class="sgInfo"><div class="sgBadge">' + pcSgEsc(String(it.badge || "?")) + '</div>' +
      '<div class="sgText"><div class="sgName">' + pcSgEsc(String(it.name || "")) + '</div>' +
      '<div class="sgMeta">' + pcSgEsc(String(it.meta || "")) + '</div></div></div>' +
      '<div class="sgActions"><button class="wcPrimaryBtn" onclick="' + it.resume + '">Continue</button>' +
      '<button class="wcGhostBtn sgDelBtn" onclick="' + it.del + '">Delete</button></div></div>';
  };
  window.sgPickerHTML = function (cfg) {
    var items = (cfg.items || []).map(window.sgRowHTML).join("");
    var body = items || '<div class="sgEmpty">' + pcSgEsc(String(cfg.emptyText || "No saved games yet.")) + '</div>';
    return '<div class="wcSetup sgPicker"><div class="sgList">' + body + '</div>' +
      '<div class="wcSetupActions sgNewActions">' +
      '<button class="wcPrimaryBtn" onclick="' + cfg.newAction + '">' + pcSgEsc(String(cfg.newLabel || "New")) + '</button>' +
      '<button class="wcGhostBtn" onclick="' + cfg.backAction + '">Back</button></div></div>';
  };
}

/* ------------------------------------------------------------- storage ----
   Several player careers can be saved at once. The store is
   { v:1, careers:[...], active:0, career:activeCareer }; older builds wrote a
   single { v:1, career:... } object straight to this key, so pcLoadAll() wraps
   that into the new shape and nobody loses their save. */

function pcNormalize(c) {
  if (!c || typeof c !== "object") return c;
  c.id = c.id || ("pc" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
  c.updatedAt = c.updatedAt || c.createdAt || Date.now();
  if (!Array.isArray(c.fixtures)) c.fixtures = [];
  if (!Array.isArray(c.news)) c.news = [];
  if (!Array.isArray(c.offers)) c.offers = [];
  if (!Array.isArray(c.form)) c.form = [];
  if (!Array.isArray(c.history)) c.history = [];
  return c;
}

function pcLoadAll() {
  try {
    const raw = localStorage.getItem(PC_STORAGE_KEY);
    if (!raw) return { v: 1, careers: [], active: 0 };
    const s = JSON.parse(raw);
    let careers = null;
    let active = 0;
    let needsWrite = false;
    if (s && Array.isArray(s.careers)) {
      careers = s.careers.filter(c => c && typeof c === "object");
      if (careers.some(c => !c.id)) needsWrite = true;
      careers = careers.map(pcNormalize);
      active = Number(s.active);
      if (!isFinite(active)) {
        active = 0;
        if (s.activeId) {
          const i = careers.findIndex(c => c.id === s.activeId);
          if (i >= 0) active = i;
        }
        needsWrite = true;
      }
      active = careers.length ? Math.max(0, Math.min(active, careers.length - 1)) : 0;
    } else if (s && s.career && typeof s.career === "object") {
      careers = [pcNormalize(s.career)];
      active = 0;
      needsWrite = true;
    } else {
      return { v: 1, careers: [], active: 0 };
    }
    const out = { v: 1, careers: careers, active: active };
    if (needsWrite) pcSaveAll(out);
    return out;
  } catch (e) { return { v: 1, careers: [], active: 0 }; }
}

function pcSaveAll(data) {
  try {
    if (data && Array.isArray(data.careers) && data.careers.length) {
      const i = Math.max(0, Math.min(Number(data.active) || 0, data.careers.length - 1));
      data.active = i;
      data.career = data.careers[i];
    } else if (data) {
      data.active = 0;
      data.career = null;
    }
    localStorage.setItem(PC_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function pcSave() {
  const all = pcLoadAll();
  if (pcState) {
    pcState.updatedAt = Date.now();
    const i = all.careers.findIndex(c => c && c.id === pcState.id);
    if (i >= 0) all.careers[i] = pcState; else all.careers.unshift(pcState);
    all.active = 0;
  }
  pcSaveAll(all);
}

function pcLoad() {
  const all = pcLoadAll();
  return all.careers.length ? all.careers[all.active] : null;
}

function pcClearSave() { try { localStorage.removeItem(PC_STORAGE_KEY); } catch (e) {} }

/* ---------------------------------------------------------- save picker --- */

function pcShowPicker() {
  const body = document.getElementById("pcBody");
  if (!body) return;
  pcHideOtherScreens();
  const title = document.getElementById("pcTitle");
  if (title) title.textContent = "Player Career";
  const sub = document.getElementById("pcSubtitle");
  if (sub) sub.textContent = "Pick up a saved career, or start a new one.";
  const items = pcLoadAll().careers.map(c => ({
    badge: pcClubInitials(c.club || c.name),
    name: (c.name || "Pro") + " \u2014 " + (c.club || "No club"),
    meta: (c.league || "") + " \u00b7 Season " + pcNum(c.season, 1) + " \u00b7 " + pcPosLabel(c) +
      (c.updatedAt ? " \u00b7 " + sgWhen(c.updatedAt) : ""),
    resume: "pcResumeCareer('" + c.id + "')",
    del: "pcDeleteCareerAsk('" + c.id + "')"
  }));
  body.innerHTML = sgPickerHTML({
    items: items,
    emptyText: "No saved careers yet.",
    newLabel: "New Career",
    newAction: "pcNewCareerFromPicker()",
    backAction: "pcQuitToMenu()"
  });
  if (typeof enterScreen === "function") enterScreen("careerScreen", "block");
  else document.getElementById("careerScreen").style.display = "block";
}

function pcResumeCareer(id) {
  pcTickerStop();
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  const all = pcLoadAll();
  const i = all.careers.findIndex(c => c && c.id === id);
  if (i < 0) { pcShowPicker(); return; }
  const c = all.careers.splice(i, 1)[0];
  all.careers.unshift(c);
  all.active = 0;
  pcSaveAll(all);
  if (pcState && pcState.id !== c.id) pcRestoreRoster(pcState);
  pcState = c;
  if (!Array.isArray(pcState.form)) pcState.form = [];
  if (!Array.isArray(pcState.offers)) pcState.offers = [];
  pcContext = null;
  pcMidMatch = false;
  pcTab = "home";
  pcRegisterRoster(pcState);
  pcShowHub();
}

function pcDeleteCareerAsk(id) {
  pcTickerStop();
  const all = pcLoadAll();
  const c = all.careers.find(x => x && x.id === id);
  if (!c) return;
  if (typeof window !== "undefined" && typeof window.confirm === "function" &&
      !window.confirm('Delete "' + (c.name || "this career") + '"? This cannot be undone.')) return;
  if (pcState && pcState.id === id) {
    pcRestoreRoster(pcState);
    pcState = null;
    pcContext = null;
    pcMidMatch = false;
  }
  all.careers = all.careers.filter(x => x && x.id !== id);
  all.active = 0;
  pcSaveAll(all);
  pcShowPicker();
}

function pcNewCareerFromPicker() {
  pcTickerStop();
  if (pcState) pcRestoreRoster(pcState);
  pcState = null;
  pcContext = null;
  pcMidMatch = false;
  pcTab = "home";
  pcRenderSetup();
}

/* ---------------------------------------------------------- club pools ---- */

function pcCareerLeagues() {
  if (typeof CAREER_LEAGUES !== "undefined" && CAREER_LEAGUES && CAREER_LEAGUES.length) return CAREER_LEAGUES;
  return (typeof MYCLUB_LEAGUES !== "undefined") ? MYCLUB_LEAGUES : [];
}

function pcLeagueClubEntries(leagueName) {
  const out = [];
  for (const l of pcCareerLeagues()) {
    if (leagueName && l.name !== leagueName) continue;
    for (const club of (l.clubs || [])) out.push({ club: club, league: l.name, short: l.short });
  }
  return out;
}

function pcAllClubs() {
  return pcLeagueClubEntries().map(x => ({ club: x.club, league: x.league }));
}

function pcLeagueOf(club) {
  const leagues = pcCareerLeagues();
  const l = leagues.find(x => (x.clubs || []).indexOf(club) >= 0);
  if (l) return l;
  if (leagues[0]) return leagues[0];
  return { name: "Premier League", short: "PL", cup: "Domestic Cup", clubs: [club] };
}

function pcEnsureClub(club) {
  if (!club) return;
  if (typeof TEAM_ROSTERS !== "undefined" && TEAM_ROSTERS[club]) return;
  if (typeof buildMyClubStarterSquad === "function") buildMyClubStarterSquad(club);
}

function pcActiveClub(c) {
  return (c && c.loanActive && c.loanActive.club) ? c.loanActive.club : (c ? c.club : "");
}

/* ------------------------------------------------------------ career ------ */

function pcEmptyStats() {
  return { apps: 0, goals: 0, assists: 0, motm: 0, wins: 0, ratingSum: 0, played: 0 };
}

function pcSeedPersonality(trait) {
  const seeds = {
    professional: { media: 70, loyalty: 65, boldness: 50 },
    ambitious: { media: 55, loyalty: 42, boldness: 76 },
    loyal: { media: 62, loyalty: 86, boldness: 44 },
    mercurial: { media: 36, loyalty: 48, boldness: 82 },
    hotshot: { media: 42, loyalty: 34, boldness: 86 }
  };
  const s = seeds[trait] || seeds.professional;
  return { type: trait, media: s.media, loyalty: s.loyalty, boldness: s.boldness };
}

function pcSeedTeammates(c) {
  pcEnsureClub(c.club);
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[c.club] : null;
  const names = [];
  if (r) {
    const push = list => { for (const p of (list || [])) { if (p && p.name && p.name !== c.name) names.push(p.name); } };
    push(r.defenders); push(r.midfielders); push(r.attackers); push(r.bench); push(r.reserves);
    if (r.goalkeeper && r.goalkeeper.name) names.push(r.goalkeeper.name);
  }
  const mates = [];
  const used = {};
  let guard = 0;
  while (mates.length < 6 && names.length && guard++ < 60) {
    const n = pcPickOf(names);
    if (used[n]) continue;
    used[n] = 1;
    mates.push({ name: n, bond: 35 + Math.floor(Math.random() * 40) });
  }
  c.rel = c.rel || {};
  c.rel.teammates = mates;
}

function pcRoleToPos(role) {
  return role === "midfielder" ? "playmaker" : "striker";
}

function pcRoleLabel(role) {
  const labels = { goalkeeper: "Goalkeeper", defender: "Defender", midfielder: "Midfielder", attacker: "Attacker" };
  return labels[role] || "Forward";
}

function pcBaseCardFrom(p) {
  return {
    pace: pcCl(p && p.pace, 1, 99),
    shooting: pcCl(p && p.shooting, 1, 99),
    passing: pcCl(p && p.passing, 1, 99),
    dribbling: pcCl(p && p.dribbling, 1, 99),
    defending: pcCl(p && p.defending, 1, 99),
    physical: pcCl(p && p.physical, 1, 99)
  };
}

function pcExistingSlots(club) {
  pcEnsureClub(club);
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
  if (!r) return [];
  const out = [];
  const push = (key, p) => {
    if (!p || !p.name) return;
    const role = p.role || (key === "gk" ? "goalkeeper" : key.charAt(0) === "d" ? "defender" : key.charAt(0) === "m" ? "midfielder" : "attacker");
    const ovr = (typeof calculateOverall === "function") ? Math.round(calculateOverall(p, role)) : 70;
    out.push({ key: key, name: p.name, role: role, ovr: ovr, player: p });
  };
  push("gk", r.goalkeeper);
  (r.defenders || []).forEach((p, i) => push("d" + i, p));
  (r.midfielders || []).forEach((p, i) => push("m" + i, p));
  (r.attackers || []).forEach((p, i) => push("a" + i, p));
  (r.bench || []).forEach((p, i) => push("b" + i, p));
  (r.reserves || []).forEach((p, i) => push("r" + i, p));
  return out;
}

function pcNewCareerAsExisting(club, slotKey) {
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  pcEnsureClub(club);
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
  const p = r ? ((typeof TeamEdits !== "undefined" && TeamEdits.getSlot) ? TeamEdits.getSlot(r, slotKey) : null) : null;
  if (!r || !p || !p.name) return null;
  const role = p.role || ((typeof TeamEdits !== "undefined" && TeamEdits.slotRole) ? TeamEdits.slotRole(slotKey, p) : "attacker");
  const ovr = (typeof calculateOverall === "function") ? Math.round(calculateOverall(p, role)) : 70;
  const lg = pcLeagueOf(club);
  const age = pcCl(p.age || 24, 16, 40);
  const c = {
    v: 1,
    id: "pc" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    name: p.name,
    position: pcRoleToPos(role),
    posLabel: pcRoleLabel(role),
    trait: "professional",
    club: club,
    league: lg.name,
    leagueShort: lg.short || "",
    cupName: lg.cup || "Domestic Cup",
    clubs: (lg.clubs || []).slice(),
    season: 1,
    calDay: CC_CAL_FIRST_DAY,
    age: age,
    ovr: ovr,
    potential: Math.min(99, ovr + 3 + Math.floor(Math.random() * 8)),
    rep: Math.max(12, Math.min(85, Math.round(ovr * 0.8))),
    trust: 62,
    chemistry: 64,
    personality: pcSeedPersonality("professional"),
    rel: { agent: 55, teammates: [], managerNote: "" },
    contract: { wage: Math.round(ovr * ovr * 2.4), seasons: 3, yearsLeft: 3 },
    earnings: 0,
    seasonStats: pcEmptyStats(),
    form: [],
    dp: 0,
    seasonTrainGain: 0,
    injury: null,
    susp: 0,
    suspNext: 0,
    offers: [],
    loans: [],
    news: [],
    press: [],
    social: { followers: Math.max(300, ovr * 12), trending: [] },
    objectives: [],
    fixtures: [],
    history: [],
    baseCard: pcBaseCardFrom(p),
    baseRole: role,
    proSlot: slotKey,
    __editId: p.__editId || null,
    origName: p.origName || p.name,
    createdAt: Date.now()
  };
  pcSeedTeammates(c);
  pcState = c;
  pcStartSeason(c, true);
  pcSave();
  return c;
}

function pcNewCareer(name, club, posKey, trait) {
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  const lg = pcLeagueOf(club);
  const ovr = 56 + Math.floor(Math.random() * 7);
  const c = {
    v: 1,
    id: "pc" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    name: name,
    position: posKey,
    trait: trait,
    club: club,
    league: lg.name,
    leagueShort: lg.short || "",
    cupName: lg.cup || "Domestic Cup",
    clubs: (lg.clubs || []).slice(),
    season: 1,
    calDay: CC_CAL_FIRST_DAY,
    age: 17,
    ovr: ovr,
    potential: 76 + Math.floor(Math.random() * 18),
    rep: 8 + Math.floor(Math.random() * 8),
    trust: 58,
    chemistry: 60,
    personality: pcSeedPersonality(trait),
    rel: { agent: 55, teammates: [], managerNote: "" },
    contract: { wage: Math.round(ovr * ovr * 2.2), seasons: 3, yearsLeft: 3 },
    earnings: 0,
    seasonStats: pcEmptyStats(),
    form: [],
    dp: 0,
    seasonTrainGain: 0,
    injury: null,
    susp: 0,
    suspNext: 0,
    offers: [],
    loans: [],
    news: [],
    press: [],
    social: { followers: 350, trending: [] },
    objectives: [],
    fixtures: [],
    history: [],
    createdAt: Date.now()
  };
  pcSeedTeammates(c);
  pcState = c;
  pcStartSeason(c, true);
  pcSave();
}

function pcProOvr(c) { return Math.round(pcCl(c ? c.ovr : 70, 1, 99)); }

function pcSeasonCap(age) {
  const a = pcNum(age, 20);
  if (a <= 20) return 26;
  if (a <= 24) return 18;
  if (a <= 29) return 10;
  return 5;
}

function pcPosLabel(key) {
  if (key && typeof key === "object") {
    if (key.posLabel) return key.posLabel;
    key = key.position;
  }
  const p = PC_POSITIONS.find(x => x.key === key);
  return p ? p.label : "Forward";
}

function pcProCard(c) {
  if (c && c.baseCard) {
    const card = {
      name: c.name,
      pace: pcCl(c.baseCard.pace, 1, 99),
      shooting: pcCl(c.baseCard.shooting, 1, 99),
      passing: pcCl(c.baseCard.passing, 1, 99),
      dribbling: pcCl(c.baseCard.dribbling, 1, 99),
      defending: pcCl(c.baseCard.defending, 1, 99),
      physical: pcCl(c.baseCard.physical, 1, 99),
      role: c.baseRole || "attacker"
    };
    if (c.__editId) card.__editId = c.__editId;
    if (c.origName) card.origName = c.origName;
    return card;
  }
  const p = makeRatedPlayer(c.name, pcProOvr(c), "attacker");
  if (c.position === "winger") {
    p.pace = Math.min(99, p.pace + 5);
    p.dribbling = Math.min(99, p.dribbling + 4);
  } else if (c.position === "playmaker") {
    p.passing = Math.min(99, p.passing + 7);
    p.dribbling = Math.min(99, p.dribbling + 2);
  } else {
    p.shooting = Math.min(99, p.shooting + 5);
    p.physical = Math.min(99, p.physical + 2);
  }
  return p;
}

function pcSlotGet(r, key) {
  if (!r || !key) return null;
  if (typeof TeamEdits !== "undefined" && TeamEdits.getSlot) return TeamEdits.getSlot(r, key);
  if (typeof getSlotData === "function") return getSlotData(r, key);
  return key === "a2" ? (r.attackers || [])[2] || null : null;
}

function pcSlotSet(r, key, player) {
  if (!r || !key) return;
  if (typeof TeamEdits !== "undefined" && TeamEdits.setSlot) { TeamEdits.setSlot(r, key, player); return; }
  if (typeof setSlotData === "function") { setSlotData(r, key, player); return; }
  if (key === "a2") { if (!Array.isArray(r.attackers)) r.attackers = []; r.attackers[2] = player; }
}

function pcRegisterRoster(c) {
  const club = pcActiveClub(c);
  pcEnsureClub(club);
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
  if (!r) return;
  if (!Array.isArray(r.attackers)) r.attackers = [];
  if (c.proSlotClub && c.proSlotClub !== club) pcRestoreRoster(c, c.proSlotClub);
  if (!Array.isArray(c.savedSlots)) c.savedSlots = [];
  if (r.attackers[2] && r.attackers[2].name === c.name) { c.proSlotClub = club; return; }
  const existing = r.attackers[2];
  if (!c.savedSlots.some(s => s.club === club)) {
    if (c.proSlot && c.proSlot !== "a2") {
      const from = pcSlotGet(r, c.proSlot);
      c.savedSlots.push({ club: club, slot: existing, fromKey: c.proSlot, fromPlayer: from });
      if (from && existing) pcSlotSet(r, c.proSlot, existing);
    } else {
      c.savedSlots.push({ club: club, slot: existing });
    }
  }
  r.attackers[2] = pcProCard(c);
  c.proSlotClub = club;
}

function pcRestoreRoster(c, club) {
  c = c || pcState;
  if (!c) return;
  club = club || c.proSlotClub;
  if (!club) return;
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
  if (r && Array.isArray(r.attackers) && r.attackers[2] && r.attackers[2].name === c.name) {
    let saved = null;
    if (Array.isArray(c.savedSlots)) {
      for (const s of c.savedSlots) if (s.club === club) saved = s;
    }
    if (saved) {
      if (saved.fromKey && saved.fromPlayer) pcSlotSet(r, saved.fromKey, saved.fromPlayer);
      r.attackers[2] = saved.slot;
    }
  }
  if (c.proSlotClub === club) c.proSlotClub = null;
}

/* ----------------------------------------------------------- fixtures ----- */

function pcShuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function pcRRRounds(list) {
  const n = list.length;
  const arr = list.slice();
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    arr.splice(1, 0, arr.pop());
  }
  return rounds;
}

function pcBuildFixtures(c) {
  const teams = (c.clubs || []).slice();
  const out = [];
  const dayFor = function (mo, da) {
    if (typeof ccCalDayFor === "function" && c) {
      try { return ccCalDayFor(c, mo, da); } catch (e) {}
    }
    return null;
  };
  const activeClub = pcActiveClub(c);
  const eur = c.euroRoute || null;      // set from LAST season's finish

  // ============ SUPER CUPS (August, before league) ============
  // Single-match events, player's club vs a qualifying opponent. Only from
  // season 2 onward — season 1 has no previous season to qualify from.
  if (c.season > 1 && teams.length >= 2) {
    const opponents = pcShuffle(teams.filter(t => t !== activeClub));
    const opp1 = opponents[0] || teams[0];
    const opp2 = opponents[1] || teams[0];

    const uscDay = dayFor(8, 5);
    if (uscDay) {
      out.push({
        kind: "uefasuper", round: 1, day: uscDay,
        match: createMatch(activeClub, opp1),
        name: "UEFA Super Cup"
      });
    }

    const scDay = dayFor(8, 8);
    if (scDay) {
      out.push({
        kind: "supercup", round: 1, day: scDay,
        match: createMatch(activeClub, opp2),
        name: "Domestic Super Cup"
      });
    }
  }

  // ============ LEAGUE (Aug → May) ============
  if (teams.length >= 4) {
    const rr = pcRRRounds(teams);
    const leagueStart = dayFor(8, 10) || CC_CAL_FIRST_DAY;
    for (let md = 0; md < rr.length * 2; md++) {
      const round = rr[md % rr.length];
      const leg = md < rr.length ? 0 : 1;
      for (const pair of round) {
        const home = leg === 0 ? pair[0] : pair[1];
        const away = leg === 0 ? pair[1] : pair[0];
        out.push({
          kind: "league", round: md + 1,
          day: leagueStart + md * 7,
          match: createMatch(home, away)
        });
      }
    }

    // ============ DOMESTIC CUP (Aug → May, spread) ============
    let seeds;
    if (activeClub && teams.indexOf(activeClub) >= 0) {
      seeds = [activeClub].concat(pcShuffle(teams.filter(t => t !== activeClub)).slice(0, 15));
    } else {
      seeds = pcShuffle(teams).slice(0, 16);
    }
    const cupDays = [
      dayFor(8, 25)  || (CC_CAL_FIRST_DAY + 15),
      dayFor(11, 20) || (CC_CAL_FIRST_DAY + 111),
      dayFor(2, 20)  || (CC_CAL_FIRST_DAY + 203),
      dayFor(5, 10)  || (CC_CAL_FIRST_DAY + 282)
    ];
    if (seeds.length === 16) {
      for (let i = 0; i < 8; i++) {
        out.push({ kind: "cup", round: 1, day: cupDays[0],
                   match: createMatch(seeds[i * 2], seeds[i * 2 + 1]) });
      }
      const cupSizes = { 2: 4, 3: 2, 4: 1 };
      for (let r = 2; r <= 4; r++) {
        for (let k = 0; k < cupSizes[r]; k++) {
          out.push({ kind: "cup", round: r, day: cupDays[r - 1],
                     match: createMatch(null, null) });
        }
      }
    }

    // ============ EUROPE (Sep → May, only if qualified) ============
    // c.euroRoute comes from pcComputeEuroRoute() using last season's finish,
    // so this only fires when you earned a place. 8 league-phase fixtures
    // against 8 distinct opponents — the last one is the final.
    if (eur && c.season > 1 && teams.length >= 8) {
      const windows = {
        cl:  { start: [9, 15], end: [5, 20] },
        el:  { start: [8, 15], end: [5, 14] },
        ecl: { start: [8, 15], end: [5, 21] }
      };
      const w = windows[eur];
      if (w) {
        const startDay = dayFor(w.start[0], w.start[1]);
        const endDay   = dayFor(w.end[0],   w.end[1]);
        if (startDay && endDay) {
          const opponents = pcShuffle(teams.filter(t => t !== activeClub)).slice(0, 8);
          const count = Math.min(8, opponents.length);
          const spacing = count > 1
            ? Math.max(14, Math.floor((endDay - startDay) / (count - 1)))
            : 0;
          for (let i = 0; i < count; i++) {
            const opp = opponents[i];
            const homeFirst = i % 2 === 0;
            const m = createMatch(homeFirst ? activeClub : opp,
                                  homeFirst ? opp : activeClub);
            m.round = i + 1;
            m.day = startDay + i * spacing;
            m.euroComp = eur;
            out.push({
              kind: "europe", comp: eur, round: i + 1, day: m.day,
              match: m, isFinal: i === count - 1
            });
          }
        }
      }
    }

    // ============ CLUB WORLD CUP (May 28, every 4th season) ============
    // The career calendar ends on May 31, so CWC lives in the last week of
    // May rather than June/July — the user spec is approximated to keep the
    // season flow within the existing CC_CAL_END_DAY bound.
    if (c.season > 1 && Number(c.season) % 4 === 0 && teams.length >= 2) {
      const cwcDay = dayFor(5, 28);
      if (cwcDay && cwcDay <= CC_CAL_END_DAY) {
        const opponents = pcShuffle(teams.filter(t => t !== activeClub));
        const opp = opponents[0] || teams[0];
        out.push({
          kind: "clubworldcup", round: 1, day: cwcDay,
          match: createMatch(activeClub, opp),
          name: "Club World Cup"
        });
      }
    }
  }

  out.sort((a, b) => a.day - b.day || a.round - b.round);
  return out;
}

function pcFillCupNext(c) {
  const cup = c.fixtures.filter(f => f.kind === "cup");
  for (let r = 1; r <= 3; r++) {
    const cur = cup.filter(f => f.round === r);
    if (!cur.length) continue;
    if (!cur.every(f => f.played && f.match && f.match.winner)) continue;
    const next = cup.filter(f => f.round === r + 1);
    if (!next.length || (next[0].match && next[0].match.team1)) continue;
    const winners = cur.map(f => f.match.winner);
    for (let i = 0; i < next.length; i++) {
      next[i].match.team1 = winners[i * 2] || null;
      next[i].match.team2 = winners[i * 2 + 1] || null;
    }
    return;
  }
}

function pcTrophyFor(c, f, userWon) {
  if (!userWon || !f) return null;
  if (f.kind === "cup" && f.round === 4) return c.cupName || "Domestic Cup";
  if (f.kind === "supercup")             return "Domestic Super Cup";
  if (f.kind === "uefasuper")            return "UEFA Super Cup";
  if (f.kind === "clubworldcup")         return "Club World Cup";
  if (f.kind === "europe" && f.isFinal) {
    return ({ cl: "Champions League",
              el: "Europa League",
              ecl: "Conference League" })[f.comp] || "European Cup";
  }
  return null;
}

function pcValidFixture(f) {
  return f && f.match && f.match.team1 && f.match.team2;
}

function pcNextUserFixture(c) {
  const active = pcActiveClub(c);
  let best = null;
  for (const f of c.fixtures) {
    if (!pcValidFixture(f) || f.played) continue;
    if (f.match.team1 !== active && f.match.team2 !== active) continue;
    if (!best || f.day < best.day) best = f;
  }
  return best;
}

function pcNextAnyFixture(c) {
  let best = null;
  for (const f of c.fixtures) {
    if (!pcValidFixture(f) || f.played) continue;
    if (!best || f.day < best.day || (f.day === best.day && f.round < best.round)) best = f;
  }
  return best;
}

function pcFixtureOpponent(c, f) {
  const active = pcActiveClub(c);
  return f.match.team1 === active ? f.match.team2 : f.match.team1;
}

function pcSeasonDone(c) {
  if (!c.fixtures.length) return true;
  return c.fixtures.every(f => f.played || !pcValidFixture(f));
}

function pcTable(c) {
  const league = c.fixtures.filter(f => f.kind === "league").map(f => f.match);
  if (typeof computeGroupStandings === "function") {
    return computeGroupStandings({ teams: c.clubs, matches: league });
  }
  return [];
}

function pcRankOf(c, team) {
  const table = pcTable(c);
  for (let i = 0; i < table.length; i++) if (table[i].team === team) return i + 1;
  return table.length || 1;
}

function pcSwapClub(c, newClub) {
  if (!c || !newClub || newClub === c.club) return;
  pcRestoreRoster(c, pcActiveClub(c));
  c.club = newClub;
  const lg = pcLeagueOf(newClub);
  c.league = lg.name;
  c.leagueShort = lg.short || "";
  c.cupName = lg.cup || "Domestic Cup";
  c.clubs = (lg.clubs || []).slice();
  pcSeedTeammates(c);
}

function pcGetLeagueByName(name) {
  for (const l of pcCareerLeagues()) if (l.name === name) return l;
  return null;
}

function pcGetLeaguesForCountry(country) {
  const out = [];
  for (const l of pcCareerLeagues()) {
    if (pcLeagueCountry(l) === country) out.push(l);
  }
  out.sort((a, b) => pcNum(a.tier, 1) - pcNum(b.tier, 1));
  return out;
}

function pcPseudoLeagueTable(lg) {
  if (!lg) return [];
  const clubs = (lg.clubs || []).slice();
  const strFn = (typeof getTeamStrength === "function") ? getTeamStrength : function () { return 70; };
  const rows = clubs.map((team, idx) => {
    const base = strFn(team);
    const jitter = ((idx * 131542391) % 17) - 8;
    const pts = Math.max(10, Math.round(base * 1.2 + jitter));
    const gf = Math.max(10, Math.round(pts * 0.9 + jitter));
    const ga = Math.max(10, Math.round(pts * 0.7 - jitter));
    return { team: team, points: pts, gf: gf, ga: ga, gd: gf - ga, played: (lg.clubs || []).length * 2 - 2, w: 0, d: 0, l: 0 };
  });
  rows.sort((x, y) => y.points - x.points || y.gd - x.gd || String(x.team).localeCompare(String(y.team)));
  return rows;
}

function pcApplyPromotionRelegation(c) {
  const res = { moved: false, direction: null, from: null, to: null };
  if (!c) return res;
  const owned = c.club || pcActiveClub(c);
  const curLg = pcGetLeagueByName(c.league) || pcLeagueOf(owned);
  if (!curLg) return res;
  const country = pcLeagueCountry(curLg);
  const tiers = pcGetLeaguesForCountry(country);
  if (tiers.length <= 1) return res;
  const K = 3;
  const exchanges = [];
  for (let i = 0; i < tiers.length - 1; i++) {
    const upper = tiers[i];
    const lower = tiers[i + 1];
    if (!upper || !lower) continue;
    let upTable;
    if (curLg.name === lower.name && typeof pcTable === "function") upTable = pcTable(c);
    else upTable = pcPseudoLeagueTable(lower);
    let downTable;
    if (curLg.name === upper.name && typeof pcTable === "function") downTable = pcTable(c);
    else downTable = pcPseudoLeagueTable(upper);
    const promoted = [];
    for (let r = 0; r < upTable.length && promoted.length < K; r++) {
      if (upTable[r] && upTable[r].team) promoted.push(upTable[r].team);
    }
    const relegated = [];
    for (let r = downTable.length - 1; r >= 0 && relegated.length < K; r--) {
      if (downTable[r] && downTable[r].team) relegated.push(downTable[r].team);
    }
    if (promoted.length && relegated.length) {
      exchanges.push({ upper: upper, lower: lower, promoted: promoted, relegated: relegated });
    }
  }
  if (!exchanges.length) return res;
  const moving = {};
  for (const ex of exchanges) {
    for (const tm of ex.relegated) moving[tm] = ex.lower.name;
    for (const tm of ex.promoted) moving[tm] = ex.upper.name;
  }
  for (const ex of exchanges) {
    const upperClubs = (ex.upper.clubs || []).slice();
    const lowerClubs = (ex.lower.clubs || []).slice();
    for (const tm of ex.relegated) {
      const idx = upperClubs.indexOf(tm);
      if (idx >= 0) upperClubs.splice(idx, 1);
    }
    for (const tm of ex.promoted) {
      const idx = lowerClubs.indexOf(tm);
      if (idx >= 0) lowerClubs.splice(idx, 1);
    }
    for (const tm of ex.promoted) upperClubs.push(tm);
    for (const tm of ex.relegated) lowerClubs.push(tm);
    upperClubs.sort((a, b) => String(a).localeCompare(String(b)));
    lowerClubs.sort((a, b) => String(a).localeCompare(String(b)));
    ex.upper.clubs = upperClubs;
    ex.lower.clubs = lowerClubs;
  }
  const newLg = pcLeagueOf(owned);
  if (newLg) {
    c.league = newLg.name;
    c.leagueShort = newLg.short || "";
    c.cupName = newLg.cup || c.cupName || "Domestic Cup";
    c.clubs = (newLg.clubs || []).slice();
  }
  if (moving[owned] && newLg) {
    const dir = pcNum(newLg.tier, 1) < pcNum(curLg.tier, 1) ? "up" : "down";
    res.moved = true;
    res.direction = dir;
    res.from = curLg.name;
    res.to = newLg.name;
    if (typeof ccNews === "function") {
      try { ccNews(c, dir === "up" ? "promotion" : "relegation", { club: owned, league: newLg.name }); } catch (e) {}
    }
  }
  return res;
}

function pcComputeEuroRoute(c) {
  if (!c) return null;
  const lg = pcLeagueOf(c.club);
  let clSlots = lg && typeof lg.clSlots === "number" ? lg.clSlots : 0;
  if (clSlots <= 0) clSlots = 4;
  const rank = pcRankOf(c, c.club);
  if (rank <= clSlots) return "cl";
  if (rank === clSlots + 1) return "el";
  if (rank === clSlots + 2) return "ecl";
  return null;
}

function pcStartSeason(c, first) {
  if (!c) return;
  if (c.pendingClub) {
    pcSwapClub(c, c.pendingClub);
    c.pendingClub = null;
    c.trust = pcCl(c.trust - 3, 0, 100);
  }
  if (c.loanPending) {
    c.loanActive = { club: c.loanPending, from: c.season };
    if (!Array.isArray(c.loans)) c.loans = [];
    c.loans.push({ club: c.loanPending, from: c.season, apps: 0, goals: 0 });
    c.loanPending = null;
    if (typeof ccNews === "function") ccNews(c, "loan", {});
  }
  c.calDay = CC_CAL_FIRST_DAY;
  c.seasonStats = pcEmptyStats();
  c.form = [];
  c.seasonTrainGain = 0;
  c.susp = 0;
  c.suspNext = 0;
  c.offers = [];
  if (!first) {
    try { c.euroRoute = pcComputeEuroRoute(c); } catch (e) { c.euroRoute = null; }
    const ct = c.contract || (c.contract = { wage: 5000, seasons: 3, yearsLeft: 3 });
    ct.yearsLeft = pcNum(ct.yearsLeft, 3) - 1;
    if (ct.yearsLeft <= 0) {
      ct.yearsLeft = pcNum(ct.seasons, 3);
      ct.wage = Math.round(pcNum(ct.wage, 5000) * (1.12 + pcNum(c.rep, 10) / 400));
      c.trust = pcCl(c.trust + 4, 0, 100);
      if (typeof ccNews === "function") ccNews(c, "contract", {});
    }
    pcBuildOffers(c, 1 + Math.floor(Math.random() * 2));
  } else {
    try { c.euroRoute = null; } catch (e) {}
  }
  c.fixtures = pcBuildFixtures(c);
  pcRegisterRoster(c);
  pcSave();
}

function pcBuildOffers(c, count) {
  if (!c) return;
  if (!Array.isArray(c.offers)) c.offers = [];
  const active = pcActiveClub(c);
  const pool = (c.clubs || []).filter(x => x !== active && !c.offers.some(o => o.club === x));
  if (!pool.length) return;
  count = pcCl(count == null ? (Math.random() < 0.5 ? 1 : 0) : count, 0, 4);
  const ovr = pcProOvr(c);
  for (let i = 0; i < count && pool.length; i++) {
    const club = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const str = (typeof getTeamStrength === "function") ? getTeamStrength(club) : 70;
    const wage = Math.round(ovr * ovr * 2.2 * (0.75 + str / 160));
    c.offers.push({
      club: club,
      league: c.league,
      tier: (typeof ccRepTier === "function") ? ccRepTier(str) : "",
      wage: wage,
      day: c.calDay
    });
  }
  if (c.offers.length > 4) c.offers = c.offers.slice(-4);
}

function pcAcceptOffer(c, i) {
  if (!c || !Array.isArray(c.offers)) return;
  const o = c.offers[i];
  if (!o) return;
  c.pendingClub = o.club;
  c.offers = [];
  c.trust = pcCl(c.trust - 5, 0, 100);
  if (typeof ccNews === "function") ccNews(c, "contract", {});
  pcSave();
  if (typeof pcShowHub === "function") pcShowHub();
}

function pcDeclineOffers(c) {
  if (!c || !Array.isArray(c.offers)) return;
  c.offers = [];
  c.trust = pcCl(c.trust + 1, 0, 100);
  pcSave();
  if (typeof pcShowHub === "function") pcShowHub();
}

function pcApplyResult(c, r) {
  if (!c || !r) return;
  if (r.trophy) {
  if (!Array.isArray(c.trophyCabinet)) c.trophyCabinet = [];
  const already = c.trophyCabinet.some(t =>
    t && t.season === c.season && t.name === r.trophy);
  if (!already) {
    c.trophyCabinet.push({ name: r.trophy, season: c.season, kind: r.kind || "" });
    c.trophies = pcNum(c.trophies, 0) + 1;
  }
}
  const ss = c.seasonStats || (c.seasonStats = pcEmptyStats());
  const mins = pcNum(r.minutes, 0);
  if (mins > 0) {
    ss.apps += 1;
    ss.played += 1;
    ss.goals += pcNum(r.proGoals, 0);
    ss.assists += pcNum(r.proAssists, 0);
    if (r.result === "w") ss.wins += 1;
    const rating = pcCl(r.rating, 4, 9.9);
    ss.ratingSum += rating;
    if (!Array.isArray(c.form)) c.form = [];
    c.form.push(Math.round(rating * 10) / 10);
    while (c.form.length > 5) c.form.shift();
    if (rating >= 8.8) ss.motm += 1;
  }
  const agent = pcCl((c.rel || {}).agent, 0, 40);
  c.earnings = pcNum(c.earnings, 0) + Math.round(pcNum((c.contract || {}).wage, 0) * (1 - agent / 100));
  if (r.result === "w") { c.trust += 4; c.chemistry += 2; c.rep += 0.4; }
  else if (r.result === "d") { c.trust += 1; c.chemistry += 0.5; c.rep += 0.1; }
  else { c.trust -= 4; c.chemistry -= 2; c.rep -= 0.2; }
  c.trust = pcCl(c.trust, 0, 100);
  c.chemistry = pcCl(c.chemistry, 0, 100);
  c.rep = pcCl(c.rep, 1, 99);
  if (mins > 0) c.seasonTrainGain = Math.min(pcNum(c.seasonTrainGain, 0) + 1 + (pcNum(r.rating, 6) >= 7.5 ? 0.5 : 0), 99);
  const mates = (c.rel || {}).teammates;
  if (Array.isArray(mates)) {
    const bump = r.result === "w" ? 2 : r.result === "d" ? 0.5 : -2;
    for (const m of mates) m.bond = pcCl(pcNum(m.bond, 50) + bump, 5, 100);
  }
  if (c.loanActive && Array.isArray(c.loans)) {
    for (const l of c.loans) {
      if (l.club === c.loanActive.club && !l.to) {
        l.apps = pcNum(l.apps, 0) + 1;
        l.goals = pcNum(l.goals, 0) + pcNum(r.proGoals, 0);
      }
    }
  }
  if (mins > 0 && !c.injury && Math.random() < 0.07) {
    const types = ["hamstring strain", "ankle sprain", "calf problem", "knock", "groin strain"];
    c.injury = { type: pcPickOf(types), days: 5 + Math.floor(Math.random() * 24) };
    if (typeof ccNews === "function") ccNews(c, "injury", {});
  }
  if (!Array.isArray(c.social.trending)) c.social.trending = [];
  const swing = r.result === "w" ? 200 + pcNum(c.rep, 10) * 22 : r.result === "d" ? 40 : -80;
  c.social.followers = Math.max(0, pcNum(c.social.followers, 0) + swing + pcNum(r.proGoals, 0) * 420);
  if (r.result === "w" && pcNum(r.proGoals, 0) >= 2) {
    c.social.trending.unshift({ tag: c.name + " scores " + r.proGoals, vol: "Trending" });
    while (c.social.trending.length > 5) c.social.trending.pop();
  }
  if (Math.random() < 0.25) {
    if (!Array.isArray(c.press)) c.press = [];
    const heads = {
      w: ["Boss delighted with " + c.name, c.name + " the difference in " + r.opp + " win"],
      d: ["Point leaves " + c.name + " wanting more", c.name + " rues missed chances against " + r.opp],
      l: ["Questions after defeat to " + r.opp, c.name + " promises response after loss"]
    };
    c.press.unshift({
      head: pcPickOf(heads[r.result] || heads.d),
      body: "The performance against " + r.opp + " was dissected as usual, with " + c.name + " central to the discussion in the dressing room.",
      src: "Press conference",
      t: Date.now()
    });
    while (c.press.length > 20) c.press.length = 20;
  }
  if (Math.random() < 0.15) pcBuildOffers(c, 1);
  pcSave();
}

function pcIsUserFixture(c, f) {
  const active = pcActiveClub(c);
  return f.match.team1 === active || f.match.team2 === active;
}

function pcSimResult(c, f) {
  const m = f.match;
  if (!m) return;
  if (!m.played) {
    if (f.kind === "cup") simulateMatch(m);
    else simulateGroupMatch(m);
  }
  f.played = true;
}

function pcSimSiblings(c, f) {
  for (const g of c.fixtures) {
    if (g === f || g.played || !pcValidFixture(g)) continue;
    if (g.day !== f.day) continue;
    if (pcIsUserFixture(c, g)) continue;
    pcSimResult(c, g);
  }
}

function pcSimPast(c, untilDay) {
  let guard = 0;
  while (guard++ < 400) {
    const next = pcNextAnyFixture(c);
    if (!next || next.day > untilDay) break;
    if (pcIsUserFixture(c, next)) break;
    pcSimResult(c, next);
    pcSimSiblings(c, next);
    pcFillCupNext(c);
  }
}

function pcAdvanceDays(c, n) {
  n = Math.max(0, Math.round(pcNum(n, 0)));
  if (!n) return;
  if (c.injury && c.injury.days > 0) {
    c.injury.days -= n;
    if (c.injury.days <= 0) {
      c.injury = null;
      if (typeof ccNews === "function") ccNews(c, "praise", {});
    }
  }
}

function pcSimTo(c, targetDay) {
  if (!c) return;
  targetDay = pcCl(targetDay, c.calDay, CC_CAL_END_DAY);
  if (targetDay <= c.calDay) return;
  pcSimPast(c, targetDay);
  const uf = pcNextUserFixture(c);
  const stop = uf && uf.day < targetDay ? uf.day : targetDay;
  pcAdvanceDays(c, stop - c.calDay);
  c.calDay = stop;
  if (typeof ccWorldNewsBatch === "function" && Math.random() < 0.35) ccWorldNewsBatch(c, 1);
  pcSave();
}

function pcBuildResult(c, f, userGoals, oppGoals, proGoals, proAssists, rating) {
  const opp = pcFixtureOpponent(c, f);
  const result = userGoals > oppGoals ? "w" : userGoals < oppGoals ? "l" : "d";
  return {
    opp: opp,
    kind: f.kind,
    gf: userGoals,
    ga: oppGoals,
    result: result,
    win: result === "w",
    rating: rating,
    minutes: 90,
    goals: proGoals,
    assists: proAssists,
    proGoals: proGoals,
    proAssists: proAssists,
    motm: rating >= 8.8
  };
}

function pcSuspended(c) {
  return !!(c && pcNum(c.susp, 0) > 0);
}

function pcServeSuspension(c) {
  if (pcSuspended(c)) c.susp = Math.max(0, pcNum(c.susp, 0) - 1);
}

function pcQuickSim() {
  const c = pcState;
  if (!c) return;
  if (typeof matchRunning !== "undefined" && matchRunning) return;
  pcTickerStop();
  const f = pcNextUserFixture(c);
  if (!f || f.day > c.calDay) { pcShowHub(); return; }
  const active = pcActiveClub(c);
  const opp = pcFixtureOpponent(c, f);
  const suspended = pcSuspended(c);
  const injured = !!(c.injury && c.injury.days > 0);
  const unavailable = injured || suspended;
  const boost = (pcProOvr(c) - 70) * 0.05;
  let gf = poisson(Math.max(0.2, expectedGoals(active, opp) + boost));
  let ga = poisson(Math.max(0.2, expectedGoals(opp, active) - boost * 0.5));
  const m = f.match;
  let pens = null;
  let userWon = gf > ga;
  if (gf === ga && f.kind === "cup") {
    userWon = Math.random() < 0.52 + boost * 0.4;
    pens = userWon ? { user: 4, opp: 3 } : { user: 3, opp: 4 };
    gf += pens.user > pens.opp ? 1 : 0;
    ga += pens.opp > pens.user ? 1 : 0;
    userWon = gf > ga;
  }
  if (m.team1 === active) { m.score1 = gf; m.score2 = ga; }
  else { m.score1 = ga; m.score2 = gf; }
  if (pens) {
    if (m.team1 === active) { m.pens1 = pens.user; m.pens2 = pens.opp; }
    else { m.pens1 = pens.opp; m.pens2 = pens.user; }
    m.decidedBy = "penalties";
  }
  m.winner = f.kind === "league" && gf === ga ? null : (userWon ? active : opp);
  m.played = true;
  f.played = true;
  pcSimSiblings(c, f);
  pcFillCupNext(c);
  let pg = 0, pa = 0;
  const ovr = pcProOvr(c);
  if (!unavailable) {
    for (let i = 0; i < gf; i++) if (Math.random() < 0.42 + (ovr - 65) * 0.012) pg++;
    if (pg > 3) pg = 3;
    if (Math.random() < 0.3 + (ovr - 65) * 0.01) pa = Math.min(2, Math.max(0, gf - pg));
  }
  const result = gf > ga ? "w" : gf < ga ? "l" : "d";
  let rating = 6.2 + (result === "w" ? 0.7 : result === "d" ? 0.1 : -0.4) + pg * 0.8 + pa * 0.5 + (Math.random() * 0.8 - 0.4);
  rating = Math.round(pcCl(rating, 4.5, 9.7) * 10) / 10;
  const r = pcBuildResult(c, f, gf, ga, pg, pa, rating);
  r.minutes = unavailable ? 0 : 90;
  const trophy = pcTrophyFor(c, f, userWon);
  if (trophy) r.trophy = trophy;
  pcApplyResult(c, r);
  if (suspended) pcServeSuspension(c);
  pcSave();
  const scoreLine = active + " " + gf + " \u2014 " + ga + " " + opp + (pens ? " (" + Math.min(pens.user, pens.opp) + "-" + Math.max(pens.user, pens.opp) + " pens)" : "");
  let resultText;
  if (result === "w") resultText = active + " beat " + opp + " " + gf + "-" + ga + "! " + (pg ? c.name + " scored " + pg + "." : "");
  else if (result === "l") resultText = active + " lost to " + opp + " " + ga + "-" + gf + ". " + (unavailable ? "You watched from the stands." : "Work to do.");
  else resultText = active + " drew " + gf + "-" + ga + " with " + opp + ".";
  if (suspended) resultText += " You served a one-match suspension.";
  if (trophy) resultText = "TROPHY! " + active + " won the " + trophy + ", beating " + opp + " in the final!";
  showEndScreen(resultText, scoreLine, function () { pcShowHub(); }, { blue: active, red: opp }, trophy);
}

function pcPlayNext() {
  const c = pcState;
  if (!c) return;
  if (typeof matchRunning !== "undefined" && (matchRunning || (typeof awaitingStart !== "undefined" && awaitingStart))) return;
  pcTickerStop();
  const f = pcNextUserFixture(c);
  if (!f || f.day > c.calDay) { pcShowHub(); return; }
  if (pcSuspended(c)) { pcQuickSim(); return; }
  if (c.injury && c.injury.days > 0) { pcShowHub(); return; }
  const active = pcActiveClub(c);
  selectedTeam = active;
  playerName = c.name;
  pcContext = { opponent: pcFixtureOpponent(c, f), fixture: f };
  pcLive = { goals: 0, assists: 0 };
  pcMidMatch = false;
  const cs = document.getElementById("careerScreen");
  if (cs) cs.style.display = "none";
  const br = document.getElementById("bracketScreen");
  if (br) br.style.display = "none";
  const g = document.getElementById("gameScreen");
  if (g) g.style.display = "none";
  if (typeof enterScreen === "function") enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function pcResumeMatch() {
  const cs = document.getElementById("careerScreen");
  if (cs) cs.style.display = "none";
  pcMidMatch = false;
  if (typeof enterScreen === "function") enterScreen("gameScreen", "block");
  matchRunning = true;
  startTimer();
}

function pcOnGoal(scorer, assist) {
  if (!pcState || !pcContext) return;
  const nm = x => (typeof x === "string" ? x : (x && x.name) || "");
  if (nm(scorer) === pcState.name) pcLive.goals = pcNum(pcLive.goals, 0) + 1;
  else if (nm(assist) === pcState.name) pcLive.assists = pcNum(pcLive.assists, 0) + 1;
}

function pcIsGroupMatch() {
  return !!(pcContext && pcContext.fixture && pcContext.fixture.kind === "league");
}

function pcEndMatch() {
  const c = pcState;
  const ctx = pcContext;
  pcContext = null;
  pcMidMatch = false;
  if (!c || !ctx || !ctx.fixture) { if (c) pcShowHub(); return; }
  const f = ctx.fixture;
  const m = f.match;
  const active = pcActiveClub(c);
  const opp = ctx.opponent || pcFixtureOpponent(c, f);
  const userGoals = pcNum(blueScore, 0);
  const oppGoals = pcNum(redScore, 0);
  if (m.team1 === active) { m.score1 = userGoals; m.score2 = oppGoals; }
  else { m.score1 = oppGoals; m.score2 = userGoals; }
  let pensTxt = "";
  let userWon = userGoals > oppGoals;
  if (userGoals === oppGoals && f.kind === "cup") {
    const uw = penaltyWinner === "blue";
    userWon = uw;
    let pu = uw ? 4 : 3;
    let po = uw ? 3 : 4;
    if (typeof penaltyScore !== "undefined" && penaltyScore) {
      pu = uw ? pcNum(penaltyScore.blue, 4) : pcNum(penaltyScore.red, 3);
      po = uw ? pcNum(penaltyScore.red, 3) : pcNum(penaltyScore.blue, 4);
    }
    if (m.team1 === active) { m.pens1 = pu; m.pens2 = po; }
    else { m.pens1 = po; m.pens2 = pu; }
    m.decidedBy = "penalties";
    pensTxt = " (" + pu + "-" + po + " on penalties)";
  }
  m.winner = (userGoals === oppGoals && f.kind === "league") ? null : (userWon ? active : opp);
  m.played = true;
  f.played = true;
  pcSimSiblings(c, f);
  pcFillCupNext(c);
  const goals = pcNum(pcLive.goals, 0);
  const assists = pcNum(pcLive.assists, 0);
  let rating = 6.1 + (userWon ? 0.6 : userGoals === oppGoals ? 0.1 : -0.35) + goals * 0.85 + assists * 0.55 + (Math.random() * 0.7 - 0.3);
  rating = Math.round(pcCl(rating, 4.2, 9.7) * 10) / 10;
  const r = pcBuildResult(c, f, userGoals, oppGoals, goals, assists, rating);
  const trophy = pcTrophyFor(c, f, userWon);
  if (trophy) r.trophy = trophy;
  pcApplyResult(c, r);
  if (c.suspNext) {
    c.susp = Math.max(1, pcNum(c.susp, 0));
    c.suspNext = 0;
  }
  pcSave();
  const scoreLine = active + " " + userGoals + " \u2014 " + oppGoals + " " + opp + pensTxt;
  let resultText;
  if (userGoals > oppGoals) resultText = active + " beat " + opp + " " + userGoals + "-" + oppGoals + "! " + (goals ? c.name + " scored " + goals + (assists ? " and set up " + assists : "") + "." : "");
  else if (userGoals < oppGoals) resultText = active + " lost to " + opp + " " + oppGoals + "-" + userGoals + ". Time to respond.";
  else resultText = active + " drew " + userGoals + "-" + oppGoals + " with " + opp + ".";
  if (trophy) resultText = "TROPHY! " + active + " won the " + trophy + "!";
  showEndScreen(resultText, scoreLine, function () { pcShowHub(); }, { blue: active, red: opp }, trophy);
}

var PC_TABS = [
  ["home", "Home"], ["schedule", "Schedule"], ["comps", "Competitions"], ["news", "News"], ["media", "Media"],
  ["rel", "Relationships"], ["obj", "Objectives"], ["transfers", "Transfers"],
  ["contract", "Contract"], ["loans", "Loans"], ["fitness", "Fitness"], ["career", "Career"]
];

var PC_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var PC_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pcAttr(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function pcBlock(t, b, i) { return (typeof cpBlock === "function") ? cpBlock(t, b, i) : ""; }
function pcRow(l, v) { return (typeof cpRow === "function") ? cpRow(l, v) : ""; }
function pcMeter(l, v, m, o) { return (typeof cpMeter === "function") ? cpMeter(l, v, m, o) : ""; }
function pcEmptyT(t, l) { return (typeof cpEmpty === "function") ? cpEmpty(t, l) : ""; }

function pcHideOtherScreens() {
  const ids = ["gameScreen", "bracketScreen", "managerScreen", "worldCupScreen", "customTournamentScreen", "endScreen"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }
}

function pcDateLabel(c, day) {
  const d = ccCalDate(c, day);
  return PC_DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + PC_MONTHS[d.getUTCMonth()];
}

function pcRoundLabel(round) {
  return round === 4 ? "Final" : round === 3 ? "Semi-final" : round === 2 ? "Quarter-final" : "Round of 16";
}

function startModePlayerCareer() {
  currentMode = "playercareer";
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  const ms = document.getElementById("modeSelectScreen");
  if (ms) ms.style.display = "none";
  const all = pcLoadAll();
  if (all.careers.length) { pcShowPicker(); return; }
  pcState = null;
  pcRenderSetup();
}

/* ---------------------------------------------- FIFA-style club picker --- */

function pcClubInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0] + (parts[2] ? parts[2][0] : "")).toUpperCase();
}

function pcF16AvgRole(arr, role) {
  if (!arr || !arr.length) return 60;
  let s = 0, n = 0;
  for (const p of arr) {
    if (!p) continue;
    s += (typeof calculateOverall === "function") ? pcNum(calculateOverall(p, role), 60) : 60;
    n++;
  }
  return n ? Math.round(s / n) : 60;
}

function pcF16ClubRating(club) {
  if (!club) return null;
  try { pcEnsureClub(club); } catch (e) {}
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
  if (!r) return null;
  const att = pcF16AvgRole(r.attackers, "attacker");
  const mid = pcF16AvgRole(r.midfielders, "midfielder");
  const gk = pcF16AvgRole(r.goalkeeper ? [r.goalkeeper] : [], "goalkeeper");
  const dfs = pcF16AvgRole(r.defenders, "defender");
  const def = Math.round((dfs * 3 + gk) / 4);
  return { att: att, mid: mid, def: def, ovr: Math.round((att + mid + def) / 3) };
}

const PC_LEAGUE_COUNTRY = {
  "Premier League": "England",
  "EFL Championship": "England",
  "EFL League One": "England",
  "La Liga": "Spain",
  "Segunda División": "Spain",
  "Bundesliga": "Germany",
  "2. Bundesliga": "Germany",
  "Serie A": "Italy",
  "Serie B": "Italy",
  "Serie C": "Italy",
  "Ligue 1": "France",
  "Ligue 2": "France"
};

function pcLeagueCountry(lg) {
  if (!lg) return "";
  if (lg.country) return lg.country;
  return PC_LEAGUE_COUNTRY[lg.name] || lg.name;
}

function pcSetupLeagueObj(setup) {
  const leagues = pcCareerLeagues();
  return leagues.find(l => l.name === setup.league) || leagues[0] || null;
}

function pcLeagueClubs(lg) {
  return ((lg && lg.clubs) || []).slice().sort((a, b) => String(a).localeCompare(String(b)));
}

function pcSelClub(setup) {
  const list = pcLeagueClubs(pcSetupLeagueObj(setup));
  if (setup.club && list.indexOf(setup.club) >= 0) return setup.club;
  return list[0] || "";
}

function pcNationsList() {
  const leagues = pcCareerLeagues();
  const out = [];
  for (const l of leagues) {
    const c = pcLeagueCountry(l);
    if (out.indexOf(c) < 0) out.push(c);
  }
  return out;
}

function pcNationStep(setup, dir) {
  const ns = pcNationsList();
  if (ns.length <= 1) return false;
  let i = ns.indexOf(pcLeagueCountry(pcSetupLeagueObj(setup)));
  if (i < 0) i = 0;
  i = (i + (dir >= 0 ? 1 : -1) + ns.length) % ns.length;
  const leagues = pcCareerLeagues();
  const first = leagues.find(l => pcLeagueCountry(l) === ns[i]);
  if (first) setup.league = first.name;
  setup.club = null;
  return true;
}

function pcLeagueStep(setup, dir) {
  const leagues = pcCareerLeagues();
  const nation = pcLeagueCountry(pcSetupLeagueObj(setup));
  const ls = leagues.filter(l => pcLeagueCountry(l) === nation);
  if (ls.length <= 1) return false;
  let i = ls.findIndex(l => l.name === setup.league);
  if (i < 0) i = 0;
  i = (i + (dir >= 0 ? 1 : -1) + ls.length) % ls.length;
  setup.league = ls[i].name;
  setup.club = null;
  return true;
}

function pcClubStep(setup, dir) {
  const list = pcLeagueClubs(pcSetupLeagueObj(setup));
  if (!list.length) return null;
  let i = setup.club ? list.indexOf(setup.club) : 0;
  if (i < 0) i = 0;
  i = (i + (dir >= 0 ? 1 : -1) + list.length) % list.length;
  setup.club = list[i];
  return list[i];
}

function pcSetupNationStep(dir) {
  if (pcNationStep(pcSetup, dir)) { pcSetup.confirmed = null; pcRenderSetup(); }
}

function pcSetupLeagueStep(dir) {
  if (pcLeagueStep(pcSetup, dir)) { pcSetup.confirmed = null; pcRenderSetup(); }
}

function pcSetupClubStep(dir) {
  if (pcClubStep(pcSetup, dir)) { pcSetup.confirmed = null; pcRenderSetup(); }
}

function pcSetupConfirm() {
  const c = pcSelClub(pcSetup);
  if (c) { pcSetup.club = c; pcSetup.confirmed = c; pcRenderSetup(); }
}

function pcF16ShieldSVG(club, lg) {
  const primary = (typeof teamColors !== "undefined" && teamColors && teamColors[club]) ? String(teamColors[club]) : ((lg && lg.color) ? String(lg.color) : "#27406B");
  const nm = String(club).slice(0, 12).toUpperCase();
  const lgShort = lg && lg.short ? String(lg.short) : "";
  return '<svg class="f16Shield" viewBox="0 0 150 170" role="img" aria-label="' + pcEsc(club) + ' crest">' +
    '<path d="M15 12 L135 12 L129 103 Q120 139 75 159 Q30 139 21 103 Z" fill="' + pcEsc(primary) + '" stroke="#ffffff" stroke-width="3"/>' +
    '<path d="M24 21 L126 21 L121 101 Q112 132 75 150 Q38 132 29 101 Z" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.55"/>' +
    '<path d="M39 32 H111 V90 H39 Z" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.75"/>' +
    '<text x="75" y="63" text-anchor="middle" font-size="14" font-weight="900" fill="#ffffff">' + pcEsc(pcClubInitials(club)) + '</text>' +
    '<text x="75" y="87" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff">' + pcEsc(nm) + '</text>' +
    '<path d="M49 105 L75 91 L101 105 L75 126 Z" fill="#ffffff" stroke="' + pcEsc(primary) + '" stroke-width="1.5"/>' +
    '<circle cx="75" cy="108" r="7" fill="' + pcEsc(primary) + '" stroke="#ffffff" stroke-width="1.5"/>' +
    '<text x="75" y="143" text-anchor="middle" font-size="9" font-weight="900" fill="#ffffff">' + pcEsc(lgShort) + '</text>' +
    '</svg>';
}

function pcF16SelectorHTML(setup, fns, statusId) {
  const leagues = pcCareerLeagues();
  if (!setup.league && leagues.length) setup.league = leagues[0].name;
  const lg = pcSetupLeagueObj(setup);
  const nation = pcLeagueCountry(lg);
  const nat = (typeof WC_NATION_BY_NAME !== "undefined" && WC_NATION_BY_NAME && WC_NATION_BY_NAME[nation]) ? WC_NATION_BY_NAME[nation] : null;
  const code = nat && nat.code ? nat.code : (lg && lg.short ? lg.short : "");
  const nLeagues = leagues.filter(l => pcLeagueCountry(l) === nation).length;
  const lgTier = Math.round(Number(lg && lg.tier) || 1);
  const leagueDesc = nLeagues > 1 ? "Tier " + lgTier + " of " + nLeagues : "Select league";
  const list = pcLeagueClubs(lg);
  const club = pcSelClub(setup);
  const idx = club ? list.indexOf(club) + 1 : 0;
  const rt = club ? pcF16ClubRating(club) : null;
  const confirmed = !!(club && setup.confirmed === club);
  const starsN = rt ? Math.max(1, Math.min(5, Math.round(pcNum(rt.ovr, 60) / 20))) : 0;
  const dis = nLeagues <= 1 ? " disabled" : "";
  const status = confirmed
    ? "Selected: " + club + " \u2014 " + nation + ", " + (lg ? lg.name : "") + "."
    : nation + "  /  " + (lg ? lg.name : "") + "  /  " + club;
  return '<div class="f16Layout">' +
    '<div class="f16Col">' +
    '<section class="f16PBox"><div class="f16PHead"><h2>Nation</h2><span class="f16PStep">01 / 03</span></div>' +
    '<div class="f16ArrowRow">' +
    '<button type="button" class="f16ArrowBtn" onclick="' + fns.nation + '(-1)" title="Previous nation">&lsaquo;</button>' +
    '<div class="f16ArrowCtr"><div class="f16NationCode">' + pcEsc(code) + '</div>' +
    '<div class="f16SelName">' + pcEsc(nation) + '</div>' +
    '<div class="f16SelDesc">Select nation</div></div>' +
    '<button type="button" class="f16ArrowBtn" onclick="' + fns.nation + '(1)" title="Next nation">&rsaquo;</button>' +
    '</div></section>' +
    '<section class="f16PBox"><div class="f16PHead"><h2>League</h2><span class="f16PStep">02 / 03</span></div>' +
    '<div class="f16ArrowRow">' +
    '<button type="button" class="f16ArrowBtn" onclick="' + fns.league + '(-1)" title="Previous league"' + dis + '>&lsaquo;</button>' +
    '<div class="f16ArrowCtr"><div class="f16LeagueCircle">' + pcEsc(lg && lg.short ? lg.short : "") + '</div>' +
    '<div class="f16SelName">' + pcEsc(lg ? lg.name : "") + '</div>' +
    '<div class="f16SelDesc">' + pcEsc(leagueDesc) + '</div></div>' +
    '<button type="button" class="f16ArrowBtn" onclick="' + fns.league + '(1)" title="Next league"' + dis + '>&rsaquo;</button>' +
    '</div></section>' +
    '</div>' +
    '<section class="f16PBox f16TeamPanel"><div class="f16PHead"><h2>Club Selection</h2><span class="f16PStep">03 / 03</span></div>' +
    '<div class="f16TeamDisplay">' +
    '<div class="f16ShieldWrap">' + (club ? pcF16ShieldSVG(club, lg) : "") + '</div>' +
    '<div class="f16TeamName">' + pcEsc(club) + '</div>' +
    '<div class="f16TeamMeta">' + pcEsc(nation + " \u00b7 " + (lg ? lg.name : "")) + '</div>' +
    '<div class="f16ArrowRow f16TeamNav">' +
    '<button type="button" class="f16ArrowBtn" onclick="' + fns.club + '(-1)" title="Previous club">&lsaquo;</button>' +
    '<div class="f16ArrowCtr"><div class="f16SelName">Choose Club</div>' +
    '<div class="f16TeamCount">TEAM ' + idx + ' / ' + list.length + '</div></div>' +
    '<button type="button" class="f16ArrowBtn" onclick="' + fns.club + '(1)" title="Next club">&rsaquo;</button>' +
    '</div>' +
    '<div class="f16RateGrid">' +
    '<div class="f16Rate"><div class="f16RateVal">' + (rt ? rt.att : "-") + '</div><div class="f16RateLabel">ATTACK</div></div>' +
    '<div class="f16Rate"><div class="f16RateVal">' + (rt ? rt.mid : "-") + '</div><div class="f16RateLabel">MIDFIELD</div></div>' +
    '<div class="f16Rate"><div class="f16RateVal">' + (rt ? rt.def : "-") + '</div><div class="f16RateLabel">DEFENCE</div></div>' +
    '</div>' +
    '<div class="f16Stars">' + "&#9733;".repeat(starsN) + "&#9734;".repeat(5 - starsN) + '</div>' +
    '<button type="button" class="f16Confirm" onclick="' + fns.confirm + '()">' + (confirmed ? "CLUB SELECTED &#10003;" : "CONFIRM CLUB") + '</button>' +
    '</div></section>' +
    '</div>' +
    '<div class="f16Status" id="' + pcAttr(statusId) + '">' + pcEsc(status) + '</div>';
}

function pcRenderSetup() {
  const body = document.getElementById("pcBody");
  if (!body) return;
  pcHideOtherScreens();
  const title = document.getElementById("pcTitle");
  if (title) title.textContent = "Player Career";
  const sub = document.getElementById("pcSubtitle");
  if (sub) sub.textContent = "Build a story from prospect to superstar.";
  const nameEl = document.getElementById("pcNameInput");
  if (nameEl) pcSetup.name = nameEl.value;
  if (pcSetup.mode !== "existing") pcSetup.mode = "prospect";
  const selector = pcF16SelectorHTML(pcSetup, {
    nation: "pcSetupNationStep",
    league: "pcSetupLeagueStep",
    club: "pcSetupClubStep",
    confirm: "pcSetupConfirm"
  }, "pcSetupStatus");
  const modeBtns =
    '<button class="wcNationBtn' + (pcSetup.mode === "prospect" ? " sel" : "") + '" onclick="pcSetupMode(\'prospect\')">' +
    '<span class="wcNationCode">RP</span><span class="wcNationName">Rising Prospect</span>' +
    '<span class="pcHint" style="display:block;width:100%">A raw teenager with low stats. Earn every step.</span></button>' +
    '<button class="wcNationBtn' + (pcSetup.mode === "existing" ? " sel" : "") + '" onclick="pcSetupMode(\'existing\')">' +
    '<span class="wcNationCode">EP</span><span class="wcNationName">Existing Player</span>' +
    '<span class="pcHint" style="display:block;width:100%">Play as a squad player, including your custom Team Editor players.</span></button>';
  const posBtns = PC_POSITIONS.map(p =>
    '<button class="wcNationBtn' + (p.key === pcSetup.pos ? " sel" : "") + '" onclick="pcSetupPos(\'' + p.key + '\')">' +
    '<span class="wcNationCode">' + pcEsc(p.key.charAt(0).toUpperCase()) + '</span>' +
    '<span class="wcNationName">' + pcEsc(p.label) + '</span>' +
    '<span class="pcHint" style="display:block;width:100%">' + pcEsc(p.blurb) + '</span></button>').join("");
  const traitBtns = PC_TRAIT_CHOICES.map(t =>
    '<button class="wcNationBtn' + (t.key === pcSetup.trait ? " sel" : "") + '" onclick="pcSetupTrait(\'' + t.key + '\')">' +
    '<span class="wcNationCode">' + pcEsc(t.label.charAt(0)) + '</span>' +
    '<span class="wcNationName">' + pcEsc(t.label) + '</span>' +
    '<span class="pcHint" style="display:block;width:100%">' + pcEsc(t.blurb) + '</span></button>').join("");
  let prospectHTML = "";
  let existingHTML = "";
  if (pcSetup.mode === "existing") {
    const club = pcSelClub(pcSetup);
    const eps = pcExistingSlots(club);
    if (!pcSetup.epSlot || !eps.some(x => x.key === pcSetup.epSlot)) pcSetup.epSlot = eps.length ? eps[0].key : null;
    const opts = eps.map(x =>
      '<option value="' + pcEsc(x.key) + '"' + (x.key === pcSetup.epSlot ? " selected" : "") + '>' +
      pcEsc(x.name) + ' - ' + pcEsc(pcRoleLabel(x.role)) + ' (' + x.ovr + ')</option>').join("");
    const cur = eps.find(x => x.key === pcSetup.epSlot);
    existingHTML =
      '<div class="wcNationHead">Your player</div>' +
      '<div class="wcSetupName"><label for="pcExistingPlayer">EXISTING PLAYER</label>' +
      '<select id="pcExistingPlayer" class="pcSetupSelect" onchange="pcSetupExistingPick(this.value)">' +
      (opts || '<option value="">No players at this club</option>') + '</select></div>' +
      '<div class="pcHint" style="margin:2px 0 10px">' +
      (cur ? pcEsc(cur.name) + ' \u00b7 ' + pcEsc(pcRoleLabel(cur.role)) + ' \u00b7 OVR ' + cur.ovr : 'Pick a club with a squad.') +
      '. Create custom players in the Team Editor first.</div>';
  } else {
    prospectHTML =
      '<div class="wcSetupName"><label for="pcNameInput">YOUR NAME</label>' +
      '<input id="pcNameInput" type="text" maxlength="16" placeholder="Enter your name..." value="' + pcAttr(pcSetup.name || "") + '"></div>';
  }
  body.innerHTML =
    '<div class="wcSetup">' +
    '<div class="wcNationHead">Start as</div><div class="wcNationGrid">' + modeBtns + '</div>' +
    prospectHTML +
    selector +
    existingHTML +
    (pcSetup.mode === "existing" ? "" :
      '<div class="wcNationHead">Your position</div><div class="wcNationGrid">' + posBtns + '</div>' +
      '<div class="wcNationHead">Your personality</div><div class="wcNationGrid">' + traitBtns + '</div>') +
    '<div class="wcSetupMsg" id="pcSetupMsg"></div>' +
    '<div class="wcSetupActions">' +
    '<button class="wcPrimaryBtn" onclick="pcBeginFromSetup()">Start Career</button>' +
    '<button class="wcGhostBtn" onclick="pcQuitToMenu()">Back</button>' +
    '</div></div>';
  if (typeof enterScreen === "function") enterScreen("careerScreen", "block");
  else document.getElementById("careerScreen").style.display = "block";
}

function pcSetupMode(mode) {
  pcSetup.mode = mode === "existing" ? "existing" : "prospect";
  pcRenderSetup();
}

function pcSetupExistingPick(key) {
  pcSetup.epSlot = key;
  pcRenderSetup();
}

function pcSetupLeague(name) {
  pcSetup.league = name;
  pcSetup.club = null;
  pcSetup.confirmed = null;
  pcRenderSetup();
}

function pcSetupClub(club) {
  pcSetup.club = club;
  pcSetup.confirmed = null;
  pcRenderSetup();
}

function pcSetupPos(key) {
  pcSetup.pos = key;
  pcRenderSetup();
}

function pcSetupTrait(key) {
  pcSetup.trait = key;
  pcRenderSetup();
}

function pcBeginFromSetup() {
  const msg = document.getElementById("pcSetupMsg");
  if (!pcSetup.club) pcSetup.club = pcSelClub(pcSetup);
  if (!pcSetup.club) { if (msg) msg.textContent = "Pick a club first."; return; }
  if (pcSetup.mode === "existing") {
    const eps = pcExistingSlots(pcSetup.club);
    if (!eps.length) { if (msg) msg.textContent = "That club has no players to pick."; return; }
    if (!pcSetup.epSlot || !eps.some(x => x.key === pcSetup.epSlot)) pcSetup.epSlot = eps[0].key;
    const c = pcNewCareerAsExisting(pcSetup.club, pcSetup.epSlot);
    if (!c) { if (msg) msg.textContent = "Could not load that player. Try another club."; return; }
    pcSave();
    pcShowHub();
    return;
  }
  const nameEl = document.getElementById("pcNameInput");
  const name = nameEl ? nameEl.value.trim() : "";
  if (!pcSetup.pos) { if (msg) msg.textContent = "Pick your position first."; return; }
  if (!pcSetup.trait) { if (msg) msg.textContent = "Pick a personality first."; return; }
  pcNewCareer(name || "YOU", pcSetup.club, pcSetup.pos, pcSetup.trait);
  pcSave();
  pcShowHub();
}

function pcSetTab(tab) {
  pcTab = tab;
  pcSimPreview = false;
  pcShowHub();
}

function pcTabHeaderHTML(c) {
  const unread = (typeof ccUnread === "function") ? ccUnread(c) : 0;
  return '<div class="pcTabs">' +
    PC_TABS.map(t => '<button class="pcTab' + (pcTab === t[0] ? " on" : "") + '" onclick="pcSetTab(\'' + t[0] + '\')">' + t[1] + "</button>").join("") +
    '</div><div class="mcHeader">' +
    '<span class="mcChip">Season ' + pcNum(c.season, 1) + "</span>" +
    '<span class="mcChip">' + pcEsc(pcDateLabel(c, c.calDay)) + "</span>" +
    '<span class="mcChip">OVR ' + pcProOvr(c) + "</span>" +
    '<span class="mcChip">Rep ' + Math.round(pcNum(c.rep, 0)) + "</span>" +
    (unread ? '<span class="mcChip">News ' + unread + "</span>" : "") +
    "</div>";
}

function pcTabBodyHTML(c, tab) {
  if (tab === "home") return pcHomeHTML(c);
  if (tab === "schedule") return pcScheduleHTML(c);
  if (tab === "comps") return pcCompetitionsHTML(c);
  if (tab === "news" && typeof pcHubNewsHTML === "function") return pcHubNewsHTML(c);
  if (tab === "media" && typeof pcHubMediaHTML === "function") return pcHubMediaHTML(c);
  if (tab === "rel" && typeof pcHubRelHTML === "function") return pcHubRelHTML(c);
  if (tab === "obj" && typeof pcHubObjHTML === "function") return pcHubObjHTML(c);
  if (tab === "transfers" && typeof pcHubTransferHTML === "function") return pcHubTransferHTML(c);
  if (tab === "contract" && typeof pcHubContractHTML === "function") return pcHubContractHTML(c);
  if (tab === "loans" && typeof pcHubLoansHTML === "function") return pcHubLoansHTML(c);
  if (tab === "fitness" && typeof pcHubFitnessHTML === "function") return pcHubFitnessHTML(c);
  if (tab === "career") return pcHubCareerHTML(c);
  return pcHomeHTML(c);
}

function pcHubCareerHTML(c) {
  const all = pcLoadAll();
  const rows = all.careers.map(x => {
    const active = pcState && x.id === pcState.id;
    return '<div class="pcLine"><span>' + pcEsc((x.name || "Pro") + " \u2014 " + (x.club || "No club")) +
      " \u00b7 S" + pcNum(x.season, 1) + (active ? " \u00b7 active" : "") + "</span><b>" +
      (active ? "" : '<button class="pcMini wcGhostBtn" onclick="pcResumeCareer(\'' + pcAttr(x.id) + '\')">Open</button> ') +
      '<button class="pcMini wcGhostBtn" onclick="pcDeleteCareerAsk(\'' + pcAttr(x.id) + '\')">Delete</button>' +
      "</b></div>";
  }).join("");
  const meta = pcBlock("This career", "Season " + pcNum(c.season, 1),
  pcRow("Player", c.name || "YOU") +
  pcRow("Club", pcActiveClub(c)) +
  pcRow("League", c.league) +
  pcRow("Trophies", pcNum(c.trophies, 0)) +
  pcRow("Saved careers", all.careers.length));
  return meta +
    pcBlock("Saved careers", all.careers.length + (all.careers.length === 1 ? " career" : " careers"), rows || '<div class="pcHint">No saved careers.</div>') +
    pcBlock("Actions", "",
      '<div class="pcLine"><span>Start a new career (keeps this one saved)</span><b><button class="pcMini wcGhostBtn" onclick="pcNewCareerFromPicker()">New Career</button></b></div>' +
      '<div class="pcLine"><span>Leave and keep this career</span><b><button class="pcMini wcGhostBtn" onclick="pcQuitToMenu()">Quit to Menu</button></b></div>' +
      '<div class="pcLine"><span>Delete this career permanently</span><b><button class="pcMini wcGhostBtn" onclick="pcDeleteCareerAsk(\'' + pcAttr(c.id) + '\')">Delete</button></b></div>');
}

function pcNextLine(c) {
  const uf = pcNextUserFixture(c);
  if (!uf) return "Season complete.";
  const opp = pcFixtureOpponent(c, uf);
  const comp = uf.kind === "cup" ? c.cupName + " \u00b7 " + pcRoundLabel(uf.round) : c.league + " \u00b7 Matchday " + uf.round;
  if (uf.day <= c.calDay) return "Next: " + (uf.match.team1 === pcActiveClub(c) ? "vs " : "at ") + opp + " \u00b7 " + comp;
  return "Next: " + (uf.match.team1 === pcActiveClub(c) ? "vs " : "at ") + opp + " in " + (uf.day - c.calDay) + " days \u00b7 " + comp;
}

function pcTableHTML(c) {
  const table = pcTable(c);
  const active = pcActiveClub(c);
  if (!table.length) return pcEmptyT("Table", "No league results yet.");
  const rows = table.map((row, i) =>
    '<tr class="' + (row.team === active ? "playerRow" : "") + '">' +
    '<td class="rank">' + (i + 1) + "</td>" +
    '<td class="team">' + pcEsc(row.team) + "</td>" +
    '<td class="gd">' + (row.gd > 0 ? "+" : "") + pcNum(row.gd, 0) + "</td>" +
    '<td class="pts">' + pcNum(row.points, 0) + "</td></tr>").join("");
  return pcBlock(c.league, pcRankOf(c, active) + ". " + active,
    '<div class="match tableCard"><table class="leagueTable">' +
    "<thead><tr><th>#</th><th>Club</th><th>GD</th><th>Pts</th></tr>" +
    "<tbody>" + rows + "</tbody></table></div>");
}

/* --------------------------------------------- competitions browser ---- */

function pcCompOvr(club) {
  try {
    const r = pcF16ClubRating(club);
    if (r && typeof r.ovr === "number") return r.ovr;
  } catch (e) {}
  if (typeof getTeamStrength === "function") {
    try { return Math.round(pcNum(getTeamStrength(club), 0)); } catch (e) {}
  }
  return "-";
}

function pcCompTableHTML(rows, active) {
  if (!rows || !rows.length) return pcEmptyT("Standings", "No results yet.");
  const body = rows.map(function (row, i) {
    return '<tr class="' + (active && row.team === active ? "playerRow" : "") + '">' +
      '<td class="rank">' + (i + 1) + "</td>" +
      '<td class="team">' + pcEsc(row.team) + "</td>" +
      '<td class="gd">' + pcCompOvr(row.team) + "</td>" +
      "<td>" + pcNum(row.played, 0) + "</td>" +
      "<td>" + pcNum(row.w, 0) + "</td>" +
      "<td>" + pcNum(row.d, 0) + "</td>" +
      "<td>" + pcNum(row.l, 0) + "</td>" +
      "<td>" + pcNum(row.gf, 0) + "</td>" +
      "<td>" + pcNum(row.ga, 0) + "</td>" +
      '<td class="gd">' + (pcNum(row.gd, 0) > 0 ? "+" : "") + pcNum(row.gd, 0) + "</td>" +
      '<td class="pts">' + pcNum(row.points, 0) + "</td></tr>";
  }).join("");
  return '<div class="match tableCard"><table class="leagueTable">' +
    "<thead><tr><th>#</th><th>Club</th><th>OVR</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>" +
    "<tbody>" + body + "</tbody></table></div>";
}

function pcCompZeroRows(clubs) {
  return (clubs || []).map(function (t) {
    return { team: t, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  });
}

/* Projected standings for a league the career is not playing: same ranking the
   promotion/relegation code uses, scaled down to the career's current matchday
   so every league in the game shows the same number of games played. W/D/L,
   goals and points all derive from that record so the table reads like a real
   one at this point of the season. */
function pcPseudoDisplayRows(lg, round) {
  const rows = pcPseudoLeagueTable(lg);
  const md = Math.max(0, pcNum(round, 0));
  const out = rows.map(function (row, idx) {
    const fullTotal = pcNum(row.played, 0);
    const denom = Math.max(1, fullTotal);
    const total = Math.max(0, Math.min(md, fullTotal));
    const fullPts = pcNum(row.points, 0);
    const targetDraws = 2 + ((idx * 7) % 6);
    let fw = Math.round((fullPts - targetDraws) / 3);
    if (fw < 0) fw = 0;
    if (fw > fullTotal) fw = fullTotal;
    let fd = fullPts - 3 * fw;
    if (fd < 0) { fw = Math.min(Math.floor(fullPts / 3), fullTotal); fd = fullPts - 3 * fw; }
    let fl = fullTotal - fw - fd;
    if (fl < 0) {
      fw = Math.min(fw, fullTotal);
      fd = Math.min(Math.max(fd, 0), fullTotal - fw);
      fl = fullTotal - fw - fd;
    }
    const k = total / denom;
    let w = Math.round(fw * k);
    let d = Math.round(fd * k);
    if (w > total) w = total;
    if (w + d > total) d = total - w;
    const l = total - w - d;
    const gf = Math.round(pcNum(row.gf, 0) * k);
    const ga = Math.round(pcNum(row.ga, 0) * k);
    return { team: row.team, points: 3 * w + d, gf: gf, ga: ga, gd: gf - ga, played: total, w: w, d: d, l: l };
  });
  out.sort(function (a, b) {
    return b.points - a.points || b.gd - a.gd || b.gf - a.gf || String(a.team).localeCompare(String(b.team));
  });
  return out;
}

function pcCompCupText(c) {
  const cup = pcCupResult(c);
  if (cup.status === "won") return "Winners";
  if (cup.status === "final") return "Runner-up";
  if (cup.status === "out") return "Out in the " + pcRoundLabel(cup.round);
  if (cup.status === "alive") return "Still in the competition";
  return "Not entered";
}

function pcCompCupPathHTML(c) {
  const active = pcActiveClub(c);
  const ties = (c.fixtures || []).filter(function (f) {
    return f.kind === "cup" && pcValidFixture(f) && (f.match.team1 === active || f.match.team2 === active);
  });
  if (!ties.length) return '<div class="pcHint">No cup ties to show yet.</div>';
  return ties.map(function (f) {
    const opp = f.match.team1 === active ? f.match.team2 : f.match.team1;
    const home = f.match.team1 === active;
    let line;
    if (f.played) {
      const gf = pcNum(home ? f.match.score1 : f.match.score2, 0);
      const ga = pcNum(home ? f.match.score2 : f.match.score1, 0);
      const dec = f.match.winner ? (f.match.winner === active ? " \u00b7 won" : " \u00b7 lost") : " \u00b7 drew";
      line = gf + "-" + ga + dec + " vs " + opp;
    } else {
      line = (home ? "vs " : "at ") + opp + " \u00b7 " + pcDateLabel(c, pcNum(f.day, 1));
    }
    return pcRow(pcRoundLabel(f.round), line);
  }).join("");
}

var PC_COMP_WORLD = "World";

var PC_WORLD_COMPS = [
  { key: "ucl", name: "UEFA Champions League", short: "UCL", color: "#1E4FBF", desc: "Europe's premier cup",
    stats: [["8", "MATCHES"], ["1", "TROPHY"], ["1", "SEASON"]], stars: 5,
    rows: [["Format", "8-match league phase in career"], ["Window", "September → May"], ["Play it in", "Player Career \u00b7 Manager Career \u00b7 My Club"]] },
  { key: "uel", name: "UEFA Europa League", short: "UEL", color: "#E36B1F", desc: "Second-tier Europe",
    stats: [["8", "MATCHES"], ["1", "TROPHY"], ["1", "SEASON"]], stars: 4,
    rows: [["Format", "8-match league phase in career"], ["Window", "August → May"], ["Play it in", "Player Career \u00b7 Manager Career \u00b7 My Club"]] },
  { key: "uecl", name: "UEFA Conference League", short: "UECL", color: "#1B8A6B", desc: "Third-tier Europe",
    stats: [["8", "MATCHES"], ["1", "TROPHY"], ["1", "SEASON"]], stars: 3,
    rows: [["Format", "8-match league phase in career"], ["Window", "August → May"], ["Play it in", "Player Career \u00b7 Manager Career \u00b7 My Club"]] },
  { key: "supercups", name: "Domestic Super Cup", short: "SCP", color: "#B08D2E", desc: "The season opener at home",
    stats: [["2", "TEAMS"], ["1", "MATCH"], ["1", "TROPHY"]], stars: 3,
    rows: [["Format", "One-off match"], ["Window", "August (before the league)"], ["Play it in", "Player Career \u00b7 Manager Career \u00b7 My Club"]] },
  { key: "usupercup", name: "UEFA Super Cup", short: "USC", color: "#2E5FA3", desc: "European season opener",
    stats: [["2", "TEAMS"], ["1", "MATCH"], ["1", "TROPHY"]], stars: 4,
    rows: [["Format", "One-off match, August 5"], ["Play it in", "Player Career \u00b7 Manager Career \u00b7 My Club"]] },
  { key: "cwc", name: "FIFA Club World Cup", short: "CWC", color: "#0B7A4B", desc: "Champions of every continent",
    stats: [["4", "YEARLY"], ["1", "MATCH"], ["1", "TROPHY"]], stars: 4,
    rows: [["Format", "One-off match"], ["Window", "Late May, every 4th season"], ["Play it in", "Player Career \u00b7 Manager Career \u00b7 My Club"]] },
  { key: "wc", name: "FIFA World Cup", short: "WC", color: "#1D6FB8", desc: "48 nations, 12 groups",
    stats: [["48", "NATIONS"], ["12", "GROUPS"], ["1", "TROPHY"]], stars: 5,
    rows: [["Format", "Group stage, then knockout bracket"], ["Play it in", "World Cup mode"]] },
  { key: "custom", name: "Custom Tournament", short: "CT", color: "#7A5CB8", desc: "Build it yourself",
    stats: [["3", "FORMATS"], ["32", "TEAMS MAX"], ["1", "WINNER"]], stars: 0,
    rows: [["Format", "Round-robin, groups or knockout - your rules"], ["Play it in", "Custom Tournament mode"]] }
];

function pcCompNationsList() {
  const ns = pcNationsList();
  if (ns.indexOf(PC_COMP_WORLD) < 0) ns.push(PC_COMP_WORLD);
  return ns;
}

function pcCompOptions(nation) {
  if (nation === PC_COMP_WORLD) return PC_WORLD_COMPS.slice();
  return pcGetLeaguesForCountry(nation);
}

function pcCompFind(sel) {
  if (!sel) return null;
  const opts = pcCompOptions(sel.nation);
  for (const o of opts) if (o.name === sel.comp) return o;
  return opts.length ? opts[0] : null;
}

function pcCompEnsureSel(c) {
  const fid = c && c.id ? String(c.id) : null;
  if (pcCompSel && pcCompSel.forId === fid && pcCompSel.nation && pcCompSel.comp) {
    const opts = pcCompOptions(pcCompSel.nation);
    for (const o of opts) if (o.name === pcCompSel.comp) return pcCompSel;
  }
  const lg = (c && (pcGetLeagueByName(c.league) || pcLeagueOf(pcActiveClub(c)))) || null;
  const nation = lg ? pcLeagueCountry(lg) : (pcCompNationsList()[0] || PC_COMP_WORLD);
  const sel = { forId: fid, nation: nation, comp: lg ? lg.name : null, confirmed: lg ? lg.name : null };
  if (!sel.comp) {
    const opts = pcCompOptions(nation);
    sel.comp = opts.length ? opts[0].name : null;
  }
  pcCompSel = sel;
  return pcCompSel;
}

function pcCompLiveCareer() {
  return (typeof currentMode !== "undefined" && currentMode === "managercareer");
}

function pcCompRerender() {
  if (pcCompLiveCareer()) mcSetTab("comps");
  else pcSetTab("comps");
}

function pcCompFromCareer() {
  const c = pcCompLiveCareer()
    ? ((typeof mcState !== "undefined" && mcState) || null)
    : ((typeof pcState !== "undefined" && pcState) || null);
  if (c) pcCompEnsureSel(c);
  return pcCompSel;
}

function pcCompNationStep(dir) {
  const sel = pcCompFromCareer();
  if (!sel) return;
  const ns = pcCompNationsList();
  if (ns.length <= 1) return;
  let i = ns.indexOf(sel.nation);
  if (i < 0) i = 0;
  i = (i + (dir >= 0 ? 1 : -1) + ns.length) % ns.length;
  sel.nation = ns[i];
  const opts = pcCompOptions(sel.nation);
  sel.comp = opts.length ? opts[0].name : null;
  sel.confirmed = null;
  pcCompRerender();
}

function pcCompLeagueStep(dir) {
  const sel = pcCompFromCareer();
  if (!sel) return;
  const opts = pcCompOptions(sel.nation);
  if (opts.length <= 1) return;
  let idx = -1;
  for (let k = 0; k < opts.length; k++) if (opts[k].name === sel.comp) idx = k;
  if (idx < 0) idx = 0;
  idx = (idx + (dir >= 0 ? 1 : -1) + opts.length) % opts.length;
  sel.comp = opts[idx].name;
  sel.confirmed = null;
  pcCompRerender();
}

function pcCompView() {
  const sel = pcCompFromCareer();
  if (!sel || !sel.comp) return;
  sel.confirmed = sel.comp;
  pcCompRerender();
}

function pcCompAvgOvr(lg) {
  const clubs = (lg && lg.clubs) || [];
  let sum = 0, n = 0;
  for (const t of clubs) {
    const v = pcCompOvr(t);
    if (typeof v === "number" && isFinite(v)) { sum += v; n++; }
  }
  return n ? Math.round(sum / n) : "-";
}

function pcCompSelectorHTML(c, sel) {
  const ns = pcCompNationsList();
  const nation = sel.nation || ns[0] || "";
  const opts = pcCompOptions(nation);
  const comp = pcCompFind(sel);
  if (comp && sel.comp !== comp.name) sel.comp = comp.name;
  const isWorld = nation === PC_COMP_WORLD;
  const nat = (typeof WC_NATION_BY_NAME !== "undefined" && WC_NATION_BY_NAME && WC_NATION_BY_NAME[nation]) ? WC_NATION_BY_NAME[nation] : null;
  const code = isWorld ? "INT" : (nat && nat.code ? nat.code : (comp && comp.short ? comp.short : ""));
  const nOpts = opts.length;
  const compDesc = (!comp || isWorld || nOpts <= 1)
    ? "Select competition"
    : "Tier " + Math.round(Number(comp.tier) || 1) + " of " + nOpts;
  const confirmed = !!(comp && sel.confirmed === comp.name);
  const meta = isWorld ? "International" : nation;
  const ci = comp ? opts.findIndex(o => o.name === comp.name) + 1 : 0;
  let statCells = "";
  if (comp && isWorld) {
    statCells = (comp.stats || []).map(s =>
      '<div class="f16Rate"><div class="f16RateVal">' + pcEsc(s[0]) + '</div><div class="f16RateLabel">' + pcEsc(s[1]) + '</div></div>').join("");
  } else if (comp) {
    const slots = pcNum(comp.clSlots, 0);
    statCells =
      '<div class="f16Rate"><div class="f16RateVal">' + ((comp.clubs || []).length || "-") + '</div><div class="f16RateLabel">CLUBS</div></div>' +
      '<div class="f16Rate"><div class="f16RateVal">' + pcCompAvgOvr(comp) + '</div><div class="f16RateLabel">AVG OVR</div></div>' +
      '<div class="f16Rate"><div class="f16RateVal">' + (slots ? slots : "-") + '</div><div class="f16RateLabel">EURO SLOTS</div></div>';
  }
  const starsN = !comp ? 0 : (isWorld
    ? Math.max(0, Math.min(5, pcNum(comp.stars, 0)))
    : Math.max(1, Math.min(5, 6 - (Math.round(Number(comp.tier) || 1)))));
  const disNation = ns.length <= 1 ? " disabled" : "";
  const disComp = nOpts <= 1 ? " disabled" : "";
  const status = confirmed
    ? "Viewing: " + comp.name + " \u2014 " + meta
    : nation + "  /  " + (comp ? comp.name : "");
  return '<div class="f16Layout">' +
    '<div class="f16Col">' +
    '<section class="f16PBox"><div class="f16PHead"><h2>Nation</h2><span class="f16PStep">01 / 03</span></div>' +
    '<div class="f16ArrowRow">' +
    '<button type="button" class="f16ArrowBtn" onclick="pcCompNationStep(-1)" title="Previous nation"' + disNation + '>&lsaquo;</button>' +
    '<div class="f16ArrowCtr"><div class="f16NationCode">' + pcEsc(code) + '</div>' +
    '<div class="f16SelName">' + pcEsc(nation) + '</div>' +
    '<div class="f16SelDesc">Select nation</div></div>' +
    '<button type="button" class="f16ArrowBtn" onclick="pcCompNationStep(1)" title="Next nation"' + disNation + '>&rsaquo;</button>' +
    '</div></section>' +
    '<section class="f16PBox"><div class="f16PHead"><h2>Competition</h2><span class="f16PStep">02 / 03</span></div>' +
    '<div class="f16ArrowRow">' +
    '<button type="button" class="f16ArrowBtn" onclick="pcCompLeagueStep(-1)" title="Previous competition"' + disComp + '>&lsaquo;</button>' +
    '<div class="f16ArrowCtr"><div class="f16LeagueCircle">' + pcEsc(comp && comp.short ? comp.short : "") + '</div>' +
    '<div class="f16SelName">' + pcEsc(comp ? comp.name : "") + '</div>' +
    '<div class="f16SelDesc">' + pcEsc(compDesc) + '</div></div>' +
    '<button type="button" class="f16ArrowBtn" onclick="pcCompLeagueStep(1)" title="Next competition"' + disComp + '>&rsaquo;</button>' +
    '</div></section>' +
    '</div>' +
    '<section class="f16PBox f16TeamPanel"><div class="f16PHead"><h2>Preview</h2><span class="f16PStep">03 / 03</span></div>' +
    '<div class="f16TeamDisplay">' +
    '<div class="f16ShieldWrap">' + (comp ? pcF16ShieldSVG(comp.name, isWorld ? { short: comp.short, color: comp.color } : comp) : "") + '</div>' +
    '<div class="f16TeamName">' + pcEsc(comp ? comp.name : "") + '</div>' +
    '<div class="f16TeamMeta">' + pcEsc(meta) + '</div>' +
    '<div class="f16ArrowRow f16TeamNav">' +
    '<button type="button" class="f16ArrowBtn" onclick="pcCompLeagueStep(-1)" title="Previous competition"' + disComp + '>&lsaquo;</button>' +
    '<div class="f16ArrowCtr"><div class="f16SelName">Choose Competition</div>' +
    '<div class="f16TeamCount">COMP ' + ci + ' / ' + nOpts + '</div></div>' +
    '<button type="button" class="f16ArrowBtn" onclick="pcCompLeagueStep(1)" title="Next competition"' + disComp + '>&rsaquo;</button>' +
    '</div>' +
    '<div class="f16RateGrid">' + statCells + '</div>' +
    '<div class="f16Stars">' + "&#9733;".repeat(starsN) + "&#9734;".repeat(5 - starsN) + '</div>' +
    '<button type="button" class="f16Confirm" onclick="pcCompView()">' + (confirmed ? "VIEWING &#10003;" : "VIEW COMPETITION") + '</button>' +
    '</div></section>' +
    '</div>' +
    '<div class="f16Status" id="pcCompStatus">' + pcEsc(status) + '</div>';
}

function pcCompDetailHTML(c, sel) {
  if (!sel.confirmed) return pcEmptyT("Competition view", "Press the View competition button to load it here.");
  const comp = pcCompFind(sel);
  if (!comp) return pcEmptyT("Competition view", "No competition selected.");
  if (sel.nation === PC_COMP_WORLD) {
    const rows = (comp.rows || []).map(r => pcRow(r[0], r[1])).join("");
    return pcBlock(comp.name, comp.desc,
      rows + '<div class="pcHint">These run in their own modes - your career plays its league and domestic cup.</div>');
  }
  const active = pcActiveClub(c);
  const tiers = pcGetLeaguesForCountry(sel.nation);
  const isLive = comp.name === c.league;
  const careerTable = pcTable(c);
  let round = 0;
  for (const r of careerTable) round = Math.max(round, pcNum(r.played, 0));
  const table = isLive ? careerTable : [];
  const stand = table.length ? table : (isLive ? pcCompZeroRows(comp.clubs || []) : pcPseudoDisplayRows(comp, round));
  const rank = careerTable.length ? pcRankOf(c, active) : 0;
  let metaRows =
    pcRow("Nation", sel.nation) +
    pcRow("Tier", tiers.length > 1 ? pcNum(comp.tier, 1) + " of " + tiers.length : "1") +
    pcRow("Clubs", String((comp.clubs || []).length || "-")) +
    pcRow("Domestic cup", comp.cup || "-") +
    pcRow("Super cup", comp.super || "-") +
    pcRow("Champions League places", pcNum(comp.clSlots, 0) ? String(pcNum(comp.clSlots, 0)) : "-");
  if (isLive) {
    metaRows += pcRow("Your club", active) +
      pcRow("Your position", careerTable.length ? pcOrdinal(rank) + " of " + careerTable.length : "-") +
      pcRow("Cup status", pcCompCupText(c));
  }
  const metaBlock = pcBlock(comp.name,
    "Tier " + pcNum(comp.tier, 1) + " of " + Math.max(tiers.length, 1) + " \u00b7 " + sel.nation, metaRows);
  const md = round ? "Matchday " + round : "Pre-season";
  const standBlock = pcBlock("Standings",
    (isLive ? "Live standings \u00b7 " : "Projected standings \u00b7 ") + md +
    (isLive ? " \u00b7 " + pcDateLabel(c, pcNum(c.calDay, 1)) : ""),
    pcCompTableHTML(stand, active));
  const cupBlock = isLive ? pcBlock(c.cupName || "Domestic Cup", pcCompCupText(c), pcCompCupPathHTML(c)) : "";
  return metaBlock + standBlock + cupBlock;
}

function pcCompetitionsHTML(c) {
  if (!c) return pcEmptyT("Competitions", "No career loaded.");
  const sel = pcCompEnsureSel(c);
  return pcCompSelectorHTML(c, sel) + pcCompDetailHTML(c, sel);
}

function pcHomeHTML(c) {
  const active = pcActiveClub(c);
  const uf = pcNextUserFixture(c);
  const suspended = pcSuspended(c);
  const injured = !!(c.injury && c.injury.days > 0);
  let nextBlock;
  if (!uf) {
    nextBlock = pcBlock("Next match", "Season complete", '<div class="pcHint">The campaign is over. Head to the Schedule tab for a recap.</div>');
  } else {
    const opp = pcFixtureOpponent(c, uf);
    const due = uf.day <= c.calDay;
    const comp = uf.kind === "cup" ? c.cupName + " \u00b7 " + pcRoundLabel(uf.round) : c.league + " \u00b7 Matchday " + uf.round;
    nextBlock = pcBlock("Next match", due ? "Match day" : "In " + (uf.day - c.calDay) + " days",
      pcRow("Opponent", opp) +
      pcRow("Competition", comp) +
      pcRow("Venue", uf.match.team1 === active ? "Home" : "Away") +
      pcRow("Date", pcDateLabel(c, uf.day)) +
      (due ? pcRow("Status", suspended ? "Suspended \u2014 next match simulated" : injured ? "Injured \u2014 " + c.injury.type : "In the squad") : ""));
  }
  const ss = c.seasonStats || pcEmptyStats();
  const avg = ss.apps ? (ss.ratingSum / ss.apps) : 0;
  const statsBlock = pcBlock("Season " + pcNum(c.season, 1), pcNum(ss.goals, 0) + " goals",
    pcRow("Appearances", pcNum(ss.apps, 0)) +
    pcRow("Goals", pcNum(ss.goals, 0)) +
    pcRow("Assists", pcNum(ss.assists, 0)) +
    pcRow("Average rating", avg ? avg.toFixed(2) : "-") +
    pcRow("Man of the match", pcNum(ss.motm, 0)) +
    pcRow("Wins", pcNum(ss.wins, 0)));
  const statusRows = [];
  if (suspended) statusRows.push(pcRow("Suspension", "1 match (served by simulation)"));
  if (injured) statusRows.push(pcRow("Injury", c.injury.type + " (" + c.injury.days + "d)"));
  if (c.loanActive) statusRows.push(pcRow("On loan at", c.loanActive.club));
  if (c.pendingClub) statusRows.push(pcRow("Agreed to join", c.pendingClub + " next season"));
  statusRows.push(pcRow("Contract", pcNum((c.contract || {}).yearsLeft, 3) + "y left \u00b7 " + pcNum((c.contract || {}).wage, 0) + "/wk"));
  const form = Array.isArray(c.form) ? c.form : [];
  if (form.length) {
    statusRows.push('<div class="pcStatRow"><span class="pcStatName">Form</span><span class="pcFormRow">' +
      form.map(v => '<span class="pcFormPip' + (v >= 7 ? " good" : v < 6 ? " bad" : "") + '">' + pcNum(v, 0).toFixed(1) + "</span>").join("") +
      "</span></div>");
  }
  const statusBlock = pcBlock("Status", suspended ? "Suspended" : injured ? "Injured" : "Available", statusRows.join(""));
  return nextBlock + statsBlock + statusBlock + pcTableHTML(c);
}

/* ------------------------------------------------- simulate preview ---
   The Simulate buttons open FIFA's ADVANCE strip first: today plus the next
   four days as cards, the match day highlighted with the opponent's badge.
   Nothing plays out until Simulate Match is confirmed; Back returns to the
   hub untouched. */

function pcSimPreviewOpen() { pcSimPreview = true; pcShowHub(); }
function pcSimPreviewClose() { pcSimPreview = false; pcShowHub(); }
function pcOpenSimMenu() {
  const m = document.getElementById("careerSimMenuModal");
  if (m) m.style.display = "flex";
}
function pcCloseSimMenu() {
  const m = document.getElementById("careerSimMenuModal");
  if (m) m.style.display = "none";
}
function pcSimMenuQuick() {
  pcCloseSimMenu();
  pcSimPreview = false;
  pcQuickSim();
}
function pcSimMenuLive() {
  pcCloseSimMenu();
  pcSimPreview = false;
  if (typeof pcLiveSim === "function") pcLiveSim();
  else pcQuickSim();
}
function pcSimConfirm() { pcSimPreview = false; pcQuickSim(); }
function pcLiveSim() {
  const c = pcState;
  if (!c) return;
  const uf = pcNextUserFixture(c);
  if (!(uf && uf.day <= c.calDay)) { pcShowHub(); return; }
  const match = uf.match || {};
  const home = match.team1, away = match.team2;
  const homeOvr = (typeof getTeamOverall === "function") ? getTeamOverall(home) : 70;
  const awayOvr = (typeof getTeamOverall === "function") ? getTeamOverall(away) : 70;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  const box = document.createElement('div');
  box.style.cssText = 'width:min(680px,95vw);max-height:80vh;overflow:auto;background:#0b1020;border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#e9edf3;font-family:inherit;';
  box.innerHTML = '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">'+pcEsc(home)+' vs '+pcEsc(away)+'</div><div style="display:flex;gap:12px;align-items:center"><div id="pcLiveTime" style="font-variant-numeric:tabular-nums">0\'</div><div id="pcLiveScore" style="font-weight:700">0 - 0</div></div></div><div id="pcLiveLog" style="padding:12px 16px;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.5"></div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const logEl = box.querySelector('#pcLiveLog');
  const scoreEl = box.querySelector('#pcLiveScore');
  const timeEl = box.querySelector('#pcLiveTime');
  const add = function(txt){ const d=document.createElement('div'); d.textContent=txt; logEl.appendChild(d); logEl.scrollTop=logEl.scrollHeight; };
  let h=0,a=0, step=0, stopped=false;
  function stop(){ if(stopped)return; stopped=true; if(overlay.parentNode) overlay.parentNode.removeChild(overlay); if(uf.kind === "cup") { uf.match.score1=h; uf.match.score2=a; uf.played=true; if(typeof simulateCupMatch==="function")simulateCupMatch(uf.match); else if(typeof pcSimResult==="function")pcSimResult(c,uf);} else { uf.match.score1=h; uf.match.score2=a; uf.played=true; if(typeof pcSimResult==="function")pcSimResult(c,uf);} pcSave(); pcShowHub(); }
  function tick(){
    if(stopped)return;
    step++;
    const min = step <= 45 ? step : step <= 90 ? step : step <= 95 ? 90 + (step-90) : 95;
    if(timeEl) timeEl.textContent = min+"'";
    if (Math.random() < 0.012*(homeOvr/70) && step <= 95) { h++; scoreEl.textContent = h+' - '+a; add(min+"' GOAL - "+home+" scores!"); }
    else if (Math.random() < 0.012*(awayOvr/70) && step <= 95) { a++; scoreEl.textContent = h+' - '+a; add(min+"' GOAL - "+away+" scores!"); }
    else if (Math.random()<0.006) { const who=Math.random()<0.5?home:away; add(min+"' Yellow card for "+who+"."); }
    else if (Math.random()<0.0016) { const who=Math.random()<0.5?home:away; add(min+"' RED CARD - "+who+" sent off!"); }
    else if (step>=45 && step<=80 && Math.random()<0.009) { add(min+"' #"+(10+Math.floor(Math.random()*11))+" Substitution for #"+(1+Math.floor(Math.random()*11))+" - "+(Math.random()<0.5?home:away)+"."); }
    else if (Math.random()<0.08) { add(min+"' "+(Math.random()<0.5?"Chance for ":"Shot on target for ")+(Math.random()<0.5?home:away)+"."); }
    if (step >= 90 && h===a && step < 95 && Math.random()<0.15){ h++; scoreEl.textContent = h+' - '+a; add((90+(step-90))+"' GOAL - "+home+" scores in extra time!"); }
    else if (step >= 90 && h===a && step < 95 && Math.random()<0.15){ a++; scoreEl.textContent = h+' - '+a; add((90+(step-90))+"' GOAL - "+away+" scores in extra time!"); }
    if (step >= 95) { add("Full time - "+home+" "+h+"-"+a+" "+away); setTimeout(stop, 800); return; }
    setTimeout(tick, 280);
  }
  add("Kick off - "+home+" vs "+away); setTimeout(tick, 400);
}

function pcSimPreviewHTML(c) {
  const active = pcActiveClub(c);
  const entries = pcFixtureEntries(c).filter(e => e.mine);
  const byDay = {};
  for (const e of entries) (byDay[e.day] = byDay[e.day] || []).push(e);
  const last = Math.min(c.calDay + 11, CC_CAL_END_DAY);
  const eventOf = function (e) {
    const home = e.home === active;
    const opp = home ? e.away : e.home;
    const score = e.played ? " " + e.score1 + "-" + e.score2 : "";
    return (home ? "vs " : "at ") + opp + (home ? " (H)" : " (A)") + score;
  };
  const compOf = function (e) {
    return e.type === "cup"
      ? c.cupName + " \u00b7 " + pcRoundLabel(e.round)
      : (c.leagueShort || c.league) + " MD" + e.round;
  };
  const d0 = ccCalDate(c, c.calDay);
  let html = '<div class="pcAdvWidget"><div class="pcAdvHead">' +
    '<div class="pcAdvLeft"></div>' +
    '<span class="pcAdvDate">' + PC_MONTHS[d0.getUTCMonth()].toUpperCase() + " " + d0.getUTCFullYear() + "</span>" +
    "</div>";
  const cards = [];
  let hasFuture = false;
  for (let d = c.calDay; d <= last; d++) {
    const date = ccCalDate(c, d);
    const list = byDay[d] || [];
    if (d > c.calDay && list.length) hasFuture = true;
    const cls = "pcAdvDay" + (d === c.calDay ? " on" : "") + (list.length ? " match" : "");
    let card = '<div class="' + cls + '"><div class="pcAdvTop">' +
      '<span class="pcAdvDow">' + PC_DAYS[date.getUTCDay()] + "</span>" +
      '<span class="pcAdvIcon"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.03 6.55 2.7L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg></span>' +
      "</div>";
    if (list.length) {
      const opp = list[0].home === active ? list[0].away : list[0].home;
      card += '<div class="pcAdvEvent">' + pcEsc(list.map(eventOf).join(" \u00b7 ")) + "</div>" +
        '<div class="pcAdvComp">' + pcEsc(list.map(compOf).join(" \u00b7 ")) + "</div>" +
        '<div class="pcAdvTents"><i class="pcAdvTent"></i><i class="pcAdvTent"></i></div>' +
        '<span class="pcAdvShield">' + pcClubInitials(opp) + "</span>";
    }
    card += '<div class="pcAdvNum">' + d + "</div></div>";
    cards.push(card);
  }
  html += '<div class="pcAdvDays">' + cards.join("") + "</div>";
  if (!hasFuture) {
    const upcoming = entries.filter(e => !e.played && e.day > last).sort((a, b) => a.day - b.day)[0];
    if (upcoming) {
      html += '<div class="pcAdvNext">Next match \u00b7 Day ' + upcoming.day + " \u00b7 " + pcDateLabel(c, upcoming.day) + " \u00b7 " + pcEsc(eventOf(upcoming)) + "</div>";
    }
  }
  return html + "</div>";
}

function pcShowHub() {
  if (!pcState) { pcRenderSetup(); return; }
  const c = pcState;
  if (typeof matchRunning !== "undefined" && matchRunning) {
    matchRunning = false;
    try { clearInterval(timerInterval); } catch (e) {}
    pcMidMatch = true;
  }
  pcHideOtherScreens();
  if (pcSeasonDone(c)) { pcShowSeasonSummary(); return; }
  const title = document.getElementById("pcTitle");
  if (title) title.textContent = c.name + " \u2014 Player Career";
  const sub = document.getElementById("pcSubtitle");
  if (sub) sub.textContent = c.club + " \u00b7 " + pcPosLabel(c) + " \u00b7 Age " + pcNum(c.age, 17) + " \u00b7 " + pcNextLine(c);
  const uf = pcNextUserFixture(c);
  const suspended = pcSuspended(c);
  const injured = !!(c.injury && c.injury.days > 0);
  const due = !!(uf && uf.day <= c.calDay);
  if (pcSimPreview && (pcMidMatch || !due)) pcSimPreview = false;
  let actions = "";
  if (pcMidMatch) {
    actions = '<button class="wcPrimaryBtn" onclick="pcResumeMatch()">Resume Match</button>';
  } else if (due) {
    actions = '<button class="wcPrimaryBtn" onclick="pcPlayNext()">' + (suspended ? "Serve Suspension (Simulate)" : injured ? "Play (you are out)" : "Play Match") + '</button>' +
      '<button class="wcGhostBtn" onclick="pcOpenSimMenu()">Simulate</button>' +
      '<button class="wcGhostBtn" onclick="pcDayStep()">Next Day</button>';
  } else {
    actions = '<button class="wcPrimaryBtn" onclick="pcTickerToggle()" onmousedown="pcTickerHalt()">' + (pcTicking ? "Stop" : "Continue") + '</button>' +
      (pcTicking ? "" : '<button class="wcGhostBtn" onclick="pcDayStep()">Next Day</button>');
  }
  actions += '<button class="wcGhostBtn" onclick="pcQuitToMenu()">Quit to Menu</button>';
  const body = document.getElementById("pcBody");
  if (body) {
    const html = '<div class="wcHubActions">' + actions + "</div>" +
      pcSimPreviewHTML(c) + pcTabHeaderHTML(c) + '<div class="pcTabBody">' + pcTabBodyHTML(c, pcTab) + "</div>";
    if (body.innerHTML === html) return;
    body.innerHTML = html;
  }
  if (typeof enterScreen === "function") enterScreen("careerScreen", "block");
  else document.getElementById("careerScreen").style.display = "block";
}

function pcFixtureEntries(c) {
  const entries = [];
  for (const f of c.fixtures) {
    if (!pcValidFixture(f)) continue;
    entries.push({
      day: f.day,
      type: f.kind === "cup" ? "cup" : "league",
      round: f.round,
      home: f.match.team1,
      away: f.match.team2,
      played: !!f.played,
      score1: f.match.score1,
      score2: f.match.score2,
      pens1: f.match.pens1,
      pens2: f.match.pens2,
      mine: pcIsUserFixture(c, f)
    });
  }
  return entries;
}

function pcFixtureLabel(c, f) {
  const comp = f.kind === "cup" ? c.cupName + " \u00b7 " + pcRoundLabel(f.round) : c.league + " \u00b7 MD" + f.round;
  return pcDateLabel(c, f.day) + " \u00b7 " + comp;
}

function pcFixtureResultLine(c, f) {
  const active = pcActiveClub(c);
  const mine = f.match.team1 === active || f.match.team2 === active;
  const userGoals = f.match.team1 === active ? f.match.score1 : f.match.score2;
  const oppGoals = f.match.team1 === active ? f.match.score2 : f.match.score1;
  const opp = f.match.team1 === active ? f.match.team2 : f.match.team1;
  const res = userGoals > oppGoals ? "W" : userGoals < oppGoals ? "L" : "D";
  const score = mine ? (userGoals + "-" + oppGoals) : (f.match.score1 + "-" + f.match.score2);
  const pens = f.match.pens1 != null ? " (" + f.match.pens1 + "-" + f.match.pens2 + "p)" : "";
  return pcRow(pcFixtureLabel(c, f), (mine ? res + " " : "") + (mine ? "vs " + opp + " \u00b7 " : "") + score + pens);
}

function pcScheduleHTML(c) {
  const active = pcActiveClub(c);
  const entries = pcFixtureEntries(c);
  const byDay = {};
  for (const e of entries) (byDay[e.day] = byDay[e.day] || []).push(e);
  const legend = '<span><i class="lg">L</i> ' + pcEsc(c.league) + "</span>" +
    '<span><i class="cup">C</i> ' + pcEsc(c.cupName) + "</span>" +
    '<span class="calSpan">Season ' + pcNum(c.season, 1) + " \u00b7 Day " + pcNum(c.calDay, 1) + "</span>";
  const cal = (typeof ccCalMonthGridHTML === "function") ? ccCalMonthGridHTML({
    y: pcView.y,
    m: pcView.m,
    startDate: ccCalStart(c),
    lastDay: CC_CAL_END_DAY,
    byDay: byDay,
    curDay: c.calDay,
    nowLabel: "NEXT",
    legend: legend,
    renderChip: function (e) {
      const mine = e.mine;
      let short;
      if (e.played && e.score1 != null) short = e.score1 + "-" + e.score2 + (e.pens1 != null ? "p" : "");
      else if (mine) short = e.home === active ? e.away : e.home;
      else short = e.home;
      const tip = e.home + " v " + e.away + (e.played && e.score1 != null ? " (" + e.score1 + "-" + e.score2 + (e.pens1 != null ? " " + e.pens1 + "-" + e.pens2 + "p" : "") + ")" : "") + " \u00b7 Day " + e.day;
      return '<span class="calChip ' + e.type + (e.played ? " done" : "") + (mine ? " mine" : "") + '" title="' + pcAttr(tip) + '">' +
        "<i>" + (e.type === "cup" ? "C" : "L") + "</i>" + pcEsc(short) + "</span>";
    }
  }) : "";
  const upcoming = c.fixtures.filter(f => pcValidFixture(f) && !f.played).slice(0, 5);
  const results = c.fixtures.filter(f => pcValidFixture(f) && f.played).slice(-6).reverse();
  const upLines = upcoming.map(f =>
    '<div class="pcLine"><span>' + pcEsc(pcFixtureLabel(c, f)) + "</span><b>" +
    pcEsc((f.match.team1 === active ? "vs " : "at ") + (f.match.team1 === active ? f.match.team2 : f.match.team1)) + "</b></div>").join("");
  const resLines = results.map(f => pcFixtureResultLine(c, f)).join("");
  const resBlock = results.length
    ? pcBlock("Results", "Last " + results.length, resLines)
    : pcEmptyT("Results", "No matches played yet.");
  return cal +
    (upcoming.length ? pcBlock("Upcoming", upcoming.length + " fixtures", upLines) : pcEmptyT("Upcoming", "No fixtures left this season.")) +
    resBlock;
}

function pcObjValue(c, o) {
  const ss = c.seasonStats || {};
  switch (o.type) {
    case "goals": return pcNum(ss.goals, 0);
    case "assists": return pcNum(ss.assists, 0);
    case "apps": return pcNum(ss.apps, 0);
    case "motm": return pcNum(ss.motm, 0);
    case "wins": return pcNum(ss.wins, 0);
    case "rating": return ss.apps ? pcNum(ss.ratingSum, 0) / pcNum(ss.apps, 1) : 0;
    case "rep": return pcNum(c.rep, 0);
    default: return 0;
  }
}

function pcObjDone(c, o) {
  const v = pcObjValue(c, o);
  if (o.type === "rating") return v >= pcNum(o.target, 7);
  return v >= pcNum(o.target, 1);
}

function pcSeasonDpReward(c) {
  let dp = 0;
  for (const o of (c.objectives || [])) if (pcObjDone(c, o)) dp += pcNum(o.reward, 0);
  return dp;
}

function pcSeasonMet(c) {
  let n = 0;
  for (const o of (c.objectives || [])) if (pcObjDone(c, o)) n++;
  return n;
}

function pcCupResult(c) {
  const active = pcActiveClub(c);
  const cup = c.fixtures.filter(f => f.kind === "cup" && pcValidFixture(f));
  if (!cup.length) return { status: "none" };
  for (const f of cup) {
    const involved = f.match.team1 === active || f.match.team2 === active;
    if (!involved || !f.played) continue;
    if (f.round === 4) return { status: f.match.winner === active ? "won" : "final" };
    if (f.match.winner && f.match.winner !== active) return { status: "out", round: f.round };
  }
  return { status: "alive" };
}

function pcOrdinal(n) {
  n = pcNum(n, 1);
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function pcShowSeasonSummary() {
  const c = pcState;
  if (!c) { pcRenderSetup(); return; }
  if (typeof matchRunning !== "undefined" && matchRunning) {
    matchRunning = false;
    try { clearInterval(timerInterval); } catch (e) {}
  }
  pcMidMatch = false;
  pcHideOtherScreens();
  const title = document.getElementById("pcTitle");
  if (title) title.textContent = "Season " + pcNum(c.season, 1) + " Complete";
  const sub = document.getElementById("pcSubtitle");
  if (sub) sub.textContent = c.name + " \u00b7 " + c.club;
  const active = pcActiveClub(c);
  const table = pcTable(c);
  const rank = pcRankOf(c, active);
  let w = 0, d = 0, l = 0;
  for (const row of table) if (row.team === active) { w = pcNum(row.w, 0); d = pcNum(row.d, 0); l = pcNum(row.l, 0); }
  const cup = pcCupResult(c);
  const ss = c.seasonStats || pcEmptyStats();
  const avg = ss.apps ? ss.ratingSum / ss.apps : 0;
  const cupText = cup.status === "won" ? c.cupName + " winners!" :
    cup.status === "final" ? "Runner-up" :
    cup.status === "out" ? "Out in the " + pcRoundLabel(cup.round) :
    cup.status === "alive" ? "Still in the competition" : "-";
  const dp = pcSeasonDpReward(c);
  const met = pcSeasonMet(c);
  const review = pcBlock("Season in review", pcOrdinal(rank) + " place",
    pcRow("League record", w + "W " + d + "D " + l + "L") +
    pcRow("Goals / assists", pcNum(ss.goals, 0) + " / " + pcNum(ss.assists, 0)) +
    pcRow("Appearances", pcNum(ss.apps, 0)) +
    pcRow("Average rating", avg ? avg.toFixed(2) : "-") +
    pcRow("Cup", cupText) +
    pcRow("Man of the match", pcNum(ss.motm, 0)));
  const objs = Array.isArray(c.objectives) ? c.objectives : [];
  const objBlock = objs.length
    ? pcBlock("Objectives", met + " of " + objs.length + " met",
        objs.map(o => {
          const v = pcObjValue(c, o);
          const done = pcObjDone(c, o);
          const target = pcNum(o.target, 1);
          if (o.type === "rating") {
            return pcMeter(o.label, Math.min(v, target), target, { tone: done ? "good" : "", show: v ? v.toFixed(2) + " / " + target.toFixed(1) : "-" });
          }
          return pcMeter(o.label, Math.min(v, target), target, { tone: done ? "good" : "", show: Math.round(v) + " / " + target });
        }).join("") +
        '<div class="pcHint" style="margin-top:6px">Reward on the way: +' + dp + " development points.</div>")
    : pcEmptyT("Objectives", "No targets were set this season.");
  const rewards = pcBlock("Off-season", "Ready to go again",
    pcRow("Development points banked", "+" + dp) +
    pcRow("Growth this summer", "Up to +" + pcSeasonCap(c.age) + " OVR") +
    pcRow("Next season", "Season " + (pcNum(c.season, 1) + 1)));
  const actions = '<button class="wcPrimaryBtn" onclick="pcAdvanceSeason()">Start Season ' + (pcNum(c.season, 1) + 1) + "</button>" +
    '<button class="wcGhostBtn" onclick="pcRetireCareer()">Retire Career</button>';
  const body = document.getElementById("pcBody");
  if (body) body.innerHTML = '<div class="wcHubActions">' + actions + "</div>" + review + objBlock + rewards;
  if (typeof enterScreen === "function") enterScreen("careerScreen", "block");
  else document.getElementById("careerScreen").style.display = "block";
}

function pcAdvanceSeason() {
  const c = pcState;
  if (!c) return;
  c.dp = pcNum(c.dp, 0) + pcSeasonDpReward(c);
  const cap = pcSeasonCap(c.age);
  const gain = Math.min(pcNum(c.seasonTrainGain, 0), cap);
  const bonus = Math.min(3, Math.floor(pcNum(c.dp, 0) * 0.05));
  c.ovr = Math.min(pcNum(c.potential, 85), pcNum(c.ovr, 70) + Math.floor(gain) + bonus);
  c.age = pcNum(c.age, 17) + 1;
  const active = pcActiveClub(c);
  const table = pcTable(c);
  const rank = pcRankOf(c, active);
  const cup = pcCupResult(c);
  const ss = c.seasonStats || pcEmptyStats();
  if (!Array.isArray(c.history)) c.history = [];
  c.history.push({
    season: c.season,
    club: active,
    rank: rank,
    cupWon: cup.status === "won",
    table: table.length || 20,
    goals: pcNum(ss.goals, 0),
    assists: pcNum(ss.assists, 0),
    rating: ss.apps ? Math.round((ss.ratingSum / ss.apps) * 100) / 100 : 0
  });
  c.rep = pcCl(pcNum(c.rep, 10) + (rank <= 4 ? 1.5 : rank > 14 ? -1 : 0.4) + (cup.status === "won" ? 3 : 0), 1, 99);
  if (c.loanActive && Array.isArray(c.loans)) {
    for (const ln of c.loans) if (ln.club === c.loanActive.club && !ln.to) ln.to = pcNum(c.season, 1) + 1;
    c.loanActive = null;
  }
  pcApplyPromotionRelegation(c);
  if (!c.pendingClub && c.age <= 21 && c.trust < 50 && Math.random() < 0.6) {
    const str = (typeof getTeamStrength === "function") ? getTeamStrength : function () { return 70; };
    const pool = (c.clubs || []).filter(x => x !== c.club && str(x) < str(c.club));
    if (pool.length) c.loanPending = pcPickOf(pool);
  }
  if (c.personality) {
    c.personality.media = pcCl(pcNum(c.personality.media, 55) + (Math.random() * 6 - 3), 10, 95);
    c.personality.loyalty = pcCl(pcNum(c.personality.loyalty, 60) + (Math.random() * 6 - 3), 10, 95);
  }
  c.season = pcNum(c.season, 1) + 1;
  c.objectives = [];
  pcStartSeason(c, false);
  pcSave();
  pcTab = "home";
  pcShowHub();
}

function pcAdvance() {
  const c = pcState;
  if (!c) return;
  if (pcSeasonDone(c)) { pcShowSeasonSummary(); return; }
  const nxt = pcNextAnyFixture(c);
  const target = nxt ? Math.min(nxt.day, c.calDay + 7) : Math.min(CC_CAL_END_DAY, c.calDay + 7);
  pcSimTo(c, target);
  pcShowHub();
}

/* ------------------------------------------------- day-by-day advance ---
   The hub's Continue runs the day ticker (one visible day every 700ms,
   stopping at the next fixture or season end); Next Day steps exactly one.
   The Stop button halts it via mousedown too (pcTickerHalt), so the click
   survives the hub re-rendering under the cursor on every tick.
   pcAdvance() keeps its old jump behaviour for fast-forward loops. */

function pcDayStepOnce(c) {
  pcSimPast(c, c.calDay + 1);
  const uf = pcNextUserFixture(c);
  const stop = uf && uf.day < c.calDay + 1 ? uf.day : c.calDay + 1;
  pcAdvanceDays(c, stop - c.calDay);
  c.calDay = stop;
}

function pcDayTickEvent(c) {
  if (typeof ccWorldNewsBatch === "function" && Math.random() < 0.06) ccWorldNewsBatch(c, 1);
}

function pcTickerStop() {
  if (pcTicker !== null && typeof clearInterval === "function") clearInterval(pcTicker);
  pcTicker = null;
  pcTicking = false;
}

function pcTickerStart() {
  const c = pcState;
  if (!c || pcTicking) return;
  if (typeof matchRunning !== "undefined" && matchRunning) return;
  let sinceSave = 0;
  pcTicking = true;
  pcTicker = setInterval(function () {
    const cc = pcState;
    if (!pcTicking || !cc || pcSeasonDone(cc) || (typeof matchRunning !== "undefined" && matchRunning)) {
      pcTickerStop();
      pcShowHub();
      return;
    }
    const uf = pcNextUserFixture(cc);
    if ((uf && uf.day <= cc.calDay) || cc.calDay >= CC_CAL_END_DAY) {
      pcTickerStop();
      pcShowHub();
      return;
    }
    pcDayStepOnce(cc);
    pcDayTickEvent(cc);
    if (++sinceSave >= 10) { pcSave(); sinceSave = 0; }
    pcShowHub();
  }, 700);
}

function pcTickerToggle() {
  if (pcTicking) pcTickerStop();
  else pcTickerStart();
  pcShowHub();
}

function pcTickerHalt() {
  if (!pcTicking) return;
  pcTickerStop();
  pcShowHub();
}

function pcDayStep() {
  const c = pcState;
  if (!c || pcTicking) return;
  if (typeof matchRunning !== "undefined" && matchRunning) return;
  if (pcSeasonDone(c)) { pcShowSeasonSummary(); return; }
  const uf = pcNextUserFixture(c);
  if ((uf && uf.day <= c.calDay) || c.calDay >= CC_CAL_END_DAY) { pcShowHub(); return; }
  pcDayStepOnce(c);
  pcDayTickEvent(c);
  pcSave();
  try { pcShowHub(); } catch (e) {}
}

/* Simulate a single user fixture without the end-of-match screen (used by the
   bulk calendar sim). Mirrors pcQuickSim's maths but stays quiet. */
function pcSimUserMatch(c, f) {
  if (!c || !f || !f.match || f.match.played) return;
  const m = f.match;
  const active = pcActiveClub(c);
  const opp = pcFixtureOpponent(c, f);
  const suspended = pcSuspended(c);
  const injured = !!(c.injury && c.injury.days > 0);
  const unavailable = injured || suspended;
  const boost = (pcProOvr(c) - 70) * 0.05;
  let gf = poisson(Math.max(0.2, expectedGoals(active, opp) + boost));
  let ga = poisson(Math.max(0.2, expectedGoals(opp, active) - boost * 0.5));
  let pens = null;
  let userWon = gf > ga;
  if (gf === ga && f.kind === "cup") {
    userWon = Math.random() < 0.52 + boost * 0.4;
    pens = userWon ? { user: 4, opp: 3 } : { user: 3, opp: 4 };
    gf += pens.user > pens.opp ? 1 : 0;
    ga += pens.opp > pens.user ? 1 : 0;
    userWon = gf > ga;
  }
  if (m.team1 === active) { m.score1 = gf; m.score2 = ga; }
  else { m.score1 = ga; m.score2 = gf; }
  if (pens) {
    if (m.team1 === active) { m.pens1 = pens.user; m.pens2 = pens.opp; }
    else { m.pens1 = pens.opp; m.pens2 = pens.user; }
    m.decidedBy = "penalties";
  }
  m.winner = f.kind === "league" && gf === ga ? null : (userWon ? active : opp);
  m.played = true;
  f.played = true;
  let pg = 0, pa = 0;
  const ovr = pcProOvr(c);
  if (!unavailable) {
    for (let i = 0; i < gf; i++) if (Math.random() < 0.42 + (ovr - 65) * 0.012) pg++;
    if (pg > 3) pg = 3;
    if (Math.random() < 0.3 + (ovr - 65) * 0.01) pa = Math.min(2, Math.max(0, gf - pg));
  }
  const result = gf > ga ? "w" : gf < ga ? "l" : "d";
  let rating = 6.2 + (result === "w" ? 0.7 : result === "d" ? 0.1 : -0.4) + pg * 0.8 + pa * 0.5 + (Math.random() * 0.8 - 0.4);
  rating = Math.round(pcCl(rating, 4.5, 9.7) * 10) / 10;
  const r = pcBuildResult(c, f, gf, ga, pg, pa, rating);
  r.minutes = unavailable ? 0 : 90;
  pcApplyResult(c, r);
  if (suspended) pcServeSuspension(c);
}

/* Full simulate-to-date: advances c.calDay all the way to targetDay, simming
   every fixture in between — including the user's own. */
function pcSimToFull(c, targetDay) {
  if (!c) return;
  if (typeof c.calDay !== "number" || !isFinite(c.calDay) || c.calDay < 1) c.calDay = CC_CAL_FIRST_DAY;
  targetDay = pcCl(targetDay, c.calDay, CC_CAL_END_DAY);
  if (targetDay <= c.calDay) return;
  let guard = 0;
  while (guard++ < 800) {
    const next = pcNextAnyFixture(c);
    if (!next || next.day > targetDay) break;
    if (pcIsUserFixture(c, next)) pcSimUserMatch(c, next);
    else pcSimResult(c, next);
    pcFillCupNext(c);
  }
  pcAdvanceDays(c, targetDay - c.calDay);
  c.calDay = targetDay;
  if (typeof ccWorldNewsBatch === "function" && Math.random() < 0.35) ccWorldNewsBatch(c, 1);
  pcSave();
}

window.pcSimToDayFromCal = function (dayNum) {
  try {
    if (typeof pcState === "undefined" || !pcState) return;
    if (typeof matchRunning !== "undefined" && matchRunning) return;
    const c = pcState;
    if (typeof c.calDay !== "number" || !isFinite(c.calDay) || c.calDay < 1) c.calDay = CC_CAL_FIRST_DAY;

    const target = pcCl((typeof pcNum === "function") ? pcNum(dayNum, c.calDay) : Number(dayNum),
                        c.calDay, CC_CAL_END_DAY);
    if (target === c.calDay) {
      try { if (typeof pcShowHub === "function") pcShowHub(); } catch (e) {}
      return;
    }

    // Count the user's unplayed fixtures that the sim will skip over.
    const active = pcActiveClub(c);
    let userMatches = 0;
    for (const f of (c.fixtures || [])) {
      if (!f || f.played) continue;
      if (typeof f.day !== "number") continue;
      if (f.day <= c.calDay || f.day > target) continue;
      if (!f.match || !f.match.team1 || !f.match.team2) continue;
      if (f.match.team1 === active || f.match.team2 === active) userMatches++;
    }

    if (userMatches > 0) {
      const days = target - c.calDay;
      const msg = "Are you sure? You are simulating past " + days + " day" + (days === 1 ? "" : "s") + ".";
      try {
        if (typeof window.confirm === "function" && !window.confirm(msg)) return;
      } catch (e) { return; }
    }

    try { if (typeof pcTickerStop === "function") pcTickerStop(); } catch (e) {}
    try { pcSimToFull(c, target); }
    catch (e) { if (window.console) console.error("pcSimToDayFromCal sim failed:", e); }
    try { if (typeof pcShowHub === "function") pcShowHub(); } catch (e) {}
  } catch (e) {
    if (typeof window !== "undefined" && window.console) console.error("pcSimToDayFromCal failed:", e);
  }
};

function pcCalNav(delta) {
  let y = pcView.y;
  let m = pcView.m + pcNum(delta, 0);
  while (m < 0) { m += 12; y -= 1; }
  while (m > 11) { m -= 12; y += 1; }
  pcView = { y: y, m: m };
  pcShowHub();
}

function pcCalToday() {
  const c = pcState;
  if (!c) return;
  const d = ccCalDate(c, c.calDay);
  pcView = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  pcShowHub();
}

function pcCalGoTo(y, m) {
  pcView = { y: pcNum(y, 2026), m: pcCl(m, 0, 11) };
  pcShowHub();
}

function pcQuitToMenu() {
  pcTickerStop();
  pcSimPreview = false;
  if (pcState) {
    pcRestoreRoster(pcState);
    pcSave();
  }
  pcContext = null;
  pcMidMatch = false;
  pcState = null;
  const cs = document.getElementById("careerScreen");
  if (cs) cs.style.display = "none";
  if (typeof quitToMenu === "function") quitToMenu();
}

function pcRetireCareer() {
  pcTickerStop();
  pcSimPreview = false;
  if (pcState) pcRestoreRoster(pcState);
  const id = pcState ? pcState.id : null;
  pcState = null;
  pcContext = null;
  pcMidMatch = false;
  const all = pcLoadAll();
  all.careers = all.careers.filter(x => x && x.id !== id);
  all.active = 0;
  pcSaveAll(all);
  if (all.careers.length) pcShowPicker();
  else pcRenderSetup();
}



