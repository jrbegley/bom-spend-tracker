import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VendorTable } from '../components/VendorTable';
import { useCoreData, type Vendor } from '../lib/data';

type Props = { vendors: Vendor[]; query: string; onQueryChange: (q: string) => void; highlightId?: string };

export function VendorsView({ vendors, query, onQueryChange, highlightId }: Props) {
  const q = query.trim().toLowerCase();
  const filtered = q ? vendors.filter((v) => v.name.toLowerCase().includes(q)) : vendors;
  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold">Vendors</h1>
      <input type="search" aria-label="Filter vendors" placeholder="Filter by name" value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="h-[38px] w-[300px] rounded-input border border-border bg-surface px-3" />
      {filtered.length === 0 ? (
        <p className="text-text-secondary">{`No vendors match “${query.trim()}”`}</p>
      ) : (
        <VendorTable key={highlightId ?? 'none'} mode="all" title="All vendors" vendors={filtered}
          highlightId={highlightId} resetPageOn={query} />
      )}
    </div>
  );
}

export default function Vendors() {
  const [query, setQuery] = useState('');
  const [params] = useSearchParams();
  return <VendorsView vendors={useCoreData().vendors} query={query} onQueryChange={setQuery} highlightId={params.get('highlight') ?? undefined} />;
}
