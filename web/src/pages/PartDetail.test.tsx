import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PartView } from './PartDetail';
import { loadCore } from '../test/realData';
const core = loadCore();
const html = (id: string, trail?: { label: string; to?: string }[]) => r(<MemoryRouter><PartView core={core} partId={id} trail={trail} /></MemoryRouter>);
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;
const cardOf = (h: string, name: string) => h.split('data-vendor').find(t => t.includes(name))!;

it('Touring Rim header, KPIs, default breadcrumb', () => {
  const h = html('513');
  expect(h).toMatch(/<h1[^>]*>Touring Rim<\/h1>/); expect(h).toContain('2 vendors · used in 22 bikes · Bought');
  for (const s of ['$1.82M', '$86.9K', '$346.5K', '5.4%']) expect(h).toContain(s);
  expect(h).toContain('href="/"'); expect(h).toContain('<span>Parts</span>'); expect(h).toContain('<span aria-current="page">Touring Rim</span>');
});
it('breadcrumb keeps the level-page trail', () => {
  const h = html('513', [{ label: 'Overview', to: '/' }, { label: 'Touring', to: '/?line=Touring' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]);
  expect(h).toContain('href="/products/969/821"'); expect(h).not.toContain('<span>Parts</span>');
});
it('vendor comparison cards: price and reject rate (E8)', () => {
  const h = html('513');
  const and = cardOf(h, "Anderson&#x27;s Custom Bikes"), prem = cardOf(h, 'Premier Sport, Inc.');
  for (const x of ['$26.60', 'Lowest price', '28,050', 'bg-savings-soft']) expect(and).toContain(x);
  expect(and).toMatch(/text-destructive[^>]*>5\.5%/);
  expect(prem).toContain('$39.20'); expect(prem).toMatch(/text-caution font-semibold[^>]*>\+47\.4%/); expect(prem).toContain('27,500');
  expect(prem).not.toContain('Lowest price');
  expect(h.indexOf('Anderson&#x27;s Custom Bikes')).toBeLessThan(h.indexOf('Premier Sport, Inc.')); // cheapest first
});
it('savings simulator default 100%', () => {
  const h = html('513');
  expect(h).toContain('Move this share of volume to the cheapest vendor');
  expect(h).toMatch(/<input[^>]*type="range"/); expect(h).toContain('step="5"'); expect(h).toContain('value="100"');
  expect(h).toContain('Saves $346.5K'); expect(h).toContain('Across 22 bikes'); expect(h).toContain('aria-live="polite"');
  expect(h).toContain('Estimated savings');
});
it('where used', () => {
  const h = html('513');
  const row = rowOf(h, 'href="/products/969"');
  for (const s of ['Touring-1000 Blue, 60', 'Touring', '>2<', '1,116', '7.6%', '$138.1K']) expect(row).toContain(s);
  expect(h).toContain('Show all 22 bikes');
});
it('edge parts: single vendor, not on a BOM, unknown id', () => {
  const one = html('1');
  expect(one).toContain('Single source');
  for (const x of ['Savings simulator', 'type="range"', 'Best-price savings', 'Price vs lowest']) expect(one).not.toContain(x);
  const off = html('341'); expect(off).toContain('Not on a BOM'); expect(off).toContain('Not used on any bike&#x27;s BOM');
  expect(html('zzz')).toMatch(/<h1[^>]*>Part not found<\/h1>/);
});

it('two vendors at the same price: no saving, no simulator (rev2 10.3)', () => {
  const h = html('908');
  expect(h).toContain('Same price from every vendor');
  for (const x of ['Savings simulator', 'type="range"', 'Best-price savings']) expect(h).not.toContain(x);
});
it('where used is collapsed behind a summary', () => {
  expect(html('513')).toMatch(/<details[^>]*>\s*<summary[^>]*>Bikes that use this part · 22<\/summary>/);
});
