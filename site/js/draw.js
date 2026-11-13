// 蒸汽之城 — a hand-drawn city where every window is ten Steam games.
export const $ = (s) => document.querySelector(s);
export const fmt = (x) => Math.round(x).toLocaleString('en-US');
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t), ramp = (p, a, b) => clamp((p - a) / (b - a));
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const INK = '#171a2e', PAPER_C = '#f3ead8';
export const CW = 13, CH = 16, WW = 8, WH = 10, GAP = 26, WIN = 10, SS = 2, TOP = 190; // WIN games per window; SS = supersampling of pre-rendered blocks
export const WASH = [
  ['#8a5a4e', '#9a7350', '#6f6a55', '#7d5560', '#86694a'],          // village: brick, ochre, timber
  ['#7a5560', '#63527d', '#70634f', '#56607f', '#7b5e52'],          // town
  ['#4d5d86', '#63527d', '#3f6f78', '#566689', '#5b4f7c'],          // city
  ['#34507a', '#2f6470', '#4a4a86', '#3a5f8c', '#3d4674'],          // metropolis: cool glass
];
export const eraOf = (y) => (y <= 2008 ? 0 : y <= 2013 ? 1 : y <= 2019 ? 2 : 3);

// ------------------------------------------------------------ language
export const L = {
  en: {
    doc: 'City of Steam — the city built by 124,000 Steam games', title: 'City of Steam',
    sub: (n) => `<b>${n}</b> games on Steam built a city.<br>Climb into the balloon and start from the very first light.`,
    hint: 'Scroll · rewind time to the beginning',
    lDark: 'Dark window: fewer than 10 reviews', lLit: 'Lit window: someone is playing', lGold: 'Gold window: top 1% by attention', unit: '1 window = 10 games',
    goldOn: 'Show only the golden 1%', goldOff: 'Show every window',
    qIdle: 'Search a game you played — find its window', qLoading: 'Looking through the registry…',
    enter: 'Walk into the districts', enterSub: 'Part 2 · in progress', skip: 'Skip to panorama',
    credit: 'Data: FronkonGames / steam-games-dataset · Cover art © their publishers · Unofficial fan project',
    steam: 'View on Steam ↗', none: 'No match found', total: (n) => `${n} games so far`, early: '2005 and earlier',
    tipBlock: (y, c, pc) => `${y} · ${c} games · ${pc}% lit`, tipWip: (y, c, e) => `${y} · ${c} games so far · on pace for about ${e} (estimate)`,
    tipBoard: (name, y) => `${name} · most reviewed of ${y}`, click: ' · click for details',
    reviews: (n) => `${n} reviews`, noReviews: 'no reviews yet', positive: (p) => `${p}% positive`, free: 'Free', year: (y) => `${y}`,
    noteGold: 'It lives in a gold window: top 1% by attention.', noteLit: 'Its window is lit: someone is playing.', noteDark: 'Its window is still dark: fewer than 10 reviews.',
    caps: (d) => [
      [0, 'At first, a small town', `Up to 2005 the town had just <b>${d.c2005}</b> games. In the afternoon sun, every home had someone in it.`],
      [2009, 'More people arrive', 'A few new houses every year. The sign on each roof is the game everyone was talking about that year.'],
      [2014, 'The floodgates open', `In 2014, <b>${d.c2014}</b> games went up at once — ${d.x2014}× the year before. The town became a city.`],
      [2017, 'The city booms. The lights do not.', `Of everything built in 2018, only <b>${d.p2018}%</b> of the windows are lit. The further you go, the darker it gets.`],
      [2021, 'Skyscrapers, mostly dark', `2024: <b>${d.c2024}</b> new games. Only <b>${d.p2024}%</b> ever collected 10 reviews.`],
      [9999, `A city of ${d.total} games`, `Only <b>${d.litAll}%</b> of its windows are lit; the golden 1% take <b>${d.goldShare}%</b> of all the attention.<small>Newer games have had less time to collect reviews, so the far right skews dark. 2026 is still being built: the scaffolding shows where it is heading if January's pace holds, about ${d.est} games.</small>`],
    ],
  },
  zh: {
    doc: '蒸汽之城 — Steam 上十二万款游戏盖起的城', title: '蒸汽之城',
    sub: (n) => `Steam 上的 <b>${n}</b> 款游戏，盖起了一座城。<br>乘上热气球，从第一盏灯看起。`,
    hint: '向下滚动 · 让时间倒回起点',
    lDark: '暗窗：评论不足 10 条', lLit: '亮窗：有人在玩', lGold: '金窗：关注度前 1%', unit: '一扇窗 = 10 款游戏',
    goldOn: '只看金色的 1%', goldOff: '显示全部窗户',
    qIdle: '搜一款你玩过的游戏，找到它的那扇窗', qLoading: '正在翻户籍册…',
    enter: '走进街区', enterSub: '第二部分 · 制作中', skip: '跳到全景',
    credit: '数据：FronkonGames / steam-games-dataset · 封面版权归各发行商所有 · 非官方作品',
    steam: '在 Steam 查看 ↗', none: '没有找到，换个英文名试试', total: (n) => `累计 ${n} 款`, early: '2005 年以前',
    tipBlock: (y, c, pc) => `${y} · ${c} 款 · ${pc}% 亮灯`, tipWip: (y, c, e) => `${y} · 目前 ${c} 款 · 按现在的速度全年约 ${e} 款（估算）`,
    tipBoard: (name, y) => `${name} · ${y} 评论最多`, click: ' · 点击查看',
    reviews: (n) => `${n} 条评论`, noReviews: '暂无评论', positive: (p) => `${p}% 好评`, free: '免费', year: (y) => `${y} 年`,
    noteGold: '它住在一扇金窗里：关注度前 1%。', noteLit: '它的窗亮着：有人在玩。', noteDark: '它的窗还暗着：评论不足 10 条。',
    caps: (d) => [
      [0, '起初，是个小镇', `到 2005 年为止，镇上只有 <b>${d.c2005}</b> 款游戏。午后的阳光里，家家都有人。`],
      [2009, '人越来越多', '每年新添几栋小楼。楼顶的招牌，是那一年最多人谈论的游戏。'],
      [2014, '闸门打开', `2014 年一口气盖起 <b>${d.c2014}</b> 款，是前一年的 ${d.x2014} 倍。小镇变成了城市。`],
      [2017, '城市疯长，灯却没跟上', `2018 年的新楼里，只有 <b>${d.p2018}%</b> 的窗亮着。越往后，暗窗越多。`],
      [2021, '摩天楼，黑着大半', `2024 年：<b>${d.c2024}</b> 款新游戏，只有 <b>${d.p2024}%</b> 收到过 10 条以上的评论。`],
      [9999, `${d.total} 款游戏的不夜城`, `整座城只有 <b>${d.litAll}%</b> 的窗亮着灯；金色的那 1%，拿走了 <b>${d.goldShare}%</b> 的目光。<small>越新的游戏积累评论的时间越短，所以最右边会偏暗。2026 年还在建造中：脚手架搭到了按 1 月的速度全年会达到的高度，约 ${d.est} 款。</small>`],
    ],
  },
};
export let lang = 'en';
try { const v = localStorage.getItem('city-lang'); if (v === 'zh' || v === 'en') lang = v; } catch (e) { /* storage unavailable */ }
export const tr = () => L[lang];
export function setLang(v) { lang = v; try { localStorage.setItem('city-lang', v); } catch (e) { /* ignore */ } }

// ------------------------------------------------------------ hand-drawn primitives
export function rline(g, R, x1, y1, x2, y2, j = 1.2, w = 1.5) {
  for (let pass = 0; pass < 2; pass++) {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 36));
    g.beginPath(); g.moveTo(x1 + (R() - .5) * j * 2, y1 + (R() - .5) * j * 2);
    for (let k = 1; k <= n; k++) { const t = k / n; g.lineTo(lerp(x1, x2, t) + (R() - .5) * j * 2, lerp(y1, y2, t) + (R() - .5) * j * 2); }
    g.lineWidth = w * (pass ? 0.55 : 1); g.globalAlpha = pass ? 0.5 : 0.92; g.stroke();
  }
  g.globalAlpha = 1;
}
export function rpoly(g, R, pts, j, w, close = true) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; rline(g, R, a[0], a[1], b[0], b[1], j, w); } }
export function wash(g, R, x, y, w, h, color, a = 0.8) { // uneven watercolour fill that doesn't quite respect its outline
  g.fillStyle = color; g.globalAlpha = a; g.beginPath();
  g.moveTo(x - 2 + R() * 3, y - 1 + R() * 3); g.lineTo(x + w - 1 + R() * 4, y - 2 + R() * 3); g.lineTo(x + w + R() * 3, y + h); g.lineTo(x - 2 + R() * 2, y + h); g.fill();
  g.globalAlpha = 0.15;
  for (let k = 0; k < 3; k++) { const bw = w * (0.3 + R() * 0.5), bh = h * (0.12 + R() * 0.3); g.fillRect(x + R() * (w - bw), y + R() * (h - bh), bw, bh); }
  g.fillStyle = '#fff'; g.globalAlpha = 0.07; g.fillRect(x, y, w * 0.26, h);
  g.fillStyle = '#000'; g.globalAlpha = 0.10; g.fillRect(x + w * 0.8, y, w * 0.2, h);
  g.globalAlpha = 1;
}
export function blob(g, R, cx, cy, r, color, a = 0.85) { // leafy / cloudy shape
  g.fillStyle = color; g.globalAlpha = a; g.beginPath();
  const n = 9; for (let k = 0; k <= n; k++) { const t = (k / n) * 6.283, rr = r * (0.8 + R() * 0.35); g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.85); }
  g.fill(); g.globalAlpha = 1;
}
export function tree(g, R, x, base, s) {
  g.strokeStyle = INK; rline(g, R, x, base, x + (R() - .5) * 3, base - 16 * s, 0.8, 1.6);
  const c = ['#3d6b5a', '#4a7355', '#35606a'][Math.floor(R() * 3)];
  blob(g, R, x, base - 24 * s, 11 * s, c); blob(g, R, x - 5 * s, base - 19 * s, 7 * s, c, .7);
  g.strokeStyle = INK; g.globalAlpha = .7; g.lineWidth = 1; g.beginPath(); for (let k = 0; k <= 10; k++) { const t = (k / 10) * 6.283; g.lineTo(x + Math.cos(t) * (11 * s + R() * 2), base - 24 * s + Math.sin(t) * (9.5 * s + R() * 2)); } g.stroke(); g.globalAlpha = 1;
}
export function lamp(g, R, x, base) {
  g.strokeStyle = INK; rline(g, R, x, base, x, base - 30, 0.6, 1.4); rline(g, R, x, base - 30, x + 7, base - 33, 0.5, 1.2);
  const gr = g.createRadialGradient(x + 8, base - 31, 0, x + 8, base - 31, 16); gr.addColorStop(0, 'rgba(255,214,130,.9)'); gr.addColorStop(.25, 'rgba(255,214,130,.35)'); gr.addColorStop(1, 'rgba(255,214,130,0)');
  g.fillStyle = gr; g.fillRect(x - 10, base - 48, 36, 34);
}

// ------------------------------------------------------------ one city block per year
export function buildBlock(yr, wip) {
  const R = rng((yr.seed ?? yr.year) * 7919), era = yr.era ?? eraOf(yr.year), WP = yr.wash || WASH[era];
  const W = Math.max(1, Math.round(yr.count / WIN)), lit = Math.round((yr.lit / yr.count) * W), gold = Math.min(lit, Math.round(yr.gold / WIN));
  const Wp = wip && yr.proj ? Math.max(W, Math.round(yr.proj.est / WIN)) : W; // footprint follows the projected full year
  const maxF = era === 0 ? clamp(Math.ceil(Wp / 3), 1, 3) : clamp(Math.round(Math.sqrt(Wp) * 1.75), 3, 92);
  let builds = [], left = Wp;
  while (left > 0) {
    const cols = era === 0 ? 2 + Math.floor(R() * 2) : 3 + Math.floor(R() * (era === 3 ? 3 : 4));
    let floors = builds.length ? Math.max(1, Math.round(maxF * (0.45 + R() * 0.55))) : maxF;
    const n = Math.min(left, cols * floors); floors = Math.ceil(n / cols);
    builds.push({ n, cols, floors }); left -= n;
  }
  for (let i = builds.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [builds[i], builds[j]] = [builds[j], builds[i]]; }
  for (const b of builds) b.built = b.floors;
  if (Wp > W) { let rem = W; builds.forEach((b, i) => { const bf = Math.max(1, Math.round((b.floors * W) / Wp)); b.n = i === builds.length - 1 ? Math.min(rem, b.cols * b.floors) : Math.min(rem, b.cols * bf); rem -= b.n; b.built = Math.ceil(b.n / b.cols); }); }
  const state = new Uint8Array(W); for (let i = 0; i < lit; i++) state[i] = i < gold ? 2 : 1;
  for (let i = W - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [state[i], state[j]] = [state[j], state[i]]; }
  const PADX = era <= 1 ? 30 : 18, tallF = Math.max(...builds.map((b) => b.floors));
  let x = PADX; for (const b of builds) { b.w = b.cols * CW + 12; b.h = b.floors * CH + 14; b.x = x; x += b.w + (era === 0 ? 14 + R() * 16 : 3 + R() * 9); }
  const width = Math.ceil(x + PADX), height = tallF * CH + 14 + TOP;
  const cv = document.createElement('canvas'); cv.width = width * SS; cv.height = height * SS; const g = cv.getContext('2d');
  g.scale(SS, SS); g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  const wx = new Float32Array(W), wy = new Float32Array(W); let wi = 0;
  const tallest = builds.reduce((a, b) => (b.floors > a.floors ? b : a));
  // greenery behind the houses in the early eras
  if (era <= 1) { tree(g, R, 12 + R() * 6, height, 0.9 + R() * 0.5); if (R() < 0.7) tree(g, R, width - 12 - R() * 6, height, 0.8 + R() * 0.5); }
  for (const b of builds) {
    const bx = b.x, by = height - b.h;
    const top = wip ? height - (b.built * CH + 12) : by; // where the finished part ends
    if (b.built > 0) wash(g, R, bx, top, b.w, height - top, WP[Math.floor(R() * WP.length)]);
    for (let f = 0; f < b.floors; f++) for (let c = 0; c < b.cols && f * b.cols + c < b.n; c++, wi++) {
      const px = bx + 6 + c * CW + (R() - .5) * 1.2, py = height - 8 - (f + 1) * CH + 3 + (R() - .5) * 1.2, s = state[wi];
      wx[wi] = px + WW / 2; wy[wi] = py + WH / 2;
      if (s) { g.fillStyle = s === 2 ? 'rgba(255,236,170,.34)' : 'rgba(255,205,120,.13)'; g.fillRect(px - 3, py - 3, WW + 6, WH + 6); }
      g.fillStyle = s === 2 ? '#fff7d6' : s === 1 ? (era === 3 && R() < 0.14 ? '#bfe6f2' : R() < 0.3 ? '#ffc35e' : '#ffd27a') : '#222943';
      g.globalAlpha = 0.93; g.fillRect(px, py, WW + (R() - .5), WH + (R() - .5)); g.globalAlpha = 1;
      if (s && R() < 0.5) { g.strokeStyle = 'rgba(23,26,46,.45)'; g.lineWidth = .7; g.beginPath(); g.moveTo(px + WW / 2, py); g.lineTo(px + WW / 2, py + WH); g.stroke(); }
    }
    g.strokeStyle = INK;
    if (b.built > 0) { rline(g, R, bx - 2, top, bx + b.w + 2, top, 1.1, 1.7); rline(g, R, bx + b.w, top - 2, bx + b.w, height, 1.1, 1.7); rline(g, R, bx, top - 2, bx, height, 1.1, 1.7); }
    if (wip) { // above the finished floors: an open scaffold up to where the year is heading
      g.strokeStyle = 'rgba(243,234,216,.62)';
      for (let k = 0; k <= 3; k++) { const xx = bx - 4 + ((b.w + 8) * k) / 3; rline(g, R, xx, top, xx, by - 6, .7, k % 3 === 0 ? 1.3 : .9); }
      for (let yy = top - CH * 3; yy > by - 8; yy -= CH * 3) rline(g, R, bx - 6, yy, bx + b.w + 6, yy, .6, .9);
      for (let yy = top, k = 0; yy - CH * 6 > by - 8; yy -= CH * 6, k++) { if (k % 2) rline(g, R, bx - 4, yy, bx + b.w + 4, yy - CH * 6, .6, .7); else rline(g, R, bx + b.w + 4, yy, bx - 4, yy - CH * 6, .6, .7); }
      g.setLineDash([5, 5]); g.lineWidth = 1; g.beginPath(); g.moveTo(bx - 4, by - 6); g.lineTo(bx + b.w + 4, by - 6); g.stroke(); g.setLineDash([]);
      g.strokeStyle = INK; continue;
    }
    if (era === 0 || b.floors <= 2) { // cottage: pitched roof, chimney
      const px = bx + b.w / 2 + (R() - .5) * 6, ph = 18 + R() * 10;
      g.fillStyle = ['#7b4a52', '#6a4a3e', '#5d5266'][Math.floor(R() * 3)]; g.globalAlpha = .88; g.beginPath(); g.moveTo(bx - 6, by + 1); g.lineTo(px, by - ph); g.lineTo(bx + b.w + 6, by + 1); g.fill(); g.globalAlpha = 1;
      rline(g, R, bx - 7, by, px, by - ph, 1.1, 1.7); rline(g, R, px, by - ph, bx + b.w + 7, by, 1.1, 1.7);
      if (R() < 0.6) { const cx = bx + b.w * 0.72; wash(g, R, cx, by - ph * 0.75, 6, ph * 0.5, '#5a4a45'); rline(g, R, cx, by - ph * 0.75, cx + 6, by - ph * 0.75, .6, 1.2); }
    } else if (b !== tallest) {
      const t = R();
      if (era === 1) { // parapet + water tank
        rline(g, R, bx + 2, by - 4, bx + b.w - 2, by - 4, .8, 1.2);
        if (t < 0.6) { const tx = bx + 5 + R() * Math.max(1, b.w - 26); wash(g, R, tx, by - 17, 15, 12, '#5a4a45'); rline(g, R, tx, by - 17, tx + 15, by - 17, .7, 1.2); rline(g, R, tx, by - 17, tx, by - 4, .7, 1.2); rline(g, R, tx + 15, by - 17, tx + 15, by - 4, .7, 1.2); }
      } else if (era === 2) { // antennas, plant rooms
        if (t < 0.5) { const ax = bx + b.w * (0.25 + R() * 0.5), ah = 16 + R() * 26; rline(g, R, ax, by, ax, by - ah, .8, 1.3); rline(g, R, ax - 5, by - ah * 0.6, ax + 5, by - ah * 0.6, .7, 1.1); }
        else { const tx = bx + 4 + R() * Math.max(1, b.w - 24); wash(g, R, tx, by - 11, 18, 10, '#3d4468'); rline(g, R, tx, by - 11, tx + 18, by - 11, .7, 1.2); }
      } else { // spires, crowns and a thin neon edge
        const cw = b.w * 0.5, cx = bx + (b.w - cw) / 2; wash(g, R, cx, by - 10, cw, 9, '#2c3966'); rline(g, R, cx, by - 10, cx + cw, by - 10, .7, 1.2);
        if (t < 0.6) { const sx = bx + b.w / 2, sh = 26 + R() * 44; rline(g, R, sx, by - 10, sx, by - 10 - sh, .5, 1.3); g.fillStyle = '#ff7a8a'; g.beginPath(); g.arc(sx, by - 10 - sh, 1.6, 0, 6.3); g.fill(); }
        g.strokeStyle = t < 0.5 ? 'rgba(120,230,240,.55)' : 'rgba(255,130,200,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx + 2.5, by + 6); g.lineTo(bx + 2.5, height - 4); g.stroke(); g.strokeStyle = INK;
      }
    }
  }
  if (era >= 1) lamp(g, R, width - 9, height); if (era >= 2) lamp(g, R, 5, height);
  // billboard scaffold on the tallest building: the year's most-reviewed game goes here
  const bbW = clamp(tallest.w + 34, 104, 156), bbH = (bbW * 215) / 460, bx = clamp(tallest.x + tallest.w / 2 - bbW / 2, 2, width - bbW - 2), by = height - tallest.h - bbH - 30;
  const fx = tallest.x + tallest.w / 2, roof = height - tallest.h;
  if (!wip) { rline(g, R, fx - 10, roof - 16, fx - 8, roof, .8, 1.5); rline(g, R, fx + 10, roof - 16, fx + 8, roof, .8, 1.5); rline(g, R, fx - 10, roof - 15, fx + 8, roof - 1, .7, 1); rline(g, R, fx + 10, roof - 15, fx - 8, roof - 1, .7, 1); }
  return { cv, width, height, year: yr.year, era, yr, W, wx, wy, state, wip, fx, roof, bb: { x: bx, y: by, w: bbW, h: bbH } };
}

// ------------------------------------------------------------ backdrop pieces (pre-rendered once)
export function makePaper() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const g = cv.getContext('2d'), R = rng(5);
  const id = g.createImageData(512, 512);
  for (let i = 0; i < id.data.length; i += 4) { const v = 208 + R() * 47; id.data[i] = v; id.data[i + 1] = v * .985; id.data[i + 2] = v * .95; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); g.strokeStyle = 'rgba(90,70,40,.10)';
  for (let k = 0; k < 260; k++) { const x = R() * 512, y = R() * 512, a = R() * 6.28, l = 6 + R() * 22; g.lineWidth = .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return cv;
}
export function makeHills(seed, color, amp, bush = '#1c2148') {
  const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 300; const g = cv.getContext('2d'), R = rng(seed), ph = [R() * 6, R() * 6, R() * 6];
  const yAt = (x) => 150 - amp * (Math.sin((x / 2400) * 12.566 + ph[0]) * .5 + Math.sin((x / 2400) * 31.416 + ph[1]) * .3 + Math.sin((x / 2400) * 69.115 + ph[2]) * .12);
  g.fillStyle = color; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= 2400; x += 8) g.lineTo(x, yAt(x) + (R() - .5) * 3); g.lineTo(2400, 300); g.fill();
  g.strokeStyle = INK; g.lineCap = 'round'; for (let x = 0; x < 2400; x += 40) { g.globalAlpha = .45; rline(g, R, x, yAt(x), x + 40, yAt(x + 40), 1.4, 1.2); }
  // a few scribbled trees on the ridge
  for (let k = 0; k < 26; k++) { const x = R() * 2400; g.globalAlpha = .5; blob(g, R, x, yAt(x) - 5, 5 + R() * 6, bush, .8); }
  return cv;
}
export function makeSkyline(seed) { // distant city silhouette for the later eras
  const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 300; const g = cv.getContext('2d'), R = rng(seed);
  for (let x = 0; x < 2400;) {
    const w = 18 + R() * 46, h = 40 + R() * R() * 220; g.fillStyle = '#161b45'; g.globalAlpha = .95; g.fillRect(x, 300 - h, w, h);
    g.fillStyle = '#ffd27a'; for (let k = 0; k < (w * h) / 420; k++) { g.globalAlpha = .25 + R() * .4; g.fillRect(x + 3 + R() * (w - 6), 300 - h + 4 + R() * (h - 8), 2, 2.5); }
    if (R() < 0.25) { g.strokeStyle = '#161b45'; g.globalAlpha = 1; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + w / 2, 300 - h); g.lineTo(x + w / 2, 300 - h - 14 - R() * 20); g.stroke(); }
    x += w + R() * 5;
  }
  return cv;
}
export function makeCloud(seed) {
  const cv = document.createElement('canvas'); cv.width = 360; cv.height = 130; const g = cv.getContext('2d'), R = rng(seed);
  g.fillStyle = '#fff'; // soft watercolour puffs: many faint overlapping discs with a flat underside
  g.save(); g.beginPath(); g.rect(0, 0, 360, 98); g.clip();
  for (let k = 0; k < 22; k++) { const u = R(), x = 50 + u * 260, r = 16 + R() * 26 * Math.sin(u * 3.14 + 0.2); g.globalAlpha = 0.05 + R() * 0.05; g.beginPath(); g.arc(x, 98 - r * 0.55 - R() * 10, Math.max(8, r), 0, 6.3); g.fill(); }
  g.restore(); g.globalAlpha = 1;
  return cv;
}
export function makeRipples() {
  const cv = document.createElement('canvas'); cv.width = 600; cv.height = 160; const g = cv.getContext('2d'), R = rng(77);
  g.lineCap = 'round';
  for (let k = 0; k < 70; k++) { const x = R() * 600, y = R() * 160, l = 14 + R() * 50; g.strokeStyle = R() < 0.5 ? 'rgba(10,12,40,.55)' : 'rgba(255,230,180,.13)'; rline(g, R, x, y, x + l, y, .7, 1 + R()); }
  return cv;
}

export function drawCrane(g, x, y, s, t, seed) { // tower crane perched on a rising building
  const R = rng(seed); g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = INK; g.lineCap = 'round';
  const mh = 86, jib = 92, back = 30;
  rline(g, R, -5, 0, -5, -mh, .7, 1.7); rline(g, R, 5, 0, 5, -mh, .7, 1.7);
  for (let yy = 0; yy > -mh + 8; yy -= 14) { rline(g, R, -5, yy, 5, yy - 14, .5, 1); rline(g, R, 5, yy, -5, yy - 14, .5, 1); }
  rline(g, R, -back, -mh, jib, -mh, .8, 1.8); rline(g, R, -back, -mh + 7, jib * 0.92, -mh + 7, .6, 1.1);
  for (let xx = -back; xx < jib - 8; xx += 13) rline(g, R, xx, -mh, xx + 6.5, -mh + 7, .4, .9);
  rline(g, R, 0, -mh - 22, jib * 0.8, -mh, .5, 1); rline(g, R, 0, -mh - 22, -back, -mh, .5, 1); rline(g, R, 0, -mh, 0, -mh - 22, .5, 1.4);
  g.fillStyle = '#3a3550'; g.fillRect(-back - 2, -mh + 7, 14, 10);
  const hx = jib * (0.45 + 0.25 * Math.sin(t * 0.5)), hl = 30 + 12 * Math.sin(t * 0.8);
  g.lineWidth = 1; g.beginPath(); g.moveTo(hx, -mh + 7); g.lineTo(hx, -mh + 7 + hl); g.stroke(); g.fillStyle = '#c9a14a'; g.fillRect(hx - 5, -mh + 7 + hl, 10, 7); g.strokeRect(hx - 5, -mh + 7 + hl, 10, 7);
  g.fillStyle = `rgba(255,90,90,${0.5 + 0.5 * Math.sin(t * 4)})`; g.beginPath(); g.arc(0, -mh - 24, 2.4, 0, 6.3); g.fill();
  g.restore();
}

// ------------------------------------------------------------ the balloon: the one thing that never changes
export function drawBalloon(g, x, y, tilt, t, night) {
  const R = rng(900 + (Math.floor(t * 6) % 3)); // gentle "line boil"
  g.save(); g.translate(x, y); g.rotate(tilt);
  const glow = g.createRadialGradient(0, 44, 0, 0, 44, 70); glow.addColorStop(0, `rgba(255,200,110,${0.25 + 0.3 * night})`); glow.addColorStop(1, 'rgba(255,200,110,0)');
  g.fillStyle = glow; g.fillRect(-70, -26, 140, 140);
  // envelope with stripes
  const env = () => { g.beginPath(); g.moveTo(-9, 30); g.bezierCurveTo(-46, 2, -44, -52, 0, -54); g.bezierCurveTo(44, -52, 46, 2, 9, 30); g.closePath(); };
  env(); g.fillStyle = '#e9dfc8'; g.fill(); g.save(); env(); g.clip();
  g.fillStyle = '#c8553d'; for (const [a, b] of [[-44, -26], [-9, 9], [26, 44]]) { g.beginPath(); g.moveTo(a * 0.25, 32); g.quadraticCurveTo(a * 1.5, -20, a * 0.2, -56); g.lineTo(b * 0.2, -56); g.quadraticCurveTo(b * 1.5, -20, b * 0.25, 32); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.ellipse(-16, -22, 10, 24, 0.3, 0, 6.3); g.fill();
  g.fillStyle = 'rgba(23,26,46,.18)'; g.beginPath(); g.ellipse(24, -8, 14, 38, -0.2, 0, 6.3); g.fill(); g.restore();
  g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 1.8; g.globalAlpha = .9;
  g.beginPath(); g.moveTo(-9 + R(), 30 + R()); g.bezierCurveTo(-46 + R() * 2, 2, -44, -52 + R() * 2, 0, -54 + R()); g.bezierCurveTo(44, -52 + R() * 2, 46 + R() * 2, 2, 9 + R(), 30 + R()); g.stroke(); g.globalAlpha = 1;
  // ropes, burner flame, basket
  rline(g, R, -8, 31, -7, 46, .5, 1.1); rline(g, R, 8, 31, 7, 46, .5, 1.1);
  g.fillStyle = '#ffd27a'; g.beginPath(); g.moveTo(-3, 40); g.quadraticCurveTo(0, 28 + Math.sin(t * 9) * 3, 3, 40); g.fill();
  g.fillStyle = '#7a553c'; g.fillRect(-8, 46, 16, 11); g.strokeStyle = INK; rpoly(g, R, [[-8, 46], [8, 46], [8, 57], [-8, 57]], .5, 1.3);
  rline(g, R, -8, 50, 8, 50, .4, .8);
  g.restore();
}

