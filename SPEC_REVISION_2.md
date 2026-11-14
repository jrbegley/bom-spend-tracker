# Spec revision 2: finance-first redesign

Date: 2026-11-14. Read this after `BUILD_SPEC.md` sections 1, 2 and 4, and before starting new work. Where this file and `BUILD_SPEC.md` disagree, this file wins. Decisions marked **Open** must be settled with the team before building the parts that depend on them.

Visual design comes from the Lovable concept: https://lovable.dev/projects/743943ad-0481-4423-8cf9-a38307cc517c Port its look into the existing app; keep the pipeline, `lib/`, and tests.

---

## 1. What changes and why

The primary user is now explicitly the **finance/cost team**. Procurement is second. The core question is:

> What does each product really cost, and why does it differ from standard?

Each cost driver links to its fix. A price driver leads to the supplier comparison and a savings opportunity. A warranty driver points to a quality problem.

**New design principle: do not overload the user on first view.** Every page opens with a plain title and meta line, then at most three headline numbers and one primary visual. No summary sentence at the top. Detail is revealed on click, hover, or expand (section 6).

## 2. Locked decisions superseded

| BUILD_SPEC item | Was | Now |
|---|---|---|
| 1 (user) | Product cost owner; procurement via Opportunities | Finance/cost team first; procurement second, served by Part and Savings pages |
| 2 (default sort) | PPV desc everywhere | Landing ranks bikes by total variance $; Savings ranks by effective-cost savings; other tables keep PPV desc |
| 6 (home) | Overview | **Product costs** page is home (section 4.1) |
| 8 (time) | One window, no date picker | Fiscal year selector, default FY2025, with "All years" (section 3.5) |
| 10 (PPV vs savings) | Never added | Still never added. The cost bridge adds PPV, rejects and warranty; best-price savings stays separate |
| 15 / section 11 (scope) | No date pickers; no invented data | Date picker is in. Generated data is allowed **only** for warranty, spares and pending lines, tagged `synthetic: true` and labeled in the UI |
| Decisions (HANDOFF) | No "Compare with" link | Product vs product comparison is in (section 4.2) |

Unchanged: blended prices in product views, purchased material only, consumption-based allocation, Blended badge, Match review stays a labeled concept.

## 3. Cost definitions

### 3.1 True cost
True cost per unit = standard + PPV + rejects + warranty.
- **Spares bought for resale**: shown as their own line. Kept out of per-unit product cost.
- **Freight and fees**: one separate figure. Kept out of per-unit cost.

### 3.2 Effective cost per part (vendor comparison and savings)
> Effective cost = unit price + (reject rate x unit price) + (warranty failure rate x cost per claim)

- Savings opportunities and vendor tables rank on effective cost.
- When the lowest price and the lowest effective cost come from different vendors, show the flag **"Cheapest price, higher total cost"**.
- Warranty failures are attributed to the vendor whose part failed. Real companies get this from lot or serial tracking; here the synthetic claim records carry the vendor.

### 3.3 Failure rates
- Count only **mature units**: older than the age by which 80% of historical claims arrive, capped at the warranty term.
- Show the sample size next to every rate ("2.8% of 1,950 units").
- Flag **"Not enough history"** when the 90% confidence interval is wider than +/-1 percentage point. Then use the part's average rate across all its vendors and say so.

### 3.4 Verified vs pending
Totals count verified spend only (exact part number, saved vendor link, reviewer-confirmed, or above the auto-accept cutoff). Pending spend shows beside each total ("$12.40 pending review") and links to Match review. With AdventureWorks every real line is verified; pending comes from about 20 synthetic lines.

### 3.5 Fiscal years
Assumes the AdventureWorks convention: the fiscal year runs July to June, so FY2025 = July 2024 to June 2025 (complete). FY2022 (April to June 2022) and FY2026 (July to September 2025) are partial and labeled "partial". Each cost shows change vs prior year; the product page has an actual-vs-standard trend by year.

### 3.6 Open: method questions found in the pipeline (settle before building the bridge)

1. **Rejects may already be inside actual cost.** Spend uses OrderQty x UnitPrice, and `effPrice` spreads all spend over consumption, so the cost of rejected units is already in `costUnit` (and in `stdUnit`). Adding a "Rejects" step on top would double count. Options: (a) carve rejects out as a step inside the existing gap by redefining standard on good units only; (b) show rejects as an informational driver, not added. Also unknown: whether rejected units are credited back by vendors (AdventureWorks does not say). Put the chosen rule in the Assumptions panel.
2. **Inventory build is inside product cost.** 55,550 Touring Rims were bought and 29,470 consumed, so the rim's effective price in product views ($61.89) is far above either vendor price ($26.60, $39.20). A finance user will treat purchases that went to inventory as inventory, not product cost. Proposal: a bridge step or separate figure "Bought, not yet consumed", so the bridge reads standard -> PPV -> rejects -> warranty -> true cost on consumed units only. The obstacle is units of measure: cartons and cases have no conversion in the data, which is why the pipeline spreads spend over consumption. Decide per part: use quantity x price where the vendor unit is EA, keep the consumption method elsewhere, and label which method each part uses.
3. **Per-bike price on the Part page.** The data cannot say which vendor's parts went into which bike, so every bike's price for a part is the same blended price. The Part page shows each bike's share of consumption and allocated spend, with no per-bike price column.
4. **Fiscal-year allocation.** Units built per year come from WorkOrder dates; spend per year from PO dates. Purchases and builds in different years will make single-year per-unit costs noisy. Decide whether a year's cost uses that year's purchases (simple) or a rolling blend.

## 4. Pages

Nav: Product costs, Savings, Match review. Assumptions opens from the header. The old Overview, Products, Opportunities and Vendors pages fold into these (the vendor table lives inside Part and Product pages; keep `/vendors` reachable from search only if cheap).

### 4.1 Product costs (`/`, finance)
- Plain header: "FY2025" eyebrow, title "Product costs", subtitle "97 bikes · purchased material, true cost vs standard".
- Three headline numbers: true cost, total variance, verified vs pending.
- Table of bikes ranked by **total variance $** = (true cost - standard) x units built. Each row: labeled driver bar (PPV, rejects, warranty; segments differ in lightness and carry labels), per-unit variance and variance % (sortable). Shows the top 10 with "Show all 97".
- Line filter (Road, Mountain, Touring) and fiscal year selector.

### 4.2 Product (`/products/:id`, finance)
- Breadcrumb, title, meta line (no summary sentence).
- **Cost bridge** (waterfall): Standard -> + PPV -> + Rejects -> + Warranty -> True cost, pending hatched. Each step is a button that filters the component table to the parts behind it.
- Component table (existing drill-down to assemblies and parts is kept).
- Trend: actual vs standard by fiscal year (collapsed by default).
- "Compare with <similar bike>": side-by-side view showing each part's contribution to the cost gap.

### 4.3 Part (`/parts/:id`, procurement; build first)
- Bikes using the part with share of consumption and allocated spend (no per-bike price, see 3.6.3).
- Vendors compared on effective cost: price, reject rate, failure rate with sample size, effective cost, the "Cheapest price, higher total cost" flag.
- Savings opportunity on effective cost. The existing Savings simulator stays.
- Procurement language on this page: unit price, price vs lowest vendor, effective cost, savings.

### 4.4 Savings (`/savings`, procurement)
Opportunities ranked by effective-cost savings. Replaces Opportunities. (Statuses and owners: **parked**, see section 8.)

### 4.5 Match review
Unchanged.

### 4.6 Assumptions panel (drawer)
Each value derived from the client's data, with a source line; client-set values say so; missing data falls back to a labeled default; overrides carry a "Changed" marker and update results live.

| Assumption | Derived from |
|---|---|
| Cost per warranty claim | Median actual claim cost (part + labor + shipping), per part category when there are enough claims |
| Maturity cutoff | Claim-lag curve: age by which 80% of claims arrive, capped at warranty term |
| Not enough history | 90% confidence interval wider than +/-1 point |
| Allocation | Units from work orders |
| Review and error costs | Client-set (see matching engine design) |
| Reject rule | Per 3.6.1 once settled |

### 4.7 Lineage (on click only)
Numbers look like plain numbers, with a dotted underline on hover. Clicking opens a side panel: the calculation in plain words, the PO lines behind it (date, vendor, qty, unit price, match method), and CSV export. Full panel on the Touring Rim path; elsewhere the calculation only.

## 5. Data additions (pipeline)

Add a second script, `data/build_synthetic.py` (leave `build_data.py` untouched), writing tagged records:
- `warranty_claims.json`: claim date, product, part, vendor, cost (part, labor, shipping), `synthetic: true`. Concentrate claims on Touring bikes.
- `spares.json`: purchases of a few parts bought for resale.
- `pending_lines.json`: about 20 spend lines with low match confidence, spread across bikes.
- Per-year aggregates for products, parts and vendors.

Planted stories:
1. **Touring Rim saving survives the warranty check.** Anderson's still wins on effective cost; the saving shrinks from $346.5K to about $300K.
2. **HL Crankarm saving flips.** The lowest-price vendor has a high failure rate (about 6% vs 0.5%). With the derived cost per claim, it costs more, and the flag fires.

Add acceptance checks for both stories to `check_outputs.py` (or a sibling script).

## 6. Progressive disclosure rules

- First view of every page: plain title and meta line, at most three headline numbers, one primary visual. No AI-style summary sentence.
- Tables show the top 5 to 10 rows with "Show all N".
- Secondary sections (trend, vendor table on product pages, method notes) are collapsed or behind tabs.
- Definitions on hover; lineage on click; assumptions in a drawer.
- No more than one accent color for emphasis per section.

## 7. Demo path (about 4 minutes)

1. Product costs: bikes ranked by variance; Touring-1000 Blue, 60 near the top, warranty segment visible.
2. Product bridge: click the Warranty step; components narrow to wheels and crankset.
3. Touring Rim part page: 22 bikes, vendors on effective cost, saving holds at about $300K; open lineage, close it.
4. HL Crankarm part page: "Cheapest price, higher total cost".
5. Assumptions: show the derived cost per claim, override it, watch the flag respond, reset. (Cut if short on time.)
6. Match review: confirm one line.

## 8. Parked and dropped

- **Parked:** finance-to-procurement handoff (opportunity statuses, owners, projected vs realized savings).
- **Dropped:** linking Match review lines to the products they affect with live product-cost updates.

## 9. Suggested order

1. Settle section 3.6 with the team.
2. Synthetic data script and checks (section 5).
3. Part page (4.3), then Product page bridge (4.2), then Product costs landing (4.1).
4. Assumptions drawer and lineage panel.
5. Port the Lovable visual design; apply section 6 rules.
6. Savings page, comparison view, polish.

Keep the existing working method from `HANDOFF.md`: a plan per phase in `docs/superpowers/plans/`, test-first, pure logic in `web/src/lib/`.

## 10. Porting the Lovable design

Lovable project: https://lovable.dev/projects/743943ad-0481-4423-8cf9-a38307cc517c (preview: https://id-preview--743943ad-0481-4423-8cf9-a38307cc517c.lovable.app). To read its code, connect the Lovable project to GitHub (Lovable editor, GitHub, Connect) and clone that repo next to this one. Its color, type and spacing tokens are also copied in `design/lovable-tokens.css`.

### 10.1 Port the look, keep this repo's stack
The concept uses TanStack Start, React 19, shadcn/ui (Radix), lucide-react, recharts and class-variance-authority. This repo is React 18, React Router and plain Tailwind v4 with no component library, and that stays.
- Bring over the tokens from `design/lovable-tokens.css` into `web/src/index.css`: oklch palette (paper background, ink text, petrol-blue primary, PPV amber, rejects slate, warranty violet, savings green, caution), radius scale, card and lift shadows, and the utilities `num`, `eyebrow`, `term-underline`, `trace-underline`, `animate-grow-x`, `animate-grow-y`, `animate-rise`, plus the reduced-motion rule. These replace BUILD_SPEC section 5.1 tokens.
- Fonts: Inter for everything. Newsreader (serif) only for the Spendline wordmark. Page titles are plain Inter, about 28px, semibold. No summary sentence at the top of any page.
- Rebuild the concept's components in plain Tailwind. For tooltips, sheets and accordions use native elements (`<details>`, `<dialog>`, `title`) or small hand-written components. Adding Radix, lucide-react or recharts is a new dependency and needs the team's OK (HANDOFF rule); bars and charts stay plain divs or inline SVG.
- Never import the concept's `src/data/sample.ts` numbers. Every figure comes from the pipeline JSON.

### 10.2 Component mapping (concept file -> this repo)
| Concept (`src/components/spendline/`) | This repo |
|---|---|
| `app-shell.tsx` | restyle `AppShell`, `NavRail` (nav: Product costs, Savings, Match review; year selector and Assumptions button in a top bar) |
| `primitives.tsx`: `PageHeader`, `StatRow`/`Stat`, `Panel`, `StatusChip`, `Term`, `FilterChips`, `ShowAllButton`, `Crumbs`, `Note` | new shared components, replacing `KpiTile`, `Breadcrumb`, `LeverChip`, `BlendedBadge` styling |
| `product-rank-list.tsx` + `driver-bar.tsx` | new Product costs landing (`/`), replacing Overview |
| `cost-bridge.tsx` | top of `LevelPage` |
| `component-table.tsx` | restyle `ComponentsTable` (keep drill-down to assemblies and parts) |
| `vendor-comparison.tsx` | `PartDetail` vendor section (replaces `VendorPrices`) |
| `savings-simulator.tsx` | restyle `SavingsSimulator` |
| `trend-chart.tsx` | collapsed trend on `LevelPage` (inline SVG) |
| `source-sheet.tsx` | new lineage panel, opened on click only |
| `assumptions.tsx` | new Assumptions drawer |

### 10.3 One template, every bike and part
`LevelPage` and `PartDetail` already render all 97 bikes, their assemblies, and all 265 parts from data. Restyling them applies the design everywhere. Design these cases, which the concept does not show:
- A bike or assembly with no warranty cost: hide the Warranty bridge step or show it at $0, never an empty gap.
- Assembly pages (for example Touring Front Wheel at `/products/969/821`): same bridge and component layout, scoped to the assembly.
- A part with one vendor: no comparison; show the single vendor's effective cost and "Single source".
- A part with thin failure history: "Not enough history" with the fallback rate (section 3.3).
- A part with no savings: no savings card, no simulator.
- The Touring Rim callout must stay data-driven: keep `InsightBanner` logic (`lib/insight.ts`) and only change its look.
- Rows and links: every bike row links to its own page; no hard-coded routes to Touring-1000.

### 10.4 Build order for the port
- **Phase 5a, look only, current data:** tokens and shell; Product costs landing ranked by PPV $ (rejects and warranty segments appear once 5b lands); `LevelPage` with a bridge of Standard -> PPV -> Actual; `ComponentsTable`; `PartDetail` vendor section on price and reject rate; simulator. Keep tests green; update text assertions where layouts change, and keep D1 money formatting.
- **Phase 5b, data:** settle section 3.6, then `build_synthetic.py` (section 5) and per-year aggregates.
- **Phase 5c, finance features:** Rejects and Warranty bridge steps, effective cost and the "Cheapest price, higher total cost" flag, fiscal year selector, Assumptions drawer, lineage panel, Savings page, product comparison.
