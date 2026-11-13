import { createRequire } from 'module'; import fs from 'fs'; const { chromium } = createRequire(import.meta.url)('playwright');
const [manifestPath, outDir] = process.argv.slice(2), items = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const b = await chromium.launch(); const pg = await b.newPage(); pg.on('pageerror', e => console.log('pageerror', e.message));
await pg.goto('http://localhost:8765/artkit.html'); await pg.waitForFunction(() => window.__refs, null, { timeout: 120000 });
const refs = await pg.evaluate(() => window.__refs); const meta = {};
for (const r of refs) { const it = items.find((i) => i.id === r.id), dir = `${outDir}/batch-${String(it.batch).padStart(2, '0')}`; fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/ref-${it.n}-${it.id}.png`, Buffer.from(r.png.split(',')[1], 'base64')); meta[r.id] = { layout: r.layout, anchors: r.anchors, unit: r.unit }; Object.assign(it, { layout: r.layout }); }
fs.writeFileSync(`${outDir}/refs.json`, JSON.stringify(meta)); fs.writeFileSync(manifestPath, JSON.stringify(items, null, 1)); console.log(refs.length, 'reference sheets'); await b.close();
