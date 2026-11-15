import { it, expect } from 'vitest';
import { renderToStaticMarkup as r } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { NetworkView, type ResultFilter } from './Network';
import { initialNetworkState, networkRows, networkSummary, type MemberPart, type NetworkPart } from '../lib/network';
import { money } from '../lib/format';
import { readData } from '../test/realData';

const rows = networkRows(readData<MemberPart[]>('network_member.json'), readData<NetworkPart[]>('network_synthetic.json'));
const summary = networkSummary(rows);
const view = (o: { filter?: ResultFilter; expanded?: string[]; showAll?: boolean; joined?: boolean } = {}) => r(
  <MemoryRouter>
    <NetworkView rows={rows} filter={o.filter ?? 'all'} onFilter={() => {}} expanded={new Set(o.expanded ?? [])} onToggle={() => {}}
      showAll={o.showAll ?? false} onShowAll={() => {}} joined={o.joined ?? false} onJoin={() => {}} onUndo={() => {}} />
  </MemoryRouter>);
const rowsOf = (h: string) => h.split('data-network-row=').slice(1);

it('header: title, Illustrative chip, meta line, and a Join button when not joined', () => {
  const h = view();
  expect(h).toMatch(/<h1[^>]*>Buying network<\/h1>/);
  expect(h).toMatch(/<span[^>]*>Illustrative<\/span>/);
  expect(h).toContain('Concept. Your volumes come from the sample data; network figures are synthetic.');
  expect(h).toMatch(/<button[^>]*>Join the pool<\/button>/);
  expect(h).not.toContain('Opted in');
});

it('three headline numbers from the data', () => {
  const h = view();
  expect(h).toContain(money(summary.eligibleSpend));
  expect(h).toContain('a year across 125 fasteners and bearings');
  expect(h).toContain(`${summary.volumeMultiple.toFixed(0)}× yours`);
  expect(h).toContain(money(summary.saving));
  expect(h).toContain(`on ${summary.joining} of 125 parts that pass the test`);
});

it('default list: top 10 by spend, Chainring Bolts first with its unit, and Show all', () => {
  const h = view();
  expect(rowsOf(h)).toHaveLength(10);
  const first = rowsOf(h)[0];
  expect(first).toContain('href="/parts/320"'); expect(first).toContain('Chainring Bolts');
  expect(first).toContain('per canister'); expect(first).toContain('Network buys');
  expect(first).toContain('Joins the pool, saves');
  expect(h).toContain('Show all 125 parts');
});

it('showAll renders every part and drops the Show all button', () => {
  const h = view({ showAll: true });
  expect(rowsOf(h)).toHaveLength(125); expect(h).not.toContain('Show all 125 parts');
});

it('Stays filter shows at least two failing rows, with the reason, and no joiners', () => {
  const h = view({ filter: 'stays' });
  expect(rowsOf(h).length).toBeGreaterThanOrEqual(2);
  expect(h).not.toContain('Joins the pool, saves');
  expect(h).toContain('Stays with current vendor');
  expect(h).toContain('Freight at your order size outweighs the pooled price');
  expect(h).not.toContain('Show all');
});

it('filter chips carry counts', () => {
  const h = view();
  expect(h).toMatch(/aria-pressed="true"[^>]*>All<span[^>]*>125</);
  expect(h).toContain(`Joins the pool<span`); expect(h).toContain('Stays with current vendor<span');
});

it('an expanded row shows the delivered-cost breakdown marked synthetic', () => {
  const h = view({ expanded: ['320'] });
  const cb = rowsOf(h)[0];
  for (const s of ['Pooled manufacturer price', 'Distributor fee', 'Freight at your order size', 'Network delivered cost',
    'Your current effective cost (price + rejects)', 'Lead time and minimum order', 'Rebate tiers', '(synthetic)']) expect(cb).toContain(s);
  expect(cb).toContain('aria-expanded="true"');
  expect(rowsOf(h)[1]).toContain('aria-expanded="false"'); expect(rowsOf(h)[1]).not.toContain('Pooled manufacturer price');
});

it('joined: opt-in message and Undo, no Join button', () => {
  const h = view({ joined: true });
  expect(h).toContain('Opted in. Pooled volumes are shared; your prices and part numbers stay private.');
  expect(h).toMatch(/<button[^>]*>Undo<\/button>/); expect(h).not.toMatch(/<button[^>]*>Join the pool<\/button>/);
});

it('promise line, privacy and method disclosures, and the not-saved footer', () => {
  const h = view();
  expect(h).toContain('Nobody pays more. A part moves into the pool only when it saves money.');
  expect(h).toContain("What&#x27;s shared and what stays private"); expect(h).toContain('How these numbers are built');
  expect(h).toContain('Nothing is saved. Joining is kept in this browser tab only.');
});

it('rows from a deep link highlight the requested part', () => {
  const h = r(<MemoryRouter><NetworkView rows={rows} filter="all" onFilter={() => {}} expanded={new Set()} onToggle={() => {}}
    showAll onShowAll={() => {}} joined={false} onJoin={() => {}} onUndo={() => {}} highlightId="321" /></MemoryRouter>);
  expect(rowsOf(h).filter((x) => x.includes('bg-primary-soft'))).toHaveLength(1);
});

it('minimum order of 1 reads "1 canister", not "1 canisters"', () => {
  const h = view({ expanded: ['320'] });
  expect(h).toContain('1 canister (yours:'); expect(h).not.toMatch(/\b1 canisters/);
});

const supplierHtml = (id?: string) => r(
  <MemoryRouter><NetworkView rows={rows} filter="all" onFilter={() => {}} expanded={new Set()} onToggle={() => {}} showAll={false} onShowAll={() => {}}
    joined={false} onJoin={() => {}} onUndo={() => {}} view="suppliers" onView={() => {}} supplierId={id} onSupplierId={() => {}} /></MemoryRouter>);

it('tabs: Your view and What suppliers see', () => {
  const h = view();
  expect(h).toMatch(/aria-pressed="true"[^>]*>Your view</); expect(h).toMatch(/aria-pressed="false"[^>]*>What suppliers see</);
});

it('supplier view: demand, four quarters, member count only, award rule and fee, no member prices', () => {
  const h = supplierHtml();
  const cb = rows.find((x) => x.member.id === '320')!;
  expect(h).toContain(`Demand from ${cb.network.memberCount} manufacturers`);
  expect(h).toContain(`Network yearly demand: ${Math.round(cb.network.networkYearlyQty).toLocaleString('en-US')} canisters`);
  for (const q of ['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026']) expect(h).toContain(q);
  expect(h).toContain('Awarded to the lowest delivered cost. Every supplier pays the same fee on volume won.');
  expect(h).toContain('Fee: 2% (illustrative)');
  expect(h).not.toMatch(/\$\d/); expect(h).not.toContain('Your pool-eligible spend');
});

it('supplier view part select lists only the on-BOM pool parts and honours the chosen part', () => {
  const h = supplierHtml('321');
  expect([...h.matchAll(/<option/g)]).toHaveLength(rows.filter((x) => x.member.onBom).length);
  const chosen = rows.find((x) => x.member.id === '321')!;
  expect(h).toContain(`Demand from ${chosen.network.memberCount} manufacturers`);
});

it('a deep link past the top 10 opens the full list with that row expanded and highlighted', () => {
  const target = rows[14].member.id;
  const init = initialNetworkState(rows, target);
  const h = r(<MemoryRouter><NetworkView rows={rows} filter={init.filter} onFilter={() => {}} expanded={init.expanded} onToggle={() => {}}
    showAll={init.showAll} onShowAll={() => {}} joined={false} onJoin={() => {}} onUndo={() => {}} highlightId={target} /></MemoryRouter>);
  const row = rowsOf(h).find((x) => x.startsWith(`"${target}"`))!;
  expect(row).toContain('Pooled manufacturer price'); expect(row).toContain('bg-primary-soft');
  expect(row).toContain('data-highlight'); // the page scrolls to this marker
  expect(h.match(/data-highlight/g)).toHaveLength(1);
  expect(h).not.toContain('Show all');
});
