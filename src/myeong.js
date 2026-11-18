// 명동 지역 필드 — 명동 시험 2(dot2.js)의 입체 배경을 게임에 넣는 모듈 (2026-11-13)
// 건물·가게 위치: © OpenStreetMap contributors (ODbL). 상호는 비튼 이름(claude/22). 1단위 ≈ 1.2m (실제 거리)
import * as THREE from 'three';
function mergeGeometries(gs){ const names=Object.keys(gs[0].attributes); const out=new THREE.BufferGeometry();
  for(const n of names){ const it=gs[0].attributes[n].itemSize; let tot=0; for(const g of gs) tot+=g.attributes.position.count; const a=new Float32Array(tot*it); let o=0;
    for(const g of gs){ const at=g.attributes[n], c=g.attributes.position.count; if(at){ if(at.array.length===c*it) a.set(at.array,o); else for(let i=0;i<c*it;i++) a[o+i]=at.array[i]; } o+=c*it; }
    out.setAttribute(n,new THREE.BufferAttribute(a,it)); } return out; }
/* v2.51 지역 랜드마크 (기획자 11-18 21:21 「여기가 거기다 싶은 느낌」 · 21:50 「필드에서도 보였으면」)
   자리는 OpenStreetMap(© OpenStreetMap contributors, ODbL · 2026-11-18 Overpass/Nominatim)에서 잰 실제 자리.
   필드 밖에 있는 것(명동성당·케이블카·경의선숲길·성수대교·서울숲·광화문 등)은 같은 방향의 필드 안쪽 끝으로 당겨 둠.
   1·2막 규칙: 사람 동상·사랑의 자물쇠·글자 간판 없음. 상표 건물(남산의 탑)은 모양을 바꿈.
   fp = 막히는 네모 [가운데x, 가운데z, 너비, 깊이](그 랜드마크 기준) · cut = 건물을 치우는 네모 · seg = 성벽 선 */
const LMKS={
 myeong:[
  {rep:1,h:30,dist:72,yaw:-1.5708,id:'church',k:'church',x:84,z:-40,ry:0,fp:[[0,0,24,10],[4,0,8,15],[11,0,9,9],[-12,0,5.6,5.6]],cut:[[-1,0,32,17]]},
  {gl:1,h:6,dist:34,id:'carts',k:'carts',x:-18,z:10,ry:0,fp:[],cut:[]},
  {gl:1,h:16,dist:46,yaw:3.1416,id:'cable',k:'cableLo',x:-66,z:125,ry:0,fp:[[0,0,9,7]],cut:[[0,0,12,10]]}],
 hongdae:[
  {w:30,rep:1,h:8,dist:44,yaw:-0.7854,id:'rail',k:'railpark',x:82,z:-132,ry:-.44,fp:[[-19,-3.8,1.2,1.2],[-9,3.8,1.2,1.2],[1,-3.8,1.2,1.2],[11,3.8,1.2,1.2],[19,-3.8,1.2,1.2],[-14,3.8,1.2,1.2],[6,3.8,1.2,1.2],[-4,-3.8,1.2,1.2],[15,-3.8,1.2,1.2],[-16,4.2,.5,.5]],cut:[[0,0,46,10]]},
  {gl:1,h:6,dist:30,id:'stage',k:'stage',x:30,z:-136,ry:0,fp:[[0,0,7.2,4.2]],cut:[[0,1,10,9]]},
  {gl:1,h:5,dist:32,yaw:3.1416,id:'play',k:'playground',x:2,z:112,ry:0,fp:[[-5.6,-2,4.2,2],[1.4,-3,.6,1.6],[6.6,-3,.6,1.6],[0,3.5,3.4,3.4]],cut:[[0,0,18,13]]}],
 seongsu:[
  {w:30,rep:1,h:17,dist:52,yaw:3.1416,id:'brick',k:'factory',x:88,z:104,ry:3.1416,fp:[[0,0,29,14],[14.5,-4,2.6,2.6]],cut:[[0,0,33,17]]},
  {gl:1,h:12,dist:58,yaw:1.5708,id:'bridge',k:'bridge',x:-90,z:70,ry:0,fp:[[-15,0,31,80]],cut:[[-15,0,33,82]]},
  {gl:1,h:4,dist:28,yaw:1.5708,id:'deer',k:'deer',x:-80,z:20,ry:.3,fp:[[0,0,14.4,10.4]],cut:[[0,0,16,12]]}],
 gyeong:[
  {w:46,rep:1,h:15,dist:56,yaw:3.1416,id:'gate',k:'gwanghwa',x:2,z:149,ry:0,fp:[[0,0,40,8]],cut:[[0,0,44,10]]},
  {id:'haechiL',k:'haechi',x:-23,z:156,ry:0,fp:[[0,0,2.8,3.6]],cut:[]},
  {id:'haechiR',k:'haechi',x:27,z:156,ry:0,fp:[[0,0,2.8,3.6]],cut:[]},
  {w:44,gl:1,h:15,dist:60,id:'hall',k:'geunjeong',x:14,z:-31,ry:0,fp:[[0,0,40,32]],cut:[[0,0,42,34]]},
  {w:54,p:.2,gl:1,h:14,dist:58,yaw:-0.5,id:'pavil',k:'gyeonghoe',x:-62,z:-144,ry:0,fp:[[0,0,30,33]],cut:[[0,0,32,35]]}],
 namsan:[
  {rep:1,h:52,dist:118,id:'tower',k:'tower',x:4,z:-4,ry:0,fp:[[0,0,12,12]],cut:[[0,0,14,14]]},
  {gl:1,h:8,dist:34,id:'palgak',k:'palgak',x:-40,z:-43,ry:0,fp:[[0,0,9,9]],cut:[[0,0,10,10]]},
  {gl:1,h:5,dist:30,id:'bongsu',k:'bongsu',x:-49,z:-79,ry:0,fp:[[0,0,16,4]],cut:[[0,0,17,5]]},
  {gl:1,h:8,dist:40,yaw:0.5,id:'cable',k:'cableUp',x:-62,z:-115,ry:-2.585,fp:[[0,0,8,6]],cut:[[0,0,10,8]]},
  {id:'wall',k:'wall',x:0,z:0,ry:0,fp:[],cut:[],seg:[[[-110,-146],[-91,-114],[-52,-46],[-42,-23],[-22,-27]],[[80,-19],[94,-18],[114,-14.6]]]}]
};
export function buildMyeong({BLD_RAW,SHOPS_RAW,NAMES_RAW,POOLX,B,SC,SCR,ZONE,ROADS_RAW,CROSS_RAW,BT,WATER,STYLE,FOREST,KEY,lootPropC,MOBILE}){
const PAL=STYLE==='palace', MNT=STYLE==='mount', CITY=!PAL&&!MNT; // v2.48 서울 5지역(61번): 궁궐·산 모양
const G=new THREE.Group(); G.visible=false;
const PPU=12; // 벽 그림: 1단위당 도트 수
let dseed=7; const rnd2=()=>{ dseed=(dseed*16807)%2147483647; return dseed/2147483647; };

/* ---------- 비튼 상호: src/names.tsv (원래\t비튼\t방식) — 방식 업=사람 이름이라 업종만 ---------- */
const NAMES={}; for(const l of NAMES_RAW.split('\n')){ const q=l.split('\t'); if(q.length>=2) NAMES[q[0]]={n:q[1],m:q[2]||''}; }
const POOL={food:['분식','백반','국밥','칼국수','만둣집','고깃집','중화요리','김밥','떡볶이','냉면','한식','덮밥'],cafe:['커피','다방','디저트','빵집','카페'],
 cloth:['의류','옷가게','패션잡화','구제옷'],cos:['화장품','코스메틱'],conv:['편의점','마트'],shop:['잡화','기념품','선물가게','가게'],pharm:['약국'],bank:['은행'],
 bar:['호프','포차','술집'],tool:['열쇠','철물점'],hair:['미용실','헤어','이발소']};
const CAT={
 food:{k:'식당',col:'#d9773a',sg:'#7a3a1e',ic:'bowl',loot:'불씨 재료'},
 cafe:{k:'카페',col:'#9a6a46',sg:'#4a2e1e',ic:'cup',loot:'불씨 재료'},
 cloth:{k:'옷가게',col:'#8a6ac0',sg:'#3a2a5a',ic:'shirt',loot:'🧵 실타래 (몸·발 강화)'},
 cos:{k:'화장품',col:'#e07ea0',sg:'#7a2a4a',ic:'bottle',loot:'🫙 고운 가루 (머리 강화)'},
 conv:{k:'편의점',col:'#3aa89a',sg:'#145a52',ic:'bag',loot:'강화재료 아무거나'},
 shop:{k:'가게',col:'#4a9ab8',sg:'#1e4a5e',ic:'box',loot:'강화재료 아무거나'},
 pharm:{k:'약국',col:'#4aa86a',sg:'#1e5a32',ic:'cross',loot:'회복 도구'},
 bank:{k:'은행',col:'#4a6aaa',sg:'#1e2e5a',ic:'coin',loot:'불씨 재료'},
 bar:{k:'술집',col:'#b85050',sg:'#5a1e1e',ic:'glass',loot:'불씨 재료'},
 tool:{k:'철물점',col:'#8a8a90',sg:'#3a3a40',ic:'key',loot:'🔩 쇠붙이 (손·도구 강화)'},
 hair:{k:'미용실',col:'#c890c8',sg:'#5a2a5a',ic:'scis',loot:'🫙 고운 가루 (머리 강화)'}};
function catOf(c){ if(/restaurant|fast_food/.test(c)) return 'food'; if(/cafe|bakery|confectionery|chocolate|ice_cream/.test(c)) return 'cafe';
 if(/clothes|shoes|sports|fashion|watches/.test(c)) return 'cloth'; if(/cosmetics|beauty|perfumery|massage/.test(c)) return 'cos'; if(/hairdresser/.test(c)) return 'hair';
 if(/convenience|supermarket|variety/.test(c)) return 'conv'; if(/pharmacy|clinic|dentist/.test(c)) return 'pharm'; if(/bank/.test(c)) return 'bank'; if(/bar|pub/.test(c)) return 'bar';
 if(/locksmith|hardware|electronics/.test(c)) return 'tool'; return 'shop'; }
const BANW=/이승|장례|상조|영정|빈소|저울|수의|납골|추모/; // v2.53 간판 글자 금지 말(22번)
function shopName(n,c,oc,x,z){ const r=shopName0(n,c,oc,x,z); if(BANW.test(r.name)){ const P=POOL[c]||POOL.shop; r.name=P[Math.abs((x*7919)^(z*104729))%P.length]; r.gen=true; } return r; }
function shopName0(n,c,oc,x,z){ const t=NAMES[n]; if(t) return {name:t.n,gen:t.m==='업'};
 if(oc==='department_store') return {name:'백화점',gen:true};
 const P=poolOf(c); return {name:P[Math.abs((x*73856093)^(z*19349663))%P.length],gen:true}; }
// v2.15: 이름 없는 가게는 그 지역 인기 가게·체인 이름을 비튼 것(POOLX, tools/mk_pool.py)에서 고름 — 없으면 업종 이름
function poolOf(c){ return (POOLX&&POOLX[c]&&POOLX[c].length)?POOLX[c]:POOL[c]; }
const SHOPS=SHOPS_RAW.split(';').map(t=>{ const p=t.split(','); const c=catOf(p[2]); const n=p.slice(3).join(','); const x=+p[0],z=+p[1];
 return {x,z,c,raw:n,...shopName(n,c,p[2],x,z)}; });
// 업종 이름이 이웃(18칸 안)과 겹치지 않게 다시 고름
for(const s of SHOPS){ if(!s.gen||NAMES[s.raw]) continue; const P=poolOf(s.c); if(P.length<2) continue; const NR=P===POOL[s.c]?18:30;
 const near=new Set(SHOPS.filter(o=>o!==s&&Math.hypot(o.x-s.x,o.z-s.z)<NR).map(o=>o.name)); if(!near.has(s.name)) continue;
 const st=P.indexOf(s.name); for(let i=1;i<P.length;i++){ const q=P[(st+i)%P.length]; if(!near.has(q)){ s.name=q; break; } } }

/* ---------- 렌더러 · 빛 ---------- */
/* ---------- 빛 (지역 필드 안에서만 켜짐: G 안에 있음) ---------- */
const FOG=0xcfc7ba;
const hemi=new THREE.HemisphereLight(0xdde3ea,0x6e6254,1.0); G.add(hemi);
const sun=new THREE.DirectionalLight(0xffdcae,2.05); sun.castShadow=true; sun.shadow.mapSize.set(MOBILE?1024:2048,MOBILE?1024:2048);
{ const c=sun.shadow.camera; c.left=-38; c.right=38; c.top=38; c.bottom=-38; c.near=1; c.far=160; } sun.shadow.bias=-.0006; sun.shadow.normalBias=.03;
const SUN=new THREE.Vector3(-34,62,30); // 남서쪽 높은 해 → 그림자는 북동쪽(화면 오른쪽 위)으로
G.add(sun,sun.target);
const ctex=(c,rep)=>{ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; };
const mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
// 플레이어를 가리는 건물은 그 건물 한 채만 반투명하게(건물 번호 bid → 투명도 표 uFade)
// 같은 모양을 두 번 그린다: ① 불투명 패스(흐린 건물은 버림) ② 반투명 패스(흐린 건물만, 뒤에 그려 섞음)
const FADE_N=1024, FADE=new Uint8Array(FADE_N).fill(255), FA=new Float32Array(FADE_N).fill(1), FT=new Float32Array(FADE_N).fill(1);
const fadeTex=new THREE.DataTexture(FADE,FADE_N,1,THREE.RedFormat,THREE.UnsignedByteType); fadeTex.magFilter=fadeTex.minFilter=THREE.NearestFilter; fadeTex.needsUpdate=true;
const FADE_TO=.3;
function fadeMat(m,mode){ m.onBeforeCompile=sh=>{ sh.uniforms.uFade={value:fadeTex}; sh.uniforms.uMode={value:mode};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float bid; varying float vBid;').replace('#include <project_vertex>','#include <project_vertex>\nvBid=bid;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uFade; uniform float uMode; varying float vBid;').replace('#include <dithering_fragment>','#include <dithering_fragment>\n{ float id=mod(vBid,1000.); float fa=texture2D(uFade,vec2((id+.5)/1024.,.5)).r; if(uMode<.5){ if(fa<.99) discard; } else { if(fa>=.99||vBid>999.5) discard; gl_FragColor.a*=fa; } }'); };
  m.customProgramCacheKey=()=>'fade'+mode+m.type; if(mode){ m.transparent=true; m.depthWrite=false; } return m; }
// v2.9: 넓은 지역(수원)은 화면 밖 건물을 안 그리도록 땅을 칸(TILE)으로 잘라 따로 그린다 — 칸마다 보이는지 따로 판단
const TILE=90;
function splitGeo(g){ const src=g.index?g.toNonIndexed():g, P=src.attributes.position, n=P.count/3, names=Object.keys(src.attributes), B=new Map();
  for(let t=0;t<n;t++){ const cx=(P.getX(t*3)+P.getX(t*3+1)+P.getX(t*3+2))/3, cz=(P.getZ(t*3)+P.getZ(t*3+1)+P.getZ(t*3+2))/3; const k=Math.floor(cx/TILE)+','+Math.floor(cz/TILE); let a=B.get(k); if(!a){ a=[]; B.set(k,a); } a.push(t); }
  if(B.size<=1) return [g];
  const out=[]; for(const T of B.values()){ const ng=new THREE.BufferGeometry();
    for(const nm of names){ const at=src.attributes[nm], it=at.itemSize, arr=new at.array.constructor(T.length*3*it); let o=0; for(const t of T){ for(let v=0;v<3;v++) for(let c=0;c<it;c++) arr[o++]=at.array[(t*3+v)*it+c]; } ng.setAttribute(nm,new THREE.BufferAttribute(arr,it,at.normalized)); }
    ng.computeBoundingSphere(); out.push(ng); } return out; }
// v2.25 먹선: 건물 모서리에 옅은 먹 테두리(LineSegments 하나로). 흐려진 건물 위에선 같이 옅게 남는다.
const INK=new THREE.LineBasicMaterial({color:0x120c18,transparent:true,opacity:.55,depthWrite:false});
function addFaded(g,mat,cast=true,ink=false){ const m0=fadeMat(mat,0), m1=fadeMat(mat.clone(),1), m2=fadeMat(mat.clone(),1); m1.colorWrite=false; m1.depthWrite=true;
  const parts=(GW*GH>100000)?splitGeo(g):[g]; let first=null;
  for(const pg of parts){ const a=new THREE.Mesh(pg,m0); a.castShadow=cast; a.receiveShadow=true; G.add(a); first=first||a;
    // 흐린 건물은 맨 앞 겉면 한 겹만 보이게: ② 깊이만 먼저 쓰고(색 없음) ③ 그 깊이와 같은 면만 색을 섞는다 → 속의 벽·난간 틀이 비치지 않음
    const z=new THREE.Mesh(pg,m1); z.renderOrder=5; G.add(z);
    const b=new THREE.Mesh(pg,m2); b.receiveShadow=true; b.renderOrder=6; G.add(b);
    if(ink){ try{ const L=new THREE.LineSegments(new THREE.EdgesGeometry(pg,28),INK); L.renderOrder=4; G.add(L); }catch(e){} } }
  return first; }
const setBid=(g,id)=>{ g.setAttribute('bid',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(id),1)); return g; };
const GX0=B?B.x0:-110, GZ0=B?B.z0:-150, GW=B?B.w:220, GH=B?B.h:300; // 장면 범위(단위) — 지역마다 다름
const KA=Math.min(B&&B.ka||4,GW*GH/66000); // 소품·바닥 무늬 양: 명동 넓이 기준

/* ---------- 건물 데이터 ---------- */
function inPoly(x,z,p){ let c=false; for(let i=0,j=p.length-1;i<p.length;j=i++){ const [xi,zi]=p[i],[xj,zj]=p[j]; if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi)) c=!c; } return c; }
// 길 넓히기: 길에 닿은 벽만 안쪽으로 당긴다(붙어 있는 이웃 건물과 맞닿은 벽은 그대로 → 블록은 붙은 채 길만 넓어짐)
const WIDTHS=[{k:'실제',d:0},{k:'넓게',d:1.1},{k:'더 넓게',d:2.0}];
function polyArea(p){ let a=0; for(let i=0,j=p.length-1;i<p.length;j=i++) a+=(p[j][0]*p[i][1]-p[i][0]*p[j][1]); return a/2; }
/* ---------- v2.51 랜드마크: 자리·막힘 ---------- */
const LMK=(LMKS[KEY]||[]).map(d=>({...d,c:Math.cos(d.ry||0),s:Math.sin(d.ry||0),gr:12+Math.max(6,...d.cut.map(r=>Math.hypot(r[2],r[3])/2))}));
/* v2.53 (기획자 11-19 00:20 ②): 랜드마크 이름 가게 — 랜드마크 가까운 가게 몇 곳은 「성당앞 분식」처럼. 사람 이름 없음 */
const LPRE={church:'성당앞',cable:KEY==='myeong'?'케이블카':'',rail:'숲길',stage:'거리',play:'놀이터',brick:'벽돌창고',bridge:'다리 밑',deer:'숲 옆',gate:'광화문',tower:'남산 아래',palgak:'팔각정'};
const LWORD={food:['분식','국밥','돈가스','칼국수','떡집','김밥'],cafe:['커피','빵집'],bar:['포차','호프'],conv:['마트'],cloth:['옷가게'],cos:['화장품'],shop:['기념품'],pharm:['약국'],bank:['은행'],tool:['철물점'],hair:['미용실']};
{ const used=new Set(); for(const d of LMK){ const pre=LPRE[d.id]; if(!pre) continue; const near=SHOPS.filter(s=>!used.has(s)&&Math.hypot(s.x-d.x,s.z-d.z)<55).sort((a,b)=>Math.hypot(a.x-d.x,a.z-d.z)-Math.hypot(b.x-d.x,b.z-d.z)).slice(0,3);
  near.forEach((s,i)=>{ const W=LWORD[s.c]||['가게']; s.name=pre+' '+W[(i+(d.x&7))%W.length]; s.gen=true; s.lmk=d.id; used.add(s); }); } }
const lmkL=(d,px,pz)=>{ const dx=px-d.x, dz=pz-d.z; return [dx*d.c-dz*d.s, dx*d.s+dz*d.c]; };
const lmkW=(d,lx,lz)=>[d.x+lx*d.c+lz*d.s, d.z-lx*d.s+lz*d.c];
const lmkIn=(d,R,px,pz,pad=0)=>{ const [lx,lz]=lmkL(d,px,pz); return Math.abs(lx-R[0])<=R[2]/2+pad&&Math.abs(lz-R[1])<=R[3]/2+pad; };
const segD=(px,pz,a,b)=>{ const vx=b[0]-a[0], vz=b[1]-a[1], L2=vx*vx+vz*vz||1; let t=((px-a[0])*vx+(pz-a[1])*vz)/L2; t=Math.max(0,Math.min(1,t)); return Math.hypot(px-a[0]-vx*t,pz-a[1]-vz*t); };
const lmkSegHit=(d,px,pz,w)=>{ if(!d.seg) return false; for(const L of d.seg) for(let i=0;i+1<L.length;i++) if(segD(px,pz,L[i],L[i+1])<w) return true; return false; };
if(LMK.length){ const keep=[];
  BLD_RAW.forEach(([lv,p],i)=>{ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const [x,z] of p){ x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z); }
    let nin=0,nhit=0; const st=Math.max(.4,Math.min(1,(x1-x0)/6,(z1-z0)/6));
    for(let x=x0+st/2;x<x1;x+=st) for(let z=z0+st/2;z<z1;z+=st){ if(!inPoly(x,z,p)) continue; nin++; if(LMK.some(d=>d.cut.some(R=>lmkIn(d,R,x,z))||lmkSegHit(d,x,z,1.6))) nhit++; }
    if(!(nin&&nhit/nin>.2)) keep.push(i); });
  if(keep.length<BLD_RAW.length){ if(BT) BT=keep.map(i=>BT[i]); BLD_RAW=keep.map(i=>BLD_RAW[i]); } }
const RAWB=BLD_RAW.map(([lv,pts])=>{ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const [x,z] of pts){ x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z); } return {pts,x0,x1,z0,z1}; });
function inOther(x,z,self){ for(const o of RAWB){ if(o===self||x<o.x0||x>o.x1||z<o.z0||z>o.z1) continue; if(inPoly(x,z,o.pts)) return true; } return false; }
function insetPoly(B,d){ const p=B.pts, n=p.length; if(!d) return p;
  const E=p.map((a,i)=>{ const c=p[(i+1)%n], dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz)||1; let nx=dz/L, nz=-dx/L; const mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2; if(inPoly(mx+nx*.15,mz+nz*.15,p)){ nx=-nx; nz=-nz; }
    let sh=0; for(const t of [.2,.5,.8]) if(inOther(a[0]+dx*t+nx*.7,a[1]+dz*t+nz*.7,B)) sh++; return {a,dx,dz,nx,nz,off:(sh>=2||L<.5)?0:d}; });
  const out=p.map((v,i)=>{ const e1=E[(i-1+n)%n], e2=E[i]; const p1=[e1.a[0]-e1.nx*e1.off,e1.a[1]-e1.nz*e1.off], p2=[e2.a[0]-e2.nx*e2.off,e2.a[1]-e2.nz*e2.off];
    const cr=e1.dx*e2.dz-e1.dz*e2.dx; let q;
    if(Math.abs(cr)<1e-6*Math.hypot(e1.dx,e1.dz)*Math.hypot(e2.dx,e2.dz)+1e-9) q=[v[0]-(e1.nx*e1.off+e2.nx*e2.off)/2,v[1]-(e1.nz*e1.off+e2.nz*e2.off)/2];
    else { const t=((p2[0]-p1[0])*e2.dz-(p2[1]-p1[1])*e2.dx)/cr; q=[p1[0]+e1.dx*t,p1[1]+e1.dz*t]; }
    if(Math.hypot(q[0]-v[0],q[1]-v[1])>d*2.5) q=[v[0]-(e1.nx*e1.off+e2.nx*e2.off)/2,v[1]-(e1.nz*e1.off+e2.nz*e2.off)/2];
    return q; });
  const A0=polyArea(p), A1=polyArea(out); if(Math.sign(A0)!==Math.sign(A1)||Math.abs(A1)<Math.abs(A0)*.35) return d>.5?insetPoly(B,d/2):p; return out; }
const BLD=BLD_RAW.map(([lv,_p],i)=>{ const pts=insetPoly(RAWB[i],WIDTHS[1].d); let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const [x,z] of pts){ x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z); }
 dseed=i*97+13; rnd2(); const L=lv||(2+Math.floor(rnd2()*4)); const t=BT?BT[i]||0:0; return {lv:L,pts,x0,x1,z0,z1,H:t===2?2.3:t===1?2.9+rnd2()*.5:3.6+Math.min(L,8)*.36+rnd2()*.4,i,t}; });
// 막힘 격자(0.5단위): 0 길 · 1 건물 · 2 소품
const CS=.5, CW=GW/CS, CH=GH/CS, SOLID=new Uint8Array(CW*CH), BIDG=new Int16Array(CW*CH).fill(-1);
const cell=(x,z)=>{ const i=Math.floor((x-GX0)/CS), j=Math.floor((z-GZ0)/CS); return (i<0||j<0||i>=CW||j>=CH)?-1:j*CW+i; };
for(const b of BLD) for(let x=Math.floor(b.x0);x<=b.x1;x+=CS) for(let z=Math.floor(b.z0);z<=b.z1;z+=CS){ if(inPoly(x+CS/2,z+CS/2,b.pts)){ const k=cell(x+CS/2,z+CS/2); if(k>=0){ SOLID[k]=1; BIDG[k]=b.i; } } }
if(WATER) for(const wp of WATER){ let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9; for(const [x,z] of wp){ a0=Math.min(a0,x);a1=Math.max(a1,x);b0=Math.min(b0,z);b1=Math.max(b1,z); } for(let x=a0;x<=a1;x+=CS) for(let z=b0;z<=b1;z+=CS) if(inPoly(x+CS/2,z+CS/2,wp)){ const k=cell(x+CS/2,z+CS/2); if(k>=0&&!SOLID[k]) SOLID[k]=3; } }
// v2.51 랜드마크 막힘: 노점 거리는 실제 길 방향을 재서 수레를 한 줄로
for(const d of LMK){ if(d.k!=='carts') continue; const free=(x,z)=>{ const k=cell(x,z); return k>=0&&!SOLID[k]; };
  let best=null; for(let a=0;a<Math.PI;a+=Math.PI/36){ const ux=Math.cos(a), uz=Math.sin(a), px=-uz, pz=ux; const run=sg=>{ let t=0; for(;t<26;t+=.5){ const x=d.x+ux*t*sg, z=d.z+uz*t*sg; if(!free(x,z)||!free(x+px*2.4,z+pz*2.4)||!free(x-px*2.4,z-pz*2.4)) break; } return t; };
    const r1=run(1), r2=run(-1); if(!best||r1+r2>best.L) best={a,ux,uz,px,pz,r1,r2,L:r1+r2}; }
  d.carts=[]; d.strings=[]; if(best){ const {ux,uz,px,pz}=best; let n=0; for(let t=-best.r2+2;t<=best.r1-2;t+=3.6,n++){ const x=d.x+ux*t, z=d.z+uz*t; d.carts.push([x,z,-best.a]);
      if(n%2===0){ const hw=sg=>{ let w=0; for(;w<9;w+=.5) if(!free(x+px*w*sg,z+pz*w*sg)) break; return w; }; const w1=hw(1), w2=hw(-1); d.strings.push([x+px*w1,z+pz*w1,x-px*w2,z-pz*w2]); } } } }
{ const mark=(x,z)=>{ const k=cell(x,z); if(k>=0&&!SOLID[k]) SOLID[k]=2; };
  for(const d of LMK){ let R=4; for(const r of d.fp) R=Math.max(R,Math.hypot(Math.abs(r[0])+r[2]/2,Math.abs(r[1])+r[3]/2));
    if(d.fp.length) for(let x=d.x-R;x<=d.x+R;x+=CS) for(let z=d.z-R;z<=d.z+R;z+=CS) if(d.fp.some(r=>lmkIn(d,r,x,z))) mark(x,z);
    if(d.seg) for(const L of d.seg) for(let i=0;i+1<L.length;i++){ const a=L[i], b=L[i+1], Ls=Math.hypot(b[0]-a[0],b[1]-a[1]); for(let t=0;t<=Ls;t+=CS*.8){ const x=a[0]+(b[0]-a[0])*t/Ls, z=a[1]+(b[1]-a[1])*t/Ls; for(let u=-1;u<=1;u+=CS) for(let v=-1;v<=1;v+=CS) mark(x+u,z+v); } }
    if(d.carts) for(const [x,z] of d.carts) for(let u=-1.4;u<=1.4;u+=CS) for(let v=-1.4;v<=1.4;v+=CS) if(Math.hypot(u,v)<=1.4) mark(x+u,z+v);} }
function blocked(x,z){ const k=cell(x,z); return k<0||SOLID[k]>0; }
// 건물까지 거리(단위) — 소품 자리 고르기용
const DIST=new Float32Array(CW*CH).fill(99);
{ const q=[]; for(let k=0;k<CW*CH;k++) if(SOLID[k]){ DIST[k]=0; q.push(k); }
  for(let h=0;h<q.length;h++){ const k=q[h], i=k%CW, j=(k/CW)|0, d=DIST[k]+CS; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a=i+di,b=j+dj; if(a<0||b<0||a>=CW||b>=CH) continue; const n=b*CW+a; if(DIST[n]>d){ DIST[n]=d; q.push(n); } } } }
const distAt=(x,z)=>{ const k=cell(x,z); return k<0?0:DIST[k]; };

/* ---------- 벽 조각 ---------- */
const WALLS=[];
for(const b of BLD){ const p=b.pts, n=p.length;
  for(let i=0;i<n;i++){ let a=p[i], c=p[(i+1)%n]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<.3) continue;
    let nx=dz/L, nz=-dx/L; const mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2; if(inPoly(mx+nx*.15,mz+nz*.15,p)){ nx=-nx; nz=-nz; }
    const rx=nz, rz=-nx; if((c[0]-a[0])*rx+(c[1]-a[1])*rz<0){ const t=a; a=c; c=t; }
    WALLS.push({b,a,c,L,nx,nz,vis:nz>-.15&&L>=1.2,shops:[]}); } }
for(const s of SHOPS){ let best=null,bd=7;
  for(const w of WALLS){ if(!w.vis) continue; const ax=w.c[0]-w.a[0], az=w.c[1]-w.a[1]; let t=((s.x-w.a[0])*ax+(s.z-w.a[1])*az)/(w.L*w.L); t=Math.max(0,Math.min(1,t));
    const px=w.a[0]+ax*t, pz=w.a[1]+az*t, d=Math.hypot(s.x-px,s.z-pz)-(w.nz>.5?.6:0); if(d<bd){ bd=d; best={w,t}; } }
  if(best) best.w.shops.push({s,t:best.t}); }
const SW=4.2;
for(const w of WALLS){ w.shops.sort((p,q)=>p.t-q.t); const out=[]; let edge=.2;
  for(const it of w.shops){ let u=it.t*w.L-SW/2; u=Math.max(u,edge); if(u+SW>w.L-.2) continue; out.push({s:it.s,u}); edge=u+SW+.3; } w.fronts=out; }

/* 도트 그림 조각 */
const ICON={ bowl:['.......','.......','#######','.#####.','..###..','.......','.......'], cup:['.......','.####..','.#####.','.####.#','.####..','..##...','.......'],
 shirt:['.#...#.','##.#.##','.#####.','.#####.','.#####.','.#####.','.......'], bottle:['..##...','..##...','.####..','.####..','.####..','.####..','.......'],
 box:['.......','.#####.','.#.#.#.','.#####.','.#.#.#.','.#####.','.......'], cross:['..###..','..###..','#######','#######','..###..','..###..','.......'],
 coin:['..###..','.#####.','##.#.##','##.#.##','.#####.','..###..','.......'], key:['.##....','#..#...','.##.###','....#.#','.......','.......','.......']};
function icon(x,ic,X,Y,col){ x.fillStyle=col; (ICON[ic]||ICON[{bag:'box',glass:'bowl',scis:'bottle'}[ic]]||ICON.box).forEach((r,j)=>{ for(let i=0;i<7;i++) if(r[i]==='#') x.fillRect(X+i,Y+j,1,1); }); }
const tmp=mk(256,32), tx=tmp.getContext('2d');
function pixText(x,str,X,Y,maxW,col,size=11){
  let s=size; tx.font=`bold ${s}px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif`; while(tx.measureText(str).width>maxW&&s>8){ s--; tx.font=`bold ${s}px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif`; }
  let tw=Math.ceil(tx.measureText(str).width); while(tw>maxW&&str.length>1){ str=str.slice(0,-1); tw=Math.ceil(tx.measureText(str+'…').width); if(tw<=maxW){ str+='…'; break; } }
  tx.clearRect(0,0,256,32); tx.fillStyle='#fff'; tx.textBaseline='middle'; tx.fillText(str,0,16); const W=Math.min(256,tw+1), d=tx.getImageData(0,0,W,32).data;
  x.fillStyle=col; for(let j=0;j<32;j++) for(let i=0;i<W;i++) if(d[(j*W+i)*4+3]>110) x.fillRect(X+Math.round((maxW-tw)/2)+i,Y+j-16,1,1); }
const WALLC=['#d8cfc0','#c9c4bd','#cdb9a6','#bcc4cc','#d4c8b4','#c2b2a8','#b8bcb0','#c8b8a0','#a9b4b8'];
function wallBase(b){ dseed=b.i*31+5; rnd2(); return WALLC[Math.floor(rnd2()*WALLC.length)]; }
function drawWall(x,X,Y,w,hpx){ const W=Math.ceil(w.L*PPU); const b=w.b, base=wallBase(b); dseed=b.i*131+Math.round(w.a[0]*7+w.a[1]*3)+9;
  if(b.t===2){ // 궁궐 담장: 아래 돌·위 회벽
    x.fillStyle='#d8ccb4'; x.fillRect(X,Y,W,hpx); x.fillStyle='#8a8278'; x.fillRect(X,Y+Math.round(hpx*.55),W,hpx-Math.round(hpx*.55));
    x.fillStyle='rgba(0,0,0,.18)'; for(let u=X;u<X+W;u+=7) for(let v=Y+Math.round(hpx*.55);v<Y+hpx;v+=5) x.fillRect(u+((v>>2)%2)*3,v,1,5); x.fillStyle='rgba(0,0,0,.25)'; x.fillRect(X,Y,W,2); return; }
  if(b.t===1){ // 궁궐 전각: 회벽 + 붉은 기둥 + 살창
    x.fillStyle='#e6dcc4'; x.fillRect(X,Y,W,hpx); x.fillStyle='#3e6a5a'; x.fillRect(X,Y,W,4); x.fillStyle='#c9a64a'; x.fillRect(X,Y+4,W,1);
    const n=Math.max(1,Math.round(W/26)), sp=W/n;
    for(let k=0;k<=n;k++){ const px=X+Math.round(k*sp); x.fillStyle='#8a2e22'; x.fillRect(Math.min(px,X+W-4),Y+5,4,hpx-5); }
    for(let k=0;k<n;k++){ const px=X+Math.round(k*sp)+6, ww=Math.round(sp)-12; if(ww<6) continue; x.fillStyle='#6a3a2a'; x.fillRect(px,Y+12,ww,hpx-16); x.fillStyle='#c8b48a'; for(let u=px+2;u<px+ww-1;u+=4) x.fillRect(u,Y+13,1,hpx-18); for(let v=Y+15;v<Y+hpx-4;v+=4) x.fillRect(px+1,v,ww-2,1); }
    x.fillStyle='#9a9288'; x.fillRect(X,Y+hpx-3,W,3); return; }
  x.fillStyle=base; x.fillRect(X,Y,W,hpx); x.fillStyle='rgba(0,0,0,.06)'; for(let i=0;i<W*hpx/40;i++) x.fillRect(X+Math.floor(rnd2()*W),Y+Math.floor(rnd2()*hpx),1,1);
  // 층 띠 · 빗물 자국
  x.fillStyle='rgba(0,0,0,.28)'; x.fillRect(X,Y,W,2); x.fillStyle='rgba(255,255,255,.25)'; x.fillRect(X,Y+2,W,1);
  const gf=Math.round(3.3*PPU), gy=Y+hpx-gf;
  const winT=Math.floor(rnd2()*3); // 창 모양: 0 낱창 · 1 띠창 · 2 큰 유리
  for(let fy=Y+5, fl=0; fy+12<gy-1; fy+=16, fl++){
    x.fillStyle='rgba(0,0,0,.08)'; x.fillRect(X,fy+13,W,1);
    if(winT===1){ x.fillStyle='#4e5c6a'; x.fillRect(X+3,fy,W-6,10); x.fillStyle='#8aa0b4'; x.fillRect(X+4,fy+1,W-8,8); x.fillStyle='#4e5c6a'; for(let k=X+14;k<X+W-6;k+=11) x.fillRect(k,fy+1,1,8); x.fillStyle='#c8d8e4'; for(let k=X+6;k<X+W-6;k+=22) x.fillRect(k,fy+1,3,2); continue; }
    for(let wx=X+4; wx+8<X+W-3; wx+=(winT===2?17:13)){ const ww=winT===2?13:8; x.fillStyle='#5a6a7a'; x.fillRect(wx,fy,ww,10); x.fillStyle=rnd2()<.15?'#6a7480':'#8aa0b4'; x.fillRect(wx+1,fy+1,ww-2,8); x.fillStyle='#c8d8e4'; x.fillRect(wx+1,fy+1,2,3); x.fillStyle='rgba(0,0,0,.25)'; x.fillRect(wx,fy+10,ww,1);
      if(winT===0&&rnd2()<.12){ x.fillStyle='#7a7e84'; x.fillRect(wx-1,fy+11,ww+2,2); } } }
  // 빗물 자국
  x.fillStyle='rgba(60,50,40,.07)'; for(let k=0;k<W/14;k++){ const sx=X+Math.floor(rnd2()*W); x.fillRect(sx,Y+3,1+Math.floor(rnd2()*2),Math.floor(rnd2()*(hpx-gf))); }
  x.fillStyle='rgba(0,0,0,.18)'; x.fillRect(X,gy-1,W,1);
  if(!w.fronts||!w.fronts.length){
    for(let u=X+3; u+20<X+W-2; u+=26){ if(rnd2()<.5){ x.fillStyle='#8f949a'; x.fillRect(u,gy+10,20,gf-10); x.fillStyle='#a7acb2'; for(let k=gy+11;k<gy+gf;k+=3) x.fillRect(u,k,20,1); x.fillStyle='#5a5e64'; x.fillRect(u,gy+9,20,2); } }
    x.fillStyle='rgba(0,0,0,.12)'; x.fillRect(X,Y+hpx-2,W,2); return; }
  for(const f of w.fronts){ const C=CAT[f.s.c], fx=X+Math.round(f.u*PPU), fw=Math.round(SW*PPU);
    x.fillStyle='rgba(0,0,0,.10)'; x.fillRect(fx-1,gy+1,fw+2,20); // 간판·차양 자리(입체 간판이 붙는다)
    const wy=gy+21, wh=gf-21; x.fillStyle='#3a4450'; x.fillRect(fx,wy,fw,wh); x.fillStyle='#9fc0d4'; x.fillRect(fx+1,wy+1,fw-14,wh-2);
    x.fillStyle='#d8ecf4'; for(let i=0;i<5;i++) x.fillRect(fx+3+i,wy+wh-4-i,1,1); for(let i=0;i<3;i++) x.fillRect(fx+8+i,wy+wh-4-i,1,1);
    icon(x,C.ic,fx+Math.round((fw-14)/2)-3,wy+Math.round(wh/2)-4,C.sg);
    x.fillStyle='#2a2430'; x.fillRect(fx+fw-12,wy,12,wh); x.fillStyle='#6a5a4a'; x.fillRect(fx+fw-11,wy+1,10,wh-1); x.fillStyle='#9fc0d4'; x.fillRect(fx+fw-9,wy+3,6,wh-8); x.fillStyle='#f4b740'; x.fillRect(fx+fw-10,wy+Math.round(wh/2),1,2);
  } }
// v2.9.2: 벽 그림 판이 모자라면(넓은 지역) 판을 하나 더 쓴다 — 수원은 한 판에 다 안 들어가 벽 614개가 민무늬·간판 없음이었음
const AW=4096; let NEED=0; for(const w of WALLS) if(w.vis) NEED+=(Math.ceil(w.L*PPU)+1)*Math.ceil(w.b.H*PPU);
const PAGES=[]; function newPage(){ const left=NEED*1.18-PAGES.reduce((a,p)=>a+p.cap,0); let AH=2048; if(PAGES.length) while(AH>256&&AW*AH/2>=left) AH/=2;
  const c=mk(AW,AH), x=c.getContext('2d'); x.imageSmoothingEnabled=false; const P={c,x,AH,cap:AW*AH,shX:0,shY:0,shH:0,pos:[],uv:[],col:[],bid:[]}; PAGES.push(P); return P; }
let PG=newPage(), over=0; const hidPos=[],hidCol=[],hidBid=[];
for(const w of WALLS){ const H=w.b.H, hpx=Math.ceil(H*PPU);
  const quad=(arrP,arrC,arrB)=>{ const A=[w.a[0],0,w.a[1]],B=[w.c[0],0,w.c[1]],C=[w.c[0],H,w.c[1]],D=[w.a[0],H,w.a[1]]; for(const v of [A,B,C,A,C,D]) arrP.push(...v); for(let i=0;i<6;i++){ arrC.push(1,1,1,1); arrB.push(w.b.i); } };
  if(!w.vis){ quad(hidPos,hidCol,hidBid); continue; }
  const W=Math.ceil(w.L*PPU); if(PG.shX+W>AW){ PG.shX=0; PG.shY+=PG.shH+1; PG.shH=0; }
  if(PG.shY+hpx>PG.AH){ if(PAGES.length<3){ PG=newPage(); } if(PG.shY+hpx>PG.AH){ over++; w.vis=false; w.fronts=[]; quad(hidPos,hidCol,hidBid); continue; } }
  drawWall(PG.x,PG.shX,PG.shY,w,hpx); const u0=PG.shX/AW,u1=(PG.shX+W)/AW,v0=1-(PG.shY+hpx)/PG.AH,v1=1-PG.shY/PG.AH;
  quad(PG.pos,PG.col,PG.bid); PG.uv.push(u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1); PG.shX+=W+1; PG.shH=Math.max(PG.shH,hpx); }
const ATLAS_FILL=Math.round((PG.shY+PG.shH)/PG.AH*100);
for(const P of PAGES){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P.pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(P.uv,2)); g.setAttribute('color',new THREE.Float32BufferAttribute(P.col,4)); g.setAttribute('bid',new THREE.Float32BufferAttribute(P.bid,1)); g.computeVertexNormals();
  addFaded(g,new THREE.MeshLambertMaterial({map:ctex(P.c),vertexColors:true,side:THREE.DoubleSide}),true,true); }
{ const h=new THREE.BufferGeometry(); h.setAttribute('position',new THREE.Float32BufferAttribute(hidPos,3)); h.setAttribute('color',new THREE.Float32BufferAttribute(hidCol,4)); h.setAttribute('bid',new THREE.Float32BufferAttribute(hidBid,1)); h.computeVertexNormals();
  addFaded(h,new THREE.MeshLambertMaterial({color:0xb4aa9c,vertexColors:true,side:THREE.DoubleSide})); }

/* ---------- 바닥 ---------- */
{ const c=mk(48,48), x=c.getContext('2d'); x.fillStyle=PAL?'#c2b496':MNT?'#7d7a5a':'#a8a194'; x.fillRect(0,0,48,48);
  const cols=PAL?['#c8ba9c','#bcae90','#c6b898','#b4a688']:MNT?['#86825e','#767452','#807c58','#6e6c4c']:['#b6afa2','#a39c90','#afa89b','#9c9589'];
  for(let r=0;r<4;r++) for(let k=0;k<3;k++){ const ox=(r%2)*8; x.fillStyle=cols[(r*3+k)%4]; x.fillRect((k*16+ox)%48,r*12,15,11); if((k*16+ox)%48>33){ x.fillRect(0,r*12,((k*16+ox)%48+15)-48,11); } }
  x.fillStyle='rgba(60,50,40,.25)'; for(let i=0;i<40;i++) x.fillRect(Math.floor(rnd2()*48),Math.floor(rnd2()*48),1,1);
  const t=ctex(c,true); t.repeat.set(GW/3,GH/3);
  const g=new THREE.Mesh(new THREE.PlaneGeometry(GW,GH),new THREE.MeshLambertMaterial({map:t})); g.rotation.x=-Math.PI/2; g.receiveShadow=true; G.add(g); }
// v2.48 연못(경회루): 어두운 물 + 물가 돌
if(WATER&&WATER.length){ for(const wp of WATER){ const sh=new THREE.Shape(wp.map(([x,z])=>new THREE.Vector2(x,-z))); const g=new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI/2); g.translate(0,.05,0);
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x2a3e48,emissive:0x0a1418})); m.receiveShadow=true; m.renderOrder=1; G.add(m);
  const n=wp.length; for(let i=0;i<n;i++){ const a=wp[i], c=wp[(i+1)%n], L=Math.hypot(c[0]-a[0],c[1]-a[1]); const e=new THREE.Mesh(new THREE.BoxGeometry(L+.6,.35,.6),new THREE.MeshLambertMaterial({color:0x8a8478})); e.position.set((a[0]+c[0])/2,.17,(a[1]+c[1])/2); e.rotation.y=-Math.atan2(c[1]-a[1],c[0]-a[0]); e.receiveShadow=e.castShadow=true; G.add(e); } } }
// 벽 밑 그늘(바닥에 붙은 어둠) — 입체감
{ const pos=[],col=[]; const Wd=.9;
  for(const w of WALLS){ const ax_=w.a[0],az=w.a[1],cx=w.c[0],cz=w.c[1],ox=w.nx*Wd,oz=w.nz*Wd, y=.03;
    const P=[[ax_,y,az],[cx,y,cz],[cx+ox,y,cz+oz],[ax_+ox,y,az+oz]], A=[.34,.34,0,0];
    for(const i of [0,1,2,0,2,3]){ pos.push(...P[i]); col.push(.12,.09,.07,A[i]); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false})); m.renderOrder=1; G.add(m); }

/* ---------- 지붕 + 옥상 소품 ---------- */
const GBox=(w,h,d,col,x,y,z,ry=0)=>{ const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(); g.rotateY(ry); g.translate(x,y,z); return paint(g,col); };
const GCyl=(r,h,col,x,y,z,seg=8)=>{ const g=new THREE.CylinderGeometry(r,r,h,seg).toNonIndexed(); g.translate(x,y,z); return paint(g,col); };
const GBlob=(r,col,x,y,z,sy=1)=>{ const g=new THREE.IcosahedronGeometry(r,0); g.scale(1,sy,1); g.translate(x,y,z); return paint(g,col); };
const GCone=(r,h,col,x,y,z)=>{ const g=new THREE.ConeGeometry(r,h,8).toNonIndexed(); g.translate(x,y,z); return paint(g,col); };
function paint(g,col){ const c=new THREE.Color(col), n=g.attributes.position.count, a=new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b; } g.setAttribute('color',new THREE.BufferAttribute(a,3)); if(g.attributes.uv) g.deleteAttribute('uv'); return g; }
const ROOFC=['#6a8e72','#8c867e','#7a9a80','#807a72','#948a7c','#a09484','#638a70','#877868','#9a9288','#7c7470'];
const planarUV=g=>{ const P=g.attributes.position, a=new Float32Array(P.count*2); for(let i=0;i<P.count;i++){ a[i*2]=P.getX(i)*.15; a[i*2+1]=P.getZ(i)*.15+P.getY(i)*.15; } g.setAttribute('uv',new THREE.BufferAttribute(a,2)); return g; };
const roofTex=(()=>{ const c=mk(32,32), x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,32,32); dseed=77; for(let i=0;i<70;i++){ const v=200+Math.floor(rnd2()*55); x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(Math.floor(rnd2()*32),Math.floor(rnd2()*32),1+Math.floor(rnd2()*2),1); } x.fillStyle='rgba(0,0,0,.10)'; for(let i=0;i<5;i++) x.fillRect(Math.floor(rnd2()*28),Math.floor(rnd2()*28),3+Math.floor(rnd2()*5),2+Math.floor(rnd2()*4)); return ctex(c,true); })();
const RP=[];
for(const b of BLD){ dseed=b.i*53+7; rnd2(); const parts=[], H=b.H, rc=ROOFC[Math.floor(rnd2()*ROOFC.length)];
  if(b.t){ // v2.48 궁궐: 전각 = 기와 우진각 지붕(처마가 나옴) · 담장 = 기와 갓
    const n=b.pts.length; let cx=0,cz=0; for(const [x,z] of b.pts){ cx+=x; cz+=z; } cx/=n; cz/=n;
    const ext=Math.min(b.x1-b.x0,b.z1-b.z0), ov=b.t===2?.45:.9, rh=b.t===2?.5:Math.min(3.2,.25+ext*.32), col=b.t===2?'#55595f':'#474b53';
    const E=b.pts.map(([x,z])=>{ const dx=x-cx, dz=z-cz, L=Math.hypot(dx,dz)||1; return [x+dx/L*ov,z+dz/L*ov]; });
    const pos=[]; for(let i=0;i<n;i++){ const a=E[i], c=E[(i+1)%n]; pos.push(a[0],H-.15,a[1], cx,H+rh,cz, c[0],H-.15,c[1]); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); const g2=g.clone(); const P2=g2.attributes.position; for(let i=0;i<P2.count;i+=3){ const ax=P2.getX(i),ay=P2.getY(i),az=P2.getZ(i); P2.setXYZ(i,P2.getX(i+2),P2.getY(i+2),P2.getZ(i+2)); P2.setXYZ(i+2,ax,ay,az); }
    parts.push(paint(g,col),paint(g2,col));
    parts.forEach((g0,k)=>RP.push(setBid(g0,b.i))); continue; }
  // 옥상 바닥
  const sh=new THREE.Shape(b.pts.map(([x,z])=>new THREE.Vector2(x,-z))); const rg=new THREE.ShapeGeometry(sh).toNonIndexed(); rg.rotateX(-Math.PI/2); rg.translate(0,H,0); parts.push(paint(rg,rc));
  // 난간(가장자리 턱)
  const n=b.pts.length; let cx=0,cz=0; for(const [x,z] of b.pts){ cx+=x; cz+=z; } cx/=n; cz/=n;
  for(let i=0;i<n;i++){ const a=b.pts[i], c=b.pts[(i+1)%n], L=Math.hypot(c[0]-a[0],c[1]-a[1]); if(L<.4) continue; const ang=Math.atan2(c[1]-a[1],c[0]-a[0]);
    parts.push(GBox(L+.2,.55,.22,'#d6cec2',(a[0]+c[0])/2,H+.27,(a[1]+c[1])/2,-ang)); }
  // 소품: 넓이에 따라
  const area=(b.x1-b.x0)*(b.z1-b.z0); const pick=(m)=>{ for(let k=0;k<20;k++){ const x=b.x0+m+rnd2()*Math.max(.1,b.x1-b.x0-2*m), z=b.z0+m+rnd2()*Math.max(.1,b.z1-b.z0-2*m); let ok=inPoly(x,z,b.pts); for(const [ox,oz] of [[m,0],[-m,0],[0,m],[0,-m]]) ok=ok&&inPoly(x+ox,z+oz,b.pts); if(ok) return [x,z]; } return null; };
  const nAC=Math.min(18,Math.floor(area/35)+1);
  for(let k=0;k<nAC;k++){ const p=pick(1); if(!p) break; const ry=rnd2()<.5?0:Math.PI/2; parts.push(GBox(1.0,.75,.6,'#c9ccce',p[0],H+.38,p[1],ry)); parts.push(GCyl(.24,.06,'#4a4e54',p[0]+(ry?0:.18),H+.78,p[1]+(ry?.18:0),8)); }
  for(let k=0,nT=area>60?1+Math.floor(area/400):0;k<Math.min(nT,4);k++){ if(rnd2()>.8) continue; const p=pick(1.8); if(p) parts.push(GCyl(.8,1.5,rnd2()<.5?'#5f8fb4':'#dcdcd4',p[0],H+.75,p[1],10)); }
  for(let k=0;k<Math.min(3,Math.floor(area/500));k++){ const p=pick(1.6); if(p){ parts.push(GBox(2.2,2.3,2.2,wallBase(b),p[0],H+1.15,p[1])); parts.push(GBox(2.4,.15,2.4,'#7a7068',p[0],H+2.35,p[1])); } }
  if(area>45&&rnd2()<.8){ const p=pick(1.6); if(p){ const sc=wallBase(b); parts.push(GBox(2.2,2.3,2.2,sc,p[0],H+1.15,p[1])); parts.push(GBox(2.4,.15,2.4,'#7a7068',p[0],H+2.35,p[1])); dseed=b.i*53+99; } }
  if(rnd2()<.35){ const p=pick(.8); if(p){ parts.push(GBox(.08,2.4,.08,'#555a60',p[0],H+1.2,p[1])); parts.push(GBox(.9,.06,.06,'#555a60',p[0],H+2.1,p[1])); } }
  if(area>80&&rnd2()<.5){ const p=pick(2.2); if(p){ for(let k=-1;k<=1;k++) parts.push(GBox(.9,.08,1.6,'#3c4a5c',p[0]+k*1.05,H+.5,p[1],0)); for(let k=-1;k<=1;k++) parts.push(GBox(.06,.5,.06,'#555',p[0]+k*1.05,H+.25,p[1]+.6)); } } // 태양광판
  if(area>90&&rnd2()<.3){ const p=pick(2); if(p){ parts.push(GBox(3,.06,.06,'#888',p[0],H+1.6,p[1])); parts.push(GBox(.05,1.6,.05,'#777',p[0]-1.5,H+.8,p[1])); parts.push(GBox(.05,1.6,.05,'#777',p[0]+1.5,H+.8,p[1])); } } // 빨랫줄 기둥
  parts.forEach((g,k)=>RP.push(setBid(g,k===0?b.i:b.i+1000))); } // 0번 = 옥상 바닥, 나머지(난간·소품)는 흐릴 때 아예 숨김
{ RP.forEach(planarUV); const g=mergeGeometries(RP); g.computeVertexNormals();
  addFaded(g,new THREE.MeshLambertMaterial({vertexColors:true,map:roofTex}),true,true); }

let SOV=0;
/* 간판: 도트가 아닌 깔끔한 글씨(고해상도 캔버스, 부드러운 필터) */
const NFR=WALLS.reduce((a,w)=>a+(w.vis&&w.fronts?w.fronts.length:0),0), SR=NFR>600?25:32, SFONT='"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
/* v2.50 (기획자 11-18 20:44 1ㄱ): 1·2막 간판에는 글자를 쓰지 않는다 — 업종 그림(그릇·잔·옷·병·가방·십자·엽전·열쇠·가위·술잔)만. 지역마다 판 색이 다르다 */
const SIGN={myeong:{pl:'#1a1020',rim:null,ic:null,glow:1},hongdae:{pl:null,rim:'#9a7aff',ic:'#eaffef',glow:1},seongsu:{pl:'#4a3022',rim:'#8a5a3a',ic:'#f0dcb8'},gyeong:{pl:'#4a2e1a',rim:'#c8a050',ic:'#f4d080'},namsan:{pl:'#1e3028',rim:'#6a9a80',ic:'#e0f0e8'}}[KEY]||{};
function pict(x,cx,cy,s,k){ x.save(); x.translate(cx,cy); x.scale(s/100,s/100); x.lineWidth=9; x.lineCap='round'; x.lineJoin='round'; const st=()=>x.stroke(), fl=()=>x.fill(); x.beginPath();
  if(k==='bowl'){ x.moveTo(-42,0); x.lineTo(42,0); x.arc(0,0,42,0,Math.PI); x.closePath(); fl(); x.beginPath(); for(const d of [-18,0,18]){ x.moveTo(d,-12); x.bezierCurveTo(d-10,-24,d+10,-32,d,-46); } st(); }
  else if(k==='cup'){ x.rect(-30,-14,46,50); fl(); x.beginPath(); x.arc(22,10,13,-Math.PI/2,Math.PI/2); st(); x.beginPath(); for(const d of [-16,2]){ x.moveTo(d,-22); x.bezierCurveTo(d-9,-32,d+9,-38,d,-48); } st(); }
  else if(k==='shirt'){ x.moveTo(-16,-40); x.lineTo(-46,-24); x.lineTo(-34,-2); x.lineTo(-24,-8); x.lineTo(-24,42); x.lineTo(24,42); x.lineTo(24,-8); x.lineTo(34,-2); x.lineTo(46,-24); x.lineTo(16,-40); x.quadraticCurveTo(0,-26,-16,-40); fl(); }
  else if(k==='bottle'){ x.rect(-9,-46,18,16); x.moveTo(-9,-30); x.lineTo(-24,-12); x.lineTo(-24,42); x.lineTo(24,42); x.lineTo(24,-12); x.lineTo(9,-30); fl(); }
  else if(k==='bag'){ x.rect(-34,-12,68,54); fl(); x.beginPath(); x.arc(0,-12,18,Math.PI,0); st(); }
  else if(k==='cross'){ x.rect(-14,-42,28,84); x.rect(-42,-14,84,28); fl(); }
  else if(k==='coin'){ x.arc(0,0,42,0,6.283); x.rect(13,-13,-26,26); x.fill('evenodd'); }
  else if(k==='key'){ x.arc(-22,0,20,0,6.283); st(); x.beginPath(); x.moveTo(-2,0); x.lineTo(44,0); x.moveTo(30,0); x.lineTo(30,14); x.moveTo(42,0); x.lineTo(42,12); st(); }
  else if(k==='scis'){ x.arc(-26,22,12,0,6.283); x.moveTo(38,22); x.arc(26,22,12,0,6.283); st(); x.beginPath(); x.moveTo(-18,12); x.lineTo(30,-42); x.moveTo(18,12); x.lineTo(-30,-42); st(); }
  else if(k==='glass'){ x.moveTo(-28,-34); x.lineTo(28,-34); x.lineTo(20,40); x.lineTo(-20,40); x.closePath(); fl(); x.beginPath(); x.arc(30,4,14,-Math.PI/2,Math.PI/2); st(); }
  else { x.rect(-34,-30,68,60); fl(); }
  x.restore(); }
function board(x,X,Y,W,Hh,C,name){ const b=Math.max(2,Math.round(Hh*.06)), pl=SIGN.pl||C.sg, rim=SIGN.rim||C.col, ic=SIGN.ic||(SIGN.glow?C.col:'#fff8e8');
  x.fillStyle='#2a2430'; x.fillRect(X,Y,W,Hh); x.fillStyle=pl; x.fillRect(X+b,Y+b,W-2*b,Hh-2*b);
  x.strokeStyle=rim; x.lineWidth=Math.max(2,b*.9); x.strokeRect(X+b*1.6,Y+b*1.6,W-b*3.2,Hh-b*3.2);
  x.fillStyle='rgba(255,255,255,.10)'; x.fillRect(X+b,Y+b,W-2*b,Math.round(Hh*.12));
  // v2.53 (기획자 11-19 00:20 ③): 비튼 상호 글자 간판 되살림 — 업종 그림은 글자 왼쪽에 같이
  const nm=String(name||C.k), pw=W>Hh*1.7?Hh*.9:0; if(SIGN.glow){ x.shadowColor=ic; x.shadowBlur=Hh*.22; }
  x.fillStyle=x.strokeStyle=ic; if(pw) pict(x,X+b*2+pw*.5,Y+Hh*.5,Hh*.5,C.ic);
  const tx0=X+b*2+pw, tw=W-b*4-pw; let fs=Math.round(Hh*.56); x.font=`800 ${fs}px ${SFONT}`; let mw=x.measureText(nm).width; if(mw>tw){ fs=Math.max(8,Math.floor(fs*tw/mw)); x.font=`800 ${fs}px ${SFONT}`; }
  x.textAlign='center'; x.textBaseline='middle'; x.fillText(nm,tx0+tw/2,Y+Hh*.53,tw); x.shadowBlur=0; x.textAlign='left'; }
const stex=c=>{ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; };
/* 간판(입체): 벽에 붙은 얇은 상자 + 차양, 벽에서 수직으로 튀어나온 돌출 간판. 글씨는 깔끔하게, 빛·그림자는 건물과 같이 받음 */
{ const SAW=NFR>420?4096:2048,SAH=2048, c=mk(SAW,SAH), x=c.getContext('2d'); x.fillStyle='#2a2430'; x.fillRect(0,0,8,8); x.fillStyle='#55505a'; x.fillRect(8,0,8,8);
  let px=0,py=10,rowH=0; const pos=[],uv=[],sb=[]; const DK=[2/SAW,1-6/SAH], MT=[12/SAW,1-6/SAH];
  const alloc=(W,Hh)=>{ if(px+W>SAW){ px=0; py+=rowH+2; rowH=0; } if(py+Hh>SAH){ SOV++; return null; } const r=[px,py]; px+=W+2; rowH=Math.max(rowH,Hh); return r; };
  const uvr=(X,Y,W,Hh)=>[X/SAW,1-(Y+Hh)/SAH,(X+W)/SAW,1-Y/SAH];
  // 사각형 하나(네 꼭짓점 A B C D, 반시계) + uv 사각형(u0 v0 u1 v1) 또는 한 점 색
  const quad=(A,B,C,D,bi,U)=>{ for(const q of [A,B,C,A,C,D]){ pos.push(...q); sb.push(bi); } if(U.length===4){ const [u0,v0,u1,v1]=U; uv.push(u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1); } else for(let i=0;i<6;i++) uv.push(U[0],U[1]); };
  // 상자: 중심 o, 축 ex(가로)·ey(세로)·ez(두께, 앞쪽), 반길이 hx hy hz, 앞/뒤 면 uv
  const V=(o,ex,ey,ez,a,b,cc)=>[o[0]+ex[0]*a+ey[0]*b+ez[0]*cc,o[1]+ex[1]*a+ey[1]*b+ez[1]*cc,o[2]+ex[2]*a+ey[2]*b+ez[2]*cc];
  function box(o,ex,ey,ez,hx,hy,hz,bi,front,back,side){ const p=(a,b,cc)=>V(o,ex,ey,ez,a*hx,b*hy,cc*hz);
    quad(p(-1,-1,1),p(1,-1,1),p(1,1,1),p(-1,1,1),bi,front); if(back) quad(p(1,-1,-1),p(-1,-1,-1),p(-1,1,-1),p(1,1,-1),bi,back);
    quad(p(1,-1,1),p(1,-1,-1),p(1,1,-1),p(1,1,1),bi,side); quad(p(-1,-1,-1),p(-1,-1,1),p(-1,1,1),p(-1,1,-1),bi,side);
    quad(p(-1,1,1),p(1,1,1),p(1,1,-1),p(-1,1,-1),bi,side); quad(p(-1,-1,-1),p(1,-1,-1),p(1,-1,1),p(-1,-1,1),bi,side); }
  for(const w of WALLS){ if(!w.vis||!w.fronts||!w.fronts.length) continue; const H=w.b.H, hpx=Math.ceil(H*PPU), Wpx=Math.ceil(w.L*PPU), gf=Math.round(3.3*PPU);
    const dx=(w.c[0]-w.a[0])/w.L, dz=(w.c[1]-w.a[1])/w.L, ex=[dx,0,dz], ey=[0,1,0], ez=[w.nx,0,w.nz];
    const yT=H*(1-(hpx-gf+1)/hpx), yB=H*(1-(hpx-gf+16)/hpx), bi=w.b.i;
    for(const f of w.fronts){ const C=CAT[f.s.c], fx=Math.round(f.u*PPU), fw=Math.round(SW*PPU), s0=(fx-1)*w.L/Wpx, s1=(fx+fw+1)*w.L/Wpx;
      const W=Math.round((s1-s0)*SR), Hh=Math.round((yT-yB)*SR), Ah=Math.round(SR*.5); const r=alloc(W,Hh+Ah+2); if(!r) break;
      board(x,r[0],r[1],W,Hh,C,f.s.name);
      for(let i=0;i<W;i+=Math.round(SR*.34)){ x.fillStyle=(Math.round(i/Math.round(SR*.34))%2)?C.col:'#f4efe4'; x.fillRect(r[0]+i,r[1]+Hh+2,Math.round(SR*.34),Ah); } // 차양 줄무늬
      x.fillStyle='rgba(0,0,0,.18)'; x.fillRect(r[0],r[1]+Hh+2+Ah-3,W,3);
      const sm=(s0+s1)/2, o=[w.a[0]+dx*sm+w.nx*.09, (yT+yB)/2, w.a[1]+dz*sm+w.nz*.09];
      box(o,ex,ey,ez,(s1-s0)/2,(yT-yB)/2,.08,bi,uvr(r[0],r[1],W,Hh),null,DK);
      // 차양: 간판 아래에서 비스듬히 튀어나옴
      const a0=[w.a[0]+dx*s0+w.nx*.02,yB-.02,w.a[1]+dz*s0+w.nz*.02], a1=[w.a[0]+dx*s1+w.nx*.02,yB-.02,w.a[1]+dz*s1+w.nz*.02], out=.75, dr=.42;
      const b0=[a0[0]+w.nx*out,a0[1]-dr,a0[2]+w.nz*out], b1=[a1[0]+w.nx*out,a1[1]-dr,a1[2]+w.nz*out];
      quad(b0,b1,a1,a0,bi,uvr(r[0],r[1]+Hh+2,W,Ah));
      const lip=[b0[0],b0[1]-.12,b0[2]], lip1=[b1[0],b1[1]-.12,b1[2]]; quad(lip,lip1,b1,b0,bi,uvr(r[0],r[1]+Hh+2+Ah-3,W,3)); } }
  // 돌출 간판: 옆을 보는 벽(동·서향)에서 벽과 수직으로 나와 카메라 쪽(남)으로 얼굴을 보인다
  const gw=2.6, gh=1.15;
  for(const w of WALLS){ if(!w.vis||!w.fronts||Math.abs(w.nx)<.55) continue; const dx=(w.c[0]-w.a[0])/w.L, dz=(w.c[1]-w.a[1])/w.L, bi=w.b.i;
    for(const f of w.fronts){ const C=CAT[f.s.c], W=Math.round(gw*SR), Hh=Math.round(gh*SR); const r=alloc(W,Hh); if(!r) break; board(x,r[0],r[1],W,Hh,C,f.s.name);
      const k=f.u+SW/2, base=[w.a[0]+dx*k,0,w.a[1]+dz*k], y0=3.55+gh/2, off=.25+gw/2;
      const o=[base[0]+w.nx*off,y0,base[2]+w.nz*off]; let ez=[dx,0,dz]; if(ez[2]<0) ez=[-dx,0,-dz]; // 얼굴은 남쪽(카메라)으로
      let ex=[w.nx,0,w.nz]; if(ex[0]*ez[2]-ex[2]*ez[0]<0) ex=[-ex[0],0,-ex[2]]; // 오른손 좌표 맞추기
      const fr=uvr(r[0],r[1],W,Hh); box(o,ex,[0,1,0],ez,gw/2,gh/2,.07,bi,fr,[fr[2],fr[1],fr[0],fr[3]],DK);
      box([base[0]+w.nx*.13,y0+gh/2+.06,base[2]+w.nz*.13],[w.nx,0,w.nz],[0,1,0],ez,.13+gw/2,.04,.04,bi,MT,MT,MT); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setAttribute('bid',new THREE.Float32BufferAttribute(sb,1)); g.computeVertexNormals();
  addFaded(g,new THREE.MeshLambertMaterial({map:stex(c),side:THREE.DoubleSide})); }

function clear(x,z){ return Math.min(6,distAt(x,z)); }
let START=[0,0];
{ const FR=[]; for(const w of WALLS) for(const f of (w.fronts||[])){ const k=(f.u+SW/2)/w.L; FR.push([w.a[0]+(w.c[0]-w.a[0])*k,w.a[1]+(w.c[1]-w.a[1])*k,w.nz,!f.s.gen?2:.3]); }
  let best=[0,0],bd=-1e9; const [scx,scz]=SC||[0,0], srx=SCR||50, srz=SCR||60; for(let x=scx-srx;x<=scx+srx;x+=1.5) for(let z=scz-srz;z<=scz+srz;z+=1.5){ if(blocked(x,z)) continue; const cl=clear(x,z); if(cl<2.5) continue; let run=0; while(run<16&&!blocked(x,z+run+.5)) run+=.5; if(run<9) continue; let n=0; for(const f of FR){ const d=Math.hypot(f[0]-x,f[1]-z); if(d<14&&f[1]<z+2) n+=f[3]*(1+(f[2]>.5?1:0)); } const sc=n+cl*1.5+run*.8-Math.hypot(x,z)*.05; if(sc>bd){ bd=sc; best=[x,z]; } }
  START=best; }
/* ---------- 거리 소품 ---------- */
const PROPS=[]; // [x,z,r] 부딪힘
for(const d of LMK) for(const R of d.cut){ const [wx,wz]=lmkW(d,R[0],R[1]); PROPS.push([wx,wz,Math.hypot(R[2],R[3])*.42]); } // v2.51 랜드마크 둘레엔 나무·수레·차를 안 놓음
function freeAt(x,z,r){ if(distAt(x,z)<r) return false; if(Math.hypot(x-START[0],z-START[1])<9) return false; for(const p of PROPS) if(Math.hypot(p[0]-x,p[1]-z)<p[2]+r) return false; return true; }
function markSolid(x,z,r){ PROPS.push([x,z,r]); for(let a=x-r;a<=x+r;a+=CS) for(let b=z-r;b<=z+r;b+=CS) if(Math.hypot(a-x,b-z)<=r){ const k=cell(a,b); if(k>=0&&!SOLID[k]) SOLID[k]=2; } }
/* v2.52 랜드마크 안내 표지판 (기획자 11-18 23:24 「엿보기 말고 간판이나 알아볼 수 있는 표지판으로 채워」)
   한국 관광지 안내판처럼 갈색 판 + 흰 그림 + 화살표. 1·2막 규칙대로 글자 없음 — 그림과 화살표만.
   랜드마크마다 필드 안쪽으로 몇 개 · 모닥불마다 대표 랜드마크 쪽 하나(game.js에서 signAt). */
const PICTO={
  church(x){ x.fillRect(-34,-2,40,34); x.beginPath(); x.moveTo(-36,-2); x.lineTo(-14,-20); x.lineTo(8,-2); x.fill(); x.fillRect(12,-14,18,46); x.beginPath(); x.moveTo(10,-14); x.lineTo(21,-50); x.lineTo(32,-14); x.fill(); x.fillRect(19.5,-60,3,12); x.fillRect(15,-56,12,3); x.fillStyle=SBR; for(const k of [-26,-14,-2]) x.fillRect(k-3,6,6,12); x.beginPath(); x.arc(21,2,4,0,7); x.fill(); },
  carts(x){ for(const [k,s] of [[-24,.8],[14,1]]){ x.save(); x.translate(k,6); x.scale(s,s); x.fillRect(-18,-4,36,18); x.beginPath(); x.moveTo(-22,-6); x.lineTo(-16,-26); x.lineTo(16,-26); x.lineTo(22,-6); x.fill(); x.fillStyle=SBR; for(let i=-12;i<16;i+=10) x.fillRect(i,-24,4,16); x.fillStyle='#fff'; x.beginPath(); x.arc(-10,20,6,0,7); x.arc(10,20,6,0,7); x.fill(); x.restore(); } },
  cableLo(x){ PICTO.cableUp(x); }, cableUp(x){ x.lineWidth=3; x.strokeStyle='#fff'; x.beginPath(); x.moveTo(-50,26); x.lineTo(50,-40); x.stroke(); x.fillRect(-3,-16,6,14); x.beginPath(); x.roundRect?x.roundRect(-18,-4,36,30,6):x.rect(-18,-4,36,30); x.fill(); x.fillStyle=SBR; x.fillRect(-12,2,10,10); x.fillRect(2,2,10,10); x.fillStyle='#fff'; x.fillRect(-50,30,22,6); x.fillRect(30,-36,22,6); },
  railpark(x){ x.lineWidth=4; x.strokeStyle='#fff'; x.beginPath(); x.moveTo(-30,40); x.lineTo(-8,-28); x.moveTo(8,40); x.lineTo(2,-28); x.stroke(); x.lineWidth=3; for(let i=0;i<6;i++){ const t=i/6, y=36-t*60; x.beginPath(); x.moveTo(-28+t*22,y); x.lineTo(8-t*7,y); x.stroke(); } x.beginPath(); x.arc(32,-14,16,0,7); x.fill(); x.fillRect(29,-2,6,28); x.beginPath(); x.arc(-38,-22,11,0,7); x.fill(); x.fillRect(-40,-14,4,18); },
  stage(x){ x.fillRect(-44,18,88,10); x.fillRect(-40,28,6,10); x.fillRect(34,28,6,10); x.fillRect(-38,-12,14,30); x.fillStyle=SBR; x.beginPath(); x.arc(-31,-2,4,0,7); x.arc(-31,10,3,0,7); x.fill(); x.fillStyle='#fff'; x.beginPath(); x.ellipse(4,4,8,6,-.4,0,7); x.ellipse(28,-2,8,6,-.4,0,7); x.fill(); x.fillRect(9,-36,4,40); x.fillRect(33,-42,4,40); x.beginPath(); x.moveTo(9,-36); x.lineTo(37,-42); x.lineTo(37,-32); x.lineTo(9,-26); x.fill(); },
  playground(x){ x.fillRect(-36,-30,6,64); x.fillRect(-14,-30,6,64); x.fillRect(-38,-34,32,6); x.beginPath(); x.moveTo(-36,-30); x.lineTo(-22,-46); x.lineTo(-6,-30); x.fill(); x.lineWidth=7; x.strokeStyle='#fff'; x.beginPath(); x.moveTo(-8,-6); x.quadraticCurveTo(20,0,44,32); x.stroke(); x.lineWidth=3; for(let y=-22;y<30;y+=10){ x.beginPath(); x.moveTo(-36,y); x.lineTo(-10,y); x.stroke(); } },
  factory(x){ x.fillRect(-46,0,92,34); x.beginPath(); x.moveTo(-46,0); for(let i=0;i<3;i++){ x.lineTo(-46+i*24,-18); x.lineTo(-46+i*24+24,0); } x.lineTo(46,0); x.fill(); x.fillRect(26,-46,12,46); x.beginPath(); x.arc(36,-54,7,0,7); x.arc(26,-62,9,0,7); x.arc(12,-66,7,0,7); x.fill(); x.fillStyle=SBR; for(let i=-38;i<20;i+=16) x.fillRect(i,10,9,12); },
  bridge(x){ x.fillRect(-52,4,104,6); x.lineWidth=3; x.strokeStyle='#fff'; x.beginPath(); x.moveTo(-50,4); x.quadraticCurveTo(-25,-34,0,4); x.quadraticCurveTo(25,-34,50,4); x.stroke(); for(let i=-44;i<=44;i+=11){ x.beginPath(); x.moveTo(i,4); x.lineTo(i,4-Math.max(0,22*(1-Math.pow(((i%50+50)%50-25)/25,2)))); x.stroke(); } x.fillRect(-28,10,6,18); x.fillRect(22,10,6,18); x.lineWidth=3; for(const y of [32,42]){ x.beginPath(); for(let i=-50;i<=50;i+=4) x.lineTo(i,y+Math.sin(i/6)*2.5); x.stroke(); } },
  deer(x){ x.beginPath(); x.ellipse(0,8,13,17,0,0,7); x.fill(); x.beginPath(); x.ellipse(0,26,8,8,0,0,7); x.fill(); x.beginPath(); x.ellipse(-20,-4,10,5,-.5,0,7); x.ellipse(20,-4,10,5,.5,0,7); x.fill(); x.lineWidth=5; x.strokeStyle='#fff'; x.lineCap='round'; for(const s of [-1,1]){ x.beginPath(); x.moveTo(s*6,-8); x.lineTo(s*16,-34); x.lineTo(s*30,-48); x.moveTo(s*14,-28); x.lineTo(s*30,-30); x.moveTo(s*12,-20); x.lineTo(s*2,-40); x.stroke(); } x.fillStyle=SBR; x.beginPath(); x.arc(-5,6,2.5,0,7); x.arc(5,6,2.5,0,7); x.fill(); },
  gwanghwa(x){ x.fillRect(-46,6,92,30); x.fillStyle=SBR; x.beginPath(); x.moveTo(-12,36); x.lineTo(-12,22); x.arc(0,22,12,Math.PI,0); x.lineTo(12,36); x.fill(); x.fillStyle='#fff'; const roof=(w,y,h)=>{ x.beginPath(); x.moveTo(-w-8,y+2); x.quadraticCurveTo(-w,y-2,-w+6,y-h); x.lineTo(w-6,y-h); x.quadraticCurveTo(w,y-2,w+8,y+2); x.fill(); }; x.fillRect(-30,-14,60,20); roof(40,4,10); roof(30,-14,12); x.fillRect(-20,-30,40,6); roof(26,-28,10); },
  geunjeong(x){ x.fillRect(-48,26,96,8); x.fillRect(-40,18,80,8); x.fillRect(-30,-6,60,24); x.fillStyle=SBR; for(let i=-24;i<26;i+=12) x.fillRect(i,-2,6,20); x.fillStyle='#fff'; const roof=(w,y,h)=>{ x.beginPath(); x.moveTo(-w-10,y+3); x.quadraticCurveTo(-w,y-2,-w+8,y-h); x.lineTo(w-8,y-h); x.quadraticCurveTo(w,y-2,w+10,y+3); x.fill(); }; roof(42,-6,12); x.fillRect(-24,-26,48,8); roof(32,-24,14); },
  gyeonghoe(x){ x.fillStyle='#fff'; const roof=(w,y,h)=>{ x.beginPath(); x.moveTo(-w-10,y+3); x.quadraticCurveTo(-w,y-2,-w+8,y-h); x.lineTo(w-8,y-h); x.quadraticCurveTo(w,y-2,w+10,y+3); x.fill(); }; roof(44,-22,16); x.fillRect(-42,-22,84,5); for(let i=-38;i<=38;i+=12.6) x.fillRect(i-2,-17,4,30); x.fillRect(-46,12,92,5); x.lineWidth=3; x.strokeStyle='#fff'; for(const y of [26,36]){ x.beginPath(); for(let i=-52;i<=52;i+=4) x.lineTo(i,y+Math.sin(i/6)*2.5); x.stroke(); } },
  tower(x){ x.beginPath(); x.moveTo(-26,40); x.lineTo(-8,-6); x.lineTo(8,-6); x.lineTo(26,40); x.fill(); x.fillStyle=SBR; x.beginPath(); x.moveTo(-6,40); x.lineTo(0,10); x.lineTo(6,40); x.fill(); x.fillStyle='#fff'; x.beginPath(); x.ellipse(0,-14,16,9,0,0,7); x.fill(); x.fillRect(-5,-40,10,26); x.fillRect(-2,-64,4,26); },
  palgak(x){ x.beginPath(); x.moveTo(-46,-4); x.quadraticCurveTo(-30,-8,-18,-26); x.lineTo(0,-40); x.lineTo(18,-26); x.quadraticCurveTo(30,-8,46,-4); x.fill(); for(const i of [-30,-12,6,24]) x.fillRect(i,-4,6,32); x.fillRect(-40,28,80,8); },
  bongsu(x){ for(let i=0;i<5;i++){ const cx=-44+i*22; x.beginPath(); x.moveTo(cx-9,34); x.lineTo(cx-6,6); x.lineTo(cx+6,6); x.lineTo(cx+9,34); x.fill(); } x.fillRect(-52,32,104,6); x.beginPath(); x.arc(-44,-6,7,0,7); x.arc(-40,-20,9,0,7); x.arc(-46,-36,8,0,7); x.fill(); }
};
const SBR='#6e3d1e';
const LNAME={church:'명동성당',carts:'노점 거리',cableLo:'남산 케이블카',cableUp:'남산 케이블카',railpark:'경의선 숲길',stage:'걷고싶은거리',playground:'홍대 놀이터',factory:'붉은 벽돌 창고',bridge:'철길 다리',deer:'서울숲',gwanghwa:'광화문',geunjeong:'근정전',gyeonghoe:'경회루',palgak:'팔각정',bongsu:'봉수대'};
const SIGN_MAT=new Map(), SIGN_GEO={}; let SIGN_POST=null;
function signTex(k){ if(SIGN_MAT.has(k)) return SIGN_MAT.get(k); const c=document.createElement('canvas'); c.width=144; c.height=144; const x=c.getContext('2d');
  x.fillStyle=SBR; x.beginPath(); x.roundRect?x.roundRect(2,2,140,140,14):x.rect(2,2,140,140); x.fill(); x.lineWidth=4; x.strokeStyle='#f2ebe0'; x.beginPath(); x.roundRect?x.roundRect(9,9,126,126,9):x.rect(9,9,126,126); x.stroke();
  const nm=LNAME[k]; x.save(); x.translate(72,nm?62:72); if(nm) x.scale(.8,.8); x.fillStyle='#f6f0e6'; x.strokeStyle='#f6f0e6'; PICTO[k](x); x.restore();
  if(nm){ x.fillStyle='#f6f0e6'; let fs=21; x.font=`800 ${fs}px ${SFONT}`; const mw=x.measureText(nm).width; if(mw>118){ fs=Math.floor(fs*118/mw); x.font=`800 ${fs}px ${SFONT}`; } x.textAlign='center'; x.textBaseline='middle'; x.fillText(nm,72,118); } // v2.53 ④ 안내판 이름(남산 탑은 이름 없음)
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; const m=new THREE.MeshBasicMaterial({map:t,color:0xdcd4c8,side:THREE.DoubleSide}); SIGN_MAT.set(k,m); return m; }
let ARROW_MAT=null;
function arrowMat(){ if(ARROW_MAT) return ARROW_MAT; const c=document.createElement('canvas'); c.width=c.height=96; const x=c.getContext('2d');
  x.fillStyle=SBR; x.beginPath(); x.arc(48,48,46,0,7); x.fill(); x.lineWidth=4; x.strokeStyle='#f2ebe0'; x.beginPath(); x.arc(48,48,39,0,7); x.stroke();
  x.fillStyle='#f6f0e6'; x.beginPath(); x.moveTo(78,48); x.lineTo(52,24); x.lineTo(52,38); x.lineTo(20,38); x.lineTo(20,58); x.lineTo(52,58); x.lineTo(52,72); x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; ARROW_MAT=new THREE.MeshBasicMaterial({map:t,color:0xdcd4c8,side:THREE.DoubleSide,transparent:true,alphaTest:.5}); return ARROW_MAT; }
const SIGN_G=new THREE.Group(); G.add(SIGN_G); const SIGNS=[];
// 한 개: 기둥 + 그림판(카메라 쪽으로 약간 눕힘) + 그 아래 동그란 화살표(가리키는 쪽이 화면에서 보이는 방향)
function signAt(x,z,d){ if(!d||!PICTO[d.k]) return null; if(!SIGN_POST){ SIGN_POST=new THREE.MeshLambertMaterial({color:0x5a5650}); SIGN_GEO.post=new THREE.BoxGeometry(.18,4.4,.18); SIGN_GEO.post.translate(0,2.2,0); SIGN_GEO.board=new THREE.PlaneGeometry(2.5,2.5); SIGN_GEO.arrow=new THREE.CircleGeometry(.8,20); }
  const g=new THREE.Group(); g.position.set(x,0,z); const post=new THREE.Mesh(SIGN_GEO.post,SIGN_POST); post.castShadow=true; g.add(post);
  const b=new THREE.Mesh(SIGN_GEO.board,signTex(d.k)); b.position.set(0,4.5,.1); b.rotation.x=-.32; b.castShadow=true; g.add(b);
  const a=new THREE.Mesh(SIGN_GEO.arrow,arrowMat()); a.position.set(0,2.65,.12); a.rotation.x=-.32; a.rotation.z=-Math.atan2(d.z-z,d.x-x); g.add(a);
  SIGN_G.add(g); SIGNS.push({x,z,id:d.id,k:d.k}); return g; }
{ const TG=LMK.filter(d=>PICTO[d.k]); const cx=GX0+GW/2, cz=GZ0+GH/2, PICK=[];
  const okAt=(x,z)=>{ if(blocked(x,z)||!freeAt(x,z,1.1)) return false; for(const q of LMK) for(const R of q.cut) if(lmkIn(q,R,x,z,2)) return false; return true; };
  for(const d of TG){ const base=Math.atan2(cz-d.z,cx-d.x), mine=[]; const cap=d.rep?6:3;
    for(const D of [20,40,64,90]) for(const off of [0,-.5,.5,-1,1]){ if(mine.length>=cap) break; const a=base+off, tx=d.x+Math.cos(a)*D, tz=d.z+Math.sin(a)*D;
      let best=null,bs=-1e9; for(let u=-6;u<=6;u+=1.5) for(let v=-6;v<=6;v+=1.5){ const x=tx+u, z=tz+v; if(!okAt(x,z)) continue; const dd=distAt(x,z), s=-Math.abs(dd-2)-Math.hypot(u,v)*.15; if(s>bs){ bs=s; best=[x,z]; } }
      if(!best||PICK.some(p=>Math.hypot(p[0]-best[0],p[1]-best[1])<22)) continue; PICK.push(best); mine.push(best); signAt(best[0],best[1],d); markSolid(best[0],best[1],.5); } } }
function scatter(n,test,minGap,tries=4000){ const out=[]; for(let t=0;t<tries*KA&&out.length<n;t++){ const x=GX0+10+rnd2()*(GW-20), z=GZ0+10+rnd2()*(GH-20); if(!test(x,z)) continue; if(out.some(p=>Math.hypot(p[0]-x,p[1]-z)<minGap)) continue; out.push([x,z]); } return out; }
const LEAF=[]; // 바닥에 은행잎
const RDPTS=[]; if(ROADS_RAW) for(const t of ROADS_RAW.split(';')){ const g=t.split('|')[3]; if(!g) continue; const P=g.split(' ').map(q=>q.split(',').map(Number)); for(let i=0;i+1<P.length;i++){ const L=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]); for(let d=0;d<=L;d+=2) RDPTS.push([P[i][0]+(P[i+1][0]-P[i][0])*d/(L||1),P[i][1]+(P[i+1][1]-P[i][1])*d/(L||1)]); } }
function nearRoad(x,z){ for(const q of RDPTS) if(Math.abs(q[0]-x)<4.5&&Math.abs(q[1]-z)<4.5) return true; return false; }
/* v2.53 (기획자 11-19 00:20 ①): 도로명 표지판 — 파란 판 + 흰 글씨, 실제 길 이름(사람 이름 들어간 길은 뺌). 지역마다 3~5개
   Claude 판단: 11-19 새벽 Overpass가 막혀 길 이름은 실제 동네 길 이름을 손으로 넣고, 자리는 길(없으면 인도)을 따라 고르게 */
const RNAMES={myeong:['명동길','명동8길','명동10길','명동7길','명동4길'],hongdae:['와우산로','홍익로','어울마당로','잔다리로','와우산로21길'],seongsu:['연무장길','성수이로','아차산로','성수일로','연무장5길'],gyeong:['사직로','효자로'],namsan:['남산공원길','남산공원길','남산공원길']}[KEY]||[];
const RSIGNS=[];
{ const okR=(x,z)=>!blocked(x,z)&&freeAt(x,z,1.0)&&distAt(x,z)>=1.4&&distAt(x,z)<=5&&!LMK.some(q=>q.cut.some(R=>lmkIn(q,R,x,z,3)))&&!SIGNS.some(g=>Math.hypot(g.x-x,g.z-z)<14);
  const C=RDPTS.length?RDPTS.filter(q=>q[0]>GX0+14&&q[0]<GX0+GW-14&&q[1]>GZ0+14&&q[1]<GZ0+GH-14).map(q=>[q[0]+3.2,q[1]+3.2]):[]; if(!C.length) for(let x=GX0+16;x<GX0+GW-16;x+=3) for(let z=(PAL?GZ0+GH-50:GZ0+16);z<GZ0+GH-16;z+=3) C.push([x,z]); // 궁궐은 광화문 앞 바깥 길에만
  let seed=91; const r3=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let t=0;t<4000&&RSIGNS.length<RNAMES.length;t++){ const q=C[Math.floor(r3()*C.length)]; if(!q||!okR(q[0],q[1])) continue; if(RSIGNS.some(o=>Math.hypot(o.x-q[0],o.z-q[1])<48)) continue;
    const nm=RNAMES[RSIGNS.length]; RSIGNS.push({x:q[0],z:q[1],name:nm}); }
  if(RSIGNS.length){ const pm=new THREE.MeshLambertMaterial({color:0x6a7078}), pg=new THREE.BoxGeometry(.12,3.6,.12).translate(0,1.8,0), bg=new THREE.PlaneGeometry(2.6,.9);
    for(const R of RSIGNS){ const c=document.createElement('canvas'); c.width=288; c.height=100; const x=c.getContext('2d');
      x.fillStyle='#1d4f9a'; x.beginPath(); x.roundRect?x.roundRect(2,2,284,96,10):x.rect(2,2,284,96); x.fill(); x.lineWidth=4; x.strokeStyle='#f4f6fa'; x.beginPath(); x.roundRect?x.roundRect(9,9,270,82,7):x.rect(9,9,270,82); x.stroke();
      x.fillStyle='#f4f6fa'; let fs=44; x.font=`800 ${fs}px ${SFONT}`; const mw=x.measureText(R.name).width; if(mw>220){ fs=Math.floor(fs*220/mw); x.font=`800 ${fs}px ${SFONT}`; } x.textAlign='center'; x.textBaseline='middle'; x.fillText(R.name,134,52);
      x.beginPath(); x.moveTo(262,52); x.lineTo(246,40); x.lineTo(246,64); x.closePath(); x.fill();
      const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; const g=new THREE.Group(); g.position.set(R.x,0,R.z);
      const po=new THREE.Mesh(pg,pm); po.castShadow=true; g.add(po); const bd=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({map:t,color:0xd8dce4,side:THREE.DoubleSide})); bd.position.set(0,3.7,.08); bd.rotation.x=-.3; g.add(bd);
      SIGN_G.add(g); markSolid(R.x,R.z,.4); } } }
dseed=4242;
// 은행나무 (노랗게 바랜 11월)
const TREE=MNT?scatter(Math.round(900*KA),(x,z)=>distAt(x,z)>=2.2&&freeAt(x,z,1.0)&&(!ZONE||Math.hypot(x-ZONE[0],z-ZONE[1])>30)&&(!SC||Math.hypot(x-SC[0],z-SC[1])>22)&&!nearRoad(x,z),4.2,60000):PAL?scatter(Math.round(40*KA),(x,z)=>distAt(x,z)>=3&&distAt(x,z)<=10&&freeAt(x,z,1.2),12,15000):scatter(Math.round(110*KA),(x,z)=>distAt(x,z)>=1.5&&distAt(x,z)<=7&&freeAt(x,z,1.0),7,15000).concat(scatter(Math.round(60*KA),(x,z)=>distAt(x,z)>=5&&distAt(x,z)<=14&&freeAt(x,z,1.2),5,15000));
// 노점 수레 (넓은 길 가운데)
const CART=scatter(Math.round((CITY?1:0)*110*KA),(x,z)=>distAt(x,z)>=2.7&&distAt(x,z)<=12&&freeAt(x,z,1.3),4.5,20000);
// 가로등 (벽에서 조금 떨어진 곳)
const LAMP=scatter(Math.round((MNT?.3:PAL?0:1)*80*KA),(x,z)=>distAt(x,z)>=1.6&&distAt(x,z)<=2.4&&freeAt(x,z,.4),9,12000);
// 화분 · 쓰레기봉투 · 라바콘 · 벤치 · 볼라드
const POT=scatter(Math.round((CITY?1:0)*140*KA),(x,z)=>distAt(x,z)>=.9&&distAt(x,z)<=1.4&&freeAt(x,z,.6),5);
const BAG=scatter(Math.round((CITY?1:0)*90*KA),(x,z)=>distAt(x,z)>=.6&&distAt(x,z)<=1.0&&freeAt(x,z,.5),9);
const CONE=scatter(Math.round((CITY?1:0)*40*KA),(x,z)=>distAt(x,z)>=1.5&&distAt(x,z)<=6&&freeAt(x,z,.4),10);
const BENCH=scatter(Math.round((PAL?.3:1)*40*KA),(x,z)=>distAt(x,z)>=2.5&&distAt(x,z)<=9&&freeAt(x,z,1.1),9);
const BOX=scatter(Math.round((CITY?1:0)*110*KA),(x,z)=>distAt(x,z)>=.7&&distAt(x,z)<=1.6&&freeAt(x,z,.5),4,12000); // 가게 앞 상자·입간판
function inst(list,parts,{rot=true,solid=0,scale=[1,1]}={}){ if(!list.length) return; const g=mergeGeometries(parts); g.computeVertexNormals();
  const m=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({vertexColors:true}),list.length); const o=new THREE.Object3D();
  list.forEach(([x,z],i)=>{ o.position.set(x,0,z); o.rotation.y=rot?Math.floor(rnd2()*4)*Math.PI/2+(rnd2()-.5)*.3:0; const s=scale[0]+rnd2()*(scale[1]-scale[0]); o.scale.set(s,s,s); o.updateMatrix(); m.setMatrixAt(i,o.matrix); if(solid) markSolid(x,z,solid*s); });
  m.castShadow=m.receiveShadow=true; G.add(m); return m; }
if(MNT||PAL) inst(TREE,[GCyl(.2,1.4,'#5a4636',0,.7,0,6),GCone(1.5,2.2,'#3e5a3e',0,2.2,0),GCone(1.2,1.8,'#4a6a46',0,3.2,0),GCone(.8,1.4,'#567a50',0,4.1,0),GCyl(.4,.12,'#6a6656',0,.06,0,8)],{solid:.55,scale:[.8,1.3]}); else inst(TREE,[GCyl(.22,2.6,'#5a4636',0,1.3,0,6),GBlob(1.5,'#d9b44a',0,3.3,0,.9),GBlob(1.1,'#e4c25a',.8,2.8,.4,.9),GBlob(1.0,'#c9a43e',-.7,3.0,-.3,.9),GBlob(.9,'#e8cc6a',.1,4.2,.1,.9),GCyl(.55,.2,'#8a8278',0,.1,0,8)],{solid:.55,scale:[.85,1.15]});
if(CITY) for(const [x,z] of TREE) for(let k=0;k<26;k++){ const a=rnd2()*6.28, d=Math.sqrt(rnd2())*2.6; LEAF.push([x+Math.cos(a)*d,z+Math.sin(a)*d]); }
const TARP=['#c8504a','#4a7ab8','#d88a3a','#5a9a6a','#b84a6a'];
for(const ci of [0,1,2,3,4]){ const L=CART.filter((_,i)=>i%5===ci);
  inst(L,[GBox(2.2,.9,1.2,'#9aa0a6',0,.75,0),GBox(2.3,.06,1.3,'#c8ccd0',0,1.22,0),GBox(.06,1.3,.06,'#666',-1.05,1.9,-.55),GBox(.06,1.3,.06,'#666',1.05,1.9,-.55),GBox(.06,1.3,.06,'#666',-1.05,1.9,.55),GBox(.06,1.3,.06,'#666',1.05,1.9,.55),
    GBox(2.6,.12,1.6,TARP[ci],0,2.6,0),GBox(.5,.3,.5,'#3a3a3a',-1.3,.3,.4),GCyl(.18,.12,'#2a2a2a',.8,.18,.62,8),GCyl(.18,.12,'#2a2a2a',-.8,.18,.62,8),GBox(.5,.25,.4,'#e8e0d0',.5,1.38,-.2)],{solid:1.25}); }
inst(LAMP,[GCyl(.09,4.4,'#4a4e54',0,2.2,0,6),GBox(.9,.08,.12,'#4a4e54',.4,4.35,0),GBox(.42,.16,.3,'#3a3e44',.82,4.24,0),GBox(.34,.04,.24,'#f4e2b0',.82,4.15,0),GCyl(.2,.2,'#4a4e54',0,.1,0,6)],{solid:.25});
inst(POT,[GBox(.9,.55,.9,'#8a8076',0,.28,0),GBox(.95,.06,.95,'#6a625a',0,.57,0),GBlob(.5,'#6f8a5a',0,.85,0,.8),GBlob(.32,'#7f9a66',.25,1.05,.1,.9)],{solid:.5});
inst(BAG,[GBlob(.34,'#e8e4dc',0,.28,0,.9),GBlob(.28,'#dcd6c8',.38,.24,.15,.9),GBlob(.26,'#e8d878',-.2,.22,.36,.9)],{solid:.45});
inst(CONE,[GCone(.24,.7,'#e86a2a',0,.35,0),GCyl(.2,.1,'#f0ece4',0,.42,0,8),GBox(.5,.05,.5,'#2a2a2a',0,.025,0)],{solid:.3});
inst(BENCH,[GBox(1.8,.08,.5,'#8a6a4a',0,.48,0),GBox(1.8,.4,.06,'#8a6a4a',0,.75,-.24),GBox(.08,.45,.45,'#3a3a3a',-.75,.23,0),GBox(.08,.45,.45,'#3a3a3a',.75,.23,0)],{solid:.6});

inst(BOX.filter((_,i)=>i%2),[GBox(.7,.5,.5,'#b89a6a',0,.25,0),GBox(.6,.4,.45,'#c8aa78',.1,.7,0,.2),GBox(.5,.04,.5,'#8a7250',0,.5,0)],{solid:.45});
inst(BOX.filter((_,i)=>!(i%2)),[GBox(.7,1.0,.06,'#f0ece2',0,.55,.18,0),GBox(.7,1.0,.06,'#f0ece2',0,.55,-.18,0),GBox(.6,.35,.07,'#c8504a',0,.8,.2),GBox(.06,.08,.4,'#555',0,1.05,0)],{solid:.4});
/* ---------- v2.51 랜드마크 모형 (입체 · 정점 색) — 빛나는 곳(창·등)은 따로 밝은 재질 ---------- */
{ const E3=new THREE.Euler(), M4=new THREE.Matrix4(), Q4=new THREE.Quaternion(), V0=new THREE.Vector3(0,0,1), V1=new THREE.Vector3();
  const GBoxR=(w,h,d,col,x,y,z,rx=0,ry=0,rz=0)=>{ const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(); g.applyMatrix4(M4.makeRotationFromEuler(E3.set(rx,ry,rz))); g.translate(x,y,z); return paint(g,col); };
  const GBeam=(a,b,t,col)=>{ V1.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]); const L=V1.length(); V1.normalize(); const g=new THREE.BoxGeometry(t,t,L).toNonIndexed(); Q4.setFromUnitVectors(V0,V1); g.applyQuaternion(Q4); g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2); return paint(g,col); };
  const GCn=(r,h,col,x,y,z,seg=8,r0=0)=>{ const g=new THREE.CylinderGeometry(r0,r,h,seg).toNonIndexed(); g.translate(x,y,z); return paint(g,col); };
  const GCy=(r,h,col,x,y,z,seg=8,rt)=>{ const g=new THREE.CylinderGeometry(rt==null?r:rt,r,h,seg).toNonIndexed(); g.translate(x,y,z); return paint(g,col); };
  const GDiscX=(r,t,col,x,y,z,seg=12)=>{ const g=new THREE.CylinderGeometry(r,r,t,seg).toNonIndexed(); g.rotateZ(Math.PI/2); g.translate(x,y,z); return paint(g,col); };
  const GDiscZ=(r,t,col,x,y,z,seg=12)=>{ const g=new THREE.CylinderGeometry(r,r,t,seg).toNonIndexed(); g.rotateX(Math.PI/2); g.translate(x,y,z); return paint(g,col); };
  // 기와 지붕(우진각에 가깝게): 네모뿔을 눌러서 + 처마 판
  const GHip=(w,d,h,col,x,y0,z,ridge=.45)=>{ const out=[]; const g=new THREE.CylinderGeometry(Math.SQRT1_2*ridge,Math.SQRT1_2,1,4,1).toNonIndexed(); g.rotateY(Math.PI/4); g.scale(w,h,d); g.translate(x,y0+h/2,z); out.push(paint(g,col));
    out.push(GBox(w*1.03,.22,d*1.03,col,x,y0+.05,z)); for(const sx of [-1,1]) for(const sz of [-1,1]) out.push(GBoxR(.5,.35,.5,col,x+sx*w*.5,y0+.25,z+sz*d*.5,0,Math.PI/4,0)); return out; };
  // 맞배 지붕: 길이 len(로컬 x), 폭 w, 높이 h
  const GGable=(len,w,h,col,x,y0,z,ry=0)=>{ const a=[-len/2,0,-w/2], b=[len/2,0,-w/2], c=[len/2,0,w/2], e=[-len/2,0,w/2], f=[-len/2,h,0], k=[len/2,h,0];
    const P=[a,b,k, a,k,f, e,f,k, e,k,c, a,f,e, b,c,k, a,e,c, a,c,b].flat(); const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.computeVertexNormals(); g.rotateY(ry); g.translate(x,y0,z); return paint(g,col); };
  const BR='#8a3e30', BR2='#7a3428', ST='#a8a294', SL='#3e4048', RED='#93392a', GRN='#3a7a6a', ROOF='#474a52', GLW='#ffcf72';
  const MODELS={
    church(P,L){ P.push(GBox(6,.3,13,'#8a8478',-15.5,.15,0),GBox(22,7,10,BR,0,3.5,0),GGable(22.4,10.8,4.2,SL,0,7,0),GBox(8,6.5,15,BR,4,3.25,0),GGable(15.6,8.6,3.8,SL,4,6.5,0,Math.PI/2),
        GCy(4.6,6,BR,11,3,0,10),GCn(4.9,3.2,SL,11,7.6,0,10),GBox(5.4,13.5,5.4,BR,-12,6.75,0),GBox(5.9,.5,5.9,ST,-12,9.2,0),GBox(5.9,.5,5.9,ST,-12,13.5,0),GCn(3.4,15,SL,-12,21.2,0,8),
        GBox(.25,2.4,.25,'#d8d0c0',-12,30,0),GBox(1.2,.25,.25,'#d8d0c0',-12,30.4,0));
      for(const sx of [-1,1]) for(const sz of [-1,1]) P.push(GCn(.55,2.6,SL,-12+sx*2.5,15.1,sz*2.5,6));
      for(let i=0;i<5;i++) for(const sz of [-1,1]) P.push(GBox(1,5.4,1.1,BR2,-9+i*3.6,2.7,sz*5.4));
      L.push(GDiscX(1.4,.14,'#f2c45a',-14.78,8.2,0,16),GBox(.14,2.8,1.7,'#e8a040',-14.78,1.4,0),GBox(.14,2.2,.8,GLW,-14.78,11.3,0));
      for(let i=0;i<5;i++) for(const sz of [-1,1]) L.push(GBox(.7,2.4,.12,'#f0b850',-7.2+i*3.6,4.3,sz*5.07)); },
    carts(P,L,d){ const TP=['#c8504a','#d88a3a','#4a7ab8','#5a9a6a','#b84a6a','#e0b040'];
      (d.carts||[]).forEach(([x,z,a],i)=>{ const part=[GBox(2.8,1.0,1.5,'#b8bcc0',0,.8,0),GBox(2.9,.07,1.6,'#d8dcde',0,1.33,0),GBox(.6,.25,.45,'#d8543a',-.7,1.48,0),GBox(.8,.12,.4,'#e8c27a',.5,1.42,-.2),
          GBox(.07,1.5,.07,'#666',-1.3,2.05,-.7),GBox(.07,1.5,.07,'#666',1.3,2.05,-.7),GBox(.07,1.5,.07,'#666',-1.3,2.05,.7),GBox(.07,1.5,.07,'#666',1.3,2.05,.7),GBox(3.2,.14,2.0,TP[i%TP.length],0,2.85,0),GBox(3.2,.4,.05,TP[(i+2)%TP.length],0,2.62,1.0),
          GCyl(.2,.12,'#2a2a2a',.9,.2,.76,8),GCyl(.2,.12,'#2a2a2a',-.9,.2,.76,8)];
        const lit=[GBox(.2,.2,.2,GLW,-1,2.5,.95),GBox(.2,.2,.2,'#ff9a6a',0,2.5,.95),GBox(.2,.2,.2,GLW,1,2.5,.95)];
        for(const g of part.concat(lit)){ g.rotateY(a); g.translate(x,0,z); } P.push(...part); L.push(...lit); });
      for(const [x1,z1,x2,z2] of (d.strings||[])){ P.push(GBeam([x1,4.6,z1],[x2,4.6,z2],.05,'#2a2a2e')); const n=Math.max(2,Math.round(Math.hypot(x2-x1,z2-z1)/1.1)); for(let k=1;k<n;k++){ const t=k/n; L.push(GBox(.22,.26,.22,['#ffd27a','#ff8a6a','#8ad0ff','#ffd27a'][k%4],x1+(x2-x1)*t,4.35,z1+(z2-z1)*t)); } } },
    cableLo(P,L){ P.push(GBox(9,4,7,'#c8c0b0',0,2,0),GBox(9.6,.4,7.6,'#5a5e64',0,4.2,0),GBox(4,3,3.2,'#8a8e94',0,5.9,1.4),GBox(.6,.6,3.4,'#4a4e54',0,7.6,1.4));
      for(const sx of [-1.1,1.1]) P.push(GBeam([sx,7.4,3],[sx,36,75],.07,'#1e1e22'));
      const t=.32, cx=0, cy=7.4+(36-7.4)*t, cz=3+72*t; P.push(GBox(.1,1.2,.1,'#333',cx,cy-.6,cz),GBox(2.4,2,1.9,'#c8483a',cx,cy-2.2,cz),GBox(2.5,.18,2,'#e8e4dc',cx,cy-1.15,cz),GBox(2.5,.18,2,'#3a3a3e',cx,cy-3.25,cz));
      L.push(GBox(2.46,.6,1.96,'#ffd890',cx,cy-1.9,cz),GBox(6,1.2,.12,GLW,0,2.2,-3.56),GBox(.12,1.2,4,GLW,-4.56,2.2,0)); },
    railpark(P,L){ P.push(GBox(46,.07,9,'#4e6a46',0,.035,0)); for(const sz of [-.75,.75]) P.push(GBox(46,.13,.13,'#8a8682',0,.2,sz)); for(let x=-22.5;x<=22.5;x+=1.1) P.push(GBox(.36,.1,2.3,'#5a4636',x,.1,0));
      const TC=['#d9a83a','#c86a3a','#e0c050','#b8803a'];
      [[-19,-3.8],[-9,3.8],[1,-3.8],[11,3.8],[19,-3.8],[-14,3.8],[6,3.8],[-4,-3.8],[15,-3.8]].forEach(([x,z],i)=>P.push(GCyl(.22,2.6,'#5a4636',x,1.3,z,6),GBlob(1.6,TC[i%4],x,3.5,z,.85),GBlob(1.1,TC[(i+1)%4],x+.7,3.0,z+.3,.85)));
      P.push(GCyl(.08,3.2,'#d8d8d8',-16,1.6,4.2,6),GBoxR(2.2,.3,.06,'#e8e4dc',-16,3.0,4.2,0,0,.6),GBoxR(2.2,.3,.06,'#c8483a',-16,3.0,4.2,0,0,-.6),GBox(.9,.3,.3,'#2a2a2e',-16,2.3,4.2));
      L.push(GDiscZ(.14,.08,'#ff4a4a',-16.35,2.3,4.36),GDiscZ(.14,.08,'#ff4a4a',-15.65,2.3,4.36));
      for(const x of [-6,13]) P.push(GBox(1.8,.08,.5,'#8a6a4a',x,.48,-2.2),GBox(.08,.45,.45,'#3a3a3a',x-.75,.23,-2.2),GBox(.08,.45,.45,'#3a3a3a',x+.75,.23,-2.2)); },
    stage(P,L){ P.push(GBox(7,.6,4,'#34343e',0,.3,0),GBox(7.1,.12,4.1,'#5a5a66',0,.62,0));
      for(const sx of [-1,1]) P.push(GBox(1.1,2.2,1,'#1e1e22',sx*3,1.7,-1.2),GDiscZ(.32,.05,'#4a4a52',sx*3,2.2,-.68),GDiscZ(.22,.05,'#4a4a52',sx*3,1.3,-.68),GCyl(.08,4.4,'#555',sx*3.7,2.2,-2.2,6),GBox(.5,.4,.5,'#333',sx*3.7,4.3,-2.2));
      P.push(GBox(1.3,.8,.6,'#5a3a2a',1.4,1,-1.4),GCyl(.04,1.5,'#999',0,1.35,.6,6),GBlob(.12,'#333',0,2.15,.6),GBox(1.5,.15,.55,'#4a2424',1.2,.08,3.0),GBox(1.3,.06,.45,'#c8504a',1.2,.17,3.0));
      for(const [x,z,c] of [[-2,3.6,'#5a7ab8'],[0,4.4,'#c8504a'],[2.6,4.0,'#e0b040'],[-3.4,4.8,'#6aa86a']]) P.push(GBox(1.6,.03,1.2,c,x,.02,z));
      L.push(GBox(.36,.36,.08,'#ffe08a',-3.7,4.2,-1.94),GBox(.36,.36,.08,'#ffe08a',3.7,4.2,-1.94),GBox(.3,.08,.3,'#ffb050',1.4,1.44,-1.4));
      for(let k=0;k<=8;k++){ const x=-3.7+7.4*k/8; L.push(GBox(.18,.2,.18,['#ffd27a','#ff8a6a','#8ad0ff'][k%3],x,4.6-Math.sin(k/8*Math.PI)*.6,-2.2)); } },
    playground(P,L){ P.push(GBox(18,.05,13,'#c4ae84',0,.025,0));
      for(const sx of [-1,1]) for(const sz of [-1,1]) P.push(GBox(.14,2.2,.14,'#3a6aa8',-6.4+sx*.7,1.1,-2+sz*.7));
      P.push(GBox(1.6,.16,1.6,'#d84a3a',-6.4,2.2,-2),...GHip(2.2,2.2,1,'#e8c23a',-6.4,3.3,-2,.1),GBoxR(3.6,.12,1.1,'#e8c23a',-4,1.15,-2,0,0,-.62),GBox(.1,2.2,.1,'#3a6aa8',-6.4,3.3,-2));
      for(let k=0;k<5;k++) P.push(GBox(.9,.08,.08,'#c8c8c8',-7.2,.4+k*.42,-2.7));
      for(const x of [1.4,6.6]) P.push(GBoxR(.14,3,.14,'#3a6aa8',x,1.45,-3.45,.28,0,0),GBoxR(.14,3,.14,'#3a6aa8',x,1.45,-2.55,-.28,0,0));
      P.push(GBox(5.4,.16,.16,'#3a6aa8',4,2.85,-3));
      for(const x of [3,5]){ P.push(GBox(.75,.08,.32,'#d84a3a',x,.6,-3),GBox(.03,2.2,.03,'#999',x-.3,1.75,-3),GBox(.03,2.2,.03,'#999',x+.3,1.75,-3)); }
      for(let i=0;i<4;i++) for(let j=0;j<4;j++) P.push(GBox(.09,2.2,.09,'#e8a03a',-1.5+i,1.1,2+j));
      for(let h=.7;h<2.3;h+=.75){ for(let i=0;i<4;i++) P.push(GBox(.07,.07,3,'#e8a03a',-1.5+i,h,3.5)); for(let j=0;j<4;j++) P.push(GBox(3,.07,.07,'#e8a03a',0,h,2+j)); }
      P.push(GBox(1.8,.08,.5,'#8a6a4a',6,.48,4),GBox(.08,.45,.45,'#3a3a3a',5.25,.23,4),GBox(.08,.45,.45,'#3a3a3a',6.75,.23,4)); L.push(GBox(.3,.3,.3,GLW,-6.4,4.5,-2)); },
    factory(P,L){ const BC=['#a84a38','#984232','#b05040'];
      for(let i=-1;i<=1;i++){ const x=i*9.7; P.push(GBox(9.4,5,14,BC[i+1],x,2.5,0)); for(let y=.6;y<5;y+=.75) P.push(GBox(9.44,.08,14.04,'#5e2a22',x,y,0));
        for(const z of [-4.7,0,4.7]) P.push(GGable(9.6,4.7,1.7,'#6a6e72',x,5,z));
        P.push(GBox(3.4,3.6,.12,'#3a5246',x,1.8,7.04),GBox(3.6,.2,.16,'#2a3a34',x,3.7,7.06)); L.push(GBox(1.2,.8,.1,'#e8a85a',x-3,3.6,7.05),GBox(1.2,.8,.1,i?'#e8a85a':'#6a5a4a',x+3,3.6,7.05)); }
      P.push(GCy(1.15,17,'#8a3a2e',14.5,8.5,-4,10,.85),GCy(1.1,.6,'#5a2a22',14.5,17.1,-4,10),GCy(1.3,.5,'#d8d0c4',14.5,13,-4,10),GBeam([12,4,-4],[14.2,4,-4],.4,'#6a6460'),GBeam([-14.6,4.6,6],[-14.6,4.6,-6],.35,'#7a6a5a')); },
    bridge(P,L){ P.push(GBox(31,.06,80,'#24364a',-15,.03,0)); for(let k=0;k<8;k++) P.push(GBox(rnd2()*8+2,.03,.16,'#4a6a88',-15+(rnd2()-.5)*26,.07,-38+k*10));
      for(const z of [-26,0,26]) P.push(GBox(3,7,2.6,'#8a8a86',0,3.5,z));
      P.push(GBox(9,.7,80,'#5a6268',0,7.35,0),GBox(9.2,.2,80,'#3e4248',0,7.8,0));
      const TC='#4e7c8c'; for(const sx of [-4.4,4.4]){ P.push(GBox(.45,.45,80,TC,sx,12,0),GBox(.45,.45,80,TC,sx,7.9,0));
        for(let z=-40;z<40;z+=5){ P.push(GBeam([sx,7.9,z],[sx,12,z+5],.3,TC),GBox(.3,4.1,.3,TC,sx,9.95,z)); } }
      for(let z=-40;z<=40;z+=5) P.push(GBox(8.8,.3,.3,TC,0,12,z));
      for(let z=-30;z<=30;z+=15){ P.push(GCyl(.08,1.6,'#4a4e54',3.6,8.7,z,6)); L.push(GBox(.3,.15,.3,GLW,3.6,9.55,z)); } },
    deer(P,L){ P.push(GBox(14,.06,10,'#5a7a4a',0,.03,0));
      const post=(x,z)=>P.push(GBox(.16,1.3,.16,'#7a5a3a',x,.65,z)); for(let x=-7;x<=7;x+=1.4){ post(x,-5); post(x,5); } for(let z=-5+1.25;z<5;z+=1.25){ post(-7,z); post(7,z); }
      for(const y of [.5,1.1]){ P.push(GBox(14,.1,.08,'#8a6a46',0,y,-5),GBox(14,.1,.08,'#8a6a46',0,y,5),GBox(.08,.1,10,'#8a6a46',-7,y,0),GBox(.08,.1,10,'#8a6a46',7,y,0)); }
      P.push(GBox(3,2,2.4,'#7a5a3a',-4.4,1,-3),GGable(3.4,2.8,1.1,'#5a4030',-4.4,2,-3),GCyl(.7,.6,'#c8a85a',3.6,.3,-3.2,10),GBox(2,.4,.6,'#6a4a2a',2,.4,2.6));
      for(const [x,z,a,ant] of [[-1,1,.4,1],[2.6,-.6,-.9,0],[4.6,2.2,2.4,0]]){ const D=[GBox(1.4,.6,.5,'#b08a5a',0,1.2,0),GBox(.36,.5,.32,'#e8d8c0',-.75,1.25,0)];
        for(const lx of [-.5,.5]) for(const lz of [-.16,.16]) D.push(GBox(.12,.9,.12,'#8a6a46',lx,.45,lz));
        D.push(GBoxR(.24,.7,.22,'#b08a5a',.62,1.65,0,0,0,-.5),GBox(.48,.28,.26,'#b08a5a',.95,1.98,0),GBox(.12,.16,.08,'#2a1e18',1.2,1.95,0));
        if(ant) for(const s of [-1,1]) D.push(GBoxR(.06,.6,.06,'#d8c8a8',.85,2.4,s*.12,s*.4,0,.2),GBoxR(.3,.06,.06,'#d8c8a8',.95,2.55,s*.2,0,0,.4));
        for(const g of D){ g.rotateY(a); g.translate(x,0,z); } P.push(...D); } },
    gwanghwa(P,L){ P.push(GBox(40,5,8,'#b4aa96',0,2.5,0)); for(let y=.9;y<5;y+=.9) P.push(GBox(40.04,.07,8.04,'#948a78',0,y,0));
      for(const [x,w] of [[-8,3.2],[0,3.8],[8,3.2]]) P.push(GBox(w,3,8.1,'#241e24',x,1.5,0),GDiscZ(w/2,8.1,'#241e24',x,3,0,14));
      P.push(GBox(40.4,.5,8.4,'#9a907e',0,5.2,0)); for(let x=-19.5;x<=19.5;x+=1.5) for(const z of [-4,4]) P.push(GBox(.8,.6,.3,'#a8a08c',x,5.7,z));
      P.push(GBox(24,2.6,6.2,RED,0,6.75,0),GBox(24.3,.45,6.5,GRN,0,7.9,0),...GHip(30,10.5,2.2,ROOF,0,8.1,0,.62),GBox(18,2.2,4.8,RED,0,10.9,0),GBox(18.3,.4,5.1,GRN,0,11.9,0),...GHip(24,8.6,3.2,ROOF,0,12.1,0,.5),GBox(12.5,.45,.55,'#34363c',0,15.4,0));
      for(let x=-11;x<=11;x+=2.2) for(const z of [-3.12,3.12]) P.push(GBox(.36,2.6,.1,'#5a2418',x,6.75,z));
      L.push(GBox(1.4,.9,.12,'#e8a050',0,10.9,2.46),GBox(1.4,.9,.12,'#e8a050',0,10.9,-2.46)); },
    haechi(P,L){ const S2='#b0a898'; P.push(GBox(2.6,1.2,3.4,'#968e80',0,.6,0),GBox(1.6,1.3,2.4,S2,0,1.85,0),GBox(1.4,1.2,1.3,S2,0,2.9,1.2),GBox(1,.5,.5,'#a09888',0,2.6,1.95),GCn(.16,.7,S2,0,3.8,1.2,6));
      for(const sx of [-.55,.55]) for(const sz of [-.85,.85]) P.push(GBox(.45,.9,.45,S2,sx,1.45,sz));
      for(const [x,y,z] of [[-.6,3.3,.7],[.6,3.3,.7],[-.7,2.6,.6],[.7,2.6,.6],[0,3.5,.6]]) P.push(GBlob(.45,'#a39b8b',x,y,z,.9));
      P.push(GBlob(.4,'#a39b8b',0,2.6,-1.4,1.1),GBlob(.3,'#a39b8b',0,3.0,-1.5,1)); L.push(GBox(.16,.12,.08,'#ffb060',-.35,3.0,1.86),GBox(.16,.12,.08,'#ffb060',.35,3.0,1.86)); },
    geunjeong(P,L){ P.push(GBox(40,1,32,'#b4ac9a',0,.5,0),GBox(33,1,25,'#bcb4a2',0,1.5,0),GBox(4.4,1,4,'#a8a090',0,.9,17.2),GBox(4,.5,3,'#a8a090',0,1.6,13.6));
      for(const z of [-16,16]) P.push(GBox(40,.5,.18,'#d0c8b6',0,1.25,z)); for(const x of [-20,20]) P.push(GBox(.18,.5,32,'#d0c8b6',x,1.25,0));
      for(const [x,z] of [[-18,-14],[18,-14],[-18,14],[18,14]]) P.push(GCyl(.6,.7,'#5a4a3a',x,1.35,z,10));
      P.push(GBox(28,5,17,RED,0,4.5,0),GBox(28.3,.6,17.3,GRN,0,6.8,0),...GHip(34,23,2.6,ROOF,0,7.1,0,.66),GBox(22,2.4,12,RED,0,10.0,0),GBox(22.3,.5,12.3,GRN,0,11.1,0),...GHip(30,19,4,ROOF,0,11.3,0,.5),GBox(15.5,.5,.6,'#34363c',0,15.4,0));
      for(let x=-13;x<=13;x+=2.6) P.push(GBox(.42,5,.12,'#5a2418',x,4.5,8.56));
      L.push(GBox(10,2.6,.12,'#e8b060',0,3.6,8.58),GBox(.12,2,6,'#d8a050',-14.06,3.6,0),GBox(.12,2,6,'#d8a050',14.06,3.6,0)); },
    gyeonghoe(P,L){ P.push(GBox(30,1.4,33,'#a8a090',0,.7,0),GBox(30.2,.2,33.2,'#8a8274',0,1.45,0));
      for(let i=0;i<6;i++) for(let j=0;j<7;j++){ const x=-12.5+i*5, z=-14.4+j*4.8; P.push(GBox(.9,3.8,.9,'#bcb4a4',x,3.3,z)); }
      P.push(GBox(28,.6,31,'#6a3a2a',0,5.5,0)); for(let i=0;i<6;i++) for(const z of [-14.4,14.4]) P.push(GCyl(.28,2.6,RED,-12.5+i*5,7.1,z,8)); for(let j=1;j<6;j++) for(const x of [-12.5,12.5]) P.push(GCyl(.28,2.6,RED,x,7.1,-14.4+j*4.8,8));
      P.push(GBox(27,.5,30,GRN,0,8.6,0),...GHip(36,39,5,ROOF,0,8.8,0,.42),GBox(16,.5,.6,'#34363c',0,13.9,0));
      for(const z of [-8,0,8]) P.push(GBox(8,.4,2.6,'#a8a090',19,1.0,z));
      for(let i=0;i<6;i++) L.push(GBox(.6,.8,.6,'#ffb060',-12.5+i*5,8,0)); },
    tower(P,L){ P.push(GCy(6,4,'#c4c0b8',0,2,0,12),GCy(4.5,2,'#b4b0a8',0,5,0,12),GCy(1.5,26,'#e6e2da',0,19,0,10,1.15),GCy(4.8,1.4,'#d8d4cc',0,32.4,0,6,3.4),GCy(5.4,1.2,'#5a6a7a',0,33.7,0,6),GCy(4.6,1.6,'#d8d4cc',0,35.1,0,6,5.2),GCy(3.4,1.2,'#c8c4bc',0,36.5,0,6,2.6),GCy(.95,5,'#c8c8c8',0,39.6,0,4,.6));
      for(let k=0;k<6;k++) P.push(GCy(.36,1.6,k%2?'#e8e4dc':'#c8483a',0,42.9+k*1.6,0,6,.3));
      L.push(GCy(5.46,.7,'#ffd88a',0,33.7,0,6),GBlob(.5,'#ff4a5a',0,52.4,0),GBox(2,1.4,.12,GLW,0,1.4,6.02)); },
    palgak(P,L){ P.push(GCy(4.6,.8,'#a8a090',0,.4,0,8)); for(let i=0;i<8;i++){ const a=i/8*6.283+.39; P.push(GCyl(.24,3,RED,Math.cos(a)*3.6,2.3,Math.sin(a)*3.6,8)); }
      P.push(GCy(4.1,.5,GRN,0,4,0,8),GCn(5.8,2.6,ROOF,0,5.55,0,8),GCy(5.9,.2,ROOF,0,4.3,0,8),GCyl(.22,1,'#6a5a4a',0,7.3,0,6)); L.push(GBox(.4,.5,.4,GLW,0,3.6,0)); },
    bongsu(P,L){ P.push(GBox(16,.6,4,'#968e80',0,.3,0)); for(const x of [-6,-3,0,3,6]) P.push(GCy(1.3,2.6,'#a8a090',x,1.9,0,8,1.05),GCy(.85,.8,'#8a8274',x,3.6,0,8));
      L.push(GCy(.55,.1,'#ff9a50',0,4.05,0,8)); },
    cableUp(P,L){ P.push(GBox(8,4,6,'#c8c0b0',0,2,0),GBox(8.6,.4,6.6,'#5a5e64',0,4.2,0),GBox(3.4,2.4,2.6,'#8a8e94',0,5.6,1.6));
      for(const sx of [-1.1,1.1]) P.push(GBeam([sx,6.4,2.9],[sx,1,92],.07,'#1e1e22'));
      const t=.2, cy=6.4+(1-6.4)*t, cz=2.9+89*t; P.push(GBox(.1,1.2,.1,'#333',0,cy-.6,cz),GBox(2.4,2,1.9,'#e0b040',0,cy-2.2,cz),GBox(2.5,.18,2,'#e8e4dc',0,cy-1.15,cz),GBox(2.5,.18,2,'#3a3a3e',0,cy-3.25,cz));
      L.push(GBox(2.46,.6,1.96,'#ffd890',0,cy-1.9,cz),GBox(5,1.2,.12,GLW,0,2.2,-3.06)); },
    wall(P,L,d){ for(const Ls of d.seg) for(let i=0;i+1<Ls.length;i++){ const a=Ls[i], b=Ls[i+1], len=Math.hypot(b[0]-a[0],b[1]-a[1]), ang=Math.atan2(-(b[1]-a[1]),b[0]-a[0]), mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2;
        P.push(GBoxR(len+1.6,2.4,1.8,'#a8a294',mx,1.2,mz,0,ang,0),GBoxR(len+1.6,.08,1.84,'#8a8476',mx,.8,mz,0,ang,0),GBoxR(len+1.6,.08,1.84,'#8a8476',mx,1.6,mz,0,ang,0));
        const ux=(b[0]-a[0])/len, uz=(b[1]-a[1])/len; for(let t=.6;t<len;t+=1.7) P.push(GBoxR(.9,.6,1.7,'#b4ae9e',a[0]+ux*t,2.7,a[1]+uz*t,0,ang,0)); } }
  };
  for(const d of LMK){ const f=MODELS[d.k]; if(!f) continue; const P=[], L=[]; f(P,L,d);
    const world=d.k==='carts'||d.k==='wall';
    const fin=(gs,mat,sh)=>{ if(!gs.length) return; const g=mergeGeometries(gs); if(!world){ g.rotateY(d.ry||0); g.translate(d.x,0,d.z); } g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); m.castShadow=m.receiveShadow=sh; m.userData.lmk=d.id; G.add(m); return m; };
    fin(P,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),true); fin(L,new THREE.MeshBasicMaterial({vertexColors:true}),false); }
}
/* v2.9.4 실제 도로(OSM highway 선): 아스팔트 + 차선 + 횡단보도 — 기획자 평 「도로는 지도에 차선으로」. 데이터가 있는 지역(수원)만 */
let ROADN=0; if(ROADS_RAW){ const RD=ROADS_RAW.split(';').map(t=>{ const [hw,ln,ow,geo]=t.split('|'); return {hw,ln:+ln||0,ow:ow==='yes',pts:geo.split(' ').map(q=>q.split(',').map(Number))}; });
  const LW=1.6; // 차로 하나 ≈ 3.2m
  const lanesOf=r=>{ const h=r.hw.replace('_link',''); let n=r.ln; if(r.ow&&n>=6) n=Math.round(n/2); if(!n) n=h==='primary'||h==='trunk'?(r.ow?3:6):h==='secondary'?4:h==='tertiary'?(r.ow?3:2):h==='residential'||h==='unclassified'?2:1.5; if(r.hw.endsWith('_link')) n=Math.min(n,1.5); return n; };
  const marked=r=>/^(trunk|primary|secondary|tertiary)/.test(r.hw);
  const deg=new Map(); for(const r of RD) for(const q of r.pts){ const k=q[0]+','+q[1]; deg.set(k,(deg.get(k)||0)+1); }
  const XS=[]; for(const [k,n] of deg) if(n>=2) XS.push(k.split(',').map(Number));
  const nearX=(x,z,R)=>{ for(const q of XS){ const dx=q[0]-x, dz=q[1]-z; if(dx*dx+dz*dz<R*R) return true; } return false; };
  const AP=[],AU=[],MP=[],MC=[]; const Y1=.007, Y2=.016;
  const triA=(a,b,c)=>{ for(const v of [a,b,c]){ AP.push(v[0],Y1,v[1]); AU.push(v[0]/5,v[1]/5); } };
  const rectM=(cx,cz,ux,uz,hl,hw,col)=>{ const lx=-uz, lz=ux, P=[[cx-ux*hl-lx*hw,cz-uz*hl-lz*hw],[cx+ux*hl-lx*hw,cz+uz*hl-lz*hw],[cx+ux*hl+lx*hw,cz+uz*hl+lz*hw],[cx-ux*hl+lx*hw,cz-uz*hl+lz*hw]];
    for(const i of [0,2,1,0,3,2]){ MP.push(P[i][0],Y2,P[i][1]); MC.push(col[0],col[1],col[2]); } };
  const WH=[.91,.9,.87], YE=[.92,.72,.2]; const SEGW=[];
  for(const r of RD){ const n=lanesOf(r); let run=0;
    for(let i=0;i+1<r.pts.length;i++){ const [ax,az]=r.pts[i],[bx,bz]=r.pts[i+1], L=Math.hypot(bx-ax,bz-az); if(L<.3) continue; const ux=(bx-ax)/L, uz=(bz-az)/L, lx=uz, lz=-ux; // lx,lz = 가는 방향의 왼쪽
      let md=99; for(let k=0;k<=8;k++){ const t=k/8; md=Math.min(md,distAt(ax+(bx-ax)*t,az+(bz-az)*t)); }
      const W=Math.min(n*LW,2*md-1.4); if(W<1.8){ run+=L; continue; } const h=W/2; SEGW.push({ax,az,ux,uz,L,W});
      const p1=[ax+lx*h,az+lz*h],p2=[bx+lx*h,bz+lz*h],p3=[bx-lx*h,bz-lz*h],p4=[ax-lx*h,az-lz*h]; triA(p1,p3,p2); triA(p1,p4,p3);
      for(const [cx,cz] of [[ax,az],[bx,bz]]) for(let k=0;k<12;k++){ const a0=k/12*6.2832, a1=(k+1)/12*6.2832; triA([cx,cz],[cx+Math.cos(a1)*h,cz+Math.sin(a1)*h],[cx+Math.cos(a0)*h,cz+Math.sin(a0)*h]); }
      if(marked(r)&&W>=3){ const lines=[]; // [옆으로 떨어진 거리, 점선?, 색]
        if(r.ow){ lines.push([h-.3,0,YE],[h-.48,0,YE],[-(h-.25),0,WH]); for(let k=1;k*LW<W-.6;k++) lines.push([h-k*LW,1,WH]); }
        else { lines.push([.09,0,YE],[-.09,0,YE],[h-.25,0,WH],[-(h-.25),0,WH]); for(let k=1;k*LW<h-.6;k++){ lines.push([k*LW,1,WH],[-k*LW,1,WH]); } }
        for(let d=.5;d<L;d+=1){ const cx=ax+ux*d, cz=az+uz*d; if(nearX(cx,cz,h+2.5)) continue; const on=((run+d)%4)<1.6;
          for(const [o,dash,col] of lines){ if(dash&&!on) continue; const px=cx+lx*o, pz=cz+lz*o; if(distAt(px,pz)<.6) continue; rectM(px,pz,ux,uz,.5,.075,col); } } }
      run+=L; } }
  // 횡단보도: OSM crossing 점 → 가장 가까운 도로 토막 방향으로 줄무늬
  if(CROSS_RAW) for(const q of CROSS_RAW.split(' ')){ const [x,z]=q.split(',').map(Number); let best=null,bd=6;
    for(const S0 of SEGW){ let t=(x-S0.ax)*S0.ux+(z-S0.az)*S0.uz; t=Math.max(0,Math.min(S0.L,t)); const d=Math.hypot(S0.ax+S0.ux*t-x,S0.az+S0.uz*t-z); if(d<bd){ bd=d; best={S0,t}; } }
    if(!best) continue; const {S0,t}=best, cx=S0.ax+S0.ux*t, cz=S0.az+S0.uz*t, lx=S0.uz, lz=-S0.ux, h=S0.W/2;
    for(let o=-h+.35;o<=h-.3;o+=.46) rectM(cx+lx*o,cz+lz*o,S0.ux,S0.uz,1.0,.12,WH); }
  if(AP.length){ const c=mk(32,32), x=c.getContext('2d'); x.fillStyle='#55575b'; x.fillRect(0,0,32,32); for(let i=0;i<70;i++){ x.fillStyle=rnd2()<.5?'#4a4c50':'#606266'; x.fillRect(Math.floor(rnd2()*32),Math.floor(rnd2()*32),1,1); } x.fillStyle='rgba(30,30,32,.25)'; for(let i=0;i<4;i++) x.fillRect(Math.floor(rnd2()*28),Math.floor(rnd2()*28),3,2);
    const t=ctex(c,true); const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(AP,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(AU,2)); g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:t,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})); m.receiveShadow=true; G.add(m); }
  if(MP.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(MP,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(MC,3)); g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})); m.receiveShadow=true; G.add(m); }
  ROADN=RD.length; }
/* v2.9.2 버려진 차·버스: 넓은 찻길(수원 큰길)에만 — 길가에 나란히 선 차 + 가운데 멈춰 선 차. 명동처럼 골목뿐인 곳엔 거의 안 생김 */
const VEH={car:[],bus:[]}; { let wide=0; if(CITY) for(let k=0;k<CW*CH;k++) if(DIST[k]>=6) wide++; const WA=wide*CS*CS;
  const grad=(x,z)=>{ const gx=distAt(x+1,z)-distAt(x-1,z), gz=distAt(x,z+1)-distAt(x,z-1), L=Math.hypot(gx,gz)||1; return [gx/L,gz/L]; };
  const nearZ=(x,z)=>ZONE&&Math.hypot(x-ZONE[0],z-ZONE[1])<26;
  const okC=(x,z,ang,len,r)=>{ const ux=Math.cos(ang), uz=-Math.sin(ang); for(const t of [-len/2+r,0,len/2-r]) if(!freeAt(x+ux*t,z+uz*t,r)) return false; return true; };
  const put=(L,x,z,ang,len,r)=>{ L.push([x,z,ang]); const ux=Math.cos(ang), uz=-Math.sin(ang), n=Math.max(2,Math.round(len/(r*1.6))); for(let i=0;i<n;i++){ const t=-len/2+r+(len-2*r)*i/(n-1); markSolid(x+ux*t,z+uz*t,r); } };
  const nCurb=Math.min(560,Math.round(WA/230)), nMid=Math.min(240,Math.round(WA/500)), nBus=Math.min(30,Math.round(WA/7000)); VEH.WA=Math.round(WA);
  dseed=777; let tries=0;
  // 버스: 아주 넓은 길 가운데쯤, 길 방향으로
  for(;VEH.bus.length<nBus&&tries<60000;tries++){ const x=GX0+12+rnd2()*(GW-24), z=GZ0+12+rnd2()*(GH-24), d=distAt(x,z); if(d<5.5||d>9||nearZ(x,z)) continue; const [gx,gz]=grad(x,z); if(Math.abs(gx)+Math.abs(gz)<.5) continue;
    const ang=Math.atan2(-gx,-gz)+(rnd2()-.5)*.15; if(!okC(x,z,ang,10,1.35)) continue; if(VEH.bus.some(b=>Math.hypot(b[0]-x,b[1]-z)<30)) continue; put(VEH.bus,x,z,ang,10,1.35); }
  tries=0; // 길가 차: 벽에서 2.4~3.6, 그 앞이 넓은 길일 때만
  for(;VEH.car.length<nCurb&&tries<120000;tries++){ const x=GX0+10+rnd2()*(GW-20), z=GZ0+10+rnd2()*(GH-20), d=distAt(x,z); if(d<2.4||d>3.6) continue; const [gx,gz]=grad(x,z); if(Math.abs(gx)+Math.abs(gz)<.5) continue;
    if(distAt(x+gx*5,z+gz*5)<6.5) continue; const ang=Math.atan2(-gx,-gz)+(rnd2()-.5)*.12+(rnd2()<.5?Math.PI:0); if(!okC(x,z,ang,4.1,.95)) continue; put(VEH.car,x,z,ang,4.1,.95); }
  tries=0; const mid0=VEH.car.length; // 찻길 가운데 멈춘 차: 아무렇게나 틀어짐
  for(;VEH.car.length-mid0<nMid&&tries<60000;tries++){ const x=GX0+10+rnd2()*(GW-20), z=GZ0+10+rnd2()*(GH-20), d=distAt(x,z); if(d<6.5||nearZ(x,z)) continue; const ang=rnd2()*6.283; if(!okC(x,z,ang,4.1,.95)) continue; put(VEH.car,x,z,ang,4.1,.95); } }
function instA(list,parts){ if(!list.length) return; const g=mergeGeometries(parts); g.computeVertexNormals(); const m=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({vertexColors:true}),list.length), o=new THREE.Object3D();
  list.forEach(([x,z,a],i)=>{ o.position.set(x,0,z); o.rotation.set(0,a,0); o.scale.set(1,1,1); o.updateMatrix(); m.setMatrixAt(i,o.matrix); }); m.castShadow=m.receiveShadow=true; G.add(m); }
const CARC=[['#e4e2dc','#d0cec8'],['#a6aaae','#94989c'],['#3c3e44','#2e3034'],['#40506e','#34425c'],['#9a4440','#86383a'],['#c8b48a','#b4a078']];
const carParts=(c1,c2)=>[GBox(4.0,.72,1.8,c1,0,.62,0),GBox(2.1,.66,1.58,c2,-.25,1.3,0),GBox(2.16,.36,1.62,'#3e4a56',-.25,1.36,0),GBox(4.04,.16,1.84,'#55585c',0,.32,0),
  GBox(.62,.56,.26,'#1e1e20',1.3,.3,.82),GBox(.62,.56,.26,'#1e1e20',-1.3,.3,.82),GBox(.62,.56,.26,'#1e1e20',1.3,.3,-.82),GBox(.62,.56,.26,'#1e1e20',-1.3,.3,-.82),
  GBox(.05,.14,.34,'#efe2b8',2.01,.78,.56),GBox(.05,.14,.34,'#efe2b8',2.01,.78,-.56),GBox(.05,.12,.3,'#a83a32',-2.01,.8,.6),GBox(.05,.12,.3,'#a83a32',-2.01,.8,-.6)];
CARC.forEach((c,ci)=>instA(VEH.car.filter((_,i)=>i%CARC.length===ci),carParts(c[0],c[1])));
instA(VEH.bus,[GBox(10,2.3,2.4,'#5a9a6a',0,1.55,0),GBox(10.06,.8,2.46,'#3e4a56',0,2.05,0),GBox(10.02,.3,2.42,'#e4e2dc',0,1.45,0),GBox(10,.08,2.3,'#4a7a56',0,2.74,0),
  GBox(.9,.8,.3,'#1e1e20',3.2,.4,1.1),GBox(.9,.8,.3,'#1e1e20',-3.2,.4,1.1),GBox(.9,.8,.3,'#1e1e20',3.2,.4,-1.1),GBox(.9,.8,.3,'#1e1e20',-3.2,.4,-1.1),GBox(.06,1.2,1.9,'#3e4a56',5.02,1.9,0)]);
/* 바닥 장식: 은행잎 · 맨홀 · 금 · 얼룩 (도트 한 장) */
{ const R=Math.min(5,Math.floor(2400/Math.max(GW,GH)*10)/10), c=mk(Math.round(GW*R),Math.round(GH*R)), x=c.getContext('2d'); x.imageSmoothingEnabled=false; const toP=(X,Z)=>[Math.floor((X-GX0)*R),Math.floor((Z-GZ0)*R)];
  const LC=CITY?['#e8c24a','#d9a83a','#f0d468','#c8962e']:MNT?['#6a5a3a','#5a4a30','#7a6a44','#4a4028']:['#b8a888','#a89878','#c8b898','#9a8a6a'];
  for(const [X,Z] of LEAF){ const [px,pz]=toP(X,Z); x.fillStyle=LC[Math.floor(rnd2()*4)]; x.fillRect(px,pz,2,1); if(rnd2()<.5) x.fillRect(px+1,pz+1,1,1); }
  for(let k=0;k<900*KA;k++){ const X=GX0+rnd2()*GW, Z=GZ0+rnd2()*GH; if(distAt(X,Z)<.5) continue; const [px,pz]=toP(X,Z); x.fillStyle=LC[k%4]; x.fillRect(px,pz,1+(k%2),1); }
  if(CITY) for(const [X,Z] of scatter(40,(X,Z)=>distAt(X,Z)>=2,8)){ const [px,pz]=toP(X,Z); x.fillStyle='#6a6660'; x.fillRect(px-3,pz-3,7,7); x.fillStyle='#86827a'; x.fillRect(px-2,pz-2,5,5); x.fillStyle='#6a6660'; x.fillRect(px-2,pz,5,1); x.fillRect(px,pz-2,1,5); }
  x.strokeStyle='rgba(70,60,50,.35)'; x.lineWidth=1; for(let k=0;k<160*KA;k++){ let X=GX0+rnd2()*GW, Z=GZ0+rnd2()*GH; if(distAt(X,Z)<1) continue; let [px,pz]=toP(X,Z); x.beginPath(); x.moveTo(px,pz); for(let s=0;s<4;s++){ px+=Math.round((rnd2()-.5)*6); pz+=Math.round((rnd2()-.5)*6); x.lineTo(px,pz); } x.stroke(); }
  for(let k=0;k<90*KA;k++){ const X=GX0+rnd2()*GW, Z=GZ0+rnd2()*GH; if(distAt(X,Z)<1) continue; const [px,pz]=toP(X,Z); x.fillStyle='rgba(60,50,40,.10)'; const r=3+Math.floor(rnd2()*6); x.fillRect(px-r,pz-r/2,r*2,r); }
  const t=ctex(c); const g=new THREE.Mesh(new THREE.PlaneGeometry(GW,GH),new THREE.MeshLambertMaterial({map:t,transparent:true,depthWrite:false})); g.rotation.x=-Math.PI/2; g.position.y=.02; g.receiveShadow=true; g.renderOrder=1; G.add(g); }

/* ---------- 바닥 그림자 ---------- */
const shadowT=(()=>{ const c=mk(64,32), x=c.getContext('2d'); const g=x.createRadialGradient(32,16,2,32,16,30); g.addColorStop(0,'rgba(0,0,0,.42)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,64,32); return new THREE.CanvasTexture(c); })();
function shadow(r){ const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r),new THREE.MeshBasicMaterial({map:shadowT,transparent:true,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.04; m.renderOrder=2; return m; }

/* ---------- 가게 앞 자리 (빛나는 자리·가게 이름 표시용) ---------- */
const FRONTS=[]; for(const w of WALLS) for(const f of (w.fronts||[])){ const k=(f.u+SW/2)/w.L; FRONTS.push({x:w.a[0]+(w.c[0]-w.a[0])*k+w.nx*1.3,z:w.a[1]+(w.c[1]-w.a[1])*k+w.nz*1.3,s:f.s}); }
function nearShop(P,R=4){ let best=null,bd=R; for(const f of FRONTS){ const d=Math.hypot(f.x-P.x,f.z-P.z); if(d<bd){ bd=d; best=f.s; } } return best; }
/* ---------- 넓은 빈터 찾기 (보스 구역) ---------- */
function openSpot(from,minD){ let best=null,bd=-1; for(let x=GX0+12;x<=GX0+GW-12;x+=2) for(let z=GZ0+12;z<=GZ0+GH-12;z+=2){ if(blocked(x,z)) continue; const d=Math.hypot(x-from[0],z-from[1]); if(d<minD) continue; const sc=distAt(x,z)*3+d*.05; if(sc>bd){ bd=sc; best=[x,z]; } } return best; }
const FADE_TO2=FADE_TO;
// v2.36 화면 정리: 주인공을 가리는 것(건물·나무·포장마차·간판·가로등)은 주인공 둘레 동그라미만큼 뚫어 보인다.
// 카메라 → 주인공 시선 둘레의 원뿔 안 + 주인공보다 앞 + 땅보다 위인 조각만: 가운데는 다 비우고 가장자리는 체크무늬로 옅게.
const SEE={uSeeP:{value:new THREE.Vector3()},uSeeC:{value:new THREE.Vector3()},uSeeR:{value:1.7},uSeeOn:{value:0}};
const seeDone=new Set(); let seeT=0;
function seeMat(m){ if(!m||seeDone.has(m)||m.isShaderMaterial) return; seeDone.add(m); const ob=m.onBeforeCompile, ok=m.customProgramCacheKey;
  m.onBeforeCompile=(sh,r)=>{ if(ob) ob.call(m,sh,r); Object.assign(sh.uniforms,SEE);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSeeW;').replace('#include <project_vertex>','#include <project_vertex>\n{ vec4 sw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n sw=instanceMatrix*sw;\n#endif\n vSeeW=(modelMatrix*sw).xyz; }');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSeeW; uniform vec3 uSeeP; uniform vec3 uSeeC; uniform float uSeeR; uniform float uSeeOn;')
      .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(uSeeOn>.5&&vSeeW.y>.22){ vec3 ax=uSeeP-uSeeC; float L=length(ax); ax/=L; vec3 q=vSeeW-uSeeC; float s=dot(q,ax); if(s>0.&&s<L-.28){ float rr=uSeeR*s/L, d=length(q-ax*s)/rr; if(d<1.){ vec2 fc=mod(floor(gl_FragCoord.xy),4.); float bay=(fc.x*4.+fc.y); bay=mod(bay*5.+fc.y*3.,16.)/16.; if(d<.62||bay>(d-.62)/.38*.95) discard; } } }'); };
  m.customProgramCacheKey=()=>(ok?ok.call(m):'')+'|see'; m.needsUpdate=true; }
function seeAll(){ G.traverse(o=>{ if(!(o.isMesh||o.isLine||o.isPoints)) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(seeMat); }); }
function update(dt,P,camera){
  if((seeT-=dt)<=0){ seeT=3; seeAll(); }
  SEE.uSeeP.value.set(P.x,.95,P.z); SEE.uSeeC.value.copy(camera.position); SEE.uSeeOn.value=1;
  const ahead=P.z-4; sun.target.position.set(P.x,0,ahead); sun.position.set(P.x+SUN.x,SUN.y,ahead+SUN.z);
  FT.fill(1); { const dx=camera.position.x-P.x, dy=camera.position.y, dz=camera.position.z-P.z, L=Math.hypot(dx,dy,dz), ux=dx/L, uy=dy/L, uz=dz/L;
    for(const [ox,oy] of [[0,.2],[0,1.0],[0,1.8],[-.6,1.0],[.6,1.0]]) for(let t=0;t<14;t+=.35){ const y=oy+uy*t; if(y>9) break; const k=cell(P.x+ox+ux*t,P.z+uz*t); if(k<0) continue; const bi=BIDG[k]; if(bi>=0&&y<BLD[bi].H+.7) FT[bi]=FADE_TO; } }
  let fch=false; for(let i=0;i<BLD.length;i++){ if(FA[i]!==FT[i]){ FA[i]+=(FT[i]-FA[i])*Math.min(1,dt*9); if(Math.abs(FA[i]-FT[i])<.03) FA[i]=FT[i]; const v=FA[i]>=.995?255:Math.min(250,Math.round(FA[i]*255)); if(FADE[i]!==v){ FADE[i]=v; fch=true; } } } if(fch) fadeTex.needsUpdate=true;
}
function clearAt(x,z){ return distAt(x,z); }
return {LMK,SIGNS,RSIGNS,signAt,SEE,seeAll,G,sun,hemi,FOG,blocked,distAt,cell,SHOPS,CAT,FRONTS,BLD,START,nearShop,openSpot,update,bounds:{x0:GX0,z0:GZ0,w:GW,h:GH},ATLAS_FILL,over,SOV,PAGES:PAGES.map(p=>p.AH),props:{ROADS:ROADN,TREE:TREE.length,CART:CART.length,CAR:VEH.car.length,BUS:VEH.bus.length,WA:VEH.WA}};
}
