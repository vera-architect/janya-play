/* ============================================================
   잔야(가제) — 1단계 맛보기 v2.4 (v2.2 새 무기·조합·실제 지형 지도 | v2.3 불 단계·기능 칸·AI 무기 그림·조합 20·명동 도깨비 | v2.4 이어 걷는 실제 서울 지도 | v2.5 설화 괴수 야광귀·강철이·금돼지, 도깨비 옆·뒤 | v2.6 걷는 그림·피해 숫자·필살기·몬스터 예고 공격·판정 표시·화살표 거리)
   Three.js · 2.5D 쿼터뷰 · 종이 인형 · 뱀서라이크
   v2: 모닥불 거점(모닥불지기 업그레이드), 지도, 캐릭터 3명, 무기 12종(독창 7), 선택과 갈래도
   1·2막 규칙(06 v4.1): 괴수에게 사람 흔적·사람 말 없음. 선택은 저승 틀 안의 일로만 보인다.
   ============================================================ */
import * as THREE from 'three';
import { WD } from './world_data.js';
import { buildMyeong } from './myeong.js';
import { MD } from './myeong_data.js';
import { HD } from './hongdae_data.js';
import { SS } from './seongsu_data.js';
import { GD } from './gyeong_data.js';
import { NS } from './namsan_data.js';
import { makeArt, axeTex, gemTex, bigGemTex, emberTex, radial, shadowC, ringC, lineC, groundC, concreteC, saltC, beanC, talisC, puddleC, fanC, markC, lootPropC, sparkC, floorGlowC, mk, setSeed, rnd, rr } from './art.js';

const $ = id => document.getElementById(id);
const BOT = location.hash==='#bot'||location.hash==='#lazy';
// v2.19 같은 판 다시 돌려 비교(템플릿 「seeded run」 방식): ?seed=N 이면 무작위가 늘 같은 순서로 나온다 + DBG.fixed면 화면 속도와 상관없이 한 틀마다 같은 걸음 수
{ const sd=new URLSearchParams(location.search).get('seed'); if(sd!=null){ let a=(+sd|0)||1; window.__reseed=()=>{ a=(+sd|0)||1; }; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; window.__seeded=+sd; } }
const LAZY = location.hash==='#lazy'; const SMART=location.search.includes('smart'); const NOREN=location.search.includes('noren'); let NOREN_N=0; // 시험용: 그리기를 25번에 한 번만
const MOBILE = matchMedia('(pointer:coarse)').matches;
const DBG = { ts: 1, fixed: +(new URLSearchParams(location.search).get('fixed')||0) };
let FIELD=null, MY=null; const FBUILT={};
// v2.9 지역 필드 목록: 명동 골목 · 수원 인계동 (같은 모듈, 데이터만 다름)
// v2.48 서울 5지역(61번): 지역마다 일반 괴수 3 · 중간보스 3 · 파이널. 공통 괴수(그림자 귀신·혼불·정예·보물)는 어디서나
const FIELDS={
  myeong:{name:'명동 골목',boss:'dokkaebi',mids:['gumiho','jine','yagwangK'],mobs:['jineS','fox','mangryang'],star:1,desc:'도깨비 골목 · 가게와 지하상가',data:()=>MD},
  hongdae:{name:'홍대 밤거리',boss:'bibi',mids:['giltal','agwi','dueok'],mobs:['gwijol','yeongno','dfire'],star:2,desc:'밤마다 귀신 무리가 노는 거리',data:()=>HD},
  seongsu:{name:'성수 공장골목',boss:'imugi',mids:['bulgasari','mulgwi','jireongi'],mobs:['yagwang','gangcheol','mokrang'],star:3,desc:'쇠와 물의 땅 · 공장과 수제화 골목',data:()=>SS},
  gyeong:{name:'경복궁',boss:'haechi',mids:['tiger','gyoryong','mulgoe'],mobs:['bulsae','hwama','imae'],star:4,desc:'왕의 자리 · 궁궐의 불막이',data:()=>GD},
  namsan:{name:'남산',boss:'datbal',mids:['bulgae','gureong','jangseung'],mobs:['bulgaeS','gureongS'],star:5,desc:'하늘·숲·탑 · 마지막 땅',data:()=>NS}
};
const FKEYS=['myeong','hongdae','seongsu','gyeong','namsan'];
const finalOf=fk=>fk==='namsan'&&(SV.ep||0)>=5?'queen':FIELDS[fk].boss; // 남산: 5화 「돌 속의 왕」 뒤에 저승의 여왕
const MPU=()=>S&&S.field&&FIELDS[S.field]&&FIELDS[S.field].mpu||1.2; // 1단위가 몇 m인지 (수원은 0.6배로 줄여 ≈2m)
const fName=()=>S&&S.field&&FIELDS[S.field]?FIELDS[S.field].name:''; // v2.8 지역 필드(명동) — 켜져 있으면 FIELD===MY

/* ============ 저장 (이 기기 브라우저에만) ============ */
const SAVE_KEY='janya_v2';
function loadSave(){ let d={}; try{ d=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'); }catch(e){}
  return Object.assign({shards:0,up:{},chars:{fire:true},cleared:{},choice:{},seen:{},runs:0,intro:false,best:{},carry:null,released:0,taken:0,buried:0,region:'namsan',char:'fire',vib:true,found:{},heat:0,lit:{},fog:'',told:{},lt:0},d); } // v2.55: lt = 빛 조각 (옛 저장엔 없으니 0으로 채움)
let SV=loadSave();
/* v2.55.2 숨은 장부(67번 5장) — 화면 어디에도 안 보임. 3막에 「내가 한 일」을 뒤집어 보여 줄 기록. 숫자 묶음만 · 봇 판은 안 쌓음 · 옛 저장은 빈 장부로 시작(기본값 병합) */
const LEDGER0=()=>({kills:{},byMon:{},bosses:{},revives:0,goneNpc:[],first:{},gearFrom:{},broken:0,scrapped:0,runs:0,time:0});
SV.ledger=Object.assign(LEDGER0(),(SV.ledger&&typeof SV.ledger==='object')?SV.ledger:{});
const LGon=()=>!BOT||!!window.LG_TEST;
function lgKill(fk,mk,ch){ if(!LGon()) return; const L=SV.ledger; fk=fk||'?'; L.kills[fk]=(L.kills[fk]||0)+1; if(mk) L.byMon[mk]=(L.byMon[mk]||0)+1; if(ch&&!L.first[ch]) L.first[ch]={m:mk,f:fk,d:new Date().toISOString().slice(0,10)}; }
function lgTime(){ if(!LGon()||!S||S._lgT0==null) return; SV.ledger.time=Math.round((SV.ledger.time||0)+Math.max(0,(S.t||0)-S._lgT0)); S._lgT0=S.t||0; }
if(SV.bought==null){ SV.bought=Object.values(SV.up||{}).reduce((a,b)=>a+b,0); }
function save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(SV)); }catch(e){} }
/* ============ v2.19 조정 패널 (템플릿 「tweak panel」 방식, 기획자 01:54 ㄴ) ============
   멈춤 → 🎛 조정: 값마다 슬라이더 · 바로 바뀜 · 「값 복사」로 Claude에게 보내면 본 게임에 반영. 내 기기에만 저장(SV.tune) */
const TUNE_DEF={
  spawn:{n:'괴수 수',v:1,min:.3,max:3,st:.1},
  ehp:{n:'괴수 체력',v:1,min:.3,max:3,st:.1},
  edmg:{n:'괴수 공격',v:1,min:.2,max:3,st:.1},
  bhp:{n:'보스 체력',v:1,min:.2,max:4,st:.1},
  xp:{n:'레벨 오르는 속도',v:1,min:.3,max:3,st:.1},
  might:{n:'내 공격력',v:1,min:.3,max:3,st:.1},
  speed:{n:'내 이동 속도',v:1,min:.6,max:2,st:.05},
  shard:{n:'기억 조각 얻는 양',v:1,min:.2,max:5,st:.1},
  loot:{n:'파이널 뒤 남는 시간(초)',v:180,min:30,max:600,st:10},
  night:{n:'거리 밝기(밤 저승 빛)',v:1,min:.4,max:2.5,st:.05},
  nsat:{n:'거리 색 진하기',v:1,min:0,max:1.8,st:.05},
  newb:{n:'새 사람 불씨 가호 세기',v:1,min:0,max:2,st:.1},
  ptxp:{n:'파티원 곁 경험 더(비율)',v:.15,min:0,max:1,st:.05},
  bcv:{n:'바코드 각성 방식 (0 예전 · 1 쓰러지면 터짐 · 2 쌓이면 터짐)',v:1,min:0,max:2,st:1},
  grade:{n:'화면 색감 필터 세기 (0 끔)',v:1,min:0,max:1.5,st:.05},
  ink:{n:'먹 외곽선 굵기 (0 끔)',v:1,min:0,max:2.5,st:.05},
  epop:{n:'괴수 색 진하기',v:1,min:0,max:2,st:.05}}; // v2.32 (44번 A7): 11-17 기획자 ㄱ — 기본 1 쓰러지면 터짐
const TU=k=>(SV.tune&&typeof SV.tune[k]==='number'?SV.tune[k]:TUNE_DEF[k].v);
// v2.24 새 사람 불씨 가호: 처음 걷는 사람은 강화가 없어 1분 반이면 쓰러졌다(33 2장). 산 강화 칸이 10개가 될 때까지 서서히 옅어진다.
const newbK=()=>{ if((SV.ash||0)>0||location.search.includes('nonewb')) return 0; return Math.max(0,1-(SV.bought||0)/10)*TU('newb'); };

/* ============ 텍스처 ============ */
function tex(c){ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }
const ART = makeArt();
// v2.2 새 기술 그림 (코드로 그린 종이 인형)
function yutC(){ const c=mk(32,96), x=c.getContext('2d'); x.lineWidth=4; x.strokeStyle='#140d14'; x.fillStyle='#e8cf9a'; x.beginPath(); x.roundRect(6,4,20,88,9); x.fill(); x.stroke();
  x.fillStyle='#8a5a1e'; for(let i=0;i<3;i++){ x.beginPath(); x.moveTo(11,24+i*22); x.lineTo(21,30+i*22); x.lineTo(11,36+i*22); x.fill(); } return c; }
function totemC(){ const c=mk(64,160), x=c.getContext('2d'); x.lineWidth=5; x.strokeStyle='#140d14'; x.fillStyle='#7a5a3a'; x.beginPath(); x.roundRect(14,10,36,146,10); x.fill(); x.stroke();
  x.fillStyle='#2a1a12'; x.fillRect(14,4,36,14); x.strokeRect(14,4,36,14);
  x.fillStyle='#140d14'; x.beginPath(); x.ellipse(25,40,5,7,0,0,7); x.ellipse(39,40,5,7,0,0,7); x.fill(); x.fillStyle='#f4efe0'; x.fillRect(22,58,20,6); x.fillStyle='#140d14'; for(let i=0;i<4;i++) x.fillRect(23+i*5,58,2,6);
  x.fillStyle='#d02a40'; x.font='bold 13px sans-serif'; x.textAlign='center'; ['天','下','大'].forEach((ch,i)=>x.fillText(ch,32,92+i*18)); return c; }
function kiteC(){ const c=mk(80,96), x=c.getContext('2d'); x.lineWidth=4; x.strokeStyle='#140d14'; x.fillStyle='#f4efe0'; x.fillRect(8,6,64,80); x.strokeRect(8,6,64,80);
  x.fillStyle='#d02a40'; x.fillRect(8,6,64,14); x.fillStyle='#2a5aa8'; x.fillRect(8,72,64,14); x.fillStyle='#07060c'; x.beginPath(); x.arc(40,46,13,0,7); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(8,6); x.lineTo(72,86); x.moveTo(72,6); x.lineTo(8,86); x.lineWidth=2; x.stroke(); return c; }
function topC(){ const c=mk(64,64), x=c.getContext('2d'); x.lineWidth=4; x.strokeStyle='#140d14'; const g=x.createLinearGradient(0,0,64,0); g.addColorStop(0,'#d02a40'); g.addColorStop(.5,'#f4b740'); g.addColorStop(1,'#2a5aa8');
  x.fillStyle=g; x.beginPath(); x.moveTo(6,22); x.lineTo(58,22); x.lineTo(32,60); x.closePath(); x.fill(); x.stroke(); x.fillStyle='#7a5a3a'; x.beginPath(); x.ellipse(32,22,26,8,0,0,7); x.fill(); x.stroke(); return c; }
function arrowC(){ const c=mk(128,24), x=c.getContext('2d'); x.strokeStyle='#e8cf9a'; x.lineWidth=4; x.beginPath(); x.moveTo(10,12); x.lineTo(108,12); x.stroke();
  x.fillStyle='#ece1cc'; x.beginPath(); x.moveTo(128,12); x.lineTo(104,3); x.lineTo(108,12); x.lineTo(104,21); x.fill(); x.fillStyle='#d02a40'; x.fillRect(4,4,16,5); x.fillRect(4,15,16,5); return c; }
function ropeC(){ const c=mk(32,32), x=c.getContext('2d'); x.fillStyle='#c8a860'; x.beginPath(); x.arc(16,16,7,0,7); x.fill(); x.strokeStyle='#140d14'; x.lineWidth=2; x.stroke(); return c; }
function pepperC(){ const c=mk(32,48), x=c.getContext('2d'); x.fillStyle='#d02a40'; x.beginPath(); x.ellipse(16,28,6,15,0,0,7); x.fill(); x.strokeStyle='#140d14'; x.lineWidth=2; x.stroke(); x.fillStyle='#3a7a3a'; x.fillRect(13,6,6,8); return c; }
// v2.2 복조리 (화면의 기억 조각을 한꺼번에 쓸어 담는다)
function joriC(){ const c=mk(96,96), x=c.getContext('2d'); const g=x.createRadialGradient(48,50,6,48,50,46); g.addColorStop(0,'rgba(255,220,120,.55)'); g.addColorStop(1,'rgba(255,200,80,0)'); x.fillStyle=g; x.fillRect(0,0,96,96);
  x.lineWidth=5; x.strokeStyle='#140d14'; x.fillStyle='#c8913a'; x.beginPath(); x.moveTo(20,40); x.quadraticCurveTo(48,86,76,40); x.quadraticCurveTo(48,52,20,40); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle='#8a5a1e'; x.lineWidth=2; for(let i=0;i<5;i++){ x.beginPath(); x.moveTo(26+i*10,44); x.lineTo(34+i*6,66); x.stroke(); }
  x.lineWidth=6; x.strokeStyle='#140d14'; x.beginPath(); x.moveTo(48,48); x.lineTo(62,10); x.stroke(); x.lineWidth=3; x.strokeStyle='#d8a85a'; x.beginPath(); x.moveTo(48,48); x.lineTo(62,10); x.stroke();
  x.fillStyle='#d02a40'; x.fillRect(53,22,9,6); return c; }
// v2.9.2b 적의 공격 = 빨강 + 검은 테두리(경고 바닥·탄) · 내 공격 = 금빛·하양 빛 — 기획자 평 「캐릭터 공격과 몬스터 공격이 구분이 안 된다」
function dangerC(){ const c=mk(128,128), x=c.getContext('2d'); x.fillStyle='rgba(214,28,44,.42)'; x.beginPath(); x.arc(64,64,60,0,7); x.fill();
  x.strokeStyle='rgba(40,6,10,.9)'; x.lineWidth=7; x.beginPath(); x.arc(64,64,59,0,7); x.stroke(); x.strokeStyle='rgba(255,60,70,1)'; x.lineWidth=4; x.beginPath(); x.arc(64,64,57,0,7); x.stroke();
  x.strokeStyle='rgba(255,90,100,.7)'; x.lineWidth=3; for(let i=-3;i<=3;i++){ x.beginPath(); x.moveTo(64+i*16-40,104); x.lineTo(64+i*16+40,24); x.stroke(); } x.globalCompositeOperation='destination-in'; x.beginPath(); x.arc(64,64,61,0,7); x.fill(); return c; }
function dlineC(){ const c=mk(64,256), x=c.getContext('2d'); x.fillStyle='rgba(214,28,44,.32)'; x.fillRect(6,0,52,256); x.fillStyle='rgba(40,6,10,.9)'; x.fillRect(0,0,6,256); x.fillRect(58,0,6,256);
  x.fillStyle='rgba(255,60,70,1)'; x.fillRect(5,0,3,256); x.fillRect(56,0,3,256); x.strokeStyle='rgba(255,80,90,.85)'; x.lineWidth=6; x.lineJoin='miter';
  for(let y=20;y<256;y+=44){ x.beginPath(); x.moveTo(14,y+18); x.lineTo(32,y); x.lineTo(50,y+18); x.stroke(); } return c; }
function eshotC(){ const c=mk(64,64), x=c.getContext('2d'); x.fillStyle='#1a0408'; x.beginPath(); x.arc(32,32,27,0,7); x.fill();
  const g=x.createRadialGradient(26,26,2,32,32,22); g.addColorStop(0,'#ffd0d4'); g.addColorStop(.35,'#ff3a4c'); g.addColorStop(1,'#8a0a1c'); x.fillStyle=g; x.beginPath(); x.arc(32,32,21,0,7); x.fill();
  x.strokeStyle='#ff6a78'; x.lineWidth=2; x.beginPath(); x.arc(32,32,24,0,7); x.stroke(); return c; }
const T = {
  halo:tex(radial()), shadow:tex(shadowC()), ring:tex(ringC()), line:tex(lineC()),
  axe:tex(axeTex()), gem:tex(gemTex()), gemBig:tex(bigGemTex()), ember:tex(emberTex()), jori:tex(joriC()), yut:tex(yutC()), totem:tex(totemC()), kite:tex(kiteC()), top:tex(topC()), arrow:tex(arrowC()), rope:tex(ropeC()), pepper:tex(pepperC()),
  salt:tex(saltC()), bean:tex(beanC()), talis:tex(talisC()), puddle:tex(puddleC()), fan:tex(fanC()), mark:tex(markC()),
  danger:tex(dangerC()), dline:tex(dlineC()), eshot:tex(eshotC()),
  flames:ART.flames.map(tex)
};
const ldr=new THREE.TextureLoader();
function ltex(src){ const t=ldr.load(src); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }
/* AI 그림 (제미나이). [그림, 빛 지도, 너비, 높이] */
const AI={
  shade:['img/shade.webp','img/shade_g.webp',324,360], elite:['img/elite.webp','img/elite_g.webp',416,480],
  wisp:['img/wisp.webp','img/wisp_g.webp',251,360], toad:['img/toad.webp',null,335,300], magpie:['img/magpie.webp',null,332,300]
};
for(const k of ['shade','elite','wisp','toad','magpie']){ const a=AI[k]; ART[k].tex=[ltex(a[0])]; ART[k].gtex=a[1]?ltex(a[1]):tex(ART[k].glow); ART[k].w=a[2]; ART[k].h=a[3]; }
// v2.5 설화 괴수 (15 문서 4장 문헌 근거): 야광귀·강철이·금돼지
const AI2={ gwijol:['img/gwijol.webp','img/gwijol_g.webp',521,404], mokrang:['img/mokrang.webp','img/mokrang_g.webp',408,460], imae:['img/imae.webp',null,433,440], mangryang:['img/mangryang.webp',null,477,440], yagwang:['img/yagwang.webp','img/yagwang_g.webp',402,420], gangcheol:['img/gangcheol.webp','img/gangcheol_g.webp',559,520], gpig:['img/gpig.webp',null,466,420], yeongno:['img/yeongno.webp','img/yeongno_g.webp',470,480],
  // v2.48 지역 일반 괴수 그림(61번, 제미나이): 여우·화마 새 그림, 새끼들은 보스 그림을 작게
  fox:['img/fox.webp','img/fox_g.webp',532,335], hwama:['img/hwama.webp','img/hwama_g.webp',337,420], jineA:['img/jine.webp',null,558,530], bulgaeA:['img/bulgae.webp',null,536,553], gureongA:['img/gureong.webp',null,530,481], bulsaeA:['img/bulgasari.webp',null,534,527] }; // v2.16 영노(탈춤 설화)
const blankT=(()=>{ const c=document.createElement('canvas'); c.width=c.height=4; return tex(c); })();
for(const k in AI2){ const a=AI2[k]; ART[k]={tex:[ltex(a[0])],gtex:a[1]?ltex(a[1]):blankT,w:a[2],h:a[3]}; }
const PLAYER_H=1.75;
const HUBD_SZ={hub_bldg:[215,543],hub_car:[244,400]}; // v2.46 거점 소품 그림 크기
const BUL_W=534, BUL_H=527, FALLEN_W=367, FALLEN_H=520, KEEP_W=539, KEEP_H=520; // 그림 크기(빌드 때 실제 값으로)
function viewSet(defs){ const out={}; for(const v in defs){ const [src,g,w,h,wk]=defs[v]; const t=ltex(src);
  out[v]={tex:[t,t,t,t],gtex:g?ltex(g):null,geo:new THREE.PlaneGeometry(PLAYER_H*w/h,PLAYER_H).translate(0,PLAYER_H/2,0)};
  // v2.6 걷기 그림(제미나이 영상에서 뽑은 6장): wk={n,pre,w,h,glow}
  if(wk){ const T6=[],G6=[]; for(let i=0;i<wk.n;i++){ T6.push(ltex(`${wk.pre}${i}.webp`)); if(wk.glow) G6.push(ltex(`${wk.pre}${i}_g.webp`)); }
    out[v].walk={tex:T6,gtex:wk.glow?G6:null,flip:!!wk.flip,geo:new THREE.PlaneGeometry(PLAYER_H*1.04*wk.w/wk.h,PLAYER_H*1.04).translate(0,PLAYER_H*1.04/2,0)}; } } return out; }

/* ============ 캐릭터 ============ */
const CHARS={
  fire:{name:'소방관 한도윤',short:'소방관',start:'axe',passive:'구조 본능',pdesc:'체력이 절반 아래면 받는 피해 -25%',
    lock:'처음부터',unlock:()=>true,img:'img/player_front.webp',
    views:{front:['img/player_front.webp','img/player_front_g.webp',366,520,{n:6,pre:'img/fire_front_w',w:395,h:520,glow:true,flip:true}],side:['img/player_side.webp','img/player_side_g.webp',367,520,{n:6,pre:'img/fire_side_w',w:382,h:520,glow:true}],back:['img/player_back.webp','img/player_back_g.webp',370,520,{n:6,pre:'img/fire_back_w',w:359,h:520,glow:true}]},light:0xffc070},
  clerk:{name:'알바생 서지우',short:'알바생',start:'barcode',passive:'야간 근무',pdesc:'1분 버틸 때마다 공격 간격 -3% (최대 -30%)',
    lock:'구미호를 한 번 보내면',unlock:()=>!!SV.cleared.namsan,img:'img/clerk2_front.webp',
    // v2.58 (11-19 기획자 ㄱ): 여자로 보이게 다시 그림 — 긴 포니테일·짧은 회색 후드·노란 조끼·슬림 청바지. 걷기 6장은 새로 뽑을 때까지 정지 그림 + 걸음 흔들기
    views:{front:['img/clerk2_front.webp',null,255,520],side:['img/clerk2_side.webp',null,226,520],back:['img/clerk2_back.webp',null,224,520]},light:0xbfe4ff},
  taxi:{name:'택시 기사 최만수',short:'택시 기사',start:'horn',passive:'25년 운전',pdesc:'한 방향으로 달릴수록 빨라지고, 2초 넘게 달리면 몸으로 들이받는다',
    lock:'불가사리를 한 번 보내면',unlock:()=>!!SV.cleared.seoulst,img:'img/taxi_front.webp',
    views:{front:['img/taxi_front.webp',null,368,520,{n:6,pre:'img/taxi_front_w',w:384,h:520,flip:true}],side:['img/taxi_side.webp',null,375,520,{n:6,pre:'img/taxi_side_w',w:387,h:520}],back:['img/taxi_back.webp',null,370,520,{n:6,pre:'img/taxi_back_w',w:363,h:520}]},light:0xffb060},
  gosi:{name:'고시원 남자 이정호',short:'고시원 남자',start:'talis',passive:'혼자',pdesc:'회복 -50%, 경험치 +30% (어려움)',lock:'도깨비를 한 번 보내면',unlock:()=>!!(SV.cleared.myeong||SV.cleared.suwon),img:'img/gosi_front.webp',
    views:{front:['img/gosi_front.webp','img/gosi_front_g.webp',295,520],side:['img/gosi_side_w2.webp','img/gosi_side_w2_g.webp',295,520,{n:6,pre:'img/gosi_side_w',w:295,h:520,glow:true}],back:['img/gosi_back.webp','img/gosi_back_g.webp',249,520]}},
  // v2.58 새 캐릭터(11-19 기획자 · 65번 9장) — 열림 = 그 지역 파이널 1회(지역 필드 깊이가 처음 열린 기록 또는 장부)
  seoyun:{name:'라디오 DJ 백서윤',short:'라디오 DJ',start:'flute',start2:'orb',passive:'새벽 두 시 방송',pdesc:'1분 버틸 때마다 기술 범위 +5% (최대 +50%)',lock:'남산 파이널(닷발 괴물)을 한 번 보내면',unlock:()=>!!((SV.deep&&SV.deep.namsan)||(SV.ledger&&SV.ledger.bosses&&(SV.ledger.bosses.datbal||SV.ledger.bosses.queen))),img:'img/seoyun_front.webp',
    views:{front:['img/seoyun_front.webp','img/seoyun_front_g.webp',256,520],side:['img/seoyun_side_w2.webp','img/seoyun_side_w2_g.webp',246,520,{n:6,pre:'img/seoyun_side_w',w:246,h:520,glow:true}],back:['img/seoyun_back.webp',null,255,520]},light:0xd8b0ff},
  haram:{name:'한복 대여점 소하람',short:'한복 대여점',start:'fan',passive:'옷 매무새',pdesc:'5초 동안 안 맞으면 매무새가 서서 공격 2배 (맞으면 풀림)',lock:'경복궁 파이널(해치)을 한 번 보내면',unlock:()=>!!((SV.deep&&SV.deep.gyeong)||(SV.ledger&&SV.ledger.bosses&&SV.ledger.bosses.haechi)),img:'img/haram_front.webp',
    views:{front:['img/haram_front.webp','img/haram_front_g.webp',266,520],side:['img/haram_side.webp','img/haram_side_g.webp',237,520],back:['img/haram_back.webp',null,278,520]},light:0xffc4d4}
};
/* v2.58 1인칭 혼잣말(60번 3장 · 65번 4·9장) — 판이 시작되고 조금 뒤 화면 아래에 한 줄. 판마다 다음 줄(SV.mono[캐릭터]).
   1·2막 규칙: 자기 이야기만 · 가족·특정인·인연 보스 기술 모티프 없음 · 「작은 비정함」 한 줄은 상처받은 사람을 가리키지 않게 */
const MONO={
  fire:['출동 벨이 울리면 몸이 먼저 움직여. 그래서 혼자 사는 게 편했어.','원룸 열쇠는 늘 하나뿐이었어. 이상하지, 여기 와서도 주머니에 그게 있어.','무전이 끊기기 전에 마지막으로 들은 건 내 숨소리였어. 아무도 날 부르지 않더라.'],
  clerk:['새벽 네 시가 제일 조용해. 손님도 없고 아무 소리도 없고.','졸업 사진에 나 혼자 웃고 있어. 찍어 줄 사람이 없어서 셀카로.','누가 날 찾으면 모른 척했어. 그게 덜 귀찮았거든.','진열대가 무너질 때 안 무서웠어. 이제 쉬어도 되나 보다.'],
  taxi:['25년, 하루 열네 시간. 차 안이 집이었지. 진짜 집은… 잠만 자는 데.','나는 늘 내려 주고 돌아서는 사람이고.','그날도 빈 차로 돌아오는 길이었어. 조수석은 비어 있었고.'],
  gosi:['합격자 명단에 내 이름은 없었어. 열 번째.','가족 연락처는 지웠어. 지운 줄도 모를 거야.'],
  seoyun:['매일 밤 수만 명한테 말을 걸었어. 날 부르는 목소리는 한 번도 없었고.','방송 끝나면 마이크 끄고 휴대폰도 껐어. 그래야 조용했거든.','듣기 좋은 이야기만 골라 읽었어. 나머지는 내 일이 아니었지.','여기선 내 목소리가 안 울려. 스튜디오보다 조용하네.'],
  haram:['남들 사진 속에서 제일 예쁜 옷을 입혀 줬어. 나는 한 번도 안 찍혔지만.','손님 얼굴은 금방 잊어. 치수랑 색깔만 남아. 그게 편했어.','밤새 다림질하면 손끝이 데여. 여긴 아무것도 안 뜨거워.','구김은 펴면 그만이야. 매무새만 맞으면 아무도 안 물어봐.']};
function monoLines(k){ const L=(MONO[k]||[]).slice(); if(k==='gosi'&&(SV.ep||0)>=5) L.push('벽 너머에서 가끔 두 번, 쿵쿵. 시끄럽다는 뜻이겠지. 그래서 기침도 참았어.'); return L; } // 정호 셋째 줄 = 위험 씨앗(2막 늦게)
function monoNext(k){ const L=monoLines(k); if(!L.length) return ''; const M=SV.mono||(SV.mono={}); const i=(M[k]|0)%L.length; M[k]=i+1; save(); return L[i]; }
function monoShow(t){ if(!t) return; let el=$('monoT'); if(!el){ el=document.createElement('div'); el.id='monoT'; document.body.appendChild(el); } el.textContent=t; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); DBG.mono=t; }
const CHARV={}; for(const k in CHARS) if(CHARS[k].views) CHARV[k]=viewSet(CHARS[k].views);

/* ============ 지역 ============ */
const REGIONS={
  namsan:{name:'남산 아래 들판',boss:'gumiho',scene:'field',mx:130,my:167,desc:'내가 쓰러졌던 자리. 첫 모닥불.',unlock:()=>true},
  seoulst:{name:'서울역 고가',boss:'bulgasari',scene:'overpass',mx:93,my:144,desc:'무너진 고가와 멈춘 철길.',unlock:()=>!!SV.cleared.namsan},
  myeong:{name:'명동 골목',boss:'dokkaebi',scene:'overpass',mx:157,my:93,desc:'불 꺼진 골목. 메밀 냄새, 그리고 깡충거리는 발소리.',unlock:()=>!!SV.cleared.seoulst},
  itaewon:{name:'이태원 언덕',boss:'물귀신',mx:201,my:257,locked:true},
  hangang:{name:'한강 다리',boss:'이무기',mx:283,my:304,locked:true},
  tower:{name:'남산 탑',boss:'저승의 여왕',mx:172,my:164,locked:true,final:true}
};
// v2.7: 지역 난이도 ★ (거리와 따로 — 기획자 결정 '지역마다 섞기')
const STAR={namsan:1,seoulst:3,myeong:2,itaewon:4,hangang:5,tower:5}; // 옛 지도용
const fStar=k=>FIELDS[k]?FIELDS[k].star:(STAR[k]||1);
function starInfo(k){ const st=fStar(k), d=st-fireLv(); return {st,txt:'★'.repeat(st)+'☆'.repeat(5-st),c:d<=0?'#7ee08a':d===1?'#f4d040':'#ff6a6a',w:d<=0?'쉬움':d===1?'적정':'위험'}; }
const BOSSDEF={
  gumiho:{name:'구미호',hp:3000,H:3.3,views:{front:['img/gumiho_front.webp',630,640],side:['img/gumiho_side.webp',640,632],back:['img/gumiho_back.webp',631,640],atk:['img/gumiho_atk.webp',833,588,1.05]},col:0x33dcc8,shot:[.2,1,.88],line:'여우 울음이 밤을 가른다',bye:'구미호를 보냈다',left:'꼬리 하나'},
  bulgasari:{name:'불가사리',hp:2700,H:3.4,views:{front:['img/bulgasari.webp',BUL_W,BUL_H],atk:['img/bul_atk.webp',607,640,1.2]},col:0xff9a50,shot:[1,.62,.3],line:'쇠를 씹는 소리가 다가온다',bye:'불가사리를 보냈다',left:'쇠 바늘 하나'},
  // v2.3 도깨비: 옛 설화의 도깨비(외다리로 깡충, 도깨비불, 장난, 방망이). 뿔·가시 방망이 없음(02 규칙 8)
  dokkaebi:{name:'도깨비',hp:4200,H:3.5,views:{front:['img/dok_front.webp',531,545],side:['img/dok_side.webp',531,545],back:['img/dok_back.webp',531,545],atk:['img/dok_atk.webp',513,640,1.22]},col:0x6ab0ff,shot:[.4,.65,1],line:'깡충, 깡충. 외다리 발소리가 골목을 울린다',bye:'도깨비를 보냈다',left:'닳은 방망이 조각'},
  // v2.16 이무기: 용이 되지 못한 큰 뱀(옛 설화). 물속으로 숨었다 솟구치고, 꼬리로 휩쓸고, 물을 뿜는다. 다리·뿔 없음
  imugi:{name:'이무기',hp:3600,H:3.9,views:{front:['img/imugi.webp',673,640],atk:['img/imugi_rise.webp',543,565,1.15]},col:0x6aa8ff,shot:[.45,.75,1],line:'물비린내가 짙어진다 · 천 년을 기다린 것이 고개를 든다',bye:'이무기를 보냈다',left:'젖은 비늘 한 장'}, // 한강 몫으로 아껴 둠(기획자 11-14 ㄴ)
  // v2.16b 호랑이: 해와 달이 된 오누이의 호랑이(옛이야기). 빙빙 돌며 노리다 할퀴고, 덮치고, 포효로 발을 굳히고, 어둠에 숨어 뒤에서 덮친다 = 수원 파이널
  // v2.48 서울 5지역 새 보스(61번) — kit: 뼈대(움직임·부채탄·고리탄·돌진·내려찍기·불러내기) + 원전 기믹 한 줄(gim). 그림은 임시(지금 그림 + tint)
  jine:{name:'큰 지네',hp:3000,H:2.6,views:{front:['img/jine.webp',558,530]},col:0xd07040,shot:[1,.5,.3],line:'수많은 발이 바닥을 긁는다',bye:'큰 지네를 보냈다',left:'마디 껍질',kit:{mv:'chase',sp:2.3,fan:[5,.22,6,2.6],dash:[5.5,16,.7],gim:'segments'}},
  yagwangK:{name:'야광귀 우두머리',hp:2700,H:2.6,views:{front:['img/yagwang.webp',402,420]},tint:[.75,.7,1],col:0x8a8aff,shot:[.55,.55,1],line:'체 구멍을 셀 것이 필요하다',bye:'야광귀 우두머리를 보냈다',left:'낡은 체',kit:{mv:'circle',sp:3.2,ring:[12,4.6,4.5],dash:[4.5,18,.5],gim:'steal'}},
  giltal:{name:'길달',hp:2600,H:2.8,views:{front:['img/giltal.webp',525,502]},col:0x9a7ad0,shot:[.7,.5,1],line:'귀신 무리의 우두머리가 휘파람을 분다',bye:'길달을 보냈다',left:'여우 털 한 줌',kit:{mv:'keep',kr:[3.5,6.5],sp:2.4,fan:[7,.2,5.8,2.4],sum:['gwijol',0,7],gim:'flee'}},
  agwi:{name:'타락한 아귀',hp:3200,H:3.0,views:{front:['img/agwi.webp',468,530]},col:0xe08a40,shot:[1,.55,.25],line:'먹으려 하면 불이 된다 · 바닥에 떨어지는 불을 피하라',bye:'타락한 아귀를 보냈다',left:'바늘 같은 목',kit:{mv:'chase',sp:1.7,ring:[14,4.2,5],slam:[5,4,28],gim:'fireLob'}},
  dueok:{name:'타락한 두억시니',hp:3300,H:3.0,views:{front:['img/dueok.webp',545,506]},col:0xa060e0,shot:[.7,.4,1],line:'사납게 들이받는 것 · 벽에 박히면 멈춘다',bye:'타락한 두억시니를 보냈다',left:'부러진 뿔 조각',kit:{mv:'chase',sp:1.9,fan:[5,.25,6,3.2],dash:[2.8,19,.9],gim:'ram'}},
  bibi:{name:'큰 비비',hp:4300,H:3.8,views:{front:['img/yeongno.webp',470,480]},tint:[1,.9,.9],col:0x60d090,shot:[.4,1,.6],line:'백을 채우면 하늘로 오른다 · 삼킬수록 커진다',bye:'큰 비비를 보냈다',left:'찢어진 탈 조각',kit:{mv:'chase',sp:1.5,ring:[16,4,5.5],slam:[6,4.6,32],gim:'devour'}},
  mulgwi:{name:'타락한 물귀신',hp:3000,H:3.0,views:{front:['img/mulgwi.webp',548,544]},col:0x5aa0e0,shot:[.4,.7,1],line:'물 끓는 소리 · 웅얼거림 · 끌려가지 마라',bye:'타락한 물귀신을 보냈다',left:'젖은 물풀',kit:{mv:'keep',sp:2,ring:[18,3.8,4.5],gim:'pull'}},
  jireongi:{name:'큰 지렁이',hp:3100,H:3.2,views:{front:['img/jireongi.webp',330,551]},col:0xd07a70,shot:[1,.6,.55],line:'땅이 꿈틀댄다 · 발밑을 조심하라',bye:'큰 지렁이를 보냈다',left:'흙 묻은 허물',kit:{mv:'chase',sp:1.6,fan:[6,.2,5.5,3],gim:'burrow'}},
  gyoryong:{name:'교룡',hp:3400,H:3.5,views:{front:['img/gyoryong.webp',554,504]},col:0x50d070,shot:[.4,1,.45],line:'연못이 끓는다 · 독 안개를 피하라',bye:'교룡을 보냈다',left:'푸른 비늘',kit:{mv:'circle',sp:2.2,ring:[14,4.4,4.8],dash:[6,15,.8],gim:'poison'}},
  mulgoe:{name:'물괴',hp:3300,H:2.8,views:{front:['img/mulgoe.webp',547,454]},col:0x9a9080,shot:[.8,.75,.6],line:'망아지만 한 것이 궁에서 나왔다 · 비린내가 난다',bye:'물괴를 보냈다',left:'비린 털 뭉치',kit:{mv:'circle',sp:3,fan:[5,.25,6.5,2.4],dash:[4,19,.55],gim:'blink'}},
  haechi:{name:'타락한 해치',hp:4600,H:3.0,views:{front:['img/haechi.webp',525,515]},col:0xffa040,shot:[1,.6,.25],line:'불을 먹는 돌짐승이 깨어난다 · 숨을 들이켤 때 멀리 떨어져라',bye:'타락한 해치를 보냈다',left:'식은 돌 비늘',kit:{mv:'chase',sp:2,fan:[9,.16,6.4,2.4],slam:[5.5,4.4,30],dash:[7,16,.8],gim:'eatfire'}},
  bulgae:{name:'불개',hp:3100,H:2.8,views:{front:['img/bulgae.webp',536,553]},col:0xff6040,shot:[1,.45,.3],line:'하늘을 무는 개 · 짖으면 빛이 사라진다',bye:'불개를 보냈다',left:'그을린 털',kit:{mv:'circle',sp:2.8,fan:[6,.2,6.2,2.2],dash:[4.2,18,.6],gim:'eclipse'}},
  gureong:{name:'구렁이',hp:3300,H:3.2,views:{front:['img/gureong.webp',530,481]},col:0x60a050,shot:[.5,.9,.4],line:'숲의 큰 뱀이 몸을 감는다 · 조여 오는 고리를 빠져나가라',bye:'구렁이를 보냈다',left:'벗은 허물',kit:{mv:'circle',sp:2.2,fan:[5,.24,5.6,3],gim:'coil'}},
  jangseung:{name:'타락한 장승',hp:3600,H:3.4,views:{front:['img/jangseung.webp',494,526]},col:0xd06a8a,shot:[1,.45,.6],line:'길을 막는 것이 뒤틀렸다 · 결계가 돈다',bye:'타락한 장승을 보냈다',left:'갈라진 나뭇조각',kit:{mv:'still',sp:.6,ring:[16,3.6,4],sum:['shade',10,9],gim:'barrier'}},
  datbal:{name:'닷발 괴물',hp:4400,H:3.8,views:{front:['img/datbal.webp',578,400]},col:0x8a70b0,shot:[.6,.45,.8],line:'주둥이 닷 발, 꽁지 닷 발 · 길게 찌른다',bye:'닷발 괴물을 보냈다',left:'긴 깃털',kit:{mv:'keep',sp:2.6,fan:[7,.18,6.4,2.6],slam:[6,4.6,30],gim:'peck'}},
  queen:{name:'저승의 여왕',hp:6400,H:4.8,views:{front:['img/queen.webp',565,546]},col:0xff80c0,shot:[1,.5,.8],line:'남산을 휘감은 가장 거대한 것',bye:'저승의 여왕을 보냈다',left:'녹아 붙은 자물쇠',kit:{mv:'still',sp:.8,ring:[22,4.2,3.8],fan:[9,.17,6.4,2.8],slam:[7,5.2,34],sum:['wisp',14,10],gim:'queen'}},
  // v2.56 일반 보스 10종(66번 2장) — 지역마다 2종 · 필드를 돌아다님 · 기믹 1. 체력은 nbHp(그 지역 중간보스의 30%)로 정함. 시랑·사슴개는 그림이 없어 불개 그림 + 색(dt)
  chunjwi:{nbk:1,name:'천년 쥐',hp:900,H:2.1,views:{front:['img/chunjwi.webp',540,415]},col:0xc8a070,shot:[1,.85,.5],line:'진열장 사이를 쏘다닌다 · 진짜는 하나',bye:'천년 쥐를 보냈다',left:'긴 손톱',kit:{mv:'circle',sp:3.4,fan:[3,.28,5.6,2.8]}},
  ahopmeori:{nbk:1.35,name:'머리 아홉 괴물',hp:900,H:3.0,views:{front:['img/ahopmeori.webp',540,450]},col:0x9a6ad0,shot:[.75,.45,1],line:'지하 계단에서 올라왔다 · 굴러가는 머리를 막아라',bye:'머리 아홉 괴물을 보냈다',left:'굳은 재',kit:{mv:'chase',sp:1.9,ring:[10,4.2,4.6]}},
  juji:{name:'주지',hp:900,H:2.6,views:{front:['img/juji.webp',540,414]},col:0xe0a040,shot:[1,.7,.3],line:'판을 여는 것이 뛰어든다 · 들이받는다',bye:'주지를 보냈다',left:'털 뭉치',kit:{mv:'circle',sp:3.0,fan:[4,.25,5.8,3]}},
  hyungjo:{name:'흉조 부엉이',hp:900,H:2.4,views:{front:['img/hyungjo.webp',540,406]},col:0x8aa0ff,shot:[.55,.65,1],line:'밤새 운다 · 눈이 빛나면 멈춰 서라',bye:'흉조 부엉이를 보냈다',left:'잿빛 깃털',kit:{mv:'keep',kr:[4,7],sp:2.6,fan:[5,.2,5.4,3.2]}},
  keunmulgogi:{nbk:1.1,name:'세 길 물고기',hp:900,H:2.8,views:{front:['img/keunmulgogi.webp',540,464]},col:0x5ab0e0,shot:[.4,.8,1],line:'강물에서 솟구친다 · 그림자를 피하라',bye:'세 길 물고기를 보냈다',left:'큰 비늘',kit:{mv:'chase',sp:2.2,ring:[10,4,5]}},
  keunjara:{nbk:1.1,name:'큰 자라',hp:900,H:2.2,views:{front:['img/keunjara.webp',540,317]},col:0x70a060,shot:[.55,.9,.45],line:'둑에서 기어 나와 미끄러진다 · 벽 앞에서 비켜라',bye:'큰 자라를 보냈다',left:'등딱지 조각',kit:{mv:'chase',sp:1.6,fan:[3,.3,5,3.4]}},
  okmungaeguri:{nbk:0.88,name:'옥문지 개구리',hp:900,H:2.0,views:{front:['img/okmungaeguri.webp',540,460]},col:0x60c080,shot:[.45,1,.55],line:'세 번 울면 땅이 솟는다',bye:'옥문지 개구리를 보냈다',left:'젖은 물풀',kit:{mv:'keep',kr:[4,7],sp:2.2,ring:[8,4,4.5]}},
  saseumgae:{nbk:0.82,name:'사슴개',hp:900,H:2.4,views:{front:['img/bulgae.webp',536,553]},dt:[.95,.78,.52],col:0xd0a060,shot:[1,.8,.45],line:'왕궁을 향해 짖는다 · 소리 고리의 틈으로',bye:'사슴개를 보냈다',left:'누런 털',kit:{mv:'circle',sp:3.2,fan:[3,.3,5.8,2.8]}},
  kkamagwi:{nbk:0.85,name:'검은 까마귀',hp:900,H:2.4,views:{front:['img/kkamagwi.webp',540,373]},col:0x7a6aa0,shot:[.6,.5,.9],line:'숲 위를 낮게 난다 · 그림자 안만 안전하다',bye:'검은 까마귀를 보냈다',left:'검은 깃',kit:{mv:'circle',sp:3.0,fan:[4,.22,6,3]}},
  sirang:{nbk:0.9,name:'시랑',hp:900,H:2.3,views:{front:['img/bulgae.webp',536,553]},dt:[.6,.56,.5],col:0x9a8a70,shot:[.85,.75,.55],line:'숲길에서 사라졌다 뒤에서 나타난다',bye:'시랑을 보냈다',left:'거친 털',kit:{mv:'circle',sp:3.4,fan:[3,.25,6,2.6]}},
  tiger:{name:'호랑이',hp:3400,H:2.5,views:{front:['img/tiger_front.webp',515,526,1.2],side:['img/tiger.webp',751,405],back:['img/tiger_back.webp',521,556,1.2],atk:['img/tiger_atk.webp',756,396,1.05]},col:0xffb050,shot:[1,.75,.35],line:'풀숲이 낮게 흔들린다 · 무언가 너를 빙빙 돌며 본다',bye:'호랑이를 보냈다',left:'굵은 범 수염'}
};

/* ============ 렌더러 / 카메라 ============ */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!MOBILE,powerPreference:'high-performance'});
// v2.59.1: 멈춘 화면 끊김(기획자 11-19) → 절전 30fps · 보통·높음 제한 없음 | v2.56.4(67번 8장): 화질 절전·보통·높음(SV.gfx) — 폰 기본 절전. 절전 = 해상도 1배 + 가만히 있는 화면 12fps · 보통 = 1.25배 + 20fps · 높음 = 지금까지 그대로. 싸우는 판은 모두 그대로
const GFX={save:{n:'절전',pr:1,idle:30,d:'배터리 아낌'},mid:{n:'보통',pr:1.25,idle:0,d:''},high:{n:'높음',pr:MOBILE?1.5:2,idle:0,d:'선명하게 · 배터리 많이 씀'}}, GFXO=['save','mid','high'];
const gfxK=()=>GFX[SV.gfx]?SV.gfx:(MOBILE?'save':'high'); let LASTD=0;
renderer.setPixelRatio(Math.min(devicePixelRatio, GFX[gfxK()].pr));
renderer.setClearColor(0x07060c);
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x07060c,14,30);
const FOV=34, TF=Math.tan(THREE.MathUtils.degToRad(FOV/2));
const camera=new THREE.PerspectiveCamera(FOV,1,.1,800);
const PITCH=THREE.MathUtils.degToRad(42);
let camD=20, camDF=30; const FZOOM=.88; // v2.36: 지역 필드 카메라를 12% 가까이(괴수 나오는 거리는 camDF 그대로)
const INKPR={value:1}, INKK={value:1}, EPOP={value:1}; // v2.37 먹선(그림 결)
function resize(){
  renderer.setSize(innerWidth,innerHeight,false); INKPR.value=renderer.getPixelRatio(); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  const a=innerWidth/innerHeight; camD=THREE.MathUtils.clamp(12.5/(2*TF*a),19,32);
  camDF=THREE.MathUtils.clamp(15/(2*TF*a),24,44); // 지역 필드: 더 높고 멀리(시험 2)
}
addEventListener('resize',resize); resize();
const bbFace=new THREE.Euler(-PITCH,0,0);
const BBQ=new THREE.Quaternion().setFromEuler(bbFace);
const FLATQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));

/* ============ 빛 ============ */
const amb=new THREE.AmbientLight(0x2a2850,.8); scene.add(amb);
const moon=new THREE.DirectionalLight(0x6f7fd0,.7); moon.position.set(-6,10,-4); scene.add(moon);
const grad=new THREE.DataTexture(new Uint8Array([40,40,40,255,90,90,90,255,170,170,170,255,255,255,255,255]),4,1,THREE.RGBAFormat);
grad.minFilter=grad.magFilter=THREE.NearestFilter; grad.needsUpdate=true;
const toon=(col,o={})=>new THREE.MeshToonMaterial({color:col,gradientMap:grad,...o});
const outlineMat=new THREE.MeshBasicMaterial({color:0x140d14,side:THREE.BackSide});
function outlined(geo,mat,th=.07,om=outlineMat){ const m=new THREE.Mesh(geo,mat); const o=new THREE.Mesh(geo,om); o.scale.setScalar(1+th); m.add(o); return m; }
/* ============ v2.37 그림 결(2-2): 먹 외곽선 통일 + 괴수 테두리색 + 화면 색감 필터 ============
   AI 그림마다 제각각이던 외곽선 위에, 모든 종이 인형(주인공·괴수·보스·사람)에 같은 굵기(화면 픽셀 기준)의 먹선(#140d14)을 두른다.
   먹선 바깥에 얇은 테두리색: 주인공 금 · 잡귀 청록(저승의 것) · 정예·강철이·영노 빨강(위험) · 보물·도둑 크림 · 보스 빨강 굵게 (02번 규칙 4 색의 뜻) */
const INK_GLSL=`
#ifdef USE_MAP
{ vec2 gx=dFdx(vMapUv), gy=dFdy(vMapUv);
  if(sampledDiffuseColor.a<.4&&uInkK>0.){ float w=uInkW*uInkPR*uInkK, rw=(uInkW+uRimW)*uInkPR*uInkK, na=0., nr=0.;
    for(int i=0;i<8;i++){ float an=float(i)*.785398; vec2 o=gx*cos(an)+gy*sin(an);
      na=max(na,textureGrad(map,vMapUv+o*w,gx,gy).a); if(uRimW>0.) nr=max(nr,textureGrad(map,vMapUv+o*rw,gx,gy).a); }
    if(na>.4) diffuseColor=vec4(uInkC,opacity); else if(nr>.4) diffuseColor=vec4(uRimC,opacity); }
  else{ if(uSat>0.){ float k=uSat*uPop; vec3 c=diffuseColor.rgb; float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,1.+.35*k); diffuseColor.rgb=max(vec3(0.),(c-.1)*(1.+.12*k)+.1); }
#if defined(USE_COLOR)&&!defined(USE_COLOR_ALPHA)
    { float fl=clamp(vColor.r-1.5,0.,1.); if(fl>0.) diffuseColor.rgb=mix(diffuseColor.rgb/max(vColor,vec3(.001)),vec3(1.,.96,.88),fl*.85); }
#endif
  }
}
#endif
`;
const INKC=new THREE.Color(0x140d14);
function inkMat(m,o={}){ if(!m||m.userData.ink) return m; m.userData.ink=1;
  const U={uInkW:{value:o.w??1.5},uRimW:{value:o.rw||0},uRimC:{value:new THREE.Color(o.rim??0x140d14)},uInkC:{value:INKC},uSat:{value:o.pop?1:0},uPop:EPOP,uInkPR:INKPR,uInkK:INKK};
  m.userData.inkU=U; const prev=m.onBeforeCompile, pk=m.customProgramCacheKey;
  m.onBeforeCompile=(sh,r)=>{ if(prev) prev.call(m,sh,r); Object.assign(sh.uniforms,U);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uInkW,uRimW,uSat,uPop,uInkPR,uInkK; uniform vec3 uRimC,uInkC;').replace('#include <alphatest_fragment>',INK_GLSL+'#include <alphatest_fragment>'); };
  m.customProgramCacheKey=()=>(pk?pk.call(m):'')+'|ink'; m.needsUpdate=true; return m; }
/* v2.54 움직임(기획자 11-19 00:35 ㄱ): 괴수는 발을 땅에 고정하고 위만 휜다 — 정점 셰이더.
   BND.x = 기울기(위로 갈수록 옆으로 밀림, 높이 배수) · BND.y = 눌림(+면 늘어남, 발은 그대로) · BND.z = 물결 세기(기는 것) · BND.w = 물결 위상
   떼(InstancedMesh)는 괴수마다 aBend, 보스·한 장짜리는 uBend. uFoot = 그림 아래 빈칸(땅 고정 높이) */
function bendMat(m,H,inst){ if(!m||m.userData.bend) return m; const U={uBendH:{value:H},uFoot:{value:.012},uBend:{value:new THREE.Vector4()}}; m.userData.bend=U;
  const prev=m.onBeforeCompile, pk=m.customProgramCacheKey;
  m.onBeforeCompile=(sh,r)=>{ if(prev) prev.call(m,sh,r); Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uBendH,uFoot; uniform vec4 uBend;'+(inst?'\nattribute vec4 aBend;\n#define BND aBend':'\n#define BND uBend'))
      .replace('#include <begin_vertex>',`#include <begin_vertex>
  { float hn=clamp(position.y/uBendH,0.,1.); transformed.y-=uFoot*uBendH;
    transformed.x+=BND.x*uBendH*hn*(.35+.65*hn);
    transformed.y*=1.+BND.y; transformed.x*=1.-BND.y*.5;
    transformed.y+=BND.z*uBendH*sin(position.x/uBendH*7.+BND.w)*hn; }`); };
  m.customProgramCacheKey=()=>(pk?pk.call(m):'')+'|bend'+(inst?1:0); m.needsUpdate=true; return m; }
// 테두리색(밝기를 먹과 섞어 둔 값 — 수백 마리가 네온처럼 번쩍이지 않게)
const RIMC={ gold:new THREE.Color(0xf4b740).lerp(INKC,.25), teal:new THREE.Color(0x33dcc8).lerp(INKC,.5), red:new THREE.Color(0xd02a40).lerp(INKC,.2), cream:new THREE.Color(0xece1cc).lerp(INKC,.3) };
const ERIM={gwijol:['cream',1.3],mokrang:['cream',1.5],imae:['teal',1.4],mangryang:['teal',1.4],shade:['teal',1.3],wisp:['teal',1.3],elite:['red',1.8],gangcheol:['red',1.8],yeongno:['red',1.8],toad:['cream',1.5],magpie:['cream',1.5],gpig:['cream',1.6],yagwang:['cream',1.5]};
/* 화면 색감 필터: 한 번 그린 장면을 한 장으로 받아 색을 고른다(어두운 곳 남빛 · 불빛만 따뜻하게 · 색 조금 진하게 · 가장자리 어둡게). 실패하면 그냥 그린다 */
const CGR={};
const GRADE_FS=`uniform sampler2D tD; uniform float uK,uAsp; varying vec2 vUv;
vec3 toS(vec3 c){ c=max(c,0.); return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c)); }
void main(){ vec3 c1=toS(texture2D(tD,vUv).rgb), c0=clamp(c1,0.,1.), c=c1;
  c=pow(c,vec3(.93)); c=(c-.38)*1.1+.38; c=mix(c,.82+.18*(1.-exp(-(c-.82)/.18)),step(.82,c)); c=clamp(c,0.,1.); // v2.38b: 밝은 곳 어깨(하얗게 타지 않고 부드럽게)
  float l=dot(c,vec3(.299,.587,.114));
  c+=vec3(-.010,-.014,.028)*(1.-l)*(1.-l);
  float warm=smoothstep(.3,.85,l)*clamp((c.r-c.b)*3.,0.,1.); c*=mix(vec3(1.),vec3(1.08,1.,.86),warm);
  float l2=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l2),c,1.15);
  vec2 q=(vUv-.5)*vec2(uAsp,1.); float v=smoothstep(.4,.95,length(q)*1.3); c*=1.-.42*v;
  gl_FragColor=vec4(mix(c0,clamp(c,0.,1.),uK),1.); }`;
const _gsz=new THREE.Vector2();
function gradeInit(){ const E=renderer.extensions, hf=E.has('EXT_color_buffer_float')||E.has('EXT_color_buffer_half_float');
  CGR.rt=new THREE.WebGLRenderTarget(2,2,{type:hf?THREE.HalfFloatType:THREE.UnsignedByteType,samples:MOBILE?0:4});
  CGR.mat=new THREE.ShaderMaterial({uniforms:{tD:{value:CGR.rt.texture},uK:{value:1},uAsp:{value:1}},vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',fragmentShader:GRADE_FS,depthTest:false,depthWrite:false});
  { const gl=renderer.getContext(); renderer.setRenderTarget(CGR.rt); let ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE; renderer.setRenderTarget(null); // 반정밀 그림판이 안 되는 폰이면 보통 그림판으로, 그것도 안 되면 필터 끔
    if(!ok&&hf){ CGR.rt.dispose(); CGR.rt=new THREE.WebGLRenderTarget(2,2,{samples:MOBILE?0:4}); CGR.mat.uniforms.tD.value=CGR.rt.texture; renderer.setRenderTarget(CGR.rt); ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE; renderer.setRenderTarget(null); }
    if(!ok) CGR.fail=1; }
  const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),CGR.mat); q.frustumCulled=false; CGR.sc=new THREE.Scene(); CGR.sc.add(q); CGR.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1); }
function drawFrame(){ INKK.value=TU('ink'); EPOP.value=TU('epop'); const k=TU('grade');
  if(k<=.01||CGR.fail){ renderer.setRenderTarget(null); renderer.render(scene,camera); return; }
  try{ if(!CGR.rt) gradeInit(); renderer.getDrawingBufferSize(_gsz); if(CGR.rt.width!==_gsz.x||CGR.rt.height!==_gsz.y) CGR.rt.setSize(_gsz.x,_gsz.y);
    CGR.mat.uniforms.uK.value=k; CGR.mat.uniforms.uAsp.value=_gsz.x/_gsz.y;
    renderer.setRenderTarget(CGR.rt); renderer.render(scene,camera); renderer.setRenderTarget(null); renderer.render(CGR.sc,CGR.cam); }
  catch(e){ CGR.fail=1; DBG&&(DBG.gradeErr=String(e)); renderer.setRenderTarget(null); renderer.render(scene,camera); } }
const LIGHTS=[];
function addLight(col,I,R){ const l=new THREE.PointLight(col,I,R*1.6,1.6); scene.add(l); const o={l,c:new THREE.Color(col),I,R,on:true}; LIGHTS.push(o); return o; }
const tint=new THREE.Color();
/* v2.6 손맛: 피해 숫자 · 잠깐 멈춤(HS) */
let HS=0; const _v2=new THREE.Vector3();
const DNP=[]; let dnI=0, dnFrame=0;
function dnInit(){ const L=document.getElementById('dmgL'); if(!L||DNP.length) return; for(let i=0;i<40;i++){ const el=document.createElement('span'); el.className='dn'; L.appendChild(el); DNP.push({el,life:0,x:0,y:0,z:0}); } }
const DNFS={big:21,mid:15,hurt:19,gold:20};
function dnum(x,y,z,txt,cls=''){ if(!DNP.length||dnFrame>4) return; dnFrame++; const d=DNP[dnI=(dnI+1)%DNP.length]; d.x=x; d.y=y; d.z=z; d.life=.8; d.el.textContent=txt; d.el.className='dn'+(cls?' '+cls.replace(/(\S+)/g,'n-$1'):'');
  // v2.38 손맛: 다른 숫자와 겹치지 않는 자리를 고른다(「1717」처럼 붙어 뭉개지던 것). 숫자들은 같은 빠르기로 떠오르니 처음 자리만 비키면 끝까지 안 겹친다
  const fs=Math.max(12,...String(cls).split(' ').map(c=>DNFS[c]||0)); d.w=String(txt).length*fs*.62+8; d.h=fs+4; d.big=fs>=19; d.ox=0; d.oy=0; d.vx=(Math.random()-.5)*16;
  _v2.set(x,y,z).project(camera); const sx=(_v2.x*.5+.5)*innerWidth, sy=(-_v2.y*.5+.5)*innerHeight, W=d.w, H=d.h;
  const C=[[0,0],[W*.65,-H*.45],[-W*.65,-H*.45],[0,-H],[W*.95,H*.1],[-W*.95,H*.1],[W*.5,-H*1.4],[-W*.5,-H*1.4],[0,-H*2],[W*1.2,-H],[-W*1.2,-H],[0,H]];
  let bs=1e9; for(const [ox,oy] of C){ let o=0; const ax=sx+ox, ay=sy+oy; for(const q of DNP){ if(q===d||q.life<=.12||q.cx==null) continue; const w=Math.min(ax+W/2,q.cx+q.w/2)-Math.max(ax-W/2,q.cx-q.w/2), h=Math.min(ay+H/2,q.cy+q.h/2)-Math.max(ay-H/2,q.cy-q.h/2); if(w>0&&h>0) o+=w*h; }
    const sc=o+Math.hypot(ox,oy)*.5; if(sc<bs){ bs=sc; d.ox=ox; d.oy=oy; } if(o===0) break; }
  d.cx=sx+d.ox; d.cy=sy+d.oy; }
function dnDraw(dt){ dnFrame=0; hsF=0; for(const d of DNP){ if(d.life<=0){ if(d.on){ d.on=false; d.el.style.opacity=0; d.cx=null; } continue; } d.on=true; d.life-=dt; d.y+=dt*1.5; _v2.set(d.x,d.y,d.z).project(camera);
  const age=.8-d.life, pop=Math.max(0,1-age/.13), s=1+(d.big?.85:.5)*pop*pop; d.ox+=d.vx*dt;
  const sx=(_v2.x*.5+.5)*innerWidth+d.ox, sy=(-_v2.y*.5+.5)*innerHeight+d.oy; d.cx=sx; d.cy=sy; d.el.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%) scale(${s.toFixed(2)})`; d.el.style.opacity=Math.min(1,d.life*2.5)*Math.max(0,Math.min(1,(sy-72)/34)); } } // v2.15: 위쪽 글줄 위로는 안 보이게
function lightAt(x,z,out){
  if(FIELD){ const b=Math.min(1.45,TU('night')); out.setRGB(NIGHT.base[0]*b,NIGHT.base[1]*b,NIGHT.base[2]*b); } else out.setRGB(.2,.2,.32);
  for(const L of LIGHTS){ if(!L.on) continue; const lp=L.l.position; const d=Math.hypot(lp.x-x,lp.z-z); if(d>=L.R) continue; const k=1-d/L.R, f=k*k*L.l.intensity/18;
    out.r+=L.c.r*f; out.g+=L.c.g*f; out.b+=L.c.b*f; }
  out.r=Math.min(1,out.r); out.g=Math.min(1,out.g); out.b=Math.min(1,out.b); return out;
}

/* ============ 땅과 풍경 (지역마다 다름) ============ */
const ARENA=64;
const gtField=tex(groundC()); gtField.wrapS=gtField.wrapT=THREE.RepeatWrapping; gtField.repeat.set(26,26);
const gtCon=tex(concreteC()); gtCon.wrapS=gtCon.wrapT=THREE.RepeatWrapping; gtCon.repeat.set(22,22);
const groundMat=toon(0xffffff,{map:gtField});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(220,220),groundMat); ground.rotation.x=-Math.PI/2; scene.add(ground);
const fieldG=new THREE.Group(), overG=new THREE.Group(); scene.add(fieldG,overG);
function jitter(geo,a){ const p=geo.attributes.position; for(let i=0;i<p.count;i++){ p.setXYZ(i,p.getX(i)+rr(-a,a),p.getY(i)+rr(-a,a)*.6,p.getZ(i)+rr(-a,a)); } geo.computeVertexNormals(); return geo; }
const treeMat=toon(0x2f6658),treeMat2=toon(0x27554f),trunkMat=toon(0x3a2620),rockMat=toon(0x5b5a72);
const OCC=[]; // 가리면 반투명해지는 큰 물체
setSeed(11);
(()=>{ // 풀
  const pos=[]; for(let k=0;k<5;k++){ const a=rr(0,6.28),r=rr(0,.08),bx=Math.cos(a)*r,bz=Math.sin(a)*r,h=rr(.22,.42),lean=rr(-.12,.12),w=.045; pos.push(bx-w,0,bz, bx+w,0,bz, bx+lean,h,bz+lean*.5); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals();
  const n=MOBILE?2600:4200, im=new THREE.InstancedMesh(g,toon(0x3d6a52,{side:THREE.DoubleSide}),n);
  const M=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),cc=new THREE.Color();
  for(let i=0;i<n;i++){ const a=rr(0,6.28),r=Math.sqrt(rr(.002,1))*ARENA; p.set(Math.cos(a)*r,0,Math.sin(a)*r); if(p.length()<1.6){i--;continue;}
    q.setFromAxisAngle(new THREE.Vector3(0,1,0),rr(0,6.28)); const sc=rr(.7,1.5); s.set(sc,sc*rr(.8,1.3),sc); M.compose(p,q,s); im.setMatrixAt(i,M);
    cc.setHSL(rr(.36,.45),rr(.25,.4),rr(.24,.36)); im.setColorAt(i,cc); }
  fieldG.add(im); })();
const coneGeos=[[1.1,1.25],[.86,1.1],[.6,.95]].map(([r,h])=>[0,1,2].map(()=>jitter(new THREE.ConeGeometry(r,h,7,1),.06)));
const trunkGeo=new THREE.CylinderGeometry(.12,.18,.9,6);
function occMats(list){ const ms=list.map(m=>{ const c=m.clone(); c.transparent=true; return c; }); return ms; }
function tree(x,z,s){
  const g=new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  const ms=occMats([trunkMat,treeMat,treeMat2,outlineMat]);
  const tr=outlined(trunkGeo,ms[0],.12,ms[3]); tr.position.y=.45; g.add(tr);
  [1.05,1.65,2.2].forEach((y,i)=>{ const c=outlined(coneGeos[i][Math.floor(rnd()*3)],i%2?ms[2]:ms[1],.06,ms[3]); c.position.y=y; c.rotation.y=rr(0,3); g.add(c); });
  g.rotation.z=rr(-.05,.05); fieldG.add(g); OCC.push({g,ms,s,op:1,w:1.7,h:3.6,grp:'field'});
}
function rock(x,z,s,grp=fieldG){ const m=outlined(jitter(new THREE.DodecahedronGeometry(1,0),.12),rockMat,.08); m.scale.set(s,s*rr(.55,.8),s*rr(.8,1.1)); m.position.set(x,s*.35,z); m.rotation.y=rr(0,6); grp.add(m); }
function cairn(x,z){ let y=0; [.55,.45,.36,.28,.2].forEach(s=>{ const m=outlined(jitter(new THREE.DodecahedronGeometry(1,0),.08),rockMat,.08); m.scale.set(s,s*.45,s); m.position.set(x+rr(-.04,.04),y+s*.45,z); m.rotation.y=rr(0,6); fieldG.add(m); y+=s*.8; }); }
setSeed(21);
for(let i=0;i<(MOBILE?110:160);i++){ const a=rr(0,6.28),r=rr(7,ARENA+8); tree(Math.cos(a)*r,Math.sin(a)*r,rr(.9,1.6)); }
for(let i=0;i<10;i++){ const a=i/10*6.28; tree(Math.cos(a)*(ARENA+3),Math.sin(a)*(ARENA+3),1.8); }
tree(-6.5,-5.5,1.3); tree(7.2,-6.5,1.15); tree(-8,4,1.2);
for(let i=0;i<50;i++){ const a=rr(0,6.28),r=rr(3.5,ARENA); rock(Math.cos(a)*r,Math.sin(a)*r,rr(.2,.6)); }
cairn(-3.2,-2.4); cairn(14,-9); cairn(-16,12); cairn(22,18); cairn(-25,-20);
// 쓰러진 소방차 (내가 죽은 자리, 06 6-0)
(()=>{ const g=new THREE.Group(); g.position.set(3.4,0,-3.6); g.rotation.y=.5; g.rotation.z=.18; g.scale.setScalar(.8);
  const red=toon(0x6e2420), dark=toon(0x2a2232), metal=toon(0x6a6a7a);
  const body=outlined(new THREE.BoxGeometry(3.4,1.2,1.4),red,.04); body.position.y=.85; g.add(body);
  const cab=outlined(new THREE.BoxGeometry(1.1,1.0,1.36),red,.05); cab.position.set(1.95,.9,0); g.add(cab);
  const win=new THREE.Mesh(new THREE.BoxGeometry(.05,.45,1.1),dark); win.position.set(2.52,1.1,0); g.add(win);
  const lad=outlined(new THREE.BoxGeometry(2.8,.12,.5),metal,.08); lad.position.set(-.2,1.56,0); lad.rotation.z=-.12; g.add(lad);
  for(const [x,z] of [[-1,.72],[1.6,.72],[-1,-.72],[1.6,-.72]]){ const w=outlined(new THREE.CylinderGeometry(.36,.36,.25,10),dark,.08); w.rotation.x=Math.PI/2; w.position.set(x,.36,z); g.add(w); }
  fieldG.add(g);
  const c=mk(256,256),x=c.getContext('2d'); const gg=x.createRadialGradient(128,128,10,128,128,128); gg.addColorStop(0,'rgba(20,12,10,.9)'); gg.addColorStop(1,'rgba(20,12,10,0)'); x.fillStyle=gg; x.fillRect(0,0,256,256);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({map:tex(c),transparent:true,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(3.4,.02,-3.6); fieldG.add(m);
})();
// 서울역 고가: 무너진 기둥, 철길, 버려진 차, 꺼진 가로등
(()=>{ setSeed(77); const con=toon(0x5d5d68), conD=toon(0x44444e), rail=toon(0x6a5a50), car=[toon(0x3a4458),toon(0x584038),toon(0x4a4a4a)], glass=toon(0x1c2230);
  for(let i=-7;i<=7;i++){ for(const zz of [-7,7]){ if(Math.random()<.18) continue; const h=rr(2.2,5.5); const ms=occMats([con,outlineMat]);
      const g=new THREE.Group(); g.position.set(i*8+rr(-.5,.5),0,zz+rr(-.5,.5)); const p=outlined(jitter(new THREE.BoxGeometry(1.3,h,1.3,1,3,1),.08),ms[0],.05,ms[1]); p.position.y=h/2; g.add(p);
      if(h>3.5){ const cap=outlined(jitter(new THREE.BoxGeometry(2.6,.5,1.6),.12),ms[0],.05,ms[1]); cap.position.y=h; cap.rotation.z=rr(-.25,.25); g.add(cap); }
      overG.add(g); OCC.push({g,ms,s:1,op:1,w:1.6,h:h+.5,grp:'over'}); } }
  // 철길 (서울역 쪽)
  for(const zz of [16,18.5]){ for(const side of [-.55,.55]){ const r=new THREE.Mesh(new THREE.BoxGeometry(130,.08,.1),rail); r.position.set(0,.05,zz+side); overG.add(r); }
    for(let x=-64;x<64;x+=1.2){ const s=new THREE.Mesh(new THREE.BoxGeometry(.25,.06,1.6),toon(0x3a2a22)); s.position.set(x,.03,zz); overG.add(s); } }
  // 가드레일 조각
  for(let i=0;i<26;i++){ const g=new THREE.Group(); const a=rr(0,6.28),r=rr(6,ARENA-4); g.position.set(Math.cos(a)*r,0,Math.sin(a)*r); g.rotation.y=rr(0,3.14);
    const b=outlined(new THREE.BoxGeometry(rr(2,4),.22,.08),toon(0x8a8a90),.15); b.position.y=.55; b.rotation.z=rr(-.3,.3); g.add(b);
    for(const px of [-1,1]){ const p=new THREE.Mesh(new THREE.BoxGeometry(.1,.6,.1),conD); p.position.set(px,.3,0); g.add(p); } overG.add(g); }
  // 버려진 차
  for(let i=0;i<16;i++){ const g=new THREE.Group(); const a=rr(0,6.28),r=rr(5,ARENA-5); g.position.set(Math.cos(a)*r,0,Math.sin(a)*r); g.rotation.y=rr(0,6.28); if(Math.random()<.3) g.rotation.z=rr(-.4,.4);
    const m=car[i%3]; const b=outlined(new THREE.BoxGeometry(2.2,.6,1.05),m,.05); b.position.y=.5; g.add(b); const t=outlined(new THREE.BoxGeometry(1.2,.45,.95),m,.06); t.position.set(-.1,.98,0); g.add(t);
    const w=new THREE.Mesh(new THREE.BoxGeometry(1.24,.3,.97),glass); w.position.set(-.1,1.0,0); g.add(w); overG.add(g); }
  // 꺼진 가로등
  for(let i=0;i<14;i++){ const g=new THREE.Group(); const a=rr(0,6.28),r=rr(4,ARENA-4); g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);
    const p=outlined(new THREE.CylinderGeometry(.06,.08,4,6),conD,.2); p.position.y=2; g.add(p); const h=outlined(new THREE.BoxGeometry(.9,.12,.25),conD,.15); h.position.set(.4,4,0); g.add(h); g.rotation.z=rr(-.15,.15); overG.add(g); }
  for(let i=0;i<40;i++){ const a=rr(0,6.28),r=rr(3,ARENA); rock(Math.cos(a)*r,Math.sin(a)*r,rr(.2,.5),overG); }
})();
let worldG=null;
function setScene(kind){ const W=kind==='world', M=!!FIELDS[kind]; fieldG.visible=kind==='field'; overG.visible=kind==='over'||kind==='overpass';
  FIELD=M?getMyeong(kind):null; for(const k in FBUILT) FBUILT[k].G.visible=M&&k===kind; amb.intensity=M?0:.8; moon.intensity=M?0:.7; scene.fog.color.set(M?MY.FOG:0x07060c); renderer.setClearColor(M?MY.FOG:0x07060c); if(window.__moodMotes) window.__moodMotes(M?kind:null); { const sh=$('shopTag'); if(sh&&!M) sh.style.opacity=0; const lt=$('fLootT'); if(lt&&!M) lt.style.display='none'; }
  if(worldG) worldG.visible=W; ground.visible=!W&&!M; if(window.__arenaRing) window.__arenaRing.visible=!W&&!M;
  groundMat.map=fieldG.visible?gtField:gtCon; groundMat.needsUpdate=true; scene.userData.kind=W?'world':M?kind:fieldG.visible?'field':'over'; }
setScene('field');
// 경계: 짙은 안개 고리
(()=>{ const c=mk(256,256),x=c.getContext('2d'); const g=x.createRadialGradient(128,128,0,128,128,128); g.addColorStop(.0,'rgba(7,6,12,0)'); g.addColorStop(.82,'rgba(7,6,12,0)'); g.addColorStop(.92,'rgba(7,6,12,.9)'); g.addColorStop(1,'rgba(7,6,12,1)'); x.fillStyle=g; x.fillRect(0,0,256,256);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(ARENA*2.4,ARENA*2.4),new THREE.MeshBasicMaterial({map:tex(c),transparent:true,depthWrite:false,fog:false})); m.rotation.x=-Math.PI/2; m.position.y=.03; scene.add(m); window.__arenaRing=m; })();

/* ============ 모닥불 ============ */
const fire=new THREE.Group(); scene.add(fire);
for(let i=0;i<9;i++){ const a=i/9*6.28; const m=outlined(jitter(new THREE.DodecahedronGeometry(1,0),.1),rockMat,.1); m.scale.set(.2,.14,.2); m.position.set(Math.cos(a)*.72,.1,Math.sin(a)*.72); fire.add(m); }
const logMat=toon(0x4a2e22);
for(let i=0;i<3;i++){ const m=outlined(new THREE.CylinderGeometry(.09,.1,1.15,6),logMat,.12); m.rotation.z=Math.PI/2; m.rotation.y=i*Math.PI/3; m.position.y=.12+i*.05; fire.add(m); }
const flameMat=new THREE.MeshBasicMaterial({map:T.flames[0],alphaTest:.5,side:THREE.DoubleSide,fog:false});
const flame=new THREE.Mesh(new THREE.PlaneGeometry(.95,1.42).translate(0,.71,0),flameMat); flame.rotation.copy(bbFace); flame.position.y=.08; fire.add(flame);
function haloSprite(col,size,op=.8){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:T.halo,color:col,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,depthTest:false,opacity:op,fog:false})); s.renderOrder=10; s.scale.set(size,size,1); return s; }
const fireHalo=haloSprite(0xff7a2a,4.2,.55); fireHalo.position.y=.8; fire.add(fireHalo);
const fireL=addLight(0xff8a3c,26,9); fireL.l.position.set(0,1.1,0);
const restRing=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshBasicMaterial({map:T.ring,color:0xff9a50,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.35,fog:false}));
restRing.rotation.x=-Math.PI/2; restRing.position.y=.04; scene.add(restRing);
// v2.46 모닥불 = AI 그림: 부서진 콘크리트·벽돌 화덕(hub_pit) + 손그림 불꽃 4장(hub_flame0~3)이 번갈아 겹쳐 흔들린다. 옛 돌·장작·코드 불꽃은 숨김
const PIT={W:542,H:400,FW:112,FH:473,F:[],a:null,b:null,g:null};
for(const c of fire.children) if(c!==fireHalo) c.visible=false;
(()=>{ const w=1.95, h=w*PIT.H/PIT.W; const g=new THREE.Group(); g.rotation.copy(bbFace); g.position.z=.42; fire.add(g); PIT.g=g;
  const pm=new THREE.Mesh(new THREE.PlaneGeometry(w,h).translate(0,h/2,0),inkMat(new THREE.MeshBasicMaterial({map:ltex('img/hub_pit.webp'),alphaTest:.45,side:THREE.DoubleSide}),{w:1.5})); pm.material.color.set(0xb0907e); g.add(pm); PIT.pm=pm;
  for(let i=0;i<4;i++) PIT.F.push(ltex('img/hub_flame'+i+'.webp'));
  const fh=1.3, fw=fh*PIT.FW/PIT.FH;
  const mk2=()=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh).translate(0,fh/2,0),new THREE.MeshBasicMaterial({map:PIT.F[0],transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false})); m.position.set(-.02,h*.44,.02); m.renderOrder=3; g.add(m); return m; };
  PIT.a=mk2(); PIT.b=mk2(); PIT.b.position.z=.03; DBG.pit=PIT; PIT.halo=fireHalo;
  PIT.s=[[-.2,.66,1.7],[.19,.6,3.1]].map(([x,sc,ph])=>{ const m=mk2(); m.position.x=x; m.position.y=h*.42; m.position.z=.01; m.userData={sc,ph}; return m; }); })();
// 모닥불지기 소년 (AI 그림) — 거점에서만 보인다
function sprite(src,w,h,H,o={}){ const t=ltex(src); const g=new THREE.Group(); const bb=new THREE.Group(); bb.rotation.copy(bbFace); g.add(bb);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(H*w/h,H).translate(0,H/2,0),inkMat(new THREE.MeshBasicMaterial({map:t,alphaTest:.45,side:THREE.DoubleSide}),{w:1.5})); bb.add(m);
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.shadow,transparent:true,depthWrite:false,opacity:.8})); sh.rotation.x=-Math.PI/2; sh.position.y=.02; sh.scale.set(o.sw||1,o.sd||.5,1); g.add(sh);
  g.userData.m=m; scene.add(g); return g; }
// v2.44: 모닥불지기 새 그림(다른 캐릭터와 같은 먹선 화풍) 두 자세 — a 앉아 막대 쥐기 · b 불 쑤시기. 두 장은 같은 크기·발 맞춤
const KEEP={W:KEEP_W,H:KEEP_H,a:null,b:null,nx:0,end:0,n:0};
const keeper=sprite('img/keeper_a.webp',KEEP_W,KEEP_H,1.32,{sw:1.15}); keeper.position.set(-1.2,0,.3); keeper.visible=false;
KEEP.a=keeper.userData.m.material.map; KEEP.b=ltex('img/keeper_b.webp'); DBG.keep=KEEP;
const hubToad=sprite('img/toad.webp',335,300,.6,{sw:.6,sd:.3}); hubToad.position.set(1.9,0,-1.4); hubToad.visible=false;
const fallenNPC=sprite('img/fallen.webp',FALLEN_W,FALLEN_H,1.45,{sw:1.1}); fallenNPC.visible=false;
/* v2.57 모닥불 곁의 깨어난 자 6명(60번 2장 · 65번 3·8장) — 판이 끝날 때마다 1~2명이 불 곁에 앉는다(이야기를 나눈 사람은 남는다).
   한 판에 한 장씩 이야기를 듣는다(대화 5장 = 정 0~5) · 들으면 다음 판에 작은 덤 하나 · 5장을 다 들은 사람은 내가 쓰러져 다시 깨어나면 불 속으로 간다(물건만 남음).
   1·2막 금지 목록: 자기 1인칭 삶 · 저승 규칙 · 소년의 수상함 · 모닥불의 비밀까지만. 특정 사람을 그리워하는 말 없음 */
const NPCS=[
  {k:'rider',n:'최민재',j:'배달 라이더',w:480,fx:{speed:.05},fd:'이동 속도 +5%',it:'닳은 스로틀 그립',L:['늘 혼자 달렸으니 이런 빈 길은 익숙해. 길 끝에 날 기다리는 사람이 없는 것까지 똑같네.','괴수 피해 달릴 때마다 배달앱 타이머에 쫓기는 기분이야. 여긴 목적지도 없는데.','저 소년, 불에 장작 넣는 걸 한 번도 못 봤어. 저 불은 대체 뭘 먹고 타는 걸까?','네가 쓰러졌다 깨어날 때마다 불꽃이 확 튀어. 꼭 뭘 한 움큼 집어삼킨 것처럼.','콜이 안 울리니까 갑자기 졸리네. 너 나가면 나 불 옆에서 눈 좀 붙일게.']},
  {k:'busker',n:'강태우',j:'거리 악사',w:482,fx:{cd:.04},fd:'기술 대기 -4%',it:'끊어진 4번 줄',L:['내 노래를 끝까지 들은 사람은 평생 없었어. 여긴 괴수라도 몰려오니 덜 외롭네.','거기선 앰프 없으면 다 묻혔는데, 여기선 내 줄 튕기는 소리만 이상하게 오래 울려.','소년은 내 노래에 박자를 안 맞춰. 불꽃이 일렁이는 때만 뚫어지게 보더라.','돌을 모으면 돌아간다며. 그럼 저 소년은 왜 한 번도 안 돌아갔을까.','손끝 굳은살이 다 풀렸어. 제일 조용한 곡 하나만 치고 좀 쉴게.']},
  {k:'call',n:'오지은',j:'콜센터 심야 상담원',w:499,fx:{magnet:.15},fd:'줍는 거리 +15%',it:'끝이 씹힌 볼펜 뚜껑',L:['밤새 모르는 사람들 화난 목소리만 들었어. 내 안부 묻는 전화는 한 통도 없었지.','여기 것들은 조용해서 좋아. 차라리 욕이라도 하면 매뉴얼대로 끊을 텐데.','아까 네가 쓰러져서 실려 왔을 때, 소년이 불에 대고 아주 건조하게 "또 한 명" 그러더라.','이 불, 따뜻하지 않아. 뭘 억지로 쥐어짜서 내는 열 같아.','이상하지, 오늘은 헤드셋을 벗어도 귀가 안 아파. 이제 퇴근해도 되나 봐.']},
  {k:'daeri',n:'송기철',j:'대리기사',w:524,fx:{armor:.04},fd:'받는 피해 -4%',it:'접이식 킥보드 바퀴',L:['남의 차로 남을 집에 보내고, 새벽엔 혼자 걸었어. 내가 돌아갈 방은 없었지.','돌 모으는 게 꼭 오지 콜 잡는 것 같네. 잡을수록 더 깜깜한 데로 끌려가.','소년 그림자 본 적 있어? 바닥에 안 지고 전부 불 쪽으로 빨려 들어가.','네가 쓰러져 돌아올 때마다 여기 온도가 확 올라. 우리가 다시 깨어나는 요금은 누가 내는 걸까.','오늘은 다리가 너무 무거워. 여기 좀 기대 앉아 있을게. 깨우지 마.']},
  {k:'laundry',n:'윤정숙',j:'코인세탁소 사장',w:360,fx:{hpM:.08},fd:'최대 체력 +8%',it:'구겨진 세탁망',L:['남의 옷 도는 것만 보다 늙었어. 내 빨래 챙겨 줄 사람 하나 없이.','여긴 이상해. 저것들은 부서져도 먼지 하나 안 남아. 우리 가게 필터보다 깨끗해.','저 아이는 잠도 안 자고 불을 지켜. 불 꺼지면 가진 걸 다 뺏기는 사람처럼.','불 냄새가 이상해. 장작 냄새가 아니야. 건조기를 너무 오래 돌렸을 때, 뭔가 바싹 말라 버리는 냄새.','탈수는 끝났는데 통이 안 멈추네. 기둥에 기대서 눈 좀 감을게.']},
  {k:'toll',n:'정수민',j:'톨게이트 수납원',w:474,fx:{shard:.08},fd:'기억 조각 +8%',it:'늘어난 고무 골무',L:['좁은 부스에서 손만 내밀며 살았어. 창문 너머로 돈만 오가고, 내 얼굴 기억하는 사람은 없었을걸.','통행권 뽑듯이 돌을 모으네. 근데 여긴 출구도 없는데 어딜 가려고?','소년이 네가 흘린 돌을 줍는 걸 봤어. 닿자마자 손끝이 까맣게 그을리더라.','돈을 넣어도 차단기가 안 열리는 데가 있어. 그땐 요금을 더 내야 해. 여기선 그 요금이 뭘까.','교대 시간이야. 다음 근무자가 안 올 걸 아는데도, 이상하게 마음이 놓여.']}];
const NPC_SEAT=[[1.6,-.95,-1],[-1.65,-1.0,1]]; // v2.59.1: 나(앞 오른쪽)와 덜 겹치게 양옆으로 // [x, z, 좌우] — 둘 다 불을 바라본다
const NPCG={}; for(const N of NPCS){ const g=sprite('img/npc_'+N.k+'.webp',N.w,520,1.12,{sw:1.05}); g.visible=false;
  const gm=new THREE.Mesh(g.userData.m.geometry,new THREE.MeshBasicMaterial({map:ltex('img/npc_'+N.k+'_g.webp'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); gm.position.z=.005; g.userData.m.parent.add(gm); g.userData.gm=gm; NPCG[N.k]=g; }
// v2.46 거점 = 폐허가 된 서울의 밤 모닥불: 뒤쪽 반원에 AI 그림 소품(무너진 건물·버려진 차·꺾인 신호등·전봇대·잔해·빈 간판 틀). 글자·사람 흔적 없음(1·2막). 거점에서만 보인다
const HUBD={g:new THREE.Group(),on:null,P:[]}; scene.add(HUBD.g); HUBD.g.visible=false; DBG.hubd=HUBD;
{ const gm=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({map:ltex('img/hub_ground.webp'),transparent:true,depthWrite:false,fog:false})); gm.rotation.x=-Math.PI/2; gm.position.set(0,.015,-2.6); gm.renderOrder=-1; HUBD.g.add(gm); HUBD.ground=gm; } // 금 간 아스팔트(AI 그림, 불빛을 구워 넣음)
(()=>{ const night=new THREE.Color(0x6a7498), warm=new THREE.Color(0xd0a07a);
  const L=[ // [그림, 너비, 높이, 키, x, z, 좌우뒤집기]
    ['hub_bldg',0,0,3.5,-.85,-4.6],['hub_car',0,0,1.3,1.2,-3.9],['hub_signal',143,523,3.2,1.75,-2.1],['hub_pole',90,521,4.2,-1.8,-3.1],
    ['hub_sign',83,472,1.7,.3,-2.8,1],['hub_rubble',157,386,1.05,-2.0,-1.4],['hub_rubble',157,386,.8,1.9,-.4,1],['hub_rubble',157,386,.85,.45,-4.9]];
  for(const [n,w0,h0,H,x,z,fx] of L){ const w=HUBD_SZ[n]?HUBD_SZ[n][0]:w0, h=HUBD_SZ[n]?HUBD_SZ[n][1]:h0; if(!w) continue;
    const g=sprite('img/'+n+'.webp',w,h,H,{sw:H*w/h*.8,sd:.35}); scene.remove(g); HUBD.g.add(g); g.position.set(x,0,z); g.userData.m.material.fog=false; if(fx) g.userData.m.scale.x=-1;
    const d=Math.hypot(x,z), k=Math.max(0,1-d/4.6)**1.2; g.userData.m.material.color.copy(night).lerp(warm,k); HUBD.P.push(g); } })();

/* ============ v2.4 이어 걷는 실제 지도 (서울 남산~서울역~명동, © OpenStreetMap 기여자) ============ */
const WORLD=true, LIM=700;
// 거점(모닥불)과 보스 구역. 좌표 = 세계 단위(1 ≈ 실제 2.4 m), 원점 = 남산 아래 모닥불
const SITES={
  namsan:{x:0,z:0,boss:'gumiho',zone:{x:130,z:-5,r:30}},
  seoulst:{x:-285,z:-92,boss:'bulgasari',zone:{x:-338,z:-130,r:32}},
  myeong:{x:200,z:-466,boss:'dokkaebi',zone:{x:250,z:-512,r:30}}
};
const MAPK=.115, toMap=(x,z)=>[130+x*MAPK,167+z*MAPK];
function decodeLines(str){ if(!str) return []; return str.split('|').map(seg=>{ let x=0,z=0; return seg.split(' ').map(p=>{ const [dx,dz]=p.split(',').map(Number); x+=dx; z+=dz; return [x,z]; }); }); }
const WL={}; for(const k in WD) WL[k]=decodeLines(WD[k]);
// 땅 종류 격자 (2단위 칸): 0 빈 땅, 40 공원, 80 숲, 120 물, 160 작은 길, 200 큰길
const TG=2, TN=Math.ceil(LIM*2/TG); let TERR=null;
function buildTerr(){ const c=mk(TN,TN), x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,TN,TN);
  const P=(px,pz)=>[(px+LIM)/TG,(pz+LIM)/TG];
  const poly=(L,v)=>{ x.fillStyle=`rgb(${v},0,0)`; for(const pts of L){ x.beginPath(); pts.forEach((p,i)=>{ const [a,b]=P(p[0],p[1]); i?x.lineTo(a,b):x.moveTo(a,b); }); x.closePath(); x.fill(); } };
  const line=(L,v,w)=>{ x.strokeStyle=`rgb(${v},0,0)`; x.lineWidth=w/TG; x.lineCap='round'; x.lineJoin='round'; for(const pts of L){ x.beginPath(); pts.forEach((p,i)=>{ const [a,b]=P(p[0],p[1]); i?x.lineTo(a,b):x.moveTo(a,b); }); x.stroke(); } };
  poly(WL.g,40); poly(WL.f,80); poly(WL.a,120); line(WL.v,120,3); line(WL.r,160,4.5); line(WL.t,160,6); line(WL.s,200,9); line(WL.p,200,11);
  const d=x.getImageData(0,0,TN,TN).data; TERR=new Uint8Array(TN*TN); for(let i=0;i<TN*TN;i++) TERR[i]=d[i*4]; }
function terr(px,pz){ if(!TERR||FIELD) return 0; const i=Math.floor((px+LIM)/TG), j=Math.floor((pz+LIM)/TG); if(i<0||j<0||i>=TN||j>=TN) return 0; return TERR[j*TN+i]; }
function terrSpeed(v){ return v===80?.9:v===40?.95:v===120?.75:v===200?1.06:1; }
// 안개(안 가 본 땅): 20단위 칸, 저장
const FG=10, FN=Math.ceil(LIM*2/FG); let FOG=null, fogTex=null, fogCan=null, fogDirty=false;
function fogLoad(){ FOG=new Uint8Array(FN*FN); try{ const b=atob(SV.fog||''); for(let i=0;i<b.length&&i<FOG.length;i++) FOG[i]=b.charCodeAt(i); }catch(e){} }
function fogSave(){ let s=''; for(let i=0;i<FOG.length;i++) s+=String.fromCharCode(FOG[i]); SV.fog=btoa(s); }
function fogPaint(){ const x=fogCan.getContext('2d'), im=x.createImageData(FN,FN); for(let i=0;i<FN*FN;i++){ im.data[i*4]=7; im.data[i*4+1]=6; im.data[i*4+2]=12; im.data[i*4+3]=FOG[i]?0:150; } x.putImageData(im,0,0); if(fogTex) fogTex.needsUpdate=true; }
function fogReveal(px,pz,R){ let ch=false; const i0=Math.floor((px-R+LIM)/FG), i1=Math.floor((px+R+LIM)/FG), j0=Math.floor((pz-R+LIM)/FG), j1=Math.floor((pz+R+LIM)/FG);
  for(let j=Math.max(0,j0);j<=Math.min(FN-1,j1);j++) for(let i=Math.max(0,i0);i<=Math.min(FN-1,i1);i++){ const cx=(i+.5)*FG-LIM, cz=(j+.5)*FG-LIM; if(!FOG[j*FN+i]&&Math.hypot(cx-px,cz-pz)<R+FG*.5){ FOG[j*FN+i]=1; ch=true; } }
  if(ch){ fogDirty=true; } return ch; }
function fogPct(){ let n=0; for(const v of FOG) n+=v; return Math.round(n/FOG.length*100); }
// 세계 만들기
const WLM={}; let wTrees=null;
function ribbon(L,hw,y){ const pos=[]; for(const pts of L){ for(let i=1;i<pts.length;i++){ const [ax,az]=pts[i-1],[bx,bz]=pts[i]; const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz)||1, nx=-dz/l*hw, nz=dx/l*hw;
      pos.push(ax+nx,y,az+nz, bx+nx,y,bz+nz, bx-nx,y,bz-nz, ax+nx,y,az+nz, bx-nx,y,bz-nz, ax-nx,y,az-nz); }
    for(const [px,pz] of pts){ const n=6; for(let k=0;k<n;k++){ const a0=k/n*6.283,a1=(k+1)/n*6.283; pos.push(px,y,pz, px+Math.cos(a1)*hw,y,pz+Math.sin(a1)*hw, px+Math.cos(a0)*hw,y,pz+Math.sin(a0)*hw); } } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals(); return g; }
function polyGeo(L,y){ const geos=[]; const pos=[];
  for(const pts of L){ if(pts.length<3) continue; const sh=new THREE.Shape(pts.map(p=>new THREE.Vector2(p[0],-p[1]))); const sg=new THREE.ShapeGeometry(sh); const a=sg.attributes.position, idx=sg.index;
    const get=i=>[a.getX(i),y,-a.getY(i)]; if(idx){ for(let k=0;k<idx.count;k+=3){ pos.push(...get(idx.getX(k)),...get(idx.getX(k+2)),...get(idx.getX(k+1))); } } sg.dispose(); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.computeVertexNormals(); return g; }
function buildWorld(){
  worldG=new THREE.Group(); worldG.visible=false; scene.add(worldG);
  const base=tex(concreteC()); base.wrapS=base.wrapT=THREE.RepeatWrapping; base.repeat.set(LIM*2/9,LIM*2/9);
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(LIM*2+200,LIM*2+200),toon(0xd8d0e0,{map:base})); gm.rotation.x=-Math.PI/2; worldG.add(gm);
  const add=(geo,col,ro,y)=>{ const m=new THREE.Mesh(geo,toon(col)); m.renderOrder=ro; m.material.polygonOffset=true; m.material.polygonOffsetFactor=-ro; m.material.polygonOffsetUnits=-ro; worldG.add(m); return m; };
  add(polyGeo(WL.g,.02),0x35583f,1); add(polyGeo(WL.f,.025),0x284a37,2); add(polyGeo(WL.a,.03),0x1d3550,3);
  add(ribbon(WL.v,1.4,.035),0x1d3550,3);
  add(ribbon(WL.r,1.9,.04),0x4a4656,4); add(ribbon(WL.t,2.6,.045),0x504b5c,5); add(ribbon(WL.s,3.9,.05),0x575264,6); add(ribbon(WL.p,4.8,.055),0x5d586a,7);
  // 큰길 가운데 흐린 줄
  add(ribbon(WL.p,.25,.06),0x7a7486,8);
  add(ribbon(WL.l,1.1,.06),0x4a3a34,8); add(ribbon(WL.l,.22,.065),0x8a7a70,9);
  // 숲·공원 나무 (부딪히지 않음, 걸음이 느려짐)
  buildTerr(); setSeed(404);
  const cand=[]; const N=MOBILE?1100:1800; let tries=0;
  while(cand.length<N&&tries<N*12){ tries++; const x=rr(-LIM,LIM), z=rr(-LIM,LIM), t=terr(x,z); if(t===80||(t===40&&rnd()<.35)) cand.push([x,z,t]); }
  const cone=new THREE.ConeGeometry(.75,1.7,6,1).translate(0,1.45,0), trunk=new THREE.CylinderGeometry(.1,.14,.7,5).translate(0,.35,0);
  const cm=new THREE.InstancedMesh(cone,toon(0xffffff),cand.length), tm=new THREE.InstancedMesh(trunk,trunkMat,cand.length);
  const M=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),p=new THREE.Vector3(),cc=new THREE.Color();
  cand.forEach(([x,z,t],i)=>{ const s=rr(.75,1.25); p.set(x,0,z); q.setFromAxisAngle(new THREE.Vector3(0,1,0),rr(0,6.28)); sc.set(s,s*rr(.85,1.2),s); M.compose(p,q,sc); cm.setMatrixAt(i,M); tm.setMatrixAt(i,M);
    cc.setHSL(rr(.38,.46),rr(.3,.45),t===80?rr(.16,.24):rr(.22,.3)); cm.setColorAt(i,cc); });
  worldG.add(cm,tm); wTrees=cm;
  // 명소 (멀리서도 보이는 길잡이)
  const LMS=[['img/lm_tower.webp',340,420,30,301,37],['img/lm_station.webp',436,400,18,-342,-124],['img/lm_church.webp',418,400,20,268,-524]];
  for(const [src,w,h,H,x,z] of LMS){ const g=sprite(src,w,h,H,{sw:H*.5,sd:H*.18}); scene.remove(g); worldG.add(g); g.position.set(x,0,z); g.userData.m.material.fog=false; g.userData.m.material.transparent=true; WLM[src]={g,x,z,W:H*w/h,H,op:1}; }
  // 거점: 모닥불 / 꺼진 재, 보스 구역 고리
  for(const k in SITES){ const S0=SITES[k]; if(k!=='namsan'){ const g=new THREE.Group(); g.position.set(S0.x,0,S0.z);
      for(let i=0;i<8;i++){ const a=i/8*6.28; const m=outlined(jitter(new THREE.DodecahedronGeometry(1,0),.1),rockMat,.1); m.scale.set(.2,.14,.2); m.position.set(Math.cos(a)*.7,.1,Math.sin(a)*.7); g.add(m); }
      const fl=new THREE.Mesh(new THREE.PlaneGeometry(.95,1.42).translate(0,.71,0),flameMat); fl.rotation.copy(bbFace); g.add(fl);
      const ash=new THREE.Mesh(new THREE.CircleGeometry(.6,10),new THREE.MeshBasicMaterial({color:0x2a2228})); ash.rotation.x=-Math.PI/2; ash.position.y=.03; g.add(ash);
      const hs=haloSprite(0xff9a50,5,.55); hs.position.y=.8; g.add(hs); worldG.add(g); S0.mesh=g; S0.flame=fl; S0.halo=hs; }
    const z=S0.zone, ring=new THREE.Mesh(new THREE.RingGeometry(z.r-.6,z.r,64),new THREE.MeshBasicMaterial({color:0xd02a40,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.set(z.x,.09,z.z); worldG.add(ring); S0.ring=ring; }
  // 안개 판
  fogLoad(); fogCan=mk(FN,FN); fogPaint(); fogTex=new THREE.CanvasTexture(fogCan); fogTex.magFilter=THREE.LinearFilter;
  const fm=new THREE.Mesh(new THREE.PlaneGeometry(LIM*2,LIM*2),new THREE.MeshBasicMaterial({map:fogTex,transparent:true,depthWrite:false,fog:false})); fm.rotation.x=-Math.PI/2; fm.position.y=.12; fm.renderOrder=12; worldG.add(fm);
  refreshSites();
}
const isLit=k=>k==='namsan'||!!SV.lit[k];
function canIgnite(k){ return upLv('ignite')>0||!!SV.cleared[k]; }
function refreshSites(){ for(const k in SITES){ const S0=SITES[k]; if(!S0.mesh) continue; const on=isLit(k); S0.flame.visible=on; S0.halo.material.opacity=on?.55:.12; S0.halo.material.color.set(on?0xff9a50:0x7a3020); } }
function nearestLit(px,pz){ let best='namsan',bd=1e9; for(const k in SITES){ if(!isLit(k)) continue; const d=Math.hypot(SITES[k].x-px,SITES[k].z-pz); if(d<bd){bd=d;best=k;} } return [best,bd]; }
function nearestSite(px,pz){ let best='namsan',bd=1e9; for(const k in SITES){ const d=Math.hypot(SITES[k].zone.x-px,SITES[k].zone.z-pz); if(d<bd){bd=d;best=k;} } return best; }
buildWorld();
// v2.7: 모닥불 = 안전지대 (빛기둥 · 밝은 둘레 · 경계 고리)
const SAFE_R=7;
const beamTex=(()=>{ const c=document.createElement('canvas'); c.width=8; c.height=256; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'rgba(255,150,70,0)'); g.addColorStop(.5,'rgba(255,160,80,.12)'); g.addColorStop(.88,'rgba(255,180,100,.3)'); g.addColorStop(1,'rgba(255,200,130,0)'); x.fillStyle=g; x.fillRect(0,0,8,256); return new THREE.CanvasTexture(c); })();
const safeTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); const g=x.createRadialGradient(128,128,0,128,128,128); g.addColorStop(0,'rgba(255,190,110,.55)'); g.addColorStop(.7,'rgba(255,150,70,.22)'); g.addColorStop(.93,'rgba(255,140,60,.12)'); g.addColorStop(.96,'rgba(255,200,120,.75)'); g.addColorStop(1,'rgba(255,170,90,0)'); x.fillStyle=g; x.fillRect(0,0,256,256); return new THREE.CanvasTexture(c); })();
for(const k in SITES){ const S0=SITES[k];
  const bm=new THREE.MeshBasicMaterial({map:beamTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.95,60,16,1,true).translate(0,33,0),bm); beam.position.set(S0.x,0,S0.z); beam.renderOrder=9; worldG.add(beam);
  const beam2=new THREE.Mesh(new THREE.CylinderGeometry(.15,.35,70,10,1,true).translate(0,38,0),bm.clone()); beam2.position.copy(beam.position); beam2.renderOrder=9; worldG.add(beam2);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(SAFE_R+.4,48),new THREE.MeshBasicMaterial({map:safeTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); disc.rotation.x=-Math.PI/2; disc.position.set(S0.x,.06,S0.z); disc.renderOrder=2; worldG.add(disc);
  S0.beam=beam; S0.beam2=beam2; S0.disc=disc; }
function refreshSafe(){ for(const k in SITES){ const S0=SITES[k], on=isLit(k); S0.on=on; S0.beam.visible=S0.beam2.visible=true; S0.disc.visible=on; const c=on?0xffffff:0x7f90c0; S0.beam.material.color.set(c); S0.beam2.material.color.set(c); } }
refreshSafe();
function safeTick(dt,P,t){ let sk=null,sd=1e9; for(const k in SITES){ if(!isLit(k)) continue; const d=Math.hypot(SITES[k].x-P.x,SITES[k].z-P.z); if(d<sd){sd=d;sk=k;} }
  for(const k in SITES){ const S0=SITES[k]; if(!S0.beam.visible) continue; const near=Math.max(.15,Math.min(1,(Math.hypot(S0.x-P.x,S0.z-P.z)-3)/14)); const f=(.75+.25*Math.sin(t*1.7+S0.x))*(S0.on?1:.4)*near; S0.beam.material.opacity=f; S0.beam2.material.opacity=(.6+.4*Math.sin(t*2.3+1))*(S0.on?1:.3)*near; S0.disc.material.opacity=.85+.15*Math.sin(t*1.3); }
  S.inSafe=!!sk&&sd<SAFE_R-.2; if(!sk||sd>SAFE_R+25) return; const F=SITES[sk];
  for(const e of enemies){ if(e.dead||e.d.treasure) continue; const dx=e.x-F.x,dz=e.z-F.z,d=Math.hypot(dx,dz)||.01, R=SAFE_R+e.d.r*.6; if(d<R){ e.x=F.x+dx/d*R; e.z=F.z+dz/d*R; e.kx=dx/d*3; e.kz=dz/d*3; if(e.ch) e.ch=null; } }
  for(let i=foxShots.length-1;i>=0;i--){ const f=foxShots[i]; if(Math.hypot(f.x-F.x,f.z-F.z)<SAFE_R) foxShots.splice(i,1); }
  if(S.inSafe){ if(S.hp<S.maxhp) S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.04*dt); if(S.hails) S.hails.length=0; if(!S.safeMsg){ S.safeMsg=1; if(S.t>3) toastOnce('safe','모닥불 곁','불빛 안에선 아무도 싸울 수 없다 · 쉬는 동안 괴수가 흩어진다',true); else S.safeMsg=0; } safeScatter(F,dt); } else if(sd>SAFE_R+3) S.safeMsg=0; }

// v2.11: 불 곁에서 쉬면 둘레에 몰린 괴수가 조금씩 흩어진다(경험치 없음)
function safeScatter(F,dt){ S.scT=(S.scT||0)-dt; if(S.scT>0) return; S.scT=.35; let n=0; for(const e of enemies){ if(n>=10) break; if(e.dead||e.d.treasure||e.type==='gangcheol') continue; if(Math.hypot(e.x-F.x,e.z-F.z)<SAFE_R+16){ e.dead=true; n++; if(Math.random()<.4) burst(e.x,.6,e.z,2,1.5); } } }
/* ============ v2.8 지역 필드: 명동 골목 (21번 문서) ============
   모닥불 기지에서 골라 들어가는 실제 거리 필드(1단위 ≈ 1.2m) · 낮처럼 밝은 바랜 서울 · 입체 건물·간판(명동 시험 2)
   보스를 보내면 괴수가 모두 사라지고 3분 동안 가게를 뒤진다 → 골목이 처음으로 돌아간다(들고 있던 장비는 지켜 줌) */
const LOOT_T=180, EMBER_N=2, EQ_DROP=.1;
/* ============ v2.20 밤 저승 빛 (33번 3장 ㄱ) — 거리는 어둡고 채도 낮게, 모닥불·혼불·내 빛·괴수 그림이 가장 밝게 ============ */
const NIGHT={fog:0x14121e, sky:0x6c74aa, gnd:0x2a2230, hemiI:.62, moon:0xaab6ec, moonI:.9, sat:.5, base:[.6,.62,.74], fogN:4, fogF:46};
const nightSat={value:NIGHT.sat};
/* v2.50 지역마다 다른 밤 (기획자 11-18 20:37 「지역마다 특유의 분위기」) — 빛·안개·땅색·떠다니는 것. 사람 흔적 없음 */
const MOOD={
  myeong:{fog:0x1c1220,sky:0x9a6a9a,gnd:0x34202a,moon:0xffb4c4,hemiI:.62,moonI:.85,sat:.6,m:{n:80,c:[0xffd6e4,0xffc0a0],vy:.35,sz:.7,op:.22,wob:.3}}, // 붉은 네온 · 지하에서 오르는 김
  hongdae:{fog:0x110f26,sky:0x7a66d8,gnd:0x241e3a,moon:0xb4a4ff,hemiI:.6,moonI:.85,sat:.62,m:{n:60,c:[0x7affb0,0xc890ff],vy:.06,sz:.38,op:.95,wob:1.1}}, // 보라 밤 · 떠도는 도깨비불
  seongsu:{fog:0x1c130c,sky:0xc0905a,gnd:0x3a2618,moon:0xffbc80,hemiI:.62,moonI:.9,sat:.56,m:{n:110,c:[0xffa040,0xffd070],vy:.7,sz:.17,op:.95,wob:.5}}, // 용광로 빛 · 쇳가루 불티
  gyeong:{fog:0x0b1424,sky:0x6a8ad0,gnd:0x1e2638,moon:0xd4e4ff,hemiI:.58,moonI:.9,sat:.52,m:{n:60,c:[0xd8e8ff,0xa8c8ff],vy:-.12,sz:.2,op:.8,wob:.4}}, // 푸른 달빛 · 서리 먼지
  namsan:{fog:0x0c1612,sky:0x6aa090,gnd:0x1a2a22,moon:0xc4ecdc,hemiI:.6,moonI:.9,sat:.5,m:{n:120,c:[0x8a8a96,0xb0b0bc],vy:-.5,sz:.28,op:.7,wob:.6}}}; // 숲 안개 · 검은 눈
const moodOf=k=>MOOD[k]||{...NIGHT,m:null};
let MOTES=null;
function moodMotes(k){ const M=moodOf(k).m; if(MOTES){ scene.remove(MOTES.pts); MOTES.pts.geometry.dispose(); MOTES=null; } if(!M) return;
  const N=Math.round(M.n*(MOBILE?.6:1)), pos=new Float32Array(N*3), col=new Float32Array(N*3), ph=new Float32Array(N), c0=new THREE.Color(), BX=26;
  for(let i=0;i<N;i++){ pos[i*3]=rr(-BX,BX); pos[i*3+1]=rr(.2,7); pos[i*3+2]=rr(-BX,BX); c0.set(M.c[i%M.c.length]); col.set([c0.r,c0.g,c0.b],i*3); ph[i]=rr(0,6.28); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size:M.sz,map:T.halo,vertexColors:true,transparent:true,opacity:M.op,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
  pts.frustumCulled=false; pts.renderOrder=8; scene.add(pts); MOTES={pts,M,ph,BX,ox:0,oz:0}; }
window.__moodMotes=moodMotes;
function moodTick(dt,P){ if(!MOTES) return; const {pts,M,ph,BX}=MOTES, a=pts.geometry.attributes.position.array, t=performance.now()/1000;
  for(let i=0;i<ph.length;i++){ let x=a[i*3],y=a[i*3+1],z=a[i*3+2]; y+=M.vy*dt; x+=Math.sin(t*.7+ph[i])*M.wob*dt; z+=Math.cos(t*.6+ph[i]*1.3)*M.wob*dt;
    if(y>7.5) y=.2; else if(y<.1) y=7.4; if(x-P.x>BX) x-=BX*2; else if(P.x-x>BX) x+=BX*2; if(z-P.z>BX) z-=BX*2; else if(P.z-z>BX) z+=BX*2; a[i*3]=x; a[i*3+1]=y; a[i*3+2]=z; }
  pts.geometry.attributes.position.needsUpdate=true; }
function nightMat(m){ if(!m||m.userData.night||!(m.isMeshLambertMaterial||m.isMeshStandardMaterial||m.isMeshPhongMaterial)) return; m.userData.night=1;
  const prev=m.onBeforeCompile, pk=m.customProgramCacheKey;
  m.onBeforeCompile=(sh,r)=>{ if(prev) prev.call(m,sh,r); sh.uniforms.uNSat=nightSat;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNSat;').replace('#include <fog_fragment>','{ float l=dot(gl_FragColor.rgb,vec3(.299,.587,.114)); gl_FragColor.rgb=mix(vec3(l),gl_FragColor.rgb,uNSat); }\n#include <fog_fragment>'); };
  m.customProgramCacheKey=()=>(pk?pk.call(m):'')+'|night'; m.needsUpdate=true; }
function nightField(M){ M.G.traverse(o=>{ if(!o.isMesh) return; for(const m of [].concat(o.material)) nightMat(m); });
  const D=moodOf(M.key); M.FOG=D.fog; M.hemi.color.set(D.sky); M.hemi.groundColor.set(D.gnd); M.sun.color.set(D.moon); }
function nightTick(){ if(!MY) return; const b=TU('night'), D=moodOf(MY.key); MY.hemi.intensity=D.hemiI*b; MY.sun.intensity=D.moonI*b; nightSat.value=Math.min(1.6,D.sat*TU('nsat')); }
function getMyeong(key='myeong'){ if(FBUILT[key]){ MY=FBUILT[key]; return MY; }
  MY=buildMyeong({...FIELDS[key].data(),KEY:key,lootPropC,MOBILE}); FBUILT[key]=MY; MY.key=key; scene.add(MY.G); nightField(MY); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFShadowMap;
  const st=MY.START, FD=FIELDS[key].data(); MY.fire={x:st[0],z:st[1]};
  let bz=null; if(FD.ZONE){ let bs=-1e9; const [zx,zz]=FD.ZONE, zr=FD.ZR||40; for(let x=zx-zr;x<=zx+zr;x+=2) for(let z=zz-zr;z<=zz+zr;z+=2){ if(MY.blocked(x,z)) continue; const sc=Math.min(12,MY.distAt(x,z))-Math.hypot(x-zx,z-zz)*.03; if(sc>bs){ bs=sc; bz=[x,z]; } } }
  bz=bz||MY.openSpot(st,85)||[st[0],st[1]-80]; MY.zone={x:bz[0],z:bz[1],r:10};
  // v2.9.2: 모닥불 더 많이 — 보스 가는 길 중간 1곳 + 필드 전체에 고르게(가장 먼 빈터부터). 명동 6 · 수원 10 (기획자 평: 안전지대에서 밀린 성장을 몰아 고르기)
  MY.fires=[MY.fire]; { const S0=MY.fire, Z=MY.zone, B=MY.bounds, free=(x,z)=>!MY.blocked(x,z), N=Math.min(10,5+Math.round(B.w*B.h/55000));
    const open=(x,z)=>{ let c=0; for(let k=0;k<12;k++){ const a=k/12*6.283; for(const r of [3,5,7]) if(free(x+Math.cos(a)*r,z+Math.sin(a)*r)) c++; } return c; };
    const ok=(x,z)=>x>=B.x0+EDGE_FADE&&z>=B.z0+EDGE_FADE&&x<=B.x0+B.w-EDGE_FADE&&z<=B.z0+B.h-EDGE_FADE&&free(x,z)&&Math.hypot(x-Z.x,z-Z.z)>=Z.r+22;
    { const tx=S0.x+(Z.x-S0.x)*.55, tz=S0.z+(Z.z-S0.z)*.55; let best=null,bs=-1e9; for(let x=tx-16;x<=tx+16;x+=2) for(let z=tz-16;z<=tz+16;z+=2){ if(!ok(x,z)||Math.hypot(x-S0.x,z-S0.z)<30) continue; const c=open(x,z), sc=c-Math.hypot(x-tx,z-tz)*.15; if(c>=28&&sc>bs){ bs=sc; best={x,z}; } } if(best) MY.fires.push(best); }
    const L=Math.hypot(Z.x-S0.x,Z.z-S0.z)||1, R=Math.max(60,L*.6), segD=(x,z)=>{ const t=Math.max(0,Math.min(1,((x-S0.x)*(Z.x-S0.x)+(z-S0.z)*(Z.z-S0.z))/(L*L))); return Math.hypot(x-S0.x-(Z.x-S0.x)*t,z-S0.z-(Z.z-S0.z)*t); }; // 시작~보스 길 둘레에만(모서리 구석엔 안 둠)
    const C=[]; for(let x=B.x0+EDGE_FADE;x<=B.x0+B.w-EDGE_FADE;x+=4) for(let z=B.z0+EDGE_FADE;z<=B.z0+B.h-EDGE_FADE;z+=4) if(segD(x,z)<R&&ok(x,z)&&open(x,z)>=30) C.push({x,z});
    while(MY.fires.length<N&&C.length){ let bi=-1,bd=0; for(let i=0;i<C.length;i++){ let d=1e9; for(const f of MY.fires) d=Math.min(d,Math.hypot(f.x-C[i].x,f.z-C[i].z)); if(d>bd){ bd=d; bi=i; } } if(bd<26) break; MY.fires.push(C.splice(bi,1)[0]); } }
  for(const F of MY.fires){
  const g=new THREE.Group(); g.position.set(F.x,0,F.z);
  // v2.53 (기획자 11-19 ㄱ): 필드 모닥불도 거점과 같은 AI 화덕(hub_pit) + 손그림 불꽃(PIT 재질을 같이 써서 같이 흔들림)
  { const w=1.95, h=w*PIT.H/PIT.W, fh=1.3, fw=fh*PIT.FW/PIT.FH; const bb=new THREE.Group(); bb.rotation.copy(bbFace); bb.position.z=.42; g.add(bb);
    bb.add(new THREE.Mesh(PIT.pm.geometry,PIT.pm.material)); for(const M of [PIT.a,PIT.b]){ const m=new THREE.Mesh(M.geometry,M.material); m.position.copy(M.position); m.renderOrder=3; bb.add(m); } }
  const hs=haloSprite(0xff9a50,5,.5); hs.position.y=.8; g.add(hs);
  const bm=new THREE.MeshBasicMaterial({map:beamTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.95,60,16,1,true).translate(0,33,0),bm); beam.renderOrder=9; g.add(beam);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(SAFE_R+.4,48),new THREE.MeshBasicMaterial({map:safeTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); disc.rotation.x=-Math.PI/2; disc.position.y=.06; disc.renderOrder=2; g.add(disc);
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(26,26),new THREE.MeshBasicMaterial({map:T.halo,color:0xff7a30,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:.5})); pool.rotation.x=-Math.PI/2; pool.position.y=.05; pool.renderOrder=1; g.add(pool); // v2.20 밤: 모닥불 둘레 땅이 따뜻하게 밝음
  MY.G.add(g); F.g={g,beam,disc,pool}; }
  MY.fireG=MY.fire.g;
  // v2.52 모닥불마다 대표 랜드마크 쪽을 가리키는 안내판 하나(글자 없이 그림+화살표) — 엿보기 대신
  { const R=MY.LMK&&MY.LMK.find(q=>q.rep); if(R&&MY.signAt) for(const F of MY.fires){ const a0=Math.atan2(R.z-F.z,R.x-F.x); if(Math.hypot(R.x-F.x,R.z-F.z)<SAFE_R+12) continue;
    const sx=Math.cos(a0)>=0?1:-1; // 화면 아래쪽(카메라 쪽) 고리 바깥, 랜드마크가 있는 옆으로 — 모닥불에 서면 바로 보이게
    outer: for(const off of [.55,.3,.8,.1,1.1]) for(const r of [SAFE_R+1.2,SAFE_R+2.2,SAFE_R+.5]){ const a=Math.PI/2-sx*off, x=F.x+Math.cos(a)*r, z=F.z+Math.sin(a)*r; if(MY.blocked(x,z)||MY.distAt(x,z)<.8) continue; MY.signAt(x,z,R); break outer; } } }
  const Z=MY.zone, ring=new THREE.Mesh(new THREE.RingGeometry(Z.r-.5,Z.r,64),new THREE.MeshBasicMaterial({color:0xd02a40,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.set(Z.x,.09,Z.z); ring.renderOrder=3; MY.G.add(ring); MY.ring=ring;
  // v2.10 (28번): 중간보스 구역 3곳 — 시작~파이널 길 둘레에 고르게(모닥불·파이널에서 떨어진 넓은 빈터). 늘 같은 자리(모두에게 같게)
  { const S0=MY.fire, B=MY.bounds, free=(x,z)=>!MY.blocked(x,z);
    const open=(x,z)=>{ let c=0; for(let k=0;k<12;k++){ const a=k/12*6.283; for(const r of [3,5,7]) if(free(x+Math.cos(a)*r,z+Math.sin(a)*r)) c++; } return c; };
    const L=Math.hypot(Z.x-S0.x,Z.z-S0.z)||1, R=Math.max(70,L*.8), segD=(x,z)=>{ const t=Math.max(0,Math.min(1,((x-S0.x)*(Z.x-S0.x)+(z-S0.z)*(Z.z-S0.z))/(L*L))); return Math.hypot(x-S0.x-(Z.x-S0.x)*t,z-S0.z-(Z.z-S0.z)*t); };
    const C=[]; for(let x=B.x0+EDGE_FADE+4;x<=B.x0+B.w-EDGE_FADE-4;x+=4) for(let z=B.z0+EDGE_FADE+4;z<=B.z0+B.h-EDGE_FADE-4;z+=4){ if(!free(x,z)||segD(x,z)>R||Math.hypot(x-Z.x,z-Z.z)<Z.r+30) continue; if(MY.fires.some(f=>Math.hypot(f.x-x,f.z-z)<SAFE_R+16)) continue; if(open(x,z)>=28) C.push({x,z}); }
    const fk=MY.key, ks=FIELDS[fk].mids.slice(); // 수원은 파이널이 이무기라 중간보스가 셋 다
    const pts=[S0,Z], mids=[]; while(mids.length<3&&C.length){ let bi=-1,bd=0; for(let i=0;i<C.length;i++){ let d=1e9; for(const f of pts.concat(mids)) d=Math.min(d,Math.hypot(f.x-C[i].x,f.z-C[i].z)); if(d>bd){ bd=d; bi=i; } } if(bi<0) break; mids.push(C.splice(bi,1)[0]); }
    for(let i=mids.length;i<3;i++){ const o=MY.openSpot([S0.x+(i-1)*30,S0.z-40],60)||[S0.x+(i-1)*30,S0.z-40]; mids.push({x:o[0],z:o[1]}); }
    MY.zones=mids.map((m,i)=>{ const r=new THREE.Mesh(new THREE.RingGeometry(7.5,8,56),new THREE.MeshBasicMaterial({color:0xd02a40,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide})); r.rotation.x=-Math.PI/2; r.position.set(m.x,.09,m.z); r.renderOrder=3; MY.G.add(r);
      return {id:String(i),x:m.x,z:m.z,r:8,key:ks[i],mid:true,ring:r}; });
    MY.zones.push({id:'F',x:Z.x,z:Z.z,r:Z.r,key:finalOf(fk),mid:false,ring}); }
  fieldMist(MY); return MY; }
/* ============ v2.17 지도 끝 = 저승 안개 (기획자 01:11 2ㄱ) ============
   데이터가 있는 땅 밖으로는 못 나간다. 끝에 다가가면 땅이 안개에 지워지고, 발이 무거워지다가 멈춘다. 밖은 끝없는 안개(빈 회색 땅 대신). */
const EDGE_IN=8, EDGE_FADE=30, MIST_C=0xc9c3cf;
const edgeD=(x,z)=>{ const B=MY.bounds; return Math.min(x-B.x0,B.x0+B.w-x,z-B.z0,B.z0+B.h-z); };
function fieldMist(M){ const B=M.bounds, G=new THREE.Group(); G.name='mist'; M.G.add(G);
  // 1) 땅을 지우는 안개 띠: 안쪽(투명) → 끝(불투명), 얼룩진 안개 무늬
  const bc=document.createElement('canvas'); bc.width=256; bc.height=64; { const x=bc.getContext('2d'); const g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'rgba(201,195,207,0)'); g.addColorStop(.3,'rgba(201,195,207,.08)'); g.addColorStop(.55,'rgba(201,195,207,.3)'); g.addColorStop(.75,'rgba(201,195,207,.8)'); g.addColorStop(.88,'rgba(201,195,207,1)'); x.fillStyle=g; x.fillRect(0,0,256,64);
    let sd=7; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; }; for(let i=0;i<90;i++){ const cx=rnd()*256, cy=10+rnd()*54, r=6+rnd()*18, rg=x.createRadialGradient(cx,cy,0,cx,cy,r); rg.addColorStop(0,`rgba(214,208,222,${.25+rnd()*.3})`); rg.addColorStop(1,'rgba(214,208,222,0)'); x.fillStyle=rg; x.fillRect(cx-r,cy-r,r*2,r*2); } }
  const bt=new THREE.CanvasTexture(bc); bt.wrapS=THREE.RepeatWrapping; bt.colorSpace=THREE.SRGBColorSpace;
  const W=EDGE_FADE+10, o=W/2-10, sides=[[B.x0+B.w/2,B.z0+o,B.w+20,Math.PI],[B.x0+B.w/2,B.z0+B.h-o,B.w+20,0],[B.x0+o,B.z0+B.h/2,B.h+20,-Math.PI/2],[B.x0+B.w-o,B.z0+B.h/2,B.h+20,Math.PI/2]];
  const bands=[]; for(const [cx,cz,len,ry] of sides){ const t=bt.clone(); t.needsUpdate=true; t.repeat.set(len/60,1); const m=new THREE.Mesh(new THREE.PlaneGeometry(len,W),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
    m.rotation.set(-Math.PI/2,0,ry); m.position.set(cx,.14,cz); m.renderOrder=4; G.add(m); bands.push(t); }
  // 2) 밖: 끝없는 안개 바닥
  const om=new THREE.MeshBasicMaterial({color:MIST_C}), E=320;
  for(const [cx,cz,w,h] of [[B.x0+B.w/2,B.z0-E/2,B.w+E*2,E],[B.x0+B.w/2,B.z0+B.h+E/2,B.w+E*2,E],[B.x0-E/2,B.z0+B.h/2,E,B.h],[B.x0+B.w+E/2,B.z0+B.h/2,E,B.h]]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),om); m.rotation.x=-Math.PI/2; m.position.set(cx,.1,cz); G.add(m); }
  // 3) 피어오르는 안개 덩이(카메라를 향한 판 — 한 번에 그림). 건물도 끝에선 안개에 묻힌다
  const pc=document.createElement('canvas'); pc.width=pc.height=128; { const x=pc.getContext('2d'); const rg=x.createRadialGradient(64,64,0,64,64,64); rg.addColorStop(0,'rgba(222,216,230,1)'); rg.addColorStop(.45,'rgba(214,208,222,.7)'); rg.addColorStop(1,'rgba(214,208,222,0)'); x.fillStyle=rg; x.fillRect(0,0,128,128); }
  const pt=new THREE.CanvasTexture(pc); pt.colorSpace=THREE.SRGBColorSpace; const puffs=[];
  const mkRow=(rows,op)=>{ const L=[]; let sd=11; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
    for(const [ins,sc,step] of rows){ for(let a=-ins;a<=B.w+ins;a+=step){ L.push([B.x0+a+rnd()*3,B.z0+ins+rnd()*2,sc*(.8+rnd()*.4)]); L.push([B.x0+a+rnd()*3,B.z0+B.h-ins-rnd()*2,sc*(.8+rnd()*.4)]); }
      for(let a=ins+step;a<=B.h-ins-step;a+=step){ L.push([B.x0+ins+rnd()*2,B.z0+a+rnd()*3,sc*(.8+rnd()*.4)]); L.push([B.x0+B.w-ins-rnd()*2,B.z0+a+rnd()*3,sc*(.8+rnd()*.4)]); } }
    const mat=new THREE.MeshBasicMaterial({map:pt,transparent:true,depthWrite:false,opacity:op}); const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),mat,L.length); const o=new THREE.Object3D(); o.rotation.copy(bbFace);
    L.forEach((p,i)=>{ o.position.set(p[0],p[2]*.32,p[1]); o.scale.set(p[2],p[2]*.8,1); o.updateMatrix(); im.setMatrixAt(i,o.matrix); }); im.frustumCulled=false; im.renderOrder=7; G.add(im); puffs.push({mat,op}); };
  mkRow([[-9,18,6],[-3,15,6]],.8); mkRow([[1,10,7]],.25);
  M.mist={bands,puffs}; }
function mistTick(dt,t){ const Mi=MY&&MY.mist; if(!Mi) return; for(const b of Mi.bands) b.offset.x=(t*.012)%1; Mi.puffs.forEach((p,i)=>p.mat.opacity=p.op*(.88+.12*Math.sin(t*.7+i*1.9))); }
// 끝에 다가가면 발이 무거워지고(바깥쪽으로만), 경계에서 멈춘다
function edgeHold(P,ox,oz){ const B=MY.bounds, lo=EDGE_IN, band=14;
  const slow=(d,mv)=>mv?(.2+.8*Math.max(0,Math.min(1,(d-lo)/band))):1;
  { const d0=P.x-B.x0, d1=B.x0+B.w-P.x, dx=P.x-ox; if(dx<0&&d0<lo+band) P.x=ox+dx*slow(d0,1); if(dx>0&&d1<lo+band) P.x=ox+dx*slow(d1,1); }
  { const d0=P.z-B.z0, d1=B.z0+B.h-P.z, dz=P.z-oz; if(dz<0&&d0<lo+band) P.z=oz+dz*slow(d0,1); if(dz>0&&d1<lo+band) P.z=oz+dz*slow(d1,1); }
  P.x=Math.max(B.x0+lo,Math.min(B.x0+B.w-lo,P.x)); P.z=Math.max(B.z0+lo,Math.min(B.z0+B.h-lo,P.z));
  if(edgeD(P.x,P.z)<lo+1.5&&S.t-(S.edgeT??-99)>8){ S.edgeT=S.t; toast('🌫 안개가 길을 지운다','더는 갈 수 없다 · 불빛이 닿는 곳으로 돌아가자'); DBG.edge=(DBG.edge||0)+1; } }
// 가게 업종 = 뒤지면 나오는 것 (21번 3장): 약국 → 회복 · 옷 → 몸·발 · 화장품·미용 → 머리 · 철물 → 손·도구 · 편의점·가게 → 아무거나 · 식당·카페 → 불씨 재료
// v2.9: 가게에선 장비가 아니라 강화재료 — 옷 → 실타래(몸·발) · 화장품·미용 → 고운 가루(머리) · 철물 → 쇠붙이(손·도구) · 편의점·가게 → 셋 중 하나 · 식당·카페·은행·술집 → 불씨 재료
const MTN={sil:{n:'실타래',ic:'🧵',gk:'m_sil'},garu:{n:'고운 가루',ic:'🫙',gk:'m_garu'},soe:{n:'쇠붙이',ic:'🔩',gk:'m_soe'}};
const SLOTMT={head:'garu',body:'sil',foot:'sil',hand:'soe',tool:'soe'};
function shopLoot(c){ const pick=a=>a[Math.floor(Math.random()*a.length)];
  if(c==='cloth') return 'sil'; if(c==='cos'||c==='hair') return 'garu'; if(c==='tool') return 'soe'; if(c==='conv'||c==='shop') return pick(['sil','garu','soe']);
  if(c==='pharm') return 'heal'; return 'mat'; }
function nearFire(P){ let b=MY.fires[0],bd=1e9; for(const f of MY.fires){ const d=Math.hypot(f.x-P.x,f.z-P.z); if(d<bd){ bd=d; b=f; } } return {f:b,d:bd}; }
function pickFront(x,z,dmin,dmax){ const P0=[x,z], L=[];
  for(const f of MY.FRONTS){ const d=Math.hypot(f.x-x,f.z-z); if(d<dmin||d>dmax||MY.blocked(f.x,f.z)||edgeD(f.x,f.z)<EDGE_IN+3) continue; if(nearFire(f).d<SAFE_R+2) continue; if(SPOTS.some(o=>Math.hypot(o.x-f.x,o.z-f.z)<4)) continue; L.push(f); }
  return L.length?L[Math.floor(Math.random()*L.length)]:null; }
function fieldSpots(P){ const lp=S.fLoot>0; S.spotT=lp?2.5+Math.random()*2:10+Math.random()*5;
  if(SPOTS.filter(o=>!o.boss).length>=(lp?8:3)) return; const f=pickFront(P.x,P.z,lp?5:9,lp?28:24); if(!f) return;
  mkSpot(f.x,f.z,lp&&Math.random()<.3,f.s); if(!lp&&!S.spotTold){ S.spotTold=1; toastOnce('spot',gi('u_spark')+' 빛나는 가게',`${f.s.name} · 지나가면 줍는다`,true); } }
function fieldTick(dt,P){ S.distLit=0; S.onRoad=false; S.inWood=false; if(S.duel) duelTick(dt,P);
  S.shT=(S.shT||0)-dt; if(S.shT<=0){ S.shT=.2; const s0=MY.nearShop(P,3.4), s=s0&&SPOTS.some(o=>o.shop===s0)?s0:null, el=$('shopTag'); if(el&&s!==S.shop){ S.shop=s; if(s){ const C=MY.CAT[s.c]; el.innerHTML=`<b>${C.k}</b> <span></span><small>지나가면: ${C.loot}</small>`; el.style.opacity=1; } else el.style.opacity=0; } }
  const nf=nearFire(P), d=nf.d;
  if(S.fLoot>0&&d<SAFE_R-.2&&!S.doom&&S.phase==='play'){ S.inSafe=true; emberConfirm(); roundEnd(false); return; } if(d>7) S.fireCd=false; else if(d<2.8&&!S.fireCd&&S.phase==='play'&&!boss.alive&&!S.doom&&S.t>40&&!S.duel){ S.fireCd=true; fieldFire(nf.f); } // v2.35: 막 나선 첫 40초엔 「기지로 돌아갈까」를 묻지 않는다
  if(S.doom){ doomTick(dt,P); }
  else if(S.fLoot>0){ S.fLoot-=dt; const el=$('fLootT'); if(el){ el.style.display='block'; el.classList.remove('sm'); el.dataset.t=''; const r=Math.max(0,Math.ceil(S.fLoot)); el.innerHTML=`🔥 모닥불로 <b>${Math.floor(r/60)}:${String(r%60).padStart(2,'0')}</b><small>빛 안에 닿으면 판 끝 · 늦으면 ？？？가 깨어난다${S.ember?' · 불씨도 꺼진다':''}</small>`; el.classList.toggle('warn',r<=30&&!S.inSafe); }
    if(S.fLoot<=0){ if(S.inSafe) roundEnd(false); else doomStart(); } }
  else { const el=$('fLootT'); if(el&&(boss.alive||S.duel)){ el.style.display='none'; } else if(el){ const n=midsN(), t=n>=3?`${gi('u_final')}파이널 보스 열림`:`${gi('u_mid')}중간보스 <b>${n}/3</b>`; /* v2.36 위쪽 띠 짧게 */ if(el.dataset.t!==t){ el.dataset.t=t; el.innerHTML=t; } el.style.display='block'; el.classList.add('sm'); } }
  S.drT=(S.drT||0)-dt; if(S.drT<=0){ S.drT=.4; dropsSync(); }
  S.stT=(S.stT||0)-dt; if(S.stT<=0){ S.stT=.25; stackTop(); } }
// v2.9: 보스가 남긴 불씨 덩어리 → 모닥불에 닿으면 장비가 된다 (괴수는 장비를 떨구지 않음 — 불이 기억을 물건으로 빚는다)
function emberConfirm(){ const G=S.emG||[], k=Math.max(S.ember||0,G.length); if(!k&&!(S.loot&&S.loot.length)) return 0; S.ember=0; S.emG=[]; if(FIELD) S.kept=(S.kept||0)+k;
  for(let i=0;i<k;i++){ let g=G[i]?G[i].g:rollGrade(dropW('fin')); if(S.fb&&g<3&&Math.random()<S.fb.emb) g++; (S.loot||(S.loot=[])).push(Object.assign(makeGear(g),{_src:'fire'})); }
  const L=S.loot.slice(), n=lootConfirm(); if(!n) return 0; const best=L.reduce((a,b)=>gRank(b)>gRank(a)?b:a);
  toast(k?`🔥 불씨 덩어리가 장비가 됐다`:`🎒 장비 ${n}개 내 것이 됐다`,`${gIc(best)} ${gName(best)} (${gGr(best).n})${n>1?' 외 '+(n-1)+'개':''} · 모닥불 → 🎒 장비`); if(gRank(best)>=3) DBG.shake=.3; sfx.lvl(); return n; }
function fieldFire(F){
  emberConfirm(); const first=!F||F===MY.fire;
  const lp=S.fLoot>0, lr=Math.max(0,Math.ceil(S.fLoot||0)); showChoice('모닥불',(first?fName()+' 어귀.':'골목 안쪽 모닥불.')+' 불빛이 따뜻하다.<br>들고 있는 기억 조각 <b>'+shardsEarned('all')+'</b>'+(lp?`<br><small>파이널 보스를 보냈다 · 빛 안에 닿으면 <b>판 끝</b></small>`:''),{a:'모닥불 기지로 돌아간다 — 조각을 모두 맡기고 판을 끝낸다',b:'불만 쬐고 계속 걷는다'},c=>{
    if(c==='a') gameOver('rest'); else { S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.25); toast('불을 쬐었다','쓰러지면 모닥불 기지에서 깨어난다'); } },''); }
function fieldSafe(dt,P,t){ MY.ring.material.opacity=.38+.18*Math.sin(t*3); mistTick(dt,t);
  for(const f of MY.fires){ const dd=Math.hypot(f.x-P.x,f.z-P.z), nr=Math.max(.15,Math.min(1,(dd-3)/14)); f.g.beam.material.opacity=(.75+.25*Math.sin(t*1.7))*nr*.7; f.g.disc.material.opacity=(.85+.15*Math.sin(t*1.3))*.6; }
  const nf=nearFire(P), F=nf.f, d=nf.d;
  S.inSafe=d<SAFE_R-.2; if(S.inSafe&&S.phase==='play'&&(S.ember||(S.loot&&S.loot.length))) emberConfirm(); if(d>SAFE_R+25) return;
  for(const e of enemies){ if(e.dead||e.d.treasure) continue; const dx=e.x-F.x,dz=e.z-F.z,dd=Math.hypot(dx,dz)||.01, R=SAFE_R+e.d.r*.6; if(dd<R){ e.x=F.x+dx/dd*R; e.z=F.z+dz/dd*R; e.kx=dx/dd*3; e.kz=dz/dd*3; if(e.ch) e.ch=null; } }
  for(let i=foxShots.length-1;i>=0;i--){ const f=foxShots[i]; if(Math.hypot(f.x-F.x,f.z-F.z)<SAFE_R) foxShots.splice(i,1); }
  if(S.inSafe){ if(S.hp<S.maxhp) S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.04*dt); if(S.hails) S.hails.length=0; if(!S.safeMsg){ S.safeMsg=1; if(S.t>3) toastOnce('safe','모닥불 곁','불빛 안에선 아무도 싸울 수 없다 · 쉬는 동안 괴수가 흩어진다',true); else S.safeMsg=0; } safeScatter(F,dt); } else if(d>SAFE_R+3) S.safeMsg=0; }
/* ============ v2.10 한 판 (28번): 중간보스 3 → 파이널 1 · 바닥 불씨는 먼저 줍는 사람 것 · 파이널 뒤 3분 안에 모닥불 ============
   혼자서도 같은 구조. 멀티(room presence)에선 판 번호(r)·보낸 보스(bd)·보스에 준 피해(bh)·주운 불씨(pk)·흘린 불씨(dr)를 서로 맞춘다. */
const MID_HP=1, FIN_HP=2.5, MID_N=3;
// v2.11 (29번 1ㄱ): 보스 체력 = 기본 × (중간 1 · 파이널 2.5) × 레벨 배수 × 사람 수. 멀티는 같은 필드에서 가장 높은 레벨 · 처음 정해진 체력을 모두가 같이 씀(bm)
const bossLvF=L=>{ const x=Math.max(0,(L|0)-1); return 1+.1*x+.006*x*x; };
function bossMaxFor(Z){ let L=S.lv|0, n=1; for(const p of mpPeers()){ const pr=p.presence; if(pr.a!=='f:'+S.field) continue; L=Math.max(L,Math.min(99,pr.l|0)); if(typeof pr.x==='number'&&Math.hypot(pr.x-Z.x,pr.z-Z.z)<45) n++; }
  return Math.round(BOSSDEF[Z.key].hp*(Z.mid?MID_HP:FIN_HP)*bossLvF(L)*(1+.6*(n-1))*deepF(S.deep||0).bhp*TU('bhp')); }
// v2.61 (11-19 기획자 「보스피가 안 빠져」): 나중에 온 사람(레벨 높음·사람 수 많음)이 더 큰 체력을 정하면 모두의 보스가 그만큼 다시 찼다 → 가장 먼저 정한 값(t가 가장 이른 것)을 모두가 따른다
function mpBossPick(zid){ let b=null; for(const p of mpFieldPeers()){ const bm=p.presence.bm; if(Array.isArray(bm)) for(const e of bm){ if(!Array.isArray(e)||String(e[0])!==zid) continue; const mx=Math.min(5e6,+e[1]||0), t=+e[2]||9e15; if(mx>0&&(!b||t<b.t||(t===b.t&&mx<b.mx))) b={mx,t}; } } return b; }
// v2.61 보스가 스스로 차는 것(괴수 먹기·불 삼키기·되찾기)은 화면마다 따로 일어나 체력이 서로 달라지고 「안 빠지는」 사람이 생겼다 → 함께 싸우면 「주인」(이름이 가장 앞선 사람) 화면만 차고, 그 몫(bl)을 모두가 따른다
function mpBossHeal(zid){ let s=0; for(const p of mpFieldPeers()){ const bl=p.presence.bl; if(Array.isArray(bl)) for(const e of bl) if(Array.isArray(e)&&String(e[0])===zid) s+=Math.max(0,Math.min(5e6,+e[1]||0)); } return s; }
const mpBossNet=zid=>mpBossDmg(zid)-mpBossHeal(zid);
function bossOwner(){ if(boss.zid==null||!MP.me) return true; const Z=zoneById(boss.zid); let me=true; for(const p of mpFieldPeers()){ const q=p.presence; if(q.a!=='f:'+S.field||typeof q.x!=='number') continue; if(Z&&Math.hypot(q.x-Z.x,q.z-Z.z)>60) continue; if(p.peer<MP.me) me=false; } return me; }
function bossHeal(n,mine){ if(!(n>0)) return; if(boss.zid!=null&&!mine&&!bossOwner()) return; const was=boss.hp; boss.hp=Math.min(boss.maxhp,boss.hp+n); if(boss.zid!=null) MPF.bhl[boss.zid]=(MPF.bhl[boss.zid]||0)+(boss.hp-was); }
const bmWins=(sh,mx,t)=>!!sh&&(!mx||sh.t<t||(sh.t===t&&sh.mx<mx));
function mpBossMax(zid){ let m=0; for(const p of mpFieldPeers()){ const bm=p.presence.bm; if(Array.isArray(bm)) for(const e of bm) if(Array.isArray(e)&&String(e[0])===zid) m=Math.max(m,Math.min(5e6,+e[1]||0)); } return m; }
const MPF={fk:null,rd:0,bd:'',bm:{},bt:{},bhl:{},bdmg:{},oSeen:{},pk:[],dr:[],hit:{},hitSeen:{},hitTold:{},bp:{},drops:new Map(),tag:Math.random().toString(36).slice(2,6),dn:0,lockT:-99,holdSeen:new Set(),pkOld:new Set(),finT:-1e9};
function hash01(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return ((h>>>0)%100000)/100000; }
function gradeOf(id,fin){ const w=dropW(fin?'fin':'mid'), T=w.reduce((a,b)=>a+b,0); let r=hash01(id+'g')*T; for(let i=0;i<w.length;i++){ r-=w[i]; if(r<0&&w[i]>0) return i; } return 2; } // v2.55: 모두에게 같은 등급(자리 이름으로 정함)
const zoneById=id=>MY&&MY.zones?MY.zones.find(z=>z.id===String(id)):null;
const midsN=()=>MY&&MY.zones?MY.zones.filter(z=>z.mid&&MPF.bd.includes(z.id)).length:0;
const midsDone=()=>midsN()>=MID_N;
function nextZone(P){ if(S&&S.duel){ const D=S.duel, E=D.G.filter(G=>G.hp>0&&G.tm!==D.tm), L=E.some(G=>G.mid)?E.filter(G=>G.mid):E; let b=null,bd=1e9; for(const G of L){ const d=Math.hypot(G.x-P.x,G.z-P.z); if(d<bd){ bd=d; b=G; } } return b; } if(!MY||!MY.zones||S.fLoot>0) return null; let b=null,bd=1e9; for(const Z of MY.zones){ if(MPF.bd.includes(Z.id)) continue; if(!Z.mid&&!midsDone()) continue; const d=Math.hypot(Z.x-P.x,Z.z-P.z); if(d<bd){ bd=d; b=Z; } } return b; }
function zonesRefresh(){ if(!MY||!MY.zones) return; for(const Z of MY.zones){ Z.ring.visible=!MPF.bd.includes(Z.id); if(!Z.mid){ Z.ring.material.color.set(midsDone()?0xd02a40:0x8a8a9a); Z.ring.material.opacity=midsDone()?.5:.3; } } }
function rmSpot(o){ if(o.g.parent) o.g.parent.remove(o.g); const i=SPOTS.indexOf(o); if(i>=0) SPOTS.splice(i,1); }
function newRound(r){ MPF.rd=r; MPF.bd=''; MPF.pkOld=new Set(); MPF.bp={}; MPF.bm={}; MPF.bt={}; MPF.bdmg={}; MPF.bhl={}; MPF.oSeen={}; MPF.pk=[]; MPF.dr=[]; MPF.hit={}; MPF.hitSeen={}; MPF.hitTold={}; for(const o of MPF.drops.values()) rmSpot(o); MPF.drops.clear(); zonesRefresh(); }
function roundStart(fk){ if(MPF.fk!==fk){ MPF.fk=fk; newRound(0); } else if(MPF.bd.includes('F')) newRound(MPF.rd+1); else { for(const o of MPF.drops.values()) rmSpot(o); MPF.drops.clear(); zonesRefresh(); }
  S.drT=0; mpAdoptRound(true); }
function pickStartFire(fk){ const F=MY.fires.filter(f=>Math.hypot(f.x-MY.zone.x,f.z-MY.zone.z)>35); if(BOT&&!location.search.includes('rf')) return MY.fire; if(!F.length) return MY.fire;
  const others=mpPeers().filter(p=>p.presence.a==='f:'+fk&&typeof p.presence.x==='number').map(p=>p.presence);
  if(others.length){ let b=F[0],bs=-1; for(const f of F){ let d=1e9; for(const o of others) d=Math.min(d,Math.hypot(o.x-f.x,o.z-f.z)); if(d>bs){ bs=d; b=f; } } return b; }
  return F[Math.floor(Math.random()*F.length)]; }
// 떨어진 불씨 목록 = 보낸 보스 자리(모두에게 같은 자리·등급) + 쓰러진 사람이 흘린 것. 누가 주웠으면(pk) 사라진다
function dropList(){ const L=[];
  // v2.15d (기획자 22:59): 불씨 덩어리는 보스가 쓰러진 자리 바로 곁에 (멀티는 쓰러뜨린 사람이 presence bp로 자리를 알림 · 모르면 구역 가운데)
  for(const Z of MY.zones||[]) if(MPF.bd.includes(Z.id)){ const n=Z.mid?1:2, bp=MPF.bp[Z.id]; let cx=bp?bp[0]:Z.x, cz=bp?bp[1]:Z.z; if(MY.blocked(cx,cz)){ let ok=false; for(let rr=1.5;rr<=9&&!ok;rr+=1.5) for(let k=0;k<8;k++){ const a=k*.785, tx=cx+Math.cos(a)*rr, tz=cz+Math.sin(a)*rr; if(!MY.blocked(tx,tz)){ cx=tx; cz=tz; ok=true; break; } } if(!ok){ cx=Z.x; cz=Z.z; } }
    for(let i=0;i<n;i++){ const id=`${MPF.rd}${Z.id}${i}`, a=hash01(id)*6.283, rr2=n>1?1.6:.6; let x=cx+Math.cos(a)*rr2, z=cz+Math.sin(a)*rr2; if(MY.blocked(x,z)){ x=cx; z=cz; } L.push({id,x,z,g:gradeOf(id,!Z.mid)}); } }
  for(const d of MPF.dr) L.push({id:d[0],x:d[1],z:d[2],g:d[3]});
  for(const p of mpFieldPeers()){ const dr=p.presence.dr; if(!Array.isArray(dr)) continue; for(const d of dr.slice(0,8)) if(Array.isArray(d)&&d.length===4&&typeof d[1]==='number'&&typeof d[2]==='number') L.push({id:String(d[0]).slice(0,24),x:d[1],z:d[2],g:Math.max(0,Math.min(4,d[3]|0)),pty:ptRaw(p)}); }
  return L; }
function pickedBy(){ const m=new Map(); for(const id of MPF.pk) m.set(id,'me'); for(const id of MPF.pkOld) if(!m.has(id)) m.set(id,'old'); for(const p of mpFieldPeers()){ const pk=p.presence.pk; if(Array.isArray(pk)) for(const id of pk.slice(0,40)) if(!m.has(String(id))) m.set(String(id),p); } return m; }
function dropsSync(){ if(!FIELD||!S||!MY.zones) return; const L=dropList(), pk=pickedBy(), live=new Set(), P=player.root.position;
  for(const d of L){ if(pk.has(d.id)||live.has(d.id)) continue; live.add(d.id); if(!MPF.drops.has(d.id)){ const o=mkSpot(d.x,d.z,true,null,true); o.did=d.id; o.gr=d.g; o.dpty=!!d.pty; o.life=1e9; MPF.drops.set(d.id,o); if(/^\d+F\d$/.test(d.id)&&S.scramble&&performance.now()-MPF.finT<2500){ o.lock=3+(d.id.endsWith('1')?.25:0); o.lk0=o.lock; } } }
  for(const [id,o] of MPF.drops) if(!live.has(id)){ rmSpot(o); MPF.drops.delete(id); const who=pk.get(id); if(who&&who!=='me'&&who!=='old'&&Math.hypot(o.x-P.x,o.z-P.z)<40) toast(`🔥 ${mpName(who)}가 불씨 덩어리를 주웠다`,'쫓아가서 쓰러뜨리면 떨어진다'); } }
function fieldZone(){ const P=player.root.position; nbTick(P);
  if(boss.alive&&boss.tier==='normal'){ if(!boss.dying) nbLeash(P); return; } // v2.56 일반 보스
  if(boss.alive){ if(boss.dying||boss.dbg) return; const Z=zoneById(boss.zid)||MY.zone; if(Math.hypot(P.x-Z.x,P.z-Z.z)>(Z.mid?45:55)){ boss.alive=false; boss.root.visible=false; bossL.on=false; bossL.l.intensity=0; slamRing.visible=false; teleMesh.visible=false; $('boss').style.display='none'; toast(boss.def.name+'가 물러났다','구역 밖까지는 쫓아오지 않는다 · 준 피해는 남는다'); } return; }
  if(S.fLoot>0||S.doom||!MY.zones||S.duel) return;
  for(const Z of MY.zones){ if(MPF.bd.includes(Z.id)||Math.hypot(P.x-Z.x,P.z-Z.z)>=Z.r) continue;
    if(!Z.mid&&!midsDone()){ if(S.t-MPF.lockT>6){ MPF.lockT=S.t; toast('🔒 아직 열리지 않았다',`중간보스 ${midsN()}/3 · 셋을 모두 보내야 파이널 보스가 깨어난다`); } continue; }
    S.bossKey=Z.key; S.bossZone=S.field; S.bossZid=Z.id; spawnBoss(); break; } }
function bossDefeatedF(){ if(boss.tier==='normal') return nbDefeated(); const Z=zoneById(boss.zid)||(MY.zones||[]).find(z=>!z.mid); if(Z) zoneKilled(Z,true); }
function zoneKilled(Z,mine,who){ if(MPF.bd.includes(Z.id)) return; MPF.bd+=Z.id; if(!Z.mid){ MPF.finT=performance.now(); S.scramble=(mpFieldPeers().length>0||!!MP.ties||!!(DBG.fakePeers&&DBG.fakePeers.length))?1:0; if(PTY.id&&mpFieldPeers().some(ptRaw)){ S.ptBroke=1; S.scramble=1; DBG.ptBroke=(DBG.ptBroke||0)+1; } } if(mine&&!MPF.bp[Z.id]){ const bpp=boss.root.position; MPF.bp[Z.id]=[Math.round(bpp.x*10)/10,Math.round(bpp.z*10)/10]; } const fk=S.field||'myeong', B=BOSSDEF[Z.key];
  if(!mine&&boss.alive&&boss.zid===Z.id){ boss.alive=false; boss.root.visible=false; bossL.on=false; bossL.l.intensity=0; slamRing.visible=false; teleMesh.visible=false; }
  if(!boss.alive) $('boss').style.display='none';
  if(mine){ S.bossesW=(S.bossesW||0)+1; S.bonus=(S.bonus||0)+(Z.mid?20:50); }
  { const myD=MPF.bdmg[Z.id]||0, oD=mpBossDmg(Z.id); if(oD>0) S.cpP=1; S.cpM=(S.cpM||0)+myD; S.cpA=(S.cpA||0)+myD+oD; } // 같이 깎은 몫
  zonesRefresh(); dropsSync(); const by=mine?'':`${who||'누군가'}가 `;
  if(Z.mid){ const n=midsN(); toast(mine?B.bye:`${by}${B.name}를 보냈다`,`중간보스 ${n}/3 · 불씨 덩어리가 떨어졌다 — 먼저 줍는 사람 것`);
    if(n>=MID_N) setTimeout(()=>{ if(S&&S.phase!=='over') toast(gi('u_final')+' 파이널 보스 구역이 열렸다','중간보스 셋을 모두 보냈다 · 더 좋은 불씨가 기다린다'); },2600);
    jpTry(Z,mine);
    if(BOT) DBG.mid=(DBG.mid||0)+1; save(); return; }
  const dO0=deepOpen(fk), first=mine&&!SV.cleared[fk]; if(mine){ SV.cleared[fk]=(SV.cleared[fk]||0)+1; S.fDone=1; } save();
  if(mine&&(S.deep||0)>=dO0&&(S.deep||0)<DEEP_MAX){ SV.deep=SV.deep||{}; SV.deep[fk]=Math.max(SV.deep[fk]||0,(S.deep||0)+1); save(); }
  { const dO1=deepOpen(fk); if(mine&&dO1>dO0) setTimeout(()=>toast(`🕳 저승 깊이 ${dO1}까지 열렸다`,`${FIELDS[fk].name} · 깊을수록 세고 많이 남는다`),6500); }
  if(mine&&!Z.mid){ const E=epAdvance(fk), E2=E&&fk==='gyeong'&&EP_ORDER[SV.ep]==='gyeong'?null:null; if(E){ S.epShow=E; setTimeout(()=>toast('📖 '+E.t,'모닥불로 돌아가면 이야기가 이어진다'),3200); } else if((SV.ep||0)<EP_ORDER.length&&EP_ORDER[SV.ep||0]!==fk){ const nk=EP_ORDER[SV.ep||0]; setTimeout(()=>toast('📖 이야기는 '+(FIELDS[nk]?FIELDS[nk].name:nk)+'에서 이어진다',''),3200); } }
  for(const e of enemies){ if(e.dead) continue; e.dead=true; if(Math.random()<.3) burst(e.x,.6,e.z,2); } foxShots.length=0; if(S.hails) S.hails.length=0;
  S.fLoot=TU('loot'); S.spotT=1.5;
  const crowd=!!S.scramble;
  const after=()=>{ // v2.15b (기획자 21:29): 선택 창 없이 안내 글 — 3분 안에 모닥불로, 남은 자에겐 이름 없는 그것이 깨어난다
    if(crowd){ tieCut(); HS=Math.max(HS,.5); DBG.shake=Math.max(DBG.shake||0,.7); buzz([60,40,120]);
      if(S.ptBroke) doomBan('✂ 함께 싸운 끈이 끊어졌다','파티도 여기까지 · 불씨는 하나','돌아갈 길은 각자 · <b>파티원도 덮친다</b> · 판이 끝나면 다시 한 파티'); else doomBan('✂ 함께 싸운 끈이 끊어졌다','불씨는 하나','돌아갈 길은 각자 · 불씨를 든 사람은 모두가 노린다');
      setTimeout(()=>{ if(S&&S.phase==='play') doomBan('불씨가 솟았다 · <b>3초</b> 뒤 떨어진다','<b>3분</b> 안에 모닥불 빛 안으로','먼저 줍는 사람 것 · 빛 안에 닿으면 <b>판 끝</b><br>남은 자에게는 <b>이름 없는 그것</b>이 깨어난다'); },2600);
      if(first) setTimeout(()=>toast('불이 커졌다','불 '+fireLv()+'단계 · 들고 있는 조각 +50'),6200);
      if(BOT&&mine) DBG.victory={t:S.t,lv:S.lv,kills:S.kills,hp:S.hp,zone:S.field+'-field'}; return; }
    doomBan(mine?B.bye:`${by}${B.name}를 보냈다`,'<b>3분</b> 안에 모닥불 빛 안으로','빛 안에 닿으면 <b>판 끝</b> — 들고 온 불씨는 내 것<br>남은 자에게는 <b>이름 없는 그것</b>이 깨어난다');
    if(first) setTimeout(()=>toast('불이 커졌다','불 '+fireLv()+'단계 · 들고 있는 조각 +50'),4200);
    if(BOT&&mine) DBG.victory={t:S.t,lv:S.lv,kills:S.kills,hp:S.hp,zone:S.field+'-field'}; };
  after(); }
/* ============ v2.15b 이름 없는 그것 (기획자 21:29) ============
   파이널 보스 뒤 3분 안에 모닥불 빛 안에 못 들어간 사람에게만 깨어난다. 이름도 체력 막대도 없다 — 쓰러뜨릴 수 없고, 빛 안으로 도망치는 수밖에.
   거대한 어둠 + 눈만 보임(그림자 그림을 검게 크게). 1·2막 규칙: 사람 흔적·말 없음. 혼자만의 연출(멀티 동기화 안 함). */
let doomS=null, doomE=null;
/* ============ v2.32 중간보스 잭팟 「혼불 터짐」 (44번 A11, 기획자 11-17 14:55 모두 ㄱ) ============
   중간보스가 쓰러지면 보스 체력 5% 이상 깎은 사람은 모두 각자 받는다(혼자면 늘). 1개 60% · 3개 30% · 5개 10%.
   가진 것만 오른다 — 각성·2차 각성·조합이 준비돼 있으면 그것부터. 게임은 멈추지 않고 연출 2초 동안 무적.
   불씨 덩어리(장비)는 그대로 바닥 선착순 → 「같이 잡고 각자 잭팟 → 불씨 쟁탈」. 파이널은 판 끝이라 없음. */
const JP_MIN=.05;
function jpCount(){ const r=Math.random(); return r<.6?1:r<.9?3:5; }
function jpOne(){ const W=S.W, P=S.P, E=S.evo;
  for(const k in FUS){ const f=FUS[k]; if(f.char&&f.char!==S.char) continue; if(W[f.a]>=5&&W[f.b]>=5&&!S.fu[k]) return {kind:'fu',id:k,ic:f.ic,name:f.name,tag:'조합'}; }
  for(const k in EVOS){ const ev=EVOS[k]; if(W[k]===5&&P[ev.need]&&!E[k]) return {kind:'evo',id:k,ic:WEAPONS[k].ic,name:ev.name,tag:'각성'};
    if(E[k]&&(P[ev.need]||0)>=5&&!(S.evo2&&S.evo2[k])) return {kind:'evo2',id:k,ic:WEAPONS[k].ic,name:'진 '+ev.name,tag:'2차 각성'}; }
  const c=[];
  for(const k in W){ if(E[k]||W[k]>=5||S.sealed[k]) continue; c.push({kind:'w',id:k,ic:WEAPONS[k].ic,name:WEAPONS[k].name}); c.push(c[c.length-1]); } // 무기를 조금 더 자주
  for(const k in P){ if(P[k]>=5||S.sealed['p_'+k]) continue; c.push({kind:'p',id:k,ic:PASSIVES[k].ic,name:PASSIVES[k].name}); }
  if(!c.length) for(const k in W) if(W[k]>=5) c.push({kind:'star',id:k,ic:WEAPONS[k].ic,name:WEAPONS[k].name+' ★'});
  if(!c.length) return {kind:'heal',id:'heal',ic:'♨',name:'따뜻한 불씨'};
  return c[Math.floor(Math.random()*c.length)]; }
function jpLab(c){ if(c.kind==='w') return `${c.name} ${S.W[c.id]}`; if(c.kind==='p') return `${c.name} ${S.P[c.id]}`; if(c.kind==='star') return `${c.name}${(S.star&&S.star[c.id])||''}`; if(c.kind==='heal') return c.name; return `${c.name}${c.tag?' · '+c.tag:''}`; }
function jpTry(Z,mine){ if(!S||!Z||!Z.mid) return;
  const solo=!mpFieldPeers().length&&!(DBG.fakePeers&&DBG.fakePeers.length), mx=MPF.bm[Z.id]||bossMaxFor(Z), myD=MPF.bdmg[Z.id]||0;
  const ok=(solo&&mine)||(mx>0&&myD>=JP_MIN*mx);
  if(BOT) (DBG.jpTry=DBG.jpTry||[]).push({z:Z.id,mine:!!mine,solo,ok,pct:mx?Math.round(myD/mx*1000)/10:0});
  if(!ok){ if(myD>0) setTimeout(()=>{ if(S) toast('🔥 혼불이 스쳐 갔다',`보스 체력 5% 넘게 깎은 사람만 받는다 · 나는 ${mx?Math.round(myD/mx*100):0}%`); },1400); return; }
  setTimeout(()=>{ if(S&&S.phase!=='over') jpRun(jpCount()); },500); }
function jpRun(n){ const S0=S, P=player.root.position; S.jpInv=2.2; S.jpN=(S.jpN||0)+1; HS=Math.max(HS,.3); DBG.shake=Math.max(DBG.shake||0,n>=5?.9:.5); buzz(n>=5?[60,40,60,40,140]:[50,30,90]);
  // 불꽃이 사방에서 몸으로 빨려 든다
  for(let i=0;i<3;i++) er(P.x,P.z,6.5-i*1.4,.4,.65+i*.2,i?AMBER:GOLD,1.1);
  for(let i=0;i<46;i++){ const a=Math.random()*6.283, r=3.5+Math.random()*3.5, t=.55+Math.random()*.2; ep(P.x+Math.cos(a)*r,.6+Math.random()*1.4,P.z+Math.sin(a)*r,-Math.cos(a)*r/t,.3,-Math.sin(a)*r/t,t,.32,i%3?AMBER:GOLD); }
  const b=$('jpBan'); const pool=[...Object.keys(S.W).map(k=>WEAPONS[k].ic),...Object.keys(S.P).map(k=>PASSIVES[k].ic)]; if(!pool.length) pool.push('🔥');
  if(b){ b.className=''; b.innerHTML=`<small>혼불 터짐${n>1?` · <b>${n}</b>`:''}</small><div class="jr">${'<span class="js"></span>'.repeat(n)}</div><i></i>`; void b.offsetWidth; b.classList.add('show'); if(n>=5) b.classList.add('jpBig'); }
  const slots=b?[...b.querySelectorAll('.js')]:[], labs=new Map(); let spin=setInterval(()=>{ for(const el of slots) if(!el.dataset.d) el.innerHTML=pool[Math.floor(Math.random()*pool.length)]; },70);
  try{ tone('sawtooth',180,520,.5,.06,.02); }catch(e){}
  for(let i=0;i<n;i++) setTimeout(()=>{ if(S!==S0) return; const c=jpOne(); apply(c); const lb=jpLab(c); labs.delete(c.kind==='star'?'w:'+c.id:c.kind+':'+c.id); if(c.kind==='star') labs.delete('star:'+c.id); labs.set(c.kind==='star'?'star:'+c.id:c.kind+':'+c.id,lb); if(BOT) (DBG.jp=DBG.jp||[]).push(c.kind+':'+c.id);
      const el=slots[i]; if(el){ el.dataset.d=1; el.innerHTML=c.ic; el.classList.add('on'); if(c.kind==='evo'||c.kind==='evo2'||c.kind==='fu') el.classList.add('ev'); }
      const it=b&&b.querySelector('i'); if(it) it.innerHTML=[...labs.values()].join(' · ');
      const Q=player.root.position; er(Q.x,Q.z,.4,2.6+i*.4,.45,GOLD,1); epBurst(Q.x,1.1,Q.z,14,3.5,.5,.3,GOLD,3);
      try{ const f=[523,659,784,988,1175][i%5]; tone('triangle',f,f*1.01,.22,.11,.005); }catch(e){}
      if(i===n-1){ clearInterval(spin); spin=0; try{ if(n>=5) sfx.jing(); else sfx.lvl(); }catch(e){}
        if(n>=5){ const Q2=player.root.position; for(let k=0;k<3;k++) er(Q2.x,Q2.z,.5,5+k*2.5,.8+k*.2,GOLD,1); epBurst(Q2.x,1,Q2.z,60,6,.9,.45,GOLD,4); }
        setTimeout(()=>{ if(b) b.classList.remove('show','jpBig'); },1500); }
    },420+i*300);
  setTimeout(()=>{ if(spin) clearInterval(spin); },420+n*300+200); }
function doomBan(top,mid,small,low){ const b=$('doomBan'); if(!b) return; b.classList.toggle('low',!!low); b.innerHTML=`<small>${top}</small>${mid}<i>${small}</i>`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function doomStart(){ const P=player.root.position; S.doom={t:0,dur:9,x:P.x,z:P.z-16}; S.fLoot=0;
  if(S.emG&&S.emG.length){ S.doomLost=S.emG.length; S.emG=[]; S.ember=0; lootHud(); toast(`🔥 불씨 덩어리 ${S.doomLost}개가 꺼졌다`,'3분 안에 모닥불에 닿지 못했다'); }
  if(!doomS){ doomS=new THREE.Sprite(new THREE.SpriteMaterial({map:ltex('img/nameless.webp'),color:0xd6d0e0,transparent:true,depthWrite:false,depthTest:false,fog:false,opacity:0})); doomS.center.set(.5,0); doomS.renderOrder=8; scene.add(doomS);
    doomE=new THREE.Sprite(new THREE.SpriteMaterial({map:ltex('img/nameless_g.webp'),color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,depthTest:false,fog:false,opacity:0})); doomE.center.set(.5,0); doomE.renderOrder=9; scene.add(doomE); }
  doomS.visible=doomE.visible=true; const v=$('doomV'); if(v) v.classList.add('on');
  const el=$('fLootT'); if(el){ el.style.display='none'; el.dataset.t=''; } // 큰 눈을 가리지 않게 위쪽 줄은 숨김
  doomBan('그것이 깨어났다','？？？','이름 없는 그것 · 쓰러뜨릴 수 없다 — 모닥불 빛 안으로',true); DBG.shake=Math.max(DBG.shake||0,1); buzz(200); try{ sfx.roar(); }catch(e){} DBG.doom=(DBG.doom||0)+1; }
function doomTick(dt,P){ const D=S.doom; D.t+=dt; const k=Math.min(1,D.t/2.2);
  // 뒤에서 다가온다: 처음엔 멀리(화면 위쪽), 점점 플레이어 쪽으로
  const tx=P.x, tz=P.z-.3, sp=(2.5+D.t*1.6)*dt; const dx=tx-D.x, dz=tz-D.z, l=Math.hypot(dx,dz)||1; if(l>.3){ D.x+=dx/l*Math.min(l,sp); D.z+=dz/l*Math.min(l,sp); }
  const H=7+5.5*k, W=H*539/570, wob=1+Math.sin(D.t*2.3)*.03; // v2.32 다시 뽑음(촉수 안 잘림) 539×570
  const eo=Math.max(0,Math.min(1,(D.t-1.3)/.35)); if(eo>0&&!D.eyes){ D.eyes=1; DBG.shake=Math.max(DBG.shake||0,1.1); buzz(160); try{ sfx.roar(); }catch(e){} } // 큰 눈은 마지막에 번쩍 뜬다
  doomS.position.set(D.x,0,D.z); doomS.scale.set(W*wob,H,1); doomS.material.opacity=.92*k;
  doomE.position.set(D.x,0,D.z+.05); doomE.scale.set(W*wob,H,1); doomE.material.opacity=eo*(.8+.2*Math.sin(D.t*5));
  if(Math.random()<.5) epBurst(D.x+rr(-W*.4,W*.4),rr(1,H*.7),D.z,1,1.5,1.2,.6,[.35,.3,.5],1);
  if(D.t>1.6&&!S.inSafe&&!DBG.doomSafe){ const r=Math.min(1,(D.t-1.6)/3); hurtPlayer(S.maxhp*(.05+.17*r)*dt/Math.max(.35,st().armor),false,true); DBG.shake=Math.max(DBG.shake||0,.12); }
  if(S.inSafe&&D.t>.3){ doomEnd(); roundEnd(true); return; }
  if(D.t>=D.dur&&!DBG.doomSafe){ doomEnd(); S.hp=0; gameOver(); } }
function doomEnd(){ S.doom=null; if(doomS){ doomS.visible=doomE.visible=false; } const v=$('doomV'); if(v) v.classList.remove('on'); const el=$('fLootT'); if(el){ el.classList.remove('warn'); el.dataset.t=''; } }
// v2.17 (기획자 01:07 3ㄱ+ㄴ): 파이널 뒤 모닥불 빛 안에 닿으면 판 끝 → 기지로 정산. 다음 판은 Lv1부터(장비·강화는 그대로)
function roundEnd(fled){ if(S.phase!=='play') return; lgTime(); S.roundWon=fled?'fled':'won'; if(S.ptBroke&&PTY.id) setTimeout(()=>toast('🤝 다시 한 파티','판이 끝나 끈이 다시 이어졌다'),1800);
  // v2.27 결과판: 같이 깎은 몫 · 지킨 불씨 · 빼앗은 불씨 — 빈손이면 깎은 몫만큼 조각
  const held=(S.kept||0)+(S.emG||[]).length, coop=!!S.cpP||!!S.scramble, share=S.cpA>0?Math.max(0,Math.min(1,(S.cpM||0)/S.cpA)):1; let cpB=0;
  if(coop&&!held){ cpB=Math.round(10+50*share); S.bonus=(S.bonus||0)+cpB; }
  const cpLine=coop?`<div class="cpBox"><b>이번 판</b><br>🤝 같이 깎은 몫 <b>${Math.round(share*100)}%</b><br>${held?`🔥 끝까지 지킨 불씨 <b>${held}개</b>`:`🔥 불씨는 남의 손에 · 깎은 몫만큼 조각 <b>+${cpB}</b>`}${S.stole?`<br>⚔ 빼앗은 불씨 <b>${S.stole}개</b>${S.stoleP?` <small>(파티원에게서 ${S.stoleP})</small>`:''}`:''}</div>`:'';
  DBG.cp={share,held,cpB,coop}; DBG.roundEnd=(DBG.roundEnd||0)+1; doomBan('판 끝',fled?'그것은 불빛을 넘지 못했다':'모닥불에 닿았다','들고 온 것은 모두 내 것 · 다음 판은 <b>Lv1</b>부터 · 장비는 그대로',false); sfx.lvl(); gameOver('rest'); if(cpLine){ const r=$('rstat'); if(r) r.innerHTML=cpLine+r.innerHTML; } }
// (옛 v2.10~2.16) 3분이 끝나면 새 판 — v2.17부터 쓰지 않음(시험용으로만 남김)
function fieldReset(){ S.fLoot=0; S.fDone=0; S.cycle=(S.cycle||0)+1; let lost=0; if(S.emG&&S.emG.length&&!S.inSafe){ lost=S.emG.length; S.emG=[]; S.ember=0; lootHud(); } const n=emberConfirm(); clearSpots(); MPF.drops.clear();
  for(const e of enemies) e.dead=true; gems.length=0; foxShots.length=0; embersItems.length=0; joris.length=0;
  newRound(MPF.rd+1);
  const P=player.root.position, NF=nearFire(P).f; P.set(NF.x+1.4,0,NF.z+1.8); camT.set(P.x,0,P.z); shadowP.root.position.set(P.x-1,0,P.z+.8); S.fireCd=true;
  S.spotT=6; DBG.reset=(DBG.reset||0)+1;
  doomBan(`${MPF.rd+1}번째 판`,'새 판','보스들이 다시 깨어났다 · <b>레벨·기술·장비는 그대로</b>'+(lost?`<br>🔥 모닥불에 못 가서 불씨 덩어리 ${lost}개가 꺼졌다`:n?`<br>장비 ${n}개는 지켜 주었다`:''),false); sfx.lvl(); }

/* ============ v2.7.4 건물 (17-4): 명소 주변만 실제 건물 — 나도 괴수도 막힘 ============ */
// 출처: © OpenStreetMap 기여자 (ODbL). 서울역·명동 반경 약 280m 건물 479채, Overpass API(2026-11-12). 각 = 층수:시작 x,z 상대 이동…
const BDS="7:88,-535 0,13 8,0 28,-1 -1,-13 -12,1 -3,0 -12,0 -1,0|8:-391,-140 13,0 0,33 -5,0 0,-1 -3,0 0,1 -5,0|0:267,-515 1,1 0,1 1,1 1,0 1,0 1,1 1,0 1,0 1,-1 1,0 1,-1 1,-1 0,-1 1,-1 0,-1 0,-1 0,-1 0,-1 -1,-1 -7,-12 -3,2 -2,-4 -2,1 -3,1 3,4 -4,2|23:-246,-141 4,0 13,-1 1,0 13,0 0,-2 1,-1 1,-2 0,-7 0,-2 -1,-1 1,-2 0,-1 0,-8 -1,-2 -1,0 0,-11 -6,-5 -7,0 -15,0 -4,3|15:287,-430 -1,-13 4,0 0,2 8,0 -1,-3 4,-1 2,13|9:263,-425 9,-1 -1,-8 -9,1|10:98,-515 0,12 26,0 0,-12|10:188,-415 -2,-2 -2,-15 18,-2 2,16|16:150,-413 8,-1 18,-2 0,-1 1,0 1,0 1,-1 1,0 0,-1 0,-1 0,-1 -1,-1 0,-1 -1,0 -1,0 -1,0 -1,0 0,-1 -18,2 -2,0 0,1 -5,1|14:221,-438 -1,-7 0,-2 6,0 1,4 0,4|7:142,-433 1,8 1,0 0,1 12,-1 -1,-10|0:331,-545 0,-3 0,-3 5,0 0,-1 1,-1 0,-1 0,-3 -1,0 0,-2 -6,0 0,-1 0,-1 1,-4 -6,0 0,6 -3,0 0,-2 -3,0 0,3 2,0 0,5 1,0 0,2 2,0 0,1 0,1 -1,0 0,4|12:222,-610 1,2 2,1 0,2 6,2 1,-1 3,0 0,-9 -11,0 -2,1|12:222,-605 -3,12 14,-1 0,-2 2,-5|23:-230,-108 0,1 1,1 1,3 2,2 2,2 2,1 3,1 2,0 0,-1 4,-2 1,0 0,-1 2,-1 -1,-2 3,-1 -7,-14 -14,6 1,2 1,1|6:-243,-139 10,-1 7,0 0,1 1,0 0,3 -1,0 0,3 -7,0 0,14 -10,0|0:-413,-73 -3,-1 -6,-6 0,-8 3,0 3,-3 4,0 0,5 0,7 0,5|24:-242,-65 8,0 5,0 3,0 0,-5 -4,-4 -1,0 -1,0 -1,-1 -3,0 -1,1 -6,6 0,2|0:-328,-145 2,0 0,8 -2,0|0:-357,-145 1,8 -3,0 0,-8|0:316,-573 0,10 8,0 0,-10|3:134,-457 5,-1 3,13 -5,1|0:120,-442 6,-2 1,4 -6,1|0:131,-478 6,-4 7,14 -6,3|0:136,-463 1,3 9,-3 -1,-6|0:129,-439 1,4 2,0 -1,-4|7:124,-535 3,-1 1,1 1,5 -3,1|0:126,-529 3,-1 3,10 -4,1 -1,-3 1,-1|0:128,-518 4,-1 1,3 -4,1|0:129,-514 4,-2 2,6 -4,1|4:131,-508 4,-1 3,9 -4,1|0:135,-498 3,-1 2,6 -6,2 -2,-4 3,-1|3:133,-489 7,-2 2,7 -4,1|11:144,-540 2,15 -10,2 -2,-1 -3,-14|0:132,-440 3,0 0,5 -2,0|0:136,-435 3,0 -1,-6 -3,1|0:139,-436 8,-1 -1,-7 -5,1 0,2 -2,0|7:147,-437 2,0 1,-2 -2,-9 -1,0 -1,-4 -3,0 1,6 0,1 2,0|4:147,-454 -1,-6 -5,2 1,5|0:138,-481 4,-1 2,13|4:150,-444 4,-1 1,7 -3,1 -1,-2|0:155,-444 3,0 1,5 -3,1|8:149,-457 13,-2 1,6 -5,1 1,6 -4,1 -1,-1 -3,0|5:163,-459 5,-1 1,6 -5,1|4:169,-460 6,-1 3,1 0,3 -8,2|5:161,-450 9,-2 1,11 -8,1|4:171,-449 2,-1 2,8 -3,1|6:175,-442 3,0 -1,-6 -3,0|6:177,-448 2,-1 1,5 0,1 -2,1|4:173,-455 0,4 6,-1 -1,-4|4:144,-490 10,-2 2,2 2,8 -10,1 1,4 -3,0 -2,-12|0:146,-476 4,0 0,5 -3,0|0:155,-472 1,6 -6,1 0,-1 -3,0 0,-4|0:151,-480 7,-1 1,7 -5,1 0,-1 -1,0|4:155,-472 4,-1 2,11 -7,1 -1,-3 4,-1|0:148,-464 5,-1 0,4 -4,1|5:160,-493 10,-2 2,1 1,3 -14,2 -1,-3|6:168,-489 4,-1 1,6 -4,1|6:168,-482 5,-1 1,2 -6,1|0:160,-487 6,-1 3,13 -1,0 0,3 -5,1|5:175,-496 15,-2 8,-2 4,21 -8,3 -4,1 0,1 -3,0 -1,-5 -8,2 -2,-13|4:180,-468 7,-1 1,3 -6,1 -2,-1|3:187,-472 5,-1 1,6 -5,1 0,-3|3:193,-474 5,-2 2,7 -5,1|0:199,-476 3,-1 2,0 1,3 -5,1|0:200,-473 5,-1 1,3 -1,2 -4,1|5:181,-462 -1,1 0,1 5,0 -1,-3|4:185,-463 3,0 2,10 -4,0|6:191,-464 3,0 1,8 -2,1|5:194,-464 2,-1 2,9 -2,1|4:199,-465 4,-1 2,9 -4,0|0:204,-466 3,0 1,2 -4,0|7:205,-463 3,-1 4,13 0,3 -4,1|5:182,-448 3,-1 0,5 0,1 -3,0|5:186,-444 3,0 -1,-8 -3,0|5:189,-451 4,0 1,6 -4,0|5:193,-455 3,0 2,10 -3,1|8:197,-455 3,-1 2,10 -4,0|5:201,-455 4,-1 2,9 -4,1|0:174,-501 8,-2 1,4 -7,1 -1,-1|0:173,-506 15,-2 0,3 -5,1 0,1 -9,1|0:172,-511 15,-2 0,4 -14,2|0:171,-517 16,-2 1,5 -9,1 0,-3 -8,1|0:172,-514 6,-1 1,3 -7,1|0:184,-503 4,-2 1,4 -4,2|0:187,-520 7,-1 1,5 -7,1|0:187,-513 8,-2 0,4 -7,1|0:188,-509 2,8 4,0 -2,-9|0:193,-510 3,-1 1,7 0,2 -3,0|0:177,-544 -9,1 -1,2 1,5 10,-2|13:179,-545 7,-1 2,1 2,7 -3,0 0,-1 -7,1|4:169,-532 11,-1 2,5 -12,1|0:182,-534 8,-1 2,13 -7,1|0:168,-535 10,-2 0,3 -10,2|0:169,-526 5,0 2,7 -5,1|0:175,-526 7,-1 1,6 -6,1|7:164,-557 9,-2 0,-2 2,0 0,-3 2,0 1,6 3,-1 1,3 -2,0 1,5 -16,3|0:181,-553 1,3 5,-1 -1,-3|0:163,-561 6,-1 1,3 -7,1|0:162,-567 8,-1 1,5 -8,2|0:161,-574 8,-2 1,7 -8,1|0:170,-571 2,10 3,-1 -1,-4 -1,0 -1,-6|0:178,-559 5,-1 -3,-11 -4,1|0:160,-585 10,-1 1,5 -5,1 0,-3 -6,1|0:160,-581 1,6 5,-1 -1,-6|0:166,-580 4,0 1,3 -4,1|0:170,-576 8,-2 1,6 -6,1 0,-1 -2,0|0:171,-586 3,-1 1,4 -3,1|0:171,-581 4,-1 1,4 -4,1|0:154,-523 -1,1 1,4 5,-1 -1,-5|0:162,-469 7,-1 1,7 -5,1 -1,-1|6:169,-470 7,-1 0,4 -2,0 0,-1 -2,1 1,3 -2,1|0:159,-525 7,-1 1,1 1,4 -8,2|0:154,-517 6,-1 0,4 -5,1|0:163,-519 0,5 5,-1 -1,-5|0:155,-512 7,-1 1,4 -7,2|0:163,-513 4,-1 1,4 -4,1|0:156,-507 5,-1 1,4 -5,1|5:157,-502 5,-1 1,7 -4,1 -1,-1|3:163,-509 7,-1 2,12 -1,1 -3,1 -1,-9 -3,1|8:162,-503 4,-1 1,8 -4,0|0:139,-521 7,-1 2,12 -5,1|0:147,-522 3,0 1,1 2,9 -5,1|0:143,-508 5,-2 0,6 -4,1|0:148,-510 4,-1 1,4 -1,0 0,1 2,-1 1,6 -9,2 -1,-3 4,-2|4:148,-498 7,-1 1,3 -1,1 -6,2|0:135,-520 -1,2 2,4 3,-1 -1,-5|0:136,-513 3,-1 2,7 -3,1|0:138,-506 4,-1 1,4 -3,1|4:140,-501 3,-1 2,7 2,-1 1,3 -6,1|0:147,-542 3,0 -2,7|0:150,-542 5,-1 1,6 3,0 1,6 -3,0 -1,-3 -7,-2|0:149,-536 7,2 -1,4 1,4 -8,2 -1,-6|0:156,-530 3,0 1,4 -4,0|0:155,-543 7,-1 1,1 2,6 -5,1 0,-2 -4,1|0:160,-535 5,-1 0,3 -4,1|0:160,-530 5,-1 1,3 -1,1 -5,0|0:194,-528 7,-1 0,8 -5,0|0:203,-529 1,7 -2,0 0,-7|0:196,-520 3,-1 3,13 -3,1|0:200,-521 2,0 1,4 -2,0|0:203,-521 0,3 2,0 0,-4|0:201,-516 2,-1 1,3 1,-1 0,2 1,4 -4,1|0:199,-505 8,-2 3,5 -1,2 -8,1|0:201,-498 4,-1 1,4 -4,1|0:205,-499 4,-1 1,-2 1,2 1,4 -6,1|0:202,-494 4,0 0,2 -3,1|4:203,-490 6,-1 0,1 -5,2|0:205,-481 5,-1 1,2 -5,1|0:206,-478 5,-2 0,1 -5,2|0:206,-476 5,-2 0,1 1,-1 1,4 -5,4 -1,-1|0:206,-495 0,2 2,0 0,1 2,0 0,2 4,-1 -2,-4|0:209,-489 4,-2 1,2 -1,0 2,4 -5,2|0:211,-483 4,-2 2,5 -5,2|0:213,-478 3,-1 1,2 -3,2|0:120,-552 5,0 0,4 -4,0|0:121,-548 4,0 0,5 -4,1|0:130,-575 27,-2 1,8 -17,1 -1,0 -8,0 0,-1 -1,0|4:147,-568 13,-1 2,17 -2,2 -9,1 1,4 -6,1 -1,-8 -1,0 -1,-6 6,-1|0:131,-566 8,-1 1,9 -3,0 -1,-6 -5,0|0:129,-563 6,0 1,4 -6,1|0:129,-557 6,-1 0,2 -3,1 0,1 -3,0|0:129,-553 4,0 -1,-2 4,0 1,10 -7,1|0:140,-566 1,6 7,-1 -2,-6|6:261,-582 12,-1 5,14 -4,1 -5,0 0,15 -2,0 0,1 5,0 3,0 1,-1 4,0 3,1 0,5 -20,-1 0,-3 -2,0 0,-1 -1,0|6:223,-514 4,-1 -1,-4 -3,-12 0,-1 -2,-9 -4,1 1,3 -2,0 4,15 0,-1|5:297,-469 21,-5 -3,-16 1,0 -1,-5 -1,0 -2,-7 -2,-4 -6,2 3,15 -8,3 3,8 2,0 -1,-1 9,-3 1,4 -1,0 0,2 -9,1 0,1 0,-1 -7,3|5:193,-433 -1,-8 3,0 2,7|4:197,-435 -1,-7 6,-1 -1,7|5:221,-425 7,-1 1,6 -7,1|0:221,-437 7,-1 2,4 -8,1|0:221,-432 7,-1 -1,6 -6,1|10:231,-435 14,-1 0,13 -1,2 -10,1 -3,-3|4:239,-450 4,0 1,11 -4,0|3:236,-449 2,0 1,10 -3,0|3:232,-449 3,0 0,10 -2,0|4:229,-449 2,0 1,10 -3,0|0:211,-467 2,-4 5,3 0,5 -5,2|2:212,-459 7,-2 3,10 -5,2|4:223,-451 -2,-9 4,-1 1,2 7,0 0,6|2:234,-454 -1,-8 3,0 1,8|0:220,-464 -1,-5 5,-1 1,3 -3,0 0,3|0:218,-470 9,-2 -1,-6 -4,1 1,3 -6,1|0:226,-470 2,-1 1,3 -2,0|10:235,-470 10,-1 2,14 -9,2|0:250,-461 3,0 0,5 -3,0|0:254,-460 2,0 0,4 -2,0|0:257,-457 0,-5 2,0 0,5|0:260,-457 0,-6 2,0 1,6|0:263,-457 0,-6 3,0 0,6|0:267,-457 -1,-6 5,-1 0,6|0:272,-458 -1,-5 3,0 0,5|0:275,-458 -1,-5 3,0 0,4|0:278,-459 0,-4 2,0 1,4|0:282,-459 -1,-5 5,-1 0,6|0:286,-459 0,-7 2,0 1,6|0:293,-460 5,0 0,-6 -2,1 -4,1|0:300,-461 0,-4 2,0 0,4|8:304,-461 -1,-5 -3,0 0,-2 6,-1 2,2 1,5|7:309,-462 0,-4 4,-3 0,6|5:314,-465 6,-1 0,3 -6,0|2:314,-468 5,-1 1,3 -6,0|0:247,-448 2,-3 3,0 0,3 -2,0 0,4 -3,0|0:253,-445 0,-6 2,0 0,5|0:256,-446 0,-5 2,0 0,5|0:259,-443 0,-9 6,0 0,8|0:270,-446 0,-7 5,0 0,7|17:268,-444 8,0 0,5 -8,1|0:274,-431 -1,-5 2,0 1,2|4:273,-430 4,0 0,4 -4,0|18:248,-444 10,0 1,17 -2,3 -5,0 -3,-2|0:280,-454 1,-1 3,0 1,13 -4,0|0:285,-449 0,-4 0,-2 6,0 0,5|0:292,-449 -1,-6 4,-1 1,6|0:296,-450 0,-6 3,0 1,1 0,4|3:303,-456 3,0 0,5 -3,0 -1,-4|5:307,-456 11,-1 0,4 5,0 1,13 -2,6 -11,1 0,-5 -2,0 -1,-13 -1,0|11:318,-457 4,-1 0,4 -3,1|0:316,-537 0,4 -1,1 1,0 1,0 8,1 0,-1 0,-2 0,-2 0,-1|9:330,-520 -3,0 -2,0 0,5 0,1 0,1 1,0 1,0 3,0 0,2 0,3 2,0 1,0 1,0 3,0 0,-3 0,-2 2,0 1,0 0,-7 -2,0 -2,0 0,-2 0,-3 -3,0 -3,0 0,3|0:266,-541 17,1 0,-4 -17,-1|0:306,-507 0,-1 1,1 3,-2 -10,-19 -12,5 2,4 2,0 4,-2 1,1 1,0|0:262,-483 1,3 -2,1 0,2 -12,2 1,9 23,-2 0,-3 1,-1 0,-3 -2,0 0,-2 -7,1 -1,-2 3,-1 -1,-4 -6,-20 -4,1 2,7 -6,1 3,9 5,-2 1,4|0:275,-536 5,10 1,1 0,1 1,2 5,-2 -2,-5 -1,0 -4,-9|0:219,-509 4,13 1,0 0,1 1,0 -1,-1 1,0 1,3 4,-1 -1,-4 -4,1 -1,-2 2,0 -3,-11 -1,1 0,-1 -3,0 1,1|0:233,-496 6,-2 -2,-6 -4,1 -1,0 -2,0 0,2 1,0|0:229,-521 6,-1 -2,-8 -6,2|10:302,-560 6,-1 -1,-17 -6,0 0,2 -2,1 1,9 1,0 1,3|15:291,-593 17,0 0,-17 -16,0 0,4 -1,0|14:337,-476 0,4 -1,1 1,8 12,-2 -1,-8 2,0 0,-4 -2,0 1,1 -10,1|2:243,-525 5,-3 4,7 2,-1 1,2 -2,1 6,9 -7,4 -7,-11 3,-1|0:-289,-110 0,4 3,0 0,-1 0,-1 -1,-2|3:178,-440 3,0 1,9 -3,0|10:131,-597 0,16 22,0 0,-17|0:220,-551 2,7 11,-3 -2,-7|0:232,-519 3,-1 -1,-1 -3,1|0:218,-541 3,-2 -1,-1 0,1 -2,-3 -2,1|0:292,-496 1,1 2,-1 -1,-1|0:284,-516 1,2 2,-1 -1,-2 -1,0|0:227,-532 0,2 3,0 -1,-3|0:282,-507 2,0 -3,-6 -2,1|0:283,-517 5,-3 -1,-2 -5,3|0:295,-475 6,-2 0,-1 -5,1 -2,0|0:275,-477 1,9 1,2 4,-1 0,-2 -2,-9|0:244,-499 16,-4 -1,-4 3,-2 0,-1 -5,2 -2,1 0,1 -12,4|0:295,-479 1,0 1,1 1,0 1,-1 1,0 -1,-1 0,-1 0,-1 -4,-7 -4,3|0:231,-530 13,-4 -2,-5 -12,4|12:246,-409 7,-1 0,7 -6,0|0:-285,-66 4,1 -1,10 -4,0|0:-284,-73 3,0 0,7 -3,-1|5:179,-610 1,0 0,-2 2,0 0,-1 2,0 0,-2 4,0 0,12 -8,0 0,-1 -1,0|15:186,-587 3,11 8,-2 0,-1 0,-2 2,0 -3,-10 -2,1 -1,-3 -7,1|0:222,-579 0,8 14,-1 0,-8|15:-432,-138 3,6 1,-2 6,4 5,-8 -1,-2 -1,-1 -1,-1 -1,-1 -2,0 -1,0 -1,0 -1,1 -2,1|5:-461,-115 3,6 1,-1 3,-2 1,1 6,-3 -2,-4 -1,0 -2,-3|0:-441,-108 1,0 1,0 3,-1 -4,-2|0:-442,-116 -1,2 2,0 -1,2 6,2 1,0 0,-2 -1,-1 -1,-1|0:-437,-122 -2,3 2,1 1,-3|0:-435,-121 -2,3 2,1 2,-3|0:-432,-116 -1,2 -1,1 3,0 1,-2|0:-427,-120 -2,3 4,1 1,0 1,0 1,-3 -3,-1 0,1|0:-416,-119 5,0 0,9 -6,0 0,-6 1,0|0:-410,-115 0,5 1,0 1,0 0,-5|0:-431,-113 -1,3 3,0 0,-2|0:-435,-92 7,7 6,-4 -4,-4 -2,1 -3,-3|0:-458,-77 0,10 5,0 0,-5 11,0 0,-5|1:-443,-58 0,7 27,1 1,-7|0:-429,-114 0,1 0,1 0,2 3,0 0,-2 1,-1|0:-424,-112 0,2 4,0 0,-1 0,-1|0:-421,-117 -2,4 1,0 1,0 1,0 0,1 1,-2 -1,0 1,-2|0:-417,-107 0,5 7,1 0,-7 -6,0|0:-425,-103 0,5 6,0 0,-5|0:-430,-108 -2,4 4,1 1,-3 -2,0 1,-2|0:-426,-107 0,3 2,0 0,-3|0:-423,-107 0,1 0,2 3,0 0,-3 -1,0 0,1|0:-435,-132 -1,3 7,1 1,-3|0:-434,-136 -1,3 3,1 1,-4|0:-439,-128 -2,3 3,1 1,-3|0:-436,-125 -1,2 5,2 0,-2|0:-436,-127 0,1 5,3 1,-2|0:-431,-122 -1,1 2,1 1,-2|0:-429,-125 -1,2 3,0 -1,1 1,1 1,0 1,-1 4,1 0,-1|0:-419,-123 -1,4 1,2 2,0 2,-5|0:-446,-103 -5,2 1,2 1,1 3,0 0,-3 0,-2|0:-445,-101 0,3 5,0 0,-3 -2,0|0:-452,-108 0,5 4,-2 -3,-3|0:-450,-94 0,7 7,0 0,-6|0:-441,-106 -1,1 3,2 2,-3 -1,-1|0:-436,-105 -2,3 3,2 2,-4|0:-434,-107 -1,1 3,1 1,-2|5:-394,-47 3,14 -1,1 7,26 8,-2 -9,-41|0:-433,-103 -2,3 2,1 -1,0 2,1 1,-3 -1,-1 0,-1 -1,0 0,1|0:-428,-102 -1,3 3,0 1,-3|0:-429,-99 0,1 3,1 0,-2|0:-427,-130 -1,3 1,1 1,-2 3,1 1,-2|3:177,-594 -3,1 3,4 2,-1|26:270,-614 1,15 -24,1 -1,-15|0:223,-570 8,0 0,2 -6,4|15:218,-571 3,10 -5,2 -4,-10|21:198,-579 6,22 11,-4 -3,-8 3,-1 -1,-2 -1,-1 0,-3 -6,2 -2,-7|17:202,-615 12,2 -2,7 -3,16 -9,-2 1,-3 -2,0 0,-3 -1,0|15:181,-602 13,0 0,7 -13,1|0:112,-470 1,2 8,-3 -2,-3|0:123,-488 1,2 1,0 1,-1 0,-2 -2,0|7:155,-435 1,10 5,-1 -1,-9|3:-314,-214 0,19 0,37 0,2 6,0 0,-2 3,0 0,-3 -3,0 0,-4 2,0 0,-4 -2,0 0,-5 1,-1 0,-1 3,0 0,1 1,0 0,-9 -1,0 -3,0 0,-1 -1,0 0,-6 2,0 1,-1 0,-3 -4,0 0,-9 1,0 0,-5 -1,0 -1,-5|0:330,-513 -3,0 0,2 3,0|0:339,-513 -2,0 0,2 2,0|0:338,-522 -2,0 0,2 2,0|0:330,-522 -3,0 0,2 3,0|9:231,-395 -6,2 -2,-4 -6,3 -4,-4 5,-5 3,-1 3,-1 3,-1 4,9 -1,0|12:227,-406 5,9 2,-1 -3,-8 -1,0 -1,-1|0:210,-397 3,2 4,9 1,-1 1,2 -3,2 1,3 -3,1 0,-3 -2,1 -1,-6 0,-2 -1,-2 -2,-2 0,-1|0:220,-384 -4,2 2,2 3,4 -1,0 0,1 1,0 3,3 3,-2|0:206,-392 3,1 1,1 1,9 2,0 1,2 -7,2 -2,-2 1,-4 -1,0|0:253,-390 -6,1 1,5 6,-2|0:247,-389 3,2 -2,3|0:253,-390 -1,3 2,1|0:254,-386 -2,-1 -2,0 -2,3|0:253,-390 -1,3 -2,0 -3,-2|0:246,-387 1,2 0,1 -3,1 -1,0 -1,-3 1,-1 3,-1|0:260,-390 -5,1 -1,0 1,4 1,0 1,4 5,-1|0:262,-392 3,9 -3,0 -2,-8|0:266,-393 -3,1 2,8 5,-2 -2,-4|0:250,-391 -7,2 -1,0 -2,-5 8,-2|0:241,-409 -5,1 2,6 4,0|0:242,-409 1,9 3,0 -1,-9|0:242,-402 -4,1 1,3 4,-1|0:239,-398 1,3 6,-1 -1,-3|0:256,-408 1,2 -3,3 -1,-4|0:254,-410 1,1 -2,1 0,-2|0:259,-406 -4,3 1,2 4,-2|0:287,-411 5,0 3,0 2,1 3,2 2,2 1,1 1,3 -16,5|9:273,-407 -6,0 1,9 5,-1 0,3 14,-1 -1,-13 -13,1|0:265,-412 0,2 6,-1 -1,-1|0:200,-405 0,1 5,-1 0,-1|0:214,-407 0,1 5,-1 0,-1|0:202,-417 1,1 5,-1 0,-1|0:191,-415 0,1 6,-1 -1,-1|5:211,-420 -4,1 -1,-4 -2,0 0,-3 5,-1|0:255,-393 -3,0 -1,-4 2,-1|0:346,-507 -1,0 0,1 -1,0 0,1 -1,0 0,1 -1,0 0,5 8,0 0,-5 -1,0 0,-1 -2,0 0,-2|12:340,-494 -5,0 1,11 14,-2 0,-5 -1,-1 0,-4 -9,1|0:177,-400 0,6 4,0 0,-6|10:182,-400 0,6 1,0 9,-1 0,-1 0,-4 -1,-1|0:-307,-231 0,3 3,0 -1,-3|0:184,-568 5,13 2,1 6,-2 -1,-3 -2,0 -1,-6 1,0 -1,-3 -3,1 -1,-3|0:188,-578 -4,1 -3,1 1,3 1,0 4,-1 2,-1|0:183,-573 1,3 4,-1 -1,-3|15:193,-567 1,2 0,-1 1,6 2,0 1,4 5,-1 -3,-13 -3,1 0,1|0:189,-572 0,2 1,3 3,-1 1,0 -2,-5|0:221,-589 0,9 14,-1 0,-8 -3,0 0,-2 -8,0 0,2|2:215,-578 1,3 -2,1 -1,-4 1,0|0:213,-573 3,-1 0,1 -2,1|0:238,-577 4,-1 0,3 -3,2|0:238,-579 0,2 4,-1 0,3 3,-3 0,-1 -1,0|0:243,-584 0,2 0,1 1,2 1,0 0,-4|0:247,-583 -1,3 -1,1 0,-4|0:247,-583 -1,3 -1,1 0,1 4,-2 1,-1|0:243,-582 -5,1 0,2 6,0 -1,-2|0:243,-584 -5,1 0,2 5,-1|0:238,-587 0,3 4,0 0,-3 -1,-1|0:270,-595 0,4 2,-1 0,-3|0:238,-595 3,1 1,-3 -4,-1|0:267,-590 0,-4 -3,0 0,5|0:184,-570 0,1 2,0 -1,-1|7:159,-600 0,5 5,0 6,1 -3,-3 -2,-2 -1,-1|0:160,-594 0,4 4,0 0,3 6,-1 0,-5 -6,-1|0:159,-588 0,2 5,-1 -1,-1|0:163,-588 -1,-2 -3,0 0,2|0:120,-547 -4,0 1,5 3,0|9:203,-549 1,9 5,0 -1,-2 3,-1 -2,-7|0:199,-538 0,7 5,0 0,-7|0:205,-539 1,7 4,-1 -1,-7|8:209,-550 4,-1 1,4 3,-1 1,1 -4,2 1,2 -3,1|0:215,-543 0,1 -1,3 1,7 -4,1 -2,-11 3,0|0:215,-532 -9,2 1,4 9,-2|0:207,-525 1,4 9,-2 -1,-4|0:209,-518 1,6 10,-4 -2,-5|0:222,-512 -1,-2 -6,3 1,3|0:214,-511 -5,2 -1,1 1,1 2,3 1,1 3,-2 -1,-2 2,0|0:215,-504 -3,2 2,6 5,-2 -1,-3 -2,0|0:221,-497 -7,2 2,5 0,1 0,1 8,-5|0:224,-492 -7,5 1,2 4,-3 4,-2|0:223,-487 -4,2 1,4 8,-3 -1,-4 -4,2|0:257,-554 0,6 2,0 0,-3 0,-3|0:239,-558 -1,1 0,1 2,0|0:193,-534 1,5 4,-1 0,-4|0:193,-538 0,4 5,-1 0,-3 -2,1 0,-1|0:192,-540 0,1 7,0 -1,-2|0:198,-543 0,2 -6,0 0,-2|5:192,-548 -1,2 0,1 4,0 1,0 1,0 -1,-3|0:197,-544 0,1 -6,0 0,-2 4,0 0,1|6:213,-551 1,3 3,-1 -1,-3|6:177,-439 1,10 -3,1 0,-1 -2,1 -1,-7 -1,0 0,-3|3:161,-435 1,7 4,0 0,-2 1,0 -1,-6|7:166,-436 2,10 4,-1 -2,-10|15:138,-411 0,-3 1,0 0,-5 4,0 0,1 2,-1 1,7|4:130,-431 8,0 0,-1 3,0 0,5 1,0 0,1 -3,0 0,1 -9,0|0:131,-424 1,4 12,0 -1,-4|0:-309,-139 -1,-1 -1,-2 1,-1 0,-2 2,-1 1,-1 2,0 1,0 2,1 1,2 1,1 0,2 -1,2 -1,1 -1,1 -2,0 -2,0 -1,0|0:-308,-142 1,3 -3,2 -2,-3|22:190,-498 4,22 8,-3 -4,-21|0:-287,-42 -2,12 5,0 2,-11|0:-285,-96 0,10 6,0 0,-6 -2,-4|0:-291,-29 0,5 7,1 0,-5|10:-282,-85 0,5 4,0 0,-5|0:-290,-88 1,7 4,0 -1,-7|0:-286,-105 0,6 6,1 -3,-8|5:169,-477 5,-1 1,2 -6,1|5:168,-479 6,-1 0,2 -5,1|3:172,-467 2,0 2,0 1,2 -1,1 -3,0|5:168,-475 7,-1 0,3 -6,1|5:169,-472 6,-1 0,1 -6,2|5:174,-451 0,3 5,-1 0,-3|5:180,-459 5,-1 0,2 -5,0|5:181,-457 4,-1 1,3 -5,1|5:181,-454 5,-1 0,2 -5,1|5:182,-452 0,1 2,0 0,-1|5:182,-450 0,1 3,0 0,-2|3:188,-463 3,-1 2,10 -3,1|4:197,-465 2,0 1,9 -2,0|3:192,-473 1,-1 2,7 -2,0|4:178,-477 8,-1 0,3 -7,1|4:186,-475 1,2 -8,1 0,-2|4:187,-473 0,4 -7,1 -1,-3|6:211,-427 6,0 1,6 -6,1|15:215,-435 1,7 -12,1 -1,-6|6:205,-443 1,0 1,0 1,0 1,0 1,-1 1,1 1,0 1,1 0,1 1,6 -8,1 0,-2 -2,0 0,-3 1,0|3:227,-448 1,0 1,9 -2,0|0:261,-533 3,4 4,-2 -2,-4 -2,1|0:240,-550 2,-2 2,3 -3,1|0:-310,-248 5,12 4,-2 -2,-4 -3,-2 -1,-5|0:-311,-244 0,6 1,0 0,-1 2,0 0,-2 -2,0 0,-1 1,0 0,-2 -1,0|0:-417,-134 0,5 4,0 0,-5|0:-414,-128 -2,0 -1,1 -1,1 1,0 -1,1 2,1 1,1 1,-1 2,1 2,0 0,-2 -3,0 -2,-1|0:-412,-86 2,0 0,7 -2,0|0:-428,-116 -1,2 5,1 0,-1|0:-445,-113 -3,3 4,3 0,-1 1,-2 1,-1 -1,-1 0,-1|0:-391,-140 0,-5 13,0 0,5|0:-230,-127 3,6 5,-3 -2,-5|0:192,-394 -13,1 1,6 12,-2|0:199,-396 0,2 1,0 1,0 1,0 1,-2|0:199,-392 3,0 0,-2 -1,0 -1,0 -1,0|0:196,-397 0,4 3,1 0,-4|0:196,-395 -2,0 0,2 2,0|0:199,-392 -3,0 0,1 6,0 0,-1|11:174,-400 -6,0 0,4 -1,0 0,2 7,0|0:-452,-123 2,2 4,-3 -4,-4 -3,2 1,2|0:-447,-126 -2,-3 5,-3 2,3|0:280,-473 2,6 3,-1 0,-1 7,-2 3,-1 2,-1 -1,-1 -2,0 -1,-4 -3,1 1,1 -3,1 0,-1 -3,1 1,1 -2,1 -1,-1|0:276,-488 2,7 2,-1 1,3 7,-2 -1,-3 3,-1 -4,-7 -2,1 0,-2 -8,3 1,1|0:314,-472 1,3 5,-1 0,-3|0:293,-449 0,5 8,-1 0,-5|8:197,-548 6,-1 1,9 -5,1|0:294,-530 3,-1 -1,-2 2,0 -2,-5 -5,2|0:291,-544 2,4 -3,1 0,-1 -1,0 -1,-2|0:287,-542 2,3 -3,1 0,-2|0:291,-536 2,4 -1,0 1,2 -3,1 -2,-6|0:286,-530 3,-1 1,4 -1,0|0:287,-551 2,3 -3,1 -2,-3|0:289,-548 1,3 -3,2 -1,-4|0:253,-398 4,-2 1,2 2,3 -5,2|0:256,-401 4,-2 4,6 -4,2 -2,-3 -1,-2|0:-297,-214 7,1 2,7 -7,1 -2,-6|0:-435,-187 2,-3 2,1 -2,4|0:-450,-162 -2,3 -2,-1 2,-3|0:-450,-175 2,-1 2,3 -1,1|0:-445,-167 -4,5 -2,-2 3,-5|0:-445,-173 3,2 -2,2 -3,-2|0:-443,-182 -2,4 -5,-3 3,-3|0:-440,-177 -2,3 -4,-3 3,-3|0:-436,-182 -4,4 -2,-2 3,-4|0:-438,-188 4,3 -2,3 -4,-3|0:-434,-197 5,1 -1,3 -4,0|0:-432,-207 2,1 0,4 -6,0 0,-5|0:-436,-202 5,0 0,4 -5,0|0:-432,-193 2,1 0,2 -3,0|0:-436,-191 2,1 -1,2 1,0 -1,1 -2,-1";
const BG={x0:-480,z0:-640,W:0,H:0,c:.5,g:null};
const BD_IN=1.1;
function bdParse(){ const out=[]; for(const t of BDS.split('|')){ const [lv,rest]=t.split(':'); const ps=rest.split(' ').map(q=>q.split(',').map(Number)); const pts=[ps[0].slice()]; for(let i=1;i<ps.length;i++){ const l=pts[pts.length-1]; pts.push([l[0]+ps[i][0],l[1]+ps[i][1]]); }
    // v2.7.5: 길 넓히기 — 건물마다 테두리를 BD_IN(약 2.6m)씩 안쪽으로 줄인다 (골목 폭 +5m 안팎). 기획자 평 '명동 골목 답답함'
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const [x,z] of pts){ x0=Math.min(x0,x); x1=Math.max(x1,x); z0=Math.min(z0,z); z1=Math.max(z1,z); }
    const cx=(x0+x1)/2, cz=(z0+z1)/2, fx=Math.max(.3,1-2*BD_IN/Math.max(1,x1-x0)), fz=Math.max(.3,1-2*BD_IN/Math.max(1,z1-z0));
    out.push({lv:+lv,pts:pts.map(([x,z])=>[cx+(x-cx)*fx,cz+(z-cz)*fz])}); } return out; }
function inPolyA(x,z,p){ let c=false; for(let i=0,j=p.length-1;i<p.length;j=i++){ const [xi,zi]=p[i],[xj,zj]=p[j]; if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi)) c=!c; } return c; }
function buildBuildings(){ if(!WORLD||!worldG) return; const all=bdParse();
  const keepOut=[...Object.values(SITES).map(S0=>[S0.x,S0.z,SAFE_R+2]),[-342,-124,20],[268,-524,16]];
  const B=all.filter(b=>{ const cx=b.pts.reduce((a,p)=>a+p[0],0)/b.pts.length, cz=b.pts.reduce((a,p)=>a+p[1],0)/b.pts.length; return !keepOut.some(([x,z,r])=>Math.hypot(cx-x,cz-z)<r); });
  BG.W=Math.ceil(860/BG.c); BG.H=Math.ceil(660/BG.c); BG.g=new Uint8Array(BG.W*BG.H);
  const pos=[], col=[]; const roof=[.02,.017,.03], wallA=[.006,.005,.009], wallB=[.01,.008,.015];
  for(const b of B){ const h=1+Math.min(b.lv||2,8)*.22; const sh=new THREE.Shape(b.pts.map(([x,z])=>new THREE.Vector2(x,-z)));
    let g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false}); g.rotateX(-Math.PI/2); g=g.toNonIndexed(); g.computeVertexNormals();
    const P=g.attributes.position.array, N=g.attributes.normal.array; for(let i=0;i<P.length;i+=3){ pos.push(P[i],P[i+1],P[i+2]); const ny=N[i+1], c=ny>.5?roof:(Math.abs(N[i])>Math.abs(N[i+2])?wallA:wallB); const k=ny>.5?1:(.75+.25*P[i+1]/h); col.push(c[0]*k,c[1]*k,c[2]*k); } g.dispose();
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const [x,z] of b.pts){ x0=Math.min(x0,x); x1=Math.max(x1,x); z0=Math.min(z0,z); z1=Math.max(z1,z); }
    for(let gz=Math.floor((z0-BG.z0)/BG.c); gz<=Math.ceil((z1-BG.z0)/BG.c); gz++) for(let gx=Math.floor((x0-BG.x0)/BG.c); gx<=Math.ceil((x1-BG.x0)/BG.c); gx++){ if(gx<0||gz<0||gx>=BG.W||gz>=BG.H) continue; if(inPolyA(BG.x0+(gx+.5)*BG.c,BG.z0+(gz+.5)*BG.c,b.pts)) BG.g[gz*BG.W+gx]=1; } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,fog:false})); worldG.add(m); BG.mesh=m;
  const eg=new THREE.EdgesGeometry(geo,30); const em=new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x8a7aa8,transparent:true,opacity:.28,fog:false})); worldG.add(em);
  BG.n=B.length; }
function blocked(x,z){ if(FIELD) return FIELD.blocked(x,z); if(!BG.g) return false; const gx=Math.floor((x-BG.x0)/BG.c), gz=Math.floor((z-BG.z0)/BG.c); if(gx<0||gz<0||gx>=BG.W||gz>=BG.H) return false; return BG.g[gz*BG.W+gx]===1; }
function unblock(o,ox,oz){ if(!blocked(o.x,o.z)||blocked(ox,oz)) return; if(!blocked(o.x,oz)) o.z=oz; else if(!blocked(ox,o.z)) o.x=ox; else { o.x=ox; o.z=oz; } }
buildBuildings();

for(const k in SITES){ const [mx,my]=toMap(SITES[k].x,SITES[k].z); REGIONS[k].mx=mx; REGIONS[k].my=my; REGIONS[k].unlock=()=>isLit(k); REGIONS[k].seen=()=>!!SV.cleared[k]||FOG[Math.floor((SITES[k].z+LIM)/FG)*FN+Math.floor((SITES[k].x+LIM)/FG)]; }
{ const [mx,my]=toMap(301,37); REGIONS.tower.mx=mx; REGIONS.tower.my=my; }
REGIONS.namsan.desc='첫 모닥불. 동쪽 남산 비탈이 구미호의 구역이다.'; REGIONS.seoulst.desc='서울역 앞 꺼진 모닥불. 역 쪽이 불가사리의 구역이다.'; REGIONS.myeong.desc='명동 골목 어귀의 꺼진 모닥불. 성당 쪽이 도깨비의 구역이다.';
function worldTick(dt,P){ S.wT=(S.wT||0)-dt; if(S.wT>0) return; S.wT=.25;
  const [lk,ld]=nearestLit(P.x,P.z); S.distLit=ld; S.region=nearestSite(P.x,P.z); const t=terr(P.x,P.z); S.onRoad=t===200; S.inWood=t===80;
  fogReveal(P.x,P.z,20*(1+.25*upLv('lantern'))); if(fogDirty){ S.fogT=(S.fogT||0)+1; if(S.fogT>=4){ S.fogT=0; fogPaint(); fogDirty=false; } }
  let nearK=null, any=false; for(const k in SITES){ const d=Math.hypot(SITES[k].x-P.x,SITES[k].z-P.z); if(d<2.8) nearK=k; if(d<7) any=true; }
  if(!any) S.fireCd=false; else if(nearK&&!S.fireCd&&S.phase==='play'&&!boss.alive){ S.fireCd=true; atSite(nearK); } }
function atSite(k){ const R=REGIONS[k];
  if(isLit(k)&&S.loot&&S.loot.length){ const L=S.loot.slice(), n=lootConfirm(); const best=L.reduce((a,b)=>gRank(b)>gRank(a)?b:a); toast(`🎒 장비 ${n}개 내 것이 됐다`,`${gIc(best)} ${gName(best)} (${gGr(best).n}) 외 · 모닥불 → 🎒 장비`); }
  if(isLit(k)) showChoice('모닥불',`${R.name}. 불빛이 따뜻하다.<br>들고 있는 기억 조각 <b>${shardsEarned('all')}</b><br><small>${Object.keys(SITES).filter(x=>x!==k).map(x=>{ const I=starInfo(x); return `${REGIONS[x].name} <span style="color:${I.c}">${'★'.repeat(I.st)} ${I.w}</span>`; }).join(' · ')}</small>`,{a:'쉰다 — 조각을 모두 맡기고 판을 끝낸다',b:'불만 쬐고 계속 걷는다'},c=>{
      S.lastFire=k; SV.region=k; save(); if(c==='a') gameOver('rest'); else { S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.25); toast('불을 쬐었다','쓰러지면 여기서 깨어난다'); } },'');
  else if(canIgnite(k)) showChoice('꺼진 모닥불',`${R.name}. 재 속에 아직 불씨가 남아 있다.`,{a:'불을 붙인다 — 새 거점이 된다',b:'그냥 지나간다'},c=>{
      if(c!=='a') return; SV.lit[k]=1; S.lastFire=k; SV.region=k; save(); refreshSites(); refreshSafe(); sfx.lvl(); DBG.shake=.4; toast('새 모닥불',R.name+' · 불 '+fireLv()+'단계'); S.fireCd=false; },'');
  else toast('꺼진 모닥불','불씨를 옮기려면 「불 옮기기」가 필요하다 · 이 구역의 주인을 보내면 붙일 수 있다'); }
function zoneCheck(){ const P=player.root.position;
  if(boss.alive){ if(boss.dying) return; const Z=SITES[S.bossZone].zone; if(Math.hypot(P.x-Z.x,P.z-Z.z)>Z.r*2.2){ boss.alive=false; boss.root.visible=false; bossL.on=false; bossL.l.intensity=0; slamRing.visible=false; teleMesh.visible=false; $('boss').style.display='none'; toast(boss.def.name+'가 물러났다','구역 밖까지는 쫓아오지 않는다'); } return; }
  for(const k in SITES){ if(S.zoneDone[k]) continue; const Z=SITES[k].zone; if(Math.hypot(P.x-Z.x,P.z-Z.z)<Z.r){ S.bossKey=SITES[k].boss; S.bossZone=k; spawnBoss(); break; } } }
function bossDefeatedW(){ const k=S.bossZone, first=!SV.cleared[k]; for(let i=0;i<2;i++){ const a=i*3.14+.6; mkSpot(boss.x+Math.cos(a)*2.5,boss.z+Math.sin(a)*2.5,true); } setTimeout(()=>toast('🏪 셔터가 열렸다','이 구역 가게의 좋은 물건 · 금빛 자리를 뒤진다'),2600); SV.cleared[k]=(SV.cleared[k]||0)+1; S.bossesW=(S.bossesW||0)+1; S.zoneDone[k]=1; SITES[k].ring.visible=false; S.bonus=(S.bonus||0)+50; save(); $('boss').style.display='none';
  const after=()=>{ const msg=k==='namsan'?'"…하나. 서울역 쪽에서 쇠 씹는 소리가 들려."':k==='seoulst'?'"둘. 명동 골목에서 깡충거리는 소리가 들려."':'"셋. …방망이 소리가 그쳤네."'; toast(boss.def.bye,'모닥불지기: '+msg);
    const un=first&&k==='namsan'?'알바생 서지우':first&&k==='seoulst'?'택시 기사 최만수':''; if(un) setTimeout(()=>toast('새로 깨어남',un),2600);
    if(first) setTimeout(()=>toast('불이 커졌다','불 '+fireLv()+'단계 · 들고 있는 조각 +50'),5200);
    if(BOT) DBG.victory={t:S.t,lv:S.lv,kills:S.kills,hp:S.hp,zone:k}; };
  if(BOT) after(); else setTimeout(()=>choiceRemains(after),600); }

/* ============ 파티클 ============ */
function pointsPool(n,col,size,blend=THREE.AdditiveBlending,fog=false){
  const pos=new Float32Array(n*3).fill(-999), g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.PointsMaterial({map:T.halo,color:col,size,blending:blend,transparent:true,depthWrite:false,fog});
  const p=new THREE.Points(g,m); p.frustumCulled=false; scene.add(p);
  return {pos,g,m,p,n,items:Array.from({length:n},()=>({life:0,x:0,y:-999,z:0,vx:0,vy:0,vz:0}))};
}
const embers=pointsPool(50,0xffb24a,.14);
const ash=pointsPool(MOBILE?140:220,0x8a8494,.09,THREE.NormalBlending,true); ash.m.opacity=.55;
for(const a of ash.items){ a.x=rr(-12,12); a.y=rr(0,9); a.z=rr(-12,12); a.vx=rr(-.15,.15); a.vy=-rr(.35,.7); }
const souls=pointsPool(500,0x6affe8,.22); let soulI=0;
const sparks=pointsPool(140,0xffd88a,.3); let spkI=0; // v2.39 맞은 자리 불티(또렷한 점)
const dust=pointsPool(60,0xb8ad9a,.5,THREE.NormalBlending); dust.m.opacity=.38; let dustI=0; // v2.39 발걸음 흙먼지
function stepDust(p){ if(!S||S.phase!=='play'||S.dash) return; const P=p.root.position; for(let i=0;i<2;i++){ const q=dust.items[dustI=(dustI+1)%dust.n]; q.life=.42; q.x=P.x+sr(-.18,.18); q.y=.08; q.z=P.z+sr(-.1,.1)+.05; q.vx=sr(-.35,.35); q.vy=sr(.25,.5); q.vz=sr(-.2,.2); } }
const water=pointsPool(360,0xbfe8ff,.2); let waterI=0; water.m.opacity=.9;
const flameA=pointsPool(200,0xff6a1a,.62), flameB=pointsPool(120,0xffe27a,.34); let flameI=0; // v2.6.5 1+1 몸 불꽃
function burst(x,y,z,n,spd=2.2){ for(let i=0;i<n;i++){ const s=souls.items[soulI=(soulI+1)%souls.n]; s.life=rr(.4,.9); s.x=x; s.y=y; s.z=z; const a=rr(0,6.28),v=rr(.5,spd); s.vx=Math.cos(a)*v; s.vz=Math.sin(a)*v; s.vy=rr(.8,2.5); } }

/* ============ 인스턴스 묶음 ============ */
const _m=new THREE.Matrix4(), _p=new THREE.Vector3(), _s=new THREE.Vector3(), _q=new THREE.Quaternion(), _e=new THREE.Euler();
let FXS=1; // v2.12 (29번 ㄴ): 무기 효과 크기 — 지역 필드는 카메라가 멀어서 그만큼 키운다
const _qz=new THREE.Quaternion(), _zAx=new THREE.Vector3(0,0,1);
const BEND_NEXT=[0,0,0,0]; const bendSet=(a,b,c,d)=>{ BEND_NEXT[0]=a; BEND_NEXT[1]=b; BEND_NEXT[2]=c; BEND_NEXT[3]=d; };
class Batch{
  constructor(map,w,h,cap,{additive=false,flat=false,base=true,alphaTest=.5,order=0,transparent=false,bend=false}={}){
    const geo=bend?new THREE.PlaneGeometry(w,h,6,6):new THREE.PlaneGeometry(w,h); if(base) geo.translate(0,h/2,0);
    if(bend){ this.ab=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4); this.ab.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aBend',this.ab); }
    const mat=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,alphaTest:additive||transparent?0:alphaTest,transparent:additive||transparent,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:!(additive||transparent),fog:!additive});
    this.mesh=new THREE.InstancedMesh(geo,mat,cap); this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3); this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled=false; if(bend) bendMat(mat,h,true); this.mesh.renderOrder=order; this.q=flat?FLATQ:BBQ; this.flat=flat; this.cap=cap; this.n=0; this.h=base?h:0; this.w=w; this.fx=false; this.glow=null; scene.add(this.mesh);
  }
  begin(){ this.n=0; }
  push(x,y,z,sx,sy,r=1,g=1,b=1,rot=0){ if(this.n>=this.cap) return;
    if(this.fx){ sx*=FXS; sy*=FXS; const G=this.glow; if(G&&glowB){ const k=Math.max(this.w*sx,(this.h||this.w)*sy)*G[0]; glowB.push(x,y+(this.flat?.05:this.h*sy*.5),z,k,k,G[1]*r*.4,G[2]*g*.4,G[3]*b*.4); } }
    let q=this.q; if(rot){ _e.set(this.flat?-Math.PI/2:-PITCH,0,0); _q.setFromEuler(_e); _qz.setFromAxisAngle(_zAx,rot); q=_q.multiply(_qz); }
    _m.compose(_p.set(x,y,z),q,_s.set(sx,sy,1)); this.mesh.setMatrixAt(this.n,_m); this.mesh.instanceColor.setXYZ(this.n,r,g,b);
    if(this.ab){ const v=BEND_NEXT; this.ab.setXYZW(this.n,v[0]*(sx<0?-1:1),v[1],v[2],v[3]); } this.n++; }
  end(){ this.mesh.count=this.n; this.mesh.instanceMatrix.needsUpdate=true; this.mesh.instanceColor.needsUpdate=true; if(this.ab) this.ab.needsUpdate=true; }
}

/* ============ 괴수 종류 ============ */
const ET={
  shade:{art:'shade',h:1.3,hp:9,spd:1.5,dmg:14,xp:1,r:.36,faceL:true},
  wisp:{art:'wisp',h:1.25,hp:6,spd:2.5,dmg:7,xp:1,r:.3,emissive:true,float:.35},
  elite:{art:'elite',h:2.3,hp:120,spd:1.25,dmg:24,xp:6,r:.7,kbRes:.25,faceL:true},
  toad:{art:'toad',h:.95,hp:30,spd:2.1,dmg:0,xp:0,r:.4,treasure:true},
  magpie:{art:'magpie',h:1.0,hp:18,spd:2.9,dmg:0,xp:0,r:.35,treasure:true,float:.7},
  yagwang:{art:'yagwang',h:1.25,hp:40,spd:3.9,dmg:0,xp:3,r:.42,thief:true},
  gangcheol:{art:'gangcheol',h:2.5,hp:300,spd:1.05,dmg:22,xp:10,r:.85,kbRes:.5,hail:true},
  gpig:{art:'gpig',h:1.45,hp:160,spd:1.8,dmg:0,xp:0,r:.6,treasure:true},
  // v2.16 영노: 둘레 괴수를 삼킬수록 커지고 질겨진다 · 숨을 들이켜 끌어당긴다 · 아홉을 삼키면 너에게 돌진
  yeongno:{art:'yeongno',h:1.9,hp:260,spd:1.3,dmg:22,xp:12,r:.75,kbRes:.45,devour:true},
  // v2.39 새 일반 괴수 (57번 문서) — 귀졸 떼(『삼국유사』 비형랑의 귀신 무리) · 목랑(『신증동국여지승람』 경주 두두리) · 이매·망량(정도전 「사리매문」 산의 것·물의 것)
  gwijol:{art:'gwijol',h:.85,hp:4,spd:4.6,dmg:8,xp:1,r:.3,pack:true},
  mokrang:{art:'mokrang',h:1.5,hp:42,spd:.85,dmg:16,xp:3,r:.55,kbRes:.6,root:true},
  imae:{art:'imae',h:1.2,hp:12,spd:1.9,dmg:10,xp:2,r:.38,blink:true,emissive:true},
  mangryang:{art:'mangryang',h:1.2,hp:16,spd:2.7,dmg:12,xp:2,r:.4,lurk:true},
  // v2.48 지역 일반 괴수(61번). 그림은 제미나이 그림이 오기 전까지 지금 그림에 색(tint)
  jineS:{art:'jineA',h:.85,hp:6,spd:4.3,dmg:9,xp:1,r:.3,pack:true,nm:'새끼 지네'},
  fox:{art:'fox',h:.95,hp:14,spd:3.4,dmg:10,xp:2,r:.36,orbit:true,nm:'여우 떼'},
  dfire:{art:'wisp',h:1.1,hp:8,spd:2.3,dmg:9,xp:1,r:.3,emissive:true,float:.5,tint:[1,.42,.32],nm:'도깨비불'},
  bulsae:{art:'bulsaeA',h:1.1,hp:60,spd:1.25,dmg:14,xp:3,r:.5,kbRes:.5,nm:'불가사리 새끼'},
  hwama:{art:'hwama',h:1.5,hp:30,spd:1.7,dmg:12,xp:3,r:.4,emissive:true,float:.2,trail:true,nm:'타락한 화마'},
  bulgaeS:{art:'bulgaeA',h:1.0,hp:16,spd:3.8,dmg:11,xp:2,r:.36,orbit:true,nm:'불개 새끼'},
  gureongS:{art:'gureongA',h:.9,hp:26,spd:1.5,dmg:13,xp:2,r:.45,nm:'구렁이 새끼'}
};
// v2.22 괴수 움직임(코드): 종류마다 걸음새가 다르다. m=걸음새, f=걸음 빠르기, a=세기, lean=나아가는 쪽으로 숙이기
const MOTION={ shade:{m:'glide',f:3,a:1,lean:1.4}, wisp:{m:'float',f:2,a:1,lean:.6}, elite:{m:'stomp',f:4.2,a:1,lean:.7},
  toad:{m:'hop',f:1.5,a:1,lean:.4}, magpie:{m:'flap',f:13,a:1,lean:.9}, yagwang:{m:'scuttle',f:12,a:1,lean:2},
  gangcheol:{m:'stomp',f:3.2,a:1.3,lean:.5}, gpig:{m:'trot',f:3.2,a:1,lean:.8}, yeongno:{m:'stomp',f:3.6,a:1.1,lean:.6},
  gwijol:{m:'scuttle',f:15,a:1,lean:2.2}, mokrang:{m:'stomp',f:2.4,a:1.25,lean:.3}, imae:{m:'glide',f:2,a:1,lean:1}, mangryang:{m:'glide',f:3.2,a:1,lean:1.2},
  jineS:{m:'crawl',f:14,a:1,lean:1.6}, fox:{m:'scuttle',f:12,a:1,lean:1.8}, dfire:{m:'float',f:2,a:1,lean:.6}, bulsae:{m:'stomp',f:3.6,a:1.2,lean:.5}, hwama:{m:'float',f:2.4,a:1,lean:.8}, bulgaeS:{m:'scuttle',f:13,a:1,lean:2}, gureongS:{m:'crawl',f:4,a:1.4,lean:1} };
const CORPSE=[]; // 쓰러지는 괴수(그림만, .32초)
const ENEMY_CAP=MOBILE?240:340;
const BATCH={};
for(const k in ET){ const A=ART[ET[k].art], H=ET[k].h, W=H*A.w/A.h;
  const R=ERIM[k]||['teal',1.3]; BATCH[k]={frames:A.tex.map(t=>{ const b=new Batch(t,W,H,ENEMY_CAP,{bend:true}); inkMat(b.mesh.material,{w:1.4,rw:R[1],rim:RIMC[R[0]],pop:true}); return b; }), glow:new Batch(A.gtex,W,H,ENEMY_CAP,{additive:true,order:5,bend:true})}; }
const shadowB=new Batch(T.shadow,1,1,ENEMY_CAP+40,{flat:true,base:false,transparent:true});
const gemB=new Batch(T.gem,.42,.42,420,{order:2}), gemBigB=new Batch(T.gemBig,.6,.6,120,{order:2}), emberB=new Batch(T.ember,.6,.6,30,{order:2}), joriB=new Batch(T.jori,.8,.8,12,{order:2});
// v2.3 새 무기 그림: 제미나이 AI 그림
const yutB=new Batch(ltex('img/yut.webp'),.16,.82,40,{base:false,order:7}), totemB=new Batch(ltex('img/jang.webp'),.6,2.15,12,{order:3}), postB=new Batch(ltex('img/post.webp'),.55,.83,40,{order:3}), kiteB=new Batch(ltex('img/kite.webp'),1.0,1.1,6,{base:false,order:7}), topB=new Batch(ltex('img/top.webp'),.72,.67,12,{order:3}),
  arrowB=new Batch(ltex('img/arrow.webp'),1.55,.21,80,{flat:true,base:false,order:6}), popMaskB=new Batch(ltex('img/mask.webp'),.95,1.16,4,{base:false,order:9}), popFanB=new Batch(ltex('img/fan.webp'),1.2,1.08,4,{base:false,order:9}), ropeB=new Batch(T.rope,.16,.16,700,{base:false,order:4}), pepperB=new Batch(T.pepper,.14,.21,200,{base:false,order:4}),
  waveB=new Batch(T.ring,1,1,16,{flat:true,base:false,additive:true,order:2}), rocketB=new Batch(T.halo,.7,.7,40,{additive:true,base:false,order:8});
const orbB=new Batch(T.halo,.9,.9,120,{additive:true,base:false,order:8}), orbCoreB=new Batch(T.halo,.32,.32,120,{additive:true,base:false,order:9});
const foxB=new Batch(T.halo,1.0,1.0,200,{additive:true,base:false,order:8}), foxCoreB=new Batch(T.halo,.38,.38,200,{additive:true,base:false,order:9});
const saltB=new Batch(T.salt,.9,.9,260,{flat:true,base:false,transparent:true,order:1});
const beanB=new Batch(T.bean,.38,.38,120,{base:false,order:7,transparent:true});
const puddleB=new Batch(T.puddle,1.6,1.6,60,{flat:true,base:false,transparent:true,order:1});
const talisB=new Batch(T.talis,.32,.48,ENEMY_CAP,{base:false,order:6,transparent:true});
const markB=new Batch(T.mark,.34,.34,ENEMY_CAP,{base:false,order:6,additive:true});
const fanB=new Batch(T.fan,1,1,40,{flat:true,base:false,additive:true,order:3});
// v2.12: 무기 덧빛 — 무기 그림 둘레에 같은 색 빛을 깔아 밝은 거리에서도 보이게
const glowB=new Batch(T.halo,1,1,1400,{base:false,additive:true,order:7});
const fxRingB=new Batch(T.ring,1,1,60,{flat:true,base:false,additive:true,order:4}); // v2.12: 효과 고리 테두리(범위가 또렷하게)
function fxSetup(){ const G=(b,k,r,g,bl)=>{ b.fx=true; if(k) b.glow=[k,r,g,bl]; };
  G(yutB,2.6,1,.85,.45); G(totemB,1.5,1,.8,.35); G(postB,1.8,1,.85,.5); G(kiteB,1.9,.6,.9,1); G(topB,2.2,1,.8,.4); G(arrowB,1.1,1,.9,.6); G(popMaskB,1.9,1,.85,.5); G(popFanB,1.9,.7,.9,1);
  G(ropeB,3,1,.8,.4); G(pepperB,3,1,.6,.25); G(rocketB,1.6,1,.8,.4); G(orbB,1.5,.5,1,.95); G(orbCoreB,0); G(saltB,1.8,.9,.95,1); G(beanB,2.4,1,.75,.3); G(talisB,2.8,1,.9,.5); G(markB,2.4,1,.85,.4); }
const teleB=new Batch(T.dline,1,1,40,{flat:true,base:false,transparent:true,order:3});
const dangerB=new Batch(T.danger,1,1,80,{flat:true,base:false,transparent:true,order:3}), eshotB=new Batch(T.eshot,.62,.62,220,{base:false,transparent:true,order:10});
// v2.56 기믹 바닥 표시: 하양 그림에 색을 입힌다(붉은·보라 = 피할 곳 · 초록 = 들어갈 곳 · 금빛 = 밟을 것 · 푸른 = 멈출 때)
function gDiscC(){ const c=mk(128,128), x=c.getContext('2d'); x.fillStyle='rgba(255,255,255,.34)'; x.beginPath(); x.arc(64,64,60,0,7); x.fill(); x.strokeStyle='rgba(20,10,16,.85)'; x.lineWidth=6; x.beginPath(); x.arc(64,64,59,0,7); x.stroke(); x.strokeStyle='#fff'; x.lineWidth=4; x.beginPath(); x.arc(64,64,56,0,7); x.stroke(); return c; }
function gRingC(){ const c=mk(128,128), x=c.getContext('2d'); x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=14; x.beginPath(); x.arc(64,64,54,0,7); x.stroke(); x.strokeStyle='rgba(255,255,255,.95)'; x.lineWidth=6; x.beginPath(); x.arc(64,64,59,0,7); x.stroke(); return c; }
function gLineC(){ const c=mk(32,128), x=c.getContext('2d'); x.fillStyle='rgba(255,255,255,.36)'; x.fillRect(3,0,26,128); x.fillStyle='rgba(20,10,16,.85)'; x.fillRect(0,0,3,128); x.fillRect(29,0,3,128); x.fillStyle='#fff'; x.fillRect(3,0,2,128); x.fillRect(27,0,2,128); return c; }
const gDiscB=new Batch(tex(gDiscC()),1,1,420,{flat:true,base:false,transparent:true,order:3}), gRingB=new Batch(tex(gRingC()),1,1,140,{flat:true,base:false,additive:true,order:4}), gLineB=new Batch(tex(gLineC()),1,1,60,{flat:true,base:false,transparent:true,order:3});

/* ============ 종이 인형 ============ */
// 걷는 결: st=걸음 빠르기 배수, bob=통통 튀는 정도, sq=눌림, sw=좌우 흔들림, lean=옆모습에서 앞으로 숙임
const GAIT0={st:1,bob:1,sq:1,sw:1,lean:0};
const GAIT={ fire:{st:.92,bob:1.25,sq:1.4,sw:.8,lean:.03}, clerk:{st:1.12,bob:.9,sq:.8,sw:.7,lean:.02}, taxi:{st:.98,bob:.8,sq:1,sw:1.9,lean:0}, gosi:{st:1.05,bob:.45,sq:.6,sw:.5,lean:.07}, seoyun:{st:.95,bob:.6,sq:.7,sw:.8,lean:.02}, haram:{st:1.12,bob:1.05,sq:.9,sw:.9,lean:.03} };
class Paper{
  constructor(views,o={}){
    this.views=views; this.o=o; this.root=new THREE.Group(); this.bb=new THREE.Group(); this.bb.rotation.copy(bbFace); this.root.add(this.bb);
    this.mat=new THREE.MeshBasicMaterial({map:views.front.tex[0],alphaTest:.4,side:THREE.DoubleSide,transparent:!!o.transparent,opacity:o.opacity??1});
    if(o.ink!==false) inkMat(this.mat,o.ink||{}); this.body=new THREE.Mesh(views.front.geo,this.mat); this.bb.add(this.body);
    this.gmat=new THREE.MeshBasicMaterial({map:views.front.gtex||views.front.tex[0],blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false,opacity:.7});
    this.glow=new THREE.Mesh(views.front.geo,this.gmat); this.glow.position.z=.03; this.glow.renderOrder=5; this.bb.add(this.glow);
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.shadow,transparent:true,depthWrite:false,opacity:.8}));
    sh.rotation.x=-Math.PI/2; sh.position.y=.02; sh.scale.set(o.shadowW??.9,o.shadowD??.45,1); this.root.add(sh); this.shadow=sh; this.shW=o.shadowW??.9; this.shD=o.shadowD??.45;
    this.view='front'; this.flip=false; this.walk=0; this.t=0; this.moving=false; scene.add(this.root);
  }
  setViews(views){ this.views=views; const v=this.view; this.view=''; this.look(this.flip?-1:0,this.flip?0:1); if(v) this.forceView(v); }
  forceView(v){ this.view=v; const V=this.views[v]; this.body.geometry=V.geo; this.glow.geometry=V.geo; }
  look(vx,vz){ const a=Math.atan2(vx,vz),A=Math.abs(a); let v; if(A<.62)v='front'; else if(A>Math.PI-.62)v='back'; else v='side';
    const W=this.views[v]&&this.views[v].walk; const flip=(v==='side'||(W&&W.flip))?(Math.abs(vx)>.05?vx<0:this.flip):false; if(v!==this.view||flip!==this.flip){ if(flip!==this.flip&&this.o.turn) this.turn=1; else this.bb.scale.x=flip?-1:1; this.view=v; this.flip=flip; const G=W?W.geo:this.views[v].geo; this.body.geometry=G; this.glow.geometry=G; } }
  update(dt,speed){
    this.t+=dt; const V=this.views[this.view], G=this.gait||GAIT0;
    // v2.39 움직임: 종이 인형이 몸을 휙 뒤집는다(0.1초) · 출발할 때 앞으로 쏠리고 멈출 때 살짝 눌린다 · 캐릭터마다 걷는 결
    if(this.turn>0){ this.turn=Math.max(0,this.turn-dt/.1); const k=Math.max(.12,Math.abs(Math.cos(this.turn*Math.PI))); this.bb.scale.x=(this.turn>.5?(this.flip?1:-1):(this.flip?-1:1))*k; }
    if(this.moving!==this._wm){ if(this.moving) this.kick=1; else this.settle=1; this._wm=this.moving; }
    const fs=this.flip?-1:1, side=this.view==='side';
    if(this.moving){ const w0=this.walk; this.walk+=dt*speed*(this.o.stride??3.4)*G.st; const ph=this.walk*Math.PI/2, b=Math.abs(Math.sin(ph)); this.body.position.y=b*.02*G.bob; this.body.scale.set(1,1-(1-b)*.02*G.sq,1); this.shadow.scale.set(this.shW*(1-b*.07),this.shD*(1-b*.07),1); this.body.rotation.z=Math.sin(ph)*.035*G.sw;
      if(this.o.onStep&&Math.floor(w0)!==Math.floor(this.walk)) this.o.onStep(this);
      if(side) this.body.rotation.z-=fs*G.lean; }
    else{ this.body.position.y=0; const br=Math.sin(this.t*2.2)*.018; this.body.scale.set(1-br*.5,1+br,1); this.body.rotation.z=side?-fs*G.lean*.4:0; this.shadow.scale.set(this.shW,this.shD,1);
      if(!this._tl) this._tl=this.t+3+Math.random()*3; const c=this.t-this._tl; if(c>0&&c<1.1) this.body.rotation.z+=Math.sin(c/1.1*Math.PI)*.045*(this._td||1); else if(c>=1.1){ this._tl=this.t+3+Math.random()*4; this._td=Math.random()<.5?-1:1; } } // v2.54 가만히 있으면 숨쉬고 가끔 고개를 갸웃
    if(this.kick>0){ this.kick=Math.max(0,this.kick-dt/.18); const k=Math.sin(this.kick*Math.PI); if(side) this.body.rotation.z-=fs*.13*k; this.body.scale.y*=1-.06*k; this.body.scale.x*=1+.04*k; }
    if(this.settle>0){ this.settle=Math.max(0,this.settle-dt/.22); const k=Math.sin(this.settle*Math.PI); if(side) this.body.rotation.z+=fs*.07*k; this.body.scale.y*=1-.07*k; this.body.scale.x*=1+.05*k; }
    let map=V.tex[0], gmap=V.gtex; const W=V.walk;
    if(W){ const i=this.moving?Math.floor(this.walk*3)%W.tex.length:0; map=W.tex[i]; gmap=W.gtex?W.gtex[i]:null; if(this.body.geometry!==W.geo){ this.body.geometry=W.geo; this.glow.geometry=W.geo; } if(this.moving){ this.body.position.y*=.3; this.body.rotation.z*=.3; } }
    this.mat.map=map; this.gmat.map=gmap||map; this.glow.visible=!!gmap&&!this.o.noGlow;
    this.glow.position.y=this.body.position.y; this.glow.scale.copy(this.body.scale); this.glow.rotation.z=this.body.rotation.z;
  }
}
const lanternL=addLight(0xffc070,10,6);
const footDot=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42),new THREE.MeshBasicMaterial({map:T.halo,color:0xfff0a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,fog:false,opacity:.7}));
footDot.rotation.x=-Math.PI/2; footDot.renderOrder=6; footDot.visible=false; scene.add(footDot);
const player=new Paper(CHARV.fire,{ink:{w:1.6,rw:1.4,rim:RIMC.gold},turn:true,onStep:p=>stepDust(p)}); player.gait=GAIT.fire; const PSC=1.15; player.root.scale.setScalar(PSC); // v2.36 화면 정리: 주인공이 너무 작다(기획자·51번 5) → 그림 1.15배
// v2.7 그래픽: 괴수 떼에 가려도 내 캐릭터 윤곽이 보이게 (가려진 부분만 금빛으로 비침)
const xray=new THREE.Mesh(player.body.geometry,new THREE.MeshBasicMaterial({map:player.mat.map,color:0xffc860,transparent:true,opacity:.6,depthWrite:false,depthFunc:THREE.GreaterDepth,alphaTest:.4,fog:false,side:THREE.DoubleSide}));
xray.renderOrder=30; player.bb.add(xray);
function xraySync(){ xray.geometry=player.body.geometry; xray.material.map=player.mat.map; xray.position.copy(player.body.position); xray.rotation.copy(player.body.rotation); xray.scale.copy(player.body.scale); }
const shadowP=new Paper(CHARV.fire,{transparent:true,opacity:.82,noGlow:true}); shadowP.root.visible=false; shadowP.mat.color.setRGB(.06,.04,.1);

/* ============ 보스 ============ */
const boss={alive:false,root:new THREE.Group(),bb:new THREE.Group(),view:'front',flip:false,def:null};
boss.bb.rotation.copy(bbFace); boss.root.add(boss.bb);
boss.mat=inkMat(new THREE.MeshBasicMaterial({map:null,alphaTest:.4,side:THREE.DoubleSide}),{w:2.2,rw:2,rim:RIMC.red,pop:true});
bendMat(boss.mat,3,false); boss.body=new THREE.Mesh(new THREE.PlaneGeometry(1,1),boss.mat); boss.bb.add(boss.body);
boss.sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.shadow,transparent:true,depthWrite:false,opacity:.85}));
boss.sh.rotation.x=-Math.PI/2; boss.sh.position.y=.02; boss.sh.scale.set(2.6,.85,1); boss.root.add(boss.sh);
boss.halo=haloSprite(0x33dcc8,4,.25); boss.root.add(boss.halo); boss.halo.position.y=1.4;
boss.root.visible=false; scene.add(boss.root);
for(const k in BOSSDEF){ const B=BOSSDEF[k]; B.geo={}; B.tex={}; for(const v in B.views){ const [src,w,h,hs=1]=B.views[v]; B.geo[v]=new THREE.PlaneGeometry(B.H*hs*w/h,B.H*hs,6,8).translate(0,B.H*hs/2,0); B.geo[v].userData.h=B.H*hs; B.tex[v]=ltex(src); } }
const bossL=addLight(0x33dcc8,7,6); bossL.on=false; bossL.l.intensity=0;
const teleMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1).translate(0,.5,0),new THREE.MeshBasicMaterial({map:T.dline,transparent:true,depthWrite:false,fog:false})); teleMesh.renderOrder=3;
teleMesh.rotation.x=-Math.PI/2; teleMesh.visible=false; scene.add(teleMesh);
const slamRing=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.danger,transparent:true,depthWrite:false,fog:false})); slamRing.renderOrder=3;
slamRing.rotation.x=-Math.PI/2; slamRing.position.y=.06; slamRing.visible=false; scene.add(slamRing);
// v2.56 decoy(가짜): 보스 그림을 나눠 쓰는 가짜 2~3마리 — 진짜만 그림자가 짙다
const DECOY=[]; for(let i=0;i<3;i++){ const r=new THREE.Group(), bb=new THREE.Group(); bb.rotation.copy(bbFace); r.add(bb); const m=new THREE.MeshBasicMaterial({map:null,alphaTest:.4,side:THREE.DoubleSide,transparent:true,opacity:.95}); const b=new THREE.Mesh(new THREE.PlaneGeometry(1,1),m); bb.add(b);
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.shadow,transparent:true,depthWrite:false,opacity:.22})); sh.rotation.x=-Math.PI/2; sh.position.y=.02; sh.scale.set(2.2,.7,1); r.add(sh); r.visible=false; scene.add(r); DECOY.push({r,bb,b,m}); }
function bossLook(vx,vz){ const B=boss.def; if(vx||vz){ boss.lvx=vx; boss.lvz=vz; } const a=Math.atan2(vx,vz),A=Math.abs(a); let v; if(A<.62)v='front'; else if(A>Math.PI-.62)v='back'; else v='side';
  if(!B.views[v]) v='front'; if(boss.pose&&B.views.atk) v='atk'; const flip=(v==='side'||v==='atk'||!B.views.side)?vx<0:false;
  if(v!==boss.view||flip!==boss.flip){ boss.view=v; boss.flip=flip; boss.bb.scale.x=flip?-1:1; boss.body.geometry=B.geo[v]; boss.mat.map=B.tex[v]; } }

// v2.16 보스 공격 자세: 공격하는 동안 제미나이 공격 그림으로 바꾼다
function bossPose(on){ if(!!boss.pose===!!on) return; boss.pose=!!on; boss.view=''; bossLook(boss.lvx||0,boss.lvz||1); }

/* ============ 무기 그림 ============ */
const auraMesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:T.ring,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:.9}));
auraMesh.rotation.x=-Math.PI/2; auraMesh.position.y=.05; scene.add(auraMesh);
const auraMesh2=auraMesh.clone(); auraMesh2.material=auraMesh.material.clone(); auraMesh2.material.color.setRGB(.6,.4,1); scene.add(auraMesh2);
const axeGeo=new THREE.PlaneGeometry(.95,.95), axeMat=new THREE.MeshBasicMaterial({map:T.axe,alphaTest:.5,side:THREE.DoubleSide});
const AXES=[]; for(let i=0;i<6;i++){ const g=new THREE.Group(); g.rotation.copy(bbFace); const m=new THREE.Mesh(axeGeo,axeMat); g.add(m); g.visible=false; scene.add(g); AXES.push({g,m}); }
// v2.34 그림자 도끼: 그림자 둘레를 실제로 도는 보랏빛 도끼(전엔 고리만 번쩍여서 「도끼가 안 생긴다」 — 기획자 11-17 16:54)
const shAxeMat=new THREE.MeshBasicMaterial({map:T.axe,alphaTest:.5,side:THREE.DoubleSide,transparent:true,opacity:.8,color:new THREE.Color(.5,.32,1)});
const SHAXES=[]; for(let i=0;i<6;i++){ const g=new THREE.Group(); g.rotation.copy(bbFace); const m=new THREE.Mesh(axeGeo,shAxeMat); g.add(m); g.visible=false; scene.add(g); SHAXES.push({g,m}); }
function shAxesOff(){ for(const A of SHAXES) A.g.visible=false; }
const beamMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1).translate(.5,0,0),new THREE.MeshBasicMaterial({map:T.line,color:0xff3040,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
beamMesh.rotation.order='YXZ'; beamMesh.visible=false; scene.add(beamMesh);
const headL=haloSprite(0xfff2c0,1.6,0); scene.add(headL);
const fxs=[]; // 부채꼴·고리 효과 {x,z,r,a0,life,max,col,kind}
function fx(x,z,r,col,life=.25,a=0){ life*=1.5; fxs.push({x,z,r,col,life,max:life,a}); } // v2.12: 효과 고리를 조금 더 오래

/* ============ 소리 (설화 원전 소리만, 사람 말 없음) ============ */
const SND={ctx:null,on:true,last:{}};
function sndInit(){
  if(SND.ctx) return; try{ SND.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  const c=SND.ctx; SND.master=c.createGain(); SND.master.gain.value=SND.on?.7:0; SND.master.connect(c.destination);
  const len=c.sampleRate*2, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  SND.noise=buf;
  const wind=c.createBufferSource(); wind.buffer=buf; wind.loop=true; const wf=c.createBiquadFilter(); wf.type='bandpass'; wf.frequency.value=400; wf.Q.value=.6;
  SND.amb=c.createGain(); SND.amb.gain.value=1; SND.amb.connect(SND.master); // v2.44: 바람·웅 소리 묶음 — 배경음악이 나오는 동안엔 끈다(bgmTick)
  const wg=c.createGain(); wg.gain.value=.05; wind.connect(wf); wf.connect(wg); wg.connect(SND.amb); wind.start();
  const lfo=c.createOscillator(); lfo.frequency.value=.07; const lg=c.createGain(); lg.gain.value=250; lfo.connect(lg); lg.connect(wf.frequency); lfo.start();
  const o1=c.createOscillator(); o1.type='sawtooth'; o1.frequency.value=55; const o2=c.createOscillator(); o2.type='sine'; o2.frequency.value=82.4;
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=180; const dg=c.createGain(); dg.gain.value=.045;
  o1.connect(lp); o2.connect(lp); lp.connect(dg); dg.connect(SND.amb); o1.start(); o2.start();
}
function env(g,t,a,peak,dcy){ g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+a+dcy); }
function throttle(k,ms){ const n=performance.now(); if(SND.last[k]&&n-SND.last[k]<ms) return false; SND.last[k]=n; return true; }
function tone(type,f0,f1,dur,peak,att=.005){ if(!SND.ctx) return; const c=SND.ctx,t=c.currentTime; const o=c.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=c.createGain(); env(g,t,att,peak,dur); o.connect(g); g.connect(SND.master); o.start(t); o.stop(t+dur+.1); }
function noise(fq,type,dur,peak,q=.8){ if(!SND.ctx) return; const c=SND.ctx,t=c.currentTime; const s=c.createBufferSource(); s.buffer=SND.noise; const f=c.createBiquadFilter(); f.type=type; f.frequency.value=fq; f.Q.value=q; const g=c.createGain(); env(g,t,.003,peak,dur); s.connect(f); f.connect(g); g.connect(SND.master); s.start(t,rr(0,1),dur+.1); }
const sfx={
  hit(){ if(throttle('hit',45)) noise(1800,'highpass',.05,.08); },
  gem(){ if(throttle('gem',50)) tone('sine',rr(1100,1500),2200,.07,.05,.003); },
  lvl(){ if(!SND.ctx) return; [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone('triangle',f,f*1.01,.35,.12,.01),i*70)); },
  hurt(){ if(throttle('hurt',220)) tone('sine',140,50,.18,.25); },
  heal(){ if(throttle('heal',300)) tone('sine',400,800,.3,.08,.02); },
  splash(){ if(throttle('splash',300)) noise(2500,'bandpass',.35,.07); },
  horn(){ if(throttle('horn',200)){ tone('square',330,320,.28,.06,.01); tone('square',415,410,.28,.05,.01); } },
  bean(){ if(throttle('bean',70)) tone('triangle',900,1300,.04,.04); },
  flute(){ if(!SND.ctx) return; [784,988,1175].forEach((f,i)=>setTimeout(()=>tone('sine',f,f,.5,.07,.05),i*90)); },
  beep(){ if(throttle('beep',150)) tone('square',1900,1900,.06,.03); },
  club(){ if(throttle('club',150)) noise(300,'lowpass',.15,.2); },
  salt(){ if(throttle('salt',600)) noise(5000,'highpass',.12,.03); },
  foxCry(){ if(!SND.ctx) return; const c=SND.ctx,t=c.currentTime;
    for(let k=0;k<2;k++){ const t0=t+k*.55; const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(620,t0); o.frequency.linearRampToValueAtTime(1150,t0+.12); o.frequency.exponentialRampToValueAtTime(380,t0+.5);
      const vib=c.createOscillator(); vib.frequency.value=13; const vg=c.createGain(); vg.gain.value=28; vib.connect(vg); vg.connect(o.frequency);
      const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1300; f.Q.value=3; const g=c.createGain(); env(g,t0,.03,.22,.5);
      o.connect(f); f.connect(g); g.connect(SND.master); o.start(t0); vib.start(t0); o.stop(t0+.6); vib.stop(t0+.6); } },
  // 불가사리: 쇠 씹는 소리 (원전: 쇠를 먹는 괴물)
  ironChew(){ if(!SND.ctx) return; for(let i=0;i<4;i++) setTimeout(()=>{ noise(rr(2500,4200),'bandpass',.08,.16,6); tone('square',rr(90,140),60,.08,.05); },i*120); },
  roar(){ if(CRY[S?.bossKey]) sfx[CRY[S.bossKey]](); else if(S?.bossKey==='bulgasari') sfx.ironChew(); else if(S?.bossKey==='dokkaebi') sfx.laugh(); else if(S?.bossKey==='imugi'||S?.bossKey==='tiger') sfx.boom(); else sfx.foxCry(); },
  shot(){ if(throttle('shot',120)) tone('sine',300,900,.18,.06,.01); },
  die(){ tone('triangle',330,55,1.6,.25,.02); },
  // v2.2 새 기술 소리
  yut(){ if(throttle('yut',150)) for(let i=0;i<4;i++) setTimeout(()=>tone('square',rr(500,700),rr(300,400),.05,.05),i*40); },
  jang(){ tone('sine',90,60,.5,.25); noise(300,'lowpass',.3,.15); },
  jing(){ tone('sine',196,186,2.4,.24,.01); tone('sine',392,380,1.8,.08,.01); tone('triangle',294,288,2,.06,.02); noise(500,'lowpass',.15,.12); },
  whip(){ if(throttle('whip',120)) noise(3500,'highpass',.08,.14); },
  laugh(){ if(!SND.ctx) return; [620,560,500,440].forEach((f,i)=>setTimeout(()=>tone('triangle',f,f*.85,.09,.1),i*85)); },
  wind(){ if(throttle('wind',200)) noise(900,'bandpass',.35,.12,.6); },
  bow(){ if(throttle('bow',90)) tone('sine',900,200,.08,.06); },
  boom(){ if(throttle('boom',300)){ noise(200,'lowpass',.5,.3); tone('sine',120,40,.4,.2); } },
  // v2.56 기믹 예고 소리(합성) · 일반 보스 울음(원전 짐승 소리)
  crack(){ noise(900,'bandpass',.08,.2,3); tone('square',220,80,.06,.08); },
  click(){ tone('square',2400,1800,.03,.07); setTimeout(()=>tone('square',2000,1500,.03,.06),70); },
  whistle(){ tone('sine',1700,700,.9,.05,.05); },
  hum(){ if(throttle('hum',400)) tone('sawtooth',110,130,1.2,.05,.2); },
  pop(){ if(throttle('pop',120)) noise(700,'lowpass',.18,.22); },
  metal(){ tone('square',1250,1240,.12,.05); setTimeout(()=>tone('square',1580,1570,.15,.05),90); },
  sparkle(){ if(!SND.ctx) return; [1400,1800,2300].forEach((f,i)=>setTimeout(()=>tone('sine',f,f*1.05,.12,.05),i*70)); },
  croak(){ if(!SND.ctx) return; for(let i=0;i<3;i++) setTimeout(()=>tone('square',150,105,.13,.09),i*260); },
  squeak(){ if(!SND.ctx) return; for(let i=0;i<3;i++) setTimeout(()=>tone('square',2600,3300,.05,.035),i*90); },
  hoot(){ if(!SND.ctx) return; tone('sine',430,390,.32,.13,.04); setTimeout(()=>tone('sine',410,370,.42,.13,.04),420); },
  bark(){ if(!SND.ctx) return; tone('sawtooth',540,300,.11,.1); setTimeout(()=>tone('sawtooth',500,280,.12,.1),170); },
  caw(){ if(!SND.ctx) return; tone('sawtooth',880,560,.2,.07); setTimeout(()=>tone('sawtooth',840,540,.22,.07),260); },
  growl(){ tone('sawtooth',90,65,.55,.12,.03); noise(260,'lowpass',.45,.12); },
  hiss(){ noise(3200,'highpass',.4,.07); }
};
const CRY={chunjwi:'squeak',ahopmeori:'growl',juji:'growl',hyungjo:'hoot',keunmulgogi:'splash',keunjara:'hiss',okmungaeguri:'croak',saseumgae:'bark',sirang:'bark',kkamagwi:'caw'};
if(window.__seeded) for(const k in sfx) sfx[k]=()=>{}; // 같은 판 비교: 소리는 실제 시간에 따라 무작위를 써서 판이 갈라진다 → 끈다

if($('bGfx')) $('bGfx').onclick=gfxNext; if($('hGfx')) $('hGfx').onclick=gfxNext; setTimeout(gfxLbl,0);
$('bSnd').onclick=()=>{ SND.on=!SND.on; if(SND.master) SND.master.gain.value=SND.on?.7:0; $('bSnd').textContent=SND.on?'🔊 소리 켜짐':'🔇 소리 꺼짐'; }; // v2.36: 위쪽 띠 정리 — 소리 버튼은 메뉴 안으로
// v2.1 진동 (안드로이드 브라우저. 아이폰 사파리는 지원하지 않아 화면 효과만)
function buzz(ms){ if(SV.vib===false||BOT) return; try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
const vibUi=()=>{ $('bVib').textContent=SV.vib===false?'📳 진동 꺼짐':'📳 진동 켜짐'; $('bVib').style.opacity=SV.vib===false?.55:1; }; vibUi();
$('bVib').onclick=()=>{ SV.vib=SV.vib===false; save(); vibUi(); if(SV.vib) buzz(60); };
/* v2.32 배경음악 (기획자 11-17 09:39 「각 국가의 특색과 분위기에 맞게」 · 프롬프트는 47번 문서)
   장면 6개: 기지 · 필드 · 중간보스 · 파이널 · 쟁탈(불씨·그것) · 판 끝. 곡 파일(bgm/*.mp3)이 없으면 조용히 넘어간다.
   SND.master 아래에 물려서 🔊 끄기·통화 중 작게(callDuck)를 그대로 따른다. 장면이 바뀌면 2초 겹쳐 넘긴다. */
const BGM={files:{title:'bgm/bgm_title.mp3',base:'bgm/bgm_base.mp3',field:'bgm/bgm_field.mp3',mid:'bgm/bgm_mid.mp3',final:'bgm/bgm_final.mp3',clash:'bgm/bgm_clash.mp3',end:'bgm/bgm_end.mp3'},
  buf:{},el:{},miss:{},loading:{},pre:0,needTap:null,cur:'',want:'',src:null,g:null,bus:null,tk:0,log:[]};
const bgmVol=()=>SV.bgm==null?.55:SV.bgm;
function bgmBus(){ if(!SND.ctx||!SND.master) return null; if(!BGM.bus){ BGM.bus=SND.ctx.createGain(); BGM.bus.gain.value=bgmVol(); BGM.bus.connect(SND.master); } return BGM.bus; }
/* v2.43: 곡은 <audio>로 내려받으며 튼다(통째로 풀어 두면 곡 하나에 60MB쯤 → 폰 메모리 아낌). 소리는 그대로 SND.master 아래로 */
function bgmEl(k){ if(BGM.el[k]) return BGM.el[k]; const a=new Audio(); a.preload='auto'; a.loop=k!=='end'; a.setAttribute('playsinline',''); a.src=BGM.files[k];
  const e={k,a,src:null,g:null,stopT:0}; BGM.el[k]=e;
  a.addEventListener('canplaythrough',()=>{ if(!BGM.miss[k]&&!BGM.buf[k]){ BGM.buf[k]=e; bgmUi(); } });
  a.addEventListener('error',()=>{ BGM.miss[k]=1; delete BGM.buf[k]; bgmUi(); });
  return e; }
function bgmLoad(k){ if(BGM.miss[k]||!SND.ctx) return; bgmEl(k); }
function bgmWire(e){ if(e.src) return true; const bus=bgmBus(); if(!bus) return false;
  try{ e.src=SND.ctx.createMediaElementSource(e.a); e.g=SND.ctx.createGain(); e.g.gain.value=0; e.src.connect(e.g); e.g.connect(bus); return true; }catch(err){ BGM.miss[e.k]=1; return false; } }
function bgmGo(e){ const p=e.a.play(); if(p&&p.catch) p.catch(()=>{ BGM.needTap=e; }); }
function bgmFade(g,t,to,dur){ try{ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value,t); g.gain.linearRampToValueAtTime(to,t+dur); }catch(e){} }
function bgmPlay(k){ const bus=bgmBus(); if(!bus) return; BGM.want=k; if(BGM.cur===k) return;
  if(!BGM.buf[k]&&!BGM.miss[k]){ bgmLoad(k); return; } // 받는 동안은 앞 곡을 이어 튼다
  const c=SND.ctx, t=c.currentTime, X=k==='end'?.25:2;
  if(BGM.src){ const o=BGM.src; bgmFade(o.g,t,0,X); clearTimeout(o.stopT); o.stopT=setTimeout(()=>{ if(BGM.src!==o) try{ o.a.pause(); }catch(e){} },(X+.3)*1000); BGM.src=null; BGM.g=null; }
  BGM.cur=k; BGM.log.push(k); if(BGM.log.length>30) BGM.log.shift(); const e=BGM.buf[k]; if(!e||!bgmWire(e)) return; // 곡 없음 → 조용히
  clearTimeout(e.stopT); try{ e.a.currentTime=0; }catch(_){} if(!document.hidden) bgmGo(e);
  e.g.gain.cancelScheduledValues(t); e.g.gain.setValueAtTime(0,t); e.g.gain.linearRampToValueAtTime(k==='end'?1:.9,t+X); BGM.src=e; BGM.g=e.g;
  if(!BGM.pre){ BGM.pre=1; setTimeout(()=>{ for(const q in BGM.files) bgmLoad(q); },4000); } } // 첫 곡이 나오면 나머지 곡을 미리 받아 둔다
function bgmScene(){ const ti=$('title'); if(ti&&ti.classList.contains('show')) return 'title'; if(!S||S.phase==='hub') return 'base'; if(S.phase==='over') return 'end';
  if(S.doom||S.fLoot>0||(S.emG&&S.emG.length)) return 'clash';
  if(S.inSafe&&!(boss.alive&&!boss.dying)) return 'base'; // v2.44: 사냥 중에도 모닥불 둘레에 들어서면 모닥불 곡
  if(boss.alive&&!boss.dying){ const fin=S.field?S.bossKey===finalOf(S.field):!WORLD; return fin?'final':'mid'; }
  return 'field'; }
function bgmTick(dt){ if(!SND.ctx) return; BGM.tk-=dt; if(BGM.tk>0) return; BGM.tk=.5; bgmPlay(bgmScene());
  const on=!!(BGM.src&&BGM.src===BGM.buf[BGM.cur]&&!BGM.src.a.paused), want=on?0:1; // 곡이 실제로 나오면 바람 소리 끔, 곡이 없거나 받는 중이면 바람
  if(SND.amb&&BGM.ambW!==want){ BGM.ambW=want; bgmFade(SND.amb,SND.ctx.currentTime,want,want?2:1.2); } }
function bgmUi(){ const r=$('bgmR'), t=$('bgmT'); if(!r) return; const v=Math.round(bgmVol()*100); r.value=v; const none=!Object.keys(BGM.buf).length&&Object.keys(BGM.miss).length>0;
  t.textContent=none?`${v}% · 곡 아직 없음`:`${v}%`; }
if($('bgmR')){ $('bgmR').oninput=e=>{ SV.bgm=(+e.target.value)/100; if(BGM.bus) BGM.bus.gain.value=SV.bgm; bgmUi(); }; $('bgmR').onchange=()=>save(); bgmUi(); }
DBG.bgm=BGM; DBG.bgmScene=bgmScene;
/* v2.43: 홈 화면으로 내리거나 다른 앱으로 가면 소리(배경음악·효과음·바람) 멈춤, 돌아오면 다시. 음성통화는 따로라 그대로 */
const AWAY={n:0,log:[]};
function sndAway(away){ const c=SND.ctx; if(!c) return; AWAY.n++;
  const e=BGM.src; if(e){ try{ if(away) e.a.pause(); else bgmGo(e); }catch(_){} } AWAY.log.push((away?'off:':'on:')+c.state); if(AWAY.log.length>20) AWAY.log.shift();
  try{ if(away){ if(c.state!=='closed') { const p=c.suspend(); if(p&&p.catch) p.catch(()=>{}); } }
       else if(c.state!=='running'&&c.state!=='closed'){ const p=c.resume(); if(p&&p.catch) p.catch(()=>{}); } }catch(e){} }
document.addEventListener('visibilitychange',()=>sndAway(document.hidden));
addEventListener('pagehide',()=>sndAway(true)); addEventListener('pageshow',()=>{ if(!document.hidden) sndAway(false); });
document.addEventListener('pause',()=>sndAway(true)); document.addEventListener('resume',()=>{ if(!document.hidden) sndAway(false); }); // 앱 껍데기(APK)가 보내는 신호
// 폰이 바로 못 켜 주면(아이폰 등) 다음 손대는 순간 다시 켠다
addEventListener('pointerdown',()=>{ if(!SND.ctx){ const ti=$('title'); if(ti&&ti.classList.contains('show')) sndInit(); } // v2.44: 시작 화면은 처음 손대는 순간 곡 시작
  const c=SND.ctx; if(!c||document.hidden) return; if(c.state!=='running'&&c.state!=='closed') sndAway(false);
  const e=BGM.needTap; if(e){ BGM.needTap=null; if(BGM.src===e) bgmGo(e); } },true);
DBG.away=AWAY;
// v2.9.2 기획자 평: 스킬칸이 아래면 조이스틱과 겹친다 → 오른쪽(기본)·왼쪽·아래 고르기 / 레벨업은 모닥불에서 몰아 고르기(기본)·바로
// v2.9.2b 기획자 평: 스킬칸은 오른쪽 · 고르기 카드는 왼쪽 · 아래는 비움. 좌우 바꾸기는 멈춤 화면에서 (SV.flip)
function slotUi(){ const f=!!SV.flip, el=$('slots'); el.classList.toggle('sR',!f); el.classList.toggle('sL',f); $('lvbar').classList.toggle('R',f); $('lvBadge').classList.toggle('R',f); $('bSlot').textContent=f?'↔ 좌우: 스킬칸 왼쪽 · 고르기 오른쪽':'↔ 좌우: 스킬칸 오른쪽 · 고르기 왼쪽'; }
function lvmUi(){ $('bLvM').textContent=SV.lvMode==='now'?'⚡ 레벨업: 바로 고르기':'🔥 레벨업: 모닥불에서 몰아 고르기'; }
$('bSlot').onclick=()=>{ SV.flip=!SV.flip; save(); slotUi(); };
$('bLvM').onclick=()=>{ SV.lvMode=SV.lvMode==='now'?'camp':'now'; save(); lvmUi(); };
$('bTune').onclick=()=>openTune();
$('lvBadge').addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); if(!S||S.phase!=='play') return; if(S.inSafe) openCamp(); else openLevelUp(); updLvBadge(); });
$('bCampLater').onclick=()=>{ closeCamp(); toast('나중에 고른다','⬆ 성장 고르기를 누르거나 모닥불 고리 안에서'); };
slotUi(); lvmUi();

/* ============ v2.21 손그림 아이콘 (33번 3장 ㄴ · 이모지 → 제미나이 손그림) ============
   img/icons.webp 한 장(96px 칸, 8열). gi('키')가 <span class="gi">를 돌려준다. 키 순서는 tools/icons.py SHEETS 순서와 같다. */
const GI_KEYS=['axe','orb','lantern','hose','horn','salt','beans','talis','shadow','barcode','flute','club','yut','geumjul','jang','kite',
  'top','mask','fan','bow','r_coin','r_wick','r_bell','r_salt','r_fan','r_tal','r_shoe','r_gourd','r_pot','r_flint','r_needle','r_totem',
  'u_fire','u_ember','u_mid','u_final','u_tre','u_shut','u_spark','u_npc','sp_fire','sp_clerk','sp_taxi','p_luck',
  'f_singijeon','f_sea','f_yutpan','f_sotdae','f_whirl','f_saja','f_aekmak','f_rescue','f_patjuk','f_talnori','f_pyojeok','f_janjan','f_chorong','f_namu','f_jeonghwa','f_patyut','f_ppang','f_gungsu','f_jamul','f_baram',
  'h_map','h_char','h_tree','h_flow','h_dex','h_talk','h_gear','m_sil','m_garu','m_soe','g_helmet','g_lamp','g_coat','g_vest','g_glove','g_boot','g_shoe','g_flash','g_batt','g_whistle'];
const GI_COLS=8, GI_ROWS=Math.ceil(GI_KEYS.length/GI_COLS);
function gi(k,cls){ const i=GI_KEYS.indexOf(k); if(i<0) return ''; const c=i%GI_COLS, r=Math.floor(i/GI_COLS);
  return `<span class="gi${cls?' '+cls:''}" style="background-position:${(c*100/(GI_COLS-1)).toFixed(3)}% ${(GI_ROWS>1?r*100/(GI_ROWS-1):0).toFixed(3)}%"></span>`; }
for(const k in MTN) MTN[k].ic=gi(MTN[k].gk);
// v2.25 종이 질감: 화면 전체에 옅은 한지 결(곱하기 섞기). 캔버스로 한 번 만든다.
(function paperGrain(){ try{ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'), id=g.createImageData(256,256), D=id.data;
  for(let i=0;i<256*256;i++){ const x=i%256, y=(i/256)|0; let v=200+Math.random()*55; v-=(Math.sin(x*.21+Math.sin(y*.05)*3)*.5+.5)*14*(Math.random()<.5?1:0); if(Math.random()<.004) v-=60; D[i*4]=v; D[i*4+1]=v*.97; D[i*4+2]=v*.9; D[i*4+3]=255; }
  g.putImageData(id,0,0); const d=document.createElement('div'); d.id='paper'; d.style.cssText=`position:fixed;inset:0;pointer-events:none;z-index:2;background:url(${c.toDataURL()});mix-blend-mode:multiply;opacity:.16`; document.body.appendChild(d); }catch(e){} })();
function hubIcons(){ for(const [id,k] of [['hUp','u_fire'],['hMap','h_map'],['hCharB','h_char'],['hTree','h_tree'],['hFlow','h_flow'],['hDex','h_dex'],['hTalk','h_talk'],['hGear','h_gear']]){ const e=document.getElementById(id); if(e&&!e._gi){ e._gi=1; e.innerHTML=e.innerHTML.replace(/^[^\s<]+\s*/,gi(k)+' '); } } }
hubIcons();
{ const st=document.createElement('style'); st.textContent=`.gi{display:inline-block;width:1.3em;height:1.3em;vertical-align:-.3em;background:url(img/icons.webp) no-repeat;background-size:${GI_COLS*100}% ${GI_ROWS*100}%;filter:drop-shadow(0 1px 0 rgba(0,0,0,.55))}
.card .ic .gi{width:38px;height:38px}.lbc .ic .gi{width:24px;height:24px;vertical-align:middle}.relc .ri .gi{width:36px;height:36px}.tr-ic .gi{width:24px;height:24px}
#spIc .gi{width:30px;height:30px}.slot .gi{width:17px;height:17px;vertical-align:-4px}.ar b .gi{width:15px;height:15px;vertical-align:-3px;margin-right:1px}`; document.head.appendChild(st); }

/* ============ 무기·패시브·진화 ============ */
const WEAPONS={
  axe:{name:'소방 도끼',ic:gi('axe'),kind:'일반',desc:l=>['도끼 하나가 몸 주위를 돈다','도끼가 둘로 는다','도끼가 더 세게 벤다','도끼가 셋으로 는다','도끼가 넷으로 는다'][l-1]},
  orb:{name:'혼불',ic:gi('orb'),kind:'일반',desc:l=>['가장 가까운 것을 쫓는 불','더 자주 쏜다','두 개씩 쏜다','꿰뚫는다','세 개씩 쏜다'][l-1]},
  lantern:{name:'등불',ic:gi('lantern'),kind:'일반',desc:l=>['주변의 것들을 태우는 따뜻한 빛','빛이 넓어지고 세진다','빛 안의 것들이 느려진다','빛이 더 넓어진다','빛이 훨씬 세진다'][l-1]},
  hose:{name:'물줄기',ic:gi('hose'),kind:'일반',desc:l=>['바라보는 쪽으로 물을 뿜어 밀어낸다','더 멀리 뿜는다','더 자주 뿜는다','더 세게 뿜는다','오래 뿜는다'][l-1]},
  horn:{name:'경적',ic:gi('horn'),kind:'일반',desc:l=>['앞쪽으로 충격파, 크게 밀어낸다','더 멀리 울린다','더 자주 울린다','더 세게 울린다','부채꼴이 넓어진다'][l-1]},
  salt:{name:'소금 길',ic:gi('salt'),kind:'독창',desc:l=>['지나간 자리에 소금이 남는다. 밟은 것은 느려지고 다친다','소금이 더 오래 남는다','소금이 더 아프다','소금이 넓게 뿌려진다','소금이 훨씬 오래 남는다'][l-1]},
  beans:{name:'팥 튕기기',ic:gi('beans'),kind:'독창',desc:l=>['팥알이 괴수 사이를 세 번 튕긴다','네 번 튕긴다','팥알이 둘','다섯 번 튕긴다','팥알이 셋, 여섯 번'][l-1]},
  talis:{name:'포스트잇 부적',ic:gi('talis'),kind:'독창',desc:l=>['부적이 붙은 것은 서서히 탄다. 쓰러지면 부적이 옆의 둘에게 옮겨 붙는다','더 자주 붙인다','더 세게 태운다','한 번에 둘씩 붙인다','셋에게 옮겨 붙는다'][l-1]},
  shadow:{name:'그림자 분신',ic:gi('shadow'),kind:'독창',desc:l=>['내 그림자가 떨어져 나와 내 무기를 30% 힘으로 따라 쓴다','40%','50%','60%','70%'][l-1]},
  barcode:{name:'바코드 빛',ic:gi('barcode'),kind:'독창',desc:l=>['붉은 빛이 부채꼴로 쓸며 표시를 남긴다. 표시된 것을 쓰러뜨리면 조각 2배','빛이 길어진다','더 자주 쓴다','더 세게 쓴다','더 넓게 쓴다'][l-1]},
  flute:{name:'만파식적',ic:gi('flute'),kind:'독창',desc:l=>['피리를 불면 화면의 모든 것이 잠깐 멈춘다. 멈춘 것은 50% 더 다친다','더 오래 멈춘다','더 자주 분다','더 오래 멈춘다','훨씬 자주 분다'][l-1]},
  club:{name:'도깨비 방망이',ic:gi('club'),kind:'독창',desc:l=>['"뚝딱!" 휘두를 때마다 불·얼음·금·크게 치기 중 하나','더 세게','더 자주','더 넓게','훨씬 세게'][l-1]},
  yut:{name:'윷가락',ic:gi('yut'),kind:'독창',desc:l=>['윷을 던진다. 도·개·걸·윷·모 — 높은 수일수록 크게 터진다. 윷·모면 한 번 더','더 자주 던진다','더 세게 터진다','더 자주 던진다','훨씬 세게 터진다'][l-1]},
  geumjul:{name:'금줄',ic:gi('geumjul'),kind:'독창',desc:l=>['걸어온 자리에 말뚝을 박고 금줄을 잇는다. 줄을 넘는 것은 다치고 느려진다','줄이 더 아프다','더 자주 박는다','말뚝이 하나 더','줄이 오래 간다'][l-1]},
  jang:{name:'장승',ic:gi('jang'),kind:'독창',desc:l=>['장승을 세운다. 둘레의 것들이 장승에게 끌려가고, 장승이 울릴 때마다 다친다','더 크게 울린다','더 자주 세운다','더 멀리서 끌어온다','훨씬 크게 울린다'][l-1]},
  kite:{name:'방패연',ic:gi('kite'),kind:'독창',desc:l=>['연이 머리 위를 돈다. 연과 연줄에 닿은 것이 베인다','줄이 날카로워진다','더 빨리 돈다','더 넓게 돈다','훨씬 날카롭다'][l-1]},
  top:{name:'팽이',ic:gi('top'),kind:'독창',desc:l=>['팽이를 돌려 보낸다. 느려진 팽이에 다가가면 채찍질로 다시 돈다','더 세게 돈다','팽이가 둘','더 자주 돌린다','팽이가 셋'][l-1]},
  mask:{name:'하회탈',ic:gi('mask'),kind:'독창',desc:l=>['탈의 웃음소리. 둘레의 것들이 겁먹고 달아난다','더 넓게 웃는다','더 오래 겁먹는다','더 자주 웃는다','훨씬 넓게'][l-1]},
  fan:{name:'합죽선',ic:gi('fan'),kind:'독창',desc:l=>['부채 바람으로 멀리 밀어내고 둘레의 조각을 끌어온다','바람이 넓어진다','더 자주 부친다','더 세게 부친다','훨씬 넓게'][l-1]},
  bow:{name:'각궁',ic:gi('bow'),kind:'일반',desc:l=>['멀리 꿰뚫는 화살','더 세게','더 자주','두 발씩','훨씬 세게'][l-1]}
};
const PASSIVES={
  might:{name:'불씨',ic:'✦',desc:'모든 공격 +12%'},
  speed:{name:'굳은 다리',ic:'➶',desc:'이동 속도 +8%'},
  hp:{name:'두꺼운 옷',ic:'⛨',desc:'최대 체력 +20, 받는 피해 -4%'},
  area:{name:'심지',ic:'◎',desc:'공격 범위 +10%'},
  cd:{name:'숨 고르기',ic:'⌛',desc:'공격 간격 -8%'},
  magnet:{name:'끌림',ic:'⊛',desc:'기억 조각 끌어오는 거리 +35%'},
  dur:{name:'질긴 혼',ic:'∞',desc:'지속 시간 +15%'},
  amount:{name:'겹불',ic:'⁂',desc:'쏘는 개수 +1 (두 번 고를 때마다)'},
  luck:{name:'복',ic:gi('p_luck'),desc:'보물·복조리·불씨가 더 자주, 윷이 좋아진다'},
  regen:{name:'정화수',ic:'⚱',desc:'1초마다 체력 0.4 회복'}
};
const EVOS={
  axe:{need:'hp',name:'구조대 도끼',desc:'도끼 여섯 자루가 넓게 돈다'},
  orb:{need:'might',name:'도깨비불 떼',desc:'혼불이 다섯 개씩, 모두 꿰뚫는다'},
  lantern:{need:'area',name:'혼불 등롱',desc:'빛이 아주 넓고 뜨거워진다'},
  hose:{need:'cd',name:'소방 호스',desc:'세 방향으로 쉬지 않고 뿜는다'},
  horn:{need:'speed',name:'클랙슨 폭풍',desc:'사방으로 울린다'},
  salt:{need:'dur',name:'소금 결계',desc:'소금 길로 고리를 닫으면 안쪽이 모두 크게 다친다'},
  beans:{need:'amount',name:'팥죽 솥',desc:'팥이 튕긴 자리마다 붉은 팥죽이 고인다'},
  talis:{need:'magnet',name:'오방 부적',desc:'다섯 갈래로 옮겨 붙는다'},
  shadow:{need:'hp',name:'괴수 그림자',desc:'그림자가 커지고 내 힘을 그대로 쓴다'},
  barcode:{need:'magnet',name:'마감 정산',desc:'표시된 것이 5초마다 한꺼번에 터진다'},
  flute:{need:'dur',name:'잔잔한 바다',desc:'멈춤이 두 배로 길어진다'},
  club:{need:'might',name:'뚝딱 뚝딱',desc:'한 번에 두 가지가 나온다'},
  yut:{need:'luck',name:'윷판 명수',desc:'걸 아래로는 나오지 않는다. 모가 자주 나온다'},
  geumjul:{need:'dur',name:'금줄 울타리',desc:'말뚝이 하나 더, 첫 말뚝과 끝 말뚝이 이어져 닫힌다'},
  jang:{need:'hp',name:'장승 한 쌍',desc:'둘을 세우고, 둘 사이에 붉은 기운이 흐른다'},
  kite:{need:'speed',name:'연싸움',desc:'연이 셋, 더 빠르고 넓게 돈다'},
  top:{need:'cd',name:'팽이 명인',desc:'팽이가 멈추지 않고, 하나 더'},
  mask:{need:'might',name:'탈춤 한마당',desc:'두 번 웃고, 두 배로 오래 겁먹는다'},
  fan:{need:'magnet',name:'바람 부채',desc:'바람이 화면의 모든 조각을 끌어온다'},
  bow:{need:'amount',name:'명궁',desc:'다섯 발을 부채꼴로 쏜다'}
};
const MAXW=6, MAXP=5;
/* v2.25 짝 서브 스킬: 무기마다 짝이 되는 서브 스킬(EVOS.need)이 있다. 짝 서브 1단계마다 그 무기 위력 +8% · 간격 -5%.
   1차 각성: 무기 Lv5 + 짝 서브 보유(예전 그대로) · 2차 각성: 1차 각성 + 짝 서브 5단계 → 위력 ×1.5 · 간격 -20%. 서브 하나가 여러 무기의 짝이 되기도 한다(두꺼운 옷 → 도끼·그림자·장승). */
const PAIR_M=.08, PAIR_C=.05;
const pairLv=k=>(S&&EVOS[k]&&S.P)?Math.min(5,S.P[EVOS[k].need]||0):0;
const ev2=k=>!!(S&&S.evo2&&S.evo2[k]);
const pm=k=>(1+PAIR_M*pairLv(k))*(ev2(k)?1.5:1), pcd=k=>(1-PAIR_C*pairLv(k))*(ev2(k)?.8:1);
const pairsOf=pk=>Object.keys(EVOS).filter(k=>EVOS[k].need===pk);
/* ============ v2.2 기술: 새 무기 8 · 갈래(Lv3) · 조합 7 ============ */
// 갈래: 무기가 Lv3이 될 때 둘 중 하나를 고른다. 고른 갈래에 따라 움직임이 바뀐다.
const BR={
  axe:{a:['회오리','도끼가 하나 늘고 더 빨리 돈다'],b:['부메랑','도끼가 멀리 나갔다가 돌아온다']},
  orb:{a:['터지는 혼불','맞으면 터져 둘레까지 태운다'],b:['갈라지는 혼불','처음 맞힌 뒤 둘로 갈라진다']},
  lantern:{a:['따뜻한 빛','빛 안에 있으면 체력이 차오른다'],b:['서늘한 빛','빛 안의 것들이 가끔 얼어붙는다']},
  hose:{a:['고압 분사','좁고 길게, 더 세게 뿜는다'],b:['물안개','넓게 뿌려 맞은 것을 느리게 한다']},
  horn:{a:['긴 경적','더 멀리, 더 크게 밀어낸다'],b:['빵빵','한 번에 두 번 울린다']},
  salt:{a:['굵은 소금','소금이 더 아프고 넓다'],b:['소금 뿌리기','멈춰 서면 둘레에 소금을 둥글게 뿌린다']},
  beans:{a:['콩알탄','튕길 때마다 더 세진다'],b:['팥 비','하늘에서 팥이 쏟아진다']},
  talis:{a:['불 부적','붙은 것이 두 배로 탄다'],b:['봉인 부적','붙은 것이 느려진다']},
  shadow:{a:['닮은 그림자','그림자가 더 세게 따라 한다'],b:['그림자 밟기','그림자 둘레의 것들이 느려진다']},
  barcode:{a:['할인','표시된 것은 30% 더 다친다'],b:['1+1','표시된 것이 쓰러지면 옆의 하나에 표시가 옮는다']},
  flute:{a:['파도','불 때 둘레의 것들을 밀어낸다'],b:['고요','불 때 체력을 되찾는다']},
  club:{a:['금 나와라','언제나 금이 섞인다'],b:['크게 나와라','언제나 크게 친다']},
  yut:{a:['손맛','좋은 수가 더 잘 나온다'],b:['네 가락','네 가락이 따로 날아가 따로 친다']},
  geumjul:{a:['고추 금줄','줄에 닿은 것이 불탄다'],b:['숯 금줄','줄에 닿은 것이 잠깐 멈춘다']},
  jang:{a:['천하대장군','울림이 더 세다'],b:['지하여장군','더 멀리서 끌어오고 느리게 한다']},
  kite:{a:['유리 연줄','연줄이 훨씬 날카롭다'],b:['쌍연','연이 둘이 된다']},
  top:{a:['쇠팽이','무겁게 부딪혀 멀리 날린다'],b:['불팽이','부딪힌 것에 불을 붙인다']},
  mask:{a:['양반탈','겁먹은 것은 40% 더 다친다'],b:['각시탈','겁먹은 것이 조각을 흘린다']},
  fan:{a:['태극선','바람이 칼날처럼 벤다'],b:['부채춤','사방으로 바람을 일으킨다']},
  bow:{a:['편전','짧은 화살 세 발을 빠르게 쏜다'],b:['명적','우는 화살. 맞은 것이 잠깐 멈춘다']}
};
const FUS={
  singijeon:{a:'bow',b:'orb',name:'신기전',ic:gi('f_singijeon'),desc:'불화살 열두 발이 하늘을 가르고 떨어져 터진다'},
  sea:{a:'salt',b:'hose',name:'바닷물',ic:gi('f_sea'),desc:'짠 물결이 밀려와 모두를 밀어내고 다치게 한다'},
  yutpan:{a:'yut',b:'club',name:'도깨비 윷판',ic:gi('f_yutpan'),desc:'던질 때마다 윷 아니면 모. 한 번 더!'},
  sotdae:{a:'jang',b:'talis',name:'솟대 결계',ic:gi('f_sotdae'),desc:'장승이 울릴 때마다 둘레의 것들에 부적이 붙는다'},
  whirl:{a:'top',b:'fan',name:'회오리바람',ic:gi('f_whirl'),desc:'팽이가 회오리가 되어 둘레의 것들을 빨아들인다'},
  saja:{a:'mask',b:'horn',name:'사자놀음',ic:gi('f_saja'),desc:'경적에도 겁을 먹고, 탈의 웃음이 크게 밀쳐 낸다'},
  aekmak:{a:'kite',b:'geumjul',name:'액막이 연',ic:gi('f_aekmak'),desc:'연줄이 금줄이 되고, 6초마다 연이 끊어져 날아가 터진다'},
  // v2.3 조합 13종 (무기마다 하나 이상)
  rescue:{a:'axe',b:'hose',name:'구조 출동',ic:gi('f_rescue'),char:'fire',desc:'소방관만: 5초마다 물대포가 앞을 길게 쓸고, 도끼가 크게 한 바퀴 돈다'},
  patjuk:{a:'beans',b:'lantern',name:'동지 팥죽',ic:gi('f_patjuk'),desc:'등불 빛 안의 것들에게서 팥알이 저절로 튀어 오른다'},
  talnori:{a:'shadow',b:'mask',name:'그림자 탈놀이',ic:gi('f_talnori'),desc:'그림자도 탈을 쓰고 웃는다. 그림자 둘레의 것들이 겁먹는다'},
  pyojeok:{a:'barcode',b:'bow',name:'표적 사격',ic:gi('f_pyojeok'),desc:'표시가 붙은 것들에게 화살이 저절로 날아간다'},
  janjan:{a:'flute',b:'kite',name:'잔잔한 하늘',ic:gi('f_janjan'),desc:'7초마다 연이 크게 내리꽂혀 둘레를 멈추게 한다'},
  chorong:{a:'lantern',b:'geumjul',name:'청사초롱 길',ic:gi('f_chorong'),desc:'금줄 말뚝마다 초롱이 걸려 둘레를 태운다'},
  namu:{a:'axe',b:'jang',name:'나무꾼 장승',ic:gi('f_namu'),desc:'장승 둘레를 도끼 바람이 돌며 벤다'},
  jeonghwa:{a:'salt',b:'talis',name:'정화 소금',ic:gi('f_jeonghwa'),desc:'소금을 밟은 것에 부적이 저절로 붙는다'},
  patyut:{a:'beans',b:'yut',name:'팥 윷놀이',ic:gi('f_patyut'),desc:'윷이 떨어진 자리에서 팥알이 튀어 나간다'},
  ppang:{a:'horn',b:'top',name:'빵빵 팽이',ic:gi('f_ppang'),desc:'3초마다 경적에 팽이가 다시 힘을 얻어 앞으로 내달린다'},
  gungsu:{a:'shadow',b:'bow',name:'그림자 궁수',ic:gi('f_gungsu'),desc:'그림자가 화살 세 발을 따로 쏜다'},
  jamul:{a:'flute',b:'hose',name:'잔물결',ic:gi('f_jamul'),desc:'4초마다 둘레로 물결이 퍼져 밀어낸다'},
  baram:{a:'fan',b:'orb',name:'바람 혼불',ic:gi('f_baram'),desc:'부채 바람을 타고 혼불이 여럿 날아간다'}
};
const br=k=>S.br[k];
function segDist(px,pz,ax,az,bx,bz){ const vx=bx-ax,vz=bz-az,l2=vx*vx+vz*vz||1; let t=((px-ax)*vx+(pz-az)*vz)/l2; t=Math.max(0,Math.min(1,t)); return Math.hypot(px-(ax+vx*t),pz-(az+vz*t)); }
function hitSeg(ax,az,bx,bz,w,fn){ const mx=(ax+bx)/2,mz=(az+bz)/2,R=Math.hypot(bx-ax,bz-az)/2+w+.8; near(mx,mz,R,e=>{ if(segDist(e.x,e.z,ax,az,bx,bz)<w+e.d.r*.6) fn(e); }); return boss.alive&&!boss.dying&&segDist(boss.x,boss.z,ax,az,bx,bz)<w+.9; }
function areaHit(x,z,R,dmg,fn,kb=0){ near(x,z,R,e=>{ const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz)||1; if(d<R+e.d.r*.5){ if(fn) fn(e); damage(e,dmg,dx/d,dz/d,kb); } }); if(boss.alive&&Math.hypot(boss.x-x,boss.z-z)<R+.9) damageBoss(dmg); }
const luckMul=()=>1+.35*((S&&S.P.luck)||0);
// 윷: 도 개 걸 윷 모
const YUT=['도','개','걸','윷','모'];
function throwYut(ox,oz,s,chain,sh){ const L=S.W.yut, t=nearest(ox,oz,10);
  const tx=t?t.x:ox+S.face.x*4, tz=t?t.z:oz+S.face.z*4;
  if(br('yut')==='b'){ const cand=[]; near(ox,oz,9,e=>{ if(!e.d.treasure) cand.push(e); }); for(let i=0;i<4;i++){ const c=cand.length?cand[Math.floor(Math.random()*cand.length)]:null; S.yuts.push({x0:ox,z0:oz,tx:c?c.x:tx+rr(-1.5,1.5),tz:c?c.z:tz+rr(-1.5,1.5),t:0,dur:.45,x:ox,z:oz,y:0,rot:rr(0,6),solo:true,main:i===0,chain,sh,s:sh?s:null}); } }
  else for(let i=0;i<4;i++) S.yuts.push({x0:ox,z0:oz,tx:tx+rr(-.5,.5),tz:tz+rr(-.5,.5),t:0,dur:.5,x:ox,z:oz,y:0,rot:rr(0,6),main:i===0,chain,sh,s:sh?s:null});
  sfx.yut(); }
function rollYut(){ if(S.fu.yutpan) return Math.random()<.3?5:4;
  let w=[.22,.36,.26,.12,.04]; const lk=(S.P.luck||0)+(br('yut')==='a'?2:0); for(let i=0;i<lk;i++){ w[0]*=.8; w[1]*=.9; w[3]*=1.15; w[4]*=1.35; }
  if(S.evo.yut){ w=[0,0,.5,.3,.2]; } const tot=w.reduce((a,b)=>a+b,0); let r=Math.random()*tot; for(let i=0;i<5;i++){ r-=w[i]; if(r<=0) return i+1; } return 3; }
function landYut(y,s){ const L=S.W.yut; if(S.fu.patyut) fireBeans(y.tx,y.tz,.8,s);
  if(y.solo){ areaHit(y.tx,y.tz,1*s.area,(12+5*L)*s.might,null,3); fx(y.tx,y.tz,1,[1,.85,.5],.25); if(!y.main) return; }
  const n=rollYut(), R=(.9+.32*n)*s.area, dmg=(9+4*L)*n*s.might*(n===5?1.6:1);
  if(!y.solo){ areaHit(y.tx,y.tz,R,dmg,null,n>=4?7:3); fx(y.tx,y.tz,R,n===5?[1,.62,.2]:n===4?[1,.8,.3]:[1,.95,.75],.35); }
  burst(y.tx,.5,y.tz,n*2,2.5); if(n>=4){ if(n===5||(!S.fu.yutpan&&y.chain===0)) toast(YUT[n-1]+'!','한 번 더 던진다'); DBG.shake=Math.max(DBG.shake||0,.3); if(y.chain<3&&!y.sh){ S.yutAgain=.3; S.yutChain=y.chain+1; } } }
// v2.31 그림자 분신이 모든 무기를 따라 쓴다 (기획자 11-17 「그림자는 공격하는 게 맞나?」 → 전엔 20종 중 5종만)
// 그림자 몫(sm) 배율 · 칠 때 보라 고리 + 그림자 몸이 보랏빛으로 번쩍. 땅에 놓는 무기(금줄·장승·팽이)는 그림자도 하나씩 더.
const SHV=[.72,.5,1];
function shFx(x,z,R){ fx(x,z,R,SHV,.25); S.shFl=.3; }
function shadowWeapons(dt,s,P){ DBG.shOn=1; try{ shadowWeapons0(dt,s,P); } finally { DBG.shOn=0; } }
function shadowWeapons0(dt,s,P){ const sm=shadowMult(); if(!sm||!shadowP.root.visible){ shAxesOff(); return; } const W=S.W,E=S.evo,M0=s.might,SP=shadowPos(), s2=Object.assign({},s);
  const m=k=>{ s2.might=M0*pm(k)*sm; return s2.might; };
  // 소방 도끼: 그림자가 둘레를 한 바퀴 벤다
  // v2.34: 그림자 둘레를 보랏빛 도끼가 실제로 돈다(내 도끼와 같은 수·반경, 반대쪽에서 출발) · 세기는 그림자 몫
  if(W.axe){ const n=Math.min(6,(E.axe?6:[1,2,2,3,4][W.axe-1])+(br('axe')==='a'?1:0)), R=(E.axe?2.3:1.7)*s.area, D=(12+5*W.axe)*m('axe')*(E.axe?1.4:1)*(W.axe>=3?1.2:1);
    S.shAxeA=(S.shAxeA||0)+dt*(E.axe?3.6:3.2);
    for(let i=0;i<SHAXES.length;i++){ const A=SHAXES[i]; if(i>=n){ A.g.visible=false; continue; }
      const a=S.shAxeA+Math.PI+i/n*6.28, x=SP.x+Math.cos(a)*R, z=SP.z+Math.sin(a)*R*.85; A.g.visible=true; A.g.position.set(x,.55,z); A.m.rotation.z=-S.shAxeA*5; A.g.scale.setScalar(E.axe?1.25:1);
      near(x,z,.75,e=>{ const dd=Math.hypot(e.x-x,e.z-z); if(dd>.55+e.d.r) return; const last=e.hitCd.get(A)||0; if(S.t-last<.4) return; e.hitCd.set(A,S.t);
        const kx=e.x-SP.x,kz=e.z-SP.z,kl=Math.hypot(kx,kz)||1; damage(e,D,kx/kl,kz/kl,3); S.shFl=.15; });
      if(boss.alive&&Math.hypot(boss.x-x,boss.z-z)<1.3){ boss.shAxeHit=boss.shAxeHit||[]; const last=boss.shAxeHit[i]||0; if(S.t-last>.4){ boss.shAxeHit[i]=S.t; damageBoss(D,'shaxe'); } } } }
  else shAxesOff();
  // 물줄기: 가까운 괴수 쪽으로 짧게 뿜는다
  if(W.hose&&ready('sh_hose',dt,(E.hose?1.2:2.1-.17*W.hose)*s.cd)){ const f=aimFrom(SP.x,SP.z), R=(3+.4*W.hose)*s.area, dmg=(22+11*W.hose)*m('hose')*.12;
    near(SP.x+f.x*R*.5,SP.z+f.z*R*.5,R*.6,e=>{ const ex=e.x-SP.x,ez=e.z-SP.z,d=Math.hypot(ex,ez)||1; if(d>R+e.d.r) return; if((ex*f.x+ez*f.z)/d<.75) return; damage(e,dmg,f.x,f.z,4); });
    if(boss.alive&&Math.hypot(boss.x-SP.x,boss.z-SP.z)<R+1) damageBoss(dmg);
    for(let k=0;k<6;k++){ const w=water.items[waterI=(waterI+1)%water.n], aa=Math.atan2(f.z,f.x)+rr(-.3,.3), v=rr(6,9)*R/4; w.life=R/v; w.x=SP.x; w.z=SP.z; w.y=.9; w.vx=Math.cos(aa)*v; w.vz=Math.sin(aa)*v; w.vy=rr(-.3,.6); }
    shFx(SP.x+f.x*R*.5,SP.z+f.z*R*.5,R*.5); }
  // 소금 길: 그림자도 소금을 흘린다
  if(W.salt){ S.shSD=(S.shSD||0)+dt; if(S.shSD>.5&&Math.hypot(SP.x-(S.shSx||0),SP.z-(S.shSz||0))>.4){ S.shSD=0; S.shSx=SP.x; S.shSz=SP.z; salts.push({x:SP.x,z:SP.z,t:0,life:(3.5+.6*W.salt)*s.dur,r:.5*s.area,m:sm}); if(salts.length>260) salts.shift(); } }
  // 부적: 그림자도 몇 장 붙인다
  if(W.talis&&ready('sh_talis',dt,(2.3-.2*W.talis)*s.cd*2.2)){ const n=Math.max(1,Math.round(((W.talis>=4?2:1)+s.amount)*sm*.5)), cand=[]; near(SP.x,SP.z,6,e=>{ if(!e.talis&&!e.d.treasure) cand.push(e); });
    for(let i=0;i<n&&cand.length;i++){ const e=cand.splice(Math.floor(Math.random()*cand.length),1)[0]; e.talis={gen:0}; fx(e.x,e.z,.5,SHV,.2); } if(n) S.shFl=.3; }
  // 만파식적: 그림자 둘레만 잠깐 멈춘다
  if(W.flute&&ready('sh_flute',dt,(11-.8*W.flute)*s.cd*1.3)){ const R=spawnR()*.45, dur=(1+.25*W.flute)*s.dur*sm; for(const e of enemies){ if(Math.hypot(e.x-SP.x,e.z-SP.z)<R) e.freeze=Math.max(e.freeze,dur); } shFx(SP.x,SP.z,R); }
  // 도깨비 방망이: 그림자가 앞을 내리친다
  if(W.club&&ready('sh_club',dt,(1.7-.12*W.club)*s.cd)){ const f=aimFrom(SP.x,SP.z), R=(1.9+.15*W.club)*s.area, cx=SP.x+f.x*R*.45, cz=SP.z+f.z*R*.45; areaHit(cx,cz,R*.55,(14+6*W.club)*m('club')*.5,null,3); fx(cx,cz,R*.55,SHV,.22,Math.atan2(f.z,f.x)); S.shFl=.3; }
  // 윷가락: 그림자도 던진다(한 번 더 던지기는 없음)
  if(W.yut&&ready('sh_yut',dt,(2.7-.15*W.yut)*s.cd*1.15)){ m('yut'); throwYut(SP.x,SP.z,s2,9,sm); S.shFl=.3; }
  // 금줄: 그림자 말뚝 줄(따로 셋까지)
  if(W.geumjul){ const L=W.geumjul; S.shPosts=S.shPosts||[]; if(ready('sh_gj',dt,(2.3-.15*L)*s.cd*1.3)){ S.shPosts.push({x:SP.x,z:SP.z,t:0,life:(5+.6*L)*s.dur}); while(S.shPosts.length>3) S.shPosts.shift(); }
    for(let i=S.shPosts.length-1;i>=0;i--){ const q=S.shPosts[i]; q.t+=dt; if(q.t>q.life) S.shPosts.splice(i,1); }
    S.shSegs=[]; for(let i=1;i<S.shPosts.length;i++) S.shSegs.push([S.shPosts[i-1],S.shPosts[i]]); if(S.shPosts.length) S.shSegs.push([S.shPosts[S.shPosts.length-1],{x:SP.x,z:SP.z}]);
    S.shGjT=(S.shGjT||0)-dt; if(S.shGjT<=0){ S.shGjT=.25; const dmg=(7+4*L)*m('geumjul'); let bh=false; for(const [a,b] of S.shSegs) if(hitSeg(a.x,a.z,b.x,b.z,.35,e=>{ damage(e,dmg); e.slow=Math.min(e.slow,.5); })) bh=true; if(bh) damageBoss(dmg*.8); } } else { S.shPosts=null; S.shSegs=null; }
  // 장승: 그림자 장승 하나 더
  if(W.jang&&!S.jangs.some(J=>J.sh)&&ready('sh_jang',dt,(6.5-.5*W.jang)*s.cd*1.2)){ const f=S.face, J=mkJang(SP.x-f.x*1.6,SP.z-f.z*1.6,W.jang,s); J.sh=sm; S.jangs.push(J); shFx(J.x,J.z,1.4); }
  // 방패연: 그림자 연 하나
  if(W.kite){ const L=W.kite, R=(2.6+.25*L)*s.area; S.shKA=(S.shKA||0)+dt*(1.2+.1*L); const k={x:SP.x+Math.cos(-S.shKA)*R,z:SP.z+Math.sin(-S.shKA)*R*.85}; S.shKite=k;
    S.shKT=(S.shKT||0)-dt; if(S.shKT<=0){ S.shKT=.25; if(hitSeg(SP.x,SP.z,k.x,k.z,.25,e=>damage(e,(6+3*L)*m('kite')*.5))) damageBoss((6+3*L)*s2.might*.3); areaHit(k.x,k.z,.8,(10+5*L)*s2.might*.5,null,4); } } else S.shKite=null;
  // 팽이: 그림자 팽이 하나 더
  if(W.top&&!S.tops.some(q=>q.sh)&&ready('sh_top',dt,(3-.2*W.top)*s.cd*1.3)){ const a=rr(0,6.28); S.tops.push({x:SP.x,z:SP.z,vx:Math.cos(a)*5,vz:Math.sin(a)*5,en:1,t:0,sh:sm}); S.shFl=.3; }
  // 하회탈: 그림자 웃음(탈놀이 조합이 있으면 그쪽이 한다)
  if(W.mask&&!S.fu.talnori&&ready('sh_mask',dt,(6.5-.4*W.mask)*s.cd*1.2)){ const L=W.mask, R=(3+.3*L)*s.area*.7, t=(1.4+.15*L)*sm, dmg=(8+4*L)*m('mask');
    near(SP.x,SP.z,R,e=>{ const dx=e.x-SP.x,dz=e.z-SP.z,d=Math.hypot(dx,dz)||1; if(d>R+e.d.r) return; e.fear=Math.max(e.fear||0,t); damage(e,dmg,dx/d,dz/d,3); }); shFx(SP.x,SP.z,R); }
  // 합죽선: 그림자 부채질
  if(W.fan&&ready('sh_fan',dt,(2.8-.2*W.fan)*s.cd)){ const L=W.fan, f=aimFrom(SP.x,SP.z), R=(3.4+.3*L)*s.area*.7, dmg=(6+3*L)*m('fan')*.6;
    near(SP.x,SP.z,R,e=>{ const ex=e.x-SP.x,ez=e.z-SP.z,d=Math.hypot(ex,ez)||1; if(d>R+e.d.r) return; if((ex*f.x+ez*f.z)/d<.45) return; damage(e,dmg,ex/d,ez/d,e.d.treasure?2:10); }); fx(SP.x,SP.z,R,SHV,.3,Math.atan2(f.z,f.x)); S.shFl=.3; }
  // 각궁: 그림자 화살(그림자 궁수 조합이 있으면 그쪽이 한다)
  if(W.bow&&!S.fu.gungsu&&ready('sh_bow',dt,(1.8-.12*W.bow)*s.cd)){ const f=aimFrom(SP.x,SP.z), a=Math.atan2(f.z,f.x); S.arrows.push({x:SP.x,z:SP.z,vx:Math.cos(a)*18,vz:Math.sin(a)*18,life:13/18,dmg:(16+7*W.bow)*m('bow'),hit:new Set(),a,sh:1}); S.shFl=.3; }
  s.might=M0;
}
function weapons2(dt,s,P){ const M0=s.might;
  const W=S.W,E=S.evo,F=S.fu;
  // 윷가락
  s.might=M0*pm('yut');
  if(W.yut&&ready('yut',dt,(2.7-.15*W.yut)*s.cd)) throwYut(P.x,P.z,s,0);
  if(S.yutAgain>0){ S.yutAgain-=dt; if(S.yutAgain<=0) throwYut(P.x,P.z,s,S.yutChain); }
  for(let i=S.yuts.length-1;i>=0;i--){ const y=S.yuts[i]; y.t+=dt; const k=Math.min(1,y.t/y.dur); y.x=y.x0+(y.tx-y.x0)*k; y.z=y.z0+(y.tz-y.z0)*k; y.y=.2+Math.sin(k*Math.PI)*2.4; y.rot+=dt*14;
    if(k>=1){ S.yuts.splice(i,1); if(y.main||y.solo) landYut(y,y.s||s); } }
  // 금줄: 말뚝을 박고 줄을 잇는다. 줄을 넘는 것은 다친다
  s.might=M0*pm('geumjul');
  if(W.geumjul){ const L=W.geumjul;
    if(ready('geumjul',dt,(2.3-.15*L)*s.cd)){ S.posts.push({x:P.x,z:P.z,t:0,life:(5+.6*L)*s.dur}); const mx=3+(L>=4?1:0)+(E.geumjul?1:0); while(S.posts.length>mx) S.posts.shift(); sfx.salt(); }
    for(let i=S.posts.length-1;i>=0;i--){ const q=S.posts[i]; q.t+=dt; if(q.t>q.life) S.posts.splice(i,1); }
    S.segs=[]; for(let i=1;i<S.posts.length;i++) S.segs.push([S.posts[i-1],S.posts[i]]);
    if(S.posts.length) S.segs.push([S.posts[S.posts.length-1],{x:P.x,z:P.z}]);
    if(E.geumjul&&S.posts.length>=3) S.segs.push([S.posts[0],S.posts[S.posts.length-1]]);
    S.gjT=(S.gjT||0)-dt; if(S.gjT<=0){ S.gjT=.25; const dmg=(7+4*L)*s.might*(br('geumjul')==='a'?1.4:1)*(F.aekmak?1.5:1); let bh=false;
      for(const [a,b] of S.segs){ if(hitSeg(a.x,a.z,b.x,b.z,.35,e=>{ damage(e,dmg); e.slow=Math.min(e.slow,.5); if(br('geumjul')==='a') e.burn=Math.max(e.burn,1.2); if(br('geumjul')==='b'&&S.t-(e.hitCd.get('char')||0)>2){ e.hitCd.set('char',S.t); e.freeze=Math.max(e.freeze,.5); } })) bh=true; }
      if(bh) damageBoss(dmg*.8); } } else S.segs=null;
  // 장승: 세워 두면 괴수가 끌려온다
  s.might=M0*pm('jang');
  if(W.jang){ const L=W.jang, mx=E.jang?2:1;
    if(S.jangs.filter(J=>!J.sh).length<mx&&ready('jang',dt,(6.5-.5*L)*s.cd)){ const f=S.face;
      if(E.jang){ const px=-f.z,pz=f.x; S.jangs.push(mkJang(P.x+f.x*2+px*2.2,P.z+f.z*2+pz*2.2,L,s),mkJang(P.x+f.x*2-px*2.2,P.z+f.z*2-pz*2.2,L,s)); }
      else S.jangs.push(mkJang(P.x+f.x*2.4,P.z+f.z*2.4,L,s)); sfx.jang(); }
    for(let i=S.jangs.length-1;i>=0;i--){ const J=S.jangs[i]; J.t+=dt; if(J.t>J.life){ S.jangs.splice(i,1); fx(J.x,J.z,1.5,[.8,.5,.3],.3); continue; }
      J.pt-=dt; if(J.pt<=0){ J.pt=.8; const R=(1.8+.15*L)*s.area; areaHit(J.x,J.z,R,(10+5*L)*s.might*(J.sh||1)*(br('jang')==='a'?1.5:1),e=>{ if(F.sotdae&&!e.talis&&!e.d.treasure) e.talis={gen:0}; },2); fx(J.x,J.z,R,[1,.62,.22],.3); }
      if(br('jang')==='b') near(J.x,J.z,J.R,e=>{ e.slow=Math.min(e.slow,.6); }); }
    if(E.jang&&S.jangs.filter(J=>!J.sh).length===2){ S.jjT=(S.jjT||0)-dt; if(S.jjT<=0){ S.jjT=.3; const [a,b]=S.jangs.filter(J=>!J.sh); if(hitSeg(a.x,a.z,b.x,b.z,.4,e=>damage(e,(8+3*L)*s.might))) damageBoss((8+3*L)*s.might); } } }
  // 방패연: 연과 연줄이 벤다
  s.might=M0*pm('kite');
  if(W.kite){ const L=W.kite, n=E.kite?3:br('kite')==='b'?2:1, R=(3.2+.3*L)*s.area*(E.kite?1.3:1);
    S.kiteA=(S.kiteA||0)+dt*(1.1+.1*L)*(E.kite?1.5:1); S.kites.length=0;
    for(let i=0;i<n;i++){ const a=S.kiteA+i/n*6.28; S.kites.push({x:P.x+Math.cos(a)*R,z:P.z+Math.sin(a)*R*.85}); }
    S.kT=(S.kT||0)-dt; if(S.kT<=0){ S.kT=.25; const sd=(6+3*L)*s.might*(br('kite')==='a'?1.7:1)*(F.aekmak?2:1), bd=(10+5*L)*s.might*(E.kite?1.6:1);
      for(const k of S.kites){ if(hitSeg(P.x,P.z,k.x,k.z,.25,e=>{ damage(e,sd); if(F.aekmak) e.slow=Math.min(e.slow,.5); })) damageBoss(sd*.6); areaHit(k.x,k.z,.8,bd,null,4); } }
    if(F.aekmak&&ready('aekmak',dt,6)){ const k=S.kites[0]; areaHit(k.x,k.z,3.5*s.area,120*s.might,null,10); fx(k.x,k.z,3.5,[1,.7,.25],.5); burst(k.x,2.4,k.z,18,4); DBG.shake=Math.max(DBG.shake||0,.5); toast('액막이','액(厄)을 실어 날려 보냈다'); sfx.boom(); } }
  // 팽이: 채찍으로 치면 다시 돈다
  s.might=M0*pm('top');
  if(W.top){ const L=W.top, mx=1+(L>=3?1:0)+(L>=5?1:0)+(E.top?1:0)+s.amount;
    if(S.tops.filter(q=>!q.sh).length<mx&&ready('top',dt,(3-.2*L)*s.cd)){ const a=rr(0,6.28); S.tops.push({x:P.x,z:P.z,vx:Math.cos(a)*5,vz:Math.sin(a)*5,en:1,t:0}); sfx.whip(); }
    for(let i=S.tops.length-1;i>=0;i--){ const q=S.tops[i]; q.t+=dt; if(!E.top) q.en-=dt/(5.5*s.dur); if(q.en<=0){ S.tops.splice(i,1); burst(q.x,.4,q.z,4); continue; }
      if(Math.hypot(P.x-q.x,P.z-q.z)<.85&&q.t>.6){ q.en=1; q.t=0; const a=Math.atan2(q.z-P.z,q.x-P.x); q.vx=Math.cos(a)*9; q.vz=Math.sin(a)*9; sfx.whip(); fx(q.x,q.z,.8,[1,.9,.5],.2); }
      const tg=nearest(q.x,q.z,6), sp=3+2.5*q.en; if(tg){ const dx=tg.x-q.x,dz=tg.z-q.z,l=Math.hypot(dx,dz)||1; q.vx+=(dx/l*sp-q.vx)*Math.min(1,dt*2.5); q.vz+=(dz/l*sp-q.vz)*Math.min(1,dt*2.5); }
      q.x+=q.vx*dt; q.z+=q.vz*dt; const dP=Math.hypot(q.x-P.x,q.z-P.z); if(dP>9){ q.vx+=(P.x-q.x)/dP*dt*12; q.vz+=(P.z-q.z)/dP*dt*12; }
      const rad=F.whirl?1.1:.5, dmg=(8+4*L)*s.might*(q.sh||1)*(.5+.5*q.en)*(br('top')==='a'?1.2:1);
      if(F.whirl) near(q.x,q.z,2.4,e=>{ if(e.d.treasure) return; const dx=q.x-e.x,dz=q.z-e.z,l=Math.hypot(dx,dz)||1; e.x+=dx/l*dt*3; e.z+=dz/l*dt*3; });
      near(q.x,q.z,rad+.8,e=>{ if(Math.hypot(e.x-q.x,e.z-q.z)>rad+e.d.r) return; const last=e.hitCd.get(q)||0; if(S.t-last<.35) return; e.hitCd.set(q,S.t); const dx=e.x-q.x,dz=e.z-q.z,l=Math.hypot(dx,dz)||1; damage(e,dmg,dx/l,dz/l,br('top')==='a'?6:2); if(br('top')==='b') e.burn=Math.max(e.burn,1.5); });
      if(boss.alive&&Math.hypot(boss.x-q.x,boss.z-q.z)<rad+.9&&S.t-(q.bh||0)>.35){ q.bh=S.t; damageBoss(dmg); } } }
  // 하회탈: 웃음소리에 겁을 먹고 달아난다
  s.might=M0*pm('mask');
  if(W.mask){ const L=W.mask; if(ready('mask',dt,(6.5-.4*L)*s.cd)){ laugh(L,s); if(E.mask) S.maskAgain=.6; }
    if(S.maskAgain>0){ S.maskAgain-=dt; if(S.maskAgain<=0) laugh(L,s); } }
  // 합죽선: 바람으로 밀어내고 조각을 끌어온다
  s.might=M0*pm('fan');
  if(S.maskPop>0) S.maskPop-=dt; if(S.fanPop>0) S.fanPop-=dt;
  if(W.fan&&ready('fan',dt,(2.8-.2*W.fan)*s.cd)){ S.fanPop=.45; const L=W.fan, f=player.moving?S.face:aimFrom(P.x,P.z), R=(3.4+.3*L)*s.area, _ev=evoEv('fan',P.x,P.z,(3.4+.3*L)*s.area), half=br('fan')==='b'?Math.PI:1.1, dmg=(6+3*L)*s.might*(br('fan')==='a'?1.9:1);
    near(P.x,P.z,R,e=>{ const ex=e.x-P.x,ez=e.z-P.z,d=Math.hypot(ex,ez)||1; if(d>R+e.d.r) return; if(half<3&&Math.acos(Math.max(-1,Math.min(1,(ex*f.x+ez*f.z)/d)))>half) return; damage(e,dmg,ex/d,ez/d,br('fan')==='a'?8:e.d.treasure?2:14); });
    if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<R+1) damageBoss(dmg);
    for(const g of gems) if(E.fan||Math.hypot(g.x-P.x,g.z-P.z)<8) g.pull=true;
    fx(P.x,P.z,R,[.75,.95,1],.3,Math.atan2(f.z,f.x)); burst(P.x+f.x,1,P.z+f.z,6,4); sfx.wind(); }
  // 각궁
  s.might=M0*pm('bow');
  if(W.bow&&ready('bow',dt,(1.8-.12*W.bow)*s.cd)){ const L=W.bow, f=aimFrom(P.x,P.z), a0=Math.atan2(f.z,f.x), dmg=(16+7*L)*s.might;
    const shoot=(a,d,spd=18)=>S.arrows.push({x:P.x,z:P.z,vx:Math.cos(a)*spd,vz:Math.sin(a)*spd,life:13/spd,dmg:d,hit:new Set(),a});
    if(E.bow){ for(let i=-2;i<=2;i++) shoot(a0+i*.13,dmg); }
    else if(br('bow')==='a'){ for(let i=0;i<3;i++) S.arrowQ.push({t:i*.09,a:a0+rr(-.04,.04),d:dmg*.65}); }
    else { shoot(a0,dmg); if(L>=4) shoot(a0+.12,dmg); } sfx.bow(); }
  for(let i=S.arrowQ.length-1;i>=0;i--){ const q=S.arrowQ[i]; q.t-=dt; if(q.t<=0){ S.arrows.push({x:P.x,z:P.z,vx:Math.cos(q.a)*24,vz:Math.sin(q.a)*24,life:.5,dmg:q.d,hit:new Set(),a:q.a}); S.arrowQ.splice(i,1); } }
  for(let i=S.arrows.length-1;i>=0;i--){ const q=S.arrows[i]; q.life-=dt; q.x+=q.vx*dt; q.z+=q.vz*dt; if(q.life<=0){ S.arrows.splice(i,1); continue; }
    near(q.x,q.z,.9,e=>{ if(q.hit.has(e)||Math.hypot(e.x-q.x,e.z-q.z)>.35+e.d.r) return; q.hit.add(e); damage(e,q.dmg,q.vx*.03,q.vz*.03,1.5); if(br('bow')==='b') e.freeze=Math.max(e.freeze,.5); });
    if(boss.alive&&!q.hit.has(boss)&&Math.hypot(boss.x-q.x,boss.z-q.z)<1.1){ q.hit.add(boss); damageBoss(q.dmg); } }
  s.might=M0;
  // 조합: 신기전
  if(F.singijeon&&ready('singijeon',dt,4.5)){ const cand=[]; near(P.x,P.z,11,e=>{ if(!e.d.treasure) cand.push(e); }); if(boss.alive) cand.push(boss);
    for(let i=0;i<12;i++){ const c=cand.length?cand[Math.floor(Math.random()*cand.length)]:null; S.rockets.push({x0:P.x,z0:P.z,tx:c?c.x+rr(-.6,.6):P.x+rr(-6,6),tz:c?c.z+rr(-.6,.6):P.z+rr(-6,6),t:-i*.06,dur:.75}); } sfx.boom(); }
  for(let i=S.rockets.length-1;i>=0;i--){ const r=S.rockets[i]; r.t+=dt; if(r.t<0) continue; const k=Math.min(1,r.t/r.dur); r.x=r.x0+(r.tx-r.x0)*k; r.z=r.z0+(r.tz-r.z0)*k; r.y=.8+Math.sin(k*Math.PI)*3.5;
    if(k>=1){ S.rockets.splice(i,1); areaHit(r.tx,r.tz,1.4*s.area,45*s.might,e=>{ e.burn=Math.max(e.burn,2); },4); fx(r.tx,r.tz,1.4,[1,.55,.2],.3); burst(r.tx,.5,r.tz,4,3); } }
  // 조합: 바닷물
  if(F.sea&&ready('sea',dt,5)){ S.waves.push({x:P.x,z:P.z,r:.5,max:7*s.area,hit:new Set()}); sfx.splash(); }
  for(let i=S.waves.length-1;i>=0;i--){ const w=S.waves[i]; w.r+=dt*8; if(w.r>w.max){ S.waves.splice(i,1); continue; }
    near(w.x,w.z,w.r+.8,e=>{ if(w.hit.has(e)) return; const dx=e.x-w.x,dz=e.z-w.z,d=Math.hypot(dx,dz)||1; if(Math.abs(d-w.r)<.7+e.d.r){ w.hit.add(e); damage(e,30*s.might,dx/d,dz/d,7); e.slow=.3; } });
    if(boss.alive&&!w.hit.has(boss)&&Math.abs(Math.hypot(boss.x-w.x,boss.z-w.z)-w.r)<1.2){ w.hit.add(boss); damageBoss(30*s.might); } }
}
function fusions2(dt,s,P){ const F=S.fu; if(!F) return; const f=S.face||{x:0,z:1};
  if(F.rescue&&ready('rescue',dt,5)){ const ex=P.x+f.x*9, ez=P.z+f.z*9; if(hitSeg(P.x,P.z,ex,ez,.9,e=>damage(e,60*s.might,f.x,f.z,9))) damageBoss(60*s.might);
    for(let i=1;i<=6;i++) fx(P.x+f.x*i*1.5,P.z+f.z*i*1.5,.9,[.5,.8,1],.35); areaHit(P.x,P.z,3.2*s.area,40*s.might,null,5); fx(P.x,P.z,3.2,[1,.6,.4],.3); sfx.splash(); }
  if(F.patjuk&&ready('patjuk',dt,1.4)){ const R=Math.max(3.5,lanternL.R*.6); let n=0; near(P.x,P.z,R,e=>{ if(n<3&&!e.d.treasure&&Math.random()<.4){ n++; fireBeans(e.x,e.z,.6,s); e.burn=Math.max(e.burn,1); } }); }
  if(F.talnori&&shadowP.root.visible&&ready('talnori',dt,6)){ const q=shadowPos(), R=3.2*s.area; near(q.x,q.z,R,e=>{ const dx=e.x-q.x,dz=e.z-q.z,d=Math.hypot(dx,dz)||1; if(d>R+e.d.r) return; e.fear=Math.max(e.fear||0,2); damage(e,20*s.might,dx/d,dz/d,4); }); fx(q.x,q.z,R,[.7,.6,1],.4); S.maskPop=.8; sfx.laugh(); }
  if(F.pyojeok&&ready('pyojeok',dt,2.5)){ let n=0; for(const e of enemies){ if(n>=6) break; if(e.dead||!e.mark) continue; const a=Math.atan2(e.z-P.z,e.x-P.x); S.arrows.push({x:P.x,z:P.z,vx:Math.cos(a)*22,vz:Math.sin(a)*22,life:.7,dmg:30*s.might,hit:new Set(),a}); n++; } if(n) sfx.bow(); }
  if(F.janjan&&S.kites.length&&ready('janjan',dt,7)){ for(const k of S.kites){ areaHit(k.x,k.z,2.5*s.area,50*s.might,e=>{ e.freeze=Math.max(e.freeze,.7); },5); fx(k.x,k.z,2.5,[.8,.95,1],.4); burst(k.x,2,k.z,10,3); } DBG.shake=Math.max(DBG.shake||0,.3); sfx.wind(); }
  if(F.chorong&&S.posts.length&&ready('chorong',dt,1)){ for(const q of S.posts){ areaHit(q.x,q.z,1.6*s.area,12*s.might,e=>{ e.burn=Math.max(e.burn,1.2); }); fx(q.x,q.z,1.6,[1,.7,.35],.25); } }
  if(F.namu&&S.jangs.length&&ready('namu',dt,.5)){ for(const J of S.jangs){ areaHit(J.x,J.z,2.4*s.area,14*s.might,null,2); fx(J.x,J.z,2.4,[.9,.85,.7],.2,S.t*6); } }
  if(F.jeonghwa&&ready('jeonghwa',dt,1)){ let n=0; for(let i=salts.length-1;i>=0&&i>salts.length-60&&n<6;i--){ const q=salts[i]; near(q.x,q.z,.9,e=>{ if(n<6&&!e.talis&&!e.d.treasure){ e.talis={gen:0}; n++; } }); } }
  if(F.ppang&&S.tops.length&&ready('ppang',dt,3)){ for(const q of S.tops){ q.en=1; q.t=0; const tg=nearest(q.x,q.z,10)||{x:q.x+f.x*5,z:q.z+f.z*5}; const a=Math.atan2(tg.z-q.z,tg.x-q.x); q.vx=Math.cos(a)*11; q.vz=Math.sin(a)*11; fx(q.x,q.z,1,[1,.9,.5],.2); } }
  if(F.gungsu&&shadowP.root.visible&&ready('gungsu',dt,1.6)){ const q=shadowPos(), t=aimFrom(q.x,q.z), a0=Math.atan2(t.z,t.x); for(let i=-1;i<=1;i++){ const a=a0+i*.15; S.arrows.push({x:q.x,z:q.z,vx:Math.cos(a)*20,vz:Math.sin(a)*20,life:.65,dmg:22*s.might,hit:new Set(),a}); } }
  if(F.jamul&&ready('jamul',dt,4)){ S.waves.push({x:P.x,z:P.z,r:.5,max:5*s.area,hit:new Set()}); }
  if(F.baram&&ready('baram',dt,3)){ fireOrb(P.x,P.z,1,s); fireOrb(P.x,P.z,1,s); }
}
function mkJang(x,z,L,s){ return {x,z,t:0,life:(7+.4*L)*s.dur,pt:.3,R:(4.5+.3*L)*(br('jang')==='b'?1.4:1)}; }
function laugh(L,s){ S.maskPop=.8; const P=player.root.position, R=(3+.3*L)*s.area*(S.fu.saja?1.2:1), t=(1.4+.15*L)*(S.evo.mask?2:1), dmg=(8+4*L)*s.might*(S.fu.saja?2:1); evoEv('mask',P.x,P.z,R);
  near(P.x,P.z,R,e=>{ const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz)||1; if(d>R+e.d.r) return; e.fear=Math.max(e.fear||0,t); damage(e,dmg,dx/d,dz/d,S.fu.saja?10:3); if(br('mask')==='b'&&!e.d.treasure&&Math.random()<.25) dropGem(e.x,e.z,1,false); });
  if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<R+1) damageBoss(dmg);
  fx(P.x,P.z,R,[1,.85,.4],.4); sfx.laugh(); }
function drawSkills2(t){
  if(!S||!S.yuts||S.phase==='hub') { [yutB,totemB,postB,kiteB,topB,arrowB,ropeB,pepperB,waveB,rocketB,popMaskB,popFanB].forEach(b=>{ b.begin(); b.end(); }); return; }
  [yutB,totemB,postB,kiteB,topB,arrowB,ropeB,pepperB,waveB,rocketB,popMaskB,popFanB].forEach(b=>b.begin());
  for(const y of S.yuts) yutB.push(y.x,y.y,y.z,1,1,y.sh?.75:1,y.sh?.55:1,1,y.rot);
  for(const r of S.rockets) if(r.t>=0){ rocketB.push(r.x,r.y,r.z,1,1,1,.55,.2); }
  for(const J of S.jangs){ const k=Math.min(1,J.t*4); totemB.push(J.x,0,J.z,1,k,J.sh?.7:1,J.sh?.5:1,1); }
  if(S.segs){ let c=0; for(const [a,b] of S.segs){ const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.max(1,Math.floor(L/.4)); for(let i=0;i<=n;i++){ const k=i/n, x=a.x+(b.x-a.x)*k, z=a.z+(b.z-a.z)*k, sag=.75-Math.sin(k*Math.PI)*.25;
      if(c++%4===2) pepperB.push(x,sag-.35,z,1,1,1,1,1); else ropeB.push(x,sag,z,1,1,1,1,1); } }
    for(const q of S.posts) postB.push(q.x,0,q.z,1,1,1,1,1); }
  if(S.shSegs){ for(const [a,b] of S.shSegs){ const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.max(2,Math.ceil(L/.5)); for(let i=1;i<n;i++){ const f=i/n; ropeB.push(a.x+(b.x-a.x)*f,.75-Math.sin(f*Math.PI)*.15,a.z+(b.z-a.z)*f,.45,.45,.7,.5,1); } } for(const q of S.shPosts||[]) postB.push(q.x,0,q.z,1,1,.7,.5,1); }
  const P=player.root.position;
  if(S.maskPop>0){ const k=S.maskPop/.8, sc=.6+.6*(1-k)*(k>.5?1:1); popMaskB.push(P.x,2.5+.3*(1-k),P.z,sc,sc,1,1,1,Math.sin(t*20)*.08*k); }
  if(S.fanPop>0){ const f=S.face||{x:0,z:1}, k=S.fanPop/.45; popFanB.push(P.x+f.x*.9,1.2,P.z+f.z*.9,.7+.4*(1-k),.7+.4*(1-k),1,1,1,(f.x>0?-1:1)*.6*(1-k)); }
  for(const k of S.kites){ const y=2.4+Math.sin(t*3+k.x)*.2; kiteB.push(k.x,y,k.z,1,1,1,1,1,Math.sin(t*2)*.2); const n=10; for(let i=1;i<n;i++){ const f=i/n; ropeB.push(P.x+(k.x-P.x)*f,1+(y-1)*f-Math.sin(f*Math.PI)*.3,P.z+(k.z-P.z)*f,.45,.45,1,1,1); } }
  if(S.shKite){ const k=S.shKite, SP=shadowPos(), y=2.2+Math.sin(t*3+k.z)*.2; kiteB.push(k.x,y,k.z,.85,.85,.72,.5,1,Math.sin(t*2)*.2); for(let i=1;i<10;i++){ const f=i/10; ropeB.push(SP.x+(k.x-SP.x)*f,1+(y-1)*f-Math.sin(f*Math.PI)*.3,SP.z+(k.z-SP.z)*f,.45,.45,.7,.5,1); } }
  for(const q of S.tops){ const w=Math.sin(t*40)*.15; topB.push(q.x,0,q.z,1+w,1,q.sh?.72:1,q.sh?.5:.9+.1*q.en,q.sh?1:.9+.1*q.en); if(S.fu.whirl) waveB.push(q.x,.08,q.z,2.6,2.6,.5,.7,.9); }
  for(const q of S.arrows) arrowB.push(q.x,.9,q.z,1,1,q.sh?.72:1,q.sh?.5:1,1,-q.a);
  for(const w of S.waves){ const a=1-w.r/w.max; waveB.push(w.x,.1,w.z,w.r*2.2,w.r*2.2,.3*a+.1,.7*a+.1,a); }
  [yutB,totemB,postB,kiteB,topB,arrowB,ropeB,pepperB,waveB,rocketB,popMaskB,popFanB].forEach(b=>b.end());
}

// v2.53 (기획자 11-19 · 65번 1장): 레벨업 때 스치는 것 = 누구 것인지 모를 흐릿한 감각 조각(빛·냄새·소리). 사람·장소 흔적 없음
const MEMORIES=['흐린 주황빛이 잠깐 번진다.','비 냄새가 스친다.','멀리서 낮은 울림이 들린다.','미지근한 김이 손끝에 닿는다.','눈부신 흰빛이 한 번 깜빡인다.','달큰한 냄새가 났다가 사라진다.','쇠 냄새가 난다.','무언가 똑, 똑 떨어지는 소리.','푸른 빛이 아른거린다.','젖은 흙냄새.','바람이 웅웅 우는 소리.','따뜻한 빛이 등에 닿았다가 식는다.','종이 스치는 소리.','타는 냄새가 아주 옅게 난다.','물결 소리 같은 것이 들린다.','차가운 빛이 길게 늘어진다.'];
const memNext=()=>{ if(!S) return MEMORIES[0]; S.memI=((S.memI||0)+1)%MEMORIES.length; return MEMORIES[S.memI]; };

/* ============ 모닥불지기 업그레이드 ============ */
const UPS={
  hp:{name:'불씨 나누기',desc:'최대 체력 +10',max:5,base:15,g:'stat'},
  armor:{name:'단단한 혼',desc:'받는 피해 -3%',max:5,base:20,g:'stat'},
  might:{name:'강한 불',desc:'공격력 +6%',max:5,base:20,g:'stat'},
  speed:{name:'빠른 발',desc:'이동 속도 +4%',max:5,base:15,g:'stat'},
  magnet:{name:'끌림',desc:'조각 끌어오는 거리 +15%',max:3,base:12,g:'stat'},
  reroll:{name:'다시 고르기',desc:'판마다 레벨업 카드 다시 뽑기 +1',max:3,base:30,g:'stat'},
  startlv:{name:'첫 불씨',desc:'시작할 때 레벨 +1',max:2,base:45,g:'stat'},
  revive:{name:'되살아남',desc:'판마다 한 번, 쓰러지면 그 자리에서 다시 일어난다',max:1,base:90,g:'stat'},
  // v2.3 기능 칸
  startw:{name:'시작 무기 고르기',desc:'찾은 무기 중 하나를 들고 출발한다',max:1,base:60,g:'run'},
  seal:{name:'카드 봉인',desc:'판마다 원하지 않는 카드를 한 번 지운다 (+1회)',max:3,base:25,g:'run'},
  preview:{name:'갈래 미리 보기',desc:'무기 카드에 Lv3 갈래 ㄱ/ㄴ이 보인다',max:1,base:30,g:'run'},
  card4:{name:'카드 한 장 더',desc:'레벨업 카드 3장 → 4장',max:1,base:80,g:'run'},
  lantern:{name:'등불',desc:'내 둘레를 밝히는 빛과 어둠이 걷히는 범위 +25%',max:2,base:30,g:'path'},
  compass:{name:'길잡이 불씨',desc:'가장 가까운 모닥불·보스 구역 방향을 화면 가장자리에 늘 보여 준다',max:1,base:35,g:'path'},
  ignite:{name:'불 옮기기',desc:'꺼진 모닥불(재)에 불을 붙여 새 거점으로 만든다',max:1,base:40,g:'path'},
  charm:{name:'귀환 부적',desc:'판마다 한 번, 멈춤 화면에서 조각을 전부 들고 모닥불로 돌아간다',max:1,base:55,g:'path'},
  heat:{name:'불 낮추기',desc:'출발 전 단계를 고른다. 단계마다 괴수 ↑, 조각 +20%',max:3,base:40,g:'risk'},
  keep:{name:'조각 지키기',desc:'쓰러질 때 잃는 조각 -10% (50% → 30%)',max:2,base:45,g:'risk'},
  lure:{name:'보물 냄새',desc:'보물 괴수가 더 자주 나온다',max:2,base:35,g:'risk'},
  pfire:{name:'소방관의 손질',desc:'시작 무기를 Lv2로 들고 출발한다',max:1,base:70,g:'ppl'},
  pclerk:{name:'알바생의 챙김',desc:'출발할 때 복조리와 주먹밥을 하나씩 챙겨 준다',max:1,base:50,g:'ppl'},
  ptaxi:{name:'택시 기사의 길',desc:'지도와 화면에 꺼진 모닥불·보스 구역이 미리 보인다',max:1,base:50,g:'ppl'}
};
const UPG={stat:{name:'능력치',req:1},run:{name:'🃏 판 운영',req:1},path:{name:'🧭 길 찾기',req:2},risk:{name:'🔥 위험과 보상',req:3},ppl:{name:'👥 거점 사람들',req:4}};
const FIRE_CAP=[2,3,4,5,99];
function firePts(){ return [...new Set(['namsan','seoulst','myeong','itaewon','hangang',...FKEYS])].filter(k=>SV.cleared[k]).length+Object.keys(SV.lit||{}).filter(k=>k!=='namsan').length+((SV.spent||0)>=600?1:0); } // 600조각을 바치면 +1 (보스에 막혀도 한 단계는 오른다)
function fireLv(){ return Math.min(5,1+firePts()); }
function upMax(k){ const U=UPS[k]; return U.g==='stat'?Math.min(U.max,FIRE_CAP[fireLv()-1]):U.max; }
function upOpen(k){ return fireLv()>=UPG[UPS[k].g].req; }
// v2.41 (기획자 11-18 09:47): 되살릴수록 값이 싸져 뒤로 갈수록 금방 되살아났다 → 잿별 할인 없앰
// v2.42 (기획자 10:24 ㄱ): ×1.5 곱하기는 9번이면 ×38 벽 → 더하기: 되살린 횟수마다 +ASH_UP(50%)
const ASH_UP=.5, ashMulN=n=>1+(DBG.ashUp??ASH_UP)*n, ashMul=()=>ashMulN(SV.ashN||0);
const upCost=(k)=>Math.round(UPS[k].base*Math.pow(1.5,SV.up[k]||0)*Math.pow(1.12,SV.bought||0)*(UPS[k].g==='stat'?ashMul():1));
let FLAT=false; // v2.59 결투장 같은 출발선
const upLv=k=>(FLAT||(S&&S.flat))?0:(SV.up[k]||0);
/* ============ v2.18 불 키우기 (기획자 01:34 ㄱㄴㄷ): 끝없는 불 · 혼불 유물 · 불 되살리기 ============
   능력치를 다 올리면 쓸 데가 없던 기억 조각에 끝없는 쓸모를 준다. 1·2막 규칙: 유물은 저승에 떠도는 옛 물건(사람 흔적·이름 없음) */
const INF={hp:{n:'최대 체력 +4',v:4},armor:{n:'받는 피해 -1%',v:.01},might:{n:'공격력 +2%',v:.02},speed:{n:'이동 속도 +1% (최대 +40%)',v:.01,cap:40},magnet:{n:'끌어오는 거리 +5%',v:.05}};
const infLv=k=>(SV.inf&&SV.inf[k])||0;
const infCost=k=>Math.round(UPS[k].base*5*Math.pow(1.14,infLv(k)));
const RELICS={
  coin:{ic:gi('r_coin'),n:'엽전 꾸러미',d:l=>`기억 조각 +${4*l}%`,k:'shard',v:.04},
  wick:{ic:gi('r_wick'),n:'타다 남은 심지',d:l=>`경험치 +${3*l}%`,k:'xp',v:.03},
  bell:{ic:gi('r_bell'),n:'놋쇠 방울',d:l=>`보스에게 주는 피해 +${4*l}%`,k:'boss',v:.04},
  salt:{ic:gi('r_salt'),n:'소금 단지',d:l=>`받는 피해 -${(1.5*l).toFixed(1)}%`,k:'armor',v:.015},
  fan:{ic:gi('r_fan'),n:'낡은 부채',d:l=>`공격 간격 -${(1.5*l).toFixed(1)}%`,k:'cd',v:.015},
  tal:{ic:gi('r_tal'),n:'붉은 부적',d:l=>`공격력 +${(2.5*l).toFixed(1)}%`,k:'might',v:.025},
  shoe:{ic:gi('r_shoe'),n:'짚신',d:l=>`이동 속도 +${(1.5*l).toFixed(1)}%`,k:'speed',v:.015},
  gourd:{ic:gi('r_gourd'),n:'조롱박',d:l=>`조각 끌어오는 거리 +${6*l}%`,k:'magnet',v:.06},
  pot:{ic:gi('r_pot'),n:'약탕기',d:l=>`최대 체력 +${6*l}`,k:'hp',v:6},
  flint:{ic:gi('r_flint'),n:'부싯돌',d:l=>`불씨 덩어리가 한 등급 위로 +${3*l}%`,k:'emb',v:.03},
  needle:{ic:gi('r_needle'),n:'바늘쌈',d:l=>`판이 끝날 때 불씨 재료 +${6*l}%`,k:'mat',v:.06},
  totem:{ic:gi('r_totem'),n:'장승 조각',d:l=>`기술 범위 +${2*l}%`,k:'area',v:.02}};
const REL_MAX=10, relLv=id=>(SV.rel&&SV.rel[id])||0;
const relDrawCost=()=>Math.round(150*Math.pow(1.025,SV.relN||0)); // v2.19 점검: 1.06이면 다 모으는 데 약 270만 조각 → 1.025(약 11만)
const ASH={might:.04,shard:.08,hp:.03}; // 잿별 하나마다: 공격력 +4% · 기억 조각 +8% · 최대 체력 +3%
const STAT_KS=()=>Object.keys(UPS).filter(k=>UPS[k].g==='stat');
const ashReady=()=>STAT_KS().every(k=>upLv(k)>=UPS[k].max);
const ashGain=()=>2+Math.floor(Object.keys(INF).reduce((a,k)=>a+infLv(k),0)/3); // v2.19 점검: 첫 되살리기 보상이 너무 작았다
const FB0={hp:0,hpM:1,armor:1,might:1,speed:1,magnet:1,cd:1,area:1,xp:1,boss:1,shard:1,emb:0,mat:1};
function fireBonus(){ if(FLAT||(S&&S.flat)) return {...FB0}; const b={...FB0};
  b.hp+=INF.hp.v*infLv('hp'); b.armor*=Math.max(.6,1-INF.armor.v*infLv('armor')); b.might*=1+INF.might.v*infLv('might'); b.speed*=1+INF.speed.v*Math.min(INF.speed.cap,infLv('speed')); b.magnet*=1+INF.magnet.v*infLv('magnet');
  for(const id in RELICS){ const Rl=RELICS[id], l=relLv(id); if(!l) continue; const x=Rl.v*l;
    if(Rl.k==='hp') b.hp+=x; else if(Rl.k==='armor') b.armor*=1-x; else if(Rl.k==='cd') b.cd*=1-x; else if(Rl.k==='emb') b.emb+=x; else b[Rl.k]*=1+x; }
  const a=SV.ash||0; b.might*=1+ASH.might*a; b.shard*=1+ASH.shard*a; b.hpM*=1+ASH.hp*a; return b; }
function relDraw(){ const c=relDrawCost(), L=Object.keys(RELICS).filter(id=>relLv(id)<REL_MAX); if(!L.length||SV.shards<c) return null;
  const id=L[Math.floor(Math.random()*L.length)]; SV.shards-=c; SV.spent=(SV.spent||0)+c; SV.relN=(SV.relN||0)+1; (SV.rel||(SV.rel={}))[id]=relLv(id)+1; save(); return id; }
function ashReset(){ const g=ashGain(); SV.ash=(SV.ash||0)+g; SV.ashN=(SV.ashN||0)+1; for(const k of STAT_KS()) delete SV.up[k]; SV.inf={}; SV.bought=0; save(); return g; }

/* ============ 게임 상태 ============ */
let S=null;
const joris=[]; const enemies=[], gems=[], embersItems=[], orbs=[], foxShots=[], salts=[], beans=[], puddles=[];
function newState(charKey,regionKey){
  const C=CHARS[charKey];
  const s={phase:'play',char:charKey,region:regionKey,bossKey:REGIONS[regionKey].boss,t:0,kills:0,lv:1,xp:0,need:need(1),hp:100,maxhp:100+10*upLv('hp'),nb:newbK(),
    W:{[C.start]:1,...(C.start2?{[C.start2]:1}:{})},P:{},evo:{},evo2:{},spawnAcc:0,eliteT:75,treasureT:40,eventsDone:{},treasures:0,firstTreasure:false,
    bossSpawned:false,bossDead:false,endless:false,cd:{},face:{x:0,z:1},pendingLv:0,memI:Math.floor(Math.random()*MEMORIES.length),hurtT:0,
    reroll:upLv('reroll'),revive:upLv('revive'),heat:Math.min(SV.heat||0,upLv('heat')),seals:upLv('seal'),sealed:{},charm:upLv('charm'),runT:0,lastDir:{x:0,z:1},saltD:0,saltPath:[],spCd:6,dash:null,lg:0,hails:[],loopCd:0,marks:0,npc:null,ally:0,carry:SV.carry,br:{},fu:{},yuts:[],posts:[],segs:null,jangs:[],kites:[],tops:[],arrows:[],arrowQ:[],rockets:[],waves:[]};
  s.hp=s.maxhp;
  if(s.carry==='tail'){ s.W.orb=(s.W.orb||0)+1; }
  s.mastB=mastBonus(); s.gb=gearBonus(); s.gk=gearInfo(); s.gst={}; s.gpr=[]; s.gzn=[]; s.maxhp+=Math.round(s.gb.hp); s.fb=fireBonus(); if(s.gk.uni.yeop) s.fb.shard*=1.15; s.maxhp=Math.round((s.maxhp+s.fb.hp)*s.fb.hpM+30*Math.min(1.5,s.nb||0)); s.hp=s.maxhp; s.loot=[];
  return s;
}
function need(lv){ return Math.floor(4+lv*1.6+lv*lv*.45); } // v2.11 (29번 2ㄱ): 5까지 비슷 · 10에서 1.2배 · 20에서 1.5배 · 30에서 1.6배 느리게
const st=()=>{ const P=S.P; const c=CHARS[S.char]; const G=S.gb||{might:0,speed:0,area:0,cd:0,magnet:0,armor:0}, F=S.fb||FB0;
  let cd=1-.08*(P.cd||0); if(S.char==='clerk') cd*=Math.max(.7,1-.03*Math.floor(S.t/60));
  const seoA=S.char==='seoyun'?1+Math.min(.5,.05*Math.floor(S.t/60)):1, maeM=S.char==='haram'&&((S.maeT||0)>0||S.t-(S.hitAt??-99)>=5)?2:1; // v2.58 새벽 두 시 방송 · 옷 매무새
  let armor=(1-.04*(P.hp||0))*(1-.03*upLv('armor')); if(S.char==='fire'&&S.hp<S.maxhp*.5) armor*=.75; if(S.carry==='needle') armor*=.9;
  let speed=3.3*(1+.08*(P.speed||0))*(1+.04*upLv('speed')); if(S.char==='taxi') speed*=1+Math.min(.35,S.runT*.12); if(S.spHose) speed*=.3; if(S.rush>0) speed*=2; if((S.shoeT||0)>0) speed*=S.gk&&S.gk.uni.doroni?.86:.72;
  const gm=S.gk&&S.gk.uni.ring&&S.hp>=S.maxhp*.999?1.08:1; // v2.55 무쇠 가락지: 체력 가득이면 +8% 더
  return { might:maeM*gm*(1+.12*(P.might||0))*(1+.06*upLv('might'))*(1+.04*(S.starN||0))*(1+G.might)*(1+(S.mastB||0))*F.might*TU('might'), speed:speed*(1+G.speed)*F.speed*TU('speed'), area:seoA*((S.onAir||0)>0?1.3:1)*(1+.1*(P.area||0))*(1+G.area)*F.area, cd:cd*(1-G.cd)*F.cd,
    magnet:2.3*(1+.35*(P.magnet||0))*(1+.15*upLv('magnet'))*(1+G.magnet)*F.magnet, armor:armor*(1-G.armor)*F.armor, dur:1+.15*(P.dur||0), amount:Math.floor((P.amount||0)/2)+((P.amount||0)>=5?1:0) }; };

/* ============ v2.7 장비 (18·19번 문서) → v2.55 아이템 개편 (64번 + 11-19 ② 결정) ============
   등급 5개 = 흰 · 파랑 · 초록(세트) · 노랑(고유) · 보라(전설). 새로 생기는 장비는 v:1 표시가 붙는다.
   옛 장비(v 없음)는 지우지도 바꾸지도 않는다 — 옛 노랑은 「노랑」, 옛 주황은 「옛 주황」 이름표로 수치만. 저장 칸(it.g·it.i·it.o·it.e)은 그대로 읽는다.
   세기: 최고 장비(세트 4 + 전설 1, +10) ≈ 장비 없을 때 공격의 3배 이상(t_v255.py가 숫자로 확인). 일반템(흰·파랑)은 등급 배율로 천장. */
const SLOTN={head:'머리',body:'몸',hand:'손',foot:'발',tool:'도구'}, SLOTK=Object.keys(SLOTN);
const GEAR={ // 앞 12개는 옛 저장의 it.i 자리 그대로 — 새 것은 뒤에만 붙인다
  head:[['안전모',gi('g_helmet'),{hp:12,armor:.03}],['헤드랜턴',gi('g_lamp'),{magnet:.15,area:.04}],['털모자',gi('g_helmet'),{hp:16}],['귀마개',gi('g_helmet'),{armor:.04,hp:4}]],
  body:[['방화복',gi('g_coat'),{armor:.06,hp:8}],['형광 조끼',gi('g_vest'),{speed:.05,magnet:.08}],['우비',gi('g_coat'),{hp:16}],['패딩',gi('g_coat'),{hp:10,armor:.03}]],
  hand:[['목장갑',gi('g_glove'),{might:.06}],['용접 장갑',gi('g_glove'),{might:.04,area:.04}],['고무장갑',gi('g_glove'),{might:.04,magnet:.1}],['손목 보호대',gi('g_glove'),{cd:.04,might:.02}]],
  foot:[['안전화',gi('g_boot'),{armor:.04,speed:.02}],['러닝화',gi('g_shoe'),{speed:.07}],['장화',gi('g_boot'),{hp:10,armor:.02}],['슬리퍼',gi('g_shoe'),{speed:.09}]],
  tool:[['손전등',gi('g_flash'),{area:.06}],['보조배터리',gi('g_batt'),{cd:.05}],['호루라기',gi('g_whistle'),{might:.03,cd:.03}],['라이터',gi('g_flash'),{area:.05,might:.02}],['우산',gi('g_whistle'),{armor:.04,hp:6}]]
};
// m = 수치 배율 · x = 덤 옵션 개수(파랑은 1~2)
const GRADE=[{n:'흰',c:'#d8d4e0',m:1,x:0},{n:'파랑',c:'#5aa0ff',m:1.5,x:1},{n:'초록',c:'#5ed67a',m:2.1,x:1},{n:'노랑',c:'#f4d040',m:2.5,x:2},{n:'보라',c:'#b57bff',m:3,x:2}];
const OLDG=[GRADE[0],GRADE[1],{n:'노랑',c:'#f4d040',m:1.8,x:2,old:1},{n:'옛 주황',c:'#ff8c2a',m:2.4,x:3,old:1}];
const gGr=it=>(it&&it.v?GRADE[it.g]:OLDG[it&&it.g])||GRADE[0];
const gRank=it=>it.v?it.g:([0,1,3,3.5][it.g]??0); // 옛 노랑 = 노랑 자리 · 옛 주황 = 노랑과 보라 사이
const XOPT={might:.03,speed:.025,area:.03,cd:.025,magnet:.06,armor:.025,hp:6}; // 옛 덤 옵션(옛 저장 값은 it.o에 그대로)
const XOPT2={might:.05,speed:.03,area:.05,cd:.03,magnet:.08,armor:.025,hp:8};
const STATN={might:'공격',speed:'이동',area:'범위',cd:'재사용',magnet:'줍기 거리',armor:'피해 감소',hp:'체력'};
// 초록 세트 — 지역마다 1벌, 그 지역에서만. 2개 = 수치 · 4개 = 녹색 기술(남은 1칸엔 전설)
const SETS={
  myeong:{n:'불 끄는 밤',p:{head:'방화 두건',body:'방수 외투',hand:'방열 장갑',foot:'방화 장화',tool:'무전기'},b2:{armor:.08},d2:'피해 감소 +8%',sk:'물안개 고리',d4:'5초마다 녹색 물안개가 퍼져 밀어낸다'},
  hongdae:{n:'새벽 마감',p:{head:'매장 모자',body:'앞치마',hand:'코팅 장갑',foot:'쿠션 운동화',tool:'핸드 스캐너'},b2:{cd:.07},d2:'재사용 -7%',sk:'마감 빛살',d4:'3초마다 녹색 빛살 6줄기가 쫓아간다'},
  seongsu:{n:'용광로',p:{head:'용접 가면',body:'작업복',hand:'두꺼운 장갑',foot:'쇠코 안전화',tool:'쇠망치'},b2:{might:.12},d2:'공격 +12%',sk:'불티 비',d4:'4초마다 녹색 불티 5개가 떨어진다'},
  gyeong:{n:'궁궐 야경',p:{head:'털벙거지',body:'두루마기',hand:'가죽 토시',foot:'목화',tool:'방울 지팡이'},b2:{hp:30},d2:'체력 +30',sk:'방울 결계',d4:'내 둘레 녹색 결계 안이 늘 다치고 느려진다'},
  namsan:{n:'봉화 지기',p:{head:'패랭이',body:'누비옷',hand:'짚 토시',foot:'미투리',tool:'부싯돌 주머니'},b2:{magnet:.3},d2:'줍기 거리 +30%',sk:'봉화 불기둥',d4:'5초마다 가장 센 괴수에게 녹색 불기둥'}};
const SETP={head:{hp:14,armor:.03},body:{armor:.05,hp:12},hand:{might:.07},foot:{speed:.05,armor:.02},tool:{cd:.05,area:.03}};
// 노랑 고유 — 이름 있는 옛 물건, 물건마다 효과 하나
const UNIQ={
  gamtu:{n:'도깨비감투',s:'head',ic:'g_helmet',b:{hp:12,armor:.03},d:'10초마다 1.5초 안 다침'},
  satgat:{n:'삿갓',s:'head',ic:'g_helmet',b:{hp:14,area:.03},d:'위에서 떨어지는 공격 피해 절반'},
  doroni:{n:'도롱이',s:'body',ic:'g_coat',b:{hp:16,armor:.03},d:'느려지는 효과 절반'},
  turtle:{n:'거북 등 조끼',s:'body',ic:'g_vest',b:{armor:.05,hp:8},d:'뒤에서 맞는 피해 -35%'},
  ring:{n:'무쇠 가락지',s:'hand',ic:'g_glove',b:{might:.07},d:'공격 +8% · 체력 가득이면 +8% 더'},
  golmu:{n:'골무',s:'hand',ic:'g_glove',b:{might:.05,cd:.02},d:'8% 확률로 두 배 피해'},
  chukji:{n:'축지 짚신',s:'foot',ic:'r_shoe',b:{speed:.06},d:'2초 넘게 달리면 쭉 미끄러진다(6초)'},
  namak:{n:'나막신',s:'foot',ic:'g_boot',b:{armor:.03,speed:.03},d:'내 둘레 괴수가 느려진다'},
  jori:{n:'복조리',s:'tool',ic:'g_whistle',b:{magnet:.15,cd:.03},d:'30초마다 조각이 모두 끌려온다'},
  yeop:{n:'복주머니',s:'tool',ic:'r_coin',b:{area:.04,cd:.02},d:'기억 조각 +15%'},
  horib:{n:'호리병',s:'tool',ic:'r_gourd',b:{cd:.03,hp:10},d:'판마다 한 번, 쓰러질 때 체력 30%로'},
  mirror:{n:'청동 거울',s:'tool',ic:'g_flash',b:{area:.05},d:'6초마다 날아오는 탄 하나를 막는다'}};
// 보라 전설 — 1칸만 껴도 보라 기술(무기 상관없음). 세트 4개 기술보다 조금 약하게(×0.8). 여러 개 껴도 기술은 가장 센 것 하나
const LEGS={
  axeback:{n:'되돌이 도끼자루',s:'hand',ic:'axe',b:{might:.08},sk:'되돌이 날',d:'3초마다 보라 날이 날아갔다 돌아온다'},
  lens:{n:'갈래 렌즈',s:'tool',ic:'barcode',b:{cd:.05,area:.03},sk:'갈래 빛',d:'3초마다 보라 빛이 세 갈래로 튄다'},
  echo:{n:'메아리 나팔',s:'tool',ic:'horn',b:{cd:.04,area:.04},sk:'메아리',d:'5초마다 보라 울림이 두 번 퍼진다'},
  ink:{n:'옮겨붙는 먹',s:'hand',ic:'talis',b:{might:.06,cd:.02},sk:'번지는 먹',d:'4초마다 보라 먹이 셋에 번져 태운다'},
  candle:{n:'쌍가락 촛대',s:'tool',ic:'orb',b:{area:.05,cd:.03},sk:'쌍불',d:'2.5초마다 보라 불 둘이 꼬이며 난다'},
  whirl:{n:'소용돌이 꼭지',s:'hand',ic:'hose',b:{might:.06,area:.02},sk:'보라 소용돌이',d:'6초마다 소용돌이가 끌어당긴다'},
  shade:{n:'도는 등갓',s:'head',ic:'lantern',b:{hp:14,area:.04},sk:'도는 빛',d:'보라 빛줄기가 내 둘레를 돈다'},
  feather:{n:'꿰뚫는 깃',s:'hand',ic:'bow',b:{might:.08},sk:'꿰뚫는 깃',d:'2.5초마다 보라 깃이 셋을 꿰뚫는다'}};
if(!SV.bag) SV.bag=[]; if(!SV.eq) SV.eq={}; if(SV.mat==null) SV.mat=0; if(!SV.mt) SV.mt={}; for(const k of ['sil','garu','soe']) if(SV.mt[k]==null) SV.mt[k]=0; if(SV.lt==null) SV.lt=0;
function rollGrade(w){ let r=Math.random()*w.reduce((a,b)=>a+b,0); for(let i=0;i<w.length;i++){ r-=w[i]; if(r<=0&&w[i]>0) return i; } return 0; }
// 떨굼 표(흰·파랑·초록·노랑·보라). 일반 보스(nboss)는 v2.56에서 쓴다 — 자리만 둠
const DROPW={mob:[70,24,5,.9,.1],elite:[40,38,16,5,1],nboss:[0,30,45,20,5],mid:[0,25,45,25,5],fin:[0,0,50,38,12],spot:[60,30,8,1.8,.2]};
const DROPP={mob:.0025,elite:.08,nboss:1};
function dropW(kind){ const w=DROPW[kind].slice(), d=Math.min(10,(S&&S.deep)||0); if(kind==='mid'||kind==='fin'||kind==='nboss'){ const x=Math.min(w[2]-5,d); w[4]+=x; w[2]-=x; } return w; }
function nbossDrop(x,z){ /* v2.56 일반 보스 단계에서 부른다: 불씨 1개(nboss 표) */ const o=mkSpot(x,z,true,null,true); o.gr=rollGrade(dropW('nboss')); o.life=120; return o; }
const ownedU=()=>new Set(SV.bag.filter(x=>x.v&&x.u).map(x=>x.u));
function pickU(L){ if(!L.length) return null; const own=ownedU(); let u=L[Math.floor(Math.random()*L.length)]; if(own.has(u)&&Math.random()<1/3) u=L[Math.floor(Math.random()*L.length)]; return u; } // 이미 가진 것은 덜 나옴
function rollOpts(g,n){ const o={}, ks=Object.keys(XOPT2); n=n??(GRADE[g].x+(g===1&&Math.random()<.5?1:0)); for(let j=0;j<n;j++){ const k=ks[Math.floor(Math.random()*ks.length)]; o[k]=(o[k]||0)+XOPT2[k]*(.6+Math.random()*.6); } return o; }
function makeGear(g,sl0,fk){ g=Math.max(0,Math.min(4,g|0)); let sl=sl0||SLOTK[Math.floor(Math.random()*5)], k=null, u=null;
  if(g===2){ const f=fk||(S&&S.field); if(SETS[f]){ k='set'; u=f; } else g=1; } // 세트가 없는 곳(수원·서울 지도)에선 초록 대신 파랑
  if(g===3){ const L=Object.keys(UNIQ), L2=sl0?L.filter(q=>UNIQ[q].s===sl0):L; u=pickU(L2.length?L2:L); k='uni'; sl=UNIQ[u].s; }
  if(g===4){ const L=Object.keys(LEGS), L2=sl0?L.filter(q=>LEGS[q].s===sl0):L; u=pickU(L2.length?L2:L); k='leg'; sl=LEGS[u].s; }
  const i=Math.floor(Math.random()*GEAR[sl].length), on=GRADE[g].x+(g===1&&Math.random()<.5?1:0);
  const it={s:sl,i,g,o:rollOpts(g,on),on,e:0,v:1,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6)}; if(k){ it.k=k; it.u=u; } return it; }
const gDef=it=>it.v&&it.k==='set'?null:it.v&&it.k==='uni'?UNIQ[it.u]:it.v&&it.k==='leg'?LEGS[it.u]:null;
const gName=it=>{ if(it.v&&it.k==='set'&&SETS[it.u]) return SETS[it.u].p[it.s]; const D=gDef(it); if(D) return D.n; return (GEAR[it.s][it.i]||GEAR[it.s][0])[0]; };
const gIc=it=>{ const D=gDef(it); if(D&&D.ic) return gi(D.ic); return (GEAR[it.s][it.i]||GEAR[it.s][0])[1]; };
function gBase(it){ if(it.v&&it.k==='set') return SETP[it.s]; const D=gDef(it); if(D) return D.b; return (GEAR[it.s][it.i]||GEAR[it.s][0])[2]; }
// 수치 = (기본 × 1.5 · 체력·피해 감소·이동은 ×1) × 등급 배율 × 강화 + 주 공격(등급마다) + 덤 옵션 × 강화
const GSC={might:1.5,area:1.5,cd:1.5,magnet:1.5}, GMAIN=.03, enhK=e=>1+.06*(e||0);
function gStats(it){ const B=gBase(it), m=gGr(it).m, k=enhK(it.e), r={might:GMAIN*m*k}; for(const a in B) r[a]=(r[a]||0)+B[a]*(GSC[a]||1)*m*k; for(const a in it.o) r[a]=(r[a]||0)+it.o[a]*k; return r; }
const gScore=it=>{ const r=gStats(it); return (r.might||0)*100+(r.speed||0)*100+(r.area||0)*80+(r.cd||0)*100+(r.magnet||0)*40+(r.armor||0)*100+(r.hp||0)*.8+gRank(it)*4; };
const fmtStat=(k,v)=>k==='hp'?`${STATN[k]} +${Math.round(v)}`:`${STATN[k]} +${(v*100).toFixed(1).replace(/\.0$/,'')}%`;
const eqItem=sl=>SV.bag.find(x=>x.id===SV.eq[sl]);
const eqItems=()=>SLOTK.map(eqItem).filter(Boolean);
// 세트 개수 · 4개 세트 · 가장 센 전설 · 고유 효과 (판 시작 때 S.gk에 담는다)
function gearInfo(){ const I={setN:{},set4:null,setE:0,leg:null,legE:0,uni:{}}; if(FLAT||(S&&S.flat)) return I; const E=eqItems();
  for(const it of E){ if(!it.v) continue; if(it.k==='set'&&SETS[it.u]) I.setN[it.u]=(I.setN[it.u]||0)+1; else if(it.k==='uni'&&UNIQ[it.u]) I.uni[it.u]=1; else if(it.k==='leg'&&LEGS[it.u]&&(!I.leg||it.e>I.legE)){ I.leg=it.u; I.legE=it.e; } }
  for(const f in I.setN) if(I.setN[f]>=4){ I.set4=f; const L=E.filter(x=>x.v&&x.k==='set'&&x.u===f); I.setE=L.reduce((a,b)=>a+b.e,0)/L.length; }
  return I; }
function gearBonus(){ const t={might:0,speed:0,area:0,cd:0,magnet:0,armor:0,hp:0}; if(S&&S.duel&&S.duel.gear){ for(const it of Object.values(S.duel.gear)){ const r=gStats(it); for(const k in r) t[k]+=r[k]*DG_GEAR; } return t; } if(FLAT||(S&&S.flat)) return t; for(const it of eqItems()){ const r=gStats(it); for(const k in r) t[k]+=r[k]; }
  const I=gearInfo(); for(const f in I.setN) if(I.setN[f]>=2) for(const k in SETS[f].b2) t[k]+=SETS[f].b2[k]; if(I.uni.ring) t.might+=.08;
  t.cd=Math.min(t.cd,.35); t.armor=Math.min(t.armor,.6); t.speed=Math.min(t.speed,.45); return t; }
function gTag(it){ const G=gGr(it); return `<b style="color:${G.c}">${it.lk?'🔒':''}${gIc(it)} ${gName(it)}${it.e?' +'+it.e:''}</b>`; }
function gFx(it){ if(!it.v) return it.g===3?'수치만':''; if(it.k==='set'&&SETS[it.u]){ const n=gearInfo().setN[it.u]||0; return `<span style="color:${GRADE[2].c}">세트 「${SETS[it.u].n}」 ${Math.min(4,n)}/4</span>`; }
  if(it.k==='uni'&&UNIQ[it.u]) return `<span style="color:${GRADE[3].c}">★ ${UNIQ[it.u].d}</span>`; if(it.k==='leg'&&LEGS[it.u]) return `<span style="color:${GRADE[4].c}">◆ ${LEGS[it.u].sk} · ${LEGS[it.u].d}</span>`; return ''; }
// 분해: 불씨 재료 조금 + 그 칸 재료 1 + 빛 조각(등급·강화만큼)
const LT_BY=[0,1,2,3,6];
function gDis(it){ const r=gRank(it); return {mat:1+Math.round(r*2)+Math.floor(it.e/2),mt:1,lt:(LT_BY[Math.floor(r)]||0)+Math.floor(it.e/4)}; }
function gDisApply(it,half){ if(LGon()){ const L=SV.ledger; delete L.gearFrom[it.id]; if(half) L.broken++; else L.scrapped++; } const d=gDis(it), h=half?.5:1; SV.mat+=Math.floor(d.mat*h); const mk=SLOTMT[it.s]; if(mk) SV.mt[mk]=(SV.mt[mk]||0)+Math.floor(d.mt*h); SV.lt=(SV.lt||0)+Math.floor(d.lt*h); return d; }
/* ============ v2.55 세트 녹색 기술 · 전설 보라 기술 · 고유 효과 ============
   무기 틀(near·damage·damageBoss·ep·er 불티·고리)을 그대로 쓴다. 기술 세기 D = (30 + 2.5×레벨) × 공격 배수 × (1 + 0.05×강화 평균).
   전설은 세트 4개 기술의 0.8배. 발밑 고리: 세트 4개 = 옅은 녹색 · 전설 = 보라. 몸 둘레 빛도 같은 색. */
const GRN=[.2,1,.4], GRN2=[.6,1,.65], PRP=[.72,.3,1], PRP2=[.9,.7,1];
function gearDropMob(e,kind){ if(!FIELD||!S||!S.field||S.phase!=='play'||S.duel) return; if(Math.random()>=DROPP[kind]*luckMul()) return;
  const o=mkSpot(e.x,e.z,true,null,true); o.gr=rollGrade(dropW(kind)); o.life=45; o.small=1; o.sp.scale.setScalar(1.05); DBG.gDrop=(DBG.gDrop||0)+1; }
function gsHit(x,z,R,dmg,kb,col,once){ let n=0; near(x,z,R,e=>{ if(once&&once.has(e)) return; const dx=e.x-x,dz=e.z-z,d=Math.hypot(dx,dz)||1; if(d>R+e.d.r*.5) return; if(once) once.add(e); damage(e,dmg,dx/d,dz/d,kb); n++; });
  if(boss.alive&&!boss.dying&&Math.hypot(boss.x-x,boss.z-z)<R+1.2&&!(once&&once.has(boss))){ if(once) once.add(boss); damageBoss(dmg,'gear'); n++; } return n; }
function gsReady(k,per,dt){ const T=S.gst; T[k]=(T[k]??Math.min(1.2,per))-dt; if(T[k]<=0){ T[k]=per; return true; } return false; }
function gsShot(x,z,a,o){ S.gpr.push(Object.assign({x,z,vx:Math.cos(a)*o.sp,vz:Math.sin(a)*o.sp,life:1.6,hit:new Set(),pierce:1,y:1},o)); }
function inkSpread(e){ const g=e.ink.g||0; if(g>=3) return; let n=0; near(e.x,e.z,3.5,o=>{ if(n>=2||o.dead||o.ink||o===e||o.d.treasure) return; o.ink={t:3,g:g+1,d:e.ink.d,tk:0}; S.inkL&&S.inkL.push(o); n++; ep(o.x,1,o.z,0,1,0,.4,.5,PRP); }); }
function gearSkillTick(dt){ const K=S.gk; if(!K) return; const P=player.root.position, s=st(), U=K.uni;
  if(S.inSafe||S.phase!=='play'){ return; }
  // --- 고유(노랑) 효과
  if(U.gamtu){ S.gamtu=Math.max(0,(S.gamtu||0)-dt); if(gsReady('gamtu',10,dt)){ S.gamtu=1.5; fx(P.x,P.z,1.4,[1,.9,.4],.3); } if(S.gamtu>0&&Math.random()<dt*14) ep(P.x+rr(-.4,.4),rr(.4,1.8),P.z+rr(-.3,.3),0,.6,0,.4,.35,GOLD); }
  if(U.namak){ near(P.x,P.z,2.6,e=>{ e.slow=Math.min(e.slow,.55); }); }
  if(U.jori&&gsReady('jori',30,dt)){ for(const g of gems) g.pull=true; toast('🧺 복조리','조각이 끌려온다'); }
  if(U.mirror){ S.gst.mir=(S.gst.mir??0)-dt; if(S.gst.mir<=0){ let bi=-1,bd=9; foxShots.forEach((f,i)=>{ const d=(f.x-P.x)**2+(f.z-P.z)**2; if(d<bd){ bd=d; bi=i; } }); if(bi>=0){ const f=foxShots[bi]; foxShots.splice(bi,1); fx(f.x,f.z,.8,[1,.95,.6],.25); S.gst.mir=6; DBG.mirror=(DBG.mirror||0)+1; } } }
  if(U.chukji){ S.gst.chk=(S.gst.chk??0)-dt; if(S.gst.chk<=0&&S.runT>2&&!S.dash){ S.gst.chk=6; S.dash={t:.2,dx:S.face.x,dz:S.face.z,hit:new Set()}; fx(P.x,P.z,1,[1,.9,.5],.25); } }
  // --- 세트 4개 녹색 기술
  const lv=S.lv||1;
  if(K.set4){ const D=(30+2.5*lv)*s.might*(1+.05*K.setE), f=K.set4;
    if(f==='myeong'&&gsReady('set',5*s.cd,dt)){ const R=4.6*s.area; gsHit(P.x,P.z,R,D*1.3,11,GRN); er(P.x,P.z,.5,R,.55,GRN,1.8); er(P.x,P.z,.3,R*.7,.45,GRN2,1.2); epBurst(P.x,.4,P.z,30,R*1.3,.6,.55,GRN); DBG.gsk=(DBG.gsk||0)+1; }
    if(f==='hongdae'&&gsReady('set',3*s.cd,dt)){ const skip=new Set(); for(let i=0;i<6;i++){ const t=nearest(P.x,P.z,12,skip); if(t) skip.add(t); const a=t?Math.atan2(t.z-P.z,t.x-P.x):i*1.047; gsShot(P.x,P.z,a,{sp:12,tgt:t,dmg:D*.5,col:GRN,home:1}); } er(P.x,P.z,.3,1.6,.3,GRN,1.2); DBG.gsk=(DBG.gsk||0)+1; }
    if(f==='seongsu'&&gsReady('set',4*s.cd,dt)){ const L=[]; near(P.x,P.z,9,e=>{ if(!e.d.treasure) L.push(e); }); for(let i=0;i<5;i++){ const e=L.length?L[Math.floor(Math.random()*L.length)]:null; const x=e?e.x:P.x+rr(-5,5), z=e?e.z:P.z+rr(-5,5); S.gzn.push({x,z,R:1.9*s.area,t:.4,k:'drop',dmg:D*.9,col:GRN}); er(x,z,1.9*s.area,1.7*s.area,.4,GRN,.8); }
      if(boss.alive&&!boss.dying&&Math.hypot(boss.x-P.x,boss.z-P.z)<11) S.gzn.push({x:boss.x,z:boss.z,R:2,t:.4,k:'drop',dmg:D*.9,col:GRN}); DBG.gsk=(DBG.gsk||0)+1; }
    if(f==='gyeong'){ const R=3.3*s.area; if(gsReady('set',.5,dt)){ gsHit(P.x,P.z,R,D*.2,0,GRN); near(P.x,P.z,R,e=>{ e.slow=Math.min(e.slow,.5); }); er(P.x,P.z,R,R+.15,.5,GRN,.9); DBG.gsk=(DBG.gsk||0)+1; } if(Math.random()<dt*20){ const a=rr(0,6.283); ep(P.x+Math.cos(a)*R,.2,P.z+Math.sin(a)*R,0,rr(.6,1.4),0,.6,.4,GRN); } }
    if(f==='namsan'&&gsReady('set',5*s.cd,dt)){ let t=null; if(boss.alive&&!boss.dying&&Math.hypot(boss.x-P.x,boss.z-P.z)<14) t=boss; else { let bh=-1; near(P.x,P.z,12,e=>{ if(!e.d.treasure&&e.hp>bh){ bh=e.hp; t=e; } }); }
      const x=t?t.x:P.x+S.face.x*4, z=t?t.z:P.z+S.face.z*4; gsHit(x,z,2.4*s.area,D*2.6,6,GRN); for(let i=0;i<26;i++) ep(x+rr(-.5,.5),rr(0,1),z+rr(-.5,.5),rr(-.4,.4),rr(5,9),rr(-.4,.4),.7,.6,i%3?GRN:GRN2); er(x,z,.4,2.6*s.area,.5,GRN,1.6); DBG.gsk=(DBG.gsk||0)+1; } }
  // --- 전설 보라 기술 (세트 기술의 0.8배)
  if(K.leg){ const D=.8*(30+2.5*lv)*s.might*(1+.05*K.legE), L=K.leg;
    if(L==='axeback'&&gsReady('leg',3*s.cd,dt)){ const f=aimFrom(P.x,P.z); gsShot(P.x,P.z,Math.atan2(f.z,f.x),{sp:13,dmg:D*.75,col:PRP,pierce:99,ret:.55,life:1.4,big:1}); DBG.lsk=(DBG.lsk||0)+1; }
    if(L==='lens'&&gsReady('leg',3*s.cd,dt)){ const t=nearest(P.x,P.z,11); if(t){ const hit=new Set([t]); gsBeam(P.x,P.z,t.x,t.z); t===boss?damageBoss(D*1.1,'gear'):damage(t,D*1.1); let n=0; near(t.x,t.z,4.5*s.area,o=>{ if(n>=3||hit.has(o)) return; hit.add(o); n++; gsBeam(t.x,t.z,o.x,o.z); damage(o,D*.6); }); DBG.lsk=(DBG.lsk||0)+1; } }
    if(L==='echo'&&gsReady('leg',5*s.cd,dt)){ const R=4.2*s.area; gsHit(P.x,P.z,R,D*1.05,9,PRP); er(P.x,P.z,.5,R,.5,PRP,1.6); epBurst(P.x,.4,P.z,22,R*1.2,.55,.5,PRP); S.gzn.push({x:P.x,z:P.z,R,t:.4,k:'echo',dmg:D*.75,col:PRP}); DBG.lsk=(DBG.lsk||0)+1; }
    if(L==='ink'&&gsReady('leg',4*s.cd,dt)){ const skip=new Set(); S.inkL=S.inkL||[]; for(let i=0;i<3;i++){ const t=nearest(P.x,P.z,10,skip); if(!t) break; skip.add(t); if(t===boss){ damageBoss(D*1.2,'gear'); ep(t.x,2,t.z,0,1,0,.5,.8,PRP); continue; } t.ink={t:3,g:0,d:D*.16,tk:0}; S.inkL.push(t); gsBeam(P.x,P.z,t.x,t.z); } DBG.lsk=(DBG.lsk||0)+1; }
    if(L==='candle'&&gsReady('leg',2.5*s.cd,dt)){ const t=nearest(P.x,P.z,12), a=t?Math.atan2(t.z-P.z,t.x-P.x):Math.atan2(S.face.z,S.face.x); for(const sd of [-1,1]) gsShot(P.x,P.z,a,{sp:9,tgt:t,dmg:D*.6,col:PRP,home:1,wob:sd,pierce:2}); DBG.lsk=(DBG.lsk||0)+1; }
    if(L==='whirl'&&gsReady('leg',6*s.cd,dt)){ const t=nearest(P.x,P.z,10); const x=t?t.x:P.x+S.face.x*4, z=t?t.z:P.z+S.face.z*4; S.gzn.push({x,z,R:3.2*s.area,t:2.5,k:'whirl',dmg:D*.2,col:PRP,tk:0}); DBG.lsk=(DBG.lsk||0)+1; }
    if(L==='shade'){ S.gst.ang=(S.gst.ang||0)+dt*2.3; const a=S.gst.ang, Lr=4.4*s.area, cx=Math.cos(a), cz=Math.sin(a); S.gst.sh=(S.gst.sh||0)-dt;
      for(let i=0;i<4;i++){ const q=rr(.6,Lr); ep(P.x+cx*q,.7,P.z+cz*q,0,.3,0,.28,.6,i?PRP:PRP2); }
      if(S.gst.sh<=0){ S.gst.sh=.12; near(P.x+cx*Lr*.5,P.z+cz*Lr*.5,Lr*.55,e=>{ const ex=e.x-P.x, ez=e.z-P.z, along=ex*cx+ez*cz, side=Math.abs(-ex*cz+ez*cx); if(along<0||along>Lr||side>.7+e.d.r*.4) return; if(S.t-(e.shT??-9)<.5) return; e.shT=S.t; damage(e,D*.42,cx,cz,3); });
        if(boss.alive&&!boss.dying){ const ex=boss.x-P.x, ez=boss.z-P.z, al=ex*cx+ez*cz, sd=Math.abs(-ex*cz+ez*cx); if(al>0&&al<Lr+1&&sd<1.6&&S.t-(S.gst.shb??-9)>.5){ S.gst.shb=S.t; damageBoss(D*.42,'gear'); } } } }
    if(L==='feather'&&gsReady('leg',2.5*s.cd,dt)){ const f=aimFrom(P.x,P.z); gsShot(P.x,P.z,Math.atan2(f.z,f.x),{sp:17,dmg:D*1.0,col:PRP,pierce:3,life:1.2,big:1}); DBG.lsk=(DBG.lsk||0)+1; } }
  // --- 날아가는 것
  for(let i=S.gpr.length-1;i>=0;i--){ const p=S.gpr[i]; p.life-=dt; p.age=(p.age||0)+dt;
    if(p.home&&p.tgt&&(p.tgt===boss?boss.alive:!p.tgt.dead)){ const a=Math.atan2(p.tgt.z-p.z,p.tgt.x-p.x), v=Math.hypot(p.vx,p.vz), ca=Math.atan2(p.vz,p.vx); let da=a-ca; da=Math.atan2(Math.sin(da),Math.cos(da)); const na=ca+Math.max(-dt*7,Math.min(dt*7,da)); p.vx=Math.cos(na)*v; p.vz=Math.sin(na)*v; }
    if(p.ret&&p.age>p.ret){ if(!p.back){ p.back=1; p.hit.clear(); } const dx=P.x-p.x, dz=P.z-p.z, l=Math.hypot(dx,dz)||1, v=Math.hypot(p.vx,p.vz); p.vx=dx/l*v; p.vz=dz/l*v; if(l<.8){ S.gpr.splice(i,1); continue; } }
    let ox=0, oz=0; if(p.wob){ const w=Math.sin(p.age*14)*.5*p.wob, v=Math.hypot(p.vx,p.vz)||1; ox=-p.vz/v*w; oz=p.vx/v*w; }
    p.x+=p.vx*dt; p.z+=p.vz*dt; const x=p.x+ox, z=p.z+oz;
    ep(x,p.y,z,0,0,0,.3,p.big?1:.6,p.col); if(Math.random()<.5) ep(x,p.y,z,rr(-.5,.5),rr(-.2,.5),rr(-.5,.5),.3,.3,p.col===PRP?PRP2:GRN2);
    near(x,z,.9,e=>{ if(p.pierce<=0||p.hit.has(e)) return; if(Math.hypot(e.x-x,e.z-z)>.55+e.d.r) return; p.hit.add(e); damage(e,p.dmg,p.vx*.05,p.vz*.05,2); p.pierce--; });
    if(boss.alive&&!boss.dying&&!p.hit.has(boss)&&Math.hypot(boss.x-x,boss.z-z)<1.6){ p.hit.add(boss); damageBoss(p.dmg,'gear'); p.pierce--; }
    if(p.life<=0||p.pierce<=0){ epBurst(x,p.y,z,5,2,.3,.35,p.col); S.gpr.splice(i,1); } }
  // --- 남는 자리(불티 떨어짐 · 메아리 두 번째 · 소용돌이)
  for(let i=S.gzn.length-1;i>=0;i--){ const z=S.gzn[i]; z.t-=dt;
    if(z.k==='whirl'){ z.tk-=dt; near(z.x,z.z,z.R,e=>{ if(e.d.treasure) return; const dx=z.x-e.x, dz=z.z-e.z, l=Math.hypot(dx,dz)||1; if(l>.4){ e.x+=dx/l*3.2*dt*(1-(e.d.kbRes||0)); e.z+=dz/l*3.2*dt*(1-(e.d.kbRes||0)); } });
      for(let k=0;k<3;k++){ const a=S.t*6+k*2.09+i, q=z.R*(.3+.6*((S.t*1.7+k*.33)%1)); ep(z.x+Math.cos(a)*q,.3,z.z+Math.sin(a)*q,-Math.sin(a)*2,.4,Math.cos(a)*2,.3,.45,k?PRP:PRP2); }
      if(z.tk<=0){ z.tk=.3; gsHit(z.x,z.z,z.R,z.dmg,0,PRP); er(z.x,z.z,z.R,z.R*.3,.3,PRP,.9); } }
    if(z.t<=0){ if(z.k==='drop'){ gsHit(z.x,z.z,z.R,z.dmg,4,GRN); for(let k=0;k<14;k++) ep(z.x+rr(-.4,.4),rr(2.5,4),z.z+rr(-.4,.4),rr(-1,1),rr(-7,-4),rr(-1,1),.35,.5,k%2?GRN:GRN2); epBurst(z.x,.3,z.z,12,4,.4,.4,GRN); er(z.x,z.z,.3,z.R,.35,GRN,1.3); }
      if(z.k==='echo'){ gsHit(z.x,z.z,z.R,z.dmg,6,PRP); er(z.x,z.z,.5,z.R,.45,PRP2,1.2); }
      S.gzn.splice(i,1); } }
  // --- 번지는 먹: 붙은 것이 0.5초마다 탄다
  if(S.inkL&&S.inkL.length){ for(let i=S.inkL.length-1;i>=0;i--){ const e=S.inkL[i]; if(e.dead||!e.ink){ S.inkL.splice(i,1); continue; } const I=e.ink; I.t-=dt; I.tk-=dt; if(Math.random()<dt*6) ep(e.x+rr(-.3,.3),e.d.h*.6,e.z,0,.8,0,.4,.4,PRP);
    if(I.tk<=0){ I.tk=.5; damage(e,I.d); } if(I.t<=0&&!e.dead){ e.ink=null; S.inkL.splice(i,1); } } } }
function gsBeam(x0,z0,x1,z1){ const n=8; for(let i=0;i<=n;i++){ const u=i/n; ep(x0+(x1-x0)*u,1,z0+(z1-z0)*u,0,.2,0,.22,.45,i%2?PRP:PRP2); } }
// 발밑 고리 + 몸 둘레 빛 (세트 4개 = 녹색 · 전설 = 보라)
const GAURA=(()=>{ const mk=(r0,r1,col)=>{ const m=new THREE.Mesh(new THREE.RingGeometry(r0,r1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; m.renderOrder=4; m.visible=false; scene.add(m); return m; };
  const fill=col=>{ const m=new THREE.Mesh(new THREE.CircleGeometry(.95,40),new THREE.MeshBasicMaterial({map:T.halo,color:col,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); m.rotation.x=-Math.PI/2; m.renderOrder=3; m.visible=false; scene.add(m); return m; };
  const A={g:mk(.78,.92,0x5eff86),gf:fill(0x5eff86),p:mk(.98,1.2,0xb878ff),pf:fill(0xa060ff),gh:haloSprite(0x6dff90,4.2,.15),ph:haloSprite(0xb57bff,4.6,.15)}; for(const k of ['gh','ph']){ A[k].visible=false; scene.add(A[k]); } return A; })();
function gearAura(t){ const on=S&&(S.phase==='play'||S.phase==='pause')&&S.gk, g=!!(on&&S.gk.set4), p=!!(on&&S.gk.leg); const A=GAURA, P=player.root.position;
  A.g.visible=A.gf.visible=A.gh.visible=g; A.p.visible=A.pf.visible=A.ph.visible=p; if(!g&&!p) return;
  const pu=.5+.5*Math.sin(t*3.2);
  for(const [m,y] of [[A.g,.05],[A.gf,.04],[A.p,.055],[A.pf,.045]]) m.position.set(P.x,y,P.z);
  A.g.material.opacity=.38+.22*pu; A.gf.material.opacity=.16+.1*pu; A.p.material.opacity=.5+.25*(1-pu); A.pf.material.opacity=p&&!g?.22:.0; A.p.rotation.z=t*.6;
  A.gh.position.set(P.x,1.0,P.z); A.gh.material.opacity=.1+.07*pu; A.ph.position.set(P.x,1.1,P.z); A.ph.material.opacity=(g?.09:.13)+.06*(1-pu);
  if(S.phase==='play'){ if(g&&Math.random()<.35){ const a=rr(0,6.283); ep(P.x+Math.cos(a)*.7,rr(.2,1.4),P.z+Math.sin(a)*.5,0,rr(.5,1.1),0,.6,.3,GRN); } if(p&&Math.random()<.35){ const a=rr(0,6.283); ep(P.x+Math.cos(a)*.8,rr(.2,1.6),P.z+Math.sin(a)*.55,0,rr(.5,1.1),0,.6,.3,PRP); } } }
// 빛나는 자리: 버려진 가게·차의 물건 — 뒤져서 줍는다 (괴수는 장비를 떨구지 않음)
const spotBeamTex=(()=>{ const c=document.createElement('canvas'); c.width=4; c.height=64; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'rgba(120,200,255,0)'); g.addColorStop(1,'rgba(150,220,255,.7)'); x.fillStyle=g; x.fillRect(0,0,4,64); return new THREE.CanvasTexture(c); })();
const SPOTS=[];
// v2.7.5: 그림 새로 — 손그림 물건 더미 + 바닥 빛 + 반짝이 별 (이모지 대신)
const lootPropT=[0,1,2,3].map(k=>tex(lootPropC(k)));
const sparkT=tex(sparkC()), floorGlowT=new THREE.CanvasTexture(floorGlowC());
const emberT=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,78,4,64,78,58); g.addColorStop(0,'rgba(255,230,150,.95)'); g.addColorStop(.35,'rgba(255,140,50,.75)'); g.addColorStop(1,'rgba(255,80,20,0)'); x.fillStyle=g; x.fillRect(0,0,128,128);
  x.fillStyle='#2a1610'; x.strokeStyle='#120806'; x.lineWidth=3; x.beginPath(); x.moveTo(34,96); x.lineTo(44,70); x.lineTo(62,60); x.lineTo(84,66); x.lineTo(96,90); x.lineTo(80,104); x.lineTo(48,106); x.closePath(); x.fill(); x.stroke();
  x.strokeStyle='#ffb040'; x.lineWidth=3; x.beginPath(); x.moveTo(50,78); x.lineTo(60,88); x.lineTo(72,76); x.moveTo(64,66); x.lineTo(66,74); x.moveTo(80,86); x.lineTo(88,92); x.stroke();
  x.fillStyle='#ffe090'; for(const [a,b] of [[58,84],[70,72],[84,90]]){ x.beginPath(); x.arc(a,b,2.5,0,6.3); x.fill(); }
  return new THREE.CanvasTexture(c); })();
function mkSpot(x,z,boss,shop,ember){ const g=new THREE.Group(); g.position.set(x,0,z); const col=ember?0xff7a30:boss?0xffc860:0x9ad8ff;
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshBasicMaterial({map:floorGlowT,color:col,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); fl.rotation.x=-Math.PI/2; fl.position.y=.03; g.add(fl);
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(.06,.3,4.5,10,1,true).translate(0,3.1,0),new THREE.MeshBasicMaterial({map:spotBeamTex,color:col,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false})); bm.renderOrder=1; g.add(bm);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.18,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.6,depthWrite:false,fog:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.05; g.add(ring);
  const prog=new THREE.Mesh(new THREE.RingGeometry(1.2,1.42,40,1,0,.01),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false,fog:false})); prog.rotation.x=-Math.PI/2; prog.position.y=.06; g.add(prog);
  const kind=boss?3:Math.floor(Math.random()*3);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ember?emberT:lootPropT[kind],transparent:true,depthWrite:false,fog:false})); sp.center.set(.5,.2); sp.scale.set(ember?1.6:2.5,ember?1.6:2.5,1); sp.position.y=.5; sp.renderOrder=5; g.add(sp);
  if(ember){ const hs=haloSprite(0xff8a40,3.2,.55); hs.position.y=.7; g.add(hs); }
  const sk=[]; for(let i=0;i<3;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:sparkT,color:boss?0xffe08a:0xd8f2ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); s.scale.setScalar(.4); s.position.set(0,1.4+i*.4,0); s.renderOrder=6; g.add(s); sk.push(s); }
  (FIELD?FIELD.G:worldG||scene).add(g); const o={x,z,g,sp,fl,ring,prog,sk,t:0,life:boss?999:75,boss:!!boss,ember:!!ember,ph:Math.random()*6.28,mt:0,shop:shop||null}; SPOTS.push(o); return o; }
function clearSpots(){ for(const o of SPOTS) o.g.parent&&o.g.parent.remove(o.g); SPOTS.length=0; }
function lootTick(dt,P){ if(!WORLD) return; S.spotT=(S.spotT??5)-dt;
  if(FIELD){ if(S.spotT<=0&&!S.duel) fieldSpots(P); } else if(S.spotT<=0){ S.spotT=12+Math.random()*6; if(SPOTS.filter(o=>!o.boss).length<3){ for(let tr=0;tr<8;tr++){ const a=Math.random()*6.28, d=13+Math.random()*10, x=P.x+Math.cos(a)*d, z=P.z+Math.sin(a)*d; if(Math.abs(x)>LIM-4||Math.abs(z)>LIM-4) continue; if(terr(x,z)===0||blocked(x,z)) continue; let bad=false; for(const k in SITES) if(Math.hypot(SITES[k].x-x,SITES[k].z-z)<SAFE_R+2) bad=true; if(bad) continue; mkSpot(x,z,false); toast('✨ 빛나는 자리','버려진 물건이 보인다 · 지나가면 줍는다'); break; } } }
  for(let i=SPOTS.length-1;i>=0;i--){ const o=SPOTS[i]; o.life-=dt; const tt=(S.t||0)+o.ph; const fade=Math.min(1,o.life/4);
    o.fl.material.opacity=(.4+.2*Math.sin(tt*3))*fade; o.fl.scale.setScalar(1+.08*Math.sin(tt*3)); o.sp.material.opacity=fade; o.sp.position.y=.5+.04*Math.max(0,Math.sin(tt*6))*(o.t>0?1:0);
    o.sk.forEach((s,j)=>{ const a=tt*1.3+j*2.09, k=(Math.sin(tt*4+j*1.7)+1)/2; s.position.set(Math.cos(a)*.8,1.3+j*.4+.15*Math.sin(tt*2+j),Math.sin(a)*.5+.3); s.scale.setScalar((.25+.55*k*k)*(o.boss?1.25:1)); s.material.opacity=fade; });
    o.mt-=dt; if(o.mt<=0){ o.mt=.5+Math.random()*.4; burst(o.x+(Math.random()-.5)*.8,.6,o.z+(Math.random()-.5)*.6,1,.6); }
    if(o.lock>0){ const k0=o.lock; o.lock-=dt; o.t=0; const u=1-o.lock/o.lk0; // 솟았다가 떨어진다
      o.sp.position.y=.5+Math.sin(Math.min(1,u)*Math.PI)*7; o.fl.material.color.setRGB(1,.82,.35); o.fl.scale.setScalar(1+1.4*(1-u)); o.ring.material.color.setRGB(1,.85,.4);
      if(Math.random()<.6) ep(o.x+rr(-.3,.3),o.sp.position.y,o.z,rr(-.5,.5),rr(-.5,.5),rr(-.5,.5),.5,.45,Math.random()<.5?GOLD:AMBER);
      if(Math.ceil(k0)!==Math.ceil(o.lock)&&o.lock>0) dnum(o.x,1.6,o.z,String(Math.ceil(o.lock)),'gold');
      if(o.lock<=0){ o.sp.position.y=.5; o.fl.scale.setScalar(1); o.ring.material.color.set(0xff7a30); o.fl.material.color.set(0xff7a30); epBurst(o.x,.4,o.z,30,6,.6,.5,GOLD,3); er(o.x,o.z,.3,3,.45,GOLD,1.4); DBG.shake=Math.max(DBG.shake||0,.35); try{ sfx.boom(); }catch(e){} DBG.emberFell=(DBG.emberFell||0)+1; }
      continue; }
    const d=Math.hypot(P.x-o.x,P.z-o.z), pass=!o.ember&&!o.boss; // v2.56.4(67번 7장): 재료 자리는 지나가기만 해도 줍는다
    if(d<(pass?1.9:1.2)){ o.t+=pass?9:dt; if(Math.random()<dt*8) burst(o.x,.4,o.z,1); } else o.t=Math.max(0,o.t-dt*.5);
    const need=o.ember?.4:o.boss?.8:pass?.01:1.2; if(Math.abs(o.t-(o.lt||0))>.03){ o.lt=o.t; o.prog.geometry.dispose(); o.prog.geometry=new THREE.RingGeometry(1.2,1.42,40,1,0,Math.max(.01,o.t/need*6.283)); }
    if(o.t>=need){ if(o.ember){ o.g.parent.remove(o.g); SPOTS.splice(i,1); const gr=o.gr??rollGrade(dropW('fin')); (S.emG||(S.emG=[])).push({id:o.did||'',g:gr,t:performance.now()}); S.ember=S.emG.length; if(o.did){ MPF.pk.push(o.did); MPF.drops.delete(o.did); if(o.did.includes('d')&&!o.did.includes('d'+MPF.tag)){ S.stole=(S.stole||0)+1; if(o.dpty) S.stoleP=(S.stoleP||0)+1; } } sfx.lvl(); buzz(40); DBG.shake=.2; toast(`🔥 ${o.small?'작은 불씨':'불씨 덩어리'} <span style="color:${GRADE[gr].c}">(${GRADE[gr].n})</span>`,MP.room?'이제 모두가 나를 쫓는다 · 모닥불에 닿아야 장비가 된다':'🔥 모닥불(안전지대) 빛 안에 닿으면 장비가 된다 · 쓰러지면 흘린다'); lootHud(); continue; }
      if(o.dg){ o.g.parent.remove(o.g); SPOTS.splice(i,1); duelGearPick(o.dg,o.x,o.z); continue; }
      const kd=o.shop?shopLoot(o.shop.c):o.boss?'gear':['sil','garu','soe','mat'][Math.floor(Math.random()*4)];
      if(kd!=='gear'){ o.g.parent.remove(o.g); SPOTS.splice(i,1); sfx.lvl(); buzz(30); const x2=o.boss?2:1;
        const pk=(ic,tx)=>{ dnum(P.x,PLAYER_H+.9,P.z,ic+' '+tx,'gold'); burst(o.x,.6,o.z,6,1.4); if(!SV.passTold){ SV.passTold=1; toast(ic+' '+tx,'재료는 지나가기만 해도 줍는다'); } };
        if(kd==='heal'){ S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.35); pk('💊','체력'); }
        else if(kd==='mat'){ const m=(2+Math.floor(Math.random()*3))*x2; SV.mat+=m; save(); pk('🔥','+'+m); }
        else { const m=(1+Math.floor(Math.random()*2))*x2; SV.mt[kd]=(SV.mt[kd]||0)+m; save(); pk(MTN[kd].ic,'+'+m); }
        continue; }
      const it=makeGear(rollGrade(dropW(o.boss?'mid':'spot')),kd==='gear'?null:kd); it._src=o.boss?'boss':'shop'; (S.loot||(S.loot=[])).push(it); o.g.parent.remove(o.g); SPOTS.splice(i,1); sfx.lvl(); buzz(30);
      const G=gGr(it); toast(`${gIc(it)} ${gName(it)} (${G.n})`,(o.shop?o.shop.name+'에서 · ':'')+'주웠다 · 모닥불까지 들고 가야 내 것'); if(gRank(it)>=3){ DBG.shake=.3; } lootHud(); continue; }
    if(o.life<=0){ o.g.parent.remove(o.g); SPOTS.splice(i,1); } } }
// v2.15: 화면 위 가운데 줄 쌓기 — 보스 막대/중간보스 줄(66px) 아래에 「모닥불까지」 줄을 둔다(옆으로 겹치지 않게)
function stackTop(){ const L=$('lootB'); if(!L||L.style.display==='none') return; let y=66; for(const id of ['boss','fLootT']){ const e=$(id); if(e&&e.style.display!=='none'&&getComputedStyle(e).display!=='none') y=Math.max(y,66+e.offsetHeight+5); } const v=y+'px'; if(L.style.top!==v) L.style.top=v; }
function lootHud(){ const el=$('lootB'); if(!el) return; const n=(S&&S.loot)?S.loot.length:0, k=(S&&S.ember)||0; el.style.display=(n||k)&&S.phase!=='hub'?'flex':'none'; if(n||k){ const best=n?S.loot.reduce((a,b)=>gRank(b)>gRank(a)?b:a):null; el.innerHTML=(k?`🔥 <b style="color:#ff9a40">${k}</b>`:'')+(n?` 🎒 <b style="color:${gGr(best).c}">${n}</b>`:'')+`<small>모닥불까지</small>`; }  stackTop(); }
// v2.55: 빈 칸이면 바로 입는다 · 더 센 것도 입되, 2개 이상 모인 세트 조각은 다른 것으로 바꾸지 않는다(세트가 깨지지 않게)
function autoBetter(it,cur){ if(cur.v&&cur.k==='set'&&(gearInfo().setN[cur.u]||0)>=2&&!(it.v&&it.k==='set'&&it.u===cur.u)) return false; if(cur.v&&cur.k==='leg'&&!(it.v&&it.k==='leg')) return false; return gScore(it)>gScore(cur); }
function bagTrim(){ while(SV.bag.length>40){ const eqs=new Set(Object.values(SV.eq)); let j=-1, bs=1e9; SV.bag.forEach((x,i)=>{ if(eqs.has(x.id)||x.lk) return; const sc=gRank(x)*100+x.e; if(sc<bs){ bs=sc; j=i; } }); if(j<0) break; gDisApply(SV.bag[j]); SV.bag.splice(j,1); } } // 가방이 넘치면 가장 낮은 것부터 분해
function lootConfirm(){ const L=S.loot||[]; if(!L.length) return 0; let eq=0; for(const it of L){ if(LGon()) SV.ledger.gearFrom[it.id]=[S.field||S.region||'?',it._src||'?',S.bossKey||'']; delete it._src; SV.bag.push(it); const cur=eqItem(it.s); if(!cur||autoBetter(it,cur)){ SV.eq[it.s]=it.id; eq++; } }
  bagTrim();
  const n=L.length; S.loot=[]; S.gearGot=(S.gearGot||0)+n; save(); lootHud(); return n; }

// v2.7 숙련도 (17번 2장): 판 밖에 오래 쌓이는 성장 — 많이 쓴 무기일수록 다음 판에 조금 더 세게
if(!SV.mast) SV.mast={};
const mastLv=k=>Math.min(20,Math.floor(Math.sqrt((SV.mast[k]||0)/60)));
const mastBonus=()=>{ if(FLAT||(S&&S.flat)) return 0; let n=0; for(const k in SV.mast) n+=mastLv(k); return Math.min(.3,n*.006); };
function mastAdd(){ if(!S||!S.W) return []; const up=[]; for(const k in S.W){ const t0=(S.wGot&&S.wGot[k])||0, sec=Math.max(0,(S.t||0)-t0); const b=mastLv(k); SV.mast[k]=(SV.mast[k]||0)+sec; if(mastLv(k)>b) up.push(k); } return up; }

/* ============ 괴수 생성 ============ */
const BOSS_T=300;
function gwijolPack(T='gwijol'){ const P=player.root.position, a=rr(0,6.28), R0=spawnR()*.95, sx=P.x+Math.cos(a)*R0, sz=P.z+Math.sin(a)*R0, aim=Math.atan2(P.z-sz,P.x-sx)+rr(-.12,.12), dx=Math.cos(aim), dz=Math.sin(aim), n=Math.round(rr(9,13));
  for(let i=0;i<n;i++){ const back=i*.75+rr(0,.3), side=rr(-1.2,1.2); const e=spawn(T,sx-dx*back-dz*side,sz-dz*back+dx*side); if(e){ e.pdx=dx; e.pdz=dz; } } try{ sfx.wind&&sfx.wind(); }catch(_){} }
function mangLurk(){ const P=player.root.position, f=S.face||{x:0,z:1}, a=Math.atan2(f.z,f.x)+rr(-.7,.7), r=rr(5,8); const e=spawn('mangryang',P.x+Math.cos(a)*r,P.z+Math.sin(a)*r); if(e){ e.hid=1; } }
function spawnR(){ const a=camera.aspect, camD_=FIELD?camDF:camD; const hw=TF*camD_*Math.max(a,.5)*1.15, hh=TF*camD_*1.25; return Math.min(Math.max(hw,hh)+2,22); }
function spawn(type,x,z){
  if(enemies.length>=ENEMY_CAP) return null;
  if(FIELD&&FIELD.blocked(x,z)){ let ok=false; for(let k=0;k<14&&!ok;k++){ const a=rr(0,6.28), r=1+k*.5, nx=x+Math.cos(a)*r, nz=z+Math.sin(a)*r; if(!FIELD.blocked(nx,nz)){ x=nx; z=nz; ok=true; } } if(!ok) return null; }
  const d=ET[type], reg=(FIELD&&S.field?1.55+.13*(fStar(S.field)-1):S.region==='seoulst'?1.35:S.region==='myeong'?1.7:1)*(WORLD?1+(S.distLit||0)/320:1), hpMul=(1+S.t/(WORLD?150:100)+(S.endless?(S.t-BOSS_T)/60:0))*(d.treasure?1:reg*(1+.3*(S.heat||0))*deepF(S.deep||0).mhp);
  const e={type,d,x,z,hp:d.hp*hpMul*TU('ehp'),maxhp:0,kx:0,kz:0,flash:0,ph:rr(0,10),slow:1,hitCd:new Map(),life:0,flip:false,freeze:0,burn:0,talis:null,mark:false,gold:false};
  e.maxhp=e.hp; enemies.push(e); return e;
}
function spawnAround(type,dist){
  const P=player.root.position, a=rr(0,6.28), r=dist??spawnR();
  let x=P.x+Math.cos(a)*r, z=P.z+Math.sin(a)*r; if(!WORLD){ const l=Math.hypot(x,z); if(l>ARENA-1){ x*=(ARENA-1)/l; z*=(ARENA-1)/l; } } else { x=Math.max(-LIM,Math.min(LIM,x)); z=Math.max(-LIM,Math.min(LIM,z)); }
  return spawn(type,x,z);
}
// v2.35 처음 하는 사람 도움 세기(처음 5분 동안 옅어짐)
const nbNow=()=>Math.min(1,S.nb||0)*Math.max(0,1-(S.t||0)/300);
function director(dt){
  const t=S.t; if(FIELD&&S.fLoot>0){ fieldZone(); return; }
  // v2.11: 모닥불 곁에 있는 동안엔 괴수가 새로 생기지 않는다(불 둘레 괴수 벽 막기). 그동안 닥칠 포위도 건너뜀
  if(WORLD&&S.inSafe){ S.wasSafe=1; S.spawnAcc=0; S.eliteT=Math.max(S.eliteT,t+6); for(const ev of [90,150,210,270]) if(t>=ev) S.eventsDone[ev]=1; if(FIELD) fieldZone(); else zoneCheck(); return; }
  if(!S.welc&&S.wasSafe&&(FIELD||WORLD)&&MY&&MY.fires){ S.welc=1; DBG.welcT=S.t; const P=player.root.position, nf=nearFire(P).f, c=Math.atan2(P.z-nf.z,P.x-nf.x), R=5.2, n=9;
    for(let i=0;i<n;i++){ const a=c+(i/(n-1)-.5)*3.4+rr(-.12,.12), r=R+rr(-1,1.5); spawn('shade',P.x+Math.cos(a)*r,P.z+Math.sin(a)*r); } }
  const nbF=nbNow();
  const wmul=WORLD?(1+(S.distLit||0)/500)*(S.onRoad?1.3:S.inWood?.85:1):1;
  if(WORLD?boss.alive:(S.bossSpawned&&!S.bossDead&&!S.endless)){ S.spawnAcc+=dt*Math.min(6,1+t/80)*TU('spawn'); }
  else S.spawnAcc+=dt*Math.min(MOBILE?15:18,1.4+(WORLD?Math.min(t,240):t)/10)*(1+.2*(S.heat||0))*deepF(S.deep||0).sp*wmul*TU('spawn')*(1-.25*Math.min(1.5,S.nb||0)*Math.max(0,1-t/240));
  const wispP=FIELD?(S.field==='hongdae'?.5:S.field==='namsan'?.32:.36):S.region==='seoulst'?.12:S.region==='myeong'?.4:.22;
  if((S.gHold||0)>0){ S.gHold-=dt; } else while(S.spawnAcc>=1){ S.spawnAcc-=1; spawnAround(t>(nbF>.3?50:35)&&Math.random()<wispP?'wisp':'shade'); }
  if(t>=S.eliteT){ S.eliteT+=Math.max(10,32-t/12); const n=Math.max(1,1+Math.floor(t/180)+(S.region==='seoulst'?1:S.region==='myeong'?2:0)-(nbF>.3?1:0)); for(let i=0;i<n;i++) spawnAround('elite'); }
  if(t>=S.treasureT){ S.treasureT+=45/(1+.4*upLv('lure')); spawnAround(Math.random()<.5?'toad':'magpie',spawnR()*.8); toastOnce('treasure','보물 괴수','작은 것이 무언가를 물고 달아난다'); }
  // v2.48 지역 필드: 그 지역 일반 괴수만(61번)
  const fm=FIELD&&S.field&&FIELDS[S.field]?FIELDS[S.field].mobs:null, has=k=>!fm||fm.includes(k);
  if(fm){ for(const k of fm){ const M=REGMOB[k]; if(!M) continue; const key='rm_'+k; if(S[key]===undefined) S[key]=(nbF>.3?M.t0*1.3:M.t0); if(t>=S[key]){ S[key]=t+rr(M.g[0],M.g[1]); M.f(); toastOnce('rm_'+k,ET[k].nm,M.msg,true); } } }
  // v2.5 설화 괴수
  if(!fm&&t>=(S.ygT??(S.ygT=70))){ S.ygT+=rr(55,80); spawnAround('yagwang'); toastOnce('yagwang','야광귀','신을 노리는 밤의 것이 다가온다'); }
  if(!fm&&t>=(S.gcT??(S.gcT=S.region==='namsan'?150:110))){ S.gcT+=rr(70,100); spawnAround('gangcheol'); toastOnce('gangcheol','강철이','우박 냄새가 난다 · 흰 원을 피하라'); }
  // v2.39 새 일반 괴수
  if(!fm&&t>=(S.gjT??(S.gjT=nbF>.3?75:55))){ S.gjT+=rr(24,38); gwijolPack(); toastOnce('gwijol','귀졸 떼','줄지어 내달리는 것들 · 옆으로 비켜라'); }
  if(!fm&&t>=(S.mkrT??(S.mkrT=85))){ S.mkrT+=rr(16,26); spawnAround('mokrang'); toastOnce('mokrang','목랑','뿌리로 걷는 늙은 나무 · 뿌리 둘레에선 발이 묶인다',true); }
  if(!fm&&t>=(S.imT??(S.imT=45))){ S.imT+=rr(7,12); spawnAround('imae'); toastOnce('imae','이매','산의 흐릿한 것 · 사라졌다 옆에서 나타난다',true); }
  if(!fm&&t>=(S.mgT??(S.mgT=100))){ S.mgT+=rr(9,15); if(enemies.filter(e=>e.hid&&e.d.lurk).length<4) mangLurk(); }
  if(!fm&&t>=(S.ynT??(S.ynT=WORLD?95:130))){ S.ynT+=rr(80,115); spawnAround('yeongno'); toastOnce('yeongno','영노','무엇이든 삼키는 것이 나타났다 · 괴수를 먹을수록 커진다'); }
  if(t>=(S.gpT??(S.gpT=100))){ S.gpT+=rr(140,190); spawnAround('gpig',spawnR()*.8); toastOnce('gpig','금돼지','금빛 돼지가 굴을 찾아 달아난다'); }
  for(const ev of [90,150,210,270]) if(t>=ev&&!S.eventsDone[ev]){ S.eventsDone[ev]=1; const n=24+ev/6, P=player.root.position;
    for(let i=0;i<n;i++){ const a=i/n*6.28; spawn(ev>=150&&i%3===0?'wisp':ev>=210&&i%8===0?'elite':'shade',P.x+Math.cos(a)*spawnR()*.8,P.z+Math.sin(a)*spawnR()*.8); }
    toast('저승의 것들이 에워싼다'); }
  // 선택 C3: 쓰러진 깨어난 자 (남산 아래, 한 번)
  if(S.region==='namsan'&&t>=120&&!S.npc&&!S.npcDone){ const P=player.root.position, a=rr(0,6.28);
    S.npc={x:P.x+Math.cos(a)*8,z:P.z+Math.sin(a)*8}; fallenNPC.position.set(S.npc.x,0,S.npc.z); fallenNPC.visible=true; toast('누군가 쓰러져 있다','희미한 빛이 깜빡인다'); }
  if(FIELD) fieldZone(); else if(WORLD) zoneCheck(); else if(t>=BOSS_T&&!S.bossSpawned) spawnBoss();
}

/* ============ 보스 ============ */
function spawnBoss(){
  S.bossSpawned=true; boss.fzImm=0; boss.freeze=0; const P=player.root.position; const a=rr(0,6.28); const B=BOSSDEF[S.bossKey]; boss.def=B; boss.key=S.bossKey; boss.after=0; boss.view=''; bossLook(0,1);
  const ZB=FIELD&&S.bossZid!=null?zoneById(S.bossZid):null, HM=ZB?(ZB.mid?MID_HP:FIN_HP):1;
  Object.assign(boss,{zid:ZB?ZB.id:null,hop:0,alive:true,hp:B.hp*HM*TU('bhp'),maxhp:B.hp*HM*TU('bhp'),x:P.x+Math.cos(a)*11,z:P.z+Math.sin(a)*11,state:'walk',st:0,shotT:2.5,dashT:6,ringT:7,slamT:4,summonA:false,summonB:false,dx:0,dz:0,flash:0,orbit:0,dying:0,ateIron:false,axeHit:[],cw:Math.random()<.5?1:-1,clawT:3,pounceT:6,roarT:9,shadeT:12,pose:false,chain:0,chainN:0,hops:0,after:0,wave:0,rose:0});
  { const T=B.tint||[1,1,1]; boss.mat.color.setRGB(T[0],T[1],T[2]); } Object.assign(boss,{kt:{},stun:0,shield:0,gs:1,eat:0,seg:0,fled:0,hid:0});
  boss.root.visible=true; boss.root.scale.setScalar(1); boss.mat.opacity=1; boss.mat.transparent=false; bossL.c.set(B.col); bossL.l.color.set(B.col); boss.halo.material.color.set(B.col); bossL.on=true;
  if(ZB){ let mx=MPF.bm[ZB.id]||0, bt=MPF.bt[ZB.id]||9e15; const sh=mpBossPick(ZB.id); if(bmWins(sh,mx,bt)){ mx=sh.mx; bt=sh.t; } if(!mx){ mx=bossMaxFor(ZB); bt=Date.now(); } MPF.bm[ZB.id]=mx; MPF.bt[ZB.id]=bt; boss.maxhp=mx; const od=mpBossNet(ZB.id); MPF.oSeen[ZB.id]=od; boss.hp=Math.min(mx,Math.max(1,mx-(MPF.bdmg[ZB.id]||0)+(MPF.bhl[ZB.id]||0)-od)); }
  boss.dbg=0; boss.tier=ZB?(ZB.mid?'mid':'final'):((BGIM[S.bossKey]||[])[0]||'mid'); gimReset(); // v2.56 단계 + 기믹
  if(boss.tier==='normal'){ boss.maxhp=boss.hp=nbHp(S.field||'myeong',S.bossKey); boss.summonA=boss.summonB=true; boss.zid=null;
    $('bossn').innerHTML='일반 보스 · '+B.name; $('boss').style.display='block'; sndInit(); sfx.roar(); DBG.shake=Math.max(DBG.shake||0,.4); nameBand('일반 보스',B.name,NB_COL[S.field]||'#7a7a90'); if(BOT) DBG.nbSeen=(DBG.nbSeen||0)+1; return; }
  $('bossn').innerHTML=(ZB?(ZB.mid?gi('u_mid')+' 중간보스 · ':gi('u_final')+' '):'')+B.name; $('boss').style.display='block'; sndInit(); sfx.roar(); DBG.shake=1;
  toastNow(B.name,B.line);
  if(S.ally>0) toast('쓰러져 있던 깨어난 자가 왔다','"이번엔 내가 갚을게."');
}
// v2.24 보스가 건물을 뚫고 다니지 않게: 움직인 뒤 건물 안이면 벽을 따라 미끄러진다. 1.6초 넘게 막히면 잠깐 틈을 비집고 지나간다(갇힘 방지).
function bossUpdate(dt){ const ox=boss.x, oz=boss.z; if((!boss.alive||boss.dying>0)&&(boss.gq||GMK.length||boss.dec)){ if(boss.gq) gimEnd(true); gimOff(); } bossUpdate0(dt);
  if(!FIELD||!boss.alive||boss.dying>0) return; const r=Math.max(.6,(boss.def&&boss.def.r||1.4)*.5);
  const bl=(x,z)=>blocked(x,z)||blocked(x+r,z)||blocked(x-r,z)||blocked(x,z+r)||blocked(x,z-r);
  if(/jump|dive|pounce|vanish|rise/.test(boss.state||'')) return; // 뛰어오른 동안은 지붕을 넘는다
  if(!bl(boss.x,boss.z)){ boss._stk=0; return; }
  if(bl(ox,oz)){ for(let k=1;k<=8;k++) for(let i=0;i<12;i++){ const a=i/12*6.283, nx=boss.x+Math.cos(a)*k*.6, nz=boss.z+Math.sin(a)*k*.6; if(!bl(nx,nz)){ boss.x+=(nx-boss.x)*Math.min(1,dt*6); boss.z+=(nz-boss.z)*Math.min(1,dt*6); return; } } return; }
  boss._stk=(boss._stk||0)+dt; if(boss._stk>1.6&&boss._stk<2.6) return;
  if(boss._stk>=2.6) boss._stk=0;
  const dash=/dash|charge|claw|lunge/.test(boss.state||'');
  if(!bl(boss.x,oz)) boss.z=oz; else if(!bl(ox,boss.z)) boss.x=ox; else { boss.x=ox; boss.z=oz; }
  if(dash&&!boss._bonk){ boss._bonk=.5; DBG.shake=Math.max(DBG.shake||0,.25); burst(boss.x,1,boss.z,8,2); sfx.hit&&sfx.hit(); } }
function bossUpdate0(dt){
  if(boss._bonk>0) boss._bonk-=dt;
  if(!boss.alive) return;
  const P=player.root.position, dx=P.x-boss.x, dz=P.z-boss.z, d=Math.hypot(dx,dz)||1, B=boss.def;
  if(boss.dying>0){ boss.dying-=dt; boss.mat.opacity=Math.max(0,boss.dying/1.8); boss.root.scale.setScalar(1+(1.8-boss.dying)*.15);
    if(Math.random()<.6) burst(boss.x+rr(-1,1),rr(.5,2.5),boss.z+rr(-.5,.5),3,3);
    if(boss.dying<=0){ boss.alive=false; boss.root.visible=false; bossL.on=false; bossL.l.intensity=0; slamRing.visible=false; bossDefeated(); } return; }
  boss.st+=dt; boss.flash=Math.max(0,boss.flash-dt*6); boss.orbit+=dt*2;
  const hpR=boss.hp/boss.maxhp, fz=boss.freeze>0||boss.gFrz>0; if(boss.freeze>0){ boss.freeze-=dt; } if(boss.fzImm>0) boss.fzImm-=dt;
  if(!boss.summonA&&hpR<.7){ boss.summonA=true; summonRing(14); sfx.roar(); }
  if(!boss.summonB&&hpR<.35){ boss.summonB=true; summonRing(20); sfx.roar(); }
  if(B.kit){ kitUpdate(dt,P,dx,dz,d,hpR,fz); }
  else if(S.bossKey==='imugi'){ imugiUpdate(dt,P,dx,dz,d,hpR,fz); }
  else if(S.bossKey==='tiger'){ tigerUpdate(dt,P,dx,dz,d,hpR,fz); }
  else if(S.bossKey==='gumiho'){
    if(boss.state==='walk'){
      const want=d>6?1:d<3.5?-1:0, tx=dx/d, tz=dz/d, sx=-tz, sz=tx, sp=fz?0:2.4*(hpR<.5?1.2:1);
      const vx=(tx*want+sx*.8)*sp, vz=(tz*want+sz*.8)*sp; boss.x+=vx*dt; boss.z+=vz*dt; if(sp) bossLook(vx,vz);
      if(!fz){ boss.shotT-=dt; boss.dashT-=dt; boss.ringT-=dt; }
      if(boss.shotT<=0){ boss.shotT=hpR<.5?1.4:1.9; const n=hpR<.5?7:5, base=Math.atan2(dz,dx); for(let i=0;i<n;i++){ const a=base+(i-(n-1)/2)*.27; shot(boss.x,boss.z,a,5.6); } }
      if(boss.ringT<=0){ boss.ringT=hpR<.5?3.6:6; const n=hpR<.5?22:16, off=rr(0,1); for(let i=0;i<n;i++) shot(boss.x,boss.z,(i+off)/n*6.28,4.6,.55); }
      if(boss.dashT<=0&&d<16){ boss.state='tele'; boss.st=0; boss.dx=dx/d; boss.dz=dz/d; teleMesh.visible=true; boss.chain=hpR<.5?2:hpR<.75?1:0; }
    } else if(boss.state==='tele'){
      bossLook(boss.dx,boss.dz); teleMesh.position.set(boss.x,.06,boss.z); teleMesh.rotation.z=Math.atan2(boss.dx,-boss.dz)+Math.PI; teleMesh.scale.set(1.6,12,1);
      teleMesh.material.opacity=.4+.6*Math.abs(Math.sin(boss.st*14));
      if(boss.st>(boss.chainN?.45:.85)){ boss.state='dash'; boss.st=0; teleMesh.visible=false; DBG.shake=Math.max(DBG.shake||0,.6); bossPose(true); }
    } else if(boss.state==='dash'){
      boss.x+=boss.dx*18*dt; boss.z+=boss.dz*18*dt; if(Math.random()<.5) burst(boss.x,1,boss.z,1,1);
      boss.trT=(boss.trT||0)-dt; if(boss.trT<=0&&foxShots.length<60){ boss.trT=.09; foxShots.push({x:boss.x,z:boss.z,y:.9,vx:rr(-.4,.4),vz:rr(-.4,.4),life:2.2,wait:.55}); } // 지나간 자리에 여우불
      if(boss.st>.6){ bossPose(false); if((boss.chain||0)>0){ boss.chain--; boss.chainN=1; boss.state='tele'; boss.st=0; const l=Math.hypot(dx,dz)||1; boss.dx=dx/l; boss.dz=dz/l; teleMesh.visible=true; } else { boss.chainN=0; boss.state='walk'; boss.dashT=hpR<.5?3.5:5; } }
    }
  } else if(S.bossKey==='dokkaebi'){ // 도깨비: 외다리로 깡충 뛰어 내리찍고, 도깨비불을 흩뿌리고, 사라졌다 뒤에서 나타난다
    if(boss.state==='walk'){
      const sp=fz?0:1.4, vx=dx/d*sp, vz=dz/d*sp; boss.x+=vx*dt; boss.z+=vz*dt; if(sp) bossLook(vx,vz); boss.hop=Math.abs(Math.sin(boss.st*7))*.35;
      if(!fz){ boss.slamT-=dt; boss.shotT-=dt; boss.dashT-=dt; }
      if(boss.shotT<=0){ boss.shotT=hpR<.5?2.4:3.4; const n=hpR<.5?14:9, off=rr(0,1); for(let i=0;i<n;i++) shot(boss.x,boss.z,(i+off)/n*6.28,3.6+(i%2)*1.4,.5); }
      if(boss.dashT<=0){ boss.state='vanish'; boss.st=0; burst(boss.x,1.5,boss.z,22,4); sfx.laugh(); }
      else if(boss.slamT<=0){ boss.state='jump'; boss.st=0; boss.jx=P.x+rr(-1,1); boss.jz=P.z+rr(-1,1); boss.sx=boss.x; boss.sz=boss.z; slamRing.visible=true; bossPose(true); if(!boss.hops) boss.hops=hpR<.5?2:0; }
    } else if(boss.state==='jump'){
      const k=Math.min(1,boss.st/1.1), R=3.2; boss.x=boss.sx+(boss.jx-boss.sx)*k; boss.z=boss.sz+(boss.jz-boss.sz)*k; boss.hop=Math.sin(k*Math.PI)*3.2; bossLook(boss.jx-boss.sx,boss.jz-boss.sz);
      slamRing.position.set(boss.jx,.06,boss.jz); slamRing.scale.setScalar(R*2.2*Math.min(1,boss.st/.8)); slamRing.material.opacity=.5+.5*Math.abs(Math.sin(boss.st*12));
      if(k>=1){ slamRing.visible=false; boss.hop=0; DBG.shake=Math.max(DBG.shake||0,.7); fx(boss.x,boss.z,R,[.4,.65,1],.35); sfx.boom();
        if(Math.hypot(P.x-boss.x,P.z-boss.z)<R) hurtPlayer(28,true);
        const n=hpR<.5?12:8; for(let i=0;i<n;i++) shot(boss.x,boss.z,i/n*6.28,5.2);
        bossPose(false); if(boss.hops>0){ boss.hops--; boss.state='jump'; boss.st=.25; boss.jx=P.x+rr(-1,1); boss.jz=P.z+rr(-1,1); boss.sx=boss.x; boss.sz=boss.z; slamRing.visible=true; bossPose(true); } else { boss.hops=0; boss.state='walk'; boss.slamT=hpR<.5?2.6:3.8; } }
    } else if(boss.state==='vanish'){
      boss.mat.opacity=Math.max(0,1-boss.st/.4); boss.mat.transparent=true;
      if(boss.st>1.1){ const a=Math.atan2(-(S.face||{z:1}).z,-(S.face||{x:0}).x); boss.x=P.x+Math.cos(a)*4.5; boss.z=P.z+Math.sin(a)*4.5; boss.mat.opacity=1; boss.mat.transparent=false;
        burst(boss.x,1.5,boss.z,22,4); toast('뚝딱!','도깨비가 등 뒤에 나타났다'); boss.state='walk'; boss.dashT=hpR<.5?7:10; boss.slamT=.6;
        if(hpR<.6){ for(let i=0;i<4;i++) spawnAround('wisp',6); } }
    }
  } else { // 불가사리: 느리게 다가와 내리찍고, 쇠 바늘을 뿜고, 들이받는다. 쇠(도끼)를 먹으면 체력이 찬다
    if(boss.after>0){ boss.after-=dt; if(boss.after<=0){ fx(boss.x,boss.z,6.5,[1,.55,.3],.45); DBG.shake=Math.max(DBG.shake||0,.5); const n=14; for(let i=0;i<n;i++) shot(boss.x,boss.z,(i+.5)/n*6.28,4.2); } } // 여진
    if(boss.state==='walk'){
      const sp=fz?0:1.7*(hpR<.5?1.25:1), vx=dx/d*sp, vz=dz/d*sp; boss.x+=vx*dt; boss.z+=vz*dt; if(sp) bossLook(vx,vz);
      if(!fz){ boss.slamT-=dt; boss.dashT-=dt; boss.shotT-=dt; }
      if(boss.shotT<=0){ boss.shotT=hpR<.5?2.2:3; const base=Math.atan2(dz,dx); for(let i=-3;i<=3;i++) shot(boss.x,boss.z,base+i*.2,6.5); }
      if(boss.slamT<=0&&d<7){ boss.state='slam'; boss.st=0; slamRing.visible=true; bossPose(true); }
      else if(boss.dashT<=0&&d>=6&&d<18){ boss.state='tele'; boss.st=0; boss.dx=dx/d; boss.dz=dz/d; teleMesh.visible=true; }
    } else if(boss.state==='slam'){
      const R=4.2; slamRing.position.set(boss.x,.06,boss.z); slamRing.scale.setScalar(R*2.2*Math.min(1,boss.st/.9)); slamRing.material.opacity=.5+.5*Math.abs(Math.sin(boss.st*12));
      if(boss.st>1.0){ slamRing.visible=false; DBG.shake=Math.max(DBG.shake||0,.8); sfx.ironChew(); fx(boss.x,boss.z,R,[1,.5,.3],.35);
        if(d<R) hurtPlayer(32,true);
        const n=hpR<.5?18:12; for(let i=0;i<n;i++) shot(boss.x,boss.z,i/n*6.28+rr(0,.3),6);
        bossPose(false); if(hpR<.5){ boss.after=.5; } boss.state='walk'; boss.slamT=hpR<.5?3.5:4.8; }
    } else if(boss.state==='tele'){
      bossLook(boss.dx,boss.dz); teleMesh.position.set(boss.x,.06,boss.z); teleMesh.rotation.z=Math.atan2(boss.dx,-boss.dz)+Math.PI; teleMesh.scale.set(2.2,14,1);
      teleMesh.material.opacity=.4+.6*Math.abs(Math.sin(boss.st*14));
      if(boss.st>1.0){ boss.state='dash'; boss.st=0; teleMesh.visible=false; DBG.shake=Math.max(DBG.shake||0,.6); }
    } else if(boss.state==='dash'){
      boss.x+=boss.dx*15*dt; boss.z+=boss.dz*15*dt; if(Math.random()<.5) burst(boss.x,.5,boss.z,1,1);
      if(boss.st>.85){ boss.state='walk'; boss.dashT=hpR<.5?5:7; }
    }
  }
  gimUpdate(dt,P,dx,dz,d,hpR); // v2.56 기믹 부품(한 번에 하나)
  if(!WORLD){ const bl=Math.hypot(boss.x,boss.z); if(bl>ARENA-2){ boss.x*=(ARENA-2)/bl; boss.z*=(ARENA-2)/bl; } }
  if(d<1.0&&!/gvanish|gdive|gjump/.test(boss.state)) hurtPlayer((boss.state==='dash'?60:22)*dt);
}

/* ============ v2.48 서울 5지역 보스 뼈대(61번) ============
   kit: mv 움직임(chase 다가옴 · circle 빙빙 · keep 거리 둠 · still 거의 서 있음), fan [수,간격,속도,간격초], ring [수,속도,간격초],
   dash [간격초,속도,시간], slam [간격초,반지름,피해], sum [괴수,수,간격초], gim 원전 기믹 한 줄 */
function addHaz(x,z,R,t,dps,k){ const H=S.haz||(S.haz=[]); if(H.length>40) H.shift(); H.push({x,z,R,t,dps,k}); }
function kitUpdate(dt,P,dx,dz,d,hpR,fz){ const B=boss.def, K=B.kit, T=boss.kt, ag=hpR<.5?1.25:1; if(boss.gFrz>0) fz=true;
  if(boss.stun>0){ boss.stun-=dt; boss.hop=Math.abs(Math.sin(boss.st*20))*.08; return; }
  const tick=(k,v)=>{ if(T[k]===undefined) T[k]=v*.6; if(!fz) T[k]-=dt*ag; return T[k]<=0; };
  // v2.56: 기믹(부품)이 몸을 쓰는 동안은 뼈대가 쉰다 — 기믹은 gimUpdate가 돌린다
  if(boss.state==='gim') return;
  if(boss.state==='tele'){ bossLook(boss.dx,boss.dz); teleMesh.position.set(boss.x,.06,boss.z); teleMesh.rotation.z=Math.atan2(boss.dx,-boss.dz)+Math.PI; teleMesh.scale.set(boss.tw||1.8,boss.tl||13,1);
    teleMesh.material.opacity=.4+.6*Math.abs(Math.sin(boss.st*14)); if(boss.st>(boss.tt||.8)){ boss.state='dash'; boss.st=0; teleMesh.visible=false; DBG.shake=Math.max(DBG.shake||0,.5); bossPose(true); } return; }
  if(boss.state==='dash'){ const v=boss.dv||16; boss.x+=boss.dx*v*dt; boss.z+=boss.dz*v*dt; if(Math.random()<.5) burst(boss.x,.8,boss.z,1,1);
    if(boss.gims&&boss.gims.includes('ram')&&boss._bonk>.45){ boss.state='walk'; boss.stun=1.6; bossPose(false); toast('쿵!','벽에 박혀 멈췄다 · 지금 때려라'); return; }
    if(boss.st>(boss.dd||.7)){ bossPose(false); boss.state='walk'; boss.tl=13; boss.tw=1.8; } return; }
  if(boss.state==='slam'){ const R=boss.sR; slamRing.position.set(boss.x,.06,boss.z); slamRing.scale.setScalar(R*2.2*Math.min(1,boss.st/.9)); slamRing.material.opacity=.5+.5*Math.abs(Math.sin(boss.st*12));
    if(boss.st>1){ slamRing.visible=false; DBG.shake=Math.max(DBG.shake||0,.7); fx(boss.x,boss.z,R,B.shot,.35); sfx.boom(); if(d<R) hurtPlayer(boss.sD,true); const n=hpR<.5?14:10; for(let i=0;i<n;i++) shot(boss.x,boss.z,i/n*6.28+rr(0,.3),5.4); bossPose(false); boss.state='walk'; boss.after=.4; } return; } // v2.54 내려찍은 뒤 멈칫
  // 걷기
  let vx=0,vz=0; const sp=(fz||boss.after>0)?0:K.sp*(hpR<.5?1.15:1)*(boss.gs>1?.85:1);
  if(boss.fled){ const w=d<5?-1.1:d>8?.7:0, sx=-dz/d, sz=dx/d; vx=(dx/d*w+sx*.35)*sp; vz=(dz/d*w+sz*.35)*sp; } // v2.49 달아나도 5~8칸 안에서 맴돈다
  else if(K.mv==='chase'){ vx=dx/d*sp; vz=dz/d*sp; }
  else if(K.mv==='circle'){ const want=d>7?1:d<4?-1:0, sx=-dz/d*(boss.cw||1), sz=dx/d*(boss.cw||1); vx=(dx/d*want+sx*.85)*sp; vz=(dz/d*want+sz*.85)*sp; }
  else if(K.mv==='keep'){ const kr=K.kr||[6,9], want=d>kr[1]?1:d<kr[0]?-1:0, sx=-dz/d, sz=dx/d; vx=(dx/d*want+sx*.4)*sp; vz=(dz/d*want+sz*.4)*sp; }
  else { vx=dx/d*sp*.5; vz=dz/d*sp*.5; }
  boss.x+=vx*dt; boss.z+=vz*dt; if(vx||vz) bossLook(vx,vz);
  { const Z=FIELD&&boss.zid!=null?zoneById(boss.zid):null; if(Z){ const lx=boss.x-Z.x, lz=boss.z-Z.z, ll=Math.hypot(lx,lz), LR=22; if(ll>LR){ boss.x=Z.x+lx/ll*LR; boss.z=Z.z+lz/ll*LR; } } } // v2.49 걷는 보스는 구역(22칸) 밖으로 못 나간다
  if(K.fan&&tick('fan',K.fan[3])){ T.fan=K.fan[3]; const n=K.fan[0]+(hpR<.5?2:0), base=Math.atan2(dz,dx); for(let i=0;i<n;i++) shot(boss.x,boss.z,base+(i-(n-1)/2)*K.fan[1],K.fan[2]); }
  if(K.ring&&tick('ring',K.ring[2])){ T.ring=K.ring[2]; const n=K.ring[0]+(hpR<.5?6:0), off=rr(0,1); for(let i=0;i<n;i++) shot(boss.x,boss.z,(i+off)/n*6.28,K.ring[1],.5); }
  if(K.sum&&tick('sum',K.sum[2])){ T.sum=K.sum[2]; if(K.sum[0]==='gwijol') gwijolPack('gwijol'); else for(let i=0;i<K.sum[1];i++){ const a=i/K.sum[1]*6.28; spawn(K.sum[0],boss.x+Math.cos(a)*3,boss.z+Math.sin(a)*3); } }
  if(K.slam&&d<K.slam[1]+3&&tick('slam',K.slam[0])){ T.slam=K.slam[0]; boss.state='slam'; boss.st=0; boss.sR=K.slam[1]; boss.sD=K.slam[2]; slamRing.visible=true; bossPose(true); return; }
  if(K.dash&&d>3&&d<18&&tick('dash',K.dash[0])){ T.dash=K.dash[0]; boss.state='tele'; boss.st=0; boss.dx=dx/d; boss.dz=dz/d; boss.dv=K.dash[1]; boss.dd=K.dash[2]; boss.tt=.8; teleMesh.visible=true; return; }
}

/* ============ v2.56 보스 기믹 부품 22개 (66번 기믹표) ============
   보스마다 gims 배열(일반 1 · 중간 2 · 파이널 3)을 번갈아 하나씩만 켠다. 모든 부품은 예고(바닥 표시+색+소리) → 발동 → 끝.
   색 약속: 붉은·보라 바닥 = 피할 곳 · 초록 원 = 들어갈 곳 · 금빛 = 밟을 것 · 푸른 테두리 = 멈출 때.
   피해 = 최대 체력 대비 % × 단계 배율(일반 0.7 · 중간 1 · 파이널 1.2 · 2단계 ×1.15). 거리는 66번 m × GU(걷기 3.3칸/초에 맞춤).
   파이널은 체력 50%에서 2단계: 0.8초 멈칫 + 이름 띠 다시 + 예고 -0.2초 + 보스마다 2단계 특수(간단한 형태). 카메라는 흔들림만. */
const GU=.8;
const GIMP={
  segments:{w:1.0,R:.8,dmg:6,dur:8,cd:12}, steal:{w:1.0,R:1.2,dmg:0,dur:3,cd:10}, flee:{w:.8,R:1,dmg:5,dur:6,cd:999},
  devour:{w:1.5,R:4,dmg:0,dur:2,cd:6}, ram:{w:1.2,R:2,L:18,dmg:14,dur:1.6,cd:8}, pull:{w:1.2,R:10,dmg:4,dur:2.5,cd:14},
  burrow:{w:1.2,R:2.5,dmg:18,dur:.5,cd:9}, poison:{w:1.0,R:3,dmg:3,dur:6,cd:10}, blink:{w:.9,R:2,dmg:12,dur:0,cd:8},
  eatfire:{w:1.5,R:4,dmg:0,dur:3,cd:12}, eclipse:{w:1.5,R:5,dmg:0,dur:3.2,cd:16}, coil:{w:1.2,R:9,dmg:10,dur:2.5,cd:12},
  barrier:{w:1.0,R:6,dmg:8,dur:6,cd:14}, peck:{w:.9,R:1.2,L:14,dmg:16,dur:0,cd:5}, leap:{w:1.2,R:5,dmg:22,dur:1.0,cd:14},
  debris:{w:1.5,R:1.8,n:6,dmg:10,dur:2,cd:12}, safezone:{w:2.0,R:3.5,dmg:25,dur:3,cd:20}, spin:{w:1.5,R:1,L:12,dmg:8,dur:5,cd:16},
  ringwave:{w:1.2,R:14,dmg:12,dur:2,cd:10}, decoy:{w:1.0,R:1.5,dmg:6,dur:8,cd:15}, freeze:{w:.8,R:0,dmg:10,dur:1.5,cd:12}, orb:{w:1.0,R:1.2,dmg:0,dur:6,cd:18},
  ssireum:{w:1.2,R:4,dmg:0,dur:7,cd:16} // 도깨비 2단계 씨름판(부품 아님 · 2단계에만)
};
// 보스마다 [단계, 기믹]. 66번 7장 JSON (지역 이름은 게임 키로: myeongdong→myeong · gyeongbok→gyeong)
const BGIM={
  gumiho:['mid',['blink','orb']], jine:['mid',['segments','poison']], yagwangK:['mid',['steal','flee']],
  giltal:['mid',['decoy','flee']], agwi:['mid',['poison','devour']], dueok:['mid',['ram','debris']],
  bulgasari:['mid',['devour','ram']], mulgwi:['mid',['pull','poison']], jireongi:['mid',['burrow','safezone']],
  tiger:['mid',['leap','ringwave']], gyoryong:['mid',['poison','spin']], mulgoe:['mid',['blink','poison']],
  bulgae:['mid',['eclipse','ram']], gureong:['mid',['coil','pull']], jangseung:['mid',['barrier','freeze']],
  dokkaebi:['final',['decoy','leap','ringwave']], bibi:['final',['devour','leap','debris']], imugi:['final',['coil','leap','spin']],
  haechi:['final',['eatfire','leap','ram']], datbal:['final',['peck','spin','debris']], queen:['final',['eclipse','coil','safezone']],
  chunjwi:['normal',['decoy']], ahopmeori:['normal',['orb']], juji:['normal',['ram']], hyungjo:['normal',['freeze']],
  keunmulgogi:['normal',['leap']], keunjara:['normal',['ram']], okmungaeguri:['normal',['burrow']], saseumgae:['normal',['ringwave']],
  kkamagwi:['normal',['safezone']], sirang:['normal',['blink']]
};
// 보스마다 부품 손질(원전·랜드마크). 사람 이름·사연 없음(1·2막)
const GOPT={
  agwi:{poison:{fire:1}}, giltal:{flee:{pack:1}}, okmungaeguri:{burrow:{n:3,cry:1}}, jireongi:{safezone:{stun:3}},
  kkamagwi:{safezone:{dmg:12,w:1.7,move:1.1}}, ahopmeori:{orb:{roll:1}}, juji:{ram:{L:16}}, keunjara:{ram:{L:16}},
  tiger:{leap:{line:'담을 넘어 뛰어든다'}}, haechi:{leap:{line:'지붕에서 뛰어내린다'}}, dokkaebi:{leap:{line:'언덕 계단에서 뛰어내린다'}},
  bibi:{leap:{line:'하늘로 솟는다'}}, imugi:{leap:{line:'강물에서 튀어 오른다'}}, keunmulgogi:{leap:{line:'물에서 솟구친다'}},
  datbal:{debris:{n:5,line:'봉수대 불이 떨어진다'}}, dueok:{debris:{line:'벽 조각이 떨어진다'}}, bibi2:{}
};
// 일반 보스(새 단계): 지역마다 2종 · 필드를 돌아다님 · 15~25초 · 지역 색 띠
const NB={myeong:['chunjwi','ahopmeori'],hongdae:['juji','hyungjo'],seongsu:['keunmulgogi','keunjara'],gyeong:['okmungaeguri','saseumgae'],namsan:['kkamagwi','sirang']};
const NB_COL={myeong:'#4a90e0',hongdae:'#a060e0',seongsu:'#e07a30',gyeong:'#c89a20',namsan:'#3aa860'};
const NB_HPK=.27; // 체력 = 그 지역 중간보스 평균의 약 30%(시험 뒤 27%: 15~25초 가운데로)
function nbHp(fk,k){ const F=FIELDS[fk]||FIELDS.myeong, m=F.mids.reduce((a,q)=>a+BOSSDEF[q].hp,0)/F.mids.length; return Math.round(m*MID_HP*bossLvF(S.lv|0)*deepF(S.deep||0).bhp*TU('bhp')*NB_HPK*((BOSSDEF[k]||{}).nbk||1)*(DBG.nbK||1)); } // nbk = 보스마다 움직임(빙빙·숨기)에 맞춘 손질(시험값)
function nbPlan(){ const n=Math.random()<.5?1:2; S.nbT=[]; for(let i=0;i<n;i++) S.nbT.push(rr(180,480)); S.nbT.sort((a,b)=>a-b); S.nbI=Math.floor(Math.random()*2); }
function inOpenZone(P){ return !!(MY&&MY.zones&&MY.zones.find(Z=>!MPF.bd.includes(Z.id)&&(Z.mid||midsDone())&&Math.hypot(P.x-Z.x,P.z-Z.z)<Z.r+3)); }
function nbTick(P){ if(!S||S.phase!=='play'||!FIELD||!S.field||!NB[S.field]) return; if(S.nbT===undefined) nbPlan(); if(!S.nbT.length) return;
  if(S.t>660){ S.nbT.length=0; return; }
  if(S.duel||S.t<S.nbT[0]||boss.alive||S.fLoot>0||S.doom||S.inSafe||S.down||inOpenZone(P)) return;
  S.nbT.shift(); const L=NB[S.field]; nbSpawn(L[(S.nbI++)%2]); }
function nbSpawn(k){ S.bossKey=k; S.bossZone=S.field; S.bossZid=null; spawnBoss(); }
function nbHide(msg){ boss.alive=false; boss.root.visible=false; bossL.on=false; bossL.l.intensity=0; slamRing.visible=false; teleMesh.visible=false; $('boss').style.display='none'; if(boss.gq) gimEnd(true); gimOff(); if(msg) toast(josaGa(boss.def.name)+' 물러났다',msg); if(BOT) DBG.nbGone=(DBG.nbGone||0)+1; }
// 일반 보스는 중간보스·파이널과 같이 싸우지 않는다: 보스가 없을 때만 나오고, 열린 보스 구역에 들어서거나 멀리(40칸) 떨어지면 물러난다
function nbLeash(P){ if(S.fLoot>0||S.doom) return nbHide(''); if(inOpenZone(P)) return nbHide('보스 구역의 기운에 밀려났다'); if(Math.hypot(P.x-boss.x,P.z-boss.z)>40) return nbHide('멀어지자 어둠 속으로 사라졌다'); }
function nbDefeated(){ $('boss').style.display='none'; gimOff(); const o=nbossDrop(boss.x,boss.z); S.nbKill=(S.nbKill||0)+1; setTimeout(()=>{ if(S&&S.phase==='play') toast('🔥 불씨가 떨어졌다','일반 보스가 남긴 것 · 주워서 모닥불로'); },900); if(BOT) (DBG.nbKill||(DBG.nbKill=[])).push({k:boss.key,t:+S.t.toFixed(1),gr:o?o.gr:-1}); }
// 이름 띠: 화면 위 가운데 1.2초
function nameBand(top,name,col,strong){ let el=$('nbBan'); if(!el){ el=document.createElement('div'); el.id='nbBan'; document.body.appendChild(el); const st=document.createElement('style');
    st.textContent='#nbBan{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:30;pointer-events:none;text-align:center;padding:5px 34px 6px;opacity:0;transition:opacity .18s;white-space:nowrap;color:#fff;text-shadow:0 2px 3px #000,0 0 8px rgba(0,0,0,.6)}#nbBan small{display:block;font-size:11px;letter-spacing:4px;font-weight:700;opacity:.92}#nbBan b{display:block;font-size:19px;font-weight:900;letter-spacing:3px}#nbBan.on{opacity:1}';
    document.head.appendChild(st); }
  const a=strong?'f0':'b8'; el.innerHTML=(top?`<small>${top}</small>`:'')+`<b>${name}</b>`; el.style.background=`linear-gradient(90deg,${col}00,${col}${a} 16%,${col}${a} 84%,${col}00)`; el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('on'),DBG.bandMs||1200); }
const josaGa=s=>{ const c=s.charCodeAt(s.length-1)-0xAC00; return s+(c>=0&&c<11172&&c%28?'이':'가'); };
const hexC=n=>'#'+(n>>>0).toString(16).padStart(6,'0');
// 바닥 표시(한 틀마다 새로 그림)
const GMK=[];
const CR=[1,.22,.26], CP=[.78,.36,1], CG=[.3,1,.45], CY=[1,.82,.28], CB=[.45,.75,1], CW=[1,1,1], CK=[.1,.07,.12];
const angDiff=(a,b)=>{ let q=a-b; while(q>Math.PI) q-=6.2832; while(q<-Math.PI) q+=6.2832; return q; };
const pls=(f=10)=>.6+.4*Math.abs(Math.sin(S.t*f));
const mD=(x,z,R,c,a=1)=>{ GMK.push(['d',x,z,R*2,R*2,c[0]*a,c[1]*a,c[2]*a,0]); };
const mR=(x,z,R,c,a=1)=>{ GMK.push(['r',x,z,R*2,R*2,c[0]*a,c[1]*a,c[2]*a,0]); };
const mL=(x,z,dx,dz,L,W,c,a=1)=>{ GMK.push(['l',x+dx*L/2,z+dz*L/2,W,L,c[0]*a,c[1]*a,c[2]*a,Math.atan2(-dx,-dz)]); };
function mArc(x,z,R,gA,gW,c,a=1,sz=.3){ const n=Math.max(12,Math.round(R*6.283/.7)); for(let i=0;i<n;i++){ const an=i/n*6.283; if(gW&&Math.abs(angDiff(an,gA))<gW/2) continue; mD(x+Math.cos(an)*R,z+Math.sin(an)*R,sz,c,a); } }
function freeAt(x,z){ if(!blocked(x,z)) return [x,z]; for(let r=1;r<=7;r+=1) for(let k=0;k<8;k++){ const a=k*.785+r*.3, tx=x+Math.cos(a)*r, tz=z+Math.sin(a)*r; if(!blocked(tx,tz)) return [tx,tz]; } return [x,z]; }
const bDir=()=>{ const P=player.root.position, dx=P.x-boss.x, dz=P.z-boss.z, d=Math.hypot(dx,dz)||1; return [dx/d,dz/d,d]; };
const TIER_M={normal:.7,mid:1,final:1.2}, P2_M=1.15;
const gTM=()=>(TIER_M[boss.tier]||1)*(boss.p2?P2_M:1)*(boss.atkM||1);
const gDmg=p=>S.maxhp*p/100*gTM()/deepF(S.deep||0).dmg; // 깊이 배수는 지우고 % 그대로
function gHit(p){ if(BOT){ const L=DBG.gimHit||(DBG.gimHit={}); L[boss.gq?boss.gq.k:'?']=(L[boss.gq?boss.gq.k:'?']||0)+1; } hurtPlayer(gDmg(p),true); }
const afterPause=()=>{ if(S.bossKey!=='bulgasari') boss.after=.4; };
function gimLog(k,w){ if(!BOT&&!DBG.gimRec) return; const L=DBG.gim||(DBG.gim={}), b=L[boss.key]||(L[boss.key]={}), e=b[k]||(b[k]={w:0,a:0,t:+S.t.toFixed(1)}); e[w]++; }
function gimReset(){ boss.gq=null; boss.gcd={}; boss.gGap=2.5; boss.gi=0; boss.gst=0; boss.p2=0; boss.vuln=0; boss.atkM=1; boss.fled=0; boss.fledDone=0; boss.gFrz=0; boss.gRed=0; boss.gLean=0; boss.gForce=null; gimOff();
  const D=BGIM[boss.key]; boss.gims=D?D[1].slice():[]; boss.gopt=JSON.parse(JSON.stringify(GOPT[boss.key]||{})); }
function gimOff(){ GMK.length=0; boss.dec=null; boss.sh.material.opacity=.85; frzV(false); eclEye(false); boss.gFrz=0; boss.gRed=0; }
function gimStart(k){ const p=GIM[k], o=Object.assign({},GIMP[k],boss.gopt[k]||{}); const w=o.w+(boss.tier==='normal'?.3:0)-(boss.p2?.2:0);
  const G={k,t:0,ph:'w',w:Math.max(.6,w),o,body:!!p.body,n:p.rep?(o.n||1):1}; boss.gq=G; boss.gcd[k]=o.cd; if(G.body){ boss.state='gim'; boss.st=0; } S.gHold=.5; gimLog(k,'w'); if(p.w0) p.w0(G); }
function gimEnd(forced){ const G=boss.gq; if(!G) return; const p=GIM[G.k]; try{ if(p.end) p.end(G,forced); }catch(e){} boss.gq=null; boss.gRed=0; boss.gLean=0;
  if(G.body||forced){ boss.mat.opacity=1; boss.mat.transparent=false; bossPose(false); boss.hop=0; if(!(boss.gst>0)) boss.state='walk'; }
  boss.gGap=boss.tier==='final'?1.5:boss.tier==='normal'?2.5:2; }
function gimPick(hpR){ const L=boss.gims; if(boss.gForce){ const k=boss.gForce; boss.gForce=null; return k; }
  for(let i=0;i<L.length;i++){ const k=L[(boss.gi+i)%L.length], p=GIM[k]; if(!p||(boss.gcd[k]||0)>0) continue; if(p.ok&&!p.ok(hpR)) continue; boss.gi=(boss.gi+i+1)%L.length; return k; } return null; }
function gimUpdate(dt,P,dx,dz,d,hpR){ GMK.length=0; if(!boss.gims) return;
  for(const k in boss.gcd) if(boss.gcd[k]>0) boss.gcd[k]-=dt;
  if(boss.vuln>0){ boss.vuln-=dt; if(Math.random()<dt*8) burst(boss.x,rr(.5,2.5),boss.z,1,1.5); } if(boss.shield>0) boss.shield-=dt; if(boss.gFrz>0) boss.gFrz-=dt;
  if(boss.gst>0){ boss.gst-=dt; boss.state='gim'; boss.hop=Math.abs(Math.sin(S.t*20))*.06; if(boss.gst<=0){ boss.hop=0; if(!(boss.gq&&boss.gq.body)) boss.state='walk'; } }
  // 2단계(파이널): 체력 50%
  if(boss.tier==='final'&&!boss.p2&&hpR<.5){ if(boss.gq) gimEnd(true); slamRing.visible=false; teleMesh.visible=false; boss.mat.opacity=1; boss.mat.transparent=false; bossPose(false); boss.hop=0;
    boss.p2=1; boss.gst=.8; boss.state='gim'; p2Start(); return; }
  const G=boss.gq;
  if(G){ const p=GIM[G.k]; G.t+=dt;
    if(G.ph==='w'){ if(p.wu) p.wu(G,dt); if(G.t>=G.w){ G.ph='a'; G.t=0; gimLog(G.k,'a'); if(p.a0) p.a0(G); } }
    else if(!p.au||p.au(G,dt)) gimEnd();
    return; }
  if(boss.gst>0) return;
  if(boss.gGap>0){ boss.gGap-=dt; return; }
  if(boss.state!=='walk') return;
  const k=gimPick(hpR); if(k) gimStart(k); }
function p2Start(){ const k=boss.key, B=boss.def, o=boss.gopt; nameBand('',B.name,hexC(B.col),true); sfx.roar(); DBG.shake=Math.max(DBG.shake||0,.6); buzz([40,30,80]); if(BOT||DBG.gimRec){ (DBG.p2||(DBG.p2={}))[k]=+S.t.toFixed(1); }
  const set=(g,v)=>{ o[g]=Object.assign(o[g]||{},v); };
  if(k==='dokkaebi'){ boss.gims.push('ssireum'); boss.gForce='ssireum'; }
  else if(k==='bibi'){ set('devour',{r2:1}); set('leap',{cd:8}); boss.gForce='leap'; }
  else if(k==='imugi'){ set('orb',{dur:8,heal:.1,vt:8,pearl:1}); boss.gims.push('orb'); boss.gForce='orb'; }
  else if(k==='haechi'){ set('leap',{n:2}); set('eatfire',{big:1}); boss.gForce='leap'; }
  else if(k==='datbal'){ set('peck',{n:3,L:20}); boss.gForce='peck'; }
  else if(k==='queen'){ set('coil',{layers:2}); for(let i=0;i<2;i++) spawnAround('elite',8); boss.gForce='coil'; }
  boss.gGap=.15; }
function leapSet(G){ const P=player.root.position; G.sx=boss.x; G.sz=boss.z; G.tx=P.x; G.tz=P.z; G.R=5*GU; G.w=Math.max(G.w,G.R/3.3+.25); boss.state='gjump'; sfx.wind(); }
function debrisDraw(G,t){ const P=player.root.position; let left=0; for(const q of G.d){ if(q.f) continue; left++; const k=Math.max(0,Math.min(1,1-(q.t-t)/1.5)); mD(q.x,q.z,G.R,CR,pls(10)); mD(q.x,q.z,G.R*k,CR,1);
    if(t>=q.t){ q.f=1; fx(q.x,q.z,G.R,[1,.6,.4],.3); burst(q.x,.5,q.z,6,3); sfx.boom(); if(Math.hypot(P.x-q.x,P.z-q.z)<G.R) gHit(G.o.dmg); } } return left===0; }
function szDraw(G,dt,warn){ const P=player.root.position; if(G.mv){ const nx=G.x+G.vx*dt, nz=G.z+G.vz*dt; if(blocked(nx,nz)||Math.hypot(nx-P.x,nz-P.z)>9){ G.vx*=-1; G.vz*=-1; } else { G.x=nx; G.z=nz; } }
  mD(P.x,P.z,13,CR,warn?.5+.25*Math.abs(Math.sin(S.t*8)):.72); mD(G.x,G.z,G.R,CG,1); mR(G.x,G.z,G.R,CG,pls(6)); if(G.mv) mL(G.x,G.z,G.vx/G.mv,G.vz/G.mv,G.R+1.5,.5,CG,pls(6)); }
function orbDraw(G){ mD(G.x,G.z,1.2*GU+.2,CY,pls(7)); mR(G.x,G.z,1.4,CY,1); const dx=G.x-boss.x, dz=G.z-boss.z, l=Math.hypot(dx,dz)||1; for(let s=1.2;s<l-1;s+=1.1) mD(boss.x+dx/l*s,boss.z+dz/l*s,.16,CY,.85); }
function coilRing(G,R,gA,wait){ const n=Math.round(R*6.283/.75), v=(R-1.6)/G.o.dur, dm=gDmg(G.o.dmg); for(let i=0;i<n;i++){ const a=i/n*6.283; if(Math.abs(angDiff(a,gA))<G.gW/2) continue; foxShots.push({x:G.cx+Math.cos(a)*R,z:G.cz+Math.sin(a)*R,y:1.2,vx:-Math.cos(a)*v,vz:-Math.sin(a)*v,life:G.o.dur,wait,dmg:dm}); } }
const GIM={
  segments:{ w0(G){ sfx.crack(); const q=bDir(); G.dx=q[0]; G.dz=q[1]; },
    wu(G){ boss.gRed=pls(14); mL(boss.x,boss.z,G.dx,G.dz,9,1.6,CR,pls()); },
    a0(G){ boss.gRed=0; const t=BATCH.jineS?'jineS':'shade'; for(let i=0;i<5;i++) spawn(t,boss.x+G.dx*(1+i*.8)+rr(-.3,.3),boss.z+G.dz*(1+i*.8)+rr(-.3,.3)); burst(boss.x,1,boss.z,14,3); dnum(boss.x,boss.def.H,boss.z,'뚝','mid'); },
    au(){ return true; } },
  steal:{ body:1, w0(G){ const q=bDir(); G.dx=q[0]; G.dz=q[1]; bossPose(true); },
    wu(G){ bossLook(G.dx,G.dz); boss.gLean=Math.min(1,G.t/.4); mL(boss.x,boss.z,G.dx,G.dz,8,1.8,CR,pls()); mR(boss.x,boss.z,1.2,CY,.7); },
    a0(G){ boss.gLean=0; boss.state='gdash'; const P=player.root.position; const q=freeAt(P.x+G.dx*5.5,P.z+G.dz*5.5); G.sv={x:q[0],z:q[1]}; G.ls=0; },
    au(G,dt){ const P=player.root.position;
      if(G.ls<.5){ G.ls+=dt; boss.x+=G.dx*16*dt; boss.z+=G.dz*16*dt; if(!G.hit&&Math.hypot(P.x-boss.x,P.z-boss.z)<1.5){ G.hit=1; S.shoeT=Math.max(S.shoeT||0,G.o.dur); dnum(P.x,2,P.z,'신을 빼앗겼다','mid'); sfx.hurt(); } if(G.ls>=.5){ bossPose(false); G.body=false; boss.state='walk'; } }
      mD(G.sv.x,G.sv.z,1.1,CY,pls(6)); mR(G.sv.x,G.sv.z,1.3,CY,1);
      if(Math.hypot(P.x-G.sv.x,P.z-G.sv.z)<1.3){ S.shoeT=0; boss.gst=2.5; toast('체를 던졌다','구멍을 세느라 멈췄다 · 지금!'); fx(G.sv.x,G.sv.z,1.4,[1,.85,.4],.4); sfx.sparkle(); return true; }
      return G.t>6; } },
  flee:{ ok:h=>h<.4&&!boss.fledDone, w0(G){ boss.mat.transparent=true; const q=bDir(); G.ax=-q[0]; G.az=-q[1]; sfx.laugh(); },
    wu(G){ boss.mat.opacity=1-.45*Math.min(1,G.t/G.w); mL(boss.x,boss.z,G.ax,G.az,5,1.1,CW,pls(8)); },
    a0(G){ boss.fled=1; boss.fledDone=1; boss.mat.opacity=.8; toast(boss.def.name+' — 달아난다','불씨를 흘린다 · 옆으로 돌아 따라가라'); if(G.o.pack) for(let i=0;i<2;i++) gwijolPack('gwijol'); G.dr=0; },
    au(G,dt){ G.dr-=dt; if(G.dr<=0){ G.dr=.4; addHaz(boss.x,boss.z,G.o.R*GU+.2,3.5,gDmg(G.o.dmg),'fire'); } return G.t>G.o.dur; },
    end(){ boss.fled=0; boss.mat.opacity=1; boss.mat.transparent=false; } },
  devour:{ w0(G){ G.R=G.o.R*GU*1.25*(G.o.r2?2:1); sfx.wind(); },
    wu(G){ const R=G.R*(boss.gs||1); mR(boss.x,boss.z,R,CP,pls(6)); let n=0; near(boss.x,boss.z,R,o=>{ if(n>8||o.dead) return; const dx=o.x-boss.x,dz=o.z-boss.z,l=Math.hypot(dx,dz)||1; if(l>R) return; n++; mL(boss.x,boss.z,dx/l,dz/l,l,.22,CK,1); }); },
    a0(G){ dnum(boss.x,boss.def.H,boss.z,'흐읍—','mid'); },
    au(G,dt){ const R=G.R*(boss.gs||1); mR(boss.x,boss.z,R,CP,pls(10)); near(boss.x,boss.z,R,o=>{ if(o.dead||(o.type!=='shade'&&o.type!=='wisp')) return; const dx=boss.x-o.x,dz=boss.z-o.z,l=Math.hypot(dx,dz)||1; if(l>R) return; o.x+=dx/l*7*dt; o.z+=dz/l*7*dt;
        if(l<1.2){ o.dead=true; boss.eat=(boss.eat||0)+1; boss.gs=Math.min(1.7,1+boss.eat*.08); boss.atkM=Math.min(1.8,1+boss.eat*.08); bossHeal(boss.maxhp*.012); burst(o.x,.6,o.z,3,2); boss.root.scale.setScalar(boss.gs); } }); return G.t>G.o.dur; } },
  ram:{ body:1, w0(G){ const q=bDir(); G.dx=q[0]; G.dz=q[1]; G.L=G.o.L*GU; G.W=G.o.R*GU; sfx.roar(); bossPose(true); },
    wu(G){ bossLook(G.dx,G.dz); boss.gLean=Math.min(1,G.t/.5); mL(boss.x,boss.z,G.dx,G.dz,G.L,G.W,CR,pls()); },
    a0(G){ boss.gLean=0; boss.state='gdash'; boss._bonk=0; DBG.shake=Math.max(DBG.shake||0,.4); G.go=0; },
    au(G,dt){ const P=player.root.position, v=18; boss.x+=G.dx*v*dt; boss.z+=G.dz*v*dt; G.go+=v*dt; if(Math.random()<.5) burst(boss.x,.8,boss.z,1,1);
      if(!G.hit&&Math.hypot(P.x-boss.x,P.z-boss.z)<1.4){ G.hit=1; gHit(G.o.dmg); }
      if(boss._bonk>.4){ boss.gst=G.o.dur; toast('쿵!','벽에 박혀 멈췄다 · 지금 때려라'); sfx.boom(); return true; }
      if(G.go>=G.L){ afterPause(); return true; } return false; } },
  pull:{ body:1, w0(G){ sfx.roar(); G.R=G.o.R*GU; },
    wu(G){ const k=(G.t*1.5)%1; for(let i=0;i<2;i++){ const q=(k+i*.5)%1; mR(boss.x,boss.z,(1-q)*G.R,CB,q); } mR(boss.x,boss.z,G.R,CB,.5); },
    a0(){ dnum(boss.x,boss.def.H,boss.z,'끌려간다','mid'); },
    au(G,dt){ const P=player.root.position, dx=P.x-boss.x, dz=P.z-boss.z, d=Math.hypot(dx,dz)||1; mR(boss.x,boss.z,G.R,CB,.6); const k=(G.t*1.8)%1; mR(boss.x,boss.z,(1-k)*G.R,CB,1-k); mD(boss.x,boss.z,2*GU,CR,pls());
      if(d<G.R&&!S.inSafe&&!(S.iframe>0)){ const q=3*GU*dt; P.x-=dx/d*q; P.z-=dz/d*q; } if(d<2*GU) hurtPlayer(gDmg(G.o.dmg)*dt,false,true);
      return G.t>G.o.dur; } },
  burrow:{ body:1, w0(G){ const P=player.root.position, n=G.o.n||1; G.R=G.o.R*GU; G.w=Math.max(G.w,G.R/3.3+.45); G.pts=[[P.x,P.z]];
      for(let i=1;i<n;i++){ const a=rr(0,6.283), r=rr(3.5,5); G.pts.push(freeAt(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r)); } boss.state='gdive'; boss.mat.transparent=true; burst(boss.x,.5,boss.z,18,3); if(G.o.cry) sfx.croak(); },
    wu(G){ boss.mat.opacity=Math.max(0,1-G.t/.4); const k=Math.min(1,G.t/G.w); for(const p of G.pts){ mD(p[0],p[1],G.R*(.4+.6*k),CR,pls(12)); mR(p[0],p[1],G.R,[.85,.55,.3],1); if(Math.random()<.3) burst(p[0]+rr(-1,1),.2,p[1]+rr(-1,1),1,1.2); } },
    a0(G){ const P=player.root.position, p0=G.pts[0]; boss.x=p0[0]; boss.z=p0[1]; boss.mat.opacity=1; boss.mat.transparent=false; DBG.shake=Math.max(DBG.shake||0,.7); sfx.boom(); bossPose(true); let hit=0;
      for(const p of G.pts){ fx(p[0],p[1],G.R,boss.def.shot,.35); burst(p[0],.6,p[1],10,4); if(!hit&&Math.hypot(P.x-p[0],P.z-p[1])<G.R){ hit=1; gHit(G.o.dmg); } } for(let i=0;i<8;i++) shot(boss.x,boss.z,i/8*6.28,4.6); },
    au(G){ return G.t>G.o.dur; } },
  poison:{ w0(G){ const P=player.root.position; G.pts=[[P.x,P.z]]; for(let i=0;i<2;i++){ const a=rr(0,6.283), r=rr(2.2,4.5); G.pts.push([P.x+Math.cos(a)*r,P.z+Math.sin(a)*r]); } G.R=G.o.R*GU; G.c=G.o.fire?[1,.55,.2]:CP; sfx.hum(); },
    wu(G){ const k=Math.min(1,G.t/G.w); for(const p of G.pts){ mD(p[0],p[1],G.R*(.5+.5*k),G.c,pls(9)); if(Math.random()<.25) burst(p[0]+rr(-1,1)*G.R*.6,.15,p[1]+rr(-1,1)*G.R*.6,1,.6); } },
    a0(G){ for(const p of G.pts) addHaz(p[0],p[1],G.R,G.o.dur,gDmg(G.o.dmg),G.o.fire?'fire':'poisonS'); toastOnce(G.o.fire?'fire56':'poison56',G.o.fire?'불 바닥':'독 안개',G.o.fire?'주황 바닥에 서 있으면 탄다 · 깨끗한 바닥으로':'보라 안개 안에선 느려지고 깎인다 · 깨끗한 바닥으로',true); },
    au(){ return true; } },
  blink:{ body:1, w0(G){ boss.state='gvanish'; boss.mat.transparent=true; sfx.click(); burst(boss.x,1,boss.z,14,3); },
    wu(G){ const P=player.root.position, f=S.face||{x:0,z:1}; boss.mat.opacity=Math.max(.12,1-G.t/.35); G.bx=P.x-f.x*2.6; G.bz=P.z-f.z*2.6; mD(G.bx,G.bz,.9,CK,1); mR(G.bx,G.bz,G.o.R*GU,CR,pls(12)); },
    a0(G){ const P=player.root.position, q=freeAt(G.bx,G.bz); boss.x=q[0]; boss.z=q[1]; boss.mat.opacity=1; boss.mat.transparent=false; burst(boss.x,1,boss.z,16,3); bossPose(true); const dx=P.x-boss.x, dz=P.z-boss.z, l=Math.hypot(dx,dz)||1; G.cx=boss.x+dx/l*1.1; G.cz=boss.z+dz/l*1.1; bossLook(dx,dz); },
    au(G){ mD(G.cx,G.cz,G.o.R*GU,CR,pls(20)); if(G.t>=.3){ const P=player.root.position; fx(G.cx,G.cz,G.o.R*GU,[1,.4,.4],.25); sfx.whip(); if(Math.hypot(P.x-G.cx,P.z-G.cz)<G.o.R*GU) gHit(G.o.dmg); return true; } return false; } },
  eatfire:{ body:1, w0(G){ G.R=(G.o.big?6:4)*1.1; sfx.roar(); toastOnce('eat56','숨을 들이켠다','붉은 원 안에 있으면 불을 먹고 단단해진다 · 원 밖으로!',true); },
    wu(G){ mR(boss.x,boss.z,G.R,CR,pls(8)); const k=(G.t*1.4)%1, r=G.R*(1-k)+.6; for(let i=0;i<8;i++){ const a=i*.785+G.t*.5; mL(boss.x+Math.cos(a)*r,boss.z+Math.sin(a)*r,-Math.cos(a),-Math.sin(a),1.1,.25,CR,1); } },
    a0(G){ const P=player.root.position, d=Math.hypot(P.x-boss.x,P.z-boss.z); if(S.haz) S.haz=S.haz.filter(h=>!(h.k==='fire'&&Math.hypot(h.x-boss.x,h.z-boss.z)<G.R));
      if(d<G.R){ boss.shield=G.o.dur; bossHeal(boss.maxhp*.03); toast('불을 삼켰다','단단해졌다('+G.o.dur+'초)'); } else dnum(boss.x,boss.def.H,boss.z,'헛숨','mid');
      const a=Math.atan2(P.z-boss.z,P.x-boss.x); for(let i=0;i<9;i++) shot(boss.x,boss.z,a+(i-4)*.13,6.5); },
    au(){ return true; } },
  eclipse:{ w0(){ sfx.roar(); eclWarn(true); dnum(boss.x,boss.def.H,boss.z,'하늘을 문다','mid'); },
    a0(G){ eclWarn(false); eclipse(G.o.dur); },
    au(G){ eclEye(true); return G.t>G.o.dur; }, end(){ eclEye(false); eclWarn(false); } },
  coil:{ w0(G){ const P=player.root.position; G.cx=P.x; G.cz=P.z; G.R=G.o.R*GU; G.gA=rr(0,6.283); G.gW=.95; G.L=G.o.layers||1; G.gA2=G.gA+Math.PI*rr(.6,1.4); sfx.hum(); },
    wu(G){ mArc(G.cx,G.cz,G.R,G.gA,G.gW,CW,pls(8)); mD(G.cx+Math.cos(G.gA)*G.R,G.cz+Math.sin(G.gA)*G.R,.9,CG,pls(5));
      if(G.L>1){ mArc(G.cx,G.cz,G.R+1.6,G.gA2,G.gW,CW,pls(8)); mD(G.cx+Math.cos(G.gA2)*(G.R+1.6),G.cz+Math.sin(G.gA2)*(G.R+1.6),.9,CG,pls(5)); } },
    a0(G){ coilRing(G,G.R,G.gA,0); if(G.L>1) coilRing(G,G.R+1.6,G.gA2,.5); },
    au(G){ return G.t>G.o.dur+.6; } },
  barrier:{ w0(G){ sfx.metal(); G.R=G.o.R*GU; },
    wu(G){ mR(boss.x,boss.z,G.R,CR,pls(8)); mR(boss.x,boss.z,1.4,CR,pls(8)); },
    a0(G){ G.sh=[]; const dm=gDmg(G.o.dmg); for(let i=0;i<16;i++){ if(i%4===0) continue; const f={x:boss.x,z:boss.z,y:1.3,vx:0,vz:0,life:G.o.dur+1,wait:0,dmg:dm,i}; foxShots.push(f); G.sh.push(f); } G.cw=Math.random()<.5?1:-1; sfx.metal(); },
    au(G){ const r=3.1+1.7*Math.sin(G.t*1.4-1.57); mR(boss.x,boss.z,r,CR,.45); for(const f of G.sh){ const a=G.t*.9*G.cw+f.i*.3927; f.x=boss.x+Math.cos(a)*r; f.z=boss.z+Math.sin(a)*r; } return G.t>G.o.dur; },
    end(G){ if(G.sh) for(const f of G.sh) f.life=0; } },
  peck:{ body:1, rep:1, w0(G){ const q=bDir(); G.dx=q[0]; G.dz=q[1]; G.L=G.o.L*GU; G.W=G.o.R*GU; },
    wu(G){ bossLook(G.dx,G.dz); boss.gLean=Math.min(1,G.t/.4); mL(boss.x,boss.z,G.dx,G.dz,G.L,G.W,CR,pls(14)); },
    a0(G){ boss.gLean=0; boss.state='gdash'; boss._bonk=0; bossPose(true); G.go=0; G.hit=0; sfx.whip(); },
    au(G,dt){ const P=player.root.position, s=Math.min(26*dt,G.L-G.go); boss.x+=G.dx*s; boss.z+=G.dz*s; G.go+=s; if(!G.hit&&Math.hypot(P.x-boss.x,P.z-boss.z)<1.1){ G.hit=1; gHit(G.o.dmg); }
      if(G.go>=G.L-1e-3||boss._bonk>.4){ bossPose(false); if(--G.n>0){ G.ph='w'; G.t=0; G.w=.6; const q=bDir(); G.dx=q[0]; G.dz=q[1]; boss.state='gim'; return false; } afterPause(); return true; } return false; } },
  leap:{ body:1, rep:1, w0(G){ leapSet(G); if(G.o.line) dnum(boss.x,boss.def.H+.5,boss.z,G.o.line,'mid'); },
    wu(G){ const k=Math.min(1,G.t/G.w), e=k*k*(3-2*k); boss.x=G.sx+(G.tx-G.sx)*e; boss.z=G.sz+(G.tz-G.sz)*e; boss.hop=Math.sin(k*Math.PI)*6; mD(G.tx,G.tz,G.R*(.35+.65*k),CK,.9); mR(G.tx,G.tz,G.R,CR,pls(12)); if(Math.random()<.4) burst(boss.x,boss.hop,boss.z,1,1); },
    a0(G){ const P=player.root.position; boss.x=G.tx; boss.z=G.tz; boss.hop=0; DBG.shake=Math.max(DBG.shake||0,.9); fx(boss.x,boss.z,G.R,boss.def.shot,.4); sfx.boom(); if(Math.hypot(P.x-boss.x,P.z-boss.z)<G.R) gHit(G.o.dmg);
      for(let i=0;i<12;i++) shot(boss.x,boss.z,i/12*6.28,5.2); if(boss.gs>1){ boss.gs=1; boss.eat=0; boss.atkM=1; boss.root.scale.setScalar(1); } },
    au(G){ if(--G.n>0){ G.ph='w'; G.t=0; G.w=1.1; leapSet(G); return false; } boss.gst=G.o.dur; afterPause(); return true; } },
  debris:{ w0(G){ const P=player.root.position, n=G.o.n||6; G.R=G.o.R*GU; G.d=[]; for(let i=0;i<n;i++){ const a=rr(0,6.283), r=i?rr(1.8,5):0; G.d.push({x:P.x+Math.cos(a)*r,z:P.z+Math.sin(a)*r,t:G.w+i*.22,f:0}); } sfx.whistle(); if(G.o.line) dnum(boss.x,boss.def.H+.4,boss.z,G.o.line,'mid'); },
    wu(G){ debrisDraw(G,G.t); },
    au(G){ return debrisDraw(G,G.w+G.t); } },
  safezone:{ w0(G){ const P=player.root.position, a=rr(0,6.283), r=rr(3.2,4.6), q=freeAt(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r); G.x=q[0]; G.z=q[1]; G.R=G.o.R*GU; G.mv=G.o.move||0; const b=rr(0,6.283); G.vx=Math.cos(b)*G.mv; G.vz=Math.sin(b)*G.mv; G.tk=0; sfx.roar();
      toastOnce('safe56','초록 원 안으로','바깥은 모두 맞는다 · 원을 따라 걸어라',true); },
    wu(G,dt){ szDraw(G,dt,true); },
    a0(G){ G.tk=0; },
    au(G,dt){ szDraw(G,dt,false); const P=player.root.position, inn=Math.hypot(P.x-G.x,P.z-G.z)<G.R; G.tk-=dt;
      if(G.tk<=0){ G.tk=.5; if(!inn&&!S.inSafe) gHit(G.o.dmg/6); for(let i=0;i<4;i++){ const a=rr(0,6.283), r=rr(G.R+.6,10); fx(P.x+Math.cos(a)*r,P.z+Math.sin(a)*r,.6,[1,.4,.4],.2); } }
      if(G.t>=G.o.dur){ if(G.o.stun&&inn){ boss.gst=G.o.stun; toast('찾아냈다','초록 원 위에서 솟다가 걸렸다 · 지금!'); } return true; } return false; } },
  spin:{ body:1, w0(G){ const q=bDir(); G.n2=boss.tier==='final'||boss.hp<boss.maxhp*.5?2:1; G.a=Math.atan2(q[1],q[0])+Math.PI/2; G.L=G.o.L*GU; G.cw=Math.random()<.5?1:-1; sfx.hum(); },
    wu(G){ for(let i=0;i<G.n2;i++){ const a=G.a+i*Math.PI; mL(boss.x,boss.z,Math.cos(a),Math.sin(a),G.L,.35,CR,pls(10)); } },
    a0(G){ G.hc=0; },
    au(G,dt){ const P=player.root.position; G.a+=.698*G.cw*dt; G.hc-=dt; for(let i=0;i<G.n2;i++){ const a=G.a+i*Math.PI, ex=boss.x+Math.cos(a)*G.L, ez=boss.z+Math.sin(a)*G.L; mL(boss.x,boss.z,Math.cos(a),Math.sin(a),G.L,.9,CR,1);
        if(Math.random()<.3){ const s=rr(.5,1); fx(boss.x+(ex-boss.x)*s,boss.z+(ez-boss.z)*s,.4,[1,.45,.4],.15); } if(G.hc<=0&&segDist(P.x,P.z,boss.x,boss.z,ex,ez)<.65){ G.hc=.7; gHit(G.o.dmg); } } return G.t>G.o.dur; } },
  ringwave:{ body:1, w0(G){ G.gA=rr(0,6.283); G.gW=.7; G.Rm=G.o.R*GU; sfx.roar(); },
    wu(G){ const k=(G.t*2)%1; for(let i=1;i<=3;i++) mR(boss.x,boss.z,i*2.2+k*1.2,CR,pls(10)*.8); mL(boss.x,boss.z,Math.cos(G.gA),Math.sin(G.gA),G.Rm,1.4,CG,pls(5)); },
    a0(G){ G.r=0; G.hit=0; DBG.shake=Math.max(DBG.shake||0,.3); },
    au(G,dt){ const P=player.root.position; G.r+=7*GU*dt; mArc(boss.x,boss.z,G.r,G.gA,G.gW,CR,1,.4); mL(boss.x,boss.z,Math.cos(G.gA),Math.sin(G.gA),G.Rm,1.4,CG,.5);
      const dx=P.x-boss.x, dz=P.z-boss.z, d=Math.hypot(dx,dz); if(!G.hit&&Math.abs(d-G.r)<.5&&Math.abs(angDiff(Math.atan2(dz,dx),G.gA))>G.gW/2){ G.hit=1; gHit(G.o.dmg); } return G.r>=G.Rm; } },
  decoy:{ w0(){ burst(boss.x,1.2,boss.z,26,4); sfx.pop(); },
    wu(){ mD(boss.x,boss.z,1.6,[.75,.75,.8],pls(8)); },
    a0(G){ const n=boss.tier==='normal'?2:3; if(boss.tier==='normal') G.o.dur=5; boss.dec=[]; for(let i=0;i<n;i++){ const a=rr(0,6.283), r=rr(2.5,4.5), q=freeAt(boss.x+Math.cos(a)*r,boss.z+Math.sin(a)*r); boss.dec.push({x:q[0],z:q[1],cw:Math.random()<.5?1:-1,pop:0,vx:0}); }
      const j=Math.floor(Math.random()*n), q=boss.dec[j], ox=boss.x, oz=boss.z; boss.x=q.x; boss.z=q.z; q.x=ox; q.z=oz; boss.sh.material.opacity=1; sfx.pop(); for(const q2 of boss.dec) burst(q2.x,1.2,q2.z,10,3); },
    au(G,dt){ const P=player.root.position; let live=0; if(!boss.dec) return true;
      for(const q of boss.dec){ if(q.pop<0) continue; live++; const dx=P.x-q.x, dz=P.z-q.z, d=Math.hypot(dx,dz)||1;
        if(q.pop>0){ q.pop+=dt; mD(q.x,q.z,G.o.R*GU+.4,CR,pls(20)); if(q.pop>.35){ q.pop=-1; burst(q.x,1,q.z,18,4); sfx.pop(); fx(q.x,q.z,1.6,[.8,.8,.9],.3); if(d<G.o.R*GU+.4) gHit(G.o.dmg); } continue; }
        const w=d>5?1:d<2.5?-.5:0, vx=(dx/d*w-dz/d*q.cw*.8)*2.4, vz=(dz/d*w+dx/d*q.cw*.8)*2.4, nx=q.x+vx*dt, nz=q.z+vz*dt; if(!blocked(nx,nz)){ q.x=nx; q.z=nz; } q.vx=vx; if(d<1.7) q.pop=1e-3; }
      return G.t>G.o.dur||live===0; },
    end(){ if(boss.dec) for(const q of boss.dec) if(q.pop>=0) burst(q.x,1,q.z,10,3); boss.dec=null; boss.sh.material.opacity=.85; } },
  freeze:{ w0(){ frzV(true); sfx.jing(); dnum(boss.x,boss.def.H,boss.z,'눈이 빛난다','mid'); },
    a0(G){ G.dur=boss.tier==='normal'?1.2:G.o.dur; boss.gFrz=G.dur; for(const e of enemies) if(!e.dead) e.freeze=Math.max(e.freeze||0,G.dur); for(const f of foxShots) f.wait=Math.max(f.wait||0,G.dur); G.hit=0; boss.flash=1; },
    au(G){ const mv=Math.hypot(S.vx||0,S.vz||0); if(!G.hit&&G.t>.15&&mv>.8){ G.hit=1; gHit(G.o.dmg); const P=player.root.position; dnum(P.x,2.2,P.z,'움직였다','hurt'); } return G.t>G.dur; },
    end(){ frzV(false); boss.gFrz=0; } },
  orb:{ body:1, w0(G){ const P=player.root.position, dx=P.x-boss.x, dz=P.z-boss.z, d=Math.hypot(dx,dz)||1; let q;
      if(G.o.roll){ const a=Math.atan2(dz,dx)+rr(-1.2,1.2); q=freeAt(boss.x+Math.cos(a)*7,boss.z+Math.sin(a)*7); } else { const mx=(P.x+boss.x)/2, mz=(P.z+boss.z)/2, s=Math.random()<.5?1:-1; q=freeAt(mx-dz/d*3.5*s,mz+dx/d*3.5*s); }
      G.x=q[0]; G.z=q[1]; sfx.sparkle(); if(G.o.pearl) toast('여의주를 떨어뜨렸다','먼저 밟으면 오르지 못한다'); },
    wu(G){ orbDraw(G); },
    a0(G){ dnum(G.x,1.5,G.z,G.o.roll?'머리가 굴러간다':'구슬','mid'); },
    au(G,dt){ const P=player.root.position;
      if(G.o.roll){ const dx=boss.x-G.x, dz=boss.z-G.z, l=Math.hypot(dx,dz)||1; G.x+=dx/l*1.5*dt; G.z+=dz/l*1.5*dt; } else { const dx=G.x-boss.x, dz=G.z-boss.z, l=Math.hypot(dx,dz)||1; boss.x+=dx/l*1.7*dt; boss.z+=dz/l*1.7*dt; bossLook(dx,dz); }
      orbDraw(G);
      if(Math.hypot(P.x-G.x,P.z-G.z)<1.2*GU+.35){ const vt=G.o.vt||5; boss.vuln=vt; sfx.sparkle(); fx(G.x,G.z,1.4,[1,.85,.35],.4); toast(G.o.roll?'머리를 막았다':'구슬을 밟았다','받는 피해 +50% ('+vt+'초)'); return true; }
      if(Math.hypot(boss.x-G.x,boss.z-G.z)<1.1||G.t>G.o.dur){ bossHeal(boss.maxhp*(G.o.heal||.08)); dnum(boss.x,boss.def.H,boss.z,'되찾았다','mid'); burst(G.x,1,G.z,12,3); return true; } return false; } },
  ssireum:{ w0(G){ const P=player.root.position; G.x=P.x; G.z=P.z; G.R=G.o.R; toast('씨름 한 판 하자!','초록 원 안에서 3초 버텨라 · 밀려나지 마라'); sfx.laugh(); },
    wu(G){ mD(G.x,G.z,G.R,CG,pls(5)); mR(G.x,G.z,G.R,CG,1); for(let i=0;i<4;i++){ const a=i*1.571+S.t*.7; mL(G.x+Math.cos(a)*(G.R+1.3),G.z+Math.sin(a)*(G.R+1.3),-Math.cos(a),-Math.sin(a),1.1,.5,CG,1); } },
    a0(G){ G.inT=0; G.sh=0; },
    au(G,dt){ const P=player.root.position, dx=P.x-G.x, dz=P.z-G.z, d=Math.hypot(dx,dz)||1; mD(G.x,G.z,G.R,CG,.8); mR(G.x,G.z,G.R,CG,1);
      if(d<G.R&&!S.inSafe){ const q=1.7*dt; P.x+=dx/d*q; P.z+=dz/d*q; G.inT+=dt; mR(G.x,G.z,Math.max(.3,G.R*Math.min(1,G.inT/3)),CY,1); }
      else { G.inT=Math.max(0,G.inT-dt*.5); G.sh-=dt; if(G.sh<=0){ G.sh=.9; const n=16, off=rr(0,1); for(let i=0;i<n;i++) shot(boss.x,boss.z,(i+off)/n*6.28,4.4,.4); } }
      if(G.inT>=3){ boss.gst=3; toast('도깨비가 넘어졌다','지금!'); DBG.shake=Math.max(DBG.shake||0,.6); sfx.boom(); return true; } return G.t>G.o.dur; } }
};
// 일식 예고·붉은 눈 · 멈춰 서기 테두리 (화면 위 DOM)
function eclEl(){ let el=$('eclipseV'); if(!el){ el=document.createElement('div'); el.id='eclipseV'; el.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:6;background:radial-gradient(circle at 50% 55%,rgba(0,0,0,0) 0,rgba(0,0,0,.25) 14%,rgba(0,0,0,.92) 34%);opacity:0;transition:opacity .35s'; document.body.appendChild(el); } return el; }
function eclWarn(on){ const el=eclEl(); if(on){ el.style.opacity=.4; clearTimeout(el._t); } else if(+el.style.opacity<.5) el.style.opacity=0; }
const _ev=new THREE.Vector3();
function eclEye(on){ let el=$('eclEye'); if(!el){ if(!on) return; el=document.createElement('div'); el.id='eclEye'; el.style.cssText='position:fixed;width:26px;height:12px;margin:-6px 0 0 -13px;pointer-events:none;z-index:7;display:none;background:radial-gradient(ellipse at 28% 50%,#ff3a3a 0,#ff3a3a 22%,rgba(255,40,40,0) 34%),radial-gradient(ellipse at 72% 50%,#ff3a3a 0,#ff3a3a 22%,rgba(255,40,40,0) 34%);filter:drop-shadow(0 0 6px #f00)'; document.body.appendChild(el); }
  if(!on||!boss.alive){ el.style.display='none'; return; } _ev.set(boss.x,(boss.def.H||3)*.78+(boss.hop||0),boss.z).project(camera); el.style.display='block'; el.style.left=((_ev.x+1)/2*innerWidth)+'px'; el.style.top=((1-_ev.y)/2*innerHeight)+'px'; }
function frzV(on){ let el=$('frzV'); if(!el){ if(!on) return; el=document.createElement('div'); el.id='frzV'; el.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:6;box-shadow:inset 0 0 46px 16px rgba(70,150,255,.85);border:3px solid rgba(140,200,255,.95);box-sizing:border-box;opacity:0;transition:opacity .15s'; document.body.appendChild(el); } el.style.opacity=on?1:0; }
// 불개가 하늘을 물면 잠깐 어두워진다
function eclipse(t){ const el=eclEl();
  el.style.opacity=1; clearTimeout(el._t); el._t=setTimeout(()=>{ el.style.opacity=0; },t*1000); }
// v2.48 지역 일반 괴수 나오는 때(처음 · 간격) — 61번
const REGMOB={
  jineS:{t0:50,g:[22,34],f:()=>gwijolPack('jineS'),msg:'지하상가 계단에서 줄지어 기어 나온다 · 옆으로 비켜라'},
  fox:{t0:40,g:[14,22],f:()=>{ for(let i=0;i<4;i++) spawnAround('fox'); },msg:'둘레를 돌다 덤빈다'},
  mangryang:{t0:90,g:[9,15],f:()=>{ if(enemies.filter(e=>e.hid&&e.d.lurk).length<4) mangLurk(); },msg:'검은 웅덩이를 조심하라'},
  gwijol:{t0:45,g:[18,28],f:()=>gwijolPack('gwijol'),msg:'줄지어 내달리는 것들 · 옆으로 비켜라'},
  yeongno:{t0:110,g:[70,100],f:()=>spawnAround('yeongno'),msg:'무엇이든 삼키는 것이 나타났다 · 괴수를 먹을수록 커진다'},
  dfire:{t0:35,g:[10,16],f:()=>{ const P=player.root.position, a=rr(0,6.28), r=spawnR()*.9; for(let i=0;i<7;i++) spawn('dfire',P.x+Math.cos(a)*r+rr(-2,2),P.z+Math.sin(a)*r+rr(-2,2)); },msg:'붉은 불이 무리 지어 떠다닌다'},
  yagwang:{t0:60,g:[40,60],f:()=>spawnAround('yagwang'),msg:'신을 노리는 밤의 것이 다가온다'},
  gangcheol:{t0:100,g:[60,90],f:()=>spawnAround('gangcheol'),msg:'우박 냄새가 난다 · 흰 원을 피하라'},
  mokrang:{t0:70,g:[16,26],f:()=>spawnAround('mokrang'),msg:'뿌리로 걷는 늙은 나무 · 뿌리 둘레에선 발이 묶인다'},
  bulsae:{t0:55,g:[14,22],f:()=>{ for(let i=0;i<2;i++) spawnAround('bulsae'); },msg:'쇠를 먹는 작은 것들 · 질기다'},
  hwama:{t0:70,g:[16,24],f:()=>spawnAround('hwama'),msg:'지나간 자리에 불이 남는다'},
  imae:{t0:45,g:[7,12],f:()=>spawnAround('imae'),msg:'산의 흐릿한 것 · 사라졌다 옆에서 나타난다'},
  bulgaeS:{t0:40,g:[13,20],f:()=>{ for(let i=0;i<3;i++) spawnAround('bulgaeS'); },msg:'불개 새끼들이 둘레를 돌다 문다'},
  gureongS:{t0:55,g:[12,18],f:()=>{ for(let i=0;i<2;i++) spawnAround('gureongS'); },msg:'숲 바닥의 뱀이 다가온다'}
};
/* v2.16 영노 — 탈춤(수영야류·통영오광대)의 무엇이든 먹는 괴물. 1·2막: 짐승 모습만, 사람 말·흔적 없음 */
function yeongnoTick(e,dt,dist,dx,dz,sp,P){ e.eat=e.eat||0; e.tgt=null; e.inhT=(e.inhT??rr(4,6))-dt;
  if(e.inh>0){ e.inh-=dt; e.cast=.1; const pull=dist<11&&!S.inSafe; if(pull&&!(S.iframe>0)){ const k=(3.4-Math.min(2.6,dist*.22))*dt; P.x-=dx/dist*k; P.z-=dz/dist*k; } // 숨을 들이켜 끌어당긴다
    e.inhFx=(e.inhFx||0)-dt; if(e.inhFx<=0){ e.inhFx=.18; fx(e.x,e.z,3.2+Math.random(),[.55,.95,.75],.22); }
    if(e.eat<9) near(e.x,e.z,4.5,o=>{ if(o.dead||o===e||o.type!=='shade') return; const ox=e.x-o.x, oz=e.z-o.z, od=Math.hypot(ox,oz)||1; o.x+=ox/od*6*dt; o.z+=oz/od*6*dt; if(od<e.d.r*(e.gs||1)+.4) yeongnoEat(e,o); });
    if(e.inh<=0){ e.inhT=rr(6.5,9); } return 0; }
  if(e.inhT<=0&&dist<9&&!e.ch&&!S.inSafe){ e.inh=1.7; sfx.roar(); dnum(e.x,e.d.h*(e.gs||1)+.4,e.z,'흐읍—','mid'); return 0; }
  if(e.eat<9&&!e.ch){ let b=null,bd=36; near(e.x,e.z,6,o=>{ if(o.dead||o===e||o.type!=='shade') return; const q=(o.x-e.x)**2+(o.z-e.z)**2; if(q<bd){ bd=q; b=o; } }); // 가까운 그림자를 먼저 먹으러 간다
    if(b){ e.tgt=b; if(Math.sqrt(bd)<e.d.r*(e.gs||1)+.45) yeongnoEat(e,b); return sp*1.35; } }
  return sp; }
function yeongnoEat(e,o){ if(o.dead||e.eat>=9) return; o.dead=true; e.eat++; e.gs=1+e.eat*.075; e.maxhp*=1.12; e.hp=Math.min(e.maxhp,e.hp+e.maxhp*.15);
  burst(o.x,.6,o.z,3,2); if(e.eat%3===0||e.eat===1) dnum(e.x,e.d.h*e.gs+.3,e.z,'꿀꺽 '+e.eat,'mid'); try{ sfx.ironChew(); }catch(_){}
  if(e.eat>=9&&!e.full){ e.full=1; e.atk=.6; toast('영노가 배를 채웠다','이제 너를 노린다 · 붉은 줄을 비켜라'); DBG.shake=Math.max(DBG.shake||0,.4); } }

/* v2.16 이무기 AI — 물결처럼 꿈틀대며 다가오고(walk), 물을 뿜고(shot), 꼬리로 휩쓸고(coil), 물속으로 숨었다 발밑에서 솟구친다(dive→rise) */
function imugiUpdate(dt,P,dx,dz,d,hpR,fz){
  if(boss.state==='walk'){ const want=d>7?1:d<4?-.6:.15, tx=dx/d, tz=dz/d, wav=Math.sin(boss.st*2.3)*1.6, sp=fz?0:2.1*(hpR<.5?1.2:1);
    const vx=(tx*want-tz*wav*.6)*sp, vz=(tz*want+tx*wav*.6)*sp; boss.x+=vx*dt; boss.z+=vz*dt; if(sp) bossLook(vx,vz); boss.hop=Math.abs(Math.sin(boss.st*2.3))*.18;
    if(!fz){ boss.shotT-=dt; boss.slamT-=dt; boss.dashT-=dt; boss.ringT-=dt; }
    if(boss.shotT<=0){ boss.shotT=hpR<.5?2.2:3.1; boss.wave=3; boss.waveT=0; boss.wa=Math.atan2(dz,dx); }
    if(boss.wave>0){ boss.waveT-=dt; if(boss.waveT<=0){ boss.waveT=.28; const n=hpR<.5?7:5, off=(boss.wave%2)*.14; for(let i=0;i<n;i++) shot(boss.x,boss.z,boss.wa+(i-(n-1)/2)*.28+off,4.4,.3); boss.wave--; } } // 물결 세 겹
    if(hpR<.5&&boss.ringT<=0){ boss.ringT=4.2; const H=S.hails||(S.hails=[]); for(let i=0;i<4;i++){ const a=rr(0,6.28), r=i?rr(1.5,3.5):0; H.push({x:P.x+Math.cos(a)*r,z:P.z+Math.sin(a)*r,t:1.2,w:0}); } toast('비가 쏟아진다','흰 원을 피하라'); }
    if(boss.slamT<=0&&d<6.5){ boss.state='coil'; boss.st=0; slamRing.visible=true; bossPose(true); }
    else if(boss.dashT<=0&&d>5){ boss.state='dive'; boss.st=0; burst(boss.x,.5,boss.z,18,3); sfx.splash&&sfx.splash(); } }
  else if(boss.state==='coil'){ const R=5.2; slamRing.position.set(boss.x,.06,boss.z); slamRing.scale.setScalar(R*2.2*Math.min(1,boss.st/1)); slamRing.material.opacity=.5+.5*Math.abs(Math.sin(boss.st*12)); boss.root.rotation.y=0; boss.hop=Math.sin(Math.min(1,boss.st)*Math.PI)*.5;
    if(boss.st>1.1){ slamRing.visible=false; bossPose(false); DBG.shake=Math.max(DBG.shake||0,.8); fx(boss.x,boss.z,R,[.5,.75,1],.4); sfx.boom();
      if(d<R){ hurtPlayer(30,true); const k=3.2; P.x+=dx/d*k; P.z+=dz/d*k; } // 꼬리에 휩쓸려 밀려난다
      const n=hpR<.5?20:14; for(let i=0;i<n;i++) shot(boss.x,boss.z,i/n*6.28+rr(0,.2),5.4); boss.state='walk'; boss.slamT=hpR<.5?3.6:5; } }
  else if(boss.state==='dive'){ boss.mat.transparent=true; boss.mat.opacity=Math.max(.08,1-boss.st/.45); boss.hop=-Math.min(1,boss.st/.45)*1.2;
    if(boss.st>.45){ const k=Math.min(1,dt*2.4); boss.x+=(P.x-boss.x)*k; boss.z+=(P.z-boss.z)*k; slamRing.visible=true; slamRing.position.set(boss.x,.06,boss.z); slamRing.scale.setScalar(3.2*2.2); slamRing.material.opacity=.35+.4*Math.abs(Math.sin(boss.st*9)); if(Math.random()<.4) burst(boss.x+rr(-1,1),.2,boss.z+rr(-1,1),1,1.5); }
    if(boss.st>(hpR<.5?1.7:2.1)){ boss.state='rise'; boss.st=0; boss.rx=boss.x; boss.rz=boss.z; } }
  else if(boss.state==='rise'){ slamRing.position.set(boss.rx,.06,boss.rz); slamRing.material.opacity=.6+.4*Math.abs(Math.sin(boss.st*20));
    if(boss.st>.45&&!boss.rose){ boss.rose=1; slamRing.visible=false; boss.mat.opacity=1; boss.mat.transparent=false; bossPose(true); DBG.shake=Math.max(DBG.shake||0,1); fx(boss.x,boss.z,3.2,[.5,.8,1],.45); sfx.boom(); burst(boss.x,1.5,boss.z,26,5);
      if(Math.hypot(P.x-boss.x,P.z-boss.z)<3.2) hurtPlayer(34,true); const n=hpR<.5?12:9; for(let i=0;i<n;i++) shot(boss.x,boss.z,i/n*6.28,5); }
    boss.hop=boss.rose?Math.max(0,1.4-(boss.st-.45)*3):-1.2;
    if(boss.st>1.1){ boss.rose=0; bossPose(false); boss.hop=0; boss.state='walk'; boss.dashT=hpR<.5?5.5:7.5; } } }
/* v2.16b 호랑이 AI — 빙빙 돌며 노림(stalk) → 할퀴기(ctele→claw) · 덮치기(pounce) · 포효(roar, 발이 굳음) · 체력 40% 아래 어둠에 숨었다 뒤에서 덮침(shade) */
function tigerUpdate(dt,P,dx,dz,d,hpR,fz){ const F=hpR<.5?1.25:1;
  const leap=(tx,tz,R)=>{ boss.state='pounce'; boss.st=0; boss.jx=tx; boss.jz=tz; boss.sx=boss.x; boss.sz=boss.z; boss.jr=R; slamRing.visible=true; bossPose(true); };
  if(boss.state==='walk'){ const tx=dx/d, tz=dz/d, R0=hpR<.5?5.5:7, rad=(d-R0)*.8, sp=fz?0:3.1*F;
    const vx=(tx*rad+(-tz)*boss.cw*2.4), vz=(tz*rad+tx*boss.cw*2.4), l=Math.hypot(vx,vz)||1; boss.x+=vx/l*sp*dt; boss.z+=vz/l*sp*dt; if(sp) bossLook(vx,vz); boss.hop=Math.abs(Math.sin(boss.st*5))*.08;
    if(!fz){ boss.clawT-=dt; boss.pounceT-=dt; boss.roarT-=dt; boss.shadeT-=dt; }
    if(Math.random()<dt*.15) boss.cw*=-1;
    if(hpR<.4&&boss.shadeT<=0){ boss.state='shade'; boss.st=0; toast('호랑이가 어둠에 숨었다','발소리를 들어라 · 붉은 원이 뜨면 비켜라'); }
    else if(hpR<.65&&boss.roarT<=0){ boss.state='roar'; boss.st=0; bossPose(false); }
    else if(boss.pounceT<=0&&d<14){ boss.pounceT=(hpR<.5?4.5:6.5); leap(P.x+rr(-.6,.6),P.z+rr(-.6,.6),3.2); }
    else if(boss.clawT<=0&&d<9){ boss.state='ctele'; boss.st=0; boss.dx=tx; boss.dz=tz; teleMesh.visible=true; } }
  else if(boss.state==='ctele'){ bossLook(boss.dx,boss.dz); teleMesh.position.set(boss.x,.06,boss.z); teleMesh.rotation.z=Math.atan2(boss.dx,-boss.dz)+Math.PI; teleMesh.scale.set(2.6,7.5,1); teleMesh.material.opacity=.4+.6*Math.abs(Math.sin(boss.st*16));
    if(boss.st>.55){ teleMesh.visible=false; boss.state='claw'; boss.st=0; bossPose(true); } }
  else if(boss.state==='claw'){ boss.x+=boss.dx*17*dt; boss.z+=boss.dz*17*dt; if(Math.random()<.5) burst(boss.x,.8,boss.z,1,1);
    if(boss.st>.3){ bossPose(false); DBG.shake=Math.max(DBG.shake||0,.45); sfx.whip&&sfx.whip(); const fx0=boss.x+boss.dx*1.4, fz0=boss.z+boss.dz*1.4;
      for(let i=-1;i<=1;i++) fx(fx0-boss.dz*i*.7,fz0+boss.dx*i*.7,1.2,[1,.45,.3],.22); // 세 줄 발톱
      if(Math.hypot(P.x-fx0,P.z-fz0)<2.4) hurtPlayer(26,true);
      const a=Math.atan2(boss.dz,boss.dx); for(let i=-2;i<=2;i++) shot(boss.x,boss.z,a+i*.32,6.5,.15);
      boss.clawCombo=(boss.clawCombo||0)+1; if(hpR<.5&&boss.clawCombo<2){ boss.state='ctele'; boss.st=.2; const l=Math.hypot(P.x-boss.x,P.z-boss.z)||1; boss.dx=(P.x-boss.x)/l; boss.dz=(P.z-boss.z)/l; teleMesh.visible=true; } // 반 아래면 두 번 연달아
      else { boss.clawCombo=0; boss.state='walk'; boss.clawT=hpR<.5?2.6:3.8; } } }
  else if(boss.state==='pounce'){ const T=1.0, k=Math.min(1,boss.st/T), R=boss.jr||3.2; boss.x=boss.sx+(boss.jx-boss.sx)*k; boss.z=boss.sz+(boss.jz-boss.sz)*k; boss.hop=Math.sin(k*Math.PI)*2.6; bossLook(boss.jx-boss.sx,boss.jz-boss.sz);
    slamRing.position.set(boss.jx,.06,boss.jz); slamRing.scale.setScalar(R*2.2*Math.min(1,boss.st/.7)); slamRing.material.opacity=.5+.5*Math.abs(Math.sin(boss.st*12));
    if(k>=1){ slamRing.visible=false; bossPose(false); boss.hop=0; DBG.shake=Math.max(DBG.shake||0,.75); fx(boss.x,boss.z,R,[1,.7,.35],.35); sfx.boom();
      if(Math.hypot(P.x-boss.x,P.z-boss.z)<R) hurtPlayer(30,true); const n=hpR<.5?12:8; for(let i=0;i<n;i++) shot(boss.x,boss.z,i/n*6.28,5);
      boss.state='walk'; boss.cw*=-1; } }
  else if(boss.state==='roar'){ boss.hop=Math.sin(Math.min(1,boss.st/.9)*Math.PI)*.4; if(boss.st<.9&&Math.random()<.5) fx(boss.x,boss.z,1+boss.st*6,[1,.75,.4],.18);
    if(boss.st>.9){ DBG.shake=Math.max(DBG.shake||0,1.1); sfx.boom(); fx(boss.x,boss.z,9,[1,.8,.45],.5); buzz(120);
      if(d<9&&!S.inSafe){ S.shoeT=Math.max(S.shoeT||0,2.6); toast('어흥—','포효에 발이 굳었다'); }
      for(let i=0;i<3;i++) spawnAround('shade',6); boss.state='walk'; boss.roarT=hpR<.4?8:11; } }
  else if(boss.state==='shade'){ boss.mat.transparent=true; boss.mat.opacity=Math.max(.1,1-boss.st/.5); const a=Math.atan2(boss.z-P.z,boss.x-P.x)+dt*1.9*boss.cw; boss.x=P.x+Math.cos(a)*6.5; boss.z=P.z+Math.sin(a)*6.5; bossLook(-Math.sin(a)*boss.cw,Math.cos(a)*boss.cw);
    if(Math.random()<dt*6) burst(boss.x,.3,boss.z,1,.8);
    if(boss.st>2.2){ boss.mat.opacity=1; boss.mat.transparent=false; boss.shadeT=hpR<.25?9:12; const bx=-(S.face||{x:0}).x, bz=-(S.face||{z:1}).z; boss.x=P.x+bx*5; boss.z=P.z+bz*5; burst(boss.x,1.2,boss.z,18,3); leap(P.x,P.z,3.4); boss.st=.25; } } }
function summonRing(n){ const P=player.root.position; for(let i=0;i<n;i++){ const a=i/n*6.28; spawn(i%2?'wisp':'shade',P.x+Math.cos(a)*7,P.z+Math.sin(a)*7); } }
function shot(x,z,a,spd,wait=.38){ foxShots.push({x,z,y:1.3,vx:Math.cos(a)*spd,vz:Math.sin(a)*spd,life:3.5,wait}); sfx.shot(); }
function damageBoss(n,src){
  if(!boss.alive||boss.dying>0||(S.inSafe&&src!=='dbg')) return; if(boss.freeze>0) n*=1.25; if(S.fb) n*=S.fb.boss;
  if(S.bossKey==='bulgasari'&&src==='axe'){ bossHeal(n*.3,true); boss.flash=.5; if(!boss.ateIron){ boss.ateIron=true; toast('쇠를 먹었다','불가사리는 도끼를 씹어 삼킨다'); sfx.ironChew(); } return; }
  if(boss.shield>0) n*=.3; if(boss.vuln>0) n*=1.5; if(src!=='dbg'&&S.gk&&S.gk.uni.golmu&&Math.random()<.08) n*=2;
  boss.hp-=n; boss.flash=1; if(boss.zid!=null) MPF.bdmg[boss.zid]=(MPF.bdmg[boss.zid]||0)+n;
  boss.dnA=(boss.dnA||0)+n; if(S.t-(boss.dnT??-9)>.55){ boss.dnT=S.t; const v=Math.round(boss.dnA); boss.dnA=0; if(v>=1) dnum(boss.x,(boss.def?boss.def.H:3)*.8,boss.z,v,v>=80?'big boss':'mid boss'); if(v>=80) HS=Math.max(HS,.05); }
  if(boss.hp<=0){ boss.hp=0; boss.dying=1.8; boss.mat.transparent=true; teleMesh.visible=false; slamRing.visible=false; sfx.roar(); toast(boss.def.bye); S.kills++; if(LGon()){ const k=boss.key||S.bossKey||'?'; SV.ledger.bosses[k]=(SV.ledger.bosses[k]||0)+1; lgKill(S.field||S.region,null,null); } }
}

/* ============ v2.6 필살기 (캐릭터마다 하나, 쿨타임) ============ */
const SPECIAL={fire:{name:'소방 호스 물대포',ic:gi('sp_fire'),cd:20,d:'두 번 톡 친 쪽으로 6초 동안 물대포 · 밀어내고 적신다 · 끌면 방향이 돈다'},clerk:{name:'1+1 행사',ic:gi('sp_clerk'),cd:22,d:'6초 동안 모든 공격이 두 배로 나간다'},taxi:{name:'폭주 운전',ic:gi('sp_taxi'),cd:20,d:'6초 동안 두 배로 빨리 달리며 괴수를 밀어내고 들이받는다 · 받는 피해 -60%'},gosi:{name:'부적 폭풍',ic:gi('talis'),cd:22,d:'둘레의 괴수 모두에게 부적을 붙이고 6초 동안 부적이 세 배로 탄다'},seoyun:{name:'정규 방송',ic:gi('flute'),cd:24,d:'화면 안의 괴수를 모두 3초 멈추고, 6초 동안 내 기술 범위 +30%'},haram:{name:'매무새 고르기',ic:gi('fan'),cd:20,d:'둘레 괴수를 부채 바람으로 밀어내고, 6초 동안 맞아도 매무새가 안 풀림(공격 2배)'}};
function special(aim){
  if(!S||S.phase!=='play'||S.spCd>0) return; const k=S.char, P=player.root.position, s=st(), SP=SPECIAL[k]||SPECIAL.fire;
  S.spCd=SP.cd; HS=Math.max(HS,.1); DBG.shake=Math.max(DBG.shake||0,.5); buzz(60); toast(SP.ic+' '+SP.name); S.lg=1; S.lgT=S.t;
  if(k==='clerk'){ S.bogo=6; for(let i=0;i<3;i++) fx(P.x,P.z,1.2+i*1.1,[1,.85,.3],.35+i*.12); dnum(P.x,2.3,P.z,'1+1','big'); }
  else if(k==='seoyun'){ const R=spawnR(); for(const e of enemies){ if(Math.hypot(e.x-P.x,e.z-P.z)<R) e.freeze=Math.max(e.freeze,3); } if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<R&&!(boss.fzImm>0)){ boss.freeze=1.2; boss.fzImm=6.2; } S.onAir=6; for(let i=0;i<4;i++) fx(P.x,P.z,2.5+i*2.6,[.85,.7,1],.35+i*.12); shFx(P.x,P.z,R); dnum(P.x,2.3,P.z,'ON AIR','big'); }
  else if(k==='haram'){ S.maeT=6; near(P.x,P.z,6,e=>{ const dx=e.x-P.x,dz=e.z-P.z,l=Math.hypot(dx,dz)||1; damage(e,30*st().might,dx/l,dz/l,14); }); for(let i=0;i<3;i++) fx(P.x,P.z,1.5+i*1.8,[1,.75,.85],.3+i*.1); dnum(P.x,2.3,P.z,'매무새','big'); }
  else if(k==='gosi'){ S.talStorm=6; let n=0; near(P.x,P.z,10,e=>{ if(n>=60||e.dead||e.d.treasure) return; e.talis=e.talis||{gen:0}; n++; }); for(let i=0;i<4;i++) fx(P.x,P.z,2+i*2.2,[1,.85,.3],.3+i*.1); dnum(P.x,2.3,P.z,'부적 '+n+'장','big'); }
  else if(k==='taxi'){ let dx=S.face.x,dz=S.face.z; if(aim){ const ax=aim.x-P.x,az=aim.z-P.z,al=Math.hypot(ax,az); if(al>.6){ dx=ax/al; dz=az/al; S.face={x:dx,z:dz}; player.look(dx,dz); } } S.dash={t:.3,dx,dz,hit:new Set()}; S.rush=6; S.iframe=Math.max(S.iframe||0,.6); }
  else { let a=Math.atan2(S.face.z,S.face.x); if(aim){ const ax=aim.x-P.x,az=aim.z-P.z; if(Math.hypot(ax,az)>.6) a=Math.atan2(az,ax); } S.spHose={t:6,a,tick:0}; sfx.splash(); }
}
addEventListener('keydown',e=>{ if(e.key===' ') special(); });
setTimeout(()=>{ dnInit(); const b=document.getElementById('bSp'); if(b) b.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); special(); }); },0);

/* ============ 피해·처치 ============ */
// v2.39 손맛 2: 맞은 자리에서 작은 불티가 맞은 쪽 반대로 튄다 (한 마리 0.12초에 한 번 · 한 화면 한 번에 6곳까지)
let hsF=0, spR=7; const sr=(a,b)=>{ spR=(Math.imul(spR,1103515245)+12345)&0x7fffffff; return a+(b-a)*spR/0x7fffffff; }; // 따로 쓰는 무작위(같은 씨앗 판이 갈라지지 않게)
function hitSpark(e,kx,kz){ if(hsF>=6||S.t-(e.spT??-9)<.12) return; hsF++; e.spT=S.t; DBG.spk=(DBG.spk||0)+1; const P=player.root.position;
  let dx=kx,dz=kz; if(!dx&&!dz){ dx=e.x-P.x; dz=e.z-P.z; } const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; const y=e.d.h*.55, a0=Math.atan2(dz,dx), x0=e.x-dx*e.d.r*.35, z0=e.z-dz*e.d.r*.35;
  for(let i=0;i<4;i++){ const q=sparks.items[spkI=(spkI+1)%sparks.n], a=a0+sr(-.8,.8), v=sr(3,6); q.life=sr(.14,.24); q.x=x0; q.y=y; q.z=z0; q.vx=Math.cos(a)*v; q.vz=Math.sin(a)*v; q.vy=sr(1.2,3); } }
function damage(e,n,kx=0,kz=0,kb=0){
  if(e.dead||S.inSafe||e.hid) return; if(e.freeze>0) n*=1.5; if(S.gk&&S.gk.uni.golmu&&Math.random()<.08) n*=2; if(e.mark&&S.br.barcode==='a') n*=1.3; if(e.fear>0&&S.br.mask==='a') n*=1.4;
  e.hp-=n; e.flash=.12; sfx.hit(); if(n>=.5) hitSpark(e,kx,kz); if(DBG.dealt!=null){ DBG.dealt+=n; if(DBG.shOn) DBG.shDealt=(DBG.shDealt||0)+n; }
  e.dnA=(e.dnA||0)+n; if(e.hp<=0||S.t-(e.dnT??-9)>.32){ e.dnT=S.t; const v=Math.round(e.dnA); e.dnA=0; if(v>=1){ S.dnMax=Math.max(v,(S.dnMax||0)*.995); const big=v>=S.dnMax*.7, mid=v>=S.dnMax*.35; if(big||(mid&&Math.random()<.5)||Math.random()<.18) dnum(e.x,e.d.h*.95,e.z,v,big?'big':mid?'mid':''); } }
  if(kb){ const r=1-(e.d.kbRes||0); e.kx+=kx*kb*r*1.35; e.kz+=kz*kb*r*1.35; }
  if(e.hp<=0){ e.dead=true; kill(e); }
}
function kill(e){
  if(CORPSE.length<90) CORPSE.push({type:e.type,x:e.x,z:e.z,flip:e.flip,t:0,dir:(e.x>=player.root.position.x?1:-1),gs:e.gs||1});
  // v2.39 손맛 2: 몰아잡기 — 0.35초 안에 평소보다 훨씬 많이(8마리 이상, 늦은 판일수록 더 많이) 쓰러지면 아주 잠깐 멈칫 · 살짝 흔들림 · 금빛 고리 (2초에 한 번까지)
  if(S.t-(S.mkT??-9)>.35){ S.mkT=S.t; S.mkN=0; S.mkX=0; S.mkZ=0; } S.mkN++; S.mkX+=e.x; S.mkZ+=e.z;
  const mkNeed=Math.max(8,Math.ceil(S.kills/Math.max(30,S.t)*.35*2.6)); if(S.mkN===mkNeed&&S.t-(S.mkFx??-9)>2){ S.mkFx=S.t; DBG.mk=(DBG.mk||0)+1; const cx=S.mkX/mkNeed, cz=S.mkZ/mkNeed; HS=Math.max(HS,.045); DBG.shake=Math.max(DBG.shake||0,.16); buzz(22); er(cx,cz,.4,3.2,.32,GOLD,1.1); for(let i=0;i<14;i++){ const a=sr(0,6.283), v=sr(1.6,4.8); ep(cx,.6,cz,Math.cos(a)*v,sr(1.5,3),Math.sin(a)*v,sr(.25,.45),.22,GOLD); } }
  S.kills++; if(S.duel) duelGearDrop(e); lgKill(S.field||S.region,e.type,S.char); burst(e.x,e.d.h*.5,e.z,e.d.treasure?14:e.type==='elite'||e.type==='gangcheol'||e.type==='yeongno'?10:4);
  const big=e.d.treasure||e.type==='elite'||e.type==='gangcheol'||e.type==='yeongno'; fx(e.x,e.z,big?1.4:.55+e.d.r*.5,big?[1,.85,.5]:[.9,.9,1],big?.32:.16);
  if(big){ HS=Math.max(HS,e.d.treasure?.09:.05); DBG.shake=Math.max(DBG.shake||0,.18); }
  if(e.d.treasure){ dnum(e.x,e.d.h+.6,e.z,'보물!','gold'); fx(e.x,e.z,2.4,[1,.8,.3],.6); }
  const mult=e.mark?2:1; const lm=luckMul();
  if(e.mark&&S.evo&&S.evo.barcode&&Math.round(TU('bcv'))===1){ (S.bcQ||(S.bcQ=[])).length<40&&S.bcQ.push([e.x,e.z]); } // v2.32 안ㄱ: 표시된 것이 쓰러지면 그 자리에서 바로 정산
  if(e.mark&&S.br.barcode==='b'){ let nx=null,nd=9; near(e.x,e.z,3,o=>{ if(o.dead||o.mark||o===e) return; const d=(o.x-e.x)**2+(o.z-e.z)**2; if(d<nd){nd=d;nx=o;} }); if(nx) nx.mark=true; }
  if(e.d.treasure){ S.treasures++; S.bossesW=(S.bossesW||0)+.5; 
    if(e.type==='gpig'){ S.treasures+=2; treasureLoot(e); treasureLoot(e); toast('금돼지를 잡았다','금빛 조각이 쏟아진다'); }
    else { if(!S.firstTreasure&&!BOT){ S.firstTreasure=true; choiceTreasure(e); return; }
    treasureLoot(e); } }
  else if(e.type==='yagwang'){ dropGem(e.x,e.z,4*mult,true); if(e.stole!=null&&S.shoeT>0){ S.shoeT=0; toast('신을 되찾았다','발이 가벼워졌다'); } }
  else if(e.type==='gangcheol'){ dropGem(e.x,e.z,10*mult,true); if(Math.random()<.5*lm) embersItems.push({x:e.x+.5,z:e.z,t:0}); if(Math.random()<.3*lm) joris.push({x:e.x-.5,z:e.z,t:0}); }
  else if(e.type==='yeongno'){ dropGem(e.x,e.z,12*mult,true); const n=e.eat||0; for(let i=0;i<n;i++) dropGem(e.x+rr(-1.4,1.4),e.z+rr(-1.4,1.4),3*mult,true); if(Math.random()<.5*lm) embersItems.push({x:e.x+.5,z:e.z,t:0}); if(n>=5) toast('영노가 삼킨 것을 토해 냈다',`기억 조각 ${n}무더기`); }
  else if(e.type==='elite'){ dropGem(e.x,e.z,6*mult,true); if(Math.random()<.25*lm) embersItems.push({x:e.x+.5,z:e.z,t:0}); if(Math.random()<.22*lm) joris.push({x:e.x-.5,z:e.z,t:0}); }
  else { dropGem(e.x,e.z,e.d.xp*mult,mult>1||e.gold); if(e.gold) dropGem(e.x+.3,e.z,4,true); if(Math.random()<.004*lm) embersItems.push({x:e.x,z:e.z,t:0}); else if(Math.random()<.0018*lm) joris.push({x:e.x,z:e.z,t:0}); }
  if(e.ink) inkSpread(e); if(!e.d.treasure) gearDropMob(e,big?'elite':'mob'); // v2.55 작은 불씨(장비) · 번지는 먹
  // 부적 옮겨 붙기
  if(e.talis&&e.talis.gen<7){ const W=S.W.talis||0, k=S.evo.talis?5:W>=5?3:2; let n=0; const near2=[];
    near(e.x,e.z,3.6,o=>{ if(!o.dead&&!o.talis&&o!==e) near2.push(o); });
    near2.sort((a,b)=>((a.x-e.x)**2+(a.z-e.z)**2)-((b.x-e.x)**2+(b.z-e.z)**2));
    for(const o of near2){ if(n>=k) break; o.talis={gen:e.talis.gen+1}; n++; fx(o.x,o.z,.5,[1,.85,.3],.2); } }
}
function treasureLoot(e){ for(let i=0;i<4;i++) dropGem(e.x+rr(-.8,.8),e.z+rr(-.8,.8),5,true); if(Math.random()<.7) embersItems.push({x:e.x,z:e.z,t:0}); if(Math.random()<.5) joris.push({x:e.x+.6,z:e.z,t:0}); toast('보물을 얻었다'); }
function dropGem(x,z,v,big){
  if(gems.length>=330&&S&&S.t-(S.vacT??-9)>2){ S.vacT=S.t; const P=player.root.position; for(const g of gems) if(!g.pull&&(g.x-P.x)**2+(g.z-P.z)**2>49) g.pull=true; }
  if(gems.length>=400){ let best=null,bd=1e9; for(const g of gems){ const d=(g.x-x)**2+(g.z-z)**2; if(d<bd){bd=d;best=g;} } if(best){ best.v+=v; best.big=best.big||v>=5; } return; }
  gems.push({x,z,v,big,pull:false,t:rr(0,6)});
}
// v2.25 쓰러진 친구 살리기(멀티): 같은 필드에 다른 사람이 있으면 바로 끝나지 않고 25초 쓰러진다.
// presence만 쓴다 — 쓰러진 사람이 곁의 사람 위치를 보고 스스로 일어난다(곁에 3초). 한 판에 두 번까지.
function downStart(){ S.down={t:25,pr:0}; S.downN=(S.downN||0)+1; S.hp=0; S.iframe=0; try{ player.bb.rotation.z=1.25; player.mat.opacity=.6; player.mat.transparent=true; }catch(e){}
  toast('쓰러졌다','같이 걷는 사람이 곁에 3초 서 있으면 다시 일어난다'); downBan(); sfx.hurt(); }
function downBan(){ let b=document.getElementById('downBan'); if(!b){ b=document.createElement('div'); b.id='downBan'; b.style.cssText='position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:8;background:rgba(20,10,24,.88);border:2px solid #ff9a40;color:#ffe8c8;border-radius:14px;padding:10px 16px;text-align:center;font-weight:800;font-size:15px;pointer-events:none;min-width:200px'; document.body.appendChild(b); }
  if(!S||!S.down){ b.style.display='none'; return; } b.style.display='block'; const p=Math.min(1,S.down.pr/3), n=Math.ceil(S.down.t);
  b.innerHTML=`쓰러졌다 · ${n}초<div style="margin:7px 0 3px;height:9px;border-radius:5px;background:#3a2a30;overflow:hidden"><div style="height:100%;width:${(p*100).toFixed(0)}%;background:linear-gradient(90deg,#ffb050,#fff0a0)"></div></div><small style="font-weight:600;opacity:.85">${S.down.who?S.down.who+'가 일으키는 중':'곁에 누가 와야 일어난다'}</small>`; }
function downTick(dt){ if(!S.down) return; const D=S.down, P=player.root.position; D.t-=dt; let who='';
  for(const p of mpFieldPeers()){ const q=p.presence; if(typeof q.x!=='number'||q.dn===1||q.h===0) continue; if(Math.hypot(q.x-P.x,q.z-P.z)<2.6){ who=mpName(p); break; } }
  D.who=who; D.pr=who?D.pr+dt:Math.max(0,D.pr-dt*.5);
  if(D.pr>=3){ S.down=null; S.hp=S.maxhp*.4; S.iframe=2.5; try{ player.bb.rotation.z=0; player.mat.opacity=1; }catch(e){} downBan();
    fx(P.x,P.z,4,[1,.85,.5],.5); near(P.x,P.z,4,e=>{ const dx=e.x-P.x,dz=e.z-P.z,l=Math.hypot(dx,dz)||1; damage(e,30,dx/l,dz/l,8); }); toast('다시 일어났다',who+'가 일으켜 세웠다'); return; }
  if(D.t<=0){ S.down=null; try{ player.bb.rotation.z=0; player.mat.opacity=1; }catch(e){} downBan(); S.hp=0; gameOver(); return; }
  if(((D.t*4)|0)!==D._f){ D._f=(D.t*4)|0; downBan(); } }
function hurtPlayer(n,once=false,soft=false){ n*=deepF(S.deep||0).dmg*TU('edmg')*(1-.45*Math.min(1.5,S.nb||0));
  if(S.phase!=='play'||S.inSafe||S.down) return; if(S.duel&&(S.duel.dead>0||S.duel.end)) return; if(once&&(S.iframe||0)>0) return; if(S.dash) return; if((S.jpInv||0)>0) return; if((S.gamtu||0)>0) return;
  n*=st().armor; if(S.gk&&S.gk.uni.turtle){ const P1=player.root.position, sc=nearest(P1.x,P1.z,3.5); if(sc&&(sc.x-P1.x)*S.face.x+(sc.z-P1.z)*S.face.z<0) n*=.65; } if(S.rush>0) n*=.4; if(BOT){ const k=(new Error().stack.split('\n')[2]||'').replace(/.*:(\d+):\d+\)?$/,'$1'); (DBG.hb||(DBG.hb={}))[k]=((DBG.hb[k]||0)+n); } S.hp-=n; S.hurtT=Math.min(1,S.hurtT+n*.08); sfx.hurt();
  if(once){ const P0=player.root.position; dnum(P0.x,1.9,P0.z,'-'+Math.max(1,Math.round(n)),'hurt'); if(!soft) HS=Math.max(HS,.07); }
  // v2.1 피격 반응: 진동 · 붉은 번쩍임 · 깜빡임 · 밀려남 (이어지는 접촉은 0.26초마다 한 번)
  const now=S.t;
  if(once||now-(S.hitAt??-9)>.26){ S.hitAt=now; S.hitFlash=1; S.hurtT=Math.min(1,S.hurtT+(once?.55:.3)); buzz(once?75:28);
    DBG.shake=Math.max(DBG.shake||0,once?(soft?.2:.45):.16);
    const P=player.root.position, src=nearest(P.x,P.z,3.5); fx(P.x,P.z,.75,[1,.25,.3],.16);
    if(src){ const dx=P.x-src.x,dz=P.z-src.z,l=Math.hypot(dx,dz)||1, k=once?(soft?.32:.75):.18; P.x+=dx/l*k; P.z+=dz/l*k;
      if(!WORLD){ const r=Math.hypot(P.x,P.z); if(r>ARENA){ P.x*=ARENA/r; P.z*=ARENA/r; } } }
    if(once) S.iframe=soft?.45:.5; }
  if(S.hp<=0){
    if(S.duel){ duelDie(); return; }
    if(S.noRise){ S.hp=0; gameOver(); return; }
    if(S.gk&&S.gk.uni.horib&&!S.horiU){ S.horiU=1; S.hp=S.maxhp*.3; S.iframe=1.2; const P2=player.root.position; fx(P2.x,P2.z,2.5,[1,.85,.35],.5); toast('🍶 호리병','한 모금 — 다시 버틴다'); return; }
    if(S.revive>0){ S.revive--; if(LGon()) SV.ledger.revives++; S.hp=S.maxhp*.5; const P=player.root.position; near(P.x,P.z,5,e=>{ const dx=e.x-P.x,dz=e.z-P.z,l=Math.hypot(dx,dz)||1; damage(e,60,dx/l,dz/l,10); }); fx(P.x,P.z,5,[1,.7,.3],.5); toast('불씨가 대신 타올랐다','다시 일어난다'); return; }
    if(!S.down&&FIELD&&S.field&&mpFieldPeers().length&&(S.downN||0)<2){ downStart(); return; }
    S.hp=0; gameOver(); }
}

/* ============ 공간 격자 ============ */
const CELL=1.4, grid=new Map();
const key=(ix,iz)=>(ix+500)*1000+(iz+500);
function buildGrid(){ grid.clear(); for(const e of enemies){ if(e.dead||e.hid) continue; const k=key(Math.floor(e.x/CELL),Math.floor(e.z/CELL)); let a=grid.get(k); if(!a){a=[];grid.set(k,a);} a.push(e); } }
function near(x,z,r,fn){ const x0=Math.floor((x-r)/CELL),x1=Math.floor((x+r)/CELL),z0=Math.floor((z-r)/CELL),z1=Math.floor((z+r)/CELL);
  for(let ix=x0;ix<=x1;ix++) for(let iz=z0;iz<=z1;iz++){ const a=grid.get(key(ix,iz)); if(a) for(const e of a) if(!e.dead) fn(e); } }
function nearest(x,z,maxD=14,skip){ let best=null,bd=maxD*maxD; for(const e of enemies){ if(e.dead||e.hid||(skip&&skip.has(e))) continue; const d=(e.x-x)**2+(e.z-z)**2; if(d<bd){bd=d;best=e;} }
  if(boss.alive&&!boss.dying){ const d=(boss.x-x)**2+(boss.z-z)**2; if(d<bd&&!(skip&&skip.has(boss))) best=boss; } return best; }
function aimFrom(ox,oz){ const tg=nearest(ox,oz,10); if(tg){ const l=Math.hypot(tg.x-ox,tg.z-oz)||1; return {x:(tg.x-ox)/l,z:(tg.z-oz)/l}; } return S.face; }

/* ============ 무기 ============ */
function cdTick(k,base,s){ S.cd[k]=(S.cd[k]??.5)-1/60*0; return null; }
function ready(k,dt,period){ if(EVOS[k]) period*=pcd(k); S.cd[k]=(S.cd[k]??Math.min(.6,period))-dt*((S.bogo||0)>0?2:1); if(S.cd[k]<=0){ S.cd[k]=period; if(S.W[k]&&S.t-(S.lgT??-9)>.24){ S.lgT=S.t; S.lg=1; } return true; } return false; }
function shadowMult(){ const L=S.W.shadow||0; return L?pm('shadow')*((S.evo.shadow?1:.2+.1*L)+(br('shadow')==='a'?.2:0)):0; }
function shadowPos(){ return shadowP.root.position; }
// 쏘는 무기는 '어디서 쏘는지'를 받아 그림자도 같이 쓴다
function fireOrb(ox,oz,mult,s){ const W=S.W.orb, n=(S.evo.orb?5:[1,1,2,2,3][W-1])+s.amount; const skip=new Set();
  for(let i=0;i<n;i++){ const tgt=nearest(ox,oz,13,skip); if(tgt) skip.add(tgt); const a=tgt?Math.atan2(tgt.z-oz,tgt.x-ox):rr(0,6.28);
    orbs.push({x:ox,z:oz,y:1,vx:Math.cos(a)*8,vz:Math.sin(a)*8,tgt,life:2.2,pierce:S.evo.orb?99:W>=4?2:1,dmg:(10+5*W)*s.might*(S.evo.orb?1.3:1)*mult,hit:new Set()}); } }
function fireBeans(ox,oz,mult,s){ const W=S.W.beans, n=(W>=5?3:W>=3?2:1)+s.amount;
  for(let i=0;i<n;i++){ const t=nearest(ox,oz,11); const a=t?Math.atan2(t.z-oz,t.x-ox)+rr(-.3,.3):rr(0,6.28);
    beans.push({x:ox,z:oz,vx:Math.cos(a)*10,vz:Math.sin(a)*10,bounce:[3,4,4,5,6][W-1],life:3,dmg:(8+4*W)*s.might*mult,hit:new Set()}); } sfx.bean(); }
function fireHorn(ox,oz,mult,s){ const W=S.W.horn, f=aimFrom(ox,oz), range=(3.2+.35*W)*s.area*(br('horn')==='a'?1.3:1), half=S.evo.horn?Math.PI:(W>=5?.95:.65), dmg=(10+5*W)*s.might*(W>=4?1.25:1)*mult;
  near(ox,oz,range,e=>{ const ex=e.x-ox,ez=e.z-oz,d=Math.hypot(ex,ez)||1; if(d>range+e.d.r) return; if(Math.acos(Math.max(-1,Math.min(1,(ex*f.x+ez*f.z)/d)))>half) return; damage(e,dmg,ex/d,ez/d,e.d.treasure?2:br('horn')==='a'?13:9); if(S.fu.saja&&!e.d.treasure) e.fear=Math.max(e.fear||0,1); });
  if(boss.alive){ const ex=boss.x-ox,ez=boss.z-oz,d=Math.hypot(ex,ez)||1; if(d<range+1&&(S.evo.horn||(ex*f.x+ez*f.z)/d>Math.cos(half))) damageBoss(dmg); }
  fx(ox,oz,range,[1,.85,.5],.3,Math.atan2(f.z,f.x)); sfx.horn(); evoEv('horn',ox,oz,range); }
function fireBarcode(ox,oz,mult,s,who){ const f=aimFrom(ox,oz); who.sweep={a0:Math.atan2(f.z,f.x)-.9*(S.W.barcode>=5?1.3:1),a1:Math.atan2(f.z,f.x)+.9*(S.W.barcode>=5?1.3:1),t:0,len:(4+.45*S.W.barcode)*s.area,dmg:(7+4*S.W.barcode)*s.might*(S.W.barcode>=4?1.25:1)*mult,hit:new Set()}; sfx.beep(); }
function stepSweep(who,ox,oz,dt){ const sw=who.sweep; if(!sw) return; sw.t+=dt/0.32; const a=sw.a0+(sw.a1-sw.a0)*Math.min(1,sw.t), cx=Math.cos(a), cz=Math.sin(a);
  near(ox+cx*sw.len/2,oz+cz*sw.len/2,sw.len/2+.6,e=>{ if(sw.hit.has(e)) return; const ex=e.x-ox,ez=e.z-oz, along=ex*cx+ez*cz; if(along<0||along>sw.len) return; const perp=Math.abs(ex*cz-ez*cx); if(perp>.45+e.d.r*.6) return; sw.hit.add(e); if(!e.mark){ e.mark=true; } damage(e,sw.dmg); });
  if(boss.alive&&!sw.hit.has(boss)){ const ex=boss.x-ox,ez=boss.z-oz, along=ex*cx+ez*cz, perp=Math.abs(ex*cz-ez*cx); if(along>0&&along<sw.len&&perp<1.2){ sw.hit.add(boss); damageBoss(sw.dmg); } }
  if(who===S){ beamMesh.visible=true; beamMesh.position.set(ox,.15,oz); beamMesh.rotation.set(-Math.PI/2,-a,0); beamMesh.scale.set(sw.len,.6,1); }
  if(sw.t>=1){ who.sweep=null; if(who===S) beamMesh.visible=false; } }
function weapons(dt){
  const s=st(), P=player.root.position, W=S.W, E=S.evo; const M0=s.might;
  const sm=shadowMult(); const SP=shadowPos();
  // 소방 도끼
  s.might=M0*pm('axe');
  const axN=Math.min(6,(E.axe?6:W.axe?[1,2,2,3,4][W.axe-1]:0)+(W.axe&&br('axe')==='a'?1:0)), axR=(E.axe?2.3:1.7)*s.area*(br('axe')==='b'?1+.85*(.5+.5*Math.sin(S.t*2.2)):1), axD=(12+5*(W.axe||0))*s.might*(E.axe?1.4:1)*(W.axe>=3?1.2:1);
  S.axeA=(S.axeA||0)+dt*(E.axe?3.6:3.2)*(br('axe')==='a'?1.4:1);
  for(let i=0;i<AXES.length;i++){ const A=AXES[i]; if(i>=axN){ A.g.visible=false; continue; } A.g.scale.setScalar(FXS*1.1);
    const a=S.axeA+i/axN*6.28, x=P.x+Math.cos(a)*axR, z=P.z+Math.sin(a)*axR*.85; A.g.visible=true; A.g.position.set(x,.55,z); A.m.rotation.z=-S.axeA*5; A.g.scale.setScalar(E.axe?1.25:1);
    near(x,z,.75,e=>{ const dd=Math.hypot(e.x-x,e.z-z); if(dd>.55+e.d.r) return; const last=e.hitCd.get(A)||0; if(S.t-last<.4) return; e.hitCd.set(A,S.t);
      const kx=(e.x-P.x),kz=(e.z-P.z),kl=Math.hypot(kx,kz)||1; damage(e,axD,kx/kl,kz/kl,3); });
    if(boss.alive&&Math.hypot(boss.x-x,boss.z-z)<1.3){ const last=boss.axeHit[i]||0; if(S.t-last>.4){ boss.axeHit[i]=S.t; damageBoss(axD,'axe'); } }
  }
  // 등불 (그림자도 절반 크기로)
  s.might=M0*pm('lantern');
  const lR=W.lantern?(1.45+.28*W.lantern)*s.area*(E.lantern?1.45:1):0;
  auraMesh.visible=lR>0; auraMesh.position.set(P.x,.05,P.z); auraMesh.scale.setScalar(lR*1.12); auraMesh.material.opacity=.3+.12*Math.sin(S.t*3); // v2.15: 등불 고리 덜 반짝
  auraMesh2.visible=lR>0&&sm>0; auraMesh2.position.set(SP.x,.05,SP.z); auraMesh2.scale.setScalar(lR*.7*1.12);
  lanternL.R=Math.max(6,lR+3.5)*(1+.25*upLv('lantern')); lanternL.l.distance=lanternL.R*1.6;
  if(lR>0){ const slow=W.lantern>=3?.6:1; if(br('lantern')==='a') S.hp=Math.min(S.maxhp,S.hp+1.5*dt);
    near(P.x,P.z,lR,e=>{ if(Math.hypot(e.x-P.x,e.z-P.z)<lR+e.d.r*.5) e.slow=Math.min(e.slow,slow); });
    if(ready('lantern',dt,.5)){ const dmg=(4+3*W.lantern+(W.lantern>=5?4:0))*s.might*(E.lantern?1.7:1); evoEv('lantern',P.x,P.z,lR);
      near(P.x,P.z,lR,e=>{ if(Math.hypot(e.x-P.x,e.z-P.z)<lR+e.d.r*.5){ damage(e,dmg); if(br('lantern')==='b'&&Math.random()<.08) e.freeze=Math.max(e.freeze,.8); } });
      if(sm){ near(SP.x,SP.z,lR*.7,e=>{ if(Math.hypot(e.x-SP.x,e.z-SP.z)<lR*.7+e.d.r*.5) damage(e,dmg*sm); }); S.shFl=Math.max(S.shFl||0,.12); }
      if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<lR+.8) damageBoss(dmg); } }
  if(br('shadow')==='b'&&shadowP.root.visible) near(SP.x,SP.z,1.8,e=>{ e.slow=Math.min(e.slow,.55); });
  // 혼불
  s.might=M0*pm('orb');
  if(W.orb&&ready('orb',dt,(E.orb?.9:1.35-.1*W.orb)*s.cd)){ fireOrb(P.x,P.z,1,s); if(sm){ fireOrb(SP.x,SP.z,sm,s); S.shFl=.3; } }
  // 팥 튕기기
  s.might=M0*pm('beans');
  if(W.beans&&ready('beans',dt,(1.6-.1*W.beans)*s.cd)){ fireBeans(P.x,P.z,1,s); if(sm){ fireBeans(SP.x,SP.z,sm,s); S.shFl=.3; } }
  if(W.beans&&br('beans')==='b'&&ready('beanRain',dt,3)){ const cand=[]; near(P.x,P.z,9,e=>{ if(!e.d.treasure) cand.push(e); }); for(let i=0;i<6&&cand.length;i++){ const e=cand.splice(Math.floor(Math.random()*cand.length),1)[0]; areaHit(e.x,e.z,.7,(8+4*W.beans)*s.might); fx(e.x,e.z,.7,[1,.65,.25],.2); } sfx.bean(); }
  // 경적
  s.might=M0*pm('horn');
  if(W.horn&&ready('horn',dt,(2.6-.2*W.horn)*s.cd*(W.horn>=3?.85:1))){ fireHorn(P.x,P.z,1,s); if(sm){ fireHorn(SP.x,SP.z,sm,s); S.shFl=.3; } if(br('horn')==='b') S.hornAgain=.28; }
  if(S.hornAgain>0){ S.hornAgain-=dt; if(S.hornAgain<=0) fireHorn(P.x,P.z,.8,s); }
  // 바코드 빛
  s.might=M0*pm('barcode');
  if(W.barcode&&ready('barcode',dt,(2.0-.15*W.barcode)*s.cd*(W.barcode>=3?.85:1))){ fireBarcode(P.x,P.z,1,s,S); if(sm){ S.shSweepO=true; fireBarcode(SP.x,SP.z,sm,s,S.sh||(S.sh={})); } }
  stepSweep(S,P.x,P.z,dt); if(S.sh) stepSweep(S.sh,SP.x,SP.z,dt);
  const BCV=Math.round(TU('bcv'));
  if(E.barcode&&BCV===2){ // v2.32 안ㄴ: 표시가 6개 쌓이거나 2.5초마다 정산 · 많이 쌓였을수록 세게
    S.bcT=(S.bcT||0)+dt; let m=0; for(const e of enemies) if(e.mark&&!e.dead) m++;
    if(m&&(m>=6||S.bcT>=2.5)){ S.bcT=0; const mul=1+Math.min(m,20)*.04; for(const e of enemies){ if(e.mark&&!e.dead){ fx(e.x,e.z,1.2,[1,.78,.3],.3); evoEv('barcode',e.x,e.z,1.2); near(e.x,e.z,1.2,o=>damage(o,35*s.might*mul)); } } DBG.bcN=(DBG.bcN||0)+1; sfx.beep(); } }
  else if(E.barcode&&ready('settle',dt,5)){ let n=0; for(const e of enemies){ if(e.mark&&!e.dead){ n++; fx(e.x,e.z,1.2,[1,.78,.3],.3); evoEv('barcode',e.x,e.z,1.2); near(e.x,e.z,1.2,o=>damage(o,35*s.might)); } } if(n){ sfx.beep(); DBG.bcN=(DBG.bcN||0)+1; } }
  if(S.bcQ&&S.bcQ.length){ const q=S.bcQ.splice(0,12); for(const [x,z] of q){ fx(x,z,1.3,[1,.78,.3],.3); evoEv('barcode',x,z,1.3); near(x,z,1.3,o=>damage(o,35*s.might)); DBG.bcN=(DBG.bcN||0)+1; } if(q.length) sfx.beep(); }
  // 물줄기
  s.might=M0*pm('hose');
  if(W.hose){ const evo=E.hose;
    if(S.hoseT>0||ready('hose',dt,(evo?1.2:2.1-.17*W.hose)*s.cd)){
      if(!(S.hoseT>0)){ S.hoseT=evo?1.1:(.45+(W.hose>=5?.35:0))*s.dur; sfx.splash(); if(!player.moving){ S.face=aimFrom(P.x,P.z); } S.hoseDir=Math.atan2(S.face.z,S.face.x); }
      S.hoseT-=dt; if(!evo&&player.moving) S.hoseDir=Math.atan2(S.face.z,S.face.x);
      const range=(3+.4*W.hose)*s.area*(evo?1.2:1)*(br('hose')==='a'?1.4:1), half=br('hose')==='a'?.26:br('hose')==='b'?.63:.42, dps=(22+11*W.hose)*s.might*(W.hose>=4?1.25:1)*(evo?1.3:1)*(br('hose')==='a'?1.3:br('hose')==='b'?.85:1);
      S.hoseTick=(S.hoseTick||0)-dt; const tick=S.hoseTick<=0; if(tick) S.hoseTick=.1;
      for(const off of (evo?[0,2.094,-2.094]:[0])){ const a=S.hoseDir+off, cx=Math.cos(a), cz=Math.sin(a);
        for(let k=0;k<(MOBILE?3:5);k++){ const w=water.items[waterI=(waterI+1)%water.n]; const aa=a+rr(-half,half)*.8, v=rr(6,9)*range/4; w.life=range/v*rr(.8,1); w.x=P.x+cx*.5; w.z=P.z+cz*.5; w.y=.9; w.vx=Math.cos(aa)*v; w.vz=Math.sin(aa)*v; w.vy=rr(-.3,.6); }
        if(tick){ near(P.x+cx*range*.5,P.z+cz*range*.5,range*.6,e=>{ const ex=e.x-P.x,ez=e.z-P.z,d=Math.hypot(ex,ez); if(d>range+e.d.r||d<.01) return; const ang=Math.acos(Math.max(-1,Math.min(1,(ex*cx+ez*cz)/d))); if(ang>half+e.d.r/d) return; damage(e,dps*.1,cx,cz,(e.d.treasure?1:5)); if(br('hose')==='b') e.slow=Math.min(e.slow,.5); });
          if(boss.alive){ const ex=boss.x-P.x,ez=boss.z-P.z,d=Math.hypot(ex,ez); if(d<range+1&&(ex*cx+ez*cz)/d>Math.cos(half+.3)) damageBoss(dps*.1); } } } }
  }
  // 소금 길
  s.might=M0*pm('salt');
  if(W.salt){ const life=(3.5+.6*W.salt+(W.salt>=5?2:0))*s.dur, dmg=(4+2.5*W.salt)*s.might*(W.salt>=3?1.3:1)*(br('salt')==='a'?1.5:1), rad=.55*(W.salt>=4?1.35:1)*s.area*(br('salt')==='a'?1.2:1);
    if(br('salt')==='b'&&!player.moving&&ready('saltRing',dt,.8)){ for(let i=0;i<6;i++){ const a=i/6*6.28+S.t; salts.push({x:P.x+Math.cos(a)*1.6,z:P.z+Math.sin(a)*1.6,t:0,life,r:rad}); } sfx.salt(); }
    if(S.saltD>=.45){ S.saltD=0; salts.push({x:P.x,z:P.z,t:0,life,r:rad}); if(salts.length>260) salts.shift(); S.saltPath.push({x:P.x,z:P.z,t:S.t}); if(S.saltPath.length>120) S.saltPath.shift(); sfx.salt();
      if(E.salt&&S.loopCd<=0) checkSaltLoop(s); }
    S.saltTick=(S.saltTick||0)-dt; const tick=S.saltTick<=0; if(tick) S.saltTick=.3;
    for(let i=salts.length-1;i>=0;i--){ const q=salts[i]; q.t+=dt; if(q.t>q.life){ salts.splice(i,1); continue; }
      near(q.x,q.z,q.r+.4,e=>{ if(Math.hypot(e.x-q.x,e.z-q.z)<q.r+e.d.r*.5){ e.slow=Math.min(e.slow,.45); if(tick&&!e.saltHit){ e.saltHit=true; damage(e,dmg*(q.m||1)); } } }); }
    if(tick&&boss.alive&&salts.some(q=>Math.hypot(boss.x-q.x,boss.z-q.z)<q.r+1.1)) damageBoss(dmg*3);
    if(tick) for(const e of enemies) e.saltHit=false;
    S.loopCd-=dt; }
  // 포스트잇 부적
  s.might=M0*pm('talis');
  if(W.talis&&ready('talis',dt,(2.3-.2*W.talis)*s.cd)){ const n=(W.talis>=4?2:1)+s.amount; let c=0; const cand=[]; near(P.x,P.z,7,e=>{ if(!e.talis&&!e.d.treasure) cand.push(e); });
    for(let i=0;i<n&&cand.length;i++){ const e=cand.splice(Math.floor(Math.random()*cand.length),1)[0]; e.talis={gen:0}; fx(e.x,e.z,.5,[1,.85,.3],.2); c++; } }
  if(S.talStorm>0){ S.talStorm-=dt; S.tsFx=(S.tsFx||0)-dt; if(S.tsFx<=0){ S.tsFx=.5; fx(P.x,P.z,1.6,[1,.85,.3],.35); } }
  if(W.talis||S.talStorm>0){ S.talTick=(S.talTick||0)-dt; if(S.talTick<=0){ S.talTick=.5; const dmg=(5+3*W.talis)*s.might*(W.talis>=3?1.3:1)*.5*(br('talis')==='a'?2:1)*(S.talStorm>0?3:1); for(const e of enemies) if(e.talis&&!e.dead){ damage(e,dmg); if(br('talis')==='b') e.slow=Math.min(e.slow,.5); } if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<7) damageBoss(dmg*1.5); } }
  // 만파식적
  s.might=M0*pm('flute');
  if(W.flute&&ready('flute',dt,(11-.8*W.flute-(W.flute>=5?1.5:0))*s.cd)){ const dur=(1+.25*W.flute+(W.flute>=4?.3:0))*s.dur*(E.flute?2:1), R=spawnR(); evoEv('flute',P.x,P.z,R);
    for(const e of enemies){ if(Math.hypot(e.x-P.x,e.z-P.z)<R) e.freeze=Math.max(e.freeze,dur); }
    if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<R&&!(boss.fzImm>0)){ boss.freeze=Math.min(1.2,dur*.25); boss.fzImm=boss.freeze+5; } // v2.47 보스는 최대 1.2초만 멈추고, 풀린 뒤 5초는 안 멈춤(각성하면 보스가 거의 계속 멈춰 있던 것)
    if(br('flute')==='a') near(P.x,P.z,R*.5,e=>{ const dx=e.x-P.x,dz=e.z-P.z,l=Math.hypot(dx,dz)||1; e.kx+=dx/l*10; e.kz+=dz/l*10; }); if(br('flute')==='b') S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.08);
    fx(P.x,P.z,R*.8,[.5,.8,1],.6); sfx.flute(); }
  // 도깨비 방망이
  s.might=M0*pm('club');
  if(W.club&&ready('club',dt,(1.7-.12*W.club)*s.cd*(W.club>=3?.85:1))){ const f=player.moving?S.face:aimFrom(P.x,P.z), R=(1.9+.15*W.club)*s.area*(W.club>=4?1.2:1), half=1.2, dmgB=(14+6*W.club)*s.might*(W.club>=5?1.3:1);
    const kinds=['불','얼음','금','크게']; const picks=E.club?[kinds.splice(Math.floor(Math.random()*4),1)[0],kinds[Math.floor(Math.random()*3)]]:[kinds[Math.floor(Math.random()*4)]];
    const must=br('club')==='a'?'금':br('club')==='b'?'크게':null; if(must&&!picks.includes(must)) picks.push(must);
    const col=picks[0]==='불'?[1,.5,.2]:picks[0]==='얼음'?[.5,.85,1]:picks[0]==='금'?[1,.85,.3]:[.9,.6,1];
    near(P.x,P.z,R,e=>{ const ex=e.x-P.x,ez=e.z-P.z,d=Math.hypot(ex,ez)||1; if(d>R+e.d.r) return; if(Math.acos(Math.max(-1,Math.min(1,(ex*f.x+ez*f.z)/d)))>half) return;
      let dmg=dmgB, kb=3; for(const p of picks){ if(p==='불') e.burn=2; if(p==='얼음') e.freeze=Math.max(e.freeze,.9); if(p==='금') e.gold=true; if(p==='크게'){ dmg*=2; kb=7; } }
      damage(e,dmg,ex/d,ez/d,kb); });
    if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<R+1) damageBoss(dmgB*(picks.includes('크게')?2:1));
    fx(P.x,P.z,R,col,.22,Math.atan2(f.z,f.x)); sfx.club(); evoEv('club',P.x,P.z,R); if(Math.random()<.25) toast('뚝딱!',picks.join(' + ')); }
  s.might=M0;
  // 택시 관성 (택시 기사 고유)
  if(S.char==='taxi'){ const on=S.runT>2||S.rush>0; headL.material.opacity=on?.7:Math.min(.3,S.runT*.15); headL.position.set(P.x+S.face.x*.8,.7,P.z+S.face.z*.8);
    if(on){ const dmg=(15+S.lv*1.5)*s.might; near(P.x,P.z,1.1,e=>{ if(Math.hypot(e.x-P.x,e.z-P.z)>.8+e.d.r) return; const last=e.hitCd.get('taxi')||0; if(S.t-last<.5) return; e.hitCd.set('taxi',S.t); damage(e,dmg,S.face.x,S.face.z,7); });
      if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<1.6&&S.t-(boss.taxiHit||0)>.5){ boss.taxiHit=S.t; damageBoss(dmg); } } } else headL.material.opacity=0;
  // 혼불 이동
  for(let i=orbs.length-1;i>=0;i--){ const o=orbs[i]; o.life-=dt;
    if(o.tgt&&(o.tgt.dead||(o.tgt===boss&&!boss.alive))) o.tgt=null;
    if(o.tgt){ const tx=o.tgt.x-o.x,tz=o.tgt.z-o.z,l=Math.hypot(tx,tz)||1; o.vx+=(tx/l*10-o.vx)*Math.min(1,dt*5); o.vz+=(tz/l*10-o.vz)*Math.min(1,dt*5); }
    o.x+=o.vx*dt; o.z+=o.vz*dt;
    near(o.x,o.z,.6,e=>{ if(o.pierce<=0||o.hit.has(e)) return; if(Math.hypot(e.x-o.x,e.z-o.z)<.35+e.d.r){ o.hit.add(e); o.pierce--; const l=Math.hypot(o.vx,o.vz)||1; damage(e,o.dmg,o.vx/l,o.vz/l,1.5); burst(o.x,1,o.z,2,1.5);
      if(br('orb')==='a'){ near(o.x,o.z,1.2,q=>{ if(q!==e&&Math.hypot(q.x-o.x,q.z-o.z)<1.1+q.d.r*.5) damage(q,o.dmg*.5); }); fx(o.x,o.z,1.1,[1,.6,.3],.18); }
      if(br('orb')==='b'&&!o.child){ o.child=true; const a0=Math.atan2(o.vz,o.vx); for(const da of [-.7,.7]) orbs.push({x:o.x,z:o.z,y:1,vx:Math.cos(a0+da)*8,vz:Math.sin(a0+da)*8,tgt:null,life:1.2,pierce:1,dmg:o.dmg*.6,hit:new Set([e]),child:true}); } } });
    if(boss.alive&&!o.hit.has(boss)&&Math.hypot(boss.x-o.x,boss.z-o.z)<1.1){ o.hit.add(boss); o.pierce--; damageBoss(o.dmg); }
    if(o.life<=0||o.pierce<=0) orbs.splice(i,1); }
  // 팥 이동
  for(let i=beans.length-1;i>=0;i--){ const b=beans[i]; b.life-=dt; b.x+=b.vx*dt; b.z+=b.vz*dt; let hitE=null;
    near(b.x,b.z,.6,e=>{ if(hitE||b.hit.has(e)) return; if(Math.hypot(e.x-b.x,e.z-b.z)<.3+e.d.r) hitE=e; });
    if(!hitE&&boss.alive&&!b.hit.has(boss)&&Math.hypot(boss.x-b.x,boss.z-b.z)<1.1) hitE=boss;
    if(hitE){ b.hit.add(hitE); if(hitE===boss) damageBoss(b.dmg); else damage(hitE,b.dmg,b.vx*.1,b.vz*.1,1); sfx.bean();
      if(E.beans&&puddles.length<60) puddles.push({x:b.x,z:b.z,t:0,life:1.6*s.dur,dmg:b.dmg*.6});
      b.bounce--; if(br('beans')==='a') b.dmg*=1.25; if(b.bounce<0){ beans.splice(i,1); continue; }
      let nx=null,nd=4.5*4.5; near(b.x,b.z,4.5,e=>{ if(b.hit.has(e)) return; const d=(e.x-b.x)**2+(e.z-b.z)**2; if(d<nd){nd=d;nx=e;} });
      if(nx){ const l=Math.sqrt(nd)||1; b.vx=(nx.x-b.x)/l*11; b.vz=(nx.z-b.z)/l*11; } else { const a=rr(0,6.28); b.vx=Math.cos(a)*10; b.vz=Math.sin(a)*10; } b.life=Math.max(b.life,1); }
    if(b.life<=0) beans.splice(i,1); }
  for(let i=puddles.length-1;i>=0;i--){ const q=puddles[i]; q.t+=dt; if(q.t>q.life){ puddles.splice(i,1); continue; } q.tick=(q.tick||0)-dt; if(q.tick<=0){ q.tick=.3; near(q.x,q.z,.9,e=>{ if(Math.hypot(e.x-q.x,e.z-q.z)<.8) damage(e,q.dmg*.3); }); } }
  weapons2(dt,s,P); shadowWeapons(dt,s,P); fusions2(dt,s,P);
  // 쓰러진 깨어난 자가 돕는다 (선택 C3)
  if(S.ally>0&&boss.alive&&!boss.dying){ S.ally-=dt; if(ready('ally',dt,.7)){ const a=Math.atan2(boss.z-P.z,boss.x-P.x); orbs.push({x:P.x-1,z:P.z-1,y:1.2,vx:Math.cos(a)*8,vz:Math.sin(a)*8,tgt:boss,life:2.5,pierce:1,dmg:40,hit:new Set()}); } }
}
function checkSaltLoop(s){ const path=S.saltPath, n=path.length; if(n<14) return; const cur=path[n-1];
  for(let i=0;i<n-12;i++){ const p=path[i]; if(S.t-p.t<1.5) break; if(Math.hypot(p.x-cur.x,p.z-cur.z)<1.1){
      const poly=path.slice(i); let cx=0,cz=0; for(const q of poly){ cx+=q.x; cz+=q.z; } cx/=poly.length; cz/=poly.length; let maxR=0; for(const q of poly) maxR=Math.max(maxR,Math.hypot(q.x-cx,q.z-cz));
      let hits=0; near(cx,cz,maxR+1,e=>{ if(inPoly(e.x,e.z,poly)){ damage(e,(70+15*S.W.salt)*s.might); hits++; } });
      if(boss.alive&&inPoly(boss.x,boss.z,poly)) damageBoss((70+15*S.W.salt)*s.might*2);
      fx(cx,cz,maxR,[1,1,1],.5); toast('소금 결계',hits?`${hits}이 갇혔다`:''); S.loopCd=2; S.saltPath.length=0; DBG.shake=Math.max(DBG.shake||0,.4); return; } } }
function inPoly(x,z,p){ let c=false; for(let i=0,j=p.length-1;i<p.length;j=i++){ if(((p[i].z>z)!==(p[j].z>z))&&(x<(p[j].x-p[i].x)*(z-p[i].z)/(p[j].z-p[i].z)+p[i].x)) c=!c; } return c; }

/* ============ 레벨업 ============ */
function gainXp(v){ S.xp+=v*(S.duel&&S.duel.behind?DG_XP:1)*(S.char==='gosi'?1.3:1)*(S.fb?S.fb.xp:1)*TU('xp')*(PTY.near?1+TU('ptxp'):1); while(S.xp>=S.need){ S.xp-=S.need; S.lv++; S.need=need(S.lv); S.pendingLv++; } }
function choices(){
  const out=[], W=S.W, P=S.P, E=S.evo, wc=Object.keys(W).length, pc=Object.keys(P).length;
  for(const k in EVOS){ const ev=EVOS[k]; if(W[k]===5&&P[ev.need]&&!E[k]) out.push({kind:'evo',id:k,w:100,ic:WEAPONS[k].ic,name:ev.name,tag:'각성 ★',desc:ev.desc});
    else if(E[k]&&(P[ev.need]||0)>=5&&!(S.evo2&&S.evo2[k])) out.push({kind:'evo2',id:k,w:110,ic:WEAPONS[k].ic,name:'진 '+ev.name,tag:'각성 ★★',desc:`한 번 더 깨어난다 · 위력 ×1.5 · 더 빨리`}); }
  for(const k in FUS){ const f=FUS[k]; if(f.char&&f.char!==S.char) continue; if(W[f.a]>=5&&W[f.b]>=5&&!S.fu[k]) out.push({kind:'fu',id:k,w:120,ic:f.ic,name:f.name,tag:`조합 · ${WEAPONS[f.a].ic} + ${WEAPONS[f.b].ic}`,desc:f.desc}); }
  for(const k in WEAPONS){ const l=W[k]||0; if(E[k]||l>=5||(!l&&wc>=MAXW)||S.sealed[k]) continue; const pv=upLv('preview')&&l===2&&BR[k]?`<small class="pv">Lv3 갈래 · ㄱ ${BR[k].a[0]} / ㄴ ${BR[k].b[0]}</small>`:''; out.push({kind:'w',id:k,w:l?1.3:(WEAPONS[k].kind==='독창'?1.25:1),ic:WEAPONS[k].ic,name:WEAPONS[k].name,tag:l?`Lv ${l+1}`:'새 무기',desc:WEAPONS[k].desc(l+1)+pv}); }
  for(const k in PASSIVES){ const l=P[k]||0; if(l>=5||(!l&&pc>=MAXP)||S.sealed['p_'+k]) continue; out.push({kind:'p',id:k,w:l?1:.9,ic:PASSIVES[k].ic,name:PASSIVES[k].name,tag:l?`Lv ${l+1}`:'새 힘',desc:PASSIVES[k].desc}); }
  for(const k in WEAPONS){ const l=W[k]||0; if(l<5) continue; const st=(S.star&&S.star[k])||0; out.push({kind:'star',id:k,w:out.length>4?.35:1,ic:WEAPONS[k].ic,name:WEAPONS[k].name+' ★'+(st+1),tag:'끝없는 성장',desc:'모든 공격 +4% (★마다)'}); }
  for(const c of out){ // v2.25 짝 안내 → v2.36 화면 정리(51번 9): 숫자·어려운 말 빼고 「짝」 하나만
    if(c.kind==='w'&&EVOS[c.id]){ const pk=EVOS[c.id].need, pl=P[pk]||0, pn=PASSIVES[pk].ic+PASSIVES[pk].name; if(pl) c.pair=`짝 ${pn} ✔`; c.desc+=`<small class="pv">짝 ${pn}${E[c.id]?' · 짝을 끝까지 키우면 한 번 더 깨어남':' · 같이 있으면 Lv5에 각성'}</small>`; }
    if(c.kind==='p'){ const ws=pairsOf(c.id); if(ws.length){ const own=ws.filter(k=>W[k]); if(own.length) c.pair=`짝 ${own.map(k=>WEAPONS[k].ic+WEAPONS[k].name).join('·')} ✔`; c.desc+=`<small class="pv">짝 무기 ${(own.length?own:ws).map(k=>WEAPONS[k].ic+WEAPONS[k].name).join('·')}${own.length?' · 같이 세진다':''}</small>`; } } }
  const pick=[]; const pool=out.slice();
  const NC=upLv('card4')?4:3; while(pick.length<NC&&pool.length){ const tot=pool.reduce((a,c)=>a+c.w,0); let r=Math.random()*tot; let i=0; for(;i<pool.length;i++){ r-=pool[i].w; if(r<=0) break; } pick.push(pool.splice(Math.min(i,pool.length-1),1)[0]); }
  if(pick.length===3&&pick.every(c=>c.kind==='p')){ const w=out.filter(c=>c.kind!=='p'); if(w.length) pick[2]=w[Math.floor(Math.random()*w.length)]; }
  if(!pick.length){ pick.push({kind:'heal',id:'heal',ic:'♨',name:'따뜻한 불씨',tag:'회복',desc:'체력을 40 되찾는다'}); pick.push({kind:'shard',id:'shard',ic:'✦',name:'기억 한 줌',tag:'조각',desc:'들고 있는 기억 조각 +8'}); }
  return pick;
}
function apply(c){
  if(c.kind==='w'){ if(!S.W[c.id]){ S.wGot=S.wGot||{}; S.wGot[c.id]=S.t||0; } S.W[c.id]=(S.W[c.id]||0)+1; SV.found['w_'+c.id]=1; if(c.id==='shadow') shadowP.root.visible=true; if(S.W[c.id]===3&&BR[c.id]&&!S.br[c.id]) S.pendingBr=c.id; }
  else if(c.kind==='fu'){ S.fu[c.id]=true; SV.found['f_'+c.id]=1; toast(c.name,'두 기술이 합쳐졌다'); DBG.shake=.5; }
  else if(c.kind==='p'){ S.P[c.id]=(S.P[c.id]||0)+1; if(c.id==='hp'){ S.maxhp+=20; S.hp+=20; } }
  else if(c.kind==='evo2'){ S.evo2=S.evo2||{}; S.evo2[c.id]=true; SV.found['e2_'+c.id]=1; toast(c.name,'2차 각성했다'); evoMoment(c.id,true); }
  else if(c.kind==='evo'){ S.evo[c.id]=true; SV.found['e_'+c.id]=1; toast(c.name,'각성했다'); if(c.id==='shadow') shadowP.root.scale.setScalar(1.35); evoMoment(c.id); }
  else if(c.kind==='star'){ S.star=S.star||{}; S.star[c.id]=(S.star[c.id]||0)+1; S.starN=(S.starN||0)+1; }
  else if(c.kind==='heal') S.hp=Math.min(S.maxhp,S.hp+40);
  else if(c.kind==='shard'){ S.bonus=(S.bonus||0)+8; toast('기억 한 줌','들고 있는 조각 +8'); }
  renderSlots();
}
// v2.7: 안 멈추는 레벨업 — 화면 아래 카드 (v2.7.5부터 직접 고름)
const LVB_T=5;
function recPick(cs){ return cs.find(c=>c.kind==='fu')||cs.find(c=>c.kind==='evo')||cs.find(c=>c.kind==='evo2')||cs.find(c=>c.kind==='w'&&S.W[c.id])||cs.find(c=>c.kind==='w')||cs.find(c=>c.kind==='star')||cs[0]; }
function lvbShow(title,cs,onPick,rr){
  S.lvb={cs,rec:recPick(cs),t:LVB_T,onPick}; sfx.lvl();
  const T=$('lvbT'); T.innerHTML=`<span>${title}</span>`;
  if(rr){ const r=document.createElement('span'); r.className='rr'; r.textContent=`다시 (${S.reroll})`; r.onpointerdown=e=>{ e.stopPropagation(); e.preventDefault(); if(S.reroll<=0) return; S.reroll--; S.lvb=null; openLevelUp(); }; T.appendChild(r); }
  if(lvKeep()){ const f=document.createElement('span'); f.className='rr'; f.textContent='접기 ✕'; f.onpointerdown=e=>{ e.stopPropagation(); e.preventDefault(); S.lvb=null; $('lvbar').classList.remove('show'); updLvBadge(); }; T.appendChild(f); }
  const box=$('lvbC'); box.innerHTML='';
  cs.forEach(c=>{ const d=document.createElement('div'); d.className='lbc'+(c.kind==='evo'||c.kind==='evo2'||c.kind==='fu'?' evo':'')+(c===S.lvb.rec?' rec':'');
    d.innerHTML=`<div class="ic">${c.ic}</div><div class="tx"><b>${c.name}</b><div class="tg">${String(c.tag).replace(/<[^>]+>/g,' ')}</div>${c.pair?`<div class="tg pr">${c.pair}</div>`:''}</div>`; d.title=String(c.desc).replace(/<[^>]+>/g,' ');
    d.onpointerdown=e=>{ e.stopPropagation(); e.preventDefault(); lvbPick(c); }; box.appendChild(d); });
  $('lvbar').classList.add('show');
  if(BOT&&!location.search.includes('nopick')){ if(DBG.fixed) queueMicrotask(()=>{ if(S.lvb) lvbPick(S.lvb.rec); }); else setTimeout(()=>{ if(S.lvb) lvbPick(S.lvb.rec); },30); }
}
function lvbPick(c){ const L=S.lvb; if(!L) return; S.lvb=null; $('lvbar').classList.remove('show'); L.onPick(c); const P=player.root.position; fx(P.x,P.z,1.6,[.3,1,.85],.35); fx(P.x,P.z,2.6,[.3,1,.85],.5); burst(P.x,1,P.z,8); }
// v2.7.5: 자동 고르기 없음 — 기획자 평 '직접 고르기'. 게임은 안 멈추고 카드는 고를 때까지 남는다. (PC: 1·2·3 키)
function lvbTick(dt){ }
addEventListener('keydown',e=>{ if(!S||!S.lvb||S.phase!=='play') return; const i='123'.indexOf(e.key); if(i>=0&&S.lvb.cs[i]) lvbPick(S.lvb.cs[i]); });
// v2.9.2: 다음에 고를 것(갈래 먼저, 그다음 레벨) — 아래 카드 줄과 모닥불 곁 고르기 화면이 같이 쓴다
function nextSpec(){
  if(S.pendingBr){ const k=S.pendingBr, B=BR[k];
    return {title:`갈래 · ${WEAPONS[k].ic} ${WEAPONS[k].name}`, cs:['a','b'].map(x=>({kind:'br',x,ic:x==='a'?'ㄱ':'ㄴ',name:B[x][0],tag:`${WEAPONS[k].ic} 갈래 ${x==='a'?'ㄱ':'ㄴ'}`,desc:B[x][1]})),
      pick:c=>{ S.br[k]=c.x; SV.found['b_'+k+c.x]=1; S.pendingBr=null; renderSlots(); }}; }
  if(S.pendingLv>0) return {title:`⬆ 레벨 ${S.lv-S.pendingLv+1}${S.pendingLv>1?` <small style="opacity:.7">(+${S.pendingLv-1})</small>`:''}`, cs:choices(), pick:c=>{ apply(c); S.pendingLv--; }, rr:true};
  return null; }
function openLevelUp(){ if(S.lvb) return; const sp=nextSpec(); if(!sp) return; lvbShow(sp.title,sp.cs,c=>{ sp.pick(c); afterCard(); },sp.rr&&S.reroll>0); }
function afterCard(){ if(S.pendingBr||S.pendingLv>0) openLevelUp(); updLvBadge(); }
function openBranch(){ openLevelUp(); }
// v2.9.2 기획자 평: 싸우는 중엔 카드가 조이스틱 자리를 막는다 → 레벨업을 모아 두고(오른쪽 위 ⬆ 표시) 모닥불 고리 안에서 몰아 고른다. 멈춤 → 「레벨업」에서 바꿀 수 있음
const lvKeep=()=>SV.lvMode!=='now'&&!(BOT&&!location.search.includes('keep'));
function pendN(){ return (S.pendingLv||0)+(S.pendingBr?1:0); }
function updLvBadge(){ const b=$('lvBadge'); if(!b) return; const n=S?pendN():0, on=!!S&&S.phase==='play'&&n>0&&lvKeep()&&!S.lvb;
  b.style.display=on?'flex':'none'; if(on){ const t=`⬆ ${n}`; if(b.firstChild.textContent!==t) b.firstChild.textContent=t; } }
function openCamp(){ if(!pendN()) return; S.phase='lvup'; S.campShown=1; if(S.lvb){ S.lvb=null; $('lvbar').classList.remove('show'); } updLvBadge(); renderCamp(); $('lvup').classList.add('show'); }
function closeCamp(){ $('lvup').classList.remove('show'); $('cards').innerHTML=''; $('bCampLater').style.display='none'; if(S.phase==='lvup'){ S.phase='play'; last=performance.now(); } updLvBadge(); }
function renderCamp(){ const sp=nextSpec(); if(!sp){ toast('🔥 성장을 모두 골랐다','불빛 밖으로 나가면 다시 싸운다'); closeCamp(); return; }
  $('lvt').innerHTML=`🔥 모닥불 곁 · 밀린 성장 <b style="color:#f4b740">${pendN()}</b>`; $('lvmem').innerHTML=sp.title+`<div style="opacity:.62;font-size:.86em;margin-top:3px">누구 것인지 모를 감각이 스친다 — ${memNext()}</div>`;
  const box=$('cards'); box.innerHTML=''; const rec=recPick(sp.cs);
  for(const c of sp.cs){ const d=document.createElement('div'); d.className='card'+(c.kind==='evo'||c.kind==='evo2'||c.kind==='fu'?' evo':''); d.innerHTML=`<div class="ic">${c.ic}</div><div><div class="tag">${c.tag}${c===rec?' · 추천':''}</div><b>${c.name}</b><span>${String(c.desc).replace(/<[^>]+>/g,' ')}</span></div>`;
    d.onclick=()=>{ if(S.phase!=='lvup'||!$('lvup').classList.contains('show')) return; sp.pick(c); sfx.lvl(); const P=player.root.position; fx(P.x,P.z,1.6,[.3,1,.85],.35); renderSlots(); renderCamp(); }; box.appendChild(d); }
  const rr=$('bReroll'); rr.style.display=sp.rr&&S.reroll>0?'block':'none'; rr.textContent=`다시 고르기 (${S.reroll})`; rr.onclick=()=>{ if(S.reroll<=0) return; S.reroll--; renderCamp(); };
  const lt=$('bCampLater'); lt.style.display='block'; }
function renderSlots(){
  const el=$('slots'); el.innerHTML='';
  // v2.2: 아이콘 + 단계만 (이름은 멈춤 화면에서)
  for(const k in S.W){ const d=document.createElement('div'); d.className='slot'+(S.evo[k]?' e':'')+(S.evo[k]&&ev2(k)?' e2':''); d.innerHTML=`${WEAPONS[k].ic}${S.evo[k]?(ev2(k)?'✦':'★'):S.W[k]}${S.br[k]?(S.br[k]==='a'?'ㄱ':'ㄴ'):''}`; el.appendChild(d); }
  for(const k in S.fu){ const d=document.createElement('div'); d.className='slot e'; d.innerHTML=`${FUS[k].ic} ${FUS[k].name}`; el.appendChild(d); }
  // v2.36 화면 정리: 힘(패시브)은 옆 줄에서 빼고 메뉴에서 본다 — 싸울 때는 무기만
}

/* ============ 선택 (디트로이트식) ============ */
// 1·2막: 모든 선택은 저승 틀 안의 일로만 보인다. 숨은 결과(3막)는 화면에 쓰지 않는다.
const FLOW=[
  {id:'start',title:'눈을 뜬 자리',sub:'남산 아래, 쓰러진 소방차 옆'},
  {id:'C1',title:'모닥불지기',q:'"돌이 너희를 골랐어."',opts:{a:'"왜 하필 나야?"',b:'"돌아갈 방법만 알려 줘."',c:'말없이 불을 쬔다'}},
  {id:'C2',title:'첫 보물 괴수',q:'금화를 문 작은 것이 떨고 있다',opts:{a:'금화를 빼앗는다',b:'놓아준다'}},
  {id:'C3',title:'쓰러진 깨어난 자',q:'"…불 좀, 나눠 줄 수 있어?"',opts:{a:'혼불을 나눠 준다',b:'지나친다'}},
  {id:'C4',title:'구미호가 남긴 것',q:'보낸 자리에 꼬리 하나가 남았다',opts:{a:'모닥불에 바친다',b:'지닌다',c:'그 자리에 묻는다'}},
  {id:'next',title:'서울역 고가로',sub:'다음 장'}
];
let choiceCb=null;
function showChoice(title,text,opts,cb,speaker){
  const prev=S&&S.phase; if(S&&S.phase==='play') S.phase='choice';
  $('chT').textContent=title; $('chQ').innerHTML=text; $('chWho').textContent=speaker||'';
  const box=$('chOpts'); box.innerHTML='';
  for(const [k,label] of Object.entries(opts)){ const d=document.createElement('div'); d.className='opt'; d.innerHTML=`<span>${'ㄱㄴㄷㄹㅁㅂ'['abcdef'.indexOf(k)]||'·'}</span>${label}`;
    d.onclick=()=>{ $('choice').classList.remove('show'); if(S&&S.phase==='choice') { S.phase='play'; last=performance.now(); } cb(k); }; box.appendChild(d); }
  $('choice').classList.add('show');
  if(BOT) setTimeout(()=>box.children[0].click(),30);
}
function record(id,k){ SV.choice[id]=k; SV.seen[id+':'+k]=true; save(); }
function choiceTreasure(e){
  const F=FLOW[2]; const name=e.type==='toad'?'금화를 문 두꺼비':'금화를 문 까치';
  showChoice(F.title,`${name}가 떨고 있다.<br><small>도망칠 힘도 없어 보인다.</small>`,F.opts,k=>{
    record('C2',k);
    if(k==='a'){ SV.taken++; treasureLoot(e); }
    else { SV.released++; burst(e.x,.5,e.z,10,1.5); toast('놓아주었다','작은 것이 어둠 속으로 사라진다'); }
    save(); });
}
function choiceFallen(){
  const F=FLOW[3]; S.npcDone=true;
  showChoice(F.title,`깨어난 자 하나가 무릎을 꿇고 있다. 몸의 빛이 꺼져 간다.<br>${F.q}`,F.opts,k=>{
    record('C3',k); fallenNPC.visible=false;
    if(k==='a'){ S.hp=Math.max(1,S.hp*.5); S.ally=25; toast('혼불을 나눠 주었다','"…고마워. 꼭 갚을게."'); }
    else toast('지나쳤다','뒤에서 빛이 하나 꺼진다'); },'');
}
function choiceRemains(after){
  const B=boss.def, F=FLOW[4];
  showChoice(`${B.name}가 남긴 것`,`보낸 자리에 ${B.left}가 남았다.`,F.opts,k=>{
    record(S.bossKey==='gumiho'?'C4':'C4b',k);
    if(k==='a'){ S.bonus=(S.bonus||0)+30; toast('모닥불에 바쳤다','불이 잠깐 커진다'); }
    else if(k==='b'){ SV.carry=S.bossKey==='gumiho'?'tail':'needle'; toast('지녔다',S.bossKey==='gumiho'?'다음 판: 혼불 +1':'다음 판: 받는 피해 -10%'); }
    else { SV.buried++; toast('묻어 주었다',''); }
    save(); after(); });
}

/* ============ 알림 ============ */
let toastT=0, toastQ=[];
// v2.35 명동 다듬기: 알림은 줄을 서서 하나씩(2.2초 + 0.4초 틈), 4초 넘게 기다린 건 버린다 · toastNow = 보스처럼 바로
function toastShow(a,b){ const t=$('toast'); t.innerHTML=a+(b?`<small>${b}</small>`:''); t.style.opacity=1; toastT=2.2; }
function toast(a,b=''){ if(toastT>-.4&&toastT!==0){ if(toastQ.length<3&&!toastQ.some(q=>q.a===a)) toastQ.push({a,b,at:performance.now()}); return; } toastShow(a,b); }
function toastNow(a,b=''){ toastQ.length=0; toastShow(a,b); }
// 처음 한 번만 설명을 붙이고(저장에 남김), 다음부터는 이름만 · 이름도 필요 없으면 skip
function toastOnce(k,a,b,skip){ SV.told=SV.told||{}; if(!SV.told[k]){ SV.told[k]=1; save(); toast(a,b); } else if(!skip) toast(a); }

/* ============ 입력 ============ */
const keys={}; addEventListener('keydown',e=>{ keys[e.key.toLowerCase()]=1; if(e.key==='Escape'||e.key==='p') togglePause(); }); addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
const joy=$('joy'),knob=$('knob'); let J=null; const jv={x:0,y:0};
/* v2.6.3 두 번 톡 → 필살기 (택시는 톡 친 곳 쪽으로 돌진) */
let lastTap=null; const _ray=new THREE.Raycaster(), _gp=new THREE.Plane(new THREE.Vector3(0,1,0),0), _hit=new THREE.Vector3();
function tapGround(cx,cy){ const r=canvas.getBoundingClientRect(); _ray.setFromCamera({x:(cx-r.left)/r.width*2-1,y:-(cy-r.top)/r.height*2+1},camera); return _ray.ray.intersectPlane(_gp,_hit)?{x:_hit.x,z:_hit.z}:null; }
canvas.addEventListener('pointerdown',e=>{ if(!S||S.phase!=='play') return; const now=performance.now();
  if(lastTap&&now-lastTap.t<320&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<80){ lastTap=null; if(S.spCd>0) toast('필살기 준비 중',Math.ceil(S.spCd)+'초 뒤'); special(tapGround(e.clientX,e.clientY)); J={id:e.pointerId,x:e.clientX,y:e.clientY,t0:now,dbl:true}; return; }
  J={id:e.pointerId,x:e.clientX,y:e.clientY,t0:now}; joy.style.display='block'; joy.style.left=e.clientX+'px'; joy.style.top=e.clientY+'px'; $('hint').style.opacity=0; });
addEventListener('pointermove',e=>{ if(!J||e.pointerId!==J.id||J.dbl) return; let dx=e.clientX-J.x,dy=e.clientY-J.y; const l=Math.hypot(dx,dy),m=48; if(l>14) J.moved=true; if(l>m){ dx*=m/l; dy*=m/l; } jv.x=dx/m; jv.y=dy/m; knob.style.transform=`translate(${dx}px,${dy}px)`; });
const endJ=e=>{ if(!J||e.pointerId!==J.id) return; if(!J.dbl&&!J.moved&&performance.now()-J.t0<260){ if(!ghostTap(J.x,J.y)) lastTap={t:performance.now(),x:J.x,y:J.y}; } J=null; jv.x=jv.y=0; joy.style.display='none'; knob.style.transform=''; };
addEventListener('pointerup',endJ); addEventListener('pointercancel',endJ);
// v2.25 메뉴: 내 스킬과 설명 · 짝 서브 단계 · 각성까지 남은 것
function skillsHtml(){ const W=S.W||{}, P=S.P||{}, E=S.evo||{}; const bar=n=>`<span class="bar"><i style="width:${n*20}%"></i></span>`; let h='<div class="ph">공격 스킬</div>';
  const wk=Object.keys(W); if(!wk.length) h+='<div class="none">아직 없음</div>';
  for(const k of wk){ const D=WEAPONS[k]; if(!D) continue; const l=W[k], b=S.br&&S.br[k]&&BR[k]?BR[k][S.br[k]]:null, ev=EVOS[k], aw=!!E[k];
    let d=aw?ev.desc:D.desc(1); if(!aw&&l>1) d+=` · 지금: ${D.desc(l)}`; if(b) d+=`<br>갈래 「${b[0]}」 ${b[1]}`;
    let sp=''; if(ev){ const pk=ev.need, pl=Math.min(5,P[pk]||0); sp=`짝 서브 ${PASSIVES[pk].ic} ${PASSIVES[pk].name} ${bar(pl)}${pl}/5 → 위력 <b>+${Math.round(pl*PAIR_M*100)}%</b> · 간격 <b>-${Math.round(pl*PAIR_C*100)}%</b>`;
      const a2=ev2(k); sp+=a2?'<br>✦✦ 2차 각성함 · 위력 ×1.5 · 간격 -20%':aw?`<br>✦ 각성함 · 2차 각성: ${PASSIVES[pk].name} ${pl}/5${pl>=5?' — 다음 레벨업에 카드':''}`:`<br>각성: 무기 Lv${l}/5 + ${PASSIVES[pk].name} 보유${l>=5&&pl?' — 다음 레벨업에 카드':''} · 2차 각성: ${PASSIVES[pk].name} 5단계`; }
    h+=`<div class="sk${aw?' aw':''}"><div class="si">${D.ic}</div><div><div class="sn">${ev2(k)?'진 '+ev.name:aw?ev.name:D.name}<small>${ev2(k)?'2차 각성':aw?'각성':'Lv '+l}</small></div><div class="sd">${d}</div>${sp?`<div class="sp">${sp}</div>`:''}</div></div>`; }
  const fk=Object.keys(S.fu||{}); for(const k of fk){ const f=FUS[k]; if(f) h+=`<div class="sk aw"><div class="si">${f.ic}</div><div><div class="sn">${f.name}<small>조합</small></div><div class="sd">${f.desc}</div></div></div>`; }
  h+='<div class="ph">서브 스킬</div>'; const pk=Object.keys(P); if(!pk.length) h+='<div class="none">아직 없음 · 서브 스킬을 올리면 짝 무기가 세지고, 5단계면 각성</div>';
  for(const k of pk){ const D=PASSIVES[k]; if(!D) continue; const l=P[k], ws=pairsOf(k), own=ws.filter(w=>W[w]);
    const sp=ws.length?`짝 무기 ${ws.map(w=>(W[w]?'<b>':'')+WEAPONS[w].name+(W[w]?'</b>':'')).join(' · ')}${own.length?` → 위력 +${Math.round(l*PAIR_M*100)}% · 간격 -${Math.round(l*PAIR_C*100)}%`:' (가진 짝 무기 없음)'}`:'';
    h+=`<div class="sk"><div class="si">${D.ic}</div><div><div class="sn">${D.name}<small>Lv ${l}/5</small> ${bar(l)}</div><div class="sd">${D.desc} (단계마다)</div>${sp?`<div class="sp">${sp}</div>`:''}</div></div>`; }
  h+=`<div id="pPpl">${pplHtml()}</div>`;
  return h; }
function togglePause(){ if(!S) return; if(S.phase==='play'){ S.phase='pause'; $('pSkills').innerHTML=skillsHtml(); $('pstat').innerHTML=statHtml()+((S.loot&&S.loot.length)?`<br><small>🎒 들고 있는 장비: ${S.loot.map(it=>gTag(it)).join(' ')}<br>모닥불에 닿아야 내 것 · 쓰러지면 흘린다</small>`:'')+(S.starN?`<br><small>★ 끝없는 성장 ${S.starN}개 · 공격 +${S.starN*4}%</small>`:'');
    if(FIELD){ const ch=S.charm>0, n=shardsEarned(ch?'all':false), ld=nearFire(player.root.position).d; $('pRet').innerHTML=ch?`귀환 부적으로 돌아가면 조각 <b>${n}</b>개를 전부 챙긴다`:`가까운 모닥불까지 약 ${Math.round(ld*MPU())}m · 걸어서 닿으면 조각 전부<br>지금 돌아가면 조각 <b>${n}</b>개 (흘림)`; $('bQuit').textContent=ch?'🔥 귀환 부적 쓰기':'🔥 지금 돌아가기'; }
    else if(WORLD){ const ch=S.charm>0, n=shardsEarned(ch?'all':false), [lk,ld]=nearestLit(player.root.position.x,player.root.position.z); $('pRet').innerHTML=ch?`귀환 부적으로 돌아가면 조각 <b>${n}</b>개를 전부 챙긴다`:`가장 가까운 모닥불(${REGIONS[lk].name})까지 약 ${Math.round(ld*2.4)}m · 걸어서 닿으면 조각 전부<br>지금 돌아가면 조각 <b>${n}</b>개 (흘림)`; $('bQuit').textContent=ch?'🔥 귀환 부적 쓰기':'🔥 지금 돌아가기'; }
    else { const b=bossBlocks(), n=shardsEarned(b?false:'all'); $('pRet').innerHTML=b?`보스가 길을 막고 있다 · 지금 돌아가면 조각 <b>${n}</b>개 (절반)`:`지금 모닥불로 돌아가면 조각 <b>${n}</b>개를 전부 챙긴다`; } $('pause').classList.add('show'); } else if(S.phase==='pause'){ S.phase='play'; $('pause').classList.remove('show'); last=performance.now(); } }
$('bPause').onclick=togglePause; $('pSkills').addEventListener('pointerdown',e=>pplAct(e)); $('bResume').onclick=togglePause; $('bQuit').onclick=()=>{ $('pause').classList.remove('show'); gameOver(true); };
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S&&S.phase==='play'&&!BOT) togglePause(); });

function botInput(){
  if(window.BOTOFF) return {x:0,z:0}; const P=player.root.position; let fx2=0,fz2=0;
  for(const e of enemies){ if(e.dead||e.d.treasure) continue; const dx=P.x-e.x,dz=P.z-e.z,d2=dx*dx+dz*dz; if(d2<(e.type==='elite'?9:4.5)){ const w=(e.type==='elite'?3:1)/Math.max(.3,d2); fx2+=dx*w; fz2+=dz*w; } }
  if(boss.alive){ const dx=P.x-boss.x,dz=P.z-boss.z,d2=dx*dx+dz*dz; const w=(boss.state!=='walk'?40:6)/Math.max(.5,d2); fx2+=dx*w; fz2+=dz*w; }
  for(const f of foxShots){ const dx=P.x-f.x,dz=P.z-f.z,d2=dx*dx+dz*dz; if(d2<9){ fx2+=dx/d2*3; fz2+=dz/d2*3; } }
  let g=null,gd=64; for(const q of gems){ const d=(q.x-P.x)**2+(q.z-P.z)**2; if(d<gd){gd=d;g=q;} }
  for(const t of enemies){ if(t.d.treasure&&!t.dead){ const d=Math.hypot(t.x-P.x,t.z-P.z); fx2+=(t.x-P.x)/d*1.2; fz2+=(t.z-P.z)/d*1.2; } }
  if(S.npc&&!S.npcDone){ const d=Math.hypot(S.npc.x-P.x,S.npc.z-P.z)||1; fx2+=(S.npc.x-P.x)/d*2; fz2+=(S.npc.z-P.z)/d*2; }
  if(g){ const d=Math.sqrt(gd)||1; fx2+=(g.x-P.x)/d*1.2; fz2+=(g.z-P.z)/d*1.2; }
  else { const tg=nearest(P.x,P.z,14); if(tg){ const d=Math.hypot(tg.x-P.x,tg.z-P.z)||1; if(d>3){ fx2+=(tg.x-P.x)/d*.6; fz2+=(tg.z-P.z)/d*.6; } } }
  if(S.hp<S.maxhp*.5){ const d=Math.hypot(P.x,P.z)||1; fx2-=P.x/d*.7; fz2-=P.z/d*.7; }
  if(!WORLD){ const l=Math.hypot(P.x,P.z); if(l>ARENA*.6){ fx2-=P.x/l*2; fz2-=P.z/l*2; } }
  else if(FIELD){ const es=SPOTS.find(o=>o.ember), tg=S.ember?nearFire(P).f:es?es:S.fLoot>0?SPOTS[0]:(!boss.alive&&S.hp>S.maxhp*.35&&(!SMART||S.lv>=(+(location.search.match(/blv=(\d+)/)||[])[1]||10))?nextZone(P):null); if(tg){ const d=Math.hypot(tg.x-P.x,tg.z-P.z)||1; fx2+=(tg.x-P.x)/d*1.5; fz2+=(tg.z-P.z)/d*1.5; } }
  else if(!boss.alive&&S.hp>S.maxhp*.35){ let gk=null; for(const k in SITES) if(!S.zoneDone[k]){ gk=k; break; } if(location.search.includes('goal=')) gk=(location.search.match(/goal=(\w+)/)||[])[1]||gk; if(gk){ const Z=SITES[gk].zone, d=Math.hypot(Z.x-P.x,Z.z-P.z)||1; fx2+=(Z.x-P.x)/d*1.6; fz2+=(Z.z-P.z)/d*1.6; } }
  if(LAZY){ fx2*=.25; fz2*=.25; }
  fx2+=Math.cos(S.t*.3)*(LAZY?.8:.25); fz2+=Math.sin(S.t*.23)*(LAZY?.8:.25);
  if(FIELD&&SMART){ const m0=Math.hypot(fx2,fz2)||1, ux=fx2/m0, uz=fz2/m0; let bx=ux,bz=uz,bs=-1e9; // 시험용 봇: 벽을 돌아가고 몰린 곳을 피한다
    for(let k=0;k<16;k++){ const a=k/16*6.283, dx=Math.cos(a), dz=Math.sin(a); let sc=dx*ux+dz*uz; for(const r of [1,2.5,4]) if(MY.blocked(P.x+dx*r,P.z+dz*r)) sc-=.9;
      let dang=0; for(const e of enemies){ if(e.dead||e.d.treasure) continue; const ex=e.x-P.x-dx*2, ez=e.z-P.z-dz*2, d2=ex*ex+ez*ez; if(d2<6) dang+=1/Math.max(.4,d2); } sc-=dang*.6; if(sc>bs){ bs=sc; bx=dx; bz=dz; } }
    const B=S._bd||(S._bd={x:bx,z:bz}); B.x=B.x*.7+bx*.3; B.z=B.z*.7+bz*.3; const mm=Math.hypot(B.x,B.z)||1; return {x:B.x/mm,z:B.z/mm}; }
  const m=Math.hypot(fx2,fz2); return m>.05?{x:fx2/m,z:fz2/m}:{x:0,z:0};
}

/* ============ 한 프레임 ============ */
const camT=new THREE.Vector3(); let hoseBeam=null;
function update(dt){
  S.t+=dt; const s=st(), P=player.root.position; const P0x=P.x, P0z=P.z; if(S.emb0&&!S.inSafe&&!S.down){ S.hp-=S.maxhp*.005*dt; if(S.hp<=0){ S.hp=0; gameOver(); return; } } if(S.iframe>0) S.iframe-=dt; if(S.jpInv>0) S.jpInv-=dt; if(S.P.regen) S.hp=Math.min(S.maxhp,S.hp+.4*S.P.regen*dt);
  let ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+jv.x, iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+jv.y;
  if(BOT){ const b=botInput(); ix=b.x; iz=b.z; }
  if(S.down){ ix=0; iz=0; }
  const il=Math.hypot(ix,iz); if(il>1){ ix/=il; iz/=il; }
  if(il>.15){ const l=Math.hypot(ix,iz), nx=ix/l, nz=iz/l;
    if(nx*S.lastDir.x+nz*S.lastDir.z>.85) S.runT+=dt; else S.runT=Math.max(0,S.runT-dt*4); S.lastDir={x:nx,z:nz};
    const tv=WORLD?terr(P.x,P.z):0; if(tv===120&&!S.waterTold){ S.waterTold=1; toast('물','발이 잠겨 걸음이 느려진다'); }
    const slw=(S.rootSlow||1)*(S.hazSlow||1), spd=st().speed*(WORLD?terrSpeed(tv):1)*(S.gk&&S.gk.uni.doroni?1-(1-slw)*.5:slw), ki=1-Math.exp(-dt/.045); // v2.54 출발·멈춤 관성 약 0.13초
    if(S.face&&nx*S.face.x+nz*S.face.z<.2&&Math.hypot(S.vx||0,S.vz||0)>spd*.5) { stepDust(player); stepDust(player); } // 방향 틀 때 발밑 먼지
    S.vx=(S.vx||0)+(ix*spd-(S.vx||0))*ki; S.vz=(S.vz||0)+(iz*spd-(S.vz||0))*ki; P.x+=S.vx*dt; P.z+=S.vz*dt; S.saltD+=Math.hypot(S.vx,S.vz)*dt; player.look(ix,iz); player.moving=true; S.face={x:nx,z:nz}; }
  else { const ki=1-Math.exp(-dt/.045); S.vx=(S.vx||0)*(1-ki); S.vz=(S.vz||0)*(1-ki); if(Math.hypot(S.vx,S.vz)>.05){ P.x+=S.vx*dt; P.z+=S.vz*dt; } player.moving=false; S.runT=0; }
  if(FIELD) fieldTick(dt,P); else if(WORLD){ P.x=Math.max(-LIM+2,Math.min(LIM-2,P.x)); P.z=Math.max(-LIM+2,Math.min(LIM-2,P.z)); worldTick(dt,P); } else { const pl=Math.hypot(P.x,P.z); if(pl>ARENA-1.5){ P.x*=(ARENA-1.5)/pl; P.z*=(ARENA-1.5)/pl; } }
  /* v2.6.4 필살기: 소방관 물대포 · 알바생 1+1 */
  if(!hoseBeam){ // v2.7 물대포 그래픽: 흐르는 물줄기(끝으로 갈수록 넓게) + 흰 심 + 끝 물보라
    const wt=(()=>{ const c=document.createElement('canvas'); c.width=128; c.height=64; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'rgba(80,170,255,0)'); g.addColorStop(.25,'rgba(120,200,255,.55)'); g.addColorStop(.5,'rgba(235,250,255,.95)'); g.addColorStop(.75,'rgba(120,200,255,.55)'); g.addColorStop(1,'rgba(80,170,255,0)'); x.fillStyle=g; x.fillRect(0,0,128,64);
      for(let i=0;i<46;i++){ const yy=8+Math.random()*48, xx=Math.random()*128, L=10+Math.random()*30; x.strokeStyle=`rgba(255,255,255,${.25+Math.random()*.5})`; x.lineWidth=1+Math.random()*2; x.beginPath(); x.moveTo(xx,yy); x.lineTo(xx+L,yy); x.stroke(); }
      const t=new THREE.CanvasTexture(c); t.wrapS=THREE.RepeatWrapping; return t; })();
    const trap=(w0,w1)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-w0/2, 1,0,-w1/2, 1,0,w1/2, 0,0,w0/2],3)); g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0, 1,0, 1,1, 0,1],2)); g.setIndex([0,1,2,0,2,3]); return g; };
    const mat=new THREE.MeshBasicMaterial({map:wt,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}); wt.repeat.set(3,1);
    const m=new THREE.Mesh(trap(.35,1.5),mat); const core=new THREE.Mesh(trap(.12,.55),mat.clone()); core.material.map=wt.clone(); core.material.map.needsUpdate=true; core.material.map.repeat.set(5,1); core.position.y=.03;
    const shadowW=new THREE.Mesh(trap(.4,1.6),new THREE.MeshBasicMaterial({color:0x0a2440,transparent:true,opacity:.35,depthWrite:false})); shadowW.position.y=-.7;
    const tip=new THREE.Sprite(new THREE.SpriteMaterial({map:T.halo,color:0xbfe8ff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
    hoseBeam=new THREE.Group(); hoseBeam.add(shadowW); hoseBeam.add(m); hoseBeam.add(core); hoseBeam.m=m; hoseBeam.core=core; hoseBeam.visible=false; scene.add(hoseBeam); scene.add(tip); hoseBeam.tip=tip; tip.visible=false; }
  hoseBeam.visible=hoseBeam.tip.visible=!!S.spHose;
  if(S.spHose){ const H=S.spHose; H.t-=dt;
    if(il>.15){ let d=Math.atan2(iz,ix)-H.a; d=Math.atan2(Math.sin(d),Math.cos(d)); H.a+=Math.sign(d)*Math.min(Math.abs(d),3.2*dt); }
    const cx=Math.cos(H.a), cz=Math.sin(H.a), range=8.5*s.area; S.face={x:cx,z:cz}; player.look(cx,cz);
    hoseBeam.position.set(P.x+cx*.4,.75,P.z+cz*.4); hoseBeam.rotation.y=-H.a; hoseBeam.scale.set(range,1,1+Math.sin(S.t*40)*.08); hoseBeam.m.material.map.offset.x-=dt*7; hoseBeam.core.material.map.offset.x-=dt*11; hoseBeam.m.material.opacity=.6+Math.random()*.15; hoseBeam.core.material.opacity=.6; { const tp=hoseBeam.tip; tp.position.set(P.x+cx*(range+.3),.8,P.z+cz*(range+.3)); const sc=2.2+Math.random()*.8; tp.scale.set(sc,sc,1); tp.material.opacity=.6+Math.random()*.3; }
    for(let k=0;k<(MOBILE?4:6);k++){ const w=water.items[waterI=(waterI+1)%water.n]; const aa=rr(0,6.28), v=rr(1.5,4); w.life=rr(.25,.5); w.x=P.x+cx*range; w.z=P.z+cz*range; w.y=.8; w.vx=Math.cos(aa)*v; w.vz=Math.sin(aa)*v; w.vy=rr(1.5,3.5); }
    for(let k=0;k<(MOBILE?6:10);k++){ const w=water.items[waterI=(waterI+1)%water.n]; const aa=H.a+rr(-.07,.07), v=rr(13,16); w.life=range/v*rr(.85,1.05); w.x=P.x+cx*.5; w.z=P.z+cz*.5; w.y=.95; w.vx=Math.cos(aa)*v; w.vz=Math.sin(aa)*v; w.vy=rr(-.2,.4); }
    H.tick-=dt; if(H.tick<=0){ H.tick=.08; const n=(9+.7*S.lv)*s.might; DBG.shake=Math.max(DBG.shake||0,.12);
      near(P.x+cx*range*.5,P.z+cz*range*.5,range*.6,e=>{ const ex=e.x-P.x,ez=e.z-P.z,along=ex*cx+ez*cz; if(along<0||along>range+e.d.r) return; if(Math.abs(ex*cz-ez*cx)>.6+e.d.r) return; damage(e,n,cx,cz,e.d.treasure?1:9); e.slow=Math.min(e.slow,.45); });
      if(boss.alive){ const ex=boss.x-P.x,ez=boss.z-P.z,along=ex*cx+ez*cz; if(along>0&&along<range+1&&Math.abs(ex*cz-ez*cx)<1.6) damageBoss(n*1.6,'sp'); }
      fx(P.x+cx*range,P.z+cz*range,.9,[.6,.85,1],.2); }
    if(H.t<=0) S.spHose=null; }
  if((S.maeT||0)>0) S.maeT-=dt; if((S.onAir||0)>0) S.onAir-=dt;
  if(S.char==='haram'){ const on=(S.maeT||0)>0||S.t-(S.hitAt??-99)>=5; if(on&&!S.maeOn){ dnum(P.x,PLAYER_H+.8,P.z,'✿ 매무새','gold'); fx(P.x,P.z,1.1,[1,.75,.85],.25); } S.maeOn=on; S.maeFx=(S.maeFx||0)-dt; if(on&&S.maeFx<=0){ S.maeFx=1.2; fx(P.x,P.z,.9,[1,.7,.85],.18); } }
  if(S.bogo>0){ S.bogo-=dt; S.bogoFx=(S.bogoFx||0)-dt; if(S.bogoFx<=0){ S.bogoFx=1; fx(P.x,P.z,1.5,[1,.85,.3],.4); }
    for(let k=0;k<(MOBILE?6:9);k++){ const pool=k%3===2?flameB:flameA, f=pool.items[flameI=(flameI+1)%pool.n]; const a=rr(0,6.28), r=rr(.05,.45); f.x=P.x+Math.cos(a)*r; f.z=P.z+Math.sin(a)*r*.6+.05; f.y=rr(.05,1.5); f.vx=rr(-.2,.2); f.vz=0; f.vy=rr(1.4,2.4); f.life=rr(.3,.55); } }
  if(S.rush>0){ S.rush-=dt; headL.material.opacity=.9; headL.position.set(P.x+S.face.x*.9,.7,P.z+S.face.z*.9); S.rushFx=(S.rushFx||0)-dt;
    if(S.rushFx<=0){ S.rushFx=.08; fx(P.x-S.face.x*.6,P.z-S.face.z*.6,.7,[1,.75,.35],.3); }
    const rd=(18+1.6*S.lv)*s.might;
    near(P.x,P.z,1.6,e=>{ const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz)||1; if(d>1+e.d.r) return; const last=e.hitCd.get('rush')||0; if(S.t-last<.35) return; e.hitCd.set('rush',S.t); damage(e,rd,dx/d,dz/d,e.d.treasure?2:16); });
    if(boss.alive&&Math.hypot(boss.x-P.x,boss.z-P.z)<1.9&&S.t-(boss.rushHit||0)>.4){ boss.rushHit=S.t; damageBoss(rd*1.5,'sp'); DBG.shake=Math.max(DBG.shake||0,.3); } }
  { const va=Math.hypot(P.x-P0x,P.z-P0z)/Math.max(dt,1e-4), sr0=st().speed||5; player.update(dt,Math.min(1.5,va/sr0)); } // v2.54 걷기 그림 넘김 = 실제로 움직인 거리(발 미끄러짐 없앰)
  lanternL.l.position.set(P.x+(player.view==='side'?(player.flip?-.3:.3):player.view==='front'?.35:-.35),1.9,P.z+.1); // v2.38b: 등불을 머리 위로(얼굴이 하얗게 타지 않게)
  // 그림자 분신: 뒤에서 따라온다
  if(S.W.shadow){ const SP=shadowP.root.position, tx=P.x-S.face.x*1.3+S.face.z*.6, tz=P.z-S.face.z*1.3-S.face.x*.6; SP.x+=(tx-SP.x)*Math.min(1,dt*4); SP.z+=(tz-SP.z)*Math.min(1,dt*4);
    shadowP.moving=player.moving; shadowP.look(S.face.x,S.face.z); shadowP.update(dt,Math.min(1,il));
    S.shFl=Math.max(0,(S.shFl||0)-dt); const fk=Math.min(1,S.shFl/.3); shadowP.mat.color.setRGB(.06+.5*fk,.04+.3*fk,.1+.75*fk); }
  // 모닥불 쉼터
  const fd=Math.hypot(P.x,P.z); if(fd<2.3&&S.hp<S.maxhp){ S.hp=Math.min(S.maxhp,S.hp+4*dt*(S.char==='gosi'?.5:1)); if(Math.random()<dt*3) sfx.heal(); }
  // 쓰러진 깨어난 자에게 다가가면
  if(S.npc&&!S.npcDone&&Math.hypot(S.npc.x-P.x,S.npc.z-P.z)<1.4) choiceFallen();
  if(S.shoeT>0) S.shoeT-=dt;
  if(S.spCd>0) S.spCd=Math.max(0,S.spCd-dt); if(BOT&&S.spCd<=0&&enemies.length>12) special();
  if(S.dash){ const D=S.dash; D.t-=dt; const v=19; P.x+=D.dx*v*dt; P.z+=D.dz*v*dt; if(Math.random()<.7) fx(P.x,P.z,.8,[1,.75,.35],.25);
    near(P.x,P.z,1.4,e=>{ if(D.hit.has(e)) return; D.hit.add(e); damage(e,(60+4*S.lv)*s.might,D.dx,D.dz,24); });
    if(boss.alive&&!D.boss&&Math.hypot(boss.x-P.x,boss.z-P.z)<2.2){ D.boss=1; damageBoss((90+5*S.lv)*s.might,'sp'); }
    if(D.t<=0) S.dash=null; }
  director(dt); buildGrid(); if(!S.down){ weapons(dt); gearSkillTick(dt); } bossUpdate(dt); downTick(dt);
  // 괴수 이동·상태
  let touch=0, touchMx=0;
  for(const e of enemies){ if(e.dead) continue; e.life+=dt; const d=e.d; let dx=P.x-e.x,dz=P.z-e.z; const dist=Math.hypot(dx,dz)||1;
    if(e.burn>0){ e.burn-=dt; e.btick=(e.btick||0)-dt; if(e.btick<=0){ e.btick=.4; damage(e,8*s.might); if(e.dead) continue; } }
    if(e.freeze>0){ e.freeze-=dt; e.flip=d.faceL?dx>0:dx<0; continue; }
    let sp=d.spd*e.slow*(d.treasure?1:1+Math.min(.6,S.t/500))*(WORLD&&terr(e.x,e.z)===80?.9:1); e.slow=Math.min(1,e.slow+dt*2);
    if(d.treasure){ if(dist<8){ dx=-dx; dz=-dz; } else { const a=e.ph+e.life*.6; dx=Math.cos(a); dz=Math.sin(a); } if(e.life>30&&dist>spawnR()){ e.dead=true; continue; } }
    else if(dist>spawnR()*1.9&&!d.pack&&!e.hid){ const a=rr(0,6.28), r=spawnR(); e.x=P.x+Math.cos(a)*r; e.z=P.z+Math.sin(a)*r; continue; }
    if(!d.treasure){ if(e.fear>0){ e.fear-=dt; dx=-dx; dz=-dz; sp*=1.15; } else if(S.jangs.length){ for(const J of S.jangs){ const tx=J.x-e.x,tz=J.z-e.z; if(tx*tx+tz*tz<J.R*J.R){ dx=tx; dz=tz; break; } } } }
    if(d.thief){ if(e.stole!=null){ dx=e.x-P.x; dz=e.z-P.z; sp*=1.1; if(e.life-e.stole>10&&dist>spawnR()*.9){ e.dead=true; continue; } }
      else if(dist<d.r+.55&&!((S.shoeT||0)>0)){ e.stole=e.life; S.shoeT=9; toast('야광귀가 신을 훔쳤다','발이 무겁다 · 잡으면 되찾는다'); sfx.hurt(); buzz(40); } }
    if(d.devour&&!(e.fear>0)) sp=yeongnoTick(e,dt,dist,dx,dz,sp,P);
    if(d.devour&&e.tgt){ dx=e.tgt.x-e.x; dz=e.tgt.z-e.z; }
    if((e.type==='elite'||(d.devour&&e.full))&&!(e.fear>0)&&!(e.inh>0)){ e.atk=(e.atk??rr(2,4))-dt;
      if(e.ch){ e.ch.t-=dt; if(e.ch.ph===0){ sp=0; dx=e.ch.dx; dz=e.ch.dz; if(e.ch.t<=0){ e.ch.ph=1; e.ch.t=.4; sfx.shot(); } }
        else { dx=e.ch.dx; dz=e.ch.dz; sp=d.devour?13:11.5; if(!e.ch.hit&&dist<d.r*(e.gs||1)+.55){ e.ch.hit=1; hurtPlayer(d.devour?30:20,true); } if(e.ch.t<=0){ e.ch=null; e.atk=rr(3.5,6); } } }
      else if(e.atk<=0&&dist<7.5&&dist>1.6){ e.ch={ph:0,t:.8,dx:dx/dist,dz:dz/dist}; } }
    // v2.39 새 일반 괴수 움직임
    if(d.pack){ dx=e.pdx??dx; dz=e.pdz??dz; if(e.life>2&&dist>spawnR()*1.5||e.life>10){ e.dead=true; continue; } }
    if(d.lurk&&e.hid){ e.lt=(e.lt||0)+dt; if(e.lt>14&&dist>6){ e.dead=true; continue; } if(dist<2.6){ e.hid=0; e.rise=.4; try{ sfx.splash?sfx.splash():sfx.hit(); }catch(_){} } else continue; }
    if(e.rise>0){ e.rise-=dt; sp=0; if(e.rise<=0) e.lunge=.7; }
    if(e.lunge>0){ e.lunge-=dt; sp*=1.9; }
    if(d.root){ e.rc=(e.rc??rr(3,5))-dt; if(e.rt>0){ e.rt-=dt; sp=0; } else if(e.rc<=0&&dist<5.5){ e.rc=rr(6.5,9); e.rt=2.6; (S.roots||(S.roots=[])).push({x:e.x,z:e.z,R:3,t:2.6,fx:0}); try{ sfx.boom(); }catch(_){} } }
    if(d.blink){ e.bk=(e.bk??rr(2.5,4))-dt; if(e.bko>0){ e.bko-=dt; sp=0; if(e.bko<=0){ const f=S.face||{x:0,z:1}, sd=(e.ph%2<1?1:-1), r=rr(3,4); const nx=P.x+(-f.z*sd)*r+f.x*rr(-.5,1.5), nz=P.z+(f.x*sd)*r+f.z*rr(-.5,1.5); if(!(FIELD&&FIELD.blocked(nx,nz))){ e.x=nx; e.z=nz; } e.hid=0; e.bki=.3; } }
      else if(e.bk<=0&&dist<12&&dist>2){ e.bk=rr(3.2,4.6); e.bko=.35; e.hid=1; }
      if(e.bki>0){ e.bki-=dt; sp*=.2; } if(e.hid) continue; }
    if(d.orbit&&!(e.fear>0)){ e.ob=(e.ob??rr(1.5,3))-dt; if(e.obd>0){ e.obd-=dt; dx=e.odx; dz=e.odz; sp*=2.7; } else if(e.ob<=0&&dist<7){ e.ob=rr(2.2,3.4); e.obd=.5; e.odx=dx/dist; e.odz=dz/dist; e.cast=.15; }
      else if(dist<7){ const sd=(e.ph%2<1?1:-1), w=dist<4.5?-.6:.5; const nx=-dz/dist*sd+dx/dist*w, nz=dx/dist*sd+dz/dist*w; dx=nx; dz=nz; } }
    if(d.trail){ e.trT=(e.trT??1)-dt; if(e.trT<=0){ e.trT=1.3; addHaz(e.x,e.z,1.1,2.6,16,'fire'); } }
    if(d.tint&&e.d.emissive&&e.type==='dfire'){ const w=Math.sin(e.life*3+e.ph)*.8; const nx=dx-dz/dist*w*2, nz=dz+dx/dist*w*2; dx=nx; dz=nz; }
    if(e.type==='wisp'){ e.atk=(e.atk??rr(2,5))-dt; if(e.atk<=0){ e.atk=rr(4,7); if(dist<9&&foxShots.length<(nbNow()>.3?10:24)){ e.cast=.5; shot(e.x,e.z,Math.atan2(dz,dx),6.5,.5); } } if(e.cast>0){ e.cast-=dt; sp*=.15; } }
    if(d.hail){ e.hailT=(e.hailT??3)-dt; if(e.hailT<=0&&dist<14){ e.hailT=5.5; const H=S.hails||(S.hails=[]); for(let i=0;i<3;i++){ const a=rr(0,6.28), r=i?rr(1.2,3):0; H.push({x:P.x+Math.cos(a)*r,z:P.z+Math.sin(a)*r,t:1.3,w:0}); } } }
    if(e.type==='shade'&&!(e.fear>0)&&dist>2.2&&dist<16){ const k=Math.min(1,(dist-2.2)/6)*((e.ph%2)<1?.75:-.75), c=Math.cos(k), s2=Math.sin(k), nx=dx*c-dz*s2, nz=dx*s2+dz*c; dx=nx; dz=nz; } // v2.16 떼로 에워싼다(줄줄이 따라오지 않게)
    else if(e.type==='wisp'&&!(e.cast>0)){ const w=Math.sin(e.life*4.2+e.ph)*.9; const nx=dx-dz/dist*w*dist*.35, nz=dz+dx/dist*w*dist*.35; dx=nx; dz=nz; } // 갈지자로 촐랑
    const l=Math.hypot(dx,dz)||1; const eox=e.x, eoz=e.z; e.x+=(dx/l*sp+e.kx)*dt; e.z+=(dz/l*sp+e.kz)*dt; if(BG.g) unblock(e,eox,eoz); e.kx*=Math.exp(-dt*7); e.kz*=Math.exp(-dt*7);
    e.flip=d.faceL?dx>0:dx<0; e.flash=Math.max(0,e.flash-dt);
    if(!d.treasure&&d.dmg&&!e.ch&&!e.hid&&!(e.rise>0)&&dist<d.r*.72+.2){ touch+=d.dmg; touchMx=Math.max(touchMx,d.dmg); }
  }
  for(const e of enemies){ if(e.dead) continue; near(e.x,e.z,e.d.r*2,o=>{ if(o===e) return; const dx=e.x-o.x,dz=e.z-o.z,d=Math.hypot(dx,dz),m=e.d.r+o.d.r; if(d<m&&d>.001){ const p=(m-d)*.5*Math.min(1,dt*10); e.x+=dx/d*p; e.z+=dz/d*p; } }); }
  if(FIELD){ fieldSafe(dt,P,S.t||0); if(S.inSafe) touch=0; lootTick(dt,P); } else if(WORLD){ safeTick(dt,P,S.t||0); if(S.inSafe) touch=0; lootTick(dt,P); }
  if(touch>0&&!(S.iframe>0)) hurtPlayer(Math.min(touchMx+(touch-touchMx)*.35,90-45*nbNow())*.5,true,true);
  for(let i=enemies.length-1;i>=0;i--) if(enemies[i].dead) enemies.splice(i,1);
  // v2.39 목랑 뿌리: 둘레 원 안에서는 발이 묶인다(40% 느림)
  S.rootSlow=1; if(S.roots) for(let i=S.roots.length-1;i>=0;i--){ const r=S.roots[i]; r.t-=dt; r.fx-=dt; if(r.fx<=0){ r.fx=.45; fx(r.x,r.z,r.R,[.55,.38,.18],.4); for(let k=0;k<5;k++){ const a=sr(0,6.283), q=sr(.5,r.R); ep(r.x+Math.cos(a)*q,.1,r.z+Math.sin(a)*q,0,sr(.4,1),0,.5,.3,[.7,.5,.25]); } }
    if(Math.hypot(P.x-r.x,P.z-r.z)<r.R) S.rootSlow=.6; if(r.t<=0) S.roots.splice(i,1); }
  // v2.48 위험 바닥: 불 자국 · 독 안개 · 비린 안개(느림)
  S.hazSlow=1; if(S.haz) for(let i=S.haz.length-1;i>=0;i--){ const h=S.haz[i]; h.t-=dt; if(h.t<=0){ S.haz.splice(i,1); continue; } const dd=Math.hypot(P.x-h.x,P.z-h.z);
    if(dd<h.R&&!S.inSafe){ if(h.dps) hurtPlayer(h.dps*dt,false,true); if(h.k==='fog') S.hazSlow=.6; else if(h.k==='poisonS') S.hazSlow=Math.min(S.hazSlow,.8); } }
  // 강철이 우박: 파란 원이 깜빡이다 떨어진다
  if(S.hails) for(let i=S.hails.length-1;i>=0;i--){ const h=S.hails[i]; h.t-=dt; h.w-=dt; 
    if(h.t<=0){ fx(h.x,h.z,1.35,[1,1,1],.35); if(Math.hypot(h.x-P.x,h.z-P.z)<1.15) hurtPlayer(16*(S.gk&&S.gk.uni.satgat?.5:1),true); S.hails.splice(i,1); } }
  for(let i=foxShots.length-1;i>=0;i--){ const f=foxShots[i]; if(f.wait>0){ f.wait-=dt; continue; } f.x+=f.vx*dt; f.z+=f.vz*dt; f.life-=dt;
    if(Math.hypot(f.x-P.x,f.z-P.z)<.36){ hurtPlayer(f.dmg||12,true); foxShots.splice(i,1); continue; } if(f.life<=0) foxShots.splice(i,1); }
  const mag=s.magnet;
  for(let i=gems.length-1;i>=0;i--){ const g=gems[i]; g.t+=dt; const dx=P.x-g.x,dz=P.z-g.z,d=Math.hypot(dx,dz);
    if(d<mag||g.pull){ g.pull=true; g.pv=Math.min(34,(g.pv||9)+dt*48); const v=Math.min(d/dt,g.pv); g.x+=dx/d*v*dt; g.z+=dz/d*v*dt; } // v2.9.4 기획자 평: 끌려오는 속도가 느림 → 처음부터 빠르게, 점점 더 빨라져 플레이어를 꼭 따라잡음
    if(d<.5){ gainXp(g.v); gems.splice(i,1); sfx.gem(); } }
  for(let i=joris.length-1;i>=0;i--){ const j=joris[i]; j.t+=dt; if(Math.hypot(P.x-j.x,P.z-j.z)<.9){ joris.splice(i,1); for(const g of gems) g.pull=true; sfx.lvl(); buzz(40); toast('복조리','흩어진 기억 조각을 모두 쓸어 담는다'); } else if(j.t>60) joris.splice(i,1); }
  for(let i=embersItems.length-1;i>=0;i--){ const e=embersItems[i]; e.t+=dt; if(Math.hypot(P.x-e.x,P.z-e.z)<.8){ S.hp=Math.min(S.maxhp,S.hp+30*(S.char==='gosi'?.5:1)); embersItems.splice(i,1); sfx.heal(); toast('따뜻한 불씨','체력을 되찾았다'); } }
  for(let i=fxs.length-1;i>=0;i--){ fxs[i].life-=dt; if(fxs[i].life<=0) fxs.splice(i,1); }
  if(WORLD) unblock(P,P0x,P0z);
  if(FIELD) edgeHold(P,P0x,P0z);
  if(DBG.fixed&&location.search.includes('trace')){ S._st=(S._st||0)+1; if(S._st%15===0){ (DBG.tr||(DBG.tr=[])).push([S._st,S.kills,+P.x.toFixed(2),+P.z.toFixed(2),enemies.length,gems.length,Math.round(S.hp)]); } }
  if(S.phase==='play'){ if(pendN()){ if(!lvKeep()) afterCard(); else if(S.inSafe&&!S.campShown) openCamp(); } if(!S.inSafe) S.campShown=0; updLvBadge(); lvbTick(dt/(DBG.ts||1)); }
}

/* ============ 그리기 ============ */
let fpsN=0,fpsT=0,uiT=0;
/* ============ v2.13 각성 연출 (29번 3ㄱ): 각성 순간 + 각성 무기 20종 고유 모양 ============
   무기 피해·판정은 그대로, 보이는 것만 더한다. 색은 금빛·하양·파랑 계열(빨강은 적의 공격만).
   약한 기본 무기 5종(클랙슨·호스·소금·그림자·대금)은 각성 전에도 옅게 보인다. */
const gp=(x,y,z,sx,sy,r,g,b)=>glowB.push(x,y,z,sx*.8,sy*.8,r*.32,g*.32,b*.32); // 덧빛이 겹쳐 하얗게 타지 않게 (v2.15: 너무 반짝 → 더 낮춤)
const EP=[], ER=[]; const EP_MAX=MOBILE?420:700;
const evoRingB=new Batch(T.ring,1,1,80,{flat:true,base:false,additive:true,order:4});
let EV2S=1; // v2.27 2차 각성 무기의 불티 크기·고리 밝기 배수 (그 무기를 그리는 동안만 1보다 큼)
function ep(x,y,z,vx,vy,vz,life,s,c,grav=0){ if(EP.length>=EP_MAX) EP.shift(); EP.push({x,y,z,vx,vy,vz,life,max:life,s:s*EV2S,c,grav}); }
function er(x,z,r0,r1,life,c,w=1){ if(ER.length>=70) ER.shift(); ER.push({x,z,r0,r1,life,max:life,c,w:w*(EV2S>1?1.5:1)}); }
function epBurst(x,y,z,n,spd,life,s,c,up=0){ for(let i=0;i<n;i++){ const a=Math.random()*6.283, v=spd*(.4+Math.random()*.8); ep(x,y,z,Math.cos(a)*v,up*(.5+Math.random()),Math.sin(a)*v,life*(.7+Math.random()*.6),s,c); } }
function epLine(x0,z0,x1,z1,y,step,s,c,jit=0,t=0){ const d=Math.hypot(x1-x0,z1-z0), n=Math.min(40,Math.ceil(d/step)); for(let i=0;i<=n;i++){ const k=i/n, j=jit?Math.sin(k*17+t*23)*jit:0; gp(x0+(x1-x0)*k-(z1-z0)/d*j,y,z0+(z1-z0)*k+(x1-x0)/d*j,s*FXS,s*FXS,c[0],c[1],c[2]); } }
const GOLD=[1,.82,.35], WHITE=[1,1,.95], CYAN=[.45,1,.95], BLUE=[.45,.75,1], VIOLET=[.75,.5,1], AMBER=[1,.6,.2];
// 각성 순간: 화면 멈춤 · 금빛 섬광 · 이름 · 고리 셋
function evoMoment(k,two){ if(two) return evoMoment2(k); const P=player.root.position, E=EVOS[k]; HS=Math.max(HS,.42); DBG.shake=Math.max(DBG.shake||0,.9); buzz(120);
  const f=$('evoFlash'); if(f){ f.style.transition='none'; f.style.opacity=.45; setTimeout(()=>{ f.style.transition='opacity .9s'; f.style.opacity=0; },60); }
  const b=$('evoBan'); if(b){ b.innerHTML=`<small>각성</small>${WEAPONS[k]?WEAPONS[k].ic+' ':''}${E?E.name:''}<i>${E?E.desc:''}</i>`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
  for(let i=0;i<3;i++) er(P.x,P.z,.5,5+i*2.5,.7+i*.18,GOLD,.9); epBurst(P.x,1,P.z,70,7,.9,.5,GOLD,4); epBurst(P.x,1.2,P.z,30,3,1.2,.35,WHITE,6); try{ sfx.lvl(); sfx.roar(); }catch(e){} }
// v2.27 협동→쟁탈 (기획자 14:36 「ㄱ 전부」)
// ① 같이 싸울 때: 가까운 사람끼리 하늘빛 끈으로 이어진다 · 같은 보스를 치고 있으면 밝아진다
// ② 파이널이 쓰러지는 순간: 끈이 툭 끊어져 흩어진다 · 징 · 「불씨는 하나 · 돌아갈 길은 각자」
const TIE_R=16;
function tieFx(t,P){ if(!FIELD||!S||!S.field||!MP.ghosts.size) { MP.ties=null; return; }
  const holdMe=S.emG&&S.emG.length; if(S.fLoot>0||S.doom||holdMe){ MP.ties=null; return; }
  const L=[]; for(const G of MP.ghosts.values()){ if(G.hold||!G.pty) continue; const q=G.g.position, d=Math.hypot(q.x-P.x,q.z-P.z); if(d>TIE_R||d<.6) continue; L.push([q.x,q.z,d]); }
  MP.ties=L.length?L:null; if(!L.length) return; MP.tieT=performance.now();
  const fight=boss.alive&&!boss.dying, bx=boss.x, bz=boss.z;
  for(const [x,z,d] of L){ const both=fight&&Math.hypot(P.x-bx,P.z-bz)<14&&Math.hypot(x-bx,z-bz)<14; const fa=Math.max(.25,1-d/TIE_R);
    // v2.31 (기획자 05:43 ㄱ): 기술과 헷갈리지 않게 — 파티원끼리만 · 땅 위 초록 점선 · 빛알 없음(같은 보스 곁이면 조금 밝게)
    const k=(both?.85:.5)*(.55+.45*fa), c=[.48*k,.89*k,.54*k], n=Math.min(30,Math.ceil(d/.45)), sh=Math.floor(t*2.5);
    for(let i=1;i<n;i++){ if((i+sh)%2) continue; const f=i/n; gp(P.x+(x-P.x)*f,.06,P.z+(z-P.z)*f,.32*FXS,.32*FXS,c[0],c[1],c[2]); } } }
function tieCut(){ const P=player.root.position; const L=MP.ties||[]; MP.ties=null; const GRN=[.48,.89,.54];
  for(const [x,z] of L){ for(let i=0;i<=14;i++){ const k=i/14; ep(P.x+(x-P.x)*k,.15,P.z+(z-P.z)*k,rr(-1,1),rr(.5,2),rr(-1,1),rr(.7,1.2),.4,i%2?GRN:WHITE,5); }
    const mx=(P.x+x)/2, mz=(P.z+z)/2; epBurst(mx,.3,mz,18,4,.5,.45,WHITE,2); er(mx,mz,.2,2.2,.4,GRN,1.2); }
  try{ sfx.jing(); }catch(e){} DBG.tieCut=(DBG.tieCut||0)+1; }
// v2.27 2차 각성 순간: 더 길게 멈춤 · 하얀·보라 섬광 · 빛기둥 · 고리 다섯 · 늦게 오는 두 번째 파동
function evoMoment2(k){ const P=player.root.position, E=EVOS[k]; HS=Math.max(HS,.75); DBG.shake=Math.max(DBG.shake||0,1.5); buzz([90,60,160]);
  const f=$('evoFlash'); if(f){ f.classList.add('two'); f.style.transition='none'; f.style.opacity=.8; setTimeout(()=>{ f.style.transition='opacity 1.4s'; f.style.opacity=0; },110); setTimeout(()=>f.classList.remove('two'),1600); }
  const b=$('evoBan'); if(b){ b.innerHTML=`<small>✦ 2차 각성 ✦</small>${WEAPONS[k]?WEAPONS[k].ic+' ':''}진 ${E?E.name:''}<i>위력 ×1.5 · 공격 간격 -20%</i>`; b.classList.remove('show','two'); void b.offsetWidth; b.classList.add('show','two'); setTimeout(()=>b.classList.remove('two'),3200); }
  const ring=(c,w)=>{ for(let i=0;i<5;i++) er(P.x,P.z,.5,6+i*3,.8+i*.2,i%2?c:WHITE,w); };
  ring(VIOLET,1.2); er(P.x,P.z,.3,3,.5,GOLD,1.6);
  epBurst(P.x,1,P.z,110,9,1.1,.6,WHITE,5); epBurst(P.x,1,P.z,70,6,1.3,.55,VIOLET,4); epBurst(P.x,1.2,P.z,40,3,1.5,.45,GOLD,7);
  for(let i=0;i<46;i++){ const a=Math.random()*6.283, r=Math.random()*.9; ep(P.x+Math.cos(a)*r,.2,P.z+Math.sin(a)*r,0,rr(9,16),0,rr(.8,1.3),rr(.45,.75),i%3?WHITE:VIOLET); }
  setTimeout(()=>{ if(!S||S.phase==='over') return; const Q=player.root.position; ring(GOLD,1); /* 깨어나는 파동: 7걸음 안 괴수를 크게 친다 */ const dm=60*(st().might||1); for(const e of enemies){ if(e.dead) continue; const dd=Math.hypot(e.x-Q.x,e.z-Q.z); if(dd<7*FXS) damage(e,dm*(1-dd/(9*FXS))); } epBurst(Q.x,.8,Q.z,60,10,.8,.5,GOLD,2); DBG.shake=Math.max(DBG.shake||0,.8); try{ sfx.roar(); }catch(e){} },380);
  try{ sfx.lvl(); sfx.roar(); }catch(e){} }
// 무기가 쏠 때 부르는 신호 (v2.27: 진 무기는 불티 크게 + 보라 고리 하나 더)
function evoEv(k,x,z,R){ if(!S||!S.W[k]) return; const two=ev2(k)&&!!S.evo[k]; if(two){ EV2S=1.45; try{ evoEv1(k,x,z,R); }finally{ EV2S=1; } er(x,z,.3,R*1.08,.45,VIOLET,1.1); epBurst(x,1,z,14,R*1.4,.45,.4,Math.random()<.5?WHITE:VIOLET,2); return; } evoEv1(k,x,z,R); }
function evoEv1(k,x,z,R){ const ev=!!S.evo[k];
  if(k==='horn'){ const I=ev?1:.5; for(let i=0;i<(ev?3:1);i++) er(x,z,.4,R*(.7+i*.15),.35+i*.12,ev?WHITE:GOLD,ev?1.3:.8); if(ev){ epBurst(x,.8,z,26,R*1.6,.4,.32,GOLD); DBG.shake=Math.max(DBG.shake||0,.25); } else epBurst(x,.8,z,8,R*1.2,.3,.25,GOLD); }
  else if(k==='flute'){ for(let i=0;i<(ev?4:2);i++) er(x,z,.5,Math.min(R,22)*(.35+i*.22),.9+i*.25,BLUE,ev?1.2:.7); if(ev) epBurst(x,.3,z,40,6,1.4,.4,BLUE,1); }
  else if(!ev) return;
  else if(k==='club'){ epBurst(x,1,z,22,R*2.2,.45,.45,GOLD,3); er(x,z,.3,R*1.1,.4,WHITE,1.3); er(x,z,.3,R*.7,.3,GOLD,1); DBG.shake=Math.max(DBG.shake||0,.2); }
  else if(k==='mask'){ er(x,z,.5,R,.6,GOLD,1.4); er(x,z,.5,R*.6,.45,WHITE,1); epBurst(x,1.4,z,34,R*1.8,.6,.4,AMBER,2); }
  else if(k==='fan'){ for(let i=0;i<24;i++){ const a=i/24*6.283, r=R*.9; ep(x+Math.cos(a)*r,.6,z+Math.sin(a)*r,-Math.sin(a)*6-Math.cos(a)*3,.5,Math.cos(a)*6-Math.sin(a)*3,.5,.35,CYAN); } er(x,z,.4,R,.5,CYAN,1.2); }
  else if(k==='barcode'){ for(let i=0;i<10;i++) ep(x+rr(-.4,.4),.2,z+rr(-.4,.4),rr(-.6,.6),rr(6,10),rr(-.6,.6),.5,.4,GOLD); er(x,z,.2,1.8,.35,GOLD,1.2); }
  else if(k==='lantern'){ er(x,z,R*.85,R*1.05,.5,GOLD,1.2); for(let i=0;i<8;i++){ const a=Math.random()*6.283; ep(x+Math.cos(a)*R,.2,z+Math.sin(a)*R,0,rr(2,4),0,.6,.32,GOLD); } } }
// 매 프레임: 각성 무기마다 고유 모양 (draw 안에서 glowB가 열린 동안)
function evoFx(dt,t){ evoRingB.begin(); const play=S&&(S.phase==='play'||S.phase==='lvup'||S.phase==='choice');
  if(play){ const W=S.W, E=S.evo, P=player.root.position, cnt={};
    const F0=FXS, on=k=>{ const two=!!(ev2(k)&&E[k]); FXS=F0*(two?1.45:1); EV2S=two?1.45:1; return W[k]&&E[k]; };
    if(on('axe')) for(const A of AXES) if(A.g.visible){ const p=A.g.position; ep(p.x,p.y,p.z,0,.4,0,.28,.34,AMBER); gp(p.x,p.y,p.z,2.2*FXS,2.2*FXS,1,.65,.25); }
    if(on('orb')) for(const o of orbs){ gp(o.x,o.y,o.z,1.6*FXS,1.6*FXS,.35,.95,.9); if(Math.random()<.6) ep(o.x,o.y,o.z,rr(-.3,.3),.3,rr(-.3,.3),.35,.4,CYAN); }
    if(on('lantern')){ const R=(1.45+.28*W.lantern)*st().area*1.45; for(let i=0;i<8;i++){ const a=t*1.2+i/8*6.283; gp(P.x+Math.cos(a)*R,.5,P.z+Math.sin(a)*R,1.1*FXS,1.1*FXS,1,.8,.35); } evoRingB.push(P.x,.1,P.z,R*2.05,R*2.05,.3,.23,.08); }
    on('hose'); if(W.hose&&S.hoseT>0){ const ev=E.hose, rg=(3+.4*W.hose)*st().area*(ev?1.2:1); for(const off of (ev?[0,2.094,-2.094]:[0])){ const a=S.hoseDir+off; for(let i=0;i<(ev?3:1);i++){ const v=rr(8,12)*rg/4; ep(P.x+Math.cos(a)*.6,.9,P.z+Math.sin(a)*.6,Math.cos(a+rr(-.2,.2))*v,rr(-.2,.4),Math.sin(a+rr(-.2,.2))*v,rg/v,ev?.5:.34,ev?WHITE:BLUE); } if(ev) gp(P.x+Math.cos(a)*rg,.6,P.z+Math.sin(a)*rg,2.2*FXS,2.2*FXS,.5,.8,1); } }
    on('salt'); if(W.salt){ const ev=E.salt; let n=0; for(const q of salts){ if(n++>140) break; const k=1-q.t/q.life; if(k<=0) continue; gp(q.x,.15,q.z,(ev?1.5:.9)*FXS,(ev?1.5:.9)*FXS,(ev?.85:.5)*k,(ev?.95:.55)*k,k); } if(ev&&Math.random()<.5&&salts.length){ const q=salts[Math.floor(Math.random()*salts.length)]; ep(q.x,.2,q.z,0,rr(1,2.5),0,.6,.3,WHITE); } }
    if(on('beans')) for(const q of puddles){ gp(q.x,.1,q.z,3*FXS,3*FXS,.9,.6,.2); if(Math.random()<.25) ep(q.x+rr(-.6,.6),.15,q.z+rr(-.6,.6),0,rr(.8,1.6),0,.5,.28,AMBER); }
    if(on('talis')){ const L=[]; for(const e of enemies){ if(e.dead||!e.talis) continue; L.push(e); if(L.length>=10) break; } for(let i=1;i<L.length;i++) epLine(L[i-1].x,L[i-1].z,L[i].x,L[i].z,.9,.35,.7,[1,.85,.4],.3,t); for(const e of L) gp(e.x,.9,e.z,1.5*FXS,1.5*FXS,.9,.75,.35); }
    on('shadow'); if(W.shadow&&shadowP.root.visible){ const q=shadowP.root.position, ev=E.shadow; gp(q.x,1.1,q.z,(ev?4.2:2.4)*FXS,(ev?4.2:2.4)*FXS,.45,.25,.8); if(ev){ gp(q.x-.25,1.9,q.z,.7*FXS,.7*FXS,1,.85,.35); gp(q.x+.25,1.9,q.z,.7*FXS,.7*FXS,1,.85,.35); if(Math.random()<.5) ep(q.x+rr(-.5,.5),.4,q.z+rr(-.5,.5),0,rr(1,2),0,.6,.45,VIOLET); } }
    if(on('barcode')){ let n=0; for(const e of enemies){ if(e.dead||!e.mark) continue; if(n++>40) break; gp(e.x,.95,e.z,1.6*FXS,1.6*FXS,1,.8,.3); } }
    if(on('flute')){ let n=0; for(const e of enemies){ if(e.dead||!(e.freeze>0)) continue; if(n++>60) break; gp(e.x,.6,e.z,1.6*FXS,1.6*FXS,.35,.6,1); } }
    if(on('yut')) for(const y of S.yuts||[]){ gp(y.x,(y.y||0)+.5,y.z,1.8*FXS,1.8*FXS,1,.85,.45); if(Math.random()<.5) ep(y.x,(y.y||0)+.4,y.z,0,.2,0,.3,.35,GOLD); if(!y.efx&&y.t>=y.dur*.95){ y.efx=1; epBurst(y.tx,.4,y.tz,14,4,.4,.4,GOLD,2); er(y.tx,y.tz,.3,2.2,.35,GOLD,1.1); } }
    if(on('geumjul')){ const Q=S.posts||[]; for(let i=1;i<Q.length;i++) epLine(Q[i-1].x,Q[i-1].z,Q[i].x,Q[i].z,.7,.5,.5,GOLD,0,t); if(Q.length>2) epLine(Q[Q.length-1].x,Q[Q.length-1].z,Q[0].x,Q[0].z,.7,.5,.5,WHITE,0,t); }
    if(on('jang')){ const J=S.jangs||[]; for(const j of J) gp(j.x,1.2,j.z,2.6*FXS,2.6*FXS,1,.75,.3); if(J.length===2){ epLine(J[0].x,J[0].z,J[1].x,J[1].z,1.1,.4,.6,GOLD,.18,t); const k=(t*1.5)%1; gp(J[0].x+(J[1].x-J[0].x)*k,1.1,J[0].z+(J[1].z-J[0].z)*k,1.6*FXS,1.6*FXS,1,1,.9); } }
    if(on('kite')) for(const q of S.kites||[]){ gp(q.x,1.6,q.z,2.4*FXS,2.4*FXS,.55,.85,1); if(Math.random()<.7) ep(q.x,1.5,q.z,0,-.2,0,.45,.35,CYAN); }
    if(on('top')) for(const q of S.tops||[]){ evoRingB.push(q.x,.08,q.z,2.2*FXS,2.2*FXS,.55,.4,.15); if(Math.random()<.5){ const a=Math.random()*6.283; ep(q.x,.3,q.z,Math.cos(a)*4,1,Math.sin(a)*4,.25,.25,GOLD); } }
    if(on('bow')) for(const q of S.arrows||[]){ ep(q.x,.9,q.z,0,0,0,.3,.45,GOLD); gp(q.x,.9,q.z,1.5*FXS,1.5*FXS,1,.8,.35); }
    if(on('fan')){ let n=0; for(const g of gems){ if(n++>30) break; if(Math.random()<.15) ep(g.x,.3,g.z,(P.x-g.x)*2,0,(P.z-g.z)*2,.35,.22,CYAN); } }
    FXS=F0; EV2S=1; tieFx(t,P);
    // v2.27 2차 각성 기운: 진 무기 수만큼 발밑 고리가 겹치고, 하얀·보라 빛알이 몸을 돌며 위로 피어오른다
    let n2=0; for(const k in W) if(E[k]&&ev2(k)) n2++;
    if(n2){ const pu=.75+.25*Math.sin(t*4), R0=1.15*FXS; for(let j=0;j<n2;j++){ const R=R0+j*.38*FXS, c=j%2?VIOLET:WHITE; evoRingB.push(P.x,.09,P.z,R*2.05,R*2.05,c[0]*.32*pu,c[1]*.32*pu,c[2]*.32*pu); }
      const m=4+2*Math.min(n2,4); for(let i=0;i<m;i++){ const a=t*(2.2+.3*(i%2))+i/m*6.283, R=R0*(i%2?1.05:.8), y=.4+.9*((t*.7+i/m)%1); gp(P.x+Math.cos(a)*R,y,P.z+Math.sin(a)*R,.9*FXS,.9*FXS,i%2?.8:1,i%2?.55:.95,1); }
      if(Math.random()<.35*n2) ep(P.x+rr(-.6,.6),.2,P.z+rr(-.6,.6),0,rr(2.5,4.5),0,.7,.35,Math.random()<.5?WHITE:VIOLET); } }
  for(let i=EP.length-1;i>=0;i--){ const p=EP[i]; p.life-=dt; if(p.life<=0){ EP.splice(i,1); continue; } p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; p.vy-=p.grav*dt; const k=p.life/p.max, s=p.s*FXS*(.6+.4*k); gp(p.x,p.y,p.z,s,s,p.c[0]*k*.9,p.c[1]*k*.9,p.c[2]*k*.9); }
  for(let i=ER.length-1;i>=0;i--){ const r=ER[i]; r.life-=dt; if(r.life<=0){ ER.splice(i,1); continue; } const k=1-r.life/r.max, R=(r.r0+(r.r1-r.r0)*(1-(1-k)*(1-k)))*2.05, a=(1-k)*r.w*.6; evoRingB.push(r.x,.12,r.z,R,R,r.c[0]*a,r.c[1]*a,r.c[2]*a); }
  evoRingB.end(); }

let _fxInit=false;

/* ============ v2.24 필드 작은 지도 ============
   스킬칸 쪽 위에 둥근 작은 지도(지름 76px, 반경 70걸음). 건물은 FIELD.blocked를 2걸음마다 찍어 한 번만 그린다.
   표시: 모닥불(주황) · 중간보스 구역(붉은 고리, 보낸 곳은 회색) · 파이널 구역(금빛) · 보스(붉게 깜빡) · 빛나는 가게(노랑) · 같이 걷는 사람(하늘) · 나(하양). 범위 밖은 가장자리에 붙인다. */
const MM={cv:null,x:null,bg:null,fk:null,R:70,S:76,f:0};
function mmInit(){ if(MM.cv) return; const c=document.createElement('canvas'); c.id='mmap'; c.width=c.height=MM.S*2; document.body.appendChild(c); MM.cv=c; MM.x=c.getContext('2d');
  const st=document.createElement('style'); st.textContent='#mmap{position:fixed;top:60px;right:6px;width:76px;height:76px;border-radius:50%;z-index:4;pointer-events:none;border:2px solid rgba(244,183,64,.55);background:rgba(10,8,16,.6);box-shadow:0 0 8px rgba(0,0,0,.6);display:none}#mmap.L{right:auto;left:6px}#slots.sR.mmo,#slots.sL.mmo{top:144px}'; document.head.appendChild(st); }
function mmBg(){ const F=FIELD, B=F.bounds, st=2, W=Math.ceil(B.w/st), H=Math.ceil(B.h/st); const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'), id=g.createImageData(W,H), D=id.data;
  for(let j=0;j<H;j++) for(let i=0;i<W;i++){ const o=(j*W+i)*4, b=F.blocked(B.x0+i*st+1,B.z0+j*st+1); D[o]=b?118:34; D[o+1]=b?104:30; D[o+2]=b?140:44; D[o+3]=b?255:210; }
  g.putImageData(id,0,0); MM.bg=c; MM.st=st; MM.fk=S.field; }
function mmDraw(t){ const on=!!(FIELD&&S&&S.field&&S.phase!=='hub'&&S.phase!=='over'); mmInit(); const C=MM.cv, sl=$('slots');
  if(!on){ if(C.style.display!=='none'){ C.style.display='none'; sl&&sl.classList.remove('mmo'); } return; }
  if(C.style.display!=='block'){ C.style.display='block'; } const left=sl&&sl.classList.contains('sL'); C.classList.toggle('L',!!left); sl&&sl.classList.add('mmo');
  if((MM.f++)%2) return; if(!MM.bg||MM.fk!==S.field) mmBg();
  const g=MM.x, Z=MM.S*2, h=Z/2, k=h/MM.R, P=player.root.position, B=FIELD.bounds; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,Z,Z);
  g.save(); g.beginPath(); g.arc(h,h,h,0,6.283); g.clip(); g.imageSmoothingEnabled=false;
  g.setTransform(k,0,0,k,h-(P.x-B.x0)*k,h-(P.z-B.z0)*k); g.drawImage(MM.bg,0,0,MM.bg.width*MM.st,MM.bg.height*MM.st); g.setTransform(1,0,0,1,0,0);
  const pin=(x,z)=>{ let dx=(x-P.x)*k, dz=(z-P.z)*k; const d=Math.hypot(dx,dz), m=h-7; const out=d>m; if(out){ dx*=m/d; dz*=m/d; } return [h+dx,h+dz,out]; };
  const dot=(x,z,r,col,ring)=>{ const [px,pz,out]=pin(x,z); g.beginPath(); g.arc(px,pz,out?r*.75:r,0,6.283); if(ring){ g.lineWidth=3; g.strokeStyle=col; g.stroke(); } else { g.fillStyle=col; g.fill(); } };
  for(const f of (MY.fires||[])) dot(f.x,f.z,6,'#ffa640');
  for(const z of (MY.zones||[])){ const done=MPF.bd.includes(z.id); dot(z.x,z.z,z.mid?8:10,done?'rgba(150,150,160,.7)':z.mid?'#ff4a5a':'#ffd34a',true); }
  for(const o of SPOTS) if(!o.boss) dot(o.x,o.z,3.5,'#ffe27a');
  for(const p of mpPeers()){ const q=p.presence; if(q.a!=='f:'+S.field||typeof q.x!=='number') continue; const [px,pz,out]=pin(q.x,q.z), hold=(q.e|0)>0, r=out?5:7;
    g.beginPath(); g.arc(px,pz,r,0,6.283); g.fillStyle=q.dn===1?'#8a8a96':hold?'#ffa040':isParty(p)?'#7be38a':'#5ad0ff'; g.fill(); g.lineWidth=2; g.strokeStyle='#08121c'; g.stroke();
    if(!out){ g.fillStyle='#08121c'; g.font='800 9px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(mpName(p).slice(0,1),px,pz+.5); } }
  if(boss.alive&&!(boss.dying>0)) dot(boss.x,boss.z,7+2*Math.sin(t*8),boss.tier==='normal'?(NB_COL[S.field]||'#ff2a3a'):'#ff2a3a'); // v2.56 일반 보스 = 지역 색 점
  g.beginPath(); g.arc(h,h,6,0,6.283); g.fillStyle='#fff'; g.fill(); g.lineWidth=2.5; g.strokeStyle='#222'; g.stroke();
  g.restore(); }

function draw(dt,t){
  try{ mmDraw(t); }catch(e){ if(!MM.err){ MM.err=1; console.warn('mm',e); } }
  if(!_fxInit){ _fxInit=true; try{ fxSetup(); }catch(e){} }
  FXS=(FIELD?Math.min(1.5,camDF/Math.max(1,camD)):1)*1.15; glowB.begin(); water.m.size=.2*FXS*1.35; souls.m.size=.22*FXS*1.2; sparks.m.size=(HUBD.on?.16:.62)*FXS*1.2; /* v2.46 거점: 불티 작게 */ dust.m.size=.55*FXS*1.2; flameA.m.size=.62*FXS; flameB.m.size=.34*FXS;
  if(WORLD&&worldG&&worldG.visible){ const PP=player.root.position; for(const k in WLM){ const L=WLM[k], d=Math.hypot(L.x-camT.x,L.z-camT.z), M=L.g.userData.m.material; M.color.setScalar(Math.max(.22,Math.min(1,1.3-d/90)));
    const behind=PP.z<L.z+.5&&PP.z>L.z-L.H*1.1&&Math.abs(PP.x-L.x)<L.W*.5; const to=behind?.3:1; if(Math.abs(L.op-to)>.01){ L.op+=(to-L.op)*Math.min(1,dt*6); M.opacity=L.op; M.depthWrite=L.op>.95; } } }
  const P=player.root.position, inRun=S&&S.phase!=='hub';
  for(const k in BATCH){ BATCH[k].frames.forEach(b=>b.begin()); BATCH[k].glow.begin(); } shadowB.begin(); talisB.begin(); markB.begin(); teleB.begin();
  for(const e of enemies){ const d=e.d, B=BATCH[e.type], M=MOTION[e.type]||MOTION.shade; bendSet(0,0,0,0);
    if(e.hid){ if(d.lurk){ const q=1+.12*Math.sin(t*3+e.ph); shadowB.push(e.x,.02,e.z,1.5*q,1.1*q,1,1,1); if(Math.sin(t*2+e.ph)>.97) er(e.x,e.z,.3,1.1,.6,[.25,.55,.6],.6); } continue; } // 망량: 물웅덩이로 숨어 있다 · 이매: 사라진 동안
    // v2.22 걸음새: 나아가는 쪽으로 숙이고(lean), 종류마다 뛰고·날고·쿵쿵 걷는다. 얼면 멈춘다.
    if(e._px===undefined){ e._px=e.x; e._bt=t; e._lv=0; }
    const vx=dt>0?(e.x-e._px)/dt:0; e._px=e.x; const fr=e.freeze>0; const ph=t*M.f*(.84+.32*((e.ph*7.13)%1))+e.ph*6.283; // v2.54 괴수마다 박자 다르게
    e._lv+=((fr?0:Math.max(-.3,Math.min(.3,-Math.max(-.24,Math.min(.24,vx*.055))*M.lean)))-e._lv)*Math.min(1,dt*7);
    let y=0, sx=e.flip?-1:1, sy=1, rot=e._lv, bx=0, bz=0, bw=0, land=0; const GR=M.m==='glide'||M.m==='stomp'||M.m==='scuttle'||M.m==='trot'||M.m==='crawl';
    if(fr){ y=d.float||0; }
    else if(M.m==='float'){ y=d.float+Math.sin(t*3+e.ph)*.12; sy=1+Math.sin(t*9+e.ph)*.05; sx*=1-Math.sin(t*9+e.ph)*.03; rot+=Math.sin(t*2.3+e.ph)*.08; }
    else if(M.m==='glide'){ const w=Math.sin(ph); y=Math.abs(Math.sin(ph*.5))*.03; rot+=w*.07; sy=1+Math.cos(ph*2)*.04; sx*=1+Math.abs(e._lv)*.35; sy*=1-Math.abs(e._lv)*.2; }
    else if(M.m==='stomp'){ const w=Math.sin(ph), g=Math.abs(w); y=g*.11*M.a; rot+=w*.075*M.a; land=Math.max(0,1-g*4); sy=1-land*.1*M.a+g*.03; sx*=1+land*.08*M.a; }
    else if(M.m==='crawl'){ const w=Math.sin(ph); bz=.045*M.a; bw=ph*1.3; sy=1+w*.03; rot+=w*.03; } // v2.54 기는 것(지네·지렁이·구렁이): 몸에 물결
    else if(M.m==='hop'){ const p=(ph/6.283)%1, up=p<.55?Math.sin(p/.55*Math.PI):0; y=up*.55; sy=p<.55?1+up*.12:1-Math.sin((p-.55)/.45*Math.PI)*.2; sx*=p<.55?1-up*.08:1+Math.sin((p-.55)/.45*Math.PI)*.16; rot*=up; }
    else if(M.m==='trot'){ const p=(ph/6.283)%1, up=Math.sin(p*Math.PI); y=up*.22; sy=1+up*.06-(p<.12?.1:0); rot+=Math.sin(ph)*.06; }
    else if(M.m==='flap'){ const w=Math.sin(ph); y=(d.float||.7)+Math.sin(t*3.5+e.ph)*.16+w*.05; sx*=1+w*.17; sy=1-w*.06; rot+=Math.sin(t*2+e.ph)*.1; }
    else if(M.m==='scuttle'){ const w=Math.sin(ph); y=Math.abs(w)*.07; sy=1+w*.06; rot+=w*.05; }
    // v2.54: 걷고 기는 것은 발이 땅에 붙는다(둥둥은 나는 것만) — 흔들림·숙임은 몸 위쪽이 휘는 것으로
    if(GR&&!fr){ y=M.m==='trot'?y*.4:0;
      if(d.h<1.7&&!d.lurk){ if(e._cj===undefined) e._cj=t+3+((e.ph*13.7)%1)*7; const c=t-e._cj; // 가끔 웅크렸다 톡 튄다
        if(c>0&&c<.18){ const k=Math.sin(c/.18*Math.PI); sy*=1-.18*k; sx*=1+.1*k; } else if(c>=.18&&c<.43){ const k=Math.sin((c-.18)/.25*Math.PI); y+=k*.32; sy*=1+.07*k; } else if(c>=.43) e._cj=t+5+((e.ph*31.3+t)%1)*6; } }
    // 맞으면 뒤로 젖혀진다(때린 쪽 반대로), 나타날 땐 땅에서 솟아오른다
    if(e.flash>0){ const k=e.flash/.12; rot+=(e.x>=P.x?-1:1)*.32*k*(1-(d.kbRes||0)); sy*=1-.12*k; sx*=1+.08*k; }
    const age=t-e._bt; if(age<.32){ const k=age/.32, eo=1-(1-k)*(1-k); sy*=.15+.85*eo; sx*=.6+.4*eo; y-=(1-eo)*.15; }
    if(e.ch){ if(e.ch.ph===0){ const k=1-e.ch.t/.8; sx*=1+k*.18; sy*=1-k*.12; bx-=(e.ch.dx>=0?1:-1)*.3*k; /* v2.54 돌진 전 뒤로 젖혀 힘 모으기 */ const L=7.5, a=.8+.2*Math.sin(t*28); teleB.push(e.x+e.ch.dx*L/2,.05,e.z+e.ch.dz*L/2,d.r*1.6,L,a,a,a,Math.atan2(-e.ch.dx,-e.ch.dz)); } else { sx*=.88; sy*=1.1; } }
    if(e.cast>0){ sx*=1.15; sy*=1.15; }
    if(e.rise>0){ const k=e.rise/.4; y-=k*d.h*.9; sx*=1-.3*k; }
    if(e.bki>0){ const k=e.bki/.3; sx*=1-.7*k; sy*=1+.4*k; } if(e.bko>0){ const k=1-e.bko/.35; sx*=1-.8*k; sy*=1+.5*k; }
    if(e.rt>0){ sy*=1-.06*Math.abs(Math.sin(t*14)); }
    if(e.gs){ sx*=e.gs; sy*=e.gs; } if(e.inh>0){ const q=1+.08*Math.sin(t*30); sx*=q; sy*=1.06; }
    if(GR&&!fr){ bx+=rot*1.25; rot=0; } bendSet(bx,0,bz,bw);
    if(e.flash>0){ const fw=1.5+Math.min(1,e.flash/.09); B.frames[0].push(e.x,y,e.z,sx,sy,fw,fw,fw,rot); } // v2.38 손맛: 맞으면 하얗게 번쩍
    else if(d.emissive){ const T=d.tint||[1,1,1]; B.frames[0].push(e.x,y,e.z,sx,sy,(e.freeze>0?.6:1)*T[0],T[1],T[2],rot); }
    else{ lightAt(e.x,e.z,tint); if(e.ch&&e.ch.ph===0){ tint.r=Math.min(1,tint.r+.5); tint.g*=.6; tint.b*=.6; } if(e.freeze>0){ tint.r*=.6; tint.g*=.9; tint.b=Math.min(1,tint.b+.45); } if(e.burn>0){ tint.r=Math.min(1,tint.r+.35); } if(d.tint){ tint.r*=d.tint[0]; tint.g*=d.tint[1]; tint.b*=d.tint[2]; } B.frames[0].push(e.x,y,e.z,sx,sy,tint.r,tint.g,tint.b,rot); }
    const ga=d.emissive?.5:d.treasure?.6:1; B.glow.push(e.x,y,e.z+.02,sx,sy,ga,ga,ga,rot);
    { const sh=(1+land*.16)/(1+y*.9); shadowB.push(e.x,.02,e.z,d.r*1.9*(e.gs||1)*sh,d.r*1.5*(e.gs||1)*sh,1,1,1); } // v2.54 디딜 때 그림자가 퍼짐
    if(e.talis) talisB.push(e.x,d.h*.85+y,e.z+.05,1,1,.85,.85,.85,Math.sin(t*4+e.ph)*.2);
    if(e.mark) markB.push(e.x,d.h+.15+y,e.z+.05,1,1,1,1,1); }
  bendSet(0,0,0,0);
  for(let i=CORPSE.length-1;i>=0;i--){ const c=CORPSE[i]; c.t+=dt; const k=c.t/.32; if(k>=1||!BATCH[c.type]){ CORPSE.splice(i,1); continue; }
    const B=BATCH[c.type], dE=ET[c.type], g=c.gs; lightAt(c.x,c.z,tint); const f=1-k*.75;
    if(c.t<.07){ const p=1+.18*(1-c.t/.07); B.frames[0].push(c.x,(dE.float||0),c.z,(c.flip?-1:1)*g*p,g*p,2.5,2.5,2.5,0); } // v2.38: 쓰러지는 순간 하얗게 펑
    else B.frames[0].push(c.x,(dE.float||0)*(1-k),c.z,(c.flip?-1:1)*g*(1+k*.35),g*(1-k*.82),tint.r*f+k*.25,tint.g*f,tint.b*f,c.dir*-1.15*k*k);
    shadowB.push(c.x,.02,c.z,dE.r*1.9*g*(1-k*.5),dE.r*1.5*g*(1-k*.5),1,1,1); }
  for(const k in BATCH){ BATCH[k].frames.forEach(b=>b.end()); BATCH[k].glow.end(); } shadowB.end(); talisB.end(); markB.end(); teleB.end();
  gemB.begin(); gemBigB.begin(); emberB.begin(); joriB.begin();
  for(const g of gems){ const y=.15+Math.sin(t*3+g.t)*.06; (g.big?gemBigB:gemB).push(g.x,y,g.z,g.big?.85:.7,g.big?.85:.7,g.big?1:.72,g.big?1:.72,g.big?1:.72); }
  for(const e of embersItems){ emberB.push(e.x,.2+Math.sin(t*4+e.t)*.08,e.z,1,1,1,1,1); }
  for(const j of joris){ joriB.push(j.x,.25+Math.sin(t*3+j.t)*.1,j.z,1,1,1,1,1); }
  gemB.end(); gemBigB.end(); emberB.end(); joriB.end();
  orbB.begin(); orbCoreB.begin(); foxB.begin(); foxCoreB.begin(); beanB.begin(); saltB.begin(); puddleB.begin(); fanB.begin(); fxRingB.begin();
  for(const o of orbs){ orbB.push(o.x,o.y,o.z,1,1,1,.75,.3); orbCoreB.push(o.x,o.y,o.z,1,1,1,1,.85); }
  eshotB.begin(); dangerB.begin();
  for(const f of foxShots){ const w=f.wait>0?.7+.3*Math.sin(t*30):1; foxB.push(f.x,f.y,f.z,w*1.1,w*1.1,1,.12,.18); eshotB.push(f.x,f.y,f.z,w,w,1,1,1); }
  if(S&&S.haz) for(const h of S.haz){ const c=h.k==='fire'?[1,.55,.25]:(h.k==='poison'||h.k==='poisonS')?[.78,.4,1]:[.6,.75,.85], a=Math.min(1,h.t/.6)*(.75+.2*Math.sin(t*9+h.x)); dangerB.push(h.x,.045,h.z,h.R*2,h.R*2,c[0]*a,c[1]*a,c[2]*a); }
  if(S&&S.hails) for(const h of S.hails){ const k=Math.max(0,Math.min(1,1-h.t/1.3)), p=.75+.25*Math.sin(t*16); dangerB.push(h.x,.05,h.z,2.3,2.3,p,p,p); dangerB.push(h.x,.055,h.z,2.3*k,2.3*k,1,1,1); }
  eshotB.end(); dangerB.end();
  gDiscB.begin(); gRingB.begin(); gLineB.begin(); // v2.56 기믹 예고 바닥
  if(boss.alive) for(const m of GMK){ const B=m[0]==='d'?gDiscB:m[0]==='r'?gRingB:gLineB; B.push(m[1],m[0]==='r'?.075:m[0]==='l'?.058:.052,m[2],m[3],m[4],m[5],m[6],m[7],m[8]); }
  gDiscB.end(); gRingB.end(); gLineB.end();
  if(boss.alive&&!boss.dying&&S.bossKey==='gumiho'){ for(let i=0;i<3;i++){ const a=boss.orbit+i*2.094; const x=boss.x+Math.cos(a)*1.5,z=boss.z+Math.sin(a)*.9,y=2+Math.sin(t*2.4+i)*.2; foxB.push(x,y,z,.9,.9,.2,1,.88); foxCoreB.push(x,y,z,1,1,.8,1,1); } }
  for(const b of beans) beanB.push(b.x,.7,b.z,1,1,1,1,1,t*12);
  for(const q of salts){ const a=Math.min(1,(q.life-q.t)/1); saltB.push(q.x,.035,q.z,q.r*1.9,q.r*1.9,a,a,a); }
  for(const q of puddles){ const a=Math.min(1,(q.life-q.t)/.5); puddleB.push(q.x,.04,q.z,1,1,a,a,a); }
  for(const f of fxs){ const k=1-f.life/f.max, r=f.r*(.4+.6*k)*2.1, a=(1-k); fanB.push(f.x,.08,f.z,r,r,f.col[0]*a*.95,f.col[1]*a*.95,f.col[2]*a*.95); const rr2=f.r*(.55+.45*k)*2.05; fxRingB.push(f.x,.1,f.z,rr2,rr2,f.col[0]*a*1.05,f.col[1]*a*1.05,f.col[2]*a*1.05); }
  orbB.end(); orbCoreB.end(); foxB.end(); foxCoreB.end(); beanB.end(); saltB.end(); puddleB.end(); fanB.end(); fxRingB.end(); drawSkills2(t);
  if(boss.alive){ boss.root.position.set(boss.x,boss.hop||0,boss.z); lightAt(boss.x,boss.z,tint); tint.r=Math.max(tint.r,.55); tint.g=Math.max(tint.g,.6); tint.b=Math.max(tint.b,.65);
    if(boss.flash>0) tint.lerp(new THREE.Color(1,1,1),boss.flash*.7); if(boss.state==='tele'||boss.state==='slam') tint.lerp(new THREE.Color(1,.4,.45),.5); if(boss.freeze>0) tint.lerp(new THREE.Color(.5,.7,1),.5);
    if(boss.def.dt){ tint.r*=boss.def.dt[0]; tint.g*=boss.def.dt[1]; tint.b*=boss.def.dt[2]; } if(boss.gRed>0) tint.lerp(new THREE.Color(1,.25,.3),boss.gRed*.6); if(boss.gFrz>0) tint.lerp(new THREE.Color(.6,.85,1),.45); if(boss.vuln>0) tint.lerp(new THREE.Color(1,.9,.5),.3);
    boss.mat.color.copy(tint); boss.body.position.y=0; // v2.54: 보스도 발은 땅에 — 걸음은 몸 위쪽이 휘고 디딜 때 눌림
    { const U=boss.mat.userData.bend, BD=boss.def, big=BD.H>=3.4, CR=/^(imugi|jine|jireongi|gureong)$/.test(boss.key||''); U.uBendH.value=(boss.body.geometry.userData.h||BD.H); if(boss.after>0) boss.after-=dt;
      let bx=0,by=0,bz=0,bw=0; const ph=t*(big?3.6:4.6);
      if(boss.state==='walk'&&!(boss.after>0)){ const w=Math.sin(ph); bx=w*(CR?.02:.055); const land=Math.max(0,1-Math.abs(w)*5); by=-land*(big?.07:.045);
        const sg=w>=0?1:-1; if(boss._sg!==undefined&&sg!==boss._sg&&big&&inRun){ DBG.shake=Math.max(DBG.shake||0,.08); for(let i=0;i<4;i++){ const q=dust.items[dustI=(dustI+1)%dust.n]; q.life=.5; q.x=boss.x+sr(-.8,.8); q.y=.1; q.z=boss.z+sr(-.3,.3)+.2; q.vx=sr(-.9,.9); q.vy=sr(.3,.7); q.vz=sr(-.3,.3); } } boss._sg=sg; }
      else if(boss.state==='tele'||boss.state==='ctele'){ const k=Math.min(1,boss.st/.45); bx=-((boss.dx||0)>=0?1:-1)*.24*k; by=-.08*k; }
      else if(boss.state==='slam'){ by=.07*Math.min(1,boss.st/.9); }
      if(boss.after>0){ const k=boss.after/.4; by=-.13*Math.sin(k*Math.PI*.5+.0001); }
      if(boss.gLean>0){ bx=-((boss.lvx||0)>=0?1:-1)*.24*boss.gLean; by=-.08*boss.gLean; } // v2.56 돌진·찌르기 전 뒤로 젖혀 힘 모으기
      if(CR){ bz=.035; bw=t*5; }
      U.uBend.value.set(bx*(boss.flip?-1:1),by,bz,bw); boss.sh.scale.set(2.6*(1-by*1.2),.85*(1-by*1.2),1); }
    bossL.l.position.set(boss.x,1.4,boss.z+.3); bossL.l.intensity=7+Math.sin(t*7); boss.halo.material.opacity=.22+.05*Math.sin(t*5); }
  for(let i=0;i<DECOY.length;i++){ const D=DECOY[i], q=boss.alive&&!(boss.dying>0)&&boss.dec?boss.dec[i]:null; D.r.visible=!!(q&&q.pop>=0); if(!D.r.visible) continue; // v2.56 가짜
    D.r.position.set(q.x,boss.hop>0?0:0,q.z); D.b.geometry=boss.body.geometry; D.m.map=boss.mat.map; D.m.color.copy(boss.mat.color); if(q.pop>0) D.m.color.setRGB(1,.45,.45); D.bb.scale.x=(q.vx||0)<0?-1:1; D.r.scale.setScalar(boss.root.scale.x); }
  if(boss.gq&&boss.gq.k==='eclipse'&&boss.gq.ph==='a') eclEye(true);
  lightAt(P.x,P.z,tint); player.mat.color.setRGB(Math.min(1,tint.r+.25),Math.min(1,tint.g+.25),Math.min(1,tint.b+.2));
  if(S&&S.hitFlash>0){ S.hitFlash=Math.max(0,S.hitFlash-dt*3.2); if(Math.floor(S.hitFlash*9)%2===0) player.mat.color.setRGB(1,.3,.34); }
  // v2.6: 무적 깜빡임 · 몸 내밀기 · 발밑 판정 점
  player.body.visible=!(inRun&&S&&S.iframe>0&&Math.floor(t*22)%2===0);
  if(S&&S.lg>0){ S.lg=Math.max(0,S.lg-dt*5); const k=Math.sin(S.lg*Math.PI)*.2; player.bb.position.set(S.face.x*k,0,S.face.z*k); } else player.bb.position.set(0,0,0);
  footDot.visible=inRun; if(inRun){ footDot.position.set(P.x,.035,P.z); footDot.material.opacity=.55+.25*Math.sin(t*6); } xraySync();
  if(!S||S.phase==='hub'||S.phase==='over'){ const lb=$('lvBadge'); if(lb&&lb.style.display!=='none') lb.style.display='none'; } // v2.47 판이 끝나면 「성장 고르기」 표시를 지움(남은 성장은 그 판에서만 쓰임)
  { const hb=!S||S.phase==='hub'; if(HUBD.on!==hb){ HUBD.on=hb; HUBD.g.visible=hb; const N=SITES.namsan; N.beam.visible=N.beam2.visible=!hb; N.disc.visible=!hb&&isLit('namsan'); fireHalo.scale.setScalar(hb?2.2:4.2); } } // v2.46 거점에선 빛기둥·밝은 둘레를 끄고 밤 거리로
  if(keeper.visible){ lightAt(keeper.position.x,keeper.position.z,tint); keeper.userData.m.material.color.setRGB(Math.min(1,.5+tint.r*.45),Math.min(1,.5+tint.g*.45),Math.min(1,.56+tint.b*.45)); // v2.44: 새 그림엔 불빛이 이미 그려져 있어 덜 물들임 keeper.userData.m.position.y=0;
    // 움직임: 숨쉬기(몸이 살짝 부풀고) · 천천히 몸 흔들기 · 4~8초마다 불을 쑤시면 불티가 오른다
    const km=keeper.userData.m, br=Math.sin(t*1.8); if(!KEEP.nx) KEEP.nx=t+3; if(DBG.keepGo){ DBG.keepGo=0; KEEP.nx=t; } // 실제 시간 기준(폰이 버벅여도 속도 같게)
    let pk=KEEP.end>t;
    if(!pk&&km.material.map!==KEEP.a) km.material.map=KEEP.a;
    if(!pk&&t>=KEEP.nx){ KEEP.nx=t+4+Math.random()*4; KEEP.end=t+.75; KEEP.n++; km.material.map=KEEP.b; pk=true;
      for(let i=0;i<7;i++){ const q=sparks.items[spkI=(spkI+1)%sparks.n], a=Math.random()*6.28, v=.4+Math.random()*1.1; q.life=.5+Math.random()*.5; q.x=-.15+Math.cos(a)*.15; q.y=.35; q.z=.1+Math.sin(a)*.15; q.vx=Math.cos(a)*v; q.vz=Math.sin(a)*v; q.vy=5+Math.random()*3; } }
    const lean=pk?Math.sin(Math.min(1,(t-(KEEP.end-.75))/.2)*Math.PI/2)*.025:0;
    km.scale.set(1-br*.006,1+br*.014,1); km.rotation.z=-lean+Math.sin(t*.55)*.012; KEEP.cur=km.material.map; }
  if(fallenNPC.visible){ lightAt(fallenNPC.position.x,fallenNPC.position.z,tint); fallenNPC.userData.m.material.color.setRGB(Math.min(1,tint.r+.35),Math.min(1,tint.g+.35),Math.min(1,tint.b+.4)); fallenNPC.userData.m.scale.y=1+Math.sin(t*2)*.02; }
  const fl=.85+.1*Math.sin(t*13)+.06*Math.sin(t*29+1); fireL.l.intensity=26*fl*(1+upTotal()*.015); fireHalo.material.opacity=(HUBD.on?.1:.45)+(HUBD.on?.05:.1)*fl; flameMat.map=T.flames[Math.floor(t*10)%4];
  if(FIELD&&MY&&MY.fires){ const nf=nearFire(P).f; fireL.l.position.set(nf.x,1.6,nf.z); fireL.R=12; fireL.l.distance=19; fireL.l.intensity*=.42; for(const F of MY.fires) if(F.g&&F.g.pool) F.g.pool.material.opacity=.2+.06*fl; } else if(fireL.R!==9){ fireL.l.position.set(0,1.1,0); fireL.R=9; fireL.l.distance=9*1.6; } // v2.20 밤: 가장 가까운 모닥불이 진짜 빛을 냄
  flame.scale.setScalar(1+upTotal()*.02);
  { const k=t*6.5, i=Math.floor(k)%4, f=k-Math.floor(k), sc=1+upTotal()*.02; PIT.a.material.map=PIT.F[i]; PIT.b.material.map=PIT.F[(i+1)%4]; PIT.a.material.opacity=1-f; PIT.b.material.opacity=f; // v2.46 손그림 불꽃: 4장을 부드럽게 겹쳐 넘김 + 숨쉬듯 흔들림
    const wy=sc*(1+.07*Math.sin(t*9.3)+.04*Math.sin(t*17+1)), wx=sc*(1+.04*Math.sin(t*7.1+2)); PIT.a.scale.set(wx,wy,1); PIT.b.scale.set(wx,wy,1); PIT.a.rotation.z=PIT.b.rotation.z=.04*Math.sin(t*3.3);
    for(const m of PIT.s){ const u=m.userData, j=Math.floor(k*.9+u.ph)%4; m.material.map=PIT.F[(j+2)%4]; m.material.opacity=.9; m.scale.set(u.sc*wx*(1+.05*Math.sin(t*6+u.ph)),u.sc*sc*(1+.12*Math.sin(t*8.1+u.ph*2)),1); m.rotation.z=(m.position.x<0?.12:-.12)+.05*Math.sin(t*4+u.ph); } }
  restRing.material.opacity=inRun?.25+.1*Math.sin(t*2):0;
  stepPts(embers,dt,(e,i)=>{ if(e.life<=0){ e.life=1+Math.random()*1.6; e.x=(Math.random()-.5)*.6; e.z=(Math.random()-.5)*.6; e.y=.3; e.vy=.8+Math.random()*1.2; e.vx=0; e.vz=0; } e.y+=e.vy*dt; e.x+=Math.sin(t*3+i)*.25*dt; });
  stepPts(ash,dt,(a)=>{ a.x+=a.vx*dt+Math.sin(t+a.z)*.1*dt; a.y+=a.vy*dt; if(a.y<0){ a.y=rr(7,10); a.x=camT.x+rr(-14,14); a.z=camT.z+rr(-12,10); } if(Math.abs(a.x-camT.x)>16) a.x=camT.x+rr(-14,14); if(Math.abs(a.z-camT.z)>16) a.z=camT.z+rr(-12,10); a.life=1; });
  stepPts(dust,dt,(q)=>{ if(q.life<=0){ q.y=-999; return; } q.x+=q.vx*dt; q.y+=q.vy*dt; q.z+=q.vz*dt; q.vy*=.92; });
  stepPts(sparks,dt,(q)=>{ if(q.life<=0){ q.y=-999; return; } if(DBG.spkHold){ q.life+=dt; return; } q.x+=q.vx*dt; q.y+=q.vy*dt; q.z+=q.vz*dt; q.vy-=10*dt; q.vx*=.9; q.vz*=.9; });
  stepPts(souls,dt,(s)=>{ if(s.life<=0){ s.y=-999; return; } s.x+=s.vx*dt; s.y+=s.vy*dt; s.z+=s.vz*dt; s.vy-=1.5*dt; s.vx*=.96; s.vz*=.96; });
  const fstep=(f)=>{ if(f.life<=0){ f.y=-999; return; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.z+=f.vz*dt; f.vx*=.9; f.vz*=.9; }; stepPts(flameA,dt,fstep); stepPts(flameB,dt,fstep);
  stepPts(water,dt,(w)=>{ if(w.life<=0){ w.y=-999; return; } w.x+=w.vx*dt; w.y+=w.vy*dt; w.z+=w.vz*dt; w.vy-=4*dt; if(w.y<.05){ w.y=.05; w.vy=0; } });
  const kind=scene.userData.kind;
  for(const O of OCC){ if(O.grp!==kind) continue; const gp=O.g.position; if(Math.abs(gp.x-camT.x)>14||Math.abs(gp.z-camT.z)>18){ if(O.op<1){ O.op=1; O.ms.forEach(m=>{m.opacity=1;m.depthWrite=true;}); } continue; }
    let hide=false; const qs=[P]; if(boss.alive) qs.push(boss); for(const q of qs){ const dx=Math.abs(gp.x-q.x),dz=gp.z-q.z; if(dz>-.3&&dz<O.h*O.s&&dx<O.w*O.s) hide=true; }
    const to=hide?.28:1; if(Math.abs(O.op-to)>.01){ O.op+=(to-O.op)*Math.min(1,dt*6); O.ms.forEach(m=>{m.opacity=O.op;m.depthWrite=O.op>.95;}); } }
  // 카메라: 거점에서는 가까이
  const hub=S&&S.phase==='hub'; const target=hub?new THREE.Vector3(-.05,0,HUB_CZ):new THREE.Vector3(P.x,0,P.z); if(hub) hubHits();
  camT.lerp(target,1-Math.exp(-dt*(hub?3:5)));
  const D=hub?Math.max(8.2,camD*.46):FIELD?camDF*FZOOM:camD; DBG.camD=(DBG.camD??D)+(D-(DBG.camD??D))*Math.min(1,dt*3); const DD=DBG.camD;
  DBG.shake=Math.max(0,(DBG.shake||0)-dt*1.6); const sk=DBG.shake*DBG.shake*.6, ox=(Math.random()-.5)*sk, oz=(Math.random()-.5)*sk;
  camera.position.set(camT.x+ox,.6+Math.sin(PITCH)*DD,camT.z+Math.cos(PITCH)*DD+oz); camera.lookAt(camT.x+ox,.6,camT.z+oz);
  if(FIELD){ const nb=Math.min(1.6,TU('night')); scene.fog.near=DD+NIGHT.fogN*nb; scene.fog.far=DD+NIGHT.fogF*nb; nightTick(); FIELD.update(dt,GL.on&&GL.b>.3?{x:GL.d.x,z:GL.d.z}:P,camera); moodTick(dt,P);  glimpseCam(); } else { scene.fog.near=DD*.9; scene.fog.far=DD*1.9+(hub?4:0); }
  for(const A of AXES) if(A.g.visible){ const p=A.g.position; glowB.push(p.x,p.y,p.z,1.7*FXS,1.7*FXS,.4,.3,.13); }
  try{ evoFx(dt,t); }catch(e){ if(!DBG.evoErr){ DBG.evoErr=String(e); console.error(e); } }
  glowB.end();
  if(!NOREN||(++NOREN_N%25===0)) drawFrame();
  if(S){ S.hurtT=Math.max(0,(S.hurtT||0)-dt*2); $('hurt').style.opacity=inRun?Math.min(.9,S.hurtT+(S.hp<S.maxhp*.3?.25+.15*Math.sin(t*6):0)):0; }
  if(toastT>0){ toastT-=dt; if(toastT<=0){ $('toast').style.opacity=0; toastT=-.0001; } } else if(toastT<0){ toastT-=dt; if(toastT<=-.4){ toastT=0; const now=performance.now(); while(toastQ.length&&now-toastQ[0].at>4000) toastQ.shift(); const q=toastQ.shift(); if(q) toastShow(q.a,q.b); } }
  uiT-=dt; if(uiT<=0){ uiT=.1; if(S&&inRun) ui(); }
  arrows(); dnDraw(dt); treDraw(); if(!inRun){ const b=$('bSp'); if(b&&b.style.display!=='none') b.style.display='none'; }
  fpsN++; fpsT+=dt; if(fpsT>1){ $('fps').textContent=`${fpsN} fps · ${enemies.length}`; DBG.fps=fpsN;
    if(S&&S.phase==='play'&&!BOT){ if(fpsN<38){ DBG.low=(DBG.low||0)+1; if(DBG.low>=3&&renderer.getPixelRatio()>1){ renderer.setPixelRatio(1); resize(); DBG.low=0; } } else DBG.low=0; }
    fpsN=0; fpsT=0; }
}
const upTotal=()=>Object.values(SV.up).reduce((a,b)=>a+b,0);
function stepPts(pp,dt,fn){ for(let i=0;i<pp.n;i++){ const p=pp.items[i]; p.life-=dt; fn(p,i); pp.pos[i*3]=p.x; pp.pos[i*3+1]=p.y; pp.pos[i*3+2]=p.z; } pp.g.attributes.position.needsUpdate=true; }
const mmss=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function ui(){
  $('xpf').style.width=(S.xp/S.need*100)+'%'; $('lv').textContent=`Lv ${S.lv}`; $('time').textContent=mmss(S.t); $('kills').textContent=`처치 ${S.kills}`;
  $('hpf').style.width=(S.hp/S.maxhp*100)+'%'; $('hpt').textContent=Math.ceil(S.hp);
  { const SP=SPECIAL[S.char]||SPECIAL.fire, b=$('bSp'); if(b){ b.style.display='flex'; { const e=$('spIc'); if(e._ic!==SP.ic){ e._ic=SP.ic; e.innerHTML=SP.ic; } } const r=S.spCd/SP.cd; $('spCd').style.background=r>0?`conic-gradient(rgba(7,6,12,.78) ${r*360}deg, transparent 0)`:'none'; b.classList.toggle('rdy',r<=0); $('spT').textContent=''; }
    const L=$('spLeft'), PP=player.root.position, left=S.rush>0?S.rush:S.bogo>0?S.bogo:S.spHose?S.spHose.t:(S.maeT||0)>0?S.maeT:(S.onAir||0)>0?S.onAir:0; if(L){ if(left>0){ _v2.set(PP.x,2.3,PP.z).project(camera); L.style.display='block'; L.style.transform=`translate(${(_v2.x*.5+.5)*innerWidth}px,${(-_v2.y*.5+.5)*innerHeight}px) translate(-50%,-50%)`; L.textContent=left.toFixed(1); } else L.style.display='none'; } }
  if(boss.alive) $('bossf').style.width=(boss.hp/boss.maxhp*100)+'%'; else if(!S.bossSpawned||S.bossDead) $('boss').style.display='none';
  if(!S.bossSpawned&&S.t>BOSS_T-30&&S.t<BOSS_T&&!S.warned){ S.warned=true; toast('무언가 다가온다',S.bossKey==='gumiho'?'붉은 꼬리 아홉 개':'쇠 씹는 소리'); }
}
function statHtml(){
  const w=Object.keys(S.W).map(k=>(S.evo[k]?EVOS[k].name:`${WEAPONS[k].name} ${S.W[k]}`)+(S.br[k]?`(${BR[k][S.br[k]][0]})`:'')).concat(Object.keys(S.fu).map(k=>'['+FUS[k].name+']')).join(' · ');
  return `${CHARS[S.char].short} · ${fName()||REGIONS[S.region].name}${S.deep?' · 🕳 깊이 '+S.deep:''}<br>버틴 시간 <b>${mmss(S.t)}</b> · 레벨 <b>${S.lv}</b> · 처치 <b>${S.kills}</b><br>${w}`;
}

/* ============ v2.6 보물 괴수 표시 (머리 위 💰 + 체력 줄) ============ */
const TRN={toad:'금화 두꺼비',magpie:'금화 까치',gpig:'금돼지'};
const TRE=[]; function treDraw(){ const L=document.getElementById('treL'); if(!L) return; if(!TRE.length) for(let i=0;i<4;i++){ const d=document.createElement('div'); d.className='trm'; d.innerHTML='<i>'+gi('u_tre')+'</i><b><u></u></b>'; L.appendChild(d); TRE.push(d); }
  let n=0; if(S&&S.phase==='play') for(const e of enemies){ if(!e.d.treasure||e.dead||n>=4) continue; _v2.set(e.x,e.d.h+(e.d.float||0)+.25,e.z).project(camera); if(Math.abs(_v2.x)>1.05||Math.abs(_v2.y)>1.05) continue;
    const d=TRE[n++]; d.style.display='flex'; d.style.transform=`translate(${(_v2.x*.5+.5)*innerWidth}px,${(-_v2.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`; d.lastElementChild.firstElementChild.style.width=Math.max(0,e.hp/e.maxhp*100)+'%'; }
  for(let i=n;i<TRE.length;i++) TRE[i].style.display='none'; }

/* ============ 화면 밖 화살표 ============ */
const _v=new THREE.Vector3();
function arrow(el,x,z,show,label){
  el._on=false; if(!show){ el.style.display='none'; return; }
  _v.set(x,1,z).project(camera); const inside=Math.abs(_v.x)<.92&&Math.abs(_v.y)<.9&&_v.z<1; if(inside){ el.style.display='none'; return; }
  let ax=_v.x, ay=_v.y; if(_v.z>1){ ax=-ax; ay=-ay; } const m=Math.max(Math.abs(ax)/.8,Math.abs(ay)/.74)||1; ax/=m; ay/=m;
  const sx=(ax*.5+.5)*innerWidth, sy=(-ay*.5+.5)*innerHeight; el.style.display='flex'; el._on=true; el._sx=sx; el._sy=sy; el.style.transform=`translate(${sx}px,${sy}px)`;
  const i=el.firstElementChild, b=el.lastElementChild; if(i) i.style.transform=`rotate(${Math.atan2(ax,ay)}rad)`;
  if(b){ const sd=ax>.45?'translateX(-88%)':ax<-.45?'translateX(-12%)':'translateX(-50%)'; if(b.style.transform!==sd) b.style.transform=sd; }
  if(b&&label!=null){ const P=player.root.position, d=Math.hypot(x-P.x,z-P.z), txt=`${label} ${FIELD?Math.round(d*MPU())+'m':WORLD?Math.round(d*2.4)+'m':Math.round(d)}`; if(b._h!==txt){ b._h=txt; b.innerHTML=txt; } }
}
function arrows(){
  const play=S&&S.phase==='play', P=player.root.position;
  let bx=boss.x,bz=boss.z,bshow=play&&boss.alive&&!boss.dying;
  let blab=null; if(FIELD&&play&&!bshow&&!S.fLoot){ const Z=nextZone(P); if(Z){ bx=Z.x; bz=Z.z; bshow=true; blab=S.duel?'⚔ '+Z.name:Z.mid?`${gi('u_mid')}중간보스 ${midsN()+1}/3`:gi('u_final')+'파이널 보스'; } }
  if(WORLD&&!FIELD&&play&&!bshow&&(upLv('compass')||upLv('ptaxi'))){ let bd=1e9; for(const k in SITES){ if(S.zoneDone&&S.zoneDone[k]) continue; const Z=SITES[k].zone, d=Math.hypot(Z.x-P.x,Z.z-P.z); if(d<bd){ bd=d; bx=Z.x; bz=Z.z; bshow=true; } } }
  arrow($('arBoss'),bx,bz,bshow,blab||gi('u_mid')+(boss.alive?boss.def.name:'보스 구역'));
  { const H=FIELD&&play?mpNearHolder(P):null; arrow($('arHold'),H?.x,H?.z,!!H,H?gi('u_ember')+H.nm:''); }
  let tr=null; if(play) for(const e of enemies) if(e.d.treasure){ tr=e; break; } arrow($('arTre'),tr?.x,tr?.z,play&&!!tr,gi('u_tre')+(tr?TRN[tr.type]:''));
  if(FIELD){ const nf=nearFire(P), need=S&&(S.hp<S.maxhp*.5||(lvKeep()&&pendN()>0)||S.fLoot>0); arrow($('arFire'),nf.f.x,nf.f.z,play&&nf.d>9&&need,gi('u_fire')+(S&&S.hp<S.maxhp*.5?'쉬기':pendN()>0?'성장':'모닥불')); } // v2.36: 쓸 일이 있을 때만
  else if(WORLD){ const [lk]=play?nearestLit(P.x,P.z):['namsan']; const F=SITES[lk]; arrow($('arFire'),F.x,F.z,play&&Math.hypot(F.x-P.x,F.z-P.z)>9,gi('u_fire')+'모닥불'); }
  else arrow($('arFire'),0,0,play&&S.hp<S.maxhp*.4&&Math.hypot(P.x,P.z)>5,gi('u_fire')+'모닥불');
  { let sp=null,sd=1e9; if(play) for(const o of SPOTS){ const d=Math.hypot(o.x-P.x,o.z-P.z); if(d<sd){sd=d;sp=o;} } arrow($('arLoot'),sp?.x,sp?.z,play&&!!sp,sp&&sp.ember?gi('u_ember')+'불씨 덩어리':sp&&sp.boss?gi('u_shut')+'셔터':gi('u_spark')+'물건'); }
  arrow($('arNpc'),S?.npc?.x,S?.npc?.z,play&&S.npc&&!S.npcDone,gi('u_npc')+'누군가');
  // v2.31 친구 위치(기획자 05:30 「친구 위치가 표시가 안 되더라」): 같은 필드의 파티원(없으면 가장 가까운 사람)이 화면 밖이면 가장자리 초록 화살표
  { let a=$('arPal'); if(!a&&$('arHold')){ a=$('arHold').cloneNode(true); a.id='arPal'; a.style.color='#7be38a'; document.body.appendChild(a); }
    let F=null, fd=1e9; if(a&&play&&MP.ghosts) for(const G of MP.ghosts.values()){ const q=G.g.position, d=Math.hypot(q.x-P.x,q.z-P.z)-(G.pty?1e4:0); if(d<fd){ fd=d; F={x:q.x,z:q.z,nm:(G.pty?'🤝':'👥')+(G.nm||'')}; } }
    if(a) arrow(a,F?.x,F?.z,!!F,F?F.nm:''); }
  // v2.19 점검: 화살표 이름표가 겹치면(같은 쪽 가장자리) 뒤의 것을 가장자리를 따라 비켜 놓는다
  // v2.36 화면 정리(51번 8 「화살표가 한쪽에 몰림」): 중요한 순서로 3개까지만 + 같은 쪽 가장자리에 서면 간격을 벌려 줄 세운다
  const L=['arPal','arBoss','arFire','arTre','arHold','arLoot','arNpc'].map(k=>$(k)).filter(e=>e&&e._on);
  L.slice(3).forEach(e=>{ e.style.display='none'; e._on=false; }); const K=L.slice(0,3);
  const W=innerWidth, H=innerHeight, TOP=Math.min(H*.3,230), BOT=H-150, side=e=>e._sx<70?'L':e._sx>W-70?'R':e._sy<H*.5?'T':'B';
  for(const sd of ['L','R','T','B']){ const g=K.filter(e=>side(e)===sd); if(!g.length) continue; const vert=sd==='L'||sd==='R', gap=vert?66:104, lo=vert?TOP:60, hi=vert?BOT:W-60;
    g.sort((a,b)=>vert?a._sy-b._sy:a._sx-b._sx); const v=g.map(e=>Math.min(hi,Math.max(lo,vert?e._sy:e._sx)));
    for(let i=1;i<v.length;i++) if(v[i]-v[i-1]<gap) v[i]=v[i-1]+gap; const over=v[v.length-1]-hi; if(over>0){ for(let i=0;i<v.length;i++) v[i]-=over; v[0]=Math.max(lo,v[0]); }
    g.forEach((e,i)=>{ if(vert) e._sy=v[i]; else e._sx=v[i]; e.style.transform=`translate(${e._sx}px,${e._sy}px)`; }); }
  if(K.length>1){ const box=e=>{ const a=e.getBoundingClientRect(), b=e.lastElementChild.getBoundingClientRect(); return [Math.min(a.left,b.left)-4,a.top-4,Math.max(a.right,b.right)+4,Math.max(a.bottom,b.bottom)+4]; };
    for(let i=1;i<K.length;i++){ const e=K[i]; for(let k=0;k<4;k++){ const A=box(e); if(!K.slice(0,i).some(o=>{ const B=box(o); return A[0]<B[2]&&B[0]<A[2]&&A[1]<B[3]&&B[1]<A[3]; })) break;
        const sd=side(e); if(sd==='L'||sd==='R') e._sy=Math.max(TOP,e._sy-70); else e._sx+=e._sx>W*.5?-110:110; e.style.transform=`translate(${e._sx}px,${e._sy}px)`; } } }
}

/* ============ 흐름: 거점 → 출발 → 판 → 결과 → 거점 ============ */
function clearWorld(){
  enemies.length=0; CORPSE.length=0; gems.length=0; embersItems.length=0; joris.length=0; orbs.length=0; foxShots.length=0; salts.length=0; beans.length=0; puddles.length=0; fxs.length=0;
  boss.alive=false; boss.root.visible=false; bossL.on=false; bossL.l.intensity=0; teleMesh.visible=false; slamRing.visible=false; beamMesh.visible=false; fallenNPC.visible=false;
  AXES.forEach(a=>a.g.visible=false); shAxesOff(); auraMesh.visible=false; auraMesh2.visible=false; shadowP.root.visible=false; shadowP.root.scale.setScalar(1); headL.material.opacity=0;
  $('boss').style.display='none';
}
function setChar(k){ SV.char=k; player.gait=GAIT[k]||GAIT0; player.views=CHARV[k]; player.view=''; player.look(0,1); shadowP.views=CHARV[k]; shadowP.view=''; shadowP.look(0,1);
  lanternL.c.set(CHARS[k].light); lanternL.l.color.set(CHARS[k].light); }
function enterHub(){ { const e=document.getElementById('duelBar'); if(e) e.style.display='none'; } if(SV.betHold&&!(S&&S.duel&&S.duel.end)) betLost(); if(S&&S.doom) doomEnd(); if(S) S.down=null; { const b=document.getElementById('downBan'); if(b) b.style.display='none'; try{ player.bb.rotation.z=0; player.mat.opacity=1; }catch(e){} } { const t=$('toast'); if(t) t.style.opacity=0; toastT=0; toastQ.length=0; const db=$('doomBan'); if(db) db.classList.remove('show'); } // v2.19 점검: 필드 알림이 기지까지 남던 것 $('lvbar').classList.remove('show'); if(S) S.lvb=null; clearSpots(); { const e=$('lootB'); if(e) e.style.display='none'; }
  if(S&&S.phase==='play') return;
  clearWorld(); setScene(WORLD?'world':'field'); S={phase:'hub',hp:1,maxhp:1}; setChar(SV.char); if(WORLD&&!isLit(SV.region)) SV.region='namsan';
  player.root.position.set(.75,0,1.2); player.look(-.4,1); camT.set(-.05,0,HUB_CZ); keeper.visible=true; hubToad.visible=SV.released>0;
  ['hud','slots'].forEach(i=>$(i).style.display='none'); $('btns').style.display='none';
  renderHub(); $('hub').classList.add('show');
  renderEpNext(); embRender(); const _burn=npcHub(); const _ep=()=>{ if(SV.epNew&&EPS[SV.epNew-1]&&!BOT) setTimeout(()=>{ if(S&&S.phase==='hub'&&SV.epNew) epWin(SV.epNew-1,true); },700); };
  if(!SV.choice.C1&&!BOT) setTimeout(()=>choiceKeeper(),600);
  else if(_burn){ keeperSay(''); npcRise(_burn,()=>{ keeperSay(RISE_K[(SV.ep||0)>=4?1:0]); _ep(); }); }
  else { keeperSay(keeperLine()); _ep(); }
}

/* v2.50 저승 깊이 (기획자 11-18 20:44 2ㄴ) — 지역마다 파이널을 보내면 한 단계 더 깊은 곳이 열린다(최대 10). 깊을수록 괴수·보스가 세고 기억 조각이 많이 남는다.
   유물·불 키우기·레벨로 강해져도 키운 보람은 그대로 두고, 쉬우면 스스로 깊이를 올린다 */
const DEEP_MAX=15, deepF=d=>{ const x=Math.max(0,d-10), e=Math.min(d,10); return {mhp:(1+.35*e)*Math.pow(1.3,x),bhp:(1+.45*e)*Math.pow(1.4,x),dmg:1+.1*e+.15*x,sp:1+.06*e+.02*x,rw:1+.25*d}; }; // v2.55.1: 10까지는 그대로, 11~15는 보스 체력 ×1.4씩(최고 장비 계정도 60~80초)
// 내 힘(공격력×보스 피해÷공격 간격) ≈ 보스 체력 배수가 되는 깊이를 「맞는 깊이」로 권한다. 한 번 보낸 지역은 맞는 깊이까지 바로 열린다(강한 사람이 1단계씩 올라가는 수고 없이)
// v2.55.1 (67번 1장): 장비 힘도 넣는다 — 공격력×(1÷간격) + 세트 4개·전설 기술 몫. 깊이 상한 10 → 15
const gearPow=()=>{ try{ const G=gearBonus(), K=gearInfo(); return (1+(G.might||0))/Math.max(.4,1-(G.cd||0))*(K&&K.set4?GEARSK.set:1)*(K&&K.leg?GEARSK.leg:1); }catch(e){ return 1; } };
const GEARSK={set:1.25,leg:1.15};
const recDeep=()=>{ try{ const f=fireBonus(), P=(f.might||1)*(f.boss||1)/(f.cd||1)*gearPow(); return Math.max(0,Math.min(DEEP_MAX,P<=5.5?Math.round((P-1)/.45):10+Math.round(Math.log(P/5.5)/Math.log(1.4)))); }catch(e){ return 0; } };
const deepOpen=k=>Math.min(DEEP_MAX,Math.max((SV.deep&&SV.deep[k])||0,SV.cleared[k]?Math.max(1,recDeep()):0));
let DEEP_PICK=0;
function pickDeep(k){ const mx=deepOpen(k); if(BOT){ DEEP_PICK=+(new URLSearchParams(location.search).get('deep')||0); startRun(k); return; } if(!mx){ DEEP_PICK=0; startRun(k); return; }
  const L=[]; for(let d=mx;d>=0&&L.length<5;d--) L.push(d); if(!L.includes(0)) L[L.length-1]=0;
  const rd=Math.min(mx,recDeep()); if(rd>0&&!L.includes(rd)) L.splice(1,0,rd), L.length=Math.min(L.length,5); L.sort((a,b)=>b-a); if(!L.includes(0)) L[L.length-1]=0;
  const o={}; L.forEach((d,i)=>{ const f=deepF(d); o['abcde'[i]]=d?`🕳 저승 깊이 ${d}${d===mx?' · 가장 깊은 곳':''}${d===rd?' · <b style="color:#7ee08a">지금 내 힘에 맞음</b>':''}<br><small>괴수 체력 ×${f.mhp.toFixed(2)} · 보스 체력 ×${f.bhp.toFixed(2)} · 받는 피해 ×${f.dmg.toFixed(1)} · 기억 조각 +${Math.round((f.rw-1)*100)}%</small>`:'처음 깊이<br><small>보통 세기</small>'; });
  showChoice(FIELDS[k].name+' · 저승 깊이','파이널 보스를 보내면 한 단계 더 깊은 곳이 열린다.<br>깊을수록 세고, 많이 남는다.',o,c=>{ DEEP_PICK=L['abcde'.indexOf(c)]; startRun(k); },''); }
// v2.48 지역 이야기 6회차(61번 2장) — 1·2막 겉 이야기 · 대사는 모닥불·판 끝에서만. 차례대로만 열림
const EP_ORDER=['myeong','hongdae','seongsu','gyeong','gyeong','namsan'];
/* v2.55.2 (67번 4·5장) 이야기 창 · 지난 이야기 · 지금 회차 소년 대사
   설명하지 않고 겪게 한다 — 소년은 플레이어가 방금 겪은 일(커진 불·보낸 우두머리·검은 눈)만 짚는다. 1·2막 금지 목록 그대로 */
const EPS=[
  {t:'1화 · 불 꺼진 간판',L:['"방망이 소리가 그쳤네."','"봐. 불이 커졌어. 네가 벤 만큼."','"…또 나가야 해. 불은 금방 줄어."'],h:'하늘에서 빛 조각 하나가 서쪽으로 떨어진다.',k:['"불은 금방 줄어. 또 나가야 해."','"서쪽 골목이 시끄러워. 거기에도 우두머리가 있어."']},
  {t:'2화 · 우두머리가 있다',L:['"저승의 것들도 무리를 지어. 우두머리가 있지."','"큰 걸 보내면 불이 한꺼번에 솟아. …봤지?"','"비비는 백을 채우면 하늘로 오른대. 너희는 뭘 채워야 할까."'],h:'큰 비비가 삼키던 혼불이 한꺼번에 모닥불로 빨려 든다. 소년은 말이 없다.',k:['"큰 것일수록 불이 크게 솟아."','"강 건너 공장 골목에서 쇠 씹는 소리가 나."']},
  {t:'3화 · 처음 떨어진 게 아니야',L:['"이 돌, 처음 떨어진 게 아니야."','"불가사리도 이무기도 오래전 돌이 떨어졌을 때 생긴 원념이야."','"설화는 그걸 본 사람들의 기록이고."'],h:'강 위로 검은 눈이 잠깐 내린다.',k:['"검은 눈 봤지? 돌이 또 숨 쉬는 거야."','"궁궐 쪽이 조용해. 너무 조용해."']},
  {t:'4화 · 불은 무엇을 먹나',L:['"괴수를 베면 풀려난 혼이 이 불로 와. 불은 그걸 먹고 커져."','"네가 쓰러질 때마다 불이 줄어. 줄어든 만큼, 누군가 타."','"…남산의 저승 여왕이 우리 엄마야."'],h:'남산 탑 위의 하늘이 갈라진다.',k:['"네가 쓰러질 때마다 불이 줄어. …알지?"','"궁궐 돌 아래가 아직 따뜻해. 한 번 더 가."']},
  {t:'5화 · 돌 속의 왕',L:['"근정전 아래, 돌이 숨을 쉬어. 그 안에 누가 있어."','"돌 속에 왕이 있어. 남산의 불개도 그 왕이 보낸 거래."','"안 베면 불이 꺼져. 그뿐이야."'],h:'남산 탑의 안개가 걷힌다. 여왕의 자리가 열렸다.',k:['"안 베면 불이 꺼져. 그뿐이야."','"남산이 열렸어. …가."']},
  {t:'6화 · 남산으로',L:['"…돌아왔구나."','"불이 이렇게 크게 탄 건 처음이야."','(소년은 한참 동안 불만 본다)'],h:'여기까지가 1·2막 · 다음 이야기는 준비 중',k:['"불은 아직 배고파."','(소년은 불만 본다)']}];
function epAdvance(fk){ const e=SV.ep||0; if(e>=EP_ORDER.length||EP_ORDER[e]!==fk) return null; SV.ep=e+1; SV.epNew=e+1; save(); return EPS[e]; }
function epNextTxt(){ const e=SV.ep||0; if(e>=EP_ORDER.length) return '📖 다음 이야기는 준비 중'; const k=EP_ORDER[e]; return `📖 다음 이야기 — ${FIELDS[k]?FIELDS[k].name:k}의 파이널 보스`; }
function keeperLine(){
  const e=Math.min(SV.ep||0,EPS.length), nx=''; // 다음 갈 곳은 위쪽 「📖 다음 이야기」 줄이 맡음(같은 말 두 번 안 함)
  if((SV.runs||0)<1&&!e) return '"또 깨어났네. 불 옆에 있어."'+nx;
  if(e>=4){ const i=SV.k4|0; if(i<K4.length){ if(SV.k4r!==SV.runs){ SV.k4r=SV.runs; SV.k4=i+1; save(); return K4[i]; } return K4[Math.max(0,i-1)]; } if(SV.emb===0) return '"불이 다 줄었어. 이대로 나가면, 쓰러져도 못 일어나."'; }
  const L=e?[...EPS[e-1].k,...EPS[e-1].k]:['"명동 골목 끝에서 방망이 소리가 나. 거기부터야."','"명동 골목 끝에서 방망이 소리가 나. 거기부터야."'];
  L.push('"괴수를 베면 풀려난 혼이 이 불로 와. 불은 그걸 먹고 커져."','"불이 꺼지지 않게 해 줘."');
  if(SV.choice.C1==='c') L.push('"…따뜻하지?"'); if(SV.choice.C1==='a') L.push('"왜 너냐고 물었지. 나도 몰라."');
  if(SV.released>0) L.push('"그 두꺼비, 요즘 불 옆에 와서 자."');
  if(e>=2) L.push('"오래 머물면 저 원념이 너한테도 들러붙어."'); // v2.57 그림자 대사(65번 7장 블라인드 뒤 바꾼 줄)
  if(SV.cleared.myeong) L.push('"도깨비는 장난을 좋아했어. …나쁜 애는 아니었는데."');
  return L[Math.floor(Math.random()*L.length)]+nx;
}
// 종이장 이야기 창: 제목 → 소년 대사를 눌러 넘김 → 끝 장면 한 줄
{ const st=document.createElement('style'); st.textContent=`#epWin{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(4,3,8,.82)}#epWin.show{display:flex}
#epWin .pg{width:min(88vw,400px);min-height:250px;padding:22px 20px 18px;border-radius:6px;background:linear-gradient(#2a241c,#1d1913);border:2px solid #0e0b08;box-shadow:0 0 0 1px #4a3f30 inset,0 10px 30px rgba(0,0,0,.7);color:#eadfca;font-family:'Noto Serif KR',serif;position:relative;transform-origin:left center}
#epWin .pg.flip{animation:epFlip .1s ease-out}@keyframes epFlip{from{transform:perspective(600px) rotateY(-14deg);opacity:.6}to{transform:none;opacity:1}}
#epWin h3{margin:0 0 4px;color:#f4b740;font-size:17px;letter-spacing:.04em}#epWin .who{font-size:11.5px;opacity:.6;margin-bottom:14px}
#epWin .ln{font-size:15.5px;line-height:1.85;margin:6px 0;opacity:0;transition:opacity .5s}#epWin .ln.on{opacity:1}#epWin .end{margin-top:16px;font-size:13px;line-height:1.6;color:#b9a98c;font-style:italic;opacity:0;transition:opacity .8s}#epWin .end.on{opacity:1}
#epWin .tap{position:absolute;right:14px;bottom:8px;font-size:11px;opacity:.45}
#pEps .epi{background:rgba(255,255,255,.05);border:2px solid #140d14;border-radius:10px;padding:10px 12px;margin:6px 0;text-align:left;cursor:pointer}#pEps .epi b{color:#f4b740}#pEps .epi small{display:block;opacity:.65;margin-top:3px}#pEps .lock{opacity:.4;cursor:default}#pEps .npl{margin-top:6px;border-top:1px solid rgba(255,255,255,.1);padding-top:4px}#pEps .npl p{margin:5px 0;font-size:12.5px;line-height:1.5;opacity:.9}#pEps .npl i{display:inline-block;width:16px;color:#f4b740;font-style:normal;font-weight:800}
#epNext{width:min(94vw,440px);margin:-4px 0 8px;padding:7px 10px;border-radius:10px;background:rgba(244,183,64,.12);border:2px solid rgba(244,183,64,.45);color:#ffd98a;font-size:13.5px;font-weight:700;text-align:center;cursor:pointer}`; document.head.appendChild(st);
  const w=document.createElement('div'); w.id='epWin'; w.innerHTML='<div class="pg"><h3></h3><div class="who">모닥불지기</div><div class="bd"></div><div class="tap">눌러서 넘기기</div></div>'; document.body.appendChild(w); }
let EPW=null;
function epWin(i,isNew){ const E=EPS[i]; if(!E) return; const w=$('epWin'), pg=w.querySelector('.pg'); pg.querySelector('h3').textContent=E.t;
  const bd=pg.querySelector('.bd'); bd.innerHTML=E.L.map(t=>`<p class="ln">${t}</p>`).join('')+`<p class="end">${E.h}</p>`; const ps=[...bd.children]; let n=0;
  const step=()=>{ if(n<ps.length){ ps[n++].classList.add('on'); pg.classList.remove('flip'); void pg.offsetWidth; pg.classList.add('flip'); pg.querySelector('.tap').textContent=n<ps.length?'눌러서 넘기기':'눌러서 닫기'; } else close(); };
  const close=()=>{ w.classList.remove('show'); w.onclick=null; EPW=null; if(isNew){ SV.epNew=0; save(); } if(S&&S.phase==='hub'){ keeperSay(keeperLine()); renderEpNext(); } };
  EPW={i}; w.classList.add('show'); step(); w.onclick=step; DBG.epWin=(DBG.epWin||0)+1; }
function renderEpNext(){ let el=$('epNext'); if(!el){ el=document.createElement('div'); el.id='epNext'; hubBars().prepend(el); el.onclick=()=>epList(); }
  el.innerHTML=epNextTxt()+((SV.ep||0)||npcHeard().length?' <small style="opacity:.7;font-weight:400">· 📜 지난 이야기</small>':''); }
function epList(){ let p=$('pEps'); if(!p){ p=document.createElement('div'); p.className='panel'; p.id='pEps'; p.innerHTML='<h2>📜 지난 이야기</h2><div class="sub2">모닥불 옆에서 들은 이야기 · 눌러서 다시 읽기</div><div class="pw" id="epsList"></div><div class="btn big" id="epsX" style="margin-top:10px">닫기</div>'; document.body.appendChild(p); $('epsX').onclick=()=>p.classList.remove('show'); }
  const e=SV.ep||0; $('epsList').innerHTML=EPS.map((E,i)=>i<e?`<div class="epi" data-i="${i}"><b>${E.t}</b><small>${E.L[0]}</small></div>`:`<div class="epi lock"><b>${i+1}화 · ???</b><small>${i===e?epNextTxt():'아직 듣지 못했다'}</small></div>`).join('')+(e>=EPS.length?'<div class="epi lock"><b>다음 이야기는 준비 중</b></div>':'');
  // v2.63 (기획자 11-19 13:49 「ㄴ」): 모닥불 곁 사람들 — 들은 이야기만 다시 읽기(1·2막 화면에 이미 나온 줄만)
  { const H=npcHeard(), D=NPCD(); if(H.length) $('epsList').innerHTML+=`<div class="sub2" style="margin-top:12px">🔥 모닥불 곁 사람들 · 눌러서 들은 이야기 보기</div>`+H.map(N=>{ const h=Math.min(5,D.h[N.k]||0), gone=D.gone.includes(N.k);
      return `<div class="epi npi" data-k="${N.k}"><b>${N.n} · ${N.j} <span style="letter-spacing:1px;opacity:.8">${'●'.repeat(h)}${'○'.repeat(5-h)}</span></b><small>${gone?`🕯 ${N.it} · 먼저 갔다`:`이야기 ${h}/5`}</small><div class="npl" style="display:none">${N.L.slice(0,h).map((t,i)=>`<p><i>${i+1}</i> "${t}"</p>`).join('')}</div></div>`; }).join(''); }
  $('epsList').querySelectorAll('.npi').forEach(d=>d.onclick=()=>{ const l=d.querySelector('.npl'); l.style.display=l.style.display==='none'?'block':'none'; });
  $('epsList').querySelectorAll('.epi[data-i]').forEach(d=>d.onclick=()=>{ p.classList.remove('show'); epWin(+d.dataset.i,false); });
  openPanel(null); p.classList.add('show'); }
function keeperSay(t){ $('kSay').innerHTML=t; const nm=document.querySelector('#kBox .nm'); if(nm) nm.textContent='모닥불지기'; }
const NPCD=()=>{ const D=SV.npc&&typeof SV.npc==='object'?SV.npc:(SV.npc={}); for(const [k,v] of [['h',{}],['here',[]],['gone',[]],['t',{}]]) if(!D[k]) D[k]=v; return D; };
const npcOf=k=>NPCS.find(n=>n.k===k);
const npcHeard=()=>{ const D=NPCD(); return NPCS.filter(n=>(D.h[n.k]||0)>0); };
const RISE_K=['"…먼저 갔어."','"…먼저 갔어. 네가 쓰러졌을 때, 불이 많이 줄었거든."'];
function npcHub(){ const D=NPCD(), runs=SV.runs||0; let burned=null;
  if(D.burn){ D.burn=0; const c=NPCS.filter(n=>!D.gone.includes(n.k)&&(D.h[n.k]||0)>=5).sort((a,b)=>(D.here.includes(b.k)?1:0)-(D.here.includes(a.k)?1:0));
    if(c.length){ burned=c[0]; D.gone.push(burned.k); D.here=D.here.filter(k=>k!==burned.k); if(LGon()&&!SV.ledger.goneNpc.includes(burned.k)) SV.ledger.goneNpc.push(burned.k); } }
  if(D.r!==runs){ D.r=runs; if(runs<1) D.here=[]; else { const keep=D.here.filter(k=>!D.gone.includes(k)&&(D.h[k]||0)>=1).slice(0,2), av=NPCS.map(n=>n.k).filter(k=>!D.gone.includes(k)&&!keep.includes(k)), n=1+(Math.random()<.5?1:0);
      while(keep.length<n&&av.length) keep.push(av.splice(Math.floor(Math.random()*av.length),1)[0]); D.here=keep; } }
  save(); npcShow(); return burned; }
function npcShow(){ const D=NPCD(); for(const k in NPCG) NPCG[k].visible=false; if(!S||S.phase!=='hub') return;
  D.here.forEach((k,i)=>{ const g=NPCG[k], s2=NPC_SEAT[i]; if(!g||!s2) return; g.position.set(s2[0],0,s2[1]); g.userData.m.scale.x=s2[2]; g.userData.gm.scale.x=1; g.visible=true; });
  // v2.59.1(기획자 11-19 「이름표 누르는 것 말고 클릭하면 말하는 게 낫다」): 이름표 버튼 없음 → 사람을 직접 누른다(hubHits). 새 이야기가 있으면 머리 위 💬만.
  const row=$('npcRow'); if(row) row.style.display='none';
  const gone=D.gone.slice(-3).map(npcOf).filter(Boolean); let gi2=$('npcGone'); if(!gi2){ gi2=document.createElement('div'); gi2.id='npcGone'; hubBars().appendChild(gi2); }
  gi2.innerHTML=gone.map(N=>`<span title="${N.n}">🕯 ${N.it}</span>`).join(''); gi2.style.display=gone.length?'flex':'none'; HUBHIT.dirty=1; }
const HUB_CZ=.95, HUBHIT={dirty:1}; const _hv=new THREE.Vector3();
function hubBars(){ let b=$('hubBars'); if(!b){ b=document.createElement('div'); b.id='hubBars'; $('hub').appendChild(b); } return b; }
function hubHits(){ let L=$('hubHits'); if(!L){ L=document.createElement('div'); L.id='hubHits'; $('hub').appendChild(L); }
  const D=NPCD(), runs=SV.runs||0, list=[['keeper',keeper,1.32]].concat(D.here.filter(k=>NPCG[k]&&NPCG[k].visible).map(k=>[k,NPCG[k],1.12]));
  if(HUBHIT.dirty||L.children.length!==list.length){ HUBHIT.dirty=0; while(L.firstChild) L.removeChild(L.firstChild);
    for(const [k] of list){ const d=document.createElement('div'); d.className='npcHit'; d.dataset.k=k; if(k!=='keeper'){ const h=D.h[k]||0; if(D.t[k]!==runs&&h<5){ const q=document.createElement('i'); q.textContent='💬'; d.appendChild(q); } }
      d.onclick=e=>{ e.stopPropagation(); buzz&&buzz(15); if(k==='keeper'){ keeperSay(keeperLine()); } else npcTalk(k); d.classList.remove('tap'); void d.offsetWidth; d.classList.add('tap'); }; L.appendChild(d); } }
  const W=innerWidth, H=innerHeight; list.forEach(([k,g,h],i)=>{ const d=L.children[i]; if(!d) return; g.updateMatrixWorld(); _hv.set(g.position.x,0,g.position.z).project(camera); const x0=(_hv.x+1)/2*W, y0=(1-_hv.y)/2*H; _hv.set(g.position.x,h,g.position.z).project(camera); const y1=(1-_hv.y)/2*H, hh=Math.max(30,y0-y1), ww=hh*.62;
    d.style.cssText=`left:${(x0-ww/2)|0}px;top:${y1|0}px;width:${ww|0}px;height:${hh|0}px`; }); }
function npcTalk(k){ const D=NPCD(), N=npcOf(k); if(!N) return; const h=D.h[k]||0, runs=SV.runs||0; let i;
  if(D.t[k]!==runs&&h<5){ D.h[k]=h+1; D.t[k]=runs; D.b=k; i=h; save(); setTimeout(()=>toast(`💬 ${N.n}`,`다음 판: ${N.fd}`),300); } else i=Math.max(0,Math.min(4,(D.h[k]||1)-1));
  $('kSay').innerHTML=`"${N.L[i]}"`+(D.t[k]===runs&&i===h?'':' <small style="opacity:.6">(다음 판이 끝나면 또 이야기한다)</small>'); const nm=document.querySelector('#kBox .nm'); if(nm) nm.innerHTML=`${N.n} · ${N.j} <span style="opacity:.75;letter-spacing:1px">${'●'.repeat(D.h[k]||0)}${'○'.repeat(5-(D.h[k]||0))}</span>`; npcShow(); }
function npcRise(N,cb){ const h=NPCD().h[N.k]||5, T=Math.min(3,1+h*.4); let v=$('riseV'); if(!v){ v=document.createElement('div'); v.id='riseV'; document.body.appendChild(v); }
  v.innerHTML=`<div class="it">${N.it}</div>`; v.classList.add('show'); $('hub').classList.remove('show'); DBG.rise=(DBG.rise||0)+1;
  try{ sfx.boom(); }catch(e){} setTimeout(()=>v.querySelector('.it').classList.add('burn'),T*1000-1100);
  setTimeout(()=>{ v.classList.remove('show'); if(S&&S.phase==='hub') $('hub').classList.add('show'); cb&&cb(); },T*1000); }
/* 4화 뒤 불씨 칸(65번 2장): 칸 5개 · 판을 시작할 때마다 1칸 줄고, 판에서 벤 혼으로 채운다(250마리마다 1칸, 한 판에 2칸까지).
   0칸이 된 판은 화면이 좁아지고 체력이 초당 0.5%씩 줄며 다시 일어나기 없음(처음엔 약하게 — 67번 2장 · 65번 13장 7). 실시간 아님(판 수로만) */
const EMB_N=5, EMB_PER=250;
const K4=['"불이 줄었어. 네가 안 나가면 내일은 이만큼도 안 남아."','"불이 꺼지면 너도, 여기 앉은 사람들도 다시 못 일어나."','"정 들면 더 크게 타. 그래서 네가 더 오래 일어나 있을 수 있어."','"안 베면 불이 꺼져. 그뿐이야."'];
function embRender(){ if((SV.ep||0)>=4&&SV.emb==null){ SV.emb=EMB_N; save(); } let el=$('embBar'); if(SV.emb==null){ if(el) el.style.display='none'; return; }
  if(!el){ el=document.createElement('div'); el.id='embBar'; hubBars().appendChild(el); el.onclick=()=>toast('🔥 불씨',SV.emb?'판을 시작할 때마다 한 칸 줄고, 판에서 벤 혼 250마리마다 한 칸 찬다':'다 줄었다 · 이대로 나가면 쓰러져도 못 일어난다'); }
  const n=SV.emb; el.style.display='block'; el.innerHTML=`🔥 불씨 <b>${'▮'.repeat(n)}<span style="opacity:.25">${'▮'.repeat(EMB_N-n)}</span></b> <small>${n?'판마다 한 칸 줄고, 벤 혼으로 채운다':'다 줄었다 · 이대로 나가면 쓰러져도 못 일어난다'}</small>`; el.classList.toggle('low',n<=1); }
function choiceKeeper(){
  const F=FLOW[1];
  showChoice('모닥불지기',`불 옆의 소년이 고개를 든다.<br>"또 깨어났네. 여긴 이승과 저승 사이야."<br>${F.q}`,F.opts,k=>{
    record('C1',k);
    keeperSay(k==='a'?'"…돌이 고른 거야. 나도 몰라." <small>(소년이 불 쪽으로 눈을 돌린다)</small>':k==='b'?'"조각을 모아. 남산 꼭대기에서 빌면 돼. …그게 다야."':'"…" <small>(한참 뒤)</small> "따뜻하지? 이 불은 꺼지면 안 돼."');
    renderHub(); },'');
}
function renderHub(){
  $('hShards').textContent=SV.shards; const C=CHARS[SV.char], R=REGIONS[SV.region];
  $('hChar').textContent=C.short; $('hRegion').textContent=R.name;
  // v2.35 처음 하는 사람: 첫 판 전엔 「출발」만 → 한 판 뒤 불 키우기·장비·도감·말 → 두 판 뒤 전부
  const r=SV.runs||0, lv={hUp:1,hGear:1,hDex:1,hTalk:1,hCharB:2,hTree:2,hFlow:2,hMap:2,hDuel:2};
  for(const id in lv){ const e=$(id); if(e) e.style.display=(r>=lv[id]||(id==='hDuel'&&SV.duelOk))?'':'none'; }
  $('hubInfo').style.display=r>=2?'':'none';
}
function startRun(fk){ $('lvbar').classList.remove('show'); clearSpots(); if(typeof fk!=='string') fk=null; if(window.__reseed) window.__reseed();
  sndInit(); $('hub').classList.remove('show'); keeper.visible=false; hubToad.visible=false; for(const k in NPCG) NPCG[k].visible=false;
  if(WORLD&&!isLit(SV.region)) SV.region='namsan';
  clearWorld(); const R=REGIONS[fk?'myeong':SV.region]; setScene(fk?fk:WORLD?'world':R.scene); setChar(SV.char);
  S=newState(SV.char,fk?'myeong':SV.region); S.deep=fk?Math.max(0,Math.min(DEEP_MAX,(DEEP_PICK|0)||(BOT?+(new URLSearchParams(location.search).get('deep')||0):0))):0; DEEP_PICK=0; SV.carry=null; SV.found['w_'+CHARS[SV.char].start]=1; S._lgT0=0; if(LGon()) SV.ledger.runs++; save(); { const K=S.gk; if(K&&(K.set4||K.leg)) setTimeout(()=>{ if(S&&S.gk===K) toast((K.set4?`<span style="color:${GRADE[2].c}">● ${SETS[K.set4].sk}</span> `:'')+(K.leg?`<span style="color:${GRADE[4].c}">◆ ${LEGS[K.leg].sk}</span>`:''),'장비 기술이 켜졌다'); },2200); }
  if(upLv('startlv')){ for(let i=0;i<upLv('startlv');i++){ S.lv++; S.pendingLv++; } S.need=need(S.lv); }
  { const D=NPCD(), N=!FLAT&&D.b&&npcOf(D.b); if(N){ S.gb={...S.gb}; const f=N.fx; for(const q of ['speed','cd','magnet','armor']) if(f[q]) S.gb[q]=(S.gb[q]||0)+f[q]; if(f.hpM){ S.maxhp=Math.round(S.maxhp*(1+f.hpM)); S.hp=S.maxhp; } if(f.shard){ S.fb={...S.fb,shard:(S.fb.shard||1)*(1+f.shard)}; } S.npcB=N.k; D.b=null; save(); setTimeout(()=>{ if(S&&S.npcB===N.k) toast(`💬 ${N.n}의 이야기`,N.fd); },3200); } }
  if(!BOT){ const _mc=SV.char, _mt=monoNext(_mc); setTimeout(()=>{ if(S&&S.phase!=='hub'&&S.char===_mc) monoShow(_mt); },6500); }
  if(SV.emb!=null&&!FLAT){ SV.emb=Math.max(0,SV.emb-1); S.emb0=SV.emb===0; save(); if(S.emb0){ S.revive=0; S.noRise=1; const v=$('embV'); if(v) v.classList.add('on'); setTimeout(()=>{ if(S&&S.emb0) toast('🔥 불씨가 다 줄었다','쓰러지면 다시 일어날 수 없다 · 혼을 베어 채워야 한다'); },1500); } }
  { const v=$('embV'); if(v&&!S.emb0) v.classList.remove('on'); }
  if(S.W.shadow) shadowP.root.visible=true;
  const ST=fk?pickStartFire(fk):WORLD?SITES[SV.region]:{x:0,z:0}; player.root.position.set(ST.x+1.4,0,ST.z+1.8); player.look(0,1); camT.set(ST.x+1.4,0,ST.z+1.8); shadowP.root.position.set(ST.x+.4,0,ST.z+2.6); const P0=player.root.position;
  if(fk&&MY&&MY.zones){ const ZF=MY.zones.find(z=>!z.mid); if(ZF) ZF.key=finalOf(fk); }
  if(fk){ S.field=fk; S.lastFire=SV.region; S.zoneDone={}; S.fireCd=true; S.distLit=0; S.fLoot=0; S.fDone=0; S.emG=[]; MY.ring.visible=true; if(!DUEL_PICK){ roundStart(fk); fieldInherit(fk); lateJoin(fk); } }
  else if(WORLD){ S.lastFire=SV.region; S.zoneDone={}; S.fireCd=true; S.distLit=0; refreshSites(); for(const k in SITES) SITES[k].ring.visible=true; fogReveal(P0.x,P0.z,22); }
  renderSlots(); ['hud','slots'].forEach(i=>$(i).style.display=i==='slots'?'flex':'block'); $('btns').style.display='flex';
  $('hint').style.opacity=.85; setTimeout(()=>$('hint').style.opacity=0,4000); last=performance.now();
  toast(fk&&FIELDS[fk]?FIELDS[fk].name+(S.deep?` · 🕳 깊이 ${S.deep}`:''):R.name,S.carry==='tail'?'지녀 온 꼬리가 혼불이 된다':S.carry==='needle'?'지녀 온 쇠 바늘이 몸을 감싼다':S.heat?'불을 낮췄다 · '+'🔥'.repeat(S.heat):'');
  if(upLv('pclerk')){ joris.push({x:P0.x+1.6,z:P0.z+.4,t:0}); embersItems.push({x:P0.x-1.4,z:P0.z+.6,t:0}); }
  if(upLv('startw')&&!BOT){ const found=Object.keys(WEAPONS).filter(k=>SV.found['w_'+k]&&k!=='shadow'||k===CHARS[SV.char].start); if(found.length>1) openStartPick(found); }
  else if(upLv('pfire')){ const k=CHARS[SV.char].start; S.W[k]=Math.max(S.W[k]||1,2); renderSlots(); }
  if(DUEL_PICK) duelSetup();
}
// v2.27 (기획자 14:22): 필드 이어받기 — 그 필드에 아무도 없으면, 마지막까지 남았던 사람의 판(잡힌 보스·주운 불씨)과 레벨을 이어받는다
// GitHub 판: MQTT retained 'f/<필드>'에 필드 안 사람이 몇 초마다·나갈 때 덮어쓴다 · Claude 판(room)은 남길 곳이 없어 예전 그대로
const FIELD_KEEP=6*3600e3;
function fieldSnap(){ if(!MPF.fk||!S) return null; return {r:MPF.rd,bd:MPF.bd,bp:Object.entries(MPF.bp).slice(0,8),pk:[...pickedBy().keys()].slice(-40),l:S.lv|0,nm:MP.myNm||'',id:MP.me||'',t:Date.now()}; }
function fieldInherit(fk){ const R=MP.room; const st=DBG.fieldSt||(R&&R.fieldGet&&R.fieldGet(fk)); if(!st||typeof st!=='object'||typeof st.r!=='number') return 0; if(st.id&&st.id===MP.me) return 0;
  if(mpPeers().some(p=>p.presence&&p.presence.a==='f:'+fk)) return 0; // 사람이 있으면 그 사람 판을 따라간다(lateJoin·mpAdoptRound)
  if(!(Date.now()-(+st.t||0)<FIELD_KEEP)) return 0; if(st.r<MPF.rd) return 0;
  const bd=String(st.bd||'').slice(0,8);
  if(bd.includes('F')){ if(st.r>=MPF.rd){ newRound(Math.min(st.r+1,1e6)); } DBG.inherit='next'; return 0; } // 끝난 판이면 새 판(레벨은 처음부터)
  if(!bd&&(st.l|0)<=S.lv) return 0; // 이어받을 게 없다
  newRound(Math.min(st.r,1e6)); for(const c of bd) if(zoneById(c)&&!MPF.bd.includes(c)) MPF.bd+=c;
  if(Array.isArray(st.bp)) for(const e of st.bp) if(Array.isArray(e)&&Array.isArray(e[1])&&typeof e[1][0]==='number'&&typeof e[1][1]==='number'){ const Z=zoneById(String(e[0])); if(Z&&Math.hypot(e[1][0]-Z.x,e[1][1]-Z.z)<80) MPF.bp[Z.id]=[e[1][0],e[1][1]]; }
  if(Array.isArray(st.pk)) for(const id of st.pk.slice(0,40)) MPF.pkOld.add(String(id).slice(0,24));
  zonesRefresh(); dropsSync();
  const L=Math.max(1,Math.min(99,st.l|0)), nm=String(st.nm||'').replace(/[<>&"']/g,'').slice(0,10)||'누군가'; let up=0;
  if(L>S.lv){ up=L-S.lv; for(let i=0;i<up;i++){ S.lv++; S.pendingLv++; } S.need=need(S.lv); S.lateLv=L; }
  DBG.inherit={r:MPF.rd,bd:MPF.bd,l:L}; S.inherited=1;
  setTimeout(()=>{ if(S&&S.phase!=='over') toast(`🕯 ${nm}의 판을 이어받았다 — Lv${Math.max(L,S.lv)}`,`중간보스 ${midsN()}/3 잡힌 채로${up?` · 밀린 기술 ${up}개는 모닥불에서 몰아 고른다`:''}`); },900); return 1; }
// v2.17 (기획자 01:07): 판이 이미 돌고 있는 필드에 늦게 들어오면 — 그 필드 사람들의 평균 레벨로 시작(밀린 기술은 모닥불에서 몰아 고른다). 혼자면 Lv1
function lateJoin(fk){ const L=mpPeers().map(p=>p.presence).filter(pr=>pr&&pr.a==='f:'+fk&&pr.dk===fk&&pr.r===MPF.rd&&typeof pr.l==='number').map(pr=>Math.max(1,Math.min(99,pr.l|0)));
  if(DBG.lateL) L.push(...DBG.lateL); if(!L.length) return 0; const avg=Math.round(L.reduce((a,b)=>a+b,0)/L.length); if(avg<=S.lv) return 0;
  const n=avg-S.lv; for(let i=0;i<n;i++){ S.lv++; S.pendingLv++; } S.need=need(S.lv); S.lateLv=avg; DBG.lateJoin=avg;
  setTimeout(()=>{ if(S&&S.phase!=='over') toast(`👥 늦게 들어왔다 — Lv${avg}로 시작`,`함께 있는 ${L.length}명의 평균 레벨 · 밀린 기술 ${n}개는 모닥불에서 몰아 고른다`); },900); return avg; }
function openStartPick(found){ S.phase='lvup'; const def=CHARS[SV.char].start;
  const list=[def,...found.filter(k=>k!==def).sort(()=>Math.random()-.5).slice(0,upLv('card4')?4:3)];
  $('lvt').textContent='무엇을 들고 갈까'; $('lvmem').textContent='찾은 무기 중 하나를 들고 출발한다.'+(upLv('pfire')?' 소방관이 손질해 Lv2로 준다.':'');
  const box=$('cards'); box.innerHTML=''; $('bReroll').style.display='none'; $('bCampLater').style.display='none';
  for(const k of list){ const W=WEAPONS[k]; const d=document.createElement('div'); d.className='card'; d.innerHTML=`<div class="ic">${W.ic}</div><div><div class="tag">${k===def?'기본 무기':'찾은 무기 · '+W.kind}</div><b>${W.name}</b><span>${W.desc(1)}</span></div>`;
    d.onclick=()=>{ delete S.W[def]; S.W[k]=upLv('pfire')?2:1; if(k==='shadow') shadowP.root.visible=true; $('lvup').classList.remove('show'); renderSlots(); S.phase='play'; last=performance.now(); if(!lvKeep()) afterCard(); }; box.appendChild(d); }
  $('lvup').classList.add('show');
}
function shardsEarned(win){ const base=Math.floor((Math.floor(S.kills/8)+S.treasures*6+(S.bonus||0))*(1+.2*(S.heat||0))*(1+.25*(S.deep||0))*(S.fb?S.fb.shard:1)*TU('shard')); return win==='all'?base:win?base+50:Math.floor(base*(.5+.1*upLv('keep'))); }
const bossBlocks=()=>boss.alive&&!boss.dying;
function gameOver(quit=false){ if(S&&S.doom) doomEnd();
  if(S.phase==='over') return; lgTime(); if(!quit&&LGon()) SV.ledger.revives++; if(!quit&&!BOT) NPCD().burn=1; { const v=$('embV'); if(v) v.classList.remove('on'); } $('lvbar').classList.remove('show'); S.lvb=null; const rest=quit==='rest'; let _drp=0;
  if(FIELD&&S.emG&&S.emG.length){ const P=player.root.position; _drp=S.emG.length; S.emG.forEach((e,i)=>{ const a=i*2.1; MPF.dr.push([`${MPF.rd}d${MPF.tag}${MPF.dn++}`,Math.round((P.x+Math.cos(a)*1.2)*10)/10,Math.round((P.z+Math.sin(a)*1.2)*10)/10,e.g]); }); MPF.dr=MPF.dr.slice(-8); S.emG=[]; S.ember=0; lootHud(); } const _full=WORLD?(rest||(quit&&S.charm>0)):(quit&&!bossBlocks()); const _ln=(S.loot||[]).length, _ek=S.ember||0; let _gn=0; if(_full) _gn=emberConfirm(); else { S.loot=[]; S.ember=0; lootHud(); }
  let _eqLost=''; if(!quit&&WORLD&&Math.random()<(DBG.eqDrop??EQ_DROP)){ const sl=Object.keys(SV.eq).filter(k=>SV.bag.some(x=>x.id===SV.eq[k])); if(sl.length){ const k=sl[Math.floor(Math.random()*sl.length)], it=SV.bag.find(x=>x.id===SV.eq[k]); _eqLost=gTag(it); SV.bag.splice(SV.bag.indexOf(it),1); delete SV.eq[k]; DBG.eqLost=(DBG.eqLost||0)+1; } } const _mat=Math.round((Math.floor(S.kills/30)+(S.bossesW||0)*8)*(_full?1:.5)*(S.fb?S.fb.mat:1)); SV.mat+=_mat; const _mu=mastAdd(); S._gearLine=(_mu.length?`<br><small style="color:#33dcc8">숙련 상승: ${_mu.map(k=>WEAPONS[k].ic+' Lv'+mastLv(k)).join(' · ')}</small>`:'')+(_eqLost?`<br><small style="color:#ff6a6a">💔 쓰러지며 입고 있던 ${_eqLost}을(를) 잃었다</small>`:'')+(_drp?`<br><small style="color:#ff6a6a">🔥 불씨 덩어리 ${_drp}개를 그 자리에 흘렸다 · 남이 주울 수 있다</small>`:!_full&&_ek?`<br><small style="color:#ff6a6a">🔥 불씨 덩어리 ${_ek}개를 흘렸다</small>`:'')+`<br><small>🎒 장비 ${_full||S.gearGot?`<b>${S.gearGot||0}</b>개 내 것${!_full&&_ln?` · <b style="color:#ff6a6a">${_ln}개 흘림</b>`:''}`:_ln?`<b style="color:#ff6a6a">${_ln}개 흘림</b> (모닥불까지 못 갔다)`:'0개'} · 불씨 재료 +${_mat}</small>`; const full=WORLD?(rest||(quit&&S.charm>0)):(quit&&!bossBlocks()); S.phase='over'; if(!quit) sfx.die();
  if(WORLD){ if(!quit) SV.region=S.lastFire||'namsan'; fogSave(); fogPaint(); fogDirty=false; }
  if(SV.emb!=null){ const g=Math.min(2,Math.floor((S.kills||0)/EMB_PER)); SV.emb=Math.min(EMB_N,SV.emb+g); S._gearLine=(S._gearLine||'')+`<br><small style="color:#ffb060">불씨가 혼을 삼켰다 · 혼 ${S.kills||0} → 불씨 +${g} <span style="opacity:.7">(${'▮'.repeat(SV.emb)}${'▯'.repeat(EMB_N-SV.emb)})</span></small>`; }
  const got=shardsEarned(full?'all':false); SV.shards+=got; SV.runs++; saveBest(); save();
  $('rt').textContent=S.roundWon?'판 끝':rest?'모닥불에 닿았다':quit?'모닥불로 돌아왔다':'쓰러졌다';
  $('rline').textContent=S.roundWon==='won'?'파이널 보스를 보내고 불빛에 닿았다. 들고 온 것은 모두 내 것이 됐다. 다음 판은 처음(Lv1)부터 — 장비는 그대로다.':S.roundWon?'그것에게서 겨우 불빛으로 도망쳤다. 불씨는 꺼졌지만 조각은 지켰다. 다음 판은 처음(Lv1)부터.':rest?'불빛 곁에 앉아, 들고 온 기억 조각을 모두 맡겼다.':quit?(full?(WORLD?'귀환 부적이 불빛까지 데려다주었다. 조각은 그대로다.':'불빛을 따라 걸어 돌아왔다. 모은 조각은 그대로다.'):(WORLD?'불빛을 찾아 헤매다 겨우 돌아왔다. 조각을 절반 흘렸다.':'보스에게 쫓기며 겨우 빠져나왔다. 조각을 절반 흘렸다.')):'불이 꺼지듯, 다시 어둠. '+(FIELD?fName()+' 모닥불 곁에서':WORLD?REGIONS[SV.region].name+' 모닥불 곁에서':'모닥불 곁에서')+' 다시 눈을 뜬다.';
  const lost=Math.round((.5-.1*upLv('keep'))*100);
  $('rstat').innerHTML=statHtml()+`<br>기억 조각 <b>+${got}</b> <small>(${full?'모닥불에 닿으면 전부':'쓰러지면 '+lost+'% 흘림'})</small>`+(WORLD&&!FIELD?`<br><small>밝힌 땅 ${fogPct()}%</small>`:'')+(S._gearLine||''); $('bEndless').style.display='none'; setTimeout(()=>$('result').classList.add('show'),quit?0:900);
}
function bossDefeated(){ if(FIELD) return bossDefeatedF(); if(WORLD) return bossDefeatedW();
  S.bossDead=true; S.phase='over'; const first=!SV.cleared[S.region]; SV.cleared[S.region]=(SV.cleared[S.region]||0)+1;
  const after=()=>{ const got=shardsEarned(true); SV.shards+=got; SV.runs++; saveBest(); save();
    $('rt').textContent=boss.def.bye;
    $('rline').innerHTML=S.bossKey==='gumiho'?'모닥불지기: "…하나. 돌 조각이 남았어.<br>서울역 쪽에서 쇠 씹는 소리가 들려."':S.bossKey==='dokkaebi'?'모닥불지기: "셋. …방망이 소리가 그쳤네.<br>불이 또 커졌어."':'모닥불지기: "둘. 이제 지도가 조금 더 밝아졌어.<br>명동 골목에서 깡충거리는 소리가 들려."';
    let unlock=''; if(first&&S.region==='namsan') unlock='<br>새로 열림: <b>서울역 고가</b> · <b>알바생 서지우</b>'; if(first&&S.region==='seoulst') unlock='<br>새로 열림: <b>택시 기사 최만수</b> · <b>명동 골목</b>'; if(first&&S.region==='myeong') unlock='<br>불이 커졌다: <b>불 '+fireLv()+'단계</b>';
    $('rstat').innerHTML=statHtml()+`<br>기억 조각 <b>+${got}</b>${unlock}`; $('bEndless').style.display='inline-block'; $('result').classList.add('show');
    if(BOT) DBG.victory={t:S.t,lv:S.lv,kills:S.kills,hp:S.hp}; };
  if(BOT) after(); else setTimeout(()=>choiceRemains(after),600);
}
function saveBest(){ const b=SV.best; if(!b.t||S.t>b.t) b.t=S.t; if(!b.k||S.kills>b.k) b.k=S.kills; }
$('bAgain').onclick=()=>{ $('result').classList.remove('show'); enterHub(); };
$('bEndless').onclick=()=>{ $('result').classList.remove('show'); S.endless=true; S.phase='play'; last=performance.now(); toast('끝나지 않는 밤','얼마나 더 버틸 수 있을까'); };
// v2.56.2 시작 화면(67번 6-1): 검은 재가 천천히 내리고, 아래 모닥불에서 불씨 몇 개가 오른다. 시작 화면이 닫히면 멈춘다
(function(){ const c=$('tAsh'); if(!c||BOT) return; const g=c.getContext('2d'); let W=0,H=0,d=1; const rs=()=>{ d=Math.min(2,devicePixelRatio||1); W=c.width=innerWidth*d; H=c.height=innerHeight*d; }; rs(); addEventListener('resize',rs);
  const A=[]; for(let i=0;i<64;i++) A.push({x:Math.random(),y:Math.random(),v:.012+Math.random()*.03,s:.8+Math.random()*2.2,w:Math.random()*6.28,e:i<9});
  let last=performance.now(); const tick=t=>{ const ti=$('title'); if(!ti||!ti.classList.contains('show')){ g.clearRect(0,0,W,H); return; } const cap=GFX[gfxK()].idle; if(cap&&t-last<1000/cap-3){ requestAnimationFrame(tick); return; } const dt=Math.min(.1,(t-last)/1000); last=t; g.clearRect(0,0,W,H);
    for(const p of A){ p.w+=dt*.7; if(p.e){ p.y-=p.v*1.6*dt; p.x+=Math.sin(p.w*2)*.0006; if(p.y<.55){ p.y=.9+Math.random()*.04; p.x=.42+Math.random()*.16; } const a=Math.max(0,Math.min(1,(p.y-.55)/.25)); g.fillStyle=`rgba(255,${150+((p.w*40)|0)%60},70,${.75*a})`; g.beginPath(); g.arc(p.x*W,p.y*H,p.s*d*.7,0,6.28); g.fill(); }
      else { p.y+=p.v*dt; p.x+=Math.sin(p.w)*.0004; if(p.y>1.02){ p.y=-.02; p.x=Math.random(); } g.fillStyle=`rgba(20,18,24,${.55+.3*Math.sin(p.w)})`; g.fillRect(p.x*W,p.y*H,p.s*d,p.s*d*.7); g.fillStyle='rgba(120,110,120,.18)'; g.fillRect(p.x*W,p.y*H,p.s*d*.5,p.s*d*.4); } }
    requestAnimationFrame(tick); }; requestAnimationFrame(tick); })();
$('bStart').onclick=()=>{ sndInit(); $('title').classList.remove('show'); if(!SV.intro) story(); else enterHub(); };
$('title').addEventListener('click',e=>{ if(e.target.closest('.btn')) return; $('bStart').click(); }); // 화면 아무 데나 눌러도 시작
function story(){
  const ov=$('story'); ov.classList.add('show'); const ps=['s1','s2','s3','s4','s5'].map($); ps.forEach(p=>p.classList.remove('on'));
  let i=0, timer=null; const next=()=>{ if(i<ps.length){ ps[i++].classList.add('on'); timer=setTimeout(next,i<=2?1300:2100); } };
  next();
  ov.onclick=()=>{ if(i<ps.length){ clearTimeout(timer); while(i<ps.length) ps[i++].classList.add('on'); } else { ov.classList.remove('show'); ov.onclick=null; SV.intro=true; save(); enterHub(); } };
}

/* ============ 거점 화면: 업그레이드 · 지도 · 캐릭터 · 갈래도 ============ */
function openTune(){ let el=$('tunePanel'); if(!el){ el=document.createElement('div'); el.id='tunePanel'; el.className='ov'; document.body.appendChild(el); }
  const T=SV.tune||(SV.tune={});
  el.innerHTML=`<h2>🎛 조정 <small>시험용 · 내 기기에만</small></h2><div class="tsub">움직이면 바로 바뀐다(괴수·보스 체력은 새로 나오는 것부터). 마음에 드는 값이 되면 <b>값 복사</b> → Claude에게 붙여 넣기.</div>`+
   Object.entries(TUNE_DEF).map(([k,D])=>`<div class="trow"><span>${D.n}</span><b id="tv_${k}">${fmtTune(k,TU(k))}</b><input type="range" min="${D.min}" max="${D.max}" step="${D.st}" value="${TU(k)}" data-k="${k}"></div>`).join('')+
   `<div class="tbtns"><div class="btn" id="tCopy">📋 값 복사</div><div class="btn" id="tReset">처음 값</div><div class="btn big" id="tClose">닫기</div></div><textarea id="tOut" readonly style="display:none"></textarea>`;
  el.querySelectorAll('input[type=range]').forEach(r=>r.oninput=()=>{ const k=r.dataset.k; T[k]=+r.value; $('tv_'+k).textContent=fmtTune(k,T[k]); save(); });
  $('tReset').onclick=()=>{ SV.tune={}; save(); openTune(); };
  $('tClose').onclick=()=>el.classList.remove('show');
  $('tCopy').onclick=()=>{ const ch=Object.keys(TUNE_DEF).filter(k=>TU(k)!==TUNE_DEF[k].v); const txt=`조정 값 — 잔야 ${document.title.match(/v[\d.]+\w*/)?.[0]||''}\n`+(ch.length?ch.map(k=>`${TUNE_DEF[k].n} = ${fmtTune(k,TU(k))} (${k}=${TU(k)}, 처음 ${TUNE_DEF[k].v})`).join('\n'):'(바꾼 값 없음)');
    const o=$('tOut'); o.value=txt; o.style.display='block'; o.select(); try{ navigator.clipboard.writeText(txt).then(()=>toast('📋 복사했다','Claude에게 붙여 넣기')).catch(()=>toast('아래 글을 길게 눌러 복사','')); }catch(e){ toast('아래 글을 길게 눌러 복사',''); } };
  el.classList.add('show'); }
function fmtTune(k,v){ if(k==='bcv') return ['지금','쓰러지면 터짐','쌓이면 터짐'][Math.round(v)]||v; return k==='loot'?Math.round(v)+'초':'×'+(+v).toFixed(2).replace(/0$/,''); }
function openPanel(id){ ['pUp','pMap','pChar','pFlow','pTree','pGear'].forEach(p=>$(p).classList.toggle('show',p===id)); }

// v2.7 장비 창 · 강화 → v2.55: 강화 상한 없음 · 실패하면 깨져서 사라짐(깨지면 분해 값의 절반을 돌려받음) · +10부터 빛 조각
const enhCost=e=>2+e*2, matNeed=e=>1+Math.floor(e/3), ltNeed=e=>e>=9?1+Math.floor((e-9)/2):0;
const enhRate=e=>e<3?1:e<9?1-.05*(e-2):Math.max(.05,.64-.06*(e-9));
const RRL=2, RRM=4; // 덤 옵션 다시 뽑기: 빛 조각 2 + 불씨 재료 4
const optN=it=>it.on??(it.v?GRADE[it.g].x:it.g);
let ENH_ARM=null;
function gMsg(h){ const R=$('enhRes'); R.innerHTML=h; R.classList.remove('fl'); void R.offsetWidth; R.classList.add('fl'); }
function enhance(id,force){ const it=SV.bag.find(x=>x.id===id); if(!it) return; const c=enhCost(it.e), mk=SLOTMT[it.s], mn=matNeed(it.e), ln=ltNeed(it.e), p=enhRate(it.e);
  if(SV.mat<c){ gMsg('<span style="color:#ff6a6a">불씨 재료가 모자라다</span>'); return; }
  if((SV.mt[mk]||0)<mn){ gMsg(`<span style="color:#ff6a6a">${MTN[mk].ic} ${MTN[mk].n}이(가) 모자라다 · 가게를 뒤져 보자</span>`); return; }
  if((SV.lt||0)<ln){ gMsg(`<span style="color:#ff6a6a">✨ 빛 조각이 모자라다 · 장비를 분해하면 나온다</span>`); return; }
  if(p<.8&&it.e>=5&&!force&&!(ENH_ARM&&ENH_ARM.id===id&&performance.now()-ENH_ARM.t<2500)){ ENH_ARM={id,t:performance.now()}; renderGear(); gMsg(`<span style="color:#ffb060">깨질 확률 ${Math.round((1-p)*100)}% · 한 번 더 누르면 강화</span>`); return; }
  ENH_ARM=null; SV.mat-=c; SV.mt[mk]-=mn; SV.lt-=ln; let msg;
  if(Math.random()<p){ it.e++; msg=`<span style="color:#7ee08a">✨ 성공! ${gName(it)} +${it.e}</span>`; sfx.lvl(); buzz(30); }
  else if(it.e<5){ msg=`<span style="color:#ffb060">실패 · ${gName(it)} +${it.e} 그대로 (+5까지는 안 깨짐)</span>`; sfx.hurt(); buzz(40); }
  else { const nm=gName(it); for(const sl in SV.eq) if(SV.eq[sl]===it.id) delete SV.eq[sl]; SV.bag.splice(SV.bag.indexOf(it),1); const d=gDisApply(it,true); DBG.broke=(DBG.broke||0)+1;
    msg=`<span style="color:#ff6a6a">💥 ${nm}이(가) 깨져 사라졌다 · 재료 조금 돌려받음</span>`; sfx.hurt(); buzz(120); }
  save(); renderGear(); gMsg(msg); }
function gReroll(id){ const it=SV.bag.find(x=>x.id===id); if(!it) return; const n=optN(it); if(!n) return;
  if((SV.lt||0)<RRL||SV.mat<RRM){ gMsg(`<span style="color:#ff6a6a">✨ 빛 조각 ${RRL} · 불씨 재료 ${RRM}이 든다</span>`); return; }
  SV.lt-=RRL; SV.mat-=RRM; it.o=rollOpts(it.v?it.g:1,n); if(!it.on) it.on=n; save(); renderGear(); gMsg(`<span style="color:#9ad8ff">🎲 덤 옵션을 다시 뽑았다</span>`); sfx.lvl(); }
function gDismantle(id,force){ const it=SV.bag.find(x=>x.id===id); if(!it) return; if(it.lk){ gMsg('🔒 잠긴 장비 · 먼저 잠금을 푼다'); return; }
  if(gRank(it)>=2&&!force&&!(ENH_ARM&&ENH_ARM.id==='d'+id&&performance.now()-ENH_ARM.t<2500)){ ENH_ARM={id:'d'+id,t:performance.now()}; gMsg(`<span style="color:#ffb060">${gGr(it).n} 장비 · 한 번 더 누르면 분해</span>`); return; }
  ENH_ARM=null; const d=gDisApply(it); SV.bag.splice(SV.bag.indexOf(it),1); save(); renderGear(); gMsg(`분해 · 🔥${d.mat} ${MTN[SLOTMT[it.s]].ic}${d.mt}${d.lt?' ✨'+d.lt:''}`); }
// v2.56.4(67번 7장): 등급 골라 일괄 분해 · 🔒 잠금(잠긴 것·입은 것은 빼고, 가방 넘칠 때 자동 분해에서도 빠짐)
const gGi=it=>Math.max(0,Math.min(4,Math.floor(gRank(it))));
function bulkList(){ const eqs=new Set(Object.values(SV.eq)), G=SV.disG||(SV.disG=[1,1,0,0,0]); return SV.bag.filter(x=>!eqs.has(x.id)&&!x.lk&&G[gGi(x)]); }
function gLock(id){ const it=SV.bag.find(x=>x.id===id); if(!it) return; if(it.lk) delete it.lk; else it.lk=1; ENH_ARM=null; save(); renderGear(); gMsg(it.lk?`🔒 ${gName(it)} 잠금 · 분해되지 않는다`:`🔓 ${gName(it)} 잠금 풀림`); }
function bulkDis(){ const L=bulkList(); if(!L.length){ gMsg('고른 등급에 분해할 장비가 없다'); return; }
  if(!(ENH_ARM&&ENH_ARM.id==='bulk'&&performance.now()-ENH_ARM.t<4000)){ ENH_ARM={id:'bulk',t:performance.now()}; renderGear(); gMsg(`<span style="color:#ffb060">${L.length}개를 분해한다 · 한 번 더 누르면 분해</span>`); return; }
  ENH_ARM=null; let m=0,t=0,l=0; for(const it of L){ const d=gDisApply(it); m+=d.mat; t+=d.mt; l+=d.lt; SV.bag.splice(SV.bag.indexOf(it),1); }
  save(); renderGear(); sfx.lvl(); buzz(40); gMsg(`${L.length}개 분해 · 🔥${m} · 재료 ${t}${l?' · ✨'+l:''}`); }
function bulkHtml(){ const G=SV.disG||(SV.disG=[1,1,0,0,0]), n=bulkList().length, arm=ENH_ARM&&ENH_ARM.id==='bulk';
  return `<div class="gbulk"><span class="gbl">한꺼번에 분해</span>${GRADE.map((g,i)=>`<span class="gchip${G[i]?' on':''}" data-g="${i}" style="--c:${g.c}">${g.n}</span>`).join('')}<span class="btn gbulkb${arm?' arm':''}" id="gBulk">${arm?'정말?':'분해 '+n+'개'}</span><small>입은 것 · 🔒 잠긴 것은 빠진다</small></div>`; }
function gearSetHtml(){ const I=gearInfo(); let h=''; for(const f in I.setN){ const n=I.setN[f], S2=SETS[f]; h+=`<div class="gset" style="color:${GRADE[2].c}">${n>=4?'●':'○'} ${S2.n} <b>${Math.min(4,n)}/4</b> <small>2개 ${S2.d2}${n>=2?' ✓':''} · 4개 「${S2.sk}」${n>=4?' ✓':''}</small></div>`; }
  if(I.leg) h+=`<div class="gset" style="color:${GRADE[4].c}">◆ 전설 「${LEGS[I.leg].sk}」 켜짐</div>`; return h; }
function statLine(it){ return Object.entries(gStats(it)).filter(([k,v])=>Math.abs(v)>.0005).map(([k,v])=>fmtStat(k,v)).join(' · '); }
function renderGear(){ $('gMat').textContent=SV.mat; if($('gLt')) $('gLt').textContent=SV.lt||0; const G=gearBonus(); const sum=Object.entries(G).filter(([k,v])=>v>.0001).map(([k,v])=>fmtStat(k,v)).join(' · ');
  $('gearSum').innerHTML=(sum?`입은 것 합계: ${sum}`:'아직 입은 것이 없다 · 괴수가 남긴 <b>🔥 불씨</b>를 모닥불까지 들고 오면 장비가 된다')+gearSetHtml()+`<small>${Object.keys(MTN).map(k=>MTN[k].ic+'<b>'+(SV.mt[k]||0)+'</b>').join(' ')} · ✨ 빛 조각 <b>${SV.lt||0}</b></small><small style="opacity:.75">강화는 <b>+5까지 안 깨짐</b> · +6부터 실패하면 깨진다</small>`;
  const E=$('gearEq'); E.innerHTML='';
  for(const sl in SLOTN){ const it=eqItem(sl); const d=document.createElement('div'); d.className='gslot'+(it?' eqd':''); if(it) d.style.borderLeftColor=gGr(it).c;
    if(it){ const c=enhCost(it.e), p=enhRate(it.e), ln=ltNeed(it.e), arm=ENH_ARM&&ENH_ARM.id===it.id, fx2=gFx(it);
      d.innerHTML=`<div class="sn">${SLOTN[sl]}</div><div class="gin">${gTag(it)} <small>${gGr(it).n}${fx2?' · '+fx2:''}</small><small>${statLine(it)}</small><small style="color:#33dcc8">+${it.e+1} 성공 ${Math.round(p*100)}%${p<1?(it.e<5?` · <span style="color:#ffb060">실패 ${Math.round((1-p)*100)}% · 안 깨짐</span>`:` · <span style="color:#ff8a6a">깨짐 ${Math.round((1-p)*100)}%</span>`):''}</small></div>`;
      const bc=document.createElement('div'); bc.className='gbtns';
      const b=document.createElement('div'); b.className='btn genh'+(arm?' arm':''); b.innerHTML=arm?'정말?':`강화<small>${c}${gi('u_ember')}${matNeed(it.e)}${MTN[SLOTMT[sl]].ic}${ln?'✨'+ln:''}</small>`; b.onclick=()=>enhance(it.id); bc.appendChild(b);
      { const b4=document.createElement('div'); b4.className='btn glk'+(it.lk?' on':''); b4.textContent=it.lk?'🔒':'🔓'; b4.onclick=()=>gLock(it.id); d.querySelector('.sn').appendChild(b4); }
      if(optN(it)){ const b3=document.createElement('div'); b3.className='btn grr'; b3.innerHTML=`덤 다시<small>✨${RRL} 🔥${RRM}</small>`; b3.onclick=()=>gReroll(it.id); bc.appendChild(b3); }
      d.appendChild(bc); }
    else d.innerHTML=`<div class="sn">${SLOTN[sl]}</div><div class="gin" style="opacity:.45">비어 있음</div>`;
    E.appendChild(d); }
  const B=$('gearBag'); B.innerHTML=bulkHtml(); B.querySelectorAll('.gchip').forEach(c=>c.onclick=()=>{ const G=SV.disG; G[+c.dataset.g]=G[+c.dataset.g]?0:1; ENH_ARM=null; save(); renderGear(); }); $('gBulk').onclick=bulkDis; const eqs=new Set(Object.values(SV.eq)); const rest=SV.bag.filter(x=>!eqs.has(x.id)).sort((a,b)=>gRank(b)-gRank(a)||b.e-a.e);
  if(!rest.length) B.insertAdjacentHTML('beforeend','<div style="font-size:12px;opacity:.5;padding:8px">가방이 비었다</div>');
  for(const it of rest){ const d=document.createElement('div'); d.className='gslot'; d.style.borderLeftColor=gGr(it).c; const fx2=gFx(it), dd=gDis(it);
    d.innerHTML=`<div class="sn">${SLOTN[it.s]}</div><div class="gin">${gTag(it)} <small>${gGr(it).n}${fx2?' · '+fx2:''}</small><small>${statLine(it)}</small></div>`;
    const bc=document.createElement('div'); bc.className='gbtns';
    const b1=document.createElement('div'); b1.className='btn gwear'; b1.textContent='입기'; b1.onclick=()=>{ SV.eq[it.s]=it.id; ENH_ARM=null; save(); renderGear(); $('enhRes').textContent=''; };
    const b2=document.createElement('div'); b2.className='btn gdis'+(it.lk?' off':''); b2.innerHTML=it.lk?'잠김':`분해<small>🔥${dd.mat}${dd.lt?' ✨'+dd.lt:''}</small>`; b2.onclick=()=>gDismantle(it.id);
    const b4=document.createElement('div'); b4.className='btn glk'+(it.lk?' on':''); b4.textContent=it.lk?'🔒':'🔓'; b4.onclick=()=>gLock(it.id);
    bc.appendChild(b1); bc.appendChild(b2); d.querySelector('.sn').appendChild(b4); d.appendChild(bc); B.appendChild(d); } }
$('hGear').onclick=()=>{ ENH_ARM=null; renderGear(); $('enhRes').textContent=''; openPanel('pGear'); keeperSay('"불씨가 빚은 것들이구나. 불씨 재료에 가게에서 주운 실·가루·쇠를 먹이면 단단해져. 욕심내면 깨져 사라지기도 해."'); };
$('hTree').onclick=()=>{ renderTree(); openPanel('pTree'); keeperSay('"쥔 것을 끝까지 키우면, 다른 것과 섞이기도 해."'); };
function renderTree(){
  // v2.2 기술 나무: 무기 → 갈래(ㄱ/ㄴ) → 진화, 그리고 조합. 찾은 것만 보이고 나머지는 ???
  const f=SV.found||{}; let h='', got=0, tot=0; const cnt=v=>{ tot++; if(v) got++; return v; };
  { const ms=Object.keys(SV.mast||{}).filter(k=>WEAPONS[k]&&mastLv(k)>0); h+=`<div class="tr-sec">숙련도 · 판이 끝나도 남는다</div><div style="font-size:12px;opacity:.85;margin-bottom:8px;line-height:1.6">${ms.length?ms.map(k=>`${WEAPONS[k].ic} ${WEAPONS[k].name} <b>Lv${mastLv(k)}</b>`).join(' · ')+`<br>모든 공격 <b>+${(mastBonus()*100).toFixed(1)}%</b>로 시작`:'오래 쓴 무기일수록 숙련이 오른다 · 다음 판에 조금 더 세게 시작'}</div>`; }
  h+=`<div class="tr-sec">무기 · 갈래 · 진화</div>`;
  for(const k in WEAPONS){ const Wd=WEAPONS[k], w=cnt(f['w_'+k]||k==='axe'), B=BR[k], ev=EVOS[k];
    const ba=cnt(f['b_'+k+'a']), bb=cnt(f['b_'+k+'b']), e=cnt(f['e_'+k]);
    h+=`<div class="tr-row${w?'':' lk'}"><div class="tr-w"><span class="tr-ic">${w?Wd.ic:'?'}</span><b>${w?Wd.name:'???'}</b><small>${w?Wd.kind:''}</small></div>
      <div class="tr-br"><span class="${ba?'on':''}">ㄱ ${ba?B.a[0]:'🔒'}</span><span class="${bb?'on':''}">ㄴ ${bb?B.b[0]:'🔒'}</span></div>
      <div class="tr-ev${e?' on':''}">★ ${e?ev.name:(w?'🔒 각성 · '+PASSIVES[ev.need].ic+' 함께 · 5단계면 2차':'🔒')}</div></div>`; }
  h+=`<div class="tr-sec">조합 · 두 기술을 끝까지 키우면</div>`;
  for(const k in FUS){ const F=FUS[k], on=cnt(f['f_'+k]), ka=f['w_'+F.a]||F.a==='axe', kb=f['w_'+F.b]||F.b==='axe';
    h+=`<div class="tr-fu${on?' on':''}"><span class="tr-ic">${on?F.ic:'?'}</span><div><b>${on?F.name:'???'}</b><br><small>${ka?WEAPONS[F.a].ic+' '+WEAPONS[F.a].name:'???'} + ${kb?WEAPONS[F.b].ic+' '+WEAPONS[F.b].name:'???'}${on?' · '+F.desc:''}</small></div></div>`; }
  $('treeList').innerHTML=`<div class="tr-cnt">찾은 기술 <b>${got}</b> / ${tot}</div>`+h;
}
$('hUp').onclick=()=>{ renderUps(); openPanel('pUp'); keeperSay('"조각을 주면 불이 커져. 불이 크면 너도 강해져."'); };
$('hMap').onclick=()=>{ setMapMode('seoul'); renderMap(); openPanel('pMap'); };
$('hCharB').onclick=()=>{ renderChars(); openPanel('pChar'); };
$('hFlow').onclick=()=>{ renderFlow(); openPanel('pFlow'); };
$('hGo').onclick=()=>{ openPanel(null); if((SV.runs||0)<2&&!SV.cleared.myeong){ startRun('myeong'); return; }
  const nx=EP_ORDER[Math.min(EP_ORDER.length-1,SV.ep||0)], o={};
  FKEYS.forEach((k,i)=>{ const F=FIELDS[k], I=starInfo(k), tag=k===nx&&(SV.ep||0)<6?' · <b style="color:#f4b740">📖 다음 이야기</b>':'';
    o['abcde'[i]]=`${F.name}<br><small>${F.desc} · <span style="color:${I.c}">${'★'.repeat(I.st)} ${I.w}</span>${SV.cleared[k]?' · 보낸 적 있음':''}${deepOpen(k)?' · 🕳 깊이 '+deepOpen(k)+'까지':''}${tag}${mpHere('f:'+k)}</small>`; });
  showChoice('어디로 갈까','다섯 곳 모두 갈 수 있다. 이야기는 차례대로 열린다.',o,c=>pickDeep(FKEYS['abcde'.indexOf(c)]),''); };
$('hTalk').onclick=()=>keeperSay(keeperLine());
document.querySelectorAll('.pclose').forEach(b=>b.onclick=()=>openPanel(null));
let upTab='stat';
function renderRelics(L){ const c=relDrawCost(), n=Object.keys(RELICS).filter(id=>relLv(id)>0).length, all=Object.keys(RELICS).every(id=>relLv(id)>=REL_MAX);
  const top=document.createElement('div'); top.className='relTop';
  top.innerHTML=`<small>저승에 떠도는 옛 물건 — 불에 조각을 넣으면 하나가 떠오른다. 같은 것이 또 나오면 더 강해진다(최대 Lv${REL_MAX}).</small><div class="btn ${!all&&SV.shards>=c?'buy':'off'} relDraw">${all?'모두 다 모았다':`🏺 유물 꺼내기 · ${c} 조각`}</div><div class="relRes" id="relRes">모은 유물 <b>${n}</b> / ${Object.keys(RELICS).length}</div>`;
  top.querySelector('.relDraw').onclick=()=>{ const id=relDraw(); if(!id){ if(!all) $('relRes').innerHTML='<span style="color:#ff6a6a">조각이 모자라다</span>'; return; } const Rl=RELICS[id], l=relLv(id); sfx.lvl(); DBG.shake=.35; renderUps(); renderHub();
    const r=$('relRes'); if(r) r.innerHTML=`${Rl.ic} <b>${Rl.n}</b> ${l>1?`Lv${l-1} → <b>Lv${l}</b>`:'<b>새 유물!</b>'} · ${Rl.d(l)}`; const el=document.querySelector(`.relc[data-id="${id}"]`); if(el){ el.classList.add('pop'); } keeperSay(l>1?'"또 그거네. 불이 더 잘 먹어."':'"…이건 처음 보는 거야."'); };
  L.appendChild(top);
  const g=document.createElement('div'); g.className='relGrid';
  g.innerHTML=Object.entries(RELICS).map(([id,Rl])=>{ const l=relLv(id); return l?`<div class="relc${l>=REL_MAX?' mx':''}" data-id="${id}"><div class="ri">${Rl.ic}</div><b>${Rl.n}</b><span class="rl">Lv${l}${l>=REL_MAX?' 최대':''}</span><small>${Rl.d(l)}</small></div>`:`<div class="relc no" data-id="${id}"><div class="ri">？</div><b>？？？</b><small>아직 떠오르지 않았다</small></div>`; }).join('');
  L.appendChild(g); }
function renderAsh(L){ const a=SV.ash||0, ok=ashReady(), g=ashGain(), it=Object.keys(INF).reduce((s,k)=>s+infLv(k),0), d=document.createElement('div'); d.className='ashBox';
  d.innerHTML=`<div class="ashStar">✨ 잿별 <b>${a}</b>${SV.ashN?` <small>· 되살린 횟수 ${SV.ashN}</small>`:''}</div>
  <div class="ashNow">지금: 공격력 <b>+${Math.round(ASH.might*a*100)}%</b> · 기억 조각 <b>+${Math.round(ASH.shard*a*100)}%</b> · 최대 체력 <b>+${Math.round(ASH.hp*a*100)}%</b>${SV.ashN?`<br>능력치 칸 값 <b>×${Math.round(ashMul()*10)/10}</b>`:''}</div>
  <small>능력치 칸을 모두 최대로 올리면, 불을 꺼뜨리듯 낮췄다가 다시 피울 수 있다.<br>능력치 칸·끝없는 불이 처음으로 돌아가는 대신 <b>잿별</b>이 남는다 — 잿별은 사라지지 않는다.<br>되살릴 때마다 능력치 칸 값이 처음 값의 <b>+${Math.round((DBG.ashUp??ASH_UP)*100)}%</b>씩 비싸진다 — 다음 바퀴는 더 오래 걸린다. 유물·장비·기능 칸·지역은 그대로.</small>
  <div class="ashGain">받을 잿별 <b>+${g}</b> <small>(2 + 끝없는 불 ${it}단계 ÷ 3)</small></div>
  <div class="btn ${ok?'buy':'off'} ashBtn">${ok?'✨ 불 되살리기':'🔒 능력치 칸을 모두 최대로'}</div>`;
  d.querySelector('.ashBtn').onclick=()=>{ if(!ashReady()) return; openPanel(null); showChoice('불 되살리기',`불을 아주 작게 낮췄다가 다시 피운다.<br>능력치 칸과 끝없는 불이 처음으로 돌아간다.<br>잿별 <b>+${g}</b>은 영원히 남는다.<br><small>다음 바퀴 능력치 칸 값 <b>×${Math.round(ashMulN((SV.ashN||0)+1)*10)/10}</b> (처음 값 기준)</small>`,{a:`되살린다 — 잿별 +${g}`,b:'아직은 그만둔다'},c=>{ if(c==='a'){ const got=ashReset(); sfx.lvl(); DBG.shake=.8; renderHub(); upTab='ash'; renderUps(); openPanel('pUp'); keeperSay(`"…다시 붙었어. 재 속에 별이 ${got}개 남았네."`); } else { renderUps(); openPanel('pUp'); } },''); };
  L.appendChild(d); }
function renderUps(){
  $('upShards').textContent=SV.shards; const L=$('upList'); L.innerHTML=''; const fl=fireLv();
  const nextHint=fl>=5?'불이 가장 크다':!SV.cleared.namsan?'구미호를 보내면 커진다':!SV.cleared.seoulst?'불가사리를 보내면 커진다':!SV.cleared.myeong?'명동의 도깨비를 보내면 커진다':'새 모닥불에 불을 붙이면 커진다';
  const hd=document.createElement('div'); hd.className='firehd';
  hd.innerHTML=`<div class="fflame">${'🔥'.repeat(fl)}<span>${'·'.repeat(5-fl)}</span></div><b>불 ${fl}단계</b> · 능력치 최대 ${FIRE_CAP[fl-1]>9?'끝까지':FIRE_CAP[fl-1]+'칸'}<br><small>${nextHint} · 능력치를 하나 살 때마다 모든 값이 조금 오른다(기능 칸은 그대로)</small>`;
  L.appendChild(hd);
  // v2.18 탭: 능력치 · 유물 · 되살리기
  const tb=document.createElement('div'); tb.className='uptabs'; const TABS=[['stat','🔥 불 키우기'],['rel','🏺 유물'],['ash','✨ 되살리기']];
  tb.innerHTML=TABS.map(([k,n])=>`<span class="ut${upTab===k?' on':''}" data-t="${k}">${n}${k==='ash'&&ashReady()?' <i>!</i>':''}</span>`).join(''); tb.querySelectorAll('.ut').forEach(b=>b.onclick=()=>{ upTab=b.dataset.t; renderUps(); }); L.appendChild(tb);
  if(upTab==='rel'){ renderRelics(L); return; } if(upTab==='ash'){ renderAsh(L); return; }
  for(const g in UPG){ const G=UPG[g], open=fl>=G.req;
    const h=document.createElement('div'); h.className='ugh'; h.innerHTML=`${G.name}${open?'':` <small>🔒 불 ${G.req}단계</small>`}`; L.appendChild(h);
    if(!open) continue;
    for(const k in UPS){ const U=UPS[k]; if(U.g!==g) continue; const lv=upLv(k), mx=upMax(k), max=lv>=mx, full=lv>=U.max, cost=upCost(k);
      const d=document.createElement('div'); d.className='urow'+(max?' max':'');
      const dots='●'.repeat(Math.min(lv,U.max))+'○'.repeat(Math.max(0,mx-lv))+'<span class="lk">'+'◌'.repeat(Math.max(0,U.max-Math.max(mx,lv)))+'</span>';
      const inf=full&&INF[k], ic=inf?infCost(k):0, il=infLv(k);
      if(inf) d.className='urow inf';
      d.innerHTML=`<div><b>${U.name}</b> <span class="lvdots">${dots}</span>${il?` <span class="infb">∞+${il}</span>`:''}<br><span>${inf?`<b style="color:#ffb860">끝없는 불</b> · ${INF[k].n} / 단계`:U.desc}</span></div><div class="btn ${inf?(SV.shards>=ic?'buy':'off'):!max&&SV.shards>=cost?'buy':'off'}">${inf?ic+' 조각':full?'최대':max?'🔒 불':cost+' 조각'}</div>`;
      if(inf){ d.querySelector('.btn').onclick=()=>{ if(SV.shards<ic) return; SV.shards-=ic; (SV.inf||(SV.inf={}))[k]=il+1; SV.spent=(SV.spent||0)+ic; save(); sfx.lvl(); renderUps(); renderHub(); keeperSay('"불은 끝이 없어. 더 줘도 돼."'); DBG.shake=.3; }; L.appendChild(d); continue; }
      d.querySelector('.btn').onclick=()=>{ if(max||SV.shards<cost) return; SV.shards-=cost; SV.up[k]=lv+1; SV.spent=(SV.spent||0)+cost; if(U.g==='stat') SV.bought=(SV.bought||0)+1; save(); sfx.lvl(); renderUps(); renderHub(); keeperSay('"불이 조금 커졌어."'); DBG.shake=.3; };
      L.appendChild(d);
      if(k==='heat'&&lv>0){ const r=document.createElement('div'); r.className='heatrow'; r.innerHTML='출발할 단계: '+[0,1,2,3].filter(i=>i<=lv).map(i=>`<span class="hb${(SV.heat||0)===i?' on':''}" data-h="${i}">${i?'🔥'.repeat(i):'보통'}</span>`).join('');
        r.querySelectorAll('.hb').forEach(b=>b.onclick=()=>{ SV.heat=+b.dataset.h; save(); renderUps(); renderHub(); }); L.appendChild(r); }
    } }
}
// v2.2 지도: 실제 지형 위의 저승 지도 (글씨 없는 땅·강·큰길 + 명소 그림)
// 서울: OpenStreetMap(© OpenStreetMap contributors, ODbL) · 한반도: Natural Earth(공공 데이터)를 Claude가 단순화해 넣음
const MAPD={seoul:{"big": "M56 332L32 324L21 314M194 346L176 357L137 362L114 359L86 346M86 346L77 342M335 207L306 229L280 277L255 296M126 425L116 424L105 418M132 425L126 425M304 332L305 338M305 339L294 368M221 397L243 383L296 321L318 300L339 267L353 261L361 261L463 295L500 327L505 337L520 349M516 343L504 329L483 312L464 294L364 261L351 260L339 266L318 299L237 384M349 208L358 212M294 370L293 385L301 413M359 211L347 206M367 204L405 164M237 384L220 395M127 427L133 427M133 427L150 427L176 420M73 340L56 332M92 350L80 344M75 342L66 337M255 296L243 306L232 324L222 332M144 426L132 425M176 420L209 404M12 368L38 379L104 419M105 418L41 379L13 367M104 419L121 427M13 367L-18 354L-66 364M296 365L307 343M14 302L17 312L33 326L49 330L106 357L128 363L163 361M-21 262L-12 266L-5 272L11 292L14 302M258 295L282 276L306 231L335 209M216 335L205 340M209 404L218 399M-217 237L-187 264L-175 306L-155 342L-146 351L-100 369L-84 369L-20 355L-12 356L12 368M188 352L228 330L243 307L258 295M222 332L216 335M358 212L381 223M308 435L295 391L295 370M400 230L359 211M203 341L194 346M301 413L308 435M347 206L335 207M335 209L349 208M13 368L41 380L105 418M105 418L110 423M3 365L13 368M167 361L178 358L188 352M9 281L-10 262L-23 259M146 363L156 362M17 309L15 290L10 283M21 314L17 309M376 193L369 200M133 428L151 427L176 420M121 427L127 428M127 428L133 428M217 396L178 419L144 426M121 427L127 427", "mid": "M210 -2L229 -29M194 142L230 212M316 242L328 264M186 284L180 273M215 53L216 63M132 23L122 27M329 10L334 5M155 23L163 18M239 185L233 181M92 199L94 218M260 79L269 59M94 223L93 244M219 397L208 367M271 282L265 273M148 139L172 200M10 382L16 383M270 283L277 293M305 329L300 322M300 322L271 282M353 317L354 301L350 295M328 264L337 280M353 308L352 298L343 287M232 215L241 222L243 230M29 375L38 358M41 351L37 358M37 358L27 375M38 358L42 351M42 351L52 330M139 417L149 371M85 25L72 33M68 37L63 42M257 261L262 269M301 200L300 191M300 201L305 223M306 221L301 200M328 261L316 241M353 308L351 339M299 191L300 201M294 175L284 160M283 160L293 176M22 51L28 50M53 43L38 49M-5 63L22 51M63 42L53 43M231 212L196 141M196 141L191 131M181 114L188 120L191 129M363 372L352 343M-2 430L4 419M4 419L15 393M337 279L328 261M341 286L352 298L353 308M277 86L298 83M297 238L278 277M3 419L-2 430M15 393L17 387M14 392L3 419M19 383L14 392M305 332L309 350M313 362L306 331M266 50L295 40M183 107L177 106M163 18L169 37M272 87L257 90M86 141L86 131M87 124L85 131M86 131L87 124M277 86L270 83M85 131L85 140M245 301L236 311M197 341L222 329M222 329L236 313M-19 132L9 130M269 57L266 50M336 4L356 -13M362 13L379 11M349 17L332 23M350 17L362 13M295 39L265 49M295 40L322 29M265 49L256 50M332 27L350 35M115 55L97 56M214 76L192 77M192 78L204 77M192 77L169 78M169 55L148 55M166 236L166 247M94 22L85 24M135 24L147 25M148 25L135 23M150 79L169 79M135 430L133 438M-64 331L9 282M38 49L28 50M21 50L-5 63M312 437L320 434M301 435L312 437M237 188L234 202M266 131L273 143M298 83L322 82M297 185L299 191M352 342L353 308M350 297L352 318M216 64L216 70M235 22L247 24L257 37M257 90L241 94M214 102L194 107M331 24L349 18M363 35L379 34M186 284L188 308M262 269L257 261M241 220L235 214M234 202L235 216M175 106L169 107M144 111L134 116M150 56L169 56M130 80L147 80M260 80L257 90M260 80L271 84M147 79L130 79M103 130L113 111M22 273L27 269M188 308L194 317M190 341L196 341M236 313L245 301M235 313L222 329M115 432L124 441L135 443M367 385L378 412M330 414L321 391M169 87L175 106M169 78L147 79M343 287L337 279M337 280L341 286M23 380L16 382M-15 378L-9 380M4 206L-1 214M-19 231L0 214M194 107L187 107M33 380L51 389L62 405M320 392L327 407M-10 436L-16 427M190 54L202 54M98 124L97 118M167 257L172 263M172 263L180 273M243 230L241 222L232 214M96 3L92 -22M101 21L96 3M228 163L235 156L251 122M233 181L237 188M190 339L183 339M102 216L108 245M132 443L123 440L115 431M77 415L90 421L102 422L115 432M320 434L313 436M92 249L88 257L78 262M0 214L5 206M104 144L104 138M126 123L109 132M133 336L148 342L161 341M102 149L98 168M132 91L140 102M247 241L241 220M169 107L150 110M122 86L122 58M172 200L169 224M169 224L173 200M173 200L150 137M233 181L224 171L228 163M98 124L97 116M175 106L180 114M180 113L176 106M51 329L41 351M183 107L177 106M96 114L92 108M248 246L255 257M265 274L270 283M252 251L247 241M96 116L98 127M31 265L19 271M10 281L22 273M3 286L-64 331M18 275L10 280M19 271L31 265M22 373L-12 359M14 371L33 380M244 441L255 435M124 56L145 56M166 236L169 224M101 98L108 96M52 119L44 127M164 18L181 15M233 431L229 423M227 418L225 412M237 437L232 429M255 293L245 301M314 367L316 380M320 386L316 376M265 430L255 435M90 179L92 199M28 129L41 129M20 176L24 168M33 144L43 130M32 144L24 166M28 128L9 129M18 178L14 187M14 187L9 197M9 197L5 204M23 200L36 186M74 238L94 218M99 198L99 171M166 247L167 257M74 263L63 264M58 265L37 267M85 140L71 147L58 159M85 142L90 179M45 43L69 73M122 27L122 49M73 34L85 25M25 19L36 32M-1 214L-18 228M97 116L83 92M234 51L234 40M212 53L190 54M190 54L169 55M209 -2L211 10M169 56L169 66M265 49L257 37M322 82L330 84M279 153L273 143M256 120L266 131M62 405L77 415M16 382L10 382M25 380L29 375M10 382L-1 381M17 387L21 382M335 429L339 440M331 417L335 429M316 380L320 391M342 445L336 428M316 376L314 365M336 428L333 422M327 407L331 417M333 422L330 414M235 214L239 188M351 343L363 372M232 430L237 437M231 426L225 410M277 293L300 323M99 202L101 208M103 214L101 206M351 34L332 26M352 35L363 35M167 340L174 340M324 433L331 430M197 340L190 339M183 340L190 341M224 411L230 426M221 403L224 411M255 257L252 251M101 261L96 267M110 117L103 127M148 371L138 418M98 168L97 177M97 177L99 198M101 160L103 147M101 206L99 198M169 79L169 87M101 136L101 146M150 129L148 120M123 48L122 27M99 168L101 160M-9 380L0 382M0 382L10 382M-1 381L-15 377M108 245L107 252M105 255L101 261M109 245L103 215M89 276L82 286M96 267L89 276M94 271L103 259M86 281L94 271M82 287L86 281M79 290L69 302M69 305L76 294M76 294L82 287M69 305L91 321L133 336M116 108L121 91M109 132L103 131M110 133L127 123M69 90L64 99M73 82L69 90M65 99L70 90M57 114L64 100M59 117L52 119M43 130L52 120M52 120L60 118M44 127L28 128M115 56L122 56M122 59L122 73M90 63L77 78M97 56L90 63M88 65L97 58M11 281L21 275M-92 372L-17 359L11 370M33 380L22 373M29 271L23 274M94 218L86 141M39 260L46 257M46 257L52 253M267 285L259 290M169 68L169 78M207 367L219 397M219 397L221 403M379 34L353 34M379 10L362 12M170 45L169 55M191 131L194 142M191 129L189 119L181 114M268 59L261 76M206 20L212 23M191 14L206 20M122 27L133 24M82 92L95 114M78 78L88 65M256 78L237 74M127 123L135 117M134 116L126 123M177 107L183 108M145 112L169 108M150 110L144 111M187 108L194 108M170 37L163 18M170 79L192 78M176 106L170 87M194 108L218 101M233 96L221 100M269 83L260 79M38 49L53 43M53 43L63 43M28 50L38 49M28 50L21 50M63 43L68 37M114 25L121 28M13 2L18 10M1 -15L4 -7M7 -4L13 2M121 91L116 107M122 27L109 24M69 73L75 80M76 81L79 87M249 119L239 118L237 99M250 111L257 90M222 329L197 340M170 87L170 68M170 67L170 56M101 56L115 56M364 375L367 385M273 427L288 427L301 435M310 436L293 429M255 293L277 278L297 238M138 439L137 423M138 418L135 430M68 304L54 323M305 223L316 242M316 241L306 221M170 55L170 45M170 45L170 37M359 14L350 17M63 101L59 109M59 109L54 116M66 114L71 110M80 108L83 115M211 10L213 18M41 129L32 144M122 49L122 55M122 73L122 86M22 201L7 204M12 203L23 200M196 325L207 367M208 367L196 325M56 161L37 184M5 205L20 176M36 185L22 201M59 160L71 147L86 141M38 184L59 160M292 428L275 426M18 10L23 16M36 32L45 43M181 15L191 14M109 24L102 23M102 24L109 25M85 25L100 23M342 85L348 86M348 86L331 84M359 89L348 86M361 91L371 97M371 96L361 90M202 54L209 53M227 52L233 52M177 339L183 340M137 423L139 417M5 -7L1 -16M37 32L5 -7M46 43L37 32M83 92L76 80M27 269L3 286M237 218L246 242M53 51L46 43M74 78L70 73M70 73L63 64M63 64L55 54M247 241L243 230M243 230L246 242M237 437L233 431M70 90L75 81M108 96L117 92M83 115L87 121M9 129L-19 131M9 130L28 129M23 167L18 178M24 168L33 144M-12 74L-9 68M-9 67L-13 74M297 183L295 177M330 23L330 12M329 10L329 22M322 29L295 39M322 29L328 26M218 101L234 97M236 87L235 78M236 75L260 80M234 74L216 75M226 51L215 52M234 32L235 22M235 0L234 -10M228 -28L209 -2M251 50L243 50M243 50L234 51M248 51L254 51M255 51L263 51M217 80L218 96M222 76L234 75M215 23L235 22M115 431L102 422L90 421L73 413L63 405M167 339L161 341M146 55L124 55M-10 436L-6 444M278 277L267 285M63 405L51 389L33 380M65 42L69 37M68 36L63 42M63 42L57 43M100 22L94 22M-9 68L-5 63M191 13L181 15M206 20L191 13M212 23L206 20M55 324L69 305M232 51L226 51M174 56L190 54M309 350L312 363M204 77L217 76M213 18L210 -2M149 371L150 349M149 348L148 371", "han": "M-45 232L-30 257L-13 263L7 285L13 314L17 324L23 329L44 335L102 365L130 371L165 369L188 356L191 357L190 359L199 356L192 356L199 353L200 347L229 330L244 307L280 280L304 235L319 221L338 219L366 222L405 236L408 273L394 269L384 265L378 260L366 256L349 257L337 262L324 274L312 292L257 351L247 356L243 367L239 368L228 378L211 385L185 412L171 417L158 415L147 419L132 419L107 417L95 413L70 401L66 396L43 380L-20 350L-29 336L-48 316Z", "namsan": "M147 153L145 158L152 168L156 187L168 192L176 191L183 197L188 211L204 215L211 220L215 221L219 220L232 207L226 201L226 197L230 192L233 199L229 201L229 203L233 201L233 205L234 201L235 186L223 173L223 168L227 163L226 160L222 161L219 155L224 150L223 147L227 145L230 146L229 154L232 157L234 156L235 152L231 151L233 145L235 145L234 142L243 137L240 138L239 134L237 134L235 137L231 138L223 135L224 132L214 124L211 128L213 136L209 136L212 152L211 156L207 158L207 153L210 153L209 148L206 146L202 151L200 149L202 144L195 138L196 141L195 140L194 142L188 120L181 115L177 126L172 126L173 134L172 137L165 135L163 131L164 130L156 136L151 131L149 142L147 142L148 135L145 136L145 134L142 142L145 143L143 146L150 149L147 153Z", "wood": "M245 168L247 171L246 178L252 180L244 184L238 184L227 174L231 170L238 173L245 168ZM245 185L242 188L245 189L245 196L239 194L242 210L255 209L258 219L261 219L262 223L258 220L255 227L256 231L254 228L253 233L256 235L253 236L258 236L259 239L259 244L254 246L255 249L259 247L263 245L263 241L267 242L265 237L267 235L269 238L268 235L274 234L274 231L268 224L266 213L278 201L279 196L268 193L268 187L273 181L267 182L264 188L266 191L260 196L251 191L249 184L245 185ZM274 181L280 183L282 172L284 172L296 161L305 160L305 155L301 152L301 147L299 151L295 150L294 153L290 155L291 160L288 164L285 160L283 161L285 165L274 181ZM348 145L344 145L351 153L353 160L353 154L357 153L358 148L364 150L365 144L370 140L368 139L348 145Z", "rail": "M95 218L94 254L80 271M-9 362L29 320M30 320L-6 364M28 319L50 298M313 365L346 456M86 268L86 257M78 277L86 268M96 182L96 216M73 279L59 292M47 302L28 319M73 279L93 256L96 218M51 319L42 313L31 318M95 159L95 168M92 157L94 176M29 320L59 291M-6 364L-29 374M317 218L336 202L372 182L398 152L403 139L399 113M317 218L303 230M303 230L276 281L243 305L228 327L202 340L150 344L98 325L68 329L55 325M-12 113L11 107L26 104M55 100L78 100L91 110M35 103L55 100M35 104L27 105M93 132L95 124M61 292L49 306L53 323M-45 183L32 227L63 237M95 135L95 149M92 135L92 157M95 149L95 157M78 245L61 237M89 147L89 158M89 159L94 215L70 238L32 228L-45 184M47 -77L122 62L122 89L102 140M104 177L101 140"},korea:{"W": 360, "H": 546.1, "korea": "M201.3 240.3L212.3 265.4L224.4 283.4L230.2 289.9L230.6 293.4L232.1 294.2L233.7 299L241.3 310.8L243.3 318.7L245.4 321.7L244.7 324.6L247.2 339.7L245.1 345.7L246.1 352.2L245.8 356.7L243.6 361.1L243.4 367.5L245.4 373L243.3 375.9L246.3 378.4L250.5 373.7L251.9 377.2L249.7 381.3L248.2 391.3L245.9 397.2L246.9 399.1L246.4 403.6L244.7 405.8L243 402.6L242.7 403.6L243.8 405.6L242.4 406.9L242.7 409.2L241.9 410.5L242.5 412L238.7 414L238.2 417.6L235.6 422.4L232.6 422.7L232.9 424.6L231.8 425.7L230.2 424.2L228.5 427.4L227.5 426.6L227.6 428.2L225.9 427.9L225.8 423.4L224.2 426.3L223.6 426.3L223.4 424.2L222.7 426.3L219 426.2L218.5 424.8L217.7 426.4L216.3 425.1L215.2 425.5L215 423.1L214.3 424.5L212.6 422.7L211.8 423.1L211.1 419.4L210.1 421.2L212.1 427L213.2 427.4L211.2 427.6L210.2 426L206 425.4L206.1 426.7L202.3 428L201.6 429.9L206.4 427.9L206.5 430.8L203.6 431.5L204.5 432.7L204.1 436.3L205.3 435.6L205.8 436.3L204.2 438.8L202.1 439L202.1 438.2L203.4 437.8L200.3 437.3L199.6 436L201 435.3L200.1 433.4L198.7 435.4L195.5 433.9L194.8 436.3L192 436.3L191.1 434.6L188.5 434.2L189.1 426.3L187.2 428.7L186.2 428.8L187 430.7L186.5 431L184.3 431.7L183.1 429.6L182.6 432.6L181.7 433.4L175.6 432.7L174.6 431.1L174.2 433.7L172.2 435.5L171.4 435.9L169.3 433.4L168.6 435.1L169.7 438.1L172 440.5L173.8 438.9L176.9 438.5L175.5 445L174.1 445.5L172 444.7L170.7 446.4L171.3 450.7L168 448.3L169 443.9L167 440.7L166.4 436.4L164.9 439L159.9 439.8L162.4 441.1L159.6 443.2L161.2 443.4L161.6 446.3L164.1 448.3L165 449.7L163.5 449.7L165.3 450.4L165.7 452.1L163.5 452.9L161.1 451.5L159.3 452.3L159.6 454L163 454.7L160.3 457.6L158.4 458.2L159 459.7L157.9 459.7L154.1 454.4L152 455.4L152.2 456.1L150 454.7L150.2 453.5L153.7 449.7L152.8 452.9L155 452.5L155.6 450L154.8 447.9L156.2 446.1L157.8 448.9L159.6 446.4L158.5 444.2L156.9 445.2L155.1 442.8L153.1 446.8L150.5 447L145.3 450.9L144.6 454.7L142.3 457.1L142.4 459.2L140.5 459.5L140.6 461.2L137 459.4L136.8 453.2L135.6 452.3L134.7 453.8L135.1 455.6L133.9 456.1L135 457.9L132.8 459.5L133.5 460.4L132 460.2L131.7 461.4L129.7 462.3L128.4 467.3L125 467.7L125.3 465.2L123.3 464.8L124.9 461.4L123.1 460.4L123.5 458.4L122.7 458.3L123.7 456.4L125.9 456.1L124.7 455.1L125.8 453.5L119.6 455.1L117.8 452.4L116.9 453.2L115.7 452.2L115.9 451.1L116.8 451.1L114.7 449.4L115.5 443.7L116.7 443.8L118.2 446.4L117.7 447.5L118.8 451.1L122.7 452.4L123 451.5L121.4 451.2L120.5 450L120.7 448.8L119.4 449.7L119.1 445.8L122 446L122.2 447.9L125.6 450.4L124.9 449L129.3 450L126.4 448.3L124.5 445.4L118.5 443.8L122.5 442.2L125.6 443.9L126 441.3L129.9 441.7L129.6 441.1L131 440.7L127.3 440L127.8 436.7L126.9 435.8L125.9 436.7L126.1 438.5L124.7 442L123.6 441.8L124.2 440.7L123.6 440.4L118.9 441.6L121 436.3L119.9 433.1L121.5 431.6L118.8 432.2L118.5 434.4L116.5 433.9L117.1 433.5L115.9 432L117.9 432L117.8 430.9L118.9 429.7L116.7 426.2L115.9 425.9L116.3 427.1L115.4 427.8L114 424.1L115.4 423.3L116.5 424.5L117.6 422.3L117.7 425.5L120.5 427.4L121 429.6L122.2 425.3L118.8 421.5L118.5 418L116.2 418.3L119.1 417.3L118.2 416.9L120.5 411.2L122.4 412.5L120.8 409.9L123.8 403L128 402.1L130.1 400.5L132.1 402.5L131.2 399.7L124.7 400.3L122.6 399L122.8 397L128.2 393.1L129.5 389.9L130.8 388.9L133.8 389L135.8 390.7L136.2 389L132.6 386L133.6 385.2L136.4 385.3L138.1 383.7L137 382.7L133.8 384.1L128.8 383.8L128.6 381.7L125.2 381.2L125 379.6L134.3 378.6L139.5 374.8L132.1 378.1L129.6 374.1L130.1 373.6L127.8 371.2L126.3 371.2L125.3 370L123.9 371.2L124 369.7L125.4 368.9L128.4 369.1L125.6 366.5L127.6 362.6L124.7 361.1L127.6 359.5L125 358.5L124.1 356L129 353.2L126.6 353.2L125.1 354.9L124 354.5L123.5 352L124.7 350.3L122.9 349.7L122.4 346.8L124.6 346.4L125 345.2L123.5 344L124.5 342.9L123.1 342L123.2 340.4L124.2 340.3L123.3 338.8L121.6 340.5L121.8 344.6L121 346.2L118.6 345L119.1 341.2L118.8 339.6L117.6 339.2L116.9 341.3L115.9 341.4L117.6 346L115.7 347.5L116 344.8L114.7 342.7L114.8 340.3L112.9 342.1L110.8 342.7L109.9 341.2L111.9 341L112.3 339.9L110 338.1L108.9 341.1L108.8 338.1L110.3 335.2L111.1 337.1L112.3 337.1L111.4 335.6L113.4 335.2L111.7 334.9L112.3 333.1L111.4 331.6L113.1 330.6L113 332.2L114.8 332.1L115.3 327.6L116.2 327.3L116.8 331.7L115.1 335.9L115.5 336.6L117 335.8L118.2 336.7L117 333.6L117.5 333.1L118.6 334.2L120.2 333.1L119.1 332L120.1 331.8L120.8 329.6L118.1 327.9L119 326.9L117.3 326.3L118.1 325.6L121.9 325.4L121.3 327.6L121.6 328.4L122.8 327.8L123.2 328.9L122.7 332.6L123.5 333.9L124.9 328.3L127.6 330.9L126.6 328.6L123.9 325.7L124.4 325.2L125.8 326.8L127.1 326.8L124.6 324.7L124.2 322.7L129.4 325.8L129.6 330.2L130.3 327.4L131.7 325.8L134.8 326.5L136.4 327.9L135.8 331.3L137.1 329.9L137.8 330.3L138.6 336.7L137.8 337.4L138.7 338.5L139.5 335.9L139.2 334.5L140.9 334.9L139 332.4L144.4 329.8L145.1 328.1L144.6 327.3L146.6 325.9L144.1 326.6L143.5 329.1L141.2 329.3L137.6 325.4L140 325.2L139.5 324.4L141.1 324.8L140 321.9L140.3 320.5L139.5 320.8L138.6 323.6L134.7 323L135.1 319.4L139.2 317.7L139.2 316.2L137.8 317.2L136.6 315.8L133 318.8L131.8 318.7L132.7 316.9L131.1 317.1L131 316.4L133.2 314.4L131.6 314.1L130.7 312.2L135.2 312.2L135.8 314L137.3 311.2L139.5 311.5L132 308.1L133.1 305.4L131 305.1L129.9 306.4L128.9 305.6L129.9 303.8L128.1 302.5L128.1 300.8L130.1 299.1L128.3 299L128.4 296.7L126.6 293.7L125.6 285.2L130.8 285.8L130.8 290.3L134.7 292.1L131.5 289.5L132.4 286.6L131.8 283.9L132.4 282L131.1 282.1L131 276.3L135 274.2L138.5 268.8L141.5 266L143.7 261.6L148.6 258L151.3 256.9L160.4 256.3L164.4 257.5L176 256L178 257.6L187.9 257.1L193.3 254.4L196.5 250.7L197.8 247.6L197.8 242.4L201.3 240.3ZM120.2 352.9L121.3 356.7L118.5 356.5L119.1 354.6L117.6 355.1L118.5 353.2L117 353.3L116.5 347.5L117.6 346.4L118.9 347L119.1 350.9L120.2 352.2L119.3 352.5L120.2 352.9ZM113.6 282.9L117.6 284L116.6 285.5L112.7 285.6L113.6 282.9ZM142.9 511.2L138.2 519.3L130 521.7L128.6 523L117.2 523.1L114.6 525.2L110.5 521.5L110.1 519.8L111.6 516.4L116.3 511.2L123.5 508.3L136.2 506L140.6 508.4L142 511.2L142.6 510.5L142.9 511.2ZM153.3 457.5L155 458.7L154.3 460.5L151.8 461.2L149.7 460.1L150 458.2L153.3 457.5ZM119.2 457.7L117.8 461.6L116.2 460.8L116.1 462L112.1 464.3L109.4 464.5L109.8 462.7L108.6 461.9L108.6 463L107.7 462L108.2 460.2L110.6 458.7L112.8 455.4L114.6 455.7L113.7 452.9L116.8 455.1L117.9 454.4L119.2 457.7ZM177.2 447.2L178.7 450.7L177.4 452.7L175.3 450.3L176.6 448.1L176.4 445.7L177.8 445.6L177.2 447.2ZM189.3 440.9L188.5 446.4L185.2 446.3L183.6 442.8L181.7 445.7L180.5 444.7L179.1 437.5L180.9 434.6L182.8 433.9L183.7 435.1L182.3 437.5L182.9 439.2L184.6 440.7L187.4 440L189.3 440.9ZM217 436.5L216.6 439.1L216 438.9L216.9 441.6L214.6 440.7L213.4 443.4L214.9 444.4L210.4 446.1L211.8 445L211 444.2L211.2 442.8L209.9 443.5L209.4 442L210.7 441.6L211.2 439.2L208.1 440.7L206.4 437.5L207.9 435.9L209.9 435.3L212.9 436.3L211.5 433L214.9 431.3L214.4 430.3L215.3 428.9L216.2 429.6L216.6 434L215.8 437.1L217 436.5ZM107.8 428L105.8 427.4L106.3 425.2L108.8 423.1L110.3 423.1L108.7 424.3L109.4 426.3L107.8 428ZM124.8 297.5L127.6 299.8L121.8 303.5L118.6 302.3L118.2 301.1L123.9 298.9L124.8 297.5ZM307.1 297.4L306.1 301.2L304.2 301.4L302.5 300L302.3 298.9L303.4 297.6L307.1 297.4ZM124.1 294.3L123.1 293.5L120.4 294L118.8 292.4L120.7 291.3L118.6 287.4L118.9 283.8L120.3 282.5L124.8 285.3L125.9 292.4L124.1 294.3ZM51.5 274.7L50.8 275.8L48.7 275.5L49.9 276.6L49 277.3L46.1 275.9L46.5 274.1L49.9 273.7L51.5 274.7ZM189.4 438.9L185.7 439.1L184.7 438L186.9 435L186.8 437.5L188.1 436.2L189.4 438.9ZM132.8 462.5L135.2 467.9L132 467.3L132.2 466.3L130.1 465.4L130.2 462.9L131.2 462.1L132.8 462.5ZM134.8 463L135.8 460.7L137.5 460L139.1 462.5L137.6 462.3L135.5 464.5L134.8 463Z", "north": "M201.3 240.3L197.6 243L197.8 247.6L195.5 252.1L187.9 257.1L178 257.6L176 256L164.4 257.5L160.4 256.3L148.6 258L143.7 261.6L141.5 266L135 274.2L131 276.3L131.1 282.1L128 284.9L121.5 281L119.9 278.7L110.8 281.4L109.6 282.6L110 287.1L108 286.7L107 283.5L106 283.4L105.8 279.9L104 280.7L101.8 277.7L101.1 278.2L102.9 282.4L100.2 281.2L95.4 275.6L95.1 273.4L86.8 271.4L86 272.6L86.8 273.5L90 274.2L90.1 275.5L91.8 275.5L91 277L92.7 277L90.4 278.4L88.2 277L88.6 280.6L87.9 281.6L88.7 282.4L87.3 283.2L87.7 285.4L85.7 284.2L84 285L83.9 283.8L81.7 287.2L78 288L76.4 290.1L77.1 285.6L80.5 284.9L77.7 284.5L78.2 283.8L80.9 282.4L83.8 282.6L83.9 281.3L81.9 280.5L83.2 278.6L79.6 277.7L79.9 278.4L77.9 278.7L80.5 281.3L76.5 280.2L77.7 281.3L74.8 283.1L72 282.4L74.8 279.5L72.8 276.6L69.4 280L62.6 278L62.6 276.2L61.2 277L61.7 275.5L64.6 274.2L69.3 274.6L69.4 273.7L66.8 272.9L66.5 271.2L70.4 270.5L72.3 272L73 269L67.9 267.9L62.6 269.8L57.3 266.1L56.5 267.4L53.5 267.9L48.3 266.5L54.7 263.3L56.1 261.1L58.8 263.1L61.8 261.1L58.6 261L56.8 259.5L57.1 254.9L59.9 249.4L60.9 248.8L60.9 249.9L62.7 246.9L61.4 242L63.6 242L64.5 243.2L66.3 241.9L67.4 242.6L67.2 238.1L68.5 239.9L69.5 239.7L69.5 237.9L74.5 238.6L77.3 236.6L80.4 237L81.2 235.9L83.1 237L83.6 238.8L84.6 237.4L87.3 239.9L89.3 239.9L83.9 235.2L81.9 234.8L80.6 232.2L79.1 233.4L80 234.4L79.4 234.8L76.2 235.4L74.5 234.5L74.8 235.9L73.6 236.1L72.1 234.8L73.1 233.4L72 231.4L71.4 231.3L71 234.2L69.9 234.3L67.7 230.9L70.3 221.3L73.3 216.3L75.9 216.2L73.8 215.8L74 212.5L76.3 211.7L76.3 209.4L79.1 209.3L78.4 207.6L80.5 204.2L79.3 203.7L78.8 201.4L81.1 200.3L76.8 199.6L77.9 197.4L76.2 197.8L80.8 190.5L73.9 193.2L70.8 190.5L71.4 189.5L68.6 189.5L69.2 190.9L66.9 190.8L66.1 188.9L64 188.8L60.3 185.8L59.5 186.6L58 185.8L57.2 183.6L52.6 181.6L51.6 179.4L51.5 186.7L49.4 187.1L47.1 189.5L46 187.5L47.5 183.9L44.9 182.6L44 177.8L38 177.2L37.1 175.1L34 172.6L36 171.2L37.5 166.6L41.4 166.9L37.7 166.1L36 162.9L44.3 154.8L50.2 151.7L51.4 148.6L53.8 147.3L57.7 142.6L59.4 144.1L63.8 143.8L62.7 141.3L63.1 140L72.7 135.7L74.2 134L79.2 134.9L79.4 133L80.8 132.7L81.5 130.6L84.7 129.9L85.7 126.8L87.3 128.1L90.3 127.7L88.8 125.5L93.6 121.5L96.1 122.4L98.7 120.9L100.8 122L103.8 120.8L102.6 120.1L105.3 118.4L107.8 115L109.2 112.5L108.6 111.6L114.8 107.5L121.7 97.2L123 96.3L124.2 96.3L123.6 97.4L125.1 97L124.2 92.7L127.3 86L126.9 83.3L129 80.6L133.6 78.7L131.6 76.9L133.5 76.8L136.1 79L136.9 77.2L141.9 73.5L142.6 75.3L146.6 77.1L148 79.8L146.9 79.9L147.3 81.7L152.3 84.8L149.2 87.3L150.4 88.1L152.3 88.4L153.4 86.9L156.5 87.6L156 89L157.5 89.5L167.3 89.7L168 91.5L171.2 93L172.2 92.1L180 92.9L181.3 91.3L183.9 90.8L185.1 91.9L186.3 90.8L186.8 93.8L188.3 93.4L188.9 95.1L190.5 94.5L190.5 95.6L192.3 95.8L198.7 84.9L196.6 80.9L192.8 78.1L190 71.3L188.2 70.2L187.1 64.8L187.6 63.3L197 61.3L207 63.2L216 60.5L225.1 61.2L226.1 58.4L228.7 57.7L230.3 54.9L232.5 55.2L236.3 51.5L235.1 50.2L237 47.4L235.6 46.3L237.4 46L237.4 43.4L240.2 42.6L241.1 40.6L242.2 40.9L241.7 39.6L243.6 40.5L245.5 39.9L249.7 43.6L251.9 41.4L252.1 39.5L256.7 39.8L257.7 38L258.1 32.3L259.2 31.2L258.3 30L260.2 27.5L258.9 24.4L262.8 12.5L265.1 11.8L264 10.7L266.2 10.1L269.3 12.6L274 11.5L274.4 12.6L273.1 14.6L278.9 15.6L279.6 17.5L279 24L279.8 25.8L286.7 31.5L287.7 34.2L288.3 31.5L290.3 31.5L292.8 39.6L295.7 42L296.4 46.2L297.9 47.5L293.7 49.2L293.6 47.4L290.1 45.4L287.2 46.8L285.8 46L284.9 47.7L285.6 50.3L284.2 49.6L284.3 50.8L281.7 53.4L282 51.5L281.1 50.6L277.3 53.9L277.2 57.7L275.6 59.2L272 58.9L270.4 63.2L269.6 62.3L268.2 63.9L269.1 65L267.5 68.3L264.7 68L262.9 75.4L261.2 74.7L259.6 75.6L258.3 79.6L256.2 81.4L254.4 86.7L254.9 91.1L260.9 95.8L259 100.1L257 109.1L257.7 116.6L259.2 118.4L257.2 124.2L251.2 123.9L249 126.3L242.1 128.9L240.1 132.7L238.8 130.9L237.2 131L234.7 138.2L230.8 143.2L226.6 143.9L221.8 148.5L212.5 151.6L211.7 153.8L213.8 155.4L213.7 157.5L212.2 158.6L210.6 158.2L204.2 162.6L201.3 162.9L199.8 166.6L197.1 164L195.6 165.1L195.9 166.5L192.6 167.2L186.5 165.7L183.7 169.4L182.3 168.9L181 173.7L177.2 174.1L177.7 175.1L173.6 176L172.3 178.2L170.6 176.9L165.7 183L166 186.4L167.7 187.1L168.6 189.3L166.4 193.7L168.1 203.9L166.4 203.9L167.3 201L165.3 197.8L160.5 200.7L164.4 202.3L161 202.6L160.2 207.9L161.1 210L163.5 211.8L165.2 210.3L166.8 212.9L169.9 212.6L172.8 214.3L176.2 214.4L181.6 222.6L182.7 222.4L186.8 228L190 228.8L194.9 234.8L197.9 233.4L200.6 236.5L201.3 240.3ZM58.9 189.1L59.3 191.6L54.6 194.5L56.2 192.8L55.6 192.3L57.1 188.4L58.9 189.1Z", "other": "M231.6 543.1L229.5 545L229.6 540.3L226.7 538.4L229.8 536.7L229.6 533.5L231.1 534.4L232.1 526.9L232.1 536.5L234.6 535.3L235.2 536.4L231.7 539.9L231.6 543.1ZM243.1 526.7L241.8 526.2L242.1 524.4L244.4 525.4L243.2 524.3L244.8 523.2L245.9 517.3L249.2 516.3L249.3 514.4L250.6 514L250.8 516.4L248 522.7L243.1 526.7ZM239.9 474.2L236.7 478.4L234.7 477.5L236.2 465.8L236.9 467.7L239.2 466.1L240.5 468.4L241.9 468L239.9 474.2ZM242.6 461.8L243.9 461.5L244.5 464.6L241.8 467.3L240.2 466L241.9 465.9L241.9 464.4L240.2 465.1L240.4 462.9L239.4 465L237.1 464.4L238.9 463.4L238.7 460.4L240.4 458.9L239 458.8L241.1 455L239.5 453.2L241 449.1L243.2 449.2L246.8 446.3L247.8 449.7L246.3 450.6L247.4 451.7L242.6 461.8ZM289.7 30.9L287.8 32.3L287.7 34.2L286.7 31.5L279.8 25.8L278.9 15.6L273.1 14.6L274 11.5L268.8 12.5L266.2 10.1L264 10.7L265.1 11.8L262.8 12.5L259.1 23.8L260.2 27.5L258.3 30L259.2 31.2L256.7 39.8L252.1 39.5L249.7 43.6L245.5 39.9L241.7 39.6L242.2 40.9L237.4 43.4L237.4 46L235.6 46.3L237 47.4L235.1 50.2L236.3 51.5L226.1 58.4L225.1 61.2L216 60.5L207 63.2L197 61.3L187.6 63.3L188.2 70.2L190 71.3L192.8 78.1L196.6 80.9L198.7 84.9L192.3 95.8L186.8 93.8L186.3 90.8L181.3 91.3L180 92.9L171.2 93L167.3 89.7L157.5 89.5L156 89L156.5 87.6L153.4 86.9L150.4 88.1L149.2 87.3L152.3 84.8L147.3 81.7L146.9 79.9L148 79.8L146.6 77.1L142.6 75.3L141.9 73.5L136.1 79L131.6 76.9L133.6 78.7L129 80.6L126.9 83.3L127.3 86L124.2 92.7L125.1 97L121.7 97.2L114.8 107.5L108.6 111.6L107.8 115L102.6 120.1L103.8 120.8L93.6 121.5L88.8 125.5L90.3 127.7L85.7 126.8L84.7 129.9L81.5 130.6L79.2 134.9L74.2 134L63.1 140L63.8 143.8L59.4 144.1L57.7 142.6L51.4 148.6L50.2 151.7L44.3 154.8L35.5 163.4L35.6 167.4L32.9 171.5L25.6 176.8L11.3 177.6L5.9 174.4L6.5 172.3L3.8 179.4L0 178.9L0 0L338.6 0L337.1 1.6L339.1 1.3L338.6 2.7L333.6 8.5L333.7 10.7L331 10.5L330.9 13.5L326.6 13.4L326.9 17.2L329.9 17.2L326 19.4L324.9 22.4L321.6 22.2L320.1 25.9L321.2 27.2L318.7 30.8L320 32.1L319.2 34.1L317.3 32.8L317.8 31.2L315.6 30.6L315.3 28L305.8 31.5L302.7 29.7L307.5 30.5L308.3 28.7L301.5 28.7L303.4 27.6L303.1 26.3L298.8 26.3L296.1 28.1L299.3 30.7L299.2 32.6L301 31.7L305.1 35.3L303.8 35.7L303.7 38.2L301.5 38.8L298.1 47.5L296.4 46.2L295.7 42L293.3 40.3L289.7 30.9ZM304.4 18.4L310 18.4L302.7 17.7L304.4 18.4ZM286.4 531L279 525.7L274.2 529.3L278.2 536.9L276.8 540.1L273.3 542.1L276.3 543.9L281.7 542.1L284.2 546.1L257.9 545.8L253.7 537.9L255.8 530.7L259 533.1L258.3 536.1L259.3 534.7L261.7 536.7L261 540.1L260.1 538.4L260.5 542.2L262.6 544.1L264.1 542.1L269.1 543.7L266.1 539.3L266.7 534.8L264.1 532.3L261.7 533.3L260.6 531.6L258.5 532.2L259 528.3L257.7 529.2L257 527.1L256.7 529.7L255.2 530.3L256 528.1L254.6 525.6L250.4 523.8L252.1 520.7L251.6 516.1L254.3 516.6L255.4 514.7L256.6 517.1L261 517.3L262.8 520.9L263.5 514.7L260.2 511.7L261.5 510.2L263.6 512.4L262.2 508.7L262.9 506.6L266.6 507.7L266.5 510.4L269.7 512.2L271.3 509.6L275.9 507.6L272.8 505.5L277.6 500.7L281 505.5L285.1 503.9L285.5 500.5L283.4 501.9L280.9 499.8L283.3 500.8L287.4 497.9L288.4 495.6L287.6 493.5L289.2 490.7L300.3 486.1L306.8 488.8L310.6 484.9L308.8 492.8L310.6 492.9L310.7 496.4L314.6 502.8L325.6 505.4L327.6 505.1L331.9 500.1L338 500.6L340.5 505.1L340.9 510.2L339.6 514.1L336.8 513.7L335 517.3L331.3 516.5L331.5 521.3L344.4 522.8L347.7 521.6L343.8 528.9L348.1 529.1L346.3 530.7L346.8 531.7L349.3 530.8L350.7 532.4L351.6 530.8L352.1 532.9L348.8 533.1L347.7 536.5L350 538.5L355.2 539.1L351 541.4L351.7 542.4L349.9 544.7L351.9 544.8L351 546.1L293.9 546.1L287.2 539.6L286.4 531ZM257.4 499L254.3 495L256 495.7L254.8 492.8L256.1 489.9L259.3 491.3L260.6 494.3L260 496.9L258 496.9L257.4 499ZM353.4 494.9L355 491.8L356.2 492L355.8 489.8L345.6 483.2L344.5 484.9L342.6 484.7L344.4 481.7L341 480.1L334.9 481.1L334.3 483.9L330.3 481.4L328.6 484.2L326.6 483.9L326.5 481L324.1 485.1L321 487.1L319.3 485.7L317.7 486.8L314.6 481.5L311.8 480.6L306.9 487.6L305.4 486.4L306.7 480.3L304.6 477.2L307.2 473.5L305 468.4L306.2 464.5L311.7 463.1L307.6 462.3L309.4 460.1L310.7 461.6L315.9 461.5L317.5 463.8L317.4 460.5L320.8 460.1L322 461.7L319.8 461.2L319 463.7L327.5 460.8L329.2 455.8L332.5 453.4L333.4 450.8L335 450.7L335 448.5L345.9 445.6L346.5 443.2L360 430.4L360 484.3L357.3 486.3L358.4 491.4L353.4 494.9ZM343.1 10.7L342.5 8.2L345.9 8.5L344.5 7.1L348.5 9.2L346.9 12.6L341.7 11L343.1 10.7ZM348.4 4.2L345.4 5.8L348.2 0L358.2 0L349.7 6.7L347 6L348.4 4.2Z", "rivers": "M194.2 65L198.2 65.4L203.1 62.6L209.5 63L211.3 61.4L214.4 61.6L216 60.5L223.6 61.6L225.1 61.1L226.1 58.3L228.7 57.6L230.3 54.9L232.5 55.2L236.3 51.4L236.2 50.7L235.1 50.2L237 47.4L235.6 46.3L237.3 46L237.3 43.3L240.1 42.5L241.1 40.6L242.1 40.9L241.6 39.6L243.6 40.5L245.5 39.8L249.7 43.6L251.9 41.4L252.1 39.5L256.7 39.8L257.7 38L258.1 32.3L259.1 31.2L258.3 30L259.7 29L260.2 27.5L258.9 26L259.1 23.8L262.8 12.5L265.1 11.7L264 10.7L265.7 9.9L268.8 12.5L274 11.4L274.4 12.6L273 14.6L278.8 15.6L279.6 17.5L279 24L279.8 25.8L282.4 28.9L286.7 31.5L286.8 33.5L287.7 34.2L288.3 33.9L287.8 32.3L288.3 31.5L289.7 30.9L290.3 31.5L290.9 35.1L292.8 39.6L295.7 42L296.4 46.2L297.9 47.5M222.6 304.3L221.9 304.3L220.4 300.2L218.1 299.8L214.5 301.2L213 302.5L214.7 304L213.5 305.2L211 305.4L212.2 309.6L210.8 311.5L209.3 311.9L209.2 310.9L208.1 310.6L208.2 312.8L206.9 313.5L207 314.8L205.7 316.5L208.1 319.6L206.1 322.3L203.6 322.8L202.1 325.3L200.8 325.6L200.9 326.5L199.6 327.2L195.5 327.8L192.9 324.8L188.2 328.1L184 324.4L181.9 326.2L181 325.7L180.6 324.4L181.2 321.5L179.3 321L176.3 316.9L175.6 314.3L173.4 313.1L172.6 310.5L167.7 306.6L165.3 302.1L165 300.3L163.2 299.3L161.3 299.6L158.6 297.8L156.9 298.7L153.9 295.3L152.4 295.1M152.4 295.1L150.2 296.4L149.1 298.9L145.9 297.1L143.7 298.9L139.3 296.2L134.7 292.1M60.4 144.2L63.5 143.8L63.8 143.1L62.5 141.3L63.5 139.7L72 135.8L73.5 134.2L76 134.4M190 67.3L190.2 72.3L192.8 78.1L196.6 80.8L198.7 84.9L193.9 94.3L192.2 95.8L190.5 95.6L191.1 94.9L190.5 94.5L188.9 95.1L188.1 94.6L188.3 93.4L186.8 93.8L186.3 90.8L185.1 91.9L183.9 90.8L181.3 91.3L179.9 92.9L172.2 92L171.2 92.9L167.9 91.4L167.3 89.7L157.4 89.5L156 89L156.8 88.3L156.5 87.6L154.9 87.8L153.4 86.8L152.3 88.4L151.3 87.7L150.4 88.1L149.1 87.3L152.3 84.8L148.8 83.3L149.1 82.6L147.3 81.7L146.8 79.9L148 79.8L146.6 77L142.6 75.3L141.9 73.4L140.1 74.3L139.2 76.3L136.9 77.2L136.1 79L132.3 76.6L131.6 76.9L133.6 78.7L131.1 80.5L129 80.5L126.9 83.3L127.3 86L124.2 92.7L125 97L123.6 97.4L124.2 96.3L123 96.3L121.7 97.2L114.8 107.5L108.6 111.5L109.1 112.5L107.7 115L106.6 115.7L105.3 118.4L102.6 120L103.8 120L103.8 120.8L100.8 122L98.7 120.9L96.1 122.4L93.5 121.5L90.3 123.5L88.7 125.5L90.3 127.6L87.3 128L85.7 126.8L84.7 129.9L81.5 130.6L80.8 132.7L79.4 133L79.2 134.8L76 134.4M60.4 144.2L58.7 143.8L57.7 142.6L53.8 147.3L51.3 148.6L50.2 151.7L47.3 152.6L44.3 154.8L43.4 156.4L36 162.9M229.9 323.4L231.7 326.7L231.3 327.5L230.4 328.8L228.4 329.3L228.1 331.6L223.8 333.9L223.7 337.8L222.9 338.8L223.4 339.6L221.3 340.1L221.7 341.7L220.7 341.8L222.2 347.8L210.2 346.9L208.5 348.5L205.4 348.8L202.9 351.6L199.5 349L198.2 348.9L196.7 353.6L197.1 354.5L196.2 355.4L199.2 357.4L198.5 361.5L199.9 362.2L202 368.9L203 375.6L203 385.7L205.5 386.6L206.4 387.8L204.3 388.5L202.9 390.8L204.9 393.9L201.3 394.1L203 396.8L202.9 397.8L201.3 399.3L201.4 402.7L204 405.4L202.3 406.8L202.3 407.9L205.5 410.8L215.1 410.2L218.1 412L221.9 409.4L224.5 410.8L227.5 414L228.6 416.8L226.6 421.9L226.8 423.4M190.8 54L188.5 46.3L190.3 42.7L191.4 37.2L193.6 35L193.4 32.6L192.2 31.9L188.8 33L189.5 29.2L186.7 30.4L182.9 27.9L181.2 27.9L181.7 26.9L180.3 26.2L179.5 24.7L180.9 25.4L180.4 23.9L177.2 20.4L174.5 20.2L174.4 21.5L171.5 23.6L167 29.4L164.5 30.2L164.7 31.2L162.3 33.5L160.4 33.2", "hw": "M223.1 286.4L220.7 287.5M180.9 289.5L176.5 285.8L175.6 279.7M220.7 287.5L216.3 290.6L207.2 292.3M206.7 292.3L202.8 294.5M151.2 294L144.8 296.4M147 286.2L144.8 296.4M135.4 284.1L141.7 294.7L143.7 296.4M230.9 296.6L226.8 292.7L226.5 289L223.1 286.4M184.5 298.4L183.8 295.8L181.8 294.9L181.5 289.3M144.1 296.8L140.5 298.8M140.5 298.8L132.5 299M132.5 299L131.3 300.7L129.6 300.7M202.8 294.5L197.7 299.4L186.2 303.1L183.8 305.3M183.8 305.3L185 301.4L184.2 300.1M183.3 307.7L183.8 305.3M183.8 305.3L179.7 308.3M144.6 297.5L148.2 304.2L149 310.9M179.7 308.3L176.8 312.4L171.6 312M171.6 312L163.7 312.4M158.8 312.9L149 310.9M163.7 312.4L158.8 312.9M190.2 317.8L189.1 314.8L185.7 312L183.7 308.5M190.2 317.8L193.7 318.9M183.7 322.4L187.4 318.1L190.2 317.8M149 311.6L148.3 318.5L150.7 326.1M183.3 328.7L181.8 324.1L183.7 322.4M193.7 318.9L200.7 327.4L200.2 329.8M185.5 331.3L183.3 328.7M150.7 326.1L152.1 334.7M200.2 329.8L203.5 330.2L211.7 336M144.9 338.2L147.8 338.6L150.2 337.3L150.6 335.8M139 340.2L143.7 337.8L144.9 338.2M151.4 342.3L151.1 335.4M152.1 334.7L152.1 337.3L158.6 340.6L161.1 346M133.2 346.4L137.6 342.1M194.1 346.9L190 340.6L186.7 338L187.1 335.2L186.1 331.9M131.4 347.3L133.2 346.4M151.4 342.3L154.8 344.1L156.2 348.2M211.7 336L215.1 339.9L215.9 349M166.8 349L164.7 345.4M166.8 349L166.6 349.5M161.1 346L162 349.7M156.7 349.2L152.8 352.5L151.1 352.5M150.9 353.6L151.1 352.5M166.6 349.5L169.2 351.6L170 354.2L174.6 352.7M150.9 354.4L150.9 353.6M162 349.7L161.8 354.7M194.1 346.9L192.7 350.3L192.5 356.8M161.8 354.7L162 357.3M162 357.3L161.1 357.3M174.6 352.7L178.2 355.7L184.9 355.3L189.3 357.9L192.5 356.8M161.1 357.3L157.9 358.3M156.7 349.2L156 352.5L157.9 358.3M215.9 349L213.5 351.6L213.5 356.8L214.6 359.4M128.2 359.6L127.3 356.8L128.5 352.1L131.4 347.3M157.9 359.2L157 364.2M162 357.3L162.7 359.2L165.7 359.9L171 363.5L174.1 364.4L177.4 363.5L179.2 364.8M179.2 364.8L182.5 367.7M214.6 359.9L215.4 360.9L214.4 367.9M151.8 354.9L150.7 363.5L147.1 368.1M210 368.5L214.4 367.9M192.5 356.8L189.8 362.9L190.8 371.3M182.5 367.7L185.7 367.4L187.8 370.3L190.8 371.3M148.3 368.7L143.9 371.6M210 368.5L210.5 371.6L209.1 373.5M131.4 374.8L128.5 372.2L128.5 369L127.3 366.1L128.2 359.6M132 375.9L131.4 374.8M132.3 377.8L132 375.9M237.1 378.5L230.4 378.1L224.8 380M137.1 381.1L132.1 379.8L129.4 383.3M157 364.2L153.8 369.6L149.4 373.1L148.9 381.1L147.5 383.9M209.1 373.5L207.9 377.2L208.9 384.1M143.9 371.6L143.7 380L142.5 384.1M142.5 384.1L137.8 381.3M190.8 371.3L195.4 369.8L200.2 371.6L201.1 374.4L202.6 375L205.5 383.5L208.4 384.3M208.9 384.1L211.7 383.7L215.2 385.2M224.8 380L215.9 385.4M147.5 383.9L147 385.9M147 385.9L142.5 384.1M147.3 385.9L147.5 383.9M147.3 385.9L147 385.9M150.6 388.9L147.3 385.9M142.5 384.1L140 389.3M208.4 384.3L207.9 387.8L206 389.5M147 385.9L146.5 388.5L144.8 390M215.9 385.4L218.7 385.9L227.2 383.7L235.2 390M162.8 389.3L161.3 390.4L158.2 389.5L155.5 386.1L150.6 388.9M140 389.3L134.3 392.1M169.8 393L162.8 389.3M206 389.5L201.9 390L198.7 393.9L197 393.6M215.2 385.2L217.6 388.9L215.9 393.4L217.3 395.4M144.8 390L142.4 396.2M197 393.6L186.4 393.9L184.2 396.2M182.3 395.2L184.2 396.2M182.3 395.2L179.4 395.6L178 398.4M178 398.4L174.6 397.5L173.6 394.5L169.8 393M142.2 396.5L137.9 400.6M235.2 390L235.2 396.2L233.7 401.2M184.2 396.2L181.1 401.2L177 402.1M178 398.4L177 402.1M206 389.5L204.3 396.5L206.2 402.7M134.3 392.1L131.6 398L133.2 402.7M217.3 395.4L218.7 404M177 402.1L172.6 401.7L170.9 402.3L169.2 405.3L167.3 404.7L163.2 406.9M206.2 402.7L207.4 406.2L206.7 409.7M218.7 404L218 405.6L218.8 408.8L215.1 411L216.8 414.4M233.7 401.2L230.1 410.8L229.9 413.6L232.5 416.2M216.8 414.4L213.9 417M206.7 409.7L205.9 411.4L207.6 417M207.6 417L211.8 416.2L213.9 417M133.2 402.7L132 410.1L124.8 417.3M150.9 411.4L147.1 412.7L144.9 414.9L143.6 420.1M213.9 417L216.4 416.8L219.2 420.1M223.9 420.1L226.3 420.1M219.2 420.1L223.9 420.1M177 403.2L179.1 404.9L180.6 409.7L188.8 420.7M143.6 420.1L149.9 418.3L154 421.4M232.5 416.2L231.6 421.6M226.3 420.1L231.6 421.6M141 421.8L143.6 420.1M137.9 400.6L135.9 406L135.7 410.5L136.6 412.7L135 416.6L139 421.4L141 421.8M191.9 422.2L194.8 421.6L199.9 416.6L207.6 417M188.8 420.7L190.8 422.9M189.6 424.4L190.8 422.9M154 421.4L155.3 426.6M140.5 423.5L140.5 426.4L138.3 427L137.6 429.4L132.1 430.2M124.8 417.3L124.1 425.5L125.6 430.5M155.3 426.6L155.7 427.9L159.6 430L163.4 430.7M132.1 430.2L130.4 430.9L127 429.4L125.6 430.5M177.4 430.9L186.7 427.2L189.6 424.4M163.4 430.7L168.1 432.4M168.1 432.4L177.4 430.9M200.2 433.3L193.9 431.8L192 432.2L190.5 434.6L189.3 434.4L188.6 433.3L189.6 424.4M125.6 430.5L121.9 433.5L122.1 437.8L121 440", "rd": "M196.1 266.5L194.4 266.5M212.2 269.1L208.4 270L196.1 266.5M194.4 266.5L190.7 273.7M190.7 273.7L189.6 274.7M130.2 276.1L132.6 276.7L132.8 279.3L135.2 279.9L135.4 284.1M212.2 269.1L215.8 271.9L216.8 275.4L219.7 278L223.1 286.4M189.6 274.7L183.3 286.7M183.3 286.7L181.5 289.3M181.5 289.3L180.9 289.5M175.6 279.7L173.1 281.9L165.1 282.5L161.3 286.7L159.4 291.4M207.2 292.3L206.7 292.3M159.4 291.4L151.2 294M143.7 296.4L144.1 296.8M144.8 296.4L144.6 297.3M144.6 297.3L144.6 297.5M144.1 296.8L144.6 297.5M230.9 296.6L232.3 299.9M184.2 300.1L184.5 298.4M183.7 308.5L183.3 307.7M149 310.9L149 311.6M232.3 299.9L240.7 313.1L242.2 320.9L243.7 323L243.6 325.4M183.3 328.7L178.2 327.8M186.1 331.9L185.5 331.3M151.1 335.4L152.1 334.7M150.6 335.8L151.1 335.4M178.2 327.8L175.3 330L172.6 330.2L168.8 336.5M243.6 325.4L243.6 330.4L246.3 339.3L245.8 341.5M137.6 342.1L139 340.2M168.8 336.5L165.7 342.8M165.7 342.8L164.7 345.4M164.7 345.4L161.1 346M204.5 344.9L201.1 346.7L194.1 346.9M208.9 347.7L204.5 344.9M215.9 349L208.9 347.7M229.4 350.5L215.9 349M231.3 351.4L229.4 350.5M245.8 341.5L244.1 345.8L244.6 353.6L243.2 357.3M243.2 357.3L237.9 355.7L231.3 351.4M157.9 358.3L157.9 359.2M243.2 357.3L242.5 367.7M242.5 367.7L242.2 375M242.2 375L242.4 377.6M238.1 380.2L242.4 377.6M137.8 381.3L137.1 381.1M208.4 384.3L208.9 384.1M215.2 385.2L215.9 385.4M238.1 380.2L236.9 386.7M236.9 386.7L235.2 390M142.4 396.2L142.2 396.5M241.7 401.7L241.4 401.9M241.4 401.9L241.2 402.1M241.2 402.1L239.6 403M239.6 403L233.7 401.2M163.2 406.9L162.2 407.3M162.2 407.3L159.9 408.6M159.9 408.6L150.9 411.4M207.6 417L210 420.3M190.8 422.9L191.9 422.2M226 422.9L220.2 421.6L219.2 420.1M230.6 422.9L231.6 421.6M227.5 422.9L226 422.9M141 421.8L140.5 423.5M229.4 425.1L230.6 422.9M119.8 441.5L121 440", "seoulBox": [142.8, 295.1, 3.31, 3.94], "spots": [["부산 광안대교", 232.5, 422.9], ["경주 불국사", 241.3, 389.1], ["제주 성산일출봉", 142.4, 511.5], ["전주 한옥마을", 151.2, 387.8], ["강릉 경포대", 223.3, 283.8], ["인천 송도", 130.3, 305.1], ["대구 팔공산", 215.2, 377.0], ["여수 밤바다", 176.5, 444.2], ["안동 하회마을", 207.6, 349.8], ["속초 설악산", 205.4, 266.8], ["목포 유달산", 118.8, 441.6], ["수원 화성", 145.6, 310.5]], "seoul": [144.2, 296.2]}};
// v2.51 저승 지도: 지역마다 대표 랜드마크(필드 안 모형과 같은 것) — 글자 없이 모양만
const FLMK={
  myeong:'<path d="M-9 0L-9 -9L5 -9L5 0Z" fill="#8a3e30" stroke="#140d14" stroke-width="1.2"/><path d="M-10 -9L-2 -14L6 -9Z" fill="#3e4048" stroke="#140d14" stroke-width="1.1"/><path d="M5 0L5 -12L10 -12L10 0Z" fill="#8a3e30" stroke="#140d14" stroke-width="1.2"/><path d="M5 -12L7.5 -27L10 -12Z" fill="#3e4048" stroke="#140d14" stroke-width="1.1"/><circle cx="7.5" cy="-8" r="1.4" fill="#f2c45a"/><path d="M7.5 -27L7.5 -31M6 -29.5L9 -29.5" stroke="#d8d0c0" stroke-width="1"/>',
  hongdae:'<path d="M-13 -2L13 -2M-13 2L13 2" stroke="#8a8682" stroke-width="1.3"/><path d="M-11 -4L-11 4M-7 -4L-7 4M-3 -4L-3 4M1 -4L1 4M5 -4L5 4M9 -4L9 4" stroke="#5a4636" stroke-width="1.2"/><circle cx="-8" cy="-10" r="5" fill="#d9a83a" stroke="#140d14" stroke-width="1"/><circle cx="7" cy="-11" r="5.5" fill="#c86a3a" stroke="#140d14" stroke-width="1"/><path d="M-8 -5L-8 -2M7 -5.5L7 -2" stroke="#5a4636" stroke-width="1.4"/>',
  seongsu:'<path d="M-13 0L-13 -8L-10 -11L-7 -8L-4 -11L-1 -8L2 -11L5 -8L5 0Z" fill="#a84a38" stroke="#140d14" stroke-width="1.2"/><path d="M7 0L8 -22L11 -22L12 0Z" fill="#8a3a2e" stroke="#140d14" stroke-width="1.2"/><path d="M7.6 -14L11.4 -14" stroke="#d8d0c4" stroke-width="1.3"/><rect x="-11" y="-5" width="3" height="2" fill="#e8a85a"/><rect x="-3" y="-5" width="3" height="2" fill="#e8a85a"/>',
  gyeong:'<path d="M-14 0L-14 -7L14 -7L14 0Z" fill="#b4aa96" stroke="#140d14" stroke-width="1.2"/><path d="M-3 0L-3 -3A3 3 0 0 1 3 -3L3 0Z" fill="#241e24"/><path d="M-11 0L-11 -2.5A2 2 0 0 1 -7 -2.5L-7 0Z M7 0L7 -2.5A2 2 0 0 1 11 -2.5L11 0Z" fill="#241e24"/><path d="M-9 -7L-9 -10L9 -10L9 -7Z" fill="#93392a"/><path d="M-14 -10Q0 -13 14 -10L9 -13L-9 -13Z" fill="#474a52" stroke="#140d14" stroke-width="1"/><path d="M-6 -13L-6 -15L6 -15L6 -13Z" fill="#93392a"/><path d="M-10 -15Q0 -18 10 -15L5 -19L-5 -19Z" fill="#474a52" stroke="#140d14" stroke-width="1"/>',
  namsan:'<path d="M-1 0L-1.5 -20L1.5 -20L1 0Z" fill="#e6e2da" stroke="#140d14" stroke-width="1"/><path d="M-5 -20L-4 -24L4 -24L5 -20Z" fill="#d8d4cc" stroke="#140d14" stroke-width="1"/><rect x="-4.6" y="-23" width="9.2" height="1.6" fill="#ffd88a"/><path d="M0 -24L0 -33" stroke="#c8483a" stroke-width="1.6"/><circle cx="0" cy="-34" r="1.3" fill="#ff4a5a"/><ellipse cx="0" cy="0" rx="5" ry="1.6" fill="#c4c0b8" stroke="#140d14" stroke-width="1"/>'
};
let mapMode='seoul';
const LANDMARK={
  tower:'<path d="M0 -30L0 -14M-2 -14L2 -14L3 0L-3 0Z" stroke="#140d14" stroke-width="1.5" fill="#ece1cc"/><ellipse cx="0" cy="-22" rx="5" ry="2.6" fill="#f4b740" stroke="#140d14" stroke-width="1.2"/><circle cx="0" cy="-31" r="1.6" fill="#ff6a74"/>',
  seoulst:'<rect x="-11" y="-9" width="22" height="9" fill="#8a4a3a" stroke="#140d14" stroke-width="1.3"/><path d="M-6 -9A6 6 0 0 1 6 -9Z" fill="#3a6a5a" stroke="#140d14" stroke-width="1.3"/><rect x="-1" y="-19" width="2" height="5" fill="#140d14"/><rect x="-8" y="-6" width="3" height="4" fill="#f4b740"/><rect x="5" y="-6" width="3" height="4" fill="#f4b740"/>',
  myeong:'<path d="M-7 0L-7 -10L0 -15L7 -10L7 0Z" fill="#8a4a3a" stroke="#140d14" stroke-width="1.3"/><path d="M-2 -10L0 -26L2 -10Z" fill="#6a3a2a" stroke="#140d14" stroke-width="1.2"/><path d="M-1 -4A1.6 1.6 0 0 1 1 -4L1 0L-1 0Z" fill="#f4b740"/>',
  itaewon:'<path d="M-12 0L-12 -6L-8 -10L-4 -6L-4 0Z" fill="#4a3a5a" stroke="#140d14" stroke-width="1.2"/><path d="M-2 0L-2 -9L3 -14L8 -9L8 0Z" fill="#5a4a6a" stroke="#140d14" stroke-width="1.2"/><rect x="1" y="-6" width="3" height="3" fill="#f4b740"/>',
  hangang:'<path d="M-16 -4L16 -4" stroke="#ece1cc" stroke-width="2"/><path d="M-16 -4Q-10 -14 -4 -4Q2 -14 8 -4Q12 -11 16 -4" stroke="#ece1cc" stroke-width="1.4" fill="none"/><path d="M-10 -4L-10 2M2 -4L2 2M14 -4L14 2" stroke="#ece1cc" stroke-width="1.2"/>',
  namsan:''
};
// v2.3 명소 그림: 제미나이 AI 그림 [파일, 지도 위 너비, 높이]
const LMIMG={tower:['img/lm_tower.webp',30,37],seoulst:['img/lm_station.webp',34,31],myeong:['img/lm_church.webp',32,31],hangang:['img/lm_bridge.webp',40,33]};
const VB0={x:0,y:0,w:360,h:426}; let VB={...VB0}, mapDragged=false;
let mapSel=null;
function setMapMode(m){ mapMode=m; if(m==='korea'){ VB0.w=360; VB0.h=MAPD.korea.H; } else { VB0.w=360; VB0.h=426; } VB={...VB0};
  /* v2.50: 서울 지도는 다섯 곳이 다 보이게 처음엔 넓게 */ }
function applyVB(){ const mw=VB0.w/(mapMode==='korea'?8:4); VB.w=Math.min(VB0.w,Math.max(mw,VB.w)); VB.h=VB.w*VB0.h/VB0.w;
  VB.x=Math.min(VB0.w-VB.w,Math.max(0,VB.x)); VB.y=Math.min(VB0.h-VB.h,Math.max(0,VB.y));
  $('mapSvg').setAttribute('viewBox',`${VB.x.toFixed(1)} ${VB.y.toFixed(1)} ${VB.w.toFixed(1)} ${VB.h.toFixed(1)}`); }
function zoomAt(f,cx,cy){ const mw=VB0.w/(mapMode==='korea'?8:4); const nw=Math.min(VB0.w,Math.max(mw,VB.w/f)), k=nw/VB.w; VB.x=cx-(cx-VB.x)*k; VB.y=cy-(cy-VB.y)*k; VB.w=nw; applyVB(); }
(()=>{ const svg=$('mapSvg'), pts=new Map(); let start=null;
  const toMap=(px,py)=>{ const r=svg.getBoundingClientRect(); return {x:VB.x+(px-r.left)/r.width*VB.w, y:VB.y+(py-r.top)/r.height*VB.h}; };
  const snap=()=>{ const a=[...pts.values()]; const c={x:a.reduce((s,p)=>s+p.x,0)/a.length,y:a.reduce((s,p)=>s+p.y,0)/a.length};
    const d=a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0; start={c,d,vb:{...VB}}; };
  svg.addEventListener('pointerdown',e=>{ if(!pts.size) mapDragged=false; pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); snap(); });
  svg.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const a=[...pts.values()], r=svg.getBoundingClientRect(), c={x:a.reduce((s,p)=>s+p.x,0)/a.length,y:a.reduce((s,p)=>s+p.y,0)/a.length};
    if(Math.hypot(c.x-start.c.x,c.y-start.c.y)>8) mapDragged=true;
    const mw=VB0.w/(mapMode==='korea'?8:4);
    let w=start.vb.w; if(a.length>1&&start.d>10){ const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); w=start.vb.w*start.d/Math.max(10,d); mapDragged=true; }
    w=Math.min(VB0.w,Math.max(mw,w)); const h=w*VB0.h/VB0.w;
    const fx=(start.c.x-r.left)/r.width, fy=(start.c.y-r.top)/r.height, ax=start.vb.x+fx*start.vb.w, ay=start.vb.y+fy*start.vb.h;
    const nx=(c.x-r.left)/r.width, ny=(c.y-r.top)/r.height; VB.w=w; VB.h=h; VB.x=ax-nx*w; VB.y=ay-ny*h; applyVB(); e.preventDefault(); });
  const up=e=>{ if(!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if(pts.size) snap(); };
  svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up); svg.addEventListener('pointerleave',up);
  svg.addEventListener('wheel',e=>{ e.preventDefault(); const m=toMap(e.clientX,e.clientY); zoomAt(e.deltaY<0?1.2:1/1.2,m.x,m.y); },{passive:false});
  document.querySelectorAll('#mapZoom .btn').forEach(b=>b.onclick=()=>{ const z=+b.dataset.z; if(!z){ setMapMode(mapMode); applyVB(); return; }
    if(false){ } else zoomAt(z,VB.x+VB.w/2,VB.y+VB.h/2); });
  $('mapMode').onclick=()=>{ setMapMode(mapMode==='seoul'?'korea':'seoul'); renderMap(); };
})();
const MAPIMG={}; // v2.56.2 지도 그림(제미나이): 있으면 쓰고 없으면 코드 그림
(()=>{ for(const k of ['bg','gyeong','myeong','namsan','hongdae','seongsu']){ const im=new Image(); im.onload=()=>{ MAPIMG[k]=1; if($('pMap')&&$('pMap').classList.contains('show')&&mapMode==='seoul') renderMap(); }; im.src=k==='bg'?'img/map_bg.webp':`img/map_${k}.webp`; } })();
function renderMap(){
  const svg=$('mapSvg'); $('mapMode').textContent=mapMode==='seoul'?'🗺 한반도 보기':'🔥 서울로';
  $('mapTitle').textContent=mapMode==='seoul'?'서울 · 저승 지도':'한반도 · 저승 지도'; 
  let h=`<defs><radialGradient id="fog"><stop offset="0" stop-color="#07060c" stop-opacity=".8"/><stop offset="1" stop-color="#07060c" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ff9a50" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a50" stop-opacity="0"/></radialGradient>
    <pattern id="haze" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#15121e"/><path d="M0 8L8 0" stroke="#26213a" stroke-width="1.5"/></pattern></defs>`;
  if(mapMode==='korea'){ const K=MAPD.korea;
    h+=`<rect width="360" height="${K.H}" fill="#0d1520"/>
      <path d="${K.other}" fill="url(#haze)" stroke="#3a3350" stroke-width="1" stroke-dasharray="3 3"/>
      <path d="${K.north}" fill="#17141f" stroke="#2a2438" stroke-width="1"/>
      <path d="${K.korea}" fill="#221d33" stroke="#3a3350" stroke-width="1.2"/>
      <path d="${K.rivers}" fill="none" stroke="#2a4a66" stroke-width="1.2"/>
      <path d="${K.rd}" fill="none" stroke="#332c46" stroke-width=".8"/>
      <path d="${K.hw}" fill="none" stroke="#4a4060" stroke-width="1.1"/>`;
    for(const [x,y] of [[40,120],[70,250],[300,470],[330,380]]) h+=`<g class="far"><circle cx="${x}" cy="${y}" r="14" fill="#0c0a14" stroke="#3a3350" stroke-width="1.2" stroke-dasharray="3 2"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="#5a5370" font-size="13">🔒</text></g>`;
    for(const [n,x,y] of K.spots) h+=`<g class="spot" data-n="${n}"><circle cx="${x}" cy="${y}" r="9" fill="url(#fog)"/><circle cx="${x}" cy="${y}" r="3.6" fill="#1a1726" stroke="#5a5370" stroke-width="1.2"/><text x="${x}" y="${y+2.6}" text-anchor="middle" fill="#5a5370" font-size="5.5">?</text></g>`;
    const [sx,sy]=K.seoul; h+=`<g id="goSeoul" style="cursor:pointer"><circle cx="${sx}" cy="${sy}" r="16" fill="url(#glow)"/><text x="${sx}" y="${sy+4}" text-anchor="middle" font-size="11">🔥</text></g>`;
    svg.innerHTML=h; applyVB();
    svg.querySelectorAll('.far').forEach(g=>g.onclick=()=>{ if(mapDragged) return; $('mapInfo').innerHTML='<b>열리지 않은 땅</b> · 바다 건너, 다른 저승. 다음 시즌에 열린다.'; });
    svg.querySelectorAll('.spot').forEach(g=>g.onclick=()=>{ if(mapDragged) return; $('mapInfo').innerHTML=`<b>???</b> · 짙은 어둠. 언젠가 돌 조각의 빛이 닿을 곳.<br><small>(다음 단계: 전국 명소 약 200곳이 거점이 된다)</small>`; });
    svg.querySelector('#goSeoul').onclick=()=>{ if(mapDragged) return; setMapMode('seoul'); renderMap(); };
    $('mapInfo').innerHTML=`지금 열린 곳은 <b>서울</b>뿐이다. 바다 건너 땅은 아직 열리지 않았다.<br><small>🔥를 누르면 서울로 · 지형: Natural Earth</small>`; return; }
  // v2.56.2 저승 지도(67번 6-2): 실제 방향은 두고 거리만 벌린 배치(노선도처럼) · 옛 서울 고지도 느낌의 먹 그림 바탕 · 대표 건물 그림(있으면 제미나이 그림, 없으면 코드 그림)
  const POS={gyeong:[180,98],myeong:[266,206],namsan:[180,292],hongdae:[74,222],seongsu:[288,338]};
  const RIV='M-10 340 C40 334 80 352 130 366 S220 384 262 380 S330 366 370 352';
  h+=`<defs><linearGradient id="hanji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#211c17"/><stop offset="1" stop-color="#16120f"/></linearGradient>
    <filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .08  0 0 0 0 .06  0 0 0 0 .05  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
    <rect width="360" height="426" fill="url(#hanji)"/>`;
  if(MAPIMG.bg) h+=`<image href="img/map_bg.webp" x="0" y="0" width="360" height="426" preserveAspectRatio="xMidYMid slice" opacity=".95"/>`;
  else { // 먹선 산줄기(북악·인왕·낙산·남산) · 한강 물결 · 성곽 선
    const ridge=(d,w=1.6,o=.75)=>`<path d="${d}" fill="none" stroke="#5a4c3c" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
    h+=`<path d="M120 62 L140 38 L156 52 L178 22 L198 46 L214 34 L236 60 Z" fill="#2a241d" opacity=".9"/>`+ridge('M120 62 L140 38 L156 52 L178 22 L198 46 L214 34 L236 60',2)+ridge('M142 58 L158 46 M176 40 L190 50 M204 50 L218 44',1,.5);
    h+=`<path d="M70 132 L88 92 L104 108 L116 86 L132 128 Z" fill="#28221b" opacity=".85"/>`+ridge('M70 132 L88 92 L104 108 L116 86 L132 128',1.8);
    h+=`<path d="M232 128 L248 104 L262 118 L276 132 Z" fill="#28221b" opacity=".8"/>`+ridge('M232 128 L248 104 L262 118 L276 132',1.4);
    h+=`<path d="M138 300 L160 262 L180 248 L200 264 L224 300 Z" fill="#29231c" opacity=".9"/>`+ridge('M138 300 L160 262 L180 248 L200 264 L224 300',2)+ridge('M156 284 L170 268 M190 266 L204 280',1,.5);
    h+=`<path d="M110 128 Q100 190 140 252 Q180 270 222 252 Q262 200 250 128 Q200 70 150 64 Q120 80 110 128 Z" fill="none" stroke="#6b5a44" stroke-width="1.3" stroke-dasharray="1.5 3" opacity=".7"/>`;
    h+=`<path d="${RIV}" fill="none" stroke="#1d2a33" stroke-width="30" stroke-linecap="round"/><path d="${RIV}" fill="none" stroke="#3e5566" stroke-width="1" opacity=".7"/>`;
    for(let k=0;k<9;k++){ const x=20+k*38, y=344+Math.sin(k*1.3)*4+k*3.2-(k>5?(k-5)*7:0); h+=`<path d="M${x} ${y} q5 -4 10 0 t10 0" fill="none" stroke="#4d6676" stroke-width=".9" opacity=".6"/>`; }
    h+=`<rect width="360" height="426" filter="url(#ink)" opacity=".55"/>`; }
  h+=`<text x="322" y="404" fill="#6a7d8a" font-size="10" font-family="'Noto Serif KR',serif" text-anchor="middle" opacity=".8">한강</text>`;
  const nx=EP_ORDER[Math.min(EP_ORDER.length-1,SV.ep||0)], epDone=(SV.ep||0)>=EP_ORDER.length;
  { const ord=['myeong','hongdae','seongsu','gyeong','namsan']; for(let i=0;i+1<ord.length;i++){ const [x1,y1]=POS[ord[i]], [x2,y2]=POS[ord[i+1]], on=!!SV.cleared[ord[i]]; h+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${on?'#f4b740':'#6a5c48'}" stroke-width="1.4" stroke-dasharray="3 5" opacity="${on?.75:.45}"/>`; } }
  if(!FIELDS[mapSel]) mapSel=nx;
  for(const k of FKEYS){ const [x,y]=POS[k], F=FIELDS[k], fb=BOSSDEF[finalOf(k)], I=starInfo(k), done=SV.cleared[k], sel=mapSel===k, dp=deepOpen(k), nxt=k===nx&&!epDone;
    h+=`<g class="node" data-k="${k}" style="cursor:pointer"><circle cx="${x}" cy="${y-14}" r="34" fill="transparent"/>`;
    if(nxt) h+=`<circle cx="${x}" cy="${y}" r="24" fill="url(#glow)" opacity=".75"/>`;
    // 대표 건물(위) — 제미나이 그림이 있으면 그것, 없으면 v2.51 코드 그림
    if(MAPIMG[k]) { const w=sel?66:58; h+=`<image href="img/map_${k}.webp" x="${x-w/2}" y="${y-10-w}" width="${w}" height="${w}" preserveAspectRatio="xMidYMax meet" style="filter:brightness(${done?1.35:1.15}) drop-shadow(0 0 2.5px rgba(255,226,170,.55))"/>`; }
    else { const LM=FLMK[k]; if(LM) h+=`<g transform="translate(${x},${y-22}) scale(${sel?1.7:1.45})" opacity="${done?1:.82}">${LM}</g>`; }
    if(fb&&fb.views&&fb.views.front){ const sz=sel?28:24; h+=`<image href="${fb.views.front[0]}" x="${x+11}" y="${y-sz+6}" width="${sz}" height="${sz}" opacity="${done?1:.85}" style="filter:${done?'none':'brightness(.75)'}"/>`; }
    h+=`<circle cx="${x}" cy="${y}" r="${sel?11:9}" fill="${done?'#2e2b52':'#4a2a3a'}" stroke="${sel?'#f4b740':'#ece1cc'}" stroke-width="${sel?3.2:2}"/>`;
    h+=`<text x="${x}" y="${y+3.5}" text-anchor="middle" font-size="9" fill="#ece1cc">${done?'✓':I.st}</text>`;
    h+=`<text x="${x}" y="${y+24}" text-anchor="middle" fill="#ece1cc" font-size="11.5" font-weight="700" stroke="#0c0a08" stroke-width="3" paint-order="stroke">${F.name}</text>`;
    h+=`<text x="${x}" y="${y+36}" text-anchor="middle" fill="${I.c}" font-size="8.5" stroke="#0c0a08" stroke-width="2.5" paint-order="stroke">${'★'.repeat(I.st)}${dp?' · 깊이 '+dp:''}</text>`;
    if(nxt) h+=`<g><rect x="${x-42}" y="${y+41}" width="84" height="16" rx="8" fill="#3a2a10" stroke="#f4b740" stroke-width="1.3"/><text x="${x}" y="${y+52.5}" text-anchor="middle" fill="#ffd98a" font-size="9.5" font-weight="700">📖 다음 이야기</text></g>`;
    h+='</g>'; }
  svg.innerHTML=h; applyVB();
  svg.querySelectorAll('.node').forEach(n=>n.onclick=()=>{ if(mapDragged) return; mapSel=n.dataset.k; renderMap(); });
  { const k=mapSel, F=FIELDS[k], I=starInfo(k), fb=BOSSDEF[finalOf(k)], dp=deepOpen(k), mids=F.mids.map(m=>BOSSDEF[m]?BOSSDEF[m].name:m).join(' · ');
    $('mapInfo').innerHTML=`<b>${F.name}</b> · ${F.desc}<br><span style="color:${I.c}">난이도 ${I.txt} · 지금 내 불로는 <b>${I.w}</b></span><br>중간보스: ${mids}<br>파이널: <b>${fb?fb.name:''}</b>${SV.cleared[k]?` · ${SV.cleared[k]}번 보냄`:''}${dp?`<br>🕳 저승 깊이 <b>${dp}</b>까지 열림`:''}${k===nx&&!epDone?'<br><b style="color:#f4b740">📖 다음 이야기가 여기서 열린다</b>':''}<br><span class="btn" id="mapGo" style="display:inline-block;margin-top:8px;padding:8px 22px">🔥 여기로 출발</span><br><small style="opacity:.5">거리 © OpenStreetMap 기여자</small>`;
    const b=$('mapGo'); if(b) b.onclick=()=>{ openPanel(null); pickDeep(k); }; }
}
function renderChars(){
  const L=$('charList'); L.innerHTML='';
  for(const k in CHARS){ const C=CHARS[k], open=C.unlock(), sel=SV.char===k; if(open) SV.chars[k]=true;
    const d=document.createElement('div'); d.className='crow'+(sel?' sel':'')+(open?'':' lock');
    d.innerHTML=`${C.img?`<img src="${C.img}">`:'<div class="noimg">?</div>'}<div><b>${C.name}</b><br><span>시작 무기: ${WEAPONS[C.start].ic} ${WEAPONS[C.start].name} · ${WEAPONS[C.start].kind}${C.start2?` + ${WEAPONS[C.start2].ic} ${WEAPONS[C.start2].name}`:''}</span><br><span>${C.passive}: ${C.pdesc}</span>${open?'':`<br><span class="lk">🔒 ${C.lock}</span>`}${open&&SV.mono&&SV.mono[k]?`<br><span class="mono">"${monoLines(k)[(SV.mono[k]-1)%monoLines(k).length]||''}"</span>`:''}</div>`;
    d.onclick=()=>{ if(!open) return; setChar(k); save(); renderChars(); renderHub(); }; L.appendChild(d); }
  save();
}
function renderFlow(){
  // v2.1 갈래: 선 그림 대신 카드 목록 (고른 길은 밝게, 안 고른 길은 ???)
  const L=$('flowList'); let h=`<div class="fl-ch">1장 · 남산 아래</div>`, prevOn=true, first=true;
  for(const F of FLOW){
    let on;
    if(!F.opts) on=F.id==='start'||(F.id==='next'&&!!SV.cleared.namsan);
    else on=Object.keys(F.opts).some(k=>SV.seen[F.id+':'+k]);
    if(!first) h+=`<div class="fl-link${on&&prevOn?' on':''}"></div>`; first=false;
    if(!F.opts){ h+=`<div class="fl-node${on?' on':''}"><div class="t">${on?F.title:'???'}</div>${on&&F.sub?`<div class="q">${F.sub}</div>`:''}</div>`; prevOn=on; continue; }
    const ks=Object.keys(F.opts);
    h+=`<div class="fl-node${on?' on':''}"><div class="t">${on?F.title:'??? · 아직 만나지 않은 장면'}</div>${on?`<div class="q">${F.q||''}</div>`:''}`;
    for(const k of ks){ const seen=SV.seen[F.id+':'+k], last=SV.choice[F.id]===k;
      h+=`<div class="fl-opt${last?' last':seen?' seen':''}"><span class="m">${last?'✔':seen?'○':'🔒'}</span>${seen?F.opts[k]:'???'}${last?'<small>마지막에 고른 길</small>':seen?'<small>가 본 길</small>':''}</div>`; }
    h+=`</div>`; prevOn=on; }
  const seenN=Object.keys(SV.seen).length, total=FLOW.reduce((a,F)=>a+(F.opts?Object.keys(F.opts).length:0),0);
  h+=`<div class="fl-count">찾은 갈래 <b>${seenN}</b> / ${total}<br>잠긴 길은 다음 판에서 다르게 고르면 열린다</div>`;
  L.innerHTML=h;
}
$('bReset').onclick=()=>{ $('resetConfirm').style.display='flex'; };
$('bResetNo').onclick=()=>{ $('resetConfirm').style.display='none'; };
$('bResetYes').onclick=()=>{ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} SV=loadSave(); $('resetConfirm').style.display='none'; enterHub(); };

/* ============ 도감 (1·2막: 저승 틀 안의 설명만) ============ */
function dexOpen(){
  const L=$('dexList'); if(!L.children.length){
    const rows=[['img/shade.webp','원념 그림자','저승의 것들. 산 자의 온기를 탐해 떼로 몰려온다. 빛 밖에서는 눈만 보인다.'],
      ['img/wisp.webp','도깨비불','푸른 불. 가볍고 빠르다. 장난치듯 달려든다.'],
      ['img/elite.webp','붉은 눈 그림자','더 오래 떠돈 것. 크고 무겁다. 이마에 붉은 금이 있다.'],
      ['img/toad.webp','보물 두꺼비','금붙이를 물고 달아난다. 잡으면 기억 조각을 쏟는다.'],
      ['img/magpie.webp','보물 까치','금붙이를 물고 날아다닌다. 빠르다.'],
      ['img/gumiho_front.webp','구미호','아홉 꼬리의 여우. 사람 비명 같은 울음을 운다. 여우불 셋을 거느리고, 붉게 빛나면 달려든다.'],
      ['img/bulgasari.webp','불가사리','쇠를 먹고 자라는 괴물. 도끼 같은 쇠붙이는 씹어 삼킨다. 붉게 빛나면 내리찍는다.'],
      ['img/dok_front.webp','도깨비','털북숭이 외다리. 나무 절굿공이를 들고 깡충깡충 뛰어든다. 씨름을 걸어 온다.'],
      ['img/yagwang.webp','야광귀','설날 밤에 내려와 신을 훔쳐 가는 밤의 것. 닿으면 신을 빼앗겨 발이 무거워진다. 쫓아가 잡으면 되찾는다. 체를 걸어 두면 구멍을 세다 닭이 울면 달아난다고 한다.'],
      ['img/gangcheol.webp','강철이','소를 닮은 독한 용. 지나간 자리엔 우박과 바람이 몰아쳐 가을도 봄이 된다. 흰 원이 깜빡이면 비켜서라.'],
      ['img/yeongno.webp','영노','탈춤에 나오는 무엇이든 먹는 괴물. 둘레의 것들을 삼킬수록 커지고 질겨진다. 숨을 들이켜 끌어당기고, 아홉을 삼키면 돌진한다. 쓰러뜨리면 삼킨 것을 토해 낸다.'],
      ['img/tiger.webp','호랑이','해와 달이 된 오누이의 그 호랑이. 빙빙 돌며 노리다 할퀴고 덮친다. 포효하면 발이 굳고, 어둠에 숨었다가 등 뒤에서 덮친다.'],
      ['img/gpig.webp','금돼지','굴 속에 산다는 금빛 돼지. 무겁고 질기며 달아난다. 잡으면 금빛 조각을 잔뜩 쏟는다.'],
      ['img/gwijol.webp','귀졸 떼','밤마다 몰려다니며 노는 귀신 무리. 줄지어 한쪽으로 내달린다. 하나하나는 약하니 옆으로 비켜서라.'],
      ['img/mokrang.webp','목랑','두두리라고도 하는 늙은 나무의 것. 뿌리로 느릿느릿 걷다가 뿌리를 박으면 둘레에서 발이 묶인다.'],
      ['img/imae.webp','이매','산에 사는 흐릿한 것. 또렷하지도 흐리지도 않다. 사라졌다가 옆에서 나타난다.'],
      ['img/mangryang.webp','망량','물에 사는 것. 검은 웅덩이로 숨어 있다가 가까이 오면 솟아올라 덮친다.']];
    for(const [src,n,d] of rows){ const r=document.createElement('div'); r.className='dx'; const im=document.createElement('img'); im.src=src; r.appendChild(im); const t=document.createElement('div'); t.innerHTML=`<b>${n}</b><span>${d}</span>`; r.appendChild(t); L.appendChild(r); } }
  $('dex').classList.add('show');
}
$('bDex').onclick=dexOpen; $('hDex').onclick=dexOpen; $('bDexClose').onclick=()=>$('dex').classList.remove('show');
function showBest(){ const b=SV.best; if(b.t) $('best').textContent=`최고 기록 · ${mmss(b.t)} 버팀 · 처치 ${b.k} · 기억 조각 ${SV.shards}`; }

/* ============ 루프 ============ */
S=null; showBest(); setChar(SV.char); player.root.position.set(.75,0,1.2); keeper.visible=true; camT.set(-.05,0,HUB_CZ);
let last=performance.now();

/* ============ v2.9.5 멀티 1단계: 같은 곳(같은 지역 필드·서울 지도)에 있는 친구가 보인다 ============
   artifact의 room 기능(지금 이 게임을 열어 둔 사람끼리) · presence = 내 자리·캐릭터·레벨만 · 못 붙으면(공개 링크·혼자) 그냥 혼자 하는 게임
   친구는 이메일 초대(Claude 계정)로 들어와야 함 — 공개 링크로 연 사람은 room에 못 들어옴 */
const MP={room:null,user:null,ghosts:new Map(),names:{},lastSend:0,lastKey:'',near:0,online:0,seen:new Set(),me:null,ready:false,hitFx:{}};
/* v2.24 밖에서 하는 판(GitHub Pages): Claude 없이 공개 MQTT 중계로 room과 같은 모양(presence·peers·onPeers)을 흉내 낸다.
   presence는 110ms마다 바뀌면 보내고 2초마다 다시 보낸다(늦게 온 사람용) · 6초 소식 없으면 나간 것 · 이름은 presence.nm(직접 쓴 별명) */
const MQ_URLS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081'];
function mqLoad(){ return new Promise((ok,no)=>{ if(window.mqtt) return ok(window.mqtt); const sc=document.createElement('script'); sc.src='https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js'; sc.onload=()=>ok(window.mqtt); sc.onerror=no; document.head.appendChild(sc); }); }
async function mqRoom(){ window.__mqs='load'; const lib=await mqLoad(); window.__mqs='loaded'; if(!lib) return null;
  const qs=new URLSearchParams(location.search), code=(qs.get('room')||'main').replace(/[^a-z0-9_-]/gi,'').slice(0,24)||'main', base='janya/v224/'+code+'/';
  const me=[...crypto.getRandomValues(new Uint8Array(9))].map(b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join(''); // ?seed가 Math.random을 고정하므로 crypto
  const urls=qs.get('mq')?[qs.get('mq')]:MQ_URLS; let cli=null;
  for(const u of urls){ window.__mqs='try '+u; try{ cli=await new Promise((ok,no)=>{ const c=lib.connect(u,{clientId:'jy_'+me,clean:true,keepalive:20,reconnectPeriod:2000,connectTimeout:12000,will:{topic:base+'p/'+me,payload:'',qos:0,retain:false}});
      const to=setTimeout(()=>{ try{c.end(true);}catch(e){} no("timeout"); },13000); c.once('connect',()=>{ clearTimeout(to); ok(c); }); c.once('error',()=>{ clearTimeout(to); try{c.end(true);}catch(e){} no('err'); }); }); break; }catch(e){ cli=null; } }
  window.__mqs=cli?'ok':'fail'; if(!cli) return null;
  let mine={}, conn=true; const others=new Map(), subs=new Set(); let snap=[], dirty=true, jn=[], lf=[], up=[];
  const mk=(id,pr,t)=>Object.freeze({peer:id,by:null,isMe:id===me,sameTab:id===me,kind:'viewer',guest:false,presence:Object.freeze(pr),updatedAt:t});
  let meP=mk(me,{},Date.now());
  const rebuild=()=>{ if(dirty){ snap=Object.freeze([meP,...[...others.values()].map(o=>o.p)]); dirty=false; } return snap; };
  let raf=0; const fire=()=>{ if(raf) return; raf=setTimeout(()=>{ raf=0; const ch={peers:rebuild(),joined:jn,left:lf,updated:up}; jn=[];lf=[];up=[]; for(const f of subs){ try{f(ch);}catch(e){} } },16); };
  const fields={}; let onF=null;
  const sigF=new Set(), sigT=base+'c/'+me;
  cli.on('connect',()=>{ conn=true; cli.subscribe(base+'p/+'); cli.subscribe(base+'f/+'); cli.subscribe(sigT); send(true); }); cli.on('close',()=>{ conn=false; });
  cli.subscribe(base+'p/+'); cli.subscribe(base+'f/+'); cli.subscribe(sigT);
  cli.on('message',(tp,buf)=>{ if(tp===sigT){ if(!buf||!buf.length||buf.length>16000) return; try{ const o=JSON.parse(new TextDecoder().decode(buf)); if(o&&typeof o==='object'&&typeof o.f==='string'&&o.f!==me) for(const f of sigF){ try{ f(o); }catch(e){ console.warn('sig',e); } } }catch(e){} return; }
    const id=tp.slice(tp.lastIndexOf('/')+1); if(tp.startsWith(base+'f/')){ if(!buf||!buf.length||buf.length>3000) return; try{ const o=JSON.parse(new TextDecoder().decode(buf)); if(o&&typeof o==='object'&&!Array.isArray(o)){ const fk=id.replace(/[^a-z0-9_-]/gi,'').slice(0,16); fields[fk]=o; if(onF&&o.id!==me) setTimeout(()=>{ try{ onF(fk); }catch(e){} },0); } }catch(e){} return; } if(!id||id===me) return; const now=Date.now(); let pr=null;
    if(buf&&buf.length){ if(buf.length>6000) return; try{ pr=JSON.parse(new TextDecoder().decode(buf)); }catch(e){ return; } if(!pr||typeof pr!=='object'||Array.isArray(pr)) return; }
    const o=others.get(id);
    if(!pr){ if(o){ others.delete(id); lf.push(o.p); dirty=true; fire(); } return; }
    if(!o){ const P=mk(id,pr,now); others.set(id,{p:P,seen:now,k:buf.length+':'+pr.a}); jn.push(P); dirty=true; fire(); send(true); return; }
    o.seen=now; const k=JSON.stringify(pr); if(k!==o.k){ o.k=k; o.p=mk(id,pr,now); up.push(o.p); dirty=true; fire(); } });
  let lastPub=0, lastStr='';
  function send(force){ const str=JSON.stringify(mine); const now=Date.now(); if(!force&&str===lastStr&&now-lastPub<2000) return; lastStr=str; lastPub=now; try{ cli.publish(base+'p/'+me,str,{qos:0}); }catch(e){} }
  setInterval(()=>{ send(false); const now=Date.now(); for(const [id,o] of others) if(now-o.seen>6500){ others.delete(id); lf.push(o.p); dirty=true; fire(); } },500);
  addEventListener('pagehide',()=>{ try{ cli.publish(base+'p/'+me,'',{qos:0}); cli.end(); }catch(e){} });
  let pend=0;
  const R={ presence(patch){ for(const k in patch){ if(patch[k]===null) delete mine[k]; else mine[k]=patch[k]; } meP=mk(me,{...mine},Date.now()); dirty=true; if(!pend){ pend=setTimeout(()=>{ pend=0; send(false); },100); } return Promise.resolve(); },
    peers(){ return rebuild(); }, onPeers(fn){ subs.add(fn); setTimeout(()=>{ try{ fn({peers:rebuild(),joined:rebuild(),left:[],updated:[]}); }catch(e){} },0); return ()=>subs.delete(fn); },
    connected(){ return conn&&cli.connected; }, emit(){ return Promise.resolve(); }, on(){ return ()=>{}; }, ext:true, me,
    sig(to,o){ const id=String(to).replace(/[^a-z0-9]/gi,'').slice(0,16); if(!id) return; const str=JSON.stringify({...o,f:me}); if(str.length>15000) return; try{ cli.publish(base+'c/'+id,str,{qos:1}); }catch(e){} }, onSig(fn){ sigF.add(fn); return ()=>sigF.delete(fn); },
    fieldGet(fk){ return fields[fk]||null; }, onField(fn){ onF=fn; for(const k in fields) if(fields[k]&&fields[k].id!==me) setTimeout(()=>{ try{ fn(k); }catch(e){} },0); }, fieldPut(fk,o){ const s=JSON.stringify(o); if(s.length>2800) return; fields[fk]=o; try{ cli.publish(base+'f/'+String(fk).replace(/[^a-z0-9_-]/gi,'').slice(0,16),s,{qos:0,retain:true}); }catch(e){} } };
  return R; }
// 밖에서 하는 판의 내 별명 (presence.nm) — 처음 한 번 묻는다
function extName(){ try{ return (JSON.parse(localStorage.getItem('janya_nm')||'""')||'').slice(0,10); }catch(e){ return ''; } }
function extAsk(done){ const n0=extName(); if(n0) return done(n0); const d=document.createElement('div'); d.id='nmAsk';
  d.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(5,8,14,.86);display:flex;align-items:center;justify-content:center;font-family:"Noto Sans KR",sans-serif';
  d.innerHTML='<div style="background:#1a2230;border:2px solid #5ad0ff;border-radius:16px;padding:22px 20px;width:min(86vw,320px);color:#e8f8ff;text-align:center"><div style="font-weight:800;font-size:19px;margin-bottom:6px">친구에게 보일 이름</div><div style="font-size:13px;opacity:.75;margin-bottom:14px">같은 링크로 들어온 사람끼리 같이 해요</div><input id="nmIn" maxlength="10" style="width:100%;box-sizing:border-box;font-size:18px;padding:10px;border-radius:10px;border:1px solid #5ad0ff;background:#0d131c;color:#fff;text-align:center"><button id="nmOk" style="margin-top:14px;width:100%;font-size:18px;font-weight:800;padding:11px;border:0;border-radius:10px;background:#5ad0ff;color:#08202c">시작</button></div>';
  document.body.appendChild(d); const inp=d.querySelector('#nmIn'); inp.value='나그네'+(10+crypto.getRandomValues(new Uint8Array(1))[0]%90);
  d.querySelector('#nmOk').onclick=()=>{ const n=(inp.value||'').trim().slice(0,10)||'나그네'; try{ localStorage.setItem('janya_nm',JSON.stringify(n)); }catch(e){} d.remove(); done(n); }; }
async function mpInit(){ try{ const C=window.claude; let room=null;
  if(C&&typeof C.use==='function') room=await C.use('room');
  else if(window.JANYA_EXT){ window.__mqs='ask'; const nm=await new Promise(r=>extAsk(r)); window.__mqs='named'; MP.myNm=nm; room=await mqRoom(); if(room){ MP.me=room.me; room.presence({nm}); } else toast('같이 하기 연결이 안 됐다','혼자 하는 판으로 돌아간다 · 와이파이를 바꿔 다시 열어 보기'); }
  if(!room) return; MP.room=room; MP.roomT=performance.now();
  if(room.onField) room.onField(fk=>{ if(S&&S.field===fk&&S.phase!=='over'&&S.t<12&&!S.inherited&&!MPF.bd) fieldInherit(fk); }); // 막 들어왔는데 남은 판 소식이 늦게 오면
  if(!room.ext){ try{ MP.user=await C.use('user'); }catch(e){ MP.user=null; } }
  room.onPeers(ch=>{ MP.online=ch.peers.filter(p=>p.kind==='viewer'&&!p.isMe).length; const me=ch.peers.find(p=>p.isMe&&p.sameTab); if(me) MP.me=me.peer; mpNames(ch.peers);
    if(MP.ready){ for(const p of ch.joined) if(!p.isMe&&p.kind==='viewer') mpAnnounce(p,1); for(const p of ch.left) if(!p.isMe&&p.kind==='viewer') mpAnnounce(p,0); } },()=>{ MP.room=null; mpClear(); });
  setTimeout(()=>{ MP.ready=true; const n=MP.online; if(n) toast(`👥 지금 ${n}명이 접속해 있다`,'서로 모르는 곳에서 각자 자란다 · 보스 불씨는 먼저 줍는 사람 것'); },3000); }catch(e){ MP.room=null; console.warn("mpInit",e); } }
setTimeout(mpInit,0);
// v2.28 접속자 수: 전체(나 포함) · 곳마다 — 거점 줄·필드 위 👥 · 지역 고를 때 「👥 N명」
function mpCount(){ const ps=(MP.room?MP.room.peers():[]).filter(p=>p.kind==='viewer'); const by={}; for(const p of ps){ const a=p.isMe&&p.sameTab?mpArea():String((p.presence&&p.presence.a)||'hub'); by[a]=(by[a]||0)+1; } return {n:ps.length,by,on:!!MP.room}; }
function mpHere(a){ const c=mpCount(); if(!c.on) return ''; const n=(c.by[a]||0)+(a==='w'?(c.by.r||0):0); const pm=ptMembers().filter(p=>{ const x=String(p.presence.a||'hub'); return x===a||(a==='w'&&x==='r'); }).map(p=>mpName(p)); return ` · <span style="color:${n?'#5ad0ff':'#8a96a6'}">👥 ${n}명</span>${pm.length?` <span style="color:#7be38a">🤝 ${pm.join('·')}</span>`:''}`; }
function mpOnlineUI(){ const c=mpCount(), b=$('bOn'), h=$('hOn'); if(!b||!h) return;
  if(!c.on){ b.style.display='none'; h.style.display='none'; return; }
  const t='👥'+c.n; if(b.textContent!==t) b.textContent=t; b.style.display=c.n>1?'':'none'; const ht=` · 👥 지금 ${c.n}명 접속`; if(h.textContent!==ht) h.textContent=ht; h.style.display=''; }
setInterval(mpOnlineUI,1000);

/* ============ v2.29 파티(두 판 다) · 음성 통화(GitHub 판만) ============
   파티: presence로 청하고 받는다 — pt(파티 이름표) · pi=[받을 사람, pt](청함) · pn=[청한 사람, pt](사양) · 3시간 동안 다시 열어도 이어짐(janya_pt) · 4명까지
   파티원끼리는 서로 덮치지 않는다 · 곁(같은 곳 14칸 안)이면 경험 +TU('ptxp') · 작은 지도·머리 위 이름이 초록
   통화: WebRTC 음성 1:1 · 신호는 MQTT c/<상대> (ring·acc·rej·busy·sdp·ice·bye) · STUN만(중계 서버 없음 — 데이터끼리는 안 될 수 있음) */
const PTY={id:'',inv:null,ans:{},no:null,ask:null,near:false};
try{ const o=JSON.parse(localStorage.getItem('janya_pt')||'null'); if(o&&typeof o.id==='string'&&Date.now()-(+o.t||0)<3*3600e3) PTY.id=o.id.replace(/[^a-z0-9]/gi,'').slice(0,10); }catch(e){}
function ptSave(){ try{ localStorage.setItem('janya_pt',JSON.stringify({id:PTY.id,t:Date.now()})); }catch(e){} }
const ptOf=p=>p&&p.presence&&typeof p.presence.pt==='string'?p.presence.pt:'';
const ptRaw=p=>!!(PTY.id&&ptOf(p)===PTY.id);
// v2.31 (기획자 11-17 05:35 ㄱ): 파이널이 쓰러지면 파티는 잠시 풀린다 — 불씨는 하나. 판이 끝나면 다시 한 파티
const ptBroke=()=>!!(S&&S.ptBroke&&S.phase==='play');
const isParty=p=>ptRaw(p)&&!ptBroke();
function ptMembers(){ return PTY.id?mpPeers().filter(isParty):[]; }
const rid=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');
function ptInvite(peer){ const p=mpPeers().find(q=>q.peer===peer); if(!p) return toast('그 사람이 지금 안 보인다'); cardClose();
  if(isParty(p)) return toast(`🤝 ${mpName(p)}와 이미 한 파티`); if(PTY.id&&ptMembers().length>=3) return toast('파티가 꽉 찼다','4명까지');
  PTY.inv={to:p.peer,pt:PTY.id||rid(8),t:Date.now()}; toast(`🤝 ${mpName(p)}에게 파티를 청했다`,'상대가 「맺기」를 누르면 한 파티 · ⚠ 파이널을 잡으면 풀린다'); if(MP.lastKey) MP.lastKey=''; }
function ptLeave(){ if(!PTY.id) return; PTY.id=''; ptSave(); toast('파티에서 나왔다'); pplRefresh(); }
function ptPresence(st){ st.pt=PTY.id||null; st.pv=PV.on?1:0; st.pi=PTY.inv?[PTY.inv.to,PTY.inv.pt,Math.floor(PTY.inv.t/1000)%1e6]:null; st.pn=PTY.no?[PTY.no.to,PTY.no.pt]:null; return st; }
// 작은 물음 상자(파티 청함·전화 옴) — 게임은 멈추지 않는다
function askBox(id,html,btns,ms){ let d=$(id); if(d) d.remove(); d=document.createElement('div'); d.id=id; d.className='askB'; d.innerHTML=html+'<div class="askR"></div>'; const R=d.querySelector('.askR');
  for(const [t,cls,fn] of btns){ const b=document.createElement('div'); b.className='btn '+cls; b.textContent=t; b.onpointerdown=e=>{ e.preventDefault(); e.stopPropagation(); d.remove(); clearTimeout(d._t); fn(); }; R.appendChild(b); }
  document.body.appendChild(d); if(ms) d._t=setTimeout(()=>{ if(d.isConnected){ d.remove(); const last=btns[btns.length-1]; if(last&&last[3]) last[3](); } },ms); return d; }
function ptAsk(p,pt){ const nm=mpName(p); PTY.ask=pt; if(navigator.vibrate) try{ navigator.vibrate([60,40,60]); }catch(e){}
  askBox('ptAskB',`<b>🤝 ${nm}가 파티를 맺자고 한다</b><small>파티원끼리는 서로 덮치지 않고 · 곁에 있으면 경험 +${Math.round(TU('ptxp')*100)}%<br>⚠ 파이널을 잡으면 파티가 풀린다 · 불씨는 하나</small>`,
    [['맺기','big',()=>{ PTY.ask=null; PTY.id=pt; PTY.inv=null; ptSave(); toast(`🤝 ${nm}와 파티를 맺었다`,'서로 덮치지 않는다 · ⚠ 파이널을 잡으면 풀린다 — 불씨는 하나'); pplRefresh(); }],
     ['아니','',()=>{ PTY.ask=null; PTY.no={to:p.peer,pt,t:Date.now()}; },()=>{ PTY.ask=null; }]],30000); }
function ptTick(){ if(!MP.room&&!DBG.fakePeers) return; const now=Date.now(), ps=mpPeers();
  const I=PTY.inv; if(I){ const q=ps.find(p=>p.peer===I.to);
    if(q&&ptOf(q)===I.pt){ PTY.id=I.pt; ptSave(); PTY.inv=null; toast(`🤝 ${mpName(q)}와 파티를 맺었다`,'서로 덮치지 않는다 · 곁에 있으면 경험 +'+Math.round(TU('ptxp')*100)+'%'); try{ sfx.lvl(); }catch(e){} pplRefresh(); }
    else if(q&&Array.isArray(q.presence.pn)&&q.presence.pn[0]===MP.me&&q.presence.pn[1]===I.pt){ PTY.inv=null; toast(`${mpName(q)}가 파티를 사양했다`); }
    else if(!q||now-I.t>40000){ PTY.inv=null; if(q) toast(`${mpName(q)}가 답이 없다`,'파티 청함을 거둔다'); } }
  if(!PTY.ask) for(const p of ps){ const pi=p.presence.pi; if(!Array.isArray(pi)||pi[0]!==MP.me||typeof pi[1]!=='string') continue; const pt=pi[1].replace(/[^a-z0-9]/gi,'').slice(0,10), k=p.peer+':'+pt+':'+(pi[2]|0); if(!pt||PTY.ans[k]) continue; PTY.ans[k]=1; if(pt===PTY.id) continue; ptAsk(p,pt); break; }
  if(PTY.no&&now-PTY.no.t>8000) PTY.no=null; }
setInterval(()=>{ try{ ptTick(); }catch(e){ console.warn('pty',e); } },400);

/* ---- 음성 통화 ---- */
const CALL={log:[],last:null,out:0,reT0:0,st:'',peer:'',nm:'',id:'',pc:null,ms:null,q:[],t0:0,mute:false,ringT:0,gone:0,ring:null};
const canCall=()=>!!(MP.room&&MP.room.ext&&MP.room.sig&&window.RTCPeerConnection&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
// v2.61: 휴대폰 데이터끼리는 STUN만으로 길이 안 뚫릴 때가 많다 → 중계(TURN) 열쇠가 빌드에 들어 있으면(window.JANYA_ICE) 같이 쓴다
const ICE_CFG={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun.cloudflare.com:3478']},...(Array.isArray(window.JANYA_ICE)?window.JANYA_ICE:[])]};
/* v2.61 (11-19 기획자 「연결은 됐는데 목소리가 안 들렸어」): ① 소리 재생이 막히면(휴대폰이 「사람이 눌러야 소리」로 막음) 크게 「🔊 소리 켜기」 + 화면 어디를 눌러도 다시 틂
   ② 통화 중 1초마다 소리가 오가는지 잰다(getStats) → 막대에 🔊/🔈 · 8초 넘게 안 오면 까닭을 알려 줌 */
function audKick(){ let ok=0; for(const a of document.querySelectorAll('#callAu,audio[id^=pvAu_]')){ if(a.srcObject&&(a.paused||CALL.needTap||PV.needTap)){ try{ a.play().then(()=>{ if(CALL.needTap||PV.needTap){ CALL.needTap=0; PV.needTap=0; const B=$('sndB'); if(B) B.remove(); callUI(); pvUI(); toast('🔊 소리를 켰다'); } }).catch(()=>{}); }catch(e){} } else if(a.srcObject) ok++; } return ok; }
function audBlocked(){ if($('sndB')) return; buzz([60,40,60]); askBox('sndB','<b>🔊 상대 목소리를 틀려면 눌러 주세요</b><small>휴대폰이 「한 번 눌러야 소리」로 막았다</small>',[['🔊 소리 켜기','big call',()=>{ audKick(); }]],20000); }
addEventListener('pointerdown',()=>{ if(CALL.needTap||PV.needTap) audKick(); },true);
const AUD={inE:0,inP:0,outE:0,quietIn:0,quietOut:0,told:'',rel:''};
async function audMeter(){ const pc=CALL.pc; if(!pc||CALL.st!=='on'){ AUD.quietIn=AUD.quietOut=0; AUD.told=''; AUD.inP=AUD.inE=AUD.outE=0; AUD.hear=false; return; } let st; try{ st=await pc.getStats(); }catch(e){ return; }
  let inE=null,inP=null,outE=null,lv=0; st.forEach(r=>{ if(r.type==='inbound-rtp'&&(r.kind==='audio'||r.mediaType==='audio')){ inP=r.packetsReceived||0; if(typeof r.totalAudioEnergy==='number') inE=r.totalAudioEnergy; if(typeof r.audioLevel==='number') lv=r.audioLevel; }
    if(r.type==='media-source'&&r.kind==='audio'&&typeof r.totalAudioEnergy==='number') outE=r.totalAudioEnergy;
    if(r.type==='candidate-pair'&&r.nominated&&r.state==='succeeded'){ const lc=st.get(r.localCandidateId); if(lc) AUD.rel=lc.candidateType==='relay'?'중계':'바로'; } });
  const dP=inP!=null?inP-AUD.inP:0, dE=inE!=null?inE-AUD.inE:0, dO=outE!=null?outE-AUD.outE:-1; if(inP!=null) AUD.inP=inP; if(inE!=null) AUD.inE=inE; if(outE!=null) AUD.outE=outE;
  AUD.hear=dP>0&&(dE>1e-5||lv>.01); AUD.quietIn=AUD.hear?0:AUD.quietIn+1; AUD.quietOut=(dO>=0&&dO<1e-6&&!CALL.mute)?AUD.quietOut+1:0; AUD.noPk=dP<=0;
  if(AUD.quietIn>=8&&AUD.told!=='in'){ AUD.told='in'; toast(AUD.noPk?'🔈 상대 소리가 오지 않는다':'🔈 상대 쪽이 조용하다',AUD.noPk?'길이 막혔다 · 와이파이로 바꾸거나 📞 다시 걸기':`${CALL.nm}의 마이크가 꺼졌거나(🔇) 휴대폰이 마이크를 막았다`); }
  if(AUD.quietOut>=8&&AUD.told!=='out'){ AUD.told='out'; toast('🎤 내 마이크 소리가 안 나간다','다른 앱이 마이크를 쓰는지 · 브라우저 마이크 허락 보기'); } }
setInterval(()=>{ audMeter().catch(()=>{}); },1000);
const callSig=(k,o={})=>{ if(MP.room&&MP.room.sig&&CALL.peer) MP.room.sig(CALL.peer,{k,id:CALL.id,...o}); };
async function callMic(){ try{ return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false}); }catch(e){ toast('🎤 마이크를 쓸 수 없다','브라우저에서 마이크를 허락해야 통화가 된다'); return null; } }
async function callStart(peer){ cardClose(); if(!canCall()) return toast('📞 전화는 GitHub 판에서만 된다','vera-architect.github.io/janya-play'); if(CALL.st) return toast('이미 통화 중이다'); if(PV.on) return toast('🎙 파티 음성 중이다','파티원과는 이미 이야기하는 중 · ✕로 나와서 걸기');
  const p=mpPeers().find(q=>q.peer===peer); if(!p) return toast('그 사람이 지금 안 보인다');
  CALL.st='mic'; const ms=await callMic(); if(!ms){ CALL.st=''; return; } if(CALL.st!=='mic'){ ms.getTracks().forEach(t=>t.stop()); return; }
  Object.assign(CALL,{st:'out',out:1,peer,nm:mpName(p),id:rid(6),ms,q:[],mute:false,gone:0,t0:0,last:null}); callSig('ring',{nm:MP.myNm||''}); callUI();
  clearTimeout(CALL.ringT); CALL.ringT=setTimeout(()=>{ if(CALL.st==='out') callEnd(`${CALL.nm}가 받지 않았다`); },30000); }
function callPc(){ const pc=new RTCPeerConnection(ICE_CFG); CALL.pc=pc; for(const t of CALL.ms.getTracks()) pc.addTrack(t,CALL.ms);
  pc.onicecandidate=e=>{ if(e.candidate) callSig('ice',{c:e.candidate.toJSON()}); };
  pc.ontrack=e=>{ const au=callAu(); au.srcObject=e.streams[0]||new MediaStream([e.track]); const pl=au.play(); if(pl&&pl.catch) pl.catch(()=>{ CALL.needTap=1; callUI(); audBlocked(); }); };
  pc.onconnectionstatechange=()=>{ const s=pc.connectionState; if(pc!==CALL.pc) return;
    if(s==='connected'&&CALL.st==='re'){ CALL.st='on'; toast('📞 다시 이어졌다'); callUI(); }
    else if((s==='disconnected'||s==='failed')&&(CALL.st==='on'||CALL.st==='re')) callRe();
    else if(s==='connected'&&CALL.st!=='on'){ CALL.st='on'; CALL.t0=performance.now(); clearTimeout(CALL.ringT); callDuck(true); toast(`📞 ${CALL.nm}와 연결됐다`,'이어폰을 끼면 게임 소리가 안 넘어간다'); callUI(); }
    else if(s==='failed') callEnd('📞 연결이 안 됐다','와이파이에서 다시 해 보기 · 휴대폰 데이터끼리는 막힐 때가 있다');
    else if(s==='disconnected'){ setTimeout(()=>{ if(CALL.pc===pc&&pc.connectionState==='disconnected') callEnd('📞 연결이 끊겼다'); },6000); } };
  return pc; }
// 다시 잇기: 돌아다니다 와이파이↔데이터가 바뀌면 길이 끊긴다 → 건 쪽이 ICE를 새로 열고, 받은 쪽은 rst로 부탁 · 25초 안에 못 이으면 끝
async function callRestart(){ const pc=CALL.pc; if(!pc||!CALL.out||pc.signalingState==='closed') return; try{ if(pc.restartIce) pc.restartIce(); const of=await pc.createOffer({iceRestart:true}); await pc.setLocalDescription(of); callSig('sdp',{d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}); }catch(e){ console.warn('restart',e); } }
function callRe(){ if(CALL.st!=='on'&&CALL.st!=='re') return; if(CALL.st!=='re'){ CALL.st='re'; CALL.reT0=performance.now(); toast('📞 연결이 흔들린다 · 다시 잇는 중','돌아다니다 와이파이↔데이터가 바뀌면 그럴 수 있다'); callUI(); }
  if(CALL.out) callRestart(); else callSig('rst');
  clearTimeout(CALL.reT); CALL.reT=setTimeout(function chk(){ if(CALL.st!=='re') return; if(CALL.pc&&CALL.pc.connectionState==='connected'){ CALL.st='on'; toast('📞 다시 이어졌다'); callUI(); return; } if(performance.now()-CALL.reT0>25000) return callEnd('📞 연결이 끊겼다','망이 바뀌었거나 신호가 약했다 · 📞 다시 걸기',true,'net','연결 끊김');
    if(CALL.out) callRestart(); else callSig('rst'); CALL.reT=setTimeout(chk,6000); },6000); }
addEventListener('visibilitychange',()=>{ if(!document.hidden&&(CALL.st==='on'||CALL.st==='re')&&CALL.pc&&CALL.pc.connectionState!=='connected') callRe(); });
async function callFlush(){ const pc=CALL.pc; if(!pc||!pc.remoteDescription) return; const q=CALL.q.splice(0); for(const c of q){ try{ await pc.addIceCandidate(c); }catch(e){} } }
function callAu(){ let a=$('callAu'); if(!a){ a=document.createElement('audio'); a.id='callAu'; a.autoplay=true; a.setAttribute('playsinline',''); document.body.appendChild(a); } return a; }
function callDuck(on){ try{ if(SND.master&&SND.on) SND.master.gain.value=on?.22:.7; }catch(e){} }
function callRing(on){ clearInterval(CALL.ring); CALL.ring=null; if(!on) return; const beep=()=>{ try{ const c=SND.ctx; if(c){ const t=c.currentTime; for(const [f,d] of [[660,0],[880,.18]]){ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0,t+d); g.gain.linearRampToValueAtTime(.12,t+d+.02); g.gain.exponentialRampToValueAtTime(.0001,t+d+.16); o.connect(g); g.connect(c.destination); o.start(t+d); o.stop(t+d+.2); } } if(navigator.vibrate) navigator.vibrate([120,80,120]); }catch(e){} }; beep(); CALL.ring=setInterval(beep,1800); }
function callEnd(msg,sub='',tell=true,r='hang',why=''){ if(!CALL.st) return; if(tell) callSig('bye',{r}); clearTimeout(CALL.ringT); clearTimeout(CALL.reT); callRing(false);
  const talked=CALL.t0&&(CALL.st==='on'||CALL.st==='re'), dur=talked?mmss((performance.now()-CALL.t0)/1000):'', w=why||String(msg||'').replace(/^📞\s*/,'');
  if(CALL.peer&&CALL.nm){ const d=new Date(); CALL.log.unshift({tm:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),nm:CALL.nm,dur,why:w}); CALL.log.length=Math.min(CALL.log.length,3);
    if(talked||CALL.st==='out'){ CALL.last={peer:CALL.peer,nm:CALL.nm,why:w,dur,until:performance.now()+7000}; callBeepEnd(); } }
  try{ if(CALL.pc) CALL.pc.close(); }catch(e){} try{ if(CALL.ms) CALL.ms.getTracks().forEach(t=>t.stop()); }catch(e){} const a=$('callAu'); if(a){ try{ a.pause(); }catch(e){} a.srcObject=null; }
  const B=$('callInB'); if(B) B.remove(); { const sb=$('sndB'); if(sb&&!PV.on) sb.remove(); } Object.assign(CALL,{st:'',pc:null,ms:null,q:[],peer:'',id:'',needTap:0}); callDuck(false); callUI(); if(msg) toast(msg,sub); }
function callBeepEnd(){ try{ const c=SND.ctx; if(c){ const t=c.currentTime; for(const d of [0,.32]){ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=480; g.gain.setValueAtTime(0,t+d); g.gain.linearRampToValueAtTime(.1,t+d+.02); g.gain.setValueAtTime(.1,t+d+.2); g.gain.linearRampToValueAtTime(0,t+d+.24); o.connect(g); g.connect(c.destination); o.start(t+d); o.stop(t+d+.26); } } if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){} }
async function callAccept(){ callRing(false); CALL.st='mic'; const ms=await callMic(); if(!ms){ callSig('rej'); Object.assign(CALL,{st:'',peer:'',id:''}); callUI(); return; }
  if(CALL.st!=='mic'){ ms.getTracks().forEach(t=>t.stop()); return; } CALL.ms=ms; CALL.st='conn'; callSig('acc'); callUI();
  clearTimeout(CALL.ringT); CALL.ringT=setTimeout(()=>{ if(CALL.st==='conn') callEnd('📞 연결이 안 됐다','와이파이에서 다시 해 보기'); },25000); }
async function callOnSig(o){ const k=o.k; if(k==='pv') return pvOnSig(o); if(DBG.clog) console.log('call sig '+k+' st='+CALL.st+' id='+o.id+'/'+CALL.id+' f='+o.f+'/'+CALL.peer);
  if(k==='ring'){ if(CALL.st){ if(MP.room) MP.room.sig(o.f,{k:'busy',id:o.id}); return; }
    const p=mpPeers().find(q=>q.peer===o.f); const nm=p?mpName(p):(typeof o.nm==='string'?o.nm.replace(/[<>&"']/g,'').slice(0,10):'')||'누군가';
    Object.assign(CALL,{st:'in',out:0,peer:o.f,nm,id:String(o.id||'').slice(0,8),q:[],mute:false,gone:0,t0:0,last:null}); callRing(true); callUI();
    askBox('callInB',`<b>📞 ${nm}의 전화</b><small>받으면 마이크 허락 창이 뜬다 · 이어폰 권장</small>`,[['받기','big call',()=>callAccept()],['거절','',()=>{ callSig('rej'); callRing(false); Object.assign(CALL,{st:'',peer:'',id:''}); callUI(); },()=>{ if(CALL.st==='in'){ callRing(false); const n=CALL.nm; Object.assign(CALL,{st:'',peer:'',id:''}); callUI(); toast(`📞 ${n}의 전화를 놓쳤다`); } }]],30000); return; }
  if(o.f!==CALL.peer||String(o.id||'')!==CALL.id) return;
  if(k==='bye'){ const B=$('callInB'); if(B) B.remove(); const n=CALL.nm;
    if(CALL.st==='in') callEnd(`📞 ${n}가 전화를 거뒀다`,'',false,'',`${n}가 거둠`);
    else if(o.r==='leave') callEnd(`📞 ${n}가 게임을 닫았다`,'창을 닫았거나 다른 곳으로 넘어감',false,'',`${n}가 게임을 닫음`);
    else if(o.r==='net') callEnd(`📞 ${n} 쪽 연결이 끊겼다`,'망이 바뀌었거나 신호가 약했다 · 📞 다시 걸기',false,'',`연결 끊김`);
    else callEnd(`📞 ${n}가 전화를 끊었다`,'',false,'',`${n}가 끊음`); return; }
  if(k==='rst'&&CALL.out&&(CALL.st==='on'||CALL.st==='re')){ callRe(); return; }
  if(k==='rej'&&CALL.st==='out') return callEnd(`📞 ${CALL.nm}가 지금은 못 받는다`,'',false);
  if(k==='busy'&&CALL.st==='out') return callEnd(`📞 ${CALL.nm}는 통화 중이다`,'',false);
  if(k==='acc'&&CALL.st==='out'){ CALL.st='conn'; callUI(); const pc=callPc(); try{ const of=await pc.createOffer(); await pc.setLocalDescription(of); callSig('sdp',{d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}); }catch(e){ callEnd('📞 연결이 안 됐다'); }
    clearTimeout(CALL.ringT); CALL.ringT=setTimeout(()=>{ if(CALL.st==='conn') callEnd('📞 연결이 안 됐다','와이파이에서 다시 해 보기 · 휴대폰 데이터끼리는 막힐 때가 있다'); },25000); return; }
  if(k==='sdp'&&o.d&&typeof o.d.sdp==='string'){ try{ if(o.d.type==='offer'&&(CALL.st==='conn'||((CALL.st==='on'||CALL.st==='re')&&CALL.pc))){ const pc=CALL.pc||callPc(); await pc.setRemoteDescription(o.d); await callFlush(); const an=await pc.createAnswer(); await pc.setLocalDescription(an); callSig('sdp',{d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}); }
      else if(o.d.type==='answer'&&CALL.pc){ await CALL.pc.setRemoteDescription(o.d); await callFlush(); } }catch(e){ console.warn('sdp',e); callEnd('📞 연결이 안 됐다'); } return; }
  if(k==='ice'&&o.c){ if(CALL.pc&&CALL.pc.remoteDescription){ try{ await CALL.pc.addIceCandidate(o.c); }catch(e){} } else if(CALL.q.length<60) CALL.q.push(o.c); } }
function callUI(){ const b=$('callBar'); if(!b) return; const st=CALL.st, L=CALL.last, ended=!st&&L&&performance.now()<L.until;
  b.style.display=ended||(st&&st!=='in'&&st!=='mic')?'flex':'none'; b.classList.toggle('ended',!!ended); b.classList.toggle('re',st==='re');
  if(ended){ $('cbN').textContent=L.nm; $('cbT').textContent=L.why+(L.dur?' · '+L.dur:''); return; } if(!st||st==='in'||st==='mic') return;
  $('cbN').textContent=CALL.nm; const p=mpPeers().find(q=>q.peer===CALL.peer);
  $('cbT').textContent=CALL.needTap?'소리 켜기 👆':st==='out'?'거는 중…':st==='conn'?'잇는 중…':st==='re'?'다시 잇는 중…':CALL.gone>3?'신호 기다리는 중…':mmss((performance.now()-CALL.t0)/1000)+(AUD.quietIn>=3?' 🔈':AUD.hear?' 🔊':'');
  $('cbMute').textContent=CALL.mute?'🔇':'🎤'; $('cbMute').classList.toggle('off',CALL.mute); const pt=p&&isParty(p); $('cbPty').textContent=pt?'🤝✓':PTY.inv&&PTY.inv.to===CALL.peer?'🤝…':'🤝'; $('cbPty').classList.toggle('on',!!pt); b.classList.toggle('live',st==='on'); }
setInterval(()=>{ if(!CALL.st){ if(CALL.last){ callUI(); if(performance.now()>CALL.last.until) CALL.last=null; } return; } callUI(); if(CALL.st==='in'||CALL.st==='mic') return; const here=mpPeers().some(q=>q.peer===CALL.peer); CALL.gone=here?0:CALL.gone+1;
  const lim=CALL.st==='on'||CALL.st==='re'?30:9; if(CALL.gone>=lim) callEnd(`📞 ${CALL.nm} 연결이 끊겼다`,'상대 쪽 신호가 끊겼다 · 📞 다시 걸기',true,'net','상대 신호 끊김'); },1000);
addEventListener('pagehide',()=>{ if(CALL.st) callSig('bye',{r:'leave'}); });
/* ============ v2.31 파티 음성방 (기획자 11-17 05:30 「파티가 동시통화가 가능해야겠네」) ============
   파티원끼리 최대 4명이 한꺼번에 말한다. 각자 「🎙 파티 음성」을 켜면 켠 사람끼리 서로 이어진다(그물 연결, 셋까지).
   신호는 1:1 전화와 같은 길(c/<id>)에 k:'pv'. 이름이 앞선 쪽이 먼저 건다. 쟁탈로 파티가 잠시 풀려도 음성은 이어진다. */
const PV={on:false,ms:null,pcs:new Map(),mute:false,q:new Map()};
const pvSig=(to,o)=>{ if(MP.room&&MP.room.sig) MP.room.sig(to,{k:'pv',...o}); };
function pvMates(){ return mpPeers().filter(p=>ptRaw(p)&&p.presence&&p.presence.pv===1); }
function pvAu(peer){ const id='pvAu_'+peer.replace(/[^a-z0-9]/gi,''); let a=$(id); if(!a){ a=document.createElement('audio'); a.id=id; a.autoplay=true; a.setAttribute('playsinline',''); document.body.appendChild(a); } return a; }
function pvPc(peer){ const pc=new RTCPeerConnection(ICE_CFG); pc._t0=Date.now(); PV.pcs.set(peer,pc); for(const t of PV.ms.getTracks()) pc.addTrack(t,PV.ms);
  pc.onicecandidate=e=>{ if(e.candidate) pvSig(peer,{t:'ice',c:e.candidate.toJSON()}); };
  pc.ontrack=e=>{ const au=pvAu(peer); au.srcObject=e.streams[0]||new MediaStream([e.track]); const pl=au.play(); if(pl&&pl.catch) pl.catch(()=>{ PV.needTap=1; pvUI(); audBlocked(); }); };
  pc.onconnectionstatechange=()=>{ const s=pc.connectionState; if(s==='connected'){ const p=mpPeers().find(q=>q.peer===peer); toast(`🎙 ${p?mpName(p):'파티원'}와 음성이 이어졌다`); } if(s==='failed'){ pvDrop(peer); } pvUI(); };
  return pc; }
function pvDrop(peer){ const pc=PV.pcs.get(peer); if(pc){ try{ pc.close(); }catch(e){} PV.pcs.delete(peer); } PV.q.delete(peer); const a=$('pvAu_'+peer.replace(/[^a-z0-9]/gi,'')); if(a){ a.srcObject=null; a.remove(); } }
async function pvJoin(){ if(!canCall()) return toast('🎙 파티 음성은 GitHub 판에서만 된다'); if(!PTY.id) return toast('먼저 파티를 맺어야 한다'); if(CALL.st) return toast('1:1 통화를 끊고 들어오기'); if(PV.on) return;
  const ms=await callMic(); if(!ms) return; PV.ms=ms; PV.on=true; PV.mute=false; callDuck(true); toast('🎙 파티 음성에 들어왔다','음성을 켠 파티원끼리 이어진다 · 4명까지'); if(MP.lastKey) MP.lastKey=''; pvUI(); pplRefresh(); }
function pvLeave(why){ if(!PV.on) return; for(const peer of [...PV.pcs.keys()]){ pvSig(peer,{t:'bye'}); pvDrop(peer); } try{ PV.ms.getTracks().forEach(t=>t.stop()); }catch(e){} PV.ms=null; PV.on=false; callDuck(!!CALL.st&&CALL.st==='on'); if(why) toast(why); if(MP.lastKey) MP.lastKey=''; pvUI(); pplRefresh(); }
function pvMute(){ if(!PV.ms) return; PV.mute=!PV.mute; PV.ms.getAudioTracks().forEach(t=>t.enabled=!PV.mute); pvUI(); }
async function pvTick(){ if(!PV.on) return; if(!PTY.id) return pvLeave('🎙 파티가 없어 음성에서 나왔다'); const M=pvMates(), ids=new Set(M.map(p=>p.peer));
  for(const [peer,pc] of [...PV.pcs]) if(!ids.has(peer)||(pc.connectionState!=='connected'&&Date.now()-pc._t0>12000)) pvDrop(peer);
  for(const p of M.slice(0,3)){ if(PV.pcs.has(p.peer)||!MP.me||MP.me>p.peer) continue; const pc=pvPc(p.peer); try{ const of=await pc.createOffer(); await pc.setLocalDescription(of); pvSig(p.peer,{t:'sdp',d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}); }catch(e){ pvDrop(p.peer); } }
  pvUI(); }
async function pvOnSig(o){ const peer=o.f; if(!peer) return; if(o.t==='bye'){ pvDrop(peer); pvUI(); return; } if(!PV.on) return; const p=mpPeers().find(q=>q.peer===peer); if(!p||!ptRaw(p)) return;
  if(o.t==='sdp'&&o.d&&typeof o.d.sdp==='string'){ try{ if(o.d.type==='offer'){ if(PV.pcs.has(peer)) pvDrop(peer); if(PV.pcs.size>=3) return; const pc=pvPc(peer); await pc.setRemoteDescription(o.d); await pvFlush(peer); const an=await pc.createAnswer(); await pc.setLocalDescription(an); pvSig(peer,{t:'sdp',d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}); }
      else if(o.d.type==='answer'){ const pc=PV.pcs.get(peer); if(pc){ await pc.setRemoteDescription(o.d); await pvFlush(peer); } } }catch(e){ console.warn('pv sdp',e); pvDrop(peer); } return; }
  if(o.t==='ice'&&o.c){ const pc=PV.pcs.get(peer); if(pc&&pc.remoteDescription){ try{ await pc.addIceCandidate(o.c); }catch(e){} } else { const q=PV.q.get(peer)||[]; if(q.length<60) q.push(o.c); PV.q.set(peer,q); } } }
async function pvFlush(peer){ const pc=PV.pcs.get(peer), q=PV.q.get(peer)||[]; PV.q.delete(peer); for(const c of q){ try{ await pc.addIceCandidate(c); }catch(e){} } }
function pvUI(){ let b=$('pvBar'); if(!b){ b=document.createElement('div'); b.id='pvBar'; b.innerHTML='<span id="pvN"></span><span id="pvM">🎤</span><span id="pvX">✕</span>'; document.body.appendChild(b);
    const on=(id,fn)=>$(id).addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); fn(); }); on('pvM',pvMute); on('pvX',()=>pvLeave('🎙 파티 음성에서 나왔다')); on('pvN',()=>{ if(PV.needTap){ PV.needTap=0; document.querySelectorAll('audio[id^=pvAu_]').forEach(a=>a.play().catch(()=>{})); pvUI(); } }); }
  b.style.display=PV.on?'flex':'none'; if(!PV.on) return; let n=0; for(const pc of PV.pcs.values()) if(pc.connectionState==='connected') n++;
  $('pvN').textContent=PV.needTap?'소리 켜기 👆':`🎙 파티 ${n+1}명`+(pvMates().length>n?' · 잇는 중':''); $('pvM').textContent=PV.mute?'🔇':'🎤'; $('pvM').classList.toggle('off',PV.mute); b.style.top=($('callBar')&&$('callBar').style.display==='flex')?'262px':'172px'; }
setInterval(()=>{ pvTick().catch(e=>console.warn('pv',e)); },1500);
addEventListener('pagehide',()=>{ if(PV.on) for(const peer of PV.pcs.keys()) pvSig(peer,{t:'bye'}); });
{ const st=document.createElement('style'); st.textContent='#pvBar{position:fixed;right:8px;top:172px;z-index:41;display:none;gap:6px;align-items:center;padding:6px 8px;border-radius:14px;background:rgba(10,30,16,.9);border:2px solid #7be38a;color:#eaffee;font-size:12px}#pvBar span{cursor:pointer}#pvBar #pvM,#pvBar #pvX{background:rgba(255,255,255,.1);border-radius:8px;padding:3px 6px}#pvBar #pvM.off{opacity:.5}'; document.head.appendChild(st); }
function callInit(){ if(!MP.room||!MP.room.onSig||CALL.on) return; CALL.on=1; MP.room.onSig(o=>{ callOnSig(o).catch(e=>console.warn('call',e)); }); }
setInterval(callInit,1000);
{ const b=document.createElement('div'); b.id='callBar'; b.innerHTML='<div class="cn">📞 <b id="cbN"></b></div><div id="cbT"></div><div class="cbb"><span id="cbMute">🎤</span><span id="cbPty">🤝</span><span id="cbEnd">✕</span></div><div class="cbe"><span id="cbRe">📞 다시</span><span id="cbX">닫기</span></div>'; document.body.appendChild(b);
  const on=(id,fn)=>$(id).addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); fn(); });
  on('cbEnd',()=>callEnd(CALL.st==='on'||CALL.st==='re'?'📞 전화를 끊었다':'📞 전화를 거뒀다','',true,'hang','내가 끊음'));
  on('cbRe',()=>{ const L=CALL.last; CALL.last=null; callUI(); if(L) callStart(L.peer); });
  on('cbX',()=>{ CALL.last=null; callUI(); });
  on('cbMute',()=>{ CALL.mute=!CALL.mute; try{ CALL.ms&&CALL.ms.getAudioTracks().forEach(t=>t.enabled=!CALL.mute); }catch(e){} toast(CALL.mute?'🔇 내 마이크 끔':'🎤 내 마이크 켬'); callUI(); });
  on('cbPty',()=>{ const p=mpPeers().find(q=>q.peer===CALL.peer); if(p&&isParty(p)) return toast(`🤝 ${CALL.nm}와 한 파티`,'메뉴 → 접속한 사람에서 파티 나가기'); ptInvite(CALL.peer); callUI(); });
  on('cbT',()=>{ if(CALL.needTap){ CALL.needTap=0; const a=$('callAu'); if(a) a.play().catch(()=>{}); callUI(); } }); }

/* ---- 사람 카드: 친구 캐릭터를 톡 → 전화·파티 ---- */
function cardClose(){ const d=$('pCard'); if(d) d.remove(); }
function cardOpen(peer){ const p=mpPeers().find(q=>q.peer===peer); if(!p) return; cardClose(); const q=p.presence, pt=isParty(p);
  const d=document.createElement('div'); d.id='pCard'; d.className='askB';
  d.innerHTML=`<b>${pt?'🤝 ':''}${mpName(p)}${q.l?` <small style="display:inline">Lv ${q.l|0}</small>`:''}</b><small>${pt?'파티원 · 서로 덮치지 않는다':'같은 거리의 나그네'}</small><div class="askR">${canCall()?'<div class="btn big call" data-a="call">📞 전화</div>':''}${pt?'':'<div class="btn big pty" data-a="pty">🤝 파티</div>'}<div class="btn" data-a="x">✕</div></div>`;
  d.addEventListener('pointerdown',e=>{ const a=e.target.closest('[data-a]'); e.preventDefault(); e.stopPropagation(); if(!a) return; const k=a.dataset.a; if(k==='call') callStart(peer); else if(k==='pty') ptInvite(peer); else cardClose(); });
  document.body.appendChild(d); clearTimeout(cardOpen.t); cardOpen.t=setTimeout(cardClose,7000); }
const _gv=new THREE.Vector3();
function ghostTap(cx,cy){ if(!MP.ghosts.size) return false; const r=canvas.getBoundingClientRect(); let best=null,bd=48;
  for(const [k,G] of MP.ghosts){ for(const hy of [PLAYER_H*.5,PLAYER_H+.5]){ _gv.set(G.g.position.x,hy,G.g.position.z).project(camera); if(_gv.z>1) continue; const sx=r.left+(_gv.x+1)/2*r.width, sy=r.top+(1-_gv.y)/2*r.height, d=Math.hypot(sx-cx,sy-cy); if(d<bd){ bd=d; best=k; } } }
  if(best){ cardOpen(best); return true; } return false; }

/* ---- 접속한 사람 목록(메뉴·거점) ---- */
function pplHtml(){ const ps=mpPeers(); if(!MP.room&&!ps.length) return ''; let h=`<div class="ph">접속한 사람 ${ps.length}${PTY.id?` · 🤝 파티 ${ptMembers().length+1}명`:''}</div>`; if(!ps.length) h+='<div class="none">지금은 나 혼자</div>';
  const P0=player.root.position, ar=mpArea(), cc=canCall();
  for(const p of [...ps].sort((a,b)=>isParty(b)-isParty(a))){ const q=p.presence||{}, a=String(q.a||'hub'), pt=isParty(p); let w=a==='hub'?'모닥불 거점':a.startsWith('f:')?(FIELDS[a.slice(2)]?FIELDS[a.slice(2)].name:'지역 필드'):a==='w'?'서울 지도':'걷는 중';
    let far=''; if(a===ar&&a!=='hub'&&typeof q.x==='number'){ const dx=q.x-P0.x, dz=q.z-P0.z, d=Math.hypot(dx,dz); const dirs=['→','↘','↓','↙','←','↖','↑','↗']; const i=((Math.round(Math.atan2(dz,dx)/(Math.PI/4))%8)+8)%8; far=` · ${dirs[i]} ${Math.round(d*MPU())}m`; }
    const inv=PTY.inv&&PTY.inv.to===p.peer, oncall=CALL.st&&CALL.peer===p.peer;
    const go=ar==='hub'&&a.startsWith('f:')&&FIELDS[a.slice(2)]?`<span class="pb" data-a="go" data-f="${a.slice(2)}">🚶 ${pt?'파티원에게':'그쪽으로'} 가기</span>`:'';
    const act=`<div class="pAct">${go}${cc?`<span class="pb${oncall?' on':''}" data-a="call" data-p="${p.peer}">${oncall?'📞 통화 중':'📞'}</span>`:''}${pt?'<span class="pb on">🤝 파티</span>':`<span class="pb" data-a="pty" data-p="${p.peer}">${inv?'🤝 청하는 중…':'🤝 파티'}</span>`}</div>`;
    h+=`<div class="sk${pt?' pt':''}"><div class="si">${q.dn===1?'💤':(q.e|0)>0?'🔥':pt?'🤝':'👤'}</div><div style="flex:1"><div class="sn">${mpName(p)}<small>${q.l?'Lv '+q.l:''}</small></div><div class="sd">${w}${far}${q.dn===1?' · 쓰러짐':''}${(q.e|0)>0?' · 불씨 '+(q.e|0):''}</div>${act}</div></div>`; }
  if(PTY.id) h+=`<div class="pAct" style="justify-content:center;margin-top:4px">${cc?`<span class="pb${PV.on?' on':''}" data-a="pv">${PV.on?'🎙 파티 음성 나가기':'🎙 파티 음성 켜기 (4명까지)'}</span>`:''}<span class="pb" data-a="leave">파티 나가기</span></div>`;
  if(CALL.log.length) h+='<div class="ph">최근 통화</div>'+CALL.log.map(c=>`<div class="none">${c.tm} · ${c.nm}${c.dur?' · '+c.dur:''} · ${c.why}</div>`).join('');
  if(!cc&&ps.length) h+=`<div class="none" style="font-size:11px">${MP.room&&MP.room.ext?'이 브라우저는 통화가 안 된다':'📞 전화는 GitHub 판에서만 된다'}</div>`;
  return h; }
function pplAct(e){ const a=e.target.closest('[data-a]'); if(!a) return; e.preventDefault(); e.stopPropagation(); const k=a.dataset.a, peer=a.dataset.p;
  if(k==='call'){ if(CALL.st&&CALL.peer===peer) return toast('위쪽 통화 막대의 ✕로 끊기'); callStart(peer); }
  else if(k==='pty'){ ptInvite(peer); setTimeout(pplRefresh,50); } else if(k==='leave') ptLeave(); else if(k==='pv'){ if(PV.on) pvLeave('🎙 파티 음성에서 나왔다'); else pvJoin(); setTimeout(pplRefresh,300); }
  else if(k==='go'){ const fk=a.dataset.f; if(!FIELDS[fk]||mpArea()!=='hub') return; ['pause','ppl'].forEach(id=>{ const el=$(id); if(el) el.classList.remove('show'); }); openPanel(null); startRun(fk); } }
function pplRefresh(){ const P=$('pPpl'); if(P&&$('pause').classList.contains('show')) P.innerHTML=pplHtml(); const H=$('pplL'); if(H&&$('ppl').classList.contains('show')) H.innerHTML=pplHtml(); }
{ const d=document.createElement('div'); d.className='ov'; d.id='ppl'; d.style.zIndex=38; d.style.background='rgba(7,6,12,.95)'; d.innerHTML='<h2>👥 접속한 사람</h2><div id="pplL" style="width:min(92vw,380px);max-height:62vh;overflow:auto"></div><div class="btn big" id="pplX" style="margin-top:12px">닫기</div>'; document.body.appendChild(d);
  d.addEventListener('pointerdown',pplAct); $('pplX').onclick=()=>d.classList.remove('show');
  const h=$('hOn'); if(h){ h.style.pointerEvents='auto'; h.style.cursor='pointer'; h.style.textDecoration='underline'; h.onclick=()=>{ $('pplL').innerHTML=pplHtml(); d.classList.add('show'); }; } }
setInterval(pplRefresh,1500);


async function mpAnnounce(p,on){ if(p.by&&!MP.names[p.by]) await mpNames([p]); const n=mpName(p); toast(on?`📢 ${n}가 접속했다`:`${n}가 나갔다`,on?'어딘가에서 자라기 시작했다':''); }
const mpName=p=>(p&&p.by&&MP.names[p.by])||(p&&p.presence&&typeof p.presence.nm==='string'&&p.presence.nm.replace(/[<>&"']/g,'').slice(0,10))||'누군가';
async function mpNames(peers){ const U=MP.user; if(!U||!U.profiles) return; const ids=[...new Set(peers.filter(p=>p.by&&!MP.names[p.by]).map(p=>p.by))]; if(!ids.length) return;
  try{ const ps=await U.profiles(ids); for(const id of ids){ const n=ps&&ps[id]&&ps[id].name; if(n) MP.names[id]=String(n).slice(0,12); } for(const g of MP.ghosts.values()) g.lbl=null; }catch(e){} }
function mpArea(){ if(!S||!(S.phase==='play'||S.phase==='lvup'||S.phase==='choice'||S.phase==='pause')) return 'hub'; if(S.duel) return 'd:'+S.duel.m+':'+S.duel.code+(S.duel.bet?':z'+S.duel.z:''); return FIELD?'f:'+S.field:WORLD?'w':'r'; }
function mpPeers(){ if(DBG.fakePeers) return DBG.fakePeers; if(!MP.room) return []; try{ return MP.room.peers().filter(p=>!p.isMe&&p.kind==='viewer'&&p.presence); }catch(e){ return []; } }
// 같은 필드·같은 판의 사람 (쓰러져 기지에 있어도 그 사람이 흘린 불씨·주운 기록은 남는다)
function mpFieldPeers(){ const fk=S&&S.field; if(!fk||S.duel) return []; return mpPeers().filter(p=>p.presence.dk===fk&&p.presence.r===MPF.rd); }
function mpBossDmg(zid){ let s=0; for(const p of mpFieldPeers()){ const bh=p.presence.bh; if(Array.isArray(bh)) for(const e of bh) if(Array.isArray(e)&&String(e[0])===zid) s+=Math.max(0,Math.min(5e6,+e[1]||0)); } return s; }
function mpNearHolder(P){ let b=null,bd=1e9; for(const [k,G] of MP.ghosts){ if(!G.hold) continue; const d=Math.hypot(G.g.position.x-P.x,G.g.position.z-P.z); if(d<bd){ bd=d; b={x:G.g.position.x,z:G.g.position.z,nm:G.nm}; } } return b; }
// 판 맞추기: 같은 필드에서 나보다 앞선 판이면 따라간다(3분 세는 중이 아닐 때) · 남이 보낸 보스는 나도 보낸 것으로
function mpAdoptRound(join){ if(!FIELD||!S||!MY.zones) return; const fk=S.field; let mx=MPF.rd;
  for(const p of mpPeers()){ const pr=p.presence; if(pr.dk===fk&&pr.a==='f:'+fk&&typeof pr.r==='number'&&pr.r>mx) mx=Math.min(pr.r,MPF.rd+1000); }
  if(mx>MPF.rd&&!(S.fLoot>0)){ newRound(mx); if(!join) toast('다른 사람의 판에 이어 들어갔다','보스들이 다시 깨어나 있다'); }
  for(const p of mpFieldPeers()){ const bd=String(p.presence.bd||''); for(const c of bd.slice(0,8)){ if(MPF.bd.includes(c)) continue; const Z=zoneById(c); if(Z&&!MPF.bp[c]&&Array.isArray(p.presence.bp)){ const e=p.presence.bp.find(q=>Array.isArray(q)&&String(q[0])===c&&Array.isArray(q[1])); if(e&&typeof e[1][0]==='number'&&typeof e[1][1]==='number'&&Math.hypot(e[1][0]-Z.x,e[1][1]-Z.z)<80) MPF.bp[c]=[e[1][0],e[1][1]]; } if(Z&&(Z.mid||midsN()>=MID_N)) zoneKilled(Z,false,mpName(p)); } } }
function mpLabel(text,hold,pty){ const c=document.createElement('canvas'); c.width=256; c.height=56; const x=c.getContext('2d'); x.font='800 30px "Noto Sans KR",sans-serif'; const w=Math.min(250,x.measureText(text).width+24);
  x.fillStyle=hold?'rgba(70,30,5,.88)':'rgba(15,40,60,.82)'; x.beginPath(); x.roundRect((256-w)/2,6,w,42,12); x.fill(); x.strokeStyle=hold?'#ff9a40':pty?'#7be38a':'#5ad0ff'; x.lineWidth=3; x.stroke(); x.fillStyle=hold?'#fff0d8':'#e8f8ff'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(text,128,28);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,.92),new THREE.MeshBasicMaterial({map:t,transparent:true,depthTest:false,depthWrite:false})); m.renderOrder=20; return m; }
function mpGhost(p){ const c=CHARS[p.presence.c]?p.presence.c:'fire', V=CHARS[c].views.front; const g=sprite(V[0],V[2],V[3],PLAYER_H,{sw:1.0}); g.userData.m.material.transparent=true; g.userData.m.material.opacity=.92;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.42,.52,24),new THREE.MeshBasicMaterial({color:0x5ad0ff,transparent:true,opacity:.75,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.03; g.add(ring);
  // 불씨를 든 사람: 주황 빛기둥 (빨강은 적의 공격에만)
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.9,40,12,1,true).translate(0,21,0),new THREE.MeshBasicMaterial({map:beamTex,color:0xffa040,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false})); beam.renderOrder=9; beam.visible=false; g.add(beam);
  return {g,c,ring,beam,x:+p.presence.x||0,z:+p.presence.z||0,lbl:null,lblM:null,fx:1,hold:false,nm:''}; }
function mpClear(){ for(const G of MP.ghosts.values()){ scene.remove(G.g); } MP.ghosts.clear(); }
/* ============ v2.59 결투장 · 멸망전 1단계 (62번 · 11-19 기획자 「결투장 1대1 8분~3대3 · 멸망전 친구 방 코드 먼저」) ============
   친구끼리 같은 방 코드를 넣으면 같은 판(멀티 presence 'd:모드:코드'). 판정 서버 없음 → 사람끼리·수비 보스 피해는 각자 「내가 준 피해 누계」를 presence에 싣고 모두가 같은 합을 계산.
   같은 출발선: Lv1 · 캐릭터 기본 무기 · 불 키우기·유물·장비·숙련·NPC 덤 꺼짐(FLAT). 레벨업·각성은 판 안에서 평소처럼.
   결투장: 진영 모닥불 2곳(가장 먼 두 모닥불) · 팀마다 수비 보스(중간 1~3 + 파이널 1, 그 지역 보스 그림) · 우리 중간보스가 다 쓰러져야 상대가 우리 파이널을 칠 수 있다 · 상대 파이널을 먼저 쓰러뜨리면 승리.
   멸망전: 각자 · 저승 안개가 조여 옴(30초 뒤부터 5분) · 목숨 하나 · 마지막까지 남은 사람이 이김.
   만나자마자 끝나지 않게: 결투 체력 ×3 · 사람에게 받는 피해는 1초에 최대 체력 12%까지 · 쓰러지면 진영 모닥불에서 8초 뒤(후반 12초). 1·2막 틀: 돌 조각을 두고 벌이는 저승의 의례 */

/* v2.59.1 (기획자 11-19 새벽 결정 「1ㄱ 2ㄱ 3ㄴ + ㄷ 멸망전 · 1ㄴ 2ㄱ」 바로잡음):
   · 다시 일어나기 10초 → 판 후반 20초 · 이기면 명성 + 기억 조각·불씨 재료 조금(진 쪽도 조금) · 혼자 연습은 보상 없음
   · 멸망전 = 결투장(1대1~3대3)에 장비를 하나씩 걸고 겨룸. 건 장비는 같은 등급끼리만(방 이름에 등급이 붙어 다른 등급끼린 못 만남) ·
     이긴 팀이 진 팀이 건 장비를 다 가져감(한 사람씩 나눠) · 판 안에선 장비 능력치가 꺼져 실력으로만 · 판정 서버가 없어 친구 방 코드로만 ·
     판 도중 나가면 건 장비를 잃음(지고 나가서 지키는 일 막기) · 혼자 연습(상대를 한 번도 못 만남)이면 돌려받음 */
const DUELM={'1':{n:'1대1',f:'myeong',mid:1,T:480},'2':{n:'2대2',f:'hongdae',mid:2,T:600},'3':{n:'3대3',f:'seongsu',mid:3,T:780}};
const DUEL_RW={w:{sh:800,mat:3,fame:10},l:{sh:300,mat:1,fame:3}};
const betItem=()=>{ const id=(SV.duelUi||{}).bid; return id&&SV.bag.find(x=>x.id===id&&!Object.values(SV.eq).includes(x.id)&&!x.lk)||null; };
const gIdx=it=>Math.max(0,GRADE.indexOf(gGr(it)));
function betLost(){ if(!SV.betHold) return; const it=SV.betHold; SV.betHold=null; save(); setTimeout(()=>toast('🔥 판을 떠나 건 장비를 잃었다',gTag(it)),600); }
// v2.64 봇 잰 값(11-19 무인 ㄷ): 사람 피해 8+2.2×Lv 이면 Lv1 끼리 쓰러지기까지 ~38초 · Lv5 ~20초로 너무 길었다 → 20+2×Lv (Lv1 ~18초 · Lv5 ~13초 · Lv10 ~10초 · Lv15부터 1초 상한 12%로 8.3초 바닥)
const DUEL_DPS0=20, DUEL_DPSL=2;
const DUEL_HP=3, DUEL_CAP=.12, DG_R=6.5, DG_HIT=4.6;
/* ============ v2.62 결투장 2단계 (62번 · 기획자 11-18 20:37~20:47 · 11-19 10:40 「나머지 일도 다 해둬」) ============
   ① 팀장이 수비 보스 고르기: 결투 창에서 내가 한 번이라도 보낸 보스 중 고름(SV.duelUi.gk) → 팀에서 peer 이름이 가장 앞선 사람(팀장)의 것을 모두가 씀(presence gk). 모양·이름만 바뀌고 체력·세기는 자리(중간/파이널)대로 → 고른 보스로 세지지 않음
   ② 판 안 장비: 괴수를 베면 가끔(일반 3% · 정예 25%) 흰~보라 장비가 떨어짐 → 지나가면 주움 · 같은 칸보다 등급이 높으면 바로 입음 · 판이 끝나면 사라짐(가방에 안 들어감)
   ③ 지는 팀 덤: 상대 수비 보스를 덜 깎은 팀(차이 8% 넘게)은 경험치 ×1.3 */
const DG_DROP={mob:.03,elite:.25}, DG_GEAR=.6, DG_XP=1.3;
const bossOk=k=>!!(BOSSDEF[k]&&BOSSDEF[k].views&&Object.keys(BOSSDEF[k].views).length);
function duelBossList(){ const L=SV.ledger&&SV.ledger.bosses||{}; return Object.keys(L).filter(k=>(L[k]|0)>0&&bossOk(k)); }
function duelGkMine(m){ const D=SV.duelUi||{}, g=D.gk||{}, M=DUELM[m||D.m]||DUELM['1'], FD=FIELDS[M.f], own=new Set(duelBossList());
  const f=own.has(g.f)?g.f:FD.boss, mids=[]; for(let i=0;i<M.mid;i++){ const k=(g.m||[])[i]; mids.push(own.has(k)?k:FD.mids[i%FD.mids.length]); } return [f,...mids]; }
function duelReskin(G,key){ if(!bossOk(key)||G.key===key) return; const B=BOSSDEF[key], v=B.views.front||Object.values(B.views)[0], H=(B.H||2.4)*(G.mid?.75:.95);
  const bb=G.m.parent; bb.remove(G.m); try{ G.m.geometry.dispose(); }catch(e){} const m=new THREE.Mesh(new THREE.PlaneGeometry(H*v[1]/v[2],H).translate(0,H/2,0),inkMat(new THREE.MeshBasicMaterial({map:ltex(v[0]),alphaTest:.45,side:THREE.DoubleSide}),{w:1.5})); bb.add(m); G.m=m; G.key=key; G.name=B.name; }
function duelLeaders(D,peers){ const me=MP.me||'me', out={}; for(const t of ['a','b']){ const ids=peers.filter(p=>p.presence.tm===t).map(p=>p.peer); if(D.tm===t) ids.push(me); ids.sort(); out[t]=ids[0]||null; } return out; }
function duelGkSync(D,peers){ const L=duelLeaders(D,peers), me=MP.me||'me';
  for(const t of ['a','b']){ const ld=L[t]; let gk=null; if(ld===me) gk=D.gk; else if(ld){ const p=peers.find(q=>q.peer===ld); gk=p&&Array.isArray(p.presence.gk)?p.presence.gk:null; }
    if(!gk) continue; for(const G of D.G){ if(G.tm!==t) continue; const k=G.mid?gk[1+(+G.id.split('M')[1]||0)]:gk[0]; if(typeof k==='string') duelReskin(G,k); } }
  D.lead=L[D.tm]===me; }
function duelGearDrop(e){ const D=S.duel; if(!D||D.end) return; const el=e.type==='elite'||e.type==='gangcheol'||e.type==='yeongno'||e.d.treasure; if(Math.random()>(el?DG_DROP.elite:DG_DROP.mob)) return;
  const it=makeGear(rollGrade(DROPW[el?'elite':'mob']),null,S.field); it._duel=1; const o=mkSpot(e.x,e.z,false,null,false); o.dg=it; o.life=40; const c=new THREE.Color(gGr(it).c); o.fl.material.color.copy(c); o.ring.material.color.copy(c); DBG.dgDrop=(DBG.dgDrop||0)+1; }
function duelGearPick(it,x,z){ const D=S.duel; if(!D) return; D.gear=D.gear||{}; const sl=it.s, old=D.gear[sl], G=gGr(it); sfx.lvl(); buzz(25);
  if(!old||gIdx(it)>gIdx(old)||(gIdx(it)===gIdx(old)&&(it.e|0)>(old.e|0))){ D.gear[sl]=it; DBG.dgEq=(DBG.dgEq||0)+1; { const h0=(S.gb&&S.gb.hp)||0; S.gb=gearBonus(); const dh=Math.round(((S.gb.hp||0)-h0)*DUEL_HP); if(dh){ S.maxhp=Math.max(1,S.maxhp+dh); S.hp=Math.min(S.maxhp,S.hp+Math.max(0,dh)); } } dnum(x,PLAYER_H+.9,z,`${gIc(it)} ${G.n}`,'gold'); toast(`⚔ 판 안 장비 · ${gTag(it)}`,old?`${gGr(old).n} → ${G.n} · 이번 판에만`:'바로 입었다 · 이번 판에만 (끝나면 사라진다)'); }
  else { S.hp=Math.min(S.maxhp,S.hp+S.maxhp*.08); dnum(x,PLAYER_H+.9,z,'💊 +8%','mid'); } }
const dgChips=D=>{ const g=D.gear||{}; const v=Object.values(g); return v.length?' '+v.map(it=>`<i class="dgc" style="background:${gGr(it).c}"></i>`).join(''):''; };
let DUEL_PICK=null; const DUELH={}; // DUELH: 내가 사람에게 준 피해 누계 {peer:dmg}
function duelOpen(){ let p=$('pDuel'); if(!p){ p=document.createElement('div'); p.className='panel'; p.id='pDuel'; document.body.appendChild(p); }
  const D=SV.duelUi||(SV.duelUi={m:'1',code:'',tm:'a'}); if(!DUELM[D.m]) D.m='1'; const on=!!MP.room, bi=betItem(); if(D.st&&!bi) D.bid=null;
  const eqs=new Set(Object.values(SV.eq)), cand=SV.bag.filter(x=>!eqs.has(x.id)&&!x.lk).sort((a,b)=>gRank(b)-gRank(a)||b.e-a.e).slice(0,24);
  const rec=SV.duelRec||{w:0,l:0};
  p.innerHTML=`<h2>⚔ 결투장</h2><div class="sub2">돌 조각을 두고 벌이는 저승의 의례 · 친구와 <b>같은 방 코드</b>를 넣으면 같은 판<br>모두 <b>Lv1 · 기본 무기</b>로 시작(불 키우기·장비는 꺼짐)</div>
  <div class="dRow">${Object.entries(DUELM).map(([k,M])=>`<span class="btn dm${D.m===k?' on':''}" data-m="${k}">${M.n}<small>${M.f==='myeong'?'명동 · 약 8분':M.f==='hongdae'?'홍대 · 약 10분':'성수 · 약 13분'}</small></span>`).join('')}</div>
  <div class="dRow"><span class="btn dst${D.st?' on':''}" id="dSt" style="--c:#ff7a3a">🔥 멸망전 ${D.st?'켜짐':'꺼짐'}<small>같은 등급 장비를 하나씩 걸고 · 이긴 팀이 다 가져간다</small></span></div>
  ${D.st?`<div class="dBet">${cand.length?cand.map(x=>`<span class="btn db${D.bid===x.id?' on':''}" data-b="${x.id}">${gTag(x)}</span>`).join(''):'<small>걸 수 있는 장비가 없다 · 입은 것과 🔒 잠근 것은 못 건다</small>'}</div>
  <div class="dNote" style="color:#ffb08a">${bi?`건 장비: ${gTag(bi)} · <b style="color:${gGr(bi).c}">${gGr(bi).n}</b> 등급끼리만 만난다<br>`:'걸 장비를 하나 고른다 (가방에 있는 것만)<br>'}진 팀이 건 장비는 정말 사라진다 · 판 도중 나가도 잃는다 · 판정 서버가 없어 믿는 친구끼리만</div>`:''}
  <div class="dRow">방 코드 <input id="dCode" inputmode="numeric" maxlength="4" value="${D.code}" placeholder="4자리"><span class="btn" id="dNew">새 코드</span></div>
  ${D.m==='br'?'':`<div class="dRow">우리 편 <span class="btn dt${D.tm==='a'?' on':''}" data-t="a" style="--c:#5aa0ff">🔵 청</span><span class="btn dt${D.tm==='b'?' on':''}" data-t="b" style="--c:#ff6a6a">🔴 홍</span></div>`}
  ${D.m==='br'?'':duelGkHtml(D)}
  <div class="dRow"><span class="btn dinv" id="dInv">📨 카톡으로 초대<small>방 코드가 담긴 링크 · 친구는 바로 이 창으로</small></span></div>
  <div class="dNote">${on?'같은 코드를 넣은 친구가 보인다 · 파티 음성으로 말할 수 있다':'⚠ 같이 하기(친구 초대)가 꺼져 있다 · 혼자 연습만 된다(상대 수비 보스 깨기)'}<br>이기면 명성 +${DUEL_RW.w.fame} · 기억 조각 +${DUEL_RW.w.sh} · 불씨 재료 +${DUEL_RW.w.mat} (지면 조금) · 전적 ${rec.w}승 ${rec.l}패 · 명성 ${SV.fame||0}</div>
  <div class="row2"><div class="btn big" id="dGo">들어가기</div><div class="btn pclose" id="dX">돌아가기</div></div>`;
  p.querySelectorAll('.dm').forEach(b=>b.onclick=()=>{ D.m=b.dataset.m; save(); duelOpen(); });
  p.querySelectorAll('.dt').forEach(b=>b.onclick=()=>{ D.tm=b.dataset.t; save(); duelOpen(); });
  $('dSt').onclick=()=>{ D.st=!D.st; save(); duelOpen(); };
  p.querySelectorAll('.db').forEach(b=>b.onclick=()=>{ D.bid=D.bid===b.dataset.b?null:b.dataset.b; save(); duelOpen(); });
  $('dNew').onclick=()=>{ D.code=String(1000+Math.floor(Math.random()*9000)); save(); duelOpen(); };
  $('dCode').oninput=e=>{ D.code=e.target.value.replace(/\D/g,'').slice(0,4); save(); };
  $('dX').onclick=()=>p.classList.remove('show');
  p.querySelectorAll('.dgk').forEach(b=>b.onclick=()=>{ const g=D.gk||(D.gk={f:null,m:[]}), k=b.dataset.k, M=DUELM[D.m];
    if(b.dataset.w==='f') g.f=g.f===k?null:k; else { g.m=(g.m||[]).filter(x=>x&&x!==k); if(!b.classList.contains('on')) g.m.push(k); g.m=g.m.slice(-M.mid); } save(); duelOpen(); });
  { const iv=$('dInv'); if(iv) iv.onclick=()=>{ if(!/^\d{4}$/.test(D.code)){ D.code=String(1000+Math.floor(Math.random()*9000)); save(); } duelInvite(D); duelOpen(); }; }
  $('dGo').onclick=()=>{ if(D.st&&!betItem()){ toast('🔥 걸 장비를 먼저 고른다','멸망전은 장비 하나를 걸어야 들어간다'); return; } if(!/^\d{4}$/.test(D.code)) D.code=String(1000+Math.floor(Math.random()*9000)); save(); p.classList.remove('show'); duelStart(D.m,D.code,D.tm,D.st?betItem():null); };
  openPanel(null); p.classList.add('show'); }
// 수비 보스 고르기(팀장만 쓰임) — 내가 보낸 보스만 · 자리는 그대로(중간 n · 파이널 1)
function duelGkHtml(D){ const L=duelBossList(), M=DUELM[D.m], g=D.gk||{}, cur=duelGkMine(D.m), FD=FIELDS[M.f];
  if(!L.length) return `<div class="dNote">🛡 수비 보스: ${BOSSDEF[FD.boss].name} 등 이 지역 보스 · <small>보스를 보내면 내가 고를 수 있다</small></div>`;
  const chip=(k,w,on)=>`<span class="btn dgk${on?' on':''}" data-k="${k}" data-w="${w}">${BOSSDEF[k].name}</span>`;
  return `<div class="dGk"><div class="dgh">🛡 수비 보스 <small>팀장(우리 편 중 이름이 가장 앞선 사람)의 것이 쓰인다 · 세기는 자리대로</small></div>
  <div class="dgr"><b>♛ 파이널</b>${L.map(k=>chip(k,'f',cur[0]===k&&g.f===k)).join('')}</div>
  <div class="dgr"><b>● 중간 ${M.mid}</b>${L.map(k=>chip(k,'m',(g.m||[]).includes(k)&&cur.slice(1).includes(k))).join('')}</div>
  <div class="dNote" style="margin:2px 0">지금: ♛ ${BOSSDEF[cur[0]].name} · ● ${cur.slice(1).map(k=>BOSSDEF[k].name).join(' · ')}</div></div>`; }
// 초대 링크: GitHub 판 주소 + 같은 방(room) + 결투 코드·모드·상대 편
function duelInvite(D){ const ext=!!window.JANYA_EXT, base=ext?location.origin+location.pathname:'https://vera-architect.github.io/janya-play/';
  const room=(new URLSearchParams(location.search).get('room')||'main').replace(/[^a-z0-9_-]/gi,'').slice(0,24)||'main';
  const url=`${base}?room=${encodeURIComponent(room)}&duel=${D.code}&dm=${D.m}&dt=${D.tm==='a'?'b':'a'}`, M=DUELM[D.m];
  const txt=`⚔ 잔야 결투 ${M.n} 하자! 방 코드 ${D.code}\n${url}`; DBG.invite=url;
  if(navigator.share&&!BOT){ navigator.share({title:'잔야 결투',text:`⚔ 잔야 결투 ${M.n} 하자! 방 코드 ${D.code}`,url}).catch(()=>{}); return; }
  try{ navigator.clipboard.writeText(txt).then(()=>toast('📋 초대 링크를 복사했다','카톡 대화창에 붙여 넣기'),()=>toast('초대 링크',url)); }catch(e){ toast('초대 링크',url); }
  if(!ext) toast('📨 초대는 GitHub 판으로 열린다','Claude 판과 기록이 따로다'); }
// 초대 링크로 들어온 사람: 코드·모드·편을 넣고 결투 창을 연다(두 판 안 해도)
const DUEL_INV=(()=>{ try{ const q=new URLSearchParams(location.search), c=(q.get('duel')||'').replace(/\D/g,'').slice(0,4); if(c.length!==4) return null; return {code:c,m:DUELM[q.get('dm')]?q.get('dm'):'1',tm:q.get('dt')==='a'?'a':'b'}; }catch(e){ return null; } })();
let duelInvDone=false;
setInterval(()=>{ if(!DUEL_INV||duelInvDone||!S||S.phase!=='hub') return; if(document.querySelector('.panel.show,.ov.show:not(#hub),.askB')) return;
  duelInvDone=true; const D=SV.duelUi||(SV.duelUi={m:'1',code:'',tm:'a'}); Object.assign(D,{code:DUEL_INV.code,m:DUEL_INV.m,tm:DUEL_INV.tm,st:false}); SV.duelOk=1; save(); renderHub(); duelOpen(); setTimeout(()=>toast('⚔ 친구가 결투에 불렀다',`방 ${DUEL_INV.code} · 들어가기를 누르면 같은 판`),300); },1000);
function duelStart(m,code,tm,bet){ const M=DUELM[m]; { const pd=$('pDuel'); if(pd) pd.classList.remove('show'); } DUEL_PICK={m,code,tm,bet:bet||null}; FLAT=true; DEEP_PICK=0; try{ startRun(M.f); } finally { FLAT=false; } }
function duelSetup(){ const pk=DUEL_PICK; DUEL_PICK=null; if(!pk||!S||!FIELD||!MY) return; const M=DUELM[pk.m];
  S.flat=1; S.duel={m:pk.m,code:pk.code,tm:pk.tm,G:[],dead:0,deaths:0,out:0,t0:S.t,peak:0,end:0,foeBet:{},foeSeen:0,goneT:0,gk:duelGkMine(pk.m),gear:{},behind:false,gkT:0}; MPF.fk=null; S.nbT=[]; S.revive=0;
  if(pk.bet){ const it=SV.bag.find(x=>x.id===pk.bet.id); if(it){ SV.bag.splice(SV.bag.indexOf(it),1); for(const k in SV.eq) if(SV.eq[k]===it.id) delete SV.eq[k]; SV.betHold=it; S.duel.bet=it; S.duel.z=gIdx(it); save(); } }
  if(MY.zones) for(const Z of MY.zones) Z.ring.visible=false;
  S.maxhp=Math.round(S.maxhp*DUEL_HP); S.hp=S.maxhp;
  const F=MY.fires; let A=F[0],B=F[F.length-1],bd=-1; for(const a of F) for(const b of F){ const d=Math.hypot(a.x-b.x,a.z-b.z); if(d>bd){ bd=d; A=a; B=b; } }
  S.duel.base={a:{x:A.x,z:A.z},b:{x:B.x,z:B.z}}; const cx=F.reduce((s,f)=>s+f.x,0)/F.length, cz=F.reduce((s,f)=>s+f.z,0)/F.length; S.duel.c={x:cx,z:cz,r0:Math.max(...F.map(f=>Math.hypot(f.x-cx,f.z-cz)))+12};
  const open=(x,z)=>{ for(let k=0;k<40;k++){ const a=k*2.4, r=k*.6, xx=x+Math.cos(a)*r, zz=z+Math.sin(a)*r; if(!MY.blocked(xx,zz)&&edgeD(xx,zz)>EDGE_IN+2) return [xx,zz]; } return [x,z]; };
  if(pk.m!=='br'){ const FD=FIELDS[M.f]; for(const t of ['a','b']){ const o=S.duel.base[t], e=S.duel.base[t==='a'?'b':'a'], dx=e.x-o.x, dz=e.z-o.z, L=Math.hypot(dx,dz)||1, ux=dx/L, uz=dz/L;
      const [fx,fz]=open(o.x+ux*Math.min(16,L*.14),o.z+uz*Math.min(16,L*.14)); S.duel.G.push(duelGuard(t+'F',t,FD.boss,false,fx,fz));
      for(let i=0;i<M.mid;i++){ const off=(i-(M.mid-1)/2)*12, [mx,mz]=open(o.x+ux*L*.32-uz*off,o.z+uz*L*.32+ux*off); S.duel.G.push(duelGuard(t+'M'+i,t,FD.mids[i%FD.mids.length],true,mx,mz)); } } }
  else { S.duel.tm=null; }
  const b=pk.m==='br'?null:S.duel.base[pk.tm]; if(b){ const P=player.root.position; P.set(b.x+1.5,0,b.z+1.5); camT.set(P.x,0,P.z); }
  else { const P=player.root.position, f=F[Math.floor(Math.random()*F.length)]; P.set(f.x+1.5,0,f.z+1.5); camT.set(P.x,0,P.z); }
  if(pk.m==='br'){ const g=new THREE.Mesh(new THREE.RingGeometry(.985,1,96),new THREE.MeshBasicMaterial({color:0xff4a3a,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide,fog:false})); g.rotation.x=-Math.PI/2; g.position.set(cx,.08,cz); g.renderOrder=4; FIELD.G.add(g); S.duel.ringM=g; }
  let el=$('duelBar'); if(!el){ el=document.createElement('div'); el.id='duelBar'; document.body.appendChild(el); } el.style.display='block';
  setTimeout(()=>{ if(S&&S.duel) toast(`⚔ ${S.duel.bet?'🔥 멸망전 · ':''}${M.n} · 방 ${pk.code}`,S.duel.bet?`건 장비 ${gTag(S.duel.bet)} · 상대 파이널을 먼저 쓰러뜨려라`:'상대 수비 보스를 깨고 파이널을 먼저 쓰러뜨려라'); },900); DBG.duel=S.duel; }
function duelGuard(id,tm,key,mid,x,z){ const B=BOSSDEF[key]||BOSSDEF.dokkaebi, v=B.views.front||Object.values(B.views)[0], H=(B.H||2.4)*(mid?.75:.95);
  const g=new THREE.Group(); const bb=new THREE.Group(); bb.rotation.copy(bbFace); g.add(bb); const m=new THREE.Mesh(new THREE.PlaneGeometry(H*v[1]/v[2],H).translate(0,H/2,0),inkMat(new THREE.MeshBasicMaterial({map:ltex(v[0]),alphaTest:.45,side:THREE.DoubleSide}),{w:1.5})); bb.add(m);
  const ring=new THREE.Mesh(new THREE.RingGeometry(DG_R-.15,DG_R,48),new THREE.MeshBasicMaterial({color:tm==='a'?0x5aa0ff:0xff6a6a,transparent:true,opacity:.35,depthWrite:false,fog:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.05; g.add(ring);
  g.position.set(x,0,z); FIELD.G.add(g); return {id,tm,key,mid,x,z,g,m,ring,name:B.name,max:Math.round((mid?2600:5200)*({'1':1,'2':1.6,'3':2.2}[S.duel.m]||1)),my:0,ac:0}; }
function duelPeers(){ if(!S||!S.duel) return []; const a=mpArea(); return mpPeers().filter(p=>p.presence&&p.presence.a===a); }
const duelGD=(G,peers)=>G.my+peers.reduce((s,p)=>{ const d=p.presence.gd; if(!Array.isArray(d)) return s; for(const e of d) if(Array.isArray(e)&&e[0]===G.id) return s+Math.max(0,+e[1]||0); return s; },0);
function duelTick(dt,P){ const D=S.duel; if(!D||S.phase!=='play') return; const M=DUELM[D.m], el=$('duelBar'), peers=duelPeers(), left=Math.max(0,M.T-(S.t-D.t0));
  if(D.dead>0){ D.dead-=dt; S.iframe=Math.max(S.iframe||0,.3); if(D.dead<=0){ const b=D.base[D.tm]; P.set(b.x+1.2,0,b.z+1.2); S.hp=S.maxhp; player.mat.opacity=1; toast('🔥 진영 모닥불에서 다시 일어났다',''); } }
  D.gkT-=dt; if(D.gkT<=0){ D.gkT=1; if(D.m!=='br') duelGkSync(D,peers);
    if(D.foeSeen&&D.m!=='br'){ const dealt=t=>D.G.filter(G=>G.tm!==t).reduce((s,G)=>s+(G.max-(G.hp??G.max)),0), tot=D.G.reduce((s,G)=>s+G.max,0)/2, a=dealt(D.tm), b=dealt(D.tm==='a'?'b':'a'), was=D.behind; D.behind=b-a>tot*.08;
      if(D.behind&&!was) toast(`📈 뒤지고 있다 · 경험 ×${DG_XP}`,'괴수를 더 베어 따라잡자'); } }
  // 수비 보스: 피해 합 · 내가 주는 피해 · 나를 치는 상대 보스
  const hp={}; for(const G of D.G){ G.hp=Math.max(0,G.max-duelGD(G,peers)); hp[G.id]=G.hp; if(G.hp<=0&&G.g.visible){ G.g.visible=false; epBurst(G.x,1,G.z,40,7,.7,.6,GOLD,3); toast(`${G.tm==='a'?'🔵':'🔴'} ${G.name}(수비) 쓰러짐`,G.mid?'':'파이널이 쓰러졌다'); } }
  const midsLeft=t=>D.G.filter(G=>G.tm===t&&G.mid&&G.hp>0).length;
  if(D.dead<=0) for(const G of D.G){ if(G.hp<=0||G.tm===D.tm) continue; const d=Math.hypot(P.x-G.x,P.z-G.z);
    if(d<DG_HIT+1){ if(G.mid||!midsLeft(G.tm)){ const dps=(10+(S.lv|0)*2.6)*Math.min(4,st().might); G.my+=dps*dt; G.ac+=dps*dt; if(G.ac>25){ dnum(G.x,2.4,G.z,Math.round(G.ac),'mid'); G.ac=0; burst(G.x,1.2,G.z,3,2); } } else if(S.t-(D.lockT||-9)>4){ D.lockT=S.t; toast('🔒 앞의 중간보스부터','상대 중간보스를 모두 쓰러뜨려야 파이널을 칠 수 있다'); } }
    if(d<DG_R&&!S.inSafe){ hurtPlayer(S.maxhp*.045*dt,false,true); if(Math.random()<dt*2) ep(G.x,1.5,G.z,(P.x-G.x)*.8,.2,(P.z-G.z)*.8,.4,.5,G.tm==='a'?[.4,.6,1]:[1,.4,.35]); } }
  for(const G of D.G){ G.ring.material.opacity=G.hp>0?(.25+.15*Math.sin(S.t*3)):0; if(G.m) G.m.material.color.setScalar(G.hp>0&&!G.mid&&midsLeft(G.tm)?.55:1); }
  // 멸망전 안개
  if(D.m==='br'&&D.ringM){ const k=Math.max(0,Math.min(1,(S.t-D.t0-30)/(M.T-30))), R=Math.max(7,D.c.r0*(1-k)+7*k); D.R=R; D.ringM.scale.setScalar(R); if(D.dead<=0&&Math.hypot(P.x-D.c.x,P.z-D.c.z)>R){ hurtPlayer(S.maxhp*.05*dt,false,true); if(S.t-(D.fogT||-9)>3){ D.fogT=S.t; toast('🌫 안개 밖이다','붉은 고리 안으로'); } } }
  // 사람이 나에게 준 피해(1초 상한)
  const me=MP.me; if(me&&D.dead<=0){ let tot=0; for(const p of peers){ const pr=p.presence; if(D.m!=='br'&&pr.tm===D.tm) continue; const H=pr.dh; let t=0; if(Array.isArray(H)) for(const e of H) if(Array.isArray(e)&&e[0]===me) t=Math.max(0,+e[1]||0); const pv=(D.seen||(D.seen={}))[p.peer]; D.seen[p.peer]=t; if(pv!=null&&t>pv) tot+=t-pv; }
    if(tot>0){ D.cap=(D.cap||0); const room=Math.max(0,S.maxhp*DUEL_CAP-(D.capA||0)); const n=Math.min(tot,room); D.capA=(D.capA||0)+n; if(n>0){ S.hp-=n; S.hurtT=Math.min(1,S.hurtT+.3); if(S.hp<=0){ S.hp=0; duelDie(); } } } }
  D.capT=(D.capT||0)+dt; if(D.capT>=1){ D.capT=0; D.capA=0; }
  // 상대 기억(건 장비·나감)
  { const foes=peers.filter(p=>p.presence.tm&&p.presence.tm!==D.tm); for(const p of foes){ D.foeSeen=1; if(p.presence.bt) D.foeBet[p.peer]=p.presence.bt; }
    if(D.foeSeen&&!foes.length){ D.goneT+=dt; if(D.goneT>12) return duelEnd(true,'상대가 모두 떠났다'); } else D.goneT=0; }
  // 이기고 지기
  if(D.m!=='br'){ const ef=D.G.find(G=>G.tm!==D.tm&&!G.mid), mf=D.G.find(G=>G.tm===D.tm&&!G.mid);
    if(ef&&ef.hp<=0) return duelEnd(true,'상대 파이널을 쓰러뜨렸다'); if(mf&&mf.hp<=0) return duelEnd(false,'우리 파이널이 쓰러졌다');
    if(left<=0){ const sc=t=>D.G.filter(G=>G.tm!==t).reduce((s,G)=>s+(G.max-G.hp),0); const a=sc(D.tm), b=sc(D.tm==='a'?'b':'a'); return duelEnd(a>b,'시간이 다 됐다 · 수비 보스를 더 많이 깎은 쪽'); } }
  else { const alive=peers.filter(p=>p.presence.dd!==1).length; D.peak=Math.max(D.peak,peers.length); if(D.peak>0&&alive===0&&D.dead<=0) return duelEnd(true,'마지막까지 남았다'); if(left<=0&&D.peak===0) return duelEnd(true,'연습 끝 · 안개를 버텼다'); }
  if(el){ const tc=t=>D.G.filter(G=>G.tm===t).map(G=>`${G.mid?'●':'♛'}<i style="width:${Math.round(G.hp/G.max*100)}%"></i>`).join('');
    el.innerHTML=D.m==='br'?`🌫 멸망전 · 남은 사람 <b>${1+peers.filter(p=>p.presence.dd!==1).length}</b> · ${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}${D.dead>0?' · <b style="color:#ff8a6a">탈락</b>':''}`
      :`<span class="tA">🔵 ${D.G.filter(G=>G.tm==='a').map(G=>`${G.mid?'●':'♛'}${Math.round(G.hp/G.max*100)}`).join(' ')}</span> <b>${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}</b> <span class="tB">${D.G.filter(G=>G.tm==='b').map(G=>`${G.mid?'●':'♛'}${Math.round(G.hp/G.max*100)}`).join(' ')} 🔴</span>${(D.gear&&Object.keys(D.gear).length)||D.behind?`<br><small>${Object.keys(D.gear||{}).length?'판 안 장비'+dgChips(D):''}${D.behind?` <span style="color:#9be08a">📈 경험 ×${DG_XP}</span>`:''}</small>`:''}${D.dead>0?`<br><small>다시 일어나기 ${Math.ceil(D.dead)}초</small>`:''}`; } }
function duelDie(){ const D=S.duel; if(!D) return; D.deaths++; S.hp=0; sfx.die&&sfx.die(); buzz(120);
  if(D.m==='br'){ D.dead=1e9; D.out=1; player.mat.opacity=.3; toast('쓰러졌다 · 탈락','남은 사람들을 지켜본다 · 메뉴 → 모닥불로'); setTimeout(()=>{ if(S&&S.duel&&S.phase==='play') duelEnd(false,`${1+duelPeers().filter(p=>p.presence.dd!==1).length}위`); },4000); return; }
  { const T=DUELM[D.m].T, f=Math.max(0,Math.min(1,((S.t-D.t0)/T-.3)/.6)); D.dead=Math.round(10+10*f); } player.mat.opacity=.35; { const b=D.base[D.tm]; if(b){ player.root.position.set(b.x+1.2,0,b.z+1.2); camT.set(b.x,0,b.z); } } toast('쓰러졌다',`진영 모닥불에서 ${D.dead}초 뒤 다시 일어난다`); }
const M2=()=>DUELM[S.duel.m].T*.6;
function duelEnd(win,why){ const D=S.duel; if(!D||D.end) return; D.end=1; DBG.duelEnd={win,why}; const M=DUELM[D.m]; S.kills=0; S.treasures=0; S.bonus=0; S.duelRes=1;
  if(D.ringM){ D.ringM.parent&&D.ringM.parent.remove(D.ringM); } for(const G of D.G) G.g.parent&&G.g.parent.remove(G.g); const el=$('duelBar'); if(el) el.style.display='none';
  gameOver(true); $('rt').textContent=win?'⚔ 이겼다':'⚔ 졌다'; $('rline').innerHTML=`${M.n} · 방 ${D.code} · ${why}`; $('bEndless').style.display='none';
  SV.duelRec=SV.duelRec||{w:0,l:0}; const lines=[];
  if(!D.foeSeen){ if(D.bet){ SV.bag.push(D.bet); lines.push(`혼자 연습 · 건 장비를 돌려받았다 ${gTag(D.bet)}`); } else lines.push('혼자 연습 · 보상 없음'); }
  else { SV.duelRec[win?'w':'l']++; const R=DUEL_RW[win?'w':'l']; SV.shards+=R.sh; SV.mat+=R.mat; SV.fame=(SV.fame||0)+R.fame; lines.push(`명성 +${R.fame} · 기억 조각 +${R.sh} · 불씨 재료 +${R.mat}`);
    if(D.bet){ if(win){ SV.bag.push(D.bet); const me=MP.me||'me', mine=[me,...duelPeers().filter(p=>p.presence.tm===D.tm).map(p=>p.peer)].sort(), my=mine.indexOf(me), fo=Object.keys(D.foeBet).sort(), got=[];
        fo.forEach((k,i)=>{ if(i%mine.length!==my) return; const b=D.foeBet[k]; if(!b||!GEAR[b.s]) return; const it={...b,o:{...(b.o||{})},id:Date.now().toString(36)+Math.random().toString(36).slice(2,6)}; SV.bag.push(it); got.push(gTag(it)); });
        lines.push(`🔥 멸망전 승리 · 건 장비를 지켰다${got.length?' · 가져온 장비 '+got.join(' '):''}`); bagTrim(); }
      else lines.push(`🔥 멸망전 패배 · 건 장비를 잃었다 ${gTag(D.bet)}`); } }
  { const n=Object.keys(D.gear||{}).length; if(n) lines.push(`판 안 장비 ${n}개는 의례와 함께 사라졌다`); }
  SV.betHold=null; D.bet=null; $('rline').innerHTML+=`<br><small>${lines.join('<br>')}</small>`; save(); }

if($('hDuel')) $('hDuel').onclick=()=>duelOpen();
const PVP_R=5.5;
function mpTick(dt){ const R=MP.room; if(!R) return; const area=mpArea(), now=performance.now(), inF=FIELD&&S&&S.field&&area!=='hub'&&!S.duel;
  if(now-MP.lastSend>110){ MP.lastSend=now; const P=player.root.position;
    let st=area==='hub'?{a:'hub',c:SV.char||'fire',e:0,s:0}:{a:area,x:Math.round(P.x*10)/10,z:Math.round(P.z*10)/10,c:SV.char||'fire',l:S.lv|0,h:Math.round(Math.max(0,S.hp)/S.maxhp*20)/20,e:inF?(S.emG||[]).length:0,s:S.inSafe?1:0,dn:S.down?1:0};
    if(MPF.fk) Object.assign(st,{dk:MPF.fk,r:MPF.rd,bd:MPF.bd,bp:Object.entries(MPF.bp),bm:Object.entries(MPF.bm).map(([k,v])=>[k,v,MPF.bt[k]||0]),bh:Object.entries(MPF.bdmg).map(([k,v])=>[k,Math.round(v)]),bl:Object.entries(MPF.bhl).map(([k,v])=>[k,Math.round(v)]),pk:MPF.pk.slice(-30),dr:MPF.dr.slice(-8),hit:inF?Object.entries(MPF.hit).slice(-6).map(([k,v])=>[k,Math.round(v)]):[]});
    if(S&&S.duel&&area!=='hub') Object.assign(st,{gk:S.duel.gk||0,tm:S.duel.tm||'',dd:S.duel.dead>0?1:0,bt:S.duel.bet?(({s,i,g,o,on,e,v,k,u})=>({s,i,g,o,on,e,v,k,u}))(S.duel.bet):0,gd:S.duel.G.filter(G=>G.my>0).map(G=>[G.id,Math.round(G.my)]),dh:Object.entries(DUELH).map(([k,v])=>[k,Math.round(v)]).slice(-8)});
    if(MP.myNm) st.nm=MP.myNm; ptPresence(st); const k=JSON.stringify(st); if(k!==MP.lastKey){ MP.lastKey=k; R.presence({x:null,z:null,l:null,h:null,...st}).catch(()=>{}); } }
  // v2.27 필드 이어받기: 필드 안에 있는 동안 4초마다(바뀌었거나 30초 지나면) · 필드를 나가는 순간 한 번 더
  if(R.fieldPut&&now-(MP.roomT||0)>3000){ if(inF&&MPF.fk){ const sn=fieldSnap(), key=JSON.stringify({...sn,t:0}); if(now-(MP.fpT||0)>4000&&(key!==MP.fpK||now-(MP.fpT||0)>30000)){ MP.fpT=now; MP.fpK=key; R.fieldPut(MPF.fk,sn); } MP.fpLast=sn; }
    else if(MP.fpLast&&MP.fpLastA&&MP.fpLastA.startsWith('f:')){ R.fieldPut(MPF.fk||MP.fpLastA.slice(2),{...MP.fpLast,t:Date.now()}); MP.fpLast=null; }
    MP.fpLastA=area; }
  const peers=mpPeers();
  // v2.31 파티 안내: 필드에 들어설 때 · 파이널 체력 25% (기획자 05:40)
  if(inF&&PTY.id&&MP.ptA!==area){ MP.ptA=area; setTimeout(()=>{ if(S&&S.phase==='play'&&PTY.id) toast('🤝 파티로 들어왔다','⚠ 파이널을 잡으면 파티가 풀린다 · 불씨는 하나'); },2500); } if(!inF) MP.ptA=null;
  if(inF&&S&&!S.ptWarn&&PTY.id&&boss.alive&&!boss.dying&&boss.maxhp>0&&boss.hp/boss.maxhp<.25){ const Z=(MY.zones||[]).find(z=>z.id===boss.zid); if(Z&&!Z.mid&&mpFieldPeers().some(ptRaw)){ S.ptWarn=1; toast('⚠ 곧 끈이 끊어진다','파이널이 쓰러지면 파티도 풀린다 · 불씨는 하나'); buzz([40,30,40]); } }
  if(inF){ mpAdoptRound(false);
    // 같은 불씨를 거의 같이 주웠으면: peer 이름이 앞선 쪽이 가진다(모두에게 같은 규칙)
    if(S.emG&&S.emG.length&&MP.me){ for(let i=S.emG.length-1;i>=0;i--){ const e=S.emG[i]; if(!e.id||now-e.t>6000) continue; for(const p of mpFieldPeers()){ if(Array.isArray(p.presence.pk)&&p.presence.pk.includes(e.id)&&p.peer<MP.me){ S.emG.splice(i,1); S.ember=S.emG.length; MPF.pk=MPF.pk.filter(x=>x!==e.id); MPF.pk.push(e.id); lootHud(); toast(`🔥 ${mpName(p)}가 한발 먼저 주웠다`,'쫓아가서 쓰러뜨리면 떨어진다'); break; } } } }
    // 보스 함께 깎기: 남이 같은 보스에 준 피해만큼 내 보스도 깎인다
    if(boss.alive&&!boss.dying&&boss.zid!=null){ const z=boss.zid, sh=mpBossPick(z); if(bmWins(sh,boss.maxhp,MPF.bt[z]||9e15)&&Math.abs(sh.mx-boss.maxhp)>.5){ MPF.bm[z]=sh.mx; MPF.bt[z]=sh.t; boss.maxhp=sh.mx; const od=mpBossNet(z); MPF.oSeen[z]=od; boss.hp=Math.min(sh.mx,Math.max(1,sh.mx-(MPF.bdmg[z]||0)+(MPF.bhl[z]||0)-od)); } else if(sh&&sh.t===(MPF.bt[z]||9e15)) MPF.bt[z]=sh.t; }
    if(boss.alive&&!boss.dying&&boss.zid!=null){ const od=mpBossNet(boss.zid), dl=od-(MPF.oSeen[boss.zid]||0); MPF.oSeen[boss.zid]=od; if(dl<0) boss.hp=Math.min(boss.maxhp,boss.hp-dl); if(dl>0){ boss.hp-=dl; boss.flash=1; if(boss.hp<=0){ boss.hp=0; boss.dying=1.8; boss.mat.transparent=true; teleMesh.visible=false; slamRing.visible=false; sfx.roar(); } } }
    // 내가 맞는 것: 남이 나를 때린 누적 피해(내가 불씨를 들고 있을 때만)
    if(MP.me){ for(const p of mpFieldPeers()){ if(p.presence.a!==area||isParty(p)) continue; const H=p.presence.hit; let t=0; if(Array.isArray(H)) for(const e of H) if(Array.isArray(e)&&e[0]===MP.me) t=Math.max(0,Math.min(1e6,+e[1]||0));
      const prev=MPF.hitSeen[p.peer]; MPF.hitSeen[p.peer]=t; if(prev==null||t<=prev) continue; const dl=t-prev;
      if(S.emG&&S.emG.length&&S.phase==='play'&&!S.inSafe){ hurtPlayer(dl); if(!MPF.hitTold[p.peer]){ MPF.hitTold[p.peer]=1; toast(`⚔ ${mpName(p)}가 덮친다!`,'불씨를 든 사람은 누구나 노린다 · 모닥불로'); } } } } }
  const live=new Set(); let near=0, foe=0, ptN=false; const P=player.root.position;
  for(const p of peers){ const pr=p.presence||{}; if(area==='hub'||pr.a!==area||typeof pr.x!=='number'||typeof pr.z!=='number') continue;
    near++; const pty=isParty(p); if(!pty) foe++; live.add(p.peer); let G=MP.ghosts.get(p.peer); if(G&&G.c!==pr.c){ scene.remove(G.g); G=null; }
    if(!G){ G=mpGhost(p); G.g.position.set(pr.x,0,pr.z); MP.ghosts.set(p.peer,G); G.t0=now; }
    if(!MP.seen.has(p.peer)&&now-G.t0>1200){ MP.seen.add(p.peer); toast(`👥 ${mpName(p)}가 같은 거리에 있다`,'불씨를 들기 전까진 서로 싸울 수 없다'); }
    const gp=G.g.position, dx=pr.x-gp.x, dz=pr.z-gp.z, d=Math.hypot(dx,dz); if(d>25) gp.set(pr.x,0,pr.z); else { const k=Math.min(1,dt*10); gp.x+=dx*k; gp.z+=dz*k; } if(Math.abs(dx)>.03) G.fx=dx<0?-1:1; G.g.userData.m.scale.x=G.fx;
    const hold=inF&&(pr.e|0)>0&&pr.r===MPF.rd; G.nm=mpName(p);
    G.pty=pty; if(pty&&Math.hypot(gp.x-P.x,gp.z-P.z)<14) ptN=true;
    if(hold&&!G.hold&&!MPF.holdSeen.has(p.peer+':'+pr.e)){ MPF.holdSeen.add(p.peer+':'+pr.e); if(pty) toast(`🔥 파티원 ${G.nm}가 불씨를 들었다`,'모닥불까지 지켜 주자'); else if(S.fLoot>0) toast(`⚔ ${G.nm}가 불씨를 들었다 — 덮쳐라`,'모닥불에 닿기 전에 쓰러뜨리면 그 자리에 떨어진다'); else toast(`🔥 ${G.nm}가 불씨 덩어리를 들었다`,'모닥불에 닿기 전에 쓰러뜨리면 떨어진다'); }
    G.hold=hold; G.beam.visible=hold; G.ring.material.color.set(S&&S.duel?(S.duel.m==='br'?0xff9a40:pr.tm==='a'?0x5aa0ff:0xff6a6a):hold?0xff9a40:pty?0x7be38a:0x5ad0ff);
    const dn=inF&&pr.dn===1; if(dn&&!G.dnT){ G.dnT=1; toast(`${G.nm}가 쓰러졌다`,'곁에 3초 서 있으면 일으켜 세운다'); } if(!dn) G.dnT=0;
    G.g.children[0].rotation.z=dn?1.25:0; if(dn&&Math.hypot(gp.x-P.x,gp.z-P.z)<2.6&&now-(G.dnFx||0)>500){ G.dnFx=now; burst(gp.x,.6,gp.z,3,1); dnum(gp.x,1.2,gp.z,'일으키는 중','gold'); }
    const cl=CALL.st==='on'&&CALL.peer===p.peer?'📞':''; const txt=dn?`쓰러짐 · ${G.nm} · 곁으로`:`${cl}${hold?'🔥'+(pr.e|0)+' ':''}${pty?'🤝':''}${G.nm}${pr.l?' · Lv'+pr.l:''}`; if(G.lbl!==txt){ G.lbl=txt; if(G.lblM){ G.g.children[0].remove(G.lblM); } G.lblM=mpLabel(txt,hold,pty); G.lblM.position.y=PLAYER_H+.5; G.g.children[0].add(G.lblM); }
    G.g.userData.m.material.opacity=pr.h===0?.35:.92;
    // 내가 때리는 것: 불씨를 든 사람이 가까우면 내 무기가 저절로 친다(모닥불 고리 안은 서로 못 때림)
    const foeD=S&&S.duel?(S.duel.m==='br'||pr.tm!==S.duel.tm)&&pr.dd!==1&&!(S.duel.dead>0):false;
    if((foeD||(hold&&!pty&&!(S&&S.duel)))&&!pr.s&&S.phase==='play'&&!S.inSafe&&pr.h!==0&&Math.hypot(gp.x-P.x,gp.z-P.z)<PVP_R){ const dps=foeD?DUEL_DPS0+(S.lv|0)*DUEL_DPSL:8+(S.lv|0)*2.2; if(foeD) DUELH[p.peer]=(DUELH[p.peer]||0)+dps*dt; else MPF.hit[p.peer]=(MPF.hit[p.peer]||0)+dps*dt;
      MP.hitFx[p.peer]=(MP.hitFx[p.peer]||0)+dps*dt; if(now-(G.fxT||0)>320){ G.fxT=now; burst(gp.x,1,gp.z,3,2); dnum(gp.x,1.7,gp.z,Math.max(1,Math.round(MP.hitFx[p.peer])),'mid'); MP.hitFx[p.peer]=0; } } }
  for(const [k,G] of MP.ghosts) if(!live.has(k)){ scene.remove(G.g); MP.ghosts.delete(k); }
  { const hv=$('holdV'); if(hv){ const on=!!(inF&&S.emG&&S.emG.length&&foe>0&&!S.inSafe&&S.phase==='play'); if(hv.classList.contains('on')!==on) hv.classList.toggle('on',on); } }
  PTY.near=ptN; if(near!==MP.near){ MP.near=near; const el=$('mpN'); if(el){ el.textContent=near?`👥 ${near+1}`:''; el.style.display=near?'block':'none'; } } }
/* v2.51 랜드마크 엿보기 → v2.52 (기획자 11-18 23:24): 싸우는 중에 카메라가 움직이면 당황스럽다 → 판 안에서 다가갈 때 엿보기는 없앰(대신 안내판).
   판 처음에 성장을 다 고르고 나면(고를 게 없으면 바로) 한 번만: 대표 랜드마크를 비추고 → 내 캐릭터로 다가오며 줌인. 그동안 시간은 멈춤 · 화면을 누르면 바로 넘어감.
   모닥불 고리 밖으로 먼저 나가 버렸으면 하지 않는다(싸우는 중엔 절대 안 나옴). */
const GL={on:false,t:0,dur:3.2,hold:1.5,d:null,b:0}; window.__GL=GL; const _glV=new THREE.Vector3(), _glL=new THREE.Vector3(), _glT=new THREE.Vector3();
function glimpse(d){ if(BOT&&!location.search.includes('glimpse')) return; GL.on=true; GL.t=0; GL.d=d; S.iframe=Math.max(S.iframe||0,GL.dur+.6); }
addEventListener('pointerdown',()=>{ if(GL.on&&GL.t<GL.dur-.9) GL.t=Math.max(GL.hold,GL.dur-.9); },true);
function glimpseTick(dt){ if(GL.on){ GL.t+=dt; if(GL.t>=GL.dur){ GL.on=false; GL.b=0; } return; }
  if(!FIELD||!MY||!MY.LMK||!S||S.phase!=='play'||S.introDone||boss.alive) return;
  if(S.t>.4&&!S.inSafe){ S.introDone=1; return; }
  if(S.t<.3||pendN()||S.lvb) return;
  S.introDone=1; const d=MY.LMK.find(q=>q.rep); if(d) glimpse(d); }
function glimpseCam(){ if(!GL.on||!FIELD) { GL.b=0; return; } const e=v=>v*v*(3-2*v), b=GL.t<GL.hold?1:e(Math.max(0,1-(GL.t-GL.hold)/(GL.dur-GL.hold))); GL.b=b;
  const d=GL.d, H=d.h||12, p=d.p||.5, tH=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect, Dg=Math.max(d.dist||H*1.9+22,(d.w||0)/2/tH*1.08), yw=d.yaw||0, ly=H*.42;
  _glV.set(d.x+Math.sin(yw)*Math.cos(p)*Dg, ly+Math.sin(p)*Dg, d.z+Math.cos(yw)*Math.cos(p)*Dg); _glL.set(camT.x,.6,camT.z).lerp(new THREE.Vector3(d.x,ly,d.z),b);
  camera.position.lerp(_glV,b); camera.lookAt(_glL); scene.fog.near+=b*Dg; scene.fog.far+=b*(Dg*1.5+80); if(b>.12&&FIELD.SEE) FIELD.SEE.uSeeOn.value=0; }
const gfxIdle=()=>!GL.on&&(!S||S.phase!=='play');
function setGfx(k){ SV.gfx=k; save(); renderer.setPixelRatio(Math.min(devicePixelRatio,GFX[k].pr)); resize(); gfxLbl(); }
function gfxLbl(){ const G=GFX[gfxK()]; const a=$('bGfx'); if(a) a.textContent=`🖥 화질: ${G.n}${G.d?' · '+G.d:''}`; const b=$('hGfx'); if(b) b.textContent='🖥 '+G.n; }
function gfxNext(){ const k=GFXO[(GFXO.indexOf(gfxK())+1)%3]; setGfx(k); toast('🖥 화질 '+GFX[k].n,k==='save'?'배터리를 아낀다 · 멈춰 있는 화면은 천천히 그린다':k==='mid'?'조금 더 선명하게':'가장 선명하게 · 배터리를 많이 쓴다'); }
function tick(now){
  { const cap=GFX[gfxK()].idle; if(cap&&gfxIdle()&&!DBG.fixed&&now-LASTD<1000/cap-3){ requestAnimationFrame(tick); return; } LASTD=now; DBG.tk=(DBG.tk||0)+1; }
  let dt=Math.min(gfxIdle()?.1:.05,(now-last)/1000); last=now; const t=now/1000;
  if(S&&S.phase==='play'&&DBG.fixed){ HS=0; for(let i=0;i<DBG.fixed&&S.phase==='play';i++) update(1/30); }
  else if(S&&S.phase==='play'){ glimpseTick(dt); let rem=dt*DBG.ts*(GL.on?0:1); while(rem>0&&S.phase==='play'){ const h=Math.min(rem,1/30); update(h); rem-=h; } }
  else if(S&&S.phase==='over'&&boss.alive) bossUpdate(dt);
  else if(!S||S.phase==='hub'){ player.update(dt,0); }
  try{ mpTick(dt); }catch(e){}
  try{ bgmTick(dt); }catch(e){}
  gearAura(t);
  if(DBG.fixed&&S&&S.phase==='play') draw(DBG.fixed/30,S.t); else draw(dt,t);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
if(BOT){ $('title').classList.remove('show'); sndInit(); SV.region=location.search.includes('seoul')?'seoulst':location.search.includes('myeong')?'myeong':'namsan'; SV.char=(location.search.match(/char=(\w+)/)||[])[1]||'fire'; startRun((location.search.match(/[?&]f=(\w+)/)||[])[1]||(location.search.includes('mfield')?'myeong':null)); }
/* v2.52 폰 뒤로가기 (기획자 11-18 23:25 「뒤로가기 누르면 이전 메뉴로 · 실수로 눌러 게임이 꺼진다」)
   주소창 기록에 빈 칸을 하나 끼워 두고, 뒤로가기가 오면 그 칸을 다시 채운 뒤 맨 위 창을 닫는다.
   싸우는 중 → 멈춤 창 · 멈춤 창 → 계속 · 고르기 창은 그대로(나중에 고르기가 있으면 그것) · 처음 화면/거점에서는 2초 안에 한 번 더 눌러야 나감 */
const BACK={armed:false,last:0};
function backArm(){ if(BACK.armed) return; try{ history.pushState({janya:1},''); BACK.armed=true; }catch(e){} }
function backAct(){ const vis=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
  const rc=$('resetConfirm'); if(rc&&vis(rc)&&getComputedStyle(rc).display!=='none'){ $('bResetNo').click(); return true; }
  const skip=new Set(['title','hub','story','result','lvup','choice','pause']);
  const L=[...document.querySelectorAll('.ov.show,.panel.show')].filter(e=>!skip.has(e.id)&&vis(e)).sort((a,b)=>(+getComputedStyle(b).zIndex||0)-(+getComputedStyle(a).zIndex||0));
  for(const o of L){ let c=o.querySelector('.pclose,#bDexClose,#tClose,#pplX,[id$="Close"]'); if(!c) c=[...o.querySelectorAll('.btn,button,span')].find(b=>/^(닫기|돌아가기|정했다|✕|아니)$/.test(b.textContent.trim())&&vis(b));
    if(c){ c.click(); } else o.classList.remove('show'); return true; }
  if($('lvup').classList.contains('show')){ const lt=$('bCampLater'); if(lt&&vis(lt)) lt.click(); else toast('하나를 골라야 한다',''); return true; }
  if($('choice').classList.contains('show')){ toast('하나를 골라야 한다',''); return true; }
  if($('pause').classList.contains('show')){ $('bResume').click(); return true; }
  if(S&&S.phase==='play'&&$('hud').style.display!=='none'&&!$('hub').classList.contains('show')){ togglePause(); return true; }
  if($('story').classList.contains('show')||$('result').classList.contains('show')) return true;
  return false; }
addEventListener('popstate',()=>{ BACK.armed=false; const n0=Date.now(); if(n0-(BACK.any||0)<450){ BACK.any=n0; backArm(); return; } BACK.any=n0; let done=false; try{ done=backAct(); }catch(e){ done=true; }
  if(done){ backArm(); return; }
  const n=Date.now(); if(n-BACK.last<2000){ history.back(); return; } BACK.last=n; backArm(); toast('🔙 한 번 더 누르면 나간다',''); });
addEventListener('pointerdown',backArm,true); addEventListener('keydown',backArm,true); backArm();
window.__dbg={get enemies(){return enemies;},EP,sparks,hitSpark:(e,x,z)=>hitSpark(e,x,z),BATCH,draw:()=>drawFrame(),CGR,WEAPONS,EVOS,FUS,BR,PV,pvJoin:()=>pvJoin(),pvLeave:()=>pvLeave(),ptRaw:p=>ptRaw(p),DBG,PTY,CALL,callRe:()=>callRe(),callStart:p=>callStart(p),ptInvite:p=>ptInvite(p),ghostTap:(x,y)=>ghostTap(x,y),pplHtml:()=>pplHtml(),lootHud:()=>lootHud(),stackTop:()=>stackTop(),MPF,MP,evoMoment:(k,two)=>evoMoment(k,two),zoneKilled:(i,m)=>zoneKilled(zoneById(i),m,"민수"),blocked,BG,mkSpot:(x,z,b)=>mkSpot(x,z,b),get SPOTS(){return SPOTS;},makeGear,lootConfirm,spawn:(t,d)=>spawnAround(t,d),hit:(e,n)=>damage(e,n),get worldG(){return worldG;},FOGA:()=>FOG,terr,SITES,get S(){return S;},get SV(){return SV;},get MY(){return MY;},get R3(){return {renderer,scene,camera,amb,moon};},fieldReset:()=>fieldReset(),roundEnd:f=>roundEnd(f),fieldInherit:fk=>fieldInherit(fk),die:()=>{S.hp=0;gameOver();},hitBoss:n=>damageBoss(n,"dbg"),enemies,boss,player,setTs:v=>DBG.ts=v,lv:()=>{S.pendingLv++;},give:(k,l=1)=>{S.W[k]=l; if(k==='shadow') shadowP.root.visible=true; renderSlots();},startRun,enterHub,bossHere:k=>{ const P=player.root.position; S.bossKey=k||'dokkaebi'; S.bossZid=null; spawnBoss(); boss.dbg=1; boss.x=P.x+2.6; boss.z=P.z; },nbHere:k=>{ const P=player.root.position; nbSpawn(k||NB[S.field||'myeong'][0]); boss.x=P.x+2.6; boss.z=P.z; return boss.maxhp; },gimForce:k=>{ boss.gForce=k; boss.gGap=0; if(boss.gq) gimEnd(true); },get GMK(){return GMK;},BGIM,GIMP,NB,nbHp:(fk,k)=>nbHp(fk,k),nbPlan:()=>nbPlan(),duel:{duelStart:(m,c,t,b)=>duelStart(m,c,t,b),duelOpen:()=>duelOpen(),DUELM,DUELH,duelGearDrop:e=>duelGearDrop(e),duelGearPick:(it,x,z)=>duelGearPick(it,x,z),duelGkMine:m=>duelGkMine(m),gearBonus:()=>gearBonus(),DUEL_INV,duelInvite:D=>duelInvite(D)},sp:()=>special(),mono:{MONO,monoNext:k=>monoNext(k),monoShow:t=>monoShow(t)},npc:{NPCS,NPCD:()=>NPCD(),npcHub:()=>npcHub(),npcTalk:k=>npcTalk(k),embRender:()=>embRender(),keeperLine:()=>keeperLine()},gfx:{setGfx:k=>setGfx(k),gfxK:()=>gfxK(),GFX},bulk:{bulkList:()=>bulkList(),bulkDis:()=>bulkDis(),gLock:id=>gLock(id),bagTrim:()=>bagTrim()},gear:{makeGear,gearInfo,gearBonus,gStats,gName,gGr,gRank,SETS,UNIQ,LEGS,GRADE,OLDG,enhance,enhRate,gReroll,gDismantle,renderGear,gDis,dropW,DROPW,DROPP,st:()=>st(),save:()=>save(),GAURA,recDeep:()=>recDeep(),gearPow:()=>gearPow()}};
window.__dbg.cards=()=>choices(); window.__dbg.openCamp=()=>openCamp(); window.__dbg.openLv=()=>openLevelUp(); window.__dbg.pause=()=>togglePause();
