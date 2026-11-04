/* ============================================================================
   fccards.js - FC-style My Club player cards.

   This ports the visual language of the "fc-card-tiers" design reference into
   the game: a shield-clipped card with a tier-art face, a large rating and
   position on the left, a cartoon portrait, the player name and a six-stat
   grid across the bottom.

   Everything here is additive and namespaced with the fc prefix so it can sit
   alongside the older .lineupCard styling without clashing. The renderer
   fcCardInner(card, opts) returns the card markup; callers keep their own root
   element (so drag/drop, click and selection behaviour is untouched) and drop
   the returned markup inside it.
   ========================================================================== */
"use strict";

var fcUidSeq = 0;

/* -------------------------------------------------------------------------
   Shared geometry (design space: card 270x390, face 260x380)
   ------------------------------------------------------------------------- */
var FC_SHAPE = [[0,7],[4,3.5],[14,1.8],[36,.8],[50,0],[64,.8],[86,1.8],[96,3.5],[100,7],
  [100,88],[97,91.5],[88,94.5],[62,98],[50,100],[38,98],[12,94.5],[3,91.5],[0,88]];
var FC_SW = 260, FC_SH = 380;
var FC_SHAPE_CSS = "polygon(" + FC_SHAPE.map(function (p) { return p[0] + "% " + p[1] + "%"; }).join(",") + ")";

function fcPol(cx, cy, r, deg) {
  return [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
}
function fcStar(cx, cy, R, r, n, rot) {
  if (rot == null) rot = -90;
  var out = [];
  for (var i = 0; i < n * 2; i++) {
    var pt = fcPol(cx, cy, i % 2 ? r : R, rot + i * 180 / n);
    out.push(pt[0].toFixed(1) + "," + pt[1].toFixed(1));
  }
  return out.join(" ");
}
function fcSparkle(x, y, s, fill, extra) {
  return '<path ' + (extra || "") + ' d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y +
    'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y +
    'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'Z" fill="' + fill + '"/>';
}
function fcConfetti(list) {
  return list.map(function (a) {
    return '<rect x="' + a[0] + '" y="' + a[1] + '" width="6" height="3" fill="' + a[2] +
      '" transform="rotate(' + a[3] + ' ' + (a[0] + 3) + ' ' + (a[1] + 1.5) + ')"/>';
  }).join("");
}
function fcGoldGrad(id) {
  return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#e2b43f"/>' +
    '<stop offset="1" stop-color="#8d6210"/></linearGradient>';
}

function fcPoly(inset) {
  var cx = FC_SW / 2, cy = FC_SH / 2, kx = (FC_SW - 2 * inset) / FC_SW, ky = (FC_SH - 2 * inset) / FC_SH;
  return FC_SHAPE.map(function (p) {
    var x = p[0] / 100 * FC_SW, y = p[1] / 100 * FC_SH;
    return (cx + (x - cx) * kx).toFixed(1) + "," + (cy + (y - cy) * ky).toFixed(1);
  }).join(" ");
}
var FC_FRAME = '<svg class="fcFrame" viewBox="0 0 ' + FC_SW + " " + FC_SH + '" aria-hidden="true">' +
  '<polygon class="l1" points="' + fcPoly(5) + '"/>' +
  '<polygon class="l2" points="' + fcPoly(9) + '"/>' +
  '<polygon class="l3" points="' + fcPoly(14) + '"/></svg>';

/* -------------------------------------------------------------------------
   Club badge + small emblem glyphs
   ------------------------------------------------------------------------- */
function fcBadge(ab, c1, c2) {
  return '<svg viewBox="0 0 34 36"><path d="M17 1.5 31.5 6.5V19C31.5 27.5 24.5 32.5 17 34.5 9.5 32.5 2.5 27.5 2.5 19V6.5Z" fill="' + c1 +
    '" stroke="rgba(0,0,0,.55)" stroke-width="1.3"/><path d="M2.5 12.5H31.5V20H2.5Z" fill="' + c2 +
    '"/><path d="M17 1.5 31.5 6.5V19C31.5 27.5 24.5 32.5 17 34.5Z" fill="rgba(0,0,0,.16)"/>' +
    '<text x="17" y="18.7" text-anchor="middle" font-size="7.8" font-weight="800" letter-spacing=".2" fill="' + c1 + '">' + ab + '</text></svg>';
}
function fcBall(fill, stroke) {
  var p = fcStar(16, 17, 5.6, 5.6, 5);
  var lines = "";
  for (var i = 0; i < 5; i++) {
    var q = fcPol(16, 17, 5.6, -90 + i * 72), o = fcPol(16, 17, 13.2, -90 + i * 72);
    lines += '<path d="M' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + 'L' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) +
      '" stroke="' + stroke + '" stroke-width="1.2"/>';
  }
  return '<svg viewBox="0 0 32 34"><circle cx="16" cy="17" r="13.5" fill="' + fill + '" stroke="' + stroke +
    '" stroke-width="1.5"/><polygon points="' + p + '" fill="' + stroke + '"/>' + lines + '</svg>';
}
var FC_HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
function fcPx(dx, dy, fill) {
  return FC_HEART.map(function (row, y) {
    return row.split("").map(function (ch, x) {
      return ch === "X" ? '<rect x="' + (2 + x * 4 + dx) + '" y="' + (5 + y * 4 + dy) + '" width="4" height="4" fill="' + fill + '"/>' : "";
    }).join("");
  }).join("");
}

/* Per-tier emblem under the club badge (u = unique id suffix). */
var FC_EM = {
  max: function () { return '<svg viewBox="0 0 32 34"><g filter="url(#fcGlow)"><path d="M19 1 5 19H14L11 33 27 13H18Z" fill="#00f0ff" stroke="#fff" stroke-width=".8" stroke-linejoin="round"/></g></svg>'; },
  wc: function (c, u) { return '<svg viewBox="0 0 32 34"><defs>' + fcGoldGrad("tg" + u) + '</defs><circle cx="16" cy="8" r="6.5" fill="url(#tg' + u + ')"/><path d="M9 14Q6 24 12 27L11 31H21L20 27Q26 24 23 14Q19 18 16 18Q13 18 9 14Z" fill="url(#tg' + u + ')"/><rect x="10" y="31" width="12" height="3" fill="#1a7f4b"/></svg>'; },
  holo: function (c, u) { return '<svg viewBox="0 0 32 34"><defs><linearGradient id="dg' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ac8"/><stop offset=".35" stop-color="#ffe27a"/><stop offset=".65" stop-color="#7affc8"/><stop offset="1" stop-color="#7ab8ff"/></linearGradient></defs><polygon points="16,2 29,13 16,32 3,13" fill="url(#dg' + u + ')" stroke="#141a45" stroke-width="1.2" stroke-linejoin="round"/><path d="M3 13H29M11 13 16 2 21 13 16 32Z" fill="none" stroke="#141a45" stroke-width=".9" opacity=".7"/></svg>'; },
  rtg: function () { return '<svg viewBox="0 0 32 34">' + [0, 1, 2, 3, 4].map(function (i) { return '<path d="M6 ' + (29 - i * 6) + 'L16 ' + (22 - i * 6) + 'L26 ' + (29 - i * 6) + '" fill="none" stroke="' + (i < 3 ? "#f4c542" : "rgba(255,255,255,.22)") + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'; }).join("") + '</svg>'; },
  icon: function (c, u) { return '<svg viewBox="0 0 32 34"><defs>' + fcGoldGrad("ig2" + u) + '</defs><polygon points="' + fcStar(16, 18, 15, 6.5, 5) + '" fill="url(#ig2' + u + ')" stroke="#6a4a0e" stroke-width="1" stroke-linejoin="round"/></svg>'; },
  leader: function () { return '<svg viewBox="0 0 32 34">' + [[8, 21, 6, 2.6], [16, 11, 7, 3], [24, 21, 6, 2.6]].map(function (a) { return '<polygon points="' + fcStar(a[0], a[1], a[2], a[3], 5) + '" fill="#f6b40e" stroke="#0a2150" stroke-width=".9" stroke-linejoin="round"/>'; }).join("") + '</svg>'; },
  legend: function (c, u) { return '<svg viewBox="0 0 32 34"><defs>' + fcGoldGrad("cg" + u) + '</defs><path d="M3 26 5 10 11 18 16 6 21 18 27 10 29 26Z" fill="url(#cg' + u + ')" stroke="#05281d" stroke-width="1" stroke-linejoin="round"/><rect x="3" y="26" width="26" height="4" rx="1" fill="url(#cg' + u + ')" stroke="#05281d" stroke-width="1"/></svg>'; },
  game: function () { return '<svg viewBox="0 0 32 34" shape-rendering="crispEdges">' + fcPx(2, 2, "#8a0a3a") + fcPx(0, 0, "#ff3d6e") + '<rect x="6" y="9" width="4" height="4" fill="#fff"/></svg>'; },
  captain: function () { return '<svg viewBox="0 0 32 34"><rect x="3" y="7" width="26" height="20" rx="3" fill="#ffd400" stroke="#111" stroke-width="1.5"/><text x="16" y="24" text-anchor="middle" font-size="19" font-weight="800" fill="#111">C</text></svg>'; },
  league: function (c, u) { return '<svg viewBox="0 0 32 34"><circle cx="16" cy="17" r="14.5" style="fill:var(--l1d);stroke:var(--l3)" stroke-width="1.6"/><circle cx="16" cy="17" r="10.5" fill="none" style="stroke:var(--l2)" stroke-width="1.2" stroke-dasharray="2 2"/><text x="16" y="21.5" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">' + (c.em || "") + '</text></svg>'; },
  special: function () { return '<svg viewBox="0 0 32 34"><polygon points="' + fcStar(16, 17, 15, 8, 8) + '" fill="#fff" stroke="#2b0a7a" stroke-width="1" stroke-linejoin="round"/><polygon points="' + fcStar(16, 17, 6.5, 3.2, 8) + '" fill="#ff2d95"/></svg>'; },
  gold: function () { return fcBall("#f4d36a", "#5a3a08"); },
  silver: function () { return fcBall("#eef2f6", "#2f3a4c"); },
  prospect: function (c) { return '<svg viewBox="0 0 32 34"><rect x="2" y="3" width="28" height="29" rx="5" fill="#b6ff4a"/><text x="16" y="14" text-anchor="middle" font-size="9" font-weight="800" fill="#06281d" letter-spacing=".8">POT</text><text x="16" y="28" text-anchor="middle" font-size="15" font-weight="800" fill="#06281d">' + (c.pot || "") + '</text></svg>'; },
  bronze: function () { return fcBall("#e0a070", "#4a2410"); }
};

/* -------------------------------------------------------------------------
   Decorative art per tier (drawn in the 260x380 face space, u = id suffix)
   ------------------------------------------------------------------------- */
var FC_DECO = {
  max: function (c, u) {
    return '<defs><linearGradient id="mxg' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00f0ff"/><stop offset=".55" stop-color="#8a3fff"/><stop offset="1" stop-color="#ff2bd6"/></linearGradient></defs>' +
      '<text x="136" y="212" text-anchor="middle" font-size="156" font-weight="800" fill="none" stroke="url(#mxg' + u + ')" stroke-width="1.4" opacity=".5" letter-spacing="4">MAX</text>' +
      '<g filter="url(#fcGlow)" fill="none" stroke-linecap="round" stroke-linejoin="bevel">' +
      '<path d="M12 112 44 146 34 156 72 198 62 206 98 252" stroke="#00f0ff" stroke-width="2"/>' +
      '<path d="M250 100 220 134 230 142 198 182 208 190 172 236" stroke="#ff2bd6" stroke-width="2"/>' +
      '<path d="M132 10 121 36 136 40 120 70" stroke="#ffe14a" stroke-width="1.6"/></g>' +
      '<g class="fcPts" fill="#fff">' + [[30, 250], [58, 300], [210, 280], [236, 230], [24, 150], [240, 60], [190, 40], [70, 60]].map(function (a, i) { return '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="1.6" style="animation-delay:' + (-i * .6).toFixed(1) + 's"/>'; }).join("") + '</g>';
  },
  wc: function (c, u) {
    return '<defs>' + fcGoldGrad("wcg" + u) + '<linearGradient id="wcr' + u + '" x1="0" x2="1"><stop offset="0" stop-color="#e2b43f" stop-opacity="0"/><stop offset=".5" stop-color="#e2b43f" stop-opacity=".35"/><stop offset="1" stop-color="#e2b43f" stop-opacity="0"/></linearGradient></defs>' +
      '<g fill="none" stroke="url(#wcg' + u + ')" stroke-width="1" opacity=".5"><circle cx="156" cy="130" r="100"/><ellipse cx="156" cy="130" rx="42" ry="100"/><ellipse cx="156" cy="130" rx="76" ry="100"/><ellipse cx="156" cy="130" rx="100" ry="34"/><ellipse cx="156" cy="130" rx="100" ry="68"/><path d="M56 130H256M156 30V230"/></g>' +
      fcConfetti([[22, 40, "#19d3c5", 20], [236, 70, "#ff4f9a", -30], [44, 98, "#ffd24a", 40], [224, 28, "#ffd24a", 10], [240, 150, "#19d3c5", 60], [16, 176, "#ff4f9a", -10], [206, 198, "#ffd24a", 25], [34, 214, "#19d3c5", -45], [250, 212, "#ff4f9a", 15], [96, 22, "#ff4f9a", 35], [196, 16, "#19d3c5", -20]]) +
      '<rect y="230" width="260" height="42" fill="url(#wcr' + u + ')"/><path d="M0 230H260M0 272H260" stroke="#e2b43f" stroke-width="1" opacity=".65"/>';
  },
  holo: function (c, u) {
    return '<defs><linearGradient id="hp' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ac8"/><stop offset=".33" stop-color="#ffe27a"/><stop offset=".66" stop-color="#7affc8"/><stop offset="1" stop-color="#7ab8ff"/></linearGradient>' +
      '<pattern id="dl' + u + '" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H18M0 0V18" stroke="#fff" stroke-opacity=".55" stroke-width=".6" fill="none"/></pattern></defs>' +
      '<rect width="260" height="380" fill="url(#dl' + u + ')" opacity=".7"/>' +
      '<polygon points="0,0 130,0 0,170" fill="url(#hp' + u + ')" opacity=".38"/><polygon points="260,40 260,230 110,230" fill="url(#hp' + u + ')" opacity=".3"/><polygon points="0,230 90,230 0,330" fill="url(#hp' + u + ')" opacity=".28"/>' +
      '<g>' + [[34, 52, 7, 0], [236, 34, 6, .5], [222, 126, 9, 1.1], [22, 232, 6, 1.6], [132, 22, 5, .3], [246, 214, 7, 2], [70, 196, 5, .8], [196, 70, 5, 1.4]].map(function (a) { return fcSparkle(a[0], a[1], a[2], "#fff", 'class="fcTw" style="animation-delay:' + a[3] + 's"'); }).join("") + '</g>';
  },
  rtg: function () {
    var dashes = "";
    [.08, .2, .34, .5, .68, .88].forEach(function (t) {
      var t2 = t + .07 + t * .05, y = 62 + t * 214, y2 = 62 + t2 * 214, w1 = 1.4 + t * 7, w2 = 1.4 + t2 * 7;
      dashes += '<polygon points="' + (130 - w1) + ',' + y + ' ' + (130 + w1) + ',' + y + ' ' + (130 + w2) + ',' + y2 + ' ' + (130 - w2) + ',' + y2 + '" fill="#ffe796" opacity=".9"/>';
    });
    var chev = "";
    for (var k = 0; k < 4; k++) chev += '<path d="M222 ' + (150 - k * 28) + 'l12 -10 12 10" fill="none" stroke="#5aa0ff" stroke-opacity="' + (.8 - k * .17).toFixed(2) + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    return '<defs><linearGradient id="rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe796" stop-opacity=".95"/><stop offset=".25" stop-color="#2a5cd0" stop-opacity=".8"/><stop offset="1" stop-color="#050f30" stop-opacity=".9"/></linearGradient>' +
      '<radialGradient id="rh"><stop offset="0" stop-color="#fff3c0" stop-opacity=".95"/><stop offset=".4" stop-color="#ffd25a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="130" cy="62" r="78" fill="url(#rh)"/><polygon points="124,62 136,62 330,276 -70,276" fill="url(#rd)"/>' +
      '<path d="M124 62-70 276M136 62 330 276" stroke="#f4c542" stroke-width="2" fill="none"/>' + dashes +
      '<path d="M0 62H260" stroke="#ffe796" stroke-opacity=".55"/><g filter="url(#fcGlow)">' + fcSparkle(130, 58, 13, "#fff6c8") + '</g>' + chev;
  },
  icon: function (c, u) {
    return '<defs>' + fcGoldGrad("ig" + u) + '</defs>' +
      '<g fill="none" stroke="url(#ig' + u + ')" stroke-width="1.2" opacity=".85"><path d="M30 238Q130 30 230 238"/><path d="M52 238Q130 80 208 238"/><path d="M74 238Q130 128 186 238"/></g>' +
      '<path d="M222 22H246V46M38 22H14" stroke="url(#ig' + u + ')" stroke-width="1.6" fill="none"/>' +
      '<g transform="translate(130 274)"><path d="M-74 0H-12M12 0H74" stroke="url(#ig' + u + ')" stroke-width="1.2"/><path d="M0 -6 6 0 0 6-6 0Z" fill="url(#ig' + u + ')"/><circle cx="-18" cy="0" r="1.6" fill="#a27a1e"/><circle cx="18" cy="0" r="1.6" fill="#a27a1e"/></g>';
  },
  leader: function () {
    var cx = 160, cy = 108, rays = "";
    for (var k = 0; k < 16; k++) {
      var a = k * 22.5, len = k % 2 ? 74 : 104, p1 = fcPol(cx, cy, 48, a - 5), p2 = fcPol(cx, cy, len, a), p3 = fcPol(cx, cy, 48, a + 5);
      rays += '<polygon points="' + [p1, p2, p3].map(function (p) { return p.map(function (v) { return v.toFixed(1); }).join(","); }).join(" ") + '" fill="#f6b40e" opacity="' + (k % 2 ? .55 : .8) + '" stroke="#b97c00" stroke-width=".6"/>';
    }
    return rays + '<circle cx="' + cx + '" cy="' + cy + '" r="46" fill="#f6b40e" opacity=".85" stroke="#b97c00"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="52" fill="none" stroke="#fff" stroke-opacity=".8" stroke-dasharray="2 4"/>';
  },
  legend: function (c, u) {
    var cx = 158, cy = 132, R = 88, leaves = "";
    for (var k = 0; k < 13; k++) {
      var th = 262 - k * 12, sc = (1 - k * .022).toFixed(2), x1 = fcPol(cx, cy, R + 5, -th), x2 = fcPol(cx, cy, R - 6, -th), rot = 180 - th;
      leaves += '<g transform="translate(' + x1[0].toFixed(1) + ' ' + x1[1].toFixed(1) + ') rotate(' + (rot + 28) + ') scale(' + sc + ')"><path d="M0 -10Q6.5 0 0 10Q-6.5 0 0 -10Z" fill="url(#lg' + u + ')"/></g>' +
        '<g transform="translate(' + x2[0].toFixed(1) + ' ' + x2[1].toFixed(1) + ') rotate(' + (rot - 28) + ') scale(' + sc + ')"><path d="M0 -9Q6 0 0 9Q-6 0 0 -9Z" fill="url(#lg' + u + ')"/></g>';
    }
    return '<defs>' + fcGoldGrad("lg" + u) + '</defs><g opacity=".92">' + leaves + '<g transform="translate(' + (2 * cx) + ' 0) scale(-1 1)">' + leaves + '</g></g>' +
      '<path d="M' + cx + ' ' + (cy + R) + 'Q' + (cx - 12) + ' ' + (cy + R + 11) + ' ' + (cx - 20) + ' ' + (cy + R + 5) + 'Q' + (cx - 12) + ' ' + (cy + R - 2) + ' ' + cx + ' ' + (cy + R) + 'Q' + (cx + 12) + ' ' + (cy + R - 2) + ' ' + (cx + 20) + ' ' + (cy + R + 5) + 'Q' + (cx + 12) + ' ' + (cy + R + 11) + ' ' + cx + ' ' + (cy + R) + 'Z" fill="url(#lg' + u + ')"/>' +
      '<rect x="74" y="271" width="37" height="3" fill="#009246"/><rect x="111" y="271" width="38" height="3" fill="#fff"/><rect x="149" y="271" width="37" height="3" fill="#ce2b37"/>' +
      '<path d="M20 272.5H74M186 272.5H240" stroke="#c99a2e" stroke-width="1" opacity=".7"/>';
  },
  game: function () {
    var vl = "", hl = "";
    for (var i = -9; i <= 9; i++) vl += '<path d="M160 176L' + (160 + i * 44) + ' 290"/>';
    [182, 190, 200, 214, 232, 256].forEach(function (y) { hl += '<path d="M0 ' + y + 'H260"/>'; });
    var stars = [[20, 30], [44, 70], [84, 24], [110, 52], [210, 26], [238, 64], [190, 48], [28, 120], [240, 118], [132, 14], [60, 160], [230, 160]].map(function (a) { return '<rect x="' + a[0] + '" y="' + a[1] + '" width="2" height="2" fill="#fff" opacity=".85"/>'; }).join("");
    return '<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe94a"/><stop offset=".55" stop-color="#ff9a3c"/><stop offset="1" stop-color="#ff3df2"/></linearGradient>' +
      '<mask id="sm"><rect width="260" height="380" fill="#fff"/><rect y="134" width="260" height="2" fill="#000"/><rect y="144" width="260" height="3" fill="#000"/><rect y="155" width="260" height="4" fill="#000"/><rect y="167" width="260" height="5" fill="#000"/></mask></defs>' +
      stars + '<circle cx="160" cy="118" r="64" fill="url(#sg)" mask="url(#sm)"/>' +
      '<polygon points="0,176 26,152 48,168 78,138 108,170 134,158 164,176 196,150 226,170 260,146 260,176" fill="#2a0a55" stroke="#ff3df2" stroke-width="1"/>' +
      '<rect y="176" width="260" height="110" fill="#14062e"/>' +
      '<g filter="url(#fcGlow)" stroke="#ff3df2" stroke-width=".9" fill="none" opacity=".9">' + vl + hl + '</g>' +
      '<path d="M0 176H260" stroke="#2df1ff" stroke-width="1.5" filter="url(#fcGlow)"/>';
  },
  captain: function () {
    return '<polygon points="-10,226 270,106 270,118 -10,238" fill="#ffd400" opacity=".9"/><polygon points="-10,246 270,126 270,131 -10,251" fill="#ffd400" opacity=".75"/>' +
      '<polygon points="-10,258 270,138 270,141 -10,261" fill="#fff" opacity=".5"/>' +
      '<text x="200" y="320" text-anchor="middle" font-size="200" font-weight="800" fill="#ffd400" opacity=".08">C</text>' +
      '<g>' + [[96, 38], [110, 32], [124, 38]].map(function (a) { return '<polygon points="' + fcStar(a[0], a[1], 6, 2.6, 5) + '" fill="#ffd400"/>'; }).join("") + '</g>';
  },
  league: function (c) {
    return '<polygon points="260,40 260,122 0,264 0,182" style="fill:var(--l2)" opacity=".92"/>' +
      '<polygon points="260,130 260,140 0,282 0,272" style="fill:var(--l4)" opacity=".95"/>' +
      '<polygon points="260,24 260,34 0,176 0,166" style="fill:var(--l3)" opacity=".7"/>' +
      '<text transform="translate(224 34) rotate(90)" font-size="40" font-weight="800" letter-spacing="3" fill="#fff" opacity=".14">' + (c.lg || "") + '</text>';
  },
  special: function () {
    return [["0,0 120,0 40,150", .10], ["120,0 260,0 260,90 80,170", .07], ["0,150 40,150 120,380 0,380", .08], ["260,90 260,380 150,380 170,200", .09], ["60,200 170,200 150,380 120,380", .06]].map(function (a) { return '<polygon points="' + a[0] + '" fill="#fff" opacity="' + a[1] + '"/>'; }).join("") +
      '<polygon points="' + fcStar(168, 110, 150, 92, 20) + '" fill="#fff" opacity=".1"/><circle cx="168" cy="110" r="84" fill="none" stroke="#fff" stroke-opacity=".4" stroke-dasharray="3 5"/>' +
      fcConfetti([[20, 40, "#ffd24a", 20], [238, 60, "#fff", -30], [30, 110, "#ff3fa4", 40], [226, 24, "#18f2d0", 10], [242, 150, "#ffd24a", 60], [14, 184, "#fff", -10], [210, 200, "#ff3fa4", 25], [40, 216, "#ffd24a", -45], [248, 214, "#18f2d0", 15], [98, 22, "#fff", 35], [190, 16, "#ffd24a", -20]]) +
      [[40, 64, 8, 0], [226, 100, 6, .6], [18, 150, 5, 1.2], [236, 200, 7, 1.8], [120, 18, 5, .3]].map(function (a) { return fcSparkle(a[0], a[1], a[2], "#fff", 'class="fcTw" style="animation-delay:' + a[3] + 's"'); }).join("");
  },
  gold: function () {
    var cx = 150, cy = 130, pent = [];
    for (var i = 0; i < 5; i++) pent.push(fcPol(cx, cy, 34, -90 + i * 72));
    var spokes = pent.map(function (p, i) {
      var o = fcPol(cx, cy, 96, -90 + i * 72);
      return '<path d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'L' + o[0].toFixed(1) + ' ' + o[1].toFixed(1) + '"/>';
    }).join("");
    return '<g fill="none" stroke="#6a4a10" stroke-width="1.4" opacity=".16"><circle cx="' + cx + '" cy="' + cy + '" r="96"/><polygon points="' + pent.map(function (p) { return p.map(function (v) { return v.toFixed(1); }).join(","); }).join(" ") + '"/>' + spokes + '</g>';
  },
  silver: function () {
    var s = "";
    for (var y = 20; y < 340; y += 22) {
      s += '<path d="M-10 ' + y + 'L130 ' + (y - 34) + 'L270 ' + y + '" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="1.2"/>' +
        '<path d="M-10 ' + (y + 2) + 'L130 ' + (y - 32) + 'L270 ' + (y + 2) + '" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="1"/>';
    }
    return s;
  },
  prospect: function () {
    return '<g fill="none" stroke="#b6ff4a" stroke-opacity=".13"><circle cx="150" cy="130" r="40"/><circle cx="150" cy="130" r="70"/><circle cx="150" cy="130" r="100"/></g>' +
      '<path d="M26 232C70 222 96 196 130 176S206 100 238 48" fill="none" stroke="#b6ff4a" stroke-width="2.6" stroke-dasharray=".1 7" stroke-linecap="round"/>' +
      '<path d="M226 52 240 44 238 60" fill="none" stroke="#b6ff4a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  },
  bronze: function () { return ""; }
};

/* -------------------------------------------------------------------------
   Cartoon portrait (ported from the reference playerSVG)
   ------------------------------------------------------------------------- */
function fcPlayerSVG(p) {
  var s = p.skin, h = p.hair, hs = p.hs, kit = p.kit, kit2 = p.kit2, bc = p.bc || h;
  var back = hs === "afro"
    ? '<ellipse cx="100" cy="56" rx="48" ry="38" fill="' + h + '"/>'
    : hs === "long" ? '<path d="M60 64Q48 124 64 150L136 150Q152 124 140 64Z" fill="' + h + '"/>'
      : hs === "curly" ? [[66, 64, 12], [72, 48, 13], [86, 37, 14], [102, 33, 14], [118, 37, 14], [131, 48, 13], [136, 64, 12], [100, 48, 17]].map(function (a) { return '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="' + a[2] + '" fill="' + h + '"/>'; }).join("")
        : hs === "bun" ? '<circle cx="100" cy="27" r="12" fill="' + h + '"/>' : "";
  var front = hs === "bald" ? '<ellipse cx="94" cy="50" rx="16" ry="7" fill="#fff" opacity=".16"/>'
    : hs === "fade" ? '<path d="M66 72Q64 38 100 36Q136 38 134 72Q128 57 100 56Q72 57 66 72Z" fill="' + h + '"/>'
      : (hs === "afro" || hs === "curly") ? '<path d="M67 68Q68 48 100 46Q132 48 133 68Q122 56 100 55Q78 56 67 68Z" fill="' + h + '"/>'
        : '<path d="M64 76Q58 34 100 32Q142 34 136 76Q131 54 100 52Q69 54 64 76Z" fill="' + h + '"/>';
  var beard = p.beard ? '<path d="M67 86Q68 128 100 134Q132 128 133 86Q126 113 100 113Q74 113 67 86Z" fill="' + bc + '" opacity=".92"/><path d="M88 105Q100 99 112 105Q100 109 88 105Z" fill="' + bc + '"/>' : "";
  var arm = p.arm ? '<rect x="156" y="170" width="34" height="14" rx="3" fill="#ffd400" stroke="#111" stroke-width="1.2" transform="rotate(14 173 177)"/><text x="173" y="181.5" text-anchor="middle" font-size="11" font-weight="800" fill="#111" transform="rotate(14 173 177)">C</text>' : "";
  var brow = p.brow || h;
  return '<svg viewBox="0 0 200 222" aria-hidden="true">' + back +
    '<ellipse cx="66" cy="84" rx="6" ry="10" fill="' + s + '"/><ellipse cx="134" cy="84" rx="6" ry="10" fill="' + s + '"/>' +
    '<ellipse cx="66.5" cy="85" rx="2.5" ry="5" fill="rgba(0,0,0,.14)"/><ellipse cx="133.5" cy="85" rx="2.5" ry="5" fill="rgba(0,0,0,.14)"/>' +
    '<path d="M86 104V144Q100 168 114 144V104Z" fill="' + s + '"/>' +
    '<path d="M86 118Q100 136 114 118V134Q100 150 86 134Z" fill="rgba(0,0,0,.22)"/>' +
    '<path d="M4 224V192Q8 158 50 148L84 136 100 162 116 136 150 148Q192 158 196 192V224Z" fill="' + kit + '"/>' +
    '<path d="M100 162 116 136 150 148Q192 158 196 192V224H100Z" fill="rgba(0,0,0,.16)"/>' +
    '<path d="M50 148Q14 158 6 194M150 148Q186 158 194 194" fill="none" stroke="' + kit2 + '" stroke-width="5" stroke-linecap="round" opacity=".95"/>' +
    '<path d="M84 136 100 162 116 136" fill="none" stroke="' + kit2 + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="132" cy="178" r="6.5" fill="' + kit2 + '" opacity=".9"/><circle cx="132" cy="178" r="3" fill="' + kit + '"/>' + arm +
    '<path d="M66 74Q66 40 100 38Q134 40 134 74Q134 122 100 128Q66 122 66 74Z" fill="' + s + '"/>' +
    '<path d="M100 38Q134 40 134 74Q134 122 100 128Z" fill="rgba(0,0,0,.1)"/>' +
    '<ellipse cx="90" cy="58" rx="15" ry="7" fill="#fff" opacity=".1"/>' +
    '<ellipse cx="86" cy="81" rx="5.4" ry="3.2" fill="#fff" opacity=".92"/><ellipse cx="114" cy="81" rx="5.4" ry="3.2" fill="#fff" opacity=".92"/>' +
    '<circle cx="86.5" cy="81" r="2.6" fill="#1b0f0a"/><circle cx="113.5" cy="81" r="2.6" fill="#1b0f0a"/>' +
    '<path d="M78 72Q86 67.5 94 71M106 71Q114 67.5 122 72" fill="none" stroke="' + brow + '" stroke-width="3.2" stroke-linecap="round"/>' +
    '<path d="M99.5 84 96.5 99Q100 102.5 103.5 99" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' + beard +
    '<path d="M91 111Q100 117 109 111" fill="none" stroke="rgba(80,24,24,.75)" stroke-width="2.3" stroke-linecap="round"/>' + front +
    "</svg>";
}

/* -------------------------------------------------------------------------
   Nationality flags (reference set + a generic fallback)
   ------------------------------------------------------------------------- */
var FC_FLAG = {
  br: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#009b3a"/><path d="M15 2.5 27 10 15 17.5 3 10Z" fill="#fedf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/></svg>',
  fr: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#0055a4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ef4135"/></svg>',
  jp: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5.6" fill="#bc002d"/></svg>',
  pt: '<svg viewBox="0 0 30 20"><rect width="12" height="20" fill="#006600"/><rect x="12" width="18" height="20" fill="#ff0000"/><circle cx="12" cy="10" r="4" fill="#ffcc00"/><circle cx="12" cy="10" r="2" fill="#fff"/></svg>',
  nl: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#ae1c28"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><rect y="13.3" width="30" height="6.7" fill="#21468b"/></svg>',
  ar: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#74acdf"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><circle cx="15" cy="10" r="2.2" fill="#f6b40e"/></svg>',
  it: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/></svg>',
  es: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/></svg>',
  de: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#000"/><rect y="6.7" width="30" height="6.6" fill="#dd0000"/><rect y="13.3" width="30" height="6.7" fill="#ffce00"/></svg>',
  gb: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect x="12.5" width="5" height="20" fill="#cf142b"/><rect y="7.5" width="30" height="5" fill="#cf142b"/></svg>',
  ng: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#008751"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#008751"/></svg>',
  be: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#000"/><rect x="10" width="10" height="20" fill="#fae042"/><rect x="20" width="10" height="20" fill="#ed2939"/></svg>',
  pl: '<svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#dc143c"/></svg>',
  se: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#006aa7"/><rect x="9" width="4" height="20" fill="#fecc00"/><rect y="8" width="30" height="4" fill="#fecc00"/></svg>',
  ie: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#169b62"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ff883e"/></svg>',
  mx: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#006847"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce1126"/><circle cx="15" cy="10" r="2.4" fill="#8b5a2b"/></svg>',
  us: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><g fill="#b22234"><rect width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.15" width="30" height="1.54"/><rect y="9.23" width="30" height="1.54"/><rect y="12.31" width="30" height="1.54"/><rect y="15.38" width="30" height="1.54"/><rect y="18.46" width="30" height="1.54"/></g><rect width="12.5" height="10.77" fill="#3c3b6e"/></svg>',
  uy: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><g fill="#0038a8"><rect width="30" height="2.22"/><rect y="4.44" width="30" height="2.22"/><rect y="8.88" width="30" height="2.22"/><rect y="13.33" width="30" height="2.22"/><rect y="17.77" width="30" height="2.23"/></g><rect width="12" height="8.88" fill="#fff"/><circle cx="6" cy="4.44" r="2.4" fill="#fcd116"/></svg>',
  co: '<svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#fcd116"/><rect y="10" width="30" height="5" fill="#003893"/><rect y="15" width="30" height="5" fill="#ce1126"/></svg>',
  hr: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#ff0000"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><rect y="13.3" width="30" height="6.7" fill="#171796"/><rect x="12" y="6.7" width="6" height="6.6" fill="#f92726"/><rect x="12" y="6.7" width="1.5" height="1.65" fill="#fff"/><rect x="15" y="6.7" width="1.5" height="1.65" fill="#fff"/><rect x="13.5" y="8.35" width="1.5" height="1.65" fill="#fff"/><rect x="16.5" y="8.35" width="1.5" height="1.65" fill="#fff"/></svg>',
  dk: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#c60c30"/><rect x="9" width="4" height="20" fill="#fff"/><rect y="8" width="30" height="4" fill="#fff"/></svg>',
  no: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#ba0c2f"/><rect x="8" width="6" height="20" fill="#fff"/><rect y="7" width="30" height="6" fill="#fff"/><rect x="9.5" width="3" height="20" fill="#00205b"/><rect y="8.5" width="30" height="3" fill="#00205b"/></svg>',
  ch: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#d52b1e"/><rect x="13" y="4" width="4" height="12" fill="#fff"/><rect x="9" y="8" width="12" height="4" fill="#fff"/></svg>',
  at: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#ed2939"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><rect y="13.3" width="30" height="6.7" fill="#ed2939"/></svg>',
  tr: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#e30a17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="13" cy="10" r="4" fill="#e30a17"/><polygon points="17.5,10 21,8.8 19,11.6 19,8.4 21,11.2" fill="#fff"/></svg>',
  kr: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="4.4" fill="#cd2e3a"/><path d="M10.6 10a4.4 4.4 0 0 0 8.8 0 2.2 2.2 0 0 0-4.4 0 2.2 2.2 0 0 1-4.4 0Z" fill="#0047a0"/></svg>',
  au: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#00008b"/><rect width="15" height="10" fill="#00247d"/><path d="M0 0l15 10M15 0L0 10" stroke="#fff" stroke-width="1.6"/><path d="M7.5 0v10M0 5h15" stroke="#fff" stroke-width="2.4"/><path d="M7.5 0v10M0 5h15" stroke="#cf142b" stroke-width="1.2"/><circle cx="22" cy="5" r="1" fill="#fff"/><circle cx="25" cy="10" r="1" fill="#fff"/><circle cx="20" cy="13" r="1" fill="#fff"/><circle cx="24" cy="15" r="1" fill="#fff"/></svg>',
  cm: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#007a5e"/><rect x="10" width="10" height="20" fill="#ce1126"/><rect x="20" width="10" height="20" fill="#fcd116"/><polygon points="15,7 16,10.5 19.5,10.5 16.7,12.6 17.7,16 15,14 12.3,16 13.3,12.6 10.5,10.5 14,10.5" fill="#fcd116"/></svg>',
  gh: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#ce1126"/><rect y="6.7" width="30" height="6.6" fill="#fcd116"/><rect y="13.3" width="30" height="6.7" fill="#006b3f"/><polygon points="15,7 16,10.5 19.5,10.5 16.7,12.6 17.7,16 15,14 12.3,16 13.3,12.6 10.5,10.5 14,10.5" fill="#000"/></svg>',
  sn: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#00853f"/><rect x="10" width="10" height="20" fill="#fdef42"/><rect x="20" width="10" height="20" fill="#e31b23"/><polygon points="15,7 16,10.5 19.5,10.5 16.7,12.6 17.7,16 15,14 12.3,16 13.3,12.6 10.5,10.5 14,10.5" fill="#00853f"/></svg>',
  ma: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#c1272d"/><polygon points="15,6 16.2,10 20.3,10 17,12.5 18.2,16.5 15,14 11.8,16.5 13,12.5 9.7,10 13.8,10" fill="none" stroke="#006233" stroke-width="1"/></svg>',
  eg: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#ce1126"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><rect y="13.3" width="30" height="6.7" fill="#000"/><circle cx="15" cy="10" r="2" fill="#c09300"/></svg>',
  ci: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#f77f00"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#009e60"/></svg>',
  ca: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#d80621"/><rect x="22.5" width="7.5" height="20" fill="#d80621"/><path d="M15 4l1.4 3 3-1.2-1.2 3 2.6.4-2.4 2 1 2.6-3-.8-.4 3-1 0-.4-3-3 .8 1-2.6-2.4-2 2.6-.4-1.2-3 3 1.2z" fill="#d80621"/></svg>',
  cl: '<svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#d52b1e"/><rect width="10" height="10" fill="#0039a6"/><polygon points="5,3 5.9,5.8 8.8,5.8 6.4,7.4 7.3,10.2 5,8.6 2.7,10.2 3.6,7.4 1.2,5.8 4.1,5.8" fill="#fff"/></svg>',
  pe: '<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#d91023"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#d91023"/></svg>',
  ec: '<svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#ffdd00"/><rect y="10" width="30" height="5" fill="#034ea2"/><rect y="15" width="30" height="5" fill="#ed1c24"/><circle cx="15" cy="10" r="2.6" fill="#ffdd00" stroke="#a67c00" stroke-width=".4"/></svg>',
  sa: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#165d31"/><rect x="6" y="11" width="18" height="1.6" fill="#fff"/><rect x="6" y="6" width="13" height="1.2" fill="#fff"/></svg>',
  ir: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#239f40"/><rect y="6.7" width="30" height="6.6" fill="#fff"/><rect y="13.3" width="30" height="6.7" fill="#da0000"/><circle cx="15" cy="10" r="2.4" fill="#da0000"/></svg>',
  cn: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#ee1c25"/><polygon points="6,3 6.9,5.8 9.8,5.8 7.4,7.4 8.3,10.2 6,8.6 3.7,10.2 4.6,7.4 2.2,5.8 5.1,5.8" fill="#ffff00"/></svg>',
  nz: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#00247d"/><rect width="15" height="10" fill="#00247d"/><path d="M0 0l15 10M15 0L0 10" stroke="#fff" stroke-width="1.6"/><path d="M7.5 0v10M0 5h15" stroke="#fff" stroke-width="2.4"/><path d="M7.5 0v10M0 5h15" stroke="#cf142b" stroke-width="1.2"/><circle cx="22" cy="6" r="1" fill="#fff"/><circle cx="25" cy="12" r="1" fill="#fff"/><circle cx="19" cy="14" r="1" fill="#fff"/></svg>',
  cz: '<svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#d7141a"/><polygon points="0,0 15,10 0,20" fill="#11457e"/></svg>',
  rs: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#c6363c"/><rect y="6.7" width="30" height="6.6" fill="#0c4076"/><rect y="13.3" width="30" height="6.7" fill="#fff"/></svg>',
  dz: '<svg viewBox="0 0 30 20"><rect width="15" height="20" fill="#006233"/><rect x="15" width="15" height="20" fill="#fff"/><circle cx="14" cy="10" r="3.4" fill="#d21034"/><circle cx="15.4" cy="10" r="3.4" fill="#fff"/></svg>',
  tn: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#e70013"/><circle cx="15" cy="10" r="4.4" fill="#fff"/><circle cx="15.5" cy="10" r="3.4" fill="#e70013"/><circle cx="16" cy="10" r="3.4" fill="#fff"/><circle cx="15" cy="10" r="2" fill="#e70013"/></svg>',
  ge: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect x="12" width="6" height="20" fill="#ff0000"/><rect y="7" width="30" height="6" fill="#ff0000"/></svg>',
  si: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#fff"/><rect y="6.7" width="30" height="6.6" fill="#0000bf"/><rect y="13.3" width="30" height="6.7" fill="#ff0000"/><path d="M8 4v6l3 3 3-3V4Z" fill="#0000bf" stroke="#fff" stroke-width=".6"/></svg>',
  ru: '<svg viewBox="0 0 30 20"><rect width="30" height="6.7" fill="#fff"/><rect y="6.7" width="30" height="6.6" fill="#0039a6"/><rect y="13.3" width="30" height="6.7" fill="#d52b1e"/></svg>'
};
var FC_NATION_ISO = {
  "Brazil": "br", "France": "fr", "Japan": "jp", "Portugal": "pt", "Netherlands": "nl",
  "Argentina": "ar", "Italy": "it", "Spain": "es", "Germany": "de", "England": "gb",
  "Nigeria": "ng", "Belgium": "be", "Poland": "pl", "Sweden": "se", "Ireland": "ie",
  "Mexico": "mx", "USA": "us", "Uruguay": "uy", "Colombia": "co", "Croatia": "hr",
  "Denmark": "dk", "Norway": "no", "Switzerland": "ch", "Austria": "at", "Turkey": "tr",
  "South Korea": "kr", "Korea": "kr", "Australia": "au", "Cameroon": "cm", "Ghana": "gh",
  "Senegal": "sn", "Morocco": "ma", "Egypt": "eg", "Ivory Coast": "ci", "Canada": "ca",
  "Chile": "cl", "Peru": "pe", "Ecuador": "ec", "Saudi Arabia": "sa", "Iran": "ir",
  "China": "cn", "New Zealand": "nz", "Czechia": "cz", "Serbia": "rs", "Algeria": "dz",
  "Tunisia": "tn", "Georgia": "ge", "Slovenia": "si", "Russia": "ru", "Wales": "gb", "Scotland": "gb"
};
var FC_GENERIC_FLAG_COLORS = ["#ce1126", "#006b3f", "#0039a6", "#fcd116", "#ffffff", "#111111", "#f77f00", "#7a1fa2"];
function fcFlagSVG(nation) {
  var key = String(nation == null ? "" : nation).trim();
  var iso = FC_NATION_ISO[key];
  if (!iso) { for (var k in FC_NATION_ISO) { if (k.toUpperCase() === key.toUpperCase()) { iso = FC_NATION_ISO[k]; break; } } }
  if (iso && FC_FLAG[iso]) return FC_FLAG[iso];
  var seed = iso || key || "?";
  var h = fcHash(seed), a = h % FC_GENERIC_FLAG_COLORS.length, b = (h >>> 5) % FC_GENERIC_FLAG_COLORS.length;
  if (a === b) b = (b + 3) % FC_GENERIC_FLAG_COLORS.length;
  var c1 = FC_GENERIC_FLAG_COLORS[a], c2 = FC_GENERIC_FLAG_COLORS[b];
  return '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="' + c1 + '"/><rect y="10" width="30" height="10" fill="' + c2 + '"/><rect y="7.5" width="30" height="5" fill="#fff" opacity=".85"/></svg>';
}

/* -------------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------------- */
function fcEsc(s) {
  if (typeof escapeHtml === "function") return escapeHtml(s == null ? "" : s);
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function fcHash(str) {
  var h = 2166136261 >>> 0, s = String(str == null ? "" : str);
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function fcRng(seed) {
  var x = seed >>> 0 || 1;
  return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
function fcInitials(name) {
  var parts = String(name == null ? "" : name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CL";
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts.slice(0, 3).map(function (w) { return w[0]; }).join("").toUpperCase();
}
function fcLum(hex) {
  var c = String(hex == null ? "" : hex).replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  if (c.length < 6) return 0.5;
  var r = parseInt(c.slice(0, 2), 16) / 255, g = parseInt(c.slice(2, 4), 16) / 255, b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function fcTrimFor(club) {
  return fcLum(club) < 0.55 ? "#ffffff" : "#101418";
}
var FC_SKIN = ["#f6d6b8", "#f1c9a0", "#e8c3a0", "#e0ac82", "#d9a679", "#c78d63", "#b07a50", "#8d5a3b", "#6b3f26", "#5a3622", "#4a2c1c"];
var FC_HAIR = ["#0b0b0b", "#1b120a", "#2a1a10", "#3a2412", "#5a3a1a", "#7b4a22", "#9a6a2a", "#c9a14a", "#d8b25c", "#8a8a8a", "#c7c7c7", "#b5502d", "#e6e6e6"];
var FC_HS = ["short", "fade", "curly", "afro", "long", "bun", "bald"];
function fcLook(card, clubColor, isCaptain) {
  var seed = fcHash([card && card.name, card && card.nation, card && card.tag, card && card.variant, card && card.__cid].join("|"));
  var rnd = fcRng(seed);
  var skin = FC_SKIN[Math.floor(rnd() * FC_SKIN.length)];
  var hair = FC_HAIR[Math.floor(rnd() * FC_HAIR.length)];
  var hs = FC_HS[Math.floor(rnd() * FC_HS.length)];
  var beard = rnd() > 0.62;
  var club = clubColor || "#168cff";
  return {
    skin: skin, hair: hair, hs: hs, beard: beard, bc: hair,
    kit: club, kit2: fcTrimFor(club), arm: !!isCaptain
  };
}

/* -------------------------------------------------------------------------
   Tier mapping: game tag -> reference tier
   ------------------------------------------------------------------------- */
var FC_LEAGUE_VARS = {
  pl: "--l1:#3d0a5c;--l1d:#14001f;--l2:#e90052;--l3:#00ff85;--l4:#ffffff;--lt:#14001f",
  ll: "--l1:#c8102e;--l1d:#3a0612;--l2:#ffb703;--l3:#ffd166;--l4:#1b1f4a;--lt:#3a0612",
  bl: "--l1:#d3151f;--l1d:#45050a;--l2:#ffffff;--l3:#ffffff;--l4:#111111;--lt:#45050a",
  sa: "--l1:#0a4fb4;--l1d:#04204f;--l2:#18a6f0;--l3:#ffffff;--l4:#ffffff;--lt:#04204f",
  l1: "--l1:#2f4fb3;--l1d:#12295a;--l2:#7ad0e8;--l3:#ffffff;--l4:#ffffff;--lt:#12295a"
};
var FC_LEAGUE_LABEL = { pl: "Premier League", ll: "La Liga", bl: "Bundesliga", sa: "Serie A", l1: "Ligue 1" };
var FC_LEAGUE_EM = { pl: "PL", ll: "LL", bl: "BL", sa: "SA", l1: "L1" };
var FC_TIER_LABEL = {
  max: "MAX", wc: "World Cup", holo: "Holographic", rtg: "Road to Glory", icon: "Icon",
  leader: "Nation Leader", legend: "Nation Legend", game: "Game Legend", captain: "Captain",
  special: "Special", gold: "Rare Gold", silver: "Silver", prospect: "Prospect", bronze: "Bronze"
};
function fcTierInfo(card, ovr) {
  var tag = String((card && card.tag) || "").toUpperCase();
  var t, league = null;
  if (tag === "MAX") t = "max";
  else if (tag === "WC") t = "wc";
  else if (tag === "HOLO") t = "holo";
  else if (tag === "RTG") t = "rtg";
  else if (tag === "ICON") t = "icon";
  else if (tag === "NATIONLEADER") t = "leader";
  else if (tag === "LEGEND") t = "legend";
  else if (tag === "HERO") t = "game";
  else if (tag === "CAPTAIN") t = "captain";
  else if (tag === "SPECIAL" || tag === "CUSTOM") t = "special";
  else if (tag === "GOLD") t = "gold";
  else if (tag === "SILVER") t = "silver";
  else if (tag === "PROSPECT") t = "prospect";
  else if (tag === "BRONZE") t = "bronze";
  else if (tag === "PL") { t = "league"; league = "pl"; }
  else if (tag === "LALIGA") { t = "league"; league = "ll"; }
  else if (tag === "BUNDESLIGA") { t = "league"; league = "bl"; }
  else if (tag === "SERIEA") { t = "league"; league = "sa"; }
  else if (tag === "LIGUE1") { t = "league"; league = "l1"; }
  else t = ovr >= 85 ? "gold" : ovr >= 75 ? "silver" : "bronze";
  var label = (card && card.variant) ? String(card.variant) : (league ? FC_LEAGUE_LABEL[league] : (FC_TIER_LABEL[t] || ""));
  return {
    t: t, league: league, label: label,
    vars: league ? FC_LEAGUE_VARS[league] : "",
    lg: league ? FC_LEAGUE_LABEL[league].toUpperCase() : "",
    em: league ? FC_LEAGUE_EM[league] : ""
  };
}

/* -------------------------------------------------------------------------
   Renderer
   ------------------------------------------------------------------------- */
function fcStatGrid(stats) {
  var labels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  var out = "";
  for (var k = 0; k < 6; k++) {
    var s = stats[k];
    var v = Array.isArray(s) ? s[0] : s;
    var d = Array.isArray(s) ? s[1] : 0;
    v = (v == null ? 0 : v);
    out += '<div class="fcStat" style="--p:' + v + '%"><b>' + v + (d ? '<sup>+' + d + '</sup>' : '') + '</b><span>' + labels[k] + '</span></div>';
  }
  return out;
}

/**
 * Build the FC-style card markup.
 * opts: {
 *   ovr, stats[[v,d]...], pos, label (ribbon override), clubColor, clubName,
 *   pot, role, gk
 * }
 */
function fcCardInner(card, opts) {
  opts = opts || {};
  fcEnsureDefs();
  var uid = "u" + (++fcUidSeq);
  var ovr = opts.ovr != null ? opts.ovr : Math.round(calculateOverall(card, (card && card.role) || "attacker"));
  var info = fcTierInfo(card, ovr);
  var t = opts.tier || info.t;
  var label = opts.label != null ? opts.label : (card && card.variant ? card.variant : info.label);
  var pos = opts.pos != null ? opts.pos : ((card && card.pos) || (typeof myClubFallbackPos === "function" ? myClubFallbackPos(card && card.role) : "") || "");
  var clubColor = opts.clubColor || "#168cff";
  var clubName = opts.clubName || (typeof selectedTeam !== "undefined" ? selectedTeam : "My Club");
  var isCaptain = String((card && card.tag) || "").toUpperCase() === "CAPTAIN";
  var pot = opts.pot != null ? opts.pot : (typeof myClubPlayerPotential === "function" ? myClubPlayerPotential(card) : (card && card.pot));

  var stats = opts.stats || [
    card.pace, card.shooting, card.passing, card.dribbling, card.defending, card.physical
  ];

  var look = fcLook(card, clubColor, isCaptain);
  var name = card && card.name ? card.name : "";
  var nm = String(name).toUpperCase();
  var ns = nm.length > 16 ? 21 : nm.length > 13 ? 24 : 27;

  var club = [fcInitials(clubName), clubColor, fcTrimFor(clubColor)];
  var flagSvg = fcFlagSVG(card && card.nation);
  var badgeSvg = fcBadge(club[0], club[1], club[2]);
  var emFn = FC_EM[t] || FC_EM.special;
  var decoFn = FC_DECO[t] || FC_DECO.bronze;
  var c = { t: t, r: ovr, pos: pos, name: name, nat: card && card.nation, club: club, gk: !!opts.gk, pot: pot, lg: info.lg, em: info.em };

  return '<div class="fcHolder"><div class="fcTilt"><div class="fcBody t-' + t + '" style="--fc-shape:' + FC_SHAPE_CSS + ';--ns:' + ns + ';' + (info.vars ? info.vars + ";" : "") + '">' +
    '<div class="fcFace">' +
    '<div class="fcBg"></div><div class="fcFx"></div>' +
    '<svg class="fcDeco" viewBox="0 0 ' + FC_SW + " " + FC_SH + '" aria-hidden="true">' + decoFn(c, uid) + '</svg>' +
    '<div class="fcGlow"></div><div class="fcPanel"></div>' +
    '<div class="fcPlayer">' + fcPlayerSVG(look) + '</div>' +
    '<div class="fcTag">' + fcEsc(label) + '</div>' +
    '<div class="fcRating">' + ovr + '</div><div class="fcPos">' + fcEsc(pos) + '</div><div class="fcRule1"></div>' +
    '<div class="fcFlag">' + flagSvg + '</div><div class="fcClub">' + badgeSvg + '</div>' +
    '<div class="fcEmblem">' + emFn(c, uid) + '</div>' +
    '<div class="fcName">' + fcEsc(name) + '</div><div class="fcRule2"></div>' +
    '<div class="fcStats">' + fcStatGrid(stats) + '</div>' +
    FC_FRAME + '<div class="fcGloss"></div>' +
    '</div></div></div></div>';
}

/* Inject the shared SVG filter defs once, and wire the pointer tilt. */
function fcEnsureDefs() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("fcGlobalDefs")) {
    var host = document.createElement("div");
    host.id = "fcGlobalDefs";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    host.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
      '<filter id="fcGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="fcPoster"><feComponentTransfer><feFuncR type="discrete" tableValues="0 .25 .5 .75 1"/><feFuncG type="discrete" tableValues="0 .25 .5 .75 1"/><feFuncB type="discrete" tableValues="0 .25 .5 .75 1"/></feComponentTransfer></filter>' +
      '</defs></svg>';
    document.body.appendChild(host);
  }
  fcEnsureTilt();
}
var fcTiltBound = false;
function fcEnsureTilt() {
  if (fcTiltBound || typeof document === "undefined") return;
  fcTiltBound = true;
  var calm = false;
  try { calm = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { calm = false; }
  var move = function (e) {
    var h = e.target && e.target.closest ? e.target.closest(".fcHolder") : null;
    if (!h) return;
    var r = h.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    h.classList.add("live");
    h.style.setProperty("--ry", calm ? "0deg" : ((x - .5) * 22).toFixed(1) + "deg");
    h.style.setProperty("--rx", calm ? "0deg" : ((.5 - y) * 18).toFixed(1) + "deg");
    h.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    h.style.setProperty("--my", (y * 100).toFixed(1) + "%");
  };
  var end = function (e) {
    var h = e.target && e.target.closest ? e.target.closest(".fcHolder") : null;
    if (!h) return;
    h.classList.remove("live");
    h.style.setProperty("--rx", "0deg");
    h.style.setProperty("--ry", "0deg");
  };
  document.addEventListener("pointermove", move, true);
  document.addEventListener("pointerout", end, true);
}
