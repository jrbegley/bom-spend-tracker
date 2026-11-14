import type { Part, PartVendor } from '../lib/data';
import { count, money, pct, unitMoney, vsCheapest } from '../lib/format';
import { vendorVsCheapest } from '../lib/partStats';
import { vsCls } from '../lib/vsCls';
import { SortableTable, type Column } from './SortableTable';

/** "Vendor prices": one row per vendor with a bar of average unit price. Cheapest bar green, others amber. */
export function VendorPrices({ part }: { part: Part }) {
  const maxAvg = Math.max(...part.vendors.map((v) => v.avgPrice), 0.0001);
  const rej = (v: PartVendor) => (v.receivedQty === 0 ? 0 : v.rejectedQty / v.receivedQty);
  const columns: Column<PartVendor>[] = [
    { key: 'name', label: 'Vendor', value: (v) => v.name },
    { key: 'avgPrice', label: 'Average price', numeric: true, value: (v) => v.avgPrice, render: (v) => (
      <div className="flex items-center justify-end gap-2">
        <div className="w-24"><div className={`h-2 rounded-sm ${v.avgPrice === part.bestPrice ? 'bg-savings' : 'bg-ppv'}`}
          style={{ width: `${(v.avgPrice / maxAvg) * 100}%` }} /></div>
        <span>{unitMoney(v.avgPrice)}</span>
      </div>) },
    { key: 'qty', label: 'Quantity', numeric: true, value: (v) => v.qty, render: (v) => count(v.qty) },
    { key: 'spend', label: 'Spend', numeric: true, value: (v) => v.spend, render: (v) => money(v.spend) },
    { key: 'ppv', label: 'PPV', numeric: true, value: (v) => v.ppv, render: (v) => <span className="text-ppv-ink">{money(v.ppv)}</span> },
    { key: 'vsCheapest', label: 'vs cheapest', numeric: true, value: vendorVsCheapest,
      render: (v) => <span className={vsCls(vendorVsCheapest(v))}>{vsCheapest(vendorVsCheapest(v))}</span> },
    { key: 'rejectRate', label: 'Reject rate', numeric: true, value: rej,
      render: (v) => <span className={rej(v) >= 0.05 ? 'text-destructive' : ''}>{pct(rej(v))}</span> },
  ];
  return (
    <section className="rounded-xl border border-border bg-card">
      <h2 className="px-4 pt-4 pb-2 text-[15px] font-semibold">Vendor prices</h2>
      <SortableTable columns={columns} rows={part.vendors} rowKey={(v) => v.vendorId}
        defaultSort={{ key: 'ppv', dir: 'desc' }} itemLabel="vendors"
        rowClassName={(v) => (vendorVsCheapest(v) > 0.2 ? 'bg-caution-soft' : '')} caption={`Vendor prices for ${part.name}`} />
    </section>
  );
}
