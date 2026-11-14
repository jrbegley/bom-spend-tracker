import type { Part } from '../lib/data';
import { NOT_A_BOM_PART, REASONS, choiceComplete, type Choice, type MatchExample } from '../lib/matchReview';
import { searchParts } from '../lib/search';

/** The editor's working state. Choosing "Search all parts" sets a part choice with an empty id until a part is picked. */
export type Draft = { choice: Choice | null; query: string; reasons: string[] };


type Props = {
  example: MatchExample; parts: Record<string, Part>; draft: Draft;
  onChange: (d: Draft) => void; onConfirm: () => void; onCancel: () => void;
};

const chip = (on: boolean) =>
  `rounded-full border px-2.5 py-1 text-[12px] ${on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:bg-muted'}`;

/** Correct a match: another candidate, any part by search, Not a BOM part, or no match; plus optional reasons. */
export function CorrectionEditor({ example, parts, draft, onChange, onConfirm, onCancel }: Props) {
  const name = `correct-${example.id}`;
  const c = draft.choice;
  const searching = c?.kind === 'part';
  const results = searching ? searchParts(parts, draft.query) : [];
  const set = (choice: Choice | null) => onChange({ ...draft, choice });
  const radio = (label: string, checked: boolean, choice: Choice) => (
    <label key={label} className="flex cursor-pointer items-center gap-2.5 py-1 text-[14px]">
      <input type="radio" name={name} checked={checked} onChange={() => set(choice)} className="accent-primary" />
      {label}
    </label>
  );
  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-4">
      <div role="radiogroup" aria-label="Correct the match">
        {example.candidates.slice(1).map((cand, i) =>
          radio(`${cand.name} · ${Math.round(cand.confidence * 100)}%`, c?.kind === 'candidate' && c.rank === i + 2, { kind: 'candidate', rank: i + 2 }))}
        {radio('Search all parts', searching, { kind: 'part', partId: '', partName: '' })}
        {example.candidates[0]?.name !== NOT_A_BOM_PART && radio(NOT_A_BOM_PART, c?.kind === 'not_bom', { kind: 'not_bom' })}
        {radio('No match · send to manual matching', c?.kind === 'manual', { kind: 'manual' })}
      </div>

      {searching && (
        <div className="mt-2 ml-6">
          <input type="search" aria-label="Search parts" placeholder="Part name, e.g. HL Nipple" value={draft.query}
            onChange={(e) => onChange({ ...draft, query: e.target.value })}
            className="h-[34px] w-full max-w-[320px] rounded-md border border-input bg-card px-3 text-[14px]" />
          {draft.query.trim().length >= 2 && (results.length === 0
            ? <p className="mt-2 text-[13px] text-muted-foreground">No parts match</p>
            : (
              <div className="mt-2 flex flex-wrap gap-2">
                {results.map((p) => {
                  const on = c?.kind === 'part' && c.partId === p.id;
                  return <button key={p.id} type="button" aria-pressed={on} className={chip(on)}
                    onClick={() => set({ kind: 'part', partId: p.id, partName: p.name })}>{p.name}</button>;
                })}
              </div>
            ))}
        </div>
      )}

      <div className="mt-4">
        <div className="eyebrow mb-2">Reason (optional)</div>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => {
            const on = draft.reasons.includes(r);
            return <button key={r} type="button" aria-pressed={on} className={chip(on)}
              onClick={() => onChange({ ...draft, reasons: on ? draft.reasons.filter((x) => x !== r) : [...draft.reasons, r] })}>{r}</button>;
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" disabled={!choiceComplete(draft.choice)} onClick={onConfirm}
          className="rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">Confirm</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium hover:bg-muted">Cancel</button>
      </div>
    </div>
  );
}
