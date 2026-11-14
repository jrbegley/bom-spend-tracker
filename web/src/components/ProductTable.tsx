import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/data';
import { count, money, pctSigned, unitMoney } from '../lib/format';
import { groupProducts } from '../lib/productGroups';
import { nextSort, type SortState } from '../lib/sort';
import { BlendedBadge } from './BlendedBadge';
import { SortHeader, type Column } from './SortableTable';

const columns: Column<Product>[] = [
  { key: 'name', label: 'Product', value: (p) => p.name },
  { key: 'units', label: 'Units built', numeric: true, value: (p) => p.units },
  { key: 'costUnit', label: 'Material / unit', numeric: true, value: (p) => p.costUnit, headerExtra: <BlendedBadge /> },
  { key: 'vsStd', label: 'vs standard', numeric: true, value: (p) => p.vsStd },
  { key: 'ppvTotal', label: 'PPV', numeric: true, value: (p) => p.ppvTotal },
  { key: 'saveTotal', label: 'Best-price savings', numeric: true, value: (p) => p.saveTotal },
];

const num = 'px-4 py-2.5 text-right tabular-nums whitespace-nowrap';

/** Products grouped by line. With collapsedPerGroup, each group shows its top N bikes and an expander. */
export function ProductTable({ products, collapsedPerGroup }: { products: Product[]; collapsedPerGroup?: number }) {
  const [sort, setSort] = useState<SortState>({ key: 'ppvTotal', dir: 'desc' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const groups = useMemo(() => groupProducts(products, sort), [products, sort]);

  const toggle = (line: string) =>
    setExpanded((s) => { const n = new Set(s); if (n.has(line)) n.delete(line); else n.add(line); return n; });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">Products by product line</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <SortHeader key={c.key} column={c} sort={sort} onSort={(col) => setSort((s) => nextSort(s, col.key, !!col.numeric))} />
            ))}
          </tr>
        </thead>
        {groups.map((g) => {
          const collapsible = collapsedPerGroup !== undefined && g.bikes.length > collapsedPerGroup;
          const open = expanded.has(g.line);
          const shown = collapsible && !open ? g.bikes.slice(0, collapsedPerGroup) : g.bikes;
          return (
            <tbody key={g.line}>
              <tr className="bg-group-row">
                <td className="px-4 py-2.5 font-medium whitespace-nowrap">{`${g.line} · ${g.bikes.length} bikes`}</td>
                <td className={num}>{count(g.units)}</td>
                <td /><td />
                <td className={`${num} text-ppv`}>{money(g.ppv)}</td>
                <td className={`${num} text-savings`}>{money(g.savings)}</td>
              </tr>
              {shown.map((p) => (
                <tr key={p.id} className="border-b border-rule hover:bg-group-row">
                  <td className="px-4 py-2.5"><Link to={`/products/${p.id}`} className="text-accent hover:text-accent-hover">{p.name}</Link></td>
                  <td className={num}>{count(p.units)}</td>
                  <td className={num}>{unitMoney(p.costUnit)}</td>
                  <td className={num}>{pctSigned(p.vsStd)}</td>
                  <td className={`${num} text-ppv`}>{money(p.ppvTotal)}</td>
                  <td className={`${num} text-savings`}>{money(p.saveTotal)}</td>
                </tr>
              ))}
              {collapsible && (
                <tr className="border-b border-rule">
                  <td colSpan={columns.length} className="px-4 py-2.5">
                    <button type="button" className="text-[13px] text-accent hover:text-accent-hover" onClick={() => toggle(g.line)}>
                      {open ? `Show top ${collapsedPerGroup}` : `Show all ${g.bikes.length} ${g.line} bikes`}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
