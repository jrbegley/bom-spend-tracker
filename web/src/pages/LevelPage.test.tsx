import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LevelView, LevelPageBody } from './LevelPage';
import { loadCore, readData } from '../test/realData';
import type { BomNode } from '../lib/data';
const core = loadCore(); const bom = readData<BomNode>('bom/969.json');
const html = (path: string[]) => r(<MemoryRouter><LevelView core={core} bom={bom} path={path} /></MemoryRouter>);
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(`>${name}<`))!;

it('bike level: /products/969 (section 10)', () => {
  const h = html([]);
  expect(h).toMatch(/<h1[^>]*>Touring-1000 Blue, 60<\/h1>/);
  expect(h).toContain('1,116 units built · 48 purchased parts · 44 vendors · April 2022 to September 2025');
  for (const s of ['Actual cost per bike', '$854.82', 'vs $814.12 standard', 'Variance per bike', '+$40.71', '+5.0% above standard',
    'Total variance', '+$45.4K', 'across 1,116 bikes', 'From standard to actual cost, per bike', 'Axis starts at $730.00']) expect(h).toContain(s);
  expect(h).toContain('Assemblies and parts'); expect(h).toContain('Show all 14 components');
  expect(h).toContain('Vendors for this bike');
});
it('both wheels are highlighted (tie on largest savings)', () => {
  const h = html([]);
  expect(h.match(/<tr[^>]*bg-savings-soft/g)).toHaveLength(2);
  for (const w of ['Touring Front Wheel', 'Touring Rear Wheel']) {
    const row = rowOf(h, w);
    expect(row).toContain('bg-savings-soft'); expect(row).toMatch(/font-semibold[^>]*>\$12\.36/);
    expect(row).toContain('8 parts · includes Touring Rim'); expect(row).toContain('>Made<'); expect(row).toContain('14.5%');
  }
  expect(rowOf(h, 'Touring Front Wheel')).toContain('href="/products/969/821"');
});
it('bought children link to part detail', () => {
  expect(rowOf(html([]), 'HL Crankset')).toContain('>Made<');
  const h = html(['821']);
  expect(rowOf(h, 'Touring Rim')).toContain('href="/parts/513"'); expect(rowOf(h, 'Touring Rim')).toContain('>Bought<');
});
it('assembly level: /products/969/821', () => {
  const h = html(['821']);
  expect(h).toMatch(/<h1[^>]*>Touring Front Wheel<\/h1>/);
  expect(h).toContain('Made in-house · 8 purchased parts · 1 per bike');
  for (const s of ['$124.16', '+$5.91', 'Axis starts at $100.00']) expect(h).toContain(s);
  expect(h).toContain('<span aria-current="page">Touring Front Wheel</span>');
  expect(h).toContain('href="/products/969"'); expect(h).toContain('Vendors for this assembly');
  expect(h).toContain('Spend on these parts across all products');
  expect(h).not.toContain('Show all'); // 7 children < 8
  expect(rowOf(h, 'Touring Rim')).toContain('bg-savings-soft');
  expect(h).toContain('title="Volume-weighted average across all vendors, April 2022 to September 2025"');
});
it('bad node path', () => {
  const h = html(['999']);
  expect(h).toMatch(/<h1[^>]*>Assembly not found<\/h1>/); expect(h).toContain('href="/products/969"');
});

it('insight banner on 969, before the collapsed vendor section (E6)', () => {
  const h = html([]);
  expect(h).toContain('Harmonizing it saves $346.5K across 22 bikes.'); expect(h).toContain('>Open Touring Rim<');
  expect(h.indexOf('Harmonizing')).toBeLessThan(h.indexOf('<details'));
  expect(h).toMatch(/<details[^>]*>\s*<summary[^>]*><span>Vendors for this bike · 44<\/span><svg[^>]*group-open:rotate-180/);
});
it('vendor section: rows link to vendor pages and the title is not repeated inside', () => {
  const h = html([]); const inside = h.slice(h.indexOf('<details'));
  expect(inside).toMatch(/href="\/vendors\/\d+"/); expect(inside).not.toMatch(/<h2[^>]*>Vendors for this bike<\/h2>/);
});
it('no banner on the seat assembly', () => { expect(html(['522'])).not.toContain('Harmonizing'); });
const body = (productId: string, bomState: object) => r(<MemoryRouter><LevelPageBody core={core} productId={productId} nodePath={[]} bom={bomState} /></MemoryRouter>);
it('LevelPageBody states', () => {
  expect(body('zzz', { loading: true })).toMatch(/<h1[^>]*>Product not found<\/h1>/);
  expect(body('969', { loading: false, error: new Error('Failed to load bom/969.json (500)') })).toContain('Could not load this product');
  expect(body('969', { loading: true })).toMatch(/role="status"[^>]*>Loading…/);
  expect(body('969', { loading: false, error: new Error('x') })).toContain('role="alert"');
  expect(body('969', { loading: false, data: bom })).toMatch(/<h1[^>]*>Touring-1000 Blue, 60<\/h1>/);
});
