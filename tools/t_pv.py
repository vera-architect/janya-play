# v2.31 파티 음성방(3명) + 파티 쟁탈(파이널 뒤 파티 풀림) 시험: 로컬 브로커 필요
import asyncio, time
from playwright.async_api import async_playwright
A=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--autoplay-policy=no-user-gesture-required"]
U="http://localhost:8765/ext.html?mq=ws://localhost:8883&sfield&seed=7#bot"
async def page(b,nm,errs):
    c=await b.new_context(viewport={"width":390,"height":844},permissions=["microphone"]); pg=await c.new_page()
    pg.on("pageerror",lambda e: errs.append(nm+" PAGE "+str(e)))
    await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
    await pg.route("https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/mqtt/dist/mqtt.min.js",content_type="application/javascript"))
    await pg.add_init_script("try{const k='janya_v2';const o=JSON.parse(localStorage.getItem(k)||'{}');o.intro=true;localStorage.setItem(k,JSON.stringify(o));localStorage.setItem('janya_nm',JSON.stringify('%s'));localStorage.removeItem('janya_pt')}catch(e){}"%nm)
    return pg
async def main():
    async with async_playwright() as p:
        errs=[]; bs=[await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=A) for _ in range(3)]
        pg=[await page(bs[i],n,errs) for i,n in enumerate(['불꽃','친구','동생'])]
        for x in pg: await x.goto(U,wait_until="domcontentloaded")
        await pg[0].wait_for_timeout(18000)
        for x in pg: await x.evaluate("window.BOTOFF=1;__dbg.PTY.id='ptx1';__dbg.S.hp=__dbg.S.maxhp=1e6")
        # 모두 A 곁으로
        for x in pg[1:]: await x.evaluate("(()=>{const pa=__dbg.MP.room.peers().find(p=>!p.isMe&&p.presence&&typeof p.presence.x==='number'); if(pa) __dbg.player.root.position.set(pa.presence.x+2,0,pa.presence.z+1); return !!pa})()")
        await pg[0].wait_for_timeout(3000)
        print('party seen', [await x.evaluate("__dbg.MP.room.peers().filter(p=>!p.isMe&&__dbg.ptRaw(p)).length") for x in pg])
        await pg[0].screenshot(path="/home/claude/test/pv_tie.png")
        # 음성방
        for x in pg: await x.evaluate("__dbg.pvJoin()")
        st="(async()=>{ const V=__dbg.PV; const out=[]; for(const [k,pc] of V.pcs){ let rx=0; const r=await pc.getStats(); r.forEach(s=>{ if(s.type==='inbound-rtp'&&s.kind==='audio') rx=s.bytesReceived; }); out.push([pc.connectionState,rx]); } return [V.on,out,document.getElementById('pvN')&&document.getElementById('pvN').textContent] })()"
        t0=time.time()
        for i in range(25):
            r=[await x.evaluate(st) for x in pg]
            if all(len(q[1])==2 and all(c=='connected' and b>0 for c,b in q[1]) for q in r): break
            await pg[0].wait_for_timeout(2000)
        print('PV',r,'wait',round(time.time()-t0))
        await pg[0].screenshot(path="/home/claude/test/pv_on.png")
        # 파티 쟁탈: A가 파이널을 잡음
        fz=await pg[0].evaluate("(()=>{ const Z=__dbg.MY.zones.find(z=>!z.mid); return Z&&Z.id })()")
        for x in pg: await x.evaluate("(i)=>{ const Z=__dbg.MY.zones.filter(z=>z.mid); Z.forEach(z=>__dbg.zoneKilled(z.id,false)); }",fz)
        await pg[0].evaluate("(i)=>__dbg.zoneKilled(i,true)",fz); await pg[0].wait_for_timeout(2500)
        for x in pg[1:]: await x.evaluate("(i)=>__dbg.zoneKilled(i,false)",fz)
        await pg[0].wait_for_timeout(1500)
        print('broke', [await x.evaluate("[__dbg.S.ptBroke||0, __dbg.MP.room.peers().filter(p=>!p.isMe&&__dbg.ptRaw(p)).length, document.getElementById('doomBan').innerText.slice(0,60)]") for x in pg])
        print('PV after break', [len((await x.evaluate(st))[1]) for x in pg])
        await pg[0].screenshot(path="/home/claude/test/pv_broke.png")
        await pg[0].evaluate("__dbg.roundEnd(false)"); await pg[0].wait_for_timeout(2500)
        print('after round', await pg[0].evaluate("[__dbg.S.phase, __dbg.S.ptBroke||0, document.getElementById('toast').innerText.slice(0,40)]"))
        await pg[0].evaluate("__dbg.pvLeave()"); await pg[1].wait_for_timeout(4000)
        print('after leave B', (await pg[1].evaluate(st))[1])
        print('ERR',[e for e in errs][:8])
        for b in bs: await b.close()
asyncio.run(main())
