import { it, expect } from 'vitest';
import { sortRows, nextSort, pageBounds } from './sort';

const rows = [{ n: 'b', v: 2, id: 1 }, { n: 'a', v: 5, id: 2 }, { n: 'c', v: 2, id: 3 }];
it('numeric desc / asc', () => {
  expect(sortRows(rows, r => r.v, 'desc').map(r => r.id)).toEqual([2, 1, 3]);
  expect(sortRows(rows, r => r.v, 'asc').map(r => r.id)).toEqual([1, 3, 2]);
});
it('ties keep input order in both directions (LL/ML Crankarm case)', () => {
  expect(sortRows(rows, r => r.v, 'desc').filter(r => r.v === 2).map(r => r.id)).toEqual([1, 3]);
  expect(sortRows(rows, r => r.v, 'asc').filter(r => r.v === 2).map(r => r.id)).toEqual([1, 3]);
});
it('strings use localeCompare', () => {
  expect(sortRows([{ n: "Anderson's" }, { n: 'acme' }, { n: 'Zeta' }], r => r.n, 'asc').map(r => r.n)).toEqual(['acme', "Anderson's", 'Zeta']);
});
it('does not mutate input', () => { const c = [...rows]; sortRows(rows, r => r.v, 'asc'); expect(rows).toEqual(c); });
it('nextSort', () => {
  expect(nextSort({ key: 'ppv', dir: 'desc' }, 'ppv', true)).toEqual({ key: 'ppv', dir: 'asc' });
  expect(nextSort({ key: 'ppv', dir: 'asc' }, 'ppv', true)).toEqual({ key: 'ppv', dir: 'desc' });
  expect(nextSort({ key: 'ppv', dir: 'asc' }, 'spend', true)).toEqual({ key: 'spend', dir: 'desc' });
  expect(nextSort({ key: 'ppv', dir: 'desc' }, 'name', false)).toEqual({ key: 'name', dir: 'asc' });
});
it('pageBounds clamps at both ends', () => {
  expect(pageBounds(86, 8, 1)).toEqual({ page: 1, pageCount: 11, start: 0, end: 8 });
  expect(pageBounds(86, 8, 0)).toEqual({ page: 1, pageCount: 11, start: 0, end: 8 });
  expect(pageBounds(86, 8, 11)).toEqual({ page: 11, pageCount: 11, start: 80, end: 86 });
  expect(pageBounds(86, 8, 12)).toEqual({ page: 11, pageCount: 11, start: 80, end: 86 });
  expect(pageBounds(0, 8, 1)).toEqual({ page: 1, pageCount: 0, start: 0, end: 0 });
});
