import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Chip, Disclosure, FilterChips, Panel, Stat, StatRow } from '../components/primitives';
import { StatusMessage } from '../components/StatusMessage';
import { useJson } from '../lib/data';
import { money, unitMoney } from '../lib/format';
import { networkRows, networkSummary, type MemberPart, type NetworkPart, type NetworkRow } from '../lib/network';

export type ResultFilter = 'all' | 'joins' | 'stays';
const FILTERS: ResultFilter[] = ['all', 'joins', 'stays'];
const TOP = 10;
const META = 'Concept. Your volumes come from the sample data; network figures are synthetic.';
const PROMISE = 'Nobody pays more. A part moves into the pool only when it saves money.';

const qtyFmt = (v: number) => Math.round(v).toLocaleString('en-US');
const units = (unit: string) => `${unit}s`;
const nUnits = (n: number, unit: string) => `${n} ${n === 1 ? unit : units(unit)}`;

function VolumeBars({ r }: { r: NetworkRow }) {
  const { member: m, network: n } = r;
  return (
    <div className="w-[210px] shrink-0" aria-label="Your volume against the network's">
      <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(1, 100 / n.multiple)}%` }} /></div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-foreground/40" style={{ width: '100%' }} /></div>
      <div className="mt-1 text-[12px] text-muted-foreground">
        {`You ${qtyFmt(m.yearlyQty)} · network ${qtyFmt(n.networkYearlyQty)} ${units(m.unit)}/yr`}
      </div>
      <div className="text-[12px] font-medium text-foreground">{`Network buys ${n.multiple.toFixed(0)}× your volume`}</div>
    </div>
  );
}

function Breakdown({ r }: { r: NetworkRow }) {
  const { member: m, network: n } = r;
  const per = `per ${m.unit}`;
  const line = (label: string, value: string, strong = false) => (
    <tr className={strong ? 'border-t border-hairline font-semibold' : ''}>
      <th scope="row" className="px-6 py-2 text-left font-normal text-muted-foreground">{label}</th>
      <td className={`num px-6 py-2 text-right ${strong ? 'text-foreground' : ''}`}>{value}</td>
    </tr>
  );
  const [t1, t2] = n.rebateTiers;
  return (
    <table id={`net-${m.id}`} className="w-full text-[14px]">
      <caption className="sr-only">{`${m.name}: delivered-cost breakdown ${per} (synthetic)`}</caption>
      <tbody>
        {line('Pooled manufacturer price', `${unitMoney(n.pooledPrice)} ${per}`)}
        {line('Distributor fee', unitMoney(n.distributorFee))}
        {line('Freight at your order size', unitMoney(n.freightPerUnit))}
        {line('Network delivered cost', unitMoney(r.delivered), true)}
        {line('Your current effective cost (price + rejects)', unitMoney(r.effective))}
        {line('Lead time and minimum order', `${n.leadTimeDays} days, ${nUnits(n.minOrderQty, m.unit)} (yours: ${m.leadTimeDays} days, ${nUnits(m.minOrderQty, m.unit)})`)}
        {line('Rebate tiers', `Contract price now; quarterly rebate of ${t1.rebatePct * 100}% at ${qtyFmt(t1.minNetworkQty)} and ${t2.rebatePct * 100}% at ${qtyFmt(t2.minNetworkQty)} ${units(m.unit)} a year of network volume (synthetic)`)}
      </tbody>
    </table>
  );
}

function PartRow({ r, open, onToggle, highlighted }: { r: NetworkRow; open: boolean; onToggle: () => void; highlighted: boolean }) {
  const { member: m } = r;
  return (
    <li data-network-row={m.id} className={`border-t border-hairline first:border-t-0 ${highlighted ? 'bg-primary-soft' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
        <div className="min-w-[200px] flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/parts/${m.id}`} className="text-[15px] font-medium text-primary hover:text-primary/80">{m.name}</Link>
            <Chip>{m.family}</Chip>
          </div>
          <div className="num mt-1 text-[13px] text-muted-foreground">{`${unitMoney(r.effective)} → ${unitMoney(r.delivered)} per ${m.unit}`}</div>
        </div>
        <VolumeBars r={r} />
        <div className="w-[230px] text-[13px]">
          {r.admitted
            ? <Chip tone="savings">{`Joins the pool, saves ${money(r.saving)}/yr`}</Chip>
            : <span title={r.reason ?? undefined}><Chip>Stays with current vendor</Chip><span className="mt-1 block text-muted-foreground">{r.reason}</span></span>}
        </div>
        <button type="button" aria-expanded={open} aria-controls={`net-${m.id}`} onClick={onToggle}
          className="text-[13px] text-primary hover:text-primary/80">{open ? 'Hide cost breakdown' : 'Cost breakdown'}</button>
      </div>
      {open && <div className="border-t border-hairline bg-muted/30 pb-2"><Breakdown r={r} /></div>}
    </li>
  );
}

type ViewProps = {
  rows: NetworkRow[]; filter: ResultFilter; onFilter: (f: ResultFilter) => void;
  expanded: ReadonlySet<string>; onToggle: (id: string) => void; showAll: boolean; onShowAll: () => void;
  joined: boolean; onJoin: () => void; onUndo: () => void; highlightId?: string | null;
};

export function NetworkView({ rows, filter, onFilter, expanded, onToggle, showAll, onShowAll, joined, onJoin, onUndo, highlightId }: ViewProps) {
  const s = networkSummary(rows);
  const shown = rows.filter((r) => filter === 'all' || (filter === 'joins') === r.admitted);
  const visible = showAll ? shown : shown.slice(0, TOP);
  // Focus follows the join state: Join → Undo → Join, but never on first render.
  const touched = useRef(false);
  const joinRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (touched.current) (joined ? undoRef : joinRef).current?.focus(); }, [joined]);
  const act = (fn: () => void) => () => { touched.current = true; fn(); };
  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-semibold tracking-tight">Buying network</h1>
              <Chip tone="caution">Illustrative</Chip>
            </div>
            <p className="mt-1.5 text-[15px] text-muted-foreground">{META}</p>
          </div>
          {joined ? (
            <div role="status" className="flex max-w-[420px] items-start gap-3 rounded-2xl border border-savings/30 bg-savings-soft px-4 py-3 text-[14px] text-savings-ink">
              <span>Opted in. Pooled volumes are shared; your prices and part numbers stay private.</span>
              <button ref={undoRef} type="button" onClick={act(onUndo)} className="shrink-0 font-medium underline">Undo</button>
            </div>
          ) : (
            <button ref={joinRef} type="button" onClick={act(onJoin)}
              className="rounded-md bg-foreground px-4 py-2 text-[14px] font-medium text-background hover:bg-foreground/90">Join the pool</button>
          )}
        </div>
      </header>

      <StatRow>
        <Stat label="Your pool-eligible spend" value={money(s.eligibleSpend)} caption={`a year across ${s.partCount} fasteners and bearings`} />
        <Stat label="Network volume on these parts" value={`${s.volumeMultiple.toFixed(0)}× yours`}
          caption={`synthetic network purchases, valued at your prices: ${money(s.networkSpendAtYourPrices)} a year`} />
        <Stat label="Saving if you join" value={money(s.saving)} tone="savings" caption={`a year, on ${s.joining} of ${s.partCount} parts that pass the test`} />
      </StatRow>

      <Panel title="The admission test, part by part"
        subtitle="Your pool-eligible parts, biggest yearly spend first. A part joins only if the network's delivered cost beats what you pay now."
        actions={<FilterChips label="Show parts that" value={filter} onChange={onFilter}
          options={[
            { value: 'all', label: 'All', count: s.partCount },
            { value: 'joins', label: 'Joins the pool', count: s.joining },
            { value: 'stays', label: 'Stays with current vendor', count: s.staying },
          ]} />}
        footer={PROMISE}>
        <ul>
          {visible.map((r) => <PartRow key={r.member.id} r={r} open={expanded.has(r.member.id)} onToggle={() => onToggle(r.member.id)} highlighted={r.member.id === highlightId} />)}
        </ul>
        {!showAll && shown.length > TOP && (
          <div className="border-t border-hairline px-6 py-3">
            <button type="button" onClick={onShowAll} className="text-[14px] text-primary hover:text-primary/80">{`Show all ${shown.length} parts`}</button>
          </div>
        )}
      </Panel>

      <Disclosure title="What's shared and what stays private">
        <dl className="space-y-4 px-6 py-5 text-[14px]">
          <div><dt className="font-semibold">Shared with suppliers</dt>
            <dd className="mt-1 text-muted-foreground">Total volume per standard part, and a forecast built from members' BOMs and planned builds. Suppliers never see which companies make up the total.</dd></div>
          <div><dt className="font-semibold">Known only to us</dt>
            <dd className="mt-1 text-muted-foreground">Each member's own volume, needed to split orders and rebates.</dd></div>
          <div><dt className="font-semibold">Stays with you</dt>
            <dd className="mt-1 text-muted-foreground">Prices, custom parts and part numbers. The admission test runs in your private environment. Pooling is opt-in.</dd></div>
        </dl>
      </Disclosure>

      <Disclosure title="How these numbers are built">
        <p className="px-6 py-5 text-[14px] text-muted-foreground">
          Your figures are real AdventureWorks purchases per year over April 2022 to September 2025. Network figures are synthetic and seeded. Every price is per
          purchase unit (canister, container or case), because pieces per unit aren't in the data. Freight assumes one network delivery a month. Your current cost
          is the average price paid plus what rejected units add.
        </p>
      </Disclosure>

      <p className="text-[13px] text-muted-foreground">Nothing is saved. Joining is kept in this browser tab only.</p>
    </div>
  );
}

export default function Network() {
  const member = useJson<MemberPart[]>('network_member.json');
  const synthetic = useJson<NetworkPart[]>('network_synthetic.json');
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [joined, setJoined] = useState(false);
  const error = member.error ?? synthetic.error;
  if (error) return <StatusMessage kind="error">{`Could not load the network data: ${error.message}`}</StatusMessage>;
  if (!member.data || !synthetic.data) return <StatusMessage kind="loading">Loading the buying network…</StatusMessage>;
  const rows = networkRows(member.data, synthetic.data);
  const raw = params.get('result');
  const filter = FILTERS.find((f) => f === raw) ?? 'all';
  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <NetworkView rows={rows} filter={filter} highlightId={params.get('part')}
      onFilter={(f) => setParams((p) => { const n = new URLSearchParams(p); if (f === 'all') n.delete('result'); else n.set('result', f); return n; }, { replace: true })}
      expanded={expanded} onToggle={toggle} showAll={showAll} onShowAll={() => setShowAll(true)}
      joined={joined} onJoin={() => setJoined(true)} onUndo={() => setJoined(false)} />
  );
}
