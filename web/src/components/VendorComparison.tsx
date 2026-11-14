import type { Part, PartVendor } from '../lib/data';
import { count, money, pct, unitMoney, vsCheapest } from '../lib/format';
import { vendorVsCheapest } from '../lib/partStats';
import { sortRows } from '../lib/sort';
import { Chip, Panel } from './primitives';

const premiumCls = (v: number) => (v === 0 ? 'text-muted-foreground' : v > 0.05 ? 'text-caution font-semibold' : 'text-caution');

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-hairline py-2 text-[14px]">
      <span className="text-muted-foreground">{label}</span><span className="num">{children}</span>
    </div>
  );
}

/** One card per vendor, cheapest first, compared on average unit price and reject rate (phase 5a: no warranty yet). */
export function VendorComparison({ part }: { part: Part }) {
  const vendors = sortRows(part.vendors, (v) => v.avgPrice, 'asc');
  const single = vendors.length === 1;
  const maxPrice = Math.max(...vendors.map((v) => v.avgPrice), 0.0001);
  const rejectRate = (v: PartVendor) => (v.receivedQty === 0 ? 0 : v.rejectedQty / v.receivedQty);
  return (
    <Panel title="Unit price and reject rate, by vendor" subtitle="Average price paid per unit, and the share of deliveries rejected.">
      <div className="grid divide-x divide-hairline" style={{ gridTemplateColumns: `repeat(${Math.min(vendors.length, 3)}, minmax(0, 1fr))` }}>
        {vendors.map((v, i) => {
          const lowest = !single && i === 0;
          const premium = vendorVsCheapest(v);
          return (
            <article key={v.vendorId} data-vendor={v.vendorId} className={`px-6 py-5 ${lowest ? 'bg-savings-soft' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-semibold">{v.name}</h3>
                {single ? <Chip>Single source</Chip> : lowest ? <Chip tone="savings">Lowest price</Chip> : null}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`num text-[30px] font-medium tracking-tight ${lowest ? 'text-savings-ink' : ''}`}>{unitMoney(v.avgPrice)}</span>
                <span className="text-[14px] text-muted-foreground">per unit</span>
              </div>
              <div className="mt-3 mb-3 h-2 rounded-full bg-muted">
                <div className={`animate-grow-x h-full rounded-full ${lowest ? 'bg-savings' : 'bg-price'}`} style={{ width: `${(v.avgPrice / maxPrice) * 100}%` }} />
              </div>
              {!single && <Row label="Price vs lowest"><span className={premiumCls(premium)}>{vsCheapest(premium)}</span></Row>}
              <Row label="Reject rate"><span className={rejectRate(v) >= 0.05 ? 'text-destructive' : ''}>{pct(rejectRate(v))}</span></Row>
              <Row label="Quantity">{count(v.qty)}</Row>
              <Row label="Spend">{money(v.spend)}</Row>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
