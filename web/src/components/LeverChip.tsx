import type { Opportunity } from '../lib/data';

const LABEL: Record<Opportunity['lever'], string> = { price_gap: 'Price gap', quality_cost: 'Quality cost' };

export function LeverChip({ lever }: { lever: Opportunity['lever'] }) {
  return <span className="inline-block rounded-chip bg-accent-tint px-1.5 py-0.5 text-[11px] font-medium text-accent-hover">{LABEL[lever]}</span>;
}
