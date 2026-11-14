# Match Review Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give reviewers the full feedback workflow on the Match review page:
- confirm the top match
- pick another candidate, or search for any part
- mark "Not a BOM part", or send the line to manual matching
- give a reason for any override
- see a running feedback summary

All of it lives in page state. Nothing is saved or exported (the user's call).

**Architecture:** The decision model, outcome classification, feedback summary and part search are pure functions in `lib/matchReview.ts` and `lib/search.ts`, tested against the real JSON. The correction editor is a controlled component, so tests can server-render any draft state. Cards own their draft in `useState`.

**Tech Stack:** React 18 · TypeScript · Tailwind v4 · Vitest. No new dependencies.

**Spec:** `BUILD_SPEC.md` section 7.7 (Match review is a labeled concept screen, with the "Illustrative" badge), and `SPEC_REVISION_2.md` section 4.5 (Match review unchanged in scope). The user asked on 2026-11-14 for working feedback functionality with no persistence.

## Global Constraints

- **Concept stays labeled:** keep the "Illustrative" badge. A visible note says decisions stay in this browser tab and aren't saved.
- **Sample lines:** the six lines in `match_examples.json` stay as they are. Search covers only real parts from `parts.json`.
- **Visual:** use the 5a primitives (`PageHeader`, `Panel`, `Chip`) and tokens.
- **Checks:** `npm test`, `npm run build` and `npx oxlint src` are clean.

## Review Focus

1. **Line m6, whose top candidate is "Not a BOM part":** accepting the top match counts as *confirmed*. Choosing "Not a BOM part" in the editor also counts as confirmed, not as a correction. Test in Task 1.
2. **Picking, through search, a part that is already a candidate:** it's recorded as that candidate, *confirmed* if it was the top one and *corrected* otherwise. A search pick doesn't double-count. Test in Task 1.
3. **Confirm is disabled until the draft is complete:** a choice is made, and for "Search" a part is picked. A search under 2 characters shows no results, and a search with no matches says "No parts match". Tests in Tasks 1 and 2.
4. **Undo after a correction** returns the line to pending, with the editor closed and no stale reasons in the summary. Test in Task 1 (summary) and Task 2 (card).
5. **Confidence bands for override rates:** High ≥ 80%, Medium 60–79%, Low < 60%. The m5 line (48%) is Low. Test in Task 1.

## Decisions (flag at handoff)

- **M1: Card actions.** Each card has one-click **Accept** (top match) and **Correct…**. Correct… opens an editor with these choices:
  - candidate #2 or #3
  - "Search all parts"
  - "Not a BOM part"
  - "No match · send to manual matching"

  Plus optional reason chips, then **Confirm** and **Cancel**.
- **M2: Reason chips.**
  - Wrong size or variant
  - Unit of measure mismatch
  - Vendor uses a different name
  - Wrong part family
  - Price looks wrong
- **M3: Feedback summary** (a new Panel under "How matching works"):
  - counts of Confirmed, Corrected and Sent to manual
  - an override rate per confidence band
  - the reasons used, most common first
- **M4: Not saved.** The panel footer says: "Kept in this browser tab only. A real deployment would store each decision as a training and evaluation example."

---

### Task 1: Decision model, summary, part search (`lib/`)

**Files:** modify `web/src/lib/matchReview.ts` (+test) and `web/src/lib/search.ts` (+test).

**Interfaces:**
- `export const REASONS = ['Wrong size or variant', 'Unit of measure mismatch', 'Vendor uses a different name', 'Wrong part family', 'Price looks wrong'] as const`
- `type Choice = { kind: 'candidate'; rank: number } | { kind: 'part'; partId: string; partName: string } | { kind: 'not_bom' } | { kind: 'manual' }`
- `type Decision = { choice: Choice; reasons: string[] }` and `type Decisions = Record<string, Decision>`. `decide(decisions, id, decision | null)` keeps its behavior.
- `type Outcome = 'confirmed' | 'corrected' | 'manual'`
- `resolve(example: MatchExample, choice: Choice): { outcome: Outcome; partName: string | null }`:
  - candidate rank 1 gives `confirmed`, and other ranks give `corrected`
  - a part pick equal to candidate rank r becomes that candidate
  - any other part pick gives `corrected`
  - `not_bom` gives `confirmed` when candidate 1 is `NOT_A_BOM_PART`, otherwise `corrected`, with `partName` `NOT_A_BOM_PART`
  - `manual` gives `manual` with `partName` null
- `band(confidence: number): 'High' | 'Medium' | 'Low'` (≥ 0.8, ≥ 0.6, else).
- `feedbackSummary(examples, decisions): { confirmed: number; corrected: number; manual: number; bands: { band: 'High' | 'Medium' | 'Low'; reviewed: number; overridden: number }[]; reasons: { reason: string; count: number }[] }`:
  - "overridden" means the outcome is not `confirmed`
  - `bands` are always listed in the order High, Medium, Low
  - `reasons` is sorted by count desc, then name
- `reviewProgress` is unchanged.
- In `search.ts`: `searchParts(parts: Record<string, Part>, query: string, limit = 6): { id: string; name: string }[]`. It matches the trimmed query (≥ 2 characters) case-insensitively, with prefix matches first and then by name.

- [ ] **Step 1: Failing tests**

```ts
// matchReview.test.ts (replace the old decide test; keep the data tests)
const ex = readData<MatchExample[]>('match_examples.json'); const byId = Object.fromEntries(ex.map(e => [e.id, e]));
it('resolve', () => {
  expect(resolve(byId.m1, { kind: 'candidate', rank: 1 })).toEqual({ outcome: 'confirmed', partName: 'Touring Rim' });
  expect(resolve(byId.m5, { kind: 'candidate', rank: 2 })).toEqual({ outcome: 'corrected', partName: 'ML Crankarm' });
  expect(resolve(byId.m5, { kind: 'part', partId: '319', partName: 'HL Crankarm' })).toEqual({ outcome: 'confirmed', partName: 'HL Crankarm' });
  expect(resolve(byId.m5, { kind: 'part', partId: '320', partName: 'Chainring Bolts' })).toEqual({ outcome: 'corrected', partName: 'Chainring Bolts' });
  expect(resolve(byId.m6, { kind: 'not_bom' }).outcome).toBe('confirmed'); expect(resolve(byId.m1, { kind: 'not_bom' }).outcome).toBe('corrected');
  expect(resolve(byId.m2, { kind: 'manual' })).toEqual({ outcome: 'manual', partName: null });
});
it('band', () => { expect([band(0.91), band(0.79), band(0.6), band(0.48)]).toEqual(['High', 'Medium', 'Medium', 'Low']); });
it('feedbackSummary', () => {
  let d: Decisions = {};
  d = decide(d, 'm1', { choice: { kind: 'candidate', rank: 1 }, reasons: [] });
  d = decide(d, 'm5', { choice: { kind: 'candidate', rank: 2 }, reasons: ['Wrong size or variant'] });
  d = decide(d, 'm2', { choice: { kind: 'manual' }, reasons: ['Unit of measure mismatch', 'Wrong size or variant'] });
  const s = feedbackSummary(ex, d);
  expect(s).toMatchObject({ confirmed: 1, corrected: 1, manual: 1 });
  expect(s.bands).toEqual([{ band: 'High', reviewed: 2, overridden: 1 }, { band: 'Medium', reviewed: 0, overridden: 0 }, { band: 'Low', reviewed: 1, overridden: 1 }]);
  expect(s.reasons).toEqual([{ reason: 'Wrong size or variant', count: 2 }, { reason: 'Unit of measure mismatch', count: 1 }]);
  expect(feedbackSummary(ex, decide(d, 'm5', null)).reasons).toEqual([{ reason: 'Unit of measure mismatch', count: 1 }, { reason: 'Wrong size or variant', count: 1 }]);
});
// search.test.ts (append)
it('searchParts', () => {
  expect(searchParts(parts, 'c')).toEqual([]);
  expect(searchParts(parts, ' crank ').map(p => p.name).slice(0, 3)).toEqual(['HL Crankarm', 'HL Crankset', 'LL Crankarm']);
  expect(searchParts(parts, 'zzzz')).toEqual([]); expect(searchParts(parts, 'nut').length).toBeLessThanOrEqual(6);
});
```

The expected order in `searchParts(' crank ')` is checked against the data in Step 2. If the real order differs, fix the expectation and record a ruling: the order rule is what's pinned, not these names.

- [ ] **Step 2:** `npm test -- matchReview search`. Expected: FAIL (missing exports). **Step 3:** Implement. **Step 4:** `npm test && npx oxlint src`. Expected: green. **Step 5:** Commit `feat(match): decision model, outcomes, feedback summary, part search`.

---

### Task 2: Match review UI

**Files:** modify `web/src/pages/MatchReview.tsx` (+ `MatchReview.test.tsx`). Create `web/src/components/CorrectionEditor.tsx`.

**Interfaces:**
- `type Draft = { choice: Choice | null; query: string; reasons: string[] }`
- `CorrectionEditor({ example, parts, draft, onChange, onConfirm, onCancel })` is a controlled component:
  - a radiogroup (`role="radiogroup"`, `aria-label="Correct the match"`) with real `<input type="radio">` options:
    - each candidate except #1, labeled `{name} · {pct}`
    - `Search all parts`
    - `Not a BOM part`, omitted when candidate #1 is already that
    - `No match · send to manual matching`
  - when the choice is Search: a text input (`aria-label="Search parts"`). It lists up to 6 `searchParts` results as buttons; the picked one gets `aria-pressed="true"` and becomes the choice. Show `No parts match` when the query has 2+ characters and nothing matches.
  - reason chips: toggle buttons with `aria-pressed`, one per `REASONS`
  - `Confirm` (disabled unless the choice is set and, for Search, a part is picked) and `Cancel`
- `PendingCard`:
  - restyled, with the candidate bars kept
  - `Accept`: records rank 1, no reasons
  - `Correct…`: opens the editor with an empty draft
  - Cancel closes the editor and clears the draft
- `DecidedCard` shows `resolve()`:
  - `Confirmed · {partName}` in savings ink
  - `Corrected · {partName} (was {top name})` in caution
  - `Sent to manual matching` in muted text
  - then the reasons as small chips, and `Undo`
- `FeedbackSummary({ examples, decisions })`, a Panel titled `This session's feedback`:
  - three numbers: Confirmed, Corrected, Sent to manual
  - band rows: `High (≥80%)`, `Medium (60–79%)` and `Low (<60%)`, each reading `{overridden} of {reviewed} overridden`, or `none reviewed`
  - reasons with counts, or `No reasons given yet`
  - footer per M4
- Page: `PageHeader` (title `Match review`), with the `Illustrative` chip kept (caution tone) and the subtitle unchanged. The queue is on the left. "How matching works" and the FeedbackSummary are on the right.

- [ ] **Step 1: Failing tests** (`MatchReview.test.tsx`, updated on purpose for the new decision shape):
  - six pending cards, each with `Accept` and `Correct…`
  - Decided cards:
    - m1 `{rank 1}`: `Confirmed · Touring Rim`
    - m5 `{rank 2, ['Wrong size or variant']}`: `Corrected · ML Crankarm (was HL Crankarm)` and `Wrong size or variant`
    - m2 manual: `Sent to manual matching`
    - each has `Undo`
  - Editor, rendered directly:
    - empty draft on m5: a `radiogroup` with `ML Crankarm · 39%`, `LL Crankarm · 13%`, `Search all parts`, `Not a BOM part`, `No match · send to manual matching`; `Confirm` `disabled`; five reason chips with `aria-pressed="false"`
    - m6: no `Not a BOM part` radio
    - draft `{choice: part search pending, query: 'crank'}`: shows `HL Crankarm` as a button, with `Confirm` still disabled until a part is picked
    - query `'zz'`: `No parts match`
    - query `'c'`: no result list
  - FeedbackSummary with the Task 1 decisions: `1` confirmed, `1` corrected, `1` sent to manual, `2 of 3 overridden` split as `High (≥80%) 1 of 2 overridden` and `Low (<60%) 1 of 1 overridden`, then `Wrong size or variant` 2, plus the not-saved footer
  - the Illustrative badge and the loading and error tests are kept
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** `npm test && npm run build && npx oxlint src`. Expected: green. **Step 5:** Commit `feat(match): correct a match, reasons, and a session feedback summary`.

---

### Task 3: Browser walkthrough and stop

- [ ] Run `npm run dev` and go to `/match-review`:
  1. Accept m1.
  2. Correct m5 to ML Crankarm, with a reason.
  3. Correct m3 through search to "HL Nipple".
  4. Mark m4 as Not a BOM part.
  5. Send m2 to manual matching.
  6. Accept m6.
  7. Undo m5.

  Check that the summary updates at each step, that Cancel clears the draft, and that there are no console errors. Tab through one editor to check keyboard behavior: radios, chips, Confirm.
- [ ] Phase exit: `cd web && npm test && npm run build && npx oxlint src`. **Stop and show the page.**
