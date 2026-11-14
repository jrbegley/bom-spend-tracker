import type { Opportunity } from '../lib/data';

const LABEL: Record<Opportunity['lever'], string> = { price_gap: 'Price gap', quality_cost: 'Quality cost' };

export function LeverChip({ lever }: { lever: Opportunity['lever'] }) {
  return <span className="inline-block rounded-sm bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">{LABEL[lever]}</span>;
}
