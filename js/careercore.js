(function () {
  var ccEsc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  };
  var ccNum = function (n, d) { var v = Number(n); return isFinite(v) ? v : (d || 0); };
  var ccPick = function (arr, rnd) { return arr[Math.floor(((rnd == null ? Math.random() : rnd) * arr.length)) % arr.length]; };
  var ccClamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, ccNum(v, lo))); };

  var ccRepTier = function (rep) {
    var r = ccClamp(rep, 0, 100);
    if (r < 20) return "Unknown";
    if (r < 40) return "Prospect";
    if (r < 60) return "Recognized";
    if (r < 80) return "Star";
    return "Superstar";
  };

  var ccFormLabel = function (avg) {
    var a = ccNum(avg, 0);
    if (!a) return "No games yet";
    if (a >= 8) return "Outstanding";
    if (a >= 7.4) return "Excellent";
    if (a >= 6.9) return "Solid";
    if (a >= 6.4) return "Average";
    if (a >= 5.9) return "Poor";
    return "Struggling";
  };

  function ccFill(tpl, vars) {
    if (!tpl) return "";
    return String(tpl).replace(/\{(\w+)\}/g, function (m, k) {
      if (vars && Object.prototype.hasOwnProperty.call(vars, k)) return String(vars[k]);
      return m;
    });
  }

  var NEWS_SRC = ["Matchday Daily", "The Touchline", "Football Weekly", "Touchline TV", "@RumorMill_90", "Continental Sport"];

  /* head + body templates per category. {club} {opp} {player} {goals} etc */
  var NEWS_TEMPLATES = {
    form: ["{player} in irresistible form for {club}", "{player} steals the show as {club} turn up the heat", "Where does {player} rank among the league's best right now?"],
    goals: ["{player} bags {goals} to fire {club}", "{player}'s {goals} sinks {opp}", "Clinical {player} keeps {club} on course"],
    transfer: ["{club} line up move for {player}", "Transfer talk: {player} on the radar after latest display", "Sources: {player} attracting attention from across the league"],
    injury: ["{player} faces spell on the sidelines", "{club} sweat on fitness of key man {player}", "{player} to be assessed after setback"],
    contract: ["{player} and {club} open fresh talks", "Contract update: {player}'s camp remain calm", "{player} nearing agreement on new deal"],
    praise: ["Manager hails influence of {player}", "Team-mates hail {player} as the difference", "Praise pouring in for {player}"],
    milestone: ["{player} reaches landmark appearance for {club}", "Milestone: {player} chalks up a career first", "{player} marks the occasion in style"],
    loan: ["{player} set for loan switch", "Loan watch: {player} to gain valuable minutes", "{player} weighing up loan options"],
    national: ["National team call-up on the cards for {player}", "{player} earns recognition from the selectors", "International future beckons for {player}"],
    reputation: ["Reputation on the rise: {player} turning heads", "{player} becomes a wanted man", "Stock rising fast for {player}"],
    general: ["{player} focused on the task ahead", "{club} prepare for a pivotal week", "{player} keeps his eye on the ball"],
    promotion: ["Promotion sealed: {club} are off to {league}", "{club} win promotion - {league} here they come", "Joy for {club} as a place in {league} is secured"],
    relegation: ["{club} relegated to {league}", "Tough day for {club} as they drop into {league}", "{club} will regroup in {league} next season"]
  };

  var NEWS_BODY = {
    form: "The {player} shows no signs of slowing down, turning in another composed showing for {club} in front of an appreciative crowd.",
    goals: "{opp} had no answer as {player} found the net {goals} time(s), underlining why scouts keep filing through the door.",
    transfer: "Recruitment staff are understood to be monitoring the situation closely, though {club} insist {player} is central to their plans.",
    injury: "It is a blow for {club}, who must now plan without {player} for the coming fixtures while he completes his recovery.",
    contract: "Talks are described as amicable, with both parties keen to reach a resolution without disruption to the season.",
    praise: "Speaking after the match, the staff were quick to single out {player} for the quality and consistency of his recent performances.",
    milestone: "A landmark moment for {player}, who has worked tirelessly to reach this stage of his development with {club}.",
    loan: "Regular football is understood to be the priority, with {player} keen to test himself at the highest level he can reach.",
    national: "Selection would be the reward for a run of form that has been impossible for the coaching staff to ignore.",
    reputation: "Each week seems to add a little more weight to the argument, and {player} is now a name on plenty of shortlists.",
    general: "There is a quiet confidence around {club} at present, and much of it stems from the reliability of {player}.",
    promotion: "A season of hard work ends in celebration for {club}, who take their place in {league} for the coming campaign.",
    relegation: "The campaign ends in disappointment for {club}, who drop down to {league} and must rebuild over the summer."
  };

  var newsSeq = 0;
  function newsId() {
    newsSeq++;
    return "n" + Date.now().toString(36) + newsSeq.toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  /* Push a news item. cat must exist in NEWS_TEMPLATES (fallback: general). */
  function ccNews(c, cat, vars) {
    if (!c || typeof c !== "object") return null;
    if (!Array.isArray(c.news)) c.news = [];
    if (!NEWS_TEMPLATES[cat]) cat = "general";
    var v = vars || {};
    if (!v.player && c.name) v.player = c.name;
    if (!v.club && c.club) v.club = c.club;
    var heads = NEWS_TEMPLATES[cat];
    var item = {
      id: newsId(),
      cat: cat,
      head: ccFill(ccPick(heads), v),
      body: ccFill(NEWS_BODY[cat] || NEWS_BODY.general, v),
      src: ccPick(NEWS_SRC),
      season: ccNum(c.season, 1),
      seen: false,
      t: Date.now()
    };
    c.news.unshift(item);
    if (c.news.length > 60) c.news.length = 60;
    return item;
  }

  /* Courtesy: does the career have at least one unread item? */
  function ccUnread(c) {
    if (!c || !Array.isArray(c.news)) return 0;
    var n = 0;
    for (var i = 0; i < c.news.length; i++) if (!c.news[i].seen) n++;
    return n;
  }

  /* ======================================================================
     WORLD NEWS
     ----------------------------------------------------------------------
     Headlines about OTHER clubs and players, so the back pages read like a
     football world rather than a diary. Names are pulled straight from the
     shipped club rosters (TEAM_ROSTERS), so a story can be "Mbappe suffered a
     torn ACL against Villarreal" instead of a bland placeholder.
     ====================================================================== */
  var WORLD_INJURIES = [
    "a torn ACL", "a hamstring tear", "an ankle injury", "a knee problem", "a calf strain",
    "a groin issue", "a broken foot", "a thigh strain", "concussion", "a shoulder injury", "a back problem"
  ];
  var WORLD_AWARDS = [
    "Player of the Month", "the Golden Boot", "the Playmaker Award", "Young Player of the Month",
    "a place in the Team of the Week", "the Fans' Player of the Month", "the Goal of the Month"
  ];
  var WORLD_FALLBACK_NAMES = [
    "Marco Silva", "Diego Santos", "Luca Rossi", "Andre Berg", "Kai Muller", "Yusuf Kaya",
    "Rafael Costa", "Emil Larsen", "Tomas Novak", "Nico Delgado", "Ruben Mendes", "Mateo Sanz"
  ];

  var WORLD_NEWS = {
    injury: {
      head: [
        "{player} suffered {injury} during game against {opp}",
        "Blow for {club} as {player} picks up {injury} against {opp}",
        "{club} sweat on {player} after {injury} in {opp} clash"
      ],
      body: "{club} have confirmed {player} faces a spell on the sidelines after {injury} in the meeting with {opp}. The club will assess the damage over the coming days."
    },
    transfer: {
      head: [
        "{club} plot swoop for {player}",
        "Rival interest grows as {player} catches the eye of {club}",
        "{other} brace for bids as {club} circle {player}",
        "{player} linked with a move to {club} amid contract stand-off"
      ],
      body: "Sources close to the deal suggest {club} have made initial enquiries for {player}, though any move would need to satisfy {other}."
    },
    manager: {
      head: [
        "{club} part company with their manager",
        "Pressure builds on the {club} boss after another setback",
        "Board hands {club} manager a vote of confidence",
        "{club} begin the search for a new head coach"
      ],
      body: "The situation at {club} has become the talking point of the division, with supporters split over the direction of the club."
    },
    upset: {
      head: [
        "Ruthless {club} stun {other} in {score} win",
        "{other} humbled as {club} run riot in a {score} result",
        "{club} make a statement with a {score} dismantling of {opp}"
      ],
      body: "A result few saw coming. {club} executed their game plan perfectly against {other}, and the fallout will be felt across the league."
    },
    milestone: {
      head: [
        "{player} reaches {n} for the season",
        "Milestone: {player} chalks up {n} for {club}",
        "{player} hits a landmark in {club} colours"
      ],
      body: "Another landmark for {player}, whose form for {club} this season has not gone unnoticed."
    },
    award: {
      head: [
        "{player} named {award}",
        "{award} goes to {club}'s {player}",
        "{player} picks up {award} after a standout run"
      ],
      body: "The recognition is the latest reward for {player}, who has been central to {club}'s campaign."
    },
    youth: {
      head: [
        "{club} hand a debut to academy prospect {player}",
        "Breakthrough: {player} called into the {club} first team",
        "{club} starlet {player} signs a first professional deal"
      ],
      body: "The pathway from the academy is alive and well at {club}, with {player} the latest to earn a first-team opportunity."
    },
    takeover: {
      head: [
        "Takeover talk swirls around {club}",
        "{club} deny sale reports after a boardroom shake-up",
        "Fresh investment expected at {club}, insiders claim"
      ],
      body: "Supporters at {club} are watching developments closely, with any change at the top set to reshape the club's plans."
    }
  };

  var WORLD_CATS = ["injury", "transfer", "manager", "upset", "milestone", "award", "youth", "takeover"];

  function ccWorldClubPool(exclude) {
    var pool = [];
    if (typeof pcAllClubs === "function") {
      pool = pcAllClubs().map(function (x) { return { club: x.club, league: x.league }; });
    } else if (typeof TEAM_ROSTERS !== "undefined" && TEAM_ROSTERS) {
      pool = Object.keys(TEAM_ROSTERS).map(function (n) { return { club: n, league: "" }; });
    }
    if (exclude) pool = pool.filter(function (x) { return x.club !== exclude; });
    return pool;
  }

  function ccWorldPlayer(club) {
    var r = (typeof TEAM_ROSTERS !== "undefined" && TEAM_ROSTERS) ? TEAM_ROSTERS[club] : null;
    var names = [];
    if (r) {
      var add = function (p, role) { if (p && p.name) names.push({ name: p.name, role: role }); };
      add(r.goalkeeper, "goalkeeper");
      (r.defenders || []).forEach(function (p) { add(p, "defender"); });
      (r.midfielders || []).forEach(function (p) { add(p, "midfielder"); });
      (r.attackers || []).forEach(function (p) { add(p, "attacker"); });
    }
    if (names.length) return ccPick(names);
    return { name: ccPick(WORLD_FALLBACK_NAMES), role: "attacker" };
  }

  function ccWorldOpponent(pool, subject) {
    var same = pool.filter(function (x) { return x.league && x.league === subject.league && x.club !== subject.club; });
    if (same.length) return ccPick(same);
    var any = pool.filter(function (x) { return x.club !== subject.club; });
    return any.length ? ccPick(any) : subject;
  }

  /* Push one world story about another club/player onto the back pages. */
  function ccWorldNews(c, cat) {
    if (!c || typeof c !== "object") return null;
    if (!Array.isArray(c.news)) c.news = [];
    var exclude = c.clubName || c.club || null;
    var pool = ccWorldClubPool(exclude);
    if (!pool.length) return null;

    if (!WORLD_NEWS[cat]) cat = ccPick(WORLD_CATS);
    var tpl = WORLD_NEWS[cat];
    var subject = ccPick(pool);
    var opp = ccWorldOpponent(pool, subject);
    var otherClub = ccWorldOpponent(pool, subject);
    var p = ccWorldPlayer(subject.club);
    var gf = 1 + Math.floor(Math.random() * 4);
    var ga = Math.floor(Math.random() * Math.max(1, gf));
    var v = {
      player: p.name,
      club: subject.club,
      opp: opp ? opp.club : subject.club,
      other: otherClub ? otherClub.club : subject.club,
      score: gf + "-" + ga,
      n: (5 + Math.floor(Math.random() * 4) * 5) + " goals",
      injury: ccPick(WORLD_INJURIES),
      award: ccPick(WORLD_AWARDS)
    };
    var item = {
      id: newsId(),
      cat: cat,
      world: true,
      head: ccFill(ccPick(tpl.head), v),
      body: ccFill(tpl.body, v),
      src: ccPick(NEWS_SRC),
      season: ccNum(c.season, 1),
      seen: false,
      t: Date.now() + (Math.floor(Math.random() * 1000))
    };
    c.news.unshift(item);
    if (c.news.length > 60) c.news.length = 60;
    return item;
  }

  /* Push up to n world stories, avoiding an immediate repeat of a headline. */
  function ccWorldNewsBatch(c, n) {
    n = Math.max(1, Math.min(4, ccNum(n, 1)));
    var made = 0;
    var tries = 0;
    while (made < n && tries < n * 6) {
      tries++;
      var prevHead = (c.news && c.news[0]) ? c.news[0].head : null;
      var item = ccWorldNews(c);
      if (!item) break;
      if (item.head === prevHead) { c.news.shift(); continue; }
      made++;
    }
    return made;
  }

  /* ======================================================================
     IN-PLACE RE-RENDER NAVIGATION
     ----------------------------------------------------------------------
     Career hubs rebuild their innerHTML on every tab / button press. That
     throws away the pad's focus ring and the scroll position, dumping a
     controller user back at the top after every choice. Snapshot the focused
     control + scroll before a re-render and restore them afterwards.
     ====================================================================== */
  var NAV_SEL = 'button, [role="button"], a[href], input, select, [data-nav]';

  function ccNavKey(el) {
    if (!el || !el.tagName) return null;
    var tag = el.tagName.toLowerCase();
    var sig = null;
    if (el.getAttribute) {
      sig = el.getAttribute("data-nav-key") || el.getAttribute("onclick") ||
        el.getAttribute("onchange") || el.getAttribute("oninput");
    }
    if (!sig) sig = String(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
    return tag + "::" + sig;
  }

  function ccCaptureNav(rootSel) {
    var root = rootSel ? document.querySelector(rootSel) : null;
    var padEl = (typeof uiNavActive !== "undefined" && uiNavActive &&
      typeof uiFocusables !== "undefined" && uiFocusables.length)
      ? uiFocusables[uiFocusIndex] : null;
    var ae = document.activeElement;
    var aeTag = ae && ae.tagName ? ae.tagName.toLowerCase() : "";
    var textEl = (aeTag === "input" || aeTag === "textarea" || aeTag === "select") ? ae : null;
    var selStart = null, selEnd = null;
    if (textEl && typeof textEl.selectionStart === "number" && textEl.type !== "range") {
      try { selStart = textEl.selectionStart; selEnd = textEl.selectionEnd; } catch (e) { }
    }
    return {
      padKey: ccNavKey(padEl),
      textKey: ccNavKey(textEl),
      selStart: selStart,
      selEnd: selEnd,
      rootTop: root ? root.scrollTop : 0,
      rootLeft: root ? root.scrollLeft : 0,
      winX: window.scrollX || window.pageXOffset || 0,
      winY: window.scrollY || window.pageYOffset || 0
    };
  }

  function ccFindByKey(scope, key) {
    if (!key || !scope) return null;
    var nodes = scope.querySelectorAll(NAV_SEL);
    for (var i = 0; i < nodes.length; i++) if (ccNavKey(nodes[i]) === key) return nodes[i];
    return null;
  }

  function ccRestoreNav(snap, rootSel) {
    if (!snap) return;
    var root = rootSel ? document.querySelector(rootSel) : null;
    var scope = root || document.body;
    if (snap.textKey) {
      var el = ccFindByKey(scope, snap.textKey);
      if (el && typeof el.focus === "function") {
        try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { } }
        if (snap.selStart != null && typeof el.setSelectionRange === "function") {
          try { el.setSelectionRange(snap.selStart, snap.selEnd); } catch (e) { }
        }
      }
    }
    if (snap.padKey && typeof uiFocusEl === "function") {
      var target = ccFindByKey(scope, snap.padKey);
      if (target) { try { uiFocusEl(target); } catch (e) { } }
    }
    if (root) { try { root.scrollTop = snap.rootTop; root.scrollLeft = snap.rootLeft; } catch (e) { } }
    try { if (snap.winX || snap.winY) window.scrollTo(snap.winX, snap.winY); } catch (e) { }
  }

  /* Wrap a render function so focus + scroll survive its innerHTML rebuild. */
  function ccPreserveNav(fn, rootSel) {
    if (typeof fn !== "function") return fn;
    return function () {
      var snap = ccCaptureNav(rootSel);
      var out = fn.apply(this, arguments);
      ccRestoreNav(snap, rootSel);
      return out;
    };
  }

  /* ======================================================================
     SHARED SEASON CALENDAR
     ----------------------------------------------------------------------
     Player Career, Manager Career and My Club all run on the same day-by-day
     season: day 1 is the 1st of August, and a season runs to the end of May.
     A career stores its current position as an integer c.calDay, and each
     fixture carries a `day` number. Everything here is pure and takes the
     career so any mode can reuse it.
     ====================================================================== */
  var CC_CAL_START_MONTH = 8;    /* August */
  var CC_CAL_START_DAY = 1;
  var CC_CAL_FIRST_DAY = 10;     /* 10 Aug - opening weekend */
  var CC_CAL_LAST_MONTH = 5;     /* May */
  var CC_CAL_LAST_DAY = 24;      /* 24 May - final weekend */
  var CC_CAL_END_DAY = 304;      /* 31 May in a 365-day season */

  /* Day 1 of a career's season, as a Date (UTC). Season 1 starts Aug 2026. */
  function ccCalStart(c) {
    var season = ccNum(c && c.season, 1);
    return new Date(Date.UTC(2026 + (season - 1), CC_CAL_START_MONTH - 1, CC_CAL_START_DAY));
  }

  /* The calendar Date for a 1-based season day number. */
  function ccCalDate(c, day) {
    var ms = ccCalStart(c).getTime() + Math.max(0, ccNum(day, 1) - 1) * 86400000;
    return new Date(ms);
  }

  /* Season day number (1-based) for a calendar Date. */
  function ccCalDayNum(c, date) {
    return Math.round((date.getTime() - ccCalStart(c).getTime()) / 86400000) + 1;
  }

  /* Season day number for a month/day pair (month is 1-based). */
  function ccCalDayFor(c, month, dom) {
    var start = ccCalStart(c);
    var year = start.getUTCFullYear();
    if (month < CC_CAL_START_MONTH) year += 1; /* Jan-May belong to next year */
    return ccCalDayNum(c, new Date(Date.UTC(year, month - 1, dom)));
  }

  /* The window (start/end day numbers) a competition occupies. */
  function ccCalWindow(c, fromMonth, fromDay, toMonth, toDay) {
    return { start: ccCalDayFor(c, fromMonth, fromDay), end: ccCalDayFor(c, toMonth, toDay) };
  }

  var CC_CAL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var CC_CAL_MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var CC_CAL_DAY_HDRS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /* Build a month-grid calendar. opts:
       y, m         - viewed month (0-based m)
       startDate    - Date for season day 1
       lastDay      - last season day number with content
       byDay        - { dayNum: [entries] }
       curDay       - the career's current day number (0 = none)
       nowLabel     - marker on the current-day cell ("NOW" / "NEXT")
       renderChip   - function(entry) -> inner HTML of a .calChip
       legend       - HTML for the legend row (optional)
     Returns the full .calHeader/.calGrid/.calLegend block. */
  function ccCalMonthGridHTML(opts) {
    opts = opts || {};
    var y = opts.y, m = opts.m;
    var byDay = opts.byDay || {};
    var startDate = opts.startDate || new Date(Date.UTC(2026, 7, 1));
    var lastDay = ccNum(opts.lastDay, 1);
    var curDay = ccNum(opts.curDay, 0);
    var renderChip = opts.renderChip || function () { return ""; };

    var first = new Date(Date.UTC(y, m, 1));
    var lead = (first.getUTCDay() + 6) % 7;
    var daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

    var html = '<div class="calHeader">' +
      '<button class="calNav" data-cal-nav="-1" title="Previous month">\u2039</button>' +
      '<span class="calTitle">' + CC_CAL_MONTHS_FULL[m] + ' ' + y + '</span>' +
      '<button class="calNav" data-cal-nav="1" title="Next month">\u203a</button>' +
      '<button class="calToday" data-cal-today="1">Today</button>' +
      '</div>';

    var months = [];
    var s0 = startDate, e0 = ccCalDate(null, 1);
    var yy = s0.getUTCFullYear(), mm = s0.getUTCMonth();
    var endD = _ccCalDateRaw(startDate, lastDay);
    while (yy < endD.getUTCFullYear() || (yy === endD.getUTCFullYear() && mm <= endD.getUTCMonth())) {
      months.push({ y: yy, m: mm });
      var nx = new Date(Date.UTC(yy, mm + 1, 1));
      yy = nx.getUTCFullYear(); mm = nx.getUTCMonth();
    }
    html += '<div class="calMonths">';
    for (var mi = 0; mi < months.length; mi++) {
      var mo = months[mi];
      var active = mo.y === y && mo.m === m;
      html += '<button class="calMonthChip' + (active ? " sel" : "") + '" data-cal-goto="' + mo.y + ',' + mo.m + '">' + CC_CAL_MONTHS[mo.m] + ' ' + String(mo.y).slice(2) + '</button>';
    }
    html += '</div>';
    html += '<div class="calWeekdays">' + CC_CAL_DAY_HDRS.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>';
    html += '<div class="calGrid">';
    for (var li = 0; li < lead; li++) html += '<div class="calCell empty"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var dayNum = Math.round((Date.UTC(y, m, d) - startDate.getTime()) / 86400000) + 1;
      var evs = byDay[dayNum] || [];
      var isNow = curDay && dayNum === curDay;
      var inSeason = dayNum >= 1 && dayNum <= lastDay;
      var cell = ["calCell"];
      if (!evs.length) cell.push("rest");
      if (inSeason && evs.length) cell.push("inSeason");
      if (isNow) cell.push("now");
      html += '<div class="' + cell.join(" ") + '" data-cal-day="' + dayNum + '" tabindex="0" role="button" style="cursor:pointer;">';
      html += '<span class="calCellDay">' + d + (isNow ? '<i>' + (opts.nowLabel || "NOW") + '</i>' : '') + '</span>';
      for (var ei = 0; ei < evs.length; ei++) html += renderChip(evs[ei]);
      html += '</div>';
    }
    html += '</div>';
    if (opts.legend) html += '<div class="calLegend">' + opts.legend + '</div>';
    return html;
  }

  function _ccCalDateRaw(startDate, day) {
    return new Date(startDate.getTime() + Math.max(0, ccNum(day, 1) - 1) * 86400000);
  }

  function ccCalDateKey(date) {
    return date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
  }

  /* Delegated handler for the data-cal-* controls emitted by
     ccCalMonthGridHTML: the visible career decides which nav functions run. */
  function ccCalDispatch(e) {
    try {
      var t = e.target;
      if (!t) return;
      // Check for day cell clicks
      var cell = t.closest ? t.closest("[data-cal-day]") : null;
      if (cell) {
        var navOrAction = t.closest ? t.closest("[data-cal-nav],[data-cal-today],[data-cal-goto]") : null;
        if (!navOrAction) {
          var dayNum = ccNum(cell.getAttribute("data-cal-day"), 0);
          if (dayNum > 0) {
            var mode = (typeof currentMode !== "undefined") ? currentMode : "";
            if (mode === "playercareer" && typeof window.pcSimToDayFromCal === "function") {
              e.preventDefault && e.preventDefault();
              e.stopPropagation && e.stopPropagation();
              setTimeout(function(){ try { window.pcSimToDayFromCal(dayNum); } catch (e2) {} }, 0);
              return;
            } else if (mode === "managercareer" && typeof window.mcSimToDayFromCal === "function") {
              e.preventDefault && e.preventDefault();
              e.stopPropagation && e.stopPropagation();
              setTimeout(function(){ try { window.mcSimToDayFromCal(dayNum); } catch (e2) {} }, 0);
              return;
            }
          }
        }
      }
    } catch (e) {
      return;
    }
    if (!t.closest) return;
    var frame = t.closest("[data-cal-nav],[data-cal-today],[data-cal-goto]");
    if (!frame) return;
    var mode = (typeof currentMode !== "undefined") ? currentMode : "";
    var nav = null, today = null, goTo = null;
    if (mode === "playercareer") { nav = "pcCalNav"; today = "pcCalToday"; goTo = "pcCalGoTo"; }
    else if (mode === "managercareer") { nav = "mcCalNav"; today = "mcCalToday"; goTo = "mcCalGoTo"; }
    if (frame.getAttribute("data-cal-nav") != null && nav && typeof window[nav] === "function") {
      window[nav](ccNum(frame.getAttribute("data-cal-nav"), 0));
    } else if (frame.getAttribute("data-cal-today") != null && today && typeof window[today] === "function") {
      window[today]();
    } else if (frame.getAttribute("data-cal-goto") != null && goTo && typeof window[goTo] === "function") {
      var parts = String(frame.getAttribute("data-cal-goto")).split(",");
      window[goTo](ccNum(parts[0], 2026), ccNum(parts[1], 0));
    }
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    try { document.removeEventListener("click", ccCalDispatch, false); } catch (e) {}
    document.addEventListener("click", ccCalDispatch, false);
  }

  /* Personalities shape tone of press reactions. */
  var CC_PERS_TYPES = ["professional", "mercurial", "loyal", "ambitious", "hotshot"];

  window.ccEsc = ccEsc;
  window.ccNum = ccNum;
  window.ccPick = ccPick;
  window.ccClamp = ccClamp;
  window.ccRepTier = ccRepTier;
  window.ccFormLabel = ccFormLabel;
  window.ccFill = ccFill;
  window.ccNews = ccNews;
  window.ccUnread = ccUnread;
  window.ccWorldNews = ccWorldNews;
  window.ccWorldNewsBatch = ccWorldNewsBatch;
  window.ccWorldClubPool = ccWorldClubPool;
  window.ccCaptureNav = ccCaptureNav;
  window.ccRestoreNav = ccRestoreNav;
  window.ccPreserveNav = ccPreserveNav;
  window.ccCalStart = ccCalStart;
  window.ccCalDate = ccCalDate;
  window.ccCalDayNum = ccCalDayNum;
  window.ccCalDayFor = ccCalDayFor;
  window.ccCalWindow = ccCalWindow;
  window.ccCalMonthGridHTML = ccCalMonthGridHTML;
  window.ccCalDateKey = ccCalDateKey;
  window.CC_CAL_START_MONTH = CC_CAL_START_MONTH;
  window.CC_CAL_FIRST_DAY = CC_CAL_FIRST_DAY;
  window.CC_CAL_LAST_MONTH = CC_CAL_LAST_MONTH;
  window.CC_CAL_LAST_DAY = CC_CAL_LAST_DAY;
  window.CC_CAL_END_DAY = CC_CAL_END_DAY;
  window.CC_CAL_MONTHS = CC_CAL_MONTHS;
  window.CC_CAL_MONTHS_FULL = CC_CAL_MONTHS_FULL;
  window.CC_CAL_DAY_HDRS = CC_CAL_DAY_HDRS;
  window.PC_TRAITS = ["loyal", "ambitious", "mercurial", "professional", "hotshot"];
  window.PC_TRAITS_ALL = ["loyal", "ambitious", "mercurial", "professional", "hotshot"];
  window.CC_PERS_TYPES = CC_PERS_TYPES;
  window.NEWS_TEMPLATES = NEWS_TEMPLATES;
  window.NEWS_BODY = NEWS_BODY;
  window.NEWS_SRC = NEWS_SRC;
})();
