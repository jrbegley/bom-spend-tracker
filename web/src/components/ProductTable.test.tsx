import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductTable } from './ProductTable';
import { readData } from '../test/realData';
import type { Product } from '../lib/data';
const P = readData<Product[]>('products.json');
const html = (n?: number) => r(<MemoryRouter><ProductTable products={P} collapsedPerGroup={n} /></MemoryRouter>);

it('collapsed overview table', () => {
  const h = html(2);
  expect(h).toContain('Road · 43 bikes'); expect(h).toContain('47,107'); expect(h).toContain('$1.22M');
  expect(h).toContain('Show all 43 Road bikes'); expect(h).toContain('Show all 22 Touring bikes');
  expect(h.match(/href="\/products\/\d+"/g)).toHaveLength(6);
  expect(h).toContain('href="/products/969"');
  expect(h.match(/bg-group-row/g)!.length).toBeGreaterThanOrEqual(3);
});
it('columns, badge, aria-sort', () => {
  const h = html(2);
  for (const l of ['Product', 'Units built', 'Material / unit', 'vs standard', 'PPV', 'Best-price savings']) expect(h).toContain(`>${l}<`);
  expect(h).toContain('>Blended<'); expect(h.match(/aria-sort="descending"/g)).toHaveLength(1);
  const row = h.split('<tr').find(t => t.includes('Touring-1000 Blue, 60'))!;
  for (const s of ['1,116', '$854.82', '+5.0%', '$45.4K', '$33.5K']) expect(row).toContain(s);
});
it('uncollapsed shows all 97 bikes and no expand buttons', () => {
  const h = html(); expect(h.match(/href="\/products\/\d+"/g)).toHaveLength(97); expect(h).not.toContain('Show all');
});
