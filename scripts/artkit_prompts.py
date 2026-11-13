# Writes artkit/PROMPTS.md (Chinese instructions + English prompts for ChatGPT) from the component manifest.
import json, sys
items = json.load(open(sys.argv[1])); out = sys.argv[2]
LAY = {(4, 1): 'four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4)', (1, 4): 'four cells stacked in ONE COLUMN (top to bottom: view 1, 2, 3, 4)', (2, 2): 'a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4)'}

STYLE = """STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art."""

RULES = """HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells."""

PROCESS = """HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed."""

def item_block(it):
    L = it['layout']; lay = LAY[(L['cols'], L['rows'])]
    if it['kind'] == 'trees':
        return f"{it['n']}. SAVE AS `{it['id']}.png`. Reference: `ref-{it['n']}-{it['id']}.png`. Canvas {L['W']}×{L['H']}, {lay}.\n   {it['desc']}. Rules 2 and 3 do not apply to this item; all other rules do (trees ARE the subject here)."
    return f"{it['n']}. SAVE AS `{it['id']}.png`. Reference: `ref-{it['n']}-{it['id']}.png`. Canvas {L['W']}×{L['H']}, {lay}.\n   Subject: {it['name']}. {it['desc'][0].upper() + it['desc'][1:]}."

md = []
md.append("""# 手绘组件素材包：给 ChatGPT 的提示词

这份文档配合同一压缩包里的 `batch-01` 到 `batch-08` 文件夹使用。一共 64 个组件，分 8 批，每批 8 张图。

## 每个组件要画成什么样

每个组件是**一张图**，图里把同一栋建筑从四个方向各画一次（每次转 90°）。这样四个角度是在同一次生成里画出来的，彼此最容易保持一致。拿到图后由我来裁切、去背景、接进地图。

地图因此改为每次转 90°，共四个朝向，建筑都是“一个角朝向观众”的等距视角。

## 你需要上传的图片

每一批对话里上传两类图：

1. **风格锚图 `style-anchor.png`（1 张，每批都传同一张）**：决定所有组件的画风。它需要你先做出来，见下面“第 0 步”。如果你手上已经有想要的风格参考图，可以直接用它当锚图，跳过第 0 步。
2. **该批的 8 张白模参考图**：在对应的 `batch-0X` 文件夹里，文件名是 `ref-序号-组件名.png`。它们是我用现有模型渲染的四视角灰模，只用来告诉 ChatGPT 形状、比例和四个视角的朝向，不代表画风。

所以每批一共上传 9 张图。ChatGPT 单条消息最多能带 10 个附件，正好够用。

## 第 0 步：先定风格（只做一次）

新开一个对话，上传 `batch-01/ref-1-cn-tower.png`（如果有自己的风格参考图也一起传），发送下面这段：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. The attached sheet is a crude grey-box model of the CN Tower seen from four sides; use it only for geometry, layout and viewpoint.

Redraw it as finished art, following every rule below.

""" + STYLE + "\n\n" + RULES + """

Subject: CN Tower, Toronto. Very tall slender concrete tower: three-legged tapering shaft, a round doughnut-shaped main pod two-thirds up, a smaller upper pod, long antenna mast with a red light on top.
Canvas 1536×1024, four cells side by side in one row.
```

不满意就直接告诉它怎么改（比如“线条再粗一点”“颜色更鲜艳”“更像水彩”），直到满意为止。然后：

- 把满意的那张图保存为 `style-anchor.png`。
- 如果你改过风格描述，把最终的描述替换到下面每批提示词的 STYLE 段里，保证每批用的是同一段文字。

风格是这一步定的，后面 8 批只是照着它画，所以值得在这里多试几次。

## 第 1 到 8 步：分批生成

每批新开一个对话（对话太长时 ChatGPT 容易忘掉规则），上传 `style-anchor.png` 和该批文件夹里的 8 张参考图，然后粘贴该批的提示词。

建议先只做第 1 批，把结果发给我接进地图看效果，确认没问题再做后面的，避免 64 张都画完才发现要调整。

### 失败和重试

- 提示词里已经要求 ChatGPT：一次只画一张；某张失败或不合规则时自己重画，最多 3 次；遇到限额时说明停在哪一张。
- **遇到限额**：等它提示的时间过去后（通常是几十分钟到几小时），在同一个对话里发 `continue`，它会从停下的那张接着画。
- **如果它忘了规则或开始画错**：新开对话，重新上传锚图和还没完成的那几张参考图，粘贴同一批的提示词，并在最后加一句 `Only do items 5 to 8.`（换成实际没完成的序号）。
- **单张不合格**：在对话里发下面的修正语句之一。

```text
Redo item 3 only. The four views do not show the same building: keep the same colours, floors and roof in all four cells.
```

```text
Redo item 3 only. The background must be completely empty: remove the ground, shadow and everything that is not the building.
```

```text
Redo item 3 only. Follow the reference layout exactly: same canvas size, same four cells, same order, same facing direction in each cell.
```

```text
Redo item 3 only. Match the drawing style of style-anchor.png more closely: same line weight, same paint texture, same palette.
```

### 每张图的验收标准

收下一张图之前，对照这五条：

1. 四个格子里是同一栋建筑，颜色、层数、屋顶一致。
2. 四个视角的朝向顺序和参考图一致。
3. 背景是空的（透明或纯洋红），没有地面、阴影、文字、边框。
4. 建筑没有碰到格子边缘，四个格子里大小一致。
5. 画风和锚图一致。

第 1、2 条最容易出问题，也最影响效果；第 5 条有轻微差异可以接受。

### 保存和交回

- 按提示词里给的文件名保存，例如 `cn-tower.png`，下载时保持原始分辨率，不要截图。
- 全部放进一个文件夹发给我（按批发也可以）。我会裁切、去背景、对齐落地点，然后替换地图里对应的组件。没画的组件会继续用现在的代码绘制版本。

### 降级到方案 C

第 1 到 4 批和第 5 批的前 4 张是地标和船，共 36 张，它们决定地图的辨识度。第 5 批后半到第 8 批是普通建筑和树，共 28 张。如果普通建筑画出来不稳定，或者你不想画这么多，告诉我，这 28 个由我来离线生成，你只需要完成前 36 张。

---
""")
names = {1: '地标：市中心核心', 2: '地标：市中心与大学区', 3: '地标：老城与东区', 4: '地标：港口、展览广场与西区', 5: '群岛地标、船、树、住宅', 6: '普通建筑：小屋、店面、砖楼', 7: '普通建筑：学院、仓库、筒仓、展馆', 8: '普通建筑：公寓与写字楼'}
for b in range(1, 9):
    its = [i for i in items if i['batch'] == b]
    md.append(f"## 第 {b} 批：{names[b]}\n\n上传：`style-anchor.png` + `batch-{b:02d}/` 里的 8 张参考图。然后粘贴：\n\n```text\nI am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:\n- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.\n- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.\n\nFor each reference sheet, draw one finished image of that building.\n\n{STYLE}\n\n{RULES}\n\n{PROCESS}\n\nITEMS IN THIS BATCH:\n" + "\n".join(item_block(i) for i in its) + "\n```\n")
open(out, 'w').write("\n".join(md))
print('wrote', out, len("\n".join(md)), 'chars')
