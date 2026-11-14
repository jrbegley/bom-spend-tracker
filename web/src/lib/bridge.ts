// Cost bridge (waterfall) for a level page: Standard → + PPV → Actual, per bike (SPEC_REVISION_2.md section 4.2).
// Phase 5a: rejects and warranty steps come later.

export type BridgeStep = { key: 'standard' | 'ppv' | 'actual'; label: string; value: number; from: number; to: number };
export type Bridge = { steps: BridgeStep[]; axisMin: number; axisMax: number };

/**
 * Steps plus an axis that starts above zero when the PPV step would otherwise be a sliver.
 * unit = one order of magnitude below the largest bar; axisMin leaves two PPV-heights of headroom below the shorter bar.
 */
export function bridge(node: { stdUnit: number; ppvUnit: number; costUnit: number }): Bridge {
  const { stdUnit: std, ppvUnit: ppv, costUnit: cost } = node;
  const steps: BridgeStep[] = [
    { key: 'standard', label: 'Standard', value: std, from: 0, to: std },
    { key: 'ppv', label: 'PPV', value: ppv, from: std, to: std + ppv },
    { key: 'actual', label: 'Actual', value: cost, from: 0, to: cost },
  ];
  const hi = Math.max(std, cost);
  const lo = Math.min(std, cost);
  const gap = Math.abs(ppv);
  if (!(hi > 0)) return { steps, axisMin: 0, axisMax: 1 };
  const unit = 10 ** (Math.floor(Math.log10(hi)) - 1);
  const axisMin = gap < 1e-9 ? 0 : Math.max(0, Math.floor((lo - 2 * gap) / unit) * unit);
  const axisMax = Math.ceil((hi + 0.25 * gap) / unit) * unit;
  // Round away floating noise from the unit multiplication (e.g. 0.39000000000000001).
  const clean = (v: number) => Number(v.toPrecision(12));
  return { steps, axisMin: clean(axisMin), axisMax: clean(axisMax) };
}
