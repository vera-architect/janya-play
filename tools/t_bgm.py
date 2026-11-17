# v2.32 배경음악 시험: 장면이 바뀔 때 곡이 바뀌는지(필드→중간보스→필드→파이널→쟁탈) · 곡 파일이 없을 때 오류 없는지
import asyncio, sys, json
from playwright.async_api import async_playwright
NOFILE=len(sys.argv)>1 and sys.argv[1]=='nofile'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
        pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]
        pg.on("pageerror",lambda e: errs.append("PAGEERR "+str(e)))
        await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
        if NOFILE: await pg.route("**/bgm/*.mp3",lambda r: r.fulfill(status=404,body="no"))
        await pg.goto("http://localhost:8765/dist.html?sfield#bot"); await pg.wait_for_timeout(4000)
        ev=lambda js: pg.evaluate(js)
        st=lambda: ev("JSON.stringify({sc:__dbg.DBG.bgmScene(),cur:__dbg.DBG.bgm.cur,want:__dbg.DBG.bgm.want,buf:Object.keys(__dbg.DBG.bgm.buf),miss:Object.keys(__dbg.DBG.bgm.miss),ph:__dbg.S.phase})")
        await ev("(()=>{const d=__dbg,S=d.S;S.maxhp=S.hp=99999;window.BOTOFF=1;d.setTs(4);S.ynT=1e9;return 1})()")
        await pg.wait_for_timeout(3000); print("start",await st())
        Z=json.loads(await ev("JSON.stringify(__dbg.MY.zones.map(z=>({id:z.id,x:z.x,z:z.z,key:z.key})))"))
        for z in Z:
            await ev(f"(()=>{{const P=__dbg.player.root.position;P.set({z['x']}+2,0,{z['z']});return 1}})()")
            await pg.wait_for_function("__dbg.boss.alive",timeout=30000); await pg.wait_for_timeout(2500)
            print(z['key'],"fight",await st())
            if z['key']=='tiger':
                vs=set()
                for k in range(16):
                    await pg.wait_for_timeout(400); vs.add(await ev("__dbg.boss.view"))
                print("tiger views",sorted(vs)); await pg.screenshot(path="/home/claude/test/bgm_tiger.png")
            await ev("__dbg.hitBoss(1e7)"); await pg.wait_for_function("!__dbg.boss.alive",timeout=60000); await pg.wait_for_timeout(2500)
            print(z['key'],"after",await st())
        await pg.wait_for_timeout(3000); print("clash?",await st())
        print("log",await ev("JSON.stringify(__dbg.DBG.bgm.log)"))
        print("ERRS",errs[:6]); await b.close()
asyncio.run(main())
