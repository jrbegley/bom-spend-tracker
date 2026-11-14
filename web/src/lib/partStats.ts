// Part-level figures for the part detail page (BUILD_SPEC.md section 7.4).
import type { Part, PartVendor } from './data';

/** Total rejected ÷ total received across vendors; 0 when nothing was received. */
export function partRejectRate(part: Part): number {
  const rec = part.vendors.reduce((a, v) => a + v.receivedQty, 0);
  return rec === 0 ? 0 : part.vendors.reduce((a, v) => a + v.rejectedQty, 0) / rec;
}

/** This vendor's premium over the cheapest vendor's average price; 0 when it is the cheapest. */
export function vendorVsCheapest(v: PartVendor): number {
  return v.premium === 0 ? 0 : v.premium / (v.spend - v.premium);
}

/** Savings when `sharePct` percent of volume moves to the cheapest vendor. */
export function simulatedSavings(save: number, sharePct: number): number {
  return (save * sharePct) / 100;
}

/** "2 vendors · used in 22 bikes · Bought", or "Not on a BOM" in place of the bike count. */
export function partMeta(part: Part): string {
  const vendors = `${part.vendorCount} ${part.vendorCount === 1 ? 'vendor' : 'vendors'}`;
  const used = part.onBom ? `used in ${part.whereUsed.length} bikes` : 'Not on a BOM';
  return `${vendors} · ${used} · Bought`;
}

/** True when moving volume between vendors would save money: more than one vendor and a saving above $0.50. */
export function hasSaving(part: Part): boolean {
  return part.vendorCount > 1 && part.save > 0.5;
}
