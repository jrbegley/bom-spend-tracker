import { Link } from 'react-router-dom';
import type { BomNode, Part } from '../lib/data';
import { childHref, componentNote, levelTrail } from '../lib/bom';
import { pct, ppvUnit, unitMoney } from '../lib/format';
import { BlendedBadge } from './BlendedBadge';
import { MadeBoughtTag } from './MadeBoughtTag';
import { Panel } from './primitives';
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
        <Link to={childHref(chain, c)} state={c.made ? undefined : { trail }} className="font-medium text-foreground hover:text-primary">{c.name}</Link>
        <MadeBoughtTag made={c.made} />
        <div className="text-[12px] text-muted-foreground">{componentNote(c, parts)}</div>
      </>) },
    { key: 'costUnit', label: 'Cost', numeric: true, value: (c) => c.costUnit, render: (c) => unitMoney(c.costUnit), headerExtra: <BlendedBadge /> },
    { key: 'share', label: 'Share of cost', numeric: true, value: (c) => (node.costUnit ? c.costUnit / node.costUnit : 0),
      render: (c) => {
        const share = node.costUnit ? c.costUnit / node.costUnit : 0;
        return (
          <span className="inline-flex items-center justify-end gap-3">
            <span aria-hidden="true" className="inline-block h-1.5 w-20 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary/50" style={{ width: `${Math.min(1, share) * 100}%` }} /></span>
            <span className="w-12">{pct(share)}</span>
          </span>
        );
      } },
    { key: 'ppvUnit', label: 'PPV', numeric: true, value: (c) => c.ppvUnit, render: (c) => <span className="text-ppv-ink">{ppvUnit(c.ppvUnit)}</span> },
    { key: 'saveUnit', label: 'Best-price savings', numeric: true, value: (c) => c.saveUnit,
      render: (c) => <span className={isTop(c) ? 'text-savings-ink font-semibold' : 'text-savings-ink'}>{unitMoney(c.saveUnit)}</span> },
  ];

  return (
    <Panel title="Assemblies and parts" subtitle={`${node.children.length} components, largest PPV first. Made components open their own page.`}>
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
    </Panel>
  );
}
