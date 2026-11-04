/* ======================================================================
   VANTAGE FC - MANAGER CAREER
   Rebuilt from scratch after the OneDrive sync wipe. This file provides
   the base career layer: state + storage, squad/academy management,
   fixtures and season flow, the hub shell and the engine hooks
   (mcContext, mcIsGroupMatch, mcEndMatch, mcShowHub). mcpanels.js loads
   after this file and wraps mcStartSeason / mcApplyResult / mcEndSeason /
   mcSignPlayer / mcBuyPlayer / mcPromoteAcademy / mcShowHub /
   mcRenderSetup / mcTabHeaderHTML / mcTabBodyHTML / mcBoardHTML, and
   provides the news, finances, scouting and roles tabs. Pure fixture and
   calendar helpers are shared with playercareer.js (argument-based).
   ====================================================================== */

var mcState = null;
var mcContext = null;
var mcMidMatch = false;
var mcMenu = "home";
var mcView = { y: 2026, m: 7 };
var mcSetup = { league: null, club: null, style: null, name: "" };
var mcCareers = [];
var mcTicker = null;
var mcTicking = false;
var mcSimPreview = false;

var MC_STORAGE_KEY = "vantageManagerCareer_v1";
var MC_STYLES = [
  { key: "win", label: "Win Now", blurb: "The board wants trophies and top-four finishes. Results matter, today." },
  { key: "balanced", label: "Balanced", blurb: "Compete for Europe while keeping the books in decent shape." },
  { key: "develop", label: "Develop Youth", blurb: "Blood the academy, grow talent, and finish mid-table or better." }
];
var MC_FIRST = ["Alex", "Marco", "Diego", "Thomas", "Luis", "Jurgen", "Antoine", "Carlo", "Bruno", "Oscar", "Nuno", "Rafa", "Sam", "Gordon", "Mikel", "Stefan", "Klaus", "Paolo", "Andre", "Julen"];
var MC_LAST = ["Vega", "Moreno", "Costa", "Schmidt", "Laurent", "Ferreira", "Hughes", "Bianchi", "Duarte", "Novak", "Sorensen", "Ibrahim", "Keller", "Rossi", "Vidal", "Marino", "Ander", "Kovac", "Dumont", "Reid"];

function mcEsc(s) {
  return typeof pcEsc === "function" ? pcEsc(s) : String(s == null ? "" : s);
}

function mcNum(v, d) {
  const n = parseFloat(v);
  return isNaN(n) ? (d || 0) : n;
}

function mcCl(v, lo, hi) {
  return Math.min(hi, Math.max(lo, mcNum(v, lo)));
}

function mcAttr(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function mcMoney(v) {
  v = mcNum(v, 0);
  const n = Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  return "\u00a3" + n + "M";
}

function mcCid() {
  return "mp" + Date.now().toString(36) + Math.floor(Math.random() * 1000000).toString(36);
}

/* ------------------------------------------------------------ storage ---
   Several manager careers can be saved at once: { v:1, careers:[...], active:0 }.
   Older builds wrote { v:1, activeId, careers } (or a single career object),
   so mcLoadAll() maps those into the new shape without losing saves. */

function mcNormalize(c) {
  if (!c || typeof c !== "object") return c;
  if (!c.negCooldowns || typeof c.negCooldowns !== "object") c.negCooldowns = {};
if (!Array.isArray(c.messages)) c.messages = [];
if (typeof c.messagesDay !== "number") c.messagesDay = 0;
for (const p of (c.squad || [])) {
  if (!p) continue;
  if (typeof p.wage !== "number" || p.wage <= 0) {
    const ov = (typeof mcOvr === "function") ? mcOvr(p) : 60;
    p.wage = Math.round(ov * ov * 6 / 100) * 100;
  }
  if (typeof p.contractEnd !== "number" || p.contractEnd < 1) {
    p.contractEnd = (c.season || 1) + 3;
  }
}
  c.id = c.id || mcCid();
  c.updatedAt = c.updatedAt || c.createdAt || Date.now();
  if (!Array.isArray(c.fixtures)) c.fixtures = [];
  if (!Array.isArray(c.squad)) c.squad = [];
  if (!Array.isArray(c.news)) c.news = [];
  if (!Array.isArray(c.history)) c.history = [];
  if (!Array.isArray(c.pendingDeals)) c.pendingDeals = [];
  if (typeof c.marketClub !== "string") c.marketClub = "";
  return c;
}

function mcLoadAll() {
  try {
    const raw = localStorage.getItem(MC_STORAGE_KEY);
    if (!raw) return { v: 1, careers: [], active: 0 };
    const s = JSON.parse(raw);
    if (s && Array.isArray(s.careers)) {
      const needsWrite = s.careers.some(c => c && !c.id);
      const careers = s.careers.filter(c => c && typeof c === "object").map(mcNormalize);
      let active = Number(s.active);
      let converted = false;
      if (!isFinite(active)) {
        active = 0;
        if (s.activeId) {
          const i = careers.findIndex(c => c.id === s.activeId);
          if (i >= 0) active = i;
        }
        converted = true;
      }
      active = careers.length ? Math.max(0, Math.min(active, careers.length - 1)) : 0;
      mcCareers = careers;
      const out = { v: 1, careers: careers, active: active };
      if (needsWrite || converted) mcSaveAll(out);
      return out;
    }
    return { v: 1, careers: [], active: 0 };
  } catch (e) { return { v: 1, careers: [], active: 0 }; }
}

function mcSaveAll(data) {
  try {
    if (data && Array.isArray(data.careers) && data.careers.length) {
      data.active = Math.max(0, Math.min(Number(data.active) || 0, data.careers.length - 1));
    } else if (data) data.active = 0;
    localStorage.setItem(MC_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function mcSave() {
  try {
    const all = mcLoadAll();
    if (mcState) {
      mcState.updatedAt = Date.now();
      const i = all.careers.findIndex(c => c && c.id === mcState.id);
      if (i >= 0) all.careers[i] = mcState; else all.careers.unshift(mcState);
      all.active = 0;
    }
    mcSaveAll(all);
    mcCareers = all.careers;
  } catch (e) {}
}

function mcLoad() {
  const all = mcLoadAll();
  mcState = all.careers.length ? all.careers[all.active] : null;
  return mcState;
}

function mcFindCareer(id) {
  if (!id) return null;
  for (let i = 0; i < mcCareers.length; i++) if (mcCareers[i] && mcCareers[i].id === id) return mcCareers[i];
  return null;
}

function mcClearSave() {
  try { localStorage.removeItem(MC_STORAGE_KEY); } catch (e) {}
  mcCareers = [];
  mcState = null;
}

/* --------------------------------------------------------- save picker --- */

function mcShowPicker() {
  const body = document.getElementById("mcBody");
  if (!body) return;
  pcHideOtherScreens();
  const title = document.getElementById("mcTitle");
  if (title) title.textContent = "Manager Career";
  const sub = document.getElementById("mcSubtitle");
  if (sub) sub.textContent = "Pick up a saved career, or start a new one.";
  const all = mcLoadAll();
  const items = all.careers.map(c => ({
    badge: pcClubInitials(c.clubName || c.club || c.managerName),
    name: (c.managerName || "The Manager") + " \u2014 " + (c.clubName || c.club || "No club"),
    meta: (c.league || "") + " \u00b7 Season " + pcNum(c.season, 1) + (c.updatedAt ? " \u00b7 " + sgWhen(c.updatedAt) : ""),
    resume: "mcResumeCareer('" + c.id + "')",
    del: "mcDeleteCareerAsk('" + c.id + "')"
  }));
  body.innerHTML = sgPickerHTML({
    items: items,
    emptyText: "No saved careers yet.",
    newLabel: "New Career",
    newAction: "mcStartNewCareer()",
    backAction: "mcQuitToMenu()"
  });
  if (typeof enterScreen === "function") enterScreen("managerScreen", "block");
  else document.getElementById("managerScreen").style.display = "block";
}

function mcResumeCareer(id) {
  mcTickerStop();
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  const all = mcLoadAll();
  const i = all.careers.findIndex(c => c && c.id === id);
  if (i < 0) { mcShowPicker(); return; }
  const c = all.careers.splice(i, 1)[0];
  all.careers.unshift(c);
  all.active = 0;
  mcSaveAll(all);
  mcCareers = all.careers;
  mcState = c;
  mcApplyRosterEdits(c);
  if (Array.isArray(c.squad) && c.squad.length) mcSyncRoster(c);
  mcContext = null;
  mcMidMatch = false;
  mcMenu = "home";
  mcShowHub();
}

function mcDeleteCareerAsk(id) {
  mcTickerStop();
  const all = mcLoadAll();
  const c = all.careers.find(x => x && x.id === id);
  if (!c) return;
  if (typeof window !== "undefined" && typeof window.confirm === "function" &&
      !window.confirm('Delete "' + (c.clubName || c.club || "this career") + '"? This cannot be undone.')) return;
  if (mcState && mcState.id === id) {
    mcState = null;
    mcContext = null;
    mcMidMatch = false;
  }
  all.careers = all.careers.filter(x => x && x.id !== id);
  all.active = 0;
  mcSaveAll(all);
  mcCareers = all.careers;
  mcShowPicker();
}

/* ------------------------------------------------------------- squad ---- */

function mcOvr(p) {
  if (!p) return 0;
  if (p.ovr) return Math.round(mcNum(p.ovr, 60));
  if (typeof calculateOverall === "function") return Math.round(calculateOverall(p, p.role));
  return 60;
}

function mcValue(p) {
  const o = Math.max(45, mcOvr(p));
  const age = mcNum(p && p.age, 26);
  let f = 1;
  if (age <= 22) f = 1.35;
  else if (age <= 28) f = 1;
  else if (age <= 31) f = 0.6;
  else f = 0.35;
  return Math.round(Math.pow(o - 45, 2) / 35 * f * 10) / 10;
}

function mcBestOvr(c) {
  let best = 0;
  for (const p of (c && c.squad) || []) {
    const o = mcOvr(p);
    if (o > best) best = o;
  }
  return best;
}

function mcRoleLabel(role) {
  return role === "goalkeeper" ? "GK" : role === "defender" ? "DEF" : role === "midfielder" ? "MID" : role === "attacker" ? "ATT" : "";
}

function mcRandomName() {
  return MC_FIRST[Math.floor(Math.random() * MC_FIRST.length)] + " " + MC_LAST[Math.floor(Math.random() * MC_LAST.length)];
}

function mcLog(c, text) {
  if (!c) return;
  if (!Array.isArray(c.log)) c.log = [];
  c.log.push({ text: String(text == null ? "" : text), season: mcNum(c.season, 1) });
  if (c.log.length > 120) c.log.splice(0, c.log.length - 120);
}

function mcFindPlayer(c, cid) {
  if (!c || !Array.isArray(c.squad)) return null;
  for (const p of c.squad) if (p.cid === cid) return p;
  return null;
}

function mcMakeCard(name, role, ovr, age, pot) {
  ovr = Math.round(mcCl(ovr, 30, 95));
  pot = Math.round(mcCl(pot, ovr, 95));
  const base = (typeof makeRatedPlayer === "function") ? makeRatedPlayer(name, ovr, role) : {};
  return {
    cid: mcCid(), name: name, role: role,
    pace: mcNum(base.pace, ovr), shooting: mcNum(base.shooting, ovr), passing: mcNum(base.passing, ovr),
    dribbling: mcNum(base.dribbling, ovr), defending: mcNum(base.defending, ovr), physical: mcNum(base.physical, ovr),
    age: Math.round(mcCl(age, 16, 40)), pot: pot, ovr: ovr
  };
}

function mcCardFrom(p, role) {
  const age = 18 + Math.floor(Math.random() * 13);
  const ovr = (typeof calculateOverall === "function") ? Math.round(calculateOverall(p, role)) : Math.round(mcNum(p.ovr, 65));
  const grow = age <= 21 ? 6 + Math.floor(Math.random() * 13) : age <= 24 ? 3 + Math.floor(Math.random() * 7) : 1 + Math.floor(Math.random() * 4);
  return {
    cid: mcCid(), name: p.name, role: role,
    pace: mcNum(p.pace, ovr), shooting: mcNum(p.shooting, ovr), passing: mcNum(p.passing, ovr),
    dribbling: mcNum(p.dribbling, ovr), defending: mcNum(p.defending, ovr), physical: mcNum(p.physical, ovr),
    age: age, pot: Math.round(mcCl(ovr + grow, ovr, 94)), ovr: ovr,
    __editId: p.__editId || null, origName: p.origName || p.name
  };
}

function mcApplyRosterEdits(c) {
  if (!c) return;
  if (typeof TeamEdits !== "undefined" && TeamEdits.applyToSquad) {
    c.squad = TeamEdits.applyToSquad(c.club, c.squad || []);
  }
}

function mcBuildSquad(c) {
  pcEnsureClub(c.club);
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[c.club] : null;
  if (!r) { c.squad = []; return; }
  const squad = [];
  const push = (p, role) => { if (p && p.name) squad.push(mcCardFrom(p, role)); };
  if (r.goalkeeper) push(r.goalkeeper, "goalkeeper");
  (r.defenders || []).forEach(p => push(p, "defender"));
  (r.midfielders || []).forEach(p => push(p, "midfielder"));
  (r.attackers || []).forEach(p => push(p, "attacker"));
  (r.bench || []).forEach(p => push(p, p.role || (Math.random() < 0.5 ? "midfielder" : "attacker")));
  (r.reserves || []).forEach(p => push(p, p.role || "midfielder"));
  c.squad = squad;
  mcApplyRosterEdits(c);
}

function mcSyncRoster(c) {
  if (!c) return;
  pcEnsureClub(c.club);
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[c.club] : null;
  if (!r || !Array.isArray(c.squad) || !c.squad.length) return;
  const byOvr = c.squad.slice().sort((a, b) => mcOvr(b) - mcOvr(a));
  const used = {};
  const take = (role, n) => {
    const out = [];
    for (const p of byOvr) {
      if (out.length >= n) break;
      if (used[p.cid] || p.role !== role) continue;
      used[p.cid] = true;
      out.push(p);
    }
    return out;
  };
  const gk = take("goalkeeper", 1);
  const def = take("defender", 4);
  const mid = take("midfielder", 4);
  const att = take("attacker", 3);
  const rest = byOvr.filter(p => !used[p.cid]);
  while (att.length < 3 && rest.length) {
    const p = rest.shift();
    used[p.cid] = true;
    att.push(p);
  }
  const bench = rest.splice(0, 7);
  if (gk.length) r.goalkeeper = gk[0];
  if (def.length) r.defenders = def;
  if (mid.length) r.midfielders = mid;
  if (att.length) r.attackers = att;
  r.bench = bench;
  r.reserves = rest;
}

function mcAcademyIntake(c) {
  if (!Array.isArray(c.academy)) c.academy = [];
  const roles = ["goalkeeper", "defender", "defender", "midfielder", "midfielder", "attacker", "attacker"];
  const acad = mcCl(mcNum((c.facilities || {}).academy, 1), 1, 5);
  const n = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const ovr = 46 + Math.floor(Math.random() * 15) + Math.floor(acad / 2);
    const pot = ovr + 8 + Math.floor(Math.random() * (9 + acad * 2));
    c.academy.push(mcMakeCard(mcRandomName(), role, ovr, 16 + Math.floor(Math.random() * 2), pot));
  }
  if (c.academy.length > 10) c.academy.splice(0, c.academy.length - 10);
}

function mcGrow(p) {
  p.age = Math.round(mcNum(p.age, 24)) + 1;
  let ovr = Math.round(mcNum(p.ovr, 60));
  const pot = Math.round(mcNum(p.pot, ovr));
  if (ovr < pot) {
    const room = Math.max(1, pot - ovr);
    let g;
    if (p.age <= 23) g = 1 + Math.floor(Math.random() * Math.min(4, room));
    else if (p.age <= 28) g = Math.random() < 0.65 ? 1 : 0;
    else g = Math.random() < 0.35 ? -1 : 0;
    ovr += g;
  } else if (p.age > 29 && Math.random() < 0.5) {
    ovr -= 1;
  }
  p.ovr = mcCl(ovr, 35, pot);
}

/* --------------------------------------------------------- objectives --- */

function mcSeedObjectives(c) {
  const style = (c.board && c.board.style) || "balanced";
  const objs = [];
  if (style === "win") objs.push({ type: "rank", label: "Finish in the top 4", target: 4 });
  else if (style === "develop") objs.push({ type: "rank", label: "Finish in the top 10", target: 10 });
  else objs.push({ type: "rank", label: "Finish in the top 6", target: 6 });
  objs.push({ type: "cupRun", label: "Reach the " + (c.cupName || "cup") + " semi-final", target: 3 });
  if (style === "develop") objs.push({ type: "promote", label: "Promote an academy player", target: 1 });
  if (style === "win") objs.push({ type: "budget", label: "Finish with a positive budget", target: 1 });
  c.objectives = objs;
  mcEvalObjectives(c);
}

function mcObjValue(c, o) {
  switch (o.type) {
    case "rank": return pcRankOf(c, c.club);
    case "cupRun": return mcNum(c.cupRun, 0);
    case "promote": return mcNum(c.seasonPromotions, 0);
    case "budget": return mcNum(c.budget, 0) >= 0 ? 1 : 0;
    default: return 0;
  }
}

function mcObjDone(c, o) {
  const v = mcObjValue(c, o);
  if (o.type === "rank") return v > 0 && v <= mcNum(o.target, 6);
  return v >= mcNum(o.target, 1);
}

function mcEvalObjectives(c) {
  const objs = Array.isArray(c.objectives) ? c.objectives : [];
  let met = 0;
  for (const o of objs) if (mcObjDone(c, o)) met++;
  c.objectivesMet = met;
  c.objectivesTotal = objs.length;
}

/* ----------------------------------------------------------- transfers -- */

function mcOtherClub(c) {
  const list = (c.clubs || []).filter(x => x !== c.club);
  if (!list.length) return "Unknown";
  return list[Math.floor(Math.random() * list.length)];
}

function mcTransferTarget() {
  const roles = ["goalkeeper", "defender", "defender", "midfielder", "midfielder", "attacker", "attacker"];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const age = 17 + Math.floor(Math.random() * 15);
  const ovr = 52 + Math.floor(Math.random() * 33);
  const pot = Math.min(93, ovr + (age <= 21 ? 8 + Math.floor(Math.random() * 16) : age <= 24 ? 4 + Math.floor(Math.random() * 8) : 1 + Math.floor(Math.random() * 5)));
  return mcMakeCard(mcRandomName(), role, ovr, age, pot);
}

function mcBuildTransferPool(c) {
  if (!c) return;
  if (!Array.isArray(c.transferPool)) c.transferPool = [];
  let guard = 0;
  while (c.transferPool.length < 10 && guard++ < 40) {
    const p = mcTransferTarget();
    if (c.transferPool.some(x => x.player && (x.player.cid === p.cid || x.player.name === p.name))) continue;
    const free = Math.random() < 0.4;
    const price = free ? 0 : Math.round(Math.min(60, mcValue(p) * (1.1 + Math.random() * 0.6)) * 10) / 10;
    c.transferPool.push({ player: p, from: free ? "" : mcOtherClub(c), price: price });
  }
}

function mcBuildMarket(c) {
  if (!c) return;
  const out = [];
  let guard = 0;
  while (out.length < 8 && guard++ < 40) {
    const p = mcTransferTarget();
    if (out.some(x => x.player && (x.player.cid === p.cid || x.player.name === p.name))) continue;
    out.push({
      id: "mk" + out.length + Math.floor(Math.random() * 100000).toString(36),
      player: p,
      club: mcOtherClub(c),
      price: Math.round(Math.min(60, mcValue(p) * (1.2 + Math.random() * 0.7)) * 10) / 10
    });
  }
  c.market = out;
}

function mcSignPlayer(c, pl, cost, label) {
  if (!c || !pl) return;
  cost = mcNum(cost, 0);
  if (cost > 0 && mcNum(c.budget, 0) < cost) return;
  if (Array.isArray(c.squad) && c.squad.some(x => x.cid === pl.cid || x.name === pl.name)) return;
  c.budget = Math.round((mcNum(c.budget, 0) - cost) * 10) / 10;
  if (!Array.isArray(c.squad)) c.squad = [];
  c.squad.push(pl);
  mcLog(c, "Signed " + pl.name + " for " + (cost > 0 ? mcMoney(cost) : "free") + (label ? " \u00b7 " + label : "") + ".");
  mcSave();
}

function mcBuyPlayer(c, mid) {
  if (!c || !Array.isArray(c.market)) return;
  const i = c.market.findIndex(x => x.id === mid);
  if (i < 0) return;
  const item = c.market[i];
  const price = mcNum(item.price, 0);
  if (price > 0 && mcNum(c.budget, 0) < price) return;
  if (Array.isArray(c.squad) && item.player && c.squad.some(x => x.name === item.player.name)) { c.market.splice(i, 1); return; }
  c.budget = Math.round((mcNum(c.budget, 0) - price) * 10) / 10;
  if (!Array.isArray(c.squad)) c.squad = [];
  c.squad.push(item.player);
  c.market.splice(i, 1);
  mcLog(c, "Bought " + (item.player ? item.player.name : "a player") + " from " + (item.club || "the market") + " for " + mcMoney(price) + ".");
  mcSave();
}

function mcPromoteAcademy(c, cid) {
  if (!c || !Array.isArray(c.academy)) return;
  const i = c.academy.findIndex(x => x.cid === cid);
  if (i < 0) return;
  const kid = c.academy[i];
  c.academy.splice(i, 1);
  if (!Array.isArray(c.squad)) c.squad = [];
  c.squad.push(kid);
  c.seasonPromotions = mcNum(c.seasonPromotions, 0) + 1;
  mcLog(c, "Promoted " + kid.name + " (" + mcRoleLabel(kid.role) + ", " + mcOvr(kid) + " OVR) to the first team.");
  mcSave();
}

function mcScoutHire(c) {
  if (!c) return;
  if (!c.scouting) c.scouting = { scouts: [], reports: [], shortlist: [], missions: [], prospects: [], retiredNations: {} };
  const s = c.scouting;
  if (!Array.isArray(s.scouts)) s.scouts = [];
  const cost = 3 + s.scouts.length * 2;
  if (mcNum(c.budget, 0) < cost) { mcShowHub(); return; }
  c.budget = Math.round((mcNum(c.budget, 0) - cost) * 10) / 10;
  const regions = ["Domestic", "Continental", "South America", "Africa", "Asia", "Scandinavia"];
  s.scouts.push({
    id: "sc" + Math.floor(Math.random() * 1000000).toString(36) + Date.now().toString(36),
    name: mcRandomName(),
    region: regions[s.scouts.length % regions.length],
    rating: 50 + Math.floor(Math.random() * 35),
    progress: 0,
    nextIn: 2,
    found: 0
  });
  c.scoutCount = s.scouts.length;
  c.scout = Math.min(5, Math.max(1, Math.ceil(s.scouts.length / 2)));
  mcLog(c, "Hired a scout for " + mcMoney(cost) + ".");
  mcSave();
  mcShowHub();
}

/* ---------------------------------------------------------- season ------ */

function mcComputeEuroRoute(c) {
  if (!c) return null;
  // … same as before but delete the "cwc" return …
  if (rank <= clSlots) return "cl";
  if (rank === clSlots + 1) return "el";
  if (rank === clSlots + 2) return "ecl";
  return null;
}

function mcStartSeason(c, first) {
  if (!c) return;
  c.calDay = CC_CAL_FIRST_DAY;
  c.seasonStats = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
  c.cupRun = 0;
  c.seasonPromotions = 0;
  if (!first) { try { c.euroRoute = mcComputeEuroRoute(c); } catch(e) { c.euroRoute = null; } }
  else { try { c.euroRoute = null; } catch(e) {} }
  c.fixtures = pcBuildFixtures(c);
  mcSeedObjectives(c);
  mcApplyRosterEdits(c);
  mcSyncRoster(c);
  if (!first && c.board) c.board.patience = mcCl(mcNum(c.board.patience, 60) + 10, 0, 100);
  if (!Array.isArray(c.market) || !c.market.length) mcBuildMarket(c);
  if (!Array.isArray(c.transferPool) || !c.transferPool.length) mcBuildTransferPool(c);
  if (!Array.isArray(c.academy)) c.academy = [];
  if (!c.academy.length) mcAcademyIntake(c);
  mcSave();
    try { if (typeof mcProcessTransferWindow === "function") mcProcessTransferWindow(c); } catch (e) {}
}

function mcApplyResult(c, r) {
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
  const ss = c.seasonStats || (c.seasonStats = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });
  const gf = Math.round(mcNum(r.gf, 0));
  const ga = Math.round(mcNum(r.ga, 0));
  ss.played = mcNum(ss.played, 0) + 1;
  if (r.win) ss.wins = mcNum(ss.wins, 0) + 1;
  else if (gf === ga) ss.draws = mcNum(ss.draws, 0) + 1;
  else ss.losses = mcNum(ss.losses, 0) + 1;
  ss.gf = mcNum(ss.gf, 0) + gf;
  ss.ga = mcNum(ss.ga, 0) + ga;
  c.rep = mcCl(mcNum(c.rep, 30) + (r.win ? 0.4 : gf === ga ? 0 : -0.25), 1, 99);
  if (r.kind === "cup" && typeof r.round === "number") c.cupRun = Math.max(mcNum(c.cupRun, 0), Math.round(mcNum(r.round, 0)));
}

function mcEndSeason(c) {
  if (!c) return;
  const table = pcTable(c);
  const rank = pcRankOf(c, c.club);
  const cup = pcCupResult(c);
  if (!Array.isArray(c.history)) c.history = [];
  const last = c.history.length ? c.history[c.history.length - 1] : null;
  if (!last || mcNum(last.season, -1) !== mcNum(c.season, -1)) {
    c.history.push({ season: c.season, rank: rank, cupWon: cup.status === "won", table: table.length || 20 });
  }
  mcEvalObjectives(c);
  const met = mcNum(c.objectivesMet, 0);
  const total = mcNum(c.objectivesTotal, 0);
  const conf = mcNum((c.board || {}).confidence, 60);
  if (conf <= 10 || (conf < 30 && total > 0 && met === 0)) c.sacked = true;
  mcSave();
}

function mcAdvanceSeason() {
  const c = mcState;
  if (!c || c.sacked) return;
  const table = pcTable(c);
  const rank = pcRankOf(c, c.club);
  const tableN = table.length || 20;
  const cup = pcCupResult(c);
  let prize = Math.max(2, Math.round((26 - rank * 1.1) * 10) / 10);
  if (cup.status === "won") prize += 8;
  prize = Math.round(prize * 10) / 10;
  c.budget = Math.round((mcNum(c.budget, 0) + prize) * 10) / 10;
  mcLog(c, "Season prize money: " + mcMoney(prize) + ".");
  for (const p of c.squad || []) mcGrow(p);
  for (const k of c.academy || []) mcGrow(k);
  c.rep = mcCl(mcNum(c.rep, 30) + (rank <= 3 ? 2 : rank > Math.ceil(tableN / 2) ? -1 : 0.6) + (cup.status === "won" ? 2 : 0), 1, 99);
  mcEvalObjectives(c);
  const met = mcNum(c.objectivesMet, 0);
  const total = mcNum(c.objectivesTotal, 0);
  if (c.board) {
    c.board.patience = mcCl(mcNum(c.board.patience, 60) + (met >= total ? 12 : -12), 0, 100);
    c.board.confidence = mcCl(mcNum(c.board.confidence, 60) + 5, 0, 100);
  }
  let mv = { moved: false };
  try { if (typeof pcApplyPromotionRelegation === "function") mv = pcApplyPromotionRelegation(c) || mv; } catch (e) {}
  if (mv.moved) {
    mcLog(c, mv.direction === "up"
      ? "Promoted to " + mv.to + " - a top-half finish delivers promotion."
      : "Relegated to " + mv.to + " - the board expect a promotion push next season.");
  }
  c.season = mcNum(c.season, 1) + 1;
  mcAcademyIntake(c);
  mcBuildMarket(c);
  c.transferPool = [];
  mcBuildTransferPool(c);
  mcStartSeason(c, false);
  mcSave();
  mcMenu = "home";
  mcShowHub();
}

/* --------------------------------------------------------- match flow --- */

function mcIsGroupMatch() {
  return !!(mcContext && mcContext.fixture && mcContext.fixture.kind === "league");
}

function mcPlayNext() {
  const c = mcState;
  if (!c) return;
  if (typeof matchRunning !== "undefined" && (matchRunning || (typeof awaitingStart !== "undefined" && awaitingStart))) return;
  mcTickerStop();
  const f = pcNextUserFixture(c);
  if (!f || f.day > c.calDay) { mcShowHub(); return; }
  mcApplyRosterEdits(c);
  mcSyncRoster(c);
  selectedTeam = c.club;
  const roster = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[c.club] : null;
  playerName = (roster && roster.attackers && roster.attackers[2] && roster.attackers[2].name)
    ? roster.attackers[2].name : (c.managerName || "The Manager");
  mcContext = { opponent: pcFixtureOpponent(c, f), fixture: f };
  mcMidMatch = false;
  const ms = document.getElementById("managerScreen");
  if (ms) ms.style.display = "none";
  const br = document.getElementById("bracketScreen");
  if (br) br.style.display = "none";
  const g = document.getElementById("gameScreen");
  if (g) g.style.display = "none";
  if (typeof enterScreen === "function") enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function mcResumeMatch() {
  const ms = document.getElementById("managerScreen");
  if (ms) ms.style.display = "none";
  mcMidMatch = false;
  if (typeof enterScreen === "function") enterScreen("gameScreen", "block");
  matchRunning = true;
  startTimer();
}

function mcEndMatch() {
  const c = mcState;
  const ctx = mcContext;
  mcContext = null;
  mcMidMatch = false;
  if (!c || !ctx || !ctx.fixture) { if (c) mcShowHub(); return; }
  const f = ctx.fixture;
  const m = f.match;
  const active = c.club;
  const opp = ctx.opponent || pcFixtureOpponent(c, f);
  const userGoals = Math.round(mcNum(typeof blueScore !== "undefined" ? blueScore : 0, 0));
  const oppGoals = Math.round(mcNum(typeof redScore !== "undefined" ? redScore : 0, 0));
  if (m.team1 === active) { m.score1 = userGoals; m.score2 = oppGoals; }
  else { m.score1 = oppGoals; m.score2 = userGoals; }
  let pensTxt = "";
  let userWon = userGoals > oppGoals;
  if (userGoals === oppGoals && f.kind === "cup") {
    const uw = typeof penaltyWinner !== "undefined" && penaltyWinner === "blue";
    userWon = uw;
    let pu = uw ? 4 : 3;
    let po = uw ? 3 : 4;
    if (typeof penaltyScore !== "undefined" && penaltyScore) {
      pu = uw ? Math.round(mcNum(penaltyScore.blue, 4)) : Math.round(mcNum(penaltyScore.red, 3));
      po = uw ? Math.round(mcNum(penaltyScore.red, 3)) : Math.round(mcNum(penaltyScore.blue, 4));
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
  const r = { win: userGoals > oppGoals, gf: userGoals, ga: oppGoals, opp: opp, kind: f.kind, round: f.round };
  const trophy = mcTrophyFor(c, f, userWon);
  if (trophy) r.trophy = trophy;
  mcApplyResult(c, r);
  mcSave();
  const scoreLine = active + " " + userGoals + " \u2014 " + oppGoals + " " + opp + pensTxt;
  let resultText;
  if (userGoals > oppGoals) resultText = active + " beat " + opp + " " + userGoals + "-" + oppGoals + "!";
  else if (userGoals < oppGoals) resultText = active + " lost to " + opp + " " + oppGoals + "-" + userGoals + ". Time to respond.";
  else resultText = active + " drew " + userGoals + "-" + oppGoals + " with " + opp + ".";
  if (trophy) resultText = "TROPHY! " + active + " won the " + trophy + "!";
  showEndScreen(resultText, scoreLine, function () { mcShowHub(); }, { blue: active, red: opp }, trophy);
}

function mcQuickSim() {
  const c = mcState;
  if (!c) return;
  if (typeof matchRunning !== "undefined" && matchRunning) return;
  mcTickerStop();
  const f = pcNextUserFixture(c);
  if (!f || f.day > c.calDay) { mcShowHub(); return; }
  const active = c.club;
  const opp = pcFixtureOpponent(c, f);
  const style = (c.board || {}).style;
  const boost = style === "win" ? 0.12 : style === "develop" ? -0.05 : 0;
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
  const r = { win: userWon, gf: gf, ga: ga, opp: opp, kind: f.kind, round: f.round };
  const trophy = mcTrophyFor(c, f, userWon);
  if (trophy) r.trophy = trophy;
  mcApplyResult(c, r);
  mcSave();
  const scoreLine = active + " " + gf + " \u2014 " + ga + " " + opp + (pens ? " (" + Math.min(pens.user, pens.opp) + "-" + Math.max(pens.user, pens.opp) + " pens)" : "");
  let resultText;
  if (userWon) resultText = active + " beat " + opp + " in simulation.";
  else if (gf === ga) resultText = active + " drew with " + opp + " in simulation.";
  else resultText = active + " lost to " + opp + " in simulation.";
  if (trophy) resultText = "TROPHY! " + active + " won the " + trophy + "!";
  showEndScreen(resultText, scoreLine, function () { mcShowHub(); }, { blue: active, red: opp }, trophy);
}

function mcResumeFromEnd() {
  mcShowHub();
}

/* ------------------------------------------------------ day simulation -- */

function mcSimTo(c, targetDay) {
  if (!c) return;
  targetDay = pcCl(targetDay, c.calDay, CC_CAL_END_DAY);
  if (targetDay <= c.calDay) return;
  pcSimPast(c, targetDay);
  const uf = pcNextUserFixture(c);
  const stop = uf && uf.day < targetDay ? uf.day : targetDay;
  const days = Math.max(0, stop - c.calDay);
  c.calDay = stop;
  if (days > 0 && typeof window !== "undefined" && typeof window.mcScoutingTick === "function") {
    window.mcScoutingTick(c, Math.min(8, Math.max(1, Math.ceil(days / 7))));
  }
  if (typeof ccWorldNewsBatch === "function" && Math.random() < 0.35) ccWorldNewsBatch(c, 1);
  mcSave();
}

function mcAdvance() {
  const c = mcState;
  if (!c) return;
  if (pcSeasonDone(c)) { mcShowSeasonSummary(); return; }
  const nxt = pcNextAnyFixture(c);
  const target = nxt ? Math.min(nxt.day, c.calDay + 7) : Math.min(CC_CAL_END_DAY, c.calDay + 7);
  mcSimTo(c, target);
  mcShowHub();
}

/* ------------------------------------------------- day-by-day advance ---
   The hub's Continue runs the day ticker (one visible day every 700ms,
   stopping at the next fixture or season end); Next Day steps exactly one.
   The Stop button halts it via mousedown too (mcTickerHalt), so the click
   survives the hub re-rendering under the cursor on every tick.
   mcAdvance() keeps its old jump behaviour for fast-forward loops. */

function mcDayStepOnce(c) {
  pcSimPast(c, c.calDay + 1);
  const uf = pcNextUserFixture(c);
  const stop = uf && uf.day < c.calDay + 1 ? uf.day : c.calDay + 1;
  pcAdvanceDays(c, stop - c.calDay);
  c.calDay = stop;
    c.calDay = stop;
  try { if (typeof mcProcessTransferWindow === "function") mcProcessTransferWindow(c); } catch (e) {}
}

function mcDayTickEvent(c) {
  if (c.calDay % 7 === 0 && typeof window !== "undefined" && typeof window.mcScoutingTick === "function") {
    window.mcScoutingTick(c, 1);
  }
  if (typeof ccWorldNewsBatch === "function" && Math.random() < 0.06) ccWorldNewsBatch(c, 1);
}

function mcTickerStop() {
  if (mcTicker !== null && typeof clearInterval === "function") clearInterval(mcTicker);
  mcTicker = null;
  mcTicking = false;
}

function mcTickerStart() {
  const c = mcState;
  if (!c || mcTicking) return;
  if (typeof matchRunning !== "undefined" && matchRunning) return;
  let sinceSave = 0;
  mcTicking = true;
  mcTicker = setInterval(function () {
    const cc = mcState;
    if (!mcTicking || !cc || pcSeasonDone(cc) || (typeof matchRunning !== "undefined" && matchRunning)) {
      mcTickerStop();
      mcShowHub();
      return;
    }
    const uf = pcNextUserFixture(cc);
    if ((uf && uf.day <= cc.calDay) || cc.calDay >= CC_CAL_END_DAY) {
      mcTickerStop();
      mcShowHub();
      return;
    }
    mcDayStepOnce(cc);
    mcDayTickEvent(cc);
    if (++sinceSave >= 10) { mcSave(); sinceSave = 0; }
    mcShowHub();
  }, 700);
}

function mcTickerToggle() {
  if (mcTicking) mcTickerStop();
  else mcTickerStart();
  mcShowHub();
}

function mcTickerHalt() {
  if (!mcTicking) return;
  mcTickerStop();
  mcShowHub();
}

function mcDayStep() {
  const c = mcState;
  if (!c || mcTicking) return;
  if (typeof matchRunning !== "undefined" && matchRunning) return;
  if (pcSeasonDone(c)) { mcShowSeasonSummary(); return; }
  const uf = pcNextUserFixture(c);
  if ((uf && uf.day <= c.calDay) || c.calDay >= CC_CAL_END_DAY) { try { mcShowHub(); } catch (e) {} return; }
  mcDayStepOnce(c);
  mcDayTickEvent(c);
  mcSave();
  try { mcShowHub(); } catch (e) {}
}

/* Bulk-sim a single user fixture without the end-of-match screen. */
function mcSimUserMatch(c, f) {
  if (!c || !f || !f.match || f.match.played) return;
  const m = f.match;
  const active = c.club;
  const opp = pcFixtureOpponent(c, f);
  const style = (c.board || {}).style;
  const boost = style === "win" ? 0.12 : style === "develop" ? -0.05 : 0;
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
  mcApplyResult(c, { win: userWon, gf: gf, ga: ga, opp: opp, kind: f.kind, round: f.round });
}

/* Full simulate-to-date for the manager career. */
function mcSimToFull(c, targetDay) {
  if (!c) return;
  if (typeof c.calDay !== "number" || !isFinite(c.calDay) || c.calDay < 1) c.calDay = CC_CAL_FIRST_DAY;
  targetDay = pcCl(targetDay, c.calDay, CC_CAL_END_DAY);
  if (targetDay <= c.calDay) return;
  let guard = 0;
  while (guard++ < 800) {
    const next = pcNextAnyFixture(c);
    if (!next || next.day > targetDay) break;
    if (pcIsUserFixture(c, next)) mcSimUserMatch(c, next);
    else pcSimResult(c, next);
    pcFillCupNext(c);
  }
  const days = Math.max(0, targetDay - c.calDay);
  c.calDay = targetDay;
  if (days > 0 && typeof window !== "undefined" && typeof window.mcScoutingTick === "function") {
    window.mcScoutingTick(c, Math.min(8, Math.max(1, Math.ceil(days / 7))));
  }
  if (typeof ccWorldNewsBatch === "function" && Math.random() < 0.35) ccWorldNewsBatch(c, 1);
      try { if (typeof mcProcessTransferWindow === "function") mcProcessTransferWindow(c); } catch (e) {}
  mcSave();
}

window.mcSimToDayFromCal = function (dayNum) {
  try {
    if (typeof mcState === "undefined" || !mcState) return;
    if (typeof matchRunning !== "undefined" && matchRunning) return;
    const c = mcState;
    if (typeof c.calDay !== "number" || !isFinite(c.calDay) || c.calDay < 1) c.calDay = CC_CAL_FIRST_DAY;

    const target = pcCl((typeof pcNum === "function") ? pcNum(dayNum, c.calDay) : Number(dayNum),
                        c.calDay, CC_CAL_END_DAY);
    if (target === c.calDay) {
      try { if (typeof mcShowHub === "function") mcShowHub(); } catch (e) {}
      return;
    }

    const active = c.club || c.clubName;
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

    try { if (typeof mcTickerStop === "function") mcTickerStop(); } catch (e) {}
    try { mcSimToFull(c, target); }
    catch (e) { if (window.console) console.error("mcSimToDayFromCal sim failed:", e); }
    try { if (typeof mcShowHub === "function") mcShowHub(); } catch (e) {}
  } catch (e) {
    if (typeof window !== "undefined" && window.console) console.error("mcSimToDayFromCal failed:", e);
  }
};

function mcCalNav(delta) {
  let y = mcView.y;
  let m = mcView.m + mcNum(delta, 0);
  while (m < 0) { m += 12; y -= 1; }
  while (m > 11) { m -= 12; y += 1; }
  mcView = { y: y, m: m };
  mcShowHub();
}

function mcCalToday() {
  const c = mcState;
  if (!c) return;
  const d = ccCalDate(c, c.calDay);
  mcView = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  mcShowHub();
}

function mcCalGoTo(y, m) {
  mcView = { y: mcNum(y, 2026), m: mcCl(m, 0, 11) };
  mcShowHub();
}

/* --------------------------------------------------------- tab panels --- */

function mcObjMeters(c) {
  const objs = Array.isArray(c.objectives) ? c.objectives : [];
  if (!objs.length) return pcEmptyT("Objectives", "No targets set this season.");
  return objs.map(o => {
    const v = mcObjValue(c, o);
    const done = mcObjDone(c, o);
    const target = Math.max(1, mcNum(o.target, 1));
    const val = Math.min(v, target);
    const show = o.type === "rank" ? (v > 0 ? pcOrdinal(v) : "-") + " / " + pcOrdinal(target) : Math.round(v) + " / " + target;
    return pcMeter(o.label, val, target, { tone: done ? "good" : "", show: show });
  }).join("");
}

function mcNextLine(c) {
  return typeof pcNextLine === "function" ? pcNextLine(c) : "";
}

function mcHomeHTML(c) {
  const uf = pcNextUserFixture(c);
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
      pcRow("Venue", uf.match.team1 === c.club ? "Home" : "Away") +
      pcRow("Date", pcDateLabel(c, uf.day)) +
      pcRow("Manager", c.managerName || "The Manager"));
  }
  const ss = c.seasonStats || {};
  const pts = mcNum(ss.wins, 0) * 3 + mcNum(ss.draws, 0);
  const record = pcBlock("Season " + pcNum(c.season, 1), pts + " pts",
    pcRow("Record", mcNum(ss.played, 0) + " played \u00b7 " + mcNum(ss.wins, 0) + "W " + mcNum(ss.draws, 0) + "D " + mcNum(ss.losses, 0) + "L") +
    pcRow("Goals", mcNum(ss.gf, 0) + " for / " + mcNum(ss.ga, 0) + " against") +
    pcRow("Budget", mcMoney(c.budget)) +
    pcRow("League position", pcOrdinal(pcRankOf(c, c.club))));
  mcEvalObjectives(c);
  const objs = pcBlock("Board objectives", mcNum(c.objectivesMet, 0) + " of " + mcNum(c.objectivesTotal, 0) + " met", mcObjMeters(c));
  return nextBlock + record + objs + pcTableHTML(c);
}

function mcSquadHTML(c) {
  const squad = (c.squad || []).slice().sort((a, b) => mcOvr(b) - mcOvr(a));
  if (!squad.length) return pcEmptyT("Squad", "No players registered.");
  const rows = squad.map((p, i) => {
    const wage = (typeof p.wage === "number" && p.wage > 0)
      ? p.wage
      : Math.round(Math.pow(mcOvr(p), 2) * 6 / 100) * 100;
    const wageLabel = "£" + Math.round(wage / 1000) + "K/wk";
    const yrs = (typeof p.contractEnd === "number") ? p.contractEnd - (c.season || 1) : "-";
    const warn = (yrs !== "-" && yrs <= 1) ? ' style="color:#ff8080;font-weight:800"' : "";
    return '<tr class="' + (i === 0 ? "playerRow" : "") + '">' +
      '<td class="rank">' + (i + 1) + "</td>" +
      '<td class="team">' + mcEsc(p.name) + "</td>" +
      "<td>" + mcRoleLabel(p.role) + "</td>" +
      '<td class="gd">' + mcNum(p.age, 0) + "</td>" +
      '<td class="pts">' + mcOvr(p) + "</td>" +
      '<td class="pts">' + mcNum(p.pot, 0) + "</td>" +
      "<td>" + wageLabel + "</td>" +
      "<td" + warn + ">" + (yrs === "-" ? "-" : yrs + "y") + "</td>" +
      '<td><button class="pcMini wcGhostBtn" onclick="mcRenewById(\'' + mcAttr(p.cid) + '\')" title="Negotiate a new contract">Renew</button></td></tr>';
  }).join("");
  return pcBlock("First team", squad.length + " players \u00b7 best OVR " + mcBestOvr(c),
    '<div class="match tableCard"><table class="leagueTable">' +
    "<thead><tr><th>#</th><th>Player</th><th>Pos</th><th>Age</th><th>OVR</th><th>POT</th><th>Wage</th><th>Cont.</th><th></th></tr></thead>" +
    "<tbody>" + rows + "</tbody></table></div>" +
    '<div class="pcHint" style="margin-top:8px">Squad roles are set in the Roles tab. Use <b>Renew</b> to negotiate a new wage and contract length with the player and their agent.</div>');
}

function mcScheduleHTML(c) {
  const active = c.club;
  const entries = pcFixtureEntries(c);
  const byDay = {};
  for (const e of entries) (byDay[e.day] = byDay[e.day] || []).push(e);
  const legend = '<span><i class="lg">L</i> ' + mcEsc(c.league) + "</span>" +
    '<span><i class="cup">C</i> ' + mcEsc(c.cupName) + "</span>" +
    '<span class="calSpan">Season ' + pcNum(c.season, 1) + " \u00b7 Day " + pcNum(c.calDay, 1) + "</span>";
  const cal = (typeof ccCalMonthGridHTML === "function") ? ccCalMonthGridHTML({
    y: mcView.y,
    m: mcView.m,
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
      return '<span class="calChip ' + e.type + (e.played ? " done" : "") + (mine ? " mine" : "") + '" title="' + mcAttr(tip) + '">' +
        "<i>" + (e.type === "cup" ? "C" : "L") + "</i>" + mcEsc(short) + "</span>";
    }
  }) : "";
  const upcoming = c.fixtures.filter(f => pcValidFixture(f) && !f.played).slice(0, 5);
  const results = c.fixtures.filter(f => pcValidFixture(f) && f.played).slice(-6).reverse();
  const upLines = upcoming.map(f =>
    '<div class="pcLine"><span>' + mcEsc(pcFixtureLabel(c, f)) + "</span><b>" +
    mcEsc((f.match.team1 === active ? "vs " : "at ") + (f.match.team1 === active ? f.match.team2 : f.match.team1)) + "</b></div>").join("");
  const resLines = results.map(f => pcFixtureResultLine(c, f)).join("");
  const resBlock = results.length
    ? pcBlock("Results", "Last " + results.length, resLines)
    : pcEmptyT("Results", "No matches played yet.");
  return cal +
    (upcoming.length ? pcBlock("Upcoming", upcoming.length + " fixtures", upLines) : pcEmptyT("Upcoming", "No fixtures left this season.")) +
    resBlock;
}

function mcAcademyHTML(c) {
  const kids = c.academy || [];
  const s = c.scouting || {};
  const prospects = Array.isArray(s.prospects) ? s.prospects : [];
  const missions = Array.isArray(s.missions) ? s.missions : [];
  const acad = mcCl(mcNum((c.facilities || {}).academy, 1), 1, 5);
  const rows = kids.map(k =>
    '<div class="pcLine"><span>' + mcEsc(k.name) + ' <i class="pcHint">' + mcRoleLabel(k.role) + " \u00b7 age " + mcNum(k.age, 0) + " \u00b7 OVR " + mcOvr(k) + " / pot " + mcNum(k.pot, 0) + '</i></span>' +
    '<b><button class="pcMini wcPrimaryBtn" onclick="mcPromoteById(\'' + k.cid + '\')">Promote</button> ' +
    '<button class="pcMini wcGhostBtn" onclick="mcScoutRecruitFromAcademyById(\'' + c.id + '\',\'' + k.cid + '\')">Release</button></b></div>').join("");
  const head = pcBlock("Youth academy", "Level " + acad + " \u00b7 " + kids.length + " signed",
    pcRow("Next intake", "Start of next season") +
    pcRow("Scout missions out", missions.length) +
    pcRow("Promoted this season", mcNum(c.seasonPromotions, 0)) +
    '<div class="pcHint">Sign scouted prospects from the Scouting tab, then promote them to the first team here.</div>');

  let out = head;
  if (prospects.length) {
    out += pcBlock("Signable prospects", prospects.length + " waiting", prospects.map(p =>
      '<div class="pcLine"><span>' + mcEsc(p.name) + ' <i class="pcHint">' + mcEsc(p.nation || "Domestic") + " \u00b7 " + mcRoleLabel(p.role) + " \u00b7 age " + mcNum(p.age, 0) + " \u00b7 OVR " + mcOvr(p) + " / pot " + mcNum(p.pot, 0) + '</i></span>' +
      '<b><button class="pcMini wcPrimaryBtn" onclick="mcScoutSignProspectById(\'' + c.id + '\',\'' + p.cid + '\')">Sign</button> ' +
      '<button class="pcMini wcGhostBtn" onclick="mcScoutPassProspectById(\'' + c.id + '\',\'' + p.cid + '\')">Pass</button></b></div>').join(""));
  }
  out += kids.length ? pcBlock("Prospects", kids.length + " in the academy", rows) : pcEmptyT("Prospects", "No academy players. Send scouts out to find young talent.");
  return out;
}

function mcTransfersHTML(c) {
  const budget = mcNum(c.budget, 0);
  const s = c.scouting || {};
  const short = s.shortlist || [];
  const pool = c.transferPool || [];
  let out = pcBlock("Transfer budget", mcMoney(budget),
    '<div class="pcHint">Sign from your shortlist or the scouted market. New arrivals join the first-team squad immediately.</div>');
  out += short.length ? pcBlock("Shortlist", short.length + " targets", short.map(x => {
    const price = mcNum(x.price, 0);
    const afford = price === 0 || budget >= price;
    return '<div class="pcOffer"><div><b>' + mcEsc(x.name) + "</b> <em>" + mcEsc(x.club || "Free agent") + "</em>" +
      '<div class="pcHint">' + mcRoleLabel(x.role) + " \u00b7 OVR " + mcNum(x.ovr, 0) + " / pot " + mcNum(x.pot, 0) +
      " \u00b7 age " + mcNum(x.age, 0) + " \u00b7 " + (price > 0 ? mcMoney(price) : "Free") + "</div></div>" +
      "<div>" + (afford ? '<button class="pcMini wcPrimaryBtn" onclick="mcSignShortlist(\'' + mcAttr(x.cid) + '\')">Sign</button>'
        : '<span class="pcHint">Need ' + mcMoney(price) + "</span>") + "</div></div>";
  }).join("")) : pcEmptyT("Shortlist", "Shortlist players from the Scouting tab, then sign them here.");
  out += pool.length ? pcBlock("Scouted market", pool.length + " available", pool.map(x => {
    const price = mcNum(x.price, 0);
    const afford = price === 0 || budget >= price;
    const p = x.player || {};
    return '<div class="pcOffer"><div><b>' + mcEsc(p.name) + "</b> <em>" + mcEsc(x.from || "Free agent") + "</em>" +
      '<div class="pcHint">' + mcRoleLabel(p.role) + " \u00b7 OVR " + mcOvr(p) + " / pot " + mcNum(p.pot, 0) +
      " \u00b7 age " + mcNum(p.age, 0) + " \u00b7 " + (price > 0 ? mcMoney(price) : "Free") + "</div></div>" +
      "<div>" + (afford ? '<button class="pcMini wcPrimaryBtn" onclick="mcSignPool(\'' + mcAttr(p.cid) + '\')">Sign</button>'
        : '<span class="pcHint">Need ' + mcMoney(price) + "</span>") + "</div></div>";
  }).join("")) : pcEmptyT("Scouted market", "No targets scouted yet.");
  const squad = (c.squad || []).slice().sort((a, b) => mcOvr(b) - mcOvr(a));
  const sellable = squad.length > 12;
  out += pcBlock("Squad", squad.length + " players", squad.map(p => {
    const fee = Math.round(mcValue(p) * 0.85 * 10) / 10;
    return '<div class="pcLine"><span>' + mcEsc(p.name) + ' <i class="pcHint">' + mcRoleLabel(p.role) + " \u00b7 OVR " + mcOvr(p) + "</i></span>" +
      "<b>" + (sellable ? '<button class="pcMini wcGhostBtn" onclick="mcSellPlayer(\'' + mcAttr(p.cid) + '\')">Sell ' + mcMoney(fee) + "</button>" : mcMoney(mcValue(p))) + "</b></div>";
  }).join("") + (sellable ? "" : '<div class="pcHint" style="margin-top:6px">You must keep at least 12 players.</div>'));
  return out;
}

function mcBoardHTML(c) {
  mcEvalObjectives(c);
  const b = c.board || {};
  const styleLabel = b.style === "win" ? "Win now" : b.style === "develop" ? "Develop youth" : "Balanced";
  const vision = pcBlock("Club vision", styleLabel,
    '<div class="pcHint">The board judges you against these targets at the end of every season.</div>' + mcObjMeters(c));
  const fac = c.facilities || {};
  const rows = ["training", "medical", "academy"].map(kind => {
    const lvl = mcCl(mcNum(fac[kind], 1), 1, 5);
    const cost = lvl * 4;
    const afford = lvl < 5 && mcNum(c.budget, 0) >= cost;
    return '<div class="pcLine"><span>' + kind.charAt(0).toUpperCase() + kind.slice(1) + " \u00b7 Level " + lvl + "</span><b>" +
      (lvl >= 5 ? "Maxed" : afford ? '<button class="pcMini wcGhostBtn" onclick="mcUpgradeFacility(\'' + kind + '\')">Upgrade ' + mcMoney(cost) + "</button>" : "Need " + mcMoney(cost)) +
      "</b></div>";
  }).join("");
  return vision + pcBlock("Facilities", "Level " + mcCl(mcNum(fac.training, 1), 1, 5) + "+", rows);
}

/* ── Transfer window ───────────────────────────────────────────────── */
function mcTransferWindow(c) {
  if (!c) return null;
  const day = mcNum(c.calDay, 1);
  const summerStart = (typeof ccCalDayFor === "function") ? ccCalDayFor(c, 8, 1) : 1;
  const summerEnd   = (typeof ccCalDayFor === "function") ? ccCalDayFor(c, 9, 1) : 32;
  const winterStart = (typeof ccCalDayFor === "function") ? ccCalDayFor(c, 1, 1) : 154;
  const winterEnd   = (typeof ccCalDayFor === "function") ? ccCalDayFor(c, 2, 1) : 185;
  if (day >= summerStart && day <= summerEnd) {
    return { open: true, label: "Summer window", start: summerStart, end: summerEnd };
  }
  if (day >= winterStart && day <= winterEnd) {
    return { open: true, label: "Winter window", start: winterStart, end: winterEnd };
  }
  // Not open — report the next one.
  if (day < winterStart) {
    return { open: false, label: "Winter window", start: winterStart, end: winterEnd, daysUntil: winterStart - day };
  }
  if (day < summerStart) {
    return { open: false, label: "Summer window", start: summerStart, end: summerEnd, daysUntil: summerStart - day };
  }
  // Between Sep 1 and Jan 1 — the winter one is next.
  return { open: false, label: "Winter window", start: winterStart, end: winterEnd, daysUntil: winterStart + 365 - day };
}

function mcTransferWindowOpen(c) {
  const w = mcTransferWindow(c);
  return !!(w && w.open);
}

/* ── Club / roster access ──────────────────────────────────────────── */
function mcRosterForClub(club) {
  if (!club) return [];
  const ai = (typeof getAiSquad === "function") ? getAiSquad(club) : null;
  if (Array.isArray(ai) && ai.length) return ai;
  const r = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
  if (!r) return [];
  const out = [];
  const push = function (p, role) {
    if (!p || !p.name) return;
    const clone = Object.assign({}, p);
    clone.role = clone.role || role;
    out.push(clone);
  };
  push(r.goalkeeper, "goalkeeper");
  for (const p of (r.defenders || [])) push(p, "defender");
  for (const p of (r.midfielders || [])) push(p, "midfielder");
  for (const p of (r.attackers || [])) push(p, "attacker");
  return out;
}

function mcAllMarketClubs(c) {
  const mine = String(c && (c.clubName || c.club) || "").toLowerCase();
  const seen = {};
  const groups = [];
  for (const lg of MYCLUB_LEAGUES) {
    const list = (lg.clubs || []).slice()
      .filter(function (club) {
        const k = String(club).toLowerCase();
        return k !== mine && !seen[k];
      })
      .sort(function (a, b) { return String(a).localeCompare(String(b)); });
    if (!list.length) continue;
    for (const club of list) seen[String(club).toLowerCase()] = true;
    groups.push({ league: lg.name, clubs: list });
  }
  const others = [];
  if (typeof TEAM_ROSTERS !== "undefined") {
    for (const club of Object.keys(TEAM_ROSTERS)) {
      const k = String(club).toLowerCase();
      if (k === mine) continue;
      if (seen[k]) continue;
      if (!mcRosterForClub(club).length) continue;
      seen[k] = true;
      others.push(club);
    }
  }
  if (others.length) {
    others.sort(function (a, b) { return String(a).localeCompare(String(b)); });
    groups.push({ league: "Other clubs", clubs: others });
  }
  return groups;
}

/* ── Send offer ────────────────────────────────────────────────────── */
function mcSendOffer(idx, sellerClub) {
  const c = mcState;
  if (!c) return;
  const roster = mcRosterForClub(sellerClub);
  const src = roster[idx];
  if (!src) { alert("Player not found."); return; }

  const player = mcMakeCard(
    src.name, src.role || "midfielder",
    mcOvr(src), mcNum(src.age, 24),
    Math.max(mcOvr(src), mcNum(src.pot, mcOvr(src) + 3))
  );
  player.wage = Math.round(Math.pow(mcOvr(player), 2) * 6 / 100) * 100;
  player.contractEnd = (c.season || 1) + 3;

  if (typeof window.Negotiation === "undefined") {
    alert("Negotiation module failed to load.");
    return;
  }
  if (window.Negotiation.isOnCooldown(c, player)) {
    alert("You cannot approach " + player.name + " yet.");
    return;
  }

  const windowOpen = mcTransferWindowOpen(c);
  window.Negotiation.start({
    kind: "transfer",
    career: c,
    player: player,
    sellerClub: sellerClub,
    deferred: !windowOpen,
    onComplete: function () { mcSave(); mcShowHub(); }
  });
}

window.mcSetMarketClub = function (club) {
  const c = mcState;
  if (!c) return;
  c.marketClub = club;
  mcSave();
  mcShowHub();
};

window.mcCancelPendingDeal = function (id) {
  const c = mcState;
  if (!c || !Array.isArray(c.pendingDeals)) return;
  const i = c.pendingDeals.findIndex(function (d) { return d.id === id; });
  if (i < 0) return;
  const d = c.pendingDeals[i];
  const refund = mcNum(d.fee, 0) + mcNum(d.signingBonus, 0);
  c.budget = Math.round((mcNum(c.budget, 0) + refund) * 10) / 10;
  c.pendingDeals.splice(i, 1);
  mcLog(c, "Cancelled the deal for " + d.name + " - " + mcMoney(refund) + " refunded.");
  mcSave();
  mcShowHub();
};

/* ── Called automatically when the window opens ────────────────────── */
function mcProcessTransferWindow(c) {
  if (!c || !Array.isArray(c.pendingDeals) || !c.pendingDeals.length) return 0;
  if (!mcTransferWindowOpen(c)) return 0;
  let moved = 0;
  for (const d of c.pendingDeals) {
    if (!d || !d.player) continue;
    if (!Array.isArray(c.squad)) c.squad = [];
    const p = d.player;
    p.wage = mcNum(d.wage, 0);
    p.contractEnd = mcNum(c.season, 1) + mcNum(d.length, 3);
    p.squadRole = d.squadRole;
    p.acquiredFor = d.fee;
    p.acquiredSeason = mcNum(c.season, 1);
    c.squad.push(p);
    mcLog(c, d.name + " joined from " + (d.fromClub || "free agent") +
      " for " + mcMoney(d.fee) + " as agreed last window.");
    moved++;
  }
  c.pendingDeals = [];
  if (moved) {
    mcSave();
    if (typeof mcNewsPush === "function") {
      try { mcNewsPush(c, "signing", { club: c.clubName, player: moved + " new arrival" + (moved > 1 ? "s" : "") }); } catch (e) {}
    }
  }
  return moved;
}

function mcMarketHTML(c) {
  const budget = mcNum(c.budget, 0);
  const win = mcTransferWindow(c);
  const winLabel = win && win.open
    ? win.label + " OPEN"
    : (win ? "Closed \u2014 " + win.label + " in " + win.daysUntil + "d" : "Closed");

  let out = pcBlock("Transfer Market", winLabel,
    '<div class="pcHint">' +
      (win && win.open
        ? "The transfer window is open. Any deal you agree here completes immediately."
        : "The window is closed. Deals agreed now will be completed when it reopens.") +
    "</div>" +
    pcRow("Budget", mcMoney(budget)) +
    (Array.isArray(c.pendingDeals) && c.pendingDeals.length
      ? pcRow("Pending deals", String(c.pendingDeals.length))
      : ""));

  // ── Pending deals ──────────────────────────────────────────────────
  if (Array.isArray(c.pendingDeals) && c.pendingDeals.length) {
    out += pcBlock("Pending transfers", c.pendingDeals.length + " awaiting window",
      c.pendingDeals.map(function (d) {
        return '<div class="pcOffer"><div><b>' + mcEsc(d.name) + "</b> <em>" +
          mcEsc(d.fromClub || "Free agent") + "</em>" +
          '<div class="pcHint">Fee ' + mcMoney(mcNum(d.fee, 0)) +
          " &middot; £" + Math.round(mcNum(d.wage, 0) / 1000) + "K/wk &middot; " +
          mcNum(d.length, 3) + "y" +
          (mcNum(d.signingBonus, 0) > 0 ? " &middot; Bonus " + mcMoney(d.signingBonus) : "") +
          "</div></div>" +
          '<div><button class="pcMini wcGhostBtn" onclick="mcCancelPendingDeal(\'' +
          mcAttr(d.id) + '\')">Cancel</button></div></div>';
      }).join(""));
  }

  // ── Browse clubs ───────────────────────────────────────────────────
  const groups = mcAllMarketClubs(c);
  const flat = [];
  for (const g of groups) for (const cl of g.clubs) flat.push(cl);
  const sel = (c.marketClub && flat.indexOf(c.marketClub) >= 0) ? c.marketClub : (flat[0] || "");
  c.marketClub = sel;

  let optsHtml = "";
  for (const g of groups) {
    optsHtml += '<optgroup label="' + mcAttr(g.league) + '">';
    for (const cl of g.clubs) {
      optsHtml += '<option value="' + mcAttr(cl) + '"' + (cl === sel ? " selected" : "") +
        ">" + mcEsc(cl) + "</option>";
    }
    optsHtml += "</optgroup>";
  }

  out += pcBlock("Browse clubs", flat.length + " clubs",
    '<div class="pcLine"><span>Club</span><b>' +
      '<select class="mcAdminIn" onchange="mcSetMarketClub(this.value)">' + optsHtml + '</select>' +
    "</b></div>" +
    '<div class="pcHint" style="margin-top:6px">Pick a club to view their squad, then send an offer for any player.</div>');

  if (sel) {
    const roster = mcRosterForClub(sel);
    if (roster.length) {
      const sorted = roster.slice().sort(function (a, b) { return mcOvr(b) - mcOvr(a); });
      const isOwn = String(sel).toLowerCase() === String(c.clubName || c.club || "").toLowerCase();
      const rows = sorted.map(function (p, idx) {
        const ovr = mcOvr(p);
        const value = (typeof mcValue === "function") ? mcValue(p) : Math.round(ovr * ovr * 0.1);
        const btn = isOwn
          ? '<span class="pcHint">Your club</span>'
          : '<button class="pcMini wcPrimaryBtn" onclick="mcSendOffer(' + idx + ',\'' +
            mcAttr(sel) + '\')">Send Offer</button>';
        return '<div class="pcOffer"><div><b>' + mcEsc(p.name) + "</b> <em>" +
          mcRoleLabel(p.role || "midfielder") + "</em>" +
          '<div class="pcHint">OVR ' + ovr + " &middot; Age " + mcNum(p.age, 24) +
          " &middot; Value " + mcMoney(value) + "</div></div>" +
          "<div>" + btn + "</div></div>";
      }).join("");
      out += pcBlock(sel, roster.length + " players", rows);
    } else {
      out += pcEmptyT(sel, "No squad data available for this club.");
    }
  }

  // ── Scouted market (kept) ──────────────────────────────────────────
  const market = c.market || [];
  if (market.length) {
    const rows = market.map(function (item) {
      const p = item.player || {};
      const price = mcNum(item.price, 0);
      return '<div class="pcOffer"><div><b>' + mcEsc(p.name) + "</b> <em>" +
        mcEsc(item.club || "Unknown") + "</em>" +
        '<div class="pcHint">' + mcRoleLabel(p.role) + " &middot; OVR " + mcOvr(p) +
        " / pot " + mcNum(p.pot, 0) + " &middot; age " + mcNum(p.age, 0) +
        " &middot; " + mcMoney(price) + "</div></div>" +
        '<div><button class="pcMini wcPrimaryBtn" onclick="mcBuyById(\'' +
        mcAttr(item.id) + '\')">Negotiate</button></div></div>';
    }).join("");
    out += pcBlock("Scouted market", market.length + " listed", rows);
  }

  return out;
}

function mcAdminHTML(c) {
  const hist = (c.history || []).slice().reverse();
  const histRows = hist.length ? hist.map(h =>
    '<div class="pcLine"><span>Season ' + pcNum(h.season, 1) + "</span><b>" + pcOrdinal(pcNum(h.rank, 0)) +
    (h.cupWon ? " \u00b7 Cup winners" : "") + "</b></div>").join("")
    : '<div class="pcHint">No completed seasons yet.</div>';
  const all = mcLoadAll();
  const careerRows = all.careers.map(x => {
    const active = mcState && x.id === mcState.id;
    return '<div class="pcLine"><span>' + mcEsc((x.managerName || "The Manager") + " \u2014 " + (x.clubName || x.club || "?")) +
      " \u00b7 S" + pcNum(x.season, 1) + (active ? " \u00b7 active" : "") + "</span><b>" +
      (active ? "" : '<button class="pcMini wcGhostBtn" onclick="mcOpenCareer(\'' + mcAttr(x.id) + '\')">Open</button> ') +
      '<button class="pcMini wcGhostBtn" onclick="mcDeleteCareerAsk(\'' + mcAttr(x.id) + '\')">Delete</button>' +
      "</b></div>";
  }).join("");
  const meta = pcBlock("Career", "Season " + pcNum(c.season, 1),
    pcRow("Manager", c.managerName || "The Manager") +
    pcRow("Club", c.clubName || c.club) +
    pcRow("League", c.league) +
    pcRow("Board style", c.board && c.board.style === "win" ? "Win now" : c.board && c.board.style === "develop" ? "Develop youth" : "Balanced") +
    pcRow("Saved careers", all.careers.length));
  const careers = pcBlock("Saved careers", all.careers.length + (all.careers.length === 1 ? " career" : " careers"),
    careerRows || '<div class="pcHint">No saved careers.</div>');
  const actions = pcBlock("Actions", "",
    '<div class="pcLine"><span>Start another career</span><b><button class="pcMini wcGhostBtn" onclick="mcStartNewCareer()">New Career</button></b></div>' +
    '<div class="pcLine"><span>Leave and keep this career</span><b><button class="pcMini wcGhostBtn" onclick="mcQuitToMenu()">Quit to Menu</button></b></div>' +
    '<div class="pcLine"><span>Delete this career permanently</span><b><button class="pcMini wcGhostBtn" onclick="mcDeleteCareer()">Delete</button></b></div>');
  return meta + careers + pcBlock("Season history", hist.length + " seasons", histRows) + actions;
}

/* --------------------------------------------------------------- hub ---- */

function mcSetTab(tab) {
  mcMenu = tab;
  mcSimPreview = false;
  mcShowHub();
}

function mcTabHeaderHTML(c) {
  const tabs = [
    ["home", "Home"], ["squad", "Squad"], ["schedule", "Schedule"], ["comps", "Competitions"], ["academy", "Academy"],
    ["transfers", "Transfers"], ["board", "Board"], ["market", "Market"], ["messages", "Messages"],
    ["news", "News"], ["finances", "Finances"], ["scouting", "Scouting"], ["roles", "Roles"],
    ["admin", "Admin"]
  ];
  const unread = (typeof ccUnread === "function") ? ccUnread(c) : 0;
  return '<div class="mcTabs">' +
    tabs.map(t => '<button class="mcTab' + (mcMenu === t[0] ? " on" : "") + '" onclick="mcSetTab(\'' + t[0] + '\')">' + t[1] + "</button>").join("") +
    '</div><div class="mcHeader">' +
    '<span class="mcChip">Budget ' + mcMoney(c.budget) + "</span>" +
    '<span class="mcChip">Rep ' + Math.round(mcNum(c.rep, 0)) + "</span>" +
    '<span class="mcChip">Squad ' + mcBestOvr(c) + "</span>" +
    '<span class="mcChip">Season ' + pcNum(c.season, 1) + "</span>" +
    (unread ? '<span class="mcChip">News ' + unread + "</span>" : "") +
    "</div>";
}

function mcTabBodyHTML(c, tab) {
  if (tab === "home") return mcHomeHTML(c);
  if (tab === "squad") return mcSquadHTML(c);
  if (tab === "schedule") return mcScheduleHTML(c);
  if (tab === "comps") return pcCompetitionsHTML(c);
  if (tab === "academy") return mcAcademyHTML(c);
  if (tab === "transfers") return mcTransfersHTML(c);
  if (tab === "board") return mcBoardHTML(c);
  if (tab === "market") return mcMarketHTML(c);
  if (tab === "messages") return mcMessagesHTML(c);
  if (tab === "admin") return mcAdminHTML(c);
  return mcHomeHTML(c);
}

/* ---------------------------------------------- manager simulate preview ---
   Mirror of the player's FIFA-style five-day look-ahead: the preview block
   itself is shared (pcSimPreviewHTML), only the flags and confirm differ. */

function mcSimPreviewOpen() { mcSimPreview = true; mcShowHub(); }
function mcSimPreviewClose() { mcSimPreview = false; mcShowHub(); }
function mcOpenSimMenu() {
  const m = document.getElementById("managerSimMenuModal");
  if (m) m.style.display = "flex";
}
function mcCloseSimMenu() {
  const m = document.getElementById("managerSimMenuModal");
  if (m) m.style.display = "none";
}
function mcSimMenuQuick() {
  mcCloseSimMenu();
  mcSimPreview = false;
  mcQuickSim();
}
function mcSimMenuLive() {
  mcCloseSimMenu();
  mcSimPreview = false;
  if (typeof mcLiveSim === "function") mcLiveSim();
  else mcQuickSim();
}
function mcSimConfirm() { mcSimPreview = false; mcQuickSim(); }
function mcLiveSim() {
  const c = mcState;
  if (!c) return;
  const uf = pcNextUserFixture(c);
  if (!(uf && uf.day <= c.calDay)) { mcShowHub(); return; }
  const match = uf.match || {};
  const home = match.team1, away = match.team2;
  const homeOvr = (typeof getTeamOverall === "function") ? getTeamOverall(home) : 70;
  const awayOvr = (typeof getTeamOverall === "function") ? getTeamOverall(away) : 70;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  const box = document.createElement('div');
  box.style.cssText = 'width:min(680px,95vw);max-height:80vh;overflow:auto;background:#0b1020;border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#e9edf3;font-family:inherit;';
  box.innerHTML = '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">'+(typeof pcEsc==='function'?pcEsc(home):home)+' vs '+(typeof pcEsc==='function'?pcEsc(away):away)+'</div><div style="display:flex;gap:12px;align-items:center"><div id="mcLiveTime" style="font-variant-numeric:tabular-nums">0\'</div><div id="mcLiveScore" style="font-weight:700">0 - 0</div></div></div><div id="mcLiveLog" style="padding:12px 16px;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.5"></div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const logEl = box.querySelector('#mcLiveLog');
  const scoreEl = box.querySelector('#mcLiveScore');
  const timeEl = box.querySelector('#mcLiveTime');
  const add = function(txt){ const d=document.createElement('div'); d.textContent=txt; logEl.appendChild(d); logEl.scrollTop=logEl.scrollHeight; };
  let h=0,a=0, step=0, stopped=false;
  function stop(){ if(stopped)return; stopped=true; if(overlay.parentNode) overlay.parentNode.removeChild(overlay); if(uf.kind === "cup") { uf.match.score1=h; uf.match.score2=a; uf.played=true; if(typeof simulateCupMatch==="function")simulateCupMatch(uf.match); else if(typeof pcSimResult==="function")pcSimResult(c,uf);} else { uf.match.score1=h; uf.match.score2=a; uf.played=true; if(typeof pcSimResult==="function")pcSimResult(c,uf);} mcSave(); mcShowHub(); }
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

function mcShowHub() {
  if (!mcState) { mcRenderSetup(); return; }
  const c = mcState;
  if (typeof matchRunning !== "undefined" && matchRunning) {
    matchRunning = false;
    try { clearInterval(timerInterval); } catch (e) {}
    mcMidMatch = true;
  }
  pcHideOtherScreens();
  if (pcSeasonDone(c)) { mcShowSeasonSummary(); return; }
  const title = document.getElementById("mcTitle");
  if (title) title.textContent = (c.clubName || c.club) + " \u2014 Manager Career";
  const sub = document.getElementById("mcSubtitle");
  if (sub) sub.textContent = c.league + " \u00b7 Season " + pcNum(c.season, 1) + " \u00b7 " + mcNextLine(c);
  const uf = pcNextUserFixture(c);
  const due = !!(uf && uf.day <= c.calDay);
  if (mcSimPreview && (mcMidMatch || !due)) mcSimPreview = false;
  let actions = "";
  if (mcMidMatch) {
    actions = '<button class="wcPrimaryBtn" onclick="mcResumeMatch()">Resume Match</button>';
  } else if (due) {
    actions = '<button class="wcPrimaryBtn" onclick="mcPlayNext()">Manage Match</button>' +
      '<button class="wcGhostBtn" onclick="mcOpenSimMenu()">Simulate</button>' +
      '<button class="wcGhostBtn" onclick="mcDayStep()">Next Day</button>';
  } else {
    actions = '<button class="wcPrimaryBtn" onclick="mcTickerToggle()" onmousedown="mcTickerHalt()">' + (mcTicking ? "Stop" : "Continue") + '</button>' +
      (mcTicking ? "" : '<button class="wcGhostBtn" onclick="mcDayStep()">Next Day</button>');
  }
  actions += '<button class="wcGhostBtn" onclick="mcQuitToMenu()">Quit to Menu</button>';
  const body = document.getElementById("mcBody");
  if (body) {
    const html = '<div class="wcHubActions">' + actions + "</div>" +
      pcSimPreviewHTML(c) + mcTabHeaderHTML(c) + '<div class="pcTabBody">' + mcTabBodyHTML(c, mcMenu) + "</div>";
    if (body.innerHTML === html) return;
    body.innerHTML = html;
  }
  if (typeof enterScreen === "function") enterScreen("managerScreen", "block");
  else document.getElementById("managerScreen").style.display = "block";
}

/* ------------------------------------------------------------- setup ---- */

function startModeManagerCareer() {
  currentMode = "managercareer";
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  const ms = document.getElementById("modeSelectScreen");
  if (ms) ms.style.display = "none";
  const all = mcLoadAll();
  if (all.careers.length) { mcShowPicker(); return; }
  mcState = null;
  mcRenderSetup();
}

function mcRenderSetup() {
  const body = document.getElementById("mcBody");
  if (!body) return;
  pcHideOtherScreens();
  const title = document.getElementById("mcTitle");
  if (title) title.textContent = "Manager Career";
  const sub = document.getElementById("mcSubtitle");
  if (sub) sub.textContent = "Take the chair. Set the vision. Deliver.";
  const nameEl = document.getElementById("mcNameInput");
  if (nameEl) mcSetup.name = nameEl.value;
  const selector = pcF16SelectorHTML(mcSetup, {
    nation: "mcSetupNationStep",
    league: "mcSetupLeagueStep",
    club: "mcSetupClubStep",
    confirm: "mcSetupConfirm"
  }, "mcSetupStatus");
  const styleBtns = MC_STYLES.map(s =>
    '<button class="wcNationBtn' + (s.key === mcSetup.style ? " sel" : "") + '" onclick="mcSetupStyle(\'' + s.key + '\')">' +
    '<span class="wcNationCode">' + mcEsc(s.label.charAt(0)) + '</span>' +
    '<span class="wcNationName">' + mcEsc(s.label) + "</span>" +
    '<span class="pcHint" style="display:block;width:100%">' + mcEsc(s.blurb) + "</span></button>").join("");
  body.innerHTML =
    '<div class="wcSetup">' +
    '<div class="wcSetupName"><label for="mcNameInput">MANAGER NAME</label>' +
    '<input id="mcNameInput" type="text" maxlength="16" placeholder="Enter your name..." value="' + mcAttr(mcSetup.name || "") + '"></div>' +
    selector +
    '<div class="wcNationHead">Board philosophy</div><div class="wcNationGrid">' + styleBtns + "</div>" +
    '<div class="wcSetupMsg" id="mcSetupMsg"></div>' +
    '<div class="wcSetupActions">' +
    '<button class="wcPrimaryBtn" onclick="mcBeginFromSetup()">Take The Job</button>' +
    '<button class="wcGhostBtn" onclick="mcQuitToMenu()">Back</button>' +
    "</div></div>";
  if (typeof enterScreen === "function") enterScreen("managerScreen", "block");
  else document.getElementById("managerScreen").style.display = "block";
}

function mcSetupLeague(name) {
  mcSetup.league = name;
  mcSetup.club = null;
  mcSetup.confirmed = null;
  mcRenderSetup();
}

function mcSetupClub(club) {
  mcSetup.club = club;
  mcSetup.confirmed = null;
  mcRenderSetup();
}

function mcSetupNationStep(dir) {
  if (pcNationStep(mcSetup, dir)) { mcSetup.confirmed = null; mcRenderSetup(); }
}

function mcSetupLeagueStep(dir) {
  if (pcLeagueStep(mcSetup, dir)) { mcSetup.confirmed = null; mcRenderSetup(); }
}

function mcSetupClubStep(dir) {
  if (pcClubStep(mcSetup, dir)) { mcSetup.confirmed = null; mcRenderSetup(); }
}

function mcSetupConfirm() {
  const c = pcSelClub(mcSetup);
  if (c) { mcSetup.club = c; mcSetup.confirmed = c; mcRenderSetup(); }
}

function mcSetupStyle(key) {
  mcSetup.style = key;
  mcRenderSetup();
}

function mcNewCareer(club, style, managerName) {
  if (typeof TeamEdits !== "undefined" && TeamEdits.enterCareer) TeamEdits.enterCareer();
  const lg = pcLeagueOf(club);
  const c = {
    id: "mc" + Date.now().toString(36) + Math.floor(Math.random() * 1000000).toString(36),
    club: club, clubName: club,
    league: lg.name, leagueShort: lg.short, cupName: lg.cup || "Domestic Cup",
    clubs: (lg.clubs || []).slice(),
    managerName: managerName || "The Manager",
    season: 1, calDay: CC_CAL_FIRST_DAY,
    budget: Math.round((24 + Math.random() * 36) * 10) / 10,
    rep: 30 + Math.floor(Math.random() * 20),
    board: { confidence: 62, style: style || "balanced", patience: 65 },
    personality: { media: 55 },
    facilities: { training: 1 + Math.floor(Math.random() * 3), medical: 1 + Math.floor(Math.random() * 3), academy: 1 + Math.floor(Math.random() * 2) },
    scout: 1, scoutCount: 1,
    stadium: "rec",
    squad: [], academy: [], roles: {}, market: [], transferPool: [],
    scouting: { scouts: [], reports: [], shortlist: [], missions: [], prospects: [], retiredNations: {} },
    objectives: [], objectivesMet: 0, objectivesTotal: 0,
    seasonStats: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 },
    fixtures: [], history: [], news: [], press: [],
    social: { followers: 800, posts: [], trending: [] },
    log: [], sacked: false, cupRun: 0, seasonPromotions: 0,
    createdAt: Date.now()
  };
  mcBuildSquad(c);
  mcCareers.push(c);
  mcState = c;
  mcStartSeason(c, true);
  return c;
}

function mcBeginFromSetup() {
  const msg = document.getElementById("mcSetupMsg");
  const nameEl = document.getElementById("mcNameInput");
  if (!mcSetup.club) mcSetup.club = pcSelClub(mcSetup);
  if (!mcSetup.club) { if (msg) msg.textContent = "Pick a club first."; return; }
  if (!mcSetup.style) { if (msg) msg.textContent = "Pick a board philosophy first."; return; }
  const name = nameEl ? nameEl.value.trim() : "";
  const c = mcNewCareer(mcSetup.club, mcSetup.style, name);
  if (!c || !c.squad || !c.squad.length) {
    if (msg) msg.textContent = "Could not build that club's squad. Try another club.";
    if (c) {
      const i = mcCareers.indexOf(c);
      if (i >= 0) mcCareers.splice(i, 1);
      mcState = null;
    }
    return;
  }
  mcSave();
  mcShowHub();
}

/* --------------------------------------------------- season summary ----- */

function mcShowSeasonSummary() {
  const c = mcState;
  if (!c) { mcRenderSetup(); return; }
  if (typeof matchRunning !== "undefined" && matchRunning) {
    matchRunning = false;
    try { clearInterval(timerInterval); } catch (e) {}
  }
  mcMidMatch = false;
  pcHideOtherScreens();
  mcEndSeason(c);
  mcSave();
  const title = document.getElementById("mcTitle");
  if (title) title.textContent = "Season " + pcNum(c.season, 1) + " Complete";
  const sub = document.getElementById("mcSubtitle");
  if (sub) sub.textContent = (c.clubName || c.club) + " \u00b7 " + (c.managerName || "The Manager");
  const table = pcTable(c);
  const rank = pcRankOf(c, c.club);
  let w = 0, d = 0, l = 0;
  for (const row of table) if (row.team === c.club) { w = pcNum(row.w, 0); d = pcNum(row.d, 0); l = pcNum(row.l, 0); }
  const cup = pcCupResult(c);
  const ss = c.seasonStats || {};
  const cupText = cup.status === "won" ? c.cupName + " winners!" :
    cup.status === "final" ? "Runner-up" :
    cup.status === "out" ? "Out in the " + pcRoundLabel(cup.round) :
    cup.status === "alive" ? "Still in the competition" : "-";
  let prize = Math.max(2, Math.round((26 - rank * 1.1) * 10) / 10);
  if (cup.status === "won") prize += 8;
  prize = Math.round(prize * 10) / 10;
  let actions, review, objBlock, extras;
  if (c.sacked) {
    actions = '<button class="wcPrimaryBtn" onclick="mcStartNewCareer()">Start New Career</button>' +
      '<button class="wcGhostBtn" onclick="mcQuitToMenu()">Quit to Menu</button>';
    review = pcBlock("Sacked", "The board lost patience",
      pcRow("Final position", pcOrdinal(rank)) +
      pcRow("League record", w + "W " + d + "D " + l + "L") +
      pcRow("Cup", cupText) +
      '<div class="pcHint">The board relieved you of your duties after a season well short of expectations.</div>');
    objBlock = pcBlock("Board verdict", mcNum(c.objectivesMet, 0) + " of " + mcNum(c.objectivesTotal, 0) + " objectives met", mcObjMeters(c));
    extras = "";
  } else {
    actions = '<button class="wcPrimaryBtn" onclick="mcAdvanceSeason()">Start Season ' + (pcNum(c.season, 1) + 1) + "</button>" +
      '<button class="wcGhostBtn" onclick="mcQuitToMenu()">Quit to Menu</button>';
    review = pcBlock("Season in review", pcOrdinal(rank) + " place",
      pcRow("League record", w + "W " + d + "D " + l + "L") +
      pcRow("Goals", mcNum(ss.gf, 0) + " for / " + mcNum(ss.ga, 0) + " against") +
      pcRow("Cup", cupText) +
      pcRow("Prize money", mcMoney(prize)) +
      pcRow("Board confidence", Math.round(mcNum((c.board || {}).confidence, 60)) + "/100"));
    mcEvalObjectives(c);
    objBlock = pcBlock("Board objectives", mcNum(c.objectivesMet, 0) + " of " + mcNum(c.objectivesTotal, 0) + " met", mcObjMeters(c));
    extras = pcBlock("Off-season", "Ready to go again",
      pcRow("Squad", "A year older and (hopefully) better") +
      pcRow("Youth intake", (c.academy || []).length + " prospects waiting in the academy") +
      pcRow("Next season", "Season " + (pcNum(c.season, 1) + 1)));
  }
  const body = document.getElementById("mcBody");
  if (body) body.innerHTML = '<div class="wcHubActions">' + actions + "</div>" + review + objBlock + extras;
  if (typeof enterScreen === "function") enterScreen("managerScreen", "block");
  else document.getElementById("managerScreen").style.display = "block";
}

/* --------------------------------------------------------- handlers ----- */

window.mcSignShortlist = function (cid) {
  const c = mcState;
  if (!c) return;
  const arr = (c.scouting && Array.isArray(c.scouting.shortlist)) ? c.scouting.shortlist : [];
  const i = arr.findIndex(x => x.cid === cid);
  if (i < 0) { mcShowHub(); return; }
  const x = arr[i];
  const player = mcMakeCard(x.name, x.role || "midfielder",
    mcNum(x.ovr, 65), mcNum(x.age, 24), mcNum(x.pot, 75));
  player.wage = Math.round(Math.pow(mcOvr(player), 2) * 6 / 100) * 100;
  player.contractEnd = (c.season || 1) + 3;
  const isFree = !x.club || String(x.club).toLowerCase() === "free agent";
  if (typeof window.Negotiation === "undefined") {
    // Fallback if negotiation.js failed to load
    const price = mcNum(x.price, 0);
    if (price > 0 && mcNum(c.budget, 0) < price) { mcShowHub(); return; }
    mcSignPlayer(c, player, price, x.club || "free agent");
    arr.splice(i, 1);
    mcSave(); mcShowHub(); return;
  }
  window.Negotiation.start({
    kind: isFree ? "freeAgent" : "transfer",
    career: c, player: player,
    sellerClub: isFree ? "" : x.club,
    deferred: !isFree && !mcTransferWindowOpen(c),
    onComplete: function () {
      if (c.squad.some(p => p.name === x.name)) {
        const j = arr.findIndex(y => y.cid === cid);
        if (j >= 0) arr.splice(j, 1);
        mcSave();
      }
      mcShowHub();
    }
  });
};

window.mcSignPool = function (cid) {
  const c = mcState;
  if (!c) return;
  const pool = Array.isArray(c.transferPool) ? c.transferPool : [];
  const i = pool.findIndex(x => x.player && x.player.cid === cid);
  if (i < 0) { mcShowHub(); return; }
  const x = pool[i], src = x.player;
  const player = mcMakeCard(src.name, src.role || "midfielder",
    mcOvr(src), mcNum(src.age, 24), mcNum(src.pot, 75));
  player.wage = Math.round(Math.pow(mcOvr(player), 2) * 6 / 100) * 100;
  player.contractEnd = (c.season || 1) + 3;
  const isFree = !x.from || String(x.from).toLowerCase() === "free agent";
  if (typeof window.Negotiation === "undefined") {
    const price = mcNum(x.price, 0);
    if (price > 0 && mcNum(c.budget, 0) < price) { mcShowHub(); return; }
    mcSignPlayer(c, player, price, x.from || "free agent");
    pool.splice(i, 1);
    mcSave(); mcShowHub(); return;
  }
  window.Negotiation.start({
    kind: isFree ? "freeAgent" : "transfer",
    career: c, player: player,
    sellerClub: isFree ? "" : x.from,
    deferred: !isFree && !mcTransferWindowOpen(c),
    onComplete: function () {
      if (c.squad.some(p => p.name === src.name)) {
        const j = pool.findIndex(y => y.player && y.player.cid === cid);
        if (j >= 0) pool.splice(j, 1);
        mcSave();
      }
      mcShowHub();
    }
  });
};

window.mcBuyById = function (mid) {
  const c = mcState;
  if (!c) return;
  const item = (c.market || []).find(x => x.id === mid);
  if (!item || !item.player) { mcShowHub(); return; }
  const src = item.player;
  const player = mcMakeCard(src.name, src.role || "midfielder",
    mcOvr(src), mcNum(src.age, 24), mcNum(src.pot, 75));
  player.wage = Math.round(Math.pow(mcOvr(player), 2) * 6 / 100) * 100;
  player.contractEnd = (c.season || 1) + 3;
  const isFree = !item.club || String(item.club).toLowerCase() === "free agent";
  if (typeof window.Negotiation === "undefined") {
    mcBuyPlayer(c, mid); mcSave(); mcShowHub(); return;
  }
  window.Negotiation.start({
    kind: isFree ? "freeAgent" : "transfer",
    career: c, player: player,
    sellerClub: isFree ? "" : item.club,
    deferred: !isFree && !mcTransferWindowOpen(c),
    onComplete: function () {
      if (c.squad.some(p => p.name === src.name)) {
        const j = c.market.findIndex(x => x.id === mid);
        if (j >= 0) c.market.splice(j, 1);
        mcSave();
      }
      mcShowHub();
    }
  });
};

window.mcRenewById = function (cid) {
  const c = mcState;
  if (!c) return;
  const p = (c.squad || []).find(x => x.cid === cid);
  if (!p) return;
  if (typeof p.wage !== "number" || p.wage <= 0) {
    p.wage = Math.round(Math.pow(mcOvr(p), 2) * 6 / 100) * 100;
  }
  if (typeof window.Negotiation === "undefined") {
    alert("Negotiation module failed to load.");
    return;
  }
  window.Negotiation.start({
    kind: "renewal",
    career: c, player: p,
    sellerClub: "",
    onComplete: function () {
      // Mark any pending wage messages for this player as done
      if (Array.isArray(c.messages)) {
        for (const m of c.messages) {
          if (m.type === "wage" && m.playerCid === cid && m.status === "pending") {
            m.status = "done";
          }
        }
      }
      mcSave();
      mcShowHub();
    }
  });
};

window.mcPromoteById = function (cid) {
  if (!mcState) return;
  mcPromoteAcademy(mcState, cid);
  mcSave();
  mcShowHub();
};

window.mcSellPlayer = function (cid) {
  const c = mcState;
  if (!c) return;
  if (!Array.isArray(c.squad) || c.squad.length <= 12) return;
  const p = mcFindPlayer(c, cid);
  if (!p) return;
  const fee = Math.round(mcValue(p) * 0.85 * 10) / 10;
  c.squad = c.squad.filter(x => x.cid !== cid);
  c.budget = Math.round((mcNum(c.budget, 0) + fee) * 10) / 10;
  mcLog(c, "Sold " + p.name + " for " + mcMoney(fee) + ".");
  mcSave();
  mcShowHub();
};

window.mcUpgradeFacility = function (kind) {
  const c = mcState;
  if (!c || ["training", "medical", "academy"].indexOf(kind) < 0) return;
  if (!c.facilities) c.facilities = { training: 1, medical: 1, academy: 1 };
  const lvl = mcCl(mcNum(c.facilities[kind], 1), 1, 5);
  if (lvl >= 5) return;
  const cost = lvl * 4;
  if (mcNum(c.budget, 0) < cost) return;
  c.budget = Math.round((mcNum(c.budget, 0) - cost) * 10) / 10;
  c.facilities[kind] = lvl + 1;
  mcLog(c, "Upgraded " + kind + " facilities to level " + (lvl + 1) + " for " + mcMoney(cost) + ".");
  mcSave();
  mcShowHub();
};

window.mcStartNewCareer = function () {
  mcTickerStop();
  mcSave();
  mcRenderSetup();
};

window.mcOpenCareer = function (id) {
  mcTickerStop();
  const c = mcFindCareer(id);
  if (!c) { mcShowPicker(); return; }
  if (mcState && mcState.id !== c.id && Array.isArray(c.squad) && c.squad.length) mcSyncRoster(c);
  mcState = c;
  mcContext = null;
  mcMidMatch = false;
  mcMenu = "home";
  mcSave();
  mcShowHub();
};

window.mcDeleteCareer = function () {
  if (!mcState) return;
  mcDeleteCareerAsk(mcState.id);
};

function mcQuitToMenu() {
  mcTickerStop();
  mcSimPreview = false;
  mcSave();
  mcContext = null;
  mcMidMatch = false;
  mcState = null;
  const ms = document.getElementById("managerScreen");
  if (ms) ms.style.display = "none";
  if (typeof quitToMenu === "function") quitToMenu();
}
if(typeof window.mcStartNegotiation !== 'function') {

window.mcNegEnsure = function(c) {
  if (!c) return null;
  if (!c.negotiations) c.negotiations = {active: null, history: [], cooldown: {}};
  if (!Array.isArray(c.negotiations.history)) c.negotiations.history = [];
  if (!c.negotiations.cooldown) c.negotiations.cooldown = {};
  return c.negotiations;
};

window.mcNegKey = function(c, p) {
  var cid = c.id || c.club || 'x';
  var pid = (p && (p.id || p.name)) || 'y';
  return cid + '|' + pid;
};

window.mcStartNegotiation = function(c, p, opt) {
  if (!c || !p) return;
  var N = window.mcNegEnsure(c);
  var k = window.mcNegKey(c, p);
  var cd = (N.cooldown && N.cooldown[k]) || 0;
  if (cd > Date.now()) {
    if (typeof alert === 'function') alert('Cannot negotiate again yet.');
    return;
  }
  var isRenew = (opt && opt.type === 'renewal');
  var baseOvr = Number(p.ovr || p.rating || 70);
  var age = Number(p.age || 25);
  var curW = Number(p.wage || 2);
  var rep = Number(c.rep || 50);
  var form = Number(p.form || 50);
  var person = Number(p.agentPers || 50);
  var val = baseOvr * (1.0 + (age < 25 ? 0.12 : age > 30 ? -0.08 : 0) + (form - 50) / 400 + (rep - 50) / 600);
  var fee = isRenew ? 0 : Math.round(val * 0.8);
  var wageAsk = isRenew ? Math.max(curW, Math.round(curW * (1.0 + (baseOvr - 70) / 40 + (person - 50) / 200))) : Math.max(1, Math.round(curW * (0.9 + (baseOvr - 70) / 30 + (form - 50) / 200)));
  var sb = isRenew ? Math.round(wageAsk * 0.2) : Math.round(wageAsk * 0.4);
  var len = isRenew ? 3 : Math.min(5, Math.max(2, Math.round(2 + (baseOvr - 70) / 10)));
  var minRole = p.pos || p.role || 'SUB';
  if (baseOvr >= 86) minRole = 'START';
  if (baseOvr >= 82 && minRole !== 'START') minRole = 'ROTATION';
  N.active = {
    id: k,
    careerId: c.id,
    player: p,
    playerName: p.name,
    type: isRenew ? 'renewal' : 'transfer',
    clubFee: fee,
    feeOff: fee,
    wageAsk: wageAsk,
    wageOff: Math.round(wageAsk * 0.8 * 10) / 10,
    sbAsk: sb,
    sbOff: Math.round(sb * 0.6 * 10) / 10,
    len: len,
    lenOff: len,
    role: minRole,
    demands: {fee: fee, wage: wageAsk, sb: sb, len: len, role: minRole},
    state: 'club',
    round: 1,
    log: []
  };
  N.active.log.push({who: 'Agent', txt: 'Initial demands set.'});
  try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
  if (typeof window.mcRenderNegotiation === 'function') window.mcRenderNegotiation(N.active);
  else if (typeof mcShowHub === 'function') mcShowHub();
};

window.mcNegClose = function() {
  var c = window.mcState;
  if (!c) return;
  var N = window.mcNegEnsure(c);
  if (N) N.active = null;
  try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
  if (typeof mcShowHub === 'function') mcShowHub();
};

window.mcNegOfferClub = function() {
  var c = window.mcState;
  if (!c) return;
  var N = window.mcNegEnsure(c);
  var A = N.active;
  if (!A) return;
  A.state = 'meeting';
  if (!Array.isArray(A.log)) A.log = [];
  A.log.push({who: 'Club', txt: 'Club offer submitted.'});
  A.log.push({who: 'Player+Agent', txt: 'Meeting requested.'});
  try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
  if (typeof window.mcRenderNegotiation === 'function') window.mcRenderNegotiation(A);
};

window.mcNegAdjust = function(type, delta) {
  var c = window.mcState;
  if (!c) return;
  var N = window.mcNegEnsure(c);
  var A = N.active;
  if (!A) return;
  if (type === 'fee') { A.feeOff = Math.max(0, Math.round((Number(A.feeOff || 0) + delta) * 10) / 10); }
  if (type === 'wage') { A.wageOff = Math.max(0.5, Math.round((Number(A.wageOff || 0) + delta * 0.5) * 10) / 10); }
  if (type === 'sb') { A.sbOff = Math.max(0, Math.round((Number(A.sbOff || 0) + delta * 0.25) * 10) / 10); }
  if (type === 'len') { A.lenOff = Math.max(1, Math.min(5, Math.round(Number(A.lenOff || A.len || 2) + delta))); }
  try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
  if (typeof window.mcRenderNegotiation === 'function') window.mcRenderNegotiation(A);
};

window.mcNegCounter = function() {
  var c = window.mcState;
  if (!c) return;
  var N = window.mcNegEnsure(c);
  var A = N.active;
  if (!A) return;
  if (A.lenOff === undefined) A.lenOff = A.len;
  if (!Array.isArray(A.log)) A.log = [];
  if (!Array.isArray(N.history)) N.history = [];
  var feeOk = A.type === 'renewal' ? true : (Number(A.feeOff || 0) >= Math.round(Number((A.demands && A.demands.fee) || 0) * 0.7));
  var wageOk = Number(A.wageOff || 0) >= Math.round(Number((A.demands && A.demands.wage) || 0) * 0.75);
  var sbOk = Number(A.sbOff || 0) >= Math.round(Number((A.demands && A.demands.sb) || 0) * 0.6);
  A.round = (A.round || 1) + 1;
  if (feeOk && wageOk && sbOk) {
    A.state = 'agreed';
    A.log.push({who: 'Agent', txt: 'Agreement reached.'});
    N.history.push({when: Date.now(), player: A.playerName, terms: {fee: A.feeOff, wage: A.wageOff, sb: A.sbOff, len: A.lenOff, role: A.role}});
    var k = window.mcNegKey(c, A.player);
    if (N.cooldown) N.cooldown[k] = Date.now() + 7 * 86400000;
    try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
    if (typeof window.mcRenderNegotiation === 'function') window.mcRenderNegotiation(A);
  } else {
    A.log.push({who: 'Player+Agent', txt: 'Terms below demands.'});
    try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
    if (typeof window.mcRenderNegotiation === 'function') window.mcRenderNegotiation(A);
  }
};

window.mcNegAccept = function() {
  var c = window.mcState;
  if (!c) return;
  var N = window.mcNegEnsure(c);
  var A = N.active;
  if (!A) return;
  if (A.state !== 'agreed') {
    window.mcNegCounter();
    return;
  }
  var fee = Number(A.feeOff || 0);
  var wage = Number(A.wageOff || 0);
  var sb = Number(A.sbOff || 0);
  var len = Number(A.lenOff || A.len || 2);
  if (A.type !== 'renewal') {
    if (fee > 0 && Number(c.budget || 0) < fee) {
      if (typeof alert === 'function') alert('Insufficient budget.');
      return;
    }
    c.budget = Math.round((Number(c.budget || 0) - fee) * 10) / 10;
  }
  if (!Array.isArray(c.squad)) c.squad = [];
  var pl = A.player;
  pl.wage = Math.round(wage * 10) / 10;
  pl.contract = {years: len, wage: wage, signingBonus: sb, role: A.role || 'SUB'};
  if (A.type !== 'renewal') {
    var ex = false;
    for (var i = 0; i < c.squad.length; i++) {
      if (c.squad[i] && c.squad[i].name === pl.name) { ex = true; break; }
    }
    if (!ex) c.squad.push(pl);
  }
  if (Array.isArray(c.messages)) {
    for (var j = 0; j < c.messages.length; j++) {
      if (c.messages[j] && c.messages[j].from === pl.name) { c.messages.splice(j, 1); break; }
    }
  }
  try {
    if (typeof mcLog === 'function') {
      var feeStr = fee > 0 ? ' Fee: ' + (typeof mcMoney === 'function' ? mcMoney(fee) : fee) + '.' : '';
      mcLog(c, 'Signed ' + pl.name + ' to contract (' + len + ' yrs, ' + wage + ' wage).' + feeStr);
    }
  } catch(e) {}
  var kk = window.mcNegKey(c, pl);
  if (N.cooldown) N.cooldown[kk] = Date.now() + 3 * 86400000;
  N.active = null;
  try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
  if (typeof mcShowHub === 'function') mcShowHub();
};

window.mcNegReject = function() {
  var c = window.mcState;
  if (!c) return;
  var N = window.mcNegEnsure(c);
  var A = N.active;
  if (!A) return;
  var k = window.mcNegKey(c, A.player);
  if (N.cooldown) N.cooldown[k] = Date.now() + 14 * 86400000;
  N.active = null;
  try { if (typeof mcSave === 'function') mcSave(); } catch(e) {}
  if (typeof mcShowHub === 'function') mcShowHub();
};

window.mcRenderNegotiation = function(A) {
  var ov = document.getElementById('negotiationOverlay');
  if (!ov) {
    var d = document.createElement('div');
    d.id = 'negotiationOverlay';
    d.className = 'modalOverlay';
    d.innerHTML = '<div class="marketContent" style="max-width:520px"><div class="marketHeader"><h2>Player Negotiation</h2><div class="marketClose" onclick="mcNegClose()">x</div></div><div id="negBody"></div></div>';
    if (document.body) document.body.appendChild(d);
    ov = document.getElementById('negotiationOverlay');
  }
  if (!ov) return;
  ov.style.display = 'flex';
  var body = document.getElementById('negBody');
  if (!A) { ov.style.display = 'none'; return; }
  if (A.feeOff === undefined || A.feeOff === null) A.feeOff = (A.demands && A.demands.fee) || 0;
  if (A.wageOff === undefined || A.wageOff === null) A.wageOff = Math.round(((A.demands && A.demands.wage) || 0) * 0.8 * 10) / 10;
  if (A.sbOff === undefined || A.sbOff === null) A.sbOff = Math.round(((A.demands && A.demands.sb) || 0) * 0.6 * 10) / 10;
  if (A.lenOff === undefined || A.lenOff === null) A.lenOff = A.len || 2;
  var feeL = A.type === 'renewal' ? 'No fee (renewal)' : 'Club Fee';
  var esc = function(s){ if (typeof pcEsc === 'function') return pcEsc(s); if (s == null) return ''; return String(s); };
  var html = '<div style="padding:10px 12px"><div style="font-weight:700">' + esc(A.playerName || '') + ' Â· ' + esc((A.player && (A.player.pos || A.player.role)) || '') + '</div><div style="opacity:0.8;margin-top:4px">Stage: ' + esc(A.state) + ' Â· Round: ' + (A.round || 1) + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px"><div style="opacity:0.8">' + feeL + '</div><div style="display:flex;align-items:center;gap:6px;margin-top:6px"><button class="wcGhostBtn" onclick="mcNegAdjust(\'fee\',-1)">-</button><div style="min-width:70px;text-align:center">' + (A.type === 'renewal' ? '0' : Number(A.feeOff || 0).toFixed(1)) + '</div><button class="wcGhostBtn" onclick="mcNegAdjust(\'fee\',1)">+</button></div></div><div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px"><div style="opacity:0.8">Wage</div><div style="display:flex;align-items:center;gap:6px;margin-top:6px"><button class="wcGhostBtn" onclick="mcNegAdjust(\'wage\',-1)">-</button><div style="min-width:70px;text-align:center">' + Number(A.wageOff || 0).toFixed(1) + '</div><button class="wcGhostBtn" onclick="mcNegAdjust(\'wage\',1)">+</button></div></div><div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px"><div style="opacity:0.8">Signing Bonus</div><div style="display:flex;align-items:center;gap:6px;margin-top:6px"><button class="wcGhostBtn" onclick="mcNegAdjust(\'sb\',-1)">-</button><div style="min-width:70px;text-align:center">' + Number(A.sbOff || 0).toFixed(1) + '</div><button class="wcGhostBtn" onclick="mcNegAdjust(\'sb\',1)">+</button></div></div><div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px"><div style="opacity:0.8">Years</div><div style="display:flex;align-items:center;gap:6px;margin-top:6px"><button class="wcGhostBtn" onclick="mcNegAdjust(\'len\',-1)">-</button><div style="min-width:70px;text-align:center">' + Number(A.lenOff || A.len || 2) + '</div><button class="wcGhostBtn" onclick="mcNegAdjust(\'len\',1)">+</button></div></div></div>';
  if (Array.isArray(A.log)) {
    html += '<div style="margin-top:10px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;max-height:140px;overflow:auto">' + A.log.slice(-12).map(function(x){ return '<div style="margin-bottom:6px"><b>' + esc(x.who||'') + ':</b> ' + esc(x.txt||'') + '</div>'; }).join('') + '</div>';
  }
  if (A.state === 'club') {
    html += '<div style="display:flex;gap:8px;margin-top:10px"><button class="wcGhostBtn" onclick="mcNegOfferClub()">Submit Club Offer</button><button class="wcGhostBtn" onclick="mcNegClose()">Walk Away</button></div>';
  } else if (A.state === 'meeting') {
    html += '<div style="display:flex;gap:8px;margin-top:10px"><button class="wcGhostBtn" onclick="mcNegCounter()">Respond / Counter</button><button class="wcGhostBtn" onclick="mcNegReject()">Reject</button><button class="wcGhostBtn" onclick="mcNegClose()">Pause</button></div>';
  } else if (A.state === 'agreed') {
    html += '<div style="display:flex;gap:8px;margin-top:10px"><button class="wcGhostBtn" onclick="mcNegAccept()">Accept and Sign</button><button class="wcGhostBtn" onclick="mcNegReject()">Walk Away</button></div>';
  } else {
    html += '<div style="display:flex;gap:8px;margin-top:10px"><button class="wcGhostBtn" onclick="mcNegClose()">Close</button></div>';
  }
  html += '</div>';
  if (body) body.innerHTML = html;
};

window.mcOpenRenewal = function(name) {
  var cc = window.mcState;
  if (!cc || !Array.isArray(cc.squad)) return;
  var pl = null;
  for (var j = 0; j < cc.squad.length; j++) {
    if (cc.squad[j] && cc.squad[j].name === name) { pl = cc.squad[j]; break; }
  }
  if (!pl) return;
  if (typeof window.mcStartNegotiation === 'function') window.mcStartNegotiation(cc, pl, {type: 'renewal'});
  else if (typeof mcShowHub === 'function') mcShowHub();
};

}
function mcMessagesHTML(c){
  if(!c) return '';
  if(!Array.isArray(c.messages)) c.messages = [];
  if(c.messages.length === 0){
    return '<div style="padding:16px"><div style="font-weight:700">Messages</div><div style="opacity:0.7;margin-top:6px">No messages.</div></div>';
  }
  var html = '<div style="padding:12px"><div style="font-weight:700;margin-bottom:10px">Messages</div>';
  for(var i=0;i<c.messages.length;i++){
    var m = c.messages[i];
    var from = m.from || m.player || m.name || '';
    var txt = m.text || m.msg || m.body || '';
    html += '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;margin-bottom:10px;background:rgba(255,255,255,0.02)">';
    html += '<div style="font-weight:700">'+(typeof pcEsc==='function'?pcEsc(from):from)+'</div>';
    if(txt) html += '<div style="margin-top:6px;opacity:0.9">'+(typeof pcEsc==='function'?pcEsc(txt):txt)+'</div>';
    html += '<div style="margin-top:10px;display:flex;gap:8px">';
    html += '<button class="wcGhostBtn" onclick="mcOpenRenewal(\''+(from.replace(/'/g,"\\'"))+'\')">Discuss Contract</button>';
    html += '</div></div>';
  }
  html += '</div>';
  return html;
}
