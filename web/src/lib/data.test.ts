import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJson, deriveJsonState, _resetCacheForTests, type Product, type Part, type BomNode, type Summary } from './data';
import { readData } from '../test/realData';
import { readdirSync } from 'node:fs';

describe('fetchJson', () => {
  beforeEach(() => _resetCacheForTests());
  it('fetches /data/<path> once and caches', async () => {
    const f = vi.fn(async () => new Response('{"a":1}')); vi.stubGlobal('fetch', f);
    expect(await fetchJson('x.json')).toEqual({ a: 1 });
    await fetchJson('x.json');
    expect(f).toHaveBeenCalledTimes(1); expect(f).toHaveBeenCalledWith('/data/x.json');
  });
  it('rejects on HTTP error and allows retry', async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(new Response('[]'));
    vi.stubGlobal('fetch', f);
    await expect(fetchJson('y.json')).rejects.toThrow('Failed to load y.json (404)');
    expect(await fetchJson('y.json')).toEqual([]);
  });
});

describe('pipeline output matches the TS contracts', () => {
  it('products', () => {
    const p = readData<Product[]>('products.json');
    expect(p).toHaveLength(97);
    expect(Object.keys(p[0]).sort()).toEqual(['costUnit','id','line','name','partCount','ppvTotal','ppvUnit','saveTotal','saveUnit','stdUnit','units','vsStd']);
    expect(typeof p[0].id).toBe('string');
  });
  it('parts and bom', () => {
    const parts = readData<Record<string, Part>>('parts.json');
    expect(Object.keys(parts)).toHaveLength(265);
    const b = readData<BomNode>('bom/969.json');
    expect(b.units).toBe(1116);
    for (const lp of b.leafParts) expect(parts[lp.partId]).toBeDefined();
  });
  it('one bom file per product', () => {
    const files = readdirSync(new URL('../../public/data/bom/', import.meta.url));
    expect(files).toHaveLength(readData<Summary>('summary.json').bikeCount);
  });
});

describe('deriveJsonState', () => {
  beforeEach(() => _resetCacheForTests());
  it('never returns the previous path\'s data', () => {
    expect(deriveJsonState('bom/970.json', { path: 'bom/969.json', data: { id: '969' } })).toEqual({ loading: true });
  });
  it('returns stored data and errors for the same path', () => {
    expect(deriveJsonState('a.json', { path: 'a.json', data: 1 })).toEqual({ data: 1, loading: false });
    const e = new Error('x'); expect(deriveJsonState('a.json', { path: 'a.json', error: e })).toEqual({ loading: false, error: e });
  });
  it('serves an already-fetched file immediately', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"970"}')));
    await fetchJson('bom/970.json');
    expect(deriveJsonState('bom/970.json', { path: 'bom/969.json', data: { id: '969' } })).toEqual({ data: { id: '970' }, loading: false });
  });
  it('null path is idle', () => expect(deriveJsonState(null, null)).toEqual({ loading: false }));
});
