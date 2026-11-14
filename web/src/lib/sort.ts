// Sorting and paging logic for SortableTable (BUILD_SPEC.md sections 6.3 and 8.3).

export type SortDir = 'asc' | 'desc';
export type SortState = { key: string; dir: SortDir };

/** Stable sort into a new array. Ties keep input order in both directions. */
export function sortRows<T>(rows: T[], value: (r: T) => number | string, dir: SortDir): T[] {
  const m = dir === 'desc' ? -1 : 1;
  return rows
    .map((row, i) => ({ row, i, v: value(row) }))
    .sort((a, b) => {
      const c = typeof a.v === 'string' || typeof b.v === 'string'
        ? String(a.v).localeCompare(String(b.v))
        : a.v - b.v;
      return c !== 0 ? c * m : a.i - b.i;
    })
    .map((d) => d.row);
}

/** Same key flips direction; a new numeric key starts desc, a new text key starts asc. */
export function nextSort(current: SortState, key: string, numeric: boolean): SortState {
  if (current.key === key) return { key, dir: current.dir === 'desc' ? 'asc' : 'desc' };
  return { key, dir: numeric ? 'desc' : 'asc' };
}

/** Clamp page to 1..max(1, pageCount); start is 0-based inclusive, end exclusive. */
export function pageBounds(total: number, pageSize: number, page: number) {
  const pageCount = Math.ceil(total / pageSize);
  const p = Math.min(Math.max(1, page), Math.max(1, pageCount));
  const start = Math.min((p - 1) * pageSize, total);
  return { page: p, pageCount, start, end: Math.min(start + pageSize, total) };
}
