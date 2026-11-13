# Downloads every header image, stores 64x30 RGB thumbs in a memmap (work/thumbs.u8) + ok flags.
import sys, os, io, threading, time, numpy as np, pandas as pd, requests, concurrent.futures as cf
from PIL import Image
pq, work = sys.argv[1:3]
df = pd.read_parquet(pq, columns=['appID','header_image','release_date'])
df['d']=pd.to_datetime(df.release_date)
df=df.sort_values(['d','appID'],kind='stable').reset_index(drop=True)
N=len(df); TW,TH=64,30
mm=np.lib.format.open_memmap(os.path.join(work,'thumbs.npy'),mode='r+' if os.path.exists(os.path.join(work,'thumbs.npy')) else 'w+',dtype=np.uint8,shape=(N,TH,TW,3))
okp=os.path.join(work,'ok.npy')
ok=np.load(okp) if os.path.exists(okp) else np.zeros(N,np.uint8)
tl=threading.local()
def sess():
    if not hasattr(tl,'s'): tl.s=requests.Session(); tl.s.headers['User-Agent']='Mozilla/5.0'
    return tl.s
def job(i):
    u=df.header_image[i]
    if not u: return i,2
    for a in range(3):
        try:
            r=sess().get(u,timeout=20)
            if r.status_code==404: return i,2
            if r.status_code!=200: time.sleep(1+a); continue
            im=Image.open(io.BytesIO(r.content)); im.draft('RGB',(TW*2,TH*2)); im=im.convert('RGB').resize((TW,TH),Image.LANCZOS)
            mm[i]=np.asarray(im); return i,1
        except Exception: time.sleep(1+a)
    return i,0
todo=[i for i in range(N) if ok[i]==0]
print('todo',len(todo),flush=True); t=time.time(); n=0
with cf.ThreadPoolExecutor(48) as ex:
    for i,s in ex.map(job,todo):
        ok[i]=s; n+=1
        if n%5000==0: np.save(okp,ok); mm.flush(); print(n,'%.0fs'%(time.time()-t),np.bincount(ok,minlength=3),flush=True)
np.save(okp,ok); mm.flush(); print('done',np.bincount(ok,minlength=3),flush=True)
