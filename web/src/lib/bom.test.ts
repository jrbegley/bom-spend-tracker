import { it, expect } from 'vitest';
import { findNode, levelTrail, levelMeta, componentNote, childHref } from './bom';
import { readData } from '../test/realData';
import type { BomNode, Part } from './data';
const bom = readData<BomNode>('bom/969.json'); const parts = readData<Record<string, Part>>('parts.json');
const P = 'April 2022 to September 2025';

it('findNode walks the path and rejects bad ids', () => {
  expect(findNode(bom, [])!.node.id).toBe('969');
  const f = findNode(bom, ['821'])!; expect(f.node.name).toBe('Touring Front Wheel'); expect(f.chain.map(n => n.id)).toEqual(['969', '821']);
  expect(findNode(bom, ['821', '513'])!.node.name).toBe('Touring Rim');
  expect(findNode(bom, ['999'])).toBeNull(); expect(findNode(bom, ['821', '999'])).toBeNull();
});
it('levelTrail', () => {
  expect(levelTrail(findNode(bom, ['821'])!.chain, 'Touring')).toEqual([
    { label: 'Product costs', to: '/' }, { label: 'Touring', to: '/?line=Touring' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }]);
});
it('levelMeta (spec 7.3 copy)', () => {
  expect(levelMeta([bom], parts, P)).toBe('1,116 units built · 48 purchased parts · 44 vendors · April 2022 to September 2025');
  expect(levelMeta(findNode(bom, ['821'])!.chain, parts, P)).toBe('Made in-house · 8 purchased parts · 1 per bike');
});
it('componentNote (D5)', () => {
  const wheel = findNode(bom, ['821'])!.node;
  expect(componentNote(wheel, parts)).toBe('8 parts · includes Touring Rim');
  const bought = (id: string) => ({ id, name: parts[id].name, made: false, children: [], leafParts: [{ partId: id, qtyPerUnit: 1 }] } as unknown as BomNode);
  expect(componentNote(bought('513'), parts)).toBe('2 vendors');
  expect(componentNote(bought('1'), parts)).toBe('Single source');      // Adjustable Race, one vendor
});
it('childHref', () => {
  const c = findNode(bom, ['821'])!;
  expect(childHref([bom], c.node)).toBe('/products/969/821');
  expect(childHref(c.chain, findNode(bom, ['821', '513'])!.node)).toBe('/parts/513');
});

it('levelMeta uses singular "part" for one purchased part', () => {
  const one = { ...findNode(bom, ['821'])!.node, qty: 2, leafParts: [{ partId: '513', qtyPerUnit: 2 }] };
  expect(levelMeta([bom, one], parts, P)).toBe('Made in-house · 1 purchased part · 2 per bike');
  const bike = { ...bom, leafParts: [{ partId: '1', qtyPerUnit: 1 }] }; // Adjustable Race: one vendor
  expect(levelMeta([bike], parts, P)).toBe('1,116 units built · 1 purchased part · 1 vendor · April 2022 to September 2025');
});

import { boughtRedirect } from './bom';
it('boughtRedirect keeps the level trail', () => {
  expect(boughtRedirect(findNode(bom, ['821', '513'])!.chain, 'Touring')).toEqual({ to: '/parts/513', state: { trail: [
    { label: 'Product costs', to: '/' }, { label: 'Touring', to: '/?line=Touring' },
    { label: 'Touring-1000 Blue, 60', to: '/products/969' }, { label: 'Touring Front Wheel', to: '/products/969/821' }] } });
  expect(boughtRedirect(findNode(bom, ['821'])!.chain, 'Touring')).toBeNull();
});
