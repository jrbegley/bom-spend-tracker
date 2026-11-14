import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Chip, FilterChips, PageHeader, Panel, Stat, StatRow } from './primitives';

it('PageHeader: eyebrow, crumbs, h1, meta', () => {
  const h = r(<MemoryRouter><PageHeader eyebrow="April 2022 to September 2025" crumbs={[{ label: 'Product costs', to: '/' }, { label: 'X' }]}
    title="Touring Rim" meta="2 vendors" /></MemoryRouter>);
  expect(h).toContain('April 2022 to September 2025'); expect(h).toContain('aria-label="Breadcrumb"');
  expect(h).toMatch(/<h1[^>]*text-\[28px\][^>]*>Touring Rim<\/h1>/); expect(h).toContain('2 vendors');
});
it('StatRow and Stat', () => {
  const h = r(<StatRow><Stat label="Standard cost" value="$57.73M" caption="97 bikes" /><Stat label="Variance" value="+$2.89M" tone="ppv" />
    <Stat label="Saving" value="$1" tone="savings" extra={<i>B</i>} /></StatRow>);
  expect(h).toContain('grid-cols-3'); for (const s of ['Standard cost', '$57.73M', '97 bikes', '<i>B</i>']) expect(h).toContain(s);
  expect(h).toMatch(/text-ppv-ink[^>]*>\+\$2\.89M/); expect(h).toMatch(/text-savings-ink[^>]*>\$1</);
});
it('Panel: title, subtitle, actions, footer', () => {
  const h = r(<Panel title="Bikes" subtitle="Where it sits" actions={<b>A</b>} footer={<em>F</em>}>body</Panel>);
  expect(h).toMatch(/<h2[^>]*>Bikes<\/h2>/); for (const s of ['Where it sits', '<b>A</b>', '<em>F</em>', 'body']) expect(h).toContain(s);
});
it('FilterChips: group, pressed state, counts', () => {
  const h = r(<FilterChips label="Product line" value="all" onChange={() => {}}
    options={[{ value: 'all', label: 'All lines' }, { value: 'Road', label: 'Road', count: 43 }]} />);
  expect(h).toContain('role="group"'); expect(h).toContain('aria-label="Product line"');
  expect(h).toMatch(/aria-pressed="true"[^>]*>All lines/); expect(h).toMatch(/aria-pressed="false"[^>]*>Road<span[^>]*>43<\/span>/);
});
it('Chip', () => { expect(r(<Chip tone="savings">Lowest price</Chip>)).toMatch(/bg-savings-soft[^>]*>Lowest price</); });
