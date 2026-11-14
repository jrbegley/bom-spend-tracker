import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: string;
  caption?: string;
  tone?: 'ppv' | 'savings';
  progress?: number; // 0..1
  labelExtra?: ReactNode;
  size?: 'lg' | 'md';
};

export function KpiTile({ label, value, caption, tone, progress, labelExtra, size = 'lg' }: Props) {
  const toneCls = tone === 'ppv' ? 'text-ppv-ink' : tone === 'savings' ? 'text-savings-ink' : 'text-foreground';
  const sizeCls = size === 'md' ? 'text-[26px]' : 'text-[28px]';
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="eyebrow flex items-center gap-2">{label}{labelExtra}</div>
      <div className={`num mt-2 font-medium leading-tight tracking-tight ${sizeCls} ${toneCls}`}>{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar"
          aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {caption && <div className="mt-1.5 text-[12px] text-muted-foreground">{caption}</div>}
    </div>
  );
}
