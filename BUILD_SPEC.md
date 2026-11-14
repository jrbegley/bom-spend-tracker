# Spendline: BOM to Spend Cube Explorer (build spec)

This file is the complete build spec for a hackathon proof of concept. It is written to be handed to Claude Code in a terminal. Read the whole file before writing any code, then build in the phase order in section 9. Every design decision here is final unless the team changes it. Do not add features, screens, or libraries that are not listed.

Reference mockups (open in a browser): https://claude.ai/artifact/9Bguo7Qdut4s8mPpyYm9wV

---

## 1. What we are building

**The problem (from the hackathon prompt):** A company's BOMs (what goes into each product) and its spend cube (every part it buys, from whom, at what price) do not tie together. Many BOMs share the same parts. So nobody can see the true material cost of a product, compare prices across suppliers and products, or find savings.

**What the tool does:** It links every purchased part to the products that use it, rolls real purchase prices up the BOM, and shows two gaps at every level:

1. **PPV (purchase price variance):** what we paid above our vendors' own standard prices.
2. **Best-price savings:** what we would save if every part were bought from its cheapest vendor.

**Primary user:** a product cost owner (finance or product-line manager) asking "why does this bike cost what it does, and which parts drive it?" **Secondary user:** procurement, served by the Opportunities page.

**Core interaction:** a click-through drill-down. Start at a finished bike, open an assembly (a wheel), see its parts, and land on a part's detail page. Every level shows the same layout: a cost summary, the components below it, and the vendors who supply those components.

**Demo story:** Overview, then the Touring line (smallest PPV but largest savings), then Touring-1000 Blue, 60, then Touring Front Wheel, then Touring Rim. The rim is bought from two vendors at $26.60 and $39.20 (47% apart). Harmonizing that one price saves $346.5K across 22 bikes.

**Scope statement for the pitch:** the UI and all cost analysis run on real data. The matching layer (linking messy spend lines to BOM parts with a local LLM and a human review queue) is designed and shown as a labeled concept screen. The dataset already links parts by ID.

---

## 2. Locked decisions

| # | Decision |
|---|---|
| 1 | Primary user is the product cost owner. Procurement is secondary. |
| 2 | Every table's default sort is PPV dollars, largest first. Every column is sortable by clicking its name. |
| 3 | Product views use **blended** prices: the volume-weighted average across all vendors for 2022 to 2025. The data cannot say which vendor's parts went into which bike. |
| 4 | Costs are **purchased material only**. Standard = vendor standard price (ProductVendor.StandardPrice). Labor and overhead are excluded on both sides. |
| 5 | Spend is allocated to bikes by consumption (section 4.3), because vendors sell in cartons and cases while BOMs count pieces. |
| 6 | Overview is the home page. The drill-down is entered from it. |
| 7 | No Sankey diagram. |
| 8 | One time window everywhere: all PO data, April 2022 to September 2025. No date picker. |
| 9 | Prices in product views carry a "Blended" badge with a tooltip. |
| 10 | PPV and best-price savings are shown side by side and never added together. |
| 11 | Vendor tables show 8 rows per page with Previous and Next. |
| 12 | Level pages stack vertically: summary strip, then the components table (full width), then the vendor table (full width). |
| 13 | Purchased leaf parts hand off to the Part detail page. |
| 14 | Match review is a concept screen with an "Illustrative" badge. |
| 15 | Out of scope for now: projector or small-screen layout work, FIFO costing, the scale stress test. |

---

## 3. Tech stack and repo layout

- **Data pipeline:** Python 3.10+ with pandas. One script, run once, writes static JSON.
- **Web app:** React 18 + TypeScript + Vite, Tailwind CSS v4 (via `@tailwindcss/vite`), React Router. No chart library: bars are plain divs. No component library. No backend and no database: the app fetches the static JSON files.
- **Font:** Inter from Google Fonts (400, 500, 600).

```
spendline/
  data/
    raw/                    # AdventureWorks CSVs (git-ignored)
    build_data.py           # section 4.6
  web/
    public/data/            # pipeline output (commit it so the demo never depends on Python)
      summary.json  products.json  vendors.json  parts.json
      opportunities.json  unmapped.json  match_examples.json
      bom/<productId>.json  (97 files)
    src/
      main.tsx  App.tsx  index.css
      lib/format.ts  lib/data.ts  lib/sort.ts  lib/vendorsForParts.ts
      components/  AppShell.tsx  NavRail.tsx  GlobalSearch.tsx  KpiTile.tsx
                   SortableTable.tsx  Pagination.tsx  BlendedBadge.tsx  Breadcrumb.tsx
                   LeverChip.tsx  MadeBoughtTag.tsx  CostSummary.tsx  VendorTable.tsx
      pages/       Overview.tsx  Products.tsx  LevelPage.tsx  PartDetail.tsx
                   Opportunities.tsx  Vendors.tsx  MatchReview.tsx
  README.md
```

Setup commands:

```bash
mkdir -p spendline/data/raw && cd spendline
curl -L -o /tmp/aw.zip https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorks-oltp-install-script.zip
unzip -o /tmp/aw.zip -d data/raw
python3 -m venv .venv && source .venv/bin/activate && pip install pandas
python3 data/build_data.py data/raw web/public/data

npm create vite@latest web -- --template react-ts   # if web/ does not exist yet; keep public/data
cd web && npm install && npm install react-router-dom && npm install -D tailwindcss @tailwindcss/vite
npm run dev
```

---

## 4. Data

### 4.1 Source

Microsoft AdventureWorks OLTP sample (a fictional bike manufacturer). The zip contains one CSV per table. **Format:** tab-separated, no header row, no quoting. Read with `sep="\t", header=None, quoting=3, dtype=str, keep_default_na=False`. Column orders are listed in the script.

Tables used: Product, PurchaseOrderDetail, PurchaseOrderHeader, ProductVendor, Vendor, BillOfMaterials, WorkOrder.

### 4.2 Facts about this data that shape the method

- 8,845 PO lines, 86 vendors, 265 purchased parts, April 2022 to September 2025.
- Product.StandardCost is $0 for 182 of the 265 purchased parts (including every rim), so it is unusable. ProductVendor.StandardPrice exists for every vendor and part pair, and it is the standard used here.
- Only 6 PO lines were paid exactly the vendor standard price. Spend-weighted, the company paid 4.9% above standard.
- Vendor units of measure (CTN, CS, CAN, DZ, PAK, GAL, EA) differ from BOM units (EA, OZ, IN). Multiplying BOM quantity by purchase price gives nonsense (a bike would cost over $10,000). Section 4.3 avoids this.
- Wheels, cranksets, frames, and similar subassemblies are made in-house (MakeFlag = 1). Finished-goods standard costs include labor, which is why we never compare against them.
- BOM rows with an empty EndDate are current. Top-level rows have an empty ProductAssemblyID.
- ProductLine has trailing spaces: "R ", "M ", "T ", "S ". Only R, M, T bikes are in scope (97 bikes with BOMs and work orders).
- 178 purchased items (mostly resale goods like jerseys) appear on no BOM. They total $3.18M, about 5% of spend.
- Purchases and consumption differ. Example: 55,550 Touring Rims were bought but the built bikes consumed 29,470. Allocation spreads all spend over what was consumed, so the effective rim price inside product views ($61.89) is higher than either vendor's price. Part detail shows actual vendor prices; product views show allocated cost. If a judge asks, the answer is: allocated cost includes purchases that went to inventory.

### 4.3 Method

**Blended price per part:** for each part, combine every PO line across all vendors.

**Consumption:** explode each bike's BOM to its purchased parts (multiplying quantities down the levels). For each part, consumption = sum over bikes of (quantity per bike × units built), where units built = sum of WorkOrder.StockedQty for that bike.

**Effective prices per BOM unit** (these are unit-of-measure safe):
- `effPrice = part spend / consumption`
- `effStd = part standard spend / consumption`, where standard spend = sum of OrderQty × that vendor's StandardPrice
- `effSave = part best-price savings / consumption`

**Rollups:** any node's cost per unit = sum over its purchased leaf parts of (quantity per unit × effPrice). Same for standard and savings. Allocated spend across all bikes ties back exactly to BOM-tied spend ($60.61M).

**Definitions:**
- **Spend** = OrderQty × UnitPrice (use this everywhere in place of LineTotal so all sums agree).
- **PPV** = spend − standard spend.
- **Best-price savings for a part** = sum over vendors of (vendor spend − vendor qty × lowest vendor average price for that part).
- **vs cheapest (vendor)** = premium ÷ (spend − premium), where premium = that vendor's share of best-price savings. Show "Lowest" when it is 0.
- **Reject rate** = RejectedQty ÷ ReceivedQty.
- **Single-source parts (vendor)** = parts this vendor supplies that no other vendor supplies.
- **Product lines (vendor)** = lines of the bikes that use any part this vendor supplies.

### 4.4 Output files (JSON contracts)

All money fields are raw numbers (dollars). The UI formats them. IDs are strings.

**summary.json**
```json
{"periodStart":"2022-04-15","periodEnd":"2025-09-21","totalSpend":63791994.84,"poLines":8845,
 "vendorCount":86,"bikeCount":97,"bomTiedSpend":60611985.64,"bomTiedShare":0.9502,
 "unmappedSpend":3180009.2,"ppvTotal":2968912.87,"ppvShare":0.0488,"bestPriceSavings":889977.93,
 "rejectedValue":2028853.11,"rejectRate":0.0312,
 "lines":[{"line":"Road","bikes":43,"units":47107,"ppv":1223525.5,"savings":242366.5}, ...]}
```

**products.json** (array, 97 bikes, sorted by ppvTotal desc)
```json
{"id":"969","name":"Touring-1000 Blue, 60","line":"Touring","units":1116,"partCount":48,
 "costUnit":854.8243,"stdUnit":814.1184,"ppvUnit":40.7059,"vsStd":0.05,"ppvTotal":45427.81,
 "saveUnit":30.0055,"saveTotal":33486.13}
```

**bom/<productId>.json** (one per bike; a tree)
```json
{"id":"969","name":"Touring-1000 Blue, 60","made":true,"qty":1,"line":"Touring","units":1116,
 "costUnit":854.82,"stdUnit":814.12,"ppvUnit":40.71,"saveUnit":30.01,
 "leafParts":[{"partId":"513","qtyPerUnit":2}, ...],
 "children":[{"id":"821","name":"Touring Front Wheel","made":true,"qty":1,"costUnit":124.16,
              "stdUnit":118.25,"ppvUnit":5.91,"saveUnit":12.36,"leafParts":[...],"children":[...]}, ...]}
```
`qty` is the quantity per one finished bike. Node figures are per one finished bike (already multiplied by qty). `leafParts` lists every purchased part under the node (including the node itself if it is purchased), with quantity per finished bike. A node with `made:false` and no children is a purchased part.

**parts.json** (object keyed by part ID, all 265 purchased parts)
```json
{"513":{"id":"513","name":"Touring Rim","spend":1823935.58,"std":1737081.5,"ppv":86854.08,
 "save":346500.0,"vendorCount":2,"bestPrice":26.5965,"onBom":true,"consumption":29470,
 "whereUsed":[{"productId":"969","qtyPerUnit":2,"units":1116,"share":0.0757,"allocatedSpend":138141.3}, ...],
 "vendors":[{"vendorId":"...","name":"Premier Sport, Inc.","qty":27500,"spend":1077903.75,"std":...,
             "ppv":...,"avgPrice":39.1965,"premium":...,"rejectedQty":...,"receivedQty":...}, ...]}}
```
(Values shown with "..." are produced by the script; do not hand-type them.)

**vendors.json** (array, 86 vendors, sorted by ppv desc)
```json
{"id":"1576","name":"Superior Bicycles","spend":4555897.5,"ppv":216947.5,"premium":0,"vsCheapest":0,
 "rejectRate":0.0525,"rejectedValue":236741.0,"partsSupplied":2,"singleSource":2,
 "lines":["Mountain","Road","Touring"]}
```
Vendors that only supply non-BOM items have `lines: []`; show "Not on a BOM".

**opportunities.json** (array sorted by savings desc; parts with savings > $0.50)
```json
{"partId":"513","name":"Touring Rim","lever":"price_gap","savings":346500.0,"vendorCount":2,
 "productCount":22,"bestPrice":26.5965,"worstPrice":39.1965}
```

**unmapped.json** (array of purchased items on no BOM, sorted by spend desc)
```json
{"partId":"881","name":"Short-Sleeve Classic Jersey, S","spend":249420.0,"vendorCount":1}
```

**match_examples.json** is hand-written, see section 7.7.

### 4.5 Expected values (acceptance numbers)

The pipeline and the UI must reproduce these. Tolerance: ±$1 on totals, ±$0.01 on per-unit values.

| Metric | Value |
|---|---|
| Total spend | $63,791,995 (shown $63.8M) |
| PO lines / vendors / bikes | 8,845 / 86 / 97 |
| BOM-tied spend | $60,611,986 (95.0%) |
| Not on a BOM | $3,180,009 (shown $3.2M) |
| PPV total | $2,968,913 (4.9% over standard) |
| Best-price savings total | $889,978 |
| Rejected value / rate | $2,028,853 / 3.1% |
| PPV by line | Road $1,223,525 · Mountain $1,138,914 · Touring $523,845 |
| Savings by line | Road $242,366 · Mountain $201,454 · Touring $427,139 |
| Touring-1000 Blue, 60 (id 969) | 1,116 units · $854.82 cost/unit · $814.12 std · +$40.71 PPV/unit · $45,428 PPV · $30.01 save/unit · $33,486 savings |
| Touring Front Wheel in that bike | $124.16 cost · +$5.91 PPV · $12.36 savings per unit |
| Touring Rim (id 513) | savings $346,500 · 2 vendors ($26.60 and $39.20) · used in 22 bikes |
| Top opportunities | Touring Rim $346.5K · HL Crankarm $65.3K · HL Road Rim $59.2K · LL Crankarm $55.4K · ML Crankarm $55.4K |
| Top vendor by PPV | Superior Bicycles: $4.56M spend, $217K PPV, 5.2% rejects, 2 single-source parts |

Note: line PPV sums to $2.89M, which is less than the $2.97M total, because line figures cover BOM-tied spend only. Same for savings ($871K vs $890K). Show the tooltip "Product-line figures cover BOM-tied spend only" on the line chart.

### 4.6 The pipeline script (data/build_data.py)

This script has been run against the dataset and produces the numbers above. Use it as written.

```python
"""Build the JSON files the UI reads, from the AdventureWorks OLTP CSVs.

Usage: python3 data/build_data.py data/raw web/public/data
"""
import json
import os
import sys
from collections import defaultdict

import pandas as pd

RAW, OUT = sys.argv[1].rstrip("/") + "/", sys.argv[2]
os.makedirs(OUT + "/bom", exist_ok=True)

COLS = {
    "Product": ["ProductID", "Name", "ProductNumber", "MakeFlag", "FinishedGoodsFlag", "Color",
                "SafetyStockLevel", "ReorderPoint", "StandardCost", "ListPrice", "Size",
                "SizeUnitMeasureCode", "WeightUnitMeasureCode", "Weight", "DaysToManufacture",
                "ProductLine", "Class", "Style", "ProductSubcategoryID", "ProductModelID",
                "SellStartDate", "SellEndDate", "DiscontinuedDate", "rowguid", "ModifiedDate"],
    "PurchaseOrderDetail": ["PurchaseOrderID", "PurchaseOrderDetailID", "DueDate", "OrderQty",
                            "ProductID", "UnitPrice", "LineTotal", "ReceivedQty", "RejectedQty",
                            "StockedQty", "ModifiedDate"],
    "PurchaseOrderHeader": ["PurchaseOrderID", "RevisionNumber", "Status", "EmployeeID", "VendorID",
                            "ShipMethodID", "OrderDate", "ShipDate", "SubTotal", "TaxAmt", "Freight",
                            "TotalDue", "ModifiedDate"],
    "ProductVendor": ["ProductID", "VendorID", "AverageLeadTime", "StandardPrice", "LastReceiptCost",
                      "LastReceiptDate", "MinOrderQty", "MaxOrderQty", "OnOrderQty", "UnitMeasureCode",
                      "ModifiedDate"],
    "Vendor": ["VendorID", "AccountNumber", "Name", "CreditRating", "PreferredVendorStatus",
               "ActiveFlag", "PurchasingWebServiceURL", "ModifiedDate"],
    "BillOfMaterials": ["BillOfMaterialsID", "ProductAssemblyID", "ComponentID", "StartDate", "EndDate",
                        "UnitMeasureCode", "BOMLevel", "PerAssemblyQty", "ModifiedDate"],
    "WorkOrder": ["WorkOrderID", "ProductID", "OrderQty", "StockedQty", "ScrappedQty", "StartDate",
                  "EndDate", "DueDate", "ScrapReasonID", "ModifiedDate"],
}


def load(name):
    return pd.read_csv(RAW + name + ".csv", sep="\t", header=None, names=COLS[name], dtype=str,
                       keep_default_na=False, quoting=3)


P, D, H, PV, V, B, W = (load(n) for n in ["Product", "PurchaseOrderDetail", "PurchaseOrderHeader",
                                          "ProductVendor", "Vendor", "BillOfMaterials", "WorkOrder"])
name = dict(zip(P.ProductID, P.Name))
made = dict(zip(P.ProductID, P.MakeFlag == "1"))
LINE = {"R": "Road", "M": "Mountain", "T": "Touring"}
line = {pid: LINE.get(pl.strip()) for pid, pl in zip(P.ProductID, P.ProductLine)}
vname = dict(zip(V.VendorID, V.Name))

# ---- PO lines, each tagged with vendor and that vendor's standard price for the part
d = D.merge(H[["PurchaseOrderID", "VendorID", "OrderDate"]], on="PurchaseOrderID")
d = d.merge(PV[["ProductID", "VendorID", "StandardPrice"]], on=["ProductID", "VendorID"], how="left")
for c in ["OrderQty", "UnitPrice", "StandardPrice", "ReceivedQty", "RejectedQty"]:
    d[c] = d[c].astype(float)
assert d.StandardPrice.notna().all(), "every PO line should have a vendor standard price"
d["spend"] = d.OrderQty * d.UnitPrice          # qty x price everywhere (in place of LineTotal) so all sums agree
d["std"] = d.OrderQty * d.StandardPrice
d["rejv"] = d.RejectedQty * d.UnitPrice

# ---- per part x vendor
pv = d.groupby(["ProductID", "VendorID"]).agg(
    qty=("OrderQty", "sum"), spend=("spend", "sum"), std=("std", "sum"),
    rej=("RejectedQty", "sum"), rec=("ReceivedQty", "sum"), rejv=("rejv", "sum")).reset_index()
pv["avg"] = pv.spend / pv.qty
best = pv.groupby("ProductID").avg.min()
pv["best"] = pv.ProductID.map(best)
pv["premium"] = pv.spend - pv.qty * pv.best      # dollars paid above the cheapest vendor's average
nvend = pv.groupby("ProductID").VendorID.nunique()

part = d.groupby("ProductID").agg(qty=("OrderQty", "sum"), spend=("spend", "sum"), std=("std", "sum"))
part["save"] = pv.groupby("ProductID").premium.sum()
bought = set(part.index)

# ---- BOM explosion (current rows only: EndDate empty)
cur = B[B.EndDate == ""]
kids = defaultdict(list)
for a, c, q in zip(cur.ProductAssemblyID, cur.ComponentID, cur.PerAssemblyQty.astype(float)):
    if a:
        kids[a].append((c, q))
tops = [t for t in cur[cur.ProductAssemblyID == ""].ComponentID.unique()
        if line.get(t) and t in kids]


def leaves(pid, mult=1.0, acc=None):
    """Purchased parts under pid, with quantity per one unit of pid."""
    acc = {} if acc is None else acc
    for c, q in kids.get(pid, []):
        if c in bought:
            acc[c] = acc.get(c, 0.0) + mult * q
        if c in kids:
            leaves(c, mult * q, acc)
    return acc


W["StockedQty"] = W.StockedQty.astype(float)
units = W.groupby("ProductID").StockedQty.sum().to_dict()
bikes = [t for t in tops if units.get(t, 0) > 0 and leaves(t)]

# ---- allocation: spread each part's spend over bikes by consumption.
# Vendors sell in cartons/cases/dozens while BOMs count pieces, so qty x price is wrong.
# Consumption = sum over bikes of (qty per bike x units built). Effective price per BOM unit
# = part spend / consumption. This ties allocated spend back to BOM-tied spend exactly.
L = {t: leaves(t) for t in bikes}
cons = defaultdict(float)
where = defaultdict(set)
for t, lv in L.items():
    for c, q in lv.items():
        cons[c] += q * units[t]
        where[c].add(t)
eff = {c: (part.spend[c] / cons[c], part["std"][c] / cons[c], part.save[c] / cons[c]) for c in cons}


def roll(lv):
    a = sum(q * eff[c][0] for c, q in lv.items())
    s = sum(q * eff[c][1] for c, q in lv.items())
    v = sum(q * eff[c][2] for c, q in lv.items())
    return a, s, v


def r2(x):
    return round(float(x), 4)


# ---- products.json
products = []
for t in bikes:
    a, s, v = roll(L[t])
    u = units[t]
    products.append(dict(id=t, name=name[t], line=line[t], units=int(u), partCount=len(L[t]),
                         costUnit=r2(a), stdUnit=r2(s), ppvUnit=r2(a - s), vsStd=r2((a - s) / s),
                         ppvTotal=r2((a - s) * u),
                         saveUnit=r2(v), saveTotal=r2(v * u)))
products.sort(key=lambda p: -p["ppvTotal"])

# ---- bom/<productId>.json : tree with per-unit rollups at every node
def node(pid, qty):
    lv = {pid: 1.0} if pid in bought else {}
    for c, q in leaves(pid).items():
        lv[c] = lv.get(c, 0.0) + q
    a, s, v = roll({c: q * qty for c, q in lv.items()})
    return dict(id=pid, name=name[pid], made=bool(made[pid]), qty=qty,
                costUnit=r2(a), stdUnit=r2(s), ppvUnit=r2(a - s), saveUnit=r2(v),
                leafParts=[dict(partId=c, qtyPerUnit=r2(q * qty)) for c, q in lv.items()],
                children=[node(c, q * qty) for c, q in kids.get(pid, [])] if pid in kids else [])


for t in bikes:
    tree = node(t, 1.0)
    tree["line"] = line[t]
    tree["units"] = int(units[t])
    json.dump(tree, open(f"{OUT}/bom/{t}.json", "w"))

# ---- parts.json
parts = {}
for c in part.index:
    vs = pv[pv.ProductID == c]
    parts[c] = dict(
        id=c, name=name[c], spend=r2(part.spend[c]), std=r2(part["std"][c]), ppv=r2(part.spend[c] - part["std"][c]),
        save=r2(part.save[c]), vendorCount=int(nvend[c]), bestPrice=r2(best[c]),
        onBom=c in cons, consumption=r2(cons.get(c, 0)),
        whereUsed=sorted([dict(productId=t, qtyPerUnit=r2(L[t][c]), units=int(units[t]),
                               share=r2(L[t][c] * units[t] / cons[c]),
                               allocatedSpend=r2(L[t][c] * units[t] * eff[c][0]))
                          for t in where.get(c, [])], key=lambda w: -w["allocatedSpend"]),
        vendors=[dict(vendorId=r.VendorID, name=vname[r.VendorID], qty=r2(r.qty), spend=r2(r.spend), std=r2(r["std"]),
                      ppv=r2(r.spend - r["std"]), avgPrice=r2(r.avg), premium=r2(r.premium),
                      rejectedQty=r2(r.rej), receivedQty=r2(r.rec)) for _, r in vs.iterrows()])

# ---- vendors.json
vend = []
for vid, g in pv.groupby("VendorID"):
    ps = list(g.ProductID)
    spend, std, prem = g.spend.sum(), g["std"].sum(), g.premium.sum()
    lines_ = sorted({line[t] for c in ps for t in where.get(c, [])})
    vend.append(dict(id=vid, name=vname[vid], spend=r2(spend), ppv=r2(spend - std), premium=r2(prem),
                     vsCheapest=r2(prem / (spend - prem)), rejectRate=r2(g.rej.sum() / g.rec.sum()),
                     rejectedValue=r2(g.rejv.sum()), partsSupplied=len(ps),
                     singleSource=sum(1 for c in ps if nvend[c] == 1), lines=lines_))
vend.sort(key=lambda v: -v["ppv"])

# ---- opportunities.json (price gap lever; consolidation/quality are later phases)
opps = [dict(partId=c, name=name[c], lever="price_gap", savings=r2(part.save[c]), vendorCount=int(nvend[c]),
             productCount=len(where.get(c, [])), bestPrice=r2(best[c]),
             worstPrice=r2(pv[pv.ProductID == c].avg.max()))
        for c in part.index if part.save[c] > 0.5]
opps.sort(key=lambda o: -o["savings"])

# ---- summary.json
tot = d.spend.sum()
tied = sum(part.spend[c] for c in cons)
by_line = []
for ln in ["Road", "Mountain", "Touring"]:
    ps = [p for p in products if p["line"] == ln]
    by_line.append(dict(line=ln, bikes=len(ps), units=sum(p["units"] for p in ps),
                        ppv=r2(sum(p["ppvTotal"] for p in ps)), savings=r2(sum(p["saveTotal"] for p in ps))))
summary = dict(
    periodStart=H.OrderDate.min()[:10], periodEnd=H.OrderDate.max()[:10],
    totalSpend=r2(tot), poLines=len(d), vendorCount=d.VendorID.nunique(), bikeCount=len(products),
    bomTiedSpend=r2(tied), bomTiedShare=r2(tied / tot), unmappedSpend=r2(tot - tied),
    ppvTotal=r2(tot - d["std"].sum()), ppvShare=r2((tot - d["std"].sum()) / d["std"].sum()),
    bestPriceSavings=r2(part.save.sum()), rejectedValue=r2(d.rejv.sum()),
    rejectRate=r2(d.RejectedQty.sum() / d.ReceivedQty.sum()), lines=by_line)
unmapped = sorted([dict(partId=c, name=name[c], spend=r2(part.spend[c]), vendorCount=int(nvend[c]))
                   for c in part.index if c not in cons], key=lambda x: -x["spend"])

for fn, obj in [("summary", summary), ("products", products), ("vendors", vend), ("parts", parts),
                ("opportunities", opps), ("unmapped", unmapped)]:
    json.dump(obj, open(f"{OUT}/{fn}.json", "w"))
print(json.dumps({k: v for k, v in summary.items() if k != "lines"}, indent=1))
print(json.dumps(summary["lines"], indent=1))
```

---

## 5. Design system

### 5.1 Tokens

| Token | Value | Use |
|---|---|---|
| bg | #F7F7F5 | page background |
| surface | #FFFFFF | cards, nav rail |
| border | #E4E4E0 | card borders, header rule |
| rule | #EFEFEC | row dividers |
| groupRow | #F4F4F1 | grouped table header rows, hover |
| text | #18181B | primary text |
| textSecondary | #52525B | labels, supporting text |
| textMuted | #71717A | captions, "None" |
| accent | #3B5BDB (hover #2B44A8) | links, active nav, focus ring, progress bar |
| accentTint | #EEF1FB | active nav background, chips, Blended badge |
| ppv | #B45309 | PPV and overpayment figures |
| ppvBar | #F59E0B | PPV bars on the line chart |
| savings | #15803D | savings figures |
| savingsTint | #F0FAF3 (border #BBE5C8) | highlighted savings rows, insight banner |
| warnTint | #FFF7ED | vendor rows with vs cheapest > 20% |
| reject | #B91C1C | reject rates of 5% or more |

Radius: 10px cards, 8px inputs and buttons, 6px nav items, 4px chips. Borders are 1px. No shadows, no gradients.

### 5.2 Typography

Inter. Page title 24px/600. Card title 15px/600. Body and table cells 13px/400. Column headers 13px/500 in textSecondary. KPI values 28px/600 (26px on level pages). Captions 12px. All numbers use `font-variant-numeric: tabular-nums` and are right-aligned in tables. Sentence case everywhere.

### 5.3 Number formatting (lib/format.ts)

- `money(v)`: |v| ≥ 1M → `$1.22M` (2 decimals); ≥ 1K → `$346.5K` (1 decimal); else `$412`. Negative values get a leading minus sign.
- `unitMoney(v)`: always 2 decimals, `$854.82`.
- `ppvUnit(v)`: `+$40.71` (plus sign when positive).
- `pct(v)`: 1 decimal, `5.2%`. `pctSigned(v)`: `+5.0%`.
- `vsCheapest(v)`: `Lowest` when v is 0, else `pctSigned(v)`.
- `count(v)`: thousands separators, `47,107`.
- Single-source: `None`, `1 part`, `2 parts`.

### 5.4 Color rules

- PPV numbers in tables: ppv color.
- Savings numbers: savings color; the largest savings value in a components table is also 600 weight and its row gets savingsTint.
- vs cheapest: textSecondary for Lowest, ppv color when > 0, ppv + 600 weight when > 5%. Row gets warnTint when > 20%.
- Reject rate: reject color at 5% or more, otherwise default text.

### 5.5 Accessibility

Real `<button>` and `<a>` elements. Column headers are buttons. Use real `<table>` markup with `<th scope="col">` and `aria-sort` on the active column. Visible focus ring (2px accent). Text contrast 4.5:1.

---

## 6. Shared components

### 6.1 AppShell and NavRail

Two-column layout: a 232px white nav rail on the left (border-right), content on the right (padding 28px 32px, inner max-width 1180px on Overview and 1280px elsewhere, centered).

Nav rail: product name "Spendline" (15px/600) at top, then links: Overview, Products, Opportunities, Vendors. A small "Pipeline" label (12px textMuted), then Match review. Active link: accentTint background, accent-dark text, 500 weight.

### 6.2 GlobalSearch

A labeled search input (300px, 38px tall) in the Overview header, placeholder "Touring Rim, Road-650, Proseware". Typing 2+ characters shows a dropdown of up to 8 matches across products, parts, and vendors (case-insensitive substring on name), each with a type label. Enter or click navigates: product → `/products/:id`, part → `/parts/:id`, vendor → `/vendors?highlight=:id`.

### 6.3 SortableTable (the most important component)

Generic over a row type.

```ts
type Column<T> = {
  key: string;                    // sort key
  label: string;                  // header text, sentence case
  numeric?: boolean;              // right-align and default to descending
  value: (row: T) => number | string;   // used for sorting
  render?: (row: T) => ReactNode; // cell content
  width?: string;
};
props: { columns: Column<T>[]; rows: T[]; defaultSort: { key: string; dir: 'desc' | 'asc' };
         pageSize?: number; rowClassName?: (row: T) => string; collapsedCount?: number;
         caption: string; }
```

Behavior:
- Default sort is the `defaultSort` prop (always PPV desc in this app).
- Clicking a header sorts by it. Clicking the active header flips direction. A newly chosen numeric column starts descending; a text column starts ascending (A to Z).
- Arrow after the label: active column shows ↓ (desc) or ↑ (asc) in text color; inactive columns show ↕ in #A1A1AA. Arrows are `aria-hidden`; the header carries `aria-sort`.
- Changing the sort resets to page 1.
- With `pageSize`, show a footer: "1 to 8 of 86 vendors" plus Previous and Next buttons. Buttons stay enabled and clamp at the ends.
- With `collapsedCount`, show only the top N rows plus a text button "Show all 14 components" / "Show top 8".
- Sorting always applies to the full row set across every page.
- Table wrapper scrolls horizontally if narrower than the table.

### 6.4 KpiTile

Card: 13px label, large value (optionally colored), 12px caption. Optional thin progress bar (6px, accent fill) for the BOM-tied tile.

### 6.5 CostSummary (level pages and part pages)

Four KpiTiles in a row: "Material cost per unit" with a BlendedBadge, "Standard per unit", "PPV per unit" (ppv color, caption "+5.0% · $45.4K total"), "Savings at best price" (savings color, caption "per unit · $33.5K total"). Totals = per-unit × units built.

### 6.6 BlendedBadge

Small accentTint chip with the text "Blended", `title`/tooltip: "Volume-weighted average across all vendors, April 2022 to September 2025".

### 6.7 MadeBoughtTag, LeverChip, Breadcrumb

- MadeBoughtTag: gray chip "Made" or "Bought" after a component name.
- LeverChip: accentTint chip "Price gap" (later "Quality cost").
- Breadcrumb: `Overview / Touring / Touring-1000 Blue, 60 / Touring Front Wheel`, each segment a link except the last.

### 6.8 VendorTable

A SortableTable of vendor rows, pageSize 8, default sort PPV desc. Two modes:

- **All spend** (Overview, Vendors page) from vendors.json. Columns: Vendor, Spend, Product lines, PPV, vs cheapest, Reject rate, Single-source.
- **Scoped to a set of parts** (level pages, part page) computed by `vendorsForParts(partIds)` (section 8). Columns: Vendor (with a 12px muted second line "2 parts: Front Brakes, Rear Brakes"), Spend, PPV, vs cheapest, Reject rate, Single-source. Card subtitle: "Spend on these parts across all products".

---

## 7. Screens

### 7.1 Overview (`/`)

Header row: title "Spend overview", subtitle "April 2022 to September 2025 · purchased material · blended prices", GlobalSearch on the right.

**Row 1 (two equal columns):**
- Left: 2×2 KpiTiles.
  - Material spend: `$63.8M`, caption "86 vendors · 8,845 PO lines".
  - Tied to a BOM: `95.0%`, progress bar, caption "$60.6M across 97 bikes".
  - Paid above standard (PPV): `$2.97M` in ppv color, caption "4.9% over vendor standard prices".
  - Savings at best price: `$890K` in savings color, caption "If each part came from its cheapest vendor".
- Right: card "PPV by product line". One button per line (Road, Mountain, Touring), each a row: line name, a horizontal bar (ppvBar, width proportional to the largest line), and "$1.22M · 43 bikes". Clicking a line filters the Products table to that line; clicking it again clears the filter; show "Showing Touring · Clear" above the table while filtered. Footer line: "Savings at best price: Road $242K · Mountain $201K · Touring $427K" with the largest in savings color and bold. Tooltip on the card title per section 4.5.

**Row 2 (1.65fr and 1fr):**
- Left: card "Products". SortableTable grouped by line. Each group has a header row (groupRow background): "Road · 43 bikes", total units, PPV total, savings total. Under it, the top 2 bikes by the active sort, then a text button "Show all 43 Road bikes" that expands that group. Columns: Product (link to `/products/:id`), Units built, Material / unit, vs standard, PPV, Best-price savings. Sorting sorts bikes within each group; groups reorder by their totals when the sort key is units, PPV, or savings, by name when the key is Product, and by PPV otherwise.
- Right column:
  - Card "Top opportunities": the top 5 from opportunities.json. Each row: part name (link to `/parts/:id`), LeverChip, "2 vendors · in 22 bikes", savings value on the right in savings color. "View all" links to `/opportunities`.
  - Dashed-border card linking to `/match-review`: "5% of spend is not on a BOM" / "$3.2M to review in the match queue".

**Row 3:** VendorTable in all-spend mode, full width, title "Vendors".

### 7.2 Products (`/products`)

Same grouped product table as the Overview, full width, every group expanded, with a name filter input above it.

### 7.3 Level page (`/products/:productId` and `/products/:productId/:nodePath*`)

`nodePath` is a slash-separated chain of node IDs from the bike down, for example `/products/969/821` is Touring Front Wheel inside Touring-1000 Blue, 60. Load `bom/<productId>.json` and walk the path.

Layout, top to bottom:
1. Breadcrumb.
2. Title (node name) and meta line: for a bike, "1,116 units built · 48 purchased parts · 44 vendors · April 2022 to September 2025"; for an assembly, "Made in-house · 8 purchased parts · 1 per bike". Right side: link "Compare with <sibling variant>" (optional, phase 3).
3. CostSummary for the node.
4. Card "Assemblies and parts" (full width): SortableTable of the node's children, per bike unit, default sort PPV desc, collapsedCount 8. Columns: Component (name link + MadeBoughtTag + muted second line like "8 parts · includes Touring Rim" or "Single source"), Cost, Share of cost, PPV, Best-price savings. Share of cost = child cost ÷ node cost. The child with the largest savings gets the savingsTint row. Clicking a made child goes one level deeper; clicking a purchased child goes to `/parts/:partId`.
5. Card "Vendors for this bike" (or "Vendors for this assembly"): VendorTable scoped to the node's `leafParts`.
6. Insight banner (savingsTint) when any leaf part under the node has an opportunity ≥ $10K. Text built from data, for example: "Both wheels use the Touring Rim, bought at $39.20 from Premier Sport, Inc. and $26.60 from Anderson's Custom Bikes. Harmonizing it saves $346.5K across 22 bikes." Link "Open Touring Rim".

### 7.4 Part detail (`/parts/:partId`)

1. Breadcrumb: if arrived from a level page, keep that path; otherwise `Overview / Parts / Touring Rim`.
2. Title and meta: "2 vendors · used in 22 bikes · Bought".
3. Four KpiTiles: Spend, PPV, Best-price savings, Reject rate.
4. Card "Vendor prices": one row per vendor with a horizontal bar of average unit price (cheapest bar in savings color, others in ppv color), the price, quantity bought, spend, vs cheapest, reject rate. Sortable.
5. Card "Savings simulator": a range slider "Move this share of volume to the cheapest vendor" from 0 to 100% (step 5, default 100). Output: "Saves $346.5K" = slider share × part.save, live. Second line: "Across 22 bikes" using the whereUsed count.
6. Card "Where used": SortableTable of bikes in `whereUsed`, collapsedCount 10. Rows come from `part.whereUsed`. Columns: Product (link), Line, Qty per bike (`qtyPerUnit`), Units built, Share of consumption (`share`), Allocated spend (`allocatedSpend`). Default sort Allocated spend desc for this table only.

### 7.5 Opportunities (`/opportunities`)

Title "Opportunities", subtitle "Price gaps across all products". Filter chips: All, Price gap (only levers present in the data appear). Running total above the table: "$890K across N parts" for the current filter. SortableTable of opportunities.json, default sort Savings desc. Columns: Part (link), Lever, Savings, Vendors, Bikes affected, Best price, Highest price.

### 7.6 Vendors (`/vendors`)

Full-width VendorTable in all-spend mode with a name filter. `?highlight=:id` scrolls to and briefly tints that row (go to the right page first).

### 7.7 Match review (`/match-review`)

Concept screen. Header with an "Illustrative" badge (amber chip) and subtitle "How new spend lines would be matched to BOM parts. Sample lines are hand-written; the dataset already links parts by ID."

Left (2fr): a review queue of 6 sample messy spend lines from `match_examples.json`. Each card: raw description, vendor, unit of measure, unit price; the top 3 candidate parts with a confidence bar and percentage; Accept and Reject buttons that only update local state (accepted cards collapse with a check). Write match_examples.json by hand with real part names from parts.json, for example:

```json
[{"raw":"RIM TRG 700C ALU BLK","vendor":"Premier Sport, Inc.","uom":"EA","price":39.20,
  "candidates":[{"partId":"513","name":"Touring Rim","confidence":0.91},
                {"partId":"512","name":"HL Road Rim","confidence":0.06},
                {"partId":"509","name":"HL Mountain Rim","confidence":0.03}]},
 {"raw":"BRG BALL 1/4 CTN","vendor":"<pick a real vendor of Bearing Ball>","uom":"CTN","price":41.92,
  "candidates":[{"name":"Bearing Ball","confidence":0.84},{"name":"Headset Ball Bearings","confidence":0.12},{"name":"Cup-Shaped Race","confidence":0.04}]}]
```
Fill in the remaining four with parts such as Spokes, LL Nipple, Chainring Bolts, HL Crankarm, and include one low-confidence line (top candidate under 60%) and one resale item from unmapped.json that should be classified as "Not a BOM part".

Right (1fr): card "How matching works", a vertical 5-step flow built from plain boxes: Spend line in → Shortlist candidates with fuzzy matching → Local LLM picks a part and scores confidence → High confidence auto-accepts, low confidence goes to review → Each review is stored and reused as an example. Under it, one line: "Runs on a local model so supplier prices never leave the company."

---

## 8. Client-side logic

### 8.1 lib/data.ts

`useJson<T>(path)` hook: fetch from `/data/...`, cache in a module-level Map, return `{data, loading, error}`. Load summary, products, vendors, parts, opportunities once at app start; load `bom/<id>.json` on demand.

### 8.2 lib/vendorsForParts.ts

```ts
function vendorsForParts(partIds: string[], parts: Record<string, Part>): VendorRow[]
```
For each part ID, for each entry in `parts[id].vendors`, accumulate by vendorId: spend, std, premium, rejectedQty, receivedQty, and the list of part names. Then per vendor: `ppv = spend - std`, `vsCheapest = premium / (spend - premium)` (0 if premium is 0), `rejectRate = rejectedQty / receivedQty`, `singleSource` = count of its parts where `parts[id].vendorCount === 1`, `partsLabel` = "1 part: Touring Rim" or "2 parts: Front Brakes, Rear Brakes" (alphabetical, name the first two then "+N more"). Spend is company-wide spend on those parts, which is why the card subtitle says "across all products".

### 8.3 lib/sort.ts

Stable sort with a comparator from `Column.value`. Strings use `localeCompare`, numbers subtract.

---

## 9. Build order

Check each phase in the browser before starting the next.

**Phase 0: data (about 30 minutes).** Download, run the pipeline, confirm the printed summary matches section 4.5. Commit `web/public/data`.

**Phase 1: shell and shared pieces.** Vite app, Tailwind tokens, Inter, AppShell, NavRail, router with all routes stubbed, format.ts, data hooks, SortableTable with a quick test page.

**Phase 2: the demo path (most important).** Overview (all three rows), Level page for bikes and assemblies, Part detail with the slider. Walk the demo story from section 1 end to end and check every number against section 4.5.

**Phase 3: supporting screens.** Opportunities, Products, Vendors, GlobalSearch, line filter on the Overview, insight banner.

**Phase 4: concept and polish.** Match review screen and its JSON, empty and loading states, focus states, README with the run commands and the method summary from section 4.3.

---

## 10. Acceptance checklist

- [ ] `python3 data/build_data.py data/raw web/public/data` prints the section 4.5 summary values.
- [ ] Overview KPI tiles show $63.8M, 95.0%, $2.97M, $890K.
- [ ] Line chart shows Road $1.22M, Mountain $1.14M, Touring $0.52M; clicking Touring filters the products table.
- [ ] Every table sorts by every column, arrows update, PPV desc is the default, and sorting covers all rows across pages.
- [ ] Vendor tables page 8 at a time and read "1 to 8 of 86 vendors" on the Overview.
- [ ] `/products/969` shows $854.82, $814.12, +$40.71, $30.01, and 14 components with Touring Front Wheel and Touring Rear Wheel highlighted.
- [ ] Clicking Touring Front Wheel opens `/products/969/821`; clicking Touring Rim opens `/parts/513`.
- [ ] Part 513 shows two vendors at $26.60 and $39.20, savings $346.5K, slider at 50% shows $173.3K.
- [ ] Premier Sport, Inc. shows +47.4% vs cheapest with the warn tint in the Touring-1000 vendor table.
- [ ] Every price in product views has the Blended badge and tooltip.
- [ ] Match review shows the Illustrative badge.
- [ ] No console errors. All interactive elements reachable by keyboard.

---

## 11. Out of scope

Sankey diagrams, date pickers, plant filters, projector or mobile layout work, FIFO costing, real LLM matching, authentication, a backend, editing data in the UI, and invented data presented as real. Do not invent a vendor-to-bike assignment: product views always use blended prices.
