// Match review concept screen (BUILD_SPEC.md section 7.7). The sample lines are hand-written.

export const NOT_A_BOM_PART = 'Not a BOM part';

export type MatchCandidate = { partId?: string; name: string; confidence: number };
export type MatchExample = {
  id: string; raw: string; vendor: string; uom: string; price: number;
  /** For a line classified "Not a BOM part": the unmapped (resale) item it really is. */
  sourcePartId?: string;
  candidates: MatchCandidate[];
};
export type Decision = 'accepted' | 'rejected';
export type Decisions = Record<string, Decision>;

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
