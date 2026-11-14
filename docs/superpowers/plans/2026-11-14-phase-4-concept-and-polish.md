# Spendline Phase 4 (Concept Screen and Polish) Implementation Plan

> **For agentic workers:** execute task by task, test-first, one commit per task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish spec phase 4:
- the Match review concept screen (spec 7.7) and its hand-written `match_examples.json`
- empty, loading and error states
- focus states
- a README with the run commands and the method summary from spec 4.3

It also closes the deferred minors from phases 2 and 3 listed in `HANDOFF.md`.

**Architecture:** same as phases 2 and 3.
- `MatchReview.tsx` splits into a pure `MatchReviewView` (examples + decisions + callbacks as props) and a thin default export that loads `match_examples.json` with `useJson` and owns the decisions in local state.
- New pure logic, unit tested:
  - `lib/matchReview.ts`: the `MatchExample` type, `decide()` (decision map update), `reviewProgress()`
  - `lib/search.ts`: `nextActive()` (combobox arrow-key movement)
  - `lib/sort.ts`: `syncPageState()` replaces `effectivePage()`
  - `lib/scroll.ts`: `shouldScrollTop()`
- A data test checks `match_examples.json` against `parts.json` and `unmapped.json`.
- Clicks, keyboard and scrolling are checked by hand in the browser.

**Tech stack:** unchanged. No new libraries. No DOM test runner (adding jsdom needs the team's OK, see D15).

**Spec:** `BUILD_SPEC.md` sections 5.5, 7.7, 9 (phase 4), 10.

## Global Constraints

- Everything in the earlier plans' Global Constraints still applies.
- Match review (spec 7.7):
  - header with an amber "Illustrative" chip and the subtitle "How new spend lines would be matched to BOM parts. Sample lines are hand-written; the dataset already links parts by ID."
  - left (2fr): 6 cards. Each shows raw description, vendor, unit of measure, unit price, then the top 3 candidates with a confidence bar and percentage, then Accept and Reject buttons. Decisions live in local state only. Accepted cards collapse with a check.
  - right (1fr): card "How matching works", 5 plain boxes in a vertical flow, then "Runs on a local model so supplier prices never leave the company."
- `match_examples.json` (hand-written, never produced by the pipeline):
  - real part names, ids and vendors from `parts.json`; each vendor really supplies the top candidate
  - exactly one line whose top candidate is under 60%
  - one resale item from `unmapped.json` whose top candidate is "Not a BOM part" (no `partId`)
  - candidates sorted by confidence, highest first, each in 0..1
- Keyboard: every interactive element is a real `<button>`, `<a>` or `<input>`; the global 2px accent `:focus-visible` ring applies everywhere.

## Decisions to confirm

- **D12: Rejected cards collapse too**, showing "Rejected · sent to manual matching". Both collapsed states have an Undo button so the demo can be reset without a reload. The spec only describes the accepted state.
- **D13: A progress line** "2 of 6 reviewed" above the queue. It is computed from local state only.
- **D14: Scroll-to-top** runs on PUSH and REPLACE navigations when the path changes. Back/Forward (POP) and query-only changes (`?line=`, `?highlight=` on the same page) keep the scroll position.
- **D15: No jsdom.** The highlight scroll/fade and page-restore effects stay hand-checked. The page-restore fix moves into the pure `syncPageState()`, which is unit tested.
- **D16: `?highlight=` is dropped from the URL** (replace, not push) the first time the Vendors filter changes. The highlight is a one-time jump; it should not re-run when the filter is cleared.

## Review Focus

1. Match data integrity (Task 1): ids exist, names match `parts.json`, the vendor supplies the top part, one low-confidence line, one resale line.
2. Decisions: accept, reject and undo on one card leave the other cards alone (Task 2).
3. Search arrow keys: ArrowDown while closed opens on the first result, ArrowUp while closed opens on the last (Task 4).
4. Filter page restore: page 3 under filter "a", then "ab", then back to "a" shows page 1 (Task 4).
5. Scroll reset never runs after the Vendors highlight jump (ScrollToTop sits before `<Routes>`, so its effect runs first).

---

## File map

```
web/public/data/match_examples.json                      hand-written sample lines             Task 1
web/src/lib/matchReview.ts (+test)                        types, decide, reviewProgress, data   Task 1-2
web/src/pages/MatchReview.tsx (+test)                     View + default export                 Task 2
web/src/components/StatusMessage.tsx                      Loading / error message               Task 3
web/src/components/SortableTable.tsx                      empty row, syncPageState              Task 3-4
web/src/lib/data.ts, pages/LevelPage.tsx                  use StatusMessage                     Task 3
web/src/lib/search.ts (+test), components/GlobalSearch.tsx  nextActive, aria fixes             Task 4
web/src/lib/sort.ts (+test)                               syncPageState                         Task 4
web/src/components/LinePpvCard.tsx                        no div inside button                  Task 4
web/src/pages/Vendors.tsx                                 drop ?highlight on filter             Task 4
web/src/lib/scroll.ts (+test), App.tsx                    ScrollToTop                           Task 4
web/src/index.css                                         focus ring polish                     Task 3
README.md                                                 run commands, method                  Task 5
HANDOFF.md                                                status                                Task 5
```

## Task 1: match_examples.json and its data test

- [ ] Write `lib/matchReview.test.ts` data checks against `readData('match_examples.json')`, `parts.json`, `unmapped.json`: 6 entries with unique ids; uom and price present; 3 candidates sorted desc in 0..1; every candidate `partId` exists with the same name; the top candidate's part is supplied by the line's vendor (except the resale line, whose vendor supplies the unmapped part named in `sourcePartId`); exactly one top candidate under 0.6; exactly one top candidate named "Not a BOM part" without a `partId`.
- [ ] Write the JSON: Touring Rim (Premier Sport, $39.20), Bearing Ball (Wood Fitness, CTN, $41.92), Spokes (International Sport Assoc.), Chainring Bolts (Bike Satellite Inc.), a low-confidence crankarm line (Proseware, Inc., HL 48% / ML 39% / LL 13%), and a jersey from Integrated Sport Products (Short-Sleeve Classic Jersey, M, part 882).
- [ ] `npm test`, commit.

## Task 2: Match review screen

- [ ] Tests first for `decide()` (set, overwrite, undo with null, other ids untouched) and `reviewProgress()`.
- [ ] Tests for `MatchReviewView` HTML: h1 "Match review", the "Illustrative" chip, subtitle, 6 raw descriptions, `91%` for the rim, Accept/Reject buttons, the 5 steps in order, the local-model line; an accepted card shows "Accepted" and the chosen part and no Accept button; a rejected card shows "Rejected"; progress line.
- [ ] Implement, then the default export with `useJson('match_examples.json')` and `StatusMessage` for loading/error.
- [ ] Commit.

## Task 3: Empty, loading and focus states

- [ ] `StatusMessage` (`role="status"` for loading, `role="alert"` for errors). Use in DataProvider, LevelPage, MatchReview.
- [ ] `SortableTable` renders one full-width "Nothing to show" row when `rows` is empty (test).
- [ ] Focus: keep the global `:focus-visible` ring; add `outline-offset: -2px` for focusable rows inside `overflow` wrappers that would clip the ring (table header buttons, search options do not take focus).
- [ ] Commit.

## Task 4: Deferred minors

- [ ] `nextActive(active, dir, count, open)` in `lib/search.ts` + tests; GlobalSearch uses it; `aria-controls` only while the list is shown; hover sets the active option (no separate hover tint).
- [ ] `syncPageState()` replaces `effectivePage()` + tests; SortableTable syncs state during render.
- [ ] `LinePpvCard`: spans in place of divs inside the button.
- [ ] Vendors: drop `?highlight` on the first filter change (D16).
- [ ] `shouldScrollTop()` + tests; `ScrollToTop` before `<Routes>`.
- [ ] Commit.

## Task 5: README, handoff, verification

- [ ] README: what it is, run commands, data regeneration, tests/build/lint, method summary (spec 4.3), the concept-screen scope statement.
- [ ] `npm test`, `npm run build`, `npx oxlint src`.
- [ ] Browser: walk Match review (accept/reject/undo), check the console, Tab through each page by hand.
- [ ] Update HANDOFF.md, commit.
