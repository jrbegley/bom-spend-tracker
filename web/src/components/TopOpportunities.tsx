import { Link } from 'react-router-dom';
import type { Opportunity } from '../lib/data';
import { money } from '../lib/format';
import { LeverChip } from './LeverChip';

/** The five biggest price-gap opportunities, with a link to the full list. */
export function TopOpportunities({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">Top opportunities</h2>
        <Link to="/opportunities" className="text-[13px] text-accent hover:text-accent-hover">View all</Link>
      </div>
      <ul className="mt-2 divide-y divide-rule">
        {opportunities.slice(0, 5).map((o) => (
          <li key={o.partId} className="flex items-start justify-between gap-3 py-2.5">
            <div>
              <div>
                <Link to={`/parts/${o.partId}`} className="text-accent hover:text-accent-hover">{o.name}</Link>{' '}
                <LeverChip lever={o.lever} />
              </div>
              <div className="mt-0.5 text-[12px] text-text-muted">{`${o.vendorCount} vendors · in ${o.productCount} bikes`}</div>
            </div>
            <span className="font-semibold text-savings tabular-nums">{money(o.savings)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
