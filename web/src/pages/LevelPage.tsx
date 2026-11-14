import { Link, Navigate, useParams } from 'react-router-dom';
import { ComponentsTable } from '../components/ComponentsTable';
import { BlendedBadge } from '../components/BlendedBadge';
import { CostBridge } from '../components/CostBridge';
import { Disclosure, PageHeader, Stat, StatRow } from '../components/primitives';
import { InsightBanner } from '../components/InsightBanner';
import { StatusMessage } from '../components/StatusMessage';
import { VendorTable } from '../components/VendorTable';
import { boughtRedirect, findNode, levelMeta, levelTrail } from '../lib/bom';
import { useCoreData, useJson, type BomNode, type CoreData, type JsonState } from '../lib/data';
import { count, money, pctSigned, periodLabel, ppvUnit, unitMoney } from '../lib/format';
import { buildInsight } from '../lib/insight';
import { vendorsForParts } from '../lib/vendorsForParts';

const link = 'text-primary hover:text-primary/80';

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
  const units = bom.units ?? 0;
  const partIds = node.leafParts.map((l) => l.partId);
  const vendorCount = vendorsForParts(partIds, core.parts).length;
  const vendorTitle = chain.length === 1 ? 'Vendors for this bike' : 'Vendors for this assembly';
  return (
    <div className="space-y-8">
      <PageHeader crumbs={levelTrail(chain, bom.line ?? '')} title={node.name} meta={levelMeta(chain, core.parts, period)} />
      <StatRow>
        <Stat label="Actual cost per bike" extra={<BlendedBadge />} value={unitMoney(node.costUnit)} caption={`vs ${unitMoney(node.stdUnit)} standard`} />
        <Stat label="Variance per bike" tone="ppv" value={ppvUnit(node.ppvUnit)}
          caption={`${node.stdUnit ? pctSigned(node.ppvUnit / node.stdUnit) : '0.0%'} above standard`} />
        <Stat label="Total variance" value={`${node.ppvUnit < 0 ? '-' : '+'}${money(Math.abs(node.ppvUnit) * units)}`} caption={`across ${count(units)} bikes`} />
      </StatRow>
      <CostBridge node={node} />
      <ComponentsTable chain={chain} parts={core.parts} />
      {insight && <InsightBanner insight={insight} trail={levelTrail(chain, bom.line ?? '')} />}
      <Disclosure title={`${vendorTitle} · ${vendorCount}`}>
        <p className="px-6 pt-3 text-[13px] text-muted-foreground">Spend on these parts across all products</p>
        <VendorTable bare mode="parts" partIds={partIds} parts={core.parts} title={vendorTitle} />
      </Disclosure>
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
        <Link to="/" className={link}>Back to Product costs</Link>
      </>
    );
  }
  if (bom.error) {
    return (
      <>
        <h1 className="text-[24px] font-semibold">Could not load this product</h1>
        <StatusMessage kind="error">{bom.error.message}</StatusMessage>
        <Link to="/" className={link}>Back to Product costs</Link>
      </>
    );
  }
  if (bom.loading || !bom.data) return <StatusMessage kind="loading">Loading…</StatusMessage>;
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
