import { it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The app was renamed from Spendline to Common Thread (SPEC_PITCH_DEMO.md section 3A).
const OLD = /Spendline/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx|css)$/.test(f) && !f.includes(' 2') && !p.endsWith('noOldName.test.ts') ? [p] : [];
  });
}

it('no "Spendline" remains in web/src or web/index.html', () => {
  const src = fileURLToPath(new URL('..', import.meta.url));
  const html = fileURLToPath(new URL('../../index.html', import.meta.url));
  const hits = [...files(src), html].flatMap((f) => readFileSync(f, 'utf8').split('\n')
    .map((line, i) => (OLD.test(line) ? `${f}:${i + 1}: ${line.trim().slice(0, 80)}` : null))
    .filter((x): x is string => x !== null));
  expect(hits).toEqual([]);
});
