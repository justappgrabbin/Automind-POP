"""Fill channel types/centres from Definitive Book Section Six pages. Never overwrites; disagreements logged."""
import json,re,glob
R=json.load(open('bhantugh_rules.json'))
txt=""
for f in glob.glob('vocab_src/bhantugh/*attachment.txt'): txt+=open(f,errors='ignore').read()+"\n"
fix=lambda s:s.replace('S','5').replace('O','0').replace('l','1')
heads=list(re.finditer(r'THE CHANNEL OF ([A-Z \-]+?):\s*([0-9SOl]+)\s*-\s*([0-9SOl]+)',txt))
added,conflict=[],[]
for i,m in enumerate(heads):
    a,b=fix(m[2]),fix(m[3]); body=txt[m.end():heads[i+1].start() if i+1<len(heads) else len(txt)][:1500]
    t=re.search(r'Channel\s*Type:\s*(Manifesting Generated|Generated|Projected|Manifested)',body)
    c=re.search(r'links the ([A-Za-z ]+?) Cent(?:er|re) to the ([A-Za-z1 ]+?)(?: Cent| through)',body)
    key=next((k for k in (f'{a}-{b}',f'{b}-{a}') if k in R['channels']),f'{a}-{b}')
    ch=R['channels'].setdefault(key,{'name':m[1].title().strip()})
    if t:
        ty=t[1]
        if 'type' not in ch: ch['type']=ty; ch['typeSource']='dbhd:section6'; added.append(key)
        elif ch['type']!=ty and not (ty=='Manifesting Generated' and ch['type']=='Generated'): conflict.append((key,ch['type'],ty))
    if c and 'centres' not in ch: ch['centres']=[c[1].strip(), c[2].replace('1hroat','Throat').strip()]
R['connections']={"electromagnetic":"each defines one gate of the channel","dominance":"one defines the whole channel, other neither gate",
 "compromise":"one defines the whole channel, other only one gate","companionship":"both define the same channel or gate","source":"dbhd:connection charts"}
R['centreKinds']={"manifestation":["Throat"],"pressure":["Head","Root"],"awareness":["Splenic","Ajna","Solar Plexus"],
 "motor":["Root","Solar Plexus","Sacral","Heart"],"identity":["G"],"source":"dbhd:section two"}
json.dump(R,open('bhantugh_rules.json','w'),indent=1)
print('added',added); print('conflicts',conflict); print('still untyped',[k for k,v in R['channels'].items() if 'type' not in v])
