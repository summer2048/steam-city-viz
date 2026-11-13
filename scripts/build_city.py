# Per-year stats for the hand-drawn city (site/data/city.json)
import sys, json, pandas as pd, numpy as np
df = pd.read_parquet(sys.argv[1], columns=['appID','name','release_date','positive','negative','header_image','price'])
df['rev']=df.positive+df.negative; df['y']=pd.to_datetime(df.release_date).dt.year.clip(lower=2005)
cut=np.sort(df.rev.to_numpy())[::-1][len(df)//100-1]
def card(t): return dict(name=t['name'],img=t.header_image.split('?')[0],appid=int(t.appID),rev=int(t.rev),pos=int(round(100*t.positive/max(t.rev,1))),price=float(t.price),year=int(pd.to_datetime(t.release_date).year))
out=[]
for y,g in df.groupby('y'):
    out.append(dict(year=int(y),count=int(len(g)),lit=int((g.rev>=10).sum()),gold=int((g.rev>=cut).sum()),top=card(g.sort_values('rev',ascending=False).iloc[0])))
# 2026 is partial: the data stops at the end of January. Project the full year from the share of each
# recent year's releases that had landed by the same day of the year.
d=pd.to_datetime(df.release_date); CUT=31; last=out[-1]
ytd=int(((d.dt.year==last['year'])&(d.dt.dayofyear<=CUT)).sum())
shares=[float(((d.dt.year==y)&(d.dt.dayofyear<=CUT)).sum()/(d.dt.year==y).sum()) for y in (last['year']-3,last['year']-2,last['year']-1)]
last['proj']=dict(ytd=ytd,cutDay=CUT,est=int(round(ytd/np.mean(shares),-2)),low=int(round(ytd/max(shares),-2)),high=int(round(ytd/min(shares),-2)))
print('projection',last['proj'],shares)
top=[card(t) for _,t in df.sort_values('rev',ascending=False).head(18).iterrows()]
tot=int(df.rev.sum())
json.dump(dict(years=out,total=len(df),lit=int((df.rev>=10).sum()),gold=int((df.rev>=cut).sum()),goldShare=float(df.rev[df.rev>=cut].sum()/tot),topAll=top),open(sys.argv[2],'w'),ensure_ascii=False)
print(len(out), [t['name'] for t in top])
