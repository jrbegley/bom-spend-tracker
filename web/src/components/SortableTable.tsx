import { useMemo, useState, type ReactNode } from 'react';
import { nextSort, pageBounds, sortRows, type SortState } from '../lib/sort';
import { Pagination } from './Pagination';

export type Column<T> = {
  key: string;                          // sort key
  label: string;                        // header text, sentence case
  numeric?: boolean;                    // right-align and default to descending
  value: (row: T) => number | string;   // used for sorting
  render?: (row: T) => ReactNode;       // cell content
  width?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  defaultSort: SortState;
  pageSize?: number;
  rowClassName?: (row: T) => string;
  collapsedCount?: number;
  caption: string;
  itemLabel?: string;
};

export function SortableTable<T>({
  columns, rows, rowKey, defaultSort, pageSize, rowClassName, collapsedCount, caption, itemLabel = 'rows',
}: Props<T>) {
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    return col ? sortRows(rows, col.value, sort.dir) : rows;
  }, [rows, columns, sort]);

  const bounds = pageSize ? pageBounds(sorted.length, pageSize, page) : null;
  const collapsible = collapsedCount !== undefined && sorted.length > collapsedCount;
  const visible = bounds
    ? sorted.slice(bounds.start, bounds.end)
    : collapsible && !expanded ? sorted.slice(0, collapsedCount) : sorted;

  const onHeader = (c: Column<T>) => {
    setSort((s) => nextSort(s, c.key, !!c.numeric));
    setPage(1);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => {
                const active = c.key === sort.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
                    style={c.width ? { width: c.width } : undefined}
                    className={`px-4 py-2.5 font-medium text-text-secondary whitespace-nowrap ${c.numeric ? 'text-right' : 'text-left'}`}
                  >
                    <button type="button" className="inline-flex items-center gap-1 hover:text-text" onClick={() => onHeader(c)}>{c.label}<span aria-hidden="true" className={active ? 'text-text' : 'text-[#A1A1AA]'}>{active ? (sort.dir === 'desc' ? '↓' : '↑') : '↕'}</span></button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)} className={`border-b border-rule last:border-b-0 hover:bg-group-row ${rowClassName?.(row) ?? ''}`}>
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-2.5 align-top ${c.numeric ? 'text-right tabular-nums whitespace-nowrap' : 'text-left'}`}>{c.render ? c.render(row) : c.value(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bounds && (
        <Pagination
          start={bounds.start}
          end={bounds.end}
          total={sorted.length}
          itemLabel={itemLabel}
          onPrev={() => setPage(Math.max(1, bounds.page - 1))}
          onNext={() => setPage(Math.min(Math.max(1, bounds.pageCount), bounds.page + 1))}
        />
      )}
      {!bounds && collapsible && (
        <div className="border-t border-rule px-4 py-3">
          <button type="button" className="text-[13px] text-accent hover:text-accent-hover" onClick={() => setExpanded((e) => !e)}>
            {expanded ? `Show top ${collapsedCount}` : `Show all ${sorted.length} ${itemLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}
