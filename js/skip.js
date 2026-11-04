/* ==========================================================================
   Vantage FC - skip.js
   --------------------------------------------------------------------------
   One place to skip every cutscene.

   A cutscene registers itself here with an "active" test and a "skip" action.
   This module then watches for a skip input from any of the three schemes the
   game supports and runs the skip for whichever scene is on top:

     - Keyboard : Enter / Space / Escape
     - Gamepad  : any face or shoulder button, Start, Back or a trigger
     - Touch    : tap the on-screen SKIP button, or tap the pitch itself

   While a scene is playing a small SKIP button is shown so the control is
   discoverable, mirroring the boot screen's "press any key to skip" hint.

   The scenes are registered from the modules that own them (match.js for the
   on-pitch cutscenes, trophylift.js for the trophy lift), so this file has no
   knowledge of how any particular cutscene works - it just asks each one
   whether it is on screen and calls its skip().
   ========================================================================== */
(function () {
  "use strict";

  const scenes = [];

  function register(def) {
    if (!def || typeof def.skip !== "function") return;
    unregister(def.id);
    scenes.push(def);
  }
  function unregister(id) {
    for (let i = scenes.length - 1; i >= 0; i--) if (scenes[i].id === id) scenes.splice(i, 1);
  }
  function topScene() {
    for (let i = scenes.length - 1; i >= 0; i--) {
      const s = scenes[i];
      try { if (s.active && s.active()) return s; } catch (e) { }
    }
    return null;
  }
  function anyActive() { return !!topScene(); }
  function skip() {
    const s = topScene();
    if (!s) return false;
    try { s.skip(); } catch (e) { return false; }
    refreshHint();
    return true;
  }

  /* ---- the SKIP button ------------------------------------------------- */
  let hintEl = null, hintShown = null;
  function ensureHint() {
    if (hintEl && document.contains(hintEl)) return hintEl;
    const gs = document.getElementById("gameScreen");
    if (!gs) return null;
    hintEl = document.createElement("button");
    hintEl.id = "skipHint";
    hintEl.type = "button";
    hintEl.tabIndex = -1;
    hintEl.setAttribute("aria-label", "Skip cutscene");
    hintEl.innerHTML = '<span class="skipHintText">SKIP</span><span class="skipHintArrow">&#9654;&#9654;</span>';
    hintEl.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      skip();
    });
    gs.appendChild(hintEl);
    return hintEl;
  }
  function refreshHint() {
    const el = ensureHint();
    if (!el) return;
    const gs = document.getElementById("gameScreen");
    const visible = !!(gs && gs.style.display !== "none" && gs.getBoundingClientRect().height > 0);
    const on = visible && anyActive();
    if (on !== hintShown) {
      hintShown = on;
      el.classList.toggle("on", on);
    }
  }

  /* ---- keyboard -------------------------------------------------------- */
  function isSkipKey(e) {
    return e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Escape" ||
      e.key === " " || e.key === "Spacebar" || e.key === "Enter" || e.key === "Escape";
  }
  window.addEventListener("keydown", function (e) {
    if (e.repeat) return;
    if (!anyActive()) return;
    if (!isSkipKey(e)) return;
    e.preventDefault();
    e.stopPropagation();
    skip();
  }, true);

  /* ---- pointer / touch ------------------------------------------------- */
  // A tap on the pitch skips, except on real controls (the touch overlay, the
  // pause / penalty / trophy buttons) which keep their normal job.
  document.addEventListener("pointerdown", function (e) {
    if (!anyActive()) return;
    const gs = document.getElementById("gameScreen");
    if (!gs || gs.style.display === "none") return;
    const t = e.target;
    if (hintEl && (t === hintEl || hintEl.contains(t))) return;   // the button skips itself
    if (t && t.closest && t.closest("button, a, input, select, #touchControls, #penaltyScreen, #trophyContinue")) return;
    if (!gs.contains(t)) return;
    skip();
  }, true);

  /* ---- gamepad --------------------------------------------------------- */
  // Polled from the game loop every frame (core.js pollAlternativeInput). The
  // previous-button state is tracked even while nothing is playing, so a button
  // held down as a cutscene starts does not instantly skip it.
  let padPrev = [];
  // Hysteresis latch for the analog triggers (LT / RT). A worn Xbox trigger can
  // rest right on the old >0.5 cut-off and flicker between frames, which used to
  // look like a fresh button press dozens of times a second and skip the walkout
  // before the player ever touched anything. Reading the analog value with a
  // wide dead-zone (press past 0.75, release below 0.25) keeps a drifting
  // trigger quiet while a real pull still reads instantly.
  let trigLatch = [];
  function padPressed(i, b) {
    if (!b) return false;
    if (b.pressed) return true;                       // digital press is authoritative
    if (typeof b.value !== "number") return false;
    const on = trigLatch[i] ? b.value > 0.25 : b.value > 0.75;
    trigLatch[i] = on;
    return on;
  }
  function pollPad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const gp = pads && pads.length ? pads[0] : null;
    if (!gp) { padPrev = []; trigLatch = []; return; }
    const active = anyActive();
    const buttons = gp.buttons || [];
    let edge = false;
    const now = [];
    for (let i = 0; i < buttons.length; i++) {
      const p = padPressed(i, buttons[i]);
      now.push(p);
      // Button 9 (Start / Options) is the pause control - never let a skip
      // swallow it, so pausing always reaches the pause menu.
      if (active && p && !padPrev[i] && i !== 9) edge = true;
    }
    padPrev = now;
    if (edge) skip();
  }

  window.psSkip = {
    register: register,
    unregister: unregister,
    skip: skip,
    active: anyActive,
    refresh: refreshHint,
    pollPad: pollPad
  };
})();
