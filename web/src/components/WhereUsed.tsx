import { Link } from 'react-router-dom';
import type { Part, Product } from '../lib/data';
import { count, money, pct } from '../lib/format';
import { SortableTable, type Column } from './SortableTable';

type Row = { productId: string; name: string; line: string; qtyPerUnit: number; units: number; share: number; allocatedSpend: number };

/** "Where used": bikes that consume this part, with allocated spend. */
export function WhereUsed({ part, products }: { part: Part; products: Product[] }) {
  const rows: Row[] = part.whereUsed.map((w) => {
    const p = products.find((x) => x.id === w.productId);
    return { ...w, name: p?.name ?? w.productId, line: p?.line ?? '' };
  });
  const columns: Column<Row>[] = [
    { key: 'name', label: 'Product', value: (r) => r.name,
      render: (r) => <Link to={`/products/${r.productId}`} className="text-accent hover:text-accent-hover">{r.name}</Link> },
    { key: 'line', label: 'Line', value: (r) => r.line },
    { key: 'qtyPerUnit', label: 'Qty per bike', numeric: true, value: (r) => r.qtyPerUnit, render: (r) => String(Number(r.qtyPerUnit.toFixed(2))) },
    { key: 'units', label: 'Units built', numeric: true, value: (r) => r.units, render: (r) => count(r.units) },
    { key: 'share', label: 'Share of consumption', numeric: true, value: (r) => r.share, render: (r) => pct(r.share) },
    { key: 'allocatedSpend', label: 'Allocated spend', numeric: true, value: (r) => r.allocatedSpend, render: (r) => money(r.allocatedSpend) },
  ];
  return (
    <section className="rounded-card border border-border bg-surface">
      <h2 className="px-4 pt-4 pb-2 text-[15px] font-semibold">Where used</h2>
      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-text-secondary">Not used on any bike's BOM</p>
      ) : (
        <SortableTable columns={columns} rows={rows} rowKey={(r) => r.productId}
          defaultSort={{ key: 'allocatedSpend', dir: 'desc' }} collapsedCount={10} itemLabel="bikes" caption={`Bikes that use ${part.name}`} />
      )}
    </section>
  );
}
