import { Link, useLocation, useParams } from 'react-router-dom';
import { Breadcrumb, type Crumb } from '../components/Breadcrumb';
import { KpiTile } from '../components/KpiTile';
import { SavingsSimulator } from '../components/SavingsSimulator';
import { VendorPrices } from '../components/VendorPrices';
import { WhereUsed } from '../components/WhereUsed';
import { useCoreData, type CoreData } from '../lib/data';
import { money, pct } from '../lib/format';
import { partMeta, partRejectRate } from '../lib/partStats';

export function PartView({ core, partId, trail }: { core: CoreData; partId: string; trail?: Crumb[] }) {
  const part = core.parts[partId];
  if (!part) {
    return (
      <>
        <h1 className="text-[24px] font-semibold">Part not found</h1>
        <Link to="/" className="text-accent hover:text-accent-hover">Back to Overview</Link>
      </>
    );
  }
  const crumbs: Crumb[] = [...(trail ?? [{ label: 'Overview', to: '/' }, { label: 'Parts' }]), { label: part.name }];
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={crumbs} />
        <h1 className="text-[24px] font-semibold">{part.name}</h1>
        <p className="mt-1 text-text-secondary">{partMeta(part)}</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiTile size="md" label="Spend" value={money(part.spend)} />
        <KpiTile size="md" label="PPV" value={money(part.ppv)} tone="ppv" />
        <KpiTile size="md" label="Best-price savings" value={money(part.save)} tone="savings" />
        <KpiTile size="md" label="Reject rate" value={pct(partRejectRate(part))} />
      </div>
      <div className="grid grid-cols-[1.65fr_1fr] gap-4 items-start">
        <VendorPrices part={part} />
        <SavingsSimulator save={part.save} vendorCount={part.vendorCount} bikeCount={part.whereUsed.length} onBom={part.onBom} />
      </div>
      <WhereUsed part={part} products={core.products} />
    </div>
  );
}

export default function PartDetail() {
  const { partId = '' } = useParams();
  const state = useLocation().state as { trail?: unknown } | null;
  const trail = Array.isArray(state?.trail) ? (state!.trail as Crumb[]) : undefined;
  // Keyed so slider and table state reset when moving from one part to another.
  return <PartView key={partId} core={useCoreData()} partId={partId} trail={trail} />;
}
