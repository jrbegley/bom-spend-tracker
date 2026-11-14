import { it, expect } from 'vitest';
import { searchAll, searchParts } from './search';
import { loadCore } from '../test/realData';
const core = loadCore();
const names = (q: string) => searchAll(core, q).map(h => h.name);

it('needs 2+ characters after trimming', () => { expect(searchAll(core, 'r')).toEqual([]); expect(searchAll(core, '   ')).toEqual([]); });
it('parts, sorted by name, trimmed and case-insensitive', () => {
  expect(names('  RIM ')).toEqual(['HL Mountain Rim', 'HL Road Rim', 'LL Mountain Rim', 'LL Road Rim', 'ML Mountain Rim', 'ML Road Rim', 'Touring Rim']);
  expect(searchAll(core, 'touring rim')[0]).toEqual({ type: 'part', id: '513', name: 'Touring Rim', href: '/parts/513' });
});
it('caps at 8', () => {
  const h = searchAll(core, 'road-650'); expect(h).toHaveLength(8); expect(h.every(x => x.type === 'product')).toBe(true);
});
it('vendor hits link to the highlighted vendors page', () => {
  expect(searchAll(core, 'proseware')).toEqual([{ type: 'vendor', id: '1678', name: 'Proseware, Inc.', href: '/vendors/1678' }]);
});
it('prefix matches rank first, then products before parts', () => {
  const h = searchAll(core, 'tour'); expect(h[0].type).toBe('product'); expect(h[0].name.startsWith('Touring')).toBe(true);
});
it('no matches', () => { expect(searchAll(core, 'zzzz')).toEqual([]); });

import { nextActive } from './search';
it('nextActive: arrows wrap while open; opening starts at the first (down) or last (up) hit', () => {
  expect(nextActive(0, 'down', 5, true)).toBe(1);
  expect(nextActive(4, 'down', 5, true)).toBe(0);
  expect(nextActive(0, 'up', 5, true)).toBe(4);
  expect(nextActive(0, 'down', 5, false)).toBe(0); // after Escape: first hit, not the second
  expect(nextActive(2, 'down', 5, false)).toBe(0);
  expect(nextActive(0, 'up', 5, false)).toBe(4);
  expect(nextActive(0, 'down', 0, true)).toBe(0);
});

it('searchParts: parts only, 2+ characters, prefix first then name, capped at 6', () => {
  expect(searchParts(core.parts, 'c')).toEqual([]);
  expect(searchParts(core.parts, ' crank ').map(p => p.name)).toEqual(['HL Crankarm', 'LL Crankarm', 'ML Crankarm']);
  expect(searchParts(core.parts, 'touring rim')[0]).toEqual({ id: '513', name: 'Touring Rim' });
  expect(searchParts(core.parts, 'zzzz')).toEqual([]); expect(searchParts(core.parts, 'nut')).toHaveLength(6);
});
