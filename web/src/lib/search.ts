// Global search across products, parts and vendors (BUILD_SPEC.md section 6.2).
import type { CoreData } from './data';

export type SearchHit = { type: 'product' | 'part' | 'vendor'; id: string; name: string; href: string };

const TYPE_ORDER = { product: 0, part: 1, vendor: 2 } as const;

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
    ...core.vendors.map((v): SearchHit => ({ type: 'vendor', id: v.id, name: v.name, href: `/vendors?highlight=${v.id}` })),
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
