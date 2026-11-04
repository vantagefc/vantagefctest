  return pcBlock("Transfer market", market.length + " listed \u00b7 budget " + mcMoney(budget), rows);
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
  const price = mcNum(x.price, 0);
  if (price > 0 && mcNum(c.budget, 0) < price) { mcShowHub(); return; }
  if (Array.isArray(c.squad) && c.squad.some(p => p.name === x.name)) {
    arr.splice(i, 1);
    mcSave();
    mcShowHub();
    return;
  }
  const card = mcMakeCard(x.name, x.role || "midfielder", mcNum(x.ovr, 65), mcNum(x.age, 24), mcNum(x.pot, 75));
  mcSignPlayer(c, card, price, x.club || "free agent");
  arr.splice(i, 1);
  mcSave();
  mcShowHub();
};

window.mcSignPool = function (cid) {
  const c = mcState;
  if (!c) return;
  const pool = Array.isArray(c.transferPool) ? c.transferPool : [];
  const i = pool.findIndex(x => x.player && x.player.cid === cid);
  if (i < 0) { mcShowHub(); return; }
  const x = pool[i];
  const price = mcNum(x.price, 0);
  if (price > 0 && mcNum(c.budget, 0) < price) { mcShowHub(); return; }
  mcSignPlayer(c, x.player, price, x.from || "free agent");
  pool.splice(i, 1);
  mcSave();
  mcShowHub();
};

window.mcBuyById = function (mid) {
  if (!mcState) return;
  mcBuyPlayer(mcState, mid);
  mcSave();
  mcShowHub();
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
