# Builds synthia/vocabulary.json from the user's vocabulary files (their Black Book tables + spec). Parses, doesn't invent.
import re, json
S = open('/home/claude/w27/vocab_src/spec.txt').read() + "\n" + open('/home/claude/w27/vocab_src/blackbook.txt').read()
G = {g: {"gate": g} for g in range(1, 65)}
lines = [l.strip() for l in S.splitlines()]
# 1) line-per-cell table: Gate / Name / Center / Sign / Harmonic  ("The Architecture of the 64 Gates")
for i, l in enumerate(lines):
    if re.fullmatch(r"\d{1,2}", l) and i + 4 < len(lines):
        g = int(l)
        if 1 <= g <= 64 and re.search(r"\((Liver|Thyroid|Pituitary|Ovaries/Testes|Adrenals|Thymus|Kidney/Pancreas|Spleen/Lymph)\)", lines[i+2]) and re.fullmatch(r"[\d, ]+", lines[i+4]):
            G[g].setdefault("name", lines[i+1]); G[g].setdefault("center", lines[i+2].split(" (")[0]); G[g].setdefault("sign", lines[i+3])
            G[g]["harmonic"] = [int(x) for x in re.findall(r"\d+", lines[i+4])]
# 2) markdown rows: | **g** | Sign | Meanings | Center | Biology | Harmonic |
for m in re.finditer(r"\|\s*\*\*(\d+)\*\*\s*\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|", S):
    g = int(m[1]); c = [x.strip() for x in m.groups()[1:]]
    if "," in c[1] and not re.search(r"\d°", c[0]):
        G[g].setdefault("sign", c[0]); G[g]["triad"] = [x.strip() for x in c[1].split(",")]
        if c[2] in ("Head",) or "center" not in G[g]: G[g]["center"] = c[2]
        G[g].setdefault("biology", c[3]); G[g].setdefault("harmonic", [int(x) for x in re.findall(r"\d+", c[4])])
    if re.search(r"\d°", c[1]): G[g]["arc"] = c[1]
for i, l in enumerate(lines):
    if re.fullmatch(r"\d{1,2}", l) and i + 3 < len(lines) and "," in lines[i+2] and lines[i+3] in ("G Center","Sacral","Ajna","Solar Plexus","Throat","Splenic","Root","Heart (Ego)","Head"):
        g = int(l)
        if 1 <= g <= 64: G[g].setdefault("triad", [x.strip() for x in lines[i+2].split(",")]); G[g].setdefault("sign", lines[i+1])
# Head gates: their own later tables say Head (61,63,64); keep Head where any table says so
for g in (61, 63, 64):
    if re.search(rf"\*\*{g}\*\*\s*\|[^\n]*\|\s*Head\s*\|", S): G[g]["center"] = "Head"
# 3) line names: "### **Gate N: Name**" blocks with | n | Expression | pos |  and "Line Expressions (1-6)" rows
for blk in re.split(r"\n(?=#+\s*\**Gate \d+|\*\*Gate \d+)", S):
    h = re.match(r"#*\s*\**Gate (\d+): ([^*\n]+)", blk)
    if not h: continue
    g = int(h[1]); ln = re.findall(r"\|\s*\**(\d)\**\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|", blk)
    if len(ln) >= 6: G[g]["lines"] = {int(n): {"name": e, "arc": p} for n, e, p in ln[:6]}
    h2 = re.search(r"Harmonic(?:/Channel)?:\**\s*([\d-]+)\s*\(([^)]+)\)", blk)
    if h2: G[g]["channel"] = {"pair": h2[1], "name": h2[2]}
for m in re.finditer(r"Gate (\d+)\n[^\n]+\n([^\n]+)\n(1\. [^\n]+)", S):
    g = int(m[1]); parts = re.findall(r"\d\. ([^,]+?)(?=, \d\.|$)", m[3])
    if len(parts) == 6 and "lines" not in G[g]: G[g]["lines"] = {i+1: {"name": p.strip()} for i, p in enumerate(parts)}
# 4) anchor map from the spec: Gate / I Ching name / Archetype / Base / Entry node / Sign / House
sp = [l.strip() for l in open('/home/claude/w27/vocab_src/spec.txt').read().split("Will The complete")[0].splitlines()]
for i, l in enumerate(sp):
    if re.fullmatch(r"\d{1,2}", l) and i + 6 < len(sp) and sp[i+3].startswith("Base ") and sp[i+6].startswith("House"):
        g = int(l); G[g]["iching_name"] = sp[i+1]; G[g]["archetype"] = sp[i+2]
        G[g]["base"] = sp[i+3]; G[g]["entry_node"] = sp[i+4]; G[g]["house"] = sp[i+6]
# 5) dimension chains (the user's Black Book pages) and tone/color vocab (spec sections I, J)
V = {"gates": G,
 "dimensions": {
  "Movement": {"chain": ["Movement","Energy","Creation","Seeing","Landscape","Environment"], "micro": "Individuality", "natures": ["Activity","Reaction","Limitation","Perspective","Relation"], "keynote": "I Define", "sense": "Seeing", "component": "Magnetic Monopole"},
  "Evolution": {"chain": ["Evolution","Gravity","Memory","Taste","Love","Light"], "micro": "The Mind", "natures": ["Character","Separation","Nature","Integration","Spirit"], "keynote": "I Remember", "sense": "Taste", "component": "Personality Crystal"},
  "Being": {"chain": ["Being","Matter","Matter","Touch","Sex","Survival"], "micro": "The Body", "natures": ["Biology","Chemistry","Objectivity","Geometry","Trajectory"], "keynote": "I Am", "sense": "Touch", "component": "The Atom"},
  "Design": {"chain": ["Design","Structure","Progress","Smelt","Life","Art"], "micro": "The Ego", "natures": ["Homo Sapiens","Growth","Decay","Continuity","Manifestation"], "keynote": "I Design", "sense": "Smell", "component": "Design Crystal"},
  "Space": {"chain": ["Space","Form","Illusion","Hearing","Music","Freedom"], "micro": "Personality", "natures": ["Type","Fantasy","Subjectivity","Rhythm","Timing"], "keynote": "I Think", "sense": "Hearing", "component": "Personality Crystal"}},
 "tones": {1: ["Security","Smell"], 2: ["Uncertainty","Taste"], 3: ["Action","Outer Vision"], 4: ["Meditation","Inner Vision"], 5: ["Judgement","Feeling"], 6: ["Acceptance","Touch/Hearing (by perspective)"]},
 "colors": {1: "Fear", 2: "Hope", 3: "Desire", 4: "Need", 5: "Guilt", 6: "Innocence"},
 "source": "user's vocabulary files (Black Book tables + Consciousness Causal Graph spec), Nov 24 2026; Capricorn = Cardinal (user-confirmed fix)"}
json.dump(V, open('/home/claude/w27/synthia/vocabulary.json', 'w'), indent=1)
have = lambda k: sum(1 for g in G.values() if k in g)
print({k: have(k) for k in ["name","sign","triad","center","harmonic","lines","channel","base","entry_node","house","arc"]})
print("no line names:", [g for g in G if "lines" not in G[g]], "| centers of 61,63,64:", [G[g].get("center") for g in (61,63,64)])
print(json.dumps(G[18])[:600])
# 6) SynthAi.HumanDesign metadata (user's upload): circuits per gate; line themes fill gates the Black Book files lack
import csv
for r in csv.DictReader(open('/home/claude/w27/vocab_src/Gates.csv', encoding='utf-8-sig')):
    g = int(r['Number']); G[g]['circuit'] = r['Circuit']; G[g].setdefault('keynote', r['Gate'])
for r in csv.DictReader(open('/home/claude/w27/vocab_src/Lines.csv', encoding='utf-8-sig')):
    g, l = int(r['Gate']), int(r['Line'])
    G[g].setdefault('lines', {}); G[g]['lines'].setdefault(l, {'name': r['Theme'].strip(), 'source': 'SynthAi Lines.csv'})
json.dump(V, open('/home/claude/w27/synthia/vocabulary.json', 'w'), indent=1)
print("after merge: lines", sum(1 for g in G.values() if len(g.get('lines', {})) == 6), "circuits", sum(1 for g in G.values() if 'circuit' in g), "| 34:", [G[34]['lines'][i]['name'] for i in range(1, 7)])
