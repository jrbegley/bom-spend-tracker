import { LinePpvCard } from '../components/LinePpvCard';
import { MatchQueueCard } from '../components/MatchQueueCard';
import { ProductTable } from '../components/ProductTable';
import { TopOpportunities } from '../components/TopOpportunities';
import { VendorTable } from '../components/VendorTable';
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

      <div className="grid grid-cols-[1.65fr_1fr] gap-4">
        <section className="rounded-card border border-border bg-surface">
          <h2 className="px-4 pt-4 pb-2 text-[15px] font-semibold">Products</h2>
          <ProductTable products={core.products} collapsedPerGroup={2} />
        </section>
        <div className="space-y-4">
          <TopOpportunities opportunities={core.opportunities} />
          <MatchQueueCard unmappedSpend={s.unmappedSpend} totalSpend={s.totalSpend} />
        </div>
      </div>

      <VendorTable mode="all" vendors={core.vendors} title="Vendors" />
    </div>
  );
}

export default function Overview() {
  return <OverviewView core={useCoreData()} />;
}
