import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pct, unitMoney } from '../lib/format';
import type { VendorPartRow } from '../lib/vendorParts';
import { Chip, Panel } from './primitives';

const Term = ({ children, def }: { children: string; def: string }) => <span title={def} className="term-underline cursor-help">{children}</span>;
const DEF_PRICE = 'Average price paid per unit to this vendor, all purchase orders.';
const DEF_REJECT = 'Reject rate (rejected ÷ received) times unit price: what rejected units add to each good one.';

/** One block per part: every vendor of that part, unit price plus reject cost, this vendor highlighted. */
export function VendorPartsPanel({ vendorId, rows }: { vendorId: string; rows: VendorPartRow[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 5);
  return (
    <Panel
      title="Parts from this vendor"
      subtitle="Unit price plus reject cost per unit, against every other vendor of the same part."
      actions={
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-primary" />This vendor</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-price" />Other vendors</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-rejects" /><Term def={DEF_REJECT}>Reject cost</Term></span>
        </div>
      }
      footer={<>Total = <Term def={DEF_PRICE}>unit price</Term> + <Term def={DEF_REJECT}>reject cost</Term> (reject rate × unit price). Warranty cost is added in a later phase.</>}
    >
      <div className="divide-y divide-hairline">
        {shown.map((row) => {
          const max = Math.max(...row.offers.map((o) => o.unitPrice + o.rejectCost), 0.0001);
          const lowest = Math.min(...row.offers.map((o) => o.unitPrice));
          return (
            <section key={row.partId} data-part={row.partId} className="px-6 py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Link to={`/parts/${row.partId}`} className="text-[15px] font-semibold hover:text-primary">{row.partName}</Link>
                <span className="text-[13px] text-muted-foreground">
                  {row.onBom ? `used in ${row.bikes} bikes · ${row.vendorCount} ${row.vendorCount === 1 ? 'vendor' : 'vendors'}` : `${row.vendorCount} ${row.vendorCount === 1 ? 'vendor' : 'vendors'}`}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {row.offers.map((o) => {
                  const mine = o.vendorId === vendorId;
                  const isLowest = !row.singleSource && o.unitPrice - lowest < 0.005;
                  const total = o.unitPrice + o.rejectCost;
                  return (
                    <div key={o.vendorId} className="grid grid-cols-[220px_1fr_90px] items-start gap-4">
                      <div>
                        {mine ? <div className="text-[14px] font-semibold">{o.name}</div>
                          : <Link to={`/vendors/${o.vendorId}`} className="text-[14px] text-muted-foreground hover:text-primary">{o.name}</Link>}
                        <div className="mt-1">
                          {row.singleSource ? <Chip>Single source</Chip> : isLowest ? <Chip tone="savings">Lowest price</Chip> : null}
                        </div>
                      </div>
                      <div>
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" style={{ width: `${(total / max) * 100}%` }}>
                          <div className={mine ? 'bg-primary' : 'bg-price'} style={{ width: `${(o.unitPrice / total) * 100}%` }} />
                          <div className={mine ? 'bg-rejects' : 'bg-rejects/60'} style={{ width: `${(o.rejectCost / total) * 100}%` }} />
                        </div>
                        <div className="num mt-1.5 text-[12px] text-muted-foreground">
                          {`${unitMoney(o.unitPrice)} unit price · reject ${pct(o.rejectRate)} (${unitMoney(o.rejectCost)})`}
                        </div>
                      </div>
                      <div className={`num text-right text-[15px] font-medium ${isLowest ? 'text-savings-ink' : ''}`}>{unitMoney(total)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {rows.length > 5 && (
        <div className="border-t border-hairline px-6 py-3">
          <button type="button" className="text-[14px] font-medium text-primary hover:text-primary/80" onClick={() => setAll((x) => !x)}>
            {all ? 'Show top 5' : `Show all ${rows.length} parts`}
          </button>
        </div>
      )}
    </Panel>
  );
}
