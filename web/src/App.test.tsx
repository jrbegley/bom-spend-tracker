import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
const at = (url: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[url]}><AppRoutes /></MemoryRouter>);

it.each([['/', 'Spend overview'], ['/products', 'Products'], ['/opportunities', 'Opportunities'],
         ['/vendors', 'Vendors'], ['/match-review', 'Match review'], ['/parts/513', 'Part 513'], ['/nope', 'Page not found']])
  ('%s renders h1 %s', (url, text) => expect(at(url)).toMatch(new RegExp(`<h1[^>]*>${text}`)));
it('level page walks the node path', () => {
  expect(at('/products/969')).toMatch(/<h1[^>]*>Level page/);
  expect(at('/products/969')).toContain('969');
  expect(at('/products/969/821')).toContain('969 / 821');
});
