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
  const toneCls = tone === 'ppv' ? 'text-ppv' : tone === 'savings' ? 'text-savings' : 'text-text';
  const sizeCls = size === 'md' ? 'text-[26px]' : 'text-[28px]';
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[13px] text-text-secondary">{label}{labelExtra}</div>
      <div className={`mt-1 font-semibold leading-tight ${sizeCls} ${toneCls}`}>{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule" role="progressbar"
          aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {caption && <div className="mt-1.5 text-[12px] text-text-muted">{caption}</div>}
    </div>
  );
}
