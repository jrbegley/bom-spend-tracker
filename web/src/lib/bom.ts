// BOM tree helpers for the level page (BUILD_SPEC.md section 7.3).
import type { Crumb } from '../components/Breadcrumb';
import type { BomNode, Part } from './data';
import { count } from './format';
import { vendorsForParts } from './vendorsForParts';

/** Walk `path` (node IDs below the root). `chain` runs root → node. Null when any ID is not found. */
export function findNode(root: BomNode, path: string[]): { node: BomNode; chain: BomNode[] } | null {
  const chain = [root];
  for (const id of path) {
    const next = chain[chain.length - 1].children.find((c) => c.id === id);
    if (!next) return null;
    chain.push(next);
  }
  return { node: chain[chain.length - 1], chain };
}

/** Overview / line / bike / …assemblies. Every crumb has a link; Breadcrumb renders the last as plain text. */
export function levelTrail(chain: BomNode[], line: string): Crumb[] {
  const root = chain[0];
  return [
    { label: 'Product costs', to: '/' },
    { label: line, to: `/?line=${encodeURIComponent(line)}` },
    ...chain.map((n, i) => ({
      label: n.name,
      to: `/products/${[root.id, ...chain.slice(1, i + 1).map((c) => c.id)].join('/')}`,
    })),
  ];
}

/** The meta line under the level title. */
export function levelMeta(chain: BomNode[], parts: Record<string, Part>, period: string): string {
  const node = chain[chain.length - 1];
  const n = node.leafParts.length;
  if (chain.length === 1) {
    const vendors = vendorsForParts(node.leafParts.map((l) => l.partId), parts).length;
    return `${count(node.units ?? 0)} units built · ${n} purchased ${n === 1 ? 'part' : 'parts'} · ${vendors} ${vendors === 1 ? 'vendor' : 'vendors'} · ${period}`;
  }
  return `Made in-house · ${n} purchased ${n === 1 ? 'part' : 'parts'} · ${Number(node.qty.toFixed(2))} per bike`;
}

/** Second line under a component name (plan decision D5). */
export function componentNote(child: BomNode, parts: Record<string, Part>): string {
  if (!child.made) {
    const vc = parts[child.id]?.vendorCount ?? 0;
    return vc === 1 ? 'Single source' : `${vc} vendors`;
  }
  const n = child.leafParts.length;
  let top: Part | undefined;
  for (const l of child.leafParts) {
    const p = parts[l.partId];
    if (p && (!top || p.save > top.save || (p.save === top.save && p.spend > top.spend))) top = p;
  }
  return `${n} ${n === 1 ? 'part' : 'parts'}${top ? ` · includes ${top.name}` : ''}`;
}

/** Made children go one level deeper; bought children open the part page. */
export function childHref(chain: BomNode[], child: BomNode): string {
  if (!child.made) return `/parts/${child.id}`;
  return `/products/${[chain[0].id, ...chain.slice(1).map((c) => c.id), child.id].join('/')}`;
}

/** Where a URL that ends on a bought part should go: the part page, keeping the level trail. Null otherwise. */
export function boughtRedirect(chain: BomNode[], line: string): { to: string; state: { trail: Crumb[] } } | null {
  const node = chain[chain.length - 1];
  if (node.made || chain.length === 1) return null;
  return { to: `/parts/${node.id}`, state: { trail: levelTrail(chain.slice(0, -1), line) } };
}
