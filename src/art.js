/* ============================================================
   art.js — 코드로 그리는 손그림 (Don't Starve 느낌)
   캐릭터 기준 그림은 AI(제미나이) 구미호. 나머지는 임시 코드 그림.
   1·2막 규칙: 괴수 그림에 사람의 흔적(옷, 소지품, 이름표)을 넣지 않는다.
   ============================================================ */
export const INK = '#140d14';
export const C = {
  red:'#d02a40', redD:'#7d1428', gold:'#f4b740', goldD:'#9a6a1c', goldL:'#ffe08a',
  teal:'#33dcc8', tealD:'#0f7a74', tealL:'#c8fff5',
  cream:'#ece1cc', creamS:'#9c8794', white:'#fbf6ec', whiteS:'#c6b3b5',
  indigo:'#2e2b52', indigoD:'#1a1832', indigoL:'#46427a', boot:'#2a2236',
  shade:'#231a2e', shadeS:'#120c18', shadeL:'#3a2d4a'
};

/* ---------- 손그림 도구 ---------- */
let seed = 1;
export function setSeed(s){ seed = s; }
export function rnd(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }
export const rr = (a,b)=>a+(b-a)*rnd();
export function mk(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
export function shape(pts){
  const p=new Path2D(), n=pts.length, mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const s=mid(pts[n-1],pts[0]); p.moveTo(s[0],s[1]);
  for(let i=0;i<n;i++){ const c=pts[i], m=mid(c,pts[(i+1)%n]);
    if(c[2]){ p.lineTo(c[0],c[1]); p.lineTo(m[0],m[1]); } else p.quadraticCurveTo(c[0],c[1],m[0],m[1]); }
  p.closePath(); return p;
}
export function ell(x,y,rx,ry,r=0){ const p=new Path2D(); p.ellipse(x,y,rx,ry,r,0,Math.PI*2); return p; }
export function ink(ctx,path,lw=7){
  ctx.save(); ctx.strokeStyle=INK; ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.lineWidth=lw; ctx.stroke(path);
  ctx.translate(rr(-1.8,1.8),rr(-1.8,1.8)); ctx.lineWidth=lw*.42; ctx.stroke(path);
  ctx.restore();
}
function fillShade(ctx,path,base,shadow,s=10,hl=null,hlw=4){
  ctx.save(); ctx.clip(path); ctx.fillStyle=shadow; ctx.fill(path);
  ctx.translate(-s,-s*.8); ctx.fillStyle=base; ctx.fill(path); ctx.restore();
  if(hl){ ctx.save(); ctx.clip(path); ctx.translate(hlw*1.4,hlw*1.4); ctx.strokeStyle=hl; ctx.lineWidth=hlw; ctx.globalAlpha=.75; ctx.stroke(path); ctx.restore(); }
}
function hatch(ctx,path,x0,y0,x1,y1,n,len=14,ang=.9){
  ctx.save(); ctx.clip(path); ctx.strokeStyle=INK; ctx.globalAlpha=.55; ctx.lineCap='round';
  for(let i=0;i<n;i++){ const x=rr(x0,x1), y=rr(y0,y1), l=len*rr(.6,1.2); ctx.lineWidth=rr(1.6,3);
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(ang)*l,y+Math.sin(ang)*l); ctx.stroke(); }
  ctx.restore();
}
function part(ctx,pts,base,shadow,o={}){
  const p=Array.isArray(pts)?shape(pts):pts;
  fillShade(ctx,p,base,shadow,o.s??10,o.hl,o.hlw);
  if(o.hatch) hatch(ctx,p,...o.hatch);
  ink(ctx,p,o.lw??7); return p;
}
function fillInk(ctx,pts,col,lw=6){ const p=Array.isArray(pts)?shape(pts):pts; ctx.fillStyle=col; ctx.fill(p); ink(ctx,p,lw); return p; }
function limb(ctx,pts,w,col,sock=0,sockCol=INK){
  const p=new Path2D(); p.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) p.lineTo(pts[i][0],pts[i][1]);
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle=INK; ctx.lineWidth=w+11; ctx.stroke(p);
  ctx.strokeStyle=col; ctx.lineWidth=w; ctx.stroke(p);
  if(sock){ const a=pts[pts.length-2], b=pts[pts.length-1], L=Math.hypot(b[0]-a[0],b[1]-a[1]), t=Math.min(1,sock/L);
    ctx.strokeStyle=sockCol; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(b[0]+(a[0]-b[0])*t,b[1]+(a[1]-b[1])*t); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
  ctx.restore();
}
export function glowDot(ctx,x,y,r,col,a=1){
  const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(${col},${a})`); g.addColorStop(.35,`rgba(${col},${a*.55})`); g.addColorStop(1,`rgba(${col},0)`);
  ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
}

/* ---------- 플레이어: 등불 든 망자 (소방관, 임시 그림) ---------- */
export const PW=320, PH=400;
function lantern(ctx,x,y){
  ctx.save(); ctx.strokeStyle=INK; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y+6,10,Math.PI,0); ctx.stroke(); ctx.restore();
  part(ctx,[[x-16,y+6,1],[x+16,y+6,1],[x+12,y+17,1],[x-12,y+17,1]],C.gold,C.goldD,{s:3,lw:5});
  part(ctx,[[x-13,y+17,1],[x+13,y+17,1],[x+15,y+45,1],[x-15,y+45,1]],C.goldL,C.gold,{s:5,lw:5});
  ctx.fillStyle='#fff'; ctx.fill(shape([[x,y+22,1],[x+6,y+35],[x,y+41],[x-6,y+35]]));
  part(ctx,[[x-17,y+45,1],[x+17,y+45,1],[x+12,y+53,1],[x-12,y+53,1]],C.gold,C.goldD,{s:3,lw:5});
}
const CLOAK=[[160,188],[112,214],[98,290],[86,350,1],[110,336],[124,352,1],[144,338],[160,354,1],[176,338],[196,352,1],[210,336],[234,350,1],[222,290],[208,214]];
// 방화 헬멧 (뒤챙이 긴 실루엣) — 생전 직업이 실루엣으로 보이게
function helmetFront(ctx){
  part(ctx,[[160,70],[206,74],[236,104],[246,140],[270,156,1],[250,170],[160,176],[70,170],[50,156,1],[74,140],[84,104],[114,74]],'#c23a2c','#6e1a18',{s:10,hl:'#ff7a5c'});
  part(ctx,[[150,74],[170,74],[174,150],[146,150]],C.gold,C.goldD,{s:3,lw:5});
}
function helmetBack(ctx){
  part(ctx,[[160,70],[206,74],[236,104],[246,140],[276,170,1],[250,182],[160,190],[70,182],[44,170,1],[74,140],[84,104],[114,74]],'#c23a2c','#6e1a18',{s:10,hl:'#ff7a5c'});
}
function helmetSide(ctx){
  part(ctx,[[150,66],[196,70],[230,100],[244,140],[262,150,1],[230,158],[150,166],[96,170],[52,176,1],[66,150],[84,104],[112,76]],'#c23a2c','#6e1a18',{s:10,hl:'#ff7a5c'});
}
function playerFront(ctx,f){
  setSeed(101); const L=[[0,0],[12,0],[0,0],[0,12]][f];
  limb(ctx,[[142,330],[140,384-L[0]]],22,C.boot);
  limb(ctx,[[178,330],[180,384-L[1]]],22,C.boot);
  part(ctx,CLOAK,C.indigo,C.indigoD,{s:16,hl:C.indigoL,hatch:[180,260,235,350,7]});
  // 반사띠 (방화복)
  ctx.save(); ctx.clip(shape(CLOAK)); ctx.fillStyle='#d9d27a'; ctx.globalAlpha=.85; ctx.fillRect(90,300,150,9); ctx.restore();
  limb(ctx,[[210,236],[230,270],[240,292]],17,C.indigo);
  lantern(ctx,246,292);
  part(ctx,[[106,204],[160,192],[214,204],[216,228],[160,238],[104,228]],C.red,C.redD,{s:6,hl:'#ff6a74',hlw:3});
  const face=ell(160,150,48,42); ctx.fillStyle='#0b0811'; ctx.fill(face); ink(ctx,face,5);
  ctx.fillStyle='#fff2c0'; ctx.fill(ell(141,152,7.5,11.5)); ctx.fill(ell(179,152,7.5,11.5));
  helmetFront(ctx);
}
function playerFrontGlow(ctx){ glowDot(ctx,141,152,26,'255,220,140',.9); glowDot(ctx,179,152,26,'255,220,140',.9); glowDot(ctx,246,325,70,'255,190,90',1); }
function playerBack(ctx,f){
  setSeed(102); const L=[[0,0],[0,12],[0,0],[12,0]][f];
  limb(ctx,[[142,330],[140,384-L[0]]],22,C.boot);
  limb(ctx,[[178,330],[180,384-L[1]]],22,C.boot);
  part(ctx,CLOAK,C.indigo,C.indigoD,{s:16,hl:C.indigoL,hatch:[180,260,235,350,7]});
  ctx.save(); ctx.clip(shape(CLOAK)); ctx.fillStyle='#d9d27a'; ctx.globalAlpha=.85; ctx.fillRect(90,300,150,9); ctx.fillRect(110,240,100,8); ctx.restore();
  limb(ctx,[[110,236],[90,270],[80,292]],17,C.indigo);
  lantern(ctx,74,292);
  part(ctx,[[106,204],[160,198],[214,204],[216,228],[160,234],[104,228]],C.red,C.redD,{s:6});
  const nape=ell(160,170,46,40); ctx.fillStyle='#0b0811'; ctx.fill(nape); ink(ctx,nape,5);
  helmetBack(ctx);
}
function playerBackGlow(ctx){ glowDot(ctx,74,325,70,'255,190,90',1); }
function playerSide(ctx,f){
  setSeed(103);
  const g=[[150,174,0,0],[132,194,0,12],[150,174,0,0],[194,132,12,0]][f];
  limb(ctx,[[164,330],[g[0],384-g[2]]],22,'#1c1626');
  part(ctx,[[140,206],[124,212],[90,226],[58,222,1],[78,238],[50,256,1],[96,248],[134,232]],C.red,C.redD,{s:5});
  limb(ctx,[[160,330],[g[1],384-g[3]]],22,C.boot);
  const body=[[165,190],[128,212],[112,280],[100,350,1],[122,338],[140,352,1],[160,340],[182,350,1],[208,338,1],[202,280],[196,214]];
  part(ctx,body,C.indigo,C.indigoD,{s:14,hl:C.indigoL,hatch:[160,270,205,345,6]});
  ctx.save(); ctx.clip(shape(body)); ctx.fillStyle='#d9d27a'; ctx.globalAlpha=.85; ctx.fillRect(100,300,120,9); ctx.restore();
  part(ctx,[[124,204],[196,198],[206,224],[128,232]],C.red,C.redD,{s:5});
  const face=ell(196,152,34,38); ctx.fillStyle='#0b0811'; ctx.fill(face); ink(ctx,face,5);
  ctx.fillStyle='#fff2c0'; ctx.fill(ell(212,154,7,11));
  helmetSide(ctx);
  limb(ctx,[[186,236],[212,258],[230,272]],17,C.indigo);
  lantern(ctx,238,272);
}
function playerSideGlow(ctx){ glowDot(ctx,212,154,24,'255,220,140',.9); glowDot(ctx,238,305,70,'255,190,90',1); }

/* ---------- 원념 그림자 (잡몹) ---------- */
export const SW=200, SH=230;
function shadeBody(ctx,f,elite){
  setSeed(elite?520+f:500+f);
  const w=[0,6,-4,3][f];
  const pts=[[100,40],[128,46],[150,72,1],[148,58],[166,96],[176,140],[172,180],[186,214,1],[160,198],[150,222,1],[128,200],[110,224+w*.5,1],[96,200],[78,222,1],[66,196],[42,214,1],[34,176],[30,132],[42,92],[54,56,1],[62,78],[76,48]];
  const p=part(ctx,pts,elite?'#2b1a26':C.shade,C.shadeS,{s:14,hl:elite?'#5a2a3c':C.shadeL,hlw:4,hatch:[110,120,170,200,10],lw:7});
  // 얼굴 쪽 움푹한 그늘
  ctx.save(); ctx.clip(p); ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fill(ell(100,104+w*.3,46,30)); ctx.restore();
  const ec=elite?'#ff5a5a':'#bdfff3';
  ctx.fillStyle=ec; ctx.fill(ell(82,104,8,12,-.2)); ctx.fill(ell(118,104,8,12,.2));
  ctx.fillStyle=INK; ctx.fill(ell(84,106,3,5)); ctx.fill(ell(116,106,3,5));
  if(elite){ // 이마의 붉은 무늬
    ctx.save(); ctx.strokeStyle=C.red; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(100,64); ctx.lineTo(100,86); ctx.moveTo(86,70); ctx.lineTo(92,84); ctx.moveTo(114,70); ctx.lineTo(108,84); ctx.stroke(); ctx.restore(); }
}
function shadeGlow(ctx,elite){ const c=elite?'255,80,80':'90,255,225'; glowDot(ctx,82,104,26,c,1); glowDot(ctx,118,104,26,c,1); }

/* ---------- 도깨비불 ---------- */
export const WW=200, WH=260;
function wispTex(ctx,f){
  setSeed(300+f);
  const d=[[0,0,0],[8,-10,6],[-6,8,-8],[4,4,-4]][f];
  const p=shape([[100,252],[152,234],[170,190],[160,140],[146,74+d[2],1],[130,118],[110,26+d[1],1],[96,106],[72,60+d[0],1],[62,128],[34,182],[48,234]]);
  const g=ctx.createRadialGradient(100,196,6,100,180,120); g.addColorStop(0,C.tealL); g.addColorStop(.45,C.teal); g.addColorStop(1,C.tealD);
  ctx.fillStyle=g; ctx.fill(p);
  ctx.save(); ctx.clip(p); ctx.fillStyle='rgba(15,122,116,.6)'; ctx.translate(14,10); ctx.globalCompositeOperation='multiply'; ctx.fill(ell(140,210,60,80)); ctx.restore();
  ink(ctx,p,6);
  ctx.fillStyle=INK; ctx.fill(ell(80,182,11,15)); ctx.fill(ell(122,182,11,15));
  ctx.fillStyle='#fff'; ctx.fill(ell(84,176,4,4)); ctx.fill(ell(126,176,4,4));
  ctx.save(); ctx.strokeStyle=INK; ctx.lineWidth=5; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath();
  const pts=[[76,206],[84,215],[91,208],[100,219],[109,208],[116,215],[124,206]];
  ctx.moveTo(...pts[0]); for(const q of pts.slice(1)) ctx.lineTo(...q); ctx.stroke(); ctx.restore();
}
function wispGlow(ctx){ glowDot(ctx,100,170,100,'90,255,225',.55); }

/* ---------- 보물 괴수: 두꺼비 ---------- */
export const TW=220, TH=180;
function toadTex(ctx,f){
  setSeed(600+f); const h=[0,-8][f%2];
  limb(ctx,[[60,140],[40,160],[30,170]],18,'#8a6a2c');
  limb(ctx,[[160,140],[180,160],[190,170]],18,'#8a6a2c');
  const body=part(ctx,[[110,60+h],[160,70+h],[192,110],[186,150],[110,166],[34,150],[28,110],[60,70+h]],'#c9963e','#7a5622',{s:12,hl:'#f0c46a',hatch:[130,110,190,160,8]});
  ctx.save(); ctx.clip(body); ctx.fillStyle='#ecd9a6'; ctx.fill(ell(110,150,52,24)); ctx.fillStyle='#7a5622';
  for(let i=0;i<14;i++){ ctx.beginPath(); ctx.arc(rr(50,170),rr(78,128),rr(3,6),0,7); ctx.fill(); } ctx.restore();
  part(ctx,ell(76,70+h,20,18),'#c9963e','#7a5622',{s:5,lw:5}); part(ctx,ell(144,70+h,20,18),'#c9963e','#7a5622',{s:5,lw:5});
  ctx.fillStyle=C.gold; ctx.fill(ell(76,68+h,12,10)); ctx.fill(ell(144,68+h,12,10));
  ctx.fillStyle=INK; ctx.fillRect(68,66+h,16,4); ctx.fillRect(136,66+h,16,4);
  ctx.save(); ctx.strokeStyle=INK; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(80,104+h); ctx.quadraticCurveTo(110,118+h,140,104+h); ctx.stroke(); ctx.restore();
}
function toadGlow(ctx){ glowDot(ctx,110,110,110,'255,200,90',.5); }

/* ---------- 보물 괴수: 까치 ---------- */
function magpieTex(ctx,f){
  setSeed(700+f); const w=[0,1][f%2];
  limb(ctx,[[100,140],[96,170]],6,INK); limb(ctx,[[120,140],[124,170]],6,INK);
  part(ctx,[[60,110],[20,96],[10,104,1],[56,126]],'#1c2238','#0b0e18',{s:4,lw:5}); // 꼬리
  part(ctx,[[60,100],[100,74],[150,80],[176,104],[160,140],[100,146],[62,128]],'#f2efe6','#a9a2a0',{s:10,hl:'#fff'});
  ctx.save(); ctx.clip(shape([[60,100],[100,74],[150,80],[176,104],[160,140],[100,146],[62,128]])); ctx.fillStyle=INK; ctx.fillRect(40,60,150,40); ctx.restore();
  part(ctx,ell(160,82,26,24),INK,'#000',{s:4,lw:5});
  fillInk(ctx,[[182,80],[204,88,1],[182,94]],'#2a2a2a',4);
  ctx.fillStyle=C.gold; ctx.fill(ell(166,78,5,5));
  // 날개 (청록 광택)
  const wing=w?[[80,96],[120,40],[150,60],[132,104]]:[[80,100],[126,92],[150,116],[104,124]];
  part(ctx,wing,'#1c3a4a','#0b1820',{s:6,hl:C.teal,hlw:3,lw:5});
}
function magpieGlow(ctx){ glowDot(ctx,110,100,100,'255,200,90',.45); }

/* ---------- 무기 ---------- */
export function axeTex(){
  const c=mk(160,160), ctx=c.getContext('2d'); setSeed(800);
  limb(ctx,[[34,140],[118,40]],12,'#7a4a2a');
  part(ctx,[[104,22],[150,30,1],[148,78,1],[122,62],[108,50]],'#d8dce4','#8a8f9a',{s:5,lw:5});
  part(ctx,[[108,24],[132,28],[126,58],[106,50]],C.red,C.redD,{s:4,lw:5});
  fillInk(ctx,[[104,40],[78,30,1],[100,52]],'#8a8f9a',4);
  return c;
}
export function gemTex(){
  const c=mk(64,64), ctx=c.getContext('2d'); setSeed(810);
  glowDot(ctx,32,32,32,'90,255,225',.6);
  const p=shape([[32,8,1],[48,32,1],[32,56,1],[16,32,1]]); ctx.fillStyle=C.teal; ctx.fill(p);
  ctx.fillStyle=C.tealL; ctx.fill(shape([[32,14,1],[40,30,1],[32,34,1],[24,30,1]])); ink(ctx,p,3);
  return c;
}
export function bigGemTex(){
  const c=mk(64,64), ctx=c.getContext('2d'); setSeed(811);
  glowDot(ctx,32,32,32,'255,210,120',.7);
  const p=shape([[32,6,1],[52,32,1],[32,58,1],[12,32,1]]); ctx.fillStyle=C.gold; ctx.fill(p);
  ctx.fillStyle=C.goldL; ctx.fill(shape([[32,12,1],[42,30,1],[32,34,1],[22,30,1]])); ink(ctx,p,3);
  return c;
}
export function emberTex(){ // 회복: 따뜻한 불씨
  const c=mk(64,64), ctx=c.getContext('2d');
  glowDot(ctx,32,34,32,'255,150,60',.9);
  const p=shape([[32,10,1],[44,34],[32,52],[20,34]]); ctx.fillStyle='#ff8a2a'; ctx.fill(p);
  ctx.fillStyle='#fff1b0'; ctx.fill(shape([[32,26,1],[38,38],[32,46],[26,38]])); ink(ctx,p,3);
  return c;
}
export function flameTex(ctx,f){
  setSeed(400+f*7);
  const lay=(sc,col,yb)=>{
    const top=[]; for(let i=0;i<5;i++){ const t=(i+.5)/5; top.push([100+(t-.5)*130*sc+rr(-8,8),yb-rr(140,250)*sc*(1-Math.abs(t-.5)*1.1),1]); top.push([100+(t-.5+.1)*120*sc,yb-rr(60,110)*sc]); }
    const P=[[100-75*sc,yb],...top.slice(0,-1),[100+75*sc,yb],[100,yb+18*sc]];
    ctx.fillStyle=col; ctx.fill(shape(P)); };
  lay(1,'#e8452a',280); lay(.75,'#ff8a2a',282); lay(.5,C.gold,284); lay(.28,'#fff6c8',286);
}
export function radial(inner='255,255,255',size=128){ const c=mk(size,size), x=c.getContext('2d'); glowDot(x,size/2,size/2,size/2,inner,1); return c; }
export function shadowC(){ const c=mk(128,64), x=c.getContext('2d'); const g=x.createRadialGradient(64,32,4,64,32,62); g.addColorStop(0,'rgba(0,0,0,.75)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.setTransform(1,0,0,.5,0,16); x.fillStyle=g; x.fillRect(0,0,128,128); return c; }
export function ringC(){ // 등불 빛 고리
  const c=mk(256,256), x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,40,128,128,128); g.addColorStop(0,'rgba(255,200,110,0)'); g.addColorStop(.72,'rgba(255,190,90,.10)'); g.addColorStop(.93,'rgba(255,210,120,.55)'); g.addColorStop(1,'rgba(255,210,120,0)');
  x.fillStyle=g; x.fillRect(0,0,256,256); return c;
}
export function lineC(){ // 돌진 예고선
  const c=mk(64,256), x=c.getContext('2d'); const g=x.createLinearGradient(0,0,64,0);
  g.addColorStop(0,'rgba(208,42,64,0)'); g.addColorStop(.5,'rgba(255,70,90,.9)'); g.addColorStop(1,'rgba(208,42,64,0)');
  x.fillStyle=g; x.fillRect(0,0,64,256); return c;
}
export function groundC(){
  const c=mk(512,512), x=c.getContext('2d'); setSeed(7); x.fillStyle='#2a3a34'; x.fillRect(0,0,512,512);
  const W9=(fn)=>{ for(const dx of[-512,0,512]) for(const dy of[-512,0,512]){ x.save(); x.translate(dx,dy); fn(); x.restore(); } };
  for(let i=0;i<60;i++){ const px=rnd()*512, py=rnd()*512, r=rr(20,70); W9(()=>{ const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba(12,18,16,.35)'); g.addColorStop(1,'rgba(12,18,16,0)'); x.fillStyle=g; x.fillRect(px-r,py-r,r*2,r*2); }); }
  const cols=['#34493f','#1f2c28','#3b5246','#1a2421','#2e3f37'];
  for(let i=0;i<1600;i++){ const px=rnd()*512, py=rnd()*512, l=rr(6,20), a=rr(-.6,.6)-Math.PI/2; x.strokeStyle=cols[i%5]; x.lineWidth=rr(1.5,3.5); x.lineCap='round';
    const jx=rr(-3,3); W9(()=>{ x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+Math.cos(a)*l*.5+jx,py+Math.sin(a)*l*.5,px+Math.cos(a)*l,py+Math.sin(a)*l); x.stroke(); }); }
  return c;
}

/* ---------- 묶음 ---------- */
function build(w,h,fn,frames){ const out=[]; for(let f=0;f<frames;f++){ const c=mk(w,h); fn(c.getContext('2d'),f); out.push(c); } return out; }
function one(w,h,fn){ const c=mk(w,h); fn(c.getContext('2d')); return c; }
export function makeArt(){
  return {
    player:{w:PW,h:PH,ppu:250,views:{
      front:{frames:build(PW,PH,playerFront,4),glow:one(PW,PH,playerFrontGlow)},
      side:{frames:build(PW,PH,playerSide,4),glow:one(PW,PH,playerSideGlow)},
      back:{frames:build(PW,PH,playerBack,4),glow:one(PW,PH,playerBackGlow)}}},
    shade:{w:SW,h:SH,frames:build(SW,SH,(c,f)=>shadeBody(c,f,false),4),glow:one(SW,SH,c=>shadeGlow(c,false))},
    elite:{w:SW,h:SH,frames:build(SW,SH,(c,f)=>shadeBody(c,f,true),4),glow:one(SW,SH,c=>shadeGlow(c,true))},
    wisp:{w:WW,h:WH,frames:build(WW,WH,wispTex,4),glow:one(WW,WH,wispGlow)},
    toad:{w:TW,h:TH,frames:build(TW,TH,toadTex,2),glow:one(TW,TH,toadGlow)},
    magpie:{w:TW,h:TH,frames:build(TW,TH,magpieTex,2),glow:one(TW,TH,magpieGlow)},
    flames:build(200,300,flameTex,4)
  };
}

/* ---------- v2 추가 그림 ---------- */
export function concreteC(){ // 서울역 고가: 갈라진 콘크리트·아스팔트
  const c=mk(512,512), x=c.getContext('2d'); setSeed(9); x.fillStyle='#34343c'; x.fillRect(0,0,512,512);
  for(let i=0;i<900;i++){ x.fillStyle=`rgba(${rnd()<.5?20:70},${rnd()<.5?20:70},${rnd()<.5?28:80},${rr(.05,.18)})`; const s=rr(2,10); x.fillRect(rnd()*512,rnd()*512,s,s); }
  x.strokeStyle='rgba(10,10,14,.7)'; x.lineCap='round';
  for(let i=0;i<14;i++){ let px=rnd()*512,py=rnd()*512; x.lineWidth=rr(1,2.5); x.beginPath(); x.moveTo(px,py); for(let k=0;k<6;k++){ px+=rr(-40,40); py+=rr(-40,40); x.lineTo(px,py); } x.stroke(); }
  x.fillStyle='rgba(220,200,120,.18)'; for(let i=0;i<8;i++) x.fillRect(250,i*64+10,12,36); // 흐린 차선
  return c;
}
export function saltC(){ const c=mk(64,64), x=c.getContext('2d'); setSeed(830); for(let i=0;i<55;i++){ const a=rnd()*6.28,r=Math.sqrt(rnd())*26; x.fillStyle=rnd()<.7?'#f4f1ea':'#c8d6e0'; x.fillRect(32+Math.cos(a)*r,32+Math.sin(a)*r,rr(2,4),rr(2,4)); } return c; }
export function beanC(){ const c=mk(48,48), x=c.getContext('2d'); glowDot(x,24,24,24,'255,90,80',.45); const p=ell(24,24,11,8,.5); x.fillStyle='#8a1a22'; x.fill(p); x.fillStyle='#d8484f'; x.fill(ell(21,21,5,3,.5)); ink(x,p,3); x.fillStyle='#f4efe0'; x.fill(ell(28,26,3,1.5,.5)); return c; }
export function talisC(){ const c=mk(64,96), x=c.getContext('2d'); setSeed(840);
  const p=shape([[14,8,1],[50,8,1],[52,88,1],[12,88,1]]); x.fillStyle='#f4d24a'; x.fill(p); ink(x,p,3);
  x.strokeStyle='#b0202c'; x.lineWidth=3.5; x.lineCap='round'; x.beginPath(); x.moveTo(32,18); x.lineTo(32,78); x.moveTo(20,30); x.lineTo(44,30); x.moveTo(22,46); x.quadraticCurveTo(32,56,42,46); x.moveTo(20,66); x.lineTo(44,62); x.stroke(); return c; }
export function puddleC(){ const c=mk(128,128), x=c.getContext('2d'); const g=x.createRadialGradient(64,64,6,64,64,62); g.addColorStop(0,'rgba(240,170,60,.8)'); g.addColorStop(.8,'rgba(200,120,30,.5)'); g.addColorStop(1,'rgba(200,120,30,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); return c; }
export function fanC(){ // 휘두르기·경적 부채꼴 (흰색, 색은 코드로)
  const c=mk(256,256), x=c.getContext('2d'); const g=x.createRadialGradient(128,128,20,128,128,128);
  g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.6,'rgba(255,255,255,.25)'); g.addColorStop(.92,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,256,256); return c; }
export function markC(){ const c=mk(48,48), x=c.getContext('2d'); glowDot(x,24,24,24,'255,60,70',.8); x.strokeStyle='#fff'; x.lineWidth=2;
  for(let i=0;i<5;i++){ x.beginPath(); x.moveTo(12+i*6,12); x.lineTo(12+i*6,36); x.stroke(); } return c; }

/* ---------- v2.7.5 빛나는 자리: 버려진 물건 더미 (사람이 두고 간 가게·차의 물건 — 괴수 흔적 아님) ---------- */
export function lootPropC(kind){ // 0 상자 · 1 장바구니 · 2 여행 가방 · 3 가게 셔터(보스 뒤)
  const c=mk(192,192), x=c.getContext('2d'); setSeed(900+kind*13);
  const gl=kind===3?'255,200,90':'150,215,255';
  glowDot(x,96,112,70,gl,.55);
  if(kind===0){ // 열린 종이 상자 — 안에서 빛이 샌다
    part(x,[[44,96,1],[148,96,1],[140,160,1],[52,160,1]],'#b88a58','#6e4a2c',{s:8,lw:6,hatch:[50,120,140,160,5,12,.4]});
    glowDot(x,96,92,46,gl,.95);
    part(x,[[44,96,1],[22,74,1],[64,66,1],[86,96,1]],'#cfa06a','#7e5634',{s:5,lw:5});
    part(x,[[148,96,1],[172,70,1],[134,62,1],[108,96,1]],'#cfa06a','#7e5634',{s:5,lw:5});
    x.fillStyle='#e7d9b8'; x.fillRect(84,122,26,6); x.fillRect(84,134,18,5);
  } else if(kind===1){ // 넘어진 장바구니 — 물건이 쏟아짐
    part(x,[[38,104,1],[124,92,1],[136,150,1],[52,160,1]],'#d02a40','#7d1428',{s:7,lw:6});
    x.save(); x.strokeStyle=INK; x.lineWidth=3; x.globalAlpha=.6; for(let i=0;i<5;i++){ x.beginPath(); x.moveTo(50+i*18,104-i*2.5); x.lineTo(58+i*16,156-i*2); x.stroke(); } x.restore();
    const hd=new Path2D(); hd.moveTo(60,102); hd.quadraticCurveTo(80,50,108,96); x.save(); x.strokeStyle=INK; x.lineWidth=9; x.lineCap='round'; x.stroke(hd); x.strokeStyle='#ece1cc'; x.lineWidth=4; x.stroke(hd); x.restore();
    glowDot(x,138,124,40,gl,.9);
    part(x,ell(146,140,15,11,.3),'#f4b740','#9a6a1c',{s:4,lw:5});
    part(x,[[150,108,1],[176,112,1],[172,132,1],[148,128,1]],'#33dcc8','#0f7a74',{s:4,lw:5});
    part(x,ell(124,156,10,8),'#ece1cc','#9c8794',{s:3,lw:4});
  } else if(kind===2){ // 반쯤 열린 여행 가방
    part(x,[[34,110,1],[158,110,1],[152,160,1],[40,160,1]],'#46427a','#1a1832',{s:8,lw:6});
    glowDot(x,96,108,50,gl,1);
    part(x,[[34,110,1],[46,62,1],[164,74,1],[158,110,1]],'#46427a','#2e2b52',{s:6,lw:6});
    x.fillStyle=INK; x.fillRect(82,118,28,9); x.fillStyle='#f4b740'; x.fillRect(86,120,20,5);
    const hd=new Path2D(); hd.moveTo(84,66); hd.quadraticCurveTo(102,44,120,70); x.save(); x.strokeStyle=INK; x.lineWidth=8; x.lineCap='round'; x.stroke(hd); x.restore();
  } else { // 반쯤 올라간 가게 셔터 — 금빛
    part(x,[[30,46,1],[162,46,1],[162,164,1],[30,164,1]],'#3a2d4a','#120c18',{s:6,lw:6});
    glowDot(x,96,150,62,gl,1);
    x.save(); x.beginPath(); x.rect(36,128,120,32); x.fillStyle='rgba(255,224,138,.85)'; x.fill(); x.restore();
    part(x,[[30,46,1],[162,46,1],[162,124,1],[30,124,1]],'#8a8f9a','#4a4e58',{s:5,lw:6});
    x.save(); x.strokeStyle=INK; x.lineWidth=2.5; x.globalAlpha=.7; for(let y=58;y<122;y+=10){ x.beginPath(); x.moveTo(34,y); x.lineTo(158,y); x.stroke(); } x.restore();
    x.fillStyle=INK; x.fillRect(84,116,24,6);
  }
  return c;
}
export function sparkC(){ // 반짝이는 별 (네 갈래)
  const c=mk(64,64), x=c.getContext('2d'); glowDot(x,32,32,22,'255,255,255',.7);
  x.fillStyle='#fff'; const p=new Path2D(); p.moveTo(32,2); p.quadraticCurveTo(35,29,62,32); p.quadraticCurveTo(35,35,32,62); p.quadraticCurveTo(29,35,2,32); p.quadraticCurveTo(29,29,32,2); x.fill(p); return c;
}
export function floorGlowC(){ // 바닥에 번지는 빛
  const c=mk(128,128), x=c.getContext('2d'); const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(.45,'rgba(255,255,255,.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); return c;
}
