# 처음 하는 사람 흉내: 빈 저장 → 타이틀 → 이야기 → 거점 → 출발 → 끌어서 이동, 캡처
import asyncio, sys, json
from playwright.async_api import async_playwright
import os; OUT=os.environ.get("OUT","/home/claude/test/fresh")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        ctx=await b.new_context(viewport={"width":390,"height":844},has_touch=False,device_scale_factor=1)
        pg=await ctx.new_page(); errs=[]
        pg.on("pageerror",lambda e: errs.append("PAGEERR "+str(e)))
        await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
        await pg.goto("http://localhost:8765/dist.html",wait_until="domcontentloaded"); await pg.wait_for_timeout(5000)
        n=0
        async def shot(tag):
            nonlocal n; await pg.screenshot(path=f"{OUT}/{n:02d}_{tag}.png"); n+=1
        await shot("title")
        await pg.click("#bStart"); await pg.wait_for_timeout(1500); await shot("story1")
        for i in range(8):
            vis=await pg.evaluate("document.getElementById('story').classList.contains('show')")
            if not vis: break
            await pg.mouse.click(195,600); await pg.wait_for_timeout(900)
        await pg.wait_for_timeout(1500); await shot("after_story")
        # 거점이면 출발
        for k in range(8):
            st=await pg.evaluate("[...document.querySelectorAll('.ov.show')].map(e=>e.id).join(',')")
            print("ov:",st)
            if 'choice' in st:
                await shot("choice"); b2=await pg.query_selector("#chOpts .btn, #chOpts div"); 
                if b2: await b2.click()
                await pg.wait_for_timeout(1500)
            elif 'hub' in st:
                await shot("hub"); await pg.click("#hGo"); await pg.wait_for_timeout(2500); await shot("after_go")
            elif 'lvup' in st:
                await shot("lvup"); c=await pg.query_selector("#cards > *"); 
                if c: await c.click()
                await pg.wait_for_timeout(1000)
            else: break
        # 플레이: 끌어서 이동, 3초마다 캡처, 레벨업 뜨면 캡처하고 첫 카드
        dirs=[(0,-100),(0,-100),(70,-60),(90,20),(-60,70),(-90,-20)]
        t=0
        for step in range(16):
            st=await pg.evaluate("[...document.querySelectorAll('.ov.show')].map(e=>e.id).join(',')")
            if 'lvup' in st or 'choice' in st or 'result' in st:
                await shot(st.split(',')[0])
                if 'result' in st: break
                sel="#cards > *" if 'lvup' in st else "#chOpts > *"
                c=await pg.query_selector(sel)
                if c: await c.click()
                await pg.wait_for_timeout(800); continue
            dx,dy=dirs[(step//2)%len(dirs)]
            await pg.mouse.move(195,600); await pg.mouse.down(); await pg.mouse.move(195+dx,600+dy,steps=5)
            await pg.wait_for_timeout(3000)
            await shot(f"play{step:02d}")
            await pg.mouse.up()
            info=await pg.evaluate("(()=>{const d=window.__dbg;if(!d||!d.S)return null;const S=d.S;return {w:d.DBG.welcT,t:Math.round(S.t||0),lv:S.lv,hp:Math.round(S.hp),k:S.kills,ph:S.phase}})()")
            print(step,info,flush=True)
        print("ERR",errs[:8]); await b.close()
asyncio.run(main())
