import { Link } from 'react-router-dom';
import type { BomNode, Part } from '../lib/data';
import { childHref, componentNote, levelTrail } from '../lib/bom';
import { pct, ppvUnit, unitMoney } from '../lib/format';
import { BlendedBadge } from './BlendedBadge';
import { MadeBoughtTag } from './MadeBoughtTag';
import { SortableTable, type Column } from './SortableTable';

/** "Assemblies and parts": the node's children, per bike unit. chain runs bike → current node. */
export function ComponentsTable({ chain, parts }: { chain: BomNode[]; parts: Record<string, Part> }) {
  const node = chain[chain.length - 1];
  const trail = levelTrail(chain, chain[0].line ?? '');
  const maxSave = Math.max(0, ...node.children.map((c) => c.saveUnit));
  const isTop = (c: BomNode) => maxSave > 0 && c.saveUnit >= maxSave - 0.0005;

  const columns: Column<BomNode>[] = [
    { key: 'name', label: 'Component', value: (c) => c.name, render: (c) => (
      <>
        <Link to={childHref(chain, c)} state={c.made ? undefined : { trail }} className="text-primary hover:text-primary/80">{c.name}</Link>
        <MadeBoughtTag made={c.made} />
        <div className="text-[12px] text-muted-foreground">{componentNote(c, parts)}</div>
      </>) },
    { key: 'costUnit', label: 'Cost', numeric: true, value: (c) => c.costUnit, render: (c) => unitMoney(c.costUnit), headerExtra: <BlendedBadge /> },
    { key: 'share', label: 'Share of cost', numeric: true, value: (c) => (node.costUnit ? c.costUnit / node.costUnit : 0),
      render: (c) => pct(node.costUnit ? c.costUnit / node.costUnit : 0) },
    { key: 'ppvUnit', label: 'PPV', numeric: true, value: (c) => c.ppvUnit, render: (c) => <span className="text-ppv-ink">{ppvUnit(c.ppvUnit)}</span> },
    { key: 'saveUnit', label: 'Best-price savings', numeric: true, value: (c) => c.saveUnit,
      render: (c) => <span className={isTop(c) ? 'text-savings-ink font-semibold' : 'text-savings-ink'}>{unitMoney(c.saveUnit)}</span> },
  ];

  return (
    <section className="rounded-xl border border-border bg-card">
      <h2 className="px-4 pt-4 pb-2 text-[15px] font-semibold">Assemblies and parts</h2>
      <SortableTable
        columns={columns}
        rows={node.children}
        rowKey={(c) => c.id}
        defaultSort={{ key: 'ppvUnit', dir: 'desc' }}
        collapsedCount={8}
        itemLabel="components"
        rowClassName={(c) => (isTop(c) ? 'bg-savings-soft' : '')}
        caption={`Components of ${node.name}`}
      />
    </section>
  );
}
