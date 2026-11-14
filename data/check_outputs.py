"""Check pipeline output against BUILD_SPEC.md section 4.5.
Usage: python3 data/check_outputs.py web/public/data   (exit 0 = all pass)"""
import json, os, sys

OUT = sys.argv[1]
def j(p): return json.load(open(os.path.join(OUT, p)))
fails = []
def check(label, got, want, tol=0):
    ok = abs(got - want) <= tol if isinstance(want, (int, float)) and not isinstance(want, bool) else got == want
    print(("PASS " if ok else "FAIL ") + f"{label}: got {got!r}, want {want!r}" + (f" ±{tol}" if tol else ""))
    if not ok: fails.append(label)

T, U, P = 1, 0.01, 0.0005          # ±$1 totals, ±$0.01 per unit, ±0.05 pct-points on shares
s, prods, vends, parts, opps, unm = (j(f + ".json") for f in
    ["summary", "products", "vendors", "parts", "opportunities", "unmapped"])

check("total spend", s["totalSpend"], 63791995, T)
check("PO lines", s["poLines"], 8845); check("vendors", s["vendorCount"], 86); check("bikes", s["bikeCount"], 97)
check("BOM-tied spend", s["bomTiedSpend"], 60611986, T); check("BOM-tied share", s["bomTiedShare"], 0.950, P)
check("not on a BOM", s["unmappedSpend"], 3180009, T)
check("PPV total", s["ppvTotal"], 2968913, T); check("PPV share", s["ppvShare"], 0.049, P)
check("best-price savings", s["bestPriceSavings"], 889978, T)
check("rejected value", s["rejectedValue"], 2028853, T); check("reject rate", s["rejectRate"], 0.031, P)
L = {l["line"]: l for l in s["lines"]}
for ln, ppv, sav in [("Road", 1223525, 242366), ("Mountain", 1138914, 201454), ("Touring", 523845, 427139)]:
    check(f"{ln} PPV", L[ln]["ppv"], ppv, T); check(f"{ln} savings", L[ln]["savings"], sav, T)
check("Road bikes", L["Road"]["bikes"], 43)

check("products count", len(prods), 97)
check("products sorted by ppvTotal desc", [p["ppvTotal"] for p in prods] == sorted((p["ppvTotal"] for p in prods), reverse=True), True)
p = next(x for x in prods if x["id"] == "969")
check("969 name", p["name"], "Touring-1000 Blue, 60"); check("969 units", p["units"], 1116); check("969 partCount", p["partCount"], 48)
for k, v in [("costUnit", 854.82), ("stdUnit", 814.12), ("ppvUnit", 40.71), ("saveUnit", 30.01)]: check(f"969 {k}", p[k], v, U)
check("969 ppvTotal", p["ppvTotal"], 45428, T); check("969 saveTotal", p["saveTotal"], 33486, T)

bom_files = os.listdir(os.path.join(OUT, "bom"))
check("bom file count", len(bom_files), 97)
check("bom files match products", sorted(f[:-5] for f in bom_files) == sorted(x["id"] for x in prods), True)
b = j("bom/969.json")
check("969 bom costUnit", b["costUnit"], 854.82, U); check("969 children", len(b["children"]), 14)
w = next(c for c in b["children"] if c["id"] == "821")
check("821 name", w["name"], "Touring Front Wheel")
for k, v in [("costUnit", 124.16), ("ppvUnit", 5.91), ("saveUnit", 12.36)]: check(f"821 {k}", w[k], v, U)

check("parts count", len(parts), 265)
r = parts["513"]
check("513 name", r["name"], "Touring Rim"); check("513 savings", r["save"], 346500, T)
check("513 vendorCount", r["vendorCount"], 2); check("513 whereUsed", len(r["whereUsed"]), 22)
check("513 consumption", r["consumption"], 29470, T)
lo, hi = sorted(v["avgPrice"] for v in r["vendors"])
check("513 low price", lo, 26.60, U); check("513 high price", hi, 39.20, U)
prem = next(v for v in r["vendors"] if v["name"] == "Premier Sport, Inc.")
check("Premier vs cheapest on 513", prem["premium"] / (prem["spend"] - prem["premium"]), 0.474, P)

check("opportunities sorted desc", [o["savings"] for o in opps] == sorted((o["savings"] for o in opps), reverse=True), True)
check("opportunities all > $0.50", all(o["savings"] > 0.5 for o in opps), True)
check("top 3 opportunities", [o["name"] for o in opps[:3]], ["Touring Rim", "HL Crankarm", "HL Road Rim"])
check("opportunities 4-5 (tie, any order)", {o["name"] for o in opps[3:5]}, {"LL Crankarm", "ML Crankarm"})
for i, v in enumerate([346500, 65300, 59200, 55400, 55400]): check(f"opportunity {i+1} savings (±$50 = 0.1K)", opps[i]["savings"], v, 50)
check("Touring Rim productCount", opps[0]["productCount"], 22)

check("vendor count", len(vends), 86)
v = vends[0]
check("top vendor", v["name"], "Superior Bicycles"); check("Superior spend", v["spend"], 4555897.5, T)
check("Superior PPV", v["ppv"], 216947.5, T); check("Superior reject rate", v["rejectRate"], 0.0525, 0.00005)
check("Superior single-source", v["singleSource"], 2)

check("unmapped count", len(unm), 178); check("unmapped total", sum(x["spend"] for x in unm), 3180009, T)

print(f"\n{'ALL CHECKS PASSED' if not fails else f'{len(fails)} FAILED: ' + ', '.join(fails)}")
sys.exit(1 if fails else 0)
