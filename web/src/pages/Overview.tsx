import { useSearchParams } from 'react-router-dom';
import { LinePpvCard } from '../components/LinePpvCard';
import { MatchQueueCard } from '../components/MatchQueueCard';
import { ProductTable } from '../components/ProductTable';
import { TopOpportunities } from '../components/TopOpportunities';
import { VendorTable } from '../components/VendorTable';
import { KpiTile } from '../components/KpiTile';
import { useCoreData, type CoreData } from '../lib/data';
import { count, money, pct, periodLabel } from '../lib/format';
import { validLine } from '../lib/productGroups';

type Props = { core: CoreData; line?: string | null; onLineChange?: (l: string | null) => void };

export function OverviewView({ core, line = null, onLineChange = () => {} }: Props) {
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
        <LinePpvCard lines={s.lines} selected={line} onSelect={onLineChange} />
      </div>

      <div className="grid grid-cols-[1.65fr_1fr] gap-4">
        <section className="rounded-card border border-border bg-surface">
          <h2 className="px-4 pt-4 pb-2 text-[15px] font-semibold">Products</h2>
          {line && (
            <p className="px-4 pb-2 text-text-secondary">
              {`Showing ${line} · `}
              <button type="button" className="text-accent hover:text-accent-hover" onClick={() => onLineChange(null)}>Clear</button>
            </p>
          )}
          <ProductTable products={line ? core.products.filter((p) => p.line === line) : core.products} collapsedPerGroup={2} />
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
  const core = useCoreData();
  const [params, setParams] = useSearchParams();
  const line = validLine(params.get('line'), core.summary.lines.map((l) => l.line));
  const onLineChange = (l: string | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (l) next.set('line', l); else next.delete('line');
      return next;
    }, { replace: true });
  return <OverviewView core={core} line={line} onLineChange={onLineChange} />;
}
