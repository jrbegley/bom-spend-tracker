import { it, expect } from 'vitest';
import { groupProducts } from './productGroups';
import { readData } from '../test/realData';
import type { Product } from './data';
const P = readData<Product[]>('products.json');
const lines = (k: string, dir: 'asc' | 'desc') => groupProducts(P, { key: k, dir }).map(g => g.line);

it('default PPV desc: groups and their totals', () => {
  const g = groupProducts(P, { key: 'ppvTotal', dir: 'desc' });
  expect(g.map(x => x.line)).toEqual(['Road', 'Mountain', 'Touring']);
  expect(g.map(x => x.bikes.length)).toEqual([43, 32, 22]);
  expect(g[0]).toMatchObject({ units: 47107 }); expect(Math.abs(g[0].ppv - 1223525.5)).toBeLessThan(1);
  expect(g[0].bikes.slice(0, 2).map(b => b.name)).toEqual(['Road-250 Black, 44', 'Road-550-W Yellow, 48']);
  expect(g[2].bikes[0].name).toBe('Touring-1000 Blue, 60');
});
it('groups reorder by their totals for units / savings, by name for Product', () => {
  expect(lines('saveTotal', 'desc')).toEqual(['Touring', 'Road', 'Mountain']);
  expect(lines('units', 'desc')).toEqual(['Road', 'Mountain', 'Touring']);
  expect(lines('units', 'asc')).toEqual(['Touring', 'Mountain', 'Road']);
  expect(lines('name', 'asc')).toEqual(['Mountain', 'Road', 'Touring']);
});
it('other keys keep groups in PPV desc whatever the direction; bikes still sort', () => {
  expect(lines('costUnit', 'asc')).toEqual(['Road', 'Mountain', 'Touring']);
  const t = groupProducts(P, { key: 'costUnit', dir: 'asc' })[2].bikes;
  expect(t[0].costUnit).toBeLessThanOrEqual(t[1].costUnit);
});
