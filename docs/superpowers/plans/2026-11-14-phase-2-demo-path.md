# Spendline Phase 2 (Demo Path) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three demo screens: Overview (all three rows), the Level page for bikes and assemblies, and Part detail with the savings slider. Together they cover the spec's demo story end to end: Overview → Touring → Touring-1000 Blue, 60 → Touring Front Wheel → Touring Rim.

**Architecture:**
- Each page splits into a thin route component (reads params and hooks) and a pure `…View` component that takes `CoreData` as a prop. Tests server-render the View with the real pipeline JSON, the same `renderToStaticMarkup` pattern phase 1 uses.
- The non-trivial logic lives in pure, unit-tested functions:
  - `lib/productGroups.ts`: grouped product table sorting
  - `lib/bom.ts`: walking the BOM tree, breadcrumbs, meta lines, component notes
  - `lib/partStats.ts`: part-level figures
- Clicks and the slider are checked by hand in the browser, because the project has no DOM test runner.

**Tech Stack:** React 18 · TypeScript · Vite · Tailwind v4 · react-router-dom · Vitest (dev only). The project is already scaffolded on `master`.

**Spec:** `BUILD_SPEC.md`, sections 1 (demo story), 2 (locked decisions), 5, 6, 7.1, 7.3, 7.4, 9 (phase 2), 10.

## Global Constraints

- Everything from the phase 0–1 plan (`docs/superpowers/plans/2026-11-14-phase-0-1-data-and-shell.md`, Global Constraints) still applies. No new libraries.
- Every table's default sort is PPV dollars, largest first, except Where used, which defaults to Allocated spend desc (spec 7.4). Every column is sortable.
- Product views use blended prices. "Prices in product views carry a 'Blended' badge with a tooltip": the cost summary, the Material / unit column header, and the Cost column header.
- PPV and best-price savings are shown side by side and never added together.
- Level pages stack vertically: summary strip, then the components table (full width), then the vendor table (full width).
- Purchased leaf parts hand off to the Part detail page.
- Number formatting uses `lib/format.ts` exactly as built, including the literal section 5.3 `money()` rule (the user's D1 decision). So copy shows `$63.79M`, `$890.0K`, `$60.61M`, `$523.8K`, `$3.18M`. See Decisions to confirm.
- Color rules (spec 5.4): PPV in `text-ppv`. Savings in `text-savings`. In a components table, the largest savings value is also `font-semibold` and its row gets `bg-savings-tint`. Reject rate is `text-reject` at ≥ 5%.
- Not in this phase (spec section 9, phase 3): GlobalSearch, clicking a line to filter the Products table, the insight banner, the "Compare with" link, and the Products, Opportunities, and Vendors pages.

## Review Focus

1. **Ties for largest savings:** on bike 969, Touring Front Wheel and Touring Rear Wheel both save $12.361 per unit. Both rows must be highlighted (section 10: "Touring Front Wheel and Touring Rear Wheel highlighted"), not just the first one. Test in Task 6.
2. **Bad URLs:**
   - `/products/969/999` (no such node) shows "Assembly not found" with a link back to the bike.
   - `/products/123456` (no BOM file) shows "Product not found".
   - A path that ends on a bought part redirects to `/parts/:id`.
   - `/parts/zzz` shows "Part not found".
   Tests in Tasks 5, 6, and 7.
3. **Parts the simulator can't move:**
   - Part 1 (Adjustable Race) has one vendor and $0 savings, so the slider makes no sense. Show "Only one vendor supplies this part" instead.
   - Part 341 (Flat Washer 1) is on no BOM. Its meta and Where used card must say "Not on a BOM" / "Not used on any bike's BOM", not "used in 0 bikes".
   Test in Task 7.
4. **Date parsing across time zones:** `new Date('2022-04-01')` is UTC midnight, which shows as March in the Americas. `periodLabel` must read the ISO string's year and month directly. Test in Task 1.
5. **Moving from one bike to another:** going from `/products/969` to another bike reuses the LevelPage component. `useJson` must report loading (or the cached file) for the new path, never the previous bike's tree. This is the deferred minor from phase 1. Test in Task 1.

## Decisions to confirm

- **D1 (still open):** section 10 expects Overview tiles to read `$63.8M` and `$890K`, and the line chart to read `Touring $0.52M`. Under the kept 5.3 rule they read `$63.79M`, `$890.0K`, and `$523.8K`. The tests below pin the 5.3 output. If you switch rules later, update the `// D1` assertions.
- **D4: PPV column on the Part detail "Vendor prices" table.** Spec 7.4 lists no PPV column, but locked decision 2 says every table defaults to PPV desc. This plan adds a PPV column so that default sort exists.
- **D5: Component second line.**
  - For a made child: `{n} parts · includes {leaf part with the largest company-wide savings}`, with ties broken by spend. This gives "8 parts · includes Touring Rim" for the wheel, matching the spec example.
  - For a bought child: `Single source` when it has one vendor, else `{n} vendors`.
- **D6: The "Touring" breadcrumb segment links to `/products`.** There is no line-filter URL until phase 3.

---

## File map

```
web/src/lib/format.ts            + periodLabel                                  Task 1
web/src/lib/data.ts              useJson fix (deriveJsonState)                  Task 1
web/src/components/SortableTable.tsx   Column.headerExtra, exported SortHeader  Task 1
web/src/App.tsx                  /dev only in dev builds                        Task 1
web/src/test/realData.ts         + loadCore()                                   Task 2
web/src/components/LinePpvCard.tsx                                              Task 2
web/src/pages/Overview.tsx       OverviewView + Overview                        Tasks 2, 4
web/src/lib/productGroups.ts                                                     Task 3
web/src/components/ProductTable.tsx                                              Task 3
web/src/components/TopOpportunities.tsx, MatchQueueCard.tsx                    Task 4
web/src/components/Breadcrumb.tsx  export type Crumb                            Task 5
web/src/lib/bom.ts                                                               Task 5
web/src/components/ComponentsTable.tsx                                           Task 6
web/src/pages/LevelPage.tsx      LevelView + LevelPage                           Task 6
web/src/lib/partStats.ts                                                         Task 7
web/src/components/SavingsSimulator.tsx, VendorPrices.tsx, WhereUsed.tsx         Task 7
web/src/pages/PartDetail.tsx     PartView + PartDetail                           Task 7
```

Tests sit next to their files (`*.test.ts(x)`), as in phase 1.

---

### Task 1: Phase 1 follow-ups the demo path needs

**Files:**
- Modify: `web/src/lib/format.ts`, `web/src/lib/format.test.ts`
- Modify: `web/src/lib/data.ts`, `web/src/lib/data.test.ts`
- Modify: `web/src/components/SortableTable.tsx`, `web/src/components/SortableTable.test.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Produces:
  - `periodLabel(start: string, end: string): string`: takes ISO dates and returns `"April 2022 to September 2025"`. It parses `YYYY-MM` out of the string and never builds a `Date`.
  - `type StoredJson<T> = { path: string; data?: T; error?: Error }` and `deriveJsonState<T>(path: string | null, stored: StoredJson<T> | null): { data?: T; loading: boolean; error?: Error }`:
    - `null` path → `{loading:false}`
    - `stored.path === path` → the stored data or error
    - otherwise, a file already in the module cache → `{data, loading:false}`
    - otherwise → `{loading:true}`

    `useJson` keeps a `StoredJson` in state and returns `deriveJsonState(path, stored)`. It no longer calls `setState` synchronously inside its effect.
  - `Column<T>` gains `headerExtra?: ReactNode`, rendered after the sort arrow inside the header button.
  - `SortHeader<T>({ column, sort, onSort }: { column: Column<T>; sort: SortState; onSort: (c: Column<T>) => void })` returns the `<th>` that SortableTable uses today, now exported. SortableTable renders its headers through it.
  - `App.tsx`: the `/dev` route exists only when `import.meta.env.DEV` is true. Use `const DevPage = import.meta.env.DEV ? lazy(() => import('./pages/DevPage')) : null`, with a `Suspense` fallback, so production builds drop the page entirely.

- [ ] **Step 1: Write the failing tests**

```ts
// format.test.ts (append)
import { periodLabel } from './format';
it('periodLabel', () => {
  expect(periodLabel('2022-04-15', '2025-09-21')).toBe('April 2022 to September 2025');
  expect(periodLabel('2022-04-01', '2025-01-01')).toBe('April 2022 to January 2025'); // no UTC shift into March/December
});

// data.test.ts (append)
import { deriveJsonState } from './data';
describe('deriveJsonState', () => {
  beforeEach(() => _resetCacheForTests());
  it('never returns the previous path\'s data', () => {
    expect(deriveJsonState('bom/970.json', { path: 'bom/969.json', data: { id: '969' } })).toEqual({ loading: true });
  });
  it('returns stored data and errors for the same path', () => {
    expect(deriveJsonState('a.json', { path: 'a.json', data: 1 })).toEqual({ data: 1, loading: false });
    const e = new Error('x'); expect(deriveJsonState('a.json', { path: 'a.json', error: e })).toEqual({ loading: false, error: e });
  });
  it('serves an already-fetched file immediately', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"970"}')));
    await fetchJson('bom/970.json');
    expect(deriveJsonState('bom/970.json', { path: 'bom/969.json', data: { id: '969' } })).toEqual({ data: { id: '970' }, loading: false });
  });
  it('null path is idle', () => expect(deriveJsonState(null, null)).toEqual({ loading: false }));
});

// SortableTable.test.tsx (append)
it('renders headerExtra inside the header button', () => {
  const h = renderToStaticMarkup(<SortableTable columns={[cols[0], { ...cols[1], headerExtra: <i>X</i> }]} rows={rows}
    rowKey={r => r.id} defaultSort={{ key: 'ppv', dir: 'desc' }} caption="T" />);
  expect(h).toMatch(/>PPV<span aria-hidden="true"[^>]*>↓<\/span><i>X<\/i><\/button>/);
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `cd web && npm test -- format data SortableTable`. Expected: FAIL. `periodLabel` and `deriveJsonState` are not exported, and `headerExtra` is not rendered.

- [ ] **Step 3: Implement the four changes listed under Interfaces.**

- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npx oxlint`. Expected: every test passes, and oxlint no longer reports `set-state-in-effect` in `data.ts`.

- [ ] **Step 5: Check that the dev page is gone from production.** Run: `npm run build && ! grep -rq "Component test page" dist/assets`. Expected: the build succeeds and grep finds nothing (exit 0). `npm run dev` → `/dev` still works.

- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "fix(web): periodLabel, useJson never serves a stale path, header extras, dev page dev-only"
```

**Your check:** `cd web && npm test && npm run build && ! grep -rq "Component test page" dist/assets`.

---

### Task 2: Overview header and row 1 (KPI tiles and "PPV by product line")

**Files:**
- Modify: `web/src/test/realData.ts`, `web/src/lib/data.ts`
- Create: `web/src/components/LinePpvCard.tsx`
- Modify: `web/src/pages/Overview.tsx`
- Modify: `web/src/App.test.tsx`. It wraps `<AppRoutes/>` in `<CoreDataProvider value={loadCore()}>`, because pages now read core data.
- Test: `web/src/pages/Overview.test.tsx`

**Interfaces:**
- Consumes: `CoreData`, `LineSummary` (data.ts); `KpiTile`; `money`, `pct`, `count`, `periodLabel`.
- Produces:
  - `CoreDataProvider({ value, children }: { value: CoreData; children: ReactNode })`, exported from `data.ts`. It is the context provider that `DataProvider` now renders internally, and tests use it directly.
  - `loadCore(): CoreData` in `src/test/realData.ts`. It reads the five core files from disk.
  - `LinePpvCard({ lines }: { lines: LineSummary[] })`:
    - A card titled "PPV by product line". The title carries `title="Product-line figures cover BOM-tied spend only"`.
    - One row per line, in the order given: line name, a bar (`bg-ppv-bar`, `style.width` = `ppv / max ppv × 100%`), and `{money(ppv)} · {bikes} bikes`.
    - Footer: `Savings at best price: Road $242.4K · Mountain $201.5K · Touring $427.1K`. The largest line's segment is in `text-savings font-semibold`.
    - Rows are plain elements in this phase. Phase 3 turns them into filter buttons.
  - `OverviewView({ core }: { core: CoreData })` and `export default function Overview()` (which calls `useCoreData()`). In this task the View renders:
    - The header: `<h1>Spend overview</h1>` and the subtitle `${periodLabel(...)} · purchased material · blended prices`. The right side is empty until phase 3 adds GlobalSearch.
    - Row 1: `grid grid-cols-2 gap-4`. Left is a 2×2 grid of KpiTiles; right is LinePpvCard.
  - KPI tile copy, exactly (spec 7.1):

| Label | Value | Tone | Caption |
|---|---|---|---|
| Material spend | `money(totalSpend)` | none | `{vendorCount} vendors · {count(poLines)} PO lines` |
| Tied to a BOM | `pct(bomTiedShare)` (`progress={bomTiedShare}`) | none | `{money(bomTiedSpend)} across {bikeCount} bikes` |
| Paid above standard (PPV) | `money(ppvTotal)` | ppv | `{pct(ppvShare)} over vendor standard prices` |
| Savings at best price | `money(bestPriceSavings)` | savings | `If each part came from its cheapest vendor` |

- [ ] **Step 1: Write the failing test `src/pages/Overview.test.tsx`**

```tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OverviewView } from './Overview';
import { loadCore } from '../test/realData';
const html = () => r(<MemoryRouter><OverviewView core={loadCore()} /></MemoryRouter>);

it('header', () => {
  expect(html()).toMatch(/<h1[^>]*>Spend overview<\/h1>/);
  expect(html()).toContain('April 2022 to September 2025 · purchased material · blended prices');
});
it('KPI tiles (section 5.3 money rule, D1)', () => {
  const h = html();
  for (const s of ['Material spend', '$63.79M', '86 vendors · 8,845 PO lines', 'Tied to a BOM', '95.0%', '$60.61M across 97 bikes',
                   'Paid above standard (PPV)', '$2.97M', '4.9% over vendor standard prices', 'Savings at best price', '$890.0K',
                   'If each part came from its cheapest vendor']) expect(h).toContain(s);
  expect(h).toContain('aria-valuenow="95"');
});
it('PPV by product line', () => {
  const h = html();
  expect(h).toContain('title="Product-line figures cover BOM-tied spend only"');
  expect(h).toContain('$1.22M · 43 bikes'); expect(h).toContain('$1.14M · 32 bikes'); expect(h).toContain('$523.8K · 22 bikes');
  expect(h).toContain('width:100%');
  expect(h).toMatch(/text-savings font-semibold[^>]*>Touring \$427\.1K/);
  expect(h).toContain('Road $242.4K'); expect(h).toContain('Mountain $201.5K');
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- Overview`. Expected: FAIL. `OverviewView` and `loadCore` are not exported.
- [ ] **Step 3: Implement `loadCore`, `LinePpvCard`, and `OverviewView`/`Overview` per Interfaces.**
- [ ] **Step 4: Run to confirm it passes.** Run: `npm test && npm run build`. Expected: PASS. Build exits 0.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(overview): header, KPI tiles, PPV by product line"
```

**Your check:** `cd web && npm test -- Overview`.

---

### Task 3: Grouped product table

**Files:**
- Create: `web/src/lib/productGroups.ts`, `web/src/lib/productGroups.test.ts`
- Create: `web/src/components/ProductTable.tsx`, `web/src/components/ProductTable.test.tsx`

**Interfaces:**
- Consumes: `Product`; `sortRows`, `SortState`; `SortHeader`, `Column` (Task 1); `BlendedBadge`; `count`, `unitMoney`, `pctSigned`, `money`.
- Produces:
  - `type ProductGroup = { line: string; bikes: Product[]; units: number; ppv: number; savings: number }`
  - `groupProducts(products: Product[], sort: SortState): ProductGroup[]`:
    - Bikes are grouped by `line`, and each group's `bikes` are sorted by `sort` using the product field named by `sort.key`, or `name` for key `name`.
    - Group order:
      - key `units` / `ppvTotal` / `saveTotal`: by the group total (`units` / `ppv` / `savings`) in `sort.dir`.
      - key `name`: by line name in `sort.dir`.
      - any other key: by `ppv`, always descending.
  - Column keys (shared by both functions): `name`, `units`, `costUnit`, `vsStd`, `ppvTotal`, `saveTotal`.
  - `ProductTable({ products, collapsedPerGroup }: { products: Product[]; collapsedPerGroup?: number })`. One `<table>` (caption "Products by product line").
    - Header: `SortHeader` cells for Product, Units built, Material / unit (`headerExtra={<BlendedBadge/>}`), vs standard, PPV, Best-price savings. Default sort `ppvTotal` desc.
    - Each group starts with a `bg-group-row` row:
      - first cell `{line} · {n} bikes` (font-medium)
      - `count(units)` under Units built
      - blank Material / unit and vs standard cells
      - `money(ppv)` (ppv color) under PPV
      - `money(savings)` (savings color) under Best-price savings
    - Then the group's bikes:
      - name as `<Link to="/products/:id">`
      - units: `count`
      - Material / unit: `unitMoney(costUnit)`
      - vs standard: `pctSigned(vsStd)`
      - PPV: `money(ppvTotal)`, ppv color
      - Best-price savings: `money(saveTotal)`, savings color
    - With `collapsedPerGroup`, a group shows that many bikes, then a row with the text button `Show all {n} {line} bikes`. Expanded, the button says `Show top {collapsedPerGroup}`. Expansion state is per line and survives re-sorting.
    - A header click uses `nextSort`.

- [ ] **Step 1: Write the failing tests**

```ts
// productGroups.test.ts
import { it, expect } from 'vitest';
import { groupProducts } from './productGroups';
import { readData } from '../test/realData';
import type { Product } from './data';
const P = readData<Product[]>('products.json');
const lines = (k: string, dir: 'asc' | 'desc') => groupProducts(P, { key: k, dir }).map(g => g.line);

it('default PPV desc: groups and their totals', () => {
  const g = groupProducts(P, { key: 'ppvTotal', dir: 'desc' });
  expect(g.map(x => x.line)).toEqual(['Road', 'Mountain', 'Touring']);
  expect(g.map(x => x.bikes.length)).toEqual([43, 32, 22]);
  expect(g[0]).toMatchObject({ units: 47107 }); expect(Math.abs(g[0].ppv - 1223525.5)).toBeLessThan(1);
  expect(g[0].bikes.slice(0, 2).map(b => b.name)).toEqual(['Road-250 Black, 44', 'Road-550-W Yellow, 48']);
  expect(g[2].bikes[0].name).toBe('Touring-1000 Blue, 60');
});
it('groups reorder by their totals for units / savings, by name for Product', () => {
  expect(lines('saveTotal', 'desc')).toEqual(['Touring', 'Road', 'Mountain']);
  expect(lines('units', 'desc')).toEqual(['Road', 'Mountain', 'Touring']);
  expect(lines('units', 'asc')).toEqual(['Touring', 'Mountain', 'Road']);
  expect(lines('name', 'asc')).toEqual(['Mountain', 'Road', 'Touring']);
});
it('other keys keep groups in PPV desc whatever the direction; bikes still sort', () => {
  expect(lines('costUnit', 'asc')).toEqual(['Road', 'Mountain', 'Touring']);
  const t = groupProducts(P, { key: 'costUnit', dir: 'asc' })[2].bikes;
  expect(t[0].costUnit).toBeLessThanOrEqual(t[1].costUnit);
});

// ProductTable.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductTable } from './ProductTable';
import { readData } from '../test/realData';
import type { Product } from '../lib/data';
const P = readData<Product[]>('products.json');
const html = (n?: number) => r(<MemoryRouter><ProductTable products={P} collapsedPerGroup={n} /></MemoryRouter>);

it('collapsed overview table', () => {
  const h = html(2);
  expect(h).toContain('Road · 43 bikes'); expect(h).toContain('47,107'); expect(h).toContain('$1.22M');
  expect(h).toContain('Show all 43 Road bikes'); expect(h).toContain('Show all 22 Touring bikes');
  expect(h.match(/href="\/products\/\d+"/g)).toHaveLength(6);
  expect(h).toContain('href="/products/969"');
  expect(h.match(/bg-group-row/g)!.length).toBeGreaterThanOrEqual(3);
});
it('columns, badge, aria-sort', () => {
  const h = html(2);
  for (const l of ['Product', 'Units built', 'Material / unit', 'vs standard', 'PPV', 'Best-price savings']) expect(h).toContain(`>${l}<`);
  expect(h).toContain('>Blended<'); expect(h.match(/aria-sort="descending"/g)).toHaveLength(1);
  const row = h.split('<tr').find(t => t.includes('Touring-1000 Blue, 60'))!;
  for (const s of ['1,116', '$854.82', '+5.0%', '$45.4K', '$33.5K']) expect(row).toContain(s);
});
it('uncollapsed shows all 97 bikes and no expand buttons', () => {
  const h = html(); expect(h.match(/href="\/products\/\d+"/g)).toHaveLength(97); expect(h).not.toContain('Show all');
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- productGroups ProductTable`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement `groupProducts` and `ProductTable` per Interfaces.** Sort bikes with `sortRows`. Sort groups with `sortRows` over the group list too, so the order is stable.
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(products): grouped product table with group-aware sorting"
```

**Your check:** `cd web && npm test -- productGroups ProductTable`.

---

### Task 4: Overview rows 2 and 3

**Files:**
- Create: `web/src/components/TopOpportunities.tsx`, `web/src/components/MatchQueueCard.tsx`
- Modify: `web/src/pages/Overview.tsx`, `web/src/pages/Overview.test.tsx`

**Interfaces:**
- Consumes: `ProductTable` (Task 3), `VendorTable` (all mode), `LeverChip`, `money`.
- Produces:
  - `TopOpportunities({ opportunities }: { opportunities: Opportunity[] })`. A card titled "Top opportunities" with a `View all` link to `/opportunities` in the header. It shows the first 5 opportunities. Each row has:
    - the part name as a `<Link to="/parts/:partId">`
    - `<LeverChip>`
    - the muted line `{vendorCount} vendors · in {productCount} bikes`
    - on the right, `money(savings)` in `text-savings`
  - `MatchQueueCard({ unmappedSpend, totalSpend }: { unmappedSpend: number; totalSpend: number })`: a `<Link to="/match-review">` styled as a card with a dashed border (`border-dashed`). It has two lines:
    - `{Math.round(unmappedSpend / totalSpend * 100)}% of spend is not on a BOM`
    - `{money(unmappedSpend)} to review in the match queue`
  - `OverviewView` adds:
    - Row 2: `grid grid-cols-[1.65fr_1fr] gap-4`. Left: a card titled "Products" containing `<ProductTable products={core.products} collapsedPerGroup={2} />`. Right: TopOpportunities above MatchQueueCard.
    - Row 3: `<VendorTable mode="all" vendors={core.vendors} title="Vendors" />`.

- [ ] **Step 1: Write the failing tests (append to `Overview.test.tsx`)**

```tsx
it('row 2: products, top opportunities, match queue', () => {
  const h = html();
  expect(h).toContain('Show all 43 Road bikes');
  const opp = h.split('Top opportunities')[1];
  expect(opp).toContain('href="/parts/513"'); expect(opp).toContain('Touring Rim'); expect(opp).toContain('>Price gap<');
  expect(opp).toContain('2 vendors · in 22 bikes'); expect(opp).toMatch(/text-savings[^>]*>\$346\.5K/);
  for (const n of ['HL Crankarm', 'HL Road Rim', 'LL Crankarm', 'ML Crankarm']) expect(opp).toContain(n);
  expect(opp).toContain('href="/opportunities"');
  expect(h).toContain('5% of spend is not on a BOM'); expect(h).toContain('$3.18M to review in the match queue');
  expect(h).toMatch(/<a[^>]*href="\/match-review"[^>]*border-dashed|<a[^>]*border-dashed[^>]*href="\/match-review"/);
});
it('row 3: vendor table', () => {
  expect(html()).toContain('1 to 8 of 86 vendors');
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- Overview`. Expected: the two new tests FAIL and the earlier ones still pass.
- [ ] **Step 3: Implement the two cards and the rows.**
- [ ] **Step 4: Run to confirm it passes.** Run: `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Check by hand** with `npm run dev` → `/`. Expected:
  - The three rows match the layout in spec 7.1.
  - `Show all 43 Road bikes` expands Road only, and `Show top 2` collapses it.
  - Clicking the Units built header reorders groups to Road, Mountain, Touring by units.
  - Product name links go to `/products/:id`.
  - Hovering the line-chart title shows the BOM-tied tooltip.
- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "feat(overview): products table, top opportunities, match queue card, vendors"
```

**Your check:** `cd web && npm test -- Overview`, plus Step 5 in the browser.

---

### Task 5: BOM tree helpers (`lib/bom.ts`)

**Files:**
- Modify: `web/src/components/Breadcrumb.tsx` (add `export type Crumb = { label: string; to?: string }` and use it for `items`)
- Create: `web/src/lib/bom.ts`, `web/src/lib/bom.test.ts`

**Interfaces:**
- Consumes: `BomNode`, `Part`, `Product`; `vendorsForParts`; `count`, `periodLabel`.
- Produces:
  - `findNode(root: BomNode, path: string[]): { node: BomNode; chain: BomNode[] } | null`. Walk `children` by ID. `chain` runs from the root to the node. An empty path gives the root. Any unknown ID gives `null`.
  - `levelTrail(chain: BomNode[], line: string): Crumb[]`:
    - `[{Overview, '/'}, {line, '/products'}, {bike name, '/products/:rootId'}, …one crumb per assembly, linking to '/products/:rootId/:id1/…/:idN'}]`
    - The last crumb keeps its `to`. Breadcrumb renders the last segment as plain text, and PartDetail reuses the trail with the part appended.
  - `levelMeta(chain: BomNode[], parts: Record<string, Part>, period: string): string`:
    - A bike (chain length 1): `{count(units)} units built · {leafParts.length} purchased parts · {vendorsForParts(leaf IDs).length} vendors · {period}`
    - An assembly: `Made in-house · {leafParts.length} purchased parts · {qty} per bike`, where qty prints with up to 2 decimals and no trailing zeros
  - `componentNote(child: BomNode, parts: Record<string, Part>): string`, per D5:
    - made: `{n} part(s) · includes {top leaf name}`. The top leaf is the largest `parts[id].save`, with ties broken by larger `spend`.
    - bought: `Single source` or `{vendorCount} vendors`
  - `childHref(chain: BomNode[], child: BomNode): string`: a made child gives `/products/:rootId/…/:childId`; a bought child gives `/parts/:childId`.

- [ ] **Step 1: Write the failing test `src/lib/bom.test.ts`**

```ts
import { it, expect } from 'vitest';
import { findNode, levelTrail, levelMeta, componentNote, childHref } from './bom';
import { readData } from '../test/realData';
import type { BomNode, Part } from './data';
const bom = readData<BomNode>('bom/969.json'); const parts = readData<Record<string, Part>>('parts.json');
const P = 'April 2022 to September 2025';

it('findNode walks the path and rejects bad ids', () => {
  expect(findNode(bom, [])!.node.id).toBe('969');
  const f = findNode(bom, ['821'])!; expect(f.node.name).toBe('Touring Front Wheel'); expect(f.chain.map(n => n.id)).toEqual(['969', '821']);
  expect(findNode(bom, ['821', '513'])!.node.name).toBe('Touring Rim');
  expect(findNode(bom, ['999'])).toBeNull(); expect(findNode(bom, ['821', '999'])).toBeNull();
});
it('levelTrail', () => {
  expect(levelTrail(findNode(bom, ['821'])!.chain, 'Touring')).toEqual([
    { label: 'Overview', to: '/' }, { label: 'Touring', to: '/products' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]);
});
it('levelMeta (spec 7.3 copy)', () => {
  expect(levelMeta([bom], parts, P)).toBe('1,116 units built · 48 purchased parts · 44 vendors · April 2022 to September 2025');
  expect(levelMeta(findNode(bom, ['821'])!.chain, parts, P)).toBe('Made in-house · 8 purchased parts · 1 per bike');
});
it('componentNote (D5)', () => {
  const wheel = findNode(bom, ['821'])!.node;
  expect(componentNote(wheel, parts)).toBe('8 parts · includes Touring Rim');
  const bought = (id: string) => ({ id, name: parts[id].name, made: false, children: [], leafParts: [{ partId: id, qtyPerUnit: 1 }] } as unknown as BomNode);
  expect(componentNote(bought('513'), parts)).toBe('2 vendors');
  expect(componentNote(bought('1'), parts)).toBe('Single source');      // Adjustable Race, one vendor
});
it('childHref', () => {
  const c = findNode(bom, ['821'])!;
  expect(childHref([bom], c.node)).toBe('/products/969/821');
  expect(childHref(c.chain, findNode(bom, ['821', '513'])!.node)).toBe('/parts/513');
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- bom`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `lib/bom.ts` and the `Crumb` export.**
- [ ] **Step 4: Run to confirm it passes.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(bom): tree walk, breadcrumbs, meta lines, component notes"
```

**Your check:** `cd web && npm test -- bom`.

---

### Task 6: Level page (bikes and assemblies)

**Files:**
- Create: `web/src/components/ComponentsTable.tsx`
- Modify: `web/src/pages/LevelPage.tsx`
- Test: `web/src/pages/LevelPage.test.tsx`
- Modify: `web/src/App.test.tsx`. The `/products/969` assertions become a check that LevelPage renders its loading state, `Loading…`, because SSR never runs the fetch, so the BOM file never loads. The `/products/969/821` assertion is removed; `LevelPage.test.tsx` covers node paths.

**Interfaces:**
- Consumes: everything from Task 5; `CostSummary`, `VendorTable` (parts mode), `Breadcrumb`, `MadeBoughtTag`, `SortableTable` (with `headerExtra`), `BlendedBadge`; `useJson`, `useCoreData`; `unitMoney`, `ppvUnit`, `pct`.
- Produces:
  - `ComponentsTable({ chain, parts }: { chain: BomNode[]; parts: Record<string, Part> })`. A card titled "Assemblies and parts" around a SortableTable of `chain.at(-1).children`, with `rowKey` = child ID, `collapsedCount={8}`, `itemLabel="components"`, and default sort `ppv` desc. Columns:
    - Component: a `<Link to={childHref(chain, c)}>` plus `<MadeBoughtTag made={c.made}/>`, then a 12px muted second line with `componentNote(c, parts)`. Made-child links carry no state. Bought-child links carry `state={{ trail: levelTrail(chain, line) }}`.
    - Cost: `unitMoney(costUnit)`, with `headerExtra={<BlendedBadge/>}`.
    - Share of cost: `pct(c.costUnit / node.costUnit)`. Show `0.0%` when the node cost is 0.
    - PPV: `ppvUnit(c.ppvUnit)`, in ppv color.
    - Best-price savings: `unitMoney(saveUnit)`, in savings color.

    Every child whose `saveUnit` is within 0.0005 of the maximum (and the maximum is > 0) gets `bg-savings-tint` on its row and `font-semibold` on its savings value.
  - `LevelView({ core, bom, path }: { core: CoreData; bom: BomNode; path: string[] })`. If `findNode` returns null, render `<h1>Assembly not found</h1>` and a link "Back to {bike name}" to `/products/:id`. If the node is bought, render `<Navigate to={'/parts/' + id} replace />`. Otherwise render, top to bottom with `space-y-6`:
    1. `<Breadcrumb items={levelTrail(chain, bom.line)}/>`
    2. `<h1>` with the node name, then a meta line (`levelMeta`) in text-secondary
    3. `<CostSummary node={node} units={bom.units}/>`
    4. `<ComponentsTable/>`
    5. `<VendorTable mode="parts" partIds={node.leafParts ids} parts={core.parts} title={chain.length === 1 ? 'Vendors for this bike' : 'Vendors for this assembly'}/>`
  - `LevelPage()`: it calls `useJson<BomNode>('bom/' + productId + '.json')`:
    - while loading: `Loading…`
    - on error: `<h1>Product not found</h1>` and a link back to Overview
    - on success: `<LevelView core={useCoreData()} bom={data} path={nodePath}/>`

- [ ] **Step 1: Write the failing test `src/pages/LevelPage.test.tsx`**

```tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LevelView } from './LevelPage';
import { loadCore, readData } from '../test/realData';
import type { BomNode } from '../lib/data';
const core = loadCore(); const bom = readData<BomNode>('bom/969.json');
const html = (path: string[]) => r(<MemoryRouter><LevelView core={core} bom={bom} path={path} /></MemoryRouter>);
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(`>${name}<`))!;

it('bike level: /products/969 (section 10)', () => {
  const h = html([]);
  expect(h).toMatch(/<h1[^>]*>Touring-1000 Blue, 60<\/h1>/);
  expect(h).toContain('1,116 units built · 48 purchased parts · 44 vendors · April 2022 to September 2025');
  for (const s of ['$854.82', '$814.12', '+$40.71', '$30.01', '+5.0% · $45.4K total', 'per unit · $33.5K total']) expect(h).toContain(s);
  expect(h).toContain('Assemblies and parts'); expect(h).toContain('Show all 14 components');
  expect(h).toContain('Vendors for this bike');
});
it('both wheels are highlighted (tie on largest savings)', () => {
  const h = html([]);
  expect(h.match(/bg-savings-tint/g)).toHaveLength(2);
  for (const w of ['Touring Front Wheel', 'Touring Rear Wheel']) {
    const row = rowOf(h, w);
    expect(row).toContain('bg-savings-tint'); expect(row).toMatch(/font-semibold[^>]*>\$12\.36/);
    expect(row).toContain('8 parts · includes Touring Rim'); expect(row).toContain('>Made<'); expect(row).toContain('14.5%');
  }
  expect(rowOf(h, 'Touring Front Wheel')).toContain('href="/products/969/821"');
});
it('bought children link to part detail', () => {
  expect(rowOf(html([]), 'HL Crankset')).toContain('>Made<');
  const h = html(['821']);
  expect(rowOf(h, 'Touring Rim')).toContain('href="/parts/513"'); expect(rowOf(h, 'Touring Rim')).toContain('>Bought<');
});
it('assembly level: /products/969/821', () => {
  const h = html(['821']);
  expect(h).toMatch(/<h1[^>]*>Touring Front Wheel<\/h1>/);
  expect(h).toContain('Made in-house · 8 purchased parts · 1 per bike');
  for (const s of ['$124.16', '+$5.91', '$12.36']) expect(h).toContain(s);
  expect(h).toContain('<span aria-current="page">Touring Front Wheel</span>');
  expect(h).toContain('href="/products/969"'); expect(h).toContain('Vendors for this assembly');
  expect(h).toContain('Spend on these parts across all products');
  expect(h).not.toContain('Show all'); // 7 children < 8
  expect(rowOf(h, 'Touring Rim')).toContain('bg-savings-tint');
  expect(h).toContain('title="Volume-weighted average across all vendors, April 2022 to September 2025"');
});
it('bad node path', () => {
  const h = html(['999']);
  expect(h).toMatch(/<h1[^>]*>Assembly not found<\/h1>/); expect(h).toContain('href="/products/969"');
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `npm test -- LevelPage`. Expected: FAIL, `LevelView` not exported.
- [ ] **Step 3: Implement `ComponentsTable`, `LevelView`, and `LevelPage`, and update `App.test.tsx` per Files.**
- [ ] **Step 4: Run to confirm it passes.** Run: `npm test && npm run build`. Expected: PASS.
- [ ] **Step 5: Check by hand** with `npm run dev`. Expected:
  - Clicking Touring-1000 Blue, 60 on `/` opens `/products/969` with the numbers above.
  - Clicking Touring Front Wheel opens `/products/969/821`, and the breadcrumb links back.
  - In the vendor table, Premier Sport, Inc. is tinted and shows `+47.4%`, possibly on page 2. Sort by vs cheapest to find it.
  - `/products/969/999` shows "Assembly not found". `/products/123456` shows "Product not found".
  - Going from `/products/969` to another bike through the address bar never shows 969's numbers.
- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "feat(level): bike and assembly drill-down with components and scoped vendors"
```

**Your check:** `cd web && npm test -- LevelPage bom`, plus Step 5 in the browser.

---

### Task 7: Part detail with the savings simulator

**Files:**
- Create: `web/src/lib/partStats.ts`, `web/src/lib/partStats.test.ts`
- Create: `web/src/components/VendorPrices.tsx`, `web/src/components/SavingsSimulator.tsx`, `web/src/components/WhereUsed.tsx`
- Modify: `web/src/pages/PartDetail.tsx`
- Modify: `web/src/App.test.tsx`. The `/parts/513` row now expects h1 `Touring Rim` instead of `Part 513`.
- Test: `web/src/pages/PartDetail.test.tsx`

**Interfaces:**
- Consumes: `Part`, `PartVendor`, `Product`, `CoreData`; `Crumb`, `Breadcrumb`, `KpiTile`, `SortableTable`, `useCoreData`; format helpers.
- Produces:
  - `partRejectRate(part: Part): number`: Σ rejectedQty ÷ Σ receivedQty over the part's vendors, or 0 when nothing was received.
  - `vendorVsCheapest(v: PartVendor): number`: `premium / (spend - premium)`, or 0 when premium is 0.
  - `simulatedSavings(save: number, sharePct: number): number`: `save × sharePct / 100`.
  - `partMeta(part: Part): string`: `{vendorCount} vendor(s) · used in {whereUsed.length} bikes · Bought`, or `{vendorCount} vendor(s) · Not on a BOM · Bought` when `!part.onBom`.
  - `VendorPrices({ part }: { part: Part })`: a card titled "Vendor prices" around a SortableTable with default sort `ppv` desc and `rowKey` vendorId. Columns:
    - Vendor
    - Average price: a bar (`h-2 rounded-chip`; `bg-savings` when `avgPrice === part.bestPrice`, else `bg-ppv`; width = avgPrice ÷ max avgPrice) followed by `unitMoney(avgPrice)`. It sorts by avgPrice.
    - Quantity: `count(qty)`
    - Spend: `money`
    - PPV: `money`, ppv color (D4)
    - vs cheapest: `vsCheapest(...)`, with the same colors as VendorTable
    - Reject rate: `pct`, in `text-reject` at ≥ 5%
  - `SavingsSimulator({ save, vendorCount, bikeCount, onBom }: { save: number; vendorCount: number; bikeCount: number; onBom: boolean })`: a card titled "Savings simulator".
    - When `vendorCount === 1`, it shows only `Only one vendor supplies this part`.
    - Otherwise it has a labeled `<input type="range" min=0 max=100 step=5>`, defaulting to 100. The label reads `Move this share of volume to the cheapest vendor` and shows the current `{n}%`.
    - Under it, an `<output aria-live="polite">` with `Saves {money(simulatedSavings(save, share))}` (savings color, 26px/600).
    - The second line is `Across {bikeCount} bikes`, or `Not on a BOM` when `!onBom`.
  - `WhereUsed({ part, products }: { part: Part; products: Product[] })`: a card titled "Where used".
    - When `whereUsed` is empty, it shows `Not used on any bike's BOM`.
    - Otherwise it is a SortableTable with `collapsedCount={10}`, `itemLabel="bikes"`, and default sort `allocatedSpend` desc. Columns:
      - Product: `<Link to="/products/:id">` with the name from `products`
      - Line
      - Qty per bike: up to 2 decimals
      - Units built: `count`
      - Share of consumption: `pct`
      - Allocated spend: `money`
  - `PartView({ core, partId, trail }: { core: CoreData; partId: string; trail?: Crumb[] })`. An unknown ID renders `<h1>Part not found</h1>` and a link to Overview. Otherwise it renders:
    1. A breadcrumb: `[...trail, {label: name}]`, or `[{Overview,'/'}, {label:'Parts'}, {label: name}]` without a trail
    2. `<h1>` with the name, then `partMeta`
    3. Four KpiTiles in `grid-cols-4`:
       - Spend: `money(spend)`
       - PPV: `money(ppv)`, ppv tone
       - Best-price savings: `money(save)`, savings tone
       - Reject rate: `pct(partRejectRate)`
    4. VendorPrices and SavingsSimulator side by side (`grid-cols-[1.65fr_1fr]`)
    5. WhereUsed
  - `PartDetail()`: reads `partId` from the URL and `trail` from `useLocation().state?.trail`. It uses the trail only when it is an array, and renders `PartView`.

- [ ] **Step 1: Write the failing tests**

```ts
// partStats.test.ts
import { it, expect } from 'vitest';
import { partRejectRate, vendorVsCheapest, simulatedSavings, partMeta } from './partStats';
import { readData } from '../test/realData';
import { money, pct } from './format';
import type { Part } from './data';
const parts = readData<Record<string, Part>>('parts.json');
it('Touring Rim figures', () => {
  expect(pct(partRejectRate(parts['513']))).toBe('5.4%');
  const prem = parts['513'].vendors.find(v => v.name === 'Premier Sport, Inc.')!;
  expect(Math.abs(vendorVsCheapest(prem) - 0.474)).toBeLessThanOrEqual(0.0005);
  expect(vendorVsCheapest(parts['513'].vendors.find(v => v.premium === 0)!)).toBe(0);
});
it('simulator math (section 10: 50% → $173.3K)', () => {
  expect(money(simulatedSavings(346500, 50))).toBe('$173.3K');
  expect(money(simulatedSavings(346500, 100))).toBe('$346.5K');
  expect(simulatedSavings(346500, 0)).toBe(0);
});
it('partMeta', () => {
  expect(partMeta(parts['513'])).toBe('2 vendors · used in 22 bikes · Bought');
  expect(partMeta(parts['341'])).toBe('3 vendors · Not on a BOM · Bought');
  expect(partMeta(parts['1'])).toMatch(/^1 vendor · used in \d+ bikes · Bought$/);
});
it('reject rate with nothing received is 0', () => {
  expect(partRejectRate({ ...parts['513'], vendors: parts['513'].vendors.map(v => ({ ...v, receivedQty: 0, rejectedQty: 0 })) })).toBe(0);
});

// PartDetail.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PartView } from './PartDetail';
import { loadCore } from '../test/realData';
const core = loadCore();
const html = (id: string, trail?: { label: string; to?: string }[]) => r(<MemoryRouter><PartView core={core} partId={id} trail={trail} /></MemoryRouter>);
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;

it('Touring Rim header, KPIs, default breadcrumb', () => {
  const h = html('513');
  expect(h).toMatch(/<h1[^>]*>Touring Rim<\/h1>/); expect(h).toContain('2 vendors · used in 22 bikes · Bought');
  for (const s of ['$1.82M', '$86.9K', '$346.5K', '5.4%']) expect(h).toContain(s);
  expect(h).toContain('href="/"'); expect(h).toContain('<span>Parts</span>'); expect(h).toContain('<span aria-current="page">Touring Rim</span>');
});
it('breadcrumb keeps the level-page trail', () => {
  const h = html('513', [{ label: 'Overview', to: '/' }, { label: 'Touring', to: '/products' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]);
  expect(h).toContain('href="/products/969/821"'); expect(h).not.toContain('<span>Parts</span>');
});
it('vendor prices (section 10: $26.60 and $39.20)', () => {
  const h = html('513');
  const and = rowOf(h, "Anderson&#x27;s Custom Bikes"), prem = rowOf(h, 'Premier Sport, Inc.');
  expect(and).toContain('$26.60'); expect(and).toContain('bg-savings'); expect(and).toContain('Lowest'); expect(and).toContain('28,050');
  expect(and).toMatch(/text-reject[^>]*>5\.5%/);
  expect(prem).toContain('$39.20'); expect(prem).toContain('bg-ppv'); expect(prem).toContain('+47.4%'); expect(prem).toContain('27,500');
  expect(h.indexOf('Premier Sport, Inc.')).toBeLessThan(h.indexOf('Anderson&#x27;s Custom Bikes')); // PPV desc
});
it('savings simulator default 100%', () => {
  const h = html('513');
  expect(h).toContain('Move this share of volume to the cheapest vendor');
  expect(h).toMatch(/<input[^>]*type="range"/); expect(h).toContain('step="5"'); expect(h).toContain('value="100"');
  expect(h).toContain('Saves $346.5K'); expect(h).toContain('Across 22 bikes'); expect(h).toContain('aria-live="polite"');
});
it('where used', () => {
  const h = html('513');
  const row = rowOf(h, 'href="/products/969"');
  for (const s of ['Touring-1000 Blue, 60', 'Touring', '>2<', '1,116', '7.6%', '$138.1K']) expect(row).toContain(s);
  expect(h).toContain('Show all 22 bikes');
});
it('edge parts: single vendor, not on a BOM, unknown id', () => {
  expect(html('1')).toContain('Only one vendor supplies this part'); expect(html('1')).not.toContain('type="range"');
  const off = html('341'); expect(off).toContain('Not on a BOM'); expect(off).toContain('Not used on any bike&#x27;s BOM');
  expect(html('zzz')).toMatch(/<h1[^>]*>Part not found<\/h1>/);
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- partStats PartDetail`. Expected: FAIL, modules and exports not found.
- [ ] **Step 3: Implement `partStats.ts`, the three components, and `PartView`/`PartDetail` per Interfaces.**
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build`. Expected: PASS, build exits 0.
- [ ] **Step 5: Walk the demo story from spec section 1 by hand** (`npm run dev`):
  1. Overview tiles: `$63.79M`, `95.0%`, `$2.97M`, `$890.0K`.
  2. In the line card, Touring has the smallest PPV bar ($523.8K) and the largest savings ($427.1K, bold green).
  3. In the Products table, open Touring-1000 Blue, 60. Check `$854.82 · $814.12 · +$40.71 · $30.01`, with both wheels tinted.
  4. Open Touring Front Wheel. Check `$124.16 · +$5.91 · $12.36` and that Touring Rim's row is tinted.
  5. Open Touring Rim. The breadcrumb ends `… / Touring Front Wheel / Touring Rim`, the prices are `$26.60` and `$39.20`, and it reads `Saves $346.5K · Across 22 bikes`.
  6. Drag the slider to 50%: `Saves $173.3K`.
  7. Open `/parts/513` directly: the breadcrumb is `Overview / Parts / Touring Rim`.
  8. There are no console errors, and Tab reaches every link, header button, and the slider.
- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "feat(part): part detail with vendor prices, savings simulator, where used"
```

**Your check:** `cd web && npm test`, which runs the full suite, plus the Step 5 demo walkthrough.

---

## Phase exit check

```bash
python3 data/check_outputs.py web/public/data        # ALL CHECKS PASSED (data unchanged)
cd web && npm test && npm run build && npx oxlint     # all green
```

Then the Task 7 Step 5 demo walkthrough.
