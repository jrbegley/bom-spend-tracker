import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { VendorView } from './VendorPage';
import { loadCore } from '../test/realData';
const core = loadCore();
const html = (id: string) => r(<MemoryRouter><VendorView core={core} vendorId={id} /></MemoryRouter>);
const blocks = (h: string) => h.split('data-part="').slice(1);
const blockOf = (h: string, id: string) => blocks(h).find(t => t.startsWith(`${id}"`))!;

it('Proseware, Inc. (spec 6): header and headline numbers', () => {
  const h = html('1678');
  expect(h).toMatch(/<h1[^>]*>Proseware, Inc\.<\/h1>/); expect(h).toContain('href="/vendors"');
  expect(h).toContain('3 parts · Mountain, Road, Touring · 66,000 units bought');
  for (const s of ['$2.35M', '+$111.8K', 'above standard', 'Lowest price', '3 of 3']) expect(h).toContain(s);
});
it('Proseware, Inc. (spec 6): every crankarm against every vendor', () => {
  const h = html('1678');
  const hl = blockOf(h, '319');
  for (const s of ['$46.06', 'West Junction Cycles', '$46.42', 'Vision Cycles, Inc.', '$48.58', 'used in 21 bikes · 3 vendors', 'href="/parts/319"']) expect(hl).toContain(s);
  expect(blockOf(h, '318')).toContain('$33.58'); expect(blockOf(h, '318')).toContain('$36.10');
  expect(blockOf(h, '317')).toContain('$27.06'); expect(blockOf(h, '317')).toContain('$29.58');
  for (const id of ['319', '318', '317']) expect(blockOf(h, id)).toContain('Lowest price');
  expect(hl).toMatch(/href="\/vendors\/\d+"/);
  expect(h).toContain('<span>Quality</span>'); expect(h).toContain('<span>Spend by part · 3</span>');
});
it('single-source vendor: Superior Bicycles (spec 6)', () => {
  const h = html('1576');
  expect(blocks(h)).toHaveLength(2); for (const b of blocks(h)) { expect(b).toContain('Single source'); expect(b).not.toMatch(/href="\/vendors\/\d+"/); }
  expect(h).toContain('on all 2 parts'); expect(h).not.toContain('of 0');
});
it('vendor that supplies only non-BOM items', () => {
  const h = html('1636'); expect(h).toContain('Not on a BOM'); for (const b of blocks(h)) expect(b).not.toContain('used in');
});
it('negative PPV shows as is, with no above-standard note', () => {
  const h = html('1574'); expect(h).toContain('-$10.2K'); expect(h).not.toContain('above standard');
});
it('many parts: top 5 with Show all', () => {
  const h = html('1568'); expect(blocks(h)).toHaveLength(5); expect(h).toContain('Show all 14 parts');
});
it('unknown vendor', () => { expect(html('zzz')).toMatch(/<h1[^>]*>Vendor not found<\/h1>/); });

it('a lowest-price vendor whose total is not the lowest gets no green total (review fix)', () => {
  // Find a part where the cheapest unit price is not the cheapest price + reject cost.
  const hit = Object.values(core.parts).find(p => {
    if (p.vendorCount < 2) return false;
    const tot = (v: typeof p.vendors[number]) => v.avgPrice * (1 + (v.receivedQty ? v.rejectedQty / v.receivedQty : 0));
    const cheapest = p.vendors.reduce((a, b) => (b.avgPrice < a.avgPrice ? b : a));
    return p.vendors.some(v => tot(v) < tot(cheapest) - 0.01);
  })!;
  const cheapest = hit.vendors.reduce((a, b) => (b.avgPrice < a.avgPrice ? b : a));
  const total = cheapest.avgPrice * (1 + cheapest.rejectedQty / cheapest.receivedQty);
  const block = blockOf(html(cheapest.vendorId), hit.id);
  expect(block).toContain('Lowest price');
  const money = `$${total.toFixed(2)}`;
  expect(block).toContain(money);
  expect(block).not.toMatch(new RegExp(`text-savings-ink[^"]*">\\${money}`));
});
