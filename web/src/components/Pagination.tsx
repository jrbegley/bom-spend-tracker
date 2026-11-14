type Props = { start: number; end: number; total: number; itemLabel: string; onPrev(): void; onNext(): void };

const btn = 'rounded-md border border-border bg-card px-3 py-1.5 text-[13px] hover:bg-muted';

/** "1 to 8 of 86 vendors" with Previous / Next. Buttons stay enabled; the caller clamps. */
export function Pagination({ start, end, total, itemLabel, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between border-t border-hairline px-4 py-3 text-[13px] text-muted-foreground">
      <span>{total === 0 ? `0 ${itemLabel}` : `${start + 1} to ${end} of ${total} ${itemLabel}`}</span>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={onPrev}>Previous</button>
        <button type="button" className={btn} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}
