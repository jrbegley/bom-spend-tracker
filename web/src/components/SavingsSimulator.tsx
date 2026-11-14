import { useId, useState } from 'react';
import { money } from '../lib/format';
import { simulatedSavings } from '../lib/partStats';

type Props = { save: number; vendorCount: number; bikeCount: number; onBom: boolean };

/** Slider: move a share of volume to the cheapest vendor and see what it saves. */
export function SavingsSimulator({ save, vendorCount, bikeCount, onBom }: Props) {
  const [share, setShare] = useState(100);
  const id = useId();
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-[15px] font-semibold">Savings simulator</h2>
      {vendorCount === 1 ? (
        <p className="mt-3 text-muted-foreground">Only one vendor supplies this part</p>
      ) : (
        <>
          <label htmlFor={id} className="mt-3 block text-muted-foreground">
            {'Move this share of volume to the cheapest vendor'} <span className="font-medium text-foreground">{`${share}%`}</span>
          </label>
          <input id={id} type="range" min={0} max={100} step={5} value={share}
            onChange={(e) => setShare(Number(e.target.value))} className="mt-2 w-full accent-primary" />
          <output aria-live="polite" className="mt-3 block text-[26px] font-semibold text-savings-ink">{`Saves ${money(simulatedSavings(save, share))}`}</output>
          <p className="mt-1 text-[12px] text-muted-foreground">{onBom ? `Across ${bikeCount} bikes` : 'Not on a BOM'}</p>
        </>
      )}
    </section>
  );
}
