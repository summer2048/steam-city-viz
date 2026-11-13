// 蒸汽之城 — part 1: the scroll-driven timeline. Drawing helpers live in draw.js, part 2 in districts.js.
import { $, lerp, ramp, PAPER_C, CH, WW, WH, GAP, WIN, SS, TOP, CW, INK, L, WASH, blob, buildBlock, clamp, drawBalloon, drawCrane, eraOf, fmt, lamp, lang, makeCloud, makeHills, makePaper, makeRipples, makeSkyline, rline, rng, rpoly, setLang, smooth, tr, tree, wash } from './draw.js';
import { createDistricts } from './districts.js?v=20261113b';

// ------------------------------------------------------------ main
async function main() {
  const data = await (await fetch('data/city.json')).json();
  const cv = $('#c'), g = cv.getContext('2d');
  const blocks = data.years.map((y, i) => buildBlock(y, i === data.years.length - 1));
  let X = 80; for (const b of blocks) { b.x = X; X += b.width + GAP; }
  const WORLD_W = X + 60, MAX_H = Math.max(...blocks.map((b) => b.height)), N = blocks.length;
  let cum = 0; for (const b of blocks) { b.cum0 = cum; cum += b.yr.count; }
  const loadImg = (src) => { const im = new Image(); im.src = src; return im; };
  const imgs = blocks.map((b) => loadImg(b.yr.top.img)), titleImgs = data.topAll.map((t) => loadImg(t.img));
  const PAPER = makePaper(), HILL1 = makeHills(11, '#2a2f5e', 60), HILL2 = makeHills(23, '#1f2450', 85), HILL1D = makeHills(11, '#6f9a66', 60, '#4d7a55'), HILL2D = makeHills(23, '#9db98c', 85, '#7fa37a'), SKYLINE = makeSkyline(31), RIPPLE = makeRipples();
  const CLOUDS = [makeCloud(1), makeCloud(2), makeCloud(3)];
  const clouds = (() => { const R = rng(17); return Array.from({ length: 7 }, (_, k) => ({ img: CLOUDS[k % 3], x: R(), y: 0.06 + R() * 0.3, s: 0.7 + R() * 0.9, v: 0.004 + R() * 0.006 })); })();
  const birds = (() => { const R = rng(21); return Array.from({ length: 6 }, () => ({ x: R(), y: 0.16 + R() * 0.22, v: 0.012 + R() * 0.01, ph: R() * 6, s: 0.7 + R() * 0.6 })); })();
  const rain = (() => { const R = rng(29); return Array.from({ length: 90 }, () => [R(), R(), 0.6 + R() * 0.8]); })();
  const stars = (() => { const R = rng(3); return Array.from({ length: 170 }, () => [R(), R() * 0.62, 0.5 + R() * 1.4, R()]); })();
  const puffs = [];
  let fontFamily = getComputedStyle(document.body).fontFamily;

  let W = 0, H = 0, dpr = 1, pT = 0, p = 0, pPrev = 0, cam = null, mouse = null, goldOnly = false, pinned = null, bal = null;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; };
  addEventListener('resize', resize); resize();
  const readScroll = () => { const m = document.documentElement.scrollHeight - innerHeight; pT = m > 0 ? clamp(scrollY / m) : 0; };
  addEventListener('scroll', readScroll, { passive: true }); readScroll(); p = pPrev = pT;
  addEventListener('pointermove', (e) => { mouse = [e.clientX, e.clientY]; });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- story: title -> rewind -> build year by year -> pull back
  const P = { rewind0: 0.02, rewind1: 0.1, build1: 0.86, full1: 0.94 };
  function story(p) {
    let seg;
    if (p < P.rewind0) seg = N;
    else if (p < P.rewind1) seg = lerp(N, 0.35, smooth(ramp(p, P.rewind0, P.rewind1)));
    else { const u = ramp(p, P.rewind1, P.build1); seg = u < 0.28 ? lerp(0.35, 9, u / 0.28) : lerp(9, N, (u - 0.28) / 0.72); } // linger on the village
    return { k: Math.min(N - 1, Math.floor(seg)), f: seg >= N ? 1 : seg % 1, done: seg >= N, seg };
  }
  const SKY = [ // top, middle, horizon — a different time of day for each era
    [[150, 198, 222], [240, 228, 190], [252, 204, 136]],   // village: a clear afternoon
    [[74, 50, 122], [206, 86, 112], [255, 152, 76]],       // town: blazing sunset
    [[12, 16, 56], [30, 38, 100], [88, 84, 148]],          // city: blue night
    [[5, 5, 24], [30, 12, 62], [132, 28, 116]]];           // metropolis: neon haze
  const eraAt = (seg) => { const y = seg >= N ? 2026 : lerp(blocks[Math.floor(seg)].year, blocks[Math.min(N - 1, Math.floor(seg) + 1)].year, seg % 1); return y <= 2006 ? 0 : y <= 2011 ? (y - 2006) / 5 : y <= 2016 ? 1 + (y - 2011) / 5 : y <= 2022 ? 2 + (y - 2016) / 6 : 3; };

  const litAll = Math.round((100 * data.lit) / data.total), yc = Object.fromEntries(data.years.map((y) => [y.year, y]));
  const pct = (y) => Math.round((100 * yc[y].lit) / yc[y].count);
  const capData = { c2005: yc[2005].count, c2014: fmt(yc[2014].count), x2014: (yc[2014].count / yc[2013].count).toFixed(1), p2018: pct(2018), c2024: fmt(yc[2024].count), p2024: pct(2024), total: fmt(data.total), litAll, goldShare: Math.round(100 * data.goldShare), est: fmt(data.years[data.years.length - 1].proj.est) };
  let CAPS = tr().caps(capData);
  const cap = $('#cap'), capH = $('#cap h2'), capP = $('#cap p'), title = $('#title'), hud = $('#hud'), yearEl = $('#year'), countEl = $('#count');
  const tip = $('#tip'), hint = $('#hint'), legend = $('#legend'), tools = $('#tools'), enter = $('#enter');
  function applyLang() {
    const t = tr(); document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'; document.title = t.doc; CAPS = t.caps(capData); cap.dataset.k = '';
    $('#title h1').textContent = t.title; $('#title-sub').innerHTML = t.sub(fmt(data.total)); hint.textContent = t.hint;
    $('#l-dark').textContent = t.lDark; $('#l-lit').textContent = t.lLit; $('#l-gold').textContent = t.lGold; $('#l-unit').textContent = t.unit;
    $('#gold').textContent = goldOnly ? t.goldOff : t.goldOn; q.placeholder = t.qIdle; $('#enter').textContent = t.enter + ' →'; districts.relang();
    $('#skip').textContent = t.skip; $('#credit').textContent = t.credit; $('#card-link').textContent = t.steam;
    for (const b of document.querySelectorAll('#lang button')) b.classList.toggle('on', b.dataset.lang === lang);
    fontFamily = getComputedStyle(document.body).fontFamily;
    if (lastCard) openCard(lastCard, true);
  }
  for (const b of document.querySelectorAll('#lang button')) b.addEventListener('click', () => { setLang(b.dataset.lang); applyLang(); });

  // ---- card (shared by billboards and search)
  const card = $('#card');
  let lastCard = null;
  function openCard(c, keep) {
    const t = tr(); lastCard = c; if (keep && !card.classList.contains('on')) return;
    $('#card-img').src = c.img; $('#card-name').textContent = c.name;
    const bits = [t.year(c.year), c.rev ? t.reviews(fmt(c.rev)) : t.noReviews]; if (c.rev >= 10) bits.push(t.positive(c.pos)); bits.push(c.price ? `$${c.price.toFixed(2)}` : t.free);
    $('#card-meta').textContent = bits.join(' · '); $('#card-note').textContent = c.tier === undefined ? '' : [t.noteDark, t.noteLit, t.noteGold][c.tier];
    $('#card-link').href = `https://store.steampowered.com/app/${c.appid}`; card.classList.add('on');
  }
  $('#card-close').addEventListener('click', () => card.classList.remove('on'));
  // part 2 takes over the same canvas; scrolling is parked while you are in the districts
  let mode = 'story';
  const districts = createDistricts({ cv, g, openCard, closeCard: () => card.classList.remove('on'), getMouse: () => mouse, onExit: () => { mode = 'story'; document.body.classList.remove('part2'); } });
  enter.addEventListener('click', async () => { card.classList.remove('on'); await districts.enter(); mode = 'districts'; document.body.classList.add('part2'); });
  if (location.hash === '#map') setTimeout(() => enter.click()); // shortcut straight to the map, for development
  $('#gold').addEventListener('click', (e) => { goldOnly = !goldOnly; e.currentTarget.classList.toggle('on', goldOnly); e.currentTarget.textContent = goldOnly ? tr().goldOff : tr().goldOn; });
  $('#skip').addEventListener('click', () => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * 0.97, behavior: 'instant' }));

  // ---- search: find your game's window (the big tables load on first use)
  const q = $('#q'), sug = $('#sug'); let big = null, loading = null;
  const loadBig = () => loading || (loading = (async () => {
    const [meta, buf, nm] = await Promise.all([fetch('data/meta.json').then((r) => r.json()), fetch('data/cols.bin').then((r) => r.arrayBuffer()), fetch('data/names.json').then((r) => r.json())]);
    const T = { float32: Float32Array, uint32: Uint32Array, uint16: Uint16Array, int16: Int16Array, uint8: Uint8Array }, d = {};
    for (const c of meta.columns) d[c.name] = new T[c.type](buf, c.offset, c.length);
    const byRev = Array.from({ length: meta.n }, (_, i) => i).sort((a, b) => d.rev[b] - d.rev[a]);
    big = { d, names: nm.names, hdr: nm.hdr, lower: nm.names.map((x) => x.toLowerCase()), byRev, n: meta.n };
  })());
  q.addEventListener('focus', () => { if (!big) { q.placeholder = tr().qLoading; loadBig().then(() => { q.placeholder = tr().qIdle; suggest(); }); } });
  function suggest() {
    sug.innerHTML = ''; const v = q.value.trim().toLowerCase(); if (!big || v.length < 2) return;
    let found = 0;
    for (let k = 0; k < big.n && found < 6; k++) {
      const i = big.byRev[k]; if (!big.lower[i].includes(v)) continue; found++;
      const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>'; li.firstChild.textContent = big.names[i]; li.lastChild.textContent = Math.floor(big.d.yearf[i]);
      li.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(i); }); sug.appendChild(li);
    }
    if (!found) { const li = document.createElement('li'); li.className = 'none'; li.textContent = tr().none; sug.appendChild(li); }
  }
  q.addEventListener('input', suggest);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && sug.firstChild && !sug.firstChild.classList.contains('none')) sug.firstChild.dispatchEvent(new PointerEvent('pointerdown')); if (e.key === 'Escape') { sug.innerHTML = ''; q.blur(); } });
  q.addEventListener('blur', () => setTimeout(() => { sug.innerHTML = ''; }, 150));
  function choose(i) {
    const d = big.d, year = Math.floor(d.yearf[i]), j = blocks.findIndex((b) => b.year === Math.max(2005, year)), b = blocks[j], st = d.tier[i];
    let cand = []; for (let w = 0; w < b.W; w++) if (b.state[w] === st) cand.push(w);
    if (!cand.length) cand = Array.from({ length: b.W }, (_, w) => w);
    const w = cand[d.appid[i] % cand.length], CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';
    const img = big.hdr[i] ? (big.hdr[i].startsWith('http') ? big.hdr[i] : CDN + big.hdr[i]) : `${CDN}${d.appid[i]}/header.jpg`;
    pinned = { j, wx: b.wx[w], wy: b.wy[w], name: big.names[i] };
    sug.innerHTML = ''; q.value = big.names[i]; q.blur();
    openCard({ name: big.names[i], img, year, rev: d.rev[i], pos: d.pos[i], price: d.price[i] / 100, appid: d.appid[i], tier: st });
  }
  cv.addEventListener('click', () => { if (mode !== 'story') return; if (hoverCard) openCard(hoverCard); else card.classList.remove('on'); });
  let hoverCard = null;

  applyLang();

  // ---- frame
  function frame(now) {
    if (mode === 'districts') { districts.draw(now); requestAnimationFrame(frame); return; }
    const t = now / 1000;
    p = reduce ? pT : lerp(p, pT, 0.085); if (Math.abs(p - pT) < 1e-5) p = pT;
    const vel = p - pPrev; pPrev = p;
    const s = story(p), cur = blocks[s.k], era = eraAt(s.seg), night = clamp((era - 0.7) / 1.1), day = clamp(1 - era / 0.85), neon = clamp(era - 2.2) / 0.8;
    const groundY = Math.round(H * 0.8), waterY = groundY + 30, building = ramp(p, P.rewind1 - 0.015, P.rewind1);

    // camera: follow the construction front, pull back as the skyline grows; special framings for title and finale
    let hMax = 90; for (let j = 0; j <= s.k; j++) hMax = Math.max(hMax, (blocks[j].height - TOP) * (j === s.k && !s.done ? s.f : 1) + 90);
    const zFollow = Math.min(1.6, (H * 0.5) / hMax), front = cur.x + cur.width * (s.done ? 1 : 0.5 + 0.5 * s.f);
    const follow = { z: zFollow, cx: Math.max(W / 2 / zFollow - 30, front - (W * 0.16) / zFollow) };
    const zFull = Math.min((W * 0.92) / WORLD_W, (H * 0.56) / MAX_H), full = { z: zFull, cx: WORLD_W / 2 };
    const tb = blocks[N - 4], zT = Math.min(1.1, W / (WORLD_W - tb.x + 40)), titleCam = { z: zT, cx: WORLD_W - 30 - W / 2 / zT };
    const mixC = (a, b, k) => ({ z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)), cx: lerp(a.cx, b.cx, k) });
    let tgt = mixC(titleCam, follow, smooth(ramp(p, P.rewind0 * 0.6, P.rewind0 + 0.03)));
    tgt = mixC(tgt, full, smooth(ramp(p, P.build1, P.full1)));
    if (!cam) cam = { ...tgt };
    const kc = reduce ? 1 : 0.1; cam.z = Math.exp(lerp(Math.log(cam.z), Math.log(tgt.z), kc)); cam.cx = lerp(cam.cx, tgt.cx, kc);
    const sx = (x) => (x - cam.cx) * cam.z + W / 2, sy = (y) => groundY - y * cam.z;

    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // sky by era
    const e0 = Math.min(2, Math.floor(era)), ef = era - e0, mixc = (a, b, k) => a.map((v, c) => Math.round(lerp(v, b[c], k))), rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const skyc = (i) => mixc(SKY[e0][i], SKY[e0 + 1][i], ef), col = (i) => rgb(skyc(i));
    const sky = g.createLinearGradient(0, 0, 0, groundY); sky.addColorStop(0, col(0)); sky.addColorStop(0.55, col(1)); sky.addColorStop(1, col(2));
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const RB = rng(42); for (let k = 0; k < 9; k++) { const bx = RB() * W, by = RB() * groundY * 0.8, br = 120 + RB() * 260, gr = g.createRadialGradient(bx, by, 0, bx, by, br); gr.addColorStop(0, `rgba(255,255,255,${(0.03 + RB() * 0.04) * (1 + day * 2)})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(bx - br, by - br, br * 2, br * 2); }
    // sun: high in the village afternoon, sinking through the town's sunset
    const sunK = smooth(clamp(era / 1.35)), sunX = W * 0.8, sunY = lerp(H * 0.3, groundY + 70, sunK);
    if (sunK < 1) {
      const sg = g.createRadialGradient(sunX, sunY, 10, sunX, sunY, 320); sg.addColorStop(0, `rgba(255,236,170,${0.75 - 0.2 * sunK})`); sg.addColorStop(0.25, `rgba(255,${Math.round(200 - 60 * sunK)},110,${0.3 + 0.2 * sunK})`); sg.addColorStop(1, 'rgba(255,170,90,0)');
      g.fillStyle = sg; g.fillRect(sunX - 320, sunY - 320, 640, 640);
      g.fillStyle = rgb(mixc([255, 246, 214], [255, 150, 90], sunK)); g.beginPath(); g.arc(sunX, sunY, 34 + 16 * sunK, 0, 6.3); g.fill();
    }
    // neon haze over the metropolis
    if (neon > 0) {
      const hz = g.createLinearGradient(0, groundY - H * 0.45, 0, groundY); hz.addColorStop(0, 'rgba(255,60,170,0)'); hz.addColorStop(1, `rgba(255,60,170,${0.3 * neon})`); g.fillStyle = hz; g.fillRect(0, groundY - H * 0.45, W, H * 0.45);
      const cz = g.createRadialGradient(W * 0.3, groundY, 0, W * 0.3, groundY, W * 0.5); cz.addColorStop(0, `rgba(40,220,240,${0.2 * neon})`); cz.addColorStop(1, 'rgba(40,220,240,0)'); g.fillStyle = cz; g.fillRect(0, 0, W, groundY);
    }
    g.fillStyle = '#fff6dc'; const starA = clamp((era - 1) / 0.8) * (1 - neon * 0.55); for (const [x, y, r, ph] of stars) { g.globalAlpha = starA * (0.3 + 0.5 * Math.abs(Math.sin(t / 0.9 + ph * 9))); g.beginPath(); g.arc(x * W, y * H, r, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
    // moon rises once the sun is gone
    const moonK = smooth(clamp((era - 1.0) / 1.0));
    if (moonK > 0) {
      const mx = W * 0.84 - ramp(p, P.rewind1, 1) * W * 0.08, my = lerp(groundY - 30, H * 0.2, moonK);
      const mg = g.createRadialGradient(mx, my, 20, mx, my, 110); mg.addColorStop(0, `rgba(251,238,200,${0.22 * moonK})`); mg.addColorStop(1, 'rgba(251,238,200,0)'); g.fillStyle = mg; g.fillRect(mx - 110, my - 110, 220, 220);
      g.globalAlpha = moonK; g.fillStyle = neon > 0.5 ? '#f6d9e6' : '#fbeec8'; g.beginPath(); g.arc(mx, my, 30, 0, 6.3); g.fill();
      g.fillStyle = 'rgba(190,170,130,.35)'; for (const [a, b, r] of [[-9, -6, 6], [8, 9, 4], [10, -11, 3]]) { g.beginPath(); g.arc(mx + a, my + b, r, 0, 6.3); g.fill(); }
      g.globalAlpha = 1;
    }
    // searchlights sweeping the neon sky
    if (neon > 0) for (const [fx, sp, ph, c] of [[0.22, 0.23, 0, '120,230,255'], [0.55, 0.17, 2, '255,120,210'], [0.83, 0.2, 4, '255,240,200']]) {
      const a = -1.57 + Math.sin(t * sp + ph) * 0.55, len = H * 1.1, hw = 0.07, x0 = W * fx;
      const lg = g.createLinearGradient(x0, groundY, x0 + Math.cos(a) * len, groundY + Math.sin(a) * len); lg.addColorStop(0, `rgba(${c},${0.22 * neon})`); lg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = lg; g.beginPath(); g.moveTo(x0, groundY); g.lineTo(x0 + Math.cos(a - hw) * len, groundY + Math.sin(a - hw) * len); g.lineTo(x0 + Math.cos(a + hw) * len, groundY + Math.sin(a + hw) * len); g.fill();
    }
    // clouds: white and plump by day, thin veils at night
    for (const c of clouds) { const w = 360 * c.s, x = ((((c.x + t * c.v - cam.cx * 0.00004) % 1) + 1) % 1) * (W + w) - w; g.globalAlpha = lerp(0.5, 1, day); g.drawImage(c.img, x, c.y * H, w, 130 * c.s); if (day > 0.3) g.drawImage(c.img, x, c.y * H, w, 130 * c.s); }
    // birds over the village
    if (era < 1.3) { g.strokeStyle = INK; g.lineWidth = 1.6; g.lineCap = 'round'; g.globalAlpha = clamp(1.3 - era) * 0.8; for (const b of birds) { const x = (((b.x + t * b.v) % 1.1) - 0.05) * W, y = b.y * H + Math.sin(t * 0.8 + b.ph) * 8, fl = Math.sin(t * 7 + b.ph) * 4 * b.s; g.beginPath(); g.moveTo(x - 8 * b.s, y - fl); g.quadraticCurveTo(x - 3 * b.s, y - 3, x, y); g.quadraticCurveTo(x + 3 * b.s, y - 3, x + 8 * b.s, y - fl); g.stroke(); } }
    g.globalAlpha = 1;
    // far layer: green hills by day, dark ridges at dusk, then a distant skyline
    const far = clamp(era - 1.1), tile = (img, par, off, sc, a) => { if (a <= 0.01) return; const w = 2400 * sc, x0 = -((((cam.cx * par * Math.sqrt(cam.z)) % w) + w) % w); g.globalAlpha = a; for (let x = x0; x < W; x += w) g.drawImage(img, x, groundY - off * sc, w, 300 * sc); };
    tile(HILL2, 0.1, 255, 1.3, 0.9 * (1 - day)); tile(HILL2D, 0.1, 255, 1.3, day); tile(HILL1, 0.2, 175, 1, 0.9 * (1 - far * 0.75) * (1 - day)); tile(HILL1D, 0.2, 175, 1, day); tile(SKYLINE, 0.3, 298, 0.8, far * 0.8);
    g.globalAlpha = 1;

    // water with the city's reflection
    const wg = g.createLinearGradient(0, waterY, 0, H); wg.addColorStop(0, rgb(mixc(mixc(skyc(2), [12, 14, 44], 0.5), [120, 168, 190], day * 0.8))); wg.addColorStop(1, rgb(mixc([8, 10, 34], [58, 110, 140], day))); g.fillStyle = wg; g.fillRect(0, waterY, W, H - waterY);
    const vis = [];
    blocks.forEach((b, j) => {
      if (j > s.k) return; const f = j === s.k && !s.done ? smooth(s.f) : 1, x = sx(b.x), w = b.width * cam.z;
      if (x > W + 60 || x + w < -60) return; vis.push({ b, j, f, x, w, hpx: b.height * f });
    });
    g.save(); g.translate(0, waterY); g.scale(1, -0.5); g.globalAlpha = 0.3;
    for (const v of vis) g.drawImage(v.b.cv, 0, 0, v.b.width * SS, v.hpx * SS, v.x, -v.hpx * cam.z, v.w, v.hpx * cam.z);
    g.restore(); g.globalAlpha = 0.8;
    { const x0 = -((t * 9) % 600); for (let x = x0; x < W; x += 600) for (let y = waterY; y < H; y += 160) g.drawImage(RIPPLE, x, y); }
    g.globalAlpha = 1;

    // the city
    hoverCard = null; let hover = null; const t9 = tr(), yl = (b) => (b.year <= 2005 ? t9.early : t9.year(b.year));
    for (const v of vis) {
      const { b, f, x, w, hpx } = v;
      g.drawImage(b.cv, 0, 0, b.width * SS, hpx * SS, x, groundY - hpx * cam.z, w, hpx * cam.z);
      v.roofY = groundY - (hpx - b.roof) * cam.z; v.roofX = x + b.fx * cam.z;
      if ((b.wip || (f < 1 && b.era >= 2)) && hpx > b.roof) drawCrane(g, v.roofX, v.roofY, clamp(cam.z * 1.5, 0.3, 1.1), t, b.year);
      if (mouse && mouse[0] > x && mouse[0] < x + w && mouse[1] < groundY && mouse[1] > groundY - (b.height - TOP * 0.5) * cam.z) hover = b.wip ? t9.tipWip(yl(b), fmt(b.yr.count), fmt(b.yr.proj.est)) : t9.tipBlock(yl(b), fmt(b.yr.count), Math.round((100 * b.yr.lit) / b.yr.count));
    }
    const capBottom = building > 0.5 ? cap.getBoundingClientRect().bottom : H * 0.12;
    // rooftop billboards: each sits on its own roof, as large as it can be without touching a neighbour (a second tier on taller legs at most)
    const boardA = ramp(p, P.rewind0 + 0.012, P.rewind0 + 0.03); // the title has its own giant billboards
    const placed = [], MINW = 88, hit = (x, y, bw, bh) => placed.some((q) => Math.abs(q.cx - x) < (q.bw + bw) / 2 + 5 && Math.abs(q.y + q.bh / 2 - y - bh / 2) < (q.bh + bh) / 2 + 5);
    for (const v of vis) {
      const b = v.b; if (v.f < 1 || boardA <= 0 || b.wip) { b.bS = undefined; continue; }
      const cx = v.roofX, gap = Math.max(8, 20 * cam.z), size = (bw) => [bw, (bw * 215) / 460];
      let [bw, bh] = size(Math.max(b.bb.w * cam.z, MINW)), y = v.roofY - gap - bh;
      if (hit(cx, y, bw, bh)) { const y2 = y - bh - 8; if (!hit(cx, y2, bw, bh) && (cx - bw / 2 > W * 0.46 || y2 > capBottom + 10)) y = y2; else for (let k = 0; k < 8 && bw > 34 && hit(cx, y, bw, bh); k++) { [bw, bh] = size(bw * 0.86); y = v.roofY - gap - bh; } }
      placed.push({ cx, y, bw, bh, v });
      b.bS = b.bS === undefined || reduce ? [y, bw] : [lerp(b.bS[0], y, 0.16), lerp(b.bS[1], bw, 0.16)];
    }
    for (const q of placed) {
      const { v, cx } = q, b = v.b, by = b.bS[0], bw = b.bS[1], bh = (bw * 215) / 460, im = imgs[v.j];
      g.globalAlpha = boardA; g.strokeStyle = INK; g.lineWidth = Math.max(1, 1.5 * cam.z);
      for (const ox of [-bw * 0.22, bw * 0.22]) { g.beginPath(); g.moveTo(cx + ox, by + bh); g.lineTo(cx + ox * 0.6, v.roofY); g.stroke(); }
      g.save(); g.globalAlpha = boardA; g.translate(cx, by + bh / 2); g.rotate(((v.j % 5) - 2) * 0.012);
      g.shadowColor = 'rgba(8,8,26,.55)'; g.shadowBlur = 10; g.shadowOffsetY = 3; g.fillStyle = PAPER_C; g.fillRect(-bw / 2 - 3, -bh / 2 - 3, bw + 6, bh + 6); g.shadowBlur = 0; g.shadowOffsetY = 0;
      if (im.complete && im.naturalWidth) g.drawImage(im, -bw / 2, -bh / 2, bw, bh);
      g.strokeStyle = INK; g.lineWidth = 1.6; g.strokeRect(-bw / 2 - 3, -bh / 2 - 3, bw + 6, bh + 6); g.restore();
      if (mouse && Math.abs(mouse[0] - cx) < bw / 2 && mouse[1] > by && mouse[1] < by + bh) { hover = t9.tipBoard(b.yr.top.name, yl(b)); hoverCard = b.yr.top; }
    }
    g.globalAlpha = 1;
    // rain in the neon years
    if (neon > 0.2) { g.strokeStyle = 'rgba(200,220,255,.16)'; g.lineWidth = 1; g.beginPath(); for (const [rx, ry, rs] of rain) { const yy = ((ry + t * 0.9 * rs) % 1) * groundY, xx = ((rx + t * 0.05) % 1) * W; g.moveTo(xx, yy); g.lineTo(xx - 5, yy + 18 * rs); } g.globalAlpha = (neon - 0.2) / 0.8; g.stroke(); g.globalAlpha = 1; }
    // quay with year plates
    g.fillStyle = rgb(mixc([20, 22, 58], [104, 128, 82], day)); g.fillRect(0, groundY, W, waterY - groundY);
    const RG = rng(8); g.strokeStyle = day > 0.5 ? '#3d5a3c' : '#4a4f86'; g.lineCap = 'round'; rline(g, RG, 0, groundY + 1, W, groundY + 1, 1, 2); g.strokeStyle = day > 0.5 ? '#3d5a3c' : '#2a2e5c'; rline(g, RG, 0, waterY, W, waterY, 1, 1.5);
    g.fillStyle = PAPER_C; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const v of vis) if (v.w > 34 || v.j % 2 === 0) { g.globalAlpha = .9; g.font = `${clamp(11 * cam.z + 8, 11, 19)}px ${fontFamily}`; g.fillText(v.b.year <= 2005 ? '≤2005' : v.b.year, v.x + v.w / 2, groundY + 16); }
    g.globalAlpha = 1;

    // "only the golden 1%": dim everything, then relight the gold windows
    const finale = ramp(p, P.full1 - 0.02, P.full1);
    if (goldOnly && finale > 0) {
      g.fillStyle = `rgba(6,8,28,${0.8 * finale})`; g.fillRect(0, 0, W, groundY);
      g.fillStyle = '#fff3c4'; g.shadowColor = '#ffe08a'; g.shadowBlur = 10;
      for (const v of vis) for (let w = 0; w < v.b.W; w++) if (v.b.state[w] === 2) { const s2 = Math.max(2.2, WW * cam.z); g.fillRect(v.x + v.b.wx[w] * cam.z - s2 / 2, groundY - (v.b.height - v.b.wy[w]) * cam.z - s2 / 2, s2, s2 * 1.2); }
      g.shadowBlur = 0;
    }
    // your game's window
    if (pinned && pinned.j <= s.k && (pinned.j < s.k || s.done || s.f >= 1 || true)) {
      const b = blocks[pinned.j], shown = pinned.j < s.k || s.done;
      if (shown) {
        const x = sx(b.x) + pinned.wx * cam.z, y = groundY - (b.height - pinned.wy) * cam.z, r = 9 + 5 * Math.sin(t * 3);
        g.strokeStyle = '#ffb454'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.stroke();
        g.strokeStyle = 'rgba(255,180,84,.4)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r + 9, 0, 6.3); g.stroke();
        g.font = `15px ${fontFamily}`; const tw = g.measureText(pinned.name).width + 18, lx = clamp(x - tw / 2, 6, W - tw - 6), ly = y - 46;
        g.fillStyle = '#ffb454'; g.fillRect(lx, ly, tw, 24); g.fillStyle = INK; g.textAlign = 'left'; g.fillText(pinned.name, lx + 9, ly + 12.5);
        g.strokeStyle = '#ffb454'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, ly + 24); g.lineTo(x, y - r); g.stroke();
      }
    }

    // title: big billboards cycling through the most-reviewed games
    const tO = 1 - ramp(p, P.rewind0 * 0.5, P.rewind0 + 0.012);
    if (tO > 0.01) {
      const boards = [[0.56, 0.16, 0.26, -0.02], [0.45, 0.52, 0.19, 0.025], [0.72, 0.5, 0.22, 0.015]];
      boards.forEach(([fx, fy, fw, rot], k) => {
        const bw = W * fw, bh = (bw * 215) / 460, x = W * fx, y = H * fy, period = 3.6, tt = t / period + k / 3, idx = Math.floor(tt) * 3 + k, fade = smooth(clamp((tt % 1) / 0.18));
        g.save(); g.translate(x + bw / 2, y + bh / 2); g.rotate(rot); g.globalAlpha = tO;
        const RS = rng(60 + k); g.strokeStyle = INK; g.lineCap = 'round';
        for (const ox of [-bw * 0.3, bw * 0.3]) { rline(g, RS, ox, bh / 2, ox, bh / 2 + H, 1.5, 3); rline(g, RS, ox, bh / 2 + 10, -ox, bh / 2 + 90, 1.2, 1.6); }
        g.fillStyle = PAPER_C; g.fillRect(-bw / 2 - 7, -bh / 2 - 7, bw + 14, bh + 14);
        const a = titleImgs[(((idx - 3) % titleImgs.length) + titleImgs.length) % titleImgs.length], b = titleImgs[idx % titleImgs.length];
        if (a.complete && a.naturalWidth) g.drawImage(a, -bw / 2, -bh / 2, bw, bh);
        if (b.complete && b.naturalWidth) { g.globalAlpha = tO * fade; g.drawImage(b, -bw / 2, -bh / 2, bw, bh); g.globalAlpha = tO; }
        rpoly(g, RS, [[-bw / 2 - 7, -bh / 2 - 7], [bw / 2 + 7, -bh / 2 - 7], [bw / 2 + 7, bh / 2 + 7], [-bw / 2 - 7, bh / 2 + 7]], 1.2, 2.4);
        for (const lx of [-bw * 0.35, 0, bw * 0.35]) { const gl = g.createRadialGradient(lx, -bh / 2 - 16, 0, lx, -bh / 2 - 6, 60); gl.addColorStop(0, 'rgba(255,225,160,.5)'); gl.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gl; g.fillRect(lx - 60, -bh / 2 - 30, 120, 90); rline(g, RS, lx, -bh / 2 - 7, lx, -bh / 2 - 18, .6, 1.6); }
        g.restore();
      });
      g.globalAlpha = 1;
    }

    // the balloon
    let skyTop = groundY; for (const v of vis) if (v.x < W * 0.75 && v.x + v.w > W * 0.42) skyTop = Math.min(skyTop, groundY - (v.hpx - TOP * 0.45) * cam.z);
    const by0 = lerp(clamp(skyTop - 95, H * 0.2, H * 0.52), lerp(H * 0.3, H * 0.2, tO), Math.max(tO, finale)), bx0 = lerp(W * 0.58, W * 0.47, tO);
    if (!bal) bal = { x: bx0, y: by0, tilt: 0 };
    bal.x = lerp(bal.x, bx0, 0.04); bal.y = lerp(bal.y, by0, 0.04); bal.tilt = lerp(bal.tilt, clamp(vel * 900, -0.3, 0.3), 0.08);
    const bob = Math.sin(t * 1.3) * 6, bxx = bal.x + Math.sin(t * 0.7) * 5, byy = bal.y + bob;
    if (Math.random() < 0.08 + Math.abs(vel) * 300) puffs.push({ x: bxx - 2, y: byy + 38, r: 3 + Math.random() * 4, a: 0.5, vx: -vel * 4000 - 0.2 + (Math.random() - .5) * 0.3, vy: -0.5 - Math.random() * 0.4 });
    for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.x += q.vx; q.y += q.vy; q.r += 0.12; q.a -= 0.006; if (q.a <= 0) { puffs.splice(i, 1); continue; } g.fillStyle = `rgba(255,255,255,${q.a * 0.5})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 6.3); g.fill(); }
    drawBalloon(g, bxx, byy, bal.tilt, t, night);

    // paper grain + vignette over everything
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55; g.fillStyle = g.createPattern(PAPER, 'repeat'); g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const vg = g.createRadialGradient(W / 2, H * 0.55, H * 0.45, W / 2, H * 0.55, Math.max(W, H) * 0.8); vg.addColorStop(0, 'rgba(8,8,26,0)'); vg.addColorStop(1, 'rgba(8,8,26,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);

    // ---- DOM
    title.style.opacity = tO; title.style.visibility = tO > 0.01 ? 'visible' : 'hidden';
    hint.style.opacity = 1 - ramp(p, 0.003, 0.012);
    cap.style.opacity = building; hud.style.opacity = building * (1 - finale); legend.style.opacity = building; tools.classList.toggle('on', building > 0.5);
    const yrNow = s.done ? 9999 : cur.year, ci = s.done && finale > 0.5 ? CAPS.length - 1 : Math.max(0, CAPS.findIndex((c, i) => i === CAPS.length - 2 || CAPS[i + 1][0] > yrNow));
    if (cap.dataset.k !== String(ci)) { cap.dataset.k = ci; capH.textContent = CAPS[ci][1]; capP.innerHTML = CAPS[ci][2]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
    yearEl.textContent = s.done ? '2026' : cur.year <= 2005 ? '1997–2005' : cur.year;
    countEl.textContent = t9.total(fmt(s.done ? data.total : cur.cum0 + cur.yr.count * s.f));
    document.body.classList.toggle('day', day > 0.45 && building > 0.5);
    $('#gold').classList.toggle('show', finale > 0.5); enter.classList.toggle('on', finale > 0.5); if (finale < 0.5 && goldOnly) $('#gold').click();
    cv.style.cursor = hoverCard ? 'pointer' : '';
    if (hover && mouse && building > 0.5) { tip.textContent = hover + (hoverCard ? t9.click : ''); tip.style.opacity = 1; tip.style.transform = `translate(${Math.min(mouse[0] + 16, W - 300)}px,${mouse[1] + 18}px)`; } else tip.style.opacity = 0;
    requestAnimationFrame(frame);
  }
  document.body.classList.add('ready');
  requestAnimationFrame(frame);
}
main().catch((e) => { console.error(e); document.body.insertAdjacentHTML('beforeend', `<p style="position:fixed;left:2rem;top:2rem;color:#fff">加载失败：${e.message}</p>`); });
