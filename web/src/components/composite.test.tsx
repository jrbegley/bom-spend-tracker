import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { VendorTable } from './VendorTable'; import { CostSummary } from './CostSummary';
import { readData } from '../test/realData';
import type { Part, Vendor } from '../lib/data';

const vendors = readData<Vendor[]>('vendors.json'); const parts = readData<Record<string, Part>>('parts.json');
const rowOf = (h: string, name: string) => h.split('<tr').find(t => t.includes(name))!;

it('all-spend mode: Overview vendor table', () => {
  const h = r(<VendorTable mode="all" vendors={vendors} title="Vendors" />);
  expect(h).toContain('1 to 8 of 86 vendors');
  const sup = rowOf(h, 'Superior Bicycles');
  expect(sup).toContain('$4.56M'); expect(sup).toContain('$216.9K'); expect(sup).toContain('2 parts');
  expect(sup).toMatch(/text-reject[^>]*>5\.2%/);
  for (const label of ['Vendor', 'Spend', 'Product lines', 'PPV', 'vs cheapest', 'Reject rate', 'Single-source']) expect(h).toContain(`>${label}<`);
});
it('all-spend mode: Not on a BOM, warn tint', () => {
  const v = { ...vendors[0], id: 'x', name: 'Resale Co', lines: [], vsCheapest: 0.25 };
  const row = rowOf(r(<VendorTable mode="all" vendors={[v]} title="Vendors" />), 'Resale Co');
  expect(row).toContain('Not on a BOM'); expect(row).toContain('bg-warn-tint');
});
it('parts mode: Touring Rim vendors', () => {
  const h = r(<VendorTable mode="parts" partIds={['513']} parts={parts} title="Vendors for this assembly" />);
  expect(h).toContain('Spend on these parts across all products');
  const prem = rowOf(h, 'Premier Sport, Inc.');
  expect(prem).toContain('+47.4%'); expect(prem).toContain('bg-warn-tint'); expect(prem).toContain('1 part: Touring Rim');
  expect(h).toContain('Lowest');
  expect(h).not.toContain('>Product lines<');
});
it('CostSummary for Touring-1000 Blue, 60', () => {
  const h = r(<CostSummary node={{ costUnit: 854.8243, stdUnit: 814.1184, ppvUnit: 40.7059, saveUnit: 30.0055 }} units={1116} />);
  for (const s of ['Material cost per unit', '$854.82', 'Standard per unit', '$814.12', 'PPV per unit', '+$40.71',
                   '+5.0% · $45.4K total', 'Savings at best price', '$30.01', 'per unit · $33.5K total', '>Blended<']) expect(h).toContain(s);
});

import { LinePpvCard as LinePpvCardA11y } from './LinePpvCard';
import type { Summary } from '../lib/data';
it('LinePpvCard line buttons contain no block elements (no div inside button)', () => {
  const h = r(<LinePpvCardA11y lines={readData<Summary>('summary.json').lines} />);
  for (const b of h.split('<button').slice(1)) expect(b.split('</button>')[0]).not.toContain('<div');
});
