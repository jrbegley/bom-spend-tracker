"""Buying-network data for the pitch demo (SPEC_PITCH_DEMO.md section 5). Python stdlib only.

Usage: python3 data/build_network.py data/raw web/public/data
Reads parts.json and summary.json from the output folder (written by build_data.py) and
ProductVendor.csv and UnitMeasure.csv from the raw folder. Writes:
  network_member.json     real figures: the member's own pool-eligible purchases, per year
  network_synthetic.json  SYNTHETIC network figures, seeded, every record tagged "synthetic": true
Does not touch build_data.py or any file it writes."""
import csv, json, os, random, re, sys
from datetime import date

RAW, OUT = sys.argv[1], sys.argv[2]

# --- Tuning (SPEC_PITCH_DEMO.md 5.2: avg pooled price ~18% under member cost on parts that pass, 2+ parts fail) ---
SEED = 7
W = 0.5                     # weight of network size (vs luck) in the volume discount
FREIGHT_PER_DELIVERY = 5.0  # $ per network delivery; split over the units in it
DELIVERIES_PER_YEAR = 12    # ruling: one consolidated network delivery a month (every PO line in the sample is 3 units)
POOL = re.compile(r"Bolt|Nut|Washer|Bearing")

def jl(name): return json.load(open(os.path.join(OUT, name)))
def tsv(name): return list(csv.reader(open(os.path.join(RAW, name), encoding="utf-8-sig"), delimiter="\t"))

parts, summary = jl("parts.json"), jl("summary.json")
years = (date.fromisoformat(summary["periodEnd"]) - date.fromisoformat(summary["periodStart"])).days / 365.25

uom_name = {r[0].strip(): r[1].strip().lower() for r in tsv("UnitMeasure.csv")}
pv = {}  # product id -> list of ProductVendor rows
for r in tsv("ProductVendor.csv"): pv.setdefault(r[0], []).append(r)

member = []
for pid, p in parts.items():
    if not POOL.search(p["name"]): continue
    qty = sum(v["qty"] for v in p["vendors"])
    recv = sum(v["receivedQty"] for v in p["vendors"])
    rej = sum(v["rejectedQty"] for v in p["vendors"])
    rows = pv.get(pid, [])
    code = rows[0][9].strip()
    member.append({
        "id": pid, "name": p["name"], "family": "Bearing" if "Bearing" in p["name"] else "Fastener",
        "onBom": p["onBom"], "unit": uom_name[code], "unitCode": code,
        "yearlyQty": round(qty / years, 2), "avgPrice": round(p["spend"] / qty, 4),
        "rejectRate": round(rej / recv, 4) if recv else 0.0, "yearlySpend": round(p["spend"] / years, 2),
        "leadTimeDays": int(min(float(r[2]) for r in rows)), "minOrderQty": int(min(float(r[6]) for r in rows)),
    })
member.sort(key=lambda m: (-m["yearlySpend"], int(m["id"])))

# --- Synthetic side. Two passes so the volume discount can use each part's rank by network volume. ---
rng = random.Random(SEED)
multiples = [round(rng.uniform(15, 40), 2) for _ in member]
net_qty = [m["yearlyQty"] * x for m, x in zip(member, multiples)]
order = sorted(range(len(member)), key=lambda i: net_qty[i])
rank_pct = {i: k / (len(member) - 1) for k, i in enumerate(order)}

synthetic = []
for i, m in enumerate(member):
    discount = 0.12 + 0.12 * (W * rank_pct[i] + (1 - W) * rng.random())
    pooled = m["avgPrice"] * (1 - discount)
    deliver_size = max(1.0, m["yearlyQty"] / DELIVERIES_PER_YEAR)
    nq = net_qty[i]
    synthetic.append({
        "id": m["id"], "synthetic": True, "multiple": multiples[i], "networkYearlyQty": round(nq, 2),
        "discount": round(discount, 4), "pooledPrice": round(pooled, 4), "distributorFee": round(0.04 * pooled, 4),
        "freightPerUnit": round(FREIGHT_PER_DELIVERY / deliver_size, 4),
        "leadTimeDays": rng.randint(min(10, m["leadTimeDays"]), m["leadTimeDays"]), "minOrderQty": m["minOrderQty"],
        "memberCount": rng.randint(10, 20),
        "rebateTiers": [{"minNetworkQty": round(nq * 1.15), "rebatePct": 0.02}, {"minNetworkQty": round(nq * 1.35), "rebatePct": 0.04}],
    })

def admits(m, s):
    eff = m["avgPrice"] * (1 + m["rejectRate"])
    return s["pooledPrice"] + s["distributorFee"] + s["freightPerUnit"] < eff and s["leadTimeDays"] <= m["leadTimeDays"] and s["minOrderQty"] <= m["minOrderQty"]

json.dump(member, open(os.path.join(OUT, "network_member.json"), "w"), indent=1)
json.dump(synthetic, open(os.path.join(OUT, "network_synthetic.json"), "w"), indent=1)

passing = [s for m, s in zip(member, synthetic) if admits(m, s)]
print(f"pool parts {len(member)}, yearly spend {sum(m['yearlySpend'] for m in member):.0f}; "
      f"pass {len(passing)}, fail {len(member) - len(passing)}; "
      f"avg discount on passing {sum(s['discount'] for s in passing) / max(1, len(passing)):.4f}")
