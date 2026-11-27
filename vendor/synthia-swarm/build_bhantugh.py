# Reads the user's Bhan Tugh source texts (vocab_src/bhantugh/*.txt) and pulls out the tables they contain —
# channels (name, design keynote, circuit, sub-circuit, type), the 12 roles, bardo trinaries, centres — into
# bhantugh_rules.json. Only what the texts actually say; anything a text doesn't give is left absent.
import re, json, pathlib
D = pathlib.Path(__file__).parent / "vocab_src/bhantugh"; T = {p.stem: p.read_text(encoding="utf8") for p in D.glob("*.txt")}
out = {"sources": sorted(T), "channels": {}, "roles": {}, "bardo": {}, "centres": {}}
ov = T.get("circuits_overview", "")
# circuits: section headers then channel lines "a–b Name / A design of ..."
cur = None
TOK = re.compile(r"(Collective (?:Logical|Abstract)|Communal (?:Willpower|Defence)|Individualistic (?:Knowing|Centring)) Circuit|Self-survival Channels|(\d+)–(\d+) ([A-Z][A-Za-z' ]+?)(?: / (A design [^\n]+?))?(?=\s+\d+–\d+ |\s*\n| Collective| Communal| Individualistic| Self-survival|$)")
for m in TOK.finditer(ov):          # headers and channels in reading order, so a header on the same line still applies only after it
    if m.group(1): cur = m.group(1); continue
    if m.group(0).startswith("Self-survival"): cur = "Self-survival"; continue
    grp = (cur or "").split(); key = f"{m.group(2)}-{m.group(3)}"
    out["channels"].setdefault(key, {"name": m.group(4).strip(), "keynote": (m.group(5) or "").strip() or None, "circuit": grp[0] if grp else None, "sub": grp[1] if len(grp) > 1 else None})
KEY = {"Collective": "Sharing", "Communal": "Support", "Individualistic": "Empowerment", "Self-survival": "Individuation"}
for v in out["channels"].values(): v["circuitKeynote"] = KEY.get(v.get("circuit"))
# channel types (Projected / Generated / Manifested) from the per-channel text
for m in re.finditer(r"(\d+)–(\d+) [^\n]+\n(Projected|Generated|Manifested)\n", T.get("circuit_channels", "")):
    out["channels"].setdefault(f"{m.group(1)}-{m.group(2)}", {})["type"] = m.group(3)
# roles: "1/3 Protector/Warrior" blocks with their fields
rt = T.get("definition_types_roles_lines", "")
parts = re.split(r"(?:The (\d)/(\d) Role\s*)+", rt)
for i in range(1, len(parts) - 2, 3):
    body = parts[i + 2]; m = re.match(r"\s*([A-Za-z]+/[A-Za-z]+)\n(Right Angle|Left Angle|Juxtaposition)\n", body)
    if not m: continue
    fields = {k.strip(): v.split(" The ")[0].strip() for k, v in re.findall(r"([A-Z][A-Za-z -]+): ([^\n]+)", body[m.end():].split(" .")[0])}
    out["roles"][f"{parts[i]}/{parts[i+1]}"] = {"name": m.group(1), "angle": m.group(2), **fields}
cn = T.get("crystals_neutrinos_centres", "")
out["bardo"]["stages"] = re.findall(r"^\d ([A-Z][a-z]+)$", cn.split("The six Bardo Stages")[-1].split("1–3")[0], re.M) if "Bardo" in cn else []
out["bardo"]["trinaries"] = [l.split("/") for l in re.findall(r"([A-Z][a-z]+/[A-Z][a-z]+/[A-Z][a-z]+)", cn)]
for m in re.finditer(r"^(Head Centre|Ajna Centre|Throat Centre|G Centre|Willpower Centre|Sacral Centre|Solar Plex|Splenic Centre|Root Centre) \(([^)]+)\)", cn, re.M): out["centres"][m.group(1)] = {"theme": m.group(2)}
json.dump(out, open(pathlib.Path(__file__).parent / "bhantugh_rules.json", "w"), indent=1)
print(len(out["channels"]), "channels;", sum(1 for v in out["channels"].values() if v.get("type")), "with type;", len(out["roles"]), "roles;", out["bardo"]["stages"], len(out["bardo"]["trinaries"]), "trinaries;", list(out["centres"]))
