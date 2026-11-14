import { it, expect } from 'vitest';
import { vendorParts, vendorSummary } from './vendorParts';
import { readData } from '../test/realData';
import { unitMoney } from './format';
import type { Part } from './data';
const parts = readData<Record<string, Part>>('parts.json');

it('Proseware: three crankarms by spend, every vendor of each part', () => {
  const r = vendorParts('1678', parts);
  expect(r.map(x => x.partName)).toEqual(['HL Crankarm', 'ML Crankarm', 'LL Crankarm']);
  expect(r[0].offers.map(o => [o.name, unitMoney(o.unitPrice)])).toEqual([['Proseware, Inc.', '$46.06'], ['West Junction Cycles', '$46.42'], ['Vision Cycles, Inc.', '$48.58']]);
  expect(r[1].offers.map(o => unitMoney(o.unitPrice))).toEqual(['$33.58', '$36.10']); expect(r[2].offers.map(o => unitMoney(o.unitPrice))).toEqual(['$27.06', '$29.58']);
  expect(r.every(x => x.lowestPrice)).toBe(true); expect(r[0]).toMatchObject({ bikes: 21, vendorCount: 3, singleSource: false });
  expect(r[0].me.rejectCost).toBeCloseTo(r[0].me.rejectRate * r[0].me.unitPrice, 6);
  expect(vendorSummary(r)).toEqual({ units: 66000, compared: 3, lowestOn: 3, singleSource: 0 });
});
it('Superior Bicycles: all single-source', () => {
  const r = vendorParts('1576', parts); expect(r).toHaveLength(2); expect(r.every(x => x.singleSource && x.offers.length === 1)).toBe(true);
  expect(vendorSummary(r)).toMatchObject({ compared: 0, singleSource: 2 });
});
it('Custom Frames supplies 14 parts; unknown vendor gives []', () => {
  expect(vendorParts('1568', parts)).toHaveLength(14); expect(vendorParts('zzz', parts)).toEqual([]);
});
it('a vendor that is not the cheapest on a part', () => {
  const visionId = parts['319'].vendors.find(v => v.name === 'Vision Cycles, Inc.')!.vendorId;
  const row = vendorParts(visionId, parts).find(x => x.partId === '319')!;
  expect(row.lowestPrice).toBe(false); expect(row.me.name).toBe('Vision Cycles, Inc.');
});
