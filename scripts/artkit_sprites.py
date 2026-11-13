# Turn the hand-drawn sheets (output/batch-0X/<id>.png, four views per sheet) into the sprites the map loads:
#   site/sprites/<id>.webp   the cleaned sheet
#   site/sprites/sprites.json  for every component: which model it replaces, its scale, and for each view its
#                              crop box and the pixel that stands on the ground
# Usage: python scripts/artkit_sprites.py [output] [site/sprites]
import json, sys, os
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else 'output'
DST = sys.argv[2] if len(sys.argv) > 2 else 'site/sprites'
PAD = 6          # models.js pads every rendered sprite by 6 sprite px; the reference sheets inherit it
os.makedirs(DST, exist_ok=True)
items = json.load(open('site/artkit-manifest.json', encoding='utf8'))
refs = json.load(open('artkit/refs.json'))

def bbox(mask):
    ys, xs = np.where(mask.any(1))[0], np.where(mask.any(0))[0]
    return None if not len(xs) else (int(xs[0]), int(ys[0]), int(xs[-1]) + 1, int(ys[-1]) + 1)

out, missing, total = {}, [], 0
for it in items:
    path = f"{SRC}/batch-{it['batch']:02d}/{it['id']}.png"
    if not os.path.exists(path): missing.append(it['id']); continue
    L, ref = it['layout'], refs[it['id']]
    art = Image.open(path).convert('RGBA')
    if art.size != (L['W'], L['H']): art = art.resize((L['W'], L['H']), Image.LANCZOS)
    a = np.array(art)
    # clean-up: drop the near-invisible haze left by background removal, and the magenta rim on sheets that were keyed from #FF00FF
    keyed = a[2, 2, 0] > 200 and a[2, 2, 1] < 60 and a[2, 2, 2] > 200
    a[a[..., 3] < 24] = 0
    if keyed:
        r, g, b = (a[..., k].astype(int) for k in range(3))
        a[(r - g > 90) & (b - g > 90) & (a[..., 3] < 250)] = 0
    alpha = a[..., 3]
    refimg = np.asarray(Image.open(f"artkit/batch-{it['batch']:02d}/ref-{it['n']}-{it['id']}.png").convert('RGB')).astype(int)
    cw, ch, s, views = L['W'] // L['cols'], L['H'] // L['rows'], ref['unit'], []
    for k in range(4):
        x0, y0 = (k % L['cols']) * cw, (k // L['cols']) * ch
        ab = bbox(alpha[y0:y0 + ch, x0:x0 + cw] > 128)
        rb = bbox((255 - refimg[y0 + 3:y0 + ch - 3, x0 + 3:x0 + cw - 3].min(2)) > 40)   # skip the grey divider lines
        if ab is None or rb is None: views.append(None); continue
        rb = [v + 3 for v in rb]
        if it['kind'] == 'trees':   # four different trees, not a turnaround: each stands on the foot of its trunk
            ax, ay = (ab[0] + ab[2]) / 2, ab[3] - 0.03 * (ab[3] - ab[1])
        else:
            # where the model's ground point sits in the reference cell ...
            ws, hs = rb[2] - rb[0] + 2 * PAD * s, rb[3] - rb[1] + 2 * PAD * s
            rx = (rb[0] + rb[2]) / 2 - ws / 2 + ref['anchors'][k][0] * ws
            ry = (rb[1] + rb[3]) / 2 - hs / 2 + ref['anchors'][k][1] * hs
            # ... moved with the painting: it is rarely pixel-identical to the reference, so keep the ground point
            # at the same offset from the painting's centre line and bottom edge as it had in the reference
            ax, ay = rx + (ab[0] + ab[2] - rb[0] - rb[2]) / 2, ry + (ab[3] - rb[3])
        m = 4; bx0, by0, bx1, by1 = max(0, ab[0] - m), max(0, ab[1] - m), min(cw, ab[2] + m), min(ch, ab[3] + m)
        views.append([x0 + bx0, y0 + by0, bx1 - bx0, by1 - by0, round(float(ax - bx0), 1), round(float(ay - by0), 1)])
    a[alpha == 0] = 0
    f = f"{DST}/{it['id']}.webp"
    Image.fromarray(a).save(f, 'WEBP', quality=88, method=6)
    total += os.path.getsize(f)
    e = {'kind': it['kind'], 'unit': s, 'views': views}
    for key in ('model', 'family', 'floors', 'variant'):
        if key in it: e[key] = it[key]
    out[it['id']] = e
json.dump(out, open(f'{DST}/sprites.json', 'w'), separators=(',', ':'))
print(len(out), 'sprite sheets,', round(total / 1e6, 1), 'MB ->', DST)
if missing: print('not drawn yet (the map keeps the code-drawn version):', ', '.join(missing))
