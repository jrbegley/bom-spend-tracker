// JSON contracts (BUILD_SPEC.md section 4.4) and data loading (section 8.1).
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';

export type LineSummary = { line: string; bikes: number; units: number; ppv: number; savings: number };
export type Summary = {
  periodStart: string; periodEnd: string; totalSpend: number; poLines: number; vendorCount: number;
  bikeCount: number; bomTiedSpend: number; bomTiedShare: number; unmappedSpend: number; ppvTotal: number;
  ppvShare: number; bestPriceSavings: number; rejectedValue: number; rejectRate: number; lines: LineSummary[];
};
export type Product = {
  id: string; name: string; line: string; units: number; partCount: number; costUnit: number; stdUnit: number;
  ppvUnit: number; vsStd: number; ppvTotal: number; saveUnit: number; saveTotal: number;
};
export type LeafPart = { partId: string; qtyPerUnit: number };
export type BomNode = {
  id: string; name: string; made: boolean; qty: number; costUnit: number; stdUnit: number; ppvUnit: number;
  saveUnit: number; leafParts: LeafPart[]; children: BomNode[];
  line?: string; units?: number; // root only
};
export type WhereUsed = { productId: string; qtyPerUnit: number; units: number; share: number; allocatedSpend: number };
export type PartVendor = {
  vendorId: string; name: string; qty: number; spend: number; std: number; ppv: number; avgPrice: number;
  premium: number; rejectedQty: number; receivedQty: number;
};
export type Part = {
  id: string; name: string; spend: number; std: number; ppv: number; save: number; vendorCount: number;
  bestPrice: number; onBom: boolean; consumption: number; whereUsed: WhereUsed[]; vendors: PartVendor[];
};
export type Vendor = {
  id: string; name: string; spend: number; ppv: number; premium: number; vsCheapest: number; rejectRate: number;
  rejectedValue: number; partsSupplied: number; singleSource: number; lines: string[];
};
export type Opportunity = {
  partId: string; name: string; lever: 'price_gap' | 'quality_cost'; savings: number; vendorCount: number;
  productCount: number; bestPrice: number; worstPrice: number;
};
export type Unmapped = { partId: string; name: string; spend: number; vendorCount: number };

const pending = new Map<string, Promise<unknown>>();
const resolved = new Map<string, unknown>();

/** Fetch /data/<path> once; later calls share the cached promise. A failed load is evicted so it can be retried. */
export function fetchJson<T>(path: string): Promise<T> {
  let p = pending.get(path);
  if (!p) {
    p = fetch(`/data/${path}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
        const data = await res.json();
        resolved.set(path, data);
        return data;
      })
      .catch((err) => {
        pending.delete(path);
        throw err;
      });
    pending.set(path, p);
  }
  return p as Promise<T>;
}

export function _resetCacheForTests(): void {
  pending.clear();
  resolved.clear();
}

type JsonState<T> = { data?: T; loading: boolean; error?: Error };

/** Load one JSON file. A null path does nothing. */
export function useJson<T>(path: string | null): JsonState<T> {
  const initial = (): JsonState<T> =>
    path === null ? { loading: false }
      : resolved.has(path) ? { data: resolved.get(path) as T, loading: false }
      : { loading: true };
  const [state, setState] = useState<JsonState<T>>(initial);

  useEffect(() => {
    if (path === null) { setState({ loading: false }); return; }
    if (resolved.has(path)) { setState({ data: resolved.get(path) as T, loading: false }); return; }
    let live = true;
    setState({ loading: true });
    fetchJson<T>(path).then(
      (data) => live && setState({ data, loading: false }),
      (error: Error) => live && setState({ loading: false, error }),
    );
    return () => { live = false; };
  }, [path]);

  return state;
}

export type CoreData = {
  summary: Summary; products: Product[]; vendors: Vendor[]; parts: Record<string, Part>; opportunities: Opportunity[];
};

const CORE = ['summary', 'products', 'vendors', 'parts', 'opportunities'] as const;
const CoreContext = createContext<CoreData | null>(null);

/** Loads the five core files once at app start. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [core, setCore] = useState<CoreData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all(CORE.map((n) => fetchJson(`${n}.json`))).then(
      ([summary, products, vendors, parts, opportunities]) =>
        live && setCore({ summary, products, vendors, parts, opportunities } as CoreData),
      (e: Error) => live && setError(e),
    );
    return () => { live = false; };
  }, []);

  if (error) return createElement('p', { className: 'p-8 text-text-secondary', role: 'alert' }, `Could not load data: ${error.message}`);
  if (!core) return createElement('p', { className: 'p-8 text-text-muted' }, 'Loading data…');
  return createElement(CoreContext.Provider, { value: core }, children);
}

export function useCoreData(): CoreData {
  const core = useContext(CoreContext);
  if (!core) throw new Error('useCoreData must be used inside <DataProvider>');
  return core;
}
