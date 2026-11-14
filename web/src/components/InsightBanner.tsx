import { Link } from 'react-router-dom';
import type { Insight } from '../lib/insight';
import type { Crumb } from './Breadcrumb';

/** Green callout under a level page's tables, pointing at the part worth harmonizing. */
export function InsightBanner({ insight, trail }: { insight: Insight; trail: Crumb[] }) {
  return (
    <aside className="rounded-card border border-savings-border bg-savings-tint p-4">
      <p>{insight.text}</p>
      <p className="mt-2">
        <Link to={`/parts/${insight.partId}`} state={{ trail }} className="font-medium text-accent hover:text-accent-hover">{`Open ${insight.partName}`}</Link>
      </p>
    </aside>
  );
}
