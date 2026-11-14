import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { KpiTile } from './KpiTile'; import { BlendedBadge } from './BlendedBadge';
import { MadeBoughtTag } from './MadeBoughtTag'; import { LeverChip } from './LeverChip'; import { Breadcrumb } from './Breadcrumb';

it('KpiTile', () => {
  const h = r(<KpiTile label="Tied to a BOM" value="95.0%" caption="$60.6M across 97 bikes" progress={0.9502} />);
  expect(h).toContain('95.0%'); expect(h).toContain('$60.6M across 97 bikes');
  expect(h).toContain('role="progressbar"'); expect(h).toContain('aria-valuenow="95"');
  expect(r(<KpiTile label="PPV" value="$2.97M" tone="ppv" />)).toContain('text-ppv-ink');
  expect(r(<KpiTile label="x" value="1" size="md" />)).toContain('text-[26px]');
});
it('BlendedBadge has the exact tooltip', () => {
  expect(r(<BlendedBadge />)).toContain('title="Volume-weighted average across all vendors, April 2022 to September 2025"');
  expect(r(<BlendedBadge />)).toContain('>Blended<');
});
it('tags and chips', () => {
  expect(r(<MadeBoughtTag made />)).toContain('>Made<'); expect(r(<MadeBoughtTag made={false} />)).toContain('>Bought<');
  expect(r(<LeverChip lever="price_gap" />)).toContain('>Price gap<'); expect(r(<LeverChip lever="quality_cost" />)).toContain('>Quality cost<');
});
it('Breadcrumb links every segment but the last', () => {
  const h = r(<MemoryRouter><Breadcrumb items={[{ label: 'Overview', to: '/' }, { label: 'Touring', to: '/products' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]} /></MemoryRouter>);
  expect(h).toContain('aria-label="Breadcrumb"');
  expect(h.match(/<a /g)).toHaveLength(3);
  expect(h).toContain('<span aria-current="page">Touring Front Wheel</span>');
});
