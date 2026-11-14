import type { LineSummary } from '../lib/data';
import { money } from '../lib/format';

/** "PPV by product line": one bar per line, plus best-price savings per line underneath. */
export function LinePpvCard({ lines }: { lines: LineSummary[] }) {
  const maxPpv = Math.max(...lines.map((l) => l.ppv), 1);
  const maxSave = Math.max(...lines.map((l) => l.savings));
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="text-[15px] font-semibold" title="Product-line figures cover BOM-tied spend only">PPV by product line</h2>
      <div className="mt-3 space-y-2.5">
        {lines.map((l) => (
          <div key={l.line} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 text-[13px]">
            <span>{l.line}</span>
            <div className="h-3 rounded-chip bg-rule">
              <div className="h-full rounded-chip bg-ppv-bar" style={{ width: `${(l.ppv / maxPpv) * 100}%` }} />
            </div>
            <span className="text-right text-text-secondary tabular-nums">{`${money(l.ppv)} · ${l.bikes} bikes`}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-rule pt-3 text-[12px] text-text-muted">
        Savings at best price:{' '}
        {lines.map((l, i) => (
          <span key={l.line}>
            {i > 0 && ' · '}
            <span className={l.savings === maxSave ? 'text-savings font-semibold' : ''}>{`${l.line} ${money(l.savings)}`}</span>
          </span>
        ))}
      </p>
    </section>
  );
}
