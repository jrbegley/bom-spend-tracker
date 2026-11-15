# Handoff: where to pick up

Common Thread, formerly Spendline (BOM to spend cube explorer). Read in this order:
1. `BUILD_SPEC.md` sections 1, 2, 4 and 5 (the original spec and the data method).
2. `SPEC_REVISION_2.md`. **It wins wherever it disagrees with `BUILD_SPEC.md` or with older decisions below.** Its section 10 covers the Lovable design port.
3. `SPEC_VENDOR_PAGE.md`. It wins for vendor pages and the nav.
4. `SPEC_PITCH_DEMO.md`. **For the pitch demo it wins over `SPEC_REVISION_2.md`.**
5. This file.

## Status (branch `main`)

| Phase | State |
|---|---|
| 0–4 | Done: pipeline, shell, demo path, supporting screens, Match review concept, polish. Plans are in `docs/superpowers/plans/`. |
| **5a Lovable look, current data** | **Done and merged** (`docs/superpowers/plans/2026-11-14-phase-5a-lovable-look.md`). Walked through in Chrome with no console errors. Opus whole-branch review: no Critical issues. Three fixes are on `main` (see "Review follow-ups"). |
| **Vendor page** (`SPEC_VENDOR_PAGE.md`) | **Done and merged** (`docs/superpowers/plans/2026-11-14-vendor-page.md`). Section 6 acceptance passes. Walked through in Chrome. Opus review: no Critical issues, three Important fixes on `main` (see "Vendor page"). |
| **Match review feedback** | **Done and merged** (`docs/superpowers/plans/2026-11-14-match-feedback.md`). Working review workflow on the page, held in page state, nothing saved (by request). Walked through in Chrome. Opus review: no Critical issues; two fixes on `main` (see "Match review feedback"). |
| **Pitch demo** (`SPEC_PITCH_DEMO.md`) | **P0 and P1 built on branch `pitch-demo`** (`docs/superpowers/plans/2026-11-14-pitch-demo.md`): rename, sample-data label, hidden 5c controls, `/network`, supplier view, Part page link. See "Pitch demo" below. |
| **5b Data** (`SPEC_REVISION_2.md` 10.4) | **Not started. Blocked on the team settling `SPEC_REVISION_2.md` section 3.6.** |
| 5c Finance features | Not started (depends on 5b). |

237 tests pass (`cd web && npm test`). `npm run build` and `npx oxlint src` are clean. `python3 data/check_outputs.py web/public/data` prints `ALL CHECKS PASSED`.

## Pitch demo (after match feedback)

- **Name:** the app is **Common Thread** (was Spendline). `src/test/noOldName.test.ts` guards against the old name in `web/src` and `web/index.html`.
- **Sample-data line:** every page's top bar says "Sample data: AdventureWorks, Microsoft's demo ERP for a fictional bike maker", with a hover sentence.
- **Hidden controls:** the "All years" select and "Assumptions" button are behind `FEATURES.yearAndAssumptions` in `lib/features.ts` (off). **Phase 5c: flip it to `true`.**
- **`/network` (Buying network, after Vendors):** an Illustrative concept page.
  - Three headline numbers, then the part-by-part admission test: top 10, "Show all", filter chips (All / Joins the pool / Stays with current vendor), and a click-to-expand delivered-cost breakdown per row.
  - **Join the pool** is page state only, nothing is saved, and it resets on reload.
  - A second tab, **What suppliers see**, for the 7 on-BOM pool parts: network demand, a four-quarter forecast, member count only, and the 2% fee (illustrative).
  - **Deep link:** `/network?part=:id` opens the full list with that row expanded.
  - Part pages for pool parts have a line under the vendor cards linking to their row.
- **Data:** `python3 data/build_network.py data/raw web/public/data` writes `network_member.json` (real) and `network_synthetic.json` (seeded, every record `"synthetic": true`). Rerunning gives identical files. The tuned values (`SEED = 7`, `W = 0.5`, `FREIGHT_PER_DELIVERY = 5.0`) give 121 parts passing and 4 failing (Lock Washer 1, 2, 9, 11), with a 18.2% average discount on passing parts. `check_outputs.py` covers both files. Logic is in `lib/network.ts`.
- **Where the data differs from the spec:**
  - The pool is **125 parts / $136.8K a year**, not 127 / $137K, and **7** are on a BOM, not 8.
  - Chainring Bolts are bought by the **canister**, so the page says "per canister" and never mixes per-piece figures.
  - Every sample PO line is 3 units, so "freight at your order size" assumes one network delivery a month.
  - Lead time and minimum order are drawn at or under the member's, so only price and freight can fail a part. Those two branches are unit-tested only.
- **Saving figure:** the page says **$15.1K a year** (about 11% of pool spend). The deck's "18% lower" is the pooled price before fee and freight.
- **For Joe (spec 5.3, slide 9):** swap the screw numbers for Chainring Bolts: you buy **109 canisters a year** (real), the network buys **2,521** (synthetic), 17 manufacturers.
- **Screenshots for the deck:** `docs/pitch/slide-6-touring-rim.png` and `docs/pitch/slide-9-network.png`, taken at 1440 px.

## What 5a changed

- **Tokens and fonts:** `web/src/index.css` now holds the tokens from `design/lovable-tokens.css` (oklch palette, radius scale, `num`, `eyebrow` and animation utilities). Inter is used for everything, with Newsreader only for the "Common Thread" wordmark. Every old class name was renamed to the new token names. Use `text-primary` for links (Lovable's `accent` is a pale neutral). `bg-ppv` and `bg-savings` are bar fills; `text-ppv-ink` and `text-savings-ink` are their text colors.
- **Shell:** the nav is Product costs `/`, Savings `/savings` and Match review. The top bar holds search, a disabled year selector ("All years") and a disabled Assumptions button, both placeholders for 5c. Navigation state comes from `lib/nav.ts`.
- **Product costs `/`** (replaces Overview):
  - three stats: standard cost, total variance, verified
  - bikes ranked by PPV dollars, with PPV-only driver bars and line chips (`?line=`)
  - the top 10, then "Show all"
  - logic in `lib/productCosts.ts`
- **Level page** (`/products/:id/...`), in this order:
  - three stats: actual, variance per bike, total variance
  - the Standard → PPV → Actual bridge (`lib/bridge.ts`, `components/CostBridge.tsx`)
  - the components table
  - the data-driven insight banner
  - vendors collapsed in `<details>`
- **Part page:**
  - vendor cards on price and reject rate (`components/VendorComparison.tsx`)
  - the simulator, shown only when `hasSaving(part)`
  - where-used collapsed
  - Edge cases: single source (part 1), and a tie at the same price with no saving (part 908).
- **Shared look:** `components/primitives.tsx` holds PageHeader, StatRow/Stat, Panel, FilterChips and Chip.
- **Retired:** the Overview page, LinePpvCard, TopOpportunities, MatchQueueCard, CostSummary and VendorPrices. `/opportunities` redirects to `/savings`. `/products` still works but is off the nav.

## Vendor page (after 5a)

- **Nav:** Product costs, Savings, **Vendors**, Match review.
- **`/vendors`:** line chips (All, Road, Mountain, Touring, Not on a BOM) and a name filter, both kept in the URL (`?line=`, `?q=`) so Back returns to them. Top 10, then "Show all 86 vendors". `?highlight=:id` still works, and opens the list expanded when the vendor is past the top 10.
- **`/vendors/:id`:** three stats (Spend, PPV, "Lowest price on N of M parts"), then "Parts from this vendor": each part this vendor supplies, compared against every vendor of that part. Bars are unit price plus reject cost. Quality and Spend by part are collapsed.
- **Logic:** `lib/vendorParts.ts` (`vendorParts`, `vendorSummary`), tested against the real JSON.
- **Links:** vendor names link to `/vendors/:id` everywhere: the list, vendor tables on level pages, Part page cards, and search results.
- **Not until 5c:** "Lowest price" (not "Lowest effective cost"), no "Cheapest price, higher total cost" flag, no "Moving … saves $X" lines. These need warranty data.
- **Edge cases handled:** single-source vendors (Superior Bicycles, 1576), non-BOM vendors (1636), negative PPV (1574), and many parts (Custom Frames, 1568: top 5 then "Show all").
- **Deferred minors:**
  - A PPV of exactly 0 shows "+$0". The list shows "$111.8K" where the vendor page shows "+$111.8K".
  - Hover definitions use `title` only (not reachable by keyboard or touch). Part blocks lack `h3` headings. The "Show all" buttons lack `aria-expanded`.
  - "used in 1 bikes" isn't pluralised. Bar widths would be NaN if a total were 0. No data hits either today.
  - A no-match message mentions only the name filter. The Spend caption repeats the units from the meta line.
  - Back restores the list's filters, but not its sort or "Show all" state.

## Match review feedback (after the vendor page)

- **Scope:** working functionality on the page only. Decisions live in page state; **nothing is saved or exported, by the user's request.** The page keeps its "Illustrative" badge, and a footer says decisions stay in this browser tab.
- **Per line:**
  - **Accept** confirms the top match in one click.
  - **Correct…** opens an editor (`components/CorrectionEditor.tsx`) offering:
    - candidate #2 or #3
    - "Search all parts" (`searchParts` in `lib/search.ts`, 2+ characters)
    - "Not a BOM part", hidden when that's already the top match
    - "No match · send to manual matching"

    Plus optional reason chips (`REASONS` in `lib/matchReview.ts`). **Confirm** stays disabled until the choice is complete.
  - The card then collapses to "Confirmed · X", "Corrected · X (was Y)" or "Sent to manual matching", with **Undo**.
- **Feedback summary** (`components/FeedbackSummary.tsx`):
  - counts of confirmed, corrected and sent to manual
  - overrides by top-match confidence band (High ≥80%, Medium 60–79%, Low <60%)
  - the reasons given
  - Reasons count only on overrides.
- **Logic:** `lib/matchReview.ts` (`resolve`, `band`, `feedbackSummary`, `choiceComplete`). A search pick that equals a listed candidate counts as that candidate.
- **Keyboard focus:** Accept and Confirm move focus to the card's Undo, Undo to its Accept, Correct… to the editor's first option, and Cancel back to Correct….
- **Change before a demo:** the five reason chips are placeholders. Swap them for what the matching work actually tracks.
- **Deferred minors:**
  - Re-selecting "Search all parts" keeps the old query but drops the picked part.
  - Search results aren't announced to screen readers.
  - `resolve()` could print "null" for an out-of-range candidate rank, which the UI can't reach.
  - The summary's three counts are cramped in the side column on laptops.

## Review follow-ups (5a)

**Fixed, test-first:**
- Collapsed sections (vendors, where-used) now show a chevron cue (`Disclosure` in `primitives.tsx`). Safari's own marker is hidden.
- Two old class names on Match review (`border-ppv-bar`, `hover:bg-accent-hover`) slipped past the rename. They're fixed, and `src/test/noLegacyClasses.test.ts` now guards against any return.
- The landing `#` column now ranks within the line filter.

**Deferred minors** (fine to pick up in 5b or 5c):
- **Bridge:** tick labels fall on odd values (e.g. $1175). Snap the step to 1, 2 or 5 × 10ⁿ.
- **Landing:** it assumes every bike is above standard. A negative `ppvTotal` would give a broken bar width and a "+-$" headline. No bike is negative today.
- **Nav:** it sets `aria-current="page"` on a detail page's section. Use `"location"` unless the path matches exactly.
- **Filter chips:** the accessible name runs label and count together ("Touring22"). Add a hidden space.

## Next steps

1. **Settle `SPEC_REVISION_2.md` section 3.6 with the team before writing the 5b plan:**
   - Are rejects already inside actual cost? (double-count risk)
   - Inventory build inside product cost: should there be a "bought, not yet consumed" step?
   - The per-bike price on the part page.
   - Fiscal-year allocation: same-year purchases, or a rolling blend?
2. **Write the 5b plan** (`build_synthetic.py`, warranty, spares, pending lines, per-year aggregates, plus checks for the two planted stories). Then 5c.
3. **By hand:** Tab through every page. Keyboard behavior has never been verified with real keystrokes (see Gotchas). 
4. **Optional:** jsdom for effect tests (scroll, fade). It's a new dev dependency, so ask first.

## Run it

```bash
cd web && npm install && npm run dev      # http://localhost:5173
npm test && npm run build && npx oxlint src
# to regenerate data (web/public/data is committed, so usually not needed):
python3 -m venv .venv && source .venv/bin/activate && pip install pandas
python3 data/build_data.py data/raw web/public/data   # data/raw: AdventureWorks CSVs, see BUILD_SPEC.md section 3
```

`/dev` is a component test page that exists only in dev builds.

## Decisions in force

- **Money format (D1):** `money()` follows spec 5.3 literally, so the app shows `$57.73M`, `$79.5K` and `$890.0K` rather than `$57.7M` or `$890K`. Tests pin this.
- **Cost basis:** blended prices in product views, purchased material only, and PPV and best-price savings never added together.
- **Fiscal years:** the year selector says "All years" until 5c, because the data covers April 2022 to September 2025.
- **Savings page:** `/savings` is the old Opportunities table, retitled and still ranked by price-gap savings, until the real Savings page in 5c.
- **Level page order** follows the Lovable concept: banner after the components, vendors collapsed. This replaces the older "banner last" decision.
- **No new dependencies without the team's OK:** no Radix, lucide-react or recharts. Charts are divs or inline SVG.
- **No sample data:** never use numbers from the Lovable concept's sample data. Every figure comes from `web/public/data`.

## How the work is done (keep doing it this way)

- **One plan per phase:** each phase gets a plan in `docs/superpowers/plans/`, written with the superpowers `writing-plans` skill and executed task by task, test-first, with `executing-plans`. One whole-branch review at the end, then merge.
- **Code layout:** pure logic lives in `web/src/lib/` with unit tests.
- **Page tests:** pages split into a pure `…View` (props in) and a thin default export (hooks), so tests server-render the View against the real pipeline JSON (`web/src/test/realData.ts`: `loadCore()`, `readData()`).
- **Design reference:** the Lovable preview at https://id-preview--743943ad-0481-4423-8cf9-a38307cc517c.lovable.app is publicly viewable. Use it for layout only, never its numbers. Its bike rows all link to one product; ours link to each bike.

## Gotchas

- **Untracked duplicates:** files like `build_data 2.py` and `package 2.json` are iCloud sync copies and not part of the repo. Never `git add` them; add explicit paths. `spendline-handoff/` and its zip are untracked originals of the files now committed at the root and in `design/`.
- **Data folders:** `data/raw/` is git-ignored. `web/public/data` is committed on purpose. Don't edit `data/build_data.py`, which is verbatim from the spec.
- **Editing files:** macOS `sed -i` needs `-i ''`, so prefer small Python or Node edit scripts. On Windows, allow for `\r\n` line endings.
- **Browser automation:** real keystrokes from the Chrome tool often don't reach the page, so check keyboard behavior by hand. Background tabs throttle timers.
- **Server-rendered tests:** adjacent JSX text nodes render with `<!-- -->` between them, so build strings with template literals. Breadcrumb tests match `<span aria-current="page">…</span>` exactly; style that span from the parent `<nav>`.
- **Agent hook:** the context-mode hook rewrites Agent calls, so auto mode asks for the same call twice before a reviewer agent runs.
