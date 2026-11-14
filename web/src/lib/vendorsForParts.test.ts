import { it, expect } from 'vitest';
import { vendorsForParts } from './vendorsForParts';
import { readData } from '../test/realData';
import type { Part, BomNode } from './data';

const pv = (vendorId: string, o: Partial<Record<'spend'|'std'|'premium'|'rejectedQty'|'receivedQty', number>> = {}) =>
  ({ vendorId, name: `Vendor ${vendorId}`, qty: 1, spend: 100, std: 90, ppv: 10, avgPrice: 1, premium: 0, rejectedQty: 1, receivedQty: 10, ...o });
const part = (id: string, name: string, vendors: ReturnType<typeof pv>[]) =>
  ({ id, name, vendors, vendorCount: vendors.length } as unknown as Part);
const fx: Record<string, Part> = {
  a: part('a', 'Rear Brakes', [pv('1'), pv('2', { premium: 20 })]),
  b: part('b', 'Front Brakes', [pv('1')]),
  c: part('c', 'Chain', [pv('1', { receivedQty: 0, rejectedQty: 0 })]),
};

it('aggregates by vendor', () => {
  const v1 = vendorsForParts(['a', 'b'], fx).find(v => v.vendorId === '1')!;
  expect(v1).toMatchObject({ spend: 200, std: 180, ppv: 20, vsCheapest: 0, rejectRate: 0.1, singleSource: 1,
    partsLabel: '2 parts: Front Brakes, Rear Brakes' });
  expect(vendorsForParts(['a'], fx).find(v => v.vendorId === '2')!.vsCheapest).toBeCloseTo(20 / 80);
});
it('labels 1 part and +N more', () => {
  expect(vendorsForParts(['b'], fx)[0].partsLabel).toBe('1 part: Front Brakes');
  expect(vendorsForParts(['a', 'b', 'c'], fx).find(v => v.vendorId === '1')!.partsLabel).toBe('3 parts: Chain, Front Brakes +1 more');
});
it('guards: zero received, duplicate ids, unknown ids', () => {
  expect(vendorsForParts(['c'], fx)[0].rejectRate).toBe(0);
  expect(vendorsForParts(['b', 'b'], fx)[0].spend).toBe(100);
  expect(vendorsForParts(['b', 'zzz'], fx)).toHaveLength(1);
});
it('real data: Premier Sport is +47.4% vs cheapest in the Touring-1000 Blue, 60 table', () => {
  const parts = readData<Record<string, Part>>('parts.json');
  const bom = readData<BomNode>('bom/969.json');
  const prem = vendorsForParts(bom.leafParts.map(l => l.partId), parts).find(v => v.name === 'Premier Sport, Inc.')!;
  expect(Math.abs(prem.vsCheapest - 0.474)).toBeLessThanOrEqual(0.0005);
});
