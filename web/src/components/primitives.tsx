// Shared building blocks for the Lovable look (SPEC_REVISION_2.md section 10.2, concept primitives.tsx), in plain Tailwind.
import type { ReactNode } from 'react';
import { Breadcrumb, type Crumb } from './Breadcrumb';

/** Plain page header: optional eyebrow or crumbs, a title, and one meta line. No summary sentence. */
export function PageHeader({ eyebrow, crumbs, title, meta }: { eyebrow?: string; crumbs?: Crumb[]; title: string; meta?: string }) {
  return (
    <header className="animate-rise">
      {crumbs && <Breadcrumb items={crumbs} />}
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      {meta && <p className="mt-1.5 text-[15px] text-muted-foreground">{meta}</p>}
    </header>
  );
}

/** Up to three headline numbers in one card, divided by hairlines. */
export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card shadow-card">{children}</div>;
}

const TONE = { ppv: 'text-ppv-ink', savings: 'text-savings-ink' } as const;

export function Stat({ label, value, caption, tone, extra }: {
  label: string; value: string; caption?: string; tone?: keyof typeof TONE; extra?: ReactNode;
}) {
  return (
    <div className="px-6 py-5">
      <div className="eyebrow flex items-center gap-2">{label}{extra}</div>
      <div className={`num mt-2 text-[32px] font-medium leading-none tracking-tight ${tone ? TONE[tone] : 'text-foreground'}`}>{value}</div>
      {caption && <div className="mt-2 text-[14px] text-muted-foreground">{caption}</div>}
    </div>
  );
}

/** Card section with a header row, optional actions on the right, and an optional footer. */
export function Panel({ title, subtitle, actions, footer, children }: {
  title: string; subtitle?: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[14px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="border-t border-hairline">{children}</div>
      {footer && <div className="border-t border-hairline px-6 py-3 text-[13px] text-muted-foreground">{footer}</div>}
    </section>
  );
}

type ChipOption<T extends string> = { value: T; label: string; count?: number };

/** Pill buttons for a single-choice filter. */
export function FilterChips<T extends string>({ options, value, onChange, label }: {
  options: ChipOption<T>[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(o.value)}
            className={`rounded-full border px-3.5 py-1.5 text-[14px] ${on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:bg-muted'}`}
          >{o.label}{o.count !== undefined && <span className={`ml-1.5 text-[12px] ${on ? 'text-background/70' : 'text-muted-foreground'}`}>{o.count}</span>}</button>
        );
      })}
    </div>
  );
}

const CHIP = {
  neutral: 'bg-muted text-muted-foreground border-border',
  savings: 'bg-savings-soft text-savings-ink border-savings/30',
  caution: 'bg-caution-soft text-caution border-caution/30',
  primary: 'bg-primary-soft text-primary border-primary/20',
} as const;

/** Small uppercase status pill. */
export function Chip({ tone = 'neutral', children }: { tone?: keyof typeof CHIP; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHIP[tone]}`}>{children}</span>;
}
