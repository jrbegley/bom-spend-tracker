import { it, expect, describe } from 'vitest';
import { readData } from '../test/realData';
import {
  effectiveCost, deliveredCost, admits, stayReason, yearlySaving, networkRows, networkSummary,
  type MemberPart, type NetworkPart,
} from './network';

const members = readData<MemberPart[]>('network_member.json');
const network = readData<NetworkPart[]>('network_synthetic.json');
const rows = networkRows(members, network);

const mem = (o: Partial<MemberPart> = {}): MemberPart => ({
  id: 'x', name: 'X', family: 'Fastener', onBom: false, unit: 'case', unitCode: 'CS',
  yearlyQty: 100, avgPrice: 50, rejectRate: 0, yearlySpend: 5000, leadTimeDays: 10, minOrderQty: 5, ...o,
});
const net = (o: Partial<NetworkPart> = {}): NetworkPart => ({
  id: 'x', synthetic: true, multiple: 20, networkYearlyQty: 2000, discount: 0.2, pooledPrice: 40, distributorFee: 1.6,
  freightPerUnit: 1, leadTimeDays: 8, minOrderQty: 5, memberCount: 12,
  rebateTiers: [{ minNetworkQty: 2300, rebatePct: 0.02 }, { minNetworkQty: 2700, rebatePct: 0.04 }], ...o,
});

describe('networkRows on the real files', () => {
  it('one row per pool part, in member order', () => {
    expect(rows).toHaveLength(125);
    expect(rows.map((r) => r.member.id)).toEqual(members.map((m) => m.id));
  });
  it('Chainring Bolts: effective cost and delivered cost add up', () => {
    const r = rows.find((x) => x.member.id === '320')!;
    expect(r.effective).toBeCloseTo(47.4784 * 1.008, 3);
    expect(r.delivered).toBeCloseTo(r.network.pooledPrice + r.network.distributorFee + r.network.freightPerUnit, 6);
    expect(r.admitted).toBe(true);
  });
  it('admitted rows save money; staying rows save nothing and say why', () => {
    for (const r of rows) {
      if (r.admitted) { expect(r.delivered).toBeLessThan(r.effective); expect(r.saving).toBeGreaterThan(0); expect(r.reason).toBeNull(); }
      else { expect(r.saving).toBe(0); expect(r.reason).toEqual(expect.any(String)); }
    }
  });
  it('a member with no network record is dropped, with no NaN', () => {
    const r = networkRows(members, network.slice(0, -1));
    expect(r).toHaveLength(124);
    expect(JSON.stringify(r)).not.toContain('null,null');
    for (const x of r) expect(Number.isFinite(x.delivered) && Number.isFinite(x.saving)).toBe(true);
  });
});

describe('networkSummary', () => {
  const s = networkSummary(rows);
  it('eligible spend is the real yearly figure', () => { expect(s.partCount).toBe(125); expect(s.eligibleSpend).toBeCloseTo(136841, -1); });
  it('at least two parts fail, and joining + staying covers every part', () => { expect(s.staying).toBeGreaterThanOrEqual(2); expect(s.joining + s.staying).toBe(125); });
  it('saving is the sum of row savings', () => { expect(s.saving).toBeCloseTo(rows.reduce((a, r) => a + r.saving, 0), 6); expect(s.saving).toBeGreaterThan(0); });
  it('volume multiple is network spend at your prices over yours, within 15-40', () => {
    expect(s.volumeMultiple).toBeCloseTo(s.networkSpendAtYourPrices / s.eligibleSpend, 6);
    expect(s.volumeMultiple).toBeGreaterThanOrEqual(15); expect(s.volumeMultiple).toBeLessThanOrEqual(40);
  });
  it('empty input gives zeros, not NaN', () => { expect(networkSummary([]).volumeMultiple).toBe(0); });
});

describe('the admission test, branch by branch', () => {
  it('effective cost adds the reject rate; delivered cost adds fee and freight', () => {
    expect(effectiveCost(mem({ avgPrice: 50, rejectRate: 0.02 }))).toBeCloseTo(51, 6);
    expect(deliveredCost(net())).toBeCloseTo(42.6, 6);
  });
  it('admits when delivered beats effective and lead time and minimum order are no worse', () => {
    expect(admits(mem(), net())).toBe(true);
    expect(yearlySaving(mem(), net())).toBeCloseTo((50 - 42.6) * 100, 6);
  });
  it('lead time longer than yours: stays, with the lead-time reason', () => {
    const n = net({ leadTimeDays: 14 });
    expect(admits(mem(), n)).toBe(false); expect(yearlySaving(mem(), n)).toBe(0);
    expect(stayReason(mem(), n)).toBe("Network lead time is longer than your current vendor's");
  });
  it('minimum order above yours: stays, with the minimum-order reason', () => {
    expect(stayReason(mem(), net({ minOrderQty: 50 }))).toBe('Network minimum order is above what you order now');
  });
  it('freight eats the saving: stays, with the freight reason', () => {
    const n = net({ freightPerUnit: 9 });
    expect(admits(mem(), n)).toBe(false);
    expect(stayReason(mem(), n)).toBe('Freight at your order size outweighs the pooled price');
  });
  it('pooled price alone does not beat what you pay: stays, with that reason', () => {
    expect(stayReason(mem({ avgPrice: 40 }), net())).toBe("The pooled price doesn't beat what you pay now");
  });
  it('an admitted part has no reason', () => { expect(stayReason(mem(), net())).toBeNull(); });
});
