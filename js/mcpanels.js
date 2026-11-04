/* Manager Career hub panels (loaded after managercareer.js; extends the tab set).
   Adds: News, Finances, Scouting, Roles. Also layers board confidence onto the
   Board tab and generates manager-specific news via wrappers, leaving the base
   career logic untouched. */
(function () {
  var E = function (s) { return (typeof mcEsc === "function") ? mcEsc(s) : (typeof ccEsc === "function" ? ccEsc(s) : String(s == null ? "" : s)); };
  var N = function (n, d) { return (typeof mcNum === "function") ? mcNum(n, d) : (typeof ccNum === "function" ? ccNum(n, d) : (isFinite(Number(n)) ? Number(n) : (d || 0))); };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, N(v, lo))); };
  var R = function (v) { return Math.round(N(v, 0) * 10) / 10; };
  var block = function (t, b, i) { return (typeof cpBlock === "function") ? cpBlock(t, b, i) : ""; };
  var row = function (l, v, o) { return (typeof cpRow === "function") ? cpRow(l, v, o) : ""; };
  var meter = function (l, v, m, o) { return (typeof cpMeter === "function") ? cpMeter(l, v, m, o) : ""; };
  var chip = function (t, o) { return (typeof cpChip === "function") ? cpChip(t, o) : ""; };
  var empty = function (t, l) { return (typeof cpEmpty === "function") ? cpEmpty(t, l) : ""; };
  var when = function (t) { return (typeof cpWhen === "function") ? cpWhen(t) : ""; };

  function money(v) {
    var n = N(v, 0);
    var a = Math.abs(n);
    var s = a >= 10 ? Math.round(a) : Math.round(a * 10) / 10;
    return (n < 0 ? "-\u00a3" : "\u00a3") + s + "M";
  }

  function career(id) {
    if (typeof mcFindCareer === "function") return mcFindCareer(id);
    return (typeof mcState !== "undefined") ? mcState : null;
  }

  /* ------------------------------------------------------------- news ------- */
  var MC_SRC = ["Matchday Daily", "The Touchline", "Football Weekly", "Touchline TV", "@RumorMill_90", "Continental Sport"];

  var MC_NEWS = {
    win: { head: ["{club} make a statement with {score} win", "Ruthless {club} put {opp} to the sword", "{club} turn on the style in {score} victory"],
      body: "A commanding performance from {club}, who controlled the contest from start to finish against {opp}. The boardroom will have noticed." },
    loss: { head: ["Pressure builds on {club} after {score} defeat", "{club} left to reflect on {score} setback", "Questions asked as {club} fall to {opp}"],
      body: "A chastening afternoon for {club}. The result leaves the club's objectives under scrutiny and the manager under pressure to respond." },
    draw: { head: ["{club} held in {score} stalemate", "Points shared as {club} draw {score}", "{club} settle for a point against {opp}"],
      body: "A result that does little to settle the mood around {club}, with both the performance and the table offering reasons for concern." },
    form: { head: ["{club} building momentum", "Confidence growing at {club}", "{club} find their rhythm"],
      body: "A run of results has changed the mood around {club}, with the board increasingly comfortable with the direction of travel." },
    struggle: { head: ["{club} endure a season to forget", "Inquest begins at {club}", "Hard questions for {club} after tough campaign"],
      body: "The campaign ended with the club well short of where the board expected. Changes are unlikely to be limited to the playing squad." },
    season: { head: ["Season preview: what {club} can achieve", "The {club} blueprint for the new campaign", "Expectations rise around {club}"],
      body: "A new season brings fresh objectives from the board and a clear message: progress is expected. {club} begin with the spotlight firmly on them." },
    champion: { head: ["Champions! {club} crowned after remarkable season", "{club} lift the title", "Glory for {club} as title is secured"],
      body: "A season to remember for {club}, who delivered when it mattered most. The board, the players and the supporters can savour a genuine triumph." },
    cup: { head: ["{club} seal cup glory", "Cup run ends in triumph for {club}", "{club} celebrate cup success"],
      body: "Silverware arrives at {club}, and with it a surge of belief. The manager's stock has rarely been higher." },
    sacked: { head: ["{club} part company with manager", "Board act after difficult season at {club}", "Manager departs {club}"],
      body: "The decision was described as difficult but necessary. {club} will now begin the search for a new direction." },
    signing: { head: ["{club} complete move for {player}", "{player} signs for {club}", "New arrival at {club}: {player}"],
      body: "{player} arrives to strengthen the squad, with the club describing the deal as an important statement of intent." },
    youth: { head: ["Academy graduate {player} handed first-team chance at {club}", "{club} academy produces another prospect in {player}", "{player} steps up at {club}"],
      body: "The pathway from the academy to the first team is alive and well at {club}, with {player} the latest to earn an opportunity." }
  };

  function fill(s, v) {
    if (typeof ccFill === "function") return ccFill(s, v);
    return String(s || "").replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(v, k) ? String(v[k]) : m;
    });
  }

  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function mcNewsPush(c, cat, vars) {
    if (!c || typeof c !== "object") return null;
    if (!Array.isArray(c.news)) c.news = [];
    var tpl = MC_NEWS[cat] || MC_NEWS.season;
    var v = vars || {};
    if (!v.club) v.club = c.clubName || c.club || "the club";
    var item = {
      id: "mn" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      cat: cat,
      head: fill(pickOne(tpl.head), v),
      body: fill(tpl.body, v),
      src: pickOne(MC_SRC),
      season: N(c.season, 1),
      seen: false,
      t: Date.now()
    };
    c.news.unshift(item);
    if (c.news.length > 60) c.news.length = 60;
    return item;
  }

  window.mcNewsMarkRead = function () {
    var c = (typeof mcState !== "undefined") ? mcState : null;
    if (!c || !Array.isArray(c.news)) return;
    for (var i = 0; i < c.news.length; i++) c.news[i].seen = true;
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  };

  function mcNewsHTML(c) {
    var news = Array.isArray(c.news) ? c.news : [];
    var unread = 0;
    for (var i = 0; i < news.length; i++) if (!news[i].seen) unread++;

    var out = "";
    if (news.length) {
      out += block("Back pages", unread ? unread + " new" : "All caught up",
        news.slice(0, 40).map(function (n) {
          return '<div class="pcNews' + (n.seen ? "" : " unread") + '">' +
            '<div class="pcNewsHead">' + (n.seen ? "" : '<i class="pcDot"></i>') + E(n.head || "Update") + "</div>" +
            '<div class="pcNewsMeta">' + E(n.src || "Press") + " &middot; S" + E(n.season || 1) + " &middot; " + when(n.t) + "</div>" +
            '<div class="pcHint">' + E(n.body || "") + "</div></div>";
        }).join("") +
        '<div style="margin-top:10px"><button class="wcGhostBtn pcMini" onclick="mcNewsMarkRead()">Mark all read</button></div>');
    } else {
      out += empty("Back pages", "No headlines yet. Play matches and the media will start to take notice.");
    }

    var press = Array.isArray(c.press) ? c.press : [];
    if (press.length) {
      out += block("Press conferences", press.length + " logged", press.slice(0, 10).map(function (p) {
        return '<div class="pcNews"><div class="pcNewsHead">' + E(p.head || "Press conference") + "</div>" +
          '<div class="pcNewsMeta">' + E(p.src || "Media") + " &middot; " + when(p.t) + "</div>" +
          '<div class="pcHint">' + E(p.body || "") + "</div></div>";
      }).join(""));
    } else {
      out += empty("Press conferences", "No press activity yet this season.");
    }

    var social = c.social || {};
    var followers = N(social.followers, 0);
    var socialBadge = followers >= 1e6 ? (followers / 1e6).toFixed(1) + "M followers" : followers >= 1e3 ? Math.round(followers / 1e3) + "k followers" : followers + " followers";
    var trending = Array.isArray(social.trending) && social.trending.length
      ? social.trending.slice(0, 5).map(function (t) { return row(t.tag || t, t.vol || ""); }).join("")
      : '<div class="pcHint">Nothing trending about the club right now.</div>';
    out += block("Club social", socialBadge, row("Followers", String(followers)) + trending);
    return out;
  }

  /* ---------------------------------------------------------- finances ------ */
  function mcSyncFinances(c) {
    var f = c.finances || (c.finances = {});
    if (!f.revenue) f.revenue = { matchday: 0, prize: 0, commercial: 0, sales: 0 };
    if (!f.expenses) f.expenses = { wages: 0, facilities: 0, scouting: 0 };
    if (!Array.isArray(f.ledger)) f.ledger = [];

    f.transferBudget = R(c.budget);

    var squadVal = 0;
    (c.squad || []).forEach(function (p) {
      squadVal += N(typeof mcValue === "function" ? mcValue(p) : p.value, 0);
    });
    f.wageBill = R(squadVal * 0.15);

    var st = c.seasonStats || {};
    var fac = c.facilities || {};
    var rep = clamp(N(c.rep, 0), 0, 100);
    var total = squadVal * 0.18 * (0.7 + rep / 100);
    var pts = N(st.wins, 0) * 3 + N(st.draws, 0);
    var ppg = N(st.played, 0) > 0 ? pts / N(st.played, 0) : 1.3;

    f.revenue.matchday = R(total * 0.30);
    f.revenue.prize = R(total * 0.30 * clamp(ppg / 2, 0.35, 1.15));
    f.revenue.commercial = R(total * 0.40 * (0.6 + rep / 250));
    f.revenue.sales = R(f.revenue.sales);

    f.expenses.wages = f.wageBill;
    f.expenses.facilities = R((N(fac.training, 1) + N(fac.medical, 1) + N(fac.academy, 1)) * 0.15);
    f.expenses.scouting = R(N(c.scout, 1) * 0.2);
    f.debt = R(f.debt);
    return f;
  }

  function mcFinancesHTML(c) {
    var f = mcSyncFinances(c);
    var rev = f.revenue, exp = f.expenses;
    var totalRev = rev.matchday + rev.prize + rev.commercial + rev.sales;
    var totalExp = exp.wages + exp.facilities + exp.scouting;
    var net = totalRev - totalExp;
    var maxRev = Math.max(1, totalRev);
    var maxExp = Math.max(1, totalExp);

    var out = block("Club finances", "Projected",
      row("Transfer budget", money(f.transferBudget)) +
      row("Wage bill", money(f.wageBill)) +
      row("Debt", f.debt > 0 ? money(f.debt) : "None", { cls: f.debt > 0 ? "pcBad" : "" }) +
      row("Net position", (net >= 0 ? "+" : "") + money(net), { cls: net >= 0 ? "pcGood" : "pcBad" })
    );

    out += block("Revenue", money(totalRev) + " season",
      meter("Matchday", rev.matchday, maxRev, { show: money(rev.matchday) }) +
      meter("Prize money", rev.prize, maxRev, { show: money(rev.prize) }) +
      meter("Commercial", rev.commercial, maxRev, { show: money(rev.commercial) }) +
      meter("Player sales", rev.sales, maxRev, { show: money(rev.sales) })
    );

    out += block("Expenses", money(totalExp) + " season",
      meter("Wages", exp.wages, maxExp, { show: money(exp.wages), tone: exp.wages > totalRev ? "bad" : "" }) +
      meter("Facilities", exp.facilities, maxExp, { show: money(exp.facilities) }) +
      meter("Scouting", exp.scouting, maxExp, { show: money(exp.scouting) })
    );

    var notes = (c.log || []).filter(function (l) {
      return /\u00a3|budget|wage|signed|sold|loan|prize/i.test(String(l.text || ""));
    }).slice(-8).reverse();
    out += notes.length
      ? block("Money notes", "", notes.map(function (l) {
          return '<div class="pcLine"><span>' + E(l.text) + "</span><b>S" + E(l.season || 1) + "</b></div>";
        }).join(""))
      : empty("Money notes", "No financial activity recorded yet.");

    out += '<div class="pcHint">Full-season projection based on the current squad, reputation and results. Actual figures settle at season end.</div>';
    return out;
  }

  /* ----------------------------------------------------------- scouting ----- */
  function mcEnsureScouts(c) {
    var s = c.scouting || (c.scouting = {});
    if (!Array.isArray(s.scouts)) s.scouts = [];
    if (!Array.isArray(s.reports)) s.reports = [];
    if (!Array.isArray(s.shortlist)) s.shortlist = [];
    if (!Array.isArray(s.prospects)) s.prospects = [];
    if (!Array.isArray(s.missions)) s.missions = [];
    if (!s.scouts.length) {
      var regions = ["Domestic", "Continental", "South America", "Africa", "Asia", "Scandinavia"];
      var n = Math.round(clamp(N(c.scoutCount, N(c.scout, 1)), 1, 8));
      for (var i = 0; i < n; i++) {
        s.scouts.push({
          id: "sc" + i + Date.now().toString(36) + Math.floor(Math.random() * 100),
          name: (typeof mcRandomName === "function") ? mcRandomName() : "Scout " + (i + 1),
          region: regions[i % regions.length],
          rating: clamp(55 + Math.floor(Math.random() * 30) + (n * 1.5), 45, 95),
          progress: 0,
          nextIn: Math.floor(1 + Math.random() * 2),
          found: 0
        });
      }
    }
    if (N(c.scoutCount, -1) < s.scouts.length) c.scoutCount = s.scouts.length;
    if (N(c.scoutCount, -1) < N(c.scout, 1)) c.scoutCount = N(c.scout, 1);
    return s;
  }

  /* ------------------------------------------------------- stadium -------- */
  // My Club starts in a run-down ground and can buy its way up the catalogue
  // (js/stadium.js). Ownership is a single id on the career; the cosmetic-only
  // spec is handed to the match via window.myClubStadiumSpec().
  function stads() { return (typeof window !== "undefined" && window.STADIUMS) ? window.STADIUMS : null; }
  function mcEnsureStadium(c) {
    if (!c) return "rec";
    var list = stads() ? stads().myClubOptions() : [];
    var valid = false;
    for (var i = 0; i < list.length; i++) if (list[i].id === c.stadium) valid = true;
    if (!valid) c.stadium = "rec";
    return c.stadium;
  }
  function mcStadiumEntry(c) {
    var byId = stads() ? stads().myClubById(mcEnsureStadium(c)) : null;
    return byId || { id: "rec", name: "The Recreation Ground", price: 0, tier: 0, blurb: "" };
  }
  function mcStadiumSpec(c) {
    var S = stads();
    if (!c || !S) return null;
    return S.specFor(S.myClubById(mcEnsureStadium(c)), c.club);
  }
  // match.js asks this for the HOME club's ground; only answer for My Club.
  window.myClubStadiumSpec = function (club) {
    try {
      var c = (typeof mcState !== "undefined" && mcState) ? mcState : null;
      if (!c) return null;
      if (club && c.club && String(club) !== String(c.club)) return null;
      return mcStadiumSpec(c);
    } catch (e) { return null; }
  };

  function mcStadiumBuy(c, id) {
    var S = stads();
    if (!c || !S) return;
    var opts = S.myClubOptions();
    var want = null;
    for (var i = 0; i < opts.length; i++) if (opts[i].id === id) want = opts[i];
    if (!want) return;
    if (want.id === mcEnsureStadium(c)) { mcLog(c, "Already playing at " + want.name + "."); return; }
    var owned = S.myClubById(mcEnsureStadium(c));
    var ownedTier = N(owned && owned.tier, 0);
    if (N(want.tier, 0) <= ownedTier) { mcLog(c, want.name + " is no better than your current ground."); return; }
    var price = N(want.price, 0);
    if (N(c.budget, 0) < price) { mcLog(c, "Not enough in the budget to buy " + want.name + "."); return; }
    c.budget = R(N(c.budget, 0) - price);
    c.stadium = want.id;
    mcLog(c, "A new home: " + want.name + " built for " + money(price) + ".");
    mcNewsPush(c, "form", { club: (c.clubName || c.club) });
    if (typeof mcSave === "function") mcSave();
  }

  function mcStadiumHTML(c) {
    var S = stads();
    if (!S) return empty("Stadium", "Stadium data unavailable.");
    mcEnsureStadium(c);
    var cur = mcStadiumEntry(c);
    var curTier = N(cur.tier, 0);
    var out = block("Your stadium", cur.name,
      row("Ground", cur.name) +
      row("Capacity", (S.tierCapacity(curTier)).toLocaleString()) +
      row("Status", "Owned") +
      (cur.blurb ? '<div class="pcHint">' + E(cur.blurb) + "</div>" : "")
    );
    var rows = S.myClubOptions().map(function (o) {
      var owned = o.id === cur.id;
      var worse = N(o.tier, 0) <= curTier;
      var afford = N(c.budget, 0) >= N(o.price, 0);
      var btn;
      if (owned) btn = '<span class="pcHint">Current home</span>';
      else if (worse) btn = '<span class="pcHint">Outgrown</span>';
      else if (!afford) btn = '<span class="pcHint">Need ' + money(N(o.price, 0) - N(c.budget, 0)) + " more</span>";
      else btn = '<button class="pcMini wcPrimaryBtn" onclick="mcStadiumBuyById(\'' + c.id + '\',\'' + o.id + '\')">Buy (\u00a3' + (N(o.price, 0)) + "M)</button>";
      return '<div class="pcOffer"><div><b>' + E(o.name) + "</b> <em>" + S.tierCapacity(N(o.tier, 0)).toLocaleString() + " seats</em>" +
        '<div class="pcHint">' + E(o.blurb || "") + "</div></div><div>" + btn + "</div></div>";
    }).join("");
    out += block("Buy a bigger ground", "Budget " + money(c.budget), rows || empty("Upgrades", "No grounds available."));
    return out;
  }

  /* --- scout missions: pick a country + length, return with youth ----- */

  var MC_SCOUT_MONTHS = [3, 6, 10];
  var MC_SCOUT_FEE = { 3: 3, 6: 5, 10: 8 };

  function mcScoutNations() {
    if (typeof pcNationsList === "function") {
      var ns = pcNationsList();
      if (ns && ns.length) return ns;
    }
    return ["England", "Spain", "Germany", "Italy", "France"];
  }

  function mcScoutMonthCost(months, scouts) {
    var base = N(MC_SCOUT_FEE[months], 3);
    return Math.round(base * (1 + 0.15 * Math.max(0, N(scouts, 1) - 1)) * 10) / 10;
  }

  function mcScoutOffMonths() {
    return MC_SCOUT_MONTHS.slice();
  }

  function mcScoutSendMission(c, nation, months) {
    if (!c) return null;
    var s = mcEnsureScouts(c);
    if (s.missions.length >= 3) return null;
    months = MC_SCOUT_MONTHS.indexOf(N(months, 0)) >= 0 ? N(months, 0) : 6;
    var nationName = nation || mcScoutNations()[0];
    var cost = mcScoutMonthCost(months, s.scouts.length || 1);
    if (N(c.budget, 0) < cost) return null;
    c.budget = Math.round((N(c.budget, 0) - cost) * 10) / 10;
    var startSeason = N(c.season, 1);
    var startDay = N(c.calDay, 1);
    var m = {
      id: "msn" + Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36),
      nation: nationName,
      months: months,
      weeks: months * 4,
      elapsed: 0,
      startSeason: startSeason,
      startDay: startDay,
      monthsLeft: months,
      cost: cost,
      scout: s.scouts.length ? s.scouts[Math.floor(Math.random() * s.scouts.length)].name : "Chief Scout"
    };
    s.missions.push(m);
    if (typeof mcLog === "function") {
      mcLog(c, "Sent a scout to " + nationName + " for " + months + " month" + (months === 1 ? "" : "s") + " (" + money(cost) + ").");
    }
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
    return m;
  }

  function mcScoutAdvanceMissions(c, weeks) {
    var s = mcEnsureScouts(c);
    if (!s.missions.length) return 0;
    var step = N(weeks, N(c.__scoutWeekStep, 1));
    var done = 0;
    var keep = [];
    s.missions.forEach(function (m) {
      var full = N(m.weeks, N(m.months, 6) * 4);
      var elapsed = N(m.elapsed, 0) + step;
      m.elapsed = elapsed;
      m.monthsLeft = Math.max(0, Math.ceil((full - elapsed) / 4));
      if (elapsed >= full) { s.lastMissionNation = m.nation; done++; } else { keep.push(m); }
      return;
    });
    s.missions = keep.slice();
    for (var i = 0; i < done; i++) mcScoutReturnMission(c);
    return done;
  }

  function mcScoutReturnMission(c) {
    var s = mcEnsureScouts(c);
    var nation = s.lastMissionNation || "Domestic";
    var n = 1 + Math.floor(Math.random() * 2) + (N(c.rep, 30) > 55 ? 1 : 0);
    for (var i = 0; i < n; i++) s.prospects.push(mcScoutMakeProspect(c, nation));
    if (typeof mcLog === "function") {
      mcLog(c, "Scout returned from " + nation + " with " + n + " youth prospect" + (n === 1 ? "" : "s") + ".");
    }
    if (typeof window !== "undefined" && typeof window.mcNewsPush === "function") {
      try { window.mcNewsPush(c, "youth", { club: c.clubName, player: s.prospects[0].name }); } catch (e) {}
    }
    return n;
  }

  function mcScoutMakeProspect(c, nation) {
    var roles = ["goalkeeper", "defender", "defender", "midfielder", "midfielder", "attacker", "attacker"];
    var role = roles[Math.floor(Math.random() * roles.length)];
    var acad = clamp(N((c.facilities || {}).academy, 1), 1, 5);
    var ovr = 44 + Math.floor(Math.random() * 16) + Math.floor(acad / 2);
    var pot = ovr + 10 + Math.floor(Math.random() * (12 + acad * 3));
    var p = (typeof mcMakeCard === "function")
      ? mcMakeCard(mcRandomName(), role, ovr, 15 + Math.floor(Math.random() * 3), pot)
      : { cid: "px" + Date.now().toString(36) + Math.floor(Math.random() * 1000), name: "Prospect", role: role, age: 16, ovr: ovr, pot: pot, pace: ovr, shooting: ovr, passing: ovr, dribbling: ovr, defending: ovr, physical: ovr };
    p.nation = nation || "Domestic";
    p.status = "prospect";
    return p;
  }

  function mcScoutSignProspect(c, cid) {
    if (!c) return;
    var s = mcEnsureScouts(c);
    if (!Array.isArray(c.academy)) c.academy = [];
    var at = -1;
    for (var i = 0; i < s.prospects.length; i++) if (s.prospects[i].cid === cid) { at = i; break; }
    if (at < 0) return;
    if (c.academy.length >= 14) {
      if (typeof mcLog === "function") mcLog(c, "Academy is full (14). Promote or release someone first.");
      if (typeof mcShowHub === "function") mcShowHub();
      return;
    }
    var p = s.prospects.splice(at, 1)[0];
    p.status = "academy";
    c.academy.push(p);
    if (typeof mcLog === "function") mcLog(c, "Signed " + p.name + " (" + p.nation + ", " + mcRoleLabel(p.role) + ") to the academy.");
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  }

  function mcScoutPassProspect(c, cid) {
    if (!c) return;
    var s = mcEnsureScouts(c);
    for (var i = 0; i < s.prospects.length; i++) if (s.prospects[i].cid === cid) { s.prospects.splice(i, 1); break; }
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  }

  function mcScoutRecruitFromAcademy(c, cid) {
    if (!c) return;
    var s = mcEnsureScouts(c);
    var acad = c.academy || [];
    if (!Array.isArray(s.prospects)) s.prospects = [];
    var at = -1;
    for (var i = 0; i < acad.length; i++) if (acad[i].cid === cid) { at = i; break; }
    if (at < 0) return;
    var p = acad.splice(at, 1)[0];
    p.status = "prospect";
    s.prospects.push(p);
    if (typeof mcLog === "function") mcLog(c, "Moved " + p.name + " back to the youth list.");
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  }

  function mcScoutCandidates(c) {
    var out = [];
    (c.market || []).forEach(function (m) {
      if (m && m.player) out.push({ player: m.player, club: m.club || "Unknown", price: m.price });
    });
    (c.transferPool || []).forEach(function (m) {
      if (m && m.player) out.push({ player: m.player, club: m.from || "Free agent", price: m.price });
    });
    return out;
  }

  function mcScoutGenerateReport(c, scout) {
    var s = mcEnsureScouts(c);
    var cands = mcScoutCandidates(c);
    if (!cands.length) {
      if (typeof mcBuildTransferPool === "function") mcBuildTransferPool(c);
      cands = mcScoutCandidates(c);
    }
    if (!cands.length) return false;

    var seen = {};
    s.reports.forEach(function (r) { if (r.player) seen[r.player.cid] = true; });
    var fresh = cands.filter(function (x) { return !seen[x.player.cid]; });
    var pool = fresh.length ? fresh : cands;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    var rating = clamp(Math.round(N(pick.player.pot, 70) + (Math.random() * 14 - 7) + (scout.rating / 10 - 3)), 40, 99);
    var note = rating >= 88 ? "Generational talent. Move quickly."
      : rating >= 78 ? "Strong recommendation. First-team ready."
      : rating >= 68 ? "Solid option with room to grow."
      : "Depth option at best.";

    s.reports.unshift({
      id: "rpt" + Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36),
      player: pick.player,
      club: pick.club,
      price: N(pick.price, 0),
      rating: rating,
      note: note,
      scout: scout ? scout.name : "Scout",
      region: scout ? scout.region : "",
      t: Date.now()
    });
    if (s.reports.length > 30) s.reports.length = 30;

    if (typeof mcLog === "function") mcLog(c, "Scout report filed on " + pick.player.name + " (" + pick.club + ").");
    return true;
  }

  function mcScoutingTick(c, weeks) {
    if (!c) return 0;
    var s = mcEnsureScouts(c);
    weeks = clamp(N(weeks, 0), 0, 8);
    if (weeks <= 0) return 0;
    var made = 0;
    c.__scoutWeekStep = weeks;
    mcScoutAdvanceMissions(c);
    s.scouts.forEach(function (sc) {
      sc.progress = N(sc.progress, 0) + weeks * (1 + N(sc.rating, 60) / 120);
      while (sc.progress >= N(sc.nextIn, 2)) {
        sc.progress -= N(sc.nextIn, 2);
        sc.nextIn = 2 + Math.random() * 4;
        sc.found = N(sc.found, 0) + 1;
        if (mcScoutGenerateReport(c, sc)) made++;
      }
    });
    if (made && typeof mcSave === "function") mcSave();
    return made;
  }

  function mcScoutSend(c) {
    if (!c) return 0;
    var s = mcEnsureScouts(c);
    var made = 0;
    s.scouts.forEach(function (sc) {
      sc.found = N(sc.found, 0) + 1;
      if (mcScoutGenerateReport(c, sc)) made++;
    });
    if (made && typeof mcLog === "function") mcLog(c, "Scouts filed " + made + " report" + (made === 1 ? "" : "s") + ".");
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
    return made;
  }

  function mcScoutToggle(c, rid) {
    var s = mcEnsureScouts(c);
    var rep = null;
    for (var i = 0; i < s.reports.length; i++) if (s.reports[i].id === rid) { rep = s.reports[i]; break; }
    if (!rep) return;

    var at = -1;
    for (var j = 0; j < s.shortlist.length; j++) if (s.shortlist[j].cid === rep.player.cid) { at = j; break; }
    if (at >= 0) {
      s.shortlist.splice(at, 1);
      if (typeof mcLog === "function") mcLog(c, "Removed " + rep.player.name + " from the shortlist.");
    } else {
      s.shortlist.unshift({
        cid: rep.player.cid,
        name: rep.player.name,
        role: rep.player.role,
        ovr: (typeof mcOvr === "function") ? mcOvr(rep.player) : N(rep.player.ovr, 60),
        pot: N(rep.player.pot, 70),
        age: N(rep.player.age, 20),
        club: rep.club,
        price: rep.price
      });
      if (typeof mcLog === "function") mcLog(c, "Shortlisted " + rep.player.name + " (" + rep.club + ").");
    }
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  }

  function mcScoutingHTML(c) {
    var s = mcEnsureScouts(c);
    var level = Math.round(clamp(N(c.scout, 1), 1, 5));
    var nations = mcScoutNations();
    var maxMissions = 3;

    var out = block("Scouting network", "Level " + level,
      row("Academy level", level) +
      row("Scouts employed", s.scouts.length) +
      row("Reports on file", s.reports.length) +
      '<div class="pcLine"><span>Hire a scout</span><b><button class="wcGhostBtn pcMini" onclick="mcScoutHireById(\'' + c.id + '\')">Hire (\u00a3' + (3 + (s.scouts.length * 2)) + 'M)</button></b></div>'
    );

    /* --- send scouts out: choose country + length --- */
    var sendRows = "";
    if (s.missions.length >= maxMissions) {
      sendRows += '<div class="pcHint">All ' + maxMissions + ' scout missions are out. Wait for a report to return before sending another.</div>';
    } else {
      var nationOpts = nations.map(function (n) {
        return '<option value="' + E(n) + '">' + E(n) + "</option>";
      }).join("");
      var lenBtns = MC_SCOUT_MONTHS.map(function (m) {
        var cost = mcScoutMonthCost(m, s.scouts.length || 1);
        return '<button class="wcGhostBtn pcMini" onclick="mcScoutSendMissionById(\'' + c.id + '\',' +
          'document.getElementById(\'mcScoutNation_' + c.id + '\').value,' + m + ')">' +
          m + "mo (\u00a3" + cost + "M)</button>";
      }).join(" ");
      sendRows +=
        '<div class="pcLine"><span>Country</span><b><select id="mcScoutNation_' + c.id + '" class="mcAdminIn">' + nationOpts + "</select></b></div>" +
        '<div class="pcLine"><span>Send scout for</span><b>' + lenBtns + "</b></div>" +
        '<div class="pcHint">Longer trips reach further afield and return more prospects. Cost scales with your scout network (' + s.scouts.length + ').</div>';
    }
    out += block("Send scouts out", s.missions.length + "/" + maxMissions + " missions out", sendRows);

    /* --- active missions --- */
    if (s.missions.length) {
      out += block("Scout missions", s.missions.length + " travelling", s.missions.map(function (m) {
        var weeks = N(m.weeks, N(m.months, 6) * 4);
        var pct = Math.round(clamp(N(m.elapsed, 0) / Math.max(1, weeks), 0, 1) * 100);
        return '<div class="pcOffer"><div><b>' + E(m.nation) + "</b> <em>" + N(m.months, 6) + " month trip</em>" +
          '<div class="pcHint">' + E(m.scout) + " \u00b7 returns in " + N(m.monthsLeft, 0) + " month" + (N(m.monthsLeft, 0) === 1 ? "" : "s") + "</div>" +
          '<div class="pcHint">Progress ' + pct + "%</div></div></div>";
      }).join(""));
    }

    /* --- youth prospects awaiting a decision --- */
    if (s.prospects.length) {
      out += block("Youth prospects", s.prospects.length + " to review", s.prospects.map(function (p) {
        var ovr = (typeof mcOvr === "function") ? mcOvr(p) : N(p.ovr, 60);
        return '<div class="pcOffer"><div><b>' + E(p.name) + "</b> <em>" + E(p.nation || "Domestic") + "</em>" +
          '<div class="pcHint">' + E(mcRoleLabel(p.role)) + " \u00b7 age " + N(p.age, 16) + " \u00b7 OVR " + ovr +
          " / pot " + N(p.pot, 70) + "</div></div>" +
          '<div><button class="pcMini wcPrimaryBtn" onclick="mcScoutSignProspectById(\'' + c.id + '\',\'' + p.cid + '\')">Sign</button> ' +
          '<button class="pcMini wcGhostBtn" onclick="mcScoutPassProspectById(\'' + c.id + '\',\'' + p.cid + '\')">Pass</button></div></div>';
      }).join(""));
    } else {
      out += empty("Youth prospects", "No prospects waiting. Send a scout out and wait for them to return.");
    }

    if (s.scouts.length) {
      out += block("Scout staff", s.scouts.length + " staff", s.scouts.map(function (sc) {
        return row(sc.name, sc.region + " \u00b7 " + N(sc.rating, 60));
      }).join(""));
    }

    if (s.reports.length) {
      out += block("Transfer reports", s.reports.length + " filed", s.reports.slice(0, 10).map(function (r) {
        var ovr = (typeof mcOvr === "function") ? mcOvr(r.player) : N(r.player.ovr, 60);
        var short = s.shortlist.some(function (x) { return x.cid === r.player.cid; });
        return '<div class="pcOffer"><div><b>' + E(r.player.name) + "</b> <em>" + E(r.club) + "</em>" +
          '<div class="pcHint">' + E(r.player.role) + " \u00b7 age " + N(r.player.age, 20) + " \u00b7 OVR " + ovr +
          " / pot " + N(r.player.pot, 70) + " \u00b7 " + (N(r.price, 0) > 0 ? money(r.price) : "Free") + "</div>" +
          '<div class="pcHint">' + E(r.note) + " <em>(" + E(r.scout) + ", " + N(r.rating, 0) + "/100)</em></div></div>" +
          '<div><button class="pcMini ' + (short ? "wcPrimaryBtn" : "wcGhostBtn") + '" onclick="mcScoutToggleById(\'' + c.id + '\',\'' + r.id + '\')">' +
          (short ? "Shortlisted" : "Shortlist") + "</button></div></div>";
      }).join(""));
    } else {
      out += empty("Transfer reports", "No transfer reports yet.");
    }

    if (s.shortlist.length) {
      out += block("Shortlist", s.shortlist.length + " targets", s.shortlist.map(function (x) {
        return row(x.name, (x.role || "") + " \u00b7 OVR " + N(x.ovr, 0) + " \u00b7 " + (N(x.price, 0) > 0 ? money(x.price) : "Free"));
      }).join(""));
    } else {
      out += empty("Shortlist", "No shortlisted targets.");
    }
    return out;
  }

  /* ------------------------------------------------------------- roles ------ */
  var MC_ROLE_KEYS = [
    ["captain", "Captain"],
    ["vice", "Vice-captain"],
    ["pens", "Penalties"],
    ["fks", "Free kicks"],
    ["corners", "Corners"]
  ];

  function mcRoleCandidates(c, key) {
    var list = (c.squad || []).slice();
    if (key === "pens") list.sort(function (a, b) { return N(b.shooting, 0) - N(a.shooting, 0); });
    else if (key === "fks" || key === "corners") list.sort(function (a, b) { return N(b.passing, 0) - N(a.passing, 0); });
    else list.sort(function (a, b) { return ((typeof mcOvr === "function") ? mcOvr(b) - mcOvr(a) : 0); });
    return list;
  }

  function mcRolePlayer(c, key) {
    var roles = c.roles || (c.roles = {});
    var cid = roles[key];
    if (!cid) return null;
    for (var i = 0; i < (c.squad || []).length; i++) if (c.squad[i].cid === cid) return c.squad[i];
    return null;
  }

  function mcRolesHTML(c) {
    var out = block("Squad roles", "", '<div class="pcHint">Choose who wears the armband and who takes set pieces. Roles are saved with your career.</div>');
    MC_ROLE_KEYS.forEach(function (pair) {
      var key = pair[0], label = pair[1];
      var p = mcRolePlayer(c, key);
      var opts = ['<option value="">&mdash; none &mdash;</option>'].concat(mcRoleCandidates(c, key).map(function (x) {
        var ovr = (typeof mcOvr === "function") ? mcOvr(x) : N(x.ovr, 60);
        var pos = (typeof mcRoleLabel === "function") ? mcRoleLabel(x.role) : x.role;
        return '<option value="' + E(x.cid) + '"' + (p && p.cid === x.cid ? " selected" : "") + ">" +
          E(x.name) + " (" + E(pos) + ", " + ovr + ")</option>";
      })).join("");
      out += '<div class="mcRoleRow"><span class="pcStatName">' + E(label) + "</span>" +
        '<select class="mcAdminIn" onchange="mcSetRoleById(\'' + c.id + '\',\'' + key + '\',this.value)">' + opts + "</select>" +
        "<b>" + (p ? E(p.name) : "Unassigned") + "</b></div>";
    });
    out += '<div style="margin-top:10px"><button class="wcGhostBtn pcMini" onclick="mcAutoRolesById(\'' + c.id + '\')">Auto-pick best</button></div>';
    return out;
  }

  function mcSetRole(c, key, cid) {
    var roles = c.roles || (c.roles = {});
    if (cid && !(c.squad || []).some(function (p) { return p.cid === cid; })) return;
    roles[key] = cid || null;
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  }

  function mcAutoRoles(c) {
    var roles = c.roles || (c.roles = {});
    var squad = (c.squad || []).slice();
    if (!squad.length) return;
    var byOvr = squad.slice().sort(function (a, b) { return ((typeof mcOvr === "function") ? mcOvr(b) - mcOvr(a) : 0); });
    var cap = byOvr[0] || null;
    var vice = null;
    for (var i = 0; i < byOvr.length; i++) if (!cap || byOvr[i].cid !== cap.cid) { vice = byOvr[i]; break; }
    var pens = squad.slice().sort(function (a, b) { return N(b.shooting, 0) - N(a.shooting, 0); })[0] || null;
    var fks = squad.slice().sort(function (a, b) { return N(b.passing, 0) - N(a.passing, 0); })[0] || null;
    var mids = squad.filter(function (p) { return p.role === "midfielder" || p.role === "attacker"; })
      .sort(function (a, b) { return N(b.passing, 0) - N(a.passing, 0); });
    var corners = mids[0] || fks;
    roles.captain = cap ? cap.cid : null;
    roles.vice = vice ? vice.cid : null;
    roles.pens = pens ? pens.cid : null;
    roles.fks = fks ? fks.cid : null;
    roles.corners = corners ? corners.cid : null;
    if (typeof mcSave === "function") mcSave();
    if (typeof mcShowHub === "function") mcShowHub();
  }

  /* --------------------------------------------------- board confidence ----- */
  function mcBoardConfidenceHTML(c) {
    var b = c.board || (c.board = { confidence: 60, style: "win", patience: 60 });
    var pers = c.personality || {};
    var conf = clamp(N(b.confidence, 60), 0, 100);
    var patience = clamp(N(b.patience, 60), 0, 100);
    var media = clamp(N(pers.media, 55), 0, 100);
    var mood = conf >= 75 ? "Delighted" : conf >= 55 ? "Content" : conf >= 40 ? "Concerned" : "Under pressure";
    var style = b.style === "win" ? "Win now" : b.style === "develop" ? "Develop youth" : "Balanced";
    var objLine = (N(c.objectivesTotal, 0) > 0) ? N(c.objectivesMet, 0) + " / " + N(c.objectivesTotal, 0) : "Not set";
    return block("Board confidence", mood,
      meter("Confidence", conf, 100, { tone: conf >= 70 ? "good" : conf >= 45 ? "" : "bad" }) +
      meter("Patience", patience, 100, { tone: patience >= 60 ? "good" : patience >= 35 ? "" : "bad" }) +
      meter("Media relations", media, 100, { tone: media >= 60 ? "good" : media >= 40 ? "" : "bad" }) +
      row("Board style", style) +
      row("Objectives met", objLine)
    );
  }

  /* ------------------------------------------------ news generation hooks --- */
  function mcNudgeSocial(c, delta) {
    var s = c.social || (c.social = { followers: 800, posts: [], trending: [] });
    s.followers = Math.max(0, Math.round(N(s.followers, 800) + delta));
  }

  function mcNudgeBoard(c, r) {
    var b = c.board || (c.board = { confidence: 60, style: "win", patience: 60 });
    var d = r.win ? 2 : ((r.gf != null && r.gf === r.ga) ? 0 : -2);
    b.confidence = clamp(N(b.confidence, 60) + d, 0, 100);
  }

  function mcGenMatchNews(c, r) {
    if (!c || !r) return;
    var gf = N(r.gf, 0), ga = N(r.ga, 0), margin = gf - ga;
    var vars = {
      club: c.clubName || c.club,
      opp: r.opp || "the opposition",
      score: gf + "-" + ga
    };
    var rep = N(c.rep, 30);

    if (r.win && margin >= 3) {
      mcNewsPush(c, "win", vars);
      mcNudgeSocial(c, Math.round(60 + rep * 5));
    } else if (r.win) {
      if (Math.random() < 0.4) mcNewsPush(c, "win", vars);
      mcNudgeSocial(c, Math.round(25 + rep * 2));
    } else if (margin <= -3) {
      mcNewsPush(c, "loss", vars);
      mcNudgeSocial(c, -Math.round(20 + rep * 1.5));
    } else if (margin < 0) {
      if (Math.random() < 0.3) mcNewsPush(c, "loss", vars);
      mcNudgeSocial(c, -Math.round(8 + rep));
    } else {
      if (Math.random() < 0.22) mcNewsPush(c, "draw", vars);
    }

    if (r.win && r.kind === "cup") mcNudgeSocial(c, 1500);
    if (r.win && c.seasonStats && N(c.seasonStats.played, 0) > 0 && N(c.seasonStats.played, 0) % 5 === 0) {
      mcNewsPush(c, "form", vars);
    }
  }

  function mcGenSeasonStartNews(c, first) {
    if (!c) return;
    if (N(c.seasonStartNewsDone, -1) === N(c.season, 1)) return;
    c.seasonStartNewsDone = N(c.season, 1);
    mcNewsPush(c, "season", { club: c.clubName || c.club });
    var b = c.board || (c.board = { confidence: 60, style: "win", patience: 60 });
    b.confidence = clamp(N(b.confidence, 60) + (first ? 0 : 2), 0, 100);
  }

  function mcPressPush(c, head, body) {
    if (!Array.isArray(c.press)) c.press = [];
    c.press.unshift({ head: head, body: body, src: "Press conference", t: Date.now() });
    if (c.press.length > 20) c.press.length = 20;
  }

  function mcGenSeasonEndNews(c) {
    if (!c) return;
    if (N(c.seasonEndNewsDone, -1) === N(c.season, 1)) return;
    var hist = Array.isArray(c.history) ? c.history : [];
    var last = hist.length ? hist[hist.length - 1] : null;
    if (!last || N(last.season, -1) !== N(c.season, 1)) return;
    c.seasonEndNewsDone = N(c.season, 1);

    var club = c.clubName || c.club;
    var b = c.board || (c.board = { confidence: 60, style: "win", patience: 60 });
    var met = N(c.objectivesMet, 0), total = N(c.objectivesTotal, (c.objectives || []).length);

    if (c.sacked) {
      mcNewsPush(c, "sacked", { club: club });
      mcPressPush(c, "I take responsibility for the results", "The manager faced the media after the board's decision, acknowledging that the season fell well short of expectations.");
      b.confidence = clamp(N(b.confidence, 60) - 20, 0, 100);
      return;
    }

    if (N(last.rank, 99) === 1) {
      mcNewsPush(c, "champion", { club: club });
      mcNudgeSocial(c, 60000);
      mcPressPush(c, "We believed from day one", "A delighted manager paid tribute to the players and staff after the title was secured.");
    }
    if (last.cupWon) {
      mcNewsPush(c, "cup", { club: club });
      mcNudgeSocial(c, 30000);
    }
    if (N(last.rank, 99) !== 1 && !last.cupWon) {
      if (N(last.rank, 99) > Math.ceil(N(last.table, 20) / 2)) {
        mcNewsPush(c, "struggle", { club: club });
        mcPressPush(c, "We have to be better", "The manager accepted that the campaign was not good enough and promised a thorough review.");
      } else if (N(last.rank, 99) <= 4) {
        mcNewsPush(c, "form", { club: club });
        mcPressPush(c, "We are moving in the right direction", "The manager pointed to progress in the table while insisting there is more to come.");
      }
    }

    if (total > 0) {
      var swing = met >= total ? 8 : (met === 0 ? -10 : 2);
      b.confidence = clamp(N(b.confidence, 60) + swing, 0, 100);
    }
  }

  /* --------------------------------------------- wrap base career hooks ---- */
  if (typeof mcStartSeason === "function") {
    var _start = mcStartSeason;
    mcStartSeason = function (c, first) {
      _start(c, first);
      if (typeof mcEnsureScouts === "function") mcEnsureScouts(c);
      mcGenSeasonStartNews(c, first);
      if (typeof ccWorldNewsBatch === "function") ccWorldNewsBatch(c, first ? 3 : 2);
    };
  }

  if (typeof mcApplyResult === "function") {
    var _apply = mcApplyResult;
    mcApplyResult = function (c, r) {
      _apply(c, r);
      mcNudgeBoard(c, r);
      if (typeof ccWorldNewsBatch === "function") {
        ccWorldNewsBatch(c, Math.random() < 0.65 ? 1 : 2);
      }
      mcGenMatchNews(c, r);
    };
  }

  if (typeof ccPreserveNav === "function") {
    if (typeof mcShowHub === "function") window.mcShowHub = mcShowHub = ccPreserveNav(mcShowHub, "#managerScreen");
    if (typeof mcRenderSetup === "function") window.mcRenderSetup = mcRenderSetup = ccPreserveNav(mcRenderSetup, "#managerScreen");
  }

  if (typeof mcEndSeason === "function") {
    var _end = mcEndSeason;
    mcEndSeason = function (c) {
      _end(c);
      mcGenSeasonEndNews(c);
    };
  }

  if (typeof mcSignPlayer === "function") {
    var _sign = mcSignPlayer;
    mcSignPlayer = function (c, pl, cost, label) {
      _sign(c, pl, cost, label);
      if (pl && pl.name) mcNewsPush(c, "signing", { club: c.clubName, player: pl.name });
    };
  }

  if (typeof mcBuyPlayer === "function") {
    var _buy = mcBuyPlayer;
    mcBuyPlayer = function (c, mid) {
      var item = null;
      for (var i = 0; i < (c.market || []).length; i++) if (c.market[i].id === mid) { item = c.market[i]; break; }
      _buy(c, mid);
      if (!item) return;
      var listed = (c.market || []).some(function (x) { return x.id === mid; });
      if (!listed) {
        mcNewsPush(c, "signing", { club: c.clubName, player: item.player && item.player.name });
        if (typeof mcSave === "function") mcSave();
      }
    };
  }

  if (typeof mcPromoteAcademy === "function") {
    var _promote = mcPromoteAcademy;
    mcPromoteAcademy = function (c, cid) {
      var kid = null;
      for (var i = 0; i < (c.academy || []).length; i++) if (c.academy[i].cid === cid) { kid = c.academy[i]; break; }
      _promote(c, cid);
      if (kid && kid.name) {
        mcNewsPush(c, "youth", { club: c.clubName, player: kid.name });
        if (typeof mcSave === "function") mcSave();
      }
    };
  }

  if (typeof mcBoardHTML === "function") {
    var _board = mcBoardHTML;
    mcBoardHTML = function (c) { return mcBoardConfidenceHTML(c) + _board(c); };
  }

  /* ------------------------------------------------------------ tab wiring -- */
  if (typeof mcTabHeaderHTML === "function") {
    mcTabHeaderHTML = function (c) {
      var tabs = [
  ["home", "Home"], ["squad", "Squad"], ["schedule", "Schedule"], ["comps", "Competitions"], ["academy", "Academy"],
  ["transfers", "Transfers"], ["board", "Board"], ["market", "Market"],
  ["news", "News"], ["messages", "Messages"], ["finances", "Finances"], ["scouting", "Scouting"], ["stadium", "Stadium"], ["roles", "Roles"],
  ["admin", "Admin"]
];
      var unread = (typeof ccUnread === "function") ? ccUnread(c) : 0;
      return '<div class="mcTabs">' +
        tabs.map(function (pair) {
          return '<button class="mcTab' + (mcMenu === pair[0] ? " on" : "") + '" onclick="mcSetTab(\'' + pair[0] + '\')">' + pair[1] + "</button>";
        }).join("") + "</div>" +
        '<div class="mcHeader">' +
        '<span class="mcChip">Budget ' + money(c.budget) + "</span>" +
        '<span class="mcChip">Rep ' + Math.round(N(c.rep, 0)) + "</span>" +
        '<span class="mcChip">Squad ' + ((typeof mcBestOvr === "function") ? mcBestOvr(c) : 0) + "</span>" +
        (unread ? '<span class="mcChip">News ' + unread + "</span>" : "") +
        "</div>";
    };
  }

  if (typeof mcTabBodyHTML === "function") {
    var _tabBody = mcTabBodyHTML;
    mcTabBodyHTML = function (c, tab) {
      if (tab === "news") return mcNewsHTML(c);
      if (tab === "messages") return mcMessagesHTML(c);
      if (tab === "finances") return mcFinancesHTML(c);
      if (tab === "scouting") return mcScoutingHTML(c);
      if (tab === "stadium") return mcStadiumHTML(c);
      if (tab === "roles") return mcRolesHTML(c);
      return _tabBody(c, tab);
    };
  }

  /* ------------------------------------------------------- by-id handlers --- */
  window.mcScoutingTick = mcScoutingTick;
  window.mcScoutGenerateReport = mcScoutGenerateReport;
  window.mcScoutSendById = function (id) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcScoutSend(c); };
  window.mcScoutHireById = function (id) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c && typeof mcScoutHire === "function") mcScoutHire(c); };
  window.mcSetRoleById = function (id, key, cid) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcSetRole(c, key, cid); };
  window.mcAutoRolesById = function (id) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcAutoRoles(c); };
  window.mcScoutToggleById = function (id, rid) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcScoutToggle(c, rid); };
  window.mcScoutSendMissionById = function (id, nation, months) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcScoutSendMission(c, nation, months); };
  window.mcScoutSignProspectById = function (id, cid) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcScoutSignProspect(c, cid); };
  window.mcScoutPassProspectById = function (id, cid) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcScoutPassProspect(c, cid); };
  window.mcScoutRecruitFromAcademyById = function (id, cid) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) mcScoutRecruitFromAcademy(c, cid); };
  window.mcScoutAdvanceMissions = mcScoutAdvanceMissions;
  window.mcScoutSendMission = mcScoutSendMission;
  window.mcScoutSignProspect = mcScoutSignProspect;
  window.mcScoutPassProspect = mcScoutPassProspect;
  window.mcScoutRecruitFromAcademy = mcScoutRecruitFromAcademy;
  window.mcScoutNations = mcScoutNations;
  window.mcStadiumBuyById = function (id, sid) { var c = (typeof mcFindCareer === "function") ? mcFindCareer(id) : null; if (!c && typeof mcState !== "undefined" && mcState && mcState.id === id) c = mcState; if (c) { mcStadiumBuy(c, sid); if (typeof mcShowHub === "function") mcShowHub(); } };
  window.mcStadiumBuy = mcStadiumBuy;
  window.mcStadiumHTML = mcStadiumHTML;
  window.mcEnsureStadium = mcEnsureStadium;
  window.mcStadiumSpec = mcStadiumSpec;

function mcMessagesHTML(c) {
  const msgs = Array.isArray(c.messages) ? c.messages.slice() : [];
  const today = c.calDay || 1;
  // Auto-generate a contract-talk request if a starter is clearly underpaid
  // and hasn't asked in the last 3 days.
  let generated = false;
  if (typeof window.Negotiation !== "undefined") {
    for (const p of (c.squad || [])) {
      if (!p || !p.cid) continue;
      const cur = (typeof p.wage === "number" && p.wage > 0)
        ? p.wage
        : Math.round(Math.pow(mcOvr(p), 2) * 6 / 100) * 100;
      const demand = window.Negotiation.wageDemandFor(
        p, window.Negotiation.roleDemandFor(p, c), c);
      if (!demand || cur >= demand * 0.85) continue;
      const pending = msgs.some(m =>
        m.type === "wage" && m.playerCid === p.cid && m.status === "pending");
      if (pending) continue;
      if (today < (c.messagesDay || 0) + 3) break;
      msgs.push({
        id: "msg" + Date.now().toString(36) + p.cid.slice(-4),
        type: "wage",
        playerCid: p.cid,
        from: p.name,
        subject: "Contract talks",
        body: p.name + " has asked for a fresh contract. Their agent believes " +
          "£" + Math.round(demand / 1000) + "K/wk reflects their role in the squad.",
        created: Date.now(),
        read: false,
        status: "pending"
      });
      c.messages = msgs;
      c.messagesDay = today;
      generated = true;
      break;
    }
  }
  if (generated && typeof mcSave === "function") mcSave();
  if (!msgs.length) return empty("Messages", "No messages yet. Players will get in touch when they want to talk.");
  const rows = msgs.slice().reverse().map(function (m) {
    const cls = m.read ? "" : " unread";
    let action = "";
    if (m.type === "wage" && m.status === "pending") {
      action = '<div class="pcLine"><button class="pcMini wcPrimaryBtn" onclick="mcRenewById(\'' +
        E(m.playerCid) + '\')">Negotiate</button> ' +
        '<button class="pcMini wcGhostBtn" onclick="mcDismissMessage(\'' + E(m.id) + '\')">Dismiss</button></div>';
    } else if (m.status === "done") {
      action = '<div class="pcHint" style="color:#7ee787">Resolved</div>';
    }
    return '<div class="pcNews' + cls + '">' +
      '<div class="pcNewsHead">' + E(m.from || "Player") + "</div>" +
      '<div class="pcNewsMeta">' + E(m.subject || "") + " &middot; " + mcWhen(m.created) + "</div>" +
      '<div class="pcHint">' + E(m.body || "") + "</div>" + action + "</div>";
  }).join("");
  const unread = msgs.filter(m => !m.read).length;
  return block("Messages", unread ? unread + " new" : "All caught up", rows +
    '<div style="margin-top:10px"><button class="wcGhostBtn pcMini" onclick="mcReadAllMessages()">Mark all read</button></div>');
}

function mcWhen(ts) {
  const d = new Date(ts || 0);
  if (isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return diff + "m ago";
  if (diff < 1440) return Math.floor(diff / 60) + "h ago";
  return Math.floor(diff / 1440) + "d ago";
}

window.mcDismissMessage = function (mid) {
  const c = mcState; if (!c || !Array.isArray(c.messages)) return;
  const m = c.messages.find(x => x.id === mid);
  if (m) { m.status = "dismissed"; m.read = true; }
  mcSave(); mcShowHub();
};
window.mcReadAllMessages = function () {
  const c = mcState; if (!c || !Array.isArray(c.messages)) return;
  for (const m of c.messages) m.read = true;
  mcSave(); mcShowHub();
};
})();
