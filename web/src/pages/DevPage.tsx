// Component test page (BUILD_SPEC.md section 9, phase 1: "SortableTable with a quick test page").
import { SortableTable, type Column } from '../components/SortableTable';
import { CostSummary } from '../components/CostSummary';
import { VendorTable } from '../components/VendorTable';
import { useCoreData, useJson, type BomNode, type Product, type Vendor } from '../lib/data';
import { money, pct, unitMoney, vsCheapest } from '../lib/format';

const vendorCols: Column<Vendor>[] = [
  { key: 'name', label: 'Vendor', value: (v) => v.name },
  { key: 'spend', label: 'Spend', numeric: true, value: (v) => v.spend, render: (v) => money(v.spend) },
  { key: 'ppv', label: 'PPV', numeric: true, value: (v) => v.ppv, render: (v) => <span className="text-ppv-ink">{money(v.ppv)}</span> },
  { key: 'vsCheapest', label: 'vs cheapest', numeric: true, value: (v) => v.vsCheapest, render: (v) => vsCheapest(v.vsCheapest) },
  { key: 'rejectRate', label: 'Reject rate', numeric: true, value: (v) => v.rejectRate, render: (v) => pct(v.rejectRate) },
];

const productCols: Column<Product>[] = [
  { key: 'name', label: 'Product', value: (p) => p.name },
  { key: 'costUnit', label: 'Material / unit', numeric: true, value: (p) => p.costUnit, render: (p) => unitMoney(p.costUnit) },
  { key: 'ppvTotal', label: 'PPV', numeric: true, value: (p) => p.ppvTotal, render: (p) => <span className="text-ppv-ink">{money(p.ppvTotal)}</span> },
];

const card = 'rounded-xl border border-border bg-card';
const cardTitle = 'px-4 pt-4 pb-2 text-[15px] font-semibold';

export default function DevPage() {
  const { vendors, products, parts } = useCoreData();
  const bom = useJson<BomNode>('bom/969.json');
  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold">Component test page</h1>
      <section className={card}>
        <h2 className={cardTitle}>SortableTable, paged (8)</h2>
        <SortableTable columns={vendorCols} rows={vendors} rowKey={(v) => v.id} defaultSort={{ key: 'ppv', dir: 'desc' }}
          pageSize={8} itemLabel="vendors" caption="Vendors, paged" />
      </section>
      <section className={card}>
        <h2 className={cardTitle}>SortableTable, collapsed (8 of 14)</h2>
        <SortableTable columns={productCols} rows={products.slice(0, 14)} rowKey={(p) => p.id} defaultSort={{ key: 'ppvTotal', dir: 'desc' }}
          collapsedCount={8} itemLabel="components" caption="Products, collapsed" />
      </section>
      <VendorTable mode="all" vendors={vendors} title="VendorTable, all spend" />
      {bom.data && (
        <>
          <h2 className="text-[15px] font-semibold">{bom.data.name}</h2>
          <CostSummary node={bom.data} units={bom.data.units ?? 0} />
          <VendorTable mode="parts" partIds={bom.data.leafParts.map((l) => l.partId)} parts={parts} title="Vendors for this bike" />
        </>
      )}
      {bom.error && <p role="alert">{bom.error.message}</p>}
    </div>
  );
}
