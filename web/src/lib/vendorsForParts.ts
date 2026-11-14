// Vendor rows scoped to a set of parts (BUILD_SPEC.md section 8.2).
import type { Part } from './data';

export type VendorRow = {
  vendorId: string; name: string; spend: number; std: number; ppv: number; premium: number; vsCheapest: number;
  rejectedQty: number; receivedQty: number; rejectRate: number; singleSource: number; partNames: string[]; partsLabel: string;
};

function label(names: string[]): string {
  const n = names.length;
  const shown = names.slice(0, 2).join(', ');
  return `${n} ${n === 1 ? 'part' : 'parts'}: ${shown}${n > 2 ? ` +${n - 2} more` : ''}`;
}

/** Company-wide spend by vendor on the given parts. Duplicate and unknown part IDs are ignored. */
export function vendorsForParts(partIds: string[], parts: Record<string, Part>): VendorRow[] {
  const acc = new Map<string, { name: string; spend: number; std: number; premium: number; rej: number; rec: number; names: string[]; single: number }>();
  for (const id of new Set(partIds)) {
    const part = parts[id];
    if (!part) continue;
    for (const v of part.vendors) {
      let a = acc.get(v.vendorId);
      if (!a) acc.set(v.vendorId, (a = { name: v.name, spend: 0, std: 0, premium: 0, rej: 0, rec: 0, names: [], single: 0 }));
      a.spend += v.spend; a.std += v.std; a.premium += v.premium; a.rej += v.rejectedQty; a.rec += v.receivedQty;
      a.names.push(part.name);
      if (part.vendorCount === 1) a.single += 1;
    }
  }
  return [...acc].map(([vendorId, a]) => {
    const partNames = [...a.names].sort((x, y) => x.localeCompare(y));
    return {
      vendorId, name: a.name, spend: a.spend, std: a.std, ppv: a.spend - a.std, premium: a.premium,
      vsCheapest: a.premium === 0 ? 0 : a.premium / (a.spend - a.premium),
      rejectedQty: a.rej, receivedQty: a.rec, rejectRate: a.rec === 0 ? 0 : a.rej / a.rec,
      singleSource: a.single, partNames, partsLabel: label(partNames),
    };
  });
}
