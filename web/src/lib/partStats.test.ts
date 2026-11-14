import { it, expect } from 'vitest';
import { hasSaving, partRejectRate, vendorVsCheapest, simulatedSavings, partMeta } from './partStats';
import { readData } from '../test/realData';
import { money, pct } from './format';
import type { Part } from './data';
const parts = readData<Record<string, Part>>('parts.json');
it('Touring Rim figures', () => {
  expect(pct(partRejectRate(parts['513']))).toBe('5.4%');
  const prem = parts['513'].vendors.find(v => v.name === 'Premier Sport, Inc.')!;
  expect(Math.abs(vendorVsCheapest(prem) - 0.474)).toBeLessThanOrEqual(0.0005);
  expect(vendorVsCheapest(parts['513'].vendors.find(v => v.premium === 0)!)).toBe(0);
});
it('simulator math (section 10: 50% → $173.3K)', () => {
  expect(money(simulatedSavings(346500, 50))).toBe('$173.3K');
  expect(money(simulatedSavings(346500, 100))).toBe('$346.5K');
  expect(simulatedSavings(346500, 0)).toBe(0);
});
it('partMeta', () => {
  expect(partMeta(parts['513'])).toBe('2 vendors · used in 22 bikes · Bought');
  expect(partMeta(parts['341'])).toBe('3 vendors · Not on a BOM · Bought');
  expect(partMeta(parts['1'])).toMatch(/^1 vendor · used in \d+ bikes · Bought$/);
});
it('reject rate with nothing received is 0', () => {
  expect(partRejectRate({ ...parts['513'], vendors: parts['513'].vendors.map(v => ({ ...v, receivedQty: 0, rejectedQty: 0 })) })).toBe(0);
});

it('hasSaving', () => {
  expect(hasSaving(parts['513'])).toBe(true); expect(hasSaving(parts['1'])).toBe(false); expect(hasSaving(parts['908'])).toBe(false);
});
