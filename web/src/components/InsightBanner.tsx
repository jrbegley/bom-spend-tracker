import { Link } from 'react-router-dom';
import type { Insight } from '../lib/insight';
import type { Crumb } from './Breadcrumb';

/** Green callout under a level page's tables, pointing at the part worth harmonizing. */
export function InsightBanner({ insight, trail }: { insight: Insight; trail: Crumb[] }) {
  return (
    <aside className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-savings/30 bg-savings-soft px-6 py-5">
      <div className="max-w-[640px]">
        <div className="eyebrow text-savings-ink">Savings opportunity</div>
        <p className="mt-2 text-[15px] leading-relaxed">{insight.text}</p>
      </div>
      <Link to={`/parts/${insight.partId}`} state={{ trail }}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground hover:bg-primary/90">{`Open ${insight.partName}`}<span aria-hidden="true">→</span></Link>
    </aside>
  );
}
