import { Link, Navigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { ComponentsTable } from '../components/ComponentsTable';
import { CostSummary } from '../components/CostSummary';
import { VendorTable } from '../components/VendorTable';
import { findNode, levelMeta, levelTrail } from '../lib/bom';
import { useCoreData, useJson, type BomNode, type CoreData } from '../lib/data';
import { periodLabel } from '../lib/format';

const link = 'text-accent hover:text-accent-hover';

export function LevelView({ core, bom, path }: { core: CoreData; bom: BomNode; path: string[] }) {
  const found = findNode(bom, path);
  if (!found) {
    return (
      <>
        <h1 className="text-[24px] font-semibold">Assembly not found</h1>
        <Link to={`/products/${bom.id}`} className={link}>{`Back to ${bom.name}`}</Link>
      </>
    );
  }
  const { node, chain } = found;
  if (!node.made && chain.length > 1) return <Navigate to={`/parts/${node.id}`} replace />;

  const period = periodLabel(core.summary.periodStart, core.summary.periodEnd);
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={levelTrail(chain, bom.line ?? '')} />
        <h1 className="text-[24px] font-semibold">{node.name}</h1>
        <p className="mt-1 text-text-secondary">{levelMeta(chain, core.parts, period)}</p>
      </div>
      <CostSummary node={node} units={bom.units ?? 0} />
      <ComponentsTable chain={chain} parts={core.parts} />
      <VendorTable mode="parts" partIds={node.leafParts.map((l) => l.partId)} parts={core.parts}
        title={chain.length === 1 ? 'Vendors for this bike' : 'Vendors for this assembly'} />
    </div>
  );
}

export default function LevelPage() {
  const params = useParams();
  const productId = params.productId ?? '';
  const nodePath = (params['*'] ?? '').split('/').filter(Boolean);
  const core = useCoreData();
  const { data, loading, error } = useJson<BomNode>(`bom/${productId}.json`);

  if (error) {
    return (
      <>
        <h1 className="text-[24px] font-semibold">Product not found</h1>
        <Link to="/" className={link}>Back to Overview</Link>
      </>
    );
  }
  if (loading || !data) return <p className="text-text-muted">Loading…</p>;
  return <LevelView core={core} bom={data} path={nodePath} />;
}
