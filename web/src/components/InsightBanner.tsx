import { Link } from 'react-router-dom';
import type { Insight } from '../lib/insight';
import type { Crumb } from './Breadcrumb';

/** Green callout under a level page's tables, pointing at the part worth harmonizing. */
export function InsightBanner({ insight, trail }: { insight: Insight; trail: Crumb[] }) {
  return (
    <aside className="rounded-xl border border-savings/30 bg-savings-soft p-4">
      <p>{insight.text}</p>
      <p className="mt-2">
        <Link to={`/parts/${insight.partId}`} state={{ trail }} className="font-medium text-primary hover:text-primary/80">{`Open ${insight.partName}`}</Link>
      </p>
    </aside>
  );
}
