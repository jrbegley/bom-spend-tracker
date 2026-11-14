import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { CoreDataProvider } from '../lib/data';
import { loadCore } from '../test/realData';
const core = loadCore();
const shell = (url: string) => renderToStaticMarkup(
  <CoreDataProvider value={core}><MemoryRouter initialEntries={[url]}><AppShell>x</AppShell></MemoryRouter></CoreDataProvider>);
const activeLinks = (html: string) => [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>(?:<svg.*?<\/svg>)?([^<]+)</g)].map(m => m[1]);

it('marks the current section, including detail pages', () => {
  expect(activeLinks(shell('/'))).toEqual(['Product costs']);
  expect(activeLinks(shell('/products/969/821'))).toEqual(['Product costs']);
  expect(activeLinks(shell('/parts/513'))).toEqual(['Product costs']);
  expect(activeLinks(shell('/vendors'))).toEqual(['Savings']);
  expect(activeLinks(shell('/match-review'))).toEqual(['Match review']);
});
it('three-item nav with the serif wordmark', () => {
  const h = shell('/');
  for (const l of ['Product costs', 'Savings', 'Match review']) expect(h).toContain(`>${l}<`);
  for (const old of ['>Overview<', '>Products<', '>Vendors<', '>Opportunities<']) expect(h).not.toContain(old);
  expect(h).toMatch(/font-serif[^>]*>Spendline</);
});
it('top bar: search, disabled year and Assumptions placeholders, content width', () => {
  const h = shell('/');
  expect(h).toMatch(/<select[^>]*disabled[^>]*>/); expect(h).toContain('All years');
  expect(h).toMatch(/<button[^>]*disabled[^>]*>Assumptions<\/button>/);
  expect(h).toContain('role="combobox"'); expect(h).toContain('max-w-[1120px]');
});
