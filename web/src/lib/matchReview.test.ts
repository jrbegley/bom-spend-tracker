import { it, expect } from 'vitest';
import { readData } from '../test/realData';
import type { Part, Unmapped } from './data';
import { band, decide, feedbackSummary, resolve, reviewProgress, NOT_A_BOM_PART, type Decisions, type MatchExample } from './matchReview';

const M = readData<MatchExample[]>('match_examples.json');
const P = readData<Record<string, Part>>('parts.json');
const U = readData<Unmapped[]>('unmapped.json');

it('six lines with unique ids, uom and price', () => {
  expect(M).toHaveLength(6);
  expect(new Set(M.map((m) => m.id)).size).toBe(6);
  for (const m of M) {
    expect(m.raw.length).toBeGreaterThan(0);
    expect(m.uom).toMatch(/^[A-Z]{2,3}$/);
    expect(m.price).toBeGreaterThan(0);
  }
});

it('three candidates each, sorted by confidence, real part ids and names', () => {
  for (const m of M) {
    expect(m.candidates).toHaveLength(3);
    m.candidates.forEach((c, i) => {
      expect(c.confidence).toBeGreaterThanOrEqual(0);
      expect(c.confidence).toBeLessThanOrEqual(1);
      if (i > 0) expect(c.confidence).toBeLessThanOrEqual(m.candidates[i - 1].confidence);
      if (c.partId !== undefined) expect(P[c.partId]?.name).toBe(c.name);
      else expect(c.name).toBe(NOT_A_BOM_PART);
    });
  }
});

it('the vendor really supplies the matched part', () => {
  for (const m of M) {
    const top = m.candidates[0];
    const partId = top.partId ?? m.sourcePartId!;
    expect(P[partId].vendors.map((v) => v.name)).toContain(m.vendor);
  }
});

it('exactly one low-confidence line and one resale line from unmapped.json', () => {
  expect(M.filter((m) => m.candidates[0].confidence < 0.6)).toHaveLength(1);
  const resale = M.filter((m) => m.candidates[0].name === NOT_A_BOM_PART);
  expect(resale).toHaveLength(1);
  expect(U.map((u) => u.partId)).toContain(resale[0].sourcePartId);
});

it('the first sample is the Touring Rim line from spec 7.7', () => {
  expect(M[0]).toMatchObject({ raw: 'RIM TRG 700C ALU BLK', vendor: 'Premier Sport, Inc.', uom: 'EA', price: 39.2 });
  expect(M[0].candidates.map((c) => c.partId)).toEqual(['513', '512', '509']);
});

const byId = Object.fromEntries(M.map((e) => [e.id, e]));
const top = { choice: { kind: 'candidate' as const, rank: 1 }, reasons: [] };
const manual = { choice: { kind: 'manual' as const }, reasons: [] };

it('decide sets, overwrites and clears one id without touching others', () => {
  const a = decide({}, 'm1', top);
  expect(a).toEqual({ m1: top });
  const b = decide(a, 'm2', manual);
  expect(b).toEqual({ m1: top, m2: manual });
  expect(decide(b, 'm1', manual)).toEqual({ m1: manual, m2: manual });
  expect(decide(b, 'm1', null)).toEqual({ m2: manual });
  expect(a).toEqual({ m1: top }); // not mutated
});

it('reviewProgress counts decisions for known lines only', () => {
  expect(reviewProgress(M, {})).toBe('0 of 6 reviewed');
  expect(reviewProgress(M, { [M[0].id]: top, [M[1].id]: manual, stale: top })).toBe('2 of 6 reviewed');
});

it('resolve: confirmed, corrected or manual', () => {
  expect(resolve(byId.m1, { kind: 'candidate', rank: 1 })).toEqual({ outcome: 'confirmed', partName: 'Touring Rim' });
  expect(resolve(byId.m5, { kind: 'candidate', rank: 2 })).toEqual({ outcome: 'corrected', partName: 'ML Crankarm' });
  expect(resolve(byId.m5, { kind: 'part', partId: '319', partName: 'HL Crankarm' })).toEqual({ outcome: 'confirmed', partName: 'HL Crankarm' });
  expect(resolve(byId.m5, { kind: 'part', partId: '320', partName: 'Chainring Bolts' })).toEqual({ outcome: 'corrected', partName: 'Chainring Bolts' });
  expect(resolve(byId.m6, { kind: 'not_bom' })).toEqual({ outcome: 'confirmed', partName: NOT_A_BOM_PART });
  expect(resolve(byId.m1, { kind: 'not_bom' })).toEqual({ outcome: 'corrected', partName: NOT_A_BOM_PART });
  expect(resolve(byId.m2, { kind: 'manual' })).toEqual({ outcome: 'manual', partName: null });
});

it('band', () => { expect([band(0.91), band(0.79), band(0.6), band(0.48)]).toEqual(['High', 'Medium', 'Medium', 'Low']); });

it('feedbackSummary: outcomes, override rate by band, reasons; undo clears its reasons', () => {
  let d: Decisions = {};
  d = decide(d, 'm1', top);
  d = decide(d, 'm5', { choice: { kind: 'candidate', rank: 2 }, reasons: ['Wrong size or variant'] });
  d = decide(d, 'm2', { choice: { kind: 'manual' }, reasons: ['Unit of measure mismatch', 'Wrong size or variant'] });
  const s = feedbackSummary(M, d);
  expect(s).toMatchObject({ confirmed: 1, corrected: 1, manual: 1 });
  expect(s.bands).toEqual([{ band: 'High', reviewed: 2, overridden: 1 }, { band: 'Medium', reviewed: 0, overridden: 0 }, { band: 'Low', reviewed: 1, overridden: 1 }]);
  expect(s.reasons).toEqual([{ reason: 'Wrong size or variant', count: 2 }, { reason: 'Unit of measure mismatch', count: 1 }]);
  expect(feedbackSummary(M, decide(d, 'm5', null)).reasons).toEqual([{ reason: 'Unit of measure mismatch', count: 1 }, { reason: 'Wrong size or variant', count: 1 }]);
});
