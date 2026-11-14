import { it, expect } from 'vitest';
import { costHeadline, rankByVariance } from './productCosts';
import { readData } from '../test/realData';
import { money, pct } from './format';
import type { Product } from './data';
const P = readData<Product[]>('products.json');

it('headline', () => {
  const h = costHeadline(P);
  expect(money(h.standard)).toBe('$57.73M'); expect(money(h.variance)).toBe('$2.89M');
  expect(pct(h.varianceShare)).toBe('5.0%'); expect(h.bikes).toBe(97); expect(h.units).toBe(90120);
});
it('rank by total variance', () => {
  const r = rankByVariance(P);
  expect(r[0]).toMatchObject({ id: '782', name: 'Mountain-200 Black, 38', rank: 1 });
  expect(r.find(p => p.id === '969')!.rank).toBe(12);
  expect(r.map(p => p.rank)).toEqual(r.map((_, i) => i + 1));
});
