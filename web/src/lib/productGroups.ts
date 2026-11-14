// Grouping and group-aware sorting for the product table (BUILD_SPEC.md section 7.1).
import type { Product } from './data';
import { sortRows, type SortState } from './sort';

export type ProductGroup = { line: string; bikes: Product[]; units: number; ppv: number; savings: number };

type NumKey = 'units' | 'costUnit' | 'vsStd' | 'ppvTotal' | 'saveTotal';
const bikeValue = (key: string) => (p: Product): number | string =>
  key === 'name' ? p.name : (p[key as NumKey] ?? 0);

/**
 * Bikes sorted within each line by `sort`. Groups reorder by their own totals for units / PPV / savings,
 * by line name for Product, and by PPV (largest first) for every other column.
 */
export function groupProducts(products: Product[], sort: SortState): ProductGroup[] {
  const byLine = new Map<string, Product[]>();
  for (const p of products) byLine.set(p.line, [...(byLine.get(p.line) ?? []), p]);

  const groups: ProductGroup[] = [...byLine].map(([line, bikes]) => ({
    line,
    bikes: sortRows(bikes, bikeValue(sort.key), sort.dir),
    units: bikes.reduce((a, b) => a + b.units, 0),
    ppv: bikes.reduce((a, b) => a + b.ppvTotal, 0),
    savings: bikes.reduce((a, b) => a + b.saveTotal, 0),
  }));

  switch (sort.key) {
    case 'units': return sortRows(groups, (g) => g.units, sort.dir);
    case 'ppvTotal': return sortRows(groups, (g) => g.ppv, sort.dir);
    case 'saveTotal': return sortRows(groups, (g) => g.savings, sort.dir);
    case 'name': return sortRows(groups, (g) => g.line, sort.dir);
    default: return sortRows(groups, (g) => g.ppv, 'desc');
  }
}

/** Trimmed, case-insensitive substring match on `name`. An empty query returns every row. */
export function filterByName<T extends { name: string }>(rows: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
}
