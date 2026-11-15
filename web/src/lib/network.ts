// The pooled-buying admission test (SPEC_PITCH_DEMO.md sections 1 and 4). Member figures are real
// (network_member.json); network figures are synthetic (network_synthetic.json). Every price is per purchase unit.

export type MemberPart = {
  id: string; name: string; family: 'Fastener' | 'Bearing'; onBom: boolean; unit: string; unitCode: string;
  yearlyQty: number; avgPrice: number; rejectRate: number; yearlySpend: number; leadTimeDays: number; minOrderQty: number;
};
export type RebateTier = { minNetworkQty: number; rebatePct: number };
export type NetworkPart = {
  id: string; synthetic: true; multiple: number; networkYearlyQty: number; discount: number;
  pooledPrice: number; distributorFee: number; freightPerUnit: number; leadTimeDays: number; minOrderQty: number;
  memberCount: number; rebateTiers: RebateTier[];
};
export type NetworkRow = {
  member: MemberPart; network: NetworkPart; effective: number; delivered: number;
  admitted: boolean; saving: number; reason: string | null;
};

/** What the member pays now per unit: price plus what rejects add. */
export function effectiveCost(m: MemberPart): number { return m.avgPrice * (1 + m.rejectRate); }

/** What the network charges per unit, delivered: pooled price + distributor fee + freight. */
export function deliveredCost(n: NetworkPart): number { return n.pooledPrice + n.distributorFee + n.freightPerUnit; }

/** A part joins the pool only when it beats the member's effective cost, with no longer lead time or bigger minimum order. */
export function admits(m: MemberPart, n: NetworkPart): boolean {
  return deliveredCost(n) < effectiveCost(m) && n.leadTimeDays <= m.leadTimeDays && n.minOrderQty <= m.minOrderQty;
}

/** Why a part stays with the current vendor (first match wins); null when it joins. */
export function stayReason(m: MemberPart, n: NetworkPart): string | null {
  if (admits(m, n)) return null;
  if (n.leadTimeDays > m.leadTimeDays) return "Network lead time is longer than your current vendor's";
  if (n.minOrderQty > m.minOrderQty) return 'Network minimum order is above what you order now';
  if (n.pooledPrice + n.distributorFee < effectiveCost(m)) return 'Freight at your order size outweighs the pooled price';
  return "The pooled price doesn't beat what you pay now";
}

/** Yearly saving at the member's own volume; 0 for a part that stays. */
export function yearlySaving(m: MemberPart, n: NetworkPart): number {
  return admits(m, n) ? (effectiveCost(m) - deliveredCost(n)) * m.yearlyQty : 0;
}

/** One row per member part that has a network record, in member order. */
export function networkRows(members: MemberPart[], network: NetworkPart[]): NetworkRow[] {
  const byId = new Map(network.map((n) => [n.id, n]));
  return members.flatMap((member) => {
    const n = byId.get(member.id);
    if (!n) return [];
    return [{
      member, network: n, effective: effectiveCost(member), delivered: deliveredCost(n),
      admitted: admits(member, n), saving: yearlySaving(member, n), reason: stayReason(member, n),
    }];
  });
}

export type NetworkSummary = {
  partCount: number; eligibleSpend: number; volumeMultiple: number; networkSpendAtYourPrices: number;
  saving: number; joining: number; staying: number;
};

/** Headline numbers. The volume multiple values network quantities at the member's own prices, so units never mix. */
export function networkSummary(rows: NetworkRow[]): NetworkSummary {
  const eligibleSpend = rows.reduce((a, r) => a + r.member.yearlySpend, 0);
  const networkSpendAtYourPrices = rows.reduce((a, r) => a + r.network.networkYearlyQty * r.member.avgPrice, 0);
  const joining = rows.filter((r) => r.admitted).length;
  return {
    partCount: rows.length, eligibleSpend, networkSpendAtYourPrices,
    volumeMultiple: eligibleSpend > 0 ? networkSpendAtYourPrices / eligibleSpend : 0,
    saving: rows.reduce((a, r) => a + r.saving, 0), joining, staying: rows.length - joining,
  };
}
