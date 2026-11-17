# v2.32 바코드 각성(마감 정산) 비교: 방식 0(지금)·1(쓰러지면 터짐)·2(쌓이면 터짐) × 괴수 약함/질김
import asyncio, json, math
from playwright.async_api import async_playwright
URL="http://localhost:8765/dist.html?sfield&seed=7&fixed=6#bot"
SETUP="""(cfg)=>{ const d=__dbg,S=d.S; d.SV.tune=Object.assign({},d.SV.tune||{},{bcv:cfg.v,ehp:cfg.ehp}); S.W={barcode:5}; S.evo=cfg.evo?{barcode:true}:{}; S.evo2={}; S.fu={}; S.br={}; S.P={}; S.hp=S.maxhp=1e7; S.need=1e12; S.pendingLv=0;
 for(let i=0;i<40;i++) d.spawn('shade',2.5+Math.random()*5); d.DBG.dealt=0; d.DBG.bcN=0; d.T0=S.t; d.K0=S.kills; return 1 }"""
KEEP="""(cfg)=>{ const d=__dbg,S=d.S; S.hp=S.maxhp=1e7; S.need=1e12; S.pendingLv=0; const lv=document.getElementById('lvup'); if(lv&&lv.classList.contains('show')){ lv.classList.remove('show'); S.phase='play'; }
 if(d.enemies.filter(e=>!e.dead).length<30) for(let i=0;i<10;i++) d.spawn('shade',2.5+Math.random()*5); return {t:S.t-d.T0,dealt:d.DBG.dealt,bc:d.DBG.bcN||0,k:S.kills-d.K0} }"""
async def run(pg,cfg,secs=10):
    await pg.goto(URL); await pg.wait_for_timeout(2200); await pg.evaluate(SETUP,cfg); r=None
    for i in range(80):
        await pg.wait_for_timeout(300); r=await pg.evaluate(KEEP,cfg)
        if r['t']>=secs: break
    return {"dps":round(r['dealt']/max(.1,r['t'])),"정산/분":round(r['bc']/max(.1,r['t'])*60),"처치/분":round(r['k']/max(.1,r['t'])*60)}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]
        pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
        import sys
        EHP=float(sys.argv[1]) if len(sys.argv)>1 else 1; N=int(sys.argv[2]) if len(sys.argv)>2 else 3
        async def avg(cfg):
            R=[await run(pg,cfg) for _ in range(N)]
            return {k:round(sum(r[k] for r in R)/N) for k in R[0]}, [r['dps'] for r in R]
        base,bl=await avg({"v":0,"ehp":EHP,"evo":False}); print(json.dumps({"괴수체력":EHP,"방식":"각성 없음",**base,"각 판":bl},ensure_ascii=False),flush=True)
        for v in (0,1,2):
            r,l=await avg({"v":v,"ehp":EHP,"evo":True}); r["각성 더%"]=round((r['dps']-base['dps'])/max(1,base['dps'])*100)
            print(json.dumps({"괴수체력":EHP,"방식":["지금","쓰러지면 터짐","쌓이면 터짐"][v],**r,"각 판":l},ensure_ascii=False),flush=True)
        print("ERR",errs[:5]); await b.close()
asyncio.run(main())
