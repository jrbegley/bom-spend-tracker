import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { VendorsView } from './Vendors';
import { loadCore } from '../test/realData';
const { vendors } = loadCore();
const html = (query = '', highlightId?: string) =>
  r(<MemoryRouter><VendorsView vendors={vendors} query={query} onQueryChange={() => {}} highlightId={highlightId} /></MemoryRouter>);

it('full list and filter input', () => {
  const h = html();
  expect(h).toMatch(/<h1[^>]*>Vendors<\/h1>/); expect(h).toContain('aria-label="Filter vendors"');
  expect(h).toContain('1 to 8 of 86 vendors');
});
it('name filter is case-insensitive and trimmed', () => {
  const h = html('  PROSEWARE ');
  expect(h).toContain('Proseware, Inc.'); expect(h).toContain('1 to 1 of 1 vendors');
});
it('filter that matches nothing', () => {
  const h = html('zzz'); expect(h).toContain('No vendors match “zzz”'); expect(h).not.toContain('of 0 vendors');
});
it('?highlight opens the right page and tints the row (Premier Sport is 27th by PPV)', () => {
  const h = html('', '1682');
  expect(h).toContain('25 to 32 of 86 vendors');
  const row = h.split('<tr').find(t => t.includes('Premier Sport, Inc.'))!;
  expect(row).toContain('bg-accent-tint'); expect(row).toContain('data-highlight="true"');
});
it('unknown or filtered-out highlight: page 1, no tint', () => {
  for (const h of [html('', 'nope'), html('pro', '1682')]) { expect(h).toMatch(/1 to \d+ of \d+ vendors/); expect(h).not.toContain('data-highlight'); }
});
