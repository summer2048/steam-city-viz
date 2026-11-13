// 蒸汽之城 — part 2: an illustrated map of Toronto you can turn around. Three layers:
// the whole city → a genre's neighbourhood → one building (one game, or many).
import { $, fmt, clamp, lerp, smooth, rng, rline, INK, PAPER_C, makePaper, makeCloud, drawBalloon, lang } from './draw.js';
import { renderSprite, generic, LANDMARKS, treeSprite, SINP, COSP, SP, SS, ANG, shade } from './models.js?v=20261113a';
import { toGrid, BOUNDS, SHORE, ISLAND, SPIT, ONTARIO_PLACE, DON, HUMBER, PARKS, ROADS, RUNWAY, LANDMARKS_AT, DISTRICTS } from './toronto.js?v=20261113a';

const T = {
  en: {
    names: { Action: 'Action', Adventure: 'Adventure', RPG: 'RPG', Strategy: 'Strategy', Simulation: 'Simulation', Casual: 'Casual', Sports: 'Sports', Racing: 'Racing', Other: 'Everything else' },
    back: '← Timeline', all: '← Whole city', toDistrict: (n) => `← ${n}`, postcard: 'Greetings from the City of Steam', lake: 'Lake Ontario', turn: 'Drag to move · scroll to zoom · turn the map',
    head: 'The city, on a map', sub: 'Steam’s genres have moved into Toronto. Pick a neighbourhood, a billboard, or any building.',
    k1: '<b>One building</b> is one game, or many: famous games get a tower to themselves, obscure ones share a house.',
    k2: '<b>Height</b> follows the most-reviewed game inside. Each genre crowds around its landmarks and thins out towards the edge of town.',
    k3: '<b>Lit windows</b> show how many of its games have 10+ reviews. A <b>gold light</b> on the roof means a top-1% game lives there.',
    row: (c, lit) => `${c} games · ${lit}% lit`, lives: (h) => `lives in ${h}`,
    fact: (d) => `<b>${d.count}</b> games in <b>${d.lots}</b> buildings. <b>${d.lit}%</b> have at least 10 reviews, and <b>${d.gold}</b> are in the city's top 1%. ${d.solo === 1 ? 'The best-known game has a tower to itself' : `The ${d.solo} best-known games have a tower each`}; the last house on the edge holds ${d.last}.`,
    hint: 'Click a building to see who lives there, or try the billboard.',
    boardBtn: 'Deal me a hand from the billboard', boardNow: 'Now on the billboard', cityBoard: 'Yonge–Dundas Square: all of Steam',
    trayHead: (n) => `A hand from ${n}`, trayAll: 'A hand from the whole city', trayNote: 'Eight games drawn at random; the more reviews a game has, the likelier it is to come up. Pick one.', again: 'Deal again',
    solo: 'A tower of its own', house: (n) => `A house of ${n} games`,
    rank: (a, b, n) => (a === b ? `Ranked #${a} in ${n} by reviews.` : `Ranked #${a} to #${b} in ${n} by reviews.`),
    range: (lo, hi) => (lo === hi ? `Each has ${lo} reviews.` : `Their review counts run from ${hi} down to ${lo}.`),
    loading: 'Fetching the residents’ list…', more: (n) => `Show ${n} more`, wait: 'Unrolling the map…',
    tipSolo: (name, r) => `${name} · ${r} reviews`, tipHouse: (n, top) => (top ? `${n} games · best known: ${top}` : `${n} games`), tipBoard: (name) => `On the billboard: ${name} · click for a hand of games`,
    reviews: (n) => `${n} reviews`,
  },
  zh: {
    names: { Action: '动作', Adventure: '冒险', RPG: '角色扮演', Strategy: '策略', Simulation: '模拟', Casual: '休闲', Sports: '体育', Racing: '竞速', Other: '其他' },
    back: '← 回到时间线', all: '← 全城', toDistrict: (n) => `← ${n}`, postcard: '来自蒸汽之城的明信片', lake: '安大略湖', turn: '拖动平移 · 滚轮缩放 · 转动地图',
    head: '地图上的城市', sub: 'Steam 的各个类型搬进了多伦多。选一个街区、一块广告牌，或任意一栋楼。',
    k1: '<b>一栋楼</b>是一款游戏，也可能是很多款：出名的游戏独占一座塔，冷门的合住一间小屋。',
    k2: '<b>高度</b>取决于楼里评论最多的那款游戏。每个类型围着自己的地标聚集，越往城边越稀疏。',
    k3: '<b>亮着的窗</b>表示楼里有多少游戏的评论达到 10 条。<b>楼顶的金灯</b>表示里面住着关注度前 1% 的游戏。',
    row: (c, lit) => `${c} 款 · ${lit}% 亮灯`, lives: (h) => `住在${h}`,
    fact: (d) => `<b>${d.count}</b> 款游戏，住在 <b>${d.lots}</b> 栋楼里。<b>${d.lit}%</b> 的评论达到 10 条，<b>${d.gold}</b> 款进了全城前 1%。最出名的 ${d.solo} 款各自独占一座塔；最边上的那间小屋里挤着 ${d.last} 款。`,
    hint: '点任意一栋楼看看里面住着谁，或者试试广告牌。',
    boardBtn: '从广告牌上抽一手游戏', boardNow: '广告牌正在播放', cityBoard: '央街–登打士广场：整个 Steam',
    trayHead: (n) => `${n}街区抽出的一手`, trayAll: '全城抽出的一手', trayNote: '随机抽出八款；评论越多的游戏越容易被抽中。选一款看看。', again: '再抽一次',
    solo: '独占一座塔', house: (n) => `${n} 款游戏合住的小屋`,
    rank: (a, b, n) => (a === b ? `按评论数在${n}类里排第 ${a}。` : `按评论数在${n}类里排第 ${a} 到第 ${b}。`),
    range: (lo, hi) => (lo === hi ? `每款都是 ${lo} 条评论。` : `评论数从 ${hi} 条到 ${lo} 条。`),
    loading: '正在取住户名册…', more: (n) => `再显示 ${n} 款`, wait: '正在展开地图…',
    tipSolo: (name, r) => `${name} · ${r} 条评论`, tipHouse: (n, top) => (top ? `${n} 款游戏 · 最出名的是 ${top}` : `${n} 款游戏`), tipBoard: (name) => `广告牌：${name} · 点击抽一手游戏`,
    reviews: (n) => `${n} 条评论`,
  },
};
const GENRE_IDX = ['Action', 'Adventure', 'RPG', 'Strategy', 'Simulation', 'Casual', 'Sports', 'Racing', 'Other']; // order used in cols.bin
const TS = 0.22, BK = 1.5, PITCHM = 300, TOTAL_LOTS = 540; // map texture px per metre, building exaggeration, lot spacing
const { u0, u1, v0, v1 } = BOUNDS;
const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const inPoly = (p, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside; } return inside; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const lineDist = (p, pts) => { let m = 1e9; for (let k = 0; k < pts.length - 1; k++) m = Math.min(m, segDist(p, pts[k], pts[k + 1])); return m; };
const floorsOf = (maxRev) => 1 + Math.round(2.3 * Math.log10(1 + maxRev));

// ---------------------------------------------------------- geography in grid metres
const G = (() => {
  const shore = SHORE.map(toGrid), mainland = [...shore, [shore[shore.length - 1][0], v1 + 4000], [shore[0][0], v1 + 4000]];
  const island = ISLAND.map(toGrid), spit = SPIT.map(toGrid), op = ONTARIO_PLACE.map(([la, lo, r]) => [...toGrid([la, lo]), r]);
  const parks = PARKS.map(([la, lo, a, b]) => [...toGrid([la, lo]), a, b]), don = DON.map(toGrid), humber = HUMBER.map(toGrid);
  const roads = ROADS.map(([kind, name, pts]) => ({ kind, name, pts: pts.map(toGrid) })), runway = RUNWAY.map((r) => r.map(toGrid));
  const inPark = (p) => parks.some(([x, y, a, b]) => ((p[0] - x) / a) ** 2 + ((p[1] - y) / b) ** 2 < 1.15);
  const onLand = (p) => inPoly(p, mainland) || inPoly(p, island);
  return { shore, mainland, island, spit, op, parks, don, humber, roads, runway, inPark, onLand };
})();

// ---------------------------------------------------------- the map sheet, painted once
function paintMap(dist) {
  const w = Math.round((u1 - u0) * TS), h = Math.round((v1 - v0) * TS), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), R = rng(21), X = (u) => (u - u0) * TS, Y = (v) => (v1 - v) * TS;
  const trace = (pts, close) => { g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); if (close) g.closePath(); };
  const lands = () => { g.beginPath(); for (const poly of [G.mainland, G.island, G.spit]) { poly.forEach((p, k) => (k ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.closePath(); } for (const [x, y, r] of G.op) { g.moveTo(X(x) + r * TS, Y(y)); g.arc(X(x), Y(y), r * TS, 0, 6.3); } };
  g.lineCap = 'round'; g.lineJoin = 'round';
  // lake
  const lk = g.createLinearGradient(0, 0, 0, h); lk.addColorStop(0, '#6f9db8'); lk.addColorStop(1, '#3f6f94'); g.fillStyle = lk; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { const x = R() * w, y = R() * h, r = 80 + R() * 260, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${0.03 + R() * 0.05})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let k = 0; k < 900; k++) { const x = R() * w, y = R() * h, l = 8 + R() * 26; g.strokeStyle = R() < 0.5 ? 'rgba(243,234,216,.28)' : 'rgba(20,40,80,.22)'; rline(g, R, x, y, x + l, y + (R() - .5) * 3, .8, 1); }
  // surf, then land
  lands(); g.strokeStyle = 'rgba(243,234,216,.5)'; g.lineWidth = 16; g.stroke(); g.strokeStyle = 'rgba(243,234,216,.4)'; g.lineWidth = 30; g.stroke();
  lands(); g.fillStyle = '#e8dcc2'; g.fill();
  g.save(); lands(); g.clip();
  for (let k = 0; k < 60; k++) { const x = R() * w, y = R() * h, r = 100 + R() * 300, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(160,130,80,${0.03 + R() * 0.05})`); gr.addColorStop(1, 'rgba(160,130,80,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // each genre stains the ground around its cores
  for (const d of dist) for (const [x, y, pull] of d.cores) { const r = 1500 * pull * TS, gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r), c = shade(d.color, 0.25).replace('rgb', 'rgba'); gr.addColorStop(0, c.replace(')', ',.42)')); gr.addColorStop(0.6, c.replace(')', ',.2)')); gr.addColorStop(1, c.replace(')', ',0)')); g.fillStyle = gr; g.fillRect(X(x) - r, Y(y) - r, r * 2, r * 2); }
  // green: islands, spit, valleys, parks
  for (const poly of [G.island, G.spit]) { trace(poly, true); g.fillStyle = 'rgba(140,180,120,.55)'; g.fill(); }
  g.strokeStyle = 'rgba(140,180,120,.7)'; g.lineWidth = 480 * TS; trace(G.don); g.stroke(); g.lineWidth = 320 * TS; trace(G.humber); g.stroke();
  for (const [x, y, a, b] of G.parks) { g.fillStyle = `rgba(${130 + R() * 20},${175 + R() * 12},${112 + R() * 16},.9)`; g.beginPath(); for (let k = 0; k <= 16; k++) { const t = (k / 16) * 6.2832, j = 0.9 + R() * 0.2; g.lineTo(X(x + Math.cos(t) * a * j), Y(y + Math.sin(t) * b * j)); } g.fill(); }
  // faint street grid, then named streets
  g.strokeStyle = 'rgba(120,95,60,.17)'; for (let u = Math.ceil(u0 / 420) * 420; u < u1; u += 420) rline(g, R, X(u), 0, X(u), h, 1.2, 1); for (let v = Math.ceil(v0 / 420) * 420; v < v1; v += 420) rline(g, R, 0, Y(v), w, Y(v), 1.2, 1);
  g.strokeStyle = '#5f93b4'; g.lineWidth = 70 * TS; trace(G.don); g.stroke(); g.lineWidth = 60 * TS; trace(G.humber); g.stroke();
  for (const r of G.roads) {
    if (r.kind === 'rail') { g.setLineDash([10, 7]); g.strokeStyle = 'rgba(23,26,46,.55)'; g.lineWidth = 2.2; trace(r.pts); g.stroke(); g.setLineDash([]); continue; }
    g.strokeStyle = 'rgba(23,26,46,.4)'; g.lineWidth = (r.kind === 'hwy' ? 78 : 58) * TS + 2.4; trace(r.pts); g.stroke();
    g.strokeStyle = r.kind === 'hwy' ? '#e9b676' : '#f7f0e0'; g.lineWidth = (r.kind === 'hwy' ? 78 : 58) * TS; trace(r.pts); g.stroke();
  }
  g.strokeStyle = '#8a8a90'; g.lineWidth = 60 * TS; for (const r of G.runway) { trace(r); g.stroke(); }
  g.restore();
  // shoreline in ink
  g.strokeStyle = INK;
  for (const poly of [G.shore, [...G.island, G.island[0]], [...G.spit, G.spit[0]]]) for (let k = 0; k < poly.length - 1; k++) rline(g, R, X(poly[k][0]), Y(poly[k][1]), X(poly[k + 1][0]), Y(poly[k + 1][1]), 1.4, 1.8);
  for (const [x, y, r] of G.op) { g.lineWidth = 1.6; g.globalAlpha = .85; g.beginPath(); g.arc(X(x), Y(y), r * TS, 0, 6.3); g.stroke(); g.globalAlpha = 1; }
  // compass and frame
  const cx = X(u0 + 1500), cy = Y(v0 + 1300); g.save(); g.translate(cx, cy); g.rotate((-16.7 * Math.PI) / 180); g.strokeStyle = 'rgba(243,234,216,.9)'; g.fillStyle = 'rgba(243,234,216,.9)'; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, 70, 0, 6.3); g.stroke(); g.beginPath(); g.moveTo(0, -100); g.lineTo(16, 0); g.lineTo(0, 100); g.lineTo(-16, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(0, -100); g.lineTo(16, 0); g.lineTo(-16, 0); g.fill(); g.font = 'italic 700 44px Georgia, serif'; g.textAlign = 'center'; g.fillText('N', 0, -112); g.restore();
  g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.strokeStyle = 'rgba(243,234,216,.8)'; g.lineWidth = 3; g.strokeRect(14, 14, w - 28, h - 28);
  return { cv, w, h };
}

// ---------------------------------------------------------- the scene
export function createDistricts({ cv, g, openCard, closeCard, getMouse, onExit }) {
  let ready = false, loading = null, active = false, fade = 0, cam = null, tgt = null, bal = null, big = null, namesReady = false, paper, clouds, map;
  let dist = [], order = [], items = [], boards = [], view = { type: 'city' }, hover = null, hoverD = -1, drag = null, moved = false, sortedTh = 99, pools = null;
  const cache = new Map(), puffs = [], root = $('#part2'), guide = $('#guide'), tip = $('#tip'), t = () => T[lang], dn = (d) => t().names[d.key];
  let budget = 0;
  function sprite(it, bucket) { // cached per view angle; new ones are drawn a few per frame so turning never stalls
    if (it.kind === 'tree') return it.sp;
    const k = it.key + '|' + bucket; let s = cache.get(k);
    if (!s && budget > 0) { budget--; s = renderSprite(it.parts(), (bucket / ANG) * 6.2832, { seed: it.seed, lit: it.lit }); cache.set(k, s); }
    if (s) it.last = s; return s || it.last;
  }

  async function load() {
    const [meta, buf, dio] = await Promise.all([fetch('data/meta.json').then((r) => r.json()), fetch('data/cols.bin').then((r) => r.arrayBuffer()), fetch('data/diorama.json').then((r) => r.json())]);
    const TY = { float32: Float32Array, uint32: Uint32Array, uint16: Uint16Array, int16: Int16Array, uint8: Uint8Array }, d = {};
    for (const c of meta.columns) d[c.name] = new TY[c.type](buf, c.offset, c.length);
    const by = GENRE_IDX.map(() => []); for (let i = 0; i < meta.n; i++) by[d.genre[i]].push(i);
    for (const a of by) a.sort((x, y) => d.rev[y] - d.rev[x] || x - y);
    big = { d, by, names: null, hdr: {}, n: meta.n };
    fetch('data/names.json').then((r) => r.json()).then((nm) => { big.names = nm.names; big.hdr = nm.hdr; namesReady = true; if (active) render(); });
    pools = Object.fromEntries(dio.districts.map((x) => [x.key, x]));
    // districts
    dist = Object.entries(DISTRICTS).map(([key, def], di) => ({ key, di, ...def, cores: def.cores.map(([la, lo, pull]) => [...toGrid([la, lo]), pull]), ids: by[GENRE_IDX.indexOf(key)], pool: pools[key].pool, count: pools[key].count, lit: pools[key].lit, gold: pools[key].gold }));
    map = paintMap(dist); paper = makePaper();
    clouds = (() => { const R = rng(9), imgs = [makeCloud(4), makeCloud(5), makeCloud(6)]; return Array.from({ length: 6 }, (_, k) => ({ img: imgs[k % 3], x: R(), y: 0.03 + R() * 0.2, s: 0.8 + R() * 0.9, v: 0.003 + R() * 0.005 })); })();
    // landmarks
    const lms = LANDMARKS_AT.map(([model, ll, scale, dk, en, zh], k) => { const [u, v] = toGrid(ll); return { kind: 'lm', u, v, key: 'lm:' + model, parts: LANDMARKS[model], scale: scale * BK, seed: 40 + k, lit: 0.7, d: dist.find((x) => x.key === dk), name: { en, zh } }; });
    // billboards: one per district beside its main core, and one for the whole city at Yonge–Dundas Square
    const mkBoard = (u, v, d, pool) => { const w = pool.map((c) => Math.sqrt(c.rev + 1)); return { kind: 'board', u, v, d, pool, w, sum: w.reduce((a, b) => a + b, 0), cur: 0, prev: 0, t0: -boards.length * 0.7, imgs: pool.map(() => null) }; };
    for (const d of dist) { boards.push(d.board = mkBoard(d.cores[0][0] + 230, d.cores[0][1] - 260, d, d.pool)); }
    { const all = dist.flatMap((d) => d.pool).sort((a, b) => b.rev - a.rev).slice(0, 80), [u, v] = toGrid([43.6561, -79.3802]); boards.push(mkBoard(u, v, null, all)); }
    // lots: a jittered street-grid of candidates, kept away from water, parks, rivers, highways and landmarks
    const cands = dist.map(() => []);
    for (let a = Math.ceil(u0 / PITCHM) + 1; a * PITCHM < u1 - 250; a++) for (let b = Math.ceil(v0 / PITCHM) + 1; b * PITCHM < v1 - 250; b++) {
      const p = [a * PITCHM + (hash(a, b) - .5) * 90, b * PITCHM + (hash(b, a + 99) - .5) * 90];
      if (!G.onLand(p) || G.inPark(p) || lineDist(p, G.don) < 260 || lineDist(p, G.humber) < 200 || lineDist(p, G.roads[0].pts) < 120 || G.runway.some((r) => segDist(p, r[0], r[1]) < 330)) continue;
      if (lms.some((m) => Math.hypot(p[0] - m.u, p[1] - m.v) < 330 * m.scale / BK + 60) || boards.some((bd) => Math.hypot(p[0] - bd.u, p[1] - bd.v) < 200)) continue;
      let best = null, bd = 1e9;
      if (inPoly(p, G.island)) { best = dist.find((x) => x.island); bd = Math.min(...best.cores.map((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) / c[2])); }
      else for (const x of dist) if (!x.island) for (const c of x.cores) { const dd = Math.hypot(p[0] - c[0], p[1] - c[1]) / c[2]; if (dd < bd) { bd = dd; best = x; } }
      const home = Math.hypot(p[0] - best.cores[0][0], p[1] - best.cores[0][1]);
      cands[best.di].push({ p, d: bd * 0.6 + home * 0.4, h: hash(a * 7 + 3, b * 13 + 1) });
    }
    const total = dist.reduce((a, x) => a + x.count, 0);
    for (const x of dist) {
      const c = cands[x.di].sort((p, q) => p.d - q.d), want = Math.min(c.length, Math.max(8, Math.round((TOTAL_LOTS * x.count) / total)));
      let keep = [], r0 = 500; // dense at the core, sparser outward: widen the falloff until there is room for everyone
      for (; r0 < 40000; r0 *= 1.2) { keep = c.filter((q) => q.h < 1 / (1 + (q.d / r0) ** 2)); if (keep.length >= want) break; }
      keep = keep.slice(0, want); const L = keep.length, n = x.ids.length, rev = d.rev;
      let litC = 0, goldC = 0; for (const i of x.ids) { if (rev[i] >= 10) litC++; if (d.tier[i] === 2) goldC++; }
      const b = [0]; for (let k = 1; k <= L; k++) b.push(Math.max(b[k - 1] + 1, k === L ? n : Math.round(n * (k / L) ** 3)));
      x.lots = L; x.solo = 0; x.last = 0;
      keep.forEach((q, k) => {
        const s0 = b[k], cnt = b[k + 1] - s0, maxRev = rev[x.ids[s0]], floors = floorsOf(maxRev), cls = floors <= 3 ? 0 : floors <= 6 ? 1 : floors <= 10 ? 2 : 3, fam = x.style[cls];
        const cap = { house: 3, bungalow: 2, cottage: 2, shed: 2, shop: 5, pavilion: 5, gothic: 6, loft: 7, silo: 8 }[fam] || 99, fl = Math.min(floors, cap), lit = Math.max(0, Math.min(b[k + 1], litC) - s0) / cnt, gold = Math.max(0, Math.min(b[k + 1], goldC) - s0);
        const lv = lit < 0.2 ? 0 : lit < 0.7 ? 1 : 2, vr = Math.floor(q.h * 97) % 4, bld = { d: x, start: s0, n: cnt, maxRev, minRev: rev[x.ids[b[k + 1] - 1]], lit, gold, floors, top: s0 < x.pool.length ? x.pool[s0].name : null };
        if (cnt === 1) x.solo++; x.last = Math.max(x.last, cnt);
        items.push({ kind: 'b', u: q.p[0], v: q.p[1], b: bld, key: `${fam}|${fl}|${vr}|${lv}`, parts: () => generic(fam, fl, vr), scale: 0.95, seed: 11 + fl * 7 + vr, lit: [0.08, 0.45, 0.85][lv] });
      });
    }
    // trees and boats for company
    const trees = [treeSprite(0, 1), treeSprite(0, 2), treeSprite(1, 3), treeSprite(2, 4), treeSprite(0, 5)], RT = rng(77), tree = (p) => items.push({ kind: 'tree', u: p[0], v: p[1], sp: trees[Math.floor(RT() * trees.length)], scale: 1.1 + RT() * 0.5 });
    for (const [x, y, a, b] of G.parks) for (let k = 0; k < Math.round((a * b) / 26000); k++) { const tt = RT() * 6.2832, r = Math.sqrt(RT()) * 0.9; tree([x + Math.cos(tt) * a * r, y + Math.sin(tt) * b * r]); }
    for (const poly of [G.island, G.spit]) { const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]); for (let k = 0; k < 150; k++) { const p = [lerp(Math.min(...xs), Math.max(...xs), RT()), lerp(Math.min(...ys), Math.max(...ys), RT())]; if (inPoly(p, poly) && !G.runway.some((r) => segDist(p, r[0], r[1]) < 300) && !items.some((it) => it.kind === 'b' && Math.hypot(it.u - p[0], it.v - p[1]) < 170)) tree(p); } }
    for (const line of [G.don, G.humber]) for (let k = 0; k < line.length - 1; k++) for (let j = 0; j < 7; j++) { const u = RT(), side = RT() < 0.5 ? -1 : 1, p = [lerp(line[k][0], line[k + 1][0], u) + side * (90 + RT() * 130), lerp(line[k][1], line[k + 1][1], u) + (RT() - .5) * 120]; if (G.onLand(p)) tree(p); }
    for (const [model, ll, sc] of [['ferry', [43.6316, -79.3762], 1], ['sail', [43.6255, -79.4350], 1.2], ['sail', [43.6190, -79.3540], 1.2], ['sail', [43.6330, -79.3110], 1.2], ['sail', [43.6140, -79.4120], 1.2]]) { const [u, v] = toGrid(ll); items.push({ kind: 'boat', u, v, key: 'lm:' + model, parts: LANDMARKS[model], scale: sc * BK, seed: 9, lit: 0.5 }); }
    items.push(...lms, ...boards);
    order = [...dist].sort((a, b) => b.count - a.count);
    for (const x of dist) { const ds = items.filter((it) => it.kind === 'b' && it.b.d === x).map((it) => Math.hypot(it.u - x.cores[0][0], it.v - x.cores[0][1])).sort((a, b) => a - b); x.reach = Math.max(900, ds[Math.floor(ds.length * 0.55)] || 0); }
    ready = true;
  }
  const pick = (bd) => { let r = Math.random() * bd.sum; for (let k = 0; k < bd.w.length; k++) { r -= bd.w[k]; if (r <= 0) return k; } return 0; };
  const boardImg = (bd, k) => bd.imgs[k] || (bd.imgs[k] = Object.assign(new Image(), { src: bd.pool[k].img }));
  function hand(bd) { const got = [bd.cur]; let guard = 0; while (got.length < 8 && guard++ < 400) { const k = pick(bd); if (!got.includes(k)) got.push(k); } return got.map((k) => bd.pool[k]); }
  const CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';
  const gameCard = (i) => { const d = big.d, h = big.hdr[i]; return { name: big.names[i], img: h ? (h.startsWith('http') ? h : CDN + h) : `${CDN}${d.appid[i]}/header.jpg`, year: Math.floor(d.yearf[i]), rev: d.rev[i], pos: d.pos[i], price: d.price[i] / 100, appid: d.appid[i] }; };
  const topName = (b) => b.top || (namesReady ? big.names[b.d.ids[b.start]] : null);

  // ---------------------------------------------------------- side panel
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct = (a, n) => Math.round((100 * a) / Math.max(1, n)), hood = (d) => d.hood[lang === 'zh' ? 1 : 0];
  function render() {
    if (!ready) return; const s = t(); let h = '';
    if (view.type === 'city') {
      h = `<header><h2>${s.head}</h2><p class="fact">${s.sub}</p></header><ul class="keys"><li>${s.k1}</li><li>${s.k2}</li><li>${s.k3}</li></ul>
        <div class="rows">${order.map((d) => `<button class="drow" data-d="${d.di}"><i style="background:${d.color}"></i><b>${dn(d)}<em>${hood(d)}</em></b><span>${s.row(fmt(d.count), pct(d.lit, d.count))}</span></button>`).join('')}</div>`;
    } else if (view.type === 'district') {
      const d = view.d, now = d.pool[d.board.cur];
      h = `<header><div class="nav"><button data-act="city">${s.all}</button><span><button data-act="prev">‹</button><button data-act="next">›</button></span></div>
        <h2><i class="sw" style="background:${d.color}"></i>${dn(d)}</h2><p class="hood">${s.lives(hood(d))}</p><p class="fact">${s.fact({ count: fmt(d.count), lots: d.lots, lit: pct(d.lit, d.count), gold: fmt(d.gold), solo: d.solo, last: fmt(d.last) })}</p></header>
        <section><h3>${s.boardNow}</h3><button class="poster wide" data-act="tray"><img src="${esc(now.img)}" alt=""><b>${esc(now.name)}</b></button><button class="paper-btn" data-act="tray">${s.boardBtn}</button></section>
        <p class="note foot">${s.hint}</p>`;
    } else if (view.type === 'tray') {
      const d = view.d;
      h = `<header><div class="nav"><button data-act="${d ? 'district' : 'city'}">${d ? s.toDistrict(dn(d)) : s.all}</button></div><h2>${d ? s.trayHead(dn(d)) : s.trayAll}</h2><p class="note">${d ? '' : s.cityBoard + '. '}${s.trayNote}</p></header>
        <div class="posters two">${view.cards.map((c, k) => `<button class="poster" data-card="${k}"><img src="${esc(c.img)}" alt="" loading="lazy"><b>${esc(c.name)}</b><span>${c.pos}% · ${s.reviews(fmt(c.rev))}</span></button>`).join('')}</div>
        <button class="paper-btn" data-act="tray">${s.again}</button>`;
    } else if (view.type === 'building') {
      const b = view.b, d = b.d, solo = b.n === 1;
      let list = `<p class="note">${s.loading}</p>`;
      if (namesReady) {
        const ids = d.ids.slice(b.start, b.start + b.n), shown = ids.slice(0, view.limit);
        list = `<ol class="residents" start="${b.start + 1}">${shown.map((i) => `<li><button data-game="${i}"><b>${esc(big.names[i])}</b><span>${Math.floor(big.d.yearf[i])} · ${s.reviews(fmt(big.d.rev[i]))}</span></button></li>`).join('')}</ol>${ids.length > shown.length ? `<button class="paper-btn" data-act="more">${s.more(fmt(Math.min(200, ids.length - shown.length)))}</button>` : ''}`;
      }
      h = `<header><div class="nav"><button data-act="district">${s.toDistrict(dn(d))}</button></div><h2>${solo ? esc(topName(b) || '…') : s.house(fmt(b.n))}</h2>
        <p class="fact">${solo ? s.solo + '. ' : ''}${s.rank(fmt(b.start + 1), fmt(b.start + b.n), dn(d))} ${solo ? '' : s.range(fmt(b.minRev), fmt(b.maxRev))}</p></header>${list}`;
    }
    guide.innerHTML = h; guide.classList.add('on'); root.classList.toggle('deep', view.type !== 'city');
  }
  const viewD = () => (view.type === 'city' ? null : view.type === 'building' ? view.b.d : view.d);
  guide.addEventListener('click', (e) => {
    const el = e.target.closest('button'); if (!el) return;
    if (el.dataset.d) return go({ type: 'district', d: dist[+el.dataset.d] });
    if (el.dataset.card) return openCard(view.cards[+el.dataset.card]);
    if (el.dataset.game) return openCard(gameCard(+el.dataset.game));
    const a = el.dataset.act, d = viewD();
    if (a === 'city') go({ type: 'city' });
    else if (a === 'district') go({ type: 'district', d });
    else if (a === 'prev' || a === 'next') { const k = order.indexOf(d); go({ type: 'district', d: order[(k + (a === 'next' ? 1 : order.length - 1)) % order.length] }); }
    else if (a === 'tray') go({ type: 'tray', d, cards: hand(d ? d.board : boards[boards.length - 1]) }, true);
    else if (a === 'more') { view.limit += 200; const y = guide.scrollTop; render(); guide.scrollTop = y; }
  });
  guide.addEventListener('pointerover', (e) => { const el = e.target.closest('.drow'); hoverD = el ? +el.dataset.d : -1; });
  let overPanel = false;
  guide.addEventListener('pointerenter', () => { overPanel = true; });
  guide.addEventListener('pointerleave', () => { hoverD = -1; overPanel = false; });
  function go(v, keepCam) { view = v; closeCard(); if (v.type === 'building') v.limit = 200; render(); guide.scrollTop = 0; if (!keepCam) frameCam(); }
  function frameCam() { // the focus point is held at a fixed spot left of the panel, whatever the zoom and angle
    const W = innerWidth, H = innerHeight, th = tgt ? tgt.th : 0, d = viewD();
    if (!d) tgt = { f: [-300, 1500], z: Math.min((W * 0.8) / (u1 - u0), (H * 0.8) / ((v1 - v0) * SINP)), th }; // the east end slips under the panel; drag to see it
    else tgt = { f: [d.cores[0][0], d.cores[0][1] + d.reach * 0.25], z: clamp((Math.min(W * 0.56, H * 0.9) * 0.5) / d.reach, 0.15, 0.3), th };
  }
  function relang() { $('#p2-back').textContent = t().back; $('#p2-post').textContent = t().postcard; $('#p2-turn span').textContent = t().turn; render(); }

  // ---------------------------------------------------------- camera maths (orthographic, free yaw)
  const AX = () => innerWidth * 0.335, AY = () => innerHeight * 0.56; // where the focus point sits on screen
  const proj = (u, v, Z = 0) => { const du = u - cam.f[0], dv = v - cam.f[1], c = Math.cos(cam.th), s = Math.sin(cam.th); return [AX() + (du * c - dv * s) * cam.z, AY() - ((du * s + dv * c) * SINP + Z * COSP) * cam.z]; };
  const unproj = (sx, sy) => { const xr = (sx - AX()) / cam.z, yr = -(sy - AY()) / (cam.z * SINP), c = Math.cos(cam.th), s = Math.sin(cam.th); return [cam.f[0] + xr * c + yr * s, cam.f[1] - xr * s + yr * c]; };
  function hit(mx, my) {
    if (!cam) return null; const k = cam.z / SP;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i]; if (it.kind === 'tree' || it.kind === 'boat') continue;
      if (it.kind === 'board') { if (it.rect && mx > it.rect[0] && mx < it.rect[0] + it.rect[2] && my > it.rect[1] && my < it.rect[1] + it.rect[3]) return { board: it }; continue; }
      const sp = it.last; if (!sp) continue; const [X, Y] = proj(it.u, it.v), sc = k * it.scale;
      if (Math.abs(mx - X) < sp.half * sc && my < Y + 6 && my > Y - sp.top * sc) return it.kind === 'b' ? { item: it } : { lm: it };
    }
    return null;
  }
  cv.addEventListener('pointerdown', (e) => { if (!active || !cam) return; drag = { x: e.clientX, y: e.clientY, f: [...tgt.f] }; moved = false; });
  addEventListener('pointermove', (e) => { if (!active || !drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) moved = true; if (moved) { const xr = -dx / cam.z, yr = dy / (cam.z * SINP), c = Math.cos(cam.th), s = Math.sin(cam.th); tgt.f = [clamp(drag.f[0] + xr * c + yr * s, u0, u1), clamp(drag.f[1] - xr * s + yr * c, v0, v1)]; } });
  addEventListener('pointerup', () => { drag = null; });
  cv.addEventListener('wheel', (e) => { if (!active || !cam) return; e.preventDefault(); tgt.z = clamp(tgt.z * Math.exp(-e.deltaY * 0.0015), 0.035, 0.6); }, { passive: false });
  const turn = (dir) => { if (tgt) tgt.th += (dir * Math.PI) / 4; };
  $('#p2-left').addEventListener('click', () => turn(1)); $('#p2-right').addEventListener('click', () => turn(-1));
  cv.addEventListener('click', (e) => {
    if (!active || moved || !ready) return; const h = hit(e.clientX, e.clientY), cur = viewD();
    if (!h) { if (view.type !== 'city') go(view.type === 'district' ? { type: 'city' } : { type: 'district', d: cur }, view.type !== 'district'); return; }
    if (h.board) return go({ type: 'tray', d: h.board.d, cards: hand(h.board) }, true);
    if (h.lm) return go({ type: 'district', d: h.lm.d });
    if (h.item.b.d === cur) go({ type: 'building', b: h.item.b }, true); else go({ type: 'district', d: h.item.b.d });
  });
  addEventListener('keydown', (e) => { if (!active || e.target.tagName === 'INPUT') return; if (e.key === 'Escape') go(view.type === 'building' || (view.type === 'tray' && view.d) ? { type: 'district', d: viewD() } : { type: 'city' }); if (e.key === 'q' || e.key === 'ArrowLeft') turn(1); if (e.key === 'e' || e.key === 'ArrowRight') turn(-1); });
  $('#p2-back').addEventListener('click', () => { exit(); onExit(); });

  async function enter() {
    active = true; cam = null; bal = null; fade = 0; root.classList.add('on'); view = { type: 'city' }; tgt = null;
    if (!ready) { guide.innerHTML = `<p class="note">${t().wait}</p>`; guide.classList.add('on'); await (loading || (loading = load())); }
    frameCam(); relang();
  }
  function exit() { active = false; root.classList.remove('on'); guide.classList.remove('on'); closeCard(); tip.style.opacity = 0; cv.style.cursor = ''; }

  // ---------------------------------------------------------- frame
  function drawItem(it, bucket, k, tt, s, focus) {
    const [X, Y] = proj(it.u, it.v), W = innerWidth, H = innerHeight;
    if (X < -160 || X > W + 160 || Y < -30 || Y > H + 900 * cam.z) return;
    if (it.kind === 'board') {
      const bd = it; bd.rect = null; if (bd.d ? bd.d !== focus : !!focus && view.type !== 'city') return;
      if (tt - bd.t0 > 4.6) { bd.prev = bd.cur; bd.cur = pick(bd); bd.t0 = tt; if (view.type === 'district' && view.d === bd.d) render(); }
      const big2 = !bd.d, bw = clamp(300 * cam.z + (big2 ? 70 : 50), 60, 130), bh = (bw * 215) / 460, post = Math.max(18, 190 * cam.z), bx = X - bw / 2, by = Y - post - bh;
      g.strokeStyle = INK; g.lineWidth = Math.max(1.4, 9 * cam.z); for (const ox of [-bw * 0.3, bw * 0.3]) { g.beginPath(); g.moveTo(X + ox, by + bh); g.lineTo(X + ox * 0.5, Y); g.stroke(); }
      g.fillStyle = PAPER_C; g.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
      const a = boardImg(bd, bd.prev), c = boardImg(bd, bd.cur), f = smooth(clamp((tt - bd.t0) / 0.7));
      if (a.complete && a.naturalWidth) g.drawImage(a, bx, by, bw, bh);
      if (c.complete && c.naturalWidth) { g.globalAlpha = f; g.drawImage(c, bx, by, bw, bh); g.globalAlpha = 1; }
      const on = hover && hover.board === bd; g.strokeStyle = on ? '#ffb454' : INK; g.lineWidth = on ? 3 : 1.6; g.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
      bd.rect = [bx - 3, by - 3, bw + 6, bh + 6]; return;
    }
    const sp = sprite(it, bucket); if (!sp) return; const sc = (it.kind === 'tree' ? k * 1.15 : k) * it.scale;
    if (it.kind === 'boat') { const bob = Math.sin(tt * 1.4 + it.u) * 1.5; g.drawImage(sp.cv, X - sp.ox * sc, Y - sp.oy * sc + bob, sp.w * sc, sp.h * sc); return; }
    const hov = hover && (hover.item === it || hover.lm === it), sel = view.type === 'building' && it.b === view.b;
    if (it.kind === 'b' && (sel || (hov && it.b.d === viewD()))) { g.strokeStyle = '#ffb454'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(X, Y, sp.half * sc * 1.2, sp.half * sc * 0.62, 0, 0, 6.3); g.stroke(); }
    const lift = sel ? 6 : hov ? 3 : 0;
    g.drawImage(sp.cv, X - sp.ox * sc, Y - sp.oy * sc - lift, sp.w * sc, sp.h * sc);
    if (it.kind === 'b' && it.b.gold) { const ty = Y - sp.top * sc - lift, r = clamp(26 * cam.z + 3, 3, 12), gl = g.createRadialGradient(X, ty, 0, X, ty, r); gl.addColorStop(0, 'rgba(255,240,170,1)'); gl.addColorStop(0.35, 'rgba(255,214,110,.7)'); gl.addColorStop(1, 'rgba(255,214,110,0)'); g.fillStyle = gl; g.fillRect(X - r, ty - r, r * 2, r * 2); }
    if (it.key === 'lm:cnTower') { g.fillStyle = `rgba(255,80,80,${0.45 + 0.55 * Math.sin(tt * 3)})`; g.beginPath(); g.arc(X, Y - sp.top * sc, Math.max(2, 14 * cam.z), 0, 6.3); g.fill(); }
  }
  function draw(now) {
    if (!active) return;
    const tt = now / 1000, dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight, mouse = getMouse(), s = t();
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#26366c'); sky.addColorStop(0.45, '#7f73a6'); sky.addColorStop(0.8, '#eaa58f'); sky.addColorStop(1, '#f6cfa4'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (!ready || !tgt) { g.fillStyle = PAPER_C; g.globalAlpha = .9; g.fillRect(0, 0, W, H); g.globalAlpha = 1; return; }
    fade = Math.min(1, fade + 0.03);
    if (!cam) cam = { f: [...tgt.f], z: tgt.z, th: tgt.th };
    cam.z = Math.exp(lerp(Math.log(cam.z), Math.log(tgt.z), 0.1)); cam.f[0] = lerp(cam.f[0], tgt.f[0], 0.1); cam.f[1] = lerp(cam.f[1], tgt.f[1], 0.1); cam.th = lerp(cam.th, tgt.th, 0.12);
    const c = Math.cos(cam.th), sn = Math.sin(cam.th), z = cam.z, k = z / SP;
    for (const cl of clouds) { const w = 360 * cl.s, x = ((((cl.x + tt * cl.v) % 1) + 1) % 1) * (W + w) - w; g.globalAlpha = 0.8; g.drawImage(cl.img, x, cl.y * H, w, 130 * cl.s); }
    g.globalAlpha = 1;
    // the map sheet: one affine transform puts the painted texture on the ground plane
    const o = proj(u0, v1), mt = [(z * c) / TS, (-z * SINP * sn) / TS, (z * sn) / TS, (z * SINP * c) / TS];
    g.setTransform(mt[0] * dpr, mt[1] * dpr, mt[2] * dpr, mt[3] * dpr, o[0] * dpr, (o[1] + 14) * dpr); g.fillStyle = 'rgba(10,12,40,.35)'; g.fillRect(0, 0, map.w, map.h);
    g.setTransform(mt[0] * dpr, mt[1] * dpr, mt[2] * dpr, mt[3] * dpr, o[0] * dpr, (o[1] + 6) * dpr); g.fillStyle = '#b09a76'; g.fillRect(0, 0, map.w, map.h);
    g.setTransform(mt[0] * dpr, mt[1] * dpr, mt[2] * dpr, mt[3] * dpr, o[0] * dpr, o[1] * dpr); g.drawImage(map.cv, 0, 0);
    g.font = 'italic 150px Georgia, serif'; g.fillStyle = 'rgba(243,234,216,.6)'; g.textAlign = 'center'; g.fillText(s.lake, (toGrid([43.6190, -79.4380])[0] - u0) * TS, (v1 - toGrid([43.6190, -79.4380])[1]) * TS);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // everything standing on the map, far to near
    if (Math.abs(cam.th - sortedTh) > 0.02) { items.sort((a, b) => (b.u * sn + b.v * c) - (a.u * sn + a.v * c)); sortedTh = cam.th; }
    const bucket = ((Math.round((cam.th / 6.2832) * ANG) % ANG) + ANG) % ANG, sd = viewD();
    hover = mouse && !drag && !overPanel ? hit(mouse[0], mouse[1]) : null;
    const hd = hoverD >= 0 ? dist[hoverD] : hover ? (hover.board ? hover.board.d : hover.item ? hover.item.b.d : hover.lm.d) : null, focus = sd || hd;
    budget = 60;
    for (const it of items) drawItem(it, bucket, k, tt, s, focus);
    if (focus) { // fade the rest of the city under a sheet of tracing paper, then redraw the chosen genre on top
      g.fillStyle = `rgba(243,234,216,${sd ? 0.62 : 0.4})`; g.fillRect(0, 0, W, H);
      for (const it of items) if ((it.kind === 'b' && it.b.d === focus) || ((it.kind === 'lm' || it.kind === 'board') && it.d === focus) || (it.kind === 'board' && !it.d && !sd)) drawItem(it, bucket, k, tt, s, focus);
    }
    // neighbourhood flags
    const fam = getComputedStyle(document.body).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (!sd) {
      const placed = [];
      for (const d of [...dist].sort((p, q) => proj(q.cores[0][0], q.cores[0][1])[1] - proj(p.cores[0][0], p.cores[0][1])[1])) {
        const [X, Y0] = proj(d.cores[0][0], d.cores[0][1]), on = d === hd, name = dn(d);
        g.font = `700 ${on ? 17 : 14}px ${fam}`; const tw = g.measureText(name).width + 26; let Y = Y0 - 260 * z - 30;
        while (placed.some((q) => Math.abs(q[0] - X) < (q[2] + tw) / 2 + 4 && Math.abs(q[1] - Y) < 27)) Y -= 27;
        placed.push([X, Y, tw]);
        g.strokeStyle = INK; g.lineWidth = 1.3; g.beginPath(); g.moveTo(X, Y + 12); g.lineTo(X, Y0); g.stroke();
        g.fillStyle = on ? '#ffb454' : PAPER_C; g.fillRect(X - tw / 2, Y - 12, tw, 24); g.strokeRect(X - tw / 2, Y - 12, tw, 24);
        g.fillStyle = d.color; g.fillRect(X - tw / 2 + 4, Y - 8, 5, 16); g.fillStyle = INK; g.fillText(name, X + 4, Y + 1);
      }
    }
    let tipText = null;
    if (hover && hover.board) tipText = s.tipBoard(hover.board.pool[hover.board.cur].name);
    else if (hover && hover.lm) tipText = `${hover.lm.name[lang]} · ${dn(hover.lm.d)}`;
    else if (hover && hover.item) { const b = hover.item.b; tipText = (b.n === 1 ? s.tipSolo(topName(b) || '…', fmt(b.maxRev)) : s.tipHouse(fmt(b.n), topName(b))) + (b.d !== sd ? ` · ${dn(b.d)}` : ''); }

    // the balloon
    const fp = focus ? proj(focus.cores[0][0], focus.cores[0][1]) : null, bx0 = fp ? clamp(fp[0] - W * 0.2, 60, W * 0.6) : W * 0.1, by0 = fp ? clamp(fp[1] - 700 * z - 90, H * 0.1, H * 0.55) : H * 0.24;
    if (!bal) bal = { x: W * 0.3, y: H * 0.2 };
    const vx = (bx0 - bal.x) * 0.03; bal.x += vx; bal.y = lerp(bal.y, by0, 0.03);
    const bxx = bal.x + Math.sin(tt * 0.7) * 5, byy = bal.y + Math.sin(tt * 1.3) * 6;
    if (Math.random() < 0.08) puffs.push({ x: bxx - 2, y: byy + 38, r: 3 + Math.random() * 4, a: 0.5, vx: -vx * 0.6 + (Math.random() - .5) * 0.3, vy: -0.5 - Math.random() * 0.4 });
    for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.x += q.vx; q.y += q.vy; q.r += 0.12; q.a -= 0.006; if (q.a <= 0) { puffs.splice(i, 1); continue; } g.fillStyle = `rgba(255,255,255,${q.a * 0.5})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 6.3); g.fill(); }
    drawBalloon(g, bxx, byy, clamp(vx * 0.03, -0.25, 0.25), tt, 0.3);

    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.45; g.fillStyle = g.createPattern(paper, 'repeat'); g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.strokeStyle = 'rgba(243,234,216,.85)'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); g.strokeStyle = 'rgba(23,26,46,.5)'; g.lineWidth = 1; g.strokeRect(11, 11, W - 22, H - 22);
    if (fade < 1) { g.fillStyle = `rgba(243,234,216,${1 - smooth(fade)})`; g.fillRect(0, 0, W, H); }
    cv.style.cursor = drag && moved ? 'grabbing' : hover ? 'pointer' : 'grab';
    if (tipText && mouse) { tip.textContent = tipText; tip.style.opacity = 1; tip.style.transform = `translate(${Math.min(mouse[0] + 16, W - 400)}px,${mouse[1] + 18}px)`; } else tip.style.opacity = 0;
  }
  return { enter, exit, draw, relang, get active() { return active; } };
}
