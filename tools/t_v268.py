# v2.68 시험: 안 멈추는 성장 창 · 상대 진영 모닥불 · 움직이는 수비 보스 · 수풀 · 정글 — 로컬 MQTT 두 사람
import asyncio, json
from playwright.async_api import async_playwright
exec(open('/home/claude/game/tools/t_v262.py').read().split('async def main')[0])
U="http://localhost:8765/ext.html?mq=ws://localhost:8883&noren&room=t268"
async def enter(pg,tm):
    await pg.goto(U,wait_until="domcontentloaded"); await pg.wait_for_timeout(6000)
    await pg.mouse.click(195,600); await pg.wait_for_timeout(2500)
    await pg.evaluate(f"__dbg.duel.duelStart('1','6868','{tm}',null)"); await pg.wait_for_timeout(9000)
    await pg.evaluate("(()=>{window.BOTOFF=1;__dbg.S.maxhp=__dbg.S.hp=1e9;__dbg.DBG.fixed=4;return 1})()")
J=lambda s:"(()=>{const d=__dbg,S=d.S,D=S.duel,M=d.MY,P=d.player.root.position;"+s+"})()"
async def main():
    async with async_playwright() as p:
        errs=[]; out={}
        ba,a=await page(p,'aa',errs); bb,b=await page(p,'zz',errs)
        await enter(a,'a'); await enter(b,'b'); await a.wait_for_timeout(3000)
        out['setup']=await a.evaluate(J("return {tm:D.tm,base:D.base,G:D.G.map(g=>[g.id,Math.round(g.px),Math.round(g.pz)]),bush:(M.bush||[]).length,camps:Object.keys(D.camp||{}),peers:d.MP?1:0}"))
        # ① 모닥불: 밀린 성장 → 멈추지 않음
        await a.evaluate(J("const b=D.base[D.tm]; P.set(b.x+1,0,b.z+1); S.pendingLv=2; return 1")); await a.wait_for_timeout(1500)
        out['camp0']=await a.evaluate(J("return {ph:S.phase,safe:S.inSafe,fire:document.getElementById('lvBadge').className,shown:document.getElementById('lvup').classList.contains('show')}"))
        t0=await a.evaluate("__dbg.S.t"); await a.evaluate("__dbg.duel.openCamp()"); await a.wait_for_timeout(1500)
        out['camp1']=await a.evaluate(J("return {ph:S.phase,shown:document.getElementById('lvup').classList.contains('show'),dt:S.t-"+str(t0)+"}"))
        await a.screenshot(path="/home/claude/test/v268_camp.png")
        await a.evaluate("document.querySelector('#cards .card').click()"); await a.wait_for_timeout(400)
        out['camp2']=await a.evaluate(J("return {pend:S.pendingLv,ph:S.phase}"))
        await a.evaluate(J("P.set(P.x+30,0,P.z+30); return 1")); await a.wait_for_timeout(1200)
        out['camp3']=await a.evaluate(J("return {shown:document.getElementById('lvup').classList.contains('show'),ph:S.phase}"))
        # 고르기 창(보물 괴수와 같은 길)도 안 멈춤
        t1=await a.evaluate("__dbg.S.t"); await a.evaluate("__dbg.duel.showChoice('시험','멈추나?',{a:'ㄱ',b:'ㄴ'},()=>{})"); await a.wait_for_timeout(1200)
        out['choice']=await a.evaluate(J("return {ph:S.phase,dt:S.t-"+str(t1)+",live:document.getElementById('choice').className}"))
        await a.evaluate("document.querySelector('#chOpts .opt').click()")
        # ② 상대 진영 모닥불
        await a.evaluate(J("const o=D.base[D.tm==='a'?'b':'a']; P.set(o.x+1,0,o.z+1); S.hp=S.maxhp*.5; S.pendingLv=1; return 1")); await a.wait_for_timeout(1500)
        out['foeFire']=await a.evaluate(J("return {safe:S.inSafe,hp:S.hp/S.maxhp,fire:document.getElementById('lvBadge').className}"))
        # ③ 수비 보스: B가 A 중간보스 자리 가까이 → 보스가 다가간다(A 화면·B 화면 둘 다)
        g=await a.evaluate(J("const G=D.G.find(g=>g.tm===D.tm&&g.mid); return [G.id,G.px,G.pz]"))
        await a.evaluate(J("const b=D.base[D.tm]; P.set(b.x+1,0,b.z+1); return 1"))
        await b.evaluate(J(f"P.set({g[1]+9},0,{g[2]}); return 1")); await a.wait_for_timeout(4000)
        out['guardA']=await a.evaluate(J(f"const G=D.G.find(g=>g.id==='{g[0]}'); return [Math.round(G.x*10)/10,Math.round(G.z*10)/10,'post',G.px,G.pz,'mine',D.gpMine.length]"))
        out['guardB']=await b.evaluate(J(f"const G=D.G.find(g=>g.id==='{g[0]}'); return [Math.round(G.x*10)/10,Math.round(G.z*10)/10,'mine',D.gpMine.length]"))
        await b.evaluate(J(f"P.set({g[1]+40},0,{g[2]}); return 1")); await a.wait_for_timeout(5000)
        out['guardBack']=await a.evaluate(J(f"const G=D.G.find(g=>g.id==='{g[0]}'); return [Math.round(G.x*10)/10,Math.round(G.z*10)/10]"))
        # ④ 수풀: B가 수풀 안 → A 화면에서 B 안 보임 · 가까이 가면 보임
        bu=await b.evaluate(J("const r=M.bush[0]; P.set((r[0]+r[2])/2,0,(r[1]+r[3])/2); return r"))
        await a.evaluate(J(f"P.set({(bu[0]+bu[2])/2+15},0,{(bu[1]+bu[3])/2}); return 1")); await a.wait_for_timeout(2500)
        vis=lambda: a.evaluate(J("const G=[...d.MP.ghosts.values()][0]; return G?G.g.visible:'none'"))
        out['bush_far']=[await vis(), await b.evaluate("__dbg.S.bush")]
        await a.evaluate(J(f"P.set({(bu[0]+bu[2])/2+2},0,{(bu[1]+bu[3])/2}); return 1")); await a.wait_for_timeout(1500)
        out['bush_near']=await vis()
        await a.screenshot(path="/home/claude/test/v268_bush.png")
        # ⑤ 정글: A가 붉은 괴수 곁 → 잡음 → B 화면에서도 사라짐
        k=await a.evaluate(J("const C=Object.values(D.camp).find(c=>c.c.t==='red'); P.set(C.c.x+5,0,C.c.z); return C.c.k")); await a.wait_for_timeout(1500)
        await b.evaluate(J(f"const C=D.camp['{k}']; P.set(C.c.x+12,0,C.c.z); return 1")); await b.wait_for_timeout(1500)
        out['jg0']=[await a.evaluate(J(f"return !!D.camp['{k}'].e")), await b.evaluate(J(f"return !!D.camp['{k}'].e"))]
        await a.screenshot(path="/home/claude/test/v268_camp_mob.png")
        await a.evaluate(J(f"__dbg.duel.kill(D.camp['{k}'].e); return 1")); await a.wait_for_timeout(2500)
        out['jg1']=await a.evaluate(J(f"return {{buff:S.jbR>S.t,e:!!D.camp['{k}'].e,might:+(()=>0)()}}"))
        out['jg1b']=await b.evaluate(J(f"return {{e:!!D.camp['{k}'].e,jk:D.jk['{k}']>0}}"))
        print(json.dumps(out,ensure_ascii=False,indent=0)); print('ERR',errs[:5]); await ba.close(); await bb.close()
asyncio.run(main())
