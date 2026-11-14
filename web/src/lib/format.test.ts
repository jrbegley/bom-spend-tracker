import { describe, it, expect } from 'vitest';
import { money, unitMoney, ppvUnit, pct, pctSigned, vsCheapest, count, singleSource } from './format';

describe('money', () => {
  it('millions, 2 decimals', () => { expect(money(1223525.5)).toBe('$1.22M'); expect(money(63791994.84)).toBe('$63.79M'); }); // D1
  it('thousands, 1 decimal', () => { expect(money(346500)).toBe('$346.5K'); expect(money(889977.93)).toBe('$890.0K'); }); // D1
  it('under 1K, whole dollars', () => { expect(money(412.4)).toBe('$412'); expect(money(0)).toBe('$0'); });
  it('negatives get a leading minus', () => { expect(money(-1500)).toBe('-$1.5K'); expect(money(-2_500_000)).toBe('-$2.50M'); });
});
it('unitMoney', () => { expect(unitMoney(854.8243)).toBe('$854.82'); expect(unitMoney(-3.2)).toBe('-$3.20'); });
it('ppvUnit', () => { expect(ppvUnit(40.7059)).toBe('+$40.71'); expect(ppvUnit(-3.2)).toBe('-$3.20'); expect(ppvUnit(0)).toBe('$0.00'); });
describe('pct', () => {
  it('1 decimal', () => { expect(pct(0.9502)).toBe('95.0%'); expect(pct(0.0312)).toBe('3.1%'); });
  it('rounds the stored value, not v*100 (Superior Bicycles reject rate)', () => { expect(pct(0.0525)).toBe('5.2%'); });
  it('signed', () => { expect(pctSigned(0.05)).toBe('+5.0%'); expect(pctSigned(0.47375)).toBe('+47.4%'); expect(pctSigned(-0.012)).toBe('-1.2%'); expect(pctSigned(0)).toBe('0.0%'); });
});
it('vsCheapest', () => { expect(vsCheapest(0)).toBe('Lowest'); expect(vsCheapest(0.47375)).toBe('+47.4%'); });
it('count', () => { expect(count(47107)).toBe('47,107'); expect(count(29470.0)).toBe('29,470'); });
it('singleSource', () => { expect(singleSource(0)).toBe('None'); expect(singleSource(1)).toBe('1 part'); expect(singleSource(2)).toBe('2 parts'); });
