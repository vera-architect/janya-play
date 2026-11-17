# v2.32 시험: 중간보스 잭팟 「혼불 터짐」 — 혼자(늘 받음) / mp(가짜 room: 내가 깎음 → 받음 · 남이 잡음 0% → 없음 · 3% → 스쳐 감)
import asyncio, sys, json
from playwright.async_api import async_playwright
MOCK=open('/home/claude/game/tools/t13.py',encoding='utf-8').read().split('MOCK="""')[1].split('"""')[0]
MP=len(sys.argv)>1 and sys.argv[1]=='mp'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg=await b.new_page(viewport={"width":390,"height":844}); errs=[]
        pg.on("pageerror",lambda e: errs.append("PAGEERR "+str(e)))
        pg.on("console",lambda m: errs.append(m.text) if m.type=="error" and "404" not in m.text and "Failed to load" not in m.text else None)
        await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
        if MP: await pg.add_init_script(MOCK)
        await pg.goto("http://localhost:8765/dist.html?mfield#bot"); await pg.wait_for_timeout(3500)
        ev=lambda js: pg.evaluate(js)
        await ev("(()=>{const d=__dbg,S=d.S;S.maxhp=S.hp=99999;window.BOTOFF=1;d.setTs(2);return 1})()")
        st="(()=>{const d=__dbg,S=d.S;return JSON.stringify({W:S.W,P:S.P,evo:Object.keys(S.evo),jp:d.DBG.jp||[],try:d.DBG.jpTry||[],inv:+(S.jpInv||0).toFixed(2),pend:S.pendingLv,br:S.pendingBr})})()"
        async def tp(x,z): await ev(f"(()=>{{const P=__dbg.player.root.position;P.set({x},0,{z});return 1}})()")
        Z=json.loads(await ev("JSON.stringify(__dbg.MY.zones.map(z=>({id:z.id,x:z.x,z:z.z,mid:z.mid})))"))
        if 'load' in sys.argv: await ev("(()=>{const d=__dbg,S=d.S,ek=Object.keys(d.EVOS)[0],nd=d.EVOS[ek].need;d.give(ek,5);S.P[nd]=1;d.give('beans',2);d.give('salt',1);S.P.cd=2;return ek+'/'+nd})()")
        print("start",await ev(st))
        if MP:
            P=json.loads(await ev("JSON.stringify(__dbg.player.root.position)"))
            await ev(f"(()=>{{window.__fakes=[{{peer:'p2',by:'u2',isMe:false,sameTab:false,kind:'viewer',guest:false,presence:{{a:'f:myeong',x:{P['x']+3},z:{P['z']+20},c:'clerk',l:7,h:1,e:0,s:0,dk:'myeong',r:0,bd:'',bh:[],pk:[],dr:[],hit:[]}},updatedAt:0}}];window.__onp({{peers:[],joined:[window.__fakes[0]],left:[],updated:[]}});return 1}})()")
            await pg.wait_for_timeout(1500)
        mids=[z for z in Z if z['mid']]
        for i,z in enumerate(mids):
            await tp(z['x']+2,z['z']); await pg.wait_for_function("__dbg.boss.alive",timeout=30000)
            if MP and i>0:
                pct=0 if i==1 else (.03 if 'p3' in sys.argv else .08)
                if pct: await ev(f"__dbg.hitBoss(Math.round(__dbg.boss.maxhp*{pct}))")
                await ev(f"(()=>{{const f=window.__fakes[0],bd=(f.presence.bd||'')+'{z['id']}';window.__fakes=[{{...f,presence:{{...f.presence,bd,bh:[['{z['id']}',999999]]}}}}];return 1}})()")
            else:
                await ev("__dbg.hitBoss(1e7)")
            await pg.wait_for_function("!__dbg.boss.alive",timeout=60000)
            await pg.wait_for_timeout(1700); await pg.screenshot(path=f"/home/claude/test/jp{'m' if MP else ''}{i}.png")
            print("inv-during",await ev("+(__dbg.S.jpInv||0).toFixed(2)"))
            await pg.wait_for_timeout(2500); print("after",z['id'],await ev(st))
        # 확률 표본 (함수만)
        print("count-dist",await ev("(()=>{const c={};for(let i=0;i<20000;i++){const r=Math.random();const n=r<.6?1:r<.9?3:5;c[n]=(c[n]||0)+1;}return JSON.stringify(c)})()"))
        print("ERRS",errs[:6]); await b.close()
asyncio.run(main())
