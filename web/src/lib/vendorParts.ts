// Per-vendor, per-part comparison for the vendor page (SPEC_VENDOR_PAGE.md sections 3 and 4).
// Before phase 5c there is no warranty data, so the comparison is unit price plus reject cost.
import type { Part, PartVendor } from './data';
import { sortRows } from './sort';

export type VendorOffer = {
  vendorId: string; name: string; unitPrice: number; rejectRate: number; rejectCost: number; qty: number; spend: number; ppv: number;
};

export type VendorPartRow = {
  partId: string; partName: string; bikes: number; onBom: boolean; vendorCount: number; singleSource: boolean;
  me: VendorOffer; offers: VendorOffer[]; lowestPrice: boolean;
};

function offer(v: PartVendor): VendorOffer {
  const rejectRate = v.receivedQty === 0 ? 0 : v.rejectedQty / v.receivedQty;
  return {
    vendorId: v.vendorId, name: v.name, unitPrice: v.avgPrice, rejectRate, rejectCost: rejectRate * v.avgPrice,
    qty: v.qty, spend: v.spend, ppv: v.ppv,
  };
}

/** Every part the vendor supplies, largest spend with this vendor first, each with all of that part's vendors by price. */
export function vendorParts(vendorId: string, parts: Record<string, Part>): VendorPartRow[] {
  const rows: VendorPartRow[] = [];
  for (const part of Object.values(parts)) {
    const mine = part.vendors.find((v) => v.vendorId === vendorId);
    if (!mine) continue;
    const offers = sortRows(part.vendors.map(offer), (o) => o.unitPrice, 'asc');
    const me = offer(mine);
    const min = Math.min(...offers.map((o) => o.unitPrice));
    rows.push({
      partId: part.id, partName: part.name, bikes: part.whereUsed.length, onBom: part.onBom,
      vendorCount: part.vendorCount, singleSource: part.vendorCount === 1,
      me, offers, lowestPrice: me.unitPrice - min < 0.005,
    });
  }
  return sortRows(rows, (r) => r.me.spend, 'desc');
}

/** Units bought, and how many compared (multi-vendor) parts this vendor is the lowest price on. */
export function vendorSummary(rows: VendorPartRow[]) {
  const compared = rows.filter((r) => !r.singleSource);
  return {
    units: rows.reduce((a, r) => a + r.me.qty, 0),
    compared: compared.length,
    lowestOn: compared.filter((r) => r.lowestPrice).length,
    singleSource: rows.length - compared.length,
  };
}
