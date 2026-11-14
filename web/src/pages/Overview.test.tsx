import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OverviewView } from './Overview';
import { loadCore } from '../test/realData';
const html = () => r(<MemoryRouter><OverviewView core={loadCore()} /></MemoryRouter>);

it('header', () => {
  expect(html()).toMatch(/<h1[^>]*>Spend overview<\/h1>/);
  expect(html()).toContain('April 2022 to September 2025 · purchased material · blended prices');
});
it('KPI tiles (section 5.3 money rule, D1)', () => {
  const h = html();
  for (const s of ['Material spend', '$63.79M', '86 vendors · 8,845 PO lines', 'Tied to a BOM', '95.0%', '$60.61M across 97 bikes',
                   'Paid above standard (PPV)', '$2.97M', '4.9% over vendor standard prices', 'Savings at best price', '$890.0K',
                   'If each part came from its cheapest vendor']) expect(h).toContain(s);
  expect(h).toContain('aria-valuenow="95"');
});
it('PPV by product line', () => {
  const h = html();
  expect(h).toContain('title="Product-line figures cover BOM-tied spend only"');
  expect(h).toContain('$1.22M · 43 bikes'); expect(h).toContain('$1.14M · 32 bikes'); expect(h).toContain('$523.8K · 22 bikes');
  expect(h).toContain('width:100%');
  expect(h).toMatch(/text-savings font-semibold[^>]*>Touring \$427\.1K/);
  expect(h).toContain('Road $242.4K'); expect(h).toContain('Mountain $201.5K');
});

it('row 2: products, top opportunities, match queue', () => {
  const h = html();
  expect(h).toContain('Show all 43 Road bikes');
  const opp = h.split('Top opportunities')[1];
  expect(opp).toContain('href="/parts/513"'); expect(opp).toContain('Touring Rim'); expect(opp).toContain('>Price gap<');
  expect(opp).toContain('2 vendors · in 22 bikes'); expect(opp).toMatch(/text-savings[^>]*>\$346\.5K/);
  for (const n of ['HL Crankarm', 'HL Road Rim', 'LL Crankarm', 'ML Crankarm']) expect(opp).toContain(n);
  expect(opp).toContain('href="/opportunities"');
  expect(h).toContain('5% of spend is not on a BOM'); expect(h).toContain('$3.18M to review in the match queue');
  expect(h).toMatch(/<a[^>]*href="\/match-review"[^>]*border-dashed|<a[^>]*border-dashed[^>]*href="\/match-review"/);
});
it('row 3: vendor table', () => {
  expect(html()).toContain('1 to 8 of 86 vendors');
});
