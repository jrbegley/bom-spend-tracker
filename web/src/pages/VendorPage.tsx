import { Link, useParams } from 'react-router-dom';
import { Disclosure, PageHeader, Stat, StatRow } from '../components/primitives';
import { VendorPartsPanel } from '../components/VendorPartsPanel';
import { useCoreData, type CoreData } from '../lib/data';
import { count, money, pct } from '../lib/format';
import { vendorParts, vendorSummary } from '../lib/vendorParts';

const th = 'px-6 py-3 text-left text-[13px] font-medium text-muted-foreground';
const thNum = 'px-6 py-3 text-right text-[13px] font-medium text-muted-foreground';
const td = 'px-6 py-3';
const tdNum = 'num px-6 py-3 text-right';

export function VendorView({ core, vendorId }: { core: CoreData; vendorId: string }) {
  const vendor = core.vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    return (
      <>
        <h1 className="text-[28px] font-semibold tracking-tight">Vendor not found</h1>
        <Link to="/vendors" className="text-primary hover:text-primary/80">Back to Vendors</Link>
      </>
    );
  }
  const rows = vendorParts(vendorId, core.parts);
  const sum = vendorSummary(rows);
  const n = vendor.partsSupplied;
  const std = vendor.spend - vendor.ppv;
  const single = sum.singleSource;
  return (
    <div className="space-y-8">
      <PageHeader crumbs={[{ label: 'Vendors', to: '/vendors' }, { label: vendor.name }]} title={vendor.name}
        meta={`${n} ${n === 1 ? 'part' : 'parts'} · ${vendor.lines.length ? vendor.lines.join(', ') : 'Not on a BOM'} · ${count(sum.units)} units bought`} />
      <StatRow>
        <Stat label="Spend" value={money(vendor.spend)} caption={`${count(sum.units)} units`} />
        <Stat label="PPV" tone="ppv" value={`${vendor.ppv >= 0 ? '+' : '-'}${money(Math.abs(vendor.ppv))}`}
          caption={vendor.ppv > 0 && std > 0 ? `${pct(vendor.ppv / std)} above standard` : 'vs vendor standard prices'} />
        {sum.compared > 0
          ? <Stat label="Lowest price" value={`${sum.lowestOn} of ${sum.compared}`}
              caption={`parts with more than one vendor${single ? ` · ${single} single-source` : ''}`} />
          : <Stat label="Lowest price" value="Single source" caption={`on all ${single} ${single === 1 ? 'part' : 'parts'}`} />}
      </StatRow>
      <VendorPartsPanel vendorId={vendorId} rows={rows} />
      <Disclosure title="Quality">
        <table className="w-full text-[14px]">
          <caption className="sr-only">{`Reject rate by part for ${vendor.name}`}</caption>
          <thead><tr className="border-b border-hairline"><th scope="col" className={th}>Part</th><th scope="col" className={thNum}>Reject rate</th>
            <th scope="col" className={thNum}>Rejected</th><th scope="col" className={thNum}>Received</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const pv = core.parts[r.partId].vendors.find((v) => v.vendorId === vendorId);
              const rejected = pv?.rejectedQty ?? 0;
              const received = pv?.receivedQty ?? 0;
              return (
                <tr key={r.partId} className="border-b border-hairline last:border-b-0">
                  <td className={td}><Link to={`/parts/${r.partId}`} className="hover:text-primary">{r.partName}</Link></td>
                  <td className={`${tdNum} ${r.me.rejectRate >= 0.05 ? 'text-destructive' : ''}`}>{pct(r.me.rejectRate)}</td>
                  <td className={tdNum}>{count(rejected)}</td><td className={tdNum}>{count(received)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Disclosure>
      <Disclosure title={`Spend by part · ${rows.length}`}>
        <table className="w-full text-[14px]">
          <caption className="sr-only">{`Spend by part for ${vendor.name}`}</caption>
          <thead><tr className="border-b border-hairline"><th scope="col" className={th}>Part</th><th scope="col" className={thNum}>Spend</th>
            <th scope="col" className={thNum}>PPV</th><th scope="col" className={thNum}>Units bought</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.partId} className="border-b border-hairline last:border-b-0">
                <td className={td}><Link to={`/parts/${r.partId}`} className="hover:text-primary">{r.partName}</Link></td>
                <td className={tdNum}>{money(r.me.spend)}</td><td className={`${tdNum} text-ppv-ink`}>{money(r.me.ppv)}</td>
                <td className={tdNum}>{count(r.me.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Disclosure>
    </div>
  );
}

export default function VendorPage() {
  const { vendorId = '' } = useParams();
  return <VendorView key={vendorId} core={useCoreData()} vendorId={vendorId} />;
}
