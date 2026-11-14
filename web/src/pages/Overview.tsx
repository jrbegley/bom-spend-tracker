import { LinePpvCard } from '../components/LinePpvCard';
import { KpiTile } from '../components/KpiTile';
import { useCoreData, type CoreData } from '../lib/data';
import { count, money, pct, periodLabel } from '../lib/format';

export function OverviewView({ core }: { core: CoreData }) {
  const s = core.summary;
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold">Spend overview</h1>
          <p className="mt-1 text-text-secondary">{`${periodLabel(s.periodStart, s.periodEnd)} · purchased material · blended prices`}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <KpiTile label="Material spend" value={money(s.totalSpend)} caption={`${s.vendorCount} vendors · ${count(s.poLines)} PO lines`} />
          <KpiTile label="Tied to a BOM" value={pct(s.bomTiedShare)} progress={s.bomTiedShare}
            caption={`${money(s.bomTiedSpend)} across ${s.bikeCount} bikes`} />
          <KpiTile label="Paid above standard (PPV)" value={money(s.ppvTotal)} tone="ppv"
            caption={`${pct(s.ppvShare)} over vendor standard prices`} />
          <KpiTile label="Savings at best price" value={money(s.bestPriceSavings)} tone="savings"
            caption="If each part came from its cheapest vendor" />
        </div>
        <LinePpvCard lines={s.lines} />
      </div>
    </div>
  );
}

export default function Overview() {
  return <OverviewView core={useCoreData()} />;
}
