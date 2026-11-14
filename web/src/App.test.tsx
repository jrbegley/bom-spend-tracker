import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { CoreDataProvider } from './lib/data';
import { loadCore } from './test/realData';
const core = loadCore();
const at = (url: string) => renderToStaticMarkup(<CoreDataProvider value={core}><MemoryRouter initialEntries={[url]}><AppRoutes /></MemoryRouter></CoreDataProvider>);

it.each([['/', 'Spend overview'], ['/products', 'Products'], ['/opportunities', 'Opportunities'],
         ['/vendors', 'Vendors'], ['/match-review', 'Match review'], ['/parts/513', 'Part 513'], ['/nope', 'Page not found']])
  ('%s renders h1 %s', (url, text) => expect(at(url)).toMatch(new RegExp(`<h1[^>]*>${text}`)));
it('level page shows its loading state until the BOM file arrives', () => {
  expect(at('/products/969')).toContain('Loading…');
  expect(at('/products/969/821')).toContain('Loading…');
});
