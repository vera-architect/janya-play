# 모든 기술 자동 점검: 무기마다 혼자 · 그림자와 함께 · 각성 · 조합을 같은 판(seed)으로 돌려 피해량을 잰다
import asyncio, sys, json
from playwright.async_api import async_playwright
URL="http://localhost:8765/dist.html?sfield&seed=7&fixed=6#bot"
MODE=sys.argv[1] if len(sys.argv)>1 else "w"   # w: 무기·그림자 / e: 각성 / f: 조합
ONLY=sys.argv[2].split(',') if len(sys.argv)>2 else None
SETUP="""(cfg)=>{ const d=__dbg,S=d.S; S.W=cfg.W; S.evo=cfg.evo||{}; S.evo2={}; S.fu=cfg.fu||{}; S.br={}; S.P={}; S.hp=S.maxhp=1e7; S.need=1e12; S.pendingLv=0;
 if(S.W.shadow) d.give('shadow',S.W.shadow); for(let i=0;i<40;i++) d.spawn('shade',2.5+Math.random()*5); d.DBG.dealt=0; d.DBG.shDealt=0; d.T0=S.t; return 1 }"""
KEEP="""(cfg)=>{ const d=__dbg,S=d.S; S.W=cfg.W; S.evo=cfg.evo||{}; S.fu=cfg.fu||{}; S.hp=S.maxhp=1e7; S.need=1e12; S.pendingLv=0; const lv=document.getElementById('lvup'); if(lv&&lv.classList.contains('show')){ lv.classList.remove('show'); S.phase='play'; }
 if(d.enemies.filter(e=>!e.dead).length<30) for(let i=0;i<10;i++) d.spawn('shade',2.5+Math.random()*5); return {t:S.t-d.T0,dealt:d.DBG.dealt,ph:S.phase} }"""
async def run(pg,cfg,secs=7):
    await pg.goto(URL); await pg.wait_for_timeout(2200)
    await pg.evaluate(SETUP,cfg); r=None
    for i in range(60):
        await pg.wait_for_timeout(300); r=await pg.evaluate(KEEP,cfg)
        if r['t']>=secs: break
    import math
    if r is None or not isinstance(r.get('dealt'),(int,float)) or not isinstance(r.get('t'),(int,float)) or math.isnan(r['dealt']) or math.isnan(r['t']): return -1,0
    return round(r['dealt']/max(.1,r['t'])), round(r['t'],1)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]
        pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
        await pg.goto(URL); await pg.wait_for_timeout(2200)
        T=await pg.evaluate("({W:Object.keys(__dbg.WEAPONS),F:Object.entries(__dbg.FUS).map(([k,v])=>[k,v.a,v.b])})")
        if MODE=="w":
            for k in T['W']:
                if k=='shadow' or (ONLY and k not in ONLY): continue
                a,_=await run(pg,{"W":{k:3,"shadow":5}})
                sh=await pg.evaluate("(()=>{const d=__dbg,S=d.S; return {shDealt:Math.round(d.DBG.shDealt||0), tops:S.tops.filter(q=>q.sh).length, jangs:S.jangs.filter(J=>J.sh).length, posts:(S.shPosts||[]).length, kite:!!S.shKite, yuts:S.yuts.filter(y=>y.sh).length, arrows:S.arrows.filter(q=>q.sh).length, salt:0}})()")
                print(json.dumps({"w":k,"dps_total":a,**sh},ensure_ascii=False),flush=True)
        if MODE=="e":
            for k in T['W']:
                if ONLY and k not in ONLY: continue
                W={k:5}; 
                if k=='shadow': W={"shadow":5,"orb":3}
                a,_=await run(pg,{"W":W}); e,_=await run(pg,{"W":W,"evo":{k:True}})
                print(json.dumps({"evo":k,"lv5":a,"awakened":e,"add%":round((e-a)/max(1,a)*100)},ensure_ascii=False),flush=True)
        if MODE=="f":
            for k,x,y in T['F']:
                if ONLY and k not in ONLY: continue
                W={x:5,y:5}; a,_=await run(pg,{"W":W}); f,_=await run(pg,{"W":W,"fu":{k:True}})
                print(json.dumps({"fu":k,"base":a,"with_fusion":f,"add%":round((f-a)/max(1,a)*100)},ensure_ascii=False),flush=True)
        print("ERR",errs[:5]); await b.close()
asyncio.run(main())
