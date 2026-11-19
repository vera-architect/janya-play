# v2.67 결투 의례장(1대1 전용 대칭 맵) 데이터 만들기 — 원점 기준 점대칭(롤처럼 양쪽이 똑같다)
import json
def rect(x0,z0,x1,z1): return [[x0,z0],[x1,z0],[x1,z1],[x0,z1]]
half=[]  # (층수, 꼭짓점, 종류 1=전각 2=담장)
# 가운데 길(|x|<9)과 양 옆 길(|x|30~48) 사이의 두 줄 건물 블록 + 가로지르는 골목(z≈-60)
half+= [(1,rect(-27,-98,-12,-68),1),(1,rect(12,-98,27,-68),1),(1,rect(-27,-54,-12,-24),1),(1,rect(12,-54,27,-24),1)]
# 진영 뒤 담장(모닥불 등 뒤) · 진영 옆 낮은 담
half+= [(0,rect(-24,-131,24,-127),2),(0,rect(-30,-120,-26,-104),2),(0,rect(26,-120,30,-104),2)]
# 바깥 길 바깥쪽 담장(지도 끝 안개 앞)
half+= [(0,rect(-60,-110,-56,-14),2),(0,rect(56,-110,60,-14),2)]
# 가운데 마당 정자 한 채(점대칭으로 반대편에 한 채 더)
half+= [(1,rect(14,2,24,12),1)]
B=[]; T=[]
for lv,p,t in half:
    B.append([lv,p]); T.append(t)
    B.append([lv,[[-x,-z] for x,z in p]]); T.append(t)
roads=';'.join(['footway|||0,-118 0,118','footway|||-39,-112 -39,112','footway|||39,-112 39,112','footway|||-39,-61 39,-61','footway|||-39,61 39,61','footway|||-39,-18 39,-18','footway|||-39,18 39,18'])
# v2.68 수풀(들어가면 상대에게 안 보임) · 정글 괴수 자리(잡으면 1분 강해짐) — 반쪽만 적고 점대칭으로
bush_half=[(-47,-52,-32,-42),(32,-94,47,-84),(-9,-24,9,-17)]
BUSH=[]
for x0,z0,x1,z1 in bush_half: BUSH.append([x0,z0,x1,z1]); BUSH.append([-x1,-z1,-x0,-z0])
CAMPS=[{'k':'r0','t':'red','x':-40,'z':-28},{'k':'r1','t':'red','x':40,'z':28},{'k':'b0','t':'blue','x':40,'z':-28},{'k':'b1','t':'blue','x':-40,'z':28}]
AR={'BUSH':BUSH,'CAMPS':CAMPS,'BLD_RAW':B,'BT':T,'SHOPS_RAW':'','NAMES_RAW':'','B':{'x0':-88,'z0':-152,'w':176,'h':304,'ka':2.4},'SC':[0,-112],'SCR':14,'ZONE':[0,0],'ZR':10,
    'ROADS_RAW':roads,'CROSS_RAW':'','WATER':[],'STYLE':'palace','FIRES':[[0,-112],[0,112]]}
open('arena_data.js','w').write('// v2.67 결투 의례장 — 1대1 전용 대칭 맵(tools/mk_arena.py로 만듦). 원점 점대칭: 진영 (0,-112)·(0,112)\nexport const AR='+json.dumps(AR,separators=(',',':'))+';\n')
print(len(B),'buildings')
