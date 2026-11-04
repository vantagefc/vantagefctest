/* Global Team Editor - edits club rosters for Player Career and Manager Career.
   Edits are stored separately and overlaid onto TEAM_ROSTERS only while a
   career mode is active, then the original rosters are restored. */
(function () {
  "use strict";

  var KEY = "vantageTeamEdits_v1";
  var ROLES = ["goalkeeper", "defender", "midfielder", "attacker"];
  var ROLE_LABEL = {
    goalkeeper: "Goalkeeper",
    defender: "Defender",
    midfielder: "Midfielder",
    attacker: "Attacker"
  };

  function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function num(v, lo, hi, dflt) {
    v = Number(v);
    if (!isFinite(v)) v = dflt;
    return Math.max(lo, Math.min(hi, Math.round(v)));
  }
  function clean(v) { return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); }

  function loadDB() {
    try {
      if (typeof localStorage === "undefined") return { v: 1, clubs: {} };
      var raw = localStorage.getItem(KEY);
      if (!raw) return { v: 1, clubs: {} };
      var d = JSON.parse(raw);
      if (!d || d.v !== 1 || !d.clubs || typeof d.clubs !== "object") return { v: 1, clubs: {} };
      return d;
    } catch (e) {
      return { v: 1, clubs: {} };
    }
  }

  var DB = loadDB();

  function saveDB() {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(DB));
    } catch (e) {}
  }

  function cloneValue(v) {
    if (v == null || typeof v !== "object") return v;
    try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
  }

  function clonePlayer(p) {
    if (!p) return null;
    var o = {};
    for (var k in p) if (has(p, k)) o[k] = cloneValue(p[k]);
    return o;
  }

  function cloneRoster(r) {
    if (!r) return null;
    var o = {};
    for (var k in r) {
      if (!has(r, k)) continue;
      if (Array.isArray(r[k])) o[k] = r[k].map(clonePlayer);
      else o[k] = cloneValue(r[k]);
    }
    return o;
  }

  function ensureClub(club) {
    if (!club) return;
    if (typeof TEAM_ROSTERS !== "undefined" && TEAM_ROSTERS[club]) return;
    if (typeof pcEnsureClub === "function") { pcEnsureClub(club); return; }
    if (typeof buildMyClubStarterSquad === "function") buildMyClubStarterSquad(club);
  }

  function getSlot(r, key) {
    if (!r || !key) return null;
    if (key === "gk") return r.goalkeeper || null;
    var m = /^([dma])(\d+)$/.exec(key);
    if (m) {
      var arr = m[1] === "d" ? r.defenders : m[1] === "m" ? r.midfielders : r.attackers;
      return (arr || [])[Number(m[2])] || null;
    }
    var b = /^b(\d+)$/.exec(key);
    if (b) return (r.bench || [])[Number(b[1])] || null;
    var s = /^r(\d+)$/.exec(key);
    if (s) return (r.reserves || [])[Number(s[1])] || null;
    return null;
  }

  function setSlot(r, key, player) {
    if (!r || !key) return;
    if (key === "gk") { r.goalkeeper = player; return; }
    var m = /^([dma])(\d+)$/.exec(key);
    if (m) {
      var arr = m[1] === "d" ? (r.defenders || (r.defenders = []))
        : m[1] === "m" ? (r.midfielders || (r.midfielders = []))
        : (r.attackers || (r.attackers = []));
      arr[Number(m[2])] = player;
      return;
    }
    var b = /^b(\d+)$/.exec(key);
    if (b) { (r.bench || (r.bench = []))[Number(b[1])] = player; return; }
    var s = /^r(\d+)$/.exec(key);
    if (s) { (r.reserves || (r.reserves = []))[Number(s[1])] = player; }
  }

  function slotRole(key, player) {
    if (key === "gk") return "goalkeeper";
    if (key.charAt(0) === "d") return "defender";
    if (key.charAt(0) === "m") return "midfielder";
    if (key.charAt(0) === "a") return "attacker";
    return (player && player.role) || "midfielder";
  }

  function slotLabel(key, player) {
    if (key === "gk") return "GK";
    var idx = Number(key.slice(1)) + 1;
    if (key.charAt(0) === "b") return "BENCH " + idx;
    if (key.charAt(0) === "r") return "RESERVE " + idx;
    var role = slotRole(key, player);
    var pre = role === "defender" ? "DEF" : role === "midfielder" ? "MID" : "ATT";
    return pre + " " + idx;
  }

  function slotKeys(r) {
    var keys = ["gk"];
    var add = function (pre, arr) {
      arr = arr || [];
      for (var i = 0; i < arr.length; i++) keys.push(pre + i);
    };
    add("d", r && r.defenders);
    add("m", r && r.midfielders);
    add("a", r && r.attackers);
    add("b", r && r.bench);
    add("r", r && r.reserves);
    return keys;
  }

  function editFor(club, key) {
    var c = DB.clubs[club];
    return c && c.slots ? (c.slots[key] || null) : null;
  }

  function makePlayer(e, base) {
    var p = clonePlayer(base) || {};
    p.name = clean(e.name) || (base && base.name) || "New Player";
    p.role = ROLES.indexOf(e.role) >= 0 ? e.role : (p.role || "attacker");
    p.pace = num(e.pace, 1, 99, 65);
    p.shooting = num(e.shooting, 1, 99, 65);
    p.passing = num(e.passing, 1, 99, 65);
    p.dribbling = num(e.dribbling, 1, 99, 65);
    p.defending = num(e.defending, 1, 99, 65);
    p.physical = num(e.physical, 1, 99, 65);
    p.age = num(e.age, 16, 45, (base && base.age) || 24);
    p.__editId = e.id;
    p.origName = e.origName || "";
    p.custom = !!e.custom;
    return p;
  }

  function mergedRoster(club) {
    ensureClub(club);
    var base = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
    if (!base) return null;
    var out = cloneRoster(base);
    var c = DB.clubs[club];
    if (!c || !c.slots) return out;
    for (var key in c.slots) {
      if (!has(c.slots, key)) continue;
      var e = c.slots[key];
      if (!e) continue;
      setSlot(out, key, makePlayer(e, getSlot(out, key)));
    }
    return out;
  }

  function applyClub(club) {
    var live = (typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null;
    if (!live) return;
    var c = DB.clubs[club];
    if (!c || !c.slots) return;
    for (var key in c.slots) {
      if (!has(c.slots, key)) continue;
      var e = c.slots[key];
      if (!e) continue;
      setSlot(live, key, makePlayer(e, getSlot(live, key)));
    }
  }

  function applyAll() {
    for (var club in DB.clubs) {
      if (!has(DB.clubs, club)) continue;
      ensureClub(club);
      applyClub(club);
    }
  }

  function ensureCareerClubs() {
    var leagues = (typeof CAREER_LEAGUES !== "undefined" && CAREER_LEAGUES) ? CAREER_LEAGUES : [];
    for (var i = 0; i < leagues.length; i++) {
      var clubs = leagues[i].clubs || [];
      for (var j = 0; j < clubs.length; j++) ensureClub(clubs[j]);
    }
  }

  var SNAP = null;
  var active = false;

  function enterCareer() {
    if (active) return;
    ensureCareerClubs();
    SNAP = {};
    if (typeof TEAM_ROSTERS !== "undefined") {
      for (var club in TEAM_ROSTERS) {
        if (has(TEAM_ROSTERS, club)) SNAP[club] = cloneRoster(TEAM_ROSTERS[club]);
      }
    }
    applyAll();
    active = true;
  }

  function exitCareer() {
    if (!active) return;
    if (SNAP && typeof TEAM_ROSTERS !== "undefined") {
      for (var club in TEAM_ROSTERS) {
        if (has(TEAM_ROSTERS, club) && !has(SNAP, club)) delete TEAM_ROSTERS[club];
      }
      for (var k in SNAP) {
        if (has(SNAP, k)) TEAM_ROSTERS[k] = SNAP[k];
      }
    }
    SNAP = null;
    active = false;
  }

  function restoreClub(club) {
    if (active && SNAP && SNAP[club]) TEAM_ROSTERS[club] = cloneRoster(SNAP[club]);
    applyClub(club);
  }

  function saveSlot(club, key, data) {
    if (!club || !key || !data) return null;
    ensureClub(club);
    var c = DB.clubs[club] || (DB.clubs[club] = { slots: {} });
    if (!c.slots) c.slots = {};
    var prev = c.slots[key] || null;
    var base = getSlot((typeof TEAM_ROSTERS !== "undefined") ? TEAM_ROSTERS[club] : null, key);
    var rec = {
      id: (prev && prev.id) || ("te" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)),
      name: clean(data.name) || (prev && prev.name) || (base && base.name) || "New Player",
      role: ROLES.indexOf(data.role) >= 0 ? data.role : slotRole(key, base),
      pace: num(data.pace, 1, 99, (base && base.pace) || 65),
      shooting: num(data.shooting, 1, 99, (base && base.shooting) || 65),
      passing: num(data.passing, 1, 99, (base && base.passing) || 65),
      dribbling: num(data.dribbling, 1, 99, (base && base.dribbling) || 65),
      defending: num(data.defending, 1, 99, (base && base.defending) || 65),
      physical: num(data.physical, 1, 99, (base && base.physical) || 65),
      age: num(data.age, 16, 45, (base && base.age) || 24),
      custom: prev ? !!prev.custom : !!data.custom,
      origName: prev ? (prev.origName || "") : (base ? clean(base.name) : "")
    };
    c.slots[key] = rec;
    saveDB();
    if (active) applyClub(club);
    return rec;
  }

  function resetSlot(club, key) {
    var c = DB.clubs[club];
    if (!c || !c.slots || !c.slots[key]) return;
    delete c.slots[key];
    if (!Object.keys(c.slots).length) delete DB.clubs[club];
    saveDB();
    if (active) restoreClub(club);
  }

  function resetClub(club) {
    delete DB.clubs[club];
    saveDB();
    if (active) restoreClub(club);
  }

  function cardOvr(e) {
    if (typeof calculateOverall !== "function") {
      return Math.round((e.pace + e.shooting + e.passing + e.dribbling + e.defending + e.physical) / 6);
    }
    return Math.round(calculateOverall({
      pace: e.pace, shooting: e.shooting, passing: e.passing,
      dribbling: e.dribbling, defending: e.defending, physical: e.physical
    }, e.role));
  }

  function cardFromEdit(e) {
    var ovr = cardOvr(e);
    var grow = num(e.age, 16, 45, 24) <= 21 ? 8 : num(e.age, 16, 45, 24) <= 24 ? 5 : 2;
    return {
      cid: (typeof mcCid === "function") ? mcCid() : ("te" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)),
      name: e.name, role: e.role,
      pace: e.pace, shooting: e.shooting, passing: e.passing,
      dribbling: e.dribbling, defending: e.defending, physical: e.physical,
      age: e.age, pot: Math.min(99, ovr + grow), ovr: ovr,
      __editId: e.id, origName: e.origName || ""
    };
  }

  function updateCard(card, e) {
    card.name = e.name;
    card.role = e.role;
    card.pace = e.pace;
    card.shooting = e.shooting;
    card.passing = e.passing;
    card.dribbling = e.dribbling;
    card.defending = e.defending;
    card.physical = e.physical;
    card.age = e.age;
    card.ovr = cardOvr(e);
    card.pot = Math.max(num(card.pot, 1, 99, card.ovr), Math.min(99, card.ovr + 8));
    card.__editId = e.id;
    card.origName = e.origName || card.origName || "";
    return card;
  }

  function applyToSquad(club, squad) {
    var out = Array.isArray(squad) ? squad.slice() : [];
    var c = DB.clubs[club];
    if (!c || !c.slots) return out;
    for (var key in c.slots) {
      if (!has(c.slots, key)) continue;
      var e = c.slots[key];
      if (!e) continue;
      var found = null;
      for (var i = 0; i < out.length; i++) {
        var p = out[i];
        if (!p) continue;
        if (p.__editId && p.__editId === e.id) { found = p; break; }
        if (e.origName && p.name === e.origName) { found = p; break; }
        if (p.name === e.name && (!p.role || p.role === e.role)) { found = p; break; }
      }
      if (found) updateCard(found, e);
      else out.push(cardFromEdit(e));
    }
    return out;
  }

  /* ------------------------------------------------------------ editor UI -- */
  var teView = "list";
  var teLeague = "";
  var teClub = "";
  var teEditKey = "";
  var teNew = false;

  function careerLeagues() {
    if (typeof CAREER_LEAGUES !== "undefined" && CAREER_LEAGUES && CAREER_LEAGUES.length) return CAREER_LEAGUES;
    return (typeof MYCLUB_LEAGUES !== "undefined" && MYCLUB_LEAGUES) ? MYCLUB_LEAGUES : [];
  }

  function teEsc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function teLeagueObj() {
    var ls = careerLeagues();
    for (var i = 0; i < ls.length; i++) if (ls[i].name === teLeague) return ls[i];
    return ls[0] || null;
  }

  function teClubs() {
    var lg = teLeagueObj();
    return ((lg && lg.clubs) || []).slice().sort(function (a, b) { return String(a).localeCompare(String(b)); });
  }

  function previewSlots(club) {
    var r = mergedRoster(club);
    var keys = slotKeys(r);
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var p = getSlot(r, key);
      out.push({
        key: key,
        label: slotLabel(key, p),
        player: p,
        role: slotRole(key, p),
        edit: editFor(club, key)
      });
    }
    return out;
  }

  function ovrOf(p, role) {
    if (!p) return 0;
    if (typeof calculateOverall === "function") return Math.round(calculateOverall(p, role));
    return Math.round((num(p.pace, 1, 99, 65) + num(p.shooting, 1, 99, 65) + num(p.passing, 1, 99, 65) +
      num(p.dribbling, 1, 99, 65) + num(p.defending, 1, 99, 65) + num(p.physical, 1, 99, 65)) / 6);
  }

  function nextCustomSlot(club) {
    var r = mergedRoster(club);
    var keys = slotKeys(r);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if ((k.charAt(0) === "b" || k.charAt(0) === "r") && !getSlot(r, k)) return k;
    }
    return "b" + ((r && r.bench) ? r.bench.length : 0);
  }

  function rowHTML(slot) {
    var p = slot.player;
    var ovr = p ? ovrOf(p, slot.role) : 0;
    var extra = slot.edit ? ' <span class="teEdited">EDITED</span>' : "";
    return '<div class="teRow' + (p ? "" : " teEmpty") + '">' +
      '<span class="teSlot">' + teEsc(slot.label) + '</span>' +
      '<span class="teName">' + teEsc(p ? p.name : "Empty slot") + extra + '</span>' +
      '<span class="teMeta">' + (p ? (teEsc(ROLE_LABEL[slot.role] || slot.role) + " \u00b7 OVR " + ovr) : "-") + '</span>' +
      '<button type="button" class="teMiniBtn" onclick="teEditSlot(\'' + teEsc(slot.key) + '\')">Edit</button>' +
      '</div>';
  }

  function teRenderEdit() {
    var r = mergedRoster(teClub);
    var p = getSlot(r, teEditKey);
    var rec = editFor(teClub, teEditKey);
    var isNew = teNew && !rec;
    var name = rec ? rec.name : (p && p.name) || "";
    var role = rec ? rec.role : slotRole(teEditKey, p);
    var val = function (field) {
      if (rec) return rec[field];
      if (p) return p[field];
      return field === "age" ? 24 : 65;
    };
    var age = val("age");
    var roleOpts = ROLES.map(function (x) {
      return '<option value="' + x + '"' + (x === role ? " selected" : "") + '>' + ROLE_LABEL[x] + '</option>';
    }).join("");
    var field = function (id, label, v) {
      return '<label class="teField"><span>' + label + '</span>' +
        '<input id="' + id + '" type="number" min="1" max="99" value="' + num(v, 1, 99, 65) + '"></label>';
    };
    return '<div class="teHead"><div><h3>' + (isNew ? "New Custom Player" : "Edit Player") + '</h3>' +
      '<div class="teSub">' + teEsc(slotLabel(teEditKey, p)) + ' \u00b7 ' + teEsc(teClub) + '</div></div>' +
      '<button type="button" class="teMiniBtn" onclick="teCancelEdit()">Back</button></div>' +
      '<div class="teForm">' +
      '<label class="teField teWide"><span>Name</span><input id="teName" type="text" maxlength="24" value="' + teEsc(name) + '"></label>' +
      '<label class="teField"><span>Role</span><select id="teRole">' + roleOpts + '</select></label>' +
      '<label class="teField"><span>Age</span><input id="teAge" type="number" min="16" max="45" value="' + num(age, 16, 45, 24) + '"></label>' +
      field("tePace", "Pace", val("pace")) +
      field("teShooting", "Shooting", val("shooting")) +
      field("tePassing", "Passing", val("passing")) +
      field("teDribbling", "Dribbling", val("dribbling")) +
      field("teDefending", "Defending", val("defending")) +
      field("tePhysical", "Physical", val("physical")) +
      '</div>' +
      '<div class="teActions">' +
      '<button type="button" class="tePrimary" onclick="teSavePlayer()">Save Player</button>' +
      '<button type="button" class="teGhost" onclick="teCancelEdit()">Cancel</button>' +
      (rec ? '<button type="button" class="teDanger" onclick="teResetSlot()">Reset Player</button>' : "") +
      '</div>' +
      '<div class="teNote">Changes apply to Player Career and Manager Career only.</div>';
  }

  function teRender() {
    var modal = document.getElementById("teamEditorModal");
    if (!modal) return;
    var ls = careerLeagues();
    if (!teLeague || !ls.some(function (l) { return l.name === teLeague; })) {
      teLeague = ls[0] ? ls[0].name : "";
    }
    var lg = teLeagueObj();
    var clubs = teClubs();
    if (!teClub || clubs.indexOf(teClub) < 0) teClub = clubs[0] || "";

    var leagueHtml = ls.map(function (l) {
      return '<button type="button" class="tePickBtn' + (l.name === teLeague ? " on" : "") +
        '" onclick="tePickLeague(\'' + teEsc(l.name) + '\')">' +
        '<span class="tePickCode">' + teEsc(l.short || "") + '</span>' +
        '<span>' + teEsc(l.name) + '</span></button>';
    }).join("");
    var clubHtml = clubs.map(function (club) {
      return '<button type="button" class="tePickBtn' + (club === teClub ? " on" : "") +
        '" onclick="tePickClub(\'' + teEsc(club) + '\')">' +
        '<span class="tePickCode">' + teEsc(String(club).slice(0, 3).toUpperCase()) + '</span>' +
        '<span>' + teEsc(club) + '</span></button>';
    }).join("");
    var side = document.getElementById("teLeagueList");
    if (side) side.innerHTML = leagueHtml;
    side = document.getElementById("teClubList");
    if (side) side.innerHTML = clubHtml;

    var main = document.getElementById("teMain");
    if (!main) return;
    if (teView === "edit") { main.innerHTML = teRenderEdit(); return; }
    var slots = previewSlots(teClub);
    var xi = slots.filter(function (s) { return "gdma".indexOf(s.key.charAt(0)) >= 0; }).map(rowHTML).join("");
    var bench = slots.filter(function (s) { return s.key.charAt(0) === "b"; }).map(rowHTML).join("");
    var reserves = slots.filter(function (s) { return s.key.charAt(0) === "r"; }).map(rowHTML).join("");
    main.innerHTML =
      '<div class="teHead"><div><h3>' + teEsc(teClub || "Select a club") + '</h3>' +
      '<div class="teSub">' + teEsc(lg ? lg.name : "") + ' \u00b7 ' + slots.length + ' squad slots</div></div>' +
      '<div class="teHeadBtns"><button type="button" class="teMiniBtn" onclick="teAddCustom()">Add Custom Player</button>' +
      '<button type="button" class="teMiniBtn teDanger" onclick="teResetClub()">Reset Club</button></div></div>' +
      '<div class="teSection">Starting XI</div><div class="teRows">' + xi + '</div>' +
      '<div class="teSection">Bench</div><div class="teRows">' + bench + '</div>' +
      '<div class="teSection">Reserves</div><div class="teRows">' + reserves + '</div>';
  }

  function openEditor() {
    teView = "list";
    var modal = document.getElementById("teamEditorModal");
    if (modal) modal.style.display = "flex";
    teRender();
  }

  function closeEditor() {
    var modal = document.getElementById("teamEditorModal");
    if (modal) modal.style.display = "none";
  }

  function pickLeague(name) {
    teLeague = name;
    teClub = "";
    teView = "list";
    teRender();
  }

  function pickClub(club) {
    teClub = club;
    teView = "list";
    teRender();
  }

  function editSlot(key) {
    teEditKey = key;
    teNew = false;
    teView = "edit";
    teRender();
  }

  function addCustom() {
    if (!teClub) return;
    teEditKey = nextCustomSlot(teClub);
    teNew = true;
    teView = "edit";
    teRender();
  }

  function cancelEdit() {
    teView = "list";
    teNew = false;
    teRender();
  }

  function readVal(id, lo, hi, dflt) {
    var el = document.getElementById(id);
    return el ? num(el.value, lo, hi, dflt) : dflt;
  }

  function readText(id) {
    var el = document.getElementById(id);
    return el ? clean(el.value) : "";
  }

  function savePlayer() {
    if (!teClub || !teEditKey) return;
    var rec = editFor(teClub, teEditKey);
    saveSlot(teClub, teEditKey, {
      name: readText("teName"),
      role: readText("teRole") || (rec ? rec.role : "attacker"),
      age: readVal("teAge", 16, 45, rec ? rec.age : 24),
      pace: readVal("tePace", 1, 99, rec ? rec.pace : 65),
      shooting: readVal("teShooting", 1, 99, rec ? rec.shooting : 65),
      passing: readVal("tePassing", 1, 99, rec ? rec.passing : 65),
      dribbling: readVal("teDribbling", 1, 99, rec ? rec.dribbling : 65),
      defending: readVal("teDefending", 1, 99, rec ? rec.defending : 65),
      physical: readVal("tePhysical", 1, 99, rec ? rec.physical : 65),
      custom: teNew || (rec && rec.custom)
    });
    teView = "list";
    teNew = false;
    teRender();
  }

  function resetSlotUI() {
    resetSlot(teClub, teEditKey);
    teView = "list";
    teRender();
  }

  function resetClubUI() {
    if (!teClub) return;
    if (typeof window !== "undefined" && typeof window.confirm === "function" &&
      !window.confirm('Reset all Team Editor changes for "' + teClub + '"?')) return;
    resetClub(teClub);
    teView = "list";
    teRender();
  }

  /* ------------------------------------------------------- career leagues -- */
  function extraClubs() {
    var inLeague = {};
    var leagues = (typeof MYCLUB_LEAGUES !== "undefined" && MYCLUB_LEAGUES) ? MYCLUB_LEAGUES : [];
    for (var i = 0; i < leagues.length; i++) {
      var clubs = leagues[i].clubs || [];
      for (var j = 0; j < clubs.length; j++) inLeague[clubs[j]] = 1;
    }
    var out = [];
    if (typeof TEAM_ROSTERS !== "undefined") {
      for (var club in TEAM_ROSTERS) {
        if (has(TEAM_ROSTERS, club) && !inLeague[club]) out.push(club);
      }
    }
    out.sort(function (a, b) { return String(a).localeCompare(String(b)); });
    if (out.indexOf("Ajax") < 0) out.push("Ajax");
    if (out.length % 2) out.push("Benfica");
    return out;
  }

  var CAREER_LEAGUES = ((typeof MYCLUB_LEAGUES !== "undefined" && MYCLUB_LEAGUES) ? MYCLUB_LEAGUES : []).slice();
  var extras = extraClubs();
  if (extras.length) {
    CAREER_LEAGUES.push({
      name: "European League",
      short: "EU",
      country: "Europe",
      tier: 2,
      cup: "European Cup",
      super: "European Super Cup",
      clSlots: 0,
      color: "#2b6cb0",
      clubs: extras
    });
  }
  if (typeof window !== "undefined") window.CAREER_LEAGUES = CAREER_LEAGUES;

  window.TeamEdits = {
    KEY: KEY,
    loadDB: loadDB,
    saveDB: saveDB,
    db: function () { return DB; },
    isActive: function () { return active; },
    enterCareer: enterCareer,
    exitCareer: exitCareer,
    ensureClub: ensureClub,
    ensureCareerClubs: ensureCareerClubs,
    mergedRoster: mergedRoster,
    editFor: editFor,
    slotsFor: previewSlots,
    getSlot: getSlot,
    setSlot: setSlot,
    slotRole: slotRole,
    slotLabel: slotLabel,
    slotKeys: slotKeys,
    saveSlot: saveSlot,
    resetSlot: resetSlot,
    resetClub: resetClub,
    applyToSquad: applyToSquad,
    applyClub: applyClub,
    nextCustomSlot: nextCustomSlot
  };

  window.openGlobalTeamEditor = openEditor;
  window.closeGlobalTeamEditor = closeEditor;
  window.tePickLeague = pickLeague;
  window.tePickClub = pickClub;
  window.teEditSlot = editSlot;
  window.teAddCustom = addCustom;
  window.teCancelEdit = cancelEdit;
  window.teSavePlayer = savePlayer;
  window.teResetSlot = resetSlotUI;
  window.teResetClub = resetClubUI;
})();
