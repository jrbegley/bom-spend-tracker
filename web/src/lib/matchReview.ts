// Match review concept screen (BUILD_SPEC.md section 7.7). The sample lines are hand-written.

export const NOT_A_BOM_PART = 'Not a BOM part';

export type MatchCandidate = { partId?: string; name: string; confidence: number };
export type MatchExample = {
  id: string; raw: string; vendor: string; uom: string; price: number;
  /** For a line classified "Not a BOM part": the unmapped (resale) item it really is. */
  sourcePartId?: string;
  candidates: MatchCandidate[];
};
export const REASONS = [
  'Wrong size or variant', 'Unit of measure mismatch', 'Vendor uses a different name', 'Wrong part family', 'Price looks wrong',
] as const;

/** What the reviewer chose: a listed candidate (rank 1 = top), any part found by search, Not a BOM part, or no match. */
export type Choice =
  | { kind: 'candidate'; rank: number }
  | { kind: 'part'; partId: string; partName: string }
  | { kind: 'not_bom' }
  | { kind: 'manual' };
export type Decision = { choice: Choice; reasons: string[] };
export type Decisions = Record<string, Decision>;
export type Outcome = 'confirmed' | 'corrected' | 'manual';
export type Band = 'High' | 'Medium' | 'Low';

/** Record (or with null, undo) the decision for one line. Returns a new map. */
export function decide(decisions: Decisions, id: string, decision: Decision | null): Decisions {
  const next = { ...decisions };
  if (decision === null) delete next[id];
  else next[id] = decision;
  return next;
}

/** "2 of 6 reviewed". */
export function reviewProgress(examples: MatchExample[], decisions: Decisions): string {
  const done = examples.filter((e) => decisions[e.id] !== undefined).length;
  return `${done} of ${examples.length} reviewed`;
}

/**
 * Whether the reviewer kept the top match (confirmed), chose something else (corrected), or sent the line to manual
 * matching. A search pick that equals a listed candidate counts as that candidate.
 */
export function resolve(example: MatchExample, choice: Choice): { outcome: Outcome; partName: string | null } {
  const cands = example.candidates;
  if (choice.kind === 'manual') return { outcome: 'manual', partName: null };
  if (choice.kind === 'not_bom') {
    return { outcome: cands[0]?.name === NOT_A_BOM_PART ? 'confirmed' : 'corrected', partName: NOT_A_BOM_PART };
  }
  const rank = choice.kind === 'candidate' ? choice.rank : cands.findIndex((c) => c.partId === choice.partId) + 1;
  if (rank >= 1 && rank <= cands.length) return { outcome: rank === 1 ? 'confirmed' : 'corrected', partName: cands[rank - 1].name };
  return { outcome: 'corrected', partName: choice.kind === 'part' ? choice.partName : null };
}

/** Confidence band of the top candidate: High ≥ 80%, Medium ≥ 60%, Low below. */
export function band(confidence: number): Band {
  return confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';
}

/** Outcome counts, override rate per confidence band, and the reasons given, for the lines reviewed so far. */
export function feedbackSummary(examples: MatchExample[], decisions: Decisions) {
  const counts: Record<Outcome, number> = { confirmed: 0, corrected: 0, manual: 0 };
  const bands = (['High', 'Medium', 'Low'] as Band[]).map((b) => ({ band: b, reviewed: 0, overridden: 0 }));
  const reasons = new Map<string, number>();
  for (const e of examples) {
    const d = decisions[e.id];
    if (!d) continue;
    const { outcome } = resolve(e, d.choice);
    counts[outcome] += 1;
    const row = bands.find((b) => b.band === band(e.candidates[0]?.confidence ?? 0))!;
    row.reviewed += 1;
    if (outcome !== 'confirmed') row.overridden += 1;
    for (const r of d.reasons) reasons.set(r, (reasons.get(r) ?? 0) + 1);
  }
  return {
    ...counts, bands,
    reasons: [...reasons].map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)),
  };
}

/** A choice can be confirmed once made; a search choice needs a picked part. */
export function choiceComplete(choice: Choice | null): boolean {
  return choice !== null && (choice.kind !== 'part' || choice.partId !== '');
}
