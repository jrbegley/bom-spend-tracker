import { Link, useLocation, useParams } from 'react-router-dom';
import type { Crumb } from '../components/Breadcrumb';
import { PageHeader, Stat, StatRow } from '../components/primitives';
import { SavingsSimulator } from '../components/SavingsSimulator';
import { VendorComparison } from '../components/VendorComparison';
import { WhereUsed } from '../components/WhereUsed';
import { useCoreData, type CoreData } from '../lib/data';
import { money, pct } from '../lib/format';
import { hasSaving, partMeta, partRejectRate } from '../lib/partStats';

export function PartView({ core, partId, trail }: { core: CoreData; partId: string; trail?: Crumb[] }) {
  const part = core.parts[partId];
  if (!part) {
    return (
      <>
        <h1 className="text-[28px] font-semibold tracking-tight">Part not found</h1>
        <Link to="/" className="text-primary hover:text-primary/80">Back to Product costs</Link>
      </>
    );
  }
  const crumbs: Crumb[] = [...(trail ?? [{ label: 'Product costs', to: '/' }, { label: 'Parts' }]), { label: part.name }];
  const saving = hasSaving(part);
  return (
    <div className="space-y-8">
      <PageHeader crumbs={crumbs} title={part.name} meta={partMeta(part)} />
      <StatRow>
        <Stat label="Spend" value={money(part.spend)} caption={`${money(Math.abs(part.ppv))} ${part.ppv >= 0 ? 'above' : 'below'} vendor standard`} />
        {saving
          ? <Stat label="Best-price savings" tone="savings" value={money(part.save)} caption="on price alone" />
          : <Stat label="Vendors" value={String(part.vendorCount)} caption={part.vendorCount === 1 ? 'Single source' : 'Same price from every vendor'} />}
        <Stat label="Reject rate" value={pct(partRejectRate(part))} caption="rejected ÷ received, all vendors" />
      </StatRow>
      <VendorComparison part={part} />
      {saving && <SavingsSimulator save={part.save} bikeCount={part.whereUsed.length} onBom={part.onBom} />}
      <details className="rounded-2xl border border-border bg-card shadow-card">
        <summary className="cursor-pointer list-none px-6 py-4 text-[15px] font-semibold">{`Bikes that use this part · ${part.whereUsed.length}`}</summary>
        <div className="border-t border-hairline"><WhereUsed part={part} products={core.products} /></div>
      </details>
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
