/* Vantage FC - stadium.js
   Per-club stadiums.

   Every club derives a stable stadium from its name: colours, a capacity
   tier (which sets how packed the stands look), a hoarding/ad theme and a
   proper-sounding name ("<Club> Park", "The <Club> Arena"...) - all seeded by
   the club name, so the same club always plays in the same ground and no two
   clubs share a look. My Club additionally ships a small catalogue of
   upgrade stadiums the player can buy with club money.

   The module only produces DATA (colour strings, a name, a capacity tier and
   a few flags). It never touches the canvas: match.js reads the spec and
   paints the bowl. Loaded before match.js. */

(function () {
  "use strict";

  // ---- tiny seeded RNG keyed off the club name (stable across sessions) ----
  function hashName(str) {
    var h = 2166136261 >>> 0;
    str = String(str || "club").toLowerCase();
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }

  // ---- palettes ----
  // Each theme fixes the hoarding colour block + a sky tint; the stand stone
  // and crowd are then jittered so grounds still differ within a theme.
  var THEMES = [
    { key: "classic",  sky: ["#0b1220", "#17263a"], stone: ["#2b323e", "#313846"], ads: ["#c8321f", "#1f5fc8", "#e8b81f", "#1f9a5a", "#8a3fc8", "#e8701f"] },
    { key: "night",    sky: ["#080a18", "#141a33"], stone: ["#232735", "#2b3044"], ads: ["#2f6fe4", "#e63946", "#f2c21b", "#1fa65a", "#8a4fd6", "#f2812b"] },
    { key: "sunset",   sky: ["#241226", "#43203a"], stone: ["#3a2f3a", "#463742"], ads: ["#e8701f", "#f2c21b", "#c8321f", "#8a3fc8", "#1f9a5a", "#2f6fe4"] },
    { key: "royal",    sky: ["#0a0e22", "#182048"], stone: ["#2a2f52", "#333a63"], ads: ["#3d195b", "#c7b03c", "#1f4e79", "#e8e8e8", "#8a2f52", "#2f9c5d"] },
    { key: "forest",   sky: ["#0a1410", "#14261c"], stone: ["#26332b", "#2e3d33"], ads: ["#1f9a5a", "#2f9c5d", "#e8b81f", "#c8321f", "#1f5fc8", "#7a4a21"] },
    { key: "claret",   sky: ["#140a12", "#2a1422"], stone: ["#33232e", "#3d2a37"], ads: ["#7a1f2b", "#1f5fc8", "#e8e8e8", "#1f9a5a", "#f2c21b", "#c86ad9"] },
    { key: "arctic",   sky: ["#0c1620", "#1c2e3e"], stone: ["#2e3d48", "#374753"], ads: ["#1f9ac8", "#e8e8e8", "#2f6fe4", "#1fa65a", "#e8b81f", "#8a3fc8"] },
    { key: "ember",    sky: ["#180c0a", "#33180f"], stone: ["#3a2a26", "#45332e"], ads: ["#e8701f", "#c8321f", "#f2812b", "#e8b81f", "#7a4a21", "#8a3fc8"] }
  ];

  // Recognisable name shapes, chosen by seed so clubs sound like real grounds.
  var SUFFIX = [
    { fmt: "{club} Park", w: 3 },
    { fmt: "{club} Stadium", w: 2 },
    { fmt: "The {club} Arena", w: 2 },
    { fmt: "{club} Ground", w: 2 },
    { fmt: "New {club} Stadium", w: 1 },
    { fmt: "{club} Lane", w: 1 },
    { fmt: "The {club} Bowl", w: 1 }
  ];
  function groundName(club, r) {
    var total = 0, i;
    for (i = 0; i < SUFFIX.length; i++) total += SUFFIX[i].w;
    var x = r() * total;
    for (i = 0; i < SUFFIX.length; i++) { x -= SUFFIX[i].w; if (x <= 0) return SUFFIX[i].fmt.replace("{club}", club); }
    return club + " Park";
  }

  // Capacity tiers: 0 = small/village, 4 = elite fortress. Purely visual - it
  // sets how dense the crowd is and how big the bowl reads.
  function tierFor(r) { var x = r(); return x < .30 ? 0 : x < .60 ? 1 : x < .82 ? 2 : x < .95 ? 3 : 4; }
  var TIER_CAP = [12000, 24000, 40000, 60000, 82000];
  var TIER_DENSE = [.62, .74, .82, .88, .94];   // crowd fill probability

  // Deterministic, cached per club.
  var cache = Object.create(null);
  function forClub(name) {
    name = String(name || "").trim() || "Home";
    if (cache[name]) return cache[name];
    var r = rng(hashName(name));
    var theme = THEMES[hashName(name) % THEMES.length];
    var tier = tierFor(r);
    // jitter the two stone shades a touch so grounds within a theme differ
    var standA = pick(r, theme.stone), standB = pick(r, theme.stone);
    if (standA === standB) standB = theme.stone[(theme.stone.indexOf(standB) + 1) % theme.stone.length];
    var spec = {
      key: theme.key,
      club: name,
      name: groundName(name, r),
      tier: tier,
      capacity: TIER_CAP[tier],
      dense: TIER_DENSE[tier],
      sky1: theme.sky[0], sky2: theme.sky[1],
      standA: standA, standB: standB,
      hoarding: theme.stone[0],
      ads: theme.ads.slice(),
      crowd: pick(r, ["#ccd0d9", "#b9bec9", "#e2c15a", "#8fb7e6", "#e08e8e", "#9fd6a0"]),
      // grass tint pair
      grassA: pick(r, ["#348236", "#2f7d3a", "#3a8c46", "#2b7a30"]),
      grassB: pick(r, ["#3b8c3d", "#358a42", "#429a4e", "#318537"])
    };
    cache[name] = spec;
    return spec;
  }

  // ---- My Club upgrade catalogue (flat purchases) ----
  // Ordered from worst to best. `tier` drives the visuals; `price` is the flat
  // asking price in millions of pounds (£M), matching the career budget units.
  // Index 0 is the free starter ground.
  var MYCLUB = [
    { id: "rec",   name: "The Recreation Ground", club: "", price: 0,   tier: 0, theme: "classic", blurb: "A sloping village pitch with a rope for a barrier." },
    { id: "park",  name: "County Park",           club: "", price: 12,  tier: 1, theme: "forest",  blurb: "Proper terracing, a tin roof and a floodlit corner." },
    { id: "city",  name: "Riverside City Stadium", club: "", price: 45,  tier: 2, theme: "classic", blurb: "Four stands, a real away end and working floodlights." },
    { id: "grande",name: "Grande Arena",          club: "", price: 130, tier: 3, theme: "royal",   blurb: "A two-tier bowl with hospitality and a big screen." },
    { id: "elite", name: "Vantage Elite Dome",    club: "", price: 320, tier: 4, theme: "night",   blurb: "A state-of-the-art fortress fit for European nights." }
  ];
  function myClubOptions() { return MYCLUB.map(function (s) { return Object.assign({}, s); }); }
  function myClubById(id) { for (var i = 0; i < MYCLUB.length; i++) if (MYCLUB[i].id === id) return MYCLUB[i]; return null; }
  // Turn a catalogue entry into a full visual spec (same shape as forClub()).
  // `owner` (optional) is the club that plays here, kept in `.club` so callers
  // can tell whose ground it is; `.name` is always the ground's own name.
  function specFor(entry, owner) {
    if (!entry) return forClub(owner || "Home");
    if (!entry.theme) { var f = forClub(entry.name); if (owner) f.club = owner; return f; }
    var r = rng(hashName(entry.id + entry.name));
    var theme = null;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].key === entry.theme) theme = THEMES[i];
    if (!theme) theme = THEMES[0];
    var tier = entry.tier != null ? entry.tier : 0;
    var standA = theme.stone[0], standB = theme.stone[1];
    return {
      key: theme.key,
      club: owner || entry.name,
      name: entry.name,
      tier: tier,
      capacity: TIER_CAP[tier],
      dense: TIER_DENSE[tier],
      sky1: theme.sky[0], sky2: theme.sky[1],
      standA: standA, standB: standB,
      hoarding: theme.stone[0],
      ads: theme.ads.slice(),
      crowd: "#ccd0d9",
      grassA: "#348236", grassB: "#3b8c3d"
    };
  }

  window.STADIUMS = {
    forClub: forClub,
    specFor: specFor,
    myClubOptions: myClubOptions,
    myClubById: myClubById,
    tierCapacity: function (t) { return TIER_CAP[Math.max(0, Math.min(4, t | 0))]; }
  };
})();
