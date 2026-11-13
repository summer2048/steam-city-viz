import { layoutYears, layoutReviews, layoutGenres, buildIndex, colorKey } from './layouts.js';
import { Wall } from './wall.js';

const $ = (s) => document.querySelector(s);
const fmt = (x) => Math.round(x).toLocaleString('en-US');
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (p, a, b) => clamp((p - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const GENRE_ZH = { Action: '动作', Adventure: '冒险', RPG: '角色扮演', Strategy: '策略', Simulation: '模拟', Casual: '休闲', Sports: '体育', Racing: '竞速', Other: '其他' };
const CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';

// ------------------------------------------------------------------ loading
const loadBar = $('#load-bar'), loadPct = $('#load-pct');
const progress = {};
function setProgress(key, f) {
  progress[key] = f;
  const v = Object.values(progress).reduce((a, b) => a + b, 0) / 5;
  loadBar.style.transform = `scaleX(${v})`; loadPct.textContent = Math.round(v * 100) + '%';
}
async function fetchWithProgress(url, key) {
  const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status);
  const total = +r.headers.get('content-length') || 0, reader = r.body.getReader(), chunks = []; let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; if (total) setProgress(key, got / total); }
  setProgress(key, 1); return new Blob(chunks);
}
async function loadAll() {
  ['cols', 'l0', 'l1', 'l2', 'meta'].forEach((k) => setProgress(k, 0));
  const meta = await (await fetch('data/meta.json')).json(); setProgress('meta', 1);
  const [colsBlob, ...imgBlobs] = await Promise.all([
    fetchWithProgress('data/cols.bin', 'cols'), fetchWithProgress('data/lod0.webp', 'l0'),
    fetchWithProgress('data/lod1.webp', 'l1'), fetchWithProgress('data/lod2.webp', 'l2')]);
  const buf = await colsBlob.arrayBuffer();
  const T = { float32: Float32Array, uint32: Uint32Array, uint16: Uint16Array, int16: Int16Array, uint8: Uint8Array };
  const data = { n: meta.n };
  for (const c of meta.columns) data[c.name] = new T[c.type](buf, c.offset, c.length);
  const images = await Promise.all(imgBlobs.map((b) => createImageBitmap(b)));
  return { meta, data, images };
}

// ------------------------------------------------------------------ story
const TMAX = 2027, T0 = 1997.6;
function timeAt(p) {
  if (p < 0.07) return lerp(TMAX, T0, smooth(ramp(p, 0.005, 0.07)));
  if (p < 0.13) return T0;
  if (p >= 0.5) return TMAX;
  const u = (p - 0.13) / 0.37;
  if (u < 0.22) return lerp(T0, 2006, u / 0.22);
  if (u < 0.55) return lerp(2006, 2014, (u - 0.22) / 0.33);
  return lerp(2014, TMAX, (u - 0.55) / 0.45);
}

function captions(st) {
  const s = st, yc = s.yearCounts;
  const upto2005 = Object.entries(yc).filter(([y]) => +y <= 2005).reduce((a, [, c]) => a + c, 0);
  const firstDate = new Date(s.first.date + 'T00:00:00Z');
  const lit = s.genreOrder.filter((g) => g !== 'Other');
  return [
    { id: 'c-first', a: 0.075, b: 0.125, html: `<p class="over">${firstDate.getUTCFullYear()} 年 ${firstDate.getUTCMonth() + 1} 月 ${firstDate.getUTCDate()} 日</p><h2>第一块砖</h2><p>数据集里发行日期最早的一款：<em>${s.first.name}</em>。</p>` },
    { id: 'c-t1', a: 0.145, b: 0.215, html: `<h2>起初，寥寥无几</h2><p>到 2005 年为止，总共只有 <b>${fmt(upto2005)}</b> 款。每一张封面你都叫得出名字。</p>` },
    { id: 'c-t2', a: 0.315, b: 0.385, html: `<h2>闸门打开</h2><p>2014 年，年发行量第一次突破一千：<b>${fmt(yc[2014])}</b> 款，是前一年的 ${(yc[2014] / yc[2013]).toFixed(1)} 倍。</p>` },
    { id: 'c-t3', a: 0.455, b: 0.5, html: `<h2>洪流</h2><p>${s.peakYear} 年：<b>${fmt(yc[s.peakYear])}</b> 款。<br>平均每天 ${Math.round(yc[s.peakYear] / 365)} 款新游戏上架。</p>` },
    { id: 'c-full', a: 0.505, b: 0.575, html: `<p class="over">1997 — 2026 · 全部</p><h2 class="num">${fmt(s.total)}</h2><p>这是整面墙。每一栏里，封面从左到右按色相排开；柱顶立着那一年评论最多的游戏。<br>在下方搜一款你玩过的，看看它站在哪里。</p>` },
    { id: 'c-dim0', a: 0.585, b: 0.655, html: `<h2>先熄灭无人问津的</h2><p>评论不足 10 条的游戏有 <b>${fmt(s.under10)}</b> 款，占 ${Math.round((100 * s.under10) / s.total)}%。超过一半的墙，暗了。</p>` },
    { id: 'c-dim1', a: 0.665, b: 0.745, html: `<h2>再只留下 1%</h2><p>评论最多的 <b>${fmt(s.top1Count)}</b> 款游戏，拿走了全部评论的 <b>${Math.round(100 * s.top1Share)}%</b>。</p>` },
    { id: 'c-tree', a: 0.79, b: 0.865, html: `<h2>如果面积就是关注度</h2><p>左边是那 1%，其余 ${fmt(s.total - s.top1Count)} 款挤在右边的窄条里。</p>` },
    { id: 'c-genre', a: 0.925, b: 1.1, html: `<h2>类型各有底色</h2><p>每个形状是一类游戏的全部封面。<em>${GENRE_ZH[lit[0]]}</em>游戏的封面偏暗，重心沉在下面；<em>${GENRE_ZH[lit[lit.length - 1]]}</em>游戏明亮得多，重心浮在上面。</p><ul class="legend"><li><b>·</b>一个点 = 一张封面</li><li><b>↕</b>越高，封面越亮</li><li><b>↔</b>越宽，这个亮度的封面越多</li><li><b>—</b>白线：该类型一半的封面比它暗</li></ul>` },
  ];
}

// ------------------------------------------------------------------ main
async function main() {
  const { meta, data, images } = await loadAll();
  const st = meta.stats, n = data.n;
  // genre columns ordered from darkest to brightest average cover ("Other" last)
  const gi = st.genres.map((g, i) => i).filter((i) => st.genres[i] !== 'Other').sort((a, b) => st.genreLum[a] - st.genreLum[b]);
  gi.push(st.genres.indexOf('Other'));
  st.genreOrder = gi.map((i) => st.genres[i]);

  const key = colorKey(data);
  const LA = layoutYears(data, key), LB = layoutReviews(data, st.top1Share, key), LC = layoutGenres(data, gi, innerWidth < 720 ? 3 : gi.length);
  const canvas = $('#wall');
  const wall = new Wall(canvas, data, [LA.pos, LB.pos, LC.pos], images, meta);
  const pickA = buildIndex(LA.pos, n, LA.bbox), pickB = buildIndex(LB.pos, n, LB.bbox), pickC = buildIndex(LC.pos, n, LC.bbox);

  let names = null, hdr = {}, lower = null, pinned = -1;
  const byRev = Array.from({ length: n }, (_, i) => i).sort((a, b) => data.rev[b] - data.rev[a]);
  fetch('data/names.json').then((r) => r.json()).then((j) => { names = j.names; hdr = j.hdr; lower = names.map((x) => x.toLowerCase()); buildPosters(); });
  const headerUrl = (i) => (hdr[i] ? (hdr[i].startsWith('http') ? hdr[i] : CDN + hdr[i]) : `${CDN}${data.appid[i]}/header.jpg`);

  // captions
  const caps = captions(st), capBox = $('#captions');
  for (const c of caps) { const el = document.createElement('div'); el.className = 'cap'; el.id = c.id; el.innerHTML = c.html; capBox.appendChild(el); c.el = el; }
  $('#title-sub').innerHTML = `Steam 上的 <b>${fmt(st.total)}</b> 款游戏。<br>每一张封面，都是一个世界的入口。`;

  // axis / annotation labels
  const labels = $('#labels');
  const mk = (cls, html) => { const e = document.createElement('div'); e.className = 'lab ' + cls; e.innerHTML = html; labels.appendChild(e); return e; };
  const yearLabs = LA.cols.map((c) => mk('year', c.label));
  const genreLabs = LC.cols.map((c) => {
    const g = st.genres[c.genre], rgb = st.genreRgb[c.genre];
    return mk('genre', `<b>${GENRE_ZH[g]}</b><span>${fmt(c.count)} 款</span>`);
  });
  const medLabs = LC.cols.map((c) => mk('median', `<i></i><span>${c.median}</span>`));
  const narrowC = LC.cols.length && LC.cols[0].y0 !== LC.cols[LC.cols.length - 1].y0;
  const axis = mk('axis', '<span>亮</span><i></i><span>暗</span>');
  const examples = [];
  // landmark posters (the most-reviewed game of each year) and brightness examples need names/urls, so they are built late
  const posters = [];
  function buildPosters() {
    LA.cols.forEach((c, j) => {
      let best = c.start; for (let i = c.start; i < c.start + c.count; i++) if (data.rev[i] > data.rev[best]) best = i;
      const el = mk('poster', `<img src="${headerUrl(best)}" alt=""><span></span>`);
      el.querySelector('span').textContent = names[best];
      el.addEventListener('click', () => openCard(best));
      posters[j] = el;
    });
    if (!narrowC) for (const target of [226, 128, 30]) {
      let best = byRev[0];
      for (let k = 0; k < 3000; k++) { const i = byRev[k]; if (Math.abs(data.lum[i] - target) < Math.abs(data.lum[best] - target)) best = i; }
      const el = mk('ex', `<img src="${headerUrl(best)}" alt=""><span>亮度 ${data.lum[best]}</span>`);
      el.addEventListener('click', () => openCard(best));
      examples.push({ el, lum: data.lum[best] });
    }
  }
  const treeLabs = [mk('tree', `<b>1%</b> · ${fmt(st.top1Count)} 款 · ${Math.round(100 * st.top1Share)}% 的评论`), mk('tree right', `<b>99%</b>`)];

  // ---- state
  let pTarget = 0, p = 0, cam = null, mouse = { x: -1, y: -1, in: false }, hover = -1, last = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; pTarget = max > 0 ? clamp(scrollY / max) : 0; };
  addEventListener('scroll', readScroll, { passive: true }); readScroll(); p = pTarget;
  addEventListener('resize', () => { wall.resize(); readScroll(); });

  const fit = (bb, rect) => {
    const W = wall.w, H = wall.h, rw = (rect[2] - rect[0]) * W, rh = (rect[3] - rect[1]) * H;
    const zoom = Math.min(rw / (bb.x1 - bb.x0), rh / (bb.y1 - bb.y0));
    const sx = ((rect[0] + rect[2]) / 2) * W, sy = ((rect[1] + rect[3]) / 2) * H;
    return { zoom, cx: (bb.x0 + bb.x1) / 2 - (sx - W / 2) / zoom, cy: (bb.y0 + bb.y1) / 2 + (sy - H / 2) / zoom };
  };
  const mixCam = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)) });

  const STOPS = [
    [0.0, [0.05, 0.07, 0.17], [0.11, 0.04, 0.11]], [0.13, [0.15, 0.075, 0.02], [0.11, 0.02, 0.045]],
    [0.5, [0.12, 0.06, 0.03], [0.03, 0.06, 0.13]], [0.6, [0.02, 0.045, 0.1], [0.035, 0.02, 0.08]],
    [0.78, [0.14, 0.03, 0.095], [0.12, 0.06, 0.02]], [0.92, [0.02, 0.095, 0.105], [0.085, 0.04, 0.14]], [1.01, [0.02, 0.095, 0.105], [0.085, 0.04, 0.14]]];
  function palette(p) {
    let k = 0; while (k < STOPS.length - 2 && p >= STOPS[k + 1][0]) k++;
    const a = STOPS[k], b = STOPS[k + 1], t = smooth(ramp(p, a[0], b[0]));
    return { c1: a[1].map((v, i) => lerp(v, b[1][i], t)), c2: a[2].map((v, i) => lerp(v, b[2][i], t)) };
  }
  const ease5 = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  // mirrors the vertex shader, so DOM markers can follow a tile through layout changes
  function posOf(i, s) {
    const rnd = ((Math.imul(i + 1, 2654435761) >>> 0) % 100000) / 100000;
    const e1 = ease5(clamp(s.AB * 1.5 - rnd * 0.5)), e2 = ease5(clamp(s.BC * 1.5 - rnd * 0.5));
    const arc = (Math.sin(e1 * Math.PI) * (1 - e2) + Math.sin(e2 * Math.PI)) * 40;
    const m = (c) => lerp(lerp(LA.pos[i * 4 + c], LB.pos[i * 4 + c], e1), LC.pos[i * 4 + c], e2);
    return [m(0) + Math.sin(rnd * 40) * arc, m(1) + Math.cos(rnd * 57) * arc];
  }
  function compute(p) {
    const narrow = wall.w < 720;
    const T = timeAt(p);
    const AB = ramp(p, 0.75, 0.81), BC = ramp(p, 0.87, 0.94);
    const bbA = LA.bboxAt(T);
    const top = lerp(narrow ? 0.2 : 0.1, narrow ? 0.4 : 0.3, smooth(ramp(p, 0, 0.07)));
    let cA = fit(bbA, [0.05, top, 0.95, 0.84]);
    const zmax = (Math.min(wall.w * 0.42, 520)) / 2.14;
    if (cA.zoom > zmax) { // keep the early covers at a readable size, anchored near the screen centre-left
      const z = zmax, sx = wall.w * (narrow ? 0.5 : 0.5), sy = wall.h * 0.6;
      cA = { zoom: z, cx: (bbA.x0 + bbA.x1) / 2 - (sx - wall.w / 2) / z, cy: (bbA.y0 + bbA.y1) / 2 + (sy - wall.h / 2) / z };
    }
    const cB = fit(LB.bbox, narrow ? [0.03, 0.46, 0.97, 0.84] : [0.04, 0.34, 0.96, 0.88]);
    const cC = fit(LC.bbox, narrow ? [0.04, 0.44, 0.96, 0.8] : [0.16, 0.44, 0.97, 0.86]);
    const target = mixCam(mixCam(cA, cB, smooth(AB)), cC, smooth(BC));
    const back = 1 - ramp(p, 0.87, 0.91);
    const dimLow = smooth(ramp(p, 0.58, 0.61)) * lerp(1, 0.72, ramp(p, 0.75, 0.8)) * back;
    const dimRest = smooth(ramp(p, 0.66, 0.69)) * lerp(1, 0.72, ramp(p, 0.75, 0.8)) * back;
    return {
      T, AB, BC, target, bbA,
      dim0: dimLow, dim1: dimRest,
      top: smooth(ramp(p, 0.66, 0.69)) * (1 - ramp(p, 0.75, 0.78)),
      global: lerp(0.55, 1, smooth(ramp(p, 0.01, 0.06))),
      pop: T < 2006 ? 0.35 : 0.12, ...palette(p),
    };
  }

  const tip = $('#tip'), tipImg = $('#tip-img'), tipName = $('#tip-name'), tipMeta = $('#tip-meta');
  const describe = (i) => {
    const y = Math.floor(data.yearf[i]), r = data.rev[i], pr = data.price[i];
    const bits = [String(y), r ? `${fmt(r)} 条评论` : '暂无评论'];
    if (data.pos[i] !== 255 && r >= 10) bits.push(`${data.pos[i]}% 好评`);
    bits.push(pr === 0 ? '免费' : `$${(pr / 100).toFixed(2)}`);
    return bits.join(' · ');
  };
  function pick(s) {
    if (!mouse.in || !cam) return -1;
    const wx = cam.cx + (mouse.x - wall.w / 2) / cam.zoom, wy = cam.cy - (mouse.y - wall.h / 2) / cam.zoom;
    if (s.AB <= 0.001) return pickA(wx, wy, (i) => data.yearf[i] <= s.T);
    if (s.AB >= 0.999 && s.BC <= 0.001) return pickB(wx, wy);
    if (s.BC >= 0.999) return pickC(wx, wy);
    return -1;
  }
  function showTip(i) {
    if (i === hover) return; hover = i;
    if (i < 0) { tip.classList.remove('on'); canvas.style.cursor = ''; return; }
    tipImg.src = headerUrl(i); tipName.textContent = names ? names[i] : '…'; tipMeta.textContent = describe(i);
    tip.classList.add('on'); canvas.style.cursor = 'pointer';
  }
  canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = e.pointerType !== 'touch'; });
  canvas.addEventListener('pointerleave', () => { mouse.in = false; });
  const card = $('#card');
  function openCard(i) {
    $('#card-img').src = headerUrl(i); $('#card-name').textContent = names ? names[i] : '';
    $('#card-meta').textContent = describe(i);
    $('#card-genre').textContent = GENRE_ZH[st.genres[data.genre[i]]];
    $('#card-link').href = `https://store.steampowered.com/app/${data.appid[i]}`;
    card.classList.add('on');
  }
  canvas.addEventListener('click', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; const was = mouse.in; mouse.in = true;
    const i = pick(compute(p)); mouse.in = was;
    if (i < 0) card.classList.remove('on'); else openCard(i);
  });
  // search: find a game you know and pin it, so it stays marked through every scene
  const search = $('#search'), q = $('#q'), sug = $('#sug'), pin = $('#pin');
  q.addEventListener('input', () => {
    sug.innerHTML = ''; const v = q.value.trim().toLowerCase();
    if (!lower || v.length < 2) return;
    let found = 0;
    for (let k = 0; k < n && found < 6; k++) {
      const i = byRev[k]; if (!lower[i].includes(v)) continue; found++;
      const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>';
      li.firstChild.textContent = names[i]; li.lastChild.textContent = Math.floor(data.yearf[i]);
      li.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(i); }); sug.appendChild(li);
    }
    if (!found) { const li = document.createElement('li'); li.className = 'none'; li.textContent = '没有找到，换个英文名试试'; sug.appendChild(li); }
  });
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && sug.firstChild && !sug.firstChild.classList.contains('none')) sug.firstChild.dispatchEvent(new PointerEvent('pointerdown')); if (e.key === 'Escape') { sug.innerHTML = ''; q.blur(); } });
  q.addEventListener('blur', () => setTimeout(() => { sug.innerHTML = ''; }, 150));
  function choose(i) {
    pinned = i; sug.innerHTML = ''; q.value = names[i]; q.blur();
    $('#pin-img').src = headerUrl(i); openCard(i);
  }
  pin.addEventListener('click', () => pinned >= 0 && openCard(pinned));
  $('#card-close').addEventListener('click', () => card.classList.remove('on'));
  $('#skip').addEventListener('click', () => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * 0.97, behavior: 'instant' }));

  const enterBtn = $('#enter'), credit = $('#credit'), narrow0 = innerWidth < 720;
  const hudYear = $('#hud-year'), hudCount = $('#hud-count'), hud = $('#hud'), title = $('#title'), hint = $('#hint');
  const project = (x, y) => [(x - cam.cx) * cam.zoom + wall.w / 2, wall.h / 2 - (y - cam.cy) * cam.zoom];

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    p = reduce ? pTarget : lerp(p, pTarget, 1 - Math.exp(-dt * 5)); if (Math.abs(p - pTarget) < 1e-5) p = pTarget;
    const s = compute(p);
    if (!cam) cam = { ...s.target };
    const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
    cam.cx = lerp(cam.cx, s.target.cx, k); cam.cy = lerp(cam.cy, s.target.cy, k);
    cam.zoom = Math.exp(lerp(Math.log(cam.zoom), Math.log(s.target.zoom), k));

    const settled = s.AB <= 0.001 || (s.AB >= 0.999 && s.BC <= 0.001) || s.BC >= 0.999;
    const wx = cam.cx + (mouse.x - wall.w / 2) / cam.zoom, wy = cam.cy - (mouse.y - wall.h / 2) / cam.zoom;
    const lens = mouse.in && settled && !reduce ? clamp((14 - cam.zoom) / 8) : 0; // only when tiles are tiny
    wall.draw({ ...s, time: now / 1000, glow: 0.85, cx: cam.cx, cy: cam.cy, zoom: cam.zoom, minPx: 3.2, mx: wx, my: wy, mr: lens > 0 ? (70 * lens) / cam.zoom : 0 });

    // overlays
    title.style.opacity = 1 - ramp(p, 0.012, 0.035); title.style.pointerEvents = p < 0.03 ? 'auto' : 'none';
    hint.style.opacity = 1 - ramp(p, 0.004, 0.02);
    for (const c of caps) {
      const o = Math.min(ramp(p, c.a, c.a + 0.012), 1 - ramp(p, c.b - 0.012, c.b));
      c.el.style.opacity = o; c.el.style.transform = `translateY(${(1 - o) * 14}px)`; c.el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    }
    const hudO = Math.min(ramp(p, 0.07, 0.085), 1 - ramp(p, 0.5, 0.508));
    hud.style.opacity = hudO;
    enterBtn.classList.toggle('on', p > 0.95); credit.style.opacity = narrow0 ? 1 - ramp(p, 0.01, 0.03) : 1;
    if (hudO > 0) { hudYear.textContent = Math.min(2026, Math.floor(s.T)); hudCount.textContent = fmt(s.bbA.shown); }

    const pitch = (LA.cols[1].x0 - LA.cols[0].x0) * cam.zoom;
    const yo = Math.min(ramp(p, 0.2, 0.215), 1 - ramp(p, 0.745, 0.755));
    yearLabs.forEach((el, j) => {
      const step = pitch > 40 ? 1 : pitch > 20 ? 2 : 4, c = LA.cols[j], on = j <= s.bbA.col && pitch > 9 && j % step === 0;
      el.style.opacity = on ? yo : 0;
      if (on) { const [x, y] = project((c.x0 + c.x1) / 2, -0.6); el.style.transform = `translate(${x}px,${y + 8}px) translateX(-50%)`; }
    });
    // landmark posters on top of finished year columns
    const po = (s.AB <= 0.001 && p > 0.2 && p < 0.745) ? 1 : 0, step = pitch > 46 ? 1 : pitch > 23 ? 2 : 4;
    const pw = clamp(pitch * step * 0.9, 40, 118);
    posters.forEach((el, j) => {
      const c = LA.cols[j], on = po && j % step === 0 && (j < s.bbA.col || s.T >= c.year + 1);
      el.style.opacity = on ? 1 : 0; el.style.pointerEvents = on ? 'auto' : 'none';
      if (on) { const [x, y] = project((c.x0 + c.x1) / 2, c.height); el.style.width = pw + 'px'; el.style.transform = `translate(${x - pw / 2}px,${y - 8}px) translateY(-100%)`; }
    });
    // pinned game marker
    search.classList.toggle('on', p > 0.07);
    let pinOn = pinned >= 0 && p > 0.07 && !(s.AB <= 0.001 && data.yearf[pinned] > s.T);
    if (pinOn) { const w = posOf(pinned, s), [x, y] = project(w[0], w[1]); pin.style.transform = `translate(${x}px,${y}px)`; }
    pin.classList.toggle('on', pinOn);
    const go = ramp(p, 0.935, 0.95);
    if (!narrowC) {
      const c0 = LC.cols[0], [ax, ay1] = project(c0.xc - c0.pitch * 0.6, c0.y1), [, ay0] = project(0, c0.y0);
      axis.style.opacity = go; axis.style.height = ay0 - ay1 + 'px'; axis.style.transform = `translate(${ax}px,${ay1}px)`;
      for (const ex of examples) {
        const [, ey] = project(0, c0.y0 + ((ex.lum + 0.5) / 256) * (c0.y1 - c0.y0));
        ex.el.style.opacity = go; ex.el.style.pointerEvents = go > 0.5 ? 'auto' : 'none'; ex.el.style.transform = `translate(${ax - 14}px,${ey}px) translate(-100%,-50%)`;
      }
    }
    genreLabs.forEach((el, j) => {
      const c = LC.cols[j]; el.style.opacity = go;
      const [x, y] = project(c.xc, c.y0); el.style.transform = `translate(${x}px,${y + 8}px) translateX(-50%)`;
      const m = medLabs[j], [mx, my] = project(c.xc, c.medianY), w = c.pitch * cam.zoom * 0.86;
      m.style.opacity = go; m.style.width = w + 'px'; m.style.transform = `translate(${mx - w / 2}px,${my}px)`;
    });
    const to = Math.min(ramp(p, 0.805, 0.82), 1 - ramp(p, 0.865, 0.875));
    treeLabs.forEach((el, j) => {
      el.style.opacity = to;
      const [x, y] = j ? project(LB.W, LB.H) : project(0, LB.H);
      el.style.transform = `translate(${x}px,${y - 8}px) translate(${j ? '-100%' : '0'},-100%)`;
    });

    showTip(pick(s));
    if (hover >= 0) {
      const tw = 280, x = Math.min(mouse.x + 18, wall.w - tw - 12), y = mouse.y + 18 + 190 > wall.h ? mouse.y - 190 : mouse.y + 18;
      tip.style.transform = `translate(${x}px,${y}px)`;
    }
    requestAnimationFrame(frame);
  }
  document.body.classList.add('ready');
  requestAnimationFrame(frame);
  window.__wall = { wall, data, st, get p() { return p; } };
}

main().catch((e) => { console.error(e); $('#load-msg').textContent = '加载失败：' + e.message; });
