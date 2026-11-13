# 手绘组件素材包：给 ChatGPT 的提示词

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

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

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

## 第 1 批：地标：市中心核心

上传：`style-anchor.png` + `batch-01/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `cn-tower.png`. Reference: `ref-1-cn-tower.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: CN Tower, Toronto. Very tall slender concrete tower: three-legged tapering shaft, a round doughnut-shaped main pod two-thirds up (white ring, dark glass band, radome below), a smaller upper pod, long antenna mast with a red aircraft light on top.
2. SAVE AS `rogers-centre.png`. Reference: `ref-2-rogers-centre.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Rogers Centre (SkyDome), Toronto. Big round stadium with a white segmented retractable dome roof, low concrete drum with dark glazing around the base.
3. SAVE AS `city-hall.png`. Reference: `ref-3-city-hall.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Toronto City Hall (new). Two curved concrete towers of different heights facing each other like cupped hands, glass on the inner faces, blank ribbed concrete on the outer faces, a low white saucer-shaped council chamber between them, on a low podium.
4. SAVE AS `old-city-hall.png`. Reference: `ref-4-old-city-hall.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Old City Hall, Toronto. Romanesque Revival sandstone civic building with a tall off-centre clock tower, steep green copper roofs, arched windows.
5. SAVE AS `union-station.png`. Reference: `ref-5-union-station.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Union Station, Toronto. Long low Beaux-Arts limestone railway station with a colonnade of Doric columns along the front and a slightly taller central hall.
6. SAVE AS `first-canadian-place.png`. Reference: `ref-6-first-canadian-place.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: First Canadian Place, Toronto. Very tall slim square office tower clad in white, strong vertical window stripes, flat roof with a small mechanical box and antenna.
7. SAVE AS `td-centre.png`. Reference: `ref-7-td-centre.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Toronto-Dominion Centre. A cluster of three austere black steel-and-glass Miesian slab towers of different heights plus a low black banking pavilion.
8. SAVE AS `scotia-plaza.png`. Reference: `ref-8-scotia-plaza.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: Scotia Plaza, Toronto. Tall office tower clad in red granite with a stepped, notched top.
```

## 第 2 批：地标：市中心与大学区

上传：`style-anchor.png` + `batch-02/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `royal-bank-plaza.png`. Reference: `ref-1-royal-bank-plaza.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Royal Bank Plaza, Toronto. Two triangular towers of different heights with faceted gold-tinted mirrored glass, serrated edges.
2. SAVE AS `scotiabank-arena.png`. Reference: `ref-2-scotiabank-arena.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Scotiabank Arena, Toronto. Wide low sports arena: stone Art Deco base (old postal building) with a modern stepped grey metal roof on top.
3. SAVE AS `roy-thomson-hall.png`. Reference: `ref-3-roy-thomson-hall.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Roy Thomson Hall, Toronto. Round concert hall shaped like an upside-down cupcake: sloping conical curtain of blue-grey diamond-pattern glass, flat round roof.
4. SAVE AS `eaton-centre.png`. Reference: `ref-4-eaton-centre.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Toronto Eaton Centre. Long shopping galleria with an arched glass barrel-vault roof running its whole length, plus a mid-rise glass office block attached at one end.
5. SAVE AS `ontario-legislature.png`. Reference: `ref-5-ontario-legislature.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Ontario Legislative Building (Queen's Park). Wide pink-brown sandstone Romanesque building, big central block with a steep slate hip roof, two small domed copper-topped towers on the wings, rows of arched windows.
6. SAVE AS `university-college.png`. Reference: `ref-6-university-college.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: University College, University of Toronto. Long Norman-Romanesque stone college building with a square central tower with pointed roof, and a round chapter house with conical roof at one end.
7. SAVE AS `rom.png`. Reference: `ref-7-rom.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Royal Ontario Museum, Toronto. Heritage buff-brick museum wing with a slate roof, with the Michael Lee-Chin Crystal bursting out of it: jagged interlocking prisms of pale aluminium and glass.
8. SAVE AS `casa-loma.png`. Reference: `ref-8-casa-loma.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Casa Loma, Toronto. Gothic Revival castle of grey stone: main hall with red tile roofs, one tall round tower with a red conical roof, one shorter battlemented round tower, chimneys.
```

## 第 3 批：地标：老城与东区

上传：`style-anchor.png` + `batch-03/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `ago.png`. Reference: `ref-1-ago.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Art Gallery of Ontario. Long stone gallery building with a huge curved glass-and-timber facade bulging along the front (Gehry), and a big titanium-blue box rising at the back.
2. SAVE AS `ocad.png`. Reference: `ref-2-ocad.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: OCAD University Sharp Centre, Toronto. A white box with black pixel-like square windows floating high in the air on tall, thin, tilted, brightly coloured pencil-like legs (red, yellow, blue, green, purple, orange), above an ordinary brick building.
3. SAVE AS `st-lawrence-market.png`. Reference: `ref-3-st-lawrence-market.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: St. Lawrence Market, Toronto. Long red-brick Victorian market hall with a big pitched roof and a tall arched brick entrance front.
4. SAVE AS `gooderham.png`. Reference: `ref-4-gooderham.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Gooderham (Flatiron) Building, Toronto. Small five-storey red-brick wedge-shaped flatiron building with a rounded prow topped by a green copper cone roof.
5. SAVE AS `distillery.png`. Reference: `ref-5-distillery.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Distillery District, Toronto. Group of dark red-brick Victorian industrial buildings with gabled slate roofs, a small white cupola with copper cap, and a tall slim brick chimney.
6. SAVE AS `viaduct.png`. Reference: `ref-6-viaduct.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Prince Edward Viaduct (Bloor Viaduct), Toronto. Long bridge deck on tall stone piers with dark steel arches between the piers.
7. SAVE AS `brick-works.png`. Reference: `ref-7-brick-works.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Evergreen Brick Works, Toronto. Two long low red-brick kiln sheds with pitched roofs and one tall brick chimney.
8. SAVE AS `rc-harris.png`. Reference: `ref-8-rc-harris.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: R.C. Harris Water Treatment Plant, Toronto. Art Deco "palace of purification": long cream-buff brick and limestone buildings with a taller central block and green copper roofs.
```

## 第 4 批：地标：港口、展览广场与西区

上传：`style-anchor.png` + `batch-04/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `hearn.png`. Reference: `ref-1-hearn.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Hearn Generating Station, Toronto. Huge long red-brick power station block with tall grid windows and one extremely tall slim concrete smokestack with red and white bands at the top.
2. SAVE AS `redpath.png`. Reference: `ref-2-redpath.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Redpath Sugar refinery, Toronto waterfront. White industrial refinery block with a red rooftop box, three concrete silos beside it, and a dark bulk cargo ship moored alongside.
3. SAVE AS `princes-gates.png`. Reference: `ref-3-princes-gates.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Princes' Gates, Exhibition Place, Toronto. White neoclassical triumphal arch topped by a winged victory statue, with curved colonnades of columns sweeping out on both sides.
4. SAVE AS `bmo-field.png`. Reference: `ref-4-bmo-field.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: BMO Field, Toronto. Open-air soccer stadium: green pitch with white markings surrounded by stands on four sides, one stand with red seats.
5. SAVE AS `ferris-wheel.png`. Reference: `ref-5-ferris-wheel.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: CNE midway Ferris wheel. Classic fairground Ferris wheel with a red rim, thin spokes, small colourful gondolas, white A-frame supports.
6. SAVE AS `ontario-place.png`. Reference: `ref-6-ontario-place.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Ontario Place Cinesphere and pods. White geodesic sphere (triangulated dome) held on thin struts, with three white square pavilion pods raised on stilts beside it.
7. SAVE AS `sunnyside.png`. Reference: `ref-7-sunnyside.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Sunnyside Bathing Pavilion, Toronto. Long low cream-coloured Beaux-Arts beach pavilion with an arcade of arches, terracotta tile roof and a taller central entrance.
8. SAVE AS `humber-bridge.png`. Reference: `ref-8-humber-bridge.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Humber Bay Arch Bridge, Toronto. White pedestrian bridge with two tall steel arches leaning toward each other and thin hanger cables down to a flat deck.
```

## 第 5 批：群岛地标、船、树、住宅

上传：`style-anchor.png` + `batch-05/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `island-airport.png`. Reference: `ref-1-island-airport.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Billy Bishop island airport. Small low glass terminal building, a short control tower with a dark glass cab, and a small white propeller plane with red tail parked beside it.
2. SAVE AS `lighthouse.png`. Reference: `ref-2-lighthouse.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: Gibraltar Point Lighthouse, Toronto Islands. Old stubby hexagonal stone lighthouse, slightly tapering, with a red lantern room on top.
3. SAVE AS `ferry.png`. Reference: `ref-3-ferry.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Toronto Island ferry. Small white double-ended passenger ferry with a row of windows, a red upper deck and one black funnel (on water: draw only the boat).
4. SAVE AS `sailboat.png`. Reference: `ref-4-sailboat.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: small sailboat. Tiny white sailboat with a white mainsail and a pale salmon jib (draw only the boat).
5. SAVE AS `trees.png`. Reference: `ref-5-trees.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   NOT a turnaround: four different trees, one per cell: a round green maple, a dark green pointed spruce, an orange autumn maple, a light green birch. Simple, chunky, same scale. Rules 2 and 3 do not apply to this item; all other rules do (trees ARE the subject here).
6. SAVE AS `house-a.png`. Reference: `ref-6-house-a.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: Toronto bay-and-gable house. Narrow tall Victorian red-brick house with a steep front gable, bay window and a chimney.
7. SAVE AS `house-b.png`. Reference: `ref-7-house-b.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: pair of semi-detached houses. Two attached narrow brick houses with twin gables, different trim colours, chimneys.
8. SAVE AS `house-c.png`. Reference: `ref-8-house-c.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: small two-storey brick house. Modest two-storey brick house with a gable roof and a front porch.
```

## 第 6 批：普通建筑：小屋、店面、砖楼

上传：`style-anchor.png` + `batch-06/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `bungalow.png`. Reference: `ref-1-bungalow.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: post-war bungalow. Small one-storey suburban bungalow with a low gable roof and pale siding.
2. SAVE AS `cottage-s.png`. Reference: `ref-2-cottage-s.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: island cottage. Tiny pastel wooden cottage with a hipped shingle roof and a little porch.
3. SAVE AS `cottage-m.png`. Reference: `ref-3-cottage-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: island cottage, second design. Small wooden cottage in a different pastel colour with a hipped roof and a screened porch.
4. SAVE AS `shop-m.png`. Reference: `ref-4-shop-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: row of three market shopfronts (Kensington style). Three narrow attached three-storey buildings in different bright colours with striped awnings and shop windows at street level (no readable signs).
5. SAVE AS `shop-l.png`. Reference: `ref-5-shop-l.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: row of three taller shopfronts. Three narrow attached five-storey painted brick buildings in different colours with awnings at street level.
6. SAVE AS `brick-s.png`. Reference: `ref-6-brick-s.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: three-storey brick walk-up. Plain three-storey red-brick apartment block with a stone cornice and a wooden water tank on the roof.
7. SAVE AS `brick-m.png`. Reference: `ref-7-brick-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: five-storey brick block. Five-storey brown-brick commercial block with a stone cornice and regular windows.
8. SAVE AS `brick-l.png`. Reference: `ref-8-brick-l.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: eight-storey brick block. Eight-storey red-brick early-1900s office building with a stone cornice and a rooftop water tank.
```

## 第 7 批：普通建筑：学院、仓库、筒仓、展馆

上传：`style-anchor.png` + `batch-07/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `gothic-m.png`. Reference: `ref-1-gothic-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: collegiate gothic hall. Grey stone collegiate-gothic building with a gabled slate roof and a square corner tower with a green copper spire.
2. SAVE AS `loft-m.png`. Reference: `ref-2-loft-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: brick warehouse loft. Five-storey wide red-brick warehouse loft with large grid windows and a small rooftop box.
3. SAVE AS `loft-l.png`. Reference: `ref-3-loft-l.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: tall brick warehouse loft. Seven-storey wide red-brick factory loft with large grid windows and a tall brick chimney at one corner.
4. SAVE AS `shed-s.png`. Reference: `ref-4-shed-s.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: dockside shed. Long low corrugated-metal industrial shed with a shallow gable roof.
5. SAVE AS `shed-m.png`. Reference: `ref-5-shed-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: dockside shed with containers. Long low industrial shed with a shallow gable roof and a few stacked coloured shipping containers beside it.
6. SAVE AS `silo.png`. Reference: `ref-6-silo.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: grain silos. Three tall concrete grain silos side by side with small conical caps and a conveyor gallery across the top.
7. SAVE AS `pavilion-m.png`. Reference: `ref-7-pavilion-m.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: exhibition pavilion. Four-storey stone exhibition pavilion with a green copper pyramid roof and a flagpole.
8. SAVE AS `pavilion-l.png`. Reference: `ref-8-pavilion-l.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: large exhibition pavilion. Five-storey buff stone exhibition hall with a green copper pyramid roof and a flagpole.
```

## 第 8 批：普通建筑：公寓与写字楼

上传：`style-anchor.png` + `batch-08/` 里的 8 张参考图。然后粘贴：

```text
I am making hand-drawn sprites for an illustrated isometric map of Toronto. Attached are:
- style-anchor.png: the finished art style. Match its line, paint texture and palette exactly.
- 8 reference sheets (ref-1-... to ref-8-...): crude grey-box models, each showing one building from four sides. Use them only for geometry, layout and viewpoint.

For each reference sheet, draw one finished image of that building.

STYLE (edit this block if you want a different look, then keep it identical in every batch):
- Hand-drawn illustration for an illustrated tourist map / picture book. Slightly wobbly dark-ink outlines of uneven thickness, drawn by hand, not vector-clean.
- Colour laid in loose gouache / watercolour washes that do not perfectly fill the outlines; visible paper grain; a little dry-brush texture.
- Warm, slightly muted palette with a few saturated accents. Early-evening mood: about half of the windows glow warm yellow.
- Charming and a bit toy-like: simplify details, exaggerate the features that make the building recognisable.
- No photorealism, no 3D-render look, no gradients-only "vector flat" look, no pixel art.

HARD RULES for every image:
1. One image per reference sheet. Use the SAME canvas size and the SAME cell layout as that reference sheet.
2. Each of the four cells shows the SAME building, turned 90° between cells, in the SAME order and facing the SAME way as the reference sheet. The four views must agree with each other: same parts, same colours, same number of floors, same roof.
3. Isometric view, orthographic (no perspective, parallel lines stay parallel), camera looking down at about 35°, one corner of the building pointing toward the viewer, exactly as in the reference.
4. Keep the proportions of the reference: footprint, height, and where the towers / domes / chimneys sit. The reference sheets are crude grey-box models: copy their GEOMETRY and VIEWPOINT only, never their flat colours or their look.
5. Same scale in all four cells. The building is centred in its cell, fills about 80% of it, and nothing touches or crosses a cell edge.
6. Light comes from the upper left of the picture in every cell.
7. Background: fully transparent. If you cannot make it transparent, use one flat solid colour #FF00FF and nothing else.
8. Draw ONLY the building. No ground, no base plate, no grass, no cast shadow on the ground, no sky, no people, no cars, no trees (unless the item says so).
9. No text of any kind: no labels, no captions, no numbers, no logos, no readable signs. No frame, no border, no divider lines between cells.

HOW TO WORK:
- Generate the images ONE AT A TIME, in the order listed. Do not combine several items into one image.
- After each image, write one line: the file name it should be saved as, and "ok".
- If a generation fails, is cut off, or comes out breaking a hard rule (wrong layout, views that disagree, a background that is not empty, text in the image), try that same item again, up to 3 attempts, before moving on.
- If you hit a rate limit or cannot continue, say exactly which item you stopped at. When I write "continue", carry on from that item with all the same rules.
- When the batch is finished, give me a table: item, file name, done / failed.

ITEMS IN THIS BATCH:
1. SAVE AS `condo-l.png`. Reference: `ref-1-condo-l.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: mid-rise condo. Nine-storey modern condo tower with balconies rising from a wider two-storey stone podium.
2. SAVE AS `condo-xl-a.png`. Reference: `ref-2-condo-xl-a.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: tall condo tower. Slim fourteen-storey glass-and-concrete condo tower with balconies on a wider two-storey podium.
3. SAVE AS `condo-xl-b.png`. Reference: `ref-3-condo-xl-b.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: tall condo tower, second design. Slim fourteen-storey pale condo tower with balconies on a wider podium, different colour and roof detail.
4. SAVE AS `glass-xl-a.png`. Reference: `ref-4-glass-xl-a.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: glass office tower. Fourteen-storey blue glass curtain-wall office tower with a smaller setback top and antenna.
5. SAVE AS `glass-xl-b.png`. Reference: `ref-5-glass-xl-b.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: glass office tower with pyramid top. Fourteen-storey teal glass office tower with a low pyramid roof.
6. SAVE AS `bank-l.png`. Reference: `ref-6-bank-l.png`. Canvas 1024×1024, a 2×2 grid (top-left: view 1, top-right: view 2, bottom-left: view 3, bottom-right: view 4).
   Subject: bank office block. Nine-storey broad dark-blue glass bank tower with a mechanical box on the roof.
7. SAVE AS `bank-xl-a.png`. Reference: `ref-7-bank-xl-a.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: bank tower. Fifteen-storey broad blue glass bank tower with a setback crown and antenna.
8. SAVE AS `bank-xl-b.png`. Reference: `ref-8-bank-xl-b.png`. Canvas 1536×1024, four cells side by side in ONE ROW (left to right: view 1, 2, 3, 4).
   Subject: bank tower with pyramid top. Fifteen-storey broad blue-green glass bank tower with a low pyramid roof.
```
