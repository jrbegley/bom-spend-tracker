# Handoff: where to pick up

Spendline (BOM to spend cube explorer). `BUILD_SPEC.md` is the binding spec. This file says where the build stands. Read the spec's sections 1, 2, 9 and 11 first, then this file.

## Status (branch `main`, last commit "fix(table): highlighted row shows the highlight tint…")

| Phase | State |
|---|---|
| 0 Data pipeline | Done. `python3 data/check_outputs.py web/public/data` → `ALL CHECKS PASSED` (65 checks against spec 4.5). |
| 1 Shell and shared components | Done. |
| 2 Demo path (Overview, Level page, Part detail) | Done, walked through in Chrome. |
| 3 Supporting screens (Opportunities, Products, Vendors, GlobalSearch, line filter, insight banner) | Done, walked through in Chrome. |
| **4 Concept screen and polish** | **Not started. This is the next work.** |

127 tests pass (`cd web && npm test`), build and `npx oxlint src` are clean.

## Phase 4 scope (spec section 9 and 7.7)

1. **Match review screen** (`web/src/pages/MatchReview.tsx` is currently a one-line stub): spec 7.7. Includes the "Illustrative" badge, the 6-card review queue with Accept/Reject (local state only), and the "How matching works" 5-step flow.
2. **`web/public/data/match_examples.json`**: hand-written, not produced by the pipeline. Use real part names and vendors from `parts.json`; spec 7.7 has two sample entries and says what the other four need (one low-confidence line under 60%, one resale item from `unmapped.json` classified "Not a BOM part").
3. **Empty and loading states**, **focus states**, and a **README** with the run commands and the method summary from spec 4.3.
4. **Deferred minors from phases 2 and 3** (fold in where they touch the same files):
   - No scroll reset on navigation: links low on a page (e.g. the insight banner's "Open Touring Rim") open the next page scrolled down. Add scroll-to-top on route change.
   - Search: ArrowDown after Escape skips the first result (`GlobalSearch.tsx`; `active` stays 0 while closed).
   - Accessibility markup: `aria-controls` points at a listbox that isn't rendered while closed; hovering an option makes two rows look selected; `LinePpvCard` has a `div` inside a `button`.
   - Returning to an earlier filter value restores that filter's old page (`effectivePage` in `lib/sort.ts` only compares tokens).
   - `?highlight=` stays in the URL, so clearing a no-match vendor filter re-runs the jump, scroll and tint.
   - No automated test for the highlight scroll/fade effect or page restore (the project has no DOM test runner; adding jsdom is a new dev dependency, so ask first).
5. Spec section 10 acceptance checklist: Match review "Illustrative" badge, no console errors, and all interactive elements reachable by keyboard have **not** been verified with real keystrokes yet (see Gotchas).

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

- Each phase: a plan in `docs/superpowers/plans/` written with the superpowers `writing-plans` skill, executed task by task test-first with `executing-plans`, one whole-branch review at the end, then merge. Plans for phases 0–1, 2 and 3 are there and show the format. **There is no phase 4 plan yet; write one first.**
- Pure logic lives in `web/src/lib/` and is unit tested. Pages split into a pure `…View` (props in) and a thin default export (hooks), so tests render the View to HTML against the real pipeline JSON (`web/src/test/realData.ts`: `loadCore()`, `readData()`).

## Gotchas

- **Untracked " 2" duplicate files** (`build_data 2.py`, `package 2.json`, …) may appear in `data/` and `web/`. They are iCloud-style sync copies of real files, not part of the repo. Never `git add` them; always add explicit paths. If they are tracked on your clone, `git rm` them.
- `data/raw/` is git-ignored (download it yourself). `web/public/data` is committed on purpose.
- macOS `sed -i` needs `-i ''`; prefer a small Python or Node edit script.
- Browser automation: real keystrokes from the Chrome tool often don't reach the page, so keyboard behavior (Tab order, typing in search) is **unverified**. Check by hand. Background tabs throttle timers to about one per second, so don't poll in loops.
- Match the spec's SSR text rules in tests: adjacent JSX text nodes render with `<!-- -->` between them, so build strings with template literals.
- The Python script `data/build_data.py` is copied verbatim from the spec; do not edit it.
