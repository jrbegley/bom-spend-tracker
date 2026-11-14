# Spendline Phase 5a (Lovable look, current data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Lovable concept's look onto the app using only today's pipeline data: new tokens and shell, a Product costs landing at `/`, a restyled Level page with a Standard → PPV → Actual bridge, and a restyled Part page with a vendor comparison and simulator.

**Architecture:**
- Tokens come from `design/lovable-tokens.css` into `web/src/index.css`. Old token class names are renamed mechanically across `src`, and tests change only through that same rename.
- New pure logic lives in `lib/`:
  - `nav.ts`: which nav section is active
  - `productCosts.ts`: landing headline and ranking
  - `bridge.ts`: bridge steps and axis
- New shared look lives in `components/primitives.tsx`.
- Pages keep the `…View` (pure) plus default-export (hooks) split, and are tested by server-rendering against the real JSON.

**Tech Stack:** React 18 · TypeScript · Vite · Tailwind v4 · react-router-dom · Vitest. No new dependencies.

**Spec:** `SPEC_REVISION_2.md` (sections 1, 4, 6, 10; it wins over `BUILD_SPEC.md`), `BUILD_SPEC.md` (sections 1, 2, 4, 5), `HANDOFF.md`. Visual reference: the Lovable preview `https://id-preview--743943ad-0481-4423-8cf9-a38307cc517c.lovable.app` (`/`, `/products/touring-1000-blue-60`, `/parts/touring-rim`). It was looked at, not copied.

## Global Constraints

- No new dependencies: no Radix, lucide-react or recharts. Bars and charts are plain divs. Disclosure uses `<details>`.
- Never use the concept's sample numbers. Every figure comes from `web/public/data`.
- Keep the D1 money format (`money()` per spec 5.3 literally: `$57.73M`, `$79.5K`). Per-unit figures use `unitMoney` and `ppvUnit`.
- Fonts: Inter for everything. Newsreader is used only for the "Spendline" wordmark. Page titles are about 28px semibold Inter.
- First view of every page (rev2 section 6): a plain title and meta line, at most three headline numbers, and one primary visual. No summary sentence. Tables show 10 or fewer rows, then "Show all N". Secondary sections are collapsed.
- No new metrics in 5a. Rejects and warranty don't appear in bars or bridges yet (5b/5c).
- `npm test`, `npm run build` and `npx oxlint src` are clean after every task.

## Review Focus

1. **Tiny or zero PPV:** assemblies like HL Headset ($0.46 cost, +$0.02 PPV) must still draw a readable bridge, with no NaN, no zero-height Actual bar, and no negative axis. A node with exactly $0 PPV draws the axis from $0. Tests in Task 5.
2. **Line filter on the new landing:**
   - `/?line=Touring` (the breadcrumb target) filters the ranking.
   - `/?line=Foo` is ignored.
   - "Show all N" counts the filtered bikes.
   Test in Task 4.
3. **Parts with no saving:**
   - Part 1 (Adjustable Race, one vendor) and part 908 (LL Mountain Seat/Saddle, 2 vendors, $0 saving) show no savings stat and no simulator.
   - Part 1 says "Single source".
   Test in Task 6.
4. **Every row links to its own page.** The concept links every bike to Touring-1000; ours must not. Test in Task 4 (10 distinct hrefs).
5. **Nav state on detail pages:** `/products/969/821` and `/parts/513` highlight "Product costs", and `/vendors` highlights "Savings". The disabled year and Assumptions placeholders are not focus traps. Test in Task 2.

## Decisions (made here, flag at handoff)

- **E1:** Lovable token names win. Old class names are renamed by the table in Task 1, and test assertions on class names are renamed by the same table. Lovable's `accent` is a pale neutral, so every old `text-accent` link must become `text-primary`.
- **E2:** The year selector is a disabled `<select>` showing **"All years"**, titled "Fiscal years arrive in phase 5c". The data covers April 2022 to September 2025, so "FY2025" would mislabel it. The Assumptions button is disabled, titled "Assumptions arrive in phase 5c". The landing eyebrow is the period (`April 2022 to September 2025`).
- **E3:** Nav is Product costs `/`, Savings `/savings`, Match review.
  - Savings renders the existing Opportunities view titled **"Savings"**, still ranked by price-gap savings. Effective-cost ranking is 5c.
  - `/opportunities` redirects to `/savings`.
  - `/products` and `/vendors` stay routed but off the nav.
- **E4:** The Overview page and its pieces are retired: `Overview.tsx`, `LinePpvCard`, `TopOpportunities`, `MatchQueueCard` and `Overview.test.tsx`. So is `CostSummary` (with its block in `composite.test.tsx`). Their still-relevant checks move to the new pages' tests.
- **E5: Landing headline numbers** (the concept's three slots, filled from current data):
  - Standard cost: `$57.73M`, captioned `97 bikes · 90,120 units built`
  - Total variance: `+$2.89M`, captioned `5.0% above standard`
  - Verified: `100%`, captioned `Pending $0`

  Variance is PPV only until 5b.
- **E6: Level page order** follows the concept: header, three stats, bridge, components, insight banner, then **vendors collapsed** in `<details>`. This replaces phase 3's D10, where the banner came last after an open vendor table.
- **E7: Level page stats:**
  - Actual cost per bike, with the Blended badge
  - Variance per bike
  - Total variance

  The best-price saving per unit leaves the header. It stays in the components table and the banner.
- **E8: Part page vendor section** shows one card per vendor, sorted by price.
  - The cheapest card is tinted `bg-savings-soft` with a "Lowest price" chip.
  - A price premium over 5% is `text-caution font-semibold`.
  - The old phase 3 row tint for "vs cheapest over 20%" doesn't carry over to cards.
  - Where used is collapsed in `<details>`.

---

## File map

```
SPEC_REVISION_2.md, design/lovable-tokens.css, design/README.md   copied from spendline-handoff/   Task 1
HANDOFF.md                         note at top                                                  Task 1
web/index.html, web/src/index.css  fonts, tokens                                               Task 1
web/src/**/*.tsx|ts                class rename (incl. tests)                                   Task 1
web/src/lib/nav.ts (+test)         navSection                                                   Task 2
web/src/components/AppShell.tsx, NavRail.tsx, shell.test.tsx                                    Task 2
web/src/App.tsx, App.test.tsx      routes /savings, /opportunities → /savings                    Task 2
web/src/pages/Opportunities.tsx    title prop ("Savings")                                       Task 2
web/src/components/primitives.tsx (+test)  PageHeader, StatRow, Stat, Panel, FilterChips, Chip  Task 3
web/src/components/SortableTable.tsx, Breadcrumb.tsx   restyle                                  Task 3
web/src/lib/productCosts.ts (+test), pages/ProductCosts.tsx (+test)                             Task 4
web/src/lib/bridge.ts (+test), components/CostBridge.tsx                                         Task 5
web/src/pages/LevelPage.tsx (+test), ComponentsTable.tsx, InsightBanner.tsx                      Task 5
web/src/components/VendorComparison.tsx, SavingsSimulator.tsx, pages/PartDetail.tsx (+test)       Task 6
```

---

### Task 1: Spec files, HANDOFF note, tokens, fonts, class rename

**Files:**
- Copy (not move): `spendline-handoff/SPEC_REVISION_2.md` → `SPEC_REVISION_2.md`, and `spendline-handoff/design/*` → `design/`. Leave `spendline-handoff/` and the zip untouched and uncommitted.
- Modify: `HANDOFF.md`: a top note saying `SPEC_REVISION_2.md` now applies (it wins where it disagrees) and phase 5a is in progress, with a link to this plan.
- Modify: `web/index.html`: Google Fonts `Inter:wght@400;500;600;700` and `Newsreader:opsz,wght@6..72,500`.
- Modify: `web/src/index.css`:
  - Replace the old `@theme` with the token file's `@theme inline`, `:root`, base layer, utilities, keyframes and reduced-motion rule. Drop the shadcn-only and `@import` setup lines the file header names.
  - Keep `font-variant-numeric: tabular-nums` on `body` and set body to 14px.
- Modify: every `web/src/**/*.{ts,tsx}`, renaming classes with a one-off Python script (not committed). Match on word boundaries, longest name first, applying the same table to test files:

| Old | New |
|---|---|
| `text-text-secondary`, `text-text-muted` | `text-muted-foreground` |
| `text-text` | `text-foreground` |
| `hover:text-accent-hover` | `hover:text-primary/80` |
| `text-accent-hover`, `text-accent` | `text-primary` |
| `bg-accent-tint` | `bg-primary-soft` |
| `bg-accent` / `border-accent` / `accent-accent` | `bg-primary` / `border-primary` / `accent-primary` |
| `bg-surface` / `bg-bg` | `bg-card` / `bg-background` |
| `border-rule` / `divide-rule` / `bg-rule` | `border-hairline` / `divide-hairline` / `bg-muted` |
| `bg-group-row` | `bg-muted` |
| `bg-warn-tint` / `text-reject` | `bg-caution-soft` / `text-destructive` |
| `bg-savings-tint` / `border-savings-border` | `bg-savings-soft` / `border-savings/30` |
| `bg-ppv-bar` | `bg-ppv` |
| `text-ppv` / `text-savings` (exact) | `text-ppv-ink` / `text-savings-ink` |
| `rounded-card` / `rounded-input` / `rounded-nav` / `rounded-chip` | `rounded-xl` / `rounded-md` / `rounded-lg` / `rounded-sm` |

- [ ] **Step 1: Write the failing check.** Run:

```bash
cd web && ! grep -rnE "text-text|accent-hover|accent-tint|text-accent|bg-accent\b|bg-surface|bg-bg\b|-rule\b|group-row|warn-tint|text-reject|savings-tint|savings-border|ppv-bar|rounded-(card|input|nav|chip)|text-ppv\b|text-savings\b" src
```

Expected: FAIL (it lists the old names).
- [ ] **Step 2: Copy the files, add the HANDOFF note and fonts, replace `index.css`, and run the rename script.**
- [ ] **Step 3: Verify.** Re-run the Step 1 grep: it should print nothing (exit 0). Then run `npm test && npm run build && npx oxlint src`. Expected: 147/147 pass, the build is clean, and the lint is clean.
- [ ] **Step 4: Commit** `feat(style): Lovable tokens and fonts; rename classes to the new token names` (also add the spec files, `design/` and the HANDOFF note).

**Your check:** the Step 1 grep prints nothing, and `npm test` passes.

---

### Task 2: Shell, nav, top bar, Savings route

**Files:** create `web/src/lib/nav.ts` (+`nav.test.ts`). Modify `components/AppShell.tsx`, `components/NavRail.tsx`, `components/shell.test.tsx`, `App.tsx`, `App.test.tsx` and `pages/Opportunities.tsx`.

**Interfaces:**
- `navSection(pathname: string): 'costs' | 'savings' | 'match' | null`:
  - `/`, `/products…` and `/parts…` give `costs`
  - `/savings`, `/opportunities` and `/vendors…` give `savings`
  - `/match-review` gives `match`
  - anything else gives `null`
- `NavRail()`:
  - the "Spendline" wordmark in `font-serif`
  - links Product costs `/`, Savings `/savings`, Match review `/match-review`
  - the active link (from `navSection`, not NavLink's own matching) gets `aria-current="page"` and `bg-card shadow-card text-foreground font-medium`
- `AppShell({ children })`:
  - the nav rail (`bg-nav`, `w-[232px]`), plus a top bar (`h-14`, `border-b border-hairline`)
  - the top bar holds GlobalSearch (moved out of Overview), a disabled `<select aria-label="Fiscal year" title="Fiscal years arrive in phase 5c">` with a single option "All years", and a disabled `<button title="Assumptions arrive in phase 5c">Assumptions</button>`
  - content in `mx-auto max-w-[1120px] px-10 py-10`
- `OpportunitiesView` gains `title = 'Opportunities'`. App routes `/savings` to it with `title="Savings"`, and `/opportunities` to `<Navigate to="/savings" replace />`.

- [ ] **Step 1: Write failing tests.**

```ts
// nav.test.ts
it.each([['/', 'costs'], ['/products/969/821', 'costs'], ['/parts/513', 'costs'], ['/savings', 'savings'],
  ['/opportunities', 'savings'], ['/vendors', 'savings'], ['/match-review', 'match'], ['/nope', null]])('%s → %s', (p, s) => expect(navSection(p)).toBe(s));
// shell.test.tsx (rewrite)
// activeLinks('/products/969/821') → ['Product costs']; activeLinks('/vendors') → ['Savings']; activeLinks('/match-review') → ['Match review']
// shell('/') contains 'Product costs', 'Savings', 'Match review' and not '>Overview<', '>Products<', '>Vendors<', '>Opportunities<'
// shell('/') matches /<select[^>]*disabled[^>]*>/ and contains 'All years', /<button[^>]*disabled[^>]*>Assumptions<\/button>/, 'role="combobox"', 'max-w-[1120px]'
// App.test.tsx: ['/savings', 'Savings'] row added; the '/opportunities' row is removed (SSR Navigate renders nothing)
```

- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npm test && npm run build && npx oxlint src`.** Expected: green.
- [ ] **Step 5: Commit** `feat(shell): Lovable shell, three-item nav, top bar placeholders, /savings`.

---

### Task 3: Shared primitives and table restyle

**Files:** create `components/primitives.tsx` (+`primitives.test.tsx`). Restyle `SortableTable.tsx` (header `text-[12px] font-medium text-muted-foreground`, rows `border-hairline`, `py-3`) and `Breadcrumb.tsx` (muted links, `/` separators, current item `text-foreground`). Restyle `KpiTile.tsx` to the Stat look; its existing tests stay.

**Interfaces** (all in `primitives.tsx`):
- `PageHeader({ eyebrow, crumbs, title, meta }: { eyebrow?: string; crumbs?: Crumb[]; title: string; meta?: string })`: an optional eyebrow (`.eyebrow`), an optional `<Breadcrumb>`, `<h1 class="text-[28px] font-semibold tracking-tight">`, and meta in `text-muted-foreground`.
- `StatRow({ children })`: `grid grid-cols-3 divide-x divide-border rounded-2xl border bg-card shadow-card`.
- `Stat({ label, value, caption, tone, extra }: { label: string; value: string; caption?: string; tone?: 'ppv' | 'savings'; extra?: ReactNode })`: an eyebrow label, a value `text-[32px] font-medium num` (tone gives `text-ppv-ink` / `text-savings-ink`), and a caption in `text-[14px] text-muted-foreground`.
- `Panel({ title, subtitle, actions, footer, children }: { title: string; subtitle?: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode })`: `<section class="rounded-2xl border bg-card shadow-card">` with a header row (h2 `text-[15px] font-semibold`) and a `border-t border-hairline` footer.
- `FilterChips<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string })`: a `role="group"` with `aria-label={label}` and pill buttons (`aria-pressed`). The selected pill is `bg-foreground text-background`, and a count shows in muted text.
- `Chip({ tone, children }: { tone?: 'neutral' | 'savings' | 'caution' | 'primary'; children: ReactNode })`: a small uppercase pill.

- [ ] **Step 1: Write failing tests** (SSR):
  - PageHeader renders h1, eyebrow and meta.
  - StatRow plus three Stats render labels and values, and `tone="ppv"` gives `text-ppv-ink`.
  - Panel renders title, subtitle and footer.
  - FilterChips renders `role="group"`, the selected `aria-pressed="true"`, and a count `43`.
  - Chip renders its text.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.** **Step 4: Run** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5: Commit** `feat(ui): shared primitives; table and breadcrumb restyle`.

---

### Task 4: Product costs landing (`/`)

**Files:** create `lib/productCosts.ts` (+test) and `pages/ProductCosts.tsx` (+test). Route `/` to it. Delete `pages/Overview.tsx`, `pages/Overview.test.tsx`, `components/LinePpvCard.tsx`, `components/TopOpportunities.tsx` and `components/MatchQueueCard.tsx` (E4).

**Interfaces:**
- `costHeadline(products: Product[]): { standard: number; variance: number; varianceShare: number; bikes: number; units: number }`: sums `stdUnit × units` and `ppvTotal`.
- `rankByVariance(products: Product[]): (Product & { rank: number })[]`: sorted by `ppvTotal` desc (stable), with rank starting at 1.
- `ProductCostsView({ core, line = null, onLineChange = () => {} }: { core: CoreData; line?: string | null; onLineChange?: (l: string | null) => void })`:
  1. PageHeader: eyebrow `periodLabel(...)`, title `Product costs`, meta `97 bikes · purchased material, actual cost vs standard`.
  2. StatRow, per E5.
  3. Panel "Bikes ranked by total variance", subtitle `Where the {money(variance)} sits, and what drives it.`
     - FilterChips in its actions: `All lines`, then each line with its bike count. The value is `line ?? 'all'`.
     - A SortableTable over `rankByVariance(filtered)` with `collapsedCount={10}`, `itemLabel="bikes"`, default sort `ppvTotal` desc. Columns:
       - `#`: the rank, muted
       - Bike: a `<Link to={'/products/' + id}>` plus a line `Chip`
       - Variance by driver: a PPV-only bar, `bg-ppv`, width `ppvTotal / max ppvTotal of the filtered rows`, `title="PPV {money}"`
       - Total variance: `money(ppvTotal)`
       - Per unit: `ppvUnit(ppvUnit)`
       - vs standard: `pctSigned(vsStd)`
     - Footer legend: a `PPV` swatch only.
- `ProductCosts()`: `line = validLine(searchParams.get('line'), …)`. `onLineChange` sets or deletes `?line=` with `replace`, as the Overview did.

- [ ] **Step 1: Write failing tests.**

```ts
// productCosts.test.ts
const P = readData<Product[]>('products.json');
it('headline', () => { const h = costHeadline(P); expect(money(h.standard)).toBe('$57.73M'); expect(money(h.variance)).toBe('$2.89M');
  expect(pct(h.varianceShare)).toBe('5.0%'); expect(h.bikes).toBe(97); expect(h.units).toBe(90120); });
it('rank', () => { const r = rankByVariance(P); expect(r[0]).toMatchObject({ id: '782', name: 'Mountain-200 Black, 38', rank: 1 });
  expect(r.find(p => p.id === '969')!.rank).toBe(12); });
```

```tsx
// ProductCosts.test.tsx (MemoryRouter, loadCore())
// all lines: h1 'Product costs'; contains 'April 2022 to September 2025', '$57.73M', '97 bikes · 90,120 units built', '+$2.89M',
//   '5.0% above standard', '100%', 'Pending $0', 'Show all 97 bikes'; 10 bike links, 10 distinct hrefs; first link href '/products/782';
//   row for 782 contains '$79.5K', '+$26.72', '+5.0%', 'width:100%'; contains '>PPV<'; not contains 'Warranty'
// line='Touring': 'Show all 22 bikes'; first bike link '/products/969'; Touring chip aria-pressed="true"
// line=null with 'Foo' routed through validLine is covered in productGroups tests; App.test '/' row expects h1 'Product costs'
```

- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement, route `/`, and delete the retired files.** **Step 4:** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5: Commit** `feat(costs): Product costs landing ranked by variance; retire Overview`.

---

### Task 5: Level page (bridge, stats, components, banner)

**Files:** create `lib/bridge.ts` (+test) and `components/CostBridge.tsx`. Modify `pages/LevelPage.tsx` (+test), `components/ComponentsTable.tsx` and `components/InsightBanner.tsx`. Delete `components/CostSummary.tsx` and its block in `composite.test.tsx`.

**Interfaces:**
- `type BridgeStep = { key: 'standard' | 'ppv' | 'actual'; label: string; value: number; from: number; to: number }`
- `bridge(node: { stdUnit: number; ppvUnit: number; costUnit: number }): { steps: BridgeStep[]; axisMin: number; axisMax: number }`:
  - steps: Standard `from 0 to std`, PPV `from std to std+ppv`, Actual `from 0 to cost`
  - with `hi = max(std, cost)`, `lo = min(std, cost)` and `unit = 10 ** (floor(log10(hi)) - 1)`:
    - `axisMin = |ppv| < 1e-9 ? 0 : max(0, floor((lo - 2·|ppv|) / unit) · unit)`
    - `axisMax = ceil((hi + 0.25·|ppv|) / unit) · unit`
- `CostBridge({ node })`: a Panel titled `From standard to actual cost, per bike`, subtitle `Purchased material only. Rejects and warranty are added in a later phase.`
  - Three columns of positioned divs in a 220px plot: standard `bg-standard`, PPV `bg-ppv` floating, actual `bg-primary`.
  - Bar height and bottom are `(value - axisMin) / (axisMax - axisMin)`, floored at 2px.
  - Each column has a label and value underneath: `unitMoney` for Standard and Actual, `ppvUnit` for PPV.
  - When `axisMin > 0`, a footer reads `Axis starts at {unitMoney(axisMin)} so the step is readable.`
- LevelView order (E6):
  1. PageHeader: crumbs `levelTrail`, h1 the node name, meta `levelMeta`
  2. StatRow (E7):
     - `Actual cost per bike`: `unitMoney(cost)`, `extra={<BlendedBadge/>}`, caption `vs {unitMoney(std)} standard`
     - `Variance per bike`: `ppvUnit(ppv)`, tone ppv, caption `{pctSigned(ppv/std)} above standard`
     - `Total variance`: `+{money(ppv·units)}`, caption `across {count(units)} bikes`
  3. CostBridge
  4. ComponentsTable, restyled as a Panel titled `{n} components` with subtitle `PPV first. Click a made part to open it.`
     - Columns as today, plus a share bar (a `bg-primary/40` div before the %).
     - The top-savings rows keep `bg-savings-soft`.
  5. InsightBanner: `bg-savings-soft border-savings/30 rounded-2xl`, eyebrow `Savings opportunity`, the text, and the link styled as a primary button `Open {part} →`.
  6. `<details>` with a `<summary>` reading `Vendors for this bike · {n}` (or assembly), containing the VendorTable.

- [ ] **Step 1: Write failing tests.**

```ts
// bridge.test.ts
it('969', () => { const b = bridge({ stdUnit: 814.1184, ppvUnit: 40.7059, costUnit: 854.8243 });
  expect(b.axisMin).toBe(730); expect(b.axisMax).toBe(870); expect(b.steps.map(s => s.key)).toEqual(['standard', 'ppv', 'actual']);
  expect(b.steps[1]).toMatchObject({ from: 814.1184, to: 854.8243 }); });
it('821 wheel', () => { const b = bridge({ stdUnit: 118.246, ppvUnit: 5.9123, costUnit: 124.1583 }); expect(b.axisMin).toBe(100); expect(b.axisMax).toBe(130); });
it('tiny assembly (HL Headset)', () => { const b = bridge({ stdUnit: 0.4364, ppvUnit: 0.0218, costUnit: 0.4582 });
  expect(b.axisMin).toBeGreaterThanOrEqual(0); expect(b.axisMin).toBeLessThan(0.4364); expect(b.axisMax).toBeGreaterThan(0.4582);
  expect([b.axisMin, b.axisMax].every(Number.isFinite)).toBe(true); });
it('zero PPV starts at 0', () => { expect(bridge({ stdUnit: 10, ppvUnit: 0, costUnit: 10 }).axisMin).toBe(0); });
```

```tsx
// LevelPage.test.tsx (update on purpose, E6/E7):
// 969: replace '+5.0% · $45.4K total' / 'per unit · $33.5K total' / '$30.01' with 'Actual cost per bike', '$854.82', 'vs $814.12 standard',
//   'Variance per bike', '+$40.71', '+5.0% above standard', 'Total variance', '+$45.4K', 'across 1,116 bikes',
//   'From standard to actual cost, per bike', 'Axis starts at $730.00'
// 821: '$124.16', '+$5.91', 'Axis starts at $100.00'; keep every other existing assertion
// banner test renamed: banner index < index of '<details' and 'Vendors for this bike · 44' is inside a <details>
// tie test unchanged (two <tr ... bg-savings-soft rows)
```

- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.** **Step 4:** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5: Commit** `feat(level): cost bridge, stat row, restyled components and banner; vendors collapsed`.

---

### Task 6: Part page (vendor comparison, simulator, edge cases)

**Files:** create `components/VendorComparison.tsx`. Modify `components/SavingsSimulator.tsx` and `pages/PartDetail.tsx` (+test). Delete `components/VendorPrices.tsx`.

**Interfaces:**
- `hasSaving(part: Part): boolean` in `lib/partStats.ts`: `part.vendorCount > 1 && part.save > 0.5`.
- `VendorComparison({ part }: { part: Part })`: a Panel titled `Unit price and reject rate, by vendor`.
  - A grid of `<article data-vendor={vendorId}>` cards sorted by `avgPrice` asc. Each card has:
    - the name
    - a chip: `Lowest price` (savings tone) on the cheapest when there is more than 1 vendor, or `Single source` when there is 1
    - `unitMoney(avgPrice)` large, with "per unit"
    - a price bar (`bg-savings` cheapest, else `bg-price`) sized by avgPrice ÷ max
    - rows:
      - `Price vs lowest`: `vsCheapest(vendorVsCheapest(v))`, colored with `vsCls`; omitted for a single vendor
      - `Reject rate`: `pct`, `text-destructive` at ≥ 5%
      - `Quantity`: `count`
      - `Spend`: `money`
  - The cheapest card is `bg-savings-soft` when there is more than 1 vendor.
- `SavingsSimulator`: a Panel titled `Savings simulator`, subtitle `Try a partial move before committing all the volume.`
  - Keeps its label text, slider, and `<output aria-live>` "Saves …".
  - The output and the "Across N bikes" / "Not on a BOM" line sit in a `bg-savings-soft rounded-xl` box under the eyebrow `Estimated savings`.
  - The "Only one vendor" branch is removed: the page doesn't render the simulator unless `hasSaving`.
- PartView order:
  1. PageHeader (crumbs, title, `partMeta`)
  2. StatRow:
     - `Spend`: `money(spend)`, caption `{money(|ppv|)} {ppv ≥ 0 ? 'above' : 'below'} vendor standard`
     - the second stat:
       - with a saving: `Best-price savings` `money(save)` (tone savings), caption `on price alone`
       - otherwise: `Vendors` `{vendorCount}`, caption `Single source` or `Same price from every vendor`
     - `Reject rate`: `pct`
  3. VendorComparison
  4. SavingsSimulator, only when `hasSaving`
  5. `<details>` with a `<summary>` reading `Bikes that use this part · {n}`, containing WhereUsed. When the part is on no BOM, keep its "Not used on any bike's BOM" message.

- [ ] **Step 1: Write failing tests** (update `PartDetail.test.tsx` on purpose):
  - Replace `rowOf` for vendors with `cardOf = (h, n) => h.split('data-vendor').find(t => t.includes(n))`.
  - 513:
    - Anderson's card contains `$26.60`, `Lowest price`, `28,050` and `5.5%` in `text-destructive`.
    - Premier's card contains `$39.20` and `+47.4%` in `text-caution font-semibold`.
    - Anderson's card comes before Premier's.
    - The header still contains `$1.82M`, `$86.9K`, `$346.5K` and `5.4%`.
  - The simulator test is unchanged, plus `Estimated savings`.
  - Part 1: contains `Single source`, and contains neither `Savings simulator`, `type="range"`, nor `Best-price savings`.
  - Part 908: contains `Same price from every vendor` and no `Savings simulator`.
  - Part 341: still `Not on a BOM` and `Not used on any bike&#x27;s BOM`.
  - The old "warn tint row" test is replaced by the Premier caution assertion above.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.** **Step 4:** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5: Commit** `feat(part): vendor comparison cards, restyled simulator, no-saving and single-source cases`.

---

### Task 7: Visual pass and stop

- [ ] Run `npm run dev` and screenshot `/`, `/?line=Touring`, `/products/969`, `/products/969/821`, `/parts/513`, `/parts/1`, `/parts/908`, `/savings` and `/match-review`. Fix any layout breakage, test-first if it's behavior.
- [ ] Phase exit: `python3 data/check_outputs.py web/public/data`, then `cd web && npm test && npm run build && npx oxlint src`.
- [ ] **Stop. Show the pages to the user before 5b.** Rev2 section 3.6 must be settled first.
