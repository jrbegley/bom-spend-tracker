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
