import { it, expect } from 'vitest';
import { readData } from '../test/realData';
import type { Part, Unmapped } from './data';
import { decide, reviewProgress, NOT_A_BOM_PART, type MatchExample } from './matchReview';

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

it('decide sets, overwrites and clears one id without touching others', () => {
  const a = decide({}, 'm1', 'accepted');
  expect(a).toEqual({ m1: 'accepted' });
  const b = decide(a, 'm2', 'rejected');
  expect(b).toEqual({ m1: 'accepted', m2: 'rejected' });
  expect(decide(b, 'm1', 'rejected')).toEqual({ m1: 'rejected', m2: 'rejected' });
  expect(decide(b, 'm1', null)).toEqual({ m2: 'rejected' });
  expect(a).toEqual({ m1: 'accepted' }); // not mutated
});

it('reviewProgress counts decisions for known lines only', () => {
  expect(reviewProgress(M, {})).toBe('0 of 6 reviewed');
  expect(reviewProgress(M, { [M[0].id]: 'accepted', [M[1].id]: 'rejected', stale: 'accepted' })).toBe('2 of 6 reviewed');
});
