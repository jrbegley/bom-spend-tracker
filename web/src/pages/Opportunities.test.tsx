import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OpportunitiesView } from './Opportunities';
import { readData } from '../test/realData';
import type { Opportunity } from '../lib/data';
const O = readData<Opportunity[]>('opportunities.json');
const html = (opps = O) => r(<MemoryRouter><OpportunitiesView opportunities={opps} lever="all" onLeverChange={() => {}} /></MemoryRouter>);

it('header, chips, running total', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Opportunities<\/h1>/); expect(h).toContain('Price gaps across all products');
  expect(h).toMatch(/<button[^>]*aria-pressed="true"[^>]*>All<\/button>/);
  expect(h).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Price gap<\/button>/);
  expect(h).not.toContain('>Quality cost<');
  expect(h).toContain('$890.0K across 139 parts');
});
it('table: savings desc, paged by 20, columns', () => {
  const h = html();
  expect(h).toContain('1 to 20 of 139 parts');
  for (const c of ['Part', 'Lever', 'Savings', 'Vendors', 'Bikes affected', 'Best price', 'Highest price']) expect(h).toContain(`>${c}<`);
  const row = h.split('<tr').find(t => t.includes('href="/parts/513"'))!;
  for (const s of ['Touring Rim', '>Price gap<', '$346.5K', '>2<', '>22<', '$26.60', '$39.20']) expect(row).toContain(s);
  expect(h.indexOf('Touring Rim')).toBeLessThan(h.indexOf('HL Crankarm'));
  expect(h).toContain('aria-sort="descending"');
});
it('Bikes affected says Not on a BOM for resale parts', () => {
  const resale = O.filter(o => o.productCount === 0).slice(0, 1);
  expect(html(resale)).toContain('Not on a BOM');
});
