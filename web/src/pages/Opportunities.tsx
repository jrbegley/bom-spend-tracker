import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LeverChip } from '../components/LeverChip';
import { SortableTable, type Column } from '../components/SortableTable';
import { useCoreData, type Opportunity } from '../lib/data';
import { money, unitMoney } from '../lib/format';
import { filterByLever, leversPresent, type LeverFilter } from '../lib/opportunities';

const LABEL: Record<Opportunity['lever'], string> = { price_gap: 'Price gap', quality_cost: 'Quality cost' };

const columns: Column<Opportunity>[] = [
  { key: 'name', label: 'Part', value: (o) => o.name,
    render: (o) => <Link to={`/parts/${o.partId}`} className="text-primary hover:text-primary/80">{o.name}</Link> },
  { key: 'lever', label: 'Lever', value: (o) => o.lever, render: (o) => <LeverChip lever={o.lever} /> },
  { key: 'savings', label: 'Savings', numeric: true, value: (o) => o.savings, render: (o) => <span className="text-savings-ink">{money(o.savings)}</span> },
  { key: 'vendorCount', label: 'Vendors', numeric: true, value: (o) => o.vendorCount },
  { key: 'productCount', label: 'Bikes affected', numeric: true, value: (o) => o.productCount,
    render: (o) => (o.productCount === 0 ? <span className="text-muted-foreground">Not on a BOM</span> : o.productCount) },
  { key: 'bestPrice', label: 'Best price', numeric: true, value: (o) => o.bestPrice, render: (o) => unitMoney(o.bestPrice) },
  { key: 'worstPrice', label: 'Highest price', numeric: true, value: (o) => o.worstPrice, render: (o) => unitMoney(o.worstPrice) },
];

type Props = { opportunities: Opportunity[]; lever: LeverFilter; onLeverChange: (l: LeverFilter) => void };

export function OpportunitiesView({ opportunities, lever, onLeverChange }: Props) {
  const filtered = filterByLever(opportunities, lever);
  const total = filtered.reduce((a, o) => a + o.savings, 0);
  const chips: { value: LeverFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    ...leversPresent(opportunities).map((l) => ({ value: l as LeverFilter, label: LABEL[l] })),
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold">Opportunities</h1>
        <p className="mt-1 text-muted-foreground">Price gaps across all products</p>
      </div>
      <div className="flex gap-2">
        {chips.map((c) => (
          <button key={c.value} type="button" aria-pressed={lever === c.value} onClick={() => onLeverChange(c.value)}
            className={`rounded-sm border px-3 py-1.5 text-[13px] ${lever === c.value ? 'border-primary bg-primary-soft text-primary font-medium' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}>{c.label}</button>
        ))}
      </div>
      <p className="text-[15px] font-semibold">{`${money(total)} across ${filtered.length} parts`}</p>
      <section className="rounded-xl border border-border bg-card">
        <SortableTable columns={columns} rows={filtered} rowKey={(o) => o.partId} defaultSort={{ key: 'savings', dir: 'desc' }}
          pageSize={20} itemLabel="parts" resetPageOn={lever} caption="Opportunities" />
      </section>
    </div>
  );
}

export default function Opportunities() {
  const [lever, setLever] = useState<LeverFilter>('all');
  return <OpportunitiesView opportunities={useCoreData().opportunities} lever={lever} onLeverChange={setLever} />;
}
