# Vendor Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the vendor list at `/vendors` and add a vendor page at `/vendors/:id`. Each vendor's parts are compared against every other vendor of the same part. Add Vendors to the nav and link vendor names everywhere.

**Architecture:** Per-vendor, per-part logic lives in a pure `lib/vendorParts.ts`, tested against the real JSON. The pages reuse the phase 5a primitives (`PageHeader`, `StatRow`/`Stat`, `Panel`, `FilterChips`, `Chip`, `Disclosure`) and keep the `…View` plus default-export split.

**Tech Stack:** React 18 · TypeScript · Tailwind v4 · react-router-dom · Vitest. No new dependencies.

**Spec:** `SPEC_VENDOR_PAGE.md`, copied to the repo root. It wins over `SPEC_REVISION_2.md` for vendor pages and the nav. Visual reference: the Lovable preview `/vendors/proseware` (look only, never its numbers).

## Global Constraints

- No new dependencies. Never use numbers from the concept's sample data. Keep the D1 money format.
- Before phase 5c there's no warranty data, so:
  - bars are unit price plus reject cost (reject rate × price)
  - the "Cheapest price, higher total cost" flag, the "Moving … saves $X" lines, the lineage panel and the Assumptions drawer are hidden
- Procurement terms (unit price, reject cost, reject rate) get hover definitions through a `title` with a dotted underline (`term-underline`).
- `npm test`, `npm run build` and `npx oxlint src` must be clean.

## Review Focus

1. **Single-source vendor** (Superior Bicycles, 1576): every part shows only this vendor, with a "Single source" chip and no comparison. The third stat must not read "0 of 0". Test in Task 3.
2. **Non-BOM vendor** (Integrated Sport Products, 1636): the meta says "Not on a BOM", and its part rows show no "used in N bikes". Test in Task 3.
3. **Negative PPV** (Jeff's Sporting Goods, 1574, −$10.2K): the value shows with its minus sign and no "% above standard". Test in Task 3.
4. **A `?highlight` target beyond the top 10** (Premier Sport is 27th by PPV): the list opens expanded with the row tinted. Collapsed, the row would be hidden. Test in Task 2.
5. **Unknown vendor id** (`/vendors/zzz`): shows "Vendor not found" with a link back. Test in Task 3.

## Decisions (flag at handoff)

- **V1:** Until 5c, the winner chip reads **"Lowest price"** and is decided on unit price. The spec's "Lowest effective cost" needs warranty data. The third headline stat matches: "Lowest price on N of M parts".
- **V2:** "N of M" counts only parts with two or more vendors. A vendor whose parts are all single-source shows **"Single source"**, captioned "on all K parts". A mix adds "· K single-source" to the caption.
- **V3:** The list page drops paging for **top 10 plus "Show all 86 vendors"**, per spec section 2 ("top rows with Show all"). A `?highlight` target outside the top 10 opens the list expanded. Line chips: All, Road, Mountain, Touring, Not on a BOM. The name filter stays.
- **V4:** Global search vendor hits now open `/vendors/:id`, since a vendor page exists. `?highlight` still works on the list.
- **V5:** `VendorTable` gains `bare` (no card or title), used inside the level page's collapsed section. This also closes the 5a deferred minor about the doubled title. Vendor names in every `VendorTable` (list and level page) link to `/vendors/:id`.

---

### Task 1: `lib/vendorParts.ts`

**Files:** create `web/src/lib/vendorParts.ts` and `web/src/lib/vendorParts.test.ts`. Copy `spendline-handoff/SPEC_VENDOR_PAGE.md` to the repo root.

**Interfaces:**
- `type VendorOffer = { vendorId: string; name: string; unitPrice: number; rejectRate: number; rejectCost: number; qty: number; spend: number; ppv: number }`, where `rejectCost = rejectRate × unitPrice` and `rejectRate = rejectedQty / receivedQty`, or 0 when nothing was received.
- `type VendorPartRow = { partId: string; partName: string; bikes: number; onBom: boolean; vendorCount: number; singleSource: boolean; me: VendorOffer; offers: VendorOffer[]; lowestPrice: boolean }`:
  - `offers` holds every vendor of the part, sorted by `unitPrice` asc.
  - `lowestPrice` is true when `me.unitPrice` is within $0.005 of the minimum.
- `vendorParts(vendorId: string, parts: Record<string, Part>): VendorPartRow[]`: one row per part whose `vendors` include `vendorId`, sorted by `me.spend` desc. An unknown vendor gives `[]`.
- `vendorSummary(rows: VendorPartRow[]): { units: number; compared: number; lowestOn: number; singleSource: number }`, where `units = Σ me.qty` and `compared` counts the rows that aren't single-source.

- [ ] **Step 1: Failing tests**

```ts
const parts = readData<Record<string, Part>>('parts.json');
it('Proseware: three crankarms by spend, every vendor of each part', () => {
  const r = vendorParts('1678', parts);
  expect(r.map(x => x.partName)).toEqual(['HL Crankarm', 'ML Crankarm', 'LL Crankarm']);
  expect(r[0].offers.map(o => [o.name, unitMoney(o.unitPrice)])).toEqual([['Proseware, Inc.', '$46.06'], ['West Junction Cycles', '$46.42'], ['Vision Cycles, Inc.', '$48.58']]);
  expect(r[1].offers.map(o => unitMoney(o.unitPrice))).toEqual(['$33.58', '$36.10']); expect(r[2].offers.map(o => unitMoney(o.unitPrice))).toEqual(['$27.06', '$29.58']);
  expect(r.every(x => x.lowestPrice)).toBe(true); expect(r[0]).toMatchObject({ bikes: 21, vendorCount: 3, singleSource: false });
  expect(r[0].me.rejectCost).toBeCloseTo(r[0].me.rejectRate * r[0].me.unitPrice, 6);
  expect(vendorSummary(r)).toEqual({ units: 66000, compared: 3, lowestOn: 3, singleSource: 0 });
});
it('Superior Bicycles: all single-source', () => {
  const r = vendorParts('1576', parts); expect(r).toHaveLength(2); expect(r.every(x => x.singleSource && x.offers.length === 1)).toBe(true);
  expect(vendorSummary(r)).toMatchObject({ compared: 0, singleSource: 2 });
});
it('Custom Frames supplies 14 parts; unknown vendor gives []', () => { expect(vendorParts('1568', parts)).toHaveLength(14); expect(vendorParts('zzz', parts)).toEqual([]); });
```

- [ ] **Step 2:** `npm test -- vendorParts`. Expected: FAIL (module missing). **Step 3:** Implement. **Step 4:** `npm test && npx oxlint src`. Expected: green. **Step 5:** Commit `feat(vendors): per-vendor part comparison logic`.

---

### Task 2: Nav, links, restyled list `/vendors`

**Files:**
- `lib/nav.ts`: `NavSection` gains `'vendors'`, and `/vendors…` maps to it. Update `nav.test.ts`.
- `NavRail.tsx`: four items, Product costs, Savings, Vendors, Match review, with a small building icon in inline SVG. Update `shell.test.tsx`.
- `lib/search.ts`: a vendor hit's `href` is `/vendors/:id` (V4). Update `search.test.ts`.
- `components/SortableTable.tsx`: when `highlightKey` is set with `collapsedCount` and the row falls past the top N under the default sort, it starts expanded. Test in `SortableTable.test.tsx`.
- `components/VendorTable.tsx`:
  - The name cell links to `/vendors/:id` (`text-foreground hover:text-primary font-medium`).
  - New props `collapsedCount?: number` (replaces `pageSize` when given) and `bare?: boolean` (renders only the table).
- `components/VendorComparison.tsx`: the vendor name `h3` contains a `Link` to `/vendors/:id`.
- `pages/LevelPage.tsx`: the VendorTable inside the Disclosure gets `bare`.
- `pages/Vendors.tsx`, `VendorsView({ vendors, query, onQueryChange, line, onLineChange, highlightId })`:
  - PageHeader: title `Vendors`, meta `{n} vendors · spend, PPV and reject rate across all parts`.
  - A Panel titled `All vendors`. In its actions: FilterChips (All, Road, Mountain, Touring, Not on a BOM, each with a count) and the name filter.
  - Body: `<VendorTable bare mode="all" collapsedCount={10} highlightId resetPageOn={query + line}/>`.
  - The "no match" message is kept.
  - `line` is local state in `Vendors()`. The value `'none'` means `lines.length === 0`.

- [ ] **Step 1: Failing tests** (update `Vendors.test.tsx` on purpose, per V3):
  - Full list: contains `Show all 86 vendors`, 10 rows, and every row's name links `href="/vendors/<id>"` (10 distinct).
  - Line chips: `aria-pressed="true"` on `All`. With `line='none'`, the rows all show `Not on a BOM` and the Show-all count is `20`.
  - `?highlight=1682`: the page contains `Show top 10`, and Premier's row has `bg-primary-soft` and `data-highlight="true"`.
  - Unknown highlight: collapsed, no `data-highlight`.
  - The filter and no-match tests stay.
  - `search.test`: the Proseware hit's `href` is `/vendors/1678`.
  - `nav.test`: `/vendors/1678` maps to `vendors`.
  - `shell.test`: active link `Vendors` on `/vendors/1678`, and the nav has 4 items.
  - `PartDetail.test`: Anderson's card contains `href="/vendors/<Anderson id>"`.
  - `LevelPage.test`: the vendor rows link to `/vendors/`, and the open section no longer repeats `Vendors for this bike` as an `<h2>`.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5:** Commit `feat(vendors): Vendors in nav, restyled list, vendor links everywhere`.

---

### Task 3: Vendor page `/vendors/:id`

**Files:** create `pages/VendorPage.tsx` (+ `VendorPage.test.tsx`) and `components/VendorPartsPanel.tsx`. Route `/vendors/:vendorId` in `App.tsx`.

**Interfaces:**
- `VendorView({ core, vendorId }: { core: CoreData; vendorId: string })`. An unknown id renders `<h1>Vendor not found</h1>` and a link `Back to Vendors`. Otherwise, in order:
  1. PageHeader:
     - crumbs `[{Vendors, '/vendors'}, {name}]`, title = name
     - meta `{partsSupplied} part(s) · {lines.join(', ') or 'Not on a BOM'} · {count(units)} units bought`
  2. StatRow:
     - `Spend` `money(spend)`, caption `{count(units)} units`
     - `PPV` `ppv ≥ 0 ? '+' : '-'` plus `money(|ppv|)`, tone ppv. The caption `{pct(ppv/(spend−ppv))} above standard` shows only when ppv > 0.
     - Third stat, per V2:
       - when `compared > 0`: `Lowest price`, value `{lowestOn} of {compared}`, caption `parts with more than one vendor` (plus ` · {k} single-source` when k > 0)
       - otherwise: value `Single source`, caption `on all {k} parts`
  3. `VendorPartsPanel({ vendorId, rows })`:
     - Panel `Parts from this vendor`, subtitle `Unit price plus reject cost per unit, against every other vendor of the same part.` The legend sits in the actions: this vendor's swatch `bg-primary`, `Other vendors` `bg-price`, `Reject cost` `bg-rejects`.
     - One block per row, each a `<section data-part={partId}>`:
       - the part name as a `<Link to="/parts/:id">`
       - on the right, `used in {bikes} bikes · {vendorCount} vendors`; for an off-BOM part, `{vendorCount} vendor(s)` only
       - then one line per offer:
         - name: bold and plain text for this vendor, a muted `<Link>` to `/vendors/:id` for others
         - chips: `Lowest price` (savings tone) on the lowest-price offer(s) when not single-source, or `Single source` (neutral) when single-source
         - a stacked bar, width = (price + reject cost) ÷ the block's maximum: this vendor `bg-primary` plus `bg-rejects`; others `bg-price` plus `bg-rejects/60`
         - the line underneath reads `{unitMoney(price)} unit price · reject {pct(rate)} ({unitMoney(rejectCost)})`
         - the total `unitMoney(price + rejectCost)` on the right, in savings ink for the lowest
     - The top 5 blocks show, then a `Show all {n} parts` button (`useState`).
     - Footer: `Unit price plus reject cost (reject rate × unit price). Warranty cost is added in a later phase.`
  4. `<Disclosure title="Quality">`: a table with Part, Reject rate, Rejected, Received.
  5. `<Disclosure title={'Spend by part · ' + rows.length}>`: a table with Part, Spend, PPV, Units bought.
- `VendorPage()`: reads `:vendorId` and renders `<VendorView key={vendorId} …/>`.

- [ ] **Step 1: Failing tests** (`VendorPage.test.tsx`, MemoryRouter plus `loadCore()`; `blockOf = (h, id) => h.split('data-part').find(t => t.startsWith(\`="${id}"\`))`):
  - `1678`:
    - h1 `Proseware, Inc.`
    - crumbs link `/vendors`
    - meta `3 parts · Mountain, Road, Touring · 66,000 units bought`
    - `$2.35M` and `+$111.8K`, `above standard`, `Lowest price`, `3 of 3`
    - block 319 contains `$46.06`, `West Junction Cycles`, `$46.42`, `Vision Cycles, Inc.`, `$48.58`, `used in 21 bikes · 3 vendors` and `href="/parts/319"`
    - block 318 contains `$33.58` and `$36.10`; block 317 contains `$27.06` and `$29.58`
    - `Lowest price` appears in all three blocks
    - other vendors link to `/vendors/`
    - `Quality` and `Spend by part · 3` are in summaries
  - `1576`:
    - `Single source` appears in both blocks and the stat (`on all 2 parts`)
    - no other vendor name appears in either block
    - doesn't contain `of 0`
  - `1636`: meta contains `Not on a BOM`, and no block contains `used in`.
  - `1574`: contains `-$10.2K`, and doesn't contain `above standard`.
  - `1568`: `Show all 14 parts`, 5 `data-part` blocks.
  - `zzz`: h1 `Vendor not found`.
  - `App.test`: `/vendors/1678` renders h1 `Proseware, Inc.`
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5:** Commit `feat(vendors): vendor page comparing each part against every vendor`.

---

### Task 4: Visual pass and stop

- [ ] `npm run dev` and screenshot `/vendors`, `/vendors?highlight=1682`, `/vendors/1678`, `/vendors/1576`, `/vendors/1568` and `/parts/513` (the vendor links). Fix any breakage test-first.
- [ ] Run `python3 data/check_outputs.py web/public/data`, then `cd web && npm test && npm run build && npx oxlint src`.
- [ ] **Stop and show the pages.** `SPEC_VENDOR_PAGE.md` section 6 should pass.
