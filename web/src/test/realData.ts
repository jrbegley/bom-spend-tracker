import { readFileSync } from 'node:fs';
import type { CoreData } from '../lib/data';

/** Test helper: read a pipeline output file from web/public/data. */
export function readData<T>(path: string): T {
  return JSON.parse(readFileSync(new URL('../../public/data/' + path, import.meta.url), 'utf8')) as T;
}

/** Test helper: the five core files, as DataProvider would load them. */
export function loadCore(): CoreData {
  return {
    summary: readData('summary.json'), products: readData('products.json'), vendors: readData('vendors.json'),
    parts: readData('parts.json'), opportunities: readData('opportunities.json'),
  };
}
