# v2.33 (기획자 11-17 15:16 「인계동 맵이 너무 큼 · 중간보스까지 시간은 명동이 딱 좋음」)
# 수원 필드를 명동 크기(240×300)로 잘라 냄: 땅 범위 B · 파이널 자리 ZONE(CGV 동수원 앞 네거리 곁) — 중간보스 거리 평균 ≈94(명동 91)
# 범위 밖 건물·가게·길은 뺀다(여유 20). 사용: python3 tools/suwon_crop.py 원본.js 결과.js
import json, re, subprocess, sys
src, dst = sys.argv[1], sys.argv[2]
X0, Z0, W, H, M = -110, -125, 240, 300, 20
txt = open(src, encoding='utf-8').read()
head = ''.join(l+'\n' for l in txt.split('\n') if l.startswith('//'))
SD = json.loads(subprocess.check_output(['node','-e',f"const s=require('fs').readFileSync({json.dumps(src)},'utf8').replace('export const SD=','global.SD=');eval(s);process.stdout.write(JSON.stringify(SD))"]))
inb = lambda x,z: X0-M <= x <= X0+W+M and Z0-M <= z <= Z0+H+M
n0 = (len(SD['BLD_RAW']), len(SD['SHOPS_RAW'].split(';')), len(SD['ROADS_RAW'].split(';')))
SD['BLD_RAW'] = [b for b in SD['BLD_RAW'] if any(inb(x,z) for x,z in b[1])]
SD['SHOPS_RAW'] = ';'.join(s for s in SD['SHOPS_RAW'].split(';') if s and inb(*map(float, s.split(',')[:2])))
SD['ROADS_RAW'] = ';'.join(r for r in SD['ROADS_RAW'].split(';') if r and any(inb(*map(float,p.split(','))) for p in r.split('|')[3].split()))
SD['CROSS_RAW'] = ' '.join(p for p in SD['CROSS_RAW'].split() if inb(*map(float,p.split(','))))
SD['B'] = {'x0':X0,'z0':Z0,'w':W,'h':H,'ka':SD['B'].get('ka',2.4)}
SD['ZONE'] = [5,-5]; SD['ZR'] = 24
n1 = (len(SD['BLD_RAW']), len(SD['SHOPS_RAW'].split(';')), len(SD['ROADS_RAW'].split(';')))
head += f'// v2.33 잘라 냄(tools/suwon_crop.py): 범위 {X0},{Z0} {W}×{H} (명동 크기) · 파이널 자리 {SD["ZONE"]} · 건물/가게/길 {n0} → {n1}\n'
open(dst,'w',encoding='utf-8').write(head+'export const SD='+json.dumps(SD,ensure_ascii=False,separators=(',',':'))+';\n')
print(n0,'->',n1)
