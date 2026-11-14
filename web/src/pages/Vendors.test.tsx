import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { VendorsView } from './Vendors';
import { loadCore } from '../test/realData';
const { vendors } = loadCore();
const html = (query = '', highlightId?: string, line: string = 'all') =>
  r(<MemoryRouter><VendorsView vendors={vendors} query={query} onQueryChange={() => {}} line={line} onLineChange={() => {}} highlightId={highlightId} /></MemoryRouter>);
const vendorHrefs = (h: string) => [...h.matchAll(/href="(\/vendors\/\d+)"/g)].map(m => m[1]);
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;

it('header, filters, top 10 with Show all, every row links to its vendor page (V3)', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Vendors<\/h1>/); expect(h).toContain('aria-label="Filter vendors"');
  expect(h).toContain('Show all 86 vendors');
  const hrefs = vendorHrefs(h); expect(hrefs).toHaveLength(10); expect(new Set(hrefs).size).toBe(10);
  expect(h).toMatch(/aria-pressed="true"[^>]*>All/); for (const c of ['Road', 'Mountain', 'Touring', 'Not on a BOM']) expect(h).toContain(`>${c}<`);
});
it('line chip: Not on a BOM', () => {
  const h = html('', undefined, 'none');
  expect(h).toContain('Show all 20 vendors'); expect(h).toMatch(/aria-pressed="true"[^>]*>Not on a BOM/);
});
it('name filter is case-insensitive and trimmed', () => {
  const h = html('  PROSEWARE '); expect(h).toContain('href="/vendors/1678"'); expect(vendorHrefs(h)).toHaveLength(1);
});
it('filter that matches nothing', () => {
  const h = html('zzz'); expect(h).toContain('No vendors match “zzz”'); expect(h).not.toContain('Show all');
});
it('?highlight beyond the top 10 opens expanded with the row tinted (Premier Sport is 27th by PPV)', () => {
  const h = html('', '1682'); expect(h).toContain('Show top 10');
  const row = rowOf(h, 'Premier Sport, Inc.'); expect(row).toContain('bg-primary-soft'); expect(row).toContain('data-highlight="true"');
  expect(row).not.toContain('bg-caution-soft');
});
it('unknown or filtered-out highlight: collapsed, no tint', () => {
  for (const h of [html('', 'nope'), html('pro', '1682')]) expect(h).not.toContain('data-highlight');
  expect(html('', 'nope')).toContain('Show all 86 vendors');
});
