import { it, expect } from 'vitest';
import { bridge } from './bridge';

it('969: Standard → PPV → Actual, axis 730 to 870', () => {
  const b = bridge({ stdUnit: 814.1184, ppvUnit: 40.7059, costUnit: 854.8243 });
  expect(b.axisMin).toBe(730); expect(b.axisMax).toBe(870);
  expect(b.steps.map(s => s.key)).toEqual(['standard', 'ppv', 'actual']);
  expect(b.steps[0]).toMatchObject({ from: 0, to: 814.1184 });
  expect(b.steps[1]).toMatchObject({ from: 814.1184, value: 40.7059 }); expect(b.steps[1].to).toBeCloseTo(854.8243, 4);
  expect(b.steps[2]).toMatchObject({ from: 0, to: 854.8243 });
});
it('821 wheel: axis 100 to 130', () => {
  const b = bridge({ stdUnit: 118.246, ppvUnit: 5.9123, costUnit: 124.1583 }); expect(b.axisMin).toBe(100); expect(b.axisMax).toBe(130);
});
it('tiny assembly (HL Headset) stays finite and readable', () => {
  const b = bridge({ stdUnit: 0.4364, ppvUnit: 0.0218, costUnit: 0.4582 });
  expect([b.axisMin, b.axisMax].every(Number.isFinite)).toBe(true);
  expect(b.axisMin).toBeGreaterThanOrEqual(0); expect(b.axisMin).toBeLessThan(0.4364); expect(b.axisMax).toBeGreaterThan(0.4582);
});
it('zero PPV starts the axis at 0', () => { expect(bridge({ stdUnit: 10, ppvUnit: 0, costUnit: 10 }).axisMin).toBe(0); });
