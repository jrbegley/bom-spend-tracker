import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SortableTable, type Column } from './SortableTable';

type R = { id: string; name: string; ppv: number };
const rows: R[] = Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `V${String(i).padStart(2, '0')}`, ppv: i * 10 }));
const cols: Column<R>[] = [
  { key: 'name', label: 'Vendor', value: r => r.name },
  { key: 'ppv', label: 'PPV', numeric: true, value: r => r.ppv },
];
const html = (extra = {}) => renderToStaticMarkup(
  <SortableTable columns={cols} rows={rows} rowKey={r => r.id} defaultSort={{ key: 'ppv', dir: 'desc' }} caption="Test" {...extra} />);
const bodyRows = (h: string) => (h.split('<tbody>')[1].match(/<tr/g) ?? []).length;

it('headers are buttons in th[scope=col]; aria-sort only on the active column', () => {
  const h = html();
  expect(h.match(/<th scope="col"/g)).toHaveLength(2);
  expect(h.match(/aria-sort="descending"/g)).toHaveLength(1);
  expect(h).not.toContain('aria-sort="none"');
  expect(h).toMatch(/<button type="button"[^>]*>PPV<span aria-hidden="true"[^>]*>↓<\/span>/);
  expect(h).toMatch(/>Vendor<span aria-hidden="true"[^>]*>↕<\/span>/);
});
it('default sort is applied: first row is the largest PPV', () => {
  expect(html().split('<tbody>')[1].indexOf('V19')).toBeLessThan(html().split('<tbody>')[1].indexOf('V18'));
});
it('pages with a footer', () => {
  const h = html({ pageSize: 8, itemLabel: 'vendors' });
  expect(bodyRows(h)).toBe(8);
  expect(h).toContain('1 to 8 of 20 vendors');
  expect(h).toMatch(/<button[^>]*>Previous<\/button>/); expect(h).not.toMatch(/disabled/);
});
it('collapses to top N', () => {
  const h = html({ collapsedCount: 8, itemLabel: 'components' });
  expect(bodyRows(h)).toBe(8); expect(h).toContain('Show all 20 components');
});
it('rowClassName and numeric alignment', () => {
  const h = html({ rowClassName: (r: R) => (r.ppv > 180 ? 'bg-caution-soft' : '') });
  expect(h.match(/bg-caution-soft/g)).toHaveLength(1);
  expect(h).toMatch(/<td[^>]*text-right[^>]*>190<\/td>/);
});
it('scroll wrapper and caption', () => { const h = html(); expect(h).toContain('overflow-x-auto'); expect(h).toContain('<caption class="sr-only">Test</caption>'); });

it('renders headerExtra inside the header button', () => {
  const h = renderToStaticMarkup(<SortableTable columns={[cols[0], { ...cols[1], headerExtra: <i>X</i> }]} rows={rows}
    rowKey={r => r.id} defaultSort={{ key: 'ppv', dir: 'desc' }} caption="T" />);
  expect(h).toMatch(/>PPV<span aria-hidden="true"[^>]*>↓<\/span><i>X<\/i><\/button>/);
});
it('an empty row set renders one full-width "Nothing to show" row and no pager', () => {
  const h = html({ rows: [], pageSize: 8, itemLabel: 'vendors' });
  expect(bodyRows(h)).toBe(1);
  expect(h).toMatch(/<td colSpan="2"[^>]*>Nothing to show<\/td>/i);
  expect(h).not.toContain('Previous');
});

it('a highlighted row beyond the collapsed top N opens the table expanded', () => {
  const h = renderToStaticMarkup(<SortableTable columns={cols} rows={rows} rowKey={r => r.id} defaultSort={{ key: 'ppv', dir: 'desc' }}
    caption="T" collapsedCount={5} itemLabel="vendors" highlightKey="2" />);
  expect(h).toContain('Show top 5'); expect(h).toMatch(/data-highlight="true"/);
  const near = renderToStaticMarkup(<SortableTable columns={cols} rows={rows} rowKey={r => r.id} defaultSort={{ key: 'ppv', dir: 'desc' }}
    caption="T" collapsedCount={5} itemLabel="vendors" highlightKey="19" />);
  expect(near).toContain('Show all 20 vendors');
});
