import { it, expect } from 'vitest';
import { leversPresent, filterByLever } from './opportunities';
import { readData } from '../test/realData';
import type { Opportunity } from './data';
const O = readData<Opportunity[]>('opportunities.json');
it('only levers present in the data', () => { expect(leversPresent(O)).toEqual(['price_gap']); });
it('filterByLever', () => {
  expect(filterByLever(O, 'all')).toHaveLength(139); expect(filterByLever(O, 'price_gap')).toHaveLength(139);
  expect(filterByLever(O, 'quality_cost')).toHaveLength(0);
});
