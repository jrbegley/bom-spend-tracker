import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PartView } from './PartDetail';
import { loadCore } from '../test/realData';
const core = loadCore();
const html = (id: string, trail?: { label: string; to?: string }[]) => r(<MemoryRouter><PartView core={core} partId={id} trail={trail} /></MemoryRouter>);
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;

it('Touring Rim header, KPIs, default breadcrumb', () => {
  const h = html('513');
  expect(h).toMatch(/<h1[^>]*>Touring Rim<\/h1>/); expect(h).toContain('2 vendors · used in 22 bikes · Bought');
  for (const s of ['$1.82M', '$86.9K', '$346.5K', '5.4%']) expect(h).toContain(s);
  expect(h).toContain('href="/"'); expect(h).toContain('<span>Parts</span>'); expect(h).toContain('<span aria-current="page">Touring Rim</span>');
});
it('breadcrumb keeps the level-page trail', () => {
  const h = html('513', [{ label: 'Overview', to: '/' }, { label: 'Touring', to: '/products' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]);
  expect(h).toContain('href="/products/969/821"'); expect(h).not.toContain('<span>Parts</span>');
});
it('vendor prices (section 10: $26.60 and $39.20)', () => {
  const h = html('513');
  const and = rowOf(h, "Anderson&#x27;s Custom Bikes"), prem = rowOf(h, 'Premier Sport, Inc.');
  expect(and).toContain('$26.60'); expect(and).toContain('bg-savings'); expect(and).toContain('Lowest'); expect(and).toContain('28,050');
  expect(and).toMatch(/text-reject[^>]*>5\.5%/);
  expect(prem).toContain('$39.20'); expect(prem).toContain('bg-ppv'); expect(prem).toContain('+47.4%'); expect(prem).toContain('27,500');
  expect(h.indexOf('Premier Sport, Inc.')).toBeLessThan(h.indexOf('Anderson&#x27;s Custom Bikes')); // PPV desc
});
it('savings simulator default 100%', () => {
  const h = html('513');
  expect(h).toContain('Move this share of volume to the cheapest vendor');
  expect(h).toMatch(/<input[^>]*type="range"/); expect(h).toContain('step="5"'); expect(h).toContain('value="100"');
  expect(h).toContain('Saves $346.5K'); expect(h).toContain('Across 22 bikes'); expect(h).toContain('aria-live="polite"');
});
it('where used', () => {
  const h = html('513');
  const row = rowOf(h, 'href="/products/969"');
  for (const s of ['Touring-1000 Blue, 60', 'Touring', '>2<', '1,116', '7.6%', '$138.1K']) expect(row).toContain(s);
  expect(h).toContain('Show all 22 bikes');
});
it('edge parts: single vendor, not on a BOM, unknown id', () => {
  expect(html('1')).toContain('Only one vendor supplies this part'); expect(html('1')).not.toContain('type="range"');
  const off = html('341'); expect(off).toContain('Not on a BOM'); expect(off).toContain('Not used on any bike&#x27;s BOM');
  expect(html('zzz')).toMatch(/<h1[^>]*>Part not found<\/h1>/);
});

it('vendor prices row gets the warn tint when vs cheapest is over 20% (spec 5.4)', () => {
  const h = html('513');
  expect(rowOf(h, 'Premier Sport, Inc.')).toContain('bg-warn-tint');
  expect(rowOf(h, "Anderson&#x27;s Custom Bikes")).not.toContain('bg-warn-tint');
});
