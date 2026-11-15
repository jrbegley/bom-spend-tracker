# Common Thread

A BOM to spend cube explorer. It links every purchased part to the products that use it, rolls real purchase prices up the bill of materials, and shows two gaps at every level:

1. **PPV (purchase price variance):** what was paid above the vendors' own standard prices.
2. **Best-price savings:** what would be saved if every part were bought from its cheapest vendor.

The primary user is a product cost owner asking "why does this bike cost what it does, and which parts drive it?". Procurement is served by the Opportunities page.

All cost analysis runs on real data: the Microsoft AdventureWorks OLTP sample, April 2022 to September 2025. The **Match review** screen is a labeled concept: it shows how messy spend lines would be matched to BOM parts with a local LLM and a human review queue. Its sample lines are hand-written, because the dataset already links parts by ID.

`BUILD_SPEC.md` is the full spec.

## Run the app

The pipeline output in `web/public/data` is committed, so the app runs without Python.

```bash
cd web
npm install
npm run dev          # http://localhost:5173
```

Checks:

```bash
cd web
npm test             # Vitest, against the real pipeline JSON
npm run build        # type check and production build
npx oxlint src       # lint
```

`/dev` is a component test page, available only in dev builds.

## Regenerate the data (optional)

Needs Python 3.10+ and pandas.

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install pandas
mkdir -p data/raw
curl -L -o /tmp/aw.zip https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorks-oltp-install-script.zip
unzip -o /tmp/aw.zip -d data/raw
python3 data/build_data.py data/raw web/public/data
python3 data/check_outputs.py web/public/data     # prints ALL CHECKS PASSED
```

`web/public/data/match_examples.json` is written by hand and is not produced by the pipeline.

## Method

All PO data from April 2022 to September 2025, one time window everywhere. Costs are **purchased material only**: the standard is each vendor's standard price (`ProductVendor.StandardPrice`), and labor and overhead are excluded on both sides. `Product.StandardCost` is $0 for most purchased parts, so it is not used.

**Blended price per part.** For each part, every PO line across all vendors is combined. Product views use this blended price because the data cannot say which vendor's parts went into which bike. Prices in product views carry a "Blended" badge.

**Consumption.** Each bike's BOM is exploded to its purchased parts, multiplying quantities down the levels (current BOM rows only). For each part:

> consumption = Σ over bikes of (quantity per bike × units built), where units built = Σ `WorkOrder.StockedQty` for that bike.

**Effective prices per BOM unit.** Vendors sell in cartons, cases and dozens while BOMs count pieces, so quantity × purchase price would be nonsense. Spend is instead spread over consumption, which is unit-of-measure safe:

- `effPrice = part spend / consumption`
- `effStd = part standard spend / consumption`, where standard spend = Σ OrderQty × that vendor's StandardPrice
- `effSave = part best-price savings / consumption`

**Rollups.** Any node's cost per unit = Σ over its purchased leaf parts of (quantity per unit × effPrice). The same applies to standard and savings. Allocated spend across all bikes ties back exactly to BOM-tied spend ($60.61M).

Because allocation spreads *all* spend over what was *consumed*, the effective price inside product views can be higher than any vendor's price (purchases that went to inventory are included). Part detail shows actual vendor prices.

**Definitions.**

- **Spend** = OrderQty × UnitPrice (used everywhere in place of LineTotal so all sums agree).
- **PPV** = spend − standard spend.
- **Best-price savings for a part** = Σ over vendors of (vendor spend − vendor qty × lowest vendor average price for that part).
- **vs cheapest (vendor)** = premium ÷ (spend − premium), where premium is that vendor's share of best-price savings. Shown as "Lowest" when 0.
- **Reject rate** = RejectedQty ÷ ReceivedQty.
- **Single-source parts (vendor)** = parts this vendor supplies that no other vendor supplies.
- **Product lines (vendor)** = lines of the bikes that use any part this vendor supplies.

PPV and best-price savings are shown side by side and never added together.

## Layout

```
data/build_data.py        pipeline (pandas), writes web/public/data
data/check_outputs.py     acceptance checks for the pipeline output
web/src/lib/              pure, unit-tested logic (formatting, sorting, BOM walk, search, ...)
web/src/components/       shared UI (SortableTable, VendorTable, CostSummary, ...)
web/src/pages/            screens; each splits into a pure View and a thin data-loading wrapper
docs/superpowers/plans/   the plan for each build phase
```
