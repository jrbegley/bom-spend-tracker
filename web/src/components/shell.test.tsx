import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
const shell = (url: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[url]}><AppShell>x</AppShell></MemoryRouter>);
const activeLinks = (html: string) => [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>([^<]+)</g)].map(m => m[1]);

it('marks only the current section active', () => {
  expect(activeLinks(shell('/vendors'))).toEqual(['Vendors']);
  expect(activeLinks(shell('/'))).toEqual(['Overview']);
  expect(activeLinks(shell('/products/969/821'))).toEqual(['Products']);
});
it('has the Pipeline group and Match review', () => {
  const h = shell('/'); expect(h).toContain('Spendline'); expect(h).toContain('Pipeline'); expect(h).toContain('Match review');
});
it('content width: 1180 on Overview, 1280 elsewhere', () => {
  expect(shell('/')).toContain('max-w-[1180px]'); expect(shell('/vendors')).toContain('max-w-[1280px]');
});
