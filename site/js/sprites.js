// Hand-painted sprites (the "art kit"): one sheet per component with four views, 90° apart, made by
// scripts/artkit_sprites.py. They stand in for the code-drawn models of models.js wherever a sheet exists;
// anything without a sheet keeps its code-drawn sprite.
const V = '20261113b';

// The sheets were painted at model yaw 45°, 135°, 225°, 315°, so the map sits at those four angles.
export const TH0 = Math.PI / 4, TURN = Math.PI / 2;
export const viewOf = (th) => ((Math.round((th - TH0) / TURN) % 4) + 4) % 4;

const img = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
// A view cut out of its sheet, measured in the same "sprite px" as renderSprite() so the map can draw either kind.
function cut(sheet, [x, y, w, h, ax, ay], unit) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(sheet, x, y, w, h, 0, 0, w, h);
  return { cv, w: w / unit, h: h / unit, ox: ax / unit, oy: ay / unit, top: (ay - 4) / unit, half: (w - 8) / 2 / unit, art: true };
}
// Window light carries data on the map (share of games with 10+ reviews), so each ordinary building gets a dark and a dim copy:
// the warm yellow glow is pulled towards a dark window colour by `amt`.
function dim(sp, amt) {
  const cv = document.createElement('canvas'); cv.width = sp.cv.width; cv.height = sp.cv.height; const g = cv.getContext('2d'); g.drawImage(sp.cv, 0, 0);
  const id = g.getImageData(0, 0, cv.width, cv.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue; const r = d[i], gg = d[i + 1], b = d[i + 2];
    const glow = Math.min(1, Math.max(0, (gg - 125) / 50)) * Math.min(1, Math.max(0, (r - b - 60) / 60)) * Math.min(1, Math.max(0, (r - 170) / 40)); if (!glow) continue;
    const a = glow * amt; d[i] = r + (58 - r) * a; d[i + 1] = gg + (62 - gg) * a; d[i + 2] = b + (92 - b) * a;
  }
  g.putImageData(id, 0, 0); return { ...sp, cv };
}
const scaled = (sp, f) => ({ ...sp, w: sp.w * f, h: sp.h * f, ox: sp.ox * f, oy: sp.oy * f, top: sp.top * f, half: sp.half * f });

// Returns null when there is no art kit at all; otherwise lookups that return null for anything not painted yet.
export async function loadArt() {
  let meta; try { meta = await (await fetch(`sprites/sprites.json?v=${V}`)).json(); } catch (e) { return null; }
  const lm = {}, fams = {}, trees = [], memo = new Map();
  await Promise.all(Object.entries(meta).map(async ([id, m]) => {
    let sheet; try { sheet = await img(`sprites/${id}.webp?v=${V}`); } catch (e) { return; }
    if (m.views.some((v) => !v)) return; const views = m.views.map((v) => cut(sheet, v, m.unit));
    if (m.kind === 'landmark') lm[m.model] = views;
    else if (m.kind === 'trees') trees.push(...views.map((sp) => scaled(sp, 0.8))); // painted trees read bigger than the old blobs
    else (fams[m.family] = fams[m.family] || []).push({ id, floors: m.floors, variant: m.variant, lv: [null, null, views] });
  }));
  for (const f of Object.values(fams)) f.sort((a, b) => a.floors - b.floors || a.variant - b.variant);
  return {
    trees,
    landmark: (model) => lm[model] || null,
    // An ordinary building: the painted design of that family with the nearest number of floors (variants take turns),
    // nudged in size so that taller still reads as taller. lv: 0 dark, 1 half lit, 2 lit.
    generic(family, floors, variant, lv) {
      const f = fams[family]; if (!f) return null;
      const key = `${family}|${floors}|${variant}|${lv}`; if (memo.has(key)) return memo.get(key);
      const gap = (e) => Math.abs(Math.log(floors / e.floors)), best = Math.min(...f.map(gap)), same = f.filter((e) => gap(e) - best < 1e-6), e = same[variant % same.length];
      if (!e.lv[lv]) e.lv[lv] = e.lv[2].map((sp) => dim(sp, lv ? 0.5 : 0.92));
      const k = Math.min(1.3, Math.max(0.75, floors / e.floors)) ** 0.6, views = e.lv[lv].map((sp) => scaled(sp, k));
      memo.set(key, views); return views;
    },
  };
}
