(function () {
  function esc(s) {
    return (typeof window.ccEsc === "function") ? window.ccEsc(s) : String(s == null ? "" : s);
  }
  function num(n, d) {
    return (typeof window.ccNum === "function") ? window.ccNum(n, d) : (isFinite(Number(n)) ? Number(n) : (d || 0));
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, num(v, lo))); }

  /* Standard empty state used across every career panel. */
  function cpEmpty(title, line) {
    return '<div class="pcBlock"><div class="pcBlockHead">' + esc(title) +
      '</div><div class="pcHint">' + esc(line || "Nothing to report yet.") + "</div></div>";
  }

  /* Block wrapper with optional right-aligned badge. */
  function cpBlock(title, badge, inner) {
    return '<div class="pcBlock"><div class="pcBlockHead">' + esc(title) +
      (badge ? '<span class="pcBudget">' + esc(badge) + "</span>" : "") +
      "</div>" + (inner || "") + "</div>";
  }

  /* Label / value row. val may contain trusted HTML via raw:true */
  function cpRow(label, value, opts) {
    opts = opts || {};
    var v = opts.raw ? String(value == null ? "" : value) : esc(value);
    var cls = opts.cls ? " " + opts.cls : "";
    return '<div class="pcLine' + cls + '"><span>' + esc(label) + "</span><b>" + v + "</b></div>";
  }

  /* Horizontal meter. tone: good|warn|bad|null */
  function cpMeter(label, value, max, opts) {
    opts = opts || {};
    max = num(max, 100) || 100;
    var pct = clamp((num(value, 0) / max) * 100, 0, 100);
    var tone = opts.tone || (pct >= 66 ? "good" : pct >= 33 ? "" : "bad");
    var show = opts.show == null ? (Math.round(num(value, 0)) + "/" + Math.round(max)) : opts.show;
    return '<div class="pcStatRow"><span class="pcStatName">' + esc(label) + "</span>" +
      '<span class="pcStatBar"><i class="' + tone + '" style="width:' + pct + '%"></i></span>' +
      '<span class="pcStatVal">' + esc(show) + "</span></div>";
  }

  /* Small inline chip (status pill). */
  function cpChip(text, tone) {
    var cls = tone === "good" ? "pcGood" : tone === "bad" ? "pcBad" : tone === "warn" ? "pcBudget" : "pcHint";
    return '<span class="' + cls + '">' + esc(text) + "</span>";
  }

  /* Badge row used for names + a trailing emphasis. */
  function cpEntry(head, sub, right) {
    return '<div class="pcOffer"><span><b>' + esc(head) + "</b>" +
      (sub ? " <em>" + esc(sub) + "</em>" : "") + "</span>" +
      (right ? "<span>" + right + "</span>" : "") + "</div>";
  }

  /* Relative time label for news/social items. */
  function cpWhen(t) {
    var ms = Date.now() - num(t, Date.now());
    if (ms < 0) ms = 0;
    var m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    var d = Math.floor(h / 24);
    if (d < 30) return d + "d ago";
    return Math.floor(d / 30) + "mo ago";
  }

  window.cpEmpty = cpEmpty;
  window.cpBlock = cpBlock;
  window.cpRow = cpRow;
  window.cpMeter = cpMeter;
  window.cpChip = cpChip;
  window.cpEntry = cpEntry;
  window.cpWhen = cpWhen;
})();
