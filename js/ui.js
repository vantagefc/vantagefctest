


function escapeHtml(s) { 

  return String(s == null ? "" : s) 

    .replace(/&/g, "&amp;") 

    .replace(/</g, "&lt;") 

    .replace(/>/g, "&gt;") 

    .replace(/"/g, "&quot;"); 

} 



function formatMoney(n) { 

  if (n >= 1000000) { 

    const m = n / 1000000; 

    return "$" + (Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)) + "M"; 

  } 

  if (n >= 1000) return "$" + Math.floor(n / 1000) + "K"; 

  return "$" + n; 

} 



function marketRoleLabel(role) { 

  return MARKET_ROLE_LABEL[role] || role; 

} 



function clubStorageKey(team) { 

  return "wcMarket_" + team; 

} 



function slotIndex(key) { 

  return parseInt(key.slice(1), 10); 

} 



function getSlotData(roster, key) { 

  if (key === "gk") return roster.goalkeeper; 

  const i = slotIndex(key); 

  if (key[0] === "d") return roster.defenders[i]; 

  if (key[0] === "m") return roster.midfielders[i]; 

  return roster.attackers[i]; 

} 



function setSlotData(roster, key, data) { 

  if (key === "gk") { roster.goalkeeper = data; return; } 

  const i = slotIndex(key); 

  if (key[0] === "d") roster.defenders[i] = data; 

  else if (key[0] === "m") roster.midfielders[i] = data; 

  else roster.attackers[i] = data; 

} 



function snapshotClubDefaults(team) { 

  const r = TEAM_ROSTERS[team]; 

  if (!r) return; 

  clubDefaults[team] = { 

    goalkeeper: JSON.parse(JSON.stringify(r.goalkeeper)), 

    defenders: JSON.parse(JSON.stringify(r.defenders)), 

    midfielders: JSON.parse(JSON.stringify(r.midfielders)), 

    attackers: JSON.parse(JSON.stringify(r.attackers)) 

  }; 

} 



function saveClubState(teamArg) { 

  const teamName = teamArg || selectedTeam; 

  if (typeof localStorage === "undefined") return; 

  const r = TEAM_ROSTERS[teamName]; 

  if (!r) return; 

  try { 

    localStorage.setItem(clubStorageKey(teamName), JSON.stringify({ 

      version: 1, 

      coins: playerCoins,
      sponsor: selectedSponsor,
      seq: myClubCardSeq,

      squad: { 

        goalkeeper: r.goalkeeper, 

        defenders: r.defenders, 

        midfielders: r.midfielders, 

        attackers: r.attackers 

      }, 

      pool: ownedPool 

    })); 

  } catch (e) { /* storage unavailable - play without persistence */ } 

} 



function loadClubStateFor(team) { 

  playerCoins = DEFAULT_CLUB_COINS; 

  ownedPool = []; 

  if (!clubDefaults[team]) snapshotClubDefaults(team); 

  if (typeof localStorage === "undefined") return; 

  let raw = null; 

  try { raw = localStorage.getItem(clubStorageKey(team)); } catch (e) { return; } 

  if (!raw) return; 

  try { 

    const s = JSON.parse(raw); 

    if (!s || typeof s.coins !== "number") return;
    playerCoins = s.coins;
    selectedSponsor = typeof s.sponsor === "string" ? s.sponsor : null;
    if (Array.isArray(s.pool)) ownedPool = s.pool;
    if (typeof s.seq === "number") myClubCardSeq = Math.max(myClubCardSeq, s.seq);
    for (const p of ownedPool) {
      if (typeof p.__cid === "string" && p.__cid.indexOf("mc") === 0) {
        const n = parseInt(p.__cid.slice(2), 10);
        if (n > myClubCardSeq) myClubCardSeq = n;
      }
    } 

    const q = s.squad; 

    const r = TEAM_ROSTERS[team]; 

    if (q && r && q.goalkeeper && 

        Array.isArray(q.defenders) && 

        Array.isArray(q.midfielders) && 

        Array.isArray(q.attackers) && (q.defenders.length + q.midfielders.length + q.attackers.length) === 10) { 

      r.goalkeeper = q.goalkeeper; 

      r.defenders = q.defenders; 

      r.midfielders = q.midfielders; 

      r.attackers = q.attackers; 

    } 

    const seenCids = {};
    let cidHealChanged = false;
    const fixPoolCid = p => {
      if (!p) return;
      if (!p.__cid || seenCids[p.__cid]) { p.__cid = "mc" + (++myClubCardSeq); cidHealChanged = true; }
      seenCids[p.__cid] = true;
    };
    for (const p of ownedPool) fixPoolCid(p);
    const dedupKey = p => (p && (String(p.name || "") + "|" + String(p.variant || "") + "|" + String(p.role || ""))) || "";
    const slotCards = [];
    if (r) {
      for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
        const arr = Array.isArray(r[pos]) ? r[pos] : [r[pos]];
        for (const p of arr) if (p) slotCards.push(p);
      }
    }
    const rosterCountByKey = {};
    const rosterCidSet = {};
    for (const p of slotCards) {
      if (!p) continue;
      const k = dedupKey(p);
      if (k) rosterCountByKey[k] = (rosterCountByKey[k] || 0) + 1;
      if (p.__cid) rosterCidSet[p.__cid] = true;
    }
    // A roster slot whose own pool twin is missing means that card is sitting in
    // the lineup (its twin was pulled out of the pool when it was assigned). Any
    // other pool cards that share its name are genuine duplicates the player OWNS,
    // so they must never be capped or merged away by the name-based cleanup.
    const rosterTwinInPool = new Set();
    for (const p of ownedPool) if (p && p.__cid && rosterCidSet[p.__cid]) rosterTwinInPool.add(p.__cid);
    const twinMissingForKey = {};
    for (const p of slotCards) {
      if (!p) continue;
      const k = dedupKey(p);
      if (k && p.__cid && !rosterTwinInPool.has(p.__cid)) twinMissingForKey[k] = true;
    }
    const healedPool = [];
    const seenPoolLen = ownedPool.length;
    const keptCount = {};
    const pushed = new Set();
    const capFor = k => k ? (twinMissingForKey[k] ? Infinity : (rosterCountByKey[k] || Infinity)) : Infinity;
    for (const p of ownedPool) {
      const k = dedupKey(p);
      const cap = capFor(k);
      const isCidTwin = p.__cid && rosterCidSet[p.__cid];
      if (isCidTwin && ((keptCount[k] || 0) < cap)) {
        healedPool.push(p);
        keptCount[k] = (keptCount[k] || 0) + 1;
        pushed.add(p);
      }
    }
    for (const p of ownedPool) {
      if (pushed.has(p)) continue;
      const k = dedupKey(p);
      const cap = capFor(k);
      if (k && ((keptCount[k] || 0) >= cap)) continue;
      healedPool.push(p);
      if (k) keptCount[k] = (keptCount[k] || 0) + 1;
      pushed.add(p);
    }
    ownedPool = healedPool;
    if (healedPool.length !== seenPoolLen) { try { saveClubState(team); } catch (e) {} }
    if (r) {
      const poolByCid = {};
      for (const p of ownedPool) if (p && p.__cid) poolByCid[p.__cid] = p;
      const rosterClaimed = {};
      for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
        const arr = Array.isArray(r[pos]) ? r[pos] : [r[pos]];
        for (const p of arr) {
          if (!p) continue;
          const wasCid = p.__cid;
          const twin = (wasCid && poolByCid[wasCid]) || null;
          const cidOk = !!twin && String(twin.name || "") === String(p.name || "");
          if (!cidOk) {
            // The card is in the starting XI but its own pool twin is missing
            // (it was pulled out of the pool when it was assigned a slot). Put it
            // back under its OWN identity instead of merging it into a same-named
            // pool card - otherwise genuine 2x/3x duplicates collapse to 1x.
            if (wasCid && !poolByCid[wasCid] && !rosterClaimed[wasCid]) {
              ownedPool.push(p);
              poolByCid[wasCid] = p;
              cidHealChanged = true;
            } else {
              const k = dedupKey(p);
              let existing = null;
              for (const q of ownedPool) {
                if (q && !rosterClaimed[q.__cid] && dedupKey(q) === k && (!existing || q.__cid === wasCid)) existing = q;
              }
              if (existing && existing.__cid) {
                p.__cid = existing.__cid;
                cidHealChanged = true;
              } else {
                let cid = "mc" + (++myClubCardSeq);
                while (seenCids[cid] || rosterClaimed[cid]) cid = "mc" + (++myClubCardSeq);
                p.__cid = cid;
                ownedPool.push(p);
                cidHealChanged = true;
              }
            }
          }
          rosterClaimed[p.__cid] = true;
          seenCids[p.__cid] = true;
        }
      }
    }
    if (cidHealChanged) { try { saveClubState(team); } catch (e) {} } 

  } catch (e) { 

    playerCoins = DEFAULT_CLUB_COINS; 

    ownedPool = []; 

  } 

} 



function bestOf(list, role) { 

  let best = list[0]; 

  for (const p of list) { 

    if (calculateOverall(p, role) > calculateOverall(best, role)) best = p; 

  } 

  return best; 

} 



function boostStats(p) { 

  return { 

    pace: Math.min(99, p.pace + 6), 

    shooting: Math.min(99, p.shooting + 6), 

    passing: Math.min(99, p.passing + 6), 

    dribbling: Math.min(99, p.dribbling + 6), 

    defending: Math.min(99, p.defending + 6), 

    physical: Math.min(99, p.physical + 6) 

  }; 

} 



function getMarketForCountry(team) { 

  const r = TEAM_ROSTERS[team]; 

  if (!r) return []; 

  const cards = []; 

  const icons = ICON_PLAYERS[team] || []; 

  icons.forEach((ic, i) => { 

    const stats = { 

      pace: ic.stats.pace, shooting: ic.stats.shooting, passing: ic.stats.passing, 

      dribbling: ic.stats.dribbling, defending: ic.stats.defending, physical: ic.stats.physical 

    }; 

    cards.push({ id: "icon-" + i, name: ic.name, variant: null, role: ic.role, tag: "ICON", from: team, stats }); 

  }); 

  const superstars = SUPERSTAR_PLAYERS[team] || []; 

  superstars.forEach((ss, i) => { 

    const stats = { 

      pace: ss.stats.pace, shooting: ss.stats.shooting, passing: ss.stats.passing, 

      dribbling: ss.stats.dribbling, defending: ss.stats.defending, physical: ss.stats.physical 

    }; 

    cards.push({ id: "superstar-" + i, name: ss.name, variant: null, role: ss.role, tag: "SUPERSTAR", from: team, stats }); 

  }); 

  const maxes = MAX_PLAYERS[team] || []; 

  maxes.forEach((mx, i) => { 

    const stats = { 

      pace: mx.stats.pace, shooting: mx.stats.shooting, passing: mx.stats.passing, 

      dribbling: mx.stats.dribbling, defending: mx.stats.defending, physical: mx.stats.physical 

    }; 

    cards.push({ id: "max-" + i, name: mx.name, variant: null, role: mx.role, tag: "MAX", from: team, stats }); 

  }); 

  cards.push({ 

    id: "spec-def", name: bestOf(r.defenders, "defender").name || "Defender", 

    variant: "Prime", role: "defender", tag: "SPECIAL", from: team, 

    stats: boostStats(bestOf(r.defenders, "defender")) 

  }); 

  cards.push({ 

    id: "spec-mid", name: bestOf(r.midfielders, "midfielder").name || "Midfielder", 

    variant: "Prime", role: "midfielder", tag: "SPECIAL", from: team, 

    stats: boostStats(bestOf(r.midfielders, "midfielder")) 

  }); 

  cards.push({ 

    id: "spec-att", name: bestOf(r.attackers, "attacker").name || "Attacker", 

    variant: "Prime", role: "attacker", tag: "SPECIAL", from: team, 

    stats: boostStats(bestOf(r.attackers, "attacker")) 

  }); 

  cards.push({ 

    id: "spec-gk", name: r.goalkeeper.name || "Goalkeeper", 

    variant: "Prime", role: "goalkeeper", tag: "SPECIAL", from: team, 

    stats: boostStats(r.goalkeeper) 

  }); 

  return cards; 

} 



function cardPrice(card) { 

  const ovr = calculateOverall(card.stats, card.role); 

let price = Math.floor(Math.max(0, ovr - 70) * Math.max(0, ovr - 70) * 16000);

  if (card.tag === "ICON") price += 4000000;

  else if (card.tag === "MAX") price = Math.floor(price * 6) + 35000000;

  else if (card.tag === "WC") price += 24000000;

  else if (card.tag === "HOLO") price += 18000000;

  else if (card.tag === "RTG") price += 12000000;

  else if (card.tag === "SUPERSTAR") price += 6000000;

  return Math.max(500000, price); 

} 



function clubCardIdsInLineup() { 

  const r = TEAM_ROSTERS[selectedTeam]; 

  const ids = new Set(); 

  if (!r) return ids; 

  const cids_ = (currentMode === "myclub") ? myClubSlotList() : MARKET_SLOTS; 

  for (const s of cids_) { 

    const p = getSlotData(r, s.key); 

    if (p && p.__cid) ids.add(p.__cid); 

  } 

  return ids; 

} 



function isCardOwned(card) { 

  if (ownedPool.some(p => p.__cid === card.id)) return true; 

  return clubCardIdsInLineup().has(card.id); 

} 



function clonePlayer(p) { 

  const c = {}; 

  for (const k in p) { 

    if (Object.prototype.hasOwnProperty.call(p, k)) c[k] = p[k]; 

  } 

  return c; 

} 



function awardWinCoins() { 

  playerCoins += CLUB_WIN_PRIZE; 

  saveClubState(); 

  return CLUB_WIN_PRIZE; 

} 



// Bonus money paid after every user match: 500k per goal the team scored,
// plus an extra 500k when the match ends level (a penalty shootout still
// counts as the drawn match it was). Returned so the end screens can show
// the full haul; the win bonus is awarded separately by awardWinCoins().
function awardMatchAddOns() { 

  let total = 0; 

  if (blueScore > 0) { 

    const perGoals = blueScore * GOAL_PRIZE; 

    playerCoins += perGoals; 

    total += perGoals; 

  } 

  if (blueScore === redScore) { 

    playerCoins += DRAW_PRIZE; 

    total += DRAW_PRIZE; 

  } 

  if (total > 0) saveClubState(); 

  return total; 

} 



function doBuy(cardId) { 

  marketCards = getMarketForCountry(selectedTeam); 

  const card = marketCards.find(c => c.id === cardId); 

  if (!card) return "That player is no longer available."; 

  if (isCardOwned(card)) return "That player is already in your squad."; 

  const price = cardPrice(card); 

  if (playerCoins < price) return "Not enough money."; 

  playerCoins -= price; 

  ownedPool.push({ 

    name: card.name, variant: card.variant, __cid: card.id, 

    role: card.role, tag: card.tag, 

    pace: card.stats.pace, shooting: card.stats.shooting, passing: card.stats.passing, 

    dribbling: card.stats.dribbling, defending: card.stats.defending, physical: card.stats.physical 

  }); 

  saveClubState(); 

  return null; 

} 



function doSwap(slotKey, choice) { 

  const r = TEAM_ROSTERS[selectedTeam]; 

  if (!r) return "No squad available."; 

  const slot = (currentMode === "myclub") ? (myClubSlotList().find(s => s.key === slotKey) || null) : (MARKET_SLOTS.find(s => s.key === slotKey) || null); 

  if (!slot) return "Invalid slot."; 

  const current = getSlotData(r, slotKey); 

  if (choice === "current" || choice === null) return null; 

  if (choice === "default") { 

    const defR = (currentMode === "myclub") ? myClubDefaultRoster() : clubDefaults[selectedTeam]; 

    const def = getSlotData(defR, slotKey); 

    if (!def) return "Original player data is missing."; 

    if (current.__cid) { 

      const drop = clonePlayer(current); 

      drop.role = cardNaturalRole(current) || slot.role; 

      if (!ownedPool.some(p => p.__cid === current.__cid)) ownedPool.push(drop); 

    } 

    setSlotData(r, slotKey, clonePlayer(def)); 

    saveClubState(); 

    syncMyClubBench(); 

    return null; 

  } 

  const idx = ownedPool.findIndex(p => p.__cid === choice); 

  if (idx === -1) return "That player is not in your squad."; 

const chosen = ownedPool[idx];

  if (cardIsSuspended(chosen)) return chosen.name + " is suspended for this match - they can't be picked.";

  if (cardIsInjured(chosen)) return chosen.name + " is injured and can't play. They'll be back in " + cardInjuryDays(chosen) + " day" + (cardInjuryDays(chosen) > 1 ? "s" : "") + ".";

  if (currentMode !== "myclub" && chosen.role !== slot.role && chosen.tag !== "SUPERSTAR") return "Wrong position for this slot.";

  ownedPool.splice(idx, 1); 

  if (current.__cid) { 

    const drop = clonePlayer(current); 

    drop.role = cardNaturalRole(current) || slot.role; 

    if (!ownedPool.some(p => p.__cid === current.__cid)) ownedPool.push(drop); 

  } 

  setSlotData(r, slotKey, clonePlayer(chosen)); 

  saveClubState(); 

  syncMyClubBench(); 

  return null; 

} 



function buyPlayer(cardId) { 

  const err = doBuy(cardId); 

  const msgEl = document.getElementById("marketMsg"); 

  if (msgEl) msgEl.textContent = err || ""; 

  renderMarket(); 

} 



function marketCardHTML(c) { 

  const ovr = calculateOverall(c.stats, c.role); 

  const owned = isCardOwned(c); 

  const price = cardPrice(c); 

  const inLineup = clubCardIdsInLineup().has(c.id); 

  let action; 

  if (owned) { 

    action = `<div class="marketBuy own">${inLineup ? "IN SQUAD" : "OWNED"}</div>`; 

  } else { 

    action = `<button class="marketBuy" onclick="buyPlayer('${c.id}')">BUY ${formatMoney(price)}</button>`; 

  } 

  return ` 

    <div class="marketCard ${c.tag === "ICON" ? "cardIcon" : c.tag === "SUPERSTAR" ? "cardSuperstar" : c.tag === "MAX" ? "cardMax" : "cardSpecial"}"> 

      <div class="marketCardTop"> 

        <span class="marketTag">${c.tag}</span> 

        <span class="marketOvr">${ovr}</span> 

      </div> 

      <div class="marketName">${escapeHtml(c.name)}</div> 

      ${c.variant ? `<div class="marketVariant">${escapeHtml(c.variant)}</div>` : ""} 

      <div class="marketRole">${c.tag === "SUPERSTAR" ? "Any Position" : marketRoleLabel(c.role)}</div> 

      <div class="marketStats">PAC ${c.stats.pace} SHO ${c.stats.shooting} PAS ${c.stats.passing}</div> 

      <div class="marketStats">DRI ${c.stats.dribbling} DEF ${c.stats.defending} PHY ${c.stats.physical}</div> 

      ${action} 

    </div>`; 

} 



function renderMarketFilters() { 

  document.getElementById("marketFilters").innerHTML = MARKET_FILTERS.map(f => 

    `<button class="filterChip ${marketCategory === f[0] ? "active" : ""}" ` + 

    `onclick="setMarketFilter('${f[0]}')">${f[1]}</button>` 

  ).join(""); 

} 



function renderMarket() { 

  const r = TEAM_ROSTERS[selectedTeam]; 

  if (!r) return; 

  if (!clubDefaults[selectedTeam]) snapshotClubDefaults(selectedTeam); 

  marketCards = getMarketForCountry(selectedTeam); 

  document.getElementById("marketTitle").textContent = selectedTeam + " Transfer Market"; 

  document.getElementById("marketBalance").textContent = "Balance: " + formatMoney(playerCoins); 

  renderMarketFilters(); 

  const shown = marketCards.filter(c => { 

    if (marketCategory === "all") return true; 

    if (marketCategory === "icons") return c.tag === "ICON"; 

    if (marketCategory === "superstar") return c.tag === "SUPERSTAR"; 

    if (marketCategory === "max") return c.tag === "MAX"; 

    if (marketCategory === "special") return c.tag === "SPECIAL"; 

    return c.role === marketCategory; 

  }); 

  document.getElementById("marketList").innerHTML = 

    shown.map(c => marketCardHTML(c)).join("") || 

    '<div class="marketEmpty">No players in this category.</div>'; 

} 



function setMarketFilter(cat) { 

  marketCategory = cat; 

  renderMarket(); 

} 



function openMarket() { 

  if (!selectedTeam) return; 

  loadClubStateFor(selectedTeam); 

  const msgEl = document.getElementById("marketMsg"); 

  if (msgEl) msgEl.textContent = ""; 

  closeTeamEditorSilent(); 

  renderMarket(); 

  document.getElementById("marketModal").style.display = "flex"; 

  const mm = document.getElementById("marketMenuButton"); 

  if (mm) mm.textContent = "Transfer Market & Squad (" + formatMoney(playerCoins) + ")"; 

} 



function closeMarket() { 

  document.getElementById("marketModal").style.display = "none"; 

} 



function closeTeamEditorSilent() { 

  const el = document.getElementById("editorModal"); 

  if (el) el.style.display = "none"; 

} 



function editorSelectChange(sel) { 

  const err = doSwap(sel.getAttribute("data-slot"), sel.value); 

  const msgEl = document.getElementById("editorMsg"); 

  if (msgEl) msgEl.textContent = err || ""; 

  renderTeamEditor(); 

} 



function renderEditorPool(assigned) { 

  const poolEl = document.getElementById("editorPool"); 

  if (!poolEl) return; 

  if (!ownedPool.length) { 

    poolEl.innerHTML = 

      '<div class="editorEmpty">No purchased players yet. Buy some in the Transfer Market.</div>'; 

    return; 

  } 

  poolEl.innerHTML = ownedPool.map(p => { 

    const ovr = calculateOverall(p, p.role || "attacker"); 

    return ` 

      <div class="editorPoolCard"> 

        <span class="editorPoolOvr">${ovr}</span> 

        <strong>${escapeHtml(p.name)}</strong> 

        ${p.variant ? ` <span class="marketVariant">${escapeHtml(p.variant)}</span>` : ""} 

        <div style="font-size:11px;color:#8ea3b8;text-transform:uppercase;letter-spacing:1px;">${p.tag === "SUPERSTAR" ? "Flex - any position" : marketRoleLabel(p.role)}</div> 

      </div>`; 

  }).join(""); 

} 



function renderTeamEditor() { 

  const r = TEAM_ROSTERS[selectedTeam]; 

  if (!r) return; 

  if (!clubDefaults[selectedTeam]) snapshotClubDefaults(selectedTeam); 

  document.getElementById("editorTitle").textContent = "Squad Editor - " + selectedTeam; 

  document.getElementById("editorBalance").textContent = "Balance: " + formatMoney(playerCoins); 

  document.getElementById("editorMsg").textContent = ""; 

  const assigned = clubCardIdsInLineup(); 

  let html = ""; 

  for (const s of MARKET_SLOTS) { 

    const cur = getSlotData(r, s.key); 

    const def = getSlotData(clubDefaults[selectedTeam], s.key); 

    let opts = `<option value="current">${escapeHtml(cur.name)} (current)</option>`; 

    if (def && (cur.__cid || (cur.name || "") !== (def.name || ""))) { 

      opts += `<option value="default">${escapeHtml(def.name)} (original)</option>`; 

    } 

    for (const p of ownedPool) { 

      if (p.role !== s.role && p.tag !== "SUPERSTAR") continue; 

      if (assigned.has(p.__cid) && p.__cid !== (cur.__cid || null)) continue; 

      opts += `<option value="${escapeHtml(p.__cid)}">${escapeHtml(p.name)}` + 

        `${p.variant ? ` (${escapeHtml(p.variant)})` : ""}</option>`; 

    } 

    html += ` 

      <div class="editorRow"> 

        <span class="editorSlot">${s.label}</span> 

        <select class="editorSelect" data-slot="${s.key}" onchange="editorSelectChange(this)"> 

          ${opts} 

        </select> 

      </div>`; 

  } 

  document.getElementById("editorLineup").innerHTML = html; 

  renderEditorPool(assigned); 

} 



function openTeamEditor() { 

  if (!selectedTeam) return; 

  loadClubStateFor(selectedTeam); 

  closeMarket(); 

  renderTeamEditor(); 

  document.getElementById("editorModal").style.display = "flex"; 

} 



function closeTeamEditor() { 

  document.getElementById("editorModal").style.display = "none"; 

} 



let currentMode = "champions";
let myClubLeague = null;
let myClubCareerData = { v: 1, careers: {} };

const MYCLUB_STORAGE_KEY = "myClubCareer_v1";
const MYCLUB_STARTER_COINS = 350000;
const MYCLUB_TITLE_PRIZE = 2500000;
const MYCLUB_CWC_PRIZE = 10000000;
const MYCLUB_MATCH = { win: 350000, draw: 150000, goal: 60000 };
const MY_CLUB_BOX_PRICE = 250000;
const MY_CLUB_BOOST_MATCHES = 5;
const MY_CLUB_XP = { goal: 25, win: 150, draw: 75 };
const MY_CLUB_STAT_LABELS = { pace: "Pace", shooting: "Shooting", passing: "Passing", dribbling: "Dribbling", defending: "Defending", physical: "Physical" };
const MY_CLUB_CONSUMABLE_TIER = { Common: "tierBronze", Rare: "tierSilver", Epic: "tierGold", Legendary: "tierMax" };

// Specialty pools for the shop's hourly rotating packs. Each entry sets its
// own nation so the card shows a real flag without needing a league table.
const MYCLUB_CAPTAIN_PLAYERS = [
  { name: "Harry Kane", ovr: 91, role: "attacker", nation: "England" },
  { name: "Lionel Messi", ovr: 91, role: "attacker", nation: "Argentina" },
  { name: "Kylian Mbappe", ovr: 92, role: "attacker", nation: "France" },
  { name: "Kevin De Bruyne", ovr: 90, role: "midfielder", nation: "Belgium" },
  { name: "Mohamed Salah", ovr: 90, role: "attacker", nation: "Egypt" },
  { name: "Virgil van Dijk", ovr: 89, role: "defender", nation: "Netherlands" },
  { name: "Son Heung-min", ovr: 89, role: "attacker", nation: "South Korea" },
  { name: "Luka Modric", ovr: 89, role: "midfielder", nation: "Croatia" },
  { name: "Bruno Fernandes", ovr: 89, role: "midfielder", nation: "Portugal" },
  { name: "Marquinhos", ovr: 88, role: "defender", nation: "Brazil" },
  { name: "Manuel Neuer", ovr: 88, role: "goalkeeper", nation: "Germany" },
  { name: "Dani Carvajal", ovr: 87, role: "defender", nation: "Spain" },
  { name: "Ruben Dias", ovr: 88, role: "defender", nation: "Portugal" },
  { name: "Victor Osimhen", ovr: 88, role: "attacker", nation: "Nigeria" }
];

const MYCLUB_PL_PLAYERS = [
  { name: "Erling Haaland", ovr: 92, role: "attacker", nation: "Norway" },
  { name: "Bukayo Saka", ovr: 89, role: "attacker", nation: "England" },
  { name: "Cole Palmer", ovr: 88, role: "midfielder", nation: "England" },
  { name: "William Saliba", ovr: 89, role: "defender", nation: "France" },
  { name: "Rodri", ovr: 90, role: "midfielder", nation: "Spain" },
  { name: "Kevin De Bruyne", ovr: 90, role: "midfielder", nation: "Belgium" },
  { name: "Mohamed Salah", ovr: 90, role: "attacker", nation: "Egypt" },
  { name: "Virgil van Dijk", ovr: 89, role: "defender", nation: "Netherlands" },
  { name: "Alisson Becker", ovr: 89, role: "goalkeeper", nation: "Brazil" },
  { name: "Bruno Fernandes", ovr: 89, role: "midfielder", nation: "Portugal" },
  { name: "Son Heung-min", ovr: 89, role: "attacker", nation: "South Korea" },
  { name: "Trent Alexander-Arnold", ovr: 87, role: "defender", nation: "England" },
  { name: "Alexander Isak", ovr: 88, role: "attacker", nation: "Sweden" },
  { name: "Anthony Gordon", ovr: 87, role: "attacker", nation: "England" },
  { name: "Declan Rice", ovr: 88, role: "midfielder", nation: "England" },
  { name: "Gabriel Magalhaes", ovr: 87, role: "defender", nation: "Brazil" },
  { name: "Lisandro Martinez", ovr: 87, role: "defender", nation: "Argentina" },
  { name: "Dominik Szoboszlai", ovr: 86, role: "midfielder", nation: "Hungary" }
];

const MYCLUB_LALIGA_PLAYERS = [
  { name: "Kylian Mbappe", ovr: 92, role: "attacker", nation: "France" },
  { name: "Jude Bellingham", ovr: 91, role: "midfielder", nation: "England" },
  { name: "Vinicius Junior", ovr: 90, role: "attacker", nation: "Brazil" },
  { name: "Lamine Yamal", ovr: 90, role: "attacker", nation: "Spain" },
  { name: "Pedri", ovr: 89, role: "midfielder", nation: "Spain" },
  { name: "Federico Valverde", ovr: 89, role: "midfielder", nation: "Uruguay" },
  { name: "Thibaut Courtois", ovr: 90, role: "goalkeeper", nation: "Belgium" },
  { name: "Antoine Griezmann", ovr: 89, role: "attacker", nation: "France" },
  { name: "Robert Lewandowski", ovr: 89, role: "attacker", nation: "Poland" },
  { name: "Jan Oblak", ovr: 89, role: "goalkeeper", nation: "Slovenia" },
  { name: "Raphinha", ovr: 88, role: "attacker", nation: "Brazil" },
  { name: "Nico Williams", ovr: 87, role: "attacker", nation: "Spain" },
  { name: "Antonio Rudiger", ovr: 88, role: "defender", nation: "Germany" },
  { name: "Eduardo Camavinga", ovr: 86, role: "midfielder", nation: "France" },
  { name: "Aurelien Tchouameni", ovr: 87, role: "midfielder", nation: "France" }
];

const MYCLUB_BUNDESLIGA_PLAYERS = [
  { name: "Harry Kane", ovr: 91, role: "attacker", nation: "England" },
  { name: "Jamal Musiala", ovr: 90, role: "midfielder", nation: "Germany" },
  { name: "Florian Wirtz", ovr: 90, role: "midfielder", nation: "Germany" },
  { name: "Alphonso Davies", ovr: 87, role: "defender", nation: "Canada" },
  { name: "Manuel Neuer", ovr: 88, role: "goalkeeper", nation: "Germany" },
  { name: "Joshua Kimmich", ovr: 89, role: "midfielder", nation: "Germany" },
  { name: "Michael Olise", ovr: 88, role: "attacker", nation: "France" },
  { name: "Xavi Simons", ovr: 88, role: "midfielder", nation: "Netherlands" },
  { name: "Victor Boniface", ovr: 87, role: "attacker", nation: "Nigeria" },
  { name: "Alejandro Grimaldo", ovr: 87, role: "defender", nation: "Spain" },
  { name: "Lois Openda", ovr: 87, role: "attacker", nation: "Belgium" },
  { name: "Gregor Kobel", ovr: 87, role: "goalkeeper", nation: "Switzerland" },
  { name: "Nico Schlotterbeck", ovr: 87, role: "defender", nation: "Germany" },
  { name: "Serhou Guirassy", ovr: 88, role: "attacker", nation: "Guinea" }
];

const MYCLUB_SERIEA_PLAYERS = [
  { name: "Lautaro Martinez", ovr: 89, role: "attacker", nation: "Argentina" },
  { name: "Nicolo Barella", ovr: 88, role: "midfielder", nation: "Italy" },
  { name: "Alessandro Bastoni", ovr: 88, role: "defender", nation: "Italy" },
  { name: "Marcus Thuram", ovr: 88, role: "attacker", nation: "France" },
  { name: "Victor Osimhen", ovr: 88, role: "attacker", nation: "Nigeria" },
  { name: "Rafael Leao", ovr: 88, role: "attacker", nation: "Portugal" },
  { name: "Federico Dimarco", ovr: 87, role: "defender", nation: "Italy" },
  { name: "Mike Maignan", ovr: 89, role: "goalkeeper", nation: "France" },
  { name: "Theo Hernandez", ovr: 87, role: "defender", nation: "France" },
  { name: "Christian Pulisic", ovr: 87, role: "attacker", nation: "United States" },
  { name: "Paulo Dybala", ovr: 87, role: "attacker", nation: "Argentina" },
  { name: "Alessandro Buongiorno", ovr: 86, role: "defender", nation: "Italy" }
];

const MYCLUB_LIGUE1_PLAYERS = [
  { name: "Gianluigi Donnarumma", ovr: 89, role: "goalkeeper", nation: "Italy" },
  { name: "Achraf Hakimi", ovr: 88, role: "defender", nation: "Morocco" },
  { name: "Marquinhos", ovr: 88, role: "defender", nation: "Brazil" },
  { name: "Warren Zaire-Emery", ovr: 87, role: "midfielder", nation: "France" },
  { name: "Bradley Barcola", ovr: 87, role: "attacker", nation: "France" },
  { name: "Ousmane Dembele", ovr: 88, role: "attacker", nation: "France" },
  { name: "Vitinha", ovr: 87, role: "midfielder", nation: "Portugal" },
  { name: "Rayan Cherki", ovr: 86, role: "midfielder", nation: "France" },
  { name: "Jonathan David", ovr: 87, role: "attacker", nation: "Canada" },
  { name: "Joao Neves", ovr: 87, role: "midfielder", nation: "Portugal" }
];

const MYCLUB_NATION_LEADER_PLAYERS = [
  { name: "Diego Maradona", ovr: 90, role: "attacker", nation: "Argentina" },
  { name: "Zinedine Zidane", ovr: 91, role: "midfielder", nation: "France" },
  { name: "Pele", ovr: 92, role: "attacker", nation: "Brazil" },
  { name: "Johan Cruyff", ovr: 91, role: "attacker", nation: "Netherlands" },
  { name: "Cristiano Ronaldo", ovr: 91, role: "attacker", nation: "Portugal" },
  { name: "Lionel Messi", ovr: 91, role: "attacker", nation: "Argentina" },
  { name: "Luka Modric", ovr: 89, role: "midfielder", nation: "Croatia" },
  { name: "Mohamed Salah", ovr: 89, role: "attacker", nation: "Egypt" },
  { name: "Harry Kane", ovr: 89, role: "attacker", nation: "England" },
  { name: "Son Heung-min", ovr: 89, role: "attacker", nation: "South Korea" },
  { name: "Roberto Baggio", ovr: 89, role: "attacker", nation: "Italy" },
  { name: "Michel Platini", ovr: 90, role: "midfielder", nation: "France" },
  { name: "Gheorghe Hagi", ovr: 89, role: "midfielder", nation: "Romania" },
  { name: "Jari Litmanen", ovr: 87, role: "midfielder", nation: "Finland" }
];

// The five league standout pools, grouped so a single "league" rarity can pick
// one at random without needing its own pack.
const MYCLUB_LEAGUE_POOLS = [
  { tag: "PL", variant: "Premier League", pool: MYCLUB_PL_PLAYERS },
  { tag: "LALIGA", variant: "La Liga", pool: MYCLUB_LALIGA_PLAYERS },
  { tag: "BUNDESLIGA", variant: "Bundesliga", pool: MYCLUB_BUNDESLIGA_PLAYERS },
  { tag: "SERIEA", variant: "Serie A", pool: MYCLUB_SERIEA_PLAYERS },
  { tag: "LIGUE1", variant: "Ligue 1", pool: MYCLUB_LIGUE1_PLAYERS }
];

// FIFA-style rairty tiers. "odds" packs roll each card through a weighted
// rarity table (mostly their own tier, with an upgrade chance), so a Bronze
// Pack is mostly Bronze but can drop Silver, Gold or a rare Special/Icon.
// "tier" packs guarantee that rarity on every card.
const MYCLUB_PACKS = {
  tier1: { name: "Tier I Pack", price: 150000, count: 5, css: "packTierBase", minLevel: 1, tierPack: true, desc: "5 cards. Every card in the game can drop - Bronze and Silver lead, the rarest cards are a long shot.", odds: [
    {r:"bronze",w:600},{r:"silver",w:250},{r:"gold",w:80},{r:"prospect",w:30},{r:"special",w:22},
    {r:"captain",w:6},{r:"league",w:8},{r:"hero",w:4},{r:"nationleader",w:2},{r:"icon",w:1.5},
    {r:"legend",w:1.1},{r:"rtg",w:0.6},{r:"holo",w:0.25},{r:"wc",w:0.06},{r:"max",w:0.01}
  ] },
  tier2: { name: "Tier II Pack", price: 500000, count: 6, css: "packTierBase", minLevel: 2, tierPack: true, desc: "6 cards. A fuller spread of every rarity, with stronger Silver and early Gold odds.", odds: [
    {r:"bronze",w:330},{r:"silver",w:350},{r:"gold",w:180},{r:"prospect",w:60},{r:"special",w:50},
    {r:"captain",w:18},{r:"league",w:22},{r:"hero",w:12},{r:"nationleader",w:6},{r:"icon",w:4},
    {r:"legend",w:3},{r:"rtg",w:1.8},{r:"holo",w:0.7},{r:"wc",w:0.18},{r:"max",w:0.03}
  ] },
  tier3: { name: "Tier III Pack", price: 1500000, count: 8, css: "packTierSpecial", minLevel: 3, tierPack: true, desc: "8 cards. Gold and Special become common, and the rare rarities get far more reachable.", odds: [
    {r:"bronze",w:100},{r:"silver",w:240},{r:"gold",w:330},{r:"prospect",w:120},{r:"special",w:115},
    {r:"captain",w:50},{r:"league",w:60},{r:"hero",w:40},{r:"nationleader",w:24},{r:"icon",w:16},
    {r:"legend",w:12},{r:"rtg",w:7},{r:"holo",w:2.6},{r:"wc",w:0.7},{r:"max",w:0.12}
  ] },
  tier4: { name: "Tier IV Pack", price: 3500000, count: 8, css: "packTierSpecial", minLevel: 5, tierPack: true, desc: "8 cards. Strong odds on Special and premium cards, with a real shot at the elite.", odds: [
    {r:"bronze",w:22},{r:"silver",w:95},{r:"gold",w:300},{r:"prospect",w:190},{r:"special",w:200},
    {r:"captain",w:105},{r:"league",w:125},{r:"hero",w:95},{r:"nationleader",w:62},{r:"icon",w:44},
    {r:"legend",w:33},{r:"rtg",w:20},{r:"holo",w:8},{r:"wc",w:2.2},{r:"max",w:0.4}
  ] },
  tier5: { name: "Tier V Pack", price: 9000000, count: 10, css: "packTierIcon", minLevel: 6, tierPack: true, desc: "10 cards. Best odds for every rarity, including the rarest cards in the game.", odds: [
    {r:"bronze",w:5},{r:"silver",w:24},{r:"gold",w:180},{r:"prospect",w:220},{r:"special",w:290},
    {r:"captain",w:170},{r:"league",w:200},{r:"hero",w:150},{r:"nationleader",w:105},{r:"icon",w:78},
    {r:"legend",w:58},{r:"rtg",w:34},{r:"holo",w:14},{r:"wc",w:3.8},{r:"max",w:0.7}
  ] },
  bronze: {
    name: "Bronze Pack", price: 300000, count: 10, css: "packTierBase", minLevel: 1,
    desc: "10 cards - 1 guaranteed Bronze, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "bronze", w: 79 },
      { r: "silver", w: 15 },
      { r: "gold", w: 6 }
    ]
  },
  silver: {
    name: "Silver Pack", price: 750000, count: 10, css: "packTierBase", minLevel: 2,
    desc: "10 cards - 1 guaranteed Silver, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "silver", w: 74 },
      { r: "gold", w: 20 },
      { r: "special", w: 6 }
    ]
  },
  gold: {
    name: "Gold Pack", price: 2000000, count: 10, css: "packTierSpecial", minLevel: 3,
    desc: "10 cards - 1 guaranteed Gold, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "gold", w: 82 },
      { r: "special", w: 16 },
      { r: "icon", w: 2 }
    ]
  },
  special: { name: "Special Pack", price: 3000000, count: 10, css: "packTierSpecial", minLevel: 5, tier: "special", desc: "10 cards - 1 guaranteed Special star, the rest pulled from lower packs (no cards within two tiers of it)." },
  icon: { name: "Icon Pack", price: 12000000, count: 10, css: "packTierIcon", minLevel: 6, tier: "icon", desc: "10 cards - 1 guaranteed Icon plus 9 from lower packs (no cards within two tiers of it)." },
  gk: {
    name: "Goalkeeper Pack", price: 750000, count: 10, css: "packTierSpecial", role: "goalkeeper", minLevel: 3,
    desc: "10 goalkeepers - 1 guaranteed Silver goalkeeper, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "bronze", w: 24 },
      { r: "silver", w: 66 },
      { r: "gold", w: 8 },
      { r: "icon", w: 2 }
    ]
  },
  def: {
    name: "Defender Pack", price: 1050000, count: 10, css: "packTierSpecial", role: "defender", minLevel: 3,
    desc: "10 defenders - 1 guaranteed Silver defender, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "bronze", w: 20 },
      { r: "silver", w: 58 },
      { r: "gold", w: 20 },
      { r: "icon", w: 2 }
    ]
  },
  mid: {
    name: "Midfielder Pack", price: 1500000, count: 10, css: "packTierSpecial", role: "midfielder", minLevel: 4,
    desc: "10 midfielders - 1 guaranteed Gold midfielder, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "silver", w: 63 },
      { r: "gold", w: 30 },
      { r: "special", w: 5 },
      { r: "icon", w: 2 }
    ]
  },
  att: {
    name: "Attacker Pack", price: 1750000, count: 10, css: "packTierSpecial", role: "attacker", minLevel: 4,
    desc: "10 attackers - 1 guaranteed Gold attacker, the rest pulled from lower packs, plus a chance of a bonus card.",
    odds: [
      { r: "silver", w: 58 },
      { r: "gold", w: 33 },
      { r: "special", w: 7 },
      { r: "icon", w: 2 }
    ]
  },
  nation: {
    name: "Nation History Pack", price: 8000000, count: 10, css: "packTierIcon", tier: "legend", minLevel: 5,
    desc: "10 cards - 1 guaranteed Nation Legend plus 9 from lower packs (no cards within two tiers of it)."
  },
  manager: {
    name: "Manager Pack", price: 1500000, count: 1, css: "packTierIcon", tier: "manager", minLevel: 2,
    desc: "1 legendary manager from soccer history. Assign them to boost your squad."
  },
  box: {
    name: "Consumable Box", price: MY_CLUB_BOX_PRICE, count: 1, css: "packTierBase", tier: "consumable", box: true, minLevel: 2,
    desc: "1 consumable item for a temporary player boost. Better boosts are much rarer - pull boxes and level up to stock up."
  },
  prospect: {
    name: "Prospect Pack", price: 500000, count: 10, css: "packTierBase", tier: "prospect", minLevel: 2,
    desc: "10 cards - 1 guaranteed Prospect, the rest pulled from lower packs, plus a chance of a bonus card."
  },
  gamelegend: {
    name: "Legends of the Game Pack", price: 5000000, count: 10, css: "packTierIcon", tier: "hero", minLevel: 5,
    desc: "10 cards - 1 guaranteed Game Legend plus 9 from lower packs (no cards within two tiers of it)."
  },
  captain: {
    name: "Captain Pack", price: 3600000, count: 3, css: "packTierCaptain", minLevel: 3, shopOnly: true,
    variant: "Team Captain", tag: "CAPTAIN", pool: MYCLUB_CAPTAIN_PLAYERS,
    desc: "3 Team Captain cards - men who lead club or country. Elite leaders at the heart of the game."
  },
  pl: {
    name: "Premier League Pack", price: 2400000, count: 3, css: "packTierPL", minLevel: 2, shopOnly: true,
    variant: "Premier League", tag: "PL", pool: MYCLUB_PL_PLAYERS,
    desc: "3 Premier League cards - the standouts of England's top flight."
  },
  laliga: {
    name: "La Liga Pack", price: 2400000, count: 3, css: "packTierLaLiga", minLevel: 2, shopOnly: true,
    variant: "La Liga", tag: "LALIGA", pool: MYCLUB_LALIGA_PLAYERS,
    desc: "3 La Liga cards - the maestros of Spanish football."
  },
  bundesliga: {
    name: "Bundesliga Pack", price: 2400000, count: 3, css: "packTierBundesliga", minLevel: 2, shopOnly: true,
    variant: "Bundesliga", tag: "BUNDESLIGA", pool: MYCLUB_BUNDESLIGA_PLAYERS,
    desc: "3 Bundesliga cards - German football's engine room."
  },
  seriea: {
    name: "Serie A Pack", price: 2400000, count: 3, css: "packTierSerieA", minLevel: 2, shopOnly: true,
    variant: "Serie A", tag: "SERIEA", pool: MYCLUB_SERIEA_PLAYERS,
    desc: "3 Serie A cards - Italian calcio's finest."
  },
  ligue1: {
    name: "Ligue 1 Pack", price: 2400000, count: 3, css: "packTierLigue1", minLevel: 2, shopOnly: true,
    variant: "Ligue 1", tag: "LIGUE1", pool: MYCLUB_LIGUE1_PLAYERS,
    desc: "3 Ligue 1 cards - French football's brightest stars."
  },
  nationleader: {
    name: "Nation Leader Pack", price: 4800000, count: 3, css: "packTierNationLeader", minLevel: 4, shopOnly: true,
    variant: "Nation Leader", tag: "NATIONLEADER", pool: MYCLUB_NATION_LEADER_PLAYERS,
    desc: "3 Nation Leader cards - the icons who single-handedly carried their country."
  }
};

// The Pack Shop sells only the five Tier packs plus the two non-player packs
// (managers and consumables). Every player card in the game is reachable from
// the Tier packs, with rarer cards weighted up as the tier rises.
const MYCLUB_PACK_SHOP_KEYS = ["tier1", "tier2", "tier3", "tier4", "tier5", "manager", "box"];

const MYCLUB_PACK_OPEN_CARDS = 10;
const MYCLUB_PACK_LADDER = ["bronze", "prospect", "silver", "gk", "def", "mid", "att", "gold", "special", "gamelegend", "nation", "icon"];
const MYCLUB_PACK_OWN_RARITY = {
  bronze: "bronze", prospect: "prospect", silver: "silver", gk: "silver", def: "silver",
  mid: "gold", att: "gold", gold: "gold", special: "special", gamelegend: "hero", nation: "legend", icon: "icon"
};
const MYCLUB_PACK_LABELS = {
  bronze: "Bronze", prospect: "Prospect", silver: "Silver", gk: "Goalkeeper", def: "Defender",
  mid: "Midfielder", att: "Attacker", gold: "Gold", special: "Special", gamelegend: "Game Legend", nation: "Nation Legend", icon: "Icon"
};

let myClubNation = "Brazil";
const MYCLUB_RARITY_LABELS = {
  bronze: "Bronze", silver: "Silver", gold: "Gold",
  special: "Special", icon: "Icon", max: "MAX", legend: "Nation Legend", manager: "Manager", consumable: "Consumable",
  hero: "Game Legend", prospect: "Prospect",
  captain: "Team Captain", league: "League", nationleader: "Nation Leader",
  rtg: "Road to Glory", holo: "Holographic", wc: "World Cup"
};

// Road to Glory: in-form stars pulled as a bonus card from any player pack
// (not their own pack). Chosen from the hottest 26/27 clubs.
const MYCLUB_RTG_PLAYERS = [
  ["Yamal", 91, "attacker"], ["Raphinha", 90, "attacker"], ["Pedri", 90, "midfielder"],
  ["Lewandowski", 89, "attacker"], ["Saka", 90, "attacker"], ["Odegaard", 88, "midfielder"],
  ["Saliba", 90, "defender"], ["Rice", 87, "midfielder"], ["Haaland", 92, "attacker"],
  ["Foden", 90, "attacker"], ["Rodri", 90, "midfielder"], ["Kane", 91, "attacker"],
  ["Musiala", 90, "midfielder"], ["Wirtz", 90, "midfielder"], ["Dembele", 88, "attacker"],
  ["Vitinha", 87, "midfielder"], ["Hakimi", 88, "defender"], ["Lautaro", 90, "attacker"],
  ["Barella", 87, "midfielder"], ["Bastoni", 86, "defender"], ["Vinicius Jr", 91, "attacker"],
  ["Bellingham", 90, "midfielder"], ["Valverde", 90, "midfielder"], ["Salah", 91, "attacker"],
  ["Van Dijk", 90, "defender"], ["Mac Allister", 88, "midfielder"], ["Frimpong", 86, "defender"],
  ["Grimaldo", 86, "defender"]
];

// World Cup: Spain's 2026 World Cup winning squad (bonus card, WC winners).
const MYCLUB_WC_PLAYERS = [
  ["Unai Simon", 88, "goalkeeper"], ["Carvajal", 87, "defender"], ["Laporte", 88, "defender"],
  ["Le Normand", 87, "defender"], ["Cucurella", 86, "defender"], ["Rodri", 91, "midfielder"],
  ["Pedri", 90, "midfielder"], ["Fabian Ruiz", 88, "midfielder"], ["Merino", 87, "midfielder"],
  ["Zubimendi", 87, "midfielder"], ["Yamal", 91, "attacker"], ["Nico Williams", 88, "attacker"],
  ["Ferran Torres", 87, "attacker"], ["Oyarzabal", 89, "attacker"], ["Morata", 86, "attacker"]
];

// Holographic: a prestige series of 16 all-time greats given a shimmering
// finish. Third best card in the game - behind MAX and World Cup, ahead of
// Road to Glory - so it shares the 92-93 band but outranks RTG everywhere it
// matters (odds, market value and price).
const MYCLUB_HOLO_PLAYERS = [
  ["Beckenbauer", 93, "defender"], ["Gerd Muller", 93, "attacker"],
  ["Xavi", 92, "midfielder"], ["Iniesta", 92, "midfielder"],
  ["Hagi", 92, "midfielder"], ["Scholes", 92, "midfielder"],
  ["Pirlo", 92, "midfielder"], ["Kaka", 92, "midfielder"],
  ["Eusebio", 92, "attacker"], ["Totti", 92, "attacker"],
  ["Del Piero", 92, "attacker"], ["Casillas", 92, "goalkeeper"],
  ["Puyol", 91, "defender"], ["Nesta", 91, "defender"],
  ["Gerrard", 91, "midfielder"], ["Beckham", 91, "midfielder"]
];

// Bonus roll: keeps chance low on cheap packs and rising with pack price, capped
// so a bonus is always a nice surprise, never a guarantee.
function myClubBonusChance(spec) {
  const price = spec && typeof spec.price === "number" ? spec.price : 0;
  return Math.max(0.03, Math.min(0.4, 0.06 + price / 45000000));
}

// When a bonus hits, Road to Glory is always the common card. World Cup still
// climbs with pack price so an expensive pack is the better place to hunt one,
// but it never overtakes Road to Glory: the gap runs from roughly 4:1 on a
// bronze pack down to just under 2:1 on an Icon pack.
function myClubWcWeight(spec) {
  const price = spec && typeof spec.price === "number" ? spec.price : 0;
  return Math.min(0.3, 0.1 + (price / 40000000) * 0.3);
}

// And one more, extremely rare roll on top: a MAX card - the rarest bonus of
// all, rarer even than a World Cup winner (96-99 OVR all-time greats).
function myClubMaxWeight(spec) {
  const price = spec && typeof spec.price === "number" ? spec.price : 0;
  return Math.min(0.02, 0.004 + price / 500000000);
}

// Of the bonus rolls that get past the World Cup check, this share stays a Road
// to Glory card instead of dropping empty. This is what keeps Road to Glory the
// most common bonus at every pack price, since the World Cup weight alone only
// decides how often the better card takes the slot.
const MYCLUB_BONUS_RTG_SHARE = 0.45;

// Holographic sits between World Cup and Road to Glory, so it has to roll less
// often than a World Cup winner but far more often than a MAX.
function myClubHoloWeight(spec) {
  const price = spec && typeof spec.price === "number" ? spec.price : 0;
  return Math.min(0.16, 0.03 + (price / 40000000) * 0.16);
}

function makeMyClubBonusCard(spec) {
  if (Math.random() >= myClubBonusChance(spec)) return null;
  if (Math.random() < myClubMaxWeight(spec)) {
    const pick = MYCLUB_MAX_PLAYERS[Math.floor(Math.random() * MYCLUB_MAX_PLAYERS.length)];
    const card = makeRatedPlayer(pick[0], pick[1], pick[2]);
    card.role = pick[2];
    card.tag = "MAX";
    card.variant = "MAX";
    card.pos = myClubPackPos(pick[2]);
    card.nation = MYCLUB_PLAYER_NATIONS[pick[0]] || randNation();
    card.__bonus = true;
    return myClubFitTier(card, pick[1]);
  }
  // Holographic outranks both the World Cup and Road to Glory rolls, so it is
  // checked first and the remaining chances are shared out behind it.
  const holoHit = Math.random() < myClubHoloWeight(spec);
  const wcHit = !holoHit && Math.random() < myClubWcWeight(spec);
  if (!holoHit && !wcHit && Math.random() >= MYCLUB_BONUS_RTG_SHARE) return null;
  const pool = holoHit ? MYCLUB_HOLO_PLAYERS : wcHit ? MYCLUB_WC_PLAYERS : MYCLUB_RTG_PLAYERS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const boostedOvr = pick[1] + (Math.random() < 0.3 ? 1 : 0);
  const card = makeRatedPlayer(pick[0], boostedOvr, pick[2]);
  card.role = pick[2];
  card.tag = holoHit ? "HOLO" : wcHit ? "WC" : "RTG";
  card.variant = holoHit ? "Holographic" : wcHit ? "World Cup" : "Road to Glory";
  card.nation = MYCLUB_PLAYER_NATIONS[pick[0]] || (holoHit ? null : wcHit ? "Spain" : null);
  card.__bonus = true;
  return myClubFitTier(card, boostedOvr);
}

const MY_CLUB_MANAGERS = {
  ferguson: { name: "Sir Alex Ferguson", nation: "Scotland", era: "1986-2013", stat: "pace", group: "attacker", value: 5 },
  guardiola: { name: "Pep Guardiola", nation: "Spain", era: "2008-present", stat: "passing", group: "midfielder", value: 4 },
  mourinho: { name: "Jose Mourinho", nation: "Portugal", era: "2000-present", stat: "defending", group: "defender", value: 4 },
  klopp: { name: "Jurgen Klopp", nation: "Germany", era: "2001-2024", stat: "physical", group: "all", value: 4 },
  ancelotti: { name: "Carlo Ancelotti", nation: "Italy", era: "1995-present", stat: "shooting", group: "attacker", value: 4 },
  wenger: { name: "Arsene Wenger", nation: "France", era: "1996-2018", stat: "passing", group: "all", value: 4 },
  michels: { name: "Rinus Michels", nation: "Netherlands", era: "1965-1992", stat: "pace", group: "all", value: 3 },
  sacchi: { name: "Arrigo Sacchi", nation: "Italy", era: "1987-2001", stat: "defending", group: "midfielder", value: 4 },
  zidane: { name: "Zinedine Zidane", nation: "France", era: "2016-2021", stat: "dribbling", group: "midfielder", value: 3 },
  cruyff: { name: "Johan Cruyff", nation: "Netherlands", era: "1974-1996", stat: "dribbling", group: "attacker", value: 3 },
  delbosque: { name: "Vicente del Bosque", nation: "Spain", era: "1999-2016", stat: "passing", group: "all", value: 3 },
  pozzo: { name: "Vittorio Pozzo", nation: "Italy", era: "1929-1948", stat: "pace", group: "defender", value: 3 }
};

const MY_CLUB_CONSUMABLES = {
  serum_pace:   { name: "Pace Serum",         stat: "pace",      value: 3, rarity: "Common",    weight: 20, art: "syringe" },
  serum_shot:   { name: "Shot Serum",         stat: "shooting",  value: 3, rarity: "Common",    weight: 16, art: "syringe" },
  serum_pass:   { name: "Vision Serum",       stat: "passing",   value: 3, rarity: "Common",    weight: 16, art: "syringe" },
  serum_drib:   { name: "Stepover Serum",     stat: "dribbling", value: 3, rarity: "Common",    weight: 14, art: "syringe" },
  serum_def:    { name: "Wall Serum",         stat: "defending", value: 3, rarity: "Common",    weight: 14, art: "syringe" },
  serum_phy:    { name: "Bull Serum",         stat: "physical",  value: 3, rarity: "Common",    weight: 14, art: "syringe" },
  turbo_pace:   { name: "Turbo Elixir",       stat: "pace",      value: 5, rarity: "Rare",      weight: 8,  art: "elixir" },
  maestro_pass: { name: "Maestro Elixir",     stat: "passing",   value: 5, rarity: "Rare",      weight: 7,  art: "elixir" },
  iron_def:     { name: "Iron Elixir",        stat: "defending", value: 5, rarity: "Rare",      weight: 6,  art: "elixir" },
  all2:         { name: "All-Rounder Elixir", stat: "all",       value: 2, rarity: "Epic",      weight: 3,  art: "elixir" },
  all5:         { name: "Total Football Elixir", stat: "all",    value: 5, rarity: "Legendary", weight: 1,  art: "elixir" }
};

// Consumable combining: 3 of each Common serum make an All-Rounder Elixir,
// and 5 All-Rounder Elixirs make a Total Football Elixir.
const MY_CLUB_COMBINE_RECIPES = {
  allrounder: {
    out: "all2",
    uses: [
      ["serum_pace", 3], ["serum_shot", 3], ["serum_pass", 3],
      ["serum_drib", 3], ["serum_def", 3], ["serum_phy", 3]
    ]
  },
  total: {
    out: "all5",
    uses: [["all2", 5]]
  }
};

const MYCLUB_NATIONS = ["Brazil", "Argentina", "France", "Germany", "Italy", "Spain", "England", "Netherlands", "Portugal"];

const MYCLUB_NATIONS_ALL = MYCLUB_NATIONS.concat([
  "Mexico", "USA", "Uruguay", "Colombia", "Ecuador", "Chile", "Peru",
  "Nigeria", "Senegal", "Ghana", "Morocco", "Egypt", "Cameroon", "Ivory Coast",
  "Japan", "South Korea", "China", "Saudi Arabia", "Iran", "Australia",
  "New Zealand", "Belgium", "Sweden", "Denmark", "Norway", "Poland", "Czechia",
  "Croatia", "Serbia", "Switzerland", "Austria", "Turkey", "Algeria", "Tunisia",
  "Wales", "Scotland", "Ireland", "Canada", "Georgia", "Slovenia", "Russia"
]);

function randNation() {
  return pickRand(MYCLUB_NATIONS_ALL);
}

const MYCLUB_NATION_LEGENDS = {
  Brazil: [
    ["Pelé", 99, "attacker"], ["Ronaldo Nazario", 96, "attacker"], ["Ronaldinho", 95, "attacker"],
    ["Rivaldo", 93, "attacker"], ["Neymar", 91, "attacker"], ["Garrincha", 94, "attacker"],
    ["Kaka", 93, "midfielder"], ["Zico", 93, "midfielder"], ["Cafu", 92, "defender"],
    ["Roberto Carlos", 92, "defender"], ["Jairzinho", 92, "attacker"], ["Dida", 91, "goalkeeper"]
  ],
  Argentina: [
    ["Maradona", 96, "midfielder"], ["Messi", 96, "attacker"], ["Batistuta", 93, "attacker"],
    ["Di Stefano", 95, "attacker"], ["Kempes", 92, "attacker"], ["Riquelme", 91, "midfielder"],
    ["Zanetti", 92, "defender"], ["Passarella", 92, "defender"], ["Ayala", 91, "defender"],
    ["Fillol", 90, "goalkeeper"], ["Veron", 90, "midfielder"], ["Redondo", 91, "midfielder"]
  ],
  France: [
    ["Zidane", 95, "midfielder"], ["Platini", 95, "midfielder"], ["Henri", 94, "attacker"],
    ["Mbappe", 93, "attacker"], ["Henry", 94, "attacker"], ["Vieira", 92, "midfielder"],
    ["Makelele", 92, "midfielder"], ["Thuram", 92, "defender"], ["Desailly", 91, "defender"],
    ["Fontaine", 92, "attacker"], ["Barthez", 91, "goalkeeper"], ["Papin", 91, "attacker"]
  ],
  Germany: [
    ["Beckenbauer", 96, "defender"], ["Gerd Muller", 96, "attacker"], ["Matthaus", 95, "midfielder"],
    ["Kahn", 94, "goalkeeper"], ["Rummenigge", 94, "attacker"], ["Klose", 93, "attacker"],
    ["Neuer", 93, "goalkeeper"], ["Ballack", 92, "midfielder"], ["Lahm", 92, "defender"],
    ["Breitner", 91, "midfielder"], ["Klinsmann", 92, "attacker"], ["Sammer", 91, "defender"]
  ],
  Italy: [
    ["Baggio", 95, "midfielder"], ["Maldini", 95, "defender"], ["Buffon", 94, "goalkeeper"],
    ["Del Piero", 92, "attacker"], ["Totti", 92, "attacker"], ["Pirlo", 93, "midfielder"],
    ["Cannavaro", 93, "defender"], ["Nesta", 93, "defender"], ["Zambrotta", 90, "defender"],
    ["Baresi", 93, "defender"], ["Schillaci", 90, "attacker"], ["Zoff", 93, "goalkeeper"]
  ],
  Spain: [
    ["Xavi", 94, "midfielder"], ["Iniesta", 94, "midfielder"], ["Casillas", 94, "goalkeeper"],
    ["Raul", 93, "attacker"], ["Sergio Ramos", 92, "defender"], ["Puyol", 92, "defender"],
    ["Hierro", 91, "defender"], ["Butragueno", 90, "attacker"], ["Villa", 92, "attacker"],
    ["Camacho", 90, "defender"], ["Xabi Alonso", 91, "midfielder"], ["Busquets", 91, "midfielder"]
  ],
  England: [
    ["Charlton", 94, "midfielder"], ["Gerrard", 93, "midfielder"], ["Lampard", 93, "midfielder"],
    ["Scholes", 92, "midfielder"], ["Beckham", 92, "midfielder"], ["Shearer", 91, "attacker"],
    ["Lineker", 91, "attacker"], ["Rooney", 92, "attacker"], ["Terry", 92, "defender"],
    ["Banks", 93, "goalkeeper"], ["Gazza", 91, "midfielder"], ["Owen", 91, "attacker"]
  ],
  Netherlands: [
    ["Cruyff", 96, "attacker"], ["Van Basten", 95, "attacker"], ["Gullit", 94, "midfielder"],
    ["Koeman", 92, "defender"], ["Bergkamp", 93, "attacker"], ["Rijkaard", 91, "midfielder"],
    ["Van Nistelrooy", 91, "attacker"], ["Willems", 90, "goalkeeper"], ["Neeskens", 91, "midfielder"],
    ["Davids", 90, "midfielder"], ["Van Persie", 92, "attacker"], ["Stam", 91, "defender"]
  ],
  Portugal: [
    ["Eusebio", 94, "attacker"], ["Cristiano Ronaldo", 97, "attacker"], ["Figo", 93, "midfielder"],
    ["Rui Costa", 90, "midfielder"], ["Deco", 90, "midfielder"], ["Vitor Baia", 90, "goalkeeper"],
    ["Jorge Costa", 89, "defender"], ["Couto", 89, "defender"], ["Nani", 89, "attacker"],
    ["Pepe", 91, "defender"], ["Bruno Fernandes", 91, "midfielder"], ["Ruben Dias", 91, "defender"]
  ]
};

let myClubCardSeq = 0;
let packRevealPhase = "idle";
let packRevealCards = [];
let packRevealTimer = 0;

function pickRand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const BASE_FIRST = ["Luca","Marco","Jonas","Rico","Enzo","Felix","Mateo","Karim","Owen","Diego","Leo","Noah","Arne","Rafael","Caleb","Sven"];
const BASE_LAST = ["Berger","Moretti","Kramer","Silva","Novak","Costa","Hansen","Petrov","Ferreira","Lindberg","Rossi","Sousa","Weber","Cabrera","Dias","Kovac"];
const BASE_ROLES = ["defender","defender","midfielder","midfielder","attacker","attacker","goalkeeper"];

const MYCLUB_SPECIAL_PLAYERS = [
  ["Mbappe", 91, "attacker"], ["Haaland", 91, "attacker"], ["Vinicius Jr", 90, "attacker"],
  ["Bellingham", 90, "midfielder"], ["Saka", 89, "attacker"], ["Kane", 90, "attacker"],
  ["Rodri", 90, "midfielder"], ["De Bruyne", 90, "midfielder"], ["Salah", 90, "attacker"],
  ["Musiala", 89, "midfielder"], ["Wirtz", 89, "midfielder"], ["Valverde", 89, "midfielder"],
  ["Pedri", 89, "midfielder"], ["Foden", 89, "attacker"], ["Yamal", 90, "attacker"],
  ["Palmer", 88, "attacker"], ["Lautaro", 89, "attacker"], ["Osimhen", 89, "attacker"],
  ["Kvara", 88, "attacker"], ["Saliba", 88, "defender"], ["Van Dijk", 89, "defender"],
  ["Rudiger", 86, "defender"], ["Hakimi", 87, "defender"], ["Alexander-Arnold", 87, "defender"],
  ["Davies", 86, "defender"], ["Theo", 87, "defender"],
  ["Courtois", 89, "goalkeeper"], ["Oblak", 88, "goalkeeper"],
  ["Donnarumma", 88, "goalkeeper"], ["Alisson", 89, "goalkeeper"]
];

const MYCLUB_ICON_PLAYERS = [
  ["Pele", 93, "attacker"], ["Ronaldo", 93, "attacker"], ["Ronaldinho", 93, "attacker"],
  ["Cruyff", 93, "attacker"], ["Maradona", 92, "attacker"], ["Zidane", 92, "midfielder"],
  ["Maldini", 92, "defender"], ["Buffon", 90, "goalkeeper"], ["Yashin", 92, "goalkeeper"],
  ["Cafu", 90, "defender"], ["Roberto Carlos", 90, "defender"], ["Baresi", 91, "defender"],
  ["Gullit", 91, "midfielder"], ["Baggio", 90, "attacker"], ["Figo", 90, "midfielder"],
  ["Rijkaard", 90, "defender"]
];

const MYCLUB_MAX_PLAYERS = [
  ["Messi", 99, "attacker"], ["Cristiano Ronaldo", 99, "attacker"],
  ["Haaland", 98, "attacker"], ["Mbappe", 98, "attacker"],
  ["Vinicius Jr", 98, "attacker"], ["Yamal", 97, "attacker"],
  ["Bellingham", 97, "midfielder"], ["Wirtz", 97, "midfielder"],
  ["Kane", 97, "attacker"], ["De Bruyne", 97, "midfielder"],
  ["Rodri", 97, "midfielder"], ["Valverde", 97, "midfielder"],
  ["Van Dijk", 97, "defender"], ["Saliba", 97, "defender"],
  ["Courtois", 96, "goalkeeper"], ["Donnarumma", 96, "goalkeeper"],
  ["Salah", 96, "attacker"], ["Lewandowski", 96, "attacker"],
  ["Lautaro", 96, "attacker"], ["Osimhen", 96, "attacker"],
  ["Musiala", 96, "midfielder"], ["Pedri", 96, "midfielder"],
  ["Rudiger", 96, "defender"], ["Hakimi", 96, "defender"],
  ["Alexander-Arnold", 96, "defender"], ["Alisson", 96, "goalkeeper"],
  ["Oblak", 96, "goalkeeper"]
];

// Legends of the Game: all-time greats one rung below Icon status (85-90 OVR).
const MYCLUB_HERO_PLAYERS = [
  ["Shearer", 89, "attacker"], ["Drogba", 88, "attacker"], ["Aguero", 89, "attacker"],
  ["Eto'o", 89, "attacker"], ["Totti", 88, "attacker"], ["Del Piero", 88, "attacker"],
  ["Rooney", 89, "attacker"], ["Owen", 86, "attacker"],
  ["Gerrard", 89, "midfielder"], ["Lampard", 88, "midfielder"], ["Scholes", 88, "midfielder"],
  ["Pirlo", 89, "midfielder"], ["Keane", 87, "midfielder"], ["Xavi", 89, "midfielder"], ["Iniesta", 88, "midfielder"],
  ["Nesta", 89, "defender"], ["Terry", 88, "defender"], ["Vidic", 87, "defender"],
  ["Lahm", 87, "defender"], ["Zanetti", 87, "defender"], ["Thuram", 87, "defender"], ["Evra", 85, "defender"],
  ["Cech", 88, "goalkeeper"], ["Kahn", 88, "goalkeeper"], ["Van der Sar", 88, "goalkeeper"], ["Schmeichel", 89, "goalkeeper"]
];

// Prospects: up-and-coming young guns (70-80 OVR), exclusive to the Prospect Pack.
const MYCLUB_PROSPECT_PLAYERS = [
  ["Endrick", 78, "attacker"], ["Vitor Roque", 77, "attacker"], ["Estevao", 77, "attacker"],
  ["Barcola", 78, "attacker"], ["Savinho", 78, "attacker"], ["Ferguson", 76, "attacker"], ["Luka Romero", 70, "attacker"],
  ["Mainoo", 79, "midfielder"], ["Gavi", 79, "midfielder"], ["Zaire-Emery", 79, "midfielder"], ["Moscardo", 74, "midfielder"], ["Kendry Paez", 70, "midfielder"],
  ["Cubarsi", 78, "defender"], ["Branthwaite", 77, "defender"], ["Balde", 78, "defender"], ["Rico Lewis", 77, "defender"],
  ["Vandevoordt", 73, "goalkeeper"], ["Kelleher", 74, "goalkeeper"]
];

const MYCLUB_PLAYER_NATIONS = {
  Mbappe: "France", Haaland: "Norway", "Vinicius Jr": "Brazil", Bellingham: "England",
  Saka: "England", Kane: "England", Rodri: "Spain", "De Bruyne": "Belgium",
  Salah: "Egypt", Musiala: "Germany", Wirtz: "Germany", Valverde: "Uruguay",
  Pedri: "Spain", Foden: "England", Yamal: "Spain", Palmer: "England",
  Lautaro: "Argentina", Osimhen: "Nigeria", Kvara: "Georgia", Saliba: "France",
  "Van Dijk": "Netherlands", Rudiger: "Germany", Hakimi: "Morocco",
  "Alexander-Arnold": "England", Davies: "Canada", Theo: "France",
  Courtois: "Belgium", Oblak: "Slovenia", Donnarumma: "Italy", Alisson: "Brazil",
  Pele: "Brazil", Ronaldo: "Brazil", Ronaldinho: "Brazil", Cruyff: "Netherlands",
  Maradona: "Argentina", Zidane: "France", Maldini: "Italy", Buffon: "Italy",
  Yashin: "Russia", Cafu: "Brazil", "Roberto Carlos": "Brazil", Baresi: "Italy",
  Gullit: "Netherlands", Baggio: "Italy", Figo: "Portugal", Rijkaard: "Netherlands",
  Messi: "Argentina", "Cristiano Ronaldo": "Portugal", Lewandowski: "Poland",
  Shearer: "England", Drogba: "Ivory Coast", Aguero: "Argentina", "Eto'o": "Cameroon",
  Totti: "Italy", "Del Piero": "Italy", Rooney: "England", Owen: "England",
  Gerrard: "England", Lampard: "England", Scholes: "England", Pirlo: "Italy",
  Keane: "Ireland", Xavi: "Spain", Iniesta: "Spain",
  Nesta: "Italy", Terry: "England", Vidic: "Serbia", Lahm: "Germany",
  Zanetti: "Argentina", Thuram: "France", Evra: "France",
  Cech: "Czechia", Kahn: "Germany", "Van der Sar": "Netherlands", Schmeichel: "Denmark",
  Endrick: "Brazil", "Vitor Roque": "Brazil", Estevao: "Brazil",
  Barcola: "France", Savinho: "Brazil", Ferguson: "Ireland",
  Mainoo: "England", Gavi: "Spain", "Zaire-Emery": "France", Moscardo: "Brazil",
  Cubarsi: "Spain", Branthwaite: "England", Balde: "Spain", "Rico Lewis": "England",
  Vandevoordt: "Belgium", Kelleher: "Ireland",
  "Luka Romero": "Mexico", "Kendry Paez": "Ecuador"
};

// Every non-icon named player also has a base card (Bronze / Silver / Gold),
// so today's stars and every Nation Legend can be pulled as a scaled base
// version of themselves alongside their Special / MAX / Legend releases.
// Icon players are the exception - they stay exclusive and never appear as bases.
const MYCLUB_BASE_PLAYERS = [];
(function buildMyClubBasePlayers() {
  const iconNames = new Set(MYCLUB_ICON_PLAYERS.map(function (e) { return String(e[0]); }));
  const seen = new Set();
  function add(name, role, nation) {
    if (!name || iconNames.has(String(name))) return;
    const key = String(name) + "|" + role;
    if (seen.has(key)) return;
    seen.add(key);
    MYCLUB_BASE_PLAYERS.push([name, 0, role, nation || null]);
  }
  for (const e of MYCLUB_SPECIAL_PLAYERS) add(e[0], e[2] || "attacker", MYCLUB_PLAYER_NATIONS[e[0]] || null);
  for (const e of MYCLUB_MAX_PLAYERS) add(e[0], e[2] || "attacker", MYCLUB_PLAYER_NATIONS[e[0]] || null);
  for (const nationKey of Object.keys(MYCLUB_NATION_LEGENDS)) {
    for (const e of MYCLUB_NATION_LEGENDS[nationKey]) add(e[0], e[2] || "attacker", MYCLUB_PLAYER_NATIONS[e[0]] || nationKey);
  }
})();

function loadMyClubData() {
  try {
    const raw = localStorage.getItem(MYCLUB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.careers) {
        migrateClubCareers(parsed.careers);
        myClubCareerData.careers = parsed.careers;
      }
      if (parsed && parsed.aiSquads && typeof parsed.aiSquads === "object") myClubCareerData.aiSquads = parsed.aiSquads;
      if (parsed && parsed.aiStats && typeof parsed.aiStats === "object") myClubCareerData.aiStats = parsed.aiStats;
    }
  } catch (e) {}
}

function migrateClubCareers(map) {
  for (const k in map) {
    const v = map[k];
    if (v && !Array.isArray(v)) map[k] = [v];
  }
}

function saveMyClubData() {
  try {
    localStorage.setItem(MYCLUB_STORAGE_KEY, JSON.stringify(myClubCareerData));
  } catch (e) {}
}

function getMyClubCareer(league) {
  const list = myClubCareerData.careers[league] || null;
  if (!Array.isArray(list) || !list.length) return null;
  return normalizeClubCareer(list[0], league);
}

function normalizeClubCareer(c, league) {
  if (!c) return null;
  if (typeof c.season !== "number" || c.season < 1) c.season = 1;
  if (!Array.isArray(c.fixtures)) c.fixtures = [];
  c.league = league;
  if (typeof c.coins !== "number") c.coins = MYCLUB_STARTER_COINS;
  if (typeof c.trophies !== "number") c.trophies = 0;
  if (!Array.isArray(c.trophyCabinet)) c.trophyCabinet = [];
  if (!Array.isArray(c.awards)) c.awards = [];
  if (!c.pstat || typeof c.pstat !== "object" || Array.isArray(c.pstat)) c.pstat = {};
  if (!c.reds || typeof c.reds !== "object") c.reds = {};
  if (!c.mySusp || typeof c.mySusp !== "object") c.mySusp = {};
  if (!c.myInj || typeof c.myInj !== "object") c.myInj = {};
  if (!c.formation || !MY_CLUB_FORMATIONS[c.formation]) c.formation = "4-3-3";
  if (!Array.isArray(c.managers)) c.managers = [];
  if (!c.manager || !MY_CLUB_MANAGERS[c.manager]) c.manager = null;
  if (typeof c.level !== "number" || c.level < 1) c.level = 1;
  if (typeof c.xp !== "number" || c.xp < 0) c.xp = 0;
  if (!Array.isArray(c.consumables)) c.consumables = [];
  if (!c.shopBought || typeof c.shopBought !== "object" || Array.isArray(c.shopBought)) c.shopBought = {};
  if (typeof c.friendlyDay !== "number" || c.friendlyDay < 0) c.friendlyDay = 0;
  if (typeof c.friendlyLastChallengeAt !== "number") c.friendlyLastChallengeAt = -100;
  if (!c.friendlyOffer || typeof c.friendlyOffer !== "object") c.friendlyOffer = null;
  if (typeof c.eosMomentum !== "number" || c.eosMomentum <= 0) c.eosMomentum = 1;
  if (!Array.isArray(c.transferNews)) c.transferNews = [];
  if (typeof c.transferWindowSeason !== "number") c.transferWindowSeason = -1;
  if (typeof c.aiWinBuff !== "number") c.aiWinBuff = 0;
  if (typeof c.aiWinBuffApplied !== "number") c.aiWinBuffApplied = 0;
  // Daily login reward. Additive only: an existing save has neither field, so
  // it simply starts with no day claimed and a zero streak.
  if (typeof c.dailyClaimDay !== "string") c.dailyClaimDay = "";
  if (typeof c.dailyStreak !== "number" || c.dailyStreak < 0) c.dailyStreak = 0;
  // Squad Building Challenges: which one-time challenges have been claimed,
  // and the in-progress draft squads saved so a build survives a reload.
  if (!c.sbcDone || typeof c.sbcDone !== "object" || Array.isArray(c.sbcDone)) c.sbcDone = {};
  if (!c.sbcSquads || typeof c.sbcSquads !== "object" || Array.isArray(c.sbcSquads)) c.sbcSquads = {};
  // Player development: bought trainers that run in-game-day sessions, a global
  // Attribute Traits inventory, quest/achievement tracking and the running
  // club-level counters that feed the quests.
  if (!c.trainers || typeof c.trainers !== "object" || Array.isArray(c.trainers)) c.trainers = {};
  if (!c.trainers.owned || typeof c.trainers.owned !== "object" || Array.isArray(c.trainers.owned)) c.trainers.owned = {};
  if (!c.trainers.sessions || typeof c.trainers.sessions !== "object" || Array.isArray(c.trainers.sessions)) c.trainers.sessions = {};
  if (typeof c.trainers.log !== "string") c.trainers.log = "";
  if (!c.traitInv || typeof c.traitInv !== "object" || Array.isArray(c.traitInv)) c.traitInv = {};
  if (!c.quests || typeof c.quests !== "object" || Array.isArray(c.quests)) c.quests = {};
  if (!c.quests.claimed || typeof c.quests.claimed !== "object" || Array.isArray(c.quests.claimed)) c.quests.claimed = {};
  if (typeof c.quests.season !== "number" || c.quests.season < 1) c.quests.season = c.season;
  if (c.quests.season !== c.season) { c.quests.season = c.season; c.quests.claimed = {}; }
  if (!c.achievements || typeof c.achievements !== "object" || Array.isArray(c.achievements)) c.achievements = {};
  if (!c.stats || typeof c.stats !== "object" || Array.isArray(c.stats)) c.stats = {};
  return c;
}

function getMyClubCareers(league) {
  const list = myClubCareerData.careers[league] || [];
  return Array.isArray(list) ? list.map(c => normalizeClubCareer(c, league)) : [];
}

function getCareerByClub(clubName) {
  if (!clubName) return null;
  for (const league in myClubCareerData.careers) {
    const list = myClubCareerData.careers[league];
    if (Array.isArray(list)) {
      const hit = list.find(c => c && c.clubName === clubName);
      if (hit) return normalizeClubCareer(hit, league);
    }
  }
  return null;
}

function allMyClubCareers() {
  const out = [];
  for (const league in myClubCareerData.careers) {
    const list = myClubCareerData.careers[league];
    if (Array.isArray(list)) {
      for (const c of list) {
        const n = normalizeClubCareer(c, league);
        if (n) out.push(n);
      }
    }
  }
  return out;
}

function touchMyClubCareer(c) {
  if (!c || !c.league) return;
  const list = myClubCareerData.careers[c.league];
  if (!Array.isArray(list)) return;
  const idx = list.findIndex(x => x === c);
  if (idx > 0) {
    list.splice(idx, 1);
    list.unshift(c);
  }
}

function getMyClubLeague(name) {
  return MYCLUB_LEAGUES.find(l => l.name === name) || null;
}

function myClubLeagueClubs(c) {
  const league = getMyClubLeague(c.league);
  if (!league) return [c.clubName];
  const real = (league.clubs || []).filter(x => x.toLowerCase() !== c.clubName.toLowerCase());
  real.pop();
  return [c.clubName].concat(real);
}

function enterScreen(id, disp) {
  const el = document.getElementById(id);
  if (!el) return;
  // Was this screen already the one on show? Career hubs (and any other screen
  // that re-renders itself in place) call enterScreen on every tab press, so
  // replaying the entrance animation + light sweep there made the page look
  // like it had reset. Only play the transition when we are actually arriving
  // from a hidden state.
  const wasVisible = getComputedStyle(el).display !== "none" && el.getBoundingClientRect().height > 0;
  if (disp) el.style.display = disp;
  if (!wasVisible) {
    el.classList.remove("screenEnter");
    void el.offsetWidth;
    el.classList.add("screenEnter");
    // Cinematic light-sweep across the switch (EA FC style). Toggled on <html>
    // so CSS can drive it off a body pseudo-element with no extra DOM.
    const root = document.documentElement;
    root.classList.remove("uiSwitch");
    void root.offsetWidth;
    root.classList.add("uiSwitch");
    clearTimeout(enterScreen._veilT);
    enterScreen._veilT = setTimeout(() => root.classList.remove("uiSwitch"), 700);
  }
  // New screen means a new set of controls to walk with the D-pad.
  if (typeof uiRefreshFocus === "function") uiRefreshFocus();
}

function quitToMenu() {
  if (typeof TeamEdits !== "undefined" && TeamEdits.exitCareer) TeamEdits.exitCareer();
  matchRunning = false;
  awaitingStart = false;
  kickoffIntro = 0;
  matchPaused = false;
  clearInterval(timerInterval);
  friendlyContext = null;
  // Leaving a match (Practice in particular) used to strand its presentation
  // on screen: the pitch and the full-time cutscene keep drawing even with the
  // match stopped, so the menu came up behind a frozen ending. Tear the match
  // screen down and clear any live drill/cutscene before the menu fades in.
  if (typeof cutscene !== "undefined" && cutscene) { try { endCutscene(true); } catch (e) {} }
  if (typeof practiceEndDrill === "function") { try { practiceEndDrill(); } catch (e) {} }
  // Tear down a live penalty shootout: stop its animation loop and hide the
  // overlay so it cannot linger over the menu.
  if (typeof stopPenaltyLoop === "function") { try { stopPenaltyLoop(); } catch (e) {} }
  if (typeof penaltyShootout !== "undefined") penaltyShootout = null;
  const penEl = document.getElementById("penaltyScreen");
  if (penEl) penEl.style.display = "none";
  // Tear down a live trophy-lift celebration so it cannot linger over the menu.
  if (typeof window.hideTrophyLift === "function") { try { window.hideTrophyLift(); } catch (e) {} }
  if (window.commentary) { try { window.commentary.clear(); } catch (e) {} }
  const gsEl = document.getElementById("gameScreen");
  if (gsEl) gsEl.style.display = "none";
  document.getElementById("menu").style.display = "none";
  enterScreen("modeSelectScreen", "flex");
  renderHomeAdminToggle();
}

function startModeChampions() {
  currentMode = "champions";
  if (typeof TeamEdits !== "undefined" && TeamEdits.exitCareer) TeamEdits.exitCareer();
  document.getElementById("modeSelectScreen").style.display = "none";
  enterScreen("menu", "flex");
}

function startModeMyClub() {
  if (typeof TeamEdits !== "undefined" && TeamEdits.exitCareer) TeamEdits.exitCareer();
  loadMyClubData();
  document.getElementById("modeSelectScreen").style.display = "none";
  document.getElementById("menu").style.display = "none";
  openMyClubSetup();
}

function startModePractice() {
  if (typeof TeamEdits !== "undefined" && TeamEdits.exitCareer) TeamEdits.exitCareer();
  document.getElementById("practicePickerModal").style.display = "flex";
}

function practiceClosePicker() {
  document.getElementById("practicePickerModal").style.display = "none";
}

function practiceLaunch(kind) {
  practiceClosePicker();
  currentMode = "practice";
  if (!selectedTeam || !TEAM_ROSTERS[selectedTeam]) selectedTeam = "Manchester City";
  const oppPool = Object.keys(TEAM_ROSTERS).filter(t => t !== selectedTeam);
  const opponent = oppPool[Math.floor(Math.random() * oppPool.length)];
  friendlyContext = { opponent: opponent || "Manchester City", winBonus: 0 };
  playerName = "YOU";
  document.getElementById("modeSelectScreen").style.display = "none";
  document.getElementById("menu").style.display = "none";
  enterScreen("gameScreen", "block");
  preparePlayerMatch();
  practiceDrill = null;
  practiceKind = kind || null;
  if (practiceKind) {
    // Every Practice mode - Open Play included - runs as a solo drill inside
    // the Pixel Striker engine (you against one keeper). Set-piece drills skip
    // the kickoff countdown and stage the first rep straight away; Open Play
    // stages on the halfway line so you can run at the goal.
    kickoffIntro = 0;
    beginMatch();
    __psNeutralizeTimer();
    PSMatch.setDrill(practiceKind);
  } else {
    kickoffIntro = KICKOFF_INTRO_WAIT;
    beginMatch();
  }
}

// Practice Arena is a shooting drill: just the user and one goalkeeper. Every
// other player is parked on the bench (sentOff), so the whole pitch is open to
// run in and shoot on goal. The park survives goal restarts (resetPositions
// only re-parks sent-off players and never revives them), so the drill pitch
// stays intact for the whole session.
function practiceSetupSoloPitch() {
  const redGK = opponents[opponents.length - 1];
  for (const p of allPlayers) {
    if (p === player) { p.sentOff = false; p.offInjured = false; continue; }
    if (p === redGK && p.role === "goalkeeper") { p.sentOff = false; p.offInjured = false; continue; }
    p.sentOff = true;
    p.offInjured = false;
  }
}

function updateModeMyClubCta() {
  const el = document.getElementById("modeMyClubCta");
  if (!el) return;
  loadMyClubData();
  el.textContent = Object.keys(myClubCareerData.careers).length > 0 ? "Resume My Club" : "Start My Club";
}

updateModeMyClubCta();

function openMyClubSetup() {
  loadMyClubData();
  if (typeof MYCLUB_LEAGUES !== "undefined" && Array.isArray(MYCLUB_LEAGUES) && MYCLUB_LEAGUES.length) {
    myClubLeague = MYCLUB_LEAGUES[0].name;
  } else {
    myClubLeague = "Premier League";
  }
  document.getElementById("myClubSetupMsg").textContent = "";
  const nameInput = document.getElementById("myClubNameInput");
  if (nameInput) nameInput.value = "";
  try { renderMyClubLeaguePicker(); } catch (e) {}
  try { renderMyClubCareers(); } catch (e) {}
  document.getElementById("myClubSetupModal").style.display = "flex";
}

function myClubCloseSetup() {
  document.getElementById("myClubSetupModal").style.display = "none";
  const modeScreen = document.getElementById("modeSelectScreen");
  const menu = document.getElementById("menu");
  if (menu.style.display === "none" && modeScreen.style.display === "none") {
    modeScreen.style.display = "flex";
  }
}

function myClubChooseLeague(name) {
  myClubLeague = name;
  const btn = document.getElementById("myClubStartBtn");
  const msg = document.getElementById("myClubSetupMsg");
  if (btn) btn.textContent = "Create Career";
  if (msg) msg.textContent = "";
  document.querySelectorAll(".myClubLeagueBtn").forEach(b => {
    b.classList.toggle("sel", b.getAttribute("data-league") === name);
  });
}

function renderMyClubLeaguePicker() {
  const el = document.getElementById("myClubLeaguePicker");
  if (!el) return;
  el.innerHTML = MYCLUB_LEAGUES.map(l => {
    const count = getMyClubCareers(l.name).length;
    return '<button class="myClubLeagueBtn sel" data-league="' + escapeHtml(l.name) + '" onclick="myClubChooseLeague(\'' + escapeHtml(l.name) + '\')">' +
      escapeHtml(l.name) +
      (count ? '<span class="myClubCareerTag">' + count + '</span>' : "") +
      '</button>';
  }).join("");
  myClubChooseLeague(MYCLUB_LEAGUES[0].name);
}

function renderMyClubCareers() {
  const wrap = document.getElementById("myClubCareers");
  const list = document.getElementById("myClubCareerList");
  if (!wrap || !list) return;
  const careers = allMyClubCareers();
  if (!careers.length) {
    wrap.style.display = "none";
    list.innerHTML = "";
    return;
  }
  wrap.style.display = "";
  list.innerHTML = careers.map(c => {
    const league = getMyClubLeague(c.league);
    const initials = c.clubName.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join("");
    return '<div class="myClubCareerRow" data-club="' + escapeHtml(c.clubName) + '">' +
      '<div style="display:flex;align-items:center">' +
      '<span class="ccBadge">' + escapeHtml(initials) + '</span>' +
      '<div><div class="ccName">' + escapeHtml(c.clubName) + '</div>' +
      '<div class="ccMeta">' + escapeHtml(league ? league.name : c.league) + ' - Season ' + c.season + (c.trophies ? " - " + c.trophies + " title" + (c.trophies > 1 ? "s" : "") : "") + '</div></div>' +
      '</div>' +
      '<button onclick="resumeMyClubCareer(\'' + escapeHtml(c.clubName) + '\')">Resume</button>' +
      '</div>';
  }).join("");
}

function resumeMyClubCareer(clubName) {
  loadMyClubData();
  const c = getCareerByClub(clubName);
  if (!c) return;
  touchMyClubCareer(c);
  saveMyClubData();
  startMyClubCareerSession(c);
}

function sanitizeClubName(raw) {
  let name = String(raw || "").trim().replace(/\s+/g, " ");
  if (!name) return "";
  name = name.charAt(0).toUpperCase() + name.slice(1);
  if (name.length > 18) name = name.slice(0, 18);
  if (teams.some(t => t.toLowerCase() === name.toLowerCase())) name = name + " FC";
  return name;
}

function myClubCreateCareer() {
  if (typeof MYCLUB_LEAGUES !== "undefined" && Array.isArray(MYCLUB_LEAGUES) && MYCLUB_LEAGUES.length) {
    myClubLeague = MYCLUB_LEAGUES[0].name;
  } else if (!myClubLeague) {
    myClubLeague = "Premier League";
  }
  loadMyClubData();
  let clubName = sanitizeClubName(document.getElementById("myClubNameInput").value);
  if (!clubName) {
    document.getElementById("myClubSetupMsg").textContent = "Enter a club name.";
    return;
  }
  const usedNames = allMyClubCareers().map(c => c.clubName);
  if (usedNames.indexOf(clubName) !== -1) clubName = clubName + " United";
  const color = (document.getElementById("myClubColorInput") && document.getElementById("myClubColorInput").value) || "#168cff";
  const c = { league: myClubLeague, clubName: clubName, color: color, season: 1, trophies: 0, coins: MYCLUB_STARTER_COINS, formation: "4-3-3", managers: [], manager: null, level: 1, xp: 0, consumables: [], fixtures: [], friendlyDay: 0, friendlyLastChallengeAt: -100, friendlyOffer: null, bench: [], myInj: {},
    trainers: { owned: {}, sessions: {}, log: "" }, traitInv: {}, quests: { claimed: {}, season: 1 }, achievements: {}, stats: {} };
  if (!myClubCareerData.careers || typeof myClubCareerData.careers !== "object") myClubCareerData.careers = {};
  if (!Array.isArray(myClubCareerData.careers[myClubLeague])) myClubCareerData.careers[myClubLeague] = [];
  myClubCareerData.careers[myClubLeague].unshift(c);
  saveMyClubData();
  try { buildMyClubStarterSquad(clubName); } catch (e) {}
  teamColors[clubName] = color;
  try { snapshotClubDefaults(clubName); } catch (e) {}
  try { startMyClubSeason(1); } catch (e) {}
  startMyClubCareerSession(c);
}

function startMyClubCareerSession(c) {
  myClubLeague = c.league;
  currentMode = "myclub";
  // My Club is ranked-only now: everything starts on the PvP ladder. The season
  // code below is left in place but dormant, so no season screen is reachable.
  myClubGameMode = MY_CLUB_GAMEMODE_PVP;
  pvpContext = null;
  selectedTeam = c.clubName;
  teamColors[selectedTeam] = c.color;
  if (!TEAM_ROSTERS[selectedTeam]) buildMyClubStarterSquad(selectedTeam);
  snapshotClubDefaults(selectedTeam);
  let hasClubState = false;
  try { hasClubState = !!localStorage.getItem(clubStorageKey(selectedTeam)); } catch (e) {}
  if (hasClubState) {
    loadClubStateFor(selectedTeam);
    c.coins = playerCoins;
  } else {
    ownedPool = [];
    playerCoins = c.coins;
    saveClubState();
  }
  applyCareerFormation(c);
  // Everything shares one calendar now, so the domestic setup must run whether
  // or not a European campaign is live.
  {
    const needCup = !c.cup || !Array.isArray(c.cup.rounds) || !c.cup.rounds.length || !Array.isArray(c.cup.legs) || !c.cup.legs.length;
    if (c.fixtures && c.fixtures.length && typeof c.fixtures[0].day !== "number") assignMyClubFixtureDays(c);
    if (needCup) {
      const lg = getMyClubLeague(c.league);
      if (lg) {
        c.cup = { name: lg.cup, rounds: myClubCupBracket(myClubLeagueClubs(c)), legs: [], champion: null, nextDay: 7 };
        for (const round of c.cup.rounds) {
          for (const tie of round.ties) {
            if (myClubCupTieEntrant(tie.a, c) && myClubCupTieEntrant(tie.b, c)) myClubCupEnsureLegs(c, tie);
          }
        }
      }
    }
  }
  try { ensureAiSquads(c); } catch (e) {}
  saveMyClubData();
  buildMyClubGroup(c);
  if (c.cl && c.cl.active) repairMyClubEuro(c);
  document.getElementById("myClubSetupModal").style.display = "none";
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  openMyClubLobby();
}

function myClubExit() {
  currentMode = "champions";
  selectedTeam = null;
  myClubLeague = null;
  myClubGameMode = MY_CLUB_GAMEMODE_SEASON;
  if (pvpContext) { myClubPvpUnregisterOpponent(pvpContext.opponent); pvpContext = null; }
  document.getElementById("myClubScreen").style.display = "none";
  const h1 = document.querySelector("#bracketScreen h1");
  if (h1) h1.textContent = "UEFA Champions League Bracket";
  quitToMenu();
}

function myClubSquadTier(clubName) {
  if (typeof MYCLUB_LEAGUES === "undefined") return 1;
  for (const l of MYCLUB_LEAGUES) {
    if ((l.clubs || []).indexOf(clubName) >= 0) {
      const t = Math.round(Number(l.tier) || 1);
      return t >= 2 && t <= 3 ? t : 1;
    }
  }
  return 1;
}

function buildMyClubStarterSquad(clubName) {
  const tag = clubName + " ";
  const tier = myClubSquadTier(clubName);
  const off = tier === 2 ? -7 : tier === 3 ? -14 : 0;
  const g = base => Math.max(42, base + off);
  TEAM_ROSTERS[clubName] = {
    defenders: [
      makeRatedPlayer(tag + "RB", g(63), "defender"),
      makeRatedPlayer(tag + "CB", g(65), "defender"),
      makeRatedPlayer(tag + "CB", g(65), "defender"),
      makeRatedPlayer(tag + "LB", g(63), "defender")
    ],
    midfielders: [
      makeRatedPlayer(tag + "CDM", g(64), "midfielder"),
      makeRatedPlayer(tag + "CM", g(66), "midfielder"),
      makeRatedPlayer(tag + "CAM", g(66), "midfielder")
    ],
    attackers: [
      makeRatedPlayer(tag + "RW", g(64), "attacker"),
      makeRatedPlayer(tag + "ST", g(67), "attacker"),
      makeRatedPlayer(tag + "ST-YOU", g(68), "attacker")
    ],
    goalkeeper: makeRatedPlayer(tag + "GK", g(63), "goalkeeper")
  };
}

function startMyClubSeason(season) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  try { ensureAiSquads(c); } catch (e) {}
  c.season = season;
  c.cl = null;
  c.cwcStarted = false;
  c.cwcDone = false;
  c.calDay = 1;
  const league = getMyClubLeague(c.league);
  if (!league) return;
  const clubs = myClubLeagueClubs(c);
  c.fixtures = makeMyClubFixtures(clubs);
  assignMyClubFixtureDays(c);
  // The cup, both Super Cups and Europe are all built from the season that has
  // just finished, so a club's very first season is league only.
  const hasHistory = !!c.lastChampion;
  c.cup = hasHistory
    ? { name: league.cup, rounds: myClubCupBracket(clubs), legs: [], champion: null, nextDay: MYCLUB_LEAGUE_KICKOFF_DAY }
    : null;
  c.superCup = null;
  c.uefaSuperCup = null;
  c._uefaSuperLive = false;
  myClubSuperSetup(c, league);
  if (c.cup) {
    for (const round of c.cup.rounds) {
      for (const tie of round.ties) myClubCupEnsureLegs(c, tie);
    }
  }
  // The previous season's final order doubles as the fallback pool if only one
  // of the two European finals was actually contested.
  const prevOrder = Array.isArray(c.lastStandings)
    ? c.lastStandings.map((t, i) => ({ team: t, rank: i }))
    : null;
  myClubSetupUefaSuperCup(c, prevOrder);
  myClubSetupEuroSeason(c);
  saveMyClubData();
  buildMyClubGroup(c);
}

// The league runs from the opening weekend in August to the last weekend in May.
// Rounds are spaced evenly across that window, so the first round is always the
// August kick-off and the last one always lands on the final weekend.
function myClubLeagueWindow(c) {
  return {
    start: myClubDayForDate(c, 8, MYCLUB_FIRST_SAME_DAY),
    end: myClubDayForDate(c, 5, MYCLUB_LAST_SAME_DAY)
  };
}

function assignMyClubFixtureDays(c) {
  const roundNos = [];
  for (const m of c.fixtures) {
    if (typeof m.round !== "number") continue;
    if (roundNos.indexOf(m.round) === -1) roundNos.push(m.round);
  }
  roundNos.sort((a, b) => a - b);
  const win = myClubLeagueWindow(c);
  const n = roundNos.length;
  if (!n) return;
  const span = Math.max(1, win.end - win.start);
  roundNos.forEach((r, i) => {
    const day = n === 1 ? win.start : win.start + Math.round(i * span / (n - 1));
    for (const m of c.fixtures) {
      if (m.round === r) m.day = day;
    }
  });
}

// League-phase matchdays are spread across the competition's own window, so a
// Champions League campaign really does start in September and finish in May.
function assignMyClubEuroFixtureDays(c, comp) {
  const cl = comp || (c && c.cl);
  if (!cl) return;
  const win = myClubEuroWindow(cl.comp || "cl");
  const start = myClubDayForDate(c, win.start[0], win.start[1]);
  const end = myClubDayForDate(c, win.end[0], win.end[1]);
  const roundNos = [];
  for (const m of cl.leagueMatches || []) {
    if (typeof m.round !== "number") continue;
    if (roundNos.indexOf(m.round) === -1) roundNos.push(m.round);
  }
  roundNos.sort((a, b) => a - b);
  const n = roundNos.length;
  if (!n) return;
  const span = Math.max(1, end - start);
  roundNos.forEach((r, i) => {
    const day = n === 1 ? start : start + Math.round(i * span / (n - 1));
    for (const m of cl.leagueMatches) {
      if (m.round === r) m.day = day;
    }
  });
  cl.window = { start: start, end: end };
}

// Knockout rounds are given real dates too, so the calendar and the engine
// finally agree. Ties are spaced by round, all inside the late-season window.
function assignMyClubEuroKnockoutDays(c, cl) {
  if (!cl) return;
  const win = myClubEuroWindow(cl.comp || "cl");
  const from = myClubDayForDate(c, win.knockoutFrom[0], win.knockoutFrom[1]);
  const end = myClubDayForDate(c, win.end[0], win.end[1]);
  const rounds = cl.knockout || [];
  if (!rounds.length) return;
  const gap = Math.max(3, Math.floor((end - from) / (rounds.length + 1)));
  rounds.forEach((round, i) => {
    const day = from + (i + 1) * gap;
    const two = (round.key !== "final") && (cl.comp === "cwc" ? false : true);
    const legs = [];
    for (const tie of (round.ties || [])) {
      for (const leg of (tie.legs || [])) legs.push(leg);
    }
    // Two-legged ties play the second leg a week later; single legs share a day.
    const perTie = legs.length ? Math.ceil(legs.length / Math.max(1, (round.ties || []).length)) : 0;
    let k = 0;
    for (const tie of (round.ties || [])) {
      const mine = (tie.legs || []).length || perTie;
      for (let j = 0; j < mine; j++) {
        if (legs[k]) legs[k].day = day + (two ? j * 7 : 0);
        k++;
      }
    }
    round.day = day;
  });
}

function makeMyClubFixtures(clubs) {
  const n = clubs.length;
  if (n < 2) return [];
  const fixtures = [];
  let round = 1;
  const ids = clubs.map((_, i) => i);
  const oneLeg = () => {
    for (let r = 0; r < n - 1; r++) {
      for (let i = 0; i < Math.floor(n / 2); i++) {
        const a = clubs[ids[i]];
        const b = clubs[ids[n - 1 - i]];
        const m = (r + i) % 2 === 0 ? createMatch(a, b) : createMatch(b, a);
        m.round = round;
        fixtures.push(m);
      }
      round++;
      ids.push(ids.shift());
    }
  };
  oneLeg();
  ids.reverse();
  oneLeg();
  return fixtures;
}

function buildMyClubGroup(c) {
  const league = getMyClubLeague(c.league);
  if (!league) return;
  tournament.groups = [{
    name: league.name,
    teams: myClubLeagueClubs(c),
    matches: c.fixtures
  }];
  if (c.cup && Array.isArray(c.cup.legs) && c.cup.legs.length) {
    tournament.groups.push({ name: c.cup.name, cup: "dom", teams: myClubLeagueClubs(c), matches: c.cup.legs });
  }
  if (c.superCup && myClubSuperMatches(c.superCup).length) {
    tournament.groups.push({ name: c.superCup.name, cup: "super", teams: c.superCup.teams.slice(), matches: myClubSuperMatches(c.superCup) });
  }
  if (c.uefaSuperCup && c.uefaSuperCup.match) {
    tournament.groups.push({ name: c.uefaSuperCup.name, cup: "uefasuper", teams: [c.uefaSuperCup.match.team1, c.uefaSuperCup.match.team2], matches: [c.uefaSuperCup.match] });
  }
  // Europe shares the calendar, so its group lives alongside the domestic ones.
  if (c.cl && Array.isArray(c.cl.leagueMatches) && c.cl.leagueMatches.length) {
    if (c.cl.comp === "cwc") {
      for (const g of (c.cl.groups || [])) {
        tournament.groups.push({ name: g && g.name, teams: g && g.teams, matches: g && g.matches, cup: "cwc" });
      }
    } else {
      tournament.groups.push({ name: myClubEuroNameForRoute(c.cl.comp), teams: c.cl.teams, matches: c.cl.leagueMatches, cup: "cl" });
    }
  }
  tournament.knockout = [];
  tournament.roundOf32 = [];
  tournament.roundOf16 = [];
  tournament.quarterfinals = [];
  tournament.semifinals = [];
  tournament.final = [];
  tournament.champion = null;
  tournament.stage = "league";
  eliminated = false;
}

function myClubEuroNameForRoute(route) {
  return { cl: "Champions League", el: "Europa League", ecl: "Conference League", cwc: "Club World Cup" }[route] || "Champions League";
}

function myClubEuroName(c) {
  const comp = c && c.cl ? (c.cl.comp || "cl") : "cl";
  return myClubEuroNameForRoute(comp);
}

function myClubEuroLetter(comp) {
  return { cl: "U", el: "E", ecl: "C", cwc: "W" }[comp] || "U";
}

function myClubEuroShort(c) {
  const comp = c && c.cl ? (c.cl.comp || "cl") : "cl";
  return { cl: "Champions", el: "Europa", ecl: "Conference", cwc: "Club World" }[comp] || "Champions";
}

function myClubEuroTeams(c, comp) {
  const mine = String(c.clubName).toLowerCase();
  const caps = { cl: 36, el: 32, ecl: 16 };
  const target = comp === "el" ? "el" : (comp === "ecl" ? "ecl" : "cl");
  const used = {};
  const comps = { cl: [], el: [], ecl: [] };
  const add = (list, t) => {
    const k = String(t).toLowerCase();
    if (used[k]) return;
    used[k] = true;
    list.push(t);
  };
  const pool = [];
  const seenP = {};
  for (const l of MYCLUB_LEAGUES) {
    for (const club of (l.clubs || [])) {
      const k = String(club).toLowerCase();
      if (!seenP[k]) { seenP[k] = true; pool.push(club); }
    }
  }
  for (const name of Object.keys(myClubCareerData.careers || {})) {
    const qc = getMyClubCareer(name);
    if (!qc) continue;
    let rows = null;
    try {
      if (Array.isArray(qc.fixtures) && qc.fixtures.length) {
        const r = computeGroupStandings({ teams: myClubLeagueClubs(qc), matches: qc.fixtures });
        if (Array.isArray(r) && r.length) rows = r;
      }
    } catch (e) {}
    if (rows) {
      const lg = getMyClubLeague(name) || {};
      const slots = (typeof lg.clSlots === "number") ? lg.clSlots : 4;
      rows.forEach((row, i) => {
        if (i < slots) add(comps.cl, row.team);
        else if (i === slots) add(comps.el, row.team);
        else if (i === slots + 1) add(comps.ecl, row.team);
      });
    }
    const cupW = (qc.cup && qc.cup.champion) || null;
    if (cupW) add(comps.el, cupW);
  }
  [comps.cl, comps.el, comps.ecl].forEach(list => {
    let i = list.length;
    while (i--) if (String(list[i]).toLowerCase() === mine) list.splice(i, 1);
  });
  const fill = (list, cap) => {
    shuffle(pool);
    for (const t of pool) {
      if (list.length >= cap) break;
      if (String(t).toLowerCase() === mine) continue;
      add(list, t);
    }
  };
  // The player's own club is prepended below, so only top it up to one short of
  // the cap. Filling to the cap first gave every European field one team too
  // many - 37 in the Champions League rather than 36 - and an odd-sized field
  // then makes the round-robin pair clubs with themselves.
  fill(comps.cl, caps.cl - 1);
  fill(comps.el, caps.el - 1);
  fill(comps.ecl, caps.ecl - 1);
  [comps.cl, comps.el, comps.ecl].forEach(list => {
    let i = list.length;
    while (i--) if (String(list[i]).toLowerCase() === mine) list.splice(i, 1);
  });
  comps[target].unshift(c.clubName);
  return comps[target];
}

function myClubEuroFixtures(c, comp) {
  return createLeagueFixtures(shuffle(myClubEuroTeams(c, comp)));
}

// Each European competition runs in its own real window inside the season:
// the Champions League from September to a late May final, the Europa and
// Conference Leagues from the start of August to May, and the Club World Cup
// in June and July.
function myClubEuroWindow(comp) {
  if (comp === "cwc") return { start: [6, MYCLUB_CWC_FIRST_DAY], end: [7, 25], knockoutFrom: [7, 8] };
  if (comp === "el") return { start: [8, 1], end: [5, 14], knockoutFrom: [2, 20] };
  if (comp === "ecl") return { start: [8, 1], end: [5, 21], knockoutFrom: [3, 5] };
  return { start: [9, 15], end: [5, 28], knockoutFrom: [2, 27] };
}

function myClubBuildEuroComp(c, comp) {
  if (comp === "cwc") {
    const teams = myClubCWCTeams(c);
    const groups = myClubCWCGroupData(c, teams);
    const leagueMatches = [];
    for (const g of groups) for (const m of (g.matches || [])) leagueMatches.push(m);
    return {
      season: c.season, comp: "cwc", active: true, stage: "cl_league",
      teams: teams, groups: groups, leagueMatches: leagueMatches,
      knockout: [], champion: null
    };
  }
  return {
    season: c.season,
    comp: comp || "cl",
    active: true,
    stage: "cl_league",
    teams: myClubEuroTeams(c, comp || "cl"),
    leagueMatches: myClubEuroFixtures(c, comp || "cl"),
    knockout: [],
    champion: null
  };
}

// Called once the season is built. The route was decided from the table of the
// season that just finished, so it is null in a club's first season. The Club
// World Cup shares the same slot: it is a June/July tournament that takes over
// once the European campaign has finished.
function myClubSetupEuroSeason(c) {
  if (!c) return;
  c.cl = null;
  const route = c.euroRoute;
  if (route && route !== "cwc") {
    c.cl = myClubBuildEuroComp(c, route);
    assignMyClubEuroFixtureDays(c, c.cl);
    try {
      myClubAwardTrophy(c, "qualify", { competition: myClubEuroNameForRoute(route), title: "European Qualification" });
    } catch (e) {}
  }
  buildMyClubGroup(c);
}

// The European campaign runs September to May; the Club World Cup then takes
// over the slot in June and July of the same season, if it was held and the
// club earned a place in it.
function myClubStartCwcIfEarned(c) {
  if (!c) return false;
  if (c.cwcStarted || c.cwcDone) return false;
  if (!myClubCwcSeason(c) || c.cwcRoute !== "cwc") return false;
  if (!c.cwcStarted && c.cl && c.cl.active === false && c.cl.champion) {
    // The Club World Cup reuses the European slot, so the finished campaign has
    // to be banked (and kept for the calendar) before it is overwritten.
    try { myClubRecordEuroChamps(c); } catch (e) {}
    if (!c.euroDone) c.euroDone = c.cl;
  }
  c.cwcStarted = true;
  c.cl = myClubBuildEuroComp(c, "cwc");
  assignMyClubEuroFixtureDays(c, c.cl);
  try {
    myClubAwardTrophy(c, "qualify", { competition: "Club World Cup", title: "Club World Cup Qualification" });
  } catch (e) {}
  buildMyClubGroup(c);
  return true;
}

// Plays a European campaign out to a champion so the season can always close.
function myClubFinishEuroCampaign(c, cl) {
  if (!c || !cl) return;
  try {
    for (const m of (cl.leagueMatches || [])) {
      if (m && !m.played) simulateGroupMatch(m);
    }
    if (cl.stage === "cl_league") {
      if (cl.comp === "cwc") myClubCWCSetupKnockout(c);
      else myClubEuroSetupKnockout(c);
    }
    for (let i = 0; i < 12 && !cl.champion; i++) myClubSimEuroKnockout(c, true);
  } catch (e) {}
  cl.active = false;
}

function myClubCWCTeams(c) {
  const mine = String(c.clubName).toLowerCase();
  const score = {};
  const addScore = (team, b) => {
    const k = String(team).toLowerCase();
    score[k] = (score[k] || 0) + b;
  };
  for (const name of Object.keys(myClubCareerData.careers || {})) {
    const qc = getMyClubCareer(name);
    if (!qc) continue;
    let rows = null;
    try {
      if (Array.isArray(qc.fixtures) && qc.fixtures.length) {
        rows = computeGroupStandings({ teams: myClubLeagueClubs(qc), matches: qc.fixtures });
      }
    } catch (e) {}
    if (rows && rows.length) {
      rows.forEach((row, i) => {
        if (i === 0) addScore(row.team, 12);
        else if (i === 1) addScore(row.team, 8);
        else if (i === 2) addScore(row.team, 5);
        else if (i === 3) addScore(row.team, 3);
        else addScore(row.team, 1);
      });
    }
    const cupChamp = (qc.cup && qc.cup.champion) || null;
    if (cupChamp) addScore(cupChamp, 6);
    const clChamp = (qc.cl && qc.cl.champion) || null;
    if (clChamp && clChamp !== cupChamp) addScore(clChamp, 6);
  }
  const clubs = [];
  const clubSeen = {};
  for (const lg of MYCLUB_LEAGUES) {
    for (const club of (lg.clubs || [])) {
      const k = String(club).toLowerCase();
      if (!clubSeen[k]) { clubSeen[k] = true; clubs.push(club); }
    }
  }
  const ranked = clubs.filter(t => String(t).toLowerCase() !== mine);
  ranked.sort((a, b) => {
    const sa = (getTeamStrength(a) || 0) + (score[String(a).toLowerCase()] || 0);
    const sb = (getTeamStrength(b) || 0) + (score[String(b).toLowerCase()] || 0);
    return sb - sa;
  });
  const teams = [c.clubName];
  for (const t of ranked) {
    if (teams.length >= 32) break;
    teams.push(t);
  }
  return teams.slice(0, 32);
}

function myClubCWCGroupData(c, teams) {
  const shuffled = shuffle(teams.slice());
  const groups = [];
  for (let g = 0; g < 8; g++) {
    const four = shuffled.slice(g * 4, g * 4 + 4);
    const matches = createLeagueFixtures(four);
    groups.push({ name: "Group " + String.fromCharCode(65 + g), teams: four, matches: matches });
  }
  return groups;
}

function myClubCWCCareer(c) {
  myClubStartCwcIfEarned(c);
}

// A European campaign now finishes inside the season, so reaching the end of
// one is not the end of the season - it just drops back to the lobby. If a
// Club World Cup is due this season, that takes over the European slot.
function myClubEuroPhaseEnd(c) {
  if (!c) return;
  if (c.cl && c.cl.comp === "cwc") c.cwcDone = true;
  if (c.cl && c.cl.active) myClubFinishEuroCampaign(c, c.cl);
  myClubStartCwcIfEarned(c);
  saveMyClubData();
  openMyClubLobby("champions");
}

function myClubCWCSimOtherGroups(c, toDay) {
  if (!c || !c.cl) return 0;
  const mine = c.clubName;
  let n = 0;
  for (const g of (tournament.groups || [])) {
    if (!g || g.cup !== "cwc") continue;
    for (const m of (g.matches || [])) {
      if (!m || m.played) continue;
      if (m.team1 === mine || m.team2 === mine) continue;
      const d = typeof m.day === "number" ? m.day : Infinity;
      if (d > toDay) continue;
      simulateGroupMatch(m);
      n++;
    }
  }
  return n;
}

function buildCWCBracket(qualified) {
  tournament.knockout = [];
  const at = i => qualified && qualified[i];
  const tie1 = (key, a, b) => {
    const t = { team1: a, team2: b, legs: [], winner: null, done: false, decidedBy: null };
    t.legs.push(newKnockoutLeg(key, a, b));
    return t;
  };
  const r16 = [];
  for (let i = 0; i < 8; i++) {
    r16.push(tie1("roundOf16", at(i * 2), at(((i + 1) % 8) * 2 + 1)));
  }
  tournament.knockout.push(knockoutRoundForKey("roundOf16", r16));
  tournament.knockout.push(knockoutRoundForKey("quarterfinals", [
    tie1("quarterfinals", makeKnockoutRef("roundOf16", 0), makeKnockoutRef("roundOf16", 1)),
    tie1("quarterfinals", makeKnockoutRef("roundOf16", 2), makeKnockoutRef("roundOf16", 3)),
    tie1("quarterfinals", makeKnockoutRef("roundOf16", 4), makeKnockoutRef("roundOf16", 5)),
    tie1("quarterfinals", makeKnockoutRef("roundOf16", 6), makeKnockoutRef("roundOf16", 7))
  ]));
  tournament.knockout.push(knockoutRoundForKey("semifinals", [
    tie1("semifinals", makeKnockoutRef("quarterfinals", 0), makeKnockoutRef("quarterfinals", 1)),
    tie1("semifinals", makeKnockoutRef("quarterfinals", 2), makeKnockoutRef("quarterfinals", 3))
  ]));
  tournament.knockout.push(knockoutRoundForKey("final", [
    tie1("final", makeKnockoutRef("semifinals", 0), makeKnockoutRef("semifinals", 1))
  ]));
}

function myClubCWCSetupKnockout(c) {
  const cl = c.cl;
  if (!cl) return false;
  const mine = c.clubName;
  const cgroups = (tournament.groups || []).filter(g => g && g.cup === "cwc");
  const qualified = [];
  let myRank = -1;
  for (const g of cgroups) {
    const st = computeGroupStandings(g);
    if (st[0]) qualified.push(st[0].team);
    if (st[1]) qualified.push(st[1].team);
    if (myRank < 0 && Array.isArray(g.teams) && g.teams.indexOf(mine) !== -1) {
      myRank = st.findIndex(row => row.team === mine) + 1;
    }
  }
  if (qualified.length < 16) return false;
  buildCWCBracket(qualified);
  cl.knockout = tournament.knockout;
  if (myRank > 2) {
    // Still date the bracket so the calendar is right and the rest of the
    // tournament can be played out on its real days.
    assignMyClubEuroKnockoutDays(c, cl);
    cl.active = false;
    cl.stage = "eliminated";
    tournament.stage = "eliminated";
    saveMyClubData();
    myClubSettleIndividualAwards(c, "cl");
    return false;
  }
  cl.stage = "roundOf16";
  tournament.stage = "roundOf16";
  assignMyClubEuroKnockoutDays(c, cl);
  saveMyClubData();
  return true;
}

function makeMyClubCWCGroupHTML(c, group) {
  if (!group) return "";
  const st = computeGroupStandings(group);
  let rows = "";
  st.forEach((row, i) => {
    const isPlayer = row.team === c.clubName;
    const cls = isPlayer ? "playerRow" : (i < 2 ? "qualRow" : "outRow");
    const color = teamColors[row.team] || "#667788";
    rows += '<tr class="' + cls + '"><td class="rank">' + (i + 1) + '</td>' +
      '<td class="team"><span class="clubDot" style="background:' + color + '"></span>' + teamLink(row.team) + '</td>' +
      '<td>' + row.played + '</td><td>' + row.w + '</td><td>' + row.d + '</td><td>' + row.l + '</td>' +
      '<td>' + row.gf + '</td><td>' + row.ga + '</td><td class="gd">' + (row.gd > 0 ? "+" + row.gd : row.gd) + '</td>' +
      '<td class="pts"><b>' + row.points + '</b></td>' +
      '<td class="qual">' + (i < 2 ? "&#10003;" : "") + '</td></tr>';
  });
  return '<div class="round leagueTableWrap"><h3>' + escapeHtml(group.name) + '</h3>' +
    '<div class="match tableCard"><table class="leagueTable"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function myClubCupTieEntrant(ref, c) {
  if (ref === null || ref === undefined) return null;
  if (typeof ref === "string") return ref;
  if (ref && ref.src === "tie") {
    const round = ((c && c.cup && c.cup.rounds) || []).find(r => r.key === ref.key);
    if (!round) return null;
    const tie = round.ties[ref.idx];
    if (!tie || !tie.done || !tie.winner) return null;
    return tie.winner;
  }
  return null;
}

function myClubCupBracket(clubs) {
  const n = clubs.length;
  let pow = 1;
  while (pow * 2 <= n) pow *= 2;
  const shuffled = shuffle(clubs.slice());
  const roundOneTies = n - pow;
  const rounds = [];
  if (roundOneTies > 0) {
    const r1t = [];
    for (let i = 0; i < roundOneTies; i++) {
      r1t.push({ a: shuffled[i], b: shuffled[roundOneTies + i], key: "r1", idx: i, done: false, winner: null, legs: [], twoLeg: false });
    }
    rounds.push({ key: "r1", title: "First Round", twoLeg: false, ties: r1t });
  }
  const entrants16 = [];
  for (let i = 0; i < roundOneTies; i++) entrants16.push({ src: "tie", key: "r1", idx: i });
  for (let i = 2 * roundOneTies; i < n; i++) entrants16.push(shuffled[i]);
  let entrants = entrants16;
  const metas = [
    { key: "r16", title: "Round of 16", twoLeg: false },
    { key: "qf", title: "Quarter-finals", twoLeg: false },
    { key: "sf", title: "Semi-finals", twoLeg: true }
  ];
  for (const meta of metas) {
    const half = entrants.length / 2;
    const ties = [];
    for (let i = 0; i < half; i++) {
      // twoLeg belongs on the tie as well as the round: the leg builder, the
      // aggregate message and the force-winner check all read tie.twoLeg.
      ties.push({ a: entrants[i], b: entrants[i + half], key: meta.key, idx: i, done: false, winner: null, legs: [], twoLeg: !!meta.twoLeg });
    }
    rounds.push({ key: meta.key, title: meta.title, twoLeg: meta.twoLeg, ties: ties });
    const next = [];
    for (let i = 0; i < half; i++) next.push({ src: "tie", key: meta.key, idx: i });
    entrants = next;
  }
  rounds.push({ key: "f", title: "Final", twoLeg: false, ties: [{ a: { src: "tie", key: "sf", idx: 0 }, b: { src: "tie", key: "sf", idx: 1 }, key: "f", idx: 0, done: false, winner: null, legs: [], twoLeg: false }] });
  return rounds;
}

// The cup is spread right across the season rather than crammed into the first
// few weeks: early rounds in the autumn, the last 16 in October, the quarter-
// finals before Christmas, the semi-finals in February and the final in May.
const MYCLUB_CUP_ROUND_DATES = {
  r1:  [8, 15],
  r16: [10, 10],
  qf:  [12, 6],
  sf:  [2, 21],
  f:   [5, 20]
};
const MYCLUB_CUP_LEG_GAP = 7;   // second leg of a two-legged tie, a week later

function myClubCupRoundDay(c, key) {
  const spec = MYCLUB_CUP_ROUND_DATES[key] || MYCLUB_CUP_ROUND_DATES.r1;
  return myClubDayForDate(c, spec[0], spec[1]);
}

function myClubCupNextDay(c) {
  const leagueDays = (c.fixtures || []).map(m => m.day).filter(d => typeof d === "number");
  let d = Math.max(1, (c.cup && c.cup.nextDay) || 1);
  while (leagueDays.indexOf(d) !== -1) d++;
  if (c.cup) c.cup.nextDay = d + 1;
  return d;
}

function myClubCupEnsureLegs(c, tie) {
  if (tie.done) return true;
  if (!c.cup) c.cup = { rounds: [], legs: [], champion: null, nextDay: 1 };
  if (!Array.isArray(c.cup.legs)) c.cup.legs = [];
  if (tie.legs && tie.legs.length) return true;
  const a = myClubCupTieEntrant(tie.a, c);
  const b = myClubCupTieEntrant(tie.b, c);
  if (!a || !b) return false;
  // Each cup round has a real slot in the season: the early rounds before
  // Christmas, the semi-finals in February and the final on the last weekend in
  // May, alongside the last league round.
  const day = myClubCupRoundDay(c, tie.key);
  const legs = tie.twoLeg ? [createMatch(a, b), createMatch(b, a)] : [createMatch(a, b)];
  legs.forEach((l, i) => {
    l.day = day + i * MYCLUB_CUP_LEG_GAP;
    l.cupRoundKey = tie.key;
    l.legNum = i;
    l.played = false;
    c.cup.legs.push(l);
  });
  tie.legs = legs;
  return true;
}

// Same extra-time/penalty treatment for a domestic cup leg. The cup keeps its
// own tie shape, so the aggregate is read through myClubCupTieGoals.
function myClubFinishCupLeg(c, tie, leg) {
  const legs = (tie && tie.legs) || [leg];
  const isDecidingLeg = legs.length === 1 || legs.indexOf(leg) >= legs.length - 1;
  let aggregateLevel = true;
  if (tie) {
    const g = myClubCupTieGoals(c, tie);
    if (!g.aName || !g.bName) aggregateLevel = false;
    else aggregateLevel = g.a === g.b;
  }
  return simulateKnockoutLegFinish(leg, isDecidingLeg, aggregateLevel);
}

function myClubCupTieForLeg(c, leg) {
  for (const round of (c && c.cup && c.cup.rounds) || []) {
    for (const tie of round.ties || []) {
      if ((tie.legs || []).indexOf(leg) !== -1) return tie;
    }
  }
  return null;
}

function myClubGroupMatchForceWinner(m) {
  if (!m || !m.played || m.winner) return;
  if (m.score1 > m.score2) m.winner = m.team1;
  else if (m.score2 > m.score1) m.winner = m.team2;
  else m.winner = getTeamStrength(m.team1) >= getTeamStrength(m.team2) ? m.team1 : m.team2;
}

// Aggregate goals for a cup tie, plus the two entrant names. Shared by the tie
// resolver and the extra-time/penalty check so both read the same numbers.
function myClubCupTieGoals(c, tie) {
  const aName = myClubCupTieEntrant(tie.a, c);
  const bName = myClubCupTieEntrant(tie.b, c);
  let aGoals = 0, bGoals = 0;
  for (const leg of (tie.legs || [])) {
    if (!leg || !leg.played) continue;
    if (leg.team1 === aName) { aGoals += leg.score1; bGoals += leg.score2; }
    else { bGoals += leg.score1; aGoals += leg.score2; }
  }
  return { a: aGoals, b: bGoals, aName: aName, bName: bName };
}

function myClubResolveCupTie(c, tie) {
  if (tie.done) return tie.winner;
  if (!tie.legs || tie.legs.length === 0 || !tie.legs.every(l => l && l.played)) return null;
  const g = myClubCupTieGoals(c, tie);
  const aName = g.aName, bName = g.bName;
  if (!aName || !bName) return null;
  const aGoals = g.a, bGoals = g.b;
  let winner;
  if (aGoals > bGoals) winner = aName;
  else if (bGoals > aGoals) winner = bName;
  else {
    // Level on aggregate: the deciding leg must have settled it in extra time
    // or on penalties. Fall back to strength only if nothing recorded a winner.
    const last = tie.legs[tie.legs.length - 1];
    if (last && last.winner) {
      winner = last.winner;
      tie.decidedBy = last.decidedBy || "penalties";
    } else {
      winner = getTeamStrength(aName) >= getTeamStrength(bName) ? aName : bName;
      tie.decidedBy = "penalties";
    }
  }
  tie.winner = winner;
  tie.done = true;
  if (tie.key === "f" && c.cup) {
    c.cup.champion = winner;
    // The title bonus belongs to the club that actually won the cup. This
    // also runs when the final is simulated in the lobby (which never calls
    // finishMyClubCupLegMatch), so a simmed cup win still registers the
    // trophy, coins and player honours.
    myClubAwardCupTitle(c);
  }
  saveMyClubData();
  return winner;
}

function myClubAwardCupTitle(c) {
  if (!c || !c.cup) return;
  if (c.cup.champion !== selectedTeam) return;
  const won = (c.trophyCabinet || []).some(t => t && t.type === "cup" && t.season === c.season && (t.competition || "") === (c.cup.name || ""));
  if (won) return;
  c.trophies = (c.trophies || 0) + 1;
  myClubAwardTrophy(c, "cup", { competition: c.cup.name });
  playerCoins += MYCLUB_TITLE_PRIZE;
  c.coins = playerCoins;
  saveClubState();
  saveMyClubData();
}

function myClubCupRunnerUp(c) {
  if (!c.cup || !c.cup.champion) return null;
  const finalRound = (c.cup.rounds || []).find(r => r.key === "f");
  if (!finalRound || !finalRound.ties.length) return null;
  const t = finalRound.ties[0];
  if (!t.done || !t.winner) return null;
  const a = myClubCupTieEntrant(t.a, c);
  const b = myClubCupTieEntrant(t.b, c);
  return t.winner === a ? b : a;
}

// The domestic Super Cup is a four-team tournament: the cup winner and
// runner-up, plus the league winner and runner-up. When one club holds two of
// those places the spare slot goes to the next club down the league table, so
// a double and a treble both still field four distinct teams.
function myClubSuperQualify(c) {
  const pool = [];
  if (Array.isArray(c.lastStandings)) {
    for (const t of c.lastStandings) if (t && pool.indexOf(t) === -1) pool.push(t);
  }
  if (c.lastChampion && pool.indexOf(c.lastChampion) === -1) pool.unshift(c.lastChampion);
  let clubs = [];
  try { clubs = myClubLeagueClubs(c) || []; } catch (e) { clubs = []; }
  for (const t of clubs) if (t && pool.indexOf(t) === -1) pool.push(t);
  if (pool.length < 4) return null;
  const teams = [];
  const add = (t) => { if (t && teams.indexOf(t) === -1 && teams.length < 4) teams.push(t); };
  add(c.lastCupWinner);
  add(c.lastCupRunnerUp);
  add(pool[0]);
  add(pool[1]);
  // Backfill down the league table until four distinct clubs are in.
  for (let i = 2; i < pool.length && teams.length < 4; i++) add(pool[i]);
  return teams.length === 4 ? teams : null;
}

// The Super Cups are the first competitive matches of the season, both in
// August: the UEFA Super Cup, then the domestic one across the weekend before
// the league kicks off.
const MYCLUB_UEFA_SUPER_DAY = 5;      // 5 August
const MYCLUB_SUPER_FIRST_DAY = 6;     // 6 August
const MYCLUB_SUPER_FINAL_DAY = 8;     // 8 August
const MYCLUB_LEAGUE_KICKOFF_DAY = 10;  // 10 August

function myClubSuperSetup(c, league) {
  c.superCup = null;
  // It is built from the previous season's cup and league, so a club's first
  // season has no Super Cup to play.
  if (!league || !league.super || !c.lastChampion) return null;
  const teams = myClubSuperQualify(c);
  if (!teams) return null;
  const semis = [];
  for (let i = 0; i < 2; i++) {
    const m = createMatch(teams[i * 2], teams[i * 2 + 1]);
    m.day = MYCLUB_SUPER_FIRST_DAY + i;
    m.played = false;
    m.cupRoundKey = "super";
    m.superRound = i === 0 ? "sf1" : "sf2";
    semis.push({ a: teams[i * 2], b: teams[i * 2 + 1], match: m, done: false, winner: null });
  }
  c.superCup = { name: league.super, teams: teams, semis: semis, final: null, champion: null, played: false };
  return c.superCup;
}

function myClubSuperTies(sc) {
  if (!sc) return [];
  const out = (sc.semis || []).filter(Boolean);
  if (sc.final) out.push(sc.final);
  return out;
}

function myClubSuperMatches(sc) {
  const out = [];
  for (const tie of myClubSuperTies(sc)) if (tie && tie.match) out.push(tie.match);
  return out;
}

function myClubSuperTieForMatch(sc, match) {
  if (!sc || !match) return null;
  for (const tie of myClubSuperTies(sc)) if (tie.match === match) return tie;
  return null;
}

// Every Super Cup tie is a single leg, so a level 90 always goes to extra time
// and then penalties. Guarded so an already-decided tie is never re-run - the
// score stays level after a shootout, so re-settling would roll it again.
function myClubSuperSettleTie(c, tie) {
  if (!tie) return null;
  if (tie.winner) return tie.winner;
  const m = tie.match;
  if (!m || !m.played) return null;
  simulateKnockoutLegFinish(m, true, true);
  myClubGroupMatchForceWinner(m);
  tie.winner = m.winner || null;
  tie.done = !!tie.winner;
  return tie.winner;
}

function myClubSuperEnsureFinal(c) {
  const sc = c && c.superCup;
  if (!sc || sc.final) return sc ? sc.final : null;
  const semis = sc.semis || [];
  if (semis.length < 2 || !semis[0].winner || !semis[1].winner) return null;
  if (semis[0].winner === semis[1].winner) return null;
  const m = createMatch(semis[0].winner, semis[1].winner);
  m.day = MYCLUB_SUPER_FINAL_DAY;
  m.played = false;
  m.cupRoundKey = "super";
  m.superRound = "f";
  sc.final = { a: semis[0].winner, b: semis[1].winner, match: m, done: false, winner: null };
  // The final is a brand new fixture, so it has to reach the on-screen group
  // before the lobby can offer it to the user.
  try { buildMyClubGroup(c); } catch (e) {}
  return sc.final;
}

function myClubSuperAdvance(c) {
  const sc = c && c.superCup;
  if (!sc) return null;
  for (const tie of (sc.semis || [])) myClubSuperSettleTie(c, tie);
  myClubSuperEnsureFinal(c);
  if (sc.final) {
    myClubSuperSettleTie(c, sc.final);
    if (sc.final.winner) {
      sc.champion = sc.final.winner;
      sc.played = true;
    }
  }
  // The trophy has to register however the final was settled - played live or
  // simulated from the lobby. The award helper ignores repeats.
  if (sc.champion === selectedTeam) myClubAwardSuperCupTitle(c);
  return sc.champion;
}

// Plays out Super Cup ties up to `day`. includeUser = false leaves the user's
// own ties for the Play button; true simulates them too and banks the credit.
function simulateMyClubSuperThrough(c, day, includeUser) {
  const sc = c && c.superCup;
  if (!sc) return 0;
  const limit = typeof day === "number" ? day : Infinity;
  const mine = selectedTeam;
  let count = 0;
  for (let guard = 0; guard < 8; guard++) {
    let progress = false;
    myClubSuperEnsureFinal(c);
    for (const tie of myClubSuperTies(sc)) {
      if (!tie || !tie.match || tie.winner) continue;
      if (tie.match.played) { myClubSuperSettleTie(c, tie); progress = true; continue; }
      const d = typeof tie.match.day === "number" ? tie.match.day : 1;
      if (d > limit) continue;
      const involvesUser = tie.match.team1 === mine || tie.match.team2 === mine;
      if (involvesUser && !includeUser) continue;
      simulateGroupMatch(tie.match);
      myClubSuperSettleTie(c, tie);
      if (involvesUser) myClubCreditSimulated(tie.match, "league");
      count++;
      progress = true;
    }
    if (!progress) break;
  }
  myClubSuperAdvance(c);
  return count;
}

function myClubAwardSuperCupTitle(c) {
  if (!c || !c.superCup || !c.superCup.name) return;
  if (c.superCup.champion !== selectedTeam) return;
  const won = (c.trophyCabinet || []).some(t => t && t.type === "supercup" && t.season === c.season && (t.competition || "") === (c.superCup.name || ""));
  if (won) return;
  c.trophies = (c.trophies || 0) + 1;
  myClubAwardTrophy(c, "supercup", { competition: c.superCup.name });
  playerCoins += MYCLUB_TITLE_PRIZE;
  c.coins = playerCoins;
  saveClubState();
  saveMyClubData();
}

const MYCLUB_UEFA_SUPER_NAME = "UEFA Super Cup";

function myClubEuroChampRecord(c) {
  if (!c.euroChamps || typeof c.euroChamps !== "object") c.euroChamps = {};
  return c.euroChamps;
}

// Only one European competition runs in a given season - which one depends on
// where the user's club finishes - so the Champions League and Europa League
// winners are remembered across seasons. The UEFA Super Cup is then contested
// between the most recent winner of each.
function myClubRecordEuroChamps(c) {
  if (!c || !c.cl || !c.cl.champion) return false;
  const comp = c.cl.comp || "cl";
  if (comp !== "cl" && comp !== "el") return false;
  const rec = myClubEuroChampRecord(c);
  rec[comp] = { team: c.cl.champion, season: typeof c.season === "number" ? c.season : 0 };
  return true;
}

// The Europa League has often not been played yet, so the missing side falls
// back to the best-placed club still available. Once both competitions have
// been played the fixture is fully accurate.
function myClubUefaSuperSides(c, standings) {
  const rec = myClubEuroChampRecord(c);
  if (!rec.cl && !rec.el) return null;
  const cl = rec.cl && rec.cl.team ? rec.cl.team : null;
  const el = rec.el && rec.el.team ? rec.el.team : null;
  if (cl && el && cl !== el) return { cl: cl, el: el, real: true };
  if (cl === el) return null;
  const pool = [];
  for (const row of (standings || [])) {
    const t = row && row.team;
    if (!t || t === selectedTeam || t === cl || t === el) continue;
    if (pool.indexOf(t) === -1) pool.push(t);
  }
  const other = cl || el;
  if (!other || !pool.length) return null;
  return cl ? { cl: cl, el: pool[0], real: false } : { cl: pool[0], el: el, real: false };
}

// The UEFA Super Cup opens the new season in August, between the Champions
// League and Europa League winners of the season that has just finished. It is
// skipped entirely in a club's first season, which has no crowned winners yet.
function myClubSetupUefaSuperCup(c, standings) {
  if (!c) return null;
  if (c.uefaSuperCup && c.uefaSuperCup.match) return c.uefaSuperCup;
  if (!c.lastChampion) return null;
  const sides = myClubUefaSuperSides(c, standings);
  if (!sides) return null;
  const rec = myClubEuroChampRecord(c);
  const stamp = (rec.cl ? rec.cl.season : 0) + ":" + (rec.el ? rec.el.season : 0);
  // The same two crowned winners means the same fixture - never replay it.
  if (c.uefaSuperStamp === stamp) return null;
  const m = createMatch(sides.cl, sides.el);
  m.day = myClubDayForDate(c, 8, MYCLUB_UEFA_SUPER_DAY);
  m.played = false;
  m.cupRoundKey = "uefaSuper";
  m.uefaSuper = true;
  c.uefaSuperCup = {
    name: MYCLUB_UEFA_SUPER_NAME,
    match: m,
    played: false,
    userPlayed: false,
    real: sides.real
  };
  c.uefaSuperStamp = stamp;
  return c.uefaSuperCup;
}

function myClubUefaSuperUserInvolved(c) {
  const m = c && c.uefaSuperCup && c.uefaSuperCup.match;
  if (!m) return false;
  return m.team1 === selectedTeam || m.team2 === selectedTeam;
}

function myClubUefaSuperResult(c, wasLive) {
  const us = c && c.uefaSuperCup;
  if (!us || !us.match || !us.match.played) return null;
  // No-ops when the 90 minutes already settled it, and otherwise sends a level
  // match to extra time and penalties - the same rule as every other knockout.
  simulateKnockoutLegFinish(us.match, true, true);
  myClubGroupMatchForceWinner(us.match);
  us.played = true;
  if (us.match.winner === selectedTeam) myClubAwardUefaSuperTitle(c);
  return us.match.winner;
}

function myClubAwardUefaSuperTitle(c) {
  if (!c || !c.uefaSuperCup || !c.uefaSuperCup.name) return;
  if ((c.uefaSuperCup.match && c.uefaSuperCup.match.winner) !== selectedTeam) return;
  const won = (c.trophyCabinet || []).some(t => t && t.type === "uefasuper" && t.season === c.season);
  if (won) return;
  c.trophies = (c.trophies || 0) + 1;
  myClubAwardTrophy(c, "uefasuper", { competition: c.uefaSuperCup.name });
  playerCoins += MYCLUB_TITLE_PRIZE;
  c.coins = playerCoins;
  saveClubState();
  saveMyClubData();
}

function myClubUefaSuperComplete(c) {
  return !c.uefaSuperCup || !c.uefaSuperCup.match || !!c.uefaSuperCup.match.played;
}

function myClubCupRoundTitle(key) {
  return ({ r1: "First Round", r16: "Round of 16", qf: "Quarter-finals", sf: "Semi-finals", f: "Final" })[key] || "";
}

function myClubLeagueComplete(c) {
  return Array.isArray(c.fixtures) && c.fixtures.length > 0 && c.fixtures.every(m => m.played);
}

function myClubCupComplete(c) {
  return !c.cup || !c.cup.rounds || c.cup.rounds.length === 0 || !!c.cup.champion;
}

function myClubSuperComplete(c) {
  return !c.superCup || !!c.superCup.champion;
}

function myClubSeasonComplete(c) {
  return myClubLeagueComplete(c) && myClubCupComplete(c) && myClubSuperComplete(c);
}

function myClubEuropeanRoute(standings, c) {
  const lg = getMyClubLeague(c.league) || {};
  const clSlots = lg.clSlots || 4;
  const rank = standings.findIndex(row => row.team === selectedTeam) + 1;
  let base = null;
  if (rank <= clSlots) base = "cl";
  else if (rank === clSlots + 1) base = "el";
  else if (rank === clSlots + 2) base = "ecl";
  const cupWon = (c.cup && c.cup.champion) === selectedTeam;
  if (cupWon && base !== "cl") return "el";
  return base;
}

function myClubResolveSeasonEnd(c, resultText, scoreLine, opponent, trophy) {
  // Europe is played inside the season now, so a live European campaign is no
  // longer a reason to hold the season open. Anything still unfinished is
  // flattened first so the tables and the season records are complete.
  if (c) {
    if (c.cl && c.cl.active) myClubFinishEuroCampaign(c, c.cl);
  }
  const lg = getMyClubLeague(c.league) || {};
  let standings = [];
  let rank = -1;
  let champion = false;
  try {
    standings = computeGroupStandings({ teams: myClubLeagueClubs(c), matches: c.fixtures });
    rank = standings.findIndex(row => row.team === selectedTeam);
    champion = rank === 0;
    myClubSettleIndividualAwards(c, "league");
  } catch (e) {
    rank = -1;
    champion = false;
  }
  let euroRoute = (function () {
    try { return myClubEuropeanRoute(standings, c); }
    catch (e) { return null; }
  })();
  const alreadyDone = c._seasonDone === c.season;
  if (champion && !alreadyDone) {
    try {
      c.trophies = (c.trophies || 0) + 1;
      myClubAwardTrophy(c, "league", { competition: lg.name || c.league });
      playerCoins += MYCLUB_TITLE_PRIZE;
      c.coins = playerCoins;
      saveClubState();
      saveMyClubData();
    } catch (e) {}
  }
  // The Club World Cup is a separate June/July tournament, so it no longer
  // replaces the European route - a club that qualified for the Champions
  // League can also play in the Club World Cup in the same season.
  const route = euroRoute || null;
  let cwcRoute = null;
  if (route || (c.cup && c.cup.champion === selectedTeam)) {
    // Continental qualification for the Club World Cup: winners of the big
    // European competitions, and the domestic cup, all get a look-in.
    cwcRoute = "cwc";
  }
  const cupChamp = (c.cup && c.cup.champion) || null;
  if (!alreadyDone) {
    c.lastChampion = champion ? selectedTeam : (standings[0] ? standings[0].team : null);
    c.lastCupWinner = cupChamp;
    c.lastCupRunnerUp = myClubCupRunnerUp(c);
    // Full final order, so next season's Super Cup can backfill from 3rd
    // downward when the cup and league places overlap.
    c.lastStandings = standings.map(row => row.team);
  }
  try { saveClubState(); } catch (e) {}
  c._seasonDone = c.season;
  saveMyClubData();
  const rank1 = rank + 1;
  if (!alreadyDone && rank1 > 0) {
    c.prevPrevFinish = c.prevFinish;
    c.prevFinish = rank1;
    c.eosMomentum = (typeof c.prevPrevFinish === "number")
      ? myClubMomentumBuff(c.prevFinish, c.prevPrevFinish)
      : 1;
  }
  if (!alreadyDone && rank1 > 0) {
    try { runMyClubTransferWindow(c, standings); } catch (e) {}
  }
  // Europe is played inside the season from here on, so all this season has to
  // do is decide what next season's campaign will be. The UEFA Super Cup is
  // already done - it opened the season in August.
  myClubRecordEuroChamps(c);
  c.euroRoute = route || null;
  c.cwcRoute = myClubCwcSeason(c) ? cwcRoute : null;
  c._uefaSuperLive = false;

  let tail;
  if (champion && route) {
    tail = " LEAGUE CHAMPIONS! +" + formatMoney(MYCLUB_TITLE_PRIZE) + " title bonus - and you qualified for the " + myClubEuroNameForRoute(route) + " next season!";
  } else if (champion) {
    tail = " LEAGUE CHAMPIONS! +" + formatMoney(MYCLUB_TITLE_PRIZE) + " title bonus - advance to Season " + (c.season + 1) + ".";
  } else if (route) {
    tail = " finished " + rank1 + ordinalSuffix(rank1) + " of " + standings.length + " - you qualified for the " + myClubEuroNameForRoute(route) + " next season!";
  } else {
    tail = " finished " + rank1 + ordinalSuffix(rank1) + " of " + standings.length + " - no European qualification next season. Advance to Season " + (c.season + 1) + ".";
  }
  showEndScreen(resultText + " " + selectedTeam + tail, scoreLine, () => {
    startMyClubSeason(c.season + 1);
    openMyClubLobby();
  }, { blue: selectedTeam, red: opponent }, trophy || (champion ? (lg.name || c.league) : null));
}

function myClubAdvanceToSeasonEnd(resultText, scoreLine, opponent, trophy) {
  preparePlayerMatch();
  const career = getMyClubCareer(myClubLeague);
  if (career && myClubAtSeasonEnd(career)) {
    myClubForceSeasonEnd(career);
    myClubResolveSeasonEnd(career, resultText, scoreLine, opponent, trophy);
    return;
  }
  showEndScreen(resultText, scoreLine, () => {
    preparePlayerMatch();
    openMyClubLobby();
  }, { blue: selectedTeam, red: opponent }, trophy || null);
}

function finishMyClubCupLegMatch(match, group, scoreLine, opponent) {
  const career = getMyClubCareer(myClubLeague);
  if (career && match && typeof match.day === "number") career.calDay = Math.max(myClubCurrentDay(career), match.day);
  if (career && match && myClubCreditAiSquadMatch(match, "league", career)) saveMyClubData();
  let resultText;
  if (blueScore > redScore) {
    if (career) myClubRegisterUserWin(career);
    const prize = myClubAward("win");
    resultText = selectedTeam + " beat " + opponent + " " + blueScore + "-" + redScore + "! +" + formatMoney(prize) + " prize";
  } else if (blueScore < redScore) {
    const prize = myClubAward("loss");
    resultText = selectedTeam + " lost to " + opponent + " " + redScore + "-" + blueScore + "." + (prize > 0 ? " +" + formatMoney(prize) + " goals scored" : "");
  } else {
    const prize = myClubAward("draw");
    resultText = selectedTeam + " drew with " + opponent + " " + blueScore + "-" + blueScore + ". +" + formatMoney(prize) + " prize";
  }
  consumeMyClubBoosts();
  myClubAdvanceFriendlyDay();
  let tie = null;
  for (const round of (career.cup && career.cup.rounds) || []) {
    for (const t of round.ties) {
      if (t.legs && t.legs.indexOf(match) !== -1) { tie = t; break; }
    }
    if (tie) break;
  }
  if (tie && !tie.done && tie.legs && tie.legs.some(l => !l.played)) {
    const agg = tie.twoLeg ? " (first leg played, second leg to come)" : "";
    showEndScreen(resultText + agg, scoreLine, () => {
      preparePlayerMatch();
      openMyClubLobby();
    }, { blue: selectedTeam, red: opponent });
    return;
  }
  if (tie) {
    myClubResolveCupTie(career, tie);
  }
  const cupTrophy = (tie && tie.key === "f" && career && career.cup && career.cup.champion === selectedTeam) ? career.cup.name : null;
  myClubAdvanceToSeasonEnd(resultText, scoreLine, opponent, cupTrophy);
}

function finishMyClubSuperCupMatch(match, group, scoreLine, opponent) {
  const career = getMyClubCareer(myClubLeague);
  if (career && myClubCreditAiSquadMatch(match, "league", career)) saveMyClubData();
  let resultText;
  if (blueScore > redScore) {
    if (career) myClubRegisterUserWin(career);
    const prize = myClubAward("win");
    resultText = selectedTeam + " beat " + opponent + " " + blueScore + "-" + redScore + "! +" + formatMoney(prize) + " prize";
  } else if (blueScore < redScore) {
    const prize = myClubAward("loss");
    resultText = selectedTeam + " lost to " + opponent + " " + redScore + "-" + blueScore + "." + (prize > 0 ? " +" + formatMoney(prize) + " goals scored" : "");
  } else {
    const prize = myClubAward("draw");
    resultText = selectedTeam + " drew with " + opponent + " " + blueScore + "-" + blueScore + ". +" + formatMoney(prize) + " prize";
  }
  consumeMyClubBoosts();
  myClubAdvanceFriendlyDay();
  const sc = career && career.superCup;
  const tie = myClubSuperTieForMatch(sc, match);
  const isFinal = !!(sc && sc.final && tie === sc.final); 
  if (career && tie) { 
    myClubSuperSettleTie(career, tie); 
    myClubSuperAdvance(career); 
  } 
  saveMyClubData(); 
  const won = isFinal && !!sc && sc.champion === selectedTeam; 
  if (isFinal && sc) { 
    resultText += won ? " - you won the " + sc.name + "!" : " - " + sc.champion + " won the " + sc.name + "."; 
  } else if (tie && tie.match && tie.match.decidedBy === "penalties") { 
    resultText += " Won on penalties.";
  } else if (tie && tie.winner) {
    resultText += " " + tie.winner + " reach the " + sc.name + " final.";
  }
  showEndScreen(resultText, scoreLine, () => {
    preparePlayerMatch();
    openMyClubLobby();
  }, { blue: selectedTeam, red: opponent }, (won && sc) ? sc.name : null); 
}

function myClubLaunchUefaSuper(c) {
  const m = c && c.uefaSuperCup && c.uefaSuperCup.match;
  if (!m) return;
  c.calDay = Math.max(myClubCurrentDay(c), typeof m.day === "number" ? m.day : 1);
  buildMyClubGroup(c);
  preparePlayerMatch();
  const scr = document.getElementById("myClubScreen");
  if (scr) scr.style.display = "none";
  const brk = document.getElementById("bracketScreen");
  if (brk) brk.style.display = "none";
  enterScreen("gameScreen", "block");
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function finishMyClubUefaSuperCupMatch(match, group, scoreLine, opponent) {
  const career = getMyClubCareer(myClubLeague);
  if (career) {
    if (career.uefaSuperCup) career.uefaSuperCup.userPlayed = true;
    career._uefaSuperLive = false;
    if (myClubCreditAiSquadMatch(match, "league", career)) saveMyClubData();
  }
  let resultText;
  if (blueScore > redScore) {
    if (career) myClubRegisterUserWin(career);
    const prize = myClubAward("win");
    resultText = selectedTeam + " beat " + opponent + " " + blueScore + "-" + redScore + "! +" + formatMoney(prize) + " prize";
  } else if (blueScore < redScore) {
    const prize = myClubAward("loss");
    resultText = selectedTeam + " lost to " + opponent + " " + redScore + "-" + blueScore + "." + (prize > 0 ? " +" + formatMoney(prize) + " goals scored" : "");
  } else {
    const prize = myClubAward("draw");
    resultText = selectedTeam + " drew with " + opponent + " " + blueScore + "-" + blueScore + ". +" + formatMoney(prize) + " prize";
  }
  consumeMyClubBoosts();
  myClubAdvanceFriendlyDay();
  const us = career && career.uefaSuperCup;
  const name = (us && us.name) || MYCLUB_UEFA_SUPER_NAME;
  const winner = myClubUefaSuperResult(career, true);
  saveMyClubData();
  const won = winner === selectedTeam;
  showEndScreen(resultText + (won ? " - you won the " + name + "!" : " - " + winner + " won the " + name + "."), scoreLine, () => {
    preparePlayerMatch();
    // The Super Cup is the season's curtain-raiser in August, not its ending -
    // the rest of the season still has to be played.
    openMyClubLobby();
  }, { blue: selectedTeam, red: opponent }, won ? name : null);
}

function simulateMyClubCupThrough(c, day) {
  if (!c) return;
  const limit = typeof day === "number" ? day : Infinity;
  if (c.superCup) {
    // AI ties only here - the user's own are left for Play Match, and
    // myClubSimThrough / myClubForceSeasonEnd simulate them explicitly.
    simulateMyClubSuperThrough(c, limit, false);
  }
  if (!c.cup) return;
  let guard = 0;
  while (guard++ < 200) {
    let progress = false;
    for (const round of c.cup.rounds || []) {
      for (const tie of round.ties) {
        if (tie.done) continue;
        const a = myClubCupTieEntrant(tie.a, c);
        const b = myClubCupTieEntrant(tie.b, c);
        if (!a || !b) continue;
        if (!tie.legs || !tie.legs.length) {
          myClubCupEnsureLegs(c, tie);
          progress = true;
          continue;
        }
        if (tie.legs.some(l => l.team1 === selectedTeam || l.team2 === selectedTeam)) continue;
        for (const leg of tie.legs) {
          if (leg.played) continue;
          if ((typeof leg.day === "number" ? leg.day : 0) > limit) continue;
          simulateGroupMatch(leg);
          myClubFinishCupLeg(c, tie, leg);
          progress = true;
        }
        if (tie.legs.every(l => l.played)) {
          myClubResolveCupTie(c, tie);
          progress = true;
        }
      }
    }
    if (!progress) break;
  }
  saveMyClubData();
}

function buildMyClubCalendar(c) {
  const entries = [];
  if (c.superCup) {
    for (const tie of myClubSuperTies(c.superCup)) {
      if (!tie || !tie.match) continue;
      const m = tie.match;
      entries.push({ day: typeof m.day === "number" ? m.day : 0, type: "super", label: c.superCup.name, round: (c.superCup.final && tie === c.superCup.final) ? "Final" : "Semi-final", home: m.team1, away: m.team2, played: !!m.played, score: m.score1, score2: m.score2, pens1: m.pens1, pens2: m.pens2 });
    }
  }
  if (c.uefaSuperCup && c.uefaSuperCup.match) {
    const um = c.uefaSuperCup.match;
    entries.push({ day: typeof um.day === "number" ? um.day : 0, type: "uefasuper", label: c.uefaSuperCup.name, home: um.team1, away: um.team2, played: !!um.played, score: um.score1, score2: um.score2, pens1: um.pens1, pens2: um.pens2 });
  }
  const lg = getMyClubLeague(c.league) || {};
  for (const m of c.fixtures || []) {
    if (typeof m.day !== "number") continue;
    entries.push({ day: m.day, type: "league", label: lg.name || "League", round: m.round, home: m.team1, away: m.team2, played: !!m.played, score: m.score1, score2: m.score2 });
  }
  if (c.cup) {
    for (const leg of c.cup.legs || []) {
      entries.push({ day: typeof leg.day === "number" ? leg.day : 0, type: "cup", label: c.cup.name || "Cup", round: myClubCupRoundTitle(leg.cupRoundKey), home: leg.team1, away: leg.team2, played: !!leg.played, score: leg.score1, score2: leg.score2, pens1: leg.pens1, pens2: leg.pens2 });
    }
  }
  for (const e of myClubCalendarEuroEntries(c)) entries.push(e);
  entries.sort((a, b) => a.day - b.day);
  return entries;
}

function myClubEuroRoundTitle(key) {
  return ({ playoff: "Knockout play-off", roundOf16: "Round of 16", quarterfinals: "Quarter-finals", semifinals: "Semi-finals", final: "Final" })[key] || key;
}

function myClubCalendarEuroTeam(c, ref) {
  if (ref === null || ref === undefined) return null;
  if (typeof ref === "string") return ref;
  const rounds = (c && c.cl && Array.isArray(c.cl.knockout)) ? c.cl.knockout : [];
  const round = rounds.find(r => r && r.key === ref.ref);
  const tie = round && round.ties && round.ties[ref.index];
  if (tie && tie.done && tie.winner) return tie.winner;
  return "Winner " + (myClubEuroRoundTitle(ref.ref) || ref.ref) + (typeof ref.index === "number" ? " " + (ref.index + 1) : "");
}

function myClubCalendarEuroEntries(c) {
  const out = [];
  if (!c || !c.cl) return out;
  const cl = c.cl;
  const comp = cl.comp || "cl";
  const clName = myClubEuroNameForRoute(comp) || myClubEuroName(c);
  // Europe is no longer a phase stacked after the domestic season, so the
  // calendar reports the real dates the fixtures were given.
  for (const m of cl.leagueMatches || []) {
    if (typeof m.day !== "number") continue;
    out.push({ day: m.day, type: "cl", comp: comp, label: clName, round: "Matchday " + m.round, home: m.team1, away: m.team2, played: !!m.played, score: m.score1, score2: m.score2 });
  }
  const order = { playoff: 0, roundOf16: 1, quarterfinals: 2, semifinals: 3, final: 4 };
  const knockRounds = (cl.knockout || []).filter(r => r && Array.isArray(r.ties));
  knockRounds.sort((a, b) => ((order[a.key] != null ? order[a.key] : 9) - (order[b.key] != null ? order[b.key] : 9)));
  for (const round of knockRounds) {
    for (const tie of round.ties) {
      const a = myClubCalendarEuroTeam(c, tie && tie.team1);
      const b = myClubCalendarEuroTeam(c, tie && tie.team2);
      (tie.legs || []).forEach(function (leg, li) {
        const day = typeof leg.day === "number" ? leg.day : (typeof round.day === "number" ? round.day : 0);
        out.push({ day: day, type: "cl", comp: comp, label: clName, round: myClubEuroRoundTitle(round.key) || round.key, home: li === 0 ? a : b, away: li === 0 ? b : a, played: !!leg.played, score: leg.score1, score2: leg.score2, pens1: leg.pens1, pens2: leg.pens2 });
      });
    }
  }
  return out;
}

function myClubNextEventLabel(c) {
  const entries = buildMyClubCalendar(c).filter(e => !e.played && (e.home === c.clubName || e.away === c.clubName));
  if (!entries.length) return null;
  const first = entries[0];
  const emoji = first.type === "super" ? "T" : first.type === "uefasuper" ? "U" : first.type === "cup" ? "C" : (first.type === "cl" ? myClubEuroLetter(first.comp) : "L");
  return emoji + " " + first.label + (first.round ? " - " + first.round : "") + " (Day " + first.day + ")";
}

function myClubCurrentDay(c) {
  const d = c && c.calDay;
  return (typeof d === "number" && d >= 1) ? d : 0;
}

function myClubEuroPhaseCurrentMatch(c) {
  if (!c || !c.cl || !Array.isArray(c.cl.leagueMatches)) return null;
  const mine = c.clubName;
  let best = null;
  let bestD = Infinity;
  for (const m of c.cl.leagueMatches) {
    if (!m || m.played) continue;
    if (m.team1 !== mine && m.team2 !== mine) continue;
    const d = typeof m.day === "number" ? m.day : (typeof m.round === "number" ? m.round * 3 : Infinity);
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}

function myClubAtMatchDay(c) {
  if (!c) return false;
  // Everything - league, cup, both Super Cups and Europe - shares one calendar,
  // so a match day is simply a day the club has a fixture on.
  const md = findPlayerMatch();
  if (!md || typeof md.day !== "number") return false;
  return myClubCurrentDay(c) >= md.day;
}

// True only when the user's next unplayed match is a European one AND the
// calendar has actually reached it.
// c.cl.active just means the club qualified for Europe this season: it is set
// when the season is built in August and stays true until the campaign ends in
// May, while the Champions League itself does not kick off until September. The
// day-by-day controls used to key off c.cl.active, so a club that qualified for
// the Champions League lost its week view, its "skip to day" box and its
// "simulate my match" tick for the whole season, leaving only "simulate the rest
// of the season" to get anywhere. Ask about the next match instead - and only
// once it is due, so a European fixture five weeks out does not block skipping
// the days in front of it.
function myClubEuroMatchReady(c) {
  if (!c || !c.cl || !c.cl.active) return false;
  const m = findPlayerMatch();
  if (!m) return false;
  const inEuro = m.clKnockout ||
    (Array.isArray(c.cl.leagueMatches) && c.cl.leagueMatches.indexOf(m) !== -1) ||
    (c.cl.groups || []).some(g => g && Array.isArray(g.matches) && g.matches.indexOf(m) !== -1);
  if (!inEuro) return false;
  // a fixture with no day sorts first in findPlayerMatch, so treat it as due
  const day = typeof m.day === "number" ? m.day : 0;
  return myClubCurrentDay(c) >= day;
}

function myClubBlockedLineupMsg() {
  const susp = myClubSuspendedStarters();
  const inj = myClubInjuredStarters();
  if (!susp.length && !inj.length) return null;
  const bits = [];
  for (const p of susp) bits.push(p.name + " (suspended)");
  for (const p of inj) bits.push(p.name + " (injured)");
  let who = bits[0];
  if (bits.length === 2) who = bits[0] + " and " + bits[1];
  else if (bits.length > 2) who = bits[0] + " and " + (bits.length - 1) + " others";
  return who + " can't play today - you have an injured or suspended player in your lineup. Swap them out in the Lineup tab before playing.";
}

function myClubPlayLabel(c) {
  if (!c) return "Next Day";
  if (myClubAtMatchDay(c)) return "Play Match";
  return "Next Day";
}

function myClubMaxRoundForDay(c) {
  const g = getPlayerGroup();
  if (!g || !g.matches) return 0;
  let maxRound = 0;
  for (const m of g.matches) {
    if (!m.played && typeof m.day === "number" && m.day <= c.calDay && typeof m.round === "number" && m.round > maxRound) maxRound = m.round;
  }
  return maxRound;
}

function myClubSimLimit(upcoming) {
  if (!upcoming) return Infinity;
  if (typeof upcoming.day !== "number") return Infinity;
  const reached = myClubCurrentDay(getMyClubCareer(myClubLeague));
  if (reached <= 0) return upcoming.day;
  return Math.min(upcoming.day, reached);
}

// A season starts on 1 August and runs into the following spring, so January
// to July belong to the NEXT calendar year. Everything that places a fixture on
// the calendar goes through here, which is what makes the year wrap work.
function myClubDayForDate(c, mo, da) {
  if (!c || !mo || !da) return 0;
  const start = myClubCalendarStart(c);
  const y = start.getUTCFullYear() + (mo < MYCLUB_SEASON_START_MONTH ? 1 : 0);
  return Math.round((Date.UTC(y, mo - 1, da) - start.getTime()) / 86400000) + 1;
}

function myClubDayForDateParts(mo, da) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return 0;
  return myClubDayForDate(c, mo, da);
}

// The Club World Cup is a June/July tournament, so the seasons that host one
// run a couple of months longer than the ones that do not.
function myClubCwcSeason(c) {
  const n = c && typeof c.season === "number" ? c.season : 1;
  return n > 0 && n % MYCLUB_CWC_INTERVAL === 0;
}

function myClubSeasonEndDay(c) {
  if (!c) return myClubDayForDateParts(5, 31) || MYCLUB_SEASON_END_DAY;
  const d = myClubDayForDate(c, 5, 31);
  return myClubCwcSeason(c) ? myClubDayForDate(c, 7, 31) : (d > 0 ? d : MYCLUB_SEASON_END_DAY);
}

function myClubAtSeasonEnd(c) {
  return !!(c && typeof c.calDay === "number" && c.calDay >= myClubSeasonEndDay(c));
}

function myClubParseSimTarget(s) {
  const t = String(s || "").trim();
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(t);
  if (m) {
    const mo = parseInt(m[1], 10), da = parseInt(m[2], 10);
    if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) return myClubDayForDateParts(mo, da);
  }
  return null;
}

function myClubResolveOpenCupTies(c) {
  if (!c || !c.cup) return;
  let guard = 0;
  while (guard++ < 200) {
    let progress = false;
    for (const round of c.cup.rounds || []) {
      for (const tie of round.ties) {
        if (tie.done) continue;
        if (!tie.legs || !tie.legs.length) {
          if (myClubCupTieEntrant(tie.a, c) && myClubCupTieEntrant(tie.b, c)) {
            myClubCupEnsureLegs(c, tie);
            progress = true;
          }
          continue;
        }
        if (tie.legs.every(l => l && l.played)) {
          if (myClubResolveCupTie(c, tie) != null) progress = true;
        }
      }
    }
    if (!progress) break;
  }
}

function myClubCupRoundOrder(key) {
  return ({ r1: 0, r16: 1, qf: 2, sf: 3, f: 4 })[key] || 0;
}

function myClubForceSeasonEnd(c) {
  if (!c) return;
  for (const m of c.fixtures || []) if (!m.played) simulateGroupMatch(m);
  const mine = c.clubName;
  for (const m of c.fixtures || []) {
    if (!m || !m.played) continue;
    if (m.team1 !== mine && m.team2 !== mine) continue;
    const won = m.team1 === mine ? m.score1 > m.score2 : m.score2 > m.score1;
    if (won) myClubRegisterUserWin(c);
  }
  if (c.cup && c.cup.rounds) {
    const rounds = c.cup.rounds.slice().sort((x, y) => myClubCupRoundOrder(x.key) - myClubCupRoundOrder(y.key));
    for (const round of rounds) {
      for (const tie of round.ties || []) {
        if (tie.done) continue;
        if (myClubCupTieEntrant(tie.a, c) && myClubCupTieEntrant(tie.b, c) &&
            (!tie.legs || !tie.legs.length)) myClubCupEnsureLegs(c, tie);
      }
    }
  }
  simulateMyClubCupThrough(c, myClubSeasonEndDay(c));
  myClubEnsurePlayerCupLegs();
  myClubResolveOpenCupTies(c);
  if (c.cup && c.cup.rounds) {
    const rounds = c.cup.rounds.slice().sort((x, y) => myClubCupRoundOrder(x.key) - myClubCupRoundOrder(y.key));
    for (const round of rounds) {
      for (const tie of round.ties || []) {
        if (tie.done) continue;
        const a = myClubCupTieEntrant(tie.a, c);
        const b = myClubCupTieEntrant(tie.b, c);
        if (!a || !b) continue;
        for (const leg of tie.legs || []) {
          if (leg.played) continue;
          simulateGroupMatch(leg);
          myClubFinishCupLeg(c, tie, leg);
        }
        myClubResolveCupTie(c, tie);
      }
    }
  }
  if (c.superCup) simulateMyClubSuperThrough(c, Infinity, true);
  // The European competition too - forcing the season end used to skip it, so a
  // knockout phase that was still open stayed on TBD all the way to the new year.
  if (c.cl && !c.cl.champion) {
    if (!c.cl.knockout || !c.cl.knockout.length) {
      for (const m of (c.cl.leagueMatches || [])) {
        if (!m || m.played) continue;
        simulateGroupMatch(m);
        myClubCreditSimulated(m, "cl");
      }
      if (myClubEuroLeagueComplete(c)) myClubEuroSetupKnockout(c);
    }
    if (c.cl.knockout && c.cl.knockout.length && !c.cl.champion) myClubSimEuroKnockout(c, true);
  }
  saveMyClubData();
}

function myClubSimThrough(c, to) {
  let playedCount = 0;
  const mine = c.clubName;
  const start = myClubCurrentDay(c);
  myClubSyncGroupsForSim(c);
  const step = () => {
    const day = myClubCurrentDay(c);
    const maxRound = myClubMaxRoundForDay(c);
    if (maxRound) simulateLeagueThrough(maxRound);
    if (c.cl) {
      myClubSimEuroDays(c, day);
      // Europe finishing in May hands the slot to the Club World Cup in June.
      if (c.cl && !c.cl.active && c.cl.comp !== "cwc" && c.cl.champion) myClubStartCwcIfEarned(c);
    }
    for (const m of (c.fixtures || [])) {
      if (m.played || (m.team1 !== mine && m.team2 !== mine)) continue;
      if (typeof m.day === "number" && m.day <= day) { simulateGroupMatch(m); myClubCreditSimulated(m, "league"); playedCount++; }
    }
    if (c.superCup) playedCount += simulateMyClubSuperThrough(c, day, true);
    simulateMyClubCupThrough(c, day);
    for (const leg of (c.cup && c.cup.legs || [])) {
      if (leg.played || (leg.team1 !== mine && leg.team2 !== mine)) continue;
      if (typeof leg.day === "number" && leg.day <= day) {
        simulateGroupMatch(leg);
        // The user's own cup legs still need the knockout finish treatment.
        const pTie = myClubCupTieForLeg(c, leg);
        if (pTie) myClubFinishCupLeg(c, pTie, leg);
        myClubCreditSimulated(leg, "league");
        playedCount++;
      }
    }
    myClubResolveOpenCupTies(c);
    myClubEnsurePlayerCupLegs();
  };
  for (let d = start; d <= to; d++) { c.calDay = d; step(); myClubTickFriendlyDay(c); }
  step();
  return playedCount;
}

// simulateLeagueThrough reads tournament.groups, and reloading the page mid-season
// leaves that empty, so a sim would skip the league entirely. Refresh just the
// groups from the career - buildMyClubGroup() also clears tournament.knockout,
// which would wipe a European bracket that is still in progress.
function myClubSyncGroupsForSim(c) {
  try {
    const league = getMyClubLeague(c && c.league);
    const teams = myClubLeagueClubs(c);
    if (!league || !teams || !teams.length) return;
    const groups = [{ name: league.name, teams: teams, matches: c.fixtures || [] }];
    if (c.cup && Array.isArray(c.cup.legs) && c.cup.legs.length) {
      groups.push({ name: c.cup.name, cup: "dom", teams: teams, matches: c.cup.legs });
    }
    if (c.superCup && myClubSuperMatches(c.superCup).length) {
      groups.push({
        name: c.superCup.name, cup: "super",
        teams: c.superCup.teams.slice(),
        matches: myClubSuperMatches(c.superCup)
      });
    }
    if (c.uefaSuperCup && c.uefaSuperCup.match) {
      groups.push({ name: c.uefaSuperCup.name, cup: "uefasuper", teams: [c.uefaSuperCup.match.team1, c.uefaSuperCup.match.team2], matches: [c.uefaSuperCup.match] });
    }
    if (c.cl && Array.isArray(c.cl.leagueMatches) && c.cl.leagueMatches.length) {
      if (c.cl.comp === "cwc") {
        for (const g of (c.cl.groups || [])) groups.push({ name: g && g.name, teams: g && g.teams, matches: g && g.matches, cup: "cwc" });
      } else {
        groups.push({ name: myClubEuroNameForRoute(c.cl.comp), teams: c.cl.teams, matches: c.cl.leagueMatches, cup: "cl" });
      }
    }
    tournament.groups = groups;
  } catch (e) {}
}

/* Simulate everything left in the season - the user's own matches included -
   and roll straight into the season summary. The day-by-day "Simulate" button
   stops at the user's next matchday unless auto-play is ticked, which makes it
   unusable for skipping a whole season in one go. */
function myClubSimulateSeason() {
  if (myClubPvpBlockIfSeasonOnly("Simulating the season")) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const btn = document.getElementById("myClubSimSeasonBtn");
  const seasonNum = typeof c.season === "number" ? c.season : 1;
  if (myClubAtSeasonEnd(c)) {
    myClubLobbyMsg("Season " + seasonNum + " is already complete - press Next Day to roll over into Season " + (seasonNum + 1) + ".");
    return;
  }
  const from = myClubCurrentDay(c);
  const endDay = myClubSeasonEndDay(c);
  if (typeof from !== "number" || typeof endDay !== "number" || endDay <= from) {
    myClubLobbyMsg("Nothing left to simulate this season.");
    return;
  }
  if (!window.confirm("Simulate the rest of Season " + seasonNum + "?\n\n" +
      "Every remaining match - including your own - is simulated through to the final table, " +
      "all cups and the European ties, then the season summary appears.\n\nThis cannot be undone.")) return;
  if (btn) btn.disabled = true;
  myClubLobbyMsg("Simulating Season " + seasonNum + "...");
  let played = 0;
  try {
    played = myClubSimThrough(c, endDay) || 0;
    myClubForceSeasonEnd(c);
  } catch (e) {
    if (btn) btn.disabled = false;
    myClubLobbyMsg("Could not simulate the season (" + (e && e.message ? e.message : "unknown error") + ").");
    saveMyClubData();
    return;
  }
  saveMyClubData();
  if (btn) btn.disabled = false;
  // myClubResolveSeasonEnd puts up the summary screen with the button that
  // starts the next season, so the lobby does not need refreshing here.
  myClubResolveSeasonEnd(c, "Season " + seasonNum + " simulated to the end" +
    (played ? " (" + played + " match" + (played === 1 ? "" : "es") + " played)" : "") + ".", "");
}

function simulateMyClubCLMatch(c) {
  if (!c || !c.cl || !c.cl.active) return 0;
  const match = findPlayerMatch();
  if (!match) return 0;
  // Refuse a domestic fixture. findPlayerMatch returns whichever of the user's
  // games falls next, so on a shared matchday this can be the league, and
  // booking that as a European tie paid out the wrong prize money.
  const inEuro = match.clKnockout ||
    (Array.isArray(c.cl.leagueMatches) && c.cl.leagueMatches.indexOf(match) !== -1) ||
    (c.cl.groups || []).some(g => g && Array.isArray(g.matches) && g.matches.indexOf(match) !== -1);
  if (!inEuro) return 0;

  if (match.clKnockout) {    const round = (tournament.knockout || []).find(r => r.key === match.roundKey);
    if (!round) return 0;
    const tie = round.ties[match.tieIndex];
    if (!tie) return 0;
    const legIndex = tie.legs.indexOf(match);
    const playable = makeLegPlayable(round, tie, match, legIndex);
    playable.score1 = poisson(expectedGoals(playable.team1, playable.team2));
    playable.score2 = poisson(expectedGoals(playable.team2, playable.team1));
    playable.played = true;
    const agg = legTotals(tie);
    simulateKnockoutLegFinish(playable, legIndex >= tie.legs.length - 1, agg.a === agg.b);
    blueScore = playable.team1 === selectedTeam ? playable.score1 : playable.score2;
    redScore = playable.team1 === selectedTeam ? playable.score2 : playable.score1;
    penaltyWinner = null;
    penaltyScore = null;
    if (playable.decidedBy === "penalties") {
      // endKnockoutLeg reads the shootout off penaltyWinner / penaltyScore.
      const playerIsTeam1 = playable.team1 === selectedTeam;
      penaltyWinner = playable.winner === selectedTeam ? "blue" : "red";
      penaltyScore = {
        blue: playerIsTeam1 ? playable.pens1 : playable.pens2,
        red: playerIsTeam1 ? playable.pens2 : playable.pens1
      };
    }
    endKnockoutLeg(playable);
    myClubCreditSimulated(playable, "cl");
    return 1;
  }

  const group = (tournament.groups || []).find(g => g.matches && g.matches.indexOf(match) !== -1) || getPlayerGroup();
  if (!group) return 0;
  if (match.round) simulateLeagueThrough(match.round);
  simulateGroupMatch(match);
  myClubCreditSimulated(match, "cl");
  blueScore = match.team1 === selectedTeam ? match.score1 : match.score2;
  redScore = match.team1 === selectedTeam ? match.score2 : match.score1;
  penaltyWinner = null;
  penaltyScore = null;
  const scoreLine = match.team1 + " " + match.score1 + " \u2014 " + match.score2 + " " + match.team2;
  const opponent = match.team1 === selectedTeam ? match.team2 : match.team1;

  const career = getMyClubCareer(myClubLeague);
  const cl = career && career.cl;
  let resultText;
  if (blueScore > redScore) {
    const prize = myClubPrizeFor("win", blueScore);
    resultText = selectedTeam + " beat " + opponent + " " + blueScore + "-" + redScore + "! +" + formatMoney(prize) + " prize";
  } else if (blueScore < redScore) {
    const prize = myClubPrizeFor("loss", blueScore);
    resultText = selectedTeam + " lost to " + opponent + " " + redScore + "-" + blueScore + "." + (prize > 0 ? " +" + formatMoney(prize) + " goals scored" : "");
  } else {
    const prize = myClubPrizeFor("draw", blueScore);
    resultText = selectedTeam + " drew with " + opponent + " " + blueScore + "-" + blueScore + ". +" + formatMoney(prize) + " prize";
  }
  consumeMyClubBoosts();
  myClubAdvanceFriendlyDay();

  if (cl && cl.comp === "cwc") {
    myClubCWCSimOtherGroups(career, typeof match.day === "number" ? match.day : 4);
    if (!groupStageComplete()) {
      saveMyClubData();
      return { count: 1, quiet: resultText };
    }
    const ok = myClubCWCSetupKnockout(career);
    saveMyClubData();
    if (!ok) {
      return { count: 1, quiet: selectedTeam + " did not advance out of the Club World Cup group stage." };
    }
    const pg = getPlayerGroup();
    const cwcRank = pg ? (computeGroupStandings(pg).findIndex(r => r.team === selectedTeam) + 1) : 0;
    return { count: 1, quiet: selectedTeam + " finished " + cwcRank + ordinalSuffix(cwcRank) + " in their group and advanced to the Round of 16 of the Club World Cup!" };
  }

  if (!groupStageComplete()) {
    saveMyClubData();
    return { count: 1, quiet: resultText };
  }

  const standings = computeGroupStandings(group);
  const ordered = standings.map(row => row.team);
  buildKnockoutBracket(ordered);
  const rank = standings.findIndex(row => row.team === selectedTeam) + 1;
  const stage = knockoutStageForRank(rank);
  if (cl) { cl.knockout = tournament.knockout; cl.stage = stage; saveMyClubData(); }
  if (stage === "eliminated") {
    if (cl) { cl.active = false; cl.stage = "eliminated"; saveMyClubData(); }
    myClubSettleIndividualAwards(career, "cl");
    showEndScreen(resultText + " " + selectedTeam + " finished the " + myClubEuroName(career) + " league phase " + rank + ordinalSuffix(rank) + " and were eliminated.", scoreLine, () => {
      myClubEuroPhaseEnd(career);
    }, { blue: selectedTeam, red: opponent });
    return { count: 1 };
  }
  tournament.stage = stage;
  const stageLabel = stage === "roundOf16" ? "the Round of 16" : "the knockout play-off";
  showEndScreen(resultText + " " + selectedTeam + " finished " + rank + ordinalSuffix(rank) + " and reached " + stageLabel + "!", scoreLine, () => {
    preparePlayerMatch();
    openMyClubLobby("champions");
  }, { blue: selectedTeam, red: opponent });
  return { count: 1 };
}

function myClubEuroLeagueComplete(c) {
  if (!c || !c.cl) return false;
  if (!Array.isArray(c.cl.leagueMatches) || !c.cl.leagueMatches.length) return false;
  for (const m of c.cl.leagueMatches) if (m && !m.played) return false;
  return true;
}

function myClubSimEuroDays(c, toDay, skipMine) {
  let simmed = 0;
  if (!c || !c.cl) return simmed;
  const cl = c.cl;
  const mine = c.clubName;
  const limit = (typeof toDay === "number") ? toDay : Infinity;
  if (cl.active) {
    for (const m of (cl.leagueMatches || [])) {
      if (!m || m.played) continue;
      const day = typeof m.day === "number" ? m.day : Infinity;
      if (day > limit) continue;
      if (skipMine && (m.team1 === mine || m.team2 === mine)) continue;
      simulateGroupMatch(m);
      myClubCreditSimulated(m, "cl");
      simmed++;
    }
    if (cl.stage === "cl_league" && myClubEuroLeagueComplete(c)) {
      myClubEuroSetupKnockout(c);
    }
  }
  // Keep playing the bracket out for as long as it has no champion. This used
  // to be tied to the group stage completing, so the round after the one the
  // user reached never ran - and if the user went out in the group stage the
  // bracket never ran at all.
  if (cl.knockout && cl.knockout.length && !cl.champion) myClubSimEuroKnockout(c, true, limit, skipMine);
  saveMyClubData();
  return simmed;
}

function myClubEuroSetupKnockout(c) {
  try {
    const cl = c.cl;
    if (cl && cl.comp === "cwc") return myClubCWCSetupKnockout(c);
    const grp = tournament.groups.find(g => g && g.cup === "cl") || { teams: cl.teams, matches: cl.leagueMatches };
    const standings = computeGroupStandings(grp);
    if (!standings || !standings.length) return false;
    buildKnockoutBracket(standings.map(row => row.team));
    const rank = standings.findIndex(row => row.team === c.clubName) + 1;
    const stage = knockoutStageForRank(rank);
    cl.knockout = tournament.knockout;
    cl.stage = stage;
    tournament.stage = stage;
    // Date the whole bracket, including the ties the user will never play in,
    // so the calendar stays accurate and the rest of the field can be simulated
    // on the days those rounds actually fall.
    assignMyClubEuroKnockoutDays(c, cl);
    if (stage === "eliminated") {
      cl.active = false;
      myClubSettleIndividualAwards(c, "cl");
      return false;
    }
    return true;
  } catch (e) { return false; }
}

function myClubSimEuroKnockout(c, force, toDay, skipMine) {
  const cl = c.cl;
  // force = play the bracket out even when the user's club is already out.
  // Otherwise an eliminated user left the whole bracket stuck on TBD, because
  // the group stage had already flipped cl.active to false.
  if (!cl || (!cl.active && !force)) return;
  if (cl.champion) return;
  // toDay = only play rounds that have actually arrived. Omitting it plays the
  // whole bracket out, which is what closing the season needs.
  const limit = (typeof toDay === "number") ? toDay : Infinity;
  const mine = c.clubName;
  tournament.knockout = cl.knockout || [];
  tournament.champion = cl.champion || null;
  tournament.stage = (cl.stage && cl.stage !== "cl_league") ? cl.stage : "league";
  // Settle every tie the user is NOT in before touching their own. Their tie
  // can be fed by a play-off or an earlier round that is still a placeholder,
  // and reading it too early left the tie permanently unplayable.
  simulateRemainingKnockoutToDay(limit, skipMine);
  for (const round of (tournament.knockout || [])) {
    const rd = typeof round.day === "number" ? round.day : null;
    if (rd !== null && rd > limit) continue;
    for (const tie of (round.ties || [])) {
      if (tie.done) continue;
      const sides = [tie.team1, tie.team2];
      const involvesMine = sides.some(s => resolveKnockoutRef(s) === mine);
      if (!involvesMine) continue;
      if (skipMine) continue;
      // Resolve the opponent slots BEFORE reading the tie teams, otherwise the
      // user's leg gets played against a "Winner Play-off N" placeholder.
      ensureKnockoutRefsResolved(tie);
      if (!knockoutTieReady(tie)) continue;
      const a = tieTeamA(tie), b = tieTeamB(tie);
      for (let li = 0; li < (tie.legs || []).length; li++) {
        const leg = tie.legs[li];
        if (leg.played) continue;
        leg.team1 = a;
        leg.team2 = b;
        leg.roundKey = round.key;
        leg.tieIndex = round.ties.indexOf(tie);
        leg.legIndex = li;
        leg.clKnockout = true;
        simulateGroupMatch(leg);
        const agg = legTotals(tie);
        simulateKnockoutLegFinish(leg, li >= (tie.legs || []).length - 1, agg.a === agg.b);
        myClubCreditSimulated(leg, "cl");
      }
      // Both legs are in - settle the tie now so later rounds can resolve it.
      if ((tie.legs || []).every(l => l.played)) resolveTie(tie);
    }
  }
  const champion = simulateRemainingKnockoutToDay(limit, skipMine);
  cl.knockout = tournament.knockout;
  cl.champion = tournament.champion;
  if (champion) {
    cl.active = false;
    cl.stage = champion === mine ? "champion" : "eliminated";
    if (champion === mine) {
      c.trophies = (c.trophies || 0) + 1;
      const isCwc = cl.comp === "cwc";
      myClubAwardTrophy(c, isCwc ? "cwc" : "champions", { competition: myClubEuroName(c) });
      playerCoins += isCwc ? MYCLUB_CWC_PRIZE : MYCLUB_TITLE_PRIZE;
      c.coins = playerCoins;
      try { saveClubState(); } catch (e) {}
    }
    myClubSettleIndividualAwards(c, "cl");
  }
}

function myClubSimulateToDate() {
  if (myClubPvpBlockIfSeasonOnly("Simulating days")) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (myClubAtSeasonEnd(c)) {
    myClubForceSeasonEnd(c);
    myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
    return;
  }
  if (myClubSeasonComplete(c)) {
    const tinp = document.getElementById("myClubSimInput");
    const trg = myClubParseSimTarget(tinp ? tinp.value : "");
    if (trg == null) {
      c.calDay = myClubSeasonEndDay(c);
      if (tinp) tinp.value = "";
      myClubForceSeasonEnd(c);
      myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
      return;
    }
  }
  const inp = document.getElementById("myClubSimInput");
  const autoPlay = !!(document.getElementById("myClubSimMineChk") || {}).checked;
  const target = myClubParseSimTarget(inp ? inp.value : "");
  if (target == null || target < 1) {
    myClubLobbyMsg("Enter a day number (e.g. 20) or a season date like 9/15.");
    if (inp) inp.focus();
    return;
  }
  if (typeof c.calDay !== "number" || c.calDay < 1) c.calDay = 1;
  const cur = myClubCurrentDay(c);
  const cal = buildMyClubCalendar(c);
  let lastEvent = 0;
  for (const e of cal) if (typeof e.day === "number" && e.day > lastEvent) lastEvent = e.day;
  if (myClubSeasonComplete(c)) lastEvent = Math.max(lastEvent, myClubSeasonEndDay(c));
  let to = Math.min(target, lastEvent > 0 ? lastEvent : target);
  if (!autoPlay) {
    const next = findPlayerMatch();
    if (next && typeof next.day === "number" && to >= next.day) to = next.day;
  }
  if (to <= cur) { myClubLobbyMsg("Already at or beyond Day " + to + "."); return; }
  let playedCount = 0;
  if (autoPlay) {
    playedCount = myClubSimThrough(c, to);
  } else {
    c.calDay = to;
    const maxRound = myClubMaxRoundForDay(c);
    if (maxRound) simulateLeagueThrough(maxRound);
    myClubSimEuroDays(c, c.calDay);
    simulateMyClubCupThrough(c, c.calDay);
    myClubEnsurePlayerCupLegs();
    for (let fd = 0; fd < to - cur; fd++) myClubTickFriendlyDay(c);
  }
  saveMyClubData();
  if (myClubAtSeasonEnd(c)) {
    myClubForceSeasonEnd(c);
    myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
    return;
  }
  if (inp) inp.value = "";
  myClubRefreshHeader();
  const cnt = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dt = myClubDateForDay(c, c.calDay);
  const ds = cnt[dt.getUTCMonth()] + " " + dt.getUTCDate();
  const ev = myClubNextEventLabel(c);
  const played = playedCount > 0 ? "auto-played " + playedCount + " match" + (playedCount > 1 ? "es" : "") + " - " : "";
  myClubLobbyMsg(myClubAtMatchDay(c)
    ? "Simulated to Day " + c.calDay + " (" + ds + ") - " + played + "match day! Press Play Match."
    : (ev ? "Simulated to Day " + c.calDay + " (" + ds + ") - " + played + "next: " + ev : "Simulated to Day " + c.calDay + " (" + ds + ") - " + (playedCount > 0 ? played.slice(0, -3) + "." : "rest day")));
}

function myClubAdvanceDay() {
  if (myClubPvpBlockIfSeasonOnly("Advancing the calendar")) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (myClubAtSeasonEnd(c)) {
    myClubForceSeasonEnd(c);
    myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
    return;
  }
  if (typeof c.calDay !== "number" || c.calDay < 1) c.calDay = 1;
  c.calDay++;
  const maxRound = myClubMaxRoundForDay(c);
  if (maxRound) simulateLeagueThrough(maxRound);
  simulateMyClubCupThrough(c, c.calDay);
  myClubEnsurePlayerCupLegs();
  // Europe now runs on the same day counter as everything else, so its matches
  // are played out as the calendar reaches them. The user's own games are left
  // alone so the day can stop on a real match day.
  myClubSimEuroDays(c, c.calDay, true);
  // The European campaign finishing in May hands the slot to the Club World Cup
  // in June and July.
  if (c.cl && !c.cl.active && c.cl.comp !== "cwc" && c.cl.champion) {
    myClubStartCwcIfEarned(c);
  }
  myClubAdvanceFriendlyDay();
  saveMyClubData();
  if (myClubAtSeasonEnd(c)) {
    myClubForceSeasonEnd(c);
    myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
    return;
  }
  myClubRefreshHeader();
  const calPane = document.getElementById("myClubTabCalendar");
  if (calPane && calPane.classList.contains("sel")) renderMyClubCalendarTab();
  const ev = myClubNextEventLabel(c);
  myClubLobbyMsg(myClubAtMatchDay(c)
    ? "Day " + c.calDay + " - match day! Press Play Match."
    : (ev ? "Day " + c.calDay + " - next: " + ev : "Day " + c.calDay + " - rest day"));
}

function myClubPlayBtnClick() {
  if (!myClubIsPvpMode()) myClubSetMode(MY_CLUB_GAMEMODE_PVP);
  myClubPlayRanked();
}

function myClubOpenSimMatchMenu() {
  const m = document.getElementById("myClubSimMatchMenuModal");
  if (m) m.style.display = "flex";
}

function myClubCloseSimMatchMenu() {
  const m = document.getElementById("myClubSimMatchMenuModal");
  if (m) m.style.display = "none";
}

function myClubSimMenuQuick() {
  myClubCloseSimMatchMenu();
  myClubSimMatchClick("quick");
}

function myClubSimMenuDetailed() {
  myClubCloseSimMatchMenu();
  myClubSimMatchClick("detailed");
}

function myClubSimMenuLive() {
  myClubCloseSimMatchMenu();
  myClubSimMatchClick("live");
}

function myClubRunLiveSim(c, match) {
  if (!c || !match) return null;
  const events = [];
  const home = match.team1;
  const away = match.team2;
  const homeOvr = (typeof getTeamOverall === "function") ? getTeamOverall(home) : 70;
  const awayOvr = (typeof getTeamOverall === "function") ? getTeamOverall(away) : 70;
  let h = 0, a = 0;
  for (let min = 1; min <= 90; min++) {
    if (Math.random() < 0.015 * (homeOvr / 70)) {
      h++;
      events.push(min + "' GOAL - " + home + " scores!");
    }
    if (Math.random() < 0.015 * (awayOvr / 70)) {
      a++;
      events.push(min + "' GOAL - " + away + " scores!");
    }
    if (Math.random() < 0.008) {
      const who = Math.random() < 0.5 ? home : away;
      events.push(min + "' Yellow card for " + who + ".");
    }
    if (Math.random() < 0.002) {
      const who = Math.random() < 0.5 ? home : away;
      events.push(min + "' RED CARD - " + who + " sent off!");
    }
    if (min >= 45 && min <= 75 && Math.random() < 0.012) {
      events.push(min + "' #" + (10 + Math.floor(Math.random()*11)) + " Substitution for #" + (1 + Math.floor(Math.random()*11)) + " - " + (Math.random()<0.5?home:away) + ".");
    }
  }
  if (Math.random() < 0.1 && h === a) {
    for (let min = 91; min <= 95; min++) {
      if (Math.random() < 0.05) {
        h++;
        events.push(min + "' GOAL - " + home + " scores in extra time!");
        break;
      }
      if (Math.random() < 0.05) {
        a++;
        events.push(min + "' GOAL - " + away + " scores in extra time!");
        break;
      }
    }
  }
  match.score1 = h; match.score2 = a;
  match.played = true;
  if (match.leg != null) {
    const tie = (c.cup && c.cup.ties) ? c.cup.ties.find(function(t){ return t.legs && t.legs.indexOf(match) >= 0; }) : null;
    if (tie && typeof myClubFinishCupLeg === "function") {
      try { myClubFinishCupLeg(c, tie, match); } catch (e) {}
    }
  } else if (typeof myClubCreditSimulated === "function") {
    try { myClubCreditSimulated(match, "league"); } catch (e) {}
  }
  try {
    if (typeof myClubShowLiveSimReport === "function") {
      myClubShowLiveSimReport(home + " " + h + "-" + a + " " + away, events);
    } else {
      if (typeof myClubLobbyMsg === "function") myClubLobbyMsg(home + " " + h + "-" + a + " " + away + " | " + events.slice(0,3).join(" • "));
    }
  } catch (e) {}
  return { score1: h, score2: a, events: events };
}

function myClubSimMenuPlay() {
  myClubCloseSimMatchMenu();
  try {
    if (typeof myClubPlayBtnClick === "function") myClubPlayBtnClick();
    else if (typeof myClubStartMatch === "function") myClubStartMatch();
    else myClubSimMatchClick();
  } catch (e) {
    myClubSimMatchClick();
  }
}

function myClubSimMatchClick(mode) {
  if (myClubPvpBlockIfSeasonOnly("Simulating your match")) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (mode === "live") {
    if (myClubEuroMatchReady(c)) {
      const match = findPlayerMatch ? findPlayerMatch() : null;
      if (match && (typeof myClubRunLiveSim === "function")) {
        myClubRunLiveSim(c, match);
        saveMyClubData();
        myClubRefreshHeader();
        return;
      }
    }
    if (myClubAtMatchDay(c)) {
      const mine = c.clubName;
      for (const m of (c.fixtures || [])) {
        if (m.played) continue;
        if (m.team1 === mine || m.team2 === mine) {
          if (typeof m.day === "number" && m.day <= (typeof myClubCurrentDay === "function" ? myClubCurrentDay(c) : c.calDay)) {
            if (typeof myClubRunLiveSim === "function") { myClubRunLiveSim(c, m); saveMyClubData(); myClubRefreshHeader(); return; }
          }
        }
      }
      for (const leg of (c.cup && c.cup.legs || [])) {
        if (leg.played) continue;
        if (leg.team1 === mine || leg.team2 === mine) {
          if (typeof leg.day === "number" && leg.day <= (typeof myClubCurrentDay === "function" ? myClubCurrentDay(c) : c.calDay)) {
            if (typeof myClubRunLiveSim === "function") { myClubRunLiveSim(c, leg); saveMyClubData(); myClubRefreshHeader(); return; }
          }
        }
      }
    }
  }
  if (myClubEuroMatchReady(c)) {
    const res = (typeof simulateMyClubCLMatch === "function") ? simulateMyClubCLMatch(c, mode) : null;
    saveMyClubData();
    myClubRefreshHeader();
    if (res && typeof res === "object" && res.quiet) myClubLobbyMsg(res.quiet);
    else if (!res) myClubLobbyMsg("No European match ready to simulate right now.");
    return;
  }
  if (myClubAtSeasonEnd(c)) {
    myClubForceSeasonEnd(c);
    myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
    return;
  }
  if (myClubSeasonComplete(c)) return;
  if (!myClubAtMatchDay(c)) return;
  const played = (typeof myClubSimThrough === "function") ? myClubSimThrough(c, myClubCurrentDay(c), mode) : 0;
  saveMyClubData();
  myClubRefreshHeader();
  if (myClubAtSeasonEnd(c)) {
    myClubForceSeasonEnd(c);
    myClubResolveSeasonEnd(c, "Day " + c.calDay + " - season complete", "");
    return;
  }
  if (myClubSeasonComplete(c)) {
    myClubLobbyMsg("Season complete - reach December 31 to roll over into Season " + (c.season + 1) + ".");
    return;
  }
  const ev = myClubNextEventLabel(c);
  myClubLobbyMsg(played > 0
    ? "Simulated " + played + " match" + (played > 1 ? "es" : "") + " on Day " + c.calDay + " - " + (ev ? "next: " + ev : "rest of the week is free.")
    : "Nothing to simulate right now.");
}

function myClubEnsurePlayerCupLegs() {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !c.cup) return;
  let made = false;
  for (const round of c.cup.rounds || []) {
    for (const tie of round.ties) {
      if (tie.done || (tie.legs && tie.legs.length)) continue;
      const a = myClubCupTieEntrant(tie.a, c);
      const b = myClubCupTieEntrant(tie.b, c);
      if (a === selectedTeam || b === selectedTeam) {
        if (a && b) { if (myClubCupEnsureLegs(c, tie)) made = true; }
        if (made) break;
      }
    }
    if (made) break;
  }
  if (made) saveMyClubData();
}

function myClubPlayMatch() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const match = findPlayerMatch();
  const isLeg = !!(match && match.clKnockout);
  const isCL = !!(c.cl && c.cl.active);
  let group = null;
  if (match) {
    for (const g of (tournament.groups || [])) {
      if (g.matches && g.matches.indexOf(match) !== -1) { group = g; break; }
    }
  }
  if (!match || (!isLeg && !isCL && !group)) {
    myClubLobbyMsg(isCL ? "No Champions League fixtures left - see the Champions tab." : "Season complete - check the League tab for final standings.");
    return;
  }
  const suspStarters = myClubSuspendedStarters();
  if (suspStarters.length) {
    myClubLobbyMsg(suspStarters[0].name + (suspStarters.length > 1 ? " (and " + (suspStarters.length - 1) + " more) " : " ") + "is suspended for this match - swap them out in the Lineup tab before playing.");
    return;
  }
  const injuredStarters = myClubInjuredStarters();
  if (injuredStarters.length) {
    const first = injuredStarters[0];
    myClubLobbyMsg(first.name + (injuredStarters.length > 1 ? " (and " + (injuredStarters.length - 1) + " more) " : " ") + "is injured (out " + cardInjuryDays(first) + " day" + (cardInjuryDays(first) > 1 ? "s" : "") + ") - swap them out in the Lineup tab before playing.");
    return;
  }
  document.getElementById("myClubScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

// ---- PvP Mode -------------------------------------------------------------
// My Club has two game modes. Season Mode runs the calendar: fixtures, tables,
// cups and Europe. PvP Mode is a trophy ladder instead: no calendar, no
// schedule, nothing to simulate, and one opponent at a time. The squad is
// shared between them - the eleven you pick in the Lineup tab is the eleven
// that goes out here, so anything you earn in a season turns up in PvP.
const MY_CLUB_GAMEMODE_SEASON = "season";
const MY_CLUB_GAMEMODE_PVP = "pvp";
let myClubGameMode = MY_CLUB_GAMEMODE_SEASON;
let pvpContext = null;

// The ladder. Promotion is deliberately slow - the top division sits at 10,000
// trophies, which is roughly a fortnight of ranked matches - so a good run
// climbs one rung at a time instead of sprinting to the ceiling.
const MY_CLUB_PVP_DIVISIONS = [
  { short: "I", need: 0 },
  { short: "II", need: 600 },
  { short: "III", need: 1400 },
  { short: "IV", need: 2400 },
  { short: "V", need: 3600 },
  { short: "VI", need: 4900 },
  { short: "VII", need: 6300 },
  { short: "VIII", need: 7700 },
  { short: "IX", need: 8900 },
  { short: "X", need: 10000 },
];
const MY_CLUB_PVP_TOP = MY_CLUB_PVP_DIVISIONS[MY_CLUB_PVP_DIVISIONS.length - 1].need;
// No daily cap: you can play as many ranked matches as you like. The climb is
// slow because the rewards are small, not because the game shuts the door. At a
// typical 60/20/20 record this is roughly 73 trophies a match, so Division X takes
// somewhere around 140 matches - about a fortnight of a ten-match-a-day habit.
const MY_CLUB_PVP_WIN_TROPHIES = 120;
const MY_CLUB_PVP_DRAW_TROPHIES = 25;
const MY_CLUB_PVP_LOSS_TROPHIES = -20;
const MY_CLUB_PVP_HISTORY_MAX = 20;

function myClubPvpDivisionIndex(trophies) {
  const t = Math.max(0, Number(trophies) || 0);
  let idx = 0;
  for (let i = 0; i < MY_CLUB_PVP_DIVISIONS.length; i++) {
    if (t >= MY_CLUB_PVP_DIVISIONS[i].need) idx = i;
  }
  return idx;
}

function myClubPvpDivisionName(idx) {
  const d = MY_CLUB_PVP_DIVISIONS[idx];
  return d ? "Division " + d.short : "Division I";
}

// Ladder state lives on the career, next to the rest of the club, so it is
// shared with the season save code and survives a reload. Written lazily so
// career objects created before PvP existed keep working untouched.
function myClubPvpState(c) {
  if (!c) return null;
  if (!c.pvp || typeof c.pvp !== "object" || Array.isArray(c.pvp)) {
    c.pvp = { trophies: 0, wins: 0, draws: 0, losses: 0, streak: 0, bestStreak: 0, history: [] };
  }
  const p = c.pvp;
  for (const k of ["trophies", "wins", "draws", "losses", "streak", "bestStreak"]) {
    if (typeof p[k] !== "number" || !isFinite(p[k])) p[k] = 0;
  }
  if (!Array.isArray(p.history)) p.history = [];
  // careers saved while the ladder still had a daily allowance keep those fields
  // in localStorage; drop them so the old cap cannot linger in a save file
  delete p.dayKey;
  delete p.playedToday;
  if (p.trophies < 0) p.trophies = 0;
  return p;
}

// ---- the made-up opponent -------------------------------------------------
// Real users name their team anything and field eleven of their own signings, so
// the opponent here is built the same way: a club name out of a hat and an XI
// generated player by player. Nothing here touches the real club or player
// pools - these are invented names, so a PvP rival is never mistaken for a
// real team in the fixtures.
const MY_CLUB_PVP_CLUB_PLACES = [
  "Alderford", "Ashcombe", "Bramfield", "Calderwood", "Dunmore", "Eastvale", "Fairholt",
  "Glenmara", "Harrowgate", "Innsmere", "Kestrel Bay", "Langmere", "Moorhaven", "Northwold",
  "Oakenshaw", "Pinehurst", "Quarrydale", "Ravensmoor", "Saltmarsh", "Thornbury", "Ullswater",
  "Vale End", "Westmarch", "Yarrowden", "Amberlyn", "Brightwater", "Cinderford", "Duskvale",
  "Elmsworth", "Foxhall", "Greystone", "Hollowbrook", "Ironbridge", "Juniper Flats",
  "Kingsferry", "Larkspur", "Millbrook", "Nocturne", "Orsted", "Pinecrest", "Rushmere",
  "Stormhold", "Tidewater", "Umberly", "Vexley", "Windlass", "Yewfield", "Zephyrine",
  "Blackwater", "Crestfall", "Duskwood", "Ebonhall", "Frostgate", "Goldenvale", "Highmoor",
  "Ivorybrook", "Junipero", "Kirkwall", "Lochmere", "Mistford", "Nightingale", "Oakhurst"
];

const MY_CLUB_PVP_CLUB_SUFFIX = [
  "United", "City", "Rovers", "Wanderers", "Albion", "Athletic", "FC", "AC", "Sporting",
  "Real", "Club", "Dynamo", "Racing", "Inter", "Deportivo", "Olimpico", "Union", "Nord",
  "Verde", "Azul", "Royale", "Olympic", "Marina", "Aurora", "Vittoria", "Imperial"
];

const MY_CLUB_PVP_FIRST_NAMES = [
  "Aldo", "Benni", "Cato", "Dario", "Einar", "Fabio", "Goran", "Hakan", "Ivo", "Jarno",
  "Kaspar", "Loris", "Milan", "Nuno", "Otto", "Pietro", "Ruben", "Stig", "Tomas", "Ugo",
  "Viggo", "Wout", "Xabi", "Yuri", "Zeno", "Amir", "Bilal", "Cem", "Dario", "Emre",
  "Farid", "Goran", "Hakim", "Idris", "Jonas", "Karim", "Luca", "Milan", "Nadir", "Omar",
  "Pavel", "Rafael", "Sami", "Tarek", "Viktor", "Yaser", "Andres", "Bruno", "Cristian",
  "Dmitri", "Emanuel", "Felipe", "Gustav", "Henrik", "Ivan", "Joel", "Kwame", "Leon",
  "Mateo", "Nikola", "Owen", "Petar", "Quentin", "Sergio", "Teo", "Ulrich", "Vasco"
];

const MY_CLUB_PVP_LAST_NAMES = [
  "Aaltonen", "Barros", "Cardoso", "Dalgaard", "Eriksen", "Falk", "Gudmundsson", "Hakola",
  "Ivanov", "Jelinek", "Kallio", "Lindqvist", "Marchetti", "Nyberg", "Ortega", "Pavlenko",
  "Rask", "Sandoval", "Tremblay", "Ullman", "Varga", "Wozniak", "Ximenes", "Ybarra",
  "Zetterlund", "Almeida", "Bergstrom", "Costa", "Draghi", "Ekstrom", "Fiorini", "Grimaldo",
  "Havel", "Iversen", "Jelinek", "Kovac", "Larsen", "Moreau", "Nakamura", "Ostrowski",
  "Pereira", "Quintana", "Riedel", "Sokolov", "Takahashi", "Uchida", "Vlahos", "Wagner",
  "Yoshida", "Zielinski", "Baptista", "Correia", "Delgado", "Espinoza", "Fontaine", "Guerrero",
  "Hoffmann", "Ippolito", "Jimenez", "Kaminski", "Lombardi", "Mensah", "Nowak", "Oliveira"
];

const MY_CLUB_PVP_MANAGER_NAMES = [
  "Vance", "Okonkwo", "Halloran", "Beaumont", "Silvestri", "Mbeki", "Lindqvist", "Ferrara",
  "Ashworth", "Duarte", "Kowalczyk", "Nakamura", "Rutherford", "Sandoval", "Vasquez", "Whitlock"
];

const MY_CLUB_PVP_KITS = ["#e63946", "#f77f00", "#2a9d8f", "#4361ee", "#9d4edd", "#06d6a0", "#ef476f", "#ffd166"];

function myClubPvpPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function myClubPvpUniqueName(used, make) {
  for (let i = 0; i < 400; i++) {
    const n = make();
    const k = String(n).toLowerCase();
    if (used[k]) continue;
    used[k] = true;
    return n;
  }
  // Pathological fallback - the pools are far larger than an XI needs, so this
  // should never run. Keep it unique anyway.
  let n = make(), bump = 2;
  while (used[String(n).toLowerCase()]) { n = make() + " " + (bump++); }
  used[String(n).toLowerCase()] = true;
  return n;
}

// Opponent strength follows the ladder, not the calendar. Trophies set the floor
// and the ceiling, and they carry most of the weight - a brand new club meets a
// genuinely bad side, Division X a genuinely good one. The user's own XI is
// blended in so a 92-rated club is not handed Division I opposition just for
// having started out on the ladder. The spread tightens as you climb, so the top
// division feels like real opposition rather than eleven rolled dice.
function myClubPvpTargetRating(p) {
  const t = Math.max(0, Math.min(1, (p.trophies || 0) / MY_CLUB_PVP_TOP));
  const ladder = 50 + t * 43;
  const mine = myClubLineupStrength(selectedTeam) || 60;
  const base = 0.4 * mine + 0.6 * ladder;
  const spread = 5 - t * 2.5;
  // three rolls averaged: a bell around 0, so most players sit near the middle
  // and only the tails are wildcards
  const bell = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  return Math.max(42, Math.min(99, base + bell * 2 * spread));
}

// One XI, shaped like a real side: a keeper a shade worse than the outfield,
// defenders slightly below the midfield, and one or two players who are simply
// better or worse than the rest - the way a hand-built My Club team always is.
function myClubPvpBuildOpponent(c) {
  const p = myClubPvpState(c);
  const base = myClubPvpTargetRating(p);
  const usedNames = {};
  const mk = (off, role) => {
    const bell = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
    const ovr = Math.max(40, Math.min(99, Math.round(base + off + bell * 5)));
    const nm = myClubPvpUniqueName(usedNames, () => myClubPvpPick(MY_CLUB_PVP_FIRST_NAMES) + " " + myClubPvpPick(MY_CLUB_PVP_LAST_NAMES));
    return makeRatedPlayer(nm, ovr, role);
  };
  const starSlot = Math.floor(Math.random() * 3);
  const weakSlot = Math.floor(Math.random() * 4);
  const attackers = [];
  for (let i = 0; i < 3; i++) {
    let off = 1;
    if (i === starSlot) off = 4;
    else if (i === weakSlot) off = -3;
    attackers.push(mk(off, "attacker"));
  }
  const roster = {
    defenders: [mk(-1, "defender"), mk(-1, "defender"), mk(-2, "defender"), mk(0, "defender")],
    midfielders: [mk(1, "midfielder"), mk(2, "midfielder"), mk(0, "midfielder")],
    attackers: attackers,
    goalkeeper: mk(-2, "goalkeeper")
  };
  const name = myClubPvpUniqueName(usedNames, () => myClubPvpPick(MY_CLUB_PVP_CLUB_PLACES) + " " + myClubPvpPick(MY_CLUB_PVP_CLUB_SUFFIX));
  const xi = [];
  const order = [
    ["Goalkeeper", "goalkeeper", roster.goalkeeper],
    ["Right Back", "defender", roster.defenders[0]],
    ["Centre Back", "defender", roster.defenders[1]],
    ["Centre Back", "defender", roster.defenders[2]],
    ["Left Back", "defender", roster.defenders[3]],
    ["Defensive Mid", "midfielder", roster.midfielders[0]],
    ["Centre Mid", "midfielder", roster.midfielders[1]],
    ["Attacking Mid", "midfielder", roster.midfielders[2]],
    ["Forward", "attacker", roster.attackers[0]],
    ["Forward", "attacker", roster.attackers[1]],
    ["Forward", "attacker", roster.attackers[2]]
  ];
  let sum = 0;
  for (const row of order) {
    const ovr = calculateOverall(row[2], row[1]);
    sum += ovr;
    xi.push({ pos: row[0], name: row[2].name, ovr: ovr, role: row[1] });
  }
  return {
    name: name,
    roster: roster,
    xi: xi,
    rating: Math.round(sum / order.length),
    manager: myClubPvpPick(MY_CLUB_PVP_MANAGER_NAMES),
    kit: myClubPvpPick(MY_CLUB_PVP_KITS)
  };
}

// The synthetic squad has to be reachable by name, because that is how the match
// engine resolves every opponent: TEAM_ROSTERS[getOpponentTeam()]. Register it,
// then take it back out once the match is over so the pools never grow.
function myClubPvpRegisterOpponent(opp) {
  TEAM_ROSTERS[opp.name] = opp.roster;
  teamColors[opp.name] = opp.kit;
  saveClubState();
}

function myClubPvpUnregisterOpponent(name) {
  if (!name) return;
  try {
    delete TEAM_ROSTERS[name];
    delete teamColors[name];
    saveClubState();
  } catch (e) {}
}

// ---- switching between the two My Club game modes --------------------------
function myClubSetMode(mode) {
  if (mode !== MY_CLUB_GAMEMODE_PVP) mode = MY_CLUB_GAMEMODE_SEASON;
  if (matchRunning || awaitingStart) {
    myClubLobbyMsg("Finish your current match before switching game mode.");
    return;
  }
  myClubGameMode = mode;
  pvpContext = null;
  friendlyContext = null;
  if (onl) onlLeave(true);
  myClubRefreshHeader();
  myClubRefreshTabs();
  if (mode === MY_CLUB_GAMEMODE_PVP) {
    myClubShowTab("pvp");
    myClubLobbyMsg("");
  } else {
    myClubShowTab("club");
  }
}

// Everything season-shaped is hidden in PvP Mode and comes straight back after.
function myClubPvpModeRefresh() {
  const isPvp = myClubIsPvpMode();
  const seasonBtn = document.getElementById("myClubModeSeasonBtn");
  const pvpBtn = document.getElementById("myClubModePvpBtn");
  if (seasonBtn) seasonBtn.classList.toggle("sel", !isPvp);
  if (pvpBtn) pvpBtn.classList.toggle("sel", isPvp);
  const playGroup = document.querySelector(".myClubPlayGroup");
  if (playGroup) playGroup.style.display = "none";
  const pvpBar = document.getElementById("myClubPvpBar");
  if (pvpBar) pvpBar.style.display = isPvp ? "" : "none";
  for (const id of ["myClubFormLine", "myClubTransferLine", "myClubDiffLine"]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (isPvp) el.style.display = "none";
    // myClubRefreshHeader owns the transfer and difficulty lines and rewrites
    // them on every pass; the form line it only fills in, so it has to be handed
    // back explicitly or it would stay hidden for the rest of the session
    else if (id === "myClubFormLine") el.style.display = "";
  }
  // season-only nav tabs have no meaning on the ladder
  for (const tab of ["league", "calendar", "friendlies"]) {
    const btn = document.querySelector('.myClubTab[data-tab="' + tab + '"]');
    if (btn) btn.style.display = "none";
  }
  const championsBtn = document.querySelector('.myClubTab[data-tab="champions"]');
  if (championsBtn) championsBtn.style.display = "none";
  const trophiesBtn = document.querySelector('.myClubTab[data-tab="trophies"]');
  if (trophiesBtn) trophiesBtn.style.display = "none";
  // the division, trophy count and daily allowance live in the bar, so repaint it
  // here as well as from the season header - otherwise the bar can disagree with
  // the ladder pane after a result
  if (isPvp) myClubPvpRefreshHeader();
}

function myClubIsPvpMode() { return myClubGameMode === MY_CLUB_GAMEMODE_PVP; }

function myClubPvpMsg(msg) {
  const el = document.getElementById("myClubPvpMsg");
  if (el) el.textContent = msg;
  if (msg) myClubLobbyMsg("");
}

// ---- the ranked match itself ------------------------------------------------
function myClubPvpBlockIfSeasonOnly(what) {
  if (!myClubIsPvpMode()) return false;
  myClubPvpMsg(what + " is not available in PvP Mode - PvP matches are played one at a time and cannot be simulated.");
  return true;
}

// One-tap ranked entry used by the Home and Club dashboards: make sure the game
// is on the ladder, open the PvP tab and roll an opponent.
function myClubPlayRanked() {
  if (!myClubIsPvpMode()) myClubSetMode(MY_CLUB_GAMEMODE_PVP);
  myClubShowTab("pvp");
  myClubPvpFindOpponent();
}

function myClubPvpFindOpponent() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (!myClubIsPvpMode()) { myClubSetMode(MY_CLUB_GAMEMODE_PVP); return; }
  if (matchRunning || awaitingStart) { myClubPvpMsg("Finish your current match first."); return; }
  const p = myClubPvpState(c);
  const susp = myClubSuspendedStarters();
  if (susp.length) {
    myClubPvpMsg(susp[0].name + " is suspended - swap them out in the Lineup tab before finding an opponent.");
    return;
  }
  const inj = myClubInjuredStarters();
  if (inj.length) {
    const first = inj[0];
    myClubPvpMsg(first.name + " is injured (out " + cardInjuryDays(first) + " day" + (cardInjuryDays(first) > 1 ? "s" : "") + ") - swap them out in the Lineup tab before finding an opponent.");
    return;
  }
  if (pvpContext) myClubPvpUnregisterOpponent(pvpContext.opponent);
  const opp = myClubPvpBuildOpponent(c);
  myClubPvpRegisterOpponent(opp);
  pvpContext = { opponent: opp.name, xi: opp.xi, rating: opp.rating, manager: opp.manager, trophiesAt: p.trophies, divisionAt: myClubPvpDivisionIndex(p.trophies) };
  myClubPvpMsg("");
  myClubPvpRefreshHeader();
  renderMyClubPvpTab();
  const pane = document.getElementById("myClubTabPvp");
  if (pane) pane.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function myClubPvpCancel() {
  if (pvpContext) { myClubPvpUnregisterOpponent(pvpContext.opponent); pvpContext = null; }
  myClubPvpMsg("");
  myClubPvpRefreshHeader();
  renderMyClubPvpTab();
}

function myClubPvpKickOff() {
  if (!pvpContext) { myClubPvpMsg("Find an opponent first."); return; }
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const p = myClubPvpState(c);
  const susp = myClubSuspendedStarters();
  if (susp.length) { myClubPvpMsg(susp[0].name + " is suspended - fix the lineup first."); return; }
  const inj = myClubInjuredStarters();
  if (inj.length) { myClubPvpMsg(inj[0].name + " is injured - fix the lineup first."); return; }
  document.getElementById("myClubScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function endPvpMatch() {
  const ctx = pvpContext;
  const c = getMyClubCareer(myClubLeague);
  const opp = ctx ? ctx.opponent : getOpponentTeam();
  // 1v1 online is unranked: bail out before any trophy, record, form or
  // division bookkeeping can run.
  if (ctx && ctx.online) { onlFinishMatch(opp, blueScore, redScore); return; }
  pvpContext = null;
  consumeMyClubBoosts();
  const mine = blueScore;
  const theirs = redScore;
  let delta, outcome, word;
  if (mine > theirs) { delta = MY_CLUB_PVP_WIN_TROPHIES; outcome = "win"; word = "WON"; }
  else if (mine < theirs) { delta = MY_CLUB_PVP_LOSS_TROPHIES; outcome = "loss"; word = "LOST"; }
  else { delta = MY_CLUB_PVP_DRAW_TROPHIES; outcome = "draw"; word = "DRAWN"; }

  // Ranked pays coins on the same goal / win / draw scale as a season match, so
  // the ladder keeps packs, the market and the shop fed. myClubAward also rolls
  // the match XP (and any level-up rewards) on top.
  const prize = myClubAward(outcome, mine);

  let p = null;
  let trophies = 0, promoted = null, demoted = null;
  if (c) {
    p = myClubPvpState(c);
    const before = myClubPvpDivisionIndex(p.trophies);
    p.trophies = Math.max(0, p.trophies + delta);
    const after = myClubPvpDivisionIndex(p.trophies);
    trophies = p.trophies;
    if (outcome === "win") { p.wins++; p.streak = Math.max(0, p.streak) + 1; }
    else if (outcome === "loss") { p.losses++; p.streak = 0; }
    else { p.draws++; }
    if (p.streak > p.bestStreak) p.bestStreak = p.streak;
    p.history.unshift({ o: outcome === "win" ? "w" : (outcome === "loss" ? "l" : "d"), gf: mine, ga: theirs, d: delta });
    if (p.history.length > MY_CLUB_PVP_HISTORY_MAX) p.history.length = MY_CLUB_PVP_HISTORY_MAX;
    if (after > before) promoted = after;
    if (after < before) demoted = after;
    const pst = myClubStats(c);
    if (outcome === "win") { pst.pvpWins++; if (pst.pvpWins % 3 === 0) myClubGrantTraitToken(c); }
    saveMyClubData();
  }

  const scoreLine = selectedTeam + " " + mine + " \u2014 " + theirs + " " + opp;
  let resultText = "PVP " + word + "! " + scoreLine + "  " + (delta >= 0 ? "+" : "") + delta + " trophies";
  if (prize > 0) resultText += "  +" + formatMoney(prize) + " coins";
  if (promoted !== null) resultText += " \u2014 PROMOTED to " + myClubPvpDivisionName(promoted) + "!";
  else if (demoted !== null) resultText += " \u2014 dropped to " + myClubPvpDivisionName(demoted) + ".";
  if (c) resultText += "  " + trophies + " trophies total.";
  if (p && p.streak >= 3) resultText += "  " + p.streak + "-match win streak.";

  myClubPvpUnregisterOpponent(opp);
  showEndScreen(resultText, scoreLine, () => {
    openMyClubLobby();
    myClubShowTab("pvp");
  }, { blue: selectedTeam, red: opp });
}

let friendlyContext = null;

const MY_CLUB_FRIENDLY_COOLDOWN = 3;
const MY_CLUB_FRIENDLY_MIN_BONUS = 50000;
const MY_CLUB_FRIENDLY_MAX_BONUS = 500000;
const MY_CLUB_FRIENDLY_OFFER_CHANCE = 0.12;

function myClubFriendlyCooldownLeft(c) {
  return Math.max(0, (c.friendlyLastChallengeAt + MY_CLUB_FRIENDLY_COOLDOWN) - (c.friendlyDay || 0));
}

function myClubRandomFriendlyOpponent() {
  const all = [];
  for (const l of MYCLUB_LEAGUES) for (const club of (l.clubs || [])) all.push(club);
  const pool = all.filter(x => x !== selectedTeam && TEAM_ROSTERS[x]);
  if (!pool.length) return null;
  return pickRand(pool);
}

function myClubFriendliesBonusOptions() {
  const out = [];
  for (let v = MY_CLUB_FRIENDLY_MIN_BONUS; v <= MY_CLUB_FRIENDLY_MAX_BONUS; v += 50000) out.push(v);
  return out;
}

function myClubTickFriendlyDay(c) {
  if (!c) return;
  c.friendlyDay = (typeof c.friendlyDay === "number" ? c.friendlyDay : 0) + 1;
  if (!c.friendlyOffer && Math.random() < MY_CLUB_FRIENDLY_OFFER_CHANCE) {
    const op = myClubRandomFriendlyOpponent();
    if (op) c.friendlyOffer = { opponent: op, winBonus: pickRand(myClubFriendliesBonusOptions()), day: c.friendlyDay };
  }
  advanceMyClubInjuries();
}

function myClubAdvanceFriendlyDay() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  myClubTickFriendlyDay(c);
  saveMyClubData();
}

function myClubStartFriendly(opponent, winBonus) {
  if (!opponent || !TEAM_ROSTERS[opponent]) { myClubFriendlyMsg("That team is unavailable."); return; }
  const suspStarters = myClubSuspendedStarters();
  if (suspStarters.length) {
    myClubFriendlyMsg(suspStarters[0].name + (suspStarters.length > 1 ? " (and " + (suspStarters.length - 1) + " more) " : " ") + "is suspended - swap them out in the Lineup tab before playing.");
    return;
  }
  const injuredStarters = myClubInjuredStarters();
  if (injuredStarters.length) {
    const first = injuredStarters[0];
    myClubFriendlyMsg(first.name + (injuredStarters.length > 1 ? " (and " + (injuredStarters.length - 1) + " more) " : " ") + "is injured (out " + cardInjuryDays(first) + " day" + (cardInjuryDays(first) > 1 ? "s" : "") + ") - swap them out in the Lineup tab before playing.");
    return;
  }
  friendlyContext = { opponent: opponent, winBonus: winBonus };
  document.getElementById("myClubScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function myClubChallengeTeam() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (matchRunning || awaitingStart) { myClubFriendlyMsg("Finish your current match first."); return; }
  if (myClubFriendlyCooldownLeft(c) > 0) {
    myClubFriendlyMsg("You can issue a new challenge in " + myClubFriendlyCooldownLeft(c) + " day(s).");
    return;
  }
  const oppSel = document.getElementById("myClubFriendlyOppo");
  const bonusSel = document.getElementById("myClubFriendlyBonus");
  const opponent = oppSel ? oppSel.value : "";
  const winBonus = bonusSel ? parseInt(bonusSel.value, 10) : MY_CLUB_FRIENDLY_MIN_BONUS;
  if (!opponent) { myClubFriendlyMsg("Pick a team to challenge."); return; }
  c.friendlyLastChallengeAt = c.friendlyDay;
  saveMyClubData();
  if (Math.random() < 0.55) {
    myClubStartFriendly(opponent, winBonus);
    return;
  }
  myClubRefreshHeader();
  renderMyClubFriendliesTab();
  myClubFriendlyMsg(opponent + " declined your friendly challenge. You can try again in a few days.");
}

function myClubAcceptFriendly() {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !c.friendlyOffer) return;
  const off = c.friendlyOffer;
  c.friendlyOffer = null;
  saveMyClubData();
  myClubStartFriendly(off.opponent, off.winBonus);
}

function myClubDeclineFriendly() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  c.friendlyOffer = null;
  saveMyClubData();
  renderMyClubFriendliesTab();
  myClubFriendlyMsg("You declined the friendly challenge.");
}

function myClubFriendlyMsg(msg) {
  const el = document.getElementById("myClubFriendlyMsg");
  if (el) el.textContent = msg;
}

function endFriendlyMatch() {
  const ctx = friendlyContext;
  friendlyContext = null;

  if (currentMode === "practice") {
    practiceEndDrill();
    const opp = ctx ? ctx.opponent : getOpponentTeam();
    const scoreLine = selectedTeam + " " + blueScore + " \u2014 " + redScore + " " + opp;
    const resultText = blueScore > redScore
      ? "PRACTICE WON! " + selectedTeam + " beat " + opp + " " + blueScore + "-" + redScore + "!"
      : blueScore < redScore
        ? "Practice lost to " + opp + " " + redScore + "-" + blueScore + ". Plenty to work on."
        : "Practice drawn " + blueScore + "-" + blueScore + " with " + opp + ".";
    showEndScreen(resultText, scoreLine, () => { quitToMenu(); }, { blue: selectedTeam, red: opp });
    return;
  }

  const c = getMyClubCareer(myClubLeague);
  const opp = ctx ? ctx.opponent : getOpponentTeam();
  const winBonus = ctx ? ctx.winBonus : 0;
  if (c) myClubAdvanceFriendlyDay();
  consumeMyClubBoosts();
  const scoreLine = selectedTeam + " " + blueScore + " \u2014 " + redScore + " " + opp;
  let resultText;
  if (blueScore > redScore) {
    playerCoins += winBonus;
    if (c) c.coins = playerCoins;
    saveClubState();
    saveMyClubData();
    resultText = "FRIENDLY WON! " + selectedTeam + " beat " + opp + " " + blueScore + "-" + redScore + "! +" + formatMoney(winBonus) + " win bonus";
  } else if (blueScore < redScore) {
    resultText = "Friendly lost to " + opp + " " + redScore + "-" + blueScore + ". No win bonus on a loss.";
  } else {
    resultText = "Friendly drawn " + blueScore + "-" + blueScore + ". No win bonus on a draw.";
  }
  showEndScreen(resultText, scoreLine, () => {
    openMyClubLobby();
    myClubShowTab("friendlies");
  }, { blue: selectedTeam, red: opp });
}

function myClubPrizeFor(outcome, goals) {
  const g = (typeof goals === "number") ? goals : blueScore;
  let total = g * MYCLUB_MATCH.goal;
  if (outcome === "win") total += MYCLUB_MATCH.win;
  else if (outcome === "draw") total += MYCLUB_MATCH.draw;
  return total;
}

function myClubAward(outcome, goals) {
  const total = myClubPrizeFor(outcome, goals);
  playerCoins += total;
  const c = getMyClubCareer(myClubLeague);
  if (c) {
    c.coins = playerCoins;
    const st = myClubStats(c);
    const g = (typeof goals === "number") ? goals : blueScore;
    st.played++;
    st.goals += Math.max(0, g || 0);
    if (outcome === "win") st.won++;
    else if (outcome === "draw") st.drawn++;
    else if (outcome === "loss") st.lost++;
    if (typeof redScore === "number" && redScore === 0) st.cs++;
  }
  myClubAwardMatchXP(outcome, goals);
  saveClubState();
  saveMyClubData();
  return total;
}

function myClubNextXp(c) { return c.level * 200; }

function myClubRollConsumable() {
  let total = 0;
  for (const id in MY_CLUB_CONSUMABLES) total += MY_CLUB_CONSUMABLES[id].weight;
  let roll = Math.random() * total;
  for (const id in MY_CLUB_CONSUMABLES) {
    roll -= MY_CLUB_CONSUMABLES[id].weight;
    if (roll < 0) return id;
  }
  return Object.keys(MY_CLUB_CONSUMABLES)[0];
}

function consumableLabel(con) {
  if (!con) return "";
  const stat = con.stat === "all" ? "All Stats" : (MY_CLUB_STAT_LABELS[con.stat] || con.stat);
  return "+" + con.value + " " + stat + " for " + MY_CLUB_BOOST_MATCHES + " matches";
}

function consumableArt(con) {
  if (!con) return "syringe.png";
  return (con.art === "elixir" || /elixir/i.test(con.name || "")) ? "elixir.png" : "syringe.png";
}

let pendingLevelUp = null;

// Turn queued XP into levels: rolls the surplus over, pays the level-up coins
// and hands out the consumable. Shared by match XP and the daily reward, which
// is what keeps the reward useful once a single level needs more XP than one
// day's reward pays - without it the XP would just sit there.
function myClubApplyLevelUps(c) {
  if (!c) return 0;
  if (!Array.isArray(c.consumables)) c.consumables = [];
  let leveled = 0;
  while (c.xp >= myClubNextXp(c)) {
    c.xp -= myClubNextXp(c);
    c.level++;
    playerCoins += 75000 + c.level * 25000;
    c.coins = playerCoins;
    c.consumables.push(myClubRollConsumable());
    myClubGrantTraitToken(c);
    leveled++;
  }
  if (leveled > 0) pendingLevelUp = { levels: (pendingLevelUp ? pendingLevelUp.levels : 0) + leveled, reached: c.level };
  return leveled;
}

function myClubAwardMatchXP(outcome, goals) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return 0;
  const g = (typeof goals === "number") ? goals : blueScore;
  let gain = g * MY_CLUB_XP.goal;
  if (outcome === "win") gain += MY_CLUB_XP.win;
  else if (outcome === "draw") gain += MY_CLUB_XP.draw;
  if (gain <= 0) return 0;
  c.xp = (typeof c.xp === "number" ? c.xp : 0) + gain;
  myClubApplyLevelUps(c);
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  return gain;
}

function showMyClubLevelUp() {
  const body = document.getElementById("myClubLevelBody");
  if (!body) return;
  const detail = pendingLevelUp;
  if (!detail) return;
  const c = getMyClubCareer(myClubLeague);
  body.innerHTML = "";
  const list = document.createElement("div");
  let html = '';
  if (c) {
    for (let l = c.level - detail.levels + 1; l <= c.level; l++) {
      html += '<div class="levelUpRow"><b>Level ' + l + '</b>' +
        '<span>+' + formatMoney(75000 + l * 25000) + ' coins</span>' +
        '<span>+1 consumable item</span>' +
        '<span>+1 trait token</span></div>';
    }
  }
  list.innerHTML = html;
  body.appendChild(list);
  document.getElementById("myClubLevelModal").style.display = "flex";
}

function closeMyClubLevelModal() {
  document.getElementById("myClubLevelModal").style.display = "none";
}

function finishMyClubMatch(match, group, scoreLine, opponent) {
  const career = getMyClubCareer(myClubLeague);
  if (career && match && typeof match.day === "number") career.calDay = Math.max(myClubCurrentDay(career), match.day);
  if (career && myClubCreditAiSquadMatch(match, "league", career)) saveMyClubData();
  if (career) myClubCreditLiveProfile(career, blueScore > redScore);
  let resultText;
  if (blueScore > redScore) {
    if (career) myClubRegisterUserWin(career);
    const prize = myClubAward("win");
    resultText = selectedTeam + " beat " + opponent + " " + blueScore + "-" + redScore + "! +" + formatMoney(prize) + " prize";
  } else if (blueScore < redScore) {
    const prize = myClubAward("loss");
    resultText = selectedTeam + " lost to " + opponent + " " + redScore + "-" + blueScore + "." + (prize > 0 ? " +" + formatMoney(prize) + " goals scored" : "");
  } else {
    const prize = myClubAward("draw");
    resultText = selectedTeam + " drew with " + opponent + " " + blueScore + "-" + blueScore + ". +" + formatMoney(prize) + " prize";
  }
  consumeMyClubBoosts();
  myClubAdvanceFriendlyDay();
  myClubAdvanceToSeasonEnd(resultText, scoreLine, opponent);
}

function myClubCLTeams(c) {
  return myClubEuroTeams(c, "cl");
}

function myClubCLFixtures(c) {
  return createLeagueFixtures(shuffle(myClubCLTeams(c)));
}

function startMyClubCLCareer(c) {
  // Europe is set up when the season is built; this is kept only so older save
  // data and any stale call site still resolve.
  if (c && c.euroRoute) { c.euroRoute = "cl"; myClubSetupEuroSeason(c); saveMyClubData(); }
}

function healMyClubKnockout() {
  if (currentMode !== "myclub") return false;
  const rounds = tournament.knockout || [];
  let changed = false;
  for (const round of rounds) {
    for (const tie of (round && round.ties) || []) {
      if (!tie || tie.done) continue;
      if (Array.isArray(tie.legs) && tie.legs.length && tie.legs.every(l => l && l.played)) {
        if (resolveTie(tie)) changed = true;
      }
    }
  }
  return changed;
}

// Repairs a European campaign that came from an older save. It deliberately
// does not take over the screen or replace the shared fixture list - Europe is
// just one more group on the single season calendar.
function repairMyClubEuro(c) {
  if (!c || !c.cl || !c.cl.active) return;
  const cl = c.cl;
  const isCwc = cl.comp === "cwc";
  const knownStages = ["cl_league", "playoff", "roundOf16", "quarterfinals", "semifinals", "final", "eliminated", "champion"];
  if (typeof cl.season !== "number" || cl.season < 1) cl.season = c.season || 1;
  if (knownStages.indexOf(cl.stage) === -1) cl.stage = "cl_league";
  if (!Array.isArray(cl.teams) || cl.teams.length < 2) cl.teams = isCwc ? myClubCWCTeams(c) : myClubEuroTeams(c, cl.comp || "cl");
  if (!Array.isArray(cl.leagueMatches)) cl.leagueMatches = [];
  if (isCwc) {
    if (!Array.isArray(cl.groups) || !cl.groups.length) {
      try { cl.groups = myClubCWCGroupData(c, cl.teams); } catch (e) { cl.groups = []; }
    }
    if (!cl.leagueMatches.length) {
      cl.leagueMatches = [];
      for (const g of cl.groups || []) for (const m of (g.matches || [])) cl.leagueMatches.push(m);
    }
  } else if (!cl.leagueMatches.length) {
    cl.leagueMatches = createLeagueFixtures(shuffle(cl.teams));
  }
  if (!Array.isArray(cl.knockout)) cl.knockout = [];
  if (cl.champion === undefined) cl.champion = null;
  let needEuroDays = false;
  for (const m of cl.leagueMatches || []) {
    if (m && typeof m.day !== "number") { needEuroDays = true; break; }
  }
  if (needEuroDays) assignMyClubEuroFixtureDays(c, cl);
  if (cl.stage !== "cl_league" && cl.knockout.length) {
    let needKoDays = false;
    for (const r of cl.knockout) {
      if (r && typeof r.day !== "number") { needKoDays = true; break; }
    }
    if (needKoDays) assignMyClubEuroKnockoutDays(c, cl);
  }
  buildMyClubGroup(c);
}

function activateMyClubCL(c) {
  repairMyClubEuro(c);
}

function finishMyClubCLMatch(match, group, scoreLine, opponent) {
  const career = getMyClubCareer(myClubLeague);
  const cl = career && career.cl;
  if (career && myClubCreditAiSquadMatch(match, "cl", career)) saveMyClubData();
  if (career) myClubCreditLiveProfile(career, blueScore > redScore);
  let resultText;
  if (blueScore > redScore) {
    if (career) myClubRegisterUserWin(career);
    const prize = myClubAward("win");
    resultText = selectedTeam + " beat " + opponent + " " + blueScore + "-" + redScore + "! +" + formatMoney(prize) + " prize";
  } else if (blueScore < redScore) {
    const prize = myClubAward("loss");
    resultText = selectedTeam + " lost to " + opponent + " " + redScore + "-" + blueScore + "." + (prize > 0 ? " +" + formatMoney(prize) + " goals scored" : "");
  } else {
    const prize = myClubAward("draw");
    resultText = selectedTeam + " drew with " + opponent + " " + blueScore + "-" + blueScore + ". +" + formatMoney(prize) + " prize";
  }
  consumeMyClubBoosts();
  myClubAdvanceFriendlyDay();
  if (cl && cl.comp === "cwc") {
    myClubCWCSimOtherGroups(career, typeof match.day === "number" ? match.day : 4);
    if (!groupStageComplete()) {
      showEndScreen(resultText, scoreLine, () => {
        preparePlayerMatch();
        openMyClubLobby("champions");
      }, { blue: selectedTeam, red: opponent });
      return;
    }
    const ok = myClubCWCSetupKnockout(career);
    saveMyClubData();
    if (!ok) {
      // Out of the Club World Cup, but the season still has to be played out.
      showEndScreen(resultText + " " + selectedTeam + " did not advance out of the Club World Cup group stage.", scoreLine, () => {
        preparePlayerMatch();
        openMyClubLobby();
      }, { blue: selectedTeam, red: opponent });
      return;
    }
    const pg = getPlayerGroup();
    const cwcRank = pg ? (computeGroupStandings(pg).findIndex(row => row.team === selectedTeam) + 1) : 0;
    showEndScreen(resultText + " " + selectedTeam + " finished " + cwcRank + ordinalSuffix(cwcRank) + " in their group and advanced to the Round of 16 of the Club World Cup!", scoreLine, () => {
      preparePlayerMatch();
      openMyClubLobby("champions");
    }, { blue: selectedTeam, red: opponent });
    return;
  }
  if (!groupStageComplete()) {
    showEndScreen(resultText, scoreLine, () => {
      preparePlayerMatch();
      openMyClubLobby("champions");
    }, { blue: selectedTeam, red: opponent });
    return;
  }
  const standings = computeGroupStandings(group);
  const ordered = standings.map(row => row.team);
  buildKnockoutBracket(ordered);
  const rank = standings.findIndex(row => row.team === selectedTeam) + 1;
  const stage = knockoutStageForRank(rank);
  if (cl) { cl.knockout = tournament.knockout; cl.stage = stage; saveMyClubData(); }
  if (stage === "eliminated") {
    if (cl) { cl.active = false; cl.stage = "eliminated"; saveMyClubData(); }
    myClubSettleIndividualAwards(career, "cl");
    showEndScreen(resultText + " " + selectedTeam + " finished the " + myClubEuroName(career) + " league phase " + rank + ordinalSuffix(rank) + " and were eliminated.", scoreLine, () => {
      myClubEuroPhaseEnd(career);
    }, { blue: selectedTeam, red: opponent });
    return;
  }
  tournament.stage = stage;
  const stageLabel = stage === "roundOf16" ? "the Round of 16" : "the knockout play-off";
  showEndScreen(resultText + " " + selectedTeam + " finished " + rank + ordinalSuffix(rank) + " and reached " + stageLabel + "!", scoreLine, () => {
    preparePlayerMatch();
    openMyClubLobby("champions");
  }, { blue: selectedTeam, red: opponent });
}

function renderMyClubChampionsTab() {
  const pane = document.getElementById("myClubTabChampions");
  if (!pane) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c || !c.cl || !c.cl.active) {
    pane.innerHTML = '<div class="myClubPaneCard"><h3>' + myClubEuroName(myClubLeague ? getMyClubCareer(myClubLeague) : null) + '</h3><p>You are not in European competition. Finish in the top 4 of your league (top 3 in Ligue 1), or win the domestic cup to qualify for next season.</p></div>';
    return;
  }
  const stage = c.cl.stage === "cl_league" ? "league" : c.cl.stage;
  const isCwc = c.cl.comp === "cwc";
  let h = '<div class="myClubPaneCard"><h3>' + myClubEuroName(c) + ' - Season ' + c.cl.season + '</h3>';
  if (stage === "league") {
    if (isCwc) {
      h += '<div class="clZoneBanner">Club World Cup group stage \u2014 8 groups of 4, top 2 of each group advance to the single-leg Round of 16.</div>';
      const groups = (tournament.groups || []).filter(g => g && g.cup === "cwc");
      const src = groups.length ? groups : (c.cl.groups || []);
      for (const gg of src) h += makeMyClubCWCGroupHTML(c, gg);
    } else {
    const grp = tournament.groups.find(g => g.cup === "cl") || { name: "Champions League", teams: c.cl.teams, matches: c.cl.leagueMatches };
    const standings = computeGroupStandings(grp);
    const rank = standings.findIndex(row => row.team === selectedTeam) + 1;
    const zone = rank <= 8 ? "Round of 16" : (rank <= 24 ? "knockout play-off" : "outside the qualifying places");
    h += '<div class="clZoneBanner' + (rank > 8 && rank <= 24 ? " playoff" : "") + '">Currently <b>' + rank + ordinalSuffix(rank) + ' of ' + standings.length + '</b> \u2014 ' + zone + '.</div>';
    h += makeGroupHTML(grp);
    }
  } else {
    const titles = { playoff: "Knockout play-off", roundOf16: "Round of 16", quarterfinals: "Quarter-finals", semifinals: "Semi-finals", final: "Final" };
    if (isCwc) {
      h += '<div class="clZoneBanner">Club World Cup knockout: <b>' + (titles[stage] || stage) + '</b>. Single-leg matches all the way to the final.</div>';
    } else {
      h += '<div class="clZoneBanner">Knockout stage: <b>' + (titles[stage] || stage) + '</b>. Two legs in every round \u2014 the final is a single match.</div>';
    }
    h += makeKnockoutBracketHTML();
  }
  h += '</div>';
  pane.innerHTML = h;
}

function myClubRefreshTabs() {
  const c = getMyClubCareer(myClubLeague);
  const isPvp = myClubIsPvpMode();
  delete MYCLUB_DYN.pvp;
  delete MYCLUB_DYN.champs;
  // Ranked-only: the ladder tab is the sole dynamic tab. The season "champions"
  // tab that used to appear for an active European campaign is never injected.
  if (isPvp) {
    MYCLUB_DYN.pvp = ["pvp", "PV", "PvP"];
  }
  myClubPaintSubNav();
  myClubPvpModeRefresh();
}

function consumeOneBoost(p) {
  if (!p) return;
  const list = playerBoostList(p);
  if (!list.length) return;
  const alive = [];
  for (const b of list) {
    b.matchesLeft--;
    if (b.matchesLeft > 0) alive.push(b);
  }
  delete p.boost;
  if (alive.length) p.boosts = alive;
  else delete p.boosts;
}

function consumeMyClubBoosts() {
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return;
  const bands = ["defenders", "midfielders", "attackers"];
  for (const b of bands) {
    const arr = roster[b];
    if (Array.isArray(arr)) for (const p of arr) consumeOneBoost(p);
  }
  consumeOneBoost(roster.goalkeeper);
  saveClubState();
}

function normalizePackEntry(e) {
  if (Array.isArray(e)) {
    return { name: e[0], baseOvr: typeof e[1] === "number" ? e[1] : 70, role: e[2] || "attacker", stats: null, tag: null, variant: null, nation: null };
  }
  return {
    name: e.name,
    baseOvr: typeof e.ovr === "number" ? e.ovr : (e.stats && typeof e.stats === "object" ? null : 70),
    role: e.role || "attacker",
    stats: e.stats && typeof e.stats === "object" ? e.stats : null,
    tag: e.tag || null,
    variant: e.variant || null,
    nation: e.nation || null
  };
}

// Build a ready-to-pack card from a pool entry. Entries can be the short
// tuple ["Name", OVR, "role"] (stats derived from OVR) OR an object with
// explicit stats, e.g. { name, role, stats: { pace, shooting, passing,
// dribbling, defending, physical } } - in that case the player's overall
// is computed from the given stats, not derived.
function myClubRollRarity(odds) {
  let total = 0;
  for (const o of odds) total += o.w;
  let roll = Math.random() * total;
  for (const o of odds) {
    roll -= o.w;
    if (roll < 0) return o.r;
  }
  return odds[odds.length - 1].r;
}

function packEntryOvr(e) {
  try {
    if (e && e.stats && typeof e.stats === "object") {
      const probe = makePlayerData(e.name, e.stats);
      return calculateOverall(probe, e.role || "attacker");
    }
  } catch (err) { /* fall through to baseOvr */ }
  return typeof e.baseOvr === "number" ? e.baseOvr : 70;
}

function pickRandPoolWeighted(pool) {
  const all = (pool || []).map(e => normalizePackEntry(e));
  if (!all.length) return null;
  let total = 0;
  const weights = all.map(e => {
    const ovr = packEntryOvr(e);
    const w = Math.max(1, 100 - ovr);
    total += w;
    return w;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < all.length; i++) {
    roll -= weights[i];
    if (roll < 0) return all[i];
  }
  return all[all.length - 1];
}

function poolPickForRole(pool, role) {
  const all = pool.map(e => normalizePackEntry(e));
  if (role) {
    const hits = all.filter(e => e.role === role);
    if (hits.length) return pickRandPoolWeighted(hits);
  }
  return pickRandPoolWeighted(all);
}

// ---- Tier overalls ----
// Every rarity sits on a fixed ladder, worst -> best, and a pulled card's
// overall and stats are rescaled onto that ladder so a card can never be
// outshone by one from a lower bracket:
// bronze < prospect < silver < gold < special < league (PL/LaLiga/...)
// < captain < game legend < nation legend < nation leader < icon
// < road to glory < holographic < world cup < MAX (MAX keeps its own 96-99).
// Holographic deliberately shares the 92-93 band with Road to Glory so no
// existing card is rescaled; it is ranked above RTG by myClubTagRank instead,
// which is what drives its odds, market value and price.
const MYCLUB_TIER_OVR = {
  BRONZE: [60, 63], PROSPECT: [64, 66], SILVER: [67, 70], GOLD: [71, 74],
  SPECIAL: [75, 78], LEAGUE: [79, 81], CAPTAIN: [82, 83], HERO: [84, 85],
  LEGEND: [86, 87], NATIONLEADER: [88, 89], ICON: [90, 91],
  RTG: [92, 93], HOLO: [92, 93], WC: [94, 95], MAX: [96, 99]
};

function myClubTierKey(card) {
  const tag = String(card.tag || "").toUpperCase();
  if (tag === "PL" || tag === "LALIGA" || tag === "BUNDESLIGA" || tag === "SERIEA" || tag === "LIGUE1") return "LEAGUE";
  if (tag === "BRONZE" || tag === "SILVER" || tag === "GOLD" || tag === "PROSPECT" ||
      tag === "SPECIAL" || tag === "CAPTAIN" || tag === "HERO" || tag === "LEGEND" ||
      tag === "NATIONLEADER" || tag === "ICON" || tag === "RTG" || tag === "HOLO" ||
      tag === "WC" || tag === "MAX") {
    return tag;
  }
  return null;
}

// Rescale a freshly pulled card onto its tier's OVR band. The player's natural
// rating decides where they sit inside the band, so the best players in each
// bracket still edge their team-mates, but a card cannot cross its tier's
// ceiling - except MAX, which keeps its own 96-99.
function myClubFitTier(card, natural) {
  const key = myClubTierKey(card);
  const band = MYCLUB_TIER_OVR[key];
  if (!band) return card;
  let target;
  if (typeof natural === "number" && natural > 0) {
    const p = Math.max(0, Math.min(1, (natural - 58) / (99 - 58)));
    target = Math.min(band[1], band[0] + Math.round(p * (band[1] - band[0])));
  } else {
    target = band[1];
  }
  if (key === "MAX") {
    target = (typeof natural === "number" && natural > 0) ? Math.max(96, Math.min(99, natural)) : 96;
  }
  const c = makeRatedPlayer(card.name, target, card.role || "attacker");
  c.role = card.role;
  c.tag = card.tag;
  c.variant = card.variant;
  c.pos = card.pos;
  c.nation = card.nation;
  if (card.__bonus) c.__bonus = true;
  return c;
}

function namedCardFor(role, baseOvr, tag, variant, nation) {
  const name = pickRand(BASE_FIRST) + " " + pickRand(BASE_LAST);
  const card = makeRatedPlayer(name, baseOvr, role);
  card.role = role;
  card.tag = tag;
  card.variant = variant;
  card.pos = myClubPackPos(role);
  card.nation = nation || randNation();
  return myClubFitTier(card, baseOvr);
}

function myClubBaseCard(band, min, max, role) {
  let e = null;
  if (role) {
    const hits = MYCLUB_BASE_PLAYERS.filter(function (x) { return x[2] === role; });
    if (hits.length) e = pickRand(hits);
  }
  if (!e) e = MYCLUB_BASE_PLAYERS.length ? pickRand(MYCLUB_BASE_PLAYERS) : null;
  if (!e) return namedCardFor(role || pickRand(BASE_ROLES), randInt(min, max), band, band);
  const natural = randInt(min, max);
  const card = makeRatedPlayer(e[0], natural, e[2]);
  card.role = e[2];
  card.tag = band;
  card.variant = band.charAt(0) + band.slice(1).toLowerCase();
  card.pos = myClubPackPos(e[2]);
  card.nation = e[3] || MYCLUB_PLAYER_NATIONS[e[0]] || randNation();
  return myClubFitTier(card, natural);
}

function makeCardForRarity(r, role, nation) {
  const fallbackRole = role || pickRand(BASE_ROLES);
  if (r === "bronze") return myClubBaseCard("BRONZE", 60, 69, role);
  if (r === "silver") return myClubBaseCard("SILVER", 70, 77, role);
  if (r === "gold") return myClubBaseCard("GOLD", 78, 85, role);
  if (r === "legend") {
    const nationKeys = Object.keys(MYCLUB_NATION_LEGENDS);
    const nation = pickRand(nationKeys);
    const pool = MYCLUB_NATION_LEGENDS[nation] || [];
    const e = normalizePackEntry(pickRand(pool.length ? pool : [["Nation Legend", 92, "attacker"]]));
    const card = e.stats ? makePlayerData(e.name, e.stats) : makeRatedPlayer(e.name, e.baseOvr, e.role);
    card.role = e.role;
    card.tag = "LEGEND";
    card.variant = "Nation Legend";
    card.pos = myClubPackPos(e.role);
    card.nation = e.nation || MYCLUB_PLAYER_NATIONS[e.name] || nation;
    return myClubFitTier(card, e.baseOvr);
  }
  let name, baseOvr, role2, tag, variant = null, stats = null, cardNation = null, natural = null;
  if (r === "prospect") {
    const e = poolPickForRole(MYCLUB_PROSPECT_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(70, 79), "PROSPECT", "Prospect");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "PROSPECT"; variant = "Prospect"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    if (!stats) baseOvr += Math.random() < 0.3 ? 1 : (Math.random() < 0.3 ? -1 : 0);
    natural = baseOvr;
  } else if (r === "hero") {
    const e = poolPickForRole(MYCLUB_HERO_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(85, 90), "HERO", "Game Legend");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "HERO"; variant = "Game Legend"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    if (!stats) baseOvr += Math.random() < 0.4 ? 1 : 0;
    natural = baseOvr;
  } else if (r === "special") {
    const e = poolPickForRole(MYCLUB_SPECIAL_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(85, 92), "SPECIAL", null);
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "SPECIAL"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    if (!stats) baseOvr += Math.random() < 0.4 ? 1 : (Math.random() < 0.3 ? -1 : 0);
    natural = baseOvr;
  } else if (r === "icon") {
    const e = poolPickForRole(MYCLUB_ICON_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(88, 93), "ICON", null);
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "ICON"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    if (!stats) baseOvr += Math.random() < 0.3 ? 1 : 0;
    natural = baseOvr;
  } else if (r === "captain") {
    const e = poolPickForRole(MYCLUB_CAPTAIN_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(87, 91), "CAPTAIN", "Team Captain");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "CAPTAIN"; variant = "Team Captain"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    natural = baseOvr;
  } else if (r === "league") {
    const lp = pickRand(MYCLUB_LEAGUE_POOLS);
    const e = poolPickForRole(lp.pool, role);
    if (!e) return namedCardFor(fallbackRole, randInt(86, 90), lp.tag, lp.variant);
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = lp.tag; variant = lp.variant; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    natural = baseOvr;
  } else if (r === "nationleader") {
    const e = poolPickForRole(MYCLUB_NATION_LEADER_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(88, 92), "NATIONLEADER", "Nation Leader");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "NATIONLEADER"; variant = "Nation Leader"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    natural = baseOvr;
  } else if (r === "rtg") {
    const e = poolPickForRole(MYCLUB_RTG_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(88, 92), "RTG", "Road to Glory");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr + (Math.random() < 0.3 ? 1 : 0); tag = "RTG"; variant = "Road to Glory"; cardNation = MYCLUB_PLAYER_NATIONS[e.name];
    natural = baseOvr;
  } else if (r === "holo") {
    const e = poolPickForRole(MYCLUB_HOLO_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(92, 93), "HOLO", "Holographic");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; tag = "HOLO"; variant = "Holographic"; cardNation = MYCLUB_PLAYER_NATIONS[e.name];
    natural = baseOvr;
  } else if (r === "wc") {
    const e = poolPickForRole(MYCLUB_WC_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(94, 95), "WC", "World Cup");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; tag = "WC"; variant = "World Cup"; cardNation = MYCLUB_PLAYER_NATIONS[e.name] || "Spain";
    natural = baseOvr;
  } else {
    const e = poolPickForRole(MYCLUB_MAX_PLAYERS, role);
    if (!e) return namedCardFor(fallbackRole, randInt(94, 99), "MAX", "MAX");
    name = e.name; role2 = e.role; baseOvr = e.baseOvr; stats = e.stats; tag = "MAX"; variant = "MAX"; cardNation = e.nation || MYCLUB_PLAYER_NATIONS[e.name];
    natural = baseOvr;
  }
  const card = stats ? makePlayerData(name, stats) : makeRatedPlayer(name, baseOvr, role2);
  card.role = role2;
  card.tag = tag;
  card.variant = variant;
  card.pos = myClubPackPos(role2);
  card.nation = cardNation || randNation();
  return myClubFitTier(card, natural);
}

function makePackedCard(type) {
  if (type === "box") return null;
  const spec = MYCLUB_PACKS[type];
  if (spec && Array.isArray(spec.pool)) {
    const entry = normalizePackEntry(pickRand(spec.pool));
    const card = entry.stats
      ? makePlayerData(entry.name, entry.stats)
      : makeRatedPlayer(entry.name, entry.baseOvr, entry.role);
    card.role = entry.role;
    card.tag = entry.tag || spec.tag || "SPECIAL";
    card.variant = entry.variant || (spec.variant ? spec.variant : null);
    card.pos = myClubPackPos(entry.role);
    card.nation = entry.nation || randNation();
    return myClubFitTier(card, entry.baseOvr);
  }
  if (spec && spec.tier) return makeCardForRarity(spec.tier, spec.role || null, spec.nation ? (myClubNation || "Brazil") : null);
  if (spec && Array.isArray(spec.odds)) return makeCardForRarity(myClubRollRarity(spec.odds), spec.role || null);
  return makeCardForRarity("bronze");
}

function myClubPackGuarantee(type) {
  const spec = MYCLUB_PACKS[type];
  const rarity = MYCLUB_PACK_OWN_RARITY[type] || "bronze";
  return makeCardForRarity(rarity, spec.role || null);
}

function myClubPackFillerPool(type) {
  const idx = MYCLUB_PACK_LADDER.indexOf(type);
  if (idx < 0) return [];
  const minIdx = idx >= 7 ? (idx - 3) : (idx - 1);
  if (minIdx < 0) return [];
  return MYCLUB_PACK_LADDER.slice(0, minIdx + 1);
}

function myClubPackUnderCard(type) {
  const pool = myClubPackFillerPool(type);
  const openSpec = MYCLUB_PACKS[type];
  const role = openSpec && openSpec.role ? openSpec.role : null;
  const from = (pool && pool.length) ? pool[Math.floor(Math.random() * pool.length)] : type;
  const fromSpec = MYCLUB_PACKS[from];
  if (fromSpec && Array.isArray(fromSpec.odds)) return makeCardForRarity(myClubRollRarity(fromSpec.odds), role) || makeCardForRarity("bronze", role);
  if (fromSpec && fromSpec.tier) return makeCardForRarity(fromSpec.tier, role) || makeCardForRarity("bronze", role);
  return makeCardForRarity("bronze", role);
}

// Direct helper: build a custom user-defined player from explicit stats.
// Overall shown on the card is always calculateOverall(card, role), so it
// is derived from these stats, never guessed. Push the result into
// ownedPool to sign the player. Example:
//   ownedPool.push(playerFromStats("My Striker", "attacker", { pace: 90, shooting: 88, passing: 70, dribbling: 85, defending: 30, physical: 75 }));
function playerFromStats(name, role, stats) {
  const card = makePlayerData(name, stats);
  card.role = role;
  card.tag = "CUSTOM";
  card.variant = "CUSTOM";
  card.pos = myClubPackPos(role);
  card.nation = randNation();
  return card;
}

function myClubPackPos(role) {
  const map = {
    goalkeeper: ["GK"],
    defender: ["RB", "CB", "LB"],
    midfielder: ["CDM", "CM", "CAM"],
    attacker: ["RW", "ST", "LW"]
  };
  const list = map[role] || ["ST"];
  return list[Math.floor(Math.random() * list.length)];
}

function myClubFallbackPos(role) {
  const map = { goalkeeper: "GK", defender: "DF", midfielder: "MF", attacker: "FW" };
  return map[role] || "";
}

function isPackDuplicate(card) {
  return ownedPool.some(p => p.name === card.name && p.tag === card.tag);
}

// ---- Pack-relative market values ----
// Every card remembers which pack it was pulled from and what that pack cost,
// so its market price can be judged against what you paid to get it: the cards
// a pack is best at producing are worth MORE than the pack price on the market,
// while the run-of-the-mill fillers are worth LESS. Bonus MAX / World Cup /
// Road to Glory pull-ups are so rare they are worth vastly more than any pack.

function myClubPackCeiling(spec) {
  if (!spec) return "bronze";
  if (spec.tier) return String(spec.tier).toLowerCase();
  if (Array.isArray(spec.odds)) {
    const rank = { bronze: 1, silver: 2, gold: 3, prospect: 3, special: 4, captain: 4.5, league: 4.5, hero: 5, nationleader: 5.5, icon: 5.5, legend: 5.75, rtg: 6.5, holo: 7, wc: 7.5, max: 8.5 };
    let top = "bronze";
    for (const o of spec.odds) {
      const r = rank[o.r] || 0;
      if (r > (rank[top] || 0)) top = o.r;
    }
    return top;
  }
  return String(spec.tag || "special").toLowerCase();
}

function myClubTagRank(t) {
  const tag = String(t || "").toUpperCase();
  const map = {
    BRONZE: 1, SILVER: 2, GOLD: 3, PROSPECT: 3, MANAGER: 2,
    SPECIAL: 4, CUSTOM: 4, RTG: 6.5,
    CAPTAIN: 4.5, PL: 4.5, LALIGA: 4.5, BUNDESLIGA: 4.5, SERIEA: 4.5, LIGUE1: 4.5, LEAGUE: 4.5,
    HERO: 5, NATIONLEADER: 5.5, ICON: 5.5, LEGEND: 5.75,
    HOLO: 7, WC: 7.5, MAX: 8.5
  };
  return map[tag] || 2;
}

// Market-price multiplier over the pack's price for a pulled card. MAX, WC and
// RTG bonus cards always blow the pack cost out of the water; other top pulls
// (the rarest thing that pack can offer) beat the pack price too; everything
// else comes out well under it.
function myClubPackMarketFactor(card) {
  const t = String(card.tag || "").toUpperCase();
  if (t === "MAX") return 11 + Math.random() * 3;
  if (t === "WC") return 6.5 + Math.random() * 2;
  if (t === "HOLO") return 5.3 + Math.random() * 1.2;
  if (t === "RTG") return 3.75 + Math.random() * 1.5;
  const spec = MYCLUB_PACKS[card.__packType];
  const ceilT = myClubPackCeiling(spec);
  const myR = myClubTagRank(card.tag);
  const ceilR = myClubTagRank(ceilT === "consumable" ? "BRONZE" : ceilT);
  if (myR >= ceilR) {
    return myR >= 5 ? 1.8 + Math.random() * 1.2 : 1.45 + Math.random() * 0.9;
  }
  const gap = Math.max(0, 1 - myR / (ceilR + 0.001));
  return Math.max(0, Math.min(0.7, 0.1 + gap * 0.5 + Math.random() * 0.14));
}

// A card's underlying value - what the market, the daily shop and the fair
// average are all priced against. Kept separate from myClubSellPrice so that
// nerfing what a quick-sell pays out never moves a buy price.
function myClubCardValue(card) {
  const ovr = calculateOverall(card, card.role || "attacker");
  let price = Math.floor(Math.max(0, ovr - 60) * Math.max(0, ovr - 60) * 400);
  if (card.tag === "SPECIAL") price += 180000;
  else if (card.tag === "HERO") price += 330000;
  else if (card.tag === "ICON") price += 680000;
  else if (card.tag === "MAX") price += 1200000;
  else if (card.tag === "LEGEND") price += 2000000;
  else if (card.tag === "PROSPECT") price += 45000;
  else if (card.tag === "RTG") price += 1800000;
  else if (card.tag === "HOLO") price += 2400000;
  else if (card.tag === "WC") price += 3200000;
  const packPrice = typeof card.__packPrice === "number" && card.__packPrice > 0 ? card.__packPrice : 0;
  if (packPrice > 0) {
    price = Math.max(price, Math.round(packPrice * myClubPackMarketFactor(card) * 0.55 / 500) * 500);
  }
  let traitLevels = 0;
  if (card && card.traits) for (const k in card.traits) traitLevels += (card.traits[k] || 0);
  if (traitLevels > 0) price = Math.round(price * (1 + MYCLUB_TRAIT_VALUE_PCT * traitLevels));
  return Math.max(15000, price);
}

// What the Sell button actually pays. Deliberately well under the card's value
// so the market is always the better way to cash a card in.
const MYCLUB_SELL_RATE = 0.7;
function myClubSellPrice(card) {
  return Math.max(15000, Math.round(myClubCardValue(card) * MYCLUB_SELL_RATE / 500) * 500);
}

function getActiveManager() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  if (c && c.manager && MY_CLUB_MANAGERS[c.manager]) return MY_CLUB_MANAGERS[c.manager];
  return null;
}

function managerBuffFor(m, role) {
  if (!m) return 0;
  if (m.group === "all" || m.group === role) return m.value;
  return 0;
}

function managerBuffedPlayer(p, role) {
  const m = getActiveManager();
  if (!m) return p;
  const v = managerBuffFor(m, role);
  if (!v) return p;
  const c = clonePlayer(p);
  c[m.stat] = (typeof c[m.stat] === "number" ? c[m.stat] : 0) + v;
  return c;
}

function managerBuffLabel(m) {
  if (!m) return "";
  const statLabel = { pace: "Pace", shooting: "Shooting", passing: "Passing", dribbling: "Dribbling", defending: "Defending", physical: "Physical" };
  const groupLabel = m.group === "all" ? "Everyone" : m.group.charAt(0).toUpperCase() + m.group.slice(1) + "s";
  return "+" + m.value + " " + (statLabel[m.stat] || m.stat) + " for " + groupLabel;
}

let managerRevealId = null;

function openMyClubManagerPack() {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const c = getMyClubCareer(myClubLeague);
  const spec = MYCLUB_PACKS.manager;
  if (!c || !spec) return;
  const lvlReq = myClubPackLocked(spec);
  if (lvlReq) { myClubLobbyMsg(spec.name + " unlocks at Level " + lvlReq + "."); return; }
  if (playerCoins < spec.price) {
    myClubLobbyMsg("Not enough money (" + formatMoney(spec.price) + " needed). Play matches or win the title.");
    return;
  }
  const owned = Array.isArray(c.managers) ? c.managers : [];
  const unowned = Object.keys(MY_CLUB_MANAGERS).filter(id => owned.indexOf(id) === -1);
  if (!unowned.length) {
    myClubLobbyMsg("You have signed every manager in soccer history.");
    return;
  }
  playerCoins -= spec.price;
  c.coins = playerCoins;
  const id = pickRand(unowned);
  owned.push(id);
  c.managers = owned;
  if (!c.manager) c.manager = id;
  saveClubState();
  saveMyClubData();
  showManagerReveal(id);
  myClubRefreshHeader();
  renderMyClubPacksTab();
  renderMyClubManagersTab();
}

function showManagerReveal(id) {
  const spec = MYCLUB_PACKS.manager;
  if (!spec) return;
  document.getElementById("packModalTitle").textContent = spec.name + " Results";
  const wrap = document.getElementById("packModalCards");
  managerRevealId = id;
  consumableRevealId = null;
  packRevealPhase = "opening";
  wrap.innerHTML = '<div class="packOpenStage" role="button" onclick="fastForwardPackReveal()">' +
    '<div class="packVisual ' + spec.css + '">' +
    '<span class="pvLabel">My Club</span>' +
    '<span class="pvName">' + escapeHtml(spec.name) + '</span>' +
    '<span class="pvTap">TAP TO OPEN</span>' +
    '</div></div>';
  document.getElementById("packModalMsg").textContent = "";
  document.getElementById("packModal").style.display = "flex";
  clearTimeout(packRevealTimer);
}

function managerCardHTML(id) {
  const m = MY_CLUB_MANAGERS[id];
  if (!m) return "";
  return '<div class="lineupCard managerCard tierMax" style="--club:#7a3b92">' +
    '<div class="lcFace"><span class="lcOvr">MG</span><span class="lcPos">MANAGER</span>' +
    '<span class="lcHead"></span><span class="lcShirt">HISTORY</span>' +
    '<div class="lcName">' + escapeHtml(m.name) + '</div></div>' +
    '<div class="lcStats"><div class="managerBuffBar">' + escapeHtml(managerBuffLabel(m)) + '</div></div>' +
    '<div class="lcFooter"><span class="lcDupe">' + escapeHtml(m.nation) + ' · ' + escapeHtml(m.era) + '</span></div>' +
    '</div>';
}

function managerRosterHTML(c) {
  const owned = Array.isArray(c.managers) ? c.managers : [];
  if (!owned.length) {
    return '<p class="managerEmpty">No managers signed yet. Buy a Manager Pack in the Packs tab.</p>' +
      '<div class="myClubActions"><button onclick="myClubShowTab(\'packs\')">Open Manager Packs</button></div>';
  }
  let rows = "";
  for (const id of owned) {
    const m = MY_CLUB_MANAGERS[id];
    if (!m) continue;
    const active = c.manager === id;
    rows += '<div class="managerRow' + (active ? " active" : "") + '" data-nav>' +
      '<div class="mgName">' + escapeHtml(m.name) + '</div>' +
      '<div class="mgSkill">' + escapeHtml(managerBuffLabel(m)) + '</div>' +
      '<button ' + (active ? "disabled " : "") + 'onclick="assignMyClubManager(\'' + id + '\')">' + (active ? "Active" : "Assign") + '</button>' +
      '</div>';
  }
  return '<div class="managerList">' + rows + '</div>';
}

function assignMyClubManager(id) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (!Array.isArray(c.managers) || c.managers.indexOf(id) === -1) return;
  c.manager = id;
  saveMyClubData();
  renderMyClubManagersTab();
  renderMyClubLineupTab();
  myClubLobbyMsg("Manager assigned: " + (MY_CLUB_MANAGERS[id] ? MY_CLUB_MANAGERS[id].name : id));
}

let consumableRevealId = null;

function openMyClubConsumableBox() {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const c = getMyClubCareer(myClubLeague);
  const spec = MYCLUB_PACKS.box;
  if (!c || !spec) return;
  const lvlReq = myClubPackLocked(spec);
  if (lvlReq) { myClubLobbyMsg(spec.name + " unlocks at Level " + lvlReq + "."); return; }
  if (playerCoins < spec.price) {
    myClubLobbyMsg("Not enough money (" + formatMoney(spec.price) + " needed). Play matches or win the title.");
    return;
  }
  playerCoins -= spec.price;
  c.coins = playerCoins;
  if (!Array.isArray(c.consumables)) c.consumables = [];
  const id = myClubRollConsumable();
  c.consumables.push(id);
  saveClubState();
  saveMyClubData();
  showConsumableReveal(id);
  myClubRefreshHeader();
  renderMyClubPacksTab();
  renderMyClubClubTab();
}

function showConsumableReveal(id) {
  const spec = MYCLUB_PACKS.box;
  if (!spec) return;
  document.getElementById("packModalTitle").textContent = spec.name + " Results";
  const wrap = document.getElementById("packModalCards");
  consumableRevealId = id;
  managerRevealId = null;
  packRevealPhase = "opening";
  wrap.innerHTML = '<div class="packOpenStage" role="button" onclick="fastForwardPackReveal()">' +
    '<div class="packVisual ' + spec.css + '">' +
    '<span class="pvLabel">My Club</span>' +
    '<span class="pvName">' + escapeHtml(spec.name) + '</span>' +
    '<span class="pvTap">TAP TO OPEN</span>' +
    '</div></div>';
  document.getElementById("packModalMsg").textContent = "";
  document.getElementById("packModal").style.display = "flex";
  clearTimeout(packRevealTimer);
}

function consumableCardHTML(id) {
  const con = MY_CLUB_CONSUMABLES[id];
  if (!con) return "";
  const tier = MY_CLUB_CONSUMABLE_TIER[con.rarity] || "tierSilver";
  return '<div class="lineupCard managerCard conCard ' + tier + '" style="--club:#168cff">' +
    '<div class="lcFace"><span class="lcOvr">CV</span><span class="lcPos">ITEM</span>' +
    '<img class="lcConArt" src="' + consumableArt(con) + '" alt="" />' +
    '<span class="lcHead"></span><span class="lcShirt">' + escapeHtml(con.rarity) + '</span>' +
    '<div class="lcName">' + escapeHtml(con.name) + '</div></div>' +
    '<div class="lcStats"><div class="managerBuffBar">' + escapeHtml(consumableLabel(con)) + '</div></div>' +
    '<div class="lcFooter"><span class="lcDupe">Lasts ' + MY_CLUB_BOOST_MATCHES + ' matches</span></div>' +
    '</div>';
}

function playerBoostList(p) {
  if (!p) return [];
  if (Array.isArray(p.boosts)) return p.boosts.filter(b => b && typeof b.value === "number" && b.matchesLeft > 0);
  if (p.boost && typeof p.boost.value === "number" && p.boost.matchesLeft > 0) return [p.boost];
  return [];
}

function boostBadgeText(p) {
  const b = playerBoostList(p);
  if (!b.length) return "";
  if (b.length === 1) return "BOOST +" + b[0].value;
  return "BOOST \u00d7" + b.length;
}

function boostListLabel(p) {
  return playerBoostList(p).map(b =>
    "+" + b.value + " " + (b.stat === "all" ? "All Stats" : (MY_CLUB_STAT_LABELS[b.stat] || b.stat)) + " &middot; " + b.matchesLeft + " match" + (b.matchesLeft === 1 ? "" : "es") + " left"
  ).join(", ");
}

// Combine recipes into a rarer consumable (1 of each Common serum -> an
// All-Rounder Elixir; 3 All-Rounder Elixirs -> a Total Football Elixir).
function myClubRecipeReady(r) {
  const c = getMyClubCareer(myClubLeague);
  if (!r || !Array.isArray(r.uses)) return false;
  if (!c || !Array.isArray(c.consumables)) return false;
  for (const u of r.uses) {
    let have = 0;
    for (const x of c.consumables) if (x === u[0]) have++;
    if (have < u[1]) return false;
  }
  return true;
}

function myClubCombineItems(rk) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) { myClubLobbyMsg("Join or create a My Club career first."); return; }
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const r = MY_CLUB_COMBINE_RECIPES[rk];
  if (!r) return;
  if (!myClubRecipeReady(r)) {
    myClubLobbyMsg("You don't have the required items to combine.");
    return;
  }
  if (!Array.isArray(c.consumables)) c.consumables = [];
  for (const u of r.uses) {
    for (let i = 0; i < u[1]; i++) {
      const idx = c.consumables.indexOf(u[0]);
      if (idx !== -1) c.consumables.splice(idx, 1);
    }
  }
  c.consumables.push(r.out);
  saveClubState();
  saveMyClubData();
  const con = MY_CLUB_CONSUMABLES[r.out];
  myClubRefreshHeader();
  renderMyClubLineupTab();
  const msg = document.getElementById("lineupMsg");
  if (msg) msg.textContent = "Combined: " + (con ? con.name : "new item") + " added to your inventory.";
}

function consumeCoreApply(id, player) {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !player) return "";
  const con = MY_CLUB_CONSUMABLES[id];
  if (!con) return "";
  const list = Array.isArray(c.consumables) ? c.consumables.slice() : [];
  const i = list.indexOf(id);
  if (i === -1) { myClubLobbyMsg("You don't have a " + con.name + "."); return ""; }
  const boosts = playerBoostList(player);
  const hasAll = boosts.some(b => b.stat === "all");
  const blocked = con.stat === "all"
    ? boosts.length > 0
    : (hasAll || boosts.some(b => b.stat === con.stat));
  if (blocked) {
    const msg = con.stat === "all"
      ? player.name + " already has a boost active, so an All Stats item can't stack on top. Pick a different player."
      : (hasAll
          ? player.name + " is already boosted on every stat by an All Stats item. Pick a different stat."
          : player.name + " is already boosted on " + (MY_CLUB_STAT_LABELS[con.stat] || con.stat) + ". Pick a different stat.");
    myClubLobbyMsg(msg);
    return msg;
  }
  list.splice(i, 1);
  c.consumables = list;
  player.boosts = boosts.concat([{ stat: con.stat, value: con.value, matchesLeft: MY_CLUB_BOOST_MATCHES }]);
  delete player.boost;
  saveClubState();
  saveMyClubData();
  renderMyClubLineupTab();
  myClubRefreshHeader();
  myClubLobbyMsg(con.name + " applied to " + player.name + " (+" + con.value + " " + (con.stat === "all" ? "all stats" : MY_CLUB_STAT_LABELS[con.stat] || con.stat) + " for " + MY_CLUB_BOOST_MATCHES + " matches).");
  return "";
}

function buffedPlayerView(p, role) {
  if (!p) return p;
  let v = managerBuffedPlayer(p, role);
  for (const b of playerBoostList(p)) v = boostClone(v, b);
  const oopFactor = myClubOopFactor(p, role);
  if (oopFactor !== 1) {
    if (v === p) v = clonePlayer(p);
    if (v.pace != null) v.pace = v.pace * oopFactor;
    if (v.shooting != null) v.shooting = v.shooting * oopFactor;
    if (v.passing != null) v.passing = v.passing * oopFactor;
    if (v.dribbling != null) v.dribbling = v.dribbling * oopFactor;
    if (v.defending != null) v.defending = v.defending * oopFactor;
    if (v.physical != null) v.physical = v.physical * oopFactor;
  }
  return v;
}

function boostClone(p, boost) {
  const c = clonePlayer(p);
  if (boost.stat === "all") {
    c.pace = (c.pace == null ? 0 : c.pace) + boost.value;
    c.shooting = (c.shooting == null ? 0 : c.shooting) + boost.value;
    c.passing = (c.passing == null ? 0 : c.passing) + boost.value;
    c.dribbling = (c.dribbling == null ? 0 : c.dribbling) + boost.value;
    c.defending = (c.defending == null ? 0 : c.defending) + boost.value;
    c.physical = (c.physical == null ? 0 : c.physical) + boost.value;
  } else {
    c[boost.stat] = (c[boost.stat] == null ? 0 : c[boost.stat]) + boost.value;
  }
  return c;
}

function myClubPackLocked(spec) {
  if (!spec || typeof spec.minLevel !== "number") return 0;
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const lvl = c && typeof c.level === "number" ? c.level : 1;
  return spec.minLevel > lvl ? spec.minLevel : 0;
}

// Builds a pack's cards, drops them straight into the club pool and returns
// them. Shared by the paid Pack Shop and by free reward packs (SBCs), which
// pass a price of 0.
function myClubBuildPack(type, price) {
  const spec = MYCLUB_PACKS[type];
  const cards = [];
  if (!spec) return cards;
  if (MYCLUB_PACK_LADDER.indexOf(type) !== -1) {
    const gua = myClubPackGuarantee(type);
    if (gua) {
      gua.__packType = type;
      gua.__packPrice = price;
      gua.__cid = "mc" + (++myClubCardSeq);
      while (ownedPool.some(p => p.__cid === gua.__cid)) gua.__cid = "mc" + (++myClubCardSeq);
      ownedPool.push(gua);
      cards.push(gua);
    }
    for (let i = 1; i < MYCLUB_PACK_OPEN_CARDS; i++) {
      const card = myClubPackUnderCard(type);
      if (!card) continue;
      card.__packType = type;
      card.__packPrice = price;
      card.__cid = "mc" + (++myClubCardSeq);
      while (ownedPool.some(p => p.__cid === card.__cid)) card.__cid = "mc" + (++myClubCardSeq);
      ownedPool.push(card);
      cards.push(card);
    }
  } else {
    for (let i = 0; i < spec.count; i++) {
      const card = makePackedCard(type);
      card.__packType = type;
      card.__packPrice = price;
      card.__cid = "mc" + (++myClubCardSeq);
      while (ownedPool.some(p => p.__cid === card.__cid)) card.__cid = "mc" + (++myClubCardSeq);
      ownedPool.push(card);
      cards.push(card);
    }
  }
  const bonus = makeMyClubBonusCard(spec);
  if (bonus) {
    bonus.__packType = type;
    bonus.__packPrice = price;
    bonus.__cid = "mc" + (++myClubCardSeq);
    while (ownedPool.some(p => p.__cid === bonus.__cid)) bonus.__cid = "mc" + (++myClubCardSeq);
    ownedPool.push(bonus);
    cards.push(bonus);
  }
  return cards;
}

function openMyClubPack(type, priceOverride) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const spec = MYCLUB_PACKS[type];
  if (!spec) return;
  const lvlReq = myClubPackLocked(spec);
  if (lvlReq) { myClubLobbyMsg(spec.name + " unlocks at Level " + lvlReq + "."); return; }
  if (type === "manager") { openMyClubManagerPack(); return; }
  if (type === "box") { openMyClubConsumableBox(); return; }
  const price = typeof priceOverride === "number" && priceOverride > 0 ? priceOverride : spec.price;
  if (playerCoins < price) {
    myClubLobbyMsg("Not enough money (" + formatMoney(price) + " needed). Play matches or win the title.");
    return;
  }
  playerCoins -= price;
  const c = getMyClubCareer(myClubLeague);
  if (c) { c.coins = playerCoins; myClubStatAdd(c, "packs", 1); }
  const cards = myClubBuildPack(type, price);
  const filtered = applyAutoDeleteFilter(cards);
  saveClubState();
  saveMyClubData();
  showPackReveal(type, filtered.kept, 0);
  if (filtered.autoDel > 0) {
    document.getElementById("packModalMsg").textContent =
      filtered.autoDel + " card(s) below OVR " + SETTINGS.autoDeleteOvr + " were auto-deleted.";
  }
  myClubRefreshHeader();
  renderMyClubPacksTab();
}

/* ---------- 3D pack opener (see window.Pack3D) ----------
   One walkout per pack: the single best card at PACK3D_WALKOUT_OVR or above
   plays a full walkout scene. A pack with no such card skips straight to the
   results grid. If the 3D module never loaded we silently fall through to the
   original 2D reveal below - nothing about packs, odds or prices changes. */
const PACK3D_WALKOUT_OVR = 86;
const PACK3D_KITS = ["emerald", "royal", "crimson", "white", "gold"];
const PACK3D_SKINS = ["#b97850", "#8d5a3c", "#6b4226", "#d39169", "#a9714b", "#f0c9a3", "#5c3a24", "#c98d5f"];
const PACK3D_HAIR = ["short", "curly", "buzz", "none"];
const PACK3D_TIER_COLOR = {
  tierBronze: "#b08d57", tierSilver: "#c3ccd4", tierGold: "#e6bb4a", tierSpecial: "#9b7bff",
  tierProspect: "#6fd3a0", tierCustom: "#7fd8ff", tierCaptain: "#5fa8ff", tierPL: "#ff5fa8",
  tierLaLiga: "#ff6b5f", tierBundesliga: "#ff4d4d", tierSerieA: "#4d7cff", tierLigue1: "#7b5cff",
  tierHero: "#c06bff", tierNationLeader: "#ffd76a", tierLegend: "#ffb84a", tierIcon: "#f0c24b",
  tierRTG: "#5fe0d0", tierHolo: "#7fe8ff", tierWC: "#ffe14d", tierMax: "#ff9de2"
};
const PACK3D_PACK_COLOR = {
  bronze: "#b08d57", silver: "#c3ccd4", gold: "#e6bb4a", special: "#9b7bff",
  prospect: "#6fd3a0", captain: "#5fa8ff", league: "#1765d1", pl: "#ff5fa8",
  legend: "#ffb84a", hero: "#c06bff", nationleader: "#ffd76a", icon: "#f0c24b",
  gamelegend: "#c06bff", rtg: "#5fe0d0", holo: "#7fe8ff", wc: "#ffe14d", max: "#ff9de2"
};
const PACK3D_FLAG_ISO = {
  Brazil: "BR", Argentina: "AR", France: "FR", Germany: "DE", Italy: "IT", Spain: "ES",
  England: "GB", Netherlands: "NL", Portugal: "PT", Belgium: "BE", Croatia: "HR",
  Denmark: "DK", Uruguay: "UY", USA: "US", Mexico: "MX", Japan: "JP", Nigeria: "NG",
  Morocco: "MA", Senegal: "SN", Egypt: "EG", Ghana: "GH", Norway: "NO", Sweden: "SE",
  Poland: "PL", Austria: "AT", Switzerland: "CH", Ukraine: "UA", Turkey: "TR",
  Serbia: "RS", Scotland: "GB", Wales: "GB", Chile: "CL", Colombia: "CO", Korea: "KR",
  China: "CN", India: "IN", Australia: "AU", Canada: "CA", Iceland: "IS", Greece: "GR"
};
let pack3dRun = 0;
let packTailWalkedCids = [];

function pack3dFlag(nation) {
  const key = String(nation == null ? "" : nation).trim();
  let iso = PACK3D_FLAG_ISO[key];
  if (!iso) {
    for (const k in PACK3D_FLAG_ISO) {
      if (k.toUpperCase() === key.toUpperCase()) { iso = PACK3D_FLAG_ISO[k]; break; }
    }
  }
  if (!iso || iso.length < 2) return String.fromCodePoint(0x1F30D);
  const A = 0x1F1E6;
  return String.fromCodePoint(A + iso.charCodeAt(0) - 65, A + iso.charCodeAt(1) - 65);
}
function pack3dOvr(c) { return Math.round(calculateOverall(c, c && c.role)); }
function pack3dReady() {
  return typeof window !== "undefined" && !!window.Pack3D && window.Pack3D.ok === true;
}
function pack3dLook(p) {
  let s = pack3dHash(((p && p.name) || "") + "|" + ((p && p.nation) || "") + "|" +
    ((p && p.tag) || "") + "|" + ((p && p.variant) || ""));
  function n(c) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return c ? s % c : 0; }
  return {
    kit: PACK3D_KITS[n(PACK3D_KITS.length)],
    skin: PACK3D_SKINS[n(PACK3D_SKINS.length)],
    hair: PACK3D_HAIR[n(PACK3D_HAIR.length)],
    number: n(28) + 1
  };
}
function pack3dHash(str) {
  let h = 2166136261;
  const s = String(str == null ? "" : str);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function pack3dTierColor(c, ovr) {
  return PACK3D_TIER_COLOR[cardTierClass(c, ovr)] || "#69e0b2";
}
function pack3dPackColor(type) {
  return PACK3D_PACK_COLOR[String(type || "").toLowerCase()] || "#168cff";
}
function pack3dWalkoutCards(cards) {
  const best = (cards || []).filter(function (c) {
    return c && pack3dOvr(c) >= PACK3D_WALKOUT_OVR;
  }).sort(function (a, b) { return pack3dOvr(b) - pack3dOvr(a); })[0];
  return best ? [best] : [];
}
function pack3dWalkoutData(card, idx, total) {
  const ovr = pack3dOvr(card);
  const role = card.role || "attacker";
  const posLabel = card.pos || myClubFallbackPos(role) || "ST";
  const nation = card.nation || "International";
  const look = pack3dLook(card);
  const color = pack3dTierColor(card, ovr);
  const typeLabel = cardTypeLabel(card);
  const stats = [["PAC", card.pace], ["SHO", card.shooting], ["PAS", card.passing],
    ["DRI", card.dribbling], ["DEF", card.defending], ["PHY", card.physical]]
    .map(function (s) { return "<span>" + s[0] + " <b>" + (s[1] == null ? "-" : s[1]) + "</b></span>"; }).join("");
  // Players who do not belong to a club (Icons and the like) walk out as
  // "International" instead of borrowing the My Club badge name.
  const iconCard = String(card.tag || "").toUpperCase() === "ICON";
  const clubName = card.club || (iconCard ? "International" : (selectedTeam || "International"));
  return {
    kit: look.kit, skin: look.skin, hair: look.hair, number: look.number,
    cardHTML: packCardHTML(card, 0),
    tag: String(typeLabel).toUpperCase(),
    name: card.name || "",
    nation: nation,
    typeLabel: typeLabel,
    posLabel: posLabel,
    typeColor: color,
    club: clubName,
    meta: "<b>" + escapeHtml(typeLabel.toUpperCase()) + "</b>" +
      (total > 1 ? " &nbsp;&middot;&nbsp; <b>PULL</b> " + idx + "/" + total : ""),
    stats: stats,
    panels: [
      { kicker: "NATION", glyph: pack3dFlag(nation), value: nation },
      { kicker: "RATING", crest: true, glyph: "?", value: typeLabel, color: color },
      { kicker: "POSITION", crest: true, glyph: escapeHtml(posLabel).slice(0, 3).toUpperCase(), value: posLabel, color: color }
    ]
  };
}
function pack3dFallbackReveal() {
  const wrap = document.getElementById("packModalCards");
  packRevealPhase = "opening";
  wrap.innerHTML = '<div class="packModalEmpty">3D unavailable - showing results.</div>';
  packRevealTimer = setTimeout(function () {
    if (packRevealPhase === "opening") { packRevealPhase = "cards"; renderPackPlayerCards(); }
  }, 260);
}
function startPack3DReveal(type, cards) {
  const wrap = document.getElementById("packModalCards");
  const spec = MYCLUB_PACKS[type] || {};
  const run = ++pack3dRun;
  const P = window.Pack3D;
  const walkouts = pack3dWalkoutCards(cards);
  packTailWalkedCids = walkouts.map(function (c) { return c.__cid; });
  const mega = (cards || []).some(function (c) { return pack3dOvr(c) >= 95; });
  packRevealPhase = "threeD";
  wrap.innerHTML = "";
  if (!cards || !cards.length) { packRevealPhase = "cards"; renderPackPlayerCards(); return; }

  function step(i) {
    if (run !== pack3dRun) return Promise.resolve(false);
    if (i >= walkouts.length) return Promise.resolve(true);
    return P.walkout(pack3dWalkoutData(walkouts[i], i + 1, walkouts.length))
      .then(function () { return step(i + 1); });
  }

  P.openPack({ color: mega ? "#f0c24b" : pack3dPackColor(type), name: spec.name || "PACK" })
    .then(function () { return step(0); })
    .then(function (ok) {
      if (run !== pack3dRun || ok === false) return;
      packRevealPhase = "cards";
      if (walkouts.length) { renderPack3DTail(); return; }
      P.hide();
      renderPackPlayerCards();
    })
    .catch(function () {
      if (run !== pack3dRun) return;
      try { if (P && P.hide) P.hide(); } catch (e) {}
      pack3dFallbackReveal();
    });
}

function showPackReveal(type, cards, refund, titleLabel) {
  const spec = MYCLUB_PACKS[type];
  managerRevealId = null;
  consumableRevealId = null;
  packTailWalkedCids = [];
  document.getElementById("packModalTitle").textContent = typeof titleLabel === "string" ? titleLabel : spec.name + " Results";
  document.getElementById("packModalTitle").classList.remove("megaTitle");
  const wrap = document.getElementById("packModalCards");
  packRevealCards = cards;
  document.getElementById("packModalMsg").textContent = refund > 0 ? "Duplicate player(s) auto-sold: +" + formatMoney(refund) : "";
  document.getElementById("packModal").style.display = "flex";
  clearTimeout(packRevealTimer);
  if (pack3dReady()) { startPack3DReveal(type, cards); return; }
  packRevealPhase = "opening";
  const hasMega = cards.some(function (c) { return calculateOverall(c, c.role) >= 95; });
  if (pack3dWalkoutCards(cards).length) {
    const msgEl = document.getElementById("packModalMsg");
    const base = refund > 0 ? "Duplicate player(s) auto-sold: +" + formatMoney(refund) + " " : "";
    msgEl.textContent = base + "This card rated 86+ would normally walk out, but your browser is missing WebGL or the 3D player module - showing the results instead.";
  }
  wrap.innerHTML = '<div class="packOpenStage" role="button" onclick="fastForwardPackReveal()">' +
    '<div class="packVisual ' + spec.css + (hasMega ? " megaOpen" : "") + '">' +
    '<span class="pvLabel">My Club</span>' +
    '<span class="pvName">' + escapeHtml(spec.name) + '</span>' +
    '<span class="pvTap">TAP TO OPEN</span>' +
    '</div></div>';
}

function cardTypeLabel(card) {
  if (card) {
    if (card.variant) {
      const v = String(card.variant).trim();
      if (v) {
        if (v === "Bronze" || v === "Silver" || v === "Gold") return "Standard " + v;
        const lk = v.toLowerCase();
        if (MYCLUB_RARITY_LABELS[lk]) return MYCLUB_RARITY_LABELS[lk];
        return v;
      }
    }
    if (card.tag) {
      const t = String(card.tag).toLowerCase();
      if (MYCLUB_RARITY_LABELS[t]) return MYCLUB_RARITY_LABELS[t];
      return card.tag;
    }
  }
  return lineupTier(calculateOverall(card, card.role || "attacker")) + " Standard";
}

function cardTierClass(card, ovr) {
  if (card && card.tag) {
    const t = String(card.tag).toUpperCase();
    if (t === "BRONZE") return "tierBronze";
    if (t === "SILVER") return "tierSilver";
    if (t === "GOLD") return "tierGold";
    if (t === "LEGEND") return "tierLegend";
    if (t === "HERO") return "tierHero";
    if (t === "MAX") return "tierMax";
    if (t === "ICON") return "tierIcon";
    if (t === "SPECIAL") return "tierSpecial";
    if (t === "PROSPECT") return "tierProspect";
    if (t === "CUSTOM") return "tierCustom";
    if (t === "CAPTAIN") return "tierCaptain";
    if (t === "PL") return "tierPL";
    if (t === "LALIGA") return "tierLaLiga";
    if (t === "BUNDESLIGA") return "tierBundesliga";
    if (t === "SERIEA") return "tierSerieA";
    if (t === "LIGUE1") return "tierLigue1";
    if (t === "NATIONLEADER") return "tierNationLeader";
    if (t === "RTG") return "tierRTG";
    if (t === "HOLO") return "tierHolo";
    if (t === "WC") return "tierWC";
  }
  return "tier" + lineupTier(ovr);
}

function myClubDupKey(p) {
  return (p.name || "").toLowerCase() + "|" + (p.tag || "");
}

function myClubDupCount(card) {
  const k = myClubDupKey(card);
  let n = 0;
  for (const p of ownedPool) if (myClubDupKey(p) === k) n++;
  return n;
}

function lcInfoBtn(invoke) {
  return '<button class="lcInfoBtn" type="button" title="Card details" ' +
    'onclick="event.stopPropagation(); ' + invoke + '" ondragstart="event.stopPropagation(); event.preventDefault();">?</button>';
}

function lcDupeStrip(card) {
  const n = myClubDupCount(card);
  return n >= 2 ? '<span class="lcDupe">DUPE ×' + n + '</span>' : "";
}

function packCardHTML(card, i) {
  const ovr = calculateOverall(card, card.role);
  const clubColor = teamColors[selectedTeam] || "#168cff";
  return '<div class="lineupCard lineupReveal fcCard ' + (ovr >= 95 ? "megaCard " : "") + '" style="--club:' + clubColor + ';animation-delay:' + (i * 260 + 80) + 'ms">' +
    fcCardInner(card, { ovr: ovr, clubColor: clubColor, clubName: selectedTeam }) +
    lcInfoBtn('myClubCardInfoByCid(\'' + card.__cid + '\')') + lcDupeStrip(card) +
    '</div>';
}

function packFinishReveal() {
  if (packRevealPhase === "cards") return;
  packRevealPhase = "cards";
  const wrap = document.getElementById("packModalCards");
  if (managerRevealId) {
    wrap.innerHTML = '<div class="packRevealWrap">' + managerCardHTML(managerRevealId) + '</div>';
    packFocusContinue();
    return;
  }
  if (consumableRevealId) {
    wrap.innerHTML = '<div class="packRevealWrap">' + consumableCardHTML(consumableRevealId) + '</div>';
    packFocusContinue();
    return;
  }
  renderPackPlayerCards();
}

// Land the pad's focus ring on the pack's Continue button once the reveal has
// finished, so a controller player can dismiss the results with one press
// instead of having to walk the ring off the first card's info button.
function packFocusContinue() {
  if (typeof uiFocusEl !== "function") return;
  const btn = document.querySelector("#packModal .modalContent > button");
  if (btn) uiFocusEl(btn);
}

function renderPackPlayerCards() {
  const wrap = document.getElementById("packModalCards");
  if (!packRevealCards.length) {
    wrap.innerHTML = '<div class="packModalEmpty">No cards kept - all were auto-filtered.</div>';
    packFocusContinue();
    return;
  }
  let html = '<div class="packRevealWrap">';
  for (let i = 0; i < packRevealCards.length; i++) html += packCardHTML(packRevealCards[i], i);
  html += '</div>';
  wrap.innerHTML = html;
  const hasMega = packRevealCards.some(function (c) { return calculateOverall(c, c.role) >= 95; });
  if (hasMega) {
    const title = document.getElementById("packModalTitle");
    if (title) {
      const top = packRevealCards.slice().sort(function (a, b) { return calculateOverall(b, b.role) - calculateOverall(a, a.role); })[0];
      title.textContent = "MEGA PULL - " + top.name.toUpperCase() + " " + calculateOverall(top, top.role);
      title.classList.add("megaTitle");
    }
    wrap.insertAdjacentHTML("afterbegin", '<div class="packBurst"></div>');
  }
  packFocusContinue();
}

function renderPack3DTail() {
  const tray = document.querySelector(".pkTray");
  if (!tray) { if (window.Pack3D) window.Pack3D.hide(); renderPackPlayerCards(); return; }
  const list = packRevealCards.filter(function (c) { return packTailWalkedCids.indexOf(c.__cid) === -1; });
  if (!list.length) {
    tray.innerHTML = '<div class="pkTrayEmpty">That was the whole pack - nothing else was in it.</div>';
  } else {
    let html = "";
    for (let i = 0; i < list.length; i++) html += packCardHTML(list[i], i);
    tray.innerHTML = html;
  }
  tray.classList.add("on");
}

function fastForwardPackReveal() {
  if (packRevealPhase === "opening") {
    clearTimeout(packRevealTimer);
    packFinishReveal();
  }
}

function myClubCardInfo(player, slotInfo) {
  if (!player) return;
  const role = player.role || "attacker";
  const natPos = player.pos || myClubFallbackPos(role) || "ST";
  const oopActive = !!(slotInfo && myClubOopFactor(player, slotInfo.role) !== 1);
  const view = oopActive ? buffedPlayerView(clonePlayer(player), slotInfo.role) : player;
  const ovr = Math.round(calculateOverall(view, oopActive ? slotInfo.role : role));
  const posLabel = slotInfo ? (slotInfo.label || natPos) : natPos;
  const type = cardTypeLabel(player);
  const badge = document.getElementById("cardInfoBadge");
  badge.className = "cardInfoBadge " + cardTierClass(player, ovr);
  badge.textContent = type;
  document.getElementById("cardInfoName").textContent = player.name;
  let traitMetaHtml = "";
  if (player.traits) {
    const bits = [];
    for (const k in player.traits) { if (player.traits[k] > 0) bits.push('<span class="traitBadge">' + escapeHtml(myClubTraitLabel(k, player.traits[k])) + '</span>'); }
    if (bits.length) traitMetaHtml = '<span class="ms"><b>TRAITS</b> ' + bits.join(" ") + '</span>';
  }
  document.getElementById("cardInfoMeta").innerHTML =
    '<span><b>POS</b> ' + escapeHtml(posLabel) + '</span>' +
    '<span class="ms"><b>OVR</b> ' + ovr + '</span>' +
    '<span class="ms"><b>POT</b> ' + myClubPlayerPotential(player) + '</span>' +
    '<span class="ms"><b>NATION</b> ' + escapeHtml(player.nation || "\u2014") + '</span>' +
    (playerBoostList(player).length
      ? '<span class="ms"><b>BOOST</b> ' + boostListLabel(player) + '</span>'
      : "") +
    traitMetaHtml;
  const stats = [
    ["PAC", player.pace], ["SHO", player.shooting], ["PAS", player.passing],
    ["DRI", player.dribbling], ["DEF", player.defending], ["PHY", player.physical]
  ];
  document.getElementById("cardInfoStats").innerHTML = stats.map(s =>
    '<div class="cardInfoStat"><span>' + s[0] + '</span>' +
    '<div class="cardInfoBar"><i style="width:' + Math.min(100, Math.round((s[1] == null ? 0 : s[1]) / 99 * 100)) + '%"></i></div>' +
    '<b>' + (s[1] == null ? "\u2013" : s[1]) + '</b></div>').join("");
  const oopEl = document.getElementById("cardInfoOop");
  if (oopEl) {
    if (oopActive) {
      oopEl.innerHTML = "OUT OF POSITION \u2014 playing as <b>" + escapeHtml(posLabel) + "</b>. Natural " + escapeHtml(natPos) + " \u00b7 stats reduced 3%.";
      oopEl.style.display = "block";
    } else {
      oopEl.innerHTML = "";
      oopEl.style.display = "none";
    }
  }
  const statCareer = (currentMode === "myclub" && myClubLeague) ? getMyClubCareer(myClubLeague) : null;
  const st = (statCareer && player.__cid) ? myClubPlayerStat(statCareer, player.__cid) : null;
  const pstatsEl = document.getElementById("cardInfoPlayerStats");
  if (pstatsEl) {
    if (st) {
      const cell = (label, value) =>
        '<div class="cardInfoSeasonCell"><b>' + value + '</b><span>' + label + '</span></div>';
      const isGK = player.role === "goalkeeper";
      pstatsEl.innerHTML =
        '<div class="cardInfoSeasonTitle">This Season \u2014 Season ' + escapeHtml(String(statCareer.season)) + '</div>' +
        '<div class="cardInfoSeasonGrid' + (isGK ? ' tri' : '') + '">' +
          (isGK ? cell("Saves", st.ssv) + cell("Blocks", st.sbk) + cell("Conceded", st.sgc) : cell("Goals", st.sg) + cell("Assists", st.sa)) +
        '</div>' +
        '<div class="cardInfoSeasonTitle">Career at ' + escapeHtml(statCareer.clubName || "the club") + '</div>' +
        '<div class="cardInfoSeasonGrid wide' + (isGK ? ' gk' : '') + '">' +
          (isGK ? cell("Saves", st.sv) + cell("Blocks", st.bk) + cell("Conceded", st.gc) : cell("Goals", st.g) + cell("Assists", st.a)) +
          cell("Trophies", st.t) + cell("Seasons", myClubPlayerSeasons(statCareer, st)) +
        '</div>';
      pstatsEl.style.display = "block";
    } else {
      pstatsEl.innerHTML = "";
      pstatsEl.style.display = "none";
    }
  }
  const awardsEl = document.getElementById("cardInfoPlayerAwards");
  if (awardsEl) {
    const wins = statCareer ? myClubAwardsForPlayer(statCareer, player.name) : [];
    if (wins.length) {
      const rows = wins.map(a =>
        '<div class="cardInfoAwardRow">' +
          '<span class="cardInfoAwardMedal"></span>' +
          '<span class="cardInfoAwardName">' + escapeHtml(myClubAwardLabel(a.type)) + '</span>' +
          '<span class="cardInfoAwardMeta">' + escapeHtml(a.competition || "") + ' \u00b7 Season ' + a.season + '</span>' +
          '<span class="cardInfoAwardStat">' + a.goals + 'G ' + a.assists + 'A</span>' +
        '</div>').join("");
      awardsEl.innerHTML = '<div class="cardInfoSeasonTitle">Individual Awards</div>' + rows;
      awardsEl.style.display = "block";
    } else {
      awardsEl.innerHTML = "";
      awardsEl.style.display = "none";
    }
  }
  document.getElementById("cardInfoModal").style.display = "flex";
}

function myClubCardInfoByCid(cid) {
  const p = ownedPool.find(x => x.__cid === cid);
  if (p) myClubCardInfo(p);
}

function myClubCardInfoRoster(slotKey) {
  const roster = TEAM_ROSTERS[selectedTeam];
  if (roster) {
    const slot = (currentMode === "myclub") ? (myClubSlotList().find(s => s.key === slotKey) || null) : null;
    const pd = getSlotData(roster, slotKey);
    if (pd) myClubCardInfo(pd, slot || undefined);
  }
}

function closeCardInfoModal() {
  document.getElementById("cardInfoModal").style.display = "none";
}

function closePackModal() {
  pack3dRun++;
  if (pack3dReady()) { try { window.Pack3D.hide(); } catch (e) {} }
  clearTimeout(packRevealTimer);
  managerRevealId = null;
  consumableRevealId = null;
  document.getElementById("packModal").style.display = "none";
}

function myClubLobbyMsg(msg) {
  const ids = ["packHint", "lineupMsg", "myClubFriendlyMsg"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
}

function myClubSimSeasonUsable(c) {
  return !!(c && !myClubAtSeasonEnd(c));
}

// The day-by-day controls only step aside while a European tie is actually
// waiting to be played. Skipping the whole season in one click always works, so
// only the two single-day controls hide.
function myClubSyncSimRowParts(euroPhase) {
  const inp = document.getElementById("myClubSimInput");
  const go = document.getElementById("myClubSimGo");
  const seasonBtn = document.getElementById("myClubSimSeasonBtn");
  const c = getMyClubCareer(myClubLeague);
  if (inp) inp.style.display = euroPhase ? "none" : "";
  if (go) go.style.display = euroPhase ? "none" : "";
  if (seasonBtn) {
    const usable = myClubSimSeasonUsable(c);
    seasonBtn.style.display = usable ? "" : "none";
    seasonBtn.disabled = !usable;
  }
}

function renderMyClubWeekSchedule() {
  const el = document.getElementById("myClubWeekSchedule");
  if (!el) return;
  const c = getMyClubCareer(myClubLeague);
  const simRow = document.getElementById("myClubSimRow");
  const simMine = document.getElementById("myClubSimMine");
  const euroPhase = myClubEuroMatchReady(c);
  if (!c || euroPhase) {
    el.style.display = "none";
    if (simRow) simRow.style.display = myClubSimSeasonUsable(c) ? "" : "none";
    if (simMine) simMine.style.display = "none";
    myClubSyncSimRowParts(euroPhase);
    return;
  }
  el.style.display = "";
  if (simRow) simRow.style.display = "";
  if (simMine) simMine.style.display = "";
  myClubSyncSimRowParts(false);
  const day = Math.max(1, myClubCurrentDay(c));
  const fromDay = 7 * Math.floor((day - 1) / 7) + 1;
  const cal = buildMyClubCalendar(c);
  let h = '<div class="wkTitle">THIS WEEK \u00b7 D' + fromDay + '\u2013D' + (fromDay + 6) + '</div>';
  for (let d = fromDay; d < fromDay + 7; d++) {
    const evs = cal.filter(e => e.day === d);
    const mine = evs.filter(e => e.home === c.clubName || e.away === c.clubName);
    const ai = evs.filter(e => e.home !== c.clubName && e.away !== c.clubName);
    const isCur = d === day;
    h += '<div class="wkRow' + (isCur ? " now" : "") + '"><span class="wkDay">D' + d + '</span>';
    if (!evs.length) {
      h += '<span class="wkRest">rest day</span>';
    } else {
      h += '<span class="wkEvs">';
      for (const m of mine) {
        const icon = m.type === "super" ? "T" : (m.type === "cup" ? "C" : (m.type === "cl" ? myClubEuroLetter(m.comp) : "L"));
        const opp = m.home === c.clubName ? m.away : m.home;
        const short = m.played ? (m.score != null ? m.score + "-" + (m.score2 != null ? m.score2 : "?") : "p")
          : "vs " + myClubShortOpponent(opp);
        h += '<span class="wkChip ' + m.type + ' mine' + (m.played ? " done" : "") + '" title="' + escapeHtml(m.label + (m.round && m.type === "league" ? " - " + m.round : "") + " - " + m.home + " " + (m.played ? m.score + "-" + m.score2 : "vs") + " " + m.away) + '"><i>' + icon + '</i>' + short + (isCur && !m.played ? ' <b class="wkPlayTag">PLAY</b>' : '') + '</span>';
      }
      const aiGroups = {};
      for (const e of ai) {
        const key = e.type + (e.played ? ":done" : "");
        if (!aiGroups[key]) aiGroups[key] = { type: e.type, n: 0, played: e.played };
        aiGroups[key].n++;
      }
      for (const key in aiGroups) {
        const g = aiGroups[key];
        const icon = g.type === "super" ? "T" : (g.type === "cup" ? "C" : (g.type === "cl" ? myClubEuroLetter(g.comp) : "L"));
        h += '<span class="wkChip ' + g.type + (g.played ? " done" : "") + '" title="' + g.n + ' ' + (g.type === "league" ? "league " : g.type === "cup" ? "domestic cup " : "super cup ") + (g.played ? "ties played" : "ties") + '"><i>' + icon + '</i>\u00d7' + g.n + '</span>';
      }
      h += '</span>';
    }
    h += '</div>';
  }
  el.innerHTML = h;
}

function myClubRefreshHeader() {
  myClubEnsurePlayerCupLegs();
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (myClubProcessTrainers(c)) c.coins = playerCoins;
  document.getElementById("myClubTitle").textContent = c.clubName;
  const league = getMyClubLeague(c.league);
  document.getElementById("myClubLeagueEyebrow").textContent = (league ? league.name : c.league) + " - Season " + c.season;
  document.getElementById("myClubBalance").textContent = formatMoney(playerCoins);
  document.getElementById("myClubTrophyLine").textContent = c.trophies > 0 ? "Trophies: " + c.trophies : "";
  const formEl = document.getElementById("myClubFormLine");
  if (formEl) formEl.textContent = myClubFormLabel(c);
  const trEl = document.getElementById("myClubTransferLine");
  if (trEl) {
    const signingCount = (Array.isArray(c.transferNews) ? c.transferNews : []).filter(d => d && d.type === "signing").length;
    if (signingCount > 0 && typeof c.transferWindowSeason === "number" && c.transferWindowSeason === c.season - 1) {
      trEl.style.display = "";
      trEl.setAttribute("title", "Open the Transfers tab");
      trEl.textContent = signingCount + " summer signing" + (signingCount > 1 ? "s" : "") + " this window - see Transfers";
    } else {
      trEl.style.display = "none";
    }
  }
  const diffEl = document.getElementById("myClubDiffLine");
  if (diffEl) {
    const applied = myClubWinBufferApplied(c);
    if (applied > 0) {
      diffEl.style.display = "";
      diffEl.setAttribute("title", "Every win makes the whole league permanently a little stronger. +" + applied + " OVR applied to AI squads so far.");
      diffEl.textContent = "Difficulty +" + applied + " - the league gets tougher as you win";
    } else {
      diffEl.style.display = "none";
    }
  }
  const levEl = document.getElementById("myClubLevelLine");
  if (levEl) levEl.innerHTML = "Level " + c.level + " <span class='myClubLevelXp'>" + c.xp + "/" + myClubNextXp(c) + " XP</span>";
  const lvlBar = document.getElementById("myClubLevelBar");
  if (lvlBar) lvlBar.style.width = Math.min(100, Math.floor((c.xp || 0) / myClubNextXp(c) * 100)) + "%";
  const playBtn = document.getElementById("myClubPlayBtn");
  if (playBtn) {
    playBtn.textContent = myClubPlayLabel(c);
    // Only an unusable lineup stops the button. It must stay live on a rest day
    // and at the end of a season, because it doubles as "roll into next season".
    playBtn.disabled = (myClubSuspendedStarters().length > 0) || (myClubInjuredStarters().length > 0);
    const blockedMsg = myClubBlockedLineupMsg();
    if (blockedMsg) myClubLobbyMsg(blockedMsg);
    const seasonDone = !myClubEuroMatchReady(c) && myClubSeasonComplete(c);
    playBtn.title = seasonDone
      ? (myClubAtSeasonEnd(c)
        ? "Season complete - press to roll over into Season " + (c.season + 1) + "."
        : "Season complete - keep advancing to Dec 31 to roll over into Season " + (c.season + 1) + ".")
      : "";
  }
  const simMatchBtn = document.getElementById("myClubSimMatchBtn");
  if (simMatchBtn) {
    const euroPhase = myClubEuroMatchReady(c);
    const isMatchDay = euroPhase ? true : (!myClubSeasonComplete(c) && myClubAtMatchDay(c));
    simMatchBtn.style.display = isMatchDay ? "" : "none";
    simMatchBtn.disabled = euroPhase ? false : (playBtn ? playBtn.disabled : !isMatchDay);
  }
  for (const pb of document.getElementsByClassName("myClubPlayActionBtn")) pb.textContent = myClubPlayLabel(c);
  renderMyClubWeekSchedule();
  myClubPvpModeRefresh();
  myClubPvpRefreshHeader();
  if (myClubIsPvpMode()) {
    const bar = document.getElementById("myClubPvpBar");
    if (bar) bar.style.display = "";
  }
}

const MYCLUB_CATS = {
  main:   { tabs: [["home", "HO", "Home"], ["club", "CL", "Club"]] },
  squad:  { tabs: [["lineup", "XI", "Lineup"], ["training", "TR", "Training"], ["traits", "TA", "Traits"], ["hub", "PL", "Players"]] },
  store:  { tabs: [["packs", "PK", "Packs"], ["shop", "SH", "Shop"], ["market", "MK", "Market"], ["sbc", "SB", "SBC's"]] },
  goals:  { tabs: [["quests", "QU", "Quests"], ["achievements", "AC", "Achievements"]] },
  season: { tabs: [["transfers", "TF", "Transfers"], ["managers", "MG", "Managers"]] }
};
const MYCLUB_DYN = {};
let myClubCatSel = "main";

function myClubCatFor(tab) {
  if (tab === "pvp") return "main";
  if (tab === "champions") return "season";
  for (const k in MYCLUB_CATS) {
    if (MYCLUB_CATS[k].tabs.some(t => t[0] === tab)) return k;
  }
  return "main";
}

function myClubTabButton(tab, mark, label, delay) {
  return '<button class="myClubTab" data-tab="' + tab + '" style="animation-delay:' + delay +
    'ms" onclick="myClubShowTab(\'' + tab + '\')"><i class="tm">' + mark + '</i>' + label + '</button>';
}

function myClubPaintSubNav() {
  const host = document.getElementById("myClubSubNav");
  if (!host) return;
  const base = MYCLUB_CATS[myClubCatSel] || MYCLUB_CATS.main;
  const pre = myClubCatSel === "main" ? MYCLUB_DYN.pvp : myClubCatSel === "season" ? MYCLUB_DYN.champs : null;
  const btns = [];
  let i = 0;
  if (pre) btns.push(myClubTabButton(pre[0], pre[1], pre[2], (i++) * 45));
  for (const t of base.tabs) btns.push(myClubTabButton(t[0], t[1], t[2], (i++) * 45));
  host.innerHTML = btns.join("");
}

function paintCatBar() {
  document.querySelectorAll("#myClubCatBar .myClubCat").forEach(b => {
    b.classList.toggle("sel", b.getAttribute("data-cat") === myClubCatSel);
  });
}

function myClubSyncCat(tab) {
  const cat = myClubCatFor(tab);
  if (cat !== myClubCatSel) {
    myClubCatSel = cat;
    myClubPaintSubNav();
  }
  paintCatBar();
}

function myClubShowCat(cat) {
  if (!MYCLUB_CATS[cat]) return;
  myClubCatSel = cat;
  paintCatBar();
  myClubPaintSubNav();
  const pre = cat === "main" ? MYCLUB_DYN.pvp : cat === "season" ? MYCLUB_DYN.champs : null;
  myClubShowTab(pre ? pre[0] : MYCLUB_CATS[cat].tabs[0][0]);
  // Landing on a category should put the pad straight onto its first sub-tab,
  // so the Season row (League / Calendar / Trophies...) is always reachable.
  const firstSub = document.querySelector("#myClubSubNav .myClubTab");
  if (firstSub && typeof uiFocusEl === "function") uiFocusEl(firstSub);
}

function myClubToggleMenu() {
  const nav = document.getElementById("myClubNav");
  if (!nav) return;
  const open = nav.classList.toggle("open");
  const t = document.getElementById("myClubMenuToggle");
  if (t) {
    t.setAttribute("aria-expanded", open ? "true" : "false");
    t.title = open ? "Close the tab menu" : "Open the tab menu";
  }
}

function myClubCloseMenu() {
  const nav = document.getElementById("myClubNav");
  if (nav && nav.classList.contains("open")) myClubToggleMenu();
}

function myClubTab(id) {
  return document.getElementById(id);
}

function myClubShowTab(tab) {
  myClubCloseMenu();
  myClubSyncCat(tab);
  document.querySelectorAll(".myClubTab").forEach(b => {
    b.classList.toggle("sel", b.getAttribute("data-tab") === tab);
  });
  ["home", "club", "pvp", "friendlies", "managers", "packs", "shop", "league", "calendar", "trophies", "champions", "lineup", "training", "traits", "quests", "achievements", "transfers", "market", "sbc", "hub"].forEach(t => {
    const pane = document.getElementById("myClubTab" + t.charAt(0).toUpperCase() + t.slice(1));
    if (pane) pane.classList.toggle("sel", t === tab);
  });
  // Switching to a tab can change what is reachable, so the D-pad focus walk
  // has to start again from the top of the new pane.
  if (typeof uiRefreshFocus === "function") uiRefreshFocus();
  if (tab === "home") renderMyClubHomeTab();
  else if (tab === "pvp") renderMyClubPvpTab();
  else if (tab === "club") renderMyClubClubTab();
  else if (tab === "friendlies") renderMyClubFriendliesTab();
  else if (tab === "managers") renderMyClubManagersTab();
  else if (tab === "lineup") renderMyClubLineupTab();
  else if (tab === "packs") renderMyClubPacksTab();
  else if (tab === "shop") renderMyClubShopTab();
  else if (tab === "champions") renderMyClubChampionsTab();
  else if (tab === "trophies") renderMyClubTrophiesTab();
  else if (tab === "calendar") renderMyClubCalendarTab();
  else if (tab === "training") renderMyClubTrainingTab();
  else if (tab === "traits") renderMyClubTraitsTab();
  else if (tab === "quests") renderMyClubQuestsTab();
  else if (tab === "achievements") renderMyClubAchievementsTab();
  else if (tab === "transfers") renderMyClubTransfersTab();
  else if (tab === "market") renderMyClubMarketTab();
  else if (tab === "sbc") renderMyClubSbcTab();
  else if (tab === "hub") renderMyClubHubTab();
  else renderMyClubLeagueTab();
}

function myClubFriendliesPaneHTML(c) {
  const cooldown = myClubFriendlyCooldownLeft(c);
  let h = '<div class="myClubPaneCard"><h3>Friendlies</h3>' +
    '<p class="friendlyDayLine">In-game day <b>' + (c.friendlyDay || 0) + '</b>. You can issue one challenge every ' + MY_CLUB_FRIENDLY_COOLDOWN + ' days, and win bonuses come only from winning friendlies \u2014 normal goal / win / draw bonuses never apply.</p>';
  if (c.friendlyOffer) {
    h += '<div class="friendlyOffer" data-nav><div class="foTitle">INCOMING CHALLENGE!</div>' +
      '<div>' + escapeHtml(c.friendlyOffer.opponent) + ' has challenged you to a friendly. Win bonus on offer: <b>' + formatMoney(c.friendlyOffer.winBonus) + '</b>.</div>' +
      '<div class="myClubActions"><button onclick="myClubAcceptFriendly()">Accept</button>' +
      '<button onclick="myClubDeclineFriendly()">Decline</button></div></div>';
  }
  const friendlyClubOpts = MYCLUB_LEAGUES.map(lg => {
    const list = (lg.clubs || []).filter(club => club !== c.clubName && TEAM_ROSTERS[club])
      .slice().sort((a, b) => String(a).localeCompare(String(b)));
    if (!list.length) return "";
    return '<optgroup label="' + escapeHtml(lg.name) + '">' +
      list.map(club => '<option value="' + escapeHtml(club) + '">' + escapeHtml(club) + '</option>').join("") +
      '</optgroup>';
  }).join("");
  const bonusOpts = myClubFriendliesBonusOptions();
  h += '<div class="friendlyChallenge">' +
    '<div class="friendlyQuiet">Send a challenge to any club, from any league. They may accept or decline. Suggested win bonuses range from ' +
    formatMoney(MY_CLUB_FRIENDLY_MIN_BONUS) + ' to ' + formatMoney(MY_CLUB_FRIENDLY_MAX_BONUS) + '.</div>';
  if (cooldown > 0) h += '<div class="friendlyCooldown">Next challenge available in <b>' + cooldown + '</b> day' + (cooldown > 1 ? "s" : "") + '.</div>';
  h += '<div class="friendlyChRow"><label>Challenged club</label><select id="myClubFriendlyOppo">' +
    friendlyClubOpts + '</select></div>' +
    '<div class="friendlyChRow"><label>Win bonus on offer</label><select id="myClubFriendlyBonus">' +
    bonusOpts.map(v => '<option value="' + v + '">' + formatMoney(v) + '</option>').join("") + '</select></div>' +
    '<div class="myClubActions"><button onclick="myClubChallengeTeam()"' + (cooldown > 0 ? " disabled" : "") + '>Challenge to a Friendly</button></div>' +
    '<div id="myClubFriendlyMsg" class="friendlyMsg"></div></div></div>';
  return h;
}

function renderMyClubPvpTab() {
  const pane = document.getElementById("myClubTabPvp");
  const c = getMyClubCareer(myClubLeague);
  if (!pane || !c) return;
  if (myClubPvpView === "online" && !pvpContext) { onlRender(); return; }
  const p = myClubPvpState(c);
  const idx = myClubPvpDivisionIndex(p.trophies);
  const next = MY_CLUB_PVP_DIVISIONS[idx + 1] || null;
  const played = p.wins + p.draws + p.losses;
  const wr = played > 0 ? Math.round(p.wins / played * 100) : 0;

  // progress toward the next rung, or a full bar at the top
  let pct, needLine;
  if (next) {
    const from = MY_CLUB_PVP_DIVISIONS[idx].need;
    const span = next.need - from;
    pct = Math.max(0, Math.min(100, Math.round((p.trophies - from) / span * 100)));
    needLine = "<div class=\"pvpDivNeed\">" + (next.need - p.trophies) + " more to " + myClubPvpDivisionName(idx + 1) + " (" + next.need + ")</div>";
  } else {
    pct = 100;
    needLine = "<div class=\"pvpDivNeed\">Top division reached</div>";
  }

  let html = onlViewTabsHTML();
  html += '<div class="myClubPaneCard"><h3>PvP Ladder</h3>';
  html += '<div class="pvpOppHead"><div class="pvpOppName">' + escapeHtml(myClubPvpDivisionName(idx)) + '</div>' +
    '<div class="pvpOvrBadge">' + p.trophies.toLocaleString() + ' trophies</div></div>';
  html += '<div class="pvpProgress"><i style="width:' + pct + '%"></i></div>';
  html += '<div class="pvpStatLine" style="margin-top:8px">' + needLine + '</div>';
  html += '<p class="pvpNote" style="margin-bottom:0">You are ranked against a club built to match you. Win ' + MY_CLUB_PVP_WIN_TROPHIES +
    ' trophies, draw ' + MY_CLUB_PVP_DRAW_TROPHIES + ', lose ' + Math.abs(MY_CLUB_PVP_LOSS_TROPHIES) +
    '. Play as many as you like - the climb is slow because the rewards are small. None of them can be simulated, so you have to play them.</p>';
  html += '</div>';

  // the opponent waiting on the bench (ranked contexts carry an xi; online ones
  // run their own panel and must not be rendered here)
  if (pvpContext && pvpContext.online) {
    html += '<div class="myClubPaneCard"><h3>Match in progress</h3><p class="pvpNote">An unranked 1v1 online match is under way. Go back to 1v1 Online to see the room.</p>';
    html += '<div class="myClubActions"><button onclick="myClubPvpSetView(\'online\')">Back to 1v1 Online</button></div></div>';
  } else if (pvpContext) {
    html += '<div class="myClubPaneCard"><h3>Next Opponent</h3>';
    html += '<div class="pvpOppHead"><div class="pvpOppName">' + escapeHtml(pvpContext.opponent) + '</div>' +
      '<div class="pvpOvrBadge">XI ' + pvpContext.rating + '</div>' +
      '<div class="pvpStatLine">Manager: ' + escapeHtml(pvpContext.manager) + '</div></div>';
    html += '<div class="pvpStatLine">Your XI vs their XI</div><div class="myClubXI" style="margin-top:10px">';
    const mine = myClubLineupStrength(selectedTeam);
    html += '<div class="myClubXICard"><div class="xiOvr">' + (mine ? Math.round(mine) : "-") + '</div><div class="xiName">' + escapeHtml(selectedTeam) + '</div><div class="xiRole">Your club</div></div>';
    for (const row of pvpContext.xi) {
      html += '<div class="myClubXICard"><div class="xiOvr">' + row.ovr + '</div><div class="xiName">' + escapeHtml(row.name) + '</div><div class="xiRole">' + row.pos + '</div></div>';
    }
    html += '</div>';
    html += '<div class="myClubActions"><button onclick="myClubPvpKickOff()">Kick Off</button>' +
      '<button onclick="myClubPvpCancel()">Find a Different Opponent</button>' +
      '<button onclick="myClubShowTab(\'lineup\')">Edit Lineup</button></div>';
    html += '</div>';
  } else {
    html += '<div class="myClubPaneCard"><h3>Find an Opponent</h3>';
    html += '<p class="pvpNote">PvP pairs you with a made-up manager running a squad of eleven, built around your own trophy count. ' +
      'A brand new club meets a very weak side; the further up the ladder you get, the stronger they become - all the way to Division X, where the opposition is at its best.</p>';
    html += '<div class="myClubActions">' +
      '<button onclick="myClubPvpFindOpponent()">Find Opponent</button>' +
      '<button onclick="myClubShowTab(\'lineup\')">Edit Lineup</button></div>';
    html += '</div>';
  }

  // record
  html += '<div class="myClubPaneCard"><h3>Record</h3>';
  html += '<div class="pvpStatLine">' + p.wins + ' won &nbsp;&middot;&nbsp; ' + p.draws + ' drawn &nbsp;&middot;&nbsp; ' + p.losses + ' lost' +
    (played > 0 ? ' &nbsp;&middot;&nbsp; ' + wr + '% win rate' : '') + '</div>';
  if (p.bestStreak > 0) html += '<div class="pvpStatLine">Best win streak: ' + p.bestStreak + '</div>';
  if (p.streak > 0) html += '<div class="pvpStatLine">Current streak: ' + p.streak + (p.streak === 1 ? " win" : " wins") + '</div>';
  if (p.history.length) {
    html += '<div class="pvpFormRow" style="margin-top:12px">';
    for (const h of p.history) html += '<div class="pvpFormChip ' + h.o + '" title="' + h.gf + "-" + h.ga + '">' + (h.o === "w" ? "W" : (h.o === "d" ? "D" : "L")) + '</div>';
    html += '</div>';
  } else {
    html += '<p class="pvpNote" style="margin-bottom:0">No ranked matches played yet.</p>';
  }
  html += '</div>';

  // the whole ladder, so the climb is always visible
  html += '<div class="myClubPaneCard"><h3>Divisions</h3><div class="pvpLadder">';
  for (let i = MY_CLUB_PVP_DIVISIONS.length - 1; i >= 0; i--) {
    const d = MY_CLUB_PVP_DIVISIONS[i];
    const cls = i === idx ? "cur" : (i < idx ? "done" : "locked");
    const tag = i === idx ? " \u25c0 you are here" : "";
    html += '<div class="pvpDivRow ' + cls + '"><div class="pvpDivName">Division ' + d.short + '</div>' +
      '<div class="pvpDivNeed">' + d.need.toLocaleString() + ' trophies' + tag + '</div></div>';
  }
  html += '</div></div>';

  html += '<div id="myClubPvpMsg" class="pvpStatLine" style="margin-top:4px"></div>';
  pane.innerHTML = html;
  const msg = document.getElementById("myClubPvpMsg");
  if (msg && pvpContext === null) msg.textContent = "";
}

// PvP has two faces: the unranked 1v1 online room and the ranked ladder.
// the ranked ladder stays the landing view; 1v1 Online is one tap away
let myClubPvpView = "ranked";
function myClubPvpSetView(v) {
  myClubPvpView = (v === "ranked") ? "ranked" : "online";
  renderMyClubPvpTab();
}
function onlViewTabsHTML() {
  return '<div class="onlTabs">' +
    '<div class="onlTab' + (myClubPvpView === "online" ? " sel" : "") + '" onclick="myClubPvpSetView(\'online\')">1v1 Online</div>' +
    '<div class="onlTab' + (myClubPvpView === "ranked" ? " sel" : "") + '" onclick="myClubPvpSetView(\'ranked\')">Ranked Ladder</div>' +
    '</div>';
}

function myClubPvpRefreshHeader() {
  if (!myClubIsPvpMode()) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const p = myClubPvpState(c);
  const badge = document.getElementById("myClubPvpBadge");
  if (badge) badge.textContent = myClubPvpDivisionName(myClubPvpDivisionIndex(p.trophies));
  const meta = document.getElementById("myClubPvpMeta");
  if (meta) {
    const played = p.wins + p.draws + p.losses;
    meta.textContent = p.trophies.toLocaleString() + " trophies \u00b7 " + played + " ranked " + (played === 1 ? "match" : "matches") + " played";
  }
  const btn = document.getElementById("myClubPvpFindBtn");
  if (btn) {
    const live = !!pvpContext;
    btn.textContent = live ? "Opponent Ready" : "Find Opponent";
    btn.disabled = live;
  }
}

/* =======================================================================
   1v1 ONLINE MATCHES
   Transport, ready-up, countdown and chat follow the PeerJS room-code
   pattern from the reference build. The host is authoritative: it owns
   the draft, runs the match, and streams the score to the guest.
   Online matches are unranked and never touch trophies or divisions.
   ======================================================================= */
const ONL_MODE_NORMAL = "normal";
const ONL_MODE_DRAFT = "draft";

const ONL_IDLE = "idle", ONL_LOBBY = "lobby", ONL_DRAFTING = "drafting";
const ONL_COUNTDOWN = "countdown", ONL_PLAYING = "playing", ONL_RESULT = "result";

const ONL_DRAFT_SLOTS = [
  { role: "goalkeeper", label: "Goalkeeper" },
  { role: "defender", label: "Right Back" },
  { role: "defender", label: "Centre Back" },
  { role: "defender", label: "Centre Back" },
  { role: "defender", label: "Left Back" },
  { role: "midfielder", label: "Defensive Mid" },
  { role: "midfielder", label: "Centre Mid" },
  { role: "midfielder", label: "Attacking Mid" },
  { role: "attacker", label: "Forward" },
  { role: "attacker", label: "Forward" },
  { role: "attacker", label: "Forward" }
];
const ONL_DRAFT_OFFERS = 3;
const ONL_PICK_SECONDS = 20;
const ONL_CHAT_MAX = 80;
const ONL_SYNC_MS = 500;
const ONL_PEER_PREFIX = "soccer-v4-";

let onl = null;

// ---- deterministic randomness ---------------------------------------------
// A 1v1 online match is simulated on BOTH machines at once: each client runs
// all twenty-two players and only the human inputs travel over the wire. For
// the two to stay in step, every roll the match engine makes has to come out
// of the same seeded stream on both sides. Outside an online match these
// defer to Math.random(), so the single-player game is unchanged.
let netRngSeed = 0x9e3779b9;
let netFrameClock = 0;

function onlNetDeterministic() {
  return !!(onl && onl.net);
}

function netRngReset(seed) {
  // xorshift32 is stuck on zero forever, so keep the seed away from it
  netRngSeed = ((seed | 0) || 0x9e3779b9) | 0;
  netFrameClock = 0;
}

// Integer-only xorshift32. Every step is a 32-bit integer operation, so the
// stream comes out identical in every JS engine - Math.random, and the
// libm-backed Math functions, are not guaranteed to be, which is precisely
// why the match path avoids them.
function netRngNext() {
  let x = netRngSeed;
  x ^= x << 13; x |= 0;
  x ^= x >>> 17;
  x ^= x << 5;  x |= 0;
  netRngSeed = x;
  return x >>> 0;
}

function netRand() {
  if (!onlNetDeterministic()) return Math.random();
  return netRngNext() / 4294967296;
}

// Wall-clock milliseconds during a normal match, a frame counter during an
// online one. Drives cosmetic sim flourishes (the referee weaving up and
// down) that still have to advance in lockstep or the clients drift apart.
function netSimClock() {
  if (!onlNetDeterministic()) return performance.now();
  return netFrameClock;
}

function onlEscape(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function onlMyName() {
  try {
    const n = (getMyClubCareer(myClubLeague) || {}).managerName;
    if (n) return String(n).trim();
  } catch (e) {}
  return "Manager";
}

function onlMyClub() { return selectedTeam || "My Club"; }

function onlNewSession() {
  onl = {
    peer: null, isHost: false, roomCode: "", myId: "",
    conn: null, guestSquad: null,
    them: null,
    phase: ONL_IDLE, mode: ONL_MODE_NORMAL,
    myReady: false, theirReady: false,
    draft: null, chat: [],
    score: { blue: 0, red: 0, time: 0, half: 1 },
    result: null,
    guestTeamName: "", draftName: "",
    streamTimer: null, countTimer: null, pickTimer: null,
    watchTick: null, restoreTeam: null, kickoffAt: 0
  };
  return onl;
}

function onlPhase(p) {
  if (!onl) return;
  onl.phase = p;
  onlRender();
}

/* ---------- transport ---------- */
// one live data connection per side: the host holds the mirrored end it was
// handed, the guest holds the end it dialled out with
function onlWire(msg) {
  const c = onl && onl.conn;
  if (!c || !c.open) return;
  try { c.send(msg); } catch (e) {}
}

function onlMakeCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

function onlStatus(text, cls) {
  const el = document.getElementById("onlStatus");
  if (!el) return;
  el.textContent = text || "";
  el.className = "onlStatus" + (cls ? " " + cls : "");
}

function onlLoadPeer(next) {
  if (typeof Peer !== "undefined") { try { if (next) next(); } catch (e) {} return; }
  const done = function () {
    if (typeof Peer !== "undefined") { try { if (next) next(); } catch (e) {} }
    else onlStatus("PeerJS could not load. Check your internet connection.", "bad");
  };
  const s = document.createElement("script");
  s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
  s.onload = done;
  s.onerror = done;
  document.head.appendChild(s);
  onlStatus("Loading connection library...");
}

function onlHost() {
  if (typeof Peer === "undefined") { onlLoadPeer(onlHost); return; }
  if (onl) onlLeave(true);
  const s = onlNewSession();
  s.isHost = true;
  s.mode = window.__onlMode || ONL_MODE_NORMAL;
  s.phase = ONL_LOBBY;
  s.roomCode = onlMakeCode();
  if (typeof Peer === "undefined") { onlStatus("PeerJS could not load. Check your internet connection.", "bad"); return; }
  onlStatus("Creating room...");
  let peer;
  try { peer = new Peer(ONL_PEER_PREFIX + s.roomCode, { debug: 1 }); } catch (e) {}
  if (!peer) { onlStatus("Could not start the peer connection.", "bad"); return; }
  s.peer = peer;
  peer.on("open", (id) => {
    s.myId = id;
    onlStatus("Room open. Share the code and wait for your opponent.", "good");
    onlRender();
  });
  peer.on("connection", (conn) => {
    if (s.conn) { try { conn.close(); } catch (e) {} return; }
    s.conn = conn;
    conn.on("open", function () {
      onlWireTo(conn, { type: "hello", from: onlMyName(), club: onlMyClub(), squad: onlMySquad() });
      onlStatus("Opponent connected. Ready up when you are.", "good");
    });
    conn.on("data", function (d) { onlHandle(d); });
    conn.on("close", function () { onlPeerGone("Your opponent left the room."); });
  });
  peer.on("error", (err) => {
    const t = (err && err.type) || "";
    onlStatus(t === "unavailable-id" ? "That room code is already in use. Try hosting again." :
      t === "peer-unavailable" ? "No room with that code." :
      "Connection error (" + t + ").", "bad");
  });
  onlRender();
}

function onlWireTo(conn, msg) {
  try { conn.send(msg); } catch (e) {}
}

function onlJoin(raw) {
  const code = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 4) { onlStatus("Enter the 5-character room code.", "bad"); return; }
  if (typeof Peer === "undefined") { onlLoadPeer(function () { onlJoin(code); }); return; }
  if (onl) onlLeave(true);
  const s = onlNewSession();
  s.isHost = false;
  s.roomCode = code;
  s.phase = ONL_LOBBY;
  if (typeof Peer === "undefined") { onlStatus("PeerJS could not load. Check your internet connection.", "bad"); return; }
  onlStatus("Connecting to room " + code + "...");
  let peer;
  try { peer = new Peer({ debug: 1 }); } catch (e) {}
  if (!peer) { onlStatus("Could not start the peer connection.", "bad"); return; }
  s.peer = peer;
  peer.on("open", (id) => {
    s.myId = id;
    let conn;
    try { conn = peer.connect(ONL_PEER_PREFIX + code, { reliable: true, serialization: "json" }); } catch (e) {}
    if (!conn) { onlStatus("Could not open the room.", "bad"); return; }
    s.conn = conn;
    const giveUp = setTimeout(() => {
      if (onl === s && s.phase === ONL_LOBBY && !s.them) {
        onlStatus("No room with that code.", "bad");
      }
    }, 8000);
    conn.on("open", () => {
      clearTimeout(giveUp);
      onlWire({ type: "hello", from: onlMyName(), club: onlMyClub(), squad: onlMySquad() });
      onlStatus("Connected. Waiting for the host to start.", "good");
      onlRender();
    });
    conn.on("data", (d) => onlHandle(d));
    conn.on("close", () => onlPeerGone("The host left the room."));
    conn.on("error", () => onlPeerGone("Connection to the host failed."));
  });
  peer.on("error", (err) => {
    const t = (err && err.type) || "";
    onlStatus(t === "peer-unavailable" ? "No room with that code." : "Connection error (" + t + ").", "bad");
  });
  onlRender();
}

function onlPeerGone(msg) {
  if (!onl) return;
  onlCleanupMatch();
  onlChat(msg, true);
  onl.them = null;
  onl.theirReady = false;
  onl.draft = null;
  if (onl.phase !== ONL_RESULT) onl.phase = ONL_LOBBY;
  onlStatus(msg, "bad");
  onlRender();
}

function onlCleanupMatch(sess) {
  const s = sess || onl;
  if (!s) return;
  if (s.streamTimer) { clearInterval(s.streamTimer); s.streamTimer = null; }
  if (s.watchTick) { clearInterval(s.watchTick); s.watchTick = null; }
  if (s.countTimer) { clearTimeout(s.countTimer); s.countTimer = null; }
  if (s.pickTimer) { clearTimeout(s.pickTimer); s.pickTimer = null; }
  // Drop back to a single locally-controlled human so a following solo match
  // isn't left simulating two and stalling on input that will never arrive.
  onlTeardownLockstep();
  onlHideCountdown();
  if (s.guestTeamName) { myClubPvpUnregisterOpponent(s.guestTeamName); s.guestTeamName = ""; }
  if (s.draftName) { try { delete TEAM_ROSTERS[s.draftName]; delete teamColors[s.draftName]; } catch (e) {} s.draftName = ""; }
  if (s.restoreTeam) { try { selectedTeam = s.restoreTeam; } catch (e) {} s.restoreTeam = null; }
  // onlLeave() nulls the global before calling us, so also drop any context
  // still flagged as ours. Ranked contexts never carry the online flag.
  if ((onl === s) || (pvpContext && pvpContext.online)) pvpContext = null;
}

function onlLeave(silent) {
  if (!onl) return;
  const s = onl;
  onl = null;
  onlCleanupMatch(s);
  try { if (s.conn) s.conn.close(); } catch (e) {}
  try { if (s.peer) s.peer.destroy(); } catch (e) {}
  onlRender();
  if (!silent) myClubPvpMsg("Left the 1v1 online room.");
}

/* ---------- lobby ---------- */
function onlSetMode(m) {
  const want = (m === ONL_MODE_DRAFT) ? ONL_MODE_DRAFT : ONL_MODE_NORMAL;
  if (!onl || onl.phase === ONL_IDLE) { window.__onlMode = want; onlRender(); return; }
  // the host owns the room settings; a guest cannot switch the mode under it
  if (!onl.isHost) return;
  if (onl.phase !== ONL_LOBBY) return;
  if (onl.mode === want) return;
  onl.mode = want;
  onlWire({ type: "mode", mode: onl.mode });
  onlRender();
}

function onlToggleReady() {
  if (!onl || onl.phase !== ONL_LOBBY) return;
  if (!onl.them) { onlStatus("Waiting for an opponent to join.", "bad"); return; }
  onl.myReady = !onl.myReady;
  onlWire({ type: "ready", ready: onl.myReady });
  if (onl.isHost) onlHostCheckReady();
  onlRender();
}

function onlHostCheckReady() {
  if (!onl || !onl.isHost || onl.phase !== ONL_LOBBY) return;
  if (onl.myReady && onl.theirReady) onlBegin();
}

function onlBegin() {
  // Pick the shared simulation seed here, on the host, so the guest receives it
  // in the `start` message and both random streams are identical from tick 0.
  if (onl.isHost) onl.seed = (Math.random() * 0x7fffffff) | 0;
  if (onl.mode === ONL_MODE_DRAFT) onlDraftStart();
  else onlPrepareSquadsAndKick();
}

function onlBackToLobby(msg) {
  if (!onl) return;
  onlCleanupMatch();
  onl.result = null;
  onl.score = { blue: 0, red: 0, time: 0, half: 1 };
  onl.myReady = false;
  if (onl.them) onl.theirReady = false;
  onl.phase = ONL_LOBBY;
  if (msg) onlChat(msg, true);
  onlRender();
}

/* ---------- squads ---------- */
function onlPlayerPayload(pd, role) {
  return {
    name: pd.name || "",
    role: role,
    ovr: Math.round(calculateOverall(pd, role)),
    s: {
      pace: pd.pace, shooting: pd.shooting, passing: pd.passing,
      dribbling: pd.dribbling, defending: pd.defending, physical: pd.physical
    }
  };
}

function onlSquadFromRoster(roster, role, count) {
  const out = [];
  if (role === "goalkeeper") {
    if (roster && roster.goalkeeper) out.push(onlPlayerPayload(roster.goalkeeper, "goalkeeper"));
  } else {
    const arr = roster ? (role === "defender" ? roster.defenders : role === "midfielder" ? roster.midfielders : roster.attackers) : null;
    if (arr) for (const pd of arr) if (pd) out.push(onlPlayerPayload(pd, role));
  }
  out.sort((a, b) => b.ovr - a.ovr);
  while (out.length < count) {
    out.push(onlPlayerPayload(makeRatedPlayer("Reserve", 55, role), role));
  }
  return out.slice(0, count);
}

// The wire squad is a flat 11 with roles; rebuild the bucket roster the
// match engine expects.
function onlSquadToRoster(squad) {
  const byRole = { goalkeeper: [], defender: [], midfielder: [], attacker: [] };
  for (const p of (squad || [])) {
    const r = ONL_TO_ROSTER_ROLE[p.role] || "midfielder";
    byRole[r].push(p);
  }
  const mat = (wire) => makeRatedPlayer(wire.name || "Player", wire.ovr || 55, byRoleWireRole(wire));
  const gk = byRole.goalkeeper[0];
  return {
    goalkeeper: mat(gk || { name: "Keeper", ovr: 55, role: "goalkeeper" }),
    defenders: byRole.defender.slice(0, 4).map(mat),
    midfielders: byRole.midfielder.slice(0, 3).map(mat),
    attackers: byRole.attacker.slice(0, 3).map(mat)
  };
}
const ONL_TO_ROSTER_ROLE = { goalkeeper: "goalkeeper", defender: "defender", midfielder: "midfielder", attacker: "attacker" };
function byRoleWireRole(wire) { return ONL_TO_ROSTER_ROLE[wire.role] || "midfielder"; }

function onlMySquad() {
  const f = myClubFormation();
  const roster = TEAM_ROSTERS[onlMyClub()] || {};
  const squad = [];
  const gk = onlSquadFromRoster(roster, "goalkeeper", 1);
  squad.push(gk[0]);
  const d = onlSquadFromRoster(roster, "defender", f.nd);
  const m = onlSquadFromRoster(roster, "midfielder", f.nm);
  const a = onlSquadFromRoster(roster, "attacker", f.na);
  return squad.concat(d, m, a);
}

function onlKitFor(side) {
  return side === "blue" ? "#1f6fd0" : "#c0392b";
}

function onlNameFor(side) {
  if (side === "blue") return onlMyClub();
  return (onl && onl.them && onl.them.club) ? String(onl.them.club) : "Opponent";
}

function onlPrepareSquadsAndKick() {
  if (!onl) return;
  if (!onl.them) { onlStatus("Your opponent left.", "bad"); return; }
  if (!onl.isHost) return;
  if (!onl.guestSquad) { onlStatus("Waiting for your opponent's team.", "bad"); return; }
  const side = "red";
  const nm = onlNameFor(side);
  TEAM_ROSTERS[nm] = onlSquadToRoster(onl.guestSquad);
  teamColors[nm] = onlKitFor(side);
  onl.guestTeamName = nm;
  pvpContext = { opponent: nm, online: true, mode: onl.mode };
  onlCountdownThen(function () {
    onlStartHostMatch();
  });
}

function onlStartHostMatch() {
  if (!onl) return;
  document.getElementById("myClubScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  // Both sides drive one human; the host steers blue, the guest steers red.
  onlSetupLockstepMatch(false);
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
  onl.phase = ONL_PLAYING;
  onlWire({ type: "start", blue: onlMyClub(), red: onl.guestTeamName, mode: onl.mode, seed: onl.seed });
  // The guest no longer watches - it runs the same simulation itself.
  onlStartStream();
}

// Configure both humans for a true-simultaneous match. `isGuest` decides which
// human this client actually steers. Both peers run this identically, which is
// what makes the simulation agree.
function onlSetupLockstepMatch(isGuest) {
  // Pick this client's human: blue for the host, red for the guest. The global
  // `player` ALWAYS stays the blue attacker so that every `=== player` gate in
  // the simulation resolves the same way on both peers.
  const blueHuman = player;
  // The red attacking slot is the last-created red outfield attacker, matching
  // how the red XI is laid out. Find it by role rather than by index so a
  // formation change can't silently steer the wrong man.
  const redHuman = redSquad.find((p) => p.role === "attacker") || redSquad[redSquad.length - 2];
  if (!redHuman) return;

  blueHuman.human = true;
  redHuman.human = true;
  blueHuman.netFrame = makeInputFrame();
  redHuman.netFrame = makeInputFrame();

  // Canonical iteration order - identical on both peers.
  onlTeardownLockstep();
  simHumans = [blueHuman, redHuman];
  netGuestHuman = redHuman;
  localPlayer = isGuest ? redHuman : blueHuman;

  // From here on every match-path random / frame-clock draw must be the seeded,
  // deterministic one. Without this flag onlNetDeterministic() falls back to
  // Math.random() and the two peers' simulations diverge on tick one.
  if (onl) onl.net = true;

  netResetLockstep(onl && onl.seed);
}

// Return the match to the single-human, locally-controlled default. Called when
// an online session ends so a later solo match isn't left with two humans.
function onlTeardownLockstep() {
  if (netGuestHuman) netGuestHuman.human = false;
  if (player) player.human = true;
  simHumans = [player];
  localPlayer = player;
  netGuestHuman = null;
  netTick = 0;
  netRemoteAct = {};
  netLastStepAt = 0;
  netAccum = 0;
  if (onl) onl.net = false;
}

// The guest enters the game screen and runs the match locally, exactly as the
// host does - the only difference is which human its keyboard is bound to.
function onlStartGuestMatch(d) {
  if (!onl || onl.isHost) return;
  document.getElementById("myClubScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  onlSetupLockstepMatch(true);
  preparePlayerMatch();
  // Both peers start on the same tick, so the kickoff intro is cosmetic: the
  // simulation itself won't advance until both sides have input for tick 0.
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
  onlChat("Match started!", true);
  onlRender();
}

function onlStartStream() {
  if (!onl) return;
  // In a lockstep match both peers simulate the same match, so there is no
  // score to reconcile - the previous periodic score broadcast is not needed.
  if (onl.streamTimer) { clearInterval(onl.streamTimer); onl.streamTimer = null; }
}

function onlSyncScore() {
  if (!onl || !onl.isHost) return;
  if (typeof matchRunning === "undefined" && typeof matchTime === "undefined") return;
  onlWire({
    type: "score", blue: blueScore, red: redScore,
    time: matchTime, half: (typeof clockHalf !== "undefined" ? clockHalf : 1)
  });
}

/* ---------- draft ---------- */
function onlDraftStart() {
  if (!onl) return;
  onl.phase = ONL_DRAFTING;
  onl.draft = {
    round: 0, options: [], picks: {},
    me: [], them: [],
    myPick: null, theirPick: null,
    done: false
  };
  onlChat("Draft time - build your XI.", true);
  onlChat("Each round offers 3 cards for the highlighted slot. You have " + ONL_PICK_SECONDS + "s.", true);
  if (onl.isHost) onlHostNextRound();
  onlRender();
}

function onlDraftSlotFor(round) { return ONL_DRAFT_SLOTS[round] || { role: "midfielder", label: "Squad" }; }

function onlHostNextRound() {
  if (!onl || !onl.isHost) return;
  const d = onl.draft;
  if (!d) return;
  if (d.me.length >= ONL_DRAFT_SLOTS.length && d.them.length >= ONL_DRAFT_SLOTS.length) { onlHostDraftDone(); return; }
  d.round++;
  d.myPick = null;
  d.theirPick = null;
  d.picks = {};
  d.options = onlRollOptions(onlDraftSlotFor(d.round - 1).role);
  onlWire({ type: "draftRound", round: d.round, slot: onlDraftSlotFor(d.round - 1), options: d.options });
  onlRender();
  onlDraftArmTimer();
}

function onlRollOptions(role) {
  const used = {};
  const d = onl.draft;
  for (const p of (d ? d.me.concat(d.them) : [])) used[p.name] = true;
  const out = [];
  for (let i = 0; i < ONL_DRAFT_OFFERS; i++) {
    let nm, ovr;
    let tries = 0;
    do {
      nm = myClubPvpPick(MY_CLUB_PVP_FIRST_NAMES) + " " + myClubPvpPick(MY_CLUB_PVP_LAST_NAMES);
      tries++;
    } while (used[nm] && tries < 40);
    used[nm] = true;
    const band = myClubPvpPick([58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82]);
    const bell = (Math.random() + Math.random()) / 2;
    ovr = Math.max(50, Math.min(88, Math.round(band - 3 + bell * 8)));
    const wire = onlPlayerPayload(makeRatedPlayer(nm, ovr, role), role);
    wire.role = role;
    out.push(wire);
  }
  return out;
}

function onlDraftArmTimer() {
  if (!onl || !onl.isHost) return;
  if (onl.pickTimer) clearTimeout(onl.pickTimer);
  onl.pickTimer = setTimeout(function () {
    const d = onl && onl.draft;
    if (!onl || !d) return;
    if (d.myPick == null) d.myPick = 0;
    if (d.theirPick == null) d.theirPick = 0;
    onlHostDraftResolve();
  }, ONL_PICK_SECONDS * 1000);
}

function onlDraftPick(idx) {
  if (!onl || onl.phase !== ONL_DRAFTING || !onl.draft) return;
  const d = onl.draft;
  if (idx < 0 || idx >= d.options.length) return;
  if (onl.isHost) onlHostDraftPick(idx);
  else onlWire({ type: "draftPick", index: idx });
}

function onlHostDraftPick(idx) {
  if (!onl || !onl.isHost || !onl.draft) return;
  const d = onl.draft;
  if (d.myPick != null) return;
  d.myPick = idx;
  onlRender();
  onlHostDraftResolve();
}

// Resolves the round once both cards are in, or re-arms the clock while the
// other player is still choosing.
function onlHostDraftResolve() {
  if (!onl || !onl.isHost || !onl.draft) return;
  const d = onl.draft;
  if (d.myPick == null) return;
  if (d.theirPick == null) { onlDraftArmTimer(); return; }
  if (onl.pickTimer) { clearTimeout(onl.pickTimer); onl.pickTimer = null; }
  const my = d.options[d.myPick];
  const their = d.options[d.theirPick];
  d.me.push(my);
  d.them.push(their);
  onlWire({ type: "draftPicks", myIndex: d.myPick, theirIndex: d.theirPick, options: d.options });
  onlRender();
  setTimeout(function () { if (onl) onlHostNextRound(); }, 900);
}

function onlHostDraftDone() {
  if (!onl || !onl.isHost || !onl.draft) return;
  const d = onl.draft;
  d.done = true;
  const themName = onlNameFor("red");
  TEAM_ROSTERS[themName] = onlSquadToRoster(d.them);
  teamColors[themName] = onlKitFor("red");
  onl.guestTeamName = themName;
  onlChat("Draft complete. Kickoff!", true);
  onlWire({ type: "draftDone", theirXi: d.me });
  // Host plays its own drafted XI, so temporarily point the engine at it.
  const myDraftName = onlMyClub() + " (Draft)";
  TEAM_ROSTERS[myDraftName] = onlSquadToRoster(d.me);
  teamColors[myDraftName] = onlKitFor("blue");
  onl.draftName = myDraftName;
  onl.restoreTeam = selectedTeam;
  selectedTeam = myDraftName;
  pvpContext = { opponent: themName, online: true, mode: onl.mode };
  onlCountdownThen(function () { onlStartHostMatch(); });
}

function onlGuestApplyDraft(theirXi) {
  if (!onl) return;
  const nm = onlMyClub() + " (Online)";
  TEAM_ROSTERS[nm] = onlSquadToRoster(theirXi || []);
  teamColors[nm] = onlKitFor("blue");
  onl.guestTeamName = nm;
  onlChat("Your drafted XI is locked in. Kickoff!", true);
  onlRender();
}

/* ---------- countdown ---------- */
function onlShowCountdown(n) {
  const el = document.getElementById("onlCountdown");
  const num = document.getElementById("onlCountdownNum");
  if (!el || !num) return;
  el.style.display = "flex";
  num.textContent = n;
}
function onlHideCountdown() {
  const el = document.getElementById("onlCountdown");
  if (el) el.style.display = "none";
}

function onlCountdownThen(fn) {
  if (!onl) return;
  onl.phase = ONL_COUNTDOWN;
  onlRender();
  const startAt = Date.now() + 3000;
  onlWire({ type: "countdown", startAt: startAt });
  let n = 3;
  onlShowCountdown(n);
  const step = function () {
    if (!onl) return;
    n--;
    if (n > 0) { onlShowCountdown(n); onl.countTimer = setTimeout(step, 1000); }
    else {
      onlHideCountdown();
      onl.countTimer = setTimeout(function () { if (onl) fn(); }, 250);
    }
  };
  onl.countTimer = setTimeout(step, 1000);
}

function onlRunGuestCountdown(startAt) {
  if (!onl) return;
  onl.phase = ONL_COUNTDOWN;
  onlRender();
  const tick = function () {
    if (!onl || onl.phase !== ONL_COUNTDOWN) return;
    const left = Math.max(0, startAt - Date.now());
    onlShowCountdown(Math.ceil(left / 1000) || 1);
    if (left <= 0) { onlHideCountdown(); return; }
    onl.countTimer = setTimeout(tick, 200);
  };
  tick();
}

/* ---------- chat ---------- */
function onlChat(text, system) {
  if (!onl) return;
  onl.chat.push({ system: !!system, text: String(text), me: !system });
  if (onl.chat.length > ONL_CHAT_MAX) onl.chat.shift();
  onlRenderChat();
  onlRenderBubble(text, system);
}

function onlSendChat() {
  if (!onl || !onl.them) return;
  const el = document.getElementById("onlChatInput");
  if (!el) return;
  const t = String(el.value || "").trim().slice(0, 120);
  if (!t) return;
  el.value = "";
  onlWire({ type: "chat", text: t });
  onlIncomingChat(onlMyName(), t);
}

function onlIncomingChat(who, text) {
  if (!onl) return;
  onl.chat.push({ system: false, text: String(text), who: who, me: false });
  if (onl.chat.length > ONL_CHAT_MAX) onl.chat.shift();
  onlRenderChat();
  onlRenderBubble(text, false, who);
}

function onlRenderBubble(text, system, who) {
  const host = document.getElementById("onlBubble");
  if (!host) return;
  host.textContent = system ? "" : (who ? who + ": " : "") + text;
  host.style.display = (system || !text) ? "none" : "block";
  if (host._t) clearTimeout(host._t);
  host._t = setTimeout(function () { host.style.display = "none"; }, 2600);
}

/* ---------- results ---------- */
function onlFinishMatch(opp, mine, theirs) {
  if (!onl) return;
  const s = onl;
  onlCleanupMatch();
  s.result = { mine: mine, theirs: theirs, opp: opp };
  s.phase = ONL_RESULT;
  const win = mine > theirs;
  const draw = mine === theirs;
  const word = win ? "YOU WIN" : (draw ? "DRAWN" : "YOU LOSE");
  const line = onlMyClub() + " " + mine + " - " + theirs + " " + opp;
  onlWire({ type: "result", mine: theirs, theirs: mine, opp: onlMyClub() });
  onlChat(word + "! " + line, true);
  showEndScreen("ONLINE " + word + "!  " + line, line, function () {
    onlBackToLobby();
    openMyClubLobby();
    myClubPvpSetView("online");
  }, { blue: onlMyClub(), red: opp });
}

function onlShowGuestResult(mine, theirs, opp) {
  if (!onl) return;
  onlCleanupMatch();
  onl.result = { mine: mine, theirs: theirs, opp: opp };
  onl.phase = ONL_RESULT;
  const win = mine > theirs;
  const draw = mine === theirs;
  const word = win ? "YOU WIN" : (draw ? "DRAWN" : "YOU LOSE");
  const line = onlMyClub() + " " + mine + " - " + theirs + " " + opp;
  onlChat(word + "! " + line, true);
  onlRender();
}

/* ---------- message handling ---------- */
function onlHandle(d) {
  if (!onl || !d || !d.type) return;
  switch (d.type) {
    case "hello": {
      if (!onl.isHost) return;
      onl.them = { name: d.from || "Opponent", club: d.club || "Opponent FC" };
      onl.theirReady = false;
      onl.guestSquad = d.squad || null;
      onlWire({ type: "welcome", mode: onl.mode, from: onlMyName(), club: onlMyClub(), chat: onl.chat.slice(-30) });
      onlChat(onl.them.name + " joined the room.", true);
      onlRender();
      break;
    }
    case "welcome": {
      if (onl.isHost) return;
      onl.them = { name: d.from || "Host", club: d.club || "Host FC" };
      onl.mode = d.mode || ONL_MODE_NORMAL;
      if (Array.isArray(d.chat)) onl.chat = d.chat.slice(-ONL_CHAT_MAX);
      onlStatus("Connected. Ready up when you are.", "good");
      onlChat("You joined " + onl.them.name + "'s room.", true);
      onlRender();
      break;
    }
    case "mode": {
      if (onl.isHost) return;
      onl.mode = (d.mode === ONL_MODE_DRAFT) ? ONL_MODE_DRAFT : ONL_MODE_NORMAL;
      onlRender();
      break;
    }
    case "ready": {
      onl.theirReady = !!d.ready;
      if (onl.isHost) onlHostCheckReady();
      onlRender();
      break;
    }
    case "chat": {
      onlIncomingChat(onl.them ? onl.them.name : "Opponent", d.text);
      break;
    }
    case "draftRound": {
      if (!onl.draft) onl.draft = { round: 0, options: [], picks: {}, me: [], them: [], myPick: null, theirPick: null, done: false };
      // the guest learns it is drafting from the first round it is offered
      if (onl.phase === ONL_LOBBY || onl.phase === ONL_COUNTDOWN) onl.phase = ONL_DRAFTING;
      onl.draft.round = d.round;
      onl.draft.slot = d.slot;
      onl.draft.options = d.options || [];
      onl.draft.myPick = null;
      onl.draft.theirPick = null;
      onlRender();
      break;
    }
    case "draftPick": {
      if (!onl.draft) return;
      onl.draft.theirPick = d.index;
      // the host owns the round, so it decides when both cards are in
      if (onl.isHost) onlHostDraftResolve();
      onlRender();
      break;
    }
    case "draftPicks": {
      if (!onl.draft) return;
      onl.draft.myPick = d.myIndex;
      onl.draft.theirPick = d.theirIndex;
      const o = d.options || onl.draft.options || [];
      if (o[d.myIndex]) onl.draft.me.push(o[d.myIndex]);
      if (o[d.theirIndex]) onl.draft.them.push(o[d.theirIndex]);
      onlRender();
      break;
    }
    case "draftDone": {
      onlGuestApplyDraft(d.theirXi);
      break;
    }
    case "countdown": {
      if (onl.isHost) return;
      onlRunGuestCountdown(d.startAt || Date.now() + 3000);
      break;
    }
    case "start": {
      if (onl.isHost) return;
      // The seed comes from the host so both simulations start from an
      // identical random stream - without it the first netRand() call would
      // diverge and desync on frame one.
      onl.seed = d.seed;
      onl.phase = ONL_PLAYING;
      onlStartGuestMatch(d);
      break;
    }
    case "inp": {
      // A replicated input frame for one tick.
      netOnRemoteFrame(d.tick, d.f);
      break;
    }
    case "score": {
      if (onl.isHost) return;
      onl.score = { blue: d.red, red: d.blue, time: d.time || 0, half: d.half || 1 };
      onlRenderWatch();
      break;
    }
    case "result": {
      if (onl.isHost) return;
      onlStopWatch();
      onlShowGuestResult(d.mine, d.theirs, d.opp);
      break;
    }
  }
}

function onlStartWatch() {
  if (!onl || onl.watchTick) return;
  onlRenderWatch();
  onl.watchTick = setInterval(function () { if (onl) onlRenderWatch(); }, 1000);
}
function onlStopWatch() {
  if (onl && onl.watchTick) { clearInterval(onl.watchTick); onl.watchTick = null; }
}

/* ---------- render ---------- */
function onlRender() {
  const pane = document.getElementById("myClubTabPvp");
  if (!pane) return;
  if (!myClubIsPvpMode()) { myClubPvpView = "ranked"; renderMyClubPvpTab(); return; }
  if (!getMyClubCareer(myClubLeague)) { pane.innerHTML = onlViewTabsHTML() + '<div class="myClubPaneCard"><p class="pvpNote">Start a My Club career to use 1v1 Online.</p></div>'; return; }

  let html = onlViewTabsHTML();

  if (!onl || onl.phase === ONL_IDLE) {
    html += '<div class="pvpNote" style="margin-bottom:12px">Unranked 1v1 with a room code. Bring a friend or host a room.</div>';
    html += '<div class="onlModeRow">' +
      '<button class="onlModeCard' + (onlIdleMode() === ONL_MODE_NORMAL ? " sel" : "") + '" onclick="onlSetMode(\'normal\')"><b>Normal</b><span>Play with the XI you have set in My Club right now.</span></button>' +
      '<button class="onlModeCard' + (onlIdleMode() === ONL_MODE_DRAFT ? " sel" : "") + '" onclick="onlSetMode(\'draft\')"><b>Team Draft</b><span>Pick from draft cards and build a new XI.</span></button>' +
      '</div>';
    html += '<div class="onlRoomRow" style="margin-top:14px">' +
      '<button onclick="onlHost()">Host a Room</button>' +
      '<input class="onlCodeInput" id="onlJoinCode" maxlength="5" placeholder="CODE" autocomplete="off">' +
      '<button onclick="onlJoin(document.getElementById(\'onlJoinCode\').value)">Join Room</button>' +
      '<span class="onlStatus" id="onlStatus"></span>' +
      '</div>';
    html += '<div class="onlBubble" id="onlBubble" style="display:none;margin-top:12px;padding:8px 12px;border-radius:10px;background:rgba(6,12,20,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;font-weight:700"></div>';
    html += onlChatHTML();
    pane.innerHTML = html;
    onlRenderChat();
    return;
  }

  // in a room
  html += '<div class="onlRoomRow" style="margin-bottom:10px">';
  if (onl.roomCode) html += '<span class="onlCode">' + onlEscape(onl.roomCode) + '</span>';
  html += '<span class="onlStatus" id="onlStatus"></span>';
  html += '<button onclick="onlLeave()">Leave Room</button>';
  html += '</div>';

  if (onl.phase === ONL_RESULT) {
    if (onl.result) {
      const w = onl.result.mine > onl.result.theirs ? "YOU WIN" : (onl.result.mine === onl.result.theirs ? "DRAWN" : "YOU LOSE");
      html += '<div class="onlWatch"><div class="onlWatchScore">' +
        onlEscape(onlMyClub()) + " " + onl.result.mine + " - " + onl.result.theirs + " " + onlEscape(onl.result.opp) +
        '</div><div style="font-size:24px;font-weight:900;margin-top:6px">' + w + '</div></div>';
    }
    html += '<div class="onlRoomRow" style="justify-content:center;margin-top:12px">' +
      '<button onclick="onlBackToLobby()">Back to Room</button></div>';
    html += onlChatHTML();
    pane.innerHTML = html;
    onlRenderChat();
    return;
  }

  if (onl.phase === ONL_PLAYING) {
    html += onlWatchHTML();
    html += onlChatHTML();
    pane.innerHTML = html;
    onlRenderChat();
    onlRenderWatch();
    return;
  }

  if (onl.phase === ONL_DRAFTING) { html += onlDraftHTML(); html += onlChatHTML(); pane.innerHTML = html; onlRenderChat(); return; }

  // lobby
  const them = onl.them;
  html += '<div class="onlModeRow">' +
    '<button class="onlModeCard' + (onl.mode === ONL_MODE_NORMAL ? " sel" : "") + '" onclick="onlSetMode(\'normal\')"' + (onl.isHost ? "" : " disabled") + '><b>Normal</b><span>Use your current My Club XI.</span></button>' +
    '<button class="onlModeCard' + (onl.mode === ONL_MODE_DRAFT ? " sel" : "") + '" onclick="onlSetMode(\'draft\')"' + (onl.isHost ? "" : " disabled") + '><b>Team Draft</b><span>Draft a new XI from cards.</span></button>' +
    '</div>';
  html += '<div class="onlReadyGrid">';
  const slot = function (p, me) {
    if (!p) return '<div class="onlSlot empty"><div class="onlDot"></div><div class="onlSlotName">Waiting...</div><div class="onlSlotSub">Share the code</div></div>';
    const rdy = me ? onl.myReady : onl.theirReady;
    return '<div class="onlSlot' + (me ? " me" : "") + (rdy ? " ready" : "") + '"><div class="onlDot"></div>' +
      '<div class="onlSlotName">' + onlEscape(p.name) + (me ? " (You)" : "") + '</div>' +
      '<div class="onlSlotSub">' + onlEscape(p.club) + ' - ' + (rdy ? "Ready" : "Not ready") + '</div></div>';
  };
  html += slot({ name: onlMyName(), club: onlMyClub() }, true);
  html += slot(them, false);
  html += '</div>';
  html += '<div class="onlRoomRow" style="margin-top:12px">' +
    '<button class="onlReady' + (onl.myReady ? " on" : "") + '" onclick="onlToggleReady()">' +
    (onl.myReady ? "Cancel Ready" : "Ready Up") + '</button>' +
    '<span class="pvpNote">Both players must be ready. Unranked - no trophies change.</span>' +
    '</div>';
  html += onlChatHTML();
  pane.innerHTML = html;
  onlRenderChat();
}

function onlWatchHTML() {
  return '<div class="onlWatch" id="onlWatch">' +
    '<div class="onlWatchScore" id="onlWatchScore">0 - 0</div>' +
    '<div class="onlWatchClock" id="onlWatchClock">0\'</div>' +
    '<div class="pvpNote" style="margin-top:6px">Live score - the host runs the match.</div>' +
    '</div>';
}

function onlRenderWatch() {
  if (!onl) return;
  const sc = document.getElementById("onlWatchScore");
  const ck = document.getElementById("onlWatchClock");
  if (!sc || !ck) return;
  const me = onl.isHost ? onl.score.blue : onl.score.red;
  const them = onl.isHost ? onl.score.red : onl.score.blue;
  sc.textContent = onlMyClub() + " " + me + " - " + them + " Opponent";
  const t = Math.floor(onl.score.time || 0);
  ck.textContent = t + "'" + (onl.score.half > 1 ? " (2nd half)" : "");
}

function onlDraftHTML() {
  const d = onl.draft;
  if (!d) return '<div class="pvpNote">Preparing the draft...</div>';
  const slot = d.slot || onlDraftSlotFor((d.round || 1) - 1);
  let h = '<div class="pvpNote">Draft round ' + (d.round || 1) + ' of ' + ONL_DRAFT_SLOTS.length + ' - pick a ' + onlEscape(slot.label) + '.</div>';
  h += '<div class="onlDraftGrid">';
  (d.options || []).forEach(function (o, i) {
    const taken = (d.myPick != null) || (d.theirPick != null && d.theirPick === i);
    h += '<div class="onlCard' + (taken ? " taken" : "") + '" onclick="onlDraftPick(' + i + ')">' +
      '<div class="onlCardOvr">' + o.ovr + '</div>' +
      '<div class="onlCardName">' + onlEscape(o.name) + '</div>' +
      '<div class="onlCardPos">' + onlEscape(slot.label) + '</div>' +
      '</div>';
  });
  h += '</div>';
  h += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  // d.me is always the host's XI; d.them is always the guest's XI.
  const mineList = onl.isHost ? d.me : d.them;
  const theirsList = onl.isHost ? d.them : d.me;
  const row = function (label, list) {
    return '<div style="flex:1"><div class="pvpNote" style="margin-bottom:4px">' + label + '</div><div class="onlDraftSlot">' +
      (list && list.length
        ? list.map(function (p) { return '<span class="onlDraftPick">' + p.ovr + ' ' + onlEscape(p.name) + '</span>'; }).join('')
        : '<span class="onlDraftSlot empty">No picks yet</span>') + '</div></div>';
  };
  h += row("Your XI", mineList);
  h += row(onl.isHost ? "Their XI" : "Opponent XI", theirsList);
  h += '</div>';
  return h;
}

function onlChatHTML() {
  return '<div class="onlChatBox"><div class="onlChatHead">Chat</div>' +
    '<div class="onlChatMsgs" id="onlChatMsgs"></div>' +
    '<div class="onlChatRow"><input class="onlChatInput" id="onlChatInput" maxlength="120" placeholder="Type a message" autocomplete="off" onkeydown="if(event.key===\'Enter\'){onlSendChat();}">' +
    '<button onclick="onlSendChat()">Send</button></div></div>';
}

function onlRenderChat() {
  const el = document.getElementById("onlChatMsgs");
  if (!el || !onl) return;
  el.innerHTML = onl.chat.map(function (m) {
    if (m.system) return '<div class="onlChatMsg sys">' + onlEscape(m.text) + '</div>';
    const cls = m.me ? "me" : "them";
    return '<div class="onlChatMsg ' + cls + '"><span class="onlWho">' + onlEscape(m.who || "You") + ':</span> ' + onlEscape(m.text) + '</div>';
  }).join("");
  el.scrollTop = el.scrollHeight;
}

function onlIdleMode() { return window.__onlMode || ONL_MODE_NORMAL; }

function onlSetView(v) { myClubPvpSetView(v); }

function renderMyClubClubTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const roster = TEAM_ROSTERS[selectedTeam];
  const kits = myClubKits(c);
  let html = '<div class="myClubPaneCard myClubCrestHead">' + myClubCrestCanvasHtml(c.clubName, 54) +
    '<div class="myClubCrestMeta"><b>' + escapeHtml(c.clubName) + "</b>" +
    '<span>' + escapeHtml((getMyClubLeague(c.league) || {}).name || "My Club") + " &middot; " + escapeHtml(c.formation || "4-3-3") + "</span>" +
    '<span>Kit: ' + escapeHtml((kits && kits.active === "away") ? "Away" : (kits && kits.active === "third" ? "Secondary" : "Home")) + "</span></div></div>";
  html += '<div class="myClubPaneCard"><h3>Starting XI</h3>';
  if (roster) {
    html += '<div class="myClubXI">';
    for (const s of myClubSlotList()) {
      const pd = getSlotData(roster, s.key);
      html += pd ? '<div class="myClubXICard"><div class="xiOvr">' + calculateOverall(buffedPlayerView(pd, s.role), s.role) + '</div><div class="xiName">' + escapeHtml(pd.name) + '</div><div class="xiRole">' + s.label + '</div></div>' : '<div class="myClubXICard xiEmpty"></div>';
    }
    html += '</div>';
  }
  html += '<div class="myClubActions"><button onclick="myClubShowTab(\'lineup\')">Edit Lineup</button><button class="myClubPlayActionBtn" onclick="myClubPlayRanked()">Play Ranked</button></div></div>';
  const lvlPct = Math.min(100, Math.floor((c.xp || 0) / myClubNextXp(c) * 100));
  html += '<div class="myClubPaneCard"><h3>Club Level</h3>' +
    '<div class="levelLine">Level <b>' + c.level + '</b> &mdash; ' + c.xp + '/' + myClubNextXp(c) + ' XP <span>' + lvlPct + '%</span></div>' +
    '<div class="levelBar"><i style="width:' + lvlPct + '%"></i></div>' +
    '<p class="levelNote">Earn XP from every goal (+' + MY_CLUB_XP.goal + '), win (+' + MY_CLUB_XP.win + ') or draw (+' + MY_CLUB_XP.draw + '). Each level grants coins and a random consumable item.</p></div>';
  html += '<div class="myClubPaneCard"><h3>Economy</h3><p>Win ' + formatMoney(MYCLUB_MATCH.win) + ' / Draw ' + formatMoney(MYCLUB_MATCH.draw) + ' / Goal ' + formatMoney(MYCLUB_MATCH.goal) + '. League title: +' + formatMoney(MYCLUB_TITLE_PRIZE) + '. Spend your budget on packs to grow your club.</p>';
  if (c.trophies > 0) html += '<div class="myClubTrophyRow">Trophies won: ' + c.trophies + ' \u2014 see the Trophies tab</div>';
  const pv = myClubPvpState(c);
  html += '<div class="myClubPaneCard"><h3>Ranked Ladder</h3>' +
    '<p class="pvpNote">My Club is ranked-only now. Every match is a one-vs-one against a generated opponent matched to your trophy count. Wins earn trophies and coins; draws and losses adjust your ladder too. There is no season calendar, cup or European campaign.</p>' +
    '<div class="pvpStatLine">' + myClubPvpDivisionName(myClubPvpDivisionIndex(pv.trophies)) + ' &middot; ' + pv.trophies.toLocaleString() + ' trophies</div>' +
    '<div class="myClubActions"><button onclick="myClubShowTab(\'pvp\')">View Ladder</button><button onclick="myClubPlayRanked()">Find Opponent</button></div></div>';
  html += '</div>';
  myClubTab("myClubTabClub").innerHTML = html;
  paintClubCrests();
}

// --- Daily login reward ---------------------------------------------------
// A seven day cycle that repeats. Coins scale with club level so it stays
// meaningful late on, and the seventh day pays a bonus. Purely additive to the
// career object: dailyClaimDay/dailyStreak are defaulted in
// normalizeClubCareer(), so an existing save picks them up untouched.
const MYCLUB_DAILY_REWARDS = [
  { coins: 25000, xp: 40, label: "25,000 coins" },
  { coins: 40000, xp: 55, label: "40,000 coins" },
  { coins: 60000, xp: 75, label: "60,000 coins" },
  { coins: 90000, xp: 100, label: "90,000 coins" },
  { coins: 130000, xp: 130, label: "130,000 coins" },
  { coins: 180000, xp: 170, label: "180,000 coins" },
  { coins: 300000, xp: 260, label: "300,000 coins + bonus", bonus: true },
];

// Local calendar day as YYYY-MM-DD. Deliberately local, not UTC: the reward
// should reset at the player's own midnight, not theirs in Greenwich.
function myClubDayKey(d) {
  const t = d || new Date();
  const m = String(t.getMonth() + 1);
  const day = String(t.getDate());
  return t.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) + "-" + (day.length < 2 ? "0" + day : day);
}

// Which slot of the seven day cycle a given day falls on. Derived from the date
// so the reward advances on its own without any stored counter to drift out of
// sync with the clock.
function myClubDailySlotFor(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % MYCLUB_DAILY_REWARDS.length;
}

function myClubDailyState(c) {
  if (!c) return null;
  const today = myClubDayKey();
  const yesterday = myClubDayKey(new Date(Date.now() - 86400000));
  const slot = myClubDailySlotFor(today);
  const reward = MYCLUB_DAILY_REWARDS[slot];
  // Coins scale with club level so the reward keeps pace with the economy.
  const level = Math.max(1, c.level || 1);
  const scale = 1 + (level - 1) * 0.12;
  const coins = Math.round(reward.coins * scale / 500) * 500;
  const xp = Math.round(reward.xp * scale);
  const ready = c.dailyClaimDay !== today;
  // Continuing yesterday's streak keeps it alive; a missed day restarts it.
  let streak = c.dailyStreak || 0;
  if (ready && c.dailyClaimDay === yesterday) streak = streak + 1;
  else if (ready) streak = 1;
  else streak = streak;
  const nextReset = new Date();
  nextReset.setHours(24, 0, 0, 0);
  return {
    today, slot, reward, coins, xp, ready, streak,
    nextResetMs: nextReset.getTime() - Date.now(),
  };
}

function myClubClaimDaily() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const st = myClubDailyState(c);
  if (!st || !st.ready) { myClubHomeMsg("Today's reward is already claimed."); return; }
  playerCoins += st.coins;
  c.coins = playerCoins;
  c.xp = (c.xp || 0) + st.xp;
  c.dailyStreak = st.streak;
  c.dailyClaimDay = st.today;
  // Feed the XP through the level-up loop rather than leaving it queued.
  myClubApplyLevelUps(c);
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  renderMyClubHomeTab();
  myClubHomeMsg("Claimed " + formatMoney(st.coins) + " and " + st.xp + " XP." +
    (st.streak > 1 ? " Day " + st.streak + " streak." : ""));
  // Level-ups are surfaced the same way they are after entering the lobby.
  if (pendingLevelUp) {
    showMyClubLevelUp();
    pendingLevelUp = null;
  }
}

// Small transient line under the daily tile. Not persisted - it is feedback
// about the click you just made, not club state.
function myClubHomeMsg(text) {
  const el = document.getElementById("mcHomeMsg");
  if (!el) return;
  el.textContent = text || "";
  el.style.opacity = text ? "1" : "0";
}

function mcCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return (h > 0 ? h + "h " : "") + m + "m " + (ss < 10 ? "0" : "") + ss + "s";
}

// --- Home dashboard -------------------------------------------------------
// A landing screen for the club: what to do next, what is on sale, what you
// own and how the season is going. Deliberately a summary - every tile hands
// off to the tab that actually does the work.
function renderMyClubHomeTab() {
  const pane = myClubTab("myClubTabHome");
  if (!pane) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;

  const roster = TEAM_ROSTERS[selectedTeam];
  const kits = myClubKits(c);
  const league = getMyClubLeague(c.league) || {};
  const lvlPct = Math.min(100, Math.floor((c.xp || 0) / myClubNextXp(c) * 100));

  let html = "";

  // --- hero: crest, name, balance, level -------------------------------
  html += '<div class="mcHero">' +
    '<div class="mcHeroBg"></div>' +
    '<div class="mcHeroCrest">' + myClubCrestCanvasHtml(c.clubName, 64) + '</div>' +
    '<div class="mcHeroMeta">' +
      '<div class="mcHeroEyebrow">' + escapeHtml(league.name || "My Club") + '</div>' +
      '<h2 class="mcHeroName">' + escapeHtml(c.clubName) + '</h2>' +
      '<div class="mcHeroChips">' +
        '<span class="mcChip mcChipCoin">' + formatMoney(playerCoins) + '</span>' +
        '<span class="mcChip">Level ' + c.level + '</span>' +
        '<span class="mcChip">' + escapeHtml(c.formation || "4-3-3") + '</span>' +
        '<span class="mcChip">Kit: ' + escapeHtml((kits && kits.active === "away") ? "Away" : (kits && kits.active === "third" ? "Secondary" : "Home")) + '</span>' +
        (c.trophies > 0 ? '<span class="mcChip mcChipTrophy">' + c.trophies + ' trophies</span>' : '') +
      '</div>' +
      '<div class="mcLevelBar"><i style="width:' + lvlPct + '%"></i></div>' +
      '<div class="mcLevelNote">' + (c.xp || 0) + ' / ' + myClubNextXp(c) + ' XP to level ' + (c.level + 1) + '</div>' +
    '</div>' +
    '<div class="mcHeroPlay">' +
      '<button class="mcBigBtn mcBigBtnPlay" onclick="myClubPlayRanked()">Play Ranked</button>' +
      '<button class="mcBigBtn" onclick="myClubShowTab(\'club\')">Club</button>' +
    '</div>' +
  '</div>';

  // --- quick actions ----------------------------------------------------
  html += '<div class="mcQuickRow">' +
    myClubQuickTile("Squad", "Build your starting XI", "lineup", "mcTileSquad") +
    myClubQuickTile("Store", "Consumables and boosts", "shop", "mcTileShop") +
    myClubQuickTile("Transfer Market", "Buy and sell cards", "market", "mcTileMarket") +
    myClubQuickTile("Goals", "Quests, achievements & rewards", "quests", "mcTileObjectives") +
  '</div>';

  // --- featured packs ---------------------------------------------------
  html += '<div class="myClubPaneCard mcSection"><h3>Featured Packs</h3>' +
    '<p class="mcSectionNote">Five tiers, odds shown on every pack. No pack guarantees a specific named player - the player is drawn at random once the rarity is rolled, and the walkout you see is whoever you actually pulled.</p>' +
    '<div class="mcPackRow">';
  for (const key of ["tier1", "tier2", "tier3", "tier4", "tier5"]) {
    const s = MYCLUB_PACKS[key];
    if (!s) continue;
    const locked = myClubPackLocked(s);
    html += '<div class="mcPackTile ' + (s.css || "packTierBase") + (locked ? " mcLocked" : "") + '">' +
      '<div class="mcPackTier">Tier ' + key.slice(4).toUpperCase() + '</div>' +
      '<div class="mcPackName">' + escapeHtml(s.name) + '</div>' +
      '<div class="mcPackOdds">' + packOddsText(s) + '</div>' +
      (locked
        ? '<div class="mcPackLock">Unlocks at level ' + s.minLevel + '</div>'
        : '<button class="mcPackBuy" onclick="openMyClubPack(\'' + key + '\')">Open ' + formatMoney(s.price) + '</button>') +
      '</div>';
  }
  html += '</div><div class="mcPackAll"><button onclick="myClubShowTab(\'packs\')">All packs</button></div></div>';

  // --- daily reward ----------------------------------------------------
  const st = myClubDailyState(c);
  html += '<div class="myClubPaneCard mcSection"><h3>Daily Reward</h3>' +
    '<div class="mcDaily' + (st.ready ? " mcDailyReady" : "") + '">' +
      '<div class="mcDailyIcon">' + (st.ready ? "🎁" : "✓") + '</div>' +
      '<div class="mcDailyMeta">' +
        '<div class="mcDailyTitle">' + (st.ready ? "Day " + st.streak + " reward ready" : "Claimed today") + '</div>' +
        '<div class="mcDailySub">' + formatMoney(st.coins) + ' + ' + st.xp + ' XP</div>' +
        (st.ready
          ? '<div class="mcDailySub">Resets in ' + mcCountdown(st.nextResetMs) + '</div>'
          : '<div class="mcDailySub">Next reward in ' + mcCountdown(st.nextResetMs) + '</div>') +
      '</div>' +
      (st.ready
        ? '<button class="mcDailyBtn" onclick="myClubClaimDaily()">Claim</button>'
        : '<div class="mcDailyDone">Claimed</div>') +
    '</div>' +
    '<div class="mcStreakRow">';
  for (let i = 0; i < MYCLUB_DAILY_REWARDS.length; i++) {
    const done = i < (st.streak % MYCLUB_DAILY_REWARDS.length) || (!st.ready && i === st.slot);
    html += '<div class="mcStreakDay' + (done ? " done" : "") + (MYCLUB_DAILY_REWARDS[i].bonus ? " bonus" : "") + '">' +
      '<span class="mcStreakN">Day ' + (i + 1) + '</span>' +
      '<span class="mcStreakV">' + formatMoney(MYCLUB_DAILY_REWARDS[i].coins) + '</span>' +
    '</div>';
  }
  html += '</div><div id="mcHomeMsg" class="mcHomeMsg"></div></div>';

  // --- highlighted cards from your own club ----------------------------
  html += '<div class="myClubPaneCard mcSection"><h3>Your Best Cards</h3>';
  const best = (Array.isArray(ownedPool) ? ownedPool.slice() : [])
    .filter(card => card && !card.sentOff)
    .sort((a, b) => myClubCardValue(b) - myClubCardValue(a))
    .slice(0, 6);
  if (best.length) {
    html += '<div class="mcCardRow">' +
      best.map(card => '<div class="mcCardSlot">' + packCardHTML(card, 0) + '</div>').join("") +
    '</div>';
  } else {
    html += '<p class="mcEmpty">No cards in your club yet. Open a pack from the Featured Packs above to get started.</p>';
  }
  html += '<div class="mcPackAll"><button onclick="myClubShowTab(\'transfers\')">Manage squad</button></div></div>';

  // --- ranked ladder summary -------------------------------------------
  const pv = myClubPvpState(c);
  const pvIdx = myClubPvpDivisionIndex(pv.trophies);
  const pvNext = MY_CLUB_PVP_DIVISIONS[pvIdx + 1] || null;
  html += '<div class="myClubPaneCard mcSection"><h3>Ranked</h3>' +
    '<div class="mcFixture"><div class="mcFixtureTag">' + escapeHtml(myClubPvpDivisionName(pvIdx)) + '</div>' +
    '<div class="mcFixtureTeams"><b>' + pv.trophies.toLocaleString() + ' trophies</b></div>' +
    '<div class="mcFixtureInfo">' + (pvNext ? (pvNext.need - pv.trophies) + ' more to ' + escapeHtml(myClubPvpDivisionName(pvIdx + 1)) : 'Top division reached') + '</div>' +
    '<div class="mcPackAll"><button onclick="myClubShowTab(\'pvp\')">Ranked Ladder</button>' +
    '<button onclick="myClubPlayRanked()">Find Opponent</button></div></div>';
  html += '<div class="mcStatRow">' +
    '<div class="mcStat"><span class="mcStatV">' + c.trophies + '</span><span class="mcStatK">Trophies</span></div>' +
    '<div class="mcStat"><span class="mcStatV">' + (Array.isArray(ownedPool) ? ownedPool.length : 0) + '</span><span class="mcStatK">Cards owned</span></div>' +
    '<div class="mcStat"><span class="mcStatV">' + (roster ? "XI" : "-") + '</span><span class="mcStatK">Squad</span></div>' +
    '<div class="mcStat"><span class="mcStatV">' + myClubPvpDivisionName(myClubPvpDivisionIndex(myClubPvpState(c).trophies)) + '</span><span class="mcStatK">PvP division</span></div>' +
  '</div></div>';

  html += '</div>';
  pane.innerHTML = html;
  paintClubCrests();
  if (typeof uiRefreshFocus === "function") uiRefreshFocus();
}

function myClubQuickTile(title, sub, tab, css) {
  const body = '<div class="mcTileTitle">' + escapeHtml(title) + '</div>' +
    '<div class="mcTileSub">' + escapeHtml(sub) + '</div>';
  const inner = '<div class="mcTileInner">' + body + '</div>';
  if (!tab) return '<div class="mcTile ' + css + ' mcTileSoon">' + inner + '<div class="mcTileSoonTag">Soon</div></div>';
  return '<button class="mcTile ' + css + '" onclick="myClubShowTab(\'' + tab + '\')">' + inner + '</button>';
}

// Per-player season & career statistics, keyed on the card's __cid and kept on
// the career object so they persist across seasons and save codes. Each record
// tracks career goals/assists/trophies plus the running season counters; the
// season counters roll over automatically the first time a card is touched in a
// new season, and "seasons played" is derived from the season the card joined.
function myClubPlayerStat(c, cid) {
  if (!c || !cid) return null;
  if (!c.pstat || typeof c.pstat !== "object" || Array.isArray(c.pstat)) c.pstat = {};
  let st = c.pstat[cid];
  if (!st || typeof st !== "object") {
    st = { g: 0, a: 0, t: 0, mp: 0, w: 0, joined: c.season, season: c.season, sg: 0, sa: 0, cg: 0, ca: 0, sv: 0, bk: 0, ssv: 0, sbk: 0, csv: 0, cbk: 0, gc: 0, sgc: 0, cgc: 0 };
    c.pstat[cid] = st;
  }
  if (typeof st.g !== "number" || st.g < 0) st.g = 0;
  if (typeof st.a !== "number" || st.a < 0) st.a = 0;
  if (typeof st.t !== "number" || st.t < 0) st.t = 0;
  if (typeof st.sg !== "number" || st.sg < 0) st.sg = 0;
  if (typeof st.sa !== "number" || st.sa < 0) st.sa = 0;
  if (typeof st.cg !== "number" || st.cg < 0) st.cg = 0;
  if (typeof st.ca !== "number" || st.ca < 0) st.ca = 0;
  if (typeof st.sv !== "number" || st.sv < 0) st.sv = 0;
  if (typeof st.bk !== "number" || st.bk < 0) st.bk = 0;
  if (typeof st.ssv !== "number" || st.ssv < 0) st.ssv = 0;
  if (typeof st.sbk !== "number" || st.sbk < 0) st.sbk = 0;
  if (typeof st.csv !== "number" || st.csv < 0) st.csv = 0;
  if (typeof st.cbk !== "number" || st.cbk < 0) st.cbk = 0;
  if (typeof st.gc !== "number" || st.gc < 0) st.gc = 0;
  if (typeof st.sgc !== "number" || st.sgc < 0) st.sgc = 0;
  if (typeof st.cgc !== "number" || st.cgc < 0) st.cgc = 0;
  if (typeof st.mp !== "number" || st.mp < 0) st.mp = 0;
  if (typeof st.w !== "number" || st.w < 0) st.w = 0;
  if (typeof st.joined !== "number" || st.joined < 1) st.joined = c.season || 1;
  if (typeof st.season !== "number" || st.season < 1) st.season = c.season || 1;
  if (st.season !== c.season) {
    st.season = c.season;
    st.sg = 0;
    st.sa = 0;
    st.cg = 0;
    st.ca = 0;
    st.ssv = 0;
    st.sbk = 0;
    st.csv = 0;
    st.cbk = 0;
    st.sgc = 0;
    st.cgc = 0;
  }
  return st;
}

function myClubPlayerSeasons(c, st) {
  const now = (c && c.season) || 1;
  const joined = (st && st.joined) || now;
  return Math.max(1, now - joined + 1);
}

function myClubCreditPlayerStat(c, live, field, competition) {
  if (!c || !live) return;
  const card = myClubCardForLivePlayer(live);
  if (!card || !card.__cid) return;
  const st = myClubPlayerStat(c, card.__cid);
  if (!st) return;
  const cup = competition === "cl" ? "cl" : "league";
  if (field === "goal") {
    st.g++;
    if (cup === "cl") st.cg++; else st.sg++;
  } else if (field === "assist") {
    st.a++;
    if (cup === "cl") st.ca++; else st.sa++;
  } else if (field === "save") {
    st.sv++;
    if (cup === "cl") st.csv++; else st.ssv++;
  } else if (field === "block") {
    st.bk++;
    if (cup === "cl") st.cbk++; else st.sbk++;
  } else if (field === "concede") {
    st.gc++;
    if (cup === "cl") st.cgc++; else st.sgc++;
  } else if (field === "trophy") {
    st.t++;
  }
  saveMyClubData();
}

function myClubStarterSlots() {
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return [];
  const out = [];
  for (const s of myClubSlotList()) {
    const p = getSlotData(roster, s.key);
    if (p && p.__cid) out.push({ card: p, role: s.role });
  }
  return out;
}

function myClubPickSimCard(slots, weights) {
  if (!slots || !slots.length) return null;
  let total = 0;
  const w = [];
  for (const s of slots) {
    const r = weights[s.role] || 0;
    w.push(r);
    total += r;
  }
  if (total <= 0) return slots[Math.floor(Math.random() * slots.length)].card;
  let roll = Math.random() * total;
  for (let i = 0; i < w.length; i++) {
    roll -= w[i];
    if (roll < 0) return slots[i].card;
  }
  return slots[slots.length - 1].card;
}

// Save/blocks for a goalkeeper in a simulated match, sized by the goals he
// conceded and his own quality: better keepers face the same shots but stop
// more of them. Saves are the on-target shots he keeps out of his net;
// blocks are the off-target strikes, punches and claims that snuff out danger.
function myClubSimKeeperStats(keeper, goalsAgainst) {
  const ovr = calculateOverall(keeper, keeper.role || "goalkeeper");
  const kf = Math.max(0.4, Math.min(1.6, ((ovr || 60) - 60) / 30));
  const shotsAgainst = Math.max(1, poisson(11) + Math.max(0, goalsAgainst || 0));
  const onTarget = Math.max(0, Math.round(shotsAgainst * 0.45));
  const goals = Math.max(0, goalsAgainst || 0);
  const sv = Math.max(0, poisson(Math.max(0, onTarget - goals) * kf));
  const offTarget = Math.max(0, shotsAgainst - onTarget);
  const bk = Math.max(0, Math.round(poisson(0.9) + offTarget * 0.55 * kf));
  return { sv: sv, bk: bk };
}

function myClubCreditSimCard(c, card, field, competition) {
  if (!c || !card || !card.__cid) return;
  const st = myClubPlayerStat(c, card.__cid);
  if (!st) return;
  const cup = competition === "cl" ? "cl" : "league";
  if (field === "goal") {
    st.g++;
    if (cup === "cl") st.cg++; else st.sg++;
  } else if (field === "assist") {
    st.a++;
    if (cup === "cl") st.ca++; else st.sa++;
  } else if (field === "save") {
    st.sv++;
    if (cup === "cl") st.csv++; else st.ssv++;
  } else if (field === "block") {
    st.bk++;
    if (cup === "cl") st.cbk++; else st.sbk++;
  } else if (field === "concede") {
    st.gc++;
    if (cup === "cl") st.cgc++; else st.sgc++;
  }
}

function myClubCreditSimulated(match, competition) {
  if (currentMode !== "myclub" || !myClubLeague) return;
  if (!match || !match.played) return;
  if (match.team1 !== selectedTeam && match.team2 !== selectedTeam) return;
  const career = getMyClubCareer(myClubLeague);
  if (!career) return;
  const mine1 = match.team1 === selectedTeam;
  const goals = mine1 ? match.score1 : match.score2;
  const won = mine1 ? match.score1 > match.score2 : match.score2 > match.score1;
  if (won) myClubRegisterUserWin(career);
  const drew = match.score1 === match.score2;
  const outcome = won ? "win" : (drew ? "draw" : "loss");
  const prize = myClubAward(outcome, typeof goals === "number" ? goals : 0);
  void prize;
  const slots = myClubStarterSlots();
  let credited = false;
  if (typeof goals === "number" && goals >= 1 && slots.length) {
    const scorerW = { attacker: 5, midfielder: 3, defender: 2, goalkeeper: 0 };
    const assistW = { attacker: 3, midfielder: 4, defender: 1, goalkeeper: 0 };
    for (let g = 0; g < goals; g++) {
      const scorer = myClubPickSimCard(slots, scorerW);
      myClubCreditSimCard(career, scorer, "goal", competition);
      credited = true;
      if (Math.random() < 0.75) {
        const partners = slots.filter(s => s.card !== scorer);
        const assist = myClubPickSimCard(partners.length ? partners : slots, assistW);
        myClubCreditSimCard(career, assist, "assist", competition);
      }
    }
  }
  // The goalkeeper's day from the same simulated match: sizes his saves and
  // blocks off how many goals the side facing him put past him.
  const myKeeper = slots.find(s => s.role === "goalkeeper");
  if (myKeeper && myKeeper.card && myKeeper.card.__cid) {
    const against = mine1 ? (match.score2 || 0) : (match.score1 || 0);
    const k = myClubSimKeeperStats(myKeeper.card, against);
    for (let i = 0; i < k.sv; i++) myClubCreditSimCard(career, myKeeper.card, "save", competition);
    for (let i = 0; i < k.bk; i++) myClubCreditSimCard(career, myKeeper.card, "block", competition);
    for (let i = 0; i < against; i++) myClubCreditSimCard(career, myKeeper.card, "concede", competition);
    if (k.sv > 0 || k.bk > 0) credited = true;
  }
  for (const s of slots) {
    if (s.card && s.card.__cid) myClubEvoMatchCredit(career, s.card.__cid, won);
    credited = true;
  }
  if (myClubCreditAiSquadMatch(match, competition, career)) credited = true;
  if (credited) saveMyClubData();
}

// ===== Player Hub - AI player stat tracking =====
function myClubAiStore() {
  if (!myClubCareerData || typeof myClubCareerData !== "object" || Array.isArray(myClubCareerData)) myClubCareerData = { v: 1, careers: {} };
  if (!myClubCareerData.aiStats || typeof myClubCareerData.aiStats !== "object" || Array.isArray(myClubCareerData.aiStats)) myClubCareerData.aiStats = {};
  return myClubCareerData.aiStats;
}

function myClubAiId(p) {
  if (!p) return null;
  if (!p.__aid) p.__aid = "ai_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e7).toString(36);
  return p.__aid;
}

function myClubAiStat(c, p, club) {
  const id = myClubAiId(p);
  if (!id) return null;
  const store = myClubAiStore();
  let st = store[id];
  if (!st || typeof st !== "object") {
    st = { name: p.name || "Player", club: club || "", league: (c && c.league) || "",
      g: 0, a: 0, t: 0, mp: 0, w: 0, joined: (c && c.season) || 1,
      season: (c && c.season) || 1, sg: 0, sa: 0, cg: 0, ca: 0, sv: 0, bk: 0, ssv: 0, sbk: 0, csv: 0, cbk: 0, gc: 0, sgc: 0, cgc: 0 };
    store[id] = st;
  }
  if (typeof st.g !== "number") st.g = 0;
  if (typeof st.a !== "number") st.a = 0;
  if (typeof st.t !== "number") st.t = 0;
  if (typeof st.mp !== "number") st.mp = 0;
  if (typeof st.w !== "number") st.w = 0;
  if (typeof st.sg !== "number") st.sg = 0;
  if (typeof st.sa !== "number") st.sa = 0;
  if (typeof st.cg !== "number") st.cg = 0;
  if (typeof st.ca !== "number") st.ca = 0;
  if (typeof st.sv !== "number") st.sv = 0;
  if (typeof st.bk !== "number") st.bk = 0;
  if (typeof st.ssv !== "number") st.ssv = 0;
  if (typeof st.sbk !== "number") st.sbk = 0;
  if (typeof st.csv !== "number") st.csv = 0;
  if (typeof st.cbk !== "number") st.cbk = 0;
  if (typeof st.gc !== "number") st.gc = 0;
  if (typeof st.sgc !== "number") st.sgc = 0;
  if (typeof st.cgc !== "number") st.cgc = 0;
  if (typeof st.joined !== "number" || st.joined < 1) st.joined = (c && c.season) || 1;
  if (!st.name) st.name = p.name || st.name;
  if (club && st.club !== club) st.club = club;
  if (c && c.league && st.league !== c.league) st.league = c.league;
  if (c && c.season && st.season !== c.season) {
    st.season = c.season;
    st.sg = 0;
    st.sa = 0;
    st.cg = 0;
    st.ca = 0;
    st.ssv = 0;
    st.sbk = 0;
    st.csv = 0;
    st.cbk = 0;
    st.sgc = 0;
    st.cgc = 0;
  }
  return st;
}

function myClubAiSeasons(st) {
  const now = (st && st.season) || 1;
  const joined = (st && st.joined) || now;
  return Math.max(1, now - joined + 1);
}

function myClubEnsureSquad(club, career) {
  const existing = getAiSquad(club);
  if (existing && existing.length) return existing;
  if (!TEAM_ROSTERS[club] && typeof FIFA_RANKINGS[club] !== "number") return null;
  const ctx = career || getMyClubCareer(myClubLeague) || allMyClubCareers()[0] || { season: 1 };
  const sq = buildAiSquad(club, ctx);
  if (sq && sq.length) aiSquadStore()[club] = sq;
  return sq;
}

function myClubCreditAiSquadMatch(match, competition, c) {
  if (!match || !match.played || !match.team1 || !match.team2) return false;
  if (match.aiCredited) return false;
  const career = c || getMyClubCareer(myClubLeague);
  if (!career) return false;
  const mine = String(career.clubName || "").toLowerCase();
  match.aiCredited = true;
  let touched = false;
  const comp = competition === "cl" ? "cl" : "league";
  const scorerW = { attacker: 5, midfielder: 3, defender: 2, goalkeeper: 0 };
  const assistW = { attacker: 3, midfielder: 4, defender: 1, goalkeeper: 0 };
  for (const off of [match.team1, match.team2]) {
    if (String(off).toLowerCase() === mine) continue;
    const sq = myClubEnsureSquad(off, career);
    if (!sq || !sq.length) continue;
    const goals = off === match.team1 ? (match.score1 || 0) : (match.score2 || 0);
    const won = off === match.team1 ? (match.score1 || 0) > (match.score2 || 0) : (match.score2 || 0) > (match.score1 || 0);
    const starters = sq.slice(0, 11).map(p => ({ card: p, role: p.role || "attacker" }));
    for (const s of starters) {
      const st = myClubAiStat(career, s.card, off);
      if (st) { st.mp++; if (won) st.w++; }
    }
    if (starters.length) {
      for (let gi = 0; gi < goals; gi++) {
        const scorer = myClubPickSimCard(starters, scorerW);
        const stc = myClubAiStat(career, scorer, off);
        if (stc) { stc.g++; if (comp === "cl") stc.cg++; else stc.sg++; }
        if (Math.random() < 0.75) {
          const partners = starters.filter(s => s.card !== scorer);
          const assist = myClubPickSimCard(partners.length ? partners : starters, assistW);
          const sta = myClubAiStat(career, assist, off);
          if (sta) { sta.a++; if (comp === "cl") sta.ca++; else sta.sa++; }
        }
      }
    }
    // The side facing them scored this many, which drives their keeper's
    // simulated saves and blocks the same way it does for your own keeper.
    const keeper = starters.find(s => s.role === "goalkeeper");
    if (keeper && keeper.card) {
      const face = off === match.team1 ? (match.score2 || 0) : (match.score1 || 0);
      const k = myClubSimKeeperStats(keeper.card, face);
      const stk = myClubAiStat(career, keeper.card, off);
      if (stk) {
        for (let i = 0; i < k.sv; i++) { stk.sv++; if (comp === "cl") stk.csv++; else stk.ssv++; }
        for (let i = 0; i < k.bk; i++) { stk.bk++; if (comp === "cl") stk.cbk++; else stk.sbk++; }
        for (let i = 0; i < face; i++) { stk.gc++; if (comp === "cl") stk.cgc++; else stk.sgc++; }
      }
    }
    if (starters.length) touched = true;
  }
  return touched;
}

// ===== Player Hub - browsing =====
let myClubHubRows = [];
let myClubHubActive = [];
let myClubHubFilter = { q: "", league: "", sort: "ovr" };
let myClubHubTemp = null;

function myClubLeagueName(code) {
  for (const lg of MYCLUB_LEAGUES) {
    if (lg.short === code || lg.name === code) return lg.name;
  }
  return code || "";
}

function myClubHubTempSquad(club) {
  const real = getAiSquad(club);
  if (real && real.length) return real;
  if (!myClubHubTemp) myClubHubTemp = {};
  if (!myClubHubTemp[club]) {
    const ctx = getMyClubCareer(myClubLeague) || allMyClubCareers()[0] || { season: 1 };
    myClubHubTemp[club] = buildAiSquad(club, ctx);
  }
  return myClubHubTemp[club];
}

function myClubHubClubPool(c) {
  if (!c) return [];
  if (myClubLeague === c.league && c.clubName === selectedTeam) return Array.isArray(ownedPool) ? ownedPool : [];
  try {
    const raw = localStorage.getItem(clubStorageKey(c.clubName));
    if (raw) {
      const o = JSON.parse(raw);
      if (o && Array.isArray(o.pool)) return o.pool;
    }
  } catch (e) {}
  const out = [];
  const roster = TEAM_ROSTERS[c.clubName];
  if (roster) {
    for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
      const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
      for (const p of arr) {
        if (p && p.name) out.push(p);
      }
    }
  }
  return out;
}

function myClubHubBuildRows() {
  const rows = [];
  const mineSeen = {};
  for (const c of allMyClubCareers()) {
    mineSeen[c.clubName] = true;
    const pool = myClubHubClubPool(c);
    for (const p of pool) {
      if (!p || !p.name || !p.__cid) continue;
      const st = myClubPlayerStat(c, p.__cid);
      rows.push({
        id: "u_" + p.__cid, name: p.name, club: c.clubName, league: c.league,
        leagueName: myClubLeagueName(c.league),
        pos: p.pos || myClubFallbackPos(p.role || "attacker"),
        role: p.role || "attacker", tag: p.tag || "", nation: p.nation,
        age: p.age, ovr: Math.round(calculateOverall(p, p.role || "attacker")),
        isUser: true, career: c, st: st, cid: p.__cid,
        seasons: myClubPlayerSeasons(c, st), pot: myClubPlayerPotential(p)
      });
    }
  }
  for (const lg of MYCLUB_LEAGUES) {
    for (const club of lg.clubs) {
      if (mineSeen[club]) continue;
      const sq = myClubHubTempSquad(club);
      if (!sq) continue;
      const c = getMyClubCareer(lg.short);
      for (const p of sq) {
        if (!p || !p.name) continue;
        const st = myClubAiStat(c || null, p, club);
        rows.push({
          id: "a_" + myClubAiId(p), name: p.name, club: club, league: lg.short,
          leagueName: lg.name,
          pos: p.pos || myClubFallbackPos(p.role || "attacker"),
          role: p.role || "attacker", tag: p.tag || "", nation: p.nation,
          age: p.age, ovr: Math.round(aiSquadOvr(p)),
          isUser: false, st: st, seasons: myClubAiSeasons(st)
        });
      }
    }
  }
  return rows;
}

function renderMyClubHubTab() {
  const pane = document.getElementById("myClubTabHub");
  if (!pane) return;
  myClubHubRows = myClubHubBuildRows();
  const leagueOptions = '<option value="">All leagues</option>' + MYCLUB_LEAGUES.map(lg =>
    '<option value="' + escapeHtml(lg.short) + '"' + (myClubHubFilter.league === lg.short ? " selected" : "") + '>' +
    escapeHtml(lg.name) + '</option>').join("");
  const sortOptions =
    '<option value="ovr"' + (myClubHubFilter.sort === "ovr" ? " selected" : "") + '>Sort: OVR</option>' +
    '<option value="name"' + (myClubHubFilter.sort === "name" ? " selected" : "") + '>Sort: Name</option>' +
    '<option value="goals"' + (myClubHubFilter.sort === "goals" ? " selected" : "") + '>Sort: Goals</option>';
  let html = '<div class="myClubPaneCard"><div class="hubHead"><h3>Player Hub</h3>' +
    '<span class="hubSub">Every player in every league - click a player to open their profile</span></div>' +
    '<div class="hubToolbar">' +
      '<input id="hubSearch" class="hubSearch" type="text" maxlength="40" placeholder="Search players..." value="' + escapeHtml(myClubHubFilter.q) + '" oninput="myClubHubApply()" />' +
      '<select id="hubLeague" class="hubSelect" onchange="myClubHubApply()">' + leagueOptions + '</select>' +
      '<select id="hubSort" class="hubSelect" onchange="myClubHubApply()">' + sortOptions + '</select>' +
      '<button class="hubRefresh" onclick="myClubHubRefresh()">Refresh</button>' +
    '</div></div>';
  html += '<div class="myClubPaneCard"><div id="hubResults"></div></div>';
  pane.innerHTML = html;
  myClubHubRender();
}

function myClubHubGrab() {
  const q = document.getElementById("hubSearch");
  if (q) myClubHubFilter.q = q.value;
  const lg = document.getElementById("hubLeague");
  if (lg) myClubHubFilter.league = lg.value;
  const so = document.getElementById("hubSort");
  if (so) myClubHubFilter.sort = so.value;
}

function myClubHubApply() {
  myClubHubGrab();
  myClubHubRender();
}

function myClubHubRefresh() {
  myClubHubGrab();
  myClubHubRows = myClubHubBuildRows();
  myClubHubRender();
}

function myClubHubRender() {
  const host = document.getElementById("hubResults");
  if (!host) return;
  const q = (myClubHubFilter.q || "").toLowerCase();
  let rows = myClubHubRows;
  if (q) rows = rows.filter(r => r.name.toLowerCase().indexOf(q) !== -1);
  if (myClubHubFilter.league) rows = rows.filter(r => r.league === myClubHubFilter.league);
  rows = rows.slice();
  if (myClubHubFilter.sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
  else if (myClubHubFilter.sort === "goals") rows.sort((a, b) => ((b.st && b.st.g) || 0) - ((a.st && a.st.g) || 0));
  else rows.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  myClubHubActive = rows;
  let html = '<div class="hubGridHeader"><span>POS</span><span>Player</span><span>Club</span><span>Lg</span><span>OVR</span><span>Season</span></div>';
  if (!rows.length) {
    html += '<div class="hubEmpty">No players match your search. Try a different name or league.</div>';
  } else {
    html += '<div class="hubRows">';
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const sg = (r.st && r.st.sg) || 0;
      const sa = (r.st && r.st.sa) || 0;
      html += '<div class="hubRow" onclick="myClubHubOpen(' + i + ')" title="Open ' + escapeHtml(r.name) + '\'s profile">' +
        '<span class="hubPos">' + escapeHtml(r.pos || "-") + '</span>' +
        '<span class="hubName">' + escapeHtml(r.name) + (r.isUser ? '<i class="hubMe" title="Your club"></i>' : "") + '</span>' +
        '<span class="hubClub">' + escapeHtml(r.club) + '</span>' +
        '<span class="hubLeague">' + escapeHtml(r.league || "-") + '</span>' +
        '<span class="hubOvr">' + (r.ovr || 0) + '</span>' +
        '<span class="hubStat">' + sg + 'G ' + sa + 'A</span>' +
      '</div>';
    }
    html += '</div>';
  }
  host.innerHTML = html;
}

function myClubHubScanAwards(name) {
  const out = [];
  for (const league in myClubCareerData.careers) {
    const list = myClubCareerData.careers[league];
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      const n = normalizeClubCareer(c, league);
      const wins = myClubAwardsForPlayer(n, name);
      for (const a of wins) out.push(a);
    }
  }
  return out.sort((a, b) => (b.season || 0) - (a.season || 0));
}

function myClubHubStatCell(label, value) {
  return '<div class="cardInfoSeasonCell"><b>' + value + '</b><span>' + escapeHtml(label) + '</span></div>';
}

function myClubHubProfileContent(r) {
  document.getElementById("hubBadge").className = "cardInfoBadge " + cardTierClass(r, r.ovr);
  document.getElementById("hubBadge").textContent = (r.tag && String(r.tag)) || (r.isUser ? cardTypeLabel(r) : "Player");
  document.getElementById("hubName").textContent = r.name;
  const meta = document.getElementById("hubMeta");
  if (meta) {
    meta.innerHTML =
      '<span><b>POS</b> ' + escapeHtml(r.pos || "-") + '</span>' +
      '<span class="ms"><b>OVR</b> ' + (r.ovr || 0) + '</span>' +
      (r.pot ? '<span class="ms"><b>POT</b> ' + r.pot + '</span>' : "") +
      '<span class="ms"><b>NATION</b> ' + escapeHtml(r.nation || "-") + '</span>' +
      '<span class="ms"><b>AGE</b> ' + (typeof r.age === "number" ? r.age : "-") + '</span>' +
      '<span class="ms"><b>CLUB</b> ' + escapeHtml(r.club) + '</span>' +
      '<span class="ms"><b>LG</b> ' + escapeHtml(r.leagueName || r.league || "-") + '</span>';
  }
  const st = r.st || {};
  const now = r.isUser && r.career ? r.career.season : (st.season || 1);
  document.getElementById("hubSeasonTitle").textContent = "This Season - Season " + now;
  const seas = document.getElementById("hubSeason");
  if (seas) seas.innerHTML = (r.role === "goalkeeper")
    ? myClubHubStatCell("League Saves", st.ssv || 0) +
      myClubHubStatCell("League Blocks", st.sbk || 0) +
      myClubHubStatCell("League Conceded", st.sgc || 0) +
      myClubHubStatCell("Euro Saves", st.csv || 0) +
      myClubHubStatCell("Euro Blocks", st.cbk || 0) +
      myClubHubStatCell("Euro Conceded", st.cgc || 0)
    : myClubHubStatCell("League Goals", st.sg || 0) +
      myClubHubStatCell("League Assists", st.sa || 0) +
      myClubHubStatCell("Euro Goals", st.cg || 0) +
      myClubHubStatCell("Euro Assists", st.ca || 0);
  const car = document.getElementById("hubCareer");
  if (car) car.innerHTML = (r.role === "goalkeeper")
    ? myClubHubStatCell("Career Saves", st.sv || 0) +
      myClubHubStatCell("Career Blocks", st.bk || 0) +
      myClubHubStatCell("Career Conceded", st.gc || 0) +
      myClubHubStatCell("Appearances", st.mp || 0) +
      myClubHubStatCell("Wins", st.w || 0) +
      myClubHubStatCell("Trophies", st.t || 0) +
      myClubHubStatCell("Seasons", r.seasons || 1)
    : myClubHubStatCell("Career Goals", st.g || 0) +
      myClubHubStatCell("Career Assists", st.a || 0) +
      myClubHubStatCell("Appearances", st.mp || 0) +
      myClubHubStatCell("Wins", st.w || 0) +
      myClubHubStatCell("Trophies", st.t || 0) +
      myClubHubStatCell("Seasons", r.seasons || 1);
  const wins = r.isUser ? myClubAwardsForPlayer(r.career, r.name) : myClubHubScanAwards(r.name);
  const aw = document.getElementById("hubAwards");
  if (aw) {
    if (wins.length) {
      aw.innerHTML = wins.map(a =>
        '<div class="cardInfoAwardRow"><span class="cardInfoAwardMedal"></span>' +
        '<span class="cardInfoAwardName">' + escapeHtml(myClubAwardLabel(a.type)) + '</span>' +
        '<span class="cardInfoAwardMeta">' + escapeHtml(a.competition || "") + ' \u00b7 S' + a.season + '</span>' +
        '<span class="cardInfoAwardStat">' + a.goals + 'G ' + a.assists + 'A</span></div>').join("");
    } else {
      aw.innerHTML = '<div class="hubNone">No individual awards on record yet.</div>';
    }
  }
  const cl = document.getElementById("hubClub");
  if (cl) {
    if (r.isUser && r.career && Array.isArray(r.career.trophyCabinet)) {
      const ty = ["league", "champions", "cup", "supercup", "uefasuper", "cwc"];
      const joined = (st.joined || 1);
      const tros = r.career.trophyCabinet.filter(t => t && ty.indexOf(t.type) !== -1 && t.season >= joined);
      if (tros.length) {
        cl.innerHTML = tros.slice().sort((a, b) => (b.season || 0) - (a.season || 0)).map(t =>
          '<div class="cardInfoAwardRow"><span class="hubTrophyDot ' + escapeHtml(t.type) + '"></span>' +
          '<span class="cardInfoAwardName">' + escapeHtml(t.competition || MYCLUB_TROPHY_LABELS[t.type] || "Trophy") + '</span>' +
          '<span class="cardInfoAwardMeta">Season ' + t.season + '</span></div>').join("");
      } else {
        cl.innerHTML = '<div class="hubNone">No trophies won while at ' + escapeHtml(r.club) + '.</div>';
      }
    } else {
      cl.innerHTML = '<div class="hubNone">Club honours are tracked for your own players only.</div>';
    }
  }
  document.getElementById("hubModal").style.display = "flex";
}

function myClubHubOpen(idx) {
  const r = myClubHubActive[idx];
  if (!r) return;
  myClubHubProfileContent(r);
}

function closeHubModal() {
  document.getElementById("hubModal").style.display = "none";
}

// ===== Player potential =====
// Every player has a capped overall ("potential") they can reach through
// training and evolutions. The cap comes from the card's rarity tag, so a
// bronze/bad player can never be trained into a top player.
const MYCLUB_POT_CEILINGS = {
  MAX: 99, LEGEND: 99, SUPERSTAR: 99, CUSTOM: 99,
  ICON: 97, SPECIAL: 96, HERO: 94,
  GOLD: 91, PROSPECT: 90,
  SILVER: 85, BRONZE: 80
};
const MYCLUB_POT_DEFAULT_BOOST = 10;

function myClubPotentialForOvr(card, ovr) {
  const t = String(card && card.tag ? card.tag : "").toUpperCase();
  if (MYCLUB_POT_CEILINGS[t] !== undefined) return MYCLUB_POT_CEILINGS[t];
  return Math.min(99, ovr + MYCLUB_POT_DEFAULT_BOOST);
}

function myClubPlayerPotential(card) {
  if (!card) return 99;
  const ovr = calculateOverall(card, card.role || "attacker");
  if (typeof card.pot === "number" && card.pot >= ovr && card.pot <= 99) return card.pot;
  const pot = Math.max(ovr, Math.min(99, myClubPotentialForOvr(card, ovr)));
  card.pot = pot;
  return pot;
}

function myClubPotWeights(card) {
  return OVERALL_WEIGHTS[card.role || "attacker"] || OVERALL_WEIGHTS.midfielder;
}

function myClubPotSum(card) {
  const weights = myClubPotWeights(card);
  let sum = 0;
  for (const k of MYCLUB_TRAIN_STAT_KEYS) sum += (typeof card[k] === "number" ? card[k] : 0) * (weights[k] || 0);
  return sum;
}

// Overall room left for growth (0 = at full potential).
function myClubPotRoom(card) {
  return Math.max(0, Math.floor(myClubPlayerPotential(card) + 0.5 - myClubPotSum(card)));
}

// How many points a single stat can still gain without exceeding the potential.
function myClubPotStatRoom(card, key) {
  const cur = typeof card[key] === "number" ? card[key] : 0;
  if (cur >= 99) return 0;
  const w = myClubPotWeights(card)[key] || 0;
  if (w <= 0) return 99 - cur;
  return Math.max(0, Math.min(99 - cur, Math.floor((myClubPlayerPotential(card) + 0.5 - myClubPotSum(card)) / w)));
}

// ===== Player development =====
const MYCLUB_TRAIN_STAT_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"];
const MYCLUB_TRAIN_LABELS = { pace: "PAC", shooting: "SHO", passing: "PAS", dribbling: "DRI", defending: "DEF", physical: "PHY" };

// Trainers are bought from the Shop and each works a fixed number of in-game
// days on the up-to-three players assigned to it. They specialise, so a
// Finishing Coach lifts SHO and nothing else. Gains are only applied when the
// session's end-day is reached (the "overtime" - nothing is instant).
const MYCLUB_TRAINERS = {
  pace:      { id: "pace",      name: "Sprint Coach",    mark: "SP", stats: ["pace"],                    cost: 250000,  days: 5, gain: 2, tint: "#3f8cff" },
  shooting:  { id: "shooting",  name: "Finishing Coach", mark: "FI", stats: ["shooting"],                cost: 350000,  days: 5, gain: 2, tint: "#ff6b6b" },
  passing:   { id: "passing",   name: "Playmaker Coach", mark: "PM", stats: ["passing"],                 cost: 400000,  days: 5, gain: 2, tint: "#40c9a2" },
  dribbling: { id: "dribbling", name: "Skills Coach",    mark: "SK", stats: ["dribbling"],               cost: 450000,  days: 5, gain: 2, tint: "#c084fc" },
  defending: { id: "defending", name: "Defensive Coach", mark: "DF", stats: ["defending"],               cost: 500000,  days: 6, gain: 2, tint: "#f4a261" },
  physical:  { id: "physical",  name: "Fitness Coach",   mark: "FT", stats: ["physical"],                cost: 400000,  days: 6, gain: 2, tint: "#e9c46a" },
  allround:  { id: "allround",  name: "Head Coach",      mark: "HC", stats: ["pace", "shooting", "passing", "dribbling", "defending", "physical"], cost: 2500000, days: 8, gain: 1, tint: "#ffd54f" }
};
const MYCLUB_TRAINER_IDS = ["pace", "shooting", "passing", "dribbling", "defending", "physical", "allround"];
const MYCLUB_TRAINER_CAP = 3;

// Attribute Traits replace the old Evolution system. Each trait has up to three
// levels and permanently lifts one stat (or every stat, for the rare Complete
// trait). A card can hold at most three different traits and they can never be
// removed. Traits also raise the card's sell value on top of the stat gain.
const MYCLUB_TRAITS = {
  pace:      { key: "pace",      stat: "pace",      short: "PAC", labels: ["Rapid+", "Rapid++", "Rapid+++"],                          bonus: [2, 4, 7] },
  shooting:  { key: "shooting",  stat: "shooting",  short: "SHO", labels: ["Clinical I", "Clinical II", "Clinical III"],              bonus: [2, 4, 7] },
  passing:   { key: "passing",   stat: "passing",   short: "PAS", labels: ["Passing+", "Passing++", "Passing+++"],                    bonus: [2, 4, 7] },
  dribbling: { key: "dribbling", stat: "dribbling", short: "DRI", labels: ["Trickster I", "Trickster II", "Trickster III"],           bonus: [2, 4, 7] },
  defending: { key: "defending", stat: "defending", short: "DEF", labels: ["Defensive Wall I", "Defensive Wall II", "Defensive Wall III"], bonus: [2, 4, 7] },
  physical:  { key: "physical",  stat: "physical",  short: "PHY", labels: ["Tank I", "Tank II", "Tank III"],                          bonus: [2, 4, 7] },
  complete:  { key: "complete",  stat: "all",       short: "ALL", labels: ["Complete I", "Complete II", "Complete III"],              bonus: [1, 2, 3] }
};
const MYCLUB_TRAIT_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical", "complete"];
const MYCLUB_TRAIT_MAX_PER_CARD = 3;
const MYCLUB_TRAIT_VALUE_PCT = 0.12;

// Quests reset every season (claim once per season); achievements are one-time.
// Progress is read from the running club counters kept on the career.
const MYCLUB_QUESTS = [
  { id: "q_play10",  name: "Match Fitness",  desc: "Play 10 ranked matches.",      metric: "played",  target: 10, reward: { coins: 500000,  xp: 150 } },
  { id: "q_win5",    name: "Winning Habit",   desc: "Win 5 ranked matches.",        metric: "won",     target: 5,  reward: { coins: 750000,  xp: 200, traits: ["passing"] } },
  { id: "q_goals25", name: "Goal Machine",    desc: "Score 25 goals in ranked matches.", metric: "goals",   target: 25, reward: { coins: 800000,  xp: 200, traits: ["shooting"] } },
  { id: "q_cs5",     name: "Brick Wall",      desc: "Keep 5 clean sheets in ranked matches.", metric: "cs",      target: 5,  reward: { coins: 600000,  xp: 150, traits: ["defending"] } },
  { id: "q_packs5",  name: "Pack Hunter",     desc: "Open 5 packs.",                metric: "packs",   target: 5,  reward: { coins: 400000,  xp: 120 } },
  { id: "q_train8",  name: "Extra Sessions",  desc: "Complete 8 player training gains.", metric: "trained", target: 8,  reward: { coins: 500000,  xp: 150, traits: ["physical"] } },
  { id: "q_pvp5",    name: "Ladder Climber",  desc: "Win 5 ranked matches (ladder).", metric: "pvpWins", target: 5,  reward: { coins: 1000000, xp: 250, traits: ["pace"] } },
  { id: "q_traits3", name: "Trait Collector", desc: "Apply 3 Attribute Traits.",     metric: "traits",  target: 3,  reward: { coins: 750000,  xp: 200, traits: ["dribbling"] } }
];

const MYCLUB_ACHIEVEMENTS = [
  { id: "a_first",    name: "First Steps",       desc: "Play your first ranked match.",   metric: "played",   target: 1,   reward: { coins: 100000,  xp: 50 } },
  { id: "a_wins25",   name: "Twenty-Five Wins",  desc: "Win 25 ranked matches.",    metric: "won",      target: 25,  reward: { coins: 1500000, xp: 400, traits: ["passing"] } },
  { id: "a_goals100", name: "Century Club",      desc: "Score 100 goals in ranked matches.", metric: "goals",    target: 100, reward: { coins: 2000000, xp: 500, traits: ["shooting", "pace"] } },
  { id: "a_level10",  name: "Rising Club",       desc: "Reach club level 10.",     metric: "level",    target: 10,  reward: { coins: 1500000, xp: 0,   traits: ["complete"] } },
  { id: "a_cards50",  name: "Deep Squad",        desc: "Own 50 player cards.",     metric: "cards",    target: 50,  reward: { coins: 1000000, xp: 250 } },
  { id: "a_pvp_div1", name: "Top of the Ladder", desc: "Reach PvP Division X.",    metric: "divTop",   target: 1,   reward: { coins: 2500000, xp: 600, traits: ["pace", "passing"] } },
  { id: "a_trophy",   name: "Silverware",        desc: "Reach 500 PvP trophies.", metric: "trophies", target: 500, reward: { coins: 1500000, xp: 300, traits: ["defending"] } },
  { id: "a_traits9",  name: "Traits Master",     desc: "Apply 9 Attribute Traits.", metric: "traits",  target: 9,   reward: { coins: 2500000, xp: 600, traits: ["complete", "complete"] } }
];

let myClubTrainTrSelTrainer = null;
let myClubTrainTrSel = [];
let myClubTraitCardCid = null;

// ---- Trainer state, sessions and the day they resolve on -------------------
function myClubTrainerState(c) {
  if (!c.trainers || typeof c.trainers !== "object" || Array.isArray(c.trainers)) c.trainers = {};
  if (!c.trainers.owned || typeof c.trainers.owned !== "object" || Array.isArray(c.trainers.owned)) c.trainers.owned = {};
  if (!c.trainers.sessions || typeof c.trainers.sessions !== "object" || Array.isArray(c.trainers.sessions)) c.trainers.sessions = {};
  if (typeof c.trainers.log !== "string") c.trainers.log = "";
  return c.trainers;
}

function myClubStats(c) {
  if (!c.stats || typeof c.stats !== "object" || Array.isArray(c.stats)) c.stats = {};
  for (const k of ["played", "won", "drawn", "lost", "goals", "conceded", "cs", "packs", "trained", "traits", "pvpWins"]) {
    if (typeof c.stats[k] !== "number" || !isFinite(c.stats[k])) c.stats[k] = 0;
  }
  return c.stats;
}

function myClubStatAdd(c, key, inc) {
  const st = myClubStats(c);
  st[key] = (st[key] || 0) + (inc == null ? 1 : inc);
  return st[key];
}

function myClubTrainerById(id) { return MYCLUB_TRAINERS[id] || null; }

function myClubTrainerOwned(c, id) { return !!(c && myClubTrainerState(c).owned[id]); }

function myClubTrainerSession(c, id) {
  const tr = myClubTrainerState(c);
  const s = tr.sessions[id];
  return (s && typeof s === "object") ? s : null;
}

// A single player's gain from a trainer session. Respects 99 and the card's
// potential, so a maxed player simply gains nothing.
function myClubTrainerGain(card, trainer) {
  const changes = [];
  for (const stat of trainer.stats) {
    const cur = typeof card[stat] === "number" ? card[stat] : 0;
    const gain = Math.min(trainer.gain, myClubPotStatRoom(card, stat), 99 - cur);
    if (gain > 0) {
      card[stat] = Math.min(99, cur + gain);
      changes.push(MYCLUB_TRAIN_LABELS[stat] + "+" + gain);
    }
  }
  return changes;
}

// Lazy resolution: any session whose end-day has been reached pays out. Called
// from the header refresh and the training tab, so a session finishes whether or
// not the tab is open. A season rollover simply drops an unfinished session.
function myClubProcessTrainers(c) {
  if (!c || currentMode !== "myclub") return false;
  const tr = myClubTrainerState(c);
  const day = myClubCurrentDay(c);
  let changed = false;
  for (const id of Object.keys(tr.sessions)) {
    const s = tr.sessions[id];
    if (!s || typeof s !== "object" || s.season !== c.season) { delete tr.sessions[id]; changed = true; continue; }
    if (day < (s.endDay || 0)) continue;
    const trainer = myClubTrainerById(id);
    const lines = [];
    let gains = 0;
    for (const cid of (Array.isArray(s.cids) ? s.cids : [])) {
      const card = (typeof ownedPool !== "undefined" && Array.isArray(ownedPool)) ? ownedPool.find(p => p.__cid === cid) : null;
      if (!card) continue;
      const ch = myClubTrainerGain(card, trainer);
      if (ch.length) { gains++; myClubCopyCardStatsToRoster(cid); lines.push(card.name + " (" + ch.join(", ") + ")"); }
    }
    delete tr.sessions[id];
    changed = true;
    if (gains > 0) {
      myClubStatAdd(c, "trained", gains);
      tr.log = (trainer ? trainer.name : "Trainer") + " finished: " + lines.join("; ") + ".";
    } else {
      tr.log = (trainer ? trainer.name : "Trainer") + " session finished - no room left to gain.";
    }
  }
  if (changed) {
    c.coins = playerCoins;
    saveClubState();
    saveMyClubData();
  }
  return changed;
}

// ---- Attribute Traits ------------------------------------------------------
function myClubTraitInv(c) {
  if (!c.traitInv || typeof c.traitInv !== "object" || Array.isArray(c.traitInv)) c.traitInv = {};
  return c.traitInv;
}

function myClubCardTraits(card) {
  if (!card.traits || typeof card.traits !== "object" || Array.isArray(card.traits)) card.traits = {};
  return card.traits;
}

function myClubTraitLabel(key, level) {
  const t = MYCLUB_TRAITS[key];
  if (!t || !level) return "";
  return t.labels[Math.min(level, t.labels.length) - 1] || t.key;
}

function myClubGrantTraitToken(c, key) {
  const inv = myClubTraitInv(c);
  if (!key || !MYCLUB_TRAITS[key]) {
    const pool = MYCLUB_TRAIT_KEYS.filter(k => k !== "complete");
    key = Math.random() < 0.08 ? "complete" : pickRand(pool);
  }
  inv[key] = (inv[key] || 0) + 1;
  return key;
}

function myClubTraitOwnedCount(c) {
  const inv = myClubTraitInv(c);
  let n = 0;
  for (const k of MYCLUB_TRAIT_KEYS) n += (inv[k] || 0);
  return n;
}

function myClubMetricValue(c, metric) {
  const st = myClubStats(c);
  switch (metric) {
    case "level": return c.level || 1;
    case "cards": return (typeof ownedPool !== "undefined" && Array.isArray(ownedPool)) ? ownedPool.length : (st.cards || 0);
    case "trophies": return c.trophies || 0;
    case "divTop": return (myClubPvpDivisionIndex(myClubPvpState(c).trophies) >= MY_CLUB_PVP_DIVISIONS.length - 1) ? 1 : 0;
    default: return st[metric] || 0;
  }
}

function myClubQuestState(c) {
  if (!c.quests || typeof c.quests !== "object" || Array.isArray(c.quests)) c.quests = {};
  if (!c.quests.claimed || typeof c.quests.claimed !== "object" || Array.isArray(c.quests.claimed)) c.quests.claimed = {};
  if (typeof c.quests.season !== "number" || c.quests.season < 1) c.quests.season = c.season;
  if (c.quests.season !== c.season) { c.quests.season = c.season; c.quests.claimed = {}; }
  return c.quests;
}

function myClubAchState(c) {
  if (!c.achievements || typeof c.achievements !== "object" || Array.isArray(c.achievements)) c.achievements = {};
  return c.achievements;
}

function myClubGrantReward(c, reward) {
  if (!c || !reward) return "";
  const bits = [];
  if (reward.coins) { playerCoins += reward.coins; c.coins = playerCoins; bits.push(formatMoney(reward.coins) + " coins"); }
  if (reward.xp) { c.xp = (typeof c.xp === "number" ? c.xp : 0) + reward.xp; myClubApplyLevelUps(c); bits.push(reward.xp + " XP"); }
  if (Array.isArray(reward.traits)) {
    for (const key of reward.traits) { const got = myClubGrantTraitToken(c, key); bits.push(myClubTraitLabel(got, 1) + " token"); }
  }
  saveClubState();
  saveMyClubData();
  if (typeof myClubRefreshHeader === "function") myClubRefreshHeader();
  return bits.join(", ");
}

function myClubEnsureSquadCids() {
  const roster = TEAM_ROSTERS[selectedTeam];
  let changed = false;
  const seen = {};
  for (const p of ownedPool) if (p && p.__cid) seen[p.__cid] = true;
  const assign = p => {
    if (!p) return;
    if (!p.__cid) {
      p.__cid = "mc" + (++myClubCardSeq);
      while (seen[p.__cid]) p.__cid = "mc" + (++myClubCardSeq);
    }
    if (!seen[p.__cid]) { seen[p.__cid] = true; ownedPool.push(p); changed = true; }
  };
  if (roster) {
    for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
      const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
      for (const p of arr) assign(p);
    }
  }
  if (changed) saveClubState();
}

function myClubCopyCardStatsToRoster(cid) {
  const roster = TEAM_ROSTERS[selectedTeam];
  const src = ownedPool.find(p => p.__cid === cid);
  if (!roster || !src) return;
  for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
    const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
    for (const p of arr) {
      if (p && p.__cid === cid) {
        for (const k of MYCLUB_TRAIN_STAT_KEYS) p[k] = src[k];
      }
    }
  }
}

function myClubTrainerBuy(id) {
  const c = getMyClubCareer(myClubLeague);
  const t = myClubTrainerById(id);
  if (!c || !t) return;
  loadClubStateFor(selectedTeam);
  const tr = myClubTrainerState(c);
  if (tr.owned[id]) { myClubLobbyMsg(t.name + " is already on your staff."); renderMyClubTrainingTab(); return; }
  if (playerCoins < t.cost) { myClubLobbyMsg("Not enough coins - " + t.name + " costs " + formatMoney(t.cost) + "."); renderMyClubTrainingTab(); return; }
  playerCoins -= t.cost;
  c.coins = playerCoins;
  tr.owned[id] = true;
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  myClubLobbyMsg("Hired " + t.name + " for " + formatMoney(t.cost) + ".");
  renderMyClubTrainingTab();
}

function myClubTrainerSelect(id) {
  const c = getMyClubCareer(myClubLeague);
  const t = myClubTrainerById(id);
  if (!c || !t) return;
  if (!myClubTrainerOwned(c, id)) { myClubLobbyMsg(t.name + " is not on your staff yet."); return; }
  if (myClubTrainerSession(c, id)) { myClubLobbyMsg(t.name + " already has a session running."); renderMyClubTrainingTab(); return; }
  myClubTrainTrSelTrainer = (myClubTrainTrSelTrainer === id) ? null : id;
  myClubTrainTrSel = [];
  renderMyClubTrainingTab();
}

function myClubTrainerCancel(id) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const tr = myClubTrainerState(c);
  if (tr.sessions[id]) { delete tr.sessions[id]; saveMyClubData(); myClubLobbyMsg("Session cancelled."); }
  renderMyClubTrainingTab();
}

function myClubTrToggle(cid) {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !myClubTrainTrSelTrainer) return;
  loadClubStateFor(selectedTeam);
  myClubEnsureSquadCids();
  const i = myClubTrainTrSel.indexOf(cid);
  if (i !== -1) { myClubTrainTrSel.splice(i, 1); renderMyClubTrainingTab(); return; }
  if (myClubTrainTrSel.length >= MYCLUB_TRAINER_CAP) { myClubLobbyMsg("A coach can work with up to " + MYCLUB_TRAINER_CAP + " players at a time."); return; }
  const card = ownedPool.find(p => p.__cid === cid);
  if (!card) return;
  const tr = myClubTrainerState(c);
  for (const id in tr.sessions) { if ((tr.sessions[id].cids || []).indexOf(cid) !== -1) { myClubLobbyMsg(card.name + " is already training with another coach."); return; } }
  if (myClubPotRoom(card) < 1) { myClubLobbyMsg(card.name + " is already at max potential."); renderMyClubTrainingTab(); return; }
  myClubTrainTrSel.push(cid);
  renderMyClubTrainingTab();
}

function myClubTrStart() {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !myClubTrainTrSelTrainer) return;
  loadClubStateFor(selectedTeam);
  const t = myClubTrainerById(myClubTrainTrSelTrainer);
  const tr = myClubTrainerState(c);
  if (!t || !tr.owned[myClubTrainTrSelTrainer]) return;
  if (tr.sessions[myClubTrainTrSelTrainer]) { myClubLobbyMsg(t.name + " already has a session running."); return; }
  if (!myClubTrainTrSel.length) { myClubLobbyMsg("Assign at least one player."); return; }
  const day = myClubCurrentDay(c);
  tr.sessions[t.id] = { cids: myClubTrainTrSel.slice(), assignDay: day, endDay: day + t.days, season: c.season };
  myClubTrainTrSel = [];
  myClubTrainTrSelTrainer = null;
  saveMyClubData();
  myClubLobbyMsg(t.name + " starts training " + tr.sessions[t.id].cids.length + " player(s) - ready on day " + (day + t.days) + ".");
  renderMyClubTrainingTab();
}

function renderMyClubTrainingTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) { myClubTab("myClubTabTraining").innerHTML = '<div class="myClubPaneCard"><p>Start a My Club career (My Club mode) to train your squad.</p></div>'; return; }
  loadClubStateFor(selectedTeam);
  myClubEnsureSquadCids();
  if (currentMode === "myclub") myClubProcessTrainers(c);
  const tr = myClubTrainerState(c);
  const day = myClubCurrentDay(c);
  let html = '<div class="lineupMsg" id="trainMsg"></div>';
  html += '<div class="myClubPaneCard"><h3>Training Ground</h3>' +
    '<p>Hire specialist coaches, then assign up to ' + MYCLUB_TRAINER_CAP + ' players to each. A coach works <b>overtime</b>: gains land only when the session\u2019s end day arrives, so nothing is instant. Today is day ' + day + ' \u00b7 Season ' + c.season + '.</p>' +
    (tr.log ? '<div class="trainNote">' + escapeHtml(tr.log) + '</div>' : '') +
    '</div>';

  const owned = MYCLUB_TRAINER_IDS.filter(id => tr.owned[id]);
  html += '<div class="myClubPaneCard"><h3>Your Coaches (' + owned.length + ')</h3>';
  if (!owned.length) {
    html += '<p class="friendlyQuiet">No coaches yet. Hire one below to start developing your squad.</p>';
  } else {
    html += '<div class="trainGrid">';
    for (const id of owned) {
      const t = myClubTrainerById(id);
      const s = myClubTrainerSession(c, id);
      const sel = myClubTrainTrSelTrainer === id;
      const statList = t.stats.map(k => MYCLUB_TRAIN_LABELS[k] || k).join(" \u00b7 ");
      html += '<div class="trainCard trOwned' + (sel ? " sel" : "") + '" style="--club:' + (t.tint || "#168cff") + '"' + (s ? "" : ' onclick="myClubTrainerSelect(\'' + id + '\')"') + '>' +
        '<div class="tcTop"><span class="trMark">' + t.mark + '</span><span class="tcPot">+' + t.gain + '</span></div>' +
        '<div class="tcName">' + escapeHtml(t.name) + '</div>' +
        '<div class="trStats">' + escapeHtml(statList) + '</div>' +
        (s
          ? '<div class="trSlot">' + s.cids.length + '/' + MYCLUB_TRAINER_CAP + ' players \u00b7 ' + Math.max(0, s.endDay - day) + 'd left</div>' +
            '<div class="tcFoot"><button class="trMini" onclick="event.stopPropagation();myClubTrainerCancel(\'' + id + '\')">Cancel</button></div>'
          : '<div class="tcFoot">' + (sel ? "ASSIGNING - pick players" : "Tap to assign players") + '</div>') +
        '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  if (myClubTrainTrSelTrainer) {
    const t = myClubTrainerById(myClubTrainTrSelTrainer);
    const byOvr = a => calculateOverall(a, a.role || "attacker");
    const pool = ownedPool.slice().filter(Boolean).sort((a, b) => byOvr(b) - byOvr(a));
    html += '<div class="myClubPaneCard"><h3>' + escapeHtml(t.name) + ' \u2014 pick players (' + myClubTrainTrSel.length + '/' + MYCLUB_TRAINER_CAP + ')</h3><div class="trainGrid">';
    for (const card of pool) {
      if (!card || !card.__cid) continue;
      const ovr = byOvr(card);
      const pot = myClubPlayerPotential(card);
      const capped = pot <= ovr;
      const inSel = myClubTrainTrSel.indexOf(card.__cid) !== -1;
      html += '<div class="trainCard' + (inSel ? " sel" : "") + (capped ? " capped" : "") + ' ' + cardTierClass(card, ovr) + '" style="--club:' + (teamColors[selectedTeam] || "#168cff") + '"' +
        (capped ? "" : ' onclick="myClubTrToggle(\'' + card.__cid + '\')"') + '>' +
        '<div class="tcTop"><span class="tcOvr">' + ovr + '</span><span class="tcPot">POT ' + pot + '</span><span class="tcPos">' + escapeHtml(card.pos || myClubFallbackPos(card.role) || card.role) + '</span></div>' +
        '<div class="tcName">' + escapeHtml(card.name) + '</div>' +
        '<div class="tcStats">' + lineupStatBars(card) + '</div>' +
        '<div class="tcFoot">' + (capped ? "AT MAX POTENTIAL" : (inSel ? "SELECTED" : "TRAINABLE")) + '</div>' +
        '</div>';
    }
    html += '</div>';
    html += '<div class="myClubActions"><button onclick="myClubTrStart()">Start Session (' + myClubTrainTrSel.length + '/' + MYCLUB_TRAINER_CAP + ')</button>' +
      '<button onclick="myClubTrainerSelect(\'' + myClubTrainTrSelTrainer + '\')">Cancel</button></div></div>';
  }

  html += '<div class="myClubPaneCard"><h3>Hire a Coach</h3><div class="trainGrid">';
  for (const id of MYCLUB_TRAINER_IDS) {
    const t = myClubTrainerById(id);
    if (owned.indexOf(id) !== -1) continue;
    const afford = playerCoins >= t.cost;
    const statList = t.stats.map(k => MYCLUB_TRAIN_LABELS[k] || k).join(" \u00b7 ");
    html += '<div class="trainCard trBuyCard' + (afford ? "" : " capped") + '" style="--club:' + (t.tint || "#168cff") + '">' +
      '<div class="tcTop"><span class="trMark">' + t.mark + '</span><span class="tcPot">+' + t.gain + '</span></div>' +
      '<div class="tcName">' + escapeHtml(t.name) + '</div>' +
      '<div class="trStats">' + escapeHtml(statList) + ' \u00b7 ' + t.days + ' days/session</div>' +
      '<div class="tcFoot">' +
        (afford
          ? '<button class="trMini buy" onclick="myClubTrainerBuy(\'' + id + '\')">Hire ' + formatMoney(t.cost) + '</button>'
          : 'Needs ' + formatMoney(t.cost)) +
      '</div></div>';
  }
  html += '</div></div>';

  myClubTab("myClubTabTraining").innerHTML = html;
}

// ===== Attribute Traits =====
function myClubTraitSelectCard(cid) {
  myClubTraitCardCid = cid || null;
  renderMyClubTraitsTab();
}

function myClubTraitApply(cid, key) {
  const c = getMyClubCareer(myClubLeague);
  const t = MYCLUB_TRAITS[key];
  if (!c || !t) return;
  loadClubStateFor(selectedTeam);
  const card = ownedPool.find(p => p.__cid === cid);
  if (!card) { myClubLobbyMsg("Select a player first."); return; }
  const inv = myClubTraitInv(c);
  if (!inv[key]) { myClubLobbyMsg("No " + myClubTraitLabel(key, 1) + " token in your inventory."); return; }
  const traits = myClubCardTraits(card);
  const lvl = traits[key] || 0;
  if (lvl >= t.labels.length) { myClubLobbyMsg(card.name + " already has the highest " + t.short + " trait."); return; }
  const distinct = Object.keys(traits).filter(k => traits[k] > 0).length;
  if (lvl === 0 && distinct >= MYCLUB_TRAIT_MAX_PER_CARD) {
    myClubLobbyMsg(card.name + " already has " + MYCLUB_TRAIT_MAX_PER_CARD + " traits - they are permanent and can't be removed.");
    return;
  }
  inv[key] = inv[key] - 1;
  if (inv[key] <= 0) delete inv[key];
  const prev = lvl > 0 ? (t.bonus[lvl - 1] || 0) : 0;
  const next = t.bonus[Math.min(lvl, t.bonus.length - 1)];
  const delta = Math.max(0, next - prev);
  traits[key] = lvl + 1;
  const stats = t.stat === "all" ? MYCLUB_TRAIN_STAT_KEYS : [t.stat];
  for (const stat of stats) card[stat] = Math.min(99, (typeof card[stat] === "number" ? card[stat] : 0) + delta);
  myClubCopyCardStatsToRoster(cid);
  myClubStatAdd(c, "traits", 1);
  c.coins = playerCoins;
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  myClubLobbyMsg(card.name + " gained " + myClubTraitLabel(key, lvl + 1) + " (+" + delta + " " + (t.stat === "all" ? "to every stat" : MYCLUB_TRAIN_LABELS[t.stat]) + ").");
  renderMyClubTraitsTab();
}

function renderMyClubTraitsTab() {
  const el = myClubTab("myClubTabTraits");
  if (!el) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) { el.innerHTML = '<div class="myClubPaneCard"><p>Start a My Club career (My Club mode) to develop traits.</p></div>'; return; }
  loadClubStateFor(selectedTeam);
  myClubEnsureSquadCids();
  const inv = myClubTraitInv(c);
  const invKeys = MYCLUB_TRAIT_KEYS.filter(k => inv[k] > 0);
  const byOvr = a => calculateOverall(a, a.role || "attacker");
  const pool = ownedPool.slice().filter(p => p && p.__cid).sort((a, b) => myClubCardValue(b) - myClubCardValue(a));
  if (!myClubTraitCardCid || !pool.some(p => p.__cid === myClubTraitCardCid)) myClubTraitCardCid = pool.length ? pool[0].__cid : null;
  const card = pool.find(p => p.__cid === myClubTraitCardCid) || null;

  let html = '<div class="lineupMsg" id="traitMsg"></div>';
  html += '<div class="myClubPaneCard"><h3>Attribute Traits</h3>' +
    '<p>Traits are permanent and <b>can never be removed</b>. Each player can hold at most ' + MYCLUB_TRAIT_MAX_PER_CARD + ' different traits, and each trait has up to three levels (' + escapeHtml(MYCLUB_TRAITS.passing.labels[0]) + ', ' + escapeHtml(MYCLUB_TRAITS.passing.labels[1]) + '\u2026). Traits boost a player\u2019s stats and raise the card\u2019s sell price. Earn trait tokens from quests, achievements, club level-ups and ranked wins.</p>' +
    '<div class="trainNote">Trait tokens ready: <b>' + myClubTraitOwnedCount(c) + '</b></div></div>';

  html += '<div class="myClubPaneCard"><h3>Token Inventory</h3>';
  if (!invKeys.length) {
    html += '<p class="friendlyQuiet">No trait tokens yet. Complete quests and achievements (Goals menu) to earn some.</p>';
  } else {
    html += '<div class="traitInvGrid">';
    for (const key of invKeys) {
      const t = MYCLUB_TRAITS[key];
      html += '<div class="traitInvCard"><div class="traitInvTop"><span class="traitChip">' + escapeHtml(t.short) + '</span><b>' + escapeHtml(t.labels[0]) + '</b><span class="traitCount">\u00d7' + inv[key] + '</span></div>' +
        '<div class="traitInvSub">' + escapeHtml(t.stat === "all" ? "Every stat" : MYCLUB_TRAIN_LABELS[t.stat]) + ' \u00b7 up to ' + escapeHtml(t.labels[t.labels.length - 1]) + '</div>' +
        (card ? '<button class="trMini buy" onclick="myClubTraitApply(\'' + card.__cid + '\',\'' + key + '\')">Apply to ' + escapeHtml(card.name.split(" ").slice(-1)[0]) + '</button>' : '<div class="traitInvSub">Pick a player first</div>') +
        '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  html += '<div class="myClubPaneCard"><h3>Apply To A Player</h3>';
  if (!pool.length) {
    html += '<p class="friendlyQuiet">No cards in your club yet.</p></div>';
    el.innerHTML = html;
    return;
  }
  html += '<div class="traitPickRow"><label>Player</label><select id="traitCardSel" onchange="myClubTraitSelectCard(this.value)">' +
    pool.map(p => '<option value="' + p.__cid + '"' + (p.__cid === myClubTraitCardCid ? " selected" : "") + '>' + escapeHtml(p.name) + ' \u00b7 ' + byOvr(p) + ' OVR</option>').join("") +
    '</select></div>';
  if (card) {
    const traits = myClubCardTraits(card);
    const keys = Object.keys(traits).filter(k => traits[k] > 0);
    html += '<div class="traitOnCard">';
    if (!keys.length) html += '<span class="traitNone">No traits yet</span>';
    else for (const key of keys) html += '<span class="traitBadge" title="' + escapeHtml(MYCLUB_TRAITS[key].stat === "all" ? "Every stat" : MYCLUB_TRAIN_LABELS[MYCLUB_TRAITS[key].stat]) + '">' + escapeHtml(myClubTraitLabel(key, traits[key])) + '</span>';
    html += '</div>';
    html += '<div class="tcStats" style="max-width:420px">' + lineupStatBars(card) + '</div>';
    html += '<div class="traitSlots">Trait slots used: <b>' + keys.length + '/' + MYCLUB_TRAIT_MAX_PER_CARD + '</b></div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// Match-stat credit kept for quest progress (players' season/career counters).
function myClubEvoMatchCredit(c, cid, won) {
  if (!c || !cid) return;
  const st = myClubPlayerStat(c, cid);
  if (!st) return;
  st.mp++;
  if (won) st.w++;
}

function myClubCreditLiveProfile(c, won) {
  if (!c) return;
  let credited = false;
  for (const s of myClubStarterSlots()) {
    if (s.card && s.card.__cid) { myClubEvoMatchCredit(c, s.card.__cid, won); credited = true; }
  }
  if (credited) saveMyClubData();
}

// ===== Quests & Achievements =====
function myClubProgressBar(cur, target) {
  const pct = Math.min(100, Math.round((cur || 0) / target * 100));
  return '<div class="evoQuest"><span class="eqKey">Progress</span><div class="eqBar"><i style="width:' + pct + '%"></i></div><b class="eqVal">' + Math.min(cur, target) + '/' + target + '</b></div>';
}

function myClubRewardLabel(reward) {
  if (!reward) return "";
  const bits = [];
  if (reward.coins) bits.push(formatMoney(reward.coins));
  if (reward.xp) bits.push(reward.xp + " XP");
  if (Array.isArray(reward.traits)) for (const k of reward.traits) bits.push(myClubTraitLabel(k, 1) + " token");
  return bits.join(" + ");
}

function myClubClaimQuest(id) {
  const c = getMyClubCareer(myClubLeague);
  const q = c ? MYCLUB_QUESTS.find(x => x.id === id) : null;
  if (!c || !q) return;
  const qs = myClubQuestState(c);
  if (qs.claimed[id]) { myClubLobbyMsg("Already claimed."); renderMyClubQuestsTab(); return; }
  if (myClubMetricValue(c, q.metric) < q.target) { myClubLobbyMsg("Objective not complete yet."); return; }
  qs.claimed[id] = true;
  const got = myClubGrantReward(c, q.reward);
  myClubLobbyMsg(q.name + " complete: " + got + "!");
  renderMyClubQuestsTab();
}

function renderMyClubQuestsTab() {
  const el = myClubTab("myClubTabQuests");
  if (!el) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) { el.innerHTML = '<div class="myClubPaneCard"><p>Start a My Club career to take on quests.</p></div>'; return; }
  const qs = myClubQuestState(c);
  let html = '<div class="lineupMsg" id="questMsg"></div>';
  html += '<div class="myClubPaneCard"><h3>Quests \u2014 Ranked</h3><p>Quests track your ranked progress. Complete the objective, then claim the reward.</p></div>';
  html += '<div class="questList">';
  for (const q of MYCLUB_QUESTS) {
    const cur = myClubMetricValue(c, q.metric);
    const done = cur >= q.target;
    const claimed = !!qs.claimed[q.id];
    html += '<div class="questRow' + (claimed ? " done" : (done ? " ready" : "")) + '">' +
      '<div class="questMeta"><div class="questName">' + escapeHtml(q.name) + '</div><div class="questDesc">' + escapeHtml(q.desc) + '</div>' +
      '<div class="questReward">Reward: ' + escapeHtml(myClubRewardLabel(q.reward)) + '</div></div>' +
      '<div class="questRight">' + myClubProgressBar(cur, q.target) +
      (claimed ? '<div class="questTag">CLAIMED</div>' : (done ? '<button class="trMini buy" onclick="myClubClaimQuest(\'' + q.id + '\')">Claim</button>' : '<div class="questTag pending">In progress</div>')) +
      '</div></div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

function myClubClaimAchievement(id) {
  const c = getMyClubCareer(myClubLeague);
  const a = c ? MYCLUB_ACHIEVEMENTS.find(x => x.id === id) : null;
  if (!c || !a) return;
  const ach = myClubAchState(c);
  if (ach[id]) { myClubLobbyMsg("Achievement already unlocked."); renderMyClubAchievementsTab(); return; }
  if (myClubMetricValue(c, a.metric) < a.target) { myClubLobbyMsg("Achievement not unlocked yet."); return; }
  ach[id] = c.season;
  const got = myClubGrantReward(c, a.reward);
  myClubLobbyMsg(a.name + " unlocked: " + got + "!");
  renderMyClubAchievementsTab();
}

function renderMyClubAchievementsTab() {
  const el = myClubTab("myClubTabAchievements");
  if (!el) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) { el.innerHTML = '<div class="myClubPaneCard"><p>Start a My Club career to unlock achievements.</p></div>'; return; }
  const ach = myClubAchState(c);
  let html = '<div class="lineupMsg" id="achMsg"></div>';
  html += '<div class="myClubPaneCard"><h3>Achievements</h3><p>One-time milestones for your club. Unlock them for coins, XP and rare trait tokens.</p></div>';
  html += '<div class="questList">';
  for (const a of MYCLUB_ACHIEVEMENTS) {
    const cur = myClubMetricValue(c, a.metric);
    const done = cur >= a.target;
    const claimed = !!ach[a.id];
    html += '<div class="questRow' + (claimed ? " done" : (done ? " ready" : "")) + '">' +
      '<div class="questMeta"><div class="questName">' + escapeHtml(a.name) + '</div><div class="questDesc">' + escapeHtml(a.desc) + '</div>' +
      '<div class="questReward">Reward: ' + escapeHtml(myClubRewardLabel(a.reward)) + '</div>' +
      (claimed ? '<div class="questDesc">Unlocked in Season ' + ach[a.id] + '</div>' : '') + '</div>' +
      '<div class="questRight">' + myClubProgressBar(Math.min(cur, a.target), a.target) +
      (claimed ? '<div class="questTag">UNLOCKED</div>' : (done ? '<button class="trMini buy" onclick="myClubClaimAchievement(\'' + a.id + '\')">Claim</button>' : '<div class="questTag pending">Locked</div>')) +
      '</div></div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

function aiDealRow(d) {
  return '<div class="aiDealRow" data-nav><div class="aiDealPlayer"><b>' + escapeHtml(d.player) + '</b>' +
    '<span class="aiDealMeta"> ' + escapeHtml(d.pos || "") + ' ' + (d.ovr || 0) + ' OVR \u00b7 ' + d.age + ' yrs</span></div>' +
    '<div class="aiDealMove">' + escapeHtml(d.from) + ' \u2192 ' + escapeHtml(d.to) + '</div>' +
    '<div class="aiDealFee">' + (d.fee && d.fee > 0 ? formatMoney(d.fee) : "Free") +
    (d.contract ? ' \u00b7 to Season ' + d.contract : "") + '</div></div>';
}

function renderMyClubTransfersTab() {
  const el = myClubTab("myClubTabTransfers");
  if (!el) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) {
    el.innerHTML = '<div class="myClubPaneCard"><h3>Transfers</h3><p class="friendlyQuiet">Start a My Club career to follow AI transfers across the league.</p></div>';
    return;
  }
  const news = Array.isArray(c.transferNews) ? c.transferNews : [];
  const windowSeason = typeof c.transferWindowSeason === "number" ? c.transferWindowSeason : -1;
  let h = '<div class="myClubPaneCard"><h3>Summer Transfer Window' + (windowSeason > 0 ? " - Season " + windowSeason : "") + '</h3>';
  if (!news.length) {
    h += '<p class="friendlyQuiet">No end-of-season transfers recorded yet. Finish your season to open the window - AI clubs buy, sell and sign players, so squads and league form evolve.</p>';
  } else {
    h += '<div class="aiTransferGroup"><div class="aiTransferGroupTitle">Headline Signings</div>' +
      news.filter(d => d && d.type === "signing").map(aiDealRow).join("") + '</div>';
    h += '<div class="aiTransferGroup"><div class="aiTransferGroupTitle">Academy & Youth Intakes</div>' +
      news.filter(d => d && d.type === "youth").map(aiDealRow).join("") + '</div>';
    const retired = news.filter(d => d && d.type === "retired");
    if (retired.length) {
      h += '<div class="aiTransferGroup"><div class="aiTransferGroupTitle">Retirements</div>' +
        retired.map(d => '<div class="aiDealRow aiDealRowGrey" data-nav><div class="aiDealPlayer"><b>' + escapeHtml(d.player) + '</b>' +
          '<span class="aiDealMeta"> ' + escapeHtml(d.pos || "") + ' ' + (d.ovr || 0) + ' OVR \u00b7 ' + d.age + ' yrs</span></div>' +
          '<div class="aiDealMove">' + escapeHtml(d.from) + ' \u2192 ' + escapeHtml(d.to) + '</div><div class="aiDealFee"></div></div>').join("") + '</div>';
    }
    h += '<p class="friendlyQuiet">Top clubs poach talent from lower sides, sellers restock from the academy, and transfers shift each club\u2019s average rating next season.</p>';
  }
  h += '</div>';
  el.innerHTML = h;
}

function myClubAwardTrophy(c, type, extra) {
  if (!c || !type) return;
  if (!Array.isArray(c.trophyCabinet)) c.trophyCabinet = [];
  c.trophyCabinet.push(Object.assign({ type: type, season: c.season }, extra || {}));
  if (type === "league" || type === "champions" || type === "cup" || type === "supercup" || type === "uefasuper" || type === "cwc") {
    const seen = {};
    const grant = p => {
      if (!p || !p.__cid || seen[p.__cid]) return;
      seen[p.__cid] = true;
      const st = myClubPlayerStat(c, p.__cid);
      if (st) st.t++;
    };
    for (const p of ownedPool) grant(p);
    const roster = TEAM_ROSTERS[c.clubName];
    if (roster) {
      for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
        const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
        for (const p of arr) grant(p);
      }
    }
    saveMyClubData();
  }
}

const MYCLUB_TROPHY_LABELS = {
  league: "League Champions",
  champions: "UEFA Title",
  cup: "Domestic Cup Winners",
  supercup: "Domestic Super Cup Winners",
  uefasuper: "UEFA Super Cup Winners",
  cwc: "Club World Cup Winners"
};

const MYCLUB_INDIVIDUAL_AWARD_DEFS = {
  ballon: { name: "Ballon d'Or", scope: "league", metric: "ga", competition: "All Leagues",
    description: "Best player with the most goal contributions that season." },
  golden_shoe: { name: "European Golden Shoe", scope: "league", metric: "g", competition: "All Leagues",
    description: "Player with the most goals scored that season." },
  pichichi: { name: "Pichichi Trophy", scope: "league", metric: "g", league: "LA", competition: "La Liga",
    description: "Player with the most goals scored in La Liga that season." },
  pl_pots: { name: "Premier League Player of the Season", scope: "league", metric: "ga", league: "PL", competition: "Premier League",
    description: "Best goal contributions in the Premier League that season." },
  laliga_pots: { name: "La Liga Player of the Season", scope: "league", metric: "ga", league: "LA", competition: "La Liga",
    description: "Best goal contributions in La Liga that season." },
  bundesliga_pots: { name: "Bundesliga Player of the Season", scope: "league", metric: "ga", league: "BL", competition: "Bundesliga",
    description: "Best goal contributions in the Bundesliga that season." },
  seriea_pots: { name: "Serie A Player of the Season", scope: "league", metric: "ga", league: "SA", competition: "Serie A",
    description: "Best goal contributions in Serie A that season." },
  ligue1_pots: { name: "Ligue 1 Player of the Season", scope: "league", metric: "ga", league: "LI", competition: "Ligue 1",
    description: "Best goal contributions in Ligue 1 that season." },
  cl_top_scorer: { name: "Champions League Top Scorer", scope: "cl", metric: "g", competition: "UEFA Champions League",
    description: "Most goals in the Champions League that season." },
  cl_pots: { name: "Champions League Player of the Season", scope: "cl", metric: "ga", competition: "UEFA Champions League",
    description: "Best goal contributions in the Champions League that season." }
};

const MYCLUB_AWARD_LEAGUE_POOLS = [
  { code: "PL", name: "Premier League", pool: MYCLUB_PL_PLAYERS },
  { code: "LA", name: "La Liga", pool: MYCLUB_LALIGA_PLAYERS },
  { code: "BL", name: "Bundesliga", pool: MYCLUB_BUNDESLIGA_PLAYERS },
  { code: "SA", name: "Serie A", pool: MYCLUB_SERIEA_PLAYERS },
  { code: "LI", name: "Ligue 1", pool: MYCLUB_LIGUE1_PLAYERS }
];

function myClubAwardGoalRates(role) {
  if (role === "attacker") return { g: 0.55, a: 0.3 };
  if (role === "midfielder") return { g: 0.26, a: 0.42 };
  if (role === "defender") return { g: 0.08, a: 0.12 };
  return { g: 0.004, a: 0.01 };
}

function myClubAwardSyntheticStat(role, ovr, matches) {
  const rate = myClubAwardGoalRates(role);
  const factor = Math.max(0.35, ((ovr || 75) - 60) / 34);
  return {
    goals: poisson(rate.g * matches * factor),
    assists: poisson(rate.a * matches * factor)
  };
}

function myClubUserAwardEntries(c, scope) {
  const out = [];
  if (!c || !c.pstat || typeof c.pstat !== "object") return out;
  const nameByCid = {};
  const note = p => { if (p && p.__cid && !nameByCid[p.__cid]) nameByCid[p.__cid] = p.name; };
  for (const p of ownedPool) note(p);
  const roster = TEAM_ROSTERS[c.clubName];
  if (roster) {
    for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
      const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
      for (const p of arr) note(p);
    }
  }
  for (const cid in c.pstat) {
    const name = nameByCid[cid];
    if (!name) continue;
    const st = c.pstat[cid];
    if (!st || typeof st !== "object") continue;
    out.push({
      name: name,
      goals: scope === "cl" ? (st.cg || 0) : (st.sg || 0),
      assists: scope === "cl" ? (st.ca || 0) : (st.sa || 0)
    });
  }
  return out;
}

function myClubUserPlayerNames(c) {
  const names = {};
  const note = p => { if (p && p.name) names[String(p.name).toLowerCase()] = true; };
  for (const p of ownedPool) note(p);
  const roster = TEAM_ROSTERS[c && c.clubName];
  if (roster) {
    for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
      const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
      for (const p of arr) note(p);
    }
  }
  return names;
}

function myClubAwardCandidatePool(c, scope) {
  const pool = [];
  const byName = {};
  const push = (name, team, leagueCode, goals, assists) => {
    if (!name) return;
    const key = name.toLowerCase();
    const existing = byName[key];
    if (existing) {
      if (goals + assists > existing.goals + existing.assists) {
        existing.goals = goals;
        existing.assists = assists;
        existing.team = team;
        existing.league = leagueCode;
      }
      return;
    }
    const entry = { name: name, team: team, league: leagueCode, goals: goals, assists: assists };
    byName[key] = entry;
    pool.push(entry);
  };
  const matches = scope === "cl" ? 12 : 36;
  for (const lp of MYCLUB_AWARD_LEAGUE_POOLS) {
    for (const p of (lp.pool || [])) {
      const s = myClubAwardSyntheticStat(p.role, p.ovr, matches);
      push(p.name, lp.name, lp.code, s.goals, s.assists);
    }
  }
  if (c) {
    for (const e of myClubUserAwardEntries(c, scope)) {
      push(e.name, c.clubName, c.league, e.goals, e.assists);
    }
  }
  if (c) {
    const courses = myClubLeagueClubs(c);
    for (const club of courses) {
      if (!club || String(club).toLowerCase() === String(c.clubName).toLowerCase()) continue;
      const sq = getAiSquad(club);
      if (!sq || !sq.length) continue;
      for (const p of sq) {
        if (!p || !p.name) continue;
        const st = myClubAiStat(c, p, club);
        if (!st) continue;
        const useCl = scope === "cl";
        push(p.name, club, c.league, useCl ? (st.cg || 0) : (st.sg || 0), useCl ? (st.ca || 0) : (st.sa || 0));
      }
    }
  }
  return pool;
}

function myClubAwardIdsForScope(scope) {
  if (scope === "cl") return ["cl_top_scorer", "cl_pots"];
  return ["ballon", "golden_shoe", "pl_pots", "laliga_pots", "pichichi", "bundesliga_pots", "seriea_pots", "ligue1_pots"];
}

function myClubSettleIndividualAwards(c, scope) {
  if (!c) return [];
  if (scope !== "cl") scope = "league";
  if (!Array.isArray(c.awards)) c.awards = [];
  if (c.awards.some(a => a && a.season === c.season && a.scope === scope)) return [];
  const pool = myClubAwardCandidatePool(c, scope);
  if (!pool.length) return [];
  const metricValue = (e, metric) => metric === "g" ? e.goals : e.goals + e.assists;
  const settled = [];
  for (const id of myClubAwardIdsForScope(scope)) {
    const def = MYCLUB_INDIVIDUAL_AWARD_DEFS[id];
    if (!def) continue;
    let best = null;
    for (const e of pool) {
      if (def.league && e.league !== def.league) continue;
      if (!best) { best = e; continue; }
      const bv = metricValue(best, def.metric), ev = metricValue(e, def.metric);
      if (ev > bv || (ev === bv && e.goals > best.goals)) best = e;
    }
    if (!best) continue;
    const entry = {
      type: id, scope: scope, season: c.season, player: best.name,
      team: best.team, goals: best.goals, assists: best.assists, competition: def.competition
    };
    c.awards.push(entry);
    settled.push(entry);
  }
  if (settled.length) saveMyClubData();
  return settled;
}

function myClubAwardsForPlayer(c, name) {
  if (!c || !Array.isArray(c.awards) || !name) return [];
  const key = String(name).toLowerCase();
  return c.awards.filter(a => a && a.player && String(a.player).toLowerCase() === key);
}

function myClubAwardLabel(type) {
  const def = MYCLUB_INDIVIDUAL_AWARD_DEFS[type];
  return def ? def.name : "Individual Award";
}

function myClubTrophySummaryChip(label, value) {
  return '<div class="trophyChip"><span class="trophyChipValue">' + value + '</span><span class="trophyChipLabel">' + escapeHtml(label) + '</span></div>';
}

function renderMyClubTrophiesTab() {
  const pane = document.getElementById("myClubTabTrophies");
  if (!pane) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) { pane.innerHTML = ""; return; }
  const cabinet = Array.isArray(c.trophyCabinet) ? c.trophyCabinet : [];
  const trophyTypes = ["league", "champions", "cup", "supercup", "uefasuper", "cwc"];
  const trophies = cabinet.filter(e => e && trophyTypes.indexOf(e.type) !== -1);
  const awards = cabinet.filter(e => e && trophyTypes.indexOf(e.type) === -1);
  const leagueCount = trophies.filter(e => e.type === "league").length;
  const clCount = trophies.filter(e => e.type === "champions" || e.type === "cwc").length;
  const cupCount = trophies.filter(e => e.type === "cup").length;
  const superCount = trophies.filter(e => e.type === "supercup").length;
  const uefaSuperCount = trophies.filter(e => e.type === "uefasuper").length;
  let html = '<div class="myClubPaneCard"><h3>' + escapeHtml(c.clubName) + ' Trophy Cabinet</h3>' +
    '<div class="trophySummary">' +
      myClubTrophySummaryChip("Total trophies", trophies.length) +
      myClubTrophySummaryChip("League titles", leagueCount) +
      myClubTrophySummaryChip("Cup titles", cupCount) +
      myClubTrophySummaryChip("Super cups", superCount) +
      myClubTrophySummaryChip("UEFA Super Cups", uefaSuperCount) +
      myClubTrophySummaryChip("International titles", clCount) +
      myClubTrophySummaryChip("Seasons managed", c.season) +
    '</div>';
  if (trophies.length) {
    html += '<div class="myClubTrophyGrid">';
    for (const t of trophies) {
      const cls = t.type === "league" ? "league" : (t.type === "cup" || t.type === "supercup" ? "cup" : "champions");
      const medal = t.type === "league" ? "1st"
        : (t.type === "champions"
            ? (String(t.competition || "").indexOf("Conference") !== -1 ? "UECL" : (String(t.competition || "").indexOf("Europa") !== -1 ? "UEL" : "UCL"))
            : (t.type === "cwc" ? "CWC" : (t.type === "cup" ? "CUP" : (t.type === "uefasuper" ? "USC" : "SC"))));
      html += '<div class="trophyCard ' + cls + '" data-nav>' +
        '<div class="trophyMedal">' + medal + '</div>' +
        '<div class="trophyTitle">' + escapeHtml(t.competition || MYCLUB_TROPHY_LABELS[t.type] || "Trophy") + '</div>' +
        (t.competition ? '<div class="trophyMeta">' + escapeHtml(MYCLUB_TROPHY_LABELS[t.type] || "Trophy") + '</div>' : "") +
        '<div class="trophySeason">Season ' + t.season + '</div>' +
      '</div>';
    }
    html += '</div>';
  } else {
    html += '<p class="trophyEmpty">No trophies yet. Win your league or the Champions League to fill this cabinet.</p>';
  }
  html += '</div>';
  html += '<div class="myClubPaneCard"><h3>Awards &amp; Milestones</h3>';
  if (awards.length) {
    for (const a of awards) {
      html += '<div class="awardRow" data-nav><span class="awardDot ' + escapeHtml(a.type) + '"></span>' +
        '<span class="awardName">' + escapeHtml(a.title || "European Qualification") + '</span>' +
        '<span class="awardMeta">' + escapeHtml(a.competition || "") + ' \u00b7 Season ' + a.season + '</span></div>';
    }
  } else {
    html += '<p class="trophyEmpty">Finish in the top 4 of your league to earn European qualification.</p>';
  }
  html += '<p class="levelNote">Trophies and awards are kept per club and travel with your save code.</p></div>';
  html += '<div class="myClubPaneCard"><h3>Individual Awards</h3>';
  const indiv = Array.isArray(c.awards) ? c.awards.slice().sort((a, b) => (b.season || 0) - (a.season || 0)) : [];
  if (indiv.length) {
    for (const a of indiv) {
      html += '<div class="indivAwardRow" data-nav><span class="awardDot individual"></span>' +
        '<span class="awardName">' + escapeHtml(myClubAwardLabel(a.type)) + ' \u2014 ' + escapeHtml(a.player) + '</span>' +
        '<span class="awardMeta">' + a.goals + 'G ' + a.assists + 'A \u00b7 Season ' + a.season + '</span></div>';
    }
  } else {
    html += '<p class="trophyEmpty">No individual awards yet. Complete a season to crown the Ballon d\'Or, the Golden Shoe and more.</p>';
  }
  html += '</div>';
  html += '<div class="myClubPaneCard"><h3>Your Player\'s Awards</h3>';
  const myNames = myClubUserPlayerNames(c);
  const mine = indiv.filter(a => a && a.player && myNames[String(a.player).toLowerCase()]);
  if (mine.length) {
    html += '<div class="trophySummary">' +
      myClubTrophySummaryChip("Your awards", mine.length) +
    '</div>';
    for (const a of mine) {
      html += '<div class="indivAwardRow" data-nav>' +
        '<span class="awardDot ' + escapeHtml(a.type) + '"></span>' +
        '<span class="awardName">' + escapeHtml(myClubAwardLabel(a.type)) + ' \u2014 ' + escapeHtml(a.player) + '</span>' +
        '<span class="awardMeta">' + escapeHtml(a.competition || "") + ' \u00b7 Season ' + a.season + '</span></div>';
    }
  } else {
    html += '<p class="trophyEmpty">Your players haven\'t won an individual award yet. Finish a season with strong goal contributions to put your squad in the running.</p>';
  }
  html += '</div>';
  pane.innerHTML = html;
}

function renderMyClubFriendliesTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  let html = '<div class="myClubPaneCard"><h3>How friendlies work</h3>' +
    '<p class="friendlyDayLine">Friendlies pay money only when you win <em>and</em> you offer a win bonus up front; normal goal / win / draw bonuses never apply. Each My Club match you finish moves the in-game day forward, and rare clubs occasionally challenge you in return.</p>' +
    '<div class="myClubActions"><button onclick="myClubShowTab(\'lineup\')">Prepare your team</button></div></div>';
  html += myClubFriendliesPaneHTML(c);
  myClubTab("myClubTabFriendlies").innerHTML = html;
}

function renderMyClubManagersTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const actManager = getActiveManager();
  let html = '<div class="myClubPaneCard"><h3>Manager configuration</h3>' +
    '<p class="friendlyDayLine">Your active manager boosts every player of their preferred group in matches. Sign new managers from packs, then assign one here.</p>';
  if (actManager) {
    html += '<div class="managerActiveLine">' + escapeHtml(actManager.name) + ' &middot; <b>' + escapeHtml(managerBuffLabel(actManager)) + '</b> &middot; ' + escapeHtml(actManager.nation) + ' &middot; ' + escapeHtml(actManager.era) + '</div>';
  }
  html += managerRosterHTML(c) + '</div>';
  myClubTab("myClubTabManagers").innerHTML = html;
}

function packOddsText(s) {
  if (s && s.tierPack) {
    return '<span>Any rarity</span><br><span>rarer cards scale with tier</span>';
  }
  if (s && !s.box && !Array.isArray(s.pool)) {
    for (const k of MYCLUB_PACK_LADDER) {
      if (MYCLUB_PACKS[k] === s) {
        return '<span>1 guaranteed ' + escapeHtml(MYCLUB_PACK_LABELS[k] || k) + '</span><br><span>+ 9 cards from lower packs</span>';
      }
    }
  }
  if (s.box) {
    const buckets = {};
    for (const id in MY_CLUB_CONSUMABLES) {
      const r = MY_CLUB_CONSUMABLES[id].rarity;
      buckets[r] = (buckets[r] || 0) + MY_CLUB_CONSUMABLES[id].weight;
    }
    let total = 0;
    for (const k in buckets) total += buckets[k];
    return Object.keys(buckets).map(r => '<span>' + r + ' ' + Math.round(buckets[r] / total * 100) + '%</span>').join('<br>');
  }
  if (Array.isArray(s.pool)) return '<span>' + s.pool.length + ' standout players</span>';
  if (s.tier) return '<span>' + (MYCLUB_RARITY_LABELS[s.tier] || "Special") + ' 100%</span>';
  if (Array.isArray(s.odds)) {
    let total = 0;
    for (const o of s.odds) total += o.w;
    if (!total) return "";
    return s.odds.map(o => '<span>' + escapeHtml(MYCLUB_RARITY_LABELS[o.r] || o.r) + ' ' + Math.round(o.w / total * 100) + '%</span>').join('<br>');
  }
  return '<span>Special 100%</span>';
}

function renderMyClubPacksTab() {
  let html = '<div id="packHint"></div>';
  html += '<div class="packNationRow packAutoDelRow">' +
    '<label><input type="checkbox" id="myClubAutoDeleteChk" ' + (SETTINGS.autoDeleteLow ? "checked" : "") + ' onchange="setAutoDeleteLow(this.checked)"> Auto-delete low cards</label>' +
    '<span>delete below OVR</span>' +
    '<select id="myClubAutoDeleteOvr" onchange="setAutoDeleteOvr(this.value)"' + (SETTINGS.autoDeleteLow ? "" : " disabled") + '>' +
    [60, 65, 70, 75, 80].map(function (v) {
      return '<option value="' + v + '"' + (v === SETTINGS.autoDeleteOvr ? " selected" : "") + '>' + v + '</option>';
    }).join("") +
    '</select>' +
    '<span class="packAutoDelHint">Pulled cards below this rating are deleted instantly (no refund).</span>' +
    '</div>';
  html += '<div class="myClubPacksGrid">';
  for (const key of MYCLUB_PACK_SHOP_KEYS) {
    const s = MYCLUB_PACKS[key];
    if (!s) continue;
    const lvlReq = myClubPackLocked(s);
    html += '<div class="packCard ' + s.css + (lvlReq ? " packCardLocked" : "") + '" role="button" onclick="openMyClubPack(\'' + key + '\')">' +
      '<div class="packCardInner"><div class="packTier">' + s.name + '</div>' +
      '<div class="packPrice">' + formatMoney(s.price) + '</div>' +
      '<div class="packDesc">' + s.desc + '</div>' +
      '<div class="packOdds">' + packOddsText(s) + '</div>' +
      (lvlReq ? '<div class="packLock">Reach Level ' + lvlReq + '</div>' : '') +
      '</div></div>';
  }
  html += '</div>';
  html += '<button class="myClubPacksHelpBtn" onclick="toggleMyClubPacksHelp()" title="Which bonus card types can you get?">?</button>' +
    '<div id="myClubPacksHelp" class="myClubPacksHelp" style="display:none">' +
    '<b>Bonus card types</b>' +
    '<p>Every player pack has a small chance to also drop a <b>bonus card</b> on top of its normal contents:</p>' +
    '<div><span class="helpTierDot helpDotRTG"></span><b>Road to Glory</b> &mdash; in-form real stars of the current season (e.g. Saka, Haaland, Yamal...).</div>' +
    '<div><span class="helpTierDot helpDotHOLO"></span><b>Holographic</b> &mdash; a prestige series of 16 all-time greats (Beckenbauer, Xavi, Casillas, Beckham...). Third best card in the game.</div>' +
    '<div><span class="helpTierDot helpDotWC"></span><b>World Cup</b> &mdash; the 2026 World Cup-winning squad, Spain (rare bonus).</div>' +
    '<div><span class="helpTierDot helpDotMAX"></span><b>MAX</b> &mdash; an all-time great at 96-99 OVR (Messi, Ronaldo, Haaland...). The rarest bonus of all.</div>' +
    '<p class="packHelpNote">Bigger, more expensive packs have a higher chance. Road to Glory is the most common bonus card at every price, and World Cup closes the gap as packs get dearer, so a big pack is still the best place to hunt one. Ranking from rarest down: MAX, World Cup, Holographic, then Road to Glory. Bonus cards are never auto-deleted.</p>' +
    '</div>';
  myClubTab("myClubTabPacks").innerHTML = html;
}

function toggleMyClubPacksHelp() {
  var p = document.getElementById("myClubPacksHelp");
  if (!p) return;
  p.style.display = (p.style.display === "none") ? "block" : "none";
}

function setAutoDeleteLow(checked) {
  SETTINGS.autoDeleteLow = !!checked;
  saveSettings();
  renderMyClubPacksTab();
}

function setAutoDeleteOvr(v) {
  const n = parseInt(v, 10);
  if (!isNaN(n)) SETTINGS.autoDeleteOvr = n;
  saveSettings();
  renderMyClubPacksTab();
}

// Daily Shop: a date-seeded rotating shop inside My Club. It replaces the
// transfer-market idea for this gamemode - packs get discounts, a rare
// consumable is on offer, and a big-name player card is on sale. The classic
// Transfer Market in the regular gamemode is left untouched.
const SHOP_PACK_POOL = ["tier1","tier2","tier3","tier4","tier5","bronze", "silver", "gold", "gk", "def", "mid", "att", "special", "icon", "nation", "prospect", "gamelegend"];
const SHOP_HOURLY_PACKS = ["tier4","tier5","captain", "pl", "laliga", "bundesliga", "seriea", "ligue1", "nationleader"];
let dailyShopCache = null;
let hourlyShopCache = null;

function dailyShopDayKey() {
  const d = new Date();
  return String(d.getFullYear()) + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function dailyShopRng() {
  const d = new Date();
  let s = (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) >>> 0;
  return function () {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyShopHourKey() {
  const d = new Date();
  return dailyShopDayKey() + "-" + String(d.getHours()).padStart(2, "0");
}

// Hour-seeded RNG so the rotating pack is stable within the hour and changes
// on the hour, exactly like the daily seed rolls over at midnight.
function hourlyShopRng() {
  const hour = dailyShopHourKey();
  let s = 0;
  for (let i = 0; i < hour.length; i++) s = (Math.imul(s, 31) + hour.charCodeAt(i)) >>> 0;
  return function () {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The shop's centre tile rotates hourly between the specialty packs in
// SHOP_HOURLY_PACKS. The bought key carries the hour so a fresh offer is
// available every hour and each one can be bought once.
function hourlyShopSlot() {
  const hour = dailyShopHourKey();
  if (hourlyShopCache && hourlyShopCache.hour === hour) return hourlyShopCache.slot;
  const rnd = hourlyShopRng();
  const key = SHOP_HOURLY_PACKS[Math.floor(rnd() * SHOP_HOURLY_PACKS.length)];
  const spec = MYCLUB_PACKS[key];
  const discount = 0;
  const price = spec.price;
  hourlyShopCache = {
    hour: hour,
    slot: { key: "hourly;" + hour, kind: "pack", pack: key, price: price, origPrice: spec.price, discount: discount, hourly: true, label: spec.name }
  };
  return hourlyShopCache.slot;
}

// Viewer panel for the hourly rotation: every pack that can appear in the
// shop's centre slot, with the one currently on sale marked NOW.
function hourlyShopPanelHTML(activeSlot) {
  const cur = activeSlot ? activeSlot.pack : null;
  let html = '<div class="shopHourlyPanel"><div class="shopHourlyHead">Hourly Pack Rotation</div><div class="shopHourlyGrid">';
  for (const k of SHOP_HOURLY_PACKS) {
    const s = MYCLUB_PACKS[k];
    const live = k === cur;
    html += '<div class="shopCycleChip' + (live ? " live" : "") + '">' +
      '<div class="shopCycleTier ' + s.css + (s.css === "packTierMax" ? " dark" : "") + '">' + escapeHtml(s.name) +
      (live ? ' <span class="shopCycleNow">NOW</span>' : '') + '</div>' +
      '<div class="shopCycleType">' + escapeHtml(s.variant) + ' &middot; ' + formatMoney(s.price) + '</div></div>';
  }
  html += '</div><div class="shopHourlyNote">These packs cycle through the shop centre slot every hour - the offer marked NOW is the one you can buy right now.</div></div>';
  return html;
}

// Build the shop's headline player card fully from the seeded RNG so the
// whole day's stock is identical no matter how often it is regenerated.
function makeDailyShopCard(rarity, rnd) {
  const pool = rarity === "hero" ? MYCLUB_HERO_PLAYERS : MYCLUB_ICON_PLAYERS;
  const best = pool.map(e => normalizePackEntry(e));
  const e = best[Math.floor(rnd() * best.length)];
  let card;
  if (e.stats) {
    card = makePlayerData(e.name, e.stats);
  } else {
    let ovr = e.baseOvr;
    if (rarity === "hero") { if (rnd() < 0.4) ovr += 1; }
    else if (rarity === "icon") { if (rnd() < 0.3) ovr += 1; }
    card = makeRatedPlayer(e.name, ovr, e.role);
  }
  card.role = e.role;
  card.tag = rarity === "hero" ? "HERO" : "ICON";
  card.variant = rarity === "hero" ? "Game Legend" : null;
  const posPool = e.role === "goalkeeper" ? ["GK"] : e.role === "defender" ? ["RB", "CB", "LB"] : e.role === "midfielder" ? ["CDM", "CM", "CAM"] : ["RW", "ST", "LW"];
  card.pos = posPool[Math.floor(rnd() * posPool.length)];
  card.nation = e.nation || MYCLUB_NATIONS_ALL[Math.floor(rnd() * MYCLUB_NATIONS_ALL.length)];
  return card;
}

function getDailyShopStock() {
  const day = dailyShopDayKey();
  if (dailyShopCache && dailyShopCache.day === day) return dailyShopCache.stock.concat([hourlyShopSlot()]);
  const rnd = dailyShopRng();
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  const p1 = pick(SHOP_PACK_POOL);
  let p2 = pick(SHOP_PACK_POOL);
  while (p2 === p1) p2 = pick(SHOP_PACK_POOL);
  const spec1 = MYCLUB_PACKS[p1];
  const spec2 = MYCLUB_PACKS[p2];
  const disc = () => 25 + Math.floor(rnd() * 26);
  const disc1 = disc();
  const disc2 = disc();
  const price1 = Math.round(spec1.price * (100 - disc1) / 100 / 1000) * 1000;
  const price2 = Math.round(spec2.price * (100 - disc2) / 100 / 1000) * 1000;

  const conKey = rnd() < 0.35 ? "all5" : "all2";

  const cardRoll = rnd();
  const cardRarity = cardRoll < 0.6 ? "hero" : "icon";
  const card = makeDailyShopCard(cardRarity, rnd);

  const stock = [
    { key: "packA", kind: "pack", pack: p1, price: Math.max(1000, price1), origPrice: spec1.price, discount: disc1 },
    { key: "packB", kind: "pack", pack: p2, price: Math.max(1000, price2), origPrice: spec2.price, discount: disc2 },
    { key: "consumable", kind: "consumable", itemId: conKey, label: MY_CLUB_CONSUMABLES[conKey].name, price: conKey === "all5" ? 900000 : 450000 },
    { key: "card", kind: "card", card: card, label: card.name, price: Math.max(50000, Math.round(myClubCardValue(card) * 2.2 / 1000) * 1000) }
  ];
  dailyShopCache = { day: day, stock: stock };
  return stock.concat([hourlyShopSlot()]);
}

function shopBoughtMap(c) {
  if (!c) return {};
  if (c.shopDay !== dailyShopDayKey()) {
    c.shopDay = dailyShopDayKey();
    if (c.shopBought && typeof c.shopBought === "object") c.shopBought = {};
  }
  if (!c.shopBought || typeof c.shopBought !== "object" || Array.isArray(c.shopBought)) c.shopBought = {};
  return c.shopBought;
}

function isShopBought(key, c) {
  return !!(c && shopBoughtMap(c)[key]);
}

function markShopBought(key, c) {
  shopBoughtMap(c)[key] = true;
}

function shopSlotHTML(slot, c) {
  const bought = isShopBought(slot.key, c);
  let body;
  if (slot.kind === "coming") {
    return '<div class="shopTile shopTileSoon">' +
      '<div class="shopSoonLabel">???</div><div class="shopSoonName">' + escapeHtml(slot.label) + '</div>' +
      '<div class="shopSoonDesc">A mystery offer lands here in a future update. Check back soon.</div></div>';
  }
  if (slot.kind === "pack") {
    const spec = MYCLUB_PACKS[slot.pack];
    const lvlReq = myClubPackLocked(spec);
    const dark = spec.css === "packTierMax" ? " dark" : "";
    const hasDisc = (slot.discount || 0) > 0 && (slot.price || 0) < (slot.origPrice || 0);
    body = '<div class="shopTileTop ' + spec.css + '">' +
      '<span class="shopTier' + dark + '">' + spec.name + (slot.hourly ? ' <span class="shopHourlyTag">Hourly</span>' : '') + '</span>' +
      '<div class="shopPrice">' + formatMoney(slot.price) +
      (hasDisc ? '<span class="shopOrigPrice' + (dark ? " light" : "") + '">' + formatMoney(slot.origPrice) + '</span>' : '') + '</div>' +
      (hasDisc ? '<div class="shopDisc">-' + slot.discount + '% ' + (slot.hourly ? 'this hour' : 'today') + '</div>' : '') + '</div>' +
      '<div class="shopTileDesc">' + (spec.desc || "") + '<div class="packOdds">' + packOddsText(spec) + '</div></div>' +
      (lvlReq ? '<div class="shopLocked">Reach Level ' + lvlReq + '</div>' : '') +
      '<div class="shopTileActions">' + (bought
        ? '<span class="shopSold">SOLD</span>'
        : '<button onclick="buyDailyShopSlot(\'' + slot.key + '\')"' + (lvlReq ? ' disabled' : '') + '>Buy ' + formatMoney(slot.price) + '</button>') + '</div>';
  } else if (slot.kind === "consumable") {
    const con = MY_CLUB_CONSUMABLES[slot.itemId];
    body = '<span class="shopRarity' + (con.rarity === "Legendary" ? " legend" : "") + '">' + con.rarity + '</span>' +
      '<img class="shopConArt" src="' + consumableArt(con) + '" alt="" />' +
      '<div class="shopTier" style="font-weight:900;text-transform:uppercase;letter-spacing:1px;">' + escapeHtml(con.name) + '</div>' +
      '<div class="shopTileDesc">A rare '+ con.rarity.toLowerCase() + ' consumable. Applies <b>+' + con.value + '</b> to ' + (con.stat === "all" ? "all stats" : con.stat) + '.</div>' +
      '<div class="shopTileActions">' + (bought
        ? '<span class="shopSold">SOLD</span>'
        : '<button onclick="buyDailyShopSlot(\'' + slot.key + '\')">Buy ' + formatMoney(slot.price) + '</button>') + '</div>';
  } else {
    const card = slot.card;
    const ovr = calculateOverall(card, card.role || "attacker");
    body = '<div class="shopCardMini ' + cardTierClass(card, ovr) + '">' +
      '<div class="shopCardOvr">' + ovr + '</div>' +
      '<div class="shopCardMeta"><div class="shopCardName">' + escapeHtml(card.name) + '</div>' +
      '<div class="shopCardSub">' + escapeHtml(cardTypeLabel(card)) + ' &middot; ' + escapeHtml(card.pos || myClubFallbackPos(card.role)) + '</div></div></div>' +
      '<div class="shopTileActions">' + (bought
        ? '<span class="shopSold">SOLD</span>'
        : '<button onclick="buyDailyShopSlot(\'' + slot.key + '\')">Buy ' + formatMoney(slot.price) + '</button>') + '</div>';
  }
  return '<div class="shopTile' + (slot.hourly ? " shopTileHourly" : "") + (bought ? " shopTileSold" : "") + '">' + body + '</div>';
}

function renderMyClubShopTab() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const stock = getDailyShopStock();
  let html = '<div id="shopHint"></div>';
  html += '<div class="myClubPaneCard"><div class="shopHeadRow"><h3>Daily Shop</h3>' +
    '<span class="shopDayLabel">Refreshes ' + dailyShopDayKey() + '</span></div>' +
    '<p class="shopBlurb">Fresh deals every day. The centre pack rotates hourly' +
    ' - sold items stay sold until the next refresh. Each offer can be bought once, so plan your coins.</p>';
  html += '<div class="dailyShopGrid">';
  for (const slot of stock) html += shopSlotHTML(slot, c);
  html += '</div>';
  html += hourlyShopPanelHTML(stock.find(s => s.hourly));
  html += '</div>';
  const el = myClubTab("myClubTabShop");
  if (el) el.innerHTML = html;
}

function buyDailyShopSlot(key) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const stock = getDailyShopStock();
  const slot = stock.find(s => s.key === key);
  if (!slot || slot.kind === "coming") return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (isShopBought(key, c)) { myClubLobbyMsg(slot.hourly ? "Already bought this hour - check back when the pack rotates." : "Already bought today - check back after the refresh."); return; }
  if (slot.kind === "pack") {
    const spec = MYCLUB_PACKS[slot.pack];
    const lvlReq = myClubPackLocked(spec);
    if (lvlReq) { myClubLobbyMsg(spec.name + " unlocks at Level " + lvlReq + "."); return; }
    if (playerCoins < slot.price) { myClubLobbyMsg("Not enough money (" + formatMoney(slot.price) + " needed)."); return; }
    openMyClubPack(slot.pack, slot.price);
    markShopBought(key, c);
    saveMyClubData();
    renderMyClubShopTab();
    return;
  }
  if (playerCoins < slot.price) {
    myClubLobbyMsg("Not enough money (" + formatMoney(slot.price) + " needed). Play matches or win the title.");
    return;
  }
  playerCoins -= slot.price;
  c.coins = playerCoins;
  if (slot.kind === "consumable") {
    c.consumables.push(slot.itemId);
  } else if (slot.kind === "card") {
    const card = slot.card;
    card.__cid = "mc" + (++myClubCardSeq);
    while (ownedPool.some(p => p.__cid === card.__cid)) card.__cid = "mc" + (++myClubCardSeq);
    ownedPool.push(card);
  }
  markShopBought(key, c);
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  renderMyClubShopTab();
  if (slot.kind === "card") {
    showPackReveal("gamelegend", [slot.card], 0, cardTypeLabel(slot.card) + " signed!");
  } else {
    const msg = document.getElementById("lineupMsg");
    if (msg) msg.textContent = "Bought " + (slot.label || "item") + " for " + formatMoney(slot.price) + ".";
  }
}

// Auto-delete option for the pack shop: with SETTINGS.autoDeleteLow on, every
// pulled card rating below SETTINGS.autoDeleteOvr is removed from the pack and
// the owned pool instantly (no refund). Cards at or above the threshold stay.
function applyAutoDeleteFilter(cards) {
  if (!SETTINGS.autoDeleteLow || typeof SETTINGS.autoDeleteOvr !== "number" || SETTINGS.autoDeleteOvr < 60) {
    return { kept: cards.slice(), autoDel: 0 };
  }
  const thr = SETTINGS.autoDeleteOvr;
  const kept = [];
  let autoDel = 0;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    if (calculateOverall(c, c.role) < thr) {
      const idx = ownedPool.indexOf(c);
      if (idx !== -1) ownedPool.splice(idx, 1);
      const care = getMyClubCareer(myClubLeague);
      if (care && care.myInj && c.__cid && care.myInj[c.__cid]) delete care.myInj[c.__cid];
      autoDel++;
    } else {
      kept.push(c);
    }
  }
  syncMyClubBench();
  return { kept: kept, autoDel: autoDel };
}

function renderMyClubLeagueTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const league = getMyClubLeague(c.league);
  const group = { name: league ? league.name : c.league, teams: myClubLeagueClubs(c), matches: c.fixtures };
  let html = '<div class="myClubPaneCard"><h3>' + escapeHtml(league ? league.name : c.league) + ' - Standings</h3>';
  const qSlots = (league && league.clSlots) || 4;
  if (c.cl && c.cl.active) {
    html += '<div class="clZoneBanner playoff">Your club is competing in ' + escapeHtml(myClubEuroName(c)) + ' this season \u2014 see the ' + escapeHtml(myClubEuroShort(c)) + ' tab.</div>';
  } else {
    html += '<div class="clZoneBanner playoff">European qualification: top ' + qSlots + ' to ' + escapeHtml(league && league.cup ? league.cup + " winner" : "Champions League") + '; positions ' + (qSlots + 1) + ' to ' + (qSlots + 2) + ' to Europa / Conference League. Cup winner also earns a Europa League spot.</div>';
  }
  const nextEv = myClubNextEventLabel(c);
  if (nextEv) html += '<div class="myClubNextEvent">Next: ' + escapeHtml(nextEv) + '</div>';
  if (group) {
    const rows = computeGroupStandings(group);
    html += '<table class="myClubStandingsTable"><tr><th>#</th><th>Club</th><th>Pld</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>';
    rows.forEach((row, i) => {
      html += '<tr class="navRow' + (row.team === c.clubName ? " mine" : "") + '" data-nav><td>' + (i + 1) + '</td><td>' + escapeHtml(row.team) + '</td><td>' + row.played + '</td><td>' + row.w + '</td><td>' + row.d + '</td><td>' + row.l + '</td><td>' + row.gd + '</td><td>' + row.points + '</td></tr>';
    });
    html += '</table></div>';
    html += '<div class="myClubPaneCard myClubFixtures"><h3>Fixtures</h3>';
    for (const m of group.matches) {
      const mine = m.team1 === c.clubName || m.team2 === c.clubName;
      const cls = m.played ? "done" : (mine ? "next" : "");
      const label = m.played ? m.team1 + " " + m.score1 + "-" + m.score2 + " " + m.team2 : m.team1 + " vs " + m.team2;
      html += '<div class="myClubFixture ' + cls + '"><span>D' + (typeof m.day === "number" ? m.day : "?") + '</span><span>R' + m.round + '</span><span>' + escapeHtml(label) + '</span></div>';
    }
    html += '</div>';
  } else {
    html += '<p>No season loaded.</p></div>';
  }
  myClubTab("myClubTabLeague").innerHTML = html;
}

// A season runs from 1 August to the end of May, stretching to the end of July
// in the seasons that host a Club World Cup. Each competition below is placed by
// its real calendar window rather than a hardcoded day number.
const MYCLUB_SEASON_START_MONTH = 8;   // August
const MYCLUB_SEASON_START_DAY = 1;
const MYCLUB_SEASON_END_DAY = 304;     // 31 May in a 365-day season
const MYCLUB_CWC_INTERVAL = 4;         // a Club World Cup every fourth season
const MYCLUB_FIRST_SAME_DAY = 10;      // 10 August - league opening weekend
const MYCLUB_LAST_SAME_DAY = 24;       // 24 May - final weekend
const MYCLUB_CWC_FIRST_DAY = 15;       // 15 June
const MYCLUB_CWC_LAST_DAY = 31;        // 31 July

// The window a competition occupies, as season day numbers. Used to place
// league, cup and European fixtures, and to keep the calendar honest.
function myClubSeasonWindow(mo, fromDay, toDay) {
  return { start: myClubDayForDateParts(mo, fromDay), end: myClubDayForDateParts(mo, toDay) };
}

function myClubCalendarStart(c) {
  return new Date(Date.UTC(2026 + ((c.season || 1) - 1), MYCLUB_SEASON_START_MONTH - 1, MYCLUB_SEASON_START_DAY));
}

function myClubDateForDay(c, day) {
  const ms = myClubCalendarStart(c).getTime() + Math.max(0, (typeof day === "number" ? day : 1) - 1) * 86400000;
  return new Date(ms);
}

function myClubCalendarCurrentDay(c) {
  // One shared counter for the whole season, so a live European campaign no
  // longer gets its own frozen day.
  if (typeof c.calDay === "number" && c.calDay >= 1) return { day: c.calDay, played: false };
  const m = findPlayerMatch();
  if (m && typeof m.day === "number") return { day: Math.max(1, m.day - 1), played: false };
  const rel = buildMyClubCalendar(c).filter(e => e.home === c.clubName || e.away === c.clubName);
  if (rel.length) return { day: Math.max.apply(null, rel.map(e => e.day)), played: true };
  return { day: 1, played: true };
}

function myClubShortOpponent(name) {
  const words = String(name || "").split(/\s+/).filter(w => w.length && w.toLowerCase() !== "fc" && w.toLowerCase() !== "afc" && w.toLowerCase() !== "cf" && w.toLowerCase() !== "sc");
  const s = words.map(w => w[0].toUpperCase()).join("").slice(0, 4);
  return s || (String(name || "?").toUpperCase().slice(0, 4));
}

let myClubCalCursorYear = null;
let myClubCalCursorMonth = null;

function myClubCalMonthForToday(c) {
  const cur = myClubCalendarCurrentDay(c);
  return myClubDateForDay(c, cur.day);
}

function myClubCalGoTo(y, m) {
  myClubCalCursorYear = y;
  myClubCalCursorMonth = m;
  renderMyClubCalendarTab();
}

function myClubCalNav(dm) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (myClubCalCursorYear === null) {
    const dt = myClubCalMonthForToday(c);
    myClubCalCursorYear = dt.getUTCFullYear();
    myClubCalCursorMonth = dt.getUTCMonth();
  }
  const d = new Date(Date.UTC(myClubCalCursorYear, myClubCalCursorMonth + (dm || 0), 1));
  myClubCalCursorYear = d.getUTCFullYear();
  myClubCalCursorMonth = d.getUTCMonth();
  renderMyClubCalendarTab();
}

function myClubCalToday() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const dt = myClubCalMonthForToday(c);
  myClubCalCursorYear = dt.getUTCFullYear();
  myClubCalCursorMonth = dt.getUTCMonth();
  renderMyClubCalendarTab();
}

function renderMyClubCalendarTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) { myClubTab("myClubTabCalendar").innerHTML = ""; return; }
  const entries = buildMyClubCalendar(c);
  const nextEv = myClubNextEventLabel(c);
  const cur = myClubCalendarCurrentDay(c);
  const start = myClubCalendarStart(c);
  const lastEntry = entries.length ? Math.max.apply(null, entries.map(e => e.day)) : 1;
  const seasonEnd = myClubDateForDay(c, lastEntry + 1);

  let y = myClubCalCursorYear, m = myClubCalCursorMonth;
  if (y === null) {
    const cdt = myClubDateForDay(c, cur.day);
    y = cdt.getUTCFullYear();
    m = cdt.getUTCMonth();
  }

  const byDay = {};
  for (const e of entries) {
    const key = typeof e.day === "number" ? e.day : 0;
    (byDay[key] = byDay[key] || []).push(e);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayHdrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

  const calMonths = [];
  {
    let s = myClubDateForDay(c, 1);
    let e = seasonEnd;
    let yy = s.getUTCFullYear(), mm = s.getUTCMonth();
    while (yy < e.getUTCFullYear() || (yy === e.getUTCFullYear() && mm <= e.getUTCMonth())) {
      calMonths.push({ y: yy, m: mm });
      const nx = new Date(Date.UTC(yy, mm + 1, 1));
      yy = nx.getUTCFullYear();
      mm = nx.getUTCMonth();
    }
  }

  let html = '<div class="myClubPaneCard"><h3>Season Calendar - Season ' + c.season + '</h3>';
  if (c.cl && c.cl.active) {
    html += '<p class="friendlyDayLine">You are currently in ' + escapeHtml(myClubEuroName(c)) + ' \u2014 domestic competition is on hold. See the ' + escapeHtml(myClubEuroShort(c)) + ' tab.</p>';
  } else if (nextEv) {
    html += '<div class="myClubNextEvent">Next: ' + escapeHtml(nextEv) + '</div>';
  } else {
    html += '<p class="trophyEmpty">Season complete.</p>';
  }

  if (entries.length) {
    html += '<div class="calHeader">' +
      '<button class="calNav" onclick="myClubCalNav(-1)" title="Previous month">\u2039</button>' +
      '<span class="calTitle">' + fullNames[m] + ' ' + y + '</span>' +
      '<button class="calNav" onclick="myClubCalNav(1)" title="Next month">\u203a</button>' +
      '<button class="calToday" onclick="myClubCalToday()">Today</button>' +
      '</div>';
    html += '<div class="calMonths">';
    for (const mo of calMonths) {
      const active = mo.y === y && mo.m === m;
      html += '<button class="calMonthChip' + (active ? " sel" : "") + '" onclick="myClubCalGoTo(' + mo.y + ',' + mo.m + ')">' + monthNames[mo.m] + ' ' + String(mo.y).slice(2) + '</button>';
    }
    html += '</div>';
    html += '<div class="calWeekdays">' + dayHdrs.map(d => '<span>' + d + '</span>').join('') + '</div>';
    html += '<div class="calGrid">';
    for (let i = 0; i < lead; i++) html += '<div class="calCell empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dayNum = Math.round((Date.UTC(y, m, d) - start.getTime()) / 86400000) + 1;
      const evs = byDay[dayNum] || [];
      const isNow = !cur.played && dayNum === cur.day;
      const inSeason = dayNum >= 1 && dayNum <= lastEntry;
      let cell = ["calCell"];
      if (!evs.length) cell.push("rest");
      if (inSeason && evs.length) cell.push("inSeason");
      if (isNow) cell.push("now");
      html += '<div class="' + cell.join(" ") + '"' + (evs.length ? ' data-day="' + dayNum + '" data-nav' : '') + '>';
      html += '<span class="calCellDay">' + d + (isNow ? '<i>NOW</i>' : '') + '</span>';
      for (const e of evs) {
        const icon = e.type === "super" ? "T" : (e.type === "cup" ? "C" : (e.type === "cl" ? myClubEuroLetter(e.comp) : "L"));
        const mine = e.home === c.clubName || e.away === c.clubName;
        const pensTxt = (e.pens1 != null && e.pens2 != null) ? " (" + e.pens1 + "-" + e.pens2 + " pens)" : "";
        const short = e.played
          ? (e.score != null ? e.score + "-" + (e.score2 != null ? e.score2 : "?") + pensTxt : "p")
          : (e.home === c.clubName ? myClubShortOpponent(e.away) : (e.away === c.clubName ? myClubShortOpponent(e.home) : myClubShortOpponent(e.home) + "-" + myClubShortOpponent(e.away)));
        const tip = escapeHtml(e.label + (e.round ? " - " + e.round : "") + " (Day " + e.day + ") - " + e.home + " " + (e.played ? (e.score != null ? e.score + "-" + e.score2 + pensTxt : "p") : "vs") + " " + e.away);
        html += '<span class="calChip ' + e.type + (e.played ? " done" : "") + (mine ? " mine" : "") + '" title="' + tip + '">' +
          '<i>' + icon + '</i>' + escapeHtml(short) +
          '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    const daySet = {};
    for (const e of entries) daySet[e.day] = true;
    const matchDays = Object.keys(daySet).length;
    const restDays = Math.max(0, lastEntry - matchDays);
    html += '<div class="calLegend">' +
      '<span><i class="lg">L</i> League</span>' +
      '<span><i class="cup">C</i> ' + escapeHtml((c.cup && c.cup.name) || "Domestic Cup") + '</span>' +
      '<span><i class="super">T</i> Super Cup</span>' +
      (c.cl && c.cl.active ? '<span><i class="cl">' + myClubEuroLetter(c.cl.comp) + '</i> ' + escapeHtml(myClubEuroName(c)) + '</span>' : '') +
      '<span class="calSpan">Day 1 (' + (monthNames[start.getUTCMonth()] + " " + start.getUTCDate()) + ') \u2013 D' + lastEntry + ' (' + (monthNames[seasonEnd.getUTCMonth()] + " " + (seasonEnd.getUTCDate() - 1)) + ') \u00b7 ' + matchDays + ' match days \u00b7 ' + restDays + ' rest days</span>' +
      '</div>';
  }
  html += '</div>';
  myClubTab("myClubTabCalendar").innerHTML = html;
}

let lineupSortMode = null;
let lineupSortDesc = true;
let lineupSelCid = null;
let lineupSearch = "";

function lineupTier(ovr) {
  if (ovr >= 85) return "Gold";
  if (ovr >= 75) return "Silver";
  return "Bronze";
}

function lineupStatHTML(p) {
  const stats = [
    ["PAC", p.pace], ["SHO", p.shooting], ["PAS", p.passing],
    ["DRI", p.dribbling], ["DEF", p.defending], ["PHY", p.physical]
  ];
  return stats.map(s => "<span>" + s[0] + " <i>" + (s[1] == null ? "–" : s[1]) + "</i></span>").join("");
}

function lineupStatBars(p) {
  const stats = [
    ["PAC", p.pace], ["SHO", p.shooting], ["PAS", p.passing],
    ["DRI", p.dribbling], ["DEF", p.defending], ["PHY", p.physical]
  ];
  return stats.map(s => {
    const v = (s[1] == null) ? 0 : s[1];
    const w = Math.max(4, Math.round((v / 99) * 100));
    return '<div class="lcStat"><span class="lsKey">' + s[0] + '</span>' +
      '<span class="lcBar"><i style="width:' + w + '%"></i></span>' +
      '<b>' + (s[1] == null ? "–" : s[1]) + '</b></div>';
  }).join("");
}

function lineupSortBy(mode) {
  if (lineupSortMode === mode) lineupSortDesc = !lineupSortDesc;
  else { lineupSortMode = mode; lineupSortDesc = true; }
  renderMyClubLineupTab();
}

function lineupSortLabel(label, mode) {
  if (lineupSortMode !== mode) return label;
  return label + (lineupSortDesc ? " \u25bc" : " \u25b2");
}

function lineupCardMatches(p, q) {
  const s = String(q || "").toLowerCase().trim();
  if (!s) return true;
  const hay = String(p.name || "") + " " + String(p.tag || "") + " " +
    String(p.pos || myClubFallbackPos(p.role) || "") + " " + String(p.role || "");
  return hay.toLowerCase().indexOf(s) !== -1;
}

function lineupSetSearch(v) {
  lineupSearch = String(v == null ? "" : v);
  const el = document.getElementById("lineupSearchInput");
  const caret = el ? el.selectionStart : null;
  renderMyClubLineupTab();
  const inp = document.getElementById("lineupSearchInput");
  if (inp) {
    inp.focus();
    const pos = (caret == null) ? inp.value.length : Math.min(caret, inp.value.length);
    try { inp.setSelectionRange(pos, pos); } catch (e) {}
  }
}

function lineupClearSearch() {
  lineupSearch = "";
  renderMyClubLineupTab();
  const inp = document.getElementById("lineupSearchInput");
  if (inp) inp.focus();
}

function lineupAssignSlot(slotKey, cid) {
  const err = doSwap(slotKey, cid);
  const msg = document.getElementById("lineupMsg");
  if (msg) msg.textContent = err || "";
  renderMyClubLineupTab();
  if (!err) {
    const el = document.querySelector('.lineupSlot[data-slot="' + slotKey + '"] .lineupCard');
    if (el) {
      el.classList.remove("cardPop");
      void el.offsetWidth;
      el.classList.add("cardPop");
    }
  }
}

function lineupRevertSlot(slotKey) {
  const err = doSwap(slotKey, "default");
  const msg = document.getElementById("lineupMsg");
  if (msg) msg.textContent = err || "";
  renderMyClubLineupTab();
}

function lineupBestXI() {
  if (!myClubLeague) return;
  const c = getMyClubCareer(myClubLeague);
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!c || !roster) return;
  if (matchRunning || awaitingStart) {
    const m = "Finish the match first.";
    const msg = document.getElementById("lineupMsg");
    if (msg) msg.textContent = m;
    myClubLobbyMsg(m);
    return;
  }
  const slots = myClubSlotList();
  const drafted = myClubSbcDraftedCids();
  for (const s of slots) {
    const pd = getSlotData(roster, s.key);
    if (pd && pd.__cid) doSwap(s.key, "default");
  }
  for (const s of slots) {
    let best = null, bestScore = -1;
    for (const p of ownedPool) {
      if (!p.__cid) continue;
      if (drafted.has(p.__cid)) continue;
      if (cardIsInjured(p) || cardIsSuspended(p)) continue;
      const roleFit = cardNaturalRole(p) === s.role;
      const score = roleFit ? (calculateOverall(p, p.role) + 1000) : calculateOverall(p, s.role);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (best) doSwap(s.key, best.__cid);
  }
  syncMyClubBench();
  saveClubState();
  saveMyClubData();
  renderMyClubLineupTab();
  const m = "Starting XI set to your best available players.";
  const msg = document.getElementById("lineupMsg");
  if (msg) msg.textContent = m;
  myClubLobbyMsg(m);
}

function lineupBestBench() {
  if (!myClubLeague) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (matchRunning || awaitingStart) {
    const m = "Finish the match first.";
    const msg = document.getElementById("lineupMsg");
    if (msg) msg.textContent = m;
    myClubLobbyMsg(m);
    return;
  }
  const assigned = clubCardIdsInLineup();
  const drafted = myClubSbcDraftedCids();
  const avail = ownedPool.filter(p => p.__cid && !assigned.has(p.__cid) && !drafted.has(p.__cid) && !cardIsInjured(p) && !cardIsSuspended(p));
  avail.sort((a, b) => calculateOverall(b, b.role) - calculateOverall(a, a.role));
  c.bench = avail.slice(0, 7).map(p => p.__cid);
  saveMyClubData();
  renderMyClubLineupTab();
  const m = "Match bench filled with your best available players.";
  const msg = document.getElementById("lineupMsg");
  if (msg) msg.textContent = m;
  myClubLobbyMsg(m);
}

function lineupPickCard(cid) {
  lineupSelCid = lineupSelCid === cid ? null : cid;
  renderMyClubLineupTab();
}

let pendingSellCid = null;

function myClubSellCard(cid) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const idx = ownedPool.findIndex(p => p.__cid === cid);
  if (idx === -1) return;
  const card = ownedPool[idx];
  if (calculateOverall(card, card.role || "attacker") > 95) {
    pendingSellCid = cid;
    document.getElementById("sellConfirmName").textContent = card.name;
    document.getElementById("sellConfirmOvr").textContent = Math.round(calculateOverall(card, card.role || "attacker"));
    document.getElementById("sellConfirmPrice").textContent = formatMoney(myClubSellPrice(card));
    document.getElementById("sellConfirmModal").style.display = "flex";
    return;
  }
  doMyClubSellCard(cid);
}

function doMyClubSellCard(cid) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const idx = ownedPool.findIndex(p => p.__cid === cid);
  if (idx === -1) return;
  const card = ownedPool[idx];
  const price = myClubSellPrice(card);
  ownedPool.splice(idx, 1);
  if (lineupSelCid === cid) lineupSelCid = null;
  playerCoins += price;
  const c = getMyClubCareer(myClubLeague);
  if (c) c.coins = playerCoins;
  if (c && c.myInj && c.myInj[cid]) delete c.myInj[cid];
  syncMyClubBench();
  saveClubState();
  saveMyClubData();
  myClubLobbyMsg(escapeHtml(card.name) + " sold for " + formatMoney(price) + ".");
  myClubRefreshHeader();
  renderMyClubLineupTab();
  renderMyClubClubTab();
  const lm = document.getElementById("lineupMsg");
  if (lm) lm.textContent = escapeHtml(card.name) + " sold for " + formatMoney(price) + ".";
}

function confirmSellHighOvr() {
  const cid = pendingSellCid;
  pendingSellCid = null;
  document.getElementById("sellConfirmModal").style.display = "none";
  if (cid) doMyClubSellCard(cid);
}

function cancelSellHighOvr() {
  pendingSellCid = null;
  document.getElementById("sellConfirmModal").style.display = "none";
}

function lineupClickSlot(slotKey) {
  if (lineupSelCid) {
    const cid = lineupSelCid;
    lineupSelCid = null;
    lineupAssignSlot(slotKey, cid);
  }
}

function lineupDragStart(ev, type, id) {
  if (ev.dataTransfer) {
    ev.dataTransfer.setData("text/plain", type + ":" + id);
    ev.dataTransfer.effectAllowed = "move";
  }
}

function lineupDragOver(ev) {
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
  ev.preventDefault();
  ev.currentTarget.classList.add("dragOver");
}

function lineupDragLeave(ev) {
  ev.currentTarget.classList.remove("dragOver");
}

function lineupDropSlot(ev, slotKey) {
  ev.preventDefault();
  ev.currentTarget.classList.remove("dragOver");
  const raw = (ev.dataTransfer && ev.dataTransfer.getData) ? ev.dataTransfer.getData("text/plain") : "";
  lineupSelCid = null;
  if (raw.indexOf("con:") === 0) {
    lineupAskConfirm(raw.slice(4), slotKey);
    return;
  }
  if (raw.indexOf("cid:") === 0) {
    lineupAssignSlot(slotKey, raw.slice(4));
    return;
  }
  renderMyClubLineupTab();
}

function lineupDropBench(ev) {
  ev.preventDefault();
  const raw = (ev.dataTransfer && ev.dataTransfer.getData) ? ev.dataTransfer.getData("text/plain") : "";
  if (raw.indexOf("slot:") === 0) {
    lineupSelCid = null;
    lineupRevertSlot(raw.slice(5));
    return;
  }
  lineupSelCid = null;
  renderMyClubLineupTab();
}

let lineupInventoryMode = "players";
let lineupConfirmCons = null;
let lineupConfirmSlotKey = null;

function lineupSetInventoryMode(mode) {
  lineupInventoryMode = mode === "consumables" ? "consumables" : "players";
  renderMyClubLineupTab();
}

function lineupAskConfirm(conId, slotKey) {
  const spec = MY_CLUB_CONSUMABLES[conId];
  const roster = TEAM_ROSTERS[selectedTeam];
  const pd = roster ? getSlotData(roster, slotKey) : null;
  if (!spec || !pd) return;
  lineupConfirmCons = conId;
  lineupConfirmSlotKey = slotKey;
  const who = myClubSlotList().find(s => s.key === slotKey);
  document.getElementById("lineupConfirmText").innerHTML =
    'Apply <b>' + escapeHtml(spec.name) + '</b> (' + escapeHtml(consumableLabel(spec)) + ') to <b>' + escapeHtml(pd.name) + '</b>' + (who ? ' at <b>' + escapeHtml(who.label) + '</b>' : "") + '?';
  document.getElementById("lineupConfirmModal").style.display = "flex";
}

function lineupConfirmApply() {
  const conId = lineupConfirmCons;
  const slotKey = lineupConfirmSlotKey;
  const roster = TEAM_ROSTERS[selectedTeam];
  const pd = roster ? getSlotData(roster, slotKey) : null;
  if (!conId || !slotKey) { closeLineupConfirm(); return; }
  const blocked = consumeCoreApply(conId, pd);
  if (blocked) {
    const tt = document.getElementById("lineupConfirmText");
    if (tt) tt.innerHTML = "<b>Already boosted:</b> " + escapeHtml(blocked);
    return;
  }
  lineupConfirmCons = null;
  lineupConfirmSlotKey = null;
  closeLineupConfirm();
  const el = document.querySelector('.lineupSlot[data-slot="' + slotKey + '"] .lineupCard');
  if (el) { el.classList.remove("boostGlow"); void el.offsetWidth; el.classList.add("boostGlow"); }
}

function closeLineupConfirm() {
  document.getElementById("lineupConfirmModal").style.display = "none";
}

function getLineupOverall() {
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return 0;
  const slots = (currentMode === "myclub") ? myClubSlotList() : MARKET_SLOTS;
  let sum = 0, n = 0;
  for (const s of slots) {
    const pd = getSlotData(roster, s.key);
    if (pd) {
      sum += calculateOverall(buffedPlayerView(pd, s.role), s.role);
      n++;
    }
  }
  return n ? Math.round(sum / n) : 0;
}

function reshapeStarterBands(roster, nd, nm, na, pool) {
  const src = (roster.defenders || []).concat(roster.midfielders || []).concat(roster.attackers || []);
  const roles = ["defender", "midfielder", "attacker"];
  const counts = [nd, nm, na];
  const used = new Set();
  const usedPool = new Set();
  const result = { defenders: [], midfielders: [], attackers: [] };
  const score = (p, role) => calculateOverall(p, role) + (p.role === role ? 1000 : 0);
  for (let r = 0; r < 3; r++) {
    const role = roles[r];
    for (let i = 0; i < counts[r]; i++) {
      let pick = null, pickScore = -Infinity, fromPool = false;
      for (let j = 0; j < src.length; j++) {
        if (used.has(j)) continue;
        const s = score(src[j], role);
        if (s > pickScore) { pickScore = s; pick = src[j]; }
      }
      if (!pick && pool) {
        pickScore = -Infinity;
        for (const p of pool) {
          if (usedPool.has(p)) continue;
          const s = score(p, role);
          if (s > pickScore) { pickScore = s; pick = p; fromPool = true; }
        }
      }
      if (!pick) continue;
      if (fromPool) {
        usedPool.add(pick);
        const bidx = pool.indexOf(pick);
        if (bidx !== -1) pool.splice(bidx, 1);
      } else {
        used.add(src.indexOf(pick));
      }
      const c = clonePlayer(pick);
      c.role = role;
      result[role + "s"].push(c);
    }
  }
  const extra = [];
  for (let j = 0; j < src.length; j++) {
    if (!used.has(j)) extra.push(clonePlayer(src[j]));
  }
  return { outfield: result, extra: extra, goalkeeper: roster.goalkeeper };
}

function setMyClubFormation(fm) {
  if (!myClubLeague || !MY_CLUB_FORMATIONS[fm]) return;
  const c = getMyClubCareer(myClubLeague);
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!c || !roster) return;
  if (c.formation === fm) return;
  const f = MY_CLUB_FORMATIONS[fm];
  const reshaped = reshapeStarterBands(roster, f.defs, f.mids, f.atts, ownedPool);
  const nr = reshaped.outfield;
  nr.goalkeeper = reshaped.goalkeeper;
  TEAM_ROSTERS[selectedTeam] = nr;
  for (const p of reshaped.extra) {
    if (p.__cid && !ownedPool.some(x => x.__cid === p.__cid)) ownedPool.push(p);
  }
  c.formation = fm;
  saveClubState();
  saveMyClubData();
  renderMyClubLineupTab();
  renderMyClubClubTab();
}

function myClubDefaultRoster() {
  const canon = clubDefaults[selectedTeam];
  if (!canon) return null;
  const f = myClubFormation();
  const cur = (canon.defenders || []).length + "_" + (canon.midfielders || []).length + "_" + (canon.attackers || []).length;
  const want = f.nd + "_" + f.nm + "_" + f.na;
  if (cur === want) return canon;
  const r = reshapeStarterBands(canon, f.nd, f.nm, f.na);
  return r.outfield;
}

function applyCareerFormation(c) {
  if (!c || !MY_CLUB_FORMATIONS[c.formation]) return;
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!roster) return;
  const f = MY_CLUB_FORMATIONS[c.formation];
  const cur = (roster.defenders || []).length + "_" + (roster.midfielders || []).length + "_" + (roster.attackers || []).length;
  const want = f.defs + "_" + f.mids + "_" + f.atts;
  if (cur === want) return;
  const reshaped = reshapeStarterBands(roster, f.defs, f.mids, f.atts, ownedPool);
  const nr = reshaped.outfield;
  nr.goalkeeper = reshaped.goalkeeper;
  TEAM_ROSTERS[selectedTeam] = nr;
  for (const p of reshaped.extra) {
    if (p.__cid && !ownedPool.some(x => x.__cid === p.__cid)) ownedPool.push(p);
  }
  snapshotClubDefaults(selectedTeam);
  saveClubState();
}

function myClubBenchCids() {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !Array.isArray(c.bench)) return [];
  return c.bench.slice();
}

function myClubBench() {
  const cids = myClubBenchCids();
  return cids.map(cid => ownedPool.find(p => p.__cid === cid)).filter(Boolean);
}

function syncMyClubBench() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (!Array.isArray(c.bench)) c.bench = [];
  const inLineup = clubCardIdsInLineup();
  c.bench = c.bench.filter(cid => ownedPool.some(p => p.__cid === cid) && !inLineup.has(cid)).slice(0, 7);
  saveMyClubData();
}

function myClubBenchAdd(cid) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return false;
  if (!Array.isArray(c.bench)) c.bench = [];
  if (c.bench.indexOf(cid) !== -1) return false;
  if (c.bench.length >= 7) return false;
  const poolCard = ownedPool.find(p => p.__cid === cid);
  if (!poolCard) return false;
  if (cardIsInjured(poolCard)) return false;
  if (cardIsSuspended(poolCard)) return false;
  if (clubCardIdsInLineup().has(cid)) return false;
  c.bench.push(cid);
  saveMyClubData();
  return true;
}

function myClubBenchRemove(cid) {
  const c = getMyClubCareer(myClubLeague);
  if (!c || !Array.isArray(c.bench)) return;
  const i = c.bench.indexOf(cid);
  if (i === -1) return;
  c.bench.splice(i, 1);
  saveMyClubData();
}

function lineupBenchClick(i) {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (!Array.isArray(c.bench)) c.bench = [];
  if (c.bench[i]) {
    myClubBenchRemove(c.bench[i]);
    renderMyClubLineupTab();
    return;
  }
  if (!lineupSelCid) {
    const msg = document.getElementById("lineupMsg");
    if (msg) msg.textContent = "Pick a card from the list below first, then click a bench slot.";
    myClubLobbyMsg("Pick a card from the list below first, then click a bench slot to add it to the match bench.");
    return;
  }
  if (c.bench.length >= 7) {
    const msg = document.getElementById("lineupMsg");
    if (msg) msg.textContent = "The match bench is full (7). Remove a player first.";
    myClubLobbyMsg("The match bench is full (7). Remove a player first.");
    return;
  }
  const selCard = ownedPool.find(p => p.__cid === lineupSelCid);
  if (selCard && (cardIsInjured(selCard) || cardIsSuspended(selCard))) {
    const why = cardIsInjured(selCard) ? "injured" : "suspended";
    const msg = document.getElementById("lineupMsg");
    const note = selCard.name + " is " + why + " - they can't be added to the match bench.";
    if (msg) msg.textContent = note;
    myClubLobbyMsg(note);
    return;
  }
  if (myClubBenchAdd(lineupSelCid)) {
    const msg = document.getElementById("lineupMsg");
    if (msg) msg.textContent = "Added to match bench. Locked position cards can substitute here during a match.";
    lineupSelCid = null;
    renderMyClubLineupTab();
    return;
  }
  const msg = document.getElementById("lineupMsg");
  if (msg) msg.textContent = "That card is already on the bench or already in the starting lineup.";
  myClubLobbyMsg("That card is already on the bench or already in the starting lineup.");
}

function lineupBenchDrop(ev, i) {
  ev.preventDefault();
  const raw = (ev.dataTransfer && ev.dataTransfer.getData) ? ev.dataTransfer.getData("text/plain") : "";
  if (raw.indexOf("cid:") === 0) {
    const cid = raw.slice(4);
    const dropped = ownedPool.find(p => p.__cid === cid);
    const valid = c && Array.isArray(c.bench) && c.bench.length < 7 && c.bench.indexOf(cid) === -1 && dropped && !clubCardIdsInLineup().has(cid) && !cardIsInjured(dropped) && !cardIsSuspended(dropped);
    if (valid) myClubBenchAdd(cid);
  }
  lineupSelCid = null;
  renderMyClubLineupTab();
}

function renderMyClubLineupTab() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  loadClubStateFor(selectedTeam);
  const roster = TEAM_ROSTERS[selectedTeam];
  const invArr = Array.isArray(c.consumables) ? c.consumables : [];
  const invCounts = {};
  for (const id2 of invArr) invCounts[id2] = (invCounts[id2] || 0) + 1;
  let html = '<div class="lineupMsg" id="lineupMsg"></div>';
  html += '<div class="lineupWrap"><div class="lineupTeamOvr"><span class="ltoKey">Team Overall</span><b>' + getLineupOverall() + '</b></div>';
  const actManager = getActiveManager();
  html += actManager
    ? '<div class="managerStrip">Manager: <b>' + escapeHtml(actManager.name) + '</b> · ' + escapeHtml(managerBuffLabel(actManager)) + ' <button onclick="myClubShowTab(\'managers\')">Change</button></div>'
    : '<div class="managerStrip managerStripEmpty">No manager assigned · <button onclick="myClubShowTab(\'managers\')">Sign a manager</button></div>';
  html += '<div class="formationBar"><span class="formationKey">Formation</span>' +
    MY_CLUB_FORMATION_ORDER.map(k => '<button class="' + ((c.formation || "4-3-3") === k ? "sel" : "") + '" onclick="setMyClubFormation(\'' + k + '\')">' + k + '</button>').join("") +
    '<button class="lineupBestBtn" onclick="lineupBestXI()">Best Players</button>' +
    '</div>';
  const benchCids = myClubBenchCids();
  const benchCards = benchCids.map(cid => ownedPool.find(p => p.__cid === cid)).filter(Boolean);
  html += '<div class="matchBench">';
  html += '<div class="matchBenchHead"><div class="matchBenchTitleRow"><span class="matchBenchTitle">Match Bench</span>' +
    '<span class="matchBenchCount">' + benchCards.length + '/7 available for substitutions</span></div>' +
    '<button class="lineupBestBtn" onclick="lineupBestBench()">Best Players</button></div>';
  html += '<div class="matchBenchGrid" ondragover="lineupDragOver(event)" ondragleave="lineupDragLeave(event)">';
  for (let i = 0; i < 7; i++) {
    const bc = benchCards[i];
    const filled = !!bc;
    const ovr = bc ? calculateOverall(bc, bc.role) : 0;
    const posLabel = bc ? (bc.pos || myClubFallbackPos(bc.role)) : "";
    html += '<div class="matchBenchSlot' + (filled ? " filled" : "") + (lineupSelCid && !filled && benchCards.length < 7 ? " selHold" : "") + '"' +
      ' onclick="lineupBenchClick(' + i + ')"' +
      ' ondragover="lineupDragOver(event)" ondragleave="lineupDragLeave(event)"' +
      ' ondrop="lineupBenchDrop(event,' + i + ')">';
    if (bc) {
      html += '<button class="mbX" title="Remove from match bench" onclick="event.stopPropagation(); lineupBenchClick(' + i + ')">×</button>';
      html += '<div class="mbCard">' +
        '<span class="mbOvr">' + ovr + '</span>' +
        (posLabel ? '<span class="mbPos">' + escapeHtml(posLabel) + '</span>' : "") +
        '<span class="mbName">' + escapeHtml(bc.name) + '</span>' +
        (bc.tag ? '<span class="mbTier">' + escapeHtml(bc.tag) + '</span>' : "") +
        '</div>';
    } else {
      html += '<span class="mbPlus">+</span><span class="mbEmptyHint">add</span>';
    }
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="matchBenchHint">Pick a card in the list below (or drag one here), then click a bench slot to add it - the card moves onto the bench. Click a filled slot (x) to return it to the list. Only these up to 7 players can be subbed in during a match.</div>';
  html += '</div>';
  html += '<div class="lineupPitch">';
  const slotList = myClubSlotList();
  const rows = [];
  let band = [], bandKey = "";
  for (const s of slotList) {
    const b = s.key[0];
    if (b !== bandKey) { if (band.length) rows.push(band); band = []; bandKey = b; }
    band.push(s.key);
  }
  if (band.length) rows.push(band);
  for (const keys of rows) {
    html += '<div class="lineupRow">';
    for (const s of slotList) {
      if (keys.indexOf(s.key) === -1) continue;
      const pd = getSlotData(roster, s.key);
      let inner = '<span class="lineupSlotLabel">' + s.label + '</span>';
      if (pd) {
        const bp = buffedPlayerView(pd, s.role);
        const ovr = calculateOverall(bp, s.role);
        const oopActive = myClubOopFactor(pd, s.role) !== 1;
        const suspBadge = cardIsSuspended(pd) ? suspBadgeHTML() : "";
        const injBadge = cardIsInjured(pd) ? injBadgeHTML() : "";
        const clubColor = teamColors[selectedTeam] || "#168cff";
        inner += '<div class="lineupCard fcCard ' + (oopActive ? "oop" : "") + '" draggable="true" ondragstart="lineupDragStart(event, \'slot\', \'' + s.key + '\')" style="--club:' + clubColor + '">' +
          fcCardInner(pd, { ovr: ovr, pos: s.label, stats: [bp.pace, bp.shooting, bp.passing, bp.dribbling, bp.defending, bp.physical], clubColor: clubColor, clubName: selectedTeam }) +
          suspBadge +
          injBadge +
          lcInfoBtn('myClubCardInfoRoster(\'' + s.key + '\')') +
          (oopActive ? '<div class="lcOop">OUT OF POSITION</div>' : "") +
          '</div>';
      }
      html += '<div class="lineupSlot' + (s.key === "gk" ? "" : " lineupSlotSmall") + '" data-slot="' + s.key + '"' +
        ' onclick="lineupClickSlot(\'' + s.key + '\')"' +
        ' ondragover="lineupDragOver(event)" ondragleave="lineupDragLeave(event)"' +
        ' ondrop="lineupDropSlot(event, \'' + s.key + '\')">' + inner + '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  const assigned = clubCardIdsInLineup();
  const onMatchBench = {};
  for (const cid of benchCids) onMatchBench[cid] = true;
  const sbcDrafted = myClubSbcDraftedCids();
  let bench = ownedPool.filter(p => p.__cid && !assigned.has(p.__cid) && !onMatchBench[p.__cid] && !sbcDrafted.has(p.__cid));
  if (lineupSearch) bench = bench.filter(p => lineupCardMatches(p, lineupSearch));
  const roleOrder = { goalkeeper: 0, defender: 1, midfielder: 2, attacker: 3 };
  bench.sort((a, b) => {
    if (lineupSortMode === "pos") {
      const r = (roleOrder[a.role] || 0) - (roleOrder[b.role] || 0);
      if (r !== 0) return r;
      return (calculateOverall(b, b.role) - calculateOverall(a, a.role));
    }
    if (lineupSortMode === "name") {
      const cmp = String(a.name || "").localeCompare(String(b.name || ""));
      return lineupSortDesc ? cmp : -cmp;
    }
    if (lineupSortMode === "tier") {
      const t = myClubTagRank(b.tag) - myClubTagRank(a.tag);
      if (t !== 0) return lineupSortDesc ? t : -t;
      return calculateOverall(b, b.role) - calculateOverall(a, a.role);
    }
    const d = calculateOverall(b, b.role) - calculateOverall(a, a.role);
    return lineupSortDesc ? d : -d;
  });

  html += '<div class="lineupBench">';
  html += '<div class="lineupBenchHead"><div class="lineupInvTabs">' +
    '<button class="' + (lineupInventoryMode === "players" ? "sel" : "") + '" onclick="lineupSetInventoryMode(\'players\')">Players (' + bench.length + ')</button>' +
    '<button class="' + (lineupInventoryMode === "consumables" ? "sel" : "") + '" onclick="lineupSetInventoryMode(\'consumables\')">Consumables (' + invArr.length + ')</button>' +
    '</div></div>';
  html += '<div class="lineupSearchRow">' +
    '<input id="lineupSearchInput" class="lineupSearchInput" type="text" autocomplete="off" placeholder="Search your cards by name, position or type…" value="' + escapeHtml(lineupSearch) + '" oninput="lineupSetSearch(this.value)" />' +
    (lineupSearch ? '<button class="lineupSearchClear" title="Clear search" onclick="lineupClearSearch()">&times;</button>' : '') +
    '</div>';
  if (lineupInventoryMode === "consumables") {
    html += '<div class="lineupCombine"><div class="lineupCombineTitle">Combine</div>';
    for (const rk of Object.keys(MY_CLUB_COMBINE_RECIPES)) {
      const r = MY_CLUB_COMBINE_RECIPES[rk];
      if (!r || !Array.isArray(r.uses) || !r.out) continue;
      const ready = r.uses.every(u => (invCounts[u[0]] || 0) >= u[1]);
      const con = MY_CLUB_CONSUMABLES[r.out];
      html += '<div class="lcCombRow">' +
        '<div class="lcCombNeeds">' + r.uses.map((u, ui) => {
          const needCon = MY_CLUB_CONSUMABLES[u[0]];
          const n = invCounts[u[0]] || 0;
          return '<span class="lcCombNeed' + (n >= u[1] ? " ok" : "") + '">' +
            (needCon ? '<img class="combArt" src="' + consumableArt(needCon) + '" alt="" />' : "") +
            escapeHtml(needCon ? needCon.name : u[0]) + ' ' + n + '/' + u[1] + '</span>' +
            (ui < r.uses.length - 1 ? '<span class="lcCombPlus">+</span>' : "");
        }).join("") + '</div>' +
        '<span class="lcCombArrow">→</span>' +
        '<button class="lcCombBtn' + (ready ? "" : " off") + '" ' + (ready ? "" : "disabled ") + 'onclick="myClubCombineItems(\'' + rk + '\')"><img class="combArt" src="' + consumableArt(con) + '" alt="" />Make ' + escapeHtml(con ? con.name : "Item") + '</button>' +
        '</div>';
    }
    html += '</div>';
    html += '<div class="lineupBenchList lineupConsList">';
    const consIds = Object.keys(MY_CLUB_CONSUMABLES).filter(id2 => invCounts[id2]);
    const consQ = String(lineupSearch || "").toLowerCase().trim();
    const consShown = consQ ? consIds.filter(id2 => String(MY_CLUB_CONSUMABLES[id2].name || "").toLowerCase().indexOf(consQ) !== -1) : consIds;
    if (!consIds.length) {
      html += '<div class="lineupEmpty">No consumables. Buy a Consumable Box in the Packs tab or level up to earn one.</div>';
    } else if (!consShown.length) {
      html += '<div class="lineupEmpty">No consumables match your search.</div>';
    }
    for (const id2 of consShown) {
      const con = MY_CLUB_CONSUMABLES[id2];
      html += '<div class="conChip ' + (MY_CLUB_CONSUMABLE_TIER[con.rarity] || "tierSilver") + '" data-con="' + id2 + '" draggable="true" ondragstart="lineupDragStart(event, \'con\', \'' + id2 + '\')">' +
        '<img class="conChipArt" src="' + consumableArt(con) + '" alt="" />' +
        '<span class="conChipName">' + escapeHtml(con.name) + '</span>' +
        '<span class="conChipSkill">' + escapeHtml(consumableLabel(con)) + '</span>' +
        '<span class="conChipCount">×' + invCounts[id2] + '</span></div>';
    }
    html += '</div>';
  } else {
    html += '<div class="lineupSortRow">' +
      '<button onclick="lineupSortBy(\'pos\')" class="' + (lineupSortMode === "pos" ? "sel" : "") + '">' + lineupSortLabel("By Position", "pos") + '</button>' +
      '<button onclick="lineupSortBy(\'ovr\')" class="' + (lineupSortMode === "ovr" ? "sel" : "") + '">' + lineupSortLabel("By Overall", "ovr") + '</button>' +
      '<button onclick="lineupSortBy(\'name\')" class="' + (lineupSortMode === "name" ? "sel" : "") + '">' + lineupSortLabel("By Name", "name") + '</button>' +
      '<button onclick="lineupSortBy(\'tier\')" class="' + (lineupSortMode === "tier" ? "sel" : "") + '">' + lineupSortLabel("By Tier", "tier") + '</button>' +
      '</div>';
    html += '<div class="lineupBenchList" ondragover="lineupDragOver(event)" ondragleave="lineupDragLeave(event)" ondrop="lineupDropBench(event)">';
    if (!bench.length) {
      html += '<div class="lineupEmpty">' + (lineupSearch ? "No cards match your search." : "No players on the bench. Open a pack to sign new players.") + '</div>';
    }
    for (const p of bench) {
    const ovr = calculateOverall(p, p.role);
    const sel = lineupSelCid === p.__cid ? " sel" : "";
    const suspBadge = cardIsSuspended(p) ? suspBadgeHTML() : "";
    const injBadge = cardIsInjured(p) ? injBadgeHTML() : "";
    const clubColor = teamColors[selectedTeam] || "#168cff";
    html += '<div class="lineupCard lineupBenchCard fcCard' + sel + '" data-cid="' + escapeHtml(p.__cid) + '"' +
      ' onclick="lineupPickCard(\'' + escapeHtml(p.__cid) + '\')"' +
      ' draggable="true" ondragstart="lineupDragStart(event, \'cid\', \'' + escapeHtml(p.__cid) + '\')"' +
      ' style="--club:' + clubColor + '">' +
      fcCardInner(p, { ovr: ovr, clubColor: clubColor, clubName: selectedTeam }) +
      suspBadge +
      injBadge +
      lcInfoBtn('myClubCardInfoByCid(\'' + escapeHtml(p.__cid) + '\')') + lcDupeStrip(p) +
      '<button class="lineupSellBtn" title="Sell ' + escapeHtml(p.name) + ' for ' + formatMoney(myClubSellPrice(p)) + '"' +
      ' onclick="event.stopPropagation(); myClubSellCard(\'' + escapeHtml(p.__cid) + '\')">SELL +' + formatMoney(myClubSellPrice(p)) + '</button>' +
      '</div>';
  }
  html += '</div>';
  }
  html += '<div class="lineupBenchHint">' + (lineupInventoryMode === "consumables"
    ? "Drag a consumable onto a lineup player. Your inventory is used up on apply."
    : "Drag a card onto a pitch slot (or click a card, then click a slot) to set your XI. Cards can fill any slot, but a card played outside its natural role takes a small stat hit (OUT OF POSITION). Cards added to the Match Bench move out of this list.") + '</div>';
  html += '</div></div>';
  myClubTab("myClubTabLineup").innerHTML = html;
}

function openMyClubSettings() {
  if (!myClubLeague) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  openSettings();
}

function myClubCloseSettings() {
  closeSettings();
}

function myClubSettingsMsg(msg) {
  const el = document.getElementById("myClubSettingsMsg");
  if (el) el.textContent = msg;
}

const MYCLUB_SAVE_PREFIX = "MYSAVE1.";

function myClubSaveBytesToB64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes, i, i + chunk));
  }
  return btoa(bin);
}

function myClubSaveB64ToBytes(code) {
  const bin = atob(code);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Packs every persisted My Club slice into one portable object: the careers
// map, each career club's stored state (squad, pool, coins, sponsor, seq),
// the global card sequence/nation and preferred settings. Nothing is allowed
// to break the code - any non-serializable field drops out silently.
function myClubSaveSnapshot() {
  const clubs = {};
  for (const league in myClubCareerData.careers) {
    const list = myClubCareerData.careers[league];
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (!c || !c.clubName || clubs[c.clubName]) continue;
      try {
        const raw = localStorage.getItem(clubStorageKey(c.clubName));
        if (raw) clubs[c.clubName] = JSON.parse(raw);
      } catch (e) {}
    }
  }
  return {
    careers: JSON.parse(JSON.stringify(myClubCareerData.careers)),
    clubs: clubs,
    seq: myClubCardSeq,
    nation: myClubNation || "Brazil",
    settings: { autoDeleteLow: SETTINGS.autoDeleteLow, autoDeleteOvr: SETTINGS.autoDeleteOvr }
  };
}

function myClubExportSaveCode() {
  const el = document.getElementById("myClubSaveCodeOut");
  if (!el) return;
  let json;
  try {
    json = JSON.stringify(myClubSaveSnapshot());
  } catch (e) {
    myClubSettingsMsg("Could not build a save code from your club data.");
    return;
  }
  try {
    const utf8 = new TextEncoder().encode(json);
    el.value = MYCLUB_SAVE_PREFIX + myClubSaveBytesToB64(utf8);
  } catch (e) {
    myClubSettingsMsg("Could not encode your save code.");
    return;
  }
  myClubSettingsMsg("Save code ready - copy it somewhere safe.");
}

function myClubCopySaveCode() {
  const el = document.getElementById("myClubSaveCodeOut");
  if (!el || !el.value) {
    myClubSettingsMsg("Click Export to generate a save code first.");
    return;
  }
  el.focus();
  el.select();
  el.setSelectionRange(0, el.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (e) {}
  myClubSettingsMsg(copied ? "Save code copied to the clipboard." : "Select the code and copy it with Ctrl+C.");
}

function myClubImportSaveCode() {
  const el = document.getElementById("myClubSaveCodeIn");
  if (!el) return;
  const code = (el.value || "").trim().replace(/\s+/g, "");
  if (!code) {
    myClubSettingsMsg("Paste a save code first.");
    return;
  }
  let body = code;
  if (body.indexOf(MYCLUB_SAVE_PREFIX) === 0) body = body.slice(MYCLUB_SAVE_PREFIX.length);
  let snap = null;
  try {
    const json = new TextDecoder("utf-8").decode(myClubSaveB64ToBytes(body));
    snap = JSON.parse(json);
  } catch (e) {
    myClubSettingsMsg("That save code is not valid.");
    return;
  }
  if (!snap || !snap.careers || typeof snap.careers !== "object" || Array.isArray(snap.careers)) {
    myClubSettingsMsg("That save code is not valid.");
    return;
  }
  if (!window.confirm("Importing this save code will replace your current My Club progress. Continue?")) {
    return;
  }
  myClubCareerData.careers = snap.careers;
  saveMyClubData();
  if (snap.clubs && typeof snap.clubs === "object") {
    for (const team in snap.clubs) {
      try {
        localStorage.setItem(clubStorageKey(team), JSON.stringify(snap.clubs[team]));
      } catch (e) {}
    }
  }
  if (typeof snap.seq === "number") myClubCardSeq = snap.seq;
  if (typeof snap.nation === "string") myClubNation = snap.nation;
  if (snap.settings && typeof snap.settings === "object") {
    if (typeof snap.settings.autoDeleteLow === "boolean") SETTINGS.autoDeleteLow = snap.settings.autoDeleteLow;
    if (typeof snap.settings.autoDeleteOvr === "number") SETTINGS.autoDeleteOvr = snap.settings.autoDeleteOvr;
    saveSettings();
  }
  const c = getMyClubCareer(myClubLeague);
  if (c && c.clubName && TEAM_ROSTERS[c.clubName]) {
    selectedTeam = c.clubName;
    loadClubStateFor(c.clubName);
    hydrateMyClubSuspensions();
  }
  myClubRefreshHeader();
  myClubShowTab("club");
  myClubSettingsMsg("Save code imported - your club was restored.");
}

function myClubSaveName() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  let name = sanitizeClubName(document.getElementById("myClubSettingsName").value);
  if (!name) {
    myClubSettingsMsg("Enter a club name.");
    return;
  }
  const league = getMyClubLeague(c.league);
  if ((league.clubs || []).some(x => x.toLowerCase() === name.toLowerCase())) name = name + " FC";
  const others = allMyClubCareers()
    .map(n => n.clubName)
    .filter(n => n.toLowerCase() !== c.clubName.toLowerCase());
  if (others.some(n => n.toLowerCase() === name.toLowerCase())) name = name + " United";
  if (name.toLowerCase() === c.clubName.toLowerCase()) {
    myClubSettingsMsg("That is already your club name.");
    return;
  }
  myClubRenameClub(c, name);
  myClubSettingsMsg("Club renamed to " + name + ".");
}

function myClubRenameClub(c, newName) {
  const oldName = c.clubName;
  c.clubName = newName;
  if (TEAM_ROSTERS[oldName]) TEAM_ROSTERS[newName] = TEAM_ROSTERS[oldName];
  delete TEAM_ROSTERS[oldName];
  if (teamColors[oldName]) teamColors[newName] = teamColors[oldName];
  delete teamColors[oldName];
  if (clubDefaults[oldName]) clubDefaults[newName] = clubDefaults[oldName];
  delete clubDefaults[oldName];
  try {
    const oldKey = clubStorageKey(oldName);
    const stored = localStorage.getItem(oldKey);
    if (stored) {
      localStorage.setItem(clubStorageKey(newName), stored);
      localStorage.removeItem(oldKey);
    }
  } catch (e) {}
  const group = getPlayerGroup();
  selectedTeam = newName;
  if (group) {
    group.teams = group.teams.map(t => t === oldName ? newName : t);
    for (const m of (group.matches || [])) {
      if (m.team1 === oldName) m.team1 = newName;
      if (m.team2 === oldName) m.team2 = newName;
    }
  }
  const roster = TEAM_ROSTERS[newName];
  if (roster) {
    const tag = oldName + " ";
    for (const pos of ["goalkeeper", "defenders", "midfielders", "attackers"]) {
      const arr = Array.isArray(roster[pos]) ? roster[pos] : [roster[pos]];
      for (const p of arr) {
        if (p && p.name && p.name.indexOf(tag) === 0) p.name = newName + p.name.slice(tag.length);
      }
    }
  }
  saveMyClubData();
  saveClubState();
  myClubRefreshHeader();
}

function myClubSaveColor() {
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  const el = document.getElementById("myClubSettingsColor");
  const color = el && el.value ? el.value : c.color;
  if (!color) {
    myClubSettingsMsg("Pick a color first.");
    return;
  }
  c.color = color;
  teamColors[selectedTeam] = color;
  saveMyClubData();
  saveClubState();
  myClubSettingsMsg("Club colors updated.");
}

// ---------- Kits + procedural crest ----------
// Home / Away / Secondary kits and the crest are drawn procedurally (no
// external art). Kit colors live on the My Club career so they save/import
// with the club; the active kit repaints the player's side in every My Club
// match (season and PvP) and repaints the crest everywhere it is drawn.
const MY_CLUB_KIT_SLOTS = ["home", "away", "third"];
const MY_CLUB_CREST_SHAPES = ["shield", "tallshield", "pentagon", "diamond", "crest", "square", "laurel", "hexagon"];
const MY_CLUB_CREST_PATTERNS = ["none", "stripe", "slash", "split", "hoops", "chevrons"];
const MY_CLUB_CREST_SYMBOLS = ["none", "ball", "star", "crown", "lion", "eagle", "sword", "bolt", "laurel", "tower"];

function myClubKits(c) {
  if (!c) return null;
  if (!c.kits || typeof c.kits !== "object" || Array.isArray(c.kits)) {
    c.kits = { home: c.color || "#168cff", away: "#f4f4f4", third: "#12203a", active: "home" };
  }
  const base = c.color || "#168cff";
  if (!c.kits.home) c.kits.home = base;
  if (!c.kits.away) c.kits.away = mixHex(base, "#ffffff", 0.82);
  if (!c.kits.third) c.kits.third = mixHex(base, "#000000", 0.5);
  if (MY_CLUB_KIT_SLOTS.indexOf(c.kits.active) === -1) c.kits.active = "home";
  return c.kits;
}

function myClubLiveKitColor() {
  if (currentMode !== "myclub" || !myClubLeague) return "";
  const k = myClubKits(getMyClubCareer(myClubLeague));
  return k ? k[k.active] : "";
}

function myClubKitSyncInputs() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const k = myClubKits(c);
  if (!k) return;
  const ids = ["myClubKitHome", "myClubKitAway", "myClubKitThird"];
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.value = k[MY_CLUB_KIT_SLOTS[i]];
  }
  const actEl = document.getElementById("myClubKitActive");
  if (actEl) actEl.value = k.active;
  try {
    const shapeEl = document.getElementById("myClubCrestShape");
    if (shapeEl) shapeEl.value = (c && c.crestShape && MY_CLUB_CREST_SHAPES.indexOf(c.crestShape) >= 0) ? c.crestShape : "";
    const patternEl = document.getElementById("myClubCrestPattern");
    if (patternEl) patternEl.value = (c && c.crestPattern && MY_CLUB_CREST_PATTERNS.indexOf(c.crestPattern) >= 0) ? c.crestPattern : "";
    const symbolEl = document.getElementById("myClubCrestSymbol");
    if (symbolEl) symbolEl.value = (c && c.crestSymbol && MY_CLUB_CREST_SYMBOLS.indexOf(c.crestSymbol) >= 0) ? c.crestSymbol : "";
    const c1El = document.getElementById("myClubCrestColor1");
    if (c1El) c1El.value = (c && c.crestColor1) ? c.crestColor1 : (k[k.active] || "#168cff");
    const c2El = document.getElementById("myClubCrestColor2");
    if (c2El) c2El.value = (c && c.crestColor2) ? c.crestColor2 : mixHex(k[k.active] || "#168cff", "#ffffff", 0.85);
    const accentEl = document.getElementById("myClubCrestAccent");
    if (accentEl) accentEl.value = (c && c.crestAccent) ? c.crestAccent : mixHex(k[k.active] || "#168cff", "#000000", 0.4);
    const lettersEl = document.getElementById("myClubCrestLetters");
    if (lettersEl) lettersEl.value = (c && c.crestLetters) ? c.crestLetters : "";
  } catch (e) {}
  myClubRenderCrestPreview();
}

function myClubKitChanged() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const k = myClubKits(c);
  if (!k) return;
  const h = document.getElementById("myClubKitHome");
  const a = document.getElementById("myClubKitAway");
  const t = document.getElementById("myClubKitThird");
  if (h && h.value) k.home = h.value;
  if (a && a.value) k.away = a.value;
  if (t && t.value) k.third = t.value;
  const sel = document.getElementById("myClubKitActive");
  if (sel && MY_CLUB_KIT_SLOTS.indexOf(sel.value) !== -1) k.active = sel.value;
  saveMyClubData();
  saveClubState();
  try { applyTeamColors(); } catch (e) {}
  paintClubCrests();
}

function myClubKitReset() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  if (!c) return;
  const base = c.color || "#168cff";
  c.kits = { home: base, away: mixHex(base, "#ffffff", 0.82), third: mixHex(base, "#000000", 0.5), active: "home" };
  delete c.crestLetters;
  delete c.crestShape;
  delete c.crestPattern;
  delete c.crestSymbol;
  delete c.crestColor1;
  delete c.crestColor2;
  delete c.crestAccent;
  saveMyClubData();
  saveClubState();
  myClubKitSyncInputs();
  const lettersEl = document.getElementById("myClubCrestLetters");
  if (lettersEl) lettersEl.value = "";
  try { const sEl = document.getElementById("myClubCrestShape"); if (sEl) sEl.value = ""; const pEl = document.getElementById("myClubCrestPattern"); if (pEl) pEl.value = ""; const symEl = document.getElementById("myClubCrestSymbol"); if (symEl) symEl.value = ""; const c1El = document.getElementById("myClubCrestColor1"); if (c1El) c1El.value = ""; const c2El = document.getElementById("myClubCrestColor2"); if (c2El) c2El.value = ""; const aEl = document.getElementById("myClubCrestAccent"); if (aEl) aEl.value = ""; } catch (e) {}
  try { applyTeamColors(); } catch (e) {}
  paintClubCrests();
  myClubRenderCrestPreview();
  myClubSettingsMsg("Kits and crest restored.");
}

function clubNameInitials(name) {
  const clean = String(name || "").replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (!clean) return "FC";
  const skip = /^(FC|CF|AC|SC|AFC|SS|CD|UD|BC|SF|IF)$/i;
  const words = clean.split(/\s+/).filter(w => w && !skip.test(w));
  let letters;
  if (words.length >= 2) letters = words[0][0] + words[1][0];
  else letters = clean.slice(0, 2);
  letters = letters.toUpperCase().slice(0, 3);
  return letters || "FC";
}

function clubCrestSpec(team) {
  const name = String(team || selectedTeam || "Club");
  let letters = clubNameInitials(name);
  let c1 = teamColors[name] || "#168cff";
  let c2 = mixHex(c1, "#ffffff", 0.8);
  let accent = mixHex(c1, "#000000", 0.4);
  let shape = 0;
  let band = 0;
  let pattern = "none";
  let symbol = "none";
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  if (c && c.clubName === name) {
    const k = myClubKits(c);
    if (k && k[k.active]) c1 = k[k.active];
    c2 = mixHex(c1, "#ffffff", 0.85);
    accent = mixHex(c1, "#000000", 0.4);
    if (typeof c.crestLetters === "string" && c.crestLetters.trim()) letters = c.crestLetters.trim().toUpperCase().slice(0, 3);
    if (typeof c.crestShape === "string" && MY_CLUB_CREST_SHAPES.indexOf(c.crestShape) >= 0) shape = MY_CLUB_CREST_SHAPES.indexOf(c.crestShape);
    if (typeof c.crestPattern === "string" && MY_CLUB_CREST_PATTERNS.indexOf(c.crestPattern) >= 0) pattern = c.crestPattern;
    if (typeof c.crestSymbol === "string" && MY_CLUB_CREST_SYMBOLS.indexOf(c.crestSymbol) >= 0) symbol = c.crestSymbol;
    if (typeof c.crestColor1 === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.crestColor1)) c1 = c.crestColor1;
    if (typeof c.crestColor2 === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.crestColor2)) c2 = c.crestColor2;
    if (typeof c.crestAccent === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.crestAccent)) accent = c.crestAccent;
  } else {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    shape = hash % 4;
    band = (hash >> 3) % 3;
  }
  if (c && c.clubName === name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    if (typeof c.crestShape !== "string") shape = hash % MY_CLUB_CREST_SHAPES.length;
    if (typeof c.crestPattern !== "string") pattern = MY_CLUB_CREST_PATTERNS[(hash >> 4) % MY_CLUB_CREST_PATTERNS.length];
    if (typeof c.crestSymbol !== "string") symbol = MY_CLUB_CREST_SYMBOLS[(hash >> 6) % MY_CLUB_CREST_SYMBOLS.length];
    if (typeof c.crestShape === "undefined") band = (hash >> 3) % 3;
  }
  return { letters: letters, c1: c1, c2: c2, accent: accent, shape: shape, band: band, pattern: pattern, symbol: symbol };
}

function paintClubCrest(canvas, team) {
  if (!canvas || typeof canvas.getContext !== "function") return;
  const w = canvas.width, h = canvas.height;
  if (!w || !h) return;
  const g = canvas.getContext("2d");
  g.clearRect(0, 0, w, h);
  const spec = clubCrestSpec(team);
  const pad = Math.max(1, Math.round(Math.min(w, h) * 0.07));
  const x0 = pad, y0 = pad, cw = w - pad * 2, ch = h - pad * 2;
  const cx = x0 + cw / 2, cy = y0 + ch / 2;
  g.save();
  g.beginPath();
  if (spec.shape === 0) {
    g.moveTo(x0, y0);
    g.lineTo(x0 + cw, y0);
    g.lineTo(x0 + cw, y0 + ch * 0.55);
    g.quadraticCurveTo(x0 + cw, y0 + ch * 0.92, cx, y0 + ch);
    g.quadraticCurveTo(x0, y0 + ch * 0.92, x0, y0 + ch * 0.55);
    g.closePath();
  } else if (spec.shape === 1) {
    g.moveTo(cx, y0);
    g.bezierCurveTo(x0 + cw, y0, x0 + cw, y0 + ch, cx, y0 + ch);
    g.bezierCurveTo(x0, y0 + ch, x0, y0, cx, y0);
    g.closePath();
  } else if (spec.shape === 2) {
    g.moveTo(x0, y0);
    g.lineTo(x0 + cw, y0);
    g.lineTo(x0 + cw, y0 + ch * 0.68);
    g.lineTo(cx, y0 + ch * 0.9);
    g.lineTo(x0, y0 + ch * 0.68);
    g.closePath();
  } else if (spec.shape === 3) {
    g.moveTo(cx, y0);
    g.lineTo(x0 + cw, cy);
    g.lineTo(cx, y0 + ch);
    g.lineTo(x0, cy);
    g.closePath();
  } else if (spec.shape === 4) {
    g.moveTo(x0, y0 + ch * 0.12);
    g.lineTo(cx, y0);
    g.lineTo(x0 + cw, y0 + ch * 0.12);
    g.lineTo(x0 + cw * 0.88, y0 + ch);
    g.lineTo(x0 + cw * 0.12, y0 + ch);
    g.closePath();
  } else if (spec.shape === 5) {
    g.rect(x0, y0, cw, ch);
  } else if (spec.shape === 6) {
    g.moveTo(cx, y0);
    g.arc(cx, y0 + ch * 0.28, cw * 0.24, Math.PI, 0);
    g.lineTo(x0 + cw, y0 + ch);
    g.lineTo(x0, y0 + ch);
    g.closePath();
  } else if (spec.shape === 7) {
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + i * (Math.PI / 3);
      const px = cx + Math.cos(ang) * cw * 0.48;
      const py = cy + Math.sin(ang) * ch * 0.48;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
  } else {
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const px = cx + Math.cos(ang) * cw * 0.48;
      const py = cy + Math.sin(ang) * ch * 0.48;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
  }
  const grad = g.createLinearGradient(x0, y0, x0, y0 + ch);
  grad.addColorStop(0, mixHex(spec.c1, "#ffffff", 0.26));
  grad.addColorStop(1, spec.c1);
  g.fillStyle = grad;
  g.fill();
  g.lineWidth = Math.max(1, Math.round(Math.min(cw, ch) * 0.09));
  g.strokeStyle = spec.accent || mixHex(spec.c1, "#000000", 0.45);
  g.stroke();

  g.save();
  g.clip();
  if (spec.pattern === "stripe") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.7);
    g.fillRect(x0, cy - ch * 0.09, cw, ch * 0.18);
  } else if (spec.pattern === "slash") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.72);
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x0 + cw * 0.22, y0);
    g.lineTo(x0 + cw, y0 + ch * 0.78);
    g.lineTo(x0 + cw, y0 + ch);
    g.lineTo(x0 + cw * 0.78, y0 + ch);
    g.closePath();
    g.fill();
  } else if (spec.pattern === "split") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.74);
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(cx, cy);
    g.lineTo(x0, y0 + ch);
    g.closePath();
    g.fill();
  } else if (spec.pattern === "hoops") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.68);
    for (let i = 0; i < 4; i++) {
      g.fillRect(x0, y0 + ch * (0.18 + i * 0.2), cw, ch * 0.09);
    }
  } else if (spec.pattern === "chevrons") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.72);
    for (let i = 0; i < 3; i++) {
      const yy = y0 + ch * (0.2 + i * 0.22);
      g.beginPath();
      g.moveTo(x0, yy);
      g.lineTo(cx, yy + ch * 0.08);
      g.lineTo(x0 + cw, yy);
      g.lineTo(x0 + cw, yy + ch * 0.08);
      g.lineTo(cx, yy + ch * 0.16);
      g.lineTo(x0, yy + ch * 0.08);
      g.closePath();
      g.fill();
    }
  }
  if (spec.band === 1 && spec.pattern === "none") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.75);
    g.fillRect(x0, y0 + ch * 0.52, cw, ch * 0.18);
  } else if (spec.band === 2 && spec.pattern === "none") {
    g.fillStyle = mixHex(spec.c2, spec.c1, 0.8);
    g.beginPath();
    g.moveTo(cx, y0);
    g.lineTo(x0 + cw, y0);
    g.lineTo(x0 + cw, y0 + ch);
    g.closePath();
    g.fill();
  }
  g.restore();

  if (spec.symbol && spec.symbol !== "none") {
    g.save();
    g.fillStyle = "#ffffff";
    g.shadowColor = "rgba(0,0,0,0.55)";
    g.shadowBlur = 2;
    const sy = y0 + ch * 0.28;
    const sr = Math.min(cw, ch) * 0.16;
    if (spec.symbol === "ball") {
      g.beginPath();
      g.arc(cx, sy, sr, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = mixHex(spec.c1, "#000000", 0.4);
      g.stroke();
      g.beginPath();
      g.moveTo(cx - sr * 0.6, sy);
      g.lineTo(cx + sr * 0.6, sy);
      g.moveTo(cx, sy - sr * 0.6);
      g.lineTo(cx, sy + sr * 0.6);
      g.stroke();
    } else if (spec.symbol === "star") {
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        const r1 = sr, r2 = sr * 0.45;
        const px = cx + Math.cos(ang) * r1;
        const py = sy + Math.sin(ang) * r1;
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        const ang2 = ang + Math.PI / 5;
        g.lineTo(cx + Math.cos(ang2) * r2, sy + Math.sin(ang2) * r2);
      }
      g.closePath();
      g.fill();
    } else if (spec.symbol === "crown") {
      g.beginPath();
      g.moveTo(cx - sr, sy + sr * 0.4);
      g.lineTo(cx - sr * 0.6, sy - sr * 0.2);
      g.lineTo(cx - sr * 0.2, sy + sr * 0.1);
      g.lineTo(cx, sy - sr * 0.5);
      g.lineTo(cx + sr * 0.2, sy + sr * 0.1);
      g.lineTo(cx + sr * 0.6, sy - sr * 0.2);
      g.lineTo(cx + sr, sy + sr * 0.4);
      g.closePath();
      g.fill();
      g.fillRect(cx - sr * 0.9, sy + sr * 0.4, sr * 1.8, sr * 0.25);
    } else if (spec.symbol === "lion") {
      g.beginPath();
      g.arc(cx, sy, sr * 0.6, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(cx - sr * 0.25, sy - sr * 0.05, sr * 0.18, 0, Math.PI * 2);
      g.arc(cx + sr * 0.25, sy - sr * 0.05, sr * 0.18, 0, Math.PI * 2);
      g.fillStyle = "#1a1a1a";
      g.fill();
      g.fillStyle = "#ffffff";
    } else if (spec.symbol === "eagle") {
      g.beginPath();
      g.moveTo(cx, sy - sr * 0.6);
      g.lineTo(cx + sr * 0.5, sy);
      g.lineTo(cx, sy + sr * 0.2);
      g.lineTo(cx - sr * 0.5, sy);
      g.closePath();
      g.fill();
    } else if (spec.symbol === "sword") {
      g.beginPath();
      g.moveTo(cx, sy - sr);
      g.lineTo(cx + sr * 0.12, sy - sr * 0.2);
      g.lineTo(cx + sr * 0.12, sy + sr * 0.4);
      g.lineTo(cx - sr * 0.12, sy + sr * 0.4);
      g.lineTo(cx - sr * 0.12, sy - sr * 0.2);
      g.closePath();
      g.fill();
    } else if (spec.symbol === "bolt") {
      g.beginPath();
      g.moveTo(cx + sr * 0.1, sy - sr * 0.6);
      g.lineTo(cx - sr * 0.3, sy);
      g.lineTo(cx - sr * 0.05, sy);
      g.lineTo(cx - sr * 0.15, sy + sr * 0.6);
      g.lineTo(cx + sr * 0.32, sy - sr * 0.05);
      g.lineTo(cx + sr * 0.08, sy - sr * 0.05);
      g.closePath();
      g.fill();
    } else if (spec.symbol === "laurel") {
      g.beginPath();
      g.arc(cx - sr * 0.2, sy, sr * 0.35, Math.PI * 0.8, Math.PI * 1.8);
      g.arc(cx + sr * 0.2, sy, sr * 0.35, Math.PI * 1.2, Math.PI * 0.2);
      g.fill();
    } else if (spec.symbol === "tower") {
      g.beginPath();
      g.rect(cx - sr * 0.25, sy - sr * 0.5, sr * 0.5, sr * 0.7);
      g.moveTo(cx - sr * 0.35, sy - sr * 0.5);
      g.lineTo(cx, sy - sr * 0.7);
      g.lineTo(cx + sr * 0.35, sy - sr * 0.5);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  g.fillStyle = "#ffffff";
  g.font = "800 " + Math.round(Math.min(cw, ch) * 0.36) + "px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,0.6)";
  g.shadowBlur = 2;
  g.fillText(spec.letters, cx, y0 + ch * 0.72);
  g.restore();
}

function paintClubCrests() {
  const list = document.querySelectorAll("canvas[data-crest]");
  for (let i = 0; i < list.length; i++) {
    try { paintClubCrest(list[i], list[i].getAttribute("data-crest")); } catch (e) {}
  }
}

function myClubCrestCanvasHtml(team, size) {
  const px = size || 34;
  return '<canvas class="crestCanvas" data-crest="' + escapeHtml(String(team || "")) + '" width="' + px + '" height="' + px + '"></canvas>';
}

function myClubRenderCrestPreview() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const pv = document.getElementById("myClubCrestPreview");
  if (!pv) return;
  pv.innerHTML = c ? myClubCrestCanvasHtml(c.clubName, 44) : "";
  paintClubCrests();
}

function myClubCrestLettersChanged() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  if (!c) return;
  const el = document.getElementById("myClubCrestLetters");
  const raw = el ? String(el.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) : "";
  if (el && el.value !== raw) el.value = raw;
  if (raw) c.crestLetters = raw; else delete c.crestLetters;
  saveMyClubData();
  paintClubCrests();
  myClubRenderCrestPreview();
}

function myClubCrestStyleChanged() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  if (!c) return;
  const shapeEl = document.getElementById("myClubCrestShape");
  const patternEl = document.getElementById("myClubCrestPattern");
  const symbolEl = document.getElementById("myClubCrestSymbol");
  const c1El = document.getElementById("myClubCrestColor1");
  const c2El = document.getElementById("myClubCrestColor2");
  const accentEl = document.getElementById("myClubCrestAccent");
  if (shapeEl && MY_CLUB_CREST_SHAPES.indexOf(shapeEl.value) >= 0) c.crestShape = shapeEl.value; else delete c.crestShape;
  if (patternEl && MY_CLUB_CREST_PATTERNS.indexOf(patternEl.value) >= 0) c.crestPattern = patternEl.value; else delete c.crestPattern;
  if (symbolEl && MY_CLUB_CREST_SYMBOLS.indexOf(symbolEl.value) >= 0) c.crestSymbol = symbolEl.value; else delete c.crestSymbol;
  if (c1El && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c1El.value)) c.crestColor1 = c1El.value; else if (c1El && !c1El.value) delete c.crestColor1;
  if (c2El && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c2El.value)) c.crestColor2 = c2El.value; else if (c2El && !c2El.value) delete c.crestColor2;
  if (accentEl && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accentEl.value)) c.crestAccent = accentEl.value; else if (accentEl && !accentEl.value) delete c.crestAccent;
  saveMyClubData();
  paintClubCrests();
  myClubRenderCrestPreview();
}

function myClubAddFunds() {
  if (!myClubLeague) return;
  if (!SETTINGS.adminMode) return;
  playerCoins += 10000000;
  const c = getMyClubCareer(myClubLeague);
  if (c) c.coins = playerCoins;
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  myClubSettingsMsg("+$10,000,000 added to your budget.");
}

function myClubAddLevel() {
  if (!myClubLeague) return;
  if (!SETTINGS.adminMode) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) {
    myClubSettingsMsg("No My Club career loaded.");
    return;
  }
  c.level++;
  playerCoins += 75000 + c.level * 25000;
  c.coins = playerCoins;
  if (!Array.isArray(c.consumables)) c.consumables = [];
  c.consumables.push(myClubRollConsumable());
  saveClubState();
  saveMyClubData();
  pendingLevelUp = { levels: 1, reached: c.level };
  myClubRefreshHeader();
  myClubSettingsMsg("Club leveled up to level " + c.level + ".");
}

// ---------- Player Market (separate from the shop - real-life-time economy) ----------
const MYCLUB_MARKET_REFRESH_MS = 10 * 60 * 1000;
const MYCLUB_MARKET_SLOTS = 12;
let myClubMarketTickOn = false;

function myClubMarketData() {
  if (!myClubCareerData || typeof myClubCareerData !== "object" || Array.isArray(myClubCareerData)) {
    myClubCareerData = { v: 1, careers: {} };
  }
  let m = myClubCareerData.market;
  if (!m || typeof m !== "object" || Array.isArray(m)) {
    m = { v: 1, listings: [], lastRefresh: 0, sells: [], soldNews: [], seq: 0 };
    myClubCareerData.market = m;
  }
  if (!Array.isArray(m.listings)) m.listings = [];
  if (!Array.isArray(m.sells)) m.sells = [];
  if (!Array.isArray(m.soldNews)) m.soldNews = [];
  if (typeof m.lastRefresh !== "number" || !m.lastRefresh) m.lastRefresh = 0;
  if (typeof m.seq !== "number") m.seq = 0;
  return m;
}

function myClubMarketSave() {
  saveMyClubData();
}

function myClubMarketFmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss;
}

function myClubMarketRefreshAt() {
  const m = myClubMarketData();
  return m.lastRefresh ? m.lastRefresh + MYCLUB_MARKET_REFRESH_MS : 0;
}

function myClubMarketDue() {
  const m = myClubMarketData();
  return !m.lastRefresh || Date.now() >= m.lastRefresh + MYCLUB_MARKET_REFRESH_MS;
}

function myClubMarketMakeCard() {
  const weighted = [
    ["bronze", 24], ["silver", 22], ["gold", 17], ["special", 10], ["prospect", 8],
    ["gamelegend", 7], ["gk", 3], ["def", 3], ["mid", 3], ["att", 3],
    ["icon", 2.4], ["nationleader", 1.6], ["captain", 0.8], ["max", 0.8]
  ];
  let total = 0;
  for (const e of weighted) total += e[1];
  let roll = Math.random() * total;
  let type = "bronze";
  for (const e of weighted) { roll -= e[1]; if (roll <= 0) { type = e[0]; break; } }
  let card;
  try { card = makePackedCard(type); } catch (e) { card = makeCardForRarity("bronze"); }
  if (card) {
    // Give AI market stock the same pack-based value basis as a real pack
    // pull: which pack type this card was rolled as and what that pack costs.
    // So the pack-style pricing rule - the better cards from a pack come out
    // ahead of the worse ones - applies to the AI market's own cards too.
    const spec = MYCLUB_PACKS[type];
    if (spec && typeof spec.price === "number") {
      card.__packType = type;
      card.__packPrice = spec.price;
    }
  }
  // Holographic is a bonus card, so it never comes out of a pack's own pool -
  // the market stocks the odd one directly instead.
  if (Math.random() < MYCLUB_MARKET_HOLO_CHANCE) {
    const pick = MYCLUB_HOLO_PLAYERS[Math.floor(Math.random() * MYCLUB_HOLO_PLAYERS.length)];
    const holo = makeRatedPlayer(pick[0], pick[1], pick[2]);
    holo.role = pick[2];
    holo.tag = "HOLO";
    holo.variant = "Holographic";
    holo.pos = myClubPackPos(pick[2]);
    holo.nation = MYCLUB_PLAYER_NATIONS[pick[0]] || randNation();
    holo.__bonus = true;
    const fitted = myClubFitTier(holo, pick[1]);
    // Priced against a mid-high pack so it lands between Road to Glory and a
    // World Cup winner rather than above both.
    fitted.__packType = "gold";
    fitted.__packPrice = MYCLUB_PACKS.gold.price;
    card = fitted;
  }
  return card;
}

function myClubMarketAIMult(card) {
  const t = String(card.tag || "").toUpperCase();
  let mult = 1.9;
  if (t === "SPECIAL") mult = 2.2;
  else if (t === "HERO") mult = 2.25;
  else if (t === "ICON") mult = 2.45;
  else if (t === "MAX") mult = 2.95;
  else if (t === "WC") mult = 3.3;
  else if (t === "HOLO") mult = 3.0;
  else if (t === "RTG") mult = 2.7;
  else if (t === "LEGEND") mult = 2.6;
  else if (t === "PROSPECT") mult = 1.85;
  else if (t === "CAPTAIN" || t === "PL" || t === "LALIGA" || t === "BUNDESLIGA" || t === "SERIEA" || t === "LIGUE1") mult = 2.35;
  else if (t === "NATIONLEADER") mult = 2.55;
  return mult;
}

function myClubMarketAIPrice(card) {
  // Price each "For Sale" card against the card's current (updated) value
  // scale - the raised rating- and pack-relative quick-sell price - then mark
  // it up a little bit more, so buying off the market always costs comfortably
  // more than cashing the same card out.
  const base = myClubCardValue(card);
  const mult = myClubMarketAIMult(card);
  const jitter = 0.92 + Math.random() * 0.2;
  const price = Math.round(base * mult * jitter / 500) * 500;
  return Math.max(25000, price);
}

// --- Price guide: search every named card in the game -----------------------
// The full card universe for My Club is the named pool shared by packs and the
// AI market stock (Special, Hero, Icon, MAX, Prospect, Holographic and Nation
// Legend players), plus the three generated standard bands. The guide loads
// that universe once and prices each entry exactly like a market listing, so
// the number you see is what a fresh "For Sale" copy of that card would cost.
let myClubCatalogCache = null;

function myClubCatalogBuild() {
  if (myClubCatalogCache) return myClubCatalogCache;
  const list = [];
  const seen = {};
  const add = function (name, baseOvr, role, tag, variant, nation) {
    const key = tag + "|" + name;
    if (seen[key]) return;
    seen[key] = 1;
    list.push({ name: String(name), baseOvr: typeof baseOvr === "number" ? baseOvr : 70,
      role: role || "attacker", tag: tag || "GOLD", variant: variant || "", nation: nation || "" });
  };
  for (const e of (MYCLUB_SPECIAL_PLAYERS || [])) add(e[0], e[1], e[2], "SPECIAL", "Special");
  for (const e of (MYCLUB_HERO_PLAYERS || [])) add(e[0], e[1], e[2], "HERO", "Game Legend");
  for (const e of (MYCLUB_ICON_PLAYERS || [])) add(e[0], e[1], e[2], "ICON", "");
  for (const e of (MYCLUB_MAX_PLAYERS || [])) add(e[0], e[1], e[2], "MAX", "MAX");
  for (const e of (MYCLUB_PROSPECT_PLAYERS || [])) add(e[0], e[1], e[2], "PROSPECT", "Prospect");
  for (const e of (MYCLUB_HOLO_PLAYERS || [])) add(e[0], e[1], e[2], "HOLO", "Holographic", MYCLUB_PLAYER_NATIONS[e[0]] || "");
  for (const nk in (MYCLUB_NATION_LEGENDS || {})) {
    const pool = MYCLUB_NATION_LEGENDS[nk] || [];
    for (const raw of pool) {
      const e = normalizePackEntry(raw);
      add(e.name, e.baseOvr, e.role, "LEGEND", "Nation Legend", e.nation || nk);
    }
  }
  myClubCatalogCache = list;
  return list;
}

function myClubCatalogCard(entry) {
  // Deterministic copy of the exact player a pack/the market wraps up, priced
  // the same way. Uses the pool's base OVR (no random +/-1), because a price
  // guide shows the card's list value, not this week's rolled variant.
  try {
    const name = entry.name, ovr = entry.baseOvr, role = entry.role || "attacker";
    let card;
    if (entry.tag === "LEGEND") {
      const nat = entry.nation || "england";
      const e = normalizePackEntry({ name: name, ovr: ovr, role: role, nation: nat });
      card = e.stats ? makePlayerData(e.name, e.stats) : makeRatedPlayer(e.name, e.baseOvr, e.role);
      card.role = e.role;
      card.tag = "LEGEND";
      card.variant = "Nation Legend";
      card.pos = myClubPackPos(e.role);
      card.nation = e.nation || MYCLUB_PLAYER_NATIONS[e.name] || nat;
      card = myClubFitTier(card, e.baseOvr);
    } else if (entry.tag === "HOLO") {
      card = makeRatedPlayer(name, ovr, role);
      card.role = role;
      card.tag = "HOLO";
      card.variant = "Holographic";
      card.pos = myClubPackPos(role);
      card.nation = MYCLUB_PLAYER_NATIONS[name] || entry.nation || randNation();
      card.__bonus = true;
      card = myClubFitTier(card, ovr);
    } else {
      card = makeRatedPlayer(name, ovr, role);
      card.role = role;
      card.tag = entry.tag;
      card.variant = entry.variant;
      card.pos = myClubPackPos(role);
      card.nation = MYCLUB_PLAYER_NATIONS[name] || entry.nation || randNation();
      card = myClubFitTier(card, ovr);
    }
    return card;
  } catch (err) {
    return null;
  }
}

function myClubCatalogPrice(card) {
  if (!card) return null;
  const base = myClubCardValue(card);
  const price = Math.round(base * myClubMarketAIMult(card) / 500) * 500;
  return Math.max(25000, price);
}

function myClubCatalogFind(q) {
  const needle = String(q || "").trim().toLowerCase();
  const all = myClubCatalogBuild();
  if (!needle) return all.slice(0, 14);
  const terms = needle.split(/\s+/);
  const hits = [];
  for (const e of all) {
    const hay = (e.name + " " + e.nation + " " + e.role + " " + e.tag).toLowerCase();
    if (terms.every(function (t) { return hay.indexOf(t) !== -1; })) hits.push(e);
  }
  hits.sort(function (a, b) { return b.baseOvr - a.baseOvr || (a.name < b.name ? -1 : 1); });
  return hits.slice(0, 14);
}

function myClubCatalogRow(entry) {
  const card = myClubCatalogCard(entry);
  if (!card) return "";
  const ovr = calculateOverall(card, card.role || "attacker");
  const price = myClubCatalogPrice(card);
  const cls = cardTierClass(card, ovr) || "tierGold";
  return '<div class="mktCatRow">' +
    '<span class="mktCatAvatar ' + cls + '">' + escapeHtml((card.name || "?").slice(0, 2)).toUpperCase() + '</span>' +
    '<span class="mktCatInfo"><b>' + escapeHtml(card.name) + '</b><em>' +
    escapeHtml(cardTypeLabel(card)) + ' &middot; ' + escapeHtml(card.role) + ' &middot; ' +
    escapeHtml(card.nation || "") + '</em></span>' +
    '<span class="mktCatOvr">' + ovr + '</span>' +
    '<span class="mktCatPrice">' + formatMoney(price) + '</span></div>';
}

function myClubCatalogPaint() {
  const qEl = document.getElementById("mktCatalogInput");
  const wrap = document.getElementById("mktCatalogResults");
  if (!qEl || !wrap) return;
  const q = qEl.value;
  const hits = myClubCatalogFind(q);
  if (!hits.length) {
    wrap.innerHTML = '<div class="mktEmpty">No named card matches "' + escapeHtml(q) +
      '". Standard Bronze / Silver / Gold cards are generated per pull rather than '
      + 'named - search a player above or browse by tag.</div>';
    return;
  }
  let h = '';
  for (const e of hits) h += myClubCatalogRow(e);
  if (hits.length >= 14) h += '<div class="mktCatMore">Showing 14 - refine your search for more.</div>';
  wrap.innerHTML = h;
}

function myClubMarketRoll() {
  const m = myClubMarketData();
  m.lastRefresh = Date.now();
  const keep = [];
  for (const l of m.listings) {
    if (l && l.card && Math.random() < 0.45) {
      // Re-price lingering cards whenever the market re-stocks so the whole
      // board tracks the current (updated) value scale, not an old roll's.
      l.price = myClubMarketAIPrice(l.card);
      keep.push(l);
    }
  }
  const fresh = Math.max(2, MYCLUB_MARKET_SLOTS - keep.length);
  for (let i = 0; i < fresh; i++) {
    // Rarer cards get a lower stock chance, so the board is mostly commons
    // with the occasional big one. A rejected roll is simply re-rolled so the
    // slot count still fills out.
    let card = null;
    for (let attempt = 0; attempt < 14; attempt++) {
      const c = myClubMarketMakeCard();
      if (!c) continue;
      if (Math.random() <= myClubMarketRarityChance(c)) { card = c; break; }
    }
    if (!card) continue;
    m.seq++;
    keep.push({ id: "mk" + m.seq, card: card, price: myClubMarketAIPrice(card), listedAt: Date.now() });
  }
  m.listings = keep;
  myClubMarketSave();
  return keep;
}

function myClubMarketEnsure() {
  if (myClubMarketDue()) myClubMarketRoll();
}

function myClubMarketSuggest(card) {
  const packPrice = typeof card.__packPrice === "number" && card.__packPrice > 0 ? card.__packPrice : 0;
  if (packPrice > 0) {
    return Math.max(15000, Math.round(packPrice * myClubPackMarketFactor(card) / 500) * 500);
  }
  const q = myClubCardValue(card);
  const t = String(card.tag || "").toUpperCase();
  let mult = 1.45;
  if (t === "ICON") mult = 1.6;
  else if (t === "MAX") mult = 3.5;
  else if (t === "WC") mult = 3.1;
  else if (t === "HOLO") mult = 2.8;
  else if (t === "RTG") mult = 2.5;
  else if (t === "HERO" || t === "LEGEND") mult = 1.5;
  const ovr = Math.round(calculateOverall(card, card.role || "attacker"));
  if (ovr >= 95) mult = 1.6;
  const p = Math.round(q * mult / 500) * 500;
  return Math.max(15000, p);
}

const MYCLUB_MARKET_NO_BUYERS_RATIO = 1.8;
// Roughly one Holographic card per 170 market listings.
const MYCLUB_MARKET_HOLO_CHANCE = 0.006;

function myClubMarketSellDurationMs(card, price) {
  const fair = myClubMarketSuggest(card);
  const ratio = price / fair;
  if (ratio >= MYCLUB_MARKET_NO_BUYERS_RATIO) return null;
  let minSec, maxSec;
  if (ratio < 0.8) { minSec = 20; maxSec = 150; }
  else if (ratio < 0.95) { minSec = 60; maxSec = 240; }
  else if (ratio <= 1.05) { minSec = 180; maxSec = 540; }
  else if (ratio <= 1.2) { minSec = 480; maxSec = 900; }
  else if (ratio <= 1.4) { minSec = 900; maxSec = 1500; }
  else { minSec = 1500; maxSec = 2640; }
  return (minSec + Math.random() * (maxSec - minSec)) * 1000;
}

function myClubMarketEtaLabel(card, price) {
  const fair = myClubMarketSuggest(card);
  const d = myClubMarketSellDurationMs(card, price);
  const mins = (d / 60000);
  if (d === null) {
    return "No buyer will pay this much - the card won't sell. Drop it near the market average of " + formatMoney(fair) + ".";
  }
  const phrase = mins < 1 ? "under a minute" : "about " + Math.max(1, Math.round(mins)) + " min";
  const dir = price < fair * 0.85 ? "Below average - should sell fast (roughly " + phrase + ")."
    : (price <= fair * 1.05 ? "Around the average - sells in roughly " + phrase + "."
      : "Above average - a slower sale, roughly " + phrase + ".");
  return dir;
}

function myClubCareerByClub(clubName) {
  if (!clubName) return null;
  for (const lg in (myClubCareerData.careers || {})) {
    const list = myClubCareerData.careers[lg];
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (c && c.clubName === clubName) return { c: c, league: lg };
    }
  }
  return null;
}

function myClubMarketSettle() {
  const m = myClubMarketData();
  const now = Date.now();
  const ready = m.sells.filter(s => s && s.status === "listed" && !s.noBuyers && typeof s.sellsAt === "number" && now >= s.sellsAt);
  if (!ready.length) return;
  const wasActive = selectedTeam;
  for (const s of ready) {
    s.status = "sold";
    s.soldAt = now;
    const pay = (typeof s.price === "number" ? s.price : 0);
    if (pay > 0) {
      const found = myClubCareerByClub(s.club);
      const c = found ? found.c : null;
      if (c) {
        c.coins = (typeof c.coins === "number" ? c.coins : 0) + pay;
        if (found.league === myClubLeague && selectedTeam === s.club) {
          playerCoins += pay;
          saveClubState();
        }
      } else if (myClubLeague && selectedTeam === s.club) {
        playerCoins += pay;
        saveClubState();
      }
    }
    m.soldNews.unshift({ name: (s.card && s.card.name) || "A card", price: pay, at: now, club: s.club });
    if (m.soldNews.length > 6) m.soldNews.length = 6;
  }
  m.sells = m.sells.filter(s => !(s && s.status === "sold"));
  myClubMarketSave();
  myClubRefreshHeader();
  const pane = document.getElementById("myClubTabMarket");
  if (pane && pane.classList.contains("sel")) renderMyClubMarketTab();
}

function myClubMarketStartTicker() {
  if (myClubMarketTickOn) return;
  myClubMarketTickOn = true;
  setInterval(myClubMarketTick, 1000);
}

function myClubMarketTick() {
  const sc = document.getElementById("myClubScreen");
  if (!sc || sc.style.display === "none") return;
  const pane = document.getElementById("myClubTabMarket");
  if (!pane || !pane.classList.contains("sel")) return;
  if (matchRunning) return;
  const now = Date.now();
  const nextAt = myClubMarketRefreshAt();
  const cdEl = document.getElementById("mktRefreshCd");
  if (cdEl) {
    if (nextAt && now < nextAt) cdEl.textContent = myClubMarketFmt(nextAt - now);
    else if (nextAt && now >= nextAt) {
      myClubMarketRoll();
      const pane2 = document.getElementById("myClubTabMarket");
      if (pane2 && pane2.classList.contains("sel")) renderMyClubMarketTab();
    }
  }
  const cdEls = document.querySelectorAll("#myClubTabMarket [data-sellsat]");
  for (const el of cdEls) {
    const t = parseInt(el.getAttribute("data-sellsat"), 10);
    const left = t - now;
    if (left <= 0) continue;
    el.classList.toggle("warn", left < 60000);
    el.textContent = "sells in " + myClubMarketFmt(left);
  }
  myClubMarketSettle();
}

function myClubMarketFace(card) {
  const ovr = Math.round(calculateOverall(card, card.role || "attacker"));
  return fcCardInner(card, { ovr: ovr, clubColor: "#101c2b", clubName: card.club });
}

function myClubMarketBuyCardHTML(l) {
  const card = l.card;
  const ovr = Math.round(calculateOverall(card, card.role || "attacker"));
  const scarce = myClubMarketRareTag(card)
    ? '<div class="mktStatus">scarce - only ' + myClubMarketOnMarketCount(card) + ' on the market</div>'
    : '';
  return '<div class="lineupCard lineupBenchCard mktCard fcCard" style="--club:#101c2b">' +
    myClubMarketFace(card) +
    '<div class="mktPrice">' + formatMoney(l.price) + '</div>' +
    '<div class="mktQuick">quick-sell value ' + formatMoney(myClubSellPrice(card)) + '</div>' +
    scarce +
    '<div class="mktRow"><button onclick="myClubMarketBuy(\'' + l.id + '\')">Buy</button></div>' +
    '</div>';
}

function myClubMarketSellCardHTML(s) {
  const card = s.card;
  const ovr = Math.round(calculateOverall(card, card.role || "attacker"));
  const fair = myClubMarketSuggest(card);
  let statusLine = '<div class="mktStatus">quick-sell value ' + formatMoney(myClubSellPrice(card)) + ' \u00b7 avg ' + formatMoney(fair) + '</div>';
  if (s.noBuyers) {
    return '<div class="lineupCard lineupBenchCard mktCard fcCard" style="--club:#101c2b">' +
      myClubMarketFace(card) +
      '<div class="mktPrice mktMin">' + formatMoney(s.price) + '</div>' +
      '<div class="mktStatus mktMin">Priced too high \u2014 no buyer at this price.</div>' +
      statusLine +
      '<div class="mktRow"><button onclick="myClubMarketWithdraw(\'' + s.id + '\')">Withdraw</button></div>' +
      '</div>';
  }
  const left = (typeof s.sellsAt === "number" ? s.sellsAt : 0) - Date.now();
  const leftTxt = left > 0 ? myClubMarketFmt(left) : "sold";
  return '<div class="lineupCard lineupBenchCard mktCard fcCard" style="--club:#101c2b">' +
    myClubMarketFace(card) +
    '<div class="mktPrice">' + formatMoney(s.price) + '</div>' +
    '<div class="mktCountdown' + (left < 60000 ? " warn" : "") + '" data-sellsat="' + (typeof s.sellsAt === "number" ? s.sellsAt : 0) + '">sells in ' + leftTxt + '</div>' +
    statusLine +
    '<div class="mktRow"><button onclick="myClubMarketWithdraw(\'' + s.id + '\')">Withdraw</button></div>' +
    '</div>';
}

function myClubMarketPickCardHTML(p) {
  const ovr = Math.round(calculateOverall(p, p.role || "attacker"));
  return '<div class="lineupCard lineupBenchCard mktPickCard fcCard" style="--club:#101c2b">' +
    myClubMarketFace(p) +
    '<div class="lcFooter">' + lcInfoBtn('myClubCardInfoByCid(\'' + escapeHtml(p.__cid) + '\')') + '</div>' +
    '<div class="mktPrice">suggested ' + formatMoney(myClubMarketSuggest(p)) + '</div>' +
    '<div class="mktRow"><button onclick="myClubMarketOpenList(\'' + escapeHtml(p.__cid) + '\')">List</button></div>' +
    '</div>';
}

function myClubMarketBigCardHTML(card, price) {
  const ovr = Math.round(calculateOverall(card, card.role || "attacker"));
  return '<div class="lineupCard lineupBenchCard mktCard fcCard" style="--club:#101c2b">' +
    myClubMarketFace(card) +
    '<div class="mktPrice">' + formatMoney(price) + '</div>' +
    '<div class="mktQuick">quick-sell value ' + formatMoney(myClubSellPrice(card)) + '</div>' +
    '</div>';
}

let myClubMarketQuery = "";
let myClubMarketRarity = "all";

// Rare cards are deliberately thin on the market board. A card's tag decides
// how likely it is to be stocked at all when the market re-rolls.
function myClubMarketRarityChance(card) {
  const t = String((card && card.tag) || "").toUpperCase();
  if (t === "MAX" || t === "WC") return 0.35;
  if (t === "HOLO") return 0.4;
  if (t === "ICON" || t === "RTG") return 0.6;
  if (t === "LEGEND") return 0.75;
  const ovr = Math.round(calculateOverall(card, (card && card.role) || "attacker"));
  if (ovr >= 92) return 0.7;
  return 1;
}

function myClubMarketMatches(card) {
  const q = (myClubMarketQuery || "").trim().toLowerCase();
  if (q) {
    const hay = [card && card.name, card && card.nation, card && card.pos,
      card && card.role, card && card.tag, card && card.variant]
      .filter(Boolean).join(" ").toLowerCase();
    if (hay.indexOf(q) === -1) return false;
  }
  const r = myClubMarketRarity || "all";
  if (r === "all") return true;
  const t = String((card && card.tag) || "").toUpperCase();
  const special = ["SPECIAL", "HERO", "PROSPECT", "CAPTAIN", "PL", "LALIGA", "BUNDESLIGA", "SERIEA", "LIGUE1", "NATIONLEADER"];
  if (r === "special") return special.indexOf(t) !== -1;
  if (r === "elite") return t === "ICON" || t === "RTG" || t === "LEGEND";
  if (r === "legend") return t === "MAX" || t === "WC" || t === "HOLO";
  if (r === "common") return !(t === "ICON" || t === "RTG" || t === "LEGEND" || t === "MAX" || t === "WC" || t === "HOLO");
  return true;
}

function myClubMarketOnMarketCount(card) {
  const name = card && card.name;
  if (!name) return 0;
  const m = myClubMarketData();
  let n = 0;
  for (const l of m.listings) if (l && l.card && l.card.name === name) n++;
  return n;
}

function myClubMarketRareTag(card) {
  const t = String((card && card.tag) || "").toUpperCase();
  return t === "MAX" || t === "WC" || t === "HOLO" || t === "ICON" || t === "RTG";
}

function myClubMarketSetQuery(q) {
  myClubMarketQuery = q || "";
  myClubMarketPaintSections();
}

function myClubMarketSetRarity(r) {
  myClubMarketRarity = r || "all";
  myClubMarketPaintSections();
}

// Fill just the three card grids. The search box lives outside these wrappers,
// so re-painting them on every keystroke never steals focus mid-typing.
function myClubMarketPaintSections() {
  const m = myClubMarketData();
  const c = getMyClubCareer(myClubLeague);
  const forSale = document.getElementById("mktForSaleWrap");
  if (forSale) {
    const list = m.listings.filter(l => l && l.card && myClubMarketMatches(l.card));
    if (!list.length) {
      forSale.innerHTML = '<div class="mktEmpty">No cards match your search.</div>';
    } else {
      let g = '<div class="mktGrid">';
      for (const l of list) g += myClubMarketBuyCardHTML(l);
      forSale.innerHTML = g + '</div>';
    }
  }
  const mine = document.getElementById("mktMineWrap");
  if (mine) {
    const list = c ? m.sells.filter(s => s && s.club === c.clubName && s.status === "listed" && myClubMarketMatches(s.card)) : [];
    if (!list.length) {
      mine.innerHTML = '<div class="mktEmpty">' + (c && m.sells.some(s => s && s.club === c.clubName && s.status === "listed")
        ? "No listed cards match your search."
        : "Nothing listed yet. Pick a card below and list it - it can take a few real minutes before it sells, then your club is paid. Listed cards are still yours until they sell.") + '</div>';
    } else {
      let g = '<div class="mktGrid">';
      for (const s of list) g += myClubMarketSellCardHTML(s);
      mine.innerHTML = g + '</div>';
    }
  }
  const pick = document.getElementById("mktListWrap");
  if (pick) {
    const cands = ownedPool.filter(p => myClubMarketMatches(p)).slice();
    cands.sort((a, b) => calculateOverall(b, b.role || "attacker") - calculateOverall(a, a.role || "attacker"));
    if (!cands.length) {
      pick.innerHTML = '<div class="mktEmpty">No cards match your search.</div>';
    } else {
      let g = '<div class="mktPickList">';
      for (const p of cands) g += myClubMarketPickCardHTML(p);
      pick.innerHTML = g + '</div>';
    }
  }
}

function renderMyClubMarketTab() {
  if (!myClubLeague) return;
  myClubMarketEnsure();
  myClubMarketSettle();
  const m = myClubMarketData();
  const c = getMyClubCareer(myClubLeague);
  const pane = document.getElementById("myClubTabMarket");
  if (!pane) return;
  let h = '';
  const nextAt = myClubMarketRefreshAt();
  h += '<div class="mktTop"><div class="mktRefresh">The whole market re-stocks every 10 real minutes (some cards linger). Next refresh in <b id="mktRefreshCd">' +
    (nextAt && nextAt > Date.now() ? myClubMarketFmt(nextAt - Date.now()) : "listing now") + '</b></div>';
  h += '<div class="mktNews">' + m.soldNews.slice(0, 4).map(n =>
    '<span class="mktNewsChip">Sold ' + escapeHtml(n.name) + ' for ' + formatMoney(n.price) + '</span>').join("") + '</div></div>';
  h += '<div class="mktSellHead">For Sale - coin prices, paid from your balance now</div>';
  h += '<div class="mktSearchRow"><input id="mktSearch" type="text" placeholder="Search cards: name, nation, position, tag..." value="' +
    escapeHtml(myClubMarketQuery || "") + '" oninput="myClubMarketSetQuery(this.value)" />' +
    '<select id="mktRarity" onchange="myClubMarketSetRarity(this.value)">' +
    '<option value="all"' + ((myClubMarketRarity === "all") ? " selected" : "") + '>All cards</option>' +
    '<option value="common"' + ((myClubMarketRarity === "common") ? " selected" : "") + '>Common</option>' +
    '<option value="special"' + ((myClubMarketRarity === "special") ? " selected" : "") + '>Special</option>' +
    '<option value="elite"' + ((myClubMarketRarity === "elite") ? " selected" : "") + '>Elite (Icon/Retro)</option>' +
    '<option value="legend"' + ((myClubMarketRarity === "legend") ? " selected" : "") + '>Legendary (MAX/World Cup/Holo)</option>' +
    '</select></div>';
  if (!m.listings.length) {
    h += '<div id="mktForSaleWrap"><div class="mktEmpty">The market is being stocked...</div></div>';
  } else {
    h += '<div id="mktForSaleWrap"></div>';
  }
  const mine = c ? m.sells.filter(s => s && s.club === c.clubName && s.status === "listed") : [];
  h += '<div class="mktSellHead">Your Listings (' + mine.length + ') - sales settle in real time, not game time</div>';
  h += '<div id="mktMineWrap"></div>';
  h += '<div class="mktSellHead">List a Card - pick from your squad</div>';
  h += '<div id="mktListWrap"></div>';
  h += '<div class="mktSellHead mktPriceHead">Price Guide - search any card in the game</div>';
  h += '<div class="mktSearchRow"><input id="mktCatalogInput" type="text" placeholder="e.g. Messi, ICON, goalkeeper, Brazil..." ' +
    'oninput="myClubCatalogPaint()" onkeyup="myClubCatalogPaint()" />' +
    '<span class="mktCatHint">Prices match what a freshly listed card of that player would cost. Covers every named card: ' +
    'Special, Hero, Icon, MAX, Prospect, Holographic and Nation Legend.</span></div>';
  h += '<div id="mktCatalogResults"></div>';
  pane.innerHTML = h;
  myClubMarketPaintSections();
  myClubCatalogPaint();
}

let marketBuyId = null;
let marketListCid = null;

function myClubMarketBuy(id) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const m = myClubMarketData();
  const l = m.listings.find(x => x.id === id);
  const c = getMyClubCareer(myClubLeague);
  if (!l || !c) return;
  marketBuyId = id;
  document.getElementById("marketBuyCard").innerHTML = myClubMarketBigCardHTML(l.card, l.price);
  document.getElementById("marketBuyName").textContent = l.card.name;
  document.getElementById("marketBuyPrice").textContent = formatMoney(l.price);
  document.getElementById("marketBuyHint").textContent = "Your balance: " + formatMoney(playerCoins) + ". Buying is final - the coins leave the club now.";
  const btn = document.getElementById("marketBuyBtn");
  btn.disabled = playerCoins < l.price;
  document.getElementById("marketBuyModal").style.display = "flex";
}

function myClubMarketConfirmBuy() {
  if (!marketBuyId) return;
  const id = marketBuyId;
  const m = myClubMarketData();
  const li = m.listings.findIndex(x => x.id === id);
  if (li === -1) { myClubMarketCloseBuy(); return; }
  const l = m.listings[li];
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (playerCoins < l.price) {
    document.getElementById("marketBuyHint").textContent = "Not enough coins. You need " + formatMoney(l.price) + ".";
    return;
  }
  playerCoins -= l.price;
  c.coins = playerCoins;
  const card = JSON.parse(JSON.stringify(l.card));
  card.__cid = "mc" + (++myClubCardSeq);
  while (ownedPool.some(p => p.__cid === card.__cid)) card.__cid = "mc" + (++myClubCardSeq);
  ownedPool.push(card);
  m.listings.splice(li, 1);
  myClubMarketSave();
  saveClubState();
  myClubMarketCloseBuy();
  showPackReveal("gold", [card], 0, "Market Purchase");
  myClubRefreshHeader();
  renderMyClubMarketTab();
  myClubLobbyMsg(escapeHtml(card.name) + " bought for " + formatMoney(l.price) + " and added to your club.");
}

function myClubMarketCloseBuy() {
  marketBuyId = null;
  document.getElementById("marketBuyModal").style.display = "none";
}

function myClubMarketListEta() {
  if (!marketListCid) return;
  const idx = ownedPool.findIndex(p => p.__cid === marketListCid);
  const el = document.getElementById("marketListEta");
  if (!el) return;
  if (idx === -1) { el.textContent = ""; return; }
  const p = ownedPool[idx];
  const fair = myClubMarketSuggest(p);
  let price = parseInt(String(document.getElementById("marketListPrice").value || "").replace(/[^0-9]/g, ""), 10);
  if (!isFinite(price) || price <= 0) price = fair;
  const label = myClubMarketEtaLabel(p, price);
  el.textContent = label + " Market average is " + formatMoney(fair) + ".";
  el.style.color = myClubMarketSellDurationMs(p, price) === null ? "#ff7043" : "#62e36b";
}

function myClubMarketOpenList(cid) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const idx = ownedPool.findIndex(p => p.__cid === cid);
  if (idx === -1) return;
  marketListCid = cid;
  const p = ownedPool[idx];
  const sugg = myClubMarketSuggest(p);
  document.getElementById("marketListBody").innerHTML = myClubMarketBigCardHTML(p, sugg);
  const inp = document.getElementById("marketListPrice");
  inp.value = "" + sugg;
  document.getElementById("marketListMsg").textContent = "The card leaves your club now and can't be used while listed. You can withdraw it anytime before it sells.";
  myClubMarketListEta();
  document.getElementById("marketListModal").style.display = "flex";
}

function myClubMarketConfirmList() {
  if (!marketListCid) return;
  const cid = marketListCid;
  const idx = ownedPool.findIndex(p => p.__cid === cid);
  if (idx === -1) { myClubMarketCloseList(); return; }
  const p = ownedPool[idx];
  const min = myClubMarketSuggest(p);
  let price = parseInt(String(document.getElementById("marketListPrice").value || "").replace(/[^0-9]/g, ""), 10);
  if (!isFinite(price) || price <= 0) price = min;
  if (price < 5000) price = min;
  const m = myClubMarketData();
  m.seq++;
  const duration = myClubMarketSellDurationMs(p, price);
  const noBuyers = duration === null;
  const sellsAt = noBuyers ? Date.now() + 1000 * 3600 * 24 * 400 : Date.now() + duration;
  const c = getMyClubCareer(myClubLeague);
  ownedPool.splice(idx, 1);
  if (lineupSelCid === cid) lineupSelCid = null;
  if (c && c.myInj && c.myInj[cid]) delete c.myInj[cid];
  if (c && c.mySusp && c.mySusp[cid]) delete c.mySusp[cid];
  syncMyClubBench();
  m.sells.push({ id: "ms" + m.seq, card: JSON.parse(JSON.stringify(p)), price: price, league: myClubLeague, club: c ? c.clubName : selectedTeam, listedAt: Date.now(), sellsAt: sellsAt, noBuyers: noBuyers, status: "listed" });
  if (m.sells.length > 40) m.sells.splice(0, m.sells.length - 40);
  myClubMarketSave();
  saveClubState();
  myClubMarketCloseList();
  myClubRefreshHeader();
  renderMyClubMarketTab();
  renderMyClubLineupTab();
  myClubLobbyMsg(noBuyers
    ? escapeHtml(p.name) + " listed at " + formatMoney(price) + " \u2014 too high, no buyer will pay this. Withdraw or lower the price."
    : escapeHtml(p.name) + " listed on the Market for " + formatMoney(price) + ".");
}

function myClubMarketWithdraw(id) {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const m = myClubMarketData();
  const s = m.sells.find(x => x.id === id);
  const c = getMyClubCareer(myClubLeague);
  if (!s || s.status !== "listed" || !c) return;
  if (s.club !== c.clubName) return;
  const card = s.card;
  card.__cid = "mc" + (++myClubCardSeq);
  while (ownedPool.some(p => p.__cid === card.__cid)) card.__cid = "mc" + (++myClubCardSeq);
  m.sells = m.sells.filter(x => x.id !== id);
  ownedPool.push(card);
  myClubMarketSave();
  saveClubState();
  myClubRefreshHeader();
  renderMyClubMarketTab();
  renderMyClubLineupTab();
  myClubLobbyMsg(escapeHtml(card.name) + " withdrawn from the Market and returned to your club.");
}

function myClubMarketCloseList() {
  marketListCid = null;
  document.getElementById("marketListModal").style.display = "none";
}

// ---- Squad Building Challenges ----
// A fixed catalogue of challenges. Each has a set of requirements checked
// against an XI built from cards you already own, and a reward. Submitting
// consumes the eleven cards. Rewards are untradeable: a generated card drops
// straight into your club, or a pack is opened on the spot for free.
const MYCLUB_SBCS = [
  {
    id: "golden_xi",
    name: "Golden Generation",
    desc: "A full XI of Gold-standard stars. The gateway challenge for any new club.",
    formation: "4-3-3",
    repeatable: true,
    reqs: [
      { kind: "allTag", tags: ["GOLD"], label: "All 11 cards are Gold" },
      { kind: "minRating", value: 74, label: "Squad rating 74+" }
    ],
    reward: { kind: "card", rarity: "special", label: "Special card" }
  },
  {
    id: "national_pride",
    name: "National Pride",
    desc: "Build an XI around a single nation. Call up the best your country has.",
    formation: "4-4-2",
    repeatable: true,
    reqs: [
      { kind: "minNation", nation: "Brazil", n: 8, label: "At least 8 Brazilians" },
      { kind: "minRating", value: 76, label: "Squad rating 76+" }
    ],
    reward: { kind: "pack", pack: "gold", label: "Gold Pack" }
  },
  {
    id: "world_stage",
    name: "On the World Stage",
    desc: "Five different nations across the pitch - a true world XI.",
    formation: "4-3-3",
    reqs: [
      { kind: "distinctNations", n: 5, label: "At least 5 different nations" },
      { kind: "minRating", value: 80, label: "Squad rating 80+" },
      { kind: "noTag", tags: ["BRONZE", "SILVER", "PROSPECT"], label: "No Bronze, Silver or Prospect cards" }
    ],
    reward: { kind: "pack", pack: "special", label: "Special Pack" }
  },
  {
    id: "prem_xi",
    name: "Premier League XI",
    desc: "Six Premier League standouts to anchor the side.",
    formation: "4-3-3",
    reqs: [
      { kind: "minLeague", tag: "PL", n: 6, label: "At least 6 Premier League cards" },
      { kind: "minRating", value: 82, label: "Squad rating 82+" }
    ],
    reward: { kind: "card", rarity: "holo", label: "Holographic card" }
  },
  {
    id: "pace_merchants",
    name: "Pace Merchants",
    desc: "Eight flyers with 85+ pace. Blistering speed only.",
    formation: "4-3-3",
    reqs: [
      { kind: "minStat", stat: "pace", value: 85, n: 8, label: "8 cards with 85+ pace" },
      { kind: "minRating", value: 80, label: "Squad rating 80+" }
    ],
    reward: { kind: "pack", pack: "gold", label: "Gold Pack" }
  },
  {
    id: "icons_only",
    name: "The Immortals",
    desc: "Eleven Icons, assembled. The pinnacle of a My Club.",
    formation: "4-3-3",
    reqs: [
      { kind: "allTag", tags: ["ICON"], label: "All 11 cards are Icons" }
    ],
    reward: { kind: "card", rarity: "max", label: "MAX card" }
  }
];

let sbcSelId = null;    // id of the challenge whose builder is open, or null for the list
let sbcSlotPick = null; // pitch slot awaiting a card pick
let sbcSearch = "";     // card-list search text in the builder

function myClubSbcById(id) {
  return MYCLUB_SBCS.find(s => s.id === id) || null;
}

// Slots for an arbitrary formation (the SBC's own formation, not the player's
// career formation), matching the shape myClubSlotList builds for the lineup.
function myClubSbcSlots(formationKey) {
  const key = MY_CLUB_FORMATIONS[formationKey] ? formationKey : "4-3-3";
  const f = MY_CLUB_FORMATIONS[key];
  const dLabels = ["RB", "CB", "CB", "CB", "LB"];
  const mLabels = ["CDM", "CM", "CM", "CAM", "CAM"];
  const aLabels = f.atts === 3 ? ["RW", "ST", "LW"] : (f.atts === 2 ? ["ST", "ST"] : ["ST"]);
  const slots = [{ key: "gk", role: "goalkeeper", label: "GK" }];
  for (let i = 0; i < f.defs; i++) slots.push({ key: "d" + i, role: "defender", label: dLabels[i] || "DEF" });
  for (let i = 0; i < f.mids; i++) slots.push({ key: "m" + i, role: "midfielder", label: mLabels[i] || "MID" });
  for (let i = 0; i < f.atts; i++) slots.push({ key: "a" + i, role: "attacker", label: aLabels[i] || "ATT" });
  return slots;
}

function myClubSbcSquadMap(c, sbcId) {
  if (!c) return {};
  if (!c.sbcSquads || typeof c.sbcSquads !== "object") c.sbcSquads = {};
  if (!c.sbcSquads[sbcId] || typeof c.sbcSquads[sbcId] !== "object") c.sbcSquads[sbcId] = {};
  return c.sbcSquads[sbcId];
}

function myClubSbcClearSquad(c, sbcId) {
  if (c && c.sbcSquads) delete c.sbcSquads[sbcId];
}

function myClubSbcRating(cards) {
  if (!cards.length) return 0;
  let sum = 0;
  for (const p of cards) sum += calculateOverall(p, p.role || "attacker");
  return Math.round(sum / cards.length);
}

// Cards eligible to be drafted: everything in the club except cards in the
// starting XI, on the Match Bench, or already drafted into a different
// challenge's squad.
function myClubSbcEligible(sbcId) {
  const reserved = new Set();
  clubCardIdsInLineup().forEach(cid => reserved.add(cid));
  for (const cid of myClubBenchCids()) reserved.add(cid);
  const c = getMyClubCareer(myClubLeague);
  const squads = (c && c.sbcSquads) || {};
  for (const id in squads) {
    if (id === sbcId) continue;
    const slots = squads[id] || {};
    for (const k in slots) if (slots[k]) reserved.add(slots[k]);
  }
  return ownedPool.filter(p => p.__cid && !reserved.has(p.__cid));
}

// Cards currently drafted into any challenge squad. Those are held out of the
// lineup pickers so a card can't be both in the XI and about to be consumed.
function myClubSbcDraftedCids() {
  const set = new Set();
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const squads = (c && c.sbcSquads) || {};
  for (const id in squads) {
    const slots = squads[id] || {};
    for (const k in slots) if (slots[k]) set.add(slots[k]);
  }
  return set;
}

function myClubSbcReqStatus(cards, req) {
  const n = cards.length;
  const full = n === 11;
  if (req.kind === "allTag") {
    const tags = req.tags.map(t => t.toUpperCase());
    const bad = cards.filter(p => tags.indexOf(String(p.tag || "").toUpperCase()) === -1).length;
    return { ok: full && bad === 0, detail: bad ? bad + " wrong" : "" };
  }
  if (req.kind === "noTag") {
    const tags = req.tags.map(t => t.toUpperCase());
    const bad = cards.filter(p => tags.indexOf(String(p.tag || "").toUpperCase()) !== -1).length;
    return { ok: bad === 0, detail: bad ? bad + " not allowed" : "" };
  }
  if (req.kind === "minTag") {
    const tags = req.tags.map(t => t.toUpperCase());
    const have = cards.filter(p => tags.indexOf(String(p.tag || "").toUpperCase()) !== -1).length;
    return { ok: have >= req.n, detail: have + "/" + req.n };
  }
  if (req.kind === "minRating") {
    const r = myClubSbcRating(cards);
    return { ok: full && r >= req.value, detail: (full ? r : "\u2013") + "/" + req.value };
  }
  if (req.kind === "maxRating") {
    const r = myClubSbcRating(cards);
    return { ok: full && r <= req.value, detail: (full ? r : "\u2013") + "\u2264" + req.value };
  }
  if (req.kind === "minNation") {
    const have = cards.filter(p => p.nation === req.nation).length;
    return { ok: have >= req.n, detail: have + "/" + req.n };
  }
  if (req.kind === "distinctNations") {
    const set = new Set(cards.map(p => p.nation).filter(Boolean));
    return { ok: set.size >= req.n, detail: set.size + "/" + req.n };
  }
  if (req.kind === "minLeague") {
    const tag = req.tag.toUpperCase();
    const have = cards.filter(p => String(p.tag || "").toUpperCase() === tag).length;
    return { ok: have >= req.n, detail: have + "/" + req.n };
  }
  if (req.kind === "minStat") {
    const have = cards.filter(p => (p[req.stat] || 0) >= req.value).length;
    return { ok: have >= req.n, detail: have + "/" + req.n };
  }
  return { ok: true, detail: "" };
}

function myClubSbcSquadCards(c, sbc) {
  const slots = myClubSbcSlots(sbc.formation);
  const squad = myClubSbcSquadMap(c, sbc.id);
  const cards = [];
  for (const s of slots) {
    const cid = squad[s.key];
    const p = cid ? ownedPool.find(x => x.__cid === cid) : null;
    if (p) cards.push(p);
  }
  return cards;
}

function sbcCardChip(p, onclick) {
  const ovr = calculateOverall(p, p.role || "attacker");
  const posLabel = p.pos || myClubFallbackPos(p.role);
  return '<button type="button" class="sbcChip ' + cardTierClass(p, ovr) + '" onclick="' + onclick + '">' +
    '<span class="sbcChipOvr">' + ovr + '</span>' +
    '<span class="sbcChipName">' + escapeHtml(p.name) + '</span>' +
    '<span class="sbcChipMeta">' + escapeHtml(posLabel) + (p.tag ? ' \u00b7 ' + escapeHtml(p.tag) : '') + '</span>' +
    '</button>';
}

function myClubSbcListHTML(c) {
  const done = c.sbcDone || {};
  let html = '<div class="myClubPaneCard sbcIntro"><h3>Squad Building Challenges</h3>' +
    '<p class="friendlyQuiet">Build an XI from cards you already own and submit it to earn an untradeable reward. ' +
    'The eleven cards in a successful submission are <b>used up</b> \u2014 they leave your club. Cards in your starting lineup ' +
    'and on your Match Bench cannot be used, so your team is never touched.</p></div>';
  html += '<div class="sbcGrid">';
  for (const sbc of MYCLUB_SBCS) {
    const isDone = !!done[sbc.id] && !sbc.repeatable;
    const rewardLabel = sbc.reward ? (sbc.reward.label || "") : "";
    html += '<div class="sbcTile' + (isDone ? " done" : "") + '">' +
      '<div class="sbcTileTop"><span class="sbcTileName">' + escapeHtml(sbc.name) + '</span>' +
      (isDone ? '<span class="sbcDoneTag">COMPLETED</span>' : (sbc.repeatable ? '<span class="sbcRepeatTag">REPEATABLE</span>' : '')) + '</div>' +
      '<div class="sbcTileDesc">' + escapeHtml(sbc.desc) + '</div>' +
      '<div class="sbcTileReqs">' + sbc.reqs.map(r => '<div class="sbcTileReq">' + escapeHtml(r.label) + '</div>').join("") + '</div>' +
      '<div class="sbcTileReward"><span class="sbcRewardKey">Reward</span> ' + escapeHtml(rewardLabel) + '</div>' +
      '<div class="sbcTileFoot">' +
      (isDone ? '<span class="sbcDoneNote">Already claimed</span>' : '<button class="sbcBuildBtn" onclick="sbcOpen(\'' + sbc.id + '\')">Build Squad</button>') +
      '</div></div>';
  }
  html += '</div>';
  return html;
}

function myClubSbcBuilderHTML(c) {
  const sbc = myClubSbcById(sbcSelId);
  if (!sbc) { sbcSelId = null; return myClubSbcListHTML(c); }
  const slots = myClubSbcSlots(sbc.formation);
  const squad = myClubSbcSquadMap(c, sbc.id);
  const cards = myClubSbcSquadCards(c, sbc);
  const rating = cards.length ? myClubSbcRating(cards) : 0;
  const statuses = sbc.reqs.map(r => myClubSbcReqStatus(cards, r));
  const ready = cards.length === 11 && statuses.every(s => s.ok);

  let html = '<div class="sbcBuilder">';
  html += '<div class="sbcBuilderTop"><button class="sbcBackBtn" onclick="sbcBack()">&larr; All Challenges</button>' +
    '<div class="sbcBuilderHead"><span class="sbcBuilderName">' + escapeHtml(sbc.name) + '</span>' +
    '<span class="sbcBuilderRating">Rating <b>' + (cards.length ? rating : "\u2013") + '</b></span></div>' +
    '<div class="sbcBuilderDesc">' + escapeHtml(sbc.desc) + '</div></div>';

  html += '<div class="sbcWrap">';
  html += '<div class="sbcPitchCol">';
  html += '<div class="sbcPitch">';
  const rows = [];
  let band = [], bandKey = "";
  for (const s of slots) {
    const b = s.key[0];
    if (b !== bandKey) { if (band.length) rows.push(band); band = []; bandKey = b; }
    band.push(s.key);
  }
  if (band.length) rows.push(band);
  for (const keys of rows) {
    html += '<div class="sbcPitchRow">';
    for (const s of slots) {
      if (keys.indexOf(s.key) === -1) continue;
      const cid = squad[s.key];
      const p = cid ? ownedPool.find(x => x.__cid === cid) : null;
      const sel = sbcSlotPick === s.key ? " pick" : "";
      html += '<div class="sbcSlot' + (p ? " filled" : "") + sel + '" onclick="sbcSlotClick(\'' + s.key + '\')">';
      if (p) {
        const ovr = calculateOverall(p, s.role);
        const oop = myClubOopFactor(p, s.role) !== 1;
        html += '<span class="sbcSlotOvr' + (oop ? " oop" : "") + '">' + ovr + '</span>' +
          '<span class="sbcSlotName">' + escapeHtml(p.name) + '</span>' +
          '<span class="sbcSlotTag">' + escapeHtml(p.tag || "") + '</span>' +
          '<button class="sbcSlotX" title="Remove" onclick="event.stopPropagation(); sbcClearSlot(\'' + s.key + '\')">&times;</button>';
      } else {
        html += '<span class="sbcSlotPlus">+</span><span class="sbcSlotLabel">' + escapeHtml(s.label) + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="sbcReqBox"><div class="sbcReqTitle">Requirements</div>';
  for (let i = 0; i < sbc.reqs.length; i++) {
    html += '<div class="sbcReq ' + (statuses[i].ok ? "ok" : "") + '"><span class="sbcReqIcon">' + (statuses[i].ok ? "&#10003;" : "&#10005;") + '</span>' +
      '<span class="sbcReqText">' + escapeHtml(sbc.reqs[i].label) + (statuses[i].detail ? ' <b>' + escapeHtml(statuses[i].detail) + '</b>' : '') + '</span></div>';
  }
  html += '<div class="sbcReqReward"><span class="sbcRewardKey">Reward</span> ' + escapeHtml(sbc.reward ? sbc.reward.label : "") + '</div>';
  html += '</div>';
  html += '<div class="sbcPitchActions">' +
    '<button onclick="sbcAutoFill()">Auto-fill</button>' +
    '<button onclick="sbcReset()">Clear</button>' +
    '<button class="sbcSubmitBtn' + (ready ? "" : " off") + '" ' + (ready ? "" : "disabled ") + 'onclick="sbcSubmit()">Submit Squad</button>' +
    '</div>';
  html += '</div>';

  html += '<div class="sbcPickCol">';
  html += '<div class="sbcPickHead">Your club</div>';
  html += '<div class="sbcPickSearch"><input type="text" id="sbcSearchInput" placeholder="Search your cards\u2026" value="' + escapeHtml(sbcSearch) + '" oninput="sbcSetSearch(this.value)" />' +
    (sbcSearch ? '<button class="lineupSearchClear" onclick="sbcClearSearch()">&times;</button>' : '') + '</div>';
  let pool = myClubSbcEligible(sbc.id);
  const placed = {};
  for (const s of slots) if (squad[s.key]) placed[squad[s.key]] = true;
  pool = pool.filter(p => !placed[p.__cid]);
  if (sbcSearch) pool = pool.filter(p => lineupCardMatches(p, sbcSearch));
  const roleOrder = { goalkeeper: 0, defender: 1, midfielder: 2, attacker: 3 };
  pool.sort((a, b) => (roleOrder[a.role] || 0) - (roleOrder[b.role] || 0) || (calculateOverall(b, b.role) - calculateOverall(a, a.role)));
  html += '<div class="sbcPickList">';
  if (!pool.length) html += '<div class="lineupEmpty">' + (sbcSearch ? "No cards match your search." : "No eligible cards. Cards in your XI and Match Bench can't be used here.") + '</div>';
  for (const p of pool) html += sbcCardChip(p, "sbcPickCard('" + escapeHtml(p.__cid) + "')");
  html += '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function renderMyClubSbcTab() {
  const pane = document.getElementById("myClubTabSbc");
  if (!pane) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  pane.innerHTML = sbcSelId ? myClubSbcBuilderHTML(c) : myClubSbcListHTML(c);
}

function sbcOpen(id) {
  if (!myClubSbcById(id)) return;
  sbcSelId = id;
  sbcSlotPick = null;
  sbcSearch = "";
  renderMyClubSbcTab();
}

function sbcBack() {
  sbcSelId = null;
  sbcSlotPick = null;
  sbcSearch = "";
  renderMyClubSbcTab();
}

function sbcSlotClick(key) {
  const c = getMyClubCareer(myClubLeague);
  const sbc = myClubSbcById(sbcSelId);
  if (!c || !sbc) return;
  const squad = myClubSbcSquadMap(c, sbc.id);
  if (squad[key]) { sbcClearSlot(key); return; }
  sbcSlotPick = sbcSlotPick === key ? null : key;
  renderMyClubSbcTab();
}

function sbcClearSlot(key) {
  const c = getMyClubCareer(myClubLeague);
  const sbc = myClubSbcById(sbcSelId);
  if (!c || !sbc) return;
  const squad = myClubSbcSquadMap(c, sbc.id);
  delete squad[key];
  if (sbcSlotPick === key) sbcSlotPick = null;
  saveMyClubData();
  renderMyClubSbcTab();
}

function sbcPickCard(cid) {
  const c = getMyClubCareer(myClubLeague);
  const sbc = myClubSbcById(sbcSelId);
  if (!c || !sbc) return;
  const p = ownedPool.find(x => x.__cid === cid);
  if (!p) return;
  const slots = myClubSbcSlots(sbc.formation);
  const squad = myClubSbcSquadMap(c, sbc.id);
  for (const k in squad) if (squad[k] === cid) delete squad[k];
  let key = sbcSlotPick;
  if (!key || !slots.some(s => s.key === key)) {
    const target = slots.find(s => !squad[s.key] && s.role === p.role) || slots.find(s => !squad[s.key]);
    if (!target) { myClubLobbyMsg("Your squad is full. Remove a card first."); return; }
    key = target.key;
  }
  squad[key] = cid;
  sbcSlotPick = null;
  saveMyClubData();
  renderMyClubSbcTab();
}

function sbcAutoFill() {
  const c = getMyClubCareer(myClubLeague);
  const sbc = myClubSbcById(sbcSelId);
  if (!c || !sbc) return;
  const slots = myClubSbcSlots(sbc.formation);
  const squad = myClubSbcSquadMap(c, sbc.id);
  const placed = {};
  for (const k in squad) if (squad[k]) placed[squad[k]] = true;
  for (const s of slots) {
    if (squad[s.key]) continue;
    const pool = myClubSbcEligible(sbc.id).filter(p => !placed[p.__cid]);
    pool.sort((a, b) => {
      const ra = a.role === s.role ? 1 : 0, rb = b.role === s.role ? 1 : 0;
      if (ra !== rb) return rb - ra;
      return calculateOverall(b, b.role) - calculateOverall(a, a.role);
    });
    const pick = pool[0];
    if (pick) { squad[s.key] = pick.__cid; placed[pick.__cid] = true; }
  }
  saveMyClubData();
  renderMyClubSbcTab();
}

function sbcReset() {
  const c = getMyClubCareer(myClubLeague);
  const sbc = myClubSbcById(sbcSelId);
  if (!c || !sbc) return;
  if (c.sbcSquads) delete c.sbcSquads[sbc.id];
  sbcSlotPick = null;
  saveMyClubData();
  renderMyClubSbcTab();
}

function sbcSetSearch(v) {
  sbcSearch = String(v == null ? "" : v);
  const el = document.getElementById("sbcSearchInput");
  const caret = el ? el.selectionStart : null;
  renderMyClubSbcTab();
  const inp = document.getElementById("sbcSearchInput");
  if (inp) {
    inp.focus();
    const pos = (caret == null) ? inp.value.length : Math.min(caret, inp.value.length);
    try { inp.setSelectionRange(pos, pos); } catch (e) {}
  }
}

function sbcClearSearch() {
  sbcSearch = "";
  renderMyClubSbcTab();
  const inp = document.getElementById("sbcSearchInput");
  if (inp) inp.focus();
}

// Removes the submitted cards from the club entirely: the owned pool plus any
// lineup / bench / injury / suspension / season-stat references to them.
function myClubSbcConsume(cids) {
  const c = getMyClubCareer(myClubLeague);
  const set = new Set(cids);
  for (let i = ownedPool.length - 1; i >= 0; i--) {
    if (set.has(ownedPool[i].__cid)) ownedPool.splice(i, 1);
  }
  if (c) {
    if (Array.isArray(c.bench)) c.bench = c.bench.filter(cid => !set.has(cid));
    for (const cid of cids) {
      if (c.myInj) delete c.myInj[cid];
      if (c.mySusp) delete c.mySusp[cid];
      if (c.reds) delete c.reds[cid];
      if (c.pstat) delete c.pstat[cid];
    }
  }
  if (set.has(lineupSelCid)) lineupSelCid = null;
  syncMyClubBench();
}

// Shows a reward's cards directly in the pack-reveal modal, skipping the
// tap-to-open pack animation.
function myClubShowRewardCards(cards, title) {
  packRevealCards = cards;
  packRevealPhase = "cards";
  packTailWalkedCids = [];
  managerRevealId = null;
  consumableRevealId = null;
  clearTimeout(packRevealTimer);
  const t = document.getElementById("packModalTitle");
  t.textContent = title;
  t.classList.remove("megaTitle");
  document.getElementById("packModalMsg").textContent = "";
  document.getElementById("packModal").style.display = "flex";
  renderPackPlayerCards();
}

function myClubSbcGrantReward(reward, c) {
  if (!reward) return;
  if (reward.kind === "card") {
    const card = makeCardForRarity(reward.rarity, reward.role || null);
    card.__cid = "mc" + (++myClubCardSeq);
    while (ownedPool.some(p => p.__cid === card.__cid)) card.__cid = "mc" + (++myClubCardSeq);
    card.__packType = "sbc";
    card.__packPrice = 0;
    ownedPool.push(card);
    saveClubState();
    myClubShowRewardCards([card], "SBC Reward \u2014 " + (reward.label || cardTypeLabel(card)));
    return;
  }
  if (reward.kind === "pack") {
    const cards = myClubBuildPack(reward.pack, 0);
    saveClubState();
    const name = (MYCLUB_PACKS[reward.pack] && MYCLUB_PACKS[reward.pack].name) || reward.label || "Pack";
    myClubShowRewardCards(cards, name + " \u2014 SBC Reward");
    return;
  }
}

function sbcSubmit() {
  if (!myClubLeague) return;
  if (matchRunning) { myClubLobbyMsg("Finish the match first."); return; }
  const c = getMyClubCareer(myClubLeague);
  const sbc = myClubSbcById(sbcSelId);
  if (!c || !sbc) return;
  const cards = myClubSbcSquadCards(c, sbc);
  const statuses = sbc.reqs.map(r => myClubSbcReqStatus(cards, r));
  if (cards.length !== 11 || statuses.some(s => !s.ok)) {
    myClubLobbyMsg("That squad doesn't meet every requirement yet.");
    return;
  }
  const cids = cards.map(p => p.__cid);
  const rewardLabel = sbc.reward ? (sbc.reward.label || "reward") : "reward";
  myClubSbcConsume(cids);
  if (!sbc.repeatable) { c.sbcDone = c.sbcDone || {}; c.sbcDone[sbc.id] = true; sbcSelId = null; }
  myClubSbcClearSquad(c, sbc.id);
  sbcSlotPick = null;
  saveClubState();
  saveMyClubData();
  myClubRefreshHeader();
  renderMyClubSbcTab();
  myClubLobbyMsg("Squad submitted \u2014 " + rewardLabel + " claimed!");
  myClubSbcGrantReward(sbc.reward, c);
}

function openMyClubLobby(tab) {
  if (!myClubLeague) return;
  matchRunning = false;
  awaitingStart = false;
  kickoffIntro = 0;
  matchPaused = false;
  clearInterval(timerInterval);
  friendlyContext = null;
  if (pvpContext) { myClubPvpUnregisterOpponent(pvpContext.opponent); pvpContext = null; }
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  document.getElementById("menu").style.display = "none";
  enterScreen("myClubScreen", "block");
  myClubMarketSettle();
  myClubRefreshHeader();
  myClubRefreshTabs();
  myClubMarketStartTicker();
  // My Club is ranked-only, so the lobby opens straight onto the ladder. The
  // season dashboard ("home") still exists but is no longer the landing tab.
  myClubShowTab(tab || "pvp");
  if (pendingLevelUp) {
    showMyClubLevelUp();
    pendingLevelUp = null;
  }
}

gameLoop();

updateControlsHint();

applyControlsScheme();



// Fullscreen for the match screen. This used to live OUTSIDE the script block
// (once as page text just before the body close, and again as raw text after
// the html close), so it was never actually a function: clicking the Fullscreen
// button threw "toggleGameFullscreen is not defined", and the stray copies
// rendered on the page as visible junk below the canvas.
function toggleGameFullscreen() {
  try {
    const el = document.getElementById('gameScreen');
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!fsEl) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  } catch (e) {}
}

// --- Boot sequence: title cinematic -> loading -> fade to the main page ----
// Runs once per page load, while the rest of the game boots behind the cloud.
(function () {
  const cloud = document.getElementById("bootCloud");
  if (!cloud) return;
  const cinema = cloud.querySelector(".bootCinema");
  const loading = cloud.querySelector(".bootLoading");
  const fill = cloud.querySelector(".bootLoadFill");
  const pct = cloud.querySelector(".bootPct");
  const statusEl = cloud.querySelector(".bootLoadSub");
  const BOOT_STATUS = [
    "Preparing the dressing room",
    "Booking your seat",
    "Polishing the boots",
    "Chalking the lines",
    "Warming up the crowd",
    "Spinning up the floodlights",
    "Checking the nets",
    "Pumping the balls",
    "Firming up the pitch",
    "Stoking the rivalry",
    "Tuning the PA system",
    "Filling the water bottles",
  ];
  let phase = "cine";          // cine -> load -> gone
  let prog = 0;
  let statusI = 0;
  let done = false;
  let timers = [];

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function finish() {
    if (done) return;
    done = true;
    clearTimers();
    cloud.classList.add("bootGone");
    setTimeout(function () {
      cloud.style.display = "none";
      // The home screen already sits on the page underneath the boot cloud, so
      // all we have to do is make sure it is visible. Calling enterScreen here
      // replayed its entrance animation a second time as the cloud faded away.
      const ms = document.getElementById("modeSelectScreen");
      if (ms && ms.style.display === "none") ms.style.display = "flex";
    }, 700);
  }

  function startLoading() {
    if (phase === "load") return;
    phase = "load";
    cloud.classList.add("showLoad");
    cinema.classList.add("cineWarm");
    setTimeout(function () { cinema.style.display = "none"; }, 620);
    stepLoad();
  }

  function stepLoad() {
    prog = Math.min(100, prog + 4 + Math.random() * 9);
    fill.style.width = prog + "%";
    pct.textContent = Math.round(prog) + "%";
    statusI = (statusI + 1) % BOOT_STATUS.length;
    statusEl.textContent = BOOT_STATUS[statusI];
    if (prog >= 100) at(320, finish);
    else at(120 + Math.random() * 130, stepLoad);
  }

  function skip() {
    if (phase === "cine") startLoading();
    else if (phase === "load") {
      prog = 100;
      fill.style.width = "100%";
      pct.textContent = "100%";
      at(120, finish);
    }
  }

  const onKey = function () { if (!done) skip(); };
  const onPtr = function () { if (!done) skip(); };
  document.addEventListener("keydown", onKey);
  cloud.addEventListener("pointerdown", onPtr);
  setTimeout(function () {
    if (done) {
      document.removeEventListener("keydown", onKey);
      cloud.removeEventListener("pointerdown", onPtr);
    }
  }, 4200);

  // Cinematic timeline.
  cloud.classList.add("cineOn");
  at(3750, function () {
    cinema.classList.add("cineWarm");   // bars retreat, frame lifts away
    // The frame lift runs 0.5s and the bars retract over 0.55s, so give both
    // time to finish before the loading screen appears - otherwise the two
    // screens cross-fade on top of each other.
  });
  at(4380, startLoading);
})();
