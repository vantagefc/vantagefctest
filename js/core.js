const canvas = document.getElementById("game"); 

const ctx = canvas.getContext("2d"); 

 

// Sky gradient + cached fill height (constant, so built once)
let SKY_GRAD = null; 
let SKY_FILL = null; 

 

// --- Performance plumbing (low-end friendly) ---
// RENDER_SCALE shrinks the canvas backing store (1 = native). Logical
// coords stay W/H, so every projection/draw is unchanged; the browser
// upscales the smaller buffer to the same visual box on weak devices.
let RENDER_SCALE = 1; 
const MIN_RENDER_SCALE = 0.45;

// The stadium bowl is nearly static: it is painted to an offscreen canvas
// and re-blitted each frame, skipping ~thousands of fill calls. The cache
// only rebuilds after the camera drifts STAD_SNAP world units.
let stadCanvas = null; 
let stadCtx = null; 
let stadCamX = null; 
let stadCamY = null; 
let stadPivot = null; 
const STAD_SNAP = 8; 

// Draw-target indirection so the stadium helpers can render into the
// offscreen cache; always SCTX = ctx during live frames.
let SCTX = ctx; 

const W = canvas.width; 

const H = canvas.height; 

 

const FIELD_SCALE = 2.0; 

const PLAYER_SPEED = 3.2; 

const HOLD_SPEED_FACTOR = 0.5; 

const RETURN_SPEED_FACTOR = 0.6; 

const OPPONENT_STAT_NERF = 0.92; 

function getOpponentNerf() { 

  const stageMultipliers = { 

    groups: 0.96, 

    league: 0.96, 

    playoff: 1.02, 

    roundOf32: 1.0, 

    roundOf16: 1.04, 

    quarterfinals: 1.08, 

    semifinals: 1.12, 

    final: 1.16 

  }; 

  return stageMultipliers[tournament.stage] ?? 0.96; 

} 

// DEFENDER_SPEED and OPPONENT_ATTACKER_SPEED were replaced by 

// computeSpeed(pace, physical) below - speed is now stat-driven. 

function computeSpeed(pace, physical) { 

  const paceFactor = pace / 70; 

  const physicalFactor = 1 + (physical - 70) / 400; 

 

  return PLAYER_SPEED * paceFactor * physicalFactor; 

} 

 

const field = {

  x: 90,

  y: 90,

  width: 3300,

  height: 1320

};

 

const goalHeight = 320; 

// Pitch geometry used by the AI, set pieces and the pitch painter, all derived
// from the field bounds instead of hard-coded old-canvas coordinates so the
// wider pitch stays internally consistent (penalty box, six-yard box, spot).
const PBOX_DEPTH = Math.round(field.width / 7);      // left/right box depth  (was 360)
const GOAL_AREA_DEPTH = Math.round(PBOX_DEPTH / 2);  // six-yard box depth    (was 180)
const PENALTY_SPOT_IN = Math.round(PBOX_DEPTH + 60); // spot sits in the box  (was 430)
const PITCH_CX = field.x + field.width / 2;          // pitch center x        (was W/2)
const PITCH_CY = field.y + field.height / 2;         // pitch center y        (was H/2) 

const goalTop = H / 2 - goalHeight / 2; 

const goalBottom = H / 2 + goalHeight / 2; 

 

const keys = {}; 

// Non-keyboard input feeds the same virtual flags that the gameplay reads.
// A gamepad (left stick / D-pad) or the mobile joystick writes into vInput,
// and moveHuman / tackle / penalty aim merge them with the keyboard flags.
let vInput = { up: false, down: false, left: false, right: false, sprint: false, lb: false, rb: false, lt: false, l3: false, rsx: 0, rsy: 0, ptLob: false };
let gamepadButtonsPrev = [];
let gpShootHeld = false;
let touchControlsBound = false;
let touchControlsShown = null;

function resetVInput() {
  vInput.up = vInput.down = vInput.left = vInput.right = vInput.sprint = false;
  vInput.ptLob = false;
}

// --- Controller (gamepad) support -----------------------------------------
// Standard mapping (Xbox/PlayStation layout):
//   Left stick / D-pad  - move            A (0)  - kick / shoot (hold)
//   X (2) - pass         B (1)  - request ball
//   Y (3) - tackle       LB (4) - switch player
//   RT trigger / RB      - sprint          Back (8) - toggle camera
//   Start (9) - pause menu                 (analog triggers also sprint)
function gpBtn(gp, i) {
  return !!(gp.buttons && gp.buttons[i] && gp.buttons[i].pressed);
}

function gpAxesOn(gp, i) {
  if (!gp.axes || gp.axes.length <= i) return 0;
  const v = gp.axes[i];
  return Math.abs(v) < 0.3 ? 0 : v;
}

function gpPauseToggle() {
  const pauseEl = document.getElementById("pauseModal");
  if (pauseEl && pauseEl.style.display === "flex") {
    resumeFromPause();
    return;
  }
  const gsEl = document.getElementById("gameScreen");
  const amEl = document.getElementById("adminModal");
  const menuVisible = document.getElementById("menu").style.display !== "none";
  if (gsEl && gsEl.style.display !== "none" && !menuVisible && (!amEl || amEl.style.display !== "flex")) {
    openPauseMenu();
  }
}

// --- Controller menu navigation -------------------------------------------
// pollGamepad() above only ever drives IN-MATCH actions (shoot, pass, tackle,
// camera, pause) and it bails out entirely unless the controls scheme is set
// to "controller". That left every menu in the game mouse/touch only: 158
// buttons and not one of them reachable with a pad, so on a TV you could start
// a match but you could not get back into My Club, open the settings or press
// Continue on the end screen.
//
// This adds the missing half: D-pad / left stick walks the visible, enabled
// controls on whatever is currently on top, A presses the focused one and B
// backs out again. It deliberately runs regardless of the active controls
// scheme (a pad should just work), but it stands down for A / B while a match
// is live, because that is when pollGamepad() owns those buttons for passing
// and tackling.
const UI_NAV_SELECTOR = 'button, [role="button"], a[href], input, select, [data-nav]';
let uiFocusables = [];
let uiFocusIndex = -1;
let uiNavActive = false;      // only paint the focus ring once the pad is used
let uiNavRepeat = 0;          // frames left before the next auto-repeat step
let uiNavHoldDelay = 26;      // frames to hold before auto-repeat kicks in
let uiNavHoldRate = 6;        // frames between auto-repeat steps
let uiNavRebuildIn = 0;       // frames until the focus list is revalidated
let uiFocusPending = null;    // element uiFocusEl() wants, once it becomes usable
let menuPadPrev = [];

// True only for something actually on screen: laid out, not hidden, not
// disabled. offsetParent is null for fixed-position elements, so a rect check
// is needed as well as the display/visibility walk.
function uiUsable(el) {
  if (!el || el.disabled) return false;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return false;
  // A control the pointer cannot reach is not a valid pad target either: this
  // skips a pack CONTINUE button that has not gone live yet, and anything still
  // sitting in an inert layer. Checked on the element alone - pointer-events is
  // inherited, so the check reads "auto" for a child that re-enables itself
  // inside a pointer-events:none parent (the 3D pack layer does exactly that).
  if (getComputedStyle(el).pointerEvents === "none") return false;
  let n = el;
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    n = n.parentElement;
  }
  return true;
}

// The topmost open overlay, or null. Focus is confined to it so the D-pad
// cannot wander onto buttons sitting behind a modal.
function uiTopOverlay() {
  // The 3D pack opener (window.Pack3D) is a full-screen layer that is not a
  // .modalOverlay and sits above every modal (z-index 99999), so while it is up
  // it owns the screen and the pad should drive its TAP TO OPEN / CONTINUE / DONE
  // controls instead of the buttons sitting behind it.
  const pk = document.querySelector(".pk3d.on");
  if (pk) {
    const rk = pk.getBoundingClientRect();
    if (rk.width > 0 && rk.height > 0) return pk;
  }
  let top = null;
  for (const el of document.querySelectorAll(".modalOverlay")) {
    if (el.style.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    top = el; // document order: the last visible overlay is the topmost
  }
  return top;
}

// Where navigation should happen: the top overlay if there is one, else the
// visible top-level screen.
function uiFocusRoot() {
  const ov = uiTopOverlay();
  if (ov) return ov;
  for (const id of ["modeSelectScreen", "menu", "myClubScreen", "gameScreen", "bracketScreen", "careerScreen", "managerScreen"]) {
    const el = document.getElementById(id);
    if (el && el.style.display !== "none" && el.getBoundingClientRect().height > 0) return el;
  }
  return document.body;
}

function uiPaintFocus() {
  for (let i = 0; i < uiFocusables.length; i++) {
    if (!uiFocusables[i].classList) continue;
    uiFocusables[i].classList.toggle("uiNavFocus", uiNavActive && i === uiFocusIndex);
  }
}

// Rebuild the walkable list, keeping the same element focused where possible.
function uiRefreshFocus() {
  const active = uiFocusables[uiFocusIndex];
  const root = uiFocusRoot();
  const list = [];
  if (root) {
    for (const el of root.querySelectorAll(UI_NAV_SELECTOR)) {
      if (uiUsable(el)) list.push(el);
    }
  }
  uiFocusables = list;
  const keep = active ? list.indexOf(active) : -1;
  uiFocusIndex = keep >= 0 ? keep : (list.length ? 0 : -1);
  if (uiFocusPending) {
    const pi = list.indexOf(uiFocusPending);
    if (pi >= 0) { uiFocusIndex = pi; uiFocusPending = null; }
    else if (!document.contains(uiFocusPending)) uiFocusPending = null; // went away
  }
  uiNavRebuildIn = 0;
  uiPaintFocus();
}

// Point the pad's focus ring at a specific control (rebuilding the list first if
// the element is new). Only does anything once the pad has actually been used
// (uiNavActive), so mouse and touch players never see the ring appear. If the
// element is not a valid target yet (e.g. a pack DONE button that only becomes
// clickable a beat after the results land) it is remembered and focused on the
// next rebuild, so timing never strands the pad on the wrong control.
function uiFocusEl(el) {
  if (!el || !uiNavActive) return false;
  let idx = uiFocusables.indexOf(el);
  if (idx < 0) { uiRefreshFocus(); idx = uiFocusables.indexOf(el); }
  if (idx < 0) { uiFocusPending = el; return false; }
  uiFocusPending = null;
  uiFocusIndex = idx;
  uiPaintFocus();
  return true;
}

// Move focus one step. Picks the nearest control that lies in the direction
// asked for, scoring the straight-line distance twice the off-axis distance so
// a control in a row with the current one always wins over a nearer one that
// is off to one side.
function uiFocusStep(dx, dy) {
  if (!uiFocusables.length) uiRefreshFocus();
  if (!uiFocusables.length) return false;
  const cur = uiFocusables[uiFocusIndex];
  if (!cur) {
    uiFocusIndex = 0;
    uiNavActive = true;
    uiPaintFocus();
    return true;
  }
  const cr = cur.getBoundingClientRect();
  const cx = cr.left + cr.width / 2;
  const cy = cr.top + cr.height / 2;
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < uiFocusables.length; i++) {
    if (i === uiFocusIndex) continue;
    const r = uiFocusables[i].getBoundingClientRect();
    const ox = r.left + r.width / 2 - cx;
    const oy = r.top + r.height / 2 - cy;
    if (dx && Math.sign(ox) !== Math.sign(dx)) continue;
    if (dy && Math.sign(oy) !== Math.sign(dy)) continue;
    const along = dx ? ox * dx : oy * dy;
    if (along <= 2) continue;
    const off = dx ? Math.abs(oy) : Math.abs(ox);
    const score = along + off * 2;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  if (best < 0) return false;
  uiFocusIndex = best;
  uiNavActive = true;
  uiPaintFocus();
  const el = uiFocusables[uiFocusIndex];
  if (el && el.scrollIntoView) {
    try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) { /* older browsers */ }
  }
  return true;
}

// A <select> is treated as an inline value cycler for a pad. There is no native
// popup we can reliably open with a synthetic click, so the pad steps through
// the options in place and fires the element's own change handler, exactly as a
// mouse pick would. Left/right (and A to advance) change the value; up/down
// still walks the focus ring to the neighbouring control.
function uiIsSelect(el) {
  return !!el && (el.tagName || "").toLowerCase() === "select";
}

function uiSelectAdjust(el, delta) {
  if (!uiIsSelect(el) || !el.options || el.options.length < 1) return false;
  const n = el.options.length;
  if (n < 2 || !delta) return true; // nothing to cycle; still claim the press
  const i = (((el.selectedIndex + delta) % n) + n) % n;
  if (i === el.selectedIndex) return true;
  el.selectedIndex = i;
  try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) { /* very old browsers */ }
  return true;
}

// Directional move that respects dropdowns: on a <select>, a horizontal push
// cycles its value; anything else moves the focus ring.
function uiNavMove(dx, dy) {
  const cur = uiFocusables[uiFocusIndex];
  if (dx && uiIsSelect(cur)) return uiSelectAdjust(cur, dx > 0 ? 1 : -1);
  return uiFocusStep(dx, dy);
}

function uiActivate() {
  const el = uiFocusables[uiFocusIndex];
  if (!el || el.disabled) return false;
  // If it's a calendar day cell, trigger click
  if (el.hasAttribute && el.hasAttribute('data-cal-day')) {
    try { el.click(); uiRefreshFocus(); return true; } catch(e){}
  }
  if (el.getAttribute && el.getAttribute('data-cal-day')) {
    try { el.click(); uiRefreshFocus(); return true; } catch(e){}
  }
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "select") {
    // A advances to the next option (wrapping) for one-button pads.
    uiSelectAdjust(el, 1);
    uiRefreshFocus();
    return true;
  }
  // Text fields want the keyboard, not a synthetic click.
  if (tag === "input" || tag === "textarea") {
    el.focus();
    if (typeof el.select === "function") el.select();
    return true;
  }
  el.click();
  uiRefreshFocus();
  return true;
}

// B: close the top overlay through its own close control where there is one.
// Deliberately does NOT hide an overlay itself - each modal's open/close pair
// also resets its state, so force-hiding one would leave it half-alive.
function uiBack() {
  const ov = uiTopOverlay();
  if (ov) {
    // 3D pack opener: once the results are on screen the DONE button goes live
    // and B dismisses the pack the same way A would; before that B is a no-op so
    // it can never skip past the TAP TO OPEN / walk-out beats by accident.
    if (ov.classList && ov.classList.contains("pk3d")) {
      const goEl = ov.querySelector("#pkGo.live");
      if (goEl && goEl.onclick) { goEl.click(); uiRefreshFocus(); return true; }
      return false;
    }
    const closer = ov.querySelector(
      '[data-close], .settingsClose, .modalClose, button[onclick*="close"], button[onclick*="Close"], button[onclick*="ancel"], button[onclick*="ancel"]'
    );
    if (closer && !closer.disabled) { closer.click(); uiRefreshFocus(); return true; }
    return false;
  }
  const gsEl = document.getElementById("gameScreen");
  const menuVisible = document.getElementById("menu");
  if (gsEl && gsEl.style.display !== "none" && (!menuVisible || menuVisible.style.display === "none")) {
    gpPauseToggle();
    return true;
  }
  return false;
}

// Per-frame pad poll for menu navigation.
function pollMenuGamepad() {
  // Cheap periodic revalidation so a modal that opened or closed since the last
  // rebuild (most of them are toggled with a bare style.display assignment) is
  // picked up without touching every open/close function.
  if (uiNavRebuildIn <= 0) {
    let stale = uiFocusables.length === 0 || uiFocusIndex >= uiFocusables.length;
    if (!stale) {
      for (let i = 0; i < uiFocusables.length; i++) {
        if (!document.contains(uiFocusables[i]) || !uiUsable(uiFocusables[i])) { stale = true; break; }
      }
    }
    if (stale) uiRefreshFocus();
    else uiNavRebuildIn = 30;
  } else {
    uiNavRebuildIn--;
  }

  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  const gp = pads && pads.length ? pads[0] : null;
  if (!gp) { menuPadPrev = []; return; }

  const now = [];
  for (let i = 0; gp.buttons && i < gp.buttons.length; i++) now.push(i === 9 ? (gpBtnsAnalog(gp, 9) > 0.5) : gpBtn(gp, i));

  // A match owns A and B for shooting and tackling, so hand over entirely.
  const live = !!matchRunning;
  if (!live) {
    let dx = 0;
    let dy = 0;
    if (gpBtn(gp, 14)) dx = -1;
    if (gpBtn(gp, 15)) dx = 1;
    if (gpBtn(gp, 12)) dy = -1;
    if (gpBtn(gp, 13)) dy = 1;
    if (!dx && !dy) {
      const ax = gpAxesOn(gp, 0);
      const ay = gpAxesOn(gp, 1);
      if (Math.abs(ax) > 0.6) dx = ax > 0 ? 1 : -1;
      else if (Math.abs(ay) > 0.6) dy = ay > 0 ? 1 : -1;
    }
    if (dx || dy) {
      if (uiNavRepeat === 0) {
        uiNavMove(dx, dy);
        uiNavRepeat = uiNavHoldDelay;
      } else if (--uiNavRepeat === 0) {
        uiNavMove(dx, dy);
        uiNavRepeat = uiNavHoldRate;
      }
    } else {
      uiNavRepeat = 0;
    }
  } else {
    uiNavRepeat = 0;
  }

  const pressed = i => now[i] && !menuPadPrev[i];
  if (pressed(0) && !live) uiActivate();          // A
  if (pressed(1) && !live) uiBack();               // B
  // Start: in the "controller" scheme pollGamepad() already toggles pause, so
  // only step in when it would otherwise be ignored.
  if (pressed(9) && currentScheme() !== "controller") gpPauseToggle();
  // Left stick click doubles as "click the focused control" so a pad without a
  // usable A button still works.
  if (pressed(10) && !live) uiActivate();
  // LB / RB swipe between tabs on the tabbed pause and settings dialogs.
  // uiTabCycle() no-ops whenever a tabbed dialog is not the top overlay, so
  // RB's in-match pass-flavour job (owned by pollGamepad) is never touched.
  if (pressed(4) || pressed(5)) {
    // Check if we're in a calendar view - if so, change month
    var mode = (typeof currentMode !== "undefined") ? currentMode : "";
    var calNav = null;
    if (mode === "playercareer") calNav = pressed(5) ? "pcCalNav(1)" : "pcCalNav(-1)";
    else if (mode === "managercareer") calNav = pressed(5) ? "mcCalNav(1)" : "mcCalNav(-1)";
    // Try to find if calendar is visible
    var cal = document.querySelector(".calHeader, .mcBlock .calGrid");
    if (calNav && cal) {
      try { eval(calNav); } catch(e) {}
    } else {
      uiTabCycle(pressed(5) ? 1 : -1);
    }
  }

  menuPadPrev = now;
}

function pollGamepad() {
  let pads = [];
  if (navigator.getGamepads) pads = navigator.getGamepads();
  const gp = pads && pads.length ? pads[0] : null;
  const padScheme = currentScheme() === "controller";
  if (padScheme) {
    if (!gp) { resetVInput(); return; }
  } else {
    // Basic controller support: a plugged-in gamepad also plays the match in
    // the PC / Mobile schemes, but only while a match is live so it never
    // competes with the pad's menu navigation.
    if (!gp || !matchRunning) return;
  }
  let ax = gpAxesOn(gp, 0);
  let ay = gpAxesOn(gp, 1);
  if (gpBtn(gp, 14)) ax = -1;
  if (gpBtn(gp, 15)) ax = 1;
  if (gpBtn(gp, 12)) ay = -1;
  if (gpBtn(gp, 13)) ay = 1;
  vInput.left = ax < 0;
  vInput.right = ax > 0;
  vInput.up = ay < 0;
  vInput.down = ay > 0;
  // RT sprints (the stick/D-pad must also be giving direction). Pads report
  // the right trigger on button 7 (analogue value), on axis 5 (the trigger's
  // range 0..1; a few DirectInput pads expose it as an inverted -1..0 axis),
  // or on both - so take the strongest signal and accept either polarity.
  const rtRaw = Math.max(gpBtnsAnalog(gp, 7), Math.abs(gpAxesOn(gp, 5)));
  vInput.sprint = rtRaw > 0.5;
  // Triggers/modifiers: LB and RB pick the pass flavour, LT sets the technical
  // shot/skill modifier, and the right stick aims both plus the dribble touch.
  vInput.lt = (gpBtnsAnalog(gp, 6) + gpAxesOn(gp, 4)) > 0.35;
  vInput.lb = gpBtn(gp, 4);
  vInput.rb = gpBtn(gp, 5);
  // L3 (left-thumbstick click) is spare on the pad; player switching now runs
  // off LB (button 4) in pollGamepad below.
  vInput.l3 = gpBtn(gp, 10);
  let rx = gpAxesOn(gp, 2);
  let ry = gpAxesOn(gp, 3);
  if (Math.abs(rx) < 0.3) rx = 0;
  if (Math.abs(ry) < 0.3) ry = 0;
  vInput.rsx = rx;
  vInput.rsy = ry;

  const shootNow = gpBtn(gp, 0);
  if (shootNow && !gpShootHeld) startChargingShot();
  if (!shootNow && gpShootHeld) releaseShot();
  gpShootHeld = shootNow;

  const prev = gamepadButtonsPrev;
  if (gpBtn(gp, 2) && !prev[2]) passBall();
  if (gpBtn(gp, 1) && !prev[1]) requestBall();
  if (gpBtn(gp, 3) && !prev[3]) tryTackle();
  // LB (left bumper) hands control to the nearest teammate. Gated on matchRunning
  // so a pause-menu tab swipe never fires a switch (openPauseMenu clears it).
  if (matchRunning && gpBtn(gp, 4) && !prev[4]) switchPlayer();
  // Start pauses. In the PC / Mobile schemes pollMenuGamepad() owns Start, so
  // only claim it here for the controller scheme to avoid toggling twice.
  if (padScheme && (gpBtnsAnalog(gp, 9) > 0.5) && !prev[9]) gpPauseToggle();
  gamepadButtonsPrev = [];
  for (let i = 0; gp.buttons && i < gp.buttons.length; i++) gamepadButtonsPrev.push(i === 9 ? (gpBtnsAnalog(gp, 9) > 0.5) : gpBtn(gp, i));
}

function gpBtnsAnalog(gp, i) {
  if (!gp.buttons || !gp.buttons[i]) return 0;
  const b = gp.buttons[i];
  return typeof b.value === "number" && b.value > 0 ? b.value : (b.pressed ? 1 : 0);
}

// Keep the on-pitch controls hint in step with a controller being plugged in
// or unplugged (updateControlsHint lives in match.js, loaded after core.js).
window.addEventListener("gamepadconnected", function () {
  if (typeof updateControlsHint === "function") updateControlsHint();
});
window.addEventListener("gamepaddisconnected", function () {
  if (typeof updateControlsHint === "function") updateControlsHint();
});

// --- Mobile (touch) controls ----------------------------------------------
function bindTouchControls() {
  if (touchControlsBound) return;
  touchControlsBound = true;
  const zone = document.getElementById("jnkZone");
  const knob = document.getElementById("jnkKnob");
  if (zone && knob) {
    const R = 66;
    let activeId = null;
    function syncKnob(cx, cy) {
      knob.style.transform = "translate(" + cx + "px," + cy + "px)";
    }
    function centerOf() {
      const r = zone.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    zone.addEventListener("pointerdown", function (e) {
      if (activeId !== null) return;
      activeId = e.pointerId;
      try { zone.setPointerCapture(activeId); } catch (err) {}
      syncKnob(0, 0);
      zone.setAttribute("data-center", "");
      e.preventDefault();
    });
    zone.addEventListener("pointermove", function (e) {
      if (activeId !== e.pointerId) return;
      const c = centerOf();
      const dx = e.clientX - c.x;
      const dy = e.clientY - c.y;
      const len = Math.hypot(dx, dy);
      const cl = Math.min(R, len);
      const sx = len ? dx / len : 0;
      const sy = len ? dy / len : 0;
      syncKnob(sx * cl, sy * cl);
      vInput.left = sx < -0.2;
      vInput.right = sx > 0.2;
      vInput.up = sy < -0.2;
      vInput.down = sy > 0.2;
      e.preventDefault();
    });
    const endJoystick = function (e) {
      if (activeId !== e.pointerId) return;
      activeId = null;
      syncKnob(0, 0);
      vInput.up = vInput.down = vInput.left = vInput.right = false;
    };
    zone.addEventListener("pointerup", endJoystick);
    zone.addEventListener("pointercancel", endJoystick);
  }
  const shootBtn = document.getElementById("psShoot") || document.getElementById("tcShoot");
  const sprintBtn = document.getElementById("psRun") || document.getElementById("tcSprint");
  if (shootBtn) {
    shootBtn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      try { shootBtn.setPointerCapture(e.pointerId); } catch (err) {}
      shootBtn.classList.add("on");
      startChargingShot();
    });
    const upShot = function () { shootBtn.classList.remove("on"); releaseShot(); };
    shootBtn.addEventListener("pointerup", upShot);
    shootBtn.addEventListener("pointercancel", upShot);
  }
  if (sprintBtn) {
    sprintBtn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      try { sprintBtn.setPointerCapture(e.pointerId); } catch (err) {}
      sprintBtn.classList.add("on");
      vInput.sprint = true;
    });
    const upRun = function () { sprintBtn.classList.remove("on"); vInput.sprint = false; };
    sprintBtn.addEventListener("pointerup", upRun);
    sprintBtn.addEventListener("pointercancel", upRun);
  }
  const tap = function (el, fn) {
    if (!el) return;
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      el.classList.add("on");
      fn();
    });
    const clear = function () { el.classList.remove("on"); };
    el.addEventListener("pointerup", clear);
    el.addEventListener("pointercancel", clear);
  };
  // Pixel Striker control set. PASS doubles as TACKLE when the human is not on
  // the ball, exactly as the reference's contextual "pass / defending: tackle".
  const passBtn = document.getElementById("psPass") || document.getElementById("tcPass");
  tap(passBtn, function () {
    if (typeof ballCarrier !== "undefined" && ballCarrier === player) passBall();
    else tryTackle();
  });
  tap(document.getElementById("psLob"), function () {
    vInput.ptLob = true;
    passBall();
    vInput.ptLob = false;
  });
  tap(document.getElementById("psSkill") || document.getElementById("tcRequest"), function () {
    if (typeof dribbleTouch === "function") dribbleTouch();
    else requestBall();
  });
  tap(document.getElementById("tcTackle"), tryTackle);
  tap(document.getElementById("tcPause"), gpPauseToggle);
  window.addEventListener("blur", resetVInput);
}

function updateMobileControlsVisibility() {
  const el = document.getElementById("touchControls");
  if (!el) return;
  const gsEl = document.getElementById("gameScreen");
  const pauseEl = document.getElementById("pauseModal");
  const penaltyEl = document.getElementById("penaltyScreen");
  const inMatchScreen = !!(gsEl && gsEl.style.display !== "none");
  const paused = !!(pauseEl && pauseEl.style.display === "flex");
  const inPenalty = !!(penaltyEl && penaltyEl.style.display !== "none");
  // The touch overlay is the Mobile control set: it only appears when the
  // player has actually chosen the Mobile (Touch) scheme in Settings.
  const wantTouch = currentScheme() === "mobile";
  const on = wantTouch && inMatchScreen && !paused && !inPenalty;
  if (on && !touchControlsBound) bindTouchControls();
  if (touchControlsShown !== on) {
    touchControlsShown = on;
    if (on) el.classList.add("on");
    else el.classList.remove("on");
  }
}

function applyControlsScheme() {
  resetVInput();
  gpShootHeld = false;
  gamepadButtonsPrev = [];
  touchControlsShown = null;
  if (currentScheme() === "mobile") bindTouchControls();
  updateMobileControlsVisibility();
  updateControlsHint();
}

function pollAlternativeInput() {
  pollGamepad();
  // Menu navigation runs on every frame regardless of the controls scheme, so
  // a pad works in the menus even when the scheme is still set to keyboard.
  pollMenuGamepad();
  updateMobileControlsVisibility();
  // Cutscene skip: watch the pad and keep the SKIP button in step (skip.js).
  if (window.psSkip) { try { window.psSkip.pollPad(); window.psSkip.refresh(); } catch (e) { } }
} 

 

let selectedTeam = null; 

let playerName = "YOU"; 

const MAX_ENERGY = 100; 

// Stamina is charged once per simulated frame (~60/s). Sprinting burns it and
// standing still refills it, so the drain has to be gentle enough for a burst
// to be worth committing to: 0.55/frame is ~3s of flat-out sprint from full,
// and the slower regen stops it being spammed by tapping the key.
const ENERGY_DRAIN_RATE = 0.55; 

const ENERGY_REGEN_RATE = 0.32; 

// player energy / shot charge live on each player object (see createPlayer)

let blueScore = 0; 

let redScore = 0; 

let matchTime = 0;

// --- Dynamic weather -------------------------------------------------------
// The weather is a pure function of a match-clock counter, so both lockstep
// peers, the replay and every later session see exactly the same sky. The
// counter ticks inside netAdvanceClockSecond, which is driven by the sim in
// online play and by the timer in solo - the same function in both.
//
// Weather particles are the one deliberately LOCAL piece of state: they are
// drawn from their own PRNG (vrnd), never netRand, because burning simulation
// randomness for decoration would desync the match.
const WEATHER_GRIP = { clear: 1, overcast: 0.97, fog: 0.95, rain: 0.92, storm: 0.88, snow: 0.86 };
// [frames into the match, weather from here on] - a full 180-frame match.
const WEATHER_SCRIPT = [
  [0, "clear"], [18, "overcast"], [34, "rain"], [50, "storm"],
  [66, "fog"], [84, "clear"], [100, "rain"], [118, "storm"],
  [134, "snow"], [150, "overcast"], [168, "clear"],
];
let weatherClock = 0;
let weatherState = "clear";
let weatherPrev = "clear";
let weatherFade = 1;
// Local-only particle pool + PRNG.
let weatherDrops = [];
let weatherSeed = 0x9e3779b9;
let weatherFlash = 0;
function vrnd() {
  weatherSeed = (Math.imul(weatherSeed, 1664525) + 1013904223) >>> 0;
  return weatherSeed / 4294967296;
}
function weatherGrip() {
  return WEATHER_GRIP[weatherState] !== undefined ? WEATHER_GRIP[weatherState] : 1;
}
function weatherAt(t) {
  let w = "clear";
  for (let i = 0; i < WEATHER_SCRIPT.length; i++) {
    if (t >= WEATHER_SCRIPT[i][0]) w = WEATHER_SCRIPT[i][1];
  }
  return w;
}
// Called once per simulated second. Deterministic: no randomness here.
function advanceWeather() {
  weatherClock++;
  const w = weatherAt(weatherClock);
  if (w !== weatherState) {
    weatherPrev = weatherState;
    weatherState = w;
    weatherFade = 0;
  }
}
function seedWeatherDrops() {
  weatherDrops = [];
  for (let i = 0; i < 260; i++) {
    weatherDrops.push({ x: vrnd(), y: vrnd(), s: 0.45 + vrnd() * 0.9, d: vrnd() });
  }
}
seedWeatherDrops();

let stoppageMins = 0;
 

let goalLog = []; 

let cardLog = []; 

let endScreenNext = null; 

let endScreenTeamNames = null; 

// Final match statistics captured from the Pixel Striker engine when a match
// ends, so the post-match summary can show possession/shots/etc. even after the
// engine has moved on. Shape: { stats, cardCount, penalty } (see buildEndStatsHTML).
let matchStatsSnapshot = null; 

let matchPhase = "normal";

let clockHalf = 1;

let breakPhase = null; 

let matchRunning = false; 

let awaitingStart = false; 

let pausedForBracket = false; 

let matchPaused = false; 

let subsUsedThisMatch = 0; 

const MAX_MATCH_SUBS = 5; 

// Substitutions requested from the pause menu wait here and are only carried
// out when play next stops (a free kick, card, penalty, throw in, goal kick or
// corner), so a change never teleports a player while the ball is live.
let pendingSubs = []; 

let postGoalPause = 0; 

let countdownSeconds = 0; 

// 5-second "KICKOFF IN" countdown before the match starts (both gamemodes):
// kickoffIntro holds the remaining frames (0 = no intro pending).
let kickoffIntro = 0; 

// The Walkout cinematic plays first (the tunnel, the teams walking out, the
// anthems, the coin toss and the line-ups), then the Crowd Cam's KICK OFF scene
// runs its 5-second countdown. KICKOFF_INTRO_WAIT is the total, so every mode
// that already waits for it now gets the full walkout + countdown for free.
const WALKOUT_INTRO_WAIT = 1692; // ~28.2 seconds at 60fps (the Walkout)
const KICKOFF_INTRO_WAIT = WALKOUT_INTRO_WAIT + 300; // Walkout, then the Crowd Cam

// The broadcast intro runs 6.8s, which is longer than the old 5s countdown, so
// the whistle used to land in the middle of its last shot and the scene was cut
// off. The cutscene now holds the kickoff for as long as it is on screen, and
// this is the short beat left between its final shot and the whistle (also used
// when the player skips it, so a skip drops straight into play).
const CUTSCENE_KICKOFF_LEAD = 45;

// Goal sequence: a short replay of the goal, a celebration from the
// scoring team, then the normal 3-2-1 countdown before play resumes.
let goalPhase = ""; 

let goalReplay = []; 

let goalReplayIndex = 0; 

let replayHold = 0; 

let celebrateTeam = "blue"; 

let celebrateFrames = 0; 

let goalMoment = null; 

// Offside cutscene: an offside "goal" replays like a real goal (same slow-mo
// replay machinery) so the viewer sees exactly why the flag went up, then the
// referee awards the defending side its indirect free kick.
let offsideReplay = null; 

let celebrationSpot = { x: field.x + field.width / 2, y: field.y + field.height / 2 }; 

let replayBuffer = []; 

const REPLAY_BUFFER_MAX = 360; 

const REPLAY_WINDOW = 150; 

const REPLAY_SLOWMO = 2; 

const CELEBRATE_FRAMES_TOTAL = 180; 

let timerInterval; 

 

const GROUPS = [ 

  { name: "L", teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Villarreal", "Real Betis", "Paris Saint-Germain", "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "VfB Stuttgart", "Inter Milan", "Napoli", "Manchester City", "Arsenal", "Liverpool", "Manchester United", "Aston Villa", "AS Roma", "Como", "Porto", "Sporting CP", "PSV Eindhoven", "Feyenoord", "Club Brugge", "Lille", "RC Lens", "Galatasaray", "Fenerbahce", "Shakhtar Donetsk", "Slavia Prague", "Slovan Bratislava", "Bodo/Glimt", "Viking", "AEK Athens", "LASK", "Sabah FC"] } 

]; 

 

const teams = GROUPS.flatMap(g => g.teams); 

 

const teamColors = {
 "Real Madrid": "#F5C518",
 "Barcelona": "#004D98",
 "Atletico Madrid": "#CB3524",
 "Villarreal": "#FFD700",
 "Real Betis": "#00954C",
 "Paris Saint-Germain": "#004170",
 "Bayern Munich": "#DC052D",
 "Borussia Dortmund": "#FDE100",
 "RB Leipzig": "#DD0741",
 "VfB Stuttgart": "#E32219",
 "Inter Milan": "#0056A4",
 "Napoli": "#12A0D7",
 "Manchester City": "#6CABDD",
 "Arsenal": "#EF0107",
 "Liverpool": "#C8102E",
 "Manchester United": "#DA291C",
 "Aston Villa": "#670E36",
 "AS Roma": "#8E1F2F",
 "Como": "#0071BC",
 "Porto": "#00428C",
 "Sporting CP": "#00672F",
 "PSV Eindhoven": "#ED1C24",
 "Feyenoord": "#C8102E",
 "Club Brugge": "#0053A0",
 "Lille": "#DB2226",
 "RC Lens": "#9B1F29",
 "Galatasaray": "#A32638",
 "Fenerbahce": "#0B0D66",
 "Shakhtar Donetsk": "#F58220",
 "Slavia Prague": "#CD0A12",
 "Slovan Bratislava": "#003B89",
 "Bodo/Glimt": "#FFD100",
 "Viking": "#004B93",
 "AEK Athens": "#FFDC2D",
 "LASK": "#000000",
 "Sabah FC": "#A41E35",

};const FIFA_RANKINGS = {
 "Real Madrid": 1,
 "Barcelona": 8,
 "Atletico Madrid": 9,
 "Villarreal": 22,
 "Real Betis": 21,
 "Paris Saint-Germain": 4,
 "Bayern Munich": 3,
 "Borussia Dortmund": 10,
 "RB Leipzig": 20,
 "VfB Stuttgart": 30,
 "Inter Milan": 6,
 "Napoli": 19,
 "Manchester City": 2,
 "Arsenal": 7,
 "Liverpool": 5,
 "Manchester United": 13,
 "Aston Villa": 14,
 "AS Roma": 11,
 "Como": 34,
 "Porto": 15,
 "Sporting CP": 12,
 "PSV Eindhoven": 17,
 "Feyenoord": 18,
 "Club Brugge": 16,
 "Lille": 23,
 "RC Lens": 24,
 "Galatasaray": 25,
 "Fenerbahce": 26,
 "Shakhtar Donetsk": 27,
 "Slavia Prague": 28,
 "Slovan Bratislava": 32,
 "Bodo/Glimt": 29,
 "Viking": 35,
 "AEK Athens": 31,
 "LASK": 33,
 "Sabah FC": 36,

};const KNOCKOUT_ROUNDS = [ 

  "playoff", 

  "roundOf16", 

  "quarterfinals", 

  "semifinals", 

  "final" 

]; 

const KNOCKOUT_TITLES = { 

  playoff: "Play-off", 

  roundOf16: "Round of 16", 

  quarterfinals: "Quarter-finals", 

  semifinals: "Semi-finals", 

  final: "Final" 

}; 

const KNOCKOUT_TWOLEG = { 

  playoff: true, 

  roundOf16: true, 

  quarterfinals: true, 

  semifinals: true, 

  final: false 

}; 

 

const tournament = { 

  stage: "league", 

  groups: [], 

  knockout: [], 

  roundOf32: [], 

  roundOf16: [], 

  quarterfinals: [], 

  semifinals: [], 

  final: [], 

  champion: null 

}; 

 

let eliminated = false; 

 

document.addEventListener("keydown", event => { 

  const menuVisible = document.getElementById("menu").style.display !== "none"; 

  const myClubSetupOpen = document.getElementById("myClubSetupModal").style.display === "flex"; 

  const tag = event.target.tagName; 

  if ((menuVisible || myClubSetupOpen) && (tag === "INPUT" || tag === "TEXTAREA")) return; 

  if (event.key === "Escape" && !event.repeat) {

    const pauseEl = document.getElementById("pauseModal");

    if (pauseEl && pauseEl.style.display === "flex") {

      resumeFromPause();

      return;

    }

    if (!menuVisible && !myClubSetupOpen && tag !== "INPUT" && tag !== "TEXTAREA") {

      const gsEl = document.getElementById("gameScreen");

      const amEl = document.getElementById("adminModal");

      if (gsEl && gsEl.style.display !== "none" && (!amEl || amEl.style.display !== "flex")) {

        openPauseMenu();

        return;

      }

    }

  }

  keys[event.key.toLowerCase()] = true; 

 

  if (event.code === "Space") { 

    event.preventDefault(); 

 

    if (!event.repeat) { 

      startChargingShot(); 

    } 

  } 

 

if (event.key.toLowerCase() === "b" && !event.repeat) {

    passBall();

  }

  if (event.key.toLowerCase() === "e" && !event.repeat) {

    requestBall();

  }

  if (event.key.toLowerCase() === "v" && !event.repeat) {

    tryTackle();

  }

  if (event.key.toLowerCase() === "z" && !event.repeat) {

    nudgeBall();

  }

  if (event.key.toLowerCase() === "x" && !event.repeat) {

    dribbleTouch();

  }

  if (event.key.toLowerCase() === "f" && !event.repeat) {

    switchPlayer();

  }

  // The arcade match view is always the fixed top-down camera now; the old C
  // key camera-cycle has been removed.

  if (event.key.toLowerCase() === "m" && !event.repeat) {

    if (!menuVisible && tag !== "INPUT" && tag !== "TEXTAREA") {

      toggleCrowdMute();

    }

  }

  if (event.key.toLowerCase() === "p" && !event.repeat) {

    if (!menuVisible && SETTINGS.adminMode && tag !== "INPUT" && tag !== "TEXTAREA") {

      const adminEl = document.getElementById("adminModal");

      if (adminEl) {

        if (adminEl.style.display === "flex") closeAdminPanel();

        else openAdminPanel();

      }

    }

  }

}); 

 

document.addEventListener("keyup", event => { 

  keys[event.key.toLowerCase()] = false; 

 

  if (event.code === "Space") { 

    releaseShot(); 

  } 

}); 

 

function createPlayer(x, y, color, team, role = "field", name = "") { 

  const speed = PLAYER_SPEED; 

 

  let radius = 18; 

 

if (role === "goalkeeper") {

    radius = 16;

  }

 

  const fallbackName = 

    role.charAt(0).toUpperCase() + role.slice(1); 

 

  return { 

    x, 

    y, 

    startX: x, 

    startY: y, 

    color, 

    team, 

    role, 

    name: name || fallbackName, 

    // Human-control state lives on the player, not in module-level globals:
    // a 1v1 online match drives two human players at once, and lockstep
    // replicates the whole player object to the other client for free.
    human: false, 

    // Whether this human's shoot button is currently held from the replicated
    // input frame of their LAST turn. Per-human so charging/release edges fire
    // exactly once each for both players in a lockstep match; a shared global
    // cannot survive the turn-by-turn rebinding.
    shootHeld: false, 

    energy: MAX_ENERGY, 

    charging: false, 

    chargeFrames: 0, 

    radius, 

    speed, 

    cooldown: 0, 

    indicatorText: "", 

    indicatorFrames: 0, 

    cards: 0, 

    sentOff: false, 

    pace: 70, 

    shooting: 70, 

    passing: 70, 

    dribbling: 70, 

    defending: 70, 

    physical: 70, 

    overall: 70 

  }; 

} 

 

// Fill these in with whatever names/stats you like, per team. Leave 

// a name blank to fall back to a generic label like "Defender". Each 

// team has its own 11-player roster, so the names/stats shown change 

// depending on who you're playing as or against. 

 

function makePlayerData(name, stats = {}) { 

  return { 

    name, 

    pace: stats.pace ?? 70, 

    shooting: stats.shooting ?? 70, 

    passing: stats.passing ?? 70, 

    dribbling: stats.dribbling ?? 70, 

    defending: stats.defending ?? 70, 

    physical: stats.physical ?? 70 

  }; 

} 

 

const OVERALL_WEIGHTS = { 

  attacker: { 

    pace: 0.25, shooting: 0.3, passing: 0.1, 

    dribbling: 0.25, defending: 0.05, physical: 0.05 

  }, 

  midfielder: { 

    pace: 0.15, shooting: 0.1, passing: 0.3, 

    dribbling: 0.25, defending: 0.15, physical: 0.05 

  }, 

  defender: { 

    pace: 0.15, shooting: 0.05, passing: 0.15, 

    dribbling: 0.05, defending: 0.35, physical: 0.25 

  }, 

  goalkeeper: { 

    pace: 0.1, shooting: 0, passing: 0.2, 

    dribbling: 0, defending: 0.4, physical: 0.3 

  } 

}; 

 

function calculateOverall(statBlock, role) { 

  const weights = OVERALL_WEIGHTS[role] || OVERALL_WEIGHTS.midfielder; 

 

  const overall = 

    statBlock.pace * weights.pace + 

    statBlock.shooting * weights.shooting + 

    statBlock.passing * weights.passing + 

    statBlock.dribbling * weights.dribbling + 

    statBlock.defending * weights.defending + 

    statBlock.physical * weights.physical; 

 

  return Math.round(overall); 

} 

 

function makeRatedPlayer(name, ovr, role = "attacker") { 

  if (!OVERALL_WEIGHTS[role]) role = "attacker"; 

  const o = Math.max(40, Math.min(99, ovr)); 

  const s = { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 }; 

  if (role === "goalkeeper") { 

    s.pace = o - 16; s.shooting = Math.max(10, o - 52); s.passing = o - 2; 

    s.dribbling = Math.max(10, o - 46); s.defending = o + 8; s.physical = o - 4; 

  } else if (role === "defender") { 

    s.pace = o + 1; s.shooting = Math.max(14, o - 12); s.passing = o + 2; 

    s.dribbling = Math.max(18, o - 8); s.defending = o + 8; s.physical = o - 9; 

  } else if (role === "midfielder") { 

    s.pace = o + 1; s.shooting = Math.max(20, o - 6); s.passing = o + 4; 

    s.dribbling = o + 2; s.defending = Math.max(24, o - 12); s.physical = o + 11; 

  } else { 

    s.pace = o + 3; s.shooting = o + 4; s.passing = o; 

    s.dribbling = o + 5; s.defending = Math.max(18, o - 42); s.physical = o - 24; 

  } 

  for (const k in s) s[k] = Math.max(1, Math.min(99, s[k])); 

  const w = OVERALL_WEIGHTS[role]; 

  const statKeys = ["pace","shooting","passing","dribbling","defending","physical"]; 

  const weightedSum = function () { 

    return s.pace*w.pace + s.shooting*w.shooting + s.passing*w.passing + 

      s.dribbling*w.dribbling + s.defending*w.defending + s.physical*w.physical; 

  }; 

  statKeys.sort((a, b) => w[b] - w[a]); 

  const top = statKeys[0]; 

  s[top] = Math.max(1, Math.min(99, s[top] + Math.round(ovr - weightedSum()))); 

  // Nudging the single top stat is not enough when it is already maxed at
  // 99 (high-OVR cards): spill the remaining gap into the next-highest-
  // weighted stats so the printed OVR actually rounds to the request.
  let deficit = ovr - weightedSum(); 

  for (const k of statKeys) { 

    if (deficit < 0.5) break; 

    const room = 99 - s[k]; 

    if (room <= 0) continue; 

    s[k] += Math.min(room, Math.ceil(deficit / w[k])); 

    deficit = ovr - weightedSum(); 

  } 

  return makePlayerData(name, s); 

} 

 

const TEAM_ROSTERS = {};

for (const team of teams) {

  TEAM_ROSTERS[team] = {

    defenders: [

      makePlayerData(""), makePlayerData(""),

      makePlayerData(""), makePlayerData("")

    ],

    midfielders: [makePlayerData(""), makePlayerData(""), makePlayerData("")],

    attackers: [makePlayerData(""), makePlayerData(""), makePlayerData("")],

    goalkeeper: makePlayerData("", { pace: 60, shooting: 20, passing: 70, dribbling: 35, defending: 90, physical: 85 })

  };

}

// Club squads: EA FC 26 base card overalls, current XIs (Sept 2026).
// makeRatedPlayer derives a role-appropriate stat profile matching the base OVR.

TEAM_ROSTERS["Real Madrid"] = {

  defenders: [
    makeRatedPlayer("Carvajal", 83, "defender"), //RB
    makeRatedPlayer("Militao", 84, "defender"), //CB
    makeRatedPlayer("Rudiger", 86, "defender"), //CB
    makeRatedPlayer("Cucurella", 83, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Tchouameni", 84, "midfielder"), //CDM
    makeRatedPlayer("Valverde", 89, "midfielder"), //CM
    makeRatedPlayer("Bellingham", 90, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Brahim Diaz", 82, "attacker"), //RW
    makeRatedPlayer("Mbappe", 91, "attacker"), //ST
    makeRatedPlayer("Vinicius Jr", 89, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Courtois", 89, "goalkeeper") //GK

};

TEAM_ROSTERS["Barcelona"] = {

  defenders: [
    makeRatedPlayer("Kounde", 87, "defender"), //RB
    makeRatedPlayer("Cubarsi", 82, "defender"), //CB
    makeRatedPlayer("Christensen", 80, "defender"), //CB
    makeRatedPlayer("Balde", 83, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Rodri", 90, "midfielder"), //CDM
    makeRatedPlayer("Pedri", 89, "midfielder"), //CM
    makeRatedPlayer("Dani Olmo", 85, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Lamine Yamal", 89, "attacker"), //RW
    makeRatedPlayer("Adeyemi", 84, "attacker"), //ST
    makeRatedPlayer("Raphinha", 89, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Joan Garcia", 83, "goalkeeper") //GK

};

TEAM_ROSTERS["Atletico Madrid"] = {

  defenders: [
    makeRatedPlayer("Marcos Llorente", 85, "defender"), //RB
    makeRatedPlayer("Cristian Romero", 85, "defender"), //CB
    makeRatedPlayer("Hancko", 83, "defender"), //CB
    makeRatedPlayer("Grimaldo", 85, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Hjulmand", 83, "midfielder"), //CDM
    makeRatedPlayer("Pablo Barrios", 83, "midfielder"), //CM
    makeRatedPlayer("Kang-in Lee", 83, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Lookman", 84, "attacker"), //RW
    makeRatedPlayer("Julian Alvarez", 87, "attacker"), //ST
    makeRatedPlayer("Baena", 83, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Oblak", 88, "goalkeeper") //GK

};

TEAM_ROSTERS["Villarreal"] = {

  defenders: [
    makeRatedPlayer("Foyth", 79, "defender"), //RB
    makeRatedPlayer("Logan Costa", 80, "defender"), //CB
    makeRatedPlayer("Mateo Mourino", 78, "defender"), //CB
    makeRatedPlayer("Juan Cardona", 79, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Idrissa Gueye", 80, "midfielder"), //CDM
    makeRatedPlayer("Comesana", 80, "midfielder"), //CM
    makeRatedPlayer("Moleiro", 80, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Nicolas Pepe", 81, "attacker"), //RW
    makeRatedPlayer("Mikautadze", 82, "attacker"), //ST
    makeRatedPlayer("Gerard Moreno", 82, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Luiz Junior", 77, "goalkeeper") //GK

};

TEAM_ROSTERS["Real Betis"] = {

  defenders: [
    makeRatedPlayer("Bellerin", 79, "defender"), //RB
    makeRatedPlayer("Marcelo Llorente", 82, "defender"), //CB
    makeRatedPlayer("Natan", 80, "defender"), //CB
    makeRatedPlayer("Fran Bernal", 78, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Marc Roca", 80, "midfielder"), //CDM
    makeRatedPlayer("Fornals", 82, "midfielder"), //CM
    makeRatedPlayer("Isco", 84, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Antony", 82, "attacker"), //RW
    makeRatedPlayer("Cucho Hernandez", 82, "attacker"), //ST
    makeRatedPlayer("Ez Abde", 81, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Valles", 79, "goalkeeper") //GK

};

TEAM_ROSTERS["Paris Saint-Germain"] = {

  defenders: [
    makeRatedPlayer("Hakimi", 89, "defender"), //RB
    makeRatedPlayer("Marquinhos", 87, "defender"), //CB
    makeRatedPlayer("Pacho", 86, "defender"), //CB
    makeRatedPlayer("Nuno Mendes", 86, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Joao Neves", 85, "midfielder"), //CM
    makeRatedPlayer("Vitinha", 89, "midfielder"), //CM
    makeRatedPlayer("Fabian Ruiz", 84, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Kvaratskhelia", 87, "attacker"), //RW
    makeRatedPlayer("Ferran Torres", 83, "attacker"), //ST
    makeRatedPlayer("Dembele", 90, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Chevalier", 83, "goalkeeper") //GK

};

TEAM_ROSTERS["Bayern Munich"] = {

  defenders: [
    makeRatedPlayer("Laimer", 85, "defender"), //RB
    makeRatedPlayer("Upamecano", 87, "defender"), //CB
    makeRatedPlayer("Kim Min-jae", 83, "defender"), //CB
    makeRatedPlayer("Davies", 82, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Kimmich", 89, "midfielder"), //CDM
    makeRatedPlayer("Pavlovic", 83, "midfielder"), //CM
    makeRatedPlayer("Musiala", 88, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Olise", 86, "attacker"), //RW
    makeRatedPlayer("Kane", 89, "attacker"), //ST
    makeRatedPlayer("Luis Diaz", 88, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Neuer", 81, "goalkeeper") //GK

};

TEAM_ROSTERS["Borussia Dortmund"] = {

  defenders: [
    makeRatedPlayer("Ryerson", 82, "defender"), //RB
    makeRatedPlayer("Anton", 84, "defender"), //CB
    makeRatedPlayer("Svensson", 77, "defender"), //CB
    makeRatedPlayer("Gadou", 66, "defender"), //CB
  ],

  midfielders: [
    makeRatedPlayer("Nmecha", 85, "midfielder"), //CDM
    makeRatedPlayer("Veerman", 79, "midfielder"), //CM
    makeRatedPlayer("Sabitzer", 81, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Beier", 81, "attacker"), //RW
    makeRatedPlayer("Guirassy", 87, "attacker"), //ST
    makeRatedPlayer("Karetsas", 70, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Kobel", 86, "goalkeeper") //GK

};

TEAM_ROSTERS["RB Leipzig"] = {

  defenders: [
    makeRatedPlayer("Baku", 79, "defender"), //RB
    makeRatedPlayer("Orban", 83, "defender"), //CB
    makeRatedPlayer("Lukeba", 81, "defender"), //CB
    makeRatedPlayer("Raum", 83, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Seiwald", 81, "midfielder"), //CDM
    makeRatedPlayer("El Aynaoui", 77, "midfielder"), //CM
    makeRatedPlayer("Banzuzi", 73, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Bakayoko", 78, "attacker"), //RW
    makeRatedPlayer("Nkunku", 81, "attacker"), //ST
    makeRatedPlayer("Nusa", 78, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Vandevoordt", 76, "goalkeeper") //GK

};

TEAM_ROSTERS["VfB Stuttgart"] = {

  defenders: [
    makeRatedPlayer("Leweling", 75, "defender"), //RB
    makeRatedPlayer("Jeltsch", 72, "defender"), //CB
    makeRatedPlayer("Chabot", 78, "defender"), //CB
    makeRatedPlayer("Mittelstadt", 82, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Promel", 75, "midfielder"), //CM
    makeRatedPlayer("Stiller", 83, "midfielder"), //CDM
    makeRatedPlayer("El Khannouss", 78, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Fuhrich", 77, "attacker"), //LW
    makeRatedPlayer("Undav", 80, "attacker"), //ST
    makeRatedPlayer("Demirovic", 80, "attacker"), //ST
  ],

  goalkeeper: makeRatedPlayer("Bredlow", 71, "goalkeeper") //GK

};

TEAM_ROSTERS["Inter Milan"] = {

  defenders: [
    makeRatedPlayer("Pavard", 80, "defender"), //CB
    makeRatedPlayer("Bisseck", 76, "defender"), //CB
    makeRatedPlayer("Bastoni", 87, "defender"), //CB
    makeRatedPlayer("Carlos Augusto", 80, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Barella", 87, "midfielder"), //CM
    makeRatedPlayer("Calhanoglu", 86, "midfielder"), //CDM
    makeRatedPlayer("Jones", 80, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Diouf", 75, "attacker"), //RW
    makeRatedPlayer("Thuram", 85, "attacker"), //ST
    makeRatedPlayer("Lautaro Martinez", 88, "attacker"), //ST
  ],

  goalkeeper: makeRatedPlayer("Josep Martinez", 75, "goalkeeper") //GK

};

TEAM_ROSTERS["Napoli"] = {

  defenders: [
    makeRatedPlayer("Di Lorenzo", 82, "defender"), //RB
    makeRatedPlayer("Rrahmani", 83, "defender"), //CB
    makeRatedPlayer("Rafa Marin", 76, "defender"), //CB
    makeRatedPlayer("Olivera", 77, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Lobotka", 83, "midfielder"), //CM
    makeRatedPlayer("De Bruyne", 87, "midfielder"), //CAM
    makeRatedPlayer("Gilmour", 75, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Politano", 80, "attacker"), //RW
    makeRatedPlayer("Hojlund", 78, "attacker"), //ST
    makeRatedPlayer("Alisson Santos", 74, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Meret", 81, "goalkeeper") //GK

};

TEAM_ROSTERS["Manchester City"] = {

  defenders: [
    makeRatedPlayer("Khusanov", 82, "defender"), //RB
    makeRatedPlayer("Guehi", 85, "defender"), //CB
    makeRatedPlayer("Gvardiol", 85, "defender"), //CB
    makeRatedPlayer("Nunes", 83, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Anderson", 84, "midfielder"), //CDM
    makeRatedPlayer("O'Reilly", 83, "midfielder"), //CM
    makeRatedPlayer("Foden", 84, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Semenyo", 85, "attacker"), //RW
    makeRatedPlayer("Haaland", 90, "attacker"), //ST
    makeRatedPlayer("Cherki", 86, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Donnarumma", 89, "goalkeeper") //GK

};

TEAM_ROSTERS["Arsenal"] = {

  defenders: [
    makeRatedPlayer("Ben White", 83, "defender"), //RB
    makeRatedPlayer("Gabriel", 88, "defender"), //CB
    makeRatedPlayer("Konsa", 84, "defender"), //CB
    makeRatedPlayer("Calafiori", 82, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Rice", 87, "midfielder"), //CDM
    makeRatedPlayer("Lewis-Skelly", 78, "midfielder"), //CM
    makeRatedPlayer("Odegaard", 87, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Saka", 88, "attacker"), //RW
    makeRatedPlayer("Havertz", 82, "attacker"), //ST
    makeRatedPlayer("Tzolis", 82, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Raya", 87, "goalkeeper") //GK

};

TEAM_ROSTERS["Liverpool"] = {

  defenders: [
    makeRatedPlayer("Frimpong", 82, "defender"), //RB
    makeRatedPlayer("Van Dijk", 90, "defender"), //CB
    makeRatedPlayer("Jacquet", 77, "defender"), //CB
    makeRatedPlayer("Kerkez", 81, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Gravenberch", 85, "midfielder"), //CDM
    makeRatedPlayer("Szoboszlai", 86, "midfielder"), //CM
    makeRatedPlayer("Wirtz", 89, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Barcola", 84, "attacker"), //RW
    makeRatedPlayer("Isak", 88, "attacker"), //ST
    makeRatedPlayer("Mac Allister", 87, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Alisson", 89, "goalkeeper") //GK

};

TEAM_ROSTERS["Manchester United"] = {

  defenders: [
    makeRatedPlayer("Dalot", 79, "defender"), //RB
    makeRatedPlayer("Maguire", 80, "defender"), //CB
    makeRatedPlayer("Lisandro Martinez", 81, "defender"), //CB
    makeRatedPlayer("Shaw", 79, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Tielemans", 85, "midfielder"), //CM
    makeRatedPlayer("Mainoo", 81, "midfielder"), //CM
    makeRatedPlayer("Bruno Fernandes", 87, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Mbeumo", 85, "attacker"), //RW
    makeRatedPlayer("Cunha", 83, "attacker"), //ST
    makeRatedPlayer("Rashford", 80, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Lammens", 78, "goalkeeper") //GK

};

TEAM_ROSTERS["Aston Villa"] = {

  defenders: [
    makeRatedPlayer("Cash", 81, "defender"), //RB
    makeRatedPlayer("Mings", 78, "defender"), //CB
    makeRatedPlayer("Pau Torres", 80, "defender"), //CB
    makeRatedPlayer("Maatsen", 79, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Kamara", 84, "midfielder"), //CDM
    makeRatedPlayer("McGinn", 81, "midfielder"), //CM
    makeRatedPlayer("Buendia", 78, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Rogers", 84, "attacker"), //RW
    makeRatedPlayer("Watkins", 82, "attacker"), //ST
    makeRatedPlayer("Jackson", 80, "attacker"), //ST
  ],

  goalkeeper: makeRatedPlayer("Suzuki", 74, "goalkeeper") //GK

};

TEAM_ROSTERS["AS Roma"] = {

  defenders: [
    makeRatedPlayer("Mancini", 83, "defender"), //CB
    makeRatedPlayer("Ndicka", 81, "defender"), //CB
    makeRatedPlayer("Hermoso", 80, "defender"), //CB
    makeRatedPlayer("Wesley", 77, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Cristante", 80, "midfielder"), //CDM
    makeRatedPlayer("Kone", 79, "midfielder"), //CM
    makeRatedPlayer("Molina", 77, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Soule", 78, "attacker"), //RW
    makeRatedPlayer("Dybala", 86, "attacker"), //ST
    makeRatedPlayer("Malen", 80, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Svilar", 82, "goalkeeper") //GK

};

TEAM_ROSTERS["Como"] = {

  defenders: [
    makeRatedPlayer("Yan Couto", 77, "defender"), //RB
    makeRatedPlayer("Chalobah", 79, "defender"), //CB
    makeRatedPlayer("Jacobo Ramon", 71, "defender"), //CB
    makeRatedPlayer("Alex Valle", 72, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Perrone", 73, "midfielder"), //CDM
    makeRatedPlayer("Caqueret", 77, "midfielder"), //CM
    makeRatedPlayer("Baturina", 78, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Assane Diao", 76, "attacker"), //RW
    makeRatedPlayer("Douvikas", 77, "attacker"), //ST
    makeRatedPlayer("Nico Paz", 79, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Butez", 76, "goalkeeper") //GK

};

TEAM_ROSTERS["Porto"] = {

  defenders: [
    makeRatedPlayer("Alberto Costa", 76, "defender"), //RB
    makeRatedPlayer("Nehuen Perez", 76, "defender"), //CB
    makeRatedPlayer("Kiwior", 77, "defender"), //CB
    makeRatedPlayer("Martim Fernandes", 75, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Pablo Rosario", 78, "midfielder"), //CDM
    makeRatedPlayer("Alan Varela", 79, "midfielder"), //CDM
    makeRatedPlayer("Gabri Veiga", 76, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Pepe", 78, "attacker"), //RW
    makeRatedPlayer("Andre Silva", 76, "attacker"), //ST
    makeRatedPlayer("William Gomes", 68, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Diogo Costa", 84, "goalkeeper") //GK

};

TEAM_ROSTERS["Sporting CP"] = {

  defenders: [
    makeRatedPlayer("Fresneda", 76, "defender"), //RB
    makeRatedPlayer("Debast", 78, "defender"), //CB
    makeRatedPlayer("Inacio", 80, "defender"), //CB
    makeRatedPlayer("Maxi Araujo", 81, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Hjulmand", 83, "midfielder"), //CDM
    makeRatedPlayer("Bragranca", 78, "midfielder"), //CM
    makeRatedPlayer("Pedro Goncalves", 83, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Trincao", 82, "attacker"), //RW
    makeRatedPlayer("Gyokeres", 87, "attacker"), //ST
    makeRatedPlayer("Catamo", 79, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Rui Silva", 81, "goalkeeper") //GK

};

TEAM_ROSTERS["PSV Eindhoven"] = {

  defenders: [
    makeRatedPlayer("Sergino Dest", 79, "defender"), //RB
    makeRatedPlayer("Geertruida", 78, "defender"), //CB
    makeRatedPlayer("Obispo", 73, "defender"), //CB
    makeRatedPlayer("Mauro Junior", 79, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Kodai Sano", 70, "midfielder"), //CDM
    makeRatedPlayer("Noah Fernandez", 61, "midfielder"), //CDM
    makeRatedPlayer("Guus Til", 77, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Ruben van Bommel", 74, "attacker"), //RW
    makeRatedPlayer("Pepi", 76, "attacker"), //ST
    makeRatedPlayer("Perisic", 81, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Kovar", 75, "goalkeeper") //GK

};

TEAM_ROSTERS["Feyenoord"] = {

  defenders: [
    makeRatedPlayer("Givairo Read", 75, "defender"), //RB
    makeRatedPlayer("Watanabe", 75, "defender"), //CB
    makeRatedPlayer("St Juste", 76, "defender"), //CB
    makeRatedPlayer("David Marmol", 70, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Targhalline", 73, "midfielder"), //CM
    makeRatedPlayer("Zechiel", 64, "midfielder"), //CM
    makeRatedPlayer("Vanhoutte", 70, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Diarra", 72, "attacker"), //RW
    makeRatedPlayer("Reko Ferri", 68, "attacker"), //ST
    makeRatedPlayer("Valente", 72, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Ernst", 69, "goalkeeper") //GK

};

TEAM_ROSTERS["Club Brugge"] = {

  defenders: [
    makeRatedPlayer("Sabbe", 70, "defender"), //RB
    makeRatedPlayer("Han-beom Lee", 70, "defender"), //CB
    makeRatedPlayer("Mechele", 76, "defender"), //CB
    makeRatedPlayer("Seys", 72, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Potts", 70, "midfielder"), //CDM
    makeRatedPlayer("Vanaken", 80, "midfielder"), //CM
    makeRatedPlayer("Vetlesen", 72, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Forbs", 70, "attacker"), //RW
    makeRatedPlayer("Tresoldi", 69, "attacker"), //ST
    makeRatedPlayer("Virgili", 70, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Sommer", 87, "goalkeeper") //GK

};

TEAM_ROSTERS["Lille"] = {

  defenders: [
    makeRatedPlayer("Tiago Santos", 76, "defender"), //RB
    makeRatedPlayer("Nathan Ngoy", 74, "defender"), //CB
    makeRatedPlayer("Alexsandro", 79, "defender"), //CB
    makeRatedPlayer("Perraud", 76, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Benjamin Andre", 80, "midfielder"), //CDM
    makeRatedPlayer("Bentaleb", 77, "midfielder"), //CM
    makeRatedPlayer("Haraldsson", 78, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Gaetan Perrin", 77, "attacker"), //RW
    makeRatedPlayer("Giroud", 78, "attacker"), //ST
    makeRatedPlayer("Ayase Ueda", 78, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Berke Ozer", 78, "goalkeeper") //GK

};

TEAM_ROSTERS["RC Lens"] = {

  defenders: [
    makeRatedPlayer("Saud Abdulhamid", 77, "defender"), //RB
    makeRatedPlayer("Gradit", 77, "defender"), //CB
    makeRatedPlayer("Samson Baidoo", 75, "defender"), //CB
    makeRatedPlayer("Udol", 78, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Mamadou Sangare", 78, "midfielder"), //CDM
    makeRatedPlayer("Haidara", 78, "midfielder"), //CM
    makeRatedPlayer("Thomasson", 77, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Thauvin", 82, "attacker"), //RW
    makeRatedPlayer("Sotoca", 76, "attacker"), //ST
    makeRatedPlayer("Odsonne Edouard", 78, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Robin Risser", 75, "goalkeeper") //GK

};

TEAM_ROSTERS["Galatasaray"] = {

  defenders: [
    makeRatedPlayer("Singo", 80, "defender"), //RB
    makeRatedPlayer("Davinson Sanchez", 82, "defender"), //CB
    makeRatedPlayer("Bardakci", 80, "defender"), //CB
    makeRatedPlayer("Ismail Jakobs", 75, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Torreira", 83, "midfielder"), //CDM
    makeRatedPlayer("Gabriel Sara", 80, "midfielder"), //CM
    makeRatedPlayer("Mario Lemina", 79, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Sallai", 78, "attacker"), //RW
    makeRatedPlayer("Osimhen", 87, "attacker"), //ST
    makeRatedPlayer("Yunus Akgun", 78, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Ugurcan Cakir", 80, "goalkeeper") //GK

};

TEAM_ROSTERS["Fenerbahce"] = {

  defenders: [
    makeRatedPlayer("Nelson Semedo", 78, "defender"), //RB
    makeRatedPlayer("Skriniar", 81, "defender"), //CB
    makeRatedPlayer("Nathan Ake", 80, "defender"), //CB
    makeRatedPlayer("Archie Brown", 73, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Kante", 84, "midfielder"), //CDM
    makeRatedPlayer("Guendouzi", 82, "midfielder"), //CM
    makeRatedPlayer("Marco Asensio", 82, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Greenwood", 83, "attacker"), //RW
    makeRatedPlayer("Lukaku", 84, "attacker"), //ST
    makeRatedPlayer("Kerem Akturkoglu", 79, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Ederson", 83, "goalkeeper") //GK

};

TEAM_ROSTERS["Shakhtar Donetsk"] = {

  defenders: [
    makeRatedPlayer("Vinicius Tobias", 71, "defender"), //RB
    makeRatedPlayer("Bondar", 75, "defender"), //CB
    makeRatedPlayer("Matviienko", 77, "defender"), //CB
    makeRatedPlayer("Pedro Henrique", 72, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Marlon Gomes", 74, "midfielder"), //CDM
    makeRatedPlayer("Nazaryna", 74, "midfielder"), //CM
    makeRatedPlayer("Pedrinho", 74, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Eguinaldo", 72, "attacker"), //RW
    makeRatedPlayer("Lassina Traore", 75, "attacker"), //ST
    makeRatedPlayer("Kaua Elias", 73, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Riznyk", 74, "goalkeeper") //GK

};

TEAM_ROSTERS["Slavia Prague"] = {

  defenders: [
    makeRatedPlayer("Vlcek", 73, "defender"), //RB
    makeRatedPlayer("Holes", 76, "defender"), //CB
    makeRatedPlayer("N'Guessan", 72, "defender"), //CB
    makeRatedPlayer("Tomic", 73, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Sadilek", 76, "midfielder"), //CDM
    makeRatedPlayer("Provod", 78, "midfielder"), //CM
    makeRatedPlayer("Wiktor Nowak", 72, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Sturm", 72, "attacker"), //RW
    makeRatedPlayer("Chytil", 74, "attacker"), //ST
    makeRatedPlayer("Kusej", 74, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Stanek", 76, "goalkeeper") //GK

};

TEAM_ROSTERS["Slovan Bratislava"] = {

  defenders: [
    makeRatedPlayer("Blackman", 62, "defender"), //RB
    makeRatedPlayer("Bajric", 66, "defender"), //CB
    makeRatedPlayer("Svetozar Markovic", 64, "defender"), //CB
    makeRatedPlayer("Sandro Cruz", 66, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Cristian Martinez", 66, "midfielder"), //CDM
    makeRatedPlayer("Pokorny", 66, "midfielder"), //CM
    makeRatedPlayer("Rahim Ibrahim", 70, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Barseghyan", 72, "attacker"), //RW
    makeRatedPlayer("Sporar", 76, "attacker"), //ST
    makeRatedPlayer("Suleiman Camara", 70, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Dominik Takac", 66, "goalkeeper") //GK

};

TEAM_ROSTERS["Bodo/Glimt"] = {

  defenders: [
    makeRatedPlayer("Sjovold", 66, "defender"), //RB
    makeRatedPlayer("Villads Nielsen", 66, "defender"), //CB
    makeRatedPlayer("Bjortuft", 70, "defender"), //CB
    makeRatedPlayer("Bjorkan", 74, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Patrick Berg", 77, "midfielder"), //CDM
    makeRatedPlayer("Auklend", 66, "midfielder"), //CM
    makeRatedPlayer("Brunstad Fet", 70, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Blomberg", 69, "attacker"), //RW
    makeRatedPlayer("Helmersen", 66, "attacker"), //ST
    makeRatedPlayer("Jens Petter Hauge", 74, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Haikin", 74, "goalkeeper") //GK

};

TEAM_ROSTERS["Viking"] = {

  defenders: [
    makeRatedPlayer("Stensness", 68, "defender"), //CB
    makeRatedPlayer("Heggeheim", 64, "defender"), //CB
    makeRatedPlayer("Daland", 70, "defender"), //CB
    makeRatedPlayer("Kristoffer Haugen", 64, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Joe Bell", 68, "midfielder"), //CM
    makeRatedPlayer("Askildsen", 68, "midfielder"), //CM
    makeRatedPlayer("Tobias Moi", 68, "midfielder"), //CAM
  ],

  attackers: [
    makeRatedPlayer("Bjordal", 68, "attacker"), //RW
    makeRatedPlayer("Christiansen", 68, "attacker"), //ST
    makeRatedPlayer("Zlatko Tripic", 76, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Arild Ostbo", 64, "goalkeeper") //GK

};

TEAM_ROSTERS["AEK Athens"] = {

  defenders: [
    makeRatedPlayer("Rota", 66, "defender"), //RB
    makeRatedPlayer("Moukoudi", 72, "defender"), //CB
    makeRatedPlayer("Filipe Relvas", 65, "defender"), //CB
    makeRatedPlayer("Pilios", 66, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Razvan Marin", 74, "midfielder"), //CM
    makeRatedPlayer("Majer", 78, "midfielder"), //CAM
    makeRatedPlayer("Vitalis", 68, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Koita", 70, "attacker"), //RW
    makeRatedPlayer("Barnabas Varga", 74, "attacker"), //ST
    makeRatedPlayer("Luka Jovic", 76, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Brignoli", 62, "goalkeeper") //GK

};

TEAM_ROSTERS["LASK"] = {

  defenders: [
    makeRatedPlayer("Kasper Jorgensen", 66, "defender"), //RB
    makeRatedPlayer("Andres Andrade", 66, "defender"), //CB
    makeRatedPlayer("Mbuyamba", 66, "defender"), //CB
    makeRatedPlayer("George Bello", 68, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Melayro Bogarde", 68, "midfielder"), //CDM
    makeRatedPlayer("Sascha Horvath", 68, "midfielder"), //CM
    makeRatedPlayer("Ljubicic", 73, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Christoph Lang", 68, "attacker"), //RW
    makeRatedPlayer("Moses Usor", 69, "attacker"), //ST
    makeRatedPlayer("Samuel Adeniran", 66, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Jungwirth", 62, "goalkeeper") //GK

};

TEAM_ROSTERS["Sabah FC"] = {

  defenders: [
    makeRatedPlayer("Solvet", 66, "defender"), //RB
    makeRatedPlayer("Dashdamirov", 63, "defender"), //CB
    makeRatedPlayer("Puchacz", 68, "defender"), //CB
    makeRatedPlayer("Zedadka", 65, "defender"), //LB
  ],

  midfielders: [
    makeRatedPlayer("Rakhmonaliev", 65, "midfielder"), //CDM
    makeRatedPlayer("Lepinjica", 68, "midfielder"), //CM
    makeRatedPlayer("Aleksey Isaev", 64, "midfielder"), //CM
  ],

  attackers: [
    makeRatedPlayer("Veljko Simic", 66, "attacker"), //RW
    makeRatedPlayer("Joy-Lance Mickels", 70, "attacker"), //ST
    makeRatedPlayer("Nwachukwu", 63, "attacker"), //LW
  ],

  goalkeeper: makeRatedPlayer("Pokatilov", 65, "goalkeeper") //GK

};

/* ---------------------------------------------------- squad depth ----------
   Every club carries more than the eleven who start: a match-day bench and a
   set of reserves. These are real squad members the match engine can call on
   (cover for a suspension or injury) and that careers draw on for signings and
   sales. They are generated from the club's own starters so a side that is
   strong in one position is deep there too, with ratings stepping gently down
   from the first team. A club-seeded RNG keeps the same names every session. */
const DEPTH_FIRST = ["Luca","Marco","Jonas","Rico","Enzo","Felix","Mateo","Karim","Owen","Diego","Leo","Noah","Arne","Rafael","Caleb","Sven","Tomas","Yuri","Amadou","Kenji","Pablo","Ivan","Lars","Bruno","Nico","Emre","Andre","Saul","Milos","Hugo","Dean","Oskar","Ali","Kofi","Jorge","Rui"];
const DEPTH_LAST = ["Berger","Moretti","Kramer","Silva","Novak","Costa","Hansen","Petrov","Ferreira","Lindberg","Rossi","Sousa","Weber","Cabrera","Dias","Kovac","Andersen","Mendes","Tanaka","Okafor","Sorensen","Vega","Nilsen","Bauer","Duarte","Kaur","Larsen","Pires","Reyes","Bakker","Ivanov","Yilmaz","Traore","Nakamura","Romero","Fischer"];

/* A deterministic per-club generator so a club's bench/reserves are stable. */
function clubDepthRng(club) {
  let seed = 2166136261;
  const s = String(club || "");
  for (let i = 0; i < s.length; i++) { seed ^= s.charCodeAt(i); seed = Math.imul(seed, 16777619); }
  return function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

/* Build a bench of 7 and a reserve list of 7 from a club's starting XI. */
function makeSquadDepth(roster, club) {
  const rnd = clubDepthRng(club);
  const pick = arr => arr[Math.floor(rnd() * arr.length) % arr.length];
  const usedNames = {};
  const name = () => {
    let n = pick(DEPTH_FIRST) + " " + pick(DEPTH_LAST);
    let guard = 0;
    while (usedNames[n] && guard++ < 30) n = pick(DEPTH_FIRST) + " " + pick(DEPTH_LAST);
    usedNames[n] = 1;
    return n;
  };
  // Work out a base rating per role from the starters that fill it.
  const baseFor = role => {
    const list = role === "goalkeeper" ? [roster.goalkeeper]
      : role === "defender" ? (roster.defenders || [])
      : role === "midfielder" ? (roster.midfielders || [])
      : (roster.attackers || []);
    let sum = 0, n = 0;
    for (const p of list) { if (p) { sum += calculateOverall(p, role); n++; } }
    return n ? sum / n : 68;
  };
  const mk = (role, drop) => {
    const ovr = Math.max(48, Math.min(90, Math.round(baseFor(role) - drop + (rnd() * 6 - 3))));
    const p = makeRatedPlayer(name(), ovr, role);
    p.role = role;
    return p;
  };
  // Match-day bench: cover in every position, closest to the first team.
  const bench = [
    mk("goalkeeper", 4),
    mk("defender", 2), mk("defender", 5),
    mk("midfielder", 2), mk("midfielder", 5),
    mk("attacker", 2), mk("attacker", 5)
  ];
  // Reserves: younger depth, a wider step down from the XI.
  const reserves = [
    mk("goalkeeper", 9),
    mk("defender", 8), mk("defender", 11), mk("defender", 14),
    mk("midfielder", 8), mk("midfielder", 12),
    mk("attacker", 9)
  ];
  // A career that hands the club a name for these needs no external list.
  return { bench: bench, reserves: reserves };
}

for (const team of teams) {
  const r = TEAM_ROSTERS[team];
  if (!r) continue;
  const depth = makeSquadDepth(r, team);
  r.bench = depth.bench;
  r.reserves = depth.reserves;
}

const MYCLUB_LEAGUES = [
  { short: "PL", name: "Premier League", color: "#3D195B", country: "England", tier: 1,
    clubs: ["Manchester City","Arsenal","Liverpool","Manchester United","Aston Villa",
      "Tottenham Hotspur","Chelsea","Newcastle United","Brighton","West Ham United","Brentford",
      "Fulham","Nottingham Forest","Crystal Palace","Everton","Wolverhampton Wanderers",
      "AFC Bournemouth","Leicester City","Burnley","Ipswich Town"],
    cup: "FA Cup", super: "Community Shield", clSlots: 4 },
  { short: "CH", name: "EFL Championship", color: "#1F4E79", country: "England", tier: 2,
    clubs: ["Leeds United","Southampton","West Bromwich Albion","Sunderland AFC","Norwich City",
      "Middlesbrough","Coventry City","Sheffield Wednesday","Watford FC","Bristol City",
      "Preston North End","Hull City","Queens Park Rangers","Swansea City","Blackburn Rovers",
      "Stoke City","Millwall FC","Plymouth Argyle","Cardiff City","Luton Town"],
    cup: "FA Cup", super: "Community Shield", clSlots: 0 },
  { short: "L1", name: "EFL League One", color: "#2F9C5D", country: "England", tier: 3,
    clubs: ["Wrexham AFC","Birmingham City","Wycombe Wanderers","Bolton Wanderers","Derby County",
      "Barnsley FC","Charlton Athletic","Huddersfield Town","Reading FC","Peterborough United",
      "Oxford United","Portsmouth FC","Blackpool FC","Shrewsbury Town","Stevenage FC",
      "Lincoln City","Exeter City","Cambridge United","Burton Albion","Northampton Town"],
    cup: "FA Cup", super: "Community Shield", clSlots: 0 },
  { short: "LA", name: "La Liga", color: "#C7B03C", country: "Spain", tier: 1,
    clubs: ["Real Madrid","Barcelona","Atletico Madrid","Villarreal","Real Betis",
      "Sevilla","Real Sociedad","Athletic Club","Valencia","Getafe","Celta Vigo","Osasuna",
      "Mallorca","Girona","Rayo Vallecano","Alaves","Espanyol","Leganes","Valladolid","Las Palmas"],
    cup: "Copa del Rey", super: "Supercopa de Espana", clSlots: 4 },
  { short: "SD", name: "Segunda División", color: "#8A6E2F", country: "Spain", tier: 2,
    clubs: ["Real Zaragoza","Real Oviedo","Sporting Gijon","Real Sporting","Deportivo La Coruna",
      "Real Murcia","CD Tenerife","Racing Santander","CD Mirandes","Albacete Balompie",
      "Granada CF","Levante UD","Elche CF","Real Valladolid B","Burgos CF","Eibar",
      "Huesca","Cordoba CF","Malaga CF","FC Cartagena"],
    cup: "Copa del Rey", super: "Supercopa de Espana", clSlots: 0 },
  { short: "BL", name: "Bundesliga", color: "#D20515", country: "Germany", tier: 1,
    clubs: ["Bayern Munich","Borussia Dortmund","RB Leipzig","VfB Stuttgart",
      "Bayer Leverkusen","Eintracht Frankfurt","VfL Wolfsburg","Borussia Monchengladbach",
      "SC Freiburg","TSG Hoffenheim","Mainz 05","FC Augsburg","Werder Bremen","Union Berlin",
      "VfL Bochum","Heidenheim","FC St. Pauli","Holstein Kiel"],
    cup: "DFB-Pokal", super: "DFL-Supercup", clSlots: 4 },
  { short: "B2", name: "2. Bundesliga", color: "#8C1515", country: "Germany", tier: 2,
    clubs: ["Hamburger SV","FC Koln","Fortuna Dusseldorf","1. FC Kaiserslautern","Hannover 96",
      "1. FC Nurnberg","SV Darmstadt 98","Karlsruher SC","SC Paderborn 07","SpVgg Greuther Furth",
      "Hertha BSC","1. FC Magdeburg","Eintracht Braunschweig","SSV Ulm 1846","Jahn Regensburg",
      "SV Elversberg","Preussen Munster","Schalke 04"],
    cup: "DFB-Pokal", super: "DFL-Supercup", clSlots: 0 },
  { short: "SA", name: "Serie A", color: "#009246", country: "Italy", tier: 1,
    clubs: ["Inter Milan","Napoli","AS Roma","Como","AC Milan","Juventus","Atalanta","Lazio",
      "Fiorentina","Torino","Bologna","Udinese","Genoa","Cagliari","Hellas Verona","Lecce",
      "Empoli","Parma","Monza","Venezia"],
    cup: "Coppa Italia", super: "Supercoppa Italiana", clSlots: 4 },
  { short: "SB", name: "Serie B", color: "#006837", country: "Italy", tier: 2,
    clubs: ["Sassuolo","US Cremonese","Pisa SC","Brescia Calcio","Sampdoria","Palermo FC",
      "Modena FC","SSC Bari","Catanzaro","Spezia Calcio","Frosinone Calcio","Reggina 1914",
      "Ascoli Calcio","Ternana Calcio","Perugia Calcio","Cosenza Calcio","SPAL","Benevento Calcio",
      "Calcio Lecco 1912","Sudtirol"],
    cup: "Coppa Italia", super: "Supercoppa Italiana", clSlots: 0 },
  { short: "SC", name: "Serie C", color: "#004D26", country: "Italy", tier: 3,
    clubs: ["Virtus Entella","Cesena FC","Padova","Vicenza","Carrarese","Juventus Next Gen",
      "Atalanta U23","Pescara Calcio","Avellino","Audace Cerignola","Monterosi Tuscia",
      "Potenza Calcio","Feralpisalo","Triestina","Gubbio","Rimini FC","Ancona-Matelica",
      "Lucchese","Pineto","Sorrento"],
    cup: "Coppa Italia", super: "Supercoppa Italiana", clSlots: 0 },
  { short: "LI", name: "Ligue 1", color: "#27406B", country: "France", tier: 1,
    clubs: ["Paris Saint-Germain","Lille","RC Lens","Olympique Marseille","AS Monaco",
      "Olympique Lyonnais","OGC Nice","Stade Rennais","FC Nantes","Stade de Reims",
      "RC Strasbourg","Toulouse FC","Montpellier HSC","Stade Brestois","Le Havre AC",
      "AJ Auxerre","Angers SCO","AS Saint-Etienne"],
    cup: "Coupe de France", super: "Trophee des Champions", clSlots: 3 },
  { short: "L2", name: "Ligue 2", color: "#1B2F4A", country: "France", tier: 2,
    clubs: ["FC Metz","FC Lorient","AS Nancy Lorraine","Paris FC","Rodez AF",
      "EA Guingamp","Stade Lavallois","AC Ajaccio","Amiens SC","SM Caen",
      "USL Dunkerque","Pau FC","Red Star FC","FC Annecy","Grenoble Foot 38",
      "SC Bastia","US Quevilly-Rouen","Valenciennes FC"],
    cup: "Coupe de France", super: "Trophee des Champions", clSlots: 0 }
];

/* ------------------------------------------------------ saved-games list ----
   Shared "pick a save" screen used by Custom Tournament, Player Career and
   Manager Career so each of them can hold several save slots side by side.
   Callers pass in ready-made rows (badge / name / meta + resume + delete
   handlers) and the new / back actions; this just lays them out. */
function sgInitials(name) {
  const w = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return w[0].slice(0, 2).toUpperCase();
}
function sgWhen(ts) {
  const d = new Date(Number(ts) || 0);
  if (isNaN(d.getTime()) || !ts) return "";
  try { return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  catch (e) { return ""; }
}
function sgRowHTML(it) {
  return '<div class="sgRow">' +
    '<div class="sgInfo">' +
      '<div class="sgBadge">' + escapeHtml(String(it.badge || "?")) + '</div>' +
      '<div class="sgText">' +
        '<div class="sgName">' + escapeHtml(String(it.name || "")) + '</div>' +
        '<div class="sgMeta">' + escapeHtml(String(it.meta || "")) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="sgActions">' +
      '<button class="wcPrimaryBtn" onclick="' + it.resume + '">Continue</button>' +
      '<button class="wcGhostBtn sgDelBtn" onclick="' + it.del + '">Delete</button>' +
    '</div>' +
  '</div>';
}
function sgPickerHTML(cfg) {
  const items = (cfg.items || []).map(sgRowHTML).join("");
  const body = items || '<div class="sgEmpty">' + escapeHtml(String(cfg.emptyText || "No saved games yet.")) + '</div>';
  return '<div class="wcSetup sgPicker">' +
    '<div class="sgList">' + body + '</div>' +
    '<div class="wcSetupActions sgNewActions">' +
      '<button class="wcPrimaryBtn" onclick="' + cfg.newAction + '">' + escapeHtml(String(cfg.newLabel || "New")) + '</button>' +
      '<button class="wcGhostBtn" onclick="' + cfg.backAction + '">Back</button>' +
    '</div>' +
  '</div>';
}
