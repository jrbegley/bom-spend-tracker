import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CoreData } from '../lib/data';
import { nextActive, searchAll, type SearchHit } from '../lib/search';

const TYPE_LABEL = { product: 'Product', part: 'Part', vendor: 'Vendor' } as const;

/** Search box with an ARIA combobox dropdown over products, parts and vendors. */
export function GlobalSearch({ core }: { core: CoreData }) {
  const navigate = useNavigate();
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(0);
  const hits = useMemo(() => searchAll(core, query), [core, query]);
  const showList = open && query.trim().length >= 2;

  const go = (hit: SearchHit) => {
    navigate(hit.href);
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && hits.length) {
      e.preventDefault();
      setActive(nextActive(active, e.key === 'ArrowDown' ? 'down' : 'up', hits.length, showList));
      setOpen(true);
    }
    else if (e.key === 'Enter' && showList && hits.length) { e.preventDefault(); go(hits[active] ?? hits[0]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="mb-1 block text-[12px] text-muted-foreground">Search</label>
      <input
        id={`${id}-input`} type="text" role="combobox" aria-expanded={showList} aria-controls={showList ? `${id}-list` : undefined}
        aria-autocomplete="list" aria-activedescendant={showList && hits.length ? `${id}-opt-${active}` : undefined}
        placeholder="Touring Rim, Road-650, Proseware" value={query} autoComplete="off"
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={onKeyDown} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        className="h-[38px] w-[300px] rounded-md border border-border bg-card px-3"
      />
      {showList && (
        <ul id={`${id}-list`} role="listbox" aria-label="Search results"
          className="absolute right-0 z-10 mt-1 w-[300px] overflow-hidden rounded-md border border-border bg-card">
          {hits.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">No matches</li>
          ) : hits.map((h, i) => (
            <li key={`${h.type}-${h.id}`} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); go(h); }} onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 ${i === active ? 'bg-primary-soft' : ''}`}>
              <span>{h.name}</span>
              <span className="text-[12px] text-muted-foreground">{TYPE_LABEL[h.type]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
