# 처음 2분 재기: 첫 처치 시각 · 30/60/90/120초 체력 · 받은 피해 출처 (빈 저장, 명동 필드, lazy 봇)
import asyncio, sys, json
from playwright.async_api import async_playwright
SEEDS=[int(x) for x in (sys.argv[1] if len(sys.argv)>1 else "1,2,3").split(',')]; END=float(sys.argv[2]) if len(sys.argv)>2 else 120; EXTRA=sys.argv[3] if len(sys.argv)>3 else ""
async def one(b,seed):
    pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]
    pg.on("pageerror",lambda e: errs.append(str(e)))
    await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
    await pg.goto(f"http://localhost:8765/dist.html?myeong&mfield&noren&seed={seed}&fixed=6{EXTRA}#lazy"); await pg.wait_for_timeout(2500)
    first=None; marks={}; out=None
    while True:
        await pg.wait_for_timeout(400)
        s=await pg.evaluate("(()=>{const S=__dbg.S;if(!S)return null;return {t:S.t,k:S.kills,hp:S.hp,mhp:S.maxhp,ph:S.phase,lv:S.lv,safe:!!S.inSafe,en:__dbg.enemies.length}})()")
        if not s: continue
        if first is None and s['k']>0: first=round(s['t'],1)
        for m in (30,60,90,120,150,180):
            if s['t']>=m and m not in marks: marks[m]=(round(s['hp']),s['lv'],s['k'],s['en'])
        if s['ph']!='play' or s['t']>=END: out=s; break
    hb=await pg.evaluate("(()=>{const h=__dbg.DBG.hb||{};const o={};for(const k in h)o[k]=Math.round(h[k]);return o})()")
    await pg.close()
    return dict(seed=seed,first=first,marks=marks,end=(round(out['t']),out['ph'],round(out['hp'])),hb=hb,err=errs[:3])
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        for sd in SEEDS: print(json.dumps(await one(b,sd),ensure_ascii=False),flush=True)
        await b.close()
asyncio.run(main())
