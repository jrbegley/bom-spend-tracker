// Lever filtering for the Opportunities page (BUILD_SPEC.md section 7.5).
import type { Opportunity } from './data';

export type LeverFilter = 'all' | Opportunity['lever'];

const ORDER: Opportunity['lever'][] = ['price_gap', 'quality_cost'];

/** The levers that actually appear in the data, in display order. */
export function leversPresent(opps: Opportunity[]): Opportunity['lever'][] {
  return ORDER.filter((l) => opps.some((o) => o.lever === l));
}

export function filterByLever(opps: Opportunity[], lever: LeverFilter): Opportunity[] {
  return lever === 'all' ? opps : opps.filter((o) => o.lever === lever);
}
