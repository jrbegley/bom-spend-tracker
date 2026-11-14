import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
const r = (el: ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);
import { VendorTable } from './VendorTable';
import { readData } from '../test/realData';
import type { Part, Vendor } from '../lib/data';

const vendors = readData<Vendor[]>('vendors.json'); const parts = readData<Record<string, Part>>('parts.json');
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;

it('all-spend mode: Overview vendor table', () => {
  const h = r(<VendorTable mode="all" vendors={vendors} title="Vendors" />);
  expect(h).toContain('1 to 8 of 86 vendors');
  const sup = rowOf(h, 'Superior Bicycles');
  expect(sup).toContain('$4.56M'); expect(sup).toContain('$216.9K'); expect(sup).toContain('2 parts');
  expect(sup).toMatch(/text-destructive[^>]*>5\.2%/);
  for (const label of ['Vendor', 'Spend', 'Product lines', 'PPV', 'vs cheapest', 'Reject rate', 'Single-source']) expect(h).toContain(`>${label}<`);
});
it('all-spend mode: Not on a BOM, warn tint', () => {
  const v = { ...vendors[0], id: 'x', name: 'Resale Co', lines: [], vsCheapest: 0.25 };
  const row = rowOf(r(<VendorTable mode="all" vendors={[v]} title="Vendors" />), 'Resale Co');
  expect(row).toContain('Not on a BOM'); expect(row).toContain('bg-caution-soft');
});
it('parts mode: Touring Rim vendors', () => {
  const h = r(<VendorTable mode="parts" partIds={['513']} parts={parts} title="Vendors for this assembly" />);
  expect(h).toContain('Spend on these parts across all products');
  const prem = rowOf(h, 'Premier Sport, Inc.');
  expect(prem).toContain('+47.4%'); expect(prem).toContain('bg-caution-soft'); expect(prem).toContain('1 part: Touring Rim');
  expect(h).toContain('Lowest');
  expect(h).not.toContain('>Product lines<');
});
