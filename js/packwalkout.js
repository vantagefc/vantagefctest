/* ==========================================================================
   Vantage FC - packwalkout.js
   --------------------------------------------------------------------------
   The My Club pack walkout cinematic, ported from
   "Pixel Striker FC - Walkout.html".

   It is a pure 2D pixel-art renderer that draws a 480x270 tunnel -> corridor
   -> room -> hero sequence onto the canvas handed to createPixWalkout().
   The game keeps ownership of the card itself: the existing FC card DOM is
   revealed on top of this scene when the hero shot arrives, so the card
   design never changes.

   Public API (window.createPixWalkout):
     var w = createPixWalkout(canvas);
     w.start(data, onHero)   data = { kit, skin, hair, nation, typeLabel,
                                      typeColor, posLabel, club, name, panels }
     w.stop()
   ========================================================================== */
(function () {
  "use strict";

  function createPixWalkout(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = 480, H = 270, TAU = Math.PI * 2;
    const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
    const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
    const ez = u => u * u * (3 - 2 * u);
    const lerp = (a, b, u) => a + (b - a) * u;
    function rng(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

    /* ---------------- pixel font ---------------- */
    const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '-': '000000111000000', "'": '010010000000000', '#': '101111101111101', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ':': '000010000010000', '%': '101001010100101', '+': '000010111010000', '/': '001001010100100' };
    function txt(g, str, x, y, col, s, al, sh) {
      str = String(str);
      if (str.normalize) str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      str = str.toUpperCase().replace(/&/g, '+').replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, '-').replace(/\u00d7/g, 'X');
      const w = str.length * 4 * s - s;
      x = Math.round(al === 'c' ? x - w / 2 : al === 'r' ? x - w : x); y = Math.round(y);
      const passes = sh ? [[sh, s], [col, 0]] : [[col, 0]];
      for (const p of passes) {
        g.fillStyle = p[0]; g.beginPath();
        for (let i = 0; i < str.length; i++) {
          const gl = F[str[i]]; if (!gl) continue;
          for (let k = 0; k < 15; k++) if (gl[k] === '1') g.rect(x + p[1] + i * 4 * s + (k % 3) * s, y + p[1] + ((k / 3) | 0) * s, s, s);
        }
        g.fill();
      }
    }

    /* ---------------- sprite factory ---------------- */
    function mk(rows, pal) {
      const h = rows.length, w = rows[0].length, Wd = w + 2, Hd = h + 2, c = document.createElement('canvas'); c.width = Wd; c.height = Hd;
      const g = c.getContext('2d');
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = rows[y][x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x + 1, y + 1, 1, 1); } }
      const im = g.getImageData(0, 0, Wd, Hd), d = im.data, so = new Uint8Array(Wd * Hd);
      for (let i = 0; i < Wd * Hd; i++) so[i] = d[i * 4 + 3] > 0 ? 1 : 0;
      for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) {
        const i = y * Wd + x; if (so[i]) continue;
        if ((x > 0 && so[i - 1]) || (x < Wd - 1 && so[i + 1]) || (y > 0 && so[i - Wd]) || (y < Hd - 1 && so[i + Wd])) {
          d[i * 4] = 18; d[i * 4 + 1] = 14; d[i * 4 + 2] = 24; d[i * 4 + 3] = 255;
        }
      }
      g.putImageData(im, 0, 0); return c;
    }

    /* ---------------- player art ---------------- */
    const BD = ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '..ssss..', '.kkkkkk.', 'skkkkkks', 'skkkkkks', '.kkkkkk.', '.pppppp.'];
    const BS = ['..hhhh..', '.hhhhhh.', '.hhhsss.', '.hhhsse.', '..hsss..', '.kkkkkk.', '.kkkkks.', '.kkkkks.', '.kkkkkk.', '.pppppp.'];
    const LS = { 0: ['..pppp..', '..oooo..', '..oooo..', '..bbbbb.'], 1: ['..pppp..', '.oo..oo.', '.oo..oo.', '.bbb.bbb'], 3: ['..pppp..', '..oo.oo.', '..oo.oo.', '..bbbbbb'] };
    const pad = (a, n) => a.map(s => '.'.repeat(n) + s + '.'.repeat(n));
    const legsFB = fr => { const n = ['p', 'o', 'o', 'b'], l = ['p', 'o', 'b', '.'], r = []; for (let i = 0; i < 4; i++) { const a = fr === 1 ? l[i] : n[i], b = fr === 3 ? l[i] : n[i]; r.push('.' + a + a + '..' + b + b + '.'); } return r; };
    const WB = (() => { const r = BD.map(s => ('...' + s + '...').split('')); r[6] = 'sskkkkkkkkkkss'.split(''); r[7] = '...kkkkkkkk...'.split(''); return r.map(a => a.join('')).concat(pad(legsFB(0), 3)); })();
    function rowsFor(p) {
      if (p === 'f' || p === 'f1' || p === 'f3') return BD.concat(legsFB(+p[1] || 0));
      if (p === 'w') return WB;
      return BS.concat(LS[0]);
    }

    let HOME = { s: '#2f6fe4', p: '#f2f2f2' }, CUR_SKIN = '#e8b98a', CUR_HAIR = '#3b2412';
    const SC = new Map();
    function spr(a, pose) {
      const key = pose + '|' + HOME.s + '|' + HOME.p + '|' + CUR_SKIN + '|' + CUR_HAIR;
      let c = SC.get(key); if (c) return c;
      c = mk(rowsFor(pose), { h: CUR_HAIR, s: CUR_SKIN, e: '#1a1420', k: HOME.s, p: HOME.p, o: HOME.s, b: '#15131c' });
      SC.set(key, c); return c;
    }

    /* ---------------- tinted sprite draw ---------------- */
    const _tmpC = document.createElement('canvas'), _tg = _tmpC.getContext('2d');
    function drawSpriteTinted(s, x, y, w, h, dark, rim, rimCol) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      if (w < 1 || h < 1) return;
      if (rim > 0.02) {
        _tmpC.width = s.width; _tmpC.height = s.height;
        _tg.clearRect(0, 0, s.width, s.height);
        _tg.globalCompositeOperation = 'source-over'; _tg.drawImage(s, 0, 0);
        _tg.globalCompositeOperation = 'source-in'; _tg.fillStyle = rimCol; _tg.fillRect(0, 0, s.width, s.height);
        ctx.globalAlpha = rim;
        const off = Math.max(1, w * 0.025);
        ctx.drawImage(_tmpC, x - off, y - off * 0.5, w, h);
        ctx.drawImage(_tmpC, x + off, y - off * 0.5, w, h);
        ctx.globalAlpha = 1;
      }
      if (dark > 0.02) {
        _tmpC.width = s.width; _tmpC.height = s.height;
        _tg.clearRect(0, 0, s.width, s.height);
        _tg.globalCompositeOperation = 'source-over'; _tg.drawImage(s, 0, 0);
        _tg.globalCompositeOperation = 'source-atop';
        _tg.fillStyle = 'rgba(2,4,10,' + dark.toFixed(3) + ')';
        _tg.fillRect(0, 0, s.width, s.height);
        ctx.drawImage(_tmpC, x, y, w, h);
      } else {
        ctx.drawImage(s, x, y, w, h);
      }
    }

    /* ---------------- 3D projection ---------------- */
    function proj3(x, y, z, cam) {
      let dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
      const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
      let x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
      const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      let y1 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
      if (z2 < 0.12) return null;
      const f = cam.f;
      return [W / 2 + f * x1 / z2, H / 2 - f * y1 / z2, z2];
    }
    function fillQuad(a, b, c, d, color) {
      if (!a || !b || !c || !d) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
      ctx.closePath(); ctx.fill();
    }
    function line3(a, b, color, w) {
      if (!a || !b) return;
      ctx.strokeStyle = color; ctx.lineWidth = w || 1;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    function makeCam(x, y, z, yaw, pitch, f) { return { x, y, z, yaw: yaw || 0, pitch: pitch || 0, f: f || 300 }; }

    /* ---------------- world constants ---------------- */
    const CW = 2, CH = 3, DZ = 15, RW = 6, RH = 4.5, RB = 32;
    const OL = -1.2, OR = 1.2, OT = 2.6;

    /* ---------------- player timeline ---------------- */
    function playerPos(T) {
      if (T < 8.2) {
        const s = seg(T, 0.5, 8.2);
        return { x: 0, z: lerp(5.2, 11, ez(s)), walking: s > 0.02 && s < 0.99 };
      } else if (T < 10.8) {
        const s = seg(T, 8.2, 10.8);
        return { x: 0, z: lerp(11, 15.4, s), walking: true };
      } else if (T < 13.4) {
        const s = seg(T, 10.8, 13.4);
        return { x: 0, z: lerp(15.4, 19, ez(s)), walking: s < 0.92 };
      }
      return { x: 0, z: 19, walking: false };
    }
    function playerPose(T, walking) {
      if (!walking) return 'f';
      const f = Math.floor(T * 7) % 4;
      return ['f', 'f1', 'f', 'f3'][f];
    }

    /* ---------------- corridor renderer ---------------- */
    function drawCorridor(cam, T) {
      const fwd = Math.cos(cam.yaw) > 0;
      const zS = fwd ? cam.z + 0.4 : 0.25;
      const zE = fwd ? DZ : cam.z - 0.4;

      if (fwd) {
        const g = [
          proj3(OL, 0, DZ + 0.02, cam), proj3(OR, 0, DZ + 0.02, cam),
          proj3(OR, OT, DZ + 0.02, cam), proj3(OL, OT, DZ + 0.02, cam)
        ];
        if (g[0] && g[2]) {
          const grd = ctx.createLinearGradient(0, g[0][1], 0, g[2][1]);
          grd.addColorStop(0, '#143048'); grd.addColorStop(0.55, '#2d6a8a'); grd.addColorStop(1, '#8fd8f5');
          fillQuad(g[0], g[1], g[2], g[3], grd);
          ctx.fillStyle = 'rgba(200,240,255,0.35)';
          const hgt = g[0][1] - g[2][1];
          ctx.fillRect(g[0][0], g[2][1], g[1][0] - g[0][0], hgt * 0.1);
        }
        const wc = '#111722';
        fillQuad(proj3(-CW, 0, DZ, cam), proj3(OL, 0, DZ, cam), proj3(OL, CH, DZ, cam), proj3(-CW, CH, DZ, cam), wc);
        fillQuad(proj3(OR, 0, DZ, cam), proj3(CW, 0, DZ, cam), proj3(CW, CH, DZ, cam), proj3(OR, CH, DZ, cam), wc);
        fillQuad(proj3(OL, OT, DZ, cam), proj3(OR, OT, DZ, cam), proj3(OR, CH, DZ, cam), proj3(OL, CH, DZ, cam), wc);
        line3(proj3(OL, 0, DZ - 0.01, cam), proj3(OL, OT, DZ - 0.01, cam), 'rgba(120,180,220,0.25)', 1);
        line3(proj3(OR, 0, DZ - 0.01, cam), proj3(OR, OT, DZ - 0.01, cam), 'rgba(120,180,220,0.25)', 1);
      } else {
        const wc = '#080c14';
        fillQuad(
          proj3(-CW, 0, zS, cam), proj3(CW, 0, zS, cam),
          proj3(CW, CH, zS, cam), proj3(-CW, CH, zS, cam), wc
        );
        ctx.globalCompositeOperation = 'lighter';
        const gp = proj3(0, 1.4, zS, cam);
        if (gp) {
          const rg = ctx.createRadialGradient(gp[0], gp[1], 1, gp[0], gp[1], 40);
          rg.addColorStop(0, 'rgba(90,140,190,0.18)');
          rg.addColorStop(1, 'rgba(90,140,190,0)');
          ctx.fillStyle = rg; ctx.fillRect(gp[0] - 45, gp[1] - 45, 90, 90);
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      fillQuad(
        proj3(-CW, 0, zS, cam), proj3(CW, 0, zS, cam),
        proj3(CW, 0, zE, cam), proj3(-CW, 0, zE, cam), '#060911'
      );
      fillQuad(
        proj3(-CW, CH, zS, cam), proj3(CW, CH, zS, cam),
        proj3(CW, CH, zE, cam), proj3(-CW, CH, zE, cam), '#030508'
      );
      fillQuad(
        proj3(-CW, 0, zS, cam), proj3(-CW, CH, zS, cam),
        proj3(-CW, CH, zE, cam), proj3(-CW, 0, zE, cam), '#090d16'
      );
      fillQuad(
        proj3(CW, 0, zS, cam), proj3(CW, CH, zS, cam),
        proj3(CW, CH, zE, cam), proj3(CW, 0, zE, cam), '#0b1019'
      );

      ctx.strokeStyle = 'rgba(90,140,190,0.07)'; ctx.lineWidth = 1;
      const lo = Math.min(zS, zE), hi = Math.max(zS, zE);
      for (let z = Math.ceil(lo) + 0.5; z < hi - 0.3; z += 1.5) {
        const a = proj3(-CW, 0.002, z, cam), b = proj3(CW, 0.002, z, cam);
        if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      }
      for (let xx = -1.5; xx <= 1.5; xx += 1) {
        if (Math.abs(xx) > CW - 0.1) continue;
        const a = proj3(xx, 0.002, zS, cam), b = proj3(xx, 0.002, zE, cam);
        if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      }

      for (let z = Math.ceil(lo) + 1; z < hi - 0.8; z += 2.5) {
        const p0 = proj3(-0.45, CH - 0.02, z, cam), p1 = proj3(0.45, CH - 0.02, z, cam);
        if (!p0 || !p1) continue;
        const lw = p1[0] - p0[0];
        if (lw < 0.8) continue;
        ctx.fillStyle = 'rgba(110,170,230,0.10)';
        ctx.fillRect(p0[0] - lw * 0.3, p0[1] - 2, lw * 1.6, 5);
        ctx.fillStyle = 'rgba(170,215,255,0.45)';
        ctx.fillRect(p0[0], p0[1], lw, 1);
      }

      for (const px of [-1.55, -1.35]) {
        const a = proj3(px, 0.6, zS, cam), b = proj3(px, 0.6, zE, cam);
        line3(a, b, 'rgba(40,65,100,0.45)', 1);
      }
    }

    /* ---------------- room renderer ---------------- */
    function drawRoom(cam, T, opts) {
      opts = opts || {};
      const back = Math.cos(cam.yaw) < 0;
      const zN = cam.z + 0.45;
      const zF = RB;

      if (back && opts.showDoorway !== false) {
        const g = [
          proj3(OL, 0, DZ - 0.02, cam), proj3(OR, 0, DZ - 0.02, cam),
          proj3(OR, OT, DZ - 0.02, cam), proj3(OL, OT, DZ - 0.02, cam)
        ];
        if (g[0] && g[2]) {
          const gg = ctx.createLinearGradient(0, g[2][1], 0, g[0][1]);
          gg.addColorStop(0, '#040810');
          gg.addColorStop(0.55, '#0e1e2e');
          gg.addColorStop(1, '#2a5a78');
          fillQuad(g[0], g[1], g[2], g[3], gg);
        }
        const wc = '#0a0e16';
        fillQuad(proj3(-RW, 0, DZ, cam), proj3(OL, 0, DZ, cam), proj3(OL, RH, DZ, cam), proj3(-RW, RH, DZ, cam), wc);
        fillQuad(proj3(OR, 0, DZ, cam), proj3(RW, 0, DZ, cam), proj3(RW, RH, DZ, cam), proj3(OR, RH, DZ, cam), wc);
        fillQuad(proj3(OL, OT, DZ, cam), proj3(OR, OT, DZ, cam), proj3(OR, RH, DZ, cam), proj3(OL, RH, DZ, cam), wc);
        line3(proj3(OL, 0, DZ - 0.01, cam), proj3(OL, OT, DZ - 0.01, cam), 'rgba(78,232,255,0.4)', 1);
        line3(proj3(OR, 0, DZ - 0.01, cam), proj3(OR, OT, DZ - 0.01, cam), 'rgba(78,232,255,0.4)', 1);
        line3(proj3(OL, OT, DZ - 0.01, cam), proj3(OR, OT, DZ - 0.01, cam), 'rgba(78,232,255,0.4)', 1);
      }

      fillQuad(
        proj3(-RW, 0, zN, cam), proj3(RW, 0, zN, cam),
        proj3(RW, 0, zF, cam), proj3(-RW, 0, zF, cam), '#060910'
      );
      fillQuad(
        proj3(-RW, RH, zN, cam), proj3(RW, RH, zN, cam),
        proj3(RW, RH, zF, cam), proj3(-RW, RH, zF, cam), '#040710'
      );
      fillQuad(
        proj3(-RW, 0, zN, cam), proj3(-RW, RH, zN, cam),
        proj3(-RW, RH, zF, cam), proj3(-RW, 0, zF, cam), '#090e17'
      );
      fillQuad(
        proj3(RW, 0, zN, cam), proj3(RW, RH, zN, cam),
        proj3(RW, RH, zF, cam), proj3(RW, 0, zF, cam), '#0a0f1a'
      );
      if (!back) {
        fillQuad(
          proj3(-RW, 0, zF, cam), proj3(RW, 0, zF, cam),
          proj3(RW, RH, zF, cam), proj3(-RW, RH, zF, cam), '#0b101a'
        );
      }

      const ledA = 0.55 + 0.15 * Math.sin(T * 2.1);
      const ledC = 'rgba(78,232,255,' + ledA.toFixed(2) + ')';
      let a = proj3(-RW + 0.02, 0.06, zN, cam), b = proj3(-RW + 0.02, 0.06, zF, cam);
      if (a && b) line3(a, b, ledC, 1.5);
      a = proj3(RW - 0.02, 0.06, zN, cam); b = proj3(RW - 0.02, 0.06, zF, cam);
      if (a && b) line3(a, b, ledC, 1.5);
      a = proj3(-RW + 0.02, RH - 0.35, zN, cam); b = proj3(-RW + 0.02, RH - 0.35, zF, cam);
      if (a && b) line3(a, b, 'rgba(110,130,255,0.4)', 1);
      a = proj3(RW - 0.02, RH - 0.35, zN, cam); b = proj3(RW - 0.02, RH - 0.35, zF, cam);
      if (a && b) line3(a, b, 'rgba(110,130,255,0.4)', 1);

      ctx.strokeStyle = 'rgba(70,110,150,0.05)'; ctx.lineWidth = 1;
      for (let z = Math.ceil(zN) + 1; z < zF - 0.5; z += 2) {
        const p0 = proj3(-RW, 0.002, z, cam), p1 = proj3(RW, 0.002, z, cam);
        if (p0 && p1) { ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
      }

      if (!back) {
        ctx.globalCompositeOperation = 'lighter';
        for (const sx of [-3.2, 0, 3.2]) {
          const sz = 24;
          const top = proj3(sx, RH, sz, cam), fl = proj3(sx, 0, sz, cam);
          if (!top || !fl) continue;
          const rg = ctx.createRadialGradient(fl[0], fl[1], 2, fl[0], fl[1], 55);
          rg.addColorStop(0, 'rgba(100,160,230,0.18)');
          rg.addColorStop(1, 'rgba(100,160,230,0)');
          ctx.fillStyle = rg; ctx.fillRect(fl[0] - 60, fl[1] - 60, 120, 120);
          const cg = ctx.createLinearGradient(top[0], top[1], fl[0], fl[1]);
          cg.addColorStop(0, 'rgba(80,140,210,0.09)');
          cg.addColorStop(1, 'rgba(80,140,210,0)');
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.moveTo(top[0] - 7, top[1]); ctx.lineTo(top[0] + 7, top[1]);
          ctx.lineTo(fl[0] + 30, fl[1]); ctx.lineTo(fl[0] - 30, fl[1]);
          ctx.closePath(); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      if (!back) {
        const cx = 0, cy = 2.2, cz = zF - 0.02;
        const pts = [
          proj3(cx - 0.9, cy - 0.9, cz, cam), proj3(cx + 0.9, cy - 0.9, cz, cam),
          proj3(cx + 0.9, cy + 0.9, cz, cam), proj3(cx - 0.9, cy + 0.9, cz, cam)
        ];
        if (pts[0] && pts[2]) {
          const gx = (pts[0][0] + pts[2][0]) / 2, gy = (pts[0][1] + pts[2][1]) / 2;
          const pulse = 0.3 + 0.1 * Math.sin(T * 1.7);
          const rg = ctx.createRadialGradient(gx, gy, 3, gx, gy, 45);
          rg.addColorStop(0, 'rgba(78,232,255,' + pulse.toFixed(2) + ')');
          rg.addColorStop(1, 'rgba(78,232,255,0)');
          ctx.fillStyle = rg; ctx.fillRect(gx - 50, gy - 50, 100, 100);
          fillQuad(pts[0], pts[1], pts[2], pts[3], 'rgba(8,16,26,0.92)');
          ctx.strokeStyle = 'rgba(78,232,255,0.75)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]);
          ctx.lineTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]);
          ctx.closePath(); ctx.stroke();
          const fsz = Math.max(1, Math.floor((pts[2][0] - pts[0][0]) / 8));
          txt(ctx, 'PSFC', gx, gy - fsz * 2.5, '#a8f0ff', fsz, 'c', '#0a1a2a');
        }
      }
    }

    /* ---------------- dust ---------------- */
    const DUST = (() => { const r = rng(17); return Array.from({ length: 110 }, () => ({
      x: (r() - 0.5) * 3.6, y: r() * 2.8 + 0.1, z: 3 + r() * 11,
      vz: 0.1 + r() * 0.35, ph: r() * TAU
    })); })();
    function drawDust(cam, T) {
      ctx.globalCompositeOperation = 'lighter';
      for (const d of DUST) {
        const z = ((d.z + T * d.vz) % 13) + 1.2;
        const x = d.x + Math.sin(T * 0.45 + d.ph) * 0.15;
        const y = d.y + Math.cos(T * 0.35 + d.ph) * 0.08;
        const p = proj3(x, y, z, cam);
        if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
        const dist = Math.abs(z - cam.z);
        const al = clamp(0.55 / (1 + dist * 0.22), 0, 0.5);
        if (al < 0.02) continue;
        const sz = clamp(3 / dist, 1, 2);
        ctx.fillStyle = 'rgba(170,215,255,' + al.toFixed(3) + ')';
        ctx.fillRect(Math.round(p[0]), Math.round(p[1]), sz, sz);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------------- player renderer ---------------- */
    function drawPlayer3D(cam, T, opts) {
      opts = opts || {};
      const pos = opts.pos || playerPos(T);
      const sp = spr(null, playerPose(T, pos.walking));
      const feet = proj3(pos.x, 0, pos.z, cam);
      const head = proj3(pos.x, 1.8, pos.z, cam);
      if (!feet || !head) return;
      const sh = Math.abs(feet[1] - head[1]);
      if (sh < 2) return;
      const sw = sh * sp.width / sp.height;
      const px = feet[0] - sw / 2;
      const py = Math.min(head[1], feet[1]);
      const dk = opts.darkness !== undefined ? opts.darkness : 0;
      const rim = opts.rim || 0;
      const rc = opts.rimCol || '#bfe9ff';

      if (opts.shadow !== false) {
        const shw = sw * 0.55, shh = Math.max(2, sh * 0.05);
        ctx.fillStyle = 'rgba(0,0,0,' + (0.55 * (1 - dk * 0.5)).toFixed(3) + ')';
        ctx.fillRect(Math.round(feet[0] - shw / 2), Math.round(feet[1] - shh / 2), Math.round(shw), Math.round(shh));
      }

      if (opts.reflect && feet[1] < H && feet[1] > 0) {
        ctx.save();
        ctx.globalAlpha = 0.22 * (1 - dk * 0.6);
        ctx.translate(feet[0], feet[1]);
        ctx.scale(1, -0.42);
        ctx.drawImage(sp, -sw / 2, -sh, sw, sh);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      drawSpriteTinted(sp, px, py, sw, sh, dk, rim, rc);
    }

    /* ---------------- reveal HUD ---------------- */
    const ICONS = {
      flag: mk(['bbbbbbbbb', 'bbbbbbbbb', 'wwwwwwwww', 'wwwyyywww', 'wwwyyywww', 'wwwwwwwww', 'bbbbbbbbb'],
        { b: '#74acdf', w: '#f4f4f0', y: '#f2c21b' }),
      card: mk(['gggggggg', 'gddddddg', 'gddddddg', 'gddddddg', 'gddddddg', '.gddddg.', '..gddg..', '...gg...'],
        { g: '#e8c86a', d: '#3a2418' }),
      pos: mk(['...w....', '..www...', '.wwwww..', 'wwwwwww.', '...w....', '...w....', '...w....'],
        { w: '#8affa0' }),
      club: mk(['gggggggg', 'gccccccg', 'gcwccwcg', 'gcwccwcg', 'gccccccg', 'gccccccg', '.gccccg.', '..gggg..'],
        { g: '#cfe0f5', c: '#2f6fe4', w: '#ffffff' }),
      name: mk(['..hhh..', '.hhhhh.', '..sss..', '..sss..', '.kkkkk.', 'kkkkkkk', 'kkkkkkk', 'kkkkkkk'],
        { h: '#3b2412', s: '#e8b98a', k: '#2f6fe4' })
    };

    let REVEALS = [];

    function drawRevealRow(r, x, y) {
      const w = 116, h = 20;
      x = Math.round(x); y = Math.round(y);
      ctx.fillStyle = 'rgba(4,8,14,0.85)'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = r.c; ctx.fillRect(x, y, 2, h);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 2, y, w - 2, 1);
      ctx.drawImage(r.icon, x + 6, y + 5);
      txt(ctx, r.k, x + 20, y + 2, '#6f8fa8', 1);
      const vs = r.v.length > 11 ? 1 : 2;
      txt(ctx, r.v, x + 20, y + 8, '#ffffff', vs, 'l', '#040810');
    }

    function drawReveals(T, si) {
      for (let i = 0; i < si; i++) {
        if (i >= REVEALS.length) break;
        const at = SHOTS[i].b;
        const u = clamp(seg(T, at, at + 0.45), 0, 1);
        if (u <= 0) continue;
        const r = REVEALS[i];
        ctx.globalAlpha = u;
        drawRevealRow(r, 8 - (1 - ez(u)) * 20, 64 + i * 22);
        ctx.globalAlpha = 1;
      }
      if (si >= REVEALS.length) return;
      const r = REVEALS[si];
      const u = ez(clamp(seg(T, SHOTS[si].a, SHOTS[si].a + 0.5), 0, 1));
      if (u <= 0) return;
      const cy = lerp(14, 26, u);
      ctx.globalAlpha = u;

      const lw = r.k.length * 4 - 1;
      ctx.fillStyle = r.c;
      ctx.fillRect(Math.round(W / 2 - lw / 2 - 10), Math.round(cy + 2), 5, 1);
      ctx.fillRect(Math.round(W / 2 + lw / 2 + 5), Math.round(cy + 2), 5, 1);
      txt(ctx, r.k, W / 2, cy, r.c, 1, 'c', '#040810');

      const vs = r.v.length > 20 ? 2 : 3;
      txt(ctx, r.v, W / 2, cy + 9, '#ffffff', vs, 'c', '#040810');

      const vw = r.v.length * 4 * vs - vs;
      ctx.fillStyle = r.c;
      ctx.fillRect(Math.round(W / 2 - vw / 2), Math.round(cy + 27), Math.round(vw), 1);
      ctx.fillRect(Math.round(W / 2 - vw / 2), Math.round(cy + 29), Math.round(vw), 1);

      if (u < 1) {
        const f = (1 - u) * 0.7;
        ctx.fillStyle = 'rgba(200,240,255,' + f.toFixed(3) + ')';
        const bw = vw + 18, bh = 26;
        ctx.fillRect(Math.round(W / 2 - bw / 2), Math.round(cy + 4), Math.round(bw), bh);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(Math.round(W / 2 - bw / 2), Math.round(cy + 4), Math.round(bw), bh);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    }

    /* ---------------- shots ---------------- */
    function shotA(T, lt) {
      const cam = makeCam(0, 1.5, 1.0 + lt * 0.15, 0, 0, 280);
      drawCorridor(cam, T);
      drawPlayer3D(cam, T, { darkness: 0.86, rim: 0.42, rimCol: '#8fd0ff' });
      drawDust(cam, T);
    }
    function shotB(T, lt) {
      const cam = makeCam(0.2, 1.3, 12.0 - lt * 0.5, Math.PI, 0.02, 280);
      drawCorridor(cam, T);
      drawPlayer3D(cam, T, { darkness: 0.64, rim: 0.32, rimCol: '#ffd080' });
      drawDust(cam, T);
    }
    function shotC(T, lt) {
      const cam = makeCam(0, 0.4, 13.5 - lt * 0.5, Math.PI, 0.03, 260);
      drawCorridor(cam, T);
      drawPlayer3D(cam, T, { darkness: 0.44, rim: 0.48, rimCol: '#ffd080' });
      drawDust(cam, T);
    }
    function shotD(T, lt) {
      const cam = makeCam(0, 1.1, 18.5 - lt * 0.7, Math.PI, 0.02, 280);
      drawRoom(cam, T, { showDoorway: true });
      drawPlayer3D(cam, T, { darkness: 0.88, rim: 0.7, rimCol: '#a8e0ff', shadow: false, reflect: false });
    }
    function shotE(T, lt) {
      const cam = makeCam(0, 1.6, 23.0 - lt * 0.5, Math.PI, 0.02, 280);
      drawRoom(cam, T, { showDoorway: true });
      drawPlayer3D(cam, T, { darkness: 0.12, rim: 0.4, rimCol: '#78e8ff', reflect: true });
    }
    function shotF(T, lt) {
      const cam = makeCam(0.5, 1.0, 15.1 + lt * 0.4, 0, -0.02, 300);
      drawRoom(cam, T, { showDoorway: false });
      drawPlayer3D(cam, T, { darkness: 0.02, rim: 0.75, rimCol: '#78e8ff', reflect: true });
    }

    const SHOTS = [
      { n: 'THE TUNNEL', a: 0, b: 2.8, fn: shotA },
      { n: 'THE APPROACH', a: 2.8, b: 5.6, fn: shotB },
      { n: 'THE THRESHOLD', a: 5.6, b: 8.2, fn: shotC },
      { n: 'THE DOORWAY', a: 8.2, b: 10.8, fn: shotD },
      { n: 'THE ROOM', a: 10.8, b: 13.4, fn: shotE },
      { n: 'THE HERO', a: 13.4, b: 21.0, fn: shotF }
    ];
    const LOOP = 21.0;
    const HERO_AT = 13.7;

    function shotAt(T) { for (let i = 0; i < SHOTS.length; i++) if (T < SHOTS[i].b) return i; return SHOTS.length - 1; }

    /* ---------------- overlay ---------------- */
    function overlay(T, si) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, 16);
      ctx.fillRect(0, H - 14, W, 14);
      txt(ctx, SHOTS[si].n, 8, 5, '#4a7a9a', 1);
      txt(ctx, 'WALKOUT', W - 8, 5, '#8fe4ff', 1, 'r');

      drawReveals(T, si);

      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(0, H - 6, W, 2);
      ctx.fillStyle = '#8fe4ff'; ctx.fillRect(0, H - 6, Math.round(clamp(T / LOOP, 0, 1) * W), 2);
      for (const s of SHOTS) { ctx.fillStyle = '#000'; ctx.fillRect(Math.round(s.a / LOOP * W), H - 6, 1, 2); }
    }

    /* ---------------- data / colours ---------------- */
    const KIT_COLORS = {
      emerald: ['#07966d', '#087d60'],
      royal: ['#1765d1', '#102f80'],
      crimson: ['#c52b43', '#78172a'],
      white: ['#e9edf0', '#303a46'],
      gold: ['#d5a82c', '#22272d']
    };
    const HAIR_COLORS = { short: '#3b2412', curly: '#1b1410', buzz: '#201a17', none: '#3b2412' };

    function setData(d) {
      d = d || {};
      const kit = KIT_COLORS[d.kit] || ['#2f6fe4', '#f2f2f2'];
      HOME = { s: kit[0], p: kit[1] };
      CUR_SKIN = d.skin || '#e8b98a';
      CUR_HAIR = HAIR_COLORS[d.hair] || '#3b2412';
      SC.clear();

      const P = d.panels || [];
      const nation = d.nation || (P[0] && P[0].value) || 'International';
      const typeLabel = d.typeLabel || d.tag || (P[1] && P[1].value) || '';
      const posLabel = d.posLabel || (P[2] && P[2].value) || '';
      const clubName = d.club || 'International';
      const typeColor = d.typeColor || (P[1] && P[1].color) || '#e8c86a';

      REVEALS = [
        { k: 'NATION', v: String(nation).toUpperCase(), c: '#74acdf', icon: ICONS.flag },
        { k: 'CARD TYPE', v: String(typeLabel).toUpperCase(), c: typeColor, icon: ICONS.card },
        { k: 'POSITION', v: String(posLabel).toUpperCase(), c: '#8affa0', icon: ICONS.pos },
        { k: 'CLUB', v: String(clubName).toUpperCase(), c: '#5fa8ff', icon: ICONS.club },
        { k: 'NAME', v: String(d.name || '').toUpperCase(), c: '#ffffff', icon: ICONS.name }
      ];
    }

    /* ---------------- loop ---------------- */
    let T = 0, last = 0, raf = null, active = false;
    let speed = 1, heroCb = null, heroFired = false;
    let lastShot = -1, flash = 0;

    function frame(now) {
      if (!active) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      T += dt * speed;
      const si = shotAt(T);
      if (si !== lastShot) { lastShot = si; flash = 0.13; } else flash = Math.max(0, flash - dt);
      const lt = seg(T, SHOTS[si].a, SHOTS[si].b);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      SHOTS[si].fn(T, lt);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const vg = ctx.createRadialGradient(W / 2, H / 2, 90, W / 2, H / 2, 280);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.58)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      if (flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (flash / 0.13 * 0.55).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }

      if (T < HERO_AT) overlay(T, si);

      if (!heroFired && T >= HERO_AT) {
        heroFired = true;
        const cb = heroCb;
        heroCb = null;
        if (cb) { try { cb(); } catch (e) {} }
      }
    }

    function fit() {
      const k = Math.min(window.innerWidth / W, window.innerHeight / H);
      canvas.style.width = Math.floor(W * k) + 'px';
      canvas.style.height = Math.floor(H * k) + 'px';
    }
    window.addEventListener('resize', function () { if (active) fit(); });

    function start(d, onHero) {
      stop();
      setData(d);
      T = 0; last = 0; lastShot = -1; flash = 0;
      speed = d && d.fast ? 1.9 : 1;
      heroCb = onHero || null;
      heroFired = false;
      active = true;
      fit();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      active = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      heroCb = null;
    }

    return { start: start, stop: stop };
  }

  window.createPixWalkout = createPixWalkout;
})();
