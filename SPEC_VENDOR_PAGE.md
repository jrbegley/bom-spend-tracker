# Spec addendum: vendor page

Date: 2026-11-14. Adds to `SPEC_REVISION_2.md`; read that first. Where they disagree, this file wins for vendor pages and the nav.

Visual reference: the Lovable concept's vendor page, https://id-preview--743943ad-0481-4423-8cf9-a38307cc517c.lovable.app/vendors/proseware (project https://lovable.dev/projects/743943ad-0481-4423-8cf9-a38307cc517c; files `src/components/spendline/vendor-parts.tsx` and `src/routes/vendors.proseware.tsx`). Port the look only, as in `SPEC_REVISION_2.md` section 10.1: this repo's stack, the tokens already ported in phase 5a, no new dependencies without asking, and no numbers from the concept's sample data.

## 1. Nav

Product costs, Savings, **Vendors**, Match review.

## 2. Vendor list (`/vendors`)

The existing `Vendors` page and `VendorTable`, restyled with the phase 5a components (plain header, `Panel`, filter chips, top rows with "Show all"). Every row links to `/vendors/:id`. Keep the `?highlight=:id` behavior. Vendor names on Part pages also link to `/vendors/:id`.

## 3. Vendor page (`/vendors/:id`)

Audience: procurement first, finance second. Procurement language (unit price, effective cost, reject rate, savings) with hover definitions.

**Header:** breadcrumb Vendors / name, title (vendor name), meta: parts supplied · product lines · units bought. No summary sentence.

**Three headline numbers:**
- Spend
- PPV, with "% above standard"
- "Lowest effective cost on N of M parts", with the caution chip when any part is flagged. Until warranty data exists (phase 5c), use "Lowest price on N of M parts".

**Primary visual: "Parts from this vendor."** One row per part the vendor supplies. Each row compares every vendor of that part:
- Stacked bar per vendor: unit price + reject cost (reject rate x price) + warranty cost (failure rate x cost per claim). This vendor's bar is highlighted; the others are muted.
- "Lowest effective cost" chip on the winner.
- "Cheapest price, higher total cost" flag when this vendor has the lowest price but not the lowest effective cost.
- When this vendor is not the lowest, one line under the row: "Moving this vendor's N units to <winner> saves $X."
- Row meta: part name (links to `/parts/:id`), bikes using it, vendor count.
- Before phase 5c, bars are unit price + reject cost only, and the flag and saving lines are hidden.

**Collapsed by default:**
- Quality: reject rate per part; failure rate with sample size once warranty data exists, with the note "Failure rates count only units at least N months in the field" (N from Assumptions).
- Spend by part: spend, PPV, units bought.

**Interactions:** each effective cost opens the lineage panel with the calculation in plain words, for example "Effective cost = $46.06 unit price + $0.23 reject cost (0.5% of price) + $3.12 expected warranty (6.0% failure x $52 per claim)". The Assumptions drawer works on this page.

## 4. Data

Everything comes from `parts.json` and `vendors.json`; no new pipeline output is needed before 5c.
- Parts for a vendor: every part in `parts.json` whose `vendors` list includes the vendor ID.
- Unit price per vendor: `avgPrice`. Reject rate: `rejectedQty / receivedQty` for that vendor on that part.
- Spend, PPV, units: the vendor's entry for that part (`spend`, `ppv`, `qty`).
- Header totals: `vendors.json` (`spend`, `ppv`, `lines`, `partsSupplied`).
- Put the per-vendor, per-part logic in a pure, tested function in `web/src/lib/` (for example `vendorParts.ts`), like `vendorsForParts.ts`.

## 5. Edge cases

- **Single-source part:** show only this vendor with a "Single source" chip. No comparison, no flag.
- **Vendor that supplies only non-BOM items** (`lines` empty): meta says "Not on a BOM"; the parts list still shows the items, with no bikes count.
- **Many parts** (for example Custom Frames, Inc. with 14): show the top 5 by spend, with "Show all".
- **Vendor with zero PPV or negative PPV:** show the value as is, with no "% above standard" note when PPV is 0 or below.

## 6. Acceptance

- `/vendors/1678` (Proseware, Inc.) lists LL, ML and HL Crankarm with prices $27.06, $33.58, $46.06 and Vision Cycles, Inc. at $29.58, $36.10, $48.58; HL Crankarm also shows West Junction Cycles at $46.42.
- Header shows spend $2.35M and PPV $111.8K for Proseware, Inc.
- A single-source vendor page (for example Superior Bicycles, `/vendors/1576`) shows the "Single source" chip and no comparison.
- Every vendor row on `/vendors` and every vendor name on a Part page opens its vendor page.
- `npm test`, `npm run build` and `npx oxlint src` are clean.

## 7. Prompt for Claude Code

Paste this from the repo root:

> Read `SPEC_VENDOR_PAGE.md` and build it on top of phase 5a. Write a short plan in `docs/superpowers/plans/` first, then build test-first: the pure vendor-parts logic in `web/src/lib/` with tests against the real pipeline JSON, then the restyled `/vendors` list, then `/vendors/:id`, then the nav and the vendor links on Part pages. Use the phase 5a components and tokens; no new dependencies without asking me. Stop when section 6 passes and show me the pages.
