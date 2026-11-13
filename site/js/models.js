// Hand-drawn components that can be drawn from any side: tiny 3D models (convex blocks, domes, lines) rendered
// to ink-and-wash sprites for a given view angle. Units are "map metres" (buildings are exaggerated, as on an illustrated map).
import { rng, clamp, lerp, INK } from './draw.js';

export const PITCH = 0.615, SINP = Math.sin(PITCH), COSP = Math.cos(PITCH), SP = 0.16, SS = 2, ANG = 16;
export const shade = (col, k) => { let r, gg, b; if (col[0] === '#') { const n = parseInt(col.slice(1), 16); r = n >> 16; gg = (n >> 8) & 255; b = n & 255; } else [r, gg, b] = col.match(/\d+/g).map(Number); const f = (c) => Math.round(clamp(k < 0 ? c * (1 + k) : c + (255 - c) * k, 0, 255)); return `rgb(${f(r)},${f(gg)},${f(b)})`; };

// ---------------------------------------------------------------- part constructors
const rect = (x, y, w, d, rot = 0) => { const c = Math.cos(rot), s = Math.sin(rot); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [x + a * c - b * s, y + a * s + b * c]); };
const ngon = (x, y, r, n = 12) => Array.from({ length: n }, (_, k) => [x + r * Math.cos((k / n) * 6.2832), y + r * Math.sin((k / n) * 6.2832)]);
// prism: footprint polygon (counter-clockwise) extruded from z to z+h, optionally tapering towards its centre at the top
export const prism = (poly, z, h, c, o = {}) => ({ t: 'prism', poly, z, h, c, taper: o.taper ?? 1, win: o.win, top: o.top, round: o.round, lit: o.lit, ink: o.ink });
export const box = (x, y, z, w, d, h, c, o = {}) => prism(rect(x, y, w, d, o.rot), z, h, c, o);
export const cyl = (x, y, z, r, h, c, o = {}) => prism(ngon(x, y, r, o.n || 12), z, h, c, { ...o, taper: o.r2 !== undefined ? o.r2 / r : 1, round: true });
export const pyr = (x, y, z, w, d, h, c, o = {}) => prism(rect(x, y, w, d, o.rot), z, h, c, { ...o, taper: 0 });
export const cone = (x, y, z, r, h, c) => prism(ngon(x, y, r, 10), z, h, c, { taper: 0, round: true });
export const gable = (x, y, z, w, d, h, axis, c) => ({ t: 'gable', x, y, z, w, d, h, axis, c });
export const dome = (x, y, z, r, h, c, o = {}) => ({ t: 'dome', x, y, z, r, h, c, ribs: o.ribs });
export const line = (a, b, w, c = INK) => ({ t: 'path', pts: [a, b], w, c });
export const path = (pts, w, c = INK) => ({ t: 'path', pts, w, c });
const arch = (x0, y0, x1, y1, z, rise, n = 10) => Array.from({ length: n + 1 }, (_, k) => { const u = k / n; return [lerp(x0, x1, u), lerp(y0, y1, u), z + Math.sin(u * Math.PI) * rise]; });

// ---------------------------------------------------------------- renderer
function faces(p) { // turn a part into convex polygons with outward normals
  const out = [];
  if (p.t === 'prism') {
    const n = p.poly.length, cx = p.poly.reduce((a, q) => a + q[0], 0) / n, cy = p.poly.reduce((a, q) => a + q[1], 0) / n;
    const B = p.poly.map(([x, y]) => [x, y, p.z]), Tp = p.poly.map(([x, y]) => [cx + (x - cx) * p.taper, cy + (y - cy) * p.taper, p.z + p.h]);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, ex = B[j][0] - B[i][0], ey = B[j][1] - B[i][1], l = Math.hypot(ex, ey) || 1; out.push({ v: [B[i], B[j], Tp[j], Tp[i]], n: [ey / l, -ex / l, p.taper < 1 ? 0.3 : 0], side: true, i }); }
    if (p.taper > 0.02) out.push({ v: Tp, n: [0, 0, 1], top: true });
  } else if (p.t === 'gable') {
    const { x, y, z, w, d, h } = p, a = w / 2, b = d / 2, C = [[x - a, y - b, z], [x + a, y - b, z], [x + a, y + b, z], [x - a, y + b, z]];
    if (p.axis === 'x') { const r0 = [x - a, y, z + h], r1 = [x + a, y, z + h]; out.push({ v: [C[0], C[1], r1, r0], n: [0, -1, 1], roof: true }, { v: [C[2], C[3], r0, r1], n: [0, 1, 1], roof: true }, { v: [C[3], C[0], r0], n: [-1, 0, 0], side: true }, { v: [C[1], C[2], r1], n: [1, 0, 0], side: true }); }
    else { const r0 = [x, y - b, z + h], r1 = [x, y + b, z + h]; out.push({ v: [C[1], C[2], r1, r0], n: [1, 0, 1], roof: true }, { v: [C[3], C[0], r0, r1], n: [-1, 0, 1], roof: true }, { v: [C[0], C[1], r0], n: [0, -1, 0], side: true }, { v: [C[2], C[3], r1], n: [0, 1, 0], side: true }); }
  }
  return out;
}
const centre = (p) => {
  if (p.t === 'prism') { const n = p.poly.length; return [p.poly.reduce((a, q) => a + q[0], 0) / n, p.poly.reduce((a, q) => a + q[1], 0) / n, p.z + p.h / 2]; }
  if (p.t === 'path') { const n = p.pts.length; return [p.pts.reduce((a, q) => a + q[0], 0) / n, p.pts.reduce((a, q) => a + q[1], 0) / n, p.pts.reduce((a, q) => a + q[2], 0) / n]; }
  return [p.x, p.y, p.z + p.h / 2];
};
function wob(g, R, a, b, j = 0.6, w = 1) { // short, slightly unsure ink stroke
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 22));
  g.beginPath(); g.moveTo(a[0] + (R() - .5) * j, a[1] + (R() - .5) * j);
  for (let k = 1; k <= n; k++) g.lineTo(lerp(a[0], b[0], k / n) + (R() - .5) * j * 1.6, lerp(a[1], b[1], k / n) + (R() - .5) * j * 1.6);
  g.lineWidth = w; g.stroke();
}

// Render a model (list of parts) seen from yaw `th`. `opt.lit` = share of windows lit; `opt.seed` keeps the wobble stable.
export function renderSprite(parts, th, opt = {}) {
  const c = Math.cos(th), s = Math.sin(th), R = rng(opt.seed || 7), lit = opt.lit ?? 0.6;
  const P = ([x, y, z]) => { const xr = x * c - y * s, yr = x * s + y * c; return [xr * SP, -(yr * SINP + z * COSP) * SP]; };
  const depth = ([x, y, z]) => (x * s + y * c) * COSP - z * SINP;
  // bounds
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const grow = (q) => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); };
  for (const p of parts) {
    if (p.t === 'prism') for (const [x, y] of p.poly) { grow(P([x, y, p.z])); grow(P([x, y, p.z + p.h])); }
    else if (p.t === 'gable') for (const dx of [-1, 1]) for (const dy of [-1, 1]) { grow(P([p.x + dx * p.w / 2, p.y + dy * p.d / 2, p.z])); grow(P([p.x + dx * p.w / 2, p.y + dy * p.d / 2, p.z + p.h])); }
    else if (p.t === 'dome') { const q = P([p.x, p.y, p.z]); grow([q[0] - p.r * SP, q[1] - (p.h * COSP + p.r * SINP) * SP]); grow([q[0] + p.r * SP, q[1] + p.r * SINP * SP]); }
    else for (const q of p.pts) grow(P(q));
  }
  const pad = 6, w = Math.ceil(x1 - x0) + pad * 2, h = Math.ceil(y1 - y0) + pad * 2, ox = -x0 + pad, oy = -y0 + pad;
  const cv = document.createElement('canvas'); cv.width = w * SS; cv.height = h * SS; const g = cv.getContext('2d'); g.scale(SS, SS); g.translate(ox, oy); g.lineCap = 'round'; g.lineJoin = 'round';
  const order = parts.map((p) => ({ p, d: depth(centre(p)) })).sort((a, b) => b.d - a.d);
  for (const { p } of order) {
    if (p.t === 'path') { g.strokeStyle = p.c; const q = p.pts.map(P); for (let k = 0; k < q.length - 1; k++) wob(g, R, q[k], q[k + 1], 0.5, p.w); continue; }
    if (p.t === 'dome') {
      const q = P([p.x, p.y, p.z]), rx = p.r * SP, ryB = p.r * SINP * SP, ryT = (p.h * COSP + p.r * SINP * 0.55) * SP;
      g.beginPath(); g.ellipse(q[0], q[1], rx, ryB, 0, 0, Math.PI); g.ellipse(q[0], q[1], rx, ryT, 0, Math.PI, 2 * Math.PI); g.closePath();
      const gr = g.createLinearGradient(q[0] - rx, 0, q[0] + rx, 0); gr.addColorStop(0, shade(p.c, 0.12)); gr.addColorStop(0.55, p.c); gr.addColorStop(1, shade(p.c, -0.28)); g.fillStyle = gr; g.fill();
      g.strokeStyle = INK; g.globalAlpha = .85; g.lineWidth = 1; g.stroke();
      if (p.ribs) { g.globalAlpha = .3; for (let k = 1; k < p.ribs; k++) { const u = (k / p.ribs) * 2 - 1; g.beginPath(); g.ellipse(q[0], q[1], rx * Math.abs(u), ryT, 0, Math.PI, 2 * Math.PI); g.stroke(); } for (const f of [0.45, 0.8]) { g.beginPath(); g.ellipse(q[0], q[1] - ryT * f * 0.9, rx * Math.sqrt(1 - f * f), ryB * Math.sqrt(1 - f * f), 0, 0, 6.3); g.stroke(); } }
      g.globalAlpha = 1; continue;
    }
    const fs = faces(p).map((f) => { const nxr = f.n[0] * c - f.n[1] * s, nyr = f.n[0] * s + f.n[1] * c; return { ...f, nxr, vis: nyr * COSP - f.n[2] * SINP < 0, d: depth(f.v.reduce((a, q) => [a[0] + q[0] / f.v.length, a[1] + q[1] / f.v.length, a[2] + q[2] / f.v.length], [0, 0, 0])), q: f.v.map(P) }; });
    const visible = fs.filter((f) => f.vis).sort((a, b) => b.d - a.d);
    for (const f of visible) {
      const l = Math.hypot(f.n[0], f.n[1]) || 1, k = f.top ? 0.22 : f.roof ? -0.02 - 0.14 * (f.nxr / l) : -0.17 - 0.17 * (f.nxr / l);
      g.fillStyle = f.top && p.top ? p.top : shade(p.c, k); g.beginPath(); f.q.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill();
      if (f.side && f.q.length === 4 && !p.round) { g.fillStyle = 'rgba(0,0,0,.07)'; g.beginPath(); const u = 0.25 + R() * 0.4; g.moveTo(f.q[0][0], f.q[0][1]); g.lineTo(f.q[1][0], f.q[1][1]); g.lineTo(lerp(f.q[1][0], f.q[2][0], u), lerp(f.q[1][1], f.q[2][1], u)); g.lineTo(lerp(f.q[0][0], f.q[3][0], u + 0.1), lerp(f.q[0][1], f.q[3][1], u + 0.1)); g.fill(); }
      if (f.side && p.win && f.q.length === 4) { // window grid on this wall
        const [A, B, C, D] = f.q, { cols, rows } = p.win, wl = p.lit ?? lit, dark = p.win.dark;
        const at = (u, v) => [lerp(lerp(A[0], B[0], u), lerp(D[0], C[0], u), v), lerp(lerp(A[1], B[1], u), lerp(D[1], C[1], u), v)];
        const hw = 0.3 / cols, hh = 0.3 / rows;
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const u = (q + 0.5) / cols, v = (r + 0.5) / rows, on = R() < wl;
          g.fillStyle = dark ? 'rgba(23,26,46,.55)' : on ? (R() < 0.3 ? '#ffc35e' : '#ffd88a') : 'rgba(23,26,46,.6)';
          const a = at(u - hw, v - hh), b = at(u + hw, v - hh), cc = at(u + hw, v + hh), dd = at(u - hw, v + hh);
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(cc[0], cc[1]); g.lineTo(dd[0], dd[1]); g.fill();
        }
      }
    }
    if (p.ink === false) continue;
    g.strokeStyle = INK; g.globalAlpha = 0.82;
    if (p.round) { // only the silhouette and the rim
      const sides = fs.filter((f) => f.side);
      for (let i = 0; i < sides.length; i++) { const a = sides[i], b = sides[(i + 1) % sides.length]; if (a.vis !== b.vis) wob(g, R, a.q[1], a.q[2], 0.4, 1); if (a.vis) wob(g, R, a.q[0], a.q[1], 0.3, 0.9); }
      const top = fs.find((f) => f.top); if (top) for (let i = 0; i < top.q.length; i++) wob(g, R, top.q[i], top.q[(i + 1) % top.q.length], 0.3, 0.9);
    } else for (const f of visible) for (let i = 0; i < f.q.length; i++) wob(g, R, f.q[i], f.q[(i + 1) % f.q.length], 0.6, 1);
    g.globalAlpha = 1;
  }
  return { cv, w, h, ox, oy, top: -y0, half: (x1 - x0) / 2 };
}

// ---------------------------------------------------------------- generic building families (one or many games each)
export const FL = 34; // metres per floor on this exaggerated map
const BRICK = ['#a8563f', '#b5694a', '#8f4a3c', '#c07a55'], STONE = ['#b9ad96', '#c9bfa8', '#a79d88'], GLASS = ['#4f7fa6', '#5a93b0', '#3f6f94', '#6aa3b8', '#4a8a9a'], PASTEL = ['#d9836a', '#e0b45a', '#6fae8f', '#7aa3c9', '#c98ab0', '#e6d27a'], ROOF = ['#6a4a4e', '#5a5560', '#7a5a44', '#4e5a66'];
export function generic(family, floors, v, tint) { // v: 0..3 variant
  const H = floors * FL, pick = (a) => a[(v + floors) % a.length], parts = [];
  if (family === 'glass' || family === 'bank') {
    const w = family === 'bank' ? 240 : 200, c = tint || pick(GLASS);
    parts.push(box(0, 0, 0, w, w * 0.9, H, c, { win: { cols: 4, rows: floors } }));
    if (v % 3 === 0) parts.push(box(0, 0, H, w * 0.5, w * 0.45, 40, shade(c, -0.25)));
    else if (v % 3 === 1) parts.push(box(0, 0, H, w * 0.7, w * 0.63, FL * 2, c, { win: { cols: 3, rows: 2 } }), line([0, 0, H + FL * 2], [0, 0, H + FL * 2 + 130], 1.2));
    else parts.push(pyr(0, 0, H, w, w * 0.9, 90, shade(c, -0.15)));
  } else if (family === 'condo') {
    const c = tint || pick(['#8fa3b0', '#a8b4b8', '#7a909e', '#b8b0a2']);
    parts.push(box(0, 0, 0, 260, 220, FL * 2, pick(STONE), { win: { cols: 4, rows: 2 } }), box(-20, 10, FL * 2, 150, 150, H - FL * 2, c, { win: { cols: 3, rows: Math.max(1, floors - 2) } }), box(-20, 10, H, 70, 70, 30, shade(c, -0.3)));
  } else if (family === 'brick') {
    const c = tint || pick(BRICK);
    parts.push(box(0, 0, 0, 240, 190, H, c, { win: { cols: 4, rows: floors } }), box(0, 0, H, 256, 206, 12, pick(STONE)));
    if (v % 2) parts.push(cyl(60, 40, H + 40, 28, 50, '#7a5a44', { n: 8 }), line([60, 40, H + 12], [60, 40, H + 40], 2));
  } else if (family === 'loft') {
    const c = tint || pick(BRICK);
    parts.push(box(0, 0, 0, 290, 210, H, c, { win: { cols: 5, rows: floors } }), box(-70, 0, H, 60, 60, 46, shade(c, -0.2)));
    if (v % 2) parts.push(cyl(90, -50, 0, 16, H + 150, '#8f4a3c', { n: 8 }));
  } else if (family === 'shop') { // a row of storefronts with awnings
    const n = 3;
    for (let k = 0; k < n; k++) { const c = PASTEL[(v + k * 2 + floors) % PASTEL.length], hh = H + ((k + v) % 2) * 18; parts.push(box(-90 + k * 90, 0, 0, 88, 130, hh, c, { win: { cols: 2, rows: floors } }), box(-90 + k * 90, -72, FL * 0.7, 80, 22, 8, PASTEL[(v + k + 3) % PASTEL.length])); }
  } else if (family === 'house') { // bay-and-gable houses
    const n = v % 2 ? 2 : 1;
    for (let k = 0; k < n; k++) { const x = (k - (n - 1) / 2) * 112, c = tint || BRICK[(v + k) % BRICK.length]; parts.push(box(x, 0, 0, 104, 150, H, c, { win: { cols: 2, rows: floors } }), gable(x, 0, H, 110, 156, 64, 'y', ROOF[(v + k) % ROOF.length]), box(x + 30, 40, H + 20, 14, 14, 60, '#6a4a4e')); }
  } else if (family === 'cottage') {
    const c = tint || pick(['#e8dcc0', '#c9d8c0', '#d8c0b0', '#b8ccd8']);
    parts.push(box(0, 0, 0, 150, 120, FL, c, { win: { cols: 3, rows: 1 } }), pyr(0, 0, FL, 164, 134, 56, pick(ROOF)));
  } else if (family === 'shed') {
    const c = tint || pick(['#8a94a0', '#a09a8a', '#7a8a84', '#b0a08a']);
    parts.push(box(0, 0, 0, 300, 180, FL * 1.6, c, { win: { cols: 5, rows: 1, dark: true } }), gable(0, 0, FL * 1.6, 304, 184, 36, 'x', shade(c, -0.2)));
    if (v % 2) for (let k = 0; k < 3; k++) parts.push(box(-90 + k * 62, 150, 0, 56, 56, 26 * (1 + ((k + v) % 3)), PASTEL[(k + v) % PASTEL.length]));
  } else if (family === 'silo') {
    for (let k = 0; k < 3; k++) parts.push(cyl(-70 + k * 70, 0, 0, 38, H, pick(STONE), { n: 10 }), cone(-70 + k * 70, 0, H, 38, 22, '#8a8478'));
    parts.push(box(0, 0, H, 200, 30, 20, '#7a756a'));
  } else if (family === 'pavilion') {
    const c = tint || pick(STONE);
    parts.push(box(0, 0, 0, 260, 200, H, c, { win: { cols: 5, rows: floors, dark: true } }), pyr(0, 0, H, 276, 216, 70, '#5a8a80'), line([0, 0, H + 70], [0, 0, H + 150], 1.2));
  } else if (family === 'gothic') {
    const c = tint || pick(STONE);
    parts.push(box(0, 0, 0, 260, 150, H, c, { win: { cols: 5, rows: floors } }), gable(0, 0, H, 266, 156, 60, 'x', pick(ROOF)), box(-100, 0, 0, 62, 62, H + 90, shade(c, -0.08), { win: { cols: 1, rows: floors + 1 } }), pyr(-100, 0, H + 90, 68, 68, 70, '#5a8a80'));
  } else { // bungalow
    const c = tint || pick(['#e0d2b0', '#c8b8a0', '#d8c8c0', '#b8c0b0']);
    parts.push(box(0, 0, 0, 170, 120, FL, c, { win: { cols: 3, rows: 1 } }), gable(0, 0, FL, 178, 128, 44, 'x', pick(ROOF)));
  }
  return parts;
}

// ---------------------------------------------------------------- landmarks
const W1 = '#ece6d8', CONC = '#d2cabb', GLS = '#5a93b0', DARKG = '#2f3a4a', BRK = '#a8563f', SAND = '#c9a878', COPPER = '#5a9a88';
export const LANDMARKS = {
  cnTower: () => [cyl(0, 0, 0, 70, 560, CONC, { r2: 24, n: 9 }), cyl(0, 0, 560, 24, 470, CONC, { r2: 18, n: 9 }), cyl(0, 0, 1030, 62, 26, '#a59c8c', { n: 14 }), cyl(0, 0, 1056, 92, 44, W1, { n: 14 }), cyl(0, 0, 1100, 78, 34, DARKG, { n: 14, win: { cols: 1, rows: 1 }, lit: 1 }), cyl(0, 0, 1134, 50, 30, W1, { n: 14 }), cyl(0, 0, 1164, 15, 240, CONC, { r2: 10, n: 8 }), cyl(0, 0, 1404, 26, 26, W1, { n: 12 }), line([0, 0, 1430], [0, 0, 1780], 1.6)],
  rogers: () => [cyl(0, 0, 0, 310, 110, CONC, { n: 18, win: { cols: 1, rows: 1, dark: true } }), dome(0, 0, 110, 300, 170, W1, { ribs: 6 })],
  arena: () => [box(0, 0, 0, 400, 300, 120, '#b9ad96', { win: { cols: 8, rows: 2 } }), box(0, 0, 120, 340, 250, 30, '#8a94a0'), box(0, 0, 150, 240, 170, 20, '#7a8490')],
  union: () => [box(0, 0, 0, 660, 150, 100, '#c9bfa8', { win: { cols: 16, rows: 1, dark: true } }), box(0, 0, 100, 680, 166, 14, '#b9ad96'), box(0, 10, 0, 200, 190, 150, '#c9bfa8', { win: { cols: 4, rows: 2, dark: true } }), gable(0, 10, 150, 206, 196, 40, 'x', '#8a8478')],
  cityHall: () => { // two curved towers cupping a saucer
    const parts = [box(0, 0, 0, 520, 420, 40, CONC), cyl(0, 20, 40, 110, 46, W1, { n: 14 }), dome(0, 20, 86, 110, 40, W1)];
    for (const [side, H] of [[-1, 520], [1, 680]]) for (let k = -2; k <= 2; k++) { const a = k * 0.34, r = 230; parts.push(box(side * r * Math.cos(a), 20 + r * Math.sin(a) * 0.9, 40, 46, 96, H, k === 0 ? '#bfb8a8' : CONC, { rot: side * a, win: side < 0 ? { cols: 1, rows: 12, dark: true } : { cols: 1, rows: 16, dark: true } })); }
    return parts;
  },
  oldCityHall: () => [box(0, 0, 0, 330, 280, 150, SAND, { win: { cols: 7, rows: 3 } }), gable(0, 0, 150, 336, 286, 60, 'x', COPPER), box(0, -110, 0, 76, 76, 430, SAND, { win: { cols: 1, rows: 5 } }), box(0, -110, 430, 90, 90, 40, '#d8c8a0'), pyr(0, -110, 470, 84, 84, 120, COPPER)],
  fcp: () => [box(0, 0, 0, 230, 230, 1180, '#e6e2d8', { win: { cols: 5, rows: 30 } }), box(0, 0, 1180, 110, 110, 40, '#bdb6a8'), line([20, 0, 1220], [20, 0, 1380], 1.4)],
  td: () => [box(-150, 40, 0, 190, 150, 900, '#23262e', { win: { cols: 5, rows: 24 }, lit: 0.5 }), box(120, -60, 0, 190, 150, 720, '#23262e', { win: { cols: 5, rows: 20 }, lit: 0.5 }), box(100, 190, 0, 170, 140, 560, '#2b2e38', { win: { cols: 5, rows: 15 }, lit: 0.5 }), box(-60, -170, 0, 220, 130, 60, '#23262e')],
  scotia: () => [box(0, 0, 0, 220, 220, 980, '#a8483c', { win: { cols: 5, rows: 26 } }), box(-30, 0, 980, 150, 220, 70, '#a8483c', { win: { cols: 3, rows: 2 } }), box(-55, 0, 1050, 90, 220, 60, '#983e34')],
  royal: () => [prism([[-170, -110], [10, -110], [-80, 110]], 0, 620, '#c9a23a', { win: { cols: 6, rows: 16 }, lit: 0.9 }), prism([[40, -70], [200, -70], [200, 130]], 0, 480, '#c9a23a', { win: { cols: 6, rows: 12 }, lit: 0.9 })],
  rom: () => [box(0, 60, 0, 440, 240, 140, '#b9a68a', { win: { cols: 9, rows: 3, dark: true } }), gable(0, 60, 140, 446, 246, 40, 'x', '#6a6660'), prism([[-200, -40], [-40, -160], [60, -30], [-80, 40]], 0, 300, '#c8d0d6', { taper: 0.35 }), prism([[-30, -30], [150, -150], [220, -20], [80, 40]], 0, 240, '#b4bec6', { taper: 0.2 }), prism([[-110, -150], [40, -210], [20, -60]], 0, 190, '#d8dee2', { taper: 0.3 })],
  legislature: () => [box(0, 0, 0, 600, 190, 130, '#c08a78', { win: { cols: 13, rows: 3 } }), gable(0, 0, 130, 606, 196, 50, 'x', '#5a6a66'), box(0, -10, 0, 190, 230, 200, '#c08a78', { win: { cols: 4, rows: 4 } }), pyr(0, -10, 200, 200, 240, 110, '#5a6a66'), box(-230, 0, 130, 60, 60, 90, '#c08a78'), pyr(-230, 0, 220, 66, 66, 60, COPPER), box(230, 0, 130, 60, 60, 90, '#c08a78'), pyr(230, 0, 220, 66, 66, 60, COPPER)],
  uc: () => [box(0, 0, 0, 520, 150, 100, '#b5a88e', { win: { cols: 12, rows: 2 } }), gable(0, 0, 100, 526, 156, 54, 'x', '#6a5a4e'), box(-30, -20, 0, 84, 84, 280, '#b5a88e', { win: { cols: 1, rows: 4 } }), pyr(-30, -20, 280, 92, 92, 80, '#6a5a4e'), cyl(200, -60, 0, 50, 130, '#b5a88e', { n: 10 }), cone(200, -60, 130, 56, 70, '#6a5a4e')],
  casaLoma: () => [box(0, 0, 0, 460, 250, 150, '#a8a498', { win: { cols: 9, rows: 3 } }), gable(0, 0, 150, 300, 256, 70, 'x', '#a8483c'), cyl(-210, -90, 0, 52, 330, '#a8a498', { n: 10, win: { cols: 1, rows: 4 } }), cone(-210, -90, 330, 60, 110, '#a8483c'), cyl(210, 60, 0, 60, 260, '#a8a498', { n: 10 }), cyl(210, 60, 260, 68, 26, '#98948a', { n: 10 }), box(60, -130, 0, 80, 60, 210, '#a8a498'), pyr(60, -130, 210, 86, 66, 60, '#a8483c')],
  ago: () => [box(0, 30, 0, 460, 240, 110, '#c9bfa8', { win: { cols: 8, rows: 2 } }), box(40, 110, 110, 300, 120, 150, '#3a6aa0'), prism(rect(0, -110, 480, 70), 30, 110, '#9ac0d0', { taper: 0.92, win: { cols: 14, rows: 2, dark: true } }), path(arch(-240, -145, 240, -145, 140, 30), 1.4, '#7a5a3a')],
  ocad: () => { const parts = [box(-40, 80, 0, 300, 160, 110, BRK, { win: { cols: 6, rows: 3 } }), box(20, -30, 290, 360, 130, 70, W1, { win: { cols: 9, rows: 2, dark: true } })]; [['#d94b4b', -130, -70], ['#e0b43a', -50, 10], ['#3a8ad0', 40, -70], ['#4aa86a', 120, 10], ['#b05ac0', 180, -60], ['#e07a3a', -100, 10]].forEach(([c, x, y], k) => parts.push(line([x + (k % 2 ? 30 : -30), y, 0], [x, y, 290], 3.2, c))); return parts; },
  stLawrence: () => [box(0, 0, 0, 440, 210, 110, BRK, { win: { cols: 9, rows: 2 } }), gable(0, 0, 110, 446, 216, 70, 'x', '#6a5a4e'), box(0, -110, 0, 120, 30, 150, '#b5694a', { win: { cols: 3, rows: 2, dark: true } }), gable(0, -110, 150, 126, 36, 40, 'y', '#6a5a4e')],
  flatiron: () => [prism([[-150, -50], [150, -90], [150, 90]], 0, 230, '#a8563f', { win: { cols: 7, rows: 5 } }), prism([[-156, -52], [156, -94], [156, 94]], 230, 16, COPPER), cyl(-140, -44, 0, 26, 250, '#a8563f', { n: 8 }), cone(-140, -44, 250, 32, 90, COPPER)],
  distillery: () => [box(-120, 0, 0, 260, 160, 150, '#8f4a3c', { win: { cols: 6, rows: 4 } }), gable(-120, 0, 150, 266, 166, 50, 'x', '#4e4a4a'), box(120, 60, 0, 200, 240, 110, '#a8563f', { win: { cols: 4, rows: 3 } }), gable(120, 60, 110, 206, 246, 44, 'y', '#4e4a4a'), cyl(60, -90, 0, 22, 430, '#8f4a3c', { r2: 15, n: 8 }), box(-120, 0, 200, 50, 50, 50, W1), pyr(-120, 0, 250, 56, 56, 40, COPPER)],
  gates: () => { const parts = [box(-70, 0, 0, 60, 70, 210, W1), box(70, 0, 0, 60, 70, 210, W1), box(0, 0, 210, 220, 80, 46, W1), path(arch(-40, -36, 40, -36, 110, 90), 1.6), line([0, 0, 256], [0, 0, 350], 2.4, '#8a8478'), path([[-26, 0, 320], [0, 0, 350], [26, 0, 320]], 1.6, '#8a8478')]; for (const sd of [-1, 1]) for (let k = 1; k <= 6; k++) parts.push(cyl(sd * (100 + k * 46), -k * k * 2.2, 0, 9, 120, W1, { n: 6 })); for (const sd of [-1, 1]) parts.push(path(Array.from({ length: 7 }, (_, k) => [sd * (100 + k * 46), -k * k * 2.2, 124]), 2.4, '#cfc8ba')); return parts; },
  bmo: () => [cyl(0, 0, 0, 330, 60, '#9aa0a8', { n: 14 }), cyl(0, 0, 60, 300, 4, '#4f9a5a', { n: 14, ink: false }), box(0, 250, 60, 420, 90, 110, '#c8483c'), box(0, -250, 60, 420, 90, 80, '#8a94a0'), box(-290, 0, 60, 80, 300, 70, '#8a94a0'), path([[-180, 0, 66], [180, 0, 66]], 1, W1), path(ngon(0, 0, 60, 12).map(([x, y]) => [x, y, 66]).concat([[60, 0, 66]]), 1, W1)],
  cinesphere: () => { const parts = [dome(0, 0, 90, 170, 200, W1, { ribs: 7 })]; for (const [x, y] of [[-110, -60], [110, -60], [0, 110]]) parts.push(line([x, y, 0], [x * 0.7, y * 0.7, 100], 2.4, '#8a8478')); for (const [x, y] of [[330, 40], [520, -60], [440, 200]]) { parts.push(box(x, y, 110, 150, 150, 70, W1, { win: { cols: 3, rows: 1, dark: true } })); for (const [dx, dy] of [[-60, -60], [60, -60], [60, 60], [-60, 60]]) parts.push(line([x + dx, y + dy, 0], [x + dx, y + dy, 110], 1.6, '#8a8478')); } return parts; },
  airport: () => [box(0, 0, 0, 300, 110, 50, '#c9d0d4', { win: { cols: 8, rows: 1, dark: true } }), cyl(180, 40, 0, 20, 170, CONC, { n: 8 }), cyl(180, 40, 170, 34, 34, DARKG, { n: 8 }), box(-330, -160, 30, 240, 30, 26, W1), box(-330, -160, 40, 40, 260, 8, W1), box(-430, -160, 50, 14, 90, 8, '#c8483c'), box(-420, -160, 40, 30, 8, 60, '#c8483c')],
  lighthouse: () => [cyl(0, 0, 0, 46, 230, '#d8d0c0', { r2: 30, n: 8 }), cyl(0, 0, 230, 36, 14, '#6a6660', { n: 8 }), cyl(0, 0, 244, 24, 40, '#c8483c', { n: 8, win: { cols: 1, rows: 1 }, lit: 1 }), cone(0, 0, 284, 28, 36, '#8a3a34')],
  humberBridge: () => { const parts = [path([[-330, 0, 40], [330, 0, 40]], 3, '#cfc8ba')]; for (const y of [-34, 34]) { const a = arch(-300, y, 300, y * 0.2, 40, 250, 14); parts.push(path(a, 2.6, W1)); for (let k = 2; k < 13; k += 2) parts.push(line(a[k], [a[k][0], 0, 40], 0.8, '#8a8478')); } return parts; },
  viaduct: () => { const parts = [box(0, 0, 150, 1100, 60, 24, '#b9ad96')]; for (let k = -2; k <= 2; k++) { parts.push(box(k * 220, 0, 0, 40, 56, 150, '#a79d88')); if (k < 2) for (const y of [-26, 26]) parts.push(path(arch(k * 220 + 20, y, k * 220 + 200, y, 60, 90, 8), 1.8, '#4a4a52')); } return parts; },
  brickworks: () => [box(0, 0, 0, 380, 160, 70, '#a8563f', { win: { cols: 9, rows: 1, dark: true } }), gable(0, 0, 70, 386, 166, 50, 'x', '#6a5a4e'), box(40, 190, 0, 300, 140, 60, '#8f4a3c'), gable(40, 190, 60, 306, 146, 44, 'x', '#6a5a4e'), cyl(-150, 110, 0, 24, 420, '#a8563f', { r2: 16, n: 8 })],
  hearn: () => [box(0, 0, 0, 620, 240, 230, '#a8563f', { win: { cols: 14, rows: 3, dark: true } }), box(120, 0, 230, 320, 200, 60, '#8f4a3c'), cyl(-360, 40, 0, 44, 820, '#c9bfa8', { r2: 30, n: 9 }), cyl(-360, 40, 820, 30, 60, '#c8483c', { n: 9 }), cyl(-360, 40, 880, 30, 50, W1, { n: 9 })],
  redpath: () => { const parts = [box(-120, 0, 0, 260, 180, 190, '#d8d0c0', { win: { cols: 5, rows: 4, dark: true } }), box(-120, 0, 190, 150, 120, 60, '#c8483c')]; for (let k = 0; k < 3; k++) parts.push(cyl(80 + k * 86, 20, 0, 42, 210, CONC, { n: 10 }), cone(80 + k * 86, 20, 210, 42, 24, '#9a948a')); parts.push(box(40, -190, 0, 460, 70, 34, '#3a4a5a'), box(180, -190, 34, 90, 60, 50, W1, { win: { cols: 3, rows: 2, dark: true } })); return parts; },
  eaton: () => [box(0, 0, 0, 150, 680, 100, '#c9d0d4', { win: { cols: 2, rows: 3 } }), gable(0, 0, 100, 150, 680, 60, 'y', '#9ac0d0'), box(-110, -200, 0, 110, 200, 330, GLS, { win: { cols: 3, rows: 9 } })],
  rcHarris: () => [box(0, 0, 0, 520, 150, 110, '#e0d2b0', { win: { cols: 12, rows: 2, dark: true } }), box(0, 0, 110, 200, 160, 110, '#e0d2b0', { win: { cols: 4, rows: 2, dark: true } }), pyr(0, 0, 220, 210, 170, 50, COPPER), box(0, -230, 0, 280, 120, 80, '#e0d2b0', { win: { cols: 6, rows: 1, dark: true } }), gable(0, -230, 80, 286, 126, 30, 'x', COPPER)],
  sunnyside: () => { const parts = [box(0, 0, 0, 440, 100, 70, '#ece0c4'), gable(0, 0, 70, 446, 106, 34, 'x', '#b5694a'), box(0, 0, 0, 120, 130, 110, '#ece0c4'), pyr(0, 0, 110, 128, 138, 50, '#b5694a')]; for (let k = -4; k <= 4; k++) if (k) parts.push(path(arch(k * 46 - 16, -52, k * 46 + 16, -52, 10, 44, 6), 1.2, '#7a5a3a')); return parts; },
  ferris: () => { const parts = [], R0 = 190, zc = 230; const ring = Array.from({ length: 19 }, (_, k) => [Math.cos((k / 18) * 6.2832) * R0, 0, zc + Math.sin((k / 18) * 6.2832) * R0]); parts.push(path(ring, 2.2, '#c8483c')); for (let k = 0; k < 9; k++) { parts.push(line([0, 0, zc], ring[k * 2], 0.8, '#8a8478')); parts.push(box(ring[k * 2][0], 0, ring[k * 2][2] - 24, 22, 22, 20, PASTEL[k % PASTEL.length], { ink: false })); } parts.push(line([-110, -50, 0], [0, 0, zc], 2.4, W1), line([110, -50, 0], [0, 0, zc], 2.4, W1), line([-110, 50, 0], [0, 0, zc], 2.4, W1), line([110, 50, 0], [0, 0, zc], 2.4, W1)); return parts; },
  thomson: () => [cyl(0, 0, 0, 170, 110, '#7aa8c0', { r2: 120, n: 14, win: { cols: 1, rows: 3, dark: true } }), cyl(0, 0, 110, 120, 10, '#5a8098', { n: 14 })],
  ferry: () => [prism([[-150, -40], [130, -40], [170, 0], [130, 40], [-150, 40]], 0, 34, W1), box(-10, 0, 34, 200, 60, 34, W1, { win: { cols: 8, rows: 1, dark: true } }), box(-10, 0, 68, 120, 44, 24, '#c8483c'), cyl(-30, 0, 92, 10, 40, '#23262e', { n: 6 })],
  sail: () => [prism([[-60, -16], [50, -16], [80, 0], [50, 16], [-60, 16]], 0, 16, W1), line([0, 0, 16], [0, 0, 210], 1.2), prism([[4, -2], [70, -2], [4, 2]], 30, 170, '#f4efe2', { taper: 0.02, ink: false }), prism([[-4, -2], [-4, 2], [-50, 2]], 30, 130, '#e8c8b0', { taper: 0.02, ink: false })],
};
export function treeSprite(kind, seed) { // trees look the same from every side
  const R = rng(seed), w = 34, h = 46, cv = document.createElement('canvas'); cv.width = w * SS; cv.height = h * SS; const g = cv.getContext('2d'); g.scale(SS, SS); g.translate(w / 2, h - 5); g.lineCap = 'round';
  g.fillStyle = 'rgba(10,12,40,.2)'; g.beginPath(); g.ellipse(2, 1, 9, 4, 0, 0, 6.3); g.fill(); g.strokeStyle = '#5a4030'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -12); g.stroke();
  const c = kind === 2 ? ['#c9783a', '#d99a3a', '#b85a34'][Math.floor(R() * 3)] : ['#4f8a5a', '#5a9a66', '#3f7a58', '#6aa860'][Math.floor(R() * 4)];
  if (kind === 1) { g.fillStyle = shade(c, -0.15); g.beginPath(); g.moveTo(-9, -8); g.lineTo(0, -36); g.lineTo(9, -8); g.fill(); g.strokeStyle = INK; g.globalAlpha = .7; g.lineWidth = .9; g.stroke(); }
  else { for (const [x, y, r] of [[-5, -18, 8], [5, -19, 8], [0, -27, 9], [0, -16, 7]]) { g.fillStyle = shade(c, (R() - .5) * 0.2); g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); } g.strokeStyle = INK; g.globalAlpha = .6; g.lineWidth = .9; g.beginPath(); g.arc(0, -21, 13.5, 0.4, 6.0); g.stroke(); }
  return { cv, w, h, ox: w / 2, oy: h - 5, top: h - 5, half: 12 };
}
