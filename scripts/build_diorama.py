# Layout + stats for the 2.5D diorama (site/data/diorama.json).
# Board: N x N tiles seen isometrically. Mainland where i+j <= S, lake beyond, one island for "Other".
# Districts are wedges radiating from the tower; inside a wedge the most-reviewed games sit closest to the tower.
import sys, json, math, pandas as pd, numpy as np
df = pd.read_parquet(sys.argv[1], columns=['appID','name','release_date','positive','negative','header_image','price','genres'])
df['d']=pd.to_datetime(df.release_date)
df=df.sort_values(['d','appID'],kind='stable').reset_index(drop=True)      # same order as cols.bin
df['rev']=df.positive+df.negative; df['year']=df.d.dt.year
cut=np.sort(df.rev.to_numpy())[::-1][len(df)//100-1]
ORDER=['Racing','Sports','RPG','Strategy','Simulation','Adventure','Action','Casual']
def prim(l):
    s=set(l)
    for g in ORDER:
        if g in s: return g
    return 'Other'
df['g']=df.genres.apply(prim)
N,S,TI,TJ=38,50,24,24
WEDGES=['Sports','Casual','Adventure','RPG','Action','Strategy','Simulation','Racing']   # left -> right around the tower
land=lambda i,j: i+j<=S
road=lambda i,j: i%4==0 or j%4==0
plaza=lambda i,j: max(abs(i-TI),abs(j-TJ))<=1
STAD=(19,26)   # 3x3 stadium footprint, top-left tile
stad=lambda i,j: STAD[0]<=i<STAD[0]+3 and STAD[1]<=j<STAD[1]+3
island=lambda i,j: 56<=i+j<=68 and abs(i-j)<=6 and i<N and j<N
ground=[[-2]*N for _ in range(N)]   # -2 water, -1 road/plaza, 0..8 district
lots=[]
for i in range(N):
    for j in range(N):
        if land(i,j):
            ground[i][j]=-1
            if not road(i,j) and not plaza(i,j) and not stad(i,j): lots.append((i,j))
def ang(t):
    i,j=t; dx=(i-j)-(TI-TJ); dy=(TI+TJ)-(i+j)          # dy>0 = behind the tower
    return math.atan2(max(dy,-0.5*abs(dx)),dx)
lots.sort(key=lambda t:-ang(t))                         # sweep from the left, over the back, to the right
counts={g:int((df.g==g).sum()) for g in WEDGES+['Other']}
tot=sum(counts[g] for g in WEDGES); L=len(lots)
alloc=[max(6,round(L*counts[g]/tot)) for g in WEDGES]; alloc[int(np.argmax(alloc))]+=L-sum(alloc)
names=WEDGES+['Other']; dl={}; p=0
for g,a in zip(WEDGES,alloc): dl[g]=lots[p:p+a]; p+=a
dl['Other']=[(i,j) for i in range(N) for j in range(N) if island(i,j)]
def card(t): return dict(name=t['name'],img=t.header_image.split('?')[0],appid=int(t.appID),rev=int(t.rev),pos=int(round(100*t.positive/t.rev)) if t.rev else 0,price=float(t.price),year=int(t.year))
districts=[]; buildings=[]
for di,g in enumerate(names):
    tiles=dl[g]
    for (i,j) in tiles: ground[i][j]=di
    ci=sum(t[0] for t in tiles)/len(tiles); cj=sum(t[1] for t in tiles)/len(tiles)
    centre=(TI,TJ) if g!='Other' else (ci,cj)
    # billboard takes the lot nearest the district's middle
    bb=min(tiles,key=lambda t:(t[0]-ci)**2+(t[1]-cj)**2); tiles=[t for t in tiles if t!=bb]
    tiles.sort(key=lambda t:((t[0]-centre[0])**2+(t[1]-centre[1])**2, t))
    x=df[df.g==g]; x=x.iloc[np.argsort(-x.rev.to_numpy(),kind='stable')]   # by reviews desc, ties by cols.bin order
    n=len(x); Lg=len(tiles); rev=x.rev.to_numpy()
    b=[max(k,round(n*(k/Lg)**3)) for k in range(Lg+1)]; b[-1]=n
    for k in range(1,Lg+1): b[k]=max(b[k],b[k-1]+1)
    assert b[-1]==n
    for k,(i,j) in enumerate(tiles):
        r=rev[b[k]:b[k+1]]
        buildings.append(dict(i=i,j=j,d=di,start=int(b[k]),n=int(len(r)),maxRev=int(r[0]),minRev=int(r[-1]),lit=round(float((r>=10).mean()),3),gold=int((r>=cut).sum()),top=x.name.iloc[b[k]]))
    districts.append(dict(key=g,count=n,lit=int((x.rev>=10).sum()),gold=int((x.rev>=cut).sum()),ci=round(ci,2),cj=round(cj,2),board=list(bb),lots=Lg,
        pool=[card(t) for _,t in x.head(60).iterrows()]))
    print(g,n,'lots',Lg,'largest house',buildings[-1]['n'],'solo towers',sum(1 for q in buildings if q['d']==di and q['n']==1))
json.dump(dict(N=N,S=S,tower=[TI,TJ],stadium=list(STAD),ground=ground,districts=districts,buildings=buildings,total=len(df)),open(sys.argv[2],'w'),ensure_ascii=False,separators=(',',':'))
import os; print(len(buildings),'buildings',os.path.getsize(sys.argv[2])//1024,'KB')
