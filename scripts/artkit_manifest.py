# The list of art components for the hand-drawn sprite kit: what each is, which batch it belongs to.
import json, sys
L = lambda id, model, name, desc: dict(id=id, kind='landmark', model=model, name=name, desc=desc)
G = lambda id, fam, fl, v, name, desc: dict(id=id, kind='generic', family=fam, floors=fl, variant=v, name=name, desc=desc)
items = [
 # ---- batch 1
 L('cn-tower','cnTower','CN Tower, Toronto','very tall slender concrete tower: three-legged tapering shaft, a round doughnut-shaped main pod two-thirds up (white ring, dark glass band, radome below), a smaller upper pod, long antenna mast with a red aircraft light on top'),
 L('rogers-centre','rogers','Rogers Centre (SkyDome), Toronto','big round stadium with a white segmented retractable dome roof, low concrete drum with dark glazing around the base'),
 L('city-hall','cityHall','Toronto City Hall (new)','two curved concrete towers of different heights facing each other like cupped hands, glass on the inner faces, blank ribbed concrete on the outer faces, a low white saucer-shaped council chamber between them, on a low podium'),
 L('old-city-hall','oldCityHall','Old City Hall, Toronto','Romanesque Revival sandstone civic building with a tall off-centre clock tower, steep green copper roofs, arched windows'),
 L('union-station','union','Union Station, Toronto','long low Beaux-Arts limestone railway station with a colonnade of Doric columns along the front and a slightly taller central hall'),
 L('first-canadian-place','fcp','First Canadian Place, Toronto','very tall slim square office tower clad in white, strong vertical window stripes, flat roof with a small mechanical box and antenna'),
 L('td-centre','td','Toronto-Dominion Centre','a cluster of three austere black steel-and-glass Miesian slab towers of different heights plus a low black banking pavilion'),
 L('scotia-plaza','scotia','Scotia Plaza, Toronto','tall office tower clad in red granite with a stepped, notched top'),
 # ---- batch 2
 L('royal-bank-plaza','royal','Royal Bank Plaza, Toronto','two triangular towers of different heights with faceted gold-tinted mirrored glass, serrated edges'),
 L('scotiabank-arena','arena','Scotiabank Arena, Toronto','wide low sports arena: stone Art Deco base (old postal building) with a modern stepped grey metal roof on top'),
 L('roy-thomson-hall','thomson','Roy Thomson Hall, Toronto','round concert hall shaped like an upside-down cupcake: sloping conical curtain of blue-grey diamond-pattern glass, flat round roof'),
 L('eaton-centre','eaton','Toronto Eaton Centre','long shopping galleria with an arched glass barrel-vault roof running its whole length, plus a mid-rise glass office block attached at one end'),
 L('ontario-legislature','legislature','Ontario Legislative Building (Queen\'s Park)','wide pink-brown sandstone Romanesque building, big central block with a steep slate hip roof, two small domed copper-topped towers on the wings, rows of arched windows'),
 L('university-college','uc','University College, University of Toronto','long Norman-Romanesque stone college building with a square central tower with pointed roof, and a round chapter house with conical roof at one end'),
 L('rom','rom','Royal Ontario Museum, Toronto','heritage buff-brick museum wing with a slate roof, with the Michael Lee-Chin Crystal bursting out of it: jagged interlocking prisms of pale aluminium and glass'),
 L('casa-loma','casaLoma','Casa Loma, Toronto','Gothic Revival castle of grey stone: main hall with red tile roofs, one tall round tower with a red conical roof, one shorter battlemented round tower, chimneys'),
 # ---- batch 3
 L('ago','ago','Art Gallery of Ontario','long stone gallery building with a huge curved glass-and-timber facade bulging along the front (Gehry), and a big titanium-blue box rising at the back'),
 L('ocad','ocad','OCAD University Sharp Centre, Toronto','a white box with black pixel-like square windows floating high in the air on tall, thin, tilted, brightly coloured pencil-like legs (red, yellow, blue, green, purple, orange), above an ordinary brick building'),
 L('st-lawrence-market','stLawrence','St. Lawrence Market, Toronto','long red-brick Victorian market hall with a big pitched roof and a tall arched brick entrance front'),
 L('gooderham','flatiron','Gooderham (Flatiron) Building, Toronto','small five-storey red-brick wedge-shaped flatiron building with a rounded prow topped by a green copper cone roof'),
 L('distillery','distillery','Distillery District, Toronto','group of dark red-brick Victorian industrial buildings with gabled slate roofs, a small white cupola with copper cap, and a tall slim brick chimney'),
 L('viaduct','viaduct','Prince Edward Viaduct (Bloor Viaduct), Toronto','long bridge deck on tall stone piers with dark steel arches between the piers'),
 L('brick-works','brickworks','Evergreen Brick Works, Toronto','two long low red-brick kiln sheds with pitched roofs and one tall brick chimney'),
 L('rc-harris','rcHarris','R.C. Harris Water Treatment Plant, Toronto','Art Deco "palace of purification": long cream-buff brick and limestone buildings with a taller central block and green copper roofs'),
 # ---- batch 4
 L('hearn','hearn','Hearn Generating Station, Toronto','huge long red-brick power station block with tall grid windows and one extremely tall slim concrete smokestack with red and white bands at the top'),
 L('redpath','redpath','Redpath Sugar refinery, Toronto waterfront','white industrial refinery block with a red rooftop box, three concrete silos beside it, and a dark bulk cargo ship moored alongside'),
 L('princes-gates','gates',"Princes' Gates, Exhibition Place, Toronto",'white neoclassical triumphal arch topped by a winged victory statue, with curved colonnades of columns sweeping out on both sides'),
 L('bmo-field','bmo','BMO Field, Toronto','open-air soccer stadium: green pitch with white markings surrounded by stands on four sides, one stand with red seats'),
 L('ferris-wheel','ferris','CNE midway Ferris wheel','classic fairground Ferris wheel with a red rim, thin spokes, small colourful gondolas, white A-frame supports'),
 L('ontario-place','cinesphere','Ontario Place Cinesphere and pods','white geodesic sphere (triangulated dome) held on thin struts, with three white square pavilion pods raised on stilts beside it'),
 L('sunnyside','sunnyside','Sunnyside Bathing Pavilion, Toronto','long low cream-coloured Beaux-Arts beach pavilion with an arcade of arches, terracotta tile roof and a taller central entrance'),
 L('humber-bridge','humberBridge','Humber Bay Arch Bridge, Toronto','white pedestrian bridge with two tall steel arches leaning toward each other and thin hanger cables down to a flat deck'),
 # ---- batch 5
 L('island-airport','airport','Billy Bishop island airport','small low glass terminal building, a short control tower with a dark glass cab, and a small white propeller plane with red tail parked beside it'),
 L('lighthouse','lighthouse','Gibraltar Point Lighthouse, Toronto Islands','old stubby hexagonal stone lighthouse, slightly tapering, with a red lantern room on top'),
 L('ferry','ferry','Toronto Island ferry','small white double-ended passenger ferry with a row of windows, a red upper deck and one black funnel (on water: draw only the boat)'),
 L('sailboat','sail','small sailboat','tiny white sailboat with a white mainsail and a pale salmon jib (draw only the boat)'),
 dict(id='trees', kind='trees', name='four trees', desc='NOT a turnaround: four different trees, one per cell: a round green maple, a dark green pointed spruce, an orange autumn maple, a light green birch. Simple, chunky, same scale'),
 G('house-a','house',3,0,'Toronto bay-and-gable house','narrow tall Victorian red-brick house with a steep front gable, bay window and a chimney'),
 G('house-b','house',3,1,'pair of semi-detached houses','two attached narrow brick houses with twin gables, different trim colours, chimneys'),
 G('house-c','house',2,2,'small two-storey brick house','modest two-storey brick house with a gable roof and a front porch'),
 # ---- batch 6
 G('bungalow','bungalow',1,0,'post-war bungalow','small one-storey suburban bungalow with a low gable roof and pale siding'),
 G('cottage-s','cottage',1,0,'island cottage','tiny pastel wooden cottage with a hipped shingle roof and a little porch'),
 G('cottage-m','cottage',1,2,'island cottage, second design','small wooden cottage in a different pastel colour with a hipped roof and a screened porch'),
 G('shop-m','shop',3,0,'row of three market shopfronts (Kensington style)','three narrow attached three-storey buildings in different bright colours with striped awnings and shop windows at street level (no readable signs)'),
 G('shop-l','shop',5,1,'row of three taller shopfronts','three narrow attached five-storey painted brick buildings in different colours with awnings at street level'),
 G('brick-s','brick',3,1,'three-storey brick walk-up','plain three-storey red-brick apartment block with a stone cornice and a wooden water tank on the roof'),
 G('brick-m','brick',5,0,'five-storey brick block','five-storey brown-brick commercial block with a stone cornice and regular windows'),
 G('brick-l','brick',8,1,'eight-storey brick block','eight-storey red-brick early-1900s office building with a stone cornice and a rooftop water tank'),
 # ---- batch 7
 G('gothic-m','gothic',5,0,'collegiate gothic hall','grey stone collegiate-gothic building with a gabled slate roof and a square corner tower with a green copper spire'),
 G('loft-m','loft',5,0,'brick warehouse loft','five-storey wide red-brick warehouse loft with large grid windows and a small rooftop box'),
 G('loft-l','loft',7,1,'tall brick warehouse loft','seven-storey wide red-brick factory loft with large grid windows and a tall brick chimney at one corner'),
 G('shed-s','shed',2,0,'dockside shed','long low corrugated-metal industrial shed with a shallow gable roof'),
 G('shed-m','shed',2,1,'dockside shed with containers','long low industrial shed with a shallow gable roof and a few stacked coloured shipping containers beside it'),
 G('silo','silo',8,0,'grain silos','three tall concrete grain silos side by side with small conical caps and a conveyor gallery across the top'),
 G('pavilion-m','pavilion',4,0,'exhibition pavilion','four-storey stone exhibition pavilion with a green copper pyramid roof and a flagpole'),
 G('pavilion-l','pavilion',5,1,'large exhibition pavilion','five-storey buff stone exhibition hall with a green copper pyramid roof and a flagpole'),
 # ---- batch 8
 G('condo-l','condo',9,0,'mid-rise condo','nine-storey modern condo tower with balconies rising from a wider two-storey stone podium'),
 G('condo-xl-a','condo',14,1,'tall condo tower','slim fourteen-storey glass-and-concrete condo tower with balconies on a wider two-storey podium'),
 G('condo-xl-b','condo',14,3,'tall condo tower, second design','slim fourteen-storey pale condo tower with balconies on a wider podium, different colour and roof detail'),
 G('glass-xl-a','glass',14,1,'glass office tower','fourteen-storey blue glass curtain-wall office tower with a smaller setback top and antenna'),
 G('glass-xl-b','glass',14,2,'glass office tower with pyramid top','fourteen-storey teal glass office tower with a low pyramid roof'),
 G('bank-l','bank',9,0,'bank office block','nine-storey broad dark-blue glass bank tower with a mechanical box on the roof'),
 G('bank-xl-a','bank',15,1,'bank tower','fifteen-storey broad blue glass bank tower with a setback crown and antenna'),
 G('bank-xl-b','bank',15,2,'bank tower with pyramid top','fifteen-storey broad blue-green glass bank tower with a low pyramid roof'),
]
assert len(items) == 64 and len({i['id'] for i in items}) == 64
for k, it in enumerate(items): it['batch'] = k // 8 + 1; it['n'] = k % 8 + 1
json.dump(items, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
print(len(items), 'items', max(i['batch'] for i in items), 'batches')
