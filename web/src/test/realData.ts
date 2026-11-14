import { readFileSync } from 'node:fs';

/** Test helper: read a pipeline output file from web/public/data. */
export function readData<T>(path: string): T {
  return JSON.parse(readFileSync(new URL('../../public/data/' + path, import.meta.url), 'utf8')) as T;
}
