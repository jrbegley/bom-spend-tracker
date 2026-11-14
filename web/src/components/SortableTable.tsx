import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { highlightPage, nextSort, pageBounds, sortRows, syncPageState, type PageState, type SortState } from '../lib/sort';
import { Pagination } from './Pagination';

export type Column<T> = {
  key: string;                          // sort key
  label: string;                        // header text, sentence case
  numeric?: boolean;                    // right-align and default to descending
  value: (row: T) => number | string;   // used for sorting
  render?: (row: T) => ReactNode;       // cell content
  width?: string;
  headerExtra?: ReactNode;              // rendered after the sort arrow, inside the header button
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
  /** rowKey of a row to open on, scroll to and tint for 2s. Unknown keys are ignored. */
  highlightKey?: string;
  /** When this value changes the table returns to page 1. */
  resetPageOn?: unknown;
};

/** One sortable column header: <th scope="col"> with aria-sort and a button. */
export function SortHeader<T>({ column: c, sort, onSort }: { column: Column<T>; sort: SortState; onSort: (c: Column<T>) => void }) {
  const active = c.key === sort.key;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
      style={c.width ? { width: c.width } : undefined}
      className={`px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap ${c.numeric ? 'text-right' : 'text-left'}`}
    >
      <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort(c)}>{c.label}<span aria-hidden="true" className={active ? 'text-foreground' : 'text-[#A1A1AA]'}>{active ? (sort.dir === 'desc' ? '↓' : '↑') : '↕'}</span>{c.headerExtra}</button>
    </th>
  );
}

export function SortableTable<T>({
  columns, rows, rowKey, defaultSort, pageSize, rowClassName, collapsedCount, caption, itemLabel = 'rows', highlightKey, resetPageOn,
}: Props<T>) {
  const [sort, setSort] = useState<SortState>(defaultSort);
  const [pageState, setPageState] = useState<PageState>(() => {
    let page = 1;
    if (highlightKey !== undefined && pageSize) {
      const col = columns.find((c) => c.key === defaultSort.key);
      const ordered = col ? sortRows(rows, col.value, defaultSort.dir) : rows;
      page = highlightPage(ordered.findIndex((r) => rowKey(r) === highlightKey), pageSize);
    }
    return { page, token: resetPageOn };
  });
  // A changed filter (resetPageOn) means page 1. Stored during render so an earlier filter's page never comes back.
  const synced = syncPageState(pageState, resetPageOn);
  if (synced !== pageState) setPageState(synced);
  const page = synced.page;
  const [tinted, setTinted] = useState(highlightKey !== undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
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
    setPageState({ page: 1, token: resetPageOn });
  };

  useEffect(() => {
    if (highlightKey === undefined) return;
    wrapRef.current?.querySelector('[data-highlight]')?.scrollIntoView({ block: 'center' });
    const t = setTimeout(() => setTinted(false), 2000);
    return () => clearTimeout(t);
  }, [highlightKey]);

  return (
    <div ref={wrapRef}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <SortHeader key={c.key} column={c} sort={sort} onSort={onHeader} />
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-3 text-muted-foreground">Nothing to show</td></tr>
            )}
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                data-row-key={rowKey(row)}
                data-highlight={tinted && rowKey(row) === highlightKey ? 'true' : undefined}
                className={`border-b border-hairline last:border-b-0 hover:bg-muted ${tinted && rowKey(row) === highlightKey ? 'bg-primary-soft' : (rowClassName?.(row) ?? '')}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-2.5 align-top ${c.numeric ? 'text-right tabular-nums whitespace-nowrap' : 'text-left'}`}>{c.render ? c.render(row) : c.value(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bounds && sorted.length > 0 && (
        <Pagination
          start={bounds.start}
          end={bounds.end}
          total={sorted.length}
          itemLabel={itemLabel}
          onPrev={() => setPageState({ page: Math.max(1, bounds.page - 1), token: resetPageOn })}
          onNext={() => setPageState({ page: Math.min(Math.max(1, bounds.pageCount), bounds.page + 1), token: resetPageOn })}
        />
      )}
      {!bounds && collapsible && (
        <div className="border-t border-hairline px-4 py-3">
          <button type="button" className="text-[13px] text-primary hover:text-primary/80" onClick={() => setExpanded((e) => !e)}>
            {expanded ? `Show top ${collapsedCount}` : `Show all ${sorted.length} ${itemLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}
