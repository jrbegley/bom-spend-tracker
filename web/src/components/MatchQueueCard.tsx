import { Link } from 'react-router-dom';
import { money } from '../lib/format';

/** Dashed card pointing at the match-review concept screen. */
export function MatchQueueCard({ unmappedSpend, totalSpend }: { unmappedSpend: number; totalSpend: number }) {
  return (
    <Link to="/match-review" className="block rounded-xl border border-dashed border-border bg-card p-4 hover:bg-muted">
      <div className="text-[15px] font-semibold">{`${Math.round((unmappedSpend / totalSpend) * 100)}% of spend is not on a BOM`}</div>
      <div className="mt-1 text-muted-foreground">{`${money(unmappedSpend)} to review in the match queue`}</div>
    </Link>
  );
}
