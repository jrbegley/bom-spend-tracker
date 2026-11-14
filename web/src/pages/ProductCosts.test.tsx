import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductCostsView } from './ProductCosts';
import { loadCore } from '../test/realData';
const core = loadCore();
const html = (line: string | null = null) => r(<MemoryRouter><ProductCostsView core={core} line={line} onLineChange={() => {}} /></MemoryRouter>);
const bikeHrefs = (h: string) => [...h.matchAll(/href="(\/products\/\d+)"/g)].map(m => m[1]);
const rowOf = (h: string, href: string) => h.split('<tr').find(t => t.includes(`href="${href}"`))!;

it('header and the three headline numbers (E5)', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Product costs<\/h1>/);
  for (const s of ['April 2022 to September 2025', '97 bikes · purchased material, actual cost vs standard', 'Standard cost', '$57.73M',
    '97 bikes · 90,120 units built', 'Total variance', '+$2.89M', '5.0% above standard', 'Verified', '100%', 'Pending $0']) expect(h).toContain(s);
});
it('ranked by total variance, top 10, each row its own page', () => {
  const h = html();
  expect(h).toContain('Bikes ranked by total variance'); expect(h).toContain('Show all 97 bikes');
  const hrefs = bikeHrefs(h); expect(hrefs).toHaveLength(10); expect(new Set(hrefs).size).toBe(10); expect(hrefs[0]).toBe('/products/782');
  const top = rowOf(h, '/products/782'); for (const s of ['Mountain-200 Black, 38', '$79.5K', '+$26.72', '+5.0%', 'width:100%']) expect(top).toContain(s);
});
it('PPV-only driver legend for now', () => { const h = html(); expect(h).toContain('>PPV<'); expect(h).not.toContain('Warranty'); expect(h).not.toContain('Rejects'); });
it('line filter: Touring', () => {
  const h = html('Touring');
  expect(h).toContain('Show all 22 bikes'); expect(bikeHrefs(h)[0]).toBe('/products/969');
  // ranks are numbered within the filtered list (plan Task 4: rankByVariance(filtered))
  expect(rowOf(h, '/products/969')).toMatch(/text-muted-foreground">1<\/span>/);
  expect(h).toMatch(/aria-pressed="true"[^>]*>Touring<span[^>]*>22<\/span>/); expect(h).toMatch(/aria-pressed="false"[^>]*>All lines/);
});
