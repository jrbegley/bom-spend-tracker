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
  expect(activeLinks(shell('/vendors'))).toEqual(['Vendors']);
  expect(activeLinks(shell('/vendors/1678'))).toEqual(['Vendors']);
  expect(activeLinks(shell('/match-review'))).toEqual(['Match review']);
});
it('four-item nav with the serif wordmark', () => {
  const h = shell('/');
  for (const l of ['Product costs', 'Savings', 'Vendors', 'Match review']) expect(h).toContain(`>${l}<`);
  expect(h.match(/<li>/g)).toHaveLength(4);
  for (const old of ['>Overview<', '>Products<', '>Opportunities<']) expect(h).not.toContain(old);
  expect(h).toMatch(/font-serif[^>]*>Common Thread</);
});
it('top bar: sample-data line with hover sentence, no year or Assumptions controls by default', () => {
  const h = shell('/');
  expect(h).toContain('Sample data: AdventureWorks, Microsoft&#x27;s demo ERP for a fictional bike maker');
  expect(h).toContain('title="Every figure is a real calculation on that dataset; no real company spent or saved this money."');
  expect(h).not.toMatch(/<select/); expect(h).not.toContain('>Assumptions<');
  expect(h).toContain('role="combobox"'); expect(h).toContain('max-w-[1120px]');
});
it('5c flag on: year select and Assumptions button come back disabled', () => {
  const h = renderToStaticMarkup(<CoreDataProvider value={core}><MemoryRouter initialEntries={["/"]}><AppShell showYearAndAssumptions>x</AppShell></MemoryRouter></CoreDataProvider>);
  expect(h).toMatch(/<select[^>]*disabled[^>]*>/); expect(h).toContain('All years');
  expect(h).toMatch(/<button[^>]*disabled[^>]*>Assumptions<\/button>/);
});
