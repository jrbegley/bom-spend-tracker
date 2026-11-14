import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterChips, PageHeader, Panel } from '../components/primitives';
import { VendorTable } from '../components/VendorTable';
import { useCoreData, type Vendor } from '../lib/data';
import { filterByName } from '../lib/productGroups';

const LINES = ['Road', 'Mountain', 'Touring'] as const;
/** 'all', a product line, or 'none' for vendors that supply only non-BOM items. */
export type VendorLine = 'all' | 'none' | (typeof LINES)[number];

const inLine = (v: Vendor, line: string) => (line === 'all' ? true : line === 'none' ? v.lines.length === 0 : v.lines.includes(line));

type Props = {
  vendors: Vendor[]; query: string; onQueryChange: (q: string) => void;
  line: string; onLineChange: (l: string) => void; highlightId?: string;
};

export function VendorsView({ vendors, query, onQueryChange, line, onLineChange, highlightId }: Props) {
  const filtered = filterByName(vendors, query).filter((v) => inLine(v, line));
  const options = [
    { value: 'all', label: 'All' },
    ...LINES.map((l) => ({ value: l as string, label: l, count: vendors.filter((v) => v.lines.includes(l)).length })),
    { value: 'none', label: 'Not on a BOM', count: vendors.filter((v) => v.lines.length === 0).length },
  ];
  return (
    <div className="space-y-8">
      <PageHeader title="Vendors" meta={`${vendors.length} vendors · spend, PPV and reject rate across all parts`} />
      <Panel
        title="All vendors"
        subtitle="Largest PPV first. Open a vendor to compare its parts against every other vendor."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <FilterChips label="Product line" options={options} value={line} onChange={onLineChange} />
            <input type="search" aria-label="Filter vendors" placeholder="Filter by name" value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-[36px] w-[220px] rounded-md border border-input bg-card px-3 text-[14px]" />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <p className="px-6 py-4 text-muted-foreground">{`No vendors match “${query.trim()}”`}</p>
        ) : (
          <VendorTable bare key={`${highlightId ?? 'none'}-${line}`} mode="all" title="All vendors" vendors={filtered}
            collapsedCount={10} highlightId={highlightId} resetPageOn={`${query}|${line}`} />
        )}
      </Panel>
    </div>
  );
}

export default function Vendors() {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState('all');
  const [params, setParams] = useSearchParams();
  // The highlight is a one-time jump: the first filter change drops it, so clearing the filter later does not re-run it.
  const dropHighlight = () => { if (params.has('highlight')) setParams((p) => { p.delete('highlight'); return p; }, { replace: true }); };
  return (
    <VendorsView vendors={useCoreData().vendors} query={query} line={line}
      onQueryChange={(q) => { setQuery(q); dropHighlight(); }}
      onLineChange={(l) => { setLine(l); dropHighlight(); }}
      highlightId={params.get('highlight') ?? undefined} />
  );
}
