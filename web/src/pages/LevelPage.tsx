import { Link, Navigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { ComponentsTable } from '../components/ComponentsTable';
import { CostSummary } from '../components/CostSummary';
import { InsightBanner } from '../components/InsightBanner';
import { VendorTable } from '../components/VendorTable';
import { boughtRedirect, findNode, levelMeta, levelTrail } from '../lib/bom';
import { useCoreData, useJson, type BomNode, type CoreData, type JsonState } from '../lib/data';
import { periodLabel } from '../lib/format';
import { buildInsight } from '../lib/insight';

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
  const redirect = boughtRedirect(chain, bom.line ?? '');
  if (redirect) return <Navigate to={redirect.to} state={redirect.state} replace />;

  const period = periodLabel(core.summary.periodStart, core.summary.periodEnd);
  const insight = buildInsight(chain, core);
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
      {insight && <InsightBanner insight={insight} trail={levelTrail(chain, bom.line ?? '')} />}
    </div>
  );
}

type BodyProps = { core: CoreData; productId: string; nodePath: string[]; bom: JsonState<BomNode> };

/** Everything LevelPage shows, given the fetch state. Unknown product ids never reach the network. */
export function LevelPageBody({ core, productId, nodePath, bom }: BodyProps) {
  if (!core.products.some((p) => p.id === productId)) {
    return (
      <>
        <h1 className="text-[24px] font-semibold">Product not found</h1>
        <Link to="/" className={link}>Back to Overview</Link>
      </>
    );
  }
  if (bom.error) {
    return (
      <>
        <h1 className="text-[24px] font-semibold">Could not load this product</h1>
        <p className="text-text-secondary">{bom.error.message}</p>
        <Link to="/" className={link}>Back to Overview</Link>
      </>
    );
  }
  if (bom.loading || !bom.data) return <p className="text-text-muted">Loading…</p>;
  // Keyed by location so drilling into an assembly starts with fresh table sort and expansion state.
  return <LevelView key={[productId, ...nodePath].join('/')} core={core} bom={bom.data} path={nodePath} />;
}

export default function LevelPage() {
  const params = useParams();
  const productId = params.productId ?? '';
  const nodePath = (params['*'] ?? '').split('/').filter(Boolean);
  const core = useCoreData();
  const known = core.products.some((p) => p.id === productId);
  const bom = useJson<BomNode>(known ? `bom/${productId}.json` : null);
  return <LevelPageBody core={core} productId={productId} nodePath={nodePath} bom={bom} />;
}
