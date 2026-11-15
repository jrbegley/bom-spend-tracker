# Pitch Demo Update: Common Thread

Written 2026-11-14, evening. Pulls together tonight's chats (network and revenue model, pitch rebuild, name) and the project docs (`network-and-business-model.md`, `pitch-plan.md`, `product-design-decisions.md`). Drop this file in the repo root next to `HANDOFF.md`. **For the demo, it wins wherever it disagrees with `SPEC_REVISION_2.md`.** Phases 5b and 5c stay blocked and are out of scope here.

Repo state this plan starts from: `main` at `ba54a0d` (match review feedback merged, 193 tests passing).

---

## 1. What we decided tonight

**Name.** Spendline is now Common Thread.

**Story arc (three steps).**
1. Match the data: one standard record per part links engineering and purchasing.
2. Day-one value: true cost per product and in-house savings from one company's own data (Touring Rim, $346.5K).
3. The network: once many manufacturers map to the same standard, they buy standard parts together. This is the headline.

**Pooled buying.**
- Asset-light, like a hospital buying group. We negotiate the contract price; members keep their current distributor, who ships at the network price. We hold no inventory and run no trucks.
- Admission test per part: network delivered cost = pooled manufacturer price + distributor fee + freight at the member's real order sizes. A part joins only if that (plus lead time and minimum order quantity) beats the member's current effective cost.
- Promise: nobody pays more. A part moves into the pool only when it saves money.
- Volume risk: members pay the contract price, then get a quarterly rebate once network volume reaches each tier.
- Start narrow: one region, fasteners, bearings, seals and connectors, so 10 to 20 early members add up to real volume on the same parts.

**Privacy.**
- Shared with suppliers: total volume per standard part and a forecast built from members' BOMs and planned builds. Suppliers never see which companies make up the total.
- Known only to us: each member's own volume (needed to split orders and rebates).
- Stays with the member: prices, custom parts, part numbers. The admission test runs in the member's private environment. Pooling is opt-in.

**Revenue.**
- Manufacturers pay a subscription for the mapping and cost tool. This keeps the system running.
- Suppliers pay a fee on volume they win through the network, at the same rate for every supplier. Awards still go by the delivered-cost test, so a supplier can't buy its way in.
- Why suppliers pay: volume they can't win one small order at a time, and demand they can see months ahead (less safety stock, fewer quotes, less dead inventory).
- Founding members get year one free in exchange for opting into the pool and confirming matches in the review queue. Their reviewed matches are the training data.
- Outside funding covers costs until fees and subscriptions start, around year two.
- Kept out of the pitch: duty drawback, warranty chargebacks, overpayment recovery, PE diligence, inventory financing.

**Proof that buying groups work (feasibility slide).** 98% of U.S. hospitals buy through a group purchasing organization; members average 13.1% savings on supply costs; suppliers typically pay the group up to 3% of sales. Source is the Healthcare Supply Chain Association, so expect "the industry grading itself" in Q&A.

**Honesty rules.**
- AdventureWorks is Microsoft's sample ERP dataset for a fictional mid-size bike maker. The numbers are real calculations on it; no real company saved this money. Say so on screen and out loud.
- The matcher is a design. The dataset already links PO lines to parts by ID.
- The HL Crankarm warranty flip is dropped because there is no warranty data. Use it as the example of claiming only what the data supports.

---

## 2. Where the app shows up in the 4-minute pitch

The deck stays the spine. The app appears twice, live, about 20 seconds each, with a screenshot of the same screen in the deck as a fallback.

| Deck slide | App moment | What the judge sees |
|---|---|---|
| 6, The product | Touring Rim part page `/parts/513` | Two vendors at $26.60 and $39.20, 22 bikes, $346.5K saving, sample-data label visible |
| 9, Join the pool | New Network page `/network` | Your volume vs network volume, which parts pass the delivered-cost test, the Join button |

Keep the full walkthrough (Product costs, bridge, Touring Rim, Vendors, Match review, Network) ready for Q&A and for judges who come to the table.

---

## 3. Changes, by priority

### P0: must have before the pitch

**A. Rename to Common Thread.**
- `web/src/components/NavRail.tsx` wordmark, `web/index.html` `<title>`, `web/src/components/shell.test.tsx` assertion.
- Update the "Spendline" mentions in `HANDOFF.md` and `README.md`.

**B. Label the sample data on every page.**
- Add a quiet line in the top bar (left of the controls): "Sample data: AdventureWorks, Microsoft's demo ERP for a fictional bike maker". Hover gives one more sentence: figures are real calculations on that dataset.
- Search the app copy for any wording that implies a real company. None found in a quick check; recheck after the Network page lands.

**C. Clear dead controls for the demo.**
- Hide the disabled "All years" select and "Assumptions" button in `AppShell.tsx` (both wait on 5c). A disabled button invites "does that work?" during a live demo. Keep the code behind a flag so 5c can turn them back on.

**D. Build the Network page.** Full spec in section 4.

**E. Confirm the Touring Rim screen.**
- Check `/parts/513` shows $26.60, $39.20, 22 bikes and $346,500 exactly as the deck says. Take the screenshot for slide 6 at 1440 px wide.

### P1: if time allows

**F. Supplier view tab on the Network page.** Section 4.4. This demos both reasons suppliers pay.

**G. Link standard parts to the pool.** On the Part page for a pool-eligible part (fasteners, bearings), add one line under the vendor cards: "In the buying network: joins the pool, saves $X a year" or "Stays with current vendor", linking to that row on `/network`. Ties the day-one story to the network story.

### Out of scope tonight
- Phases 5b and 5c (fiscal years, assumptions panel, warranty, effective cost with warranty).
- Actions inbox, cash back, drawback.
- Any real matching code.

---

## 4. Network page spec

Route `/network`, nav label **Buying network**, placed after Vendors. Same layout rules as every other page: plain title and meta line, at most three headline numbers, one primary visual, detail revealed on click. Carries the **Illustrative** chip, like Match review.

### 4.1 Header
- Title: Buying network
- Meta line: "Concept. Your volumes come from the sample data; network figures are synthetic."

### 4.2 Three headline numbers
1. **Your pool-eligible spend:** $137K a year across 127 fasteners and bearings (real, from the sample data).
2. **Network volume on these parts:** total network purchase volume, shown as a multiple of yours (synthetic).
3. **Saving if you join:** sum of yearly savings on parts that pass the admission test (computed from synthetic network prices).

### 4.3 Primary visual: the admission test, part by part
A ranked list of the member's pool-eligible parts, biggest yearly spend first, top 10 then "Show all".

Each row:
- Part name (links to the Part page) and family chip (Fastener, Bearing).
- Volume bar: your yearly volume next to the network's, with the ratio ("Network buys 24x your volume").
- Your cost per unit vs network delivered cost per unit.
- Result chip: **Joins the pool, saves $X/yr** (savings color) or **Stays with current vendor** (neutral), with the reason in hover ("Freight at your order size outweighs the pooled price").

Click a row to expand the delivered-cost breakdown (example values for Chainring Bolts, per purchase unit, synthetic):

| Line | Example |
|---|---|
| Pooled manufacturer price | $38.00 per case |
| Distributor fee | $1.52 |
| Freight at your order size | $1.20 |
| **Network delivered cost** | **$40.72** |
| Your current effective cost (price + rejects) | $48.90 |
| Lead time and minimum order | 3 weeks, 1 case |
| Rebate tiers | Contract price now; quarterly rebate of 2% and 4% at two network volume tiers (synthetic) |

Below the list, one line in plain text: "Nobody pays more. A part moves into the pool only when it saves money."

At least two rows must fail the test. That's the proof the promise is real, and judges will look for it.

### 4.4 Supplier view (P1, a second tab: "What suppliers see")
For one selected part (default Chainring Bolts):
- Network yearly demand and a quarterly forecast for the next four quarters. Build it from members' BOMs x planned builds; for the sample, use AdventureWorks quarterly builds from work orders, scaled by the synthetic network multiple.
- Member count only ("Demand from 14 manufacturers"), never names, prices or part numbers.
- Award rule: "Awarded to the lowest delivered cost. Every supplier pays the same fee on volume won." Fee shown as 2% (illustrative).

### 4.5 Privacy and joining
- Collapsed panel "What's shared and what stays private": the three lists from section 1, Privacy.
- **Join the pool** button at the top right. Page state only, like Match review. After clicking: "Opted in. Pooled volumes are shared; your prices and part numbers stay private." with **Undo**. Footer note: nothing is saved.

### 4.6 What stays off this page
Revenue for the company, founding-member terms, outside funding. Those live in the deck and Q&A.

---

## 5. Data for the Network page

### 5.1 Real, from the pipeline (`data/build_data.py`)
- Pool-eligible parts: names matching Bolt, Nut, Washer, Bearing, Lock washer. Today that's 127 parts, $472K over the dataset period (Apr 2022 to Sep 2025), about $137K a year. Only 8 of them sit on a BOM; the rest are bought with no BOM link.
- Yearly purchase volume and average price per purchase unit, from PO lines (`receivedQty`, spend).
- Reject rate per part from `rejectedQty / receivedQty`, for effective cost.
- **Unit of measure check:** Chainring Bolts are bought about 109 units a year at about $47 each, so the purchase unit is clearly a case or box. Pull `Purchasing.ProductVendor.UnitMeasureCode` into the pipeline and show the unit on screen ("cases"). Where a pieces-per-case figure can't be found, keep everything in purchase units and say so in the method note. Do not mix per-case and per-piece numbers on the same row.
- Emit `web/public/data/network_member.json` (per part: id, name, family, yearly qty, unit, avg price, reject rate, yearly spend, onBom).

### 5.2 Synthetic, generated and tagged
- Script `data/build_network.py`, fixed random seed, writes `web/public/data/network_synthetic.json`. Every record carries `"synthetic": true`.
- Per part:
  - network yearly qty = member qty x a multiple drawn from 15x to 40x
  - pooled manufacturer price = member avg price x (1 - a volume discount of 12% to 24%, larger for bigger network volume)
  - distributor fee = 4% of pooled price
  - freight per unit: high for parts the member buys in small lots, so the smallest-volume parts fail the test
  - lead time, minimum order quantity, two rebate tiers
  - member count 10 to 20
- Tune the seed so the average pooled price is about 18% under member cost on parts that pass (matches the "18% lower" on the deck) and at least two parts fail.
- Logic in `web/src/lib/network.ts`: `deliveredCost`, `admits`, `yearlySaving`, `networkSummary`. Tested against the real member JSON and the synthetic file.

### 5.3 Align the deck to the app (decision for Joe)
Slide 9 says "You buy 40K of this screw a year. The network buys 2.1M." AdventureWorks has no screws. Recommended: switch the slide to Chainring Bolts, using the real member volume from the app and the synthetic network total, so the slide and the live screen show the same numbers.

---

## 6. Acceptance checks
- App name reads Common Thread everywhere; no "Spendline" left in `web/` (tests updated).
- Every page shows the sample-data line.
- `/network` loads with three headline numbers, the ranked list, at least two "Stays with current vendor" rows, and a working expand on each row.
- Every synthetic number on screen sits on a page marked Illustrative, and the data file tags each record synthetic.
- Join the pool toggles and undoes; nothing persists after reload.
- Touring Rim page matches the deck exactly.
- `npm test`, `npm run build`, `npx oxlint src` clean; `python3 data/check_outputs.py web/public/data` passes with the new files added to its checks.
- Walk the two pitch moments in the browser at 1440 px with no console errors; take both screenshots for the deck.

---

## 7. Open items
- Where the demo runs: local `npm run dev` or a deployed link. If deployed, redeploy after merge and test on the presenting laptop.
- Who drives the app during the pitch while someone else talks.
- Judging rubric on Devpost; if it rewards a live product, give the app moments more time and cut from the network slides.
- Deck slide 9 numbers (5.3).

---

## 8. Kickoff prompt for Claude Code

> Read `HANDOFF.md`, then `SPEC_PITCH_DEMO.md`. For this work, `SPEC_PITCH_DEMO.md` wins over `SPEC_REVISION_2.md`. Do the P0 items in order (A rename, B sample-data label, C hide dead controls, D Network page with the data in section 5, E Touring Rim check). Write a plan in `docs/superpowers/plans/` first, keep tests green after each step, and walk `/parts/513` and `/network` in the browser at the end. Then do P1 if time allows. Update `HANDOFF.md` when done.
