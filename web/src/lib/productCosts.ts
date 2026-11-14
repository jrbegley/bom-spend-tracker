// Product costs landing (SPEC_REVISION_2.md section 4.1). In phase 5a variance is PPV only; rejects and warranty arrive in 5b/5c.
import type { Product } from './data';
import { sortRows } from './sort';

export type CostHeadline = { standard: number; variance: number; varianceShare: number; bikes: number; units: number };

/** Standard cost and total variance across the given bikes, both over all units built. */
export function costHeadline(products: Product[]): CostHeadline {
  const standard = products.reduce((a, p) => a + p.stdUnit * p.units, 0);
  const variance = products.reduce((a, p) => a + p.ppvTotal, 0);
  return {
    standard, variance, varianceShare: standard ? variance / standard : 0,
    bikes: products.length, units: products.reduce((a, p) => a + p.units, 0),
  };
}

export type RankedProduct = Product & { rank: number };

/** Bikes by total variance $, largest first (stable), numbered from 1. */
export function rankByVariance(products: Product[]): RankedProduct[] {
  return sortRows(products, (p) => p.ppvTotal, 'desc').map((p, i) => ({ ...p, rank: i + 1 }));
}
