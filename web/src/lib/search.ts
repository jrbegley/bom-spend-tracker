// Global search across products, parts and vendors (BUILD_SPEC.md section 6.2).
import type { CoreData, Part } from './data';

export type SearchHit = { type: 'product' | 'part' | 'vendor'; id: string; name: string; href: string };

/**
 * The active option after an arrow key. While the list is open the arrows wrap; when it is
 * closed (after Escape or blur) the list opens on the first hit (down) or the last hit (up).
 */
export function nextActive(active: number, dir: 'down' | 'up', count: number, open: boolean): number {
  if (count === 0) return 0;
  if (!open) return dir === 'down' ? 0 : count - 1;
  return dir === 'down' ? (active + 1) % count : (active - 1 + count) % count;
}

const TYPE_ORDER ={ product: 0, part: 1, vendor: 2 } as const;

/**
 * Up to `limit` case-insensitive substring matches on name. Needs 2+ characters after trimming.
 * Names that start with the query come first, then products before parts before vendors, then by name.
 */
export function searchAll(core: CoreData, query: string, limit = 8): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const all: SearchHit[] = [
    ...core.products.map((p): SearchHit => ({ type: 'product', id: p.id, name: p.name, href: `/products/${p.id}` })),
    ...Object.values(core.parts).map((p): SearchHit => ({ type: 'part', id: p.id, name: p.name, href: `/parts/${p.id}` })),
    ...core.vendors.map((v): SearchHit => ({ type: 'vendor', id: v.id, name: v.name, href: `/vendors/${v.id}` })),
  ];
  return all
    .filter((h) => h.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const pa = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const pb = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return pa - pb || TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

/** Parts only, for picking the right part in Match review: 2+ characters, prefix matches first, then by name. */
export function searchParts(parts: Record<string, Part>, query: string, limit = 6): { id: string; name: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return Object.values(parts)
    .filter((p) => p.name.toLowerCase().includes(q))
    .map((p) => ({ id: p.id, name: p.name, prefix: p.name.toLowerCase().startsWith(q) ? 0 : 1 }))
    .sort((a, b) => a.prefix - b.prefix || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ id, name }) => ({ id, name }));
}
