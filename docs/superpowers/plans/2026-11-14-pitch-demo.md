# Pitch Demo (Common Thread) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the app pitch-ready. Rename it to Common Thread, label the sample data on every page, hide the 5c placeholders, and build an illustrative `/network` page (the pooled-buying admission test). Then, time permitting, add a supplier view and link Part pages to the pool.

**Architecture:** A new stdlib-only script, `data/build_network.py`, reads the committed pipeline JSON plus two raw CSVs. It writes `network_member.json` (real figures) and `network_synthetic.json` (seeded, every record tagged `"synthetic": true`). `data/build_data.py` stays untouched. The pure join and test logic lives in `web/src/lib/network.ts`. The page follows the existing pattern: a pure `NetworkView` with lifted state, plus a thin default export holding hooks and URL params.

**Tech Stack:** Python 3 stdlib (`csv`, `json`, `random`, `datetime`), React 18 + TS + Vite + Tailwind v4, react-router-dom v7, Vitest server rendering against the real JSON.

**Spec:** `SPEC_PITCH_DEMO.md` (copy it from `spendline-handoff/` to the repo root in Task 1). For this work it wins over `SPEC_REVISION_2.md`. `SPEC_VENDOR_PAGE.md` and `HANDOFF.md` give the context.

**Branch:** `pitch-demo` from `main` at `ba54a0d` (193 tests).

## Global Constraints

- No new dependencies (npm or pip) without asking. The new script uses the Python stdlib only.
- Never edit `data/build_data.py`. It is verbatim from the spec.
- No numbers from the Lovable concept's sample data. The spec's breakdown example values ($38.00, $1.52, $1.20, $40.72, $48.90) only show the layout. On screen, every figure comes from the JSON.
- Money format D1 (`money()` in `lib/format.ts`, spec 5.3 literally): `$136.8K`, not `$137K`.
- Every synthetic number appears only on a page that carries `<Chip tone="caution">Illustrative</Chip>`.
- Copy from the spec, verbatim:
  - **sample-data line:** "Sample data: AdventureWorks, Microsoft's demo ERP for a fictional bike maker"
  - **network meta line:** "Concept. Your volumes come from the sample data; network figures are synthetic."
  - **promise line:** "Nobody pays more. A part moves into the pool only when it saves money."
  - **message after joining:** "Opted in. Pooled volumes are shared; your prices and part numbers stay private."
- Never mix per-purchase-unit and per-piece numbers on one row. Network figures are all per purchase unit (canister, container, case).
- Join the pool lives in page state only. Nothing is saved.
- Every task ends green: `cd web && npm test`, `npm run build`, `npx oxlint src`, and `python3 data/check_outputs.py web/public/data`.
- `git add` explicit paths only. Never add the iCloud " 2" copies.

## Facts found while planning (data vs spec)

- **Pool size:** the pool regex finds **125 parts / $470,185**, not 127 / $472K. That's **$136,841 a year** (1,255 days, 2022-04-15 to 2025-09-21, so 3.436 years), which matches the spec's "about $137K". **7** of them are on a BOM, not 8.
- **Chainring Bolts (part 320):**
  - unit code `CAN`, which is a **Canister**, not a case
  - 375 units, so 109.14 a year
  - average price $47.478, reject rate 0.008 (3 of 375)
- **Order sizes:** every AdventureWorks PO line for these parts is exactly 3 units, so order size can't drive freight. Task 4 rules on this.
- **Work orders:** they run from 2022-06-02 to 2025-06-01. The supplier forecast in Task 9 uses the latest complete same calendar quarter for each forecast quarter.

## Review Focus

1. **The failing rows sit at the bottom.** The parts that fail the test are the smallest by volume, so they also have the lowest spend and never show in the top 10. A judge must see at least two "Stays" rows without scrolling through 125. Pinned in Task 6 by the result filter chips and their test.
2. **Units must not mix.** Chainring Bolts must read "per canister", and a row must never show a per-piece figure next to a per-canister one. The headline volume multiple can't sum canisters with cases. Pinned in Task 5 (the multiple is computed at your prices) and Task 6 (the unit label test).
3. **A part in one file but not the other.** If `network_member.json` and `network_synthetic.json` disagree on IDs, the page must not crash or show NaN. Pinned in Task 5: `networkRows` drops a member with no network record.
4. **A deep link past the top 10.** `/network?part=:id` for a part below the top 10 (Task 10) must open the full list with that row expanded, not a collapsed list with nothing visible. Pinned in Task 10.
5. **Join state must not survive a reload or leak into other pages.** Join must only be page state. Pinned in Task 6 by the test that the View renders not joined by default, and by the browser walk in Task 11.

---

### Task 1: Rename to Common Thread, copy the spec in

**Files:**
- Create: `SPEC_PITCH_DEMO.md` (copy of `spendline-handoff/SPEC_PITCH_DEMO.md`)
- Create: `web/src/test/noOldName.test.ts`
- Modify: `web/src/components/NavRail.tsx` (wordmark), `web/index.html` (`<title>`), `web/src/index.css:3` (comment), `web/src/components/shell.test.tsx:25`, `README.md:1` and every other "Spendline" in it, `HANDOFF.md:3` and `:24`

**Interfaces:** none.

- [ ] **Step 1: Branch and copy the spec.** `git checkout -b pitch-demo`, then `cp spendline-handoff/SPEC_PITCH_DEMO.md .`.
- [ ] **Step 2: Write the failing tests.**
  - `noOldName.test.ts` walks `web/src` and reads `web/index.html` the same way `noLegacyClasses.test.ts` does (use `fileURLToPath`). It asserts that no file contains `Spendline`, and skips itself.
  - In `shell.test.tsx`, change the wordmark assertion to `/font-serif[^>]*>Common Thread</`.
- [ ] **Step 3: Run them.** `cd web && npx vitest run src/test/noOldName.test.ts src/components/shell.test.tsx`. Expected: FAIL, listing NavRail.tsx, index.css and index.html.
- [ ] **Step 4: Rename** in NavRail, index.html, the index.css comment, README.md and HANDOFF.md. The HANDOFF line 3 becomes "Common Thread (formerly Spendline)". Plans in `docs/` stay as history.
- [ ] **Step 5: Verify.** Run the full suite, build and oxlint. Expected: 194 pass. `grep -rn Spendline web --exclude-dir=node_modules` prints nothing.
- [ ] **Step 6: Commit.** `git add SPEC_PITCH_DEMO.md README.md HANDOFF.md web/index.html web/src/index.css web/src/components/NavRail.tsx web/src/components/shell.test.tsx web/src/test/noOldName.test.ts`, then `git commit -m "chore: rename to Common Thread"`.

### Task 2: Sample-data line in the top bar; hide the 5c controls behind a flag

**Files:**
- Create: `web/src/lib/features.ts`
- Modify: `web/src/components/AppShell.tsx`, `web/src/components/shell.test.tsx:27-31`

**Interfaces:**
- Produces:
  - `export const FEATURES = { yearAndAssumptions: false } as const;`
  - `AppShell({ children, showYearAndAssumptions = FEATURES.yearAndAssumptions }: { children: ReactNode; showYearAndAssumptions?: boolean })`

- [ ] **Step 1: Write the failing tests** in `shell.test.tsx`, replacing the "top bar" test.
  - `it('top bar: sample-data line with hover sentence, no year or Assumptions controls by default')`:
    - The output contains "Sample data: AdventureWorks, Microsoft's demo ERP for a fictional bike maker" (mind the `&#x27;` escaping; match the rendered form).
    - Its `title` is "Every figure is a real calculation on that dataset; no real company spent or saved this money."
    - It does not match `/<select/` and does not contain `>Assumptions<`.
  - `it('5c flag on: year select and Assumptions button come back')`: render `<AppShell showYearAndAssumptions>`, then assert "All years" and `>Assumptions</button>`.
- [ ] **Step 2: Run them.** `npx vitest run src/components/shell.test.tsx`. Expected: FAIL on the sample-data text.
- [ ] **Step 3: Implement.**
  - Put a `<p>` in the header, after the search's `mr-auto` wrapper and before the controls, with classes `text-[12px] text-muted-foreground`.
  - Wrap the select and the button in `{showYearAndAssumptions && <>…</>}`.
- [ ] **Step 4: Verify.** The full suite passes, and build and oxlint are clean.
- [ ] **Step 5: Commit** with "feat(shell): sample-data label; hide 5c placeholders behind a flag".

### Task 3: Recheck the copy for real-company wording

**Files:** whatever the grep turns up. Probably none.

- [ ] **Step 1: Grep.** `grep -rniE "our customers|customer[s]? saved|saved .* for|real company|case study|client" web/src --include=*.tsx`. Read each hit.
- [ ] **Step 2: Fix any copy that implies a real company saved money.** Ledger "Task 3: no hits" or the fixes. Commit only if something changed: "copy: remove wording that implies a real company". Repeat this grep in Task 11 after the Network page lands.

### Task 4: Network data: `build_network.py` plus checks

**Files:**
- Create: `data/build_network.py`
- Create: `web/public/data/network_member.json`, `web/public/data/network_synthetic.json` (generated)
- Modify: `data/check_outputs.py` (new block before the final print)

**Interfaces:**
- **Usage:** `python3 data/build_network.py data/raw web/public/data`. Reads `parts.json` and `summary.json` from the output folder, and `ProductVendor.csv` and `UnitMeasure.csv` from raw (tab-separated, no header).
- **Produces `network_member.json`:** an array sorted by `yearlySpend` descending, of:
  ```
  { id: string, name: string, family: "Fastener" | "Bearing", onBom: boolean,
    unit: string /* UnitMeasure name lowercased: "canister" | "container" | "case" */, unitCode: string,
    yearlyQty: number, avgPrice: number, rejectRate: number, yearlySpend: number,
    leadTimeDays: number, minOrderQty: number }
  ```
- **Produces `network_synthetic.json`:** an array in the same order, of:
  ```
  { id: string, synthetic: true, multiple: number, networkYearlyQty: number, discount: number,
    pooledPrice: number, distributorFee: number, freightPerUnit: number,
    leadTimeDays: number, minOrderQty: number, memberCount: number,
    rebateTiers: [{ minNetworkQty: number, rebatePct: 0.02 }, { minNetworkQty: number, rebatePct: 0.04 }] }
  ```

**Rules:**

*Real side:*
- **Pool:** parts in `parts.json` whose name matches `re.compile(r"Bolt|Nut|Washer|Bearing")`. The spec's "Lock washer" is already covered by `Washer`.
- **Family:** `"Bearing"` if the name contains `Bearing`, else `"Fastener"`.
- **Years:** `(periodEnd − periodStart).days / 365.25`, from `summary.json`.
- **Per part:**
  - `yearlyQty = Σ vendor qty / years`
  - `avgPrice = spend / Σ qty`
  - `rejectRate = Σ rejectedQty / Σ receivedQty`
  - `yearlySpend = spend / years`
  - `leadTimeDays` = the min of `AverageLeadTime` (col 2) across the part's ProductVendor rows
  - `minOrderQty` = the min of `MinOrderQty` (col 6)
  - `unitCode` = col 9 stripped, joined to UnitMeasure

*Synthetic side:* `random.Random(SEED)`, with draws in member order.
- `multiple`: uniform 15–40.
- `networkYearlyQty = yearlyQty × multiple`.
- `discount = 0.12 + 0.12 × (W × rankPct + (1 − W) × u)`:
  - `rankPct` is the part's network qty percentile, 0 to 1, ascending.
  - `u` is uniform 0–1.
  - Start with `W = 0.5`.
- `pooledPrice = avgPrice × (1 − discount)`.
- `distributorFee = 0.04 × pooledPrice`.
- `freightPerUnit = FREIGHT_PER_DELIVERY / max(1, yearlyQty / 12)`. Start with `FREIGHT_PER_DELIVERY = 5.0`.
- `leadTimeDays = randint(10, member leadTimeDays)`.
- `minOrderQty = member minOrderQty`.
- `memberCount = randint(10, 20)`.
- Rebate tiers at `round(networkYearlyQty × 1.15)` and `round(networkYearlyQty × 1.35)`.
- Round money to 4 decimal places and quantities to 2.

*The test, the same in Python and in Task 5's TS:*
- `effective = avgPrice × (1 + rejectRate)`
- `delivered = pooledPrice + distributorFee + freightPerUnit`
- `admits = delivered < effective and leadTimeDays <= member.leadTimeDays and minOrderQty <= member.minOrderQty`

*Ruling for the ledger:* every AdventureWorks PO line here is 3 units, so "freight at your order size" means one consolidated network delivery a month. A part's delivery size is then `yearlyQty / 12`. Cost if wrong: one formula, in two files.

- [ ] **Step 1: Write the failing checks** in `check_outputs.py`. Load the two files only if `network_member.json` exists, else `check("network files present", False, True)`. Then:
  - `check("pool parts", len(nm), 125)`
  - `check("pool yearly spend", sum(yearlySpend), 136841, 5)`
  - `check("pool on BOM", count onBom, 7)`
  - `check("member sorted by yearlySpend desc", …, True)`
  - For `cb = id "320"`:
    - `check("320 unit", cb["unit"], "canister")`
    - `check("320 yearlyQty", cb["yearlyQty"], 109.14, 0.01)`
    - `check("320 avgPrice", cb["avgPrice"], 47.4784, 0.0001)`
    - `check("320 rejectRate", cb["rejectRate"], 0.008, 0.0001)`
  - `check("synthetic ids match member", [ids], [ids])`
  - `check("every synthetic record tagged", all(r["synthetic"] is True), True)`
  - `check("multiples in 15-40", all(15 <= m <= 40), True)`
  - `check("discounts in 12-24%", all(0.12 <= d <= 0.24), True)`
  - `check("at least two parts fail the test", fails >= 2, True)`
  - `check("avg discount on passing parts ~18%", avg, 0.18, 0.01)`
- [ ] **Step 2: Run them.** `python3 data/check_outputs.py web/public/data`. Expected: `FAIL network files present`, with every older check still passing.
- [ ] **Step 3: Write `build_network.py`** to the rules above. It prints the pass and fail counts and the average discount on passing parts.
- [ ] **Step 4: Run it and tune.** Run `python3 data/build_network.py data/raw web/public/data`. If the average on passing parts is outside 0.17–0.19, or fewer than 2 parts fail, adjust `W`, then `FREIGHT_PER_DELIVERY`, then `SEED`. Ledger the final values and the pass/fail counts as a Ruling.
- [ ] **Step 5: Verify.** Run the checker. Expected: `ALL CHECKS PASSED`. Running the script twice gives byte-identical files (`shasum`).
- [ ] **Step 6: Commit** `data/build_network.py data/check_outputs.py web/public/data/network_member.json web/public/data/network_synthetic.json` with "feat(data): buying-network member and synthetic files with checks".

### Task 5: `lib/network.ts`: the admission test

**Files:**
- Create: `web/src/lib/network.ts`, `web/src/lib/network.test.ts`

**Interfaces:**
- Consumes: the Task 4 JSON shapes.
- Produces:
  ```ts
  export type MemberPart = { id: string; name: string; family: 'Fastener' | 'Bearing'; onBom: boolean; unit: string; unitCode: string;
    yearlyQty: number; avgPrice: number; rejectRate: number; yearlySpend: number; leadTimeDays: number; minOrderQty: number };
  export type RebateTier = { minNetworkQty: number; rebatePct: number };
  export type NetworkPart = { id: string; synthetic: true; multiple: number; networkYearlyQty: number; discount: number;
    pooledPrice: number; distributorFee: number; freightPerUnit: number; leadTimeDays: number; minOrderQty: number;
    memberCount: number; rebateTiers: RebateTier[] };
  export type NetworkRow = { member: MemberPart; network: NetworkPart; effective: number; delivered: number;
    admitted: boolean; saving: number; reason: string | null };
  export function effectiveCost(m: MemberPart): number;               // avgPrice × (1 + rejectRate)
  export function deliveredCost(n: NetworkPart): number;              // pooledPrice + distributorFee + freightPerUnit
  export function admits(m: MemberPart, n: NetworkPart): boolean;
  export function stayReason(m: MemberPart, n: NetworkPart): string | null; // null when admitted
  export function yearlySaving(m: MemberPart, n: NetworkPart): number;     // (effective − delivered) × yearlyQty, or 0
  export function networkRows(members: MemberPart[], network: NetworkPart[]): NetworkRow[]; // member order kept; members with no network record dropped
  export function networkSummary(rows: NetworkRow[]): { partCount: number; eligibleSpend: number;
    volumeMultiple: number; networkSpendAtYourPrices: number; saving: number; joining: number; staying: number };
  ```
- **`stayReason` copy, first match wins:**
  1. "Network lead time is longer than your current vendor's"
  2. "Network minimum order is above what you order now"
  3. If `pooledPrice + distributorFee < effective`: "Freight at your order size outweighs the pooled price"
  4. Otherwise: "The pooled price doesn't beat what you pay now"
- **`volumeMultiple`** = `networkSpendAtYourPrices / eligibleSpend`, where `networkSpendAtYourPrices = Σ networkYearlyQty × avgPrice`. This avoids summing canisters with cases.

- [ ] **Step 1: Write the failing tests** against `readData('network_member.json')` and `readData('network_synthetic.json')`:
  - `networkRows` returns 125 rows in member order.
  - Chainring Bolts (320) has `effective ≈ 47.4784 × 1.008`, and `delivered` equals the sum of its three parts.
  - Every admitted row has `delivered < effective` and `saving > 0`. Every staying row has `saving === 0` and a non-null reason.
  - `networkSummary`:
    - `eligibleSpend ≈ 136841` (±5)
    - `staying >= 2`
    - `joining + staying === 125`
    - `saving` equals the sum of the rows' savings
    - `volumeMultiple` between 15 and 40
  - Synthetic unit cases for `stayReason`, one per branch:
    - a network lead time above the member's gives the lead-time reason
    - `pooled + fee < effective < delivered` gives the freight reason
    - `pooled + fee >= effective` gives the "pooled price" reason
  - Review Focus 3: drop the last network record, and `networkRows` returns 124 rows with no NaN.
- [ ] **Step 2: Run them.** `npx vitest run src/lib/network.test.ts`. Expected: FAIL, "Failed to resolve import ./network".
- [ ] **Step 3: Implement** `network.ts` to the Interfaces block.
- [ ] **Step 4: Verify.** The file passes, then the full suite, build and oxlint.
- [ ] **Step 5: Commit** with "feat(network): admission test logic".

### Task 6: The Network page (`/network`)

**Files:**
- Create: `web/src/pages/Network.tsx`, `web/src/pages/Network.test.tsx`

**Interfaces:**
- Consumes: Task 5 exports, `PageHeader`-style header as in `MatchReview.tsx` (28px h1 + `Chip tone="caution"`), `StatRow`, `Stat`, `Panel`, `FilterChips`, `Chip`, `Disclosure`, `money()`.
- Produces:
  ```ts
  export type ResultFilter = 'all' | 'joins' | 'stays';
  export function NetworkView(props: { rows: NetworkRow[]; filter: ResultFilter; onFilter: (f: ResultFilter) => void;
    expanded: ReadonlySet<string>; onToggle: (id: string) => void; showAll: boolean; onShowAll: () => void;
    joined: boolean; onJoin: () => void; onUndo: () => void; highlightId?: string | null }): JSX.Element;
  export default function Network(): JSX.Element; // useJson both files; filter and ?part= in the URL; the rest in useState
  ```

**Layout, top to bottom:**
- **Header row:**
  - left: h1 "Buying network", the Illustrative chip, and the meta line
  - right: the **Join the pool** button
  - once joined: the opted-in message plus an **Undo** button instead. Focus moves Join → Undo → Join, as in Match review.
- **Three stats:**
  - "Your pool-eligible spend": `money(eligibleSpend)`, caption "a year across {partCount} fasteners and bearings"
  - "Network volume on these parts": `${volumeMultiple.toFixed(0)}× yours`, caption "synthetic network purchases, valued at your prices: {money(networkSpendAtYourPrices)} a year"
  - "Saving if you join": `money(saving)` in the savings tone, caption "a year, on {joining} of {partCount} parts that pass the test"
- **Panel "The admission test, part by part":**
  - FilterChips "All {n}" / "Joins the pool {joining}" / "Stays with current vendor {staying}" (Review Focus 1).
  - Rows filtered, top 10, then "Show all {n} parts".
  - **Each row:**
    - part link `/parts/:id`
    - family Chip
    - two volume bars: yours at `1/multiple` of the width, network at full width, with the caption "Network buys {multiple}× your volume"
    - "{unitMoney(effective)} → {unitMoney(delivered)} per {unit}" (`unitMoney()` from `lib/format.ts`)
    - the result Chip: `savings` tone "Joins the pool, saves {money(saving)}/yr", or `neutral` tone "Stays with current vendor" with `title={reason}`, and the reason also as visible small text
    - an expand button, `aria-expanded`, labeled "Cost breakdown"
  - **Expanded breakdown table**, every line per {unit}:
    - Pooled manufacturer price
    - Distributor fee
    - Freight at your order size
    - **Network delivered cost**
    - Your current effective cost (price + rejects)
    - Lead time and minimum order: "{n} days, {moq} {unit}", against yours
    - Rebate tiers: "Contract price now; quarterly rebate of 2% at {tier1} and 4% at {tier2} {unit}s a year of network volume (synthetic)"
  - **Panel footer:** the promise line.
- **Disclosure "What's shared and what stays private":** three lists, with the copy from spec section 1, Privacy:
  - Shared with suppliers
  - Known only to us
  - Stays with you
- **Disclosure "How these numbers are built":** a method note. Your figures are real AdventureWorks purchases per year over Apr 2022 to Sep 2025. Network figures are synthetic and seeded. Every price is per purchase unit (canister, container or case), because pieces per unit aren't in the data. Freight assumes one network delivery a month.
- **Footer:** "Nothing is saved. Joining is kept in this browser tab only."

- [ ] **Step 1: Write the failing tests** (`renderToStaticMarkup` + `MemoryRouter`, real rows):
  - The header shows "Buying network", "Illustrative" and the meta line. The default render has a "Join the pool" button and no "Opted in".
  - The stats show `money(summary.eligibleSpend)` (the `$136.8K` form) and "125 fasteners and bearings".
  - The default list renders exactly 10 rows. The first is Chainring Bolts, linking `/parts/320`, with "per canister" (Review Focus 2). It shows "Show all 125 parts".
  - `filter="stays"` renders at least 2 "Stays with current vendor" chips and none that say "Joins the pool, saves".
  - `expanded={new Set(['320'])}` renders "Pooled manufacturer price", "Network delivered cost" and "(synthetic)" for that row, with `aria-expanded="true"`.
  - `joined` renders the opted-in message and "Undo", and no Join button.
  - The promise line and both Disclosure titles are present.
- [ ] **Step 2: Run them.** `npx vitest run src/pages/Network.test.tsx`. Expected: FAIL on the import.
- [ ] **Step 3: Implement `NetworkView` and the default export.**
  - The default export shows `StatusMessage` while loading or on error, like Match review.
  - The filter goes in `?result=`. `?part=` sets `highlightId` (used in Task 10).
- [ ] **Step 4: Verify.** The file passes, then the full suite, build and oxlint.
- [ ] **Step 5: Commit** with "feat(network): buying network page with admission test".

### Task 7: Route and nav item

**Files:**
- Modify: `web/src/App.tsx` (route), `web/src/lib/nav.ts`, `web/src/lib/nav.test.ts`, `web/src/components/NavRail.tsx`, `web/src/components/shell.test.tsx`

**Interfaces:**
- `NavSection` gains `'network'`.
- `navSection('/network') === 'network'`.
- NavRail ITEMS gets `{ section: 'network', to: '/network', label: 'Buying network' }` after Vendors, with a simple network icon (three circles joined by lines).

- [ ] **Step 1: Write the failing tests.**
  - `nav.test.ts`: `navSection('/network')` is `'network'`.
  - `shell.test.tsx`: the nav labels in order are Product costs, Savings, Vendors, Buying network, Match review, and on `/network` the active item is "Buying network".
  - `App.test.tsx`: if it lists routes, `/network` renders "Buying network" (follow the existing pattern there).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the route `<Route path="/network" element={<Network />} />`, the nav section and the nav item.
- [ ] **Step 4: Verify.** The full suite, build and oxlint.
- [ ] **Step 5: Commit** with "feat(nav): Buying network after Vendors".

### Task 8: Confirm the Touring Rim screen and walk the two pitch moments (P0 E)

**Files:**
- Create: `docs/pitch/slide-6-touring-rim.png`, `docs/pitch/slide-9-network.png`

- [ ] **Step 1: Test the Touring Rim figures.** In `PartDetail.test.tsx`, add `it('Touring Rim matches the deck: $26.60, $39.20, 22 bikes, $346.5K')` with those four strings in the 513 render. If it passes first time, ledger "already true; pinned".
- [ ] **Step 2: Start the dev server** (`npm run dev`, in the background).
- [ ] **Step 3: Walk `/parts/513` and `/network` in Chrome at 1440 px wide.** Check the console has no errors. On `/network`:
  - click a row's expand
  - click the "Stays" chip
  - click Join, then Undo
  - reload, and confirm it is not joined
- [ ] **Step 4: Take the screenshots.** Use headless Chrome:

  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,1000 --virtual-time-budget=5000 --screenshot=docs/pitch/slide-6-touring-rim.png http://localhost:5173/parts/513
  ```

  Do the same for `/network`. Open each PNG with Read to check that it rendered the data, not a loading state.
- [ ] **Step 5: Commit** the test and the PNGs with "test+docs: Touring Rim deck figures; pitch screenshots".

### Task 9 (P1 F): Supplier view tab

**Files:**
- Modify: `data/build_network.py`, `data/check_outputs.py`, `web/public/data/network_synthetic.json`, `web/src/lib/network.ts` (+test), `web/src/pages/Network.tsx` (+test)

**Interfaces:**
- `NetworkPart` gains `forecast: { quarter: string; qty: number }[] | null`. It is null for parts not on a BOM.
- **`forecast` rules:**
  - Read `WorkOrder.csv` (col 1 ProductID, col 2 OrderQty, col 5 StartDate).
  - For each on-BOM pool part, quarterly consumption = Σ over `whereUsed` of `qtyPerUnit × WO qty` for that bike.
  - Forecast quarters are "Q4 2025", "Q1 2026", "Q2 2026" and "Q3 2026". Each takes its shape from the latest **complete** same calendar quarter in the work orders. Data runs 2022-06-02 to 2025-06-01, so those are Q4 2024, Q1 2025, Q2 2024 and Q3 2024.
  - `qty = networkYearlyQty × consumption_q / Σ of the four`, so the forecast is in purchase units.
  - Compute this after all random draws, without randomness, so the earlier draws and the Task 4 figures stay the same.
- **Network page:** the tabs "Your view" / "What suppliers see" set `?view=suppliers`. The supplier view has a part select, limited to the 7 on-BOM pool parts and defaulting to 320. It shows:
  - "Network yearly demand: {qty} {unit}s"
  - four forecast bars, labeled with their quarters
  - "Demand from {memberCount} manufacturers"
  - "Awarded to the lowest delivered cost. Every supplier pays the same fee on volume won."
  - "Fee: 2% (illustrative)"

  It shows no member names, prices or part numbers.

- [ ] **Step 1: Write the failing checks.**
  - **Checker:**
    - exactly the 7 on-BOM records have a 4-item forecast
    - the forecast qty sum equals `networkYearlyQty` ±0.05
    - the quarter labels are as listed
    - the Task 4 figures are unchanged
  - **Page test:** `view="suppliers"` shows "What suppliers see", "Demand from", "Q4 2025" and "2% (illustrative)", and does not contain "$47.48" (no member price).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, then regenerate the data.
- [ ] **Step 4: Verify.** The checker passes; the full suite, build and oxlint are clean.
- [ ] **Step 5: Commit** with "feat(network): supplier view with quarterly forecast".

### Task 10 (P1 G): Part page line linking to the pool

**Files:**
- Modify: `web/src/pages/PartDetail.tsx` (+test), `web/src/pages/Network.tsx` (+test)

**Interfaces:**
- `PartDetail`'s View takes an optional `networkRow?: NetworkRow`. The default export loads both network files with `useJson`, and builds the row when this part is in the pool.
- **Line under the vendor cards:**
  - "In the buying network: joins the pool, saves {money(saving)} a year", or
  - "In the buying network: stays with current vendor"

  Either way it links to `/network?part=:id`. It is labeled "Illustrative" in small caution text, because the figure is synthetic.
- **Network page:** with `highlightId` set, the filter is forced to `all`, `showAll` starts true if that row is past the top 10, the row starts expanded, and the row gets the highlight background used by SortableTable.

- [ ] **Step 1: Write the failing tests.**
  - The 320 render with its row shows "In the buying network" and `href="/network?part=320"`. Part 513 (not in the pool) shows no such line.
  - Review Focus 4: `NetworkView` with `highlightId` = the id of the 15th row (default state from the highlight helper) renders that row's breakdown and does not render "Show all".
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Put the initial-state derivation in a pure `initialNetworkState(rows, highlightId)` in `lib/network.ts`, returning `{ filter, showAll, expanded }`, and unit-test it too.
- [ ] **Step 4: Verify.** The full suite, build and oxlint.
- [ ] **Step 5: Commit** with "feat(parts): link pool-eligible parts to the buying network".

### Task 11: Final copy recheck, HANDOFF, final walk

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Rerun the Task 3 grep** on the new pages.
- [ ] **Step 2: Walk** every nav page in Chrome. Confirm the sample-data line shows on each and the console is clean. Retake the `/network` screenshot if Tasks 9 and 10 changed it.
- [ ] **Step 3: Update `HANDOFF.md`.**
  - The status row "Pitch demo (`SPEC_PITCH_DEMO.md`)".
  - A section covering the name, the sample-data line, the `FEATURES` flag, and `/network`:
    - its data files and script
    - the regenerate command
    - the tuned `SEED`, `W` and `FREIGHT_PER_DELIVERY`
    - the pass and fail counts
  - The data-vs-spec facts above (125 not 127, 7 not 8, canister not case).
  - **For Joe (spec 5.3):** the slide 9 numbers to use for Chainring Bolts:
    - real: 109 canisters a year
    - synthetic: the network yearly qty
  - The test count, and the spec reading order with `SPEC_PITCH_DEMO.md` added.
- [ ] **Step 4: Run every check.** Run the full checks (`npm test`, build, oxlint, `check_outputs.py`), then commit `HANDOFF.md` with "docs: handoff for the pitch demo".

Then the final whole-branch review on the most capable model, the fix pass, and finishing-a-development-branch.
