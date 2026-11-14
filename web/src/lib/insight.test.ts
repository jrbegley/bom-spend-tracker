import { it, expect } from 'vitest';
import { buildInsight } from './insight';
import { findNode } from './bom';
import { loadCore, readData } from '../test/realData';
import type { BomNode } from './data';
const core = loadCore(); const bom = readData<BomNode>('bom/969.json');
const chain = (p: string[]) => findNode(bom, p)!.chain;

it('bike: two components share the part', () => {
  expect(buildInsight(chain([]), core)).toEqual({ partId: '513', partName: 'Touring Rim',
    text: "Touring Front Wheel and Touring Rear Wheel use the Touring Rim, bought at $39.20 from Premier Sport, Inc. and $26.60 from Anderson's Custom Bikes. Harmonizing it saves $346.5K across 22 bikes." });
});
it('assembly whose direct child is the part', () => {
  expect(buildInsight(chain(['821']), core)!.text).toBe("This assembly uses the Touring Rim, bought at $39.20 from Premier Sport, Inc. and $26.60 from Anderson's Custom Bikes. Harmonizing it saves $346.5K across 22 bikes.");
});
it('three vendors', () => {
  expect(buildInsight(chain(['951']), core)!.text).toBe('This assembly uses the HL Crankarm, bought from 3 vendors at $46.06 to $48.58. Harmonizing it saves $65.3K across 21 bikes.');
});
it('nothing at or above $10K: no banner', () => { expect(buildInsight(chain(['522']), core)).toBeNull(); });
