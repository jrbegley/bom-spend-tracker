import { useId, useState } from 'react';
import { money } from '../lib/format';
import { simulatedSavings } from '../lib/partStats';
import { Panel } from './primitives';

type Props = { save: number; bikeCount: number; onBom: boolean };

/** Slider: move a share of volume to the cheapest vendor and see what it saves. Only shown when there is a saving. */
export function SavingsSimulator({ save, bikeCount, onBom }: Props) {
  const [share, setShare] = useState(100);
  const id = useId();
  return (
    <Panel title="Savings simulator" subtitle="Try a partial move before committing all the volume.">
      <div className="grid items-center gap-8 px-6 py-6 md:grid-cols-[1fr_260px]">
        <div>
          <label htmlFor={id} className="flex items-baseline justify-between gap-4 text-[14px] font-medium">
            {'Move this share of volume to the cheapest vendor'} <span className="num">{`${share}%`}</span>
          </label>
          <input id={id} type="range" min={0} max={100} step={5} value={share}
            onChange={(e) => setShare(Number(e.target.value))} className="mt-3 w-full accent-primary" />
          <div className="mt-1 flex justify-between text-[12px] text-muted-foreground"><span>0%</span><span>100%</span></div>
        </div>
        <div className="rounded-xl bg-savings-soft px-5 py-4">
          <div className="eyebrow text-savings-ink">Estimated savings</div>
          <output aria-live="polite" className="num mt-1 block text-[28px] font-medium text-savings-ink">{`Saves ${money(simulatedSavings(save, share))}`}</output>
          <p className="mt-1 text-[13px] text-muted-foreground">{onBom ? `Across ${bikeCount} bikes` : 'Not on a BOM'}</p>
        </div>
      </div>
    </Panel>
  );
}
