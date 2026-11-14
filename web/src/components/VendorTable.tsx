import { SortableTable, type Column } from './SortableTable';
import type { Part, Vendor } from '../lib/data';
import { money, pct, singleSource, vsCheapest } from '../lib/format';
import { vendorsForParts } from '../lib/vendorsForParts';
import { vsCls } from '../lib/vsCls';

type Extras = { highlightId?: string; resetPageOn?: unknown };
type Props =
  | ({ mode: 'all'; vendors: Vendor[]; title: string } & Extras)
  | ({ mode: 'parts'; partIds: string[]; parts: Record<string, Part>; title: string } & Extras);

type Row = {
  id: string; name: string; spend: number; ppv: number; vsCheapest: number; rejectRate: number; singleSource: number;
  lines?: string[]; partsLabel?: string;
};

const linesText = (r: Row) => (r.lines && r.lines.length ? r.lines.join(', ') : 'Not on a BOM');

function columns(mode: Props['mode']): Column<Row>[] {
  const vendor: Column<Row> = mode === 'parts'
    ? { key: 'name', label: 'Vendor', value: (r) => r.name, render: (r) => (
        <><div>{r.name}</div><div className="text-[12px] text-text-muted">{r.partsLabel}</div></>) }
    : { key: 'name', label: 'Vendor', value: (r) => r.name };
  const rest: Column<Row>[] = [
    { key: 'spend', label: 'Spend', numeric: true, value: (r) => r.spend, render: (r) => money(r.spend) },
    { key: 'ppv', label: 'PPV', numeric: true, value: (r) => r.ppv, render: (r) => <span className="text-ppv">{money(r.ppv)}</span> },
    { key: 'vsCheapest', label: 'vs cheapest', numeric: true, value: (r) => r.vsCheapest,
      render: (r) => <span className={vsCls(r.vsCheapest)}>{vsCheapest(r.vsCheapest)}</span> },
    { key: 'rejectRate', label: 'Reject rate', numeric: true, value: (r) => r.rejectRate,
      render: (r) => <span className={r.rejectRate >= 0.05 ? 'text-reject' : ''}>{pct(r.rejectRate)}</span> },
    { key: 'singleSource', label: 'Single-source', numeric: true, value: (r) => r.singleSource, render: (r) => singleSource(r.singleSource) },
  ];
  if (mode === 'parts') return [vendor, ...rest];
  const lines: Column<Row> = { key: 'lines', label: 'Product lines', value: linesText };
  return [vendor, rest[0], lines, ...rest.slice(1)];
}

export function VendorTable(props: Props) {
  const rows: Row[] = props.mode === 'all'
    ? props.vendors
    : vendorsForParts(props.partIds, props.parts).map((v) => ({ ...v, id: v.vendorId }));
  return (
    <section className="rounded-card border border-border bg-surface">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-semibold">{props.title}</h2>
        {props.mode === 'parts' && <p className="mt-0.5 text-[12px] text-text-muted">Spend on these parts across all products</p>}
      </div>
      <SortableTable
        columns={columns(props.mode)}
        rows={rows}
        rowKey={(r) => r.id}
        defaultSort={{ key: 'ppv', dir: 'desc' }}
        pageSize={8}
        itemLabel="vendors"
        rowClassName={(r) => (r.vsCheapest > 0.2 ? 'bg-warn-tint' : '')}
        caption={props.title}
        highlightKey={props.highlightId}
        resetPageOn={props.resetPageOn}
      />
    </section>
  );
}
