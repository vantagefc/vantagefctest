/* Player Career hub panels (loaded after playercareer.js; overrides the stubs).
   Provides: News, Media, Relationships, Objectives, Transfers, Contract, Loans,
   Fitness. Also seeds objectives and generates match news via wrappers so the
   base career logic stays untouched. */
(function () {
  var E = function (s) { return (typeof pcEsc === "function") ? pcEsc(s) : (typeof ccEsc === "function" ? ccEsc(s) : String(s == null ? "" : s)); };
  var N = function (n, d) { return (typeof pcNum === "function") ? pcNum(n, d) : (isFinite(Number(n)) ? Number(n) : (d || 0)); };
  var empty = function (t, l) { return (typeof cpEmpty === "function") ? cpEmpty(t, l) : ""; };
  var block = function (t, b, i) { return (typeof cpBlock === "function") ? cpBlock(t, b, i) : ""; };
  var row = function (l, v, o) { return (typeof cpRow === "function") ? cpRow(l, v, o) : ""; };
  var meter = function (l, v, m, o) { return (typeof cpMeter === "function") ? cpMeter(l, v, m, o) : ""; };
  var chip = function (t, o) { return (typeof cpChip === "function") ? cpChip(t, o) : ""; };
  var when = function (t) { return (typeof cpWhen === "function") ? cpWhen(t) : ""; };
  var pick = function (a) { return (typeof ccPick === "function") ? ccPick(a) : a[0]; };

  function fmtMoney(v) {
    var n = N(v, 0);
    if (n >= 1e6) return "\u00a3" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
    if (n >= 1e3) return "\u00a3" + Math.round(n / 1e3) + "k";
    return "\u00a3" + Math.round(n);
  }

  /* ---------------------------------------------------------------- News ---- */
  window.pcHubNewsHTML = function (c) {
    var news = Array.isArray(c.news) ? c.news : [];
    if (!news.length) return empty("News", "No headlines yet. Play matches and make an impact to get noticed.");
    var unread = 0;
    for (var i = 0; i < news.length; i++) if (!news[i].seen) unread++;
    var items = news.slice(0, 40).map(function (n) {
      return '<div class="pcNews' + (n.seen ? "" : " unread") + '">' +
        '<div class="pcNewsHead">' + (n.seen ? "" : '<i class="pcDot"></i>') + E(n.head || "Update") + "</div>" +
        '<div class="pcNewsMeta">' + E(n.src || "Press") + " &middot; S" + E(n.season || 1) + " &middot; " + when(n.t) + "</div>" +
        '<div class="pcHint">' + E(n.body || "") + "</div></div>";
    }).join("");
    var tools = '<button class="wcGhostBtn pcMini" onclick="pcNewsMarkRead()">Mark all read</button>';
    return block("Back pages", unread ? unread + " new" : "All caught up", items + tools);
  };

  window.pcNewsMarkRead = function () {
    if (!pcState || !Array.isArray(pcState.news)) return;
    for (var i = 0; i < pcState.news.length; i++) pcState.news[i].seen = true;
    if (typeof pcSave === "function") pcSave();
    if (typeof pcShowHub === "function") pcShowHub();
  };

  /* -------------------------------------------------------- Media / Press --- */
  window.pcHubMediaHTML = function (c) {
    var rep = N(c.rep, 20);
    var tier = (typeof ccRepTier === "function") ? ccRepTier(rep) : "-";
    var social = c.social || {};
    var followers = N(social.followers, 0);
    var pers = c.personality || {};
    var media = N(pers.media, 55);
    var press = Array.isArray(c.press) ? c.press : [];

    var out = block("Public profile", tier,
      meter("Reputation", rep, 100, { tone: rep >= 70 ? "good" : rep >= 40 ? "" : "bad" }) +
      meter("Media handling", media, 100, { tone: media >= 60 ? "good" : media >= 40 ? "" : "bad" }) +
      row("Followers", followers >= 1e6 ? (followers / 1e6).toFixed(1) + "M" : followers >= 1e3 ? Math.round(followers / 1e3) + "k" : String(followers)) +
      row("Persona", pers.type ? (pers.type.charAt(0).toUpperCase() + pers.type.slice(1)) : "Unknown"));

    if (social.trending && social.trending.length) {
      out += block("Trending", "", social.trending.slice(0, 6).map(function (t) {
        return row(t.tag || t, t.vol ? t.vol : "");
      }).join(""));
    }

    if (press.length) {
      out += block("Recent press", press.length + " pieces", press.slice(0, 10).map(function (p) {
        return '<div class="pcNews"><div class="pcNewsHead">' + E(p.head || "Press conference") + "</div>" +
          '<div class="pcNewsMeta">' + E(p.src || "Media") + " &middot; " + when(p.t) + "</div>" +
          '<div class="pcHint">' + E(p.body || "") + "</div></div>";
      }).join(""));
    } else {
      out += empty("Recent press", "No interviews yet this season.");
    }
    return out;
  };

  /* ------------------------------------------------------- Relationships ---- */
  window.pcHubRelHTML = function (c) {
    var rel = c.rel || {};
    var agent = N(rel.agent, 60);
    var manager = N(c.trust, 55);
    var chem = N(c.chemistry, 55);
    var pers = c.personality || {};

    var out = block("Your circle", "",
      meter("Manager trust", manager, 100, { tone: manager >= 60 ? "good" : manager >= 35 ? "" : "bad" }) +
      meter("Agent", agent, 100, { tone: agent >= 60 ? "good" : agent >= 35 ? "" : "bad" }) +
      meter("Squad chemistry", chem, 100, { tone: chem >= 60 ? "good" : chem >= 35 ? "" : "bad" }) +
      meter("Loyalty", N(pers.loyalty, 60), 100, {}) +
      meter("Boldness", N(pers.boldness, 55), 100, {}));

    var mates = Array.isArray(rel.teammates) ? rel.teammates : [];
    if (mates.length) {
      out += block("Teammates", mates.length,
        mates.slice(0, 12).map(function (m) {
          var bond = N(m.bond, 50);
          var tone = bond >= 65 ? "good" : bond >= 40 ? "" : "bad";
          return '<div class="pcLine"><span>' + E(m.name || "Teammate") + "</span><b>" + chip(maskBondLabel(bond), tone) + "</b></div>";
        }).join(""));
    } else {
      out += empty("Teammates", "No close bonds formed yet.");
    }

    if (rel.managerNote) out += block("From the manager", "", '<div class="pcHint">' + E(rel.managerNote) + "</div>");
    return out;
  };

  function maskBondLabel(v) { return v >= 80 ? "Close" : v >= 60 ? "Strong" : v >= 40 ? "Okay" : v >= 25 ? "Distant" : "Frosty"; }

  /* ---------------------------------------------------------- Objectives ---- */
  window.pcHubObjHTML = function (c) {
    var objs = Array.isArray(c.objectives) ? c.objectives : [];
    if (!objs.length) return empty("Objectives", "No targets set for this season.");
    var out = block("Season objectives", objs.length + " targets", objs.map(function (o) {
      var cur = objCurrent(c, o);
      var done = objDone(c, o, cur);
      var target = N(o.target, 1);
      if (o.type === "rating") {
        return meter(o.label, Math.min(cur, target), target, { tone: done ? "good" : cur >= target - 0.8 ? "" : "bad", show: cur ? cur.toFixed(2) + " / " + target.toFixed(1) : "-" });
      }
      return meter(o.label, Math.min(cur, target), target, { tone: done ? "good" : "", show: Math.round(cur) + " / " + target });
    }).join(""));
    out += '<div class="pcHint" style="margin-top:6px">Meet targets to earn development points and keep the manager onside.</div>';
    return out;
  };

  function objCurrent(c, o) {
    var ss = c.seasonStats || {};
    switch (o.type) {
      case "goals": return N(ss.goals, 0);
      case "assists": return N(ss.assists, 0);
      case "apps": return N(ss.apps, 0);
      case "motm": return N(ss.motm, 0);
      case "wins": return N(ss.wins, 0);
      case "rating": return ss.apps ? N(ss.ratingSum, 0) / ss.apps : 0;
      case "rep": return N(c.rep, 0);
      default: return 0;
    }
  }
  function objDone(c, o, cur) {
    cur = cur == null ? objCurrent(c, o) : cur;
    if (o.type === "rating") return cur >= N(o.target, 7);
    return cur >= N(o.target, 1);
  }

  window.pcSeedObjectives = function (c) {
    var ovr = (typeof pcProOvr === "function") ? pcProOvr(c) : 70;
    var goals = Math.max(2, Math.round(ovr / 14));
    var list = [
      { id: "goals", type: "goals", label: "Score " + goals + " league goals", target: goals, reward: 6 },
      { id: "apps", type: "apps", label: "Make 20 appearances", target: 20, reward: 5 },
      { id: "rating", type: "rating", label: "Average a 7.0 match rating", target: 7.0, reward: 8 }
    ];
    c.objectives = list;
    return list;
  };

  /* ----------------------------------------------------------- Transfers ---- */
  window.pcHubTransferHTML = function (c) {
    var offers = Array.isArray(c.offers) ? c.offers : [];
    var rep = N(c.rep, 20);
    var interest = rep >= 80 ? "High" : rep >= 60 ? "Growing" : rep >= 40 ? "Watched" : "Low";
    var out = block("Transfer interest", interest,
      row("Current club", c.club || "-") +
      row("League", c.league || "-") +
      row("Reputation", ((typeof ccRepTier === "function") ? ccRepTier(rep) : "-") + " (" + Math.round(rep) + ")"));

    if (offers.length) {
      out += block("Offers on the table", offers.length + " club" + (offers.length > 1 ? "s" : ""),
        offers.map(function (o, i) {
          return '<div class="pcOffer"><span><b>' + E(o.club) + "</b> <em>" + E(o.tier || "") + "</em>" +
            '<div class="pcHint">' + E(o.league || "") + " &middot; " + fmtMoney(o.wage) + "/wk</div></span>" +
            '<button class="wcPrimaryBtn pcMini" onclick="pcAcceptOffer(pcState,' + i + ')">Sign</button></div>';
        }).join("") +
        '<button class="wcGhostBtn pcMini" onclick="pcDeclineOffers(pcState)">Stay put</button>');
    } else {
      out += empty("Offers", "No offers right now. Strong displays will attract suitors.");
    }
    return out;
  };

  /* ---------------------------------------------------------- Contract ------ */
  window.pcHubContractHTML = function (c) {
    var ct = c.contract || { wage: 0, seasons: 3, yearsLeft: 3 };
    var ovr = (typeof pcProOvr === "function") ? pcProOvr(c) : 70;
    var yearsLeft = N(ct.yearsLeft, N(ct.seasons, 3));
    var out = block("Contract", yearsLeft <= 1 ? "Expiring" : yearsLeft + "y left",
      row("Wage", fmtMoney(N(ct.wage, 0)) + "/wk") +
      row("Length", N(ct.seasons, 3) + " seasons") +
      row("Years remaining", yearsLeft) +
      row("Squad value", fmtMoney(ovr * ovr * 40)));
    out += block("Earnings", "",
      row("Career earnings", fmtMoney(N(c.earnings, 0))) +
      row("Agent fee rate", (Math.round(N((c.rel || {}).agent, 60) / 10)) + "%"));
    if (yearsLeft <= 1) {
      out += '<div class="pcHint">Your deal expires soon. Keep performing to earn a renewal.</div>';
    }
    return out;
  };

  /* ------------------------------------------------------------ Loans ------- */
  window.pcHubLoansHTML = function (c) {
    var loans = Array.isArray(c.loans) ? c.loans : [];
    if (!loans.length) return empty("Loans", "No loan spells. You have been at your clubs full-time.");
    return block("Loan history", loans.length + " spell" + (loans.length > 1 ? "s" : ""),
      loans.slice().reverse().map(function (l) {
        var active = !l.to;
        return '<div class="pcNews"><div class="pcNewsHead">' + E(l.club || "Club") +
          (active ? ' <span class="pcGood">Active</span>' : "") + "</div>" +
          '<div class="pcNewsMeta">S' + E(l.from || "?") + (l.to ? " \u2013 S" + E(l.to) : "") +
          " &middot; " + N(l.apps, 0) + " apps, " + N(l.goals, 0) + " goals</div></div>";
      }).join(""));
  };

  /* ---------------------------------------------------------- Fitness ------- */
  window.pcHubFitnessHTML = function (c) {
    var inj = c.injury;
    var ovr = (typeof pcProOvr === "function") ? pcProOvr(c) : 70;
    var pot = N(c.potential, ovr);
    var cap = (typeof pcSeasonCap === "function") ? pcSeasonCap(c.age) : 99;
    var gain = N(c.seasonTrainGain, 0);
    var dp = N(c.dp, 0);

    var out = block("Condition", inj && inj.days > 0 ? "Injured" : "Available",
      inj && inj.days > 0
        ? chip(inj.type + " (" + inj.days + "d)", "bad") + '<div class="pcHint">Ruled out until fully recovered.</div>'
        : chip("Match fit", "good") + '<div class="pcHint">Available for selection.</div>');

    out += block("Development", "",
      meter("Overall", ovr, Math.max(ovr, pot), { tone: ovr >= pot ? "good" : "", show: ovr + " / " + pot }) +
      meter("Training room", gain, cap, { tone: gain < cap ? "good" : "bad", show: gain + " / " + cap }) +
      row("Development points", Math.round(dp)));

    var form = Array.isArray(c.form) ? c.form : [];
    if (form.length) {
      out += block("Recent form", "",
        '<div class="pcFormRow">' + form.map(function (r) {
          var v = N(r, 0);
          return '<span class="pcFormPip' + (v >= 7 ? " good" : (v < 6 ? " bad" : "")) + '">' + v.toFixed(1) + "</span>";
        }).join("") + "</div>");
    }
    return out;
  };

  /* --------------------------------------------- News generation hooks ------ */
  window.pcGenMatchNews = function (c, r) {
    if (!c || !r || !r.minutes || typeof ccNews !== "function") return;
    var form = Array.isArray(c.form) ? c.form : [];
    var rating = form.length ? N(form[form.length - 1], 0) : 0;
    if (r.proGoals >= 3) ccNews(c, "goals", { goals: r.proGoals });
    else if (r.proGoals === 2) ccNews(c, "goals", { goals: r.proGoals });
    else if (rating >= 8.4) ccNews(c, "form", {});
    else if (r.proAssists >= 2) ccNews(c, "praise", {});
    if (c.seasonStats.apps > 0 && c.seasonStats.apps % 25 === 0) ccNews(c, "milestone", {});
  };

  /* Wrap pcStartSeason to seed objectives + pre-season news. */
  if (typeof pcStartSeason === "function") {
    var _origStart = pcStartSeason;
    window.pcStartSeason = pcStartSeason = function (c, first) {
      _origStart(c, first);
      if (typeof ccNews === "function" && first) {
        ccNews(c, "general", {});
        if (c.personality && c.personality.type === "hotshot") ccNews(c, "reputation", {});
      }
      if (typeof ccWorldNewsBatch === "function") ccWorldNewsBatch(c, first ? 3 : 2);
      window.pcSeedObjectives(c);
    };
  }

  /* Wrap pcApplyResult to generate world news + own news after each match. */
  if (typeof pcApplyResult === "function") {
    var _origApply = pcApplyResult;
    window.pcApplyResult = pcApplyResult = function (c, r) {
      _origApply(c, r);
      if (typeof ccWorldNewsBatch === "function") {
        ccWorldNewsBatch(c, Math.random() < 0.65 ? 1 : 2);
      }
      window.pcGenMatchNews(c, r);
    };
  }

  /* Keep the pad focus ring + scroll position when the hub redraws in place. */
  if (typeof ccPreserveNav === "function") {
    if (typeof pcShowHub === "function") window.pcShowHub = pcShowHub = ccPreserveNav(pcShowHub, "#careerScreen");
    if (typeof pcRenderSetup === "function") window.pcRenderSetup = pcRenderSetup = ccPreserveNav(pcRenderSetup, "#careerScreen");
  }
})();
