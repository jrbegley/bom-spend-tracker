import { Link, useSearchParams } from 'react-router-dom';
import { FilterChips, PageHeader, Panel, Stat, StatRow } from '../components/primitives';
import { SortableTable, type Column } from '../components/SortableTable';
import { useCoreData, type CoreData } from '../lib/data';
import { count, money, pct, pctSigned, periodLabel, ppvUnit } from '../lib/format';
import { costHeadline, rankByVariance, type RankedProduct } from '../lib/productCosts';
import { validLine } from '../lib/productGroups';

type Props = { core: CoreData; line?: string | null; onLineChange?: (l: string | null) => void };

export function ProductCostsView({ core, line = null, onLineChange = () => {} }: Props) {
  const { products, summary } = core;
  const head = costHeadline(products);
  const shown = rankByVariance(products.filter((p) => !line || p.line === line)); // rank within the filtered list
  const maxVar = Math.max(...shown.map((p) => p.ppvTotal), 0) || 1;

  const columns: Column<RankedProduct>[] = [
    { key: 'rank', label: '#', numeric: true, value: (p) => p.rank, render: (p) => <span className="text-muted-foreground">{p.rank}</span>, width: '56px' },
    { key: 'name', label: 'Bike', value: (p) => p.name, render: (p) => (
      <>
        <Link to={`/products/${p.id}`} className="font-medium text-foreground hover:text-primary">{p.name}</Link>
        <div className="mt-1"><span className="rounded-md border border-border px-1.5 py-0.5 text-[12px] text-muted-foreground">{p.line}</span></div>
      </>) },
    { key: 'bar', label: 'Variance by driver', value: (p) => p.ppvTotal, render: (p) => (
      <div className="h-2.5 w-full min-w-[160px] rounded-full bg-muted">
        <div className="animate-grow-x h-full rounded-full bg-ppv" title={`PPV ${money(p.ppvTotal)}`} style={{ width: `${(p.ppvTotal / maxVar) * 100}%` }} />
      </div>), width: '34%' },
    { key: 'ppvTotal', label: 'Total variance', numeric: true, value: (p) => p.ppvTotal, render: (p) => <span className="font-medium">{money(p.ppvTotal)}</span> },
    { key: 'ppvUnit', label: 'Per unit', numeric: true, value: (p) => p.ppvUnit, render: (p) => <span className="text-muted-foreground">{ppvUnit(p.ppvUnit)}</span> },
    { key: 'vsStd', label: 'vs standard', numeric: true, value: (p) => p.vsStd, render: (p) => <span className="text-muted-foreground">{pctSigned(p.vsStd)}</span> },
  ];

  const options = [
    { value: 'all', label: 'All lines' },
    ...summary.lines.map((l) => ({ value: l.line, label: l.line, count: products.filter((p) => p.line === l.line).length })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={periodLabel(summary.periodStart, summary.periodEnd)} title="Product costs"
        meta={`${head.bikes} bikes · purchased material, actual cost vs standard`} />
      <StatRow>
        <Stat label="Standard cost" value={money(head.standard)} caption={`${head.bikes} bikes · ${count(head.units)} units built`} />
        <Stat label="Total variance" value={`+${money(head.variance)}`} caption={`${pct(head.varianceShare)} above standard`} />
        <Stat label="Verified" value="100%" caption="Pending $0" />
      </StatRow>
      <Panel
        title="Bikes ranked by total variance"
        subtitle={`Where the ${money(head.variance)} sits, and what drives it.`}
        actions={<FilterChips label="Product line" options={options} value={line ?? 'all'} onChange={(v) => onLineChange(v === 'all' ? null : v)} />}
        footer={<span className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-ppv" /><span>PPV</span></span>}
      >
        <SortableTable key={line ?? 'all'} columns={columns} rows={shown} rowKey={(p) => p.id} defaultSort={{ key: 'ppvTotal', dir: 'desc' }}
          collapsedCount={10} itemLabel="bikes" caption="Bikes ranked by total variance" />
      </Panel>
    </div>
  );
}

export default function ProductCosts() {
  const core = useCoreData();
  const [params, setParams] = useSearchParams();
  const line = validLine(params.get('line'), core.summary.lines.map((l) => l.line));
  const onLineChange = (l: string | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (l) next.set('line', l); else next.delete('line');
      return next;
    }, { replace: true });
  return <ProductCostsView core={core} line={line} onLineChange={onLineChange} />;
}
