# Handoff: where to pick up

Spendline (BOM to spend cube explorer). `BUILD_SPEC.md` is the binding spec. This file says where the build stands. Read the spec's sections 1, 2, 9 and 11 first, then this file.

## Status (branch `phase-4`, not yet merged to `main`)

| Phase | State |
|---|---|
| 0 Data pipeline | Done. `python3 data/check_outputs.py web/public/data` → `ALL CHECKS PASSED` (65 checks against spec 4.5). |
| 1 Shell and shared components | Done. |
| 2 Demo path (Overview, Level page, Part detail) | Done, walked through in Chrome. |
| 3 Supporting screens (Opportunities, Products, Vendors, GlobalSearch, line filter, insight banner) | Done, walked through in Chrome. |
| 4 Concept screen and polish | Built on branch `phase-4` (plan: `docs/superpowers/plans/2026-11-14-phase-4-concept-and-polish.md`). **Not yet walked through in a browser.** |

147 tests pass (`cd web && npm test`), build and `npx oxlint src` are clean.

## Phase 4: what was built

- **Match review** (`pages/MatchReview.tsx`, `lib/matchReview.ts`): Illustrative badge, 6-card queue with Accept/Reject/Undo in local state, a progress line, and the "How matching works" 5-step flow. `public/data/match_examples.json` is hand-written; `lib/matchReview.test.ts` checks it against `parts.json` and `unmapped.json`.
- **States:** `StatusMessage` (role `status` / `alert`) for loading and errors in DataProvider, LevelPage and Match review. Empty tables show "Nothing to show". Focus uses the global 2px `:focus-visible` ring; nothing suppresses it.
- **README** with run commands and the method summary (spec 4.3).
- **Deferred minors closed:**
  - scroll to top on new paths (`lib/scroll.ts`; not on Back/Forward or query-only changes)
  - search: ArrowDown after Escape opens on the first hit (`nextActive` in `lib/search.ts`)
  - `aria-controls` is set only while the list shows; hovering moves the active option, so only one row looks selected
  - no `div` inside `LinePpvCard` buttons
  - `syncPageState` replaces `effectivePage`, so going back to an earlier filter value no longer restores its old page
  - Vendors drops `?highlight` from the URL on the first filter change
- Decisions D12 to D16 are recorded in the plan: rejected cards collapse too (with Undo), progress line, scroll rules, no jsdom, one-time highlight.

## Still open

1. **Browser walk-through of phase 4:** Match review (accept, reject, undo); scroll reset (the insight banner's "Open Touring Rim"); search arrows after Escape; Vendors highlight, then filter, then clear.
2. **Spec 10 by hand:** no console errors on any page; Tab through every page (keyboard behavior is unverified, see Gotchas).
3. **jsdom** for testing the highlight scroll/fade effect: still not added (a new dev dependency needs the team's OK).
4. Merge `phase-4` into `main` after the walk-through.
5. On Windows, `npm ci` fails because `package-lock.json` lacks Windows-only optional packages (`@emnapi/*`). `npm install` works. Don't commit the lockfile changes it makes unless the team agrees.

## Run it

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install pandas
# only needed to regenerate data; web/public/data is committed
mkdir -p data/raw   # then download and unzip AdventureWorks per BUILD_SPEC.md section 3
python3 data/build_data.py data/raw web/public/data
cd web && npm install && npm run dev      # app on http://localhost:5173
npm test && npm run build && npx oxlint src
```

`/dev` is a component test page available only in dev builds.

## Decisions already made (do not reopen)

- **D1: `money()` follows spec 5.3 literally.** So the Overview shows `$63.79M`, `$890.0K`, `$523.8K`, where spec 10 writes `$63.8M` and `$890K`. Tests pin the literal output (assertions tagged `// D1` in the original plan).
- Product views use blended prices; PPV and best-price savings are never added together; costs are purchased material only (spec section 2).
- The line crumb links to `/?line=<line>`, and the Overview line filter lives in the URL.
- Opportunities pages 20 rows at a time; the insight sentence is built from data; the banner is last on level pages; no "Compare with" link.
- Vitest is the only addition beyond the spec's stack (dev dependency).

## How the work was done (keep doing it this way)

- Each phase: a plan in `docs/superpowers/plans/` written with the superpowers `writing-plans` skill, executed task by task test-first with `executing-plans`, one whole-branch review at the end, then merge. Plans for phases 0–1, 2, 3 and 4 are there and show the format.
- Pure logic lives in `web/src/lib/` and is unit tested. Pages split into a pure `…View` (props in) and a thin default export (hooks), so tests render the View to HTML against the real pipeline JSON (`web/src/test/realData.ts`: `loadCore()`, `readData()`).

## Gotchas

- **Untracked " 2" duplicate files** (`build_data 2.py`, `package 2.json`, …) may appear in `data/` and `web/`. They are iCloud-style sync copies of real files, not part of the repo. Never `git add` them; always add explicit paths. If they are tracked on your clone, `git rm` them.
- `data/raw/` is git-ignored (download it yourself). `web/public/data` is committed on purpose.
- macOS `sed -i` needs `-i ''`; prefer a small Python or Node edit script. On Windows, files have CRLF line endings, so string-match edit scripts must allow for `\r\n`.
- Browser automation: real keystrokes from the Chrome tool often don't reach the page, so keyboard behavior (Tab order, typing in search) is **unverified**. Check by hand. Background tabs throttle timers to about one per second, so don't poll in loops.
- Match the spec's SSR text rules in tests: adjacent JSX text nodes render with `<!-- -->` between them, so build strings with template literals.
- The Python script `data/build_data.py` is copied verbatim from the spec; do not edit it.
