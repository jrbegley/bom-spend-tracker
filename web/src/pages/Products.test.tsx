import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProductsView } from './Products';
import { loadCore } from '../test/realData';
const { products } = loadCore();
const html = (q = '') => r(<MemoryRouter><ProductsView products={products} query={q} onQueryChange={() => {}} /></MemoryRouter>);
const links = (h: string) => (h.match(/href="\/products\/\d+"/g) ?? []).length;

it('every group expanded', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Products<\/h1>/); expect(h).toContain('aria-label="Filter products"');
  expect(links(h)).toBe(97); expect(h).not.toContain('Show all');
  expect(h).toMatch(/<td[^>]*whitespace-nowrap[^>]*>Road · 43 bikes<\/td>/);
});
it('filter narrows groups and recounts them', () => {
  const h = html('blue');
  expect(links(h)).toBe(13); expect(h).toContain('Touring · 13 bikes'); expect(h).not.toContain('Road ·');
});
it('no matches', () => { expect(html('zzz')).toContain('No products match “zzz”'); });
