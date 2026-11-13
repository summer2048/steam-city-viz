// Layouts: each returns a Float32Array(n*4) of [cx, cy, sx, sy] per game (data order) plus metadata.
export const TILE_W = 2.14, TILE_H = 1.0;
const CW = 2.3, CH = 1.15; // cell pitch

// Sort key that turns a pile of covers into a spectrum: hue for colourful covers, greys parked at the end by brightness.
export function colorKey(d) {
  const { n, rgb, lum } = d, key = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (chroma < 14) key[i] = 2 + lum[i] / 256;
    else key[i] = ((Math.atan2(1.732 * (g - b), 2 * r - g - b) / (2 * Math.PI)) + 1.04) % 1;
  }
  return key;
}

// ---------- A: one column per year. Months stack upward; inside a month covers sweep left->right through the spectrum.
export function layoutYears(d, key) {
  const { n, yearf } = d;
  const COLW = 30, GAP = 12, FIRST = 2005;
  const out = new Float32Array(n * 4);
  const cols = [];
  const colOf = new Uint8Array(n), bandOf = new Uint16Array(n);
  let cur = -1;
  for (let i = 0; i < n; i++) {
    const y = Math.max(FIRST, Math.floor(yearf[i]));
    if (y !== cur) { cur = y; cols.push({ year: y, label: y === FIRST ? '≤2005' : String(y), x0: cols.length * (COLW * CW + GAP), start: i, count: 0 }); }
    colOf[i] = cols.length - 1; cols[cols.length - 1].count++;
  }
  const bands = [];
  const put = (id, x0, c, r, y0) => {
    out[id * 4] = x0 + (c + 0.5) * CW; out[id * 4 + 1] = y0 + (r + 0.5) * CH; out[id * 4 + 2] = TILE_W; out[id * 4 + 3] = TILE_H;
  };
  cols.forEach((col, k) => {
    col.x1 = col.x0 + COLW * CW;
    if (k === 0 || col.count < COLW * 3) { // tiny years stay in plain release order
      for (let j = 0; j < col.count; j++) { put(col.start + j, col.x0, j % COLW, (j / COLW) | 0, 0); bandOf[col.start + j] = bands.length; }
      bands.push({ chrono: true, col: k, start: col.start, top: Math.ceil(col.count / COLW) * CH });
      col.height = Math.ceil(col.count / COLW) * CH; return;
    }
    const nb = col.count < 1500 ? 1 : 12; let y0 = 0, i = col.start; const end = col.start + col.count;
    for (let m = 0; m < nb; m++) {
      const ids = [];
      while (i < end && (m === nb - 1 || Math.floor((yearf[i] - col.year) * nb) <= m)) ids.push(i++);
      if (!ids.length) continue;
      ids.sort((a, b) => key[a] - key[b]);
      const rows = Math.ceil(ids.length / COLW);
      ids.forEach((id, j) => { put(id, col.x0, (j / rows) | 0, j % rows, y0); bandOf[id] = bands.length; });
      y0 += rows * CH; bands.push({ chrono: false, col: k, top: y0 });
    }
    col.height = y0;
  });
  // bounding box of everything released up to (fractional) time T
  const bboxAt = (T) => {
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (yearf[m] <= T) lo = m + 1; else hi = m; }
    const shown = Math.max(1, lo), last = shown - 1, kc = colOf[last], bd = bands[bandOf[last]];
    const inCol = shown - cols[kc].start;
    let h = bd.chrono ? Math.ceil(inCol / COLW) * CH : bd.top;
    for (let j = 0; j < kc; j++) h = Math.max(h, cols[j].height);
    const w = cols[kc].x0 + (bd.chrono ? Math.min(COLW, inCol) : COLW) * CW;
    return { x0: 0, y0: 0, x1: Math.max(w, CW), y1: Math.max(h, CH), shown, col: kc };
  };
  return { pos: out, cols, bboxAt, bbox: bboxAt(9999) };
}

// ---------- B: area = reviews. Treemap for the top 1%, the rest packed into a strip of proportional area.
function squarify(items, x, y, w, h, emit) {
  // items: [{v, id}] sorted desc; lays out into rect, v sums to w*h
  let i = 0;
  const worst = (row, sum, side) => {
    const s2 = sum * sum, side2 = side * side;
    return Math.max((side2 * row[0].v) / s2, s2 / (side2 * row[row.length - 1].v));
  };
  while (i < items.length) {
    const side = Math.min(w, h);
    let row = [items[i]], sum = items[i].v, j = i + 1;
    while (j < items.length) {
      const next = row.concat(items[j]), ns = sum + items[j].v;
      if (worst(next, ns, side) <= worst(row, sum, side)) { row = next; sum = ns; j++; } else break;
    }
    const thick = sum / side;
    let off = 0;
    for (const it of row) {
      const len = it.v / thick;
      if (w >= h) emit(it.id, x, y + off, thick, len); else emit(it.id, x + off, y, len, thick);
      off += len;
    }
    if (w >= h) { x += thick; w -= thick; } else { y += thick; h -= thick; }
    i = j;
  }
}

export function layoutReviews(d, share, key) {
  const { n, rev, tier } = d;
  const W = 1600, H = 640, PAD = 14;
  const out = new Float32Array(n * 4);
  const top = [], rest = [];
  for (let i = 0; i < n; i++) (tier[i] === 2 ? top : rest).push(i);
  top.sort((a, b) => rev[b] - rev[a]);
  const Wl = (W - PAD) * share;
  // treemap in a space where x is squeezed so "square" cells come out cover-shaped
  const SQ = 1.9, w2 = Wl / SQ;
  let tot = 0; for (const i of top) tot += rev[i];
  const items = top.map((i) => ({ id: i, v: (rev[i] / tot) * w2 * H }));
  squarify(items, 0, 0, w2, H, (id, x, y, w, h) => {
    const rw = w * SQ, g = Math.min(0.9, rw * 0.04, h * 0.04);
    out[id * 4] = x * SQ + rw / 2; out[id * 4 + 1] = H - (y + h / 2);
    out[id * 4 + 2] = rw - g; out[id * 4 + 3] = h - g;
  });
  const sx0 = Wl + PAD, sw = W - sx0;
  const ch0 = Math.sqrt((sw * H) / (rest.length * 2.0));
  const cols = Math.ceil(sw / (ch0 * 2.0)), rows = Math.ceil(rest.length / cols);
  const cw = sw / cols, ch = H / rows;
  rest.sort((a, b) => key[a] - key[b]);
  rest.forEach((id, k) => {
    const c = (k / rows) | 0, r = k % rows;
    out[id * 4] = sx0 + (c + 0.5) * cw; out[id * 4 + 1] = H - (r + 0.5) * ch;
    out[id * 4 + 2] = cw * 0.92; out[id * 4 + 3] = ch * 0.88;
  });
  return { pos: out, bbox: { x0: 0, y0: 0, x1: W, y1: H }, split: Wl, stripX: sx0, W, H, top };
}

// ---------- C: one "violin" per genre on a shared brightness axis (dark at the bottom, bright on top)
export function layoutGenres(d, order, perRow = order.length) {
  const { n, genre, lum, rgb } = d;
  const ROWS = perRow < order.length ? 320 : 560, GAP = 26, LABEL = perRow < order.length ? 130 : 60;
  const out = new Float32Array(n * 4);
  const slot = new Map(order.map((g, k) => [g, k]));
  const rows = order.map(() => Array.from({ length: ROWS }, () => []));
  const hue = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    hue[i] = Math.atan2(1.732 * (g - b), 2 * r - g - b);
    const jit = ((Math.imul(i + 7, 2246822519) >>> 0) % 1000) / 1000;
    const row = Math.min(ROWS - 1, Math.floor(((lum[i] + jit) / 256) * ROWS));
    rows[slot.get(genre[i])][row].push(i);
  }
  let peak = 0;
  for (const g of rows) for (const r of g) peak = Math.max(peak, r.length);
  const pitch = peak * CW + GAP, bandH = ROWS * CH + LABEL;
  const nBands = Math.ceil(order.length / perRow);
  const cols = [];
  rows.forEach((g, k) => {
    const band = Math.floor(k / perRow), xc = ((k % perRow) + 0.5) * pitch, y0 = (nBands - 1 - band) * bandH;
    let count = 0; const lums = [];
    g.forEach((r, j) => {
      r.sort((a, b) => hue[a] - hue[b]);
      const w = r.length * CW;
      r.forEach((id, c) => {
        out[id * 4] = xc - w / 2 + (c + 0.5) * CW; out[id * 4 + 1] = y0 + (j + 0.5) * CH;
        out[id * 4 + 2] = TILE_W; out[id * 4 + 3] = TILE_H; lums.push(lum[id]);
      });
      count += r.length;
    });
    lums.sort((a, b) => a - b);
    const median = lums[lums.length >> 1];
    cols.push({ genre: order[k], xc, y0, y1: y0 + ROWS * CH, count, median, medianY: y0 + ((median + 0.5) / 256) * ROWS * CH, pitch });
  });
  return { pos: out, cols, pitch, bbox: { x0: 0, y0: 0, x1: Math.min(perRow, order.length) * pitch, y1: nBands * bandH - LABEL } };
}

// ---------- spatial index for hover picking
export function buildIndex(pos, n, bbox) {
  const CELL = 6;
  const gx = Math.ceil((bbox.x1 - bbox.x0) / CELL) + 2, gy = Math.ceil((bbox.y1 - bbox.y0) / CELL) + 2;
  const big = [];
  const cellOf = new Int32Array(n).fill(-1);
  const count = new Uint32Array(gx * gy + 1);
  for (let i = 0; i < n; i++) {
    if (pos[i * 4 + 2] > CELL || pos[i * 4 + 3] > CELL) { big.push(i); continue; }
    const cx = Math.floor((pos[i * 4] - bbox.x0) / CELL) + 1, cy = Math.floor((pos[i * 4 + 1] - bbox.y0) / CELL) + 1;
    if (cx < 0 || cy < 0 || cx >= gx || cy >= gy) continue;
    cellOf[i] = cy * gx + cx; count[cellOf[i] + 1]++;
  }
  for (let c = 0; c < gx * gy; c++) count[c + 1] += count[c];
  const fill = count.slice(0, gx * gy), items = new Uint32Array(n);
  for (let i = 0; i < n; i++) if (cellOf[i] >= 0) items[fill[cellOf[i]]++] = i;
  const hit = (i, x, y) => Math.abs(x - pos[i * 4]) <= pos[i * 4 + 2] / 2 + 0.08 && Math.abs(y - pos[i * 4 + 1]) <= pos[i * 4 + 3] / 2 + 0.08;
  return (x, y, ok) => {
    for (const i of big) if (hit(i, x, y) && (!ok || ok(i))) return i;
    const cx = Math.floor((x - bbox.x0) / CELL) + 1, cy = Math.floor((y - bbox.y0) / CELL) + 1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = cx + dx, Y = cy + dy;
      if (X < 0 || Y < 0 || X >= gx || Y >= gy) continue;
      const c = Y * gx + X;
      for (let k = count[c]; k < count[c + 1]; k++) { const i = items[k]; if (hit(i, x, y) && (!ok || ok(i))) return i; }
    }
    return -1;
  };
}
