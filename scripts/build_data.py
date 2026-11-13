# Builds site/data: cols.bin + meta.json + names.json + lod0/1/2 atlases.
import sys, os, io, json, numpy as np, pandas as pd, requests, concurrent.futures as cf
from PIL import Image
pq, work, out = sys.argv[1:4]
cols=['appID','name','release_date','price','positive','negative','genres','header_image','estimated_owners']
df = pd.read_parquet(pq, columns=cols)
df['d']=pd.to_datetime(df.release_date)
df=df.sort_values(['d','appID'],kind='stable').reset_index(drop=True)   # same order as fetch_thumbs
N=len(df)
thumbs=np.load(os.path.join(work,'thumbs.npy'),mmap_mode='r'); ok=np.load(os.path.join(work,'ok.npy'))==1
rev=(df.positive+df.negative).to_numpy().astype(np.int64)
year=df.d.dt.year.to_numpy()
yearf=(year+(df.d.dt.dayofyear.to_numpy()-1)/366.0).astype(np.float32)

# --- colour stats
rgb=np.zeros((N,3),np.uint8); lod0=np.zeros((N,4,8,3),np.uint8)
B=4096
for s in range(0,N,B):
    t=np.asarray(thumbs[s:s+B]).astype(np.float32)
    rgb[s:s+B]=t.mean((1,2)).round()
    c=t[:,1:29].reshape(-1,4,7,8,8,3).mean((2,4))
    lod0[s:s+B]=c.round()
PLACE=np.array([26,26,30],np.uint8)
rgb[~ok]=PLACE; lod0[~ok]=PLACE
lum=(0.2126*rgb[:,0]+0.7152*rgb[:,1]+0.0722*rgb[:,2]).round().astype(np.uint8)

# --- genre (rarest-first primary)
ORDER=['Racing','Sports','RPG','Strategy','Simulation','Adventure','Action','Casual']
DISPLAY=['Action','Adventure','RPG','Strategy','Simulation','Casual','Sports','Racing']
def prim(l):
    s=set(l)
    for g in ORDER:
        if g in s: return DISPLAY.index(g)
    return 8
genre=df.genres.apply(prim).to_numpy().astype(np.uint8)

# --- tiers
order=np.argsort(-rev,kind='stable')
ntop=N//100
tier=np.where(rev<10,0,1).astype(np.uint8); tier[order[:ntop]]=2

# --- LOD selection
BIG=16; L2=16+17*34      # 594 slots in lod2
sel2=list(order[:BIG])
early=[i for i in np.flatnonzero(year<=2008) if i not in set(sel2)]
rest=[i for i in order[BIG:] if year[i]>2008]
sel2+= early + rest[:L2-BIG-len(early)]
sel2=sel2[:L2]; s2=set(sel2)
L1=64*136
pre=[i for i in np.flatnonzero(year<2014) if i not in s2]
more=[i for i in order if i not in s2 and year[i]>=2014]
sel1=(pre+more)[:L1]
hi=np.zeros(N,np.int16)
for k,i in enumerate(sel1): hi[i]=k+1
for k,i in enumerate(sel2): hi[i]=-(k+1)
hi[~ok]=0

# --- atlases
a0=np.zeros((2048,2048,3),np.uint8); a0[:]=PLACE
pad=np.zeros((512*256,4,8,3),np.uint8); pad[:]=PLACE; pad[:N]=lod0
a0[:]=pad.reshape(512,256,4,8,3).transpose(0,2,1,3,4).reshape(2048,2048,3)
Image.fromarray(a0).save(os.path.join(out,'lod0.webp'),quality=88,method=4)
a1=np.zeros((4096,4096,3),np.uint8); a1[:]=PLACE
for k,i in enumerate(sel1):
    r,c=divmod(k,64); a1[r*30:r*30+30,c*64:c*64+64]=thumbs[i]
Image.fromarray(a1).save(os.path.join(out,'lod1.webp'),quality=82,method=4)
def fetch(i):
    try:
        r=requests.get(df.header_image[i],timeout=30,headers={'User-Agent':'Mozilla/5.0'})
        return Image.open(io.BytesIO(r.content)).convert('RGB')
    except Exception as e: print('fail',i,e); return None
with cf.ThreadPoolExecutor(24) as ex: ims=list(ex.map(fetch,sel2))
a2=Image.new('RGB',(4096,4096),tuple(int(x) for x in PLACE))
for k,(i,im) in enumerate(zip(sel2,ims)):
    if im is None: hi[i]=0; continue
    if k<BIG: r,c=divmod(k,8); a2.paste(im.resize((512,215),Image.LANCZOS),(c*512,r*215))
    else: r,c=divmod(k-BIG,17); a2.paste(im.resize((240,107),Image.LANCZOS),(c*240,430+r*107))
a2.save(os.path.join(out,'lod2.webp'),quality=84,method=4)

# --- columns
pos=np.where(rev>0,np.round(100*df.positive.to_numpy()/np.maximum(rev,1)),255).astype(np.uint8)
price=np.clip(np.round(df.price.to_numpy()*100),0,65535).astype(np.uint16)
C=[('yearf',yearf),('rev',rev.astype(np.uint32)),('appid',df.appID.astype(np.int64).to_numpy().astype(np.uint32)),
   ('price',price),('hi',hi),('pos',pos),('genre',genre),('tier',tier),('lum',lum),('rgb',rgb.reshape(-1))]
buf=bytearray(); meta=[]
for n,a in C:
    while len(buf)%4: buf.append(0)
    meta.append({'name':n,'type':str(a.dtype),'offset':len(buf),'length':int(a.size)}); buf+=a.tobytes()
open(os.path.join(out,'cols.bin'),'wb').write(buf)

srt=np.sort(rev)[::-1]; tot=int(rev.sum())
yc={int(y):int(c) for y,c in zip(*np.unique(year,return_counts=True))}
first=0
stats=dict(total=N,totalReviews=tot,top1Count=int(ntop),top1Share=float(srt[:ntop].sum()/tot),
  under10=int((rev<10).sum()),zeroReviews=int((rev==0).sum()),yearCounts=yc,
  peakYear=max((y for y in yc if y<2026),key=lambda y:yc[y]),lastDate=str(df.d.max().date()),
  first=dict(name=df.name[0],date=str(df.d[0].date())),
  genres=DISPLAY+['Other'],genreCounts=[int((genre==g).sum()) for g in range(9)],
  genreLum=[float(lum[(genre==g)&ok].mean()) for g in range(9)],
  genreRgb=[[int(x) for x in rgb[(genre==g)&ok].mean(0)] for g in range(9)],
  missingImages=int((~ok).sum()),top=[dict(name=df.name[i],rev=int(rev[i])) for i in order[:5]],
  top10Share=float(srt[:10].sum()/tot))
json.dump(dict(n=N,columns=meta,stats=stats,lod0=dict(cols=256,tw=8,th=4,size=2048),lod1=dict(cols=64,tw=64,th=30,size=4096),
  lod2=dict(big=BIG,size=4096)),open(os.path.join(out,'meta.json'),'w'),ensure_ascii=False)
PFX='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/'
hdr={}
for i,(u,a) in enumerate(zip(df.header_image,df.appID)):
    p=u.split('?')[0]
    if p!=f'{PFX}{a}/header.jpg': hdr[i]=p[len(PFX):] if p.startswith(PFX) else p
json.dump(dict(names=df.name.fillna('').tolist(),hdr=hdr),open(os.path.join(out,'names.json'),'w'),ensure_ascii=False,separators=(',',':'))
print(json.dumps(stats,ensure_ascii=False)[:1800]); print('lod1',len(sel1),'lod2',len(sel2))
for f in os.listdir(out): print(f, os.path.getsize(os.path.join(out,f))//1024,'KB')
