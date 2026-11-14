# Spendline Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the verified static JSON dataset (phase 0), then the React app shell, routing, data hooks, formatting, and the shared components from spec section 6 (phase 1), so phase 2 can build pages on top.

**Architecture:** One Python script (`data/build_data.py`, copied verbatim from the spec) turns the AdventureWorks CSVs into JSON under `web/public/data`. A stdlib-only checker (`data/check_outputs.py`) asserts every section 4.5 number. The web app is a Vite + React 18 SPA that fetches the static JSON. Pure logic (formatting, sorting, paging, vendor aggregation) lives in `src/lib/` and is unit tested. Components are tested by server-rendering them to HTML with `react-dom/server` and checking the markup. Click behavior is checked by hand on a `/dev` test page.

**Tech Stack:** Python 3.10+ / pandas · React 18 · TypeScript · Vite · Tailwind CSS v4 (`@tailwindcss/vite`) · react-router-dom · Vitest (dev only, see Decisions to confirm)

**Spec:** `BUILD_SPEC.md` (sections 3, 4, 5, 6, 8, 9). Read it alongside this plan.

## Global Constraints

- The spec's `spendline/` root **is this repository root** (`bom-spend-tracker/`). All paths below are relative to it.
- Python 3.10+ with pandas. One script, run once, writes static JSON.
- React 18 + TypeScript + Vite, Tailwind CSS v4 via `@tailwindcss/vite`, React Router. No chart library (bars are plain divs). No component library. No backend, no database.
- Font: Inter from Google Fonts, weights 400, 500, 600.
- "Do not add features, screens, or libraries that are not listed." The only addition is the dev-only `vitest`.
- JSON: all money fields are raw dollar numbers; all IDs are strings.
- Every table's default sort is PPV dollars, largest first. Every column is sortable.
- Vendor tables show 8 rows per page with Previous and Next.
- Radius: 10px cards, 8px inputs and buttons, 6px nav items, 4px chips. 1px borders. No shadows, no gradients.
- Type: page title 24px/600, card title 15px/600, body and cells 13px/400, column headers 13px/500 textSecondary, KPI values 28px/600 (26px on level pages), captions 12px. Numbers use `font-variant-numeric: tabular-nums` and are right-aligned in tables. Sentence case everywhere.
- Accessibility: real `<button>`/`<a>`; column headers are buttons; real `<table>` with `<th scope="col">` and `aria-sort` on the active column; visible 2px accent focus ring; 4.5:1 text contrast.
- Acceptance tolerance: ±$1 on totals, ±$0.01 on per-unit values.
- Local toolchain seen in this session: Node v24.11.0, Python 3.14.7.

## Review Focus

1. **Percent rounding at a half:** vendor 1576 has `rejectRate: 0.0525`, and section 4.5 says it shows **5.2%**. In JS, `(0.0525*100).toFixed(1)` gives `"5.3"` (checked in this session). `pct()` must round the stored double, not the product. Test in Task 2.
2. **Negative money:** parts and vendors that paid below standard have negative PPV. Expected output: `money(-1500)` → `-$1.5K`, `ppvUnit(-3.2)` → `-$3.20` (no plus sign), `pctSigned(-0.012)` → `-1.2%`. Test in Task 2.
3. **Ties in sorting:** LL Crankarm and ML Crankarm both save about $55.4K. Rows that tie must keep their input order in both directions, so the order does not jump when the sort flips. Test in Task 4. The phase 0 checker accepts these two in either order.
4. **Pagination at the ends:** Previous on page 1 and Next on the last page stay enabled but do not move. The last page reads `81 to 86 of 86 vendors`. Changing the sort goes back to page 1. Test in Task 4. Manual check in Task 5.
5. **Bad inputs to vendor aggregation:** a part with `receivedQty` 0 must give `rejectRate` 0, not NaN. Duplicate part IDs must not double-count spend. Unknown part IDs are skipped. Test in Task 8.

## Decisions to confirm

- **D1: `money()` rule vs. on-screen copy.** Section 5.3's rule (≥1M → 2 decimals, ≥1K → 1 decimal) gives `$63.79M`, `$60.61M`, `$890.0K`, and `$242.4K`. Sections 7.1 and 10 show `$63.8M`, `$60.6M`, `$890K`, and `$242K`. This plan implements section 5.3 literally (Task 2 tests pin it). Phase 2 will need to decide how the Overview gets the short forms. If you want a different rule, only the three `money` assertions marked `// D1` in Task 2 change.
- **D2: Vitest.** The spec lists no test runner. This plan adds `vitest` as a dev dependency only, with no jsdom and no testing-library, so every task has a check you can run (`npm test`). Nothing ships to the browser.
- **D3: Phase 1 scope.** Section 9's phase 1 list names the shell, tokens, format, data hooks, and SortableTable. Your request says "shared components", so this plan also builds the rest of section 6 (KpiTile, BlendedBadge, MadeBoughtTag, LeverChip, Breadcrumb, CostSummary, VendorTable + `vendorsForParts`). **GlobalSearch** is left for phase 3, where section 9 puts it. The grouped Products table is left for phase 2.

---

## File map

```
.gitignore                         Task 1
data/build_data.py                 Task 1 (verbatim from spec 4.6)
data/check_outputs.py              Task 1 (section 4.5 acceptance checker)
web/public/data/**                 Task 1 (pipeline output, committed)
web/index.html                     Task 2 (Inter link, title "Spendline")
web/vite.config.ts                 Task 2
web/src/index.css                  Task 2 (Tailwind import, @theme tokens, base styles)
web/src/lib/format.ts (+ .test.ts) Task 2
web/src/test/realData.ts           Task 3 (test helper: read public/data from disk)
web/src/lib/data.ts (+ .test.ts)   Task 3 (JSON types, fetch cache, hooks, DataProvider)
web/src/lib/sort.ts (+ .test.ts)   Task 4
web/src/main.tsx, App.tsx (+ .test.tsx)                 Task 5
web/src/components/AppShell.tsx, NavRail.tsx (+ test)   Task 5
web/src/pages/*.tsx (stubs)                             Task 5
web/src/components/SortableTable.tsx, Pagination.tsx (+ test)  Task 6
web/src/pages/DevPage.tsx                               Task 6, extended in Task 8
web/src/components/KpiTile.tsx, BlendedBadge.tsx, MadeBoughtTag.tsx,
                   LeverChip.tsx, Breadcrumb.tsx (+ test) Task 7
web/src/lib/vendorsForParts.ts (+ test)                 Task 8
web/src/components/VendorTable.tsx, CostSummary.tsx (+ test)  Task 8
```

---

## Phase 0: data pipeline

### Task 1: Pipeline output that matches section 4.5

**Files:**
- Create: `.gitignore`, `data/check_outputs.py`, `data/build_data.py`
- Generated: `web/public/data/{summary,products,vendors,parts,opportunities,unmapped}.json`, `web/public/data/bom/<id>.json` ×97

**Interfaces:**
- Produces: the JSON files described in spec 4.4. Later tasks read them from `web/public/data`.

- [ ] **Step 1: Initialize the repo**

```bash
git init
printf 'data/raw/\n.venv/\nweb/node_modules/\nweb/dist/\n.DS_Store\n' > .gitignore
```

- [ ] **Step 2: Write the acceptance checker `data/check_outputs.py` (stdlib only)**

```python
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
```

- [ ] **Step 3: Run the checker to confirm it fails**

Run: `python3 data/check_outputs.py web/public/data`
Expected: `FileNotFoundError` for `summary.json`, because there is no output yet.

- [ ] **Step 4: Download the data and set up Python**

```bash
mkdir -p data/raw
curl -L -o /tmp/aw.zip https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorks-oltp-install-script.zip
unzip -o /tmp/aw.zip -d data/raw
ls data/raw/Product.csv data/raw/PurchaseOrderDetail.csv data/raw/BillOfMaterials.csv
python3 -m venv .venv && source .venv/bin/activate && pip install pandas
```
Expected: all three `ls` paths exist. If the zip unpacked into a subfolder, use that subfolder as the raw path in Step 6. Do not move files around.

- [ ] **Step 5: Create `data/build_data.py` by copying the code block in spec section 4.6 exactly**

Copy it character for character. Do not edit or "improve" it. The spec says it has already been run and reproduces section 4.5.

- [ ] **Step 6: Run the pipeline**

Run: `source .venv/bin/activate && python3 data/build_data.py data/raw web/public/data`
Expected: it prints the summary JSON (`"totalSpend": 63791994.84`, `"poLines": 8845`, …) and the three line objects. Exit code 0.

- [ ] **Step 7: Run the checker to confirm it passes**

Run: `python3 data/check_outputs.py web/public/data`
Expected: every line starts with `PASS` and the last line is `ALL CHECKS PASSED`. Exit code 0.
If any check fails, **do not change the script or the thresholds**. Stop and report the FAIL lines. That means the data or the spec disagrees, and the team needs to decide.

- [ ] **Step 8: Commit**

```bash
git add .gitignore data/build_data.py data/check_outputs.py web/public/data
git commit -m "feat(data): build pipeline JSON and section 4.5 acceptance checker"
```

**Your check:** `python3 data/check_outputs.py web/public/data` → `ALL CHECKS PASSED`.

---

## Phase 1: app shell and shared components

### Task 2: Vite app, design tokens, Inter, and `format.ts`

**Files:**
- Create: `web/` (Vite react-ts scaffold, merged without touching `web/public/data`)
- Modify: `web/index.html`, `web/vite.config.ts`, `web/package.json`, `web/tsconfig.app.json`, `web/src/index.css`
- Create: `web/src/lib/format.ts`, `web/src/lib/format.test.ts`
- Delete: template demo files (`src/App.css`, `src/assets/`, `public/vite.svg`)

**Interfaces:**
- Produces (`lib/format.ts`):
  `money(v: number): string` · `unitMoney(v: number): string` · `ppvUnit(v: number): string` · `pct(v: number): string` · `pctSigned(v: number): string` · `vsCheapest(v: number): string` · `count(v: number): string` · `singleSource(n: number): string`
- Produces (Tailwind tokens, usable as utilities like `bg-surface`, `text-ppv`, `border-border`, `rounded-card`): colors `bg surface border rule group-row text text-secondary text-muted accent accent-hover accent-tint ppv ppv-bar savings savings-tint savings-border warn-tint reject`, radii `card(10px) input(8px) nav(6px) chip(4px)`.

- [ ] **Step 1: Scaffold next to `web/` and merge it in**

`web/public/data` already exists, and create-vite would ask to wipe a non-empty folder. So scaffold into a temporary folder and merge:

```bash
npm create vite@latest web-scaffold -- --template react-ts
rsync -a web-scaffold/ web/ && rm -rf web-scaffold
cd web
npm install
npm install react@18 react-dom@18 react-router-dom
npm install -D @types/react@18 @types/react-dom@18 tailwindcss @tailwindcss/vite vitest
rm -rf src/App.css src/assets public/vite.svg
ls public/data/summary.json   # must still exist
```

- [ ] **Step 2: Configure the build**

- `vite.config.ts`: add `/// <reference types="vitest/config" />`, set plugins `[react(), tailwindcss()]`, and set `test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] }`.
- `package.json` scripts: add `"test": "vitest run"`.
- `tsconfig.app.json`: add `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"]` so `tsc -b` does not need Node types.
- `index.html`: `<title>Spendline</title>`, plus Google Fonts preconnect and `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap`.

- [ ] **Step 3: Write `src/index.css`**

`@import "tailwindcss";`, then an `@theme` block that defines `--color-*` with the exact hex values from spec 5.1 (`bg #F7F7F5`, `surface #FFFFFF`, `border #E4E4E0`, `rule #EFEFEC`, `group-row #F4F4F1`, `text #18181B`, `text-secondary #52525B`, `text-muted #71717A`, `accent #3B5BDB`, `accent-hover #2B44A8`, `accent-tint #EEF1FB`, `ppv #B45309`, `ppv-bar #F59E0B`, `savings #15803D`, `savings-tint #F0FAF3`, `savings-border #BBE5C8`, `warn-tint #FFF7ED`, `reject #B91C1C`), `--radius-card/input/nav/chip` (10/8/6/4px), and `--font-sans: "Inter", system-ui, sans-serif`. Base layer:
- `body`: `background: var(--color-bg)`, `color: var(--color-text)`, 13px, `font-variant-numeric: tabular-nums`.
- `:focus-visible`: `outline: 2px solid var(--color-accent); outline-offset: 2px`.

- [ ] **Step 4: Write the failing test `src/lib/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { money, unitMoney, ppvUnit, pct, pctSigned, vsCheapest, count, singleSource } from './format';

describe('money', () => {
  it('millions, 2 decimals', () => { expect(money(1223525.5)).toBe('$1.22M'); expect(money(63791994.84)).toBe('$63.79M'); }); // D1
  it('thousands, 1 decimal', () => { expect(money(346500)).toBe('$346.5K'); expect(money(889977.93)).toBe('$890.0K'); }); // D1
  it('under 1K, whole dollars', () => { expect(money(412.4)).toBe('$412'); expect(money(0)).toBe('$0'); });
  it('negatives get a leading minus', () => { expect(money(-1500)).toBe('-$1.5K'); expect(money(-2_500_000)).toBe('-$2.50M'); });
});
it('unitMoney', () => { expect(unitMoney(854.8243)).toBe('$854.82'); expect(unitMoney(-3.2)).toBe('-$3.20'); });
it('ppvUnit', () => { expect(ppvUnit(40.7059)).toBe('+$40.71'); expect(ppvUnit(-3.2)).toBe('-$3.20'); expect(ppvUnit(0)).toBe('$0.00'); });
describe('pct', () => {
  it('1 decimal', () => { expect(pct(0.9502)).toBe('95.0%'); expect(pct(0.0312)).toBe('3.1%'); });
  it('rounds the stored value, not v*100 (Superior Bicycles reject rate)', () => { expect(pct(0.0525)).toBe('5.2%'); });
  it('signed', () => { expect(pctSigned(0.05)).toBe('+5.0%'); expect(pctSigned(0.47375)).toBe('+47.4%'); expect(pctSigned(-0.012)).toBe('-1.2%'); expect(pctSigned(0)).toBe('0.0%'); });
});
it('vsCheapest', () => { expect(vsCheapest(0)).toBe('Lowest'); expect(vsCheapest(0.47375)).toBe('+47.4%'); });
it('count', () => { expect(count(47107)).toBe('47,107'); expect(count(29470.0)).toBe('29,470'); });
it('singleSource', () => { expect(singleSource(0)).toBe('None'); expect(singleSource(1)).toBe('1 part'); expect(singleSource(2)).toBe('2 parts'); });
```

- [ ] **Step 5: Run it to confirm it fails**

Run: `cd web && npm test`
Expected: FAIL, cannot resolve `./format`.

- [ ] **Step 6: Implement `src/lib/format.ts`**

Pick the scale from the absolute value and put the sign in front of the `$`. For `pct`, round the value to 3 decimals with `Math.abs(v).toFixed(3)` **before** turning it into a percent. `toFixed` uses the exact stored double, so `0.0525` becomes `"0.052"` and shows as 5.2% (checked in this session). `(0.0525*100).toFixed(1)` would give `5.3`. `count` uses `toLocaleString('en-US', { maximumFractionDigits: 0 })`.

- [ ] **Step 7: Run tests and build to confirm they pass**

Run: `npm test && npm run build`
Expected: all format tests PASS. `tsc -b && vite build` exits 0.

- [ ] **Step 8: Commit**

```bash
git add web && git commit -m "feat(web): scaffold Vite app, design tokens, Inter, number formatting"
```

**Your check:** `cd web && npm test && npm run build`.

---

### Task 3: JSON types and data loading (`lib/data.ts`)

**Files:**
- Create: `web/src/lib/data.ts`, `web/src/lib/data.test.ts`, `web/src/test/realData.ts`

**Interfaces:**
- Produces (types, field names and types exactly as in spec 4.4):
  `Summary`, `LineSummary`, `Product`, `BomNode` (with `line?: string; units?: number` on the root), `LeafPart {partId; qtyPerUnit}`, `Part`, `PartVendor`, `WhereUsed`, `Vendor`, `Opportunity` (`lever: 'price_gap' | 'quality_cost'`), `Unmapped`.
- Produces (functions):
  - `fetchJson<T>(path: string): Promise<T>`: `path` is relative to `/data/`, for example `'summary.json'` or `'bom/969.json'`. It keeps one module-level `Map<string, Promise<unknown>>`. If the response is not OK it rejects with `Error("Failed to load <path> (<status>)")` and removes that cache entry, so a retry fetches again.
  - `useJson<T>(path: string | null): { data?: T; loading: boolean; error?: Error }`. A `null` path does nothing.
  - `type CoreData = { summary: Summary; products: Product[]; vendors: Vendor[]; parts: Record<string, Part>; opportunities: Opportunity[] }`
  - `DataProvider({ children })`: loads the five core files once. While loading it shows `Loading data…`. On error it shows `Could not load data: <message>`.
  - `useCoreData(): CoreData`: throws if used outside the provider.
  - `_resetCacheForTests(): void`
- Produces (test helper `src/test/realData.ts`): `readData<T>(path: string): T`. It reads `web/public/data/<path>` with `fs.readFileSync(new URL('../../public/data/' + path, import.meta.url))`.

- [ ] **Step 1: Write the failing tests `src/lib/data.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJson, _resetCacheForTests, type Product, type Part, type BomNode, type Summary } from './data';
import { readData } from '../test/realData';
import { readdirSync } from 'node:fs';

describe('fetchJson', () => {
  beforeEach(() => _resetCacheForTests());
  it('fetches /data/<path> once and caches', async () => {
    const f = vi.fn(async () => new Response('{"a":1}')); vi.stubGlobal('fetch', f);
    expect(await fetchJson('x.json')).toEqual({ a: 1 });
    await fetchJson('x.json');
    expect(f).toHaveBeenCalledTimes(1); expect(f).toHaveBeenCalledWith('/data/x.json');
  });
  it('rejects on HTTP error and allows retry', async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(new Response('[]'));
    vi.stubGlobal('fetch', f);
    await expect(fetchJson('y.json')).rejects.toThrow('Failed to load y.json (404)');
    expect(await fetchJson('y.json')).toEqual([]);
  });
});

describe('pipeline output matches the TS contracts', () => {
  it('products', () => {
    const p = readData<Product[]>('products.json');
    expect(p).toHaveLength(97);
    expect(Object.keys(p[0]).sort()).toEqual(['costUnit','id','line','name','partCount','ppvTotal','ppvUnit','saveTotal','saveUnit','stdUnit','units','vsStd']);
    expect(typeof p[0].id).toBe('string');
  });
  it('parts and bom', () => {
    const parts = readData<Record<string, Part>>('parts.json');
    expect(Object.keys(parts)).toHaveLength(265);
    const b = readData<BomNode>('bom/969.json');
    expect(b.units).toBe(1116);
    for (const lp of b.leafParts) expect(parts[lp.partId]).toBeDefined();
  });
  it('one bom file per product', () => {
    const files = readdirSync(new URL('../../public/data/bom/', import.meta.url));
    expect(files).toHaveLength(readData<Summary>('summary.json').bikeCount);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm test -- data`
Expected: FAIL, cannot resolve `./data` / `../test/realData`.

- [ ] **Step 3: Implement `src/test/realData.ts` and `src/lib/data.ts` with the interfaces above**

- [ ] **Step 4: Run to confirm it passes**

Run: `npm test && npm run build`
Expected: PASS. Build exits 0.

- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(web): JSON contract types, cached fetch, data hooks"
```

**Your check:** `cd web && npm test -- data`.

---

### Task 4: Sorting and paging logic (`lib/sort.ts`)

**Files:**
- Create: `web/src/lib/sort.ts`, `web/src/lib/sort.test.ts`

**Interfaces:**
- Produces:
  - `type SortDir = 'asc' | 'desc'`; `type SortState = { key: string; dir: SortDir }`
  - `sortRows<T>(rows: T[], value: (r: T) => number | string, dir: SortDir): T[]`: returns a new array and leaves the input alone. The sort is stable, so ties keep input order in **both** directions. Strings use `localeCompare`; numbers subtract.
  - `nextSort(current: SortState, key: string, numeric: boolean): SortState`: the same key flips direction. A new key starts `desc` if numeric and `asc` if text.
  - `pageBounds(total: number, pageSize: number, page: number): { page: number; pageCount: number; start: number; end: number }`: clamps `page` to `1..max(1, pageCount)`. `start` is a 0-based inclusive index and `end` is exclusive.

- [ ] **Step 1: Write the failing test `src/lib/sort.test.ts`**

```ts
import { it, expect } from 'vitest';
import { sortRows, nextSort, pageBounds } from './sort';

const rows = [{ n: 'b', v: 2, id: 1 }, { n: 'a', v: 5, id: 2 }, { n: 'c', v: 2, id: 3 }];
it('numeric desc / asc', () => {
  expect(sortRows(rows, r => r.v, 'desc').map(r => r.id)).toEqual([2, 1, 3]);
  expect(sortRows(rows, r => r.v, 'asc').map(r => r.id)).toEqual([1, 3, 2]);
});
it('ties keep input order in both directions (LL/ML Crankarm case)', () => {
  expect(sortRows(rows, r => r.v, 'desc').filter(r => r.v === 2).map(r => r.id)).toEqual([1, 3]);
  expect(sortRows(rows, r => r.v, 'asc').filter(r => r.v === 2).map(r => r.id)).toEqual([1, 3]);
});
it('strings use localeCompare', () => {
  expect(sortRows([{ n: "Anderson's" }, { n: 'acme' }, { n: 'Zeta' }], r => r.n, 'asc').map(r => r.n)).toEqual(['acme', "Anderson's", 'Zeta']);
});
it('does not mutate input', () => { const c = [...rows]; sortRows(rows, r => r.v, 'asc'); expect(rows).toEqual(c); });
it('nextSort', () => {
  expect(nextSort({ key: 'ppv', dir: 'desc' }, 'ppv', true)).toEqual({ key: 'ppv', dir: 'asc' });
  expect(nextSort({ key: 'ppv', dir: 'asc' }, 'ppv', true)).toEqual({ key: 'ppv', dir: 'desc' });
  expect(nextSort({ key: 'ppv', dir: 'asc' }, 'spend', true)).toEqual({ key: 'spend', dir: 'desc' });
  expect(nextSort({ key: 'ppv', dir: 'desc' }, 'name', false)).toEqual({ key: 'name', dir: 'asc' });
});
it('pageBounds clamps at both ends', () => {
  expect(pageBounds(86, 8, 1)).toEqual({ page: 1, pageCount: 11, start: 0, end: 8 });
  expect(pageBounds(86, 8, 0)).toEqual({ page: 1, pageCount: 11, start: 0, end: 8 });
  expect(pageBounds(86, 8, 11)).toEqual({ page: 11, pageCount: 11, start: 80, end: 86 });
  expect(pageBounds(86, 8, 12)).toEqual({ page: 11, pageCount: 11, start: 80, end: 86 });
  expect(pageBounds(0, 8, 1)).toEqual({ page: 1, pageCount: 0, start: 0, end: 0 });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm test -- sort`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/sort.ts`**

For stability in both directions, decorate each row with its index. Compare by value, multiply by -1 for `desc`, and break ties by index **ascending** whichever the direction.

- [ ] **Step 4: Run to confirm it passes**

Run: `npm test -- sort`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/sort* && git commit -m "feat(web): stable sort, sort toggling, page clamping"
```

**Your check:** `cd web && npm test -- sort`.

---

### Task 5: AppShell, NavRail, and router with every route stubbed

**Files:**
- Create: `web/src/components/AppShell.tsx`, `web/src/components/NavRail.tsx`, `web/src/components/shell.test.tsx`
- Create (stubs): `web/src/pages/{Overview,Products,LevelPage,PartDetail,Opportunities,Vendors,MatchReview}.tsx`
- Modify: `web/src/App.tsx`, `web/src/main.tsx`
- Test: `web/src/App.test.tsx`

**Interfaces:**
- Consumes: `DataProvider` (Task 3).
- Produces:
  - `AppShell({ children }: { children: ReactNode })`: a 232px white rail with a right border, then content with `padding: 28px 32px`. The inner content is centered with `max-w-[1180px]` when `pathname === '/'` and `max-w-[1280px]` everywhere else.
  - `NavRail()`: "Spendline" (15px/600), then `NavLink`s Overview `/` (`end`), Products `/products`, Opportunities `/opportunities`, Vendors `/vendors`. Then a "Pipeline" label (12px text-muted) and Match review `/match-review`. Active link: `bg-accent-tint text-accent-hover font-medium rounded-nav`. NavLink sets `aria-current="page"`.
  - `AppRoutes()` in `App.tsx`: `<Routes>` with `/` → Overview, `/products` → Products, `/products/:productId/*` → LevelPage, `/parts/:partId` → PartDetail, `/opportunities`, `/vendors`, `/match-review`, `/dev` → DevPage (added in Task 6), and `*` → inline NotFound ("Page not found" + link to Overview). All of these sit inside `AppShell`.
  - `App()`: `<BrowserRouter><DataProvider><AppRoutes/></DataProvider></BrowserRouter>`.
  - LevelPage stub reads `productId` and `nodePath = (params['*'] ?? '').split('/').filter(Boolean)`. It renders `<h1>Level page</h1>` and `{[productId, ...nodePath].join(' / ')}`. PartDetail stub renders `<h1>Part {partId}</h1>`. NotFound renders `<h1>Page not found</h1>`. Every other stub renders its spec title in an `<h1>` (24px/600): "Spend overview", "Products", "Opportunities", "Vendors", "Match review".

- [ ] **Step 1: Write the failing tests**

```tsx
// src/App.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
const at = (url: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[url]}><AppRoutes /></MemoryRouter>);

it.each([['/', 'Spend overview'], ['/products', 'Products'], ['/opportunities', 'Opportunities'],
         ['/vendors', 'Vendors'], ['/match-review', 'Match review'], ['/parts/513', 'Part 513'], ['/nope', 'Page not found']])
  ('%s renders h1 %s', (url, text) => expect(at(url)).toMatch(new RegExp(`<h1[^>]*>${text}`)));
it('level page walks the node path', () => {
  expect(at('/products/969')).toMatch(/<h1[^>]*>Level page/);
  expect(at('/products/969')).toContain('969');
  expect(at('/products/969/821')).toContain('969 / 821');
});

// src/components/shell.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
const shell = (url: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[url]}><AppShell>x</AppShell></MemoryRouter>);
const activeLinks = (html: string) => [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>([^<]+)</g)].map(m => m[1]);

it('marks only the current section active', () => {
  expect(activeLinks(shell('/vendors'))).toEqual(['Vendors']);
  expect(activeLinks(shell('/'))).toEqual(['Overview']);
  expect(activeLinks(shell('/products/969/821'))).toEqual(['Products']);
});
it('has the Pipeline group and Match review', () => {
  const h = shell('/'); expect(h).toContain('Spendline'); expect(h).toContain('Pipeline'); expect(h).toContain('Match review');
});
it('content width: 1180 on Overview, 1280 elsewhere', () => {
  expect(shell('/')).toContain('max-w-[1180px]'); expect(shell('/vendors')).toContain('max-w-[1280px]');
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- App shell`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement the shell, the stubs, `App.tsx`, and `main.tsx`** (`main.tsx` imports `index.css` and renders `<App/>` in `StrictMode`)

- [ ] **Step 4: Run to confirm it passes.** Run: `npm test && npm run build`. Expected: PASS. Build exits 0.

- [ ] **Step 5: Manual check.** Run `npm run dev` and open each route from Step 1. Expected: the rail is on every page, the active link is tinted, Tab moves through the nav links with a visible 2px blue ring, the page background is #F7F7F5, text is Inter, and the console is clean.

- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "feat(web): app shell, nav rail, stubbed routes"
```

**Your check:** `cd web && npm test -- App shell`, plus Step 5 in the browser.

---

### Task 6: SortableTable, Pagination, and the `/dev` test page

**Files:**
- Create: `web/src/components/SortableTable.tsx`, `web/src/components/Pagination.tsx`, `web/src/components/SortableTable.test.tsx`, `web/src/pages/DevPage.tsx`
- Modify: `web/src/App.tsx` (add `/dev` route)

**Interfaces:**
- Consumes: `sortRows`, `nextSort`, `pageBounds`, `SortState` (Task 4); `useCoreData` (Task 3); `money`, `pct`, `vsCheapest` (Task 2).
- Produces:
  - `type Column<T> = { key: string; label: string; numeric?: boolean; value: (row: T) => number | string; render?: (row: T) => ReactNode; width?: string }` (exported from `SortableTable.tsx`, exactly as spec 6.3).
  - `SortableTable<T>(props: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; defaultSort: SortState; pageSize?: number; rowClassName?: (row: T) => string; collapsedCount?: number; caption: string; itemLabel?: string })`. Two props are added to the spec's list: `rowKey` for React keys, and `itemLabel` (default `"rows"`) for the footer and collapse text, for example `vendors` or `components`.
  - Behavior:
    - Sort the full row set first, then page or collapse it.
    - On a header click, call `nextSort` and reset to page 1.
    - Without `render`, a cell shows `value(row)`.
    - Numeric `<th>` and `<td>` get `text-right`.
    - The wrapper `div` has `overflow-x-auto`.
    - `<caption className="sr-only">`.
    - Column header: `<th scope="col" aria-sort=…>` (only on the active column, `descending`/`ascending`) containing a `<button type="button">` with the label and then `<span aria-hidden="true">`. The span shows `↓`/`↑` in `text-text` when active and `↕` in `text-[#A1A1AA]` when not.
    - Collapse: with `collapsedCount` and more rows than that, show the top N plus a text button `Show all {n} {itemLabel}`. When expanded the button says `Show top {N}`.
  - `Pagination({ start, end, total, itemLabel, onPrev, onNext }: { start: number; end: number; total: number; itemLabel: string; onPrev(): void; onNext(): void })` renders `{start+1} to {end} of {total} {itemLabel}` and two always-enabled buttons, `Previous` and `Next`.

- [ ] **Step 1: Write the failing test `src/components/SortableTable.test.tsx`**

```tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SortableTable, type Column } from './SortableTable';

type R = { id: string; name: string; ppv: number };
const rows: R[] = Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `V${String(i).padStart(2, '0')}`, ppv: i * 10 }));
const cols: Column<R>[] = [
  { key: 'name', label: 'Vendor', value: r => r.name },
  { key: 'ppv', label: 'PPV', numeric: true, value: r => r.ppv },
];
const html = (extra = {}) => renderToStaticMarkup(
  <SortableTable columns={cols} rows={rows} rowKey={r => r.id} defaultSort={{ key: 'ppv', dir: 'desc' }} caption="Test" {...extra} />);
const bodyRows = (h: string) => (h.split('<tbody>')[1].match(/<tr/g) ?? []).length;

it('headers are buttons in th[scope=col]; aria-sort only on the active column', () => {
  const h = html();
  expect(h.match(/<th scope="col"/g)).toHaveLength(2);
  expect(h.match(/aria-sort="descending"/g)).toHaveLength(1);
  expect(h).not.toContain('aria-sort="none"');
  expect(h).toMatch(/<button type="button"[^>]*>PPV<span aria-hidden="true"[^>]*>↓<\/span>/);
  expect(h).toMatch(/>Vendor<span aria-hidden="true"[^>]*>↕<\/span>/);
});
it('default sort is applied: first row is the largest PPV', () => {
  expect(html().split('<tbody>')[1].indexOf('V19')).toBeLessThan(html().split('<tbody>')[1].indexOf('V18'));
});
it('pages with a footer', () => {
  const h = html({ pageSize: 8, itemLabel: 'vendors' });
  expect(bodyRows(h)).toBe(8);
  expect(h).toContain('1 to 8 of 20 vendors');
  expect(h).toMatch(/<button[^>]*>Previous<\/button>/); expect(h).not.toMatch(/disabled/);
});
it('collapses to top N', () => {
  const h = html({ collapsedCount: 8, itemLabel: 'components' });
  expect(bodyRows(h)).toBe(8); expect(h).toContain('Show all 20 components');
});
it('rowClassName and numeric alignment', () => {
  const h = html({ rowClassName: (r: R) => (r.ppv > 180 ? 'bg-warn-tint' : '') });
  expect(h.match(/bg-warn-tint/g)).toHaveLength(1);
  expect(h).toMatch(/<td[^>]*text-right[^>]*>190<\/td>/);
});
it('scroll wrapper and caption', () => { const h = html(); expect(h).toContain('overflow-x-auto'); expect(h).toContain('<caption class="sr-only">Test</caption>'); });
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- SortableTable`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `Pagination.tsx` and `SortableTable.tsx` with the interfaces above**

Styling: the table header row has a bottom border in `border-border`, headers are 13px/500 `text-text-secondary`, and rows have `border-rule` dividers with `hover:bg-group-row`.

- [ ] **Step 4: Build `pages/DevPage.tsx` and add the `/dev` route**

`useCoreData().vendors` goes into a SortableTable with columns Vendor (text), Spend, PPV, vs cheapest, and Reject rate. Use `pageSize={8}`, `itemLabel="vendors"`, and default sort PPV desc. Add a second table with the first 14 products, `collapsedCount={8}`, `itemLabel="components"`. Page heading: "Component test page".

- [ ] **Step 5: Run to confirm tests pass.** Run: `npm test && npm run build`. Expected: PASS. Build exits 0.

- [ ] **Step 6: Manual check on `npm run dev` → `/dev`**

Expected:
- The footer reads `1 to 8 of 86 vendors`, and the first row is Superior Bicycles with PPV ↓.
- Click Spend: ↓, largest first. Click it again: ↑.
- Click Vendor: ↑, A to Z.
- Click Next: `9 to 16 of 86 vendors`. Then click any header: back to `1 to 8`.
- Previous on page 1 stays at 1.
- Click Next until the end: `81 to 86 of 86 vendors`, and a further Next stays there.
- The collapsed table shows 8 rows and `Show all 14 components`. Clicking it shows 14 rows and `Show top 8`.
- Tab reaches every header button with a visible ring. No console errors.

- [ ] **Step 7: Commit**

```bash
git add web/src && git commit -m "feat(web): SortableTable with paging, collapse, aria-sort; dev test page"
```

**Your check:** `cd web && npm test -- SortableTable`, plus Step 6 on `/dev`.

---

### Task 7: Small shared components (KpiTile, BlendedBadge, MadeBoughtTag, LeverChip, Breadcrumb)

**Files:**
- Create: `web/src/components/{KpiTile,BlendedBadge,MadeBoughtTag,LeverChip,Breadcrumb}.tsx`, `web/src/components/small.test.tsx`

**Interfaces:**
- Produces:
  - `KpiTile({ label, value, caption, tone, progress, labelExtra, size }: { label: string; value: string; caption?: string; tone?: 'ppv' | 'savings'; progress?: number /*0..1*/; labelExtra?: ReactNode; size?: 'lg' | 'md' })`. It is a card (`bg-surface border border-border rounded-card`). The label is 13px text-secondary and `labelExtra` sits inline after it. The value is 28px/600 for `lg` (default) and 26px for `md`, in `text-ppv`/`text-savings` per `tone`. The caption is 12px text-muted. With `progress`, show a 6px track with an accent fill at `width: progress*100%` and `role="progressbar"`, `aria-valuenow` = rounded percent.
  - `BlendedBadge()`: `<span title="Volume-weighted average across all vendors, April 2022 to September 2025" class="bg-accent-tint rounded-chip …">Blended</span>`.
  - `MadeBoughtTag({ made }: { made: boolean })`: a gray chip, `Made` or `Bought`.
  - `LeverChip({ lever }: { lever: Opportunity['lever'] })`: an accent-tint chip, `price_gap` → `Price gap`, `quality_cost` → `Quality cost`.
  - `Breadcrumb({ items }: { items: { label: string; to?: string }[] })`: `<nav aria-label="Breadcrumb">`. Each segment except the last is a `<Link>` (when it has `to`). The last is a plain `<span aria-current="page">`, even if it has `to`. Separators ` / ` are `aria-hidden`.

- [ ] **Step 1: Write the failing test `src/components/small.test.tsx`**

```tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { KpiTile } from './KpiTile'; import { BlendedBadge } from './BlendedBadge';
import { MadeBoughtTag } from './MadeBoughtTag'; import { LeverChip } from './LeverChip'; import { Breadcrumb } from './Breadcrumb';

it('KpiTile', () => {
  const h = r(<KpiTile label="Tied to a BOM" value="95.0%" caption="$60.6M across 97 bikes" progress={0.9502} />);
  expect(h).toContain('95.0%'); expect(h).toContain('$60.6M across 97 bikes');
  expect(h).toContain('role="progressbar"'); expect(h).toContain('aria-valuenow="95"');
  expect(r(<KpiTile label="PPV" value="$2.97M" tone="ppv" />)).toContain('text-ppv');
  expect(r(<KpiTile label="x" value="1" size="md" />)).toContain('text-[26px]');
});
it('BlendedBadge has the exact tooltip', () => {
  expect(r(<BlendedBadge />)).toContain('title="Volume-weighted average across all vendors, April 2022 to September 2025"');
  expect(r(<BlendedBadge />)).toContain('>Blended<');
});
it('tags and chips', () => {
  expect(r(<MadeBoughtTag made />)).toContain('>Made<'); expect(r(<MadeBoughtTag made={false} />)).toContain('>Bought<');
  expect(r(<LeverChip lever="price_gap" />)).toContain('>Price gap<'); expect(r(<LeverChip lever="quality_cost" />)).toContain('>Quality cost<');
});
it('Breadcrumb links every segment but the last', () => {
  const h = r(<MemoryRouter><Breadcrumb items={[{ label: 'Overview', to: '/' }, { label: 'Touring', to: '/products' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]} /></MemoryRouter>);
  expect(h).toContain('aria-label="Breadcrumb"');
  expect(h.match(/<a /g)).toHaveLength(3);
  expect(h).toContain('<span aria-current="page">Touring Front Wheel</span>');
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- small`. Expected: FAIL.
- [ ] **Step 3: Implement the five components.**
- [ ] **Step 4: Run to confirm it passes.** Run: `npm test -- small && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add web/src/components && git commit -m "feat(web): KpiTile, BlendedBadge, MadeBoughtTag, LeverChip, Breadcrumb"
```

**Your check:** `cd web && npm test -- small`.

---

### Task 8: `vendorsForParts`, VendorTable (both modes), CostSummary

**Files:**
- Create: `web/src/lib/vendorsForParts.ts`, `web/src/lib/vendorsForParts.test.ts`
- Create: `web/src/components/VendorTable.tsx`, `web/src/components/CostSummary.tsx`, `web/src/components/composite.test.tsx`
- Modify: `web/src/pages/DevPage.tsx` (show both VendorTable modes and a CostSummary for 969)

**Interfaces:**
- Consumes: `Part`, `Vendor`, `BomNode` (Task 3); `SortableTable`, `Column` (Task 6); `KpiTile`, `BlendedBadge` (Task 7); `money`, `unitMoney`, `ppvUnit`, `pct`, `pctSigned`, `vsCheapest`, `singleSource` (Task 2).
- Produces:
  - `type VendorRow = { vendorId: string; name: string; spend: number; std: number; ppv: number; premium: number; vsCheapest: number; rejectedQty: number; receivedQty: number; rejectRate: number; singleSource: number; partNames: string[]; partsLabel: string }`
  - `vendorsForParts(partIds: string[], parts: Record<string, Part>): VendorRow[]` (spec 8.2). Dedupe `partIds` and skip IDs that are not in `parts`. `vsCheapest` is 0 when premium is 0. `rejectRate` is 0 when receivedQty is 0. `partNames` are sorted A to Z. `partsLabel` is `1 part: X`, `2 parts: A, B`, or `5 parts: A, B +3 more`. The output order is not significant; the table sorts it.
  - `VendorTable(props: { mode: 'all'; vendors: Vendor[]; title: string } | { mode: 'parts'; partIds: string[]; parts: Record<string, Part>; title: string })`. It is a card with a 15px/600 title. Parts mode adds the subtitle `Spend on these parts across all products`. It uses SortableTable with `pageSize={8}`, `itemLabel="vendors"`, and `defaultSort={{ key: 'ppv', dir: 'desc' }}`.
    - All mode columns: Vendor, Spend, Product lines (`lines.join(', ')`, or `Not on a BOM` when empty), PPV, vs cheapest, Reject rate, Single-source.
    - Parts mode columns: Vendor (name plus a 12px text-muted second line, `partsLabel`), Spend, PPV, vs cheapest, Reject rate, Single-source.
    - Color rules (spec 5.4): PPV cell `text-ppv`. vs cheapest is `text-text-secondary` for Lowest, `text-ppv` when > 0, and `text-ppv font-semibold` when > 0.05. The row gets `bg-warn-tint` when vsCheapest > 0.2. Reject rate is `text-reject` when ≥ 0.05.
  - `CostSummary({ node, units }: { node: Pick<BomNode, 'costUnit' | 'stdUnit' | 'ppvUnit' | 'saveUnit'>; units: number })`. Four `size="md"` KpiTiles in a 4-column grid:
    - "Material cost per unit" (`unitMoney`, with `labelExtra={<BlendedBadge/>}`)
    - "Standard per unit"
    - "PPV per unit" (`ppvUnit`, tone ppv, caption `${pctSigned(ppvUnit/stdUnit)} · ${money(ppvUnit*units)} total`, without the pct part when stdUnit is 0)
    - "Savings at best price" (`unitMoney`, tone savings, caption `per unit · ${money(saveUnit*units)} total`)

- [ ] **Step 1: Write the failing test `src/lib/vendorsForParts.test.ts`**

```ts
import { it, expect } from 'vitest';
import { vendorsForParts } from './vendorsForParts';
import { readData } from '../test/realData';
import type { Part, BomNode } from './data';

const pv = (vendorId: string, o: Partial<Record<'spend'|'std'|'premium'|'rejectedQty'|'receivedQty', number>> = {}) =>
  ({ vendorId, name: `Vendor ${vendorId}`, qty: 1, spend: 100, std: 90, ppv: 10, avgPrice: 1, premium: 0, rejectedQty: 1, receivedQty: 10, ...o });
const part = (id: string, name: string, vendors: ReturnType<typeof pv>[]) =>
  ({ id, name, vendors, vendorCount: vendors.length } as unknown as Part);
const fx: Record<string, Part> = {
  a: part('a', 'Rear Brakes', [pv('1'), pv('2', { premium: 20 })]),
  b: part('b', 'Front Brakes', [pv('1')]),
  c: part('c', 'Chain', [pv('1', { receivedQty: 0, rejectedQty: 0 })]),
};

it('aggregates by vendor', () => {
  const v1 = vendorsForParts(['a', 'b'], fx).find(v => v.vendorId === '1')!;
  expect(v1).toMatchObject({ spend: 200, std: 180, ppv: 20, vsCheapest: 0, rejectRate: 0.1, singleSource: 1,
    partsLabel: '2 parts: Front Brakes, Rear Brakes' });
  expect(vendorsForParts(['a'], fx).find(v => v.vendorId === '2')!.vsCheapest).toBeCloseTo(20 / 80);
});
it('labels 1 part and +N more', () => {
  expect(vendorsForParts(['b'], fx)[0].partsLabel).toBe('1 part: Front Brakes');
  expect(vendorsForParts(['a', 'b', 'c'], fx).find(v => v.vendorId === '1')!.partsLabel).toBe('3 parts: Chain, Front Brakes +1 more');
});
it('guards: zero received, duplicate ids, unknown ids', () => {
  expect(vendorsForParts(['c'], fx)[0].rejectRate).toBe(0);
  expect(vendorsForParts(['b', 'b'], fx)[0].spend).toBe(100);
  expect(vendorsForParts(['b', 'zzz'], fx)).toHaveLength(1);
});
it('real data: Premier Sport is +47.4% vs cheapest in the Touring-1000 Blue, 60 table', () => {
  const parts = readData<Record<string, Part>>('parts.json');
  const bom = readData<BomNode>('bom/969.json');
  const prem = vendorsForParts(bom.leafParts.map(l => l.partId), parts).find(v => v.name === 'Premier Sport, Inc.')!;
  expect(Math.abs(prem.vsCheapest - 0.474)).toBeLessThanOrEqual(0.0005);
});
```

- [ ] **Step 2: Write the failing test `src/components/composite.test.tsx`**

```tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { VendorTable } from './VendorTable'; import { CostSummary } from './CostSummary';
import { readData } from '../test/realData';
import type { Part, Vendor } from '../lib/data';

const vendors = readData<Vendor[]>('vendors.json'); const parts = readData<Record<string, Part>>('parts.json');
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;

it('all-spend mode: Overview vendor table', () => {
  const h = r(<VendorTable mode="all" vendors={vendors} title="Vendors" />);
  expect(h).toContain('1 to 8 of 86 vendors');
  const sup = rowOf(h, 'Superior Bicycles');
  expect(sup).toContain('$4.56M'); expect(sup).toContain('$216.9K'); expect(sup).toContain('2 parts');
  expect(sup).toMatch(/text-reject[^>]*>5\.2%/);
  for (const label of ['Vendor', 'Spend', 'Product lines', 'PPV', 'vs cheapest', 'Reject rate', 'Single-source']) expect(h).toContain(`>${label}<`);
});
it('all-spend mode: Not on a BOM, warn tint', () => {
  const v = { ...vendors[0], id: 'x', name: 'Resale Co', lines: [], vsCheapest: 0.25 };
  const row = rowOf(r(<VendorTable mode="all" vendors={[v]} title="Vendors" />), 'Resale Co');
  expect(row).toContain('Not on a BOM'); expect(row).toContain('bg-warn-tint');
});
it('parts mode: Touring Rim vendors', () => {
  const h = r(<VendorTable mode="parts" partIds={['513']} parts={parts} title="Vendors for this assembly" />);
  expect(h).toContain('Spend on these parts across all products');
  const prem = rowOf(h, 'Premier Sport, Inc.');
  expect(prem).toContain('+47.4%'); expect(prem).toContain('bg-warn-tint'); expect(prem).toContain('1 part: Touring Rim');
  expect(h).toContain('Lowest');
  expect(h).not.toContain('>Product lines<');
});
it('CostSummary for Touring-1000 Blue, 60', () => {
  const h = r(<CostSummary node={{ costUnit: 854.8243, stdUnit: 814.1184, ppvUnit: 40.7059, saveUnit: 30.0055 }} units={1116} />);
  for (const s of ['Material cost per unit', '$854.82', 'Standard per unit', '$814.12', 'PPV per unit', '+$40.71',
                   '+5.0% · $45.4K total', 'Savings at best price', '$30.01', 'per unit · $33.5K total', '>Blended<']) expect(h).toContain(s);
});
```

- [ ] **Step 3: Run to confirm both fail.** Run: `npm test -- vendorsForParts composite`. Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `vendorsForParts.ts`, `VendorTable.tsx`, and `CostSummary.tsx` with the interfaces above**

- [ ] **Step 5: Run to confirm they pass.** Run: `npm test && npm run build`. Expected: everything passes. Build exits 0.
If the real-data `+47.4%` test fails, the gap comes from other parts Premier supplies to bike 969. Do not loosen it. Report the value you got, because section 10 states +47.4% for that table.

- [ ] **Step 6: Extend `/dev` and check it by hand**

Add these sections to the test page:
- VendorTable all-spend mode (`useCoreData().vendors`)
- VendorTable parts mode for `bom/969.json` leafParts (load it with `useJson('bom/969.json')`, titled "Vendors for this bike")
- `<CostSummary node={bom} units={bom.units!} />`

Expected:
- All-spend reads `1 to 8 of 86 vendors`.
- The parts-mode table's Premier Sport row is tinted, with `+47.4%` in bold amber.
- Hovering "Blended" shows the tooltip.
- Every column sorts across all pages.
- No console errors.

- [ ] **Step 7: Commit**

```bash
git add web/src && git commit -m "feat(web): vendorsForParts, VendorTable (all/parts), CostSummary"
```

**Your check:** `cd web && npm test`, which is the whole suite with phase 0 data feeding the real-data tests, plus Step 6 on `/dev`.

---

## Phase exit check

```bash
python3 data/check_outputs.py web/public/data     # ALL CHECKS PASSED
cd web && npm test && npm run build                # all green, build exits 0
```

Then do the `/dev` and route walkthroughs from Tasks 5, 6, and 8 in `npm run dev`.
