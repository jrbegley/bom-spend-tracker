# Spendline Phase 3 (Supporting Screens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the supporting screens from spec phase 3:
- the Vendors, Opportunities, and Products pages
- the line filter on the Overview
- GlobalSearch
- the insight banner on level pages

The plan also closes the three phase 2 deferred minors that sit in files this phase already touches.

**Architecture:**
- Same pattern as phase 2: each page splits into a pure `…View` that takes its data, filter values, and change callbacks as props, plus a thin default export that owns state, URL params, and hooks.
- Tests server-render the Views against the real pipeline JSON.
- New logic lives in pure, tested modules:
  - `lib/search.ts`: ranking search hits
  - `lib/insight.ts`: building the banner sentence
  - `lib/sort.ts` additions: page reset and the highlight page
- Clicks, typing, and scrolling are checked by hand in the browser.

**Tech Stack:** React 18 · TypeScript · Vite · Tailwind v4 · react-router-dom · Vitest (dev only). Builds on `master` at the end of phase 2.

**Spec:** `BUILD_SPEC.md`: sections 6.2 (GlobalSearch), 6.3, 7.1 (line filter), 7.2 (Products), 7.3 (insight banner), 7.5 (Opportunities), 7.6 (Vendors), 10.

## Global Constraints

- Everything in the phase 0–1 and phase 2 plans' Global Constraints still applies. No new libraries.
- Every table defaults to PPV dollars, largest first. Exception: Opportunities defaults to Savings desc (spec 7.5).
- Vendor tables show 8 rows per page.
- Money uses `lib/format.ts` as built, with the literal section 5.3 rule. So the running total reads `$890.0K across 139 parts`.
- GlobalSearch (spec 6.2):
  - an input with a label, 300px wide and 38px tall, in the Overview header
  - placeholder `Touring Rim, Road-650, Proseware`
  - opens at 2 or more characters
  - shows up to 8 matches across products, parts, and vendors (case-insensitive substring on name), each with a type label
  - product → `/products/:id`, part → `/parts/:id`, vendor → `/vendors?highlight=:id`
- Line filter (spec 7.1):
  - clicking a line filters the Products table, and clicking it again clears the filter
  - while filtered, show `Showing Touring · Clear` above the table
- Insight banner (spec 7.3): shown when any leaf part under the node has an opportunity of $10K or more. Background `bg-savings-tint`, border `border-savings-border`, and a link `Open <part name>`.
- Accessibility: chips and line rows are real `<button>`s with `aria-pressed`, and the search is an ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-controls`, `role="listbox"`/`"option"`, `aria-selected`).

## Review Focus

1. **Filtering while on a later page:** typing in the Vendors filter, or switching the Opportunities lever, while on page 4 returns the table to page 1. It must not land on a clamped last page. Test in Task 1.
2. **Bad URL params:**
   - `/vendors?highlight=nope`: no crash, page 1, no tint.
   - `?highlight=1682` while that vendor is filtered out: page 1, no tint.
   - `/?line=Foo`: ignored, all groups shown, no "Showing" line.
   Tests in Tasks 1 and 4.
3. **Search input edges:**
   - 1 character or only spaces: no dropdown
   - leading or trailing spaces: trimmed
   - more than 8 matches (`road-650` has 12): capped at 8
   - no matches: the dropdown says `No matches`
   Test in Task 5.
4. **Insight sentence shapes:**
   - the part is a direct child: "This assembly uses…"
   - 3 or more vendors: "bought from 3 vendors at $46.06 to $48.58"
   - nothing at or above $10K (the seat assembly): no banner
   Test in Task 6.
5. **Filters that match nothing:** Products and Vendors show `No products match “zzz”` / `No vendors match “zzz”`. Never an empty table or `0 vendors`. Tests in Tasks 1 and 3.

## Decisions to confirm

- **D7 (replaces D6):** the line crumb in level breadcrumbs now links to `/?line=Touring`. That opens the Overview filtered to the line, which is the "Overview, then the Touring line" step of the demo story. The Overview line filter therefore lives in the URL (`?line=`). Other filters are local state.
- **D8: Opportunities table layout.** The spec is silent on paging, so the table pages at **20 rows** (`1 to 20 of 139 parts`). "Bikes affected" shows `Not on a BOM` for the 105 resale parts whose `productCount` is 0.
- **D9: The insight sentence is built from data.** On bike 969 it reads: "Touring Front Wheel and Touring Rear Wheel use the Touring Rim, bought at $39.20 from Premier Sport, Inc. and $26.60 from Anderson's Custom Bikes. Harmonizing it saves $346.5K across 22 bikes." The spec example says "Both wheels use…". Turning names into "wheels" would need hand-written rules.
- **D10: Banner position.** The banner goes **last** on level pages, following spec 7.3's numbered order (after the vendor table). Moving it under the cost summary would make it more visible, but it would contradict that order.
- **D11: "Compare with <sibling variant>" is skipped.** The spec marks it optional.

---

## File map

```
web/src/lib/sort.ts (+test)                 effectivePage, highlightPage                    Task 1
web/src/components/SortableTable.tsx (+test) highlightKey, resetPageOn                       Task 1
web/src/components/VendorTable.tsx          pass-through highlightId / resetPageOn          Task 1
web/src/pages/Vendors.tsx (+test)           VendorsView + Vendors                           Task 1
web/src/lib/opportunities.ts (+test)        leversPresent, filterByLever                    Task 2
web/src/pages/Opportunities.tsx (+test)     OpportunitiesView + Opportunities               Task 2
web/src/lib/productGroups.ts                + filterByName, validLine                       Tasks 3, 4
web/src/components/ProductTable.tsx         group header nowrap (phase 2 minor)             Task 3
web/src/pages/Products.tsx (+test)          ProductsView + Products                         Task 3
web/src/components/LinePpvCard.tsx          rows become toggle buttons                      Task 4
web/src/pages/Overview.tsx (+test)          line filter via ?line=                          Task 4
web/src/lib/bom.ts (+test)                  line crumb → /?line=…; boughtRedirect            Tasks 4, 6
web/src/lib/search.ts (+test)                                                               Task 5
web/src/components/GlobalSearch.tsx (+test)                                                 Task 5
web/src/lib/insight.ts (+test)                                                              Task 6
web/src/components/InsightBanner.tsx                                                        Task 6
web/src/lib/data.ts                         export type JsonState                           Task 6
web/src/pages/LevelPage.tsx (+test)         banner, redirect trail, LevelPageBody           Task 6
web/src/App.test.tsx                        unknown product renders without a fetch          Task 6
```

---

### Task 1: Vendors page (name filter, `?highlight=`)

**Files:**
- Modify: `web/src/lib/sort.ts`, `web/src/lib/sort.test.ts`
- Modify: `web/src/components/SortableTable.tsx`, `web/src/components/SortableTable.test.tsx`
- Modify: `web/src/components/VendorTable.tsx`
- Modify: `web/src/pages/Vendors.tsx`
- Test: `web/src/pages/Vendors.test.tsx`

**Interfaces:**
- Produces:
  - `effectivePage(stored: { page: number; token: unknown }, token: unknown): number`. Returns `stored.page` when `stored.token === token`, else `1`.
  - `highlightPage(index: number, pageSize: number): number`. Returns `Math.floor(index / pageSize) + 1`, or `1` when `index < 0`.
  - SortableTable gains two props:
    - `highlightKey?: string`:
      - On mount, the table opens on the page that holds the row whose `rowKey` equals it, under the default sort. That row gets `bg-accent-tint` and `data-highlight="true"`.
      - An effect calls `scrollIntoView({ block: 'center' })` on that row and removes the tint after 2000 ms.
      - An unknown key gives page 1 and no tint.
    - `resetPageOn?: unknown`: page state is stored as `{ page, token }`, and the page shown is `effectivePage(stored, resetPageOn)`. Prev and Next store the current token. Every row gets `data-row-key={rowKey(row)}`.
  - VendorTable's props (both modes) gain `highlightId?: string` and `resetPageOn?: unknown`, passed through to SortableTable.
  - `VendorsView({ vendors, query, onQueryChange, highlightId }: { vendors: Vendor[]; query: string; onQueryChange: (q: string) => void; highlightId?: string })`:
    - `<h1>Vendors</h1>`
    - a search input: `type="search"`, `aria-label="Filter vendors"`, placeholder `Filter by name`, 300px wide
    - vendors filtered by case-insensitive substring of the trimmed query
    - when nothing matches: `No vendors match “{query}”`
    - otherwise: `<VendorTable mode="all" title="All vendors" vendors={filtered} highlightId={highlightId} resetPageOn={query}/>`
  - `Vendors()`: holds `query` in state and reads `highlight` from `useSearchParams`.

- [ ] **Step 1: Write the failing tests**

```ts
// sort.test.ts (append)
import { effectivePage, highlightPage } from './sort';
it('effectivePage resets to 1 when the token changes', () => {
  expect(effectivePage({ page: 4, token: '' }, '')).toBe(4);
  expect(effectivePage({ page: 4, token: '' }, 'pro')).toBe(1);
});
it('highlightPage', () => {
  expect(highlightPage(26, 8)).toBe(4); expect(highlightPage(0, 8)).toBe(1); expect(highlightPage(-1, 8)).toBe(1);
});
```

```tsx
// Vendors.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { VendorsView } from './Vendors';
import { loadCore } from '../test/realData';
const { vendors } = loadCore();
const html = (query = '', highlightId?: string) =>
  r(<MemoryRouter><VendorsView vendors={vendors} query={query} onQueryChange={() => {}} highlightId={highlightId} /></MemoryRouter>);

it('full list and filter input', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Vendors<\/h1>/); expect(h).toContain('aria-label="Filter vendors"');
  expect(h).toContain('1 to 8 of 86 vendors');
});
it('name filter is case-insensitive and trimmed', () => {
  const h = html('  PROSEWARE ');
  expect(h).toContain('Proseware, Inc.'); expect(h).toContain('1 to 1 of 1 vendors');
});
it('filter that matches nothing', () => {
  const h = html('zzz'); expect(h).toContain('No vendors match “zzz”'); expect(h).not.toContain('of 0 vendors');
});
it('?highlight opens the right page and tints the row (Premier Sport is 27th by PPV)', () => {
  const h = html('', '1682');
  expect(h).toContain('25 to 32 of 86 vendors');
  const row = h.split('<tr').find(t => t.includes('Premier Sport, Inc.'))!;
  expect(row).toContain('bg-accent-tint'); expect(row).toContain('data-highlight="true"');
});
it('unknown or filtered-out highlight: page 1, no tint', () => {
  for (const h of [html('', 'nope'), html('pro', '1682')]) { expect(h).toMatch(/1 to \d+ of \d+ vendors/); expect(h).not.toContain('data-highlight'); }
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `cd web && npm test -- sort Vendors`. Expected: FAIL, missing exports and `VendorsView`.
- [ ] **Step 3: Implement the interfaces above.** Existing SortableTable tests must keep passing.
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build && npx oxlint src`. Expected: all green.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(vendors): vendors page with name filter and ?highlight"
```

**Your check:** `cd web && npm test -- sort Vendors`.

---

### Task 2: Opportunities page

**Files:**
- Create: `web/src/lib/opportunities.ts`, `web/src/lib/opportunities.test.ts`
- Modify: `web/src/pages/Opportunities.tsx`
- Test: `web/src/pages/Opportunities.test.tsx`

**Interfaces:**
- Consumes: `Opportunity`, `LeverChip`, `SortableTable` (with `resetPageOn`), `money`, `unitMoney`.
- Produces:
  - `type LeverFilter = 'all' | Opportunity['lever']`
  - `leversPresent(opps: Opportunity[]): Opportunity['lever'][]`: the distinct levers, in the order `price_gap`, `quality_cost`.
  - `filterByLever(opps: Opportunity[], lever: LeverFilter): Opportunity[]`
  - `OpportunitiesView({ opportunities, lever, onLeverChange }: { opportunities: Opportunity[]; lever: LeverFilter; onLeverChange: (l: LeverFilter) => void })`:
    - `<h1>Opportunities</h1>`, with the subtitle `Price gaps across all products`
    - chip buttons (`aria-pressed`): `All`, then one per `leversPresent` (`Price gap`, `Quality cost`)
    - a running total `{money(sum of savings)} across {n} parts` for the current filter
    - a SortableTable with `pageSize={20}`, `itemLabel="parts"`, default sort `savings` desc, and `resetPageOn={lever}`
    - columns:
      - Part: a `<Link to="/parts/:id">`
      - Lever: `LeverChip`
      - Savings: `money`, savings color
      - Vendors
      - Bikes affected: `productCount`, or muted `Not on a BOM` when 0, sorting by the number
      - Best price: `unitMoney`
      - Highest price: `unitMoney`
  - `Opportunities()`: holds `lever` in state (default `'all'`) and reads `useCoreData().opportunities`.

- [ ] **Step 1: Write the failing tests**

```ts
// opportunities.test.ts
import { it, expect } from 'vitest';
import { leversPresent, filterByLever } from './opportunities';
import { readData } from '../test/realData';
import type { Opportunity } from './data';
const O = readData<Opportunity[]>('opportunities.json');
it('only levers present in the data', () => { expect(leversPresent(O)).toEqual(['price_gap']); });
it('filterByLever', () => {
  expect(filterByLever(O, 'all')).toHaveLength(139); expect(filterByLever(O, 'price_gap')).toHaveLength(139);
  expect(filterByLever(O, 'quality_cost')).toHaveLength(0);
});
```

```tsx
// Opportunities.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OpportunitiesView } from './Opportunities';
import { readData } from '../test/realData';
import type { Opportunity } from '../lib/data';
const O = readData<Opportunity[]>('opportunities.json');
const html = (opps = O) => r(<MemoryRouter><OpportunitiesView opportunities={opps} lever="all" onLeverChange={() => {}} /></MemoryRouter>);

it('header, chips, running total', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Opportunities<\/h1>/); expect(h).toContain('Price gaps across all products');
  expect(h).toMatch(/<button[^>]*aria-pressed="true"[^>]*>All<\/button>/);
  expect(h).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Price gap<\/button>/);
  expect(h).not.toContain('>Quality cost<');
  expect(h).toContain('$890.0K across 139 parts');
});
it('table: savings desc, paged by 20, columns', () => {
  const h = html();
  expect(h).toContain('1 to 20 of 139 parts');
  for (const c of ['Part', 'Lever', 'Savings', 'Vendors', 'Bikes affected', 'Best price', 'Highest price']) expect(h).toContain(`>${c}<`);
  const row = h.split('<tr').find(t => t.includes('href="/parts/513"'))!;
  for (const s of ['Touring Rim', '>Price gap<', '$346.5K', '>2<', '>22<', '$26.60', '$39.20']) expect(row).toContain(s);
  expect(h.indexOf('Touring Rim')).toBeLessThan(h.indexOf('HL Crankarm'));
  expect(h).toContain('aria-sort="descending"');
});
it('Bikes affected says Not on a BOM for resale parts', () => {
  const resale = O.filter(o => o.productCount === 0).slice(0, 1);
  expect(html(resale)).toContain('Not on a BOM');
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- opportunities Opportunities`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build && npx oxlint src`. Expected: green.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(opportunities): opportunities page with lever chips and running total"
```

**Your check:** `cd web && npm test -- opportunities Opportunities`.

---

### Task 3: Products page (name filter, all groups expanded)

**Files:**
- Modify: `web/src/lib/productGroups.ts`, `web/src/lib/productGroups.test.ts`
- Modify: `web/src/components/ProductTable.tsx`. The group-header first cell gets `whitespace-nowrap`, which closes the phase 2 minor about "Road · 43 bikes" wrapping.
- Modify: `web/src/pages/Products.tsx`
- Test: `web/src/pages/Products.test.tsx`

**Interfaces:**
- Produces:
  - `filterByName<T extends { name: string }>(rows: T[], query: string): T[]`: a trimmed, case-insensitive substring match. An empty query returns everything. It is generic, so Task 1 can reuse it for vendors; switch VendorsView over to it in this task.
  - `ProductsView({ products, query, onQueryChange }: { products: Product[]; query: string; onQueryChange: (q: string) => void })`:
    - `<h1>Products</h1>`
    - a search input: `aria-label="Filter products"`, placeholder `Filter by name`
    - when nothing matches: `No products match “{query}”`
    - otherwise: a full-width card with `<ProductTable products={filtered} />` (no `collapsedPerGroup`, so every group is expanded). Group headers count the filtered bikes, and lines with no matches are omitted.
  - `Products()`: holds `query` in state.

- [ ] **Step 1: Write the failing tests**

```ts
// productGroups.test.ts (append)
import { filterByName } from './productGroups';
it('filterByName', () => {
  expect(filterByName(P, '')).toHaveLength(97);
  expect(filterByName(P, ' ROAD-650 ')).toHaveLength(12);
  expect(filterByName(P, 'zzz')).toHaveLength(0);
});
```

```tsx
// Products.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductsView } from './Products';
import { loadCore } from '../test/realData';
const { products } = loadCore();
const html = (q = '') => r(<MemoryRouter><ProductsView products={products} query={q} onQueryChange={() => {}} /></MemoryRouter>);
const links = (h: string) => (h.match(/href="\/products\/\d+"/g) ?? []).length;

it('every group expanded', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Products<\/h1>/); expect(h).toContain('aria-label="Filter products"');
  expect(links(h)).toBe(97); expect(h).not.toContain('Show all');
  expect(h).toMatch(/<td[^>]*whitespace-nowrap[^>]*>Road · 43 bikes<\/td>/);
});
it('filter narrows groups and recounts them', () => {
  const h = html('blue');
  expect(links(h)).toBe(13); expect(h).toContain('Touring · 13 bikes'); expect(h).not.toContain('Road ·');
});
it('no matches', () => { expect(html('zzz')).toContain('No products match “zzz”'); });
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- productGroups Products`. Expected: FAIL.
- [ ] **Step 3: Implement, and switch VendorsView to `filterByName`.**
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build && npx oxlint src`. Expected: green.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(products): products page with name filter; group headers no longer wrap"
```

**Your check:** `cd web && npm test -- productGroups Products`.

---

### Task 4: Overview line filter (`?line=`) and the line breadcrumb

**Files:**
- Modify: `web/src/lib/productGroups.ts` (+test), `web/src/components/LinePpvCard.tsx`, `web/src/pages/Overview.tsx`, `web/src/pages/Overview.test.tsx`
- Modify: `web/src/lib/bom.ts`, `web/src/lib/bom.test.ts` (the line crumb becomes `/?line=Touring`, per D7)

**Interfaces:**
- Produces:
  - `validLine(param: string | null, lines: string[]): string | null`: returns `param` only when it is one of `lines`, else `null`.
  - `LinePpvCard({ lines, selected, onSelect }: { lines: LineSummary[]; selected?: string | null; onSelect?: (line: string | null) => void })`. Each row becomes a full-width `<button type="button" aria-pressed>`. Clicking the selected line calls `onSelect(null)`, and clicking any other line calls `onSelect(line)`. The selected row gets `bg-group-row`.
  - `OverviewView({ core, line = null, onLineChange = () => {} }: { core: CoreData; line?: string | null; onLineChange?: (l: string | null) => void })`. When `line` is set:
    - the Products card shows `Showing {line} · ` plus a `<button>Clear</button>` above the table (Clear calls `onLineChange(null)`)
    - the table gets only that line's products
  - `Overview()`: `line = validLine(searchParams.get('line'), summary lines)`. `onLineChange` sets or deletes `?line=` with `{ replace: true }`.
  - `levelTrail`: the line crumb's `to` becomes `` `/?line=${encodeURIComponent(line)}` ``.

- [ ] **Step 1: Write the failing tests**

```ts
// productGroups.test.ts (append)
import { validLine } from './productGroups';
it('validLine', () => {
  expect(validLine('Touring', ['Road', 'Mountain', 'Touring'])).toBe('Touring');
  expect(validLine('Foo', ['Road'])).toBeNull(); expect(validLine(null, ['Road'])).toBeNull();
});
```

```tsx
// Overview.test.tsx (append)
const htmlLine = (line: string | null) => r(<MemoryRouter><OverviewView core={loadCore()} line={line} onLineChange={() => {}} /></MemoryRouter>);
it('line filter: Touring', () => {
  const h = htmlLine('Touring');
  expect(h).toContain('Showing Touring · '); expect(h).toMatch(/<button[^>]*>Clear<\/button>/);
  expect(h).toContain('Touring · 22 bikes'); expect(h).not.toContain('Road · 43 bikes');
  expect(h).toMatch(/<button[^>]*aria-pressed="true"[^>]*>(?:(?!<\/button>).)*Touring/);
  expect(h).toMatch(/<button[^>]*aria-pressed="false"[^>]*>(?:(?!<\/button>).)*Road/);
});
it('no line: all groups, no Showing line', () => {
  const h = htmlLine(null); expect(h).not.toContain('Showing '); expect(h).toContain('Road · 43 bikes');
});
```

```ts
// bom.test.ts: change the expected Touring crumb in the existing levelTrail test to
{ label: 'Touring', to: '/?line=Touring' }
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- productGroups Overview bom`. Expected: the new tests and the edited `levelTrail` test FAIL.
- [ ] **Step 3: Implement.** Also update any test that asserts the old `/products` crumb (`LevelPage.test.tsx`, `PartDetail.test.tsx`) to `/?line=Touring`.
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build && npx oxlint src`. Expected: green.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(overview): line filter via ?line=; line breadcrumb opens the filtered overview"
```

**Your check:** `cd web && npm test -- productGroups Overview bom`.

---

### Task 5: GlobalSearch

**Files:**
- Create: `web/src/lib/search.ts`, `web/src/lib/search.test.ts`
- Create: `web/src/components/GlobalSearch.tsx`, `web/src/components/GlobalSearch.test.tsx`
- Modify: `web/src/pages/Overview.tsx` (mount GlobalSearch on the right of the header)

**Interfaces:**
- Produces:
  - `type SearchHit = { type: 'product' | 'part' | 'vendor'; id: string; name: string; href: string }`
  - `searchAll(core: CoreData, query: string, limit = 8): SearchHit[]`:
    - Trim the query. Under 2 characters, return `[]`.
    - Match on case-insensitive substring of the name across `products`, `Object.values(parts)`, and `vendors`.
    - Rank: names that **start with** the query first, then by type (product, part, vendor), then by name (`localeCompare`). Slice to `limit`.
    - `href`: product → `/products/:id`, part → `/parts/:id`, vendor → `/vendors?highlight=:id`.
  - `GlobalSearch({ core }: { core: CoreData })`:
    - a visible `<label>` "Search", then an `<input>` with `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, placeholder `Touring Rim, Road-650, Proseware`, and size `w-[300px] h-[38px]`
    - at 2 or more characters, an absolutely positioned `<ul role="listbox">` with one `<li role="option" aria-selected>` per hit:
      - the name, then a 12px muted type label: `Product` / `Part` / `Vendor`
      - or a single non-option `No matches` row when there are no hits
    - keys:
      - ArrowDown / ArrowUp move the active option (wrapping)
      - Enter goes to the active hit, defaulting to the first
      - Escape closes the list
    - clicking an option navigates
    - after navigating, clear the query and close the list

- [ ] **Step 1: Write the failing tests**

```ts
// search.test.ts
import { it, expect } from 'vitest';
import { searchAll } from './search';
import { loadCore } from '../test/realData';
const core = loadCore();
const names = (q: string) => searchAll(core, q).map(h => h.name);

it('needs 2+ characters after trimming', () => { expect(searchAll(core, 'r')).toEqual([]); expect(searchAll(core, '   ')).toEqual([]); });
it('parts, sorted by name, trimmed and case-insensitive', () => {
  expect(names('  RIM ')).toEqual(['HL Mountain Rim', 'HL Road Rim', 'LL Mountain Rim', 'LL Road Rim', 'ML Mountain Rim', 'ML Road Rim', 'Touring Rim']);
  expect(searchAll(core, 'touring rim')[0]).toEqual({ type: 'part', id: '513', name: 'Touring Rim', href: '/parts/513' });
});
it('caps at 8', () => {
  const h = searchAll(core, 'road-650'); expect(h).toHaveLength(8); expect(h.every(x => x.type === 'product')).toBe(true);
});
it('vendor hits link to the highlighted vendors page', () => {
  expect(searchAll(core, 'proseware')).toEqual([{ type: 'vendor', id: '1678', name: 'Proseware, Inc.', href: '/vendors?highlight=1678' }]);
});
it('prefix matches rank first, then products before parts', () => {
  const h = searchAll(core, 'tour'); expect(h[0].type).toBe('product'); expect(h[0].name.startsWith('Touring')).toBe(true);
});
it('no matches', () => { expect(searchAll(core, 'zzzz')).toEqual([]); });
```

```tsx
// GlobalSearch.test.tsx
import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { loadCore } from '../test/realData';
it('closed combobox with label and placeholder', () => {
  const h = r(<MemoryRouter><GlobalSearch core={loadCore()} /></MemoryRouter>);
  expect(h).toContain('>Search<'); expect(h).toContain('role="combobox"'); expect(h).toContain('aria-expanded="false"');
  expect(h).toContain('placeholder="Touring Rim, Road-650, Proseware"'); expect(h).toContain('w-[300px]'); expect(h).toContain('h-[38px]');
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- search GlobalSearch`. Expected: FAIL.
- [ ] **Step 3: Implement both, and mount `<GlobalSearch core={core}/>` on the right of the Overview header.**
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build && npx oxlint src`. Expected: green.
- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat(search): global search across products, parts and vendors"
```

**Your check:** `cd web && npm test -- search GlobalSearch`.

---

### Task 6: Insight banner, plus the level-page fixes

**Files:**
- Create: `web/src/lib/insight.ts`, `web/src/lib/insight.test.ts`, `web/src/components/InsightBanner.tsx`
- Modify: `web/src/lib/data.ts` (`export type JsonState<T>`)
- Modify: `web/src/lib/bom.ts`, `web/src/lib/bom.test.ts` (`boughtRedirect`)
- Modify: `web/src/pages/LevelPage.tsx`, `web/src/pages/LevelPage.test.tsx`
- Modify: `web/src/App.test.tsx`

**Interfaces:**
- Consumes: `levelTrail`, `Crumb`, `unitMoney`, `money`, `JsonState`.
- Produces:
  - `type Insight = { text: string; partId: string; partName: string }`
  - `buildInsight(chain: BomNode[], core: CoreData): Insight | null`. Here `node = chain.at(-1)`.
    1. Among `node.leafParts`, take the part whose opportunity (from `core.opportunities`) has the largest `savings`. If none is at or above **10000**, return `null`.
    2. Subject (where `users` = the node's direct children that are the part or have it in `leafParts`):
       - the part is itself a direct child, or it is the only user: `This bike` (chain length 1) or `This assembly`, followed by `uses`
       - 2 users: `{a} and {b} use`
       - 3 or more: `{n} components use`
    3. Vendor clause, from `core.parts[id].vendors` sorted by `avgPrice` desc:
       - 2 vendors: `bought at {unitMoney(hi)} from {hiName} and {unitMoney(lo)} from {loName}`
       - 3 or more: `bought from {n} vendors at {unitMoney(lo)} to {unitMoney(hi)}`
    4. Text: `` `${subject} the ${partName}, ${vendorClause}. Harmonizing it saves ${money(savings)} across ${productCount} bikes.` ``
  - `InsightBanner({ insight, trail }: { insight: Insight; trail: Crumb[] })`: a `bg-savings-tint border border-savings-border rounded-card p-4` box with the text and `<Link to="/parts/:id" state={{ trail }}>Open {partName}</Link>`.
  - `boughtRedirect(chain: BomNode[], line: string): { to: string; state: { trail: Crumb[] } } | null`. It returns `null` unless the last node is bought and the chain is longer than 1. Otherwise it returns `/parts/:id` with the parent chain's `levelTrail`. LevelView passes it to `<Navigate to state replace>`. This closes the phase 2 minor about the redirect dropping the trail.
  - `LevelPageBody({ core, productId, nodePath, bom }: { core: CoreData; productId: string; nodePath: string[]; bom: JsonState<BomNode> })`:
    - `productId` not in `core.products`: `<h1>Product not found</h1>` and a link to Overview
    - `bom.error`: `<h1>Could not load this product</h1>`, the error message, and a link to Overview
    - loading: `Loading…`
    - otherwise: the keyed `LevelView`

    `LevelPage()` calls `useJson(known ? 'bom/' + id + '.json' : null)`. This closes the phase 2 minors about the unchecked product ID and the generic error message.
  - LevelView renders `<InsightBanner>` **last**, after the vendor table (D10), when `buildInsight` is non-null.

- [ ] **Step 1: Write the failing tests**

```ts
// insight.test.ts
import { it, expect } from 'vitest';
import { buildInsight } from './insight';
import { findNode } from './bom';
import { loadCore, readData } from '../test/realData';
import type { BomNode } from './data';
const core = loadCore(); const bom = readData<BomNode>('bom/969.json');
const chain = (p: string[]) => findNode(bom, p)!.chain;

it('bike: two components share the part', () => {
  expect(buildInsight(chain([]), core)).toEqual({ partId: '513', partName: 'Touring Rim',
    text: "Touring Front Wheel and Touring Rear Wheel use the Touring Rim, bought at $39.20 from Premier Sport, Inc. and $26.60 from Anderson's Custom Bikes. Harmonizing it saves $346.5K across 22 bikes." });
});
it('assembly whose direct child is the part', () => {
  expect(buildInsight(chain(['821']), core)!.text).toBe("This assembly uses the Touring Rim, bought at $39.20 from Premier Sport, Inc. and $26.60 from Anderson's Custom Bikes. Harmonizing it saves $346.5K across 22 bikes.");
});
it('three vendors', () => {
  expect(buildInsight(chain(['951']), core)!.text).toBe('This assembly uses the HL Crankarm, bought from 3 vendors at $46.06 to $48.58. Harmonizing it saves $65.3K across 21 bikes.');
});
it('nothing at or above $10K: no banner', () => { expect(buildInsight(chain(['522']), core)).toBeNull(); });
```

```ts
// bom.test.ts (append)
import { boughtRedirect } from './bom';
it('boughtRedirect keeps the level trail', () => {
  expect(boughtRedirect(findNode(bom, ['821', '513'])!.chain, 'Touring')).toEqual({ to: '/parts/513', state: { trail: [
    { label: 'Overview', to: '/' }, { label: 'Touring', to: '/?line=Touring' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }] } });
  expect(boughtRedirect(findNode(bom, ['821'])!.chain, 'Touring')).toBeNull();
});
```

```tsx
// LevelPage.test.tsx: change the existing tie test's count to rows only (the banner is also bg-savings-tint)
expect(h.match(/<tr[^>]*bg-savings-tint/g)).toHaveLength(2);
// and append:
import { LevelPageBody } from './LevelPage';
it('insight banner on 969, after the vendor table', () => {
  const h = html([]);
  expect(h).toContain('Harmonizing it saves $346.5K across 22 bikes.'); expect(h).toContain('>Open Touring Rim<');
  expect(h.indexOf('Vendors for this bike')).toBeLessThan(h.indexOf('Harmonizing'));
});
it('no banner on the seat assembly', () => { expect(html(['522'])).not.toContain('Harmonizing'); });
const body = (productId: string, bomState: object) => r(<MemoryRouter><LevelPageBody core={core} productId={productId} nodePath={[]} bom={bomState} /></MemoryRouter>);
it('LevelPageBody states', () => {
  expect(body('zzz', { loading: true })).toMatch(/<h1[^>]*>Product not found<\/h1>/);
  expect(body('969', { loading: false, error: new Error('Failed to load bom/969.json (500)') })).toContain('Could not load this product');
  expect(body('969', { loading: true })).toContain('Loading…');
  expect(body('969', { loading: false, data: bom })).toMatch(/<h1[^>]*>Touring-1000 Blue, 60<\/h1>/);
});
```

```tsx
// App.test.tsx (append)
it('unknown product ids render Product not found without waiting on a fetch', () => {
  expect(at('/products/zzz')).toMatch(/<h1[^>]*>Product not found<\/h1>/);
  expect(at('/products/..%2Fsummary')).toMatch(/<h1[^>]*>Product not found<\/h1>/);
});
```

- [ ] **Step 2: Run to confirm they fail.** Run: `npm test -- insight bom LevelPage App`. Expected: FAIL for missing modules and exports, the edited tie count, and the App case, which shows `Loading…` today.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run to confirm they pass.** Run: `npm test && npm run build && npx oxlint src`. Expected: green.
- [ ] **Step 5: Walk through phase 3 in the browser** (`npm run dev`). Expected:
  1. On Overview, click Touring in the line card: only the Touring group shows, with `Showing Touring · Clear`, and the URL has `?line=Touring`. Clicking Touring again or Clear restores all groups.
  2. Type `rim` in Search: 7 options labeled Part. ArrowDown twice then Enter opens HL Road Rim. Escape closes the list. `zzzz` shows `No matches`.
  3. Search `premier` and press Enter: `/vendors?highlight=1682` opens on `25 to 32 of 86 vendors`, the row scrolls into view, and its tint fades after about 2s.
  4. On Vendors, go to page 4, then type `pro`: the table is back on page 1.
  5. On Opportunities: `$890.0K across 139 parts`. Click `Price gap`: same total. Click Next to page 2, then click `All`: back on page 1.
  6. On Products, filter `blue`: only Touring, 13 bikes.
  7. On `/products/969`, the banner is at the bottom. Click `Open Touring Rim`, and the breadcrumb keeps the trail. Click the Touring crumb: the Overview opens filtered to Touring.
  8. Typing `/products/969/821/513` redirects to `/parts/513` with the full trail. `/products/zzz` shows `Product not found` instantly.
  9. No console errors, and Tab reaches every chip, line button, filter input, and the search.
- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "feat(level): insight banner; redirect keeps trail; validate product id; distinct load error"
```

**Your check:** `cd web && npm test`, which runs the full suite, plus the Step 5 walkthrough.

---

## Phase exit check

```bash
python3 data/check_outputs.py web/public/data        # ALL CHECKS PASSED
cd web && npm test && npm run build && npx oxlint src # all green
```

Then the Task 6 Step 5 walkthrough.
