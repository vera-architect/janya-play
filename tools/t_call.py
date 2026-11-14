# v2.29 파티·음성 통화 두 사람 시험: python3 tools/t_call.py  (로컬 브로커 node tools/broker.js 필요)
import asyncio
from playwright.async_api import async_playwright
A=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--autoplay-policy=no-user-gesture-required"]
U="http://localhost:8765/ext.html?mq=ws://localhost:8883&sfield&seed=7#bot"
async def page(b,nm,errs):
    c=await b.new_context(viewport={"width":390,"height":844},permissions=["microphone"]); pg=await c.new_page()
    pg.on("pageerror",lambda e: errs.append(nm+" "+str(e))); pg.on("console",lambda m: errs.append(nm+" C "+m.text) if ("rror" in m.text or "call" in m.text or "sdp" in m.text or "pty" in m.text) else None)
    await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/three/build/three.module.js",content_type="application/javascript"))
    await pg.route("https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js",lambda r: r.fulfill(path="/home/claude/game/node_modules/mqtt/dist/mqtt.min.js",content_type="application/javascript"))
    await pg.add_init_script("try{const k='janya_v2';const o=JSON.parse(localStorage.getItem(k)||'{}');o.intro=true;localStorage.setItem(k,JSON.stringify(o));localStorage.setItem('janya_nm',JSON.stringify('%s'));localStorage.removeItem('janya_pt')}catch(e){}"%nm)
    return pg
async def tapSel(pg,sel,txt=None):
    return await pg.evaluate("([s,t])=>{ const els=[...document.querySelectorAll(s)].filter(e=>!t||e.textContent.includes(t)); const e=els[0]; if(!e) return 'none'; e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})); return 'ok' }",[sel,txt])
async def main():
    async with async_playwright() as p:
        errs=[]; b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=A); b2=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=A)
        a=await page(b,'불꽃',errs); c=await page(b2,'친구',errs)
        await a.goto(U,wait_until="domcontentloaded"); await c.goto(U,wait_until="domcontentloaded"); await a.wait_for_timeout(16000)
        await a.evaluate("window.BOTOFF=1;__dbg.DBG.clog=1"); await c.evaluate("window.BOTOFF=1;__dbg.DBG.clog=1")
        await c.evaluate("(()=>{const pa=__dbg.MP.room.peers().find(p=>!p.isMe); if(pa&&typeof pa.presence.x==='number'){ __dbg.player.root.position.set(pa.presence.x+2.2,0,pa.presence.z); } return !!pa })()")
        await a.wait_for_timeout(2500)
        bp=await a.evaluate("__dbg.MP.room.peers().find(p=>!p.isMe).peer"); print('B peer',bp, 'ghosts',await a.evaluate("__dbg.MP.ghosts.size"))
        # 친구 캐릭터 톡 → 카드
        pos=await a.evaluate("""(()=>{ const G=[...__dbg.MP.ghosts.values()][0]; const v=G.g.position.clone(); v.y=1; v.project(__dbg.R3.camera); return [(v.x+1)/2*390,(1-v.y)/2*844] })()""")
        print('card', await a.evaluate("""(()=>{ const G=[...__dbg.MP.ghosts.values()][0]; const v=G.g.position.clone(); v.y=1; v.project(__dbg.R3.camera); const r=document.getElementById('c').getBoundingClientRect(); const x=r.left+(v.x+1)/2*r.width,y=r.top+(1-v.y)/2*r.height; return [__dbg.ghostTap(x,y), document.getElementById('pCard')&&document.getElementById('pCard').innerText] })()"""))
        await a.screenshot(path="/home/claude/test/call_card.png")
        # 파티 청함 → 맺기
        print('pty tap', await tapSel(a,'#pCard [data-a=pty]')); await c.wait_for_timeout(5000)
        print('B ask', await c.evaluate("document.getElementById('ptAskB')&&document.getElementById('ptAskB').innerText")); await c.screenshot(path="/home/claude/test/call_ptask.png")
        print('B ok', await tapSel(c,'#ptAskB .btn','맺기')); await a.wait_for_timeout(5000)
        print('party', await a.evaluate("__dbg.PTY.id"), await c.evaluate("__dbg.PTY.id"), 'labelA', await a.evaluate("[...__dbg.MP.ghosts.values()].map(g=>g.lbl)"))
        # 전화
        await a.evaluate("__dbg.callStart(%r)"%bp); await c.wait_for_timeout(2500)
        print('A st',await a.evaluate("__dbg.CALL.st"),'B st',await c.evaluate("__dbg.CALL.st"), 'B box', await c.evaluate("document.getElementById('callInB')&&document.getElementById('callInB').innerText"))
        await c.screenshot(path="/home/claude/test/call_in.png"); await a.screenshot(path="/home/claude/test/call_out.png")
        print('B accept', await tapSel(c,'#callInB .btn','받기')); await a.wait_for_timeout(15000)
        st="(async()=>{ const C=__dbg.CALL; let rx=0; if(C.pc){ const r=await C.pc.getStats(); r.forEach(x=>{ if(x.type==='inbound-rtp'&&x.kind==='audio') rx=x.bytesReceived; }); } const au=document.getElementById('callAu'); return [C.st, C.pc&&C.pc.connectionState, rx, !!(au&&au.srcObject), document.getElementById('cbT').textContent] })()"
        import time; t0=time.time()
        for i in range(30):
            ra=await a.evaluate(st); rb=await c.evaluate(st)
            if ra[0]=='on' and rb[0]=='on' and ra[2]>0 and rb[2]>0: break
            await a.wait_for_timeout(2000)
        print('A',ra,'B',rb,'wait',round(time.time()-t0))
        await a.wait_for_timeout(2000); await a.screenshot(path="/home/claude/test/call_on.png")
        print('labelA', await a.evaluate("[...__dbg.MP.ghosts.values()].map(g=>g.lbl)"))
        # 음소거
        print('mute', await tapSel(a,'#cbMute')); print('A mute', await a.evaluate("[__dbg.CALL.mute, __dbg.CALL.ms.getAudioTracks()[0].enabled]"))
        # 메뉴 목록
        await a.evaluate("document.getElementById('bPause').click()"); await a.wait_for_timeout(800); await a.evaluate("document.getElementById('pPpl').scrollIntoView()"); await a.screenshot(path="/home/claude/test/call_menu.png")
        print('menu', (await a.evaluate("document.getElementById('pPpl').innerText"))[:200])
        await a.evaluate("document.getElementById('bResume').click()")
        # 다시 잇기(받은 쪽이 흔들림 → rst → 건 쪽 ICE 다시)
        await c.evaluate("__dbg.callRe()"); await a.wait_for_timeout(1500); print('re B', await c.evaluate("[__dbg.CALL.st, document.getElementById('cbT').textContent]"))
        for i in range(12):
            r=[await a.evaluate("__dbg.CALL.st"), await c.evaluate("__dbg.CALL.st")]
            if r==['on','on']: break
            await a.wait_for_timeout(2000)
        print('after re', r, await c.evaluate(st))
        # B가 끊기
        print('B end', await tapSel(c,'#cbEnd')); await a.wait_for_timeout(2000)
        print('after end A', await a.evaluate("[__dbg.CALL.st, document.getElementById('toast').innerText, document.getElementById('callBar').style.display, document.getElementById('callBar').innerText]"), 'B', await c.evaluate("__dbg.CALL.st"))
        await a.screenshot(path="/home/claude/test/call_end.png")
        # 거절 흐름
        await c.evaluate("__dbg.callStart(__dbg.MP.room.peers().find(p=>!p.isMe).peer)"); await a.wait_for_timeout(2500); print('reject', await tapSel(a,'#callInB .btn','거절')); await c.wait_for_timeout(2000)
        print('after reject B', await c.evaluate("[__dbg.CALL.st, document.getElementById('toast').innerText]"))
        # 다시 걸기 → 받기 → B가 창을 떠남
        print('redial', await tapSel(a,'#cbRe')); await c.wait_for_timeout(4000); print('B accept2', await tapSel(c,'#callInB .btn','받기'))
        for i in range(15):
            if await a.evaluate("__dbg.CALL.st")=='on': break
            await a.wait_for_timeout(2000)
        print('on2', await a.evaluate("__dbg.CALL.st")); await c.goto("about:blank"); await a.wait_for_timeout(5000)
        print('leave A', await a.evaluate("[__dbg.CALL.st, document.getElementById('callBar').innerText]"))
        await a.evaluate("document.getElementById('bPause').click()"); await a.wait_for_timeout(600); print('log', await a.evaluate("document.getElementById('pPpl').innerText"))
        print('ERR',[e for e in errs if 'PAGE' in e or 'rror' in e][:8], len(errs)); print('\n'.join(errs[:12]))
        await b.close(); await b2.close()
asyncio.run(main())
