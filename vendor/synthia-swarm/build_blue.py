# Parses raw Blue I Ching pages (vocab_src/blue_iching_*.txt, pasted by the user) into per-gate entries and merges them
# into vocabulary.json under gates[g]["blue"]. Raw wording kept; nothing invented. A gate cut off mid-page keeps what is there.
import re, json, glob, pathlib
here = pathlib.Path(__file__).parent; out = {}
for f in sorted(glob.glob(str(here / "vocab_src/blue_iching_*.txt"))):
    chunks = re.split(r"The Blue I Ching www\.64keys\.com Page \d+", open(f, encoding="utf8").read())
    for i, ch in enumerate(chunks):
        d = re.search(r"\n(\d{1,2})\n(?!\w [im]\b)([\s\S]*?)\nGate \1 ([\s\S]*)", ch)
        if not d or not re.search(r"^\d+\n\w [im]\b", ch, re.M): continue
        g = int(d.group(1)); L = ch[:d.start()].split("\n"); lines = {}; cur = None; k = 0
        while k < len(L):
            s = L[k].strip(); m = re.match(r"^(\w) ([im])\s*(.*)$", s)
            if re.fullmatch(r"\d+", s) and k + 1 < len(L) and re.match(r"^\w [im]\b", L[k+1].strip()):
                k += 1; m = re.match(r"^(\w) ([im])\s*(.*)$", L[k].strip()); txt = [m.group(3)] if m.group(3) else []; k += 1
                while k < len(L) and not re.fullmatch(r"\d+", L[k].strip()): txt.append(L[k].strip()); k += 1
                if cur:
                    if m.group(2) == "i": cur["exalted"] = " ".join(txt[:-1]) if len(txt) > 1 else " ".join(txt); cur["exalted_short"] = txt[-1] if len(txt) > 1 else ""
                    else:
                        # detriment text runs until the next "n Name" line
                        dt = []; 
                        for t in txt:
                            nm = re.match(r"^([1-6]) ([A-Z].*)$", t)
                            if nm and not dt == []: cur["detriment"] = " ".join(dt); cur = {"name": nm.group(2)}; lines[int(nm.group(1))] = cur; dt = None; continue
                            if dt is None: cur["name"] += " " + t; continue
                            dt.append(t)
                        if dt: cur["detriment"] = " ".join(dt)
                continue
            nm = re.match(r"^([1-6]) ([A-Z].*)$", s)
            if nm and not lines.get(int(nm.group(1))): cur = {"name": nm.group(2)}; lines[int(nm.group(1))] = cur
            elif cur and "exalted" not in cur and s and not re.fullmatch(r"\d+", s): cur["name"] += " " + s
            k += 1
        e = out.setdefault(g, {}); e.update({"keynote": " ".join(d.group(2).split()), "description": " ".join(("Gate %d " % g + d.group(3)).split()), "lines": lines})
        h = re.search(r"Potential ([^\n]+)\nName of the Hexagram in the I Ching ([^\n]+)\nRave I Ching Name ([^\n]+)", chunks[i-1] if i else "")
        if h: e.update({"potential": h.group(1).strip(), "hexagram": h.group(2).strip(), "rave_name": h.group(3).strip()})
        a = re.search(r"Additional Keynotes ([\s\S]*?)\nFoundation", (chunks[i-2] if i > 1 else "") + (chunks[i-1] if i else ""))
        if a: e["additional_keynotes"] = " ".join(a.group(1).split())
json.dump(out, open(here / "vocab_src/blue.json", "w"), indent=1)
V = json.load(open(here / "vocabulary.json"))
for g, e in out.items(): V["gates"].setdefault(str(g), {})["blue"] = e
json.dump(V, open(here / "vocabulary.json", "w"))
for g in sorted(out): print(g, out[g].get("rave_name"), {k: (v["name"], bool(v.get("exalted")), bool(v.get("detriment"))) for k, v in sorted(out[g]["lines"].items())})
