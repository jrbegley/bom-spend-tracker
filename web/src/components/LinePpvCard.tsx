import type { LineSummary } from '../lib/data';
import { money } from '../lib/format';

type Props = { lines: LineSummary[]; selected?: string | null; onSelect?: (line: string | null) => void };

/** "PPV by product line": one bar per line (click to filter products), plus best-price savings underneath. */
export function LinePpvCard({ lines, selected = null, onSelect }: Props) {
  const maxPpv = Math.max(...lines.map((l) => l.ppv), 1);
  const maxSave = Math.max(...lines.map((l) => l.savings));
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-[15px] font-semibold" title="Product-line figures cover BOM-tied spend only">PPV by product line</h2>
      <div className="mt-3 space-y-2.5">
        {lines.map((l) => {
          const on = selected === l.line;
          return (
            <button key={l.line} type="button" aria-pressed={on} onClick={() => onSelect?.(on ? null : l.line)}
              className={`grid w-full grid-cols-[80px_1fr_auto] items-center gap-3 rounded-lg px-2 py-1 text-left text-[13px] hover:bg-muted ${on ? 'bg-muted' : ''}`}>
              <span>{l.line}</span>
              <span className="block h-3 rounded-sm bg-muted" aria-hidden="true">
                <span className="block h-full rounded-sm bg-ppv" style={{ width: `${(l.ppv / maxPpv) * 100}%` }} />
              </span>
              <span className="text-right text-muted-foreground tabular-nums">{`${money(l.ppv)} · ${l.bikes} bikes`}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 border-t border-hairline pt-3 text-[12px] text-muted-foreground">
        Savings at best price:{' '}
        {lines.map((l, i) => (
          <span key={l.line}>
            {i > 0 && ' · '}
            <span className={l.savings === maxSave ? 'text-savings-ink font-semibold' : ''}>{`${l.line} ${money(l.savings)}`}</span>
          </span>
        ))}
      </p>
    </section>
  );
}
